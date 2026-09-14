/* Finalización y guardado del entrenamiento (Entrega 4 · FIT F8/45).
 *
 * El apartado 37 agrupa las validaciones en Entrenamiento normal, Datos,
 * Parcial, Descartar, Recuperación, Doble guardado y Técnica; el 38 pide poder
 * hacer *"Empezar → entrenar → Terminar → revisar resumen → modificar
 * nombre/notas → guardar → cerrar aplicación → volver"* y encontrarlo todo.
 *
 * 🚨 Las cuatro cosas que más se vigilan:
 *   · Apartado 17, marcado como MUY IMPORTANTE — **guardado idempotente**: se
 *     pulsa cinco veces y hay UNA sesión completada.
 *   · Apartado 6 — una serie cuenta **solo si él la marcó**, nunca por estar
 *     planificada.
 *   · Apartado 9 — el volumen **solo si se puede calcular**: unas dominadas a
 *     peso corporal no son 0 kg.
 *   · Apartado 24 — completar un entrenamiento **no toca el plan ni la
 *     plantilla**, y se compara antes y después.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  nombrePorDefecto, fechaLarga, horaDe, duracionEnMinutos,
  ESTADOS_EJERCICIO, resumenDeEjercicio, volumenDeSesion, resumenDeSesion,
  pasarAFinalizacion, sesionEnFinalizacion, AVISO_RECUPERAR_FINAL,
  AVISO_SIN_SERIES, AVISO_DESCARTAR_FINAL, TEXTO_GUARDANDO, diaDePlanDe,
  guardarEntrenamiento, descartarEntrenamiento, MENSAJES_FINAL, mensajeFinal,
  pantallaDeExito, NO_EN_FIT8, MEDIA_PENDIENTE, PREPARADO_PARA_FIT8,
  auditarFinalizacion, aplicarGuardado,
} from '../src/lib/finalizacion.js';
import {
  DEFAULT_FITNESS, ESTADOS_SESION, VISIBILIDADES, crearWorkoutSession,
} from '../src/lib/fitness.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, anadirSerie,
  quitarSerie, sustituirEjercicio, notaDeEjercicio, guardarSesion, sesionActiva,
  duracionSesion, normalizarFitnessConSesiones,
} from '../src/lib/entrenamiento.js';
import { usarPlan, diaARutina, planPorId, CATALOGO_PLANES } from '../src/lib/planes.js';
import { planActivoCompleto, semanaDelPlan, estadoDia } from '../src/lib/tuPlan.js';
import { crearRutina, anadirEjercicio, rutinaAPlan, planARutina } from '../src/lib/constructor.js';

const RAIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ_DIR, p), 'utf8');
/* La lección de siempre, ya por la trigésima vez: un barrido que comprueba que
   el código NO hace algo tiene que quitar comentarios y cadenas. */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const LUNES = '2026-09-14';
const T0 = Date.UTC(2026, 8, 14, 16, 5, 0);
const min = (n) => T0 + n * 60 * 1000;

const F_CON_PLAN = usarPlan({ ...DEFAULT_FITNESS }, 'ppl-estetico', { hoy: LUNES }).fitness;
const RESUELTO = planActivoCompleto(F_CON_PLAN);
const DIA_0 = diaARutina(RESUELTO.plan, 0, []);
const PLAN_ORIGINAL = JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES));

const nueva = () => empezarSesion({
  nombre: DIA_0.nombre, lineas: DIA_0.lineas, planId: RESUELTO.activo.planId,
  origenTipo: 'preset', origenId: DIA_0.id, ahora: T0, hoy: LUNES,
});

/* Un entrenamiento con datos de verdad: el primer ejercicio entero a 60 kg × 10
   más una serie añadida a 55 × 8 y una nota; el segundo a medias, con una hecha
   y otra omitida; el resto sin tocar. */
/* ⚠️ El primer ejercicio del PPL tiene **cuatro** series, no tres: el escenario
   se construye de lo que el plan trae de verdad, no de lo que yo suponga. Fue un
   rojo mío: marcaba tres y luego exigía «realizado». */
const SERIES_E1 = DIA_0.lineas[0].series;
function entrenada() {
  let s = nueva();
  const e = ejerciciosDeSesion(s)[0];
  e.series.forEach((x) => {
    s = editarSerie(s, e.id, x.id, { peso: 60, reps: 10 });
    s = marcarSerie(s, e.id, x.id, true);
  });
  s = anadirSerie(s, e.id);
  const extra = ejerciciosDeSesion(s)[0].series.slice(-1)[0];
  s = editarSerie(s, e.id, extra.id, { peso: 55, reps: 8 });
  s = marcarSerie(s, e.id, extra.id, true);
  s = notaDeEjercicio(s, e.id, 'La cuarta con menos peso.');
  /* El segundo ejercicio se queda a medias: una hecha de sus series. */
  const e2 = ejerciciosDeSesion(s)[1];
  s = editarSerie(s, e2.id, e2.series[0].id, { peso: 40, reps: 12 });
  s = marcarSerie(s, e2.id, e2.series[0].id, true);
  if (e2.series[1]) s = quitarSerie(s, e2.id, e2.series[1].id);
  return s;
}

console.log('\n═══ FIT F8/45 · Finalización y guardado ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Terminar lleva al resumen, no a completada (apartados 1 y 16) ──');

const VIVA = entrenada();
const FIN = pasarAFinalizacion(VIVA, { ahora: min(57) });
ok(FIN.estado === 'finalizando',
  `🚨 Terminar deja la sesión en «finalizando», NO en completada (${FIN.estado}, apartado 16)`);
ok(ESTADOS_SESION.includes('finalizando'), '…y es un estado del modelo de la F1, ampliado');
ok(FIN.terminadaEn === min(57), '🚨 …y el reloj se para AHÍ: `terminadaEn` es cuándo acabó de entrenar');
ok(FIN.id === VIVA.id, '…es la misma sesión, no una nueva');
ok(ejerciciosDeSesion(FIN).length === ejerciciosDeSesion(VIVA).length, '…con su snapshot entero');
ok(duracionSesion(FIN, min(300)) === 57 * 60000,
  '🚨 …y la duración se congela en 57 min aunque pasen horas en el resumen (apartado 22)');
ok(pasarAFinalizacion(null) === null, '…y sin sesión no se inventa nada');

/* Desde pausa, el rato parado sigue sin contar. */
const PAUSADA = { ...VIVA, estado: 'pausada', pausadaEn: min(20) };
const FIN_P = pasarAFinalizacion(PAUSADA, { ahora: min(50) });
ok(FIN_P.pausadoMs === 30 * 60000, '⚠️ Terminar desde pausa cierra la pausa: los 30 min parados no cuentan');
ok(duracionSesion(FIN_P, min(50)) === 20 * 60000, '…así que dura 20 min, no 50');

/* 🚨 Y `terminarSesion` de la F7 ya no existe: se retiró en vez de quedarse
   sin quien la llame (E3 F1, E3 F5, E3 F16 y E3 F44). */
const LIB_F7 = leer('src/lib/entrenamiento.js');
ok(!/export function terminarSesion/.test(LIB_F7),
  '🚨 `terminarSesion` de la F7 se RETIRA: una función que nadie llama no falla nunca');
ok(!/export const AVISO_TERMINAR/.test(LIB_F7), '…y su aviso también');
ok(/pasarAFinalizacion/.test(leer('src/views/EntrenamientoVivoView.jsx')),
  '…y la pantalla llama a la de esta fase');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El nombre, la fecha y las horas (apartados 3, 4 y 5) ──');

ok(nombrePorDefecto(FIN) === DIA_0.nombre,
  `🚨 El nombre del plan MANDA sobre «Entrenamiento del lunes» (${nombrePorDefecto(FIN)}, apartado 3)`);
const SUELTA = crearWorkoutSession({ nombre: '', fecha: LUNES });
ok(nombrePorDefecto(SUELTA) === 'Entrenamiento del lunes',
  `…y sin plan, «Entrenamiento del [día]» (${nombrePorDefecto(SUELTA)}, apartado 3, su ejemplo)`);
ok(nombrePorDefecto(crearWorkoutSession({ nombre: 'Entrenamiento', fecha: LUNES })) === 'Entrenamiento del lunes',
  '…y un «Entrenamiento» genérico tampoco se queda así');
ok(nombrePorDefecto({ fecha: 'no-es-fecha' }) === 'Entrenamiento', '…y con una fecha rota no revienta');

ok(fechaLarga(LUNES) === '14 septiembre 2026',
  `🚨 *"12 septiembre 2026"*, el formato del apartado 4 (${fechaLarga(LUNES)})`);
ok(fechaLarga('') === '' && fechaLarga('2026-13-45') === '', '…y una fecha imposible no se pinta');
/* ⚠️ La hora sale del reloj del dispositivo, así que se compara contra él. */
const esperada = new Date(T0);
const hh = `${String(esperada.getHours()).padStart(2, '0')}:${String(esperada.getMinutes()).padStart(2, '0')}`;
ok(horaDe(T0) === hh, `La hora de inicio (${horaDe(T0)})`);
ok(horaDe(null) === '' && horaDe(undefined) === '', '⚠️ …y sin marca no se inventa una hora');

ok(duracionEnMinutos(57 * 60000) === '57 min', `*"57 min"* (apartado 5, ${duracionEnMinutos(57 * 60000)})`);
ok(duracionEnMinutos(90 * 60000) === '1 h 30 min', `…y con horas (${duracionEnMinutos(90 * 60000)})`);
ok(duracionEnMinutos(60 * 60000) === '1 h', '…una hora clavada se dice «1 h»');
ok(duracionEnMinutos(20000) === 'menos de 1 min',
  '⚠️ …y menos de un minuto se DICE, en vez de enseñar «0 min»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Una serie cuenta solo si él la marcó (apartados 6 y 10) ──');

const R = resumenDeSesion(FIN);
ok(R.seriesCompletadas === SERIES_E1 + 2,
  `🚨 Las series que MARCÓ, ni una más (${R.seriesCompletadas})`);
ok(R.seriesPlanificadas > R.seriesCompletadas,
  `…de ${R.seriesPlanificadas} que contaban: estar en el plan NO cuenta (apartado 6)`);
ok(/\d+\/\d+ series completadas/.test(R.seriesTexto),
  `*"16/20 series completadas"* (apartado 25, ${R.seriesTexto})`);
ok(R.seriesOmitidas === 1, `…y una omitida, que se enseña aparte (${R.seriesOmitidas}, apartado 6)`);
ok(R.seriesAnadidas === 1, `…y una añadida, que NO desaparece (${R.seriesAnadidas}, apartado 11)`);

const E1 = R.ejercicios[0];
ok(E1.estado === 'realizado', `El primero, realizado (${E1.estado})`);
ok(new RegExp(`^${SERIES_E1 + 1}/${SERIES_E1 + 1} series$`).test(E1.texto),
  `…con todas hechas, la añadida incluida (${E1.texto})`);
ok(E1.peso === '55–60', `…y el rango de peso que usó (${E1.peso})`);
ok(E1.reps === '8–10', `…y el de repeticiones (${E1.reps})`);
ok(E1.notas === 'La cuarta con menos peso.', '…con la nota que escribió en la F7 (apartado 13)');
ok(E1.anadidas === 1, '…y sabe que una la añadió él');

const E2 = R.ejercicios[1];
ok(E2.estado === 'parcial', `🚨 El segundo, PARCIAL (${E2.estado}, apartado 10)`);
ok(/^1\/\d+ series$/.test(E2.texto), `…con su «2/3 series» (${E2.texto}, el ejemplo del apartado)`);

const E3 = R.ejercicios[2];
ok(E3.estado === 'no_realizado', `🚨 Y el tercero, NO REALIZADO (${E3.estado})`);
ok(E3.hechas === 0, '…con cero series hechas');
ok(R.ejerciciosHechos === 2, `…así que se han tocado 2 ejercicios de ${R.ejercicios.length} (apartado 8)`);
ok(ESTADOS_EJERCICIO.length === 3 && ESTADOS_EJERCICIO.every((e) => e.id && e.nombre && e.que),
  'Los tres estados de un ejercicio, cada uno con su explicación');
ok(resumenDeEjercicio(null) === null, '…y sin ejercicio no hay resumen');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El volumen, solo si se puede calcular (apartados 8 y 9) ──');

const V = R.volumen;
ok(V !== null, 'Con peso y repeticiones, hay volumen (apartado 9)');
ok(V.kg === 60 * 10 * SERIES_E1 + 55 * 8 + 40 * 12,
  `…peso × repeticiones, serie a serie (${V.kg} kg)`);
ok(V.series === SERIES_E1 + 2, `…de las ${V.series} series con carga`);
ok(V.parcial === false, '…y aquí no queda ninguna fuera');

/* 🚨 Una rutina de calistenia entera: ni una serie con peso. */
const R_CALI = anadirEjercicio(crearRutina({ nombre: 'Calistenia' }), 'dominada-prona');
let CALI = empezarSesion({ nombre: 'Calistenia', lineas: R_CALI.lineas, ahora: T0, hoy: LUNES });
const EC = ejerciciosDeSesion(CALI)[0];
CALI = editarSerie(CALI, EC.id, EC.series[0].id, { reps: 12 });
CALI = marcarSerie(CALI, EC.id, EC.series[0].id, true);
ok(volumenDeSesion(CALI) === null,
  '🚨 Unas dominadas a peso corporal NO tienen volumen: `null`, no «0 kg» (apartado 9, literal)');
ok(resumenDeSesion(CALI).volumen === null, '…y el resumen tampoco lo trae');
ok(resumenDeSesion(CALI).seriesCompletadas === 1, '…pero la serie SÍ cuenta: lo que no se mide es la carga');

/* Una mezcla: unas con peso y otras no, y se DICE. */
let MIX = CALI;
const EM = ejerciciosDeSesion(MIX)[0];
MIX = editarSerie(MIX, EM.id, EM.series[1].id, { peso: 10, reps: 8 });
MIX = marcarSerie(MIX, EM.id, EM.series[1].id, true);
const VM = volumenDeSesion(MIX);
ok(VM && VM.kg === 80, `Con lastre, el volumen sale de esa serie (${VM?.kg} kg)`);
ok(VM.parcial === true && VM.fuera === 1,
  '🚨 …y se DICE que una queda fuera: si no, el número parecería el total');
ok(volumenDeSesion(nueva()) === null, '⚠️ Y sin ninguna serie marcada tampoco hay volumen');
/* Un peso de cero no es carga. */
let CERO = nueva();
const ECE = ejerciciosDeSesion(CERO)[0];
CERO = editarSerie(CERO, ECE.id, ECE.series[0].id, { peso: 0, reps: 10 });
CERO = marcarSerie(CERO, ECE.id, ECE.series[0].id, true);
ok(volumenDeSesion(CERO) === null, '⚠️ …y un peso de 0 kg es peso corporal, no una carga de cero');

/* 🚨 Y NADA de calorías (apartado 8, con ese ejemplo). */
const LIB = leer('src/lib/finalizacion.js');
const VISTA = leer('src/views/FinalizacionView.jsx');
ok(!/calor[ií]a/i.test(soloCodigo(LIB)) && !/calor[ií]a/i.test(soloCodigo(VISTA)),
  '🚨 Ni una caloría quemada: *"NO mostrar calorías quemadas si no existe un modelo fiable"*');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Guardar, y que sea IDEMPOTENTE (apartados 16 y 17) ──');

const G = guardarEntrenamiento(FIN, { nombre: 'Push — Fuerza', notas: 'Me noté fuerte.' });
ok(G.ok === true, 'Se guarda');
ok(G.sesion.estado === 'completada', `…y queda completada (${G.sesion.estado}, apartado 16)`);
ok(G.sesion.nombre === 'Push — Fuerza', '…con el nombre que él escribió (apartado 3)');
ok(G.sesion.notas === 'Me noté fuerte.', '…y su nota general (apartado 13)');
ok(!!G.sesion.guardadaEn, '…apuntando cuándo la guardó');
ok(G.sesion.terminadaEn === min(57),
  '🚨 …y `terminadaEn` NO se mueve: el entrenamiento acabó cuando acabó (apartado 22)');
ok(G.sesion.visibilidad === 'privado', '…privada (apartado 15)');
ok(G.sesion.id === FIN.id, '…y es la MISMA sesión, con su id');

/* 🚨 La comprobación del apartado 17, que está marcado como MUY IMPORTANTE. */
let FIT = guardarSesion(F_CON_PLAN, FIN);
let ultima = FIN;
for (let i = 0; i < 5; i += 1) {
  const r = aplicarGuardado(FIT, ultima, { nombre: 'Push — Fuerza' });
  FIT = r.fitness;
  ultima = r.sesion;
}
ok(FIT.sesiones.length === 1,
  `🚨 Pulsar guardar CINCO veces deja UNA sola sesión (${FIT.sesiones.length}, apartado 17)`);
ok(FIT.sesiones[0].estado === 'completada', '…completada');
ok(FIT.sesiones[0].id === FIN.id, '…y con el id de siempre');
const SEGUNDA = guardarEntrenamiento(G.sesion);
ok(SEGUNDA.ok === true && SEGUNDA.motivo === 'ya_guardada',
  '🚨 …y volver a guardar una ya guardada lo DICE, sin tocar nada');
ok(SEGUNDA.sesion === G.sesion, '…devolviendo exactamente la misma');
ok(SEGUNDA.sesion.guardadaEn === G.sesion.guardadaEn, '…sin ni siquiera mover la hora de guardado');

ok(guardarEntrenamiento(null).ok === false, '…y sin sesión contesta que no hay nada que guardar');
ok(guardarEntrenamiento({ ...FIN, estado: 'inventado' }).ok === false,
  '…y con un estado que no existe, tampoco');
ok(TEXTO_GUARDANDO === 'Guardando entrenamiento…',
  'Y el estado de carga del apartado 18, con sus palabras');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Parcial y casi vacío (apartados 25 y 26) ──');

ok(guardarEntrenamiento(pasarAFinalizacion(entrenada(), { ahora: min(57) })).ok === true,
  '🚨 Un entrenamiento PARCIAL se guarda sin pelear: *"No penalizar ni bloquear"* (apartado 25)');

const VACIA = pasarAFinalizacion(nueva(), { ahora: min(3) });
const GV = guardarEntrenamiento(VACIA);
ok(GV.ok === false && GV.motivo === 'vacio',
  '🚨 Sin ni una serie marcada, se PREGUNTA (apartado 26)');
ok(GV.aviso === AVISO_SIN_SERIES, '…con el aviso del apartado');
ok(AVISO_SIN_SERIES.titulo === 'No has completado ninguna serie', '…y su título literal');
ok(AVISO_SIN_SERIES.seguir === 'Seguir entrenando' && AVISO_SIN_SERIES.guardar === 'Guardar igualmente',
  '…y sus dos opciones, también literales');
const GV2 = guardarEntrenamiento(VACIA, { confirmado: true });
ok(GV2.ok === true && GV2.sesion.estado === 'completada',
  '⚠️ …y confirmando SÍ se guarda: se pregunta, no se bloquea');
ok(resumenDeSesion(VACIA).vacio === true, '…y el resumen sabe que está vacío');
ok(resumenDeSesion(FIN).vacio === false, '…y que el otro no');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Descartar (apartado 27) ──');

const D = descartarEntrenamiento(FIN);
ok(D.ok === false && D.aviso === AVISO_DESCARTAR_FINAL, 'Descartar PREGUNTA');
ok(AVISO_DESCARTAR_FINAL.titulo === '¿Descartar entrenamiento?', '…con su título literal');
ok(AVISO_DESCARTAR_FINAL.texto === 'Se perderán los datos registrados en esta sesión.',
  '…y su texto literal');
const D2 = descartarEntrenamiento(FIN, { confirmado: true });
ok(D2.ok === true && D2.sesion.estado === 'descartada', '…y confirmando la descarta');
ok(ejerciciosDeSesion(D2.sesion).length > 0,
  '⚠️ …sin BORRARLA: se marca, y el historial de la F10 la seguirá viendo');
/* ⚠️ Dos sesiones DISTINTAS: `G.sesion` y `D2.sesion` salen de la misma y
   comparten id, así que `guardarSesion` las fusionaba por id —correctamente— y
   la comprobación no medía lo que decía medir. Otro rojo mío. */
const OTRA = guardarEntrenamiento(pasarAFinalizacion(entrenada(), { ahora: min(40) })).sesion;
const FIT_D = guardarSesion(guardarSesion(F_CON_PLAN, OTRA), D2.sesion);
ok(FIT_D.sesiones.length === 2, '🚨 …y NO se lleva por delante otras sesiones (apartado 27)');
ok(FIT_D.sesiones.some((s) => s.estado === 'completada'), '…la completada sigue ahí');
ok(sesionActiva(FIT_D) === null, '…y ninguna queda como activa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Recuperar la finalización (apartado 28) ──');

const FIT_FIN = guardarSesion(F_CON_PLAN, FIN);
ok(sesionEnFinalizacion(FIT_FIN)?.id === FIN.id,
  '🚨 Una sesión terminada y SIN GUARDAR se encuentra al volver (apartado 28)');
ok(sesionActiva(FIT_FIN) === null,
  '🚨 …y NO se ofrece como «en curso»: ya no se entrena, se guarda');
ok(AVISO_RECUPERAR_FINAL.continuar === 'Terminar de guardarlo',
  '…con su propio texto, distinto del de la F7');
ok(sesionEnFinalizacion(guardarSesion(F_CON_PLAN, G.sesion)) === null,
  '…y una ya guardada no se vuelve a ofrecer');
ok(sesionEnFinalizacion({}) === null && sesionEnFinalizacion(null) === null, '…ni sin sesiones');

/* 🚨 Y sobrevive a la puerta de carga, que es lo que pasa de verdad al recargar. */
const RECARGADO = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(FIT_FIN)));
const REC = sesionEnFinalizacion(RECARGADO);
ok(!!REC, '🚨 …y sigue ahí tras recargar (apartado 28: *"debe seguir recuperable"*)');
ok(REC.estado === 'finalizando', '…en su estado');
ok(ejerciciosDeSesion(REC).length === ejerciciosDeSesion(FIN).length, '…con el snapshot entero');
ok(resumenDeSesion(REC).seriesCompletadas === SERIES_E1 + 2, '…y las series que marcó');
ok(REC.terminadaEn === min(57), '…y su hora de fin, así que la duración sigue bien');

/* Y una sesión guardada ANTES de la F8 no se rompe (apartado 35). */
const VIEJA = normalizarFitnessConSesiones({
  ...DEFAULT_FITNESS,
  sesiones: [{ ...crearWorkoutSession({ nombre: 'De antes', fecha: LUNES }), id: 'vieja' }],
});
ok(VIEJA.sesiones.length === 1, '⚠️ Una sesión de antes de la F8 sigue cargando (apartado 35)');
ok(VIEJA.sesiones[0].visibilidad === 'privado', '…con la visibilidad por defecto, segura');
ok(VIEJA.sesiones[0].media === null && VIEJA.sesiones[0].diaDePlan === null, '…y sin inventarle nada');
ok(VIEJA.sesiones[0].guardadaEn === null, '…ni una hora de guardado que no tuvo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. El plan no se toca, y el día queda registrado (apartados 21 y 24) ──');

ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PLAN_ORIGINAL,
  '🚨 Después de entrenar y guardar, el PLAN de la biblioteca sigue igual (apartado 24)');

const PLANTILLA = rutinaAPlan(anadirEjercicio(crearRutina({ nombre: 'Mi Push' }), 'press-banca-barra'));
const ANTES_PL = JSON.stringify(PLANTILLA);
let SP = empezarSesion({
  nombre: PLANTILLA.nombre, lineas: planARutina(PLANTILLA).lineas, planId: PLANTILLA.id,
  origenTipo: 'plantilla', origenId: PLANTILLA.id, ahora: T0, hoy: LUNES,
});
const EP = ejerciciosDeSesion(SP)[0];
SP = marcarSerie(SP, EP.id, EP.series[0].id, true);
SP = sustituirEjercicio(SP, EP.id, 'press-banca-mancuernas', []);
const GP = guardarEntrenamiento(pasarAFinalizacion(SP, { ahora: min(30) }));
ok(GP.ok === true, 'Se guarda una sesión que salió de una plantilla');
ok(JSON.stringify(PLANTILLA) === ANTES_PL,
  '🚨 …y la PLANTILLA no se entera de nada (apartado 24, literal)');

const RP = resumenDeSesion(GP.sesion);
ok(RP.ejercicios[0].sustituido === true, '🚨 El resumen enseña que hubo sustitución (apartado 12)');
ok(/press/i.test(RP.ejercicios[0].original), `…y de cuál venía (${RP.ejercicios[0].original})`);
ok(RP.ejercicios[0].exerciseId === 'press-banca-mancuernas',
  '…mientras que el que enseña es el que DE VERDAD hizo');
ok(RP.sustituciones === 1, '…y las cuenta');

const DP = GP.sesion.diaDePlan;
ok(!!DP, '🚨 Se registra qué día del plan se completó (apartado 21)');
ok(DP.tipo === 'plantilla' && DP.diaId === PLANTILLA.id, `…con su origen (${DP.tipo})`);
ok(!!DP.nombre, '⚠️ …y el NOMBRE, no solo el id: si borra el plan, la sesión sigue sabiendo cuál era');
ok(diaDePlanDe(crearWorkoutSession({})) === null, '…y una sesión suelta no tiene día de plan');

/* 🔓 Y con eso, el estado «Completado» de la F6 se enciende. */
const SEMANA = semanaDelPlan(planPorId('ppl-estetico'), {
  hoy: '2026-09-16', desde: LUNES, sesiones: [G.sesion],
});
ok(estadoDia('completado').disponible === true,
  '🔓 El estado «Completado» de la F6 ya está disponible: la F8 guarda las sesiones');
ok(SEMANA.find((d) => d.fecha === LUNES)?.estado === 'completado',
  '🔓 …y el lunes sale COMPLETADO, porque hay una sesión guardada de ese día');
ok(semanaDelPlan(planPorId('ppl-estetico'), { hoy: '2026-09-16', desde: LUNES })
  .every((d) => d.estado !== 'completado'),
'🚨 …y sin sesiones, ninguno: el plan dice lo que toca, no lo que se hizo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. La pantalla de éxito (apartados 19 y 20) ──');

const EXITO = pantallaDeExito(G.sesion);
ok(EXITO.titulo === '¡Entrenamiento completado!', 'El título del apartado 19, literal');
ok(EXITO.duracion === '57 min', `…la duración (${EXITO.duracion})`);
ok(EXITO.series === SERIES_E1 + 2, `…y las series (${EXITO.series})`);
ok(!!EXITO.mensaje, '…con un mensaje breve de refuerzo');
ok(EXITO.acciones.length === 2, 'Las dos acciones del apartado 20');
ok(EXITO.acciones.some((a) => a.nombre === 'Ver entrenamiento'), '…«Ver entrenamiento»');
ok(EXITO.acciones.some((a) => a.nombre === 'Volver a Tu Plan'), '…y «Volver a Tu Plan»');
ok(!EXITO.acciones.some((a) => /compartir/i.test(a.nombre)),
  '🚨 …y NI UN «Compartir»: *"Si no existe una funcionalidad real, no mostrar un botón muerto"*');
ok(!/compartir/i.test(soloCodigo(VISTA)), '…tampoco en la pantalla');
ok(pantallaDeExito(null) === null, '…y sin sesión no hay pantalla');
/* 🐛 Y la pantalla entera devuelve `null` sin sesión — comprobado AQUÍ y no en
   el banco de renderizado, que cuenta un render vacío como fallo (FIT F3 con
   `ResumenConstructor`). Pintar un «0 series · 0 min» sería el cero inventado
   de la regla 8. */
ok(resumenDeSesion(null) === null && resumenDeSesion(undefined) === null,
  '⚠️ …ni resumen, así que la vista tampoco pinta nada');

ok(MENSAJES_FINAL.every((m) => typeof m.desde === 'number' && m.texto),
  '⚠️ Los mensajes son una TABLA POR UMBRALES, sin azar (E3 F29)');
ok(mensajeFinal(0) && mensajeFinal(100), '…y siempre hay uno');
const PALABRAS = /flojo|vago|deber[ií]as|mal|peor|poco|insuficiente/i;
ok(!MENSAJES_FINAL.some((m) => PALABRAS.test(m.texto)),
  '🚨 …y ninguno juzga: ni «flojo», ni «deberías» (E3 F13, y van muchas)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. La visibilidad y la foto (apartados 14 y 15) ──');

ok(VISIBILIDADES.length === 3, 'Las tres visibilidades del apartado 15, declaradas');
ok(VISIBILIDADES.filter((v) => v.existe).length === 1,
  '🚨 …y SOLO UNA existe: el sistema social no está (apartado 15)');
ok(VISIBILIDADES.find((v) => v.id === 'privado').existe === true, '…y es «Privado»');
ok(VISIBILIDADES.filter((v) => !v.existe).every((v) => v.enFase), '…las otras dicen qué les falta');
ok(guardarEntrenamiento(FIN, { visibilidad: 'publico' }).sesion.visibilidad === 'privado',
  '🚨 …y pedir una que no existe NO la aplica: se queda privada');
ok(crearWorkoutSession({ visibilidad: 'inventada' }).visibilidad === 'privado',
  '…igual que en el modelo');

ok(MEDIA_PENDIENTE.campo === 'media' && MEDIA_PENDIENTE.porQueNoHayBoton && MEDIA_PENDIENTE.necesita,
  '🚨 La foto o el vídeo: el campo SÍ, el botón NO, con su motivo (apartado 14)');
ok(MEDIA_PENDIENTE.quienDecide === 'Josué', '…y quién lo decide');
ok(crearWorkoutSession({}).media === null, '…y el campo nace vacío');
ok(!/Añadir foto|Añadir v[ií]deo/i.test(VISTA),
  '🚨 …y la pantalla NO pinta el botón: uno que no guarda nada es peor que no tenerlo');
ok(!/https?:\/\//.test(soloCodigo(VISTA)) && !/https?:\/\//.test(soloCodigo(LIB)),
  '⚠️ …ni una URL inventada (apartado 14, literal)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Lo que no se duplica y lo que no se construye ──');

ok(/from '\.\/entrenamiento'/.test(LIB),
  '🚨 El motor de la F7 se IMPORTA: *"No dupliques la lógica de registro de series"*');
ok(!/export function marcarSerie|export function editarSerie|export function crearSerie/.test(LIB),
  '…y aquí no se vuelve a registrar ni una serie');
ok(!/setInterval/.test(soloCodigo(LIB)), '…ni hay un segundo cronómetro (la duración es de la F7)');
ok(!/saveData|supabase/i.test(soloCodigo(LIB)),
  '🚨 …y esta librería NO escribe: quien guarda sigue siendo `App.jsx`');
ok(!/#[0-9a-fA-F]{6}/.test(soloCodigo(LIB)) && !/#[0-9a-fA-F]{6}/.test(soloCodigo(VISTA)),
  '…ni un color escrito a mano (regla 2)');
ok(!/fixed inset-0/.test(soloCodigo(VISTA)), '⚠️ …ni un overlay sin portal (regla 3)');

ok(NO_EN_FIT8.length >= 5 && NO_EN_FIT8.every((x) => x.que && x.porque),
  `Lo excluido, con su motivo (${NO_EN_FIT8.length})`);
ok(NO_EN_FIT8.some((x) => /historial/i.test(x.que)), '…y el historial es la F10 (apartado 29)');
ok(PREPARADO_PARA_FIT8.length >= 4 && PREPARADO_PARA_FIT8.every((x) => x.que && x.donde),
  '⚠️ Y lo que queda preparado, con dónde vive (EH F55)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. La auditoría del apartado 37, EJECUTADA ──');

ok(auditarFinalizacion(G.sesion).ok === true, '🚨 Una sesión guardada pasa la auditoría');
ok(auditarFinalizacion(null).ok === false, '…y sin sesión falla');
/* Y las que demuestran que PUEDE ponerse roja (EH F42). */
ok(auditarFinalizacion(FIN).ok === false, '…salta con una que no está guardada');
ok(auditarFinalizacion({ ...G.sesion, iniciadaEn: null }).ok === false, '…y sin hora de inicio');
ok(auditarFinalizacion({ ...G.sesion, terminadaEn: null }).ok === false, '…y sin hora de fin');
ok(auditarFinalizacion({ ...G.sesion, terminadaEn: T0 - 1000 }).ok === false, '…y si acabó antes de empezar');
ok(auditarFinalizacion({ ...G.sesion, nombre: '' }).ok === false, '…y sin nombre');
ok(auditarFinalizacion({ ...G.sesion, visibilidad: 'inventada' }).ok === false, '…y con una visibilidad que no existe');
ok(auditarFinalizacion({ ...G.sesion, origen: null }).ok === false,
  '…y si perdió el snapshot, que es lo que la haría invisible en el historial (apartado 23)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 14. El recorrido entero del apartado 38 ──');

/* Empezar → entrenar → Terminar → resumen → nombre/notas → guardar → recargar. */
let W = entrenada();
let FF = guardarSesion(F_CON_PLAN, W);
W = pasarAFinalizacion(W, { ahora: min(57) });
FF = guardarSesion(FF, W);
/* Se cierra la aplicación AQUÍ, en el resumen. */
FF = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(FF)));
const VUELTA = sesionEnFinalizacion(FF);
ok(!!VUELTA, '🚨 Apartado 38 — se cierra en el resumen y al volver sigue ahí');
const FINAL = aplicarGuardado(FF, VUELTA, { nombre: 'Push — Fuerza', notas: 'Buen entrenamiento.' });
ok(FINAL.ok === true, '…se guarda');
const TRAS = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(FINAL.fitness)));
const GUARDADA = TRAS.sesiones.find((s) => s.id === VUELTA.id);
ok(GUARDADA?.estado === 'completada', '🚨 …y tras cerrar y volver, está GUARDADA');
ok(GUARDADA.nombre === 'Push — Fuerza', '…con el nombre que le puso');
ok(GUARDADA.notas === 'Buen entrenamiento.', '…y su nota');
const RF = resumenDeSesion(GUARDADA);
ok(RF.seriesCompletadas === SERIES_E1 + 2, `…con sus ${RF.seriesCompletadas} series`);
ok(RF.duracion === '57 min', `…su duración (${RF.duracion})`);
ok(RF.ejercicios[0].notas === 'La cuarta con menos peso.', '…y la nota del ejercicio, de la F7');
ok(RF.volumen.kg === 60 * 10 * SERIES_E1 + 55 * 8 + 40 * 12,
  `…y su volumen (${RF.volumen?.kg} kg)`);
ok(sesionEnFinalizacion(TRAS) === null, '…y ya no se ofrece terminar de guardarla');
ok(sesionActiva(TRAS) === null, '…ni como sesión activa');
ok(auditarFinalizacion(GUARDADA).ok === true, '…con la auditoría en verde de punta a punta');
ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PLAN_ORIGINAL,
  '🚨 …y el plan, después de todo, exactamente igual');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
