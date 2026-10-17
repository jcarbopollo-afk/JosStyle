// ============================================================================
// NOTAS — editar una nota de la Biblioteca (v3.151.0)
//
// Josué, 2026-10-17: *"tenemos que solucionar lo de editar las notas"*. Una nota
// se creaba, se leía y se borraba desde la Fase 11, y la BL F8 lo dejó escrito en
// rojo en su auditoría. Lo que se comprueba aquí:
//
//   1. Crear y editar comparten UNA regla (título o contenido; sin título,
//      «Sin título»), y vive en `notas.js`, no en el formulario.
//   2. Editar devuelve LA MISMA nota —mismo id, misma fecha, el resto de sus
//      campos— y sube `actualizado`, el campo que leen los Recientes.
//   3. Guardar sin cambios no escribe nada, y vaciar una nota no es editarla.
//   4. La puerta está cableada: `App.jsx` escribe por `snapshotAndSave` y la
//      vista solo ofrece «Editar» si alguien lo escucha (regla 8).
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SIN_TITULO, puedeGuardarNota, crearNota, formularioDeNota, editarNota,
} from '../src/lib/notas.js';
import { normalizarBiblioteca } from '../src/lib/biblioteca.js';
import {
  recientes, buscarEnBiblioteca, auditoriaMiniApps, CAPACIDADES_MINI_APP, PENDIENTE_DE_JOSUE,
} from '../src/lib/bibliotecaGlobal.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const HOY = new Date().toLocaleDateString('sv-SE');
const LIB = leer('src/lib/notas.js');
const VISTA = leer('src/views/LibraryView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const APP = sinComentarios(leer('src/App.jsx'));

console.log('\n═══ 1. LA REGLA DE QUÉ SE PUEDE GUARDAR, UNA SOLA VEZ ═══\n');

ok(!puedeGuardarNota({ titulo: '', contenido: '' }), 'sin título ni contenido no se guarda');
ok(!puedeGuardarNota({ titulo: '   ', contenido: '\n\t ' }), '⚠️ ni con solo espacios');
ok(puedeGuardarNota({ titulo: 'Idea', contenido: '' }), 'con título basta');
ok(puedeGuardarNota({ titulo: '', contenido: 'Texto' }), 'con contenido basta: el título es opcional (BL F1)');
ok(!puedeGuardarNota(null) && !puedeGuardarNota(undefined), '⚠️ sin formulario no revienta');
ok(!puedeGuardarNota({ titulo: 42, contenido: { a: 1 } }), '⚠️ y lo que no es texto no cuenta como texto');

console.log('\n═══ 2. CREAR: LA NOTA RÁPIDA DE SIEMPRE ═══\n');

eq(crearNota({ titulo: '', contenido: '' }), null, 'una nota vacía no se crea');
const nueva = crearNota({ titulo: '', contenido: '  Especificación para Claude ' });
ok(!!nueva && typeof nueva.id === 'string' && nueva.id.length > 0, 'nace con su id');
eq(nueva.fecha, HOY, '⚠️ y con la fecha de hoy EN LOCAL (no en UTC)');
eq(nueva.titulo, SIN_TITULO, 'sin título se llama «Sin título», como desde la Fase 11');
eq(nueva.contenido, '  Especificación para Claude ', '⚠️ el contenido se guarda tal cual lo escribió: no se le recorta nada');
eq(Object.keys(nueva).sort(), ['contenido', 'fecha', 'id', 'titulo'],
  '🚨 y con la forma de un apunte de la Fase 11: ni un campo nuevo, ni una lista nueva');
ok(crearNota({ titulo: 'a' }).id !== crearNota({ titulo: 'a' }).id, 'dos notas, dos ids');
eq(crearNota({ titulo: '  Repaso  ', contenido: '' }).titulo, 'Repaso', 'el título se guarda sin espacios a los lados');

console.log('\n═══ 3. EL FORMULARIO EMPIEZA CON LO QUE TIENE ═══\n');

eq(formularioDeNota({ titulo: 'Repaso', contenido: 'Tema 3' }), { titulo: 'Repaso', contenido: 'Tema 3' },
  'al editar, el formulario trae su título y su contenido');
eq(formularioDeNota({ titulo: SIN_TITULO, contenido: 'x' }).titulo, '',
  '⚠️ «Sin título» no es un título que él escribiera: el campo empieza vacío');
eq(formularioDeNota(null), { titulo: '', contenido: '' }, '⚠️ y sin nota, vacío, sin reventar');
eq(formularioDeNota({ titulo: 7, contenido: null }), { titulo: '', contenido: '' }, '⚠️ y con datos corruptos, vacío');

console.log('\n═══ 4. EDITAR: LA MISMA NOTA, CON LO NUEVO ═══\n');

const original = { id: 'nota-1', fecha: '2026-01-10', titulo: 'Examen de Biología', contenido: 'Tema 3', extra: 'se queda' };
const copia = JSON.parse(JSON.stringify(original));
const editada = editarNota(original, { titulo: 'Examen de Biología', contenido: 'Tema 3 y 4' });
ok(!!editada && editada !== original, 'con un cambio devuelve una nota nueva');
eq(editada.id, 'nota-1', '🚨 CON EL MISMO ID: es la misma nota, no una copia');
eq(editada.fecha, '2026-01-10', '🚨 y la misma fecha: la de cuándo la escribió');
eq(editada.contenido, 'Tema 3 y 4', 'con el contenido nuevo');
eq(editada.extra, 'se queda', '⚠️ y el resto de sus campos intactos (regla 5: nada se pierde al guardar)');
eq(editada.actualizado, HOY, '🚨 y `actualizado` a hoy, en local: es lo que leen los Recientes');
eq(original, copia, '⚠️ y la original no se toca: devuelve otra, no la cambia por dentro');

eq(editarNota(original, { titulo: '  Biología  ', contenido: 'Tema 3' }).titulo, 'Biología', 'el título nuevo, sin espacios');
eq(editarNota(original, { titulo: '', contenido: 'Tema 3' }).titulo, SIN_TITULO,
  '⚠️ y si borra el título se llama «Sin título», como al crearla');

console.log('\n═══ 5. LO QUE NO ES EDITAR ═══\n');

ok(editarNota(original, { titulo: 'Examen de Biología', contenido: 'Tema 3' }) === original,
  '🚨 guardar SIN CAMBIOS devuelve la misma nota: ni sube a Recientes ni deja un Deshacer vacío');
const sinTitulo = { id: 'n2', fecha: '2026-01-11', titulo: SIN_TITULO, contenido: 'algo' };
ok(editarNota(sinTitulo, { titulo: '', contenido: 'algo' }) === sinTitulo,
  '⚠️ tampoco cambia una «Sin título» que se guarda con el campo vacío');
ok(editarNota(original, { titulo: 'Otro', contenido: 'Tema 3' }) !== original,
  '…y esa comprobación sí se pone roja cuando hay un cambio de verdad');
eq(editarNota(original, { titulo: '', contenido: '   ' }), null,
  '🚨 VACIARLA no es editarla: no se guarda nada (para eso está «Eliminar», que la lleva a Eliminados)');
eq(editarNota(null, { titulo: 'x' }), null, '⚠️ sin nota, nada');
eq(editarNota({ titulo: 'sin id' }, { titulo: 'x' }), null, '⚠️ y sin id no hay a quién sustituir');

console.log('\n═══ 6. LO EDITADO SE QUEDA, SE ENCUENTRA Y SUBE A RECIENTES ═══\n');

const otra = { id: 'nota-2', fecha: '2026-02-01', titulo: 'Lista de la compra', contenido: 'pan' };
const antes = { apuntes: [original, otra] };
const guardada = normalizarBiblioteca({ ...antes, apuntes: antes.apuntes.map((a) => (a.id === editada.id ? editada : a)) });
eq(guardada.apuntes.find((a) => a.id === 'nota-1').contenido, 'Tema 3 y 4',
  '🚨 la puerta de carga conserva lo editado: al recargar sigue ahí');
eq(guardada.apuntes.find((a) => a.id === 'nota-1').actualizado, HOY, '⚠️ con su `actualizado`');
eq(guardada.apuntes.length, 2, '⚠️ y sin duplicar: dos notas antes, dos después');

const datosAntes = { biblioteca: normalizarBiblioteca(antes), archivos: [] };
const datosDespues = { biblioteca: guardada, archivos: [] };
eq(recientes(datosAntes)[0].id, 'nota-2', 'antes de editar, la más reciente era la de febrero');
eq(recientes(datosDespues)[0].id, 'nota-1', '🚨 al editar la de enero, sube a la primera de Recientes');
ok(buscarEnBiblioteca(datosDespues, 'tema 3 y 4').some((r) => r.id === 'nota-1'),
  '🚨 y la búsqueda global la encuentra por lo que dice AHORA');
ok(!buscarEnBiblioteca(datosAntes, 'tema 3 y 4').some((r) => r.id === 'nota-1'),
  '…y esa búsqueda no la encontraba antes: la comprobación mide algo');

console.log('\n═══ 7. LA AUDITORÍA DE LA BL F8, EN VERDE PORQUE EXISTE ═══\n');

const notasAud = auditoriaMiniApps().find((a) => a.id === 'notas');
ok(notasAud && notasAud.completa, '🔓 Notas está completa: crear, escribir, guardar, EDITAR, buscar, eliminar');
eq(CAPACIDADES_MINI_APP.notas.find((c) => c.id === 'editar').fn, 'editarNota',
  '⚠️ y la casilla nombra la función de verdad');
ok(/export function editarNota\b/.test(LIB), '🚨 que existe en `notas.js`');
ok(!PENDIENTE_DE_JOSUE.some((p) => /Editar una nota/i.test(p.que)), '🔓 y «Editar una nota» ya no está pendiente de él');

console.log('\n═══ 8. LA PUERTA, ABIERTA EN EL ARCHIVO QUE LA CABLEA ═══\n');

ok(/const updateApunte = \(a\) => a && snapshotAndSave\(\{/.test(APP),
  '🚨 `App.jsx` escribe la nota editada por `snapshotAndSave`: Deshacer la devuelve como estaba');
ok(/apuntes: biblioteca\.apuntes\.map\(\(x\) => \(x\.id === a\.id \? a : x\)\)/.test(APP),
  '🚨 y la SUSTITUYE en su sitio por id: ni una copia, ni la lista entera de otra clave');
ok(/onUpdateApunte=\{updateApunte\}/.test(APP),
  '🚨 Y ALGUIEN SE LA PASA A LA BIBLIOTECA: una función que nadie llama no falla nunca (E3 F1)');
ok(/onAddApunte, onDeleteApunte, onUpdateApunte,/.test(VISTA_LIMPIA), '…y la vista la recibe');
ok(/onEditar=\{onUpdateApunte \? /.test(VISTA_LIMPIA),
  '🚨 «Editar» solo se ofrece si hay quien lo escuche (regla 8)');
ok(/esApunte && onEditar && \(/.test(VISTA_LIMPIA), '⚠️ y solo en las notas, no en los archivos ni los enlaces');
ok(/notaEditando === a\.id \? \(/.test(VISTA_LIMPIA) && /<AnadirNotaRapida\s+key=\{a\.id\}\s+nota=\{a\}/.test(VISTA_LIMPIA),
  '🚨 al pulsarlo, el formulario de la nota ocupa el sitio de su ficha');
ok(/if \(editada !== a\) onUpdateApunte\(editada\)/.test(VISTA_LIMPIA),
  '⚠️ y guardar sin cambios no escribe nada');

/* ⚠️ Hasta la función siguiente, no hasta `AnadirLibro`: entre las dos hay cuatro
   componentes más, y el barrido de «Sin título» los miraba también. */
const formulario = VISTA.slice(VISTA.indexOf('export function AnadirNotaRapida'), VISTA.indexOf('export function TarjetaMiniApp'));
ok(/crearNota\(form\)/.test(formulario) && /editarNota\(nota, form\)/.test(formulario) && /puedeGuardarNota\(form\)/.test(formulario),
  '🚨 el formulario usa la regla de `notas.js` para crear Y para editar');
ok(!/'Sin título'/.test(formulario), '⚠️ y no escribe a mano «Sin título»: lo pone la librería');
ok(/editando \? 'Guardar cambios' : 'Guardar nota'/.test(formulario),
  '⚠️ el botón dice lo que hace: «Guardar cambios» al editar, «Guardar nota» al crear');
ok(/editando && onCancelar \?/.test(formulario), '⚠️ y al editar se puede cancelar');
ok(formulario.indexOf('Textarea') < formulario.indexOf('Título (opcional)'),
  '⚠️ y sigue siendo la nota rápida: el texto antes que el título (BL F1)');

console.log('\n═══ 9. LA LIBRERÍA NO GUARDA NADA ═══\n');

const LIB_CODIGO = sinComentarios(LIB);
ok(!/saveData|supabase|localStorage/.test(LIB_CODIGO), '🚨 `notas.js` calcula; quien guarda es `App.jsx`');
ok(!/toISOString/.test(LIB_CODIGO), '⚠️ y ni una fecha en UTC: en España devolvería el día equivocado');
ok(!/notas:\s*\[|DEFAULT_NOTAS/.test(LIB_CODIGO), '🚨 ni una lista de notas aparte: una nota ES un apunte de la Fase 11');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos\n`);
process.exit(fallos === 0 ? 0 : 1);
