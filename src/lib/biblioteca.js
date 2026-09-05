// ============================================================================
// ENTREGA 3 · FASE 16 (BL F1) — LA BIBLIOTECA COMO LANZADOR DE MINI-APPS
//
// *"Biblioteca debe funcionar como una base de conocimiento personal, pero
// presentada visualmente como un launcher de mini-aplicaciones."*
//
// 🚨 **Y lo primero que pide el enunciado no es construir, es MIRAR:** *"Antes de
// modificar: analiza la implementación actual… identifica si existen notas,
// documentos, libros u otras estructuras… identifica posibles duplicaciones. No
// elimines datos existentes sin comprobarlos."*
//
// Al mirarla, **tres de las seis mini-apps ya existían con otro nombre**:
//
// | Mini-app del enunciado | Lo que ya había | Desde |
// |---|---|---|
// | 📝 Notas | `biblioteca.apuntes` | Fase 11 |
// | 🔖 Guardados | `biblioteca.enlaces` | Fase 11 |
// | 📄 Documentos | `bibliotecaArchivos` (PDF, vídeo, foto) | Fase 11 |
//
// Así que **no se crea ni una lista nueva para ellas**: se les pone su nombre y
// su sitio. Crear `notas` al lado de `apuntes` habría dejado los apuntes de
// Josué invisibles en su propia biblioteca, que es exactamente lo que el
// criterio de éxito 15 prohíbe: *"no se hayan perdido datos existentes"*.
//
// Es la lección más repetida del proyecto —*"antes de declarar que algo NO
// existe, mirar si ya existe con otro nombre"* (E3 F8)—, esta vez sobre **tres
// colecciones a la vez**.
//
// ⚠️ **Y las otras tres sí son nuevas** (`libros`, `ideas`, `colecciones`), con
// el modelo **mínimo** que hace falta para que su botón de crear no sea
// decorativo (regla 8). El gestor completo de cada una es de las fases BL F2,
// F5 y F7, y el enunciado lo dice: *"NO desarrollar todavía: gestor completo de
// libros, sistema completo de ideas, sistema completo de colecciones"*.
// ============================================================================

import { uid, fechaLocalISO } from './helpers.js';
/* 🚨 **La fábrica del libro vive en `libros.js` desde la BL F2, y aquí solo se
   reexporta.** Escribir una segunda habría dejado dos formas del mismo libro
   conviviendo, y la que perdiera se llevaría campos en el siguiente guardado
   (regla 5).

   ⚠️ Y se hace **importando y reexportando**, nunca `export … from`: eso no crea
   binding local, y este archivo las usa (EH F17). */
import { crearLibro, normalizarLibro } from './libros.js';

export { crearLibro, normalizarLibro };

/* ── Qué había antes de esta fase ──────────────────────────────────────────

   🚨 Escrito en código, no en un comentario, **porque hay una prueba que lo
   recorre**: si una fase futura crea una lista `notas` al lado de `apuntes`,
   esta tabla la delata. */
export const MAPEO_EXISTENTE = [
  {
    miniApp: 'notas',
    coleccion: 'apuntes',
    donde: 'biblioteca.apuntes',
    desde: 'Fase 11',
    porque: 'un apunte de la Biblioteca es exactamente lo que el enunciado llama una nota: título opcional y texto libre.',
  },
  {
    miniApp: 'guardados',
    coleccion: 'enlaces',
    donde: 'biblioteca.enlaces',
    desde: 'Fase 11',
    porque: 'Guardados es «información, recursos, referencias, contenido útil, enlaces», y los enlaces ya guardaban título, dirección y descripción.',
  },
  {
    miniApp: 'documentos',
    coleccion: 'archivos',
    donde: 'bibliotecaArchivos',
    desde: 'Fase 11',
    porque: 'Documentos se subtitula «tu archivo personal», y los PDF, vídeos y fotos ya subidos son justo eso. Ninguna otra mini-app los recoge.',
  },
];

export const mapeoDe = (miniApp) => MAPEO_EXISTENTE.find((m) => m.miniApp === miniApp) || null;

/** Las listas que esta fase crea de cero, con el modelo mínimo de cada una. */
export const COLECCIONES_NUEVAS = ['libros', 'ideas', 'colecciones'];

/* ── El catálogo: UNA LÍNEA POR MINI-APP ───────────────────────────────────

   Mismo patrón que `MODULOS_EH`, `LINEAS_DE_PLAQUITA` o `METRICAS_PROGRESO`:
   añadir algo aquí es añadir una línea, nunca un `case` ni un `if` en la
   pantalla. Cada línea trae:

   - `icono`: el **nombre del icono de Lucide**, no un emoji. El enunciado es
     explícito: *"no utilizar emojis gigantes como diseño definitivo… utilizar
     la librería de iconos existente del proyecto, por ejemplo Lucide"*.
   - `de`: de dónde salen sus elementos — `'biblioteca'` (dentro del almacén del
     módulo) o `'archivos'` (la lista aparte de Supabase Storage).
   - `vacio`: el estado vacío del enunciado, con su título, su frase y el texto
     de su botón. *"No dejar pantallas vacías sin contexto."*
   - `contador`: cómo se llama lo que cuenta la plaquita, en singular y plural. */
export const MINI_APPS = [
  {
    id: 'libros',
    nombre: 'Libros',
    descripcion: 'Gestiona lo que lees.',
    icono: 'BookMarked',
    emoji: '📚',
    de: 'biblioteca',
    coleccion: 'libros',
    nueva: true,
    fase: 'BL F2',
    contador: ['libro', 'libros'],
    vacio: {
      titulo: 'Tu biblioteca empieza aquí',
      frase: 'Guarda lo que quieres leer y sigue tu progreso.',
      boton: 'Añadir libro',
    },
  },
  {
    id: 'notas',
    nombre: 'Notas',
    descripcion: 'Escribe y guarda.',
    icono: 'StickyNote',
    emoji: '📝',
    de: 'biblioteca',
    coleccion: 'apuntes',
    nueva: false,
    fase: 'BL F3',
    contador: ['nota', 'notas'],
    vacio: {
      titulo: 'Tu espacio para pensar',
      frase: 'Escribe cualquier cosa y guárdala para después.',
      boton: 'Nueva nota',
    },
  },
  {
    id: 'guardados',
    nombre: 'Guardados',
    descripcion: 'Conserva lo importante.',
    icono: 'Bookmark',
    emoji: '🔖',
    de: 'biblioteca',
    coleccion: 'enlaces',
    nueva: false,
    fase: 'BL F4',
    contador: ['guardado', 'guardados'],
    vacio: {
      titulo: 'Aquí va lo que no quieres perder',
      frase: 'Enlaces, recursos y referencias que te sirvan más adelante.',
      boton: 'Guardar algo',
    },
  },
  {
    id: 'ideas',
    nombre: 'Ideas',
    descripcion: 'Captura lo que se te ocurre.',
    icono: 'Lightbulb',
    emoji: '💡',
    de: 'biblioteca',
    coleccion: 'ideas',
    nueva: true,
    fase: 'BL F5',
    contador: ['idea', 'ideas'],
    vacio: {
      titulo: 'Lo que se te ocurra, aquí',
      frase: 'Apúntalo ahora y decide después qué hacer con ello.',
      boton: 'Nueva idea',
    },
  },
  {
    id: 'documentos',
    nombre: 'Documentos',
    descripcion: 'Tu archivo personal.',
    icono: 'FileText',
    emoji: '📄',
    de: 'archivos',
    coleccion: 'archivos',
    nueva: false,
    fase: 'BL F6',
    contador: ['documento', 'documentos'],
    vacio: {
      titulo: 'Tu archivo personal',
      frase: 'PDFs, vídeos y fotos que quieras tener a mano.',
      boton: 'Subir un archivo',
    },
  },
  {
    id: 'colecciones',
    nombre: 'Colecciones',
    descripcion: 'Organiza tu biblioteca.',
    icono: 'FolderOpen',
    emoji: '🗂️',
    de: 'biblioteca',
    coleccion: 'colecciones',
    nueva: true,
    fase: 'BL F7',
    contador: ['colección', 'colecciones'],
    vacio: {
      titulo: 'Agrupa lo que va junto',
      frase: 'Una colección reúne notas, guardados y documentos de un mismo tema.',
      boton: 'Nueva colección',
    },
  },
];

export const miniApp = (id) => MINI_APPS.find((m) => m.id === id) || null;

/* ── En qué se diferencian, dicho en la pantalla ───────────────────────────

   El enunciado dedica tres apartados enteros a esto —Notas vs. Documentos,
   Ideas vs. Notas, Guardados vs. Colecciones— *"para evitar duplicación"*, y el
   criterio de éxito 3 pide que **las seis sean claramente diferenciables**.

   ⚠️ Así que la diferencia no se queda en un comentario: se **enseña**, con las
   dos frases del enunciado y su ejemplo. */
export const DIFERENCIAS = [
  {
    entre: ['notas', 'documentos'],
    a: 'Una nota se abre, se escribe y se guarda.',
    b: 'Un documento es largo y tiene estructura: una guía, una especificación.',
  },
  {
    entre: ['notas', 'ideas'],
    a: 'Una nota es algo que quieres conservar: «el examen es el viernes».',
    b: 'Una idea es algo que quieres desarrollar: «crear una app que automatice X».',
  },
  {
    entre: ['guardados', 'colecciones'],
    a: 'Un guardado es un elemento suelto: un enlace, un recurso.',
    b: 'Una colección agrupa varios: «aprender programación».',
  },
];

export const diferenciaDe = (id) =>
  DIFERENCIAS.filter((d) => d.entre.includes(id))
    .map((d) => (d.entre[0] === id ? d.a : d.b));

/* ── El modelo mínimo de las tres listas nuevas ────────────────────────────

   ⚠️ **Mínimo a propósito.** El enunciado dice *"en esta fase NO es necesario
   implementar todos los modelos finales, pero deja preparada la separación
   conceptual"*, y sus fases posteriores tienen cada una su modelo completo:
   estado de lectura y progreso en BL F2, desarrollo de la idea en BL F5,
   referencias polimórficas en BL F7.

   Lo que sí hace falta ya es que **el botón de crear escriba algo de verdad**:
   un botón que no guarda nada es un control decorativo (regla 8). */

export const MAX_TITULO = 200;

/** Un título válido es una cadena con algo escrito. Nada más: el enunciado
 *  insiste en *"no obligar a categoría, etiquetas, tipo, proyecto ni fecha"*. */
export function tituloValido(t) {
  return typeof t === 'string' && t.trim().length > 0 && t.trim().length <= MAX_TITULO;
}

export function crearIdea({ titulo, detalle = '' }) {
  if (!tituloValido(titulo)) return null;
  return {
    id: uid(),
    titulo: titulo.trim(),
    detalle: typeof detalle === 'string' ? detalle.trim() : '',
    fecha: fechaLocalISO(new Date()),
  };
}

export function crearColeccion({ nombre, descripcion = '' }) {
  if (!tituloValido(nombre)) return null;
  return {
    id: uid(),
    nombre: nombre.trim(),
    descripcion: typeof descripcion === 'string' ? descripcion.trim() : '',
    fecha: fechaLocalISO(new Date()),
  };
}

/* ── El normalizador ───────────────────────────────────────────────────────

   🚨 **Y ésta es la decimonovena vez del mismo fallo.** `App.jsx` hacía
   `setBiblioteca(bib)` con lo guardado **tal cual**, sin fusionar con el valor
   por defecto (regla 5). Con tres listas nuevas eso significa que **la
   biblioteca de un usuario que ya existía llegaría sin `libros`, sin `ideas` y
   sin `colecciones`** —`undefined`, no `[]`— y la pantalla reventaría al
   contarlas.

   No es una precaución: es el fallo que ya se ha pagado dieciocho veces en este
   proyecto, la última en EH F17. Al añadir un campo a una entidad, añadirlo
   también a su normalizador.

   ⚠️ Y un elemento **sin `id` es un duplicado esperando a pasar** (EH F45): al
   releerlo, cada dispositivo le pondría uno distinto. Se le pone aquí. */
const lista = (x) => (Array.isArray(x) ? x : []);

function normalizarElemento(el, campos) {
  if (!el || typeof el !== 'object') return null;
  const base = { ...el, id: el.id || uid() };
  for (const [campo, porDefecto] of Object.entries(campos)) {
    if (typeof base[campo] !== typeof porDefecto) base[campo] = porDefecto;
  }
  return base;
}

export function normalizarIdea(i) {
  const n = normalizarElemento(i, { titulo: '', detalle: '', fecha: '' });
  return n && n.titulo ? n : null;
}

export function normalizarColeccion(c) {
  const n = normalizarElemento(c, { nombre: '', descripcion: '', fecha: '' });
  return n && n.nombre ? n : null;
}

/**
 * 🚨 Se llama desde `App.jsx` **al cargar**, sobre lo guardado en Supabase.
 *
 * ⚠️ Conserva `apuntes` y `enlaces` intactos: son datos de Josué de la Fase 11
 * y esta fase no los toca. Lo único que hace es garantizar que las tres listas
 * nuevas existan.
 */
export function normalizarBiblioteca(guardado) {
  const b = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    ...b,
    apuntes: lista(b.apuntes),
    enlaces: lista(b.enlaces),
    libros: lista(b.libros).map(normalizarLibro).filter(Boolean),
    ideas: lista(b.ideas).map(normalizarIdea).filter(Boolean),
    colecciones: lista(b.colecciones).map(normalizarColeccion).filter(Boolean),
  };
}

/* ── Los indicadores de las plaquitas ──────────────────────────────────────

   *"Ejemplos de indicadores: Libros · 4, Notas · 12… **No inventar números.
   Solo mostrar datos reales cuando existan.**"*

   Así que `contarMiniApp` cuenta la lista de verdad, y una mini-app vacía
   devuelve **0**, que la pantalla no pinta. */
export function elementosDe(id, { biblioteca, archivos } = {}) {
  const app = miniApp(id);
  if (!app) return [];
  if (app.de === 'archivos') return lista(archivos);
  return lista((biblioteca || {})[app.coleccion]);
}

export function contarMiniApp(id, datos) {
  return elementosDe(id, datos).length;
}

/** El texto del indicador, ya en singular o plural. `null` cuando no hay nada:
 *  *"solo mostrar datos reales cuando existan"*. */
export function indicadorDe(id, datos) {
  const app = miniApp(id);
  if (!app) return null;
  const n = contarMiniApp(id, datos);
  if (n === 0) return null;
  return `${n} ${n === 1 ? app.contador[0] : app.contador[1]}`;
}

/** El resumen de toda la Biblioteca, para el Hub. Sin cifras inventadas. */
export function totalBiblioteca(datos) {
  return MINI_APPS.reduce((a, m) => a + contarMiniApp(m.id, datos), 0);
}

/* ── La cascada de entrada ─────────────────────────────────────────────────

   *"Las seis tarjetas pueden aparecer progresivamente… no utilizar animaciones
   exageradas. Prioridad: fluidez > efectos."*

   ⚠️ **Y se reutiliza la que ya existe**: `.hub-card` en `index.css`, la misma
   cascada de 80 ms que usan los hubs desde la Fase N2. Escribir una segunda
   sería el duplicado de siempre, y además se vería distinta. */
export const RETRASO_CASCADA_MS = 60;
export const CLASE_TARJETA = 'hub-card';

export const retrasoDeTarjeta = (indice) => `${Math.max(0, indice) * RETRASO_CASCADA_MS}ms`;

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────

   Cada línea con su motivo y **la fase donde llega**, para que nadie lo
   confunda con un descuido. */
export const NO_EN_ESTA_FASE = [
  { que: 'El gestor completo de libros: estado de lectura, progreso, páginas', llega: 'BL F2' },
  { que: 'El sistema completo de notas', llega: 'BL F3' },
  { que: 'El sistema completo de guardados', llega: 'BL F4' },
  { que: 'El sistema completo de ideas: desarrollarlas, convertirlas en proyecto u objetivo', llega: 'BL F5' },
  { que: 'El editor completo de documentos largos, con categoría y etiquetas', llega: 'BL F6' },
  { que: 'Las colecciones con referencias a elementos de las otras mini-apps', llega: 'BL F7' },
  { que: 'La búsqueda dentro de la Biblioteca y la integración global', llega: 'BL F8' },
  { que: 'IA, OCR, escáner, recomendaciones y estadísticas avanzadas', llega: 'no está previsto en este bloque' },
];

/* ── Lo que sigue guardándose donde ya estaba ──────────────────────────────

   *"Cualquier contenido existente no debe perderse. Si ya existe
   backend/Supabase: reutilizarlo. **No crear una segunda base de datos.**"*

   ⚠️ La Biblioteca escribe en **dos claves de `app_data`** y en **un bucket**, y
   las tres existían antes de esta fase. Ni una tabla nueva, ni un SQL que Josué
   tenga que ejecutar. */
export const DONDE_SE_GUARDA = [
  { que: 'Notas, guardados, libros, ideas y colecciones', donde: 'la clave `biblioteca` de `app_data`', nuevo: false },
  { que: 'La ficha de cada documento (nombre, tipo, fecha)', donde: 'la clave `bibliotecaArchivos` de `app_data`', nuevo: false },
  { que: 'El archivo en sí de cada documento', donde: 'el bucket privado `biblioteca` de Supabase Storage', nuevo: false },
];

/** 🚨 El aislamiento es de la base de datos, nunca de la pantalla (EH F43 y
 *  E3 F15). `app_data` ya tiene sus cuatro políticas `auth.uid() = user_id`, así
 *  que cada usuario ve solo su biblioteca **sin una línea de SQL nueva**. */
export const AISLAMIENTO = {
  tabla: 'app_data',
  politica: 'auth.uid() = user_id',
  sqlNuevo: false,
  porque: 'la Biblioteca no estrena tabla: escribe en las dos claves de `app_data` que ya tenía.',
};
