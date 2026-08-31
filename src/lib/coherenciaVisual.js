// ============================================================================
// EH · Fase 49/65 — REVISIÓN VISUAL FINAL Y COHERENCIA
//
// *"Que tenga personalidad propia, pero que siga pareciendo JC Fitness."*
//
// ── LA IDEA QUE HACE QUE ESTO NO SE QUEDE VIEJO ────────────────────────────
//
// Una revisión visual escrita a mano —*"los bordes son redondeados, el texto es
// pequeño"*— caduca en dos fases. Así que aquí no se declara **cómo debe verse**
// Estilo de hombre: se compara **su vocabulario visual con el del resto de
// JosStyle**, y se falla si inventa algo que no usa nadie más.
//
// Eso responde exactamente a la condición de finalización —*"no debe quedar
// ningún elemento visual que parezca «esto pertenece a otra aplicación»"*— y
// **se calibra solo**: el día que el Dashboard cambie de radio, esto no se
// queja; el día que Estilo de hombre se invente uno, sí.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ LA REFERENCIA SON LAS OTRAS VISTAS, NO UNA LISTA MÍA.** `soloEn()`
// saca el vocabulario de las dos partes y devuelve lo que solo aparece en una.
// Sin listas de valores permitidos que alguien tenga que mantener.
//
// **2. ⚠️ SE COMPARA LA FAMILIA, NO EL LADO.** `rounded-t-3xl` (la hoja
// inferior) y `rounded-3xl` son el mismo lenguaje visual: lo que se compara es
// **el tamaño del radio**, no por qué esquina se aplica. Sin esa normalización,
// el revisor habría cazado la única hoja inferior de la aplicación — que hace lo
// mismo que las demás.
//
// **3. ⚠️ Y LO QUE SÍ ES UNA LISTA, TRAE SU EJEMPLO MALO** (la lección de la
// F42). Los gradientes, las sombras exageradas y los colores literales
// (`text-white`) no dependen de lo que hagan otros: **rompen el modo oscuro o
// sobredecoran**, y el apartado 17 los prohíbe con todas las letras. Cada regla
// trae un ejemplo que sí incumple, y la prueba comprueba que lo caza.
//
// **4. ⚠️ EL MODO OSCURO NO ES UNA OPINIÓN.** Un color escrito a mano en el JSX
// no cambia con el tema: da igual lo bien que se vea en claro. Por eso la regla
// es *"todo color sale de `COLORS`"*, que ya es una regla invariante del
// proyecto — aquí se comprueba **dentro de la vista de Estilo de hombre**, que
// es la más grande de todas.
//
// **5. ⚠️ Y TRES APARTADOS NECESITAN OJOS** (7 en parte, 16 y 19): ver los dos
// temas, tres tamaños de pantalla y comparar con el Dashboard es de Josué. Van
// declarados con su motivo, como en la F42 y la F44.
// ============================================================================

import { ESTADOS_GESTION } from './gestionEstilo';
import { ESTADOS_MODULO } from './miEstilo';
import { ESTADOS_EH } from './estadosEstilo';
import { AREA_TACTIL_MINIMA } from './accesibilidadEH';

/* ===========================================================================
   1 · EL VOCABULARIO VISUAL (apartados 1, 3, 15 y 17)
   ===========================================================================
   ⚠️ Cada categoría dice **qué se extrae** de una fuente. Lo que se compara
   después es si Estilo de hombre usa algo que el resto de JosStyle no usa. */

export const CATEGORIAS_VISUALES = [
  {
    id: 'radios', nombre: 'Radios de borde', apartado: 15,
    saca: /rounded-(?:\[[^\]]+\]|[a-zA-Z0-9_-]+)/g,
    /* ⚠️ Decisión 2 — el lado no es el lenguaje: `rounded-t-3xl` es la hoja
       inferior, y visualmente es de la misma familia que `rounded-3xl`. */
    normaliza: (x) => x.replace(/^rounded-(?:t|b|l|r|tl|tr|bl|br|s|e)-/, 'rounded-'),
  },
  {
    id: 'textos', nombre: 'Tamaños de texto', apartado: 15,
    saca: /text-\[[0-9]+px\]|text-(?:xs|sm|base|lg|xl|2xl|3xl)\b/g,
    normaliza: (x) => x,
  },
  {
    id: 'espaciados', nombre: 'Espaciados', apartado: 15,
    saca: /\b(?:p|px|py|pt|pb|m|mx|my|mt|mb|gap|space-[xy])-[0-9.]+\b/g,
    normaliza: (x) => x,
  },
];

export const categoriaVisual = (id) => CATEGORIAS_VISUALES.find((c) => c.id === id) || null;

/** Lo que usa una fuente, por categoría. */
export function vocabulario(fuente) {
  const t = String(fuente || '');
  return Object.fromEntries(CATEGORIAS_VISUALES.map((c) => [
    c.id,
    [...new Set((t.match(c.saca) || []).map(c.normaliza))].sort(),
  ]));
}

/**
 * ⚠️ **Decisión 1** — lo que Estilo de hombre usa **y el resto de JosStyle no**.
 * Si esto no está vacío, hay algo que parece de otra aplicación.
 */
export function soloEn(fuenteEH, fuentesDelResto) {
  const suyo = vocabulario(fuenteEH);
  const resto = vocabulario(Array.isArray(fuentesDelResto) ? fuentesDelResto.join('\n') : fuentesDelResto);
  return Object.fromEntries(CATEGORIAS_VISUALES.map((c) => [
    c.id,
    suyo[c.id].filter((x) => !resto[c.id].includes(x)),
  ]));
}

/*
 * ⚠️ **Lo que Estilo de hombre usa y nadie más, con permiso.** `-m-1.5` lo
 * introdujo la **F42**: un margen negativo que agranda el área táctil hasta los
 * 44 píxeles **sin cambiar el dibujo**. Ninguna otra vista lo necesitó porque
 * ninguna tenía botones tan pequeños, así que aparece solo aquí — y no es una
 * incoherencia, es un arreglo con motivo. Se declara, en vez de ensanchar la
 * comparación hasta que no encuentre nada.
 */
export const EXCEPCIONES = [
  { token: 'm-1.5', porque: 'La F42 lo usa como `-m-1.5` para llegar a 44 px de área táctil sin cambiar el dibujo.' },
  { token: 'my-1.5', porque: 'Lo mismo, en vertical.' },
];

export const esExcepcion = (token) => EXCEPCIONES.some((e) => e.token === token);

export const inventaAlgo = (fuenteEH, fuentesDelResto) =>
  Object.values(soloEn(fuenteEH, fuentesDelResto)).flat().filter((x) => !esExcepcion(x));

/* ===========================================================================
   2 · LAS REGLAS QUE NO DEPENDEN DE NADIE (apartados 7 y 17)
   ===========================================================================
   ⚠️ Decisión 3 — estas no se comparan: rompen el tema o sobredecoran, y el
   enunciado las prohíbe. Cada una trae **un ejemplo que sí incumple**. */

export const REGLAS_VISUALES = [
  {
    id: 'gradiente', apartado: 17,
    que: 'Un gradiente: el apartado 17 los prohíbe con todas las letras.',
    busca: /bg-gradient-[a-z]+|linear-gradient\(/g,
    ejemploMalo: '<div className="bg-gradient-to-r from-blue-500">',
  },
  {
    id: 'sombra_grande', apartado: 17,
    que: 'Una sombra exagerada.',
    busca: /shadow-(?:lg|xl|2xl)\b|drop-shadow-(?:lg|xl|2xl)\b/g,
    ejemploMalo: '<div className="shadow-2xl">',
  },
  {
    id: 'color_literal', apartado: 7,
    que: 'Un color de Tailwind que no cambia con el tema: en oscuro se ve mal.',
    busca: /\b(?:text|bg|border)-(?:white|black|gray-[0-9]+|slate-[0-9]+|zinc-[0-9]+)\b/g,
    ejemploMalo: '<p className="text-white bg-gray-800">',
  },
  {
    id: 'hex_suelto', apartado: 1,
    que: 'Un color escrito a mano en vez de salir de `COLORS` (regla 2 del proyecto).',
    busca: /(?:color|background|borderColor)\s*:\s*['"]#[0-9a-fA-F]{3,8}['"]/g,
    ejemploMalo: "style={{ color: '#ff0000' }}",
  },
  {
    id: 'animacion_infinita', apartado: 8,
    que: 'Una animación decorativa que no para: *"nada espectacular por sí mismo"*.',
    /* ⚠️ `animate-spin` **no entra**: un indicador de carga que no gira no es un
       indicador de carga, y `ui.jsx` lo usa para eso. Lo que prohíbe el apartado
       8 es lo decorativo, no lo que informa. */
    busca: /animate-(?:ping|bounce|pulse)\b/g,
    ejemploMalo: '<div className="animate-bounce">',
  },
];

export const reglaVisual = (id) => REGLAS_VISUALES.find((r) => r.id === id) || null;

/**
 * ⚠️ Sin comentarios: una explicación que menciona un gradiente no lo pinta. Es
 * la misma lección de la F42 y la F48.
 */
export function revisarVisual(nombre, fuente) {
  const limpio = String(fuente || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return REGLAS_VISUALES.flatMap((r) => (limpio.match(new RegExp(r.busca.source, 'g')) || [])
    .map((trozo) => ({ archivo: nombre, regla: r.id, apartado: r.apartado, trozo: trozo.slice(0, 60) })));
}

/* ===========================================================================
   3 · LOS ESTADOS, CON SU TEXTO (apartado 9)
   ===========================================================================
   *"🟢 Activo · ⚪ Oculto · ⏸️ Desactivado. Pero siempre acompañados de texto."*
   ⚠️ No se declara una cuarta lista: se comprueban las que ya existen. */

export const LISTAS_DE_ESTADO = [
  { id: 'gestion', nombre: 'Gestionar apartados (F36)', lista: ESTADOS_GESTION },
  { id: 'modulo', nombre: 'Mi estilo (F6)', lista: ESTADOS_MODULO },
];

export function revisarEstados() {
  const problemas = [];
  LISTAS_DE_ESTADO.forEach((l) => {
    (l.lista || []).forEach((e) => {
      // Un color o un icono sin palabra no se entiende: el apartado 9 lo dice.
      if (!e.nombre && !e.texto && !e.etiqueta) problemas.push({ lista: l.id, estado: e.id, motivo: 'sin texto' });
    });
  });
  return problemas;
}

/* ===========================================================================
   4 · LOS VEINTE APARTADOS
   =========================================================================== */

export const APARTADOS_VISUALES = [
  { apartado: 1, id: 'identidad', nombre: 'La identidad de JosStyle', comprobable: true, donde: '`soloEn()`: Estilo de hombre no usa ningún token que el resto no use.' },
  { apartado: 2, id: 'personalidad', nombre: 'Personalidad propia', comprobable: true, donde: 'Los emojis de cada módulo, que son su seña — y nada más.' },
  { apartado: 3, id: 'plaquitas', nombre: 'Plaquitas pequeñas y limpias', comprobable: true, donde: 'La misma tarjeta que el resto: `rounded-2xl p-2.5`.' },
  { apartado: 4, id: 'jerarquia', nombre: 'Título, resumen, apartados y acciones', comprobable: true, donde: '`panelPantalla` (F30): cabecera, resumen, secciones y accesos.' },
  { apartado: 5, id: 'espacio', nombre: 'Dejar espacio', comprobable: true, donde: 'El mismo `space-y-3` de las demás vistas.' },
  { apartado: 6, id: 'iconos', nombre: 'El sistema de iconos', comprobable: true, donde: 'Lucide para las acciones, emoji para la identidad de cada módulo.' },
  {
    apartado: 7, id: 'modo_oscuro', nombre: 'Claro y oscuro', comprobable: true,
    donde: 'Ni un color literal ni un hex suelto: todo sale de `COLORS`, que cambia entero con el tema.',
    limite: 'Verlo con los ojos en los dos temas es de Josué (R1).',
  },
  { apartado: 8, id: 'animaciones', nombre: 'Animación pequeña', comprobable: true, donde: 'Sin animaciones infinitas, y `prefers-reduced-motion` respetado desde `index.css` (F42).' },
  { apartado: 9, id: 'estados', nombre: 'Estados con texto', comprobable: true, donde: '`revisarEstados()` sobre las listas que ya existen.' },
  { apartado: 10, id: 'botones', nombre: 'Jerarquía en los botones', comprobable: true, donde: '`PrimaryButton` para la acción principal; el resto, texto.' },
  { apartado: 11, id: 'modales', nombre: 'Modales pequeños', comprobable: true, donde: '`AvisoDesactivar` y las confirmaciones: explicación, acción y cancelar.' },
  { apartado: 12, id: 'formularios', nombre: 'Formularios por pasos', comprobable: true, donde: 'El motor de cuestionarios (F7), que enseña de sección en sección.' },
  { apartado: 13, id: 'navegacion', nombre: 'El patrón de siempre', comprobable: true, donde: 'Las cinco pestañas y el volver de siempre (regla 10).' },
  { apartado: 14, id: 'icono_titulo', nombre: 'Icono y nombre claros', comprobable: true, donde: '🧔 Estilo de hombre, con el nombre definitivo de C-21.' },
  { apartado: 15, id: 'microdetalles', nombre: 'Márgenes, radios y tamaños', comprobable: true, donde: '`soloEn()`, por categorías.' },
  {
    apartado: 16, id: 'responsive', nombre: 'Móvil pequeño, grande y pantalla grande', comprobable: false,
    donde: 'R1 — su iPhone. Aquí se comprueba que no hay anchos fijos (F42).',
    porque: 'Los tamaños de pantalla reales necesitan los dispositivos.',
  },
  { apartado: 17, id: 'no_sobredecorar', nombre: 'No sobredecorar', comprobable: true, donde: 'Las cinco reglas: ni gradientes, ni sombras grandes, ni animaciones infinitas.' },
  { apartado: 18, id: 'recorrido', nombre: 'Recorrer todas las pantallas', comprobable: true, donde: 'Los 1 408 casos de renderizado y las 447 comprobaciones en Chromium.' },
  {
    apartado: 19, id: 'comparacion', nombre: 'Comparar con el resto de JosStyle', comprobable: false,
    donde: 'R1 — mirar el Dashboard y Estilo de hombre uno detrás de otro.',
    porque: 'La comparación del vocabulario se hace aquí; que "parezcan lo mismo" lo dicen los ojos.',
  },
  { apartado: 20, id: 'resultado', nombre: 'JosStyle + personalidad propia', comprobable: true, donde: 'La suma de todo lo anterior, en `auditarCoherencia()`.' },
];

export const apartadoVisual = (id) => APARTADOS_VISUALES.find((a) => a.id === id) || null;

/* ===========================================================================
   5 · AUDITORÍA
   =========================================================================== */

export const TEXTOS_COHERENCIA = {
  meta: 'Estilo de hombre = JosStyle + personalidad propia.',
  // La condición de finalización, en una frase.
  fallo: 'Esto parece de otra aplicación.',
};

export function auditarCoherencia(fuenteEH, fuentesDelResto, extra = {}) {
  return {
    // Decisión 1 — lo que Estilo de hombre se ha inventado.
    inventado: soloEn(fuenteEH, fuentesDelResto),
    inventadoTotal: inventaAlgo(fuenteEH, fuentesDelResto).length,
    // Decisión 3 — y lo que rompe el tema o sobredecora.
    problemas: revisarVisual('EstiloHombreView.jsx', fuenteEH),
    // Apartado 9.
    estadosSinTexto: revisarEstados(),
    estados: LISTAS_DE_ESTADO.reduce((s, l) => s + (l.lista || []).length, 0),
    // Los apartados que necesitan ojos, declarados.
    deJosue: APARTADOS_VISUALES.filter((a) => !a.comprobable).map((a) => a.id),
    sinMotivo: APARTADOS_VISUALES.filter((a) => !a.comprobable && !a.porque).map((a) => a.id),
    sinDonde: APARTADOS_VISUALES.filter((a) => !a.donde).map((a) => a.id),
    reglas: REGLAS_VISUALES.length,
    sinEjemplo: REGLAS_VISUALES.filter((r) => !r.ejemploMalo).map((r) => r.id),
    categorias: CATEGORIAS_VISUALES.length,
    // Esta fase tampoco construye nada.
    pantallasNuevas: 0,
    tokensNuevos: 0,
    // Lo que ya vigilaba la F42, para no repetirlo.
    areaTactilMinima: AREA_TACTIL_MINIMA,
    estadosDePantalla: ESTADOS_EH.length,
    ...extra,
  };
}

export function panelCoherencia(fuenteEH, fuentesDelResto) {
  const a = auditarCoherencia(fuenteEH, fuentesDelResto);
  return {
    meta: TEXTOS_COHERENCIA.meta,
    apartados: APARTADOS_VISUALES,
    pendienteDeJosue: APARTADOS_VISUALES.filter((x) => !x.comprobable),
    vocabulario: vocabulario(fuenteEH),
    inventado: a.inventado,
    problemas: a.problemas,
    // ⚠️ Verde solo si no se ha inventado nada Y no hay ninguna regla rota.
    coherente: a.inventadoTotal === 0 && a.problemas.length === 0,
  };
}
