/* Entrega 4 · FIT F21/45 — Qué ejercicios sostienen un rango muscular.
   ═══════════════════════════════════════════════════════════════════════════
   Los veinte casos del apartado 33, y las dos cosas que no se pueden confundir:
   **participación** (lo que dice el catálogo de ese ejercicio, que NO se suma
   entre ejercicios) y **peso en el cálculo** (cuánto manda ese ejercicio en
   este rango, normalizado e interno). */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PAPELES, ETIQUETA_PARTICIPACION, AVISO_CONTRIBUCION, ORDENES_CONTRIBUCION,
  contribucionDeEjercicio, contribucionesDeMusculo, contribucionesPorSubgrupo,
  NO_EN_FIT21, DECISIONES_FIT21,
} from '../src/lib/contribucionMuscular.js';
import { rangoEfectivoDeEjercicio, rangoEfectivoDeGrupo } from '../src/lib/motorRangos.js';
import { repartoMuscular } from '../src/lib/progresoMuscular.js';
import { progresoDeEjercicio } from '../src/lib/progresion.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
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
function sesion(exerciseId, valores, cambios = {}) {
  dia += 1;
  const fecha = addDays(HOY, -60 + dia);
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
const kilos = (kg) => [{ reps: 8, peso: kg }, { reps: 8, peso: kg }];

const fit = con({ ...DEFAULT_FITNESS },
  ...[8, 10, 12].map((n) => sesion('dominada-prona', reps(n))),
  ...[50, 55].map((kg) => sesion('remo-barra', kilos(kg))));

console.log('\n\x1b[1m1 · LA CONTRIBUCIÓN DE UN EJERCICIO (apartados 3 y 4)\x1b[0m');

const dom = contribucionDeEjercicio(fit, 'dominada-prona', { grupoId: 'espalda' }, {});
ok(dom && dom.exerciseId === 'dominada-prona' && dom.grupoId === 'espalda',
  'Se puede preguntar qué aporta un ejercicio a un grupo');
const esperadoEspalda = Math.round(repartoMuscular(ejercicioPorId('dominada-prona', []))
  .filter((x) => x.grupoId === 'espalda').reduce((n, x) => n + x.peso, 0) * 100);
ok(dom.porcentaje === esperadoEspalda,
  `🚨 Y el porcentaje es el del CATÁLOGO para ese grupo (${dom.porcentaje} %, apartado 2)`);

/* Caso 2 y 4 — el mismo ejercicio en otro grupo cuenta por SU porcentaje. */
const domBrazos = contribucionDeEjercicio(fit, 'dominada-prona', { grupoId: 'brazos' }, {});
ok(domBrazos.porcentaje < dom.porcentaje && domBrazos.porcentaje > 0,
  `🚨 En Brazos cuenta por su parte (${domBrazos.porcentaje} %), no por el total del ejercicio (apartado 4)`);
ok(dom.papel === 'principal' && domBrazos.papel === 'secundario',
  '⚠️ Y con el papel que tiene en cada músculo: principal en espalda, secundario en brazos');
ok(PAPELES[dom.papel] === dom.papelNombre, 'El papel se enseña con su nombre, no con el id');

/* Caso 3 — hasta el subgrupo (apartado 7). */
const domDorsales = contribucionDeEjercicio(fit, 'dominada-prona', { subgrupoId: 'dorsales' }, {});
ok(domDorsales.porcentaje === 50,
  `🚨 En Dorsales, el 50 % que dice el catálogo (${domDorsales.porcentaje} %)`);
ok(contribucionDeEjercicio(fit, 'dominada-prona', { grupoId: 'piernas' }, {}) === null,
  'Y en un músculo que no toca, no hay contribución que enseñar');
ok(contribucionDeEjercicio(fit, 'no-existe', { grupoId: 'espalda' }, {}) === null,
  'Un ejercicio que no está en el catálogo tampoco');

console.log('\n\x1b[1m2 · LA PUNTUACIÓN Y LA TENDENCIA SON LAS DE SIEMPRE (apartados 5 y 12)\x1b[0m');

const rDom = rangoEfectivoDeEjercicio(fit, 'dominada-prona', {});
ok(dom.score === rDom.score && dom.rango === rDom.rango,
  '🚨 La puntuación es la del motor (F19): no hay un score alternativo (apartado 5)');
ok(dom.tendencia === progresoDeEjercicio(fit, 'dominada-prona', {}).tendencia,
  '🚨 Y la tendencia es la de la F11: no se calcula otra (apartado 12)');
ok(dom.dataPoints === rDom.dataPoints && dom.confianza === rDom.confianza,
  'Con sus datos y su confianza, las del motor');

/* Caso 13 — la métrica correcta por tipo de ejercicio. */
ok(/reps/.test(dom.ultima), `Peso corporal: repeticiones (${dom.ultima}, apartado 13)`);
const remo = contribucionDeEjercicio(fit, 'remo-barra', { grupoId: 'espalda' }, {});
ok(/kg/.test(remo.ultima), `Con carga: kilos (${remo.ultima})`);
const isometrico = con({ ...DEFAULT_FITNESS }, ...[30, 40].map((s) => sesion('plancha-frontal', [{ duracion: s }, { duracion: s - 5 }], { modo: 'tiempo' })));
const plancha = contribucionDeEjercicio(isometrico, 'plancha-frontal', { grupoId: 'abdominales' }, {});
ok(/ s$/.test(plancha.ultima) && !/kg/.test(plancha.ultima),
  `🚨 Isométrico: segundos, y NUNCA kilos (${plancha.ultima}, apartado 13)`);

console.log('\n\x1b[1m3 · LA LISTA: NORMALIZADA, ORDENADA Y SEPARADA (apartados 9, 10 y 17)\x1b[0m');

const lista = contribucionesDeMusculo(fit, { grupoId: 'espalda' }, {});
ok(lista.conDatos.length === 2 && lista.sinDatos.length > 0,
  `🚨 Los que sostienen el rango van aparte de los que todavía no (${lista.conDatos.length} y ${lista.sinDatos.length}, apartado 10)`);
ok(lista.conDatos.every((c) => !c.sinDatos) && lista.sinDatos.every((c) => c.sinDatos),
  '…y cada uno en su sitio');
const suma = lista.conDatos.reduce((n, c) => n + c.pesoRelativo, 0);
ok(Math.abs(suma - 1) < 1e-9,
  '🚨 El peso en el cálculo está normalizado: suma 1 entre los que tienen datos (apartado 17)');
ok(lista.conDatos.reduce((n, c) => n + c.porcentaje, 0) > 100,
  '🚨 …y la participación NO: dos ejercicios pueden sumar más de 100 porque no es acumulable (apartado 16)');
ok(lista.principal && lista.principal.pesoRelativo === Math.max(...lista.conDatos.map((c) => c.pesoRelativo)),
  'Se sabe cuál manda');
ok(lista.estado === 'suficiente' && lista.aviso === AVISO_CONTRIBUCION,
  'Y la sección lleva su aviso: esto mide rendimiento, no músculo (apartado 6)');

/* Caso 9 del orden — por defecto, lo reciente primero. */
ok(lista.conDatos[0].fecha >= lista.conDatos[1].fecha,
  '🚨 Por defecto manda lo reciente (apartado 9)');
const porContribucion = contribucionesDeMusculo(fit, { grupoId: 'espalda' }, { orden: 'contribucion' });
ok(porContribucion.conDatos[0].pesoRelativo >= porContribucion.conDatos[1].pesoRelativo,
  '…y se puede ordenar por contribución');
const porProgreso = contribucionesDeMusculo(fit, { grupoId: 'espalda' }, { orden: 'progreso' });
ok(porProgreso.conDatos.length === 2 && ORDENES_CONTRIBUCION.length === 3,
  '…y por progreso, que son los tres órdenes declarados');
ok(lista.conDatos.map((c) => c.nombre).join() !== [...lista.conDatos].map((c) => c.nombre).sort().join()
  || lista.conDatos.length < 2,
  '⚠️ Nunca solo alfabético: escondería lo que está entrenando ahora');

/* Casos 5, 6 y 7 — sin datos, con pocos y con muchos. */
const sinNada = contribucionesDeMusculo({ ...DEFAULT_FITNESS }, { grupoId: 'cuello' }, {});
ok(sinNada.conDatos.length === 0 && sinNada.estado === 'sin_datos' && /Entrena ejercicios de este grupo/.test(sinNada.vacio),
  '🚨 Sin datos, la sección lo dice y no inventa contribuciones (apartado 28)');
ok(sinNada.sinDatos.length > 0, '…pero los ejercicios del grupo siguen enseñándose: son por donde seguir');
const unaSola = contribucionesDeMusculo(con({ ...DEFAULT_FITNESS }, sesion('dominada-prona', reps(8))), { grupoId: 'espalda' }, {});
ok(unaSola.estado === 'limitado' && unaSola.conDatos[0].confianza === 'baja',
  '⚠️ Con un solo ejercicio, confianza limitada — pero no se elimina (apartado 11)');
ok(unaSola.conDatos[0].pesoRelativo === 1,
  '…y si es el único con datos, se lo lleva todo el peso, que es la verdad');

console.log('\n\x1b[1m4 · VARIANTES, EQUIPO Y MULTIMUSCULARES (apartados 20, 21 y 22)\x1b[0m');

const conVariantes = con(fit, ...[3, 4].map((n) => sesion('dominada-supina', reps(n))));
const listaVar = contribucionesDeMusculo(conVariantes, { grupoId: 'espalda' }, {});
const prona = listaVar.conDatos.find((c) => c.exerciseId === 'dominada-prona');
const supina = listaVar.conDatos.find((c) => c.exerciseId === 'dominada-supina');
ok(prona && supina && prona.score !== supina.score,
  '🚨 Caso 9 — las variantes NO se mezclan: cada una con su puntuación (apartado 20)');
ok(prona.rango > supina.rango, '…y con su rango, que puede ser distinto');
const conMaquina = contribucionesDeMusculo(con(fit, ...[40, 45].map((kg) => sesion('jalon-al-pecho', kilos(kg)))), { grupoId: 'espalda' }, {});
ok(conMaquina.conDatos.some((c) => c.exerciseId === 'jalon-al-pecho'),
  'Caso 10 — un ejercicio de máquina entra con lo suyo, sin compararse con las dominadas (apartado 21)');

/* Caso 13 — un multimuscular aparece en cada grupo con su porcentaje. */
const fondos = con({ ...DEFAULT_FITNESS }, ...[10, 12].map((n) => sesion('fondos-paralelas-pecho', reps(n))));
const enPecho = contribucionDeEjercicio(fondos, 'fondos-paralelas-pecho', { grupoId: 'pecho' }, {});
const enBrazos = contribucionDeEjercicio(fondos, 'fondos-paralelas-pecho', { grupoId: 'brazos' }, {});
ok(enPecho && enBrazos && enPecho.porcentaje !== enBrazos.porcentaje,
  '🚨 Caso 13 — un ejercicio multiarticular aparece en cada grupo con SU porcentaje (apartado 22)');
ok(enPecho.score === enBrazos.score,
  '…con la misma puntuación: lo que cambia es cuánto pesa ahí, no lo que levanta');

console.log('\n\x1b[1m5 · SUBGRUPOS Y GRUPOS (apartados 7, 25 y 26)\x1b[0m');

const porSub = contribucionesPorSubgrupo(fit, 'espalda', {});
ok(porSub.length === 3 && porSub.every((s) => s.nombre),
  'El desglose del apartado 7: grupo → subgrupo → ejercicios');
const dorsales = porSub.find((s) => s.id === 'dorsales');
ok(dorsales.ejercicios.every((e) => e.subgrupoId === 'dorsales'),
  '🚨 Desde Dorsales solo salen los de dorsales, no toda la espalda (apartado 26)');
ok(porSub.some((s) => s.sinDatos) || porSub.every((s) => s.cuantos > 0),
  'Y un subgrupo sin datos lo dice');
ok(contribucionesPorSubgrupo(fit, 'inventado', {}).length === 0, 'Un grupo que no existe no inventa subgrupos');
for (const g of ['brazos', 'piernas', 'espalda', 'pecho', 'hombros', 'abdominales', 'cuello']) {
  const c = contribucionesDeMusculo(fit, { grupoId: g }, {});
  ok(c.total > 0, `Funciona en ${g} (apartado 25)`);
}

console.log('\n\x1b[1m6 · SE RECALCULA, NO SE GUARDA (apartados 19 y 23)\x1b[0m');

/* Casos 17 y 18 — borrar y añadir sesiones cambia la contribución. */
const masSesiones = con(fit, ...[14, 16].map((n) => sesion('dominada-prona', reps(n))));
ok(contribucionesDeMusculo(masSesiones, { grupoId: 'espalda' }, {}).conDatos
  .find((c) => c.exerciseId === 'dominada-prona').score > dom.score,
  '🚨 Caso 18 — una sesión nueva cambia la contribución en la siguiente lectura');
const menosSesiones = { ...fit, sesiones: fit.sesiones.filter((s) => !s.origen.ejercicios.some((e) => e.exerciseId === 'remo-barra')) };
ok(contribucionesDeMusculo(menosSesiones, { grupoId: 'espalda' }, {}).conDatos.length === 1,
  '🚨 Caso 17 — y borrar las sesiones de un ejercicio lo saca de los que contribuyen');
const antes = JSON.stringify(fit.sesiones);
contribucionesDeMusculo(fit, { grupoId: 'espalda' }, {});
contribucionesPorSubgrupo(fit, 'espalda', {});
ok(JSON.stringify(fit.sesiones) === antes,
  '⚠️ Y mirar la contribución no toca ni una sesión (apartado 19)');

console.log('\n\x1b[1m7 · LA PANTALLA NO CALCULA, Y NO ACONSEJA (apartados 6, 23, 30 y 32)\x1b[0m');

const comp = sinComentarios(leer('src/components/contribucionMuscular.jsx'));
ok(/MuscleContributionList/.test(comp) && /MuscleContributionCard/.test(comp) && /MuscleContributionBar/.test(comp)
  && /MuscleContributionMeta/.test(comp) && /MuscleContributionEmpty/.test(comp),
  'Los componentes del apartado 24 existen');
ok(!/repartoMuscular|rangoEfectivo|pesoRelativo\s*=/.test(comp),
  '🚨 Y no calculan nada: reciben la contribución hecha (apartado 23)');
ok(/aria-label/.test(comp) && /participación en este grupo muscular/.test(comp),
  '🚨 La barra dice qué significa ese porcentaje, también para un lector de pantalla (apartados 15 y 30)');
ok(/Mejorando/.test(comp) && /Descenso/.test(comp) && /Sin datos/.test(comp),
  'Los estados llevan palabra, no solo color (apartado 30)');
ok(!/mejor ejercicio|más efectivo|hipertrofia|recomendad|deberías/i.test(comp),
  '🚨 Y no se aconseja ni se habla de hipertrofia: esto mide rendimiento (apartados 6 y 32)');

const vista = sinComentarios(leer('src/views/DetalleMuscularView.jsx'));
ok(/<MuscleContributionList/.test(vista) && /contribucionesDeMusculo/.test(vista),
  '🚨 El detalle muscular enseña quién sostiene el rango (apartado 25)');
ok(/<MuscleContributionBySubgroup/.test(vista), '…y el desglose por subgrupos (apartado 7)');
ok(/useMemo/.test(vista) && !/MuscleExerciseList/.test(vista),
  '⚠️ Con una sola lista —la de la F18 se retiró— y calculada una vez (apartados 23 y 31)');

ok(ETIQUETA_PARTICIPACION.length > 10 && /participación/i.test(ETIQUETA_PARTICIPACION),
  'La etiqueta del apartado 15 está escrita en un solo sitio');
ok(NO_EN_FIT21.length >= 3 && NO_EN_FIT21.every((x) => x.que && x.porque),
  'Lo que no trae la fase, con su motivo');
ok(NO_EN_FIT21.some((x) => /hipertrofia/i.test(x.que)), 'Entre ello, el lenguaje de hipertrofia (apartado 6)');
ok(DECISIONES_FIT21.length >= 3 && DECISIONES_FIT21.every((x) => x.que && x.porque), 'Y las decisiones, escritas');

let rompe = false;
try {
  contribucionesDeMusculo(null, { grupoId: 'espalda' }, {});
  contribucionesDeMusculo({ sesiones: [null] }, { grupoId: null }, {});
  contribucionDeEjercicio(null, null, {}, {});
  contribucionesPorSubgrupo(null, null, {});
} catch { rompe = true; }
ok(!rompe, '🚨 Con datos corruptos no se cae (apartado 28)');

console.log(`\n${fallos === 0 ? '\x1b[32mTODO EN VERDE\x1b[0m' : `\x1b[31m${fallos} FALLO(S)\x1b[0m`} — ${total} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
