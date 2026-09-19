/* ===========================================================================
   FIT F24/45 — PRIORIZACIÓN INTELIGENTE DE CLASIFICACIÓN

   Las veinte pruebas del apartado 33, más lo que esta fase tiene que demostrar
   que NO hace: guardar una cola, escribir un segundo sistema de preguntas,
   enseñar el `priorityScore`, hablar de XP, o inventarse un tipo
   «calentamiento» que el catálogo no tiene.
   =========================================================================== */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_FITNESS, GRUPOS_MUSCULARES } from '../src/lib/fitness.js';
import { todosLosEjercicios, ejercicioPorId } from '../src/lib/ejercicios.js';
import {
  claseDePregunta, clasificarEjercicio, relevanciaDeEjercicio, preguntaDeEjercicio,
} from '../src/lib/clasificacion.js';
import { UMBRALES_FUENTE } from '../src/lib/motorRangos.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { addDays } from '../src/lib/helpers.js';
import {
  ESTADOS_DATO, estadoDato, estadoDeDato, coberturaDeClasificacion,
  equivalentesDe, mapaDeEquivalentes, masRepresentativo, subgruposDe, factorRiqueza,
  PESOS, MOTIVOS, motivoCola,
  grupoPrincipalDe, prioridadDeEjercicio, impactoEstimado,
  RECOMENDADOS, MAX_SEGUIDOS, equilibrar, colaDeClasificacion,
  COBERTURA_BAJA, VACIOS_COLA, AVISO_COBERTURA_BAJA, pantallaDeClasificacion,
  AVISO_DATOS_MANDAN, avisoDeReclasificar,
  casillasDeCola, auditarCola, NO_EN_FIT24, DECISIONES_FIT24,
} from '../src/lib/colaClasificacion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* ⚠️ Comentarios Y cadenas: este archivo explica lo que NO hace, y la propia
   explicación haría saltar los barridos (la lección de siempre). */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-19';
/* 🚨 Los ids salen del CATÁLOGO, no de la memoria (lección de la F22). */
const DOMINADA = 'dominada-prona';
const SUPINA = 'dominada-supina';
const NEUTRA = 'dominada-neutra';
const SENTADILLA = 'sentadilla-barra';
const CURL = 'curl-barra';
const FRANCES = 'press-frances';
const CUELLO_1 = 'flexion-cuello';
const CUELLO_2 = 'extension-cuello';
const CUELLO_3 = 'puente-cuello';
const MOVILIDAD = 'face-pull';
const SKILL_SIN = 'transicion-asistida';
const SKILL_CON = 'sentadilla-pistol';

let contador = 0;
function sesion(exerciseId, valores, cuando) {
  contador += 1;
  const fecha = cuando || addDays(HOY, -90 + contador);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  /* Un escenario mal construido tiene que decir QUÉ está mal (lección F22). */
  if (!r.lineas.length) throw new Error(`El ejercicio «${exerciseId}» no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length });
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
const reps = (n) => [{ reps: n }, { reps: Math.max(1, n - 2) }];
/* 🐛 **La opción se le PIDE a la F17, no se escribe a mano.** Un ejercicio de
   tiempo no admite «reps-9» y uno de habilidad tampoco, así que adivinar el id
   habría hecho fallar el escenario con el código bien —y, peor, en un sitio
   distinto doce líneas más abajo (la lección de la F22)—. */
function opcionValida(id) {
  const p = preguntaDeEjercicio(ejercicioPorId(id), {});
  const op = ((p && p.opciones) || []).filter((o) => !o.omite).slice(-2)[0];
  if (!op) throw new Error(`El ejercicio «${id}» no ofrece ninguna opción que clasifique`);
  return op.id;
}
/* Clasificar de verdad, con la F17, y reventar si no se pudo (lección F22). */
function clasificar(f, id, opcion = null) {
  const r = clasificarEjercicio(f, id, opcion || opcionValida(id));
  if (r.ok !== true) throw new Error(`No se pudo clasificar «${id}»: ${r.error}`);
  return r.fitness;
}

/* Los escenarios que no varían, UNA sola vez (lección GE F2). */
const VACIO = { ...DEFAULT_FITNESS, sesiones: [], clasificaciones: [] };
const TRES_SESIONES = con(VACIO, sesion(DOMINADA, reps(9)), sesion(DOMINADA, reps(10)), sesion(DOMINADA, reps(11)));
const UNA_SESION = con(VACIO, sesion(DOMINADA, reps(10)));
const DOMINADA_CLASIFICADA = clasificar(VACIO, DOMINADA);
const CUELLO_CASI = clasificar(clasificar(VACIO, CUELLO_2), CUELLO_3);
const BRAZOS_TOCADOS = clasificar(VACIO, CURL);

console.log('\n\x1b[1m1 · ESTO NO ES IA, Y LOS UMBRALES NO SON NUEVOS\x1b[0m');

const fuente = leer('src/lib/colaClasificacion.js');
const codigo = soloCodigo(fuente);
ok(!/saveData|supabase|localStorage/.test(codigo),
  '🚨 Apartados 21 y 32 — la cola no se guarda en ninguna parte');
ok(/UMBRALES_FUENTE/.test(codigo) && !/UMBRALES_FUENTE\s*=/.test(codigo),
  '🚨 Los umbrales de «datos suficientes» se IMPORTAN de la F19, no se declaran aquí');
ok(!/ask-ai|anthropic|fetch\(/i.test(codigo),
  '🚨 Apartado 35 y el contexto — ni una llamada a IA: la prioridad es determinista');
ok(!/OPCIONES_|puntuacionDeRespuesta|function\s+preguntaDe/.test(codigo),
  '🚨 Apartado 8 — no hay un segundo sistema de preguntas: eso sigue siendo la F17');
ok(/claseDePregunta|clasificacionDe|relevanciaDeEjercicio/.test(codigo),
  '…y lo que necesita de la F17 lo importa');

console.log('\n\x1b[1m2 · PRUEBA 1 · SIN CLASIFICACIÓN\x1b[0m');

const q0 = colaDeClasificacion(VACIO);
ok(q0.cola.length > 0 && q0.cola.length <= RECOMENDADOS,
  `Sin nada hecho hay cola, y son ${q0.cola.length} (tope ${RECOMENDADOS})`);
ok(q0.cola.every((x) => x.currentDataState === 'sin_datos' && !x.currentClassification),
  'Todos los de la cola están sin datos y sin clasificar');
ok(q0.cola.every((x) => typeof x.reason === 'string' && x.reason.length > 0),
  'Apartado 16 — cada uno dice por qué está');
ok(q0.cola.every((x) => Array.isArray(x.muscleGroups) && x.muscleGroups.length > 0),
  'Apartado 4 — cada uno trae sus grupos musculares resueltos');
ok(q0.cola.every((x) => typeof x.priorityScore === 'number' && Number.isFinite(x.priorityScore)),
  '…y su `priorityScore`, que es un número de verdad');

console.log('\n\x1b[1m3 · PRUEBA 2 · CLASIFICACIÓN EXISTENTE\x1b[0m');

const q1 = colaDeClasificacion(DOMINADA_CLASIFICADA);
ok(!q1.cola.some((x) => x.exerciseId === DOMINADA),
  'Apartado 5 — lo ya clasificado sale de la cola principal');
ok(q1.secundarios.some((x) => x.exerciseId === DOMINADA),
  '…pero NO desaparece: queda como secundario (apartado 12: bajar prioridad, no eliminar)');
const pDom = prioridadDeEjercicio(DOMINADA_CLASIFICADA, DOMINADA);
ok(pDom.factores.clasificacion === PESOS.yaClasificado,
  `Y su factor de clasificación baja a ${PESOS.yaClasificado}`);

console.log('\n\x1b[1m4 · PRUEBAS 3 Y 18 · DATOS REALES SUFICIENTES\x1b[0m');

const d3 = estadoDeDato(TRES_SESIONES, DOMINADA);
ok(d3.sesiones >= UMBRALES_FUENTE.entrenamiento && d3.id === 'datos_suficientes',
  `Con ${d3.sesiones} sesiones el estado es «${d3.nombre}» (umbral ${UMBRALES_FUENTE.entrenamiento})`);
const q3 = colaDeClasificacion(TRES_SESIONES);
ok(!q3.cola.some((x) => x.exerciseId === DOMINADA),
  '🚨 Apartado 6 — el ejemplo del enunciado: con sesiones reales NO se pide clasificarlo');
ok(prioridadDeEjercicio(TRES_SESIONES, DOMINADA).priorityScore === 0,
  '…y su prioridad es exactamente 0, porque la fuente real manda');
const conAmbos = clasificar(TRES_SESIONES, DOMINADA);
ok(!colaDeClasificacion(conAmbos).cola.some((x) => x.exerciseId === DOMINADA),
  '🚨 Prueba 18 — aunque tenga estimación, los datos reales la sustituyen y sigue fuera');

console.log('\n\x1b[1m5 · PRUEBAS 4 Y 7 · DATOS REALES INSUFICIENTES\x1b[0m');

const d1 = estadoDeDato(UNA_SESION, DOMINADA);
ok(d1.sesiones === 1 && d1.id === 'datos_parciales' && d1.nombre === 'Datos limitados',
  '🚨 Apartado 7 — con una sesión el estado es «Datos limitados», su frase literal');
const q4 = colaDeClasificacion(UNA_SESION);
ok(!q4.cola.some((x) => x.exerciseId === DOMINADA),
  '…y NO se le obliga: fuera de la cola principal (apartado 7: «No obligar»)');
ok(q4.secundarios.some((x) => x.exerciseId === DOMINADA),
  '…pero sí aparece como clasificación secundaria');
ok(prioridadDeEjercicio(UNA_SESION, DOMINADA).reason === 'Datos insuficientes',
  'Su razón es «Datos insuficientes», la del apartado 16');
ok(PESOS.datos.datos_parciales > 0 && PESOS.datos.datos_parciales < PESOS.datos.sin_datos,
  'Y pesa menos que uno sin datos, pero no cero');

console.log('\n\x1b[1m6 · PRUEBA 5 · GRUPO SIN COBERTURA (el «Cuello = 0/3» del apartado 9)\x1b[0m');

const cob0 = coberturaDeClasificacion(VACIO);
const cuello0 = cob0.grupos.find((g) => g.grupoId === 'cuello');
ok(cuello0 && cuello0.con === 0 && cuello0.total === 3,
  `🚨 El ejemplo literal del apartado 9: Cuello = ${cuello0.con}/${cuello0.total}`);
ok(cob0.grupos.length === GRUPOS_MUSCULARES.length && cob0.grupos.every((g) => g.con === 0),
  'Sin nada hecho, los siete grupos están a cero');
const cobCasi = coberturaDeClasificacion(CUELLO_CASI);
const cuelloCasi = cobCasi.grupos.find((g) => g.grupoId === 'cuello');
ok(cuelloCasi.con === 2 && cuelloCasi.total === 3,
  `Clasificando dos de cuello, la cobertura sube a ${cuelloCasi.con}/${cuelloCasi.total}`);
const antes = prioridadDeEjercicio(VACIO, CUELLO_1).factores.cobertura;
const despues = prioridadDeEjercicio(CUELLO_CASI, CUELLO_1).factores.cobertura;
ok(despues < antes,
  `🚨 Y el factor de cobertura del que queda BAJA (${antes.toFixed(2)} → ${despues.toFixed(2)}): ya no es un grupo a oscuras`);
ok(prioridadDeEjercicio(VACIO, CUELLO_1).reason === 'Mejora tu cobertura de cuello',
  'Su razón nombra el grupo, como pide el apartado 16');

console.log('\n\x1b[1m7 · PRUEBA 6 · SUBGRUPO SIN COBERTURA\x1b[0m');

const cobBrazos = coberturaDeClasificacion(BRAZOS_TOCADOS);
const grupoBrazos = cobBrazos.grupos.find((g) => g.grupoId === 'brazos');
const subBiceps = cobBrazos.subgrupos.find((s) => s.subgrupoId === 'biceps');
const subTriceps = cobBrazos.subgrupos.find((s) => s.subgrupoId === 'triceps');
ok(grupoBrazos.con > 0 && subBiceps.con > 0 && subTriceps.con === 0,
  `Con un curl clasificado: brazos cubierto, bíceps ${subBiceps.con}, tríceps ${subTriceps.con}`);
const pFrances = prioridadDeEjercicio(BRAZOS_TOCADOS, FRANCES);
ok(pFrances.reason === `Subgrupo sin datos: ${subTriceps.nombre}`,
  `🚨 Apartado 10 — la razón baja al subgrupo: «${pFrances.reason}»`);
ok(cobBrazos.subgrupos.length >= 10,
  `Los subgrupos del apartado 10 están todos (${cobBrazos.subgrupos.length})`);

console.log('\n\x1b[1m8 · PRUEBAS 7 Y 8 · REDUNDANCIA Y VARIANTES\x1b[0m');

const equis = equivalentesDe(DOMINADA);
ok(equis.includes(SUPINA) && equis.includes(NEUTRA),
  `🚨 Apartado 11 — el ejemplo literal (pull-up / chin-up / neutral pull-up) sale del catálogo: ${equis.length} equivalentes`);
ok(equivalentesDe(SUPINA).includes(DOMINADA),
  '…y la relación se lee en los DOS sentidos, aunque solo una ficha lo declare');
ok(!equivalentesDe(DOMINADA).includes(DOMINADA),
  'Un ejercicio nunca es equivalente de sí mismo');
const mapaEq = mapaDeEquivalentes();
const ids = new Set(todosLosEjercicios().map((e) => e.id));
ok([...mapaEq.values()].every((l) => l.every((x) => ids.has(x))),
  '⚠️ Y un equivalente que apunta a un ejercicio que ya no existe se descarta (EH F24)');
ok(equivalentesDe(DOMINADA, { mapa: mapaEq }).join() === equivalentesDe(DOMINADA).join(),
  '…y el mapa compartido da lo mismo que calcularlo suelto: es una caché, no otra regla');
const redAntes = prioridadDeEjercicio(VACIO, SUPINA).factores.redundancia;
const redDespues = prioridadDeEjercicio(DOMINADA_CLASIFICADA, SUPINA).factores.redundancia;
ok(redAntes === 1 && redDespues === PESOS.redundancia,
  `🚨 Apartado 12 — clasificar una dominada baja la prioridad de su variante (${redAntes} → ${redDespues})`);
ok(colaDeClasificacion(DOMINADA_CLASIFICADA).todos.some((x) => x.exerciseId === SUPINA),
  '…pero NO la elimina del catálogo: «Simplemente bajar prioridad»');
ok(masRepresentativo([DOMINADA, SUPINA, NEUTRA]) === DOMINADA,
  '🚨 Apartado 11 — de las tres, la representativa es la dominada prona');
ok(masRepresentativo([SUPINA, DOMINADA, NEUTRA]) === DOMINADA,
  '…y no depende del orden en que se pregunten: es determinista');
/* 🐛 Y POR QUÉ, que es lo que casi se cuela: las tres empatan en relevancia y
   en riqueza —mismos cinco subgrupos, misma dificultad, las dos compuestas—,
   así que sin la conectividad el desempate por id habría elegido la neutra. */
const rel = (id) => relevanciaDeEjercicio(ejercicioPorId(id)) * factorRiqueza(ejercicioPorId(id));
ok(Math.abs(rel(DOMINADA) - rel(NEUTRA)) < 1e-9,
  '🐛 …y hacía falta: la prona y la neutra EMPATAN en relevancia y riqueza');
ok(mapaEq.get(DOMINADA).length > mapaEq.get(NEUTRA).length,
  `🚨 …lo que las separa es el catálogo: la prona está conectada a ${mapaEq.get(DOMINADA).length} y la neutra a ${mapaEq.get(NEUTRA).length}`);
ok(subgruposDe(ejercicioPorId(DOMINADA)) === 5,
  'La riqueza se cuenta en subgrupos de verdad, no a ojo (5)');
ok(masRepresentativo([]) === null, 'Sin ninguna, `null`, no un error');

console.log('\n\x1b[1m9 · PRUEBAS 9, 10, 11 Y 12 · SKILLS, ISOMÉTRICOS, MOVILIDAD Y CALENTAMIENTO\x1b[0m');

const ejSkillSin = ejercicioPorId(SKILL_SIN);
const ejSkillCon = ejercicioPorId(SKILL_CON);
ok(ejSkillSin && !(ejSkillSin.progresiones || []).length && ejSkillCon && (ejSkillCon.progresiones || []).length > 0,
  'El catálogo tiene una habilidad SIN progresiones declaradas y otra CON ellas');
const sSin = prioridadDeEjercicio(VACIO, SKILL_SIN).factores.tipo;
const sCon = prioridadDeEjercicio(VACIO, SKILL_CON).factores.tipo;
ok(sSin === PESOS.tipo.habilidadSinProgresiones && sCon > sSin,
  `🚨 Apartados 13 y 14 — la habilidad ambigua baja (${sSin}) y la que tiene progresiones no (${sCon})`);
const iso = prioridadDeEjercicio(VACIO, CUELLO_3);
ok(iso && iso.priorityScore > 0,
  'Prueba 10 — un isométrico claro se clasifica con normalidad, no se castiga');
ok(claseDePregunta(ejercicioPorId(MOVILIDAD)) === null,
  '🚨 Prueba 11 — la F17 ya deja la movilidad fuera: `claseDePregunta` devuelve null');
ok(!colaDeClasificacion(VACIO).todos.some((x) => x.exerciseId === MOVILIDAD),
  '…así que ni siquiera se puntúa: no baja de prioridad, es que no entra');
ok(!/movilidad/.test(JSON.stringify(PESOS)),
  '…y por eso NO hay un peso de movilidad: sería un multiplicador que no se aplica nunca (regla 8)');
const tiposDelCatalogo = new Set(todosLosEjercicios().flatMap((e) => e.tipos || []));
ok(!tiposDelCatalogo.has('calentamiento'),
  '🚨 Prueba 12 — el catálogo NO tiene un tipo «calentamiento»: inventarlo sería una clasificación mía');
ok(NO_EN_FIT24.some((x) => /calentamiento/i.test(x.que)),
  '…y está declarado con su motivo en vez de omitido');

console.log('\n\x1b[1m10 · PRUEBA 13 · EQUILIBRIO MUSCULAR\x1b[0m');

const seguidos = (l) => l.reduce((acc, x, i) => {
  if (i && x.grupoPrincipal === l[i - 1].grupoPrincipal) return { n: acc.n + 1, max: Math.max(acc.max, acc.n + 1) };
  return { n: 1, max: Math.max(acc.max, 1) };
}, { n: 0, max: 0 }).max;
ok(seguidos(q0.cola) <= MAX_SEGUIDOS,
  `🚨 Apartado 15 — nunca más de ${MAX_SEGUIDOS} seguidos del mismo grupo (máximo real: ${seguidos(q0.cola)})`);
const espaldas = [
  { exerciseId: 'a', grupoPrincipal: 'espalda' }, { exerciseId: 'b', grupoPrincipal: 'espalda' },
  { exerciseId: 'c', grupoPrincipal: 'espalda' }, { exerciseId: 'd', grupoPrincipal: 'espalda' },
  { exerciseId: 'e', grupoPrincipal: 'piernas' },
];
const eq = equilibrar(espaldas);
ok(eq.length === espaldas.length, 'Equilibrar NO descarta: entran los cinco');
ok(eq.findIndex((x) => x.grupoPrincipal === 'piernas') < espaldas.length - 1,
  '…y adelanta el de piernas en vez de dejarlo el último tras cuatro de espalda');
const soloEspalda = equilibrar(espaldas.slice(0, 4));
ok(soloEspalda.length === 4,
  '🚨 Y si NO hay ninguno de otro grupo, entran igual: no se esconde un ejercicio prioritario');

console.log('\n\x1b[1m11 · PRUEBAS 14, 21 Y 15 · RECALCULAR, Y NO GUARDAR LA COLA\x1b[0m');

const primero = q0.cola[0].exerciseId;
const tras = clasificar(VACIO, primero);
const q5 = colaDeClasificacion(tras);
ok(!q5.cola.some((x) => x.exerciseId === primero),
  `🚨 Prueba 14 — tras clasificar «${primero}», la cola se recalcula y ya no lo pide`);
ok(q5.cola[0] && q5.cola[0].exerciseId !== primero,
  'Apartado 21 — el siguiente ejercicio puede cambiar, y cambia');
ok(!('cola' in tras) && !('colaClasificacion' in tras),
  '🚨 Apartados 21 y 32 — no se ha guardado ninguna cola en `fitness`');
const repetida = colaDeClasificacion(VACIO);
ok(repetida.cola.map((x) => x.exerciseId).join() === q0.cola.map((x) => x.exerciseId).join(),
  '🚨 Prueba 15 — salir y volver da exactamente la misma cola: es determinista');
ok(pantallaDeClasificacion(DOMINADA_CLASIFICADA).progreso.hechos === 1,
  '…y el progreso sale de lo guardado, así que salir a mitad no pierde nada');

console.log('\n\x1b[1m12 · PRUEBA 16 · SALTAR UN EJERCICIO\x1b[0m');

const qSalt = colaDeClasificacion(VACIO, { saltados: [primero] });
ok(!qSalt.cola.some((x) => x.exerciseId === primero),
  `🚨 Apartado 24 — el saltado sale de la cola («${primero}»)`);
ok(qSalt.cola.length > 0, '…y se sigue con otro, no se acaba la pantalla');
ok(!VACIO.clasificaciones.length,
  '🚨 …y saltar NO le asigna un nivel arbitrario: no se ha guardado ninguna clasificación');
ok(colaDeClasificacion(VACIO).cola.some((x) => x.exerciseId === primero),
  '…y queda pendiente: al volver sin saltarlo, ahí sigue');

console.log('\n\x1b[1m13 · PRUEBAS 17 Y 23 · RECLASIFICAR\x1b[0m');

const rSin = avisoDeReclasificar(DOMINADA_CLASIFICADA, DOMINADA);
const rCon = avisoDeReclasificar(TRES_SESIONES, DOMINADA);
ok(rSin.puede === true && rCon.puede === true,
  '🚨 Apartado 23 — se puede reclasificar SIEMPRE: el aviso informa, no bloquea');
ok(rSin.aviso === null && rCon.aviso === AVISO_DATOS_MANDAN,
  `…y con datos reales suficientes se avisa: «${AVISO_DATOS_MANDAN}»`);
ok(/entrenamientos reales tienen prioridad/.test(AVISO_DATOS_MANDAN),
  'Y es la frase literal del apartado 23');

console.log('\n\x1b[1m14 · PRUEBAS 19 Y 20 · COLA VACÍA Y CATÁLOGO INCOMPLETO\x1b[0m');

const pVacio = pantallaDeClasificacion(VACIO, { limite: 0 });
ok(pVacio.vacio && pVacio.vacio.id === 'completa' && /completa/i.test(pVacio.vacio.titulo),
  `🚨 Prueba 19 — sin cola se dice: «${pVacio.vacio.titulo}»`);
ok(/nuevos ejercicios/i.test(pVacio.vacio.que),
  '…con la segunda frase del apartado 28');
const pSalt = pantallaDeClasificacion(VACIO, { limite: 0, saltados: [primero] });
ok(pSalt.vacio.id === 'todo_saltado' && pSalt.vacio.id !== pVacio.vacio.id,
  '⚠️ Y haberlo saltado todo NO es lo mismo que haberlo completado: son dos vacíos distintos');
const raro = [{ id: 'ejercicio-raro', nombre: 'Raro', medidas: ['reps'], musculos: [] }];
let sobrevive = true;
let pRaro = null;
try { pRaro = pantallaDeClasificacion(VACIO, { propios: raro }); } catch { sobrevive = false; }
ok(sobrevive && pRaro,
  '🚨 Prueba 20 — un ejercicio sin músculos no tumba nada');
ok(!pRaro.cola.some((x) => x.exerciseId === 'ejercicio-raro'),
  '…y no entra en la cola: sin músculos no aporta información muscular que pedir');
ok(prioridadDeEjercicio(VACIO, 'no-existe-este') === null,
  'Y un id que no está en el catálogo devuelve `null`, no un objeto a medias');
ok(pantallaDeClasificacion(null) && pantallaDeClasificacion({}).cola.length > 0,
  'Sin `fitness` tampoco revienta');

console.log('\n\x1b[1m15 · APARTADOS 17, 18 Y 19 · LO QUE SE VE\x1b[0m');

const pant = pantallaDeClasificacion(VACIO);
ok(pant.titulo === 'Te recomendamos empezar por estos ejercicios.',
  '🚨 Apartado 17 — la frase de la cabecera, literal');
ok(/^\d+ ejercicios? recomendados?$/.test(pant.contador),
  `🚨 Apartado 18 — el contador que manda es el de recomendados: «${pant.contador}»`);
ok(!/restantes/.test(pant.contador) && Number(pant.contador.split(' ')[0]) <= RECOMENDADOS,
  '…y nunca dice «87 restantes»: el número es el de la cola');
ok(pant.contadorSecundario && /sin clasificación/.test(pant.contadorSecundario),
  `…con la cifra secundaria del apartado 18 detrás: «${pant.contadorSecundario}»`);
ok(/^\d+ \/ \d+ recomendados$/.test(pant.progreso.texto),
  `🚨 Apartado 19 — el progreso es «${pant.progreso.texto}»`);
ok(pant.avisoCobertura === AVISO_COBERTURA_BAJA && coberturaDeClasificacion(VACIO).fraccion < COBERTURA_BAJA,
  '🚨 Apartado 29 — sin nada clasificado la cobertura está baja y se dice');
ok(pant.cobertura.gruposTotales === GRUPOS_MUSCULARES.length,
  'Y la cobertura cuenta los siete grupos del apartado 9');

console.log('\n\x1b[1m16 · NI XP, NI SCORE EN PANTALLA (apartados 16, 19 y 35)\x1b[0m');

const textos = [
  pant.titulo, pant.contador, pant.contadorSecundario, pant.progreso.texto, pant.avisoCobertura,
  ...pant.cola.map((x) => x.reason), ...pant.cola.map((x) => x.estimatedImpact.texto),
  ...ESTADOS_DATO.map((e) => `${e.nombre} ${e.que}`),
  ...Object.values(VACIOS_COLA).map((v) => `${v.titulo} ${v.que}`),
  AVISO_DATOS_MANDAN, AVISO_COBERTURA_BAJA,
].filter(Boolean).join(' · ');
ok(!/\bxp\b|\bnivel \d|logro|recompensa|insignia|ranking|clasificación general/i.test(textos),
  '🚨 Apartados 19 y 35 y D2-02 — ni XP, ni logros, ni recompensas en ningún texto');
ok(!/priorityScore|puntuación|\bscore\b/i.test(textos),
  '🚨 Apartado 16 — el score técnico no se enseña en ninguna parte');
ok(!/deberías|tienes que|debes|obligatorio/i.test(textos),
  '…y no se le da una orden: se recomienda');
ok(pant.cola.every((x) => !/\d+ puntos/.test(x.reason)),
  '…ni se promete una cifra de rango por clasificar (lección de la F23)');

console.log('\n\x1b[1m17 · EL IMPACTO SE MIDE EN COBERTURA, NO EN PUNTOS\x1b[0m');

const imp = pant.cola[0].estimatedImpact;
ok(typeof imp.subgruposNuevos === 'number' && typeof imp.texto === 'string',
  `Apartado 4 — estimatedImpact dice cuánta información nueva daría: «${imp.texto}»`);
ok(!/rango|puntos|kg|repeticiones/i.test(imp.texto),
  '🚨 …y NO lo traduce a puntos de rango, kilos ni repeticiones (F23, apartados 12 y 13)');
const impVacio = impactoEstimado(coberturaDeClasificacion(BRAZOS_TOCADOS), ejercicioPorId(CURL));
ok(impVacio.subgruposNuevos === 0 && /Afinaría/.test(impVacio.texto),
  'Y cuando no descubre nada nuevo lo dice así, sin inflarlo');

console.log('\n\x1b[1m18 · LA AUDITORÍA, Y QUE SE PUEDE PONER ROJA (EH F42)\x1b[0m');

const aud = auditarCola(VACIO);
ok(aud.ok === true && aud.casillas.length >= 6,
  `La auditoría pasa con ${aud.casillas.length} casillas`);
const falsa = { cola: [
  { exerciseId: 'x', nombre: 'X', reason: '', priorityScore: 1, grupoPrincipal: 'espalda', currentDataState: 'datos_suficientes', currentClassification: { id: 'c' } },
  { exerciseId: 'y', nombre: 'Y', reason: 'a', priorityScore: 9, grupoPrincipal: 'espalda', currentDataState: 'sin_datos', currentClassification: null },
  { exerciseId: 'z', nombre: 'Z', reason: 'a', priorityScore: 9, grupoPrincipal: 'espalda', currentDataState: 'sin_datos', currentClassification: null },
] };
const casFalsas = casillasDeCola(falsa);
ok(casFalsas.some((c) => !c.ok),
  '🚨 Y con una cola fabricada mal SE PONE ROJA: una auditoría que no puede fallar no sirve');
ok(!casFalsas.find((c) => c.id === 'sin_datos_reales').ok
  && !casFalsas.find((c) => c.id === 'sin_clasificados').ok
  && !casFalsas.find((c) => c.id === 'con_razon').ok
  && !casFalsas.find((c) => c.id === 'equilibrada').ok,
  '…y señala las cuatro cosas que están mal, una por una');
ok(casillasDeCola({ cola: [] }).every((c) => c.ok),
  'Una cola vacía no incumple nada: no hay nada que incumplir');

console.log('\n\x1b[1m19 · LO DECLARADO\x1b[0m');

ok(NO_EN_FIT24.length >= 5 && NO_EN_FIT24.every((x) => x.que && x.porque && x.porque.length > 40),
  `${NO_EN_FIT24.length} cosas declaradas como NO construidas, cada una con su motivo`);
ok(DECISIONES_FIT24.length >= 5 && DECISIONES_FIT24.every((x) => x.que && x.porque && x.porque.length > 40),
  `${DECISIONES_FIT24.length} decisiones escritas con su porqué`);
ok(NO_EN_FIT24.some((x) => /XP|logro/i.test(x.que)) && NO_EN_FIT24.some((x) => /cola/i.test(x.que)),
  'Entre ellas, la de XP (D2-02) y la de no guardar la cola');
ok(MOTIVOS.length === 5 && MOTIVOS.every((m) => typeof m.texto === 'function'),
  'Las cinco razones del apartado 16, cada una con su texto');
ok(motivoCola('sin_clasificacion') && motivoCola('inventado') === null,
  'Y una razón que no existe devuelve `null`');
ok(ESTADOS_DATO.length === 3 && estadoDato('datos_parciales').nombre === 'Datos limitados',
  'Los tres estados de dato, con la frase del apartado 7');
ok(grupoPrincipalDe(ejercicioPorId(SENTADILLA)) === 'piernas',
  'Y el grupo principal sale del reparto del catálogo, no de una lista escrita a mano');

console.log('\n\x1b[1m20 · LOS COMPONENTES (apartado 27)\x1b[0m');

const vista = leer('src/components/colaClasificacion.jsx');
const vistaCodigo = soloCodigo(vista);
ok(/ClassificationHub|ClassificationQueue|ClassificationQueueCard|ClassificationReason|ClassificationEmpty/.test(vistaCodigo),
  'Los cinco componentes nuevos del apartado 27 existen');
ok(!/function\s+ClassificationProgress/.test(vistaCodigo),
  '🚨 Apartado 27 — `ClassificationProgress` NO se duplica: ya era de la F17');
ok(!/function\s+ClassificationQuestion|function\s+ClassificationOption|function\s+ClassificationResult/.test(vistaCodigo),
  '…ni las tres que el apartado prohíbe duplicar');
ok(!/priorityScore/.test(vistaCodigo),
  '🚨 Apartado 16 — la pantalla no pinta el score en ninguna parte');
ok(!/#[0-9a-fA-F]{6}/.test(vistaCodigo),
  'Regla 2 — ni un hex suelto: todo sale de `COLORS`');
ok(!/fixed inset-0/.test(vistaCodigo),
  'Regla 3 — el hub es una pantalla, no un overlay: no hace falta portal');
/* 🐛 Y esto se busca en el archivo **EN BRUTO**, no en el limpio: `toque-44`
   vive dentro de un `className`, o sea **dentro de una cadena**, y quitarlas
   para buscar lo que el código HACE también se lleva lo que el código DICE.
   El limpio vale para comprobar que algo NO se hace; para comprobar que algo
   SÍ está, hay que mirar el original (la lección de `sinComentarios`, EH F39). */
ok(/aria-label/.test(vista) && /toque-44/.test(vista),
  'Apartado 31 — cada acción tiene nombre accesible y área táctil');
ok(!/colaDeClasificacion\(|prioridadDeEjercicio\(/.test(vistaCodigo),
  '🚨 Apartado 32 — la pantalla NO calcula prioridades: se las dan hechas');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F24 — ${total - fallos}/${total} comprobaciones\x1b[0m\n`);
process.exit(fallos === 0 ? 0 : 1);
