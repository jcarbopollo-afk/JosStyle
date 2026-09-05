// ============================================================================
// ENTREGA 3 · FASE 17 (BL F2) — BIBLIOTECA: LIBROS
//
// Los 22 puntos de la condición de éxito, y las tres cosas que el enunciado
// prohíbe hacer con los datos: **nunca más de un 100 %**, **nunca borrar
// información de lectura anterior** y **nunca borrar los terminados**.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ESTADOS_LIBRO, estadoLibro, ESTADO_POR_DEFECTO, CAMPOS_LIBRO,
  tituloDeLibroValido, paginasValidas, MAX_PAGINAS,
  crearLibro, normalizarLibro, editarLibro,
  progresoDe, textoProgreso, actualizarPagina, cambiarEstado, marcarTerminado,
  resumenLibros, lineaResumen, libroActual,
  FILTROS_LIBROS, ORDENES_LIBROS, ordenLibros, filtrarLibros, ordenarLibros,
  estadisticasLectura, historialLectura,
  ALMACEN_PORTADAS, TIPOS_PORTADA, MAX_PORTADA_MB, revisarPortada, inicialesDe,
  NO_EN_LIBROS, NOTA_ES_DEL_LIBRO,
} from '../src/lib/libros.js';
import { crearLibro as crearLibroDesdeBiblioteca, normalizarBiblioteca, miniApp } from '../src/lib/biblioteca.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const LIB = leer('src/lib/libros.js');
const VISTA = leer('src/views/LibraryView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const APP = sinComentarios(leer('src/App.jsx'));

const hoy = new Date().toLocaleDateString('sv-SE');
const libro = (extra = {}) => ({ ...crearLibro({ titulo: 'Hábitos atómicos', autor: 'James Clear', totalPaginas: 250 }), ...extra });

console.log('\n═══ 1. LOS CUATRO ESTADOS (criterio 4) ═══\n');

eq(ESTADOS_LIBRO.map((e) => e.id), ['por_leer', 'leyendo', 'terminado', 'pausado'],
  '🚨 los cuatro del enunciado');
ok(ESTADOS_LIBRO.every((e) => e.nombre && e.icono && e.que),
  '🚨 y cada uno con su NOMBRE, no solo su icono: el color y el dibujo nunca van solos (EH F42)');
eq(ESTADO_POR_DEFECTO, 'por_leer', '⚠️ un libro nuevo nace por leer');
eq(estadoLibro('inventado'), null, 'un estado que no existe no se inventa');

console.log('\n═══ 2. EL MODELO, Y LO QUE NO SE GUARDA ═══\n');

const nuevo = crearLibro({ titulo: '  Hábitos atómicos  ', autor: ' James Clear ' });
eq(Object.keys(nuevo).sort(), [...CAMPOS_LIBRO].sort(), '⚠️ un libro tiene exactamente sus doce campos');
eq([nuevo.titulo, nuevo.autor], ['Hábitos atómicos', 'James Clear'], '⚠️ sin espacios de sobra');
ok(!('user_id' in nuevo) && !/user_id/.test(sinComentarios(LIB)),
  '🚨 el `user_id` NO se guarda dentro del libro: el aislamiento es de `app_data`, y una copia puede mentir (EH F43)');
ok(!('porcentaje' in nuevo),
  '🚨 y el porcentaje TAMPOCO se guarda: se deriva, o mentiría en cuanto él corrija las páginas');
eq(crearLibro({ titulo: '   ' }), null, '🚨 sin título no se crea nada (título obligatorio, el resto opcional)');
eq(crearLibro(), null, 'y sin nada tampoco');
ok(!tituloDeLibroValido('x'.repeat(201)), '⚠️ ni un título imposible de largo');

// 🚨 Una sola fábrica en todo el proyecto.
eq(crearLibroDesdeBiblioteca, crearLibro,
  '🚨 `biblioteca.js` REEXPORTA la fábrica de `libros.js`: no hay dos formas del mismo libro conviviendo');
ok(!/^export function crearLibro/m.test(leer('src/lib/biblioteca.js')),
  '⚠️ y no la redefine');

console.log('\n═══ 3. `null` NO ES CERO ═══\n');

eq(paginasValidas(null), null, '🚨 "no sé cuántas páginas tiene" es `null`');
eq(paginasValidas(''), null, 'y un campo vacío también');
eq(paginasValidas(0), null, '⚠️ cero páginas no es un libro: es un dato mal puesto');
eq(paginasValidas(-5), null, 'ni un número negativo');
eq(paginasValidas(2.5), null, 'ni medio');
eq(paginasValidas(MAX_PAGINAS + 1), null, 'ni uno imposible');
eq(paginasValidas('250'), 250, '⚠️ y un número escrito como texto sí vale: es lo que devuelve un `<input>`');

console.log('\n═══ 4. EL PROGRESO SE CALCULA, Y NUNCA PASA DEL 100 % (criterios 5 y 6) ═══\n');

eq(progresoDe(libro({ paginaActual: 180 })), { paginas: 180, total: 250, porcentaje: 72 },
  '⚠️ 180 de 250 son el 72 %');
eq(progresoDe(crearLibro({ titulo: 'Sin páginas' })), null,
  '🚨 SIN TOTAL NO HAY PORCENTAJE, y devuelve `null`: un 0 % diría que no ha leído nada de un libro que no sabemos cuánto mide');
eq(progresoDe(libro({ paginaActual: null })).porcentaje, 0,
  '⚠️ pero con total y sin página empezada sí es un 0 % de verdad');
eq(crearLibro({ titulo: 'X', totalPaginas: 100, paginaActual: 500 }).paginaActual, 100,
  '🚨 LA PÁGINA NUNCA PASA DEL TOTAL: *"nunca permitir visualmente más de 100 %"*, y se cumple en el DATO');
eq(progresoDe(actualizarPagina(libro(), 9999)).porcentaje, 100, '⚠️ ni actualizándola a mano');
eq(actualizarPagina(libro({ paginaActual: 10 }), 'ochenta').paginaActual, 10,
  '⚠️ y un valor que no es un número no borra la página que tenía');
eq(textoProgreso(libro({ paginaActual: 180 })), '180 / 250 páginas · 72 %', '⚠️ y su texto');
eq(textoProgreso(crearLibro({ titulo: 'X' })), null, 'sin total, ningún texto');

console.log('\n═══ 5. TERMINAR UN LIBRO (criterios 7 y 8) ═══\n');

const terminado = marcarTerminado(libro({ paginaActual: 180, inicio: '2026-08-01' }));
eq(terminado.estado, 'terminado', '⚠️ el estado cambia');
eq(progresoDe(terminado).porcentaje, 100, '⚠️ y el progreso llega al 100 %');
eq(terminado.fin, hoy, '⚠️ con la fecha de finalización de hoy');
eq(terminado.inicio, '2026-08-01',
  '🚨 Y NO SE BORRA LA INFORMACIÓN ANTERIOR: la fecha de inicio sigue ahí');
eq(marcarTerminado(libro({ fin: '2026-01-01' })).fin, '2026-01-01',
  '⚠️ y una fecha de fin que ya tenía NO se pisa: *"hoy si está vacía"*');
eq(progresoDe(marcarTerminado(crearLibro({ titulo: 'Sin páginas' }))), null,
  '🚨 un libro sin páginas se termina igual, SIN inventarle un total para llegar al 100 %');
eq(marcarTerminado(null), null, 'y sin libro no revienta');

// 🚨 Y volver atrás no borra el historial.
const reabierto = cambiarEstado(terminado, 'leyendo');
eq(reabierto.fin, hoy,
  '🚨 sacarlo de Terminado NO borra la fecha de fin: *"no borrar información de lectura anterior"*');
eq(reabierto.estado, 'leyendo', 'aunque el estado sí cambia');

console.log('\n═══ 6. CAMBIAR DE ESTADO ═══\n');

eq(cambiarEstado(crearLibro({ titulo: 'X' }), 'leyendo').inicio, hoy,
  '⚠️ empezar un libro pone su fecha de inicio');
eq(cambiarEstado(libro({ inicio: '2026-05-05' }), 'leyendo').inicio, '2026-05-05',
  '🚨 y volver a él después de una pausa NO la reescribe: no empezó hoy');
eq(cambiarEstado(crearLibro({ titulo: 'X' }), 'pausado').inicio, null,
  '⚠️ y pausar no inventa una fecha de inicio que no hubo');
eq(cambiarEstado(crearLibro({ titulo: 'X' }), 'terminado').estado, 'terminado',
  '⚠️ pasar a Terminado hace lo mismo que el botón de terminar: una sola función');
const sinCambio = crearLibro({ titulo: 'X' });
eq(cambiarEstado(sinCambio, 'inventado'), sinCambio, 'un estado que no existe no cambia nada');
eq(crearLibro({ titulo: 'X', estado: 'por_leer' }).inicio, null,
  '⚠️ y un libro creado como *Por leer* no tiene fecha de inicio');
eq(crearLibro({ titulo: 'X', estado: 'leyendo' }).inicio, hoy,
  '⚠️ mientras que uno creado ya empezado sí');

console.log('\n═══ 7. EDITAR Y ELIMINAR (criterios 2 y 3) ═══\n');

const base = libro({ nota: 'Buen capítulo 4' });
const editado = editarLibro(base, { autor: 'J. Clear', totalPaginas: 300 });
eq([editado.autor, editado.totalPaginas], ['J. Clear', 300], '⚠️ se cambia lo que llega');
eq([editado.id, editado.nota, editado.fecha], [base.id, base.nota, base.fecha],
  '🚨 y lo que NO llega se conserva: el id, la nota y la fecha de creación');
eq(editarLibro(base, { titulo: '   ' }).titulo, base.titulo,
  '🚨 un título en blanco NO borra el libro: se queda como estaba');
eq(editarLibro(null, {}), null, 'y sin libro no revienta');

ok(Boolean(CATALOGO_PAPELERA['biblioteca.libros']),
  '🚨 eliminar un libro lo manda a Eliminados recientemente, y vuelve');
ok(/eliminarConPapelera\('biblioteca', 'libros'/.test(APP),
  '⚠️ por la única puerta que hay, con los nombres literales que busca la auditoría de ME F4');
ok(/onBorrarPortada/.test(APP) && /deleteBibliotecaArchivo\(path\)/.test(APP),
  '⚠️ y su portada se borra del almacenamiento: dejarla sería un archivo huérfano ocupando sitio para siempre');

console.log('\n═══ 8. EL RESUMEN Y "CONTINUAR LEYENDO" (criterios 14 y 15) ═══\n');

const coleccion = [
  { ...libro({ paginaActual: 180 }), id: 'a', estado: 'leyendo', actualizado: '2026-09-01' },
  { ...libro({ paginaActual: 20 }), id: 'b', estado: 'leyendo', actualizado: '2026-09-04' },
  { ...crearLibro({ titulo: 'Pendiente' }), id: 'c', actualizado: '2026-08-10' },
  { ...libro({ paginaActual: 250, inicio: '2026-08-01', fin: '2026-08-20' }), id: 'd', estado: 'terminado', actualizado: '2026-08-20' },
  { ...crearLibro({ titulo: 'En pausa' }), id: 'e', estado: 'pausado', actualizado: '2026-07-01' },
];
/* ⚠️ Los cinco llevan su `actualizado` escrito. La primera versión solo se lo puso
   a dos, y los otros tres —creados hoy— salían los primeros al ordenar por
   recientes: la prueba fallaba con un código que estaba bien. Van quince veces. */

eq(resumenLibros(coleccion), { total: 5, leyendo: 2, porLeer: 1, terminados: 1, pausados: 1 },
  '🚨 los números salen de los datos de verdad');
eq(lineaResumen(coleccion), '2 leyendo · 1 pendiente · 1 terminado · 1 pausado',
  '⚠️ y la línea del enunciado, con sus singulares y sus plurales');
eq(lineaResumen([]), null, '🚨 sin ni un libro NO hay línea: *"no inventar números"*');

eq(libroActual(coleccion).id, 'b',
  '🚨 "Continuar leyendo" es el que tocó más recientemente, derivado de `actualizado`');
eq(libroActual([{ ...crearLibro({ titulo: 'X' }), estado: 'por_leer' }]), null,
  '🚨 sin ninguno leyendo devuelve `null`, no un hueco: la tarjeta entonces no existe (EH F25)');
eq(libroActual([]), null, 'y con la lista vacía tampoco');

console.log('\n═══ 9. FILTROS, BÚSQUEDA Y ORDEN (criterios 10, 11 y 12) ═══\n');

eq(FILTROS_LIBROS.map((f) => f.id), ['todos', 'por_leer', 'leyendo', 'terminado', 'pausado'],
  '⚠️ los filtros salen de `ESTADOS_LIBRO`: renombrar un estado renombra su pastilla sola');
eq(filtrarLibros(coleccion, { estado: 'leyendo' }).length, 2, '⚠️ filtrar por estado');
eq(filtrarLibros(coleccion, { estado: 'todos' }).length, 5, 'y "todos" no filtra');
eq(filtrarLibros(coleccion, { texto: 'clear' }).map((l) => l.id), ['a', 'b', 'd'],
  '⚠️ la búsqueda mira el AUTOR además del título, y no distingue mayúsculas');
eq(filtrarLibros(coleccion, { texto: 'habitos' }).length, 3,
  '🚨 y tampoco los acentos: buscar "habitos" encuentra "Hábitos" — nadie escribe tildes en el móvil');
eq(filtrarLibros(coleccion, { estado: 'leyendo', texto: 'pendiente' }).length, 0,
  '⚠️ y los dos se combinan');

eq(ORDENES_LIBROS.map((o) => o.id), ['recientes', 'titulo', 'autor', 'progreso'], '⚠️ los cuatro órdenes');
eq(ordenLibros('inventado'), null, 'uno que no existe no se inventa');
eq(ordenarLibros(coleccion, 'titulo')[0].titulo, 'En pausa', '⚠️ por título');
eq(ordenarLibros(coleccion, 'progreso')[0].id, 'd', '⚠️ por progreso, el más avanzado primero');
eq(ordenarLibros(coleccion, 'recientes')[0].id, 'b', '⚠️ y por recientes, el último tocado');
const conYSinAutor = ordenarLibros(coleccion, 'autor');
eq(conYSinAutor.at(-1).autor, '',
  '🚨 ordenando por autor, los que NO tienen autor van al FINAL: la cadena vacía ordena antes que cualquier letra y llenaría la cabeza de la lista');
ok(ordenarLibros(coleccion, 'titulo') !== coleccion, '⚠️ y ordenar no modifica la lista que recibe');

console.log('\n═══ 10. ESTADÍSTICAS E HISTORIAL (criterios 13 y 15) ═══\n');

const stats = estadisticasLectura(coleccion);
eq(stats.paginasLeidas, 450, '⚠️ las páginas leídas suman las de los libros que las tienen');
eq(stats.sinContar, 2,
  '🚨 y SE DICE cuántos quedan fuera: estimar las páginas de un libro que no las tiene sería inventar un dato');
eq(stats.terminados, 1, '⚠️ y los terminados');
eq(stats.diasDeLectura, 20, '⚠️ los días salen de las dos fechas del único libro que las tiene');
eq(estadisticasLectura([{ ...crearLibro({ titulo: 'X' }), estado: 'terminado' }]).diasDeLectura, null,
  '🚨 sin las dos fechas NO hay días: `null`, no un cero');
eq(estadisticasLectura([]).paginasLeidas, 0, 'y sin libros, cero páginas');

eq(historialLectura(coleccion).map((l) => l.id), ['d'], '⚠️ el historial son los terminados');
ok(!/function .*(borrarTerminados|limpiarHistorial|purgar)/.test(LIB),
  '🚨 y NO HAY ninguna función que los borre: *"no borrar los libros terminados automáticamente"* se cumple no teniendo cómo');

console.log('\n═══ 11. LAS PORTADAS: EL ALMACENAMIENTO QUE YA EXISTE (criterio 16) ═══\n');

eq(ALMACEN_PORTADAS.bucket, 'biblioteca',
  '🚨 las portadas van al bucket de la Fase 11: *"no crear otro sistema de almacenamiento"*');
eq(ALMACEN_PORTADAS.nuevo, false, '⚠️ y ni un bloque de SQL que Josué tenga que ejecutar');
ok(/uploadBibliotecaArchivo/.test(APP) && /subirPortadaLibro/.test(APP),
  '⚠️ y App.jsx lo usa de verdad');
eq(normalizarLibro({ titulo: 'X', portada: 'u/1.jpg' }).portada, 'u/1.jpg', '⚠️ se guarda el CAMINO');
ok(!/signedUrl|createSignedUrl/.test(LIB),
  '🚨 nunca la URL firmada: caduca en una hora, así que guardarla sería guardar algo que deja de funcionar mientras él duerme');
eq(revisarPortada(null), 'Elige una imagen para la portada.', '⚠️ sin archivo se dice qué hacer');
ok(/imagen/.test(revisarPortada({ type: 'application/pdf', size: 10 })),
  '⚠️ un PDF no es una portada, y el aviso dice QUÉ corregir, nunca "Error" (EH F62)');
ok(/MB/.test(revisarPortada({ type: 'image/jpeg', size: (MAX_PORTADA_MB + 1) * 1024 * 1024 })),
  '⚠️ y una imagen enorme también');
eq(revisarPortada({ type: 'image/jpeg', size: 1000 }), null, 'una imagen normal pasa');
ok(TIPOS_PORTADA.includes('image/heic'),
  '🚨 incluido HEIC: es el formato con el que hace las fotos el iPhone de Josué');
eq(inicialesDe({ titulo: 'Hábitos atómicos' }), 'HA',
  '⚠️ y sin portada se dibujan sus iniciales — un dato de verdad, no una imagen inventada');
eq(inicialesDe({ titulo: '' }), '', 'sin título, ninguna');

console.log('\n═══ 12. EL NORMALIZADOR (regla 5) ═══\n');

eq(normalizarLibro({ titulo: 'X', totalPaginas: 100, paginaActual: 900 }).paginaActual, 100,
  '🚨 lo guardado también se acota: un dato viejo fuera de rango no puede pintar un 900 %');
eq(normalizarLibro({ titulo: 'X', estado: 'inventado' }).estado, 'por_leer',
  '⚠️ un estado que ya no existe vuelve al de por defecto');
eq(normalizarLibro({ titulo: 'X', inicio: '2026-13-45' }).inicio, null,
  '🚨 y una fecha imposible se descarta: `2026-13-45` encaja con la forma y no existe (E3 F9)');
ok(normalizarLibro({ titulo: 'X' }).id, '⚠️ un libro guardado sin id recibe uno (EH F45)');
eq(normalizarLibro({ autor: 'Nadie' }), null, '⚠️ y uno sin título se descarta');
eq(normalizarLibro('no soy un libro'), null, 'lo que no es un objeto tampoco pasa');

// 🚨 Y el normalizador de la Biblioteca tiene que usar ÉSTE, no el mínimo de la F1.
const guardado = normalizarBiblioteca({ libros: [{ titulo: 'X', totalPaginas: 100, paginaActual: 900, estado: 'leyendo' }] });
eq(guardado.libros[0].paginaActual, 100,
  '🚨 `normalizarBiblioteca` usa el normalizador COMPLETO: si no, los campos nuevos se perderían en el siguiente guardado');
eq(guardado.libros[0].estado, 'leyendo', '⚠️ y conserva el estado');

console.log('\n═══ 13. LA PANTALLA ═══\n');

ok(/PantallaLibros/.test(VISTA_LIMPIA) && /ContinuarLeyendo/.test(VISTA_LIMPIA) && /DetalleLibro/.test(VISTA_LIMPIA),
  '⚠️ la pantalla, la tarjeta destacada y el detalle existen');
ok(/createPortal\(contenido, document\.body\)/.test(VISTA_LIMPIA),
  '🚨 y el detalle sale por `createPortal` (regla 3): sin él aparece "abajo del todo"');
ok(/role="dialog"/.test(VISTA_LIMPIA) && /aria-label="Cerrar el detalle del libro"/.test(VISTA_LIMPIA),
  '⚠️ con su papel y su botón de cerrar con nombre');
ok(/grid-cols-2/.test(VISTA_LIMPIA), '⚠️ dos columnas en móvil (criterio 19)');
ok(/onUpdateLibro/.test(APP) && /const updateLibro =/.test(APP),
  '🚨 y `updateLibro` existe **y App.jsx se la pasa**: una función que nadie llama no falla nunca');
ok(/FormularioLibro/.test(VISTA_LIMPIA) && !/function AnadirLibro/.test(VISTA),
  '⚠️ un solo formulario para crear y editar: dos serían dos sitios donde arreglar el mismo fallo');
ok(/celebracion-libro/.test(VISTA_LIMPIA) && /\.celebracion-libro/.test(leer('src/index.css')),
  '🚨 la animación de terminar EXISTE en el CSS: una clase declarada y no escrita no pinta nada (E3 F14)');
ok(/progreso-libro/.test(VISTA_LIMPIA) && /\.progreso-libro/.test(leer('src/index.css')),
  '⚠️ y la de la barra de progreso también');

console.log('\n═══ 14. LO QUE ESTA FASE NO HACE ═══\n');

ok(NO_EN_LIBROS.length >= 5 && NO_EN_LIBROS.every((x) => x.que && x.llega),
  '⚠️ cada cosa aplazada dice dónde llega');
ok(NO_EN_LIBROS.some((x) => /ISBN/.test(x.que)), '🚨 sin escáner de ISBN');
ok(NO_EN_LIBROS.some((x) => /IA/.test(x.que)), '🚨 sin recomendaciones con IA');
ok(!/askAI|ask-ai/i.test(sinComentarios(LIB)), '🚨 y la librería no llama a la IA por ningún sitio');
ok(!/googleapis|openlibrary|goodreads/i.test(LIB), '🚨 ni a ningún servicio externo de libros');
eq(NOTA_ES_DEL_LIBRO.campo, 'nota',
  '⚠️ la nota es DEL LIBRO, no de la mini-app Notas: *"estas notas pertenecen al libro"*');
ok(!/apuntes/.test(sinComentarios(LIB)),
  '🚨 y no escribe nada en `biblioteca.apuntes`: el sistema global de Notas es de otra fase');
eq(miniApp('libros').fase, 'BL F2', '⚠️ y el catálogo del lanzador ya decía que ésta era su fase');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
