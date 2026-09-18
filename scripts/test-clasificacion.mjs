/* Entrega 4 · FIT F17/45 — Clasificación de ejercicios mediante cuestionario.
   ═══════════════════════════════════════════════════════════════════════════
   Los veinte puntos del apartado 36, y sobre todo los dos que sostienen la
   fase: **los datos reales mandan** (apartados 4 y 27) y **una estimación no
   se disfraza de dato** (apartados 7 y 28).

   ⚠️ Lo que más se vigila aquí es que el cuestionario NO toque el historial y
   que NO gane a una sesión de verdad, ni siquiera cuando la sesión sale peor
   que lo que él estimó. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIMITE_CUESTIONARIO, OPCIONES_REPETICIONES, OPCIONES_TIEMPO, OPCIONES_PROGRESION,
  OPCION_NO_LO_SE, REPS_DE_REFERENCIA_CARGA, claseDePregunta, preguntaDeEjercicio,
  opcionesDeCarga, puntuacionDeRespuesta, ejerciciosParaClasificar, clasificarEjercicio,
  olvidarClasificacion, estadoDeClasificacion, clasificacionDe, cuestionario, resumenFinal,
  musculosQueRecibe, AVISO_RECLASIFICAR, AVISO_ESTIMACION, NO_EN_FIT17, DECISIONES_FIT17,
} from '../src/lib/clasificacion.js';
import { rangoDeEjercicio, rangoGlobal, rangoDeGrupo, rangosDeEjercicios, puntuacionDeMarca } from '../src/lib/rangos.js';
import { DEFAULT_FITNESS, normalizarFitness, crearClasificacion, CTA_CLASIFICAR } from '../src/lib/fitness.js';
import { ejercicioPorId, todosLosEjercicios } from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { addDays } from '../src/lib/helpers.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-18';
let dia = 0;
function sesion(exerciseId, valores, cambios = {}) {
  dia += 1;
  const fecha = addDays(HOY, -40 + dia);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const ej = (id) => ejercicioPorId(id, []);

console.log('\n\x1b[1m1 · QUÉ SE PREGUNTA, Y A QUIÉN (apartados 2, 18 y 31)\x1b[0m');

const seleccion = ejerciciosParaClasificar({ ...DEFAULT_FITNESS }, {});
ok(seleccion.length === LIMITE_CUESTIONARIO,
  `🚨 No se le sueltan cien ejercicios: salen ${seleccion.length} (apartado 18)`);
ok(seleccion.every((e) => claseDePregunta(e)),
  '🚨 Todos admiten una pregunta fiable; los que no, no aparecen (apartado 31)');
ok(seleccion.every((e) => !(e.tipos || []).includes('movilidad')),
  '⚠️ La movilidad queda fuera: no tiene referencia razonable (apartado 2)');
const gruposCubiertos = new Set(seleccion.flatMap((e) => musculosQueRecibe(e.id, {}).map((m) => m.grupoId)));
ok(gruposCubiertos.size >= 6,
  `🚨 La selección reparte por el cuerpo (${gruposCubiertos.size} grupos tocados), no seis de empuje seguidos`);
ok(ejerciciosParaClasificar({ ...DEFAULT_FITNESS }, {}).map((e) => e.id).join() === seleccion.map((e) => e.id).join(),
  '⚠️ Y es la MISMA lista en dos llamadas: sin desempate, cada render ofrecía otra');

/* Los que ya tienen entrenamientos de verdad no se preguntan: no hay nada que
   estimar cuando ya se sabe. */
const conSesion = con(sesion(seleccion[0].id, [{ reps: 10 }, { reps: 9 }]));
ok(!ejerciciosParaClasificar(conSesion, {}).some((e) => e.id === seleccion[0].id),
  '🚨 Un ejercicio con sesiones reales sale de la cola (apartado 2)');

console.log('\n\x1b[1m2 · LA PREGUNTA SE ADAPTA AL EJERCICIO (apartados 5, 12, 13 y 14)\x1b[0m');

ok(claseDePregunta(ej('dominada-prona')) === 'repeticiones',
  '🚨 Las dominadas se preguntan por repeticiones, que es el ejemplo del apartado 5…');
ok(claseDePregunta(ej('press-banca-barra')) === 'carga', '…el press de banca por carga (apartado 14)…');
ok(claseDePregunta(ej('plancha-frontal')) === 'tiempo', '…la plancha por tiempo (apartado 13)…');
ok(claseDePregunta(ej('l-sit')) === 'progresion' && claseDePregunta(ej('muscle-up')) === 'progresion',
  '🚨 …y una habilidad por su PROGRESIÓN, no por repeticiones (apartado 12)');
ok(claseDePregunta(null) === null, 'Sin ejercicio no hay pregunta');

const qDom = preguntaDeEjercicio(ej('dominada-prona'));
ok(/dominadas/i.test(qDom.texto) && /cuántas/i.test(qDom.texto),
  'La pregunta NOMBRA el ejercicio: nada de una pregunta única para todos (apartado 5)');
ok(qDom.opciones.length === OPCIONES_REPETICIONES.length && qDom.opciones.some((o) => /15 o más/.test(o.texto)),
  'Con sus tramos, el último abierto');
const qTiempo = preguntaDeEjercicio(ej('plancha-frontal'));
ok(qTiempo.opciones.length === OPCIONES_TIEMPO.length && /No puedo mantenerlo/.test(qTiempo.opciones[0].texto),
  'La de tiempo empieza por «No puedo mantenerlo» (apartado 5)');
const qProg = preguntaDeEjercicio(ej('full-planche'));
ok(qProg.opciones.map((o) => o.texto).join() === OPCIONES_PROGRESION.map((o) => o.texto).join(),
  'La de una habilidad son las cinco progresiones (apartado 12)');
const qCarga = preguntaDeEjercicio(ej('press-banca-barra'));
ok(qCarga.opciones.some((o) => o.id === OPCION_NO_LO_SE.id),
  '🚨 Y la de carga ofrece «No lo sé»: no se le obliga a inventarse un peso (apartado 14)');
ok(new RegExp(`${REPS_DE_REFERENCIA_CARGA} repeticiones`).test(qCarga.ayuda),
  '⚠️ …diciendo para cuántas repeticiones se pregunta, en vez de callarlo');

/* Apartado 15 — con peso corporal en el perfil, las opciones cambian. Sin él,
   no se le obliga a escribirlo: salen kilos absolutos. */
const cargaSinPeso = opcionesDeCarga(ej('press-banca-barra'), null).map((o) => o.marca);
const cargaConPeso = opcionesDeCarga(ej('press-banca-barra'), { peso: 95 }).map((o) => o.marca);
ok(cargaSinPeso.join() !== cargaConPeso.join(),
  '⚠️ Las opciones de carga se ajustan al peso corporal cuando el perfil lo tiene (apartado 15)');
ok(opcionesDeCarga(ej('press-banca-barra'), { peso: 5 }).map((o) => o.marca).join() === cargaSinPeso.join(),
  '…y un peso imposible se ignora, no se usa');

console.log('\n\x1b[1m3 · DE RESPUESTA A PUNTUACIÓN (apartados 6 y 9)\x1b[0m');

const pDom14 = puntuacionDeRespuesta(ej('dominada-prona'), 'reps-14');
ok(pDom14.puntuacion === puntuacionDeMarca('repeticiones', { valor: 14, escala: 'reps' }, 'intermedio'),
  '🚨 La respuesta se vuelve MARCA y la puntúa la F15: ni una escala paralela (apartado 6)');
const pFlex14 = puntuacionDeRespuesta(ej('flexion'), 'reps-14');
ok(pDom14.puntuacion > pFlex14.puntuacion,
  '🚨 14 dominadas puntúan más que 14 flexiones: cuenta la dificultad del ejercicio (F15, apartado 9)');
ok(puntuacionDeRespuesta(ej('dominada-prona'), 'reps-0').puntuacion === 0,
  '«Ninguna todavía» es una respuesta válida y puntúa 0, no un hueco');
ok(puntuacionDeRespuesta(ej('plancha-frontal'), 'tiempo-30').puntuacion > puntuacionDeRespuesta(ej('plancha-frontal'), 'tiempo-10').puntuacion,
  'Más segundos, más puntuación');
ok(puntuacionDeRespuesta(ej('full-planche'), 'prog-4').puntuacion === OPCIONES_PROGRESION[4].puntuacion,
  'La progresión se sitúa en la escala con la tabla central, en un solo sitio');
ok(puntuacionDeRespuesta(ej('press-banca-barra'), 'no-lo-se') === null,
  '🚨 «No lo sé» NO puntúa: sin dato no hay estimación (apartado 31)');
ok(puntuacionDeRespuesta(ej('press-banca-barra'), 'opcion-inventada') === null,
  'Una opción que no existe tampoco');
const cargaConPerfil = puntuacionDeRespuesta(ej('press-banca-barra'), 'carga-70', { perfil: { peso: 72 } });
const cargaSinPerfil = puntuacionDeRespuesta(ej('press-banca-barra'), 'carga-70', {});
ok(cargaConPerfil.puntuacion > 0 && cargaSinPerfil.puntuacion > 0,
  'La carga puntúa con y sin peso corporal (apartado 15)');

console.log('\n\x1b[1m4 · GUARDAR, Y NO TOCAR EL HISTORIAL (apartados 3, 11 y 24)\x1b[0m');

const base = con(sesion('press-banca-barra', [{ reps: 8, peso: 60 }, { reps: 8, peso: 60 }]));
const antes = JSON.stringify(base.sesiones);
const r1 = clasificarEjercicio(base, 'dominada-prona', 'reps-14', {});
ok(r1.ok && r1.clasificacion.exerciseId === 'dominada-prona' && r1.clasificacion.puntuacion === pDom14.puntuacion,
  'Se guarda la estimación con su puntuación');
ok(r1.clasificacion.fuente === 'cuestionario' && r1.clasificacion.respuesta === 'reps-14',
  '⚠️ …y con la RESPUESTA, no solo el número: si cambia la escala se puede repuntuar');
ok(JSON.stringify(r1.fitness.sesiones) === antes,
  '🚨 Y NO se toca ni una sesión: *"nunca modificar WorkoutSession"* (apartado 11)');
ok(r1.clasificacion.confianza === 'baja',
  '🚨 Contestar una pregunta da confianza baja, nunca alta (apartado 28)');
ok(clasificarEjercicio(base, 'full-planche', 'prog-4', {}).clasificacion.confianza === 'media',
  '…y una ejecución completa, media. Alta no la da el cuestionario ni así');
/* 🚨 Y la puerta de atrás, cerrada por partida doble: ni la puntuación devuelve
   «alta», ni el modelo la aceptaría aunque alguien la escribiera. Sin esta
   segunda comprobación, cambiar el código a 'alta' no ponía nada rojo. */
ok(['baja', 'media'].includes(puntuacionDeRespuesta(ej('dominada-prona'), 'reps-15').confianza),
  '⚠️ Ninguna respuesta del cuestionario devuelve confianza alta…');
ok(crearClasificacion({ id: 'x', exerciseId: 'y', puntuacion: 900, confianza: 'alta' }).confianza === 'baja',
  '…y el modelo la rechaza aunque se la escriban a mano (apartado 28)');
ok(clasificarEjercicio(base, 'no-existe', 'reps-5', {}).ok === false,
  'Un ejercicio que no está en el catálogo no se clasifica');
ok(clasificarEjercicio(base, 'press-banca-barra', 'no-lo-se', {}).ok === false,
  '«No lo sé» no guarda nada, y lo dice');

/* Apartado 11 — reclasificar SUSTITUYE: es la misma estimación corregida. */
const r2 = clasificarEjercicio(r1.fitness, 'dominada-prona', 'reps-5', { ahora: r1.clasificacion.creadoEn + 5000 });
ok(r2.fitness.clasificaciones.length === 1, '🚨 Reclasificar no acumula: una estimación por ejercicio');
ok(r2.clasificacion.id === r1.clasificacion.id && r2.clasificacion.creadoEn === r1.clasificacion.creadoEn,
  '…conservando el id y cuándo la hizo…');
ok(r2.clasificacion.actualizadoEn > r1.clasificacion.creadoEn && r2.clasificacion.puntuacion < r1.clasificacion.puntuacion,
  '…y quedándose con la nueva respuesta, aunque sea peor');
ok(olvidarClasificacion(r2.fitness, 'dominada-prona').clasificaciones.length === 0, 'Y se puede olvidar');
ok(/no modificará tus entrenamientos/i.test(AVISO_RECLASIFICAR),
  '⚠️ El aviso del apartado 11 dice exactamente lo que no se toca');

/* Apartado 24 — sobrevive a la recarga por la puerta de siempre. */
const recargado = normalizarFitness(JSON.parse(JSON.stringify(r1.fitness)));
ok(recargado.clasificaciones.length === 1 && recargado.clasificaciones[0].puntuacion === r1.clasificacion.puntuacion,
  '🚨 La estimación sobrevive a la recarga: pasa por el normalizador de siempre (regla 5)');
ok(normalizarFitness({ clasificaciones: [{ id: 'x', exerciseId: 'y' }] }).clasificaciones.length === 0,
  '⚠️ Una clasificación sin puntuación se tira: daría un rango que nadie ha estimado');
ok(normalizarFitness({ clasificaciones: [
  crearClasificacion({ id: 'a', exerciseId: 'dominada-prona', puntuacion: 300 }),
  crearClasificacion({ id: 'b', exerciseId: 'dominada-prona', puntuacion: 500 }),
] }).clasificaciones.length === 1,
  '…y dos del mismo ejercicio se quedan en una: la última');

console.log('\n\x1b[1m5 · LOS DATOS REALES MANDAN (apartados 4 y 27)\x1b[0m');

const soloEstimado = clasificarEjercicio({ ...DEFAULT_FITNESS }, 'dominada-prona', 'reps-15', {}).fitness;
const rEstimado = rangoDeEjercicio(soloEstimado, 'dominada-prona', {});
ok(!rEstimado.sinRango && rEstimado.fuente === 'cuestionario',
  '🚨 Sin entrenamientos, la estimación SÍ da un punto de partida (apartado 4)');
ok(rEstimado.provisional === true && rEstimado.dataPoints === 0,
  '⚠️ …marcado como provisional y sin fingir sesiones detrás');

/* El ejemplo literal del apartado 27: estima avanzado, entrena y sale peor. */
const conAmbos = guardarSesion(soloEstimado, sesion('dominada-prona', [{ reps: 4 }, { reps: 3 }]));
const rReal = rangoDeEjercicio(conAmbos, 'dominada-prona', {});
ok(rReal.fuente === 'entrenamiento',
  '🚨 En cuanto hay UNA sesión real, el rango sale de ella (apartado 27)');
ok(rReal.rango < rEstimado.rango,
  '🚨 …aunque el resultado real sea PEOR que lo que estimó: el cuestionario no sostiene un rango inflado');
ok(clasificacionDe(conAmbos, 'dominada-prona') !== null,
  '⚠️ Y la estimación no se borra: pierde, pero sigue guardada (si borra la sesión, vuelve a valer)');
ok(estadoDeClasificacion(conAmbos, 'dominada-prona', {}).estado === 'entrenamiento'
  && estadoDeClasificacion(soloEstimado, 'dominada-prona', {}).estado === 'clasificado'
  && estadoDeClasificacion({ ...DEFAULT_FITNESS }, 'dominada-prona', {}).estado === 'sin_clasificar',
  'Los tres estados del apartado 10 se distinguen');

console.log('\n\x1b[1m6 · LO QUE LLEGA A LOS MÚSCULOS Y A LA COBERTURA (apartados 16 y 17)\x1b[0m');

const musculos = musculosQueRecibe('dominada-prona', {});
ok(musculos.length >= 3 && musculos.every((m) => m.peso > 0 && m.nombre),
  'Los músculos que reciben información son los del catálogo, con su porcentaje (apartado 16)');
ok(rangosDeEjercicios(soloEstimado, {}).some((x) => x.exerciseId === 'dominada-prona'),
  '🚨 Un ejercicio estimado cuenta para los grupos: de eso va clasificar');
const espaldaEstimada = rangoDeGrupo(rangosDeEjercicios(soloEstimado, {}), 'espalda');
ok(!espaldaEstimada.sinRango && espaldaEstimada.estimado === true,
  '…y el grupo lo dice: tiene rango, pero sin una sola sesión detrás');
ok(espaldaEstimada.provisional === true, '…así que es provisional, siempre');
const globalVacio = rangoGlobal({ ...DEFAULT_FITNESS }, {});
let conTres = { ...DEFAULT_FITNESS };
for (const [id, op] of [['dominada-prona', 'reps-14'], ['press-banca-barra', 'carga-50'], ['sentadilla-barra', 'carga-50']]) {
  conTres = clasificarEjercicio(conTres, id, op, {}).fitness;
}
const globalTres = rangoGlobal(conTres, {});
ok(globalVacio.cobertura.ejercicios === 0 && globalTres.cobertura.ejercicios === 3,
  '🚨 La cobertura se recalcula con lo clasificado, no se queda vieja (apartado 17)');
ok(!globalTres.sinRango && globalTres.provisional === true,
  '…y con tres estimaciones ya hay rango global, marcado como provisional');

console.log('\n\x1b[1m7 · EL CUESTIONARIO DE PRINCIPIO A FIN (apartados 1, 22 y 25)\x1b[0m');

const c0 = cuestionario({ ...DEFAULT_FITNESS }, {});
ok(c0.hechos === 0 && c0.restantes === LIMITE_CUESTIONARIO && c0.posicion === 1,
  'Empieza en la pregunta 1 de las que hay (apartado 22)');
ok(c0.fraccion === 0 && !c0.completado, 'Con la barra a cero, que es progreso del cuestionario');
const c1 = cuestionario(clasificarEjercicio({ ...DEFAULT_FITNESS }, c0.pendientes[0].id, 'reps-9', {}).fitness, {});
ok(c1.hechos === 1 && c1.restantes === c0.restantes - 1 && c1.posicion === 2,
  '🚨 Al contestar, avanza: y lo guardado ES el progreso, sin puntero aparte (apartado 24)');
ok(c1.gruposNombre.length >= 1, 'Y ya hay grupos con información nueva');
ok(resumenFinal({ ...DEFAULT_FITNESS }, {}).ejercicios === 0
  && /Todavía no/.test(resumenFinal({ ...DEFAULT_FITNESS }, {}).texto),
  '⚠️ Sin nada contestado, el resumen no felicita por cero: lo dice');
const resumen3 = resumenFinal(conTres, {});
ok(resumen3.ejercicios === 3 && resumen3.grupos >= 3 && /3 ejercicios clasificados/.test(resumen3.texto),
  'Y con tres, el resumen del apartado 25: ejercicios y grupos actualizados');

console.log('\n\x1b[1m8 · LA PANTALLA NO DECIDE, Y NO FINGE PRECISIÓN (apartados 7, 8 y 30)\x1b[0m');

const vista = sinComentarios(leer('src/views/ClasificacionView.jsx'));
ok(/clasificarEjercicio|preguntaDeEjercicio|cuestionario/.test(vista),
  'La pantalla usa las funciones centrales (apartado 30)…');
ok(!/REFERENCIAS|puntuacionDeMarca|RANK_THRESHOLDS|Epley|epley/.test(vista),
  '🚨 …y no contiene ni una regla de puntuación');
ok(!/\.puntuacion\b/.test(vista),
  '🚨 La puntuación no se enseña en ningún sitio: nada de «tu score es 638» (apartado 7)');
ok(/Nivel estimado/.test(vista), '…se enseña «Nivel estimado» (apartado 8)');
ok(vista.includes('AVISO_ESTIMACION') && /se actualizará con tus entrenamientos/i.test(AVISO_ESTIMACION),
  '…con el aviso de que los entrenamientos lo van a sustituir');
ok(/createPortal/.test(vista), 'Los dos diálogos van con `createPortal` (regla 3 del proyecto)');
ok(/Clasifica tus ejercicios/.test(vista) && /Responde unas preguntas rápidas/.test(vista),
  'Con el título y el subtítulo del apartado 1');
ok(/¿Salir de la clasificación\?/.test(vista) && /ya está guardado/.test(vista),
  '🚨 El aviso de salida dice la verdad: lo contestado ya está guardado (apartado 23)');
ok(!/\bXP\b|leaderboard|logro|confeti|recompensa/i.test(vista),
  'Sin gamificación (apartado 35)');
ok(/aria-pressed/.test(vista) && /toque-44/.test(vista),
  'Opciones grandes y con estado leíble (apartados 20 y 32)');

const rangosView = sinComentarios(leer('src/views/RangosView.jsx'));
ok(/onClasificar/.test(rangosView) && /restantes/.test(rangosView),
  '🚨 Rangos abre el cuestionario con «X restantes» (apartado 1)');
const fitnessView = sinComentarios(leer('src/views/FitnessView.jsx'));
ok(/<ClasificacionView/.test(fitnessView) && /setClasificando/.test(fitnessView),
  '…y es pantalla entera, como el entrenamiento en vivo');
ok(CTA_CLASIFICAR.existe === true,
  '🔓 El CTA declarado desde la F1 pasa a existir de verdad (regla 8: ya no es una promesa)');

console.log('\n\x1b[1m9 · LO QUE NO TRAE ESTA FASE (apartado 35)\x1b[0m');

ok(NO_EN_FIT17.length >= 4 && NO_EN_FIT17.every((x) => x.que && x.porque),
  'Lo que no está, declarado con su motivo');
ok(NO_EN_FIT17.some((x) => /score|puntuación/i.test(x.que)), 'Entre ello, enseñar la puntuación');
ok(DECISIONES_FIT17.length >= 3 && DECISIONES_FIT17.every((x) => x.que && x.porque),
  'Y las decisiones discutibles, escritas');

let rompe = false;
try {
  cuestionario(null, {});
  cuestionario({ clasificaciones: [null, 'roto', { exerciseId: 'no-existe', puntuacion: 300 }] }, {});
  estadoDeClasificacion(null, null, {});
  clasificarEjercicio(null, null, null, {});
} catch { rompe = true; }
ok(!rompe, '🚨 Con datos corruptos no se cae (apartado 34)');

console.log(`\n${fallos === 0 ? '\x1b[32mTODO EN VERDE\x1b[0m' : `\x1b[31m${fallos} FALLO(S)\x1b[0m`} — ${total} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
