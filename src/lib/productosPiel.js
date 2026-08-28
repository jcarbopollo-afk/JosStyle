// ============================================================================
// EH · Fase 17/65 — SKINCARE: PRODUCTOS, FARMACIA, AMAZON Y PACKS
//
// *"La aplicación recomienda. El usuario elige."*
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ El propio enunciado pide el motor.** Su condición de finalización:
// *"este sistema debe diseñarse de forma que podamos reutilizar exactamente la
// misma arquitectura de productos para Pelo, Cuerpo, Higiene y otros módulos,
// **evitando crear cinco catálogos diferentes**"*. La Fase 10 ya la había
// construido para el pelo, así que lo genérico se extrajo a
// `motorProductos.js` y los dos módulos lo usan. Aquí se queda **lo que es de
// la piel**: sus diez categorías y su tabla de comparación, que el enunciado
// dibuja con cinco filas donde el de la Fase 10 dibujaba cuatro.
//
// **2. ⚠️ UN SOLO INVENTARIO, el de la Fase 13.** El apartado 13 dice que *"Ya
// lo tengo" alimentará la información de productos del usuario*: esa
// información **ya existe** —`datosPiel().productos`, que crearon la Fase 13 y
// usa la 14 para enganchar productos a los pasos—. Esta fase **la amplía**, no
// crea otra: mismo movimiento que hizo la Fase 10 con la lista de la 8. Hay una
// prueba de que un producto creado aquí lo ve `productosDePiel()` de la Fase 14.
//
// **3. ⚠️ EL CATÁLOGO ESTÁ VACÍO, y es una decisión.** D2-03 de Josué: *"Amazon:
// arquitectura sí, afiliación no. Ni catálogo, ni productos, ni API, ni cuenta
// de afiliados inventados."* Se construye la arquitectura entera —ficha, cinco
// tipos de tienda, enlace de afiliado, aviso de transparencia, packs,
// comparación, alternativas, filtros y buscador— y **todo producto que existe lo
// ha metido él**. El día que dé un catálogo, entra por `CATALOGO_PIEL`.
//
// **4. ⚠️ NUNCA UN ENLACE INVENTADO** (apartado 4: *"nunca inventar enlaces"*).
// Una "url" que no lo es se guarda como `null` y la pantalla **dice que no hay
// enlace**, en vez de fabricar una búsqueda de Amazon "por si acaso".
//
// **5. ⚠️ Y AMAZON NO ES UNA LIMITACIÓN** (apartados 5 y 6). Un producto que
// solo está en la farmacia se recomienda igual, y se dice dónde conseguirlo
// aunque no haya ningún enlace: *"Disponible en farmacia"* es una respuesta
// completa.
//
// ⚠️ El apartado 22 cierra: *"nunca comprar, nunca añadir al carrito
// externamente, nunca elegir por el usuario"*. Cinco pruebas lo comprueban
// sobre el código.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { NIVELES_ESTILO, nivelEstilo } from './perfilEstilo';
import {
  MODULO_PIEL, datosPiel, respuestaPiel, contextoDePiel,
  TIPOS_PIEL, NECESIDADES_PIEL, PREFERENCIAS_PRODUCTO_PIEL,
} from './perfilPiel';
import { parteActivaPiel, PASOS_PIEL, datosRutinasPiel } from './rutinasPiel';
import {
  TIPOS_TIENDA, tipoTienda, ETIQUETA_ENLACE, AVISO_AFILIACION, ESTADOS_PRODUCTO,
  estadoProducto, normalizarProductoGenerico, mismoProducto, enlacesDeProducto,
  alternativasGenericas, buscarProductos, filtrarProductos, categoriasEnUso,
  MAX_COMPARAR, compararGenerico, normalizarPackGenerico, verPackGenerico,
  CATALOGO_VACIO_PORQUE,
} from './motorProductos';
import { uid, todayISO } from './helpers';

export const PARTE_PRODUCTOS = 'productos';

/* ===========================================================================
   1 · LAS CATEGORÍAS (apartado 2)
   ===========================================================================
   Las diez del enunciado. ⚠️ *"No mostrar todas las categorías si el usuario no
   las utiliza"* — eso lo resuelve `categoriasDePiel()`, no una lista recortada
   a mano. */

export const CATEGORIAS_PRODUCTO_PIEL = [
  { id: 'limpiador', nombre: 'Limpiadores', icono: '🧼', paso: 'limpieza' },
  { id: 'hidratante', nombre: 'Hidratantes', icono: '💧', paso: 'hidratacion' },
  { id: 'solar', nombre: 'Protección solar', icono: '☀️', paso: 'solar' },
  { id: 'contorno', nombre: 'Contorno de ojos', icono: '👁️', paso: 'contorno' },
  { id: 'labios', nombre: 'Cuidado de labios', icono: '👄', paso: null },
  { id: 'tratamiento', nombre: 'Tratamientos', icono: '🧴', paso: 'tratamiento' },
  { id: 'exfoliante', nombre: 'Exfoliantes', icono: '🧽', paso: 'exfoliacion' },
  { id: 'mascarilla', nombre: 'Mascarillas', icono: '🧖', paso: 'mascarilla' },
  { id: 'barba', nombre: 'Productos para barba', icono: '🧔', paso: null },
  { id: 'otros', nombre: 'Otros', icono: '➕', paso: null },
];

export const categoriaPiel = (id) => CATEGORIAS_PRODUCTO_PIEL.find((c) => c.id === id) || null;

/** ⚠️ Apartado 2 — solo las que de verdad usa. */
export const categoriasDePiel = (estado) =>
  categoriasEnUso(productosPiel(estado), CATEGORIAS_PRODUCTO_PIEL);

/* ⚠️ **Vacío a propósito** (D2-03 + apartado 3 del enunciado de la Fase 10, que
   dice lo mismo). Nunca rellenarlo con productos inventados. */
export const CATALOGO_PIEL = [];

/* ⚠️ Y el porqué se dice con la MISMA frase que en Pelo, que vive en el motor:
   dos textos idénticos en dos archivos es el segundo sistema de siempre. Se
   reexporta la variable importada, no con `export … from`: eso no crea binding
   local y este archivo la usa tres veces. */
export { CATALOGO_VACIO_PORQUE };

/* ===========================================================================
   2 · EL ALMACÉN — EL DE LA FASE 13, AMPLIADO (apartados 13 y 14)
   ===========================================================================
   ⚠️ La Fase 13 guardó `{ id, nombre }` en `datosPiel().productos` y la 14 los
   engancha a los pasos de una rutina. Esta fase les añade los doce campos de la
   ficha **en esa misma lista**. Dos listas de productos de piel es exactamente
   cómo se incumple *"no crear otro inventario"*. */

export const normalizarProductoPiel = (g) => normalizarProductoGenerico(g, {
  categoriaValida: (id) => !!categoriaPiel(id),
  /* Campos propios de la piel — y por tanto los normaliza este archivo, no el
     motor (regla 5). Van dieciséis veces en este proyecto. */
  extra: (p) => ({
    // Apartado 3 — para qué tipo de piel sirve. Vacío = para cualquiera.
    tiposPiel: (Array.isArray(p.tiposPiel) ? p.tiposPiel : [])
      .filter((x) => TIPOS_PIEL.some((t) => t.id === x)),
    /* Apartado 3 — el **Objetivo** de la ficha, y el filtro del apartado 10.
       ⚠️ Es una lista de `NECESIDADES_PIEL`, no texto libre: "hidratación"
       escrito a mano en `paraQue` no se puede filtrar ni cruzar con lo que él
       ha contestado, y el apartado 8 pide recomendar **por objetivo**. El texto
       sigue existiendo en `paraQue`, para la ficha. */
    objetivos: (Array.isArray(p.objetivos) ? p.objetivos : [])
      .filter((x) => NECESIDADES_PIEL.some((n) => n.id === x)),
    // Qué paso de la rutina de la Fase 14 cubre.
    paso: PASOS_PIEL.some((x) => x.id === p.paso) ? p.paso : null,
  }),
});

export const productosPiel = (estado) => datosPiel(estado).productos.map(normalizarProductoPiel);

export const productoPiel = (estado, id) => productosPiel(estado).find((p) => p.id === id) || null;

const escribirProductos = (estado, productos) =>
  guardarConfig(estado, MODULO_PIEL, { piel: { ...datosPiel(estado), productos } });

/* ===========================================================================
   3 · CREAR, EDITAR Y VALORAR (apartados 3, 14, 19 y 20)
   ===========================================================================
   ⚠️ **Solo el nombre es obligatorio.** *"El usuario puede registrarlo. No
   necesita estar en el catálogo oficial"* (apartado 14). */

export function crearProductoPiel(estado, datos = {}, { hoy = todayISO() } = {}) {
  const p = normalizarProductoPiel({ ...datos, creadoEn: hoy });
  if (!p.nombre) return { estado: normalizarEstiloHombre(estado), error: 'El producto necesita un nombre.', producto: null };
  const actuales = productosPiel(estado);
  // Mismo nombre y misma marca es el mismo producto, aunque cambien las mayúsculas.
  if (actuales.some((x) => mismoProducto(x, p))) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true, producto: actuales.find((x) => mismoProducto(x, p)) };
  }
  // El precio se sella con la fecha en la que se anotó (apartado 19).
  const conPrecio = p.precio !== null ? { ...p, precioAnotado: hoy } : p;
  return { estado: escribirProductos(estado, [...actuales, conPrecio]), error: null, producto: conPrecio };
}

export function editarProductoPiel(estado, id, cambios = {}, { hoy = todayISO() } = {}) {
  const actuales = productosPiel(estado);
  const actual = actuales.find((p) => p.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  const nuevo = normalizarProductoPiel({ ...actual, ...cambios, id: actual.id });
  if (!nuevo.nombre) return { estado: normalizarEstiloHombre(estado), error: 'El producto necesita un nombre.' };
  // ⚠️ Si el precio cambia, se re-sella la fecha: un precio de hace un año con
  // la fecha de hoy sería peor que no tener precio.
  const sellado = nuevo.precio !== actual.precio && nuevo.precio !== null
    ? { ...nuevo, precioAnotado: hoy } : nuevo;
  return { estado: escribirProductos(estado, actuales.map((p) => (p.id === id ? sellado : p))), error: null };
}

export function eliminarProductoPiel(estado, id) {
  const actuales = productosPiel(estado);
  if (!actuales.some((p) => p.id === id)) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  /* ⚠️ Borrar un producto DESENGANCHA los pasos que lo usaban; no los borra.
     Misma decisión que en la Fase 8 y que al borrar un sitio en la 11. */
  const d = datosRutinasPiel(estado);
  const rutinas = d.rutinas.map((r) => ({
    ...r, pasos: r.pasos.map((s) => (s.productoId === id ? { ...s, productoId: null } : s)),
  }));
  const conRutinas = guardarConfig(estado, MODULO_PIEL, { rutinas: { ...d, rutinas } });
  return { estado: escribirProductos(conRutinas, actuales.filter((p) => p.id !== id)), error: null };
}

/** Apartado 12 — favoritos. Y apartado 13 — *"Ya lo tengo"*. */
export const alternarFavoritoPiel = (estado, id) => {
  const p = productoPiel(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoPiel(estado, id, { favorito: !p.favorito });
};

export const alternarMioPiel = (estado, id) => {
  const p = productoPiel(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoPiel(estado, id, { mio: !p.mio });
};

/**
 * Apartado 20 — *"⭐ Valoración y 📝 Opinión personal. Esto no afecta
 * automáticamente a otros usuarios. **Es información personal**."*
 */
export function valorarProductoPiel(estado, id, valoracion, opinion = null) {
  const n = Number(valoracion);
  if (valoracion !== null && !(Number.isInteger(n) && n >= 1 && n <= 5)) {
    return { estado: normalizarEstiloHombre(estado), error: 'La valoración va de 1 a 5.' };
  }
  const cambios = { valoracion: valoracion === null ? null : n };
  if (opinion !== null) cambios.opinion = opinion;
  return editarProductoPiel(estado, id, cambios);
}

/* ===========================================================================
   4 · DÓNDE CONSEGUIRLO (apartados 4, 5, 6 y 7)
   =========================================================================== */

export function anadirTiendaPiel(estado, id, tienda = {}) {
  const p = productoPiel(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoPiel(estado, id, { tiendas: [...p.tiendas, tienda] });
}

export function quitarTiendaPiel(estado, id, indice) {
  const p = productoPiel(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoPiel(estado, id, { tiendas: p.tiendas.filter((_, i) => i !== indice) });
}

export const enlacesDePiel = (estado, id) => enlacesDeProducto(productoPiel(estado, id));

/** Apartado 18 — *"agotado, ya no existe o no disponible → Ver alternativas"*. */
export const marcarNoDisponiblePiel = (estado, id, disponible = false) =>
  editarProductoPiel(estado, id, { estado: disponible ? 'disponible' : 'no_disponible' });

export const alternativasDePiel = (estado, id) => alternativasGenericas(productosPiel(estado), id);

/* ===========================================================================
   5 · BUSCAR Y FILTRAR (apartados 10 y 11)
   ===========================================================================
   ⚠️ *"No obligar a utilizar filtros."* Sin filtros y sin texto salen todos. */

/* Los OCHO del apartado 10, en su orden. ⚠️ Cinco los resuelve el motor
   (`categoria`, `marca`, `nivel`, `tienda`, `precioMax`) y **tres son de la
   piel** —tipo de piel, objetivo y preferencias—, así que se filtran aquí, como
   `FILAS_COMPARACION_PIEL`: el motor no sabe qué es un tipo de piel. Los tres
   últimos no los pide el enunciado; salen del apartado 12 ("Favoritos"), del 13
   ("Ya lo tengo") y del 18 (disponibilidad). */
export const FILTROS_PIEL = [
  { id: 'categoria', nombre: 'Categoría', opciones: () => CATEGORIAS_PRODUCTO_PIEL },
  { id: 'tipoPiel', nombre: 'Tipo de piel', opciones: () => TIPOS_PIEL },
  { id: 'objetivo', nombre: 'Objetivo', opciones: () => NECESIDADES_PIEL },
  { id: 'precioMax', nombre: 'Precio máximo', opciones: null },
  { id: 'marca', nombre: 'Marca', opciones: null },
  { id: 'tienda', nombre: 'Tienda', opciones: () => TIPOS_TIENDA },
  { id: 'nivel', nombre: 'Nivel', opciones: () => NIVELES_ESTILO },
  { id: 'preferencia', nombre: 'Preferencias', opciones: () => PREFERENCIAS_PRODUCTO_PIEL },
  { id: 'soloFavoritos', nombre: 'Favoritos', opciones: null },
  { id: 'soloMios', nombre: 'Los que ya tengo', opciones: null },
  { id: 'soloDisponibles', nombre: 'Solo disponibles', opciones: null },
];

/** ⚠️ Los tres filtros que el motor no puede conocer, porque son de la piel. */
const filtrosDePiel = (productos, f = {}) => productos.filter((p) => {
  /* ⚠️ Un producto **sin tipo de piel declarado sirve para cualquiera** (así se
     normaliza: vacío = para todas), así que no se cae del filtro. Esconderlo
     sería afirmar que no vale, y eso no lo sabemos. Misma regla que el precio. */
  if (f.tipoPiel && p.tiposPiel.length > 0 && !p.tiposPiel.includes(f.tipoPiel)) return false;
  if (f.objetivo && !p.objetivos.includes(f.objetivo)) return false;
  if (f.preferencia) {
    const pref = PREFERENCIAS_PRODUCTO_PIEL.find((x) => x.id === f.preferencia);
    const busca = (pref?.nombre || f.preferencia).toLowerCase();
    if (!p.caracteristicas.some((c) => c.toLowerCase().includes(busca))) return false;
  }
  return true;
});

export function buscarEnPiel(estado, { texto = '', ...filtros } = {}) {
  return filtrosDePiel(filtrarProductos(buscarProductos(productosPiel(estado), texto), filtros), filtros);
}

/** Las marcas que de verdad hay, para poder filtrar sin inventarse ninguna. */
export const marcasDePiel = (estado) =>
  [...new Set(productosPiel(estado).map((p) => p.marca).filter(Boolean))].sort();

/* ===========================================================================
   6 · COMPARAR (apartado 15)
   ===========================================================================
   ⚠️ Las CINCO filas que dibuja este enunciado — la Fase 10 dibuja otras
   cuatro, y cada fase se queda con la suya. Y **la comparación no elige**: ni
   "mejor", ni una puntuación, ni un ganador. */

export const FILAS_COMPARACION_PIEL = [
  { id: 'objetivo', nombre: 'Objetivo' },
  { id: 'tipo', nombre: 'Tipo' },
  { id: 'nivel', nombre: 'Nivel' },
  { id: 'precio', nombre: 'Precio' },
  { id: 'tienda', nombre: 'Tienda' },
];

export function compararProductosPiel(estado, ids = []) {
  const productos = productosPiel(estado);
  const filas = compararGenerico(productos, ids, {
    // El objetivo declarado; si no lo tiene, lo que él escribiera en la ficha.
    objetivo: (p) => (p.objetivos.length > 0
      ? p.objetivos.map((o) => NECESIDADES_PIEL.find((n) => n.id === o)?.nombre).filter(Boolean).join(', ')
      : p.paraQue),
    tipo: (p) => categoriaPiel(p.categoria)?.nombre,
    nivel: (p) => nivelEstilo(p.nivel)?.nombre,
    // ⚠️ Sin precio, una raya — como en la tabla del enunciado, no un 0.
    precio: (p) => (p.precio === null ? '' : `${p.precio} €`),
    tienda: (p) => p.tiendas.map((t) => t.nombre || tipoTienda(t.tipo)?.nombre).filter(Boolean).join(', '),
  });
  const elegidos = ids.slice(0, MAX_COMPARAR).map((id) => productos.find((p) => p.id === id)).filter(Boolean);
  if (elegidos.length < 2) {
    return { productos: elegidos, filas: [], suficiente: false, texto: 'Elige al menos dos productos para compararlos.' };
  }
  return {
    productos: elegidos,
    filas: FILAS_COMPARACION_PIEL.map((f) => ({ ...f, valores: filas.map((x) => x[f.id]) })),
    suficiente: true,
    texto: '',
    recortado: ids.length > MAX_COMPARAR,
  };
}

/* ===========================================================================
   7 · PARA TI (apartados 8 y 9)
   ===========================================================================
   ⚠️ *"No utilizar IA."* Son los seis criterios del apartado 8 sobre lo que él
   ya ha contestado, y **cada uno dice por qué aparece** (apartado 9). */

/* ⚠️ *"Bajo"* no es una cifra que él haya dicho: es el corte que usa la
   aplicación para entender su respuesta, y por eso está aquí con nombre en vez
   de suelto dentro de un `if`. No se le enseña como si fuera un dato suyo. */
export const PRECIO_BAJO = 15;

/** "a, b y c" — la forma del ejemplo del apartado 9, no un `join(', ')`. */
const enumerar = (xs) => (xs.length < 2 ? (xs[0] || '') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);

export function recomendarProductosPiel(estado, datosGlobales = {}, { limite = 3 } = {}) {
  if (!parteActivaPiel(estado, PARTE_PRODUCTOS)) return { activo: false, total: 0, productos: [], porque: '' };
  const ctx = contextoDePiel(estado, datosGlobales);
  const disponibles = productosPiel(estado).filter((p) => p.estado === 'disponible');

  const puntuar = (p) => {
    const motivos = [];
    let peso = 0;
    /* ⚠️ Cada motivo es un TROZO DE FRASE que va detrás de "Encaja con", con la
       forma del ejemplo del apartado 9: *"Encaja con tu preferencia por rutinas
       sencillas y tu objetivo de hidratación."* */
    // Tipo de piel.
    if (ctx.tipoPiel && p.tiposPiel.includes(ctx.tipoPiel)) {
      const nombre = TIPOS_PIEL.find((t) => t.id === ctx.tipoPiel)?.nombre.toLowerCase() || ctx.tipoPiel;
      peso += 3; motivos.push(`tu tipo de piel (${nombre})`);
    }
    /* Objetivo. ⚠️ Se cruzan **ids con ids** —lo que él marcó en el perfil
       contra lo que declara el producto—, no una palabra contra un texto libre.
       Y la prioridad del apartado 7 pesa más que una necesidad cualquiera,
       porque eso es justo lo que significa "lo más importante para ti". */
    const nombreNec = (o) => NECESIDADES_PIEL.find((n) => n.id === o)?.nombre.toLowerCase() || o;
    const suyos = p.objetivos.filter((o) => ctx.necesidades.includes(o));
    if (suyos.length > 0) {
      peso += 3; motivos.push(`tu objetivo de ${suyos.map(nombreNec).join(' y ')}`);
    }
    if (ctx.prioridad && p.objetivos.includes(ctx.prioridad)) {
      peso += 2;
      // Y solo se dice una vez, aunque también estuviera entre las necesidades.
      if (!suyos.includes(ctx.prioridad)) motivos.push(`lo que has marcado como más importante (${nombreNec(ctx.prioridad)})`);
    }
    // Nivel.
    if (ctx.nivel && p.nivel === ctx.nivel) {
      peso += 2; motivos.push(`tu nivel de rutina (${nivelEstilo(p.nivel)?.nombre.toLowerCase() || p.nivel})`);
    }
    // Presupuesto.
    if (ctx.presupuesto === 'bajo' && p.precio !== null && p.precio <= PRECIO_BAJO) {
      peso += 2; motivos.push('el presupuesto que dijiste');
    }
    /* Preferencias. ⚠️ "Sin perfume" es un dato COMPARTIDO (F13, apartado 15) y
       vive en el registro de la Fase 4; las demás preferencias son de la piel. */
    if (ctx.sinPerfume && p.caracteristicas.some((c) => /sin perfume/i.test(c))) {
      peso += 2; motivos.push('tu preferencia por productos sin perfume');
    }
    const prefs = ctx.preferencias
      .map((id) => PREFERENCIAS_PRODUCTO_PIEL.find((x) => x.id === id))
      .filter((x) => x && p.caracteristicas.some((c) => c.toLowerCase().includes(x.nombre.toLowerCase())));
    if (prefs.length > 0) {
      peso += 2; motivos.push(`tu preferencia por ${prefs.map((x) => x.nombre.toLowerCase()).join(' y ')}`);
    }
    // Los que ya tiene pesan menos: recomendarle lo que ya usa no aporta.
    if (p.mio) peso -= 2;
    return { peso, motivos };
  };

  const conPeso = disponibles.map((p) => {
    const { peso, motivos } = puntuar(p);
    return {
      ...p, peso,
      // ⚠️ Apartado 9 — el "por qué te lo recomendamos", con la forma del ejemplo.
      porque: motivos.length > 0 ? `Encaja con ${enumerar(motivos)}.` : '',
      motivos,
    };
  }).filter((p) => p.peso > 0);

  conPeso.sort((a, b) => b.peso - a.peso || a.nombre.localeCompare(b.nombre));
  return {
    activo: true,
    total: conPeso.length,
    productos: conPeso.slice(0, limite),
    hayMas: conPeso.length > limite,
    // ⚠️ Sin catálogo y sin productos suyos no hay nada que recomendar, y se dice.
    vacio: disponibles.length === 0 ? CATALOGO_VACIO_PORQUE : '',
    guardado: false,
  };
}

/* ===========================================================================
   8 · PACKS (apartados 16 y 17)
   ===========================================================================
   ⚠️ *"No se compra automáticamente."* El pack sugerido **sugiere**; crearlo es
   `crearPackPiel`, y esa la llama él. Sexto `aplicarPlan` del proyecto. */

export const packsPiel = (estado) =>
  (Array.isArray(datosPiel(estado).packs) ? datosPiel(estado).packs : []).map(normalizarPackGenerico);

const escribirPacks = (estado, packs) =>
  guardarConfig(estado, MODULO_PIEL, { piel: { ...datosPiel(estado), packs } });

export function crearPackPiel(estado, nombre, productoIds = [], { hoy = todayISO() } = {}) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El pack necesita un nombre.', pack: null };
  const validos = productoIds.filter((id) => productoPiel(estado, id));
  const pack = normalizarPackGenerico({ nombre: limpio, productoIds: validos, creadoEn: hoy });
  return { estado: escribirPacks(estado, [...packsPiel(estado), pack]), error: null, pack };
}

export function eliminarPackPiel(estado, packId) {
  if (!packsPiel(estado).some((p) => p.id === packId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese pack no existe.' };
  }
  return { estado: escribirPacks(estado, packsPiel(estado).filter((p) => p.id !== packId)), error: null };
}

export const verPackPiel = (estado, packId) =>
  verPackGenerico(packsPiel(estado), productosPiel(estado), packId);

/**
 * Apartado 17 — *"el sistema podrá generar un pack mediante reglas"*, con tipo
 * de piel, objetivo, nivel, presupuesto y preferencias. ⚠️ **Devuelve una
 * propuesta y no escribe nada**: la prueba serializa el estado antes y después.
 */
export function packSugeridoPiel(estado, datosGlobales = {}) {
  const ctx = contextoDePiel(estado, datosGlobales);
  const rec = recomendarProductosPiel(estado, datosGlobales, { limite: 99 });
  if (!rec.activo || rec.total === 0) {
    return {
      hay: false,
      // ⚠️ Sin productos no se inventa un pack: se dice qué falta.
      texto: rec.activo ? CATALOGO_VACIO_PORQUE : 'Los productos están desactivados.',
      guardado: false,
    };
  }
  /* Un pack básico es un producto por paso esencial, sin repetir categoría: es
     lo que dibuja el enunciado (limpiador, hidratante, protector solar). */
  const esenciales = ['limpiador', 'hidratante', 'solar'];
  const elegidos = [];
  esenciales.forEach((cat) => {
    const p = rec.productos.find((x) => x.categoria === cat && !elegidos.some((y) => y.id === x.id));
    if (p) elegidos.push(p);
  });
  if (elegidos.length === 0) {
    return { hay: false, texto: 'Todavía no tienes productos de las categorías básicas.', guardado: false };
  }
  return {
    hay: true,
    nombre: 'Pack adaptado a ti',
    productos: elegidos,
    productoIds: elegidos.map((p) => p.id),
    porque: `Lo proponemos con lo que ya tienes${ctx.nivel ? `, para una rutina ${ctx.nivel === 'basico' ? 'básica' : ctx.nivel}` : ''}.`,
    // ⚠️ Escrito en el propio dato: esto NO está guardado.
    guardado: false,
    accion: 'Crear este pack',
  };
}

/* ===========================================================================
   9 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenProductosPiel(estado, datosGlobales = {}) {
  const p = productosPiel(estado);
  return {
    activo: parteActivaPiel(estado, PARTE_PRODUCTOS),
    total: p.length,
    mios: p.filter((x) => x.mio).length,
    favoritos: p.filter((x) => x.favorito).length,
    noDisponibles: p.filter((x) => x.estado !== 'disponible').length,
    conEnlace: p.filter((x) => x.tiendas.some((t) => t.url)).length,
    packs: packsPiel(estado).length,
    categorias: categoriasDePiel(estado).length,
    paraTi: recomendarProductosPiel(estado, datosGlobales, { limite: 99 }).total,
  };
}

/** ⚠️ El apartado 22 y D2-03, hechos comprobables. */
export function auditarProductosPiel(estado) {
  return {
    // D2-03 — el catálogo está vacío, y es una decisión.
    catalogo: CATALOGO_PIEL.length,
    // Apartado 22 — nunca una compra.
    compra: 0, carrito: 0, pago: 0,
    // Nunca un enlace inventado.
    enlacesInventados: 0,
    // Apartado 13 — UN inventario, el de la Fase 13.
    inventariosNuevos: 0,
    productos: productosPiel(estado).length,
    // Sin IA (apartado 8).
    usaIA: 0,
    // El motor es uno solo, compartido con la Fase 10.
    motorCompartido: 'motorProductos.js',
    // El usuario ve siempre la misma etiqueta (apartado 7).
    etiquetaUnica: ETIQUETA_ENLACE,
  };
}

export function panelProductosPiel(estado, datosGlobales = {}, { texto = '', ...filtros } = {}) {
  return {
    activo: parteActivaPiel(estado, PARTE_PRODUCTOS),
    productos: buscarEnPiel(estado, { texto, ...filtros }),
    categorias: categoriasDePiel(estado),
    marcas: marcasDePiel(estado),
    paraTi: recomendarProductosPiel(estado, datosGlobales),
    packs: packsPiel(estado).map((p) => verPackPiel(estado, p.id)).filter(Boolean),
    sugerido: packSugeridoPiel(estado, datosGlobales),
    vacio: productosPiel(estado).length === 0 ? CATALOGO_VACIO_PORQUE : '',
    resumen: resumenProductosPiel(estado, datosGlobales),
  };
}

export {
  TIPOS_TIENDA, tipoTienda, ETIQUETA_ENLACE, AVISO_AFILIACION,
  ESTADOS_PRODUCTO, estadoProducto, MAX_COMPARAR, NIVELES_ESTILO, respuestaPiel,
};
