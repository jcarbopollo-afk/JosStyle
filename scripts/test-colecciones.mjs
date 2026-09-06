// ============================================================================
// ENTREGA 3 · FASE 21 (BL F7) — BIBLIOTECA: COLECCIONES
//
// Los 23 puntos del criterio de éxito y los 19 de la auditoría final, y las tres
// cosas que decidieron cómo se construye:
//
//   1. **Una colección guarda referencias, no contenido.** Ni un título, ni un
//      texto, ni una URL copiados.
//   2. **La relación vive dentro de la colección**, porque `app_data` guarda una
//      fila por (usuario, clave) y no hay dónde poner una tabla de relación —
//      que es exactamente lo que el enunciado autoriza a hacer.
//   3. **Quitar de una colección no elimina nada**, y esta librería no tiene
//      forma de hacerlo aunque quisiera.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_ELEMENTO, tipoElemento, TIPOS_VALIDOS,
  ACENTOS_COLECCION, ACENTO_POR_DEFECTO, acentoColeccion,
  ICONOS_DISPONIBLES, ICONO_POR_DEFECTO, iconoDisponible,
  MAX_NOMBRE, MAX_DESCRIPCION, CAMPOS_COLECCION, NUNCA_SE_COPIA,
  nombreValido, refValida, mismaRef,
  crearColeccion, normalizarColeccion, normalizarElementos, editarColeccion,
  alternarFavoritaColeccion, archivarColeccion, desarchivarColeccion,
  contieneElemento, anadirElemento, anadirElementos, quitarElemento,
  alternarEnColeccion, coleccionesDe,
  resolverElemento, elementosDeColeccion, contarColeccion, agruparPorTipo, tiposDe,
  MAX_PREVIEW, previewDe, nombreDelElemento,
  buscarColecciones, buscarDentro,
  FILTROS_COLECCIONES, FILTRO_COLECCIONES_POR_DEFECTO, filtrarColecciones,
  ORDENES_COLECCIONES, ORDEN_COLECCIONES_POR_DEFECTO, ordenarColecciones,
  FILTROS_DENTRO, filtrarDentro, ORDENES_DENTRO, ORDEN_DENTRO_POR_DEFECTO, ordenarDentro,
  AVISO_ELIMINAR, avisoDeEliminar,
  relacionesHuerfanas, limpiarRelaciones, absorberColeccionId,
  estadisticasColecciones, lineaColecciones,
  VACIO_COLECCIONES, VACIO_DENTRO, AISLAMIENTO_COLECCIONES,
  NO_EN_COLECCIONES, DONDE_SE_GUARDA_COLECCIONES,
} from '../src/lib/colecciones.js';
import {
  normalizarBiblioteca, miniApp, MINI_APPS,
  crearColeccion as crearDesdeBiblioteca, normalizarColeccion as normalizarDesdeBiblioteca,
} from '../src/lib/biblioteca.js';
import { crearGuardado } from '../src/lib/guardados.js';
import { crearLibro } from '../src/lib/libros.js';
import { crearIdea } from '../src/lib/ideas.js';
import { crearDocumento } from '../src/lib/documentos.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { DEFAULT_BIBLIOTECA } from '../src/tokens.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/* 🐛 Para saber si el código TOCA otra lista hay que quitar también las CADENAS:
   este archivo NOMBRA `apuntes`, `enlaces` y `bibliotecaArchivos` en sus tablas de
   documentación, y eso es español y datos, no escritura (E3 F20). */
const soloCodigo = (s) => sinComentarios(s).replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");

const LIB = leer('src/lib/colecciones.js');
const LIB_CODIGO = soloCodigo(LIB);
const VISTA = leer('src/views/LibraryView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const APP = sinComentarios(leer('src/App.jsx'));
const BIBLIOTECA = leer('src/lib/biblioteca.js');

/* ── El escenario: una biblioteca con algo de cada tipo ───────────────────── */
const bib = {
  apuntes: [
    { id: 'n1', titulo: 'Repaso biología', contenido: 'La mitosis', fecha: '2026-09-01' },
    { id: 'n2', titulo: 'Frases', contenido: 'Apuntes sueltos', fecha: '2026-09-02' },
  ],
  enlaces: [{ ...crearGuardado({ titulo: 'MDN', url: 'https://developer.mozilla.org/es/' }), id: 'g1' }],
  libros: [{ ...crearLibro({ titulo: 'Hábitos atómicos', autor: 'James Clear' }), id: 'l1' }],
  ideas: [{ ...crearIdea({ titulo: 'App de rachas' }), id: 'i1' }],
  documentos: [{ ...crearDocumento({ titulo: 'Plan de negocio', contenido: 'Objetivo…' }), id: 'd1' }],
  colecciones: [],
};
const archivos = [{ id: 'a1', tipo: 'pdf', path: 'x/a1.pdf', titulo: 'Tema 3', fecha: '2026-08-01' }];
const datos = { biblioteca: bib, archivos };

const conTodo = (base) => [['nota', 'n1'], ['guardado', 'g1'], ['libro', 'l1'], ['idea', 'i1'], ['documento', 'd1'], ['archivo', 'a1']]
  .reduce((c, [t, i]) => anadirElemento(c, t, i), base);

console.log('\n═══ 1. LA CAPA DE ORGANIZACIÓN, NO UNA SÉPTIMA MINI-APP ═══\n');

const app = miniApp('colecciones');
ok(!!app, 'Colecciones sigue siendo una de las seis mini-apps del lanzador');
eq(app.coleccion, 'colecciones', '⚠️ y su lista es `biblioteca.colecciones`, la que creó la BL F1');
eq(MINI_APPS.length, 6, '🚨 y siguen siendo SEIS: esta fase no añade ninguna');
ok(Object.keys(DEFAULT_BIBLIOTECA).includes('colecciones'),
  '⚠️ la lista existe en el valor por defecto, así que una cuenta nueva no llega sin ella');

console.log('\n═══ 2. UNA COLECCIÓN GUARDA REFERENCIAS, NO CONTENIDO ═══\n');

const c0 = crearColeccion({ nombre: 'Estudios' });
eq(Object.keys(c0).sort(), [...CAMPOS_COLECCION].sort(),
  '🚨 los diez campos declarados y ni uno más');
ok(!Object.keys(c0).some((k) => ['contenido', 'texto', 'url', 'titulo'].includes(k)),
  '🚨 y NINGUNO es contenido copiado: *"la colección únicamente referencia elementos"*');
eq(NUNCA_SE_COPIA.length, 4, '⚠️ las cuatro cosas que el enunciado prohíbe copiar están declaradas');

ok(refValida({ tipo: 'nota', id: 'n1' }), 'una referencia válida es un tipo del catálogo y un id');
ok(!refValida({ tipo: 'inventado', id: 'n1' }), '⚠️ un tipo que no está no vale');
ok(!refValida({ tipo: 'nota', id: '' }), '⚠️ ni un id vacío');
ok(!refValida(null) && !refValida('nota'), '⚠️ ni algo que no es un objeto');
ok(mismaRef({ tipo: 'nota', id: 'n1' }, { tipo: 'nota', id: 'n1' }), 'dos referencias iguales son la misma');
ok(!mismaRef({ tipo: 'nota', id: 'n1' }, { tipo: 'idea', id: 'n1' }),
  '🚨 y el TIPO cuenta: una nota y una idea pueden compartir id y no son la misma cosa');

const conNota = anadirElemento(c0, 'nota', 'n1');
eq(conNota.elementos.map((e) => ({ tipo: e.tipo, id: e.id })), [{ tipo: 'nota', id: 'n1' }],
  '🚨 una relación es `{ tipo, id }` y nada más');
ok(!JSON.stringify(conNota).includes('Repaso biología'),
  '🚨 **NO DUPLICAR**: el texto de la nota no aparece por ninguna parte dentro de la colección');
ok(!JSON.stringify(conNota).includes('mitosis'), '🚨 ni su contenido');

console.log('\n═══ 3. LOS TIPOS SON UN CATÁLOGO, UNA LÍNEA POR TIPO ═══\n');

eq(TIPOS_VALIDOS, ['libro', 'nota', 'guardado', 'idea', 'documento', 'archivo'],
  '⚠️ los cinco `item_type` del enunciado más `archivo`, que es *"incorporar nuevos tipos"*');
ok(TIPOS_ELEMENTO.every((t) => t.nombre && t.plural && t.emoji && t.icono && t.miniApp),
  '⚠️ cada línea trae su nombre, su plural, su emoji, su icono y su mini-app');
ok(TIPOS_ELEMENTO.every((t) => typeof t.textos === 'function' && typeof t.nombreDelElemento === 'function'),
  '⚠️ y cómo se busca dentro de él y cómo se llama');
ok(TIPOS_ELEMENTO.every((t) => MINI_APPS.some((m) => m.id === t.miniApp)),
  '🚨 la mini-app de cada tipo EXISTE en el lanzador: un tipo que lleve a ninguna parte no se puede abrir');
ok(TIPOS_ELEMENTO.filter((t) => t.de === 'archivos').length === 1,
  '⚠️ solo `archivo` sale de `bibliotecaArchivos`; los otros cinco, de la clave `biblioteca`');
ok(!/case\s+'(libro|nota|guardado|idea|documento|archivo)'/.test(LIB_CODIGO),
  '🚨 ni un `case` por tipo: añadir un tipo es escribir una línea en el catálogo');
eq(tipoElemento('inventado'), null, '⚠️ y un tipo que no está en el catálogo no existe');

console.log('\n═══ 4. NOMBRE OBLIGATORIO, TODO LO DEMÁS OPCIONAL ═══\n');

ok(nombreValido('Estudios'), 'un nombre con algo escrito vale');
ok(!nombreValido('   '), '⚠️ uno en blanco no');
ok(!nombreValido(''), 'ni vacío');
ok(!nombreValido(null) && !nombreValido(42), 'ni algo que no es texto');
ok(!nombreValido('x'.repeat(MAX_NOMBRE + 1)), `⚠️ ni uno de más de ${MAX_NOMBRE} caracteres`);
eq(crearColeccion({ nombre: '' }), null, '🚨 sin nombre no se crea nada: *"Nombre: obligatorio"*');
eq(crearColeccion(), null, '⚠️ ni sin argumentos');
eq(crearColeccion({ nombre: '  Estudios  ' }).nombre, 'Estudios', '⚠️ y el nombre se guarda sin espacios de más');
eq(crearColeccion({ nombre: 'X' }).descripcion, '', '⚠️ la descripción es opcional');
eq(crearColeccion({ nombre: 'X' }).icono, ICONO_POR_DEFECTO, '⚠️ el icono tiene uno por defecto');
eq(crearColeccion({ nombre: 'X' }).acento, ACENTO_POR_DEFECTO, '⚠️ y el acento también');
eq(crearColeccion({ nombre: 'X' }).elementos, [], '⚠️ y nace vacía');
eq([crearColeccion({ nombre: 'X' }).favorita, crearColeccion({ nombre: 'X' }).archivada], [false, false],
  '⚠️ ni favorita ni archivada');

console.log('\n═══ 5. EL COLOR SALE DEL SISTEMA EXISTENTE, NUNCA UN HEX ═══\n');

ok(ACENTOS_COLECCION.every((a) => a.id && a.nombre), 'cada acento tiene su id y su nombre');
ok(!/#[0-9a-fA-F]{6}/.test(LIB), '🚨 ni un hex en toda la librería: *"no crear una paleta independiente"* (regla 2)');
eq(acentoColeccion('inventado').id, ACENTO_POR_DEFECTO, '⚠️ un acento que no está cae en el por defecto');
eq(crearColeccion({ nombre: 'X', acento: 'no_existe' }).acento, ACENTO_POR_DEFECTO,
  '⚠️ y no se guarda uno inventado');
ok(ACENTOS_COLECCION.some((a) => a.id === 'accent'),
  "⚠️ `accent` está: significa *el que Josué tenga puesto*, como `colorDeTipoEvento`");
ok(/colorDeAcento/.test(VISTA_LIMPIA) && /COLORS\[id\]/.test(VISTA_LIMPIA),
  '⚠️ y quien traduce el token a color es la pantalla, donde vive `COLORS`');

console.log('\n═══ 6. EL ICONO ES SELECCIONABLE, Y SU DIBUJO ES DE LA PANTALLA ═══\n');

ok(ICONOS_DISPONIBLES.length >= 6, 'hay iconos de sobra para elegir');
ok(ICONOS_DISPONIBLES.every((i) => i.id && i.nombre), 'cada uno con su nombre en español');
ok(iconoDisponible('FolderOpen') && !iconoDisponible('NoExiste'), '⚠️ y solo valen los del catálogo');
eq(crearColeccion({ nombre: 'X', icono: 'NoExiste' }).icono, ICONO_POR_DEFECTO,
  '⚠️ uno inventado no se guarda');
ok(!/from 'lucide-react'/.test(LIB), '⚠️ la librería no importa React: los datos van aquí, los componentes en la vista');
const iconosEnVista = (VISTA.match(/const ICONOS_COLECCION = \{([^}]*)\}/) || [, ''])[1];
ok(ICONOS_DISPONIBLES.every((i) => iconosEnVista.includes(i.id)),
  '🚨 y TODOS los iconos del catálogo están en `ICONOS_COLECCION`: uno que falte sale como un hueco y no falla en ninguna parte');
const iconosTipo = (VISTA.match(/const ICONOS_TIPO_ELEMENTO = \{([^}]*)\}/) || [, ''])[1];
ok(TIPOS_ELEMENTO.every((t) => iconosTipo.includes(t.icono)),
  '🚨 y lo mismo con el icono de cada tipo de elemento');

console.log('\n═══ 7. AÑADIR NO DUPLICA, Y QUITAR NO BORRA ═══\n');

const c1 = anadirElemento(c0, 'nota', 'n1');
const c2 = anadirElemento(c1, 'nota', 'n1');
eq(c2.elementos.length, 1, '🚨 añadir dos veces lo mismo deja UNA relación, no dos');
ok(contieneElemento(c1, 'nota', 'n1'), 'y la colección sabe que lo tiene');
ok(!contieneElemento(c1, 'nota', 'n2'), 'y que no tiene lo que no ha añadido');
eq(anadirElemento(c0, 'inventado', 'x').elementos, [], '⚠️ un tipo que no existe no entra');
eq(anadirElemento(c0, 'nota', '').elementos, [], '⚠️ ni un id vacío');

const quitada = quitarElemento(c1, 'nota', 'n1');
eq(quitada.elementos, [], 'quitar se lleva la relación');
eq(bib.apuntes.find((x) => x.id === 'n1').titulo, 'Repaso biología',
  '🚨 **y la nota sigue existiendo, entera**: *"si se elimina de la colección, la nota sigue existiendo"*');
eq(resolverElemento({ tipo: 'nota', id: 'n1' }, datos).contenido, 'La mitosis',
  '🚨 y se sigue pudiendo abrir desde su mini-app');
eq(quitarElemento(c0, 'nota', 'n1'), c0, '⚠️ quitar algo que no está no cambia nada');

console.log('\n═══ 8. AÑADIR VARIOS DE UNA VEZ ═══\n');

const varios = anadirElementos(c0, [{ tipo: 'nota', id: 'n1' }, { tipo: 'libro', id: 'l1' }, { tipo: 'idea', id: 'i1' }]);
eq(varios.elementos.length, 3, '*"permitir seleccionar múltiples elementos"*');
eq(anadirElementos(varios, [{ tipo: 'nota', id: 'n1' }]).elementos.length, 3,
  '⚠️ y lo que ya estaba no se duplica');
eq(anadirElementos(c0, []).elementos, [], '⚠️ sin nada seleccionado no pasa nada');
eq(anadirElementos(c0, [{ tipo: 'malo', id: 'x' }]).elementos, [], '⚠️ y una referencia inválida no entra');
eq(anadirElementos(c0, [{ tipo: 'nota', id: 'n1' }, { tipo: 'nota', id: 'n1' }]).elementos.length, 1,
  '🚨 ni la misma dos veces en la misma tanda');

console.log('\n═══ 9. UN ELEMENTO PUEDE ESTAR EN VARIAS COLECCIONES ═══\n');

const negocio = anadirElemento({ ...crearColeccion({ nombre: 'Negocio' }), id: 'c1' }, 'documento', 'd1');
const proyectos = anadirElemento({ ...crearColeccion({ nombre: 'Proyectos' }), id: 'c2' }, 'documento', 'd1');
const importantes = anadirElemento({ ...crearColeccion({ nombre: 'Importantes' }), id: 'c3' }, 'documento', 'd1');
const tres = [negocio, proyectos, importantes];
eq(coleccionesDe(tres, 'documento', 'd1').map((c) => c.nombre), ['Negocio', 'Proyectos', 'Importantes'],
  '🚨 *"no limitar artificialmente a una sola colección"*: el mismo documento está en las tres');
eq(coleccionesDe(tres, 'documento', 'inexistente'), [], '⚠️ y uno que no está en ninguna devuelve una lista vacía');

const trasQuitar = tres.map((c) => (c.id === 'c1' ? quitarElemento(c, 'documento', 'd1') : c));
eq(coleccionesDe(trasQuitar, 'documento', 'd1').map((c) => c.nombre), ['Proyectos', 'Importantes'],
  '⚠️ y quitarlo de una no lo quita de las otras');

console.log('\n═══ 10. UN SOLO SISTEMA DE "AÑADIR A COLECCIÓN" ═══\n');

const alternado = alternarEnColeccion(tres, 'c1', 'nota', 'n1');
ok(contieneElemento(alternado[0], 'nota', 'n1'), 'alternar sobre algo que no está lo añade');
ok(!contieneElemento(alternarEnColeccion(alternado, 'c1', 'nota', 'n1')[0], 'nota', 'n1'),
  '⚠️ y sobre algo que ya está lo quita');
eq(alternarEnColeccion(tres, 'c1', 'nota', 'n1').length, 3, '⚠️ y devuelve la lista entera, no una colección suelta');
eq(alternarEnColeccion(tres, 'no_existe', 'nota', 'n1'), tres, '⚠️ una colección que no está no cambia nada');
ok(alternarEnColeccion(tres, 'c1', 'nota', 'n1')[1] === tres[1],
  '⚠️ y las demás ni se tocan: se devuelve el mismo objeto');
const usosDeAnadir = (VISTA_LIMPIA.match(/<AnadirAColeccion/g) || []).length;
ok(usosDeAnadir >= 5,
  `🚨 el MISMO componente lo montan las cinco mini-apps (${usosDeAnadir} usos): *"no crear cinco sistemas distintos"*`);
for (const t of ['libro', 'nota', 'guardado', 'idea', 'documento']) {
  ok(new RegExp(`tipo=["']${t}["']|tipoColeccion=["']${t}["']`).test(VISTA_LIMPIA),
    `⚠️ y ${t} es uno de ellos`);
}

console.log('\n═══ 11. ESTA LIBRERÍA NO PUEDE TOCAR NINGUNA OTRA LISTA ═══\n');

for (const escribe of ['crearLibro(', 'crearIdea(', 'crearGuardado(', 'crearDocumento(', 'crearApunte(']) {
  ok(!LIB_CODIGO.includes(escribe),
    `🚨 \`colecciones.js\` no llama a \`${escribe}\`: no tiene forma de crear ni de borrar un elemento`);
}
ok(!/saveData|supabase|localStorage/.test(LIB_CODIGO),
  '🚨 y no guarda nada por su cuenta: quien escribe sigue siendo `App.jsx`');
/* 🐛 **Una prueba busca el MECANISMO, no la palabra** (EH F33, sexta vez): la
   constante que dice que los elementos NO se eliminan se llama `AVISO_ELIMINAR`,
   y el barrido saltaba con la frase que hace la promesa. Se quitan los nombres
   propios antes de buscar. */
const SIN_NOMBRES = LIB_CODIGO.replace(/quitarElemento|limpiarRelaciones|avisoDeEliminar|AVISO_ELIMINAR|NUNCA_SE_COPIA/g, '');
ok(!/eliminar|borrar|delete/i.test(SIN_NOMBRES),
  '🚨 y no existe ninguna función de borrado de elementos en todo el archivo');
ok(/eliminar/i.test(`${SIN_NOMBRES}\nfunction eliminarNota(id) {}`),
  '⚠️ y la regla se pone roja con un ejemplo malo: una comprobación que no puede fallar no sirve (EH F42)');
ok(!/askAI|ask-ai|anthropic/i.test(LIB_CODIGO), '🚨 ni llama a la IA: el enunciado la prohíbe en esta fase');

console.log('\n═══ 12. RESOLVER: DE UNA REFERENCIA AL ELEMENTO DE VERDAD ═══\n');

const llena = conTodo({ ...crearColeccion({ nombre: 'Todo' }), id: 'ct' });
eq(contarColeccion(llena, datos), 6, 'los seis tipos resuelven');
eq(elementosDeColeccion(llena, datos).map((r) => r.tipo),
  ['nota', 'guardado', 'libro', 'idea', 'documento', 'archivo'],
  '⚠️ y en el orden en que se añadieron');
eq(resolverElemento({ tipo: 'archivo', id: 'a1' }, datos).titulo, 'Tema 3',
  '⚠️ un archivo se busca en `bibliotecaArchivos`, no en la clave `biblioteca`');
eq(resolverElemento({ tipo: 'nota', id: 'no_existe' }, datos), null, '⚠️ y lo que no está no resuelve');
eq(resolverElemento({ tipo: 'malo', id: 'n1' }, datos), null, '⚠️ ni un tipo desconocido');

const conFantasma = anadirElemento(llena, 'nota', 'borrada_hace_tiempo');
eq(contarColeccion(conFantasma, datos), 6,
  '🚨 **una referencia huérfana NO se cuenta**: decir "7 elementos" y enseñar 6 es peor que no decir nada');
eq(elementosDeColeccion(conFantasma, datos).length, 6, '⚠️ y no se pinta');

console.log('\n═══ 13. AGRUPAR POR TIPO, SIN CATEGORÍAS VACÍAS ═══\n');

const grupos = agruparPorTipo(elementosDeColeccion(llena, datos));
eq(grupos.length, 6, 'seis grupos con los seis tipos');
ok(grupos.every((g) => g.elementos.length > 0), '🚨 *"no mostrar categorías vacías"*: solo salen las que tienen algo');
const soloNota = agruparPorTipo(elementosDeColeccion(anadirElemento(c0, 'nota', 'n1'), datos));
eq(soloNota.length, 1, '⚠️ con una nota sola sale UN grupo, no seis');
eq(soloNota[0].tipo.id, 'nota', '⚠️ y es el suyo');
eq(agruparPorTipo([]), [], '⚠️ y sin nada, ningún grupo');
eq(tiposDe(llena, datos), ['Libro', 'Nota', 'Guardado', 'Idea', 'Documento', 'Archivo'],
  '⚠️ la línea de la tarjeta enseña los tipos que hay, en el orden del catálogo');
eq(tiposDe(c0, datos), [], '⚠️ y una colección vacía no enseña ninguno');

console.log('\n═══ 14. LA PREVIEW SALE DE DATOS REALES Y NO CARGA DE MÁS ═══\n');

eq(previewDe(llena, datos).length, MAX_PREVIEW, `*"hasta 3-4 iconos"*: como mucho ${MAX_PREVIEW}`);
ok(previewDe(llena, datos).every((p) => !!p.elemento),
  '🚨 *"la preview debe utilizar datos reales"*: cada uno es un elemento que existe');
eq(previewDe(c0, datos), [], '⚠️ una colección vacía no tiene preview');
eq(previewDe(anadirElemento(c0, 'nota', 'n1'), datos).length, 1, '⚠️ y con uno, uno');
const trescientas = { ...c0, elementos: Array.from({ length: 300 }, (_, i) => ({ tipo: 'nota', id: `n1`, fecha: '' })).map((e, i) => ({ ...e, id: i === 0 ? 'n1' : `x${i}` })) };
eq(previewDe(trescientas, datos).length, 1,
  '⚠️ *"no cargar cientos de elementos solo para crear el preview"*: corta al llegar al tope, y aquí solo uno existe');

console.log('\n═══ 15. EL NOMBRE DE UN ELEMENTO ES EL DE SU MINI-APP ═══\n');

eq(nombreDelElemento('nota', bib.apuntes[0]), 'Repaso biología', 'una nota se llama por su título');
eq(nombreDelElemento('libro', bib.libros[0]), 'Hábitos atómicos', 'un libro también');
const sinTitulo = { ...crearGuardado({ url: 'https://ejemplo.com/x' }), id: 'g9' };
ok(!/Sin t[íi]tulo/i.test(nombreDelElemento('guardado', sinTitulo)),
  '🚨 **un guardado sin título se enseña por su dominio**, nunca como *"Sin título"* (E3 F18)');
ok(nombreDelElemento('guardado', sinTitulo).includes('ejemplo.com'), '⚠️ y ése es el dominio');
eq(nombreDelElemento('malo', bib.apuntes[0]), '', '⚠️ un tipo desconocido no devuelve nada');
eq(nombreDelElemento('nota', null), '', '⚠️ ni un elemento que no está');
ok(/nombreDe\b/.test(LIB) && /nombreDoc\b/.test(LIB) && /textoDeIdea\b/.test(LIB),
  '⚠️ y se IMPORTAN los de cada mini-app: escribir aquí una segunda versión daría dos nombres para la misma cosa');

console.log('\n═══ 16. BUSCAR: FUERA POR NOMBRE, DENTRO POR EL ELEMENTO ═══\n');

const paraBuscar = [
  { ...crearColeccion({ nombre: 'Estudios', descripcion: 'Curso 2026' }), id: 'b1' },
  { ...crearColeccion({ nombre: 'Programación' }), id: 'b2' },
];
eq(buscarColecciones(paraBuscar, 'estud').map((c) => c.id), ['b1'], '*"buscar por nombre"*');
eq(buscarColecciones(paraBuscar, 'curso').map((c) => c.id), ['b1'], '*"y por descripción"*');
eq(buscarColecciones(paraBuscar, '').length, 2, '⚠️ sin texto salen todas');
eq(buscarColecciones(paraBuscar, 'nada').length, 0, '⚠️ y lo que no coincide no sale');

const dentro = elementosDeColeccion(llena, datos);
eq(buscarDentro(dentro, 'biología').map((r) => r.ref.id), ['n1'],
  '🚨 dentro se busca EN EL ELEMENTO DE VERDAD: "biología" está en la nota, no en la colección');
eq(buscarDentro(dentro, 'mitosis').map((r) => r.ref.id), ['n1'], '⚠️ también en su contenido');
eq(buscarDentro(dentro, 'James Clear').map((r) => r.ref.id), ['l1'], '⚠️ y en el autor de un libro');
eq(buscarDentro(dentro, 'mozilla').map((r) => r.ref.id), ['g1'], '⚠️ y en la dirección de un guardado');
eq(buscarDentro(dentro, '').length, 6, '⚠️ sin texto salen todos');

console.log('\n═══ 17. FILTRAR Y ORDENAR LAS COLECCIONES ═══\n');

eq(FILTROS_COLECCIONES.map((f) => f.id), ['activas', 'favoritas', 'archivadas', 'todas'],
  'los cuatro filtros de la pantalla');
eq(FILTRO_COLECCIONES_POR_DEFECTO, 'activas', '⚠️ y se entra por las activas');
const surtido = [
  { ...crearColeccion({ nombre: 'B activa' }), id: 'f1', fecha: '2026-09-01', actualizado: '2026-09-01' },
  { ...crearColeccion({ nombre: 'A favorita' }), id: 'f2', favorita: true, fecha: '2026-09-03', actualizado: '2026-09-03' },
  { ...crearColeccion({ nombre: 'C archivada' }), id: 'f3', archivada: true, fecha: '2026-09-02', actualizado: '2026-09-02' },
];
eq(filtrarColecciones(surtido, 'activas').map((c) => c.id), ['f1', 'f2'],
  '🚨 **lo archivado desaparece de lo activo**: si siguiera saliendo, archivar no haría nada visible');
eq(filtrarColecciones(surtido, 'archivadas').map((c) => c.id), ['f3'], '⚠️ y sale ENTERO en su filtro');
eq(filtrarColecciones(surtido, 'favoritas').map((c) => c.id), ['f2'], '⚠️ favoritas, solo las marcadas');
eq(filtrarColecciones(surtido, 'todas').length, 3, '⚠️ y "todas" son todas');

eq(ORDENES_COLECCIONES.map((o) => o.id), ['recientes', 'alfabetico', 'mas_elementos'],
  'los tres órdenes del enunciado');
eq(ORDEN_COLECCIONES_POR_DEFECTO, 'recientes', '⚠️ *"Por defecto: más recientes"*');
eq(ordenarColecciones(surtido, 'recientes').map((c) => c.id), ['f2', 'f3', 'f1'], '⚠️ recientes primero');
eq(ordenarColecciones(surtido, 'alfabetico').map((c) => c.id), ['f2', 'f1', 'f3'], '⚠️ alfabético por nombre');
const conElementos = [
  { ...conTodo({ ...crearColeccion({ nombre: 'Muchos' }), id: 'm1' }) },
  { ...anadirElemento({ ...crearColeccion({ nombre: 'Uno' }), id: 'm2' }, 'nota', 'n1') },
];
eq(ordenarColecciones(conElementos, 'mas_elementos', datos).map((c) => c.id), ['m1', 'm2'],
  '⚠️ y "más elementos" cuenta los que resuelven');
eq(ordenarColecciones([], 'recientes'), [], '⚠️ una lista vacía sigue vacía');
ok(ordenarColecciones(surtido, 'alfabetico') !== surtido, '⚠️ y ordenar no muta la lista que le dan');

console.log('\n═══ 18. FILTRAR Y ORDENAR DENTRO DE UNA COLECCIÓN ═══\n');

eq(FILTROS_DENTRO.map((f) => f.id), ['todo', ...TIPOS_VALIDOS],
  '⚠️ los filtros de dentro salen del CATÁLOGO: un tipo nuevo trae su filtro solo');
eq(filtrarDentro(dentro, 'todo').length, 6, '"Todo" son todos');
eq(filtrarDentro(dentro, 'nota').map((r) => r.ref.id), ['n1'], '⚠️ y cada tipo, el suyo');
eq(filtrarDentro(dentro, 'libro').length, 1, '⚠️ uno por tipo en este escenario');
eq(ORDENES_DENTRO.map((o) => o.id), ['recientes', 'alfabetico', 'tipo'], 'los tres órdenes de dentro');
eq(ORDEN_DENTRO_POR_DEFECTO, 'recientes', '⚠️ *"Por defecto: más recientes"*');
eq(ordenarDentro(dentro, 'tipo').map((r) => r.tipo), TIPOS_VALIDOS,
  '⚠️ "Tipo" ordena por el orden del catálogo');
eq(ordenarDentro(dentro, 'alfabetico')[0].ref.id, 'i1',
  '⚠️ y alfabético por el NOMBRE DEL ELEMENTO — "App de rachas" va antes que "Hábitos atómicos"');
eq(ordenarDentro(dentro, 'alfabetico').map((r) => nombreDelElemento(r.tipo, r.elemento)),
  ['App de rachas', 'Hábitos atómicos', 'MDN', 'Plan de negocio', 'Repaso biología', 'Tema 3'],
  '⚠️ los seis en orden, y cada uno con el nombre que le da su mini-app');
ok(ordenarDentro(dentro, 'tipo') !== dentro, '⚠️ y tampoco muta');

console.log('\n═══ 19. ARCHIVAR NO ES ELIMINAR, Y NO TOCA EL CONTENIDO ═══\n');

const archivada = archivarColeccion(llena);
ok(archivada.archivada, 'archivar la marca');
eq(archivada.elementos.length, llena.elementos.length,
  '🚨 *"los elementos internos NO se archivan"*: las relaciones quedan exactamente igual');
eq(contarColeccion(archivada, datos), 6, '⚠️ y siguen resolviendo, con su contenido intacto');
ok(!desarchivarColeccion(archivada).archivada, 'y se puede sacar del archivo');
eq(desarchivarColeccion(archivada).elementos.length, 6, '⚠️ sin perder nada');
ok(archivarColeccion(llena).actualizado >= llena.actualizado, '⚠️ y queda anotado cuándo se tocó');

console.log('\n═══ 20. ELIMINAR LA COLECCIÓN NO ELIMINA SU CONTENIDO ═══\n');

const aviso = avisoDeEliminar(llena, datos);
ok(aviso.titulo.includes('Todo'), 'el aviso nombra la colección');
ok(/6 referencias/.test(aviso.seVa), '⚠️ dice qué se va: la colección y sus relaciones');
eq(aviso.seQueda, AVISO_ELIMINAR, '🚨 y dice lo que se queda, con las palabras del enunciado');
eq(AVISO_ELIMINAR, 'Los elementos de esta colección no se eliminarán.',
  '🚨 *"Mostrar claramente: «Los elementos de esta colección no se eliminarán»"*');
ok(VISTA_LIMPIA.includes('aviso.seQueda'), '⚠️ y esa frase se enseña de verdad en la pantalla');
eq(avisoDeEliminar(anadirElemento(c0, 'nota', 'n1'), datos).seVa, 'La colección y su referencia.',
  '⚠️ en singular cuando es una: *"y sus 1 referencias"* es lo que pasa cuando el plural se escribe a ojo');
ok(/La colección\./.test(avisoDeEliminar(c0, datos).seVa), '⚠️ y sin referencias solo se va ella');

/* 🚨 Y esto es lo que hace que la promesa sea VERDAD, no una frase: la colección
   se borra sacándola de su lista, y las relaciones se van con ella porque están
   dentro. `App.jsx` no toca ninguna otra lista al borrarla. */
ok(/deleteColeccion = \(id\) => eliminarConPapelera\('biblioteca', 'colecciones', id\)/.test(APP),
  '🚨 borrar una colección es sacarla de `biblioteca.colecciones`, por la única puerta (ME F3)');
ok(!!CATALOGO_PAPELERA['biblioteca.colecciones'],
  '⚠️ y va a Eliminados recientes, así que se puede recuperar');

console.log('\n═══ 21. INTEGRIDAD: NI UNA RELACIÓN HUÉRFANA VISIBLE ═══\n');

const huerfanas = relacionesHuerfanas([conFantasma], datos);
eq(huerfanas.length, 1, 'una referencia a algo que ya no existe se puede auditar');
eq(huerfanas[0].id, 'borrada_hace_tiempo', '⚠️ y se dice cuál');
eq(relacionesHuerfanas([llena], datos), [], '⚠️ una colección sana no tiene ninguna');
eq(limpiarRelaciones([conFantasma], 'nota', 'borrada_hace_tiempo')[0].elementos.length, 6,
  '⚠️ y `limpiarRelaciones` la saca de todas las colecciones');
eq(limpiarRelaciones([negocio, proyectos], 'documento', 'd1').every((c) => c.elementos.length === 0), true,
  '⚠️ de todas, no solo de la primera');

console.log('\n═══ 22. EL NORMALIZADOR: LA VIGESIMOPRIMERA VEZ DE LA MISMA LECCIÓN ═══\n');

/* 🚨 La colección de la BL F1 tenía tres campos. Sin normalizar los siete
   nuevos, el primer guardado desde la pantalla nueva se llevaría el icono, el
   acento, la marca de favorita, el archivado y TODAS las relaciones (regla 5). */
const vieja = { id: 'v1', nombre: 'De la BL F1', descripcion: 'Antigua', fecha: '2026-08-01' };
const migrada = normalizarColeccion(vieja);
eq(Object.keys(migrada).sort(), [...CAMPOS_COLECCION].sort(),
  '🚨 una colección de la BL F1 llega con los diez campos');
eq(migrada.elementos, [], '⚠️ con su lista de relaciones vacía, no `undefined`');
eq([migrada.favorita, migrada.archivada], [false, false], '⚠️ ni favorita ni archivada');
eq(migrada.icono, ICONO_POR_DEFECTO, '⚠️ con icono por defecto');
eq(migrada.actualizado, '2026-08-01', '⚠️ y `actualizado` cae en su fecha de creación, no en hoy');
eq(migrada.nombre, 'De la BL F1', '⚠️ sin perder lo que tenía');
eq(normalizarColeccion({ nombre: '' }), null, '⚠️ una sin nombre se descarta');
eq(normalizarColeccion(null), null, '⚠️ y algo que no es un objeto también');
ok(!!normalizarColeccion({ nombre: 'X' }).id,
  '⚠️ **un elemento guardado sin `id` es un duplicado esperando a pasar** (EH F45): se le pone uno');
eq(normalizarColeccion({ nombre: 'X', elementos: 'no soy una lista' }).elementos, [],
  '⚠️ y una lista que no lo es se descarta');
eq(normalizarColeccion({ nombre: 'X', elementos: [{ tipo: 'malo', id: 'a' }, { tipo: 'nota', id: 'n1' }] }).elementos.map((e) => e.id),
  ['n1'], '⚠️ las referencias con un tipo desconocido no sobreviven');
eq(normalizarElementos([{ tipo: 'nota', id: 'n1' }, { tipo: 'nota', id: 'n1' }]).length, 1,
  '🚨 y las repetidas se deduplican: si no, el contador diría 13 donde hay 12');
eq(normalizarColeccion({ nombre: 'X', archivada: 'sí' }).archivada, false,
  '⚠️ un booleano que no lo es cuenta como false, nunca como true');

console.log('\n═══ 23. LA FÁBRICA SE MUDÓ, NO SE DUPLICÓ ═══\n');

ok(!/export function crearColeccion/.test(BIBLIOTECA),
  '🚨 `biblioteca.js` ya no fabrica colecciones: la fábrica vive en `colecciones.js`');
ok(!/export function normalizarColeccion/.test(BIBLIOTECA),
  '🚨 ni las normaliza');
ok(/export \{[\s\S]*?crearColeccion[\s\S]*?\}/.test(BIBLIOTECA),
  '⚠️ se reexportan con `export { X }`, nunca `export … from`: eso no crea binding local (EH F17)');
ok(!/export .*from '\.\/colecciones\.js'/.test(BIBLIOTECA),
  '⚠️ y aquí está la comprobación de que no se ha hecho así');
eq(typeof crearDesdeBiblioteca, 'function', '⚠️ quien la importe de `biblioteca.js` la sigue encontrando');
eq(typeof normalizarDesdeBiblioteca, 'function', '⚠️ y al normalizador también');
eq(crearDesdeBiblioteca({ nombre: 'X' }).elementos, [],
  '🚨 y es LA MISMA: la que reexporta `biblioteca.js` trae los diez campos');
ok(!/AnadirColeccion|FichaSimple/.test(VISTA_LIMPIA),
  '⚠️ y el formulario mínimo de la BL F1 se ha ido: dos formularios para lo mismo es el duplicado que la fase prohíbe');

console.log('\n═══ 24. LA CONTRADICCIÓN CON LA BL F4, RESUELTA ═══\n');

/* 🚨 La BL F4 preparó `coleccionId` en cada guardado; esta fase dice literalmente
   *"no asumir que todos los elementos pueden tener un `collection_id` único"*. */
const conViejoId = [{ ...crearGuardado({ titulo: 'MDN', url: 'https://x.dev' }), id: 'gx', coleccionId: 'cx' }];
const colDestino = [{ ...crearColeccion({ nombre: 'Destino' }), id: 'cx' }];
const absorbido = absorberColeccionId(colDestino, conViejoId);
ok(contieneElemento(absorbido.colecciones[0], 'guardado', 'gx'),
  '🚨 un `coleccionId` guardado pasa a ser una relación de verdad');
eq(absorbido.guardados[0].coleccionId, null,
  '🚨 y el campo se queda a `null`: una sola fuente de verdad, no dos');
eq(absorberColeccionId(colDestino, [{ id: 'g0', coleccionId: null }]).colecciones[0].elementos, [],
  '⚠️ un guardado sin colección no genera ninguna relación');
eq(absorberColeccionId(colDestino, [{ id: 'g0', coleccionId: 'no_existe' }]).colecciones[0].elementos, [],
  '⚠️ ni uno que apunta a una colección que ya no está');
eq(absorberColeccionId([], []).colecciones, [], '⚠️ y sin nada, nada');

const bibConViejo = normalizarBiblioteca({
  enlaces: [{ id: 'gz', titulo: 'X', url: 'https://x.dev', coleccionId: 'cz' }],
  colecciones: [{ id: 'cz', nombre: 'Vieja', fecha: '2026-08-01' }],
});
ok(contieneElemento(bibConViejo.colecciones[0], 'guardado', 'gz'),
  '🚨 y `normalizarBiblioteca` lo hace al cargar, sin que nadie llame a nada');
eq(bibConViejo.enlaces[0].coleccionId, null, '⚠️ dejando el campo limpio');

console.log('\n═══ 25. ESTADÍSTICAS: UNA VISTA, NUNCA UN DATO GUARDADO ═══\n');

const paraStats = [llena, { ...crearColeccion({ nombre: 'Vacía' }), id: 's2' }, archivarColeccion({ ...crearColeccion({ nombre: 'Guardada' }), id: 's3' })];
const stats = estadisticasColecciones(paraStats, datos);
eq(stats.total, 3, '*"COLECCIONES: total"*');
eq(stats.activas, 2, '*"activas"*');
eq(stats.archivadas, 1, '*"archivadas"*');
eq(stats.elementosOrganizados, 6, '*"CONTENIDO: elementos organizados"*');
eq(stats.coleccionMasGrande.nombre, 'Todo', '*"colección con más elementos"*');
ok(!/estadisticas.*=.*\{[\s\S]{0,200}guardar/i.test(LIB_CODIGO),
  '🚨 **una estadística es una vista, no un dato**: aquí no se guarda ni una cifra (E3 F13, EH F35)');

const dosVeces = [
  anadirElemento({ ...crearColeccion({ nombre: 'A' }), id: 'x1' }, 'nota', 'n1'),
  anadirElemento({ ...crearColeccion({ nombre: 'B' }), id: 'x2' }, 'nota', 'n1'),
];
eq(estadisticasColecciones(dosVeces, datos).elementosOrganizados, 1,
  '🚨 una nota en dos colecciones está organizada UNA vez, no dos');
eq(estadisticasColecciones([], datos).coleccionMasGrande, null,
  '🚨 **`null`, no un cero ni un nombre inventado**: sin colecciones no hay "la que más tiene"');
eq(estadisticasColecciones([c0], datos).coleccionMasGrande, null,
  '⚠️ ni con una vacía: una colección sin contenido no es la más llena de nada');
eq(lineaColecciones([], datos), null, '⚠️ y el lanzador no enseña nada cuando no hay nada');
ok(lineaColecciones(paraStats, datos).includes('3 colecciones'), '⚠️ con datos, la cuenta de verdad');
ok(lineaColecciones(paraStats, datos).includes('1 archivada'), '⚠️ y las archivadas');
ok(!/\d+ %/.test(lineaColecciones(paraStats, datos) || ''),
  '⚠️ y ni un porcentaje: *"no crear estadísticas complejas"*');

console.log('\n═══ 26. LOS DOS ESTADOS VACÍOS, CON SU SALIDA ═══\n');

eq(VACIO_COLECCIONES.titulo, 'Organiza tu biblioteca', 'el título del enunciado, palabra por palabra');
eq(VACIO_COLECCIONES.frase, 'Crea una colección para reunir notas, documentos, ideas y recursos relacionados.',
  '⚠️ y su frase');
eq(VACIO_COLECCIONES.boton, 'Nueva colección', '⚠️ y su botón');
eq(VACIO_DENTRO.titulo, 'Esta colección está vacía', 'y el de una colección sin contenido');
eq(VACIO_DENTRO.frase, 'Empieza añadiendo contenido de tu Biblioteca.', '⚠️ con su frase');
eq(VACIO_DENTRO.boton, 'Añadir contenido', '⚠️ y su botón');
ok(!!VACIO_COLECCIONES.boton && !!VACIO_DENTRO.boton,
  '🚨 **un vacío sin salida es una pantalla rota** (EH F41): los dos llevan botón');
ok(VISTA_LIMPIA.includes('VACIO_COLECCIONES.titulo') && VISTA_LIMPIA.includes('VACIO_DENTRO.titulo'),
  '⚠️ y los dos se pintan de verdad');

console.log('\n═══ 27. EL AISLAMIENTO ES DE LA BASE DE DATOS ═══\n');

eq(AISLAMIENTO_COLECCIONES.politicas, 'Las cuatro de `app_data`: `auth.uid() = user_id`.',
  '🚨 *"una colección únicamente puede relacionar elementos del mismo usuario"* (EH F43)');
eq(AISLAMIENTO_COLECCIONES.tablasNuevas, 0, '⚠️ y ni una tabla nueva que asegurar');
ok(!/create table|create policy/i.test(LIB), '⚠️ esta librería no trae SQL');
ok(!/user_id/.test(LIB_CODIGO),
  '🚨 y `user_id` NO es un campo de la colección: guardarlo dentro sería una copia que no protege nada');
ok(/resolverElemento/.test(LIB_CODIGO) && !/fetch\(|supabase\.from/.test(LIB_CODIGO),
  '🚨 una referencia se resuelve DENTRO de la biblioteca ya cargada: no hay ninguna consulta que pueda salir de la fila del usuario');
eq(DONDE_SE_GUARDA_COLECCIONES.filter((d) => d.nuevo).length, 0,
  '⚠️ y todo se guarda donde ya se guardaba: *"no crear una segunda base de datos"*');

console.log('\n═══ 28. LO QUE ESTA FASE NO HACE ═══\n');

ok(NO_EN_COLECCIONES.every((x) => x.que && x.porQue), 'cada cosa que no se hace dice por qué');
for (const palabra of ['anidada', 'IA', 'Sincronización', 'favoritos']) {
  ok(NO_EN_COLECCIONES.some((x) => new RegExp(palabra, 'i').test(x.que)), `⚠️ ${palabra} está declarada`);
}
ok(!/padre|parent|subcoleccion|coleccionPadre/i.test(LIB_CODIGO),
  '🚨 sin carpetas anidadas ni colecciones dentro de colecciones: el enunciado las prohíbe');
ok(!/etiquetarAutomaticamente|recomendar|sugerir/i.test(LIB_CODIGO),
  '🚨 sin etiquetado automático ni recomendaciones');
ok(!/compartir|publico|share/i.test(LIB_CODIGO),
  '🚨 y sin compartición pública: sacaría datos de la fila del usuario');
ok(CAMPOS_COLECCION.includes('favorita'),
  "⚠️ `favorita` es el mismo campo por elemento que ya tienen Guardados y Documentos, no un sistema nuevo");

console.log('\n═══ 29. LA PANTALLA ESTÁ CONECTADA DE VERDAD ═══\n');

for (const comp of ['PantallaColecciones', 'TarjetaColeccion', 'FormularioColeccion', 'DetalleColeccion',
  'SelectorDeElementos', 'AnadirAColeccion', 'FilaDeColeccion']) {
  ok(new RegExp(`export function ${comp}\\b`).test(VISTA), `⚠️ ${comp} existe`);
}
ok(/<PantallaColecciones/.test(VISTA_LIMPIA), '⚠️ y la pantalla se monta en la rama de Colecciones');
ok(/onUpdateColeccion/.test(APP) && /onSetColecciones/.test(APP),
  '🚨 y `App.jsx` le pasa las dos puertas de escritura — sin eso, editar no guardaría nada y nadie lo vería');
ok(/const updateColeccion = /.test(APP) && /const setColecciones = /.test(APP),
  '⚠️ que existen de verdad');
ok(/createPortal\(contenido, document\.body\)/.test(VISTA),
  '⚠️ y el detalle es un overlay con portal (regla 3)');
ok(/onAbrirOriginal/.test(VISTA_LIMPIA),
  '🚨 *"abrir el elemento original"*: la fila lleva a su mini-app, no a una copia');
ok(/aria-label=\{`Quitar \$\{nombre\} de la colección`\}/.test(VISTA),
  '⚠️ y el botón de quitar dice lo que hace, para quien use VoiceOver');
ok(!/<Trash2[^>]*onQuitar|onQuitar[\s\S]{0,120}Trash2/.test(VISTA_LIMPIA),
  '🚨 quitar de la colección NO lleva icono de papelera: haría creer que borra');

console.log('\n═══ 30. PERSISTENCIA Y COMPATIBILIDAD ═══\n');

const guardadoIda = normalizarBiblioteca({ ...bib, colecciones: [llena] });
eq(guardadoIda.colecciones[0].elementos.length, 6,
  '🚨 las relaciones sobreviven a una vuelta por el normalizador (regla 5)');
eq(normalizarBiblioteca(guardadoIda).colecciones[0].elementos.length, 6, '⚠️ y a dos');
eq(guardadoIda.apuntes.length, 2, '⚠️ y las notas de Josué de la Fase 11 siguen ahí');
eq(guardadoIda.libros.length, 1, '⚠️ y los libros');
eq(guardadoIda.ideas.length, 1, '⚠️ y las ideas');
eq(guardadoIda.documentos.length, 1, '⚠️ y los documentos');
eq(normalizarBiblioteca({}).colecciones, [],
  '⚠️ una cuenta sin colecciones llega con una lista vacía, no con `undefined`');
eq(normalizarBiblioteca(null).colecciones, [], '⚠️ y algo que no es un objeto tampoco revienta');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos\n`);
process.exit(fallos === 0 ? 0 : 1);
