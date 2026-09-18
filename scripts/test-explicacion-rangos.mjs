/* Entrega 4 · FIT F20/45 — Por qué tengo este rango.
   ═══════════════════════════════════════════════════════════════════════════
   Los veinte puntos del apartado 32, y lo que sostiene la fase: **explicar sin
   inventar**. Se dice de dónde sale el rango, qué datos lo sustentan y qué
   acerca al siguiente — y NO se dice «te faltan 5 kg» ni «llegarás a Élite en
   veinte días», porque eso el sistema no lo sabe. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEXTO_FUENTE, TEXTO_CONFIANZA, confianzaExplicada, dentroDelRango, siguientePaso,
  caminoDeRangos, comparacionDeRango, explicacionDeEjercicio, explicacionDeMusculo,
  explicacionGlobal, explicacionDeRango, NO_EN_FIT20, DECISIONES_FIT20,
} from '../src/lib/explicacionRangos.js';
import { rangoEfectivoDeEjercicio, rangoGlobalEfectivo } from '../src/lib/motorRangos.js';
import { RANK_THRESHOLDS } from '../src/lib/rangos.js';
import { clasificarEjercicio } from '../src/lib/clasificacion.js';
import { DEFAULT_FITNESS, NIVELES_RANGO } from '../src/lib/fitness.js';
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

const entrenado = con({ ...DEFAULT_FITNESS }, ...[6, 8, 10, 12].map((n) => sesion('dominada-prona', reps(n))));

console.log('\n\x1b[1m1 · LA EXPLICACIÓN DE UN EJERCICIO (apartados 6 y 7)\x1b[0m');

const ex = explicacionDeEjercicio(entrenado, 'dominada-prona', {});
ok(ex.titulo === 'Dominadas pronas' && !ex.sinRango,
  'Se explica el rango de un ejercicio');
ok(ex.rango === rangoEfectivoDeEjercicio(entrenado, 'dominada-prona', {}).rango,
  '🚨 Y es el rango del motor: aquí no se recalcula nada (apartado 26)');
const etiquetas = ex.evidencias.map((e) => e.etiqueta);
ok(etiquetas.includes('Mejor resultado') && etiquetas.includes('Tendencia') && etiquetas.includes('Sesiones comparables'),
  'Con lo que lo sostiene: mejor resultado, tendencia y sesiones (apartado 6)');
ok(/reps/.test(ex.evidencias.find((e) => e.etiqueta === 'Mejor resultado').valor),
  '🚨 …y la métrica es la del ejercicio: repeticiones, no kilos (apartado 7)');

/* Apartado 7 — un isométrico se explica en segundos, y nunca en kilos. */
const plancha = con({ ...DEFAULT_FITNESS }, ...[40, 50].map((s) => sesion('plancha-frontal', [{ duracion: s }, { duracion: s - 5 }], { modo: 'tiempo' })));
const exPlancha = explicacionDeEjercicio(plancha, 'plancha-frontal', {});
const marcaPlancha = exPlancha.evidencias.find((e) => e.etiqueta === 'Mejor resultado');
ok(marcaPlancha && / s$/.test(marcaPlancha.valor) && !/kg/.test(marcaPlancha.valor),
  `🚨 Un isométrico se explica en segundos y NO enseña kilos (${marcaPlancha ? marcaPlancha.valor : 'nada'})`);

ok(ex.descripcion && ex.descripcion === NIVELES_RANGO.find((n) => n.orden === ex.rango).que,
  'La descripción del nivel es la de siempre, no una nueva por pantalla');
ok(ex.fuente === 'entrenamiento' && ex.fuenteTexto.titulo === TEXTO_FUENTE.entrenamiento.titulo,
  '⚠️ Se dice de dónde sale: «Tus entrenamientos» (apartado 12)');
ok(ex.confianzaTexto && ex.confianzaTexto.titulo === TEXTO_CONFIANZA[ex.confianza].titulo,
  'Y con qué confianza, con su frase (apartado 14)');
ok(!/\b\d{3}\b/.test(JSON.stringify(ex.dentro)) && !/score/i.test(JSON.stringify(ex.dentro)),
  '🚨 La puntuación sigue sin enseñarse, ni siquiera aquí');

console.log('\n\x1b[1m2 · LAS TRES FUENTES, DICHAS SIN TECNICISMOS (apartados 11 a 13)\x1b[0m');

const soloCuestionario = clasificarEjercicio({ ...DEFAULT_FITNESS }, 'dominada-prona', 'reps-15', {}).fitness;
const exCuestionario = explicacionDeEjercicio(soloCuestionario, 'dominada-prona', {});
ok(exCuestionario.fuente === 'cuestionario' && /Clasificación inicial/i.test(exCuestionario.fuenteTexto.titulo),
  '🚨 Si sale del cuestionario, se dice «Clasificación inicial» (apartado 11)');
ok(/se actualizará con tus entrenamientos/i.test(exCuestionario.fuenteTexto.que),
  '…y que se actualizará: no se presenta como una medición objetiva');
ok(exCuestionario.provisional, '…marcada como provisional');
const combinado = con(soloCuestionario, sesion('dominada-prona', reps(5)));
const exCombinado = explicacionDeEjercicio(combinado, 'dominada-prona', {});
ok(exCombinado.fuente === 'combinado' && /clasificación inicial y.*rendimiento/i.test(exCombinado.fuenteTexto.titulo),
  '🚨 Y con las dos cosas: «tu clasificación inicial y tu rendimiento reciente» (apartado 13)');
ok(Object.keys(TEXTO_FUENTE).length === 3 && Object.keys(TEXTO_CONFIANZA).length === 3,
  'Las frases de fuente y confianza están escritas una sola vez');
ok(confianzaExplicada('alta').que && confianzaExplicada('inventada') === null,
  'Y no hay confianzas inventadas');

console.log('\n\x1b[1m3 · QUÉ FALTA, SIN PROMETER NADA (apartados 1, 9 y 10)\x1b[0m');

ok(!/\d+\s*(kg|reps|repeticiones|s)\b/i.test(ex.paso.texto),
  `🚨 El «qué te falta» NO da una cifra: sería una promesa que el sistema no puede cumplir (${ex.paso.texto})`);
ok(/mejora tu marca/i.test(ex.paso.texto), '…y en un ejercicio dice qué mejorar, no dónde');
ok(/registra entrenamientos/i.test(exCuestionario.paso.texto),
  '⚠️ Con solo la estimación, lo que falta son entrenamientos (apartado 11)');
ok(/más entrenamientos para confirmar/i.test(exCombinado.paso.texto),
  '…y con pocos, más datos para confirmar');
const sinNada = explicacionDeMusculo({ ...DEFAULT_FITNESS }, { grupoId: 'cuello' }, {});
ok(sinNada.sinRango && /Entrena o clasifica este grupo/i.test(sinNada.paso.texto),
  '🚨 Sin datos no se inventa una explicación: se dice qué hacer (apartado 10)');
ok(sinNada.paso.accion === 'clasificar', '…con la acción que corresponde');
const globalPoco = explicacionGlobal(con({ ...DEFAULT_FITNESS }, sesion('dominada-prona', reps(8))), {});
ok(globalPoco.sinRango && /otras zonas/i.test(globalPoco.paso.texto),
  '⚠️ Y si lo que falta es variedad, se dice eso y no «entrena más»');
ok(siguientePaso({ sinRango: false, fuente: 'entrenamiento', siguiente: { siguiente: null }, ambito: 'global' }).accion === null,
  'En el rango más alto no se pide nada más');

console.log('\n\x1b[1m4 · DENTRO DEL RANGO Y EL CAMINO (apartados 16 y 20)\x1b[0m');

const medio = dentroDelRango(RANK_THRESHOLDS[4] + 40, 5);
ok(medio && /Progresando dentro de/.test(medio.texto),
  '🚨 Se puede mejorar sin cambiar de rango, y se dice: «Progresando dentro de…» (apartado 20)');
ok(/Cerca del siguiente rango/.test(dentroDelRango(RANK_THRESHOLDS[5] - 5, 5).texto),
  '…y cuando está a punto, también');
ok(/Empezando dentro de/.test(dentroDelRango(RANK_THRESHOLDS[4] + 1, 5).texto),
  '…y cuando acaba de entrar');
ok(dentroDelRango(null, 5) === null && dentroDelRango(300, null) === null, 'Sin datos, nada');

const camino = caminoDeRangos(5);
ok(camino.length === 10 && camino.filter((n) => n.estado === 'actual').length === 1,
  'El camino son los diez rangos con el actual marcado (apartado 16)');
ok(!/\d{4}-\d{2}-\d{2}/.test(JSON.stringify(camino)),
  '🚨 …y sin fechas: no se guarda cuándo subió, así que no se inventa');
ok(caminoDeRangos(null).every((n) => n.estado === 'pendiente'), 'Sin rango, ninguno está marcado');

console.log('\n\x1b[1m5 · COMPARAR CON ANTES (apartados 17, 18 y 19)\x1b[0m');

const subiendo = con({ ...DEFAULT_FITNESS }, ...[5, 6, 7, 20].map((n) => sesion('dominada-prona', reps(n))));
const compSubida = comparacionDeRango(subiendo, 'dominada-prona', {});
ok(compSubida && compSubida.cambio === 'subida' && /Subida de rango/.test(compSubida.texto),
  '🚨 Una subida se dice, con el antes y el ahora (apartado 17)');
const estable = comparacionDeRango(entrenado, 'dominada-prona', {});
ok(estable && estable.cambio === 'estable' && /Rango estable/.test(estable.texto),
  '⚠️ Seguir igual es «Rango estable», no «no progresas» (apartado 19)');
ok(comparacionDeRango(con({ ...DEFAULT_FITNESS }, sesion('dominada-prona', reps(8))), 'dominada-prona', {}) === null,
  '🚨 Con una sola sesión NO se compara: no hay con qué (apartado 17)');

/* Apartado 18 — una bajada se dice sin dramatizar y sin hablar del cuerpo. */
const bajando = con({ ...DEFAULT_FITNESS }, ...[20, 20, 20, 20, 20, 3, 3, 3, 3, 3].map((n) => sesion('dominada-prona', reps(n))));
const compBajada = comparacionDeRango(bajando, 'dominada-prona', {});
ok(compBajada && compBajada.cambio === 'bajada',
  '🚨 Un bajón sostenido se reconoce…');
ok(!/empeorado|peor físicamente|has bajado de forma/i.test(compBajada.texto) && /rendimiento reciente/i.test(compBajada.texto),
  '🚨 …y se dice del RENDIMIENTO, no del cuerpo: rendimiento ≠ composición física (apartado 18)');

console.log('\n\x1b[1m6 · MÚSCULO Y GLOBAL (apartados 4, 5 y 15)\x1b[0m');

const exGrupo = explicacionDeMusculo(entrenado, { grupoId: 'espalda' }, {});
ok(!exGrupo.sinRango && exGrupo.titulo === 'Espalda', 'Se explica el rango de un grupo');
ok(exGrupo.relevantes.length >= 1 && exGrupo.relevantes[0].simbolo,
  '🚨 Con los ejercicios que lo sostienen y su flecha (apartado 5)');
ok(/ejercicios con datos/.test(exGrupo.cobertura.texto),
  'Y la cobertura, en palabras (apartado 15)');
const exSub = explicacionDeMusculo(entrenado, { subgrupoId: 'dorsales' }, {});
ok(exSub.ambito === 'subgrupo' && exSub.titulo === 'Dorsales', 'Y lo mismo para un subgrupo (apartado 18 de la F18)');

const completo = con(entrenado,
  ...[50, 55].map((kg) => sesion('sentadilla-barra', [{ reps: 6, peso: kg }, { reps: 6, peso: kg }])),
  ...[40, 45].map((kg) => sesion('press-banca-barra', [{ reps: 8, peso: kg }, { reps: 8, peso: kg }])));
const exGlobal = explicacionGlobal(completo, {});
ok(!exGlobal.sinRango && exGlobal.titulo === 'Rango general', 'Y el global');
const evidenciasGlobal = exGlobal.evidencias.map((e) => e.etiqueta);
ok(evidenciasGlobal.includes('Grupos con datos') && evidenciasGlobal.includes('Mayor contribución'),
  '🚨 Con la cobertura y las mayores contribuciones (apartado 4)');
ok(/\d de 7 grupos con datos/.test(exGlobal.cobertura.texto), '…y «N de 7 grupos con datos» (apartado 15)');
ok(exGlobal.rango === rangoGlobalEfectivo(completo, {}).rango,
  '🚨 …y el rango es el del motor, no uno recalculado aquí');
ok(exGlobal.grupos.length === 7, 'Y están los siete grupos, con o sin rango');
ok(!/%/.test(JSON.stringify(exGlobal.evidencias)),
  '🚨 Sin porcentajes inventados en las contribuciones (apartado 4)');

ok(explicacionDeRango(completo, { tipo: 'ejercicio', id: 'dominada-prona' }, {}).ambito === 'ejercicio'
  && explicacionDeRango(completo, { tipo: 'grupo', id: 'espalda' }, {}).ambito === 'grupo'
  && explicacionDeRango(completo, { tipo: 'subgrupo', id: 'dorsales' }, {}).ambito === 'subgrupo'
  && explicacionDeRango(completo, { tipo: 'global' }, {}).ambito === 'global',
  '🚨 Las cuatro se piden por la misma puerta y devuelven la misma forma (apartado 2)');

console.log('\n\x1b[1m7 · EL COMPONENTE, Y LO QUE NO SE HACE (apartados 3, 25 y 31)\x1b[0m');

const comp = sinComentarios(leer('src/components/explicacionRango.jsx'));
ok(/RankExplanation/.test(comp) && /RankConfidence/.test(comp) && /RankCoverage/.test(comp)
  && /RankEvidence/.test(comp) && /RankNextStep/.test(comp),
  'Los componentes del apartado 25 existen');
ok(!/RANK_THRESHOLDS|rangoEfectivo|puntuacion|\.score\b/.test(comp),
  '🚨 Y el componente NO calcula nada: recibe la explicación hecha (apartado 3)');
ok(/createPortal/.test(comp), 'La hoja va con `createPortal` (regla 3 del proyecto)');
ok(/maxHeight/.test(comp),
  '⚠️ …con tope de altura y scroll interno: en un iPhone pequeño se quedaba cortada (apartado 28)');
ok(/aria-modal/.test(comp) && /aria-label/.test(comp) && /Cerrar/.test(comp),
  'Y se puede cerrar y leer con lector de pantalla (apartado 29)');

const rangosView = sinComentarios(leer('src/views/RangosView.jsx'));
const detalleView = sinComentarios(leer('src/views/DetalleMuscularView.jsx'));
ok(/<RankExplanation/.test(rangosView), '🚨 Se abre desde el rango global (apartado 32.1)');
ok(/<RankExplanation/.test(detalleView) && /tipo: 'grupo'/.test(detalleView) && /tipo: 'subgrupo'/.test(detalleView),
  '…desde el muscular (32.2)…');
ok(/tipo: 'ejercicio'/.test(detalleView), '…y desde un ejercicio (32.3)');
ok((rangosView.match(/RankExplanation/g) || []).length <= 3 && /explicacionGlobal/.test(rangosView),
  '⚠️ Y es el MISMO componente en los tres sitios, no tres copias (apartado 2)');

ok(NO_EN_FIT20.length >= 3 && NO_EN_FIT20.every((x) => x.que && x.porque),
  'Lo que no trae la fase, con su motivo');
ok(NO_EN_FIT20.some((x) => /faltan|kg/i.test(x.que)),
  'Entre ello, decir cuánto falta exactamente (apartado 9)');
ok(DECISIONES_FIT20.length >= 3 && DECISIONES_FIT20.every((x) => x.que && x.porque),
  'Y las decisiones, escritas');
const sinDeclaraciones = (src) => sinComentarios(src)
  .replace(/export const NO_EN_FIT20 = \[[\s\S]*?\];/, ' ')
  .replace(/export const DECISIONES_FIT20 = \[[\s\S]*?\];/, ' ');
for (const archivo of ['src/lib/explicacionRangos.js', 'src/components/explicacionRango.jsx']) {
  ok(!/\bXP\b|leaderboard|logro|predicci[o\u00f3]n|en \\d+ d\u00edas/i.test(sinDeclaraciones(leer(archivo))),
    `🚨 ${archivo.split('/').pop()} no promete el futuro ni gamifica (apartado 31)`);
}

let rompe = false;
try {
  explicacionDeEjercicio(null, null, {});
  explicacionDeMusculo({ sesiones: [null] }, { grupoId: 'no-existe' }, {});
  explicacionGlobal({ clasificaciones: [null] }, {});
  explicacionDeRango(null, null, {});
} catch { rompe = true; }
ok(!rompe, '🚨 Con datos corruptos no se cae (apartado 30)');

console.log(`\n${fallos === 0 ? '\x1b[32mTODO EN VERDE\x1b[0m' : `\x1b[31m${fallos} FALLO(S)\x1b[0m`} — ${total} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
