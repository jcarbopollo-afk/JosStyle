/* Entrega 4 · FIT F28/45 — Integración completa del progreso físico.
   ═══════════════════════════════════════════════════════════════════════════
   Las dieciocho pruebas del apartado 31, y lo que más se vigila:
   1. Que NO exista ninguna métrica que mezcle dos sistemas (apartados 10 y 33).
   2. Que el resumen no guarde nada y se derive siempre (apartado 21), que es
      lo que hace que el apartado 23 —«el resumen debe actualizarse»— salga
      gratis.
   3. Que el periodo filtre la vista y **no toque** rangos ni objetivos (16).
   4. Que con datos parciales no se esconda lo que sí hay (18) y que un error en
      Fotos no se lleve por delante Entrenamientos (30). */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  YA_EXISTIA, PERIODOS_RESUMEN, PERIODO_POR_DEFECTO, periodoResumen, EN_PERIODO,
  LO_QUE_EL_PERIODO_NO_TOCA, EL_PERIODO_RECORTA, BLOQUES, bloqueResumen,
  EJERCICIOS_RESUMEN_MAX, MUSCULOS_RESUMEN_MAX, OBJETIVOS_RESUMEN_MAX, FOTOS_RESUMEN_MAX,
  bloqueEntrenamientos, bloqueEjercicios, bloqueMusculos, bloqueFotos, bloqueObjetivos, bloqueRango,
  comparacionRapida, CTA_FOTOS, CTA_COMPARAR, FOTOS_NO_DISPONIBLES,
  TIPOS_EVENTO, tipoEvento, FILTROS_TIMELINE, SIN_EVENTOS, SIN_EVENTOS_FILTRO,
  eventosDelProgreso, timelineDeProgreso, detallarEventosDeObjetivo,
  ESTADOS_RESUMEN, ONBOARDING, accionesDeOnboarding, ERROR_GENERAL, bloqueSeguro,
  centroDeProgreso, CLAVES_PROHIBIDAS, mezclaFuentes, casillasDeIntegracion,
  AUDITORIA_FIT28, auditarIntegracion, NO_EN_FIT28, DECISIONES_FIT28,
} from '../src/lib/resumenProgreso.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio } from '../src/lib/constructor.js';
import { anadirObjetivo, listaDeObjetivos } from '../src/lib/objetivosProgreso.js';
import { clasificarEjercicio, preguntaDeEjercicio } from '../src/lib/clasificacion.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
import { crearFotoProgreso } from '../src/lib/fotosProgreso.js';
import { rangoGlobalEfectivo } from '../src/lib/motorRangos.js';

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

/* ── Fábricas de escenarios ───────────────────────────────────────────────
   🚨 Un id que no esté en el catálogo no añade nada y revienta doce llamadas
   más abajo (FIT F22): aquí se comprueba al construir. */
function sesion(exerciseId, valores, fecha, nombre = null) {
  let r = crearRutina({ nombre: nombre || exerciseId });
  r = anadirEjercicio(r, exerciseId);
  if (!r.lineas.length) throw new Error(`El catálogo no tiene «${exerciseId}»`);
  const inicio = Date.parse(`${fecha}T18:00:00`);
  let s = empezarSesion({ nombre: nombre || exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  s = editarSerie(s, e.id, e.series[0].id, valores);
  s = marcarSerie(s, e.id, e.series[0].id, true);
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });

/* 🚨 Hacen falta TRES grupos y TRES ejercicios para que haya rango global
   (F15): con un solo ejercicio el bloque del rango saldría vacío y media
   suite mediría lo que no cree medir. */
const FECHAS = ['2026-06-10', '2026-07-10', '2026-08-09', '2026-09-08'];
const EJERCICIOS = [
  ['dominada-prona', (i) => ({ reps: 4 + i * 5 })],
  ['press-banca-barra', (i) => ({ peso: 45 + i * 8, reps: 8 })],
  ['sentadilla-barra', (i) => ({ peso: 60 + i * 10, reps: 8 })],
];
const CON_ENTRENAMIENTOS = FECHAS.reduce((f, fecha, i) => EJERCICIOS.reduce(
  (g, [id, valores]) => guardarSesion(g, sesion(id, valores(i), fecha, `Día de ${id}`)), f,
), { ...DEFAULT_FITNESS });

const FOTOS = [
  crearFotoProgreso({ path: 'u/1.jpg', fecha: '2026-06-12', nota: 'Inicio', tags: ['frontal'], ahora: Date.parse('2026-06-12T10:00:00Z') }),
  crearFotoProgreso({ path: 'u/2.jpg', fecha: '2026-07-20', tags: ['espalda'], ahora: Date.parse('2026-07-20T10:00:00Z') }),
  crearFotoProgreso({ path: 'u/3.jpg', fecha: '2026-09-12', tags: ['frontal'], ahora: Date.parse('2026-09-12T10:00:00Z') }),
];

/* ⚠️ Con `ahora` a mano, y a propósito: `crearObjetivo` pone `Date.now()`, así
   que sin esto la fecha del evento «Nuevo objetivo» sería la del día en que se
   ejecuta la prueba — una bomba de relojería de las de la FIT F24 y la F26. */
const CREADO = Date.parse('2026-08-15T12:00:00');
const conObjetivos = (f) => {
  let g = anadirObjetivo(f, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 25 }, { ahora: CREADO }).fitness;
  g = anadirObjetivo(g, { exerciseId: 'press-banca-barra', tipo: 'peso', valor: 60 }, { ahora: CREADO }).fitness;
  return g;
};
const TODO = conObjetivos(CON_ENTRENAMIENTOS);
const VACIO = { ...DEFAULT_FITNESS };

console.log('\n═══ FIT F28/45 · Integración completa del progreso físico ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Sin datos: el onboarding del apartado 17 ──');

const c0 = centroDeProgreso(VACIO, [], { hoy: HOY, puede: { entrenar: true, foto: true, objetivo: true } });
ok(c0.estado === 'vacio' && c0.onboarding !== null, '🚨 Sin nada registrado, el resumen está VACÍO y sale el onboarding');
ok(c0.onboarding.titulo === 'Tu progreso empieza aquí.', '…con el texto literal del apartado 17');
ok(c0.onboarding.acciones.map((a) => a.id).join(',') === 'entrenar,foto,objetivo', '…y sus tres acciones');
ok(Object.values(c0.bloques).every((b) => b.hay === false), '…y ni un bloque con datos');
ok(c0.timeline.hay === false && c0.timeline.vacio === SIN_EVENTOS, '…y la línea temporal dice que todavía no hay nada');
/* 🚨 Regla 8 — una acción que no puede funcionar no se pinta. */
const c0sin = centroDeProgreso(VACIO, [], { hoy: HOY, puede: { entrenar: true } });
ok(c0sin.onboarding.acciones.length === 1 && c0sin.onboarding.acciones[0].id === 'entrenar', '🚨 Sin con qué guardar una foto o un objetivo, esas dos salidas NO se pintan (regla 8)');
ok(accionesDeOnboarding({}).length === 0, '…y sin nada que se pueda hacer, ninguna');
ok(centroDeProgreso(VACIO, [], { hoy: HOY }).bloques.entrenamientos.texto === '', '🚨 Y «0 entrenamientos registrados» NO se enseña: un cero así no es un dato (regla 8)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Solo entrenamientos (apartados 3, 4, 5 y 18) ──');

const cE = centroDeProgreso(CON_ENTRENAMIENTOS, [], { hoy: HOY });
ok(cE.bloques.entrenamientos.total === 12 && cE.bloques.entrenamientos.texto === '12 entrenamientos registrados', '🚨 *"12 entrenamientos registrados"*, con el contador del historial (apartado 3)');
ok(cE.bloques.entrenamientos.textoPeriodo === '', '…y sin periodo definido, NO hay segunda línea (apartado 3)');
ok(cE.bloques.ejercicios.hay && cE.bloques.ejercicios.ejercicios.length <= EJERCICIOS_RESUMEN_MAX, `…los ejercicios en progreso, como mucho ${EJERCICIOS_RESUMEN_MAX} (apartado 26)`);
ok(cE.bloques.ejercicios.ejercicios.every((e) => /^[↗→↘] /.test(e.etiqueta)), '🚨 …cada uno con SÍMBOLO y palabra, no solo el color (apartado 28)');
ok(cE.bloques.musculos.hay && cE.bloques.musculos.grupos.length <= MUSCULOS_RESUMEN_MAX, `…los músculos, como mucho ${MUSCULOS_RESUMEN_MAX}`);
ok(cE.bloques.musculos.grupos.every((g) => g.estado !== 'sin_datos'), '🚨 …y ninguno «Sin datos»: un hueco de la vista previa no se gasta en un grupo que no dice nada');
/* 🚨 Apartado 18 — con datos parciales se enseña lo que hay. */
ok(cE.estado === 'parcial' && cE.bloques.fotos.hay === false && cE.bloques.fotos.vacio === 'Empieza a registrar tu progreso visual.', '🚨 Sin fotos, el resto se enseña entero y Fotos dice su frase (apartado 18, literal)');
ok(cE.bloques.entrenamientos.hay === true, '…«No ocultar todo por falta de una fuente»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Solo fotos (apartados 6 y 7) ──');

const cF = centroDeProgreso(VACIO, FOTOS, { hoy: HOY });
const bf = cF.bloques.fotos;
ok(bf.hay && bf.total === 3, 'Con tres fotos y ni un entrenamiento, el bloque de fotos tiene datos');
ok(bf.ultima.fecha === '2026-09-12' && bf.anterior.fecha === '2026-07-20', '🚨 …la última y la anterior, por FECHA (apartado 6)');
ok(bf.ultima.etiqueta === '12 SEP 2026' && bf.cta === CTA_FOTOS, '…con su fecha y el CTA «Ver progreso»');
ok(bf.recientes.length <= FOTOS_RESUMEN_MAX, `…y como mucho ${FOTOS_RESUMEN_MAX} fotos (apartado 26)`);
ok(cF.bloques.ejercicios.hay === false && cF.estado === 'parcial', '…y sin entrenamientos, los otros bloques lo dicen sin esconderse');

const rapida = comparacionRapida(FOTOS);
ok(rapida.hay && rapida.cta === CTA_COMPARAR, '🚨 Con dos o más fotos aparece «Comparar progreso» (apartado 7)');
ok(rapida.despuesId === FOTOS[2].id, '…el DESPUÉS es la más reciente');
ok(rapida.antesId === FOTOS[0].id && rapida.mismaOrientacion === true, '🚨 …y el ANTES es la más antigua CON LA MISMA orientación: no se eligen fotos incompatibles (apartado 7)');
ok(rapida.orientacion === 'Frontal', '…y se dice cuál es');
/* ⚠️ Sin etiquetas no se afirma ni que coinciden ni que no (F27, apartado 13). */
const SIN_TAGS = FOTOS.map((f) => ({ ...f, tags: [] }));
const rSin = comparacionRapida(SIN_TAGS);
ok(rSin.hay && rSin.antesId === SIN_TAGS[0].id && rSin.mismaOrientacion === false, '⚠️ Sin etiqueta de orientación se usa la más antigua a secas, sin inventarse una incompatibilidad');
ok(comparacionRapida([FOTOS[0]]).hay === false, '…y con una sola foto no se ofrece comparar (regla 8)');
ok(comparacionRapida([]).hay === false, '…ni con ninguna');
/* La más antigua compatible, no la segunda más reciente. */
const CUATRO = [
  crearFotoProgreso({ path: 'u/a.jpg', fecha: '2026-01-01', tags: ['frontal'], ahora: Date.parse('2026-01-01T10:00:00Z') }),
  crearFotoProgreso({ path: 'u/b.jpg', fecha: '2026-05-01', tags: ['frontal'], ahora: Date.parse('2026-05-01T10:00:00Z') }),
  crearFotoProgreso({ path: 'u/c.jpg', fecha: '2026-09-01', tags: ['frontal'], ahora: Date.parse('2026-09-01T10:00:00Z') }),
];
ok(comparacionRapida(CUATRO).antesId === CUATRO[0].id, '…y entre varias compatibles se elige la MÁS ANTIGUA (apartado 7)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Solo objetivos (apartado 8) ──');

const SOLO_OBJ = conObjetivos({ ...DEFAULT_FITNESS });
const cO = centroDeProgreso(SOLO_OBJ, [], { hoy: HOY });
ok(cO.bloques.objetivos.hay && cO.bloques.objetivos.total === 2, 'Con dos objetivos y sin sesiones, el bloque de objetivos tiene datos');
ok(cO.bloques.objetivos.objetivos.every((o) => o.porcentaje === null), '🚨 …y sin datos NO hay porcentaje: un 0 % sería inventado (F14, apartado 23)');
ok(cO.bloques.objetivos.objetivos.length <= OBJETIVOS_RESUMEN_MAX, `…como mucho ${OBJETIVOS_RESUMEN_MAX} (apartado 26)`);
const cTresMas = centroDeProgreso(
  [1, 2, 3].reduce((f) => anadirObjetivo(f, { exerciseId: 'sentadilla-barra', tipo: 'peso', valor: 100 }, { ahora: CREADO }).fitness, SOLO_OBJ),
  [], { hoy: HOY },
);
ok(cTresMas.bloques.objetivos.objetivos.length === OBJETIVOS_RESUMEN_MAX && cTresMas.bloques.objetivos.hayMas === true, '…y con más de tres se enseñan tres y aparece «Ver todo»');
ok(leer('src/lib/resumenProgreso.js').includes('No crear objetivos nuevos desde este resumen'), '⚠️ Y está declarado que aquí NO se crean objetivos (apartado 8)');
ok(!/crearObjetivo|anadirObjetivo/.test(sinComentarios(leer('src/lib/resumenProgreso.js'))), '🚨 …con el código: esta librería no llama a ninguna función que cree un objetivo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Solo rangos (apartado 9) ──');

/* Tres ejercicios de tres grupos, estimados por el cuestionario: hay rango
   global sin una sola sesión. */
/* ⚠️ Las opciones de carga las construye el propio cuestionario a partir de la
   referencia de cada ejercicio (`carga-125`…), así que se le PREGUNTAN en vez
   de escribirlas a mano: un id inventado no clasificaría nada y el escenario
   saldría vacío sin que nada lo dijera (FIT F22). */
const PERFIL = { peso: 70 };
const SOLO_RANGOS = ['dominada-prona', 'press-banca-barra', 'sentadilla-barra']
  .reduce((f, id) => {
    const p = preguntaDeEjercicio(ejercicioPorId(id), { perfil: PERFIL });
    if (!p || !p.opciones || !p.opciones.length) throw new Error(`Sin cuestionario para «${id}»`);
    const elegida = p.opciones[p.opciones.length - 2];
    return clasificarEjercicio(f, id, elegida.id, { perfil: PERFIL }).fitness;
  }, { ...DEFAULT_FITNESS });
const cR = centroDeProgreso(SOLO_RANGOS, [], { hoy: HOY, perfil: PERFIL });
ok(cR.bloques.rango.hay === true && !!cR.bloques.rango.nombre, 'Con tres ejercicios clasificados hay rango global, sin una sola sesión');
ok(cR.bloques.rango.destino === 'rangos', '…y al pulsarlo se va a Rangos (apartado 9)');
ok(typeof cR.bloques.rango.evolucion.texto === 'string' && cR.bloques.rango.evolucion.texto.length > 0, '…con su pequeño indicador de evolución');
ok(cR.bloques.rango.nombre === rangoGlobalEfectivo(SOLO_RANGOS, { perfil: PERFIL }).nombre, '🚨 …y es EXACTAMENTE el del motor de la F19: aquí no se calcula ningún rango');
ok(bloqueRango(VACIO, {}).hay === false, '…y sin datos no hay rango, con su frase (nunca el rango 1)');
ok(!('score' in bloqueRango(TODO, {})) && !('puntuacion' in bloqueRango(TODO, {})), '🚨 …y el bloque NO lleva la puntuación: un número suelto en un resumen de seis sistemas se leería como la métrica global que prohíbe el apartado 10');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Datos combinados (apartados 2, 19, 25 y 34) ──');

const c = centroDeProgreso(TODO, FOTOS, { hoy: HOY });
ok(c.estado === 'completo', '🚨 Con los seis sistemas con datos, el resumen está COMPLETO');
ok(BLOQUES.length === 7 && BLOQUES.filter((b) => b.id !== 'timeline').length === 6, 'Los seis bloques del apartado 34 más la línea temporal');
ok(c.orden.join(',') === 'rango,entrenamientos,ejercicios,fotos,musculos,objetivos', '⚠️ El orden del apartado 25 está escrito UNA sola vez, en la librería');
ok(BLOQUES.filter((b) => b.id !== 'timeline').every((b) => !!b.destino), '🚨 Cada bloque lleva a su módulo (apartado 19)');
const destinos = BLOQUES.map((b) => b.destino).filter(Boolean);
ok(new Set(destinos).size === destinos.length && destinos.length === 6, '…y a destinos DISTINTOS: ni una pantalla duplicada (apartado 19)');
/* 🚨 La prueba mecánica del apartado 10. */
ok(mezclaFuentes(c).hay === false, '🚨 Ninguna clave del resumen mezcla dos sistemas (apartado 10)');
ok(mezclaFuentes({ bloques: { rango: { score: 520 } } }).hay === true, '…y esa comprobación SÍ se puede poner roja (EH F42)');
ok(CLAVES_PROHIBIDAS.includes('progresoFisico'), '…con «progresoFisico» entre las prohibidas, que es el ejemplo del propio apartado');
ok(BLOQUES.every((b) => !b.fuente.includes('+') || b.id === 'timeline'), '🚨 Cada bloque declara UNA fuente: sin eso no puede existir un número que mezcle dos');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. La línea temporal (apartados 12, 13 y 14) ──');

const eventos = eventosDelProgreso(TODO, FOTOS, { hoy: HOY });
ok(TIPOS_EVENTO.length === 5 && TIPOS_EVENTO.map((t) => t.id).join(',') === 'photo,workout,rankChange,goalCompleted,goalCreated', 'Los cinco tipos del apartado 13, con sus nombres');
ok(eventos.every((e) => !!e.tipo && !!e.fecha && !!e.titulo && !!e.referencia), '…y cada evento trae tipo, fecha, título y referencia');
ok(eventos.filter((e) => e.tipo === 'workout').length === 12, 'Doce entrenamientos en la línea, uno por sesión guardada');
ok(eventos.filter((e) => e.tipo === 'photo').length === 3, '…tres fotos');
ok(eventos.filter((e) => e.tipo === 'rankChange').length > 0, '…y los cambios de rango de la F22');
ok(eventos.filter((e) => e.tipo === 'goalCreated').length === 2, '…los dos objetivos creados');
ok(eventos.filter((e) => e.tipo === 'goalCompleted').length === 1, '…y el conseguido (el press llega a 60 kg y las dominadas no a 25)');
const completado = eventos.find((e) => e.tipo === 'goalCompleted');
ok(completado.fecha === '2026-09-08', '🚨 …con la FECHA REAL de la sesión en la que lo superó, no la de hoy');
/* Apartado 14 — orden. */
const fechas = eventos.map((e) => e.fecha);
ok(fechas.every((f, i) => i === 0 || fechas[i - 1] >= f), '🚨 Más reciente primero (apartado 14)');
const mismoDia = eventos.filter((e) => e.fecha === '2026-09-08');
ok(mismoDia.length > 1 && mismoDia.every((e, i) => i === 0 || mismoDia[i - 1].ts >= e.ts), '…y a igualdad de día manda la marca de tiempo');
ok(eventos.every((e) => e.fecha <= HOY), '⚠️ Y ni un evento en el futuro: solo lo que ha pasado');
/* Apartado 12 — solo eventos reales. */
ok(eventos.length === 12 + 3 + 2 + 1 + eventos.filter((e) => e.tipo === 'rankChange').length, '🚨 Ni un evento intermedio inventado: la suma cuadra exactamente con los registros (apartado 12)');
const conNombre = detallarEventosDeObjetivo(eventos, listaDeObjetivos(TODO, { hoy: HOY }).objetivos);
ok(/Dominadas|Press/.test(conNombre.find((e) => e.tipo === 'goalCreated').detalle), '…y la línea de un objetivo dice de qué ejercicio es');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Filtros (apartado 15) ──');

ok(FILTROS_TIMELINE.length === 5, 'Cinco pastillas: Todos, Fotos, Entrenamientos, Rangos y Objetivos');
const tTodos = timelineDeProgreso(eventos, { hoy: HOY });
const tFotos = timelineDeProgreso(eventos, { filtro: 'fotos', hoy: HOY });
ok(tFotos.eventos.every((e) => e.tipo === 'photo') && tFotos.total === 3, 'El filtro de Fotos deja solo fotos');
ok(tFotos.total < tTodos.total, '…y son menos que todos: el filtro filtra de verdad');
ok(timelineDeProgreso(eventos, { filtro: 'objetivos', hoy: HOY }).total === 3, '…el de Objetivos junta los creados y el conseguido');
ok(tTodos.porFiltro.find((f) => f.id === 'todos').cuantos === eventos.length, '⚠️ Cada pastilla dice cuántos hay, para no dejar la pantalla vacía sin avisar');
const vacioFiltro = timelineDeProgreso(eventos.filter((e) => e.tipo === 'workout'), { filtro: 'fotos', hoy: HOY });
ok(vacioFiltro.hay === false && vacioFiltro.vacio === SIN_EVENTOS_FILTRO, '🚨 Vacío POR EL FILTRO y vacío del todo dicen cosas distintas');
ok(timelineDeProgreso([], { hoy: HOY }).vacio === SIN_EVENTOS, '…y sin nada registrado, la frase es la otra');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Periodos (apartado 16) ──');

ok(PERIODOS_RESUMEN.map((p) => p.nombre).join(', ') === '7 días, 30 días, 3 meses, Todo', 'Los cuatro periodos del apartado 16');
ok(PERIODOS_RESUMEN === (await import('../src/lib/progresoEjercicios.js')).RANGOS_GRAFICA, '⚠️ …y son EXACTAMENTE los de la F12: ni un segundo catálogo que se desvíe');
ok(periodoResumen('loquesea').id === PERIODO_POR_DEFECTO, 'Un periodo que no existe cae en «Todo»');

const c7 = centroDeProgreso(TODO, FOTOS, { hoy: HOY, periodo: '7d' });
const cTodo = centroDeProgreso(TODO, FOTOS, { hoy: HOY, periodo: 'todo' });
/* 🚨 Lo que el periodo NO puede tocar. */
ok(c7.bloques.rango.nombre === cTodo.bloques.rango.nombre, '🚨 El periodo NO cambia el rango actual (apartado 16, literal)');
ok(c7.bloques.objetivos.total === cTodo.bloques.objetivos.total, '🚨 …ni los objetivos');
ok(c7.bloques.entrenamientos.total === cTodo.bloques.entrenamientos.total, '🚨 …ni el total de entrenamientos registrados');
ok(c7.bloques.fotos.total === cTodo.bloques.fotos.total, '…ni las fotos: la última es la última, mire el periodo que mire');
/* …y lo que sí. */
ok(c7.timeline.total < cTodo.timeline.total, '🚨 Y SÍ filtra lo que se ve: la línea temporal encoge');
ok(c7.bloques.entrenamientos.textoPeriodo === `0 ${EN_PERIODO['7d']}`, '…y aparece la segunda línea del periodo (apartado 3)');
const c3m = centroDeProgreso(TODO, FOTOS, { hoy: HOY, periodo: '3m' });
ok(c3m.bloques.ejercicios.total <= cTodo.bloques.ejercicios.total, '…y los ejercicios se miden dentro del periodo, como en la F13');
ok(LO_QUE_EL_PERIODO_NO_TOCA.length === 4 && EL_PERIODO_RECORTA.length === 3, '⚠️ Está declarado qué recorta y qué no, con su motivo');
ok(LO_QUE_EL_PERIODO_NO_TOCA.every((x) => !EL_PERIODO_RECORTA.includes(x.bloque)), '…y las dos listas no se solapan');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10 a 14. Eliminar, añadir y cambiar (apartados 23 y 32) ──');

/* 🚨 No hay nada que invalidar porque no hay copia: el apartado 23 sale de la
   forma del dato, no de un mecanismo de refresco. */
const menosUna = { ...TODO, sesiones: TODO.sesiones.slice(0, -1) };
ok(centroDeProgreso(menosUna, FOTOS, { hoy: HOY }).bloques.entrenamientos.total === 11, '🚨 (10) Eliminar un entrenamiento corrige el resumen solo');
ok(eventosDelProgreso(menosUna, FOTOS, { hoy: HOY }).filter((e) => e.tipo === 'workout').length === 11, '…y lo quita de la línea temporal, sin limpiar nada');

const masUna = guardarSesion(TODO, sesion('press-banca-barra', { peso: 90, reps: 8 }, '2026-09-15', 'Empuje'));
const cMas = centroDeProgreso(masUna, FOTOS, { hoy: HOY });
ok(cMas.bloques.entrenamientos.total === 13, '🚨 (11) Un entrenamiento nuevo sube el contador');
ok(cMas.timeline.eventos[0].tipo === 'workout' && cMas.timeline.eventos[0].fecha === '2026-09-15', '…y encabeza la línea temporal');

const masFoto = FOTOS.concat(crearFotoProgreso({ path: 'u/4.jpg', fecha: '2026-09-16', ahora: Date.parse('2026-09-16T10:00:00Z') }));
const cFoto = centroDeProgreso(TODO, masFoto, { hoy: HOY });
ok(cFoto.bloques.fotos.total === 4 && cFoto.bloques.fotos.ultima.fecha === '2026-09-16', '🚨 (12) Una foto nueva pasa a ser la última');
ok(cFoto.bloques.fotos.anterior.fecha === '2026-09-12', '…y la que era la última pasa a ser la anterior');

const masObj = anadirObjetivo(TODO, { exerciseId: 'sentadilla-barra', tipo: 'peso', valor: 120 }, { ahora: CREADO }).fitness;
const cObjNuevo = centroDeProgreso(masObj, FOTOS, { hoy: HOY });
ok(cObjNuevo.bloques.objetivos.objetivos.some((o) => o.exerciseId === 'sentadilla-barra'), '🚨 (13) Un objetivo nuevo aparece en el resumen');
ok(cObjNuevo.bloques.objetivos.total === centroDeProgreso(TODO, FOTOS, { hoy: HOY }).bloques.objetivos.total + 1, '…y sube la cuenta de activos');
ok(eventosDelProgreso(masObj, FOTOS, { hoy: HOY }).filter((e) => e.tipo === 'goalCreated').length === 3, '…y en la línea temporal');

/* (14) Un cambio de rango: se recalcula del historial, no se guarda. */
const conCambio = eventosDelProgreso(CON_ENTRENAMIENTOS, [], { hoy: HOY }).filter((e) => e.tipo === 'rankChange');
ok(conCambio.length > 0 && conCambio.every((e) => /rango/i.test(e.titulo)), '🚨 (14) Los cambios de rango salen del historial de la F22');
ok(conCambio.every((e) => e.referencia.destino === 'rangos'), '…y llevan a Rangos');
const primerasDos = { ...CON_ENTRENAMIENTOS, sesiones: CON_ENTRENAMIENTOS.sesiones.filter((s) => s.fecha <= FECHAS[1]) };
ok(eventosDelProgreso(primerasDos, [], { hoy: HOY }).filter((e) => e.tipo === 'rankChange').length <= conCambio.length, '…y con menos sesiones hay como mucho los mismos: el pasado no se reescribe');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 15 y 16. Errores (apartados 29 y 30) ──');

ok(ESTADOS_RESUMEN.length === 6, 'Los seis estados del apartado 29');
ok(ESTADOS_RESUMEN.filter((e) => e.deLaPantalla).length === 1 && !!ESTADOS_RESUMEN.find((e) => e.id === 'cargando').donde, '⚠️ …y el de carga se declara de quién es, en vez de inventarlo aquí');
const cErr = centroDeProgreso(TODO, FOTOS, { hoy: HOY, errorFotos: true });
ok(cErr.bloques.fotos.error === true && cErr.bloques.fotos.aviso === FOTOS_NO_DISPONIBLES, '🚨 (15) *"Fotos no disponibles ahora mismo."* (apartado 30, literal)');
ok(cErr.bloques.entrenamientos.hay && cErr.bloques.ejercicios.hay && cErr.bloques.objetivos.hay && cErr.bloques.rango.hay, '🚨 …y entrenamientos, ejercicios, objetivos y rangos siguen enteros');
ok(cErr.avisos.includes(FOTOS_NO_DISPONIBLES), '…con su aviso arriba');
ok(cErr.timeline.eventos.every((e) => e.tipo !== 'photo'), '…y la línea temporal no promete fotos que no se pueden leer');

const malo = bloqueSeguro('musculos', () => { throw new Error('datos rotos'); });
ok(malo.ok === false && /no está disponible/.test(malo.aviso), '🚨 Un bloque que revienta se queda con su aviso…');
ok(malo.bloque.id === 'musculos' && malo.bloque.hay === false, '…y devuelve un bloque vacío, no `undefined`');
ok(bloqueSeguro('musculos', () => ({ id: 'musculos', hay: true })).ok === true, '…y uno que va bien pasa tal cual');

/* (16) Error general. */
/* ⚠️ Tiene que reventar FUERA de `bloqueSeguro`, que es lo que distingue un
   error parcial de uno general: con un bloque roto la pantalla sigue. */
const FITNESS_ROTO = {};
Object.defineProperty(FITNESS_ROTO, 'sesiones', { get() { throw new Error('roto'); }, enumerable: true });
const cGen = centroDeProgreso(FITNESS_ROTO, FOTOS, { hoy: HOY });
ok(cGen.error !== null && cGen.estado === 'error_general' && cGen.error.titulo === ERROR_GENERAL.titulo, '🚨 (16) Si revienta todo, se dice y NO se enseña media pantalla con datos a medias');
ok(cGen.error.texto.includes('siguen ahí'), '…diciendo que sus datos no se han perdido');
ok(Array.isArray(cGen.timeline.eventos) && cGen.timeline.eventos.length === 0, '…y lo que devuelve sigue teniendo la forma de siempre: ninguna pantalla revienta al leerlo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 17 y 18. Navegación y pantalla (apartados 19, 22 y 27) ──');

const vista = leer('src/views/ProgresoView.jsx');
const comp = leer('src/components/resumenProgreso.jsx');
ok(/ProgressOverview/.test(vista) && /seccion === 'resumen'/.test(vista), '🚨 (17) El Resumen de Progreso ES el centro de seguimiento');
ok(/onIrASeccion=\{setSeccion\}/.test(vista), '…y cada «Ver todo» cambia de sección, sin crear una pantalla nueva (apartado 19)');
ok(/onIrAHistorial/.test(vista) && /onIrARangos/.test(vista), '…y el historial y los rangos se abren donde ya viven');
ok(/comparacionInicial/.test(vista) && /comparacionInicial/.test(leer('src/components/fotosProgreso.jsx')), '🚨 …y «Comparar progreso» abre el comparador de la F27 con las dos fotos puestas, no un comparador nuevo');
ok(!/ProgressComparison/.test(comp), '…este archivo no dibuja su propio comparador');
ok(/porTanda: FOTOS_RESUMEN_MAX/.test(comp), '🚨 (18/22) Solo se firman las fotos que se van a ver: nada de cargar la galería entera');
ok(/grid-cols-2/.test(comp) && !/md:grid-cols|lg:grid-cols/.test(comp), '⚠️ (18) Una columna en el móvil, que es donde se usa esto (apartado 27)');
ok(/aria-label/.test(comp) && (comp.match(/aria-label/g) || []).length >= 8, '…y cada fila tocable dice en voz alta qué es y a dónde lleva');
ok(/toque-44/.test(comp), '…con el área táctil de 44 px de la E3 F1');
ok(!/#[0-9a-fA-F]{6}/.test(sinComentarios(comp)), '🚨 Ni un hex suelto: todo sale de `tokens.js` (regla 2)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 19. Ni una métrica inventada, ni una correlación (apartados 10, 11 y 33) ──');

const lib = leer('src/lib/resumenProgreso.js');
const codigo = sinComentarios(lib);
/* 🚨 Todos los textos que esta fase pone en pantalla. */
const textos = [
  ...Object.values(c.bloques).flatMap((b) => [b.texto, b.textoPeriodo, b.vacio, b.aviso, b.detalle].filter(Boolean)),
  ...c.bloques.ejercicios.ejercicios.map((e) => e.etiqueta),
  ...c.bloques.musculos.grupos.flatMap((g) => [g.etiqueta, g.resumen]),
  ...c.timeline.eventos.flatMap((e) => [e.titulo, e.detalle, e.etiqueta].filter(Boolean)),
  c.bloques.rango.evolucion.texto,
  c.bloques.fotos.comparacion.texto,
  ONBOARDING.titulo, ONBOARDING.texto, ERROR_GENERAL.titulo, ERROR_GENERAL.texto,
  ...FILTROS_TIMELINE.map((f) => f.nombre),
].filter((t) => typeof t === 'string' && t);
const CAUSALES = /desde que|gracias a|ha hecho que|porque has|te ha hecho|debido a que entrenas/i;
ok(!textos.some((t) => CAUSALES.test(t)), '🚨 Ni una correlación automática en los textos (apartado 11)');
ok(CAUSALES.test('Desde que entrenas más has ganado músculo'), '…y ese barrido SÍ caza el ejemplo del propio enunciado');
const CORPORAL = /grasa corporal|masa muscular|composición corporal|has ganado músculo|desarrollo muscular/i;
ok(!textos.some((t) => CORPORAL.test(t)), '🚨 Ni análisis corporal, ni «% de desarrollo muscular» (apartados 5 y 33)');
const JUEGO = /\bxp\b|\bnivel \d|insignia|medalla|ranking global|leaderboard|recompensa/i;
ok(!textos.some((t) => JUEGO.test(t)), '🚨 Ni gamificación (apartado 33 y D2-02)');
ok(!textos.some((t) => /progreso f[ií]sico \d+\s*%/i.test(t)), '🚨 Y ni una «puntuación global de progreso físico» (apartado 10, con su ejemplo)');
/* 🐛 Y el barrido NO puede mirar las tablas que declaran lo que busca (FIT F25):
   `NO_EN_FIT28` **nombra** la IA justamente para decir que no se construye, y
   la casilla de auditoría también. Lo que se barre es el código de verdad. */
const codigoSinTablas = codigo
  .replace(/export const NO_EN_FIT28 = \[[\s\S]*?\n\];/, ' ')
  .replace(/export function casillasDeIntegracion[\s\S]*?\n\}/, ' ');
ok(!/\bIA\b|anthropic|ask-ai|buildPrompt/i.test(codigoSinTablas), '🚨 Esto NO es IA: ni una llamada, ni un contexto (apartado 33)');
ok(/\bIA\b/.test(NO_EN_FIT28.map((x) => x.que).join(' ')), '…y esa exclusión SÍ está declarada, que es por lo que el barrido la salta');
ok(/\bIA\b/i.test(codigo) && !/\bIA\b/i.test(codigoSinTablas), '…o sea que el arreglo no está tapando otra aparición');
ok(NO_EN_FIT28.length === 8 && NO_EN_FIT28.every((x) => x.que && x.porque), 'Y lo que no se construye está declarado, con su motivo');
ok(DECISIONES_FIT28.length === 6 && DECISIONES_FIT28.every((x) => x.que && x.porque), '…igual que las decisiones que se han tomado');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 20. Nada se guarda, y por eso todo se actualiza solo (apartados 21 y 23) ──');

ok(AUDITORIA_FIT28.guardaAlgo === false && AUDITORIA_FIT28.normalizador === false, '🚨 El resumen NO se guarda: se deriva (apartado 21)');
ok(!/saveData|loadData|localStorage|sessionStorage/.test(codigo), '…y el código no escribe ni lee de ningún almacén');
ok(!/normalizar[A-Z]/.test(codigo.replace(/import[\s\S]*?from '[^']+';/g, ' ')), '…ni tiene normalizador propio');
ok(AUDITORIA_FIT28.tablasNuevas === 0 && AUDITORIA_FIT28.clavesNuevas === 0, '…ni una tabla ni una clave nuevas');
ok(AUDITORIA_FIT28.politica === 'auth.uid() = user_id', '…y el aislamiento sigue siendo el de `app_data`');
/* La prueba de que «se actualiza solo» no necesita código. */
const antes = centroDeProgreso(TODO, FOTOS, { hoy: HOY }).bloques.entrenamientos.total;
const despues = centroDeProgreso(masUna, FOTOS, { hoy: HOY }).bloques.entrenamientos.total;
ok(despues === antes + 1, '🚨 (32) Entrenamiento nuevo → progreso actualizado, sin invalidar nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 21. Lo que ya existía y no se ha reescrito ──');

ok(YA_EXISTIA.length === 5 && YA_EXISTIA.every((x) => x.pide && x.es && x.donde && x.porque), 'Las cinco piezas que ya estaban, con dónde viven');
const importa = (nombre) => new RegExp(`\\b${nombre}\\b`).test(lib.split('\n').slice(0, 20).join('\n'));
ok(importa('rangoGlobalEfectivo') && importa('historialDeRango'), '🚨 El rango se le pide al motor de la F19 y a la F22, no se calcula aquí');
ok(importa('tarjetasDeProgreso') && importa('resumenMuscular'), '…los ejercicios a la F12 y los músculos a la F13');
ok(importa('listaDeObjetivos') && importa('compararFotos'), '…los objetivos a la F14 y la comparación a la F26');
ok(importa('orientacionDeFoto'), '…y la orientación al comparador de la F27');
ok(!/function\s+(votoMuscular|progresoDeEjercicio|puntuacionDeEjercicio|compararFotos)\b/.test(codigo), '🚨 Y ninguna de esas funciones se reescribe aquí');
ok(/COMPARABLES/.test(leer('src/lib/progresoEjercicios.js').split('\n').filter((l) => l.startsWith('export const COMPARABLES')).join('')), '⚠️ «Qué estados son comparables» se exporta de donde se decidió (F12), en vez de escribirlo dos veces');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 22. La auditoría del apartado 34 ──');

const a = auditarIntegracion(TODO, FOTOS, { hoy: HOY });
ok(a.ok === true, '🚨 Las diez casillas de la condición de finalización, en verde');
a.casillas.forEach((x) => ok(x.ok, `  · ${x.que}`));
/* Y que se puedan poner rojas (EH F42). */
const rota = casillasDeIntegracion({ bloques: { rango: { puntuacionGlobal: 82 } } });
ok(rota.find((x) => x.id === 'sin_metrica').ok === false, '…y la casilla de la métrica inventada SÍ se pone roja con una');
ok(rota.find((x) => x.id === 'parcial').ok === false, '…igual que la de los datos parciales sin entrenamientos');
ok(bloqueResumen('fotos').apartado === 6 && bloqueResumen('nada') === null, 'Cada bloque sabe de qué apartado sale');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log(`\n${fallos === 0 ? '\x1b[32m═══ FIT F28 CORRECTA ═══' : `\x1b[31m═══ ${fallos} FALLOS ═══`}\x1b[0m`);
console.log(`${total} comprobaciones, ${fallos} fallos.\n`);
process.exit(fallos ? 1 : 0);
