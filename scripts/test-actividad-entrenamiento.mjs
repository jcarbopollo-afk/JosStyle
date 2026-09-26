/* Entrega 4 · FIT F31/45 — Consistencia y actividad de entrenamiento.
   ═══════════════════════════════════════════════════════════════════════════
   Las 21 pruebas del apartado 38 y los casos límite del 39, más lo que esta
   fase promete y hay que poder poner rojo:

   1. Que «sin registro» NO sea «descanso» (apartados 28 y 29).
   2. Que no haya ni un porcentaje ni una puntuación (apartados 8, 14 y 40).
   3. Que la racha NO sea de aquí (apartado 16).
   4. Y los cuatro fallos de fases anteriores que la F31 destapó, cada uno con
      su comprobación de que el arreglo SÍ se nota: «7 días» eran ocho, un
      segundo catálogo de periodos, la «última» que era la primera, y una
      sesión sin fecha que se mudaba a hoy (o que contaba doble). */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  YA_LO_RESUELVE, PERIODOS_ACTIVIDAD, periodoActividad, lunesDe, diaYMes,
  sesionesDeActividad, conFecha, ESTADOS_ACTIVIDAD, diaDeActividad, contextoDelPlan,
  adherenciaDelPlan, entrenamientosEnPeriodo, SEMANAS_MINIMAS_MEDIA, constancia, mediaSemanal,
  RECIENTES_MAX, ESTADO_PARCIAL, ESTADO_COMPLETA, tarjetaDeSesion, SIN_ENTRENAMIENTOS,
  CAMPOS_APARTADO_19, resumenDeActividad, getTrainingActivitySummary, mesDeActividad,
  sesionesDelDiaDeActividad, NO_EN_FIT31, DECISIONES_FIT31, auditarActividad,
} from '../src/lib/actividadEntrenamiento.js';
import { PERIODOS, RANGOS_GRAFICA, inicioDePeriodo } from '../src/lib/progresoEjercicios.js';
import { PERIODOS_HISTORIAL } from '../src/lib/historialRangos.js';
import { bloqueEntrenamientos } from '../src/lib/resumenProgreso.js';
import {
  sesionesDelHistorial, historialPorReciente, ultimaDelHistorial, duracionConocida, fichaDeHistorial,
} from '../src/lib/historial.js';
import {
  DEFAULT_FITNESS, normalizarWorkoutSession, fechaDeSesionGuardada, sinDuplicadosPorId, normalizarFitness,
} from '../src/lib/fitness.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion, normalizarFitnessConSesiones,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { crearPlanActivo } from '../src/lib/planes.js';
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

/* Jueves 24 de septiembre de 2026. La semana es la del lunes 21. */
const HOY = '2026-09-24';

/** Una sesión completada, a mano: lo que el historial lee y nada más. */
function S(id, fecha, { nombre = 'Push', hora = 18, minutos = 60, estado = 'completada', ...extra } = {}) {
  const ini = new Date(`${fecha}T${String(hora).padStart(2, '0')}:00:00`).getTime();
  return {
    id, fecha, nombre, estado,
    iniciadaEn: ini, terminadaEn: ini + minutos * 60000,
    origen: { tipo: 'plan', id: null, ejercicios: [] },
    ...extra,
  };
}
const F = (...sesiones) => ({ ...DEFAULT_FITNESS, sesiones });

/** Una sesión de verdad, por el flujo de la F7/F8: `hechas` de `series`. */
function real(fecha, { series = 3, hechas = 3, nombre = 'Tirón' } = {}) {
  let r = crearRutina({ nombre });
  r = anadirEjercicio(r, 'dominada-prona');
  if (!r.lineas.length) throw new Error('«dominada-prona» no está en el catálogo');
  r = editarLinea(r, r.lineas[0].id, { series, tipoCarga: 'corporal' });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  for (let i = 0; i < hechas; i += 1) {
    s = editarSerie(s, e.id, e.series[i].id, { reps: 8 });
    s = marcarSerie(s, e.id, e.series[i].id, true);
  }
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3000000 }), { confirmado: true, ahora: inicio + 3001000 }).sesion;
}

/** El plan activo, desde una fecha. */
const conPlan = (f, planId = 'ppl-estetico', desde = '2026-09-07', origen = 'preset') => ({
  ...f, planActivo: crearPlanActivo({ planId, origen, desde }),
});

console.log('\n═══ FIT F31/45 · Consistencia y actividad de entrenamiento ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 0. Los fallos de antes que la F31 destapó, arreglados donde nacían ──');

/* A) «7 días» eran ocho (F12, F13, F22, F28, F29). */
ok(inicioDePeriodo(7, '2026-09-25') === '2026-09-19',
  '🐛 «7 días» empieza SEIS días atrás: hoy es uno de los siete (antes, el 18: ocho días)');
ok(inicioDePeriodo(30, '2026-09-25') === '2026-08-27' && inicioDePeriodo(1, '2026-09-25') === '2026-09-25',
  '…«30 días» empieza el 27 de agosto, y «1 día» es hoy');
ok(inicioDePeriodo(null) === null && inicioDePeriodo(0) === null && inicioDePeriodo('x') === null,
  '…y «Todo» (sin días) no tiene inicio');
const fuentesPeriodo = ['src/lib/progresoEjercicios.js', 'src/lib/progresoMuscular.js', 'src/lib/resumenProgreso.js',
  'src/lib/detalleEjercicio.js', 'src/lib/historialRangos.js'].map((p) => [p, sinComentarios(leer(p))]);
const aMano = fuentesPeriodo.filter(([, src]) => /addDays\(hoy,\s*-\s*(?:p|r)\.dias\)|addDays\(hoy,\s*-periodo\(/.test(src));
ok(aMano.length === 0, `🚨 Ni un «addDays(hoy, -p.dias)» suelto en Fitness: el primer día lo decide inicioDePeriodo${aMano.length ? ` (quedan en ${aMano.map(([p]) => p).join(', ')})` : ''}`);
ok(/addDays\(hoy,\s*-\s*(?:p|r)\.dias\)/.test('const desde = addDays(hoy, -p.dias);'),
  '…y el barrido SÍ caza la forma vieja (EH F42)');

/* B) Un segundo catálogo de periodos (F22). */
ok(PERIODOS_HISTORIAL.map((p) => p.id).join() === 'todo,3m,6m,1a'
  && PERIODOS_HISTORIAL.every((p) => PERIODOS.includes(p)),
  '🐛 Los periodos del historial de rangos SON los del catálogo único (los mismos objetos), en su orden');
ok(PERIODOS_HISTORIAL.find((p) => p.id === '3m').dias === 91 && PERIODOS_HISTORIAL.find((p) => p.id === '6m').dias === 182,
  '…así que «3 meses» vale 91 días en todas partes, no 90 en una pantalla y 91 en otra');

/* C) La «última» que era la primera (F28). */
const DESORDEN = F(S('vieja', '2026-08-01', { nombre: 'Vieja' }), S('media', '2026-09-01'), S('nueva', '2026-09-22', { nombre: 'Nueva' }));
ok(sesionesDelHistorial(DESORDEN)[0].id === 'vieja',
  '⚠️ Las sesiones se guardan al FINAL: la primera de la lista es la más antigua');
ok(bloqueEntrenamientos(DESORDEN, { hoy: HOY }).ultima.id === 'nueva',
  '🐛 …y la «última» de la F28 es ahora la más reciente (antes decía «Vieja»)');
ok(ultimaDelHistorial(DESORDEN).id === 'nueva' && historialPorReciente(DESORDEN).map((s) => s.id).join() === 'nueva,media,vieja',
  '…por fecha, con `historialPorReciente` — una sola función para las dos fases');
const MISMO_DIA = F(S('tarde', HOY, { hora: 19 }), S('manana', HOY, { hora: 8 }));
ok(historialPorReciente(MISMO_DIA)[0].id === 'tarde' && historialPorReciente(F(S('manana', HOY, { hora: 8 }), S('tarde', HOY, { hora: 19 })))[0].id === 'tarde',
  '…y el mismo día, la de la hora más tardía, esté donde esté en la lista');

/* D) Una sesión sin fecha se mudaba a HOY en cada carga (F1/F7). */
const sinFechaConMarca = normalizarWorkoutSession({ id: 'x', estado: 'completada', iniciadaEn: new Date('2026-09-12T23:50:00').getTime() });
ok(sinFechaConMarca.fecha === '2026-09-12',
  '🐛 Guardada sin fecha pero con marca de inicio: su día es el del INICIO (apartado 24), no hoy');
ok(normalizarWorkoutSession({ id: 'x', estado: 'completada' }).fecha === '',
  '🐛 Sin fecha y sin ninguna marca: `\'\'` — antes se le ponía la de hoy en cada carga');
ok(normalizarWorkoutSession({ id: 'x', fecha: '2026-13-45', terminadaEn: new Date('2026-09-10T20:00:00').getTime() }).fecha === '2026-09-10',
  '…una fecha imposible («2026-13-45») cae a la marca de tiempo más fiable');
ok(normalizarWorkoutSession({ id: 'x', fecha: '2026-09-01', iniciadaEn: new Date('2026-09-12T10:00:00').getTime() }).fecha === '2026-09-01',
  '…y una fecha válida guardada MANDA: el normalizador no reescribe lo que ya está bien');
ok(fechaDeSesionGuardada({ guardadaEn: new Date('2026-09-11T09:00:00').getTime() }) === '2026-09-11',
  '…cuándo la guardó es el último recurso');
ok(normalizarFitnessConSesiones({ sesiones: [{ id: 'a', estado: 'completada' }] }).sesiones[0].fecha === '',
  '…también por la puerta de carga de verdad, la que llama `App.jsx`');

/* E) Una sesión repetida contaba doble (apartado 23). */
const REPETIDA = { sesiones: [S('rep', '2026-09-22', { nombre: 'Primera copia' }), S('otra', '2026-09-21'), S('rep', '2026-09-22', { nombre: 'Segunda copia' })] };
const cargada = normalizarFitnessConSesiones(REPETIDA);
ok(cargada.sesiones.length === 2, '🐛 Una sesión guardada dos veces se carga UNA vez (apartado 23)');
ok(cargada.sesiones.find((s) => s.id === 'rep').nombre === 'Segunda copia',
  '…gana la última copia, que es la más reciente en guardarse');
ok(normalizarFitness(REPETIDA).sesiones.length === 2, '…también en la capa de la F1');
ok(sinDuplicadosPorId([{ id: 'a' }, null, { id: 'b' }, { id: 'a', v: 2 }]).length === 2,
  '…y `sinDuplicadosPorId` no se rompe con huecos');

/* F) Una duración que nadie midió decía «menos de 1 min». */
const SIN_MARCAS = { id: 'sm', fecha: '2026-09-20', estado: 'completada', nombre: 'Sin marcas', origen: { tipo: 'plan', ejercicios: [] } };
ok(!duracionConocida(SIN_MARCAS) && fichaDeHistorial(SIN_MARCAS).duracion === '',
  '🐛 Sin marcas de tiempo, la tarjeta del historial NO dice «menos de 1 min» (apartado 39)');
ok(!duracionConocida({ iniciadaEn: 2000, terminadaEn: 1000 }), '…ni con el fin antes del inicio');
ok(duracionConocida(S('ok', HOY, { minutos: 45 })) && fichaDeHistorial(S('ok', HOY, { minutos: 45 })).duracion === '45 min',
  '…y con las dos marcas en orden sí: «45 min»');
ok(fichaDeHistorial({ ...S('corta', HOY), terminadaEn: S('corta', HOY).iniciadaEn + 20000 }).duracion === 'menos de 1 min',
  '…y una sesión de verdad de veinte segundos sigue diciendo «menos de 1 min»: eso sí se midió');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Sin entrenamientos (prueba 1, apartado 3) ──');

const VACIO = resumenDeActividad(F(), { hoy: HOY });
ok(VACIO.hay === false && VACIO.vacio === SIN_ENTRENAMIENTOS && SIN_ENTRENAMIENTOS === 'Sin entrenamientos todavía',
  '🚨 «Sin entrenamientos todavía» (apartado 3, literal)');
ok(VACIO.ultimo === null && VACIO.constancia === null && VACIO.frecuencia === null && VACIO.recientes.length === 0,
  '…sin último, sin constancia, sin media y sin recientes');
ok(Object.keys(VACIO.campos).length === 0,
  '🚨 Y el resumen del apartado 19 NO trae campos: «solo devolver campos que puedan calcularse»');
ok(resumenDeActividad(null, { hoy: HOY }).hay === false && resumenDeActividad({ sesiones: [null, 7, {}] }, { hoy: HOY }).total === 0,
  '…ni se rompe con un fitness nulo o con basura en la lista');
ok(VACIO.semana.dias.length === 7 && VACIO.semana.dias.every((d) => d.estado !== 'descanso'),
  '…la semana se dibuja igual, y sin plan ningún día es «descanso»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Un entrenamiento (prueba 2) ──');

const UNO = resumenDeActividad(F(S('u1', HOY, { nombre: 'Push', minutos: 58 })), { hoy: HOY });
ok(UNO.ultimo.etiquetaFecha === 'Hoy' && UNO.ultimo.nombre === 'Push' && UNO.ultimo.duracion === '58 min',
  '🚨 «Hoy · Push · 58 min» (el ejemplo del apartado 3)');
ok(UNO.total === 1 && UNO.totalTexto === '1 entrenamiento', '…«1 entrenamiento», en singular');
ok(UNO.constancia.frase === 'Hoy es tu primer entrenamiento registrado.',
  '…y la constancia no dice «1 de los últimos 1 días»: dice lo que es');
ok(UNO.frecuencia === null && /2 semanas completas/.test(UNO.frecuenciaMotivo),
  '🚨 Sin historial suficiente, NO hay media (apartado 9)');
ok('ultimoEntrenamiento' in UNO.campos && !('mediaSemanal' in UNO.campos) && !('sesionesPlanificadas' in UNO.campos),
  '…y el resumen trae el último, pero NI la media NI el plan: no se pueden calcular');
ok(getTrainingActivitySummary === resumenDeActividad, '…la función central del apartado 20, también con su nombre');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Varios entrenamientos (prueba 3) ──');

const VARIOS = F(
  S('v1', '2026-09-01', { nombre: 'A' }), S('v2', '2026-09-10', { nombre: 'B' }), S('v3', '2026-09-15', { nombre: 'C' }),
  S('v4', '2026-09-18', { nombre: 'D' }), S('v5', '2026-09-22', { nombre: 'E' }), S('v6', '2026-09-23', { nombre: 'F' }),
);
const rV = resumenDeActividad(VARIOS, { hoy: HOY });
ok(rV.ultimo.id === 'v6' && rV.ultimo.etiquetaFecha === 'Ayer', '🚨 El último es el más reciente: «Ayer · F»');
ok(rV.recientes.length === RECIENTES_MAX && RECIENTES_MAX >= 3 && RECIENTES_MAX <= 5,
  `🚨 Actividad reciente: ${RECIENTES_MAX}, dentro de los «3–5» del apartado 17`);
ok(rV.recientes.map((t) => t.id).join() === 'v6,v5,v4,v3' && rV.hayMasRecientes === true,
  '…de la más nueva a la más vieja, y avisa de que hay más');
ok(rV.recientes.every((t) => t.fecha && t.nombre && t.duracion && t.estado),
  '…y cada tarjeta lleva fecha, nombre, duración y estado (apartado 17)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Semana actual y semana anterior (pruebas 4, 5 y 18; apartados 4, 6 y 10) ──');

const SEMANAS = F(
  S('lun', '2026-09-21', { nombre: 'Push' }), S('mie', '2026-09-23', { nombre: 'Legs' }),
  S('p1', '2026-09-14'), S('p2', '2026-09-16'), S('p3', '2026-09-20'),
  S('vieja', '2026-09-13'),
);
const rS = resumenDeActividad(SEMANAS, { hoy: HOY });
ok(rS.semana.desde === '2026-09-21' && rS.semana.hasta === '2026-09-27', '⚠️ La semana es de LUNES a domingo (apartado 22)');
ok(rS.semana.entrenamientos === 2 && rS.semana.texto === '2 entrenamientos · semana en curso',
  '🚨 «2 entrenamientos · semana en curso» — el número real y que la semana no ha terminado (apartados 4 y 10)');
ok(rS.semana.anterior.entrenamientos === 3 && rS.semana.anterior.texto === 'La semana pasada: 3 entrenamientos',
  '🚨 La semana anterior, completa, del 14 al 20 — sin el 13, que es de la otra (prueba 5)');
const estados = rS.semana.dias.map((d) => d.estado).join();
ok(estados === 'entrenado,sin_registro,entrenado,sin_registro,futuro,futuro,futuro',
  `🚨 L ● · M — · X ● · J — · y el resto «todavía no ha llegado» (${estados})`);
ok(rS.semana.dias[0].etiqueta === '21 de septiembre — entrenamiento Push',
  '🚨 «21 de septiembre — entrenamiento Push», con palabras (apartado 37)');
ok(rS.semana.dias[1].etiqueta === '22 de septiembre — sin entrenamiento registrado',
  '🚨 …y el martes NO dice «descanso»: dice «sin entrenamiento registrado» (apartados 28 y 29)');
ok(rS.semana.dias[3].esHoy && rS.semana.dias[3].corto === 'J' && rS.semana.dias.map((d) => d.corto).join('') === 'LMXJVSD',
  '…hoy es el jueves, y las letras son L M X J V S D (apartado 6)');
ok(rS.semana.dias.filter((d) => d.navegable).map((d) => d.fecha).join() === '2026-09-21,2026-09-23',
  '…y solo los días con entrenamiento llevan a algo (apartado 30)');
const vacia = resumenDeActividad(F(S('x', '2026-09-15')), { hoy: HOY });
ok(vacia.semana.texto === 'Ninguno todavía · semana en curso' && !/\b0 entrenamientos\b/.test(vacia.semana.texto),
  '…una semana sin entrenar dice «Ninguno todavía», sin tono de reproche');

/* Cambio de semana: el lunes empieza otra. */
const rLunes = resumenDeActividad(F(S('dom', '2026-09-27'), S('hoy', '2026-09-28')), { hoy: '2026-09-28' });
ok(rLunes.semana.desde === '2026-09-28' && rLunes.semana.entrenamientos === 1 && rLunes.semana.anterior.entrenamientos === 1,
  '🚨 El lunes cambia la semana: el domingo pasa a «la semana pasada» (prueba 18)');
ok(lunesDe('2026-09-27') === '2026-09-21' && lunesDe('2026-09-28') === '2026-09-28' && lunesDe('nada') === null,
  '…un domingo es de la semana que empezó el lunes anterior');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Los periodos: 7 días, 30 días, 3 meses y Todo (pruebas 6-8, apartado 5) ──');

ok(PERIODOS_ACTIVIDAD === RANGOS_GRAFICA && PERIODOS_ACTIVIDAD.map((p) => p.id).join() === '7d,30d,3m,todo',
  '🚨 Los cuatro del apartado 5 son LOS DE LA F28, del catálogo único (ni un catálogo más)');
ok(periodoActividad('nada').id === 'todo', '…y uno desconocido cae en «Todo»');
const BORDES = F(
  S('h0', HOY), S('h6', addDays(HOY, -6)), S('h7', addDays(HOY, -7)),
  S('h29', addDays(HOY, -29)), S('h30', addDays(HOY, -30)),
  S('h90', addDays(HOY, -90)), S('h91', addDays(HOY, -91)), S('h400', addDays(HOY, -400)),
);
const n = (p) => entrenamientosEnPeriodo(BORDES, { periodo: p, hoy: HOY }).length;
ok(n('7d') === 2, `🚨 7 días: hoy y hace 6 — la de hace 7 ya no (${n('7d')})`);
ok(n('30d') === 4, `🚨 30 días: hasta hace 29 (${n('30d')})`);
ok(n('3m') === 6, `🚨 3 meses (91 días): hasta hace 90 (${n('3m')})`);
ok(n('todo') === 8, `🚨 Todo: las ocho (${n('todo')})`);
ok(bloqueEntrenamientos(BORDES, { periodo: '7d', hoy: HOY }).enPeriodo === n('7d')
  && bloqueEntrenamientos(BORDES, { periodo: '30d', hoy: HOY }).enPeriodo === n('30d'),
  '🚨 Y el bloque de entrenamientos de la F28 dice EL MISMO número: es la misma función');
const r7 = resumenDeActividad(BORDES, { periodo: '7d', hoy: HOY });
const rT = resumenDeActividad(BORDES, { periodo: 'todo', hoy: HOY });
ok(r7.periodo.entrenamientos === 2 && rT.periodo.entrenamientos === 8, '…y el resumen también');
ok(r7.ultimo.id === rT.ultimo.id && r7.semana.texto === rT.semana.texto && r7.total === rT.total,
  '⚠️ El periodo NO cambia ni el último, ni «esta semana», ni el total (DECISIONES_FIT31)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Constancia y media semanal (apartados 8 y 9) ──');

const CONST = F(
  /* ⚠️ Más vieja que cualquier periodo: si cayera dentro de «3 meses», la
     frase pasaría a ser «desde tu primer entrenamiento», que es otro caso. */
  S('c0', '2026-05-01'),
  S('c1', HOY), S('c2', addDays(HOY, -2)), S('c3', addDays(HOY, -2), { hora: 9 }), S('c4', addDays(HOY, -5)),
);
const rC7 = resumenDeActividad(CONST, { periodo: '7d', hoy: HOY });
ok(rC7.constancia.frase === 'Entrenaste 3 de los últimos 7 días.',
  '🚨 «Entrenaste 3 de los últimos 7 días.» — días, no sesiones: dos el mismo día cuentan uno (apartado 8)');
ok(rC7.periodo.entrenamientos === 4 && rC7.periodo.diasActivos === 3,
  '…4 entrenamientos en 3 días activos (apartado 19: `activeDays`)');
ok(!/%|consistencia/i.test(JSON.stringify(rC7.constancia)),
  '🚨 Ni un «Consistencia 82 %» (apartado 8)');
const rC3m = resumenDeActividad(CONST, { periodo: '3m', hoy: HOY });
ok(rC3m.constancia.frase === 'Entrenaste 3 días en los últimos 3 meses.',
  '…con 3 meses se dice «en los últimos 3 meses», no «de los últimos 91 días»');
/* ⚠️ Recortado: no cuenta días anteriores a su primer entrenamiento. */
const RECIENTE = F(S('r1', addDays(HOY, -4)), S('r2', HOY));
const rR = resumenDeActividad(RECIENTE, { periodo: '30d', hoy: HOY });
ok(rR.constancia.frase === 'Entrenaste 2 de los 5 días desde tu primer entrenamiento.',
  '🚨 Empezó hace 5 días: «2 de los 5 días desde tu primer entrenamiento», no «2 de los últimos 30» (engañaría)');
ok(constancia(new Map(), { inicio: null, hoy: HOY, primera: null, periodoNombre: 'Todo' }) === null,
  '…y sin ningún entrenamiento no hay frase');

/* La media: solo con semanas completas, y al menos dos. */
const MEDIA = F(
  S('m1', '2026-09-07'), S('m2', '2026-09-09'), S('m3', '2026-09-11'),
  S('m4', '2026-09-14'), S('m5', '2026-09-15'), S('m6', '2026-09-17'), S('m7', '2026-09-19'),
  S('m8', '2026-09-21'), S('m9', '2026-09-22'), S('m10', '2026-09-23'), S('m11', HOY),
);
const rM = resumenDeActividad(MEDIA, { periodo: 'todo', hoy: HOY });
ok(rM.frecuencia && rM.frecuencia.texto === 'Media: 3,5 entrenamientos/semana',
  `🚨 «Media: 3,5 entrenamientos/semana» — 7 en dos semanas completas (${rM.frecuencia && rM.frecuencia.texto})`);
ok(rM.frecuencia.semanas === 2 && /sin contar la semana en curso/.test(rM.frecuencia.detalle),
  '🚨 …SIN la semana en curso, que lleva 4 y la subiría a 3,7 (apartado 9: «no usar semanas parciales»)');
ok(rM.campos.mediaSemanal === 3.5, '…y `averagePerWeek` es 3,5 en el resumen');
const rM7 = resumenDeActividad(MEDIA, { periodo: '7d', hoy: HOY });
ok(rM7.frecuencia === null && !('mediaSemanal' in rM7.campos),
  '🚨 Con «7 días» no cabe ni una semana completa: no hay media, y el campo no está');
ok(SEMANAS_MINIMAS_MEDIA === 2 && mediaSemanal([], { inicio: null, hoy: HOY, primera: null }).media === null,
  '…el mínimo son dos semanas completas');
const MEDIA_UNA = F(S('u1', '2026-09-14'), S('u2', '2026-09-16'), S('u3', HOY));
ok(resumenDeActividad(MEDIA_UNA, { periodo: 'todo', hoy: HOY }).frecuencia === null,
  '…y con una sola semana completa, tampoco: sería el número de esa semana con otro nombre');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Parciales, descartadas y en curso (pruebas 9 y 10, apartado 15) ──');

const parcial = real('2026-09-22', { series: 4, hechas: 2, nombre: 'Parcial' });
const completa = real('2026-09-21', { series: 3, hechas: 3, nombre: 'Completa' });
const PARC = [completa, parcial].reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const rP = resumenDeActividad(PARC, { hoy: HOY });
const tParcial = rP.recientes.find((t) => t.id === parcial.id);
const tCompleta = rP.recientes.find((t) => t.id === completa.id);
ok(tParcial && tParcial.parcial === true && tParcial.estado === ESTADO_PARCIAL && ESTADO_PARCIAL === 'Parcial',
  '🚨 Una sesión parcial lleva su indicador «Parcial» (apartado 15)');
ok(tCompleta && tCompleta.parcial === false && tCompleta.estado === ESTADO_COMPLETA,
  '…y la completa dice «Completa»');
ok(rP.semana.entrenamientos === 2, '🚨 …y la parcial CUENTA como entrenamiento: él la guardó (apartado 2)');
const DESC = F(
  S('ok', '2026-09-22'), S('desc', '2026-09-22', { estado: 'descartada' }),
  S('curso', HOY, { estado: 'en_curso' }), S('fin', HOY, { estado: 'finalizando' }), S('plan', HOY, { estado: 'planificada' }),
);
const rD = resumenDeActividad(DESC, { hoy: HOY });
ok(rD.total === 1 && rD.semana.entrenamientos === 1,
  '🚨 Ni la descartada, ni la que está en curso, ni la que está a medio guardar cuentan (prueba 10)');
ok(rD.semana.dias[3].estado === 'sin_registro', '…así que hoy sigue «sin registro» aunque haya una empezada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. El plan activo (pruebas 12-15, apartados 11-14 y 25-26) ──');

/* PPL: L Push · M Pull · X Legs · J — · V Upper · S Lower · D —, activo desde hace dos semanas. */
const PLAN = conPlan(F(S('l', '2026-09-21', { nombre: 'Push' }), S('x', '2026-09-23', { nombre: 'Legs' })));
const rPl = resumenDeActividad(PLAN, { hoy: HOY });
ok(rPl.plan && rPl.plan.planificadas === 5 && rPl.plan.realizadas === 2,
  '🚨 La semana del plan: 5 planificadas, 2 realizadas (apartado 11)');
ok(rPl.plan.texto === '2 / 5 sesiones planificadas', '🚨 «2 / 5 sesiones planificadas» — sin nota (apartado 11)');
ok(rPl.plan.detalle === 'L Push · M Pull · X Legs · V Upper · S Lower',
  '🚨 La estructura REAL del plan: «L Push · M Pull · X Legs · V Upper · S Lower» (apartado 12)');
ok(rPl.campos.sesionesPlanificadas === 5 && rPl.campos.sesionesPlanificadasHechas === 2,
  '…y los dos campos del apartado 19, porque ahora sí se pueden calcular');
/* 🔓 FIT F32, apartado 5 — decía «descanso del plan». La F32 va más lejos: ni
   un día sin sesión en el plan se afirma como descanso, porque puede haber
   entrenamiento libre. El estado sigue siendo `descanso` —lo autoriza el plan—;
   cambia la palabra. */
ok(rPl.semana.dias[3].estado === 'descanso' && rPl.semana.dias[3].etiqueta === '24 de septiembre — sin entrenamiento planificado',
  '🚨 El jueves no tiene entrenamiento porque el plan lo dice — y lo dice así: «sin entrenamiento planificado» (apartado 28 y F32)');
ok(rPl.semana.dias[1].estado === 'sin_registro' && rPl.semana.dias[1].planificado === 'Pull',
  '🚨 El martes tocaba Pull y no hay sesión: «sin registro», NUNCA un «incumplido» (apartados 6 y 12)');
ok(!/incumpl|fall|perd|%/i.test(JSON.stringify(rPl.plan)), '…ni una palabra de reproche ni un porcentaje');
/* Martes en vez de lunes. */
const MOVIDO = conPlan(F(S('m', '2026-09-22', { nombre: 'Push' })));
const rMo = resumenDeActividad(MOVIDO, { hoy: HOY });
ok(rMo.plan.realizadas === 1 && rMo.plan.hechasDelPlan === 1 && rMo.semana.dias[0].estado === 'sin_registro',
  '🚨 Entrenó el martes en vez del lunes: cuenta como realizada, y el lunes no es un fallo (apartado 12)');
/* Sesiones extra. */
const EXTRA = conPlan(F(...['2026-09-21', '2026-09-21', '2026-09-22', '2026-09-23', HOY, HOY].map((f, i) => S(`e${i}`, f, { hora: 8 + i }))));
const rE = resumenDeActividad(EXTRA, { hoy: HOY });
ok(rE.plan.realizadas === 6 && rE.plan.extra === 1 && rE.plan.texto === '6 entrenamientos · 5 planificados',
  '🚨 6 hechas con 5 planificadas: «6 entrenamientos · 5 planificados», NO «120 %» (apartado 14)');
ok(rE.plan.hechasDelPlan === 5 && rE.campos.sesionesPlanificadasHechas === 5,
  '…las del plan cubiertas son 5, sin pasar de las planificadas');
ok(!/%/.test(JSON.stringify(rE)), '🚨 …y en TODO el resumen no hay ni un «%» (apartado 40)');
/* Activado el miércoles. */
const MIERCOLES = conPlan(F(S('antes', '2026-09-21'), S('despues', '2026-09-23')), 'ppl-estetico', '2026-09-23');
const rMi = resumenDeActividad(MIERCOLES, { hoy: HOY });
ok(rMi.plan.planificadas === 3 && rMi.plan.realizadas === 1 && rMi.plan.desdeActivacion,
  '🚨 Activado el miércoles: 3 planificadas (Legs, Upper, Lower) y la del lunes NO es «de este plan»');
ok(rMi.semana.dias[0].estado === 'entrenado' && rMi.semana.dias[1].estado === 'sin_registro',
  '…pero el lunes sigue siendo un entrenamiento, y el martes —antes del plan— no es «descanso»');
/* Sin plan. */
ok(rS.plan === null && !('sesionesPlanificadas' in rS.campos) && contextoDelPlan(SEMANAS) === null,
  '🚨 Sin plan: el bloque NO existe, y los campos tampoco (prueba 13)');
/* Plantilla suya como plan: sin frecuencia definida. */
const conPlantilla = {
  ...F(S('p', '2026-09-22')),
  plantillas: [{ id: 'mia', nombre: 'Mi rutina', lineas: [] }],
  planActivo: crearPlanActivo({ planId: 'mia', origen: 'plantilla', desde: '2026-09-01' }),
};
const rPt = resumenDeActividad(conPlantilla, { hoy: HOY });
ok(rPt.plan === null && rPt.semana.dias.every((d) => d.estado !== 'descanso' && !d.planificado),
  '🚨 Una plantilla suya activada como plan NO anuncia frecuencia: ni bloque, ni «siete planificadas», ni descansos (apartado 13)');
/* Plan eliminado. */
const BORRADO = conPlan(F(S('b', '2026-09-22', { nombre: 'Push del plan viejo', planId: 'plan-que-ya-no-existe' })), 'plan-que-ya-no-existe');
const rB = resumenDeActividad(BORRADO, { hoy: HOY });
ok(rB.plan === null && rB.total === 1 && rB.ultimo.nombre === 'Push del plan viejo',
  '🚨 Plan eliminado: la sesión SIGUE contando, con su nombre histórico (prueba 14, apartado 25)');
/* Plan cambiado. */
const CAMBIADO = conPlan(PLAN, 'upper-lower', '2026-09-21');
const rCa = resumenDeActividad(CAMBIADO, { hoy: HOY });
ok(rCa.total === rPl.total && rCa.recientes.map((t) => `${t.id}${t.nombre}`).join() === rPl.recientes.map((t) => `${t.id}${t.nombre}`).join(),
  '🚨 Cambiar de plan NO toca el historial: mismas sesiones, mismos nombres (prueba 15, apartado 26)');
ok(rCa.plan.planificadas === 4 && rCa.plan.detalle.startsWith('L Upper A'),
  '…y la semana se compara con el plan NUEVO: 4 planificadas, «L Upper A…»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Duplicados y datos corruptos (pruebas 16 y 17, apartados 23 y 24) ──');

const DUP = { sesiones: [S('d', '2026-09-22'), S('d', '2026-09-22'), S('d2', '2026-09-21')] };
const rDup = resumenDeActividad(DUP, { hoy: HOY });
ok(rDup.total === 2 && rDup.semana.entrenamientos === 2 && sesionesDeActividad(DUP).length === 2,
  '🚨 Una sesión guardada dos veces cuenta UNA (apartado 23) — incluso si llega sin normalizar');
ok(rDup.recientes.length === 2, '…y no sale dos veces en la actividad reciente');
const CORRUPTO = normalizarFitnessConSesiones({
  sesiones: [
    { id: 'sin-nada', estado: 'completada', nombre: 'Sin fecha' },
    { id: 'con-marca', estado: 'completada', nombre: 'Por su marca', iniciadaEn: new Date('2026-09-22T10:00:00').getTime() },
    S('buena', '2026-09-21'),
    null,
  ],
});
const rCo = resumenDeActividad(CORRUPTO, { hoy: HOY });
ok(rCo.total === 3 && rCo.sinFecha === 1,
  '🚨 Tres sesiones: una sin ninguna marca NO entra en el calendario, pero sigue en el total (apartado 24)');
ok(rCo.avisoSinFecha === 'Un entrenamiento no tiene fecha y no aparece en el calendario.',
  '…y se dice, en vez de esconderla');
ok(rCo.semana.entrenamientos === 2 && rCo.semana.dias[1].sesiones[0].id === 'con-marca',
  '🚨 …la que tenía marca de inicio cae en su día, el martes');
ok(rCo.recientes.every((t) => t.id !== 'sin-nada') && rCo.ultimo.id === 'con-marca',
  '…y la sin fecha no puede ser «la última» de nada: no se sabe cuándo fue');
ok(conFecha({ fecha: '2026-09-22' }) && !conFecha({ fecha: '' }) && !conFecha({ fecha: '2026-02-30' }) && !conFecha(null),
  '…una fecha imposible tampoco es una fecha');
const sinDur = resumenDeActividad(F({ ...SIN_MARCAS, fecha: '2026-09-22' }), { hoy: HOY });
ok(sinDur.ultimo.duracion === '' && sinDur.total === 1,
  '🚨 Sesión sin duración válida: cuenta, y no se le inventa una duración (apartado 39)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Medianoche, cambio de mes y cambio de año (apartados 21 y 39) ──');

/* Empezó a las 23:50 del 22 y la guardó a las 00:40 del 23. */
const NOCHE = { ...S('noche', '2026-09-22', { hora: 23, minutos: 50 }) };
const MADRUGADA = { ...S('madrugada', '2026-09-23', { hora: 0, minutos: 30 }) };
const rN = resumenDeActividad(F(NOCHE, MADRUGADA), { hoy: HOY });
ok(rN.semana.dias[1].sesiones.map((s) => s.id).join() === 'noche' && rN.semana.dias[2].sesiones.map((s) => s.id).join() === 'madrugada',
  '🚨 Justo antes de medianoche es del día en que EMPEZÓ; justo después, del siguiente');
ok(normalizarWorkoutSession({ id: 'n', estado: 'completada', iniciadaEn: new Date('2026-09-22T23:55:00').getTime(), terminadaEn: new Date('2026-09-23T00:45:00').getTime() }).fecha === '2026-09-22',
  '…también cuando la fecha hay que deducirla de las marcas: manda el inicio');
/* Cambio de mes: jueves 1 de octubre. */
const OCT = F(S('s29', '2026-09-29'), S('s30', '2026-09-30'), S('o1', '2026-10-01'));
const rO = resumenDeActividad(OCT, { hoy: '2026-10-01' });
ok(rO.semana.desde === '2026-09-28' && rO.semana.entrenamientos === 3,
  '🚨 Cambio de mes: la semana del 28 de septiembre sigue siendo UNA semana, con los tres');
const mOct = mesDeActividad(OCT, { hoy: '2026-10-01' });
const mSep = mesDeActividad(OCT, { mes: '2026-09', hoy: '2026-10-01' });
ok(mOct.mes === '2026-10' && mOct.diasConEntrenamiento === 1 && mSep.diasConEntrenamiento === 2,
  '…el mes de octubre tiene uno y septiembre dos: cada uno en el suyo');
ok(mOct.titulo === 'Octubre 2026' && mOct.celdas.filter(Boolean).length === 31 && mOct.celdas.indexOf(mOct.celdas.find(Boolean)) === 3,
  '…con la cuadrícula del Calendario: octubre de 2026 empieza en jueves (tres huecos delante)');
ok(mOct.anterior === '2026-09' && mOct.haySiguiente === false && mSep.haySiguiente === true,
  '…se puede ir al mes anterior, y no a uno que todavía no ha empezado');
/* Cambio de año: viernes 1 de enero de 2027. */
const ANIO = F(S('d28', '2026-12-28'), S('d31', '2026-12-31'), S('e1', '2027-01-01'));
const rA = resumenDeActividad(ANIO, { hoy: '2027-01-01' });
ok(rA.semana.desde === '2026-12-28' && rA.semana.entrenamientos === 3,
  '🚨 Cambio de año: la semana del 28 de diciembre al 3 de enero es una sola');
const mEne = mesDeActividad(ANIO, { hoy: '2027-01-01' });
ok(mEne.anterior === '2026-12' && mesDeActividad(ANIO, { mes: '2026-12', hoy: '2027-01-01' }).siguiente === '2027-01',
  '…y diciembre y enero se encadenan cruzando el año');
ok(diaYMes('2027-01-01') === '1 de enero' && diaYMes('2026-12-31') === '31 de diciembre' && diaYMes('x') === '',
  '…«1 de enero», «31 de diciembre»');
/* Varios el mismo día. */
const DOBLE = F(S('ma', '2026-09-22', { nombre: 'Push', hora: 8 }), S('ta', '2026-09-22', { nombre: 'Pull', hora: 19 }));
const rDo = resumenDeActividad(DOBLE, { hoy: HOY });
ok(rDo.semana.dias[1].sesiones.length === 2 && rDo.semana.dias[1].etiqueta === '22 de septiembre — 2 entrenamientos: Push y Pull',
  '🚨 Varios el mismo día: el día los lleva todos, y lo dice');
ok(rDo.periodo.entrenamientos === 2 && rDo.periodo.diasActivos === 1,
  '…son 2 entrenamientos en 1 día activo');
ok(sesionesDelDiaDeActividad(DOBLE, '2026-09-22', { hoy: HOY }).map((t) => t.nombre).join() === 'Pull,Push',
  '…y al elegir el día salen los dos, el más reciente primero (apartado 30)');
const DOBLE_AL_REVES = F(S('ta', '2026-09-22', { nombre: 'Pull', hora: 19 }), S('ma', '2026-09-22', { nombre: 'Push', hora: 8 }));
ok(resumenDeActividad(DOBLE_AL_REVES, { hoy: HOY }).semana.dias[1].etiqueta === '22 de septiembre — 2 entrenamientos: Push y Pull',
  '…y la etiqueta los nombra en el orden en que los HIZO, no en el que se guardaron');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Un día, sin plan y con plan (apartados 28 y 29) ──');

ok(ESTADOS_ACTIVIDAD.map((e) => e.id).join() === 'entrenado,descanso,sin_registro,futuro',
  'Cuatro estados: entrenado, descanso (del plan), sin registro y futuro');
ok(ESTADOS_ACTIVIDAD.find((e) => e.id === 'sin_registro').que.includes('No significa que descansaras'),
  '🚨 «Sin registro» dice expresamente que NO es descanso');
ok(diaDeActividad('2026-09-22', { hoy: HOY }).estado === 'sin_registro'
  && diaDeActividad('2026-09-26', { hoy: HOY }).estado === 'futuro',
  '…un día sin plan y sin sesión es «sin registro», y uno por llegar no afirma nada');
const ctx = contextoDelPlan(conPlan(F()));
ok(diaDeActividad('2026-09-24', { hoy: HOY, contextoPlan: ctx }).estado === 'descanso'
  && diaDeActividad('2026-09-24', { hoy: HOY, contextoPlan: ctx, sesionesDelDia: [S('x', '2026-09-24')] }).estado === 'entrenado',
  '…con plan, el jueves es descanso — y si entrenó, es entrenamiento: gana la sesión');
ok(adherenciaDelPlan(null, { lunes: '2026-09-21', hoy: HOY, porFecha: new Map() }) === null,
  '…y sin plan, la adherencia es `null`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Se actualiza sola, y todo está en el Historial (pruebas 20 y 21, apartados 33 y 34) ──');

const antes = resumenDeActividad(SEMANAS, { hoy: HOY });
const conNueva = guardarSesion(SEMANAS, S('nueva', HOY, { nombre: 'Recién guardada' }));
const despues = resumenDeActividad(conNueva, { hoy: HOY });
ok(despues.semana.entrenamientos === antes.semana.entrenamientos + 1 && despues.ultimo.nombre === 'Recién guardada',
  '🚨 Guardar una sesión cambia el resumen AL MOMENTO: es una lectura, no una copia (apartado 33)');
const sinUna = { ...SEMANAS, sesiones: SEMANAS.sesiones.filter((s) => s.id !== 'mie') };
ok(resumenDeActividad(sinUna, { hoy: HOY }).semana.entrenamientos === 1,
  '…y borrarla la quita sin que nadie limpie nada');
const auditoria = auditarActividad(PLAN, { hoy: HOY });
auditoria.casillas.forEach((c) => ok(c.ok, `  ${c.texto}`));
ok(auditoria.ok, '🚨 El criterio de finalización (apartado 41): cuándo, cuánto, cómo se distribuye y el Historial');
/* ⚠️ Y puede ponerse roja (EH F42). */
const malo = { ...antes, ultimo: { ...antes.ultimo, id: 'no-existe', fecha: '2020-01-01' }, total: 99 };
const roja = auditarActividad(SEMANAS, { hoy: HOY }, malo);
ok(!roja.ok && roja.casillas.filter((c) => !c.ok).map((c) => c.id).sort().join() === 'cuando,cuanto,historial',
  '…y con un resumen falseado se pone ROJA en las tres casillas que toca: la auditoría PUEDE fallar');
const conDescansoFalso = { ...antes, semana: { ...antes.semana, dias: antes.semana.dias.map((d, i) => (i === 1 ? { ...d, estado: 'descanso' } : d)) } };
ok(auditarActividad(SEMANAS, { hoy: HOY }, conDescansoFalso).casillas.find((c) => c.id === 'sin_descanso_inventado').ok === false,
  '…y un «descanso» sin plan también');
ok(auditarActividad(SEMANAS, { hoy: HOY }, { ...antes, plan: { texto: '75 %' } }).casillas.find((c) => c.id === 'sin_puntuacion').ok === false,
  '…y un porcentaje también');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. Lo que ya existía, y lo que no se construye (apartados 16, 35 y 40) ──');

ok(YA_LO_RESUELVE.length >= 8 && YA_LO_RESUELVE.every((y) => typeof y.es === 'function' && y.es.name === y.nombre),
  `🚨 «No crear una lógica nueva»: ${YA_LO_RESUELVE.length} FUNCIONES importadas, y renombrar una rompe la compilación`);
ok(CAMPOS_APARTADO_19.map((c) => c.pide).join() === 'lastWorkout,workoutsInPeriod,activeDays,averagePerWeek,plannedSessions,completedPlannedSessions',
  'Los seis campos del apartado 19, con el nombre que tienen aquí');
ok(CAMPOS_APARTADO_19.every((c) => c.es in rPl.campos || c.es === 'mediaSemanal'),
  '…y con plan y datos, todos están (menos la media, que aún no tiene dos semanas completas)');

const LIB = leer('src/lib/actividadEntrenamiento.js');
const IMPORTS = [...LIB.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
ok(!IMPORTS.some((i) => /rachas/.test(i)),
  `🚨 La racha NO es de aquí: la librería ni importa el motor de rachas (apartado 16) — importa ${IMPORTS.join(', ')}`);
ok(/rachas/.test("from './rachasServicio'") , '…y el barrido SÍ la cazaría (EH F42)');
const CODIGO = sinComentarios(LIB)
  .replace(/export const NO_EN_FIT31 = \[[\s\S]*?\n\];/, ' ')
  .replace(/export const DECISIONES_FIT31 = \[[\s\S]*?\n\];/, ' ')
  .replace(/export const YA_LO_RESUELVE = \[[\s\S]*?\n\];/, ' ');
ok(!/saveData|guardarSesion\(|onGuardar|localStorage/.test(CODIGO),
  '🚨 No guarda NADA: ni `saveData`, ni `guardarSesion`, ni `localStorage` (apartado 41: «no duplicar datos»)');
ok(/saveData/.test('saveData(uid)'), '…y el barrido SÍ caza una escritura');
ok(!/\b(xp|puntos|nivel|recompensa|leaderboard|ranking|predic|ia)\b/i.test(CODIGO.replace(/'[^']*'/g, "''")),
  '🚨 Ni XP, ni recompensas, ni predicciones, ni IA en el código (apartado 40)');
ok(/\bxp\b/i.test('const xp = 1;'), '…y el barrido SÍ caza una de verdad');
ok(NO_EN_FIT31.length >= 5 && NO_EN_FIT31.every((x) => x.que && x.porque)
  && NO_EN_FIT31.some((x) => /racha/i.test(x.que)) && NO_EN_FIT31.some((x) => /porcentaje|puntuaci/i.test(x.que)),
  `⚠️ Lo que no se construye, con su motivo: ${NO_EN_FIT31.length} entradas (racha y puntuación incluidas)`);
ok(DECISIONES_FIT31.length >= 6 && DECISIONES_FIT31.every((d) => d.que && d.porque),
  `⚠️ Y las decisiones, escritas: ${DECISIONES_FIT31.length}`);
ok(DECISIONES_FIT31.some((d) => /iniciadaEn/.test(d.porque) && /guardadaEn/.test(d.porque)),
  '…incluido que los campos del apartado 2 son los que YA existían (startTime = iniciadaEn…)');

const COMP = leer('src/components/actividadEntrenamiento.jsx');
const COMPONENTES = ['TrainingActivitySummary', 'TrainingActivityCalendar', 'TrainingActivityDay', 'TrainingFrequencyCard',
  'TrainingRecentSessions', 'TrainingRecentSessionCard', 'TrainingPlanAdherence', 'TrainingPeriodSelector'];
const faltan = COMPONENTES.filter((c) => !new RegExp(`export function ${c}\\b`).test(COMP));
ok(faltan.length === 0, `🚨 Los ocho componentes del apartado 35, escritos de verdad${faltan.length ? ` (faltan ${faltan.join(', ')})` : ''}`);
const COMP_CODIGO = sinComentarios(COMP);
/* ⚠️ `d.sesiones` SÍ aparece, y es correcto: es la lista que el resumen ya
   trae dentro de cada día. Lo prohibido es leer las del `fitness`. */
const LEE_SESIONES = /fitness\??\.sesiones|\)\.sesiones|sesionesDelHistorial|fichaDeHistorial|historialPorReciente/;
ok(/resumenDeActividad/.test(COMP_CODIGO) && !LEE_SESIONES.test(COMP_CODIGO),
  '🚨 Los componentes NO cuentan: piden el resumen y no leen ni las sesiones ni el historial (apartado 20)');
ok(LEE_SESIONES.test('const x = fitness.sesiones.filter(Boolean);') && LEE_SESIONES.test('(fitness || {}).sesiones'),
  '…y el barrido SÍ caza una lectura de verdad (EH F42)');
ok(/aria-label=\{dia\.etiqueta\}/.test(COMP) && /sr-only/.test(COMP),
  '🚨 Cada día se lee con palabras: `aria-label` si es botón, texto oculto si no (apartado 37)');
ok(/toque-44/.test(COMP), '…y los controles llevan su zona de toque (EH F42)');
ok(!/COLORS\.negative|COLORS\.danger|#[0-9a-f]{6}/i.test(COMP_CODIGO),
  '🚨 Ni un color de error ni un hex suelto: un día sin registro no es un fallo (apartados 6, 7 y regla 2)');

/* Integración: Tu Plan, Progreso e Historial (pruebas 19, 20 y 21). */
const TUPLAN = sinComentarios(leer('src/views/TuPlanView.jsx'));
ok(/resumenDeActividad\(/.test(TUPLAN) && /<TrainingPlanAdherence/.test(TUPLAN),
  '🚨 Tu Plan enseña «Esta semana» con LA función central, no con una cuenta suya (prueba 19, apartado 31)');
const idxHook = TUPLAN.indexOf('resumenDeActividad(');
const idxReturn = TUPLAN.indexOf("if (v.estado === 'sin_plan')");
ok(idxHook > 0 && idxReturn > 0 && idxHook < idxReturn, '⚠️ …y el hook va ANTES de los `return` (regla 4)');
const RESUMEN = sinComentarios(leer('src/components/resumenProgreso.jsx'));
ok(/<TrainingActivitySummary[\s\S]*?periodo=\{resumen\.periodo\}/.test(RESUMEN) && /<TrainingPeriodSelector/.test(RESUMEN),
  '🚨 Progreso → Resumen enseña la actividad con EL periodo del resumen, y reutiliza su selector (prueba 20, apartado 32)');
ok(!/role="group" aria-label="Periodo del resumen"/.test(RESUMEN),
  '…ya no queda un segundo selector escrito a mano en el resumen');
const PROGRESO = sinComentarios(leer('src/views/ProgresoView.jsx'));
ok(/volverEtiqueta="Volver a Progreso"/.test(PROGRESO) && /onVerEjercicio=/.test(PROGRESO),
  '🚨 El detalle de sesión abierto desde Progreso dice adónde vuelve, y lleva al progreso del ejercicio (apartado 30)');
ok(rV.recientes.every((t) => sesionesDelHistorial(VARIOS).some((s) => s.id === t.id)),
  '🚨 Toda sesión de la actividad existe en el Historial: no hay eventos de actividad aparte (prueba 21, apartado 34)');

/* Y que una tarjeta sea la del historial, no una segunda. */
const tj = tarjetaDeSesion(S('t', HOY, { nombre: 'Push', minutos: 45 }), { hoy: HOY });
ok(tj.etiquetaFecha === 'Hoy' && tj.duracion === '45 min' && tj.etiqueta === 'Hoy, Push, 45 min',
  '…la tarjeta sale de la ficha del historial: «Hoy, Push, 45 min»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones correctas\x1b[0m`);
if (fallos > 0) {
  console.log(`\x1b[31m${fallos} fallo(s) en FIT F31\x1b[0m`);
  process.exit(1);
}
console.log('\x1b[32m═══ FIT F31 CORRECTA ═══\x1b[0m');
