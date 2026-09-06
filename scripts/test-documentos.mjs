// ============================================================================
// ENTREGA 3 · FASE 20 (BL F6) — BIBLIOTECA: DOCUMENTOS
//
// Los 25 puntos de la condición de éxito, y las tres cosas que decidieron cómo
// se construye: **los archivos de Josué no se mueven**, **el contenido es
// Markdown** y **el autoguardado no puede perder nada**.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LO_QUE_HAY_EN_DOCUMENTOS, ESTADOS_DOCUMENTO, estadoDocumento, ESTADO_DOC_POR_DEFECTO,
  CATEGORIAS_DOCUMENTO, CAMPOS_DOCUMENTO, MAX_ETIQUETAS,
  normalizarEtiqueta, normalizarEtiquetas,
  crearDocumento, normalizarDocumento, editarDocumento,
  alternarFavoritoDoc, archivarDocumento, desarchivarDocumento, guardarEnBiblioteca, volverABorrador,
  RETRASO_AUTOGUARDADO_MS, AVISOS_GUARDADO, avisoGuardado, estadoDeGuardado,
  MARCAS_FORMATO, marcaFormato, aplicarMarca,
  bloquesDe, trozosDe, indiceDe, adelantoDe, nombreDoc,
  FILTROS_DOCUMENTOS, ORDENES_DOCUMENTOS, ORDEN_DOC_POR_DEFECTO,
  filtrarDocumentos, ordenarDocumentos, textoBuscableDoc, etiquetasUsadas, lineaDocumentos,
  RELACIONES_FUTURAS, relacionFutura, DIFERENCIAS_DOC, NO_EN_DOCUMENTOS,
} from '../src/lib/documentos.js';
import { normalizarBiblioteca, miniApp } from '../src/lib/biblioteca.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { DEBOUNCE_BUSQUEDA_MS } from '../src/lib/rendimiento.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/* 🐛 Y para buscar si el código TOCA otra lista hay que quitar también las
   CADENAS: `donde: 'bibliotecaArchivos'` es la tabla que documenta dónde viven
   los archivos, y «apuntes largos» es español corriente. Las dos hacían saltar
   el barrido con un archivo que estaba bien — decimosexta vez de esta lección
   (EH F48: una regla no es código). */
const soloCodigo = (s) => sinComentarios(s).replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");

const LIB = leer('src/lib/documentos.js');
const VISTA = sinComentarios(leer('src/views/LibraryView.jsx'));
const APP = sinComentarios(leer('src/App.jsx'));
const UI = leer('src/components/ui.jsx');

const CONTENIDO = [
  '# Introducción',
  'Un párrafo con **negrita**, *cursiva*, ~~tachado~~ y `código`.',
  '',
  '## Arquitectura',
  '- Una viñeta',
  '- Otra',
  '',
  '1. Primero',
  '2. Segundo',
  '',
  '- [ ] Sin hacer',
  '- [x] Hecho',
  '',
  '> Una cita',
  '',
  '---',
  '',
  '### Seguridad',
  'Usaremos Supabase.',
].join('\n');

const doc = (extra = {}) => ({ ...crearDocumento({ titulo: 'Especificación', contenido: CONTENIDO }), ...extra });

console.log('\n═══ 1. 🚨 LOS ARCHIVOS DE JOSUÉ NO SE MUEVEN ═══\n');

eq(LO_QUE_HAY_EN_DOCUMENTOS.map((x) => x.id), ['archivos', 'textos'],
  '🚨 la mini-app guarda DOS cosas: los archivos de la Fase 11 y los textos de esta fase');
eq(LO_QUE_HAY_EN_DOCUMENTOS.find((x) => x.id === 'archivos').donde, 'bibliotecaArchivos',
  '🚨 y los archivos siguen EN SU CLAVE: esta fase no se los lleva');
eq(LO_QUE_HAY_EN_DOCUMENTOS.find((x) => x.id === 'archivos').nueva, false, '⚠️ porque ya existían');
eq(miniApp('documentos').de, 'archivos',
  '🚨 el catálogo del lanzador los sigue leyendo de ahí (BL F1)');
ok(/onDeleteArchivo/.test(VISTA) && /AnadirArchivo/.test(VISTA),
  '⚠️ y la pantalla los sigue enseñando, con su botón de subir y su papelera');
ok(!/bibliotecaArchivos/.test(soloCodigo(LIB)),
  '⚠️ la librería de los textos no toca la lista de archivos: son dos cosas');

console.log('\n═══ 2. CREAR UN DOCUMENTO (criterios 1 y 2) ═══\n');

const nuevo = crearDocumento({ titulo: '  Especificación  ' });
eq(nuevo.titulo, 'Especificación', '⚠️ se guarda sin espacios de sobra');
eq(Object.keys(nuevo).sort(), [...CAMPOS_DOCUMENTO].sort(), '⚠️ con sus once campos');
ok(!('user_id' in nuevo) && !/user_id/.test(sinComentarios(LIB)),
  '🚨 sin `user_id` dentro: el aislamiento es de `app_data` (EH F43)');
eq(crearDocumento({ contenido: 'Solo escribí esto' }).titulo, '',
  '🚨 SIN TÍTULO TAMBIÉN VALE: *"no obligar al usuario a rellenar campos organizativos antes de escribir"*');
eq(crearDocumento({ titulo: '  ', contenido: '  ' }), null, '⚠️ pero algo hay que escribir');
eq(crearDocumento(), null, 'y sin nada, nada');
eq(nuevo.estado, 'draft',
  '🚨 y nace como BORRADOR: *"un documento recién creado puede permanecer como borrador"* (criterio 7)');
eq(ESTADOS_DOCUMENTO.map((e) => e.id), ['draft', 'ready'],
  '⚠️ dos estados, no cinco: *"no crear un sistema editorial complejo"*');
eq(estadoDocumento('inventado'), null, 'uno que no existe no se inventa');

console.log('\n═══ 3. LAS ETIQUETAS (criterio 16) ═══\n');

eq(normalizarEtiqueta('#Claude'), 'claude',
  '🚨 sin almohadilla y en minúsculas: `#Claude`, `claude` y `#claude` son la MISMA etiqueta');
eq(normalizarEtiqueta('dos palabras'), 'dos-palabras', '⚠️ y sin espacios dentro');
eq(normalizarEtiqueta('   '), null, 'una vacía no es una etiqueta');
eq(normalizarEtiquetas(['#claude', 'Claude', 'supabase']), ['claude', 'supabase'],
  '⚠️ y no se repiten');
eq(normalizarEtiquetas('claude supabase, productividad'), ['claude', 'supabase', 'productividad'],
  '⚠️ se aceptan escritas seguidas, que es como se teclean en el móvil');
eq(normalizarEtiquetas(Array.from({ length: 30 }, (_, i) => `t${i}`)).length, MAX_ETIQUETAS,
  '⚠️ con un tope');
eq(crearDocumento({ titulo: 'X' }).etiquetas, [], '🚨 y son OPCIONALES: un documento sin ninguna vale');
ok(CAMPOS_DOCUMENTO.includes('etiquetas'),
  '⚠️ viven DENTRO del documento: una tabla aparte en un almacén de una fila por clave habría que sincronizarla a mano, y dejaría etiquetas colgando de documentos borrados');
eq(crearDocumento({ titulo: 'X' }).categoria, '', '🚨 y la categoría también es opcional (criterio 17)');
ok(CATEGORIAS_DOCUMENTO.includes('Programación'), '⚠️ con las seis del enunciado como sugerencia');
ok(/datalist/.test(VISTA), '⚠️ ofrecidas con un `datalist`, no en un desplegable cerrado');

console.log('\n═══ 4. 🚨 EL AUTOGUARDADO (criterio 6) ═══\n');

ok(RETRASO_AUTOGUARDADO_MS > DEBOUNCE_BUSQUEDA_MS,
  '🚨 el retardo del autoguardado es MÁS LARGO que el del buscador: una búsqueda se lanza mientras se escribe una palabra, y un guardado mientras se escribe un párrafo');
ok(RETRASO_AUTOGUARDADO_MS <= 2000, '⚠️ pero no tanto como para que se note que no ha guardado');
eq(AVISOS_GUARDADO.map((a) => a.id), ['guardando', 'guardado', 'sin_conexion', 'error'], '⚠️ los avisos del enunciado');
eq(avisoGuardado('sin_conexion').detectable, true,
  '🚨 "sin conexión" SE DETECTA de verdad (`navigator.onLine`): un aviso que no puede aparecer nunca sería decorativo (regla 8)');
eq(avisoGuardado('error').detectable, false,
  '⚠️ y el fallo al guardar NO se puede detectar: `saveData` se traga su error (EH F52). El texto está escrito para el día que lo devuelva');
ok(avisoGuardado('error').porque, '⚠️ con su motivo');
eq(estadoDeGuardado({ enLinea: false }).id, 'sin_conexion', '⚠️ sin conexión gana a todo');
eq(estadoDeGuardado({ guardando: true }).id, 'guardando', '⚠️ mientras guarda, lo dice');
eq(estadoDeGuardado({ guardadoAlguna: true }).id, 'guardado', '⚠️ y luego, que está guardado');
eq(estadoDeGuardado({}), null,
  '🚨 y antes de tocar nada NO dice nada: un "Guardado" permanente en la pantalla es ruido');
ok(/navigator\.onLine/.test(VISTA), '⚠️ y la pantalla mira la conexión de verdad');
ok(/if \(pendiente\.current\) onGuardar\(pendiente\.current\)/.test(VISTA),
  '🚨 AL CERRAR SE GUARDA LO QUE QUEDE PENDIENTE: sin eso, escribir una frase y salir en menos de un segundo la perdería');

console.log('\n═══ 5. EL FORMATO (criterio 4) ═══\n');

for (const id of ['h1', 'h2', 'h3', 'negrita', 'cursiva', 'tachado', 'vinetas', 'numerada', 'checklist', 'cita', 'codigo', 'separador']) {
  ok(Boolean(marcaFormato(id)), `⚠️ existe la marca «${id}», que el enunciado nombra`);
}
ok(MARCAS_FORMATO.every((m) => m.nombre && m.muestra),
  '⚠️ y cada una con su nombre para el lector de pantalla');
eq(marcaFormato('inventada'), null, 'una que no existe no se inventa');

eq(aplicarMarca('hola', 0, 4, 'negrita').texto, '**hola**', '⚠️ la negrita envuelve lo seleccionado');
eq(aplicarMarca('hola', 0, 4, 'negrita').inicio, 2, '⚠️ y el cursor queda dentro');
eq(aplicarMarca('hola', 0, 0, 'h2').texto, '## hola', '⚠️ un título prefija la línea');
eq(aplicarMarca('## hola', 3, 3, 'h2').texto, 'hola',
  '🚨 y el MISMO botón lo quita: si no, poner una viñeta por error obligaría a borrarla a mano');
eq(aplicarMarca('uno\ndos', 5, 5, 'vinetas').texto, 'uno\n- dos',
  '⚠️ y la marca de línea va a la línea del cursor, no al principio del texto');
eq(aplicarMarca('hola', 4, 4, 'separador').texto, 'hola\n---\n', '⚠️ el separador se inserta entero');
eq(aplicarMarca('hola', 0, 4, 'inventada').texto, 'hola', 'una marca que no existe no toca nada');
eq(aplicarMarca(null, 0, 0, 'negrita').texto, '****', 'y sin texto no revienta');
eq(aplicarMarca('hola', 99, 99, 'negrita').texto, 'hola****', '⚠️ ni con una posición imposible');

console.log('\n═══ 6. LEER EL DOCUMENTO (criterio 14) ═══\n');

const bloques = bloquesDe(CONTENIDO);
eq(bloques.filter((b) => b.tipo === 'titulo').map((b) => b.nivel), [1, 2, 3], '⚠️ los tres niveles de título');
ok(bloques.some((b) => b.tipo === 'cita'), '⚠️ la cita');
ok(bloques.some((b) => b.tipo === 'separador'), '⚠️ el separador');
eq(bloques.filter((b) => b.tipo === 'vinetas')[0].elementos.length, 2, '⚠️ la lista de viñetas, con sus dos');
eq(bloques.filter((b) => b.tipo === 'numerada')[0].elementos.length, 2, '⚠️ la numerada');
const check = bloques.find((b) => b.tipo === 'checklist');
eq(check.elementos.map((e) => e.hecho), [false, true], '⚠️ y las casillas, con cuál está marcada');
eq(bloquesDe('').length, 0, 'un documento vacío no da bloques');
eq(bloquesDe(null).length, 0, 'y `null` tampoco revienta');

const trozos = trozosDe('Un párrafo con **negrita**, *cursiva*, ~~tachado~~ y `código`.');
ok(trozos.some((t) => t.negrita && t.texto === 'negrita'), '⚠️ la negrita se reconoce');
ok(trozos.some((t) => t.cursiva && t.texto === 'cursiva'), '⚠️ la cursiva');
ok(trozos.some((t) => t.tachado && t.texto === 'tachado'), '⚠️ el tachado');
ok(trozos.some((t) => t.codigo && t.texto === 'código'), '⚠️ y el código');
ok(trozosDe('**negrita**').every((t) => !t.cursiva),
  '🚨 `**` se lee ANTES que `*`: al revés, la negrita saldría como dos cursivas vacías');
eq(trozosDe('').length, 1, 'y un texto vacío da un trozo vacío, no revienta');

// 🚨 La decisión de seguridad de esta fase.
ok(!/dangerouslySetInnerHTML/.test(VISTA),
  '🚨 EL DOCUMENTO SE PINTA CON ELEMENTOS DE REACT, nunca con `dangerouslySetInnerHTML`: un texto pegado de cualquier sitio no tiene por qué ser inofensivo, y ese camino no se vuelve a cerrar');
ok(!/innerHTML/.test(sinComentarios(LIB)), '⚠️ y la librería tampoco fabrica HTML');

console.log('\n═══ 7. EL ÍNDICE Y EL ADELANTO ═══\n');

const indice = indiceDe(CONTENIDO);
eq(indice.map((t) => t.texto), ['Introducción', 'Arquitectura', 'Seguridad'], '⚠️ el índice sale de los títulos');
eq(indice.map((t) => t.nivel), [1, 2, 3], '⚠️ con su nivel, para poder sangrarlo');
eq(indiceDe('Solo un párrafo'), null,
  '🚨 y sin títulos NO hay índice: uno vacío ocupa sitio y no dice nada');
eq(adelantoDe(doc()), 'Introducción',
  '⚠️ el adelanto de la tarjeta es la primera línea, SIN sus marcas: *"no mostrar una parrafada completa"*');
ok(adelantoDe({ contenido: 'x'.repeat(300) }).endsWith('…'), '⚠️ recortado si es largo');
eq(adelantoDe({ contenido: '', descripcion: 'La descripción' }), 'La descripción', '⚠️ y sin contenido usa la descripción');
eq(nombreDoc(crearDocumento({ contenido: 'Sin título pero con texto' })), 'Sin título pero con texto',
  '⚠️ un documento sin título se enseña por su primera línea');
eq(nombreDoc(null), '', 'y sin documento, nada');

console.log('\n═══ 8. FAVORITOS, BORRADOR, ARCHIVAR Y ELIMINAR (criterios 8, 9 y 10) ═══\n');

eq(alternarFavoritoDoc(doc()).favorito, true, '⚠️ marcar favorito');
eq(alternarFavoritoDoc(alternarFavoritoDoc(doc())).favorito, false, 'y quitarlo');
eq(guardarEnBiblioteca(doc()).estado, 'ready', '⚠️ sacarlo de borrador');
eq(guardarEnBiblioteca(doc()).contenido, CONTENIDO, '🚨 sin tocar el contenido');
eq(volverABorrador(guardarEnBiblioteca(doc())).estado, 'draft', '⚠️ y volver a borrador');

const archivado = archivarDocumento(guardarEnBiblioteca(doc()));
eq([archivado.archivado, archivado.estado], [true, 'ready'],
  '🚨 ARCHIVAR ES UN CAMPO APARTE DEL ESTADO: un documento terminado se archiva sin dejar de estar terminado (como en Ideas, E3 F19)');
eq(archivado.contenido, CONTENIDO, '🚨 y *"el contenido se conserva"*');
eq(desarchivarDocumento(archivado).archivado, false, '⚠️ y se puede sacar');

ok(Boolean(CATALOGO_PAPELERA['biblioteca.documentos']),
  '🚨 eliminar manda a Eliminados recientes: *"si existe papelera global, utilizarla"*');
eq(CATALOGO_PAPELERA['biblioteca.documentos'].campos, ['titulo', 'descripcion'],
  '⚠️ y la papelera enseña también la descripción: el título es opcional');
ok(!/papelera|trash/i.test(sinComentarios(LIB)),
  '⚠️ sin una segunda papelera propia: *"no crear una segunda papelera innecesaria"*');
ok(/eliminarConPapelera\('biblioteca', 'documentos'/.test(APP),
  '⚠️ por la única puerta que hay, con los nombres literales de la auditoría de ME F4');
ok(/const updateDocumento =/.test(APP) && /onUpdateDocumento=\{updateDocumento\}/.test(APP),
  '🚨 y `updateDocumento` existe **y App.jsx se la pasa**');

console.log('\n═══ 9. BUSCAR POR CONTENIDO (criterio 11) ═══\n');

ok(textoBuscableDoc(doc()).includes('supabase'),
  '🚨 buscar «Supabase» encuentra el documento AUNQUE NO ESTÉ EN EL TÍTULO: el contenido entero se busca');
ok(textoBuscableDoc(doc({ etiquetas: ['claude'] })).includes('claude'), '⚠️ y las etiquetas');

const lista = [
  { ...crearDocumento({ titulo: 'Zeta', contenido: 'Habla de Supabase' }), id: 'a', fecha: '2026-09-01', actualizado: '2026-09-01' },
  { ...crearDocumento({ titulo: 'Alfa', etiquetas: ['claude'] }), id: 'b', fecha: '2026-09-03', actualizado: '2026-09-05', favorito: true, estado: 'ready' },
  { ...crearDocumento({ titulo: 'Borrador viejo' }), id: 'c', fecha: '2026-08-01', actualizado: '2026-08-02' },
  { ...crearDocumento({ titulo: 'Guardado' }), id: 'd', fecha: '2026-09-02', actualizado: '2026-09-02', archivado: true },
];

eq(filtrarDocumentos(lista, { texto: 'supabase' }).map((d) => d.id), ['a'], '⚠️ buscar por contenido encuentra');
eq(filtrarDocumentos(lista, { texto: 'ZETA' }).map((d) => d.id), ['a'], '⚠️ sin distinguir mayúsculas');
eq(filtrarDocumentos([crearDocumento({ titulo: 'Programación' })], { texto: 'programacion' }).length, 1,
  '🚨 ni acentos: nadie escribe tildes en el móvil');
eq(filtrarDocumentos(lista, { etiqueta: '#Claude' }).map((d) => d.id), ['b'],
  '⚠️ y se puede filtrar por etiqueta, escrita como sea');

console.log('\n═══ 10. FILTROS Y ORDEN (criterios 12 y 13) ═══\n');

eq(FILTROS_DOCUMENTOS.map((f) => f.id), ['todos', 'favoritos', 'borradores', 'archivados'],
  '⚠️ los filtros sencillos del enunciado, ni uno más');
eq(filtrarDocumentos(lista, { filtro: 'todos' }).map((d) => d.id), ['a', 'b', 'c'],
  '🚨 lo ARCHIVADO no aparece en la vista principal');
eq(filtrarDocumentos(lista, { filtro: 'archivados' }).map((d) => d.id), ['d'], '⚠️ y sale en su filtro');
eq(filtrarDocumentos(lista, { filtro: 'favoritos' }).map((d) => d.id), ['b'], '⚠️ los favoritos');
eq(filtrarDocumentos(lista, { filtro: 'borradores' }).map((d) => d.id), ['a', 'c'], '⚠️ y los borradores');

eq(ORDENES_DOCUMENTOS.map((o) => o.id), ['modificados', 'recientes', 'antiguos', 'alfabetico', 'favoritos'],
  '⚠️ los órdenes del enunciado');
eq(ORDEN_DOC_POR_DEFECTO, 'modificados',
  '🚨 y por defecto, la ÚLTIMA MODIFICACIÓN, que es lo que el enunciado pide');
eq(ordenarDocumentos(filtrarDocumentos(lista, {}), 'modificados').map((d) => d.id), ['b', 'a', 'c'],
  '⚠️ lo tocado más recientemente primero');
eq(ordenarDocumentos(filtrarDocumentos(lista, {}), 'recientes')[0].id, 'b', '⚠️ por fecha de creación');
eq(ordenarDocumentos(filtrarDocumentos(lista, {}), 'antiguos')[0].id, 'c', '⚠️ y al revés');
eq(ordenarDocumentos(filtrarDocumentos(lista, {}), 'alfabetico')[0].id, 'b', '⚠️ alfabético');
eq(ordenarDocumentos(filtrarDocumentos(lista, {}), 'favoritos')[0].id, 'b', '⚠️ y favoritos primero');
eq(ordenarDocumentos(filtrarDocumentos(lista, {}), 'favoritos').length, 3,
  '🚨 que es un ORDEN, no un filtro: los demás siguen debajo');

eq(etiquetasUsadas(lista).map((t) => t.etiqueta), ['claude'],
  '⚠️ las etiquetas usadas se DERIVAN: una lista guardada aparte se quedaría con las de documentos ya borrados');
eq(lineaDocumentos(lista, [{ id: 'f1' }]), '3 documentos · 1 archivo · 2 borradores',
  '⚠️ y la línea de arriba cuenta las dos cosas');
eq(lineaDocumentos([], []), null, '🚨 sin nada, ninguna línea: *"no inventar números"*');

console.log('\n═══ 11. EDITAR Y NORMALIZAR (regla 5) ═══\n');

const base = doc({ descripcion: 'Las siete fases' });
const editado = editarDocumento(base, { contenido: '# Otro\nTexto' });
eq([editado.id, editado.descripcion, editado.fecha], [base.id, 'Las siete fases', base.fecha],
  '⚠️ se cambia lo que llega y el resto se conserva');
eq(editarDocumento(base, { titulo: '', contenido: '' }).contenido, base.contenido,
  '🚨 y vaciarlo del todo NO lo borra: se queda como estaba');
eq(editarDocumento(null, {}), null, 'sin documento no revienta');

eq(normalizarDocumento({ titulo: 'X', estado: 'inventado' }).estado, 'draft', '⚠️ un estado que no existe vuelve a borrador');
eq(normalizarDocumento({ titulo: 'X', etiquetas: '#Claude #claude' }).etiquetas, ['claude'],
  '⚠️ las etiquetas se normalizan también al cargar');
eq(normalizarDocumento({ titulo: 'X', fecha: '2026-13-45' }).fecha === '2026-13-45', false,
  '🚨 y una fecha imposible se descarta');
ok(normalizarDocumento({ titulo: 'Sin id' }).id, '⚠️ un documento sin id recibe uno (EH F45)');
eq(normalizarDocumento({}), null, 'y uno vacío se descarta');
eq(normalizarBiblioteca({ documentos: [{ titulo: 'X', contenido: 'y' }] }).documentos[0].estado, 'draft',
  '🚨 `normalizarBiblioteca` los normaliza: sin eso, el siguiente guardado se llevaría los campos que no conociera');

// 🚨 El fallo que esta fase encontró en un componente compartido.
ok(/export const Textarea = React\.forwardRef/.test(UI),
  '🚨 `Textarea` REENVÍA el `ref`: sin eso se perdía en silencio, y la barra de formato escribiría siempre al principio del texto sin que nada fallara');

console.log('\n═══ 12. RELACIONES FUTURAS: PREPARADAS, NO FINGIDAS (criterio 18) ═══\n');

eq(RELACIONES_FUTURAS.map((r) => r.con), ['ideas', 'objetivos', 'metas', 'proyectos', 'colecciones'],
  '⚠️ las cinco que el enunciado nombra');
eq(relacionFutura('proyectos').existe, false, '🚨 y se dice cuál NO existe: no hay módulo de proyectos');
eq(relacionFutura('colecciones').existe, false, '⚠️ ni Colecciones todavía: llega en la BL F7');
ok(RELACIONES_FUTURAS.every((r) => r.comoSeHaria), '⚠️ cada una con cómo se haría el día que toque');
ok(!CAMPOS_DOCUMENTO.some((c) => /^(ideaId|objetivoId|metaId|proyectoId|coleccionId)$/.test(c)),
  '🚨 y NO se han añadido cinco campos vacíos: uno que nadie puede rellenar es media función (regla 8)');

console.log('\n═══ 13. DOCUMENTOS NO ES "NOTAS PERO MÁS GRANDES" (criterio 23) ═══\n');

eq(DIFERENCIAS_DOC.map((d) => d.con), ['notas', 'guardados', 'ideas'],
  '⚠️ las tres diferencias que el enunciado separa');
ok(DIFERENCIAS_DOC.every((d) => d.suyo && d.esto), '⚠️ cada una con su frase por lado');
ok(/EJEMPLO_DIFERENCIA/.test(VISTA), '🚨 y la pantalla la ENSEÑA');
ok(!/apuntes/.test(soloCodigo(LIB)),
  '🚨 y no escribe ni lee `biblioteca.apuntes`: son dos listas y dos finalidades');
ok(/maxWidth: '68ch'/.test(VISTA),
  '⚠️ el modo lectura acota la anchura del texto, que es lo primero que pide el enunciado');
ok(/IndiceDocumento/.test(VISTA) && /CuerpoDocumento/.test(VISTA), '⚠️ con su índice y su cuerpo');
ok(/createPortal\(contenido, document\.body\)/.test(VISTA), '⚠️ y sale por `createPortal` (regla 3)');
ok(/clipboard\.writeText/.test(VISTA), '⚠️ y el contenido se puede copiar entero (criterio 15)');

console.log('\n═══ 14. LO QUE ESTA FASE NO HACE ═══\n');

ok(NO_EN_DOCUMENTOS.length >= 6 && NO_EN_DOCUMENTOS.every((x) => x.que && x.llega), '⚠️ cada cosa con su fase');
ok(NO_EN_DOCUMENTOS.some((x) => /IA/.test(x.que)), '🚨 sin IA ni resumen automático');
ok(NO_EN_DOCUMENTOS.some((x) => /Colaboración/.test(x.que)), '🚨 sin colaboración');
ok(NO_EN_DOCUMENTOS.some((x) => /versiones/.test(x.que)), '🚨 y sin historial de versiones: lo que se guarda son las dos fechas');
ok(!/askAI|ask-ai/i.test(sinComentarios(LIB)), '🚨 la librería no llama a la IA por ningún sitio');
ok(!/fetch\(|XMLHttpRequest/.test(sinComentarios(LIB)), '⚠️ ni sale a la red');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
