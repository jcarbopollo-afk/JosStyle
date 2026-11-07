/* ═══════════════════════════════════════════════════════════════════════════
   Fitness 6/8 — las anotaciones por ejercicio (prompt 6 §12)
   ═══════════════════════════════════════════════════════════════════════════
   Todo con fechas fijas: ninguna comprobación depende del día en que se pase. */

import fs from 'node:fs';
import {
  empezarSesion, editarSerie, marcarSerie, ejerciciosDeSesion, notaDeEjercicio, guardarSesion,
  normalizarFitnessConSesiones, anadirEjercicioASesion,
} from '../src/lib/entrenamiento.js';
import {
  notasDeLinea, notaAnterior, anotacionesDeEjercicio, indicacionDeLinea, esUnicoEnSesion,
  TEXTOS_ANOTACIONES, DECISIONES_FASE6,
} from '../src/lib/anotacionesFitness.js';
import { ejecucionesDeLinea, ejerciciosDeLineaEnSesiones, conPropuestas, cambiarModoProgresion } from '../src/lib/progresion.js';
import { crearLinea, crearRutina, moverLinea, rutinaAPlan, planARutina, editarLinea } from '../src/lib/constructor.js';
import { duplicarPlantilla } from '../src/lib/plantillas.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { detalleDeSesion } from '../src/lib/historial.js';
import { completarEntrenamiento } from '../src/lib/completarEntrenamiento.js';
import { migrarFitness } from '../src/lib/persistenciaFitness.js';
import { migrarV2aV3 } from '../src/lib/migracionFitnessV3.js';

let fallos = 0;
let total = 0;
const ok = (c, msg) => { total += 1; if (c) console.log(`  ✓ ${msg}`); else { fallos += 1; console.log(`  ✗ ${msg}`); } };
const leer = (r) => fs.readFileSync(new URL(`../${r}`, import.meta.url), 'utf8');

/* ── Escenario ─────────────────────────────────────────────────────────── */
const PRESS = 'press-banca-barra';
const linea = (id, ex = PRESS, extra = {}) => ({ ...crearLinea({ exerciseId: ex, series: 2, repeticiones: 8, peso: 60, ...extra }), id });
const empezar = (lineas, plantillaId = 'PA', fecha = '2026-11-03', nombre = plantillaId) => empezarSesion({
  nombre, lineas, planId: plantillaId, origenTipo: 'plantilla', origenId: plantillaId, hoy: fecha, ahora: Date.parse(`${fecha}T10:00:00`),
});
/** Una sesión completada con una nota en cada ejercicio (`notas[i]`, '' = sin nota). */
function hecha(lineas, notas, { plantillaId = 'PA', fecha = '2026-11-01', id = `s-${fecha}-${plantillaId}`, quitarLineaId = false, nombre } = {}) {
  let s = { ...empezar(lineas, plantillaId, fecha, nombre || plantillaId), id };
  ejerciciosDeSesion(s).forEach((e, i) => {
    e.series.forEach((se) => { s = marcarSerie(editarSerie(s, e.id, se.id, { reps: 8, peso: 60 }), e.id, se.id, true); });
    if (notas[i]) s = notaDeEjercicio(s, e.id, notas[i]);
  });
  if (quitarLineaId) {
    s = { ...s, origen: { ...s.origen, ejercicios: ejerciciosDeSesion(s).map((e) => ({ ...e, linea: { ...e.linea, id: undefined } })) } };
  }
  return { ...s, estado: 'completada', terminadaEn: Date.parse(`${fecha}T11:00:00`) };
}
const ejDe = (s, i = 0) => ejerciciosDeSesion(s)[i];

console.log('\n── 1 · Escribir, editar y guardar una anotación (§4 y §10) ──');
const hoy = empezar([linea('L1'), linea('L2', 'remo-barra')]);
ok(ejerciciosDeSesion(hoy).every((e) => e.notas === ''), 'Al empezar, cada ejercicio tiene su anotación VACÍA');
const conNota = notaDeEjercicio(hoy, ejDe(hoy).id, '  Buen agarre hoy  ');
ok(ejDe(conNota).notas === 'Buen agarre hoy' && ejDe(conNota, 1).notas === '', 'Se escribe en ESE ejercicio (y el otro no se entera)');
const editada = notaDeEjercicio(conNota, ejDe(conNota).id, 'Mejor agarre; la última serie costó');
ok(ejDe(editada).notas === 'Mejor agarre; la última serie costó' && ejerciciosDeSesion(editada).length === 2, 'Editar sustituye el texto: no crea un segundo registro');
ok(JSON.stringify(ejDe(editada).series) === JSON.stringify(ejDe(hoy).series), 'No toca las series, los pesos ni las repeticiones');
ok(ejDe(notaDeEjercicio(editada, ejDe(editada).id, '   ')).notas === '', 'Dejarla vacía no deja una anotación artificial');
ok(notaDeEjercicio(hoy, 'no-existe', 'x') === hoy, 'Un ejercicio que no está en la sesión no cambia nada');
let f = { sesiones: [] };
f = guardarSesion(f, { ...hoy, estado: 'en_curso' });
f = guardarSesion(f, conNota);
f = guardarSesion(f, editada);
ok(f.sesiones.length === 1 && ejDe(f.sesiones[0]).notas === 'Mejor agarre; la última serie costó', '🚨 Guardar tres veces la misma sesión deja UNA, con la nota más reciente (sin duplicados por pulsación)');
const recargada = normalizarFitnessConSesiones(f);
ok(ejDe(recargada.sesiones[0]).notas === 'Mejor agarre; la última serie costó', 'Se guarda sin finalizar: una sesión en curso recargada conserva su nota');

console.log('\n── 2 · Finalizar conserva todas las anotaciones, y la nota general va aparte (§8) ──');
const fin = pasarAFinalizacion(editada, { ahora: Date.parse('2026-11-03T11:00:00') });
const g = guardarEntrenamiento(fin, { notas: 'Buen día en general', confirmado: true, ahora: Date.parse('2026-11-03T11:05:00') });
ok(g.ok && g.sesion.estado === 'completada' && ejDe(g.sesion).notas === 'Mejor agarre; la última serie costó', 'Al finalizar se conserva la anotación del ejercicio');
ok(g.sesion.notas === 'Buen día en general' && ejerciciosDeSesion(g.sesion).every((e) => e.notas !== 'Buen día en general'), 'La nota general (`sesion.notas`) va aparte y no se copia a ningún ejercicio');
const det0 = detalleDeSesion(g.sesion, { fitness: { sesiones: [g.sesion] }, propios: [], hoy: '2026-11-03' });
ok(det0.notas === 'Buen día en general' && det0.ejercicios[0].notas === 'Mejor agarre; la última serie costó' && det0.ejercicios[1].notas === '', 'El historial enseña cada una en su sitio');

console.log('\n── 3 · La nota de la última vez, y un campo nuevo vacío (§5) ──');
const historia = [
  hecha([linea('L1')], ['La última serie me costó bastante. Mejor descansar un poco más'], { fecha: '2026-10-20' }),
  hecha([linea('L1')], ['Subir el banco un punto'], { fecha: '2026-10-27' }),
  hecha([linea('L1')], [''], { fecha: '2026-11-01' }),
];
const fH = { sesiones: historia };
const nueva = empezar([linea('L1')]);
const an = anotacionesDeEjercicio(fH, nueva, ejDe(nueva));
ok(an.anterior && an.anterior.texto === 'Subir el banco un punto' && an.anterior.fecha === '2026-10-27' && an.anterior.fechaTexto, '🚨 Se recupera la última anotación de esa línea, con su fecha (AN-02: la del 1/11 no tenía nota)');
ok(ejDe(nueva).notas === '', '🚨 …y la de hoy empieza vacía: no se copia nada');
ok(an.anteriores.map((n) => n.fecha).join() === '2026-10-27,2026-10-20', '🚨 Las anteriores, de la más reciente a la más antigua (§6), y sin las ejecuciones sin nota');
ok(notaAnterior(fH, nueva, ejDe(nueva)).sesionId === historia[1].id, '…y cada una sigue apuntando a su sesión');
ok(notaAnterior({ sesiones: [] }, nueva, ejDe(nueva)) === null && anotacionesDeEjercicio({ sesiones: [] }, nueva, ejDe(nueva)).anteriores.length === 0, 'Sin nota anterior: nada (no se pinta un bloque vacío)');
const escribirHoy = notaDeEjercicio(nueva, ejDe(nueva).id, 'Hoy mejor');
ok(JSON.stringify(fH.sesiones.map((s) => ejDe(s).notas)) === JSON.stringify(['La última serie me costó bastante. Mejor descansar un poco más', 'Subir el banco un punto', '']), 'Escribir la nota de hoy no toca ninguna sesión anterior');
ok(anotacionesDeEjercicio(fH, escribirHoy, ejDe(escribirHoy)).anterior.texto === 'Subir el banco un punto', '…y la nota anterior sigue siendo la de antes');
const enCurso = { ...hecha([linea('L1')], ['No cuenta'], { fecha: '2026-11-02' }), estado: 'en_curso' };
ok(notaAnterior({ sesiones: [...historia, enCurso] }, nueva, ejDe(nueva)).texto === 'Subir el banco un punto', 'Una sesión sin terminar no es «la última vez»');

console.log('\n── 4 · Plantillas distintas, duplicadas y eliminadas (§9) ──');
const fAB = { sesiones: [hecha([linea('LA')], ['De Push A'], { plantillaId: 'PUSH-A' }), hecha([linea('LB')], ['De Push B'], { plantillaId: 'PUSH-B', fecha: '2026-11-02' })] };
const enA = empezar([linea('LA')], 'PUSH-A');
ok(notaAnterior(fAB, enA, ejDe(enA)).texto === 'De Push A', 'Push A solo ve las notas de Push A (aunque Push B sea más reciente)');
const plantilla = rutinaAPlan(crearRutina({ id: 'PA', nombre: 'Push A', lineas: [linea('L1')] }));
const dup = duplicarPlantilla([plantilla], 'PA', '2026-11-03');
const enCopia = empezar(planARutina(dup.copia).lineas, dup.copia.id);
ok(dup.ok && anotacionesDeEjercicio(fH, enCopia, ejDe(enCopia)).anteriores.length === 0, '🚨 Una plantilla duplicada no hereda las notas de la original (su propia identidad)');
ok(notasDeLinea(fH, nueva, ejDe(nueva)).length === 2, '…y la original sigue con las suyas');
/* Borrar la plantilla: las sesiones no se tocan (las notas viven en ellas). */
const detBorrada = detalleDeSesion(historia[1], { fitness: { ...fH, plantillas: [] }, propios: [], hoy: '2026-11-03' });
ok(detBorrada.ejercicios[0].notas === 'Subir el banco un punto' && detBorrada.ejercicios[0].notasAnteriores.length === 1, '🚨 Con la plantilla eliminada, el historial sigue enseñando su nota y las de antes');
const editadaPl = editarLinea(planARutina(plantilla), 'L1', { notas: 'Codos a 45°', series: 4 });
const trasEditar = empezar(editadaPl.lineas);
ok(notaAnterior(fH, trasEditar, ejDe(trasEditar)).texto === 'Subir el banco un punto', 'Editar la plantilla (series, su nota) no cambia de quién son las notas');
const renombrada = empezar([linea('L1')], 'PA', '2026-11-03', 'Empuje');
const anR = anotacionesDeEjercicio(fH, renombrada, ejDe(renombrada));
ok(anR.anterior.texto === 'Subir el banco un punto' && anR.anterior.entrenamiento === 'PA', 'Renombrada, se sigue encontrando, y se dice con qué nombre se hizo entonces (§6)');
ok(anotacionesDeEjercicio(fH, nueva, ejDe(nueva)).anterior.entrenamiento === '', '…y si se llamaba igual, no se repite el nombre');

console.log('\n── 5 · Dos líneas del mismo ejercicio y ejercicios reordenados (§9) ──');
const dos = [linea('P1'), linea('P2')];
const fDos = { sesiones: [hecha(dos, ['Pesado, a 5', 'Ligero, a 12'])] };
const hoyDos = empezar(dos);
ok(notaAnterior(fDos, hoyDos, ejDe(hoyDos, 0)).texto === 'Pesado, a 5' && notaAnterior(fDos, hoyDos, ejDe(hoyDos, 1)).texto === 'Ligero, a 12', '🚨 Dos líneas con el mismo ejercicio: cada una con su nota (por `linea.id`)');
const reord = moverLinea(crearRutina({ nombre: 'A', lineas: dos }), 'P2', 'arriba').lineas;
const hoyReord = empezar(reord);
ok(notaAnterior(fDos, hoyReord, ejDe(hoyReord, 0)).texto === 'Ligero, a 12' && notaAnterior(fDos, hoyReord, ejDe(hoyReord, 1)).texto === 'Pesado, a 5', '🚨 Reordenados: la nota sigue a su línea, no a la posición');
const sust = hecha([linea('L1')], ['Era con mancuernas']);
const sustituida = { ...sust, origen: { ...sust.origen, ejercicios: ejerciciosDeSesion(sust).map((e) => ({ ...e, exerciseId: 'press-banca-mancuernas' })) } };
ok(notaAnterior({ sesiones: [sustituida] }, nueva, ejDe(nueva)) === null, 'Si aquella vez se sustituyó el ejercicio en esa línea, su nota no sale como del press de banca');

console.log('\n── 6 · Sesiones antiguas sin id de línea (§9, AN-04) ──');
const vieja = hecha([linea('L1')], ['Nota de antes de la fase 5'], { quitarLineaId: true });
ok(!ejDe(vieja).linea.id && notaAnterior({ sesiones: [vieja] }, nueva, ejDe(nueva)).texto === 'Nota de antes de la fase 5', 'Inequívoca (un solo press en las dos): se asocia');
const viejaDoble = hecha(dos, ['A', 'B'], { quitarLineaId: true });
ok(notaAnterior({ sesiones: [viejaDoble] }, hoyDos, ejDe(hoyDos, 0)) === null && notaAnterior({ sesiones: [viejaDoble] }, hoyDos, ejDe(hoyDos, 1)) === null, '🚨 Ambigua (dos del mismo ejercicio): no se asigna a ninguna línea');
const detVieja = detalleDeSesion(viejaDoble, { fitness: { sesiones: [viejaDoble] }, propios: [], hoy: '2026-11-03' });
ok(detVieja.ejercicios.map((e) => e.notas).join() === 'A,B', '…pero no se pierde: su sesión la sigue enseñando en el historial');
ok(!esUnicoEnSesion(hoyDos, ejDe(hoyDos)) && esUnicoEnSesion(nueva, ejDe(nueva)), '(la regla de «es el único» de la sesión de hoy)');
const anadido = anadirEjercicioASesion(nueva, 'remo-barra');
const ejAnadido = ejerciciosDeSesion(anadido).find((e) => e.exerciseId === 'remo-barra');
ok(ejAnadido && ejAnadido.linea === null && notasDeLinea({ sesiones: [hecha([linea('LR', 'remo-barra')], ['x'])] }, anadido, ejAnadido).length === 0, 'Un ejercicio añadido durante la sesión (sin línea) no hereda notas de nadie');

console.log('\n── 7 · El historial de una fecha: su nota y las de ANTES (§7) ──');
const det27 = detalleDeSesion(historia[1], { fitness: fH, propios: [], hoy: '2026-11-03' });
ok(det27.ejercicios[0].notas === 'Subir el banco un punto' && det27.ejercicios[0].notasAnteriores.map((n) => n.fecha).join() === '2026-10-20', '🚨 El detalle del 27/10 enseña su nota y solo las anteriores a esa fecha (no las del futuro)');
const det20 = detalleDeSesion(historia[0], { fitness: fH, propios: [], hoy: '2026-11-03' });
ok(det20.ejercicios[0].notasAnteriores.length === 0, '…y la primera, ninguna');
const mismoDia = [hecha([linea('L1')], ['Mañana'], { fecha: '2026-10-20', id: 'a' }), { ...hecha([linea('L1')], ['Tarde'], { fecha: '2026-10-20', id: 'b' }), terminadaEn: Date.parse('2026-10-20T19:00:00') }];
const detTarde = detalleDeSesion(mismoDia[1], { fitness: { sesiones: mismoDia }, propios: [], hoy: '2026-11-03' });
ok(detTarde.ejercicios[0].notasAnteriores.map((n) => n.texto).join() === 'Mañana', 'Dos el mismo día (de antes de la regla de una por día): la de la tarde ve la de la mañana, no al revés');

console.log('\n── 8 · Notas permanentes de la plantilla (§8, AN-03) ──');
const conIndicacion = empezar([linea('L1', PRESS, { notas: 'Codos a 45°, escápulas atrás' })]);
ok(ejDe(conIndicacion).linea.indicacion === 'Codos a 45°, escápulas atrás' && indicacionDeLinea(ejDe(conIndicacion)) === 'Codos a 45°, escápulas atrás', 'La nota de la línea de la plantilla viaja como indicación, aparte');
ok(ejDe(conIndicacion).notas === '', '🚨 …y NUNCA se copia a la anotación de la ejecución');
const yaHecha = { ...hecha([linea('L1', PRESS, { notas: 'Codos a 45°' })], ['']), id: 'con-indicacion' };
ok(notasDeLinea({ sesiones: [yaHecha] }, nueva, ejDe(nueva)).length === 0, '…ni se lee luego como una nota de aquel día');
ok(detalleDeSesion(yaHecha, { fitness: { sesiones: [yaHecha] }, propios: [], hoy: '2026-11-03' }).ejercicios[0].notas === '', '…ni el historial la enseña como si fuera una observación realizada');
ok(anotacionesDeEjercicio({ sesiones: [] }, conIndicacion, ejDe(conIndicacion)).indicacion === 'Codos a 45°, escápulas atrás', 'El directo la recibe como indicación');

console.log('\n── 9 · «Completar entrenamiento», la progresión y los datos de antes ──');
const opcion = { clave: 'plantilla|PA', nombre: 'PA', planId: 'PA', origenTipo: 'plantilla', origenId: 'PA', lineas: [linea('L1')], entorno: '' };
const comp = completarEntrenamiento({ sesiones: [] }, { opcion, fecha: '2026-11-02', hoy: '2026-11-03', ahora: Date.parse('2026-11-03T10:00:00') });
ok(comp.ok && ejerciciosDeSesion(comp.sesion).every((e) => e.notas === ''), '«Completar entrenamiento» no inventa anotaciones');
ok(notaAnterior({ sesiones: [...historia, comp.sesion] }, nueva, ejDe(nueva)).texto === 'Subir el banco un punto', '…y no tapa la nota anterior');
const fP = cambiarModoProgresion({ sesiones: historia }, 'experto');
ok(ejecucionesDeLinea(fP, { plantillaId: 'PA', ej: ejDe(nueva) }).length === 3 && ejerciciosDeLineaEnSesiones(fP, { plantillaId: 'PA', ej: ejDe(nueva) }).length === 3, 'La progresión y las anotaciones usan la MISMA correspondencia (una sola regla)');
ok(ejDe(conPropuestas(fP, nueva)).notas === '', 'Las propuestas de la Fase 5 no tocan la anotación');
const guardado = normalizarFitnessConSesiones({ sesiones: [yaHecha, ...historia] });
ok(guardado.sesiones.filter((s) => s.id !== 'con-indicacion').map((s) => ejDe(s).notas).join('|') === historia.map((s) => ejDe(s).notas).join('|') && ejDe(guardado.sesiones[0]).linea.indicacion === 'Codos a 45°', 'Regla 5: la carga conserva las anotaciones y la indicación');
const v1 = { version: 1, sesiones: historia, plantillas: [plantilla] };
const m = migrarFitness(v1);
ok(m.migrada && JSON.stringify(m.fitness.sesiones) === JSON.stringify(historia), 'Migración: no hay que mover ninguna nota (ya están en su sesión); M1 y M2 no tocan ninguna');
ok(JSON.stringify(migrarV2aV3({ sesiones: historia }).sesiones) === JSON.stringify(historia), '…y la M2 sola, tampoco');

console.log('\n── 10 · Interfaz ──');
const vivo = leer('src/views/EntrenamientoVivoView.jsx');
ok(/anotacionesDe = null,/.test(vivo) && /TEXTOS_ANOTACIONES\.anterior/.test(vivo) && /anotaciones\.anteriores\.length > 1/.test(vivo), 'Directo: la nota anterior con su fecha, y ⋯ solo si hay más de una');
ok(/<Plegable abierto=\{!!anotaciones\.anterior && antiguasDe === ejercicio\.id\}>/.test(vivo) && /aria-expanded=\{antiguasDe === ejercicio\.id\}/.test(vivo), '…las antiguas, voluntarias, en un desplegable (MS F10), con su `aria-expanded`');
ok(/anotaciones && \(anotaciones\.indicacion \|\| anotaciones\.anterior\) &&/.test(vivo), '…y sin bloque vacío si no hay nada');
ok(/addEventListener\('pagehide', guardarNotaPendiente\)/.test(vivo) && /visibilityState === 'hidden'\) guardarNotaPendiente\(\)/.test(vivo), '🚨 Una interrupción (salir al inicio del iPhone) guarda la nota pendiente');
ok(/maxLength=\{1000\}/.test(vivo), 'La nota tiene un tope razonable (1000), puesto al escribir: no se recorta nada guardado');
const fv = leer('src/views/FitnessView.jsx');
ok(/anotacionesDe=\{\(ej\) => anotacionesDeEjercicio\(fitness \|\| \{\}, enVivo, ej\)\}/.test(fv), 'Fitness le pasa las anotaciones con la sesión en curso');
const hv = leer('src/views/HistorialView.jsx');
ok(/<NotasAnterioresHistorial notas=\{e\.notasAnteriores\} \/>/.test(hv), 'Historial: ⋯ con las notas anteriores de ese ejercicio');
ok(!/notas: texto\(l\.notas\)|notas: l\.notas/.test(leer('src/lib/entrenamiento.js')), 'Ningún sitio escribe la nota de la plantilla en la anotación de la ejecución');
ok(DECISIONES_FASE6.map((d) => d.id).join() === 'AN-01,AN-02,AN-03,AN-04' && TEXTOS_ANOTACIONES.tituloAnteriores === 'Notas anteriores', 'Las decisiones de la fase, declaradas');

console.log(`\n${fallos ? '✗' : '✓'} ${total - fallos}/${total} comprobaciones`);
process.exit(fallos ? 1 : 0);
