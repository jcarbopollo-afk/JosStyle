// ============================================================================
// ENTREGA 3 · FASE 17 (BL F2) — BIBLIOTECA: LIBROS
//
// *"Crear una biblioteca personal de libros… debe ser visual y agradable, **no
// un gestor bibliográfico complejo**."*
//
// La BL F1 dejó la mini-app con el modelo mínimo —título, autor y fecha— para
// que su botón de crear escribiera algo de verdad. Ésta la desarrolla entera:
// estados, progreso, portada, notas, filtros, búsqueda, orden, historial y
// estadísticas básicas.
//
// 🚨 **`crearLibro` y `normalizarLibro` SE MUDAN AQUÍ, no se duplican.** Vivían
// en `biblioteca.js` desde la F1; escribir una segunda fábrica habría dejado dos
// formas del mismo libro conviviendo, y la que perdiera se llevaría campos en el
// siguiente guardado (regla 5). `biblioteca.js` las importa y las reexporta —con
// `export { X }`, nunca `export … from`, que **no crea binding local** (EH F17).
// ============================================================================

import { uid, fechaLocalISO, fechaValida } from './helpers.js';

/* ── Los cuatro estados ────────────────────────────────────────────────────

   ⚠️ **El icono nunca va solo** (EH F42): cada estado trae su `nombre`, porque
   quien no distingue los colores ni interpreta un emoji necesita la palabra. */
export const ESTADOS_LIBRO = [
  { id: 'por_leer', nombre: 'Por leer', icono: '📖', que: 'Todavía no empezado.' },
  { id: 'leyendo', nombre: 'Leyendo', icono: '📚', que: 'Ahora mismo en marcha.' },
  { id: 'terminado', nombre: 'Terminado', icono: '✓', que: 'Lectura acabada.' },
  { id: 'pausado', nombre: 'Pausado', icono: '⏸️', que: 'Parado por ahora.' },
];

export const estadoLibro = (id) => ESTADOS_LIBRO.find((e) => e.id === id) || null;
export const ESTADO_POR_DEFECTO = 'por_leer';

/* ── El modelo ─────────────────────────────────────────────────────────────

   El enunciado enumera trece campos. Doce son del libro; el decimotercero,
   `user_id`, **no se guarda aquí**: `app_data` tiene una fila por (usuario,
   clave) y sus cuatro políticas son `auth.uid() = user_id`, así que el
   aislamiento ya está y guardarlo dentro sería una copia que puede mentir.

   ⚠️ **`portada` es un CAMINO del bucket, no una URL.** Las URLs firmadas
   caducan en una hora: guardar una sería guardar algo que deja de funcionar
   mientras Josué duerme. La firma se pide al pintar, como en los archivos de la
   Biblioteca y las fotos de Salud. */
export const CAMPOS_LIBRO = [
  'id', 'titulo', 'autor', 'portada', 'totalPaginas', 'paginaActual',
  'estado', 'inicio', 'fin', 'nota', 'fecha', 'actualizado',
];

export const MAX_TITULO_LIBRO = 200;
export const MAX_PAGINAS = 100000;

export const tituloDeLibroValido = (t) =>
  typeof t === 'string' && t.trim().length > 0 && t.trim().length <= MAX_TITULO_LIBRO;

/** Un número de páginas válido, o `null`. **`null` no es cero** (EH F32 y F60):
 *  *"no sé cuántas páginas tiene"* y *"tiene cero páginas"* son dos cosas, y
 *  solo la primera existe. */
export function paginasValidas(n) {
  if (n === null || n === undefined || n === '') return null;
  const num = Number(n);
  if (!Number.isInteger(num) || num <= 0 || num > MAX_PAGINAS) return null;
  return num;
}

export function crearLibro({
  titulo, autor = '', portada = null, totalPaginas = null, paginaActual = null,
  estado = ESTADO_POR_DEFECTO, inicio = null, fin = null, nota = '',
} = {}) {
  if (!tituloDeLibroValido(titulo)) return null;
  const hoy = fechaLocalISO(new Date());
  const total = paginasValidas(totalPaginas);
  const est = estadoLibro(estado) ? estado : ESTADO_POR_DEFECTO;
  return {
    id: uid(),
    titulo: titulo.trim(),
    autor: typeof autor === 'string' ? autor.trim() : '',
    portada: typeof portada === 'string' && portada ? portada : null,
    totalPaginas: total,
    paginaActual: acotarPagina(paginasValidas(paginaActual), total),
    estado: est,
    /* ⚠️ Empezar un libro pone su fecha de inicio; los demás estados no la
       inventan. Poner "hoy" a un libro *Por leer* sería decir que lo empezó. */
    inicio: fechaValida(inicio) ? inicio : (est === 'leyendo' ? hoy : null),
    fin: fechaValida(fin) ? fin : (est === 'terminado' ? hoy : null),
    nota: typeof nota === 'string' ? nota.trim() : '',
    fecha: hoy,
    actualizado: hoy,
  };
}

/** La página actual nunca pasa del total. *"Nunca permitir visualmente más de
 *  100 %"*, y la forma de cumplirlo es que el dato no pueda salirse. */
function acotarPagina(pagina, total) {
  if (pagina === null) return null;
  if (total === null) return pagina;
  return Math.min(pagina, total);
}

export function normalizarLibro(l) {
  if (!l || typeof l !== 'object') return null;
  const titulo = typeof l.titulo === 'string' ? l.titulo.trim() : '';
  if (!titulo) return null;
  const total = paginasValidas(l.totalPaginas);
  const estado = estadoLibro(l.estado) ? l.estado : ESTADO_POR_DEFECTO;
  return {
    id: l.id || uid(),
    titulo,
    autor: typeof l.autor === 'string' ? l.autor : '',
    portada: typeof l.portada === 'string' && l.portada ? l.portada : null,
    totalPaginas: total,
    paginaActual: acotarPagina(paginasValidas(l.paginaActual), total),
    estado,
    inicio: fechaValida(l.inicio) ? l.inicio : null,
    fin: fechaValida(l.fin) ? l.fin : null,
    nota: typeof l.nota === 'string' ? l.nota : '',
    fecha: fechaValida(l.fecha) ? l.fecha : fechaLocalISO(new Date()),
    actualizado: fechaValida(l.actualizado) ? l.actualizado : (fechaValida(l.fecha) ? l.fecha : fechaLocalISO(new Date())),
  };
}

/* ── El progreso ───────────────────────────────────────────────────────────

   🚨 **Sin total de páginas NO hay porcentaje**, y devuelve `null` — no un 0 %.
   Un cero diría *"no ha leído nada"* de un libro cuyo tamaño simplemente no
   conocemos. Es la lección de E3 F13 y EH F35. */
export function progresoDe(libro) {
  if (!libro) return null;
  const total = paginasValidas(libro.totalPaginas);
  if (total === null) return null;
  const actual = acotarPagina(paginasValidas(libro.paginaActual), total) ?? 0;
  return {
    paginas: actual,
    total,
    porcentaje: Math.min(100, Math.round((actual / total) * 100)),
  };
}

/** El texto del progreso, o `null` si no se puede saber. */
export function textoProgreso(libro) {
  const p = progresoDe(libro);
  if (!p) return null;
  return `${p.paginas} / ${p.total} páginas · ${p.porcentaje} %`;
}

/* ── Las cuatro operaciones que cambian un libro ───────────────────────────

   Todas devuelven **un libro nuevo**, nunca modifican el que reciben, y todas
   suben `actualizado`: es lo que hace que *"Continuar leyendo"* enseñe el que
   tocó por última vez, sin guardar un contador aparte. */
const tocado = (libro, cambios) => ({ ...libro, ...cambios, actualizado: fechaLocalISO(new Date()) });

export function actualizarPagina(libro, pagina) {
  if (!libro) return null;
  const total = paginasValidas(libro.totalPaginas);
  const n = paginasValidas(pagina);
  if (n === null) return libro;
  return tocado(libro, { paginaActual: acotarPagina(n, total) });
}

/**
 * ⚠️ Cambiar a *Leyendo* pone la fecha de inicio **si estaba vacía**, y nunca
 * la pisa: volver a un libro después de una pausa no reescribe cuándo lo
 * empezó. Y salir de *Terminado* no borra la fecha de fin — *"no borrar
 * información de lectura anterior"*.
 */
export function cambiarEstado(libro, estado) {
  if (!libro || !estadoLibro(estado)) return libro || null;
  if (estado === 'terminado') return marcarTerminado(libro);
  const hoy = fechaLocalISO(new Date());
  return tocado(libro, {
    estado,
    inicio: estado === 'leyendo' && !libro.inicio ? hoy : libro.inicio,
  });
}

/**
 * 🚨 *"Estado → Terminado. Progreso → 100 %. Fecha de finalización → hoy si
 * está vacía. **No borrar información de lectura anterior.**"*
 *
 * El 100 % se consigue poniendo la página actual en el total, no guardando un
 * porcentaje: el porcentaje se deriva, y guardarlo sería la copia que miente en
 * cuanto él corrija el número de páginas.
 *
 * ⚠️ Y si el libro **no tiene total de páginas**, no se inventa uno: se queda
 * terminado sin porcentaje, que es la verdad.
 */
export function marcarTerminado(libro) {
  if (!libro) return null;
  const hoy = fechaLocalISO(new Date());
  const total = paginasValidas(libro.totalPaginas);
  return tocado(libro, {
    estado: 'terminado',
    paginaActual: total === null ? libro.paginaActual : total,
    inicio: libro.inicio,
    fin: libro.fin || hoy,
  });
}

/** Editar. Solo toca los campos que llegan; lo demás se conserva. */
export function editarLibro(libro, cambios = {}) {
  if (!libro) return null;
  const propuesta = { ...libro, ...cambios };
  const normalizado = normalizarLibro(propuesta);
  if (!normalizado) return libro; // un título en blanco no borra el libro
  return { ...normalizado, id: libro.id, fecha: libro.fecha, actualizado: fechaLocalISO(new Date()) };
}

/* ── El resumen de arriba ──────────────────────────────────────────────────

   *"3 leyendo · 8 pendientes · 12 terminados. **Los números deben proceder de
   datos reales.**"* Se cuentan en el momento: ni un contador guardado. */
export function resumenLibros(libros = []) {
  const lista = Array.isArray(libros) ? libros : [];
  const cuenta = (id) => lista.filter((l) => l.estado === id).length;
  return {
    total: lista.length,
    leyendo: cuenta('leyendo'),
    porLeer: cuenta('por_leer'),
    terminados: cuenta('terminado'),
    pausados: cuenta('pausado'),
  };
}

/** La línea del resumen, o `null` sin ni un libro: *"no inventar números"*. */
export function lineaResumen(libros = []) {
  const r = resumenLibros(libros);
  if (r.total === 0) return null;
  const partes = [];
  if (r.leyendo) partes.push(`${r.leyendo} leyendo`);
  if (r.porLeer) partes.push(`${r.porLeer} ${r.porLeer === 1 ? 'pendiente' : 'pendientes'}`);
  if (r.terminados) partes.push(`${r.terminados} ${r.terminados === 1 ? 'terminado' : 'terminados'}`);
  if (r.pausados) partes.push(`${r.pausados} ${r.pausados === 1 ? 'pausado' : 'pausados'}`);
  return partes.join(' · ');
}

/* ── "Continuar leyendo" ───────────────────────────────────────────────────

   *"Si existe un libro con estado LEYENDO, mostrarlo destacado."* El que sale
   es **el que tocó más recientemente**, que se deriva de `actualizado`.
   `null` si no está leyendo ninguno: la tarjeta entonces no existe, no sale
   vacía (EH F25 — apagado y vacío son dos cosas). */
export function libroActual(libros = []) {
  const leyendo = (Array.isArray(libros) ? libros : []).filter((l) => l.estado === 'leyendo');
  if (leyendo.length === 0) return null;
  return [...leyendo].sort((a, b) => String(b.actualizado || '').localeCompare(String(a.actualizado || '')))[0];
}

/* ── Filtros, búsqueda y orden ─────────────────────────────────────────────

   ⚠️ Los filtros salen de `ESTADOS_LIBRO`, no de una segunda lista: renombrar
   un estado renombraría su pastilla sola. */
export const FILTROS_LIBROS = [
  { id: 'todos', nombre: 'Todos' },
  ...ESTADOS_LIBRO.map((e) => ({ id: e.id, nombre: e.nombre })),
];

export const ORDENES_LIBROS = [
  { id: 'recientes', nombre: 'Recientes' },
  { id: 'titulo', nombre: 'Título' },
  { id: 'autor', nombre: 'Autor' },
  { id: 'progreso', nombre: 'Progreso' },
];

export const ordenLibros = (id) => ORDENES_LIBROS.find((o) => o.id === id) || null;

/** Busca por título y autor, sin acentos ni mayúsculas. */
const normalizarTexto = (t) =>
  String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function filtrarLibros(libros = [], { estado = 'todos', texto = '' } = {}) {
  const q = normalizarTexto(texto).trim();
  return (Array.isArray(libros) ? libros : []).filter((l) => {
    if (estado !== 'todos' && l.estado !== estado) return false;
    if (!q) return true;
    return normalizarTexto(`${l.titulo} ${l.autor}`).includes(q);
  });
}

export function ordenarLibros(libros = [], orden = 'recientes') {
  const lista = [...(Array.isArray(libros) ? libros : [])];
  switch (orden) {
    case 'titulo':
      return lista.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    case 'autor':
      /* ⚠️ Un libro sin autor va al final, no al principio: la cadena vacía
         ordena antes que cualquier letra y llenaría la cabeza de la lista. */
      return lista.sort((a, b) => {
        if (!a.autor && !b.autor) return a.titulo.localeCompare(b.titulo, 'es');
        if (!a.autor) return 1;
        if (!b.autor) return -1;
        return a.autor.localeCompare(b.autor, 'es');
      });
    case 'progreso':
      return lista.sort((a, b) => (progresoDe(b)?.porcentaje ?? -1) - (progresoDe(a)?.porcentaje ?? -1));
    default:
      return lista.sort((a, b) => String(b.actualizado || '').localeCompare(String(a.actualizado || '')));
  }
}

/* ── Estadísticas básicas e historial ──────────────────────────────────────

   *"No crear todavía estadísticas avanzadas."* Así que son tres números y una
   lista, todos derivados.

   🚨 **Las páginas leídas solo cuentan lo que se puede contar**: un libro sin
   total no aporta, y se dice cuántos quedan fuera. Estimar sus páginas sería
   inventar un dato (E3 F13). */
export function estadisticasLectura(libros = []) {
  const lista = Array.isArray(libros) ? libros : [];
  const medibles = lista.filter((l) => progresoDe(l) !== null);
  const paginasLeidas = medibles.reduce((a, l) => a + (progresoDe(l)?.paginas || 0), 0);
  const terminados = lista.filter((l) => l.estado === 'terminado');
  const conFechas = terminados.filter((l) => l.inicio && l.fin);
  return {
    paginasLeidas,
    sinContar: lista.length - medibles.length,
    terminados: terminados.length,
    /* ⚠️ Los días de lectura solo salen de los libros que tienen las dos
       fechas. Sin ellas no se estima nada. */
    diasDeLectura: conFechas.length === 0 ? null : conFechas.reduce((a, l) => {
      const d = Math.round((new Date(l.fin) - new Date(l.inicio)) / 86400000);
      return a + Math.max(0, d) + 1;
    }, 0),
    conFechas: conFechas.length,
  };
}

/**
 * El historial: los terminados, del más reciente al más antiguo.
 * *"No borrar los libros terminados automáticamente."* — no hay ninguna función
 * que los quite, y ésa es la forma de cumplirlo.
 */
export function historialLectura(libros = []) {
  return (Array.isArray(libros) ? libros : [])
    .filter((l) => l.estado === 'terminado')
    .sort((a, b) => String(b.fin || '').localeCompare(String(a.fin || '')));
}

/* ── Portadas ──────────────────────────────────────────────────────────────

   *"Si el proyecto ya dispone de almacenamiento de imágenes: **utilizarlo. No
   crear otro sistema de almacenamiento.**"*

   El bucket `biblioteca` existe desde la Fase 11 y es el que ya usan los PDF,
   los vídeos y las fotos: mismo modelo de acceso —privado, una carpeta por
   usuario, URL firmada de una hora—, así que las portadas van ahí. Ni un bucket
   nuevo, ni un bloque de SQL que Josué tenga que ejecutar. */
export const ALMACEN_PORTADAS = {
  bucket: 'biblioteca',
  subir: 'uploadBibliotecaArchivo',
  firmar: 'getSignedBibliotecaUrl',
  borrar: 'deleteBibliotecaArchivo',
  nuevo: false,
  porque: 'el bucket privado de la Biblioteca existe desde la Fase 11 y tiene el mismo modelo de acceso.',
};

export const TIPOS_PORTADA = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_PORTADA_MB = 8;

/** Comprueba un archivo de portada **antes** de subirlo, y dice qué corregir —
 *  nunca "Error" a secas (EH F62). */
export function revisarPortada(file) {
  if (!file) return 'Elige una imagen para la portada.';
  const tipo = String(file.type || '').toLowerCase();
  if (tipo && !TIPOS_PORTADA.includes(tipo)) return 'La portada tiene que ser una imagen (JPG, PNG o WEBP).';
  if (file.size > MAX_PORTADA_MB * 1024 * 1024) return `La imagen pesa más de ${MAX_PORTADA_MB} MB. Elige una más pequeña.`;
  return null;
}

/* ── Un libro sin portada no es un libro roto ──────────────────────────────

   *"No bloquear el funcionamiento si el usuario no añade portada."* La tarjeta
   dibuja sus iniciales, que es información de verdad y no una imagen inventada. */
export function inicialesDe(libro) {
  const base = String(libro?.titulo || '').trim();
  if (!base) return '';
  return base.split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────*/
export const NO_EN_LIBROS = [
  { que: 'Notas globales, Guardados, Ideas, Documentos y Colecciones', llega: 'BL F3 a F7' },
  { que: 'Recomendaciones con IA', llega: 'no está previsto en este bloque' },
  { que: 'Escáner de ISBN', llega: 'no está previsto en este bloque' },
  { que: 'Integración con servicios externos de libros', llega: 'no está previsto en este bloque' },
  { que: 'Estadísticas avanzadas', llega: 'BL F8' },
];

/* ⚠️ **La nota es DEL LIBRO, no de la mini-app Notas** (enunciado, apartado de
   notas): *"no crear todavía el sistema global de Notas. Estas notas pertenecen
   al libro."* Es un campo suyo, y por eso borrar el libro se la lleva. Cuando
   una fase futura quiera enlazarlas con Notas, el sitio está. */
export const NOTA_ES_DEL_LIBRO = {
  campo: 'nota',
  porque: 'el enunciado lo dice: la nota pertenece al libro, no a la mini-app Notas.',
  futuro: 'una fase futura podrá relacionarla con Notas; hoy no se copia nada allí.',
};
