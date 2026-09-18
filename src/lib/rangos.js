import { GRUPOS_MUSCULARES, NIVELES_RANGO, SIN_RANGO, nivelRango, subgrupoMuscular } from './fitness';
import { ejercicioPorId } from './ejercicios';
import { indiceDeProgresion, aparicionesDeEjercicio, progresoDeEjercicio, textoSerie } from './progresion';
import { repartoMuscular } from './progresoMuscular';

/* Entrega 4 · Fase 15/45 — «Sistema base de rangos y clasificación».
   ═══════════════════════════════════════════════════════════════════════════

   La base de Rangos: **lógica, configuración y componentes**, sin la pantalla
   (apartado 30). Rango de un ejercicio, de un subgrupo, de un grupo y global.

   🚨 **LO PRIMERO, Y SE DICE EN LA PANTALLA CUANDO LLEGUE** (apartado 1): un
   rango es **una métrica interna de JosStyle**, no un nivel físico real ni un
   estándar atlético científico. Las referencias de abajo son una **convención**,
   escrita en un solo sitio para poder cambiarla, no una medición de nada.

   🚨 **Y NADA SE GUARDA** (apartado 28). La fuente de verdad sigue siendo
   ejercicio + sesiones + perfil; el rango se calcula al pedirlo con la F11 y la
   F13. El \`MuscleRank\` guardado de la F1 (\`fitness.rangos\`) no se usa como
   verdad: si una fase necesita caché, se invalida y se recalcula.

   ── LA FÓRMULA (apartados 5-11, 18 y 23), en cinco pasos ─────────────────────
   1. **La marca de cada aparición**, según la clase de la F11 (apartado 8):
        · repeticiones → las de la mejor serie;
        · tiempo       → los segundos de la mejor serie;
        · carga        → una estimación de 1RM (Epley: peso × (1 + reps / 30)),
                          y dividida por el peso corporal si el perfil lo tiene;
        · lastre       → lo mismo con (peso corporal + lastre); sin peso corporal,
                          solo el lastre.
      La estimación solo sirve para poner en la misma escala «80 × 5» y «70 × 8»;
      **no se enseña** como un 1RM (la F11, apartado 41, lo prohíbe como dato).
   2. **Su puntuación**, de 0 a 1000: \`1000 × min(1, marca / referencia)^CURVA\`.
      La referencia depende de la clase y de la **dificultad** del ejercicio en el
      catálogo (apartado 9): 12 muscle-ups no valen lo mismo que 12 curls.
   3. **Estabilidad** (apartado 23): la puntuación del ejercicio es la **mejor de
      sus últimas apariciones** (\`VENTANA_ESTABILIDAD\`), no la última. Un mal día
      no baja el rango; tiene que sostenerse un rendimiento peor durante varias
      sesiones para que baje.
   4. **Músculos** (apartados 17-19): la puntuación de un grupo o subgrupo es la
      **media ponderada** de sus ejercicios con rango, pesando cada uno por su
      porcentaje de implicación del catálogo. Así un press que es 50 % pecho
      pesa el doble en Pecho que en Tríceps, y un ejercicio no cuenta al 100 % en
      todo.
   5. **Global** (apartados 20-22): la media de los grupos **que tienen datos**,
      y solo si hay \`COBERTURA_MINIMA_GLOBAL\` grupos. Un grupo sin datos **no
      cuenta como cero**: no entrenar el cuello no baja nada.

   La **confianza** (apartado 11) no toca la puntuación: dice cuántos datos hay
   detrás, y con poca, la clasificación es **provisional** (apartado 12). */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LA CONFIGURACIÓN CENTRAL (apartado 24)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Todo lo que se pueda querer cambiar está AQUÍ y solo aquí. Ni un
   `if (score > 100)` por la aplicación. */

/** Los rangos: los de la F1 (C-33), con lo que pide el apartado 2. */
export const RANK_DEFINITIONS = NIVELES_RANGO.map((n) => ({
  ...n,
  descripcion: n.que,
  forma: 'hexagono',
}));

/** El umbral de puntuación de cada rango. ⚠️ No es lineal: cada rango cuesta
 *  algo más que el anterior, que es como funciona progresar de verdad. */
export const RANK_THRESHOLDS = [0, 80, 170, 270, 380, 500, 620, 740, 860, 950];

export const PUNTUACION_MAXIMA = 1000;
/* < 1: los primeros avances se notan antes que los últimos. */
export const CURVA = 0.8;

/** A qué marca corresponde la puntuación máxima, por clase y dificultad. Es la
 *  convención de la aplicación, no un estándar publicado (apartado 1). */
export const REFERENCIAS = {
  repeticiones: { principiante: 50, intermedio: 30, avanzado: 20, experto: 12 },
  tiempo: { principiante: 180, intermedio: 90, avanzado: 45, experto: 20 },
  /* Con peso corporal: veces el peso corporal. Sin él: kilos. */
  carga: {
    relativa: { principiante: 1.0, intermedio: 1.6, avanzado: 2.0, experto: 2.4 },
    absoluta: { principiante: 70, intermedio: 120, avanzado: 150, experto: 180 },
  },
  lastre: {
    relativa: { principiante: 1.6, intermedio: 1.9, avanzado: 2.2, experto: 2.5 },
    absoluta: { principiante: 40, intermedio: 60, avanzado: 80, experto: 100 },
  },
};

/** Cuántas apariciones recientes cuentan para la estabilidad (apartado 23). */
export const VENTANA_ESTABILIDAD = 5;

/** Confianza (apartado 11): cuántas apariciones hacen falta. */
export const CONFIANZA = [
  { id: 'baja', nombre: 'Poca información', desde: 1 },
  { id: 'media', nombre: 'Información suficiente', desde: 3 },
  { id: 'alta', nombre: 'Mucha información', desde: 10 },
];

/** Global (apartado 20): hacen falta las dos cosas. 🚨 Solo grupos NO basta: unas
 *  dominadas tocan espalda, brazos y abdominales, así que **un solo ejercicio**
 *  cubriría tres grupos — y el apartado 20 dice literalmente que un ejercicio
 *  aislado no da rango global. */
export const COBERTURA_MINIMA_GLOBAL = 3;
export const EJERCICIOS_MINIMOS_GLOBAL = 3;

/** El peso corporal solo se usa si es un número razonable. */
export const PESO_CORPORAL_VALIDO = { min: 30, max: 250 };

/* ═══════════════════════════════════════════════════════════════════════════
   2 · DE PUNTUACIÓN A RANGO
   ═══════════════════════════════════════════════════════════════════════════ */

/** El rango (orden 1-10) de una puntuación, o `null` sin puntuación. */
export function rangoDePuntuacion(puntuacion) {
  if (typeof puntuacion !== 'number' || !Number.isFinite(puntuacion)) return null;
  let orden = 1;
  RANK_THRESHOLDS.forEach((umbral, i) => { if (puntuacion >= umbral) orden = i + 1; });
  return orden;
}

/** Cuánto falta para el siguiente (para `RankProgress`). */
export function progresoHaciaSiguiente(puntuacion) {
  const orden = rangoDePuntuacion(puntuacion);
  if (!orden) return null;
  if (orden >= RANK_THRESHOLDS.length) return { orden, siguiente: null, fraccion: 1 };
  const desde = RANK_THRESHOLDS[orden - 1];
  const hasta = RANK_THRESHOLDS[orden];
  return { orden, siguiente: orden + 1, fraccion: Math.max(0, Math.min(1, (puntuacion - desde) / (hasta - desde))) };
}

/** Apartado 3 — el estado de un rango para quien tiene `actual`. ⚠️ Sin rango
 *  todos son «no disponibles», que NO es lo mismo que «bloqueado». */
export function estadoDeRango(orden, actual) {
  if (actual === null || actual === undefined) return 'no_disponible';
  if (orden < actual) return 'conseguido';
  if (orden === actual) return 'actual';
  return 'bloqueado';
}

export const confianzaDe = (n) => [...CONFIANZA].reverse().find((c) => n >= c.desde) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL RANGO DE UN EJERCICIO (apartados 6-16)
   ═══════════════════════════════════════════════════════════════════════════ */

const pesoCorporalDe = (perfil) => {
  const p = Number(perfil?.peso);
  return Number.isFinite(p) && p >= PESO_CORPORAL_VALIDO.min && p <= PESO_CORPORAL_VALIDO.max ? p : null;
};

/** Paso 1 — la marca de una aparición, o `null` si no hay dato válido. */
export function marcaDeAparicion(aparicion, pesoCorporal = null) {
  const m = aparicion?.mejor;
  if (!m) return null;
  if (aparicion.clase === 'repeticiones') return m.reps ? { valor: m.reps, escala: 'reps' } : null;
  if (aparicion.clase === 'tiempo') return m.duracion ? { valor: m.duracion, escala: 's' } : null;
  if (!m.peso || !m.reps) return null;
  const epley = (kg) => kg * (1 + m.reps / 30);
  if (aparicion.clase === 'carga') {
    return pesoCorporal ? { valor: epley(m.peso) / pesoCorporal, escala: 'relativa' } : { valor: epley(m.peso), escala: 'absoluta' };
  }
  return pesoCorporal
    ? { valor: epley(pesoCorporal + m.peso) / pesoCorporal, escala: 'relativa' }
    : { valor: epley(m.peso), escala: 'absoluta' };
}

/** Paso 2 — la puntuación de una marca. */
export function puntuacionDeMarca(clase, marca, dificultad = 'principiante') {
  if (!marca || !(marca.valor > 0)) return null;
  const tabla = clase === 'carga' || clase === 'lastre' ? REFERENCIAS[clase][marca.escala] : REFERENCIAS[clase];
  const referencia = tabla && (tabla[dificultad] || tabla.principiante);
  if (!referencia) return null;
  return Math.round(PUNTUACION_MAXIMA * Math.pow(Math.min(1, marca.valor / referencia), CURVA));
}

/**
 * 🚨 El `calculateExerciseScore` del apartado 10. Puro: recibe el ejercicio,
 * sus apariciones (F11) y el perfil; no sabe nada de React ni de la pantalla.
 */
export function puntuacionDeEjercicio(ejercicio, apariciones, perfil = null) {
  const l = lista(apariciones);
  if (!ejercicio || !l.length) return null;
  /* La forma de medir de la ÚLTIMA vez: no se mezclan puntuaciones con lastre y
     sin él (F11 y apartado 14). */
  const clase = l[0].clase;
  const pesoCorporal = pesoCorporalDe(perfil);
  const puntuadas = l
    .filter((a) => a.clase === clase)
    .map((a) => ({ a, p: puntuacionDeMarca(clase, marcaDeAparicion(a, pesoCorporal), ejercicio.dificultad) }))
    .filter((x) => x.p !== null);
  if (!puntuadas.length) return null;
  /* Paso 3 — la mejor de las últimas, para que un mal día no baje el rango. */
  const recientes = puntuadas.slice(0, VENTANA_ESTABILIDAD);
  const mejor = recientes.reduce((x, y) => (y.p > x.p ? y : x));
  return {
    score: mejor.p,
    clase,
    metrica: clase,
    usaPesoCorporal: (clase === 'carga' || clase === 'lastre') && !!pesoCorporal,
    dataPoints: puntuadas.length,
    mejorMarca: textoSerie(clase, mejor.a.mejor),
    fechaMarca: mejor.a.fecha,
  };
}

/** El `getExerciseRank` del apartado 13: **el rango que sale de entrenar**.
 *
 * 🔓 **FIT F19 — quién manda entre la estimación y lo real ya no se decide
 * aquí.** La F17 metió en esta función la rama del cuestionario; la F19 se la
 * lleva a `src/lib/motorRangos.js` (su apartado 28), que es el único sitio
 * donde se elige fuente y donde viven los umbrales. Esta función sigue siendo
 * lo que era: la puntuación del rendimiento real contra la escala. */
export function rangoDeEjercicio(fitness, exerciseId, { propios = [], perfil = null } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), propios);
  const apariciones = aparicionesDeEjercicio(fitness, exerciseId, propios);
  const p = ej ? puntuacionDeEjercicio(ej, apariciones, perfil) : null;
  if (!p) {
    return { exerciseId: texto(exerciseId), existe: !!ej, sinRango: true, rango: null, nombre: SIN_RANGO.nombre, score: null, confianza: null, provisional: false, dataPoints: 0, fuente: null };
  }
  const orden = rangoDePuntuacion(p.score);
  const conf = confianzaDe(p.dataPoints);
  return {
    exerciseId: texto(exerciseId),
    existe: true,
    sinRango: false,
    rango: orden,
    nombre: nivelRango(orden).nombre,
    score: p.score,
    metrica: p.metrica,
    usaPesoCorporal: p.usaPesoCorporal,
    /* FIT F17 — de dónde sale este rango. Los datos reales mandan siempre. */
    fuente: 'entrenamiento',
    confianza: conf.id,
    confianzaNombre: conf.nombre,
    /* Apartado 12 — con poca información, provisional. */
    provisional: conf.id === 'baja',
    dataPoints: p.dataPoints,
    mejorMarca: p.mejorMarca,
    tendencia: progresoDeEjercicio(fitness, exerciseId, { propios }).tendencia,
    siguiente: progresoHaciaSiguiente(p.score),
    /* El `lastUpdated` del apartado 4: cuándo fue el dato en que se basa. */
    ultimaActualizacion: p.fechaMarca,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · MÚSCULOS Y GLOBAL (apartados 17-22)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los rangos de todos los ejercicios que ha hecho, con su reparto muscular. */
/** ⚠️ **Solo lo entrenado.** Quien quiera la lista con las estimaciones ya
 *  resueltas usa `rangosEfectivos` (FIT F19, `motorRangos.js`): meter aquí el
 *  cuestionario dejaba dos sitios decidiendo la misma cosa. */
export function rangosDeEjercicios(fitness, { propios = [], perfil = null } = {}) {
  const indice = indiceDeProgresion(fitness, propios);
  return [...indice.keys()]
    .map((id) => ({ r: rangoDeEjercicio(fitness, id, { propios, perfil }), ej: ejercicioPorId(id, propios) }))
    .filter((x) => !x.r.sinRango && x.ej)
    .map((x) => ({ ...x.r, reparto: repartoMuscular(x.ej) }));
}

function rangoPonderado(ejercicios, pesoDe) {
  const conPeso = ejercicios.map((e) => ({ e, w: pesoDe(e) })).filter((x) => x.w > 0);
  if (!conPeso.length) return null;
  const sumaW = conPeso.reduce((n, x) => n + x.w, 0);
  const score = Math.round(conPeso.reduce((n, x) => n + x.e.score * x.w, 0) / sumaW);
  const dataPoints = conPeso.reduce((n, x) => n + x.e.dataPoints, 0);
  const orden = rangoDePuntuacion(score);
  /* 🐛 FIT F17 — `confianzaDe(0)` es `null`: la tabla empieza en una aparición,
     y hasta ahora un grupo sin apariciones nunca llegaba aquí. Con el
     cuestionario sí llega —un grupo puede tener rango con CERO sesiones—, y
     leer `conf.id` tiraba la pantalla entera. Sin datos reales, la confianza es
     la más baja que hay, que es exactamente lo que significa. */
  const conf = confianzaDe(dataPoints) || CONFIANZA[0];
  return {
    sinRango: false,
    rango: orden,
    nombre: nivelRango(orden).nombre,
    score,
    ejercicios: conPeso.length,
    dataPoints,
    confianza: conf.id,
    /* FIT F17 — sin una sola sesión detrás, provisional siempre. */
    provisional: conf.id === 'baja' || conPeso.length === 1 || dataPoints === 0,
    estimado: dataPoints === 0,
  };
}

const SIN = (extra) => ({ sinRango: true, rango: null, nombre: SIN_RANGO.nombre, score: null, ejercicios: 0, dataPoints: 0, confianza: null, provisional: false, ...extra });

/** El `getMuscleSubgroupRank` del apartado 19. */
export function rangoDeSubgrupo(ejerciciosConRango, subgrupoId) {
  const s = subgrupoMuscular(subgrupoId);
  const r = rangoPonderado(ejerciciosConRango, (e) => e.reparto.filter((x) => x.subgrupoId === subgrupoId).reduce((n, x) => n + x.peso, 0));
  return r ? { id: subgrupoId, nombreMusculo: s ? s.nombre : subgrupoId, ...r } : SIN({ id: subgrupoId, nombreMusculo: s ? s.nombre : subgrupoId });
}

/** El `getMuscleGroupRank` del apartado 17. */
export function rangoDeGrupo(ejerciciosConRango, grupoId) {
  const g = GRUPOS_MUSCULARES.find((x) => x.id === grupoId);
  const r = rangoPonderado(ejerciciosConRango, (e) => e.reparto.filter((x) => x.grupoId === grupoId).reduce((n, x) => n + x.peso, 0));
  const subgrupos = lista(g && g.subgrupos).map((sg) => rangoDeSubgrupo(ejerciciosConRango, sg.id));
  return r ? { id: grupoId, nombreMusculo: g ? g.nombre : grupoId, ...r, subgrupos } : SIN({ id: grupoId, nombreMusculo: g ? g.nombre : grupoId, subgrupos });
}

/** El `getOverallRank` del apartado 20, con su cobertura (21). */
export function rangoGlobal(fitness, { propios = [], perfil = null } = {}) {
  const ejercicios = rangosDeEjercicios(fitness, { propios, perfil });
  const grupos = GRUPOS_MUSCULARES.map((g) => rangoDeGrupo(ejercicios, g.id));
  const conDatos = grupos.filter((g) => !g.sinRango);
  const cobertura = { grupos: conDatos.length, total: grupos.length, texto: `${conDatos.length}/${grupos.length}` };
  /* 🚨 Apartado 22 — la media es de los grupos CON datos: uno sin datos no es un 0. */
  if (conDatos.length < COBERTURA_MINIMA_GLOBAL || ejercicios.length < EJERCICIOS_MINIMOS_GLOBAL) {
    return {
      ...SIN(),
      cobertura: { ...cobertura, ejercicios: ejercicios.length },
      grupos,
      ejercicios,
      motivo: ejercicios.length === 0 ? 'sin_datos' : 'poca_cobertura',
    };
  }
  const score = Math.round(conDatos.reduce((n, g) => n + g.score, 0) / conDatos.length);
  const orden = rangoDePuntuacion(score);
  return {
    sinRango: false,
    rango: orden,
    nombre: nivelRango(orden).nombre,
    score,
    cobertura: { ...cobertura, ejercicios: ejercicios.length },
    grupos,
    ejercicios,
    provisional: conDatos.some((g) => g.provisional) || conDatos.length < GRUPOS_MUSCULARES.length / 2,
    motivo: null,
  };
}

export const NO_EN_FIT15 = [
  { que: 'La pantalla completa de Rangos, el cuestionario y la anatomía interactiva', porque: 'Apartado 30: son las fases 16 a 25.' },
  { que: 'Rankings públicos, comparación con otros, compartir', porque: 'Apartado 29: los rangos son datos personales.' },
  { que: 'Guardar puntuaciones o rangos', porque: 'Apartado 28: se calculan al pedirlos; `fitness.rangos` de la F1 no se usa como verdad.' },
  { que: 'Enseñar la puntuación o el 1RM estimado', porque: 'Apartado 5 («no es necesario mostrar el número») y F11: la estimación solo pone series en la misma escala.' },
  { que: 'IA, predicción y leaderboard', porque: 'Apartado 30.' },
];
