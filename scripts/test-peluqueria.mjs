// ============================================================================
// EH · Fase 11/65 — PRUEBAS
//
// Las catorce del apartado 17, más la que sostiene toda la fase:
//
//   ⚠️ **Evento planificado ≠ historial** (apartado 15). Borrar una cita NO
//   puede borrar un corte, y marcar un corte realizado tiene que convertir el
//   plan en historia. Si eso estuviera mal, cancelar una cita le borraría el
//   corte que sí se dio — y nada reventaría.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { MODULO_PELO, contestarPelo } from '../src/lib/perfilCapilar.js';
import { NO_LO_SE } from '../src/lib/cuestionarios.js';
import { datosPelo, alternarParte, crearRutina } from '../src/lib/rutinasPelo.js';
import { crearProductoPelo } from '../src/lib/productosPelo.js';
import {
  PARTE_PELUQUERIA, OPCIONES_FRECUENCIA_CORTE, SEMANAS_DE_RESPUESTA, ORIGENES_FRECUENCIA,
  frecuenciaDeCorte, guardarFrecuencia,
  PREFERENCIAS_CORTE, preferenciaCorte, ANTELACIONES_AVISO, antelacion,
  DEFAULT_PELUQUERIA, normalizarPeluqueria, datosPeluqueria,
  registrarCorte, editarCorte, borrarCorte, ultimoCorte, historialDeCortes, frecuenciaReal,
  MODOS_PROXIMO, planificarCorte, editarCita, avisoEliminarCita, eliminarCita, marcarCorteRealizado,
  sugerirProximoCorte, MOTIVOS_SIN_AVISO, avisoDeCorte, alternarRecordatorio,
  anadirSitio, borrarSitio, eventosDePeluqueria, impactoDesactivarPeluqueria,
  panelPeluqueria, resumenPeluqueria,
} from '../src/lib/peluqueria.js';

let n = 0;
let fallos = 0;
function ok(cond, msg) {
  n += 1;
  if (cond) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg}`);
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function eq(a, b, msg) {
  n += 1;
  if (igual(a, b)) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
}

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);
const conCorte = () => registrarCorte(base(), { fecha: '2026-08-23', nota: 'Me gustó mucho.' }).estado;

/* ── 1 · ⚠️ FRECUENCIA: LA QUE YA SE PREGUNTÓ (apartado 4) ───────────────── */

eq(ORIGENES_FRECUENCIA, ['perfil', 'propia', 'ninguna'], 'Tres orígenes posibles');
eq(OPCIONES_FRECUENCIA_CORTE, [1, 2, 3, 4, 5, 6], 'Las seis del apartado 4');
eq(SEMANAS_DE_RESPUESTA.mes, 4, 'Un mes son cuatro semanas');
eq(SEMANAS_DE_RESPUESTA.necesito, null,
  '⚠️ "Cuando lo necesito" NO da un número, y eso no es un fallo: es una respuesta');
eq(SEMANAS_DE_RESPUESTA.otro, null, 'Y "otro" tampoco');

// ⚠️ Se lee de la Fase 7, no se vuelve a preguntar.
const conPerfil = contestarPelo(base(), 'frecuenciaCorte', 'mes', { hoy: HOY }).estado;
eq(frecuenciaDeCorte(conPerfil).semanas, 4, '⚠️ La frecuencia sale del perfil capilar (F7)');
eq(frecuenciaDeCorte(conPerfil).origen, 'perfil', 'Y se dice de dónde');
ok(frecuenciaDeCorte(conPerfil).de.includes('perfil'), 'Con su explicación');
eq(frecuenciaDeCorte(conPerfil).conflicto, null, 'Sin choque');

// Sin respuesta en el perfil, la que él ponga aquí.
const propia = guardarFrecuencia(base(), 3).estado;
eq(frecuenciaDeCorte(propia).semanas, 3, 'Sin perfil, la que ponga aquí');
eq(frecuenciaDeCorte(propia).origen, 'propia', 'Y se dice');
ok(guardarFrecuencia(base(), 0).error !== null, 'Una frecuencia imposible se rechaza');
ok(guardarFrecuencia(base(), 99).error !== null, 'Y una absurda también');
eq(frecuenciaDeCorte(guardarFrecuencia(propia, null).estado).origen, 'ninguna', 'Y se puede quitar');

// ⚠️ El choque se enseña, no se resuelve en silencio (como `tallaDe` en F5).
const chocan = guardarFrecuencia(conPerfil, 2).estado;
eq(frecuenciaDeCorte(chocan).semanas, 4, 'El perfil manda cuando puede responder');
eq(frecuenciaDeCorte(chocan).conflicto, { guardada: 2, perfil: 4 },
  '⚠️ Pero el choque SE ENSEÑA, con los dos valores');

// Sin nada: no se inventa una frecuencia.
eq(frecuenciaDeCorte(base()).semanas, null, '⚠️ Sin datos NO se inventa una frecuencia');
eq(frecuenciaDeCorte(base()).origen, 'ninguna', 'Y se dice');
const noLoSe = contestarPelo(base(), 'frecuenciaCorte', 'necesito', { hoy: HOY }).estado;
eq(frecuenciaDeCorte(noLoSe).semanas, null, '⚠️ "Cuando lo necesito" tampoco da una');
ok(frecuenciaDeCorte(noLoSe).de.includes('necesitas'), 'Y se explica por qué');

/* ── 2 · REGISTRAR CORTES (apartados 2, 9 y 10) ──────────────────────────── */

const r1 = registrarCorte(base(), { fecha: '2026-08-23', nota: 'Me gustó mucho.' });
eq(r1.error, null, 'Test 1: registrar el último corte');
eq(datosPeluqueria(r1.estado).cortes.length, 1, 'Y queda guardado');
eq(ultimoCorte(r1.estado).nota, 'Me gustó mucho.', 'Apartado 10: con su nota');
eq(registrarCorte(base(), {}).corte.fecha, HOY, '⚠️ Apartado 2: "Hoy", para hacerlo rápido');
ok(registrarCorte(base(), { fecha: 'ayer' }).error !== null, 'Una fecha que no lo es se rechaza');
ok(registrarCorte(r1.estado, { fecha: '2026-08-23' }).yaExistia, 'Dos cortes el mismo día no son dos cortes');
eq(datosPeluqueria(registrarCorte(r1.estado, { fecha: '2026-08-23' }).estado).cortes.length, 1, 'Y no se duplica');

// Apartado 11 — cómo quiere llevarlo la próxima vez.
eq(PREFERENCIAS_CORTE.map((p) => p.nombre), ['Más corto', 'Más largo', 'Mantener', 'Cambiar estilo'],
  'Las cuatro preferencias del apartado 11');
eq(preferenciaCorte('inventada'), null, 'Una que no existe devuelve null');
const conPref = registrarCorte(base(), { fecha: '2026-08-23', preferencia: 'mas_largo' }).estado;
eq(ultimoCorte(conPref).preferencia, 'mas_largo', 'Se guarda su preferencia');
eq(normalizarPeluqueria({ cortes: [{ fecha: '2026-01-01', preferencia: 'inventada' }] }).cortes[0].preferencia, null,
  'Una preferencia que no existe se descarta');

// Editar y borrar.
const idCorte = r1.corte.id;
eq(ultimoCorte(editarCorte(r1.estado, idCorte, { nota: 'Otra' }).estado).nota, 'Otra', 'Editar un corte');
ok(editarCorte(r1.estado, idCorte, { fecha: null }).error !== null, 'Sin dejarlo sin fecha');
ok(editarCorte(base(), 'noexiste', {}).error !== null, 'Y uno que no existe se rechaza');
eq(datosPeluqueria(borrarCorte(r1.estado, idCorte).estado).cortes.length, 0, 'Borrar un corte');
ok(borrarCorte(base(), 'noexiste').error !== null, 'Uno que no existe se rechaza');

/* ── 3 · HISTORIAL Y FRECUENCIA REAL (apartado 9) ────────────────────────── */

let varios = base();
['2026-05-01', '2026-05-29', '2026-06-26', '2026-07-24', '2026-08-21']
  .forEach((f) => { varios = registrarCorte(varios, { fecha: f }).estado; });
const hist = historialDeCortes(varios);
eq(hist.length, 5, 'Test 8: cinco cortes en el historial');
eq(hist[0].fecha, '2026-08-21', 'El más reciente primero');
eq(hist[0].diasDesdeElAnterior, 28, 'Con los días desde el anterior');
eq(hist[4].diasDesdeElAnterior, null,
  '⚠️ Y el más antiguo, `null` — no 0: no hay con qué compararlo');

const real = frecuenciaReal(varios);
ok(real.suficiente, 'Con cuatro intervalos hay frecuencia real');
eq(real.semanas, 4, 'Cuatro semanas de media');
ok(real.texto.includes('De media'), 'Y una frase que lo dice');
ok(!frecuenciaReal(r1.estado).suficiente,
  '⚠️ Con un solo corte NO se afirma una frecuencia: no hay ni un intervalo');
eq(frecuenciaReal(r1.estado).texto, '', 'Y el texto es vacío, no una frase a medias');
eq(frecuenciaReal(base()).de, 0, 'Sin cortes, cero');

/* ── 4 · PLANIFICAR (apartados 3 y 7) ────────────────────────────────────── */

eq(MODOS_PROXIMO.map((m) => m.nombre),
  ['Una fecha concreta', 'En X semanas', 'En X días', 'Todavía no lo sé'],
  'Las cuatro formas del apartado 3');

const porFecha = planificarCorte(conCorte(), { modo: 'fecha', fecha: '2026-09-20' });
eq(datosPeluqueria(porFecha.estado).cita.fecha, '2026-09-20', 'Test 2: una fecha concreta');
eq(planificarCorte(conCorte(), { modo: 'semanas', cantidad: 4, desde: HOY }).cita.fecha, '2026-09-24',
  'Test 2: en X semanas');
eq(planificarCorte(conCorte(), { modo: 'dias', cantidad: 10, desde: HOY }).cita.fecha, '2026-09-06',
  'Test 2: en X días');
// ⚠️ *"Todavía no lo sé"* no crea nada.
eq(planificarCorte(porFecha.estado, { modo: 'no_se' }).cita, null,
  '⚠️ "Todavía no lo sé" es una respuesta, no un hueco: no crea cita');
eq(datosPeluqueria(planificarCorte(porFecha.estado, { modo: 'no_se' }).estado).cita, null, 'Y quita la que hubiera');
ok(planificarCorte(conCorte(), { modo: 'fecha', fecha: 'mañana' }).error !== null, 'Una fecha que no lo es se rechaza');
/* ⚠️ Este encontró un fallo real: `Number(null)` es 0 e `Number.isInteger(0)` es
   `true`, así que "en X semanas" SIN decir la X planificaba el corte para HOY,
   en silencio. */
ok(planificarCorte(conCorte(), { modo: 'semanas' }).error !== null,
  '⚠️ "En X semanas" sin decir la X se rechaza, en vez de planificar para hoy');
ok(planificarCorte(conCorte(), { modo: 'dias', cantidad: 0 }).error !== null, 'Y "en 0 días" tampoco vale');
ok(planificarCorte(conCorte(), { modo: 'semanas', cantidad: -2 }).error !== null, 'Ni una cantidad negativa');

// Apartado 7 — editar la cita.
const conHora = editarCita(porFecha.estado, { hora: '17:30', nota: 'Cambiar laterales' }).estado;
eq(datosPeluqueria(conHora).cita.hora, '17:30', 'Test 9: editar la hora');
eq(datosPeluqueria(conHora).cita.nota, 'Cambiar laterales', 'Y la nota');
// ⚠️ Y este otro: "25:99" encaja con `\d{2}:\d{2}` y no es una hora.
eq(datosPeluqueria(editarCita(porFecha.estado, { hora: '25:99' }).estado).cita.hora, null,
  '⚠️ Una hora con la forma correcta pero imposible se descarta');
eq(datosPeluqueria(editarCita(porFecha.estado, { hora: '09:05' }).estado).cita.hora, '09:05', 'Y una de verdad se guarda');
eq(datosPeluqueria(editarCita(porFecha.estado, { hora: '23:59' }).estado).cita.hora, '23:59', 'Incluso la última del día');
ok(editarCita(base(), {}).error !== null, 'Sin cita no hay nada que editar');

/* ── 5 · ⚠️ APARTADO 15 — EVENTO PLANIFICADO ≠ HISTORIAL ─────────────────── */

const conAmbos = planificarCorte(conCorte(), { modo: 'fecha', fecha: '2026-09-20' }).estado;
eq(datosPeluqueria(conAmbos).cortes.length, 1, 'Un corte en el historial');
ok(datosPeluqueria(conAmbos).cita !== null, 'Y una cita planificada');

const aviso = avisoEliminarCita(conAmbos);
eq(aviso.titulo, '¿Eliminar este evento?', 'Con la pregunta literal del enunciado');
ok(aviso.texto.includes('historial de cortes no se toca'),
  '⚠️ Y el aviso lo dice antes: el historial no se toca');
eq(avisoEliminarCita(base()), null, 'Sin cita no hay nada que confirmar');

const borrada = eliminarCita(conAmbos);
eq(datosPeluqueria(borrada.estado).cita, null, 'Test 10: la cita se elimina');
eq(datosPeluqueria(borrada.estado).cortes.length, 1,
  '⚠️ Apartado 15: Y EL CORTE SIGUE. Borrar el plan no borra la historia');
eq(borrada.cortesConservados, 1, 'Y se dice cuántos se han conservado');
eq(datosPeluqueria(eliminarCita(base()).estado).cita, null, 'Sin cita, eliminarla no revienta');

// Y al revés: borrar un corte no toca la cita.
const sinCorte = borrarCorte(conAmbos, datosPeluqueria(conAmbos).cortes[0].id).estado;
ok(datosPeluqueria(sinCorte).cita !== null, '⚠️ Y borrar un corte tampoco borra el plan');

/* ── 6 · TEST 7 — CORTE REALIZADO: EL PLAN SE VUELVE HISTORIA (apartado 8) ─ */

const realizado = marcarCorteRealizado(conAmbos);
eq(datosPeluqueria(realizado.estado).cortes.length, 2, '⚠️ Test 7: el corte entra en el historial');
eq(datosPeluqueria(realizado.estado).cita, null, '⚠️ Y la cita desaparece: ya no es un plan');
eq(ultimoCorte(realizado.estado).fecha, '2026-09-20', 'Con la fecha de la cita');
eq(marcarCorteRealizado(conAmbos, { fecha: '2026-09-21' }).estado
  && ultimoCorte(marcarCorteRealizado(conAmbos, { fecha: '2026-09-21' }).estado).fecha, '2026-09-21',
'Y se puede decir que fue otro día');
ok(marcarCorteRealizado(base()).error !== null, 'Sin cita no hay nada que marcar');

/* ── 7 · ⚠️ APARTADO 16 — SUGIERE, NO CREA ──────────────────────────────── */

const conFrecuencia = contestarPelo(conCorte(), 'frecuenciaCorte', 'mes', { hoy: HOY }).estado;
const sug = sugerirProximoCorte(conFrecuencia, {}, { hoy: HOY });
ok(sug.hay, 'Con último corte y frecuencia, se puede sugerir');
eq(sug.fecha, '2026-09-20', 'El 23 de agosto más cuatro semanas: el 20 de septiembre');
ok(sug.texto.includes('podría ser alrededor del'),
  '⚠️ Con las palabras del enunciado: "podría ser alrededor del"');
ok(sug.de.includes('Último corte'), 'Y dice de dónde sale');
ok(!sug.guardado, '⚠️ Apartado 16: SUGIERE — no reserva ni crea nada');
eq(datosPeluqueria(conFrecuencia).cita, null, '⚠️ Y el estado NO ha cambiado: sugerir no escribe');
eq(sug.accion, 'Planificarlo', 'Se le ofrece hacerlo, y lo hace él');

ok(!sugerirProximoCorte(base(), {}, { hoy: HOY }).hay, 'Sin cortes no se sugiere');
eq(sugerirProximoCorte(base(), {}, { hoy: HOY }).motivo, 'sin_cortes', 'Con su motivo');
ok(!sugerirProximoCorte(conCorte(), {}, { hoy: HOY }).hay, 'Sin frecuencia tampoco');
eq(sugerirProximoCorte(conCorte(), {}, { hoy: HOY }).motivo, 'sin_frecuencia', 'Con el suyo');
ok(sugerirProximoCorte(conCorte(), {}, { hoy: HOY }).texto.length > 20,
  '⚠️ Y se dice qué falta, en vez de proponer una frecuencia por defecto');
ok(sugerirProximoCorte(conFrecuencia, {}, { hoy: '2026-12-01' }).pasada, 'Y si la fecha ya pasó, se dice');

/* ── 8 · RECORDATORIOS: SE DECIDEN AQUÍ, SE MANDAN FUERA (apartados 5 y 13) */

eq(ANTELACIONES_AVISO.map((a) => a.nombre),
  ['El mismo día', '1 día antes', '2 días antes', '3 días antes', '1 semana antes'],
  'Las cinco antelaciones del apartado 5');
eq(antelacion('inventada'), null, 'Una que no existe devuelve null');

// ⚠️ Apartado 5 — nace APAGADO.
ok(!datosPeluqueria(porFecha.estado).cita.recordatorio,
  '⚠️ Apartado 5: el recordatorio nace APAGADO — "nunca activarlos de forma invasiva"');
eq(avisoDeCorte(porFecha.estado, { hoy: HOY }).motivo, 'desactivado', 'Y por tanto no avisa');
eq(avisoDeCorte(porFecha.estado, { hoy: HOY }).texto, MOTIVOS_SIN_AVISO.desactivado, 'Con su motivo');

const conAviso = alternarRecordatorio(porFecha.estado).estado;
ok(datosPeluqueria(conAviso).cita.recordatorio, 'Test 5: se puede pedir el recordatorio');
eq(avisoDeCorte(conAviso, { hoy: HOY }).motivo, 'todavia_no', 'Pero todavía no toca');
ok(avisoDeCorte(conAviso, { hoy: '2026-09-17' }).avisar, 'A los tres días antes, sí');
eq(avisoDeCorte(conAviso, { hoy: '2026-09-17' }).titulo, '✂️ Corte de pelo', 'Con su título');
eq(avisoDeCorte(conAviso, { hoy: '2026-09-17' }).emisor, 'notificaciones.js',
  '⚠️ Y declara QUIÉN lo manda: este archivo DECIDE, no emite');
ok(!avisoDeCorte(conAviso, { hoy: '2026-10-01' }).avisar, 'Una cita pasada no avisa');
eq(avisoDeCorte(conAviso, { hoy: '2026-10-01' }).motivo, 'ya_paso', 'Con su motivo');
eq(avisoDeCorte(base(), { hoy: HOY }).motivo, 'sin_cita', 'Sin cita tampoco');

// Test 6 — desactivarlo.
ok(!datosPeluqueria(alternarRecordatorio(conAviso).estado).cita.recordatorio, 'Test 6: y se puede quitar');
ok(alternarRecordatorio(base()).error !== null, 'Sin cita no hay recordatorio que tocar');

// ⚠️ Apartado 13 — son dos cosas independientes.
const sinAviso = alternarRecordatorio(conAviso).estado;
eq(eventosDePeluqueria(sinAviso).length, 1,
  '⚠️ Apartado 13: sin recordatorio, EL CALENDARIO SIGUE FUNCIONANDO');
eq(datosPeluqueria(sinAviso).cita.fecha, '2026-09-20', 'Y la cita sigue ahí');

// ⚠️ Este archivo no emite nada.
const fuente = readFileSync(new URL('../src/lib/peluqueria.js', import.meta.url), 'utf8');
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
['new Notification', 'showNotification', 'notificarSiCorresponde', 'requestPermission'].forEach((x) => {
  ok(!codigo.includes(x), `⚠️ Este archivo DECIDE, no manda: ni "${x}"`);
});

/* ── 9 · TEST 11 — CALENDARIO GENERAL (apartado 6) ──────────────────────── */

const ev = eventosDePeluqueria(conAviso);
eq(ev.length, 1, 'Test 11: un evento en el calendario');
eq(ev[0].titulo, '✂️ Corte de pelo', 'Con el título del enunciado');
eq(ev[0].fecha, '2026-09-20', 'Y su fecha');
ok(ev[0].soloLectura, '⚠️ De solo lectura (regla 11)');
eq(ev[0].origen, 'pelo', 'Con su origen');
eq(Object.keys(ev[0]).sort(),
  ['fecha', 'horaFin', 'horaInicio', 'id', 'notas', 'origen', 'origenId', 'soloLectura', 'tipo', 'titulo', 'todoElDia', 'ubicacion'].sort(),
  '⚠️ Con la MISMA forma que los del Armario y los de las rutinas: encaja sin adaptadores');
eq(eventosDePeluqueria(base()), [], 'Sin cita, ningún evento');
eq(eventosDePeluqueria(alternarParte(conAviso, PARTE_PELUQUERIA)), [],
  'Con Peluquería apagada, tampoco');
// ⚠️ Una sola cita, no una serie.
eq(eventosDePeluqueria(conAviso).length, 1, '⚠️ UNA cita, no una recurrencia: el próximo corte es un plan concreto');
ok(!/DEFAULT_CALENDARIO|crearEvento|expandirRecurrentes/.test(codigo),
  '⚠️ Apartado 6: no se crea un segundo calendario');

/* ── 10 · SITIOS (apartado 12) ──────────────────────────────────────────── */

const conSitio = anadirSitio(conCorte(), { nombre: 'La de siempre', lugar: 'Calle Mayor', nota: 'Preguntar por Luis' }).estado;
eq(datosPeluqueria(conSitio).sitios.length, 1, 'Apartado 12: se guarda dónde se corta');
eq(datosPeluqueria(conSitio).sitios[0].lugar, 'Calle Mayor', 'Con su lugar');
ok(anadirSitio(conSitio, { nombre: 'la de siempre' }).sinEfecto, 'No se duplica por mayúsculas');
ok(anadirSitio(base(), { nombre: '  ' }).error !== null, 'Y necesita un nombre');
// ⚠️ Borrar un sitio DESENGANCHA, no borra.
const idSitio = datosPeluqueria(conSitio).sitios[0].id;
const conCorteEnSitio = registrarCorte(conSitio, { fecha: '2026-07-20', sitioId: idSitio }).estado;
const sinSitio = borrarSitio(conCorteEnSitio, idSitio).estado;
eq(datosPeluqueria(sinSitio).sitios.length, 0, 'Se borra el sitio');
eq(datosPeluqueria(sinSitio).cortes.length, 2, '⚠️ Y los cortes siguen: se desenganchan, no se borran');
eq(datosPeluqueria(sinSitio).cortes.find((c) => c.fecha === '2026-07-20').sitioId, null, 'Sin sitio asociado');

// ⚠️ *"No crear todavía un sistema completo de reservas."*
eq(resumenPeluqueria(conSitio, {}, { hoy: HOY }).reservas, 0, '⚠️ Apartado 12: cero reservas');
['reserva', 'disponibilidad', 'horarioTienda', 'telefono'].forEach((x) => {
  ok(!new RegExp(`(function|const)\\s+\\w*${x}`, 'i').test(codigo), `Ni una función de "${x}"`);
});

/* ── 11 · TESTS 12, 13 Y 14 — DESACTIVAR Y REACTIVAR (apartado 14) ──────── */

const completo = alternarRecordatorio(planificarCorte(
  anadirSitio(varios, { nombre: 'Mi barbería' }).estado, { modo: 'fecha', fecha: '2026-09-20' },
).estado).estado;

const imp = impactoDesactivarPeluqueria(completo, { hoy: HOY });
eq(imp.cortes, 5, 'El impacto dice cuántos cortes hay');
eq(imp.citaFutura, '2026-09-20', '⚠️ Y avisa de la cita futura');
ok(imp.texto.includes('Se queda guardado'), '⚠️ Diciendo que NO se borra: apagar no es cancelar');
ok(!imp.seBorraAlgo, 'Y que no se borra nada');
ok(!impactoDesactivarPeluqueria(varios, { hoy: HOY }).citaFutura, 'Sin cita futura, no se avisa de ninguna');
ok(impactoDesactivarPeluqueria(varios, { hoy: HOY }).texto.includes('se conservan'), 'Pero sí de lo que se conserva');

const apagada = alternarParte(completo, PARTE_PELUQUERIA);
ok(!resumenPeluqueria(apagada, {}, { hoy: HOY }).activo, 'Test 12: se puede desactivar');
eq(datosPeluqueria(apagada).cortes.length, 5, '⚠️ Test 14: el historial se conserva');
ok(datosPeluqueria(apagada).cita !== null, '⚠️ Test 14: y la cita futura NO se borra sola');
eq(datosPeluqueria(apagada).sitios.length, 1, 'Test 14: y los sitios');
eq(eventosDePeluqueria(apagada), [], 'Pero deja de salir en el calendario');
eq(avisoDeCorte(apagada, { hoy: '2026-09-17' }).motivo, 'modulo_apagado', 'Y no avisa');

const reactivada = alternarParte(apagada, PARTE_PELUQUERIA);
eq(datosPeluqueria(reactivada).cortes.length, 5, 'Test 13: reactivada, todo sigue');
eq(eventosDePeluqueria(reactivada).length, 1, 'Y vuelve al calendario');

// Y apagar el módulo Pelo entero tampoco borra nada.
eq(datosPeluqueria(alternarModulo(completo, MODULO_PELO, false)).cortes.length, 5,
  'Apagar Pelo entero tampoco borra el historial (F1, apartado 7)');

/* ── 12 · PERSISTENCIA Y CONVIVENCIA CON LAS FASES 8, 9 Y 10 ────────────── */

const guardado = normalizarEstiloHombre(JSON.parse(JSON.stringify(completo)));
eq(datosPeluqueria(guardado).cortes.length, 5, 'Los cortes sobreviven al guardado');
ok(datosPeluqueria(guardado).cita !== null, '⚠️ Y la cita: noveno campo enseñado a un normalizador');
eq(datosPeluqueria(guardado).sitios.length, 1, 'Y los sitios');

const conTodo = crearProductoPelo(crearRutina(guardado, { nombre: 'R', pasos: [{ accion: 'lavado' }] }, { hoy: HOY }).estado,
  { nombre: 'Champú' }, { hoy: HOY }).estado;
eq(datosPeluqueria(conTodo).cortes.length, 5, '⚠️ Crear una rutina y un producto no pisa la peluquería');
eq(datosPelo(conTodo).rutinas.length, 1, 'Y la rutina entra');
eq(datosPelo(conTodo).productos.length, 1, 'Y el producto');

// Entradas rotas.
[null, undefined, 'roto', 42, { cortes: 'x' }, { cita: 'x' }, { sitios: [null] }, { semanas: 'x' }]
  .forEach((malo, i) => {
    const d = normalizarPeluqueria(malo);
    ok(Array.isArray(d.cortes) && Array.isArray(d.sitios), `Peluquería corrupta ${i} no revienta`);
  });
eq(normalizarPeluqueria({ cita: { fecha: 5 } }).cita, null, 'Una cita sin fecha válida se descarta');
eq(normalizarPeluqueria({ cortes: [{ nota: 'x' }] }).cortes, [], 'Un corte sin fecha, también');
/* ⚠️ Lo que esta comprobación guarda es que `cortes` y `cita` sean DOS cosas,
   no cuántas llaves hay: la Fase 12 añadió `objetivo` con todo el derecho, y
   una cuenta exacta habría saltado por algo que estaba bien — la quinta vez que
   pasa en este bloque. Así que se comprueba lo que importa. */
ok(Array.isArray(DEFAULT_PELUQUERIA.cortes) && 'cita' in DEFAULT_PELUQUERIA
  && DEFAULT_PELUQUERIA.cortes !== DEFAULT_PELUQUERIA.cita,
  '⚠️ `cortes` y `cita` son DOS cosas separadas: es el apartado 15');
ok(!Object.keys(DEFAULT_PELUQUERIA).some((k) => /hecho|realizado|pasado/i.test(k)),
  '⚠️ Y no hay un campo "hecho" en ninguna parte: eso las volvería a juntar');
eq(DEFAULT_PELUQUERIA.cita, null, 'Sin cita por defecto');

/* ── 13 · EL PANEL (apartado 1) ─────────────────────────────────────────── */

const panel = panelPeluqueria(completo, {}, { hoy: HOY });
eq(panel.ultimo.fecha, '2026-08-21', 'Apartado 1: el último corte');
eq(panel.proximo.fecha, '2026-09-20', 'Y el próximo');
ok(panel.proximo.planificado, 'Marcado como planificado');
ok(panel.real.suficiente, 'Con su frecuencia real');
ok(!panel.sinNada, 'Y no está vacío');

const vacio = panelPeluqueria(base(), {}, { hoy: HOY });
eq(vacio.ultimo, null, '⚠️ Sin cortes: `null`, no una fecha inventada');
eq(vacio.proximo, null, 'Ni un próximo');
eq(vacio.sugerido, null, 'Ni una sugerencia');
ok(vacio.sinNada, 'Y se sabe que está vacío');
ok(vacio.textoVacio.length > 20, '⚠️ Con una frase que dice qué hacer (regla 8)');

// Con corte y frecuencia pero sin cita: sale la sugerencia, no una cita fantasma.
const soloSug = panelPeluqueria(conFrecuencia, {}, { hoy: HOY });
eq(soloSug.proximo, null, '⚠️ Sin cita planificada, `proximo` es null');
ok(soloSug.sugerido !== null, 'Pero sí hay sugerencia');
ok(!soloSug.sugerido.guardado, 'Y se ve que no está guardada');

const res = resumenPeluqueria(completo, {}, { hoy: HOY });
eq(res.cortes, 5, 'Cinco cortes');
eq(res.proximo, '2026-09-20', 'Y el próximo');
ok(res.recordatorio, 'Con recordatorio');
ok(!res.avisaHoy, 'Que hoy no toca');
ok(resumenPeluqueria(completo, {}, { hoy: '2026-09-17' }).avisaHoy, 'Pero el 17 sí');
eq(resumenPeluqueria(base(), {}, { hoy: HOY }).cortes, 0, 'Sin nada, cero — y no revienta');

/* ═══════════════════════════════════════════════════════════════════════════
   15 · EL ENCHUFE AL CALENDARIO DE VERDAD (apartado 6)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ `eventosDePeluqueria` puede funcionar perfectamente y no salir en ningún
   sitio si nadie la llama. Esto comprueba el enchufe, no la función: es
   exactamente lo que se rompe en silencio cuando alguien toca
   `eventosDerivados`. */
console.log('\n15 · El enchufe al calendario global');

const { eventosDerivados, NOMBRES_ORIGEN } = await import('../src/lib/calendarioIntegracion.js');

const delCalendario = eventosDerivados({
  estiloHombre: conAviso, desde: '2026-09-01', hasta: '2026-09-30',
});
ok(delCalendario.some((e) => e.id === `peluqueria:${datosPeluqueria(conAviso).cita.id}`),
  '⚠️ La cita sale por `eventosDerivados`, el calendario que ya existe (regla 11)');
ok(delCalendario.filter((e) => e.origen === 'pelo' && e.titulo.includes('Corte')).every((e) => e.soloLectura),
  'Y de solo lectura: en el calendario se ve, se edita en Peluquería');
eq(NOMBRES_ORIGEN.pelo, 'Pelo', 'Con su nombre de origen para el botón "Abrir en..."');

// ⚠️ Sin rango sigue saliendo: una cita es una fecha concreta, no una regla.
ok(eventosDerivados({ estiloHombre: conAviso }).some((e) => e.origen === 'pelo'),
  'Sin rango también: la cita no es una recurrencia que haya que acotar');
eq(eventosDerivados({}).length, 0, 'Y sin nada, ningún evento — no revienta');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
