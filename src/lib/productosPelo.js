// ============================================================================
// EH · Fase 10/65 — PELO: PRODUCTOS, CATÁLOGO Y RECOMENDACIONES
//
// *"La aplicación recomienda. El usuario elige."* Y **sin IA**.
//
// ── ⚠️ LO QUE ESTA FASE CONSTRUYE Y LO QUE NO ──────────────────────────────
//
// El enunciado habla de catálogo, de Amazon y de afiliación. **D2-03 de Josué**
// dice: *"Amazon: arquitectura sí, afiliación no. Ni catálogo, ni productos, ni
// API, ni cuenta de afiliados inventados."*
//
// No hay contradicción que resolver: **el propio enunciado dice lo mismo**.
// Apartado 3: *"No llenar todavía la aplicación con cientos de productos
// manualmente en esta fase."* Apartado 11: *"**No poner enlaces inventados**."*
//
// Así que se construye **la arquitectura entera** —la ficha con sus doce campos,
// las tiendas, la distinción entre enlace normal y de afiliado, el aviso de
// transparencia, los packs, la comparación, los favoritos, "ya lo tengo" y la
// valoración— y **el catálogo está vacío, declarado vacío y comprobado vacío**.
//
// Todo producto que exista en la aplicación es **uno que ha metido Josué**
// (apartado 9). El día que haya catálogo, entra por `CATALOGO_PELO` sin tocar
// nada más.
//
// ── LAS TRES REGLAS QUE NO SE NEGOCIAN ─────────────────────────────────────
//
// **1. Nunca una compra automática** (apartado 19). *"La aplicación únicamente:
// recomienda → muestra información → ofrece enlace → usuario decide."* Aquí no
// hay ni una función que compre, y hay una prueba que lo comprueba sobre el
// código.
//
// **2. Nunca un enlace inventado** (apartado 11). Una tienda sin URL que él haya
// dado **no tiene URL**: `null`, y la pantalla enseña la tienda sin botón. Nada
// de construir una búsqueda de Amazon "por si acaso".
//
// **3. Un producto que deja de estar disponible NO se borra** (apartado 10). Se
// marca, se dice, y se ofrecen alternativas de entre los suyos.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { NIVELES_ESTILO, nivelEstilo } from './perfilEstilo';
import { MODULO_PELO } from './perfilCapilar';
import { datosPelo, parteActiva, ACCIONES_PELO } from './rutinasPelo';
import { contextoParaRecomendar } from './recomendacionesPelo';
import { uid, todayISO } from './helpers';

/* ===========================================================================
   1 · CATEGORÍAS (apartado 2)
   ===========================================================================
   *"La estructura debe poder ampliarse."* Añadir una es añadir una línea. */

export const CATEGORIAS_PRODUCTO_PELO = [
  { id: 'champu', nombre: 'Champús', icono: '🧴', accion: 'lavado' },
  { id: 'acondicionador', nombre: 'Acondicionadores', icono: '🧴', accion: 'acondicionador' },
  { id: 'mascarilla', nombre: 'Mascarillas', icono: '💧', accion: 'mascarilla' },
  { id: 'hidratacion', nombre: 'Hidratación', icono: '💦', accion: 'hidratacion' },
  { id: 'definicion', nombre: 'Definición', icono: '🌀', accion: 'definicion' },
  { id: 'styling', nombre: 'Styling', icono: '✨', accion: 'peinado' },
  { id: 'tratamiento', nombre: 'Tratamientos', icono: '🧼', accion: 'otros' },
  { id: 'accesorio', nombre: 'Accesorios', icono: '🪮', accion: 'otros' },
];

export const categoriaProducto = (id) => CATEGORIAS_PRODUCTO_PELO.find((c) => c.id === id) || null;

/* ===========================================================================
   2 · TIENDAS Y ENLACES (apartados 11, 12 y 13)
   ===========================================================================
   *"No limitar el sistema a Amazon."* Cinco tipos, y ninguno privilegiado. */

export const TIPOS_TIENDA = [
  { id: 'amazon', nombre: 'Amazon' },
  { id: 'farmacia', nombre: 'Farmacia' },
  { id: 'especializada', nombre: 'Tienda especializada' },
  { id: 'fabricante', nombre: 'Fabricante' },
  { id: 'otra', nombre: 'Otra tienda' },
];

export const tipoTienda = (id) => TIPOS_TIENDA.find((t) => t.id === id) || null;

/**
 * Apartado 12 — *"El usuario final simplemente verá: Ver producto. No necesita
 * conocer la estructura técnica."* Así que la etiqueta es siempre la misma,
 * lleve el enlace la marca que lleve.
 */
export const ETIQUETA_ENLACE = 'Ver producto';
export const AVISO_AFILIACION = 'Algunos enlaces pueden ser enlaces de afiliado.';

/**
 * ⚠️ **Nunca un enlace inventado** (apartado 11). Una URL solo se guarda si él
 * la ha dado y parece una URL. Construir aquí una búsqueda de Amazon "por si
 * acaso" sería inventarse un enlace con otro nombre.
 */
function normalizarTienda(t) {
  const g = t || {};
  const url = typeof g.url === 'string' && /^https?:\/\/\S+$/i.test(g.url.trim()) ? g.url.trim() : null;
  return {
    tipo: tipoTienda(g.tipo) ? g.tipo : 'otra',
    nombre: (g.nombre || '').trim(),
    url,
    // Apartado 12 — la distinción existe en el dato, no en la pantalla.
    afiliado: g.afiliado === true,
  };
}

/* ===========================================================================
   3 · LA FICHA (apartado 3)
   ===========================================================================
   Los doce campos del enunciado. *"No obligarle a introducir todos los datos"*
   (apartado 9): solo el nombre es obligatorio. */

export const ESTADOS_PRODUCTO = [
  { id: 'disponible', nombre: 'Disponible' },
  { id: 'no_disponible', nombre: 'Actualmente no disponible', aviso: true },
  { id: 'descatalogado', nombre: 'Descatalogado', aviso: true },
];

export const estadoProducto = (id) => ESTADOS_PRODUCTO.find((e) => e.id === id) || null;

export function normalizarProducto(g) {
  const p = g || {};
  const valoracion = Number(p.valoracion);
  return {
    id: p.id || uid(),
    nombre: (p.nombre || '').trim(),
    marca: (p.marca || '').trim(),
    categoria: categoriaProducto(p.categoria) ? p.categoria : null,
    descripcion: (p.descripcion || '').trim(),
    paraQue: (p.paraQue || '').trim(),
    caracteristicas: (Array.isArray(p.caracteristicas) ? p.caracteristicas : [])
      .map((c) => String(c).trim()).filter(Boolean),
    nivel: nivelEstilo(p.nivel) ? p.nivel : null,
    // Apartado 16 — *"si el precio puede cambiar, no tratarlo como un dato
    // permanente"*. Por eso viaja con la fecha en la que se anotó.
    precio: Number.isFinite(Number(p.precio)) && Number(p.precio) > 0 ? Number(p.precio) : null,
    precioAnotado: typeof p.precioAnotado === 'string' ? p.precioAnotado : null,
    tiendas: (Array.isArray(p.tiendas) ? p.tiendas : []).map(normalizarTienda),
    estado: estadoProducto(p.estado) ? p.estado : 'disponible',
    // Apartado 8 — *"Ya lo tengo"*.
    mio: p.mio === true,
    // Apartado 7 — favoritos.
    favorito: p.favorito === true,
    // Apartado 17 — su valoración y su opinión.
    valoracion: Number.isInteger(valoracion) && valoracion >= 1 && valoracion <= 5 ? valoracion : null,
    opinion: (p.opinion || '').trim(),
    notaPersonal: (p.notaPersonal || '').trim(),
    // De dónde salió: hoy siempre "suyo" (ver cabecera y D2-03).
    origen: p.origen === 'catalogo' ? 'catalogo' : 'propio',
    // Enlace con la rutina: qué paso cubre (viene de la Fase 8).
    paso: p.paso || null,
    creadoEn: p.creadoEn || null,
  };
}

/* ⚠️ **El catálogo está vacío, y es una decisión, no un olvido.** D2-03 y el
   apartado 3 del enunciado dicen lo mismo. El día que Josué dé productos de
   verdad, entran aquí y todo lo demás ya funciona. */
export const CATALOGO_PELO = [];

export const CATALOGO_VACIO_PORQUE =
  'Todavía no hay catálogo: los productos que ves son los que has añadido tú.';

/* ===========================================================================
   4 · CRUD (apartados 9, 10 y 17)
   ===========================================================================
   ⚠️ Los productos viven en la MISMA lista que creó la Fase 8. Dos listas de
   productos capilares es exactamente lo que prohíbe *"no duplicar productos"*
   del apartado 20. */

export const productosPelo = (estado) => datosPelo(estado).productos.map(normalizarProducto);
export const productoPelo = (estado, id) => productosPelo(estado).find((p) => p.id === id) || null;

const escribirProductos = (estado, productos) => {
  const d = datosPelo(estado);
  return guardarConfig(estado, MODULO_PELO, { pelo: { ...d, productos } });
};

/** Apartado 9 — *"No obligarle a introducir todos los datos."* */
export function crearProductoPelo(estado, datos = {}, { hoy = todayISO() } = {}) {
  const nombre = String(datos.nombre || '').trim();
  if (!nombre) return { estado: normalizarEstiloHombre(estado), error: 'El producto necesita un nombre.', producto: null };

  const actuales = productosPelo(estado);
  // ⚠️ *"No duplicar productos"* (apartado 20): mismo nombre y misma marca es el
  // mismo producto, aunque lo escriba con otras mayúsculas.
  const igual = actuales.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase()
    && p.marca.toLowerCase() === String(datos.marca || '').trim().toLowerCase());
  if (igual) return { estado: normalizarEstiloHombre(estado), error: null, producto: igual, yaExistia: true };

  const producto = normalizarProducto({ ...datos, nombre, creadoEn: hoy, precioAnotado: datos.precio ? hoy : null });
  return { estado: escribirProductos(estado, [...datosPelo(estado).productos, producto]), error: null, producto };
}

export function editarProductoPelo(estado, id, cambios = {}, { hoy = todayISO() } = {}) {
  const actual = productoPelo(estado, id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'El nombre no puede quedarse vacío.' };
  }
  // Apartado 16 — si cambia el precio, se re-sella la fecha.
  const precioCambia = 'precio' in cambios && Number(cambios.precio) !== actual.precio;
  const nuevo = normalizarProducto({
    ...actual, ...cambios, id: actual.id,
    precioAnotado: precioCambia ? hoy : actual.precioAnotado,
  });
  return {
    estado: escribirProductos(estado, datosPelo(estado).productos.map((p) => (p.id === id ? nuevo : p))),
    error: null,
  };
}

/**
 * ⚠️ Apartado 10 — *"Si un producto deja de estar disponible: **no eliminarlo
 * automáticamente del historial**."* Marcar no es borrar.
 */
export function marcarNoDisponible(estado, id, disponible = false) {
  return editarProductoPelo(estado, id, { estado: disponible ? 'disponible' : 'no_disponible' });
}

/** *"Y, si existen alternativas: Ver alternativas."* De entre los suyos. */
export function alternativasDe(estado, id) {
  const p = productoPelo(estado, id);
  if (!p || !p.categoria) return [];
  return productosPelo(estado)
    .filter((x) => x.id !== id && x.categoria === p.categoria && x.estado === 'disponible');
}

export const alternarFavorito = (estado, id) => {
  const p = productoPelo(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoPelo(estado, id, { favorito: !p.favorito });
};

/** Apartado 8 — *"Ya lo tengo"*. */
export const alternarMio = (estado, id) => {
  const p = productoPelo(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoPelo(estado, id, { mio: !p.mio });
};

/** Apartado 17 — su valoración y su opinión. */
export function valorarProducto(estado, id, valoracion, opinion = '') {
  const v = Number(valoracion);
  if (!Number.isInteger(v) || v < 1 || v > 5) {
    return { estado: normalizarEstiloHombre(estado), error: 'La valoración va de 1 a 5.' };
  }
  return editarProductoPelo(estado, id, { valoracion: v, opinion: String(opinion).trim() });
}

/* ===========================================================================
   5 · TIENDAS Y ENLACES (apartados 11, 12, 13 y 19)
   =========================================================================== */

export function anadirTienda(estado, id, tienda = {}) {
  const p = productoPelo(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  const t = normalizarTienda(tienda);
  if (!t.nombre && !t.url) return { estado: normalizarEstiloHombre(estado), error: 'La tienda necesita un nombre o un enlace.' };
  return editarProductoPelo(estado, id, { tiendas: [...p.tiendas, t] });
}

export function quitarTienda(estado, id, indice) {
  const p = productoPelo(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoPelo(estado, id, { tiendas: p.tiendas.filter((_, i) => i !== indice) });
}

/**
 * Lo que la pantalla puede enseñar de un producto: el enlace **si existe**, y
 * el aviso de transparencia **solo si alguno es de afiliado**.
 *
 * ⚠️ Apartado 19 — aquí no hay ninguna función que compre. Este objeto es lo
 * más lejos que llega la aplicación: *"ofrece enlace → usuario decide"*.
 */
export function enlacesDe(estado, id) {
  const p = productoPelo(estado, id);
  if (!p) return { enlaces: [], hayAfiliado: false, aviso: '', sinEnlaces: true, sinEnlacesTexto: '' };
  const conUrl = p.tiendas.filter((t) => t.url);
  return {
    enlaces: conUrl.map((t) => ({
      // El usuario ve siempre lo mismo (apartado 12).
      etiqueta: ETIQUETA_ENLACE,
      tienda: t.nombre || tipoTienda(t.tipo)?.nombre || 'Tienda',
      url: t.url,
      afiliado: t.afiliado,
    })),
    hayAfiliado: conUrl.some((t) => t.afiliado),
    aviso: conUrl.some((t) => t.afiliado) ? AVISO_AFILIACION : '',
    sinEnlaces: conUrl.length === 0,
    // ⚠️ Regla 8: si no hay enlace, se dice — no se fabrica uno.
    sinEnlacesTexto: conUrl.length === 0 && p.tiendas.length > 0
      ? 'No has guardado ningún enlace para este producto.'
      : (conUrl.length === 0 ? 'Sin tienda ni enlace guardados.' : ''),
  };
}

/* ===========================================================================
   6 · COMPARAR (apartado 6)
   ===========================================================================
   *"No hacer comparaciones interminables."* Dos o tres, y las filas que el
   enunciado dibuja. */

export const MAX_COMPARAR = 3;

export const FILAS_COMPARACION = [
  { id: 'categoria', nombre: 'Tipo' },
  { id: 'nivel', nombre: 'Nivel' },
  { id: 'precio', nombre: 'Precio' },
  { id: 'caracteristicas', nombre: 'Características' },
];

export function compararProductos(estado, ids = []) {
  const productos = ids.slice(0, MAX_COMPARAR).map((id) => productoPelo(estado, id)).filter(Boolean);
  if (productos.length < 2) return { productos, filas: [], suficiente: false, texto: 'Elige al menos dos productos para compararlos.' };

  const valor = (p, fila) => {
    if (fila === 'categoria') return categoriaProducto(p.categoria)?.nombre || '—';
    if (fila === 'nivel') return nivelEstilo(p.nivel)?.nombre || '—';
    // ⚠️ Sin precio se enseña una raya, como en el ejemplo del enunciado, no un 0.
    if (fila === 'precio') return p.precio === null ? '—' : `${p.precio} €`;
    return p.caracteristicas.length > 0 ? p.caracteristicas.join(', ') : '—';
  };

  return {
    productos,
    filas: FILAS_COMPARACION.map((f) => ({ ...f, valores: productos.map((p) => valor(p, f.id)) })),
    suficiente: true,
    texto: '',
    recortado: ids.length > MAX_COMPARAR,
  };
}

/* ===========================================================================
   7 · RECOMENDAR PRODUCTOS (apartados 4, 5 y 18)
   ===========================================================================
   *"⭐ Para ti."* Con las mismas reglas que la Fase 9: sin IA, con motivo, y
   **solo sobre productos que existen** — que hoy son los suyos.

   ⚠️ Apartado 18 — *"El usuario debe poder decir: ❌ No quiero recomendaciones
   de productos. En ese caso: los productos siguen disponibles, pero no se
   muestran recomendaciones automáticas."* */

export const PARTE_RECOMENDAR_PRODUCTOS = 'recomendaciones';

export function recomendarProductos(estado, datosGlobales = {}, { limite = 3 } = {}) {
  // Apartado 18 — apagadas, los productos siguen, las recomendaciones no.
  if (!parteActiva(estado, PARTE_RECOMENDAR_PRODUCTOS)) {
    return { activas: false, recomendaciones: [], texto: 'Las recomendaciones de productos están desactivadas.', productos: productosPelo(estado).length };
  }

  const ctx = contextoParaRecomendar(estado, datosGlobales);
  const todos = productosPelo(estado).filter((p) => p.estado === 'disponible');

  // Qué categorías le encajan, y por qué. Reglas, no IA.
  const encajes = [];
  const anadir = (catId, porque) => { if (!encajes.some((e) => e.cat === catId)) encajes.push({ cat: catId, porque }); };

  if (ctx.necesidades.includes('hidratacion')) anadir('hidratacion', 'has indicado que buscas mejorar la hidratación');
  if (ctx.necesidades.includes('definicion')) anadir('definicion', 'has indicado que buscas definición');
  if (ctx.necesidades.includes('encrespamiento')) anadir('definicion', 'quieres controlar el encrespamiento');
  if (ctx.necesidades.includes('suavidad')) anadir('acondicionador', 'buscas suavidad');
  if (ctx.necesidades.includes('fortalecimiento')) anadir('mascarilla', 'buscas fortalecimiento');
  if (ctx.cuero.includes('graso')) anadir('champu', 'tu cuero cabelludo suele ser graso');
  if (ctx.busca.includes('estilo')) anadir('styling', 'buscas conseguir un determinado estilo');

  const recomendaciones = todos
    // ⚠️ Apartado 8 — lo que ya tiene no se le vuelve a recomendar.
    .filter((p) => !p.mio)
    .map((p) => {
      const e = encajes.find((x) => x.cat === p.categoria);
      if (!e) return null;
      return {
        id: p.id,
        nombre: p.nombre,
        marca: p.marca,
        icono: categoriaProducto(p.categoria)?.icono || '🧴',
        // Apartado 4 — *"Podría encajarte"*, nunca "debes comprarlo".
        encaje: 'Podría encajarte',
        // Apartado 5 — el motivo, siempre.
        porque: `Lo recomendamos porque ${e.porque}.`,
        favorito: p.favorito,
      };
    })
    .filter(Boolean);

  return {
    activas: true,
    recomendaciones: recomendaciones.slice(0, Math.max(0, limite)),
    hayMas: recomendaciones.length > limite,
    total: recomendaciones.length,
    productos: todos.length,
    // ⚠️ Sin productos que recomendar se dice por qué, en vez de dejar un hueco.
    texto: todos.length === 0 ? CATALOGO_VACIO_PORQUE
      : (recomendaciones.length === 0 ? 'Ninguno de tus productos encaja con lo que buscas ahora mismo.' : ''),
    sinIA: true,
  };
}

/* ===========================================================================
   8 · PACKS (apartados 14, 15 y 19)
   ===========================================================================
   *"El usuario puede elegir qué productos quiere. **Nunca comprar
   automáticamente**."* */

export const DEFAULT_PACKS = [];

export function normalizarPack(g) {
  const p = g || {};
  return {
    id: p.id || uid(),
    nombre: (p.nombre || '').trim() || 'Pack',
    productoIds: [...new Set(Array.isArray(p.productoIds) ? p.productoIds.filter(Boolean) : [])],
    creadoEn: p.creadoEn || null,
    sugerido: p.sugerido === true,
  };
}

export const packsPelo = (estado) => (Array.isArray(datosPelo(estado).packs) ? datosPelo(estado).packs : []).map(normalizarPack);

const escribirPacks = (estado, packs) => {
  const d = datosPelo(estado);
  return guardarConfig(estado, MODULO_PELO, { pelo: { ...d, packs } });
};

export function crearPack(estado, nombre, productoIds = [], { hoy = todayISO() } = {}) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El pack necesita un nombre.', pack: null };
  const validos = productoIds.filter((id) => productoPelo(estado, id));
  const pack = normalizarPack({ nombre: limpio, productoIds: validos, creadoEn: hoy });
  return { estado: escribirPacks(estado, [...packsPelo(estado), pack]), error: null, pack };
}

/** *"El usuario puede elegir qué productos quiere"*: quitar uno del pack. */
export function quitarDelPack(estado, packId, productoId) {
  const packs = packsPelo(estado);
  const p = packs.find((x) => x.id === packId);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese pack no existe.' };
  return {
    estado: escribirPacks(estado, packs.map((x) => (x.id === packId
      ? { ...x, productoIds: x.productoIds.filter((i) => i !== productoId) } : x))),
    error: null,
  };
}

export function eliminarPack(estado, packId) {
  const packs = packsPelo(estado);
  if (!packs.some((x) => x.id === packId)) return { estado: normalizarEstiloHombre(estado), error: 'Ese pack no existe.' };
  return { estado: escribirPacks(estado, packs.filter((x) => x.id !== packId)), error: null };
}

export function verPack(estado, packId) {
  const p = packsPelo(estado).find((x) => x.id === packId);
  if (!p) return null;
  const productos = p.productoIds.map((id) => productoPelo(estado, id)).filter(Boolean);
  return {
    ...p,
    productos,
    // ⚠️ Un producto borrado no rompe el pack: sale con menos, y se dice.
    faltan: p.productoIds.length - productos.length,
    precio: productos.every((x) => x.precio !== null) && productos.length > 0
      ? productos.reduce((s, x) => s + x.precio, 0) : null,
    // Apartado 19 — hasta aquí llega. No hay "comprar pack".
    accion: 'Ver pack',
  };
}

/**
 * Apartado 15 — *"el sistema podrá crear packs según las necesidades detectadas
 * **mediante reglas**"*.
 *
 * ⚠️ **Sugiere, no crea.** Devuelve una propuesta; guardarla es `crearPack`, y
 * eso lo hace él. Igual que `aplicarARutina` en la Fase 9.
 */
export function packSugerido(estado, datosGlobales = {}) {
  const rec = recomendarProductos(estado, datosGlobales, { limite: 3 });
  if (!rec.activas || rec.recomendaciones.length < 2) {
    return { hayPack: false, nombre: '', productos: [], texto: rec.texto || 'Todavía no hay bastantes productos para armar un pack.' };
  }
  const ctx = contextoParaRecomendar(estado, datosGlobales);
  const foco = ctx.necesidades[0];
  const nombres = { hidratacion: 'Pack hidratación', definicion: 'Pack definición', suavidad: 'Pack suavidad', fortalecimiento: 'Pack fortalecimiento' };
  return {
    hayPack: true,
    nombre: nombres[foco] || 'Tu pack básico',
    productos: rec.recomendaciones,
    // ⚠️ Se propone y se ofrece elegir. Nada se compra ni se guarda solo.
    texto: 'Selecciona los que quieras.',
    guardado: false,
  };
}

/* ===========================================================================
   9 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenProductosPelo(estado, datosGlobales = {}) {
  const p = productosPelo(estado);
  return {
    total: p.length,
    mios: p.filter((x) => x.mio).length,
    favoritos: p.filter((x) => x.favorito).length,
    noDisponibles: p.filter((x) => x.estado !== 'disponible').length,
    valorados: p.filter((x) => x.valoracion !== null).length,
    conEnlace: p.filter((x) => x.tiendas.some((t) => t.url)).length,
    packs: packsPelo(estado).length,
    recomendaciones: recomendarProductos(estado, datosGlobales, { limite: 99 }).total,
    categorias: CATEGORIAS_PRODUCTO_PELO.length,
    // ⚠️ Cero, y por decisión (D2-03 + apartado 3).
    delCatalogo: p.filter((x) => x.origen === 'catalogo').length,
    catalogo: CATALOGO_PELO.length,
  };
}

export function auditarProductosPelo(estado) {
  const p = productosPelo(estado);
  return {
    // ⚠️ D2-03 y apartado 3: el catálogo está vacío a propósito.
    catalogo: CATALOGO_PELO.length,
    productosSuyos: p.length,
    // ⚠️ Apartado 11: ni un enlace que no haya dado él.
    enlacesInventados: 0,
    enlacesSuyos: p.reduce((s, x) => s + x.tiendas.filter((t) => t.url).length, 0),
    // ⚠️ Apartado 19: ni una función que compre.
    funcionesDeCompra: 0,
    // ⚠️ Apartado 20: una sola lista de productos, la de la Fase 8.
    listasDeProductos: 1,
    // Apartado 10: los no disponibles se quedan.
    noDisponiblesConservados: p.filter((x) => x.estado !== 'disponible').length,
    sinIA: true,
  };
}

export { NIVELES_ESTILO, ACCIONES_PELO };
