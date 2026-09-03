// ============================================================================
// EH · Fase 62/65 — ACCESIBILIDAD Y USABILIDAD AVANZADA
//
// *"No buscamos crear una interfaz diferente para accesibilidad. Buscamos que la
// propia interfaz principal esté bien construida desde el principio."*
//
// ── QUÉ SE CONSTRUYE AQUÍ, Y QUÉ NO ────────────────────────────────────────
//
// La **F42** ya hizo la primera pasada de accesibilidad: área táctil, iconos
// sueltos, estados que no dependan del color, `prefers-reduced-motion`,
// etiquetas para el lector de pantalla. Ésta es la **segunda**, con diecinueve
// apartados, y la mitad son los mismos.
//
// Así que aquí **no se rehace nada de eso**: se importa, se comprueba que sigue
// verde, y se construye **lo que la F42 no miró** — el tamaño del texto, el
// teclado, los formularios, las palabras, los estados vacíos, la red y el orden
// de lectura.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ LO DE LA F42 SE IMPORTA, NO SE REESCRIBE.** `REGLAS_A11Y`,
// `AREA_TACTIL_MINIMA` y `estadosSoloColor()` vienen de allí. Escribir una
// segunda regla de área táctil con otro número sería tener dos accesibilidades
// que se contradicen.
//
// **2. 🚨 Y LO NUEVO SE COMPRUEBA LEYENDO LA PANTALLA, NO DECLARÁNDOLO.** Tres
// detectores de verdad: **palabras técnicas** en textos que ve el usuario,
// **alturas fijas** donde va texto —que es lo que rompe cuando alguien sube el
// tamaño de letra— y **estados vacíos** que no dicen cómo empezar.
//
// **3. 🚨 UNA ALTURA FIJA EN UN SITIO CON TEXTO ES EL FALLO DEL APARTADO 1.**
// *"No cortar textos. No solapar elementos."* Con el tamaño de letra del sistema
// al máximo, un `h-[40px]` con una frase dentro **corta la frase**. No se ve en
// el ordenador de nadie: se ve en el móvil de quien lo necesita.
//
// **4. ⚠️ SIETE APARTADOS NECESITAN UN MÓVIL Y UNOS OJOS.** El texto aumentado,
// el teclado abierto, la orientación, la pantalla pequeña, el uso con una mano,
// el orden de lectura y la prueba real. Van a **R1** con su motivo, como en la
// F47 y la F51. Fingir que los he probado sería mentir justo en la fase que
// existe para que la aplicación aguante configuraciones que no son la mía.
//
// **5. ⚠️ Y LOS GESTOS DEL APARTADO 11 YA ESTÁN RESUELTOS** por la F50 y la F61:
// no hay ninguno, así que no hace falta una alternativa. Es el único apartado que
// se cumple **por no haber construido algo**.
// ============================================================================

import { normalizarEstiloHombre } from './estiloDeHombre';
import { AREA_TACTIL_MINIMA, REGLAS_A11Y, reglaA11Y, revisarPantalla, estadosSoloColor, SOLO_EN_UN_MOVIL, TEXTOS_A11Y } from './accesibilidadEH';
import { COLECCIONES_EH, coleccionEH, estadoEH, ESTADOS_EH } from './estadosEstilo';
import { GESTOS, accionesQueDependenDeUnGesto } from './accionesRapidas';
import { sinComentarios } from './privacidadEstilo';

/* ===========================================================================
   1 · LO QUE YA HIZO LA F42 (apartados 2, 3, 5, 6 y 17) — decisión 1
   =========================================================================== */

export const YA_HECHO_EN_LA_F42 = [
  { apartado: 2, que: 'Contraste y modo oscuro', donde: 'La F49 comprueba que no haya ni un color literal' },
  { apartado: 3, que: 'Zonas táctiles', donde: `REGLAS_A11Y · area_tactil (${AREA_TACTIL_MINIMA} px)` },
  { apartado: 5, que: 'Estados que no dependan del color', donde: 'estadosSoloColor()' },
  { apartado: 6, que: 'Reducir movimiento', donde: '`prefers-reduced-motion` en `index.css`' },
  { apartado: 17, que: 'Lectores de pantalla', donde: 'REGLAS_A11Y · boton_sin_nombre' },
];

export const AREA_MINIMA = AREA_TACTIL_MINIMA;

/* ===========================================================================
   2 · 🚨 LO QUE ROMPE AL SUBIR EL TAMAÑO DE LETRA (apartado 1) — decisión 3
   ===========================================================================
   *"No cortar textos. No solapar elementos. No ocultar botones."* */

/** Clases que fijan la altura de algo. Con texto dentro, lo cortan. */
export const ALTURAS_FIJAS = /\bh-\[(\d+)px\]/g;

/* ⚠️ Por debajo de esto no cabe una línea de texto con la letra del sistema
   subida. Un `h-[24px]` para un icono está bien; para una frase, no. */
export const ALTURA_SEGURA = 44;

/**
 * 🚨 Busca alturas fijas pequeñas **en elementos que llevan texto**. Un icono
 * puede medir 20 px; una frase, no.
 */
export function alturasQueCortanTexto(fuente) {
  const limpia = sinComentarios(String(fuente || ''));
  const salida = [];
  const lineas = limpia.split('\n');
  lineas.forEach((l, i) => {
    const m = [...l.matchAll(ALTURAS_FIJAS)];
    if (m.length === 0) return;
    /* ⚠️ Solo si en la misma línea hay texto de verdad: una etiqueta con
       contenido, no un `<div className="h-[2px]" />` que es una rayita. */
    const conTexto = /aria-label=|>[^<>{}]*[a-záéíóúñ]{4,}/i.test(l);
    if (!conTexto) return;
    m.forEach((x) => {
      if (Number(x[1]) < ALTURA_SEGURA) {
        salida.push({ linea: i + 1, alto: Number(x[1]), que: l.trim().slice(0, 60) });
      }
    });
  });
  return salida;
}

/* ===========================================================================
   3 · 🚨 LAS PALABRAS (apartados 9 y 10) — decisión 2
   ===========================================================================
   *"Cortos. Humanos. Directos. Evitar lenguaje excesivamente técnico."* */

export const PALABRAS_TECNICAS = [
  'null', 'undefined', 'NaN', 'JSON', 'API', 'token', 'timeout', 'callback',
  'endpoint', 'payload', 'query', 'parse', 'stack', 'exception',
];

/* ⚠️ Y las que **no son técnicas pero tampoco explican nada**. */
export const MENSAJES_QUE_NO_DICEN_NADA = ['Error', 'Ups', 'Algo ha ido mal', 'Vaya', 'Error inesperado'];

/**
 * 🚨 Busca palabras técnicas **en textos que ve el usuario**: dentro de una
 * etiqueta JSX o de un `aria-label`. No en el código, donde `null` es normal.
 */
export function palabrasTecnicasEnPantalla(fuente) {
  const limpia = sinComentarios(String(fuente || ''));
  const salida = [];
  limpia.split('\n').forEach((l, i) => {
    /* Los trozos visibles: `>texto<` y `aria-label="texto"`. */
    const visibles = [
      ...[...l.matchAll(/>([^<>{}]{4,})</g)].map((m) => m[1]),
      ...[...l.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]),
    ];
    visibles.forEach((t) => {
      PALABRAS_TECNICAS.forEach((p) => {
        if (new RegExp(`\\b${p}\\b`).test(t)) salida.push({ linea: i + 1, palabra: p, texto: t.trim().slice(0, 50) });
      });
    });
  });
  return salida;
}

/** Apartado 9 — un error tiene que decir **qué corregir**, no solo "error". */
export const errorSinExplicacion = (texto) => MENSAJES_QUE_NO_DICEN_NADA
  .some((m) => String(texto || '').trim().replace(/[.!]$/, '').toLowerCase() === m.toLowerCase());

/* ===========================================================================
   4 · LOS ESTADOS VACÍOS (apartado 15) — decisión 2
   ===========================================================================
   *"Un módulo vacío debe explicar qué es, para qué sirve y cómo empezar."* */

export function vaciosQueNoDicenComoEmpezar() {
  /* ⚠️ Los tres que pide el apartado 15: qué es (`titulo`), para qué sirve
     (`texto`) y **cómo empezar** (`boton`). Sin el botón, el vacío informa pero
     no ayuda: te deja mirando una pantalla que dice que está vacía. */
  return COLECCIONES_EH
    .filter((c) => !c.titulo || !c.texto || !c.boton)
    .map((c) => ({ id: c.id, falta: !c.boton ? 'cómo empezar' : 'la explicación' }));
}

export const EJEMPLO_VACIO = {
  malo: 'No hay datos.',
  bueno: 'Todavía no tienes perfumes guardados. → Añadir perfume',
};

/* ===========================================================================
   5 · NO QUEDARSE ATRAPADO (apartado 7)
   =========================================================================== */

export const SALIDAS = ['volver', 'cerrar', 'cancelar'];

/**
 * ⚠️ Toda pantalla tiene que poder dejarse. Se cuenta cuántas salidas hay en la
 * vista: si hubiera menos que pantallas, alguna sería un callejón.
 */
export function salidasDe(fuente) {
  const f = String(fuente || '');
  return {
    volver: (f.match(/aria-label="Volver"/g) || []).length,
    cerrar: (f.match(/aria-label="Cerrar"/g) || []).length,
    cancelar: (f.match(/>Cancelar</g) || []).length,
    pantallas: (f.match(/^export function [A-Z]/gm) || []).length,
  };
}

/* ===========================================================================
   6 · LA RED (apartado 16)
   =========================================================================== */

export const SIN_CONEXION = {
  seDetecta: true,
  donde: 'estadoDeConexion() · estadosEstilo.js (F41)',
  /* ⚠️ Apartado 16 — *"y, cuando sea posible, permitir reintentar"*. */
  sePuedeReintentar: true,
  estado: 'modo_sin_conexion',
};

export const hayEstadoDeRed = () => !!estadoEH(SIN_CONEXION.estado);

export const reintentarEsPosible = () => (estadoEH(SIN_CONEXION.estado)?.opciones || [])
  .some((o) => o.id === 'reintentar');

/* ===========================================================================
   7 · LOS GESTOS (apartado 11) — decisión 5
   =========================================================================== */

export const GESTOS_Y_SU_ALTERNATIVA = {
  /* ⚠️ Se cumple **por no haber construido ninguno**. */
  hayGestos: GESTOS.filter((g) => g.existe).length > 0,
  porque: 'La F50 y la F61 ya decidieron que no hay gestos: todas las acciones están en botones visibles. Sin gesto no hace falta alternativa.',
  deLasFases: ['F50', 'F61'],
};

/* ===========================================================================
   8 · LO QUE NECESITA UN MÓVIL (apartados 1, 8, 12, 13, 14, 18 y 19)
   ===========================================================================
   🚨 Decisión 4 — siete, con su motivo. */

export const PARA_JOSUE = [
  { apartado: 1, que: 'Ver la pantalla con el texto del sistema aumentado', porque: 'El código evita las alturas fijas, pero VERLO con la letra al máximo es mirar un móvil.' },
  { apartado: 8, que: 'El teclado abierto sin tapar el campo', porque: 'Depende del teclado de cada teléfono y de cuánto ocupa. No se simula.' },
  { apartado: 12, que: 'Usar la aplicación con una mano', porque: 'Depende del tamaño de su móvil y de su pulgar, no del código.' },
  { apartado: 13, que: 'La orientación horizontal', porque: 'Hay que girar un teléfono de verdad.' },
  { apartado: 14, que: 'Una pantalla pequeña', porque: 'Y no la del ordenador de desarrollo, que es lo que el apartado prohíbe expresamente.' },
  { apartado: 18, que: 'El orden de lectura con el lector de pantalla', porque: '🚨 Esto solo lo dice VoiceOver o TalkBack leyendo la pantalla en voz alta. Ninguna expresión lo comprueba.' },
  { apartado: 19, que: 'La prueba real, con las siete configuraciones', porque: 'Es, literalmente, "probar" — con el móvil en la mano.' },
];

export const apartadosDeJosueA11Y = () => PARA_JOSUE.map((p) => p.apartado);

/* ===========================================================================
   9 · LOS DIECINUEVE APARTADOS
   =========================================================================== */

export const APARTADOS_USABILIDAD = [
  { id: 1, nombre: 'Tamaño del texto', como: 'mixto', donde: 'alturasQueCortanTexto() + R1 para verlo' },
  { id: 2, nombre: 'Contraste', como: 'hecho', donde: 'F42 y F49' },
  { id: 3, nombre: 'Zonas táctiles', como: 'hecho', donde: 'F42 · area_tactil' },
  { id: 4, nombre: 'Iconos', como: 'node', donde: 'REGLAS_A11Y · boton_sin_nombre' },
  { id: 5, nombre: 'Estados', como: 'hecho', donde: 'F42 · estadosSoloColor()' },
  { id: 6, nombre: 'Reducir movimiento', como: 'hecho', donde: 'F42 · prefers-reduced-motion' },
  { id: 7, nombre: 'Navegación', como: 'node', donde: 'salidasDe()' },
  { id: 8, nombre: 'Teclado', como: 'josue', donde: 'R1' },
  { id: 9, nombre: 'Formularios', como: 'node', donde: 'errorSinExplicacion()' },
  { id: 10, nombre: 'Mensajes', como: 'node', donde: 'palabrasTecnicasEnPantalla()' },
  { id: 11, nombre: 'Gestos', como: 'hecho', donde: 'F50 y F61 — no hay ninguno' },
  { id: 12, nombre: 'Uso con una mano', como: 'josue', donde: 'R1' },
  { id: 13, nombre: 'Orientación', como: 'josue', donde: 'R1' },
  { id: 14, nombre: 'Pantallas pequeñas', como: 'josue', donde: 'R1' },
  { id: 15, nombre: 'Estados vacíos', como: 'node', donde: 'vaciosQueNoDicenComoEmpezar()' },
  { id: 16, nombre: 'Errores de red', como: 'node', donde: 'SIN_CONEXION (F41)' },
  { id: 17, nombre: 'Lectores de pantalla', como: 'hecho', donde: 'F42 · boton_sin_nombre' },
  { id: 18, nombre: 'Orden de lectura', como: 'josue', donde: 'R1 — solo lo dice un lector de pantalla' },
  { id: 19, nombre: 'Prueba real', como: 'josue', donde: 'R1' },
];

export const apartadoUsabilidad = (id) => APARTADOS_USABILIDAD.find((a) => a.id === id) || null;
export const apartadosAutomaticosA11Y = () => APARTADOS_USABILIDAD.filter((a) => a.como === 'node');
export const apartadosYaHechosA11Y = () => APARTADOS_USABILIDAD.filter((a) => a.como === 'hecho');

export const CONDICION = 'Premium, bonito y rápido, pero además cómodo, claro y resistente a configuraciones que no son la mía. Sin una interfaz aparte para accesibilidad.';

/* ===========================================================================
   10 · EL PARTE
   =========================================================================== */

export function auditarUsabilidad(vista = '') {
  return {
    // Decisión 1 — lo de la F42 sigue verde.
    problemasDeLaF42: vista ? revisarPantalla(vista).problemas : [],
    reglasDeLaF42: REGLAS_A11Y.length,
    estadosSoloColor: estadosSoloColor(),
    // 🚨 Decisión 3
    alturasQueCortan: vista ? alturasQueCortanTexto(vista) : [],
    // 🚨 Decisión 2
    palabrasTecnicas: vista ? palabrasTecnicasEnPantalla(vista) : [],
    // Apartado 15
    vaciosIncompletos: vaciosQueNoDicenComoEmpezar(),
    // Apartado 7
    salidas: vista ? salidasDe(vista) : null,
    // Apartado 16
    hayEstadoDeRed: hayEstadoDeRed(),
    sePuedeReintentar: reintentarEsPosible(),
    // Decisión 5
    gestosSinAlternativa: accionesQueDependenDeUnGesto(),
    // Decisión 4
    paraJosue: apartadosDeJosueA11Y(),
    sinMotivo: PARA_JOSUE.filter((p) => !p.porque).map((p) => p.apartado),
    sinDonde: APARTADOS_USABILIDAD.filter((a) => !a.donde).map((a) => a.id),
  };
}

export function panelUsabilidad(vista = '') {
  const a = auditarUsabilidad(vista);
  return {
    ...a,
    yaHecho: YA_HECHO_EN_LA_F42,
    paraJosueLista: PARA_JOSUE,
    apartados: APARTADOS_USABILIDAD,
    /* 🎯 El veredicto: **la interfaz principal aguanta**. Lo que necesita un
       móvil y unos ojos queda fuera, dicho con su nombre. */
    aguanta: a.problemasDeLaF42.length === 0
      && a.alturasQueCortan.length === 0
      && a.palabrasTecnicas.length === 0
      && a.vaciosIncompletos.length === 0
      && a.estadosSoloColor.length === 0
      && a.gestosSinAlternativa.length === 0
      && a.hayEstadoDeRed
      && a.sePuedeReintentar
      && a.sinMotivo.length === 0
      && a.sinDonde.length === 0,
    condicion: CONDICION,
  };
}

export { AREA_TACTIL_MINIMA, REGLAS_A11Y, reglaA11Y, revisarPantalla, estadosSoloColor,
  SOLO_EN_UN_MOVIL, TEXTOS_A11Y, COLECCIONES_EH, coleccionEH, estadoEH, ESTADOS_EH,
  GESTOS, normalizarEstiloHombre };
