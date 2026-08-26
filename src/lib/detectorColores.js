// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 5 — Detector de colores de la fotografía.
//
// TODO OCURRE EN EL DISPOSITIVO (apartado 19)
// La foto de Josué no sale de su teléfono. El análisis es aritmética sobre los
// píxeles de un `<canvas>`: ni IA, ni servicio externo, ni una petición. Es lo
// que pide el apartado 19 y también la regla 7 del proyecto.
//
// FRECUENCIA ≠ UTILIDAD (apartados 4 y 8)
// Es la idea que gobierna este archivo entero. El color que más superficie ocupa
// suele ser el peor candidato a acento: en una foto nocturna es "casi negro", y
// en una de playa, "casi blanco". Lo interesante suele ser ese pequeño azul
// eléctrico que ocupa el 2 % — el apartado 8 lo dice con ese ejemplo exacto.
//
// Por eso cada color detectado lleva DOS números distintos: `peso` (cuánta
// superficie ocupa) e `interes` (cuánto destaca). Ninguno de los dos manda solo;
// la Fase 6 decidirá cómo combinarlos.
//
// ESTA FASE NO CAMBIA NINGÚN COLOR (apartado 15)
// Detectar no es aplicar. Si Josué tiene una foto azul y una paleta roja, al
// analizar la foto se genera "paleta detectada: azul…" y su paleta roja **se
// queda como está**. Decidir es la Fase 6.
//
// SEPARADO DE `colorEngine.js` A PROPÓSITO
// `colorEngine` sabe de color (HSL, OKLCH, contraste, escalas) y lo sigue
// sabiendo él solo: aquí se importa, no se reimplementa. Lo que hay en este
// archivo es lo otro — sacar colores de una imagen y clasificarlos.
// ---------------------------------------------------------------------------
import { rgbToHex, rgbToHsl, hexToHsl, relativeLuminance, contrastRatio } from './colorEngine';

/* ===========================================================================
   PARÁMETROS
   =========================================================================== */

// El análisis se hace sobre una miniatura, no sobre la foto entera (apartado 10).
// 96 px de lado largo son ~9.000 píxeles: suficientes para que los colores
// dominantes salgan estables, y lo bastante poco como para no bloquear un iPhone.
// La fotografía original no se toca.
export const LADO_ANALISIS = 96;

// Los colores se agrupan en una rejilla de 4×4×4 por canal (64 cajas). Menos
// cajas funde colores distintos; más las separa tanto que el mismo azul con dos
// iluminaciones cuenta como dos colores.
const NIVELES = 4;

export const MAX_COLORES = 6;

/* ===========================================================================
   CLASIFICACIÓN (apartados 5, 6 y 7)
   =========================================================================== */

export const TONOS = ['oscuro', 'medio', 'claro'];

/** Apartado 5 — claro, medio u oscuro, por luminancia percibida. */
export function tonoDe(hex) {
  const l = relativeLuminance(hex);
  if (l < 0.18) return 'oscuro';
  if (l > 0.6) return 'claro';
  return 'medio';
}

export const SATURACIONES = ['neutro', 'apagado', 'moderado', 'vivo'];

// ⚠️ `rgbToHsl`/`hexToHsl` de `colorEngine.js` devuelven `s` y `l` en 0-100, NO en
// 0-1. Se normaliza aquí, en un solo sitio, en vez de recordarlo en cada uso: con
// los umbrales en la escala equivocada, TODO color con más de 0,6 % de saturación
// salía como "vivo" y solo un gris exacto contaba como neutro — la clasificación
// entera habría sido inútil sin dar ningún error. Lo cazó la prueba del acento
// de la propia app (#5C7E9A, s = 25,2).
const satDe = (hex) => hexToHsl(hex).s / 100;

/** Apartado 6 — cuánta vida tiene el color. */
export function saturacionDe(hex) {
  const s = satDe(hex);
  if (s < 0.1) return 'neutro';
  if (s < 0.3) return 'apagado';
  if (s < 0.6) return 'moderado';
  return 'vivo';
}

/** Apartado 7 — blancos, negros, grises y lo que se les parece. */
export const esNeutro = (hex) => satDe(hex) < 0.12;

/* ===========================================================================
   EXTRACCIÓN
   =========================================================================== */

/**
 * Analiza los píxeles ya leídos de una imagen.
 *
 * Recibe un array plano RGBA (lo que devuelve `ctx.getImageData().data`) para que
 * esta función sea PURA y se pueda probar con Node sin navegador. Quien la llama
 * se encarga del `<canvas>`; ver `analizarImagen` más abajo.
 *
 * `ancho` y `alto` hacen falta para el apartado 9: saber DÓNDE aparece cada
 * color, no solo cuánto.
 */
export function analizarPixeles(datos, ancho, alto) {
  if (!datos || !datos.length || !ancho || !alto) return paletaVacia();

  const cajas = new Map();
  const total = ancho * alto;

  for (let i = 0; i < datos.length; i += 4) {
    const a = datos[i + 3];
    // Un píxel transparente no es un color de la foto: es un agujero. Contarlo
    // metería un falso negro en toda imagen con transparencia.
    if (a < 125) continue;

    const r = datos[i], g = datos[i + 1], b = datos[i + 2];
    const clave = `${cajaDe(r)}-${cajaDe(g)}-${cajaDe(b)}`;
    const caja = cajas.get(clave) || { r: 0, g: 0, b: 0, n: 0, arriba: 0, centro: 0, abajo: 0 };

    caja.r += r; caja.g += g; caja.b += b; caja.n += 1;

    // Apartado 9 — en qué tercio vertical cae el píxel.
    const fila = Math.floor((i / 4) / ancho);
    if (fila < alto / 3) caja.arriba += 1;
    else if (fila < (alto * 2) / 3) caja.centro += 1;
    else caja.abajo += 1;

    cajas.set(clave, caja);
  }

  if (cajas.size === 0) return paletaVacia();

  // El color de cada caja es la MEDIA de sus píxeles, no el centro de la caja:
  // así el color que sale es uno que de verdad está en la foto, no una
  // aproximación al centro de una rejilla arbitraria.
  const colores = [...cajas.values()].map((c) => {
    const hex = rgbToHex({ r: Math.round(c.r / c.n), g: Math.round(c.g / c.n), b: Math.round(c.b / c.n) });
    // Mismo aviso de escala que arriba: `rgbToHsl` devuelve 0-100.
    const hsl = rgbToHsl({ r: Math.round(c.r / c.n), g: Math.round(c.g / c.n), b: Math.round(c.b / c.n) });
    const s = hsl.s / 100;
    const l = hsl.l / 100;
    const peso = c.n / total;
    return {
      hex,
      peso: Number(peso.toFixed(4)),
      saturacionValor: Number(s.toFixed(3)),
      luminosidad: Number(l.toFixed(3)),
      tono: tonoDe(hex),
      saturacion: saturacionDe(hex),
      neutro: esNeutro(hex),
      // Apartado 9: dónde vive, en proporción de sus propios píxeles.
      zona: zonaDominante(c),
      // Apartado 8 — LO IMPORTANTE. Un color que ocupa poco pero destaca mucho
      // puede ser mejor acento que el gris que llena la foto. `interes` combina
      // saturación (destaca por color) con lo lejos que está de la media de la
      // imagen (destaca por contraste), y solo después se pondera por superficie
      // —con raíz, para que ocupar mucho ayude pero no decida.
      interes: 0,
    };
  });

  // La media de la foto hace falta para saber qué se sale de ella.
  const medio = mediaPonderada(colores);
  for (const c of colores) {
    // Sin color medio no hay contra qué medir el contraste; entonces solo cuenta
    // la saturación, en vez de reventar o inventar una referencia.
    const contraste = medio ? contrastRatio(c.hex, medio) : 0;
    c.interes = Number((
      (c.saturacionValor * 0.55 + Math.min(contraste / 8, 1) * 0.45) * Math.sqrt(c.peso)
    ).toFixed(4));
  }

  const ordenados = [...colores].sort((a, b) => b.peso - a.peso);
  return estructurar(ordenados.slice(0, MAX_COLORES * 3), medio);
}

const cajaDe = (v) => Math.min(NIVELES - 1, Math.floor((v / 256) * NIVELES));

function zonaDominante(c) {
  const { arriba, centro, abajo } = c;
  if (arriba >= centro && arriba >= abajo) return 'arriba';
  if (abajo >= centro && abajo >= arriba) return 'abajo';
  return 'centro';
}

function mediaPonderada(colores) {
  let r = 0, g = 0, b = 0, p = 0;
  for (const c of colores) {
    const { r: cr, g: cg, b: cb } = hexARgb(c.hex);
    r += cr * c.peso; g += cg * c.peso; b += cb * c.peso; p += c.peso;
  }
  // Si los pesos no suman nada, el color medio es el primero que se detectó, no un
  // gris inventado: un color que SÍ está en la foto siempre es mejor referencia que
  // uno que no. (Y de paso no hay un hex suelto fuera de `tokens.js`, regla 2.)
  if (!p) return colores[0]?.hex || null;
  return rgbToHex({ r: Math.round(r / p), g: Math.round(g / p), b: Math.round(b / p) });
}

function hexARgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/* ===========================================================================
   PALETA ESTRUCTURADA (apartado 4)
   =========================================================================== */

/**
 * Convierte la lista cruda en los seis papeles del apartado 4.
 *
 * Cada papel se elige por lo que ese papel necesita, no por frecuencia:
 *
 *   · dominante   → el que más superficie ocupa. Aquí sí manda la frecuencia:
 *                   es literalmente "de qué color es la foto".
 *   · acento      → el de más INTERÉS, aunque ocupe poco (apartado 8).
 *   · secundario  → el siguiente más interesante que no se parezca al acento;
 *                   dos colores casi iguales no son una paleta.
 *   · neutro      → el neutro de más peso, para superficies y texto (apartado 7).
 *   · claro / oscuro → los extremos, para saber entre qué se puede leer.
 *
 * Cualquiera puede ser `null` si la foto no lo tiene, y eso es información
 * honesta: una foto en blanco y negro **no tiene** acento, y decir que sí sería
 * inventarlo.
 */
function estructurar(colores, medio) {
  if (!colores.length) return paletaVacia();

  const porPeso = [...colores].sort((a, b) => b.peso - a.peso);
  const porInteres = [...colores].sort((a, b) => b.interes - a.interes);

  const dominante = porPeso[0] || null;
  // El acento tiene que tener algo de color: un gris "interesante" no es un acento.
  const acento = porInteres.find((c) => !c.neutro) || null;
  const secundario = acento
    ? porInteres.find((c) => c !== acento && !c.neutro && distanciaTono(c.hex, acento.hex) > 25) || null
    : null;
  const neutro = porPeso.find((c) => c.neutro) || null;
  const claro = [...colores].sort((a, b) => b.luminosidad - a.luminosidad)[0] || null;
  const oscuro = [...colores].sort((a, b) => a.luminosidad - b.luminosidad)[0] || null;

  return {
    // Los colores que se enseñan (apartado 12), de más a menos superficie.
    colores: porPeso.slice(0, MAX_COLORES),
    dominante,
    acento,
    secundario,
    neutro,
    claro,
    oscuro,
    medio,
    // Apartado 18 — una foto en blanco y negro NO es un error: es una paleta
    // neutra, y decirlo permite que la Fase 6 busque un acento por otro lado.
    monocromatica: porPeso.every((c) => c.neutro),
    // Apartado 17 — con muy pocos colores útiles se avisa, en vez de fingir.
    suficiente: porPeso.length >= 2,
    analizadaEn: new Date().toISOString(),
  };
}

/** Distancia entre dos tonos en el círculo cromático, de 0 a 180. */
function distanciaTono(a, b) {
  const d = Math.abs(hexToHsl(a).h - hexToHsl(b).h);
  return d > 180 ? 360 - d : d;
}

function paletaVacia() {
  return {
    colores: [], dominante: null, acento: null, secundario: null, neutro: null,
    claro: null, oscuro: null, medio: null, monocromatica: false, suficiente: false,
    analizadaEn: new Date().toISOString(),
  };
}

/* ===========================================================================
   EL PUENTE CON EL NAVEGADOR (apartados 2, 10 y 20)
   =========================================================================== */

/**
 * Analiza una imagen desde su URL, reduciéndola primero.
 *
 * Es la única función de este archivo que toca el DOM, y por eso está sola y al
 * final: todo lo de arriba se prueba con Node. Devuelve `null` si algo falla —una
 * imagen que no carga, un canvas bloqueado por CORS— en vez de lanzar, porque no
 * poder analizar una foto no debe romper la pantalla de Ajustes.
 */
export async function analizarImagen(url) {
  if (typeof document === 'undefined' || !url) return null;
  try {
    const img = await cargarImagen(url);
    const escala = LADO_ANALISIS / Math.max(img.naturalWidth, img.naturalHeight, 1);
    const ancho = Math.max(1, Math.round(img.naturalWidth * Math.min(escala, 1)));
    const alto = Math.max(1, Math.round(img.naturalHeight * Math.min(escala, 1)));

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, ancho, alto);

    // `getImageData` lanza si el canvas está "manchado" por una imagen de otro
    // origen sin CORS. Las URLs firmadas de Supabase lo permiten, pero si algún
    // día no, esto devuelve null en vez de reventar.
    const { data } = ctx.getImageData(0, 0, ancho, alto);
    return analizarPixeles(data, ancho, alto);
  } catch {
    return null;
  }
}

function cargarImagen(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/* ===========================================================================
   CACHÉ Y ASOCIACIÓN (apartados 13 y 14)
   =========================================================================== */

/**
 * ¿El análisis guardado corresponde a ESTA fotografía?
 *
 * Apartado 13, y es la comprobación que evita el fallo más fácil de esta fase:
 * cambiar de foto y seguir enseñando la paleta de la anterior. El análisis se
 * marca con el id de su foto; si no coinciden, no vale.
 */
export function analisisValidoPara(analisis, foto) {
  if (!analisis || !foto || !foto.id) return false;
  return analisis.fotoId === foto.id;
}

/** Sella un análisis con la foto a la que pertenece, para poder comprobarlo luego. */
export const sellarAnalisis = (analisis, foto) =>
  (analisis ? { ...analisis, fotoId: foto?.id || '' } : null);

/**
 * Apartado 12 — cómo se enseña un color detectado.
 *
 * Devuelve el texto que acompaña a la muestra. Describe lo que el color ES, sin
 * prometer qué se hará con él: aplicarlo es la Fase 6.
 */
export function describirColor(color) {
  if (!color) return '';
  const partes = [];
  if (color.neutro) partes.push('neutro');
  else partes.push(color.saturacion === 'vivo' ? 'muy vivo' : color.saturacion);
  partes.push(color.tono);
  const pct = Math.round(color.peso * 100);
  partes.push(pct >= 1 ? `${pct} % de la foto` : 'menos del 1 %');
  return partes.join(' · ');
}
