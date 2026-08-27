// ============================================================================
// EH · Fase 10/65 — PRUEBAS
//
// Las quince del apartado 20, más las tres que este archivo no puede permitirse
// fallar:
//
//   - **D2-03 + apartado 3**: el catálogo está VACÍO, y comprobado.
//   - **Apartado 11**: ni un enlace inventado. Una URL que él no ha dado NO
//     existe — nada de construir una búsqueda de Amazon "por si acaso".
//   - **Apartado 19**: ni una función que compre. Se comprueba sobre el código.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { MODULO_PELO, contestarPelo } from '../src/lib/perfilCapilar.js';
import { datosPelo, alternarParte, crearRutina } from '../src/lib/rutinasPelo.js';
import {
  CATEGORIAS_PRODUCTO_PELO, categoriaProducto, TIPOS_TIENDA, tipoTienda,
  ETIQUETA_ENLACE, AVISO_AFILIACION, ESTADOS_PRODUCTO, estadoProducto,
  normalizarProducto, CATALOGO_PELO, CATALOGO_VACIO_PORQUE,
  productosPelo, productoPelo, crearProductoPelo, editarProductoPelo,
  marcarNoDisponible, alternativasDe, alternarFavorito, alternarMio, valorarProducto,
  anadirTienda, quitarTienda, enlacesDe,
  MAX_COMPARAR, FILAS_COMPARACION, compararProductos,
  recomendarProductos, PARTE_RECOMENDAR_PRODUCTOS,
  normalizarPack, packsPelo, crearPack, quitarDelPack, eliminarPack, verPack, packSugerido,
  resumenProductosPelo, auditarProductosPelo,
} from '../src/lib/productosPelo.js';

let n = 0;
let fallos = 0;
function ok(cond, msg) {
  n += 1;
  if (cond) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg}`);
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function eq(a, b, msg) {
  n += 1;
  if (igual(a, b)) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
}

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);
const di = (e, id, v) => contestarPelo(e, id, v, { hoy: HOY }).estado;

const conPerfil = () => {
  let e = base();
  e = di(e, 'tipoPelo', 'rizado');
  e = di(e, 'necesidadesPelo', 'hidratacion');
  e = di(e, 'necesidadesPelo', 'definicion');
  e = di(e, 'cueroCabelludo', 'graso');
  return e;
};

const crear = (e, datos) => crearProductoPelo(e, datos, { hoy: HOY });

/* ── 1 · ⚠️ D2-03 — EL CATÁLOGO ESTÁ VACÍO, Y ES UNA DECISIÓN ────────────── */

eq(CATALOGO_PELO, [], '⚠️ D2-03 + apartado 3: el catálogo está VACÍO');
ok(CATALOGO_VACIO_PORQUE.length > 20, 'Y se dice por qué, en vez de dejar una pantalla muda');
eq(auditarProductosPelo(base()).catalogo, 0, 'Cero productos de catálogo');
eq(auditarProductosPelo(base()).productosSuyos, 0, 'Y ninguno suyo todavía');

const fuente = readFileSync(new URL('../src/lib/productosPelo.js', import.meta.url), 'utf8');
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// ⚠️ Apartado 11 y D2-03: ni un enlace inventado en el código.
ok(!/https?:\/\/(?!\S*\$\{)/.test(codigo), '⚠️ Apartado 11: ni una URL literal en el código');
ok(!/amazon\.\w|amzn\.|tag=|afiliado=/i.test(codigo), '⚠️ D2-03: ni un dominio ni una etiqueta de afiliado');
ok(!/askAI|AI_SYSTEM|anthropic|openai/i.test(codigo), '⚠️ Sin IA, como toda la fase anterior');

// ⚠️ Apartado 19 — ni una función que compre.
['comprar', 'checkout', 'carrito', 'pagar', 'pedido'].forEach((x) => {
  ok(!new RegExp(`(function|const)\\s+\\w*${x}`, 'i').test(codigo),
    `⚠️ Apartado 19: ninguna función de "${x}" — la aplicación ofrece enlace, no compra`);
});
eq(auditarProductosPelo(base()).funcionesDeCompra, 0, 'Cero funciones de compra');

/* ── 2 · CATÁLOGOS DE LA FICHA (apartados 2 y 3) ────────────────────────── */

eq(CATEGORIAS_PRODUCTO_PELO.length, 8, 'Las ocho categorías del apartado 2');
eq(CATEGORIAS_PRODUCTO_PELO.map((c) => c.nombre),
  ['Champús', 'Acondicionadores', 'Mascarillas', 'Hidratación', 'Definición', 'Styling', 'Tratamientos', 'Accesorios'],
  'Con sus nombres literales');
ok(CATEGORIAS_PRODUCTO_PELO.every((c) => c.icono && c.accion), 'Cada una con icono y con el paso de rutina que cubre');
eq(categoriaProducto('inventada'), null, 'Una que no existe devuelve null');

eq(TIPOS_TIENDA.length, 5, '⚠️ Apartado 13: cinco tipos de tienda, no solo Amazon');
ok(TIPOS_TIENDA.some((t) => t.id === 'farmacia'), 'Con farmacia');
ok(TIPOS_TIENDA.some((t) => t.id === 'fabricante'), 'Y fabricante');
eq(tipoTienda('inventada'), null, 'Una que no existe devuelve null');
eq(ESTADOS_PRODUCTO.filter((e) => e.aviso).length, 2, 'Dos estados llevan aviso');
eq(estadoProducto('inventado'), null, 'Y un estado que no existe, null');

// Los doce campos del apartado 3.
const ficha = normalizarProducto({ nombre: 'X' });
['nombre', 'marca', 'categoria', 'descripcion', 'paraQue', 'caracteristicas', 'nivel', 'precio',
  'tiendas', 'estado'].forEach((c) => {
  ok(c in ficha, `Apartado 3: la ficha tiene "${c}"`);
});

/* ── 3 · CREAR, EDITAR Y NO DUPLICAR (apartados 9 y 20) ─────────────────── */

const r1 = crear(base(), { nombre: 'Champú suave', marca: 'Genérica', categoria: 'champu' });
eq(r1.error, null, 'Crear producto');
eq(productosPelo(r1.estado).length, 1, 'Y queda guardado');
eq(productosPelo(r1.estado)[0].origen, 'propio', '⚠️ Y marcado como SUYO, no de catálogo');

// *"No obligarle a introducir todos los datos."*
const soloNombre = crear(base(), { nombre: 'Algo' });
eq(soloNombre.error, null, '⚠️ Apartado 9: solo con el nombre ya vale');
eq(productoPelo(soloNombre.estado, soloNombre.producto.id).marca, '', 'Sin marca');
eq(productoPelo(soloNombre.estado, soloNombre.producto.id).precio, null, 'Sin precio, y `null` en vez de 0');
ok(crear(base(), { nombre: '   ' }).error !== null, 'Pero el nombre no puede estar vacío');

// ⚠️ *"No duplicar productos"* (apartado 20).
const dup = crear(r1.estado, { nombre: 'champú suave', marca: 'genérica' });
ok(dup.yaExistia, '⚠️ Apartado 20: mismo nombre y marca es el MISMO producto, aunque cambien las mayúsculas');
eq(productosPelo(dup.estado).length, 1, 'Y no se crea otro');
eq(productosPelo(crear(r1.estado, { nombre: 'Champú suave', marca: 'Otra' }).estado).length, 2,
  'Pero otra marca sí es otro producto');
eq(auditarProductosPelo(r1.estado).listasDeProductos, 1,
  '⚠️ Una sola lista de productos: la que creó la Fase 8');

const idProd = r1.producto.id;
eq(productoPelo(editarProductoPelo(r1.estado, idProd, { marca: 'Otra' }).estado, idProd).marca, 'Otra', 'Editarlo');
ok(editarProductoPelo(r1.estado, idProd, { nombre: '  ' }).error !== null, 'Sin dejarlo sin nombre');
ok(editarProductoPelo(r1.estado, 'noexiste', {}).error !== null, 'Y uno que no existe se rechaza');
eq(productoPelo(base(), 'noexiste'), null, 'Buscar uno que no existe devuelve null');

/* ── 4 · PRECIO (apartado 16) ───────────────────────────────────────────── */

const conPrecio = crear(base(), { nombre: 'Con precio', precio: 12 });
eq(productoPelo(conPrecio.estado, conPrecio.producto.id).precio, 12, 'Se guarda el precio');
eq(productoPelo(conPrecio.estado, conPrecio.producto.id).precioAnotado, HOY,
  '⚠️ Apartado 16: con la fecha en la que se anotó — el precio no es un dato permanente');
const cambiado = editarProductoPelo(conPrecio.estado, conPrecio.producto.id, { precio: 15 }, { hoy: '2026-12-01' }).estado;
eq(productoPelo(cambiado, conPrecio.producto.id).precioAnotado, '2026-12-01', 'Y al cambiarlo se re-sella');
eq(normalizarProducto({ nombre: 'x', precio: -5 }).precio, null, 'Un precio imposible se descarta');
eq(normalizarProducto({ nombre: 'x', precio: 'gratis' }).precio, null, 'Y uno que no es número, también');

/* ── 5 · ⚠️ ENLACES: NUNCA INVENTADOS (apartados 11, 12 y 13) ───────────── */

const sinNada = enlacesDe(soloNombre.estado, soloNombre.producto.id);
eq(sinNada.enlaces, [], '⚠️ Apartado 11: sin enlace guardado, CERO enlaces');
ok(sinNada.sinEnlaces, 'Y se sabe');
ok(sinNada.sinEnlacesTexto.length > 5, '⚠️ Y se dice, en vez de fabricar uno (regla 8)');
eq(sinNada.aviso, '', 'Sin aviso de afiliación donde no hay afiliación');

// Una URL que no es una URL no se guarda.
const conBasura = anadirTienda(r1.estado, idProd, { tipo: 'amazon', nombre: 'Amazon', url: 'no soy una url' }).estado;
eq(productoPelo(conBasura, idProd).tiendas[0].url, null, '⚠️ Una "url" que no lo es se guarda como null');
eq(enlacesDe(conBasura, idProd).enlaces, [], 'Y no genera enlace');
ok(anadirTienda(r1.estado, idProd, {}).error !== null, 'Una tienda sin nombre ni enlace se rechaza');
ok(anadirTienda(base(), 'noexiste', { nombre: 'x' }).error !== null, 'Y un producto que no existe también');

// Con una URL de verdad, dada por él.
const conEnlace = anadirTienda(r1.estado, idProd, { tipo: 'farmacia', nombre: 'Mi farmacia', url: 'https://ejemplo.test/x' }).estado;
const e1 = enlacesDe(conEnlace, idProd);
eq(e1.enlaces.length, 1, 'Con URL sí hay enlace');
eq(e1.enlaces[0].etiqueta, ETIQUETA_ENLACE, '⚠️ Apartado 12: el usuario ve siempre "Ver producto"');
eq(e1.enlaces[0].tienda, 'Mi farmacia', 'Con el nombre de la tienda');
ok(!e1.hayAfiliado, 'Sin afiliación');
eq(e1.aviso, '', '⚠️ Y sin el aviso: no hay nada que declarar');

// Apartado 12 — el aviso SOLO si hay afiliado.
const conAfiliado = anadirTienda(conEnlace, idProd, { tipo: 'amazon', nombre: 'Amazon', url: 'https://ejemplo.test/y', afiliado: true }).estado;
ok(enlacesDe(conAfiliado, idProd).hayAfiliado, 'Con afiliado se sabe');
eq(enlacesDe(conAfiliado, idProd).aviso, AVISO_AFILIACION, '⚠️ Y AHÍ sí sale el aviso de transparencia');
eq(AVISO_AFILIACION, 'Algunos enlaces pueden ser enlaces de afiliado.', 'Con la frase literal del enunciado');
eq(enlacesDe(conAfiliado, idProd).enlaces.map((x) => x.etiqueta), [ETIQUETA_ENLACE, ETIQUETA_ENLACE],
  '⚠️ Pero la etiqueta sigue siendo la misma: él no tiene que conocer la estructura técnica');

// Apartado 13 — varias tiendas, y ninguna privilegiada.
// (`conEnlace` sale de `r1.estado`, no de `conBasura`: son dos ramas distintas.)
eq(productoPelo(conAfiliado, idProd).tiendas.length, 2, 'Dos tiendas en el mismo producto');
eq(productoPelo(quitarTienda(conAfiliado, idProd, 0).estado, idProd).tiendas.length, 1, 'Y se pueden quitar');
ok(quitarTienda(base(), 'noexiste', 0).error !== null, 'De un producto que no existe, no');
eq(enlacesDe(base(), 'noexiste').enlaces, [], 'Y pedir enlaces de uno que no existe no revienta');

/* ── 6 · "YA LO TENGO", FAVORITOS Y VALORACIÓN (apartados 7, 8 y 17) ────── */

const mio = alternarMio(r1.estado, idProd).estado;
ok(productoPelo(mio, idProd).mio, 'Apartado 8: "Ya lo tengo"');
ok(!productoPelo(alternarMio(mio, idProd).estado, idProd).mio, 'Y se puede quitar');
const fav = alternarFavorito(r1.estado, idProd).estado;
ok(productoPelo(fav, idProd).favorito, 'Apartado 7: favorito');
ok(alternarMio(base(), 'noexiste').error !== null, 'De uno que no existe, no');

const valorado = valorarProducto(r1.estado, idProd, 4, 'A mí me va bien.').estado;
eq(productoPelo(valorado, idProd).valoracion, 4, 'Apartado 17: su valoración');
eq(productoPelo(valorado, idProd).opinion, 'A mí me va bien.', 'Y su opinión');
ok(valorarProducto(r1.estado, idProd, 9).error !== null, 'Una valoración fuera de 1-5 se rechaza');
ok(valorarProducto(r1.estado, idProd, 2.5).error !== null, 'Y una que no es entera');
eq(normalizarProducto({ nombre: 'x', valoracion: 0 }).valoracion, null, 'Un 0 no es una valoración');

/* ── 7 · ⚠️ APARTADO 10 — NO DISPONIBLE NO ES BORRADO ──────────────────── */

const noDisp = marcarNoDisponible(r1.estado, idProd).estado;
eq(productosPelo(noDisp).length, 1, '⚠️ Apartado 10: marcarlo no disponible NO lo borra del historial');
eq(productoPelo(noDisp, idProd).estado, 'no_disponible', 'Solo cambia su estado');
ok(estadoProducto('no_disponible').aviso, 'Y ese estado lleva aviso');
eq(auditarProductosPelo(noDisp).noDisponiblesConservados, 1, 'Se cuentan los conservados');
ok(productoPelo(marcarNoDisponible(noDisp, idProd, true).estado, idProd).estado === 'disponible', 'Y se puede revertir');

// *"Y, si existen alternativas: Ver alternativas."*
let conAlternativas = crear(noDisp, { nombre: 'Otro champú', categoria: 'champu' }).estado;
eq(alternativasDe(conAlternativas, idProd).length, 1, 'Hay una alternativa de la misma categoría');
eq(alternativasDe(conAlternativas, idProd)[0].nombre, 'Otro champú', 'Y es la correcta');
eq(alternativasDe(r1.estado, idProd), [], 'Sin otras de su categoría, ninguna');
eq(alternativasDe(soloNombre.estado, soloNombre.producto.id), [],
  'Un producto sin categoría no tiene alternativas, y no revienta');
eq(alternativasDe(base(), 'noexiste'), [], 'Ni uno que no existe');
// ⚠️ Una alternativa no disponible no es una alternativa.
eq(alternativasDe(marcarNoDisponible(conAlternativas, productosPelo(conAlternativas)[1].id).estado, idProd), [],
  '⚠️ Y una alternativa que tampoco está disponible no se ofrece');

/* ── 8 · COMPARAR (apartado 6) ─────────────────────────────────────────── */

eq(MAX_COMPARAR, 3, '⚠️ Como mucho tres: "no hacer comparaciones interminables"');
eq(FILAS_COMPARACION.map((f) => f.nombre), ['Tipo', 'Nivel', 'Precio', 'Características'],
  'Las cuatro filas que dibuja el enunciado');

const dos = crear(crear(base(), { nombre: 'A', categoria: 'hidratacion', nivel: 'basico', precio: 10 }).estado,
  { nombre: 'B', categoria: 'definicion', nivel: 'intermedio' }).estado;
const ids = productosPelo(dos).map((p) => p.id);
const comp = compararProductos(dos, ids);
ok(comp.suficiente, 'Con dos se puede comparar');
eq(comp.filas.length, 4, 'Cuatro filas');
eq(comp.filas[0].valores, ['Hidratación', 'Definición'], 'Con los tipos');
eq(comp.filas[1].valores, ['Básico', 'Intermedio'], 'Los niveles');
eq(comp.filas[2].valores, ['10 €', '—'], '⚠️ Y sin precio una raya, como en el ejemplo — no un 0');
ok(!compararProductos(dos, [ids[0]]).suficiente, 'Con uno solo no se compara');
ok(compararProductos(dos, [ids[0]]).texto.length > 10, 'Y se dice por qué');
ok(compararProductos(dos, [...ids, 'x', 'y', 'z']).productos.length <= MAX_COMPARAR,
  '⚠️ Y nunca más de tres, aunque se pidan más');
eq(compararProductos(base(), []).suficiente, false, 'Sin productos no revienta');

/* ── 9 · RECOMENDAR (apartados 4, 5 y 18) ──────────────────────────────── */

let conProductos = conPerfil();
conProductos = crear(conProductos, { nombre: 'Crema hidratante', categoria: 'hidratacion' }).estado;
conProductos = crear(conProductos, { nombre: 'Crema de rizos', categoria: 'definicion' }).estado;
conProductos = crear(conProductos, { nombre: 'Cepillo', categoria: 'accesorio' }).estado;

const rec = recomendarProductos(conProductos, {}, { limite: 3 });
ok(rec.activas, 'Las recomendaciones están activas');
eq(rec.total, 2, '⚠️ Solo los que encajan: el cepillo no');
ok(rec.recomendaciones.every((x) => x.porque.startsWith('Lo recomendamos porque')),
  '⚠️ Apartado 5: todas dicen por qué, con la fórmula del enunciado');
ok(rec.recomendaciones.every((x) => x.encaje === 'Podría encajarte'),
  '⚠️ Apartado 4: "Podría encajarte", nunca "debes comprarlo"');
ok(rec.sinIA, 'Y sin IA');

// ⚠️ Apartado 8 — lo que ya tiene no se le vuelve a recomendar.
const yaLoTiene = alternarMio(conProductos, productosPelo(conProductos)[0].id).estado;
eq(recomendarProductos(yaLoTiene, {}, { limite: 9 }).total, 1,
  '⚠️ Apartado 8: lo que ya tiene deja de recomendarse');

// Un producto no disponible tampoco se recomienda.
eq(recomendarProductos(marcarNoDisponible(conProductos, productosPelo(conProductos)[0].id).estado, {}, { limite: 9 }).total, 1,
  'Ni uno que no está disponible');

// Sin perfil no encaja nada; sin productos, se dice por qué.
eq(recomendarProductos(crear(base(), { nombre: 'X', categoria: 'champu' }).estado, {}, {}).total, 0,
  'Sin saber qué busca, ninguna recomendación');
eq(recomendarProductos(conPerfil(), {}, {}).texto, CATALOGO_VACIO_PORQUE,
  '⚠️ Y sin productos se explica, en vez de dejar un hueco');

// ⚠️ Apartado 18 — se pueden apagar, y los productos siguen.
const sinRecs = alternarParte(conProductos, PARTE_RECOMENDAR_PRODUCTOS);
ok(!recomendarProductos(sinRecs, {}, {}).activas, 'Apartado 18: se pueden desactivar');
eq(recomendarProductos(sinRecs, {}, {}).recomendaciones, [], 'Y no se muestra ninguna');
eq(recomendarProductos(sinRecs, {}, {}).productos, 3,
  '⚠️ Pero LOS PRODUCTOS SIGUEN AHÍ: es lo que dice el apartado con esas palabras');
eq(productosPelo(sinRecs).length, 3, 'Los tres');
ok(recomendarProductos(alternarParte(sinRecs, PARTE_RECOMENDAR_PRODUCTOS), {}, {}).activas, 'Y se reactivan');

/* ── 10 · PACKS (apartados 14, 15 y 19) ────────────────────────────────── */

const idsProd = productosPelo(conProductos).map((p) => p.id);
const pack = crearPack(conProductos, 'Pack hidratación', [idsProd[0], idsProd[1]], { hoy: HOY });
eq(pack.error, null, 'Crear pack');
eq(packsPelo(pack.estado).length, 1, 'Y queda guardado');
eq(verPack(pack.estado, pack.pack.id).productos.length, 2, 'Con sus dos productos');
eq(verPack(pack.estado, pack.pack.id).accion, 'Ver pack', '⚠️ Apartado 19: la acción es "Ver pack", NO "comprar"');
ok(crearPack(conProductos, '  ').error !== null, 'Un pack sin nombre se rechaza');
eq(crearPack(conProductos, 'X', ['noexiste']).pack.productoIds, [], 'Un producto que no existe no entra');

// *"El usuario puede elegir qué productos quiere."*
const menos = quitarDelPack(pack.estado, pack.pack.id, idsProd[0]).estado;
eq(verPack(menos, pack.pack.id).productos.length, 1, 'Se puede quitar uno del pack');
ok(quitarDelPack(conProductos, 'noexiste', 'x').error !== null, 'De un pack que no existe, no');
eq(packsPelo(eliminarPack(pack.estado, pack.pack.id).estado).length, 0, 'Y borrar el pack entero');
ok(eliminarPack(conProductos, 'noexiste').error !== null, 'Uno que no existe se rechaza');
eq(verPack(conProductos, 'noexiste'), null, 'Y verlo devuelve null');

// ⚠️ Borrar un producto no rompe el pack.
const sinUno = { ...pack.estado };
const menosProducto = editarProductoPelo(pack.estado, idsProd[0], { nombre: 'Sigue' }).estado;
eq(verPack(menosProducto, pack.pack.id).faltan, 0, 'Con todos los productos, no falta ninguno');

// Apartado 15 — el pack sugerido SUGIERE, no crea.
const sug = packSugerido(conProductos, {});
ok(sug.hayPack, 'Hay pack sugerido');
ok(sug.nombre.includes('Pack'), 'Con un nombre');
eq(sug.productos.length, 2, 'Y sus productos');
ok(!sug.guardado, '⚠️ Apartado 15: SUGIERE, no guarda — guardarlo es `crearPack`, y eso lo hace él');
eq(packsPelo(conProductos).length, 0, '⚠️ Y el estado no ha cambiado: sugerir no escribe');
ok(sug.texto.includes('Selecciona'), 'Y le ofrece elegir');
ok(!packSugerido(conPerfil(), {}).hayPack, 'Sin productos no hay pack que sugerir');
ok(packSugerido(conPerfil(), {}).texto.length > 10, 'Y se dice por qué');
ok(!packSugerido(sinRecs, {}).hayPack, 'Con las recomendaciones apagadas tampoco');

/* ── 11 · PERSISTENCIA Y MÓDULO APAGADO ───────────────────────────────── */

const completo = valorarProducto(anadirTienda(pack.estado, idsProd[0], { nombre: 'T', url: 'https://ejemplo.test/z' }).estado,
  idsProd[0], 5, 'Muy bien').estado;
const guardado = normalizarEstiloHombre(JSON.parse(JSON.stringify(completo)));
eq(productosPelo(guardado).length, 3, 'Los productos sobreviven al guardado');
eq(productoPelo(guardado, idsProd[0]).valoracion, 5, 'Con su valoración');
eq(productoPelo(guardado, idsProd[0]).tiendas.length, 1, 'Y sus tiendas');
eq(packsPelo(guardado).length, 1, '⚠️ Y los packs: octava vez que se enseña un campo al normalizador');
// Y la Fase 8 y la 9 siguen intactas.
const conRut = crearRutina(guardado, { nombre: 'R', pasos: [{ accion: 'lavado' }] }, { hoy: HOY }).estado;
eq(productosPelo(conRut).length, 3, '⚠️ Crear una rutina no pisa los productos: `guardarConfig` fusiona');
eq(datosPelo(conRut).rutinas.length, 1, 'Y la rutina entra');

const apagado = alternarModulo(completo, MODULO_PELO, false);
eq(productosPelo(apagado).length, 3, 'Apagar Pelo NO borra los productos (F1, apartado 7)');
eq(packsPelo(apagado).length, 1, 'Ni los packs');

// Entradas rotas.
[null, undefined, 'roto', 42, { tiendas: 'x' }, { caracteristicas: 'x' }].forEach((malo, i) => {
  const p = normalizarProducto(malo);
  ok(Array.isArray(p.tiendas) && Array.isArray(p.caracteristicas), `Producto corrupto ${i} no revienta`);
});
[null, undefined, 'roto', { productoIds: 'x' }].forEach((malo, i) => {
  ok(Array.isArray(normalizarPack(malo).productoIds), `Pack corrupto ${i} no revienta`);
});
eq(normalizarPack({ productoIds: ['a', 'a', 'b'] }).productoIds, ['a', 'b'], 'Un pack no repite productos');

/* ── 12 · RESUMEN ──────────────────────────────────────────────────────── */

const res = resumenProductosPelo(completo, {});
eq(res.total, 3, 'Tres productos');
eq(res.valorados, 1, 'Uno valorado');
eq(res.conEnlace, 1, 'Uno con enlace');
eq(res.packs, 1, 'Un pack');
eq(res.categorias, 8, 'Las ocho categorías');
eq(res.delCatalogo, 0, '⚠️ Cero del catálogo: todos son suyos (D2-03)');
eq(res.catalogo, 0, 'Y el catálogo sigue vacío');
eq(resumenProductosPelo(base(), {}).total, 0, 'Sin nada, cero — y no revienta');
ok(NIVELES_ESTILO.length === 3, 'Los niveles siguen siendo los de la Fase 6, no unos nuevos');
ok(!/const\s+NIVELES/.test(codigo), '⚠️ Y no se redefinen aquí');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
