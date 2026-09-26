/* Entrega 4 · FIT F18/45 — El detalle de un grupo muscular.
   ═══════════════════════════════════════════════════════════════════════════
   Los veinte puntos del apartado 33, y lo que sostiene la pantalla: **de dónde
   sale el rango**. Los ejercicios salen del catálogo (nunca de una lista
   escrita a mano), las tendencias de la F11, los rangos de la F15 — y un
   músculo sin entrenar dice «Sin datos», no «Novato» ni «0 %». */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detalleDeGrupo, detalleDeSubgrupo, ejerciciosDelMusculo, filtrarPorTendencia,
  FILTROS_EJERCICIOS, implicacionEn, textoContribucion, notaDeConfianza,
  resumenDeTendencias, grupoMuscular, NO_EN_FIT18, DECISIONES_FIT18,
} from '../src/lib/detalleMuscular.js';
import { rangoDeGrupo, rangoDeSubgrupo, rangosDeEjercicios } from '../src/lib/rangos.js';
import { progresoDeEjercicio } from '../src/lib/progresion.js';
import { clasificarEjercicio } from '../src/lib/clasificacion.js';
import { DEFAULT_FITNESS, GRUPOS_MUSCULARES } from '../src/lib/fitness.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { addDays, todayISO } from '../src/lib/helpers.js';

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

const HOY = todayISO();
let dia = 0;
function sesion(exerciseId, valores, cambios = {}) {
  dia += 1;
  const fecha = addDays(HOY, -30 + dia);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });

/* Espalda entrenada de verdad: dominadas que mejoran y remo estable. */
const fit = con(
  sesion('dominada-prona', [{ reps: 8 }, { reps: 7 }]),
  sesion('dominada-prona', [{ reps: 11 }, { reps: 9 }]),
  sesion('remo-barra', [{ reps: 10, peso: 50 }, { reps: 10, peso: 50 }]),
  sesion('remo-barra', [{ reps: 10, peso: 50 }, { reps: 10, peso: 50 }]),
);

console.log('\n\x1b[1m1 · EL GRUPO, Y DE DÓNDE SALE SU RANGO (apartados 2 y 3)\x1b[0m');

const espalda = detalleDeGrupo(fit, 'espalda', {});
ok(espalda && espalda.nombre === 'Espalda', 'Se abre el detalle de un grupo');
ok(GRUPOS_MUSCULARES.every((g) => detalleDeGrupo(fit, g.id, {})),
  '🚨 Los siete grupos tienen detalle (apartado 1)');
ok(detalleDeGrupo(fit, 'inventado', {}) === null, 'Un grupo que no existe no devuelve una pantalla vacía');

const rangoReal = rangoDeGrupo(rangosDeEjercicios(fit, {}), 'espalda');
ok(espalda.rango.rango === rangoReal.rango && espalda.rango.score === rangoReal.score,
  '🚨 El rango es EXACTAMENTE el de `getMuscleGroupRank` (F15): aquí no se calcula (apartado 24)');
ok(espalda.siguiente && espalda.siguiente.siguiente === espalda.rango.rango + 1,
  'Con el camino al siguiente rango, sacado del score real (apartado 4)');
ok(espalda.cabecera.length === 2 && /ejercicios? clasificados?/.test(espalda.cabecera[0])
  && /subgrupos con datos/.test(espalda.cabecera[1]),
  'La cabecera dice cuántos ejercicios lo sostienen y cuántos subgrupos tienen datos (apartado 2)');

const cuello = detalleDeGrupo(fit, 'cuello', {});
ok(cuello.sinRango && cuello.rango.rango === null,
  '🚨 Un grupo sin entrenar NO recibe rango (apartado 3)');
ok(/Completa ejercicios de este grupo/.test(cuello.sinDatosTexto),
  '…y se explica qué hacer, en vez de dejar un hueco');
ok(cuello.siguiente === null,
  '⚠️ …sin barra de progreso: un 0 % se lee como suspenso y lo que pasa es que no lo ha entrenado (apartado 14)');
ok(!/Novato|Iniciación/.test(JSON.stringify(cuello.rango)), '…y sin un rango de consolación');

console.log('\n\x1b[1m2 · LOS SUBGRUPOS (apartados 5 y 18)\x1b[0m');

ok(espalda.subgrupos.length === grupoMuscular('espalda').subgrupos.length,
  'Salen todos los subgrupos del grupo');
const dorsales = espalda.subgrupos.find((s) => s.id === 'dorsales');
const dorsalesF15 = rangoDeSubgrupo(rangosDeEjercicios(fit, {}), 'dorsales');
ok(dorsales.rango === dorsalesF15.rango,
  '🚨 Cada subgrupo usa `getMuscleSubgroupRank` de la F15 (apartado 18)');
ok(dorsales.siguiente && dorsales.datos.includes('ejercicio'),
  'Con su progreso y cuántos ejercicios lo sostienen');
const sinDatosSub = cuello.subgrupos;
ok(sinDatosSub.length > 0 && sinDatosSub.every((s) => s.sinRango && s.rango === null && s.datos === 'Sin datos'),
  '🚨 Los subgrupos de un músculo sin entrenar dicen «Sin datos», no «Novato» (apartado 14)');
ok(sinDatosSub.every((s) => s.siguiente === null), '…y tampoco llevan barra');
ok(espalda.subgrupos.every((s) => !s.sinRango),
  '⚠️ Y en Espalda no queda ninguno sin datos: el remo con barra también toca los erectores (apartado 7)');
ok(espalda.subgruposConDatos === espalda.subgrupos.filter((s) => !s.sinRango).length,
  'Y se cuentan los que sí tienen');

const detSub = detalleDeSubgrupo(fit, 'dorsales', {});
ok(detSub && detSub.grupoNombre === 'Espalda' && detSub.rango.rango === dorsalesF15.rango,
  'El detalle de un subgrupo sabe de qué grupo viene y trae su rango (apartado 6)');
ok(detalleDeSubgrupo(fit, 'inventado', {}) === null, 'Y un subgrupo inexistente no inventa nada');

console.log('\n\x1b[1m3 · LOS EJERCICIOS SALEN DEL CATÁLOGO (apartados 7, 8 y 10)\x1b[0m');

const lista = espalda.ejercicios;
ok(lista.some((e) => e.exerciseId === 'dominada-prona') && lista.some((e) => e.exerciseId === 'remo-barra'),
  'Los entrenados están');
ok(lista.some((e) => e.estado === 'sin_datos'),
  '🚨 …y también los del catálogo que todavía no ha tocado: así el denominador es real (apartado 13)');
ok(lista.every((e) => implicacionEn(ejercicioPorId(e.exerciseId, []), { grupoId: 'espalda' }) > 0),
  '🚨 Todos los de la lista tocan de verdad este grupo, según el catálogo (apartado 8)');
ok(!lista.some((e) => e.exerciseId === 'curl-barra'),
  '…y los que no lo tocan no aparecen');

const dom = lista.find((e) => e.exerciseId === 'dominada-prona');
ok(/Espalda · \d+ %/.test(dom.contribucion),
  '🚨 Se dice CUÁNTO aporta, no que «pertenezca» al grupo (apartado 7)');
ok(textoContribucion(ejercicioPorId('dominada-prona', []), { subgrupoId: 'dorsales' }).startsWith('Dorsales · '),
  '…y en un subgrupo, lo que aporta a ese subgrupo');
ok(textoContribucion(ejercicioPorId('curl-barra', []), { grupoId: 'espalda' }) === '',
  'Sin implicación no hay etiqueta que enseñar');

const pDom = progresoDeEjercicio(fit, 'dominada-prona', {});
ok(dom.estado === 'mejora' && dom.estado === pDom.tendencia,
  '🚨 La tendencia es la de la F11, no una nueva (apartado 9)');
ok(dom.ultima === '11 reps', `⚠️ Con la métrica del ejercicio: repeticiones (${dom.ultima}, apartado 10)`);
ok(/\+3/.test(dom.cambio), `…y el cambio respecto a la vez anterior (${dom.cambio})`);
const remo = lista.find((e) => e.exerciseId === 'remo-barra');
ok(/kg/.test(remo.ultima), `…y con peso, los kilos (${remo.ultima})`);
ok(remo.estado === 'estable', '…y su estado es el que dice la F11');

console.log('\n\x1b[1m4 · ORDEN, FILTROS Y COBERTURA (apartados 13, 20 y 21)\x1b[0m');

const posiciones = lista.map((e) => (['mejora', 'estable', 'descenso'].includes(e.estado) ? 0 : 1));
ok(posiciones.join('') === [...posiciones].sort().join(''),
  '🚨 Primero lo que tiene datos, después lo que no: nunca solo alfabético (apartado 21)');
ok(FILTROS_EJERCICIOS.length === 5 && FILTROS_EJERCICIOS[0].id === 'todos',
  'Los cinco filtros por estado del apartado 20, y ninguno más');
ok(filtrarPorTendencia(lista, 'todos').length === lista.length, 'El filtro «Todos» no esconde nada');
ok(filtrarPorTendencia(lista, 'mejora').every((e) => e.estado === 'mejora')
  && filtrarPorTendencia(lista, 'mejora').length >= 1, 'El de «Mejorando» deja solo los que mejoran');
ok(filtrarPorTendencia(lista, 'sin_datos').every((e) => !['mejora', 'estable', 'descenso'].includes(e.estado)),
  '…y el de «Sin datos» junta todo lo que no se puede comparar');
ok(filtrarPorTendencia(lista, 'descenso').length === 0, 'Y si no hay ninguno en descenso, la lista queda vacía');

const resumen = espalda.resumen;
ok(resumen.mejorando + resumen.estables + resumen.descenso === resumen.conDatos,
  'El resumen cuadra con lo que hay');
ok(resumen.cobertura === `${resumen.conDatos} de ${resumen.total} ejercicios con datos`,
  '🚨 La cobertura se dice en palabras, sin convertir el hueco en rendimiento negativo (apartado 13)');
ok(resumenDeTendencias([]).hayAlgo === false, 'Sin ejercicios no se enseña un resumen vacío');
ok(resumen.mejorando >= 1 && resumen.estables >= 1,
  `⚠️ Y refleja lo real: ${resumen.mejorando} mejorando, ${resumen.estables} estables (apartado 12)`);

console.log('\n\x1b[1m5 · TRANSPARENCIA Y CLASIFICACIONES (apartados 15 y 19)\x1b[0m');

const unSolo = con(sesion('flexion', [{ reps: 20 }, { reps: 18 }]));
const pecho = detalleDeGrupo(unSolo, 'pecho', {});
ok(/1 ejercicio/.test(pecho.nota || ''),
  '🚨 Con un solo ejercicio se dice: «Clasificación basada en 1 ejercicio» (apartado 15)');
ok(notaDeConfianza({ sinRango: true }) === null, 'Sin rango no hay nota que dar');
ok(notaDeConfianza({ sinRango: false, estimado: true, ejercicios: 2, confianza: 'baja' })
  .includes('clasificación inicial'),
  '⚠️ Y si el rango se sostiene solo en el cuestionario (F17), también se dice');

/* FIT F17 — un ejercicio estimado sostiene el rango y aparece marcado. */
const conEstimacion = clasificarEjercicio({ ...DEFAULT_FITNESS }, 'dominada-prona', 'reps-14', {}).fitness;
const espaldaEstimada = detalleDeGrupo(conEstimacion, 'espalda', {});
ok(!espaldaEstimada.sinRango && /1 ejercicio clasificado/.test(espaldaEstimada.cabecera[0]),
  '🚨 Una estimación cuenta como ejercicio clasificado: si no, salía «0» debajo de un rango');
const domEstimada = espaldaEstimada.ejercicios.find((e) => e.exerciseId === 'dominada-prona');
ok(domEstimada.estimado === true && domEstimada.rango !== null,
  '…y la tarjeta dice que ese nivel es una estimación, no un entrenamiento');
ok(espaldaEstimada.ejercicios.indexOf(domEstimada) === 0,
  '⚠️ …y va la primera de las que no tienen tendencia: es de donde sale el rango');

console.log('\n\x1b[1m6 · LO QUE NO SE ROMPE NI SE TOCA (apartados 25, 26, 27 y 30)\x1b[0m');

const antes = JSON.stringify(fit.sesiones);
detalleDeGrupo(fit, 'espalda', {});
detalleDeSubgrupo(fit, 'dorsales', {});
ok(JSON.stringify(fit.sesiones) === antes,
  '🚨 Mirar el detalle no toca ni una sesión: la pantalla solo consulta (apartado 26)');

/* Apartado 27 — una sesión vieja con un ejercicio que ya no está. */
const conFantasma = { ...fit, sesiones: [...fit.sesiones, { ...fit.sesiones[0], id: 'fantasma', origen: { ...fit.sesiones[0].origen, ejercicios: [{ ...fit.sesiones[0].origen.ejercicios[0], id: 'f-1', exerciseId: 'ejercicio-borrado' }] } }] };
let rompe = false;
let detalleFantasma = null;
try {
  detalleFantasma = detalleDeGrupo(conFantasma, 'espalda', {});
  detalleDeGrupo(null, 'espalda', {});
  detalleDeGrupo({ sesiones: [null, 'roto'] }, 'brazos', {});
  ejerciciosDelMusculo({ clasificaciones: [null] }, { grupoId: 'pecho' }, {});
} catch { rompe = true; }
ok(!rompe, '🚨 Ni con un ejercicio borrado ni con datos corruptos se cae la pantalla (apartados 27 y 30)');
ok(detalleFantasma && !detalleFantasma.ejercicios.some((e) => e.exerciseId === 'ejercicio-borrado'),
  '⚠️ …y a ese ejercicio NO se le inventa un grupo muscular: sin catálogo no se sabe cuál es');

console.log('\n\x1b[1m7 · LA PANTALLA ENSEÑA, NO CALCULA (apartados 22, 24, 29 y 31)\x1b[0m');

const vista = sinComentarios(leer('src/views/DetalleMuscularView.jsx'));
ok(/detalleDeGrupo|detalleDeSubgrupo/.test(vista) && /useMemo/.test(vista),
  'La pantalla pide el detalle del grupo que se abre, y una vez (apartado 31)');
ok(!/RANK_THRESHOLDS|REFERENCIAS|puntuacionDe|rangoDeGrupo\(|repartoMuscular\(/.test(vista),
  '🚨 Y no contiene ni umbrales ni fórmulas ni repartos: todo eso vive en lib');
ok(!/\.score\b/.test(vista),
  '🚨 La puntuación no se enseña (apartado 3: preferiblemente no mostrarla)');
ok(/Mejorando/.test(vista) && /Descenso/.test(vista) && /Sin datos/.test(vista),
  '🚨 Los estados llevan palabra además de icono y color (apartado 29)');
/* 🔓 FIT F21 — los filtros por estado se mudaron con la lista de ejercicios a
   `src/components/contribucionMuscular.jsx`, que la sustituye. Lo que se
   comprueba es lo mismo, donde ahora vive. */
ok(/aria-label/.test(vista), 'Todo lo que se toca tiene etiqueta (apartado 29)');
ok(/aria-pressed/.test(sinComentarios(leer('src/components/contribucionMuscular.jsx'))),
  '…y los filtros dicen cuál está puesto');
ok(/<RankBadge/.test(vista) && !/clipPath/.test(vista),
  '⚠️ El hexágono sigue siendo `RankBadge`: uno solo en la aplicación');
ok(!/\bXP\b|leaderboard|logro|competici/i.test(vista), 'Sin gamificación ni comparación social (apartado 32)');

const rangosView = sinComentarios(leer('src/views/RangosView.jsx'));
ok(/<DetalleMuscularView/.test(rangosView),
  '🚨 Desde Rangos se abre el detalle de cada grupo (apartado 34)');
const progresoView = sinComentarios(leer('src/views/ProgresoView.jsx'));
ok(/focoEjercicio/.test(progresoView),
  '…y desde un ejercicio, la pantalla de progreso de la F12: no se crea otra (apartado 11)');

ok(NO_EN_FIT18.length >= 3 && NO_EN_FIT18.every((x) => x.que && x.porque),
  'Lo que no trae la fase, declarado con su motivo');
ok(NO_EN_FIT18.some((x) => /3D|anatom/i.test(x.que)), 'Entre ello, la anatomía 3D (apartado 32)');
ok(DECISIONES_FIT18.length >= 3 && DECISIONES_FIT18.every((x) => x.que && x.porque),
  'Y las decisiones discutibles, escritas — incluida la contradicción con la F16');

console.log(`\n${fallos === 0 ? '\x1b[32mTODO EN VERDE\x1b[0m' : `\x1b[31m${fallos} FALLO(S)\x1b[0m`} — ${total} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
