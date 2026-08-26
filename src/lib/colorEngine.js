// Fase 1 del Sistema de Personalización Visual Extrema — Motor universal de color.
//
// Este archivo es la pieza nueva de arquitectura de esta ampliación: funciones puras, sin UI,
// sin dependencias externas (este entorno no tiene acceso al registro de npm, así que todo —
// incluida la conversión a OKLCH — está escrito a mano con las fórmulas públicas estándar de
// Björn Ottosson, las mismas que usa la especificación CSS Color 4). Verificadas con Node antes
// de integrarse: round-trip HEX→OKLCH→HEX exacto en 9 colores de prueba (incluidos los 3 canales
// puros y varios acentos reales de `ACCENTS`), y contraste WCAG contra los valores de referencia
// conocidos (blanco/negro = 21:1).
//
// Pipeline que describe la especificación maestra: color de usuario → motor → escalas → roles →
// contraste → tema → componentes. Este archivo cubre motor + escalas + contraste. Los "roles" se
// ensamblan en `buildRolesFromAccent` (al final) y se aplican sobre `COLORS` desde `tokens.js` —
// el objeto singleton que ya usan por referencia unas 20 vistas desde la Fase A3, sin tocarlo.
//
// Nada de esto sustituye lo que ya existe (COLORS_OSCURO/COLORS_CLARO, aplicarTema): lo amplía.
import { hexToRgba } from './helpers';

// ─────────────────────────────────────────────────────────────────────────
// Conversión entre formatos — HEX, RGB, HSL (apartado 6 de la especificación).
// ─────────────────────────────────────────────────────────────────────────

// Los dos extremos del eje de luminancia. NO son colores de interfaz —no salen
// del tema ni pueden salir de él: oscurecer es acercar al negro en tema claro Y
// en oscuro— así que no pertenecen a `tokens.js`. Viven aquí, en el motor de
// color, que es de donde salen todas las operaciones que los necesitan
// (`mix`, composición de capas, contraste), y así no se escriben a mano en cada
// archivo que los use.
export const NEGRO = '#000000';
export const BLANCO = '#FFFFFF';

export function isValidHex(value) {
  return /^#?[0-9A-Fa-f]{6}$/.test(value) || /^#?[0-9A-Fa-f]{3}$/.test(value);
}

export function normalizeHex(value) {
  let h = String(value).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return '#' + h.toUpperCase();
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }) {
  const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s; const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }) {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = l * 255; return { r: v, g: v, b: v }; }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

export function hexToHsl(hex) { return rgbToHsl(hexToRgb(hex)); }
export function hslToHex(hsl) { return rgbToHex(hslToRgb(hsl)); }

// Fase 2 — HSV/HSB (tono/saturación/brillo), el espacio que usa el área 2D del selector visual
// (`ColorPicker.jsx`): eje X = saturación, eje Y = brillo, con el tono fijado por el slider
// aparte — es el modelo estándar de los selectores "tipo Apple" (más intuitivo ahí que HSL,
// donde el 100% de luminosidad siempre da blanco puro sea cual sea la saturación). HSL se queda
// para los campos numéricos de la Fase 1 (siguen siendo válidos y algunas personas los prefieren
// para teclear un valor a mano) — ambos conviven, no se sustituyen.
export function rgbToHsv({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h;
  if (d === 0) h = 0;
  else if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

export function hsvToRgb({ h, s, v }) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1, g1, b1;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

export function hexToHsv(hex) { return rgbToHsv(hexToRgb(hex)); }
export function hsvToHex(hsv) { return rgbToHex(hsvToRgb(hsv)); }

// Fase 3 — "genera automáticamente una familia de colores compatibles a partir de uno solo"
// (apartado 9 de la especificación maestra, ejemplo literal: "🔵 azul elegido → 15-30 colores
// compatibles"). Esquema análogo (±35° de tono, misma saturación/brillo) — se eligió análogo en
// vez de complementario (+180°) porque para "Secundario"/"Terciario" de una marca, un tono
// cercano suele leerse como una familia coherente; un complementario a menudo choca visualmente
// en UI. Usado por `tokens.js` para derivar Secundario/Terciario del Principal cuando Josué no
// los ha personalizado a mano (ver DEFAULT_TEMA_PERSONALIZADO).
export function rotateHue(hex, degrees) {
  const { h, s, v } = hexToHsv(hex);
  let nuevoH = (h + degrees) % 360;
  if (nuevoH < 0) nuevoH += 360;
  return hsvToHex({ h: nuevoH, s, v });
}

// Mezcla lineal simple en sRGB entre dos colores (0 = hexA, 1 = hexB). Se usa para variantes
// secundarias derivadas de un tono base (bordes, divisores, texto terciario/deshabilitado) donde
// no hace falta la precisión perceptual de OKLCH — es una mezcla hacia el fondo del tema, no una
// escala de marca.
export function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
}

// ─────────────────────────────────────────────────────────────────────────
// OKLCH — espacio de color perceptualmente uniforme (apartado 6/9). Fórmulas de Björn Ottosson
// (dominio público, las mismas matrices que usa la especificación CSS Color 4). Se pasa siempre
// por sRGB lineal como paso intermedio, tal y como especifica el estándar.
// ─────────────────────────────────────────────────────────────────────────

function srgbChannelToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearChannelToSrgb(v) {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return s * 255;
}
function linearRgbToOklab({ r, g, b }) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}
function oklabToLinearRgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

// l: 0-1 (luminosidad perceptual), c: ~0-0.4 (croma/saturación), h: 0-360 (tono en grados).
export function hexToOklch(hex) {
  const rgb = hexToRgb(hex);
  const lin = { r: srgbChannelToLinear(rgb.r), g: srgbChannelToLinear(rgb.g), b: srgbChannelToLinear(rgb.b) };
  const lab = linearRgbToOklab(lin);
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.L, c, h };
}

// Recorta al espacio sRGB por clamping directo de canal (no hay gamut mapping perceptual
// completo — decisión explícita de alcance: un clamp simple es suficiente para que ningún
// L/C/H combination produzca un color imposible, aunque en tonos muy saturados en los extremos
// de la escala pueda perder algo de croma respecto al ideal matemático. Documentado, no oculto).
export function oklchToHex({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const lab = { L: l, a: Math.cos(hr) * c, b: Math.sin(hr) * c };
  const lin = oklabToLinearRgb(lab);
  const clampChannel = (v) => Math.min(255, Math.max(0, linearChannelToSrgb(v)));
  return rgbToHex({ r: clampChannel(lin.r), g: clampChannel(lin.g), b: clampChannel(lin.b) });
}

// ─────────────────────────────────────────────────────────────────────────
// Contraste WCAG (apartado 10) — luminancia relativa y ratio, fórmula estándar del W3C.
// ─────────────────────────────────────────────────────────────────────────

export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(srgbChannelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA), lb = relativeLuminance(hexB);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const CANDIDATO_TEXTO_OSCURO = '#0B0D11';
const CANDIDATO_TEXTO_CLARO = '#F5F6F8';

// Empuja `fgHex` hacia negro o blanco (el que ya tocaba, según si arrancó más oscuro o más claro
// que `bgHex`) en pasos pequeños de luminosidad OKLCH hasta alcanzar `minRatio` de contraste
// contra `bgHex`, o hasta tocar el extremo. Es la pieza que cumple "ajustar automáticamente
// variantes cuando sea seguro hacerlo" del apartado 10 — nunca deja un texto por debajo de AA
// (4.5:1) si hay margen matemático para evitarlo.
export function ensureContrast(fgHex, bgHex, minRatio = 4.5, maxSteps = 60) {
  let { l, c, h } = hexToOklch(fgHex);
  const bgL = hexToOklch(bgHex).l;
  // La dirección la decide EL FONDO, no el orden relativo entre los dos colores.
  //
  // Antes era `l <= bgL ? -1 : 1`: si el color de delante ya era más oscuro que el
  // de detrás, se oscurecía todavía más. Sobre un fondo oscuro eso es imposible de
  // resolver —lo empujaba hasta el negro puro y salía del bucle sin contraste—, y
  // era justo el caso de un acento casi negro en tema oscuro, o de un texto
  // personalizado casi negro sobre el fondo oscuro de la app.
  //
  // Sobre un fondo oscuro la única salida es aclarar; sobre uno claro, oscurecer.
  // Para los casos normales (texto claro sobre fondo oscuro, texto oscuro sobre
  // fondo claro) el resultado es exactamente el mismo que antes.
  const direction = bgL < 0.5 ? 1 : -1;
  let current = fgHex;
  for (let i = 0; i < maxSteps; i++) {
    if (contrastRatio(current, bgHex) >= minRatio) return current;
    l = Math.min(1, Math.max(0, l + direction * 0.015));
    current = oklchToHex({ l, c, h });
    if (l <= 0 || l >= 1) break;
  }
  return current;
}

// Elige entre un candidato casi-negro y uno casi-blanco cuál da más contraste sobre `bgHex`
// (nunca un color de texto derivado del propio acento — sería circular) y, si ni el mejor de
// los dos llega a `minRatio`, lo ajusta con `ensureContrast`. Esta es la función que resuelve el
// problema real que tenía la app antes de esta fase: el texto sobre botones de acento estaba
// fijo en `#080A0D` en ~20 sitios, así que un acento oscuro (ej. Grafito, Morado) podía quedar
// casi ilegible — ver CHANGELOG.md para el detalle de la migración.
export function bestReadableText(bgHex, minRatio = 4.5) {
  const cOscuro = contrastRatio(bgHex, CANDIDATO_TEXTO_OSCURO);
  const cClaro = contrastRatio(bgHex, CANDIDATO_TEXTO_CLARO);
  const mejor = cOscuro >= cClaro ? CANDIDATO_TEXTO_OSCURO : CANDIDATO_TEXTO_CLARO;
  const mejorRatio = Math.max(cOscuro, cClaro);
  if (mejorRatio >= minRatio) return mejor;
  return ensureContrast(mejor, bgHex, minRatio);
}

// ─────────────────────────────────────────────────────────────────────────
// Generación de escalas (apartado 9) — 11 pasos por color, perceptualmente uniformes en OKLCH
// (luminosidad objetivo fija por paso, no un aclarado/oscurecido hexadecimal ingenuo). El croma
// se reduce hacia los extremos porque un tono muy claro u oscuro no puede sostener el mismo
// croma que su versión media sin salirse del espacio de color visible.
// ─────────────────────────────────────────────────────────────────────────

export const PASOS_ESCALA = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LUMINOSIDAD_OBJETIVO_POR_PASO = {
  50: 0.97, 100: 0.94, 200: 0.87, 300: 0.79, 400: 0.70,
  600: 0.52, 700: 0.44, 800: 0.36, 900: 0.28, 950: 0.20,
};

export function generateScale(baseHex) {
  const base = hexToOklch(baseHex);
  const escala = {};
  for (const paso of PASOS_ESCALA) {
    if (paso === 500) { escala[500] = baseHex; continue; }
    const objetivoL = LUMINOSIDAD_OBJETIVO_POR_PASO[paso];
    const factorCroma = Math.max(0, 1 - Math.abs(objetivoL - base.l) * 0.6);
    escala[paso] = oklchToHex({ l: objetivoL, c: base.c * factorCroma, h: base.h });
  }
  return escala;
}

// ─────────────────────────────────────────────────────────────────────────
// Roles semánticos derivados del acento (apartado 8) — la pieza que conecta el motor con
// `tokens.js`. `base` son los tokens ya resueltos del tema activo (bg/surface/border/text/
// textMuted, tal y como vienen de COLORS_OSCURO/COLORS_CLARO) — los roles de "Base" (fondo,
// superficie, card...) y "Estados" (éxito/advertencia/error/información) NO se generan aquí:
// siguen siendo valores fijos y curados por tema en tokens.js, a propósito (un error rojo que
// cambiara con el acento del usuario sería una regresión de usabilidad, no una mejora). Lo que
// sí deriva del acento son: la escala de marca, texto legible sobre el acento, y los estados de
// interacción/efectos que ya dependían del acento de forma implícita (antes con `hexToRgba(accent,
// ...)` repetido en cada sitio de uso; ahora centralizado aquí una sola vez).
export function buildRolesFromAccent(accentHex, base) {
  const escala = generateScale(accentHex);
  return {
    textOnAccent: bestReadableText(accentHex),
    accentScale: escala,
    borderSecondary: mix(base.border, base.bg, 0.4),
    divider: mix(base.border, base.bg, 0.7),
    textTerciario: mix(base.textMuted, base.bg, 0.35),
    textDisabled: mix(base.textMuted, base.bg, 0.55),
    interactionHover: hexToRgba(accentHex, 0.10),
    interactionActive: hexToRgba(accentHex, 0.18),
    interactionFocus: hexToRgba(accentHex, 0.30),
    interactionSelected: hexToRgba(accentHex, 0.14),
    interactionDisabled: hexToRgba(base.textMuted, 0.14),
    effectGlow: `0 0 24px ${hexToRgba(accentHex, 0.35)}`,
    effectGradient: `linear-gradient(135deg, ${escala[400]}, ${escala[700]})`,
    effectShadow: 'rgba(0,0,0,0.35)',
    effectHighlight: 'rgba(255,255,255,0.06)',
  };
}
