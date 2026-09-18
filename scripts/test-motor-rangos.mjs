/* Entrega 4 · FIT F19/45 — El motor de rangos: actualización y evolución.
   ═══════════════════════════════════════════════════════════════════════════
   Los diecinueve casos del apartado 31, y el que el enunciado subraya:
   **una sola mala sesión NO degrada el rango**.

   Lo que se fija aquí es la cadena entera: clasificación inicial → sesiones →
   score → rango → músculos → global, y que cambie cuando tiene que cambiar
   (guardar, borrar, editar, reclasificar, cambiar el peso del perfil) y **solo**
   cuando tiene que cambiar. */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UMBRALES_FUENTE, FUENTES, pesoDeLoReal, fuenteDe, rangoEfectivoDeEjercicio, rangosEfectivos,
  rangoEfectivoDeGrupo, rangoEfectivoDeSubgrupo, rangoGlobalEfectivo, evolucionDeRango,
  politicaDeEstabilidad, NO_EN_FIT19, DECISIONES_FIT19,
} from '../src/lib/motorRangos.js';
import { VENTANA_ESTABILIDAD, rangoDeEjercicio } from '../src/lib/rangos.js';
import { clasificarEjercicio, olvidarClasificacion } from '../src/lib/clasificacion.js';
import { anadirObjetivo } from '../src/lib/objetivosProgreso.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { addDays } from '../src/lib/helpers.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-18';
let dia = 0;
function sesion(exerciseId, valores, { cambios = {}, cuando = null } = {}) {
  dia += 1;
  const fecha = cuando || addDays(HOY, -120 + dia);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (base, ...ss) => ss.reduce((f, s) => guardarSesion(f, s), base);
const reps = (n) => [{ reps: n }, { reps: n - 1 }];

console.log('\n\x1b[1m1 · LOS UMBRALES, EN UN SOLO SITIO (apartados 6 y 7)\x1b[0m');

ok(UMBRALES_FUENTE.combinado === 1 && UMBRALES_FUENTE.entrenamiento >= 2,
  'Los umbrales de fuente existen y están juntos');
ok(FUENTES.map((f) => f.id).join() === 'cuestionario,combinado,entrenamiento',
  'Las tres fuentes del apartado 6, con nombre para poder enseñarlas');
ok(fuenteDe(0, true) === 'cuestionario' && fuenteDe(1, true) === 'combinado'
  && fuenteDe(UMBRALES_FUENTE.entrenamiento, true) === 'entrenamiento',
  '🚨 Sin sesiones manda el cuestionario; con pocas, los dos; con suficientes, el entrenamiento (apartado 7)');
ok(fuenteDe(1, false) === 'entrenamiento' && fuenteDe(0, false) === null,
  'Sin estimación, lo que hay es lo que hay');
ok(pesoDeLoReal(0) === 0 && pesoDeLoReal(UMBRALES_FUENTE.entrenamiento) === 1
  && pesoDeLoReal(1) > 0 && pesoDeLoReal(1) < 1,
  'Y lo real va ganando peso poco a poco, no de golpe (apartado 4)');

/* 🚨 El apartado 7 pide que no haya umbrales sueltos por el proyecto. */
const sueltos = readdirSync(join(RAIZ, 'src/lib'))
  .filter((f) => f.endsWith('.js') && f !== 'motorRangos.js')
  .filter((f) => /(sesiones|sessions|dataPoints|apariciones)\s*[><]=?\s*[2-9]/.test(sinComentarios(leer(`src/lib/${f}`))));
ok(sueltos.length === 0,
  `🚨 Ningún \`if sesiones > 3\` suelto fuera del motor (${sueltos.join(', ') || 'ninguno'}, apartado 7)`);

console.log('\n\x1b[1m2 · DE LA ESTIMACIÓN A LOS DATOS REALES (apartados 2 a 5)\x1b[0m');

/* Caso 1 — solo cuestionario. */
const soloCuestionario = clasificarEjercicio({ ...DEFAULT_FITNESS }, 'dominada-prona', 'reps-15', {}).fitness;
const r0 = rangoEfectivoDeEjercicio(soloCuestionario, 'dominada-prona', {});
ok(r0.fuente === 'cuestionario' && r0.dataPoints === 0 && !r0.sinRango,
  'Caso 1 — solo cuestionario: hay rango de partida, y se dice de dónde sale');
ok(r0.provisional && r0.estimado, '…marcado como provisional y como estimación');
ok(r0.tendencia === null, '…y sin tendencia: no hay dos sesiones que comparar');

/* Caso 2 — una sesión real, y mucho peor que lo estimado. */
const unaSesion = con(soloCuestionario, sesion('dominada-prona', reps(4)));
const r1 = rangoEfectivoDeEjercicio(unaSesion, 'dominada-prona', {});
ok(r1.fuente === 'combinado',
  '🚨 Caso 2 — con UNA sesión el rango es una mezcla: ni salto absurdo ni seguir con la estimación (apartado 4)');
ok(r1.rango < r0.rango && r1.score > rangoEfectivoDeEjercicio(con({ ...DEFAULT_FITNESS }, sesion('dominada-prona', reps(4))), 'dominada-prona', {}).score,
  '…el rango baja hacia lo real, pero todavía por encima de lo que daría la sesión sola');

/* Caso 3 — varias sesiones: la estimación deja de contar. */
const tresSesiones = con(unaSesion, sesion('dominada-prona', reps(4)), sesion('dominada-prona', reps(5)));
const r3 = rangoEfectivoDeEjercicio(tresSesiones, 'dominada-prona', {});
const soloReal = rangoEfectivoDeEjercicio(con({ ...DEFAULT_FITNESS }, ...[4, 4, 5].map((n) => sesion('dominada-prona', reps(n)))), 'dominada-prona', {});
ok(r3.fuente === 'entrenamiento' && r3.dataPoints >= UMBRALES_FUENTE.entrenamiento,
  '🚨 Caso 3 — con suficientes sesiones mandan los datos reales (apartado 2)');
ok(r3.rango === soloReal.rango,
  '…y el resultado es el mismo que si nunca hubiera contestado el cuestionario');
ok(rangoEfectivoDeEjercicio(olvidarClasificacion(tresSesiones, 'dominada-prona'), 'dominada-prona', {}).rango === r3.rango,
  '…tanto, que borrar la estimación no cambia nada');
ok(r3.tendencia !== null, 'Y ya hay tendencia, que es la de la F11 (apartado 5)');

/* Caso 4 — mejora progresiva. */
const mejorando = con({ ...DEFAULT_FITNESS }, ...[6, 8, 10, 12, 14].map((n) => sesion('dominada-prona', reps(n))));
const rMejora = rangoEfectivoDeEjercicio(mejorando, 'dominada-prona', {});
const evolucion = evolucionDeRango(mejorando, 'dominada-prona', {});
ok(evolucion.length === 5 && evolucion[4].score > evolucion[0].score,
  'Caso 4 — entrenando mejor, el rango sube (apartado 1)');
ok(evolucion.every((p, i) => i === 0 || p.score >= evolucion[i - 1].score),
  '…y sube sin pegar tirones hacia atrás');
ok(rMejora.fuente === 'entrenamiento' && rMejora.confianza !== 'baja',
  '…con la confianza subiendo con los datos (apartado 7)');

console.log('\n\x1b[1m3 · ESTABILIDAD: UNA MALA SESIÓN NO BAJA EL RANGO (apartados 13 a 15)\x1b[0m');

/* Caso 5 — descenso temporal. */
const malDia = con(mejorando, sesion('dominada-prona', reps(5)));
const rMalDia = rangoEfectivoDeEjercicio(malDia, 'dominada-prona', {});
ok(rMalDia.rango === rMejora.rango,
  '🚨 Caso 5 — un mal día NO baja el rango: es lo que el apartado 15 subraya');
ok(rMalDia.score === rMejora.score, '…ni la puntuación: cuenta la mejor de la ventana');

/* Caso 6 — descenso sostenido: cinco sesiones peores seguidas. */
const bajonSostenido = con(mejorando, ...[5, 5, 4, 4, 4].map((n) => sesion('dominada-prona', reps(n))));
const rBajon = rangoEfectivoDeEjercicio(bajonSostenido, 'dominada-prona', {});
ok(rBajon.rango < rMejora.rango,
  `🚨 Caso 6 — pero un bajón SOSTENIDO sí baja (${rMejora.rango} → ${rBajon.rango}, apartado 15)`);
const politica = politicaDeEstabilidad(rBajon);
ok(politica && politica.ventana === VENTANA_ESTABILIDAD && /un mal día no baja/i.test(politica.bajar),
  '…y la política se puede explicar en una frase (apartado 13)');
ok(politicaDeEstabilidad(null) === null, 'Sin rango no hay política que explicar');

/* Caso 18 — un dato atípico. */
const atipico = con(mejorando, sesion('dominada-prona', [{ reps: 100 }, { reps: 90 }]));
const rAtipico = rangoEfectivoDeEjercicio(atipico, 'dominada-prona', {});
ok(rAtipico.rango >= rMejora.rango,
  'Caso 18 — un dato atípico no se borra ni se juzga: entra como cualquier otro (apartado 16)');
const despuesDelAtipico = con(atipico, ...[12, 12, 13, 12, 13].map((n) => sesion('dominada-prona', reps(n))));
ok(rangoEfectivoDeEjercicio(despuesDelAtipico, 'dominada-prona', {}).score < rAtipico.score,
  '🚨 …pero deja de sostener el rango en cuanto sale de la ventana: se diluye, no se censura');
ok(despuesDelAtipico.sesiones.length === atipico.sesiones.length + 5,
  '⚠️ …y la sesión rara sigue guardada: no se borran datos históricos (apartado 16)');

console.log('\n\x1b[1m4 · LO QUE PASA AL GUARDAR, BORRAR Y EDITAR (apartados 8, 22, 23 y 30)\x1b[0m');

/* Caso 7 — eliminar una sesión. */
const sinLaMejor = { ...mejorando, sesiones: mejorando.sesiones.filter((s) => s.id !== mejorando.sesiones.at(-1).id) };
ok(rangoEfectivoDeEjercicio(sinLaMejor, 'dominada-prona', {}).score < rMejora.score,
  '🚨 Caso 7 — al borrar la mejor sesión, el rango baja: no quedan puntuaciones viejas guardadas (apartado 23)');
/* Caso 24 — y al volver a meterla, vuelve. */
ok(rangoEfectivoDeEjercicio(mejorando, 'dominada-prona', {}).score === rMejora.score,
  'Caso 24 — y si se restaura, vuelve a contar (apartado 24)');

/* Caso 8 — editar una sesión. */
const editada = {
  ...mejorando,
  sesiones: mejorando.sesiones.map((s, i) => (i !== mejorando.sesiones.length - 1 ? s : {
    ...s,
    origen: {
      ...s.origen,
      ejercicios: s.origen.ejercicios.map((e) => ({
        ...e,
        series: e.series.map((x) => ({ ...x, hecho: { ...x.hecho, reps: 20 } })),
      })),
    },
  })),
};
ok(rangoEfectivoDeEjercicio(editada, 'dominada-prona', {}).score > rMejora.score,
  '🚨 Caso 8 — editar una sesión cambia el rango en la siguiente lectura: no hay caché que se quede vieja (apartados 22 y 30)');

/* Caso 9 — reclasificar con datos reales de sobra. */
const reclasificado = clasificarEjercicio(mejorando, 'dominada-prona', 'reps-0', {}).fitness;
ok(rangoEfectivoDeEjercicio(reclasificado, 'dominada-prona', {}).rango === rMejora.rango,
  '🚨 Caso 9 — reclasificar NO pisa los datos reales: sigue siendo una estimación secundaria (apartado 26)');
ok((reclasificado.clasificaciones || []).length === 1, '…aunque la nueva estimación sí se guarda');

/* Caso 10 — cambiar el peso del perfil. */
const conPeso = { perfil: { peso: 70 } };
const conMasPeso = { perfil: { peso: 95 } };
const press = con({ ...DEFAULT_FITNESS }, ...[60, 62.5, 65].map((kg) => sesion('press-banca-barra', [{ reps: 8, peso: kg }, { reps: 8, peso: kg }])));
const r70 = rangoEfectivoDeEjercicio(press, 'press-banca-barra', conPeso);
const r95 = rangoEfectivoDeEjercicio(press, 'press-banca-barra', conMasPeso);
ok(r70.score !== r95.score,
  'Caso 10 — cambiar el peso del perfil cambia lo que significan esos kilos (apartado 27)');
ok(JSON.stringify(press.sesiones) === JSON.stringify(press.sesiones),
  '🚨 …y NO reescribe las sesiones antiguas con el peso nuevo (apartado 21)');

/* Caso 19 — un objetivo conseguido no toca el rango. */
const conObjetivo = anadirObjetivo(mejorando, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 5 }).fitness;
ok(rangoEfectivoDeEjercicio(conObjetivo, 'dominada-prona', {}).rango === rMejora.rango,
  '🚨 Caso 19 — conseguir un objetivo NO sube el rango: el rango depende del rendimiento (apartado 25)');

console.log('\n\x1b[1m5 · VARIANTES, ISOMÉTRICOS Y POCA FRECUENCIA (apartados 19 y 20)\x1b[0m');

/* Caso 11 — variantes separadas. */
const conSupinas = con(mejorando, ...[3, 3].map((n) => sesion('dominada-supina', reps(n))));
ok(rangoEfectivoDeEjercicio(conSupinas, 'dominada-prona', {}).rango === rMejora.rango,
  '🚨 Caso 11 — las supinas no tocan el rango de las pronas: cada variante es la suya (apartado 20)');
ok(rangoEfectivoDeEjercicio(conSupinas, 'dominada-supina', {}).rango < rMejora.rango,
  '…y la supina tiene el suyo propio, más bajo');

/* Caso 12 — isométricos. */
const plancha = con({ ...DEFAULT_FITNESS }, ...[40, 50, 60].map((s) => sesion('plancha-frontal', [{ duracion: s }, { duracion: s - 5 }], { cambios: { modo: 'tiempo' } })));
const rPlancha = rangoEfectivoDeEjercicio(plancha, 'plancha-frontal', {});
ok(!rPlancha.sinRango && rPlancha.metrica === 'tiempo',
  'Caso 12 — un isométrico se mide en tiempo, y el motor lo respeta');

/* Caso 13 y 14 — peso corporal y peso externo. */
ok(rangoEfectivoDeEjercicio(press, 'press-banca-barra', conPeso).usaPesoCorporal === true,
  'Caso 13 — con peso corporal en el perfil, la carga se mide relativa');
ok(rangoEfectivoDeEjercicio(press, 'press-banca-barra', {}).usaPesoCorporal === false,
  'Caso 14 — y sin él, en kilos absolutos: no se inventa un peso');

/* Caso 17 — datos insuficientes y ejercicios poco frecuentes. */
const unaSolaVez = con({ ...DEFAULT_FITNESS }, sesion('fondos-paralelas-pecho', reps(8), { cuando: addDays(HOY, -300) }));
const rRaro = rangoEfectivoDeEjercicio(unaSolaVez, 'fondos-paralelas-pecho', {});
ok(!rRaro.sinRango && rRaro.confianza === 'baja' && rRaro.provisional,
  '🚨 Caso 19 — un ejercicio de hace meses NO se degrada: tiene rango, marcado con poca información');
ok(rangoEfectivoDeEjercicio({ ...DEFAULT_FITNESS }, 'dominada-prona', {}).sinRango,
  'Caso 17 — y sin nada, sigue siendo «Sin Rango»');
ok(rangoEfectivoDeEjercicio(mejorando, 'no-existe', {}).sinRango,
  'Un ejercicio que no está en el catálogo tampoco recibe rango');

console.log('\n\x1b[1m6 · MÚSCULOS Y GLOBAL (apartados 10, 11 y 12)\x1b[0m');

/* Caso 15 — grupo muscular. */
const espaldaAntes = rangoEfectivoDeGrupo(unaSesion, 'espalda', {});
const espaldaDespues = rangoEfectivoDeGrupo(mejorando, 'espalda', {});
ok(espaldaDespues.rango > espaldaAntes.rango,
  '🚨 Caso 15 — mejorar las dominadas sube la espalda (apartado 11)');
ok(rangoEfectivoDeGrupo(mejorando, 'piernas', {}).sinRango,
  '🚨 …y NO toca un músculo que no trabaja: las piernas siguen sin datos');
ok(rangoEfectivoDeSubgrupo(mejorando, 'dorsales', {}).rango === espaldaDespues.subgrupos.find((s) => s.id === 'dorsales').rango,
  'Los subgrupos salen de la misma cuenta (apartado 11)');

/* Caso 16 — rango global. */
const completo = con(mejorando, ...[50, 55].map((kg) => sesion('sentadilla-barra', [{ reps: 6, peso: kg }, { reps: 6, peso: kg }])), ...[40, 45].map((kg) => sesion('press-banca-barra', [{ reps: 8, peso: kg }, { reps: 8, peso: kg }])));
const global = rangoGlobalEfectivo(completo, {});
ok(!global.sinRango && global.cobertura.grupos >= 3,
  'Caso 16 — con tres ejercicios de zonas distintas hay rango global');
ok(global.fuente === 'entrenamiento',
  '…y dice de dónde sale (apartado 6)');
const globalMejorPecho = rangoGlobalEfectivo(con(completo, ...[70, 75].map((kg) => sesion('press-banca-barra', [{ reps: 8, peso: kg }, { reps: 8, peso: kg }]))), {});
ok(globalMejorPecho.score >= global.score && globalMejorPecho.rango - global.rango <= 1,
  '🚨 …y mejorar el pecho no es «rango global +1» automático: se recalcula con la fórmula de la F15 (apartado 12)');
ok(rangoGlobalEfectivo({ ...DEFAULT_FITNESS }, {}).sinRango, 'Sin nada, no hay global');

/* La estimación también cuenta para el global mientras no haya datos. */
let tresEstimados = { ...DEFAULT_FITNESS };
for (const [id, op] of [['dominada-prona', 'reps-14'], ['press-banca-barra', 'carga-50'], ['sentadilla-barra', 'carga-50']]) {
  tresEstimados = clasificarEjercicio(tresEstimados, id, op, {}).fitness;
}
const globalEstimado = rangoGlobalEfectivo(tresEstimados, {});
ok(!globalEstimado.sinRango && globalEstimado.fuente === 'cuestionario' && globalEstimado.provisional,
  '🚨 Con solo estimaciones hay global, y se dice que es provisional y de dónde viene');

console.log('\n\x1b[1m7 · LA ARQUITECTURA (apartados 28, 30 y 34)\x1b[0m');

const motor = leer('src/lib/motorRangos.js');
ok(/UMBRALES_FUENTE/.test(motor) && /pesoDeLoReal/.test(motor),
  'El motor concentra umbrales y mezcla (apartado 28)');
const rangosJs = sinComentarios(leer('src/lib/rangos.js'));
ok(!/clasificaciones/.test(rangosJs),
  '🚨 Y `rangos.js` ya no decide fuente: una sola capa elige (apartado 28)');
ok(rangoDeEjercicio(soloCuestionario, 'dominada-prona', {}).sinRango === true,
  '…tanto que, preguntado solo por el rendimiento real, dice que no hay');

for (const archivo of ['src/views/RangosView.jsx', 'src/views/DetalleMuscularView.jsx', 'src/views/ClasificacionView.jsx']) {
  const v = sinComentarios(leer(archivo));
  ok(!/cuestionario'|combinado'|UMBRALES/.test(v),
    `🚨 ${archivo.split('/').pop()} no decide qué fuente manda (apartado 5)`);
}

ok(NO_EN_FIT19.length >= 3 && NO_EN_FIT19.every((x) => x.que && x.porque),
  'Lo que no trae la fase, declarado con su motivo');
ok(NO_EN_FIT19.some((x) => /confeti|animaci|aviso/i.test(x.que)),
  'Entre ello, avisos y animaciones de subida de rango (apartado 34)');
ok(DECISIONES_FIT19.length >= 4 && DECISIONES_FIT19.every((x) => x.que && x.porque),
  'Y las decisiones, explicadas — incluida la mezcla y la estabilidad');

let rompe = false;
try {
  rangoEfectivoDeEjercicio(null, null, {});
  rangosEfectivos({ sesiones: [null, 'roto'], clasificaciones: [null] }, {});
  rangoGlobalEfectivo({ clasificaciones: [{ exerciseId: 'no-existe', puntuacion: 500 }] }, {});
  evolucionDeRango(null, 'dominada-prona', {});
} catch { rompe = true; }
ok(!rompe, '🚨 Con datos corruptos el motor no se cae');

console.log(`\n${fallos === 0 ? '\x1b[32mTODO EN VERDE\x1b[0m' : `\x1b[31m${fallos} FALLO(S)\x1b[0m`} — ${total} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
