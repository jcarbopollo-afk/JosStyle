/* «Completar entrenamiento» (2026-10-26)
   ═══════════════════════════════════════════════════════════════════════════
   Apuntar un entrenamiento hecho fuera de la aplicación: hoy o un día pasado, nunca uno futuro; sin
   series, pesos ni tiempos inventados; contado en su fecha real por el historial, la actividad de
   Progreso, la semana de Tu Plan y los días con entrenamiento; sin tocar las rachas; sin duplicados al
   repetir el toque, y dos entrenamientos distintos el mismo día sí. Y «Empezar entrenamiento» sigue
   igual. Se prueba con las mismas funciones que llaman las pantallas.

   Uso: node --import ./scripts/resolver-vite.mjs scripts/test-completar-entrenamiento.mjs */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEFAULT_FITNESS, crearWorkoutSession, rachaDeFitness } from '../src/lib/fitness.js';
import { usarPlan, CATALOGO_PLANES } from '../src/lib/planes.js';
import { tuPlan } from '../src/lib/tuPlan.js';
import { crearRutina, anadirEjercicio, rutinaAPlan } from '../src/lib/constructor.js';
import {
  TEXTOS_COMPLETAR, opcionesParaCompletar, opcionPreseleccionada, comprobarCompletar,
  registrarEntrenamientoHecho, etiquetaDelDia, claveDeSesion,
} from '../src/lib/completarEntrenamiento.js';
import {
  fichaDeHistorial, detalleDeSesion, historialPorReciente, consultarHistorial, COMPLETADO_A_MANO,
} from '../src/lib/historial.js';
import { mesDeActividad, entrenamientosEnPeriodo } from '../src/lib/actividadEntrenamiento.js';
import { sesionesDelHistorial, fechasConEntrenamiento } from '../src/lib/sesionesCompletadas.js';
import { fechasDeEntreno } from '../src/lib/fechasDeEntreno.js';
import { progresoDeEjercicio, primerRecordPersonal } from '../src/lib/progresion.js';
import { normalizarFitnessConSesiones, empezarSesion, sesionEnCursoDelMismoOrigen, marcarSerie } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { textoRoto } from '../src/lib/robustezFitness.js';
import { terminosQueChocan } from '../src/lib/acabadoFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
let correctas = 0;
let fallos = 0;
const ok = (c, m) => { if (c) { correctas++; console.log(`  ✓ ${m}`); } else { fallos++; console.log(`  ✗ ${m}`); } };

/* Un lunes fijo: el plan es la semana (F6) y su día 1 es el lunes. Nada depende del día real. */
const LUNES = '2026-10-19';
const HOY = '2026-10-21'; // miércoles: Legs en el PPL
const AYER = '2026-10-20'; // martes: Pull
const MANANA = '2026-10-22';
const PLAN = CATALOGO_PLANES[0];

const conPlan = () => {
  const r = usarPlan({ ...DEFAULT_FITNESS }, PLAN.id, { hoy: LUNES });
  if (!r.ok) throw new Error(`No se pudo activar el plan de prueba: ${r.motivo}`);
  return r.fitness;
};
const plantillaMia = (nombre = 'Mi tirón') => {
  const rutina = anadirEjercicio(crearRutina({ nombre }), 'dominada-prona');
  if (!rutina.lineas.length) throw new Error('La plantilla de prueba no tiene ejercicios: revisa el id');
  return rutinaAPlan(rutina);
};
const opcion = (f, i) => opcionPreseleccionada(opcionesParaCompletar(f), { indiceDelPlan: i });

console.log('\n── 1 · Qué se puede completar ──');
{
  ok(opcionesParaCompletar({ ...DEFAULT_FITNESS }).length === 0, 'Sin plan ni plantillas no hay nada que elegir (la hoja enseña su estado vacío)');
  const f = conPlan();
  const ops = opcionesParaCompletar(f);
  const conEntreno = PLAN.dias.filter((d) => d && !d.descanso && (d.lineas || []).length).length;
  ok(ops.length === conEntreno && ops.length > 0, `Los días con entrenamiento del plan activo, y ninguno de descanso (${ops.length})`);
  ok(ops.every((o) => o.planId === PLAN.id && o.origenId && o.clave === `${PLAN.id}|${o.origenId}`), '…con el mismo plan y el mismo id de día con que se EMPIEZAN');
  ok(new Set(ops.map((o) => o.clave)).size === ops.length, '…cada uno una vez');
  const pl = plantillaMia();
  const f2 = { ...f, plantillas: [pl] };
  const ops2 = opcionesParaCompletar(f2);
  ok(ops2.some((o) => o.origenTipo === 'plantilla' && o.origenId === pl.id && o.detalle === 'Tu plantilla'), 'Y las plantillas con ejercicios');
  ok(opcionesParaCompletar({ ...DEFAULT_FITNESS, plantillas: [rutinaAPlan(crearRutina({ nombre: 'Vacía' }))] }).length === 0,
    '…pero no una plantilla sin ejercicios: no hay qué completar');
  ok(opcionPreseleccionada(ops2, { plantillaId: pl.id })?.origenId === pl.id, 'Abierta desde una plantilla, viene elegida');
  ok(opcionPreseleccionada(ops, { indiceDelPlan: 1 })?.indiceDelPlan === 1, 'Abierta desde un día del plan, viene elegido ese día');
}

console.log('\n── 2 · Hoy, un día pasado, uno futuro ──');
{
  const f = conPlan();
  const legs = opcion(f, 2);
  const r = registrarEntrenamientoHecho(f, { opcion: legs, fecha: HOY, hoy: HOY, ahora: 1 });
  ok(r.ok && r.sesion.fecha === HOY && r.sesion.estado === 'completada', 'Hoy: se guarda completado en la fecha de hoy');
  ok(r.fitness.sesiones.length === 1 && f.sesiones.length === 0, '…sin tocar lo que había (devuelve un fitness nuevo)');
  const p = registrarEntrenamientoHecho(f, { opcion: opcion(f, 1), fecha: AYER, hoy: HOY });
  ok(p.ok && p.sesion.fecha === AYER, 'Un día pasado: se guarda en ESE día, no en hoy');
  const lejos = registrarEntrenamientoHecho(f, { opcion: legs, fecha: '2025-03-04', hoy: HOY });
  ok(lejos.ok && lejos.sesion.fecha === '2025-03-04', '…también uno de hace meses');
  const fut = registrarEntrenamientoHecho(f, { opcion: legs, fecha: MANANA, hoy: HOY });
  ok(!fut.ok && fut.motivo === 'fecha_futura' && fut.fitness === f && !fut.sesion, 'Un día futuro se rechaza y no cambia nada');
  ok(/todavía no ha llegado/.test(fut.mensaje), '…y lo dice con palabras');
  ok(!registrarEntrenamientoHecho(f, { opcion: legs, fecha: '2026-02-30', hoy: HOY }).ok, 'Una fecha que no existe, tampoco');
  ok(!registrarEntrenamientoHecho(f, { opcion: null, fecha: HOY, hoy: HOY }).ok, 'Sin entrenamiento elegido, tampoco');
  ok(comprobarCompletar(f, { opcion: legs, fecha: HOY, hoy: HOY }).ok, 'Comprobar no escribe: solo dice si se puede');
  ok(etiquetaDelDia(HOY, HOY) === 'hoy' && etiquetaDelDia(AYER, HOY) === 'ayer' && etiquetaDelDia('2026-10-05', HOY) === 'el 5 de octubre',
    'La confirmación dice «hoy», «ayer» o el día');
}

console.log('\n── 3 · Ni un dato de rendimiento inventado ──');
{
  const f = conPlan();
  const r = registrarEntrenamientoHecho(f, { opcion: opcion(f, 2), fecha: HOY, hoy: HOY });
  const s = r.sesion;
  ok(s.registradaAMano === true, 'La sesión lleva `registradaAMano`: es lo que la distingue');
  ok(Array.isArray(s.origen.ejercicios) && s.origen.ejercicios.length === 0 && s.ejercicios.length === 0, 'Sin ejercicios ni series copiados del plan');
  ok(s.iniciadaEn === null && s.terminadaEn === null && s.inicio === null && s.fin === null, 'Sin hora de inicio ni de fin: no se sabe cuánto duró');
  ok(s.pesoCorporal === null && s.notas === '', 'Ni peso corporal ni notas puestas por la aplicación');
  const json = JSON.stringify(s);
  ok(!/"reps"|"peso":\s*\d|"duracion":\s*\d|"hecha"/.test(json), 'Ni una repetición, un peso, un tiempo ni una serie marcada en lo guardado');
  const ficha = fichaDeHistorial(s, { fitness: r.fitness, hoy: HOY });
  ok(ficha.aMano && ficha.seriesTexto === COMPLETADO_A_MANO && ficha.duracion === '' && ficha.series === 0, 'El historial dice «Completado sin series registradas», sin duración ni series');
  const det = detalleDeSesion(s, { fitness: r.fitness, hoy: HOY });
  ok(det.aMano && det.volumen === null && det.ejercicios.length === 0 && /no cuenta para tu progreso/.test(det.notaAMano), 'El detalle explica que no tiene datos y que no cuenta para el progreso');
  const visible = [ficha.nombre, ficha.etiquetaFecha, ficha.ejerciciosTexto, ficha.seriesTexto, ficha.duracion, det.fechaTexto, det.ejerciciosTexto, det.seriesTexto, det.notaAMano].join(' · ');
  ok(textoRoto(`<p>${visible}</p>`).length === 0, 'Nada roto a la vista en lo que se pinta (ni NaN, ni undefined, ni null)');
  const enVivo = crearWorkoutSession({ estado: 'completada', fecha: HOY });
  ok(enVivo.registradaAMano === false, 'Una sesión normal sigue sin la marca: se distinguen');
  const progreso = progresoDeEjercicio(r.fitness, 'sentadilla-barra');
  ok(!progreso || !(progreso.apariciones || []).length, 'El progreso de un ejercicio no ve nada de ella');
  ok(primerRecordPersonal(r.fitness) === null, 'Ni crea una marca personal');
}

console.log('\n── 4 · Cuenta donde cuentan los entrenamientos completados, en su fecha ──');
{
  let f = conPlan();
  f = registrarEntrenamientoHecho(f, { opcion: opcion(f, 1), fecha: AYER, hoy: HOY }).fitness;
  ok(sesionesDelHistorial(f).length === 1, 'Entra en el historial (las completadas)');
  const ficha = historialPorReciente(f)[0];
  ok(ficha && ficha.fecha === AYER, '…con su fecha real');
  ok(consultarHistorial(historialPorReciente(f).map((x) => fichaDeHistorial(x, { fitness: f, hoy: HOY })), {}, { hoy: HOY }).lista?.length !== 0, '…y la consulta del Historial la enseña');
  const celda = mesDeActividad(f, { hoy: HOY }).celdas.find((c) => c && c.fecha === AYER);
  ok(celda && celda.estado === 'entrenado', 'El calendario de actividad de Progreso marca ese día como entrenado');
  const semana = tuPlan(f, { hoy: HOY }).semana || [];
  ok(semana.find((d) => d.fecha === AYER)?.estado === 'completado', 'La semana de Tu Plan marca el martes (Pull) como completado');
  ok(semana.find((d) => d.fecha === HOY)?.estado !== 'completado', '…y no el día de hoy, que no se ha hecho');
  ok(fechasConEntrenamiento(f).has(AYER), 'Cuenta en los días con entrenamiento (fuera de Fitness)');
  ok(fechasDeEntreno({ fitness: f }).todas.has(AYER), '…también en `fechasDeEntreno` (Predicciones, Estadísticas)');
  const p = entrenamientosEnPeriodo(f, { hoy: HOY });
  ok(p && JSON.stringify(p).includes('1'), 'La actividad del periodo lo cuenta');
  const recargado = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f)));
  ok(recargado.sesiones[0].registradaAMano === true && recargado.sesiones[0].fecha === AYER, 'Sobrevive a recargar: la puerta de carga conserva la marca y la fecha (regla 5)');
  ok(recargado.sesiones[0].diaDePlan?.diaId === opcion(f, 1).origenId, '…y su enlace con el día del plan');
}

console.log('\n── 5 · Rachas: la regla de siempre ──');
{
  const rachas = { lista: [], historial: {} };
  const copia = JSON.stringify(rachas);
  const antes = rachaDeFitness(rachas, HOY);
  const f = conPlan();
  registrarEntrenamientoHecho(f, { opcion: opcion(f, 2), fecha: HOY, hoy: HOY });
  ok(JSON.stringify(rachas) === copia && JSON.stringify(rachaDeFitness(rachas, HOY)) === JSON.stringify(antes),
    'Registrar no toca las rachas: la de entrenamiento se marca en Rachas o Hoy, y Fitness solo la lee');
  ok(!/rachas|rachasServicio/.test(leer('src/lib/completarEntrenamiento.js').replace(/\/\*[\s\S]*?\*\//g, '')),
    '…y la librería ni siquiera las conoce');
}

console.log('\n── 6 · Duplicados ──');
{
  let f = conPlan();
  const pull = opcion(f, 1);
  f = registrarEntrenamientoHecho(f, { opcion: pull, fecha: AYER, hoy: HOY }).fitness;
  const otra = registrarEntrenamientoHecho(f, { opcion: pull, fecha: AYER, hoy: HOY });
  ok(!otra.ok && otra.motivo === 'duplicado' && otra.fitness === f, 'El mismo entrenamiento el mismo día se bloquea, sin cambiar nada');
  ok(/ya está completado ayer/.test(otra.mensaje), '…y se dice');
  const otroDia = registrarEntrenamientoHecho(f, { opcion: pull, fecha: '2026-10-13', hoy: HOY });
  ok(otroDia.ok, 'El mismo entrenamiento otro día, sí');
  const distinto = registrarEntrenamientoHecho(f, { opcion: opcion(f, 0), fecha: AYER, hoy: HOY });
  ok(distinto.ok && distinto.fitness.sesiones.filter((s) => s.fecha === AYER).length === 2, 'Dos entrenamientos DISTINTOS el mismo día, sí');
  const pl = plantillaMia();
  const conPl = { ...distinto.fitness, plantillas: [pl] };
  const opPl = opcionPreseleccionada(opcionesParaCompletar(conPl), { plantillaId: pl.id });
  const tercera = registrarEntrenamientoHecho(conPl, { opcion: opPl, fecha: AYER, hoy: HOY });
  ok(tercera.ok && claveDeSesion(tercera.sesion) === `${pl.id}|${pl.id}`, '…y una plantilla además, también');
  ok(!registrarEntrenamientoHecho(tercera.fitness, { opcion: opPl, fecha: AYER, hoy: HOY }).ok, '…pero esa plantilla otra vez ese día, no');

  // Uno hecho en vivo cuenta como el mismo entrenamiento.
  const g = conPlan();
  const legs = opcion(g, 2);
  const enCurso = empezarSesion({ nombre: 'Legs', lineas: [], planId: g.planActivo.planId, origenTipo: legs.origenTipo, origenId: legs.origenId, fecha: HOY });
  const conVivo = { ...g, sesiones: [{ ...enCurso, fecha: HOY }] };
  const r1 = registrarEntrenamientoHecho(conVivo, { opcion: legs, fecha: HOY, hoy: HOY });
  ok(!r1.ok && r1.motivo === 'empezado', 'Con ese entrenamiento empezado hoy, no se completa a mano: se termina o se descarta');
  const hecha = { ...enCurso, fecha: HOY, estado: 'completada' };
  const r2 = registrarEntrenamientoHecho({ ...g, sesiones: [hecha] }, { opcion: legs, fecha: HOY, hoy: HOY });
  ok(!r2.ok && r2.motivo === 'duplicado', 'Y si ya lo hizo en vivo hoy, tampoco: ya está');
  const desc = { ...enCurso, fecha: HOY, estado: 'descartada' };
  ok(registrarEntrenamientoHecho({ ...g, sesiones: [desc] }, { opcion: legs, fecha: HOY, hoy: HOY }).ok, 'Uno descartado no cuenta: se puede completar');
}

console.log('\n── 7 · «Empezar entrenamiento» sigue igual ──');
{
  const f = conPlan();
  const legs = opcion(f, 2);
  let s = empezarSesion({ nombre: 'Legs', lineas: anadirEjercicio(crearRutina({ nombre: 'x' }), 'sentadilla-barra').lineas, planId: f.planActivo.planId, origenTipo: legs.origenTipo, origenId: legs.origenId });
  ok(s.estado === 'en_curso' && s.registradaAMano === false && s.origen.ejercicios.length === 1, 'Empezar crea una sesión en curso con su snapshot, sin la marca de a mano');
  const ej = s.origen.ejercicios[0];
  s = marcarSerie(s, ej.id, ej.series[0].id, true);
  const fin = guardarEntrenamiento(pasarAFinalizacion(s));
  ok(fin.ok && fin.sesion.estado === 'completada' && fin.sesion.registradaAMano === false && fin.sesion.origen.ejercicios.length === 1, 'Y al guardarla sigue siendo una sesión con datos');
  const conManual = registrarEntrenamientoHecho(f, { opcion: opcion(f, 1), fecha: HOY, hoy: HOY }).fitness;
  ok(sesionEnCursoDelMismoOrigen(conManual, { planId: f.planActivo.planId, origenId: legs.origenId }) === null,
    'Una completada a mano no se toma por «en curso» al pulsar Empezar');
}

console.log('\n── 8 · La interfaz ──');
{
  const vista = leer('src/components/completarEntrenamiento.jsx');
  ok(/createPortal\(/.test(vista) && /useDialogoAccesible\(true, onCerrar\)/.test(vista) && /role="dialog"/.test(vista), 'La hoja es un portal con su diálogo accesible (regla 3, F39)');
  ok(/max=\{hoy\}/.test(vista), 'El campo de fecha no deja elegir un día futuro (y la librería lo vuelve a comprobar)');
  ok(/paso === 'confirmar'/.test(vista) && /T\.confirmar/.test(vista), 'Hay un paso de confirmación antes de guardar');
  ok(/opciones\.length === 0/.test(vista) && /T\.vacioTitulo/.test(vista) && /T\.volver/.test(vista), 'Con nada que elegir, el estado vacío con «Volver»');
  ok(/g && g\.ok === false/.test(vista) && /\.finally\(/.test(vista), 'Un guardado que falla se dice: no se celebra lo que no ha llegado (F37)');
  const fv = leer('src/views/FitnessView.jsx');
  ok((fv.match(/\{hojaCompletar\}/g) || []).length === 3, 'Fitness pinta la hoja en Tu Plan, en las plantillas y en el Historial');
  ok(/onCompletar=\{abrirCompletar \?/.test(fv), '…y les pasa la acción');
  ok(/onCompletar/.test(leer('src/views/TuPlanView.jsx')) && /onCompletar/.test(leer('src/views/PlantillasView.jsx')) && /onCompletar/.test(leer('src/views/HistorialView.jsx')),
    'Las tres pantallas la ofrecen junto a «Empezar entrenamiento»');
  ok(/d\.fecha <= /.test(leer('src/views/TuPlanView.jsx')), 'En Tu Plan, solo en el día de hoy o uno pasado');
  const textos = Object.values(TEXTOS_COMPLETAR).join(' ');
  ok(terminosQueChocan(textos).length === 0, 'Los textos dicen «entrenamiento», nunca «sesión», «rutina» ni «workout» (F42)');
}

console.log(`\n  ${correctas} comprobaciones correctas${fallos ? `, ${fallos} fallos` : ''}.`);
if (fallos) process.exit(1);
