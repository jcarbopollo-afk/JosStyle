// ============================================================================
// ENTREGA 3 · FASE 22 (BL F8) — BIBLIOTECA: INTEGRACIÓN Y EXPERIENCIA GLOBAL
//
// Los 28 puntos del criterio de éxito final y los 19 de la auditoría, y las
// cuatro cosas que decidieron cómo se construye:
//
//   1. Nada de esta capa GUARDA un dato: Recientes, la búsqueda, los favoritos
//      y los contadores se derivan de las listas que ya existen.
//   2. Recientes y Favoritos NO son una séptima mini-app.
//   3. "Hace 20 min" no se puede calcular, y no se finge.
//   4. El contador de Documentos estaba mal desde la BL F6, y esta fase existe
//      justamente para encontrar eso.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CABECERA_BIBLIOTECA, TIPOS_BIBLIOTECA, tipoBiblioteca, listaDe,
  contadores, totalElementos,
  MIN_RECIENTES, MAX_RECIENTES, PRECISION_RECIENTES, APERTURAS_NO_SE_REGISTRAN,
  cuandoDe, cuandoFue, recientes, nombreDeElemento,
  LIMITE_RESULTADOS, textoBuscableDe, buscarEnBiblioteca, resumenDeBusqueda,
  CAMPO_FAVORITO, FAVORITOS_POR_TIPO, SIN_FAVORITOS_PORQUE, NO_HAY_FAVORITOS_GLOBALES,
  esFavorito, favoritosDe,
  ACCIONES_RAPIDAS,
  NIVELES, nivel, atras, BOTON_ATRAS_DEL_MOVIL,
  ENLACES_INTERNOS, destinoDe,
  COMPONENTES_COMPARTIDOS, NUEVOS_EN_ESTA_FASE,
  CAPACIDADES_MINI_APP, auditoriaMiniApps,
  AISLAMIENTO_BIBLIOTECA, elementosSinId,
  NO_EN_BL8, condicionBiblioteca, bibliotecaTerminada, tipoDeMiniApp,
  PENDIENTE_DE_JOSUE, DONDE_SE_GUARDA_BL8,
} from '../src/lib/bibliotecaGlobal.js';
import { MINI_APPS, miniApp, elementosDe, indicadorDe, fuentesDe, normalizarBiblioteca } from '../src/lib/biblioteca.js';
import { TIPOS_ELEMENTO } from '../src/lib/colecciones.js';
import { crearGuardado } from '../src/lib/guardados.js';
import { crearLibro } from '../src/lib/libros.js';
import { crearIdea } from '../src/lib/ideas.js';
import { crearDocumento } from '../src/lib/documentos.js';
import { crearColeccion, anadirElemento } from '../src/lib/colecciones.js';
import { DEBOUNCE_BUSQUEDA_MS } from '../src/lib/rendimiento.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const soloCodigo = (s) => sinComentarios(s).replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");

const LIB = leer('src/lib/bibliotecaGlobal.js');
const LIB_CODIGO = soloCodigo(LIB);
const VISTA = leer('src/views/LibraryView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const BIBLIOTECA = leer('src/lib/biblioteca.js');

/* ── El escenario ─────────────────────────────────────────────────────────
   Algo de cada tipo, con fechas distintas y con favoritos, para que Recientes
   ordene de verdad y la búsqueda encuentre en los seis. */
const bib = {
  apuntes: [{ id: 'n1', titulo: 'Repaso biología', contenido: 'Supabase y la mitosis', fecha: '2026-09-05' }],
  enlaces: [{ ...crearGuardado({ titulo: 'MDN', url: 'https://developer.mozilla.org/' }), id: 'g1', favorito: true, fecha: '2026-09-01', actualizado: '2026-09-06' }],
  libros: [{ ...crearLibro({ titulo: 'Hábitos atómicos', autor: 'James Clear' }), id: 'l1', fecha: '2026-08-01', actualizado: '2026-08-20' }],
  ideas: [{ ...crearIdea({ titulo: 'App de rachas' }), id: 'i1', fecha: '2026-09-04', actualizado: '2026-09-04' }],
  documentos: [{ ...crearDocumento({ titulo: 'Arquitectura Supabase', contenido: 'RLS y app_data' }), id: 'd1', fecha: '2026-09-02', actualizado: '2026-09-06' }],
  colecciones: [{ ...anadirElemento(crearColeccion({ nombre: 'Estudios' }), 'nota', 'n1'), id: 'c1', favorita: true, fecha: '2026-09-03', actualizado: '2026-09-03' }],
};
const archivos = [{ id: 'a1', tipo: 'pdf', path: 'u/tema3.pdf', titulo: 'Tema 3', fecha: '2026-07-01' }];
const datos = { biblioteca: bib, archivos };
const vacio = { biblioteca: { apuntes: [], enlaces: [], libros: [], ideas: [], colecciones: [], documentos: [] }, archivos: [] };
const HOY = '2026-09-06';

console.log('\n═══ 1. ESTA FASE NO CREA UNA SÉPTIMA MINI-APP ═══\n');

eq(MINI_APPS.length, 6, '🚨 siguen siendo SEIS mini-apps: *"esta fase NO crea una nueva mini-app"*');
ok(!MINI_APPS.some((m) => /reciente|favorit|buscar/i.test(m.id)),
  '🚨 **Recientes NO es un séptimo cuadrado** (apartado 3), y Favoritos tampoco (apartado 9)');
eq(CABECERA_BIBLIOTECA.frase, 'Tu espacio personal para guardar, crear y organizar.',
  'la cabecera del enunciado, palabra por palabra');
ok(VISTA_LIMPIA.includes('CABECERA_BIBLIOTECA.frase'), '⚠️ y se lee en la pantalla');
ok(/Recientes/.test(VISTA_LIMPIA) && /Favoritos/.test(VISTA_LIMPIA),
  '⚠️ las dos secciones existen dentro de la pantalla principal');

console.log('\n═══ 2. NADA DE ESTA CAPA GUARDA UN DATO ═══\n');

ok(!/saveData|supabase|localStorage/.test(LIB_CODIGO),
  '🚨 `bibliotecaGlobal.js` no guarda nada: Recientes, la búsqueda y los favoritos **se derivan**');
ok(!/normalizar[A-Z]/.test(LIB_CODIGO),
  '⚠️ y no tiene normalizador propio, porque no tiene almacén propio (como `agendaDia.js`, E3 F7)');
ok(!/DEFAULT_/.test(LIB_CODIGO), '⚠️ ni un valor por defecto que guardar');
ok(!/crear[A-Z]|editar[A-Z]|eliminar[A-Z]/.test(LIB_CODIGO),
  '🚨 y no crea, edita ni borra ningún elemento: solo lee');
eq(DONDE_SE_GUARDA_BL8.filter((d) => d.nuevo).length, 0,
  '⚠️ y todo se guarda donde ya se guardaba: ni una clave nueva');

console.log('\n═══ 3. LOS SEIS TIPOS QUE LA BIBLIOTECA ENSEÑA ═══\n');

eq(TIPOS_BIBLIOTECA.map((t) => t.id), ['libro', 'nota', 'guardado', 'idea', 'documento', 'archivo', 'coleccion'],
  'los seis de `TIPOS_ELEMENTO` más la colección');
eq(new Set(TIPOS_BIBLIOTECA.map((t) => t.miniApp)).size, 6,
  '🚨 y caen en SEIS mini-apps: el archivo comparte techo con el documento (BL F6)');
ok(TIPOS_ELEMENTO.every((t) => TIPOS_BIBLIOTECA.some((x) => x.id === t.id)),
  '⚠️ los de `TIPOS_ELEMENTO` se DERIVAN, no se reescriben: un campo nuevo llega solo');
eq(tipoBiblioteca('coleccion').referenciable, false,
  '🚨 **una colección NO se puede meter en otra**: el "NO HACER" de la BL F7 prohíbe las anidadas');
ok(TIPOS_ELEMENTO.every((t) => tipoBiblioteca(t.id).referenciable === true),
  '⚠️ y los otros seis sí se pueden meter en una colección');
ok(!TIPOS_ELEMENTO.some((t) => t.id === 'coleccion'),
  '🚨 y `TIPOS_ELEMENTO` NO tiene colección: si la tuviera, la BL F7 permitiría anidarlas');
eq(tipoBiblioteca('inventado'), null, '⚠️ un tipo que no está no existe');

console.log('\n═══ 4. 🚨 EL CONTADOR DE DOCUMENTOS ESTABA MAL DESDE LA BL F6 ═══\n');

/* 🚨 Documentos se alimenta de DOS listas —los archivos de la Fase 11 y los
   documentos de texto de la BL F6— y `elementosDe` solo miraba la primera: con
   tres documentos escritos y un PDF, la plaquita decía "1 documento". No lo veían
   ni el build, ni el renderizado, ni las pruebas: la pantalla se pinta perfecta.
   Es justo lo que el apartado 14 de esta fase prohíbe. */
const soloTextos = { biblioteca: { ...vacio.biblioteca, documentos: [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }] }, archivos: [{ id: 'a1' }] };
eq(elementosDe('documentos', soloTextos).length, 4,
  '🚨 Documentos cuenta SUS DOS LISTAS: tres textos y un archivo son cuatro');
eq(indicadorDe('documentos', soloTextos), '4 documentos', '⚠️ y la plaquita dice cuatro');
eq(fuentesDe(miniApp('documentos')).length, 2, '⚠️ porque su línea declara `fuentes`, y son dos');
ok(MINI_APPS.filter((m) => m.id !== 'documentos').every((m) => fuentesDe(m).length === 1),
  '⚠️ y las otras cinco tienen una sola, sin repetirlo en cada línea');
ok(fuentesDe(null).length === 0, '⚠️ y sin mini-app no hay fuentes');
eq(contadores(datos).map((c) => `${c.id}:${c.n}`),
  ['libros:1', 'notas:1', 'guardados:1', 'ideas:1', 'documentos:2', 'colecciones:1'],
  '🚨 los contadores salen de datos reales (apartado 14): Documentos son 2 —un texto y un archivo—');
eq(totalElementos(datos), 7, '⚠️ y el total los suma');
eq(totalElementos(vacio), 0, '⚠️ una biblioteca vacía suma cero');

console.log('\n═══ 5. RECIENTES: DATOS REALES, ORDENADOS POR LO MODIFICADO ═══\n');

const ult = recientes(datos, MAX_RECIENTES);
eq(ult.length, MAX_RECIENTES, `se enseñan como mucho ${MAX_RECIENTES} (apartado 5)`);
ok(MIN_RECIENTES === 4 && MAX_RECIENTES === 6, '⚠️ *"mostrar inicialmente 4-6 elementos"*');
ok(ult.every((r) => !!r.elemento), '🚨 *"Recientes utilice datos reales"*: cada fila es un elemento que existe');
eq(ult[0].tipo === 'guardado' || ult[0].tipo === 'documento', true,
  '🚨 primero lo MODIFICADO más recientemente, no lo creado antes');
eq(ult.map((r) => r.tipo).includes('libro'), true,
  '⚠️ y el libro de agosto sale, pero abajo: *"no mostrar elementos antiguos simplemente porque fueron creados hace mucho"*');
ok(ult.every((r) => !!destinoDe(r.tipo, r.id)),
  '🚨 *"se pueda abrir cualquier elemento desde Recientes"*: todos tienen destino');
eq(recientes(vacio).length, 0, '⚠️ sin nada, ninguna fila — la sección no se pinta');
eq(recientes(datos, 0).length, 0, '⚠️ y un tope de cero devuelve cero');
ok(recientes(datos, 3).length === 3, '⚠️ *"no cargar toda la Biblioteca"*: se corta al tope');
ok(ult.every((r) => r.nombre && r.nombre.length > 0), '⚠️ y cada fila tiene el nombre de su mini-app');

console.log('\n═══ 6. 🚨 "HACE 20 MIN" NO SE PUEDE CALCULAR, Y NO SE FINGE ═══\n');

eq(PRECISION_RECIENTES.granularidad, 'dia',
  '🚨 las fechas de JosStyle son el DÍA, sin hora: `fechaLocalISO` no guarda la hora');
eq(PRECISION_RECIENTES.ejemploQueNoSePuede, 'hace 20 min',
  '⚠️ el ejemplo del enunciado que no se puede cumplir, dicho con sus palabras');
ok(!/min\b|minuto|hora\b/i.test(ult.map((r) => r.hace).join(' ')),
  '🚨 y NINGÚN texto de Recientes habla de minutos ni de horas: sería inventarse una precisión (regla 8)');
eq(cuandoFue('2026-09-06', HOY), 'Hoy', 'hoy se dice "Hoy"');
eq(cuandoFue('2026-09-05', HOY), 'Ayer', 'y ayer, "Ayer"');
eq(cuandoFue('2026-09-03', HOY), 'Hace 3 días', 'hasta una semana, en días');
eq(cuandoFue('2026-08-30', HOY), 'Hace 1 semana', 'de una semana a un mes, en semanas');
eq(cuandoFue('2026-07-01', HOY), 'Hace 2 meses', 'y de un mes en adelante, en meses');
eq(cuandoFue('2026-09-20', HOY), '2026-09-20',
  '🐛 y una fecha en el futuro NO se convierte en «hace -14 días»: se dice el día');
eq(cuandoFue(''), '', '⚠️ sin fecha, nada');
eq(cuandoFue(null), '', '⚠️ ni con algo que no es texto');

eq(APERTURAS_NO_SE_REGISTRAN.registrado, false,
  '🚨 **no se registra cuándo abre algo** (prioridad 3, condicionada a *"si la arquitectura lo permite"*)');
ok(APERTURAS_NO_SE_REGISTRAN.porQue.length > 40, '⚠️ y se dice por qué, no se calla');
ok(!/abierto|apertura|visto/i.test(LIB_CODIGO.replace(/APERTURAS_NO_SE_REGISTRAN/g, '')),
  '⚠️ y no hay ni una función que lo guarde');

eq(cuandoDe({ actualizado: '2026-09-06', fecha: '2026-09-01' }), '2026-09-06',
  '⚠️ manda la fecha de modificación (prioridad 1)');
eq(cuandoDe({ fecha: '2026-09-01' }), '2026-09-01', '⚠️ y si no la hay, la de creación (prioridad 2)');
eq(cuandoDe(null), '', '⚠️ y sin elemento, nada');

console.log('\n═══ 7. LA BÚSQUEDA GLOBAL, Y CUÁL DE LAS TRES TOCABA ═══\n');

/* ⚠️ El buscador global de la BI F3 indexa PANTALLAS y ACCIONES, no contenido:
   buscar «Supabase» ahí ofrece *ir a Biblioteca*, no el documento. */
const INDICE = leer('src/lib/indiceBusqueda.js');
ok(!/apuntes\.|biblioteca\.documentos|biblioteca\.libros/.test(soloCodigo(INDICE)),
  '🚨 `indiceBusqueda.js` (BI F3) NO indexa el contenido de Josué: es un buscador de navegación');
ok(!/construirIndice|indiceBusqueda/.test(LIB_CODIGO),
  '⚠️ así que esto no lo reutiliza mal ni lo duplica: es la búsqueda DENTRO de los elementos');
ok(!/const .*indice.*=.*\[\]/.test(LIB_CODIGO),
  '🚨 y **no hay índice guardado**: se quedaría viejo en cuanto él borre algo');

const r = buscarEnBiblioteca(datos, 'supabase');
eq(r.map((x) => x.tipo).sort(), ['documento', 'nota'],
  '🚨 buscar «Supabase» encuentra el documento **por su contenido** y la nota: el ejemplo literal del enunciado');
ok(r.every((x) => !!x.etiqueta), '⚠️ *"cada resultado debe indicar claramente su tipo"*');
eq(r[0].tipo, 'documento', '⚠️ y lo tocado más recientemente sale primero');
eq(buscarEnBiblioteca(datos, 'hábitos').map((x) => x.tipo), ['libro'], 'encuentra un libro por su título');
eq(buscarEnBiblioteca(datos, 'james clear').map((x) => x.tipo), ['libro'], '⚠️ y por su autor');
eq(buscarEnBiblioteca(datos, 'mozilla').map((x) => x.tipo), ['guardado'], 'un guardado por su dirección');
eq(buscarEnBiblioteca(datos, 'rachas').map((x) => x.tipo), ['idea'], 'una idea por su título');
eq(buscarEnBiblioteca(datos, 'estudios').map((x) => x.tipo), ['coleccion'], 'y una colección por su nombre');
eq(buscarEnBiblioteca(datos, 'tema 3').map((x) => x.tipo), ['archivo'], 'y un archivo de la Fase 11');
eq(buscarEnBiblioteca(datos, '').length, 0,
  '🚨 sin consulta devuelve NADA, no todo: una lista de todo no es un resultado de búsqueda');
eq(buscarEnBiblioteca(datos, '   ').length, 0, '⚠️ ni con espacios');
eq(buscarEnBiblioteca(datos, 'zzzz').length, 0, '⚠️ y lo que no está no aparece');
eq(buscarEnBiblioteca(datos, 'BIOLOGÍA').map((x) => x.tipo), ['nota'],
  '⚠️ y no distingue mayúsculas ni acentos: "BIOLOGÍA" encuentra "biología"');
eq(buscarEnBiblioteca(vacio, 'supabase').length, 0, '⚠️ en una biblioteca vacía, nada');
ok(buscarEnBiblioteca(datos, 'a', 2).length <= 2, `⚠️ y se corta al tope (${LIMITE_RESULTADOS} por defecto)`);
eq(textoBuscableDe('malo', {}), '', '⚠️ un tipo desconocido no aporta texto');

const res = resumenDeBusqueda(r);
ok(res.every((x) => x.n > 0), '⚠️ el resumen solo nombra los tipos que tienen resultados: «Libros · 0» es ruido');
eq(resumenDeBusqueda([]), [], '⚠️ y sin resultados no hay resumen');

ok(VISTA_LIMPIA.includes('DEBOUNCE_BUSQUEDA_MS'),
  `⚠️ el retardo es el de toda la aplicación (${DEBOUNCE_BUSQUEDA_MS} ms, EH F44), no un número escrito a mano`);

console.log('\n═══ 8. FAVORITOS: LOS QUE EXISTEN, Y SE DICE CUÁLES NO ═══\n');

eq(FAVORITOS_POR_TIPO.filter((f) => f.tiene).map((f) => f.tipo), ['guardado', 'documento', 'coleccion'],
  '🚨 solo TRES tipos tienen marca de favorito: Guardados, Documentos y Colecciones');
ok(!CAMPO_FAVORITO.libro,
  '🚨 **Libros NO tiene favoritos**, aunque el enunciado lo dé por hecho: su fase no se los dio');
ok(SIN_FAVORITOS_PORQUE.includes('Libros'), '⚠️ y se declara cuáles no lo tienen y por qué');
eq(NO_HAY_FAVORITOS_GLOBALES.existe, false,
  '⚠️ y esto NO es un sistema de favoritos globales: sigue sin haberlo (EH F39)');
ok(NO_EN_BL8.some((x) => /Favoritos para Libros/.test(x.que)),
  '⚠️ está en la lista de lo que esta fase no hace: *"no añadir funcionalidades nuevas"* (apartado 31)');

const favs = favoritosDe(datos);
eq(favs.map((f) => f.tipo), ['guardado', 'coleccion'], 'salen los dos favoritos del escenario');
ok(favs.every((f) => esFavorito(f.tipo, f.elemento)), '⚠️ y todos lo son de verdad');
eq(favoritosDe(vacio), [], '🚨 *"solo mostrarla si existen favoritos"*: sin ninguno, lista vacía');
eq(esFavorito('libro', { favorito: true }), false,
  '⚠️ y marcar `favorito` en un libro no cuenta: ese campo no existe en su ficha');
eq(esFavorito('guardado', null), false, '⚠️ ni sin elemento');

console.log('\n═══ 9. ACCIONES RÁPIDAS: CREAR SIN ENTRAR ANTES ═══\n');

eq(ACCIONES_RAPIDAS.length, 6, 'una por mini-app (apartado 10)');
ok(ACCIONES_RAPIDAS.every((a) => !!a.etiqueta && !!a.miniApp), '⚠️ cada una con su texto y su destino');
ok(ACCIONES_RAPIDAS.every((a) => MINI_APPS.some((m) => m.id === a.miniApp)),
  '🚨 y las seis llevan a una mini-app que existe');
ok(ACCIONES_RAPIDAS.every((a) => a.etiqueta === miniApp(a.id).vacio.boton),
  '⚠️ **y el texto es el del estado vacío de su mini-app**: no se inventa un segundo nombre para lo mismo');
ok(!/FormularioRapido|AnadirRapido/.test(VISTA_LIMPIA),
  '🚨 y NO hay seis formularios nuevos: cada acción abre el creador que ya existe (apartado 27)');

console.log('\n═══ 10. ESTADOS VACÍOS ÚTILES, CON SU ACCIÓN ═══\n');

ok(MINI_APPS.every((m) => !!m.vacio.titulo && !!m.vacio.frase && !!m.vacio.boton),
  '🚨 las seis tienen título, frase y **botón** (apartado 15)');
ok(!MINI_APPS.some((m) => /^sin datos/i.test(m.vacio.titulo)),
  '⚠️ y ninguna dice solo *"Sin datos"*, que es lo que el enunciado prohíbe');
ok(/textos y la documentación/i.test(miniApp('documentos').vacio.frase),
  '⚠️ el de Documentos se había quedado viejo en la BL F6 —decía solo PDFs, vídeos y fotos— y ya nombra los textos');
ok(MINI_APPS.every((m) => m.vacio.frase.length > 25),
  '⚠️ y todas las frases explican algo: un vacío útil, no una etiqueta');

console.log('\n═══ 11. NAVEGACIÓN, Y EL BOTÓN ATRÁS DEL MÓVIL ═══\n');

eq(NIVELES.map((x) => x.id), ['lanzador', 'miniApp', 'detalle'], 'los tres niveles del apartado 19');
eq(atras('detalle'), 'miniApp', 'del detalle se vuelve a la mini-app');
eq(atras('miniApp'), 'lanzador', 'y de la mini-app, a la Biblioteca');
eq(atras('lanzador'), 'lanzador',
  '🚨 **`atras()` NUNCA devuelve `null`** (EH F37): de la raíz se vuelve a la raíz');
eq(atras('inventado'), 'lanzador', '⚠️ y un nivel que no existe tampoco deja a nadie en el vacío');
ok(NIVELES.every((x) => !!nivel(x.id)), '⚠️ los tres se pueden consultar');

eq(BOTON_ATRAS_DEL_MOVIL.resuelto, false,
  '🚨 **el gesto de atrás del navegador NO está resuelto, y se dice** (apartado 20)');
ok(/pushState/.test(BOTON_ATRAS_DEL_MOVIL.arreglo),
  '⚠️ con el arreglo exacto escrito, para el día que se decida hacerlo');
ok(/toda la aplicación/i.test(BOTON_ATRAS_DEL_MOVIL.arreglo),
  '⚠️ y por qué no se hace solo aquí: a medias sería peor que no hacerlo');
ok(!/pushState|popstate/.test(LIB_CODIGO) && !/pushState/.test(VISTA_LIMPIA),
  '⚠️ y no se ha metido a medias en la Biblioteca');

console.log('\n═══ 12. ENLACES INTERNOS PREPARADOS, SIN INVENTAR UN ENRUTADOR ═══\n');

eq(ENLACES_INTERNOS.preparado, true, '*"la arquitectura simplemente debe quedar preparada"* (apartado 21)');
eq(ENLACES_INTERNOS.urlPublica, false, '⚠️ *"no es obligatorio crear URLs públicas"*, y no se crean');
ok(/abrirOriginal/.test(ENLACES_INTERNOS.comoSeAbre),
  '⚠️ y la pieza que lo permite es la que construyó la BL F7, no una nueva');
eq(destinoDe('documento', 'd1'), { miniApp: 'documentos', tipo: 'documento', id: 'd1' },
  'el destino de un elemento es su mini-app y su id');
eq(destinoDe('archivo', 'a1').miniApp, 'documentos', '⚠️ y un archivo lleva a Documentos, que es su mini-app');
eq(destinoDe('malo', 'x'), null, '⚠️ un tipo que no existe no tiene destino');
eq(destinoDe('nota', ''), null, '⚠️ ni un id vacío');
ok(!/createBrowserRouter|react-router/.test(LIB_CODIGO), '⚠️ y no se estrena un enrutador');

console.log('\n═══ 13. COMPONENTES COMPARTIDOS: MIRAR ANTES DE REFACTORIZAR ═══\n');

eq(COMPONENTES_COMPARTIDOS.length, 10, 'los diez que enumera el apartado 27');
ok(COMPONENTES_COMPARTIDOS.every((c) => c.compartido),
  '🚨 y los diez están compartidos: *"NO duplicar componentes equivalentes seis veces"*');
eq(NUEVOS_EN_ESTA_FASE, ['FilaDeBiblioteca', 'EtiquetaDeTipo'],
  '⚠️ solo DOS los escribe esta fase: los otros ocho ya existían, y reescribirlos sería arriesgar una regresión a cambio de nada');
for (const c of NUEVOS_EN_ESTA_FASE) {
  ok(new RegExp(`export function ${c}\\b`).test(VISTA), `⚠️ ${c} existe de verdad`);
}
ok((VISTA_LIMPIA.match(/<FilaDeBiblioteca/g) || []).length >= 3,
  '🚨 y `FilaDeBiblioteca` la usan Recientes, la búsqueda Y los favoritos: una, no tres');

console.log('\n═══ 14. LA AUDITORÍA DE LAS SEIS, CALCULADA ═══\n');

const aud = auditoriaMiniApps();
eq(aud.length, 6, 'se auditan las seis (apartado 32)');
ok(aud.every((a) => a.total >= 5), '⚠️ con las capacidades que enumera el enunciado');
eq(aud.filter((a) => !a.completa).map((a) => a.id), ['notas'],
  '🚨 y hay UNA en rojo: **una nota no se puede editar**');
eq(aud.find((a) => a.id === 'notas').faltan[0].id, 'editar',
  '⚠️ dicho con el nombre de lo que falta, no escondido');
ok(/Fase 11/.test(aud.find((a) => a.id === 'notas').faltan[0].porQue),
  '🚨 y con el motivo: la Fase 11 le dio crear, leer y borrar. Ponerla en verde sería mentir en la propia auditoría');
ok(PENDIENTE_DE_JOSUE.some((p) => /Editar una nota/.test(p.que)),
  '⚠️ y está en lo que queda pendiente de una decisión suya');
ok(Object.values(CAPACIDADES_MINI_APP).flat().filter((c) => c.fn).every((c) => !!c.modulo),
  '⚠️ cada capacidad nombra la función real y su archivo, no una casilla suelta');

console.log('\n═══ 15. AISLAMIENTO E INTEGRIDAD ═══\n');

eq(AISLAMIENTO_BIBLIOTECA.tablasPropias, 0,
  '🚨 la Biblioteca entera son dos claves de `app_data`: ni una tabla que asegurar');
eq(AISLAMIENTO_BIBLIOTECA.claves, ['biblioteca', 'bibliotecaArchivos'], '⚠️ y son esas dos');
ok(/auth\.uid\(\) = user_id/.test(AISLAMIENTO_BIBLIOTECA.politicas),
  '🚨 *"un usuario nunca debe poder acceder a la nota de otro"*: lo garantiza la base de datos (apartado 25)');
ok(!/create table|create policy/i.test(LIB), '⚠️ y esta fase no trae SQL');
eq(elementosSinId(datos), [], 'no hay elementos guardados sin id');
eq(elementosSinId({ biblioteca: { ...vacio.biblioteca, apuntes: [{ titulo: 'Sin id' }] }, archivos: [] }).length, 1,
  '⚠️ y si lo hubiera, la auditoría lo cazaría: sin `id` cada dispositivo le pondría uno distinto (EH F45)');
/* Las relaciones de una colección se van con ella porque están DENTRO (BL F7):
   no hay cascada que configurar, que es lo que pide el apartado 26. */
ok(bib.colecciones[0].elementos.length === 1 && !JSON.stringify(bib.colecciones[0]).includes('mitosis'),
  '🚨 y una colección sigue guardando referencias, no contenido: nada que duplicar (apartado 13)');

console.log('\n═══ 16. LO QUE ESTA FASE NO HACE ═══\n');

ok(NO_EN_BL8.every((x) => x.que && x.porQue), 'cada cosa que no se hace dice por qué');
for (const palabra of ['IA', 'OCR', 'Colaboración', 'etiquetas', 'anidadas', 'séptima']) {
  ok(NO_EN_BL8.some((x) => new RegExp(palabra, 'i').test(x.que)), `⚠️ ${palabra} está declarada`);
}
ok(!/askAI|ask-ai|anthropic|recomendar/i.test(LIB_CODIGO),
  '🚨 sin IA ni recomendaciones para la Biblioteca (apartado 31)');
ok(!/compartir|publico|share|colabor/i.test(LIB_CODIGO), '🚨 sin compartición ni colaboración');

console.log('\n═══ 17. LA CONDICIÓN DE FINALIZACIÓN, CALCULADA ═══\n');

const cond = condicionBiblioteca(datos);
eq(cond.length, 16, 'dieciséis casillas, una por criterio comprobable');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y las dieciséis en verde con datos de verdad');
ok(bibliotecaTerminada(datos), '🚨 **la Biblioteca queda cerrada**: *"BIBLIOTECA QUEDA CERRADA AL FINAL DE ESTA FASE"*');
ok(bibliotecaTerminada(vacio), '⚠️ y también con una biblioteca vacía: la condición es del sistema, no de sus datos');
ok(!/ok: true,/.test(LIB_CODIGO.replace(/preparado: true|compartido: true|tiene: true|referenciable: true/g, '')),
  '🚨 y ninguna casilla está puesta a `true` a mano: todas se calculan (E3 F15, EH F64)');
eq(tipoDeMiniApp('colecciones'), 'coleccion', '⚠️ cada mini-app sabe cuál es su tipo');
eq(tipoDeMiniApp('inventada'), null, '⚠️ y una que no existe, ninguno');

console.log('\n═══ 18. NADA SE HA ROTO ═══\n');

const vuelta = normalizarBiblioteca(bib);
eq(vuelta.apuntes.length, 1, 'las notas de la Fase 11 siguen ahí');
eq(vuelta.enlaces.length, 1, 'y los guardados');
eq(vuelta.libros.length, 1, 'y los libros');
eq(vuelta.ideas.length, 1, 'y las ideas');
eq(vuelta.documentos.length, 1, 'y los documentos');
eq(vuelta.colecciones[0].elementos.length, 1, 'y las relaciones de la colección');
eq(recientes({ biblioteca: vuelta, archivos }).length, MAX_RECIENTES,
  '⚠️ y Recientes sigue funcionando sobre lo normalizado');
ok(!/export function normalizarColeccion/.test(BIBLIOTECA),
  '⚠️ la mudanza de la BL F7 sigue en pie: `biblioteca.js` no fabrica colecciones');
eq(listaDe('malo', datos), [], '⚠️ y pedir la lista de un tipo que no existe no revienta');
eq(listaDe('nota', {}), [], '⚠️ ni sin datos');
eq(nombreDeElemento('coleccion', { nombre: 'Estudios' }), 'Estudios', 'una colección se llama por su nombre');
eq(nombreDeElemento('nota', bib.apuntes[0]), 'Repaso biología', '⚠️ y una nota por el suyo, el de su mini-app');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos\n`);
process.exit(fallos === 0 ? 0 : 1);
