/* Entrega 4 · FIT F32/45 — Planificación semanal avanzada de entrenamiento.
   ═══════════════════════════════════════════════════════════════════════════
   Las 18 pruebas del apartado 41 y los casos límite del 40, más lo que esta
   fase promete y hay que poder poner rojo:

   1. Que un día sin sesión en el plan NO diga «Descanso» (apartado 5) — en la
      F32 y en los dos sitios donde ya vivía la palabra (F6 y F31).
   2. Que un día planificado sin registro no sea un fallo (apartados 7 y 16).
   3. Que cambiar de plan NO reescriba el pasado (apartado 22).
   4. Que una sesión se relacione con su día POR IDS, y que conserve su origen
      (apartados 19 y 20).
   5. Y el fallo de una fase anterior que la F32 destapó: los días de un plan
      de la biblioteca nacían con un id ALEATORIO en cada carga (F5), así que
      el apartado 19 no podía cumplirse jamás. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  YA_LO_RESUELVE, ESTADOS_PLANIFICACION, estadoPlanificacion, TEXTO_OTRO, TEXTO_REALIZADO,
  TEXTO_SIN_REGISTRO, TEXTO_SIN_DURACION, PLAN_INVALIDO, enlaceDeSesion, relacionConElDia,
  estadoDeCasilla, diaDePlanificacion, SEMANAS_HACIA_DELANTE, getWeekPlan, getPlannedWorkoutForDay,
  getDayTrainingStatus, getNextPlannedWorkout, planificacionDeTuPlan, NO_EN_FIT32, DECISIONES_FIT32,
  auditarPlanificacion,
} from '../src/lib/planificacionSemanal.js';
import {
  tuPlan, semanaDelPlan, DESCANSO_HOY, ESTADOS_DIA, planificadoEnFecha, tramoEnFecha, planValido,
  planDePlantilla,
} from '../src/lib/tuPlan.js';
import {
  CATALOGO_PLANES, crearPresetPlan, crearPlanActivo, usarPlan, quitarPlanActivo, planesAnterioresDe,
  idDiaDePlantilla, estructuraDelPlan, planPorId,
} from '../src/lib/planes.js';
import { CATALOGO_PLANES_BRUTO } from '../src/lib/catalogoPlanes.js';
import { DEFAULT_FITNESS, normalizarPlanAnterior } from '../src/lib/fitness.js';
import { empezarSesion, guardarSesion, normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { resumenDeActividad, ESTADOS_ACTIVIDAD } from '../src/lib/actividadEntrenamiento.js';
import { sesionesDelHistorial, sesionesPorDia } from '../src/lib/historial.js';
import { diaARutina } from '../src/lib/planes.js';
import { crearRutina, anadirEjercicio } from '../src/lib/constructor.js';
import { addDays } from '../src/lib/helpers.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

/* Jueves 24 de septiembre de 2026. La semana es la del lunes 21.
   PPL Estético: L Push · M Pull · X Legs · J — · V Upper · S Lower · D —.
   Upper / Lower: L Upper A · M Lower A · X — · J Upper B · V Lower B · S — · D —. */
const HOY = '2026-09-24';
const PPL = 'ppl-estetico';
const UL = 'upper-lower';

/** Una sesión completada con su enlace al plan: `planId` y el id del día en
 *  su `origen` (F7) y en su `diaDePlan` (F8). */
function S(id, fecha, {
  nombre = 'Push', hora = 18, minutos = 50, planId = PPL, tipo = 'preset', dia = 1,
  sinEnlace = false, estado = 'completada', ...extra
} = {}) {
  const ini = new Date(`${fecha}T${String(hora).padStart(2, '0')}:00:00`).getTime();
  const diaId = typeof dia === 'number' ? `${planId}-dia-${dia}` : dia;
  return {
    id, fecha, nombre, estado,
    planId: sinEnlace ? null : planId,
    iniciadaEn: ini, terminadaEn: ini + minutos * 60000,
    origen: sinEnlace ? { tipo: 'plan', id: null, ejercicios: [] } : { tipo, id: diaId, ejercicios: [] },
    diaDePlan: sinEnlace ? null : { planId, tipo, diaId, nombre },
    ...extra,
  };
}
/** PPL activo desde el lunes 7 de septiembre. */
const F = (...sesiones) => ({
  ...DEFAULT_FITNESS,
  planActivo: crearPlanActivo({ planId: PPL, origen: 'preset', desde: '2026-09-07' }),
  sesiones,
});
const dia = (semana, fecha) => semana.dias.find((d) => d.fecha === fecha);
const NEGATIVO = /fall|fracas|incumpl|perdid|mal\b|no cumpl|olvid/i;

console.log('\n═══ FIT F32/45 · Planificación semanal avanzada ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 0. Lo que la F32 destapó en fases anteriores, arreglado donde nacía ──');

/* 🐛 A) Los días de un preset nacían con uid() en cada carga (F5). */
const otraVez = crearPresetPlan(CATALOGO_PLANES_BRUTO.find((p) => p.id === PPL));
ok(planPorId(PPL).dias.map((d) => d.id).join() === otraVez.dias.map((d) => d.id).join(),
  '🐛 Los días de un plan de la biblioteca tienen el MISMO id en cada carga (antes: aleatorio)');
ok(planPorId(PPL).dias[0].id === 'ppl-estetico-dia-1' && planPorId(PPL).dias[6].id === 'ppl-estetico-dia-7',
  '…y el id es su ranura en la semana: «ppl-estetico-dia-1» es el lunes');
const todosLosDias = CATALOGO_PLANES.flatMap((p) => p.dias.map((d) => d.id));
ok(new Set(todosLosDias).size === todosLosDias.length,
  `…sin repetirse entre los ${CATALOGO_PLANES.length} planes (${todosLosDias.length} días)`);
ok(crearPresetPlan({ id: 'x', dias: [{ id: 'propio', nombre: 'A' }, { nombre: 'B' }] }).dias.map((d) => d.id).join() === 'propio,x-dia-2',
  '…y un id que ya traiga el día se respeta');
/* Y una sesión guardada con uno de los ids viejos no se da por «otro»: no se sabe. */
const planLunes = planificadoEnFecha('2026-09-21', { plan: planPorId(PPL), desde: '2026-09-07', planId: PPL, origen: 'preset', hoy: HOY });
ok(relacionConElDia(S('v', '2026-09-21', { dia: 'k3j9x0aa' }), planLunes) === 'desconocida',
  '🐛 …una sesión con un id de día de antes (aleatorio) dice «no se sabe», nunca «otro entrenamiento»');

/* B) La palabra «Descanso», en los dos sitios donde ya vivía (F6 y F31). */
ok(estadoDiaNombre('descanso') === 'Sin entrenamiento planificado',
  '🚨 F6 — el estado `descanso` se llama «Sin entrenamiento planificado» (apartado 5)');
function estadoDiaNombre(id) { return (ESTADOS_DIA.find((e) => e.id === id) || {}).nombre; }
ok(ESTADOS_ACTIVIDAD.find((e) => e.id === 'descanso').nombre === 'Sin entrenamiento planificado',
  '🚨 F31 — y en la actividad también (antes «Descanso del plan»)');
ok(!/descans/i.test(`${DESCANSO_HOY.titulo} ${DESCANSO_HOY.texto}`),
  `🚨 F6 — «Hoy toca descansar» ya no existe: «${DESCANSO_HOY.titulo}»`);
ok(/extra/i.test(DESCANSO_HOY.texto), '…y dice que entrenar por su cuenta cuenta como extra (apartado 32)');
ok(ESTADOS_DIA.some((e) => e.id === 'descanso') && ESTADOS_ACTIVIDAD.some((e) => e.id === 'descanso'),
  '…y el id NO cambia: es la forma del dato (se renombra por fuera, FIT F1)');

/* C) Una sola agrupación por día, en el orden en que las hizo. */
const orden = sesionesPorDia([S('b', '2026-09-23', { hora: 18 }), S('a', '2026-09-23', { hora: 8 })]);
ok(orden.get('2026-09-23').map((s) => s.id).join() === 'a,b',
  '`sesionesPorDia` (historial.js) las ordena por la hora en que empezaron');
ok(/sesionesPorDia/.test(sinComentarios(leer('src/lib/actividadEntrenamiento.js')))
  && /sesionesPorDia/.test(sinComentarios(leer('src/lib/tuPlan.js'))),
  '🚨 …y es LA MISMA en la actividad (F31) y en la semana del plan (F6/F32): no hay dos agrupaciones');

/* D) La plantilla como plan: el id de su día se escribe en un sitio. */
ok(planDePlantilla({ id: 'pl1', nombre: 'Mi rutina', lineas: [] }).dias[0].id === idDiaDePlantilla('pl1'),
  'El día de una plantilla usada como plan tiene el id que apunta el historial de planes');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Semana actual (prueba 1, apartados 3 y 8) ──');

const f1 = F(
  S('lun', '2026-09-21', { nombre: 'Push', dia: 1 }),
  S('mie', '2026-09-23', { nombre: 'Legs', dia: 3, hora: 18 }),
);
const s1 = getWeekPlan(HOY, f1, { hoy: HOY });
ok(s1.estado === 'ok' && s1.dias.length === 7, 'Siete días');
ok(s1.dias.map((d) => d.corto).join('') === 'LMXJVSD' && s1.dias[0].fecha === '2026-09-21',
  'L M X J V S D, empezando el lunes 21');
ok(s1.titulo === 'Esta semana' && s1.rango === '21 al 27 de septiembre', `«Esta semana» · ${s1.rango}`);
ok(s1.dias.filter((d) => d.esHoy).length === 1 && dia(s1, HOY).esHoy, 'Un solo día es hoy, y es el jueves (apartado 8)');
ok(s1.esActual && !s1.pasada && !s1.futura, '…y es la semana en curso');
ok(dia(s1, '2026-09-21').estado === 'completed' && dia(s1, '2026-09-22').estado === 'planned_not_completed'
  && dia(s1, '2026-09-23').estado === 'completed' && dia(s1, HOY).estado === 'unplanned'
  && dia(s1, '2026-09-25').estado === 'planned' && dia(s1, '2026-09-27').estado === 'unplanned',
  `🚨 Cada día con su estado: ${s1.dias.map((d) => `${d.corto} ${d.estado}`).join(' · ')}`);
ok(s1.dias.every((d) => !!estadoPlanificacion(d.estado)), 'Todos son uno de los seis del apartado 31');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Semana anterior (prueba 2, apartados 14 y 16) ──');

const f2 = F(S('p1', '2026-09-14', { dia: 1 }), S('p3', '2026-09-18', { nombre: 'Upper', dia: 5 }));
const s2 = getWeekPlan('2026-09-14', f2, { hoy: HOY });
ok(s2.titulo === 'Semana pasada' && s2.pasada && s2.rango === '14 al 20 de septiembre', `«Semana pasada» · ${s2.rango}`);
ok(dia(s2, '2026-09-14').estado === 'completed' && dia(s2, '2026-09-15').estado === 'planned_not_completed',
  'Lo realizado y lo planificado sin registro, diferenciados (apartado 16)');
ok(dia(s2, '2026-09-15').principal === 'Planificado' && dia(s2, '2026-09-15').detalle === TEXTO_SIN_REGISTRO,
  '🚨 El día que pasó sin registro dice «Planificado» y «Sin entrenamiento registrado», no «no entrenó» (apartados 7 y 16)');
ok(!s2.dias.some((d) => NEGATIVO.test(`${d.principal} ${d.detalle} ${d.descripcion}`)),
  '🚨 …y ni una palabra negativa en toda la semana (apartado 7)');
ok(s2.hayAnterior === true, 'Se puede seguir hacia atrás mientras haya plan conocido');
const s2b = getWeekPlan('2026-08-31', f2, { hoy: HOY });
ok(s2b.hayAnterior === false, '…pero no antes de la primera semana con algo que enseñar');
ok(s2b.dias.every((d) => d.estado === 'unknown'),
  '🚨 Antes del plan no se sabe qué había: `unknown`, sin afirmar ni descanso ni entrenamiento (apartado 31)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Semana siguiente (prueba 3, apartados 14 y 15) ──');

const antes3 = JSON.stringify(f1);
const s3 = getWeekPlan('2026-09-28', f1, { hoy: HOY });
ok(s3.titulo === 'Próxima semana' && s3.futura && s3.rango === '28 de septiembre al 4 de octubre',
  `«Próxima semana» · ${s3.rango} (cambio de mes, apartado 40)`);
ok(s3.dias.filter((d) => d.estado === 'planned').map((d) => `${d.corto} ${d.planificado.nombre}`).join(' · ') === 'L Push · M Pull · X Legs · V Upper · S Lower',
  `🚨 La planificación del plan, sin sesiones: ${s3.dias.filter((d) => d.estado === 'planned').map((d) => `${d.corto} ${d.planificado.nombre}`).join(' · ')}`);
ok(JSON.stringify(f1) === antes3 && s3.dias.every((d) => !d.realizadas.length),
  '🚨 Navegar al futuro NO crea sesiones (apartados 14 y 15)');
ok(getWeekPlan(addDays('2026-09-21', 7 * SEMANAS_HACIA_DELANTE), f1, { hoy: HOY }).haySiguiente === false
  && s3.haySiguiente === true, `Hacia delante, hasta ${SEMANAS_HACIA_DELANTE} semanas`);
const s3b = getWeekPlan('2026-12-30', F(), { hoy: '2026-12-30' });
ok(s3b.rango === '28 de diciembre de 2026 al 3 de enero de 2027', `Cambio de año: «${s3b.rango}» (apartado 40)`);
ok(getWeekPlan('2027-01-04', F(), { hoy: '2026-12-30' }).titulo === 'Próxima semana', '…y la siguiente, ya en 2027, es «Próxima semana»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Próximo entrenamiento (prueba 4, apartado 9) ──');

const px1 = getNextPlannedWorkout('2026-09-23', F());
ok(px1 && px1.esHoy && px1.sesion.nombre === 'Legs' && px1.cuando === 'Hoy',
  '🚨 Si hoy hay uno pendiente, es ése: «Hoy · Legs»');
const px2 = getNextPlannedWorkout('2026-09-23', F(S('w', '2026-09-23', { nombre: 'Legs', dia: 3 })));
ok(px2 && px2.sesion.nombre === 'Upper' && px2.fecha === '2026-09-25',
  '…si ya lo hizo, el siguiente día planificado (el viernes, saltando el jueves sin plan)');
const px3 = getNextPlannedWorkout('2026-09-27', F());
ok(px3 && px3.sesion.nombre === 'Push' && px3.cuando === 'Mañana' && px3.fecha === '2026-09-28',
  '🔓 El domingo, el lunes de la semana que viene: «Mañana · Push» (la F6 devolvía null)');
const px4 = getNextPlannedWorkout('2026-09-26', F(S('s', '2026-09-26', { nombre: 'Lower', dia: 6 })));
ok(px4 && px4.cuando === 'Lunes, 28 de septiembre',
  `…y a dos días, con su fecha para no confundir lunes: «${px4 && px4.cuando}»`);
ok(px1.sesion.ejercicios > 0 && /≈ \d+ min/.test(px1.sesion.duracion) && px1.musculos.length > 0 && px1.estado === 'Planificado',
  'Con día, nombre, ejercicios, duración, músculos y estado (apartado 10)');
ok(getNextPlannedWorkout(HOY, { ...DEFAULT_FITNESS }) === null, 'Sin plan, no hay próximo (no se inventa)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Día completado (prueba 5, apartados 6, 12 y 13) ──');

const d5 = dia(s1, '2026-09-21');
ok(d5.relacion === 'coincide' && d5.principal === '✓ Completado', '«✓ Completado» cuando la sesión es la del plan');
ok(d5.descripcion === 'Lunes 21 de septiembre. Push. Planificado y completado.',
  `🚨 Descripción completa (apartado 39): «${d5.descripcion}»`);
ok(d5.realizadas.length === 1 && d5.realizadas[0].id === 'lun', '…y la sesión real, para abrirla (apartado 6)');
ok(d5.acciones.repetir && !d5.acciones.empezar && d5.acciones.verSesiones,
  'Ya hecho: «Ver entrenamiento» y «Repetir», no «Empezar» (apartado 12)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Planificado y no completado (prueba 6, apartado 7) ──');

const d6 = dia(s1, '2026-09-22');
ok(d6.estado === 'planned_not_completed' && d6.principal === 'Planificado', '«Planificado», no un fracaso');
ok(d6.descripcion === 'Martes 22 de septiembre. Pull. Planificado. Sin entrenamiento registrado.',
  `…«${d6.descripcion}»`);
ok(d6.acciones.empezar && d6.acciones.verRutina, '…y se puede ver y empezar su rutina');
ok(dia(s1, '2026-09-25').estado === 'planned' && dia(s1, '2026-09-25').descripcion === 'Viernes 25 de septiembre. Upper. Planificado.',
  'Un día que aún no ha llegado es `planned`, sin más');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Día no planificado (prueba 7, apartado 5) ──');

const d7 = dia(s1, HOY);
ok(d7.estado === 'unplanned' && d7.principal === 'Sin entrenamiento planificado',
  '🚨 «Sin entrenamiento planificado», NO «Descanso» (apartado 5)');
ok(d7.descripcion === 'Jueves 24 de septiembre (hoy). Sin entrenamiento planificado.', `…«${d7.descripcion}»`);
ok(!s1.dias.some((d) => /\bdescanso\b/i.test(`${d.principal} ${d.detalle} ${d.descripcion}`)),
  '🚨 Ningún día de la semana dice «descanso»');
ok(!d7.acciones.empezar && !d7.acciones.verRutina && !d7.acciones.repetir, '…ni ofrece una rutina que no hay');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Entrenamiento extra (prueba 8, apartado 32) ──');

const f8 = F(S('x', HOY, { nombre: 'Core', planId: 'pl-core', tipo: 'plantilla', dia: 'pl-core' }));
const d8 = dia(getWeekPlan(HOY, f8, { hoy: HOY }), HOY);
ok(d8.estado === 'completed_extra' && d8.principal === 'Entrenamiento extra', '«Entrenamiento extra» un día sin plan');
ok(d8.descripcion === 'Jueves 24 de septiembre (hoy). Sin entrenamiento planificado. Entrenamiento extra: Core.',
  `…«${d8.descripcion}»`);
ok(!NEGATIVO.test(d8.descripcion), '…y no es negativo');
const p8 = planificacionDeTuPlan(f8, { hoy: HOY });
ok(p8.hoyAparte && p8.hoy.estado === 'completed_extra' && p8.proximo.sesion.nombre === 'Upper',
  'En Tu Plan: hoy se enseña aparte, y el próximo es el Upper del viernes');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Dos sesiones el mismo día (prueba 9, apartado 21) ──');

const f9 = F(
  S('tarde', '2026-09-23', { nombre: 'Legs', dia: 3, hora: 18 }),
  S('manana', '2026-09-23', { nombre: 'Core', planId: 'pl-core', tipo: 'plantilla', dia: 'pl-core', hora: 8 }),
);
const d9 = dia(getWeekPlan(HOY, f9, { hoy: HOY }), '2026-09-23');
ok(d9.realizadas.map((r) => r.nombre).join() === 'Core,Legs', '🚨 Las dos, en el orden en que las hizo (Core por la mañana)');
ok(d9.realizadas.map((r) => r.relacion).join() === 'otro,coincide', '…cada una con su relación con el plan');
ok(d9.estado === 'completed' && d9.relacion === 'coincide', '…y el día está completado: una de las dos es la del plan');
ok(/2 entrenamientos: Core y Legs/.test(d9.descripcion), `…y la descripción dice las dos: «${d9.descripcion}»`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Cambio de plan (prueba 10, apartado 22 — C-39) ──');

/* PPL desde el 7; el miércoles 23 se cambia a Upper / Lower. */
const antes10 = F(S('l14', '2026-09-14', { dia: 1 }));
const r10 = usarPlan(antes10, UL, { confirmado: true, hoy: '2026-09-23' });
ok(r10.ok && r10.fitness.planActivo.planId === UL && r10.fitness.planActivo.desde === '2026-09-23', 'Se cambia de plan');
const tramos = planesAnterioresDe(r10.fitness);
ok(tramos.length === 1 && tramos[0].planId === PPL && tramos[0].desde === '2026-09-07' && tramos[0].hasta === '2026-09-23',
  '🚨 …y el que se va queda apuntado: PPL, del 7 al 23 (C-39)');
ok(tramos[0].dias.length === 7 && tramos[0].dias[0].id === 'ppl-estetico-dia-1' && tramos[0].dias[0].nombre === 'Push'
  && tramos[0].dias[3].descanso === true && !('lineas' in tramos[0].dias[0]),
  '…con la estructura de sus días —nombre y si descansaba—, y NI UNA línea de ejercicios');
const s10 = getWeekPlan(HOY, r10.fitness, { hoy: HOY });
ok(dia(s10, '2026-09-21').planificado.nombre === 'Push' && dia(s10, '2026-09-21').planificado.anterior
  && dia(s10, '2026-09-22').planificado.nombre === 'Pull',
  '🚨 Lunes y martes de esta semana siguen siendo del PPL (el pasado no se reescribe)');
ok(dia(s10, '2026-09-23').estado === 'unplanned' && dia(s10, HOY).planificado.nombre === 'Upper B'
  && dia(s10, '2026-09-25').planificado.nombre === 'Lower B',
  '…y desde el miércoles, el nuevo: X —, J Upper B, V Lower B');
ok(/«PPL Estético» y después «Upper \/ Lower»/.test(s10.aviso), `…y la semana dice que cambió: «${s10.aviso}»`);
const pasada10 = getWeekPlan('2026-09-14', r10.fitness, { hoy: HOY });
const pasada10Antes = getWeekPlan('2026-09-14', antes10, { hoy: HOY });
ok(pasada10.dias.map((d) => `${d.estado}:${d.planificado?.nombre || ''}`).join()
  === pasada10Antes.dias.map((d) => `${d.estado}:${d.planificado?.nombre || ''}`).join(),
  '🚨 La semana pasada dice EXACTAMENTE lo mismo antes y después del cambio');
ok(dia(pasada10, '2026-09-14').estado === 'completed' && dia(pasada10, '2026-09-14').relacion === 'coincide',
  '…y la sesión del PPL sigue siendo «Completado» con su plan de entonces');
ok(getWeekPlan('2026-09-28', r10.fitness, { hoy: HOY }).dias.filter((d) => d.estado === 'planned').map((d) => d.planificado.nombre).join() === 'Upper A,Lower A,Upper B,Lower B',
  'Las semanas futuras, con el plan nuevo');
ok(!dia(s10, '2026-09-21').acciones.verRutina && !dia(s10, '2026-09-21').acciones.empezar,
  'De un día del plan anterior no se ofrece su rutina: de él se guardó el nombre, no los ejercicios');
/* Activado hoy mismo: no cubre ni un día, no se apunta. */
const hoyMismo = usarPlan(usarPlan({ ...DEFAULT_FITNESS }, PPL, { hoy: HOY }).fitness, UL, { confirmado: true, hoy: HOY });
ok(planesAnterioresDe(hoyMismo.fitness).length === 0, 'Un plan activado y cambiado el mismo día no deja tramo (no cubrió ningún día)');
/* Quitarlo también cierra su tramo. */
const quitado = quitarPlanActivo(antes10, { hoy: '2026-09-20' });
ok(quitado.planActivo === null && planesAnterioresDe(quitado).length === 1 && planesAnterioresDe(quitado)[0].hasta === '2026-09-20',
  'Quitar el plan también apunta su tramo');
/* Un hueco sin plan, entre dos, SE SABE: no es «no se sabe». */
const conHueco = usarPlan(quitado, UL, { hoy: '2026-09-23' }).fitness;
ok(dia(getWeekPlan(HOY, conHueco, { hoy: HOY }), '2026-09-21').estado === 'unplanned'
  && dia(getWeekPlan(HOY, conHueco, { hoy: HOY }), '2026-09-21').planificado.sinPlan,
  'Entre quitar un plan y poner otro, los días son «Sin entrenamiento planificado»: se sabe que no había');
ok(tramoEnFecha('2026-08-01', { anteriores: planesAnterioresDe(conHueco) }) === null,
  '…y antes del primer plan apuntado, `null`: no se sabe');
/* Persistencia: un ida y vuelta por la puerta de carga. */
const recargado = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(r10.fitness)));
ok(planesAnterioresDe(recargado).length === 1 && recargado.planesAnteriores[0].nombre === 'PPL Estético',
  '🚨 Tras recargar, el tramo sigue ahí (regla 5: tiene su normalizador)');
ok(normalizarPlanAnterior({ planId: PPL, desde: '2026-09-23', hasta: '2026-09-07', dias: [{ id: 'a' }] }) === null
  && normalizarPlanAnterior({ planId: PPL, desde: '2026-09-07', hasta: '2026-09-23', dias: [] }) === null
  && normalizarPlanAnterior({ desde: '2026-09-07', hasta: '2026-09-23', dias: [{ id: 'a' }] }) === null,
  '…y un tramo que no cubre nada, sin días o sin plan se descarta');
ok(Array.isArray(DEFAULT_FITNESS.planesAnteriores) && DEFAULT_FITNESS.planesAnteriores.length === 0,
  'Nace vacío');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Plan irregular (prueba 11, apartado 25) ──');

const fIrr = { ...DEFAULT_FITNESS, planActivo: crearPlanActivo({ planId: 'full-body-gym', desde: '2026-09-07' }) };
const sIrr = getWeekPlan(HOY, fIrr, { hoy: HOY });
ok(sIrr.dias.map((d) => (d.planificado && !d.planificado.descanso ? d.corto : '·')).join('') === 'L·X·V··',
  '🚨 Lunes, miércoles y viernes; el resto sin rellenar');
ok(sIrr.dias.filter((d) => d.estado === 'unplanned').length === 4, '…y los otros cuatro, «Sin entrenamiento planificado»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Plan de 2 días (prueba 12, apartado 24) ──');

const lineas = diaARutina(planPorId(PPL), 0).lineas.slice(0, 2);
const DOS = crearPresetPlan({ id: 'dos-dias', nombre: 'Dos días', dias: [{ nombre: 'A', lineas }, { nombre: 'B', lineas }] });
const PLANES = [...CATALOGO_PLANES, DOS];
const fDos = { ...DEFAULT_FITNESS, planActivo: crearPlanActivo({ planId: 'dos-dias', desde: '2026-09-21' }) };
const sDos = getWeekPlan(HOY, fDos, { hoy: HOY, planes: PLANES });
ok(sDos.dias.map((d) => d.planificado?.nombre).join('') === 'ABABABA',
  `🚨 Cicla desde la activación: ${sDos.dias.map((d) => d.planificado?.nombre).join(' ')} (no se asume PPL)`);
ok(getWeekPlan(HOY, { ...fDos, planActivo: crearPlanActivo({ planId: 'dos-dias' }) }, { hoy: HOY, planes: PLANES }).estado === 'sin_semana',
  '…y sin fecha de activación no se reparte: se dice (F6, apartado 16)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. Plan de 7 días (prueba 13) ──');

const s13 = getWeekPlan(HOY, { ...DEFAULT_FITNESS, planActivo: crearPlanActivo({ planId: 'hipertrofia-6', desde: '2026-09-07' }) }, { hoy: HOY });
ok(s13.dias.filter((d) => d.planificado && !d.planificado.descanso).length === 6 && s13.dias[6].estado === 'unplanned',
  'Seis entrenamientos y el domingo sin plan');
/* Lunes y domingo como «hoy» (apartado 40). */
ok(auditarPlanificacion(F(), { hoy: '2026-09-21' }).ok && auditarPlanificacion(F(), { hoy: '2026-09-27' }).ok,
  'La auditoría pasa un lunes y un domingo');
ok(dia(getWeekPlan('2026-09-21', F(), { hoy: '2026-09-21' }), '2026-09-21').esHoy
  && dia(getWeekPlan('2026-09-27', F(), { hoy: '2026-09-27' }), '2026-09-27').esHoy,
  '…y el día de hoy es el lunes o el domingo, en su semana');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 14. Integración con el entrenamiento en vivo (prueba 14, apartados 11, 13, 19 y 36) ──');

/* Lo que hace FitnessView al pulsar «Empezar entrenamiento» en un día del plan. */
const plan14 = planPorId(PPL);
const planificado14 = getPlannedWorkoutForDay('2026-09-23', F(), { hoy: '2026-09-23' });
ok(planificado14 && planificado14.nombre === 'Legs' && planificado14.sesion.lineas.length > 0,
  'getPlannedWorkoutForDay: el Legs del miércoles, con sus ejercicios');
const rutina14 = diaARutina(plan14, planificado14.indice);
const inicio14 = new Date('2026-09-23T18:00:00').getTime();
let vivo = empezarSesion({
  nombre: planificado14.nombre, lineas: rutina14.lineas, planId: PPL, origenTipo: 'preset',
  origenId: plan14.dias[planificado14.indice].id, hoy: '2026-09-23', ahora: inicio14,
});
ok(vivo.planId === PPL && vivo.origen.id === 'ppl-estetico-dia-3', '🚨 La sesión guarda planId y el id del día (apartados 19 y 36)');
ok(vivo.origen.ejercicios.length === rutina14.lineas.length, '…y su snapshot: exactamente la rutina planificada');
const guardada = guardarEntrenamiento(pasarAFinalizacion(vivo, { ahora: inicio14 + 3000000 }), { confirmado: true, ahora: inicio14 + 3001000 }).sesion;
ok(guardada.diaDePlan && guardada.diaDePlan.diaId === 'ppl-estetico-dia-3', '…que al guardar congela en `diaDePlan` (F8)');
let f14 = guardarSesion(F(), guardada);
const d14 = dia(getWeekPlan('2026-09-23', f14, { hoy: '2026-09-23' }), '2026-09-23');
ok(d14.estado === 'completed' && d14.relacion === 'coincide', '🚨 …y el día queda «✓ Completado» por IDS, no por el nombre');
/* Repetir: una sesión NUEVA, sin tocar la anterior (apartados 12 y 13). */
const repetida = empezarSesion({
  nombre: planificado14.nombre, lineas: rutina14.lineas, planId: PPL, origenTipo: 'preset',
  origenId: plan14.dias[planificado14.indice].id, hoy: '2026-09-23', ahora: inicio14 + 7200000,
});
ok(repetida.id !== guardada.id && repetida.estado === 'en_curso'
  && repetida.origen.ejercicios.every((e) => e.series.every((s) => s.estado === 'pendiente')),
  '🚨 Repetir crea otra sesión con su snapshot NUEVO, sin el estado de la anterior');
f14 = guardarSesion(f14, repetida);
ok(f14.sesiones.find((s) => s.id === guardada.id).estado === 'completada', '…y la anterior sigue intacta');
ok(JSON.stringify(planPorId(PPL).dias[2]) === JSON.stringify(plan14.dias[2]), '…y el plan no se toca');
/* Apartado 20 — una rutina de «Tus plantillas» conserva su origen. */
const deOtra = S('otra', '2026-09-22', { nombre: 'Full Body', planId: 'pl-fb', tipo: 'plantilla', dia: 'pl-fb' });
const d14b = dia(getWeekPlan(HOY, F(deOtra), { hoy: HOY }), '2026-09-22');
ok(d14b.relacion === 'otro' && d14b.principal === TEXTO_OTRO && d14b.detalle === 'Planificado: Pull',
  '🚨 Otra rutina el día del Pull: «Otro entrenamiento realizado» · «Planificado: Pull» (apartados 17 y 18)');
ok(d14b.descripcion === 'Martes 22 de septiembre. Planificado: Pull. Realizado: Full Body.',
  `…y se conservan los dos: «${d14b.descripcion}»`);
ok(d14b.estado === 'completed' && !NEGATIVO.test(d14b.descripcion), '…sin marcar el plan como fallido');
ok(d14b.simbolo === '●' && d5.simbolo === '✓',
  '⚠️ …y con el ● de entrenamiento, no el ✓: junto a «Pull» diría que hizo el Pull');
/* Con una plantilla suya como plan, empezarla desde «Tus plantillas» es el mismo. */
const plantilla = { id: 'pl1', nombre: 'Mi rutina', ejercicios: rutina14.lineas };
const fPl = { ...DEFAULT_FITNESS, plantillas: [plantilla], planActivo: crearPlanActivo({ planId: 'pl1', origen: 'plantilla', desde: '2026-09-21' }) };
const dPl = dia(getWeekPlan(HOY, { ...fPl, sesiones: [S('pp', '2026-09-22', { nombre: 'Mi rutina', planId: 'pl1', tipo: 'plantilla', dia: 'pl1' })] }, { hoy: HOY }), '2026-09-22');
ok(dPl.relacion === 'coincide' && dPl.estado === 'completed', 'Con una plantilla como plan, hacerla desde «Tus plantillas» cuenta como la del plan');
/* 🚨 Pero sus días NO son «Planificado»: no tiene días fijos (F31, apartado 13). */
const sPl = getWeekPlan(HOY, fPl, { hoy: HOY });
ok(sPl.dias.every((d) => d.estado === 'unknown') && !sPl.dias.some((d) => /Planificado/.test(d.descripcion)),
  '🚨 Una plantilla como plan no tiene días fijos: ni un día «Planificado» (sería inventarle siete a la semana)');
ok(dia(sPl, '2026-09-22').principal === TEXTO_SIN_REGISTRO && dia(sPl, '2026-09-25').principal === 'Sin día fijo',
  '…lo que pasó sin ella, «Sin entrenamiento registrado»; lo que viene, «Sin día fijo»');
ok(dia(sPl, '2026-09-25').descripcion === 'Viernes 25 de septiembre. Mi rutina, sin día fijo.'
  && dia(sPl, '2026-09-25').acciones.empezar, `…y se puede empezar cualquier día: «${dia(sPl, '2026-09-25').descripcion}»`);
const conOtra = dia(getWeekPlan(HOY, { ...fPl, sesiones: [S('o', '2026-09-22', { nombre: 'Core', planId: 'pl-core', tipo: 'plantilla', dia: 'pl-core' })] }, { hoy: HOY }), '2026-09-22');
ok(conOtra.estado === 'unknown' && conOtra.principal === TEXTO_REALIZADO,
  '…y otra rutina ese día es «Entrenamiento realizado»: ni extra ni «otro», porque no había nada fijo');
ok(resumenDeActividad(fPl, { hoy: HOY }).semana.dias.every((d) => !d.planificado),
  '🚨 …igual que en la actividad de la F31, que tampoco le pone plan a esos días');
/* Sin ningún enlace: no se asume nada. */
const dSin = dia(getWeekPlan(HOY, F(S('sin', '2026-09-22', { sinEnlace: true, nombre: 'Algo' })), { hoy: HOY }), '2026-09-22');
ok(dSin.relacion === 'desconocida' && dSin.principal === TEXTO_REALIZADO,
  '🚨 Una sesión sin enlace dice «Entrenamiento realizado»: no se asume que es la del plan (apartado 20)');
ok(enlaceDeSesion(null) === null && relacionConElDia(null, null) === 'desconocida', '…y sin sesión no revienta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 15. Integración con el Historial (prueba 15, apartado 37) ──');

const f15 = F(S('h1', '2026-09-21', { dia: 1 }), S('h2', '2026-09-22', { dia: 2, estado: 'descartada' }));
const s15 = getWeekPlan(HOY, f15, { hoy: HOY });
const idsHist = new Set(sesionesDelHistorial(f15).map((s) => s.id));
ok(s15.dias.every((d) => d.realizadas.every((r) => idsHist.has(r.id))),
  '🚨 Toda sesión de la semana está en el Historial: se abre con su detalle, sin otra pantalla');
ok(dia(s15, '2026-09-22').estado === 'planned_not_completed', '…y una descartada NO cuenta como hecha');
ok(auditarPlanificacion(f15, { hoy: HOY }).ok, 'La auditoría pasa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 16. Integración con la Actividad (prueba 16, apartado 34) ──');

const f16 = F(S('a1', '2026-09-21', { dia: 1 }), S('a2', HOY, { nombre: 'Core', planId: 'pl-core', tipo: 'plantilla', dia: 'pl-core' }));
const act = resumenDeActividad(f16, { hoy: HOY });
const s16 = getWeekPlan(HOY, f16, { hoy: HOY });
const equivale = { entrenado: ['completed', 'completed_extra', 'unknown'], descanso: ['unplanned'], sin_registro: ['planned_not_completed', 'unknown'], futuro: ['planned', 'unplanned', 'unknown'] };
ok(act.semana.dias.every((a, i) => equivale[a.estado].includes(s16.dias[i].estado)),
  `🚨 La actividad (F31) y la planificación dicen lo mismo de cada día: ${act.semana.dias.map((a, i) => `${a.estado}/${s16.dias[i].estado}`).join(' ')}`);
ok(act.semana.dias.every((a, i) => a.sesiones.map((x) => x.id).join() === s16.dias[i].realizadas.map((x) => x.id).join()),
  '…y las mismas sesiones en cada día, en el mismo orden');
ok(act.semana.dias[3].etiqueta === '24 de septiembre — entrenamiento Core'
  && act.semana.dias[6].etiqueta === '27 de septiembre — todavía no ha llegado',
  'Las etiquetas de la F31 siguen siendo las suyas');
ok(resumenDeActividad(F(), { hoy: '2026-09-27' }).semana.dias[3].etiqueta === '24 de septiembre — sin entrenamiento planificado',
  '🔓 …y el jueves pasado sin plan dice «sin entrenamiento planificado» (antes «descanso del plan»)');
ok(act.plan && act.plan.texto === '2 / 5 sesiones planificadas',
  `…y el seguimiento del plan de la F31 no cambia: «${act.plan && act.plan.texto}»`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 17. Persistencia (prueba 17) ──');

const vuelta17 = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f14)));
const antes17 = getWeekPlan('2026-09-23', f14, { hoy: '2026-09-23' });
const despues17 = getWeekPlan('2026-09-23', vuelta17, { hoy: '2026-09-23' });
ok(antes17.dias.map((d) => `${d.estado}/${d.relacion}/${d.realizadas.length}`).join()
  === despues17.dias.map((d) => `${d.estado}/${d.relacion}/${d.realizadas.length}`).join(),
  '🚨 Tras recargar, la semana dice exactamente lo mismo: el enlace de cada sesión se guarda');
ok(vuelta17.sesiones.every((s) => s.estado !== 'completada' || (s.diaDePlan && s.diaDePlan.diaId)),
  '…con su `diaDePlan`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 18. Responsive (prueba 18, apartado 38) ──');

const COMP = leer('src/components/planificacionSemanal.jsx');
ok(/grid grid-cols-7/.test(COMP), 'La semana es una rejilla de siete: cabe entera a 375 px y en escritorio');
ok(!/min-w-\[(?:[5-9]\d|\d{3,})px\]|w-\[(?:[4-9]\d{2}|\d{4,})px\]/.test(COMP), '…sin anchos fijos que la hagan desbordar');
ok(!/animate-|@keyframes|animation:/.test(sinComentarios(COMP)), '…y el día de hoy se marca sin animaciones (apartado 8)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 19. Plan corrupto o sin días (apartado 23) ──');

const vacia = { id: 'pv', nombre: 'Vacía', ejercicios: [] };
const fVacia = { ...DEFAULT_FITNESS, plantillas: [vacia], planActivo: crearPlanActivo({ planId: 'pv', origen: 'plantilla', desde: '2026-09-21' }) };
const sVacia = getWeekPlan(HOY, fVacia, { hoy: HOY });
ok(sVacia.estado === 'invalido' && sVacia.dias.length === 0, '🚨 Un plan sin ningún día con ejercicios es `invalido`');
ok(PLAN_INVALIDO.titulo === 'Este plan no tiene una planificación válida.' && PLAN_INVALIDO.editar === 'Editar plan',
  '…con las palabras del apartado 23');
ok(tuPlan(fVacia, { hoy: HOY }).invalido === true, '…y Tu Plan lo sabe, en vez de romperse');
ok(!planValido({ dias: [] }) && !planValido(null) && !planValido({ dias: [{ descanso: true }] }) && planValido(planPorId(PPL)),
  'planValido: sin días, sin nada o todo descanso no valen; un plan de la biblioteca sí');
ok(getWeekPlan(HOY, { ...DEFAULT_FITNESS, planActivo: crearPlanActivo({ planId: 'no-existe' }) }, { hoy: HOY }).estado === 'perdido',
  'Un plan que ya no existe: `perdido`, que es el estado de la F6');
ok(getWeekPlan('no-es-fecha', F(), { hoy: HOY }).lunes === '2026-09-21', 'Una fecha inválida cae en la semana de hoy');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 20. Sesión parcial, duración y ejercicios (apartados 26, 27 y 40) ──');

const parcial = S('par', '2026-09-21', { dia: 1 });
parcial.origen.ejercicios = [{ id: 'e1', exerciseId: 'press-banca-barra', series: [
  { id: 's1', estado: 'hecha', hecho: { reps: 8, peso: 60 }, plan: {} },
  { id: 's2', estado: 'pendiente', hecho: {}, plan: {} },
] }];
const dPar = dia(getWeekPlan(HOY, F(parcial), { hoy: HOY }), '2026-09-21');
ok(dPar.estado === 'completed' && dPar.realizadas[0].estadoSesion === 'Parcial',
  'Una sesión parcial cuenta como hecha y lo dice: «Parcial»');
const dFut = dia(s1, '2026-09-25');
ok(dFut.planificado.ejercicios === planPorId(PPL).dias[4].lineas.length && /≈ \d+ min/.test(dFut.planificado.duracion),
  `El número REAL de ejercicios y la duración estimada (${dFut.planificado.ejercicios} · ${dFut.planificado.duracion})`);
ok(dFut.planificado.musculos.length > 0 && dFut.planificado.musculos.length <= 3, `…y sus músculos principales (${dFut.planificado.musculos.join(', ')})`);
ok(TEXTO_SIN_DURACION === 'Duración no disponible', 'Sin duración, «Duración no disponible»: no se inventa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 21. Lo que no se construye, y lo que ya estaba (apartados 2, 30 y 42) ──');

ok(YA_LO_RESUELVE.every((y) => typeof y.es === 'function' && y.es.name === y.nombre),
  `🚨 YA_LO_RESUELVE guarda las ${YA_LO_RESUELVE.length} funciones de otras fases, no sus nombres`);
ok(YA_LO_RESUELVE.some((y) => y.es === semanaDelPlan) && YA_LO_RESUELVE.some((y) => y.es === resumenDeActividad),
  '…entre ellas la semana de la F6 y la actividad de la F31: no hay una tercera semana (apartado 2)');
const LIB = sinComentarios(leer('src/lib/planificacionSemanal.js'));
const LIB_SIN_TABLAS = LIB.replace(/export const NO_EN_FIT32[\s\S]*?\n\];/, '').replace(/export const DECISIONES_FIT32[\s\S]*?\n\];/, '')
  .replace(/export const ESTADOS_PLANIFICACION[\s\S]*?\n\];/, '');
ok(!/DIAS_SEMANA\.map|for \(let [a-z]+ = 0; [a-z]+ < 7/.test(LIB), '🚨 La librería NO recorre los siete días por su cuenta: se los pide a `semanaDelPlan`');
ok(/DIAS_SEMANA\.map/.test('return DIAS_SEMANA.map((d, i) => x);'), '…(y la comprobación sí caza un recorrido propio)');
const JUEGO = /\bxp\b|\bpuntos?\b|\bracha|\bnivel(es)?\b|recompensa|\bscore\b|predic|penaliz|\bia\b/i;
ok(!JUEGO.test(LIB_SIN_TABLAS), '🚨 Ni XP, ni puntos, ni rachas, ni predicciones, ni IA en el código (apartado 42)');
ok(JUEGO.test('const racha = 3;') && JUEGO.test('otorgar xp'), '…(y el barrido sí los caza)');
ok(NO_EN_FIT32.some((n) => /IA/.test(n.que) && /racha/i.test(n.que)), '…declarado en NO_EN_FIT32, que es la tabla que el barrido no mira');
/* ⚠️ Sin la auditoría: su casilla `sin_puntuacion` NOMBRA el porcentaje para
   comprobar que no sale (la lección de NO_EN_FIT25, otra vez). */
const LIB_SIN_AUDITORIA = LIB_SIN_TABLAS.replace(/export function auditarPlanificacion[\s\S]*$/, '');
const PORCENTAJE = /\d+\s*%|\}\s*%|%\s*\$\{|porcentaje/i;
ok(!PORCENTAJE.test(LIB_SIN_AUDITORIA), '🚨 Ni un porcentaje de adherencia (apartado 42)');
ok(PORCENTAJE.test('texto: `${hechas}%`') && PORCENTAJE.test('82 % cumplido'), '…(y el barrido sí caza uno)');
ok(DECISIONES_FIT32.length >= 6 && DECISIONES_FIT32.every((d) => d.que && d.porque), 'Cada decisión con su porqué');
const COMP_SIN = sinComentarios(COMP);
ok(!/from '\.\.\/lib\/(?!helpers)/.test(COMP_SIN) && !/semanaDelPlan|posicionDelDia|sesionesDeActividad|estadoDeCasilla/.test(COMP_SIN),
  '🚨 Los componentes NO calculan: solo importan `hexToRgba` de la librería (apartado 30)');
ok(/semanaDelPlan/.test('const s = semanaDelPlan(plan);'), '…(y la comprobación sí caza un cálculo)');
/* La auditoría tiene que poder ponerse roja. */
const falsa = { ...s1, dias: s1.dias.map((d, i) => (i === 3 ? { ...d, principal: 'Descanso', descripcion: 'Jueves. Descanso.' } : d)) };
ok(!auditarPlanificacion(f1, { hoy: HOY }, falsa).ok && auditarPlanificacion(f1, { hoy: HOY }, falsa).casillas.find((c) => c.id === 'sin_descanso').ok === false,
  '🚨 La auditoría se pone ROJA con un día que dice «Descanso» (EH F42)');
ok(auditarPlanificacion(f1, { hoy: HOY }).ok, '…y verde con la semana de verdad');
ok(estadoDeCasilla({ fecha: HOY, planificado: null, realizadas: [] }, { hoy: HOY }) === 'unknown'
  && estadoDeCasilla({ fecha: HOY, planificado: { sinPlan: true }, realizadas: [{}] }, { hoy: HOY }) === 'completed_extra',
  'estadoDeCasilla: sin plan conocido, `unknown`; con un hueco sin plan y una sesión, extra');
ok(ESTADOS_PLANIFICACION.map((e) => e.id).join() === 'planned,completed,planned_not_completed,unplanned,completed_extra,unknown',
  'Los seis estados del apartado 31, con sus ids');
ok(getDayTrainingStatus(HOY, f1, { hoy: HOY }).estado === 'unplanned' && getDayTrainingStatus('2026-09-21', f1, { hoy: HOY }).estado === 'completed',
  'getDayTrainingStatus: el estado de un día');
ok(diaDePlanificacion({ fecha: HOY, planificado: null, realizadas: [] }, { hoy: HOY }).descripcion === 'Jueves 24 de septiembre (hoy). Sin datos del plan. Sin entrenamiento registrado.',
  'Sin datos del plan, se dice —y se dice que no hay registro—');
ok(estructuraDelPlan(null) === null && estructuraDelPlan({ id: 'pl1', nombre: 'X' }, 'plantilla').dias[0].id === 'pl1-dia',
  'estructuraDelPlan: una plantilla es un día, con el mismo id que Tu Plan');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones correctas\x1b[0m`);
if (fallos > 0) {
  console.log(`\x1b[31m${fallos} fallo(s) en FIT F32\x1b[0m`);
  process.exit(1);
}
console.log('\x1b[32m═══ FIT F32 CORRECTA ═══\x1b[0m');
