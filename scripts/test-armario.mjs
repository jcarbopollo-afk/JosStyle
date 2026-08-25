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
  lugaresDe, composicionPorZonas, composicionDeOutfit, noDisponiblesDeOutfit,
  usoEnOutfits, limpiarPrendaDeOutfits,
} from '../src/lib/armario.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ AR Fases 1 y 2 — armario y outfits ═══\n');

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
    'lugar', 'personas', 'favorito', 'usos', 'ultimoUso', 'creadoEn', 'actualizadoEn',
  ];
  for (const campo of esperados) comprobar(`El outfit nace con "${campo}"`, campo in o);

  // ESTA es la regla que más repite la especificación.
  comprobar('El outfit guarda IDS, no copias de las prendas',
    o.prendaIds.every((x) => typeof x === 'string'));
  comprobar('...y no guarda ningún objeto de prenda dentro',
    !JSON.stringify(o).includes('"categoria"'));
  comprobar('El nombre llega recortado', o.nombre === 'Casual gris');
  comprobar('Los campos de uso empiezan a cero (apartado 18)', o.usos === 0 && o.ultimoUso === null);
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
  // Un outfit con historial: la copia NO debe heredarlo.
  const Ausado = { ...A, usos: 12, ultimoUso: '2026-08-01' };
  const B = duplicarOutfit(Ausado);

  comprobar('Duplicar crea un id nuevo', B.id !== A.id);
  comprobar('...con un nombre reconocible', B.nombre === 'Casual gris (copia)');
  comprobar('...conservando las MISMAS prendas', B.prendaIds.join() === A.prendaIds.join());
  comprobar('...sin duplicar las prendas', B.prendaIds.every((id) => ARMARIO.some((p) => p.id === id)));
  comprobar('...conservando ocasión, lugar y personas', B.ocasion === 'casual' && B.lugar === 'Instituto' && B.personas.join() === 'Amigos');
  // Lo que la especificación subraya: la copia empieza de cero.
  comprobar('La copia NO hereda el historial de uso (apartado 7 del cierre)', B.usos === 0 && B.ultimoUso === null);
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
  // Las de uso son de la Fase 3: hoy no se ofrecen.
  comprobar('Sin usos registrados solo hay 5 ordenaciones', ordenesOutfitsDisponibles(OUTFITS).length === 5, String(ordenesOutfitsDisponibles(OUTFITS).length));
  comprobar('Con un uso aparecen las 8', ordenesOutfitsDisponibles([...OUTFITS, { ...crearOutfit({}), usos: 2 }]).length === 8);
}

// --- Buscar + filtrar + ordenar a la vez ---
{
  const r = outfitsVisibles(OUTFITS, ARMARIO, { consulta: 'nike', filtros: { ocasion: 'deporte' }, orden: 'az' });
  comprobar('Búsqueda, filtro y orden se combinan', nomOut(r).join() === 'Deportivo', nomOut(r).join());
  comprobar('Sin nada, devuelve todos ordenados', outfitsVisibles(OUTFITS, ARMARIO).length === 3);
}

// --- Apartado 8 del cierre: los campos de uso no se tocan en esta fase ---
{
  const o = { ...crearOutfit({ nombre: 'X', prendaIds: [vaquero.id] }), usos: 5, ultimoUso: '2026-08-10' };
  const editado = actualizarOutfit(o, { nombre: 'Y', prendaIds: [camiseta.id] });
  comprobar('Editar un outfit NO inventa ni borra su historial', editado.usos === 5 && editado.ultimoUso === '2026-08-10');
  comprobar('Un intento de sobrescribir "usos" desde el formulario se ignora',
    actualizarOutfit(o, { usos: 999 }).usos === 5);
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

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
