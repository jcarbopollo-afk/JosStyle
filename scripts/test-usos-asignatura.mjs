/* ===========================================================================
   AS F2 — quitar ≠ eliminar, y los usos antes de borrar.

   Josué: *"Quitar una asignatura de un lugar NO es lo mismo que eliminar la
   asignatura del sistema."* Las ocho pruebas obligatorias de su enunciado están
   aquí abajo, con su número.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  usosDeAsignatura, avisoEliminarAsignatura, quitarBloqueDelHorario,
  limpiarHorarioDeAsignatura, referenciasColgando, desligarPrograma,
  ELIMINAR_PROGRAMA, ELIMINAR_HORARIO, QUITAR_NO_ES_ELIMINAR, condicionAS2,
} from '../src/lib/usosAsignatura.js';
import {
  catalogoAsignaturas, asignaturasDePrograma, quitarDePrograma, anadirAPrograma,
  normalizarAsignaturasDe, usaPrograma,
} from '../src/lib/asignaturas.js';
import { normalizarHorarioTop, crearHorario } from '../src/lib/horario.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(a === b, `${m}${a === b ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const sinComentarios = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:\w])\/\/[^\n]*/g, '');

const HOY = '2026-09-01';

/* El ejemplo del apartado 11, tal cual lo escribe él:
     Horario  → Lunes 08:00 Matemáticas · 09:00 Física · Martes 10:00 Piano
     Estudio  → Bachillerato: Matemáticas, Física, Química · Música: Piano   */
const h = crearHorario({ nombre: 'Curso', tipo: 'escolar', hoy: HOY });
const lunes = h.columnas.find((c) => c.dia === 1);
const martes = h.columnas.find((c) => c.dia === 2);

const escenario = () => ({
  estudios: normalizarAsignaturasDe({
    programas: [{ id: 'p_bach', nombre: 'Bachillerato' }, { id: 'p_mus', nombre: 'Música' }],
    asignaturas: [
      { id: 'a_mat', nombre: 'Matemáticas', programaId: 'p_bach' },
      { id: 'a_fis', nombre: 'Física', programaId: 'p_bach' },
      { id: 'a_qui', nombre: 'Química', programaId: 'p_bach' },
      { id: 'a_pia', nombre: 'Piano', programaId: 'p_mus' },
    ],
    examenes: [{ id: 'x1', asignaturaId: 'a_mat', tema: 'Derivadas', fecha: '2026-10-01' }],
    temas: [{ id: 't1', asignaturaId: 'a_mat', nombre: 'Límites' }],
    horas: [], entregas: [], eventos: [],
  }),
  horarioTop: normalizarHorarioTop({
    horarios: [h],
    actividades: [
      { id: 'ac_mat', nombre: 'Matemáticas', asignaturaId: 'a_mat' },
      { id: 'ac_fis', nombre: 'Física', asignaturaId: 'a_fis' },
      { id: 'ac_pia', nombre: 'Piano', asignaturaId: 'a_pia' },
    ],
    bloques: [
      { id: 'b1', horarioId: h.id, columnaId: lunes.id, actividadId: 'ac_mat', inicio: '08:00', fin: '09:00' },
      { id: 'b2', horarioId: h.id, columnaId: martes.id, actividadId: 'ac_mat', inicio: '08:00', fin: '09:00' },
      { id: 'b3', horarioId: h.id, columnaId: lunes.id, actividadId: 'ac_fis', inicio: '09:00', fin: '10:00' },
      { id: 'b4', horarioId: h.id, columnaId: martes.id, actividadId: 'ac_pia', inicio: '10:00', fin: '11:00' },
    ],
    excepciones: [],
  }),
});

console.log('\n── 1. Dónde se usa: LOS DOS módulos, una sola función ──');

const { estudios, horarioTop } = escenario();
const uMat = usosDeAsignatura(estudios, horarioTop, 'a_mat');
eq(uMat.enHorario, 2, '🚨 Matemáticas está en 2 bloques del horario');
eq(uMat.enEstudio, 1, '🚨 …y en 1 programa de Estudio');
ok(uMat.hayUsos, '…así que se está usando');
eq(uMat.programas[0].nombre, 'Bachillerato', '…y se sabe en cuál');

/* 🚨 El apartado 5: Horario y Estudio consultan LA MISMA fuente. Si hubiera una
   función por módulo, los dos avisos dirían números distintos. */
const LIB = sinComentarios(leer('src/lib/usosAsignatura.js'));
ok(/horarioTop/.test(LIB) && /estudios/.test(LIB),
  '🚨 Una sola función mira los dos almacenes: no hay una cuenta por módulo');
ok(!/saveData|localStorage/.test(LIB),
  '⚠️ Y no guarda nada: los usos se cuentan en el momento, o el aviso miente en cuanto él borre algo');

/* ⚠️ Sus exámenes y sus temas NO son «usos»: son su contenido. */
const uQui = usosDeAsignatura(estudios, horarioTop, 'a_qui');
eq(uQui.enHorario, 0, 'Química no está en el horario');
eq(uQui.enEstudio, 1, '…y sí en un programa');

console.log('\n── 2. El aviso, con sus dos formas (apartados 2 y 3) ──');

const avMat = avisoEliminarAsignatura(uMat, 'Matemáticas');
ok(/¿Eliminar Matemáticas\?/.test(avMat.titulo), 'El título nombra la asignatura');
ok(avMat.hayUsos, '🚨 Y avisa de que se está usando');
ok(/2 bloques de tu horario/.test(avMat.donde.join(' ')), '…«2 bloques de tu horario»');
ok(/1 programa de Estudio/.test(avMat.donde.join(' ')), '…y «1 programa de Estudio»');
ok(/se quitará de ahí/i.test(avMat.texto), '…y dice qué va a pasar');

/* 🚨 Lo que vuelve y lo que NO vuelve se dicen por separado: el horario no
   tiene papelera, así que prometer que se recupera todo sería mentir. */
ok(/Eliminados recientemente/i.test(avMat.seRecupera), '⚠️ Lo que va a la papelera se dice que vuelve');
ok(!!avMat.noVuelve && /no se puede deshacer/i.test(avMat.noVuelve),
  '🚨 …y las clases del horario NO vuelven, y se dice: el horario no tiene papelera');

/* Apartado 3 — sin usos, la confirmación sencilla. */
const suelta = usosDeAsignatura({ ...estudios, asignaturas: [{ id: 'a_sola', nombre: 'Latín', programaIds: [] }] }, { horarios: [] }, 'a_sola');
const avSuelta = avisoEliminarAsignatura(suelta, 'Latín');
ok(!avSuelta.hayUsos, '🚨 Una asignatura sin usos lo sabe');
ok(/Dejará de estar disponible para Horario y para Estudio/.test(avSuelta.texto),
  '…y su aviso es el corto del apartado 3');
eq(avSuelta.noVuelve, null, '⚠️ …y no habla de clases del horario, porque no tiene');

console.log('\n── 3. PRUEBA 3 — quitar de un programa ──');

const trasQuitar = quitarDePrograma(estudios.asignaturas, 'a_mat', 'p_bach');
const estQuitada = { ...estudios, asignaturas: trasQuitar };
ok(catalogoAsignaturas(estQuitada).some((a) => a.id === 'a_mat'),
  '🚨 PRUEBA 3 — Matemáticas SIGUE existiendo tras quitarla de Bachillerato');
ok(!usaPrograma(trasQuitar.find((a) => a.id === 'a_mat'), 'p_bach'),
  '…solo deja de usarse en ese programa');
eq(asignaturasDePrograma(estQuitada, 'p_bach').length, 2, '…y Bachillerato pasa a tener dos');
eq(usosDeAsignatura(estQuitada, horarioTop, 'a_mat').enHorario, 2,
  '🚨 PRUEBA 3 — y sigue en el horario: quitarla de un sitio no la quita de los demás');
ok(/Sigue existiendo/i.test(QUITAR_NO_ES_ELIMINAR.dePrograma), '⚠️ Y la pantalla lo dice');

console.log('\n── 4. PRUEBA 4 — quitar de un bloque ──');

const sinB3 = quitarBloqueDelHorario(horarioTop, 'b3');
eq(sinB3.bloques.length, 3, '🚨 PRUEBA 4 — se quita ese bloque');
ok(sinB3.actividades.some((a) => a.id === 'ac_fis'),
  '🚨 PRUEBA 4 — y Física SIGUE existiendo: se quitó la clase, no la asignatura');
ok(catalogoAsignaturas(estudios).some((a) => a.id === 'a_fis'), '…y sigue en el catálogo');
eq(usosDeAsignatura(estudios, sinB3, 'a_fis').enEstudio, 1, '…y en su programa');
/* ⚠️ Y los demás bloques de esa asignatura no se tocan. */
eq(quitarBloqueDelHorario(horarioTop, 'b1').bloques.filter((b) => b.actividadId === 'ac_mat').length, 1,
  '⚠️ Quitar UNA clase de Matemáticas deja la otra donde estaba');

console.log('\n── 5. Sin confirmar no se borra NADA (apartados 2 y 7) ──');

eq(limpiarHorarioDeAsignatura(horarioTop, 'a_mat').bloques.length, 4,
  '🚨 `limpiarHorarioDeAsignatura` sin `confirmado` no toca nada: es el patrón `aplicarPlan`');
eq(limpiarHorarioDeAsignatura(horarioTop, 'a_mat').actividades.length, 3, '…ni las actividades');

console.log('\n── 6. PRUEBA 6 — eliminar una que se usa ──');

const limpio = limpiarHorarioDeAsignatura(horarioTop, 'a_mat', { confirmado: true });
eq(limpio.actividades.length, 2, '🚨 PRUEBA 6 — su actividad del horario desaparece');
eq(limpio.bloques.length, 2, '🚨 …y sus DOS bloques con ella');
ok(!limpio.bloques.some((b) => b.actividadId === 'ac_mat'), '…ninguno se queda');
/* ⚠️ Y NO se lleva por delante lo que no era suyo. */
ok(limpio.bloques.some((b) => b.actividadId === 'ac_fis'), '⚠️ Física no se toca');
ok(limpio.bloques.some((b) => b.actividadId === 'ac_pia'), '⚠️ …ni Piano');

/* 🚨 Apartado 9 — cero referencias colgando después de eliminar. */
const estSinMat = {
  ...estudios,
  asignaturas: estudios.asignaturas.filter((a) => a.id !== 'a_mat'),
  examenes: estudios.examenes.filter((x) => x.asignaturaId !== 'a_mat'),
  temas: estudios.temas.filter((x) => x.asignaturaId !== 'a_mat'),
};
eq(referenciasColgando(estSinMat, limpio, 'a_mat').length, 0,
  '🚨 PRUEBA 6 — no queda NI UNA referencia apuntando a la asignatura eliminada');
/* ⚠️ Y la comprobación puede fallar: si se olvidara el horario, lo dice. */
ok(referenciasColgando(estSinMat, horarioTop, 'a_mat').length > 0,
  '⚠️ …y si alguien olvidara limpiar el horario, esta comprobación lo caza (EH F42)');

console.log('\n── 7. PRUEBA 7 — eliminar un programa NO elimina sus asignaturas ──');

const desligadas = desligarPrograma(estudios.asignaturas, 'p_bach');
eq(desligadas.length, 4, '🚨 PRUEBA 7 — las cuatro asignaturas siguen existiendo');
ok(desligadas.every((a) => !usaPrograma(a, 'p_bach')), '…solo se rompe la relación con ese programa');
ok(usaPrograma(desligadas.find((a) => a.id === 'a_pia'), 'p_mus'),
  '⚠️ …y Música no se entera: Piano sigue en el suyo');
eq(usosDeAsignatura({ ...estudios, asignaturas: desligadas }, horarioTop, 'a_mat').enHorario, 2,
  '🚨 PRUEBA 7 — y Matemáticas sigue en el horario');
ok(/siguen existiendo/i.test(ELIMINAR_PROGRAMA.queSeQueda), '⚠️ Y el aviso lo dice antes de borrar');

console.log('\n── 8. PRUEBA 8 — eliminar un horario NO elimina sus asignaturas ──');

/* ⚠️ Esto ya salía gratis desde GE F2: `eliminarHorario` se lleva sus bloques y
   sus excepciones, y las asignaturas viven en `estudios`. Se comprueba para que
   ninguna fase futura lo rompa. */
const HOR = sinComentarios(leer('src/lib/horario.js'));
ok(!/eliminarHorario[\s\S]{0,400}asignaturas/.test(HOR),
  '🚨 PRUEBA 8 — `eliminarHorario` no toca las asignaturas: viven en otro módulo');
ok(/siguen existiendo/i.test(ELIMINAR_HORARIO.queSeQueda), '⚠️ Y se dice: un horario las usa, no las contiene');

console.log('\n── 9. La condición de la fase se calcula ──');

const cond = condicionAS2(estudios, horarioTop);
ok(cond.ok, `🚨 La condición sale VERDE (${cond.casillas.filter((c) => c.ok).length}/${cond.casillas.length})`);

console.log(`\n  ${fallos.length ? '✗' : '✓'} Usos y eliminación de asignaturas (AS F2) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
