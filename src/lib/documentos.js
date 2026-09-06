// ============================================================================
// ENTREGA 3 · FASE 20 (BL F6) — BIBLIOTECA: DOCUMENTOS
//
// *"Documentos será el espacio para almacenar contenido largo, estructurado y
// reutilizable."*
//
// > NOTAS: pienso → escribo → guardo.
// > DOCUMENTOS: creo un documento → **lo desarrollo** → **lo organizo** → lo
// > consulto posteriormente.
//
// 🚨 **Y la mini-app Documentos ya tenía dueño.** La BL F1 la mapeó a
// `bibliotecaArchivos` —los PDF, vídeos y fotos que Josué subió desde la Fase
// 11—, porque su subtítulo es *"tu archivo personal"* y ninguna otra mini-app
// los recogía. Esta fase **no se los quita**: añade **una segunda lista**, la de
// los documentos de texto, y las dos conviven bajo el mismo techo. Son dos cosas
// distintas —un archivo en Storage y un texto que él escribe— y el estado vacío
// del propio enunciado las abarca a las dos: *"guarda aquí tus documentos,
// especificaciones y textos importantes"*.
//
// 🚨 **El formato es Markdown, y es una decisión, no un atajo.** El enunciado
// pide títulos, negrita, cursiva, tachado, listas, checklists, citas,
// separadores y código, y a la vez avisa: *"no convertirlo en Microsoft Word"*.
// Un editor visual exigiría una librería nueva —que Josué tendría que instalar a
// mano y que nadie podría verificar aquí (DEP-26)— y `contenteditable` en el
// teclado del iPhone es un campo de minas. Con Markdown:
//
// - el contenido **es texto**, así que el autoguardado, la persistencia y la
//   búsqueda *"por contenido"* funcionan sin nada especial;
// - **copiarlo entero** (apartado propio) devuelve algo que sirve de verdad —una
//   especificación para pegar en otra conversación—, no una sopa de etiquetas;
// - y **el índice sale de leer los títulos**, sin infraestructura ninguna.
// ============================================================================

import { uid, fechaLocalISO, fechaValida } from './helpers.js';

/* ── Las dos listas de la mini-app ─────────────────────────────────────────

   Declarado en código porque hay una prueba que lo recorre: si alguien intenta
   mover los archivos aquí dentro, o meter los textos en `bibliotecaArchivos`,
   esta tabla lo delata. */
export const LO_QUE_HAY_EN_DOCUMENTOS = [
  {
    id: 'archivos',
    nombre: 'Archivos',
    donde: 'bibliotecaArchivos',
    desde: 'Fase 11',
    que: 'PDF, vídeos y fotos que Josué subió. Viven en Supabase Storage.',
    nueva: false,
  },
  {
    id: 'textos',
    nombre: 'Documentos de texto',
    donde: 'biblioteca.documentos',
    desde: 'BL F6',
    que: 'Especificaciones, guías, planes y apuntes largos que él escribe.',
    nueva: true,
  },
];

/* ── Borrador y guardado ───────────────────────────────────────────────────

   *"Un documento recién creado puede permanecer como Borrador hasta que el
   usuario decida guardarlo dentro de su biblioteca. **Pero no crear un sistema
   editorial complejo.**"* Así que son dos estados, no cinco.

   ⚠️ Y **archivar es un campo aparte**, como en Ideas (E3 F19): un documento
   terminado se puede archivar sin dejar de estar terminado. */
export const ESTADOS_DOCUMENTO = [
  { id: 'draft', nombre: 'Borrador', icono: '✎', que: 'Todavía lo estás escribiendo.' },
  { id: 'ready', nombre: 'En tu biblioteca', icono: '📄', que: 'Terminado y guardado.' },
];

export const estadoDocumento = (id) => ESTADOS_DOCUMENTO.find((e) => e.id === id) || null;
export const ESTADO_DOC_POR_DEFECTO = 'draft';

export const CATEGORIAS_DOCUMENTO = ['Estudios', 'Fitness', 'Negocio', 'Programación', 'Productividad', 'Personal'];

export const MAX_TITULO_DOC = 300;
export const MAX_ETIQUETAS = 12;

/* ── Las etiquetas ─────────────────────────────────────────────────────────

   *"Opcionales. Permitir varias… **preparar la arquitectura correctamente. No
   hacer todavía un sistema avanzado de gestión de etiquetas.**"*

   ⚠️ Y *"si el proyecto ya tiene un sistema global de etiquetas, reutilizarlo.
   **No crear dos sistemas.**"* — **no lo tiene**: se ha mirado, y lo más
   parecido son las categorías de cada módulo, que no son etiquetas libres. Así
   que las etiquetas de un documento son **suyas**, una lista de textos dentro de
   su ficha. El día que exista un sistema global, esta lista es lo que migra.

   ⚠️ Se guardan **sin la almohadilla y en minúsculas**: `#Claude`, `claude` y
   `#claude` son la misma etiqueta, y guardarlas distintas haría que buscar por
   una no encontrara las otras. */
export function normalizarEtiqueta(t) {
  const limpia = String(t || '').trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '-');
  return limpia.slice(0, 40) || null;
}

export function normalizarEtiquetas(lista) {
  const base = Array.isArray(lista) ? lista : String(lista || '').split(/[,\s]+/);
  const vistas = new Set();
  const salida = [];
  for (const t of base) {
    const limpia = normalizarEtiqueta(t);
    if (limpia && !vistas.has(limpia)) { vistas.add(limpia); salida.push(limpia); }
    if (salida.length >= MAX_ETIQUETAS) break;
  }
  return salida;
}

/* ── La ficha ──────────────────────────────────────────────────────────────

   El enunciado enumera once campos del documento más una tabla de etiquetas. El
   `user_id` no se guarda —el aislamiento es de `app_data`— y las etiquetas van
   **dentro** del documento: una "tabla" `DOCUMENT_TAG` en un almacén que es una
   fila por clave sería una segunda lista que hay que mantener sincronizada a
   mano, y la primera vez que se olvidara dejaría etiquetas colgando de un
   documento borrado. */
export const CAMPOS_DOCUMENTO = [
  'id', 'titulo', 'descripcion', 'contenido', 'estado', 'categoria', 'etiquetas',
  'favorito', 'archivado', 'fecha', 'actualizado',
];

export function crearDocumento({
  titulo = '', descripcion = '', contenido = '', categoria = '', etiquetas = [],
  estado = ESTADO_DOC_POR_DEFECTO, favorito = false,
} = {}) {
  const tit = String(titulo || '').trim().slice(0, MAX_TITULO_DOC);
  const cont = String(contenido || '');
  /* ⚠️ *"Abrir directamente el editor… no obligar al usuario a rellenar campos
     organizativos antes de escribir."* Así que basta con el título o con algo
     escrito: un documento en blanco no es un documento. */
  if (!tit && !cont.trim()) return null;
  const hoy = fechaLocalISO(new Date());
  return {
    id: uid(),
    titulo: tit,
    descripcion: String(descripcion || '').trim(),
    contenido: cont,
    estado: estadoDocumento(estado) ? estado : ESTADO_DOC_POR_DEFECTO,
    categoria: String(categoria || '').trim(),
    etiquetas: normalizarEtiquetas(etiquetas),
    favorito: favorito === true,
    archivado: false,
    fecha: hoy,
    actualizado: hoy,
  };
}

export function normalizarDocumento(d) {
  if (!d || typeof d !== 'object') return null;
  const titulo = typeof d.titulo === 'string' ? d.titulo.trim().slice(0, MAX_TITULO_DOC) : '';
  const contenido = typeof d.contenido === 'string' ? d.contenido : '';
  if (!titulo && !contenido.trim()) return null;
  const fecha = fechaValida(d.fecha) ? d.fecha : fechaLocalISO(new Date());
  return {
    id: d.id || uid(),
    titulo,
    descripcion: typeof d.descripcion === 'string' ? d.descripcion : '',
    contenido,
    estado: estadoDocumento(d.estado) ? d.estado : ESTADO_DOC_POR_DEFECTO,
    categoria: typeof d.categoria === 'string' ? d.categoria : '',
    etiquetas: normalizarEtiquetas(d.etiquetas),
    favorito: d.favorito === true,
    archivado: d.archivado === true,
    fecha,
    actualizado: fechaValida(d.actualizado) ? d.actualizado : fecha,
  };
}

/* ── Las acciones ──────────────────────────────────────────────────────────*/
const tocado = (d, cambios) => ({ ...d, ...cambios, actualizado: fechaLocalISO(new Date()) });

export function editarDocumento(doc, cambios = {}) {
  if (!doc) return null;
  const propuesta = normalizarDocumento({ ...doc, ...cambios });
  if (!propuesta) return doc;
  return { ...propuesta, id: doc.id, fecha: doc.fecha, actualizado: fechaLocalISO(new Date()) };
}

export const alternarFavoritoDoc = (d) => (d ? tocado(d, { favorito: !d.favorito }) : null);
export const archivarDocumento = (d) => (d ? tocado(d, { archivado: true }) : null);
export const desarchivarDocumento = (d) => (d ? tocado(d, { archivado: false }) : null);

/** Sacar un documento de borrador. ⚠️ **No borra nada ni lo cierra**: solo deja
 *  de estar marcado como borrador. */
export const guardarEnBiblioteca = (d) => (d ? tocado(d, { estado: 'ready' }) : null);
export const volverABorrador = (d) => (d ? tocado(d, { estado: 'draft' }) : null);

/* ── El autoguardado ───────────────────────────────────────────────────────

   *"MUY IMPORTANTE. Los documentos pueden ser largos. **No se debe perder
   contenido.**"* Y a la vez: *"evitar guardar en cada pulsación contra backend…
   **aplicar debounce al autoguardado**"*.

   ⚠️ El retardo del autoguardado es **más largo que el del buscador** y por un
   motivo: una búsqueda se lanza mientras se escribe una palabra, y un guardado
   mientras se escribe un párrafo. `DEBOUNCE_BUSQUEDA_MS` está en
   `rendimiento.js` y no se toca. */
export const RETRASO_AUTOGUARDADO_MS = 1200;

/**
 * Los tres avisos del enunciado, *"discretamente"* y **sin notificaciones**.
 *
 * 🚨 `sin_conexion` **se detecta de verdad** —`navigator.onLine`—, y por eso
 * existe: un aviso que no puede aparecer nunca sería decorativo (regla 8). Lo
 * que **no** se puede detectar es que el guardado falle: `saveData` se traga su
 * error (EH F52), y eso sigue declarado como no detectable.
 */
export const AVISOS_GUARDADO = [
  { id: 'guardando', texto: 'Guardando…', detectable: true },
  { id: 'guardado', texto: 'Guardado', detectable: true },
  { id: 'sin_conexion', texto: 'Sin conexión — se guardará al volver', detectable: true },
  {
    id: 'error',
    texto: 'No se ha podido guardar. Vuelve a intentarlo en un momento.',
    detectable: false,
    porque: '`saveData` no devuelve su error a quien lo llama (EH F52). El texto está escrito para el día que lo haga.',
  },
];

export const avisoGuardado = (id) => AVISOS_GUARDADO.find((a) => a.id === id) || null;

/** Qué hay que enseñar ahora mismo. `null` mientras no ha pasado nada: un
 *  "Guardado" permanente en la pantalla es ruido. */
export function estadoDeGuardado({ escribiendo = false, guardando = false, enLinea = true, guardadoAlguna = false } = {}) {
  if (!enLinea) return avisoGuardado('sin_conexion');
  if (guardando || escribiendo) return avisoGuardado('guardando');
  if (guardadoAlguna) return avisoGuardado('guardado');
  return null;
}

/* ── El formato ────────────────────────────────────────────────────────────

   Una línea por marca, con **lo que escribe** y si envuelve la selección o
   prefija la línea. Añadir una marca es añadir una línea, nunca un `case` en el
   editor. */
export const MARCAS_FORMATO = [
  { id: 'h1', nombre: 'Título', muestra: 'H1', tipo: 'linea', prefijo: '# ' },
  { id: 'h2', nombre: 'Subtítulo', muestra: 'H2', tipo: 'linea', prefijo: '## ' },
  { id: 'h3', nombre: 'Apartado', muestra: 'H3', tipo: 'linea', prefijo: '### ' },
  { id: 'negrita', nombre: 'Negrita', muestra: 'B', tipo: 'envuelve', marca: '**' },
  { id: 'cursiva', nombre: 'Cursiva', muestra: 'I', tipo: 'envuelve', marca: '*' },
  { id: 'tachado', nombre: 'Tachado', muestra: 'S', tipo: 'envuelve', marca: '~~' },
  { id: 'vinetas', nombre: 'Lista', muestra: '•', tipo: 'linea', prefijo: '- ' },
  { id: 'numerada', nombre: 'Lista numerada', muestra: '1.', tipo: 'linea', prefijo: '1. ' },
  { id: 'checklist', nombre: 'Casillas', muestra: '☐', tipo: 'linea', prefijo: '- [ ] ' },
  { id: 'cita', nombre: 'Cita', muestra: '❝', tipo: 'linea', prefijo: '> ' },
  { id: 'codigo', nombre: 'Código', muestra: '</>', tipo: 'envuelve', marca: '`' },
  { id: 'separador', nombre: 'Separador', muestra: '—', tipo: 'bloque', texto: '\n---\n' },
];

export const marcaFormato = (id) => MARCAS_FORMATO.find((m) => m.id === id) || null;

/**
 * Aplica una marca sobre el texto, devolviendo el texto nuevo y dónde dejar el
 * cursor. Puro: no toca el DOM, así que se puede probar entero.
 *
 * ⚠️ Una marca de línea **se quita si ya está**, para que el mismo botón sirva
 * de ida y de vuelta: si no, poner una viñeta por error obligaría a borrarla a
 * mano.
 */
export function aplicarMarca(texto, inicio, fin, marcaId) {
  const m = marcaFormato(marcaId);
  const t = String(texto ?? '');
  if (!m) return { texto: t, inicio, fin };
  const i = Math.max(0, Math.min(inicio ?? 0, t.length));
  const f = Math.max(i, Math.min(fin ?? i, t.length));

  if (m.tipo === 'bloque') {
    const nuevo = t.slice(0, f) + m.texto + t.slice(f);
    const pos = f + m.texto.length;
    return { texto: nuevo, inicio: pos, fin: pos };
  }

  if (m.tipo === 'envuelve') {
    const dentro = t.slice(i, f);
    /* Sin nada seleccionado se ponen las dos marcas y el cursor queda en medio,
       que es lo que espera quien va a escribir a continuación. */
    const nuevo = `${t.slice(0, i)}${m.marca}${dentro}${m.marca}${t.slice(f)}`;
    return { texto: nuevo, inicio: i + m.marca.length, fin: i + m.marca.length + dentro.length };
  }

  // De línea: se busca el principio de la línea donde está el cursor.
  const inicioLinea = t.lastIndexOf('\n', i - 1) + 1;
  const linea = t.slice(inicioLinea, t.indexOf('\n', i) === -1 ? t.length : t.indexOf('\n', i));
  if (linea.startsWith(m.prefijo)) {
    const nuevo = t.slice(0, inicioLinea) + linea.slice(m.prefijo.length) + t.slice(inicioLinea + linea.length);
    const pos = Math.max(inicioLinea, i - m.prefijo.length);
    return { texto: nuevo, inicio: pos, fin: pos };
  }
  const nuevo = t.slice(0, inicioLinea) + m.prefijo + t.slice(inicioLinea);
  return { texto: nuevo, inicio: i + m.prefijo.length, fin: f + m.prefijo.length };
}

/* ── Leer el documento ─────────────────────────────────────────────────────

   🚨 Se convierte a **bloques**, que la pantalla pinta con componentes de React.
   Nunca a HTML con `dangerouslySetInnerHTML`: lo que hay dentro lo escribe
   Josué, pero un documento importado o pegado de cualquier sitio no tiene por
   qué ser inofensivo, y una vez que existe ese camino ya no se cierra. */
export function bloquesDe(markdown) {
  const lineas = String(markdown ?? '').split('\n');
  const bloques = [];
  let lista = null;

  const cerrarLista = () => { if (lista) { bloques.push(lista); lista = null; } };

  for (const linea of lineas) {
    const t = linea.trimEnd();

    if (/^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(t)) { cerrarLista(); bloques.push({ tipo: 'separador' }); continue; }

    const titulo = t.match(/^(#{1,3})\s+(.*)$/);
    if (titulo) {
      cerrarLista();
      bloques.push({ tipo: 'titulo', nivel: titulo[1].length, texto: titulo[2].trim() });
      continue;
    }

    const cita = t.match(/^>\s?(.*)$/);
    if (cita) { cerrarLista(); bloques.push({ tipo: 'cita', texto: cita[1] }); continue; }

    const tarea = t.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (tarea) {
      if (!lista || lista.tipo !== 'checklist') { cerrarLista(); lista = { tipo: 'checklist', elementos: [] }; }
      lista.elementos.push({ hecho: tarea[1].toLowerCase() === 'x', texto: tarea[2] });
      continue;
    }

    const vineta = t.match(/^\s*[-*]\s+(.*)$/);
    if (vineta) {
      if (!lista || lista.tipo !== 'vinetas') { cerrarLista(); lista = { tipo: 'vinetas', elementos: [] }; }
      lista.elementos.push({ texto: vineta[1] });
      continue;
    }

    const numerada = t.match(/^\s*\d+[.)]\s+(.*)$/);
    if (numerada) {
      if (!lista || lista.tipo !== 'numerada') { cerrarLista(); lista = { tipo: 'numerada', elementos: [] }; }
      lista.elementos.push({ texto: numerada[1] });
      continue;
    }

    if (!t.trim()) { cerrarLista(); continue; }

    cerrarLista();
    bloques.push({ tipo: 'parrafo', texto: t });
  }
  cerrarLista();
  return bloques;
}

/**
 * El texto en trozos con su marca, para pintarlo sin `innerHTML`.
 * Devuelve `[{ texto, negrita, cursiva, tachado, codigo }]`.
 */
export function trozosDe(texto) {
  const t = String(texto ?? '');
  const salida = [];
  /* El orden importa: `**` antes que `*`, o la negrita saldría como dos
     cursivas vacías. */
  const patron = /(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*)/g;
  let ultimo = 0;
  let m = patron.exec(t);
  while (m) {
    if (m.index > ultimo) salida.push({ texto: t.slice(ultimo, m.index) });
    const trozo = m[0];
    if (trozo.startsWith('`')) salida.push({ texto: trozo.slice(1, -1), codigo: true });
    else if (trozo.startsWith('**')) salida.push({ texto: trozo.slice(2, -2), negrita: true });
    else if (trozo.startsWith('~~')) salida.push({ texto: trozo.slice(2, -2), tachado: true });
    else salida.push({ texto: trozo.slice(1, -1), cursiva: true });
    ultimo = m.index + trozo.length;
    m = patron.exec(t);
  }
  if (ultimo < t.length) salida.push({ texto: t.slice(ultimo) });
  return salida.length > 0 ? salida : [{ texto: '' }];
}

/**
 * El índice. *"Si el documento contiene H1/H2/H3, preparar la arquitectura para
 * generar un índice… si técnicamente es sencillo, implementarlo."*
 *
 * Con Markdown lo es: son los bloques de título. `null` cuando no hay ninguno —
 * un índice vacío ocupa sitio y no dice nada.
 */
export function indiceDe(markdown) {
  const titulos = bloquesDe(markdown).filter((b) => b.tipo === 'titulo' && b.texto);
  return titulos.length === 0 ? null : titulos.map((t, i) => ({ n: i + 1, nivel: t.nivel, texto: t.texto }));
}

/** El adelanto de la tarjeta: la primera línea con texto, sin sus marcas.
 *  *"No mostrar una parrafada completa."* */
export function adelantoDe(doc, tope = 90) {
  const bloque = bloquesDe(doc?.contenido).find((b) => b.tipo === 'parrafo' || b.tipo === 'titulo' || b.tipo === 'cita');
  const crudo = bloque ? (bloque.texto || '') : String(doc?.descripcion || '');
  const limpio = trozosDe(crudo).map((t) => t.texto).join('').trim();
  if (!limpio) return '';
  return limpio.length > tope ? `${limpio.slice(0, tope)}…` : limpio;
}

/** El nombre con el que se enseña. Sin título, su primera línea. */
export function nombreDoc(doc) {
  if (!doc) return '';
  if (doc.titulo) return doc.titulo;
  const a = adelantoDe(doc, 60);
  return a || 'Documento sin título';
}

/* ── Búsqueda, filtros y orden ─────────────────────────────────────────────*/
const sinAcentos = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** *"Buscar «Supabase» → encontrar documentos que contengan esa palabra aunque
 *  no aparezca en el título."* Por eso el contenido entero entra. */
export function textoBuscableDoc(doc) {
  return sinAcentos([doc.titulo, doc.descripcion, doc.contenido, doc.categoria, (doc.etiquetas || []).join(' ')].filter(Boolean).join(' '));
}

export const FILTROS_DOCUMENTOS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'favoritos', nombre: 'Favoritos' },
  { id: 'borradores', nombre: 'Borradores' },
  { id: 'archivados', nombre: 'Archivados' },
];

export const ORDENES_DOCUMENTOS = [
  { id: 'modificados', nombre: 'Última modificación' },
  { id: 'recientes', nombre: 'Más recientes' },
  { id: 'antiguos', nombre: 'Más antiguos' },
  { id: 'alfabetico', nombre: 'Alfabético' },
  { id: 'favoritos', nombre: 'Favoritos primero' },
];

export const ORDEN_DOC_POR_DEFECTO = 'modificados';

/** 🚨 *"Los documentos archivados no deben aparecer en la vista principal
 *  activa."* Y salen solo en su filtro, enteros. */
export function filtrarDocumentos(lista = [], { filtro = 'todos', texto = '', etiqueta = '' } = {}) {
  const q = sinAcentos(texto).trim();
  const et = normalizarEtiqueta(etiqueta);
  return (Array.isArray(lista) ? lista : []).filter((d) => {
    if (filtro === 'archivados') {
      if (!d.archivado) return false;
    } else if (d.archivado) {
      return false;
    } else if (filtro === 'favoritos') {
      if (!d.favorito) return false;
    } else if (filtro === 'borradores') {
      if (d.estado !== 'draft') return false;
    }
    if (et && !(d.etiquetas || []).includes(et)) return false;
    if (!q) return true;
    return textoBuscableDoc(d).includes(q);
  });
}

export function ordenarDocumentos(lista = [], orden = ORDEN_DOC_POR_DEFECTO) {
  const base = [...(Array.isArray(lista) ? lista : [])];
  const modificados = (a, b) => String(b.actualizado || '').localeCompare(String(a.actualizado || ''));
  switch (orden) {
    case 'recientes':
      return base.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
    case 'antiguos':
      return base.sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
    case 'alfabetico':
      return base.sort((a, b) => nombreDoc(a).localeCompare(nombreDoc(b), 'es'));
    case 'favoritos':
      return base.sort((a, b) => (Number(b.favorito) - Number(a.favorito)) || modificados(a, b));
    default:
      return base.sort(modificados);
  }
}

/** Todas las etiquetas que él ha usado, para ofrecérselas. Se derivan: una lista
 *  guardada aparte se quedaría con etiquetas de documentos ya borrados. */
export function etiquetasUsadas(lista = []) {
  const cuenta = new Map();
  for (const d of Array.isArray(lista) ? lista : []) {
    if (d.archivado) continue;
    for (const t of d.etiquetas || []) cuenta.set(t, (cuenta.get(t) || 0) + 1);
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).map(([t, n]) => ({ etiqueta: t, veces: n }));
}

/** La línea de arriba. `null` sin ni un documento. */
export function lineaDocumentos(lista = [], archivos = []) {
  const base = (Array.isArray(lista) ? lista : []).filter((d) => !d.archivado);
  const nArchivos = Array.isArray(archivos) ? archivos.length : 0;
  if (base.length === 0 && nArchivos === 0) return null;
  const partes = [];
  if (base.length) partes.push(`${base.length} ${base.length === 1 ? 'documento' : 'documentos'}`);
  if (nArchivos) partes.push(`${nArchivos} ${nArchivos === 1 ? 'archivo' : 'archivos'}`);
  const borradores = base.filter((d) => d.estado === 'draft').length;
  if (borradores) partes.push(`${borradores} ${borradores === 1 ? 'borrador' : 'borradores'}`);
  return partes.join(' · ');
}

/* ── Relaciones futuras ────────────────────────────────────────────────────

   *"Preparar posibilidad de relacionar documentos con ideas, objetivos, metas,
   proyectos y colecciones. **No implementar todas las relaciones si los módulos
   todavía no existen. No crear duplicaciones.**"*

   🚨 Así que **no se añaden cinco campos vacíos**. Lo que hay es esta tabla, que
   dice cuál existe hoy y cuál no: el día que se conecte una, se añade su campo
   —como `tareaId` en Ideas— y no antes. Un campo que nadie puede rellenar es
   media función (regla 8), y son cinco. */
export const RELACIONES_FUTURAS = [
  { con: 'ideas', existe: true, comoSeHaria: 'un `documentoId` en la idea, como su `tareaId` (E3 F19).' },
  { con: 'objetivos', existe: true, comoSeHaria: 'igual que lo hace Ideas al convertir.' },
  { con: 'metas', existe: true, comoSeHaria: 'igual que lo hace Ideas al convertir.' },
  { con: 'proyectos', existe: false, comoSeHaria: 'no hay módulo de proyectos en JosStyle.' },
  { con: 'colecciones', existe: false, comoSeHaria: 'la mini-app Colecciones llega en la BL F7.' },
];

export const relacionFutura = (con) => RELACIONES_FUTURAS.find((r) => r.con === con) || null;

/* ── Las diferencias, dichas en la pantalla ────────────────────────────────

   El enunciado dedica **tres apartados** a separar Documentos de Notas, de
   Guardados y de Ideas, y avisa: *"no permitir que Documentos se convierta
   simplemente en «Notas pero más grandes»"*. */
export const DIFERENCIAS_DOC = [
  { con: 'notas', suyo: 'Una nota se captura de golpe.', esto: 'Un documento se desarrolla y se estructura.' },
  { con: 'guardados', suyo: 'Un guardado conserva algo de fuera.', esto: 'Un documento lo escribes tú.' },
  { con: 'ideas', suyo: 'Una idea está en desarrollo.', esto: 'Un documento es información ya asentada.' },
];

export const EJEMPLO_DIFERENCIA = 'Una especificación, una guía o un plan son documentos; «el examen es el viernes» es una nota.';

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────*/
export const NO_EN_DOCUMENTOS = [
  { que: 'Colecciones', llega: 'BL F7' },
  { que: 'IA, resumen automático y generación de documentos', llega: 'no está previsto en este bloque' },
  { que: 'Colaboración y edición entre varias personas', llega: 'no está previsto: JosStyle es de una sola persona' },
  { que: 'Historial de versiones', llega: 'no está previsto; lo que se guarda son las dos fechas' },
  { que: 'Exportar a PDF', llega: 'no está previsto en este bloque' },
  { que: 'Integraciones externas', llega: 'no está previsto en este bloque' },
];
