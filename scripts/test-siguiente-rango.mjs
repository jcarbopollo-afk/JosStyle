/* ===========================================================================
   FIT F23/45 — EL OBJETIVO DEL SIGUIENTE RANGO

   Las veintidós pruebas del apartado 34, más lo que esta fase tiene que
   demostrar que NO hace: convertir puntos en kilos o repeticiones, inventarse
   una segunda fórmula del progreso, predecir cuánto tardará, o enseñar un
   `NaN` en cualquier rincón de la tarjeta.
   =========================================================================== */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_FITNESS, NIVELES_RANGO, SIN_RANGO } from '../src/lib/fitness.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { clasificarEjercicio } from '../src/lib/clasificacion.js';
import { addDays } from '../src/lib/helpers.js';
import { RANK_THRESHOLDS, progresoHaciaSiguiente } from '../src/lib/rangos.js';
import { rangoEfectivoDeEjercicio } from '../src/lib/motorRangos.js';
import {
  ESTADOS_SIGUIENTE, estadoSiguiente, SIN_RANGO_TODAVIA, RANGO_MAXIMO, COBERTURA_INSUFICIENTE,
  puntosQueFaltan, puntosFiables, ETIQUETAS, avisoDeFiabilidad, progresoAlSiguiente,
  MEJORAR_RENDIMIENTO, MEJORAR_ISOMETRICO, textoDeLoQueFalta, cambioDentroDelRango,
  RELEVANTES_MAX, ETIQUETA_RELEVANTES, ejerciciosRelevantes, SALIDAS_TARJETA,
  tarjetaSiguienteRango, esIsometrico, auditarSiguienteRango, casillasDelSiguiente,
  sinNumerosRotos, NO_EN_FIT23, DECISIONES_FIT23,
} from '../src/lib/siguienteRango.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* ⚠️ Comentarios Y cadenas: este archivo explica lo que no hace, y la propia
   explicación haría saltar los barridos (la lección de siempre). */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-19';
const EJ = 'dominada-prona';
const OTRO = 'press-banca-barra';
const TERCERO = 'sentadilla-barra';
const ISO = 'plancha-frontal';

let contador = 0;
function sesion(exerciseId, valores, cuando) {
  contador += 1;
  const fecha = cuando || addDays(HOY, -90 + contador);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  /* Un escenario mal construido tiene que decir QUÉ está mal (lección F22). */
  if (!r.lineas.length) throw new Error(`El ejercicio «${exerciseId}» no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (base, ...ss) => ss.reduce((f, s) => guardarSesion(f, s), base);
const reps = (n) => [{ reps: n }, { reps: Math.max(1, n - 2) }];
const dest = (tipo, id = '') => ({ tipo, id });

/* Los escenarios que no varían, UNA vez (GE F2). */
const VACIO = { ...DEFAULT_FITNESS, sesiones: [], clasificaciones: [] };
const REAL = con(VACIO, sesion(EJ, reps(9)), sesion(EJ, reps(10)), sesion(EJ, reps(11)));
const UNA = con(VACIO, sesion(EJ, reps(10)));
const SOLO_CUESTIONARIO = clasificarEjercicio(VACIO, EJ, 'reps-9', { ahora: Date.parse(`${addDays(HOY, -80)}T10:00:00`) }).fitness;
const GLOBAL = con(VACIO,
  sesion(EJ, reps(9)), sesion(EJ, reps(11)), sesion(EJ, reps(13)),
  sesion(OTRO, [{ peso: 50, reps: 8 }]), sesion(OTRO, [{ peso: 60, reps: 8 }]), sesion(OTRO, [{ peso: 70, reps: 8 }]),
  sesion(TERCERO, [{ peso: 80, reps: 8 }]), sesion(TERCERO, [{ peso: 95, reps: 8 }]), sesion(TERCERO, [{ peso: 110, reps: 8 }]));
const ISOMETRICO = con(VACIO, sesion(ISO, [{ duracion: 45 }]), sesion(ISO, [{ duracion: 55 }]), sesion(ISO, [{ duracion: 60 }]));

console.log('\n\x1b[1m1 · LA FUENTE DE VERDAD ES EL RANKENGINE (apartados 2 y 37)\x1b[0m');

const fuente = leer('src/lib/siguienteRango.js');
const codigo = soloCodigo(fuente);
ok(/from '\.\/rangos\.js'/.test(fuente) && /RANK_THRESHOLDS/.test(codigo),
  '🚨 Apartado 2 — los umbrales son `RANK_THRESHOLDS`, importados de la F15');
ok(!/RANK_THRESHOLDS\s*=/.test(codigo) && !/THRESHOLDS?\s*=\s*\[/.test(codigo),
  '🚨 …y NO se declara ninguno nuevo aquí (apartado 2, literal)');
ok(/progresoHaciaSiguiente/.test(codigo) && !/function\s+progresoHaciaSiguiente/.test(codigo),
  '🚨 Apartado 37 — el progreso dentro del rango se IMPORTA, no se reescribe');
ok(/rangoDeDestino/.test(codigo) && !/function\s+rangoDeDestino/.test(codigo),
  '…y el rango de cada entidad también: ni una fórmula paralela');
ok(!/saveData|supabase|localStorage/.test(codigo),
  '🚨 Apartado 32 — no se guarda nada: el progreso se calcula');

console.log('\n\x1b[1m2 · LA FÓRMULA DEL APARTADO 4\x1b[0m');

const p = progresoAlSiguiente(REAL, dest('exercise', EJ));
ok(p.estado === 'en_camino' && p.rango >= 1, `Con tres sesiones reales hay rango (${p.nombre}, ${p.score} puntos)`);
const desde = RANK_THRESHOLDS[p.rango - 1];
const hasta = RANK_THRESHOLDS[p.rango];
const esperada = (p.score - desde) / (hasta - desde);
ok(Math.abs(p.fraccion - esperada) < 1e-9,
  `🚨 El progreso se mide ENTRE los dos umbrales (${desde}–${hasta}), no sobre el máximo`);
ok(Math.abs(p.fraccion - p.score / 1000) > 0.01,
  '🚨 …y da un número DISTINTO de `score / 1000`, que es lo que el apartado 4 prohíbe');
ok(p.porcentaje === Math.round(p.fraccion * 100) && p.porcentaje >= 0 && p.porcentaje <= 100,
  'El porcentaje es la fracción redondeada, siempre entre 0 y 100');
ok(p.umbralSiguiente === hasta, 'Y el umbral del siguiente es el del catálogo');

console.log('\n\x1b[1m3 · LOS PUNTOS QUE FALTAN (apartados 1 y 11)\x1b[0m');

ok(p.puntosRestantes === Math.round(hasta - p.score),
  `🚨 Los puntos que faltan son el umbral menos el score (${p.puntosRestantes})`);
ok(p.puntosRestantes > 0, 'Y siempre son positivos: si no, es que ya subió de rango');
ok(puntosQueFaltan(448, 5) === RANK_THRESHOLDS[5] - 448, 'La función es una resta contra el umbral');
ok(puntosQueFaltan(null, 5) === null && puntosQueFaltan(448, null) === null,
  'Prueba 22 — sin score o sin rango, `null`, nunca un `NaN`');
ok(puntosQueFaltan(448, 99) === null && puntosQueFaltan(448, 0) === null,
  '🚨 Prueba 22 — un umbral que no existe devuelve `null`, no una resta absurda');
ok(puntosQueFaltan(RANK_THRESHOLDS[5], 5) === null,
  'Prueba 5 — un score EXACTAMENTE en el umbral no debe «faltar» nada');
ok(puntosQueFaltan(RANK_THRESHOLDS[5] - 1, 5) === 1, 'Prueba 6 — justo antes del umbral, falta 1 punto');
ok(progresoHaciaSiguiente(RANK_THRESHOLDS[5]).orden === 6,
  'Prueba 7 — justo en el umbral, el motor ya te pone en el rango siguiente');

console.log('\n\x1b[1m4 · SIN RANGO, PRIMER RANGO Y ÚLTIMO RANGO (pruebas 1, 2, 4 · apartados 5, 6 y 7)\x1b[0m');

const pv = progresoAlSiguiente(VACIO, dest('exercise', EJ));
ok(pv.estado === 'sin_rango' && pv.nombre === SIN_RANGO.nombre, 'Prueba 1 — sin datos no hay rango');
ok(pv.porcentaje === null && pv.fraccion === null,
  '🚨 Apartado 7 — y NO se enseña un 0 %: es `null`, que no es cero');
ok(pv.puntosRestantes === null && pv.puntosVisibles === false,
  '🚨 …ni un «te falta X» (apartado 7, literal)');
ok(textoDeLoQueFalta(pv) === SIN_RANGO_TODAVIA, 'Se dice la frase del apartado 7');
ok(SIN_RANGO_TODAVIA === 'Completa o clasifica ejercicios para obtener tu primer rango.',
  '…que es literal del enunciado');
ok(tarjetaSiguienteRango(VACIO, dest('exercise', EJ)).barra === null,
  '🚨 Y sin rango NO hay barra que pintar');

/* Prueba 2 — el primer rango tiene siguiente. */
const primero = progresoHaciaSiguiente(RANK_THRESHOLDS[0] + 1);
ok(primero.orden === 1 && primero.siguiente === 2,
  'Prueba 2 — desde el primer rango se ve el camino al segundo (apartado 5)');

/* Prueba 4 — el último rango. */
const ultimo = progresoHaciaSiguiente(RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1] + 10);
ok(ultimo.orden === NIVELES_RANGO.length && ultimo.siguiente === null,
  'Prueba 4 — en el rango más alto no hay siguiente');
const pMax = {
  ...p, estado: 'maximo', haySiguiente: false, siguiente: null, nombreSiguiente: null,
  puntosRestantes: null, puntosVisibles: false,
};
ok(textoDeLoQueFalta(pMax) === RANGO_MAXIMO && RANGO_MAXIMO === 'Rango máximo alcanzado',
  'Apartado 6 — se dice «Rango máximo alcanzado», literal');
ok(tarjetaSiguienteRango({ ...VACIO }, dest('exercise', EJ)).barra === null,
  '🚨 Apartado 6 — y sin siguiente rango NO se pinta una barra vacía');
ok(ESTADOS_SIGUIENTE.map((e) => e.id).join() === 'en_camino,maximo,sin_rango'
  && estadoSiguiente('maximo') !== null && estadoSiguiente('inventado') === null,
  'Los tres estados existen, con su explicación');

console.log('\n\x1b[1m5 · CONFIANZA Y CUESTIONARIO (pruebas 8, 10, 11, 12 · apartados 8, 9 y 10)\x1b[0m');

const pc = progresoAlSiguiente(SOLO_CUESTIONARIO, dest('exercise', EJ));
ok(pc.fuente === 'cuestionario' && pc.estado === 'en_camino',
  'Prueba 21 — con solo el cuestionario SÍ hay progreso que enseñar (apartado 9)');
ok(pc.porcentaje !== null,
  '🚨 Apartado 8 — *"No ocultar la información"*: el porcentaje se sigue viendo');
ok(pc.aviso === ETIQUETAS.estimacion && ETIQUETAS.estimacion === 'Estimación inicial',
  '🚨 …pero etiquetado como «Estimación inicial» (apartado 9, literal)');
ok(pc.puntosVisibles === false,
  '🚨 Y la cifra EXACTA de puntos NO se dice de una estimación (apartado 11)');
ok(textoDeLoQueFalta(pc) === MEJORAR_RENDIMIENTO,
  '…se dice lo que se puede decir sin inventar una cifra');
ok(p.base === ETIQUETAS.real && ETIQUETAS.real === 'Basado en tus entrenamientos registrados.',
  'Apartado 10 — con datos reales se dice así, literal');
ok(puntosFiables({ fuente: 'entrenamiento', confianza: 'media' }) === true
  && puntosFiables({ fuente: 'entrenamiento', confianza: 'alta' }) === true,
  'Pruebas 11 y 12 — con confianza media o alta, los puntos se afirman');
ok(puntosFiables({ fuente: 'entrenamiento', confianza: 'baja' }) === false,
  'Prueba 10 — con confianza baja, no');
ok(puntosFiables({ fuente: 'cuestionario', confianza: 'alta' }) === false,
  '🚨 …y una estimación no los afirma ni con confianza alta: no es lo mismo saber que estimar');
const pUna = progresoAlSiguiente(UNA, dest('exercise', EJ));
ok(pUna.confianza === 'baja' && pUna.aviso && /provisional/i.test(pUna.aviso),
  'Prueba 10 — con una sola sesión, «Progreso provisional»');
ok(avisoDeFiabilidad({ fuente: 'entrenamiento', confianza: 'alta' }) === null,
  'Con datos de sobra no se avisa de nada: el aviso es para cuando hace falta');

console.log('\n\x1b[1m6 · COBERTURA (pruebas 13 y 14 · apartados 17, 18 y 19)\x1b[0m');

const pg = progresoAlSiguiente(GLOBAL, dest('overall'));
ok(pg.estado === 'en_camino' && pg.cobertura && pg.cobertura.texto,
  `Prueba 14 — el rango global trae su cobertura (${pg.cobertura && pg.cobertura.texto})`);
ok(/\d+\/\d+/.test(pg.cobertura.texto),
  '🚨 Apartado 18 — el progreso NUNCA va sin la cobertura al lado');
ok(pg.aviso && /Cobertura limitada/.test(pg.aviso),
  'Apartado 19 — con cobertura parcial se dice «Cobertura limitada»');
ok(avisoDeFiabilidad({ fuente: 'combinado', confianza: 'baja', cobertura: { grupos: 3, total: 7 } })
  === 'Progreso provisional · Cobertura limitada',
  '🚨 Apartado 19, literal: cuando los dos flojean, se dicen los dos');
ok(avisoDeFiabilidad({ fuente: 'entrenamiento', confianza: 'alta', cobertura: { grupos: 7, total: 7 } }) === null,
  'Y con cobertura completa no se menciona');
const pocaCobertura = progresoAlSiguiente({ ...VACIO, sesiones: GLOBAL.sesiones.slice(0, 2) }, dest('overall'));
ok(pocaCobertura.estado === 'sin_rango',
  'Prueba 13 — con un solo ejercicio el global no tiene rango (F15, apartado 20)');
ok(tarjetaSiguienteRango({ ...VACIO, sesiones: GLOBAL.sesiones.slice(0, 2) }, dest('overall')).falta
  === COBERTURA_INSUFICIENTE || pocaCobertura.motivo !== 'poca_cobertura',
  '🚨 Apartado 17 — y si es por cobertura, se dice ESO antes que el progreso');
ok(COBERTURA_INSUFICIENTE === 'Datos insuficientes para una estimación sólida.',
  '…con la frase literal del apartado 17');

console.log('\n\x1b[1m7 · LAS CUATRO ENTIDADES (pruebas 15, 16, 17 y 18)\x1b[0m');

ok(progresoAlSiguiente(REAL, dest('exercise', EJ)).estado === 'en_camino', 'Prueba 15 — un ejercicio');
ok(progresoAlSiguiente(REAL, dest('subgroup', 'dorsales')).estado === 'en_camino', 'Prueba 16 — un subgrupo');
ok(progresoAlSiguiente(REAL, dest('muscleGroup', 'espalda')).estado === 'en_camino', 'Prueba 17 — un grupo muscular');
ok(pg.estado === 'en_camino', 'Prueba 18 — el rango global');
ok(progresoAlSiguiente(REAL, dest('muscleGroup', 'piernas')).estado === 'sin_rango',
  '🚨 Y un grupo que no ha entrenado no tiene progreso inventado');
ok(progresoAlSiguiente(REAL, dest('loQueSea', 'x')).motivo === 'destino_desconocido',
  'Un destino que no existe no revienta');
['exercise', 'subgroup', 'muscleGroup', 'overall'].forEach((t) => {
  const r = progresoAlSiguiente(REAL, dest(t, t === 'exercise' ? EJ : t === 'overall' ? '' : (t === 'subgroup' ? 'dorsales' : 'espalda')));
  ok(sinNumerosRotos(r), `…y el resultado de «${t}» no trae ni un número roto (apartado 33)`);
});

console.log('\n\x1b[1m8 · ISOMÉTRICOS Y SKILLS (pruebas 19 y 20 · apartados 12, 13 y 14)\x1b[0m');

ok(esIsometrico(VACIO, dest('exercise', ISO)) === true,
  'Prueba 19 — una plancha se mide en tiempo');
ok(esIsometrico(VACIO, dest('exercise', OTRO)) === false,
  '…y un press de banca no');
ok(esIsometrico(VACIO, dest('exercise', 'no-existe')) === false,
  'Prueba 20 — un ejercicio que no está en el catálogo no revienta (apartado 33)');
ok(esIsometrico(VACIO, dest('muscleGroup', 'espalda')) === false,
  'Un grupo muscular no es un isométrico');
const ti = tarjetaSiguienteRango(ISOMETRICO, dest('exercise', ISO));
ok(ti.metrica === MEJORAR_ISOMETRICO && MEJORAR_ISOMETRICO === 'Progreso basado en duración y/o nivel de progresión.',
  'Apartado 14 — en un isométrico se dice con qué se mide, literal');
ok(/puntos/.test(ti.falta),
  '🚨 …ADEMÁS de los puntos, no en su lugar: un punto es neutro respecto a la métrica');
ok(textoDeLoQueFalta({ ...pc, puntosVisibles: false }, { isometrico: true }) === MEJORAR_ISOMETRICO,
  'Y cuando no se pueden afirmar los puntos, la frase que queda es la suya');

/* 🚨 Apartados 12 y 13 — lo que NO se puede decir, barrido sobre TODOS los
   textos que genera esta fase. */
const textos = [
  SIN_RANGO_TODAVIA, RANGO_MAXIMO, COBERTURA_INSUFICIENTE, MEJORAR_RENDIMIENTO,
  MEJORAR_ISOMETRICO, ETIQUETA_RELEVANTES, ...Object.values(ETIQUETAS),
  textoDeLoQueFalta(p), textoDeLoQueFalta(pc), textoDeLoQueFalta(pv), textoDeLoQueFalta(pMax),
  ti.falta, ti.metrica, pg.aviso, pUna.aviso,
].filter(Boolean);
ok(!textos.some((t) => /\d+\s*kg|levanta\s|carga de \d/i.test(t)),
  '🚨 Apartado 13 — ni un texto convierte los puntos en KILOS');
ok(!textos.some((t) => /\d+\s*(repeticion|repetici|reps)/i.test(t)),
  '🚨 Apartado 12 — ni en REPETICIONES: *"necesitas exactamente 3 repeticiones más"* es una precisión que el score no tiene');
ok(!textos.some((t) => /en \d+ (días|semanas|meses)|tardarás|llegarás el/i.test(t)),
  '🚨 Apartado 36 — ni una predicción de cuánto tardará');
ok(!textos.some((t) => /tu cuerpo está al/i.test(t)),
  'Apartado 10 — ni *"Tu cuerpo está al 82 %"*');
ok(!textos.some((t) => /debes entrenar|tienes que entrenar/i.test(t)),
  '🚨 Apartado 22 — ni una orden: esto informa, no entrena');
ok(!textos.some((t) => /NaN|Infinity|undefined/.test(t)),
  'Apartado 33 — y ni un número roto en ningún texto');

console.log('\n\x1b[1m9 · DENTRO DEL MISMO RANGO (pruebas 8 y 9 · apartados 23, 24 y 25)\x1b[0m');

const dentro = cambioDentroDelRango(p, p.score - 40);
ok(dentro && dentro.puntos === 40 && /^\+40 puntos dentro de /.test(dentro.texto),
  '🚨 Prueba 8 — apartado 23, literal: «+40 puntos dentro de Intermedio»');
ok(!/subido de nivel|has subido/i.test(dentro.texto),
  '🚨 …y NO dice «has subido de nivel»: sigue en el mismo rango');
const baja = cambioDentroDelRango(p, p.score + 25);
ok(baja && baja.sentido === 'baja' && baja.puntos === -25,
  'Apartado 25 — un descenso se cuenta…');
ok(!/cuidado|has bajado de nivel|estás perdiendo/i.test(baja.texto),
  '…sin dramatizar (apartado 25)');
ok(cambioDentroDelRango(p, p.score) === null,
  'Sin diferencia no se dice nada');
/* Prueba 9 — si cambió el RANGO, esto no le toca: es de la F22. */
const otroRango = RANK_THRESHOLDS[Math.max(0, p.rango - 2)];
ok(cambioDentroDelRango(p, otroRango) === null,
  '🚨 Prueba 9 — si el rango cambió, «dentro del rango» devuelve `null`: ese evento lo cuenta la F22');
ok(cambioDentroDelRango(pv, 300) === null && cambioDentroDelRango(null, 1) === null,
  'Sin rango o con `null` delante, tampoco revienta');

console.log('\n\x1b[1m10 · LOS EJERCICIOS QUE MÁS PESAN (apartados 21 y 22)\x1b[0m');

const rel = ejerciciosRelevantes(REAL, dest('muscleGroup', 'espalda'));
ok(Array.isArray(rel) && rel.length > 0 && rel.every((x) => x.exerciseId && x.nombre),
  'Apartado 21 — se dicen los ejercicios con más contribución');
ok(rel.length <= RELEVANTES_MAX && RELEVANTES_MAX === 4,
  '…como mucho cuatro, que es lo que pide el apartado 21 («2–4»)');
ok(/from '\.\/contribucionMuscular\.js'/.test(fuente),
  '🚨 …reutilizando la lógica de la F21, literal del apartado 21');
ok(!/function\s+contribucionDe|porcentaje\s*\*\s*puntuacion/.test(codigo),
  '…sin un segundo cálculo de contribución aquí');
ok(ejerciciosRelevantes(REAL, dest('exercise', EJ)) === null,
  '🚨 Un EJERCICIO no tiene ejercicios que repartir: `null`, no una lista con él mismo');
ok(ejerciciosRelevantes(REAL, dest('overall')) === null,
  'Y el global tampoco: su desglose es por grupos, no por ejercicios');
ok(ETIQUETA_RELEVANTES === 'Estos ejercicios tienen mayor contribución actualmente.',
  '🚨 Apartado 22 — lo único afirmable, literal, y nunca «debes entrenar dominadas»');
ok(SALIDAS_TARJETA.length === 2 && SALIDAS_TARJETA.every((s) => s.texto && s.lleva),
  'Apartado 30 — las dos salidas llevan a pantallas que YA existen');
ok(SALIDAS_TARJETA.some((s) => /RankExplanation/.test(s.lleva)),
  '…«Ver por qué» va a la explicación de la F20, sin pantalla nueva');

console.log('\n\x1b[1m11 · LA TARJETA ENTERA (apartados 27 y 33)\x1b[0m');

const t = tarjetaSiguienteRango(REAL, dest('exercise', EJ));
ok(t.titulo && t.barra && t.falta && t.destino.nombre, 'La tarjeta trae título, barra y qué falta');
ok(t.destino.nombre !== EJ, 'El destino se rotula con su nombre, no con su id');
ok(t.barra.porcentaje === p.porcentaje, 'La barra lleva el porcentaje del motor, no uno suyo');
ok(/^Estás a \d+ puntos? de /.test(t.falta),
  '🚨 Apartado 1, literal: «Estás a 84 puntos del siguiente rango»');
ok(sinNumerosRotos(t),
  '🚨 Apartado 33 — la tarjeta ENTERA se barre y no hay ni un NaN, Infinity o undefined');
ok(sinNumerosRotos(tarjetaSiguienteRango(VACIO, dest('overall'))),
  '…y la del caso vacío tampoco');
ok(sinNumerosRotos({ a: NaN }) === false && sinNumerosRotos({ a: 'undefined puntos' }) === false,
  '🚨 Y ese barrido SÍ caza lo que busca: un `NaN` y un «undefined puntos»');
ok(sinNumerosRotos(Infinity) === false, '…y un `Infinity`');

console.log('\n\x1b[1m12 · NO SE SUSTITUYE AL MOTOR (apartados 26, 31 y 37)\x1b[0m');

const directo = rangoEfectivoDeEjercicio(REAL, EJ, {});
ok(directo.rango === p.rango && directo.score === p.score,
  '🚨 El rango actual lo sigue dando el motor: esta fase solo lo presenta');
ok(!/estás a 1 punto de bajar|vas a bajar/i.test(codigo.toLowerCase()) && !/puntosParaBajar/.test(codigo),
  '🚨 Apartado 26 — no se anuncia una bajada que la histéresis puede impedir');
ok(!/fitnessEnPeriodo|periodo/i.test(codigo),
  '🚨 Apartado 31 — no se aplica ningún filtro temporal al umbral: esto es el estado actual');
ok(!/\bXP\b|leaderboard|recompensa|prediccion|predicción/i.test(codigo),
  'Apartado 36 — ni XP, ni recompensas, ni predicciones (D2-02)');
ok(!/confeti|confetti|vibrate|new Audio\(/.test(codigo),
  'Apartado 28 — ni confeti, ni vibración, ni sonido');
ok(!/#[0-9a-fA-F]{6}/.test(codigo), 'Regla 2 — ni un hex suelto');

console.log('\n\x1b[1m13 · LO QUE NO ENTRA, Y LA AUDITORÍA (apartado 37)\x1b[0m');

ok(NO_EN_FIT23.length >= 7 && NO_EN_FIT23.every((x) => x.que && x.porque.length > 40),
  'Lo que no se construye está declarado con su motivo');
ok(DECISIONES_FIT23.length >= 6 && DECISIONES_FIT23.every((x) => x.que && x.porque.length > 60),
  'Y las decisiones, con el apartado que las manda');
ok(DECISIONES_FIT23.some((x) => /YA EXISTÍAN/i.test(x.que)),
  '🚨 Entre ellas, que cuatro de los cinco componentes del apartado 29 ya estaban escritos');

const aud = auditarSiguienteRango(REAL, dest('exercise', EJ));
ok(aud.casillas.length === 8 && aud.ok === true,
  'Las ocho casillas del criterio de finalización, en verde sobre datos de verdad');
ok(auditarSiguienteRango(VACIO, dest('exercise', EJ)).ok === true,
  '…y también sobre el caso sin rango, que es un estado válido');
ok(auditarSiguienteRango(GLOBAL, dest('overall')).ok === true, '…y sobre el rango global');

/* 🚨 Una auditoría que no puede ponerse roja no sirve (EH F42). */
const rota = casillasDelSiguiente({
  progreso: {
    estado: 'en_camino', rango: 5, nombre: 'Intermedio', score: NaN, siguiente: null,
    nombreSiguiente: null, porcentaje: 140, puntosVisibles: true, puntosRestantes: -3,
    confianza: null, fuente: null, tipo: 'overall', cobertura: { grupos: 3 },
  },
  relevantes: [{ nombre: 'Inventado' }],
});
ok(rota.ok === false, '🚨 Y se pone ROJA con una tarjeta que incumple sus propias reglas (EH F42)');
ok(rota.casillas.find((c) => c.id === 2).ok === false, '…la 2, porque dice «en camino» sin siguiente rango');
ok(rota.casillas.find((c) => c.id === 3).ok === false, '…la 3, porque un 140 % no existe');
ok(rota.casillas.find((c) => c.id === 4).ok === false, '…la 4, porque afirma −3 puntos restantes');
ok(rota.casillas.find((c) => c.id === 5).ok === false, '…la 5, porque la cobertura no se puede leer');
ok(rota.casillas.find((c) => c.id === 6).ok === false, '…la 6, porque no dice con qué confianza');
ok(rota.casillas.find((c) => c.id === 7).ok === false, '…la 7, porque un relevante no tiene id');
ok(rota.casillas.find((c) => c.id === 8).ok === false, '…y la 8, porque el score es `NaN`');

console.log('\n\x1b[1m14 · REGISTRADA DONDE SE MIRA\x1b[0m');

ok(leer('scripts/verificar.sh').includes('test-siguiente-rango.mjs'),
  '🚨 Su suite está en `verificar.sh`: una prueba que no se ejecuta no es una prueba');
ok(/fechaLocalISO|addDays/.test(fuente) === false || !/new Date\(\)\.toISOString\(\)\.slice/.test(codigo),
  'Ni el fallo del UTC');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones\x1b[0m`);
if (fallos) { console.log(`\x1b[31m${fallos} FALLO(S)\x1b[0m\n`); process.exit(1); }
console.log('\x1b[32m═══ FIT F23 CORRECTA ═══\x1b[0m\n');
