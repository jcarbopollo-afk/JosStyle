/* Entrega 4 · FIT F11/45 — Progresión y comparación del rendimiento.
   ═══════════════════════════════════════════════════════════════════════════
   Los siete casos obligatorios del apartado 38, los trece especiales del 37 y
   la prueba real del 44 — y, por encima de todo, que **nada de esto toca las
   sesiones guardadas** (apartado 36). */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  serieLimpia, CLASES, claseDe, seriesComparables, compararSeries, mejorSerie, TOLERANCIA_PESO_KG,
  indiceDeProgresion, aparicionesDeEjercicio, anteriorComparable, TENDENCIAS,
  textoSerie, textoSeries, compararApariciones, mejorHistorico, progresoDeEjercicio,
  comparacionEnSesion, ultimaVez, NO_EN_FIT11,
} from '../src/lib/progresion.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion, descartarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { detalleDeSesion, comparacionDiscreta } from '../src/lib/historial.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

/* ── Sesiones de verdad: constructor (F3) → en vivo (F7) → guardado (F8) ── */
const rutina = (id, cambios = {}) => {
  let r = crearRutina({ nombre: id });
  r = anadirEjercicio(r, id);
  return editarLinea(r, r.lineas[0].id, { series: 3, ...cambios }).lineas;
};
let dia = 0;
/** `valores`: una lista de series; cada una `{ peso, reps, duracion }`, o `null`
 *  para dejarla sin marcar. */
function sesion(exerciseId, valores, { cambios = {}, fecha = null, estado = 'completada' } = {}) {
  dia += 1;
  const f = fecha || `2026-08-${String(dia).padStart(2, '0')}`;
  const inicio = new Date(`${f}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: rutina(exerciseId, { series: valores.length, ...cambios }), hoy: f, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  if (estado === 'descartada') return descartarSesion(s, { confirmado: true }).sesion;
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const conSesiones = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const comparar = (idEj, antes, despues, opciones = {}) => {
  const F = conSesiones(sesion(idEj, antes, opciones.antes || {}), sesion(idEj, despues, opciones.despues || {}));
  return progresoDeEjercicio(F, idEj);
};
const r = (reps, peso = null) => ({ reps, peso });

console.log('\n═══ FIT F11/45 · Progresión y comparación del rendimiento ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Los siete casos obligatorios (apartado 38) ──');

const c1 = comparar('press-banca-barra', [r(8, 20)], [r(10, 20)]);
ok(c1.tendencia === 'mejora', `Caso 1 · 20 × 8 → 20 × 10: MEJORA (${c1.tendencia})`);
ok(c1.comparacion.cambios.reps.diferencia === 2 && c1.comparacion.texto === '+2 reps', `…y dice «${c1.comparacion.texto}» (apartado 23)`);

const c2 = comparar('press-banca-barra', [r(8, 20)], [r(8, 20)]);
ok(c2.tendencia === 'estable', `Caso 2 · 20 × 8 → 20 × 8: ESTABLE (${c2.tendencia})`);
ok(c2.comparacion.texto === 'Igual que la última vez', `…«${c2.comparacion.texto}»`);

const c3 = comparar('press-banca-barra', [r(10, 20)], [r(8, 20)]);
ok(c3.tendencia === 'descenso', `Caso 3 · 20 × 10 → 20 × 8: DESCENSO (${c3.tendencia})`);

const F4 = conSesiones(sesion('press-banca-barra', [r(8, 20)]));
const c4 = progresoDeEjercicio(F4, 'press-banca-barra');
ok(c4.comparacion.estado === 'primer_registro' && c4.comparacion.texto === 'Primer registro',
  '🚨 Caso 4 · sin sesión anterior: «Primer registro» (apartado 16)');
ok(c4.tendencia === 'sin_datos' && !/%/.test(c4.comparacion.texto), '…con la tendencia «sin datos» y NI un «+100 %»');

const c5 = comparar('l-sit', [{ duracion: 10 }], [{ duracion: 15 }]);
ok(c5.tendencia === 'mejora' && c5.comparacion.cambios.duracion.texto === '+5 s', `Caso 5 · isométrico 10 s → 15 s: MEJORA, «${c5.comparacion.texto}»`);

const c6 = comparar('dominada-prona', [r(8)], [r(10)], { antes: { cambios: { tipoCarga: 'corporal' } }, despues: { cambios: { tipoCarga: 'corporal' } } });
ok(c6.tendencia === 'mejora' && c6.ultima.clase === 'repeticiones', `Caso 6 · peso corporal 8 → 10 reps: MEJORA (${c6.tendencia}, clase ${c6.ultima.clase})`);
ok(c6.comparacion.cambios.volumen === null && c6.comparacion.cambios.peso === null,
  '🚨 …y sin volumen ni peso inventados: no hay un «72 kg × 10» (apartado 12)');

const F7 = conSesiones(sesion('dominada-prona', [r(8)]), sesion('dominada-supina', [r(12)]));
ok(progresoDeEjercicio(F7, 'dominada-supina').comparacion.estado === 'primer_registro',
  '🚨 Caso 7 · variante diferente (prona → supina): NO se comparan; la supina es su primer registro (apartados 3 y 4)');
ok(progresoDeEjercicio(F7, 'dominada-prona').veces === 1, '…y la prona sigue con su única vez');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Los casos especiales (apartado 37) ──');

const masPeso = comparar('press-banca-barra', [r(8, 20)], [r(8, 22.5)]);
ok(masPeso.tendencia === 'mejora' && masPeso.comparacion.cambios.peso.texto === '+2,5 kg',
  `Más peso y mismas reps: MEJORA de carga, «${masPeso.comparacion.cambios.peso.texto}» (apartado 8)`);
ok(masPeso.comparacion.cambios.peso.porcentaje === 12.5, `…con el +12,5 % del ejemplo del apartado 24 (${masPeso.comparacion.cambios.peso.porcentaje})`);

const ambos = comparar('press-banca-barra', [r(8, 20)], [r(10, 22.5)]);
ok(ambos.tendencia === 'mejora' && /\+2,5 kg/.test(ambos.comparacion.texto) && /\+2 reps/.test(ambos.comparacion.texto),
  `Peso y reps a la vez: MEJORA, sin reducirlo a una cifra (${ambos.comparacion.texto}, apartado 10)`);
ok(ambos.comparacion.cambios.volumen.antes === 160 && ambos.comparacion.cambios.volumen.despues === 225,
  '…y el volumen auxiliar del apartado 11: 160 → 225 kg');

const masPesoMenosReps = comparar('press-banca-barra', [r(10, 20)], [r(8, 25)]);
ok(masPesoMenosReps.tendencia === 'mejora', `Más peso y menos reps: la CARGA manda, MEJORA (${masPesoMenosReps.comparacion.texto})`);
ok(/−2 reps/.test(masPesoMenosReps.comparacion.texto), '…pero se dice que fueron dos repeticiones menos');

const menosPesoMasReps = comparar('press-banca-barra', [r(8, 22.5)], [r(12, 20)]);
ok(menosPesoMasReps.tendencia === 'mejora' && menosPesoMasReps.comparacion.porQue === 'volumen_mejor_serie',
  `🚨 Menos peso y más reps: desempata el volumen de la mejor serie (180 → 240 kg), MEJORA (${menosPesoMasReps.comparacion.porQue})`);
const menosPesoPocasMas = comparar('press-banca-barra', [r(8, 30)], [r(9, 20)]);
ok(menosPesoPocasMas.tendencia === 'descenso', `…y 30 × 8 → 20 × 9 es DESCENSO (240 → 180 kg)`);

const sinPeso = comparar('press-banca-barra', [r(8, 20), r(8, 20)], [r(10, null), r(10, null)]);
ok(sinPeso.comparacion.estado === 'no_comparable',
  '🚨 Sesión sin peso tras una con peso: NO se compara como si fuera la misma medida (apartado 17)');
ok(!sinPeso.comparacion.cambios, '…y no se inventa ningún peso');

const mezcla = comparar('press-banca-barra', [r(8, 20), r(8, 20)], [r(8, 20), r(12, null)]);
ok(mezcla.ultima.series.length === 1 && mezcla.tendencia === 'estable',
  '⚠️ Una serie con «peso desconocido × 12» se queda fuera; las que tienen el dato se comparan (apartado 17)');

const incompleta = comparar('press-banca-barra', [r(10, 20), r(10, 20), r(10, 20)], [r(10, 20), r(10, 20), null]);
ok(incompleta.ultima.series.length === 2, 'Series incompletas: solo cuentan las realizadas (apartado 26)');
ok(incompleta.tendencia === 'estable',
  `🚨 …y hacer 2 de 3 con los mismos números NO es un descenso: no se penaliza (${incompleta.tendencia}, apartado 26)`);

const lastre = comparar('dominada-prona', [r(8)], [r(6, 10)], { antes: { cambios: { tipoCarga: 'corporal' } }, despues: { cambios: { tipoCarga: 'adicional' } } });
ok(lastre.ultima.clase === 'lastre' && lastre.comparacion.estado === 'no_comparable' && lastre.cambioDeMedida === true,
  '🚨 Dominadas a peso corporal → las mismas con lastre: NO se comparan, y se REGISTRA el cambio (apartado 18)');
ok(lastre.comparacion.cambios === null, '…sin ninguna cifra de mejora inventada');
ok(textoSerie('lastre', { peso: 10, reps: 6 }) === '+10 kg × 6', `…y se escribe «${textoSerie('lastre', { peso: 10, reps: 6 })}»: peso AÑADIDO`);
ok(lastre.comparacion.cambios === null && lastre.ultima.series[0].peso === 10, 'Con lastre no hay volumen: el peso corporal no está en el número');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Varias series y la prueba real (apartados 25 y 44) ──');

const real = comparar('dominada-prona', [r(8), r(7), r(6)], [r(9), r(8), r(7)], { antes: { cambios: { tipoCarga: 'corporal' } }, despues: { cambios: { tipoCarga: 'corporal' } } });
ok(real.tendencia === 'mejora', 'Sesión A 8 / 7 / 6 → Sesión B 9 / 8 / 7: MEJORA (apartado 44)');
ok(real.comparacion.enCadaSerie === '+1 rep en cada serie', `🚨 …y dice «${real.comparacion.enCadaSerie}» (apartado 44, literal)`);
ok(real.anterior.texto === '8 · 7 · 6' && real.ultima.texto === '9 · 8 · 7', `Última «${real.ultima.texto}», anterior «${real.anterior.texto}» (apartados 6 y 7)`);

const global = comparar('dominada-prona', [r(10), r(9), r(8)], [r(10), r(10), r(9)], { antes: { cambios: { tipoCarga: 'corporal' } }, despues: { cambios: { tipoCarga: 'corporal' } } });
ok(global.tendencia === 'mejora' && global.comparacion.porQue === 'serie_a_serie',
  '🚨 10/9/8 → 10/10/9: la mejor serie empata, pero serie a serie es una MEJORA (apartado 25)');
ok(global.comparacion.porSerie.map((d) => d.reps).join() === '0,1,1', `…y guarda la diferencia de cada serie (${global.comparacion.porSerie.map((d) => d.reps).join(', ')})`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Última, anterior, mejor e historia (apartados 6, 7, 15, 28 y 29) ──');

const H = conSesiones(
  sesion('press-banca-barra', [r(5, 80)], { fecha: '2026-07-01' }),
  sesion('l-sit', [{ duracion: 12 }], { fecha: '2026-07-05' }),
  sesion('press-banca-barra', [r(8, 70)], { fecha: '2026-08-01' }),
  sesion('l-sit', [{ duracion: 15 }], { fecha: '2026-08-05' }),
  sesion('l-sit', [{ duracion: 14 }], { fecha: '2026-08-20' }),
  sesion('press-banca-barra', [r(9, 70)], { fecha: '2026-09-12' }),
  sesion('press-banca-barra', [r(20, 90)], { fecha: '2026-09-13', estado: 'descartada' }),
);
const P = progresoDeEjercicio(H, 'press-banca-barra');
ok(P.veces === 3, `🚨 Solo cuentan las completadas: 3 apariciones, la descartada con 90 kg NO (${P.veces}, apartado 2)`);
ok(P.ultima.fecha === '2026-09-12' && P.anterior.fecha === '2026-08-01', 'La última es la del 12 de septiembre, y la anterior la del 1 de agosto');
ok(P.anterior.fecha === '2026-08-01', '🚨 …aunque entre medias hubo sesiones de OTROS ejercicios: se busca la anterior comparable (apartados 7 y 28)');
ok(P.mejor.texto === '80 kg × 5' && P.mejor.fecha === '2026-07-01', `🚨 La mejor serie histórica con carga: «${P.mejor.texto}», aunque sea la más vieja (apartados 14 y 15)`);
ok(P.tendencia === 'mejora', `…y la tendencia es la de la última contra la anterior (${P.tendencia}: 70 × 8 → 70 × 9)`);
const L = progresoDeEjercicio(H, 'l-sit');
ok(L.mejor.texto === '15 s' && L.tendencia === 'descenso', `Un isométrico: mejor tiempo «${L.mejor.texto}», y 15 → 14 s es descenso (apartado 13)`);
ok(aparicionesDeEjercicio(H, 'press-banca-barra').map((a) => a.fecha).join() === '2026-09-12,2026-08-01,2026-07-01',
  '🚨 Todas las apariciones de un ejercicio, de la más reciente a la más antigua (apartado 29)');
const N = progresoDeEjercicio(H, 'dominada-prona');
ok(N.nuevo === true && N.veces === 0 && N.tendencia === 'sin_datos' && N.ultima === null, 'Un ejercicio que nunca ha hecho: «nuevo», sin datos (apartado 27)');

const mejores = [r(8, 20), r(10, 20), r(12, 17.5)];
ok(textoSerie('carga', mejorSerie('carga', mejores)) === '20 kg × 10',
  '🚨 Mejor serie de «20×8 · 20×10 · 17,5×12» = 20 kg × 10: carga primero, repeticiones al empatar (apartado 14, su ejemplo)');
ok(textoSerie('repeticiones', mejorSerie('repeticiones', [r(8), r(12), r(10)])) === '12 reps', 'A peso corporal, más repeticiones');
ok(textoSerie('tiempo', mejorSerie('tiempo', [{ duracion: 8 }, { duracion: 15 }])) === '15 s', 'En un isométrico, más segundos');
ok(mejorSerie('carga', []) === null, 'Sin series no hay mejor serie');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Datos corruptos y precisión (apartados 32 y 33) ──');

ok(JSON.stringify(serieLimpia({ hecho: { peso: -5, reps: 8 } })) === JSON.stringify({ peso: null, reps: 8, duracion: null }),
  '🚨 Un peso negativo se ignora, y las repeticiones de esa serie se conservan (apartado 32)');
ok(serieLimpia({ hecho: { reps: -3 } }).reps === null && serieLimpia({ hecho: { duracion: -10 } }).duracion === null, 'Repeticiones y segundos negativos, ignorados');
ok(serieLimpia({ hecho: { peso: 'hola', reps: 'x' } }).peso === null && serieLimpia({}).reps === null && serieLimpia(null).peso === null,
  'Textos, campos que no existen y una serie nula: no rompen');
ok(serieLimpia({ hecho: { peso: 22.5, reps: 8 } }).peso === 22.5, '🚨 22,5 kg sigue siendo 22,5, no 23 (apartado 33)');
ok(serieLimpia({ hecho: { peso: true } }).peso === null, '…y un `true` no se cuela como 1 kg');

const rota = sesion('press-banca-barra', [r(8, 20), r(9, 20)]);
const eR = ejerciciosDeSesion(rota)[0];
const rotaMas = { ...rota, origen: { ...rota.origen, ejercicios: [{ ...eR, series: [...eR.series, { id: 'x', estado: 'hecha', hecho: { peso: -1, reps: -2 } }, null, { estado: 'hecha' }] }, { id: 'y' }, null] } };
const FR = conSesiones(rotaMas);
let noRevienta = true;
try { progresoDeEjercicio(FR, 'press-banca-barra'); indiceDeProgresion({ sesiones: [null, {}, { id: 'z', estado: 'completada', origen: null }] }); } catch { noRevienta = false; }
ok(noRevienta, '🚨 Una sesión con series rotas, nulas y ejercicios sin id no rompe el cálculo (apartado 32)');
ok(progresoDeEjercicio(FR, 'press-banca-barra').ultima.series.length === 2, '…y se conservan las dos series buenas');

ok(Math.abs(TOLERANCIA_PESO_KG - 0.01) < 1e-9, 'La tolerancia del peso es de 0,01 kg (apartado 22)');
ok(compararSeries('carga', { peso: 20.001, reps: 8 }, { peso: 20, reps: 8 }) === 0, '…así que 20,001 kg frente a 20 kg es un EMPATE, no una mejora');
ok(compararSeries('carga', { peso: 20.5, reps: 8 }, { peso: 20, reps: 8 }) === 1, '…y 20,5 frente a 20, sí');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Nada toca los datos originales (apartado 36) ──');

const ORIGINAL = JSON.stringify(H);
progresoDeEjercicio(H, 'press-banca-barra');
progresoDeEjercicio(H, 'l-sit');
aparicionesDeEjercicio(H, 'l-sit').forEach((a) => { a.series.sort(() => -1); });
comparacionEnSesion(H, P.apariciones[0].sesionId, 'press-banca-barra');
ultimaVez(H, 'l-sit');
detalleDeSesion(H.sesiones.find((s) => s.estado === 'completada'), { fitness: H });
ok(JSON.stringify(H) === ORIGINAL, '🚨 Después de calcularlo TODO, las sesiones guardadas son idénticas byte a byte (apartado 36)');
const PROG = leer('src/lib/progresion.js').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/saveData|guardarSesion|onGuardar|localStorage/.test(PROG), '…y el archivo no tiene ni una forma de guardar nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Caché, historial y entrenamiento en vivo (apartados 31, 34 y 35) ──');

ok(indiceDeProgresion(H) === indiceDeProgresion(H), '🚨 El índice se calcula UNA vez por lista de sesiones (apartado 31)');
ok(indiceDeProgresion(H, []) === indiceDeProgresion(H, []), '…también con dos `[]` distintos como ejercicios propios');
const H2 = guardarSesion(H, sesion('press-banca-barra', [r(10, 70)], { fecha: '2026-09-15' }));
ok(indiceDeProgresion(H2) !== indiceDeProgresion(H) && progresoDeEjercicio(H2, 'press-banca-barra').veces === 4,
  '…y al guardar una sesión nueva (lista nueva) se recalcula solo');

const ses12 = H.sesiones.find((s) => s.fecha === '2026-09-12');
const comp12 = comparacionEnSesion(H, ses12.id, 'press-banca-barra');
ok(comp12 && comp12.estado === 'mejora' && comp12.texto === '+1 rep', `La sesión del 12 de septiembre, contra SU anterior: «${comp12 && comp12.texto}»`);
const det12 = detalleDeSesion(ses12, { fitness: H });
ok(det12.ejercicios[0].comparacion && det12.ejercicios[0].comparacion.texto === '+1 rep respecto a la última vez',
  `🚨 Y el historial lo dice, discreto: «${det12.ejercicios[0].comparacion && det12.ejercicios[0].comparacion.texto}» (apartado 34, su ejemplo)`);
const ses0701 = H.sesiones.find((s) => s.fecha === '2026-07-01');
ok(detalleDeSesion(ses0701, { fitness: H }).ejercicios[0].comparacion === null,
  '🚨 …y en la primera vez NO dice nada: sin datos anteriores, ni un bloque (apartado 34)');
ok(comparacionDiscreta({ estado: 'no_comparable', texto: 'x' }) === null && comparacionDiscreta(null) === null,
  '…ni con un cambio de medida');
const ses0801 = H.sesiones.find((s) => s.fecha === '2026-08-01');
const comp0801 = comparacionEnSesion(H, ses0801.id, 'press-banca-barra');
ok(comp0801.anterior.fecha === '2026-07-01' && comp0801.porQue === 'volumen_mejor_serie' && comp0801.estado === 'mejora',
  '⚠️ Cada sesión se compara con la de ANTES de ella, no con la más reciente (80×5 → 70×8: menos peso y más reps, desempata el volumen 400 → 560)');

const UV = ultimaVez(H, 'press-banca-barra');
ok(UV && UV.texto === '70 kg × 9' && UV.fecha === '2026-09-12', `🚨 «Última vez: ${UV && UV.texto}» queda preparado para el entrenamiento en vivo (apartado 35)`);
ok(ultimaVez(H, 'press-banca-barra', { antesDe: ses12.id }).texto === '70 kg × 8', '…sin contar la sesión que se está haciendo');
ok(ultimaVez(H, 'dominada-prona') === null, '…y de un ejercicio nuevo no se inventa ninguna');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. El catálogo y lo que no se construye ──');

ok(CLASES.map((c) => c.id).join() === 'carga,lastre,repeticiones,tiempo', 'Cuatro clases de medida');
ok(TENDENCIAS.map((t) => t.id).join() === 'mejora,estable,descenso,sin_datos', '🚨 Las cuatro tendencias del apartado 21');
ok(claseDe('tiempo', []) === 'tiempo' && claseDe('reps', [{ peso: null, reps: 8 }]) === 'repeticiones'
  && claseDe('reps', [{ peso: 20, reps: 8 }]) === 'carga' && claseDe('reps', [{ peso: 10, reps: 8 }], 'adicional') === 'lastre',
  'La clase sale de las series y del tipo de carga');
ok(seriesComparables('carga', [{ peso: 20, reps: 8 }, { peso: null, reps: 9 }]).length === 1, 'Las series sin el dato de su clase no se comparan');
ok(textoSeries('carga', [{ peso: 22.5, reps: 8 }]) === '22,5×8', 'Los números, en español');
ok(compararApariciones(null, null).estado === 'sin_datos', 'Sin nada, «sin datos»');
ok(NO_EN_FIT11.length >= 4 && NO_EN_FIT11.every((x) => x.porque.length > 20), 'Lo que no se construye, con su motivo (apartado 41)');
ok(/comparacion/.test(leer('src/views/HistorialView.jsx')), 'La pantalla del historial pinta la comparación');

console.log(`\n  ${total - fallos}/${total} comprobaciones correctas.`);
if (fallos) {
  console.log(`  \x1b[31m${fallos} fallo(s).\x1b[0m\n`);
  process.exit(1);
}
