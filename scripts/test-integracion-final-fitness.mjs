/* ═══════════════════════════════════════════════════════════════════════════
   Fitness 8/8 — la integración de las siete fases, funcionando juntas
   ═══════════════════════════════════════════════════════════════════════════
   Un mismo escenario pasa por todos los motores, con las mismas funciones que
   llaman las pantallas: rutina con descansos, completo, parcial, libre,
   recuperación, caducidad, descansos, progresión en los tres modos, anotaciones,
   estadísticas por periodos, la racha de Fitness y la global (una sola fuente),
   el calendario unificado, sesiones antiguas y el versionado. Fechas escritas:
   pasa igual cualquier día (H-25). */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  estadisticasDeDisciplina, disciplinaDelPeriodo, rachaDeCumplimiento, diasDeActividadDeEntrenamiento,
  ACTIVIDAD_DE_ENTRENAMIENTO, mesDeCumplimiento, semanaDeCumplimiento, lunesDeLaSemana, detalleDeFecha,
  textoDeRegistradas,
} from '../src/lib/disciplinaFitness.js';
import {
  estadoDeFecha, prepararSesionNueva, sesionParaRecuperar, opcionesDeRecuperacion, ventanaDeSieteDias,
} from '../src/lib/cumplimientoFitness.js';
import {
  crearRutinaCiclica, configurarDia, activarRutina, guardarRutinaCiclica, plantillaDisponible,
} from '../src/lib/rutinasCiclicas.js';
import { idPlantillaDeDia } from '../src/lib/planes.js';
import { planActivoCompleto } from '../src/lib/tuPlan.js';
import { planARutina } from '../src/lib/constructor.js';
import { normalizarFitnessConSesiones, empezarSesion, guardarSesion, ejerciciosDeSesion } from '../src/lib/entrenamiento.js';
import { completarEntrenamiento } from '../src/lib/completarEntrenamiento.js';
import { conPropuestas, ejecucionesDeLinea, plantillaDeSesion } from '../src/lib/progresion.js';
import { anotacionesDeEjercicio } from '../src/lib/anotacionesFitness.js';
import { sesionesDelHistorial, fichaDeHistorial, consultarHistorial, FILTROS_POR_DEFECTO } from '../src/lib/historial.js';
import { detalleCompletoDeEjercicio } from '../src/lib/detalleEjercicio.js';
import { migrarFitness, VERSION_FITNESS, apartarLoQueNoCarga } from '../src/lib/persistenciaFitness.js';
import { repeticionValida } from '../src/lib/numerosFitness.js';
import { CLASES_REGLA, rachaActual } from '../src/lib/rachas.js';
import {
  crearRacha, completarDia, panelRachas, proyectarRachasDeEntrenamiento, normalizarEstado,
} from '../src/lib/rachasServicio.js';
import { rachaDeFitness } from '../src/lib/fitness.js';
import { mantenimientoHoy } from '../src/lib/rachasHoy.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg}`);
}

/* ── El escenario ───────────────────────────────────────────────────────── */
const cargar = (f) => normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f)));
const L = '2026-10-05'; // lunes, día 1 del ciclo
const PUSH = idPlantillaDeDia('ppl-estetico-dia-1');
const PULL = idPlantillaDeDia('ppl-estetico-dia-2');
const PLANTILLA = { P: PUSH, L: PULL };
function escenario(patron, { desde = L } = {}) {
  let r = crearRutinaCiclica({ nombre: `Rutina ${patron}`, duracion: patron.length });
  patron.split('').forEach((c, i) => {
    r = configurarDia(r, r.dias[i].id, c === 'D' ? { tipo: 'descanso' } : { tipo: 'entreno', plantillaId: PLANTILLA[c] });
  });
  const g = guardarRutinaCiclica(cargar({}), r);
  if (!g.ok) throw new Error(g.motivo);
  const a = activarRutina(g.fitness, g.rutina.id, { hoy: desde, confirmado: true });
  if (!a.ok) throw new Error(a.motivo);
  return { ...a.fitness, cumplimientoDesde: desde };
}
let reloj = 1_700_000_000_000;
function terminar(s, { grado = 'completa', reps = 8, nota = '' } = {}) {
  reloj += 60_000;
  let n = 0;
  const ejercicios = s.origen.ejercicios.map((e, i) => ({
    ...e,
    notas: i === 0 && nota ? nota : e.notas,
    series: e.series.map((x) => {
      n += 1;
      const hecha = grado === 'completa' || (grado === 'parcial' && n === 1);
      return hecha ? { ...x, estado: 'hecha', hecho: { reps, duracion: null, peso: 20 } } : x;
    }),
  }));
  return { ...s, origen: { ...s.origen, ejercicios }, estado: 'completada', iniciadaEn: reloj - 3_600_000, terminadaEn: reloj, guardadaEn: reloj };
}
function empezar(f, fecha, { plantilla = 'P', recuperar = null, deDia = true } = {}) {
  let s;
  if (recuperar) s = sesionParaRecuperar(f, recuperar, { hoy: fecha, ahora: reloj });
  else {
    const pl = plantillaDisponible(f, PLANTILLA[plantilla] || plantilla);
    const rutina = planARutina(pl);
    const resuelto = planActivoCompleto(f);
    const dia = deDia && resuelto && resuelto.plan ? resuelto.plan.dias.find((d) => d.plantillaId === pl.id) : null;
    s = empezarSesion({
      nombre: pl.nombre, lineas: rutina.lineas, ahora: reloj, hoy: fecha,
      planId: dia ? resuelto.activo.planId : pl.id, origenTipo: dia ? resuelto.origen : 'plantilla', origenId: dia ? dia.id : pl.id,
    });
  }
  return prepararSesionNueva(f, s, { hoy: fecha, recuperar });
}
function entrenar(f, fecha, opciones = {}) {
  const r = empezar(f, fecha, opciones);
  if (!r.ok) throw new Error(`No se puede entrenar el ${fecha}: ${r.motivo}`);
  return guardarSesion(f, terminar(r.sesion, opciones));
}
const pendienteDe = (f, fecha, hoy) => opcionesDeRecuperacion(f, { hoy }).recuperables.find((p) => p.fecha === fecha);
/* Las dos rachas como las ve la pantalla Rachas: una de entrenamiento y otra de sueño. */
function rachasConDos() {
  let e = normalizarEstado({});
  e = crearRacha(e, { tipo: 'training', nombre: 'Entrenar' }, '2026-09-01').estado;
  e = crearRacha(e, { tipo: 'sleep', nombre: 'Dormir' }, '2026-09-01').estado;
  const sueno = e.definiciones.find((r) => r.tipo === 'sleep');
  const entreno = e.definiciones.find((r) => r.tipo === 'training');
  for (const d of ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']) e = completarDia(e, { rachaId: sueno.id, fecha: d }).estado;
  /* Una marca a mano de entrenamiento: se conserva guardada, pero con seguimiento no cuenta. */
  e = completarDia(e, { rachaId: entreno.id, fecha: '2026-10-06' }).estado;
  return { e, sueno, entreno };
}
const rachaGlobalDeEntreno = (estado, fitness, hoy) => {
  const proy = proyectarRachasDeEntrenamiento(estado, diasDeActividadDeEntrenamiento(fitness, { hoy }));
  return panelRachas(proy, hoy).rachas.find((r) => r.tipo === 'training');
};

/* La semana: L Push · M Pull (perdido y recuperado el X, que era descanso) · X descanso
   sacrificado · J Push parcial · V Pull · S descanso respetado · D Push. */
let f = escenario('PLD');
f = entrenar(f, '2026-10-05', { plantilla: 'P', reps: 8, nota: 'Codos cerrados' });
const recupera = pendienteDe(f, '2026-10-06', '2026-10-07');
f = entrenar(f, '2026-10-07', { recuperar: recupera });
f = entrenar(f, '2026-10-08', { plantilla: 'P', grado: 'parcial', reps: 9 });
f = entrenar(f, '2026-10-09', { plantilla: 'L' });
f = entrenar(f, '2026-10-11', { plantilla: 'P', reps: 10 });
const HOY = '2026-10-12';
const est = (fecha) => estadoDeFecha(f, fecha, { hoy: HOY }).estado;

console.log('\n── 1-8 · Rutina, completo, parcial, libre, recuperación, caducidad y descansos ──');
ok(est('2026-10-05') === 'cumplido' && est('2026-10-08') === 'parcial' && est('2026-10-09') === 'cumplido', '1-3 · Rutina con descansos: completo y parcial donde tocaban');
ok(est('2026-10-06') === 'recuperado' && est('2026-10-07') === 'descanso_sacrificado', '5 y 8 · El martes recuperado el miércoles, que era descanso: sacrificado');
ok(est('2026-10-10') === 'descanso_respetado', '7 · El sábado de descanso, respetado');
let lib = escenario('PLD');
lib = entrenar(lib, '2026-10-05', { plantilla: 'P' });
lib = entrenar(lib, '2026-10-07', { plantilla: 'P', deDia: false });
ok(estadoDeFecha(lib, '2026-10-07', { hoy: '2026-10-08' }).estado === 'descanso_sacrificado'
  && sesionesDelHistorial(lib).find((s) => s.fecha === '2026-10-07').diaDePlan.clase === 'libre', '4 · Una libre en un descanso: el día, sacrificado; la sesión sigue siendo libre (no se convierte en prevista)');
let cad = escenario('PLD');
cad = entrenar(cad, '2026-10-05', { plantilla: 'P' });
cad = entrenar(cad, '2026-10-08', { plantilla: 'P' });
ok(estadoDeFecha(cad, '2026-10-06', { hoy: '2026-10-08' }).estado === 'pendiente', '6 · Con un entrenamiento posterior, el martes sigue pendiente');
cad = entrenar(cad, '2026-10-09', { plantilla: 'L' });
ok(estadoDeFecha(cad, '2026-10-06', { hoy: '2026-10-09' }).estado === 'perdido', '6 · Con dos, caduca: perdido (D-02); los descansos de en medio no cuentan para caducar');
ok(!prepararSesionNueva(f, empezarSesion({ nombre: 'Otra', lineas: planARutina(plantillaDisponible(f, PUSH)).lineas, ahora: reloj, hoy: '2026-10-11', planId: PUSH, origenTipo: 'plantilla', origenId: PUSH }), { hoy: '2026-10-11' }).ok,
  'Una sesión por fecha: el domingo ya tiene la suya y no se empieza otra');

console.log('\n── 9 · Progresión en los tres modos, por plantilla y línea ──');
const nueva = empezar(f, HOY, { plantilla: 'L' });
ok(nueva.ok, '(se empieza el Pull de hoy)');
const sManual = conPropuestas(f, nueva.sesion, { modo: 'manual' });
const sProg = conPropuestas(f, nueva.sesion, { modo: 'progresivo' });
const sExp = conPropuestas(f, nueva.sesion, { modo: 'experto' });
const props = (s) => ejerciciosDeSesion(s).flatMap((e) => e.series.map((x) => x.plan && x.plan.propuesta)).filter(Boolean);
ok(props(sManual).length === 0 && props(sProg).length > 0 && props(sExp).length > 0, '🚨 Manual no propone; Progresivo y Experto, sí (sobre el Pull del viernes, la misma plantilla)');
ok(ejerciciosDeSesion(sExp).every((e) => e.series.every((x) => x.estado === 'pendiente' && (!x.hecho || x.hecho.reps == null))), '🚨 Proponer nunca escribe lo hecho');
ok(props(sExp).every((p) => repeticionValida(p.reps) || p.reps == null), 'Las propuestas son enteras o de media en media');
ok(!repeticionValida(8.2) && repeticionValida(8.5) && repeticionValida(8), '8,2 se rechaza; 8 y 8,5 valen');
let conCompletar = escenario('PLD');
const op = { clave: 'x', nombre: 'Push', planId: conCompletar.planActivo.planId, origenTipo: 'rutina', origenId: planActivoCompleto(conCompletar).plan.dias[0].id, lineas: planARutina(plantillaDisponible(conCompletar, PUSH)).lineas, entorno: '' };
const cc = completarEntrenamiento(conCompletar, { opcion: op, fecha: L, hoy: L, ahora: reloj });
conCompletar = guardarSesion(conCompletar, cc.sesion);
const sigComp = empezar(conCompletar, '2026-10-08', { plantilla: 'P' });
const ejC = ejerciciosDeSesion(sigComp.sesion)[0];
ok(cc.ok && ejecucionesDeLinea(conCompletar, { plantillaId: plantillaDeSesion(sigComp.sesion, conCompletar), ej: ejC, antesDe: sigComp.sesion.id }).length === 0,
  '🚨 Una sesión de «Completar entrenamiento» no sirve de referencia de progresión (no tiene resultados)');

console.log('\n── 10 · Anotaciones en la sesión y en el historial ──');
const jueves = sesionesDelHistorial(f).find((s) => s.fecha === '2026-10-08');
const an = anotacionesDeEjercicio(f, jueves, ejerciciosDeSesion(jueves)[0]);
ok(an.anterior && an.anterior.texto === 'Codos cerrados' && an.anterior.fecha === '2026-10-05', '🚨 La nota del lunes es la «nota anterior» del jueves (misma plantilla y línea)');
ok(ejerciciosDeSesion(jueves)[0].notas === '' || ejerciciosDeSesion(jueves)[0].notas == null, 'La nota del jueves empezó vacía');

console.log('\n── 11 · Estadísticas con distintos periodos (fórmula aprobada) ──');
const e7 = disciplinaDelPeriodo(f, 'siete', { hoy: HOY }).estadisticas;
ok(e7.completos === 2 && e7.recuperados === 1 && e7.parciales === 1 && e7.descansosRespetados === 1 && e7.descansosSacrificados === 1, 'Los indicadores de los últimos 7 días');
ok(e7.cumplidos === 2 + 1 + 1 + 0.5 && e7.evaluados === 6 && e7.porcentaje === Math.round((100 * 4.5) / 6), '🚨 Cumplidos = completos + recuperados + respetados + ½ parciales; ÷ evaluados');
const e30 = disciplinaDelPeriodo(f, 'treinta', { hoy: HOY }).estadisticas;
ok(e30.evaluados === e7.evaluados + 1 && e30.completos === 3 && e30.sinSeguimiento === 22, '30 días: entra también el lunes 5 (cumplido); lo de antes de la rutina, sin seguimiento y fuera del denominador');
const recuperadas = sesionesDelHistorial(f).filter((s) => s.diaDePlan && s.diaDePlan.clase === 'recuperacion').length;
ok(recuperadas === 1 && e7.recuperados === 1, '🚨 La recuperación cuenta una vez, en su fecha prevista');
const eMes = disciplinaDelPeriodo(f, 'mes_actual', { hoy: HOY }).estadisticas;
ok(eMes.completos === e30.completos && eMes.porcentaje === e30.porcentaje && eMes.evaluados === e30.evaluados, 'Este mes (del 1 a hoy) dice lo mismo que los 30 días: todo pasó dentro de los dos');

console.log('\n── 12 · La racha de Fitness y la global: una sola fuente ──');
const rf = rachaDeCumplimiento(f, { hoy: HOY });
const { e: rachasE, sueno, entreno } = rachasConDos();
const rg = rachaGlobalDeEntreno(rachasE, f, HOY);
ok(rf.actual === 4 && rf.mejor === 4, `La racha de Fitness: parcial, cumplido, descanso respetado y cumplido = 4 (${rf.actual}/${rf.mejor})`);
ok(rg && rg.actual === rf.actual && rg.record === rf.mejor, `🚨 La racha global de entrenamiento dice lo mismo: ${rg && rg.actual} y ${rg && rg.record}`);
ok(rg.derivada && rg.regla === 'Según tu rutina de Fitness', '…y se presenta como «Según tu rutina de Fitness» (no se marca a mano)');
const suenoAntes = panelRachas(rachasE, HOY).rachas.find((r) => r.id === sueno.id);
const suenoDespues = panelRachas(proyectarRachasDeEntrenamiento(rachasE, diasDeActividadDeEntrenamiento(f, { hoy: HOY })), HOY).rachas.find((r) => r.id === sueno.id);
ok(JSON.stringify(suenoAntes) === JSON.stringify(suenoDespues), '🚨 La racha de sueño no cambia ni un campo');
ok(rachasE.eventos.some((x) => x.rachaId === entreno.id && x.fecha === '2026-10-06') && !proyectarRachasDeEntrenamiento(rachasE, diasDeActividadDeEntrenamiento(f, { hoy: HOY })).eventos.some((x) => x.rachaId === entreno.id && x.origen !== 'fitness'),
  '🚨 La marca a mano de entrenamiento se conserva guardada, pero con seguimiento no cuenta (los días los decide Fitness)');
ok(JSON.stringify(proyectarRachasDeEntrenamiento(rachasE, diasDeActividadDeEntrenamiento(cargar({}), { hoy: HOY }))) === JSON.stringify(normalizarEstado(rachasE)),
  '🚨 Sin seguimiento en Fitness, las rachas quedan exactamente como estaban (la de entrenamiento, a mano)');
/* Igualdad en muchos días y patrones: neutros, pendientes, hoy de descanso y de entreno. */
let iguales = 0;
let casos = 0;
const patrones = [
  { patron: 'PLD', dias: { '2026-10-05': 'P', '2026-10-06': 'L', '2026-10-08': 'P', '2026-10-09': 'L', '2026-10-11': 'P' } },
  { patron: 'PLD', dias: { '2026-10-05': 'P', '2026-10-08': 'P' } },
  { patron: 'PD', dias: { '2026-10-05': 'P', '2026-10-07': 'P', '2026-10-08': 'P', '2026-10-11': 'P' } },
  { patron: 'PPLD', dias: { '2026-10-06': 'P', '2026-10-07': 'L' } },
  { patron: 'P', dias: { '2026-10-05': 'P', '2026-10-06': 'P', '2026-10-07': 'P' } },
];
for (const { patron, dias } of patrones) {
  for (let k = 0; k < 10; k += 1) {
    const hoy = `2026-10-${String(5 + k).padStart(2, '0')}`;
    let g = escenario(patron);
    for (const [fecha, pl] of Object.entries(dias)) {
      if (fecha > hoy) continue;
      const r = empezar(g, fecha, { plantilla: pl, deDia: true });
      if (r.ok) g = guardarSesion(g, terminar(r.sesion));
    }
    const a = rachaDeCumplimiento(g, { hoy });
    const b = rachaGlobalDeEntreno(rachasE, g, hoy);
    casos += 1;
    if (b && a.actual === b.actual && a.mejor === b.record) iguales += 1;
    else console.log(`    · ${patron} hoy ${hoy}: Fitness ${JSON.stringify(a)} · global ${b && b.actual}/${b && b.record}`);
  }
}
ok(iguales === casos, `🚨 En ${casos} días y patrones, la racha de Fitness y la global son idénticas (${iguales}/${casos})`);
const hoyDescanso = rachaGlobalDeEntreno(rachasE, f, '2026-10-10');
ok(hoyDescanso && hoyDescanso.estadoHoy !== 'pendiente', 'Hoy, día de descanso: la racha global no pide nada (no sale «por mantener hoy»)');
const proyHoyEntreno = proyectarRachasDeEntrenamiento(rachasE, diasDeActividadDeEntrenamiento(f, { hoy: HOY }));
const mh = mantenimientoHoy(proyHoyEntreno, [], HOY);
ok(mh && mh.nombresPendientes.includes('Entrenar'), 'Hoy toca entrenar y aún no: la racha de entrenamiento sale como pendiente de hoy');
ok(rachaDeFitness(proyHoyEntreno, HOY).dias === rf.actual, '🚨 La cabecera de Fitness (rachaDeFitness) lee la misma cifra');
ok(ACTIVIDAD_DE_ENTRENAMIENTO.parcial === 'suma' && ACTIVIDAD_DE_ENTRENAMIENTO.descanso_respetado === 'suma'
  && ACTIVIDAD_DE_ENTRENAMIENTO.descanso_sacrificado === 'corta' && ACTIVIDAD_DE_ENTRENAMIENTO.perdido === 'corta'
  && ACTIVIDAD_DE_ENTRENAMIENTO.pendiente === 'neutro' && !('sin_seguimiento' in ACTIVIDAD_DE_ENTRENAMIENTO), 'Las reglas aprobadas, escritas en un solo sitio');
ok(CLASES_REGLA.segun_fitness && CLASES_REGLA.segun_fitness.interna && /filter\(\(c\) => !c\.interna\)/.test(leer('src/views/RachasView.jsx')), 'La regla «Según tu rutina de Fitness» no se ofrece al crear una racha');
ok(!/proyectarRachasDeEntrenamiento\([^)]*\)[^;]*saveData|saveData\([^)]*rachasVistas/.test(leer('src/App.jsx')) && /snapshotAndSave\(\{ rachas: nuevo \}\)/.test(leer('src/App.jsx')),
  '🚨 La proyección nunca se guarda: las escrituras van sobre el estado de verdad');

console.log('\n── 13 · El calendario unificado ──');
const mes = mesDeCumplimiento(f, '2026-10', { hoy: HOY });
ok(mes.celdas.filter(Boolean).every((c) => c.estado === estadoDeFecha(f, c.fecha, { hoy: HOY }).estado), '🚨 Cada día del mes es el estado del motor');
const sem = semanaDeCumplimiento(f, '2026-10-08', { hoy: HOY });
ok(sem.lunes === '2026-10-05' && sem.celdas.length === 7 && sem.celdas.every((c, i) => c.estado === mes.celdas.filter(Boolean)[4 + i].estado), 'La semana (de lunes a domingo) dice lo mismo que el mes');
ok(lunesDeLaSemana('2026-10-11') === '2026-10-05' && lunesDeLaSemana('2027-01-01') === '2026-12-28', 'El lunes de una semana, también cruzando el año');
const ven = ventanaDeSieteDias(f, { hoy: HOY });
ok(ven.every((d) => d.estado === estadoDeFecha(f, d.fecha, { hoy: HOY }).estado), 'La ventana de Tu Plan, el mes y la semana no se contradicen');
const antiguo = cargar({ sesiones: [{ id: 'v1', nombre: 'Push viejo', fecha: '2026-09-02', estado: 'completada', iniciadaEn: 1, terminadaEn: 2, origen: { tipo: 'plantilla', id: null, ejercicios: [] } }] });
const mesViejo = mesDeCumplimiento(antiguo, '2026-09', { hoy: HOY });
const c2 = mesViejo.celdas.find((c) => c && c.fecha === '2026-09-02');
ok(c2.estado === 'sin_seguimiento' && c2.sesiones.length === 1 && textoDeRegistradas(c2.sesiones) === 'entrenamiento Push viejo',
  '🚨 Lo que daba el calendario de Progreso no se pierde: un entrenamiento antiguo sale registrado, sin inventarle cumplimiento');
const dos = mesDeCumplimiento(f, '2026-10', { hoy: HOY }).celdas.find((c) => c && c.fecha === '2026-10-07');
ok(dos.recuperaDe.includes('2026-10-06') && dos.sesiones.length === 1, 'El día de la recuperación dice qué recuperó');
const det = detalleDeFecha(f, '2026-10-06', { hoy: HOY });
ok(det.cumplidaPor && det.cumplidaPor.fecha === '2026-10-07' && det.sesiones.length === 0, 'El detalle del día recuperado lleva a la sesión que lo recuperó');

console.log('\n── 14 · La navegación entre Historial y Progreso ──');
const COMP_ACT = leer('src/components/actividadEntrenamiento.jsx');
ok(/aria-label="Ver el calendario de cumplimiento"/.test(COMP_ACT) && /onClick=\{onVerHistorial\}/.test(COMP_ACT), 'Progreso → «Ver el calendario» lleva al Historial');
ok(/onVerHistorial=\{onIrAHistorial\}/.test(leer('src/components/resumenProgreso.jsx')) && /volverA: \{ area: 'progreso', texto: 'Progreso' \}/.test(leer('src/views/FitnessView.jsx')),
  '…y desde ahí «Volver a Progreso» (la puerta está cableada en los dos lados)');
ok(/onVerSesion=\{setAbierta\}/.test(leer('src/views/HistorialView.jsx')), 'Un día del calendario abre su sesión en el mismo Historial (y al volver sigue el día)');
ok(!/<TrainingActivityCalendar|export function TrainingActivity(Calendar|Day)\b|mesDeActividad\(/.test(COMP_ACT), '🚨 No hay un segundo calendario en Progreso');

console.log('\n── 15 · Sesiones antiguas y datos incompletos ──');
const raras = cargar({ sesiones: [
  { id: 'sin-fecha', nombre: 'Sin fecha', estado: 'completada', origen: { tipo: 'plantilla', id: null, ejercicios: [] } },
  { id: 'en-curso', nombre: 'Viva', fecha: '2026-10-12', estado: 'en_curso', iniciadaEn: 1, origen: { tipo: 'plantilla', id: null, ejercicios: [] } },
] });
ok(!mesDeCumplimiento(raras, '2026-10', { hoy: HOY }).celdas.some((c) => c && c.sesiones.length), 'Una sin fecha y una en curso no caen en ningún día del calendario');
const fichas = sesionesDelHistorial(f).map((s) => fichaDeHistorial(s, { fitness: f, hoy: HOY }));
ok(consultarHistorial(fichas, FILTROS_POR_DEFECTO, { hoy: HOY }).fichas.length === sesionesDelHistorial(f).length, 'El historial enseña todas las completadas');
const dObj = detalleCompletoDeEjercicio(f, 'press-banca-barra', { hoy: HOY, rango: 'todo' });
ok(!dObj.error && dObj.veces >= 3, 'La evolución del press de banca, con sus ejecuciones');

console.log('\n── 16 · Protección de datos y versionado ──');
ok(VERSION_FITNESS === 3, 'La versión de Fitness es la 3');
const futura = migrarFitness({ version: 99, sesiones: [] });
ok(futura.futura && !futura.migrada, '🚨 Datos de una versión más nueva: no se migran (la aplicación los abre en solo lectura)');
const v1 = migrarFitness({ version: 1, sesiones: [{ id: 'a', fecha: '2026-01-01', estado: 'completada', origen: { ejercicios: [] } }], campoNuevo: { x: 1 } });
ok(v1.migrada && v1.fitness.version === 3 && v1.fitness.campoNuevo && v1.fitness.campoNuevo.x === 1, '🚨 Una cuenta v1 sube a la v3 conservando un campo que no conoce');
const cuar = apartarLoQueNoCarga({ sesiones: [{ nombre: 'sin id', estado: 'completada' }] }, cargar({ sesiones: [{ nombre: 'sin id', estado: 'completada' }] }));
ok(cuar.fitness.cuarentena.length >= 1, 'Lo que la carga no entiende se aparta en la cuarentena, nunca se tira');
const sesionesAntes = JSON.stringify(f.sesiones);
disciplinaDelPeriodo(f, 'treinta', { hoy: HOY }); mesDeCumplimiento(f, '2026-10', { hoy: HOY }); proyectarRachasDeEntrenamiento(rachasE, diasDeActividadDeEntrenamiento(f, { hoy: HOY }));
ok(JSON.stringify(f.sesiones) === sesionesAntes, '🚨 Ni la disciplina, ni el calendario, ni la racha escriben en las sesiones');

console.log(`\n${fallos ? '✗' : '✓'} ${total - fallos}/${total} comprobaciones`);
process.exit(fallos ? 1 : 0);
