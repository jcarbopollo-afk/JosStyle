// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 6 — El sistema "Recomendado".
//
// QUÉ HACE
// Coge la paleta que sacó el detector (Fase 5) y construye PROPUESTAS COMPLETAS
// de apariencia: principal, secundario, acento, textos, iconos, navegación,
// transparencias y overlay. No un color suelto — un tema entero (apartado 4).
//
// TRES REGLAS QUE MANDAN AQUÍ
//
// 1. RECOMENDAR NO ES IMPONER (apartados 11, 12 y 16, y regla 7 del proyecto).
//    Nada se aplica solo. Se proponen, se prueban, se aceptan o se descartan, y
//    volver atrás recupera EXACTAMENTE lo que había.
//
// 2. VARIAS PROPUESTAS, Y DE VERDAD DISTINTAS (apartados 3 y 8). El apartado 8
//    lo dice con un ejemplo: azul #123456, azul #123457 y azul #123458 no son
//    tres opciones, son una. Por eso cada propuesta parte de una ESTRATEGIA
//    cromática distinta, no de un retoque de la anterior.
//
// 3. NADA ILEGIBLE (apartado 7). Cada propuesta pasa por `ensureContrast` antes
//    de enseñarse. No sustituye a la Fase 9, pero ninguna propuesta puede salir
//    de aquí con texto que no se lea.
//
// SIN IA, otra vez. Son reglas de teoría del color sobre los colores reales de
// la foto — `colorEngine.js` ya sabe rotar tonos, medir contraste y generar
// escalas, así que aquí se usa, no se reinventa.
// ---------------------------------------------------------------------------
import { rotateHue, mix, contrastRatio, ensureContrast, hexToHsl, hslToHex, bestReadableText } from './colorEngine';
import { DEFAULT_TEMA_PERSONALIZADO, COLORS_OSCURO, COLORS_CLARO } from '../tokens';

/* ===========================================================================
   LAS ESTRATEGIAS (apartados 3, 5, 6 y 8)
   =========================================================================== */

/**
 * Cada estrategia es una MANERA DISTINTA de mirar la misma foto, no una
 * variación de la anterior. De ahí salen propuestas visualmente diferentes sin
 * tener que comprobar a posteriori que no se parecen.
 *
 * Los tres ejemplos del apartado 5 (foto azul → azul+azul claro / azul+naranja
 * complementario / azul desaturado+gris) se corresponden con las tres primeras.
 */
export const ESTRATEGIAS = [
  {
    id: 'equilibrada',
    nombre: 'Equilibrada',
    descripcion: 'Los colores de tu foto, tal cual.',
  },
  {
    id: 'contraste',
    nombre: 'Con contraste',
    descripcion: 'El color opuesto al de tu foto, para que destaque.',
  },
  {
    id: 'serena',
    nombre: 'Serena',
    descripcion: 'Los mismos colores, apagados. La foto manda.',
  },
  {
    id: 'intensa',
    nombre: 'Intensa',
    descripcion: 'Sube el color y la interfaz pesa más que la foto.',
  },
  {
    id: 'minimalista',
    nombre: 'Minimalista',
    descripcion: 'Casi todo neutro, con un solo toque de color.',
  },
];

// Cuánto se ve la foto en cada estrategia. No es decoración: una propuesta
// "serena" con las tarjetas opacas no es serena, es la de siempre.
const TRANSPARENCIA = {
  equilibrada: { superficie: 88, navegacion: 85, overlay: 12 },
  contraste: { superficie: 92, navegacion: 90, overlay: 20 },
  serena: { superficie: 78, navegacion: 76, overlay: 30 },
  intensa: { superficie: 95, navegacion: 94, overlay: 8 },
  minimalista: { superficie: 82, navegacion: 80, overlay: 24 },
};

/* ===========================================================================
   GENERAR
   =========================================================================== */

/**
 * Construye las propuestas a partir del análisis de la fotografía.
 *
 * Devuelve `{ posible, motivo, propuestas }`. Cuando no se puede recomendar se
 * dice por qué en vez de devolver algo inventado — mismo criterio que el
 * recomendador del armario (AR F4) y que el apartado 22 de aquella fase.
 *
 * `tema` es lo que Josué tiene ahora: se usa como red de seguridad cuando la
 * foto no da un color (una foto en blanco y negro no tiene acento, y su acento
 * actual es mejor candidato que uno inventado).
 *
 * `semilla` permite pedir OTRAS propuestas (apartado 13) sin que sean
 * aleatorias: desplaza los tonos de forma determinista, así que "generar otras"
 * da algo distinto pero igual de justificable, y la misma semilla da siempre lo
 * mismo — que es lo que hace que esto se pueda probar.
 */
export function generarPropuestas(analisis, tema, { semilla = 0, modoOscuro = true } = {}) {
  if (!analisis || !analisis.colores || analisis.colores.length === 0) {
    return { posible: false, motivo: 'sin_analisis', propuestas: [] };
  }

  const base = colorBase(analisis, tema);
  if (!base) return { posible: false, motivo: 'sin_color', propuestas: [] };

  const propuestas = ESTRATEGIAS.map((e) => construir(e, base, analisis, { semilla, modoOscuro }))
    .filter(Boolean);

  return { posible: propuestas.length > 0, motivo: null, propuestas };
}

/**
 * De qué color parte todo.
 *
 * El acento del análisis es el mejor candidato (es el color que DESTACA, no el
 * que más ocupa). Si la foto es monocromática no hay ninguno —y eso es un dato,
 * no un fallo, tal y como lo dejó la Fase 5— así que se conserva el acento que
 * Josué ya tenía: mejor su color que uno inventado.
 */
function colorBase(analisis, tema) {
  if (analisis.acento) return analisis.acento.hex;
  if (analisis.secundario) return analisis.secundario.hex;
  if (tema && tema.secundario) return tema.secundario;
  // Último recurso: el dominante, aunque sea neutro. Una propuesta gris sobre
  // una foto gris es coherente; no tener propuesta no ayuda a nadie.
  return analisis.dominante ? analisis.dominante.hex : null;
}

function construir(estrategia, base, analisis, { semilla, modoOscuro }) {
  const desplazamiento = semilla * 24;   // determinista, no aleatorio
  const { h, s, l } = hexToHsl(base);

  let principal;
  let secundario;

  switch (estrategia.id) {
    case 'equilibrada':
      // El color de la foto, y su vecino análogo. Es "la foto, tal cual".
      principal = rotateHue(base, desplazamiento);
      secundario = rotateHue(principal, 30);
      break;

    case 'contraste':
      // El complementario (apartado 5, propuesta B: azul + naranja).
      principal = rotateHue(base, 180 + desplazamiento);
      secundario = rotateHue(base, desplazamiento);
      break;

    case 'serena':
      // Mismos tonos, mucho menos saturados (apartado 5, propuesta C).
      principal = ajustar(base, { s: Math.max(12, s * 0.45), h: h + desplazamiento });
      secundario = ajustar(base, { s: Math.max(8, s * 0.3), h: h + 25 + desplazamiento });
      break;

    case 'intensa':
      principal = ajustar(base, { s: Math.min(92, Math.max(s, 55) * 1.25), l: equilibrar(l, modoOscuro), h: h + desplazamiento });
      secundario = rotateHue(principal, 150);
      break;

    case 'minimalista': {
      // Casi todo neutro y un solo toque de color: el toque es el acento, y el
      // resto sale del neutro que de verdad hay en la foto.
      const neutro = analisis.neutro ? analisis.neutro.hex : mix(base, base, 1);
      principal = ajustar(neutro, { s: Math.min(18, s) });
      secundario = rotateHue(base, desplazamiento);
      break;
    }

    default:
      return null;
  }

  const t = TRANSPARENCIA[estrategia.id] || TRANSPARENCIA.equilibrada;

  // Apartado 7 — el contraste se comprueba ANTES de enseñar la propuesta, no
  // después. El fondo efectivo es el de la app, no el de la foto: la foto queda
  // por detrás de tarjetas translúcidas, así que lo que decide la legibilidad es
  // el color de superficie.
  // Los fondos base salen de `tokens.js`, no copiados a mano: si algún día
  // cambian, el recomendador se entera solo y no queda comprobando el contraste
  // contra un color que ya no es el de la app (regla 2).
  const fondoEfectivo = modoOscuro ? COLORS_OSCURO.bg : COLORS_CLARO.bg;
  const acentoSeguro = ensureContrast(principal, fondoEfectivo, 3);

  return {
    id: `${estrategia.id}-${semilla}`,
    estrategia: estrategia.id,
    nombre: estrategia.nombre,
    descripcion: estrategia.descripcion,
    // El acento va aparte del tema porque en esta app el "Principal" es el
    // `accent` de `ajustes`, no un campo de `temaPersonalizado`. Aplicar una
    // propuesta toca los dos, y por eso viajan juntos.
    accent: acentoSeguro,
    tema: {
      ...DEFAULT_TEMA_PERSONALIZADO,
      secundario: ensureContrast(secundario, fondoEfectivo, 3),
      terciario: rotateHue(acentoSeguro, -35),
      superficieAlfa: t.superficie,
      navegacionAlfa: t.navegacion,
    },
    // El overlay es del FONDO, no del tema: son dos sitios distintos (FO F4,
    // apartado 16), y por eso la propuesta lo devuelve por separado en vez de
    // meterlo donde no vive.
    overlay: { color: '', intensidad: t.overlay },
    // Para poder enseñar la propuesta sin aplicarla (apartado 9).
    muestras: [acentoSeguro, ensureContrast(secundario, fondoEfectivo, 3), rotateHue(acentoSeguro, -35)],
    contraste: Number(contrastRatio(acentoSeguro, fondoEfectivo).toFixed(2)),
    textoSobreAcento: bestReadableText(acentoSeguro),
  };
}

/** Cambia solo lo que se le pide de un color, en HSL. */
function ajustar(hex, cambios) {
  const actual = hexToHsl(hex);
  return hslToHex({
    h: ((cambios.h ?? actual.h) % 360 + 360) % 360,
    s: Math.min(100, Math.max(0, cambios.s ?? actual.s)),
    l: Math.min(100, Math.max(0, cambios.l ?? actual.l)),
  });
}

/**
 * Lleva una luminosidad a la zona en que un color funciona como acento.
 *
 * Demasiado oscuro sobre fondo oscuro no se ve; demasiado claro sobre fondo
 * claro tampoco. Esto lo acerca al rango útil ANTES de que `ensureContrast`
 * tenga que corregirlo a la fuerza — corregir a la fuerza funciona, pero cambia
 * el color más de lo necesario y se aleja del de la foto.
 */
function equilibrar(l, modoOscuro) {
  if (modoOscuro) return Math.min(72, Math.max(45, l));
  return Math.min(55, Math.max(28, l));
}

/* ===========================================================================
   PROBAR, APLICAR Y VOLVER (apartados 10, 11 y 12)
   =========================================================================== */

/**
 * Guarda lo que Josué tiene AHORA, para poder volver exactamente a ello.
 *
 * El apartado 12 pide restaurar "exactamente la apariencia anterior" y no perder
 * la configuración personalizada. La forma de garantizarlo no es acordarse de
 * deshacer cada cambio: es hacer una copia antes de tocar nada y restaurarla
 * entera. Lo mismo que hace el editor de fotos de la Fase 3 con su borrador.
 */
export function guardarApariencia({ accent, tema, overlay }) {
  return {
    accent,
    tema: JSON.parse(JSON.stringify(tema || DEFAULT_TEMA_PERSONALIZADO)),
    overlay: JSON.parse(JSON.stringify(overlay || { color: '', intensidad: 0 })),
  };
}

/**
 * Apartado 10 — lo que hay que cambiar para aplicar una propuesta.
 *
 * Devuelve las tres piezas por separado porque viven en tres sitios distintos
 * (`ajustes.accent`, `temaPersonalizado`, `apariencia.fondo.overlay`) y mezclarlas
 * aquí obligaría a desmezclarlas fuera.
 *
 * **No toca la fotografía.** Ni la ruta, ni el encuadre, ni el zoom, ni el
 * desenfoque: el apartado lo pide expresamente ("se mantienen los ajustes de la
 * fotografía"), y aquí sale gratis porque esta función ni siquiera los recibe.
 */
export function aplicarPropuesta(propuesta) {
  if (!propuesta) return null;
  return {
    accent: propuesta.accent,
    tema: { ...propuesta.tema },
    overlay: { ...propuesta.overlay },
  };
}

/** ¿Dos propuestas son suficientemente distintas? (apartado 8) */
export function sonDistintas(a, b, minimo = 12) {
  if (!a || !b) return true;
  const da = Math.abs(hexToHsl(a.accent).h - hexToHsl(b.accent).h);
  const distanciaTono = da > 180 ? 360 - da : da;
  const distanciaSat = Math.abs(hexToHsl(a.accent).s - hexToHsl(b.accent).s);
  const distanciaAlfa = Math.abs(a.tema.superficieAlfa - b.tema.superficieAlfa);
  return distanciaTono >= minimo || distanciaSat >= minimo || distanciaAlfa >= 6;
}
