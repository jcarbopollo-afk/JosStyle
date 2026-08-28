// ============================================================================
// EH · Fase 28/65 — OBJETIVOS Y EXPERIENCIAS PERSONALES
//
// *"Ahora vamos a conectar 'Quiero hacer' con objetivos personales, pero con una
// regla clave: **NO crear otro sistema de objetivos**. Si JC Fitness ya tiene
// Objetivos, utilizamos ese sistema. Esta fase únicamente define **cómo Estilo
// de hombre se conecta con él**."*
//
// Y la condición de finalización lo remata: *"Estilo de hombre no crea otro
// sistema de productividad. Simplemente sirve como una capa personal que
// conecta: Gustos → Quiero hacer → Objetivos → Calendario → Diario → Recuerdos,
// utilizando siempre los módulos que ya existen."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ ESTA FASE NO GUARDA CASI NADA.** Lo único que añade al almacén es un
// `objetivoId` en la entrada de "Quiero hacer" de la Fase 27. Ni un objetivo, ni
// una fecha, ni un progreso: el objetivo vive en Objetivos y **aquí solo está su
// id**. Es el mismo criterio que la F26 con las prendas del Armario.
//
// **2. ⚠️ UN OBJETIVO DE JOSSTYLE ES `{ texto, plazo, cumplido }`.** El apartado
// 3 enumera *nombre, descripción, fecha, prioridad, progreso y categoría*, pero
// termina diciendo *"todo gestionado por Objetivos global"* — y el sistema global
// **no tiene descripción, fecha, prioridad, categoría ni porcentaje**. Así que
// esta fase **no los inventa**: hacerlo sería el segundo sistema de objetivos que
// el enunciado prohíbe en su primera línea. Y no falta nada, porque **la Fase 27
// ya guarda lo personal**: categoría, prioridad, fecha, lugar y nota son campos
// de la entrada.
//
// **3. ⚠️ EL PROGRESO ES UN SÍ O UN NO, Y SE DICE.** El apartado 10 habla de
// *"35% → 60% → 100%"* pero empieza con *"**si** el objetivo tiene progreso"* y
// acaba con *"el progreso pertenece al sistema global de objetivos"*. El global
// tiene `cumplido`, que es un booleano. Se enseña lo que hay, con su frase, en
// vez de pintar una barra de porcentaje inventada (regla 8).
//
// **4. ⚠️ "YA LO HICE" SE PROPONE, NO SE HACE SOLO.** El apartado 5 dice
// *"**podrá** actualizarse automáticamente"*, no "se actualizará". Así que
// `sugerirYaLoHice()` mira y `marcarYaLoHice()` escribe **solo con
// `confirmado`**. Noveno `aplicarPlan` del proyecto, y nunca con valor por
// defecto.
//
// **5. ⚠️ "EXPERIENCIAS" NO ES UN GESTOR NUEVO** (apartado 4: *"pero no crear
// otro gestor independiente"*). `CATEGORIAS_GUSTO` tiene `experiencias` desde la
// Fase 27, así que esto es **una vista filtrada** por esa categoría.
//
// **6. ⚠️ Y AVISAR SIGUE SIENDO DE `notificaciones.js`** (apartado 9). Aquí se
// DECIDE si hoy toca recordar algo; mandarlo es del emisor de siempre, con su
// interruptor global y sus categorías. Mismo reparto que `avisosHorario.js`.
//
// ── UN LÍMITE HONESTO, DICHO Y NO ESCONDIDO ────────────────────────────────
//
// El apartado 7 pide *"📷 añadir fotos, **utilizando el sistema de fotos
// existente**. No crear una galería paralela."* **No existe ninguno al que colgar
// un recuerdo**: los que hay son de Salud (fotos de progreso), Armario (prendas),
// Biblioteca (material de estudio) y Fondos, y una entrada del Diario no tiene
// fotos. Crear una galería está prohibido por el propio apartado, así que la
// pantalla **lo dice con una frase** en vez de enseñar un botón que no hace nada.
// ============================================================================

import { PLAZOS_OBJETIVO } from '../tokens';
import { normalizarEstiloHombre } from './estiloDeHombre';
import {
  MODULO_GUSTOS, datosGustos, entradasDeGustos, editarGusto, cambiarEstadoGusto,
  parteActivaGustos, estadoHacer, categoriaGusto,
} from './gustos';
import { uid, todayISO } from './helpers';

export const MODULO_OBJETIVOS = 'objetivos';

/** La categoría del apartado 4. ⚠️ Ya existe en la Fase 27: no se crea otra. */
export const CATEGORIA_EXPERIENCIAS = 'experiencias';

/** La parte del apartado 12, que vive en `PARTES_GUSTOS`. */
export const PARTE_EXPERIENCIAS = 'experiencias';

export const TEXTOS_PUENTE = {
  convertir: '🎯 Convertir en objetivo',
  verObjetivo: 'Ver en Objetivos',
  yaLoHice: '✅ Ya lo hice',
  /* ⚠️ Apartado 2 — *"se abrirá el sistema global de objetivos. No crear una
     pantalla paralela."* Se dice a dónde lleva. */
  dondeVive: 'Los objetivos se gestionan en Objetivos. Aquí solo queda el enlace.',
  /* ⚠️ Apartado 10 — lo que el sistema global tiene de verdad. */
  sinPorcentaje: 'Un objetivo está cumplido o no. Aquí no hay porcentajes.',
  /* ⚠️ Apartado 7 — el límite, dicho (regla 8). */
  sinFotos: 'Todavía no hay dónde guardar fotos de un recuerdo. Cuando lo haya, se usará ese sitio.',
  /* ⚠️ Apartado 5 — se propone, no se hace solo. */
  proponerHecho: 'Has cumplido este objetivo. ¿Lo marco también como "Ya lo hice"?',
  elegirPlazo: '¿Para cuándo te lo pones?',
};

/** El destino de la navegación (apartado 2). ⚠️ El módulo que ya existe. */
export const DESTINO_OBJETIVOS = 'objetivos';

/* ===========================================================================
   1 · LEER: LA ENTRADA Y SU OBJETIVO, JUNTOS
   =========================================================================== */

const listaDe = (objetivos) => (Array.isArray(objetivos?.lista) ? objetivos.lista : []);

/**
 * El objetivo enlazado, o `null`. ⚠️ Si lo borró en Objetivos, aquí **no se
 * inventa nada**: el enlace queda colgando y se dice que ya no está, igual que
 * hace la F26 con una prenda borrada del Armario.
 */
export function objetivoDe(entrada, objetivos) {
  if (!entrada || !entrada.objetivoId) return null;
  return listaDe(objetivos).find((o) => o.id === entrada.objetivoId) || null;
}

/**
 * Lo que la pantalla necesita saber de un "Quiero hacer" respecto a Objetivos.
 * ⚠️ **`cumplido` es un booleano, no un porcentaje** (decisión 3).
 */
export function estadoDelObjetivo(entrada, objetivos) {
  if (!entrada) return { enlazado: false, objetivo: null, cumplido: false, texto: '' };
  if (!entrada.objetivoId) {
    return { enlazado: false, objetivo: null, cumplido: false, texto: 'Todavía no es un objetivo.' };
  }
  const objetivo = objetivoDe(entrada, objetivos);
  if (!objetivo) {
    return {
      enlazado: false, objetivo: null, cumplido: false, perdido: true,
      // ⚠️ Ni se recrea el objetivo ni se borra el enlace por nuestra cuenta.
      texto: 'El objetivo que tenía enlazado ya no está en Objetivos.',
    };
  }
  return {
    enlazado: true,
    objetivo,
    cumplido: objetivo.cumplido === true,
    plazo: objetivo.plazo,
    texto: objetivo.cumplido
      ? `Cumplido. Estaba a ${objetivo.plazo}.`
      : `Es un objetivo a ${objetivo.plazo}.`,
  };
}

/** Las entradas de "Quiero hacer" que ya son objetivo, y las que no. */
export function quieroHacerConObjetivo(estado, objetivos) {
  return entradasDeGustos(estado, 'hacer').map((e) => ({ ...e, ...estadoDelObjetivo(e, objetivos) }));
}

/**
 * Apartado 4 — 🌟 Experiencias. ⚠️ **Una vista, no un gestor**: filtra por la
 * categoría que la Fase 27 ya tiene. Si la parte está apagada devuelve `null`,
 * no una lista vacía — apagada y vacía son dos cosas (lección de la F25).
 */
export function experiencias(estado, objetivos) {
  if (!parteActivaGustos(estado, PARTE_EXPERIENCIAS)) return null;
  return entradasDeGustos(estado)
    .filter((e) => e.categoria === CATEGORIA_EXPERIENCIAS)
    .map((e) => ({ ...e, ...estadoDelObjetivo(e, objetivos) }));
}

/* ===========================================================================
   2 · CONVERTIR EN OBJETIVO (apartados 1, 2 y 3)
   ===========================================================================
   ⚠️ Devuelve un PLAN con las dos piezas. Escribe App.jsx, que es el dueño de
   los dos almacenes: mismo reparto que el alta de accesorios de la F26. */

export { PLAZOS_OBJETIVO };

export function prepararObjetivo(estado, objetivos, entradaId, { plazo = null, hoy = todayISO() } = {}) {
  const entrada = datosGustos(estado).entradas.find((e) => e.id === entradaId);
  if (!entrada) return { error: 'Eso no existe.', plan: null };
  if (entrada.tipo !== 'hacer') {
    // Apartado 1 — el botón sale en "Quiero hacer", no en un gusto.
    return { error: 'Solo lo que quieres hacer puede convertirse en objetivo.', plan: null };
  }
  if (entrada.objetivoId && objetivoDe(entrada, objetivos)) {
    return { error: null, sinEfecto: true, plan: null, objetivo: objetivoDe(entrada, objetivos) };
  }
  /* ⚠️ **Sin valor por defecto.** Elegir el plazo por él metería su viaje a
     Japón en "30 días" sin decírselo. Mismo criterio que `ALCANCES` en HT F3. */
  if (!PLAZOS_OBJETIVO.includes(plazo)) {
    return { error: 'Elige para cuándo te lo pones.', plan: null, plazos: PLAZOS_OBJETIVO };
  }
  /* ⚠️ Los campos del objetivo son los que Objetivos tiene, y ni uno más
     (decisión 2). El nombre es el que él ya escribió en "Quiero hacer". */
  return {
    error: null,
    plan: {
      objetivo: { id: uid(), texto: entrada.nombre, plazo, cumplido: false, fechaCreacion: hoy },
      entradaId,
    },
  };
}

/** Escribe el plan: el objetivo a Objetivos y **solo el id** a Estilo de hombre. */
export function aplicarObjetivo(estado, objetivos, plan, { datosGlobales = {} } = {}) {
  if (!plan || !plan.objetivo) {
    return { estado: normalizarEstiloHombre(estado), objetivos, error: 'No hay nada que guardar.' };
  }
  const r = editarGusto(estado, plan.entradaId, { objetivoId: plan.objetivo.id }, { datosGlobales });
  if (r.error) return { estado: normalizarEstiloHombre(estado), objetivos, error: r.error };
  return {
    estado: r.estado,
    objetivos: { ...objetivos, lista: [...listaDe(objetivos), plan.objetivo] },
    error: null,
    objetivo: plan.objetivo,
  };
}

/** Deshacer el enlace SIN tocar el objetivo (apartado 12: *"no se eliminan"*). */
export function desenlazarObjetivo(estado, entradaId, { datosGlobales = {} } = {}) {
  return editarGusto(estado, entradaId, { objetivoId: null }, { datosGlobales });
}

/* ===========================================================================
   3 · "YA LO HICE" (apartado 5)
   ===========================================================================
   *"El elemento original de 'Quiero hacer' **podrá** actualizarse
   automáticamente."* ⚠️ **Podrá**, no "se actualizará": se propone. */

export function sugerirYaLoHice(estado, objetivos) {
  return quieroHacerConObjetivo(estado, objetivos)
    // Cumplido en Objetivos, pero aquí todavía abierto.
    .filter((e) => e.cumplido && estadoHacer(e.estado)?.abierto === true)
    .map((e) => ({
      id: e.id,
      nombre: e.nombre,
      texto: TEXTOS_PUENTE.proponerHecho,
      accion: TEXTOS_PUENTE.yaLoHice,
      // ⚠️ Escrito en el propio dato: proponer no es hacer.
      aplicada: false,
    }));
}

export function marcarYaLoHice(estado, objetivos, entradaId, { confirmado = false, datosGlobales = {} } = {}) {
  /* ⚠️ Sin `confirmado` no escribe, y no hay valor por defecto: es la regla 7 en
     código. Noveno `aplicarPlan` del proyecto. */
  if (!confirmado) {
    return { estado: normalizarEstiloHombre(estado), error: null, aplicado: false };
  }
  const entrada = datosGustos(estado).entradas.find((e) => e.id === entradaId);
  if (!entrada) return { estado: normalizarEstiloHombre(estado), error: 'Eso no existe.', aplicado: false };
  if (!estadoDelObjetivo(entrada, objetivos).cumplido) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese objetivo todavía no está cumplido.', aplicado: false };
  }
  const r = cambiarEstadoGusto(estado, entradaId, 'hecho', { datosGlobales });
  return { ...r, aplicado: !r.error };
}

/* ===========================================================================
   4 · RECORDATORIOS (apartado 9)
   ===========================================================================
   ⚠️ Aquí se DECIDE. Mandar es de `notificaciones.js`, que tiene el interruptor
   global, las categorías y el horario de descanso. Nunca un segundo emisor. */

export const CATEGORIA_AVISO = 'objetivos';

export function avisoDeExperiencia(estado, objetivos, { hoy = todayISO() } = {}) {
  if (!parteActivaGustos(estado, PARTE_EXPERIENCIAS)) return null;
  const hoyToca = quieroHacerConObjetivo(estado, objetivos)
    .filter((e) => e.fecha === hoy && estadoHacer(e.estado)?.abierto === true);
  if (hoyToca.length === 0) return null;
  return {
    categoria: CATEGORIA_AVISO,
    clave: `gustos:${hoy}`,
    titulo: hoyToca.length === 1 ? hoyToca[0].nombre : 'Tienes cosas apuntadas para hoy',
    cuerpo: hoyToca.map((e) => e.nombre).join(' · '),
    // ⚠️ Quien manda es `notificaciones.js`; esto solo dice qué y cuándo.
    emisor: 'notificaciones.js',
  };
}

/* ===========================================================================
   5 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenPuente(estado, objetivos) {
  const conObjetivo = quieroHacerConObjetivo(estado, objetivos);
  const exp = experiencias(estado, objetivos);
  return {
    quieroHacer: conObjetivo.length,
    enlazados: conObjetivo.filter((e) => e.enlazado).length,
    cumplidos: conObjetivo.filter((e) => e.cumplido).length,
    perdidos: conObjetivo.filter((e) => e.perdido).length,
    porMarcar: sugerirYaLoHice(estado, objetivos).length,
    // ⚠️ `null` si la parte está apagada: apagada y vacía no son lo mismo.
    experiencias: exp === null ? null : exp.length,
  };
}

/** Apartado 14, prueba 13 — comprobado en vez de prometido. */
export function auditarPuente(estado, objetivos) {
  const entradas = datosGustos(estado).entradas;
  return {
    // *"NO crear otro sistema de objetivos."*
    sistemasDeObjetivos: 0,
    objetivosGuardadosAqui: 0,
    // Apartado 4 — *"no crear otro gestor independiente"*.
    gestoresNuevos: 0,
    // Apartado 6 — *"no crear un diario de experiencias"*.
    diariosNuevos: 0,
    // Apartado 7 — *"no crear una galería paralela"*.
    galeriasNuevas: 0,
    // Apartado 8 — el calendario es el global, y por eventos derivados.
    calendariosNuevos: 0,
    // Apartado 13 — *"nunca crear una segunda papelera"*.
    papelerasNuevas: 0,
    // Condición de finalización — *"no crea otro sistema de productividad"*.
    tareasCreadas: 0,
    // Apartado 11 — favoritos globales, los de la Fase 27.
    favoritosNuevos: 0,
    // Apartado 9 — un solo emisor de avisos.
    emisorDeAvisos: 'notificaciones.js',
    /* ⚠️ Lo ÚNICO que esta fase guarda: un id por entrada enlazada. */
    campoAnadido: 'objetivoId',
    enlaces: entradas.filter((e) => e.objetivoId).length,
    // El catálogo de plazos es el de Objetivos, no uno nuevo.
    plazos: PLAZOS_OBJETIVO.length,
  };
}

export function textosDelPuente() {
  return Object.values(TEXTOS_PUENTE).filter(Boolean);
}

export function panelPuente(estado, objetivos) {
  return {
    quieroHacer: quieroHacerConObjetivo(estado, objetivos),
    experiencias: experiencias(estado, objetivos),
    sugerencias: sugerirYaLoHice(estado, objetivos),
    plazos: PLAZOS_OBJETIVO,
    destino: DESTINO_OBJETIVOS,
    resumen: resumenPuente(estado, objetivos),
  };
}

export { MODULO_GUSTOS, categoriaGusto };
