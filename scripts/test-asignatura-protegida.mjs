// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R3 — LA INTEGRACIÓN: BORRAR UNA ASIGNATURA, DESHACER, H-12 Y H-13 (`asignaturaProtegida.js`).
//
// La lógica pura y, con el escritor de operaciones de R2 contra el doble de las funciones del servidor
// (`dobleProtegido.mjs`, el mismo que usa el recorrido de Chromium), lo que hace la aplicación:
//   A · preparar el borrado (con y sin clases) y H-13 (`asignaturaEnHorario`)
//   B · Deshacer como operación inversa (`invertirCambios`, `prepararDeshacerOperacion`)
//   C · H-12: qué se bloquea y qué no (`bloqueosDeEstudios`, `cambioTocaBloqueadas`)
//   D · el borrado completo en UNA operación: todo o nada (atomicidad) y Deshacer de vuelta
//   E · dos aparatos: C1–C6
//   F · respuestas perdidas, reintentos e idempotencia
//   G · lo que enseña el escritor para H-12 (pendiente, conflicto, y cuándo se suelta)
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-asignatura-protegida.mjs
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import {
  prepararBorradoAsignatura, asignaturaEnHorario, invertirCambios, prepararDeshacerOperacion, pasoDeOperacion,
  bloqueosDeEstudios, cambioTocaBloqueadas, normalizarEstudiosCargados, normalizarPapeleraCargada, COLECCIONES_DE_ASIGNATURA,
  TEXTOS_BLOQUEO_ESTUDIOS,
} from '../src/lib/asignaturaProtegida.js';
import { crearEscritorDeOperaciones } from '../src/lib/escritorOperaciones.js';
import { aplicarCambios, igualJson, calcularCambios } from '../src/lib/operacionesProtegidas.js';
import { normalizarHorarioTop } from '../src/lib/horario.js';
import { crearDobleProtegido } from './dobleProtegido.mjs';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const copia = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const dormir = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/* ── El escenario: dos asignaturas (Mates, con clases; Historia, sin), lo que cuelga de cada una y una papelera. ── */
const ESTUDIOS = () => normalizarEstudiosCargados({
  programas: [{ id: 'p1', nombre: 'Bachillerato' }],
  asignaturas: [
    { id: 'mat', nombre: 'Matemáticas', programaIds: ['p1'] },
    { id: 'his', nombre: 'Historia', programaIds: ['p1'] },
    { id: 'fis', nombre: 'Física', programaIds: ['p1'] },
  ],
  examenes: [{ id: 'e1', asignaturaId: 'mat', fecha: '2026-12-01', tema: 'Derivadas' }, { id: 'e2', asignaturaId: 'his', fecha: '2026-12-02', tema: 'Roma' }],
  horas: [{ id: 'h1', asignaturaId: 'mat', fecha: '2026-11-10', horas: 2 }],
  temas: [{ id: 't1', asignaturaId: 'mat', nombre: 'Límites' }],
  entregas: [{ id: 'g1', asignaturaId: 'mat', nombre: 'Ejercicios', fecha: '2026-11-20' }],
  eventos: [{ id: 'v1', asignaturaId: 'his', nombre: 'Salida', fecha: '2026-11-25' }],
  actividades: [],
});
const HORARIO = () => normalizarHorarioTop({
  horarios: [{ id: 'hh', nombre: 'Curso', activo: true, columnas: [{ id: 'c1', horarioId: 'hh', nombre: 'Lunes', dia: 1, posicion: 0, visible: true }], filas: [{ id: 'f1', horarioId: 'hh', inicio: '08:00', fin: '09:00', posicion: 0 }] }],
  actividades: [{ id: 'am', nombre: 'Matemáticas', asignaturaId: 'mat' }, { id: 'af', nombre: 'Física', asignaturaId: 'fis' }],
  bloques: [{ id: 'bm', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'am', inicio: '08:00', fin: '09:00' }, { id: 'bf', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'af', inicio: '09:00', fin: '10:00' }],
  excepciones: [{ id: 'x1', bloqueId: 'bm', fecha: '2026-11-17', tipo: 'cancelada' }],
});
const PAPELERA = () => normalizarPapeleraCargada({ elementos: [{ id: 'pp', modulo: 'fitness', coleccion: 'sesiones', idOriginal: 's1', datos: { id: 's1' } }] });
const conTestigo = (h, revision, aparato = 'yo') => ({ ...h, version: 1, testigo: { formato: 1, revision, base: null, aparato } });
const AHORA = '2026-11-16T12:00:00.000Z';

/* El transporte del escritor sobre el doble, con fallos: cada llamada consume el siguiente de su lista ('antes': no
   llega; 'despues': se aplica y se pierde la respuesta; o una promesa por la que esperar). */
function crearRed(doble) {
  const fallos = { aplicar: [], estado: [], leer: [], protocolo: [] };
  const llamadas = { aplicar: 0, estado: 0, leer: 0, protocolo: 0 };
  const enviadas = [];
  const red = async (nombre, fn) => {
    llamadas[nombre] += 1;
    const f = fallos[nombre].shift();
    if (f && typeof f.then === 'function') await f;
    if (f === 'antes') return { ok: false, sinRespuesta: true };
    const data = copia(fn());
    await dormir(0);
    if (f === 'despues') return { ok: false, sinRespuesta: true };
    return { ok: true, data };
  };
  return {
    fallos, llamadas, enviadas,
    transporte: {
      protocolo: () => red('protocolo', () => doble.protocolo()),
      aplicar: (op) => { enviadas.push(copia(op)); return red('aplicar', () => doble.aplicar(copia(op))); },
      estado: (opId) => red('estado', () => doble.estado(opId)),
      leer: (claves) => red('leer', () => doble.leer(claves)),
      copiaEliminar: (id) => red('estado', () => doble.copiaEliminar(id)),
    },
  };
}
/* Un aparato: su escritor, lo que ve su pantalla (que es lo que cargó) y lo que se le aplica. */
function aparato(almacen, red, nombre = 'yo') {
  const pantalla = { horario: copia(almacen.horarioTop), estudios: normalizarEstudiosCargados(copia(almacen.estudios)), papelera: normalizarPapeleraCargada(copia(almacen.papelera)) };
  const aplicadas = []; const adoptados = [];
  const w = crearEscritorDeOperaciones({
    transporte: red.transporte, usuario: 'u1', aparato: nombre, versionApp: '3.163.0',
    inicial: { valor: copia(almacen.horarioTop), existe: !!almacen.horarioTop },
    alAplicar: (op, info) => {
      aplicadas.push({ op, info });
      for (const c of op.claves || []) pantalla[c.clave] = aplicarCambios(pantalla[c.clave], c.cambios, c.clave, { sinCondiciones: true }).nuevo;
    },
    alAdoptar: (v) => { adoptados.push(v); pantalla.horario = copia(v); },
  });
  /* Lo que hace App.jsx (`deleteAsignatura` → `guardarOperacionProtegida`). */
  const borrar = (id) => {
    const plan = prepararBorradoAsignatura({ estudios: pantalla.estudios, papelera: pantalla.papelera, horarioTop: pantalla.horario, id, ahoraISO: AHORA });
    const paso = { estudios: pantalla.estudios, papelera: pantalla.papelera, horarioTop: pantalla.horario, operacion: { tipo: 'borrar_asignatura', asunto: plan.asunto, horarioAntes: pantalla.horario } };
    pantalla.horario = plan.horario;
    const p = w.guardarOperacion({
      tipo: 'borrar_asignatura', manual: true, horario: plan.horario, asunto: plan.asunto, contexto: { paso },
      claves: [
        { clave: 'estudios', antes: pantalla.estudios, despues: plan.estudios, normalizar: normalizarEstudiosCargados },
        { clave: 'papelera', antes: pantalla.papelera, despues: plan.papelera, normalizar: normalizarPapeleraCargada },
      ],
    });
    return { plan, p, paso };
  };
  /* Lo que hace App.jsx al aplicarse (`alAplicar`): el paso de Deshacer con los cambios que SE APLICARON. */
  const pasoDe = (registro) => ({ ...registro.info.contexto.paso, operacion: { ...registro.info.contexto.paso.operacion, claves: registro.op.claves.map((c) => ({ clave: c.clave, cambios: c.cambios })) } });
  /* Y Deshacer (`deshacerOperacion`). */
  const deshacer = (paso) => {
    const plan = prepararDeshacerOperacion(paso, { estudios: pantalla.estudios, papelera: pantalla.papelera });
    if (!plan.ok) return { plan, p: Promise.resolve({ ok: false, motivo: plan.motivo }) };
    pantalla.horario = plan.horario;
    return { plan, p: w.guardarOperacion({ tipo: 'deshacer', manual: true, horario: plan.horario, asunto: { ...paso.operacion.asunto, accion: 'restaurar' }, claves: plan.claves.map((c) => ({ ...c, normalizar: c.clave === 'estudios' ? normalizarEstudiosCargados : normalizarPapeleraCargada })) }) };
  };
  return { w, pantalla, aplicadas, adoptados, borrar, deshacer, pasoDe };
}
const cuenta = () => ({ horarioTop: conTestigo(HORARIO(), crypto.randomUUID()), estudios: ESTUDIOS(), papelera: PAPELERA() });
const ids = (l) => (l || []).map((x) => x.id).sort().join(',');
/* Lo de una colección como conjunto (el orden de una lista no se deshace: Deshacer devuelve al final). */
const mismoConjunto = (a, b) => igualJson([...(a || [])].sort((x, y) => String(x.id).localeCompare(String(y.id))), [...(b || [])].sort((x, y) => String(x.id).localeCompare(String(y.id))));

seccion('A · Preparar el borrado, y H-13');
{
  const est = ESTUDIOS(); const pap = PAPELERA(); const hor = HORARIO();
  const plan = prepararBorradoAsignatura({ estudios: est, papelera: pap, horarioTop: hor, id: 'mat', ahoraISO: AHORA });
  ok(plan && !plan.estudios.asignaturas.some((a) => a.id === 'mat'), 'quita la asignatura');
  ok(COLECCIONES_DE_ASIGNATURA.every((c) => !(plan.estudios[c] || []).some((x) => x.asignaturaId === 'mat')), 'y TODO lo que cuelga de ella (exámenes, horas, temas, entregas, eventos)');
  ok(plan.estudios.examenes.some((x) => x.id === 'e2') && plan.estudios.eventos.some((x) => x.id === 'v1'), 'sin tocar lo de las demás');
  ok(plan.papelera.elementos.length === 2 && plan.entrada.idOriginal === 'mat', 'una sola entrada nueva en la papelera, la suya');
  const rel = Object.fromEntries((plan.entrada.relacionados || []).map((r) => [r.coleccion, ids(r.elementos)]));
  ok(rel.examenes === 'e1' && rel.horas === 'h1' && rel.temas === 't1' && rel.entregas === 'g1' && !rel.eventos, 'que lleva dentro lo que cayó con ella (restaurarla lo devuelve entero)');
  ok(plan.enHorario && plan.bloques === 1, 'está en el horario, con una clase');
  ok(!plan.horario.actividades.some((a) => a.asignaturaId === 'mat') && !plan.horario.bloques.some((b) => b.id === 'bm') && !plan.horario.excepciones.some((x) => x.bloqueId === 'bm'), 'el horario sale sin su actividad, su clase ni su excepción');
  ok(plan.horario.bloques.some((b) => b.id === 'bf'), 'y con las clases de las demás');
  ok(plan.asunto.asignaturaId === 'mat' && plan.asunto.nombre === 'Matemáticas' && plan.asunto.accion === 'borrar', 'con su asunto (H-12)');
  ok(igualJson(est, ESTUDIOS()) && igualJson(pap, PAPELERA()) && igualJson(hor, HORARIO()), 'sin tocar nada de lo que recibe');
  const sin = prepararBorradoAsignatura({ estudios: est, papelera: pap, horarioTop: hor, id: 'his', ahoraISO: AHORA });
  ok(sin && !sin.enHorario && sin.horario === null, 'sin clases: no está en el horario y no lo toca (H-13: el borrado sigue igual)');
  ok(prepararBorradoAsignatura({ estudios: est, papelera: pap, horarioTop: hor, id: 'nada' }) === null, 'una que no existe: null');
  ok(asignaturaEnHorario(hor, 'fis').enHorario && asignaturaEnHorario(hor, 'fis').bloques === 1, 'asignaturaEnHorario: con clases');
  ok(!asignaturaEnHorario(hor, 'his').enHorario && !asignaturaEnHorario(null, 'mat').enHorario && !asignaturaEnHorario(hor, null).enHorario, 'sin clases, sin horario o sin id: no');
  const soloActividad = normalizarHorarioTop({ ...hor, bloques: hor.bloques.filter((b) => b.id !== 'bm'), excepciones: [] });
  ok(asignaturaEnHorario(soloActividad, 'mat').enHorario && asignaturaEnHorario(soloActividad, 'mat').bloques === 0, 'una actividad sin clases también está en el horario (borrarla dejaría una referencia rota)');
}

seccion('B · Deshacer como operación inversa');
{
  const est = ESTUDIOS(); const pap = PAPELERA();
  const despues = prepararBorradoAsignatura({ estudios: est, papelera: pap, horarioTop: HORARIO(), id: 'mat', ahoraISO: AHORA });
  const cE = calcularCambios(est, despues.estudios).cambios; const cP = calcularCambios(pap, despues.papelera).cambios;
  const iE = invertirCambios(cE); const iP = invertirCambios(cP);
  ok(iE.every((c) => !c.quitar && c.anadir) && iP.every((c) => c.quitar && !c.anadir), 'lo quitado se añade y lo añadido se quita');
  const vueltaE = aplicarCambios(despues.estudios, iE, 'estudios').nuevo;
  const vueltaP = aplicarCambios(despues.papelera, iP, 'papelera').nuevo;
  ok(['asignaturas', ...COLECCIONES_DE_ASIGNATURA].every((c) => mismoConjunto(vueltaE[c], est[c])), 'aplicar la inversa devuelve Estudios a lo que era (como conjunto)');
  ok(igualJson(vueltaP, pap), 'y la papelera, exacta');
  ok(igualJson(invertirCambios(invertirCambios(cE)), cE.map((c) => ({ camino: c.camino, ...(c.quitar ? { quitar: c.quitar } : {}) }))), 'la inversa de la inversa vuelve a quitar lo mismo');
  ok(invertirCambios([{ camino: [], fijar: [{ campo: 'x', valor: 1 }] }]) === null, 'un fijar sin condición no se invierte (no se sabe qué había)');
  const fijado = invertirCambios([{ camino: [], fijar: [{ campo: 'retencionDias', igual: 30, valor: 7 }] }]);
  ok(fijado[0].fijar[0].igual === 7 && fijado[0].fijar[0].valor === 30, 'un fijar con condición vuelve a su valor si sigue con el puesto');
  ok(invertirCambios([{ camino: ['l'], reemplazar: [{ id: 'a', igual: { id: 'a', v: 1 }, nuevo: { id: 'a', v: 2 } }] }])[0].reemplazar[0].nuevo.v === 1, 'un reemplazo vuelve a su valor anterior');
  ok(invertirCambios([{ camino: ['l'], orden: ['b', 'a'] }]).length === 0, 'el orden no se deshace (no lleva condición: pisaría el de otro aparato)');
  const paso = { operacion: { tipo: 'borrar_asignatura', asunto: despues.asunto, horarioAntes: HORARIO(), claves: [{ clave: 'estudios', cambios: cE }, { clave: 'papelera', cambios: cP }] } };
  ok(pasoDeOperacion(paso) && !pasoDeOperacion({ estudios: {} }) && !pasoDeOperacion(null), 'pasoDeOperacion distingue el paso de una operación');
  const plan = prepararDeshacerOperacion(paso, { estudios: despues.estudios, papelera: despues.papelera });
  ok(plan.ok && plan.claves.length === 2 && igualJson(plan.horario, HORARIO()), 'prepara las dos claves y el horario de antes');
  ok(plan.claves.find((c) => c.clave === 'estudios').despues.asignaturas.some((a) => a.id === 'mat'), 'con la asignatura de vuelta');
  /* Si en pantalla ya no está como lo dejó la operación (alguien la restauró), no se manda nada. */
  const restaurada = { ...despues.estudios, asignaturas: [...despues.estudios.asignaturas, est.asignaturas[0]] };
  ok(prepararDeshacerOperacion(paso, { estudios: restaurada, papelera: despues.papelera }).motivo === 'cambiado', '🚨 ya restaurada: «cambiado», no se manda nada');
  const sinEntrada = { ...despues.papelera, elementos: despues.papelera.elementos.filter((e) => e.idOriginal !== 'mat') };
  ok(prepararDeshacerOperacion(paso, { estudios: despues.estudios, papelera: sinEntrada }).motivo === 'cambiado', '🚨 la entrada ya no está (vaciada o restaurada): «cambiado»');
  ok(prepararDeshacerOperacion({ operacion: { claves: [] } }, {}).motivo === 'sin_datos', 'un paso incompleto: «sin_datos»');
}

seccion('C · H-12: qué se bloquea y qué no');
{
  const est = ESTUDIOS();
  const b = bloqueosDeEstudios([{ asignaturaId: 'mat', nombre: 'Matemáticas', accion: 'borrar', estado: 'pendiente' }]);
  ok(b.size === 1 && b.get('mat').motivo === 'pendiente' && b.get('mat').marca === TEXTOS_BLOQUEO_ESTUDIOS.borrar.pendiente, 'una operación pendiente bloquea su asignatura, con su marca');
  const b2 = bloqueosDeEstudios([{ asignaturaId: 'mat', accion: 'borrar', estado: 'pendiente' }, { asignaturaId: 'mat', accion: 'borrar', estado: 'conflicto' }, { asignaturaId: 'fis', accion: 'restaurar', estado: 'conflicto' }]);
  ok(b2.get('mat').motivo === 'conflicto' && b2.get('mat').marca === 'Borrado retenido por un conflicto en tu horario' && b2.get('fis').marca === TEXTOS_BLOQUEO_ESTUDIOS.restaurar.conflicto, 'un conflicto pesa más que un pendiente, y cada acción tiene su marca');
  ok(bloqueosDeEstudios(null).size === 0 && bloqueosDeEstudios([{ estado: 'pendiente' }]).size === 0, 'sin operaciones (o sin asignatura), nada bloqueado');
  const toca = (despues) => cambioTocaBloqueadas(est, despues, b);
  ok(toca({ ...est, asignaturas: est.asignaturas.map((a) => (a.id === 'mat' ? { ...a, nombre: 'Mates' } : a)) }) === 'mat', 'editar X: bloqueado');
  ok(toca({ ...est, asignaturas: est.asignaturas.map((a) => (a.id === 'mat' ? { ...a, oculta: true } : a)) }) === 'mat', 'ocultar X: bloqueado');
  ok(toca({ ...est, asignaturas: est.asignaturas.map((a) => (a.id === 'mat' ? { ...a, programaIds: [] } : a)) }) === 'mat', 'sacar X de un programa: bloqueado');
  ok(toca({ ...est, asignaturas: est.asignaturas.filter((a) => a.id !== 'mat') }) === 'mat', 'borrar X otra vez: bloqueado');
  ok(toca({ ...est, examenes: [...est.examenes, { id: 'e9', asignaturaId: 'mat', tema: 'nuevo' }] }) === 'mat', 'añadir un examen de X: bloqueado');
  ok(toca({ ...est, horas: [] }) === 'mat', 'borrar unas horas de X: bloqueado');
  ok(toca({ ...est, temas: est.temas.map((t) => ({ ...t, hecho: true })) }) === 'mat', 'marcar un tema de X: bloqueado');
  ok(toca({ ...est, entregas: est.entregas.map((t) => ({ ...t, asignaturaId: 'his' })) }) === 'mat', 'mover una entrega de X a otra: bloqueado');
  ok(toca({ ...est, examenes: est.examenes.map((x) => (x.id === 'e2' ? { ...x, tema: 'Grecia' } : x)) }) === null, 'editar un examen de OTRA asignatura: libre');
  ok(toca({ ...est, asignaturas: est.asignaturas.map((a) => (a.id === 'his' ? { ...a, nombre: 'Hª' } : a)) }) === null, 'editar otra asignatura: libre');
  ok(toca({ ...est, programas: [...est.programas, { id: 'p2', nombre: 'Música' }] }) === null, 'añadir un programa que no toca X: libre');
  ok(toca({ ...est, actividades: [{ id: 'ac', appId: 'p1', nombre: 'Leer' }] }) === null, 'una actividad de aprendizaje: libre');
  ok(cambioTocaBloqueadas(est, { ...est, horas: [] }, new Map()) === null, 'sin bloqueadas, nada se bloquea');
}

seccion('D · El borrado completo en UNA operación, y Deshacer');
{
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const a = aparato(almacen, red);
  const antes = copia(almacen);
  const { p, plan } = a.borrar('mat');
  const r = await p;
  ok(r.ok && red.llamadas.aplicar === 1 && doble.S.aplicaciones === 1, 'se guarda con UNA llamada y UNA aplicación');
  const op = red.enviadas[0];
  ok(op.tipo === 'borrar_asignatura' && op.manual === true && op.claves.map((c) => c.clave).sort().join() === 'estudios,papelera' && !!op.horario, 'una operación con el horario, Estudios y la papelera');
  ok(op.claves.every((c) => c.cambios.every((cb) => !cb.fijar || cb.fijar.every((f) => 'igual' in f))) && !JSON.stringify(op).includes('"asunto"') && !JSON.stringify(op).includes('"contexto"'), 'por elementos, sin reescribir una clave entera, y ni el asunto ni el contexto viajan al servidor');
  ok(!almacen.estudios.asignaturas.some((x) => x.id === 'mat') && COLECCIONES_DE_ASIGNATURA.every((c) => !(almacen.estudios[c] || []).some((x) => x.asignaturaId === 'mat')), 'en la cuenta: sin la asignatura ni nada suyo');
  ok(almacen.papelera.elementos.some((e) => e.idOriginal === 'mat' && e.relacionados) && almacen.papelera.elementos.some((e) => e.id === 'pp'), 'con su entrada en la papelera, y la que había se queda');
  ok(!almacen.horarioTop.bloques.some((b) => b.id === 'bm') && almacen.horarioTop.testigo.revision !== antes.horarioTop.testigo.revision, 'y el horario sin sus clases, con una revisión nueva');
  ok(almacen.estudios.asignaturas.some((x) => x.id === 'his') && almacen.estudios.examenes.some((x) => x.id === 'e2'), 'lo demás de Estudios, intacto');
  ok(a.aplicadas.length === 1 && !a.pantalla.estudios.asignaturas.some((x) => x.id === 'mat') && a.pantalla.papelera.elementos.length === 2, 'la pantalla recibe los cambios al aplicarse (alAplicar)');
  ok(a.aplicadas[0].info.asunto.asignaturaId === 'mat' && a.aplicadas[0].info.contexto.paso.operacion.tipo === 'borrar_asignatura', 'con su asunto y su contexto');
  /* Deshacer: la inversa. */
  const paso = a.pasoDe(a.aplicadas[0]);
  const d = a.deshacer(paso);
  const rd = await d.p;
  ok(d.plan.ok && rd.ok && doble.S.aplicaciones === 2, 'Deshacer es OTRA operación protegida, aplicada una vez');
  ok(red.enviadas[1].tipo === 'deshacer' && red.enviadas[1].horario.base === almacen.horarioTop.testigo.base, 'condicionada a la revisión que dejó el borrado');
  ok(['asignaturas', ...COLECCIONES_DE_ASIGNATURA].every((c) => mismoConjunto(almacen.estudios[c], antes.estudios[c])), '🚨 Estudios vuelve entero: la asignatura y todo lo suyo');
  ok(igualJson(almacen.papelera, antes.papelera), 'la papelera vuelve a como estaba (sin la entrada)');
  ok(almacen.horarioTop.bloques.some((b) => b.id === 'bm') && almacen.horarioTop.excepciones.some((x) => x.id === 'x1'), 'y el horario con su clase y su excepción');
  ok(!plan.estudios.asignaturas.some((x) => x.id === 'mat'), '(el plan del borrado no se tocó por el camino)');
}
{
  /* Atomicidad: una condición que falla (C2: otro aparato cambió X) → no se escribe NINGUNA clave. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const a = aparato(almacen, red);
  almacen.estudios = { ...almacen.estudios, asignaturas: almacen.estudios.asignaturas.map((x) => (x.id === 'mat' ? { ...x, aula: 'B2' } : x)) };
  const antes = copia(almacen);
  const r = await a.borrar('mat').p;
  ok(!r.ok && r.conflicto, 'C2 · otro aparato cambió X: conflicto');
  ok(igualJson(almacen.estudios, antes.estudios) && igualJson(almacen.papelera, antes.papelera) && igualJson(almacen.horarioTop, antes.horarioTop), '🚨 atomicidad: ni Estudios, ni la papelera, ni el horario cambian (todo o nada)');
  ok(doble.S.copias.size === 1 && [...doble.S.copias.values()][0].op.claves.length === 2 && [...doble.S.copias.values()][0].meta.motivo.motivo === 'elemento_distinto', 'la operación ENTERA queda apartada, con su motivo');
  ok(a.aplicadas.length === 0 && a.pantalla.estudios.asignaturas.some((x) => x.id === 'mat'), 'la pantalla de Estudios no cambia (nunca se aplicó)');
  ok(a.w.vista().conflicto && bloqueosDeEstudios(a.w.vista().asuntos).get('mat')?.motivo === 'conflicto', 'H-12: X queda retenida por el conflicto');
  a.w.verLoDeAhora();
  ok(bloqueosDeEstudios(a.w.vista().asuntos).size === 0 && doble.S.copias.size === 1, '«Ver lo que hay ahora» suelta el bloqueo y la copia se conserva');
}

{
  /* 🐛 Lo que destapó el nivel 3: con datos guardados por una versión anterior (sin los campos que añade la puerta de
     carga), Deshacer tiene que devolver EXACTAMENTE lo que estaba guardado, no su versión normalizada. */
  const almacen = cuenta();
  almacen.estudios = {
    programas: [{ id: 'p1', nombre: 'Bachillerato' }],
    asignaturas: [{ id: 'mat', nombre: 'Matemáticas', programaId: 'p1' }, { id: 'his', nombre: 'Historia' }],
    examenes: [{ id: 'e1', asignaturaId: 'mat', fecha: '2026-12-01', tema: 'Derivadas' }], horas: [], temas: [{ id: 't1', asignaturaId: 'mat', nombre: 'Límites' }],
  };
  const crudo = copia(almacen.estudios);
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const a = aparato(almacen, red);
  ok((await a.borrar('mat').p).ok, 'datos de una versión anterior: se borra');
  ok((await a.deshacer(a.pasoDe(a.aplicadas[0])).p).ok, '…y se deshace');
  ok(['asignaturas', 'examenes', 'temas'].every((c) => mismoConjunto(almacen.estudios[c], crudo[c])), '🚨 lo que vuelve es EXACTAMENTE lo que estaba guardado, sin los campos de la puerta de carga');
}

seccion('E · Dos aparatos: C1–C6');
{
  /* C1 · B cambia OTRA asignatura antes de que se aplique el borrado de A: se conserva lo de B. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A');
  almacen.estudios = { ...almacen.estudios, asignaturas: almacen.estudios.asignaturas.map((x) => (x.id === 'his' ? { ...x, aula: 'C3' } : x)) };
  const r = await A.borrar('mat').p;
  ok(r.ok && !almacen.estudios.asignaturas.some((x) => x.id === 'mat'), 'C1 · A borra X');
  ok(almacen.estudios.asignaturas.find((x) => x.id === 'his').aula === 'C3', '🚨 C1 · y el cambio de B en otra asignatura se conserva (no se reescribe la clave entera)');
}
{
  /* C2 · B cambia algo de X (un examen) antes: no se escribe nada, se aparta. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A');
  almacen.estudios = { ...almacen.estudios, examenes: almacen.estudios.examenes.map((x) => (x.id === 'e1' ? { ...x, nota: 9 } : x)) };
  const r = await A.borrar('mat').p;
  ok(!r.ok && r.conflicto && almacen.estudios.examenes.find((x) => x.id === 'e1').nota === 9 && almacen.estudios.asignaturas.some((x) => x.id === 'mat'), 'C2 · B cambió un examen de X: no se borra nada y lo de B sigue');
}
{
  /* C3 · B borra X antes, con su propia operación: la de A falla la revisión del horario. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen);
  const redA = crearRed(doble); const redB = crearRed(doble);
  const A = aparato(almacen, redA, 'A'); const B = aparato(almacen, redB, 'B');
  ok((await B.borrar('mat').p).ok, 'C3 · B borra X');
  const despuesB = copia(almacen);
  const r = await A.borrar('mat').p;
  ok(!r.ok && r.conflicto && redA.enviadas[0].horario.base !== almacen.horarioTop.testigo.revision, 'C3 · la de A choca con la revisión que dejó B');
  ok(igualJson(almacen, despuesB) && almacen.papelera.elementos.filter((e) => e.idOriginal === 'mat').length === 1, '🚨 C3 · X no vuelve y no hay dos entradas en la papelera');
}
{
  /* C4 · B añade algo a la papelera a la vez (sin horario: con saveData de su módulo). */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A');
  almacen.papelera = { ...almacen.papelera, elementos: [...almacen.papelera.elementos, { id: 'pB', modulo: 'salud', coleccion: 'medidas', idOriginal: 'm1', datos: { id: 'm1' } }] };
  const r = await A.borrar('mat').p;
  ok(r.ok && almacen.papelera.elementos.some((e) => e.id === 'pB') && almacen.papelera.elementos.some((e) => e.idOriginal === 'mat'), 'C4 · lo que B añadió a la papelera se queda, junto a la entrada de A');
}
{
  /* C5 · mientras A resuelve su conflicto, B cambia lo que sea: A no ha escrito nada, y al ver lo de ahora tampoco. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen);
  const redA = crearRed(doble); const redB = crearRed(doble);
  const A = aparato(almacen, redA, 'A'); const B = aparato(almacen, redB, 'B');
  const hB = { ...B.pantalla.horario, notaB: 1 };
  ok((await B.w.guardar(hB)).ok, 'C5 · B cambia el horario');
  ok((await A.borrar('mat').p).conflicto, 'C5 · el borrado de A choca y queda en conflicto');
  const hB2 = { ...normalizarHorarioTop(almacen.horarioTop), notaB: 2 };
  ok((await B.w.guardar(hB2)).ok, 'C5 · mientras A no elige, B sigue cambiando');
  const cuentaAhora = copia(almacen);
  A.w.verLoDeAhora();
  await A.w.esperar();
  ok(igualJson(almacen, cuentaAhora) && almacen.estudios.asignaturas.some((x) => x.id === 'mat'), 'C5 · A no escribe nada: X sigue y lo de B también');
  ok(doble.S.copias.size === 1 && bloqueosDeEstudios(A.w.vista().asuntos).size === 0, 'C5 · su copia queda apartada y Estudios se libera');
}
{
  /* C6 · dos operaciones del horario a la vez (dos aparatos sobre la misma revisión): una entra, la otra se aparta. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen);
  const redA = crearRed(doble); const redB = crearRed(doble);
  const A = aparato(almacen, redA, 'A'); const B = aparato(almacen, redB, 'B');
  const [ra, rb] = await Promise.all([A.borrar('mat').p, B.borrar('fis').p]);
  ok([ra, rb].filter((r) => r.ok).length === 1 && [ra, rb].filter((r) => r.conflicto).length === 1, 'C6 · una entra y la otra choca con la revisión');
  ok(doble.S.aplicaciones === 1 && doble.S.copias.size === 1, 'C6 · una sola aplicación y una sola copia');
  const borrada = ra.ok ? 'mat' : 'fis'; const viva = ra.ok ? 'fis' : 'mat';
  ok(!almacen.estudios.asignaturas.some((x) => x.id === borrada) && almacen.estudios.asignaturas.some((x) => x.id === viva) && almacen.horarioTop.actividades.some((x) => x.asignaturaId === viva), 'C6 · la cuenta es la de la que entró, entera');
}
{
  /* Y una operación de A, en el MISMO aparato, va de una en una: borrar dos asignaturas seguidas no choca consigo mismo. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A');
  const b1 = A.borrar('mat');
  const b2plan = prepararBorradoAsignatura({ estudios: A.pantalla.estudios, papelera: A.pantalla.papelera, horarioTop: A.pantalla.horario, id: 'fis', ahoraISO: AHORA });
  A.pantalla.horario = b2plan.horario;
  const p2 = A.w.guardarOperacion({ tipo: 'borrar_asignatura', manual: true, horario: b2plan.horario, asunto: b2plan.asunto, claves: [{ clave: 'estudios', antes: A.pantalla.estudios, despues: b2plan.estudios, normalizar: normalizarEstudiosCargados }, { clave: 'papelera', antes: A.pantalla.papelera, despues: b2plan.papelera, normalizar: normalizarPapeleraCargada }] });
  const [r1, r2] = await Promise.all([b1.p, p2]);
  ok(r1.ok && r2.ok && doble.S.aplicaciones === 2, 'dos borrados seguidos en un aparato: los dos, en orden, sin chocar entre sí');
  ok(!almacen.estudios.asignaturas.some((x) => x.id === 'mat' || x.id === 'fis') && almacen.papelera.elementos.filter((e) => e.idOriginal === 'mat' || e.idOriginal === 'fis').length === 2, '…cada uno con su entrada');
}

seccion('F · Respuestas perdidas, reintentos e idempotencia');
{
  /* Se aplica y se pierde la respuesta: se pregunta y se adopta, sin aplicar dos veces. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red);
  red.fallos.aplicar.push('despues');
  const r = await A.borrar('mat').p;
  ok(r.ok && doble.S.aplicaciones === 1 && red.llamadas.estado >= 1, 'respuesta perdida tras aplicar: se pregunta el estado y es «aplicada» (una sola aplicación)');
  ok(A.aplicadas.length === 1 && !A.pantalla.estudios.asignaturas.some((x) => x.id === 'mat'), '…y la pantalla lo recibe igual');
}
{
  /* No llega: se pregunta, «desconocida», y se reenvía LA MISMA. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red);
  red.fallos.aplicar.push('antes');
  const r = await A.borrar('mat').p;
  ok(r.ok && doble.S.aplicaciones === 1 && red.enviadas.length === 2 && red.enviadas[0].opId === red.enviadas[1].opId && igualJson(red.enviadas[0], red.enviadas[1]), 'no llegó: se reenvía la MISMA operación (mismo opId y contenido) y se aplica una vez');
}
{
  /* Sin conexión del todo: queda pendiente, el bloqueo se mantiene; al volver, reintentar la aplica una vez. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red);
  red.fallos.aplicar.push('antes', 'antes'); red.fallos.estado.push('antes');
  const r = await A.borrar('mat').p;
  ok(!r.ok && r.pendiente && doble.S.aplicaciones === 0, 'sin conexión: pendiente, nada aplicado');
  ok(bloqueosDeEstudios(A.w.vista().asuntos).get('mat')?.motivo === 'pendiente', 'H-12: X sigue marcada «pendiente de guardar»');
  await A.w.reintentar(); await A.w.esperar();
  ok(doble.S.aplicaciones === 1 && !almacen.estudios.asignaturas.some((x) => x.id === 'mat') && bloqueosDeEstudios(A.w.vista().asuntos).size === 0, 'al volver la conexión se aplica una vez y el bloqueo se suelta');
  ok(new Set(red.enviadas.map((o) => o.opId)).size === 1, 'siempre con el mismo opId');
  /* El servidor reconoce un reenvío de algo ya aplicado. */
  const repetida = doble.aplicar(red.enviadas[0]);
  ok(repetida.estado === 'aplicada' && repetida.registrada && doble.S.aplicaciones === 1, 'reenviarla otra vez: «aplicada» por el registro, sin volver a escribir');
}
{
  /* Deshacer con una respuesta perdida, y Deshacer cuando otro aparato cambió lo que hay que devolver. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red);
  await A.borrar('mat').p;
  red.fallos.aplicar.push('despues');
  const rd = await A.deshacer(A.pasoDe(A.aplicadas[0])).p;
  ok(rd.ok && doble.S.aplicaciones === 2 && almacen.estudios.asignaturas.some((x) => x.id === 'mat'), 'Deshacer con la respuesta perdida: se aplica una vez');
}
{
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen);
  const redA = crearRed(doble); const redB = crearRed(doble);
  const A = aparato(almacen, redA, 'A');
  await A.borrar('mat').p;
  const paso = A.pasoDe(A.aplicadas[0]);
  /* B (que ve lo de ahora) restaura la entrada de la papelera por su cuenta: la entrada ya no está, X vuelve. */
  const B = aparato(almacen, redB, 'B');
  const entrada = B.pantalla.papelera.elementos.find((e) => e.idOriginal === 'mat');
  almacen.papelera = { ...almacen.papelera, elementos: almacen.papelera.elementos.filter((e) => e.id !== entrada.id) };
  almacen.estudios = { ...almacen.estudios, asignaturas: [...almacen.estudios.asignaturas, entrada.datos] };
  const antes = copia(almacen);
  /* A todavía ve su pantalla de después del borrado: Deshacer se manda y el SERVIDOR lo aparta (X ya existe). */
  const rd = await A.deshacer(paso).p;
  ok(!rd.ok && rd.conflicto && igualJson(almacen, antes), '🚨 Deshacer cuando otro aparato ya lo restauró: conflicto, no se escribe nada ni se duplica');
}

seccion('G · Lo que enseña el escritor para H-12');
{
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red);
  let abrir; red.fallos.aplicar.push(new Promise((r) => { abrir = r; }));
  const { p } = A.borrar('mat');
  await dormir(5);
  ok(bloqueosDeEstudios(A.w.vista().asuntos).get('mat')?.motivo === 'pendiente', 'mientras vuela: pendiente');
  ok(!A.w.vista().asuntos.some((x) => x.asignaturaId === 'his'), 'solo la suya');
  abrir();
  await p;
  ok(A.w.vista().asuntos.length === 0, 'al aplicarse, desaparece (sin estado propio)');
  /* Una operación sin asunto (un cambio del horario) no bloquea Estudios. */
  red.fallos.aplicar.push('antes', 'antes'); red.fallos.estado.push('antes');
  await A.w.guardar({ ...A.pantalla.horario, nota: 1 });
  ok(A.w.vista().pendiente && A.w.vista().asuntos.length === 0, 'un cambio solo del horario, pendiente, no bloquea Estudios');
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${n - fallos}/${n} comprobaciones de la integración de R3 (asignatura protegida)`);
if (fallos) process.exit(1);
