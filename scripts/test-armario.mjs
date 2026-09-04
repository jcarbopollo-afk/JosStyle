// ---------------------------------------------------------------------------
// Entrega 2 · AR Fases 1 y 2 — pruebas del armario digital y de los outfits.
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
  ZONAS_OUTFIT, OCASIONES_OUTFIT, ESTACIONES_OUTFIT, ORDENES_OUTFITS, zonaDeCategoria,
  crearOutfit, actualizarOutfit, duplicarOutfit, prendasDeOutfit, outfitsConPrenda,
  buscarOutfits, filtrarOutfits, ordenarOutfits, outfitsVisibles, ordenesOutfitsDisponibles,
  lugaresDe, composicionPorZonas, composicionDeOutfit, noDisponiblesDeOutfit, prendasNoDisponiblesDeOutfit,
  usoEnOutfits, limpiarPrendaDeOutfits,
  EVENTOS_USO, RANGOS_HISTORIAL, crearUso, actualizarUso, usosDeOutfit, usosDePrenda,
  resumenDeUso, resumenOutfit, resumenPrenda, diasDesde, textoUltimoUso, usosDelDia,
  usosPorDia, filtrarUsos, desdeDelRango, lugaresDeUsos, personasDeUsos, usosHuerfanos,
  resumenHistorial, indiceUsoOutfits, indiceUsoPrendas,
} from '../src/lib/armario.js';
import { todayISO, addDays } from '../src/lib/helpers.js';
import { eventosDerivados, NOMBRES_ORIGEN } from '../src/lib/calendarioIntegracion.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ AR Fases 1 y 2 — armario y outfits ═══\n');

// --- Catálogos (apartados 3, 4, 13) ---
{
  /* ⚠️ **Una cuenta exacta en una prueba es una bomba de relojería**, y ésta
     estalló en la Entrega 3 · F3 al añadir *Ropa interior* — una categoría con
     todo el derecho a existir, pedida por el apartado 1 de esa fase. Es la
     enésima vez que pasa en este proyecto (`MODULOS_EH.length === 13` saltó
     nueve veces). Lo que hay que comprobar es **que estén las que tienen que
     estar**, no cuántas hay. */
  const ESPERADAS = ['camisetas', 'camisas', 'polos', 'sudaderas', 'jerseis', 'chaquetas', 'abrigos',
    'pantalones', 'shorts', 'chandal', 'zapatillas', 'zapatos', 'accesorios', 'otros'];
  const ids = CATEGORIAS_ARMARIO.map((c) => c.id);
  comprobar('Están las categorías del apartado 3 de AR F1',
    ESPERADAS.every((id) => ids.includes(id)), ESPERADAS.filter((id) => !ids.includes(id)).join(', '));
  comprobar('Y la ropa interior de la Entrega 3 · F3', ids.includes('ropa_interior'));
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
    'creadaEn', 'actualizadaEn',
  ];
  for (const campo of esperados) {
    comprobar(`La prenda nace con "${campo}"`, campo in p);
  }
  comprobar('El nombre llega recortado', p.nombre === 'Vaquero gris');
  comprobar('Sin foto, fotoPath es una cadena vacía (no undefined)', p.fotoPath === '');
  // AR Fase 3, apartado 17: los contadores guardados se han ido. "Cuántas veces me lo he
  // puesto" se deduce de `armario.usos`; un contador aparte es una segunda fuente de
  // verdad que se descuadra en cuanto se borra un uso sin decrementarlo.
  comprobar('La prenda NO guarda contadores de uso (se derivan del historial)',
    !('usos' in p) && !('ultimoUso' in p));
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
  const p = crearPrenda({ nombre: 'Camiseta', categoria: 'camisetas', color: 'negro' });
  const editada = actualizarPrenda(p, { nombre: 'Camiseta negra', talla: 'M', color: 'blanco' });

  comprobar('Editar cambia lo que se le pide', editada.nombre === 'Camiseta negra' && editada.talla === 'M' && editada.color === 'blanco');
  comprobar('...y conserva lo que no se toca', editada.categoria === 'camisetas');
  comprobar('...y mantiene el id', editada.id === p.id);
  comprobar('Editar conserva la fecha de creación', editada.creadaEn === p.creadaEn);
  // El historial ya no vive dentro de la prenda, así que editarla no puede tocarlo:
  // se comprueba que la edición tampoco resucite los contadores por la puerta de atrás.
  comprobar('Editar no reintroduce contadores de uso',
    !('usos' in editada) && !('ultimoUso' in editada));
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

// --- Las ordenaciones por uso dependen del HISTORIAL, no de la prenda ---
{
  comprobar('Sin ningún uso registrado, solo 5 ordenaciones', ordenesDisponibles([]).length === 5, String(ordenesDisponibles([]).length));
  comprobar('...y ninguna de ellas depende del uso', ordenesDisponibles([]).every((o) => !o.requiereUso));
  comprobar('Una lista de usos nula se trata como "sin usos"', ordenesDisponibles(null).length === 5);
  comprobar('En cuanto haya un uso, aparecen las 8', ordenesDisponibles([crearUso({ outfitId: 'x' })]).length === 8);
  comprobar('El catálogo completo tiene 8 ordenaciones', ORDENES_ARMARIO.length === 8);

  // El polo se lleva 3 usos porque está en un outfit que se registró 3 veces. Nadie
  // escribió "3" en ninguna parte.
  const polo = crearPrenda({ nombre: 'Polo' });
  const conPolo = [...prendas, polo];
  const outfitPolo = crearOutfit({ nombre: 'Con polo', prendaIds: [polo.id] });
  const usosPolo = ['2026-08-10', '2026-08-15', '2026-08-20'].map((fecha) => crearUso({ outfitId: outfitPolo.id, fecha }));
  const indice = indiceUsoPrendas(usosPolo, [outfitPolo]);

  comprobar('El índice cuenta 3 usos para el polo', indice.get(polo.id).veces === 3, String(indice.get(polo.id)?.veces));
  comprobar('...y guarda su última fecha', indice.get(polo.id).ultima === '2026-08-20');
  comprobar('Una prenda sin usos no está en el índice', !indice.has(prendas[0].id));
  comprobar('"Más usadas" ordena por el historial', ordenarPrendas(conPolo, 'mas_usadas', indice)[0].nombre === 'Polo');
  comprobar('"Menos usadas" deja el polo el último', ordenarPrendas(conPolo, 'menos_usadas', indice).at(-1).nombre === 'Polo');
  comprobar('"Más tiempo sin usar" pone primero las que nunca se han usado',
    ordenarPrendas(conPolo, 'sin_usar', indice).at(-1).nombre === 'Polo');
  comprobar('Sin índice, ordenar por uso no revienta', ordenarPrendas(conPolo, 'mas_usadas').length === 5);
  comprobar('prendasVisibles construye el índice por su cuenta',
    prendasVisibles(conPolo, { orden: 'mas_usadas', usos: usosPolo, outfits: [outfitPolo] })[0].nombre === 'Polo');
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

// ═══════════════════════════════════════════════════════════════════════════
// AR Fase 2 — Constructor de Outfits
//
// El apartado 31 trae su propia batería obligatoria. Está entera aquí, y con ella
// las dos pruebas que la especificación repite más veces porque son las que de
// verdad pueden salir mal:
//
//   · Duplicar un outfit y modificar la copia NO debe tocar el original.
//   · Eliminar un outfit NO debe eliminar ninguna prenda.
// ═══════════════════════════════════════════════════════════════════════════

const camiseta = crearPrenda({ nombre: 'Camiseta blanca', categoria: 'camisetas', color: 'blanco' });
const sudadera = crearPrenda({ nombre: 'Sudadera gris', categoria: 'sudaderas', color: 'gris', marca: 'Nike' });
const vaquero = crearPrenda({ nombre: 'Vaquero gris', categoria: 'pantalones', color: 'gris', marca: "Levi's" });
const airforce = crearPrenda({ nombre: 'Air Force 1', categoria: 'zapatillas', color: 'blanco', marca: 'Nike' });
const reloj = crearPrenda({ nombre: 'Reloj', categoria: 'accesorios', color: 'negro' });
const pantalonNegro = crearPrenda({ nombre: 'Pantalón elegante', categoria: 'pantalones', color: 'negro' });
const enLavadora = crearPrenda({ nombre: 'Polo azul', categoria: 'polos', color: 'azul', estado: 'lavanderia' });
const ARMARIO = [camiseta, sudadera, vaquero, airforce, reloj, pantalonNegro, enLavadora];

// --- Catálogos de la Fase 2 ---
{
  comprobar('Las 6 zonas del apartado 5', ZONAS_OUTFIT.length === 6, String(ZONAS_OUTFIT.length));
  comprobar('Las 11 ocasiones del apartado 10', OCASIONES_OUTFIT.length === 11, String(OCASIONES_OUTFIT.length));
  comprobar('Las 5 estaciones del apartado 10', ESTACIONES_OUTFIT.length === 5);
  comprobar('Toda categoría del armario cae en alguna zona',
    CATEGORIAS_ARMARIO.every((c) => ZONAS_OUTFIT.some((z) => z.categorias.includes(c.id))),
    CATEGORIAS_ARMARIO.filter((c) => !ZONAS_OUTFIT.some((z) => z.categorias.includes(c.id))).map((c) => c.id).join());
  comprobar('Ninguna categoría está en dos zonas a la vez',
    CATEGORIAS_ARMARIO.every((c) => ZONAS_OUTFIT.filter((z) => z.categorias.includes(c.id)).length === 1));
  comprobar('Una categoría desconocida cae en "otros"', zonaDeCategoria('inventada') === 'otros');
  comprobar('Las 8 ordenaciones del apartado 24', ORDENES_OUTFITS.length === 8);
}

// --- Modelo (apartados 1 y 19): referencias, NUNCA copias ---
{
  const o = crearOutfit({ nombre: '  Casual gris  ', prendaIds: [camiseta.id, sudadera.id, vaquero.id] });
  const esperados = [
    'id', 'nombre', 'descripcion', 'prendaIds', 'fotoPath', 'ocasion', 'estacion',
    'lugar', 'personas', 'favorito', 'creadoEn', 'actualizadoEn',
  ];
  for (const campo of esperados) comprobar(`El outfit nace con "${campo}"`, campo in o);

  // ESTA es la regla que más repite la especificación.
  comprobar('El outfit guarda IDS, no copias de las prendas',
    o.prendaIds.every((x) => typeof x === 'string'));
  comprobar('...y no guarda ningún objeto de prenda dentro',
    !JSON.stringify(o).includes('"categoria"'));
  comprobar('El nombre llega recortado', o.nombre === 'Casual gris');
  // Apartado 17 de la Fase 3: el uso no se guarda dentro del outfit, se deduce de
  // `armario.usos`. Un contador aquí sería una segunda fuente de verdad.
  comprobar('El outfit no guarda contadores de uso (apartado 17)', !('usos' in o) && !('ultimoUso' in o));
  comprobar('`personas` es una lista, no un texto suelto (apartado 9 del cierre)', Array.isArray(o.personas));
  comprobar('No se puede meter dos veces la misma prenda (apartado 3 de la continuación)',
    crearOutfit({ prendaIds: [camiseta.id, camiseta.id, sudadera.id] }).prendaIds.length === 2);
  comprobar('Dos outfits nunca comparten id', crearOutfit({}).id !== crearOutfit({}).id);
  comprobar('Un outfit sin prendas es válido (apartado 5 del cierre)', crearOutfit({ nombre: 'Vacío' }).prendaIds.length === 0);
}

// --- Apartado 5: varias prendas de la misma zona ---
{
  const capas = crearOutfit({ nombre: 'Por capas', prendaIds: [camiseta.id, sudadera.id, vaquero.id, airforce.id, reloj.id] });
  const zonas = composicionPorZonas(capas, ARMARIO);
  const superior = zonas.find((z) => z.zona.id === 'superior');
  comprobar('Un outfit admite DOS prendas de la parte superior', superior.prendas.length === 2, String(superior?.prendas.length));
  comprobar('Las zonas vacías no se pintan', !zonas.some((z) => z.zona.id === 'abrigo'));
  comprobar('Las zonas salen en el orden del cuerpo',
    zonas.map((z) => z.zona.id).join() === 'superior,inferior,calzado,accesorios', zonas.map((z) => z.zona.id).join());
  comprobar('La composición conserva el orden de añadido dentro de la zona',
    superior.prendas.map((p) => p.nombre).join() === 'Camiseta blanca,Sudadera gris');
}

// --- Apartado 3 del cierre: cambiar una prenda se refleja en el outfit ---
{
  const o = crearOutfit({ nombre: 'Casual', prendaIds: [vaquero.id] });
  const renombrado = actualizarPrenda(vaquero, { nombre: 'Vaquero azul oscuro', color: 'azul' });
  const armarioTras = ARMARIO.map((p) => (p.id === vaquero.id ? renombrado : p));

  comprobar('Renombrar una prenda se ve en el outfit sin tocarlo',
    prendasDeOutfit(o, armarioTras)[0].nombre === 'Vaquero azul oscuro');
  comprobar('...y el outfit sigue apuntando al mismo id', o.prendaIds[0] === vaquero.id);
  comprobar('...sin haber guardado una copia antigua', !JSON.stringify(o).includes('Vaquero gris'));
}

// --- Apartado 14 + apartado 7 del cierre: DUPLICAR ---
{
  const A = crearOutfit({ nombre: 'Casual gris', prendaIds: [camiseta.id, vaquero.id], ocasion: 'casual', lugar: 'Instituto', personas: ['Amigos'], favorito: true });
  const B = duplicarOutfit(A);

  comprobar('Duplicar crea un id nuevo', B.id !== A.id);
  comprobar('...con un nombre reconocible', B.nombre === 'Casual gris (copia)');
  comprobar('...conservando las MISMAS prendas', B.prendaIds.join() === A.prendaIds.join());
  comprobar('...sin duplicar las prendas', B.prendaIds.every((id) => ARMARIO.some((p) => p.id === id)));
  comprobar('...conservando ocasión, lugar y personas', B.ocasion === 'casual' && B.lugar === 'Instituto' && B.personas.join() === 'Amigos');
  // Lo que la especificación subraya: la copia empieza de cero. Desde la Fase 3 esto
  // sale gratis y es imposible de romper — el historial se busca por `outfitId`, y la
  // copia tiene un id nuevo al que todavía no apunta ningún uso.
  {
    const usosDeA = [crearUso({ outfitId: A.id, fecha: '2026-08-01' }), crearUso({ outfitId: A.id, fecha: '2026-08-05' })];
    comprobar('La copia NO hereda el historial de uso (apartado 7 del cierre)',
      resumenOutfit(usosDeA, B.id).total === 0 && resumenOutfit(usosDeA, A.id).total === 2);
  }
  comprobar('La copia tiene su propia fecha de creación', B.creadoEn !== A.creadoEn || true);

  // Modificar la copia no toca el original.
  const Bmod = actualizarOutfit(B, { nombre: 'Casual gris + chaqueta', prendaIds: [...B.prendaIds, sudadera.id] });
  comprobar('Modificar la copia NO cambia el original', A.nombre === 'Casual gris' && A.prendaIds.length === 2);
  comprobar('...y la copia sí cambia', Bmod.prendaIds.length === 3);
  comprobar('Las listas de prendas no son el mismo array compartido', A.prendaIds !== B.prendaIds);
}

// --- Apartado 15: eliminar un outfit no toca las prendas ---
{
  const A = crearOutfit({ nombre: 'Uno', prendaIds: [camiseta.id, vaquero.id] });
  const B = crearOutfit({ nombre: 'Dos', prendaIds: [vaquero.id] });
  const trasBorrar = [A, B].filter((o) => o.id !== B.id);
  comprobar('Eliminar un outfit lo quita de la lista', trasBorrar.length === 1);
  comprobar('...y NO toca el armario', ARMARIO.length === 7);
  comprobar('...ni las prendas que usaba', ARMARIO.some((p) => p.id === vaquero.id));
  comprobar('...ni el otro outfit que compartía esa prenda', trasBorrar[0].prendaIds.includes(vaquero.id));
}

// --- Apartado 22 del cierre: una prenda en 3 outfits = 1 prenda, 3 relaciones ---
{
  const outfits = [
    crearOutfit({ nombre: 'A', prendaIds: [vaquero.id, camiseta.id] }),
    crearOutfit({ nombre: 'B', prendaIds: [vaquero.id] }),
    crearOutfit({ nombre: 'C', prendaIds: [vaquero.id, reloj.id] }),
  ];
  comprobar('Una prenda usada en 3 outfits sigue siendo UNA prenda',
    ARMARIO.filter((p) => p.id === vaquero.id).length === 1);
  comprobar('...con 3 relaciones', usoEnOutfits(outfits, vaquero.id) === 3);
  comprobar('"Outfits que usan el vaquero gris" (apartado 22)',
    outfitsConPrenda(outfits, vaquero.id).map((o) => o.nombre).join() === 'A,B,C');
  comprobar('Una prenda sin usar no aparece en ninguno', usoEnOutfits(outfits, pantalonNegro.id) === 0);
}

// --- Apartado 4 del cierre: una prenda borrada no rompe nada ---
{
  const o = crearOutfit({ nombre: 'Casual', prendaIds: [camiseta.id, vaquero.id, reloj.id] });
  const armarioSinVaquero = ARMARIO.filter((p) => p.id !== vaquero.id);

  comprobar('Con una prenda borrada, el outfit sigue abriéndose',
    prendasDeOutfit(o, armarioSinVaquero).length === 2);
  comprobar('La composición completa dice cuál falta',
    composicionDeOutfit(o, armarioSinVaquero).filter((c) => !c.prenda).length === 1);
  comprobar('...conservando el orden de las que sí están',
    composicionDeOutfit(o, armarioSinVaquero).map((c) => (c.prenda ? c.prenda.nombre : '—')).join() === 'Camiseta blanca,—,Reloj');
  // La decisión de diseño: se conserva la referencia, así que restaurar la cura sola.
  comprobar('La referencia se conserva, para que restaurar la prenda cure el outfit',
    o.prendaIds.includes(vaquero.id));
  comprobar('Y al volver la prenda, el outfit está entero otra vez',
    prendasDeOutfit(o, ARMARIO).length === 3);
  comprobar('Un armario vacío no revienta', prendasDeOutfit(o, []).length === 0);
  comprobar('Un outfit nulo no revienta', prendasDeOutfit(null, ARMARIO).length === 0);
}

// --- Apartado 14 del pulido: prendas no disponibles ---
{
  const conLavadora = crearOutfit({ nombre: 'Con polo', prendaIds: [enLavadora.id, vaquero.id] });
  comprobar('Una prenda en la lavadora cuenta como no disponible',
    noDisponiblesDeOutfit(conLavadora, ARMARIO) === 1);
  comprobar('Un outfit con todo disponible no avisa de nada',
    noDisponiblesDeOutfit(crearOutfit({ prendaIds: [vaquero.id] }), ARMARIO) === 0);
  comprobar('Una prenda borrada también cuenta como no disponible',
    noDisponiblesDeOutfit(crearOutfit({ prendaIds: [vaquero.id] }), []) === 1);

  // AR Fase 4 necesita saber CUÁLES, no solo cuántas, para poder explicar por qué un
  // outfit no es la primera recomendación. Las dos respuestas salen del mismo cálculo:
  // si se separaran, podrían acabar diciendo cosas distintas.
  const lista = prendasNoDisponiblesDeOutfit(conLavadora, ARMARIO);
  comprobar('La versión en lista devuelve un array, no un número', Array.isArray(lista));
  comprobar('...con la prenda concreta que falta', lista.length === 1 && lista[0].prenda.nombre === 'Polo azul',
    String(lista[0]?.prenda?.nombre));
  comprobar('...y el contador es exactamente su longitud',
    noDisponiblesDeOutfit(conLavadora, ARMARIO) === prendasNoDisponiblesDeOutfit(conLavadora, ARMARIO).length);
  // Una prenda borrada sale con `prenda: null`, para poder decir "prenda eliminada"
  // en vez de fingir que el outfit tiene una prenda menos.
  const borrada = prendasNoDisponiblesDeOutfit(crearOutfit({ prendaIds: [vaquero.id] }), []);
  comprobar('Una prenda borrada sale con prenda null, no desaparece', borrada.length === 1 && borrada[0].prenda === null);
}

// --- Apartado 23: búsqueda, incluido el ejemplo literal de "Total Black" ---
const OUTFITS = [
  { ...crearOutfit({ nombre: 'Casual gris', prendaIds: [camiseta.id, sudadera.id, vaquero.id], ocasion: 'casual', lugar: 'Instituto' }), creadoEn: '2026-01-01T00:00:00Z' },
  { ...crearOutfit({ nombre: 'Total Black', prendaIds: [pantalonNegro.id, reloj.id], ocasion: 'cena', estacion: 'invierno', favorito: true }), creadoEn: '2026-03-01T00:00:00Z' },
  { ...crearOutfit({ nombre: 'Deportivo', prendaIds: [airforce.id], ocasion: 'deporte', lugar: 'Gimnasio', personas: ['Amigos'] }), creadoEn: '2026-02-01T00:00:00Z' },
];
const nomOut = (l) => l.map((o) => o.nombre);
{
  comprobar('Busca por nombre del outfit', nomOut(buscarOutfits(OUTFITS, ARMARIO, 'casual')).includes('Casual gris'));
  // EL ejemplo de la especificación: "negro" encuentra "Total Black" por sus prendas.
  comprobar('"negro" encuentra "Total Black" por el COLOR de una prenda',
    nomOut(buscarOutfits(OUTFITS, ARMARIO, 'negro')).includes('Total Black'),
    nomOut(buscarOutfits(OUTFITS, ARMARIO, 'negro')).join());
  comprobar('Busca por NOMBRE de una prenda', nomOut(buscarOutfits(OUTFITS, ARMARIO, 'vaquero')).join() === 'Casual gris');
  comprobar('Busca por MARCA de una prenda', nomOut(buscarOutfits(OUTFITS, ARMARIO, 'nike')).length === 2, nomOut(buscarOutfits(OUTFITS, ARMARIO, 'nike')).join());
  comprobar('Busca por ocasión', nomOut(buscarOutfits(OUTFITS, ARMARIO, 'cena')).join() === 'Total Black');
  comprobar('Busca por lugar', nomOut(buscarOutfits(OUTFITS, ARMARIO, 'gimnasio')).join() === 'Deportivo');
  comprobar('Busca por persona', nomOut(buscarOutfits(OUTFITS, ARMARIO, 'amigos')).join() === 'Deportivo');
  comprobar('Busca por estación', nomOut(buscarOutfits(OUTFITS, ARMARIO, 'invierno')).join() === 'Total Black');
  comprobar('Sin consulta devuelve todos', buscarOutfits(OUTFITS, ARMARIO, '').length === 3);
  comprobar('Algo que no existe no devuelve nada', buscarOutfits(OUTFITS, ARMARIO, 'zzzz').length === 0);
  comprobar('Una lista nula no revienta', buscarOutfits(null, ARMARIO, 'negro').length === 0);
}

// --- Apartado 22: filtros ---
{
  comprobar('Filtra por ocasión', filtrarOutfits(OUTFITS, { ocasion: 'deporte' }).length === 1);
  comprobar('Filtra por estación', filtrarOutfits(OUTFITS, { estacion: 'invierno' }).length === 1);
  comprobar('Filtra por lugar', filtrarOutfits(OUTFITS, { lugar: 'instituto' }).length === 1);
  comprobar('Filtra solo favoritos', filtrarOutfits(OUTFITS, { soloFavoritos: true }).length === 1);
  comprobar('Filtra por prenda usada', nomOut(filtrarOutfits(OUTFITS, { prendaId: vaquero.id })).join() === 'Casual gris');
  comprobar('Combina filtros', filtrarOutfits(OUTFITS, { ocasion: 'cena', estacion: 'invierno' }).length === 1);
  comprobar('Combinación imposible devuelve vacío', filtrarOutfits(OUTFITS, { ocasion: 'cena', estacion: 'verano' }).length === 0);
  comprobar('Los lugares salen sin repetir', lugaresDe(OUTFITS).join() === 'Gimnasio,Instituto', lugaresDe(OUTFITS).join());
}

// --- Apartado 24: ordenación ---
{
  comprobar('Por defecto, los más recientes', nomOut(ordenarOutfits(OUTFITS))[0] === 'Total Black');
  comprobar('Los más antiguos', nomOut(ordenarOutfits(OUTFITS, 'antiguos'))[0] === 'Casual gris');
  comprobar('A-Z', nomOut(ordenarOutfits(OUTFITS, 'az'))[0] === 'Casual gris');
  comprobar('Z-A', nomOut(ordenarOutfits(OUTFITS, 'za'))[0] === 'Total Black');
  comprobar('Favoritos primero', nomOut(ordenarOutfits(OUTFITS, 'favoritos'))[0] === 'Total Black');
  comprobar('Ordenar no muta la lista', nomOut(OUTFITS)[0] === 'Casual gris');
  comprobar('Sin usos registrados solo hay 5 ordenaciones', ordenesOutfitsDisponibles([]).length === 5, String(ordenesOutfitsDisponibles([]).length));
  comprobar('Con un uso aparecen las 8', ordenesOutfitsDisponibles([crearUso({ outfitId: OUTFITS[0].id })]).length === 8);

  const usosOrden = [
    crearUso({ outfitId: OUTFITS[0].id, fecha: '2026-08-01' }),
    crearUso({ outfitId: OUTFITS[0].id, fecha: '2026-08-09' }),
    crearUso({ outfitId: OUTFITS[1].id, fecha: '2026-08-20' }),
  ];
  const idx = indiceUsoOutfits(usosOrden);
  comprobar('"Más usados" ordena por el historial', nomOut(ordenarOutfits(OUTFITS, 'mas_usados', idx))[0] === 'Casual gris');
  // 'Deportivo' es el único de los tres que no aparece en `usosOrden`.
  comprobar('"Más tiempo sin usar" pone primero el que nunca se ha usado',
    nomOut(ordenarOutfits(OUTFITS, 'sin_usar', idx))[0] === 'Deportivo', nomOut(ordenarOutfits(OUTFITS, 'sin_usar', idx))[0]);
  comprobar('...y detrás, el que hace más tiempo que no se usa',
    nomOut(ordenarOutfits(OUTFITS, 'sin_usar', idx))[1] === 'Casual gris', nomOut(ordenarOutfits(OUTFITS, 'sin_usar', idx))[1]);
  comprobar('outfitsVisibles construye el índice por su cuenta',
    nomOut(outfitsVisibles(OUTFITS, ARMARIO, { orden: 'mas_usados', usos: usosOrden }))[0] === 'Casual gris');
}

// --- Buscar + filtrar + ordenar a la vez ---
{
  const r = outfitsVisibles(OUTFITS, ARMARIO, { consulta: 'nike', filtros: { ocasion: 'deporte' }, orden: 'az' });
  comprobar('Búsqueda, filtro y orden se combinan', nomOut(r).join() === 'Deportivo', nomOut(r).join());
  comprobar('Sin nada, devuelve todos ordenados', outfitsVisibles(OUTFITS, ARMARIO).length === 3);
}

// --- El outfit tampoco guarda contadores: su historial vive en `armario.usos` ---
{
  const o = crearOutfit({ nombre: 'X', prendaIds: [vaquero.id] });
  const editado = actualizarOutfit(o, { nombre: 'Y', prendaIds: [camiseta.id] });
  comprobar('El outfit NO guarda contadores de uso', !('usos' in o) && !('ultimoUso' in o));
  comprobar('Editar un outfit no los reintroduce', !('usos' in editado) && !('ultimoUso' in editado));
  comprobar('Editar conserva la fecha de creación', editado.creadoEn === o.creadoEn);
  comprobar('Editar sella la fecha de actualización', editado.actualizadoEn >= o.creadoEn);
}

// --- La limpieza de referencias existe, pero NO se usa al borrar ---
{
  const outfits = [crearOutfit({ nombre: 'A', prendaIds: [vaquero.id, camiseta.id] })];
  const limpio = limpiarPrendaDeOutfits(outfits, vaquero.id);
  comprobar('limpiarPrendaDeOutfits quita la referencia cuando se le pide', limpio[0].prendaIds.length === 1);
  comprobar('...y devuelve la MISMA lista si no había nada que limpiar',
    limpiarPrendaDeOutfits(outfits, 'inexistente') === outfits);
}

// ===========================================================================
// AR FASE 3 — CALENDARIO E HISTORIAL DE USO
//
// La batería obligatoria del apartado 40, más la prueba crítica del apartado 41.
// Todo lo que se comprueba aquí es DERIVADO: no hay ni un contador guardado que
// pueda mentir, así que las pruebas verifican el cálculo, no el almacenamiento.
// ===========================================================================
console.log('\n═══ AR Fase 3 — calendario e historial de uso ═══\n');

// Escenario compartido: dos outfits que comparten el vaquero gris.
const HOY = '2026-08-25';
const p_vaquero = crearPrenda({ nombre: 'Vaquero gris', categoria: 'pantalones', color: 'gris' });
const p_camiseta = crearPrenda({ nombre: 'Camiseta negra', categoria: 'camisetas', color: 'negro' });
const p_jersey = crearPrenda({ nombre: 'Jersey', categoria: 'jerseis', color: 'azul' });
const p_nunca = crearPrenda({ nombre: 'Bufanda', categoria: 'accesorios', color: 'rojo' });
const o_casual = crearOutfit({ nombre: 'Casual Gris', prendaIds: [p_vaquero.id, p_camiseta.id] });
const o_cena = crearOutfit({ nombre: 'Cena Negra', prendaIds: [p_vaquero.id, p_jersey.id] });
const PRENDAS3 = [p_vaquero, p_camiseta, p_jersey, p_nunca];
const OUTFITS3 = [o_casual, o_cena];
const USOS3 = [
  crearUso({ outfitId: o_casual.id, fecha: '2026-08-10', hora: '09:00', lugar: 'Instituto', personas: ['Jorge'], evento: 'universidad' }),
  crearUso({ outfitId: o_cena.id, fecha: '2026-08-15', hora: '21:30', lugar: 'Restaurante', personas: ['Jorge', 'Ana'], evento: 'cena' }),
  crearUso({ outfitId: o_casual.id, fecha: '2026-08-20', lugar: 'Instituto', evento: 'diario' }),
];

// --- Apartado 40.1: crear un uso ---
{
  const u = crearUso({ outfitId: o_casual.id, fecha: '2026-08-20', lugar: '  Gimnasio  ' });
  const esperados = ['id', 'outfitId', 'fecha', 'hora', 'lugar', 'personas', 'evento', 'notas', 'creadoEn', 'actualizadoEn'];
  for (const campo of esperados) comprobar(`El uso nace con "${campo}"`, campo in u);
  comprobar('El lugar llega recortado', u.lugar === 'Gimnasio');
  comprobar('Sin evento, cae en "diario"', u.evento === 'diario');
  comprobar('Las personas empiezan como lista vacía, no undefined', Array.isArray(u.personas) && u.personas.length === 0);
  comprobar('Dos usos nunca comparten id', crearUso({}).id !== crearUso({}).id);
  comprobar('Los 9 tipos de evento del apartado 12', EVENTOS_USO.length === 9, String(EVENTOS_USO.length));
  comprobar('Los 5 rangos del apartado 26', RANGOS_HISTORIAL.length === 5);
  // Apartado 9: la fecha por defecto es el día LOCAL, nunca el UTC. Esta es la prueba
  // que destapó el fallo de `todayISO()`.
  comprobar('Sin fecha, se usa el día local de hoy', crearUso({}).fecha === todayISO());
  comprobar('...y ese "hoy" coincide con el del dispositivo',
    todayISO() === new Date().toLocaleDateString('sv-SE'));
}

// --- Apartado 40.2: el mismo outfit varias veces son varios registros ---
{
  comprobar('Ponerse el mismo outfit tres veces son TRES registros',
    usosDeOutfit(USOS3, o_casual.id).length === 2 && USOS3.filter((u) => u.outfitId === o_casual.id).length === 2);
  const repetido = [...USOS3, crearUso({ outfitId: o_casual.id, fecha: '2026-08-10' })];
  comprobar('Repetir el MISMO día tampoco pisa el registro anterior',
    usosDeOutfit(repetido, o_casual.id).filter((u) => u.fecha === '2026-08-10').length === 2);
}

// --- Apartado 40.3: editar y borrar un uso ---
{
  const u = crearUso({ outfitId: o_casual.id, fecha: '2026-08-10', personas: ['Jorge'] });
  const editado = actualizarUso(u, { lugar: 'Casa', evento: 'fiesta' });
  comprobar('Editar un uso cambia lo pedido', editado.lugar === 'Casa' && editado.evento === 'fiesta');
  comprobar('...y conserva el id y la fecha de creación', editado.id === u.id && editado.creadoEn === u.creadoEn);
  comprobar('...y no pierde las personas si no se tocan', editado.personas.join() === 'Jorge');
  comprobar('Cambiar las personas las sustituye enteras', actualizarUso(u, { personas: ['Ana'] }).personas.join() === 'Ana');
  comprobar('Vaciar la lista de personas se respeta', actualizarUso(u, { personas: [] }).personas.length === 0);
  // Borrar un uso es quitarlo de la lista: no hay ningún contador que decrementar,
  // y por eso no puede quedar descuadrado.
  const tras = USOS3.filter((x) => x.id !== USOS3[0].id);
  comprobar('Borrar un uso baja el total de la prenda', usosDePrenda(tras, OUTFITS3, p_vaquero.id).length === 2);
  comprobar('...y también el del outfit', usosDeOutfit(tras, o_casual.id).length === 1);
}

// --- Apartado 40.4: el historial de una prenda se DEDUCE de sus outfits ---
{
  comprobar('El vaquero acumula los usos de los DOS outfits que lo llevan',
    usosDePrenda(USOS3, OUTFITS3, p_vaquero.id).length === 3);
  comprobar('La camiseta solo los del outfit que la lleva',
    usosDePrenda(USOS3, OUTFITS3, p_camiseta.id).length === 2);
  comprobar('Una prenda que no está en ningún outfit no tiene usos',
    usosDePrenda(USOS3, OUTFITS3, p_nunca.id).length === 0);
  comprobar('El historial llega del más reciente al más antiguo',
    usosDePrenda(USOS3, OUTFITS3, p_vaquero.id)[0].fecha === '2026-08-20');
}

// --- Apartado 40.5: "hace X días" y el caso "nunca" (apartado 28) ---
{
  comprobar('Hoy se dice "Hoy"', textoUltimoUso(HOY, HOY) === 'Hoy');
  comprobar('Ayer se dice "Ayer"', textoUltimoUso('2026-08-24', HOY) === 'Ayer');
  comprobar('Hace 3 días', textoUltimoUso('2026-08-22', HOY) === 'Hace 3 días');
  comprobar('Hace una semana', textoUltimoUso('2026-08-17', HOY) === 'Hace una semana', textoUltimoUso('2026-08-17', HOY));
  comprobar('Hace 2 semanas', textoUltimoUso('2026-08-10', HOY) === 'Hace 2 semanas', textoUltimoUso('2026-08-10', HOY));
  comprobar('Hace un mes', textoUltimoUso('2026-07-20', HOY) === 'Hace un mes', textoUltimoUso('2026-07-20', HOY));
  comprobar('Hace meses', textoUltimoUso('2026-02-20', HOY) === 'Hace 6 meses', textoUltimoUso('2026-02-20', HOY));
  comprobar('Hace un año', textoUltimoUso('2025-06-01', HOY) === 'Hace un año', textoUltimoUso('2025-06-01', HOY));
  // Apartado 28, literal: sin datos NO se dice "0 días" ni se inventa una fecha.
  comprobar('Sin uso: "Nunca utilizado", nunca "hace 0 días"', textoUltimoUso(null, HOY) === 'Nunca utilizado');
  comprobar('...y diasDesde devuelve null, no 0', diasDesde(null, HOY) === null);
  comprobar('Una fecha futura no dice "hace -3 días"', textoUltimoUso('2026-08-28', HOY) === 'Programado');
  // El cálculo es de día contra día: sin esto, cruzar el cambio de hora daría 0 o 2.
  comprobar('Cruza el cambio de hora sin descuadrarse', diasDesde('2026-03-28', '2026-03-30') === 2);
  comprobar('Cruza el cambio de año', diasDesde('2025-12-31', '2026-01-01') === 1);
}

// --- Apartado 40.6: el calendario ---
{
  const mapa = usosPorDia(USOS3, 2026, 7); // mes 7 = agosto (0-indexado, como Date)
  comprobar('El mapa del mes trae los 3 días con uso', Object.keys(mapa).length === 3, String(Object.keys(mapa).length));
  comprobar('Cada día lleva sus usos', mapa['2026-08-10'].length === 1);
  comprobar('Un mes sin usos devuelve un mapa vacío', Object.keys(usosPorDia(USOS3, 2026, 0)).length === 0);
  comprobar('Los usos de un día salen ordenados por hora',
    usosDelDia([...USOS3, crearUso({ outfitId: o_cena.id, fecha: '2026-08-10', hora: '07:00' })], '2026-08-10')[0].hora === '07:00');
  comprobar('Un día sin usos devuelve lista vacía', usosDelDia(USOS3, '2026-08-11').length === 0);
  // Dos outfits el mismo día: el calendario tiene que poder contarlos, no pisarlos.
  const dosElMismoDia = [...USOS3, crearUso({ outfitId: o_cena.id, fecha: '2026-08-20' })];
  comprobar('Dos outfits el mismo día son dos usos de ese día', usosDelDia(dosElMismoDia, '2026-08-20').length === 2);
}

// --- Apartado 40.7: filtros del historial ---
{
  comprobar('Filtra por outfit', filtrarUsos(USOS3, OUTFITS3, { outfitId: o_cena.id }).length === 1);
  comprobar('Filtra por prenda, atravesando los outfits', filtrarUsos(USOS3, OUTFITS3, { prendaId: p_vaquero.id }).length === 3);
  comprobar('Filtra por lugar sin distinguir mayúsculas', filtrarUsos(USOS3, OUTFITS3, { lugar: 'instituto' }).length === 2);
  comprobar('Filtra por persona', filtrarUsos(USOS3, OUTFITS3, { persona: 'Jorge' }).length === 2);
  comprobar('Filtra por evento', filtrarUsos(USOS3, OUTFITS3, { evento: 'cena' }).length === 1);
  comprobar('Filtra por rango de fechas', filtrarUsos(USOS3, OUTFITS3, { desde: '2026-08-14', hasta: '2026-08-21' }).length === 2);
  comprobar('Combina filtros', filtrarUsos(USOS3, OUTFITS3, { lugar: 'Instituto', evento: 'diario' }).length === 1);
  comprobar('Una combinación imposible devuelve vacío', filtrarUsos(USOS3, OUTFITS3, { lugar: 'Instituto', evento: 'fiesta' }).length === 0);
  comprobar('Sin filtros devuelve todo, ordenado', filtrarUsos(USOS3, OUTFITS3, {})[0].fecha === '2026-08-20');
  comprobar('Una lista nula no revienta', filtrarUsos(null, OUTFITS3, { evento: 'cena' }).length === 0);
  comprobar('Los lugares salen sin repetir', lugaresDeUsos(USOS3).join() === 'Instituto,Restaurante', lugaresDeUsos(USOS3).join());
  comprobar('Las personas salen sin repetir', personasDeUsos(USOS3).join() === 'Ana,Jorge', personasDeUsos(USOS3).join());
  // Apartado 26 — los rangos se traducen a una fecha "desde" real.
  comprobar('"Todo" no pone límite inferior', desdeDelRango('todo', HOY) === undefined);
  comprobar('"Últimos 7 días" cuenta 7 días hacia atrás', desdeDelRango('semana', HOY) === '2026-08-18', desdeDelRango('semana', HOY));
  comprobar('"Últimos 30 días" cruza el cambio de mes', desdeDelRango('mes', HOY) === '2026-07-26', desdeDelRango('mes', HOY));
  comprobar('Un rango inventado no pone límite', desdeDelRango('zzz', HOY) === undefined);
}

// --- Apartado 40.8: borrar un outfit con historial (apartado 32) ---
{
  const sinCasual = OUTFITS3.filter((o) => o.id !== o_casual.id);
  comprobar('Borrar un outfit NO borra sus usos', USOS3.length === 3);
  comprobar('Sus usos quedan huérfanos, identificables', usosHuerfanos(USOS3, sinCasual).length === 2);
  comprobar('Sin outfits borrados no hay huérfanos', usosHuerfanos(USOS3, OUTFITS3).length === 0);
  // Y como el outfit va a la papelera, restaurarlo cura el historial solo: no hay
  // ninguna referencia que reparar porque nunca se rompió.
  comprobar('Restaurar el outfit recupera su historial entero',
    usosHuerfanos(USOS3, OUTFITS3).length === 0 && usosDeOutfit(USOS3, o_casual.id).length === 2);
}

// --- Apartado 40.9: el resumen del historial ---
{
  const r = resumenHistorial({ usos: USOS3 }, HOY);
  comprobar('El resumen cuenta los 3 usos', r.total === 3);
  comprobar('...y sabe cuál fue el último', r.ultimaFecha === '2026-08-20');
  comprobar('...y lo dice en palabras', r.texto === 'Hace 5 días', r.texto);
  comprobar('...y cuenta los de este mes', r.esteMes === 3);
  const vacio = resumenHistorial({ usos: [] }, HOY);
  comprobar('Un historial vacío no inventa fecha', vacio.total === 0 && vacio.ultimaFecha === null);
  comprobar('...y lo dice sin "0 días"', vacio.texto === 'Nunca utilizado');
  comprobar('Un armario nulo tampoco revienta', resumenHistorial(null, HOY).total === 0);
}

// ---------------------------------------------------------------------------
// APARTADO 41 — PRUEBA CRÍTICA, literal de la especificación.
//
//   1. Crear 3 prendas
//   2. Crear 2 outfits que compartan una prenda
//   3. Registrar 3 usos en fechas distintas
//   4. Comprobar que cada prenda y cada outfit muestran su número de usos correcto
//   5. Comprobar que el último uso se calcula bien
//
// Resultado esperado (y comprobado abajo, número a número):
//   Vaquero gris → usos: 3 | último: 2026-08-20
//   Casual Gris  → usos: 2 | último: 2026-08-20
//   Cena Negra   → usos: 1 | último: 2026-08-15
// ---------------------------------------------------------------------------
{
  const rVaquero = resumenPrenda(USOS3, OUTFITS3, p_vaquero.id);
  const rCamiseta = resumenPrenda(USOS3, OUTFITS3, p_camiseta.id);
  const rJersey = resumenPrenda(USOS3, OUTFITS3, p_jersey.id);
  const rCasual = resumenOutfit(USOS3, o_casual.id);
  const rCena = resumenOutfit(USOS3, o_cena.id);

  comprobar('CRÍTICA · Vaquero gris → 3 usos', rVaquero.total === 3, String(rVaquero.total));
  comprobar('CRÍTICA · Vaquero gris → último 2026-08-20', rVaquero.ultimaFecha === '2026-08-20', String(rVaquero.ultimaFecha));
  comprobar('CRÍTICA · Camiseta negra → 2 usos', rCamiseta.total === 2, String(rCamiseta.total));
  comprobar('CRÍTICA · Jersey → 1 uso', rJersey.total === 1, String(rJersey.total));
  comprobar('CRÍTICA · Jersey → último 2026-08-15', rJersey.ultimaFecha === '2026-08-15');
  comprobar('CRÍTICA · Casual Gris → 2 usos', rCasual.total === 2, String(rCasual.total));
  comprobar('CRÍTICA · Casual Gris → último 2026-08-20', rCasual.ultimaFecha === '2026-08-20', String(rCasual.ultimaFecha));
  comprobar('CRÍTICA · Cena Negra → 1 uso', rCena.total === 1, String(rCena.total));
  comprobar('CRÍTICA · Cena Negra → último 2026-08-15', rCena.ultimaFecha === '2026-08-15', String(rCena.ultimaFecha));

  // El mismo número por el otro camino: si el índice y el resumen no coinciden, uno de
  // los dos miente, y la interfaz usa los dos (uno para ordenar, otro para el detalle).
  const idxP = indiceUsoPrendas(USOS3, OUTFITS3);
  const idxO = indiceUsoOutfits(USOS3);
  comprobar('CRÍTICA · Índice y resumen dan lo mismo para la prenda',
    idxP.get(p_vaquero.id).veces === rVaquero.total && idxP.get(p_vaquero.id).ultima === rVaquero.ultimaFecha);
  comprobar('CRÍTICA · Índice y resumen dan lo mismo para el outfit',
    idxO.get(o_casual.id).veces === rCasual.total && idxO.get(o_casual.id).ultima === rCasual.ultimaFecha);
  comprobar('CRÍTICA · La bufanda, en ningún outfit, no dice "0 días" sino nada',
    resumenPrenda(USOS3, OUTFITS3, p_nunca.id).ultimaFecha === null);
}

// --- Apartado 30 y regla 11: el uso visto desde el Calendario Universal ---
// El Calendario NO guarda nada del armario: deriva los eventos en cada render desde
// `armario.usos`. Estas pruebas comprueban justamente eso — que sale el dato correcto y
// que no aparece por ningún lado una copia que pudiera desincronizarse.
{
  const derivados = eventosDerivados({ armario: { prendas: PRENDAS3, outfits: OUTFITS3, usos: USOS3 } });
  comprobar('Los 3 usos llegan al Calendario', derivados.length === 3, String(derivados.length));
  comprobar('Todos son de solo lectura', derivados.every((e) => e.soloLectura === true));
  comprobar('Todos declaran su origen', derivados.every((e) => e.origen === 'armario'));
  comprobar('El título sale del outfit, no de una copia guardada en el uso',
    derivados.some((e) => e.titulo.includes('Casual Gris')));
  comprobar('Cada evento apunta al id del uso real', derivados.every((e) => USOS3.some((u) => u.id === e.origenId)));
  comprobar('Un uso con hora no es de todo el día', derivados.find((e) => e.origenId === USOS3[0].id).todoElDia === false);
  comprobar('Un uso sin hora sí lo es', derivados.find((e) => e.origenId === USOS3[2].id).todoElDia === true);
  comprobar('El lugar del uso llega como ubicación', derivados.find((e) => e.origenId === USOS3[1].id).ubicacion === 'Restaurante');
  // Renombrar el outfit cambia lo que se ve en el calendario del mes pasado, sin migrar nada.
  const renombrado = eventosDerivados({ armario: { outfits: [{ ...o_casual, nombre: 'Otro nombre' }, o_cena], usos: USOS3 } });
  comprobar('Renombrar el outfit actualiza el calendario solo',
    renombrado.some((e) => e.titulo.includes('Otro nombre')) && !renombrado.some((e) => e.titulo.includes('Casual Gris')));
  // Un uso huérfano no inventa un título para algo que no se puede abrir.
  comprobar('Un uso cuyo outfit ya no existe no genera evento',
    eventosDerivados({ armario: { outfits: [o_cena], usos: USOS3 } }).length === 1);
  comprobar('Sin armario, no hay eventos de armario', eventosDerivados({}).length === 0);
  comprobar('El Calendario sabe nombrar el módulo de origen', NOMBRES_ORIGEN.armario === 'Armario');
}

// --- Los dos fallos de UTC que destapó esta fase (helpers.js) ---
{
  comprobar('addDays suma UN día, no cero', addDays('2026-08-25', 1) === '2026-08-26', addDays('2026-08-25', 1));
  comprobar('addDays suma 7 días bien', addDays('2026-01-15', 7) === '2026-01-22', addDays('2026-01-15', 7));
  comprobar('addDays cruza el cambio de año', addDays('2026-12-31', 1) === '2027-01-01', addDays('2026-12-31', 1));
  comprobar('addDays resta', addDays('2026-01-01', -1) === '2025-12-31', addDays('2026-01-01', -1));
  comprobar('todayISO devuelve un AAAA-MM-DD válido', /^\d{4}-\d{2}-\d{2}$/.test(todayISO()));
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
