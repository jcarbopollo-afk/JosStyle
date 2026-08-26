// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 4 — el sistema de colores, la parte pura.
//
// QUÉ HACE ESTE ARCHIVO Y QUÉ NO
// Los COLORES en sí ya existían y no se tocan: `COLORS`, `aplicarTema()`,
// `colorEngine.js`, `ColorPicker`, `TemaBuilder` y la gestión de temas guardados
// son de las fases V1-V4 y siguen mandando. El apartado 23 pide un sistema
// centralizado y ya lo hay; crear otro sería exactamente lo que prohíbe.
//
// Lo que faltaba, y es lo que hay aquí, son las OPERACIONES sobre esa
// configuración que la Fase 4 pide y no existían:
//
//   · restablecer los colores SIN tocar el fondo (apartado 15);
//   · saber si hay algo personalizado, para no ofrecer un botón inerte;
//   · aplicar un preset sin perder la fotografía (apartados 14 y 16);
//   · comprobar que colores y fondo se guardan por separado (apartado 16).
//
// Son puras y viven aquí para poder probarlas con Node. `tokens.js` NO importa
// este archivo, así que no hay ciclo.
// ---------------------------------------------------------------------------
import { DEFAULT_TEMA_PERSONALIZADO } from '../tokens';
import { isValidHex, normalizeHex } from './colorEngine';

// Los campos que son un color. El resto (`estados`, los dos alfas) se tratan
// aparte porque no son un hex suelto.
export const CAMPOS_COLOR = [
  'secundario', 'terciario', 'fondo', 'superficie', 'texto', 'bordes',
  'textoSecundario', 'iconoActivo', 'iconoInactivo', 'navegacionFondo',
];

export const CAMPOS_ALFA = ['superficieAlfa', 'navegacionAlfa', 'bordeAlfa'];

// FO Fase 7 — la sombra no es un alfa (su rango es 0-40 y su valor de fábrica 0),
// así que se acota aparte en vez de forzarla dentro de una lista donde no encaja.
export const MAX_SOMBRAS = 40;

/**
 * Rellena y limpia un tema personalizado.
 *
 * Mismo motivo que `normalizarFondo`: regla 5 del proyecto, `loadData` no fusiona
 * con el valor por defecto, así que un tema guardado antes de esta fase llega sin
 * `superficieAlfa` ni los campos nuevos. Aquí se reponen sin pisar lo que sí había.
 */
export function normalizarTema(guardado) {
  const t = { ...DEFAULT_TEMA_PERSONALIZADO, ...(guardado || {}) };
  const out = { ...t };
  for (const k of CAMPOS_COLOR) {
    out[k] = isValidHex(t[k]) ? normalizeHex(t[k]) : null;
  }
  for (const k of CAMPOS_ALFA) {
    const n = Number(t[k]);
    // Suelo en 20: una superficie totalmente transparente sobre una foto no es
    // "translúcida", es texto suelto encima de una imagen, y deja de leerse.
    out[k] = Number.isFinite(n) ? Math.min(100, Math.max(20, n)) : 100;
  }
  out.sombras = Number.isFinite(Number(t.sombras)) ? Math.min(MAX_SOMBRAS, Math.max(0, Number(t.sombras))) : 0;
  const est = t.estados || {};
  out.estados = {};
  for (const k of ['positive', 'warning', 'negative', 'info']) {
    out.estados[k] = isValidHex(est[k]) ? normalizeHex(est[k]) : null;
  }
  return out;
}

/**
 * Apartado 15 — "Restablecer colores".
 *
 * Devuelve el sistema cromático a la configuración oficial y **nada más**. El
 * apartado lo subraya: no debe eliminar fotografías, fondos ni configuraciones
 * fotográficas. Aquí eso sale gratis y no por casualidad — el fondo vive en
 * `apariencia.fondo` y los colores en `apariencia.temaPersonalizado`, dos sitios
 * distintos (apartado 16), así que esta función ni siquiera recibe el fondo y por
 * tanto **no puede tocarlo**. Es la clase de garantía que no depende de acordarse.
 */
export const restablecerColores = () => ({ ...normalizarTema(null) });

/** ¿Hay algún color personalizado? Para no ofrecer un "Restablecer" que no hace nada. */
export function tieneColoresPersonalizados(tema) {
  const t = normalizarTema(tema);
  if (CAMPOS_COLOR.some((k) => t[k])) return true;
  if (CAMPOS_ALFA.some((k) => t[k] !== 100)) return true;
  if (t.sombras !== 0) return true;
  return Object.values(t.estados).some(Boolean);
}

/**
 * Apartado 14 — aplicar una combinación predefinida.
 *
 * Las paletas de la app ya existen (`PALETAS_PREDEFINIDAS`, Fase A7 + V4) y traen
 * su propio `temaPersonalizado`. Esto solo lo normaliza y **conserva los ajustes
 * que la paleta no menciona**: si Josué había puesto las tarjetas translúcidas
 * para ver su foto, elegir una paleta de colores no tiene por qué volverlas
 * opacas y taparle la fotografía. Un preset de color cambia colores.
 */
export function aplicarPresetColor(temaActual, presetTema) {
  const actual = normalizarTema(temaActual);
  const preset = normalizarTema(presetTema);
  const out = { ...preset };
  // Los alfas son del fondo/legibilidad, no de la paleta: se conservan salvo que
  // el preset los declare explícitamente.
  for (const k of CAMPOS_ALFA) {
    out[k] = (presetTema && presetTema[k] !== undefined) ? preset[k] : actual[k];
  }
  out.sombras = (presetTema && presetTema.sombras !== undefined) ? preset.sombras : actual.sombras;
  return out;
}

/**
 * Apartado 16 — los colores se guardan aparte de la fotografía.
 *
 * No es una función que "haga" la separación: la separación es estructural, porque
 * son dos claves distintas de `apariencia`. Esto lo COMPRUEBA, para que una fase
 * futura que las mezcle rompa una prueba en vez de romper la app en silencio.
 */
export function coloresYFondoSonIndependientes(apariencia) {
  if (!apariencia) return false;
  const tieneAmbos = 'fondo' in apariencia && 'temaPersonalizado' in apariencia;
  if (!tieneAmbos) return false;
  // Y que ninguno guarde una copia del otro dentro.
  const fondoJson = JSON.stringify(apariencia.fondo || {});
  return !fondoJson.includes('"secundario"') && !fondoJson.includes('"superficieAlfa"');
}
