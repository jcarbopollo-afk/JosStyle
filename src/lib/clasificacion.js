/* ===========================================================================
   ENTREGA 4 · FASE 17/45 — CLASIFICAR EJERCICIOS (el cuestionario)

   *"Permitir que el usuario proporcione una estimación inicial de su nivel en
   ejercicios que todavía no tienen suficientes datos reales."*

   🚨 **UNA ESTIMACIÓN NO ES UN DATO.** Es lo que gobierna todo este archivo y
   lo que dicen los apartados 4, 7, 27 y 28: el cuestionario es un **punto de
   partida** que los entrenamientos reales sustituyen en cuanto existen; no
   toca `sesiones` jamás; no se enseña como una puntuación exacta; y su
   confianza nunca es alta por contestar una pregunta.

   ⚠️ **Y no inventa escalas.** La respuesta se convierte en una **marca**
   —repeticiones, segundos o kilos— y la puntúa `src/lib/rangos.js` (F15) con
   las mismas referencias que una sesión de verdad. Si mañana cambia la escala,
   cambia en un sitio y estas estimaciones se mueven con ella (apartado 6:
   *"no poner los scores directamente dentro de los componentes"*).

   Lo que decide este archivo, y no la pantalla (apartado 30): qué ejercicios
   se preguntan, qué pregunta le toca a cada uno, cuánto puntúa cada respuesta,
   cómo se guarda y en qué estado está cada ejercicio.
   =========================================================================== */

import { crearClasificacion, GRUPOS_MUSCULARES, subgrupoMuscular } from './fitness.js';
import { todosLosEjercicios, ejercicioPorId } from './ejercicios.js';
import { aparicionesDeEjercicio } from './progresion.js';
import { metricasDeEjercicio } from './objetivosProgreso.js';
import { repartoMuscular } from './progresoMuscular.js';
import {
  PUNTUACION_MAXIMA, REFERENCIAS, puntuacionDeMarca, rangoDePuntuacion, PESO_CORPORAL_VALIDO,
} from './rangos.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · QUÉ SE PUEDE PREGUNTAR (apartados 2, 12, 13, 14 y 31)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cuántos se ofrecen de una tacada. *"No intentar clasificar 100 ejercicios"*
 *  (apartado 18): con el catálogo real —cien y pico— salen catorce, suficientes
 *  para cubrir los siete grupos y no una tarde de formulario. */
export const LIMITE_CUESTIONARIO = 14;

/**
 * La clase de pregunta que admite un ejercicio, o `null` si **no se le puede
 * preguntar nada fiable** (apartado 31: *"si un ejercicio no tiene información
 * suficiente para crear una pregunta fiable, no incluirlo"*).
 */
export function claseDePregunta(ejercicio) {
  const ej = ejercicio;
  if (!ej) return null;
  const tipos = lista(ej.tipos);
  const medidas = lista(ej.medidas);
  /* Apartado 2 — la movilidad fuera: «cuánta movilidad tienes» no tiene
     referencia razonable, y puntuarla sería inventarse una. */
  if (tipos.includes('movilidad')) return null;
  /* Apartado 12 — una habilidad NO se mide en repeticiones: se pregunta por la
     progresión. Un front lever no es «cuántos haces». */
  if (tipos.includes('habilidad')) return 'progresion';
  /* 🐛 **Qué se le pregunta lo decide el MATERIAL, no que admita peso.** Unas
     dominadas admiten lastre, así que por «tiene medida de peso» acababan
     preguntando kilos — y el apartado 5 pone justo las dominadas como ejemplo de
     pregunta por repeticiones. Se reutiliza la decisión que ya tomó la F14
     (`metricasDeEjercicio`) en vez de escribir otra que diría cosas distintas. */
  const metricas = metricasDeEjercicio(ej);
  if (!metricas.length) return null;
  if (metricas[0] === 'peso') return 'carga';       // apartado 14
  if (metricas[0] === 'duracion') return 'tiempo';  // apartado 13
  if (metricas[0] === 'reps') return 'repeticiones';
  if (medidas.includes('tiempo')) return 'tiempo';
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LAS PREGUNTAS (apartados 5, 12, 13 y 14)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Las opciones **no llevan puntuación escrita**: llevan la marca que
   representan —14 repeticiones, 20 segundos, 60 kilos— y la puntúa la F15 con
   la referencia de la dificultad del ejercicio. Así, 10 muscle-ups y 10
   dominadas no valen lo mismo, que es el apartado 9 de la F15. */

/** Las repeticiones que representa cada opción. La última es abierta («15+»),
 *  y se cuenta por su borde: prometer más sería regalar puntuación. */
export const OPCIONES_REPETICIONES = [
  { id: 'reps-0', texto: 'Ninguna todavía', marca: 0 },
  { id: 'reps-2', texto: '1 – 2', marca: 2 },
  { id: 'reps-5', texto: '3 – 5', marca: 5 },
  { id: 'reps-9', texto: '6 – 9', marca: 9 },
  { id: 'reps-14', texto: '10 – 14', marca: 14 },
  { id: 'reps-15', texto: '15 o más', marca: 16 },
];

export const OPCIONES_TIEMPO = [
  { id: 'tiempo-0', texto: 'No puedo mantenerlo', marca: 0 },
  { id: 'tiempo-10', texto: 'Menos de 10 s', marca: 8 },
  { id: 'tiempo-20', texto: '10 – 20 s', marca: 20 },
  { id: 'tiempo-30', texto: '20 – 30 s', marca: 30 },
  { id: 'tiempo-45', texto: '30 s o más', marca: 40 },
];

/* Apartado 12 — la progresión de una habilidad. 🚨 Aquí **sí** hay una tabla de
   puntuación, y es la excepción explicada: una progresión no tiene marca que
   medir —no son segundos ni repeticiones—, así que se sitúa directamente en la
   escala de la F15. Va aquí, en un solo sitio, no repartida por la pantalla. */
export const OPCIONES_PROGRESION = [
  { id: 'prog-0', texto: 'No puedo realizarlo', puntuacion: 0 },
  { id: 'prog-1', texto: 'Progresión inicial', puntuacion: 170 },
  { id: 'prog-2', texto: 'Progresión intermedia', puntuacion: 380 },
  { id: 'prog-3', texto: 'Progresión avanzada', puntuacion: 620 },
  { id: 'prog-4', texto: 'Ejecución completa', puntuacion: 860 },
];

/* La opción del apartado 14 para quien no recuerda su peso: **no clasifica**.
   Adivinarle un peso sería exactamente el dato falso que prohíbe el 31. */
export const OPCION_NO_LO_SE = { id: 'no-lo-se', texto: 'No lo sé', omite: true };

/* Las repeticiones que se suponen al preguntar por carga. Se dice en la
   pregunta —*"con unas 5 repeticiones"*— en vez de callarlo: la F15 necesita
   peso Y repeticiones para poner 80×5 y 70×8 en la misma escala, y preguntar
   las dos cosas sería el formulario largo que prohíbe el apartado 19. */
export const REPS_DE_REFERENCIA_CARGA = 5;

const pesoCorporalDe = (perfil) => {
  const p = Number(perfil?.peso);
  return Number.isFinite(p) && p >= PESO_CORPORAL_VALIDO.min && p <= PESO_CORPORAL_VALIDO.max ? p : null;
};

const redondear5 = (kg) => Math.max(5, Math.round(kg / 5) * 5);

/** Las opciones de carga, repartidas alrededor de la referencia de SU
 *  dificultad: para un principiante no salen los mismos kilos que para un
 *  experto. ⚠️ Con peso corporal la referencia es relativa, así que se
 *  convierte a kilos con el suyo (apartado 15: se usa el perfil si existe, sin
 *  obligarle a escribirlo). */
export function opcionesDeCarga(ejercicio, perfil = null) {
  const dificultad = texto(ejercicio?.dificultad) || 'principiante';
  const lastre = lista(ejercicio?.equipamiento).includes('lastre');
  const tabla = REFERENCIAS[lastre ? 'lastre' : 'carga'];
  const peso = pesoCorporalDe(perfil);
  const tope = peso
    ? (tabla.relativa[dificultad] || tabla.relativa.principiante) * peso
    : (tabla.absoluta[dificultad] || tabla.absoluta.principiante);
  /* El tope de la tabla es la puntuación máxima; las opciones reparten por
     debajo. La primera es «poco peso», no «cero». */
  return [0.15, 0.3, 0.5, 0.7, 0.95].map((f) => {
    const kg = redondear5(tope * f);
    return { id: `carga-${Math.round(f * 100)}`, texto: `${kg} kg`, marca: kg };
  });
}

/**
 * La pregunta de un ejercicio (`getClassificationQuestion` del apartado 30), o
 * `null` si no se le puede preguntar. ⚠️ El texto **nombra el ejercicio**: una
 * pregunta genérica para todos es lo que el apartado 5 llama absurda.
 */
export function preguntaDeEjercicio(ejercicio, { perfil = null } = {}) {
  const clase = claseDePregunta(ejercicio);
  if (!clase) return null;
  const nombre = texto(ejercicio.nombre) || texto(ejercicio.id);
  const enMinuscula = nombre.charAt(0).toLowerCase() + nombre.slice(1);
  if (clase === 'progresion') {
    return {
      clase,
      exerciseId: ejercicio.id,
      texto: `¿Cuál es tu progresión actual en ${enMinuscula}?`,
      ayuda: 'Una habilidad no se mide en repeticiones: cuenta hasta dónde llegas.',
      opciones: OPCIONES_PROGRESION,
    };
  }
  if (clase === 'tiempo') {
    return {
      clase,
      exerciseId: ejercicio.id,
      texto: `¿Cuánto tiempo aguantas ${enMinuscula} con buena técnica?`,
      ayuda: null,
      opciones: OPCIONES_TIEMPO,
    };
  }
  if (clase === 'carga') {
    return {
      clase,
      exerciseId: ejercicio.id,
      texto: `¿Cuál es la mayor carga que mueves en ${enMinuscula} con técnica controlada?`,
      ayuda: `Cuenta la de unas ${REPS_DE_REFERENCIA_CARGA} repeticiones. Un número aproximado vale.`,
      opciones: [...opcionesDeCarga(ejercicio, perfil), OPCION_NO_LO_SE],
    };
  }
  return {
    clase,
    exerciseId: ejercicio.id,
    texto: `¿Cuántas repeticiones seguidas puedes hacer de ${enMinuscula}?`,
    ayuda: 'Seguidas y con buena técnica, sin parar a descansar.',
    opciones: OPCIONES_REPETICIONES,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · DE RESPUESTA A PUNTUACIÓN (apartado 6)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `mapClassificationAnswerToScore`: la respuesta se vuelve marca y la puntúa la
 * F15. Devuelve `null` si la opción no existe o si es «No lo sé».
 */
export function puntuacionDeRespuesta(ejercicio, opcionId, { perfil = null } = {}) {
  const pregunta = preguntaDeEjercicio(ejercicio, { perfil });
  if (!pregunta) return null;
  const opcion = pregunta.opciones.find((o) => o.id === texto(opcionId));
  if (!opcion || opcion.omite) return null;
  const dificultad = texto(ejercicio.dificultad) || 'principiante';

  if (pregunta.clase === 'progresion') {
    /* Ya viene situada en la escala; se recorta por si alguien toca la tabla. */
    const p = Math.max(0, Math.min(PUNTUACION_MAXIMA, Math.round(opcion.puntuacion)));
    return { puntuacion: p, clase: 'progresion', marca: opcion.texto, confianza: opcion.puntuacion >= 620 ? 'media' : 'baja' };
  }

  if (pregunta.clase === 'repeticiones' || pregunta.clase === 'tiempo') {
    const clase = pregunta.clase === 'tiempo' ? 'tiempo' : 'repeticiones';
    /* 🚨 «Ninguna todavía» es una respuesta válida y puntúa 0 —el rango 1 es
       «empezando con el movimiento»—, no un hueco sin clasificar. */
    if (opcion.marca === 0) {
      return { puntuacion: 0, clase, marca: opcion.texto, confianza: 'baja' };
    }
    const p = puntuacionDeMarca(clase, { valor: opcion.marca, escala: clase === 'tiempo' ? 's' : 'reps' }, dificultad);
    return p === null ? null : { puntuacion: p, clase, marca: `${opcion.marca} ${clase === 'tiempo' ? 's' : 'reps'}`, confianza: 'baja' };
  }

  /* Carga: la misma cuenta que una serie real (Epley con las repeticiones de
     referencia), y relativa al peso corporal cuando se sabe. */
  const pesoCorporal = pesoCorporalDe(perfil);
  const lastre = lista(ejercicio.equipamiento).includes('lastre');
  const clase = lastre ? 'lastre' : 'carga';
  const epley = opcion.marca * (1 + REPS_DE_REFERENCIA_CARGA / 30);
  const marca = pesoCorporal
    ? { valor: (lastre ? epley + pesoCorporal * (1 + REPS_DE_REFERENCIA_CARGA / 30) : epley) / pesoCorporal, escala: 'relativa' }
    : { valor: epley, escala: 'absoluta' };
  const p = puntuacionDeMarca(clase, marca, dificultad);
  return p === null ? null : { puntuacion: p, clase, marca: `${opcion.marca} kg`, confianza: 'baja' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · QUÉ SE PREGUNTA, Y EN QUÉ ESTADO ESTÁ (apartados 2, 10 y 18)
   ═══════════════════════════════════════════════════════════════════════════ */

export const clasificacionDe = (fitness, exerciseId) =>
  lista(fitness?.clasificaciones).find((c) => c && c.exerciseId === texto(exerciseId)) || null;

const tieneDatosReales = (fitness, exerciseId, propios) =>
  aparicionesDeEjercicio(fitness || {}, exerciseId, propios).length > 0;

/**
 * `getClassificationStatus` (apartado 30). Tres estados, y el orden importa:
 * 🚨 **los datos reales mandan** (apartados 4 y 27). Si ha entrenado el
 * ejercicio, el estado es `entrenamiento` aunque tenga una estimación guardada:
 * la estimación sigue ahí, pero ya no es lo que se usa.
 */
export function estadoDeClasificacion(fitness, exerciseId, { propios = [] } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), lista(propios));
  const guardada = clasificacionDe(fitness, exerciseId);
  const reales = tieneDatosReales(fitness, exerciseId, lista(propios));
  return {
    exerciseId: texto(exerciseId),
    existe: !!ej,
    clasificable: !!claseDePregunta(ej),
    estimacion: guardada,
    tieneDatosReales: reales,
    /* Lo que MANDA ahora mismo. */
    fuente: reales ? 'entrenamiento' : (guardada ? 'cuestionario' : null),
    estado: reales ? 'entrenamiento' : (guardada ? 'clasificado' : 'sin_clasificar'),
  };
}

/* Cuánto aporta un ejercicio a la información muscular: la suma de lo que
   implica del catálogo, con más peso si es compuesto (apartado 18: *"priorizar
   ejercicios que aporten mucha información muscular"*). */
function relevancia(ej) {
  const reparto = repartoMuscular(ej);
  const suma = reparto.reduce((n, x) => n + x.peso, 0);
  const compuesto = lista(ej.tipos).includes('compuesto') ? 1.5 : 1;
  /* Los muy difíciles bajan: preguntarle por una human flag antes que por unas
     flexiones no ayuda a cubrir nada. */
  const porDificultad = { principiante: 1.2, intermedio: 1.1, avanzado: 0.9, experto: 0.7 };
  return suma * compuesto * (porDificultad[ej.dificultad] || 1);
}

/**
 * `getExercisesToClassify` (apartado 30): los que se le ofrecen, en orden.
 *
 * 🚨 Fuera los que ya tienen datos reales (no hay nada que estimar) y fuera los
 * que no admiten pregunta fiable. Y **primero uno de cada grupo muscular**: con
 * ordenar solo por relevancia salían seis de empuje seguidos y el cuello sin
 * cubrir, que es justo la información que falta.
 */
export function ejerciciosParaClasificar(fitness, { propios = [], limite = LIMITE_CUESTIONARIO } = {}) {
  const candidatos = todosLosEjercicios(lista(propios))
    .filter((ej) => claseDePregunta(ej))
    .filter((ej) => !tieneDatosReales(fitness, ej.id, lista(propios)))
    .filter((ej) => !clasificacionDe(fitness, ej.id))
    .map((ej) => ({ ej, r: relevancia(ej) }))
    /* Orden estable: por relevancia y, a igualdad, por id. Sin el desempate, dos
       ejecuciones podían ofrecer listas distintas. */
    .sort((a, b) => (b.r - a.r) || a.ej.id.localeCompare(b.ej.id));

  const elegidos = [];
  const cubiertos = new Set();
  const grupoPrincipal = (ej) => {
    const reparto = repartoMuscular(ej);
    const mejor = reparto.reduce((x, y) => (!x || y.peso > x.peso ? y : x), null);
    return mejor ? mejor.grupoId : null;
  };
  /* Primera pasada: el mejor de cada grupo. */
  for (const { ej } of candidatos) {
    const g = grupoPrincipal(ej);
    if (!g || cubiertos.has(g)) continue;
    cubiertos.add(g);
    elegidos.push(ej);
    if (elegidos.length >= limite) return elegidos;
  }
  /* Segunda: se completa por relevancia. */
  for (const { ej } of candidatos) {
    if (elegidos.includes(ej)) continue;
    elegidos.push(ej);
    if (elegidos.length >= limite) break;
  }
  return elegidos;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · GUARDAR (apartados 3, 11, 24 y 25)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `saveExerciseClassification`. Devuelve `{ ok, fitness, clasificacion, error }`
 * y **nunca toca `sesiones`** (apartado 11: *"nunca modificar WorkoutSession"*).
 * Reclasificar sustituye la anterior conservando su `id` y su `creadoEn`: es la
 * misma estimación corregida, no una segunda.
 */
export function clasificarEjercicio(fitness, exerciseId, opcionId, { propios = [], perfil = null, ahora = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const ej = ejercicioPorId(texto(exerciseId), lista(propios));
  if (!ej) return { ok: false, fitness: f, clasificacion: null, error: 'Ese ejercicio no está en el catálogo.' };
  const resultado = puntuacionDeRespuesta(ej, opcionId, { perfil });
  if (!resultado) {
    return { ok: false, fitness: f, clasificacion: null, error: 'Esa respuesta no permite estimar un nivel.' };
  }
  const previa = clasificacionDe(f, ej.id);
  const momento = Number.isFinite(ahora) ? ahora : Date.now();
  const clasificacion = crearClasificacion({
    id: previa ? previa.id : null,
    exerciseId: ej.id,
    respuesta: texto(opcionId),
    puntuacion: resultado.puntuacion,
    rango: rangoDePuntuacion(resultado.puntuacion),
    fuente: 'cuestionario',
    confianza: resultado.confianza,
    creadoEn: previa ? previa.creadoEn : momento,
    actualizadoEn: previa ? momento : null,
  });
  return {
    ok: true,
    clasificacion,
    error: null,
    fitness: {
      ...f,
      clasificaciones: [...lista(f.clasificaciones).filter((c) => c && c.exerciseId !== ej.id), clasificacion],
    },
  };
}

/** Borrar una estimación (la necesita «reclasificar» si algún día se quiere
 *  quitar, y la papelera de la F1 no se usa para esto: no es un dato suyo, es
 *  una estimación que se rehace contestando otra vez). */
export function olvidarClasificacion(fitness, exerciseId) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  return { ...f, clasificaciones: lista(f.clasificaciones).filter((c) => c && c.exerciseId !== texto(exerciseId)) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL CUESTIONARIO ENTERO (apartados 1, 17, 22 y 25)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lo que necesita la pantalla: la cola de pendientes, cuántos lleva y qué
 * grupos musculares tocan los que ya ha estimado.
 *
 * ⚠️ El progreso **no se guarda aparte** (apartado 24: *"no crear
 * almacenamiento paralelo"*). Cada respuesta se guarda en cuanto se contesta,
 * así que «lo que lleva» es exactamente «lo que hay guardado»: salir a mitad,
 * recargar o cerrar la aplicación no pierde nada y no hay dos verdades que
 * puedan desincronizarse.
 */
export function cuestionario(fitness, { propios = [], limite = LIMITE_CUESTIONARIO } = {}) {
  const hechas = lista(fitness?.clasificaciones).filter(Boolean);
  /* 🐛 **La tanda tiene tamaño fijo.** Pidiendo `limite` pendientes cada vez, al
     contestar una entraba otra por detrás: «2 de 15», «3 de 16»… y la barra no
     llegaba nunca al final. Lo que queda es el límite MENOS lo contestado. */
  const pendientes = ejerciciosParaClasificar(fitness, { propios, limite: Math.max(0, limite - hechas.length) });
  const gruposTocados = new Set();
  for (const c of hechas) {
    const ej = ejercicioPorId(texto(c && c.exerciseId), lista(propios));
    for (const x of repartoMuscular(ej)) gruposTocados.add(x.grupoId);
  }
  const hechos = hechas.length;
  const total = Math.max(hechos + pendientes.length, 1);
  return {
    pendientes,
    restantes: pendientes.length,
    hechos,
    total,
    /* El «3 de 12» del apartado 22. ⚠️ Es progreso del CUESTIONARIO, no físico:
       la pantalla lo dice al lado de la barra. */
    posicion: Math.min(hechos + 1, total),
    fraccion: total > 0 ? hechos / total : 0,
    grupos: [...gruposTocados],
    gruposNombre: GRUPOS_MUSCULARES.filter((g) => gruposTocados.has(g.id)).map((g) => g.nombre),
    completado: pendientes.length === 0,
  };
}

/** El resumen del final (apartado 25). Sin nada contestado no miente con un
 *  «0 ejercicios clasificados» triunfal: dice que no hay nada. */
export function resumenFinal(fitness, { propios = [] } = {}) {
  const c = cuestionario(fitness, { propios });
  return {
    ejercicios: c.hechos,
    grupos: c.grupos.length,
    gruposNombre: c.gruposNombre,
    texto: c.hechos === 0
      ? 'Todavía no has estimado ningún ejercicio.'
      : `${c.hechos} ${c.hechos === 1 ? 'ejercicio clasificado' : 'ejercicios clasificados'} · ${c.grupos.length} ${c.grupos.length === 1 ? 'grupo muscular' : 'grupos musculares'} con información nueva`,
  };
}

/** Los subgrupos que reciben información al estimar ESTE ejercicio (apartado
 *  16): los del catálogo, con su porcentaje. No se reparte a ojo. */
export function musculosQueRecibe(exerciseId, { propios = [] } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), lista(propios));
  return repartoMuscular(ej).map((x) => ({
    ...x,
    nombre: subgrupoMuscular(x.subgrupoId)?.nombre || x.subgrupoId,
  }));
}

export const AVISO_RECLASIFICAR = 'Esta clasificación sustituirá tu estimación anterior, pero no modificará tus entrenamientos.';
export const AVISO_ESTIMACION = 'Esta clasificación se actualizará con tus entrenamientos.';

export const NO_EN_FIT17 = [
  { que: 'IA, predicción automática, leaderboard, XP y logros', porque: 'Apartado 35.' },
  { que: 'Enseñar la puntuación estimada', porque: 'Apartado 7: *"no fingir precisión"*. Se enseña el nivel estimado, nunca «tu score es 638».' },
  { que: 'Una pantalla de celebración al terminar cada ejercicio', porque: 'Apartado 8: *"no crear todavía una pantalla de celebración"*.' },
  { que: 'Adivinar el peso de quien contesta «No lo sé»', porque: 'Apartado 31: sin dato no hay clasificación; ese ejercicio se salta y sigue pendiente.' },
  { que: 'Entrada a «Reclasificar» desde la ficha de cada ejercicio', porque: 'Apartado 26: la arquitectura está (`clasificarEjercicio` sustituye conservando el id), la entrada visual completa es de una fase posterior. Desde el cuestionario sí se reclasifica.' },
];

export const DECISIONES_FIT17 = [
  { que: 'La respuesta se convierte en marca y la puntúa la F15', porque: 'Apartado 6: una tabla de puntuaciones propia acabaría diciendo otra cosa que las sesiones reales. Solo la progresión de una habilidad se sitúa directamente en la escala, porque no tiene marca que medir.' },
  { que: 'El progreso del cuestionario no se guarda aparte', porque: 'Apartado 24: cada respuesta se guarda al contestarla, así que lo guardado ES el progreso. Un puntero aparte se desincroniza en cuanto se borra una clasificación.' },
  { que: 'Al preguntar por carga se suponen 5 repeticiones, y se dice', porque: 'La F15 necesita peso y repeticiones para comparar; preguntar las dos cosas sería el formulario largo que prohíbe el apartado 19.' },
];
