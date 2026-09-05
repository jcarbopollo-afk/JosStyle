// ============================================================================
// ENTREGA 3 · FASE 7 (HC F2) — LA AGENDA DE UN DÍA
//
// 🚨 **LA CONDICIÓN QUE MÁS SE PUEDE ROMPER ES LA 25:** *"no crear
// `agenda_events` y `calendar_events` como duplicados. El sistema debe tener una
// fuente de verdad."*
//
// Y la 14: *"completar desde Agenda debe actualizar Tareas, Hoy, el progreso
// diario y las rachas"*. Sale gratis **porque es la misma tarea**: aquí no hay
// copia que sincronizar.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_AGENDA, tipoAgenda, tiposDisponibles,
  diaAnterior, diaSiguiente, tiraDeDias,
  agendaDelDia, VACIO_AGENDA, tituloDelDia,
} from '../src/lib/agendaDia.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Bloques primero, llaves vacías después (la lección de la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

const HOY = '2026-09-03'; // jueves
const VACIO = { horarios: [], columnas: [], filas: [], actividades: [], bloques: [], excepciones: [] };

const prod = {
  tareas: [
    { id: 't1', texto: 'Estudiar Biología', fecha: HOY, hora: '09:00', hecha: false },
    { id: 't2', texto: 'Comprar material', fecha: HOY, hecha: false },
    { id: 't3', texto: 'Ya hecha', fecha: HOY, hora: '08:00', hecha: true },
    { id: 't4', texto: 'De otro día', fecha: '2026-09-10', hecha: false },
  ],
  apuntes: [{ id: 'a1', texto: 'Preguntar lo del proyecto', fecha: HOY }],
};

// ⚠️ `ahora` se pasa como CADENA: `minutosAhora` solo entiende texto o `Date`,
// y un número cae al reloj de verdad — la prueba dejaría de ser determinista.
const dia = agendaDelDia(VACIO, HOY, { hoy: HOY, ahora: '10:00', productividad: prod });

console.log('\n═══ 1. EL DÍA, CON HORA Y SIN HORA (apartados 3 y 4) ═══\n');

eq(dia.conHora.map((e) => e.titulo), ['Ya hecha', 'Estudiar Biología'],
  'las cosas con hora van en orden cronológico');
eq(dia.sinHora.map((e) => e.titulo), ['Comprar material', 'Preguntar lo del proyecto'],
  '🚨 y las que no tienen hora tienen su sección: no todo tiene que llevar hora (apartado 4)');
ok(!dia.conHora.some((e) => e.titulo === 'De otro día') && !dia.sinHora.some((e) => e.titulo === 'De otro día'),
  '⚠️ y lo de otro día no se cuela en éste');
eq(dia.total, 4, 'el total cuenta las dos secciones');
ok(!dia.vacio, 'y con cosas, el día no está vacío');

console.log('\n═══ 2. AHORA, PRÓXIMO Y LO PASADO (apartados 15, 16 y 17) ═══\n');

eq(dia.ahora, 600, 'a las 10:00 la raya de AHORA está en el minuto 600');
ok(dia.conHora.find((e) => e.titulo === 'Ya hecha').pasado,
  '🚨 lo de las 08:00 sale marcado como pasado — pero SIGUE VISIBLE (apartado 15)');
ok(dia.conHora.find((e) => e.titulo === 'Estudiar Biología').pasado,
  'y lo de las 09:00 también, porque son las 10:00');

const porLaManana = agendaDelDia(VACIO, HOY, { hoy: HOY, ahora: '07:00', productividad: prod });
/* ⚠️ A las 07:00 lo siguiente NO es la de las 08:00, porque **está hecha**: el
   apartado 17 dice *"el siguiente elemento PENDIENTE"*. Proponer algo ya hecho
   sería mandarle a repetirlo. */
eq(porLaManana.proximo?.titulo, 'Estudiar Biología',
  '🚨 el "próximo" es el siguiente PENDIENTE: lo que ya está hecho se salta (apartado 17)');
eq(porLaManana.conHora.filter((e) => e.pasado).length, 0, 'y nada está pasado todavía');

// Apartado 16 — la raya SOLO en hoy.
const otroDia = agendaDelDia(VACIO, '2026-09-10', { hoy: HOY, ahora: '10:00', productividad: prod });
eq([otroDia.ahora, otroDia.proximo], [null, null],
  '🚨 en un día que no es hoy NO hay raya de AHORA ni "próximo": no significarían nada (apartado 16)');
ok(!otroDia.esHoy && dia.esHoy, 'y se sabe cuál es hoy');

console.log('\n═══ 3. SOLAPAMIENTOS Y DÍA VACÍO (apartados 18 y 19) ═══\n');

const solapado = agendaDelDia(VACIO, HOY, {
  hoy: HOY,
  ahora: '10:00',
  productividad: { tareas: [
    { id: 'x1', texto: 'Entreno', fecha: HOY, hora: '17:00' },
    { id: 'x2', texto: 'Estudio', fecha: HOY, hora: '17:00' },
  ] },
});
eq(solapado.conHora.length, 2,
  '🚨 dos cosas a la misma hora se ven LAS DOS: esconder una sería perder algo que él puso (apartado 18)');
ok(solapado.conHora.every((e) => e.solapado), 'y las dos van marcadas como solapadas');

const libre = agendaDelDia(VACIO, HOY, { hoy: HOY, ahora: '10:00', productividad: { tareas: [], apuntes: [] } });
ok(libre.vacio && libre.total === 0, 'un día sin nada se sabe que está vacío');
eq([VACIO_AGENDA.titulo, VACIO_AGENDA.boton], ['Agenda libre', 'Añadir'],
  '⚠️ y tiene sus textos y su botón: nunca una lista vacía (apartado 19)');

console.log('\n═══ 4. NAVEGAR ENTRE DÍAS (apartados 1, 2, 21 y 24) ═══\n');

eq(diaAnterior(HOY), '2026-09-02', 'el día anterior');
eq(diaSiguiente(HOY), '2026-09-04', 'y el siguiente');
eq(diaAnterior('2026-09-01'), '2026-08-31',
  '🚨 y cruzar de mes funciona: la fecha se construye en local, nunca con `toISOString` (sexta vez)');

const tira = tiraDeDias(HOY, { hoy: HOY });
eq(tira.length, 5, 'la tira del apartado 2 son cinco días');
eq(tira.map((d) => d.dia), [1, 2, 3, 4, 5], 'centrada en el seleccionado');
ok(tira.find((d) => d.seleccionado).fecha === HOY, 'con el seleccionado marcado');
ok(tira.every((d) => d.etiqueta.length === 3), 'y cada uno con su día de la semana');

const t = tituloDelDia(HOY, HOY);
eq(t.texto, 'Jueves, 3 de septiembre',
  '⚠️ la fecha se genera, nunca se escribe a mano (apartado 1)');
eq([t.esHoy, t.etiqueta], [true, 'Hoy'], 'y se sabe si es hoy');
eq(tituloDelDia('2026-09-04', HOY).etiqueta, 'Mañana', 'mañana también');
eq(tituloDelDia('2026-09-20', HOY).etiqueta, null, 'y un día cualquiera no lleva etiqueta');

console.log('\n═══ 5. TAREA NO ES EVENTO (apartado 6) ═══\n');

eq(TIPOS_AGENDA.filter((x) => x.seCompleta).map((x) => x.id), ['tarea'],
  '🚨 SOLO una tarea se completa: un evento ocurre, y no se marca (apartado 6)');
ok(dia.conHora.find((e) => e.titulo === 'Estudiar Biología').completable,
  'una tarea de la agenda es completable');
eq(dia.completables, 3, 'se sabe cuántas se pueden completar (las tres tareas; el apunte no)');
eq(dia.hechas, 1, 'y cuántas están hechas');

// ⏸ Lo que NO existe se declara, no se finge.
// 🐛 Corregido en la E3 F8: el RECORDATORIO sí existe —es un evento de
// `TIPOS_EVENTO_CALENDARIO`, y ya salía aquí como evento—. Lo que no existe es
// un módulo de recordatorios aparte, que además sería un duplicado.
eq(TIPOS_AGENDA.filter((x) => !x.existe).map((x) => x.id), ['pomodoro'],
  '⏸ el pomodoro programado NO existe, y se declara así');
eq(tipoAgenda('recordatorio').deDonde, 'calendario.eventos (tipo: recordatorio)',
  '🐛 y el recordatorio SÍ existe: antes de declarar que algo no existe, mirar si ya existe con otro nombre');
ok(TIPOS_AGENDA.filter((x) => !x.existe).every((x) => x.porque),
  '⚠️ con su motivo escrito: fingirlos sería un botón muerto (regla 8)');
ok(tiposDisponibles().every((x) => x.deDonde),
  '⚠️ y cada tipo que sí existe dice de qué módulo real sale (apartado 5)');
ok(!tipoAgenda('inventado'), 'un tipo que no existe no se inventa');

console.log('\n═══ 6. UNA SOLA FUENTE DE VERDAD (apartados 14 y 25) ═══\n');

const LIB = sinComentarios(leer('src/lib/agendaDia.js'));
for (const copia of ['agenda_events', 'calendar_events', 'eventosDeAgenda', 'DEFAULT_AGENDA']) {
  ok(!new RegExp(copia, 'i').test(LIB), `🚨 no existe \`${copia}\`: ni una copia (apartado 25)`);
}
ok(!/saveData|supabase|normalizarAgenda/i.test(LIB),
  '🚨 esta capa no guarda ni normaliza nada suyo: junta y ordena lo que ya vive en su módulo');
ok(/agendaCompleta/.test(LIB) && /apuntesDe/.test(LIB),
  '⚠️ los eventos vienen de `agendaCompleta` (HT F6) y los apuntes de la E3 F6');

const APP = sinComentarios(leer('src/App.jsx'));
ok(/onCompletarTarea=\{toggleTarea\}/.test(APP),
  '🚨 completar desde la Agenda llama a `toggleTarea`, LA MISMA función que marca la tarea en Hoy y en Productividad (apartado 14)');

console.log('\n═══ 7. EN LA PANTALLA ═══\n');

const VISTA = sinComentarios(leer('src/views/CalendarView.jsx'));
ok(/<AgendaDeUnDia/.test(VISTA), 'la agenda del día se pinta');
ok(/vista === 'dia'/.test(VISTA) && /vista === 'agenda'/.test(VISTA) && /vista === 'mes'/.test(VISTA),
  "⚠️ y convive con Mes y con la Agenda de próximos días: son preguntas distintas, no se sustituye nada");
ok(/agendaDelDia\([\s\S]{0,30}seleccionado/.test(VISTA),
  '🚨 el día que se abre es el SELECCIONADO, no siempre hoy (apartado 24)');
ok(/AHORA/.test(VISTA), 'la raya de AHORA está en la pantalla');
ok(/Sin hora/.test(VISTA), 'y la sección de lo que no tiene hora');
ok(/VACIO_AGENDA\.titulo/.test(VISTA), 'y el día libre usa los textos del apartado 19');
ok(/aria-label="Día anterior"/.test(VISTA) && /aria-label="Día siguiente"/.test(VISTA),
  '⚠️ las flechas tienen nombre: un botón de solo icono sin `aria-label` no existe para un lector de pantalla (EH F42)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
