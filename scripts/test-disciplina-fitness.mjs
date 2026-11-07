/* ═══════════════════════════════════════════════════════════════════════════
   Fitness 7/8 — historial, calendario de cumplimiento y estadísticas (prompt 7 §14)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Todas las fechas se escriben: pasan igual cualquier día (la lección de H-25). */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  rangoDePeriodo, fechasDelRango, estadisticasDeDisciplina, disciplinaDelPeriodo, textoDeRegularidad,
  rachaDeCumplimiento, mesDeCumplimiento, moverMes, mesDe, detalleDeFecha, PERIODOS_DISCIPLINA,
  PERIODO_DISCIPLINA_POR_DEFECTO, FORMULA_CUMPLIMIENTO, DECISIONES_FASE7, NOMBRE_CLASE,
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
import { normalizarFitnessConSesiones, empezarSesion, guardarSesion } from '../src/lib/entrenamiento.js';
import { completarEntrenamiento } from '../src/lib/completarEntrenamiento.js';
import {
  fichaDeHistorial, consultarHistorial, FILTROS_POR_DEFECTO, opcionesDePlantilla, sesionesDelHistorial,
} from '../src/lib/historial.js';
import {
  detalleCompletoDeEjercicio, plantillasDelEjercicio, evolucionPorSerie, TODAS_LAS_PLANTILLAS,
  MAX_FILAS_EVOLUCION, MAX_SERIES_EVOLUCION,
} from '../src/lib/detalleEjercicio.js';
import { aparicionesDeEjercicio } from '../src/lib/progresion.js';

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

/* ── Escenario (el de la Fase 4) ───────────────────────────────────────── */
const cargar = (f) => normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f)));
const sumar = (fecha, n) => { const d = new Date(`${fecha}T12:00:00`); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE'); };
/* El lunes 5 de octubre de 2026, día 1 del ciclo. */
const L = '2026-10-05';
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
const pendienteDe = (f, fecha, hoy) => opcionesDeRecuperacion(f, { hoy }).recuperables.find((p) => p.fecha === fecha);

console.log('\n── 1 · Los periodos (§9): fechas naturales, límites y cambios de mes y de año ──');
const H = '2026-11-06';
ok(JSON.stringify(rangoDePeriodo('siete', H)) === JSON.stringify({ desde: '2026-10-31', hasta: H, completo: false, vacio: false }), 'Últimos 7 días: hoy y los seis anteriores (31/10 → 6/11), ventana MÓVIL que cruza el mes');
ok(fechasDelRango('2026-10-31', H).length === 7, '…siete fechas, con los dos extremos');
ok(rangoDePeriodo('treinta', H).desde === '2026-10-08' && fechasDelRango(rangoDePeriodo('treinta', H).desde, H).length === 30, 'Últimos 30 días: treinta fechas exactas');
ok(rangoDePeriodo('mes_actual', H).desde === '2026-11-01' && rangoDePeriodo('mes_actual', H).hasta === H, 'Este mes: del día 1 hasta HOY (los futuros no se evalúan)');
ok(JSON.stringify(rangoDePeriodo('mes_anterior', H)) === JSON.stringify({ desde: '2026-10-01', hasta: '2026-10-31', completo: true, vacio: false }), 'Mes anterior: octubre entero (31 días)');
ok(rangoDePeriodo('mes_anterior', '2026-01-15').desde === '2025-12-01' && rangoDePeriodo('mes_anterior', '2026-01-15').hasta === '2025-12-31', '…y en enero, diciembre del año anterior');
ok(rangoDePeriodo('mes_anterior', '2028-03-10').hasta === '2028-02-29' && rangoDePeriodo('mes_anterior', '2027-03-10').hasta === '2027-02-28', '…con febrero bisiesto y no bisiesto');
ok(rangoDePeriodo('siete', '2027-01-03').desde === '2026-12-28', 'Los 7 días cruzan el año');
const pers = rangoDePeriodo('personalizado', H, { desde: '2026-11-20', hasta: '2026-10-25' });
ok(pers.desde === '2026-10-25' && pers.hasta === H, 'Personalizado: si van al revés se entiende, y nunca pasa de hoy');
ok(rangoDePeriodo('personalizado', H, { desde: 'x', hasta: H }) === null && rangoDePeriodo('raro', H) === null, '…una fecha que no lo es: sin periodo (no se inventa uno)');
ok(rangoDePeriodo('personalizado', H, { desde: '2026-12-01', hasta: '2026-12-31' }).vacio === true, '…y uno entero en el futuro, vacío');
ok(fechasDelRango('2026-03-28', '2026-03-30').join() === '2026-03-28,2026-03-29,2026-03-30', 'El cambio de hora (29/3 en España) no salta ni repite un día: fechas en local');
ok(PERIODOS_DISCIPLINA.map((p) => p.id).join() === 'siete,treinta,mes_actual,mes_anterior,personalizado' && PERIODO_DISCIPLINA_POR_DEFECTO === 'treinta', 'Los cinco periodos del prompt');

console.log('\n── 2 · Estados y recuentos, con el motor de la Fase 4 (§4 y §8) ──');
/* Push · Pull · Descanso desde el lunes 5/10. L Push hecho; M Pull no; X (descanso)
   se recupera el Pull del martes (sacrificado); J Push parcial; V Pull hecho; S
   descanso respetado; D Push hecho. Hoy = lunes 12/10 (Pull). */
let f = escenario('PLD');
f = entrenar(f, '2026-10-05', { plantilla: 'P' });
const pM = pendienteDe(f, '2026-10-06', '2026-10-07');
ok(!!pM, '(escenario: el Pull del martes es recuperable el miércoles)');
f = entrenar(f, '2026-10-07', { recuperar: pM });
f = entrenar(f, '2026-10-08', { plantilla: 'P', grado: 'parcial' });
f = entrenar(f, '2026-10-09', { plantilla: 'L' });
f = entrenar(f, '2026-10-11', { plantilla: 'P' });
const HOY1 = '2026-10-12';
const est = estadisticasDeDisciplina(f, { desde: L, hasta: HOY1, hoy: HOY1 });
const estados = fechasDelRango(L, HOY1).map((d) => estadoDeFecha(f, d, { hoy: HOY1 }).estado);
ok(estados.join() === 'cumplido,recuperado,descanso_sacrificado,parcial,cumplido,descanso_respetado,cumplido,hoy', `(los estados del motor: ${estados.join(' · ')})`);
ok(est.completos === 3 && est.recuperados === 1 && est.parciales === 1 && est.descansosRespetados === 1 && est.descansosSacrificados === 1, '🚨 Cada fecha cuenta una vez, con su estado: 3 completos, 1 recuperado, 1 parcial, 1 descanso respetado y 1 sacrificado');
ok(est.previstos === 5, '🚨 Previstos: los cinco días de entreno ya pasados (hoy, sin hacer, no cuenta)');
ok(est.evaluados === 7 && est.cumplidos === 5.5 && est.porcentaje === 79, `🚨 Fórmula: (3 + 1 + 1 + ½) ÷ 7 = 79 % — ${est.porcentaje} %`);
ok(est.recuperados + est.completos === 4 && est.libres === 0, '🚨 La recuperación del miércoles no cuenta dos veces: el martes queda «recuperado» y el miércoles, «descanso sacrificado» (nunca un segundo completo)');
ok(est.dias === 8, '…en 8 días con hoy (que no se evalúa)');
const conHoy = entrenar(f, HOY1, { plantilla: 'L' });
ok(estadisticasDeDisciplina(conHoy, { desde: L, hasta: HOY1, hoy: HOY1 }).completos === 4, 'Hoy, hecho: entonces sí cuenta');
ok(estadisticasDeDisciplina(f, { desde: L, hasta: '2026-10-20', hoy: HOY1 }).dias === 8, '🚨 Los días futuros no entran en los denominadores');
ok(FORMULA_CUMPLIMIENTO.includes('mitad de los parciales') && /no cuentan/.test(FORMULA_CUMPLIMIENTO), 'La fórmula está escrita');
ok(textoDeRegularidad(est) === '5,5 de 7 días evaluados cumplidos.', 'Regularidad en palabras, sin juicio');

console.log('\n── 3 · Pendientes, perdidos (D-02), libres y «Completar» (D-03) ──');
let g = escenario('PLD');
g = entrenar(g, '2026-10-05', { plantilla: 'P' });
/* El martes no; el jueves y el viernes sí (dos posteriores): el martes caduca. */
g = entrenar(g, '2026-10-08', { plantilla: 'P' });
ok(estadoDeFecha(g, '2026-10-06', { hoy: '2026-10-08' }).estado === 'pendiente', '(un entrenamiento después: el martes, aún pendiente)');
const e1 = estadisticasDeDisciplina(g, { desde: L, hasta: '2026-10-08', hoy: '2026-10-08' });
ok(e1.pendientes === 1 && e1.perdidos === 0 && e1.evaluados === 3, '🚨 Un pendiente (aún recuperable) no entra en el denominador');
g = entrenar(g, '2026-10-09', { plantilla: 'L' });
const e2 = estadisticasDeDisciplina(g, { desde: L, hasta: '2026-10-09', hoy: '2026-10-09' });
ok(estadoDeFecha(g, '2026-10-06', { hoy: '2026-10-09' }).estado === 'perdido' && e2.perdidos === 1 && e2.pendientes === 0, '🚨 Con dos entrenamientos después caduca: cuenta como perdido (D-02)');
let lib = escenario('PLD');
lib = entrenar(lib, '2026-10-05', { plantilla: 'P' });
lib = entrenar(lib, '2026-10-07', { plantilla: 'P', deDia: false });
const eL = estadisticasDeDisciplina(lib, { desde: L, hasta: '2026-10-07', hoy: '2026-10-07' });
ok(eL.libres === 1 && eL.descansosSacrificados === 1 && eL.completos === 1, '🚨 Una sesión libre en un descanso: se cuenta como libre y el día, como sacrificado; nunca como un entrenamiento planificado');
let comp = escenario('PLD');
const opcion = { clave: 'x', nombre: 'Push', planId: comp.planActivo.planId, origenTipo: 'rutina', origenId: planActivoCompleto(comp).plan.dias[0].id, lineas: planARutina(plantillaDisponible(comp, PUSH)).lineas, entorno: '' };
const c = completarEntrenamiento(comp, { opcion, fecha: L, hoy: L, ahora: reloj });
comp = guardarSesion(comp, c.sesion);
const eC = estadisticasDeDisciplina(comp, { desde: L, hasta: L, hoy: L });
ok(c.ok && eC.completos === 1 && eC.porcentaje === 100, '🚨 «Completar entrenamiento» cuenta como completo (D-03)');

console.log('\n── 4 · Días sin datos y sesiones de antes del sistema (PD-09) ──');
const sinNada = estadisticasDeDisciplina(cargar({}), { desde: L, hasta: '2026-10-11', hoy: '2026-10-11' });
ok(sinNada.evaluados === 0 && sinNada.porcentaje === null && sinNada.sinSeguimiento === 7, '🚨 Sin rutina: nada evaluado y el porcentaje es null, nunca 0 %');
const antes = { ...f, cumplimientoDesde: '2026-10-09' };
const eA = estadisticasDeDisciplina(antes, { desde: L, hasta: HOY1, hoy: HOY1 });
ok(eA.sinSeguimiento === 4 && estadoDeFecha(antes, '2026-10-06', { hoy: HOY1 }).estado === 'sin_seguimiento', '🚨 Antes de la entrada en vigor: «sin seguimiento», sin estados inventados');
ok(eA.evaluados === 3 && eA.perdidos === 0, '…y no cuentan en el denominador');
/* 🔓 Fitness 8/8 — PD-06 pasó de provisional a definitiva (Josué, 2026-11-06): se da la vuelta, no se borra. */
ok(DECISIONES_FASE7.find((d) => d.id === 'PD-09') && /definitiva/.test(DECISIONES_FASE7.find((d) => d.id === 'PD-06').estado) && !/provisional/.test(DECISIONES_FASE7.find((d) => d.id === 'PD-06').estado), 'PD-09 aplicada y PD-06 definitiva, declaradas');

console.log('\n── 5 · La racha de cumplimiento (§10, PD-06) ──');
ok(JSON.stringify(rachaDeCumplimiento(f, { hoy: HOY1 })) === JSON.stringify({ actual: 4, mejor: 4 }), `🚨 Jueves a domingo, con el descanso respetado del sábado dentro (4); la corta el descanso sacrificado del miércoles; hoy, sin hacer, neutro — ${JSON.stringify(rachaDeCumplimiento(f, { hoy: HOY1 }))}`);
let r2 = escenario('PLD');
r2 = entrenar(r2, '2026-10-05', { plantilla: 'P' });
r2 = entrenar(r2, '2026-10-06', { plantilla: 'L' });
r2 = entrenar(r2, '2026-10-08', { plantilla: 'P' });
ok(rachaDeCumplimiento(r2, { hoy: '2026-10-09' }).actual === 4, '🚨 Un descanso respetado no la rompe: forma parte de la disciplina (L, M, descanso, J = 4; hoy sin hacer, neutro)');
ok(rachaDeCumplimiento(g, { hoy: '2026-10-09' }).actual === 3, 'Un perdido la corta (miércoles de descanso, jueves y viernes: 3; el martes perdido la termina)');
ok(rachaDeCumplimiento(cargar({}), { hoy: '2026-10-09' }).actual === 0, 'Sin seguimiento, cero (no se inventa)');
ok(rachaDeCumplimiento(f, { hoy: HOY1, hasta: '2026-10-09' }).actual === 2, 'Y se puede pedir al final de un periodo (al viernes: jueves y viernes)');
const fuenteD = leer('src/lib/disciplinaFitness.js');
ok(!/from '\.\/rachas/.test(fuenteD) && !/puntos|monedas|nivel/i.test(fuenteD.replace(/\/\*[\s\S]*?\*\//g, '')), 'No es la racha global (`rachas.js` no se toca) y no hay puntos, monedas ni niveles (D2-02)');

console.log('\n── 6 · El calendario del mes y el detalle de una fecha (§4 y §5) ──');
const mesOct = mesDeCumplimiento(f, '2026-10', { hoy: HOY1 });
ok(mesOct.titulo === 'Octubre 2026' && mesOct.celdas.filter(Boolean).length === 31 && mesOct.celdas.indexOf(mesOct.celdas.find(Boolean)) === 3, 'Octubre 2026: 31 días, empieza en jueves (tres huecos)');
const celda = (fe) => mesOct.celdas.find((x) => x && x.fecha === fe);
ok(['cumplido', 'recuperado', 'descanso_sacrificado', 'parcial', 'cumplido', 'descanso_respetado', 'cumplido', 'hoy', 'futuro'].every((e, i) => celda(sumar(L, i)).estado === e), '🚨 Cada día con el estado del MOTOR (el calendario no calcula colores)');
ok(celda('2026-10-06').color === 'verde' && celda('2026-10-08').color === 'amarillo_verdoso' && celda('2026-10-07').color === 'rojo' && celda('2026-10-13').color === 'futuro', '…y su color: verde, amarillo verdoso, rojo y futuro (sin evaluar)');
ok(celda('2026-10-01').estado === 'sin_seguimiento' && celda('2026-10-01').color === 'neutro', '🚨 Antes de la rutina: sin evaluar, nunca incumplido');
ok(celda('2026-10-12').esHoy && celda('2026-10-10').descanso && !celda('2026-10-06').descanso, 'Se marca hoy y se distinguen los días de descanso');
ok(celda('2026-10-07').recuperaDe.join() === '2026-10-06', '🚨 El miércoles se marca como el día en que se recuperó el martes');
ok(mesOct.anterior === '2026-09' && mesOct.siguiente === '2026-11' && moverMes('2026-01', -1) === '2025-12' && moverMes('2026-12', 1) === '2027-01' && mesDe('2026-10-12') === '2026-10', 'Navegar entre meses, también cambiando de año');
ok(mesDeCumplimiento(f, '2026-02', { hoy: HOY1 }).celdas.filter(Boolean).length === 28, 'Febrero de 2026: 28 días');
const dRec = detalleDeFecha(f, '2026-10-06', { hoy: HOY1 });
ok(dRec.estado === 'recuperado' && dRec.cumplidaPor && dRec.cumplidaPor.fecha === '2026-10-07' && dRec.sesiones.length === 0, '🚨 El martes: recuperado, y dice qué día se hizo (el miércoles), sin una sesión inventada en el martes');
const dSab = detalleDeFecha(f, '2026-10-07', { hoy: HOY1 });
ok(dSab.estado === 'descanso_sacrificado' && dSab.sesiones.length === 1 && dSab.sesiones[0].clase === 'recuperacion' && dSab.sesiones[0].fechaPrevista === '2026-10-06' && /Recuperaste/.test(dSab.motivo), '🚨 El miércoles: la sesión de recuperación con su fecha prevista, y por qué sale como descanso sacrificado');
ok(dSab.previsto && dSab.previsto.tipo === 'descanso', '…tocaba descansar');
const dPar = detalleDeFecha(f, '2026-10-08', { hoy: HOY1 });
ok(dPar.estado === 'parcial' && dPar.sesiones[0].grado === 'parcial' && dPar.previsto.plantilla && dPar.previsto.rutina === 'Rutina PLD', 'El jueves: parcial, con su plantilla y su rutina');
const dX = detalleDeFecha(f, '2026-10-10', { hoy: HOY1 });
ok(dX.estado === 'descanso_respetado' && dX.sesiones.length === 0, 'Un descanso respetado, sencillo y sin sesiones inventadas');
const dFut = detalleDeFecha(f, '2026-10-20', { hoy: HOY1 });
ok(dFut.estado === 'futuro' && dFut.sesiones.length === 0, 'Un día futuro: sin evaluar');
ok(NOMBRE_CLASE.prevista === 'Planificado' && NOMBRE_CLASE.recuperacion === 'Recuperación' && NOMBRE_CLASE.libre === 'Libre', 'Los tres tipos de sesión, con su nombre');

console.log('\n── 7 · Coherencia con el resto del motor y volumen ──');
const ven = ventanaDeSieteDias(f, { hoy: HOY1 }).map((d) => d.estado).join();
ok(ven === fechasDelRango('2026-10-06', HOY1).map((d) => celda(d).estado).join(), '🚨 La ventana de 7 días de Tu Plan y el calendario dicen lo mismo de cada día (ninguna estadística contradice al motor)');
const p7 = disciplinaDelPeriodo(f, 'siete', { hoy: HOY1 });
ok(p7.rango.desde === '2026-10-06' && p7.estadisticas.dias === 7 && p7.estadisticas.completos === 2 && p7.estadisticas.recuperados === 1, 'Los últimos 7 días de ese lunes');
let grande = escenario('PLD', { desde: '2024-01-01' });
const plL = planARutina(plantillaDisponible(grande, PUSH)).lineas;
const sesiones = [];
for (let i = 0; i < 1000; i += 1) {
  const fecha = sumar('2024-01-01', i);
  const s = empezarSesion({ nombre: 'Push', lineas: plL, ahora: 1, hoy: fecha, planId: PUSH, origenTipo: 'plantilla', origenId: PUSH });
  sesiones.push({ ...terminar(s), fecha });
}
grande = { ...grande, sesiones };
const t0 = Date.now();
const eG = disciplinaDelPeriodo(grande, 'treinta', { hoy: sumar('2024-01-01', 999) });
const mG = mesDeCumplimiento(grande, mesDe(sumar('2024-01-01', 999)), { hoy: sumar('2024-01-01', 999) });
const ms = Date.now() - t0;
ok(eG.estadisticas.dias === 30 && mG.celdas.filter(Boolean).length >= 28 && ms < 4000, `🚨 Con 1000 sesiones: 30 días de estadísticas y el calendario del mes en ${ms} ms (tope de 4 s)`);
const t1 = Date.now();
mesDeCumplimiento(grande, '2025-06', { hoy: sumar('2024-01-01', 999) });
ok(Date.now() - t1 < 1500, `…y otro mes, reutilizando el análisis ya calculado (${Date.now() - t1} ms)`);
const antesJSON = JSON.stringify(f.sesiones);
estadisticasDeDisciplina(f, { desde: L, hasta: HOY1, hoy: HOY1 });
mesDeCumplimiento(f, '2026-10', { hoy: HOY1 });
detalleDeFecha(f, '2026-10-06', { hoy: HOY1 });
ok(JSON.stringify(f.sesiones) === antesJSON, '🚨 Ninguna lectura modifica una sesión (el historial queda intacto)');
ok(!/\.estado\s*===\s*'cumplido'\s*\?\s*'verde'|color:\s*'verde'/.test(fuenteD), 'El motor de disciplina no escribe colores propios: salen de `ESTADOS_FECHA`');

console.log('\n── 7 · El historial de cada plantilla y la evolución por plantilla (§6, §7 y §8) ──');
/* El mismo press de banca en dos plantillas («Push A» y «Push B»), y un libre. */
const lineasPush = planARutina(plantillaDisponible(cargar({}), PUSH)).lineas;
function sesionDe(fecha, { origenId, nombre, reps, peso = 60, tipo = 'plantilla' }) {
  reloj += 120_000;
  const s = empezarSesion({ nombre, lineas: lineasPush, ahora: reloj, hoy: fecha, planId: origenId, origenTipo: tipo, origenId });
  const ejercicios = s.origen.ejercicios.map((e) => ({
    ...e,
    series: e.series.map((x, i) => (e.exerciseId === 'press-banca-barra'
      ? (i < reps.length ? { ...x, estado: 'hecha', hecho: { reps: reps[i], duracion: null, peso } } : x)
      : { ...x, estado: 'hecha', hecho: { reps: 10, duracion: null, peso: 10 } })),
  }));
  return { ...s, fecha, origen: { ...s.origen, ejercicios }, estado: 'completada', iniciadaEn: reloj - 3_000_000, terminadaEn: reloj, guardadaEn: reloj };
}
let fp = cargar({});
for (const [fecha, o] of [
  ['2026-09-01', { origenId: 'pl-a', nombre: 'Push A', reps: [8, 8, 7, 6] }],
  ['2026-09-04', { origenId: 'pl-b', nombre: 'Push B', reps: [12, 12, 10], peso: 40 }],
  ['2026-09-08', { origenId: 'pl-a', nombre: 'Push A', reps: [8, 8, 8, 7] }],
  ['2026-09-11', { origenId: 'pl-b', nombre: 'Push B', reps: [12, 12, 11], peso: 40 }],
  ['2026-09-15', { origenId: 'pl-a', nombre: 'Push A', reps: [9, 8, 8, 8] }],
  ['2026-09-16', { origenId: 'libre-x', nombre: 'Libre', reps: [5], tipo: 'libre' }],
]) fp = guardarSesion(fp, sesionDe(fecha, o));
const HOYP = '2026-09-20';
const fichasP = sesionesDelHistorial(fp).map((x) => fichaDeHistorial(x, { fitness: fp, hoy: HOYP }));
const opsP = opcionesDePlantilla(fichasP);
ok(opsP[0].id === 'todas' && opsP.length === 3 && opsP[1].id === 'pl-a' && opsP[1].cuantas === 3 && opsP[2].id === 'pl-b' && opsP[2].cuantas === 2,
  'Las plantillas del historial: «Todas» y una por plantilla, la más reciente primero, con cuántas hay (el libre no inventa plantilla)');
const soloA = consultarHistorial(fichasP, { ...FILTROS_POR_DEFECTO, plantilla: 'pl-a' }, { hoy: HOYP });
ok(soloA.fichas.length === 3 && soloA.fichas.every((x) => x.plantillaId === 'pl-a'), '🚨 El historial de UNA plantilla: solo sus tres sesiones');
ok(soloA.fichas.map((x) => x.fecha).join() === '2026-09-15,2026-09-08,2026-09-01', '…de la más reciente a la más antigua');
const todasP = consultarHistorial(fichasP, FILTROS_POR_DEFECTO, { hoy: HOYP });
ok(todasP.fichas.length === 6 && todasP.opcionesPlantilla.length === 3, 'Sin filtro siguen las seis, y el selector trae las dos plantillas');
const dup = opcionesDePlantilla([
  { plantillaId: 'x1', nombre: 'Pierna', fecha: '2026-09-02' },
  { plantillaId: 'x2', nombre: 'Pierna', fecha: '2026-09-01' },
]);
ok(dup[1].nombre === 'Pierna (1)' && dup[2].nombre === 'Pierna (2)', 'Dos plantillas que se llaman igual se distinguen');
/* Una plantilla borrada: sus sesiones siguen y la opción también, con el nombre de entonces. */
const sinPlantillas = { ...fp, plantillas: [] };
ok(opcionesDePlantilla(sesionesDelHistorial(sinPlantillas).map((x) => fichaDeHistorial(x, { fitness: sinPlantillas, hoy: HOYP }))).some((o) => o.id === 'pl-a' && o.nombre === 'Push A'),
  'Una plantilla eliminada sigue en el historial con su nombre (sus sesiones son historia)');

const apP = aparicionesDeEjercicio(fp, 'press-banca-barra');
const porP = plantillasDelEjercicio(fp, apP);
ok(porP.opciones.length === 3 && porP.de.get(apP[0].sesionId) === null, 'Las plantillas del press de banca: A y B; la sesión libre no tiene plantilla');
const dTodas = detalleCompletoDeEjercicio(fp, 'press-banca-barra', { hoy: HOYP, rango: 'todo' });
const dA = detalleCompletoDeEjercicio(fp, 'press-banca-barra', { hoy: HOYP, rango: 'todo', plantilla: 'pl-a' });
const dB = detalleCompletoDeEjercicio(fp, 'press-banca-barra', { hoy: HOYP, rango: 'todo', plantilla: 'pl-b' });
ok(dTodas.plantilla === TODAS_LAS_PLANTILLAS && dTodas.hayPlantillas && dTodas.grafica.puntos.length === 6, 'Todas: la gráfica tiene los seis registros');
ok(dA.plantilla === 'pl-a' && dA.grafica.puntos.length === 3 && dA.grafica.puntos.every((p) => apP.find((a) => a.sesionId === p.sesionId && porP.de.get(a.sesionId) === 'pl-a')),
  '🚨 La gráfica de «Push A» solo dibuja lo hecho en Push A (no mezcla contextos)');
ok(dB.grafica.puntos.length === 2 && !dB.grafica.mostrar && /tres registros/.test(dB.grafica.motivo), 'Push B, con dos registros: no hay gráfica y se dice por qué (datos insuficientes)');
ok(dA.veces === 6 && dA.historial.length === 6 && dA.progreso.ultima && dA.progreso.ultima.fecha === '2026-09-16' && JSON.stringify(dA.progreso) === JSON.stringify(dTodas.progreso), 'El historial, el último y el mejor siguen siendo del ejercicio entero (la vista general complementa)');
const dNoEsta = detalleCompletoDeEjercicio(fp, 'press-banca-barra', { hoy: HOYP, rango: 'todo', plantilla: 'no-existe' });
ok(dNoEsta.plantilla === TODAS_LAS_PLANTILLAS && dNoEsta.grafica.puntos.length === 6, 'Una plantilla que no está entre las suyas vuelve a «Todas» (no deja una gráfica vacía)');
const ev = dA.evolucionSeries;
ok(ev.hay && ev.numeros.join() === '1,2,3,4' && ev.filas.length === 3, 'La evolución serie a serie de Push A: cuatro series, tres ejecuciones');
ok(ev.filas[0].fecha === '2026-09-15' && ev.filas[0].celdas[0].texto === '60 kg × 9' && ev.filas[2].celdas[3].texto === '60 kg × 6',
  '…de la más reciente a la más antigua, con el peso y las repeticiones de cada serie');
ok(dB.evolucionSeries.hay && dB.evolucionSeries.numeros.length === 3, 'Push B tiene su propia evolución (tres series)');
const evCorta = evolucionPorSerie(apP.slice(0, 1), { rango: 'todo', hoy: HOYP });
ok(!evCorta.hay && /dos registros/.test(evCorta.motivo), 'Con un solo registro no hay evolución que comparar, y se dice');
const evLibre = detalleCompletoDeEjercicio(fp, 'press-banca-barra', { hoy: HOYP, rango: 'todo' }).evolucionSeries;
ok(evLibre.filas[0].celdas.slice(1).every((c) => c.texto === '—'), 'Una serie que no se hizo es «—», nunca 0');
ok(evLibre.filas.length <= MAX_FILAS_EVOLUCION && MAX_SERIES_EVOLUCION === 8, 'Como mucho seis ejecuciones y ocho series (una tabla que cabe en el móvil)');
const enPeriodo = detalleCompletoDeEjercicio(fp, 'press-banca-barra', { hoy: HOYP, rango: '7d', plantilla: 'pl-a' });
ok(enPeriodo.evolucionSeries.hay === false || enPeriodo.evolucionSeries.filas.every((x) => x.fecha >= '2026-09-14'), 'El periodo de la gráfica recorta también la evolución serie a serie');
const vacioP = detalleCompletoDeEjercicio(cargar({}), 'press-banca-barra', { hoy: HOYP });
ok(!vacioP.hayPlantillas && !vacioP.evolucionSeries.hay, 'Sin sesiones: ni selector de plantilla ni evolución');
ok(JSON.stringify(sesionesDelHistorial(fp).map((x) => x.id)).length > 0 && fichasP.every((x) => x.claseTexto !== undefined), 'Cada ficha del historial dice de qué tipo es (planificado, recuperación, libre)');

console.log(`\n${fallos ? '✗' : '✓'} ${total - fallos}/${total} comprobaciones`);
process.exit(fallos ? 1 : 0);
