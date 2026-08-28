// ============================================================================
// EH · Fase 17/65 — Skincare: productos, farmacia, Amazon y packs
//
// Las dieciocho pruebas del apartado 23 (todas menos "Móvil", que es R1), y lo
// que gobierna la fase:
//   · UN motor de productos, compartido con la Fase 10 (condición de
//     finalización: *"evitando crear cinco catálogos diferentes"*)
//   · UN inventario, el de la Fase 13 — no un segundo catálogo de piel
//   · el catálogo está VACÍO a propósito (D2-03) y **nunca se inventa un enlace**
//   · nunca comprar, nunca añadir al carrito, nunca elegir por él (apartado 22)
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import {
  contestarPiel, datosPiel, normalizarPiel, DEFAULT_PIEL, MODULO_PIEL,
  anadirProductoPiel, TIPOS_PIEL, NECESIDADES_PIEL,
} from '../src/lib/perfilPiel.js';
import {
  alternarPartePiel, PLAQUITAS_PIEL, PARTES_PIEL, crearRutinaPiel,
  datosRutinasPiel, productosDePiel, asignarProductoAPaso,
} from '../src/lib/rutinasPiel.js';
import {
  normalizarProductoGenerico, TIPOS_TIENDA as TIENDAS_MOTOR,
  ETIQUETA_ENLACE as ETIQUETA_MOTOR,
} from '../src/lib/motorProductos.js';
import { normalizarProducto as normalizarProductoPelo } from '../src/lib/productosPelo.js';
import {
  PARTE_PRODUCTOS, CATEGORIAS_PRODUCTO_PIEL, categoriaPiel, categoriasDePiel,
  CATALOGO_PIEL, CATALOGO_VACIO_PORQUE, normalizarProductoPiel, productosPiel,
  productoPiel, crearProductoPiel, editarProductoPiel, eliminarProductoPiel,
  alternarFavoritoPiel, alternarMioPiel, valorarProductoPiel, anadirTiendaPiel,
  quitarTiendaPiel, enlacesDePiel, marcarNoDisponiblePiel, alternativasDePiel,
  FILTROS_PIEL, buscarEnPiel, marcasDePiel, FILAS_COMPARACION_PIEL,
  compararProductosPiel, recomendarProductosPiel, packsPiel, crearPackPiel,
  eliminarPackPiel, verPackPiel, packSugeridoPiel, resumenProductosPiel,
  auditarProductosPiel, panelProductosPiel, PRECIO_BAJO,
  TIPOS_TIENDA, tipoTienda, ETIQUETA_ENLACE, AVISO_AFILIACION, MAX_COMPARAR,
} from '../src/lib/productosPiel.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']);
const crear = (e, datos) => crearProductoPiel(e, datos, { hoy: HOY });
const responder = (e, pares) => pares.reduce((acc, [q, v]) => contestarPiel(acc, q, v, { hoy: HOY }).estado, e);

/* ⚠️ Al leer el código para comprobar una ausencia hay que quitar ANTES los
   comentarios, los textos y la propia auditoría: si no, la prueba caza su
   propia evidencia honesta. Van siete veces en este proyecto. */
const fuente = readFileSync(new URL('../src/lib/productosPiel.js', import.meta.url), 'utf8');
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarProductosPiel[\s\S]*?\n}/, '')
  .replace(/'[^'\n]*'/g, "''")
  .replace(/`[^`]*`/g, '``');

/* ── 1 · ⚠️ UN SOLO MOTOR DE PRODUCTOS ──────────────────────────────────── */
console.log('\n1 · ⚠️ Un motor de productos, no cinco catálogos');

eq(TIPOS_TIENDA, TIENDAS_MOTOR, '⚠️ Los tipos de tienda son los DEL MOTOR, no una copia');
eq(ETIQUETA_ENLACE, ETIQUETA_MOTOR, 'Y la etiqueta del enlace también');
eq(auditarProductosPiel(base()).motorCompartido, 'motorProductos.js', 'Con el motor declarado en la auditoría');
ok(!/function\s+normalizarProductoGenerico|function\s+buscarProductos\s*\(/.test(codigo),
  'Aquí no se reescribe nada del motor');
/* ⚠️ La condición de finalización, hecha comprobable: los dos módulos que hoy
   tienen productos pasan por la misma función. */
ok(normalizarProductoPelo({ nombre: 'X' }).tiendas !== undefined
  && normalizarProductoPiel({ nombre: 'X' }).tiendas !== undefined,
  '⚠️ Pelo y Piel comparten la ficha: la arquitectura vale para los dos');
ok(normalizarProductoGenerico({ nombre: 'X' }, { categoriaValida: () => false }).paraQue === '',
  'Y el motor existe por su cuenta, sin saber de piel ni de pelo');

/* ⚠️ Las filas de comparación son de CADA FASE: la 10 dibuja cuatro y la 17
   cinco. Compartir una sola habría sido inventarse una tabla. */
eq(FILAS_COMPARACION_PIEL.map((f) => f.id), ['objetivo', 'tipo', 'nivel', 'precio', 'tienda'],
  'Las cinco filas del apartado 15, en su orden');

/* ── 2 · ⚠️ UN SOLO INVENTARIO, EL DE LA FASE 13 ────────────────────────── */
console.log('\n2 · ⚠️ Un inventario, el de la Fase 13 (apartado 13)');

{
  const { estado: e1 } = anadirProductoPiel(base(), 'Limpiador de la Fase 13');
  eq(productosPiel(e1).length, 1, 'Un producto creado por la Fase 13 lo ve la Fase 17');
  eq(productosPiel(e1)[0].nombre, 'Limpiador de la Fase 13', 'Con su nombre');
  eq(productosPiel(e1)[0].tiendas, [], 'Y la ficha entera, aunque la 13 no la escribiera');

  const { estado: e2 } = crear(e1, { nombre: 'Hidratante de la Fase 17', categoria: 'hidratante' });
  eq(datosPiel(e2).productos.length, 2, '⚠️ Y uno creado por la Fase 17 va a ESA MISMA lista');
  eq(auditarProductosPiel(e2).inventariosNuevos, 0, 'Cero inventarios nuevos');
  /* ⚠️ Y la Fase 14 lo ve: es la prueba de que no hay dos listas. */
  ok(productosDePiel(e2).some((p) => p.nombre === 'Hidratante de la Fase 17'),
    '⚠️ La Fase 14 lo ve para engancharlo a un paso de la rutina');
}

/* ── 3 · ⚠️ EL NORMALIZADOR — LA DECIMOCTAVA VEZ ────────────────────────── */
console.log('\n3 · ⚠️ El normalizador de la Fase 13 no se come la ficha de la 17');

{
  const { estado } = crear(base(), {
    nombre: 'Sérum', marca: 'Marca', categoria: 'tratamiento', precio: 24.5,
    nivel: 'intermedio', objetivos: ['hidratacion'], tiposPiel: ['seca'],
    caracteristicas: ['Sin perfume'], tiendas: [{ tipo: 'farmacia', nombre: 'Farmacia' }],
  });
  // Lo que de verdad se guardaría y se volvería a leer, con la regla 5 en medio.
  const ida = normalizarPiel(datosPiel(estado));
  const vuelta = normalizarPiel(JSON.parse(JSON.stringify(ida)));
  const p = vuelta.productos[0];
  ok(p.marca === 'Marca' && p.categoria === 'tratamiento' && p.precio === 24.5,
    '⚠️ Marca, categoría y precio SOBREVIVEN al normalizador de la Fase 13');
  eq(p.tiendas.length, 1, 'Y las tiendas');
  eq(p.objetivos, ['hidratacion'], 'Y los objetivos');
  eq(p.tiposPiel, ['seca'], 'Y los tipos de piel');
  eq(p.caracteristicas, ['Sin perfume'], 'Y las características');
  ok('packs' in DEFAULT_PIEL, '⚠️ Y `packs` está declarado en el DEFAULT, no solo escrito');
  const conPack = crearPackPiel(estado, 'Pack', [p.id], { hoy: HOY }).estado;
  eq(normalizarPiel(normalizarPiel(datosPiel(conPack))).packs.length, 1,
    '⚠️ Y un pack sobrevive a dos normalizaciones seguidas');
}

/* ── 4 · CATEGORÍAS (apartado 2) ────────────────────────────────────────── */
console.log('\n4 · Las diez categorías, y solo las que usa');

eq(CATEGORIAS_PRODUCTO_PIEL.length, 10, 'Las diez del enunciado');
eq(CATEGORIAS_PRODUCTO_PIEL.map((c) => c.id), [
  'limpiador', 'hidratante', 'solar', 'contorno', 'labios',
  'tratamiento', 'exfoliante', 'mascarilla', 'barba', 'otros',
], 'En el orden del enunciado');
eq(categoriasDePiel(base()).length, 0, '⚠️ Sin productos no se le enseña ni una categoría');
{
  const { estado } = crear(base(), { nombre: 'Gel', categoria: 'limpiador' });
  eq(categoriasDePiel(estado).map((c) => c.id), ['limpiador'],
    '⚠️ *"No mostrar todas las categorías si el usuario no las utiliza"*');
}
eq(categoriaPiel('inventada'), null, 'Una categoría que no existe es `null`');
eq(normalizarProductoPiel({ nombre: 'X', categoria: 'inventada' }).categoria, null,
  'Y no se guarda');

/* ── 5 · LA FICHA (apartado 3) ──────────────────────────────────────────── */
console.log('\n5 · La ficha: los doce campos del apartado 3');

{
  const p = normalizarProductoPiel({ nombre: '  Crema  ' });
  ['nombre', 'marca', 'categoria', 'descripcion', 'caracteristicas', 'tiposPiel',
    'objetivos', 'nivel', 'precio', 'tiendas', 'estado'].forEach((c) => {
    ok(c in p, `La ficha tiene "${c}"`);
  });
  eq(p.nombre, 'Crema', 'El nombre se limpia');
  eq(p.estado, 'disponible', 'Y nace disponible');
  eq(p.precio, null, '⚠️ Sin precio es `null`, nunca 0: no sabemos cuánto cuesta');
  eq(p.tiposPiel, [], '⚠️ Sin tipo de piel declarado sirve para cualquiera');
  eq(normalizarProductoPiel({ nombre: 'X', tiposPiel: ['inventado', 'seca'] }).tiposPiel, ['seca'],
    'Un tipo de piel que no existe no se guarda');
  eq(normalizarProductoPiel({ nombre: 'X', objetivos: ['nada', 'hidratacion'] }).objetivos, ['hidratacion'],
    'Ni un objetivo que no está en las necesidades de la Fase 13');
  eq(normalizarProductoPiel({ nombre: 'X', precio: -3 }).precio, null, 'Ni un precio negativo');
  eq(normalizarProductoPiel({ nombre: 'X', nivel: 'dios' }).nivel, null, 'Ni un nivel inventado');
}

/* ── 6 · CREAR, EDITAR Y BORRAR (apartado 14) ───────────────────────────── */
console.log('\n6 · Producto personalizado (apartado 14)');

{
  const r = crear(base(), { nombre: 'Mi crema rara', marca: 'Casera' });
  eq(r.error, null, '⚠️ *"No necesita estar en el catálogo oficial"*');
  eq(productosPiel(r.estado).length, 1, 'Se guarda');
  eq(productosPiel(r.estado)[0].origen, 'propio', 'Y consta que es suyo, no de un catálogo');

  eq(crear(base(), { marca: 'Sin nombre' }).error, 'El producto necesita un nombre.',
    'Solo el nombre es obligatorio, pero lo es');

  const dup = crear(r.estado, { nombre: 'mi crema rara', marca: 'casera' });
  ok(dup.sinEfecto === true, 'Mismo nombre y marca es el mismo producto, aunque cambien las mayúsculas');
  eq(productosPiel(dup.estado).length, 1, 'Y no se duplica');

  const id = productosPiel(r.estado)[0].id;
  const ed = editarProductoPiel(r.estado, id, { precio: 12 }, { hoy: HOY });
  eq(productoPiel(ed.estado, id).precio, 12, 'Se puede editar');
  eq(productoPiel(ed.estado, id).precioAnotado, HOY,
    '⚠️ Y el precio se sella con su fecha (apartado 19): no es un dato permanente');
  eq(editarProductoPiel(r.estado, 'no-existe', {}).error, 'Ese producto no existe.', 'Editar lo que no hay avisa');

  const bo = eliminarProductoPiel(r.estado, id);
  eq(productosPiel(bo.estado).length, 0, 'Y se puede borrar');
  eq(eliminarProductoPiel(base(), 'x').error, 'Ese producto no existe.', 'Borrar lo que no hay avisa');
}

/* ⚠️ Borrar DESENGANCHA, no arrasa. */
{
  let e = crear(base(), { nombre: 'Limpiador', categoria: 'limpiador' }).estado;
  const id = productosPiel(e)[0].id;
  e = crearRutinaPiel(e, { nombre: 'Mañana', pasos: [{ paso: 'limpieza' }] }, { hoy: HOY }).estado;
  const rutina = datosRutinasPiel(e).rutinas[0];
  e = asignarProductoAPaso(e, rutina.id, rutina.pasos[0].id, id).estado;
  eq(datosRutinasPiel(e).rutinas[0].pasos[0].productoId, id, 'Un paso puede llevar el producto');
  e = eliminarProductoPiel(e, id).estado;
  eq(datosRutinasPiel(e).rutinas.length, 1, '⚠️ Borrar el producto NO borra la rutina');
  eq(datosRutinasPiel(e).rutinas[0].pasos[0].productoId, null, 'Solo lo desengancha');
}

/* ── 7 · AMAZON, FARMACIA Y OTRA TIENDA (apartados 4, 5 y 6) ────────────── */
console.log('\n7 · Amazon, farmacia y otra tienda — y Amazon no es una limitación');

eq(TIPOS_TIENDA.map((t) => t.id), ['amazon', 'farmacia', 'especializada', 'fabricante', 'otra'],
  'Los cinco tipos de tienda');

{
  // Producto Amazon.
  let e = crear(base(), { nombre: 'Con Amazon', tiendas: [{ tipo: 'amazon', url: 'https://www.amazon.es/dp/X' }] }).estado;
  const idA = productosPiel(e)[0].id;
  const enlA = enlacesDePiel(e, idA);
  ok(enlA.enlaces.length === 1 && enlA.enlaces[0].url === 'https://www.amazon.es/dp/X', 'Producto Amazon: su enlace');
  eq(enlA.enlaces[0].etiqueta, ETIQUETA_ENLACE, '⚠️ Y el usuario ve siempre "Ver producto" (apartado 7)');

  // Producto farmacia, sin Amazon.
  e = crear(e, { nombre: 'De farmacia', tiendas: [{ tipo: 'farmacia', nombre: 'Farmacia del barrio' }] }).estado;
  const idF = productosPiel(e).find((p) => p.nombre === 'De farmacia').id;
  const enlF = enlacesDePiel(e, idF);
  eq(enlF.sinEnlaces, true, 'Producto de farmacia sin enlace: no hay enlace');
  ok(/farmacia/i.test(enlF.donde || enlF.sinEnlacesTexto || ''),
    '⚠️ Pero SÍ se dice dónde conseguirlo: "Disponible en farmacia" es una respuesta completa');
  ok(recomendarProductosPiel(e).activo, '⚠️ Y sin Amazon la aplicación sigue pudiendo recomendarlo');

  // Otra tienda.
  e = crear(e, { nombre: 'De otra tienda', tiendas: [{ tipo: 'otra', nombre: 'Perfumería' }] }).estado;
  const idO = productosPiel(e).find((p) => p.nombre === 'De otra tienda').id;
  eq(tipoTienda(productoPiel(e, idO).tiendas[0].tipo).id, 'otra', 'Producto de otra tienda');

  // Producto sin enlace y sin tienda.
  e = crear(e, { nombre: 'Sin nada' }).estado;
  const idN = productosPiel(e).find((p) => p.nombre === 'Sin nada').id;
  eq(enlacesDePiel(e, idN).sinEnlaces, true, 'Producto sin enlace: se dice, no se inventa');
  eq(enlacesDePiel(e, idN).enlaces.length, 0, 'Y no aparece ningún botón que no lleve a ningún sitio');
}

/* ⚠️ NUNCA UN ENLACE INVENTADO (apartado 4). */
{
  const { estado } = crear(base(), {
    nombre: 'Con basura', tiendas: [{ tipo: 'amazon', url: 'esto no es una url' }],
  });
  const p = productosPiel(estado)[0];
  eq(p.tiendas[0].url, null, '⚠️ Una "url" que no lo es se guarda como `null`');
  eq(enlacesDePiel(estado, p.id).sinEnlaces, true, 'Y la pantalla dice que no hay enlace');
  ok(!/amazon\.[a-z]+\/(s\?|search)/i.test(fuente),
    '⚠️ Y en ninguna parte se fabrica una búsqueda de Amazon "por si acaso"');
  eq(auditarProductosPiel(estado).enlacesInventados, 0, 'Cero enlaces inventados, declarado');
}

/* ── 8 · AFILIACIÓN (apartado 7) ────────────────────────────────────────── */
console.log('\n8 · Afiliación: el enlace se guarda, el aviso solo donde lo hay');

{
  let e = crear(base(), {
    nombre: 'Afiliado', tiendas: [{ tipo: 'amazon', url: 'https://www.amazon.es/dp/Y', afiliado: true }],
  }).estado;
  const id = productosPiel(e)[0].id;
  const enl = enlacesDePiel(e, id);
  eq(enl.hayAfiliado, true, 'Producto afiliado: consta');
  eq(enl.aviso, AVISO_AFILIACION, 'Y sale el aviso de transparencia');
  ok(/afiliado/i.test(AVISO_AFILIACION) && /sin coste adicional/i.test(AVISO_AFILIACION),
    'Con la frase del enunciado, entera');
  eq(enl.enlaces[0].etiqueta, ETIQUETA_ENLACE, '⚠️ Pero el usuario ve "Ver producto", no "enlace de afiliado"');

  e = crear(e, { nombre: 'Normal', tiendas: [{ tipo: 'amazon', url: 'https://www.amazon.es/dp/Z' }] }).estado;
  const id2 = productosPiel(e).find((p) => p.nombre === 'Normal').id;
  eq(enlacesDePiel(e, id2).aviso, '',
    '⚠️ Y donde NO hay afiliación no sale el aviso: ponerlo de más es tan poco honesto como quitarlo');
}

/* ── 9 · FAVORITOS Y "YA LO TENGO" (apartados 12 y 13) ──────────────────── */
console.log('\n9 · Favoritos y "Ya lo tengo"');

{
  let e = crear(base(), { nombre: 'Crema' }).estado;
  const id = productosPiel(e)[0].id;
  eq(productoPiel(e, id).favorito, false, 'Nace sin ser favorito');
  e = alternarFavoritoPiel(e, id).estado;
  eq(productoPiel(e, id).favorito, true, '❤️ Guardar');
  e = alternarFavoritoPiel(e, id).estado;
  eq(productoPiel(e, id).favorito, false, 'Y se puede quitar');

  e = alternarMioPiel(e, id).estado;
  eq(productoPiel(e, id).mio, true, '"Ya lo tengo"');
  eq(resumenProductosPiel(e).mios, 1, 'Y cuenta en el resumen');
  e = alternarMioPiel(e, id).estado;
  eq(productoPiel(e, id).mio, false, 'Y se puede deshacer');
  eq(alternarFavoritoPiel(base(), 'x').error, 'Ese producto no existe.', 'Sobre lo que no hay, avisa');
}

/* ── 10 · VALORACIÓN PERSONAL (apartado 20) ─────────────────────────────── */
console.log('\n10 · Valoración y opinión — información personal');

{
  let e = crear(base(), { nombre: 'Crema' }).estado;
  const id = productosPiel(e)[0].id;
  e = valorarProductoPiel(e, id, 4, 'Me va bien').estado;
  eq(productoPiel(e, id).valoracion, 4, 'Se guarda la valoración');
  eq(productoPiel(e, id).opinion, 'Me va bien', 'Y la opinión');
  eq(valorarProductoPiel(e, id, 9).error, 'La valoración va de 1 a 5.', 'Un 9 no cuela');
  eq(valorarProductoPiel(e, id, 2.5).error, 'La valoración va de 1 a 5.', 'Ni un 2,5');
  eq(valorarProductoPiel(e, id, null).estado ? productoPiel(valorarProductoPiel(e, id, null).estado, id).valoracion : 'x',
    null, 'Y se puede quitar');
  /* ⚠️ *"Esto no afecta automáticamente a otros usuarios. Es información
     personal."* — no hay ni una media, ni un ranking, ni nada compartido. */
  ok(!/media|promedio|ranking|otrosUsuarios|valoracionMedia/i.test(codigo),
    '⚠️ Y no existe ninguna media ni ranking: es información personal');
}

/* ── 11 · BUSCADOR (apartado 11) ────────────────────────────────────────── */
console.log('\n11 · Buscador');

{
  let e = base();
  e = crear(e, { nombre: 'Hidratante ligera', categoria: 'hidratante', marca: 'Uno' }).estado;
  e = crear(e, { nombre: 'Protector solar 50', categoria: 'solar', marca: 'Dos' }).estado;
  e = crear(e, { nombre: 'Gel limpiador', categoria: 'limpiador', marca: 'Uno' }).estado;

  eq(buscarEnPiel(e, { texto: 'hidratante' }).map((p) => p.nombre), ['Hidratante ligera'], '"hidratante"');
  eq(buscarEnPiel(e, { texto: 'protector solar' }).map((p) => p.nombre), ['Protector solar 50'], '"protector solar"');
  eq(buscarEnPiel(e, { texto: 'limpiador' }).map((p) => p.nombre), ['Gel limpiador'], '"limpiador"');
  eq(buscarEnPiel(e, { texto: 'HIDRATANTE' }).length, 1, 'Sin distinguir mayúsculas');
  eq(buscarEnPiel(e, { texto: 'solar' }).length, 1, 'Y sin tildes');
  eq(buscarEnPiel(e, {}).length, 3, '⚠️ *"No obligar a utilizar filtros"*: sin nada salen todos');
  eq(buscarEnPiel(e, { texto: 'nada de nada' }).length, 0, 'Y lo que no está, no está');
  eq(marcasDePiel(e), ['Dos', 'Uno'], 'Las marcas que de verdad hay, sin inventarse ninguna');
}

/* ── 12 · FILTROS (apartado 10) ─────────────────────────────────────────── */
console.log('\n12 · Los ocho filtros del apartado 10');

['categoria', 'tipoPiel', 'objetivo', 'precioMax', 'marca', 'tienda', 'nivel', 'preferencia']
  .forEach((f) => ok(FILTROS_PIEL.some((x) => x.id === f), `Se puede filtrar por "${f}"`));

{
  let e = base();
  e = crear(e, {
    nombre: 'Para seca', categoria: 'hidratante', marca: 'Uno', nivel: 'basico',
    precio: 10, tiposPiel: ['seca'], objetivos: ['hidratacion'],
    caracteristicas: ['Textura cremosa'], tiendas: [{ tipo: 'farmacia' }],
  }).estado;
  e = crear(e, {
    nombre: 'Para grasa', categoria: 'limpiador', marca: 'Dos', nivel: 'avanzado',
    precio: 40, tiposPiel: ['grasa'], objetivos: ['grasa'],
    caracteristicas: ['Textura ligera'], tiendas: [{ tipo: 'amazon', url: 'https://www.amazon.es/dp/A' }],
  }).estado;
  e = crear(e, { nombre: 'Para cualquiera', categoria: 'solar' }).estado;

  eq(buscarEnPiel(e, { categoria: 'hidratante' }).map((p) => p.nombre), ['Para seca'], 'Por categoría');
  eq(buscarEnPiel(e, { marca: 'dos' }).map((p) => p.nombre), ['Para grasa'], 'Por marca');
  eq(buscarEnPiel(e, { nivel: 'basico' }).map((p) => p.nombre), ['Para seca'], 'Por nivel');
  eq(buscarEnPiel(e, { tienda: 'amazon' }).map((p) => p.nombre), ['Para grasa'], 'Por tienda');
  eq(buscarEnPiel(e, { objetivo: 'hidratacion' }).map((p) => p.nombre), ['Para seca'], 'Por objetivo');
  eq(buscarEnPiel(e, { preferencia: 'ligera' }).map((p) => p.nombre), ['Para grasa'], 'Por preferencia');
  eq(buscarEnPiel(e, { tipoPiel: 'seca' }).map((p) => p.nombre), ['Para seca', 'Para cualquiera'],
    '⚠️ Por tipo de piel — y el que no declara ninguno NO se cae: sirve para cualquiera');
  eq(buscarEnPiel(e, { precioMax: 20 }).map((p) => p.nombre), ['Para seca', 'Para cualquiera'],
    '⚠️ Por precio — y el que no tiene precio tampoco se cae: no sabemos cuánto cuesta');
  eq(buscarEnPiel(e, { categoria: 'hidratante', marca: 'Dos' }).length, 0, 'Los filtros se suman');
  eq(buscarEnPiel(e, { texto: 'para', nivel: 'avanzado' }).map((p) => p.nombre), ['Para grasa'],
    'Y se combinan con el buscador');
}

/* ── 13 · COMPARACIÓN (apartado 15) ─────────────────────────────────────── */
console.log('\n13 · Comparar — y la comparación no elige');

{
  let e = base();
  e = crear(e, { nombre: 'A', categoria: 'hidratante', nivel: 'basico', objetivos: ['hidratacion'], precio: 10 }).estado;
  e = crear(e, { nombre: 'B', categoria: 'hidratante', nivel: 'intermedio' }).estado;
  e = crear(e, { nombre: 'C' }).estado;
  e = crear(e, { nombre: 'D' }).estado;
  const ids = productosPiel(e).map((p) => p.id);

  eq(compararProductosPiel(e, [ids[0]]).suficiente, false, 'Con uno solo no hay comparación');
  ok(/al menos dos/i.test(compararProductosPiel(e, [ids[0]]).texto), 'Y se dice por qué');

  const c = compararProductosPiel(e, [ids[0], ids[1]]);
  eq(c.suficiente, true, 'Con dos, sí');
  eq(c.filas.length, 5, 'Las cinco filas');
  eq(c.filas.find((f) => f.id === 'objetivo').valores, ['Hidratación', '—'],
    '⚠️ Y lo que no se sabe sale vacío, nunca como un cero ni como un "peor"');
  eq(c.filas.find((f) => f.id === 'precio').valores, ['10 €', '—'], 'El precio con su moneda, y una raya si no hay');
  eq(c.filas.find((f) => f.id === 'nivel').valores, ['Básico', 'Intermedio'], 'Y el nivel con su nombre');

  eq(MAX_COMPARAR, 3, 'El tope es tres');
  const c4 = compararProductosPiel(e, ids);
  eq(c4.productos.length, 3, 'Y comparar cuatro compara tres');
  eq(c4.recortado, true, 'Y se dice que se ha recortado');

  /* ⚠️ La comparación NO elige. */
  ok(!/mejor|ganador|peor|puntuacion|recomendado:/i.test(codigo.split('compararProductosPiel')[1]?.slice(0, 900) || ''),
    '⚠️ Ni "mejor", ni un ganador, ni una puntuación: enseña diferencias y decide él');
}

/* ── 14 · ALTERNATIVAS (apartado 18) ────────────────────────────────────── */
console.log('\n14 · Alternativas cuando algo se agota');

{
  let e = base();
  e = crear(e, { nombre: 'Agotado', categoria: 'hidratante', nivel: 'basico' }).estado;
  e = crear(e, { nombre: 'Parecido', categoria: 'hidratante', nivel: 'basico' }).estado;
  e = crear(e, { nombre: 'Otra cosa', categoria: 'solar' }).estado;
  const id = productosPiel(e).find((p) => p.nombre === 'Agotado').id;

  eq(productoPiel(e, id).estado, 'disponible', 'Nace disponible');
  e = marcarNoDisponiblePiel(e, id).estado;
  eq(productoPiel(e, id).estado, 'no_disponible', 'Se puede marcar como no disponible');

  const alt = alternativasDePiel(e, id);
  eq(alt.map((p) => p.nombre), ['Parecido'],
    '⚠️ Y las alternativas respetan los criterios relevantes: misma categoría y disponibles');
  ok(!alt.some((p) => p.id === id), 'Y nunca se propone él mismo');

  eq(recomendarProductosPiel(e, {}, { limite: 99 }).productos.some((p) => p.id === id), false,
    '⚠️ Y lo no disponible deja de recomendarse');
  eq(resumenProductosPiel(e).noDisponibles, 1, 'Y consta en el resumen');

  e = marcarNoDisponiblePiel(e, id, true).estado;
  eq(productoPiel(e, id).estado, 'disponible', 'Y se puede volver a marcar disponible');
}

/* ── 15 · "PARA TI" (apartados 8 y 9) ───────────────────────────────────── */
console.log('\n15 · ⭐ Para ti — seis criterios, sin IA, y con su porqué');

{
  let e = responder(base(), [
    ['tipoPiel', 'seca'],
    ['necesidadesPiel', 'hidratacion'],
    ['prioridadPiel', 'hidratacion'],
    ['complejidadPiel', 'basico'],
    ['usaProductos', 'si'],
    ['presupuestoPiel', 'bajo'],
    ['preferenciasProducto', 'ligera'],
  ]);
  e = crear(e, {
    nombre: 'Le encaja', categoria: 'hidratante', nivel: 'basico', precio: 9,
    tiposPiel: ['seca'], objetivos: ['hidratacion'], caracteristicas: ['Textura ligera'],
  }).estado;
  e = crear(e, { nombre: 'No le encaja', categoria: 'solar', nivel: 'avanzado', precio: 60, tiposPiel: ['grasa'] }).estado;

  const r = recomendarProductosPiel(e);
  eq(r.activo, true, 'La plaquita está encendida por defecto');
  eq(r.productos[0].nombre, 'Le encaja', 'Y lo primero es lo que encaja con lo que él ha contestado');
  ok(!r.productos.some((p) => p.nombre === 'No le encaja'), 'Lo que no encaja con nada no se recomienda');

  const porque = r.productos[0].porque;
  ok(porque.startsWith('Encaja con ') && porque.endsWith('.'), '⚠️ Y cada uno dice POR QUÉ, con la forma del ejemplo');
  ok(/tipo de piel/.test(porque), 'Nombrando su tipo de piel');
  ok(/objetivo de hidratación/.test(porque), 'Y su objetivo');
  ok(/preferencia por textura ligera/.test(porque), 'Y su preferencia');
  ok(/ y /.test(porque) && !/, y /.test(porque), 'Y en castellano: "a, b y c", no "a, b, y c"');

  /* ⚠️ Los seis criterios del apartado 8, cada uno probado por separado. */
  const solo = (datos, ctx) => {
    const ee = crear(responder(base(), ctx), { nombre: 'X', ...datos }).estado;
    return recomendarProductosPiel(ee).total;
  };
  eq(solo({ tiposPiel: ['seca'] }, [['tipoPiel', 'seca']]), 1, 'Criterio 1: perfil de piel');
  eq(solo({ objetivos: ['hidratacion'] }, [['necesidadesPiel', 'hidratacion']]), 1, 'Criterio 2: objetivo');
  eq(solo({ caracteristicas: ['Textura ligera'] }, [['preferenciasProducto', 'ligera']]), 1, 'Criterio 3: preferencias');
  eq(solo({ precio: 5 }, [['usaProductos', 'si'], ['presupuestoPiel', 'bajo']]), 1, 'Criterio 4: presupuesto');
  eq(solo({ nivel: 'basico' }, [['complejidadPiel', 'basico']]), 1, 'Criterio 5: nivel');
  ok(PRECIO_BAJO > 0, 'Y el corte de "presupuesto bajo" tiene nombre, no es un número suelto');

  /* Criterio 6: lo que ya tiene. */
  let f = crear(responder(base(), [['tipoPiel', 'seca']]), { nombre: 'Ya lo tengo', tiposPiel: ['seca'] }).estado;
  f = crear(f, { nombre: 'Nuevo', tiposPiel: ['seca'] }).estado;
  const idMio = productosPiel(f).find((p) => p.nombre === 'Ya lo tengo').id;
  f = alternarMioPiel(f, idMio).estado;
  eq(recomendarProductosPiel(f).productos[0].nombre, 'Nuevo',
    'Criterio 6: lo que ya usa pesa menos — recomendárselo no aporta');

  /* ⚠️ Sin datos no se recomienda nada, en vez de asumir. */
  const vacio = crear(base(), { nombre: 'Solo un nombre' }).estado;
  eq(recomendarProductosPiel(vacio).total, 0, '⚠️ Sin nada contestado no se recomienda: no se asume');
}

/* ⚠️ SIN IA (apartado 8). */
ok(!/askAI|preguntarIA|anthropic|claude|fetch\(/i.test(codigo), '⚠️ Sin IA: ni una llamada');
eq(auditarProductosPiel(base()).usaIA, 0, 'Declarado en la auditoría');

/* ── 16 · PACKS (apartados 16 y 17) ─────────────────────────────────────── */
console.log('\n16 · Packs — y el pack sugerido SUGIERE');

{
  let e = base();
  e = crear(e, { nombre: 'Limpiador', categoria: 'limpiador' }).estado;
  e = crear(e, { nombre: 'Hidratante', categoria: 'hidratante' }).estado;
  const ids = productosPiel(e).map((p) => p.id);

  eq(crearPackPiel(e, '', ids).error, 'El pack necesita un nombre.', 'Un pack sin nombre no se crea');
  const r = crearPackPiel(e, 'Pack básico de mañana', ids, { hoy: HOY });
  e = r.estado;
  eq(packsPiel(e).length, 1, 'Se crea el pack');
  eq(packsPiel(e)[0].nombre, 'Pack básico de mañana', 'Con su nombre');

  const v = verPackPiel(e, packsPiel(e)[0].id);
  eq(v.items.map((p) => p.nombre), ['Limpiador', 'Hidratante'], 'Y con sus productos dentro');
  /* ⚠️ Apartado 16 — *"☑️ Producto 1 ☑️ Producto 2 ☐ Producto 3"*: los tildes
     los pone él con "Ya lo tengo"; el pack no decide cuáles están marcados. */
  eq(v.yaTengo, [], 'Sin nada marcado de entrada');
  const marcado = alternarMioPiel(e, ids[0]).estado;
  eq(verPackPiel(marcado, packsPiel(marcado)[0].id).yaTengo, [ids[0]],
    '⚠️ Y lo que ya tiene sale marcado dentro del pack');
  eq(v.precio, null, '⚠️ Y sin precios no se inventa un total');
  eq(v.sumaParcial, true, 'Y se dice que la suma estaría incompleta, en vez de dar un total falso');

  const conFantasma = crearPackPiel(e, 'Otro', [...ids, 'no-existe']);
  eq(packsPiel(conFantasma.estado).at(-1).productoIds.length, 2, 'Un producto que no existe no entra en un pack');

  e = eliminarPackPiel(e, packsPiel(e)[0].id).estado;
  eq(packsPiel(e).length, 0, 'Y se puede borrar');
  eq(productosPiel(e).length, 2, '⚠️ Y borrar el pack NO borra los productos');
  eq(eliminarPackPiel(e, 'x').error, 'Ese pack no existe.', 'Borrar lo que no hay avisa');
}

/* ⚠️ El pack sugerido no escribe NADA. */
{
  let e = responder(base(), [['tipoPiel', 'seca'], ['necesidadesPiel', 'hidratacion']]);
  e = crear(e, { nombre: 'Gel', categoria: 'limpiador', tiposPiel: ['seca'] }).estado;
  e = crear(e, { nombre: 'Crema', categoria: 'hidratante', tiposPiel: ['seca'] }).estado;
  e = crear(e, { nombre: 'SPF', categoria: 'solar', tiposPiel: ['seca'] }).estado;

  const antes = JSON.stringify(normalizarEstiloHombre(e));
  const s = packSugeridoPiel(e);
  eq(JSON.stringify(normalizarEstiloHombre(e)), antes,
    '⚠️ Calcular el pack sugerido NO escribe ni un byte (sexto `aplicarPlan` del proyecto)');
  eq(s.hay, true, 'Hay pack que sugerir');
  eq(s.guardado, false, '⚠️ Y va escrito en el propio dato: esto NO está guardado');
  eq(s.productos.map((p) => p.categoria), ['limpiador', 'hidratante', 'solar'],
    'Limpiador, hidratante y protector solar — el pack básico del enunciado');
  ok(s.porque && s.accion === 'Crear este pack', 'Con su porqué y el botón que lo crearía, que pulsa él');

  eq(packSugeridoPiel(base()).hay, false, '⚠️ Y sin productos no se inventa un pack');
  ok(packSugeridoPiel(base()).texto.length > 0, 'Se dice qué falta');
}

/* ── 17 · DESACTIVAR Y REACTIVAR (apartado 21) ──────────────────────────── */
console.log('\n17 · Desactivación y reactivación — y los datos permanecen');

ok(PARTES_PIEL.some((p) => p.id === PARTE_PRODUCTOS), 'Productos se puede desactivar');
eq(PARTES_PIEL.find((p) => p.id === PARTE_PRODUCTOS).porDefecto, true, 'Y viene encendido');
eq(PLAQUITAS_PIEL.find((p) => p.id === 'productos').listo, true, 'Y la plaquita ya funciona');

{
  let e = crear(base(), { nombre: 'Crema', categoria: 'hidratante' }).estado;
  eq(panelProductosPiel(e).activo, true, 'El panel está activo');

  e = alternarPartePiel(e, PARTE_PRODUCTOS);
  eq(panelProductosPiel(e).activo, false, 'Se desactiva');
  eq(recomendarProductosPiel(e).activo, false, 'Y deja de recomendar');
  eq(productosPiel(e).length, 1, '⚠️ *"Los datos permanecen"*: el producto sigue ahí');
  /* ⚠️ Y el módulo de skincare sigue funcionando: se puede seguir usando la
     rutina, que es de la Fase 14. */
  eq(datosRutinasPiel(e).partes.rutinas, true, '⚠️ Y las rutinas siguen encendidas: skincare sigue funcionando');

  e = alternarPartePiel(e, PARTE_PRODUCTOS);
  eq(panelProductosPiel(e).activo, true, 'Se reactiva');
  eq(productosPiel(e)[0].nombre, 'Crema', 'Y el producto sigue siendo el mismo');
}

/* ── 18 · ⚠️ D2-03 Y EL APARTADO 22 ─────────────────────────────────────── */
console.log('\n18 · ⚠️ Catálogo vacío (D2-03) y nunca comprar (apartado 22)');

eq(CATALOGO_PIEL.length, 0, '⚠️ El catálogo está VACÍO, y es una decisión de Josué (D2-03)');
eq(auditarProductosPiel(base()).catalogo, 0, 'Declarado en la auditoría');
ok(CATALOGO_VACIO_PORQUE.length > 0, 'Y se le dice por qué no ve productos, en vez de una pantalla en blanco');
eq(panelProductosPiel(base()).vacio, CATALOGO_VACIO_PORQUE, 'La pantalla lo enseña');

/* ⚠️ *"Nunca comprar. Nunca añadir al carrito. Nunca elegir por el usuario."* */
ok(!/function\s+comprar|comprarProducto|addToCart|anadirAlCarrito|carrito/i.test(codigo),
  '⚠️ No existe ninguna función que compre ni que añada a un carrito');
ok(!/checkout|pagar|pasarela|stripe|paypal/i.test(codigo), 'Ni nada que pague');
{
  const a = auditarProductosPiel(base());
  eq([a.compra, a.carrito, a.pago], [0, 0, 0], 'Cero compras, cero carritos, cero pagos');
}
/* ⚠️ Y "elegir por el usuario": lo único que escribe son funciones que él pulsa.
   `recomendarProductosPiel` y `packSugeridoPiel` no escriben, y ya se ha
   comprobado arriba con el estado serializado. */
{
  const e = responder(base(), [['tipoPiel', 'seca']]);
  const conProducto = crear(e, { nombre: 'X', tiposPiel: ['seca'] }).estado;
  const antes = JSON.stringify(normalizarEstiloHombre(conProducto));
  recomendarProductosPiel(conProducto);
  buscarEnPiel(conProducto, { texto: 'x' });
  panelProductosPiel(conProducto);
  eq(JSON.stringify(normalizarEstiloHombre(conProducto)), antes,
    '⚠️ Mirar los productos no cambia nada: la aplicación recomienda, el usuario elige');
}

/* ── 19 · EL PANEL Y EL RESUMEN ─────────────────────────────────────────── */
console.log('\n19 · El panel que dibuja la pantalla');

{
  let e = responder(base(), [['tipoPiel', 'seca'], ['necesidadesPiel', 'hidratacion']]);
  e = crear(e, {
    nombre: 'Crema', categoria: 'hidratante', marca: 'Uno', tiposPiel: ['seca'],
    objetivos: ['hidratacion'], tiendas: [{ tipo: 'amazon', url: 'https://www.amazon.es/dp/Q' }],
  }).estado;
  const p = panelProductosPiel(e);
  eq(p.productos.length, 1, 'Trae los productos');
  eq(p.categorias.map((c) => c.id), ['hidratante'], 'Las categorías en uso');
  eq(p.marcas, ['Uno'], 'Las marcas');
  eq(p.paraTi.total, 1, 'Lo de "Para ti"');
  eq(p.packs, [], 'Los packs');
  eq(p.vacio, '', 'Y con productos no sale el aviso de catálogo vacío');

  const r = resumenProductosPiel(e);
  eq([r.total, r.conEnlace, r.categorias], [1, 1, 1], 'Y el resumen cuadra');
  eq(r.activo, true, 'Con su interruptor');
}

/* ── 20 · REGLA 8 — NADA DECORATIVO ─────────────────────────────────────── */
console.log('\n20 · Regla 8: nada simulado');

ok(!/proximamente|próximamente|en construcción|TODO:|pendiente de implementar/i.test(fuente),
  'Ni un "próximamente" ni un TODO');
ok(!/Math\.random/.test(codigo), 'Ni una cifra inventada');

if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
console.log(`\n  ${n} comprobaciones correctas.`);
