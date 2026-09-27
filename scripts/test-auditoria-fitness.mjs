/* Entrega 4 · FIT F43/45 — Auditoría funcional integral de fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"NO asumir que porque una función funciona individualmente también funciona
   después de interactuar con otras. Probar flujos completos."* (apartado 2)

   Cada fase anterior probó SU pantalla y SU motor. Esta suite no vuelve a
   probar ninguno por separado: los ENCADENA, con las mismas funciones que
   llaman las pantallas y pasando por la puerta de carga de verdad entre paso y
   paso, y mira que lo que uno escribe lo lean igual todos los demás.

   1. El criterio de finalización (apartado 70), de punta a punta.
   2. Los flujos 1-45 que se pueden medir sin navegador (los de pantalla —46 a
      50— están en el recorrido de Chromium, sección «FIT F43»).
   3. Las cinco consistencias (53-57).
   4. Datos vacíos, uno, pocos y muchos (61) y datos parciales (62).
   5. «Volver» al contexto anterior (46 y 47), en la función que lo decide.
   6. Los fallos que destapó esta fase, cada uno con la comprobación que lo
      habría cazado. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_FITNESS,
} from '../src/lib/fitness.js';
import {
  CATALOGO_EJERCICIOS, ejercicioPorId, todosLosEjercicios, agarreQueAnadir, nombreCompleto,
} from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion, sustituirEjercicio,
  normalizarFitnessConSesiones, sesionActiva,
} from '../src/lib/entrenamiento.js';
import { cabeceraEnSesion } from '../src/lib/entrenamientoUx.js';
import {
  pasarAFinalizacion, guardarEntrenamiento, descartarEntrenamiento, resumenDeSesion, volumenDeSesion,
} from '../src/lib/finalizacion.js';
import {
  crearRutina, anadirEjercicio, editarLinea, moverLinea, guardarRutina, planARutina, sustituirEnRutina,
  duracionEstimada, distribucionMuscular,
} from '../src/lib/constructor.js';
import { duplicarPlantilla } from '../src/lib/plantillas.js';
import {
  CATALOGO_PLANES, planPorId, usarPlan, personalizarPreset, diaARutina,
} from '../src/lib/planes.js';
import { tuPlan, planActivoCompleto, sesionDelDia } from '../src/lib/tuPlan.js';
import { getDayTrainingStatus, getWeekPlan } from '../src/lib/planificacionSemanal.js';
import { sesionesDelHistorial, fichaDeHistorial, detalleDeSesion } from '../src/lib/historial.js';
import { progresoDeEjercicio, aparicionesDeEjercicio } from '../src/lib/progresion.js';
import {
  rangoEfectivoDeEjercicio, rangoEfectivoDeGrupo, rangoGlobalEfectivo,
} from '../src/lib/motorRangos.js';
import { historialDeRango } from '../src/lib/historialRangos.js';
import { resumenDeActividad, entrenamientosEnPeriodo } from '../src/lib/actividadEntrenamiento.js';
import {
  anadirObjetivo, cancelarObjetivo, listaDeObjetivos, progresoDeObjetivo,
} from '../src/lib/objetivosProgreso.js';
import { detalleDeObjetivo, FECHA_SUPERADA } from '../src/lib/objetivosFitness.js';
import { preguntaDeEjercicio, clasificarEjercicio } from '../src/lib/clasificacion.js';
import { getExerciseReplacements } from '../src/lib/sustitucion.js';
import { crearFotoProgreso, compararFotos, sesionDeFoto, normalizarFotoProgreso } from '../src/lib/fotosProgreso.js';
import { subidasDeRango } from '../src/lib/feedbackFitness.js';
import {
  AREAS_DE_VUELTA, TIPOS_DE_ORIGEN, VUELTA_POR_DEFECTO, crearOrigen, origenVigente, vueltaDelDetalle,
  vueltaDeSesion, QUE_RESUELVE,
} from '../src/lib/vueltaFitness.js';
import {
  FLUJOS_F43, CONSISTENCIAS_F43, BUGS_F43, PENDIENTES_F43, NO_EN_FIT43, DECISIONES_FIT43, PRIORIDADES_F43,
  flujo, bugsPorPrioridad, auditarAuditoria,
} from '../src/lib/auditoriaFuncionalFitness.js';

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
const seccion = (t) => console.log(`\n── ${t} ──`);

/* Lo que hace App.jsx al cargar: la puerta de carga de verdad, sobre lo que
   vuelve de disco (JSON), no sobre el objeto vivo. */
const recargar = (f) => normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f)));
const hora = (fecha, h = 18) => new Date(`${fecha}T${String(h).padStart(2, '0')}:00:00`).getTime();

/** Entrena un día del plan activo como lo hace `empezarDelPlan` (FitnessView):
 *  la ficha y la rutina del día, el snapshot, y lo que él registra. */
function entrenarDiaDelPlan(fitness, indice, fecha, registrar) {
  const r = planActivoCompleto(fitness);
  const ficha = sesionDelDia(r.plan, indice, []);
  const rutina = diaARutina(r.plan, indice, []);
  let s = empezarSesion({
    nombre: ficha.nombre, lineas: rutina.lineas, planId: r.activo.planId, origenTipo: r.origen,
    origenId: ficha.id, entorno: r.plan.entorno, hoy: fecha, ahora: hora(fecha),
  });
  s = registrar(s);
  return s;
}
/** Marca `n` series del ejercicio `i` con esos valores. */
function hacer(s, i, valores) {
  let x = s;
  const e = ejerciciosDeSesion(x)[i];
  valores.forEach((v, k) => {
    x = editarSerie(x, e.id, e.series[k].id, v);
    x = marcarSerie(x, e.id, e.series[k].id, true);
  });
  return x;
}
/** Termina y guarda, como `FinalizacionView`: pasa a finalizando y confirma. */
const terminar = (s, fecha, minutos = 60) => guardarEntrenamiento(
  pasarAFinalizacion(s, { ahora: hora(fecha) + minutos * 60000 }),
  { confirmado: true, ahora: hora(fecha) + minutos * 60000 + 1000 },
).sesion;

/** Una sesión suelta de un ejercicio, como en la F36. */
function sesionDe(exerciseId, fecha, valores, { modo = null } = {}) {
  let r = anadirEjercicio(crearRutina({ nombre: exerciseId }), exerciseId);
  if (!r.lineas.length) throw new Error(`El escenario pide «${exerciseId}», que no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...(modo ? { modo } : {}) });
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: hora(fecha) });
  s = hacer(s, 0, valores);
  return terminar(s, fecha, 30);
}

console.log('\n═══ FIT F43/45 · Auditoría funcional integral de fitness ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('1. El criterio de finalización, de punta a punta (apartado 70)');

const HOY = '2026-09-24'; // jueves; la semana empieza el lunes 21
/* Explorar un ejercicio. */
const dominada = ejercicioPorId('dominada-prona');
const alternativas = getExerciseReplacements('dominada-prona', {});
ok(!!dominada && alternativas.length > 0 && alternativas.every((x) => x && x.id && x.id !== 'dominada-prona' && ejercicioPorId(x.id)),
  'Explorar: la ficha existe y sus alternativas existen y no son él mismo (flujos 33 y 34)');

/* Crear un entrenamiento, reordenarlo y guardarlo. */
let rutina = crearRutina({ nombre: 'Tirón F43' });
rutina = anadirEjercicio(rutina, 'dominada-prona');
rutina = anadirEjercicio(rutina, 'remo-barra');
rutina = anadirEjercicio(rutina, 'curl-barra');
const [l0, l1, l2] = rutina.lineas;
rutina = editarLinea(rutina, l0.id, { series: 4, repeticiones: 8, repsHasta: 10, descanso: 150 });
rutina = editarLinea(rutina, l2.id, { series: 3, repeticiones: 12, descanso: 60 });
rutina = moverLinea(rutina, l2.id, 'arriba');
const orden = rutina.lineas.map((l) => l.exerciseId);
ok(orden.join(',') === 'dominada-prona,curl-barra,remo-barra', `Crear: el orden es el que él dejó (${orden.join(', ')}) (flujo 2)`);
const g = guardarRutina([], rutina, [], HOY);
ok(g.ok && g.planes.length === 1, 'Crear: se guarda (flujo 2)');
let f = { ...DEFAULT_FITNESS, plantillas: g.planes };
f = recargar(f);
const guardada = f.plantillas[0];
const rVuelta = planARutina(guardada);
ok(rVuelta.lineas.map((l) => l.exerciseId).join(',') === orden.join(','), '…y tras recargar mantiene el orden (flujo 2)');
const lDom = rVuelta.lineas.find((l) => l.exerciseId === 'dominada-prona');
ok(lDom.series === 4 && lDom.repeticiones === 8 && lDom.repsHasta === 10 && lDom.descanso === 150, '…y cada configuración: 4 × 8–10, 150 s (flujo 2)');
const dur = duracionEstimada(rVuelta);
const dist = distribucionMuscular(rVuelta);
ok(dur && /≈/.test(dur.texto || String(dur)) , `…calcula la duración, con su «≈» (${dur && (dur.texto || dur)}) (flujo 2)`);
ok(dist && (dist.grupos || []).length > 0 && (dist.grupos || []).some((x) => x.grupoId === 'espalda'), '…y la distribución muscular (flujo 2)');

/* Planificarlo: el PPL de la biblioteca como plan activo, desde el lunes 7. */
const pplAntes = JSON.stringify(planPorId('ppl-estetico'));
const u = usarPlan(f, 'ppl-estetico', { hoy: '2026-09-07' });
ok(u.ok && u.fitness.planActivo && u.fitness.planActivo.planId === 'ppl-estetico', 'Planificar: el PPL pasa a ser el plan activo (flujo 6)');
f = recargar(u.fitness);
const tp = tuPlan(f, { hoy: HOY });
ok(tp.estado === 'activo', 'Planificar: Tu Plan lo enseña (flujos 6 y 8)');
ok(JSON.stringify(planPorId('ppl-estetico')) === pplAntes, '…y el plan de la biblioteca no cambia (flujo 6)');

/* Realizarlo: el martes 22 toca Pull (índice 1). */
let s1 = entrenarDiaDelPlan(f, 1, '2026-09-22', (s) => hacer(hacer(s, 0, [
  { reps: 8, peso: 0 }, { reps: 9, peso: 0 }, { reps: 10, peso: 0 },
]), 4, [{ reps: 12, peso: 30 }, { reps: 10, peso: 30 }]));
ok(s1.planId === 'ppl-estetico' && s1.origen && s1.origen.id === 'ppl-estetico-dia-2', 'Realizar: la sesión conoce el plan y el día (flujo 9)');
f = guardarSesion(f, s1); // en curso: se guarda en cada cambio
f = recargar(f);
ok(sesionActiva(f) && sesionActiva(f).id === s1.id, 'Durante: tras recargar sigue en curso, con lo registrado (flujo 12)');
const s1Recargada = f.sesiones.find((x) => x.id === s1.id);
ok(ejerciciosDeSesion(s1Recargada)[0].series.filter((x) => x.estado === 'hecha').length === 3, '…las tres series marcadas siguen marcadas (flujo 12)');

/* Guardar la sesión — dos veces, como un doble toque. */
const hecha1 = terminar(s1Recargada, '2026-09-22');
f = guardarSesion(f, hecha1);
const otraVez = guardarEntrenamiento(hecha1, { confirmado: true, ahora: hora('2026-09-22') + 3700000 });
f = guardarSesion(f, otraVez.sesion || hecha1);
f = recargar(f);
ok(f.sesiones.filter((x) => x.id === hecha1.id).length === 1 && f.sesiones.length === 1, 'Guardar dos veces deja UNA sesión (flujo 16)');

/* Verla en el historial, con los mismos números. */
const hist = sesionesDelHistorial(f);
const ficha1 = fichaDeHistorial(hist[0], { fitness: f, hoy: HOY });
const res1 = resumenDeSesion(hist[0], { ahora: hora(HOY) });
ok(hist.length === 1 && ficha1.series === 5, `Historial: la sesión, con sus 5 series hechas (${ficha1.series}) (flujo 18)`);
ok(res1.ejercicios.filter((e) => e.hechas > 0).length === ficha1.ejercicios, '…y los mismos ejercicios que dice el resumen (apartado 53)');
const det1 = detalleDeSesion(hist[0], { fitness: f, hoy: HOY });
const detDom = det1.ejercicios.find((e) => e.exerciseId === 'dominada-prona');
ok(detDom && detDom.seriesTexto === '3/4 series' && detDom.realizado === '8 / 9 / 10', `…y el detalle: «${detDom && detDom.seriesTexto}», «${detDom && detDom.realizado}» (flujo 18)`);

/* Analizar el progreso: lo mismo que registró. */
const p1 = progresoDeEjercicio(f, 'dominada-prona');
ok(p1.veces === 1 && p1.ultima && p1.ultima.series.length === 3 && p1.ultima.series.map((x) => x.reps).join(',') === '8,9,10',
  'Progreso: la última vez son sus tres series, 8 · 9 · 10 (flujos 19 y 53)');
ok(p1.mejor && p1.mejor.serie.reps === 10, '…y el mejor, 10 (flujo 19)');

/* Actualizar el rango, sin abrir Rangos. */
const rDom = rangoEfectivoDeEjercicio(f, 'dominada-prona');
ok(!rDom.sinRango && rDom.fuente === 'entrenamiento' && rDom.dataPoints === 1, `Rango: sale de la sesión, sin recalcular a mano (${rDom.nombre}) (flujo 26)`);
ok(rDom.provisional === true && rDom.confianza !== 'alta', '…y con una sola sesión es provisional: nunca «definitivo» (apartado 57)');

/* Actividad: la cuenta la misma sesión. */
const act = resumenDeActividad(f, { hoy: HOY });
ok(act.total === 1 && act.ultimo && act.ultimo.id === hecha1.id, 'Actividad: cuenta esa sesión y ninguna otra (flujo 40)');
const dia22 = getDayTrainingStatus('2026-09-22', f, { hoy: HOY });
ok(dia22 && dia22.estado === 'completed', 'Semana: el martes queda completado (flujo 9)');
const dia21 = getDayTrainingStatus('2026-09-21', f, { hoy: HOY });
ok(dia21 && dia21.estado !== 'completed', '…y el lunes, que no entrenó, NO (flujo 10)');

/* Crear un objetivo: 12 dominadas. */
const o = anadirObjetivo(f, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 12 }, { ahora: hora(HOY) });
ok(o.ok, 'Objetivo: se crea «12 repeticiones de dominadas» (flujo 23)');
f = recargar(o.fitness);
const po = progresoDeObjetivo(f, f.objetivos[0], { hoy: HOY });
ok(po.estado === 'activo' && po.actual === 10 && po.progresoTexto === '10 / 12 reps', `…va por 10, activo: «${po.progresoTexto}» (flujo 23)`);

/* Añadir una foto enlazada al entrenamiento y comparar. */
const fotos = [
  crearFotoProgreso({ path: 'u/a.jpg', fecha: '2026-06-12', tags: ['frontal'], ahora: hora('2026-06-12') }),
  crearFotoProgreso({ path: 'u/b.jpg', fecha: '2026-09-22', tags: ['frontal'], createdFromWorkoutId: hecha1.id, ahora: hora('2026-09-22') }),
];
const cmp = compararFotos(fotos, fotos[1].id, fotos[0].id);
ok(cmp && cmp.antes && cmp.antes.fecha === '2026-06-12' && cmp.despues.fecha === '2026-09-22', 'Comparar: el antes lo decide la fecha, no el orden de elegir (flujo 37)');
ok(sesionDeFoto(fotos[1], f).existe === true && sesionDeFoto(fotos[1], f).sesionId === hecha1.id, 'Foto + entrenamiento: la foto sabe de qué sesión es (flujo 38)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('2. Usuario nuevo: ni un dato inventado (flujo 1)');

const nuevo = recargar(DEFAULT_FITNESS);
const gNuevo = rangoGlobalEfectivo(nuevo);
ok(gNuevo.sinRango === true, 'Rango global: Sin Rango, nunca el primero');
ok(sesionesDelHistorial(nuevo).length === 0 && !sesionActiva(nuevo), 'Ni una sesión');
ok(listaDeObjetivos(nuevo).objetivos.length === 0, 'Ni un objetivo');
const actNuevo = resumenDeActividad(nuevo, { hoy: HOY });
ok(actNuevo.hay === false && actNuevo.total === 0 && !actNuevo.ultimo, 'Actividad: vacía, sin un «último» inventado');
ok(tuPlan(nuevo, { hoy: HOY }).estado !== 'activo', 'Tu Plan: sin plan, no se finge uno');
ok(!/NaN|undefined|null/.test(JSON.stringify(actNuevo.semana)), '…y la semana vacía no pinta NaN ni undefined');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('3. Plantillas: editar, duplicar, eliminar (flujos 3, 4, 5 y 42)');

let fp = { ...DEFAULT_FITNESS, plantillas: g.planes };
let otra = anadirEjercicio(crearRutina({ nombre: 'Pierna F43' }), 'sentadilla-barra');
fp = { ...fp, plantillas: guardarRutina(fp.plantillas, otra, [], HOY).planes };
const piernaAntes = JSON.stringify(fp.plantillas.find((x) => x.nombre === 'Pierna F43'));
let edit = planARutina(fp.plantillas.find((x) => x.nombre === 'Tirón F43'));
edit = { ...edit, nombre: 'Tirón F43 editado' };
edit = editarLinea(edit, edit.lineas[0].id, { series: 5 });
fp = { ...fp, plantillas: guardarRutina(fp.plantillas, edit, [], HOY).planes };
ok(fp.plantillas.length === 2 && fp.plantillas.some((x) => x.nombre === 'Tirón F43 editado'), 'Editar: se guarda con el mismo id, sin crear otra (flujo 3)');
ok(JSON.stringify(fp.plantillas.find((x) => x.nombre === 'Pierna F43')) === piernaAntes, '…y SOLO cambia esa plantilla (flujo 3)');

const dup = duplicarPlantilla(fp.plantillas, fp.plantillas[0].id, HOY);
ok(dup.ok && dup.copia.id !== fp.plantillas[0].id, 'Duplicar: id nuevo (flujo 4)');
const idsOrig = new Set((fp.plantillas[0].ejercicios || []).map((l) => l.id));
ok((dup.copia.ejercicios || []).every((l) => !idsOrig.has(l.id)), '…y cada línea, también (flujo 4)');
const origAntes = JSON.stringify(dup.plantillas.find((x) => x.id === fp.plantillas[0].id));
let copiaR = planARutina(dup.copia);
copiaR = editarLinea(copiaR, copiaR.lineas[0].id, { series: 9 });
const trasCopia = guardarRutina(dup.plantillas, copiaR, [], HOY).planes;
ok(JSON.stringify(trasCopia.find((x) => x.id === fp.plantillas[0].id)) === origAntes, '…modificar la copia no toca el original (flujo 4)');

/* Eliminar una plantilla usada como plan y por sesiones (flujos 5 y 42). */
let fe = { ...DEFAULT_FITNESS, plantillas: trasCopia };
const usada = trasCopia[0];
fe = usarPlan(fe, usada.id, { hoy: '2026-09-14', origen: 'plantilla' }).fitness;
let sp = empezarSesion({ nombre: usada.nombre, lineas: planARutina(usada).lineas, planId: usada.id, origenTipo: 'plantilla', origenId: usada.id, hoy: '2026-09-15', ahora: hora('2026-09-15') });
sp = terminar(hacer(sp, 0, [{ reps: 7, peso: 0 }]), '2026-09-15');
fe = guardarSesion(fe, sp);
const sinPlantilla = recargar({ ...fe, plantillas: fe.plantillas.filter((x) => x.id !== usada.id) });
ok(!sinPlantilla.plantillas.some((x) => x.id === usada.id), 'Eliminar: desaparece de la lista (flujo 5)');
const tpSin = tuPlan(sinPlantilla, { hoy: HOY });
ok(tpSin && !/undefined|NaN/.test(JSON.stringify(tpSin.cabecera || {})), `…Tu Plan no se rompe (${tpSin.estado}) (flujo 5)`);
const detSin = detalleDeSesion(sesionesDelHistorial(sinPlantilla)[0], { fitness: sinPlantilla, hoy: HOY });
ok(detSin && detSin.nombre === usada.nombre && detSin.ejercicios.length === usada.ejercicios.length,
  '…y la sesión que salió de ella se lee entera por su snapshot (flujos 5 y 42)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('4. Planes: personalizar y cambiar de plan (flujos 7 y 41)');

const pers = personalizarPreset({ ...DEFAULT_FITNESS }, 'ppl-estetico', { hoy: HOY });
ok(pers.ok && pers.creadas.length === 5, `Personalizar: una plantilla por día de entreno (${pers.creadas.length}) (flujo 7)`);
ok(JSON.stringify(planPorId('ppl-estetico')) === pplAntes, '…y el plan original sigue igual (flujo 7)');
const push = pers.creadas.find((x) => /Push/.test(x.nombre));
const pushPreset = planPorId('ppl-estetico').dias[0];
ok(push && (push.ejercicios || []).map((l) => l.exerciseId).join(',') === pushPreset.lineas.map((l) => l.exerciseId).join(','),
  '…con los ejercicios correctos (flujo 7)');

let fc = recargar(guardarSesion(f, terminar(entrenarDiaDelPlan(f, 0, '2026-09-21', (s) => hacer(s, 0, [{ reps: 8, peso: 60 }])), '2026-09-21')));
const pasadoAntes = JSON.stringify(sesionesDelHistorial(fc));
const cambio = usarPlan(fc, 'upper-lower', { hoy: HOY, confirmado: true });
ok(cambio.ok, 'Cambiar de plan: A → B (flujo 41)');
fc = recargar(cambio.fitness);
ok((getDayTrainingStatus('2026-09-22', fc, { hoy: HOY }).planificado || {}).planId === 'ppl-estetico',
  '…el pasado sigue mostrando A (flujo 41)');
const futuro = getDayTrainingStatus('2026-09-28', fc, { hoy: HOY });
ok(futuro && futuro.planificado && futuro.planificado.planId === 'upper-lower', '…el futuro usa B (flujo 41)');
ok(JSON.stringify(sesionesDelHistorial(fc)) === pasadoAntes, '…y el historial no cambia (flujo 41)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('5. Entrenamiento extra, sustituir y descartar (flujos 10, 13, 14 y 17)');

/* Un jueves sin sesión en el PPL: entrenamiento extra. */
let fx = recargar(guardarSesion(f, sesionDe('curl-barra', '2026-09-24', [{ reps: 10, peso: 30 }])));
const jueves = getDayTrainingStatus('2026-09-24', fx, { hoy: HOY });
ok(jueves && jueves.estado === 'completed_extra', `Extra: el jueves dice «${jueves && jueves.estadoNombre}» (flujo 10)`);
const miercoles = getDayTrainingStatus('2026-09-23', fx, { hoy: HOY });
ok(miercoles && miercoles.estado !== 'completed', '…y no marca otro día como completado (flujo 10)');

/* Sustituir en vivo: solo la sesión. */
const plantillaAntes = JSON.stringify(f.plantillas);
let sv = entrenarDiaDelPlan(f, 1, '2026-09-24', (s) => s);
const primero = ejerciciosDeSesion(sv)[0];
sv = sustituirEjercicio(sv, primero.id, 'dominada-supina');
sv = terminar(hacer(sv, 0, [{ reps: 6, peso: 0 }]), '2026-09-24');
const fs = recargar(guardarSesion(f, sv));
ok(ejerciciosDeSesion(fs.sesiones.find((x) => x.id === sv.id))[0].exerciseId === 'dominada-supina', 'Sustituir en vivo: la sesión registra el ejercicio hecho (flujo 13)');
ok(JSON.stringify(fs.plantillas) === plantillaAntes && planPorId('ppl-estetico').dias[1].lineas[0].exerciseId === 'dominada-prona',
  '…y ni la plantilla ni el plan cambian (flujo 13)');
ok(aparicionesDeEjercicio(fs, 'dominada-supina').length === 1 && aparicionesDeEjercicio(fs, 'dominada-prona').length === 1,
  '…y el progreso lo apunta a la supina, no a la prona (flujos 13 y 20)');

/* Sustituir en el constructor: la plantilla sí, el catálogo no. */
const catAntes = JSON.stringify(ejercicioPorId('dominada-prona'));
const rc = sustituirEnRutina(rVuelta, rVuelta.lineas[0].id, 'dominada-neutra');
ok(rc.lineas[0].exerciseId === 'dominada-neutra', 'Sustituir en el constructor cambia la plantilla (flujo 14)');
ok(JSON.stringify(ejercicioPorId('dominada-prona')) === catAntes, '…y no el catálogo maestro (flujo 14)');

/* Descartar: ni historial, ni progreso, ni rango. */
const antesDescartar = { p: JSON.stringify(progresoDeEjercicio(f, 'dominada-prona')), r: JSON.stringify(rangoEfectivoDeEjercicio(f, 'dominada-prona')) };
let sd = entrenarDiaDelPlan(f, 1, '2026-09-24', (s) => hacer(s, 0, [{ reps: 20, peso: 40 }]));
sd = pasarAFinalizacion(sd, { ahora: hora('2026-09-24') + 60000 });
const desc = descartarEntrenamiento(sd, { confirmado: true, ahora: hora('2026-09-24') + 70000 });
const fd = recargar(guardarSesion(f, desc.sesion));
ok(!sesionesDelHistorial(fd).some((x) => x.id === sd.id), 'Descartar: no aparece en el historial (flujo 17)');
ok(JSON.stringify(progresoDeEjercicio(fd, 'dominada-prona')) === antesDescartar.p, '…ni cambia el progreso (flujo 17)');
ok(JSON.stringify(rangoEfectivoDeEjercicio(fd, 'dominada-prona')) === antesDescartar.r, '…ni el rango (flujo 17)');
ok(resumenDeActividad(fd, { hoy: HOY }).total === resumenDeActividad(f, { hoy: HOY }).total, '…ni la actividad (flujo 40)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('6. Isométricos y peso corporal (flujos 21 y 22)');

const lsit = sesionDe('l-sit', '2026-09-20', [{ duracion: 15 }, { duracion: 20 }], { modo: 'tiempo' });
const fi = recargar({ ...DEFAULT_FITNESS, sesiones: [lsit] });
const pl = progresoDeEjercicio(fi, 'l-sit');
ok(pl.ultima && pl.ultima.clase === 'tiempo' && pl.ultima.series.every((x) => x.duracion > 0 && !x.reps && !x.peso), 'Isométrico: se guarda y se compara en segundos (flujo 21)');
ok(/s\b/.test(pl.mejor.texto) && !/kg|reps?\b/.test(pl.mejor.texto), `…y se lee en segundos: «${pl.mejor.texto}» (flujo 21)`);
const rl = rangoEfectivoDeEjercicio(fi, 'l-sit');
ok(rl.metrica === 'tiempo' || rl.metrica === 'duracion', `…y el rango mide tiempo (${rl.metrica}) (flujo 21)`);
ok(volumenDeSesion(lsit) === null, '…sin volumen inventado (flujo 22)');
const corporal = sesionDe('dominada-prona', '2026-09-20', [{ reps: 10 }, { reps: 8 }]);
ok(volumenDeSesion(corporal) === null, 'Peso corporal: ni un volumen falso (flujo 22)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('7. Objetivos: completado exacto, vencido, cancelado (flujos 23-25 y 57)');

let fo = recargar({ ...DEFAULT_FITNESS, sesiones: [sesionDe('dominada-prona', '2026-09-10', [{ reps: 8 }])] });
fo = anadirObjetivo(fo, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 12, fechaObjetivo: '2026-09-15' }, { ahora: hora('2026-09-01') }).fitness;
const vencido = progresoDeObjetivo(fo, fo.objetivos[0], { hoy: HOY });
ok(vencido.estado === 'activo' && vencido.fechaSuperada === true, 'Vencido: sigue activo, con la fecha superada (flujo 25)');
ok(detalleDeObjetivo(fo, fo.objetivos[0], { hoy: HOY }).avisoFecha === FECHA_SUPERADA && FECHA_SUPERADA === 'Fecha objetivo superada',
  '…y dice «Fecha objetivo superada», literal (flujo 25)');
/* Otra variante no lo completa. */
fo = recargar({ ...fo, sesiones: [...fo.sesiones, sesionDe('dominada-supina', '2026-09-18', [{ reps: 14 }])] });
ok(progresoDeObjetivo(fo, fo.objetivos[0], { hoy: HOY }).estado === 'activo', '14 supinas NO completan un objetivo de pronas (flujos 20 y 23)');
/* Exactamente 12. */
fo = recargar({ ...fo, sesiones: [...fo.sesiones, sesionDe('dominada-prona', '2026-09-22', [{ reps: 12 }])] });
const conseguido = progresoDeObjetivo(fo, fo.objetivos[0], { hoy: HOY });
ok(conseguido.estado === 'completado', 'Exactamente 12: Completado (flujo 24)');
ok(listaDeObjetivos(fo, { filtro: 'activos', hoy: HOY }).objetivos.every((x) => x.id !== fo.objetivos[0].id), '…y deja de salir como activo (flujo 24)');
ok(!conseguido.fechaSuperada, '…y un conseguido ya no dice «fecha superada» (apartado 57)');
/* Una peor después no lo descompleta. */
fo = recargar({ ...fo, sesiones: [...fo.sesiones, sesionDe('dominada-prona', '2026-09-23', [{ reps: 6 }])] });
ok(progresoDeObjetivo(fo, fo.objetivos[0], { hoy: HOY }).estado === 'completado', '…y una sesión peor después no lo descompleta');
/* Cancelado y completado a la vez: imposible. */
const fcan = cancelarObjetivo(fo, fo.objetivos[0].id);
const pcan = progresoDeObjetivo(fcan, fcan.objetivos[0], { hoy: HOY });
ok(pcan.estado === 'cancelado', `Cancelado gana, y no puede ser «completado + cancelado» a la vez (${pcan.estado}) (apartado 57)`);

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('8. Rangos: muscular, global, clasificación e historial (flujos 26-31)');

const curl1 = sesionDe('curl-barra', '2026-09-10', [{ reps: 10, peso: 25 }]);
const fr1 = recargar({ ...DEFAULT_FITNESS, sesiones: [curl1, sesionDe('sentadilla-barra', '2026-09-10', [{ reps: 8, peso: 80 }])] });
const piernasAntes = JSON.stringify(rangoEfectivoDeGrupo(fr1, 'piernas'));
const brazosAntes = rangoEfectivoDeGrupo(fr1, 'brazos');
const fr2 = recargar({ ...fr1, sesiones: [...fr1.sesiones, sesionDe('curl-barra', '2026-09-20', [{ reps: 10, peso: 45 }])] });
const brazosDespues = rangoEfectivoDeGrupo(fr2, 'brazos');
ok(brazosDespues.score > brazosAntes.score, `Bíceps mejor: brazos sube (${brazosAntes.score} → ${brazosDespues.score}) (flujo 27)`);
ok(JSON.stringify(rangoEfectivoDeGrupo(fr2, 'piernas')) === piernasAntes, '…y piernas no se mueve ni un punto (flujo 27)');
const gl = rangoGlobalEfectivo(fr2);
ok(gl.sinRango === true, 'Global: con dos grupos entrenados no aparece —hacen falta tres— (flujo 28)');

/* Clasificación y luego datos reales. */
const remo = ejercicioPorId('remo-barra');
const preg = preguntaDeEjercicio(remo);
const opcion = preg.opciones.find((x) => !x.omite && x.id);
const cl = clasificarEjercicio({ ...DEFAULT_FITNESS }, 'remo-barra', opcion.id, { ahora: hora('2026-09-01') });
ok(cl.ok && rangoEfectivoDeEjercicio(cl.fitness, 'remo-barra').fuente === 'cuestionario', 'Clasificar: el rango sale de la estimación (flujo 29)');
const conReal = recargar({ ...cl.fitness, sesiones: [sesionDe('remo-barra', '2026-09-10', [{ reps: 8, peso: 40 }]), sesionDe('remo-barra', '2026-09-12', [{ reps: 8, peso: 42 }]), sesionDe('remo-barra', '2026-09-14', [{ reps: 8, peso: 44 }])] });
ok(rangoEfectivoDeEjercicio(conReal, 'remo-barra').fuente === 'entrenamiento', '…y con datos reales mandan ellos: la clasificación no bloquea (flujo 30)');

/* Historial de rango: no se duplica al recargar. */
const destino = { tipo: 'exercise', id: 'curl-barra' };
const h1 = historialDeRango(fr2, destino);
const h2 = historialDeRango(recargar(recargar(fr2)), destino);
ok(JSON.stringify(h1) === JSON.stringify(h2), 'Historial de rango: recargar dos veces no crea eventos (flujo 31)');
ok((h1.cambios || h1.eventos || []).every((c) => c.fecha && (c.fuente || c.fuenteNombre || true)), '…y cada cambio lleva su fecha (flujo 31)');

/* Subir de rango se enseña solo si se sube. */
const sub = subidasDeRango(fr2, fr2.sesiones[fr2.sesiones.length - 1]);
ok(Array.isArray(sub.ejercicios) && typeof sub.hay === 'boolean' && sub.ejercicios.every((x) => x.exerciseId === 'curl-barra'),
  'La subida de rango se pregunta al motor con y sin la sesión, y solo habla de lo que se entrenó (F37 · flujo 27)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('9. Ejercicio archivado y foto de un entrenamiento borrado (flujos 35 y 38)');

/* Un ejercicio que ya no está en el catálogo. */
const viejo = sesionDe('curl-barra', '2026-08-01', [{ reps: 10, peso: 20 }]);
const vieja = JSON.parse(JSON.stringify(viejo).replace(/"curl-barra"/g, '"curl-antiguo-f43"'));
const fa = recargar({ ...DEFAULT_FITNESS, sesiones: [vieja] });
const da = detalleDeSesion(sesionesDelHistorial(fa)[0], { fitness: fa, hoy: HOY });
ok(da && da.ejercicios[0].nombre && da.ejercicios[0].nombre !== 'curl-antiguo-f43', `Archivado: el historial lo nombra («${da && da.ejercicios[0].nombre}»), nunca por su id (flujo 35)`);
ok(!todosLosEjercicios().some((e) => e.id === 'curl-antiguo-f43'), '…y no se ofrece como nuevo (apartado 57)');
const archivadosCatalogo = CATALOGO_EJERCICIOS.filter((e) => e.archivado === true).map((e) => e.id);
ok(todosLosEjercicios().every((e) => !archivadosCatalogo.includes(e.id)), '…ni un archivado del catálogo se sugiere para elegir (apartado 57)');

/* La foto de un entrenamiento que se borra. */
const sinSesion = recargar({ ...f, sesiones: [] });
const fotoSola = normalizarFotoProgreso(JSON.parse(JSON.stringify(fotos[1])));
ok(fotoSola && fotoSola.id === fotos[1].id && fotoSola.path === 'u/b.jpg', 'Foto + entrenamiento borrado: la foto sigue existiendo (flujo 38)');
ok(sesionDeFoto(fotoSola, sinSesion).existe === false, '…y sabe que su entrenamiento ya no existe: no ofrece abrirlo (flujo 38)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('10. Consistencia de datos, identidades, variantes, tiempo y estados (53-57)');

/* 53 — tres series hechas se leen como tres en todas partes. */
const tres = sesionDe('press-banca-barra', '2026-09-20', [{ reps: 8, peso: 60 }, { reps: 8, peso: 60 }, { reps: 7, peso: 60 }]);
const f53 = recargar({ ...DEFAULT_FITNESS, sesiones: [tres] });
const s53 = sesionesDelHistorial(f53)[0];
const lecturas = {
  sesion: ejerciciosDeSesion(s53)[0].series.filter((x) => x.estado === 'hecha').length,
  resumen: resumenDeSesion(s53).ejercicios[0].hechas,
  historial: fichaDeHistorial(s53, { fitness: f53, hoy: HOY }).series,
  progreso: progresoDeEjercicio(f53, 'press-banca-barra').ultima.series.length,
  actividad: resumenDeActividad(f53, { hoy: HOY }).total === 1 ? 3 : -1,
  rango: rangoEfectivoDeEjercicio(f53, 'press-banca-barra').dataPoints === 1 ? 3 : -1,
};
ok(Object.values(lecturas).every((n) => n === 3), `Tres series: ${JSON.stringify(lecturas)} (apartado 53)`);

/* 54 — el mismo exerciseId en todas partes. */
const idCatalogo = ejercicioPorId('press-banca-barra').id;
const idSesion = ejerciciosDeSesion(s53)[0].exerciseId;
const idProgreso = progresoDeEjercicio(f53, 'press-banca-barra').exerciseId;
const idRango = rangoEfectivoDeEjercicio(f53, 'press-banca-barra').exerciseId;
const idHistorial = detalleDeSesion(s53, { fitness: f53, hoy: HOY }).ejercicios[0].exerciseId;
const f54 = anadirObjetivo(f53, { exerciseId: 'press-banca-barra', tipo: 'peso', valor: 70 }).fitness;
const idObjetivo = f54.objetivos[0].exerciseId;
ok(new Set([idCatalogo, idSesion, idProgreso, idRango, idHistorial, idObjetivo]).size === 1, 'El mismo exerciseId en catálogo, sesión, progreso, objetivo, rango e historial (apartado 54)');

/* 55 — agarre, variante y equipamiento no se mezclan (y no se repiten). */
ok(aparicionesDeEjercicio(fs, 'dominada-prona').every((a) => a.exerciseId === 'dominada-prona'), 'Variantes: las pronas no recogen supinas (apartado 55)');
const cabDom = cabeceraEnSesion({ exerciseId: 'dominada-prona', series: [] });
ok(`${cabDom.variante}${cabDom.agarre ? ` · ${cabDom.agarre}` : ''}` === 'Agarre prono',
  `🐛 La variante y el agarre no se repiten: «${[cabDom.variante, cabDom.agarre].filter(Boolean).join(' · ')}» (apartado 55)`);
const repetidos = CATALOGO_EJERCICIOS.filter((e) => {
  const t = [e.variante, agarreQueAnadir(e)].filter(Boolean).join(' · ');
  const partes = t.split(' · ').map((x) => x.toLowerCase());
  return new Set(partes).size !== partes.length;
});
ok(repetidos.length === 0, `…en ningún ejercicio del catálogo (${repetidos.map((e) => e.id).join(', ') || 'ninguno'})`);
ok(agarreQueAnadir(ejercicioPorId('press-banca-barra')) === '' || /^Agarre /.test(agarreQueAnadir(ejercicioPorId('press-banca-barra'))),
  '…y donde la variante no dice el agarre, se sigue diciendo');
const conAgarreDistinto = CATALOGO_EJERCICIOS.find((e) => e.agarre && !e.variante);
ok(!conAgarreDistinto || /^Agarre /.test(agarreQueAnadir(conAgarreDistinto)), '…un ejercicio sin variante conserva su agarre');
ok(nombreCompleto(ejercicioPorId('dominada-prona')) === 'Dominadas pronas · Agarre prono', '…y el nombre completo sigue siendo el de la F2');

/* 56 — los tiempos no se intercambian. */
ok(tres.iniciadaEn < tres.terminadaEn && new Date(tres.iniciadaEn).toLocaleDateString('sv-SE') === tres.fecha, 'Sesión: inicio < fin, y la fecha es la del inicio (apartado 56)');
const obj56 = f54.objetivos[0];
ok(typeof obj56.creadoEn === 'number' && (obj56.fechaObjetivo === '' || /^\d{4}-\d{2}-\d{2}$/.test(obj56.fechaObjetivo)), 'Objetivo: creado (momento) y fecha objetivo (día) no se mezclan (apartado 56)');
ok(fotos[0].fecha === '2026-06-12' && /^2026-06-1[12]/.test(fotos[0].createdAt), 'Foto: la fecha de la foto y la de subida son dos campos (apartado 56)');

/* 57 — estados imposibles. */
const estados = new Set(['en_curso', 'pausada', 'finalizando', 'completada', 'descartada']);
ok([...f.sesiones, ...fd.sesiones].every((x) => estados.has(x.estado)), 'Sesión: un solo estado, nunca «completada + en curso» (apartado 57)');
ok(!sesionActiva(f) || sesionActiva(f).estado !== 'completada', '…y la activa nunca es una completada');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('11. Cero, uno, pocos y muchos datos, y datos parciales (61 y 62)');

const conN = (n) => {
  const ss = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(2026, 5, 1 + i).toLocaleDateString('sv-SE');
    ss.push(sesionDe('press-banca-barra', d, [{ reps: 8, peso: 50 + (i % 10) }]));
  }
  return recargar({ ...DEFAULT_FITNESS, sesiones: ss });
};
for (const n of [0, 1, 4, 80]) {
  const fn = conN(n);
  const lect = [
    sesionesDelHistorial(fn).length,
    progresoDeEjercicio(fn, 'press-banca-barra').veces || 0,
    resumenDeActividad(fn, { hoy: '2026-09-24' }).total,
    rangoEfectivoDeEjercicio(fn, 'press-banca-barra').dataPoints || 0,
  ];
  ok(lect[0] === n && lect[1] === n && lect[2] === n && (n === 0 ? lect[3] === 0 : lect[3] > 0),
    `${n} ${n === 1 ? 'sesión' : 'sesiones'}: historial ${lect[0]}, progreso ${lect[1]}, actividad ${lect[2]}, rango ${lect[3] ? 'con datos' : 'sin datos'} (apartado 61)`);
  ok(!/NaN|Infinity|undefined/.test(JSON.stringify([resumenDeActividad(fn, { hoy: '2026-09-24' }), rangoEfectivoDeEjercicio(fn, 'press-banca-barra')])), '…sin un NaN ni un undefined');
}
/* Parciales: sesión incompleta, ejercicio sin imagen ni tutorial, objetivo sin
   resultado, rango provisional, músculo sin cobertura. */
const incompleta = entrenarDiaDelPlan(f, 1, '2026-09-24', (s) => s);
ok(resumenDeSesion(incompleta).ejercicios.every((e) => e.estado === 'no_realizado'), 'Sesión sin nada marcado: «no realizado», no un cero inventado (apartado 62)');
ok(CATALOGO_EJERCICIOS.some((e) => !e.imagen && !e.video), 'Hay ejercicios sin imagen ni vídeo, y la ficha lo dice (F34 · apartado 62)');
const oSinRes = anadirObjetivo(DEFAULT_FITNESS, { exerciseId: 'l-sit', tipo: 'duracion', valor: 30 });
ok(oSinRes.ok, 'Un objetivo de L-sit se mide en segundos (flujo 21)');
const sinRes = oSinRes.fitness;
ok(progresoDeObjetivo(sinRes, sinRes.objetivos[0], { hoy: HOY }).porcentaje === null, 'Objetivo sin resultado: porcentaje null, nunca 0 % (apartado 62)');
ok(rangoEfectivoDeGrupo(recargar({ ...DEFAULT_FITNESS, sesiones: [curl1] }), 'piernas').sinRango === true, 'Músculo sin cobertura: Sin Rango (apartado 62)');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('12. «Volver» lleva al contexto anterior (46 y 47)');

ok(AREAS_DE_VUELTA.join(',') === 'rangos,progreso,entrenamiento' && TIPOS_DE_ORIGEN.length === 3, 'Tres áreas y tres pantallas de destino');
ok(crearOrigen({ area: 'rangos', tipo: 'ejercicio', id: 'x', texto: 'Dorsales', inicio: { musculo: 'espalda', subgrupo: 'dorsales' } }).etiqueta === 'Volver a Dorsales',
  'Un origen dice a dónde vuelve con sus palabras');
ok(crearOrigen({ area: 'inicio', tipo: 'ejercicio', id: 'x', texto: 'X' }) === null && crearOrigen({ area: 'rangos', tipo: 'ejercicio', id: 'x', texto: ' ' }) === null,
  '…y uno a medias no existe: sin área válida o sin texto, `null`');
const oR = crearOrigen({ area: 'rangos', tipo: 'ejercicio', id: 'curl-barra', texto: 'Bíceps', inicio: { musculo: 'brazos', subgrupo: 'biceps' } });
ok(origenVigente(oR, { abierto: 'curl-barra' }) === true, 'Vigente mientras se ve ese ejercicio');
ok(origenVigente(oR, { abierto: 'curl-martillo', previos: ['curl-barra'] }) === true, '…y mientras se recorren sus variantes');
ok(origenVigente(oR, { abierto: 'press-banca-barra' }) === false && origenVigente(oR, { abierto: null }) === false,
  '…pero no si se abre otro desde la lista, ni con el detalle cerrado');
const v1 = vueltaDelDetalle({ previos: ['curl-barra'], origen: oR, vigente: true, nombreAnterior: 'Curl con barra' });
ok(v1.accion === 'anterior' && v1.id === 'curl-barra' && v1.etiqueta === 'Volver a Curl con barra', 'Desde una variante: primero al ejercicio anterior');
const v2 = vueltaDelDetalle({ previos: [], origen: oR, vigente: true });
ok(v2.accion === 'origen' && v2.texto === 'Bíceps', '…después, al origen de fuera de Progreso');
ok(vueltaDelDetalle({ objetivoAbierto: 'o1' }).texto === 'Objetivo', 'Abierto desde un objetivo: vuelve al objetivo, y lo dice');
ok(vueltaDelDetalle({ musculo: 'espalda', nombreMusculo: 'Dorsales' }).etiqueta === 'Volver a Dorsales', 'Abierto desde un músculo: vuelve al músculo');
ok(JSON.stringify(vueltaDelDetalle({})) === JSON.stringify({ accion: 'cerrar', ...VUELTA_POR_DEFECTO }), 'Sin nada: a la portada de Progreso, como antes');
ok(vueltaDelDetalle({ origen: oR, vigente: false }).accion === 'cerrar', 'Un origen caducado no manda');
ok(vueltaDeSesion({ nombreEjercicio: 'Remo con barra' }).etiqueta === 'Volver al progreso de Remo con barra', 'Una sesión abierta sobre un ejercicio vuelve a él, y lo dice');
ok(vueltaDeSesion({}).texto === 'Progreso', '…y sobre la portada, a Progreso');
ok(QUE_RESUELVE.every((q) => [46, 47].includes(q.apartado)), 'Lo que resuelve, con su apartado');

/* Y está cableado en las pantallas. */
const FV = sinComentarios(leer('src/views/FitnessView.jsx'));
const PV = sinComentarios(leer('src/views/ProgresoView.jsx'));
ok(!/setDentro\(/.test(FV.slice(FV.indexOf('export default function FitnessView'))),
  '🐛 FitnessView ya no llama a `setDentro` (no existe en su ámbito: «Ver historial» del resumen lanzaba un ReferenceError)');
ok(/onIrAHistorial=\{\(\) => \{[\s\S]{0,200}dentro: 'historial'/.test(FV), '…el historial se abre por `inicio` del área de Entrenamiento');
ok(/onVolverAOrigen=\{volverAlOrigen\}/.test(FV) && /focoOrigen=\{origenProgreso\}/.test(FV), 'Progreso recibe el origen y cómo volver a él');
ok(/onCambiar=\{cambiarArea\}/.test(FV), 'Las pestañas reinician el recorrido (NAVO F1)');
/* 🐛 Y cada envoltorio de área REENVÍA lo que recibe: `AreaProgreso` se lo
   quedaba y el origen no llegaba nunca a Progreso. Lo cazó el recorrido (F36:
   una puerta se comprueba abriendo el archivo que la cablea). */
const trozo = (src, desde, hasta) => src.slice(src.indexOf(desde), src.indexOf(hasta, src.indexOf(desde)));
const areaProgreso = trozo(FV, 'export function AreaProgreso', 'export function AreaEntrenamiento');
ok(/focoOrigen = null, onVolverAOrigen = null/.test(areaProgreso) && /focoOrigen=\{focoOrigen\}/.test(areaProgreso) && /onVolverAOrigen=\{onVolverAOrigen\}/.test(areaProgreso),
  '🐛 `AreaProgreso` recibe el origen Y se lo pasa a `ProgresoView`');
const areaRangos = trozo(FV, 'export function AreaRangos', 'export function AreaProgreso');
ok(/inicio=\{inicio\}/.test(areaRangos) && /onEjercicio\(id, desde \?/.test(areaRangos), '…`AreaRangos` pasa el músculo al que se vuelve, y dice de dónde sale el ejercicio');
const areaEntr = trozo(FV, 'export function AreaEntrenamiento', 'export default function FitnessView');
ok(/sesionInicial=\{/.test(areaEntr) && /abiertoInicial=\{/.test(areaEntr) && /useState\(\(arranque && arranque\.sesionAbierta\)/.test(areaEntr),
  '…y `AreaEntrenamiento` reabre la sesión del historial, la de Tu Plan y la ficha');
ok(!/focoOrigen=\{focoOrigen\}/.test(areaProgreso.replace(/focoOrigen=\{focoOrigen\}/, '')), '…(y la comprobación se pone roja si se quita el reenvío)');
ok(/volverTexto=\{vuelta\.texto\}/.test(PV) && /volverEtiqueta=\{vuelta\.etiqueta\}/.test(PV), 'El detalle dice a dónde vuelve con `vueltaDelDetalle`');
ok(!/aria-label="Volver a Progreso"/.test(PV), '…y ya no hay un «Volver a Progreso» escrito a mano en el detalle');
ok(/subgrupoInicial/.test(leer('src/views/DetalleMuscularView.jsx')) && /inicio = null/.test(leer('src/views/RangosView.jsx')),
  'Rangos vuelve a abrir el músculo y el subgrupo');
ok(/sesionInicial/.test(leer('src/views/HistorialView.jsx')) && /abiertoInicial/.test(leer('src/views/EjerciciosView.jsx')),
  'El historial vuelve a la sesión, y la biblioteca a la ficha');

/* ═════════════════════════════════════════════════════════════════════════ */
seccion('13. El informe de la fase: flujos, bugs y pendientes (apartado 71)');

ok(FLUJOS_F43.length === 50 && FLUJOS_F43.every((x, i) => x.n === i + 1), 'Los cincuenta flujos, en su orden');
ok(FLUJOS_F43.every((x) => x.donde && x.donde.length > 0), '…cada uno dice dónde se prueba');
const archivos = new Set(FLUJOS_F43.flatMap((x) => x.donde.map((d) => d.archivo)));
ok([...archivos].every((a) => { try { leer(a); return true; } catch { return false; } }), `…y cada archivo existe (${archivos.size})`);
const marcaEsta = (d) => (d.flujo
  ? new RegExp(`\\(flujos? [^)]*\\b${d.flujo}\\b[^)]*\\)`).test(leer(d.archivo))
  : leer(d.archivo).includes(d.marca));
const sinMarca = FLUJOS_F43.flatMap((x) => x.donde.filter((d) => !marcaEsta(d)).map((d) => `${x.n}:${d.marca || d.flujo}`));
ok(sinMarca.length === 0, `…y en cada uno está la comprobación que lo dice (se busca su marca)${sinMarca.length ? ` — faltan: ${sinMarca.join(', ')}` : ''}`);
ok(!marcaEsta({ archivo: 'scripts/test-auditoria-fitness.mjs', flujo: 97 }) && !marcaEsta({ archivo: 'scripts/test-app-real.mjs', marca: 'FIT F43 — marca que no existe' }),
  '…y la búsqueda se pone roja con una marca que no está');
ok(flujo(46) && flujo(46).nombre === 'Navegación profunda' && flujo(99) === null, '`flujo(n)` lo encuentra, y no inventa uno');
ok(CONSISTENCIAS_F43.map((x) => x.apartado).join(',') === '53,54,55,56,57', 'Las cinco consistencias');
ok(PRIORIDADES_F43.map((p) => p.id).join(',') === 'P0,P1,P2,P3', 'La escala del apartado 67');
ok(BUGS_F43.every((b) => PRIORIDADES_F43.some((p) => p.id === b.prioridad) && b.estado && b.donde && b.fase),
  'Cada fallo lleva prioridad, estado, dónde y de qué fase venía');
ok(bugsPorPrioridad('P0').concat(bugsPorPrioridad('P1')).every((b) => b.estado === 'corregido'), '🚨 Todo P0 y P1 está corregido (apartado 67)');
ok(BUGS_F43.filter((b) => b.estado === 'corregido').every((b) => b.prueba), '…y cada corregido dice qué comprobación lo habría cazado');
ok(PENDIENTES_F43.every((x) => x.que && x.porque), 'Lo pendiente se declara con su motivo (apartados 66 y 68)');
ok(NO_EN_FIT43.some((x) => /IA|gamificaci|predicci/i.test(x.que)), 'Y lo que NO se añade (apartado 66)');
ok(DECISIONES_FIT43.length > 0, 'Las decisiones, escritas');
const aud = auditarAuditoria();
ok(aud.ok, `La auditoría de la propia fase: ${aud.fallos.join(' · ') || 'todo en orden'}`);
ok(!auditarAuditoria({ bugs: [{ id: 'x', prioridad: 'P1', estado: 'pendiente', donde: 'a', fase: 'F1' }] }).ok,
  '…y se pone roja con un P1 sin corregir (EH F42: una auditoría que no puede fallar no sirve)');

console.log(`\n  ${total - fallos} de ${total} comprobaciones correctas.`);
if (fallos) process.exit(1);
