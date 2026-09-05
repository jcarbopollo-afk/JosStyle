// ============================================================================
// ENTREGA 3 · FASE 16 (BL F1) — LA BIBLIOTECA COMO LANZADOR DE MINI-APPS
//
// 🚨 **La comprobación más importante de esta fase no es visual: es que NO se ha
// creado una lista nueva para algo que ya existía.** Tres de las seis mini-apps
// —Notas, Guardados y Documentos— son `apuntes`, `enlaces` y `bibliotecaArchivos`
// de la Fase 11 con su nombre puesto. Crear `notas` al lado de `apuntes` habría
// dejado los apuntes de Josué invisibles en su propia biblioteca.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MINI_APPS, miniApp, MAPEO_EXISTENTE, mapeoDe, COLECCIONES_NUEVAS,
  DIFERENCIAS, diferenciaDe,
  tituloValido, MAX_TITULO, crearLibro, crearIdea, crearColeccion,
  normalizarLibro, normalizarIdea, normalizarColeccion, normalizarBiblioteca,
  elementosDe, contarMiniApp, indicadorDe, totalBiblioteca,
  RETRASO_CASCADA_MS, CLASE_TARJETA, retrasoDeTarjeta,
  NO_EN_ESTA_FASE, DONDE_SE_GUARDA, AISLAMIENTO,
} from '../src/lib/biblioteca.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { DEFAULT_BIBLIOTECA } from '../src/tokens.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

/** ⚠️ Una prueba que busca USOS quita los comentarios; una que busca DEFINICIONES
 *  mira el archivo en bruto (EH F39). Aquí se buscan usos. */
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const VISTA = leer('src/views/LibraryView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const APP = sinComentarios(leer('src/App.jsx'));
const LIB = leer('src/lib/biblioteca.js');

console.log('\n═══ 1. EXACTAMENTE SEIS MINI-APPS (criterio de éxito 2) ═══\n');

eq(MINI_APPS.map((m) => m.id), ['libros', 'notas', 'guardados', 'ideas', 'documentos', 'colecciones'],
  '🚨 las seis del enunciado, en su orden');
ok(MINI_APPS.every((m) => m.nombre && m.descripcion && m.icono && m.coleccion),
  '⚠️ cada una con nombre, descripción corta, icono y de dónde salen sus elementos');
ok(MINI_APPS.every((m) => m.descripcion.length <= 40),
  '⚠️ y la descripción es CORTA: *"no queremos una parrafada"* (criterio 14)');
eq(miniApp('inventada'), null, 'una mini-app que no existe no se inventa');

// 🚨 El enunciado: *"no utilizar emojis gigantes como diseño definitivo… utilizar
// la librería de iconos existente del proyecto, por ejemplo Lucide"*.
ok(MINI_APPS.every((m) => /^[A-Z][A-Za-z]+$/.test(m.icono)),
  '🚨 el icono es un componente de Lucide, no un emoji (iconografía, apartado propio)');
ok(MINI_APPS.every((m) => VISTA_LIMPIA.includes(`import`) && new RegExp(`\\b${m.icono}\\b`).test(VISTA_LIMPIA)),
  '🚨 y los seis están IMPORTADOS en la vista: un icono que falta sale como un hueco y no falla en ninguna parte');
ok(/ICONOS_MINI_APP\s*=\s*\{/.test(VISTA),
  '⚠️ con su mapa de componentes aparte del catálogo de datos, como `ICONOS_CATEGORIA` en el Armario');

console.log('\n═══ 2. 🚨 TRES YA EXISTÍAN, Y NO SE HAN DUPLICADO (criterio 15) ═══\n');

eq(MAPEO_EXISTENTE.map((m) => m.miniApp), ['notas', 'guardados', 'documentos'],
  '🚨 las tres que ya tenían datos de Josué, declaradas');
ok(MAPEO_EXISTENTE.every((m) => m.donde && m.desde && m.porque),
  '⚠️ cada una dice dónde vivía, desde cuándo y por qué es la misma cosa');
eq(mapeoDe('notas').donde, 'biblioteca.apuntes',
  '🚨 una nota ES un apunte de la Fase 11');
eq(mapeoDe('guardados').donde, 'biblioteca.enlaces',
  '🚨 un guardado ES un enlace de la Fase 11');
eq(mapeoDe('documentos').donde, 'bibliotecaArchivos',
  '🚨 un documento ES un archivo ya subido: *"tu archivo personal"*');
eq(mapeoDe('libros'), null, 'y las nuevas no fingen tener un antecedente');

eq(miniApp('notas').coleccion, 'apuntes', '⚠️ y el catálogo apunta a la colección DE VERDAD, no a una nueva');
eq(miniApp('guardados').coleccion, 'enlaces', '⚠️ igual con los guardados');

// 🚨 La comprobación que caza el duplicado si una fase futura lo intenta.
ok(!/['"]notas['"]\s*:\s*\[/.test(LIB) && !Object.keys(DEFAULT_BIBLIOTECA).includes('notas'),
  '🚨 NO existe una lista `notas` al lado de `apuntes`: eso dejaría los apuntes de Josué invisibles');
ok(!Object.keys(DEFAULT_BIBLIOTECA).includes('guardados') && !Object.keys(DEFAULT_BIBLIOTECA).includes('documentos'),
  '🚨 ni `guardados` al lado de `enlaces`, ni `documentos` al lado de los archivos');

eq(COLECCIONES_NUEVAS, ['libros', 'ideas', 'colecciones'],
  '⚠️ solo TRES listas nuevas, que son las tres que no existían');
eq(Object.keys(DEFAULT_BIBLIOTECA).sort(), ['apuntes', 'colecciones', 'enlaces', 'ideas', 'libros'],
  '⚠️ y el valor por defecto tiene exactamente esas cinco (los archivos van en su propia clave)');

console.log('\n═══ 3. EN QUÉ SE DIFERENCIAN, DICHO EN LA PANTALLA (criterios 11, 12 y 13) ═══\n');

eq(DIFERENCIAS.length, 3, 'las tres parejas que el enunciado separa');
ok(DIFERENCIAS.every((d) => d.entre.length === 2 && d.a && d.b), '⚠️ cada una con su frase por lado');
eq(diferenciaDe('notas').length, 2, '⚠️ Notas se diferencia de Documentos Y de Ideas');
ok(/rápid|escribe|guarda/i.test(diferenciaDe('notas')[0]), '⚠️ y la de Notas habla de rapidez');
ok(/desarrollar/i.test(diferenciaDe('ideas')[0]), '⚠️ la de Ideas, de desarrollar algo');
ok(/agrupa/i.test(diferenciaDe('colecciones')[0]), '⚠️ y la de Colecciones, de agrupar');
eq(diferenciaDe('libros'), [], 'y la que no tiene pareja no inventa una');
ok(/diferenciaDe\(/.test(VISTA_LIMPIA), '🚨 y la pantalla las ENSEÑA: no se quedan en el código');

console.log('\n═══ 4. EL ESTADO VACÍO DE CADA UNA ═══\n');

ok(MINI_APPS.every((m) => m.vacio.titulo && m.vacio.frase && m.vacio.boton),
  '🚨 las seis tienen título, frase y salida: *"no dejar pantallas vacías sin contexto"*');
eq(miniApp('notas').vacio.titulo, 'Tu espacio para pensar', '⚠️ el de Notas es el del enunciado, literal');
eq(miniApp('libros').vacio.titulo, 'Tu biblioteca empieza aquí', '⚠️ y el de Libros también');
ok(MINI_APPS.every((m) => !/próximamente|pronto|en construcción/i.test(JSON.stringify(m.vacio))),
  '🚨 y ninguno promete algo que no existe (regla 8)');

console.log('\n═══ 5. LOS INDICADORES NO SE INVENTAN ═══\n');

const datos = {
  biblioteca: {
    apuntes: [{ id: 'a1' }, { id: 'a2' }],
    enlaces: [{ id: 'e1' }],
    libros: [], ideas: [], colecciones: [],
  },
  archivos: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }],
};

eq(contarMiniApp('notas', datos), 2, '⚠️ Notas cuenta los apuntes de verdad');
eq(contarMiniApp('documentos', datos), 3, '⚠️ Documentos cuenta los archivos de verdad');
eq(indicadorDe('notas', datos), '2 notas', '⚠️ y el indicador va en plural');
eq(indicadorDe('guardados', datos), '1 guardado', '⚠️ y en singular cuando toca');
eq(indicadorDe('libros', datos), null,
  '🚨 una mini-app vacía NO tiene indicador: *"no inventar números. Solo mostrar datos reales cuando existan"*');
eq(indicadorDe('inventada', datos), null, 'y una que no existe tampoco');
eq(totalBiblioteca(datos), 6, '⚠️ el total suma las seis, no tres');
eq(elementosDe('notas', {}), [], 'sin datos, ninguna lista revienta');
eq(elementosDe('notas', { biblioteca: { apuntes: 'no soy un array' } }), [],
  '⚠️ y algo guardado que no es una lista se trata como vacío');

console.log('\n═══ 6. EL BOTÓN DE CREAR ESCRIBE ALGO DE VERDAD (regla 8) ═══\n');

ok(tituloValido('Hábitos atómicos'), 'un título con algo escrito vale');
ok(!tituloValido('   '), '⚠️ uno en blanco no');
ok(!tituloValido(''), 'ni vacío');
ok(!tituloValido(null) && !tituloValido(42), 'ni algo que no es texto');
ok(!tituloValido('x'.repeat(MAX_TITULO + 1)), `⚠️ ni uno de más de ${MAX_TITULO} caracteres`);

const libro = crearLibro({ titulo: '  Hábitos atómicos  ', autor: ' James Clear ' });
eq([libro.titulo, libro.autor], ['Hábitos atómicos', 'James Clear'], '⚠️ un libro se guarda sin espacios de sobra');
ok(libro.id && /^\d{4}-\d{2}-\d{2}$/.test(libro.fecha), '⚠️ con su id y su fecha local');
eq(crearLibro({ titulo: '  ' }), null, '🚨 y sin título no se crea nada: el formulario no guarda un libro en blanco');
eq(crearIdea({ titulo: 'Crear una app', detalle: 'que automatice X' }).detalle, 'que automatice X', '⚠️ una idea guarda su desarrollo');
eq(crearIdea({ titulo: '' }), null, 'y sin idea no hay idea');
eq(crearColeccion({ nombre: 'Aprender programación' }).nombre, 'Aprender programación', '⚠️ una colección guarda su nombre');
eq(crearColeccion({ nombre: '' }), null, 'y sin nombre tampoco');
ok(crearLibro({ titulo: 'A' }).id !== crearLibro({ titulo: 'A' }).id, '⚠️ dos elementos nunca comparten id');

// 🚨 Los seis botones tienen que estar CONECTADOS: la lección de siempre.
for (const nombre of ['addLibro', 'deleteLibro', 'addIdea', 'deleteIdea', 'addColeccion', 'deleteColeccion']) {
  ok(new RegExp(`const ${nombre} =`).test(APP) && new RegExp(`\\{${nombre}\\}`).test(APP),
    `🚨 \`${nombre}\` existe **y App.jsx se la pasa a la vista**: una función que nadie llama no falla nunca`);
}

console.log('\n═══ 7. 🚨 EL FALLO QUE ESTA FASE ENCONTRÓ ═══\n');

// Desde la E3 F6, `case 'biblioteca'` pasaba los apuntes de Productividad.
ok(!/onAddApunte=\{addApunteDelDia\}[\s\S]{0,400}LibraryView|LibraryView[\s\S]{0,600}onAddApunte=\{addApunteDelDia\}/.test(APP),
  '🚨 la Biblioteca ya NO recibe `addApunteDelDia`, que es el de Productividad');
ok(/onAddApunte=\{addApunte\}\s+onDeleteApunte=\{deleteApunte\}/.test(APP),
  '🚨 recibe los SUYOS, `addApunte` y `deleteApunte` — que llevaban desde la E3 F6 sin que nadie los llamara');
ok(/const addApunte = /.test(APP) && /const deleteApunte = /.test(APP),
  '⚠️ y siguen existiendo, escribiendo en `biblioteca.apuntes`');

console.log('\n═══ 8. TODO LO QUE SE BORRA VUELVE (ME F3 y EH F45) ═══\n');

for (const c of ['libros', 'ideas', 'colecciones']) {
  ok(Boolean(CATALOGO_PAPELERA[`biblioteca.${c}`]),
    `🚨 \`biblioteca.${c}\` está en el catálogo de la papelera: si no, se borraría para siempre`);
  ok(new RegExp(`eliminarConPapelera\\('biblioteca', '${c}'`).test(APP),
    `⚠️ y se borra por la ÚNICA puerta que hay, con los nombres literales que busca la auditoría de ME F4`);
}
eq(CATALOGO_PAPELERA['biblioteca.colecciones'].campos, ['nombre'],
  '⚠️ y la papelera enseña el campo que una colección tiene de verdad: `nombre`, no `titulo`');

console.log('\n═══ 9. 🚨 EL NORMALIZADOR — DECIMONOVENA VEZ (regla 5) ═══\n');

/* ⚠️ El enlace del ejemplo lleva su dirección **desde la BL F4**: allí los
   enlaces pasaron a ser guardados con ficha completa, y uno sin dirección ni
   contenido no es nada y se descarta. La primera versión de esta prueba usaba
   `{ id: 'e1' }` a secas, que era un enlace que Josué no puede tener. */
const viejo = {
  apuntes: [{ id: 'a1', titulo: 'Examen' }],
  enlaces: [{ id: 'e1', fecha: '2026-09-01', titulo: 'Repaso', url: 'https://ejemplo.es', descripcion: 'Vídeo' }],
};
const migrado = normalizarBiblioteca(viejo);
eq(migrado.apuntes, viejo.apuntes, '🚨 lo que Josué ya tenía se queda INTACTO: esta fase no toca sus apuntes');
eq([migrado.enlaces[0].id, migrado.enlaces[0].titulo, migrado.enlaces[0].url, migrado.enlaces[0].descripcion, migrado.enlaces[0].fecha],
  ['e1', 'Repaso', 'https://ejemplo.es', 'Vídeo', '2026-09-01'],
  '🚨 y sus enlaces conservan TODOS sus campos al convertirse en guardados (BL F4)');
eq([migrado.libros, migrado.ideas, migrado.colecciones], [[], [], []],
  '🚨 y las tres listas nuevas llegan como `[]`, no `undefined`: sin esto el lanzador revienta al contarlas');
eq(normalizarBiblioteca(null).libros, [], 'sin nada guardado tampoco revienta');
eq(normalizarBiblioteca({ apuntes: 'roto' }).apuntes, [], '⚠️ y algo guardado que no es una lista se convierte en una');

const sinId = normalizarBiblioteca({ libros: [{ titulo: 'Sin id' }] }).libros[0];
ok(sinId.id, '🚨 un elemento sin `id` recibe uno: al releerlo, cada dispositivo le pondría uno distinto (EH F45)');
eq(normalizarBiblioteca({ libros: [{ autor: 'Nadie' }] }).libros, [],
  '⚠️ y un libro sin título se descarta: guardar un elemento en blanco es guardar una mentira');
eq(normalizarLibro(null), null, 'lo que no es un objeto no pasa');
eq(normalizarIdea({ titulo: 'Idea', detalle: 42 }).detalle, '', '⚠️ un campo con el tipo equivocado se corrige');
eq(normalizarColeccion({ nombre: 'X' }).descripcion, '', '⚠️ y el que falta se rellena');

// 🚨 Y App.jsx tiene que LLAMARLO: si no, todo lo anterior es decorativo.
ok(/setBiblioteca\(normalizarBiblioteca\(bib\)\)/.test(APP),
  '🚨 App.jsx normaliza al cargar — `setBiblioteca(bib)` a pelo era el fallo');
ok(/import \{ normalizarBiblioteca \} from '\.\/lib\/biblioteca'/.test(APP),
  '⚠️ y lo importa: un símbolo sin importar lanza en el primer render (EH F15)');

console.log('\n═══ 10. LA CASCADA ES LA QUE YA EXISTE ═══\n');

eq(CLASE_TARJETA, 'hub-card',
  '🚨 se reutiliza la cascada de los hubs (Fase N2): una segunda se vería distinta');
ok(leer('src/index.css').includes('.hub-card'), '⚠️ y esa clase EXISTE en `index.css` — una clase declarada y no escrita no pinta nada (E3 F14)');
eq(retrasoDeTarjeta(0), '0ms', 'la primera entra sin retraso');
eq(retrasoDeTarjeta(3), `${RETRASO_CASCADA_MS * 3}ms`, '⚠️ y cada una un poco después');
eq(retrasoDeTarjeta(-2), '0ms', 'un índice imposible no da un retraso negativo');
ok(RETRASO_CASCADA_MS * MINI_APPS.length <= 400,
  '⚠️ las seis terminan de entrar en menos de medio segundo: *"fluidez > efectos"*');
ok(/active:scale-\[0\.97\]/.test(VISTA_LIMPIA), '⚠️ y el feedback al tocar es el de `ui.jsx`, no uno propio');

console.log('\n═══ 11. LA PANTALLA: LANZADOR PRIMERO, Y CADA MINI-APP CON SUS CUATRO COSAS ═══\n');

ok(/grid-cols-2/.test(VISTA_LIMPIA), '⚠️ dos columnas en móvil, como pide el enunciado');
ok(/aria-label="Volver a la biblioteca"/.test(VISTA_LIMPIA), '⚠️ botón de volver, con nombre para el lector de pantalla');
ok(/CabeceraMiniApp/.test(VISTA_LIMPIA) && /VacioMiniApp/.test(VISTA_LIMPIA),
  '⚠️ una sola cabecera y un solo estado vacío para las seis: ni un `case` por mini-app en el JSX');
ok(/toque-44/.test(VISTA_LIMPIA), '⚠️ y la plaquita cumple los 44 px de zona táctil (EH F42)');
/* 🐛 La primera versión de esta comprobación miraba 200 caracteres detrás de
   `const FILTROS` y se metía dentro de `ICONOS`, que sí nombra `apunte` con todo
   el derecho: saltaba con algo que estaba bien. Se mira **el array**, no lo que
   haya cerca. Van catorce veces en el proyecto. */
const ARRAY_FILTROS = VISTA.slice(VISTA.indexOf('const FILTROS'), VISTA.indexOf('];', VISTA.indexOf('const FILTROS')));
ok(!/apunte|enlace/.test(ARRAY_FILTROS),
  '⚠️ los filtros de tipo se quedan en Documentos: los apuntes y los enlaces ya tienen su mini-app');

// 🚨 La nota rápida: *"entra, escribe y guarda"* (criterio 10).
ok(/AnadirNotaRapida/.test(VISTA_LIMPIA), '🚨 Notas tiene su formulario rápido, no el burocrático');
const nota = VISTA.slice(VISTA.indexOf('function AnadirNotaRapida'), VISTA.indexOf('function AnadirLibro'));
ok(nota.indexOf('Textarea') < nota.indexOf('Título (opcional)'),
  '🚨 y el TEXTO va antes que el título: el título es opcional, el contenido es lo que se guarda');
ok(/Título \(opcional\)/.test(nota), '⚠️ y se dice que es opcional, con esa palabra');
ok(!/Field label="Categoría"|Field label="Etiquetas"|Field label="Proyecto"/.test(nota),
  '🚨 sin categoría, etiquetas ni proyecto: *"no convertirlo en un formulario burocrático"*');

console.log('\n═══ 12. NI UNA TABLA NUEVA, NI UN SQL QUE EJECUTAR ═══\n');

ok(DONDE_SE_GUARDA.every((d) => d.nuevo === false),
  '🚨 los tres sitios donde escribe la Biblioteca existían ya: *"no crear una segunda base de datos"*');
ok(DONDE_SE_GUARDA.some((d) => /bucket/.test(d.donde)), '⚠️ incluido el bucket de los archivos');
eq(AISLAMIENTO.sqlNuevo, false, '🚨 y ni una línea de SQL que Josué tenga que ejecutar');
eq(AISLAMIENTO.politica, 'auth.uid() = user_id',
  '🚨 cada usuario ve solo su biblioteca, y es la base de datos quien lo garantiza (EH F43)');
ok(!/create table|create policy/i.test(LIB), '⚠️ esta librería no trae SQL');
ok(!/askAI|ask-ai/i.test(sinComentarios(LIB)), '🚨 y no llama a la IA: el enunciado lo prohíbe en esta fase');

console.log('\n═══ 13. LO QUE ESTA FASE NO HACE, CON SU FASE ═══\n');

ok(NO_EN_ESTA_FASE.length >= 7 && NO_EN_ESTA_FASE.every((x) => x.que && x.llega),
  '⚠️ cada cosa aplazada dice en qué fase llega: no es un descuido');
ok(NO_EN_ESTA_FASE.some((x) => /OCR|escáner/i.test(x.que)), '🚨 sin OCR ni escáner');
ok(NO_EN_ESTA_FASE.some((x) => /búsqueda/i.test(x.que)), '🚨 sin búsqueda global');
ok(MINI_APPS.every((m) => m.fase), '⚠️ y cada mini-app sabe cuál es su fase completa');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
