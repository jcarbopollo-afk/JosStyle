/* ===========================================================================
   ENTREGA 4 · FASE 23/45 — EL OBJETIVO DEL SIGUIENTE RANGO

   *"¿Qué necesito mejorar para pasar al siguiente rango?"*

   🚨 **CASI TODO LO QUE PIDE EL APARTADO 29 YA EXISTÍA**, y es la lección más
   repetida del proyecto por enésima vez. De los cinco componentes que enumera:

   · `RankProgressBar` **es `RankProgress`** (F15) — y ya dibuja la barra y ya
     dice *"Rango más alto de la escala"* cuando no hay siguiente.
   · `RankNextStep` **es `siguientePaso()` + su componente** (F20), y ya está
     escrito como informa, no como entrenador (apartado 20).
   · `RankCoverage` y `RankConfidence` **son los de la F20**.

   Y sobre todo: 🚨 **la fórmula del apartado 4 ya estaba resuelta**.
   `progresoHaciaSiguiente` (F15) mide la fracción **entre el umbral del rango
   actual y el del siguiente**, que es exactamente lo que el apartado pide y lo
   contrario de `score / 600`. Escribir aquí una segunda cuenta habría dado dos
   porcentajes distintos para el mismo rango.

   **Lo que de verdad faltaba son tres cosas**, y son las que trae esta fase:

   1. **Los puntos que faltan** (apartados 1 y 11). Nadie los calculaba.
   2. **Una sola función para las cuatro entidades** (apartado 3,
      `getNextRankProgress`): ejercicio, subgrupo, grupo y global.
   3. **Qué se puede afirmar con la confianza y la cobertura que hay**
      (apartados 8, 9, 10, 18 y 19).

   🚨 **Y LO QUE NO SE HACE, POR ESCRITO** (apartados 12, 13 y 14): un score
   combina varias métricas, así que **no se traduce a kilos ni a repeticiones**.
   *"Necesitas exactamente 3 repeticiones más"* es una precisión que el dato no
   tiene, y *"levanta X kg"* se la inventaría entera. Hay un barrido que lo
   comprueba sobre todos los textos que genera esta fase.
   =========================================================================== */

import { GRUPOS_MUSCULARES, nivelRango, SIN_RANGO } from './fitness.js';
import {
  RANK_THRESHOLDS, PUNTUACION_MAXIMA, CONFIANZA, progresoHaciaSiguiente,
} from './rangos.js';
import { fuenteRango } from './motorRangos.js';
/* 🚨 `rangoDeDestino` (F22) es la única función que devuelve el rango de
   CUALQUIERA de las cuatro entidades —y la que añade la `fuente` a un grupo,
   que `rangoDeGrupo` no trae—. Reescribir ese reparto aquí habría sido la
   segunda fórmula que el apartado 37 prohíbe. */
import { rangoDeDestino, tipoEntidad, nombreDeDestino } from './historialRangos.js';
import { contribucionesDeMusculo } from './contribucionMuscular.js';
import { ejercicioPorId } from './ejercicios.js';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
/* Apartado 33 — nunca un `NaN`, un `Infinity` ni un `undefined` en pantalla. */
const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS ESTADOS EN LOS QUE PUEDE ESTAR (apartados 6, 7 y 33)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ESTADOS_SIGUIENTE = [
  { id: 'en_camino', que: 'Tiene rango y hay uno por encima.' },
  { id: 'maximo', que: 'Ya está en el rango más alto de la escala.' },
  { id: 'sin_rango', que: 'Todavía no hay datos para darle un rango.' },
];
export const estadoSiguiente = (id) => ESTADOS_SIGUIENTE.find((e) => e.id === texto(id)) || null;

/** Apartado 7, literal. ⚠️ Y **nunca** un 0 % ni un «te falta X». */
export const SIN_RANGO_TODAVIA = 'Completa o clasifica ejercicios para obtener tu primer rango.';
/** Apartado 6, literal. ⚠️ Y **sin barra vacía**. */
export const RANGO_MAXIMO = 'Rango máximo alcanzado';
/** Apartado 17 — el global con poca cobertura lo dice **antes** que el progreso. */
export const COBERTURA_INSUFICIENTE = 'Datos insuficientes para una estimación sólida.';

/* ═══════════════════════════════════════════════════════════════════════════
   2 · `getNextRankProgress` (apartados 3 y 4)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Los puntos que faltan para el siguiente umbral.
 *
 * 🚨 Es lo único que esta fase calcula de nuevo, y sale de `RANK_THRESHOLDS`
 * (apartado 2): *"NO crear thresholds nuevos dentro de componentes visuales"*.
 * ⚠️ Nunca negativo y nunca `NaN`: un score por encima de su propio umbral
 * siguiente no puede pasar —`rangoDePuntuacion` lo habría subido de rango—,
 * pero si el dato viniera roto se devuelve `null` en vez de una resta absurda
 * (apartado 33).
 */
export function puntosQueFaltan(score, ordenActual) {
  const s = numero(score);
  const o = numero(ordenActual);
  if (s === null || o === null || o < 1 || o >= RANK_THRESHOLDS.length) return null;
  const umbral = RANK_THRESHOLDS[o];
  if (!Number.isFinite(umbral)) return null;
  const faltan = Math.round(umbral - s);
  return faltan > 0 ? faltan : null;
}

/**
 * 🚨 **Cuándo se puede decir el número exacto de puntos** (apartados 8, 9 y 11).
 *
 * El apartado 11 lo condiciona a que *"la confianza permita mostrarlo"*, y el 9
 * deja enseñar el progreso salido del cuestionario **etiquetado**. Así que la
 * barra y el porcentaje se ven siempre que haya rango, y **la cifra exacta solo
 * cuando hay datos reales detrás**: decir *"te faltan 84 puntos"* de una
 * estimación es prometer una precisión que esa estimación no tiene.
 */
export function puntosFiables({ fuente = null, confianza = null } = {}) {
  if (fuente === 'cuestionario') return false;
  return confianza === 'media' || confianza === 'alta';
}

/** Las etiquetas del estado del cálculo (apartados 8, 9, 10 y 19). */
export const ETIQUETAS = {
  estimacion: 'Estimación inicial',
  provisional: 'Progreso provisional',
  cobertura: 'Cobertura limitada',
  real: 'Basado en tus entrenamientos registrados.',
};

/**
 * Cómo se presenta la fiabilidad, en una frase corta y discreta.
 *
 * ⚠️ *"No ocultar la información"* (apartado 8): con poca confianza **se sigue
 * enseñando el progreso**, solo que dice lo que es.
 */
export function avisoDeFiabilidad({ fuente = null, confianza = null, cobertura = null } = {}) {
  const partes = [];
  if (fuente === 'cuestionario') partes.push(ETIQUETAS.estimacion);
  else if (confianza === 'baja' || fuente === 'combinado') partes.push(ETIQUETAS.provisional);
  /* Apartado 18 — el progreso nunca tapa la cobertura, y el 19 los junta
     cuando los dos flojean: «Progreso provisional · Cobertura limitada». */
  if (cobertura && cobertura.total && cobertura.grupos < cobertura.total) partes.push(ETIQUETAS.cobertura);
  return partes.length ? partes.join(' · ') : null;
}

/**
 * **`getNextRankProgress(entity)` del apartado 3**, para cualquiera de las
 * cuatro entidades. Devuelve rango actual, score, siguiente, umbral, progreso
 * dentro del rango, puntos restantes, si hay siguiente y la confianza.
 *
 * 🚨 **No calcula el rango**: se lo pide a `rangoDeDestino` (F22 → F19), que es
 * el RankEngine. Y el progreso dentro del rango lo da `progresoHaciaSiguiente`
 * (F15), que ya mide **entre los dos umbrales**, no sobre el máximo.
 */
export function progresoAlSiguiente(fitness, destino, { propios = [], perfil = null } = {}) {
  const t = texto(destino && destino.tipo);
  const id = texto(destino && destino.id);
  if (!tipoEntidad(t)) return vacio(t, id, 'destino_desconocido');

  const r = rangoDeDestino(fitness, { tipo: t, id }, { propios, perfil });
  if (!r || r.sinRango) {
    return {
      ...vacio(t, id, (r && r.motivo) || 'sin_datos'),
      cobertura: (r && r.cobertura) || null,
    };
  }

  const score = numero(r.score);
  const ordenActual = numero(r.rango);
  const dentro = score !== null ? progresoHaciaSiguiente(score) : null;
  const haySiguiente = !!(dentro && dentro.siguiente);
  const umbralSiguiente = haySiguiente ? numero(RANK_THRESHOLDS[ordenActual]) : null;
  const faltan = haySiguiente ? puntosQueFaltan(score, ordenActual) : null;
  const confianza = r.confianza || null;
  const fuente = r.fuente || null;
  const cobertura = r.cobertura || null;
  const fiables = puntosFiables({ fuente, confianza });

  return {
    tipo: t,
    id,
    estado: haySiguiente ? 'en_camino' : 'maximo',
    /* `currentRank` / `currentScore` */
    rango: ordenActual,
    nombre: r.nombre || (ordenActual ? nivelRango(ordenActual).nombre : SIN_RANGO.nombre),
    score,
    /* `nextRank` / `nextRankThreshold` */
    siguiente: haySiguiente ? dentro.siguiente : null,
    nombreSiguiente: haySiguiente ? nivelRango(dentro.siguiente).nombre : null,
    umbralSiguiente,
    haySiguiente,
    /* `progressWithinRank` — entre los DOS umbrales (apartado 4). */
    fraccion: dentro ? dentro.fraccion : null,
    porcentaje: dentro ? Math.round(dentro.fraccion * 100) : null,
    /* `pointsRemaining` — y solo se afirma si se puede afirmar. */
    puntosRestantes: faltan,
    puntosVisibles: fiables && faltan !== null,
    /* `confidence`, y con qué se ha calculado. */
    confianza,
    confianzaNombre: r.confianzaNombre || nombreConfianza(confianza),
    fuente,
    fuenteNombre: fuente ? (fuenteRango(fuente) || {}).nombre || null : null,
    cobertura,
    provisional: !!r.provisional,
    aviso: avisoDeFiabilidad({ fuente, confianza, cobertura }),
    /* Apartado 10 — y si sale de entrenamientos de verdad, se dice así. */
    base: fuente === 'entrenamiento' ? ETIQUETAS.real : null,
    dataPoints: numero(r.dataPoints),
    motivo: null,
  };
}

const nombreConfianza = (id) => (CONFIANZA.find((c) => c.id === texto(id)) || {}).nombre || null;

function vacio(tipo, id, motivo) {
  return {
    tipo, id, estado: 'sin_rango', rango: null, nombre: SIN_RANGO.nombre, score: null,
    siguiente: null, nombreSiguiente: null, umbralSiguiente: null, haySiguiente: false,
    fraccion: null, porcentaje: null, puntosRestantes: null, puntosVisibles: false,
    confianza: null, confianzaNombre: null, fuente: null, fuenteNombre: null,
    cobertura: null, provisional: false, aviso: null, base: null, dataPoints: null, motivo,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · QUÉ SE LE DICE (apartados 1, 6, 7, 12, 13 y 14)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 **La frase que NO se puede decir de otra manera** (apartado 12): un score
 * combina varias métricas, así que lo que falta se dice **en rendimiento**,
 * nunca en repeticiones ni en kilos.
 */
export const MEJORAR_RENDIMIENTO = 'Necesitas mejorar tu rendimiento para alcanzar el siguiente rango.';
/**
 * Apartado 14 — en un isométrico, **con qué se está midiendo**.
 *
 * ⚠️ Es una nota que ACOMPAÑA, no un sustituto de los puntos: un punto es
 * neutro respecto a la métrica, así que *"Estás a 85 puntos"* es igual de
 * cierto para una plancha que para un press. Lo que cambia es de dónde sale
 * ese score, y eso es lo que esta frase dice. Sustituir el número por ella
 * escondería información que sí se puede dar (apartado 8).
 */
export const MEJORAR_ISOMETRICO = 'Progreso basado en duración y/o nivel de progresión.';

/**
 * La línea principal de la tarjeta.
 *
 * ⚠️ *"Estás a 84 puntos del siguiente rango"* **solo si son fiables**
 * (apartado 1: *"Si el score actual y el threshold son fiables"*). Si no, se
 * dice lo que se puede decir sin inventar una cifra.
 */
export function textoDeLoQueFalta(progreso, { isometrico = false } = {}) {
  const p = progreso || {};
  if (p.estado === 'sin_rango') return SIN_RANGO_TODAVIA;
  if (p.estado === 'maximo') return RANGO_MAXIMO;
  if (p.puntosVisibles) {
    return `Estás a ${p.puntosRestantes} ${p.puntosRestantes === 1 ? 'punto' : 'puntos'} de ${p.nombreSiguiente}.`;
  }
  return isometrico ? MEJORAR_ISOMETRICO : MEJORAR_RENDIMIENTO;
}

/**
 * Apartado 23 — *"+40 puntos dentro de Intermedio"*, que **no** es subir de
 * rango.
 *
 * ⚠️ Recibe el score anterior; no lo busca. Quien sabe de historial es la F22 y
 * esta fase **no escribe un segundo historial**: la pantalla le pasa el punto
 * anterior que ya tiene calculado.
 */
export function cambioDentroDelRango(progreso, scoreAnterior) {
  const p = progreso || {};
  const antes = numero(scoreAnterior);
  const ahora = numero(p.score);
  if (antes === null || ahora === null || p.estado === 'sin_rango') return null;
  const dif = Math.round(ahora - antes);
  if (dif === 0) return null;
  /* Si cambió el rango, esto no es «dentro del rango»: lo cuenta la F22. */
  if (progresoHaciaSiguiente(antes) && progresoHaciaSiguiente(antes).orden !== p.rango) return null;
  return {
    puntos: dif,
    /* Apartado 25 — un descenso se dice sin dramatizar. */
    texto: dif > 0 ? `+${dif} puntos dentro de ${p.nombre}` : `${dif} puntos dentro de ${p.nombre}`,
    sentido: dif > 0 ? 'sube' : 'baja',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LOS EJERCICIOS QUE MÁS PESAN (apartados 21 y 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cuántos se enseñan: *"2–4 ejercicios"*, literal. */
export const RELEVANTES_MAX = 4;
/**
 * 🚨 Apartado 22 — *"No decir: debes entrenar dominadas"*. Lo único que se
 * puede afirmar es cuáles pesan más **ahora mismo**.
 */
export const ETIQUETA_RELEVANTES = 'Estos ejercicios tienen mayor contribución actualmente.';

/**
 * Los ejercicios con más contribución y datos válidos.
 *
 * 🚨 **Reutiliza la lógica de la F21** (apartado 21, literal): ni un segundo
 * cálculo de contribución. Un ejercicio y el rango global no tienen músculo del
 * que repartir, así que devuelven `null` en vez de una lista inventada.
 */
export function ejerciciosRelevantes(fitness, destino, { propios = [], perfil = null, limite = RELEVANTES_MAX } = {}) {
  const t = texto(destino && destino.tipo);
  const id = texto(destino && destino.id);
  if (t !== 'muscleGroup' && t !== 'subgroup') return null;
  const c = contribucionesDeMusculo(
    fitness,
    t === 'muscleGroup' ? { grupoId: id } : { subgrupoId: id },
    { propios, perfil },
  );
  const conDatos = lista(c && c.conDatos).slice(0, Math.max(0, limite));
  return conDatos.length ? conDatos : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LA TARJETA (apartados 27, 29 y 30)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Qué se puede abrir desde la tarjeta (apartado 30), sin pantallas nuevas. */
export const SALIDAS_TARJETA = [
  { id: 'porQue', texto: 'Ver por qué', lleva: 'RankExplanation (F20)' },
  { id: 'relevantes', texto: 'Ejercicios relevantes', lleva: 'MuscleContribution (F21) / ProgresoEjercicio (F12)' },
];

/**
 * Todo lo que la tarjeta necesita, de una sola llamada.
 *
 * ⚠️ **El isométrico se decide por el ejercicio**, no por el texto: un L-sit se
 * mide en segundos y su frase lo dice (apartado 14).
 */
export function tarjetaSiguienteRango(fitness, destino, { propios = [], perfil = null, scoreAnterior = null } = {}) {
  const progreso = progresoAlSiguiente(fitness, destino, { propios, perfil });
  const isometrico = esIsometrico(fitness, destino, propios);
  /* Apartado 17 — con poca cobertura, el global dice ESO primero. */
  const coberturaCorta = progreso.estado === 'sin_rango'
    && progreso.tipo === 'overall'
    && progreso.motivo === 'poca_cobertura';
  return {
    destino: { tipo: progreso.tipo, id: progreso.id, nombre: nombreDeDestino(progreso, propios) },
    progreso,
    titulo: progreso.nombre,
    /* Apartado 6 — sin siguiente rango no hay barra: `null`, no un 0 %. */
    barra: progreso.estado === 'en_camino' ? { fraccion: progreso.fraccion, porcentaje: progreso.porcentaje } : null,
    falta: coberturaCorta ? COBERTURA_INSUFICIENTE : textoDeLoQueFalta(progreso, { isometrico }),
    /* Apartado 14 — y en un isométrico, con qué se mide, ADEMÁS de los puntos. */
    metrica: isometrico && progreso.estado === 'en_camino' ? MEJORAR_ISOMETRICO : null,
    aviso: progreso.aviso,
    base: progreso.base,
    cobertura: progreso.cobertura,
    cambio: cambioDentroDelRango(progreso, scoreAnterior),
    relevantes: ejerciciosRelevantes(fitness, destino, { propios, perfil }),
    etiquetaRelevantes: ETIQUETA_RELEVANTES,
    salidas: SALIDAS_TARJETA,
    isometrico,
  };
}

/**
 * Un ejercicio cuyo rendimiento se mide en tiempo (apartado 14).
 *
 * 🐛 **Lo decide el CATÁLOGO, no `progresoDeEjercicio`**, y aquí estuvo el
 * fallo: aquella función devuelve `exerciseId`, `nombre`, `veces`, `mejor`,
 * `tendencia`… y **ninguna `clase`**. Leerla habría dado `undefined` siempre,
 * así que un L-sit habría salido con la frase de repeticiones **sin que fallara
 * nada**. Es la lección de la FORMA de lo que devuelve una función otra vez
 * (FIT F7, `musculosResumidos`). Las `medidas` son de la F2 y son la fuente.
 */
export function esIsometrico(fitness, destino, propios = []) {
  if (texto(destino && destino.tipo) !== 'exercise') return false;
  const ej = ejercicioPorId(texto(destino.id), lista(propios));
  const medidas = lista(ej && ej.medidas);
  return medidas.includes('tiempo') && !medidas.includes('reps');
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LO QUE NO ENTRA, Y POR QUÉ
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT23 = [
  { que: 'Predecir cuánto tardará en subir', porque: 'Apartados 0 y 36, los dos literales. No hay ni un modelo que lo sostenga, y una fecha inventada es peor que no decir nada.' },
  { que: 'Convertir los puntos en kilos o en repeticiones', porque: 'Apartados 12 y 13: el score combina varias métricas, así que *"necesitas exactamente 3 repeticiones más"* es una precisión que el dato no tiene. Hay un barrido sobre todos los textos de esta fase.' },
  { que: 'Umbrales nuevos', porque: 'Apartado 2: son `RANK_THRESHOLDS`, de la F15, y *"NO crear thresholds nuevos dentro de componentes visuales"*.' },
  { que: 'Una segunda fórmula del progreso dentro del rango', porque: 'Apartado 37: `progresoHaciaSiguiente` (F15) ya mide entre los dos umbrales. Dos cuentas darían dos porcentajes para el mismo rango.' },
  { que: 'Guardar `progressWithinRank`', porque: 'Apartado 32: se calcula. Guardarlo sería una copia que miente en cuanto entrene.' },
  { que: 'Un sistema de objetivos paralelo', porque: 'Apartado 0. Los objetivos de Fitness son los de la F14 (`fitness.objetivos`) y los globales los de la Fase 9.' },
  { que: 'XP, recompensas, leaderboard, comparación social, objetivos automáticos y estimación de hipertrofia', porque: 'Apartado 36, que los enumera uno a uno, y D2-02: los niveles solo existen dentro de Sonido y Rachas. Un rango mide lo que levanta, no premia usar la aplicación (C-33).' },
  { que: '«Estás a 1 punto de bajar»', porque: 'Apartado 26: la histéresis de la F19 puede impedir esa bajada, así que anunciarla sería avisar de algo que no va a pasar. La pantalla consume el estado final del motor.' },
];

export const DECISIONES_FIT23 = [
  { que: 'Cuatro de los cinco componentes del apartado 29 YA EXISTÍAN', porque: '`RankProgressBar` es `RankProgress` (F15), `RankNextStep` es `siguientePaso()` (F20), y `RankCoverage` y `RankConfidence` son los de la F20. Lo único nuevo es `RankNextLevelCard`. *"Evitar duplicaciones"*, literal.' },
  { que: 'Y la fórmula del apartado 4 también estaba resuelta', porque: '`progresoHaciaSiguiente` mide entre el umbral del rango actual y el del siguiente —no `score / 600`—, que es justo lo que el apartado pide que NO se haga. Esta fase solo le añade los puntos que faltan.' },
  { que: 'La cifra exacta de puntos solo se dice con datos reales detrás', porque: 'El apartado 11 la condiciona a que *"la confianza permita mostrarlo"* y el 9 deja enseñar lo del cuestionario **etiquetado**. La barra y el porcentaje se ven siempre; *"te faltan 84 puntos"* de una estimación prometería una precisión que no tiene.' },
  { que: 'Sin siguiente rango NO hay barra, ni siquiera al 100 %', porque: 'Apartado 6: *"No mostrar una barra vacía"*. Una barra llena tampoco dice nada — lo que hay que leer es «Rango máximo alcanzado».' },
  { que: 'El progreso y la cobertura van juntos, nunca el progreso solo', porque: 'Apartado 18: sin la cobertura al lado, un 68 % *"parece una medición física absoluta"*.' },
  { que: '`cambioDentroDelRango` recibe el score anterior, no lo busca', porque: 'Quien sabe de historial es la F22. Que esta fase lo calculara sería el segundo historial, y acabarían diciendo cosas distintas.' },
  { que: 'Los ejercicios relevantes salen de la F21', porque: 'Apartado 21, literal: *"Esto debe reutilizar la lógica de la Fase 21"*. Y se dice lo único afirmable —cuáles pesan más ahora—, nunca *"debes entrenar dominadas"* (apartado 22).' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LA AUDITORÍA (apartado 37)
   ═══════════════════════════════════════════════════════════════════════════
   Las siete preguntas del criterio de finalización, **calculadas**. Van aparte
   en `casillasDelSiguiente` para poder ponerlas rojas con un progreso
   inventado: una auditoría que no puede fallar no sirve (EH F42). */

export function auditarSiguienteRango(fitness, destino, { propios = [], perfil = null } = {}) {
  return casillasDelSiguiente(tarjetaSiguienteRango(fitness, destino, { propios, perfil }));
}

export function casillasDelSiguiente(tarjeta) {
  const t = tarjeta || {};
  const p = t.progreso || {};
  const casillas = [
    { id: 1, texto: 'Qué rango tiene', ok: p.estado === 'sin_rango' ? p.nombre === SIN_RANGO.nombre : !!p.nombre && p.rango >= 1 },
    { id: 2, texto: 'Cuál es el siguiente', ok: p.estado === 'en_camino' ? !!p.nombreSiguiente : p.nombreSiguiente === null },
    { id: 3, texto: 'Qué progreso lleva dentro del rango', ok: p.estado === 'en_camino' ? (p.porcentaje >= 0 && p.porcentaje <= 100) : p.porcentaje === null || p.estado === 'maximo' },
    { id: 4, texto: 'Cuántos puntos faltan, si es fiable', ok: p.puntosVisibles ? p.puntosRestantes > 0 : true },
    { id: 5, texto: 'Cuánta cobertura tiene', ok: p.tipo !== 'overall' || p.cobertura === null || !!(p.cobertura && p.cobertura.texto) },
    { id: 6, texto: 'Qué confianza tiene el cálculo', ok: p.estado === 'sin_rango' || !!p.confianza || !!p.fuente },
    { id: 7, texto: 'Qué ejercicios están contribuyendo', ok: t.relevantes === null || lista(t.relevantes).every((x) => x && x.exerciseId) },
    /* Apartado 33 — y ni un número imposible en toda la tarjeta. */
    { id: 8, texto: 'Ni NaN, ni Infinity, ni undefined en ningún número', ok: sinNumerosRotos(t) },
  ];
  return { casillas, ok: casillas.every((c) => c.ok), estado: p.estado || null };
}

/** Barre la tarjeta entera buscando lo que el apartado 33 prohíbe enseñar. */
export function sinNumerosRotos(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor);
  if (typeof valor === 'string') return !/NaN|Infinity|undefined/.test(valor);
  if (Array.isArray(valor)) return valor.every(sinNumerosRotos);
  if (valor && typeof valor === 'object') return Object.values(valor).every(sinNumerosRotos);
  return true;
}

/** El máximo de la escala, para quien necesite el tope (nunca un hex ni un 600 a mano). */
export const TOPE_ESCALA = PUNTUACION_MAXIMA;
export const GRUPOS_TOTALES = GRUPOS_MUSCULARES.length;
