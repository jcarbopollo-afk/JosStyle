// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 8 — Presets de apariencia.
//
// ESTO AMPLÍA `temasGuardados`, NO LO SUSTITUYE
// La fase V4 ya construyó guardar/renombrar/duplicar/eliminar/exportar/importar
// temas, con su clave propia en Supabase y su límite. Lo que le falta para ser
// lo que pide el apartado 2 es UNA cosa: el fondo. Un preset que guarda los
// colores pero no la fotografía no es "una configuración completa de apariencia",
// es media.
//
// Así que aquí no hay un segundo sistema de presets: hay las funciones puras que
// convierten un tema guardado en un preset completo y al revés, más las reglas
// que la Fase 8 añade (oficiales que no se tocan, favoritos, orden).
//
// LA DECISIÓN QUE HABÍA QUE TOMAR: ¿UN PRESET GUARDA LA FOTO?
// Sí — el apartado 2 la lista y el ejemplo del apartado 1 es literalmente "Mi
// foto → fondo personalizado + colores personalizados". Pero guarda la
// REFERENCIA (la ruta en Storage), no una copia del archivo, y aplicar un preset
// **no borra la foto anterior**: sigue en Storage y en el preset que la tuviera.
// Es el mismo criterio que "quitar foto no la borra" de FO F2.
// ---------------------------------------------------------------------------
import { normalizarFondo, DEFAULT_FONDO } from './fondos';
import { normalizarTema } from './temaColores';
import { DEFAULT_TEMA_PERSONALIZADO } from '../tokens';

/* ===========================================================================
   PRESETS OFICIALES (apartados 13 y 14)
   =========================================================================== */

/**
 * Los que trae la app. `oficial: true` los hace **inmodificables** (apartado 14):
 * para personalizar uno hay que duplicarlo, y así el original nunca se pierde.
 *
 * Ninguno lleva fotografía: una foto es de quien la hizo, y un preset de fábrica
 * con una imagen de archivo sería exactamente el tipo de contenido inventado que
 * la regla 8 del proyecto prohíbe.
 */
export const PRESETS_OFICIALES = [
  {
    id: 'oficial-josstyle',
    nombre: 'JosStyle',
    oficial: true,
    descripcion: 'La apariencia de siempre.',
    tema: 'oscuro',
    // `null` en accent significa "no lo toques": este preset es el de fábrica y
    // el acento de fábrica es el que Josué haya elegido, no uno impuesto.
    accent: null,
    temaPersonalizado: { ...DEFAULT_TEMA_PERSONALIZADO },
    fondo: { ...DEFAULT_FONDO },
  },
  {
    id: 'oficial-profundo',
    nombre: 'Profundo',
    oficial: true,
    descripcion: 'Oscuro, con degradado y tarjetas translúcidas.',
    tema: 'oscuro',
    accent: null,
    temaPersonalizado: { ...DEFAULT_TEMA_PERSONALIZADO, superficieAlfa: 86, navegacionAlfa: 84, bordeAlfa: 70 },
    fondo: { ...DEFAULT_FONDO, tipo: 'predeterminado', activo: true, incluido: 'profundidad' },
  },
  {
    id: 'oficial-claro',
    nombre: 'Claro',
    oficial: true,
    descripcion: 'Fondo claro y superficies limpias.',
    tema: 'claro',
    accent: null,
    temaPersonalizado: { ...DEFAULT_TEMA_PERSONALIZADO },
    fondo: { ...DEFAULT_FONDO },
  },
  {
    id: 'oficial-minimal',
    nombre: 'Minimal',
    oficial: true,
    descripcion: 'Sin bordes marcados y sin sombra.',
    tema: 'oscuro',
    accent: null,
    temaPersonalizado: { ...DEFAULT_TEMA_PERSONALIZADO, bordeAlfa: 35, sombras: 0 },
    fondo: { ...DEFAULT_FONDO },
  },
];

export const MAX_PRESETS = 12;

/* ===========================================================================
   CREAR Y NORMALIZAR
   =========================================================================== */

/**
 * Empaqueta la apariencia actual entera en un preset (apartados 2 y 3).
 *
 * Copia profunda a propósito: un preset que guardara referencias cambiaría solo
 * cada vez que Josué toca un color, y dejaría de ser "lo que tenía aquel día".
 */
export function crearPreset({ nombre, tema, accent, temaPersonalizado, fondo }) {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nombre: (nombre || '').trim() || 'Mi apariencia',
    oficial: false,
    favorito: false,
    tema: tema || 'oscuro',
    accent: accent || null,
    temaPersonalizado: JSON.parse(JSON.stringify(normalizarTema(temaPersonalizado))),
    fondo: JSON.parse(JSON.stringify(normalizarFondo(fondo))),
    creadoEn: new Date().toISOString(),
  };
}

/** Rellena un preset guardado por una versión anterior (regla 5). */
export function normalizarPreset(p) {
  if (!p) return null;
  return {
    ...p,
    nombre: (p.nombre || '').trim() || 'Mi apariencia',
    oficial: !!p.oficial,
    favorito: !!p.favorito,
    tema: p.tema || 'oscuro',
    accent: p.accent || null,
    temaPersonalizado: normalizarTema(p.temaPersonalizado),
    // Un preset guardado por la fase V4 no tiene fondo: se le pone el de fábrica,
    // que es "sin fondo". Así los temas que Josué ya tuviera guardados siguen
    // funcionando y simplemente no tocan el fondo al aplicarse.
    fondo: normalizarFondo(p.fondo),
  };
}

/* ===========================================================================
   APLICAR (apartados 7 y 8)
   =========================================================================== */

/**
 * Qué hay que cambiar para aplicar un preset.
 *
 * Devuelve las piezas por separado, igual que `aplicarPropuesta` en FO F6, porque
 * viven en sitios distintos (`ajustes.accent`, `temaPersonalizado`,
 * `apariencia.tema`, `apariencia.fondo`).
 *
 * `accent: null` significa **no toques el acento**, no "ponlo a null". Es lo que
 * permite que el preset oficial "JosStyle" devuelva la app a su estado de fábrica
 * sin imponerle a Josué un color que él no eligió.
 */
export function aplicarPreset(preset, { accentActual } = {}) {
  const p = normalizarPreset(preset);
  if (!p) return null;
  return {
    tema: p.tema,
    accent: p.accent || accentActual || null,
    temaPersonalizado: JSON.parse(JSON.stringify(p.temaPersonalizado)),
    fondo: JSON.parse(JSON.stringify(p.fondo)),
  };
}

/**
 * La foto de un preset puede ya no existir (se sustituyó, o nunca la hubo).
 * Aplicarlo entonces **no debe dejar un fondo roto**: `resolverFondo` ya sabe
 * bajar al fondo incluido, pero conviene poder avisarlo antes de aplicar.
 */
export const presetTieneFoto = (preset) => !!normalizarPreset(preset)?.fondo?.foto?.path;

/* ===========================================================================
   LISTA, ORDEN Y FAVORITOS (apartados 5, 6, 15 y 16)
   =========================================================================== */

/**
 * Los presets como se enseñan: oficiales al final, favoritos arriba.
 *
 * Los oficiales van **al final** y no al principio a propósito: son cuatro y
 * siempre están, así que ocuparían la primera pantalla entera y empujarían fuera
 * lo que Josué se ha molestado en crear.
 */
export function listaPresets(propios, { favoritosPrimero = true } = {}) {
  const mios = (propios || []).map(normalizarPreset).filter(Boolean);
  const ordenados = favoritosPrimero
    ? [...mios].sort((a, b) => (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0))
    : mios;
  return [...ordenados, ...PRESETS_OFICIALES.map(normalizarPreset)];
}

/** Cuál está activo ahora mismo (apartado 6). Se compara lo que se ve, no ids. */
export function presetActivo(lista, actual) {
  if (!actual) return null;
  const huella = huellaDe(actual);
  return (lista || []).find((p) => huellaDe(p) === huella) || null;
}

/**
 * La "huella" de una apariencia: lo que de verdad se ve.
 *
 * No se compara por id porque el id no dice nada — Josué puede aplicar un preset
 * y luego cambiar un color a mano, y entonces ya no está usando ese preset aunque
 * fuera el último que tocó. Marcarlo como activo sería mentir.
 */
function huellaDe(x) {
  if (!x) return '';
  const tema = normalizarTema(x.temaPersonalizado);
  const fondo = normalizarFondo(x.fondo);
  return JSON.stringify([
    x.tema || 'oscuro',
    x.accent || null,
    tema,
    // Del fondo solo cuenta lo que se ve, no el historial de ajustes por foto ni
    // el análisis: dos apariencias idénticas no dejan de serlo porque una recuerde
    // el encuadre de una foto vieja.
    [fondo.tipo, fondo.activo, fondo.color, fondo.incluido, fondo.degradado, fondo.foto.path,
      fondo.encuadre, fondo.escala, fondo.opacidad, fondo.desenfoque, fondo.luminosidad, fondo.overlay],
  ]);
}

/** Apartado 9 — duplicar. La copia es independiente y NUNCA oficial. */
export function duplicarPreset(preset) {
  const p = normalizarPreset(preset);
  if (!p) return null;
  return {
    ...JSON.parse(JSON.stringify(p)),
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nombre: `${p.nombre} (copia)`,
    // Duplicar un OFICIAL es la vía que da el apartado 14 para personalizarlo:
    // la copia tiene que ser tuya, o no se podría tocar tampoco.
    oficial: false,
    favorito: false,
    creadoEn: new Date().toISOString(),
  };
}

/** Apartado 10 — actualizar un preset con la apariencia actual. */
export function actualizarPreset(preset, apariencia) {
  const p = normalizarPreset(preset);
  if (!p) return null;
  // Apartado 14: un oficial no se toca. Se devuelve tal cual en vez de fallar,
  // para que quien llame no tenga que acordarse de comprobarlo.
  if (p.oficial) return p;
  return {
    ...p,
    tema: apariencia.tema || p.tema,
    accent: apariencia.accent || p.accent,
    temaPersonalizado: JSON.parse(JSON.stringify(normalizarTema(apariencia.temaPersonalizado))),
    fondo: JSON.parse(JSON.stringify(normalizarFondo(apariencia.fondo))),
    actualizadoEn: new Date().toISOString(),
  };
}

/** Apartado 15 — favorito. Los oficiales tampoco se marcan: no son tuyos. */
export function alternarFavorito(preset) {
  const p = normalizarPreset(preset);
  if (!p || p.oficial) return p;
  return { ...p, favorito: !p.favorito };
}

/** ¿Se puede modificar? Un solo sitio que lo decida (apartado 14). */
export const esEditable = (preset) => !!preset && !preset.oficial;
