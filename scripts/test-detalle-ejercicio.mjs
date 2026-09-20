/* Entrega 4 · FIT F29/45 — Análisis avanzado de rendimiento por ejercicio.
   ═══════════════════════════════════════════════════════════════════════════
   Las 22 pruebas del apartado 37, más lo que esta fase promete y hay que poder
   poner rojo:

   1. Que NO haya lógica de progreso nueva: todo sale de la F11 y llega por la
      F12 (contexto y apartados 8 y 39).
   2. Que no se guarde nada (apartado 32).
   3. Que el periodo filtre la gráfica y NO el historial (apartado 12).
   4. Que el selector de métrica no aparezca con una sola métrica (apartado 11),
      y que al cambiarla cambie la unidad (apartado 10).
   5. Que un punto descartado se DIGA (apartado 29) — con su falsificación.
   6. Que un ejercicio archivado conserve nombre, resultados y fechas (28). */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  YA_LO_RESUELVE, PERIODOS_EJERCICIO, PERIODO_PREFERIDO, periodoPorDefecto,
  EJERCICIO_ARCHIVADO, TEXTO_ARCHIVADO, cabeceraDeEjercicio,
  metricasDisponibles, metricaElegida, AVISO_VARIANTE, variantesDelEjercicio,
  VER_HISTORIAL_RANGO, rangoDelEjercicio, OBJETIVO_CONSEGUIDO, objetivoDelEjercicio,
  ENTRENAMIENTO_PARCIAL, historialDelEjercicio, AVISO_CORRUPTOS, CORRUPTOS_SIGNIFICATIVOS,
  descartadosDelGrafico, alternativaTextual, ESTADOS_DETALLE, estadoDetalle, VACIOS_DETALLE,
  estadoDelDetalle, ERROR_DETALLE, detalleCompletoDeEjercicio, NO_EN_FIT29, DECISIONES_FIT29,
  COMPONENTES_FIT29, AUDITORIA_FIT29, casillasDelDetalle, auditarDetalle,
} from '../src/lib/detalleEjercicio.js';
import {
  PERIODOS, periodo, PERIODO_TODO, RANGOS_GRAFICA, graficaDeProgreso, detalleDeProgreso,
  PUNTOS_MINIMOS_GRAFICA,
} from '../src/lib/progresoEjercicios.js';
import { progresoDeEjercicio, aparicionesDeEjercicio } from '../src/lib/progresion.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion, quitarSerie, anadirSerie,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS, crearWorkoutExercise } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { anadirObjetivo } from '../src/lib/objetivosProgreso.js';

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

const HOY = '2026-09-17';

/* ⚠️ La fábrica **lanza con el nombre del ejercicio** si el id no está en el
   catálogo: sin eso, `anadirEjercicio` no añade nada y revienta doce llamadas
   más abajo con `Cannot read properties of undefined` (FIT F22). */
function sesion(exerciseId, valores, fecha, cambios = {}, extra = {}) {
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  if (!r.lineas.length) throw new Error(`«${exerciseId}» no está en el catálogo de ejercicios`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: extra.nombre || exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (v === 'omitir') { s = quitarSerie(s, e.id, e.series[i].id); return; }
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  /* Apartado 18 — una serie AÑADIDA, que no estaba en el plan. */
  if (extra.anadir) {
    s = anadirSerie(s, ejerciciosDeSesion(s)[0].id);
    const ex = ejerciciosDeSesion(s)[0];
    const ultima = ex.series[ex.series.length - 1];
    s = editarSerie(s, ex.id, ultima.id, extra.anadir);
    s = marcarSerie(s, ex.id, ultima.id, true);
  }
  let f = pasarAFinalizacion(s, { ahora: inicio + 3600000 });
  if (extra.nota) f = { ...f, notas: extra.nota };
  return guardarEntrenamiento(f, { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const r = (reps, peso = null) => ({ reps, peso });
const seg = (duracion) => ({ duracion });

console.log('\n═══ FIT F29/45 · Análisis avanzado de rendimiento por ejercicio ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Sin datos, un registro, dos y muchos (pruebas 1-4, apartado 36) ──');

const VACIO = { ...DEFAULT_FITNESS };
const dv = detalleCompletoDeEjercicio(VACIO, 'dominada-prona', { hoy: HOY });
ok(dv.estado === 'sin_datos' && dv.vacio === VACIOS_DETALLE.sin_datos,
  `Prueba 1 · Sin datos: «${dv.estado}», con su frase`);
ok(dv.progreso.ultima === null && dv.grafica.mostrar === false && dv.historial.length === 0,
  '…sin última marca, sin gráfica y sin historial');
ok(dv.rango.hay === false && !!dv.rango.vacio && dv.objetivo.hay === false,
  '🚨 …y sin rango: «Sin Rango», nunca el rango 1 (FIT F15)');

const UNO = con(sesion('dominada-prona', [r(8)], '2026-09-10', { tipoCarga: 'corporal' }));
const d1 = detalleCompletoDeEjercicio(UNO, 'dominada-prona', { hoy: HOY });
ok(d1.estado === 'primer_registro', `Prueba 2 · Un registro: «${d1.estado}»`);
ok(d1.progreso.ultima !== null && d1.progreso.comparacion === null && d1.progreso.soloUna === true,
  '🚨 …se enseña el resultado, pero NO se inventa una tendencia (apartado 13)');
ok(d1.grafica.mostrar === false && /tres registros/.test(d1.grafica.motivo),
  '…y sin gráfica, diciendo por qué');

const DOS = con(
  sesion('dominada-prona', [r(8)], '2026-09-01', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(10)], '2026-09-12', { tipoCarga: 'corporal' }),
);
const d2 = detalleCompletoDeEjercicio(DOS, 'dominada-prona', { hoy: HOY });
ok(d2.estado === 'pocos_registros' && d2.progreso.comparacion !== null,
  `Prueba 3 · Dos registros: «${d2.estado}», ya con comparación`);
ok(d2.progreso.comparacion.resultado === '+2 reps' && d2.tendencia.nombre === 'Mejorando',
  `…«${d2.progreso.comparacion.resultado}» y «${d2.tendencia.nombre}», los de la F11`);

const MUCHOS = con(
  sesion('press-banca-barra', [r(8, 60), r(8, 60)], '2026-07-02'),
  sesion('press-banca-barra', [r(8, 62.5), r(8, 62.5)], '2026-07-20'),
  sesion('press-banca-barra', [r(10, 62.5), r(9, 62.5)], '2026-08-12'),
  sesion('press-banca-barra', [r(10, 65), r(8, 65)], '2026-09-05'),
);
const dm = detalleCompletoDeEjercicio(MUCHOS, 'press-banca-barra', { hoy: HOY });
ok(dm.estado === 'suficientes' && dm.grafica.mostrar === true && dm.grafica.puntos.length === 4,
  `Prueba 4 · Muchos registros: «${dm.estado}», con ${dm.grafica.puntos.length} puntos`);
ok(dm.error === null && dm.veces === 4 && dm.historial.length === 4,
  '…sin error, con sus cuatro sesiones en el historial');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Cada clase de ejercicio conserva SU unidad (pruebas 5-9, apartados 10 y 30) ──');

ok(dm.grafica.unidad === 'kg' && /peso/i.test(dm.grafica.etiqueta),
  `Prueba 5 · Carga: la gráfica va en «${dm.grafica.unidad}»`);
ok(d2.grafica.unidad !== 'kg' && dm.progreso.medida === 'Peso y repeticiones',
  'Prueba 6 · Repeticiones: NO se miden en kg');

const ISO = con(
  sesion('plancha-frontal', [seg(30)], '2026-08-01'),
  sesion('plancha-frontal', [seg(40)], '2026-08-20'),
  sesion('plancha-frontal', [seg(52)], '2026-09-10'),
);
const diso = detalleCompletoDeEjercicio(ISO, 'plancha-frontal', { hoy: HOY });
ok(diso.grafica.unidad === 's' && diso.grafica.mostrar === true,
  `Prueba 7 · Isométricos: se miden en «${diso.grafica.unidad}», no en repeticiones`);
ok(/52/.test(diso.progreso.ultima.texto) && diso.tendencia.nombre === 'Mejorando',
  `…y su última marca es «${diso.progreso.ultima.texto}»`);

const EXP = con(
  sesion('sentadilla-salto', [r(12)], '2026-08-05', { tipoCarga: 'corporal' }),
  sesion('sentadilla-salto', [r(15)], '2026-08-25', { tipoCarga: 'corporal' }),
  sesion('sentadilla-salto', [r(18)], '2026-09-12', { tipoCarga: 'corporal' }),
);
const dexp = detalleCompletoDeEjercicio(EXP, 'sentadilla-salto', { hoy: HOY });
ok(dexp.grafica.mostrar === true && dexp.error === null,
  'Prueba 8 · Explosivos: se miden como lo que son, sin caso especial');

const SKILL = con(
  sesion('dragon-flag', [r(3)], '2026-08-05', { tipoCarga: 'corporal' }),
  sesion('dragon-flag', [r(5)], '2026-08-25', { tipoCarga: 'corporal' }),
  sesion('dragon-flag', [r(6)], '2026-09-12', { tipoCarga: 'corporal' }),
);
const dsk = detalleCompletoDeEjercicio(SKILL, 'dragon-flag', { hoy: HOY });
ok(dsk.grafica.mostrar === true && dsk.cabecera.existe === true,
  'Prueba 9 · Skills: igual, y con su ficha del catálogo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Variantes: separadas ya, y se DICE (prueba 10, apartados 20 y 21) ──');

const VAR = con(
  sesion('dominada-prona', [r(8)], '2026-09-01', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(10)], '2026-09-12', { tipoCarga: 'corporal' }),
  sesion('dominada-supina', [r(12)], '2026-09-08', { tipoCarga: 'corporal' }),
);
const dvar = detalleCompletoDeEjercicio(VAR, 'dominada-prona', { hoy: HOY });
ok(dvar.variantes.hay === true && dvar.variantes.aviso === AVISO_VARIANTE,
  `🚨 Prueba 10 · «${AVISO_VARIANTE}»`);
ok(dvar.variantes.otras.some((v) => v.exerciseId === 'dominada-supina' && v.registros === 1),
  '…con la supina y cuántos registros tiene');
ok(dvar.progreso.veces === 2 && aparicionesDeEjercicio(VAR, 'dominada-supina').length === 1,
  '🚨 …y los historiales NO se mezclan: la prona tiene 2 y la supina 1 (apartado 20)');
ok(!dvar.variantes.otras.some((v) => v.exerciseId === 'dominada-prona'),
  '…la propia no se ofrece como variante de sí misma');
ok(!dvar.variantes.otras.some((v) => v.exerciseId === 'dominada-neutra'),
  '⚠️ …ni una variante SIN registros: llevaría a una pantalla vacía (regla 8)');

/* 🐛 **Y AL REVÉS, que es el caso del apartado 21 y el que estaba ROTO.**
   Estando EN la supina, la prona es su HERMANA: `variantesDe` solo baja, así
   que devolvía nada y el aviso no salía nunca justo cuando el usuario «cambia
   de variante». Lo cazó el recorrido, no esta suite — que solo miraba desde la
   base. La familia es la raíz más sus variantes. */
const dvarHija = detalleCompletoDeEjercicio(VAR, 'dominada-supina', { hoy: HOY });
ok(dvarHija.variantes.hay === true,
  '🚨 …y ESTANDO EN UNA VARIANTE el aviso también sale: es el caso del apartado 21');
ok(dvarHija.variantes.otras.some((v) => v.exerciseId === 'dominada-prona'),
  '🚨 …ofreciendo su HERMANA, que comparte base: «Dominadas / neutras / lastradas» son hermanas (apartado 20)');
ok(!dvarHija.variantes.otras.some((v) => v.exerciseId === 'dominada-supina'),
  '…y nunca a sí misma');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Series omitidas, añadidas y sesión parcial (pruebas 11-13, apartados 17, 18 y 19) ──');

const OMIT = con(sesion('press-banca-barra', [r(8, 60), r(8, 60), 'omitir'], '2026-09-10'));
const hOmit = historialDelEjercicio(OMIT, 'press-banca-barra', { hoy: HOY })[0];
ok(hOmit.omitidas === 1, `Prueba 11 · Una serie omitida se cuenta: ${hOmit.omitidas}`);
ok(hOmit.estado === 'realizado' && hOmit.estadoNombre === 'Realizado',
  `🚨 …y NO baja el estado: «${hOmit.estadoNombre}» — una omitida sale del denominador (FIT F7)`);
ok(hOmit.estadoNombre !== '' && hOmit.estadoNombre !== undefined,
  '🐛 …y el NOMBRE del estado llega: `resumenDeEjercicio` devuelve `estado`, no `estadoNombre`');
ok(aparicionesDeEjercicio(OMIT, 'press-banca-barra')[0].series.length === 2,
  '🚨 …una omitida NO cuenta como rendimiento: la F11 solo indexa las hechas (apartado 18)');

const ANADE = con(sesion('press-banca-barra', [r(8, 60), r(8, 60)], '2026-09-10', {}, { anadir: r(6, 60) }));
const hAnade = historialDelEjercicio(ANADE, 'press-banca-barra', { hoy: HOY })[0];
ok(hAnade.anadidas === 1, `Prueba 12 · Una serie añadida se distingue: ${hAnade.anadidas}`);
ok(hAnade.series.length === 3, '…y se enseña con las demás: «No ocultar los datos originales» (apartado 17)');

const PARCIAL = con(sesion('press-banca-barra', [r(8, 60), null, null], '2026-09-10'));
const hParcial = historialDelEjercicio(PARCIAL, 'press-banca-barra', { hoy: HOY })[0];
ok(hParcial.parcial === true && hParcial.avisoParcial === ENTRENAMIENTO_PARCIAL,
  `🚨 Prueba 13 · «${ENTRENAMIENTO_PARCIAL}»`);
ok(detalleCompletoDeEjercicio(PARCIAL, 'press-banca-barra', { hoy: HOY }).historial.length === 1,
  '🚨 …y NO se descarta automáticamente (apartado 19)');

const NOTA = con(sesion('press-banca-barra', [r(8, 60)], '2026-09-10', {}, { nota: 'Me sentí fuerte hoy.' }));
const hNota = historialDelEjercicio(NOTA, 'press-banca-barra', { hoy: HOY })[0];
ok(hNota.nota === 'Me sentí fuerte hoy.',
  `🚨 Apartado 27 · la nota, TAL CUAL: «${hNota.nota}»`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Objetivos (pruebas 14 y 15, apartados 23 y 24) ──');

const conObjetivo = anadirObjetivo(MUCHOS, { exerciseId: 'press-banca-barra', tipo: 'peso', valor: 80 },
  { ahora: new Date('2026-07-01T10:00:00').getTime() });
ok(conObjetivo.ok, 'Se puede crear un objetivo con la F14 (que es quien los crea)');
const dobj = detalleCompletoDeEjercicio(conObjetivo.fitness, 'press-banca-barra', { hoy: HOY });
ok(dobj.objetivo.hay === true && dobj.objetivo.conseguido === false,
  'Prueba 14 · Objetivo activo: se enseña, sin darlo por hecho');
ok(!!dobj.objetivo.texto && /65/.test(dobj.objetivo.texto),
  `…con el progreso que redacta la F14: «${dobj.objetivo.texto}»`);

const conHecho = anadirObjetivo(MUCHOS, { exerciseId: 'press-banca-barra', tipo: 'peso', valor: 62.5 },
  { ahora: new Date('2026-07-01T10:00:00').getTime() });
const dhecho = detalleCompletoDeEjercicio(conHecho.fitness, 'press-banca-barra', { hoy: HOY });
ok(dhecho.objetivo.conseguido === true && dhecho.objetivo.etiqueta === OBJETIVO_CONSEGUIDO,
  `Prueba 15 · Objetivo completado: «${OBJETIVO_CONSEGUIDO}»`);
ok(dhecho.objetivo.fecha !== '' && dhecho.objetivo.fecha !== HOY,
  `🚨 …con su fecha REAL, la de la sesión que lo superó, no la de hoy: «${dhecho.objetivo.fecha}» (apartado 24)`);
ok(!leer('src/lib/detalleEjercicio.js').includes('anadirObjetivo')
  && !leer('src/lib/detalleEjercicio.js').includes('crearObjetivo'),
  '🚨 …y aquí NO se crea ningún objetivo: «Utilizar ProgressGoal» (apartado 23)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Rango y tendencia (pruebas 16 y 17, apartados 3, 8, 25 y 26) ──');

ok(dm.rango.hay === true && !!dm.rango.nombre && typeof dm.rango.score === 'number',
  `Prueba 16 · El rango llega del RankEngine: «${dm.rango.nombre}» (${dm.rango.score})`);
ok(dm.rango.siguiente !== null && typeof dm.rango.siguiente.progreso === 'object',
  '…con la tarjeta del siguiente rango de la F23 (apartado 25)');
ok(dm.rango.ctaHistorial === VER_HISTORIAL_RANGO
  && dm.rango.destinoHistorial.tipo === 'exercise' && dm.rango.destinoHistorial.id === 'press-banca-barra',
  `🚨 …y «${VER_HISTORIAL_RANGO}» lleva al historial de la F22, no a uno nuevo (apartado 26)`);
ok(!!dm.rango.confianzaNombre,
  `⚠️ …y la confianza va al lado del rango: «${dm.rango.confianzaNombre}»`);

ok(dm.tendencia.nombre === dm.progreso.estadoNombre && dm.tendencia.simbolo === dm.progreso.simbolo,
  '🚨 Prueba 17 · La tendencia es EXACTAMENTE la de la F12: no hay una segunda');

const BAJA = con(
  sesion('remo-barra', [r(10, 60)], '2026-07-02'),
  sesion('remo-barra', [r(10, 55)], '2026-09-05'),
);
ok(detalleCompletoDeEjercicio(BAJA, 'remo-barra', { hoy: HOY }).tendencia.estado !== 'mejora',
  '…y bajando NO dice que mejora');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Historial y ejercicio archivado (pruebas 18 y 19, apartados 16 y 28) ──');

ok(dm.historial.every((h) => h.fecha && h.resumen && Array.isArray(h.series)),
  'Prueba 18 · Cada entrada trae fecha, resultado y series (apartado 16)');
ok(dm.historial[0].series.every((s) => /^Serie \d+ —/.test(s)),
  '🚨 …y las series van NUMERADAS como el historial, no por posición (FIT F12)');
ok(dm.historial[0].fecha > dm.historial[1].fecha, '…de la más reciente a la más antigua');

/* ⚠️ Un ejercicio que NO está en el catálogo, pero sí en sesiones guardadas:
   se fabrica a mano, porque el constructor —con toda la razón— se niega a
   añadir un id que no existe.

   🐛 Y los ejercicios de una sesión viven en **`sesion.origen.ejercicios`**,
   que es el snapshot de la F7: `sesion.ejercicios` existe y está VACÍO, así que
   tocar ése no cambia nada y la prueba mide sobre un escenario que no se ha
   construido (FIT F8). Lo dice `ejerciciosDeSesion`, que es quien lo lee. */
const cambiarEjercicios = (fitness, fn) => ({
  ...fitness,
  sesiones: fitness.sesiones.map((s, i) => ({ ...s, origen: { ...s.origen, ejercicios: fn(s.origen.ejercicios, i) } })),
});
const ARCH = cambiarEjercicios(
  con(sesion('press-banca-barra', [r(8, 60), r(8, 60)], '2026-08-10')),
  (ejs) => ejs.map((e) => ({ ...e, exerciseId: 'press-antiguo', nombre: 'Press antiguo' })),
);
ok(ejerciciosDeSesion(ARCH.sesiones[0]).length === 1
  && ejerciciosDeSesion(ARCH.sesiones[0])[0].exerciseId === 'press-antiguo',
  '⚠️ El escenario del archivado se ha construido de verdad (se comprueba antes de medir sobre él)');
const darch = detalleCompletoDeEjercicio(ARCH, 'press-antiguo', { hoy: HOY });
ok(darch.cabecera.existe === false && darch.cabecera.aviso === EJERCICIO_ARCHIVADO,
  `🚨 Prueba 19 · «${EJERCICIO_ARCHIVADO}»`);
ok(darch.cabecera.avisoTexto === TEXTO_ARCHIVADO && darch.estado === 'archivado',
  '…con su explicación, y en el estado que le toca (apartado 36)');
ok(darch.veces === 1 && darch.historial.length === 1 && darch.historial[0].fecha === '2026-08-10',
  '🚨 …y los datos históricos NO se borran: su resultado y su fecha siguen (apartado 28)');
/* 🚨 C-36 — el apartado 28 pide conservar el «nombre histórico» y **no existe**:
   la FIT F3 decidió que una línea guarda solo `exerciseId`, para que renombrar
   un ejercicio llegue a las veinte rutinas donde esté (AS F1). Lo único que
   sobrevive es el id, y es lo que se enseña. */
ok(darch.cabecera.nombre === 'press-antiguo',
  `🚨 …identificado por su id, que es lo ÚNICO que sobrevive: «${darch.cabecera.nombre}» (C-36)`);
ok(!('nombre' in crearWorkoutExercise({ exerciseId: 'press-banca-barra' })),
  '⚠️ …porque `crearWorkoutExercise` NO guarda nombre, a propósito (FIT F3)');
ok(aparicionesDeEjercicio(ARCH, 'press-antiguo')[0].nombre === 'press-antiguo',
  '…y la F11 tampoco lo guarda: `nombre: ej ? ej.nombre : exerciseId`');
ok(cabeceraDeEjercicio('lo-que-sea', { apariciones: [] }).nombre === 'lo-que-sea',
  '…y sin ni una aparición se cae al id igual, nunca a un nombre inventado');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Datos corruptos (prueba 20, apartado 29) ──');

const dc0 = descartadosDelGrafico(aparicionesDeEjercicio(MUCHOS, 'press-banca-barra'), dm.grafica, { rango: dm.periodo, hoy: HOY });
ok(dc0.cuantos === 0 && dc0.aviso === '',
  'Con todo bien, ni un descarte y ni un aviso (no se avisa de lo que no pasa)');

/* 🚨 Y la falsificación: una prueba que no puede ponerse roja no sirve
   (EH F42). Se le da una gráfica a la que le FALTA un punto. */
const apMuchos = aparicionesDeEjercicio(MUCHOS, 'press-banca-barra');
const graficaCoja = { ...dm.grafica, puntos: dm.grafica.puntos.slice(1) };
const dc1 = descartadosDelGrafico(apMuchos, graficaCoja, { rango: dm.periodo, hoy: HOY });
ok(dc1.cuantos === 1 && dc1.significativo === true && dc1.aviso === AVISO_CORRUPTOS(1),
  `🚨 Prueba 20 · Con un punto fuera, se DICE: «${dc1.aviso}»`);
ok(descartadosDelGrafico(apMuchos, { ...dm.grafica, puntos: [] }, { rango: dm.periodo, hoy: HOY }).aviso === AVISO_CORRUPTOS(4),
  '…y con cuatro, en plural');
ok(CORRUPTOS_SIGNIFICATIVOS === 1,
  '⚠️ …y uno YA es significativo: un punto que desaparece en silencio miente por omisión');

/* Y que el gráfico NO se rompe entero por un valor inválido (apartado 29).
   ⚠️ También por `origen.ejercicios`: antes tocaba `sesion.ejercicios`, que
   está vacío, así que esta comprobación salía VERDE sin haber corrompido nada
   — un verde por no haber mirado es peor que un rojo (NAV F4). */
const LIMPIA = con(
  sesion('press-banca-barra', [r(8, 60)], '2026-07-02'),
  sesion('press-banca-barra', [r(8, 62.5)], '2026-08-12'),
  sesion('press-banca-barra', [r(10, 65)], '2026-09-05'),
);
const CORRUPTA = cambiarEjercicios(LIMPIA, (ejs, i) => (i !== 1 ? ejs : ejs.map((e) => ({
  ...e,
  series: e.series.map((x) => ({ ...x, hecho: { ...x.hecho, peso: Number.NaN } })),
}))));
const puntosLimpios = detalleCompletoDeEjercicio(LIMPIA, 'press-banca-barra', { rango: PERIODO_TODO, hoy: HOY }).grafica.puntos.length;
const dcorr = detalleCompletoDeEjercicio(CORRUPTA, 'press-banca-barra', { rango: PERIODO_TODO, hoy: HOY });
ok(puntosLimpios === 3, `El escenario limpio tiene ${puntosLimpios} puntos (se comprueba antes de corromperlo)`);
ok(dcorr.error === null,
  '🚨 Un peso inválido NO rompe nada: la pantalla se calcula entera (apartado 29)');
ok(dcorr.grafica.puntos.length === puntosLimpios - 1,
  `…y afecta SOLO a ese punto de esta métrica: quedan ${dcorr.grafica.puntos.length} de ${puntosLimpios}`);
ok(dcorr.grafica.mostrar === false && !!dcorr.grafica.motivo,
  `⚠️ …y al bajar del mínimo se DICE por qué, en vez de dejar un hueco: «${dcorr.grafica.motivo}»`);

/* 🐛 Y AQUÍ EL HALLAZGO, medido: un peso no finito **no llega nunca a la
   gráfica como NaN**. `numeroONull` lo deja en `null` al construir la serie, así
   que la aparición se reclasifica de «carga» a «repeticiones» y el registro
   **no se pierde: cambia de métrica**. Es mejor que descartarlo, y es lo que
   hace que el aviso de descartes sea defensivo y no un caso normal. */
const apCorr = aparicionesDeEjercicio(CORRUPTA, 'press-banca-barra');
ok(apCorr.length === 3,
  `🚨 …y el registro NO se pierde: siguen las ${apCorr.length} sesiones (apartado 29)`);
ok(apCorr.find((a) => a.fecha === '2026-08-12').clase === 'repeticiones',
  '🚨 …se RECLASIFICA a «repeticiones», porque sin peso válido eso es lo que es');
ok(detalleCompletoDeEjercicio(CORRUPTA, 'press-banca-barra', { rango: PERIODO_TODO, hoy: HOY }).hayselector === true,
  '…y por eso aparece el selector: el dato sigue ahí, bajo su otra métrica');
ok(dcorr.descartados.cuantos === 0,
  '⚠️ …así que no se avisa de un descarte que no ha pasado: el aviso es defensivo, no un caso normal');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Los periodos (prueba 21, apartado 12) ──');

ok(PERIODOS_EJERCICIO.length === 6, `Prueba 21 · Son seis: ${PERIODOS_EJERCICIO.map((p) => p.nombre).join(', ')}`);
ok(['7d', '30d', '3m', '6m', '1a', 'todo'].every((id) => PERIODOS_EJERCICIO.some((p) => p.id === id)),
  '…7 días, 30 días, 3 meses, 6 meses, 1 año y Todo');
ok(PERIODOS_EJERCICIO === PERIODOS,
  '🚨 …y SON los del catálogo de la F12, no una copia: con dos, «3 meses» valdría una cosa aquí y otra allí');
ok(RANGOS_GRAFICA.length === 4 && RANGOS_GRAFICA.every((p) => PERIODOS.some((q) => q.id === p.id)),
  '⚠️ …y los cuatro de la F28 son un SUBCONJUNTO declarado por ids del mismo catálogo');

ok(periodoPorDefecto(apMuchos, { hoy: HOY }) === PERIODO_PREFERIDO,
  `Con datos suficientes se entra por «${PERIODO_PREFERIDO}» (3 meses)`);
ok(periodoPorDefecto(aparicionesDeEjercicio(UNO, 'dominada-prona'), { hoy: HOY }) === PERIODO_TODO,
  '🚨 …y sin ellos por «Todo»: entrar en 3 meses y ver el hueco sería empezar por la pantalla vacía');
ok(periodoPorDefecto([], { hoy: HOY }) === PERIODO_TODO, '…y sin ninguna aparición, «Todo»');

const d7 = detalleCompletoDeEjercicio(MUCHOS, 'press-banca-barra', { rango: '7d', hoy: HOY });
ok(d7.grafica.puntos.length < dm.grafica.puntos.length,
  `🚨 Un periodo corto recorta la GRÁFICA: ${d7.grafica.puntos.length} puntos frente a ${dm.grafica.puntos.length}`);
ok(d7.historial.length === 4,
  '🚨 …y NO el historial: el periodo filtra lo que se dibuja, no lo que hizo (apartado 12)');
ok(d7.rango.nombre === dm.rango.nombre,
  '🚨 …ni el rango: la puntuación es la mejor de las últimas cinco (FIT F22, apartado 23)');
ok(d7.objetivo.hay === dm.objetivo.hay, '…ni los objetivos');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Cambio de métrica (prueba 22, apartados 10 y 11) ──');

ok(metricasDisponibles(apMuchos).length === 1 && dm.hayselector === false,
  '🚨 Prueba 22 · Con UNA sola métrica no hay selector: «No mostrar selectores inútiles» (apartado 11)');

/* Con lastre y sin lastre son dos clases distintas para la F11. */
const DOSMETRICAS = con(
  sesion('dominada-lastrada', [r(8)], '2026-07-05', { tipoCarga: 'corporal' }),
  sesion('dominada-lastrada', [r(9)], '2026-07-25', { tipoCarga: 'corporal' }),
  sesion('dominada-lastrada', [r(6, 10)], '2026-08-15', { tipoCarga: 'lastre' }),
  sesion('dominada-lastrada', [r(7, 10)], '2026-09-08', { tipoCarga: 'lastre' }),
);
const apDos = aparicionesDeEjercicio(DOSMETRICAS, 'dominada-lastrada');
const metricas = metricasDisponibles(apDos);
ok(metricas.length === 2, `Con lastre y sin él hay DOS métricas: ${metricas.map((m) => m.nombre).join(' / ')}`);
ok(metricas.every((m) => m.registros === 2), '…y cada una dice cuántos registros tiene');

const dmet = detalleCompletoDeEjercicio(DOSMETRICAS, 'dominada-lastrada', { rango: PERIODO_TODO, hoy: HOY });
ok(dmet.hayselector === true, '🚨 …y AHÍ sí aparece el selector (apartado 11)');
ok(dmet.metrica === apDos[0].clase, '…empezando por la de la última vez, que es lo que decidió la F12');

const otra = metricas.find((m) => m.id !== dmet.metrica).id;
const dotra = detalleCompletoDeEjercicio(DOSMETRICAS, 'dominada-lastrada', { rango: PERIODO_TODO, metrica: otra, hoy: HOY });
ok(dotra.metrica === otra && dotra.grafica.clase === otra,
  `🚨 Al pedir «${otra}», la gráfica cambia de clase`);
ok(dotra.grafica.unidad !== dmet.grafica.unidad || dotra.grafica.etiqueta !== dmet.grafica.etiqueta,
  `🚨 …y con ella su unidad: «${dmet.grafica.etiqueta}» → «${dotra.grafica.etiqueta}» (apartado 10)`);
ok(metricaElegida(apDos, 'no-existe') === apDos[0].clase,
  '⚠️ …y una métrica que no tiene se ignora, en vez de dejar la gráfica vacía');
ok(metricaElegida([], null) === null, '…y sin apariciones, `null`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. NO se crea lógica nueva y NO se guarda nada (apartados 8, 32 y 39) ──');

const SRC = leer('src/lib/detalleEjercicio.js');
const CODIGO = sinComentarios(SRC);

ok(YA_LO_RESUELVE.length >= 8 && YA_LO_RESUELVE.every((y) => typeof y.es === 'function'),
  `⚠️ ${YA_LO_RESUELVE.length} cosas que ya resolvían otras fases, guardadas como FUNCIONES importadas`);
ok(YA_LO_RESUELVE.every((y) => y.es.name === y.nombre),
  '🚨 …y renombrar una rompe la compilación: no es una lista de nombres sueltos (FIT F27)');

/* 🐛 Y el barrido de «no guarda nada» NO puede mirar la tabla que DECLARA
   dónde se carga: `ESTADOS_DETALLE` nombra `app_data` justamente para decir
   que «cargando» es de la pantalla de carga y no un estado de esta fase. Es
   `NO_EN_FIT28` con la IA y `NO_EN_FIT25` con XP, por enésima vez: **lo que se
   barre es el código, no la declaración**. */
const declaraciones = /export const (ESTADOS_DETALLE|NO_EN_FIT29|DECISIONES_FIT29|COMPONENTES_FIT29|AUDITORIA_FIT29|YA_LO_RESUELVE) = [[{][\s\S]*?\n[\]}];/g;
const SIN_DECLARAR = CODIGO.replace(declaraciones, ' ');
ok(!/saveData|app_data|localStorage|sessionStorage/.test(SIN_DECLARAR),
  '🚨 Apartado 32 · la librería NO guarda nada: ni `saveData`, ni `app_data`, ni `localStorage`');
ok(/app_data/.test(CODIGO),
  '…y la tabla SÍ lo nombra, para declarar de dónde viene el estado «cargando»');
/* Y que el arreglo no tapa una escritura de verdad (EH F42). */
ok(/saveData|app_data|localStorage|sessionStorage/.test(`${SIN_DECLARAR} saveData(uid, 'fitness', x)`),
  '…y el barrido SIGUE cazando una escritura de verdad si alguien la mete');
ok(AUDITORIA_FIT29.tablasNuevas === 0 && AUDITORIA_FIT29.clavesNuevas === 0 && AUDITORIA_FIT29.guardaAlgo === false,
  '…ni una tabla, ni una clave, ni un normalizador nuevos');
ok(AUDITORIA_FIT29.fuentes.length === 4,
  `…y se deriva de las cuatro fuentes del apartado 32: ${AUDITORIA_FIT29.fuentes.join(' + ')}`);

/* 🚨 El barrido de «ni IA» NO puede mirar la tabla que DECLARA que no hay IA
   (FIT F25 y F28, y «diferencia» contiene «ia» — por eso va con límite de
   palabra). Lo que se barre es el código, no la declaración. */
const SIN_TABLAS = CODIGO
  .replace(/export const NO_EN_FIT29 = \[[\s\S]*?\n\];/, ' ')
  .replace(/export const DECISIONES_FIT29 = \[[\s\S]*?\n\];/, ' ');
ok(!/\bIA\b|\bpredicc/i.test(SIN_TABLAS),
  '🚨 Apartado 39 · ni IA ni predicciones en el código');
ok(/\bIA\b/.test(CODIGO), '…y la tabla SÍ la nombra, justamente para declarar que no se construye');
ok(!/\bxp\b|\bnivel \d|leaderboard|ranking social/i.test(SIN_TABLAS),
  '🚨 …ni XP, ni niveles, ni comparación social (apartado 39 y D2-02)');
ok(NO_EN_FIT29.length === 8 && NO_EN_FIT29.every((n) => n.que && n.porque),
  `⚠️ …y lo que no se construye va declarado con su motivo: ${NO_EN_FIT29.length} entradas`);
ok(NO_EN_FIT29.some((n) => /PR|récord/i.test(n.que)),
  '🚨 …incluido el sistema de récords aparte que prohíbe el apartado 7');
ok(!/function .*calcularScore|RANK_THRESHOLDS|UMBRALES_FUENTE/.test(CODIGO),
  '🚨 …y NO se toca el RankEngine: ni un umbral, ni una fórmula (apartado 39)');
ok(!/function progresoDe|function compararSeries|\.reduce\(.*mejor/.test(CODIGO.replace(/progresoDeEjercicio/g, ' ')),
  '🚨 …y no hay una segunda comparación: la central es la de la F11 (contexto)');

ok(DECISIONES_FIT29.length >= 7 && DECISIONES_FIT29.every((d) => d.que && d.porque),
  `⚠️ Y las decisiones de la fase quedan escritas: ${DECISIONES_FIT29.length}`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. La cabecera y la alternativa textual (apartados 2 y 35) ──');

ok(dm.cabecera.nombre === 'Press de banca · Con barra' && dm.cabecera.grupo === 'Pecho',
  `Apartado 2 · «${dm.cabecera.nombre}» / «${dm.cabecera.grupo}»`);
ok(/Agarre/.test(dm.cabecera.linea) && /Barra/.test(dm.cabecera.linea),
  `…con agarre y equipamiento: «${dm.cabecera.linea}»`);
ok(!/^ · | · $|· ·/.test(dm.cabecera.linea),
  '⚠️ …y sin un «·» suelto: un separador sin dato dice que hay algo donde no lo hay (regla 8)');

const sinAgarre = cabeceraDeEjercicio('plancha-frontal');
ok(!/Agarre/.test(sinAgarre.linea),
  `…y un ejercicio sin agarre no se lo inventa: «${sinAgarre.linea}»`);

ok(/mejor resultado fue/i.test(dm.alternativa) && new RegExp(dm.progreso.mejor.texto).test(dm.alternativa),
  `🚨 Apartado 35 · el gráfico tiene alternativa textual: «${dm.alternativa}»`);
ok(/4 registros/.test(dm.alternativa), '…diciendo cuántos registros hay en el periodo');
ok(alternativaTextual(dv.progreso, dv.grafica) === '',
  '⚠️ …y sin puntos no se inventa una frase');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. Los estados y el error (apartado 36) ──');

ok(ESTADOS_DETALLE.length === 7, `Los siete estados del apartado 36: ${ESTADOS_DETALLE.map((e) => e.id).join(', ')}`);
ok(['cargando', 'sin_datos', 'primer_registro', 'pocos_registros', 'suficientes', 'error', 'archivado']
  .every((id) => !!estadoDetalle(id)), '…loading, sin datos, primer registro, pocos, suficientes, error y archivado');
ok(estadoDetalle('cargando').deLaPantalla === true && !!estadoDetalle('cargando').donde,
  '⚠️ …y «cargando» es de la pantalla de carga de la aplicación, no un estado propio: se declara dónde vive');
ok(estadoDelDetalle(0) === 'sin_datos' && estadoDelDetalle(1) === 'primer_registro'
  && estadoDelDetalle(2) === 'pocos_registros' && estadoDelDetalle(PUNTOS_MINIMOS_GRAFICA) === 'suficientes',
  '…y se deciden por cuántos registros hay, con el mínimo de la gráfica');
ok(estadoDelDetalle(9, { archivado: true }) === 'archivado', '…y archivado gana a todo');

const ROTO = { ...DEFAULT_FITNESS };
Object.defineProperty(ROTO, 'sesiones', { get() { throw new Error('dato ilegible'); } });
const derr = detalleCompletoDeEjercicio(ROTO, 'press-banca-barra', { hoy: HOY });
ok(derr.estado === 'error' && derr.error.titulo === ERROR_DETALLE.titulo,
  `🚨 Un dato ilegible NO tumba la pantalla: «${ERROR_DETALLE.titulo}»`);
ok(derr.historial.length === 0 && derr.grafica.puntos.length === 0 && derr.rango.hay === false,
  '…y devuelve una forma completa, para que la vista no reviente leyendo un campo que falta');
ok(/siguen ahí/.test(ERROR_DETALLE.texto),
  '⚠️ …diciendo que sus entrenamientos siguen: un error no puede parecer una pérdida de datos');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 14. Los componentes del apartado 31 ──');

ok(COMPONENTES_FIT29.length === 14, `Los catorce del apartado 31: ${COMPONENTES_FIT29.filter((c) => !c.nuevo).length} reutilizados y ${COMPONENTES_FIT29.filter((c) => c.nuevo).length} nuevos`);
COMPONENTES_FIT29.forEach((c) => {
  const existe = existsSync(join(RAIZ, c.archivo));
  const src = existe ? leer(c.archivo) : '';
  const definido = new RegExp(`function ${c.es}\\b`).test(src);
  ok(existe && definido, `  ${c.nombre} → ${c.es} en ${c.archivo}${c.nuevo ? '' : ` (ya estaba, ${c.de})`}`);
});
/* ⚠️ Se comprueba el MECANISMO, no la cuenta: una cifra exacta en una prueba es
   una bomba de relojería (EH F21, nueve veces). Lo que importa es que ninguno
   de los reutilizados se haya vuelto a escribir en el archivo nuevo. */
const reutilizados = COMPONENTES_FIT29.filter((c) => !c.nuevo);
ok(reutilizados.length > 0 && reutilizados.every((c) => c.archivo !== 'src/components/detalleEjercicio.jsx'),
  `🚨 …y ${reutilizados.length} YA estaban escritos, fuera del archivo nuevo: «No duplicar componentes existentes» (apartado 31)`);
ok(reutilizados.every((c) => !new RegExp(`function ${c.es}\\b`).test(leer('src/components/detalleEjercicio.jsx'))),
  '🚨 …y ninguno se ha redefinido aquí: una segunda versión acabaría dibujando otra cosa');

const VISTA = leer('src/views/ProgresoView.jsx');
ok(/from '\.\.\/components\/detalleEjercicio'/.test(VISTA),
  '…la vista importa las piezas nuevas en vez de escribirlas dentro');
ok(/detalleCompletoDeEjercicio\(/.test(VISTA) && !/[^a-zA-Z]detalleDeProgreso\(/.test(sinComentarios(VISTA)),
  '🚨 …y pide el detalle COMPLETO una sola vez: no hay dos fuentes en la misma pantalla');

const COMP = leer('src/components/detalleEjercicio.jsx');
ok(!/#[0-9a-fA-F]{6}\b/.test(sinComentarios(COMP)),
  '🚨 Regla 2 · ni un hex suelto en los componentes: todo sale de `tokens.js`');
ok(!/fixed inset-0/.test(sinComentarios(COMP)),
  '⚠️ Regla 3 · y ni un overlay aquí, así que no hace falta ningún portal');
ok(/toque-44/.test(COMP), '…y los controles llevan su zona de toque de 44 px (EH F42)');
ok(/RankNextLevelCard|RankBadge/.test(COMP),
  '🚨 …y el rango se pinta con los componentes de la F15 y la F23, no con unos nuevos (apartado 25)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 15. Las ocho preguntas del apartado 40 ──');

const auditoria = auditarDetalle(MUCHOS, 'press-banca-barra', { hoy: HOY });
auditoria.casillas.forEach((c) => ok(c.ok, `  ${c.que}`));
ok(auditoria.ok === true, '🚨 Las ocho preguntas del apartado 40 se contestan con datos de verdad');

/* 🚨 Y la auditoría tiene que poder ponerse ROJA: una que no puede fallar no
   sirve de nada (EH F42). */
const casillasVacias = casillasDelDetalle({ progreso: {}, grafica: {}, rango: null, objetivo: null, historial: null });
ok(casillasVacias.some((c) => !c.ok),
  '…y con un detalle vacío se ponen rojas: la auditoría PUEDE fallar');
ok(casillasDelDetalle(auditarDetalle(VACIO, 'dominada-prona', { hoy: HOY }).detalle).find((c) => c.id === 'ultima').ok === false,
  '…sin una sola marca, «¿Cuál fue mi última marca?» está roja, y es lo correcto');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones correctas\x1b[0m`);
if (fallos > 0) {
  console.log(`\x1b[31m${fallos} fallo(s) en FIT F29\x1b[0m`);
  process.exit(1);
}
