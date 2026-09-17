/* Entrega 4 · FIT F15/45 — Sistema base de rangos y clasificación.
   ═══════════════════════════════════════════════════════════════════════════
   Los quince casos del apartado 25 y los dieciocho puntos del 31. Y lo que más
   se vigila, como pide el enunciado: **que NO se inventan datos** — sin datos
   es «Sin Rango», no el rango 1; un grupo sin entrenar no cuenta como cero; y
   con un solo ejercicio no hay rango global. */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RANK_DEFINITIONS, RANK_THRESHOLDS, PUNTUACION_MAXIMA, REFERENCIAS, VENTANA_ESTABILIDAD, CONFIANZA,
  COBERTURA_MINIMA_GLOBAL, rangoDePuntuacion, progresoHaciaSiguiente, estadoDeRango, confianzaDe,
  marcaDeAparicion, puntuacionDeMarca, puntuacionDeEjercicio, rangoDeEjercicio, rangosDeEjercicios,
  rangoDeSubgrupo, rangoDeGrupo, rangoGlobal, NO_EN_FIT15,
} from '../src/lib/rangos.js';
import { aparicionesDeEjercicio } from '../src/lib/progresion.js';
import { DEFAULT_FITNESS, SIN_RANGO } from '../src/lib/fitness.js';
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

const HOY = '2026-09-17';
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
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    if (!v.sinMarcar) s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const r = (reps, peso = null) => ({ reps, peso });
const corp = { tipoCarga: 'corporal' };
const PERFIL = { peso: 72 };

console.log('\n═══ FIT F15/45 · Sistema base de rangos ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La configuración central (apartados 2, 5 y 24) ──');

ok(RANK_DEFINITIONS.length === 10 && RANK_DEFINITIONS.every((d, i) => d.orden === i + 1 && d.id && d.nombre && d.descripcion && d.forma === 'hexagono'),
  'Diez rangos, con id, nombre, orden, descripción y forma hexagonal (apartado 2)');
ok(RANK_DEFINITIONS[0].nombre === 'Iniciación' && RANK_DEFINITIONS[9].nombre === 'Élite', '…con la nomenclatura que ya tenía el proyecto (apartado 2: «mantenla»)');
ok(RANK_THRESHOLDS.length === 10 && RANK_THRESHOLDS.every((u, i) => i === 0 || u > RANK_THRESHOLDS[i - 1]) && RANK_THRESHOLDS[0] === 0,
  'Un umbral por rango, crecientes y empezando en 0');
const saltos = RANK_THRESHOLDS.slice(1).map((u, i) => u - RANK_THRESHOLDS[i]);
ok(saltos.slice(0, 5).every((s, i) => i === 0 || s >= saltos[i - 1]), '…y no lineales: cada rango cuesta algo más que el anterior (apartado 5)');
ok(rangoDePuntuacion(0) === 1 && rangoDePuntuacion(79) === 1 && rangoDePuntuacion(80) === 2 && rangoDePuntuacion(1000) === 10,
  'La puntuación se traduce en rango con los umbrales: 0 → 1, 80 → 2, 1000 → 10');
ok(rangoDePuntuacion(null) === null && rangoDePuntuacion(NaN) === null, '🚨 …y sin puntuación NO hay rango 1: hay `null`');
ok(progresoHaciaSiguiente(125).siguiente === 3 && Math.abs(progresoHaciaSiguiente(125).fraccion - 0.5) < 1e-9, 'Cuánto falta para el siguiente');
ok(progresoHaciaSiguiente(990).siguiente === null && progresoHaciaSiguiente(null) === null, '…en el último no hay siguiente, y sin puntuación nada');
ok(PUNTUACION_MAXIMA === 1000 && REFERENCIAS.repeticiones.intermedio > 0, 'La escala 0-1000 y las referencias, en un solo sitio');

const TODO_SRC = readdirSync(join(RAIZ, 'src/views')).map((f) => sinComentarios(leer(`src/views/${f}`))).join('\n')
  + sinComentarios(leer('src/components/rangos.jsx'));
ok(!/(score|puntuacion)\s*>=?\s*\d{2,}/.test(TODO_SRC), '🚨 Ni un `if (score > 100)` en las pantallas: los límites viven en la configuración (apartado 24)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Estados, confianza y «Sin Rango» (apartados 3, 11 y 12) ──');

ok(estadoDeRango(3, null) === 'no_disponible' && estadoDeRango(3, 5) === 'conseguido' && estadoDeRango(5, 5) === 'actual' && estadoDeRango(7, 5) === 'bloqueado',
  '🚨 Los cuatro estados, y sin rango todos son «no disponibles», que NO es «bloqueado» (apartado 3)');
ok(confianzaDe(1).id === 'baja' && confianzaDe(4).id === 'media' && confianzaDe(12).id === 'alta' && confianzaDe(0) === null, 'Confianza baja, media y alta según los datos');
ok(CONFIANZA.length === 3, 'Tres niveles de confianza');

const VACIO = rangoDeEjercicio({ ...DEFAULT_FITNESS }, 'dominada-prona', { perfil: PERFIL });
ok(VACIO.sinRango === true && VACIO.rango === null && VACIO.nombre === SIN_RANGO.nombre && VACIO.score === null,
  '🚨 Caso «sin datos»: «Sin Rango», no el rango 1 (apartados 3 y 31.1)');

const UNA = con(sesion('dominada-prona', [r(10), r(8)], corp));
const r1 = rangoDeEjercicio(UNA, 'dominada-prona', { perfil: PERFIL });
ok(r1.sinRango === false && r1.score === 415 && r1.rango === 5 && r1.nombre === 'Intermedio',
  `Caso «un dato»: 10 dominadas (intermedio, referencia 30) → puntuación ${r1.score}, rango ${r1.rango} «${r1.nombre}» (apartado 31.2)`);
ok(r1.provisional === true && r1.confianza === 'baja' && r1.dataPoints === 1, '🚨 …marcado como «Clasificación provisional» con una sola sesión (apartado 12)');
ok(r1.metrica === 'repeticiones' && r1.mejorMarca === '10 reps', '…medido en repeticiones, con la marca real en que se basa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Varios datos: creciente, estable, descendente (apartados 23 y 25) ──');

const CRECE = con(...[6, 8, 10, 12].map((n) => sesion('dominada-prona', [r(n)], corp)));
const rc = rangoDeEjercicio(CRECE, 'dominada-prona', { perfil: PERFIL });
ok(rc.score > r1.score && rc.confianza === 'media' && rc.provisional === false, `Caso «creciente»: 6 → 12 reps sube la puntuación (${rc.score}) y con 4 sesiones la confianza es media`);
ok(rc.tendencia === 'mejora', '…con la tendencia de la F11');

const CAIDA = con(...[12, 12, 12, 7].map((n) => sesion('dominada-prona', [r(n)], corp)));
const rd = rangoDeEjercicio(CAIDA, 'dominada-prona', { perfil: PERFIL });
ok(rd.rango === rc.rango && rd.tendencia === 'descenso',
  `🚨 Caso «descendente» con UN mal día (12, 12, 12, 7): el rango NO baja (${rd.rango}), aunque la tendencia diga descenso (apartado 23)`);
const SOSTENIDO = con(...[12, 7, 7, 7, 7, 7].map((n) => sesion('dominada-prona', [r(n)], corp)));
ok(rangoDeEjercicio(SOSTENIDO, 'dominada-prona', { perfil: PERFIL }).score < rc.score,
  `…pero si el peor rendimiento se SOSTIENE más de ${VENTANA_ESTABILIDAD} sesiones, sí baja`);
const ESTABLE = con(...[10, 10, 10].map((n) => sesion('dominada-prona', [r(n)], corp)));
ok(rangoDeEjercicio(ESTABLE, 'dominada-prona', { perfil: PERFIL }).rango === 5, 'Caso «estable»: 10, 10, 10 → sigue en el 5');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Métrica según el ejercicio (apartados 7, 8 y 9) ──');

const ISO = con(sesion('l-sit', [{ duracion: 20 }]));
const ri = rangoDeEjercicio(ISO, 'l-sit', { perfil: PERFIL });
ok(ri.metrica === 'tiempo' && ri.score === 523 && ri.mejorMarca === '20 s', `🚨 Caso «isométrico»: el L-sit se mide en SEGUNDOS (20 s → ${ri.score}, apartado 8)`);

const EXT = con(sesion('press-banca-barra', [r(5, 80)]));
const conPeso = rangoDeEjercicio(EXT, 'press-banca-barra', { perfil: PERFIL });
const sinPeso = rangoDeEjercicio(EXT, 'press-banca-barra', { perfil: null });
ok(conPeso.metrica === 'carga' && conPeso.usaPesoCorporal === true && sinPeso.usaPesoCorporal === false,
  '🚨 Caso «peso externo»: con peso corporal en el perfil se mide relativo a él; sin él, en kilos (apartado 7)');
ok(conPeso.score !== sinPeso.score && conPeso.rango >= 1 && sinPeso.rango >= 1, '…y los dos dan una clasificación válida');
ok(rangoDeEjercicio(EXT, 'press-banca-barra', { perfil: { peso: 5 } }).usaPesoCorporal === false, '⚠️ Un peso corporal absurdo (5 kg) no se usa');

const CORP = rangoDeEjercicio(UNA, 'dominada-prona', { perfil: PERFIL });
ok(CORP.metrica === 'repeticiones' && CORP.usaPesoCorporal === false, '🚨 Caso «peso corporal»: dominadas por repeticiones, sin inventar «72 kg × 10» (apartado 8)');

const DIFICIL = con(sesion('muscle-up', [r(10)]));
const rm = rangoDeEjercicio(DIFICIL, 'muscle-up', { perfil: PERFIL });
ok(rm.score > r1.score && rm.rango > r1.rango,
  `🚨 Caso «ejercicios difíciles»: 10 muscle-ups (experto) valen más que 10 dominadas (intermedio): ${rm.score} frente a ${r1.score} (apartado 9)`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Variantes, sesiones parciales y datos que faltan (apartados 14, 15 y 16) ──');

const VAR = con(sesion('dominada-prona', [r(10)], corp), sesion('dominada-supina', [r(20)], corp));
ok(rangoDeEjercicio(VAR, 'dominada-prona', { perfil: PERFIL }).score === 415 && rangoDeEjercicio(VAR, 'dominada-supina', { perfil: PERFIL }).dataPoints === 1,
  '🚨 Caso «variantes»: las 20 supinas NO suben el rango de las pronas (apartado 14)');

const PARCIAL = con(sesion('dominada-prona', [r(8), { reps: 30, peso: null, sinMarcar: true }], corp));
ok(rangoDeEjercicio(PARCIAL, 'dominada-prona', { perfil: PERFIL }).mejorMarca === '8 reps',
  '🚨 Caso «sesiones incompletas»: 30 repeticiones escritas y SIN marcar no cuentan (apartado 16)');

const SIN_DATO = con(sesion('press-banca-barra', [r(8, null)]));
const rsd = rangoDeEjercicio(SIN_DATO, 'press-banca-barra', { perfil: PERFIL });
ok(rsd.metrica === 'repeticiones' && !/kg/.test(rsd.mejorMarca), '⚠️ Un press sin peso apuntado se mide por lo que hay, sin inventar el peso (apartado 15)');
ok(marcaDeAparicion({ clase: 'carga', mejor: { peso: null, reps: 5 } }) === null && marcaDeAparicion(null) === null, 'Una marca sin su dato es `null`');
ok(puntuacionDeMarca('repeticiones', null) === null && puntuacionDeMarca('inventada', { valor: 5 }) === null, '…y sin marca no hay puntuación');
ok(puntuacionDeEjercicio(null, []) === null && puntuacionDeEjercicio(ejercicioPorId('l-sit'), []) === null, 'Sin ejercicio o sin apariciones, nada');
ok(rangoDeEjercicio(UNA, 'ya-no-existe').sinRango === true, 'Un ejercicio que no está en el catálogo: sin rango');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Grupos, subgrupos y porcentajes (apartados 17, 18 y 19) ──');

const MUS = con(sesion('dominada-prona', [r(10)], corp), sesion('face-pull', [r(12, 20)]));
const ej = rangosDeEjercicios(MUS, { perfil: PERFIL });
const dom = ej.find((e) => e.exerciseId === 'dominada-prona');
const fp = ej.find((e) => e.exerciseId === 'face-pull');
const espalda = rangoDeGrupo(ej, 'espalda');
const wDom = 0.65; const wFp = 0.35;
const esperado = Math.round((dom.score * wDom + fp.score * wFp) / (wDom + wFp));
ok(espalda.score === esperado,
  `🚨 Caso «grupos musculares»: Espalda = media ponderada por implicación (dominada 0,65 · face pull 0,35) = ${esperado} (apartado 18)`);
ok(espalda.ejercicios === 2 && espalda.rango === rangoDePuntuacion(esperado), '…con sus dos ejercicios y su rango');
const brazos = rangoDeGrupo(ej, 'brazos');
ok(brazos.ejercicios === 2 && brazos.score === Math.round((dom.score * 0.3 + fp.score * 0.08) / 0.38),
  '🚨 …y en Brazos la dominada pesa 0,3 y el face pull 0,08: nadie cuenta al 100 % (apartado 17)');
const dorsales = rangoDeSubgrupo(ej, 'dorsales');
ok(dorsales.ejercicios === 1 && dorsales.score === dom.score && dorsales.provisional === true, 'Caso «subgrupos»: Dorsales solo lo trabaja la dominada, provisional (apartado 19)');
ok(rangoDeSubgrupo(ej, 'cuello').sinRango === true || rangoDeSubgrupo(ej, 'musculatura-cervical').sinRango === true, 'Un subgrupo sin ejercicios: Sin Rango');
ok(espalda.subgrupos.length === 3 && espalda.subgrupos.some((s) => s.id === 'dorsales' && !s.sinRango), 'El grupo trae sus subgrupos');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Cobertura y rango global (apartados 20, 21 y 22) ──');

const G1 = rangoGlobal(UNA, { perfil: PERFIL });
ok(G1.sinRango === true && G1.motivo === 'poca_cobertura' && G1.cobertura.ejercicios === 1,
  `🚨 Caso «cobertura global»: con UN ejercicio NO hay rango global, aunque toque tres grupos (${G1.cobertura.texto} grupos, ${G1.cobertura.ejercicios} ejercicio)`);
ok(rangoGlobal({ ...DEFAULT_FITNESS }).motivo === 'sin_datos' && rangoGlobal({ ...DEFAULT_FITNESS }).cobertura.texto === '0/7', '…y sin nada, «sin datos» con cobertura 0/7');
const VARIOS = con(sesion('press-banca-barra', [r(5, 80)]), sesion('dominada-prona', [r(10)], corp), sesion('sentadilla-barra', [r(5, 100)]));
const GV = rangoGlobal(VARIOS, { perfil: PERFIL });
ok(GV.sinRango === false && GV.rango >= 1 && GV.cobertura.grupos >= COBERTURA_MINIMA_GLOBAL, `Con press, dominadas y sentadilla ya hay rango global (${GV.nombre}, cobertura ${GV.cobertura.texto})`);
const conDatos = GV.grupos.filter((g) => !g.sinRango);
ok(GV.score === Math.round(conDatos.reduce((n, g) => n + g.score, 0) / conDatos.length),
  '🚨 …que es la media de los grupos CON datos: el cuello, sin entrenar, no cuenta como cero (apartado 22)');
ok(GV.grupos.find((g) => g.id === 'cuello').sinRango === true, '…y el cuello sigue «Sin Rango», no «rango bajo»');
ok(GV.provisional === true, '⚠️ …y provisional: tres sesiones sueltas no son una clasificación firme');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Nada se inventa ni se guarda (apartados 28 y 31.14) ──');

const ANTES = JSON.stringify(VARIOS);
rangoGlobal(VARIOS, { perfil: PERFIL }); rangoDeEjercicio(VARIOS, 'press-banca-barra', { perfil: PERFIL });
ok(JSON.stringify(VARIOS) === ANTES, '🚨 Calcular rangos no cambia ni un byte de las sesiones');
const LIB = sinComentarios(leer('src/lib/rangos.js'));
ok(!/saveData|onGuardar|localStorage|guardarSesion/.test(LIB), '…ni guarda nada: se calcula al pedirlo (apartado 28)');
ok(/aparicionesDeEjercicio\(/.test(LIB) && /repartoMuscular/.test(LIB), 'Usa la F11 para las marcas y la F13 para el reparto: ni una segunda fuente');
/* ⚠️ Sin la lista de lo que NO se construye, que nombra justo esas palabras para
   decir que no existen: si no, el aviso haría saltar su propia comprobación. */
const CODIGO_SIN_DECLARACION = LIB.split('export const NO_EN_FIT15')[0] + sinComentarios(leer('src/components/rangos.jsx'));
ok(!/\b(XP|monedas|puntos de experiencia|leaderboard|ranking público)\b/i.test(CODIGO_SIN_DECLARACION), 'Sin XP, monedas ni rankings públicos (apartado 29)');
ok(aparicionesDeEjercicio(VARIOS, 'press-banca-barra').length === 1, '…y las apariciones siguen siendo las de siempre');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Los componentes (apartados 26 y 27) ──');

const COMP = sinComentarios(leer('src/components/rangos.jsx'));
ok(/export function RankBadge\(\{ rank = null, size = 'md', state = null, locked = false, selected = false/.test(COMP),
  '🚨 `RankBadge` acepta rank, size, state, locked y selected (apartado 27)');
ok(/export function RankLabel/.test(COMP) && /export function RankStatus/.test(COMP) && /export function RankProgress/.test(COMP), '…y están RankLabel, RankStatus y RankProgress');
ok(/role="img"/.test(COMP) && /<Lock/.test(COMP), 'La insignia se anuncia y lleva candado además del color');
ok(!/score/.test(COMP.replace(/siguiente/g, '')), '…y ningún componente enseña la puntuación (apartado 5)');
ok(/<RankBadge/.test(leer('src/views/FitnessView.jsx')), '🚨 La insignia de la F1 dibuja con `RankBadge`: un solo hexágono en la aplicación');
ok(NO_EN_FIT15.length >= 4, 'Lo que no se construye, dicho');

console.log(`\n  ${total - fallos}/${total} comprobaciones correctas.`);
if (fallos) {
  console.log(`  \x1b[31m${fallos} fallo(s).\x1b[0m\n`);
  process.exit(1);
}
