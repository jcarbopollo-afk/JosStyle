// ============================================================================
// ESTUDIOS — editar un examen (2026-10-18)
//
// Josué: los exámenes no se pueden editar. La causa: se pintan con `ExamenItem`
// (Fase 6, por su plan de repaso), y esa tarjeta no tenía forma de editar. La
// edición estaba escrita (`accionesFecha.examen.editar`, ES F4) pero solo la
// llamaba el panel de fechas, que no pintan los exámenes. Lo que se comprueba:
//
//   1. La traducción examen guardado (`tema`) ↔ formulario (`nombre`) vive en
//      `fechasAcademicas.js`, y editar conserva el id y todo lo que no se toca.
//   2. Sin cambios no se escribe; un id que no existe no crea nada.
//   3. La puerta está cableada en las DOS pantallas que pintan exámenes.
//   4. El formulario no dice «guardado» si no ha llegado (`{ ok }` de saveData),
//      y una respuesta vieja no pinta nada (turnos).
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formularioDeExamen, cambiosDeExamen, editarExamen, editarExamenFecha, textoDeFalloAlGuardar,
  FALLO_AL_GUARDAR, MAX_NOTA_EXAMEN, fechasAcademicas, normalizarExamen,
} from '../src/lib/fechasAcademicas.js';
import { resultadoDeGuardados, ERROR_CARGA_FALLIDA } from '../src/lib/sincronizacion.js';
import { auditarAsincronia } from '../src/lib/estadosAsincronos.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '{}');

const VISTA_BRUTA = leer('src/views/EstudiosView.jsx');
const VISTA = sinComentarios(VISTA_BRUTA);
const APP = sinComentarios(leer('src/App.jsx'));

const EX = {
  id: 'ex1', asignaturaId: 'mat', tema: 'Derivadas', fecha: '2026-11-03', hora: '09:00',
  notas: 'Tema 4', estado: 'proximo', notaObjetivo: '8', notaObtenida: '', planRepaso: [{ dia: '2026-11-01', texto: 'Repasar' }],
};
const OTRO = { id: 'ex2', asignaturaId: 'bio', tema: 'Célula', fecha: '2026-11-10', hora: null, notas: null, estado: 'proximo', notaObjetivo: '', notaObtenida: '', planRepaso: [] };
const LISTA = [EX, OTRO];

console.log('\n1 · El formulario empieza con TODO lo que tiene el examen');
const f = formularioDeExamen(EX);
eq(f, { nombre: 'Derivadas', asignaturaId: 'mat', fecha: '2026-11-03', hora: '09:00', notas: 'Tema 4', notaObjetivo: '8', notaObtenida: '' },
  'nombre (tema), asignatura, fecha, hora, notas y las dos notas');
eq(formularioDeExamen({ id: 'x', asignaturaId: 'a', tema: 'T', fecha: null, hora: null, notas: null }),
  { nombre: 'T', asignaturaId: 'a', fecha: '', hora: '', notas: '', notaObjetivo: '', notaObtenida: '' },
  'un examen sin fecha empieza con el campo vacío, nunca con hoy');
eq(formularioDeExamen({ tema: 'X', fecha: '2026-13-45', hora: '25:99', notaObjetivo: 9 }).fecha, '', 'una fecha imposible no se carga');
eq(formularioDeExamen({ notaObjetivo: 9 }).notaObjetivo, '9', 'una nota guardada como número se lee como texto');
eq(formularioDeExamen(null).nombre, '', 'sin examen, un formulario vacío (no lanza)');

console.log('\n2 · Editar cambia SOLO lo editado, y conserva el id');
const e1 = editarExamen(LISTA, 'ex1', { ...f, nombre: 'Derivadas e integrales' });
const n1 = e1.find((e) => e.id === 'ex1');
eq(n1.tema, 'Derivadas e integrales', 'el nombre cambia');
eq([n1.id, n1.asignaturaId, n1.fecha, n1.hora, n1.notas, n1.estado, n1.notaObjetivo], ['ex1', 'mat', '2026-11-03', '09:00', 'Tema 4', 'proximo', '8'], 'el resto, igual');
eq(n1.planRepaso, EX.planRepaso, '🚨 el plan de repaso de la IA no se pierde');
eq(e1.length, 2, '🚨 ni un duplicado');
ok(e1.find((e) => e.id === 'ex2') === OTRO, 'el otro examen es el MISMO objeto');
ok(LISTA[0].tema === 'Derivadas', 'la lista original no se toca');

const e2 = editarExamen(LISTA, 'ex1', { ...f, fecha: '2026-11-20' });
eq(e2[0].fecha, '2026-11-20', 'la fecha cambia');
const e3 = editarExamen(LISTA, 'ex1', { ...f, hora: '11:30', notas: 'Traer calculadora', notaObjetivo: ' 9 ', notaObtenida: '7,5' });
eq([e3[0].hora, e3[0].notas, e3[0].notaObjetivo, e3[0].notaObtenida], ['11:30', 'Traer calculadora', '9', '7,5'], 'hora, notas y las dos notas cambian');
const e4 = editarExamen(LISTA, 'ex1', { ...f, hora: '', notas: '' });
eq([e4[0].hora, e4[0].notas], [null, null], 'vaciar la hora o las notas las quita (opcionales)');
const e5 = editarExamen(LISTA, 'ex1', { ...f, notaObjetivo: 'x'.repeat(50) });
eq(e5[0].notaObjetivo.length, MAX_NOTA_EXAMEN, 'la nota tiene tope');
const e6 = editarExamen(LISTA, 'ex1', { ...f, asignaturaId: 'bio' });
eq(e6[0].asignaturaId, 'mat', '⚠️ la asignatura no se cambia por la puerta de atrás (ES F3)');
const e7 = editarExamen(LISTA, 'ex1', { ...f, fecha: '2026-13-45' });
eq(e7[0].fecha, null, 'una fecha imposible no se guarda');

console.log('\n3 · Sin cambios no se escribe, y un id que no existe no crea nada');
ok(editarExamen(LISTA, 'ex1', f) === LISTA, '🚨 guardar sin cambios devuelve LA MISMA lista (no escribe, no deja Deshacer vacío)');
ok(editarExamen(LISTA, 'no-existe', { ...f, nombre: 'Nuevo' }) === LISTA, 'un id que no existe no añade un examen');
ok(Array.isArray(editarExamen(null, 'ex1', f)) && editarExamen(null, 'ex1', f).length === 0, 'sin lista, una lista vacía');
eq(cambiosDeExamen({ nombre: 'A', fecha: '', hora: '', notas: '' }), { tema: 'A', fecha: null, hora: null, notas: '' }, 'al crear (sin notas de examen) no se pisa ninguna nota');
ok(!('notaObtenida' in cambiosDeExamen({ nombre: 'A', notaObjetivo: '8' })), 'crear no toca la nota obtenida');

console.log('\n4 · Se ve igual en TODAS las vistas: es la misma lista');
const est = { examenes: e1, entregas: [], eventos: [] };
eq(fechasAcademicas(est).filter((x) => x.tipo === 'examen').map((x) => x.nombre), ['Derivadas e integrales', 'Célula'],
  'el Home, la asignatura, el área y el Calendario leen el nombre nuevo (fechasAcademicas)');
eq(normalizarExamen(n1).tema, 'Derivadas e integrales', 'y la puerta de carga lo deja como está (persiste al recargar)');
eq(editarExamenFecha(LISTA, 'ex1', { tema: 'Z' })[0].id, 'ex1', 'la función de la ES F4 sigue haciendo lo mismo');

console.log('\n5 · El resultado del guardado');
eq(await resultadoDeGuardados([Promise.resolve({ ok: true, error: null }), { ok: true }]), { ok: true, error: null }, 'todos llegan → ok');
const malo = await resultadoDeGuardados([Promise.resolve({ ok: true }), Promise.resolve({ ok: false, error: { message: 'x' } })]);
ok(malo.ok === false && malo.error.message === 'x', 'uno que no llega → ese');
const lanza = await resultadoDeGuardados([Promise.reject(new Error('red'))]);
ok(lanza.ok === false && lanza.error.message === 'red', 'uno que lanza cuenta como no llegado (y no rechaza)');
eq(await resultadoDeGuardados([]), { ok: true, error: null }, 'nada que guardar → ok');
eq(textoDeFalloAlGuardar({ ok: false, error: { message: 'HTTP 500' } }), FALLO_AL_GUARDAR, 'un fallo cualquiera tiene su texto');
eq(textoDeFalloAlGuardar(null), FALLO_AL_GUARDAR, 'sin saber por qué, sigue habiendo aviso');
ok(textoDeFalloAlGuardar({ ok: false, bloqueado: true, error: ERROR_CARGA_FALLIDA }).startsWith(ERROR_CARGA_FALLIDA.message), 'si Estudios no cargó, lo dice');
ok(!/null|undefined|Error:/.test(textoDeFalloAlGuardar({ ok: false, error: { code: 'x' } })), 'ni una palabra técnica');

console.log('\n6 · La puerta, cableada (leyendo el código)');
const item = VISTA.slice(VISTA.indexOf('function ExamenItem('), VISTA.indexOf('function FilaAsignatura('));
ok(/onEditar/.test(item.split('\n')[0]), 'ExamenItem recibe `onEditar`');
ok(/aria-label=\{`Editar el examen/.test(item) && /setEditando\(true\)/.test(item), '🚨 y tiene su botón «Editar», con nombre para VoiceOver');
ok(/<FormFecha[\s\S]*?tipo="examen"[\s\S]*?inicial=\{\{ id: examen\.id, \.\.\.formularioDeExamen\(examen\) \}\}/.test(item), '🚨 que abre EL MISMO formulario de crear, con lo que tiene el examen');
ok(/onGuardado=\{\(\) => setEditando\(false\)\}/.test(item) && /onCerrar=\{\(\) => setEditando\(false\)\}/.test(item), 'se cierra al guardar bien o al cancelar');
ok(/\{onEditar && \(/.test(item), 'sin quien lo escuche, no se pinta (regla 8)');
const usos = VISTA.match(/<ExamenItem[\s\S]*?\/>/g) || [];
ok(usos.length === 2, 'las dos pantallas que pintan exámenes (asignatura y área)');
ok(usos.every((u) => /onEditar=\{accionesFecha\.examen\.editar\}/.test(u)), '🚨 LAS DOS le pasan la edición');
ok(usos.every((u) => /onDelete=\{onDeleteExamen\}/.test(u)), 'y borrar sigue igual');
const form = VISTA.slice(VISTA.indexOf('function FormFecha('), VISTA.indexOf('function DetalleFecha('));
ok(/const turno = turnos\.nuevo\(\)/.test(form) && /if \(!turno\.vigente\(\)\) return;/.test(form), '🚨 una respuesta vieja no pinta nada (turnos)');
ok(/res && res\.ok === false\) setFallo\(textoDeFalloAlGuardar\(res\)\)/.test(form), '🚨 un guardado que no llega se dice, y el formulario no se cierra');
ok(/finally \{\s*if \(turno\.vigente\(\)\) setGuardando\(false\);/.test(form), 'la espera vuelve a reposo en un finally (MS F16)');
ok(/estado=\{guardando \? 'cargando' : undefined\}/.test(form), 'el botón espera con «Guardando…» y no repite (F9)');
ok(/<MensajeDeCampo id=\{idFallo\}>\{fallo\}<\/MensajeDeCampo>/.test(form), 'el fallo con `MensajeDeCampo` (role=alert)');
ok(/if \(!r \|\| typeof r\.then !== 'function'\) return;/.test(form), 'sin promesa, como antes (entregas, eventos y crear)');
ok(/inicial \? \(inicial\.fecha \|\| ''\) : todayISO\(\)/.test(form), 'editar algo sin fecha no le pone hoy');
ok(/\{inicial && \([\s\S]*?Cancelar/.test(form), 'al editar hay «Cancelar»');
const acc = VISTA.slice(VISTA.indexOf('const accionesFecha = {'), VISTA.indexOf('entrega: {', VISTA.indexOf('const accionesFecha = {')));
ok(/editarExamen\(actuales, id, d\)/.test(acc), 'la acción edita con `editarExamen`');
ok(/resumenSincronizacion\(\)\.pendientes\.includes\('estudios'\)/.test(acc) && /nuevos === actuales && !pendiente/.test(acc),
  '🚨 tras un fallo, «Guardar» otra vez es el reintento: se vuelve a mandar');
ok(/return Promise\.resolve\(onUpdateExamenes\(nuevos\)\)/.test(acc), 'y devuelve el resultado del guardado');
ok(/crear: \(d\) => onAddExamen\(/.test(acc), 'crear sigue');
const snap = APP.slice(APP.indexOf('const snapshotAndSave = (patch) => {'), APP.indexOf('const addSueno'));
ok(/return resultadoDeGuardados\(guardados\);/.test(snap), '🚨 `snapshotAndSave` devuelve lo que contestó saveData');
ok(/guardados\.push\(saveData\(uidUser, 'estudios', patch\.estudios\)\)/.test(snap), 'y Estudios entra en esa cuenta');
ok((snap.match(/guardados\.push\(saveData/g) || []).length === (snap.match(/saveData\(uidUser, '/g) || []).length - 1, 'todas las claves menos el historial de Deshacer');
ok(/const updateExamenes = \(examenes\) => snapshotAndSave\(/.test(APP), '`updateExamenes` devuelve ese resultado');
const asin = auditarAsincronia({ archivos: { 'src/views/EstudiosView.jsx': VISTA_BRUTA } });
eq(asin.map((p) => `${p.regla}:${p.linea}`), [], 'la auditoría de asincronía (MS F16) no caza nada en Estudios');

console.log(`\n${n - fallos}/${n} comprobaciones${fallos ? ` · ${fallos} FALLOS` : ''}`);
process.exit(fallos ? 1 : 0);
