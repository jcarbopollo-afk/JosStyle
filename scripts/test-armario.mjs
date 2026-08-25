// ---------------------------------------------------------------------------
// Entrega 2 · AR Fase 1 — pruebas del armario digital.
//
// El apartado 25 trae su propio control de calidad. Lo que se puede comprobar sin
// un navegador es el motor: el modelo de datos, la búsqueda, los filtros y el orden.
// Lo demás (subir una foto, el aspecto en un iPhone) solo lo puede ver Josué.
//
// Hay una prueba que importa más que las otras y no es evidente: **que la prenda
// nace con todos los campos del apartado 14**, incluidos los que hoy están vacíos.
// `loadData` no fusiona con el valor por defecto (regla 5 del proyecto), así que un
// campo que aparezca en la Fase 3 no lo tendrán las prendas ya guardadas — y
// arreglarlo entonces exige una migración manual. Por eso se comprueba hoy.
// ---------------------------------------------------------------------------
import {
  CATEGORIAS_ARMARIO, COLORES_ARMARIO, ESTADOS_PRENDA, TEMPORADAS_PRENDA, ORDENES_ARMARIO,
  DEFAULT_ARMARIO, crearPrenda, actualizarPrenda, buscarPrendas, filtrarPrendas,
  ordenarPrendas, prendasVisibles, marcasDe, conteoPorCategoria, ordenesDisponibles,
  categoriaDe, colorDe, estadoDe, resumenArmario,
} from '../src/lib/armario.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ AR Fase 1 — armario digital ═══\n');

// --- Catálogos (apartados 3, 4, 13) ---
{
  comprobar('Las 14 categorías del apartado 3', CATEGORIAS_ARMARIO.length === 14, String(CATEGORIAS_ARMARIO.length));
  comprobar('Toda categoría tiene id y etiqueta', CATEGORIAS_ARMARIO.every((c) => c.id && c.label));
  comprobar('Ids de categoría únicos', new Set(CATEGORIAS_ARMARIO.map((c) => c.id)).size === CATEGORIAS_ARMARIO.length);
  comprobar('Los 5 estados del apartado 13', ESTADOS_PRENDA.length === 5);
  comprobar('Todo color tiene una muestra para pintarlo sin foto', COLORES_ARMARIO.every((c) => /^#[0-9A-F]{6}$/i.test(c.muestra)));
  comprobar('Una categoría desconocida no revienta', categoriaDe('inventada').label === 'Otros');
  comprobar('Un color desconocido cae en "Otro"', colorDe('fucsia').id === 'otro');
  comprobar('Un estado desconocido cae en "Disponible"', estadoDe('zzz').id === 'disponible');
}

// --- Modelo de datos (apartados 14 y 15): la prueba que evita una migración futura ---
{
  const p = crearPrenda({ nombre: '  Vaquero gris  ', categoria: 'pantalones', color: 'gris' });
  const esperados = [
    'id', 'nombre', 'categoria', 'subcategoria', 'color', 'colorSecundario', 'marca', 'talla',
    'fotoPath', 'temporada', 'material', 'notas', 'precio', 'fechaCompra', 'estado', 'favorita',
    'usos', 'ultimoUso', 'creadaEn', 'actualizadaEn',
  ];
  for (const campo of esperados) {
    comprobar(`La prenda nace con "${campo}"`, campo in p);
  }
  comprobar('El nombre llega recortado', p.nombre === 'Vaquero gris');
  comprobar('Sin foto, fotoPath es una cadena vacía (no undefined)', p.fotoPath === '');
  comprobar('Los campos de uso empiezan a cero, listos para la Fase 3',
    p.usos === 0 && p.ultimoUso === null);
  // AR Fase 2 quitó `prenda.outfits`: la relación la manda `outfit.prendaIds`, y dos
  // listas para el mismo vínculo es como se desincronizan los datos. Se comprueba que
  // NO vuelva a colarse, porque el error natural es "prepararlo por si acaso".
  comprobar('La prenda NO guarda su lista de outfits (una sola fuente de verdad)', !('outfits' in p));
  comprobar('El precio vacío es null, no NaN', crearPrenda({ precio: '' }).precio === null);
  comprobar('El precio escrito se guarda como número', crearPrenda({ precio: '39.90' }).precio === 39.9);
  comprobar('Sin categoría cae en "otros"', crearPrenda({}).categoria === 'otros');
  comprobar('Dos prendas nunca comparten id', crearPrenda({}).id !== crearPrenda({}).id);
  comprobar('DEFAULT_ARMARIO declara ya las sub-listas de las fases 2 y 3',
    Array.isArray(DEFAULT_ARMARIO.prendas) && Array.isArray(DEFAULT_ARMARIO.outfits) && Array.isArray(DEFAULT_ARMARIO.usos));
}

// --- Edición (apartado 8) ---
{
  const p = { ...crearPrenda({ nombre: 'Camiseta', categoria: 'camisetas', color: 'negro' }), usos: 12, ultimoUso: '2026-08-01' };
  const editada = actualizarPrenda(p, { nombre: 'Camiseta negra', talla: 'M', color: 'blanco' });

  comprobar('Editar cambia lo que se le pide', editada.nombre === 'Camiseta negra' && editada.talla === 'M' && editada.color === 'blanco');
  comprobar('...y conserva lo que no se toca', editada.categoria === 'camisetas');
  comprobar('...y mantiene el id', editada.id === p.id);
  comprobar('Editar NO borra el historial de uso', editada.usos === 12 && editada.ultimoUso === '2026-08-01');
  comprobar('Editar conserva la fecha de creación', editada.creadaEn === p.creadaEn);
  // Aunque alguien intente colarlo desde el formulario, `usos` no se sobrescribe:
  // una edición de la talla no puede reescribir cuántas veces te has puesto la prenda.
  comprobar('Un intento de sobrescribir "usos" se ignora', actualizarPrenda(p, { usos: 0 }).usos === 12);
}

// --- Búsqueda (apartado 9): explícitamente NO solo por nombre ---
const prendas = [
  { ...crearPrenda({ nombre: 'Vaquero gris', categoria: 'pantalones', color: 'gris', marca: "Levi's", talla: '30' }), creadaEn: '2026-01-01T00:00:00Z' },
  { ...crearPrenda({ nombre: 'Camiseta básica', categoria: 'camisetas', color: 'negro', marca: 'Nike' }), creadaEn: '2026-03-01T00:00:00Z' },
  { ...crearPrenda({ nombre: 'Sudadera', categoria: 'sudaderas', color: 'gris', marca: 'Nike', estado: 'lavanderia', favorita: true }), creadaEn: '2026-02-01T00:00:00Z' },
  { ...crearPrenda({ nombre: 'Abrigo largo', categoria: 'abrigos', color: 'marron', temporada: 'invierno' }), creadaEn: '2026-04-01T00:00:00Z' },
];
const nombres = (lista) => lista.map((p) => p.nombre);
{
  comprobar('Busca por nombre', nombres(buscarPrendas(prendas, 'vaquero')).join() === 'Vaquero gris');
  comprobar('Busca por COLOR (ejemplo literal: "gris")', buscarPrendas(prendas, 'gris').length === 2, String(buscarPrendas(prendas, 'gris').length));
  comprobar('Busca por MARCA (ejemplo literal: "Nike")', buscarPrendas(prendas, 'Nike').length === 2);
  comprobar('Busca por categoría', nombres(buscarPrendas(prendas, 'abrigo')).length === 1);
  comprobar('Busca por talla', nombres(buscarPrendas(prendas, '30')).join() === 'Vaquero gris');
  comprobar('Busca por estado', nombres(buscarPrendas(prendas, 'lavander')).join() === 'Sudadera');
  comprobar('Ignora acentos y mayúsculas', buscarPrendas(prendas, 'BÁSICA').length === 1);
  comprobar('"basica" sin tilde también encuentra', buscarPrendas(prendas, 'basica').length === 1);
  comprobar('Una consulta vacía devuelve todo', buscarPrendas(prendas, '').length === 4);
  comprobar('Algo que no existe no devuelve nada', buscarPrendas(prendas, 'zzzz').length === 0);
  comprobar('Una lista nula no revienta', buscarPrendas(null, 'gris').length === 0);
}

// --- Filtros combinables (apartado 10) ---
{
  comprobar('Filtra por categoría', filtrarPrendas(prendas, { categoria: 'camisetas' }).length === 1);
  comprobar('Filtra por color', filtrarPrendas(prendas, { color: 'gris' }).length === 2);
  comprobar('Filtra por marca sin distinguir mayúsculas', filtrarPrendas(prendas, { marca: 'nike' }).length === 2);
  comprobar('Filtra por temporada', filtrarPrendas(prendas, { temporada: 'invierno' }).length === 1);
  comprobar('Filtra por estado', filtrarPrendas(prendas, { estado: 'lavanderia' }).length === 1);
  comprobar('Filtra solo favoritas', filtrarPrendas(prendas, { soloFavoritas: true }).length === 1);
  // El ejemplo literal del apartado 10: "Pantalones + Gris + Nike" no existe...
  comprobar('Combinar tres filtros que no casan devuelve vacío',
    filtrarPrendas(prendas, { categoria: 'pantalones', color: 'gris', marca: 'Nike' }).length === 0);
  // ...pero "Sudaderas + Gris + Nike" sí.
  comprobar('Combinar tres filtros que sí casan devuelve la prenda',
    nombres(filtrarPrendas(prendas, { categoria: 'sudaderas', color: 'gris', marca: 'Nike' })).join() === 'Sudadera');
  comprobar('Sin filtros no filtra nada', filtrarPrendas(prendas, {}).length === 4);
}

// --- Ordenación (apartado 11) ---
{
  comprobar('Por defecto, las más recientes primero',
    nombres(ordenarPrendas(prendas))[0] === 'Abrigo largo', nombres(ordenarPrendas(prendas))[0]);
  comprobar('Las más antiguas primero', nombres(ordenarPrendas(prendas, 'antiguas'))[0] === 'Vaquero gris');
  comprobar('A-Z', nombres(ordenarPrendas(prendas, 'az'))[0] === 'Abrigo largo');
  comprobar('Z-A', nombres(ordenarPrendas(prendas, 'za'))[0] === 'Vaquero gris');
  comprobar('Por categoría, alfabéticamente', nombres(ordenarPrendas(prendas, 'categoria'))[0] === 'Abrigo largo');
  comprobar('Ordenar no muta la lista original', nombres(prendas)[0] === 'Vaquero gris');
  comprobar('Un orden desconocido no revienta', ordenarPrendas(prendas, 'inventado').length === 4);
}

// --- Las ordenaciones por uso son de la Fase 3: hoy no se ofrecen ---
{
  comprobar('Sin ningún uso registrado, solo 5 ordenaciones', ordenesDisponibles(prendas).length === 5, String(ordenesDisponibles(prendas).length));
  comprobar('...y ninguna de ellas depende del uso', ordenesDisponibles(prendas).every((o) => !o.requiereUso));
  const conUso = [...prendas, { ...crearPrenda({ nombre: 'Polo' }), usos: 3, ultimoUso: '2026-08-20' }];
  comprobar('En cuanto haya un uso, aparecen las 8', ordenesDisponibles(conUso).length === 8);
  comprobar('El catálogo completo tiene 8 ordenaciones', ORDENES_ARMARIO.length === 8);
  // La lógica ya está escrita, aunque no se pueda usar todavía: la Fase 3 solo tiene
  // que empezar a llenar `usos` y `ultimoUso`.
  comprobar('"Más usadas" ya funciona cuando hay datos', ordenarPrendas(conUso, 'mas_usadas')[0].nombre === 'Polo');
  comprobar('"Más tiempo sin usar" pone primero las que nunca se han usado',
    ordenarPrendas(conUso, 'sin_usar')[0].nombre !== 'Polo');
}

// --- Buscar + filtrar + ordenar a la vez ---
{
  const r = prendasVisibles(prendas, { consulta: 'nike', filtros: { color: 'gris' }, orden: 'az' });
  comprobar('Búsqueda, filtro y orden se combinan', nombres(r).join() === 'Sudadera', nombres(r).join());
  comprobar('Sin nada, devuelve todo ordenado', prendasVisibles(prendas).length === 4);
}

// --- Ayudas de la interfaz ---
{
  comprobar('Las marcas salen sin repetir y ordenadas', marcasDe(prendas).join() === "Levi's,Nike", marcasDe(prendas).join());
  comprobar('Una prenda sin marca no aporta una marca vacía', !marcasDe(prendas).includes(''));
  const c = conteoPorCategoria(prendas);
  comprobar('Cuenta bien por categoría', c.pantalones === 1 && c.camisetas === 1 && c.sudaderas === 1);
  comprobar('Una categoría sin prendas no aparece en el conteo', !('polos' in c));
}

// --- Resumen para el hub ---
{
  const r = resumenArmario({ prendas });
  comprobar('El resumen cuenta el total', r.total === 4);
  comprobar('...y cuántas están disponibles de verdad', r.disponibles === 3, String(r.disponibles));
  comprobar('...y cuántas categorías distintas hay', r.categorias === 4);
  const vacio = resumenArmario(null);
  comprobar('Un armario nulo no revienta', vacio.total === 0 && vacio.disponibles === 0);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
