// ============================================================================
// ENTREGA 3 · FASE 18 (BL F4) — BIBLIOTECA: GUARDADOS
//
// Los 25 puntos de la condición de éxito, y las tres cosas que el enunciado
// marca como IMPORTANTES: **archivar no es eliminar**, **un fallo de preview no
// rompe nada** y **Guardados no puede convertirse en otra aplicación de notas**.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_GUARDADO, tipoGuardado, ESTADOS_GUARDADO, CAMPOS_GUARDADO,
  esURL, normalizarURL, dominioDe, faviconDe, METADATOS, metadato,
  crearGuardado, normalizarGuardado, editarGuardado,
  alternarFavorito, archivar, desarchivar,
  FILTROS_GUARDADOS, ORDENES_GUARDADOS, ORDEN_POR_DEFECTO,
  filtrarGuardados, ordenarGuardados, textoBuscable, nombreDe, resumenGuardados,
  COMPARTIR_DESDE_EL_MOVIL, crearDesdeCompartido,
  NO_EN_GUARDADOS, DIFERENCIA_CON_NOTAS,
} from '../src/lib/guardados.js';
import { normalizarBiblioteca, miniApp } from '../src/lib/biblioteca.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const LIB = leer('src/lib/guardados.js');
const VISTA = sinComentarios(leer('src/views/LibraryView.jsx'));
const APP = sinComentarios(leer('src/App.jsx'));
const hoy = new Date().toLocaleDateString('sv-SE');

console.log('\n═══ 1. LOS TRES TIPOS (criterios 1, 2 y 3) ═══\n');

eq(TIPOS_GUARDADO.map((t) => t.id), ['link', 'text', 'resource'], '🚨 los tres del enunciado');
ok(TIPOS_GUARDADO.every((t) => t.nombre && t.icono && t.que),
  '🚨 cada uno con su NOMBRE además del icono: el dibujo nunca va solo (EH F42)');
eq(tipoGuardado('inventado'), null, 'uno que no existe no se inventa');
eq(ESTADOS_GUARDADO.map((e) => e.id), ['active', 'archived'], '⚠️ y los dos estados');

console.log('\n═══ 2. DETECTAR UNA DIRECCIÓN (criterio 8) ═══\n');

ok(esURL('https://ejemplo.es/articulo'), 'una dirección completa');
ok(esURL('ejemplo.es'), '⚠️ y una sin `https://`, que es como se pegan en el móvil');
ok(!esURL('esto no es una dirección'), 'una frase no');
ok(!esURL('http://'), '🚨 ni `http://` a secas: **la forma no basta**, y por eso se usa `new URL`');
ok(!esURL('hola'), 'ni una palabra suelta');
ok(!esURL(''), 'ni nada');
eq(normalizarURL('ejemplo.es'), 'https://ejemplo.es', '⚠️ se completa el `https://` que nadie escribe');
eq(normalizarURL('no vale'), null, 'y lo que no es una dirección no se convierte en una');
eq(dominioDe('https://www.youtube.com/watch?v=1'), 'youtube.com',
  '⚠️ el dominio sale de la propia dirección, sin el `www.`');
eq(dominioDe('nada'), null, 'sin dirección, ningún dominio');

console.log('\n═══ 3. 🚨 LO QUE SE PUEDE SABER DE UNA DIRECCIÓN, Y LO QUE NO (criterios 17 y 18) ═══\n');

eq(metadato('dominio').seObtiene, true, '⚠️ el dominio SÍ: es un dato de verdad');
eq(metadato('favicon').seObtiene, true, '⚠️ el favicon también, pidiéndoselo al sitio');
eq(metadato('titulo').seObtiene, false,
  '🚨 el TÍTULO no se puede leer de la página: lo impide la política de origen cruzado, y se dice en vez de fingirlo (regla 8)');
eq(metadato('imagen').seObtiene, false, '🚨 ni la imagen de portada');
ok(METADATOS.titulo.porque && METADATOS.imagen.porque, '⚠️ y las dos dicen por qué');
eq(metadato('inventado'), null, 'y no se declara nada más');

eq(faviconDe('https://ejemplo.es/x'), 'https://ejemplo.es/favicon.ico',
  '🚨 el favicon se pide AL SITIO MISMO: sin servicios de terceros, que verían qué guarda Josué');
ok(!/google\.com\/s2|favicon\.(io|yandex|duckduckgo)/i.test(LIB),
  '🚨 y no se usa ningún servicio ajeno de faviconos');
eq(faviconDe('un texto'), null, 'sin dirección, ninguno');
ok(!/preview_image|previewImagen/.test(sinComentarios(LIB)),
  '🚨 y NO existe un campo de imagen de portada: guardar uno que nadie puede rellenar es prometer una función que no existe');
ok(/onError=\{\(\) => setFalla\(true\)\}/.test(VISTA),
  '🚨 y si el favicon falla, la tarjeta sigue funcionando con el icono de su tipo (criterio 18)');
ok(/loading="lazy"/.test(VISTA),
  '⚠️ y se carga con retraso: *"no cargar imágenes externas de forma que bloqueen toda la pantalla"*');

console.log('\n═══ 4. GUARDAR ES RÁPIDO (criterios 4 y 5) ═══\n');

const enlace = crearGuardado({ url: 'ejemplo.es/articulo' });
eq([enlace.tipo, enlace.url, enlace.titulo], ['link', 'https://ejemplo.es/articulo', ''],
  '🚨 pegar una dirección y guardar BASTA: el tipo se deduce y el título queda vacío');
eq(crearGuardado({ contenido: 'Una técnica que me sirve' }).tipo, 'text',
  '⚠️ y pegar un texto crea un guardado de texto');
eq(crearGuardado({ tipo: 'link', url: 'no es una dirección' }), null,
  '⚠️ un enlace sin dirección válida no se crea');
eq(crearGuardado({ tipo: 'text', contenido: '   ' }), null, 'ni un texto en blanco');
eq(crearGuardado(), null, 'ni nada');
eq(Object.keys(enlace).sort(), [...CAMPOS_GUARDADO].sort(), '⚠️ y tiene sus trece campos');
ok(!('user_id' in enlace) && !/user_id/.test(sinComentarios(LIB)),
  '🚨 sin `user_id` dentro: el aislamiento es de `app_data` (EH F43)');
ok(!('dominio' in enlace) && !('favicon' in enlace),
  '🚨 y sin dominio ni favicon guardados: se derivan, o se quedarían viejos si él corrige la dirección');
eq(enlace.coleccionId, null,
  '⚠️ pero `coleccionId` SÍ existe: *"preparar `collection_id` pero no implementar Colecciones todavía"*');
eq(crearGuardado({ url: 'https://ejemplo.es', contenido: 'https://ejemplo.es' }).contenido, '',
  '⚠️ y pegar la dirección en los dos sitios no la guarda dos veces');

console.log('\n═══ 5. FAVORITOS Y ARCHIVAR (criterios 10 y 11) ═══\n');

eq(alternarFavorito(enlace).favorito, true, '⚠️ marcar favorito');
eq(alternarFavorito(alternarFavorito(enlace)).favorito, false, 'y quitarlo');
eq(alternarFavorito(null), null, 'sin guardado no revienta');

const archivado = archivar(enlace);
eq([archivado.estado, archivado.archivado], ['archived', hoy], '⚠️ archivar guarda su estado y su fecha');
eq(archivado.url, enlace.url,
  '🚨 Y NO SE ELIMINA NADA: *"un elemento archivado deja de aparecer entre los activos. No eliminarlo"*');
eq(desarchivar(archivado).estado, 'active', '⚠️ y se puede sacar del archivo');
eq(desarchivar(archivado).archivado, null, 'quitándole la fecha de archivo');

// 🚨 Lo archivado no sale entre lo activo, que es la razón de ser del botón.
const lista = [
  { ...crearGuardado({ url: 'https://a.es' }), id: 'a', fecha: '2026-09-01', titulo: 'Zeta' },
  { ...crearGuardado({ contenido: 'Un texto' }), id: 'b', fecha: '2026-09-03', favorito: true, titulo: 'Alfa' },
  { ...crearGuardado({ tipo: 'resource', contenido: 'Un recurso' }), id: 'c', fecha: '2026-08-01', estado: 'archived' },
  { ...crearGuardado({ url: 'https://youtube.com/x' }), id: 'd', fecha: '2026-09-02' },
];

eq(filtrarGuardados(lista, { filtro: 'todos' }).map((g) => g.id), ['a', 'b', 'd'],
  '🚨 lo ARCHIVADO no sale entre lo activo: si saliera igual, el botón de archivar no haría nada visible');
eq(filtrarGuardados(lista, { filtro: 'archivados' }).map((g) => g.id), ['c'],
  '⚠️ y sale en su filtro, solo');
eq(filtrarGuardados(lista, { filtro: 'favoritos' }).map((g) => g.id), ['b'], '⚠️ los favoritos');
eq(filtrarGuardados(lista, { filtro: 'link' }).map((g) => g.id), ['a', 'd'], '⚠️ y por tipo');
eq(FILTROS_GUARDADOS.map((f) => f.id), ['todos', 'link', 'text', 'resource', 'favoritos', 'archivados'],
  '⚠️ los seis filtros del enunciado, ni uno más: *"no crear un sistema excesivamente complejo"*');

console.log('\n═══ 6. LA BÚSQUEDA MIRA LOS SEIS CAMPOS (criterio 13) ═══\n');

const completo = crearGuardado({
  url: 'https://youtube.com/watch', titulo: 'Repaso', descripcion: 'De química', nota: 'Verlo el jueves',
});
const buscable = textoBuscable(completo);
for (const [campo, aguja] of [['título', 'repaso'], ['dirección', 'youtube.com/watch'], ['dominio', 'youtube.com'], ['descripción', 'quimica'], ['nota', 'jueves']]) {
  ok(buscable.includes(aguja), `⚠️ la búsqueda mira ${campo}`);
}
ok(textoBuscable(crearGuardado({ contenido: 'Un fragmento útil' })).includes('fragmento'),
  '⚠️ y el contenido de un texto');
eq(filtrarGuardados(lista, { texto: 'youtube' }).map((g) => g.id), ['d'],
  '🚨 buscar "youtube" encuentra un enlace cuyo título no lo dice: el dominio DERIVADO también se busca');
eq(filtrarGuardados(lista, { texto: 'ZETA' }).map((g) => g.id), ['a'], '⚠️ sin distinguir mayúsculas');
eq(filtrarGuardados([completo], { texto: 'quimica' }).length, 1, '🚨 ni acentos: nadie escribe tildes en el móvil');

console.log('\n═══ 7. ORDEN Y NOMBRE (criterio 15) ═══\n');

eq(ORDENES_GUARDADOS.map((o) => o.id), ['recientes', 'antiguos', 'alfabetico', 'favoritos'], '⚠️ los cuatro');
eq(ORDEN_POR_DEFECTO, 'recientes', '⚠️ y por defecto, los más recientes');
eq(ordenarGuardados(filtrarGuardados(lista, {}), 'recientes').map((g) => g.id), ['b', 'd', 'a'], '⚠️ recientes primero');
eq(ordenarGuardados(filtrarGuardados(lista, {}), 'antiguos').map((g) => g.id), ['a', 'd', 'b'], '⚠️ y al revés');
eq(ordenarGuardados(filtrarGuardados(lista, {}), 'alfabetico')[0].id, 'b', '⚠️ alfabético por su nombre');
const porFav = ordenarGuardados(filtrarGuardados(lista, {}), 'favoritos');
eq(porFav[0].id, 'b', '⚠️ favoritos primero');
eq(porFav.length, 3,
  '🚨 y "favoritos primero" es un ORDEN, no un filtro: los demás siguen estando debajo (EH F25)');

eq(nombreDe(crearGuardado({ url: 'https://ejemplo.es/x' })), 'ejemplo.es',
  '🚨 un enlace sin título se enseña por su dominio, nunca como "Sin título": eso no ayuda a encontrarlo');
eq(nombreDe(crearGuardado({ contenido: 'Una frase corta' })), 'Una frase corta',
  '⚠️ y un texto sin título, por su principio');
ok(nombreDe(crearGuardado({ contenido: 'x'.repeat(200) })).endsWith('…'), '⚠️ recortado si es largo');
eq(nombreDe(null), '', 'y sin guardado, nada');

console.log('\n═══ 8. EL RESUMEN ═══\n');

eq(resumenGuardados(lista), '3 guardados · 1 favorito · 1 archivado', '⚠️ con sus singulares y plurales');
eq(resumenGuardados([]), null, '🚨 sin ni un guardado NO hay línea: *"no inventar números"*');

console.log('\n═══ 9. EL NORMALIZADOR Y LA MIGRACIÓN (regla 5, vigésima vez) ═══\n');

// 🚨 Un enlace de la Fase 11: solo { id, fecha, titulo, url, descripcion }.
const viejo = { id: 'e1', fecha: '2026-05-05', titulo: 'Repaso', url: 'https://ejemplo.es', descripcion: 'De química' };
const migrado = normalizarGuardado(viejo);
eq([migrado.id, migrado.titulo, migrado.url, migrado.descripcion, migrado.fecha],
  ['e1', 'Repaso', 'https://ejemplo.es', 'De química', '2026-05-05'],
  '🚨 un enlace de la Fase 11 conserva TODOS sus campos, incluida su fecha: no lo guardó hoy');
eq(migrado.tipo, 'link', '⚠️ y se convierte en un guardado de tipo enlace');
eq([migrado.favorito, migrado.estado, migrado.nota, migrado.coleccionId], [false, 'active', '', null],
  '⚠️ con los campos nuevos puestos, no `undefined`');

eq(normalizarGuardado({ titulo: 'X', estado: 'inventado' }).estado, 'active', '⚠️ un estado que no existe vuelve al activo');
eq(normalizarGuardado({ contenido: 'x', estado: 'archived' }).archivado !== null, true,
  '⚠️ y uno archivado sin fecha de archivo recibe una');
eq(normalizarGuardado({ url: 'no vale' }), null, '⚠️ un enlace sin dirección válida se descarta');
eq(normalizarGuardado({}), null, 'y uno vacío también');
ok(normalizarGuardado({ titulo: 'Solo título' }).id, '⚠️ un guardado sin id recibe uno (EH F45)');
eq(normalizarGuardado({ titulo: 'X', fecha: '2026-13-45' }).fecha !== '2026-13-45', true,
  '🚨 y una fecha imposible se descarta: encaja con la forma y no existe');

// 🚨 Y la Biblioteca tiene que usarlo.
const bib = normalizarBiblioteca({ enlaces: [viejo] });
eq(bib.enlaces[0].tipo, 'link',
  '🚨 `normalizarBiblioteca` normaliza los guardados: sin esto, el primer guardado desde la pantalla nueva se llevaría los campos que no conociera');
eq(bib.enlaces[0].favorito, false, '⚠️ con sus campos nuevos');
eq(miniApp('guardados').coleccion, 'enlaces',
  '🚨 y la colección SIGUE siendo `enlaces`: crear `guardados` al lado habría escondido los de Josué');

console.log('\n═══ 10. EDITAR Y ELIMINAR (criterios 6, 7 y 12) ═══\n');

const editado = editarGuardado(completo, { nota: 'Cambiada', descripcion: '' });
eq([editado.nota, editado.descripcion, editado.id], ['Cambiada', '', completo.id], '⚠️ se cambia lo que llega y el id se queda');
eq(editado.fecha, completo.fecha, '⚠️ y la fecha de guardado no se toca: no lo guardó hoy');
eq(editarGuardado(completo, { url: 'no vale' }).url, completo.url,
  '🚨 y una dirección imposible NO borra el guardado: se queda como estaba');
eq(editarGuardado(null, {}), null, 'sin guardado no revienta');

ok(Boolean(CATALOGO_PAPELERA['biblioteca.enlaces']),
  '🚨 eliminar manda a Eliminados recientes: *"si existe papelera global, utilizarla"*');
eq(CATALOGO_PAPELERA['biblioteca.enlaces'].campos, ['titulo', 'url', 'contenido'],
  '⚠️ y la papelera enseña también la dirección o el contenido: el título es opcional, y una fila en blanco no dice qué se recupera');
ok(!/papelera|trash/i.test(sinComentarios(LIB)),
  '⚠️ sin una segunda papelera propia: *"no crear una segunda papelera exclusiva si no hace falta"*');
ok(/onUpdateEnlace/.test(APP) && /const updateEnlace =/.test(APP),
  '🚨 y `updateEnlace` existe **y App.jsx se la pasa**: una función que nadie llama no falla nunca');

console.log('\n═══ 11. COMPARTIR DESDE EL MÓVIL: PREPARADO, NO FINGIDO ═══\n');

eq(COMPARTIR_DESDE_EL_MOVIL.implementado, false,
  '🚨 el Share Target NO está hecho, y se dice: *"solo dejar la estructura preparada"*');
ok(COMPARTIR_DESDE_EL_MOVIL.loQueFalta.length >= 3 && COMPARTIR_DESDE_EL_MOVIL.porque,
  '⚠️ con lo que falta y por qué no se declara a medias');
ok(/service worker/i.test(COMPARTIR_DESDE_EL_MOVIL.loQueFalta.join(' ')),
  '⏸ y depende del service worker, que es la decisión de Josué en DEP-30');
ok(!/share_target/.test(leer('public/manifest.json')),
  '🚨 así que el manifiesto NO lo declara: un `share_target` que Safari ofrezca y que luego no guarde nada sería peor que no ofrecerlo');

eq(crearDesdeCompartido({ url: 'https://ejemplo.es', title: 'Algo' }).tipo, 'link',
  '⚠️ y la función que lo recibiría YA existe y funciona');
eq(crearDesdeCompartido({ text: 'https://ejemplo.es' }).tipo, 'link',
  '⚠️ incluso cuando la dirección llega dentro del texto, que es lo que hace Safari');
eq(crearDesdeCompartido({ text: 'Una frase' }).tipo, 'text', '⚠️ y un texto suelto se guarda como texto');
eq(crearDesdeCompartido({}), null, 'y sin nada, nada');

console.log('\n═══ 12. 🚨 GUARDADOS NO ES OTRA APLICACIÓN DE NOTAS (criterio 22) ═══\n');

ok(DIFERENCIA_CON_NOTAS.notas && DIFERENCIA_CON_NOTAS.guardados && DIFERENCIA_CON_NOTAS.ejemplo,
  '⚠️ la diferencia está escrita, con su ejemplo');
ok(/DIFERENCIA_CON_NOTAS\.ejemplo/.test(VISTA),
  '🚨 y la pantalla la ENSEÑA: el enunciado la marca como IMPORTANTE');
ok(!/apuntes/.test(sinComentarios(LIB)),
  '🚨 y Guardados no escribe ni lee `biblioteca.apuntes`: son dos listas y dos finalidades');
ok(!/^export function crearApunte|crearNota/m.test(LIB), '⚠️ ni tiene una fábrica de notas');

console.log('\n═══ 13. LO QUE ESTA FASE NO HACE ═══\n');

ok(NO_EN_GUARDADOS.length >= 5 && NO_EN_GUARDADOS.every((x) => x.que && x.llega), '⚠️ cada cosa con su fase');
ok(NO_EN_GUARDADOS.some((x) => /IA/.test(x.que)), '🚨 sin IA');
ok(NO_EN_GUARDADOS.some((x) => /etiquetas/.test(x.que)), '🚨 sin etiquetas');
ok(!/askAI|ask-ai/i.test(sinComentarios(LIB)), '🚨 y la librería no llama a la IA por ningún sitio');
ok(!/fetch\(|XMLHttpRequest/.test(sinComentarios(LIB)),
  '🚨 ni descarga páginas: *"no web scraping complejo"*, y además el navegador no puede');
ok(/rel="noreferrer noopener"/.test(VISTA),
  '🚨 y un enlace se abre en una pestaña nueva y aislada: *"debe abrirse de forma segura"*');
ok(/break-all/.test(VISTA),
  '⚠️ con las direcciones largas partidas: *"las URLs largas nunca deben romper el layout"*');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
