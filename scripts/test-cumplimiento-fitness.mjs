// scripts/test-cumplimiento-fitness.mjs — Fitness 4/8: cumplimiento, descansos y recuperación.
//
// Las pruebas obligatorias del prompt 4 §13 (docs/15_FITNESS/PLAN_DESARROLLO/PLAN_MAESTRO_FITNESS.md):
// ventana de siete días, cambio de fecha, pendientes, caducidad por dos entrenamientos posteriores
// (individual y sin ventana fija), los dos ejemplos obligatorios del §7, los catorce casos del §8,
// elegir el más antiguo o uno más reciente, recuperar en descanso o sustituyendo, cambio de rutina,
// sesión libre, parcial, sin series, una sesión por fecha, «Completar entrenamiento», fecha prevista
// frente a real, persistencia y secuencias largas. ⚠️ Todas las fechas se escriben: pasan igual
// cualquier día (la lección de H-25).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  gradoDeSesion, estadoDeFecha, ventanaDeSieteDias, opcionesDeRecuperacion, consecuenciasDeElegir,
  prepararSesionNueva, sesionParaRecuperar, fechaOcupada, sesionQueOcupa, analisisDeCumplimiento,
  previstoEn, claseDeSesion, REALIZADO, CADUCA_TRAS, DECISIONES_FASE4, ESTADOS_FECHA, resumenDeVentana,
  ventanaConDatos, explicarCaducidad, NO_EN_FASE4,
} from '../src/lib/cumplimientoFitness.js';
import { completarEntrenamiento, opcionesParaCompletar, TEXTOS_COMPLETAR } from '../src/lib/completarEntrenamiento.js';
import {
  crearRutinaCiclica, configurarDia, activarRutina, guardarRutinaCiclica, plantillaDisponible,
  prepararEliminarPlantilla,
} from '../src/lib/rutinasCiclicas.js';
import { idPlantillaDeDia, usarPlan } from '../src/lib/planes.js';
import { planActivoCompleto } from '../src/lib/tuPlan.js';
import { planARutina } from '../src/lib/constructor.js';
import { normalizarFitnessConSesiones, empezarSesion, guardarSesion, descartarSesion } from '../src/lib/entrenamiento.js';
import { guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { prepararEliminacion, prepararRestauracion } from '../src/lib/papelera.js';
import { compararSeries, aparicionesDeEjercicio } from '../src/lib/progresion.js';
import { CAPAS_FITNESS } from '../src/lib/arquitecturaFitness.js';
import { migrarFitness, MIGRACIONES_FITNESS, VERSION_FITNESS, conEntradaEnVigor } from '../src/lib/persistenciaFitness.js';
import { migrarV1aV2, validarMigracionV2, CLAVE_RESPALDO_V1 } from '../src/lib/migracionFitnessV2.js';
import { ARCHIVOS_FITNESS } from '../src/lib/feedbackFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const cargar = (f) => normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f)));
const sumar = (fecha, n) => { const d = new Date(`${fecha}T12:00:00`); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE'); };

/* El lunes 5 de octubre de 2026, día 1 del ciclo en todos los escenarios. */
const L = '2026-10-05';
const M = sumar(L, 1);
const X = sumar(L, 2);
const J = sumar(L, 3);
const V = sumar(L, 4);
const S = sumar(L, 5);
const D = sumar(L, 6);
const PUSH = idPlantillaDeDia('ppl-estetico-dia-1');
const PULL = idPlantillaDeDia('ppl-estetico-dia-2');
const LEGS = idPlantillaDeDia('ppl-estetico-dia-3');
const PLANTILLA = { P: PUSH, L: PULL, G: LEGS };

/** Un Fitness con una rutina suya activada el lunes: 'P' Push, 'L' Pull, 'G' Legs, 'D' descanso. */
function escenario(patron, { desde = L } = {}) {
  let r = crearRutinaCiclica({ nombre: `Rutina ${patron}`, duracion: patron.length });
  patron.split('').forEach((c, i) => {
    r = configurarDia(r, r.dias[i].id, c === 'D' ? { tipo: 'descanso' } : { tipo: 'entreno', plantillaId: PLANTILLA[c] });
  });
  let f = cargar({});
  const g = guardarRutinaCiclica(f, r);
  if (!g.ok) throw new Error(`No se guarda la rutina ${patron}: ${g.motivo}`);
  const a = activarRutina(g.fitness, g.rutina.id, { hoy: desde, confirmado: true });
  if (!a.ok) throw new Error(`No se activa la rutina ${patron}: ${a.motivo}`);
  f = { ...a.fitness, cumplimientoDesde: desde };
  return { f, rutinaId: g.rutina.id, dias: g.rutina.dias };
}

let reloj = 1_700_000_000_000;
/** Termina una sesión ya preparada: todas las series hechas con valores (o las que se digan). */
function terminar(s, { grado = 'completa' } = {}) {
  reloj += 60_000;
  let n = 0;
  const ejercicios = s.origen.ejercicios.map((e) => ({
    ...e,
    series: e.series.map((x) => {
      n += 1;
      const hecha = grado === 'completa' || (grado === 'parcial' && n === 1);
      return hecha ? { ...x, estado: 'hecha', hecho: { reps: 8, duracion: null, peso: 20 } } : x;
    }),
  }));
  return { ...s, origen: { ...s.origen, ejercicios }, estado: 'completada', iniciadaEn: reloj - 3_600_000, terminadaEn: reloj, guardadaEn: reloj };
}

/** Entrena una plantilla el día `fecha`. Devuelve el Fitness con la sesión guardada. */
function entrenar(f, fecha, { plantilla = 'P', grado = 'completa', recuperar = null, deDia = true } = {}) {
  let s;
  if (recuperar) {
    s = sesionParaRecuperar(f, recuperar, { hoy: fecha, ahora: reloj });
  } else {
    const pl = plantillaDisponible(f, PLANTILLA[plantilla] || plantilla);
    const rutina = planARutina(pl);
    const resuelto = planActivoCompleto(f);
    const dia = deDia && resuelto && resuelto.plan ? resuelto.plan.dias.find((d) => d.plantillaId === pl.id) : null;
    s = empezarSesion({
      nombre: pl.nombre, lineas: rutina.lineas, ahora: reloj, hoy: fecha,
      planId: dia ? resuelto.activo.planId : pl.id, origenTipo: dia ? resuelto.origen : 'plantilla', origenId: dia ? dia.id : pl.id,
    });
  }
  const r = prepararSesionNueva(f, s, { hoy: fecha, recuperar });
  if (!r.ok) throw new Error(`No se puede entrenar el ${fecha}: ${r.motivo}`);
  return guardarSesion(f, terminar(r.sesion, { grado }));
}
const estado = (f, fecha, hoy) => estadoDeFecha(f, fecha, { hoy }).estado;
const pendientesEn = (f, hoy) => analisisDeCumplimiento(f, { hoy }).pendientes;
const recuperablesEn = (f, hoy) => opcionesDeRecuperacion(f, { hoy }).recuperables.map((p) => p.fecha);
const pendienteDe = (f, fecha, hoy) => opcionesDeRecuperacion(f, { hoy }).recuperables.find((p) => p.fecha === fecha);

console.log('\n── El grado de una sesión ──');
{
  const { f } = escenario('PDDDDDD');
  const pl = plantillaDisponible(f, PUSH);
  const s = empezarSesion({ nombre: 'Push', lineas: planARutina(pl).lineas, hoy: L });
  ok(gradoDeSesion(s) === 'vacia', 'Sin ninguna serie hecha, vacía (caso 11)');
  ok(gradoDeSesion(terminar(s)) === 'completa', 'Todas las planificadas hechas, completa');
  ok(gradoDeSesion(terminar(s, { grado: 'parcial' })) === 'parcial', 'Algunas, parcial (caso 10)');
  const omitida = terminar(s);
  omitida.origen.ejercicios[0].series[0] = { ...omitida.origen.ejercicios[0].series[0], estado: 'omitida', hecho: {} };
  ok(gradoDeSesion(omitida) === 'parcial', '🔓 PD-11 — una planificada omitida cuenta como no hecha: parcial');
  const conAnadida = terminar(s);
  conAnadida.origen.ejercicios[0].series.push({ id: 'x', origen: 'anadida', estado: 'pendiente', plan: {}, hecho: {} });
  ok(gradoDeSesion(conAnadida) === 'completa', 'Una serie añadida sin hacer no la vuelve parcial: no estaba en el plan');
  ok(gradoDeSesion({ ...s, completadaCon: 'completar' }) === 'completa', '«Completar entrenamiento» es siempre completa (D-03)');
}

console.log('\n── Qué tocaba cada día y la ventana de siete días ──');
{
  const { f, rutinaId } = escenario('PLGDDDD');
  const p = previstoEn(f, L, { hoy: J });
  ok(p && p.tipo === 'entreno' && p.plantillaId === PUSH && p.posicion === 0 && p.planId === rutinaId, 'El lunes tocaba Push, día 1, con su plantilla y su rutina');
  ok(previstoEn(f, J, { hoy: J }).tipo === 'descanso', 'El jueves, descanso');
  const v = ventanaDeSieteDias(f, { hoy: J });
  ok(v.length === 7 && v[6].fecha === J && v[0].fecha === sumar(J, -6), 'Siete días naturales, del más antiguo a hoy incluido');
  ok(v.filter((d) => d.fecha > J).length === 0, 'Ni un día futuro en la ventana');
  ok(v.filter((d) => d.fecha < L).every((d) => d.estado === 'sin_seguimiento'), 'Los días antes de empezar el seguimiento, sin seguimiento (no rojos)');
  ok(estadoDeFecha(f, V, { hoy: J }).estado === 'futuro' && estadoDeFecha(f, V, { hoy: J }).color === 'futuro', 'Un día futuro nunca es incumplido');
  const deMiercoles = escenario('PLGDDDD').f;
  ok(estado(deMiercoles, X, X) === 'hoy' && estadoDeFecha(deMiercoles, X, { hoy: X }).color === 'futuro', 'El entreno de hoy es «Hoy» durante todo el día (§3.1)');
  ok(estado(deMiercoles, X, J) === 'pendiente', 'Y al empezar el día siguiente pasa a pendiente');
  ok(estado(deMiercoles, J, sumar(J, 1)) === 'descanso_respetado', 'Un descanso terminado sin entrenar: respetado (verde)');
  ok(!pendientesEn(deMiercoles, sumar(J, 1)).some((p) => p.fecha === J), 'Un descanso nunca se convierte en pendiente');
  const r = resumenDeVentana(ventanaDeSieteDias(deMiercoles, { hoy: V }));
  ok(r.pendiente === 3 && r.verde === 1 && r.rojo === 0, `El resumen cuenta colores, sin porcentajes (${JSON.stringify(r)})`);
  ok(!ventanaConDatos(ventanaDeSieteDias(cargar({}), { hoy: J })), 'Sin rutina, la ventana no tiene nada que decir');
}

console.log('\n── Generación de pendientes ──');
{
  const { f, rutinaId, dias } = escenario('PLGDDDD');
  const ps = pendientesEn(f, J);
  ok(ps.map((p) => p.fecha).join() === [L, M, X].join(), 'Lunes, martes y miércoles sin entrenar: tres pendientes');
  const p0 = ps[0];
  ok(p0.planId === rutinaId && p0.diaId === dias[0].id && p0.plantillaId === PUSH && p0.posicion === 0,
    'Cada pendiente conserva su identidad: rutina, día del ciclo, plantilla y fecha (§5)');
  ok(ps.every((p) => p.recuperable && !p.caducado && p.quedan === 2), 'Sin entrenamientos posteriores, los tres recuperables');
}

console.log('\n── Ejemplo obligatorio 1 y caso 12: recuperar el más reciente y luego el más antiguo ──');
{
  let { f } = escenario('PLGDDDD');
  f = entrenar(f, X, { recuperar: pendienteDe(f, M, X) });
  ok(estado(f, M, J) === 'recuperado' && estadoDeFecha(f, M, { hoy: J }).color === 'verde', 'El martes (Pull), recuperado el miércoles: verde');
  const push = pendienteDe(f, L, J);
  ok(!!push && push.posteriores.length === 1 && push.quedan === 1, 'El jueves Push sigue siendo recuperable: un solo entrenamiento posterior');
  let otro = entrenar(f, J, { plantilla: 'G', deDia: false });
  ok(estado(otro, L, V) === 'perdido', 'Si antes de recuperar Push se hace otro entrenamiento, Push caduca (dos posteriores)');
  ok(/12 de octubre|7 de octubre/.test(explicarCaducidad(pendientesEn(otro, V).find((p) => p.fecha === L))) || /dos entrenamientos/.test(explicarCaducidad(pendientesEn(otro, V).find((p) => p.fecha === L))),
    'Y explica por qué, con las dos fechas');
  otro = entrenar(f, J, { recuperar: pendienteDe(f, L, J) });
  ok(estado(otro, L, V) === 'recuperado', 'Recuperado el jueves, Push queda verde');
}

console.log('\n── Ejemplo obligatorio 2 y caso 13: caducidad por dos entrenamientos posteriores ──');
{
  let { f } = escenario('PLGDDDD');
  f = entrenar(f, M, { plantilla: 'L' });
  f = entrenar(f, X, { plantilla: 'G' });
  const e = estadoDeFecha(f, L, { hoy: J });
  ok(e.estado === 'perdido' && e.color === 'rojo', 'El jueves Push ya no se puede recuperar: perdido (rojo)');
  ok(/dos entrenamientos después/.test(e.motivo) && e.motivo.includes('6 de octubre') && e.motivo.includes('7 de octubre'),
    `Y el sistema explica por qué: «${e.motivo}»`);
  ok(!recuperablesEn(f, J).includes(L), 'No aparece entre los recuperables');
  ok(opcionesDeRecuperacion(f, { hoy: J }).caducados.some((p) => p.fecha === L), '…y sí entre los caducados, con su motivo');
  ok(estado(f, M, J) === 'cumplido' && estado(f, X, J) === 'cumplido', 'Martes y miércoles, cumplidos');
}

console.log('\n── La caducidad cuenta entrenamientos, no días (D-02) ──');
{
  let { f } = escenario('PDDDDDDDDDDDDD');
  ok(pendienteDe(f, L, sumar(L, 13))?.recuperable, 'Push pendiente sigue siendo recuperable trece días después si no ha entrenado nada (sin ventana fija)');
  f = entrenar(f, sumar(L, 9), { plantilla: 'L', deDia: false });
  ok(pendienteDe(f, L, sumar(L, 13))?.quedan === 1, 'Un entrenamiento después: le queda uno');
  const mismoDia = entrenar(escenario('PDDDDDD').f, L, { plantilla: 'P' });
  ok(!pendientesEn(mismoDia, M).length, 'Hecho su día, no hay pendiente');
  const n = pendientesEn(escenario('PPPPPPP').f, sumar(L, 7));
  ok(n.length === 7 && n.every((p) => p.recuperable), 'Siete días sin entrenar: siete pendientes recuperables, ninguno caducado por días');
}

console.log('\n── Caso 1: un perdido y un descanso posterior ──');
{
  let { f } = escenario('PLDDDDD');
  f = entrenar(f, M, { plantilla: 'L' });
  const op = opcionesDeRecuperacion(f, { hoy: X });
  ok(op.disponible && op.descansoHoy && op.recomendado?.fecha === L, 'Miércoles (descanso): informa de que puede recuperar Push y lo recomienda');
  f = entrenar(f, X, { recuperar: op.recomendado });
  ok(estado(f, L, J) === 'recuperado', 'Lunes: verde por recuperación');
  ok(estado(f, M, J) === 'cumplido', 'Martes: verde por cumplimiento');
  const x = estadoDeFecha(f, X, { hoy: J });
  ok(x.estado === 'descanso_sacrificado' && x.color === 'rojo', 'Miércoles: rojo por descanso sacrificado');
  ok(estado(f, X, X) === 'descanso_sacrificado', '…desde el momento en que existe la sesión, el mismo día');
}

console.log('\n── Caso 2: se sustituye el entrenamiento de hoy ──');
{
  let { f } = escenario('PLDDDDD');
  const op = opcionesDeRecuperacion(f, { hoy: M });
  ok(op.previstoHoy.nombre === 'Pull' && op.recomendado.fecha === L, 'Martes: ofrece el previsto de hoy (Pull) y recuperar Push');
  const c = consecuenciasDeElegir(f, { tipo: 'recuperar', pendiente: op.recomendado }, { hoy: M });
  ok(c.hoyQuedaPendiente && c.frases.some((t) => /Pull.*quedará pendiente/.test(t)), 'Y explica que Pull quedará pendiente');
  f = entrenar(f, M, { recuperar: op.recomendado });
  ok(estado(f, L, X) === 'recuperado', 'Lunes: verde por recuperación');
  const s = sesionQueOcupa(f, M);
  ok(s && s.diaDePlan.clase === 'recuperacion' && s.diaDePlan.plantillaId === PUSH, 'Martes: sesión Push registrada como recuperación');
  ok(estado(f, M, M) === 'hoy' && /quedará pendiente/.test(estadoDeFecha(f, M, { hoy: M }).motivo), 'Durante el martes, Pull sigue «Hoy» y avisa');
  ok(estado(f, M, X) === 'pendiente', 'Al terminar el martes, Pull queda pendiente');
  ok(pendientesEn(f, X).find((p) => p.fecha === M).quedan === 2, '…con su propia caducidad, desde cero (§6.B)');
  ok(!prepararSesionNueva(f, empezarSesion({ nombre: 'Pull', hoy: M }), { hoy: M }).ok, 'Máximo una sesión ese día');
}

console.log('\n── Caso 3: dos pendientes y dos descansos ──');
{
  let { f } = escenario('PLDDDDD');
  ok(recuperablesEn(f, X).join() === [L, M].join(), 'Miércoles: los dos recuperables');
  f = entrenar(f, X, { recuperar: pendienteDe(f, L, X) });
  ok(recuperablesEn(f, J).join() === M && pendienteDe(f, M, J).quedan === 1, 'Jueves: Pull sigue recuperable (un posterior)');
  f = entrenar(f, J, { recuperar: pendienteDe(f, M, J) });
  ok(estado(f, L, V) === 'recuperado' && estado(f, M, V) === 'recuperado', 'Se recuperan los dos');
  ok(estado(f, X, V) === 'descanso_sacrificado' && estado(f, J, V) === 'descanso_sacrificado', 'Y los dos descansos quedan sacrificados');
}

console.log('\n── Caso 4: tres pendientes y dos descansos ──');
{
  let { f } = escenario('PLGDDDD');
  const op = opcionesDeRecuperacion(f, { hoy: J });
  ok(op.recomendado.fecha === L && op.recuperables.map((p) => p.fecha).join() === [L, M, X].join(), 'Jueves: recomienda el más antiguo, Push, y lista los tres');
  const c = consecuenciasDeElegir(f, { tipo: 'recuperar', pendiente: op.recomendado }, { hoy: J });
  ok(c.sacrificaDescanso && !c.caducarian.length, 'Elegir Push hoy: sacrifica el descanso y no caduca nada todavía');
  f = entrenar(f, J, { recuperar: op.recomendado });
  ok(recuperablesEn(f, V).join() === [M, X].join(), 'Viernes: Pull y Legs con un posterior, los dos recuperables');
  const c2 = consecuenciasDeElegir(f, { tipo: 'recuperar', pendiente: pendienteDe(f, M, V) }, { hoy: V });
  ok(c2.caducarian.map((p) => p.fecha).join() === X && c2.frases.some((t) => /Legs.*caducará/.test(t)),
    'Elegir Pull explica ANTES de confirmar que Legs caducará');
  f = entrenar(f, V, { recuperar: pendienteDe(f, M, V) });
  ok(estado(f, X, S) === 'perdido', 'Tras la segunda recuperación, Legs acumula dos posteriores y caduca: no se pueden los tres');
}

console.log('\n── Caso 5: recuperar primero el más reciente ──');
{
  let { f } = escenario('PLGDDDD');
  f = entrenar(f, J, { recuperar: pendienteDe(f, X, J) });
  ok(recuperablesEn(f, V).join() === [L, M].join(), 'Tras recuperar Legs el jueves, Push y Pull siguen recuperables (un posterior)');
  ok(opcionesDeRecuperacion(f, { hoy: V }).recomendado.fecha === L, 'Recomienda el más antiguo, pero no elige por él');
  const c = consecuenciasDeElegir(f, { tipo: 'recuperar', pendiente: pendienteDe(f, M, V) }, { hoy: V });
  ok(c.caducarian.map((p) => p.fecha).join() === L, 'Elegir Pull el viernes: avisa de que Push caducaría');
  f = entrenar(f, V, { recuperar: pendienteDe(f, M, V) });
  ok(estado(f, M, S) === 'recuperado' && estado(f, L, S) === 'perdido', 'Respeta su elección: Pull recuperado, Push caducado');
}

console.log('\n── Caso 6: descanso respetado con un pendiente ──');
{
  const { f } = escenario('PDDDDDD');
  const c = consecuenciasDeElegir(f, { tipo: 'descansar' }, { hoy: M });
  ok(c.frases.some((t) => /descanso respetado/.test(t)) && !c.caducarian.length, 'Elegir descansar: descanso respetado, ningún pendiente caduca');
  ok(estado(f, M, X) === 'descanso_respetado', 'El descanso queda verde');
  ok(pendienteDe(f, L, sumar(L, 10)).quedan === 2, 'Y el contador del pendiente no avanza: un descanso no es un entrenamiento');
}

console.log('\n── Caso 7: entrenamiento libre en un descanso ──');
{
  let { f } = escenario('PDDDDDD');
  f = entrenar(f, L, { plantilla: 'P' });
  f = entrenar(f, M, { plantilla: 'L', deDia: false });
  const s = sesionQueOcupa(f, M);
  ok(s && s.diaDePlan.clase === 'libre' && s.estado === 'completada', 'La sesión se registra como libre, completada');
  ok(estado(f, M, X) === 'descanso_sacrificado', 'Pero el descanso aparece rojo');
  ok(analisisDeCumplimiento(f, { hoy: X }).realizadas.includes(M) === REALIZADO.libre, '🔓 PD-01 — y cuenta como entrenamiento realizado (parámetro `REALIZADO.libre`)');
}

console.log('\n── Caso 8: segunda sesión en la misma fecha ──');
{
  let { f } = escenario('PDDDDDD');
  const pl = plantillaDisponible(f, PUSH);
  const s1 = prepararSesionNueva(f, empezarSesion({ nombre: 'Push', lineas: planARutina(pl).lineas, hoy: L }), { hoy: L }).sesion;
  f = guardarSesion(f, s1);
  ok(fechaOcupada(f, L), 'Una sesión en curso ya ocupa la fecha');
  const r = prepararSesionNueva(f, empezarSesion({ nombre: 'Pull', hoy: L }), { hoy: L });
  ok(!r.ok && r.motivo === 'fecha_ocupada' && /empezado hoy/.test(r.aviso.titulo), 'Otra, desde cualquier pantalla, no se puede empezar: dice que hay uno empezado');
  ok(prepararSesionNueva(f, s1, { hoy: L }).ok, 'La misma sesión sí (no se bloquea a sí misma)');
  const descartada = descartarSesion(s1, { confirmado: true }).sesion;
  const libre = guardarSesion(f, descartada);
  ok(!fechaOcupada(libre, L) && prepararSesionNueva(libre, empezarSesion({ nombre: 'Pull', hoy: L }), { hoy: L }).ok, '🔓 PD-10 — una descartada libera la fecha');
  f = guardarSesion(f, terminar(s1));
  const otra = prepararSesionNueva(f, empezarSesion({ nombre: 'Pull', hoy: L }), { hoy: L });
  ok(!otra.ok && /Ya entrenaste hoy/.test(otra.aviso.titulo), 'Completada, tampoco: «Ya entrenaste hoy»');
  ok(!completarEntrenamiento(f, { opcion: opcionesParaCompletar(f)[0], fecha: L, hoy: L }).ok, '«Completar entrenamiento» tampoco crea una segunda');
  ok(!prepararSesionNueva(f, empezarSesion({ nombre: 'X', hoy: M }), { hoy: L }).ok, 'Ni una fecha futura');
}

console.log('\n── Caso 9: cambio de rutina ──');
{
  let { f, rutinaId } = escenario('PLDDDDD');
  const otra = escenario('GDDDDDD');
  const g = guardarRutinaCiclica(f, otra.f.rutinas[0]);
  const a = activarRutina(g.fitness, g.rutina.id, { hoy: X, confirmado: true });
  f = a.fitness;
  const bloq = opcionesDeRecuperacion(f, { hoy: X }).bloqueados;
  ok(!recuperablesEn(f, X).includes(L) && bloq.some((p) => p.fecha === L && p.bloqueo.motivo === 'otra_rutina'),
    'Con otra rutina activa, los pendientes de la anterior no se pueden recuperar (y se dice por qué)');
  const vuelta = activarRutina(f, rutinaId, { hoy: J, confirmado: true }).fitness;
  ok(recuperablesEn(vuelta, J).includes(L) && recuperablesEn(vuelta, J).includes(M), 'Al reactivar la original, sin caducar, vuelven a ser recuperables');
  let entreMedias = entrenar(f, X, { plantilla: 'G' });
  entreMedias = entrenar(entreMedias, sumar(X, 1), { plantilla: 'G', deDia: false });
  const vuelta2 = activarRutina(entreMedias, rutinaId, { hoy: V, confirmado: true }).fitness;
  ok(!recuperablesEn(vuelta2, V).includes(L), 'Pero si con la otra hizo dos entrenamientos, caducaron igual (su contador sigue avanzando)');
  ok(!pendientesEn(f, X).some((p) => p.planId === g.rutina.id && p.fecha < X), 'Y no se mezclan: la nueva no hereda pendientes de antes de activarse');
}

console.log('\n── Caso 10 y 11: sesión parcial y sesión sin series ──');
{
  let { f } = escenario('PLDDDDD');
  f = entrenar(f, L, { plantilla: 'P', grado: 'parcial' });
  const e = estadoDeFecha(f, L, { hoy: M });
  ok(e.estado === 'parcial' && e.color === 'amarillo_verdoso', 'Parcial: la fecha aparece amarillo verdoso');
  ok(!pendientesEn(f, M).some((p) => p.fecha === L), '🔓 PD-08 — y no queda pendiente');
  ok(analisisDeCumplimiento(f, { hoy: M }).realizadas.includes(L) === REALIZADO.parcial, '🔓 PD-01 — cuenta como realizado para la caducidad (parámetro)');
  let v = escenario('PLDDDDD').f;
  v = entrenar(v, L, { plantilla: 'P', grado: 'vacia' });
  ok(estado(v, L, M) === 'pendiente', 'Sin ninguna serie: la fecha queda incumplida y pendiente (caso 11)');
  ok(/sin ninguna serie/.test(estadoDeFecha(v, L, { hoy: M }).motivo), '…y lo explica');
  ok(!analisisDeCumplimiento(v, { hoy: M }).realizadas.includes(L), 'No es un entrenamiento realizado');
  ok(fechaOcupada(v, L), 'Pero la sesión existe y ocupa su fecha: no se borra');
  let rp = escenario('PDDDDDD').f;
  rp = entrenar(rp, M, { recuperar: pendienteDe(rp, L, M), grado: 'parcial' });
  ok(estado(rp, L, X) === 'parcial', '🔓 PD-08 — una recuperación parcial deja su fecha prevista en amarillo verdoso');
}

console.log('\n── Caso 14: «Completar entrenamiento» ──');
{
  const { f } = escenario('PLDDDDD');
  const opciones = opcionesParaCompletar(f);
  ok(opciones.length === 2 && opciones[0].nombre === 'Push', 'Ofrece los días de entreno de la rutina activa');
  const r = completarEntrenamiento(f, { opcion: opciones[0], fecha: L, hoy: L, ahora: 123 });
  ok(r.ok && r.sesion.estado === 'completada' && r.sesion.completadaCon === 'completar', 'Registra la sesión completada e identificada');
  const series = r.sesion.origen.ejercicios.flatMap((e) => e.series);
  ok(series.length > 0 && series.every((x) => x.estado === 'hecha'), 'Simula todas las series hechas');
  ok(series.every((x) => x.hecho.reps === null && x.hecho.peso === null && x.hecho.duracion === null), 'Sin inventar pesos, repeticiones ni tiempos');
  ok(r.sesion.iniciadaEn === null && r.sesion.terminadaEn === null, 'Ni una duración inventada');
  ok(gradoDeSesion(r.sesion) === 'completa', 'Es completa, no parcial');
  const g = guardarSesion(f, r.sesion);
  ok(estado(g, L, M) === 'cumplido' && /Completar entrenamiento/.test(estadoDeFecha(g, L, { hoy: M }).motivo), 'El lunes, cumplido, y dice cómo');
  ok(analisisDeCumplimiento(g, { hoy: M }).realizadas.includes(L), 'Cuenta como realizado para la caducidad');
  ok(!completarEntrenamiento(g, { opcion: opciones[1], fecha: L, hoy: L }).ok, 'No crea una segunda sesión en la misma fecha');
  ok(!completarEntrenamiento(f, { opcion: opciones[0], fecha: M, hoy: L }).ok, 'Ni en una fecha futura');
  const ap = aparicionesDeEjercicio(g, r.sesion.origen.ejercicios[0].exerciseId);
  ok(!ap.length || ap.every((x) => !x.mejor || x.mejor.reps === null), 'La progresión no la compara con nada (no hay valores)');
  const pasado = completarEntrenamiento(f, { opcion: opciones[1], fecha: M, hoy: X });
  ok(pasado.ok && pasado.sesion.fecha === M && pasado.sesion.diaDePlan.clase === 'prevista', '🔓 PD-02 — un día pasado: cuenta en esa fecha como el previsto');
  const recup = completarEntrenamiento(f, { recuperar: pendienteDe(f, L, M), hoy: M });
  ok(recup.ok && recup.sesion.diaDePlan.clase === 'recuperacion' && recup.sesion.diaDePlan.fechaPrevista === L, 'Desde la recuperación, completa el pendiente como recuperación');
  ok(TEXTOS_COMPLETAR.marca.includes('Completar entrenamiento'), 'Tiene la marca que se enseña en el historial');
}

console.log('\n── Fecha prevista y fecha real ──');
{
  let { f } = escenario('PLDDDDD');
  f = entrenar(f, X, { recuperar: pendienteDe(f, L, X) });
  const s = sesionQueOcupa(f, X);
  ok(s.fecha === X && s.diaDePlan.fechaPrevista === L, 'Una recuperación guarda las dos: la real (miércoles) y la prevista (lunes)');
  ok(s.diaDePlan.planId && s.diaDePlan.diaId && s.diaDePlan.plantillaId === PUSH && s.diaDePlan.posicion === 0, 'Y la rutina, el día del ciclo y la plantilla');
  f = entrenar(f, sumar(L, 7), { plantilla: 'P' });
  const p = sesionQueOcupa(f, sumar(L, 7));
  ok(p.diaDePlan.clase === 'prevista' && p.diaDePlan.fechaPrevista === p.fecha, 'Una prevista: la misma fecha en los dos');
  const desdeLib = escenario('PLDDDDD');
  const pull = plantillaDisponible(desdeLib.f, PULL);
  const sl = prepararSesionNueva(desdeLib.f, empezarSesion({ nombre: 'Pull', hoy: M, planId: PULL, origenTipo: 'plantilla', origenId: PULL, lineas: planARutina(pull).lineas }), { hoy: M }).sesion;
  ok(sl.diaDePlan.clase === 'prevista' && sl.diaDePlan.planId === desdeLib.rutinaId && sl.diaDePlan.diaId === desdeLib.dias[1].id,
    'Empezada desde «Tus plantillas» el día que toca, es el previsto: apunta a la rutina y a su día');
  const libre = escenario('PDDDDDD').f;
  const l = prepararSesionNueva(libre, empezarSesion({ nombre: 'Algo', hoy: M, origenTipo: 'plantilla', origenId: 'zzz' }), { hoy: M }).sesion;
  ok(l.diaDePlan.clase === 'libre' && l.diaDePlan.fechaPrevista === null, 'Una libre: sin fecha prevista');
}

console.log('\n── PD-12: la plantilla del pendiente en la papelera ──');
{
  let { f } = escenario('PLDDDDD');
  const prep = prepararEliminarPlantilla(f, PUSH, { hoy: M });
  const elim = prepararEliminacion(prep.fitness, 'fitness', 'plantillas', PUSH, `${M}T10:00:00.000Z`);
  let sinPush = elim.moduloActualizado;
  const b = opcionesDeRecuperacion(sinPush, { hoy: X }).bloqueados.find((p) => p.fecha === L);
  ok(b && b.bloqueo.motivo === 'plantilla_eliminada' && /Eliminados recientes/.test(b.bloqueo.texto), 'No es recuperable mientras su plantilla esté en la papelera, y se dice');
  sinPush = entrenar(sinPush, X, { plantilla: 'L', deDia: false });
  sinPush = entrenar(sinPush, J, { plantilla: 'L', deDia: false });
  ok(estado(sinPush, L, V) === 'perdido', 'Su caducidad sigue contando');
  const rest = prepararRestauracion(elim.moduloActualizado, elim.entrada);
  const conPush = rest.moduloActualizado || rest.fitness || rest;
  ok(recuperablesEn(conPush, X).includes(L), 'Al restaurarla, vuelve a ser recuperable');
}

console.log('\n── Dos sesiones el mismo día por sincronización ──');
{
  let { f } = escenario('PDDDDDD');
  f = entrenar(f, L, { plantilla: 'P' });
  const dup = terminar(empezarSesion({ nombre: 'Otra', hoy: L, origenTipo: 'plantilla', origenId: PULL, lineas: planARutina(plantillaDisponible(f, PULL)).lineas }));
  const con = { ...f, sesiones: [...f.sesiones, dup] };
  const a = analisisDeCumplimiento(con, { hoy: M });
  ok(a.conflicto.has(dup.id) && con.sesiones.length === 2, 'La segunda queda en conflicto y ninguna se borra');
  ok(estadoDeFecha(con, L, { hoy: M }).conflicto.length === 1, 'La fecha lo dice');
  const viejo = { ...con, cumplimientoDesde: M };
  ok(analisisDeCumplimiento(viejo, { hoy: M }).conflicto.size === 0, 'Antes de la entrada en vigor, varias sesiones un día son historia: sin conflicto');
  ok(estado(viejo, L, M) === 'sin_seguimiento', '…y sin colores');
}

console.log('\n── Persistencia: lo que se escribe sobrevive a la puerta de carga ──');
{
  let { f } = escenario('PLDDDDD');
  f = entrenar(f, X, { recuperar: pendienteDe(f, L, X) });
  const c = completarEntrenamiento(f, { opcion: opcionesParaCompletar(f)[1], fecha: M, hoy: X });
  f = guardarSesion(f, c.sesion);
  const vuelta = cargar(f);
  const r = vuelta.sesiones.find((s) => s.fecha === X);
  ok(r.diaDePlan.clase === 'recuperacion' && r.diaDePlan.fechaPrevista === L && r.diaDePlan.plantillaId === PUSH, 'La recuperación vuelve con su `diaDePlan` entero');
  const m = vuelta.sesiones.find((s) => s.fecha === M);
  ok(m.completadaCon === 'completar', '`completadaCon` vuelve (regla 5: está en `crearWorkoutSession`)');
  ok(vuelta.cumplimientoDesde === L, '`cumplimientoDesde` vuelve');
  ok(estado(vuelta, L, J) === 'recuperado' && estado(vuelta, M, J) === 'cumplido', 'Y el cumplimiento dice lo mismo después de recargar');
  const g = guardarEntrenamiento({ ...sesionParaRecuperar(f, { fecha: L, planId: r.diaDePlan.planId, diaId: r.diaDePlan.diaId, plantillaId: PUSH, nombre: 'Push' }), estado: 'finalizando', diaDePlan: r.diaDePlan }, { confirmado: true }).sesion;
  ok(g.diaDePlan.clase === 'recuperacion', 'Guardar desde el resumen (F8) conserva el `diaDePlan` escrito al empezar');
}

console.log('\n── Secuencia larga: la regla se cumple en cada pendiente ──');
{
  let { f } = escenario('PLGDPLD');
  const dias = 70;
  for (let i = 0; i < dias; i += 1) {
    const fecha = sumar(L, i);
    const op = opcionesDeRecuperacion(f, { hoy: fecha });
    const k = (i * 7 + 3) % 10;
    if (k < 3) continue;
    if (k < 5 && op.disponible) { f = entrenar(f, fecha, { recuperar: op.recuperables[op.recuperables.length - 1] }); continue; }
    if (k < 6 && op.disponible) { f = entrenar(f, fecha, { recuperar: op.recomendado }); continue; }
    if (op.previstoHoy && op.previstoHoy.tipo === 'entreno') f = entrenar(f, fecha, { plantilla: 'P', grado: k === 9 ? 'parcial' : 'completa' });
  }
  const hoy = sumar(L, dias);
  const a = analisisDeCumplimiento(f, { hoy });
  const fechasSesiones = f.sesiones.map((s) => s.fecha);
  ok(new Set(fechasSesiones).size === fechasSesiones.length, `${f.sesiones.length} sesiones en ${dias} días, nunca dos en la misma fecha`);
  const bien = a.pendientes.every((p) => p.caducado === (a.realizadas.filter((d) => d > p.fecha && d <= hoy).length >= CADUCA_TRAS));
  ok(bien && a.pendientes.length > 0, `Los ${a.pendientes.length} pendientes: caducado si y solo si hay dos entrenamientos realizados después`);
  const recs = f.sesiones.filter((s) => s.diaDePlan && s.diaDePlan.clase === 'recuperacion');
  ok(recs.length > 0 && recs.every((s) => s.diaDePlan.fechaPrevista < s.fecha), `Las ${recs.length} recuperaciones, siempre de una fecha anterior a la real`);
  ok(recs.every((s) => {
    const antesDeRecuperar = a.realizadas.filter((d) => d > s.diaDePlan.fechaPrevista && d < s.fecha).length;
    return antesDeRecuperar < CADUCA_TRAS;
  }), 'Y ninguna recuperó un pendiente que ya hubiera caducado');
  const v = ventanaDeSieteDias(f, { hoy });
  ok(v.every((d) => ESTADOS_FECHA.some((e) => e.id === d.estado) && d.motivo), 'Cada día de la ventana tiene un estado conocido y su explicación');
  const t0 = Date.now();
  for (let i = 0; i < 20; i += 1) analisisDeCumplimiento({ ...f }, { hoy });
  ok(Date.now() - t0 < 4000, `Rendimiento: 20 análisis completos de ${dias} días en ${Date.now() - t0} ms`);
}

console.log('\n── La migración M1 (versión 1 → 2): solo en código y en pruebas ──');
{
  const tramoPreset = {
    planId: 'ppl-estetico', origen: 'preset', desde: '2026-08-05', hasta: '2026-09-02', nombre: 'PPL Estético',
    dias: ['1', '2', '3', '4', '5', '6', '7'].map((n) => ({ id: `ppl-estetico-dia-${n}`, nombre: `D${n}`, descanso: n === '4' || n === '7' })),
  };
  const tramoPlantilla = { planId: 'p-mia', origen: 'plantilla', desde: '2026-09-02', hasta: '2026-09-20', nombre: 'Mía', dias: [{ id: 'p-mia-dia', nombre: 'Mía', descanso: false }] };
  const sesionVieja = terminar(empezarSesion({ nombre: 'Push', hoy: '2026-09-01', origenTipo: 'plan', origenId: 'ppl-estetico-dia-1', planId: 'ppl-estetico', lineas: planARutina(plantillaDisponible(cargar({}), PUSH)).lineas }));
  const v1 = {
    version: 1,
    sesiones: [sesionVieja, { ...sesionVieja, id: 'otra', fecha: '2026-09-01' }],
    plantillas: [{ id: 'p-mia', nombre: 'Mía', ejercicios: [] }],
    objetivos: [{ id: 'o1', exerciseId: 'press-banca-barra', tipo: 'peso', valor: 60 }],
    planActivo: { planId: 'ppl-estetico', origen: 'preset', desde: '2026-09-20' },
    planesAnteriores: [tramoPreset, tramoPlantilla],
    cuarentena: [{ de: 'sesiones', motivo: 'sin_id', original: { x: 1 }, desde: '2026-09-01' }],
    claveDeOtraVersion: { se: 'conserva' },
  };
  const antes = JSON.stringify(v1);
  const m = migrarFitness(v1);
  ok(JSON.stringify(v1) === antes, 'Trabaja sobre una copia: lo guardado no se toca');
  /* 🔓 Fitness 5/8 — y sigue a la 3 en la misma carga (M1 + M2). */
  ok(m.migrada && !m.error && m.desde === 1 && m.hasta === VERSION_FITNESS && m.fitness.version === VERSION_FITNESS && VERSION_FITNESS === 3, 'Migra de la 1 a la última (1 → 2 → 3) sin errores');
  const f2 = m.fitness;
  ok(JSON.stringify(f2.sesiones) === JSON.stringify(v1.sesiones), 'No toca ni una sesión (ni su fecha, ni su vínculo, ni su fotografía)');
  ok(f2.sesiones.every((s) => !s.diaDePlan || !s.diaDePlan.clase), 'No inventa `clase` ni `fechaPrevista` a lo guardado');
  ok(JSON.stringify(f2.plantillas) === JSON.stringify(v1.plantillas) && JSON.stringify(f2.objetivos) === JSON.stringify(v1.objetivos)
    && JSON.stringify(f2.cuarentena) === JSON.stringify(v1.cuarentena), 'Ni plantillas, ni objetivos, ni la cuarentena');
  ok(f2.claveDeOtraVersion && f2.claveDeOtraVersion.se === 'conserva', 'Conserva una clave que no conoce');
  ok(Array.isArray(f2.rutinas) && f2.predeterminadasRetiradas && Array.isArray(f2.predeterminadasRetiradas.rutinas), 'Añade `rutinas` y `predeterminadasRetiradas` si faltan');
  ok(f2.planActivo.inicioCiclo === '2026-09-14', 'El plan activo de siete días recibe el lunes de su semana como día 1 (§7.6)');
  ok(f2.planesAnteriores[0].dias.filter((d) => !d.descanso).every((d) => d.plantillaId === `${d.id}-plantilla`) && f2.planesAnteriores[0].dias.filter((d) => d.descanso).every((d) => !d.plantillaId),
    'Cada día de entreno de un tramo predeterminado recibe su plantilla; los descansos, ninguna');
  ok(f2.planesAnteriores[1].dias[0].plantillaId === 'p-mia' && f2.planesAnteriores[1].inicioCiclo === '2026-09-02', 'El de una plantilla como plan, esa plantilla y su día 1');
  ok(/^\d{4}-\d{2}-\d{2}$/.test(f2.cumplimientoDesde), '`cumplimientoDesde` = el día de la migración (PD-09)');
  const otra = migrarV1aV2(JSON.parse(JSON.stringify(f2)), { hoy: '2030-01-01' });
  ok(JSON.stringify(otra) === JSON.stringify(f2), 'Idempotente: aplicarla otra vez no cambia nada (ni la fecha de entrada en vigor)');
  ok(!migrarFitness(f2).migrada, 'Y con la versión 2 ya no se vuelve a aplicar');
  ok(validarMigracionV2(v1, f2).length === 0, 'La validación previa y posterior (§14.4) cuadra');
  const rota = { ...f2, sesiones: f2.sesiones.slice(1) };
  ok(validarMigracionV2(v1, rota).some((e) => /sesiones/.test(e)), 'Y se pone roja si se pierde una sesión');
  const ciclo = { ...f2, planActivo: { ...f2.planActivo, inicioCiclo: '2026-09-15' } };
  ok(validarMigracionV2(v1, ciclo).some((e) => /día del ciclo/.test(e)), 'O si cambia el día del ciclo de alguna fecha');
  const lanza = migrarFitness(v1, { migraciones: [{ de: 1, a: 2, migrar: () => { throw new Error('no cuadra'); } }], hasta: 2 });
  ok(!lanza.migrada && lanza.fitness === v1 && /no cuadra/.test(lanza.error), 'Si la migración no valida, se queda lo de antes tal cual, con el motivo');
  const futura = migrarFitness({ ...f2, version: VERSION_FITNESS + 1 });
  ok(futura.futura && !futura.migrada, 'Una versión más nueva no se migra hacia atrás (la guardia de la Fase 3)');
  ok(CLAVE_RESPALDO_V1 === 'fitness_respaldo_v1', 'La copia previa va a `fitness_respaldo_v1` (misma tabla, sin SQL nuevo)');
  const app = leer('src/App.jsx');
  ok(/loadData\(uidUser, CLAVE_RESPALDO_V1, null\)/.test(app) && /if \(!respaldo\)/.test(app) && /migrada: false/.test(app),
    'App: lee la copia, solo la escribe si no existe, y sin copia NO migra');
  ok(app.indexOf('CLAVE_RESPALDO_V1, fit)') > -1 && app.indexOf('CLAVE_RESPALDO_V1, fit)') < app.indexOf("saveData(uidUser, 'fitness', fitnessCargado)"),
    'La copia se escribe ANTES del primer guardado en la versión 2');
  ok(MIGRACIONES_FITNESS[0].de === 1 && MIGRACIONES_FITNESS[0].a === 2 && MIGRACIONES_FITNESS[MIGRACIONES_FITNESS.length - 1].a === VERSION_FITNESS, 'La cadena de versiones cuadra (1 → 2 → … = la del default)');
  const nueva = conEntradaEnVigor(cargar({}), '2026-11-03');
  ok(nueva.cumplimientoDesde === '2026-11-03' && conEntradaEnVigor({ cumplimientoDesde: '2026-01-01' }, '2026-11-03').cumplimientoDesde === '2026-01-01',
    'Una cuenta nueva empieza el seguimiento hoy; una que ya lo tiene no se mueve');
  const viejoMigrado = normalizarFitnessConSesiones(f2);
  ok(estadoDeFecha(viejoMigrado, '2026-09-01', { hoy: '2026-11-03' }).estado === 'sin_seguimiento' && analisisDeCumplimiento(viejoMigrado, { hoy: f2.cumplimientoDesde }).conflicto.size === 0,
    'Lo de antes de la migración no se pinta: sin colores, sin pendientes y sin conflictos (las dos sesiones del 1 de septiembre se conservan)');
}

console.log('\n── Una sola fuente de verdad y arquitectura ──');
{
  const src = leer('src/lib/cumplimientoFitness.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok(!/saveData|supabase|localStorage|from '\.\.\/views|from '\.\.\/components/.test(src), 'El motor no guarda nada ni importa pantallas');
  ok(!/Date\.now\(\)/.test(src.replace(/ahora = Date\.now\(\)/g, '')), 'Ni lee el reloj (salvo el valor por defecto)');
  ok(!/sesiones\s*\.\s*filter\([^)]*fecha\s*>=?\s*addDays\([^)]*-\s*7/.test(src), 'No hay una ventana fija de siete días en la caducidad');
  const capa = (archivo) => (CAPAS_FITNESS.find((c) => c.archivos.includes(archivo)) || {}).id;
  ok(capa('src/lib/cumplimientoFitness.js') === 'motores', 'El motor está en la capa de motores de `CAPAS_FITNESS`');
  ok(capa('src/lib/completarEntrenamiento.js') === 'motores', '«Completar entrenamiento» también');
  ok(capa('src/components/cumplimientoFitness.jsx') === 'componentes', 'Y su componente, en la de componentes');
  ok(DECISIONES_FASE4.map((d) => d.id).join() === 'PD-01,PD-02,PD-08,PD-10,PD-11,PD-12', 'Las decisiones de la fase, escritas con su motivo');
  ok(NO_EN_FASE4.some((x) => /servidor/.test(x.que) && /PD-03/.test(x.porque)), 'Y lo que no se construye, con su motivo: la garantía de servidor necesita el SQL de Josué (PD-03)');
  const vistas = ['src/views/TuPlanView.jsx', 'src/views/HistorialView.jsx', 'src/components/cumplimientoFitness.jsx'];
  ok(vistas.every((v) => !/CADUCA_TRAS\s*=|>=\s*2\s*\)/.test(leer(v))), 'Ninguna pantalla reescribe la regla de los dos entrenamientos');
  ok(ARCHIVOS_FITNESS.includes('src/components/cumplimientoFitness.jsx'), 'El componente nuevo está en `ARCHIVOS_FITNESS`');
}

console.log(`\n${fallos ? `\x1b[31m${fallos} de ${total} fallan\x1b[0m` : `\x1b[32m${total} comprobaciones, todas bien\x1b[0m`}`);
process.exit(fallos ? 1 : 0);
