// ============================================================================
// EL MOTOR DE PRODUCTOS (nace en EH F17, extraído de EH F10)
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
//
// Lo pide el propio enunciado de la Fase 17, en su condición de finalización:
//
//   *"Este sistema debe diseñarse desde el principio de forma que posteriormente
//   podamos reutilizar exactamente la misma arquitectura de productos para Pelo,
//   Cuerpo, Higiene y otros módulos, **evitando crear cinco catálogos
//   diferentes**."*
//
// La Fase 10 ya construyó esa arquitectura para el pelo: ficha, tiendas,
// afiliación, packs, comparación, alternativas, precio con fecha y valoración.
// Así que lo genérico vive aquí y los módulos aportan **su lista de
// categorías** y **dónde guardan**. Es el cuarto motor extraído en este bloque,
// tras `motorRutinas.js` (F14) y `motorRecomendaciones.js` (F16).
//
// Las 169 pruebas de la Fase 10 son la red que demuestra que no cambió nada.
//
// ── LAS DOS REGLAS QUE NO SE NEGOCIAN ──────────────────────────────────────
//
// ⚠️ **NUNCA UN ENLACE INVENTADO.** Una URL solo se guarda si él la ha dado y
// parece una URL. Construir aquí una búsqueda de Amazon "por si acaso" sería
// inventarse un enlace con otro nombre. Y **el catálogo lo aporta cada módulo,
// vacío** (D2-03): ni productos, ni API, ni cuenta de afiliados inventados.
//
// ⚠️ **NUNCA UNA COMPRA.** El apartado 22 de la Fase 17 lo dice con esas
// palabras: *"nunca comprar, nunca añadir al carrito externamente, nunca elegir
// por el usuario"*. Lo más lejos que llega esto es guardar una URL que él dio.
// ============================================================================

import { uid, todayISO } from './helpers';
import { NIVELES_ESTILO } from './perfilEstilo';

/* ===========================================================================
   1 · DÓNDE SE CONSIGUE (F10 apartado 12 · F17 apartados 4, 5, 6 y 7)
   ===========================================================================
   ⚠️ *"No limitar el sistema a Amazon"* (F17, apartado 5). Amazon es **un tipo
   de tienda más**, y un producto que solo está en la farmacia se recomienda
   igual (apartado 6): *"así Amazon no se convierte en una limitación"*. */

export const TIPOS_TIENDA = [
  { id: 'amazon', nombre: 'Amazon', icono: '📦' },
  { id: 'farmacia', nombre: 'Farmacia', icono: '💊' },
  { id: 'especializada', nombre: 'Tienda especializada', icono: '🏪' },
  { id: 'fabricante', nombre: 'Fabricante', icono: '🏭' },
  { id: 'otra', nombre: 'Otra tienda', icono: '🔗' },
];

export const tipoTienda = (id) => TIPOS_TIENDA.find((t) => t.id === id) || null;

/* ⚠️ **El usuario ve SIEMPRE lo mismo**, lleve el enlace la marca que lleve
   (F10 apartado 12, F17 apartado 7). */
export const ETIQUETA_ENLACE = 'Ver producto';

export const AVISO_AFILIACION =
  'Algunos enlaces pueden ser enlaces de afiliado. Esto puede generar una comisión sin coste adicional para ti.';

/* ⚠️ **D2-03 en una frase, y UNA sola.** La Fase 10 y la Fase 17 la habían
   escrito por separado, palabra por palabra: dos textos idénticos en dos
   archivos es exactamente el segundo sistema que este proyecto no quiere, y el
   día que Josué quisiera cambiarlo habría cambiado la mitad. Vive aquí, donde
   vive la decisión, y los dos módulos la reexportan. */
export const CATALOGO_VACIO_PORQUE =
  'Todavía no hay catálogo: los productos que ves son los que has añadido tú.';

export function normalizarTienda(t) {
  const g = t || {};
  // ⚠️ Aquí es donde se impide el enlace inventado.
  const url = typeof g.url === 'string' && /^https?:\/\/\S+$/i.test(g.url.trim()) ? g.url.trim() : null;
  return {
    tipo: tipoTienda(g.tipo) ? g.tipo : 'otra',
    nombre: (g.nombre || '').trim(),
    url,
    // La distinción existe en el DATO, no en la pantalla.
    afiliado: g.afiliado === true,
  };
}

/* ===========================================================================
   2 · LA FICHA
   ===========================================================================
   ⚠️ **Solo el nombre es obligatorio.** Los dos enunciados insisten en no
   obligarle a rellenar doce campos para apuntar una crema. */

export const ESTADOS_PRODUCTO = [
  { id: 'disponible', nombre: 'Disponible' },
  { id: 'no_disponible', nombre: 'Actualmente no disponible', aviso: true },
  { id: 'descatalogado', nombre: 'Descatalogado', aviso: true },
];

export const estadoProducto = (id) => ESTADOS_PRODUCTO.find((e) => e.id === id) || null;

/**
 * `categoriaValida(id)` la aporta cada módulo desde su propia lista: el motor no
 * sabe qué es un "champú" ni qué es un "contorno de ojos".
 *
 * `extra(p)` es para los campos propios de un módulo — y **entonces es ese
 * módulo quien tiene que normalizarlos**, o el siguiente guardado se los lleva
 * (regla 5). Van quince veces en este proyecto.
 */
export function normalizarProductoGenerico(g, { categoriaValida, extra = null } = {}) {
  const p = g || {};
  const valoracion = Number(p.valoracion);
  const base = {
    id: p.id || uid(),
    nombre: (p.nombre || '').trim(),
    marca: (p.marca || '').trim(),
    categoria: categoriaValida(p.categoria) ? p.categoria : null,
    descripcion: (p.descripcion || '').trim(),
    paraQue: (p.paraQue || '').trim(),
    caracteristicas: (Array.isArray(p.caracteristicas) ? p.caracteristicas : [])
      .map((c) => String(c).trim()).filter(Boolean),
    nivel: NIVELES_ESTILO.some((n) => n.id === p.nivel) ? p.nivel : null,
    /* ⚠️ *"Si el precio puede cambiar, no tratarlo como un dato permanente"*
       (F10 apartado 16, F17 apartado 19). Por eso viaja con la fecha en la que
       se anotó, y se re-sella al cambiarlo. */
    precio: Number.isFinite(Number(p.precio)) && Number(p.precio) > 0 ? Number(p.precio) : null,
    precioAnotado: typeof p.precioAnotado === 'string' ? p.precioAnotado : null,
    tiendas: (Array.isArray(p.tiendas) ? p.tiendas : []).map(normalizarTienda),
    estado: estadoProducto(p.estado) ? p.estado : 'disponible',
    mio: p.mio === true,
    favorito: p.favorito === true,
    valoracion: Number.isInteger(valoracion) && valoracion >= 1 && valoracion <= 5 ? valoracion : null,
    opinion: (p.opinion || '').trim(),
    notaPersonal: (p.notaPersonal || '').trim(),
    origen: p.origen === 'catalogo' ? 'catalogo' : 'propio',
    creadoEn: p.creadoEn || null,
  };
  return extra ? { ...base, ...extra(p) } : base;
}

/** Mismo nombre y misma marca es el mismo producto, aunque cambien las mayúsculas. */
export const mismoProducto = (a, b) =>
  a.nombre.toLowerCase() === String(b.nombre || '').trim().toLowerCase()
  && a.marca.toLowerCase() === String(b.marca || '').trim().toLowerCase();

/* ===========================================================================
   3 · LOS ENLACES (F17 apartados 4, 6 y 7)
   ===========================================================================
   ⚠️ *"Si no está en Amazon, la aplicación debe seguir pudiendo
   recomendarlo"*. Y el aviso de transparencia sale **solo si alguno es de
   afiliado**: ponerlo donde no hay afiliación es tan poco honesto como quitarlo
   donde sí la hay. */

export function enlacesDeProducto(producto) {
  const p = producto;
  if (!p) return { enlaces: [], hayAfiliado: false, aviso: '', sinEnlaces: true, sinEnlacesTexto: '', donde: [] };
  const conUrl = (p.tiendas || []).filter((t) => t.url);
  return {
    enlaces: conUrl.map((t) => ({
      // El usuario ve siempre la misma etiqueta, lleve el enlace la marca que lleve.
      etiqueta: ETIQUETA_ENLACE,
      tienda: t.nombre || tipoTienda(t.tipo)?.nombre || 'Tienda',
      tipo: t.tipo,
      icono: tipoTienda(t.tipo)?.icono || '🔗',
      url: t.url,
      afiliado: t.afiliado,
    })),
    /* ⚠️ F17, apartado 6 — *"si no está en Amazon, la aplicación debe seguir
       pudiendo recomendarlo"*. Dónde conseguirlo existe aunque no haya enlace:
       "Disponible en farmacia" es una respuesta completa. */
    donde: (p.tiendas || []).map((t) => t.nombre || tipoTienda(t.tipo)?.nombre).filter(Boolean),
    hayAfiliado: conUrl.some((t) => t.afiliado),
    aviso: conUrl.some((t) => t.afiliado) ? AVISO_AFILIACION : '',
    sinEnlaces: conUrl.length === 0,
    // ⚠️ Regla 8: si no hay enlace, se dice — no se fabrica uno.
    sinEnlacesTexto: conUrl.length === 0 && (p.tiendas || []).length > 0
      ? 'No has guardado ningún enlace para este producto.'
      : (conUrl.length === 0 ? 'Sin tienda ni enlace guardados.' : ''),
  };
}

/* ===========================================================================
   4 · ALTERNATIVAS (F10 apartado 10 · F17 apartado 18)
   ===========================================================================
   ⚠️ *"Las alternativas deben respetar los mismos criterios relevantes."* Y una
   que tampoco esté disponible **no se ofrece**: sería cambiar un problema por
   el mismo problema. */

export function alternativasGenericas(productos, id) {
  const p = productos.find((x) => x.id === id);
  if (!p) return [];
  return productos.filter((x) => (
    x.id !== id
    && x.estado === 'disponible'
    && x.categoria === p.categoria
    && p.categoria !== null
  ));
}

/* ===========================================================================
   5 · BUSCAR Y FILTRAR (F17 apartados 10 y 11)
   ===========================================================================
   ⚠️ *"No obligar a utilizar filtros."* Sin filtros salen todos, y sin texto
   también: los dos son opcionales, y el defecto es no esconder nada. */

const sinTildes = (s) => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

export function buscarProductos(productos, texto) {
  const q = sinTildes(texto).trim();
  if (!q) return productos;
  return productos.filter((p) => [p.nombre, p.marca, p.descripcion, p.paraQue, ...(p.caracteristicas || [])]
    .some((campo) => sinTildes(campo).includes(q)));
}

export function filtrarProductos(productos, filtros = {}) {
  const f = filtros || {};
  return productos.filter((p) => {
    if (f.categoria && p.categoria !== f.categoria) return false;
    if (f.marca && p.marca.toLowerCase() !== String(f.marca).toLowerCase()) return false;
    if (f.nivel && p.nivel !== f.nivel) return false;
    if (f.tienda && !(p.tiendas || []).some((t) => t.tipo === f.tienda)) return false;
    if (f.soloMios && !p.mio) return false;
    if (f.soloFavoritos && !p.favorito) return false;
    if (f.soloDisponibles && p.estado !== 'disponible') return false;
    // ⚠️ Un producto SIN precio no se cae de un filtro de precio: no sabemos
    // cuánto cuesta, y esconderlo sería afirmar que es caro.
    if (Number.isFinite(f.precioMax) && p.precio !== null && p.precio > f.precioMax) return false;
    return true;
  });
}

/** ⚠️ Solo se ofrecen las categorías que él usa (F17, apartado 2). */
export function categoriasEnUso(productos, catalogoCategorias) {
  const usadas = new Set(productos.map((p) => p.categoria).filter(Boolean));
  return catalogoCategorias.filter((c) => usadas.has(c.id));
}

/* ===========================================================================
   6 · COMPARAR (F10 apartado 6 · F17 apartado 15)
   ===========================================================================
   ⚠️ **La comparación no elige.** Ni "mejor", ni una puntuación, ni un ganador:
   enseña las diferencias para que decida él. */

export const MAX_COMPARAR = 3;

/* ⚠️ **Las FILAS son de cada fase, no del motor.** La Fase 10 dibuja cuatro
   (Tipo, Nivel, Precio, Características) y la 17 dibuja cinco (Objetivo, Tipo,
   Nivel, Precio, Tienda): son dos tablas distintas en dos enunciados distintos,
   y forzarlas a compartir una sola habría sido inventarse una tabla que no pide
   ninguno de los dos. Lo que sí se comparte es la REGLA: un tope de tres, y
   **lo que no se sabe sale como una raya, nunca como un cero ni como un
   "peor"**. */
export function compararGenerico(productos, ids, columnas, { maximo = MAX_COMPARAR } = {}) {
  return ids.slice(0, maximo)
    .map((id) => productos.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => Object.fromEntries(
      Object.entries(columnas).map(([campo, leer]) => [campo, leer(p) || '—']),
    ));
}

/* ===========================================================================
   7 · PACKS (F10 apartado 14 · F17 apartados 16 y 17)
   ===========================================================================
   ⚠️ *"No se compra automáticamente"* (apartado 17). El pack sugerido **sugiere
   y no crea**; crearlo es otra llamada, y esa la hace él. */

export function normalizarPackGenerico(g) {
  const p = g || {};
  return {
    id: p.id || uid(),
    nombre: (p.nombre || '').trim() || 'Pack',
    // `productoIds`, el nombre que ya usaba la Fase 10: cambiárselo habría roto
    // los packs que Josué ya tuviera guardados, a cambio de nada.
    productoIds: [...new Set((Array.isArray(p.productoIds) ? p.productoIds : []).filter((x) => typeof x === 'string'))],
    creadoEn: p.creadoEn || null,
  };
}

/**
 * ⚠️ El pack se resuelve contra los productos ACTUALES: uno que él borró
 * desaparece del pack solo, sin dejar un hueco ni un id fantasma.
 */
export function verPackGenerico(packs, productos, packId) {
  const pack = packs.find((p) => p.id === packId);
  if (!pack) return null;
  const dentro = pack.productoIds.map((id) => productos.find((p) => p.id === id)).filter(Boolean);
  return {
    ...pack,
    items: dentro,
    total: dentro.length,
    // Los que tenían precio, para que la suma no mienta.
    precio: dentro.some((p) => p.precio !== null)
      ? dentro.reduce((s, p) => s + (p.precio || 0), 0) : null,
    conPrecio: dentro.filter((p) => p.precio !== null).length,
    // ⚠️ Se dice si la suma está incompleta, en vez de dar un total falso.
    sumaParcial: dentro.some((p) => p.precio === null),
    // Apartado 16 — él marca lo que ya tiene; el pack no lo decide.
    yaTengo: dentro.filter((p) => p.mio).map((p) => p.id),
  };
}

/* ===========================================================================
   8 · LO QUE ESTE MOTOR NO HACE, DECLARADO
   =========================================================================== */

export function auditarMotorProductos() {
  return {
    // D2-03 — el catálogo lo aporta cada módulo, y está vacío.
    catalogoPropio: 0,
    // Apartado 22 — nunca una compra.
    compra: 0,
    carrito: 0,
    pago: 0,
    // Nunca un enlace inventado.
    urlsEnCodigo: 0,
    // Y sin IA, como todo el bloque.
    usaIA: 0,
    tiposDeTienda: TIPOS_TIENDA.length,
    etiquetaUnica: ETIQUETA_ENLACE,
  };
}

export { todayISO };
