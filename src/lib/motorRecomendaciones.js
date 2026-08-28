// ============================================================================
// EL MOTOR DE RECOMENDACIONES (nace en EH F16, extraído de EH F9)
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
//
// La Fase 9 construyó el motor de recomendaciones capilares: reglas con
// `requiere`/`cuando`/`porque`, descarte con motivos y caducidad, guardadas, y
// la regla de oro —**sin los datos que necesita, una regla no se dispara**—.
//
// La Fase 12 volvió a necesitarlo para los cortes y escribió su propio
// `reglaAplicableCorte`, idéntico. La **Fase 16** lo necesita otra vez para
// Skincare. Tres copias del mismo `if` es como se acaba arreglando un fallo en
// dos sitios y olvidando el tercero.
//
// Así que lo genérico vive aquí, igual que se hizo con `motorRutinas.js` en la
// Fase 14. Las **146 pruebas de la Fase 9** y las **209 de la Fase 12** son la
// red que demuestra que la extracción no cambió nada.
//
// ── LA REGLA DE ORO, EN UN SOLO SITIO ──────────────────────────────────────
//
// ⚠️ **Si falta un dato que la regla necesita, NO se asume.** Y su corolario,
// que no es obvio: **una regla sin requisitos declarados no se aplica nunca**.
// Si se permitiera, se dispararía con el contexto vacío y acabaría
// recomendándole cosas a alguien de quien no sabemos nada — el fallo silencioso
// clásico de este tipo de motor.
// ============================================================================

import { uid, todayISO } from './helpers';

/* ===========================================================================
   1 · ¿SE APLICA ESTA REGLA?
   =========================================================================== */

/** Un dato "existe" si no es nulo, ni vacío, ni una lista sin elementos. */
export function tieneDato(v) {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function reglaAplicable(regla, ctx) {
  if (!regla || typeof regla.cuando !== 'function') return false;
  // ⚠️ Sin requisitos declarados, nunca. Ver la cabecera.
  if (!Array.isArray(regla.requiere) || regla.requiere.length === 0) return false;
  if (!regla.requiere.every((k) => tieneDato(ctx[k]))) return false;
  // Una regla que revienta no recomienda: no tumba la pantalla entera.
  try { return regla.cuando(ctx) === true; } catch { return false; }
}

/* ===========================================================================
   2 · EL DESCARTE — CON MEMORIA, PERO CON CADUCIDAD
   ===========================================================================
   ⚠️ *"No quiero verlo"* es **para siempre**, y por eso es el único motivo sin
   plazo: "para siempre" no es un número de días. */

export const DEFAULT_RECOMENDACIONES = { feedback: [], guardadas: [], vistas: [] };

export function normalizarRecomendaciones(guardado, { ids = null, motivos = [] } = {}) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const idOk = (x) => (ids === null ? typeof x === 'string' && !!x : ids.includes(x));
  return {
    feedback: (Array.isArray(g.feedback) ? g.feedback : [])
      .filter((f) => f && idOk(f.reglaId) && motivos.some((m) => m.id === f.motivo))
      .map((f) => ({ reglaId: f.reglaId, motivo: f.motivo, fecha: typeof f.fecha === 'string' ? f.fecha : null })),
    guardadas: (Array.isArray(g.guardadas) ? g.guardadas : [])
      .filter((x) => x && idOk(x.reglaId))
      .map((x) => ({ id: x.id || uid(), reglaId: x.reglaId, fecha: x.fecha || null })),
    /* ⚠️ Qué se ha enseñado ya y cuándo. Sin esto, la misma recomendación
       saldría la primera todos los días. */
    vistas: (Array.isArray(g.vistas) ? g.vistas : [])
      .filter((v) => v && idOk(v.reglaId) && typeof v.fecha === 'string')
      .map((v) => ({ reglaId: v.reglaId, fecha: v.fecha, veces: Number.isFinite(Number(v.veces)) ? Number(v.veces) : 1 })),
  };
}

export const diasDesde = (fecha, hoy) => {
  if (!fecha) return Infinity;
  return Math.round((new Date(`${hoy}T00:00:00`) - new Date(`${fecha}T00:00:00`)) / 86400000);
};

/**
 * ¿Está callada esta recomendación ahora mismo?
 *
 * `paraSiempre` es la lista de motivos sin caducidad. `dias` es cuántos días
 * calla cada uno de los demás.
 */
export function silenciadaEn(recs, reglaId, { hoy = todayISO(), dias = {}, paraSiempre = [] } = {}) {
  const f = (recs.feedback || []).find((x) => x.reglaId === reglaId);
  if (!f) return { silenciada: false, motivo: null, paraSiempre: false };
  if (paraSiempre.includes(f.motivo)) return { silenciada: true, motivo: f.motivo, paraSiempre: true };
  return { silenciada: diasDesde(f.fecha, hoy) < (dias[f.motivo] || 30), motivo: f.motivo, paraSiempre: false };
}

/* ===========================================================================
   3 · REGISTRAR LO QUE PASA CON UNA RECOMENDACIÓN
   ===========================================================================
   ⚠️ Todas devuelven el objeto de recomendaciones ya cambiado; **quién lo
   guarda es cada módulo**, porque cada uno sabe dónde vive el suyo. Mismo
   reparto que `motorRutinas.js`. */

export function marcarVistasEn(recs, ids = [], hoy = todayISO()) {
  const vistas = [...(recs.vistas || [])];
  ids.forEach((id) => {
    const i = vistas.findIndex((v) => v.reglaId === id);
    if (i === -1) vistas.push({ reglaId: id, fecha: hoy, veces: 1 });
    else vistas[i] = { ...vistas[i], fecha: hoy, veces: vistas[i].veces + 1 };
  });
  return { ...recs, vistas };
}

export function descartarEn(recs, reglaId, motivo, hoy = todayISO()) {
  const feedback = (recs.feedback || []).filter((f) => f.reglaId !== reglaId);
  return { ...recs, feedback: [...feedback, { reglaId, motivo, fecha: hoy }] };
}

/** ⚠️ Todo descarte se puede deshacer: un toque no condena una recomendación. */
export const deshacerDescarteEn = (recs, reglaId) =>
  ({ ...recs, feedback: (recs.feedback || []).filter((f) => f.reglaId !== reglaId) });

export function guardarEn(recs, reglaId, hoy = todayISO()) {
  if ((recs.guardadas || []).some((g) => g.reglaId === reglaId)) return recs;
  return { ...recs, guardadas: [...(recs.guardadas || []), { id: uid(), reglaId, fecha: hoy }] };
}

export const quitarGuardadaEn = (recs, reglaId) =>
  ({ ...recs, guardadas: (recs.guardadas || []).filter((g) => g.reglaId !== reglaId) });

/* ===========================================================================
   4 · EL TONO
   ===========================================================================
   ⚠️ *"Nunca 'debes'."* Lo pedían la Fase 9 con esas palabras y lo repiten la
   12 y la 16. Vive aquí para que sea **una sola lista**: dos listas de palabras
   prohibidas es cómo una fase futura se olvida de añadir la suya a las dos. */

export const PALABRAS_PROHIBIDAS = [
  'debes', 'tienes que', 'deberías', 'obligatorio', 'necesitas', 'hay que',
  'error', 'mal', 'problema', 'fallo',
];

export const FORMULAS_PERMITIDAS = ['podría', 'podrías', 'una opción compatible', 'puedes'];

export function tonoCorrecto(texto) {
  const t = String(texto || '').toLowerCase();
  return !PALABRAS_PROHIBIDAS.some((p) => t.includes(p));
}

/* ===========================================================================
   5 · CUÁNTAS SE ENSEÑAN
   ===========================================================================
   *"Mostrar inicialmente 3 recomendaciones y Ver más."* Lo piden la Fase 9 y la
   16 con el mismo número. */

export const RECOMENDACIONES_INICIALES = 3;

/**
 * Ordena y recorta. ⚠️ **No escribe nada**: mostrar y registrar que se ha
 * mostrado son dos llamadas distintas, para que repintar una pantalla no
 * ensucie el historial.
 */
export function ordenarYRecortar(recomendaciones, { limite = RECOMENDACIONES_INICIALES, prioridad = null } = {}) {
  const conPeso = recomendaciones.map((r) => ({
    ...r,
    // La prioridad que haya marcado el usuario pesa, pero no tapa el resto.
    peso: (r.peso || 0) + (prioridad && r.temas?.includes(prioridad) ? 10 : 0),
  }));
  conPeso.sort((a, b) => b.peso - a.peso || String(a.titulo).localeCompare(String(b.titulo)));
  return { total: conPeso.length, recomendaciones: conPeso.slice(0, limite), hayMas: conPeso.length > limite };
}
