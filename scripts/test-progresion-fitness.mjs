/* ═══════════════════════════════════════════════════════════════════════════
   Fitness 5/8 — la progresión: Manual, Progresivo y Experto (prompt 5 §13)
   ═══════════════════════════════════════════════════════════════════════════
   Todo con fechas fijas: ninguna comprobación depende del día en que se pase. */

import fs from 'node:fs';
import {
  empezarSesion, editarSerie, marcarSerie, ejerciciosDeSesion, crearSerie, normalizarFitnessConSesiones,
  textoPlanificado, textoRealizado, filasDeSeries, progresionDeLinea,
} from '../src/lib/entrenamiento.js';
import {
  conPropuestas, propuestaParaEjercicio, cambiarModoProgresion, modoDeProgresion, MODOS_PROGRESION,
  MODO_PROGRESION_POR_DEFECTO, progresionActivaEnLinea, conProgresionEnLinea, plantillaDeSesion,
  ejecucionesDeLinea, resultadoFrenteAPropuesta, resumenFrenteAPropuestas, TEXTOS_PROGRESION,
  DECISIONES_FASE5, serieLimpia, progresoDeEjercicio,
} from '../src/lib/progresion.js';
import { crearLinea, crearRutina, moverLinea, rutinaAPlan, planARutina, validarRutina, editarLinea, textoDeSeries } from '../src/lib/constructor.js';
import { duplicarPlantilla } from '../src/lib/plantillas.js';
import {
  repeticionValida, leerRepeticiones, repeticionesGuardadas, repeticionesAlEscribir, textoReps, sumarRepeticiones,
  MENSAJE_REPETICIONES,
} from '../src/lib/numerosFitness.js';
import { ajustarValor, resumenRealizado } from '../src/lib/entrenamientoUx.js';
import { resumenDeEjercicio } from '../src/lib/finalizacion.js';
import { normalizarFitness, DEFAULT_FITNESS, MODOS_PROGRESION_IDS, crearWorkoutExercise } from '../src/lib/fitness.js';
import { migrarFitness, VERSION_FITNESS, MIGRACIONES_FITNESS } from '../src/lib/persistenciaFitness.js';
import { migrarV2aV3, MIGRACION_V2_A_V3 } from '../src/lib/migracionFitnessV3.js';
import { completarEntrenamiento } from '../src/lib/completarEntrenamiento.js';
import { filaDeSerieHistorial } from '../src/lib/historial.js';
import { idPlantillaDeDia, CATALOGO_PLANES, diaARutina } from '../src/lib/planes.js';

let fallos = 0;
let total = 0;
const ok = (c, msg) => { total += 1; if (c) console.log(`  ✓ ${msg}`); else { fallos += 1; console.log(`  ✗ ${msg}`); } };
const leer = (r) => fs.readFileSync(new URL(`../${r}`, import.meta.url), 'utf8');

/* ── Escenario ─────────────────────────────────────────────────────────── */
const PRESS = 'press-banca-barra';
const DOMI = 'dominada-prona';
const lineaPress = (id = 'L1', extra = {}) => ({ ...crearLinea({ exerciseId: PRESS, series: 3, repeticiones: 8, repsHasta: 12, peso: 60, ...extra }), id });
const lineaPlancha = (id = 'LT') => ({ ...crearLinea({ exerciseId: 'plancha', series: 2, modo: 'tiempo', duracion: 30 }), id });
const lineaDomi = (id = 'LD') => ({ ...crearLinea({ exerciseId: DOMI, series: 3, repeticiones: 8, tipoCarga: 'corporal' }), id });

const nueva = (lineas, plantillaId = 'PA', fecha = '2026-11-03') => empezarSesion({
  nombre: plantillaId, lineas, planId: plantillaId, origenTipo: 'plantilla', origenId: plantillaId, hoy: fecha, ahora: Date.parse(`${fecha}T10:00:00`),
});
/** Una sesión completada con estos valores por ejercicio (en orden de líneas). */
function hecha(lineas, valores, { plantillaId = 'PA', fecha = '2026-11-01', id = `s-${fecha}-${plantillaId}`, quitarLineaId = false } = {}) {
  let s = { ...nueva(lineas, plantillaId, fecha), id };
  ejerciciosDeSesion(s).forEach((e, i) => {
    const v = valores[i] || [];
    e.series.forEach((se, j) => {
      const x = v[j];
      if (x === undefined) return;
      const cambios = e.modo === 'tiempo' ? { duracion: x } : (Array.isArray(x) ? { reps: x[0], peso: x[1] } : { reps: x });
      s = editarSerie(s, e.id, se.id, cambios);
      s = marcarSerie(s, e.id, se.id, true);
    });
  });
  if (quitarLineaId) {
    s = { ...s, origen: { ...s.origen, ejercicios: ejerciciosDeSesion(s).map((e) => ({ ...e, linea: { ...e.linea, id: undefined, progresion: undefined } })) } };
  }
  return { ...s, estado: 'completada', terminadaEn: Date.parse(`${fecha}T11:00:00`) };
}
const propuestas = (sesion, k = 0) => ejerciciosDeSesion(sesion)[k].series.map((s) => s.plan.propuesta);
const reps = (sesion, k = 0) => propuestas(sesion, k).map((p) => (p ? p.reps : null));

console.log('\n── 1 · Las repeticiones: enteras o de media en media (§8) ──');
ok([6, 6.5, 7, 7.5, 8, 0].every(repeticionValida) && ![6.2, 7.8, -1, NaN, Infinity, '', null, true].some(repeticionValida), 'Valen 6 · 6,5 · 7 · 7,5 · 8; no valen 6,2, 7,8, negativos ni nada que no sea un número');
ok(leerRepeticiones('8,5').valor === 8.5 && leerRepeticiones('8.5').valor === 8.5 && leerRepeticiones('').valor === null && leerRepeticiones('').ok, 'Se escribe con coma o con punto; vacío es vacío');
const malo = leerRepeticiones('8,2');
ok(!malo.ok && malo.mensaje === MENSAJE_REPETICIONES && malo.valor === null, 'Se rechaza 8,2 con una frase que dice qué escribir, sin redondear');
ok(!leerRepeticiones('8x').ok && !leerRepeticiones('-3').ok, 'Y lo que no es un número tampoco vale');
ok(repeticionesGuardadas(8.2) === 8.2 && repeticionesGuardadas('9') === 9 && repeticionesGuardadas(null) === null, 'Al CARGAR no se redondea nada: se conserva tal cual (lo guardado antes es entero)');
ok(repeticionesAlEscribir('8,2') === undefined && repeticionesAlEscribir('') === null && repeticionesAlEscribir(7.5) === 7.5, 'Al escribir desde el motor, lo que no vale no se escribe');
ok(textoReps(8.5) === '8,5' && textoReps(8) === '8', 'Se enseña con coma: «8,5»');
ok(sumarRepeticiones(8.5, 1) === 9.5 && sumarRepeticiones(8.5, -1) === 7.5 && sumarRepeticiones(0, -1) === 0, '± conserva la media (8,5 → 9,5), y nunca baja de cero');
ok(ajustarValor(8.5, 'reps', 1) === 9.5 && ajustarValor(10, 'reps', -1) === 9 && ajustarValor(62.5, 'peso', 1) === 65, 'El paso rápido del directo también: 8,5 + 1 = 9,5 (antes daba 10)');

console.log('\n── 2 · La regla, en todas las capas (§8: plantilla, edición, directo, historial, importación) ──');
const lMedia = crearLinea({ exerciseId: PRESS, repeticiones: 8.5, repsHasta: 10.5 });
ok(lMedia.repeticiones === 8.5 && lMedia.repsHasta === 10.5, 'Plantilla: la línea guarda 8,5 – 10,5');
ok(textoDeSeries({ ...lMedia, series: 3 }) === '3 × 8,5-10,5', '…y la lista la dice con coma');
ok(crearWorkoutExercise({ exerciseId: PRESS, repeticiones: 8.5 }).repeticiones === 8.5, 'El modelo de la F1 no la redondea al guardar la plantilla');
const rMala = crearRutina({ nombre: 'X', lineas: [{ ...crearLinea({ exerciseId: PRESS, repeticiones: 8.2 }), id: 'q' }] });
ok(validarRutina(rMala).problemas.some((p) => p.campo === 'repeticiones' && /media en media/.test(p.que)), 'Una plantilla con 8,2 (importada) no se guarda: se dice qué corregir');
ok(!validarRutina(crearRutina({ nombre: 'X', lineas: [{ ...lMedia, id: 'q' }] })).problemas.some((p) => p.campo === 'repeticiones'), '…y una con 8,5 sí');
let sm = nueva([lineaPress()]);
const e0 = ejerciciosDeSesion(sm)[0];
sm = editarSerie(sm, e0.id, e0.series[0].id, { reps: '9,5' });
ok(ejerciciosDeSesion(sm)[0].series[0].hecho.reps === 9.5, 'Directo: 9,5 se guarda como 9,5');
const sm2 = editarSerie(sm, e0.id, e0.series[0].id, { reps: '9,3' });
ok(ejerciciosDeSesion(sm2)[0].series[0].hecho.reps === 9.5, 'Directo: 9,3 no se escribe y se queda lo de antes (ni se redondea a 9)');
ok(textoRealizado(ejerciciosDeSesion(sm)[0].series[0]) === '9,5' && textoPlanificado(ejerciciosDeSesion(sm)[0].series[0]) === '8–12', 'El texto de lo hecho y de lo planificado');
const recargada = normalizarFitnessConSesiones({ sesiones: [sm] });
ok(ejerciciosDeSesion(recargada.sesiones[0])[0].series[0].hecho.reps === 9.5, 'Recargar no lo convierte en 10 (antes `Math.round`)');
ok(serieLimpia({ hecho: { reps: 9.5 } }).reps === 9.5 && serieLimpia({ hecho: { reps: 9.3 } }).reps === null, 'Estadísticas: 9,5 cuenta como 9,5 y un 9,3 de fuera se ignora como dato');
const filaH = filaDeSerieHistorial({ ...filasDeSeries(ejerciciosDeSesion(sm)[0])[0] });
ok(filaH.medida === '9,5', 'Historial: «9,5»');
{
  let r = nueva([lineaPress()]);
  const ex = ejerciciosDeSesion(r)[0];
  [8.5, 10, 9].forEach((v, i) => { r = marcarSerie(editarSerie(r, ex.id, ex.series[i].id, { reps: v, peso: 60 }), ex.id, ex.series[i].id, true); });
  const ejr = ejerciciosDeSesion(r)[0];
  ok(resumenRealizado(ejr) === '8,5 / 10 / 9', 'Tarjeta del ejercicio en directo: «8,5 / 10 / 9»');
  ok(resumenDeEjercicio(ejr).reps === '8,5–10', '🐛 Resumen de la finalización: «8,5–10» (sin la coma salía «8.5–10», y pasarlo después por el formato lo dejaba vacío)');
}

console.log('\n── 3 · Los tres modos (§3) ──');
ok(MODOS_PROGRESION.map((m) => m.id).join() === MODOS_PROGRESION_IDS.join() && MODOS_PROGRESION.length === 3, 'Tres modos, con los mismos ids que conoce el modelo');
ok(modoDeProgresion({}) === 'manual' && MODO_PROGRESION_POR_DEFECTO === 'manual' && DEFAULT_FITNESS.preferencias.progresion === 'manual', 'Por defecto, Manual: nada cambia para él hasta que elija');
ok(modoDeProgresion(cambiarModoProgresion({}, 'experto')) === 'experto' && cambiarModoProgresion({ a: 1 }, 'raro').a === 1 && modoDeProgresion(cambiarModoProgresion({}, 'raro')) === 'manual', 'Se cambia; un modo que no existe no se guarda');
ok(normalizarFitness({ preferencias: { progresion: 'progresivo', otra: 1 } }).preferencias.progresion === 'progresivo' && normalizarFitness({ preferencias: { otra: 1 } }).preferencias.otra === 1 && normalizarFitness({ preferencias: 'x' }).preferencias.progresion === 'manual', 'Regla 5: el normalizador conoce `preferencias` (y conserva lo que no conoce)');

const historia = [hecha([lineaPress()], [[[10, 60], [9, 60], [8, 60]]])];
const fBase = { sesiones: historia };
const hoy = nueva([lineaPress()]);
const manual = conPropuestas(cambiarModoProgresion(fBase, 'manual'), hoy);
ok(manual === hoy && reps(manual).every((x) => x === null), 'Manual no propone nada: la sesión sale tal cual');
const prog = conPropuestas(cambiarModoProgresion(fBase, 'progresivo'), hoy);
ok(reps(prog).join() === '10,9,9' && propuestas(prog).filter((p) => p.mejora).length === 1, 'Progresivo: repite lo de la última vez y sube UNA repetición en UNA serie (la más baja): 10 · 9 · 9');
ok(propuestas(prog).every((p) => p.peso === 60), '…con el peso de la última vez (nunca se sube el peso por él)');
const exp = conPropuestas(cambiarModoProgresion(fBase, 'experto'), hoy);
ok(reps(exp).join() === '10.5,9.5,8.5' && propuestas(exp).every((p) => p.mejora), 'Experto: un objetivo por serie, media repetición sobre cada una (10 · 9 · 8 → 10,5 · 9,5 · 8,5)');
ok(propuestaParaEjercicio(cambiarModoProgresion(fBase, 'progresivo'), hoy, ejerciciosDeSesion(hoy)[0]).texto === TEXTOS_PROGRESION.sube, 'Y se dice que es solo una propuesta');

console.log('\n── 4 · El interruptor de cada línea (§4) ──');
ok(progresionActivaEnLinea({}) && progresionActivaEnLinea({ config: {} }) && !progresionActivaEnLinea({ config: { progresion: false } }), 'Sin guardar, activado (AJ-20); apagado si él lo apaga');
ok(progresionDeLinea({ config: { progresion: false } }) === false && progresionDeLinea(crearLinea({ exerciseId: PRESS })) === true, 'La foto de la sesión lee la misma regla');
const apagada = conProgresionEnLinea(lineaPress(), false);
ok(apagada.config.progresion === false && apagada.id === 'L1', 'Se guarda en `config.progresion` de la línea');
const hoyApagada = nueva([apagada]);
ok(ejerciciosDeSesion(hoyApagada)[0].linea.progresion === false, 'La sesión fotografía cómo estaba ese día');
ok(reps(conPropuestas(cambiarModoProgresion(fBase, 'experto'), hoyApagada)).every((x) => x === null), 'Desactivado: sin propuestas para ese ejercicio');
const dos = nueva([apagada, lineaDomi()]);
const fDos = cambiarModoProgresion({ sesiones: [hecha([lineaPress(), lineaDomi()], [[[10, 60], [9, 60], [8, 60]], [8, 8, 7]])] }, 'experto');
const cDos = conPropuestas(fDos, dos);
ok(reps(cDos, 0).every((x) => x === null) && reps(cDos, 1).join() === '8.5,8.5,7.5', 'Cada ejercicio con su configuración: uno apagado y otro con propuestas');
const editada = editarLinea(crearRutina({ nombre: 'A', lineas: [apagada] }), 'L1', { series: 4 });
ok(editada.lineas[0].config.progresion === false, 'Se conserva al editar la plantilla');
const plantilla = rutinaAPlan(crearRutina({ id: 'PA', nombre: 'Push A', lineas: [apagada, lineaDomi()] }));
const dup = duplicarPlantilla([plantilla], 'PA', '2026-11-03');
ok(dup.ok && dup.copia.id !== 'PA' && dup.copia.ejercicios[0].config.progresion === false && dup.copia.ejercicios.every((l, i) => l.id !== plantilla.ejercicios[i].id), 'Duplicar conserva el interruptor de cada ejercicio, con ids nuevos');
ok(planARutina(plantilla).lineas[0].config.progresion === false, 'Y el ida y vuelta plantilla ↔ constructor también');

console.log('\n── 5 · Se compara dentro de la misma plantilla y la misma línea (§5) ──');
const fAB = cambiarModoProgresion({
  sesiones: [
    hecha([lineaPress('LA')], [[[10, 60], [10, 60], [10, 60]]], { plantillaId: 'PUSH-A', fecha: '2026-11-01' }),
    hecha([lineaPress('LB')], [[[6, 60], [6, 60], [6, 60]]], { plantillaId: 'PUSH-B', fecha: '2026-11-02' }),
  ],
}, 'experto');
ok(reps(conPropuestas(fAB, nueva([lineaPress('LA')], 'PUSH-A'))).join() === '10.5,10.5,10.5', 'Push A mira solo Push A (aunque Push B sea más reciente)');
ok(reps(conPropuestas(fAB, nueva([lineaPress('LB')], 'PUSH-B'))).join() === '6.5,6.5,6.5', 'Y Push B, solo Push B: dos progresiones independientes del mismo ejercicio');
ok(reps(conPropuestas(fAB, nueva([lineaPress('LZ')], 'PUSH-A'))).every((x) => x === null), 'Otra línea en la misma plantilla (otro id) no hereda nada: la identidad es la línea');
const dosLineas = [lineaPress('P1'), lineaPress('P2')];
const fDosL = cambiarModoProgresion({ sesiones: [hecha(dosLineas, [[[12, 60], [12, 60], [12, 60]], [6, 60]].map((x) => (Array.isArray(x[0]) ? x : [x, x, x])))] }, 'experto');
const cDosL = conPropuestas(fDosL, nueva(dosLineas));
ok(reps(cDosL, 0).join() === '12,12,12' && reps(cDosL, 1).join() === '6.5,6.5,6.5', 'Dos líneas del MISMO ejercicio en una plantilla: cada una con la suya (por id), y el máximo del rango no se pasa (12)');
const reordenada = moverLinea(crearRutina({ nombre: 'A', lineas: dosLineas }), 'P2', 'arriba').lineas;
const cReord = conPropuestas(fDosL, nueva(reordenada));
ok(reps(cReord, 0).join() === '6.5,6.5,6.5' && reps(cReord, 1).join() === '12,12,12', 'Ejercicios reordenados: la propuesta sigue a su línea, no a la posición');
ok(plantillaDeSesion({ diaDePlan: { plantillaId: 'X' } }) === 'X' && plantillaDeSesion({ origen: { tipo: 'plantilla', id: 'Y' } }) === 'Y'
  && plantillaDeSesion({ origen: { tipo: 'preset', id: 'ppl-estetico-dia-1' } }) === idPlantillaDeDia('ppl-estetico-dia-1')
  && plantillaDeSesion({ origen: { tipo: 'rutina', id: 'D1' } }, { rutinas: [{ dias: [{ id: 'D1', plantillaId: 'PL' }] }] }) === 'PL'
  && plantillaDeSesion({ origen: {} }) === null, 'La plantilla de una sesión: la que escribe la Fase 4 y, para lo de antes, la regla del §14.6');
const sustituida = hecha([lineaPress('L1')], [[[10, 60], [10, 60], [10, 60]]]);
const sust = { ...sustituida, origen: { ...sustituida.origen, ejercicios: ejerciciosDeSesion(sustituida).map((e) => ({ ...e, exerciseId: 'press-banca-mancuernas' })) } };
ok(reps(conPropuestas(cambiarModoProgresion({ sesiones: [sust] }, 'experto'), nueva([lineaPress('L1')]))).every((x) => x === null), 'Si aquella vez se sustituyó el ejercicio en esa línea, no se compara: era otro ejercicio');

console.log('\n── 6 · Sesiones antiguas sin id de línea (§5 y §11.3) ──');
const vieja = hecha([lineaPress()], [[[10, 60], [9, 60], [8, 60]]], { quitarLineaId: true });
ok(!ejerciciosDeSesion(vieja)[0].linea.id, '(escenario: la sesión no tiene `linea.id`)');
ok(reps(conPropuestas(cambiarModoProgresion({ sesiones: [vieja] }, 'experto'), nueva([lineaPress()]))).join() === '10.5,9.5,8.5', 'Inequívoca (un solo press en las dos): se compara');
const viejaDoble = hecha(dosLineas, [[[12, 60], [12, 60], [12, 60]], [[6, 60], [6, 60], [6, 60]]], { quitarLineaId: true });
ok(conPropuestas(cambiarModoProgresion({ sesiones: [viejaDoble] }, 'experto'), nueva(dosLineas)) !== null
  && reps(conPropuestas(cambiarModoProgresion({ sesiones: [viejaDoble] }, 'experto'), nueva(dosLineas)), 0).every((x) => x === null), 'Ambigua (dos líneas del mismo ejercicio): no se inventa una comparación');
ok(ejecucionesDeLinea({ sesiones: [vieja] }, { plantillaId: 'PA', ej: ejerciciosDeSesion(nueva([lineaPress()]))[0], unica: false }).length === 0, '…y tampoco si en la plantilla de hoy hay dos líneas con ese ejercicio');

console.log('\n── 7 · Duplicar y cambiar la plantilla (§10) ──');
const fDup = cambiarModoProgresion({ sesiones: [hecha(plantilla.ejercicios.map((l) => ({ ...l, config: {} })), [[[10, 60], [9, 60], [8, 60]], [8, 8, 8]], { plantillaId: 'PA' })] }, 'experto');
const lineasCopia = planARutina(dup.copia).lineas.map((l) => ({ ...l, config: {} }));
ok(reps(conPropuestas(fDup, nueva(lineasCopia, dup.copia.id))).every((x) => x === null), 'Una plantilla duplicada empieza su propio historial (PD-13): no hereda el de la original');
ok(fDup.sesiones.length === 1 && plantillaDeSesion(fDup.sesiones[0]) === 'PA', '…y el de la original sigue ahí');
const cuatro = conPropuestas(cambiarModoProgresion(fBase, 'experto'), nueva([lineaPress('L1', { series: 4 })]));
ok(reps(cuatro).join() === '10.5,9.5,8.5,' && propuestas(cuatro)[3] === null, 'Más series que la última vez: Experto propone en las que tienen referencia; la nueva, sin propuesta');
const progCuatro = conPropuestas(cambiarModoProgresion(fBase, 'progresivo'), nueva([lineaPress('L1', { series: 4 })]));
ok(propuestas(progCuatro).every((p) => !p || !p.mejora) && propuestaParaEjercicio(cambiarModoProgresion(fBase, 'progresivo'), progCuatro, ejerciciosDeSesion(progCuatro)[0]).motivo === 'incompleta', 'Progresivo: con series de más (o de menos aquella vez) no se sube; se repite lo que hay');
const otroPeso = conPropuestas(cambiarModoProgresion(fBase, 'experto'), nueva([lineaPress('L1', { peso: 65 })]));
ok(reps(otroPeso).every((x) => x === null), 'Si hoy la plantilla pide otro peso (60 → 65), no se compara: aquellas repeticiones eran con otra carga');
const renombrada = conPropuestas(cambiarModoProgresion(fBase, 'experto'), { ...nueva([lineaPress()]), nombre: 'Empuje' });
ok(reps(renombrada).join() === '10.5,9.5,8.5', 'Cambiar el nombre de la plantilla no cambia nada: se compara por ids');

console.log('\n── 8 · Tipos de ejercicio (§11) ──');
const fT = cambiarModoProgresion({ sesiones: [hecha([lineaPlancha()], [[40, 35]])] }, 'experto');
const cT = conPropuestas(fT, nueva([lineaPlancha()]));
ok(propuestas(cT).map((p) => p && p.duracion).join() === '40,35' && propuestas(cT).every((p) => !p.mejora && p.reps === null), 'Por tiempo: lo de la última vez como referencia, sin subir y sin repeticiones (AJ-21)');
const fC = cambiarModoProgresion({ sesiones: [hecha([lineaDomi()], [[8, 8, 6]])] }, 'progresivo');
const cC = conPropuestas(fC, nueva([lineaDomi()]));
ok(reps(cC).join() === '8,8,7' && propuestas(cC).every((p) => p.peso === null), 'Peso corporal: repeticiones, sin peso inventado');
const fL = cambiarModoProgresion({ sesiones: [hecha([lineaDomi('LL')].map((l) => ({ ...l, tipoCarga: 'adicional' })), [[[6, 10], [6, 10], [5, 10]]])] }, 'experto');
const cL = conPropuestas(fL, nueva([lineaDomi('LL')].map((l) => ({ ...l, tipoCarga: 'adicional' }))));
ok(reps(cL).join() === '6.5,6.5,5.5' && propuestas(cL).every((p) => p.peso === 10), 'Lastrado: el mismo lastre y media repetición más');
const alTope = conPropuestas(cambiarModoProgresion({ sesiones: [hecha([lineaPress()], [[[12, 60], [12, 60], [12, 60]]])] }, 'progresivo'), nueva([lineaPress()]));
ok(reps(alTope).join() === '12,12,12' && propuestaParaEjercicio(cambiarModoProgresion({ sesiones: [hecha([lineaPress()], [[[12, 60], [12, 60], [12, 60]]])] }, 'progresivo'), alTope, ejerciciosDeSesion(alTope)[0]).texto === TEXTOS_PROGRESION.alTope, 'En el máximo del rango no se sube: se dice que decide él si sube el peso');
const bajo = cambiarModoProgresion({ sesiones: [hecha([lineaPress()], [[[10, 60], [10, 60], [10, 60]]], { fecha: '2026-10-28' }), hecha([lineaPress()], [[[9, 60], [9, 60], [8, 60]]], { fecha: '2026-11-01' })] }, 'progresivo');
ok(propuestaParaEjercicio(bajo, nueva([lineaPress()]), ejerciciosDeSesion(nueva([lineaPress()]))[0]).motivo === 'bajo' && reps(conPropuestas(bajo, nueva([lineaPress()]))).join() === '9,9,8', 'Si la última vez bajó, Progresivo propone mantener (sin flecha)');

console.log('\n── 9 · Sin datos, «Completar entrenamiento» y lo que no cuenta (§6, §9, D-03) ──');
ok(reps(conPropuestas(cambiarModoProgresion({ sesiones: [] }, 'experto'), nueva([lineaPress()]))).every((x) => x === null), 'Sin una vez anterior en esa plantilla: ninguna propuesta');
const enCurso = { ...hecha([lineaPress()], [[[10, 60], [10, 60], [10, 60]]]), estado: 'en_curso' };
ok(reps(conPropuestas(cambiarModoProgresion({ sesiones: [enCurso] }, 'experto'), nueva([lineaPress()]))).every((x) => x === null), 'Una sesión sin terminar no es referencia');
const opcion = { clave: 'plantilla|PA', nombre: 'Push A', planId: 'PA', origenTipo: 'plantilla', origenId: 'PA', lineas: [lineaPress()], entorno: '' };
const comp = completarEntrenamiento({ sesiones: [] }, { opcion, fecha: '2026-11-01', hoy: '2026-11-02', ahora: Date.parse('2026-11-02T10:00:00') });
ok(comp.ok && ejerciciosDeSesion(comp.sesion)[0].series.every((s) => s.estado === 'hecha' && s.hecho.reps === null), '(escenario: «Completar entrenamiento» con todas las series hechas y sin valores)');
ok(reps(conPropuestas(cambiarModoProgresion({ sesiones: [comp.sesion] }, 'experto'), nueva([lineaPress()]))).every((x) => x === null), '…no tiene resultados que comparar: no es referencia');
const fConComp = cambiarModoProgresion({ sesiones: [...historia, { ...comp.sesion, fecha: '2026-11-02' }] }, 'experto');
ok(reps(conPropuestas(fConComp, nueva([lineaPress()]))).join() === '10.5,9.5,8.5', '…y no tapa la anterior que sí los tiene');
const recCompleta = comp.sesion;
ok(!ejerciciosDeSesion(recCompleta)[0].series.some((s) => s.plan.propuesta), 'Completar no escribe propuestas');

console.log('\n── 10 · Plan, propuesta y hecho: tres cosas (§7 y §9) ──');
const conP = conPropuestas(cambiarModoProgresion(fBase, 'experto'), hoy);
ok(ejerciciosDeSesion(conP)[0].series.every((s, i) => s.hecho.reps === null && s.hecho.peso === null && s.estado === 'pendiente' && s.plan.reps === 8 && s.plan.repsHasta === 12 && s.plan.peso === 60 && s.id === ejerciciosDeSesion(hoy)[0].series[i].id), 'La propuesta no toca `hecho`, ni el plan de la plantilla, ni el estado: va aparte (`plan.propuesta`)');
let real = conP;
const er = ejerciciosDeSesion(real)[0];
real = editarSerie(real, er.id, er.series[0].id, { reps: 8, peso: 60 });
real = marcarSerie(real, er.id, er.series[0].id, true);
real = editarSerie(real, er.id, er.series[1].id, { reps: 12, peso: 60 });
real = marcarSerie(real, er.id, er.series[1].id, true);
real = editarSerie(real, er.id, er.series[2].id, { reps: 8.5, peso: 60 });
real = marcarSerie(real, er.id, er.series[2].id, true);
const sr = ejerciciosDeSesion(real)[0].series;
ok(sr[0].plan.propuesta.reps === 10.5 && sr[0].hecho.reps === 8, 'Le proponen 10,5 y hace 8: plan 10,5, realizado 8 (nunca 10,5)');
ok(resultadoFrenteAPropuesta(sr[0]).estado === 'por_debajo' && resultadoFrenteAPropuesta(sr[1]).estado === 'supera' && resultadoFrenteAPropuesta(sr[2]).estado === 'igual', 'Resultado inferior, superior e igual a la propuesta, cada uno con su nombre');
ok(resultadoFrenteAPropuesta(sr[1]).diferencia === 2.5, '…y su diferencia (12 − 9,5 = 2,5)');
const rs = resumenFrenteAPropuestas(real);
ok(rs.conPropuesta === 3 && rs.supera === 1 && rs.igual === 1 && rs.por_debajo === 1, 'El resumen de la sesión frente a sus propuestas');
ok(resultadoFrenteAPropuesta({ plan: {}, hecho: { reps: 9 }, estado: 'hecha' }).estado === 'sin_propuesta', 'Sin propuesta, no hay nada que comparar');
const guardada = normalizarFitnessConSesiones({ sesiones: [real] }).sesiones[0];
ok(ejerciciosDeSesion(guardada)[0].series[0].plan.propuesta.reps === 10.5 && ejerciciosDeSesion(guardada)[0].series[0].hecho.reps === 8, 'Regla 5: la propuesta sobrevive a la carga, separada de lo hecho');
ok(crearSerie({ plan: { propuesta: { reps: 'x' } } }).plan.propuesta === null && crearSerie({ plan: { propuesta: { reps: 9.5, mejora: true } } }).plan.propuesta.reps === 9.5, 'Una propuesta sin nada es `null`');
const filaHP = filaDeSerieHistorial(filasDeSeries(ejerciciosDeSesion(real)[0])[0]);
ok(filaHP.medida === '8' && filaHP.propuesta && filaHP.propuesta.texto === 'Propuesta: 10,5', 'El historial enseña lo que hizo y, aparte, lo que se le propuso');
ok(TEXTOS_PROGRESION.noPasaNada === 'No pasa nada. No todos los días se mejora. Lo importante es mantener la constancia.', 'Si no mejora, la frase del prompt, sin reproches');
const fH = cambiarModoProgresion({ sesiones: [real] }, 'experto');
const antesH = JSON.stringify(fH.sesiones);
conPropuestas(fH, nueva([lineaPress()]));
progresoDeEjercicio(fH, PRESS);
ok(JSON.stringify(fH.sesiones) === antesH, 'Calcular propuestas no modifica ninguna sesión histórica');
ok(progresoDeEjercicio({ sesiones: [{ ...real, estado: 'completada' }] }, PRESS).ultima.texto === '60×8 · 60×12 · 60×8,5', 'La progresión de siempre (F11) lee lo hecho, nunca la propuesta');

console.log('\n── 11 · Las predeterminadas tienen ids de línea estables ──');
const dia = diaARutina(CATALOGO_PLANES[0], 0, []);
ok(dia.lineas.every((l) => /-plantilla-l\d+$/.test(l.id)), 'Las líneas de una predeterminada llevan su id escrito (Fase 3)');
const sPreset = empezarSesion({ nombre: 'Día 1', lineas: dia.lineas, planId: CATALOGO_PLANES[0].id, origenTipo: 'preset', origenId: CATALOGO_PLANES[0].dias[0].id, hoy: '2026-11-03' });
ok(ejerciciosDeSesion(sPreset).every((e, i) => e.linea.id === dia.lineas[i].id && e.linea.progresion === true), '…y la sesión las fotografía con su interruptor');
ok(plantillaDeSesion(sPreset) === idPlantillaDeDia(CATALOGO_PLANES[0].dias[0].id), '…y sabe de qué plantilla es');

console.log('\n── 12 · La versión 3 (M2) y la guardia ──');
ok(VERSION_FITNESS === 3 && MIGRACIONES_FITNESS.some((m) => m === MIGRACION_V2_A_V3), 'La versión es la 3, con su migración');
const v2 = { version: 2, sesiones: [real], plantillas: [plantilla], cumplimientoDesde: '2026-11-01' };
const m2 = migrarFitness(v2);
ok(m2.migrada && m2.desde === 2 && m2.fitness.version === 3 && m2.fitness.preferencias.progresion === 'manual' && JSON.stringify(m2.fitness.sesiones) === JSON.stringify(v2.sesiones), 'De la 2 a la 3: Manual y ni una sesión tocada');
ok(migrarV2aV3({ preferencias: { progresion: 'experto' } }).preferencias.progresion === 'experto', 'Idempotente: un modo ya elegido se respeta');
ok(migrarFitness({ ...v2, version: 4 }).futura, 'Una versión más nueva no se migra (y la aplicación no guarda: guardia de la Fase 3)');
const app = leer('src/App.jsx');
ok(/migracionFit\.desde >= 2/.test(app), 'App: lo migrado de la 2 se guarda ya, para que la versión 3 esté puesta antes de escribir medias');

console.log('\n── 13 · Interfaz y arquitectura ──');
const vivo = leer('src/views/EntrenamientoVivoView.jsx');
ok(/propuesta=\{propuestaDeFila\(f, porTiempo\)\}/.test(vivo) && /revisarTexto=\{porTiempo \? null : validarRepsEnVivo\}/.test(vivo), 'Directo: el campo de repeticiones lleva su propuesta y su validación');
ok(/pointer-events-none absolute inset-0/.test(vivo) && /COLORS\.positive, 0\.7/.test(vivo) && /verPropuesta = conPropuesta && texto === ''/.test(vivo), '…la propuesta va de fondo, en verde suave, y desaparece en cuanto él escribe');
ok(/aria-invalid=\{error \? true : undefined\}/.test(vivo) && /inputMode=\{conDecimal \? 'decimal' : 'numeric'\}/.test(vivo) && /decimal=\{!porTiempo\}/.test(vivo), '…con teclado decimal y error accesible');
ok(/<LineaPropuesta filas=\{filas\} \/>/.test(vivo) && /noPasaNadaEn === ejercicio\.id/.test(vivo), '…una sola frase arriba, y la de «no pasa nada» una vez por entrenamiento');
const cons = leer('src/views/ConstructorView.jsx');
ok(/modoProgresion !== 'manual' && \(\s*<InterruptorProgresion/.test(cons), 'Plantilla: el interruptor «Progresión» solo fuera de Manual');
ok(/medias\s*\n\s*onCambiar=\{\(v\) => set\(\{ repeticiones: v \}\)\}/.test(cons), '…y las repeticiones se pueden escribir con media');
const tp = leer('src/views/TuPlanView.jsx');
ok(/<SelectorProgresion modo=\{modoDeProgresion\(fitness\)\}/.test(tp), 'Tu Plan: el selector del modo');
const fv = leer('src/views/FitnessView.jsx');
ok(/const conProp = conPropuestas\(fitness \|\| \{\}, r\.sesion\);/.test(fv) && fv.indexOf('prepararSesionNueva(fitness') < fv.indexOf('conPropuestas(fitness'), 'Las propuestas se calculan al empezar, después de las comprobaciones de la Fase 4 (que no cambian)');
const fuenteProg = leer('src/lib/progresion.js');
const seccion = fuenteProg.slice(fuenteProg.indexOf('FITNESS 5/8 — LOS MODOS DE PROGRESIÓN'), fuenteProg.indexOf('6 · LO QUE NO SE CONSTRUYE'));
ok(seccion.length > 1000 && !/hecho\s*:/.test(seccion.replace(/\/\*[\s\S]*?\*\//g, '').replace(/resultadoFrenteAPropuesta[\s\S]*$/, '')), 'El motor de propuestas no escribe `hecho` en ninguna parte');
ok(!/from '\.\/(cumplimientoFitness|completarEntrenamiento)'/.test(fuenteProg), 'Y no toca la recuperación de la Fase 4');
ok(DECISIONES_FASE5.map((d) => d.id).join() === 'PD-13,AJ-20,AJ-21,AJ-22', 'Las decisiones de la fase, declaradas');

console.log(`\n${fallos ? '✗' : '✓'} ${total - fallos}/${total} comprobaciones`);
process.exit(fallos ? 1 : 0);
