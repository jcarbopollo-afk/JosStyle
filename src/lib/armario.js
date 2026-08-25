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
// `usos`, `ultimoUso`, `outfits` y `favorita` están desde el primer día y vacíos.
// No son adorno: la Fase 3 (calendario e historial) y la Fase 4 (anti-repetición)
// necesitan responder a "¿cuándo la usé por última vez?" y "¿cuánto lleva sin
// usarse?", y si esos campos aparecen después, todas las prendas ya guardadas se
// quedan sin ellos — y `loadData` NO fusiona con el valor por defecto (regla 5),
// así que arreglarlo luego exige una migración manual prenda a prenda.
//
// Lo que NO se hace aquí, a propósito (apartado 24): ni outfits, ni calendario,
// ni recomendaciones, ni estadísticas. Solo la estructura que las hará posibles.
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
    // --- Preparado para las fases 2, 3 y 4 (apartados 14 y 15). Vacío hoy. ---
    usos: 0,
    ultimoUso: null,
    outfits: [],
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
    // Estos tres NO se dejan sobrescribir desde el formulario: son historia, y una
    // edición de la talla no puede borrar cuántas veces se ha puesto la prenda.
    usos: prenda.usos,
    ultimoUso: prenda.ultimoUso,
    outfits: prenda.outfits,
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

