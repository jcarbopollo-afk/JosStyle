// ============================================================================
// EH — EL MOTOR DE CUESTIONARIOS (nace en la Fase 7/65)
//
// La Fase 7 es la primera que pregunta cosas de verdad, pero no será la última:
// Skincare (13), Barba (20), Manos (22), Cuerpo (18) y Perfumes (24) traen cada
// una su propio cuestionario de perfil. Así que lo que se construye aquí es **el
// motor**, y la Fase 7 es su primera configuración.
//
// ── LA DECISIÓN QUE EVITA UN SÉPTIMO ALMACÉN ───────────────────────────────
//
// **Este motor no guarda nada por su cuenta.** Cada respuesta va a uno de los
// dos sitios que ya existen, y la elección no es un `if` suelto sino una regla:
//
//   - Si el dato **está en `REGISTRO_DATOS`** (F4), va allí. Eso significa que
//     lo comparten varios módulos —`tipoPelo` lo usan Pelo y Productos— y por
//     tanto **no se puede volver a preguntar** (F4, apartado 7).
//   - Si **no está**, es solo de ese módulo y va a su `config` (F1, apartado 8:
//     *"configuración específica futura"*), que `alternarModulo` nunca toca.
//
// Un cuestionario que guardara en su propio sitio daría dos tipos de pelo el día
// que Productos preguntara el suyo. Es la misma regla de siempre, aplicada al
// caso que más veces se va a repetir.
//
// ── "NO LO SÉ" ES UNA RESPUESTA ────────────────────────────────────────────
//
// El apartado 14 de la Fase 7 lo dice con esas palabras: *"Nunca obligar a
// inventar una respuesta."* Así que `NO_LO_SE` es un valor guardado, distinto de
// no haber contestado — y las dos cosas se distinguen, porque *"no lo sé"* es
// información (se le puede ofrecer contenido educativo) y *"aún no ha llegado"*
// no lo es.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH, IDS_EH } from './estiloDeHombre';
import { leerDato, guardarDato, eliminarDato, datoDelRegistro } from './datosEstiloHombre';
import { todayISO } from './helpers';

export const NO_LO_SE = 'no_lo_se';
export const OPCION_NO_LO_SE = { id: NO_LO_SE, nombre: 'No lo sé' };

/* ===========================================================================
   1 · LA FORMA DE UNA PREGUNTA
   ===========================================================================
   `{ id, titulo, opciones, multiple, noLoSe, opcional, ayuda }`

   Nada más. Una pregunta que necesite algo que no está aquí probablemente esté
   pidiendo una pantalla, no una pregunta. */

export function normalizarPregunta(p) {
  const q = p || {};
  return {
    id: q.id,
    titulo: q.titulo || '',
    ayuda: q.ayuda || '',
    opciones: Array.isArray(q.opciones) ? q.opciones : [],
    multiple: !!q.multiple,
    // ⚠️ Por defecto SÍ se puede decir "no lo sé": el apartado 14 lo pide, y el
    // valor por defecto tiene que ser el que no obliga a inventar.
    noLoSe: q.noLoSe !== false,
    // Y por defecto todo es opcional. Una pregunta obligatoria en un perfil que
    // se puede saltar entero no significa nada.
    opcional: q.opcional !== false,
  };
}

/** Las opciones que se pintan, con "No lo sé" al final si corresponde. */
export function opcionesDe(pregunta) {
  const p = normalizarPregunta(pregunta);
  return p.noLoSe ? [...p.opciones, OPCION_NO_LO_SE] : p.opciones;
}

/* ===========================================================================
   2 · ⚠️ DÓNDE SE GUARDA CADA RESPUESTA
   ===========================================================================
   La regla del encabezado, hecha función. */

export const DESTINOS_RESPUESTA = ['compartido', 'del_modulo'];

export function destinoDe(preguntaId) {
  return datoDelRegistro(preguntaId) ? 'compartido' : 'del_modulo';
}

const comoLista = (v) => {
  if (Array.isArray(v)) return v.filter((x) => x !== null && x !== undefined && x !== '');
  if (v === null || v === undefined || v === '') return [];
  return [v];
};

/**
 * Devuelve **siempre** la misma forma, venga la respuesta de la capa compartida
 * o de la `config` del módulo. Igual que `leerDato()` de la Fase 4: quien
 * pregunta no tiene que saber dónde está.
 */
export function leerRespuesta(estado, moduloId, pregunta, datosGlobales = {}) {
  const p = normalizarPregunta(pregunta);
  const destino = destinoDe(p.id);

  let valores;
  if (destino === 'compartido') {
    valores = comoLista(leerDato(estado, p.id, datosGlobales).valor);
  } else {
    const e = normalizarEstiloHombre(estado);
    const mod = e.modulos.find((m) => m.id === moduloId);
    valores = comoLista(mod?.config?.[p.id]);
  }

  const noSabe = valores.includes(NO_LO_SE);
  return {
    id: p.id,
    titulo: p.titulo,
    destino,
    valores,
    // ⚠️ Contestada y "sabe la respuesta" NO son lo mismo.
    contestada: valores.length > 0,
    noSabe,
    // Y esto es lo que abre la puerta al contenido educativo del apartado 2.
    puedeAprender: noSabe,
    etiquetas: valores.map((v) => nombreDeOpcion(p, v)),
  };
}

export function nombreDeOpcion(pregunta, valor) {
  if (valor === NO_LO_SE) return OPCION_NO_LO_SE.nombre;
  const p = normalizarPregunta(pregunta);
  return p.opciones.find((o) => o.id === valor)?.nombre || String(valor);
}

/* ===========================================================================
   3 · CONTESTAR
   =========================================================================== */

function escribir(estado, moduloId, preguntaId, valores, hoy) {
  if (destinoDe(preguntaId) === 'compartido') {
    if (valores.length === 0) return eliminarDato(estado, preguntaId);
    return guardarDato(estado, preguntaId, valores.length === 1 ? valores[0] : valores, { modulo: moduloId, hoy });
  }
  // `guardarConfig` fusiona (F1), así que una pregunta no pisa a otra.
  const e = guardarConfig(estado, moduloId, { [preguntaId]: valores.length === 0 ? null : (valores.length === 1 ? valores[0] : valores) });
  return { estado: e, error: null };
}

/**
 * ⚠️ **"No lo sé" es exclusivo.** Marcarlo borra lo demás, y marcar cualquier
 * otra cosa lo quita: *"cuero cabelludo graso y no lo sé"* no es una respuesta,
 * es un estado imposible que luego nadie sabe interpretar.
 */
export function contestar(estado, moduloId, pregunta, valor, { hoy = todayISO() } = {}) {
  const p = normalizarPregunta(pregunta);
  if (!IDS_EH.includes(moduloId)) return { estado: normalizarEstiloHombre(estado), error: 'Ese módulo no existe.' };
  if (valor !== NO_LO_SE && !p.opciones.some((o) => o.id === valor)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa opción no existe en esta pregunta.' };
  }
  if (valor === NO_LO_SE && !p.noLoSe) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esta pregunta no admite "No lo sé".' };
  }

  const actuales = leerRespuesta(estado, moduloId, p).valores;

  if (!p.multiple) {
    const siguientes = actuales[0] === valor ? [] : [valor];
    return escribir(estado, moduloId, p.id, siguientes, hoy);
  }

  if (valor === NO_LO_SE) {
    const siguientes = actuales.includes(NO_LO_SE) ? [] : [NO_LO_SE];
    return escribir(estado, moduloId, p.id, siguientes, hoy);
  }

  const sinNoLoSe = actuales.filter((x) => x !== NO_LO_SE);
  const siguientes = sinNoLoSe.includes(valor) ? sinNoLoSe.filter((x) => x !== valor) : [...sinNoLoSe, valor];
  return escribir(estado, moduloId, p.id, siguientes, hoy);
}

/** Apartado 15 — *"debe poder modificar cualquier respuesta"*, y también borrarla. */
export function borrarRespuesta(estado, moduloId, pregunta, { hoy = todayISO() } = {}) {
  const p = normalizarPregunta(pregunta);
  return escribir(estado, moduloId, p.id, [], hoy);
}

/* ===========================================================================
   4 · EL CUESTIONARIO ENTERO
   =========================================================================== */

export function leerCuestionario(estado, moduloId, preguntas, datosGlobales = {}) {
  return (preguntas || []).map((p) => {
    const q = normalizarPregunta(p);
    return {
      ...q,
      ...leerRespuesta(estado, moduloId, q, datosGlobales),
      opcionesVisibles: opcionesDe(q),
    };
  });
}

/**
 * ⚠️ **Un recuento, no una nota.** Igual que el perfil de estilo de la Fase 6:
 * ni porcentaje, ni "incompleto", ni barra que empuje. Josué puede contestar dos
 * de doce y eso está bien.
 */
export function progresoCuestionario(estado, moduloId, preguntas, datosGlobales = {}) {
  const todas = leerCuestionario(estado, moduloId, preguntas, datosGlobales);
  const contestadas = todas.filter((q) => q.contestada);
  return {
    contestadas: contestadas.length,
    total: todas.length,
    // Cuántas ha contestado con "no lo sé": son las que dan pie a educación.
    noSabe: todas.filter((q) => q.noSabe).length,
    sinEmpezar: contestadas.length === 0,
    // ⚠️ Nunca "completo": no hay nada que completar.
    todasContestadas: contestadas.length === todas.length && todas.length > 0,
  };
}

/**
 * Los tres estados de la pantalla de entrada de un módulo con perfil (Fase 7,
 * apartado 1). Se calculan aquí para que la vista no los deduzca con `if`.
 */
export const ESTADOS_CUESTIONARIO = ['sin_empezar', 'a_medias', 'contestado'];

export function estadoCuestionario(estado, moduloId, preguntas, datosGlobales = {}) {
  const p = progresoCuestionario(estado, moduloId, preguntas, datosGlobales);
  if (p.sinEmpezar) return 'sin_empezar';
  return p.todasContestadas ? 'contestado' : 'a_medias';
}

/**
 * Apartado 17 — *"debe dejar preparada la estructura para que posteriormente
 * podamos decir: Según tus características y preferencias…"*.
 *
 * ⚠️ Esto **no recomienda**: entrega lo contestado con su nombre legible, para
 * que la fase que recomiende no tenga que leer ids. Y dice qué falta, sin
 * pedirlo.
 */
export function contextoDelCuestionario(estado, moduloId, preguntas, datosGlobales = {}) {
  const todas = leerCuestionario(estado, moduloId, preguntas, datosGlobales);
  const contestadas = todas.filter((q) => q.contestada && !q.noSabe);
  return {
    modulo: moduloId,
    nombre: moduloEH(moduloId)?.nombre || moduloId,
    respuestas: contestadas.map((q) => ({ id: q.id, titulo: q.titulo, valores: q.valores, etiquetas: q.etiquetas })),
    // Lo que no sabe: no es lo mismo que no haber contestado, y quien recomiende
    // debería tratarlo distinto.
    noSabe: todas.filter((q) => q.noSabe).map((q) => q.id),
    sinContestar: todas.filter((q) => !q.contestada).map((q) => q.id),
    // ⚠️ Con cero respuestas esto sigue siendo válido. Nadie tiene que
    // comprobar si está vacío antes de usarlo.
    vacio: contestadas.length === 0,
  };
}

/**
 * ⚠️ El apartado 16 en código: *"no crear información duplicada"*. Dice, por
 * cuestionario, qué preguntas comparten dato con otros módulos y cuáles no.
 */
export function auditarCuestionario(moduloId, preguntas) {
  const compartidas = (preguntas || []).filter((p) => destinoDe(p.id) === 'compartido');
  return {
    modulo: moduloId,
    total: (preguntas || []).length,
    compartidas: compartidas.map((p) => ({ id: p.id, conQuien: datoDelRegistro(p.id).usan.filter((m) => m !== moduloId) })),
    propias: (preguntas || []).length - compartidas.length,
    // Cero almacenes nuevos: o la capa de F4, o la `config` del módulo (F1).
    almacenesNuevos: 0,
  };
}
