// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R4 — CAMBIOS APARTADOS (`cambiosApartados.js`, y el cambio por elementos del horario).
//
// La lógica pura y, con el escritor de operaciones de R2 contra el doble de las funciones del servidor
// (`dobleProtegido.mjs`, el mismo del recorrido de Chromium), lo que hace la aplicación:
//   A · el cambio del horario por elementos dentro de la operación (`cambiosDelHorario`, el escritor)
//   B · describir una copia, el tamaño y el espacio (lógico, nunca «liberado»)
//   C · qué contiene una operación, dicho sin aplicar nada
//   D · recuperar sin pisar lo posterior: aplicable, ya hecha, choque, nunca una parte suelta
//   E · borrar una asignatura se repite sobre los datos de hoy
//   F · el flujo entero con dos aparatos: apartar, inspeccionar, recuperar por el escritor, y la copia se queda
//   G · la cuenta cambia entre la vista previa y el envío: no se pisa nada
//   H · copias antiguas, de otro tipo o ilegibles
//   I · nada se elimina solo, y eliminar baja el espacio lógico
//   J · cuándo se puede recuperar (lo que enseña el escritor) y por qué no se pudo leer
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-cambios-apartados.mjs
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import {
  describirCopia, tamanoLegible, fechaDeCopia, textoDelEspacio, resumenDeOperacion, tituloConContenido, prepararRecuperacion,
  clasificarCambios, estadoDeCopia, mismaRecuperacion, motivoDeLectura, motivoParaNoRecuperar, asignaturaQueBorra,
  TEXTOS_CAMBIOS_APARTADOS, ESTADOS_COPIA, MOTIVOS_NO_RECUPERABLE, MOTIVOS_APARTADA, TIPOS_COPIA, CLAVES_RECUPERACION,
} from '../src/lib/cambiosApartados.js';
import { cambiosDelHorario, crearOperacion, validarOperacion, igualJson } from '../src/lib/operacionesProtegidas.js';
import { crearEscritorDeOperaciones } from '../src/lib/escritorOperaciones.js';
import { normalizarEstudiosCargados, normalizarPapeleraCargada, prepararBorradoAsignatura } from '../src/lib/asignaturaProtegida.js';
import { normalizarHorarioTop } from '../src/lib/horario.js';
import { crearDobleProtegido } from './dobleProtegido.mjs';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const copia = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const dormir = (ms = 0) => new Promise((r) => setTimeout(r, ms));

const HORARIO = () => normalizarHorarioTop({
  horarios: [{ id: 'hh', nombre: 'Curso', activo: true, columnas: [{ id: 'c1', horarioId: 'hh', nombre: 'Lunes', dia: 1, posicion: 0, visible: true }], filas: [{ id: 'f1', horarioId: 'hh', inicio: '08:00', fin: '09:00', posicion: 0 }] }],
  actividades: [{ id: 'am', nombre: 'Matemáticas', asignaturaId: 'mat' }, { id: 'ah', nombre: 'Historia', asignaturaId: 'his' }],
  bloques: [
    { id: 'b1', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'am', inicio: '08:00', fin: '09:00', aula: 'A1' },
    { id: 'b2', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '09:00', fin: '10:00', aula: 'A2' },
    { id: 'b3', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '10:00', fin: '11:00', aula: 'A3' },
  ],
});
const ESTUDIOS = () => normalizarEstudiosCargados({
  programas: [{ id: 'p1', nombre: 'Bachillerato' }],
  asignaturas: [{ id: 'mat', nombre: 'Matemáticas', programaIds: ['p1'] }, { id: 'his', nombre: 'Historia', programaIds: ['p1'] }],
  examenes: [{ id: 'e1', asignaturaId: 'mat', fecha: '2026-12-01', tema: 'Derivadas' }],
  horas: [], temas: [], entregas: [], eventos: [], actividades: [],
});
const conTestigo = (h, revision = crypto.randomUUID(), aparato = 'x') => ({ ...h, version: 1, testigo: { formato: 1, revision, base: null, aparato } });
const cuenta = () => ({ horarioTop: conTestigo(HORARIO()), estudios: ESTUDIOS(), papelera: normalizarPapeleraCargada({}) });
const conBloque = (h, id, cambio) => ({ ...h, bloques: h.bloques.map((b) => (b.id === id ? { ...b, ...cambio } : b)) });
const AHORA = '2026-11-17T10:00:00.000Z';

/* El transporte del escritor sobre el doble, con un contador de cada llamada y con fallos a mano. */
function crearRed(doble) {
  const llamadas = { aplicar: 0, estado: 0, leer: 0, protocolo: 0, copiaEliminar: 0 };
  const enviadas = [];
  const antes = { aplicar: null };
  const r = async (nombre, fn) => { llamadas[nombre] += 1; const data = copia(fn()); await dormir(0); return { ok: true, data }; };
  return {
    llamadas, enviadas, antes,
    transporte: {
      protocolo: () => r('protocolo', () => doble.protocolo()),
      aplicar: async (op) => { enviadas.push(copia(op)); if (antes.aplicar) { const f = antes.aplicar; antes.aplicar = null; await f(); } return r('aplicar', () => doble.aplicar(copia(op))); },
      estado: (opId) => r('estado', () => doble.estado(opId)),
      leer: (claves) => r('leer', () => doble.leer(claves)),
      copiaEliminar: (id) => r('copiaEliminar', () => doble.copiaEliminar(id)),
    },
  };
}
function aparato(almacen, red, nombre) {
  const pantalla = { horario: copia(almacen.horarioTop) };
  const w = crearEscritorDeOperaciones({
    transporte: red.transporte, usuario: 'u1', aparato: nombre, versionApp: '3.163.0',
    inicial: { valor: copia(almacen.horarioTop), existe: true },
    alAdoptar: (v) => { pantalla.horario = copia(v); },
  });
  return { w, pantalla };
}
/* Lo que hace la pantalla para recuperar (App.jsx `recuperarCopiaApartada`): leer lo de ahora y preparar. */
const leerAhora = (doble) => doble.leer(CLAVES_RECUPERACION).claves;

seccion('A · El cambio del horario por elementos, dentro de la operación');
{
  const base = conTestigo(HORARIO(), 'r1');
  const nuevo = conTestigo(conBloque(HORARIO(), 'b1', { aula: 'Z9' }), 'r2');
  const cb = cambiosDelHorario(base, nuevo);
  ok(Array.isArray(cb) && cb.length === 1 && cb[0].camino[0] === 'bloques' && cb[0].reemplazar.length === 1 && cb[0].reemplazar[0].id === 'b1', 'una clase cambiada = UN reemplazo de ese elemento');
  ok(igualJson(cb[0].reemplazar[0].igual, base.bloques[0]) && cb[0].reemplazar[0].nuevo.aula === 'Z9', 'con la condición de lo que había (la base) y su valor nuevo');
  ok(!JSON.stringify(cb).includes('testigo') && !cb.some((x) => x.fijar && x.fijar.some((f) => f.campo === 'version')), 'sin las marcas del escritor (testigo, version)');
  const reordenado = conTestigo({ ...HORARIO(), bloques: [...HORARIO().bloques].reverse() }, 'r3');
  ok(cambiosDelHorario(base, reordenado).length === 0, 'el orden de una lista no viaja (no lleva condición: pisaría el de otro aparato)');
  ok(cambiosDelHorario(base, { ...HORARIO(), sinCampo: undefined }) !== null, 'sin cambios de contenido, una lista vacía');
  const sinCampo = { ...HORARIO() }; delete sinCampo.excepciones;
  ok(cambiosDelHorario(base, sinCampo) === null, 'un campo que desaparece no se dice por elementos: null (la copia no se podrá recuperar a medias)');
  ok(cambiosDelHorario(null, nuevo).length > 0, 'sin base, todo es un cambio (desde vacío)');
  const op = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: nuevo, cambios: cb } });
  ok(validarOperacion(op) === null && igualJson(op.horario.cambios, cb) && Object.isFrozen(op.horario.cambios), 'la operación lo lleva (congelado) y sigue siendo válida para el servidor');
  const sin = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: nuevo } });
  ok(!('cambios' in sin.horario), 'sin él, la operación es la de siempre');

  /* El escritor lo pone solo, respecto a SU base. */
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A');
  const r = await A.w.guardar(conBloque(A.pantalla.horario, 'b2', { aula: 'Q1' }));
  const enviada = red.enviadas[0];
  ok(r.ok && Array.isArray(enviada.horario.cambios) && enviada.horario.cambios[0].reemplazar[0].id === 'b2', 'el escritor manda el cambio por elementos respecto a lo que vio');
  ok(almacen.horarioTop.bloques.find((b) => b.id === 'b2').aula === 'Q1' && !('cambios' in almacen.horarioTop), 'el servidor aplica el valor y no guarda el cambio por elementos en el horario');

  /* Una base propia (recuperar): la revisión de esa base es la condición, y no se une a otra entrada. */
  const otra = conTestigo(conBloque(HORARIO(), 'b3', { aula: 'K' }), 'rev-otra');
  const p1 = A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'M1' }));
  const p2 = A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: conBloque(otra, 'b1', { aula: 'M2' }), base: { valor: otra, existe: true } });
  await Promise.all([p1, p2]);
  const ultima = red.enviadas[red.enviadas.length - 1];
  ok(ultima.tipo === 'recuperar_copia' && ultima.horario.base === 'rev-otra', 'con `base`, la condición es la revisión de esa base (no la del escritor)');
  ok(red.enviadas.filter((o) => o.tipo === 'editar_horario').length === 2, 'y la entrada con base propia no se une a la que esperaba (salen las dos)');
}

seccion('B · Describir una copia, el tamaño y el espacio');
{
  ok(tamanoLegible(0) === 'menos de 1 KB' && tamanoLegible(2048) === 'unos 2 KB' && tamanoLegible(1.5 * 1024 * 1024) === 'unos 1,5 MB', 'tamaños dichos para leer');
  ok(tamanoLegible(null) === null && tamanoLegible(-1) === null && tamanoLegible('x') === null && tamanoLegible('') === null, 'sin número válido, nada (null no es cero)');
  ok(fechaDeCopia('nada') === null && /^\d{1,2} [a-z]+ \d{4}, \d{2}:\d{2}$/.test(fechaDeCopia('2026-11-17T10:05:00.000Z')), 'la fecha en la hora del aparato');
  const fila = { id: 'c1', tipo: 'conflicto', aparato: 'A', creada_en: '2026-11-17T10:00:00Z', vista: false, tamano: 3000, meta: { tipoOperacion: 'borrar_asignatura', motivo: { motivo: 'revision' }, claves: ['estudios', 'papelera'], conHorario: true, creadaEn: '2026-11-17T09:59:00Z' } };
  const d = describirCopia(fila, { aparato: 'A' });
  ok(d.titulo === 'Borrar una asignatura' && d.tipoTexto === TIPOS_COPIA.conflicto && d.deEsteAparato && d.aparatoTexto === 'Este aparato', 'título, tipo y «este aparato»');
  ok(d.nueva === true && d.tamanoTexto === 'unos 3 KB' && d.motivoTexto === MOTIVOS_APARTADA.revision, 'nueva (sin ver), su tamaño y por qué se apartó');
  ok(describirCopia(fila, { aparato: 'B' }).aparatoTexto === 'Otro aparato' && describirCopia({ ...fila, vista: true }).nueva === false, 'de otro aparato, y vista');
  ok(describirCopia(null) === null && describirCopia({ tipo: 'conflicto' }) === null && describirCopia({ id: 'z', meta: 'roto' }).titulo === 'Un cambio apartado', 'datos rotos: nada o lo mínimo, nunca un fallo');
  const e = textoDelEspacio({ medida: 'logica', copias: { cuantas: 3, bytes: 12 * 1024 } });
  ok(e && /unos 12 KB de datos guardados \(3 copias\)/.test(e.linea), 'el espacio: lo que ocupan los datos guardados, con cuántas copias');
  ok(/no el espacio en disco/.test(e.explica) && /no baja al momento/.test(e.explica), '🚨 y dice que NO es espacio en disco y que el físico no baja al momento');
  ok(textoDelEspacio({ medida: 'logica', copias: { cuantas: 0, bytes: 0 } }).linea === 'Tus cambios apartados no ocupan nada en tus datos guardados.', 'sin copias, se dice');
  ok(textoDelEspacio(null) === null && textoDelEspacio({ copias: { cuantas: 1, bytes: 1 } }) === null && textoDelEspacio({ medida: 'logica', copias: { cuantas: 'x' } }) === null, 'sin medida lógica, nada (no se inventa una cifra)');
  const todos = JSON.stringify([TEXTOS_CAMBIOS_APARTADOS, ESTADOS_COPIA, MOTIVOS_NO_RECUPERABLE, MOTIVOS_APARTADA, e]);
  ok(!/liberad|liberar|libera\b|has liberado|espacio libre/i.test(todos), '🚨 ningún texto dice que se libere espacio (el tamaño lógico no es espacio físico liberado)');
  ok(/no ocupa espacio en tus datos/.test(ESTADOS_COPIA.eliminada.explica) && /reutiliza/.test(ESTADOS_COPIA.eliminada.explica), 'al eliminar: deja de ocupar en tus datos y la base reutiliza el hueco');
}

seccion('C · Qué contiene una operación, sin aplicar nada');
{
  const base = conTestigo(HORARIO(), 'r1');
  const nuevo = conTestigo({ ...conBloque(HORARIO(), 'b1', { aula: 'Z' }), bloques: [...conBloque(HORARIO(), 'b1', { aula: 'Z' }).bloques.filter((b) => b.id !== 'b2'), { id: 'b9', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'am', inicio: '12:00', fin: '13:00' }] }, 'r2');
  const op = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: nuevo, cambios: cambiosDelHorario(base, nuevo) } });
  const res = resumenDeOperacion(op);
  ok(res.length === 1 && res[0].nombre === 'Horario' && res[0].frases.join(', ') === '1 clase quitada, 1 clase añadida, 1 clase cambiada', `el horario dicho con palabras («${res[0] && res[0].frases.join(', ')}»)`);
  const plan = prepararBorradoAsignatura({ estudios: ESTUDIOS(), papelera: normalizarPapeleraCargada({}), horarioTop: HORARIO(), id: 'mat', ahoraISO: AHORA });
  const { calcularCambios } = await import('../src/lib/operacionesProtegidas.js');
  const opB = crearOperacion({ opId: crypto.randomUUID(), tipo: 'borrar_asignatura', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: conTestigo(plan.horario, 'r2'), cambios: cambiosDelHorario(base, plan.horario) }, claves: [{ clave: 'estudios', cambios: calcularCambios(ESTUDIOS(), plan.estudios).cambios }, { clave: 'papelera', cambios: calcularCambios(normalizarPapeleraCargada({}), plan.papelera).cambios }] });
  const rb = resumenDeOperacion(opB);
  ok(rb.map((x) => x.nombre).join() === 'Horario,Estudios,Eliminados recientes', 'clave a clave: Horario, Estudios y Eliminados recientes');
  ok(/1 asignatura quitada \(Matemáticas\)/.test(rb[1].frases.join(', ')) && /1 examen quitado\b/.test(rb[1].frases.join(', ')) && !/examen quitada/.test(rb[1].frases.join(', ')), 'con los nombres de lo que quita, y en su género («1 examen quitado»)');
  ok(tituloConContenido(opB) === 'Borrar la asignatura Matemáticas' && asignaturaQueBorra(opB).id === 'mat', 'el título con su contenido: «Borrar la asignatura Matemáticas»');
  const sinDetalle = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: nuevo } });
  ok(/no trae el detalle/.test(resumenDeOperacion(sinDetalle)[0].frases[0]), 'una copia sin detalle por elementos lo dice');
  ok(resumenDeOperacion(null).length === 0 && resumenDeOperacion({ claves: 'x' }).length === 0, 'una operación rota no se lee, sin fallar');
}

seccion('D · Recuperar sin pisar lo posterior');
{
  const base = conTestigo(HORARIO(), 'r1');
  const mio = conTestigo(conBloque(HORARIO(), 'b1', { aula: 'MIA' }), 'r-mio');
  const opMia = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: mio, cambios: cambiosDelHorario(base, mio) } });
  const fila = { id: opMia.opId, tipo: 'conflicto', contenido: copia(opMia) };
  /* Otro aparato cambió OTRA clase después. */
  const suyo = conTestigo(conBloque(HORARIO(), 'b2', { aula: 'SUYA' }), 'r-suyo', 'B');
  const actual = { horarioTop: { existe: true, valor: suyo }, estudios: { existe: true, valor: ESTUDIOS() }, papelera: { existe: true, valor: normalizarPapeleraCargada({}) } };
  const p = prepararRecuperacion({ fila, actual });
  ok(p.estado === 'recuperable' && p.horario.bloques.find((b) => b.id === 'b1').aula === 'MIA', 'otro aparato tocó OTRA cosa: se recupera lo tuyo');
  ok(p.horario.bloques.find((b) => b.id === 'b2').aula === 'SUYA', '🚨 y lo del otro aparato se conserva (no se pisa)');
  ok(p.claves.length === 0 && /Horario: 1 clase cambiada/.test(p.resumen[0]) && estadoDeCopia(p) === ESTADOS_COPIA.pendiente, 'dice qué cambiará, y el estado es «Pendiente»');
  ok(p.horario.testigo && p.horario.testigo.revision === 'r-suyo', '(lleva el testigo de lo de ahora: el escritor pondrá el suyo nuevo)');
  /* Ya está como en la copia. */
  const yaEsta = { ...actual, horarioTop: { existe: true, valor: conTestigo(conBloque(conBloque(HORARIO(), 'b1', { aula: 'MIA' }), 'b2', { aula: 'SUYA' }), 'r-z') } };
  const py = prepararRecuperacion({ fila, actual: yaEsta });
  ok(py.estado === 'ya_aplicada' && estadoDeCopia(py) === ESTADOS_COPIA.recuperada, 'todo ya está como en la copia: «Ya está en tu cuenta», nada que recuperar');
  /* El otro aparato cambió LA MISMA clase después. */
  const choca = { ...actual, horarioTop: { existe: true, valor: conTestigo(conBloque(HORARIO(), 'b1', { aula: 'OTRA' }), 'r-c') } };
  const pc = prepararRecuperacion({ fila, actual: choca });
  ok(pc.estado === 'no_recuperable' && pc.motivo === 'conflicto_posterior' && !pc.horario && /cambió después/.test(pc.detalle), '🚨 la misma clase cambió después: NO se recupera (y se dice cuál)');
  /* La clase se borró después. */
  const borrada = { ...actual, horarioTop: { existe: true, valor: conTestigo({ ...HORARIO(), bloques: HORARIO().bloques.filter((b) => b.id !== 'b1') }, 'r-b') } };
  const pb = prepararRecuperacion({ fila, actual: borrada });
  ok(pb.estado === 'no_recuperable' && /se borró después/.test(pb.detalle), 'se borró después: no se resucita (no se recupera)');
  /* Clasificar, pieza a pieza. */
  const piezas = clasificarCambios(conBloque(HORARIO(), 'b2', { aula: 'X' }), [
    { camino: ['bloques'], quitar: [{ id: 'b3', igual: HORARIO().bloques[2] }, { id: 'zz', igual: {} }], reemplazar: [{ id: 'b2', igual: HORARIO().bloques[1], nuevo: { ...HORARIO().bloques[1], aula: 'Y' } }], anadir: [{ elemento: { id: 'b1', x: 1 } }, { elemento: { id: 'b8' } }] },
    { camino: [], fijar: [{ campo: 'nombre', igual: null, valor: 'N' }] },
  ]);
  ok(piezas.map((x) => x.estado).join() === 'aplicable,hecha,choque,choque,aplicable,aplicable', `cada pieza: aplicable, hecha o choque (${piezas.map((x) => x.estado).join()})`);
  /* Nunca una parte suelta: el horario se podría, pero Estudios choca. */
  const opMixta = crearOperacion({ opId: crypto.randomUUID(), tipo: 'deshacer', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: mio, cambios: cambiosDelHorario(base, mio) }, claves: [{ clave: 'estudios', cambios: [{ camino: ['asignaturas'], reemplazar: [{ id: 'his', igual: { id: 'his', nombre: 'VIEJO' }, nuevo: { id: 'his', nombre: 'Nuevo' } }] }] }] });
  const pm = prepararRecuperacion({ fila: { id: 'm', tipo: 'conflicto', contenido: copia(opMixta) }, actual });
  ok(pm.estado === 'no_recuperable' && !pm.horario && !pm.claves, '🚨 nunca una parte suelta: si Estudios choca, tampoco se recupera el horario');
  /* Una operación con Estudios (Deshacer que vuelve a añadir algo). */
  const opDes = crearOperacion({ opId: crypto.randomUUID(), tipo: 'deshacer', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: base, cambios: [] }, claves: [{ clave: 'estudios', cambios: [{ camino: ['examenes'], anadir: [{ elemento: { id: 'e9', asignaturaId: 'his', fecha: '2026-12-09', tema: 'Edad Media' } }] }] }] });
  const pd = prepararRecuperacion({ fila: { id: 'd', tipo: 'conflicto', contenido: copia(opDes) }, actual });
  ok(pd.estado === 'recuperable' && pd.claves.length === 1 && pd.claves[0].despues.examenes.some((x) => x.id === 'e9') && pd.asunto === null, 'vuelve a añadir lo que faltaba en Estudios (con su condición: que no exista)');
  ok(igualJson(pd.claves[0].antes, actual.estudios.valor) && pd.claves[0].normalizar(1) === 1, 'calculada sobre lo GUARDADO, tal cual (la condición sale de ahí)');
  ok(mismaRecuperacion(pd, prepararRecuperacion({ fila: { id: 'd', tipo: 'conflicto', contenido: copia(opDes) }, actual })) && !mismaRecuperacion(pd, p) && !mismaRecuperacion(null, pd), 'mismaRecuperacion: la misma cuenta da la misma recuperación; otra, no');
}

seccion('E · Borrar una asignatura se repite sobre los datos de hoy');
{
  const almacen = cuenta();
  const plan = prepararBorradoAsignatura({ estudios: almacen.estudios, papelera: almacen.papelera, horarioTop: almacen.horarioTop, id: 'mat', ahoraISO: AHORA });
  const { calcularCambios } = await import('../src/lib/operacionesProtegidas.js');
  const op = crearOperacion({ opId: crypto.randomUUID(), tipo: 'borrar_asignatura', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: conTestigo(plan.horario, 'r2'), cambios: cambiosDelHorario(almacen.horarioTop, plan.horario) }, claves: [{ clave: 'estudios', cambios: calcularCambios(almacen.estudios, plan.estudios).cambios }, { clave: 'papelera', cambios: calcularCambios(almacen.papelera, plan.papelera).cambios }] });
  const fila = { id: op.opId, tipo: 'conflicto', contenido: copia(op) };
  /* Después, otro aparato le cambió el aula a Matemáticas y le añadió un examen. */
  const est = { ...almacen.estudios, asignaturas: almacen.estudios.asignaturas.map((a) => (a.id === 'mat' ? { ...a, aula: 'B2' } : a)), examenes: [...almacen.estudios.examenes, { id: 'e7', asignaturaId: 'mat', fecha: '2026-12-07', tema: 'Integrales' }] };
  const actual = { horarioTop: { existe: true, valor: almacen.horarioTop }, estudios: { existe: true, valor: est }, papelera: { existe: true, valor: almacen.papelera } };
  const p = prepararRecuperacion({ fila, actual, ahoraISO: AHORA });
  ok(p.estado === 'recuperable' && p.asunto.asignaturaId === 'mat' && p.asunto.accion === 'borrar', 'se repite el borrado (con su asunto para H-12)');
  ok(/tal como está ahora, con 2 exámenes/.test(p.resumen[0]) && /su clase del horario|sus \d+ clases/.test(p.resumen[1]) && /Eliminados recientes/.test(p.resumen[2]), `dice qué se borrará HOY, con lo de después («${p.resumen[0]}»)`);
  const entrada = p.claves.find((c) => c.clave === 'papelera').despues.elementos.find((e) => e.idOriginal === 'mat');
  ok(entrada && entrada.datos.aula === 'B2' && entrada.relacionados.find((r) => r.coleccion === 'examenes').elementos.length === 2, '🚨 lo de después NO se pierde: va a Eliminados recientes tal como está ahora');
  ok(!p.horario.bloques.some((b) => b.id === 'b1') && p.claves.every((c) => typeof c.normalizar === 'function'), 'y sus clases salen del horario');
  const sinElla = { ...actual, estudios: { existe: true, valor: { ...est, asignaturas: est.asignaturas.filter((a) => a.id !== 'mat') } }, horarioTop: { existe: true, valor: conTestigo(plan.horario, 'r3') } };
  ok(prepararRecuperacion({ fila, actual: sinElla }).estado === 'ya_aplicada', 'ya no está: no hay nada que recuperar');
  const soloClases = { ...actual, estudios: { existe: true, valor: { ...est, asignaturas: est.asignaturas.filter((a) => a.id !== 'mat') } } };
  ok(prepararRecuperacion({ fila, actual: soloClases }).estado === 'no_recuperable', 'sin la asignatura pero con sus clases en el horario: no se adivina');
}

seccion('F · El flujo entero con dos aparatos: apartar, inspeccionar, recuperar, y la copia se queda');
{
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A'); const B = aparato(almacen, red, 'B');
  ok((await B.w.guardar(conBloque(B.pantalla.horario, 'b2', { aula: 'DE-B' }))).ok, 'B cambia una clase (b2)');
  const rA = await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'DE-A' }));
  await A.w.esperar();
  ok(rA.conflicto && doble.S.copias.size === 1, 'A cambia otra (b1) sobre lo viejo: el servidor la aparta entera');
  ok(almacen.horarioTop.bloques.find((b) => b.id === 'b1').aula === 'A1', 'y no la aplica');
  const lista = doble.listarCopias();
  ok(lista.length === 1 && !('contenido' in lista[0]) && lista[0].tipo === 'conflicto' && lista[0].vista === false && lista[0].tamano > 0, 'la lista: sin el contenido, nueva, con su tamaño');
  const fila = doble.leerCopia(lista[0].id)[0];
  ok(fila.contenido.opId === lista[0].id && Array.isArray(fila.contenido.horario.cambios), 'al inspeccionarla, el contenido es la operación entera, con su cambio por elementos');
  ok(doble.copiaVista(fila.id).estado === 'vista' && doble.listarCopias()[0].vista === true, 'inspeccionarla la marca vista');
  /* Con el conflicto abierto no se recupera (el escritor no lo deja). */
  ok(motivoParaNoRecuperar({ escritor: A.w.vista(), soloLectura: false }) === TEXTOS_CAMBIOS_APARTADOS.recuperarConConflicto, 'con el conflicto abierto: primero el aviso');
  A.w.verLoDeAhora();
  ok(motivoParaNoRecuperar({ escritor: A.w.vista(), soloLectura: false }) === null, '«Ver lo que hay ahora»: ya se puede');
  const actual = leerAhora(doble);
  const prep = prepararRecuperacion({ fila, actual });
  ok(prep.estado === 'recuperable', 'se puede recuperar sin pisar a B');
  const ap0 = doble.S.aplicaciones;
  const r = await A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: prep.horario, claves: prep.claves, base: actual.horarioTop });
  ok(r.ok && doble.S.aplicaciones === ap0 + 1 && red.enviadas[red.enviadas.length - 1].tipo === 'recuperar_copia', 'se recupera como UNA operación nueva y protegida (recuperar_copia)');
  ok(almacen.horarioTop.bloques.find((b) => b.id === 'b1').aula === 'DE-A' && almacen.horarioTop.bloques.find((b) => b.id === 'b2').aula === 'DE-B', '🚨 en la cuenta: lo de A Y lo de B (nada pisado)');
  ok(doble.S.copias.size === 1, '🚨 la copia NO se borra sola al recuperarla');
  ok(prepararRecuperacion({ fila, actual: leerAhora(doble) }).estado === 'ya_aplicada', 'y ahora dice «Ya está en tu cuenta»');
  ok(red.llamadas.copiaEliminar === 0, 'en todo el flujo, ni una eliminación');
}

seccion('G · La cuenta cambia entre la vista previa y el envío: no se pisa nada');
{
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A'); const B = aparato(almacen, red, 'B');
  await B.w.guardar(conBloque(B.pantalla.horario, 'b2', { aula: 'B1' }));
  await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'A-1' })); await A.w.esperar();
  A.w.verLoDeAhora();
  const fila = doble.leerCopia(doble.listarCopias()[0].id)[0];
  const actual = leerAhora(doble);
  const prep = prepararRecuperacion({ fila, actual });
  /* Justo antes de que llegue, B cambia otra cosa: la revisión ya no es la leída. */
  red.antes.aplicar = async () => { await B.w.releer(); await B.w.guardar(conBloque(B.pantalla.horario, 'b3', { aula: 'B3' })); };
  const r = await A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: prep.horario, claves: prep.claves, base: actual.horarioTop });
  await A.w.esperar();
  ok(!r.ok && r.conflicto, 'el servidor no la aplica (la revisión cambió)');
  ok(almacen.horarioTop.bloques.find((b) => b.id === 'b3').aula === 'B3' && almacen.horarioTop.bloques.find((b) => b.id === 'b1').aula === 'A1', '🚨 lo de B se queda y lo de A NO se ha escrito encima');
  ok(doble.S.copias.size === 2 && doble.S.copias.has(fila.id), 'la recuperación también se aparta entera, y la copia original sigue ahí');
  /* La pantalla vuelve a preparar al confirmar: si no sale lo mismo que se revisó, no se manda. */
  const ahora = leerAhora(doble);
  ok(!mismaRecuperacion(prep, prepararRecuperacion({ fila, actual: ahora })), 'al confirmar, lo de ahora ya no es lo revisado (la pantalla lo vuelve a enseñar)');
}

seccion('H · Copias antiguas, de otro tipo o ilegibles');
{
  const base = conTestigo(HORARIO(), 'r1');
  const mio = conTestigo(conBloque(HORARIO(), 'b1', { aula: 'Z' }), 'r2');
  const vieja = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: mio } });
  const actualDistinto = { horarioTop: { existe: true, valor: conTestigo(conBloque(HORARIO(), 'b2', { aula: 'Q' }), 'r5') }, estudios: { existe: false }, papelera: { existe: false } };
  const pv = prepararRecuperacion({ fila: { id: 'v', tipo: 'conflicto', contenido: copia(vieja) }, actual: actualDistinto });
  ok(pv.estado === 'no_recuperable' && pv.motivo === 'sin_detalle' && pv.texto === MOTIVOS_NO_RECUPERABLE.sin_detalle, 'sin el detalle por elementos y con el horario cambiado: no se recupera (pisaría)');
  const pigual = prepararRecuperacion({ fila: { id: 'v', tipo: 'conflicto', contenido: copia(vieja) }, actual: { ...actualDistinto, horarioTop: { existe: true, valor: conTestigo(conBloque(HORARIO(), 'b1', { aula: 'Z' }), 'r9') } } });
  ok(pigual.estado === 'ya_aplicada', 'y si el horario ya es el de la copia, «Ya está en tu cuenta»');
  /* 🔁 R5 — esta comprobación decía que una copia de versión antigua era un tipo «desconocido»: desde R5 se sabe
     recuperar (por elementos), así que ahora mira las dos cosas que siguen valiendo: un tipo que esta versión no conoce
     se ve y se elimina, y una de versión antigua con un contenido que no es el suyo no se puede leer. */
  ok(prepararRecuperacion({ fila: { id: 'x', tipo: 'otro_tipo', contenido: copia(vieja) }, actual: actualDistinto }).motivo === 'tipo_desconocido', 'un tipo que esta versión no sabe recuperar: se ve y se elimina');
  ok(prepararRecuperacion({ fila: { id: 'x', tipo: 'version_antigua', contenido: copia(vieja) }, actual: actualDistinto }).motivo === 'ilegible', 'una de versión antigua con el contenido de una operación (no el suyo): «no se puede leer», nunca un fallo');
  ok(['ilegible', 'ilegible', 'ilegible', 'ilegible'].every((m, i) => prepararRecuperacion({ fila: [null, { tipo: 'conflicto' }, { tipo: 'conflicto', contenido: { formato: 9 } }, { tipo: 'conflicto', contenido: { formato: 1, horario: 'x' } }][i], actual: actualDistinto }).motivo === m), 'contenido ilegible: nunca un fallo, «no se puede leer»');
  ok(prepararRecuperacion({ fila: { id: 'y', tipo: 'conflicto', contenido: { formato: 1, tipo: 'editar_horario', claves: [{ clave: 'fitness', cambios: [] }] } }, actual: actualDistinto }).estado === 'no_recuperable', 'una clave que no es de esta operación: no se recupera');
  ok(estadoDeCopia(null) === ESTADOS_COPIA.sin_comprobar, 'sin poder leer lo de ahora: «Sin comprobar»');
  void base;
}

seccion('I · Nada se elimina solo, y eliminar baja el espacio lógico');
{
  const almacen = cuenta();
  const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
  const A = aparato(almacen, red, 'A'); const B = aparato(almacen, red, 'B');
  await B.w.guardar(conBloque(B.pantalla.horario, 'b2', { aula: 'x' }));
  await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'y' })); await A.w.esperar();
  A.w.verLoDeAhora();
  await A.w.guardar(conBloque(A.pantalla.horario, 'b3', { aula: 'z' })); await A.w.releer(); await A.w.esperar();
  ok(doble.S.copias.size === 1 && red.llamadas.copiaEliminar === 0, '«Ver lo que hay ahora», seguir editando y releer: la copia sigue (nada la borra)');
  const e1 = doble.espacio();
  ok(e1.medida === 'logica' && e1.copias.cuantas === 1 && e1.copias.bytes > 0, 'el espacio, con la forma de R1 (medida lógica)');
  const id = doble.listarCopias()[0].id;
  ok(doble.copiaEliminar(id).estado === 'eliminada' && doble.espacio().copias.bytes === 0 && doble.espacio().copias.cuantas === 0, 'eliminarla (a petición) baja el tamaño lógico al momento');
  ok(doble.copiaEliminar(id).estado === 'no_existe', 'y otra vez: ya no estaba');
}

seccion('J · Cuándo se puede recuperar, y por qué no se pudo leer');
{
  const libre = { estado: 'en_orden', enCola: 0, guardando: false, conflicto: null };
  ok(motivoParaNoRecuperar({ escritor: libre, soloLectura: false }) === null, 'el escritor en reposo: se puede');
  ok(motivoParaNoRecuperar({ escritor: libre, soloLectura: true }) === TEXTOS_CAMBIOS_APARTADOS.recuperarSoloLectura, 'Horarios en solo lectura: no');
  ok(motivoParaNoRecuperar({ escritor: { ...libre, enCola: 1 } }) === TEXTOS_CAMBIOS_APARTADOS.recuperarNoAhora && motivoParaNoRecuperar({ escritor: { ...libre, guardando: true } }) === TEXTOS_CAMBIOS_APARTADOS.recuperarNoAhora && motivoParaNoRecuperar({ escritor: { ...libre, estado: 'pendiente' } }) === TEXTOS_CAMBIOS_APARTADOS.recuperarNoAhora, 'algo tuyo esperando o guardándose: no (no se une a otro cambio)');
  ok(motivoParaNoRecuperar({ escritor: null }) === TEXTOS_CAMBIOS_APARTADOS.recuperarNoAhora, 'sin escritor: no');
  ok(motivoDeLectura({ ok: false, sinRespuesta: true }) === 'sinConexion' && motivoDeLectura({ ok: false, sesion: true }) === 'sesion' && motivoDeLectura({ ok: false, sinFunciones: true }) === 'sinFunciones' && motivoDeLectura({ ok: false, definitivo: true }) === 'error' && motivoDeLectura(null) === 'error', 'sin conexión, sesión caducada, sin las funciones o error: cada uno su texto');
  ok(motivoDeLectura({ ok: false, error: { message: 'x' }, status: 500 }) === 'error', 'un 500 al leer es un error (hubo respuesta), no «sin conexión»');
  ok(['sinConexion', 'sesion', 'sinFunciones', 'error', 'cargando', 'vacio'].every((k) => typeof TEXTOS_CAMBIOS_APARTADOS[k] === 'string' && TEXTOS_CAMBIOS_APARTADOS[k].length > 10), 'todos los estados de la pantalla tienen su frase');
  ok(!/próximamente|todavía no disponible|fase \d/i.test(JSON.stringify(TEXTOS_CAMBIOS_APARTADOS)), 'sin «próximamente» ni notas de desarrollo (reglas 8 y 9)');
}

seccion('L · Un horario guardado sin normalizar (por una versión anterior): el cambio se calcula por la puerta de carga');
{
  /* Lo guardado: sin los campos que pone la puerta de carga (como lo dejaría una versión anterior). */
  const crudo = { horarios: HORARIO().horarios, actividades: HORARIO().actividades, bloques: HORARIO().bloques.map(({ id, horarioId, columnaId, filaId, actividadId, inicio, fin, aula }) => ({ id, horarioId, columnaId, filaId, actividadId, inicio, fin, aula })), version: 1, testigo: { formato: 1, revision: 'rc', base: null, aparato: 's' } };
  ok(!igualJson(normalizarHorarioTop(crudo).bloques, crudo.bloques), '(lo guardado difiere de lo que enseña la pantalla en cada clase)');
  for (const conPuerta of [true, false]) {
    const almacen = { horarioTop: copia(crudo), estudios: ESTUDIOS(), papelera: normalizarPapeleraCargada({}) };
    const doble = crearDobleProtegido(almacen); const red = crearRed(doble);
    const nuevo = (nombre) => {
      const pantalla = { horario: normalizarHorarioTop(copia(almacen.horarioTop)) };
      const w = crearEscritorDeOperaciones({ transporte: red.transporte, usuario: 'u1', aparato: nombre, inicial: { valor: copia(almacen.horarioTop), existe: true }, alAdoptar: (v) => { pantalla.horario = normalizarHorarioTop(v); }, ...(conPuerta ? { normalizarHorario: normalizarHorarioTop } : {}) });
      return { w, pantalla };
    };
    const A = nuevo('A'); const B = nuevo('B');
    await B.w.guardar(conBloque(B.pantalla.horario, 'b2', { aula: 'DE-B' }));
    await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'DE-A' })); await A.w.esperar();
    const fila = doble.leerCopia(doble.listarCopias()[0].id)[0];
    const cb = fila.contenido.horario.cambios;
    const prep = prepararRecuperacion({ fila, actual: leerAhora(doble) });
    if (conPuerta) {
      ok(cb.length === 1 && cb[0].reemplazar.length === 1 && cb[0].reemplazar[0].id === 'b1', 'con la puerta de carga: la copia toca SOLO la clase que cambió él');
      ok(prep.estado === 'recuperable' && prep.horario.bloques.find((b) => b.id === 'b2').aula === 'DE-B', '🚨 y se recupera sin pisar lo de B');
    } else {
      ok(!(cb.length === 1 && cb[0].reemplazar && cb[0].reemplazar.length === 1) && prep.estado === 'no_recuperable', '(sin ella, la copia «tocaría» todas las clases y no se podría recuperar: lo que pasaba)');
    }
  }
}

seccion('M · Las clases marcadas como hechas son un conjunto: dos aparatos marcan clases distintas');
{
  const base = conTestigo({ ...HORARIO(), completadas: ['k0'] }, 'r1');
  const mio = conTestigo({ ...HORARIO(), completadas: ['k0', 'kA'] }, 'r2');
  const cb = cambiosDelHorario(base, mio);
  ok(cb.length === 1 && cb[0].camino[0] === 'completadas' && cb[0].conjunto.anadir.join() === 'kA' && cb[0].conjunto.quitar.length === 0 && !cb[0].fijar, 'la copia dice QUÉ se marcó (kA), no la lista entera');
  ok(resumenDeOperacion({ formato: 1, horario: { valor: mio, cambios: cb } })[0].frases.join() === '1 clase marcada como hecha', 'dicho: «1 clase marcada como hecha»');
  const op = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: mio, cambios: cb } });
  const fila = { id: op.opId, tipo: 'conflicto', contenido: copia(op) };
  const actual = (completadas) => ({ horarioTop: { existe: true, valor: conTestigo({ ...HORARIO(), completadas }, 'r9') }, estudios: { existe: false }, papelera: { existe: false } });
  const p = prepararRecuperacion({ fila, actual: actual(['k0', 'kB']) });
  ok(p.estado === 'recuperable' && p.horario.completadas.join() === 'k0,kB,kA', '🚨 B marcó otra (kB): se recupera la tuya y la de B se queda');
  ok(prepararRecuperacion({ fila, actual: actual(['kA']) }).estado === 'ya_aplicada', 'ya está marcada: nada que recuperar');
  const des = conTestigo({ ...HORARIO(), completadas: [] }, 'r3');
  const opd = crearOperacion({ opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, creadaEn: AHORA, horario: { base: 'r1', baseExiste: true, valor: des, cambios: cambiosDelHorario(base, des) } });
  const pd = prepararRecuperacion({ fila: { id: 'd', tipo: 'conflicto', contenido: copia(opd) }, actual: actual(['k0', 'kB']) });
  ok(pd.estado === 'recuperable' && pd.horario.completadas.join() === 'kB' && /1 clase desmarcada/.test(pd.resumen[0]), 'desmarcar: se quita la tuya y la de B se queda');
}

/* Que la suite pueda ponerse roja: una recuperación que aplicara el valor entero de la copia pisaría a B. */
seccion('K · La comprobación que protege a B se pondría roja con una recuperación a ciegas');
{
  const mio = conTestigo(conBloque(HORARIO(), 'b1', { aula: 'MIA' }), 'r-mio');
  const suyo = conTestigo(conBloque(HORARIO(), 'b2', { aula: 'SUYA' }), 'r-suyo');
  const aCiegas = { ...suyo, ...mio };
  ok(aCiegas.bloques.find((b) => b.id === 'b2').aula !== 'SUYA', 'aplicar la copia entera habría borrado lo de B (por eso se recupera por elementos)');
}

console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones de Cambios apartados (R4)`);
process.exit(fallos ? 1 : 0);
