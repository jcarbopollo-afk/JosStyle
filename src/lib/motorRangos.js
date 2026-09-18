/* ===========================================================================
   ENTREGA 4 · FASE 19/45 — EL MOTOR DE RANGOS (actualización y evolución)

   *"Conseguir que clasificación inicial → entrenamientos reales → progresión →
   score → rango → músculos → rango global funcione de manera coherente."*

   Esta fase **no trae pantalla**: trae la capa que el apartado 28 pide con
   nombre —un `rankEngine`— y que concentra lo que hasta ahora estaba repartido:

   1. **Qué fuente manda** (apartados 2 a 6): la estimación del cuestionario, el
      rendimiento real, o los dos mientras hay pocos datos.
   2. **Cuándo se cambia de fuente** (apartado 7), con los umbrales **en un
      único sitio**: nada de un `if sesiones > 3` suelto por el proyecto.
   3. **Estabilidad** (apartados 13 a 15): subir es fácil, bajar cuesta.
   4. **Invalidación** (apartados 8, 22, 23, 27 y 30): que después de entrenar
      no se enseñe nunca un rango viejo.

   🚨 **Y la regla que lo gobierna todo: nada se guarda.** El rango se calcula
   al pedirlo desde ejercicio + sesiones + clasificación + perfil, así que
   guardar una sesión, borrarla, editarla o cambiar el peso del perfil **ya**
   deja el rango correcto en la siguiente lectura. No hay caché que se pueda
   quedar vieja (apartado 30), y por eso no hace falta un sistema de eventos
   (apartado 29): la invalidación es la propia forma de los datos.
   ⚠️ **Se llama `motorRangos` y eso hace saltar una comprobación ajena.** La
   auditoría de Imagen personal identifica sus librerías por el nombre, y
   `motor` es una de sus palabras (`motorRutinas`, `motorRecomendaciones`,
   `motorProductos`): este archivo está excluido a mano en
   `scripts/test-auditoria-final.mjs`, como `fotoPerfil` y otros seis. Si se
   renombra, hay que quitar esa línea.
   =========================================================================== */

import { GRUPOS_MUSCULARES, SIN_RANGO, nivelRango } from './fitness.js';
import { ejercicioPorId } from './ejercicios.js';
import { aparicionesDeEjercicio, indiceDeProgresion, progresoDeEjercicio } from './progresion.js';
import { repartoMuscular } from './progresoMuscular.js';
import {
  CONFIANZA, COBERTURA_MINIMA_GLOBAL, EJERCICIOS_MINIMOS_GLOBAL, VENTANA_ESTABILIDAD,
  confianzaDe, progresoHaciaSiguiente, puntuacionDeEjercicio, rangoDePuntuacion,
  rangoDeGrupo, rangoDeSubgrupo,
} from './rangos.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS UMBRALES, EN UN ÚNICO SITIO (apartado 7)
   ═══════════════════════════════════════════════════════════════════════════
   *"Los umbrales deben estar centralizados. No dispersar `if sessions > 3` por
   todo el proyecto."* Hay una comprobación que barre el código buscando eso. */

/** Cuántas apariciones reales hacen falta para cada fuente. */
export const UMBRALES_FUENTE = {
  /* Con una sola sesión ya se empieza a hacer caso a la realidad… */
  combinado: 1,
  /* …y a partir de tres, la estimación deja de contar. */
  entrenamiento: 3,
};

export const FUENTES = [
  { id: 'cuestionario', nombre: 'Clasificación inicial', que: 'Lo que estimaste al clasificarlo, todavía sin entrenamientos.' },
  { id: 'combinado', nombre: 'Estimación y entrenamientos', que: 'Tu estimación inicial, corrigiéndose con las sesiones que llevas.' },
  { id: 'entrenamiento', nombre: 'Tus entrenamientos', que: 'Calculado solo con lo que has hecho de verdad.' },
];
export const fuenteRango = (id) => FUENTES.find((f) => f.id === id) || null;

/**
 * Cuánto pesa lo real frente a la estimación, entre los dos umbrales.
 *
 * ⚠️ **Y por qué se mezcla en vez de saltar.** El apartado 4 lo pide con todas
 * las letras: *"no debe producir un salto absurdo simplemente porque exista una
 * sola sesión"*. Con una sesión de tres, lo real pesa un tercio; con dos, dos
 * tercios; con tres, todo. La cuenta es una regla de tres y se puede explicar
 * en una frase, que es lo que pide el apartado 13.
 */
export function pesoDeLoReal(dataPoints) {
  const n = Number(dataPoints) || 0;
  if (n <= 0) return 0;
  if (n >= UMBRALES_FUENTE.entrenamiento) return 1;
  return n / UMBRALES_FUENTE.entrenamiento;
}

/** Qué fuente manda con esos datos (apartado 6). */
export function fuenteDe(dataPoints, hayEstimacion) {
  const n = Number(dataPoints) || 0;
  if (n >= UMBRALES_FUENTE.entrenamiento || (n > 0 && !hayEstimacion)) return 'entrenamiento';
  if (n >= UMBRALES_FUENTE.combinado && hayEstimacion) return 'combinado';
  return hayEstimacion ? 'cuestionario' : null;
}

/* La estimación guardada de un ejercicio (modelo de la F17). */
const estimacionDe = (fitness, exerciseId) =>
  lista(fitness?.clasificaciones).find((c) => c && c.exerciseId === texto(exerciseId) && c.puntuacion !== null) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   2 · EL RANGO EFECTIVO DE UN EJERCICIO (apartado 5)
   ═══════════════════════════════════════════════════════════════════════════ */

const SIN = (exerciseId, existe) => ({
  exerciseId: texto(exerciseId),
  existe,
  sinRango: true,
  rango: null,
  nombre: SIN_RANGO.nombre,
  score: null,
  fuente: null,
  fuenteNombre: null,
  confianza: null,
  confianzaNombre: null,
  provisional: false,
  dataPoints: 0,
  tendencia: null,
  siguiente: null,
  mejorMarca: null,
  ultimaActualizacion: null,
  estimado: false,
});

/**
 * `getEffectiveExerciseRank` (apartado 5): **el único sitio donde se decide qué
 * información se usa**. Devuelve rango, score, confianza, fuente, dataPoints y
 * tendencia. 🚨 Ni la pantalla ni ninguna otra librería vuelve a elegir fuente.
 */
export function rangoEfectivoDeEjercicio(fitness, exerciseId, { propios = [], perfil = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const ej = ejercicioPorId(texto(exerciseId), lista(propios));
  if (!ej) return SIN(exerciseId, false);

  const apariciones = aparicionesDeEjercicio(f, exerciseId, lista(propios));
  /* 🚨 Apartados 14, 15 y 17 — la puntuación real es la de la F15: **la mejor
     de las últimas cinco sesiones**, no la última ni la mejor de siempre. De
     ahí sale la estabilidad de esta fase, y es asimétrica a propósito: para
     SUBIR basta una sesión buena dentro de la ventana; para BAJAR hacen falta
     cinco seguidas peores. Un mal día no baja el rango y una marca de hace dos
     años tampoco lo sostiene. */
  const real = puntuacionDeEjercicio(ej, apariciones, perfil);
  const estimada = estimacionDe(f, exerciseId);
  const dataPoints = real ? real.dataPoints : 0;
  const fuente = fuenteDe(dataPoints, !!estimada);
  if (!fuente) return SIN(exerciseId, true);

  const peso = pesoDeLoReal(dataPoints);
  const score = fuente === 'cuestionario'
    ? estimada.puntuacion
    : (fuente === 'entrenamiento'
      ? real.score
      /* Combinado: regla de tres entre lo estimado y lo real. */
      : Math.round(real.score * peso + estimada.puntuacion * (1 - peso)));

  const orden = rangoDePuntuacion(score);
  /* La confianza es la de la F15 cuando hay sesiones; una estimación nunca pasa
     de «poca información» (F17, apartado 28). */
  const conf = dataPoints > 0 ? (confianzaDe(dataPoints) || CONFIANZA[0]) : CONFIANZA[0];
  const tendencia = dataPoints > 0 ? progresoDeEjercicio(f, exerciseId, { propios: lista(propios) }).tendencia : null;

  return {
    exerciseId: texto(exerciseId),
    existe: true,
    sinRango: false,
    rango: orden,
    nombre: nivelRango(orden).nombre,
    score,
    fuente,
    fuenteNombre: fuenteRango(fuente).nombre,
    confianza: conf.id,
    confianzaNombre: conf.nombre,
    /* Apartado 3 — mientras la estimación cuente para algo, el rango es
       provisional; y con pocos datos reales, también. */
    provisional: fuente !== 'entrenamiento' || conf.id === 'baja',
    dataPoints,
    tendencia,
    siguiente: progresoHaciaSiguiente(score),
    metrica: real ? real.metrica : 'estimacion',
    usaPesoCorporal: !!(real && real.usaPesoCorporal),
    mejorMarca: real ? real.mejorMarca : null,
    ultimaActualizacion: real ? real.fechaMarca : null,
    /* Para las pantallas: si todavía hay estimación por debajo, se dice. */
    estimado: fuente === 'cuestionario',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · MÚSCULOS Y GLOBAL, CON LOS RANGOS EFECTIVOS (apartados 10, 11 y 12)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ La mezcla ponderada por implicación **no se reescribe**: es la de la F15.
   Lo único que cambia es de dónde sale el rango de cada ejercicio. */

/** Todos los ejercicios con rango efectivo, listos para agregar por músculo. */
export function rangosEfectivos(fitness, { propios = [], perfil = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const conSesiones = [...indiceDeProgresion(f, lista(propios)).keys()];
  const clasificados = lista(f.clasificaciones).map((c) => texto(c && c.exerciseId)).filter(Boolean);
  /* Un ejercicio entrenado Y estimado cuenta UNA vez, con su rango efectivo. */
  const ids = [...new Set([...conSesiones, ...clasificados])];
  return ids
    .map((id) => ({ r: rangoEfectivoDeEjercicio(f, id, { propios, perfil }), ej: ejercicioPorId(id, lista(propios)) }))
    .filter((x) => !x.r.sinRango && x.ej)
    .map((x) => ({ ...x.r, reparto: repartoMuscular(x.ej) }));
}

export function rangoEfectivoDeGrupo(fitness, grupoId, { propios = [], perfil = null, efectivos = null } = {}) {
  return rangoDeGrupo(efectivos || rangosEfectivos(fitness, { propios, perfil }), texto(grupoId));
}

export function rangoEfectivoDeSubgrupo(fitness, subgrupoId, { propios = [], perfil = null, efectivos = null } = {}) {
  return rangoDeSubgrupo(efectivos || rangosEfectivos(fitness, { propios, perfil }), texto(subgrupoId));
}

/**
 * De dónde sale el rango de un CONJUNTO de ejercicios: si alguno todavía se
 * apoya en la estimación, el conjunto no es solo entrenamiento (apartado 6).
 *
 * ⚠️ **Estaba escrita dentro de `rangoGlobalEfectivo` y la sacó la F22.** El
 * rango de un grupo muscular sale de `rangoDeGrupo`, que **no devuelve
 * `fuente`** —agrega scores, no procedencias—, así que el historial de Espalda
 * no podía decir si un cambio venía de entrenamientos o de una clasificación,
 * que es justo lo que piden los apartados 11 y 14 de esa fase. La regla es la
 * misma que ya usaba el global: se escribe **una vez** y la llaman los dos.
 */
export function fuenteCombinada(fuentes) {
  const s = new Set(lista(fuentes).filter(Boolean));
  if (!s.size) return null;
  if (s.has('cuestionario') || s.has('combinado')) return s.has('entrenamiento') ? 'combinado' : 'cuestionario';
  return 'entrenamiento';
}

/**
 * El rango global con las fuentes ya resueltas (apartado 12).
 *
 * 🚨 *"Pecho mejora no significa automáticamente rango global +1"*: se recalcula
 * con la fórmula de la F15 —media de los grupos CON datos— y sigue haciendo
 * falta cobertura suficiente.
 */
export function rangoGlobalEfectivo(fitness, { propios = [], perfil = null } = {}) {
  const ejercicios = rangosEfectivos(fitness, { propios, perfil });
  const grupos = GRUPOS_MUSCULARES.map((g) => rangoDeGrupo(ejercicios, g.id));
  const conDatos = grupos.filter((g) => !g.sinRango);
  const cobertura = { grupos: conDatos.length, total: grupos.length, texto: `${conDatos.length}/${grupos.length}`, ejercicios: ejercicios.length };
  if (conDatos.length < COBERTURA_MINIMA_GLOBAL || ejercicios.length < EJERCICIOS_MINIMOS_GLOBAL) {
    return {
      sinRango: true,
      rango: null,
      nombre: SIN_RANGO.nombre,
      score: null,
      cobertura,
      grupos,
      ejercicios,
      provisional: false,
      motivo: ejercicios.length === 0 ? 'sin_datos' : 'poca_cobertura',
      fuente: null,
    };
  }
  const score = Math.round(conDatos.reduce((n, g) => n + g.score, 0) / conDatos.length);
  const orden = rangoDePuntuacion(score);
  const fuente = fuenteCombinada(ejercicios.map((e) => e.fuente));
  return {
    sinRango: false,
    rango: orden,
    nombre: nivelRango(orden).nombre,
    score,
    cobertura,
    grupos,
    ejercicios,
    fuente,
    fuenteNombre: fuenteRango(fuente).nombre,
    provisional: conDatos.some((g) => g.provisional) || conDatos.length < GRUPOS_MUSCULARES.length / 2 || fuente !== 'entrenamiento',
    motivo: null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CÓMO HA EVOLUCIONADO (apartados 13 a 18)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * El rango que habría dado el sistema **después de cada sesión**, en orden.
 *
 * ⚠️ No se guarda ni se enseña todavía: existe para poder **demostrar** la
 * estabilidad —que una mala sesión no baja el rango y que un bajón sostenido
 * sí— y para que la fase que dibuje la evolución no tenga que inventarla.
 */
export function evolucionDeRango(fitness, exerciseId, { propios = [], perfil = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const sesiones = lista(f.sesiones)
    .filter((s) => s && s.estado === 'completada')
    .slice()
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  const salida = [];
  for (let i = 0; i < sesiones.length; i += 1) {
    const hasta = { ...f, sesiones: sesiones.slice(0, i + 1) };
    const r = rangoEfectivoDeEjercicio(hasta, exerciseId, { propios, perfil });
    salida.push({
      fecha: sesiones[i].fecha,
      rango: r.rango,
      score: r.score,
      fuente: r.fuente,
      dataPoints: r.dataPoints,
    });
  }
  return salida;
}

/**
 * Lo que hace falta para subir o bajar desde donde está, **explicado**
 * (apartado 13: *"la solución debe ser sencilla y explicable"*).
 */
export function politicaDeEstabilidad(resultado) {
  if (!resultado || resultado.sinRango) return null;
  return {
    ventana: VENTANA_ESTABILIDAD,
    subir: `Basta una sesión mejor dentro de las últimas ${VENTANA_ESTABILIDAD}.`,
    bajar: `Hacen falta ${VENTANA_ESTABILIDAD} sesiones seguidas peores: un mal día no baja el rango.`,
  };
}

export const NO_EN_FIT19 = [
  { que: 'Avisos, confeti, sonidos, vibración y animaciones de subida de rango', porque: 'Apartado 34, literal.' },
  { que: 'XP, logros, leaderboard, comparación y predicción', porque: 'Apartado 34.' },
  { que: 'Una pantalla nueva', porque: 'Apartado 0: *"esta fase NO añade una nueva pantalla grande"*. Lo que cambia es de dónde salen los números que Rangos ya enseñaba.' },
  { que: 'Una caché de rangos con invalidación por eventos', porque: 'Apartados 29 y 30: nada se guarda, así que no hay nada que invalidar. Guardar una sesión crea una lista nueva y la siguiente lectura recalcula: la corrección sale de la forma de los datos, no de un sistema de eventos.' },
];

export const DECISIONES_FIT19 = [
  { que: 'Con una o dos sesiones, el rango es una MEZCLA de la estimación y lo real', porque: 'Apartado 4: *"no debe producir un salto absurdo simplemente porque exista una sola sesión"*. Lo real pesa `sesiones / 3`, así que la estimación se va apagando sola. ⚠️ Corrige lo que hacía la F17, donde una sola sesión sustituía la estimación de golpe.' },
  { que: 'La estabilidad es la ventana de la F15, y es asimétrica a propósito', porque: 'La puntuación es la MEJOR de las últimas cinco sesiones: subir necesita una sesión buena, bajar necesita cinco peores seguidas. Es una regla que se explica en una frase y ya estaba escrita; añadir un segundo mecanismo de histéresis habría dado dos reglas que se contradicen.' },
  { que: 'Un dato atípico no se borra ni se ignora: se diluye', porque: 'Apartado 16. Cien dominadas entran en la ventana como cualquier otra sesión y pueden subir el rango, pero en cuanto salen de las últimas cinco dejan de sostenerlo. No se juzga al usuario ni se tocan sus datos.' },
  { que: 'No hace falta invalidar nada al guardar, borrar o editar una sesión', porque: 'Apartados 8, 22, 23, 24 y 30: el rango se calcula al leerlo. La única caché del proyecto (el índice de la F11) va colgada de la lista de sesiones, y guardar crea una lista nueva.' },
];
