// ═══════════════════════════════════════════════════════════════════════════
// 🛟 HORARIOS · E1-R · R5 — LA RED DE RESCATE Y LAS ESCRITURAS DE VERSIONES ANTIGUAS, EN EL CLIENTE.
//
// Lo que hace la aplicación con las copias de rescate (H-22) y de versión antigua (H-23): describirlas, decir qué
// contienen, recuperarlas ELEMENTO A ELEMENTO sin pisar lo posterior y avisar de lo que no se aplicó. Con el escritor
// de operaciones de R2 contra el doble de las funciones del servidor (`dobleProtegido.mjs`, que imita también las
// reglas de R5 con las del SQL), y el SQL preparado comprobado por su forma (su comportamiento de verdad lo prueba
// `test-rescate-postgrest.mjs` contra Postgres):
//   A · el SQL preparado: P1 y P4 separados, sin ejecutar, con su vuelta atrás que no borra copias
//   B · describir una copia de rescate o de versión antigua
//   C · qué contiene, dicho sin aplicar nada
//   D · recuperar por elementos una de rescate: elegir, lo que cambió después no se puede elegir, nada se pisa
//   E · recuperar por elementos una de versión antigua (también sin horario en la cuenta)
//   F · las de Estudios y Eliminados recientes se ven y se eliminan, no se recuperan desde aquí
//   G · el flujo entero con el escritor: una versión antigua pisa (rescate) o intenta (apartada), y se recupera
//   H · la cuenta cambia entre la vista previa y el envío: no se manda
//   I · reintentos y duplicados: una escritura repetida no repite la copia; recuperar dos veces no hace nada más
//   J · el aviso de lo que no se aplicó
//   K · nada se elimina solo
//   L · la comprobación que protege lo posterior se pondría roja con una recuperación entera
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-rescate-versiones.mjs
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  describirCopia, resumenDeCopia, prepararRecuperacion, estadoDeCopia, mismaRecuperacion, avisoDeVersionesAntiguas,
  esCopiaCompleta, cambiosDeCopiaCompleta, lecturaDeCopiaCompleta, textoDePieza, tituloDeCopiaCompleta,
  TEXTOS_CAMBIOS_APARTADOS as T, ESTADOS_COPIA, MOTIVOS_NO_RECUPERABLE, MOTIVOS_COPIA_COMPLETA, TIPOS_COPIA, CLAVES_RECUPERACION,
} from '../src/lib/cambiosApartados.js';
import { crearEscritorDeOperaciones } from '../src/lib/escritorOperaciones.js';
import { normalizarEstudiosCargados, normalizarPapeleraCargada } from '../src/lib/asignaturaProtegida.js';
import { normalizarHorarioTop } from '../src/lib/horario.js';
import { crearDobleProtegido } from './dobleProtegido.mjs';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const copia = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const dormir = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const leerArchivo = (r) => readFileSync(join(RAIZ, r), 'utf8');
const sinComentariosSql = (t) => t.split('\n').map((l) => l.replace(/--.*$/, '')).join('\n');

const HORARIO = () => normalizarHorarioTop({
  horarios: [{ id: 'hh', nombre: 'Curso', activo: true, columnas: [{ id: 'c1', horarioId: 'hh', nombre: 'Lunes', dia: 1, posicion: 0, visible: true }], filas: [{ id: 'f1', horarioId: 'hh', inicio: '08:00', fin: '09:00', posicion: 0 }] }],
  actividades: [{ id: 'am', nombre: 'Matemáticas', asignaturaId: 'mat' }, { id: 'ah', nombre: 'Historia', asignaturaId: 'his' }, { id: 'af', nombre: 'Física' }],
  bloques: [
    { id: 'b1', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'am', inicio: '08:00', fin: '09:00', aula: 'A1' },
    { id: 'b2', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '09:00', fin: '10:00', aula: 'A2' },
    { id: 'b3', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '10:00', fin: '11:00', aula: 'A3' },
  ],
  completadas: ['2026-11-16|b1'],
});
const conTestigo = (h, revision = crypto.randomUUID(), aparato = 'x') => ({ ...h, version: 1, testigo: { formato: 1, revision, base: null, aparato } });
const conBloque = (h, id, cambio) => ({ ...h, bloques: h.bloques.map((b) => (b.id === id ? { ...b, ...cambio } : b)) });
const sinBloque = (h, id) => ({ ...h, bloques: h.bloques.filter((b) => b.id !== id) });
const conBloqueNuevo = (h, b) => ({ ...h, bloques: [...h.bloques, b] });
const FISICA = { id: 'b4', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'af', inicio: '11:00', fin: '12:00', aula: 'L1' };
const leida = (v) => ({ horarioTop: { existe: v !== null, valor: v }, estudios: { existe: false, valor: null }, papelera: { existe: false, valor: null } });
const rescate = (antes, despues, extra = {}) => ({ id: crypto.randomUUID(), tipo: 'rescate', vista: false, aparato: 'viejo', creada_en: '2026-11-17T09:00:00.000Z', meta: { clave: extra.clave || 'horarioTop', accion: despues === null ? 'borrado' : 'escritura', creadaEn: '2026-11-17T09:00:00.000Z' }, tamano: 1200, contenido: { formato: 1, clave: extra.clave || 'horarioTop', antes, despues } });
const versionAntigua = (intentado, vigente) => ({ id: crypto.randomUUID(), tipo: 'version_antigua', vista: false, aparato: 'viejo', creada_en: '2026-11-17T09:30:00.000Z', meta: { clave: 'horarioTop', accion: 'escritura', creadaEn: '2026-11-17T09:30:00.000Z' }, tamano: 900, contenido: { formato: 1, clave: 'horarioTop', intentado, vigente, existia: vigente !== null } });
const piezaCon = (prep, texto) => (prep.piezas || []).find((p) => p.texto.includes(texto));

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('A · El SQL preparado: P1 (rescate) y P4 (versiones antiguas), sin ejecutar, con su vuelta atrás');
{
  const resc = leerArchivo('supabase/horarios-rescate.sql');
  const vant = leerArchivo('supabase/horarios-versiones-antiguas.sql');
  const rescD = leerArchivo('supabase/horarios-rescate-deshacer.sql');
  const vantD = leerArchivo('supabase/horarios-versiones-antiguas-deshacer.sql');
  const prot = leerArchivo('supabase/horarios-protegido.sql');
  ok(/NO EJECUTAR EN SUPABASE/.test(resc) && /NO EJECUTAR EN SUPABASE/.test(vant) && /NO se ejecuta en Supabase/.test(rescD) && /NO se ejecuta en Supabase/.test(vantD), 'los cuatro archivos dicen que no se ejecutan en Supabase (los activa Josué, en E2)');
  const r = sinComentariosSql(resc); const v = sinComentariosSql(vant);
  ok(/after update or delete on public\.app_data/.test(r) && /execute function protegido_interno\.rescatar\(\)/.test(r), 'P1: la red de rescate va DESPUÉS de escribir (solo rescata lo que de verdad se escribió), en cambios y borrados');
  ok(/array\['horarioTop', 'estudios', 'papelera'\]/.test(r), 'P1: protege horarioTop, estudios y papelera');
  ok(/message = 'rescate_fallido'/.test(r) && /exception when others then/.test(r), 'H-25: si la copia falla, la escritura se rechaza (rescate_fallido)');
  ok(/'josstyle\.protegido', true\), ''\) = 'on' then return null/.test(r), 'lo que escriben las funciones protegidas no se rescata');
  ok(/new\.value is not distinct from old\.value then return null/.test(r) && /meta ->> 'huella' = v_huella/.test(r), 'un guardado que no cambia nada, o una pareja ya rescatada, no se repite');
  ok(/before insert or update or delete on public\.app_data/.test(v) && /return null;\s+-- no se aplica/.test(vant), 'P4: decide ANTES de escribir y no aplica la escritura (la aparta)');
  ok(/array\['horarioTop'\]/.test(v), 'P4: solo horarioTop (estudios y la papelera son de E1-S y E1-P)');
  ok(/drop trigger if exists horario_regla_revision/.test(v), 'P4 sustituye a la regla de E1 (rechazar, TP-15 B): H-23');
  ok(/message = 'version_antigua_no_apartada'/.test(v), 'si no se puede apartar, tampoco se escribe (nunca se descarta sin dejarla a salvo)');
  ok(/message = 'protegido_solo_por_funciones'/.test(v), 'borrar la fila del horario desde la aplicación se rechaza');
  ok(/new\.user_id is distinct from auth\.uid\(\) then return new/.test(v), 'una fila de otra cuenta no se lee ni se aparta (la para su política)');
  ok(/to_regclass\('public\.copias_apartadas'\) is null/.test(r) && /to_regclass\('public\.copias_apartadas'\) is null/.test(v), 'los dos exigen R1 instalado antes');
  for (const [nombre, t] of [['rescate', rescD], ['versiones antiguas', vantD]]) {
    const c = sinComentariosSql(t);
    ok(!/delete from|truncate|drop table/i.test(c) && /drop trigger if exists/.test(c), `la vuelta atrás de ${nombre} quita su disparador y NO borra ninguna copia`);
  }
  ok(/'rescate', exists/.test(prot) && /'versionesAntiguas', exists/.test(prot) && /'horario_regla_revision', 'horarios_versiones_antiguas'/.test(prot), 'el protocolo dice qué reglas están activas (rescate, versiones antiguas y la de horarioTop)');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('B · Describir una copia de rescate o de versión antigua');
{
  const h = conTestigo(HORARIO(), 'r1');
  const fr = rescate(h, conTestigo(sinBloque(HORARIO(), 'b2'), 'r2', 'viejo'));
  const d = describirCopia(fr, { aparato: 'viejo' });
  ok(esCopiaCompleta(fr) && d.titulo === 'Horario: lo que había antes de que una versión anterior guardara encima', 'rescate: «Horario: lo que había antes de que una versión anterior guardara encima»');
  ok(d.motivoTexto === MOTIVOS_COPIA_COMPLETA.rescate && d.tipoTexto === TIPOS_COPIA.rescate && d.nueva && d.conHorario && d.claves.join() === 'horarioTop', 'con su motivo, su tipo, nueva y de horarioTop');
  ok(d.deEsteAparato && d.fecha !== 'Sin fecha' && d.tamanoTexto === 'unos 1 KB', 'el aparato, la fecha y el tamaño, como cualquier copia');
  ok(describirCopia(rescate(h, null)).titulo.endsWith('antes de que una versión anterior lo borrara'), 'un rescate de un borrado lo dice');
  const dv = describirCopia(versionAntigua(h, h));
  ok(dv.titulo === 'Horario: lo que intentó guardar una versión anterior' && dv.motivoTexto === MOTIVOS_COPIA_COMPLETA.version_antigua, 'versión antigua: «lo que intentó guardar una versión anterior», «No se aplicó»');
  ok(tituloDeCopiaCompleta('rescate', 'estudios') === 'Estudios: lo que había antes de que una versión anterior guardara encima', 'y con otra clave, su nombre');
  ok(!/liberad/i.test(JSON.stringify([d, dv, MOTIVOS_COPIA_COMPLETA, T]).toLowerCase()), 'ni una palabra de espacio «liberado»');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('C · Qué contiene, dicho sin aplicar nada');
{
  const antes = conTestigo(HORARIO(), 'r1');
  const despues = conTestigo(conBloque(sinBloque(HORARIO(), 'b2'), 'b3', { aula: 'Z9' }), 'r2', 'viejo');
  const res = resumenDeCopia(rescate(antes, despues));
  ok(res.length === 1 && res[0].nombre === 'Horario' && /Recuperarlo todo supondría: .*1 clase añadida.*1 clase cambiada/.test(res[0].frases[0]), `rescate: «Recuperarlo todo supondría: 1 clase añadida, 1 clase cambiada» (${res[0] && res[0].frases[0]})`);
  const resV = resumenDeCopia(versionAntigua(despues, antes));
  ok(/Aplicarlo todo supondría: .*1 clase quitada.*1 clase cambiada/.test(resV[0].frases[0]), 'versión antigua: «Aplicarlo todo supondría: 1 clase quitada, 1 clase cambiada»');
  ok(/No hay diferencias/.test(resumenDeCopia(rescate(antes, conTestigo(HORARIO(), 'r3')))[0].frases[0]), 'sin diferencias (solo cambió el testigo): lo dice');
  ok(resumenDeCopia({ id: 'x', tipo: 'rescate', contenido: { formato: 2 } }).length === 0, 'ilegible: nada, nunca un fallo');
  const cs = cambiosDeCopiaCompleta(rescate(antes, despues));
  ok(cs && cs.cambios.every((cb) => !cb.orden) && !JSON.stringify(cs.cambios).includes('"testigo"'), 'el cambio por elementos va sin el testigo ni el orden de una lista');
  ok(lecturaDeCopiaCompleta(rescate(antes, null)).borrado === true && lecturaDeCopiaCompleta(versionAntigua(antes, null)).desde === null, 'lectura: un borrado y una versión antigua sin nada antes');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('D · Recuperar por elementos una copia de rescate, sin pisar lo posterior');
{
  /* La versión antigua quitó b2, cambió b3 y desmarcó la clase hecha; después, en un aparato nuevo, otra persona
     (B) cambió b3 otra vez. */
  const antes = conTestigo(HORARIO(), 'r1');
  const pisado = conTestigo({ ...conBloque(sinBloque(HORARIO(), 'b2'), 'b3', { aula: 'VIEJO' }), completadas: [] }, 'r2', 'viejo');
  const fila = rescate(antes, pisado);
  const ahora = conTestigo({ ...conBloque(sinBloque(HORARIO(), 'b2'), 'b3', { aula: 'DE-B' }), completadas: [] }, 'r3', 'B');
  const prep = prepararRecuperacion({ fila, actual: leida(ahora) });
  ok(prep.estado === 'por_elementos' && estadoDeCopia(prep) === ESTADOS_COPIA.pendiente, 'sin elegir nada: «por elementos», pendiente');
  const pb2 = piezaCon(prep, 'Historia» (09:00–10:00)'); const pb3 = piezaCon(prep, '(10:00–11:00)'); const pmarca = piezaCon(prep, 'marcar como hecha');
  ok(pb2 && pb2.estado === 'aplicable' && pb2.texto === 'Volver a poner la clase «Historia» (09:00–10:00)', 'la clase que quitó la versión antigua se puede volver a poner');
  ok(pb3 && pb3.estado === 'choque' && pb3.texto.startsWith('Volver a dejar la clase'), '🚨 la clase que B cambió después NO se puede elegir (choque)');
  ok(pmarca && pmarca.estado === 'aplicable' && pmarca.texto === 'Volver a marcar como hecha una clase', 'la marca de hecha se puede volver a poner');
  const plan = prepararRecuperacion({ fila, actual: leida(ahora), elegidas: [pb2.id] });
  ok(plan.estado === 'recuperable' && plan.resumen.join() === 'Volver a poner la clase «Historia» (09:00–10:00).' && plan.elegidas.join() === pb2.id, 'eligiendo solo esa clase: el plan es exactamente eso');
  const b = (id) => plan.horario.bloques.find((x) => x.id === id);
  ok(b('b2') && b('b2').aula === 'A2' && b('b3').aula === 'DE-B' && plan.horario.completadas.length === 0, '🚨 el plan pone b2, deja b3 como lo dejó B y no toca la marca (no se eligió)');
  ok(plan.horario.testigo && plan.horario.testigo.revision === 'r3' && plan.claves.length === 0, 'sobre lo de ahora (su testigo lo cambia el escritor) y solo el horario');
  const conChoque = prepararRecuperacion({ fila, actual: leida(ahora), elegidas: [pb2.id, pb3.id] });
  ok(conChoque.estado === 'no_recuperable' && conChoque.motivo === 'conflicto_posterior', '🚨 elegir algo que cambió después: no se prepara nada');
  ok(prepararRecuperacion({ fila, actual: leida(ahora), elegidas: ['p99'] }).estado === 'no_recuperable', 'un elegido que no existe: tampoco');
  const todo = prepararRecuperacion({ fila, actual: leida(ahora), elegidas: prep.piezas.filter((p) => p.estado === 'aplicable').map((p) => p.id) });
  ok(todo.estado === 'recuperable' && todo.horario.completadas.join() === '2026-11-16|b1' && todo.horario.bloques.find((x) => x.id === 'b3').aula === 'DE-B', 'todo lo que se puede elegir: vuelve b2 y la marca, y b3 sigue como lo dejó B');
  const yaHecho = prepararRecuperacion({ fila, actual: leida(conTestigo({ ...conBloque(HORARIO(), 'b3', { aula: 'A3' }) }, 'r4')) });
  ok(yaHecho.estado === 'ya_aplicada' && estadoDeCopia(yaHecho) === ESTADOS_COPIA.recuperada, 'si ya está todo como en la copia: «Ya está en tu cuenta»');
  const todoCambio = prepararRecuperacion({ fila: rescate(antes, conTestigo(conBloque(HORARIO(), 'b3', { aula: 'VIEJO' }), 'r2')), actual: leida(conTestigo(conBloque(HORARIO(), 'b3', { aula: 'DE-B' }), 'r5')) });
  ok(todoCambio.estado === 'no_recuperable' && todoCambio.motivo === 'todo_cambio' && todoCambio.texto === MOTIVOS_NO_RECUPERABLE.todo_cambio && todoCambio.piezas.length === 1, 'si todo cambió después: no se recupera nada, y se ve qué era');
  const borrado = prepararRecuperacion({ fila: rescate(antes, null), actual: leida(null) });
  ok(borrado.estado === 'por_elementos' && borrado.piezas.every((p) => p.estado === 'aplicable'), 'un horario borrado por una versión anterior: todo se puede volver a poner');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('E · Recuperar por elementos una copia de versión antigua');
{
  const vigente = conTestigo(HORARIO(), 'r1');
  const intentado = conTestigo(conBloqueNuevo(sinBloque(HORARIO(), 'b1'), FISICA), 'rv', 'viejo');
  const fila = versionAntigua(intentado, vigente);
  const prep = prepararRecuperacion({ fila, actual: leida(vigente) });
  const anadir = piezaCon(prep, 'Física'); const quitar = piezaCon(prep, 'Matemáticas');
  ok(prep.estado === 'por_elementos' && anadir.texto === 'Añadir la clase «Física» (11:00–12:00)' && quitar.texto === 'Quitar la clase «Matemáticas» (08:00–09:00)', 'lo que intentó: «Añadir la clase «Física»» y «Quitar la clase «Matemáticas»», cada una por su lado');
  const plan = prepararRecuperacion({ fila, actual: leida(vigente), elegidas: [anadir.id] });
  ok(plan.estado === 'recuperable' && plan.horario.bloques.some((x) => x.id === 'b4') && plan.horario.bloques.some((x) => x.id === 'b1'), 'eligiendo solo añadir Física: se añade y Matemáticas se queda');
  const sinHorario = prepararRecuperacion({ fila: versionAntigua(intentado, null), actual: leida(null), elegidas: null });
  ok(sinHorario.estado === 'por_elementos' && sinHorario.piezas.length > 0, 'sin horario en la cuenta: se puede elegir qué crear');
  const p1 = prepararRecuperacion({ fila: versionAntigua(intentado, null), actual: leida(null), elegidas: sinHorario.piezas.filter((p) => p.estado === 'aplicable').map((p) => p.id) });
  ok(p1.estado === 'recuperable' && Array.isArray(p1.horario.bloques) && p1.horario.bloques.length === 3, '…y el plan crea lo elegido');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('F · Las de Estudios y Eliminados recientes se ven y se eliminan, no se recuperan desde aquí');
{
  const est = normalizarEstudiosCargados({ asignaturas: [{ id: 'mat', nombre: 'Matemáticas' }, { id: 'his', nombre: 'Historia' }] });
  const pisado = normalizarEstudiosCargados({ asignaturas: [{ id: 'mat', nombre: 'Matemáticas' }] });
  const fila = rescate(est, pisado, { clave: 'estudios' });
  const p = prepararRecuperacion({ fila, actual: leida(null) });
  ok(p.estado === 'no_recuperable' && p.motivo === 'clave_sin_recuperacion' && p.texto === MOTIVOS_NO_RECUPERABLE.clave_sin_recuperacion, 'Estudios: «se pueden ver y eliminar, pero no recuperar desde aquí»');
  ok(/1 asignatura añadida/.test(resumenDeCopia(fila)[0].frases[0]), 'y se ve qué contiene («1 asignatura añadida»)');
  const pap = rescate(normalizarPapeleraCargada({ elementos: [{ id: 'e1', modulo: 'x', coleccion: 'y', elemento: { id: 'z' }, eliminadoEn: '2026-11-01T00:00:00Z' }] }), normalizarPapeleraCargada({}), { clave: 'papelera' });
  ok(prepararRecuperacion({ fila: pap, actual: leida(null) }).motivo === 'clave_sin_recuperacion' && resumenDeCopia(pap)[0].nombre === 'Eliminados recientes', 'Eliminados recientes: igual');
  ok(!/queda pendiente|fase|E1-S|E1-P/i.test(MOTIVOS_NO_RECUPERABLE.clave_sin_recuperacion), 'sin notas internas en la pantalla (regla 9)');
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* El transporte del escritor sobre el doble. */
function crearRed(doble) {
  const r = async (fn) => { const data = copia(fn()); await dormir(0); return { ok: true, data }; };
  return {
    protocolo: () => r(() => doble.protocolo()), aplicar: (op) => r(() => doble.aplicar(copia(op))), estado: (id) => r(() => doble.estado(id)),
    leer: (claves) => r(() => doble.leer(claves)), copiaEliminar: (id) => r(() => doble.copiaEliminar(id)),
  };
}
function aparato(almacen, doble, nombre) {
  const pantalla = { horario: copia(almacen.horarioTop) };
  const w = crearEscritorDeOperaciones({
    transporte: crearRed(doble), usuario: 'u1', aparato: nombre, versionApp: '3.164.0',
    inicial: { valor: copia(almacen.horarioTop), existe: true }, alAdoptar: (v) => { pantalla.horario = copia(v); },
    normalizarHorario: normalizarHorarioTop,
  });
  return { w, pantalla };
}
/* Lo que hace App.jsx (`recuperarCopiaApartada`): leer lo de ahora, volver a preparar con lo elegido, comparar con lo
   revisado y mandarlo por el escritor con la revisión leída como condición. */
async function recuperar(A, doble, fila, vistaPrevia) {
  const actual = doble.leer(CLAVES_RECUPERACION).claves;
  const prep = prepararRecuperacion({ fila, actual, elegidas: vistaPrevia.elegidas || null });
  if (!mismaRecuperacion(prep, vistaPrevia)) return { ok: false, motivo: 'cambio' };
  return A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: prep.horario, claves: prep.claves, base: actual.horarioTop });
}

seccion('G · El flujo entero: una versión antigua pisa (rescate) o intenta (apartada), y se recupera');
{
  const almacen = { horarioTop: conTestigo(HORARIO(), 'r1', 'A') };
  const doble = crearDobleProtegido(almacen);
  doble.S.reglas.rescate = true;
  ok(doble.protocolo().reglas.rescate === true && doble.protocolo().reglas.versionesAntiguas === false, 'P1: el protocolo dice rescate sí, versiones antiguas no');
  /* Una pestaña con la versión anterior guarda el horario sin b2 (sin saber que existía). */
  const r1 = doble.escrituraAntigua('horarioTop', conTestigo(sinBloque(HORARIO(), 'b2'), 'rv1', 'viejo'));
  ok(r1.aplicada && r1.copiaId && !almacen.horarioTop.bloques.some((b) => b.id === 'b2'), 'P1–P4: la escritura antigua SE APLICA (b2 desaparece) y lo de antes queda rescatado');
  const A = aparato(almacen, doble, 'A');
  await A.w.verLoDeAhora?.();
  const fila = doble.leerCopia(r1.copiaId)[0];
  ok(fila.tipo === 'rescate' && fila.contenido.antes.bloques.some((b) => b.id === 'b2'), 'la copia de rescate tiene lo que había (con b2)');
  const prep = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves });
  const pb2 = piezaCon(prep, 'Historia» (09:00–10:00)');
  const vista = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves, elegidas: [pb2.id] });
  const r = await recuperar(A, doble, fila, vista);
  await A.w.esperar();
  ok(r.ok && almacen.horarioTop.bloques.some((b) => b.id === 'b2' && b.aula === 'A2'), 'recuperar b2 por el escritor: vuelve a la cuenta');
  ok([...doble.S.registro.values()].some((x) => x.resultado === 'aplicada') && doble.listarCopias().some((c) => c.id === r1.copiaId), 'como operación protegida (en el registro), y la copia sigue ahí');
  const otraVez = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves });
  ok(otraVez.estado === 'ya_aplicada', 'después: «Ya está en tu cuenta»');

  /* P4: la regla de versiones antiguas. */
  doble.S.reglas.versionesAntiguas = true;
  ok(doble.protocolo().reglas.versionesAntiguas === true && doble.protocolo().reglas.horarioTop === true, 'P4: el protocolo dice versiones antiguas sí');
  const antesDeP4 = JSON.stringify(almacen.horarioTop);
  const r2 = doble.escrituraAntigua('horarioTop', conTestigo(conBloqueNuevo(HORARIO(), FISICA), 'rv2', 'viejo'));
  ok(!r2.aplicada && r2.copiaId && JSON.stringify(almacen.horarioTop) === antesDeP4, '🚨 desde P4 la escritura antigua NO se aplica: la cuenta no cambia y queda apartada');
  const filaV = doble.leerCopia(r2.copiaId)[0];
  ok(avisoDeVersionesAntiguas(doble.listarNuevasDeVersionAntigua()).cuantas === 1, 'y se avisa: una versión anterior intentó guardar algo que no se aplicó');
  const prepV = prepararRecuperacion({ fila: filaV, actual: doble.leer(CLAVES_RECUPERACION).claves });
  const pf = piezaCon(prepV, 'Física');
  const vistaV = prepararRecuperacion({ fila: filaV, actual: doble.leer(CLAVES_RECUPERACION).claves, elegidas: [pf.id] });
  const rv = await recuperar(A, doble, filaV, vistaV);
  await A.w.esperar();
  ok(rv.ok && almacen.horarioTop.bloques.some((b) => b.id === 'b4') && almacen.horarioTop.bloques.some((b) => b.id === 'b2'), 'lo que intentó (Física) se aplica si él lo elige, sin quitar nada más');
  doble.copiaVista(r2.copiaId);
  ok(avisoDeVersionesAntiguas(doble.listarNuevasDeVersionAntigua()) === null, 'vista la copia, el aviso desaparece (la copia sigue)');
  ok(doble.listarCopias().length === 2, '🚨 ninguna copia se ha eliminado sola (las dos siguen)');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('H · La cuenta cambia entre la vista previa y el envío: no se manda');
{
  const almacen = { horarioTop: conTestigo(HORARIO(), 'r1', 'A') };
  const doble = crearDobleProtegido(almacen);
  doble.S.reglas.rescate = true;
  const r1 = doble.escrituraAntigua('horarioTop', conTestigo(sinBloque(sinBloque(HORARIO(), 'b2'), 'b3'), 'rv1', 'viejo'));
  const A = aparato(almacen, doble, 'A');
  const fila = doble.leerCopia(r1.copiaId)[0];
  const prep = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves });
  const vista = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves, elegidas: [piezaCon(prep, '(09:00–10:00)').id] });
  /* Mientras él lo revisa, otro aparato (protegido) vuelve a poner b2 cambiado. */
  const B = aparato(almacen, doble, 'B');
  await B.w.guardar(conBloqueNuevo(B.pantalla.horario, { id: 'b2', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '09:00', fin: '10:00', aula: 'DE-B' }));
  await B.w.esperar();
  const antes = JSON.stringify(almacen.horarioTop);
  const r = await recuperar(A, doble, fila, vista);
  ok(!r.ok && r.motivo === 'cambio' && JSON.stringify(almacen.horarioTop) === antes, '🚨 no se manda nada: hay que volver a revisarlo');
  const nueva = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves });
  ok(piezaCon(nueva, '(09:00–10:00)').estado === 'choque', 'al volver a mirar, b2 ya no se puede elegir (B la puso después)');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('I · Reintentos y duplicados');
{
  const almacen = { horarioTop: conTestigo(HORARIO(), 'r1', 'A'), estudios: normalizarEstudiosCargados({ asignaturas: [{ id: 'mat', nombre: 'Matemáticas' }] }) };
  const doble = crearDobleProtegido(almacen);
  doble.S.reglas.rescate = true;
  const v = conTestigo(sinBloque(HORARIO(), 'b2'), 'rv1', 'viejo');
  const a = doble.escrituraAntigua('horarioTop', v); const b = doble.escrituraAntigua('horarioTop', v);
  ok(a.copiaId && !b.copiaId && doble.listarCopias().length === 1, 'la misma escritura dos veces: la segunda no cambia nada y no hace otra copia');
  const e = doble.escrituraAntigua('estudios', normalizarEstudiosCargados({ asignaturas: [] }));
  ok(e.aplicada && e.copiaId && doble.leerCopia(e.copiaId)[0].contenido.clave === 'estudios', 'Estudios también queda rescatado');
  doble.S.reglas.versionesAntiguas = true;
  const w = conTestigo(conBloqueNuevo(HORARIO(), FISICA), 'rv2', 'viejo');
  const c1 = doble.escrituraAntigua('horarioTop', w); const c2 = doble.escrituraAntigua('horarioTop', w);
  ok(c1.copiaId && !c2.copiaId && doble.listarNuevasDeVersionAntigua().length === 1, 'una versión antigua que reintenta lo mismo: una sola copia apartada');
  const igual = doble.escrituraAntigua('horarioTop', copia(almacen.horarioTop));
  ok(!igual.aplicada && !igual.copiaId, 'una escritura que no cambia nada: ni se aplica ni se aparta');
  /* Recuperar dos veces la misma copia: la segunda ya no tiene nada que hacer. */
  const A = aparato(almacen, doble, 'A');
  const fila = doble.leerCopia(c1.copiaId)[0];
  const prep = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves });
  const vista = prepararRecuperacion({ fila, actual: doble.leer(CLAVES_RECUPERACION).claves, elegidas: [piezaCon(prep, 'Física').id] });
  const r1 = await recuperar(A, doble, fila, vista); await A.w.esperar();
  const r2 = await recuperar(A, doble, fila, vista);
  ok(r1.ok && !r2.ok && r2.motivo === 'cambio' && almacen.horarioTop.bloques.filter((x) => x.id === 'b4').length === 1, 'recuperar dos veces lo mismo: la segunda no se manda (ya está) y no hay dos clases');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('J · El aviso de lo que no se aplicó');
{
  const v = (vista) => ({ tipo: 'version_antigua', vista });
  ok(avisoDeVersionesAntiguas([]) === null && avisoDeVersionesAntiguas(null) === null, 'sin copias: sin aviso');
  ok(avisoDeVersionesAntiguas([v(true), { tipo: 'rescate', vista: false }, { tipo: 'conflicto', vista: false }]) === null, 'las vistas, los rescates y los conflictos no avisan (solo lo que no se aplicó y no ha visto)');
  ok(avisoDeVersionesAntiguas([v(false)]).texto === T.avisoVersionAntiguaUna, 'una: «Una versión anterior de JosStyle intentó guardar un cambio…»');
  const tres = avisoDeVersionesAntiguas([v(false), v(false), v(false)]);
  ok(tres.cuantas === 3 && tres.texto.includes('3 cambios') && !tres.texto.includes('{n}'), 'tres: «…intentó guardar 3 cambios…»');
  ok(/no se aplic/.test(T.avisoVersionAntiguaUna) && /a salvo/.test(T.avisoVersionAntiguaUna), 'dice que no se aplicó y que está a salvo');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('K · Nada se elimina solo');
{
  const src = readFileSync(join(RAIZ, 'src/lib/cambiosApartados.js'), 'utf8');
  const comp = readFileSync(join(RAIZ, 'src/components/cambiosApartados.jsx'), 'utf8');
  ok(!/copiaEliminar|eliminar\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'la lógica no elimina nada');
  const usos = comp.match(/servicio\.eliminar\(/g) || [];
  ok(usos.length === 1 && /a\.tipo === 'eliminar'/.test(comp), 'la pantalla elimina en un solo sitio: al confirmar «Eliminar la copia»');
  ok(!/eliminar/.test((comp.match(/const pedirRecuperar[\s\S]*?\n {2}};/) || [''])[0]), 'recuperar por elementos no elimina la copia');
}

/* ─────────────────────────────────────────────────────────────────────────── */
seccion('L · La comprobación que protege lo posterior se pondría roja con una recuperación entera');
{
  const antes = conTestigo(HORARIO(), 'r1');
  const fila = rescate(antes, conTestigo(conBloque(HORARIO(), 'b3', { aula: 'VIEJO' }), 'r2'));
  const ahora = conTestigo(conBloque(HORARIO(), 'b3', { aula: 'DE-B' }), 'r3');
  const entera = { ...ahora, ...antes };   // lo que haría recuperar el valor entero de la copia
  ok(entera.bloques.find((b) => b.id === 'b3').aula === 'A3', 'recuperar el valor entero habría pisado lo que B cambió después (b3)');
  const prep = prepararRecuperacion({ fila, actual: leida(ahora) });
  ok(prep.estado === 'no_recuperable' && prep.piezas.every((p) => p.estado !== 'aplicable'), 'por elementos, b3 no se puede elegir: nada se pisa');
  ok(textoDePieza('rescate', 'horarioTop', { camino: [], fijar: [{ campo: 'config', igual: 1, valor: 2 }] }) === 'Volver a dejar «config» como estaba', 'un ajuste: «Volver a dejar «config» como estaba»');
}

console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones de la red de rescate y las versiones antiguas (R5)`);
process.exit(fallos ? 1 : 0);
