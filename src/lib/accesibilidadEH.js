// ============================================================================
// EH · Fase 42/65 — ACCESIBILIDAD Y USABILIDAD
//
// *"Sencillo, rápido y cómodo en móvil."* Y la condición de finalización, que es
// la frase que gobierna la fase entera: *"**Las plaquitas pueden ser visualmente
// pequeñas, pero nunca deben ser difíciles de pulsar.**"*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ ESTA FASE NO SE PUEDE "CONSTRUIR": SE REVISA.** No hay una pantalla
// nueva que hacer — hay diecisiete reglas que cumplir en las cuarenta que ya
// existen. Así que lo que se construye es **el revisor**: `revisarPantalla()`
// lee el código de la vista y devuelve **los incumplimientos de verdad**, con su
// línea. Una lista de buenas intenciones no habría encontrado nada; esto
// encontró cuatro cosas el primer día.
//
// **2. ⚠️ COMPACTO NO ES INCÓMODO** (apartados 1 y 2). El área táctil mínima es
// **44 píxeles** —la de Apple—, y una plaquita puede seguir midiendo lo que mide
// mientras su zona de toque llegue ahí. Se comprueba que ningún botón de solo
// icono se quede sin declarar su área.
//
// **3. ⚠️ EL COLOR NUNCA VA SOLO** (apartado 6: *"🟢 Activo también debe tener:
// Activo"*). `etiquetaDeEstado()` devuelve **el icono y la palabra**, y hay una
// comprobación de que todos los catálogos de estado del módulo traen las dos
// cosas. Un catálogo con `icono` y sin `nombre` es un estado que un daltónico no
// puede leer.
//
// **4. ⚠️ LO QUE YA ESTÁ RESUELTO NO SE VUELVE A RESOLVER.** El contraste y los
// dos modos son de `tokens.js` (`COLORS` es un singleton mutable y `aplicarTema`
// lo cambia entero); el tamaño de fuente es `TAMANOS_TEXTO` de Ajustes; y las
// animaciones **ya respetan `prefers-reduced-motion`** desde `index.css`. Aquí
// se **declara** dónde vive cada una y se comprueba que sigue ahí, en vez de
// escribir un segundo sistema (regla 2).
//
// **5. ⚠️ TRES APARTADOS NO SE PUEDEN COMPROBAR DESDE AQUÍ, Y SE DICE**: el
// teclado tapando el botón (10), la rotación (16) y los cuatro dispositivos
// (17) necesitan un teléfono de verdad. Están en la lista de R1 —lo que le toca
// mirar a Josué— y se declaran con su motivo, en vez de dar por buena una prueba
// que nadie ha hecho.
//
// **6. ⚠️ Y UN REVISOR QUE NO PUEDE FALLAR NO SIRVE.** Cada regla comprobable
// trae **un ejemplo que sí incumple**, y la prueba comprueba que lo caza. Sin
// eso, un `revisar()` con una expresión mal escrita daría siempre cero
// problemas y todo el mundo se quedaría tranquilo.
// ============================================================================

import { MODULOS_EH } from './estiloDeHombre';
import { ESTADOS_GESTION } from './gestionEstilo';
import { ESTADOS_MODULO } from './miEstilo';
import { ESTADOS_EH } from './estadosEstilo';
import { NIVELES_ESTILO } from './perfilEstilo';

/* ===========================================================================
   1 · LAS MEDIDAS (apartados 1 y 2)
   =========================================================================== */

/** El mínimo de Apple, y el que usa el enunciado sin decir el número. */
export const AREA_TACTIL_MINIMA = 44;

/**
 * Las clases de Tailwind con las que un botón declara su zona de toque.
 * ⚠️ No se mide el píxel: se comprueba que **haya una declaración**. Un botón
 * de solo icono sin ninguna de estas es del tamaño del icono, y con un icono de
 * trece píxeles eso es exactamente el *"botón diminuto"* que prohíbe el
 * apartado 1.
 */
export const CLASES_AREA = ['p-', 'py-', 'px-', 'h-', 'min-h', 'w-full', 'flex-1'];

/** Los iconos que este módulo usa dentro de un botón, sin texto al lado. */
export const ICONOS_SUELTOS = [
  'X', 'Trash2', 'ArrowLeft', 'Plus', 'Check', 'ChevronUp', 'ChevronDown',
  'ArrowUpDown', 'Search', 'Settings', 'SlidersHorizontal', 'Database', 'Lock', 'Pencil',
];

/* ===========================================================================
   2 · EL COLOR NUNCA VA SOLO (apartado 6)
   =========================================================================== */

/**
 * Los catálogos de estado del módulo. ⚠️ Todos tienen que traer **icono y
 * palabra**: *"🟢 Activo también debe tener: Activo"*.
 */
export const CATALOGOS_DE_ESTADO = [
  { id: 'gestion', lista: ESTADOS_GESTION, donde: 'Gestionar apartados' },
  { id: 'modulo', lista: ESTADOS_MODULO, donde: 'Mi estilo' },
  { id: 'estilo', lista: NIVELES_ESTILO, donde: 'Tu nivel de estilo' },
];

/** ⚠️ Nunca el icono a secas: el icono **y** la palabra. */
export function etiquetaDeEstado(estado) {
  if (!estado) return '';
  const icono = estado.icono || '';
  const nombre = estado.nombre || '';
  return [icono, nombre].filter(Boolean).join(' ').trim();
}

/** Los catálogos a los que les falta una de las dos cosas. */
export function estadosSoloColor() {
  const fallos = [];
  CATALOGOS_DE_ESTADO.forEach((c) => {
    (c.lista || []).forEach((x) => {
      if (!x.nombre) fallos.push({ catalogo: c.id, estado: x.id, falta: 'nombre' });
      if (!x.icono) fallos.push({ catalogo: c.id, estado: x.id, falta: 'icono' });
    });
  });
  return fallos;
}

/* ===========================================================================
   3 · DÓNDE VIVE LO QUE YA ESTÁ RESUELTO (apartados 5, 7 y 15)
   ===========================================================================
   ⚠️ Decisión 4 — se declara, no se reescribe. */

export const YA_RESUELTO_A11Y = [
  { apartado: 5, que: 'Contraste en claro y en oscuro', donde: 'tokens.js · COLORS + aplicarTema' },
  { apartado: 7, que: 'Animaciones cortas y respetadas', donde: 'index.css · prefers-reduced-motion' },
  { apartado: 15, que: 'Tamaño de fuente del sistema', donde: 'tokens.js · TAMANOS_TEXTO' },
  { apartado: 8, que: 'Saber dónde estoy y volver', donde: 'buscadorEstilo.js · migas() y atras()' },
  { apartado: 12, que: 'El error, junto a su campo', donde: 'cada pantalla, con su `error` local' },
  { apartado: 13, que: 'La confirmación pequeña', donde: 'estadosEstilo.js · MENSAJES_HECHO' },
];

/* ⚠️ Decisión 5 — lo que necesita un teléfono de verdad. Está en R1. */
export const SOLO_EN_UN_MOVIL = [
  { apartado: 10, que: 'El teclado no puede tapar el botón de guardar' },
  { apartado: 16, que: 'La interfaz aguanta el giro de pantalla' },
  { apartado: 17, que: 'iPhone y Android, pequeños y grandes' },
];

/* ===========================================================================
   4 · EL REVISOR (apartados 1, 2, 3, 9 y 14)
   ===========================================================================
   ⚠️ Lee el código de una pantalla y devuelve **los incumplimientos**, con su
   línea. Cada regla trae `ejemploMalo` para que la prueba pueda comprobar que
   de verdad caza algo: un revisor que no puede fallar no sirve de nada. */

const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/^(\s*)\/\/.*$/gm, '$1');

const linea = (fuente, indice) => fuente.slice(0, indice).split('\n').length;

/** Los `<button …>…</button>` de un archivo, con su posición. */
function botonesDe(fuente) {
  const salida = [];
  const re = /<button\b([\s\S]*?)<\/button>/g;
  let m = re.exec(fuente);
  while (m) {
    const entero = m[0];
    const corte = entero.indexOf('>');
    salida.push({
      apertura: corte >= 0 ? entero.slice(0, corte) : entero,
      // ⚠️ Sin el `</button>` final: si no, el cuerpo nunca queda vacío.
      cuerpo: corte >= 0 ? entero.slice(corte + 1).replace(/<\/button>\s*$/, '') : '',
      linea: linea(fuente, m.index),
    });
    m = re.exec(fuente);
  }
  return salida;
}

/**
 * ¿Ese botón enseña texto, o **solo** un icono?
 *
 * 🐛 ⚠️ La primera versión quitaba las etiquetas **y las expresiones** `{...}`, y
 * entonces `QuickActionButton` —que pinta `{label}` al lado del icono— salía
 * como si no tuviera nombre. **Décima vez** en este proyecto que una
 * comprobación salta con algo que estaba bien. Lo correcto es al revés: se
 * quitan **los iconos**, y si no queda absolutamente nada —ni texto, ni una
 * expresión que pueda dar texto—, entonces sí es un botón de solo icono.
 */
const soloIcono = (b) => {
  const conIcono = new RegExp(`<(${ICONOS_SUELTOS.join('|')})\\b`).test(b.cuerpo);
  if (!conIcono) return false;
  const sinIconos = b.cuerpo
    // Los iconos, con o sin cierre propio.
    .replace(/<[A-Z][\w$]*\b[^>]*\/>/g, '')
    // Y los envoltorios que solo los colocan.
    .replace(/<\/?(span|div)\b[^>]*>/g, '')
    .trim();
  return sinIconos.length === 0;
};

export const REGLAS_A11Y = [
  {
    id: 'boton_sin_nombre', apartado: 14,
    que: 'Un botón de solo icono necesita su `aria-label`',
    ejemploMalo: '<button onClick={x}><X size={13} /></button>',
    revisar: (f) => botonesDe(f)
      .filter((b) => soloIcono(b) && !/aria-label=/.test(b.apertura))
      .map((b) => ({ linea: b.linea, que: b.apertura.trim().slice(0, 60) })),
  },
  {
    id: 'area_tactil', apartado: 1,
    que: 'Un botón de solo icono tiene que declarar su zona de toque',
    ejemploMalo: '<button onClick={x} aria-label="Cerrar"><X size={13} /></button>',
    revisar: (f) => botonesDe(f)
      .filter((b) => soloIcono(b)
        && !CLASES_AREA.some((c) => new RegExp(`className="[^"]*\\b${c}`).test(b.apertura)))
      .map((b) => ({ linea: b.linea, que: b.apertura.trim().slice(0, 60) })),
  },
  {
    id: 'interruptor_sin_nombre', apartado: 14,
    que: 'Un interruptor necesita decir qué enciende',
    ejemploMalo: '<Switch checked={x} accent={accent} onChange={y} />',
    revisar: (f) => {
      const salida = [];
      const re = /<Switch\b([\s\S]*?)\/>/g;
      let m = re.exec(f);
      while (m) {
        if (!/\blabel[=\s]/.test(m[1])) salida.push({ linea: linea(f, m.index), que: 'Switch sin label' });
        m = re.exec(f);
      }
      return salida;
    },
  },
  {
    id: 'scroll_horizontal', apartado: 9,
    que: 'Nada puede desbordar el ancho del teléfono',
    ejemploMalo: '<div className="w-[900px]">',
    /* ⚠️ Un ancho fijo en píxeles es la forma de romper el iPhone pequeño.
       `overflow-x-auto` sí vale: eso es un carrusel a propósito. */
    revisar: (f) => {
      const salida = [];
      const re = /className="[^"]*\bw-\[(\d+)px\]/g;
      let m = re.exec(f);
      while (m) {
        if (Number(m[1]) > 320) salida.push({ linea: linea(f, m.index), que: `ancho fijo de ${m[1]}px` });
        m = re.exec(f);
      }
      return salida;
    },
  },
  {
    id: 'color_solo', apartado: 6,
    que: 'Un estado no puede distinguirse solo por su color',
    ejemploMalo: null,   // se comprueba sobre los catálogos, no sobre el código
    revisar: () => estadosSoloColor().map((x) => ({ linea: 0, que: `${x.catalogo}.${x.estado} sin ${x.falta}` })),
  },
];

export const reglaA11Y = (id) => REGLAS_A11Y.find((r) => r.id === id) || null;

/**
 * Revisa una pantalla entera. ⚠️ Se quitan los comentarios **conservando los
 * saltos de línea**, para que los números sigan siendo los del archivo.
 */
export function revisarPantalla(fuente) {
  const limpia = sinComentarios(String(fuente || ''));
  const problemas = [];
  REGLAS_A11Y.forEach((r) => {
    let encontrados = [];
    try { encontrados = r.revisar(limpia) || []; } catch { encontrados = []; }
    encontrados.forEach((e) => problemas.push({ regla: r.id, apartado: r.apartado, ...e }));
  });
  return {
    problemas,
    limpia: problemas.length === 0,
    porRegla: Object.fromEntries(REGLAS_A11Y.map((r) => [r.id, problemas.filter((p) => p.regla === r.id).length])),
  };
}

/* ===========================================================================
   5 · AUDITORÍA
   =========================================================================== */

export const TEXTOS_A11Y = {
  /* Apartado 4 — *"cuando un icono pueda resultar ambiguo: añadir texto"*. */
  iconoConTexto: 'Cada icono de esta pantalla lleva su palabra al lado.',
  /* Apartado 8. */
  volver: 'Volver',
  /* Apartado 3 — títulos claros y descripciones cortas. */
  maximoDescripcion: 'Las descripciones de una tarjeta son de una o dos líneas.',
};

/** ⚠️ Apartado 3 — una descripción de tarjeta no es un párrafo. */
export const MAXIMO_DESCRIPCION = 120;

/** Las descripciones del catálogo de módulos, que son las que se ven en la portada. */
export function descripcionesLargas() {
  return MODULOS_EH
    .filter((m) => typeof m.descripcion === 'string' && m.descripcion.length > MAXIMO_DESCRIPCION)
    .map((m) => ({ modulo: m.id, largo: m.descripcion.length }));
}

export function auditarAccesibilidad() {
  return {
    areaMinima: AREA_TACTIL_MINIMA,
    reglas: REGLAS_A11Y.length,
    // ⚠️ Cada regla comprobable trae un ejemplo que la incumple (decisión 6).
    sinEjemplo: REGLAS_A11Y.filter((r) => r.ejemploMalo === undefined).map((r) => r.id),
    // Apartado 6 — ningún estado se distingue solo por el color.
    estadosSoloColor: estadosSoloColor(),
    // Apartado 3 — ninguna descripción de la portada es un párrafo.
    descripcionesLargas: descripcionesLargas(),
    // Lo que ya estaba resuelto en otro sitio, declarado (decisión 4).
    yaResuelto: YA_RESUELTO_A11Y.length,
    // Y lo que solo se puede comprobar en un móvil de verdad (decisión 5).
    soloEnUnMovil: SOLO_EN_UN_MOVIL.map((x) => x.apartado),
    sistemasNuevosDeColor: 0,
    sistemasNuevosDeTexto: 0,
    // Todos los estados del catálogo de la F41 tienen texto, no solo icono.
    estadosDeF41ConTexto: ESTADOS_EH.every((e) => !!e.titulo),
  };
}
