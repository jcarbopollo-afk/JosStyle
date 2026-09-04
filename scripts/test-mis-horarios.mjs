// ============================================================================
// ENTREGA 3 · FASE 5 — HORARIO: UX, NAVEGACIÓN Y GESTIÓN DE HORARIOS
//
// Los diez puntos del criterio final de aceptación, y sobre todo el primero:
//
// 🐛 **`eliminarHorario` EXISTÍA DESDE HT F2 Y NADIE LA LLAMABA.** Con su
// borrado en cascada de bloques y excepciones, escrita y probada… y muerta: la
// única acción destructiva que ofrecía la interfaz era *Archivar*, así que un
// horario de un curso pasado se quedaba dentro para siempre. Es el mismo fallo
// que la papelera de Economía de la F1, en otro sitio: **una función que nadie
// llama no falla nunca**.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SECCIONES_HORARIO, seccionHorario, ACCIONES_HORARIO, accionHorario, accionesDe,
  impactoEliminarHorario, eliminarDeVerdad, misHorarios, VACIO_HORARIOS,
} from '../src/lib/misHorarios.js';
import { normalizarHorarioTop } from '../src/lib/horario.js';
import { archivarHorario } from '../src/lib/horarioEstructura.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ `sinComentarios` NO ES UN ANALIZADOR — la lección de EH F39, otra vez.
// El primer intento quitaba los comentarios JSX con un patrón de "llave, más
// comentario, más llave", y ese patrón SE COMIÓ 500 LÍNEAS DE CÓDIGO DE VERDAD:
// un `(() => {` seguido de un comentario abre la llave, y el cierre del patrón
// se va a buscar la primera llave que venga después del SIGUIENTE cierre de
// comentario. La comprobación del botón de eliminar saltaba con algo que estaba
// perfectamente escrito.
// Lo correcto es al revés: quitar primero los bloques de comentario y después
// las llaves que se hayan quedado vacías.
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

// Un estado con dos horarios, clases y una excepción.
const estado = normalizarHorarioTop({
  horarios: [
    { id: 'h1', nombre: 'Bachillerato', activo: true, archivado: false },
    { id: 'h2', nombre: 'Horario de verano', activo: true, archivado: false },
  ],
  actividades: [{ id: 'a1', titulo: 'Matemáticas', estado: 'activa' }],
  // ⚠️ Un bloque necesita `horarioId` Y `columnaId`: `normalizarHorarioTop` los
  // descarta sin columna, porque sin ella no tienen "cuándo". Escribir aquí un
  // `dia: 1` daba cero bloques y se estaba midiendo sobre una lista vacía — la
  // lección de EH F44: un escenario de prueba tiene que pasar por los
  // normalizadores para que sus cifras signifiquen algo.
  columnas: [{ id: 'c1', horarioId: 'h1', nombre: 'Lunes' }, { id: 'c2', horarioId: 'h2', nombre: 'Lunes' }],
  bloques: [
    { id: 'b1', horarioId: 'h1', columnaId: 'c1', inicio: '08:00', fin: '09:00', actividadId: 'a1' },
    { id: 'b2', horarioId: 'h1', columnaId: 'c1', inicio: '09:00', fin: '10:00', actividadId: 'a1' },
    { id: 'b3', horarioId: 'h2', columnaId: 'c2', inicio: '10:00', fin: '11:00', actividadId: 'a1' },
  ],
  excepciones: [{ id: 'x1', horarioId: 'h1', bloqueId: 'b1', fecha: '2026-09-10', tipo: 'cancelada' }],
});

console.log('\n═══ 1. ELIMINAR DE VERDAD (apartado 3) ═══\n');

const imp = impactoEliminarHorario(estado, 'h1');
ok(!!imp, 'se puede saber qué se lleva por delante eliminar un horario');
eq([imp.bloques, imp.excepciones], [2, 1], 'y cuenta sus clases y sus excepciones de verdad, no una frase genérica');
eq(imp.quedan, 1, 'y cuántos horarios quedarían');
ok(/Bachillerato/.test(imp.texto) && /2 clases/.test(imp.texto), 'el aviso nombra el horario y lo que se borra');
ok(/permanente/i.test(imp.aviso),
  '🚨 y dice que la acción es PERMANENTE (apartado 3, punto 3)');
ok(/no se puede recuperar/i.test(imp.aviso),
  '⚠️ y dice que NO se puede recuperar: un horario no va a la papelera, y prometerlo sería mentir (EH F41)');
ok(imp.conservaActividades && /no se tocan/.test(imp.seConserva),
  '⚠️ las asignaturas NO se borran: son de Estudios y las usan los demás horarios');
eq(impactoEliminarHorario(estado, 'no_existe'), null, 'y de un horario que no existe no se inventa un impacto');

// 🚨 El patrón `aplicarPlan`: sin confirmar no se borra nada.
eq(eliminarDeVerdad(estado, 'h1').horarios.length, 2,
  '🚨 sin `confirmado` NO borra nada: la confirmación del apartado 3 no es decorativa');
const tras = eliminarDeVerdad(estado, 'h1', { confirmado: true });
eq(tras.horarios.map((h) => h.id), ['h2'], 'con `confirmado`, el horario se va');
eq(tras.bloques.map((b) => b.id), ['b3'], '🚨 y se lleva SUS clases, sin tocar las del otro horario');
eq(tras.excepciones, [], 'y sus excepciones');
eq(tras.actividades.length, 1, '⚠️ pero la asignatura sigue: la usa el horario que queda');

console.log('\n═══ 2. ARCHIVAR Y ELIMINAR SON DOS COSAS (apartados 3 y 4) ═══\n');

const archivado = archivarHorario(estado, 'h2');
eq(archivado.horarios.length, 2, 'archivar NO borra: el horario sigue ahí');
eq(archivado.bloques.length, 3, 'y sus clases también');

const panel = misHorarios(archivado, 'h1');
eq(panel.activos.map((h) => h.id), ['h1'], '🚨 los activos y los archivados van en listas separadas (apartado 4)');
eq(panel.archivados.map((h) => h.id), ['h2'], 'y el archivado está en la suya');
ok(panel.activos[0].enUso, 'y se sabe cuál se está usando');
ok(!panel.vacio && !panel.soloArchivados, 'con un horario activo, ni vacío ni solo-archivados');

const soloArch = misHorarios(archivarHorario(archivado, 'h1'), null);
ok(soloArch.soloArchivados && !soloArch.vacio,
  '⚠️ "todos archivados" NO es "vacío": ahí sí hay horarios, y esconderlos sería un callejón sin salida');
ok(misHorarios({ horarios: [], bloques: [], excepciones: [], actividades: [] }).vacio,
  'y sin ninguno, vacío');

console.log('\n═══ 3. LAS ACCIONES DE UN HORARIO (apartados 3 y 8) ═══\n');

eq(ACCIONES_HORARIO.map((a) => a.id), ['activar', 'editar', 'duplicar', 'archivar', 'eliminar'],
  'están las cinco acciones, con Eliminar entre ellas');
eq(ACCIONES_HORARIO.filter((a) => a.destructiva).map((a) => a.id), ['eliminar'],
  '🚨 y SOLO eliminar pide confirmación: un aviso delante de cada toque enseña a no leerlos (EH F61)');
eq(ACCIONES_HORARIO.filter((a) => a.principal).map((a) => a.id), ['activar'],
  '⚠️ activar es la principal; editar, duplicar, archivar y eliminar son secundarias (apartado 8)');
ok(ACCIONES_HORARIO.every((a) => a.explica && a.explica.length > 10), 'y cada una explica qué hace');
ok(!accionHorario('inventada'), 'una acción que no existe no se inventa');

ok(!accionesDe(archivado, 'h2').some((a) => a.id === 'archivar'),
  '⚠️ un horario archivado no se archiva otra vez');
ok(accionesDe(archivado, 'h2').some((a) => a.id === 'eliminar'),
  '🚨 pero sí se puede eliminar definitivamente desde ahí (apartado 4)');
ok(accionesDe(archivado, 'h2').some((a) => a.id === 'activar'), 'y restaurarlo');
eq(accionesDe(estado, 'no_existe'), [], 'y de uno que no existe, ninguna');

console.log('\n═══ 4. PLANIFICACIÓN NO ES MIS HORARIOS (apartados 1, 2, 5 y 6) ═══\n');

eq(SECCIONES_HORARIO.map((s) => s.id), ['planificacion', 'mis_horarios'],
  'las dos secciones que Josué quiere separar');
ok(SECCIONES_HORARIO.every((s) => s.titulo && s.explica),
  'y cada una dice qué es en una frase');
eq(seccionHorario('inventada').id, 'planificacion', 'una sección que no existe cae en la primera');

ok(VACIO_HORARIOS.titulo === 'Aún no tienes ningún horario'
  && /Crea tu horario/.test(VACIO_HORARIOS.explica),
  '⚠️ y el estado vacío usa las palabras del apartado 7');

console.log('\n═══ 5. NO SE RECALCULA NADA DEL HORARIO (apartado 9) ═══\n');

const LIB = sinComentarios(leer('src/lib/misHorarios.js'));
ok(/from '\.\/horario'/.test(LIB) && /from '\.\/horarioEstructura'/.test(LIB),
  '⚠️ esta capa importa lo que ya existe (HT F2 y F4), no lo reescribe');
for (const suyo of ['normalizarBloque', 'rejillaSemana', 'vistaAgenda', 'crearHorario']) {
  ok(!new RegExp(`function ${suyo}`).test(LIB),
    `  · no redefine \`${suyo}\`: decide qué llamar, como \`gestionModulos.js\``);
}
ok(!/saveData|supabase/i.test(LIB), 'y no guarda por su cuenta');

console.log('\n═══ 6. EN LA PANTALLA ═══\n');

const VISTA = sinComentarios(leer('src/views/HorarioView.jsx'));
ok(/eliminarDeVerdad\(estado, horario\.id, \{ confirmado: true \}\)/.test(VISTA),
  '🚨 el botón de eliminar llama de verdad al borrado, y confirmado');
ok(/impactoEliminarHorario/.test(VISTA), 'y enseña el impacto antes');
ok(/label="Archivar"/.test(VISTA) && /label="Eliminar"/.test(VISTA),
  '🚨 Archivar y Eliminar están LOS DOS: el enunciado prohíbe sustituir uno por otro');
ok(/Restaurar/.test(VISTA) && /Duplicar/.test(VISTA),
  'y los archivados se pueden restaurar y duplicar (apartado 4)');
ok((VISTA.match(/seccionHorario\('(planificacion|mis_horarios)'\)/g) || []).length >= 2,
  '⚠️ y las dos secciones tienen su rótulo en pantalla (apartados 2 y 6)');
ok(/VACIO_HORARIOS\.titulo/.test(VISTA), 'el estado vacío usa los textos del apartado 7');

// Apartado 9 — *"no rehacer visualmente todo el apartado Horario"*.
for (const pieza of ['VISTAS_HORARIO', 'rejillaSemana', 'vistaAgenda', 'contextoTemporal', 'duplicarHorario', 'archivarHorario']) {
  ok(VISTA.includes(pieza), `⚠️ \`${pieza}\` sigue en su sitio: esta fase es UX y gestión, no un rediseño (apartado 9)`);
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
