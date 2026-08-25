// ---------------------------------------------------------------------------
// Entrega 2 · AR Fase 1 — Armario digital: modelo de datos y motor puro.
//
// PRIMER MÓDULO GENUINAMENTE NUEVO DE LA ENTREGA 2
// ME y BI ampliaban cosas que ya existían. Esto no existe en ninguna forma, así
// que la decisión que más pesa es el MODELO DE DATOS: el apartado 23 dice que la
// arquitectura tiene que aguantar tres fases más sin rehacerse, y el 14 pide
// explícitamente "no diseñar una estructura que obligue a rehacer las prendas".
//
// POR QUÉ HAY CAMPOS QUE HOY NO SE USAN
// `usos`, `ultimoUso` y `favorita` están desde el primer día y vacíos. No son
// adorno: la Fase 3 (calendario e historial) y la Fase 4 (anti-repetición) necesitan
// responder a "¿cuándo la usé por última vez?" y "¿cuánto lleva sin usarse?", y si
// esos campos aparecen después, todas las prendas ya guardadas se quedan sin ellos —
// y `loadData` NO fusiona con el valor por defecto (regla 5), así que arreglarlo
// luego exige una migración manual prenda a prenda.
//
// UN CAMPO QUE SE QUITÓ AL LLEGAR LA FASE 2
// La Fase 1 dejó también un `prenda.outfits`, pensando que haría falta. Al construir
// la Fase 2 quedó claro que no: la relación la manda el outfit (`outfit.prendaIds`,
// que es la estructura que pide el apartado 19), y mantener además la lista al revés
// dentro de cada prenda son DOS fuentes de verdad para el mismo dato — que es
// exactamente como se desincronizan las cosas: basta con que un borrado toque una y
// no la otra. Se deriva con `outfitsConPrenda()`, que siempre acierta porque lee la
// única lista que existe. Las prendas guardadas antes conservan el campo; nadie lo
// lee, y no estorba.
//
// Este archivo es PURO: ni React, ni Supabase, ni acceso al DOM. Por eso se puede
// probar entero con Node.
// ---------------------------------------------------------------------------

import { uid } from './helpers';

// Apartado 3 — categorías iniciales. Es una lista, no un enum cerrado: el apartado
// pide expresamente que se puedan ampliar, y una prenda cuya categoría desaparezca
// del catálogo no debe romperse (ver `categoriaDe`).
export const CATEGORIAS_ARMARIO = [
  { id: 'camisetas', label: 'Camisetas', icono: 'Shirt' },
  { id: 'camisas', label: 'Camisas', icono: 'Shirt' },
  { id: 'polos', label: 'Polos', icono: 'Shirt' },
  { id: 'sudaderas', label: 'Sudaderas', icono: 'Shirt' },
  { id: 'jerseis', label: 'Jerséis', icono: 'Shirt' },
  { id: 'chaquetas', label: 'Chaquetas', icono: 'Shirt' },
  { id: 'abrigos', label: 'Abrigos', icono: 'Shirt' },
  { id: 'pantalones', label: 'Pantalones', icono: 'Grid2x2' },
  { id: 'shorts', label: 'Shorts', icono: 'Grid2x2' },
  { id: 'chandal', label: 'Chándal', icono: 'Grid2x2' },
  { id: 'zapatillas', label: 'Zapatillas', icono: 'Footprints' },
  { id: 'zapatos', label: 'Zapatos', icono: 'Footprints' },
  { id: 'accesorios', label: 'Accesorios', icono: 'Watch' },
  { id: 'otros', label: 'Otros', icono: 'Package' },
];

// Apartado 4 — colores. El valor guardado es el id; el hex es SOLO para pintar la
// muestra de color de la tarjeta cuando no hay fotografía (apartado 6). No es un
// color de interfaz, así que no entra en el sistema de tokens ni lo contradice:
// es un dato de la prenda, como su talla.
export const COLORES_ARMARIO = [
  { id: 'negro', label: 'Negro', muestra: '#111111' },
  { id: 'blanco', label: 'Blanco', muestra: '#F2F2F2' },
  { id: 'gris', label: 'Gris', muestra: '#8A8A8E' },
  { id: 'azul', label: 'Azul', muestra: '#2F5FD0' },
  { id: 'celeste', label: 'Celeste', muestra: '#7FB2E5' },
  { id: 'rojo', label: 'Rojo', muestra: '#C6382F' },
  { id: 'verde', label: 'Verde', muestra: '#3E8A57' },
  { id: 'beige', label: 'Beige', muestra: '#D8C7A9' },
  { id: 'marron', label: 'Marrón', muestra: '#6B4A2E' },
  { id: 'amarillo', label: 'Amarillo', muestra: '#E2B93B' },
  { id: 'rosa', label: 'Rosa', muestra: '#DE8FA6' },
  { id: 'morado', label: 'Morado', muestra: '#6E4FA3' },
  { id: 'otro', label: 'Otro', muestra: '#9B9BA1' },
];

// Apartado 13 — estados. `Disponible` es el único que hoy cambia algo; el resto
// existen porque la Fase 2 (Outfits) los necesita para no proponer una prenda que
// está en la lavadora.
export const ESTADOS_PRENDA = [
  { id: 'disponible', label: 'Disponible' },
  { id: 'lavanderia', label: 'En lavandería' },
  { id: 'reparacion', label: 'En reparación' },
  { id: 'guardada', label: 'Guardada' },
  { id: 'no_disponible', label: 'No disponible' },
];

export const TEMPORADAS_PRENDA = [
  { id: 'todo_el_ano', label: 'Todo el año' },
  { id: 'verano', label: 'Verano' },
  { id: 'invierno', label: 'Invierno' },
  { id: 'entretiempo', label: 'Entretiempo' },
];

// Apartado 11 — ordenaciones. Las cuatro primeras funcionan hoy. Las tres últimas
// dependen de datos de uso que la Fase 3 empezará a llenar, así que se declaran
// con `requiereUso: true` y la interfaz las esconde mientras no haya ni un uso
// registrado: enseñar "Más usadas" sobre un armario sin usos sería un control
// decorativo, y eso es exactamente lo que prohíbe la regla 8.
export const ORDENES_ARMARIO = [
  { id: 'recientes', label: 'Añadidas recientemente' },
  { id: 'antiguas', label: 'Añadidas hace más tiempo' },
  { id: 'az', label: 'Nombre A-Z' },
  { id: 'za', label: 'Nombre Z-A' },
  { id: 'categoria', label: 'Por categoría' },
  { id: 'mas_usadas', label: 'Más usadas', requiereUso: true },
  { id: 'menos_usadas', label: 'Menos usadas', requiereUso: true },
  { id: 'sin_usar', label: 'Más tiempo sin usar', requiereUso: true },
];

export const DEFAULT_ARMARIO = {
  prendas: [],
  // Sub-listas que llenan las fases siguientes. Vacías hoy, pero declaradas: si la
  // Fase 2 las añadiera de cero, `loadData` no las fusionaría con el valor por
  // defecto y el módulo llegaría con `outfits` en `undefined` (regla 5).
  outfits: [],
  usos: [],
};

/**
 * Crea una prenda con TODOS los campos del apartado 14, aunque la mayoría lleguen
 * vacíos. Que existan desde el principio es lo que evita la migración de la Fase 3.
 */
export function crearPrenda(datos = {}) {
  const ahora = new Date().toISOString();
  return {
    id: uid(),
    nombre: (datos.nombre || '').trim(),
    categoria: datos.categoria || 'otros',
    subcategoria: datos.subcategoria || '',
    color: datos.color || 'otro',
    colorSecundario: datos.colorSecundario || '',
    marca: (datos.marca || '').trim(),
    talla: (datos.talla || '').trim(),
    // Ruta en el bucket privado de Storage, no la imagen: igual que las fotos de
    // Salud y los vídeos de Calistenia. Vacía si Josué no puso foto — el apartado 4
    // insiste en que el armario funcione perfectamente sin ninguna fotografía.
    fotoPath: datos.fotoPath || '',
    temporada: datos.temporada || 'todo_el_ano',
    material: (datos.material || '').trim(),
    notas: (datos.notas || '').trim(),
    precio: datos.precio === '' || datos.precio == null ? null : Number(datos.precio),
    fechaCompra: datos.fechaCompra || '',
    estado: datos.estado || 'disponible',
    favorita: !!datos.favorita,
    // --- Preparado para las fases 3 y 4 (apartados 14 y 15). Vacío hoy. ---
    usos: 0,
    ultimoUso: null,
    creadaEn: datos.creadaEn || ahora,
    actualizadaEn: ahora,
  };
}

/** Aplica cambios a una prenda conservando lo que no se toca y sellando la fecha. */
export function actualizarPrenda(prenda, cambios = {}) {
  const precio = 'precio' in cambios
    ? (cambios.precio === '' || cambios.precio == null ? null : Number(cambios.precio))
    : prenda.precio;
  return {
    ...prenda,
    ...cambios,
    precio,
    // Estos NO se dejan sobrescribir desde el formulario: son historia, y una edición
    // de la talla no puede borrar cuántas veces se ha puesto la prenda.
    usos: prenda.usos,
    ultimoUso: prenda.ultimoUso,
    creadaEn: prenda.creadaEn,
    actualizadaEn: new Date().toISOString(),
  };
}

const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function categoriaDe(id) {
  return CATEGORIAS_ARMARIO.find((c) => c.id === id) || { id, label: 'Otros', icono: 'Package' };
}
export function colorDe(id) {
  return COLORES_ARMARIO.find((c) => c.id === id) || COLORES_ARMARIO[COLORES_ARMARIO.length - 1];
}
export function estadoDe(id) {
  return ESTADOS_PRENDA.find((e) => e.id === id) || ESTADOS_PRENDA[0];
}

/**
 * Apartado 9 — búsqueda instantánea, y explícitamente **no solo por nombre**:
 * "gris" tiene que encontrar prendas grises y "Nike" prendas de Nike.
 *
 * Busca sobre el texto visible de la prenda (nombre, marca, talla, notas, material)
 * MÁS las etiquetas de sus listas (categoría, color, estado, temporada), no sus ids:
 * Josué escribe "marrón", no "marron_id".
 */
export function buscarPrendas(prendas, consulta) {
  const q = norm(consulta).trim();
  if (!q) return prendas || [];
  return (prendas || []).filter((p) => {
    const texto = [
      p.nombre, p.marca, p.talla, p.notas, p.material, p.subcategoria,
      categoriaDe(p.categoria).label,
      colorDe(p.color).label,
      p.colorSecundario ? colorDe(p.colorSecundario).label : '',
      estadoDe(p.estado).label,
      (TEMPORADAS_PRENDA.find((t) => t.id === p.temporada) || {}).label,
    ].map(norm).join(' ');
    return texto.includes(q);
  });
}

/**
 * Apartado 10 — filtros combinables ("Pantalones + Gris + Nike").
 *
 * Un filtro vacío no filtra. Los cinco se aplican en cadena, así que combinarlos es
 * gratis y añadir uno nuevo en el futuro es una línea.
 */
export function filtrarPrendas(prendas, filtros = {}) {
  const { categoria, color, marca, temporada, estado, soloFavoritas } = filtros;
  return (prendas || []).filter((p) => {
    if (categoria && p.categoria !== categoria) return false;
    if (color && p.color !== color) return false;
    if (temporada && p.temporada !== temporada) return false;
    if (estado && p.estado !== estado) return false;
    if (soloFavoritas && !p.favorita) return false;
    // La marca la escribe Josué a mano, así que se compara sin acentos ni mayúsculas.
    if (marca && norm(p.marca) !== norm(marca)) return false;
    return true;
  });
}

/** Apartado 11 — ordenación. Devuelve una copia; nunca ordena la lista original. */
export function ordenarPrendas(prendas, orden = 'recientes') {
  const lista = [...(prendas || [])];
  const porNombre = (a, b) => norm(a.nombre).localeCompare(norm(b.nombre), 'es');
  switch (orden) {
    case 'antiguas': return lista.sort((a, b) => String(a.creadaEn).localeCompare(String(b.creadaEn)));
    case 'az': return lista.sort(porNombre);
    case 'za': return lista.sort((a, b) => porNombre(b, a));
    case 'categoria': return lista.sort((a, b) =>
      categoriaDe(a.categoria).label.localeCompare(categoriaDe(b.categoria).label, 'es') || porNombre(a, b));
    case 'mas_usadas': return lista.sort((a, b) => (b.usos || 0) - (a.usos || 0) || porNombre(a, b));
    case 'menos_usadas': return lista.sort((a, b) => (a.usos || 0) - (b.usos || 0) || porNombre(a, b));
    // Sin uso registrado, `ultimoUso` es null: esas prendas son justamente las que
    // más tiempo llevan sin usarse, así que van primero.
    case 'sin_usar': return lista.sort((a, b) => {
      if (!a.ultimoUso && !b.ultimoUso) return porNombre(a, b);
      if (!a.ultimoUso) return -1;
      if (!b.ultimoUso) return 1;
      return String(a.ultimoUso).localeCompare(String(b.ultimoUso));
    });
    case 'recientes':
    default: return lista.sort((a, b) => String(b.creadaEn).localeCompare(String(a.creadaEn)));
  }
}

/** Buscar + filtrar + ordenar, en el orden en que tiene sentido hacerlo. */
export function prendasVisibles(prendas, { consulta = '', filtros = {}, orden = 'recientes' } = {}) {
  return ordenarPrendas(filtrarPrendas(buscarPrendas(prendas, consulta), filtros), orden);
}

/** Marcas que Josué ha escrito de verdad, para el desplegable de filtro. */
export function marcasDe(prendas) {
  const vistas = new Map();
  for (const p of prendas || []) {
    const m = (p.marca || '').trim();
    if (m && !vistas.has(norm(m))) vistas.set(norm(m), m);
  }
  return [...vistas.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Cuántas prendas hay en cada categoría, para las pastillas de filtro. */
export function conteoPorCategoria(prendas) {
  const conteo = {};
  for (const p of prendas || []) conteo[p.categoria] = (conteo[p.categoria] || 0) + 1;
  return conteo;
}

/**
 * Apartado 11 — las ordenaciones que dependen del uso solo se ofrecen cuando hay
 * uso que ordenar. Mientras la Fase 3 no exista, esto devuelve siempre las cinco
 * primeras, y así no aparece un control que no puede hacer nada.
 */
export function ordenesDisponibles(prendas) {
  const hayUso = (prendas || []).some((p) => (p.usos || 0) > 0);
  return ORDENES_ARMARIO.filter((o) => !o.requiereUso || hayUso);
}

/** Resumen para la cabecera y para el hub de Gestión. */
export function resumenArmario(armario) {
  const prendas = (armario && armario.prendas) || [];
  const disponibles = prendas.filter((p) => p.estado === 'disponible').length;
  return {
    total: prendas.length,
    disponibles,
    categorias: Object.keys(conteoPorCategoria(prendas)).length,
    conFoto: prendas.filter((p) => p.fotoPath).length,
  };
}


// ===========================================================================
// Entrega 2 · AR Fase 2 — Outfits
//
// LA REGLA QUE MANDA (apartados 1 y 19)
// Un outfit REFERENCIA prendas, nunca las copia. Guarda `prendaIds`, no objetos.
// Si Josué le cambia el nombre a una prenda o le pone una foto, el outfit sigue
// apuntando a la misma prenda y se entera del cambio solo. Copiar los datos
// dentro del outfit sería justo lo que la especificación prohíbe.
//
// Y AL REVÉS NO SE GUARDA NADA
// La relación vive en un único sitio: `outfit.prendaIds`. No hay una lista de
// outfits dentro de cada prenda, porque dos listas para la misma relación es como
// se desincronizan los datos. `outfitsConPrenda()` la deriva cuando hace falta.
// ===========================================================================

// Apartado 5 — el selector agrupa las prendas por ZONA del cuerpo, no por las 14
// categorías: elegir "parte superior" es como se piensa al vestirse. Es una vista
// sobre las categorías que ya existen, no una segunda clasificación que Josué
// tenga que rellenar.
export const ZONAS_OUTFIT = [
  { id: 'superior', label: 'Parte superior', categorias: ['camisetas', 'camisas', 'polos', 'sudaderas', 'jerseis'] },
  { id: 'inferior', label: 'Parte inferior', categorias: ['pantalones', 'shorts', 'chandal'] },
  { id: 'calzado', label: 'Calzado', categorias: ['zapatillas', 'zapatos'] },
  { id: 'abrigo', label: 'Abrigo', categorias: ['chaquetas', 'abrigos'] },
  { id: 'accesorios', label: 'Accesorios', categorias: ['accesorios'] },
  { id: 'otros', label: 'Otros', categorias: ['otros'] },
];

export function zonaDeCategoria(categoriaId) {
  const z = ZONAS_OUTFIT.find((x) => x.categorias.includes(categoriaId));
  return z ? z.id : 'otros';
}

export const OCASIONES_OUTFIT = [
  { id: 'diario', label: 'Diario' },
  { id: 'casual', label: 'Casual' },
  { id: 'deporte', label: 'Deporte' },
  { id: 'estudios', label: 'Universidad/estudios' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'cena', label: 'Cena' },
  { id: 'fiesta', label: 'Fiesta' },
  { id: 'evento', label: 'Evento' },
  { id: 'formal', label: 'Formal' },
  { id: 'viaje', label: 'Viaje' },
  { id: 'otro', label: 'Otro' },
];

// Las estaciones del apartado 10 son cinco y no coinciden con las cuatro
// temporadas de una prenda: una prenda es "de invierno", un outfit se lleva "en
// otoño". Se dejan separadas a propósito en vez de forzar una lista común.
export const ESTACIONES_OUTFIT = [
  { id: 'todo_el_ano', label: 'Todo el año' },
  { id: 'primavera', label: 'Primavera' },
  { id: 'verano', label: 'Verano' },
  { id: 'otono', label: 'Otoño' },
  { id: 'invierno', label: 'Invierno' },
];

export const ORDENES_OUTFITS = [
  { id: 'recientes', label: 'Creados recientemente' },
  { id: 'antiguos', label: 'Creados hace más tiempo' },
  { id: 'az', label: 'Nombre A-Z' },
  { id: 'za', label: 'Nombre Z-A' },
  { id: 'favoritos', label: 'Favoritos primero' },
  { id: 'mas_usados', label: 'Más usados', requiereUso: true },
  { id: 'menos_usados', label: 'Menos usados', requiereUso: true },
  { id: 'sin_usar', label: 'Más tiempo sin usar', requiereUso: true },
];

/** Crea un outfit. Solo el nombre es obligatorio (apartado 25: rápido). */
export function crearOutfit(datos = {}) {
  const ahora = new Date().toISOString();
  return {
    id: uid(),
    nombre: (datos.nombre || '').trim(),
    descripcion: (datos.descripcion || '').trim(),
    // Referencias, nunca copias (apartados 1 y 19). Sin duplicados: añadir dos veces
    // la misma prenda a un outfit no significa nada.
    prendaIds: [...new Set(datos.prendaIds || [])],
    fotoPath: datos.fotoPath || '',
    ocasion: datos.ocasion || 'diario',
    estacion: datos.estacion || 'todo_el_ano',
    // Apartados 10 y 11: `lugar` y `personas` se guardan desde ya porque la Fase 3
    // los necesita para el historial ("¿dónde lo usé? ¿con quién?"). `personas` es
    // una lista de texto libre, no un sistema social: eso lo prohíbe el apartado 11.
    lugar: (datos.lugar || '').trim(),
    personas: Array.isArray(datos.personas) ? datos.personas.filter(Boolean) : [],
    favorito: !!datos.favorito,
    // --- Apartado 18: preparado para la Fase 3. Vacío hoy. ---
    usos: 0,
    ultimoUso: null,
    creadoEn: datos.creadoEn || ahora,
    actualizadoEn: ahora,
  };
}

export function actualizarOutfit(outfit, cambios = {}) {
  return {
    ...outfit,
    ...cambios,
    prendaIds: cambios.prendaIds ? [...new Set(cambios.prendaIds)] : outfit.prendaIds,
    // Historia: no se sobrescribe desde el formulario.
    usos: outfit.usos,
    ultimoUso: outfit.ultimoUso,
    creadoEn: outfit.creadoEn,
    actualizadoEn: new Date().toISOString(),
  };
}

/**
 * Apartado 14 — duplicar. La copia es independiente pero **usa las mismas prendas**,
 * y arranca con el historial a cero: es un outfit nuevo, no se ha llevado nunca.
 */
export function duplicarOutfit(outfit) {
  return crearOutfit({
    ...outfit,
    nombre: `${outfit.nombre} (copia)`,
    prendaIds: [...outfit.prendaIds],
    personas: [...outfit.personas],
    creadoEn: undefined,
  });
}

/** Las prendas de un outfit, en el orden en que se añadieron. Ignora las que ya no existen. */
export function prendasDeOutfit(outfit, prendas) {
  const porId = new Map((prendas || []).map((p) => [p.id, p]));
  return (outfit?.prendaIds || []).map((id) => porId.get(id)).filter(Boolean);
}

/**
 * QUÉ PASA CUANDO SE BORRA UNA PRENDA QUE ESTÁ EN UN OUTFIT
 *
 * La especificación deja elegir entre tres salidas (apartado 10 de la continuación):
 * impedir el borrado, conservar una referencia histórica, o mostrarla como no
 * disponible. Aquí se elige **conservar la referencia y mostrarla como no
 * disponible**, y el motivo es concreto:
 *
 * Desde ME Fase 3 borrar una prenda la manda a la papelera, así que **se puede
 * restaurar**. Si al borrarla le quitáramos su id a todos los outfits, restaurar la
 * prenda dejaría los outfits rotos para siempre — el dato volvería pero el vínculo
 * no. Conservando la referencia, restaurar la prenda **cura los outfits solos**, sin
 * ningún código de reparación.
 *
 * Mientras la prenda no esté, el outfit lo dice ("1 prenda no disponible") en vez de
 * fingir que tiene una prenda menos. Y `deletePrenda` avisa antes de borrar si la
 * prenda está en algún outfit.
 *
 * Devuelve la composición COMPLETA en su orden: `{ id, prenda }`, con `prenda: null`
 * para las que ya no están.
 */
export function composicionDeOutfit(outfit, prendas) {
  const porId = new Map((prendas || []).map((p) => [p.id, p]));
  return (outfit?.prendaIds || []).map((id) => ({ id, prenda: porId.get(id) || null }));
}

/**
 * Cuántas prendas del outfit no se pueden usar hoy: las que ya no están en el
 * armario y las que están en la lavadora, en reparación o marcadas como no
 * disponibles (apartado 14 del pulido, y apartado 6 del cierre técnico: la Fase 4
 * necesitará este dato para no recomendar un outfit imposible de ponerse).
 */
export function noDisponiblesDeOutfit(outfit, prendas) {
  return composicionDeOutfit(outfit, prendas)
    .filter(({ prenda }) => !prenda || prenda.estado !== 'disponible')
    .length;
}

/**
 * Apartado 22 — "Outfits que utilizan el vaquero gris". Se deriva de `prendaIds`,
 * que es la única lista que existe, así que nunca puede estar desincronizada.
 */
export function outfitsConPrenda(outfits, prendaId) {
  return (outfits || []).filter((o) => (o.prendaIds || []).includes(prendaId));
}

/**
 * Apartado 23 — búsqueda. El ejemplo de la especificación es el que manda: buscar
 * "negro" tiene que encontrar un outfit llamado "Total Black" **si contiene una
 * prenda negra**, aunque su nombre no lleve esa palabra. Por eso la búsqueda mira
 * también el texto de las prendas que lo componen.
 */
export function buscarOutfits(outfits, prendas, consulta) {
  const q = norm(consulta).trim();
  if (!q) return outfits || [];
  return (outfits || []).filter((o) => {
    const propio = [
      o.nombre, o.descripcion, o.lugar,
      (OCASIONES_OUTFIT.find((x) => x.id === o.ocasion) || {}).label,
      (ESTACIONES_OUTFIT.find((x) => x.id === o.estacion) || {}).label,
      ...(o.personas || []),
    ].map(norm).join(' ');
    if (propio.includes(q)) return true;
    return prendasDeOutfit(o, prendas).some((p) =>
      [p.nombre, p.marca, categoriaDe(p.categoria).label, colorDe(p.color).label].map(norm).join(' ').includes(q));
  });
}

/** Apartado 22 — filtros combinables, incluido "los que llevan esta prenda". */
export function filtrarOutfits(outfits, filtros = {}) {
  const { ocasion, estacion, lugar, prendaId, soloFavoritos } = filtros;
  return (outfits || []).filter((o) => {
    if (ocasion && o.ocasion !== ocasion) return false;
    if (estacion && o.estacion !== estacion) return false;
    if (lugar && norm(o.lugar) !== norm(lugar)) return false;
    if (prendaId && !(o.prendaIds || []).includes(prendaId)) return false;
    if (soloFavoritos && !o.favorito) return false;
    return true;
  });
}

/** Apartado 24 — ordenación. Devuelve una copia. */
export function ordenarOutfits(outfits, orden = 'recientes') {
  const lista = [...(outfits || [])];
  const porNombre = (a, b) => norm(a.nombre).localeCompare(norm(b.nombre), 'es');
  switch (orden) {
    case 'antiguos': return lista.sort((a, b) => String(a.creadoEn).localeCompare(String(b.creadoEn)));
    case 'az': return lista.sort(porNombre);
    case 'za': return lista.sort((a, b) => porNombre(b, a));
    case 'favoritos': return lista.sort((a, b) => (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0) || String(b.creadoEn).localeCompare(String(a.creadoEn)));
    case 'mas_usados': return lista.sort((a, b) => (b.usos || 0) - (a.usos || 0) || porNombre(a, b));
    case 'menos_usados': return lista.sort((a, b) => (a.usos || 0) - (b.usos || 0) || porNombre(a, b));
    case 'sin_usar': return lista.sort((a, b) => {
      if (!a.ultimoUso && !b.ultimoUso) return porNombre(a, b);
      if (!a.ultimoUso) return -1;
      if (!b.ultimoUso) return 1;
      return String(a.ultimoUso).localeCompare(String(b.ultimoUso));
    });
    case 'recientes':
    default: return lista.sort((a, b) => String(b.creadoEn).localeCompare(String(a.creadoEn)));
  }
}

export function outfitsVisibles(outfits, prendas, { consulta = '', filtros = {}, orden = 'recientes' } = {}) {
  return ordenarOutfits(filtrarOutfits(buscarOutfits(outfits, prendas, consulta), filtros), orden);
}

/** Mismo criterio que en prendas: sin uso registrado no se ofrece ordenar por uso. */
export function ordenesOutfitsDisponibles(outfits) {
  const hayUso = (outfits || []).some((o) => (o.usos || 0) > 0);
  return ORDENES_OUTFITS.filter((o) => !o.requiereUso || hayUso);
}

/** Lugares que Josué ha escrito de verdad, para el desplegable de filtro. */
export function lugaresDe(outfits) {
  const vistos = new Map();
  for (const o of outfits || []) {
    const l = (o.lugar || '').trim();
    if (l && !vistos.has(norm(l))) vistos.set(norm(l), l);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Las prendas de un outfit repartidas por zona, para la vista previa del apartado 8.
 * Solo devuelve las zonas que tienen algo: una fila "Calzado" vacía no aporta nada.
 */
export function composicionPorZonas(outfit, prendas) {
  const lista = prendasDeOutfit(outfit, prendas);
  return ZONAS_OUTFIT
    .map((z) => ({ zona: z, prendas: lista.filter((p) => zonaDeCategoria(p.categoria) === z.id) }))
    .filter((g) => g.prendas.length > 0);
}

/**
 * Apartado 22 del cierre técnico, dicho al revés: cuántas veces se ha usado cada
 * prenda EN OUTFITS. No es "cuántas veces me la he puesto" —eso llega en la Fase 3
 * con el historial— sino en cuántas combinaciones aparece. Se deriva de `prendaIds`,
 * así que no hay contador que mantener ni que pueda desincronizarse.
 */
export function usoEnOutfits(outfits, prendaId) {
  return outfitsConPrenda(outfits, prendaId).length;
}

/**
 * Quita una prenda de todos los outfits que la usen.
 *
 * OJO: esto NO se llama al borrar una prenda — ver `composicionDeOutfit` para el
 * porqué (la papelera hace el borrado reversible, y quitar la referencia impediría
 * que restaurarla curase los outfits). Queda para el día en que exista un borrado
 * de verdad definitivo que haga imposible la vuelta atrás.
 *
 * Devuelve la lista de outfits ya limpia, o la misma si no había nada que limpiar
 * — así quien llama puede saltarse el guardado cuando no hace falta.
 */
export function limpiarPrendaDeOutfits(outfits, prendaId) {
  let cambio = false;
  const siguiente = (outfits || []).map((o) => {
    if (!(o.prendaIds || []).includes(prendaId)) return o;
    cambio = true;
    return { ...o, prendaIds: o.prendaIds.filter((x) => x !== prendaId), actualizadoEn: new Date().toISOString() };
  });
  return cambio ? siguiente : outfits;
}
