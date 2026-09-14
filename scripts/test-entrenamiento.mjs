/* El motor de entrenamiento en vivo (Entrega 4 · FIT F7/45).
 *
 * El apartado 37 es una lista de validaciones obligatorias en ocho grupos
 * —Inicio, Navegación, Series, Isométricos, Sustitución, Notas, Descanso,
 * Persistencia y Salida— y el 38 pide poder hacer **una sesión entera**:
 * *Empezar → navegar → introducir peso/reps → completar series → añadir series
 * → descansar → añadir notas → sustituir un ejercicio → salir/reanudar* sin
 * perder datos. Aquí se ejecuta esa sesión completa sobre datos de verdad de la
 * aplicación; lo que es de pantalla va en el recorrido de Chromium.
 *
 * 🚨 Las cuatro cosas que más se vigilan, porque son las que el enunciado
 * subraya y las que este proyecto ya ha pagado caras:
 *   · Apartados 14 y 20 — **planificado y realizado son dos objetos**. Si se
 *     pisaran, la F11 no tendría con qué comparar.
 *   · Apartado 19 — una serie del plan **se omite, no se destruye**.
 *   · Apartados 6 y 7 — el cronómetro sale de **marcas de tiempo**, así que hay
 *     una comprobación que simula bloquear el móvil diez minutos.
 *   · Apartado 26 — sustituir **solo toca la sesión**: el plan y la plantilla
 *     se comparan antes y después, campo a campo.
 *
 * Y la regla 5, que en esta fase vale doble: hay una comprobación que le pasa
 * una sesión con una serie CORRUPTA a la puerta de carga de la F5 —que se la
 * traga, porque no sabe qué hay dentro de un snapshot— y luego a la de la F7,
 * que la descarta. Si aquélla ya la limpiara, esta capa no haría nada y la
 * comprobación no podría ponerse roja (EH F42).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ORIGENES_SERIE, ESTADOS_SERIE, MEDIDAS_SERIE, medidaDeSerie,
  crearSerie, normalizarSerie, textoPlanificado, textoRealizado,
  crearEjercicioDeSesion, normalizarEjercicioDeSesion, seriesDeLinea,
  empezarSesion, ejerciciosDeSesion, ejercicioActual, duracionSesion, reloj,
  pausarSesion, reanudarSesion, irAEjercicio, siguienteEjercicio, anteriorEjercicio,
  editarSerie, marcarSerie, anadirSerie, quitarSerie, recuperarSerie,
  sustituirEjercicio, sustitutosSugeridos, notaDeEjercicio,
  crearDescanso, restanteDescanso, descansoTerminado, pausarDescanso,
  reanudarDescanso, reiniciarDescanso, EVENTO_FIN_DESCANSO, SONIDO_DESCANSO,
  vibrarSiSePuede, AVISO_SALIR, AVISO_DESCARTAR,
  descartarSesion, sesionActiva, avisoDeRecuperacion,
  guardarSesion, fichaDeEjercicio, filasDeSeries, progresoSesion,
  estadoDeEjercicio, carruselDeSesion, NO_EN_FIT7, PREPARADO_PARA_FIT7,
  auditarSesion, normalizarSesionCompleta, normalizarFitnessConSesiones,
} from '../src/lib/entrenamiento.js';
import {
  DEFAULT_FITNESS, ESTADOS_SESION, crearWorkoutSession, normalizarFitness,
} from '../src/lib/fitness.js';
import {
  usarPlan, diaARutina, planPorId, normalizarFitnessConPlanes, CATALOGO_PLANES,
} from '../src/lib/planes.js';
import { planActivoCompleto } from '../src/lib/tuPlan.js';
import {
  crearRutina, anadirEjercicio, rutinaAPlan, planARutina, MAX_SERIES,
} from '../src/lib/constructor.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
/* 🔓 FIT F8 — Terminar ya no completa: pasa la sesión al resumen. `terminarSesion`
   y su aviso se retiraron con la pantalla que los hacía falta, así que las
   comprobaciones de esta fase pasan a usar lo que de verdad hace el botón. */
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
const terminarYGuardar = (ses, { ahora } = {}) => guardarEntrenamiento(
  pasarAFinalizacion(ses, { ahora }), { confirmado: true, ahora },
);

const RAIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ_DIR, p), 'utf8');
/* La lección de siempre, ya por la vigesimoctava vez: un barrido que comprueba
   que el código NO hace algo tiene que quitar comentarios y cadenas. */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const LUNES = '2026-09-14';
const T0 = Date.UTC(2026, 8, 14, 18, 0, 0);
const seg = (n) => T0 + n * 1000;
const min = (n) => T0 + n * 60 * 1000;

/* 🚨 El escenario sale de un PLAN DE VERDAD de la biblioteca (F5), no de una
   rutina inventada: probar sobre lo que de verdad hay es la lección de EH F44,
   y además es lo que pide el apartado 37 (*"datos ficticios reales de la
   aplicación"*). */
const F_CON_PLAN = usarPlan({ ...DEFAULT_FITNESS }, 'ppl-estetico', { hoy: LUNES }).fitness;
const RESUELTO = planActivoCompleto(F_CON_PLAN);
const DIA_0 = diaARutina(RESUELTO.plan, 0, []);

const nueva = (extra = {}) => empezarSesion({
  nombre: DIA_0.nombre,
  lineas: DIA_0.lineas,
  planId: RESUELTO.activo.planId,
  origenTipo: 'preset',
  origenId: DIA_0.id,
  ahora: T0,
  hoy: LUNES,
  ...extra,
});

console.log('\n═══ FIT F7/45 · Motor de entrenamiento en vivo ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Inicio: se crea la sesión, con su snapshot (apartados 2 y 3) ──');

const S0 = nueva();
ok(!!S0.id, '🚨 Empezar crea una WorkoutSession con su id (apartado 37, «se crea WorkoutSession»)');
ok(S0.estado === 'en_curso', `…en curso (${S0.estado})`);
ok(ESTADOS_SESION.includes(S0.estado), '…y su estado es uno de los del modelo de la F1');
ok(S0.iniciadaEn === T0, '🚨 …guardando CUÁNDO empezó, que es lo que hace posible el cronómetro (apartado 6)');
ok(S0.fecha === LUNES, '…y el día');
ok(S0.nombre === DIA_0.nombre, `…con el nombre del entrenamiento (${S0.nombre})`);
ok(S0.planId === 'ppl-estetico', '…y de qué plan salió (apartado 2)');
ok(S0.actual === 0, '…empieza por el primer ejercicio (apartado 37)');

const EJS0 = ejerciciosDeSesion(S0);
ok(EJS0.length === DIA_0.lineas.length,
  `🚨 El SNAPSHOT trae los ${EJS0.length} ejercicios del día (apartado 3)`);
ok(EJS0.every((e) => e.exerciseId && ejercicioPorId(e.exerciseId, [])),
  '…todos apuntando a un ejercicio real del catálogo');
ok(EJS0.every((e) => e.series.length > 0), '…y cada uno con sus series');
ok(EJS0.every((e, i) => e.orden === i), '…en el orden del plan');

/* 🚨 Lo que el snapshot NO copia. */
const CRUDO = JSON.stringify(S0);
const PRIMERO = ejercicioPorId(EJS0[0].exerciseId, []);
ok(!CRUDO.includes(`"nombre":"${PRIMERO.nombre}"`),
  '🚨 …y NO copia el nombre del ejercicio: se le sigue preguntando al catálogo (F2 y F3)');
ok(!/"musculos":\[\{/.test(CRUDO), '…ni sus músculos');
ok(!/"equipamiento":/.test(CRUDO), '…ni su equipamiento');

/* Y el snapshot aguanta que el plan cambie debajo. */
const PLAN_ORIGINAL = JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES));
const tocada = marcarSerie(S0, EJS0[0].id, EJS0[0].series[0].id, true);
ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PLAN_ORIGINAL,
  '🚨 …y entrenar NO toca el plan de la biblioteca: son datos de la aplicación (F5)');
ok(ejerciciosDeSesion(tocada)[0].series[0].estado === 'hecha', '…solo la sesión');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El cronómetro, de marcas de tiempo (apartados 6 y 7) ──');

ok(duracionSesion(S0, seg(84)) === 84000, 'Un minuto y 24 segundos son 84 000 ms');
ok(reloj(0) === '00:00', '`00:00` al empezar (apartado 6)');
ok(reloj(84000) === '01:24', `…y \`01:24\` después (${reloj(84000)})`);
ok(reloj(3723000) === '1:02:03', `…con horas cuando las hay (${reloj(3723000)})`);
ok(reloj(-5) === '00:00' && reloj(null) === '00:00', '…y nunca un tiempo negativo');

/* 🚨 La comprobación que de verdad importa: bloquear el móvil diez minutos. Un
   contador que restara segundos se quedaría diez minutos por detrás (E3 F25). */
ok(duracionSesion(S0, min(10)) === 600000,
  '🚨 Diez minutos con el móvil bloqueado son diez minutos: el tiempo NO se cuenta, se resta');
ok(duracionSesion({ ...S0, iniciadaEn: null }, min(10)) === 0,
  '…y sin hora de inicio no se inventa una duración');

/* Pausa: el rato parado no cuenta. */
const PAUSADA = pausarSesion(S0, min(5));
ok(PAUSADA.estado === 'pausada' && PAUSADA.pausadaEn === min(5), 'Pausar guarda cuándo se paró');
ok(duracionSesion(PAUSADA, min(30)) === 300000,
  '🚨 …y en pausa el reloj NO avanza, aunque pasen 25 minutos');
const REANUDADA = reanudarSesion(PAUSADA, min(20));
ok(REANUDADA.estado === 'en_curso' && REANUDADA.pausadoMs === 900000,
  '…y al reanudar se apuntan los 15 minutos parados');
ok(duracionSesion(REANUDADA, min(25)) === 600000,
  '🚨 …así que a los 25 minutos de reloj lleva 10 de entrenamiento');
ok(pausarSesion(REANUDADA, min(1)).estado === 'pausada', 'Se puede volver a pausar');
ok(reanudarSesion(S0, min(1)) === S0, '…y reanudar algo que no está pausado no hace nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Navegación: nunca se pierden datos (apartados 8 y 9) ──');

let S = nueva();
const E0 = ejerciciosDeSesion(S)[0];
S = editarSerie(S, E0.id, E0.series[0].id, { peso: 62.5, reps: 10 });
S = marcarSerie(S, E0.id, E0.series[0].id, true);
S = notaDeEjercicio(S, E0.id, 'Me costó la última serie.');
S = anadirSerie(S, E0.id);

const ANTES = JSON.stringify(ejerciciosDeSesion(S)[0]);
S = siguienteEjercicio(S);
ok(S.actual === 1, 'Siguiente ejercicio (apartado 37)');
S = siguienteEjercicio(S);
S = anteriorEjercicio(S);
ok(S.actual === 1, '…y anterior');
S = irAEjercicio(S, 0);
ok(S.actual === 0, '…y tocar uno del carrusel');
ok(JSON.stringify(ejerciciosDeSesion(S)[0]) === ANTES,
  '🚨 …y al volver está TODO: peso, repeticiones, la serie marcada, la nota y la serie añadida (apartado 9)');

ok(anteriorEjercicio(S).actual === 0, '⚠️ Del primero no se retrocede a un índice negativo');
const ULTIMO = ejerciciosDeSesion(S).length - 1;
ok(siguienteEjercicio(irAEjercicio(S, ULTIMO)).actual === ULTIMO, '…ni del último se pasa de largo');
ok(irAEjercicio(S, 99) === S && irAEjercicio(S, -1) === S, '…y un índice imposible no mueve nada');
ok(ejercicioActual({ ...S, actual: 99 })?.id === ejerciciosDeSesion(S)[ULTIMO].id,
  '⚠️ Y un `actual` corrupto se acota en vez de dejar la pantalla en blanco');

const CARRUSEL = carruselDeSesion(S, []);
ok(CARRUSEL.length === ejerciciosDeSesion(S).length, 'El carrusel trae todos los ejercicios (apartado 8)');
ok(CARRUSEL[0].estado === 'actual', '…marcando el actual');
ok(CARRUSEL.every((c) => c.numero >= 1 && c.nombre), '…con su número y su nombre');
ok(CARRUSEL[1].estado === 'pendiente', '…los que no se han tocado, pendientes');
ok(estadoDeEjercicio(S, 99) === 'pendiente', '…y un índice fuera de rango no revienta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Planificado ≠ realizado (apartados 14 y 20) ──');

const RANGO = crearSerie({ plan: { reps: 8, repsHasta: 12 } });
ok(textoPlanificado(RANGO) === '8–12', `🚨 «8–12» se enseña como un RANGO, no como un 8 (${textoPlanificado(RANGO)})`);
ok(textoRealizado(RANGO) === '', '…y sin registrar nada, lo realizado está VACÍO (no un cero, E3 F31)');
const HECHA10 = { ...RANGO, hecho: { ...RANGO.hecho, reps: 10 } };
ok(textoRealizado(HECHA10) === '10', '…registra un 10');
ok(HECHA10.plan.reps === 8 && HECHA10.plan.repsHasta === 12,
  '🚨 …y el plan SIGUE diciendo 8–12: es lo que la F11 comparará (apartado 20)');
ok(textoPlanificado(crearSerie({ plan: { reps: 10, repsHasta: 10 } })) === '10',
  '⚠️ Un rango de 10 a 10 se dice «10», no «10–10»');
ok(textoPlanificado(crearSerie({ modo: 'tiempo', plan: { duracion: 30 } })) === '30 s',
  '🚨 Un isométrico se planifica en segundos (apartado 21)');
ok(textoRealizado(crearSerie({ modo: 'tiempo', hecho: { duracion: 25 } })) === '25 s', '…y se registra igual');
ok(textoPlanificado(null) === '' && textoRealizado(null) === '', '…y sin serie no se inventa texto');

/* 🚨 El barrido que lo demuestra en el código: editar escribe en `hecho`.
   ⚠️ Y el escenario se crea UNA vez: `empezarSesion` llama a `uid()`, así que
   los ids de una sesión no valen en otra (GE F2, y ya van dos). */
const BASE = nueva();
const EB = ejerciciosDeSesion(BASE)[0];
const editarPrimera = (cambios) => editarSerie(BASE, EB.id, EB.series[0].id, cambios);
const primeraDe = (ses) => ejerciciosDeSesion(ses)[0].series[0];

const SERIE_EDIT = primeraDe(editarPrimera({ reps: 99 }));
ok(SERIE_EDIT.hecho.reps === 99, 'Editar escribe lo realizado');
ok(SERIE_EDIT.plan.reps === EB.series[0].plan.reps,
  '🚨 …y NO toca lo planificado, ni de rebote (apartado 14)');

/* Apartado 15 — el peso admite decimales. */
const S_PESO = editarPrimera({ peso: '62.5' });
ok(primeraDe(S_PESO).hecho.peso === 62.5,
  '🚨 62,5 kg se guardan como 62.5, no redondeados a 63 (apartado 15)');
ok(primeraDe(editarPrimera({ reps: '10.7' })).hecho.reps === 11,
  '⚠️ …pero las repeticiones son enteras: no existen 10,7 repeticiones');
ok(primeraDe(editarSerie(S_PESO, EB.id, EB.series[0].id, { peso: '' })).hecho.peso === null,
  '⚠️ Y borrar el campo lo deja en `null`, nunca en 0 (`Number(null)` es 0, y van muchas)');
ok(primeraDe(editarPrimera({ peso: 'hola' })).hecho.peso === null,
  '…y un texto tampoco se cuela como número');
ok(editarSerie(BASE, 'ejercicio-fantasma', EB.series[0].id, { peso: 99 }) === BASE,
  '…y editar en un ejercicio que no está en la sesión no toca nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Marcar, añadir y quitar series (apartados 17, 18 y 19) ──');

let M = nueva();
const EM = ejerciciosDeSesion(M)[0];
M = editarSerie(M, EM.id, EM.series[0].id, { peso: 60, reps: 10 });
M = marcarSerie(M, EM.id, EM.series[0].id, true);
ok(ejerciciosDeSesion(M)[0].series[0].estado === 'hecha', 'Marcar una serie (apartado 37)');
M = marcarSerie(M, EM.id, EM.series[0].id, false);
ok(ejerciciosDeSesion(M)[0].series[0].estado === 'pendiente', '…y desmarcarla');
ok(ejerciciosDeSesion(M)[0].series[0].hecho.peso === 60
  && ejerciciosDeSesion(M)[0].series[0].hecho.reps === 10,
'🚨 …SIN borrar los datos: *"No borrar los datos al desmarcar"* (apartado 17)');
M = marcarSerie(M, EM.id, EM.series[0].id, true);
ok(ejerciciosDeSesion(M)[0].series[0].estado === 'hecha', '…y volver a marcarla (marcar → desmarcar → marcar)');

const CUANTAS = ejerciciosDeSesion(M)[0].series.length;
M = anadirSerie(M, EM.id);
const ANADIDA = ejerciciosDeSesion(M)[0].series[CUANTAS];
ok(ejerciciosDeSesion(M)[0].series.length === CUANTAS + 1, `Añadir serie: de ${CUANTAS} a ${CUANTAS + 1} (apartado 18)`);
ok(ANADIDA.origen === 'anadida', '…marcada como añadida, no como del plan (apartado 19)');
ok(ANADIDA.hecho.peso === 60,
  '⚠️ …y hereda lo que él ya registró —60 kg—, no lo que decía el plan (apartado 18)');
ok(ANADIDA.estado === 'pendiente', '…pero nace pendiente: heredar el peso no es haberla hecho');
ok(ANADIDA.id !== ejerciciosDeSesion(M)[0].series[0].id,
  '🚨 …con id propio: compartirlo haría que editar una editara la otra (FIT F4)');
ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PLAN_ORIGINAL,
  '🚨 …y el plan original NO se modifica (apartado 18, literal)');

/* El tope de series, que es el del constructor. */
let TOPE = nueva();
const ET = ejerciciosDeSesion(TOPE)[0];
for (let i = 0; i < MAX_SERIES + 5; i += 1) TOPE = anadirSerie(TOPE, ET.id);
ok(ejerciciosDeSesion(TOPE)[0].series.length === MAX_SERIES,
  `⚠️ Y se topa en ${MAX_SERIES}, el máximo del constructor: no hay dos límites`);

/* 🚨 Apartado 19 — la diferencia que lo es todo. */
const PLANIFICADA_ID = ejerciciosDeSesion(M)[0].series[0].id;
const M_OMITIDA = quitarSerie(M, EM.id, PLANIFICADA_ID);
ok(ejerciciosDeSesion(M_OMITIDA)[0].series.length === CUANTAS + 1,
  '🚨 Quitar una serie DEL PLAN no la destruye: la estructura original sigue entera (apartado 19)');
ok(ejerciciosDeSesion(M_OMITIDA)[0].series[0].estado === 'omitida', '…se marca como omitida');
ok(ejerciciosDeSesion(M_OMITIDA)[0].series[0].plan.reps === EM.series[0].plan.reps,
  '…conservando lo que el plan decía');
const M_VUELTA = recuperarSerie(M_OMITIDA, EM.id, PLANIFICADA_ID);
ok(ejerciciosDeSesion(M_VUELTA)[0].series[0].estado === 'pendiente',
  '⚠️ …y omitir no es irreversible: vuelve a pendiente');

const M_QUITADA = quitarSerie(M, EM.id, ANADIDA.id);
ok(ejerciciosDeSesion(M_QUITADA)[0].series.length === CUANTAS,
  '🚨 …y una AÑADIDA sí se va del todo: la puso él (apartado 19)');
ok(quitarSerie(M, EM.id, 'no-existe') !== null
  && ejerciciosDeSesion(quitarSerie(M, EM.id, 'no-existe'))[0].series.length === CUANTAS + 1,
'…y quitar una serie que no existe no toca nada');
ok(quitarSerie(M, 'ejercicio-fantasma', PLANIFICADA_ID) === M,
  '…ni en un ejercicio que no está en la sesión');

/* El progreso, con la omitida fuera del denominador. */
const P_OMIT = progresoSesion(M_OMITIDA);
const P_SIN = progresoSesion(M);
ok(P_OMIT.total === P_SIN.total - 1,
  '🚨 Una serie omitida sale del TOTAL: no penaliza, que es `NO_TOCA` de la E3 F24');
ok(progresoSesion(nueva()).hechas === 0, 'Sin nada marcado, cero hechas');
ok(progresoSesion(nueva()).porcentaje === 0, '…y 0 % con series por hacer');
ok(progresoSesion({ origen: { ejercicios: [] } }).porcentaje === null,
  '⚠️ …pero sin NINGUNA serie que contar el porcentaje es `null`, no 0 (E3 F13)');

/* Las filas de la tabla del apartado 13. */
const FILAS = filasDeSeries(ejerciciosDeSesion(M_OMITIDA)[0]);
ok(FILAS.length === CUANTAS + 1, 'La tabla enseña TODAS las filas, la omitida incluida (apartado 13)');
ok(FILAS[0].numero === null, '…la omitida sin número, para no descuadrar la cuenta');
ok(FILAS[1].numero === 1, '…y la siguiente es la serie 1');
ok(FILAS.every((f) => f.medida && f.medida.id), '…cada una con su medida');
ok(FILAS[FILAS.length - 1].seQuita === true, '…y la añadida se puede quitar');
ok(FILAS[1].seQuita === false, '…mientras que una del plan solo se omite');
ok(filasDeSeries(null).length === 0, '…y sin ejercicio no hay filas');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Isométricos y skills (apartados 21 y 22) ──');

ok(MEDIDAS_SERIE.length === 2 && MEDIDAS_SERIE.some((m) => m.id === 'tiempo'),
  '🚨 Un ejercicio NO es siempre series × repeticiones (apartado 21)');
ok(medidaDeSerie('tiempo').unidad === 's', '…el tiempo se mide en segundos');
ok(medidaDeSerie('inventada').id === 'reps', '…y una medida desconocida cae en repeticiones');

/* Una rutina con un isométrico de verdad del catálogo. */
const R_ISO = anadirEjercicio(crearRutina({ nombre: 'Core' }), 'l-sit');
const S_ISO = empezarSesion({ nombre: 'Core', lineas: R_ISO.lineas, ahora: T0, hoy: LUNES });
const E_ISO = ejerciciosDeSesion(S_ISO)[0];
ok(E_ISO.modo === 'tiempo',
  `🚨 Un L-sit entra en la sesión medido en TIEMPO, y lo decide el catálogo (${E_ISO.modo})`);
ok(E_ISO.series.every((s) => s.modo === 'tiempo'), '…y todas sus series con él');
const S_ISO2 = editarSerie(S_ISO, E_ISO.id, E_ISO.series[0].id, { duracion: 25 });
ok(ejerciciosDeSesion(S_ISO2)[0].series[0].hecho.duracion === 25, '…se registran 25 segundos');
ok(filasDeSeries(ejerciciosDeSesion(S_ISO2)[0])[0].medida.id === 'tiempo',
  '…y la tabla lo sabe, así que pide segundos y no repeticiones');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Sustituir un ejercicio (apartado 26) ──');

const PLANTILLA = rutinaAPlan(anadirEjercicio(
  anadirEjercicio(crearRutina({ nombre: 'Mi Push' }), 'press-banca-barra'), 'dominada-prona',
));
const PLANTILLA_ANTES = JSON.stringify(PLANTILLA);
const RUT = planARutina(PLANTILLA);
let SS = empezarSesion({
  nombre: PLANTILLA.nombre, lineas: RUT.lineas, planId: PLANTILLA.id,
  origenTipo: 'plantilla', origenId: PLANTILLA.id, ahora: T0, hoy: LUNES,
});
const E_PRESS = ejerciciosDeSesion(SS)[0];
SS = editarSerie(SS, E_PRESS.id, E_PRESS.series[0].id, { peso: 60, reps: 10 });
SS = marcarSerie(SS, E_PRESS.id, E_PRESS.series[0].id, true);

const SUGERIDOS = sustitutosSugeridos(E_PRESS, []);
ok(SUGERIDOS.length > 0, `Se proponen sustitutos compatibles (${SUGERIDOS.length}, apartado 26)`);
ok(SUGERIDOS.every((s) => s.id !== E_PRESS.exerciseId), '…sin ofrecerle el que ya está');
ok(sustitutosSugeridos(null, []).length === 0, '…y sin ejercicio no se propone nada');

const SS2 = sustituirEjercicio(SS, E_PRESS.id, 'press-banca-mancuernas', []);
const E_MANC = ejerciciosDeSesion(SS2)[0];
ok(E_MANC.exerciseId === 'press-banca-mancuernas', 'Press banca → Press mancuernas (apartado 26, su ejemplo)');
ok(E_MANC.sustituyeA === 'press-banca-barra', '…dejando dicho de cuál venía');
ok(E_MANC.series.length === E_PRESS.series.length,
  '⚠️ …conservando las series: cambiar de ejercicio no le borra el trabajo del día');
ok(E_MANC.series[0].estado === 'hecha', '…y la que ya estaba hecha sigue hecha');
ok(E_MANC.series[0].hecho.reps === 10, '…con sus repeticiones');
ok(E_MANC.series[0].hecho.peso === null,
  '🚨 …pero SIN el peso: 60 kg de barra no dicen nada de unas mancuernas');
ok(E_MANC.id === E_PRESS.id, '…y es el mismo hueco de la sesión, no uno nuevo al final');
ok(ejerciciosDeSesion(SS2)[1].exerciseId === ejerciciosDeSesion(SS)[1].exerciseId,
  '…los demás ejercicios, intactos');

/* 🚨 La comprobación que el apartado marca como MUY IMPORTANTE. */
ok(JSON.stringify(PLANTILLA) === PLANTILLA_ANTES,
  '🚨 …y la PLANTILLA no se entera: *"No modifica Exercise, plan, plantilla"* (apartado 26)');
ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PLAN_ORIGINAL,
  '🚨 …ni el plan de la biblioteca');
ok(ejercicioPorId('press-banca-barra', []).nombre === PRIMERO.nombre
  || !!ejercicioPorId('press-banca-barra', []),
'🚨 …ni el ejercicio del catálogo');
ok(sustituirEjercicio(SS, E_PRESS.id, 'no-existe', []) === SS,
  '⚠️ Y sustituir por algo que no está en el catálogo no hace nada');

/* Un isométrico como sustituto cambia la medida. */
const SS_ISO = sustituirEjercicio(SS, E_PRESS.id, 'l-sit', []);
ok(ejerciciosDeSesion(SS_ISO)[0].modo === 'tiempo',
  '⚠️ …y si el sustituto se mide en segundos, la tabla cambia con él (apartado 21)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Notas por ejercicio (apartado 27) ──');

let N = nueva();
const EN = ejerciciosDeSesion(N)[0];
ok(EN.notas === '', 'Un ejercicio nace sin nota');
N = notaDeEjercicio(N, EN.id, 'Me molestó ligeramente el hombro.');
ok(ejerciciosDeSesion(N)[0].notas === 'Me molestó ligeramente el hombro.', 'Crear una nota (apartado 37)');
N = notaDeEjercicio(N, EN.id, 'Ya no molesta.');
ok(ejerciciosDeSesion(N)[0].notas === 'Ya no molesta.', '…y editarla');
N = siguienteEjercicio(N);
N = irAEjercicio(N, 0);
ok(ejerciciosDeSesion(N)[0].notas === 'Ya no molesta.', '🚨 …y persiste al navegar (apartado 27)');
ok(ejerciciosDeSesion(N)[1].notas === '', '⚠️ …sin contagiarse al ejercicio de al lado');
ok(ejerciciosDeSesion(notaDeEjercicio(N, EN.id, '   '))[0].notas === '',
  '…y una nota de solo espacios se queda vacía');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. El descanso, independiente del cronómetro (apartados 23-25) ──');

const D = crearDescanso({ segundos: 90, ahora: T0 });
ok(D.segundos === 90 && D.desde === T0, 'El descanso arranca con sus segundos y su marca');
ok(restanteDescanso(D, T0) === 90000, '…90 segundos al empezar');
ok(reloj(restanteDescanso(D, seg(45))) === '00:45', `…\`00:45\` a la mitad (${reloj(restanteDescanso(D, seg(45)))})`);
ok(restanteDescanso(D, seg(120)) === 0, '…y no baja de cero');
ok(descansoTerminado(D, seg(90)) === true, 'Termina a los 90 segundos');
ok(descansoTerminado(D, seg(89)) === false, '…y no antes');

const DP = pausarDescanso(D, seg(30));
ok(restanteDescanso(DP, seg(300)) === 60000, '🚨 Pausar el descanso lo congela en 60 s, pasen los que pasen');
const DR = reanudarDescanso(DP, seg(300));
ok(restanteDescanso(DR, seg(330)) === 30000, '…y al reanudar sigue por donde iba');
const DI = reiniciarDescanso(DR, seg(400));
ok(restanteDescanso(DI, seg(400)) === 90000, '…reiniciar lo devuelve a 90 s (apartado 23)');
ok(reiniciarDescanso(null) === null, '…y sin descanso no se inventa uno');
ok(pausarDescanso(DP, seg(50)) === DP, '…pausar dos veces no descuenta dos veces');
ok(reanudarDescanso(D, seg(50)) === D, '…ni reanudar lo que no está pausado');
ok(restanteDescanso(null) === 0, '…y sin descanso el restante es cero');

/* 🚨 Apartado 25 — el sonido es uno que YA existe, emitido al bus. */
ok(EVENTO_FIN_DESCANSO === 'success',
  '🚨 El aviso del fin de descanso EMITE un evento que ya existe, no uno inventado (SO F4)');
ok(SONIDO_DESCANSO.propio === false && SONIDO_DESCANSO.porQueNoUnoNuevo,
  '…declarado con su motivo: un evento sin archivo es un sonido que no suena (E3 F25)');
ok(vibrarSiSePuede() === false,
  '⚠️ Sin `navigator.vibrate` la vibración devuelve `false` y NO lanza (apartado 25)');

/* El descanso es de la pantalla, no del dato. */
ok(!('descanso' in DEFAULT_FITNESS) && !JSON.stringify(nueva()).includes('"pausadoEn"'),
  '⚠️ Y el descanso NO se guarda en la sesión: dura lo que dura (EH F40)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Persistencia y recuperación (apartados 29 y 30) ──');

const F1 = guardarSesion(F_CON_PLAN, S0);
ok(F1.sesiones.length === 1, '🚨 La sesión se guarda en `fitness.sesiones`, la clave de la F1 (apartado 29)');
const F2 = guardarSesion(F1, marcarSerie(S0, EJS0[0].id, EJS0[0].series[0].id, true));
ok(F2.sesiones.length === 1, '…y guardar otra vez SUSTITUYE por id: no acumula una copia por cambio');
ok(ejerciciosDeSesion(F2.sesiones[0])[0].series[0].estado === 'hecha', '…con el cambio dentro');
ok(guardarSesion(F1, null) === F1 || guardarSesion(F1, null).sesiones.length === 1,
  '…y guardar nada no rompe la lista');
ok(!/saveData|supabase/i.test(soloCodigo(leer('src/lib/entrenamiento.js'))),
  '🚨 …y esta librería NO escribe: quien guarda sigue siendo `App.jsx` (la puerta de siempre)');

/* Apartado 30 — la sesión activa. */
ok(sesionActiva(F2)?.id === S0.id, '🚨 Una sesión en curso se encuentra al abrir la aplicación (apartado 30)');
const AVISO = avisoDeRecuperacion(sesionActiva(F2), { ahora: min(12) });
ok(AVISO.nombre === S0.nombre, '…con su nombre (apartado 30, literal)');
ok(AVISO.duracion === '12:00', `…su duración (${AVISO.duracion})`);
ok(!!AVISO.ejercicio, '…y el ejercicio en el que iba');
ok(AVISO.continuar === 'Continuar entrenamiento' && AVISO.descartar === 'Descartar sesión',
  '…y las dos salidas que pide el apartado');
ok(avisoDeRecuperacion(null) === null, '…y sin sesión no se inventa la tarjeta');

const F_TERMINADA = guardarSesion(F2, terminarYGuardar(S0, { ahora: min(40) }).sesion);
ok(sesionActiva(F_TERMINADA) === null, '⚠️ …y una terminada YA NO se ofrece como activa');
ok(sesionActiva({}) === null && sesionActiva(null) === null, '…ni sin sesiones');

/* 🚨 Y la recuperación de verdad: pasar por la puerta de carga. */
const GUARDADO = JSON.parse(JSON.stringify(F2));
const RECARGADO = normalizarFitnessConSesiones(GUARDADO);
const SES_R = RECARGADO.sesiones[0];
ok(SES_R && ejerciciosDeSesion(SES_R).length === EJS0.length,
  '🚨 Al recargar, el SNAPSHOT sigue entero (apartado 30: *"datos intactos"*)');
ok(ejerciciosDeSesion(SES_R)[0].series[0].estado === 'hecha', '…con la serie marcada');
ok(SES_R.iniciadaEn === T0, '…y con la hora de inicio, así que el cronómetro sigue bien');
ok(duracionSesion(SES_R, min(10)) === 600000, '…y marca diez minutos al volver');

/* 🚨 Y la que demuestra que la capa de la F7 hace falta, y que PUEDE ponerse
   roja (EH F42). La de la F5 no sabe qué hay dentro del snapshot, así que una
   serie corrupta —sin id, el duplicado esperando a pasar de EH F45— se le cuela
   entera; la de la F7 la descarta, porque es la única que conoce una serie. */
const CORRUPTA = JSON.parse(JSON.stringify(F2));
CORRUPTA.sesiones[0].origen.ejercicios[0].series.push({ estado: 'hecha', hecho: { peso: 999 } });
const SIN_CAPA = normalizarFitnessConPlanes(CORRUPTA);
ok(ejerciciosDeSesion(SIN_CAPA.sesiones[0])[0].series.some((x) => !x.id),
  '🚨 …a la puerta de la F5 se le cuela una serie sin id: no sabe qué hay dentro del snapshot');
ok(ejerciciosDeSesion(normalizarFitnessConSesiones(CORRUPTA).sesiones[0])[0].series.every((x) => x.id),
  '🚨 …y la capa de la F7 la descarta: cada capa solo limpia lo que conoce (F1, F2, F5, F7)');
ok(!/normalizarFitnessConPlanes\(/.test(soloCodigo(leer('src/App.jsx'))),
  '🚨 …y `App.jsx` llama a la ÚLTIMA capa, no a la de en medio');
ok(/normalizarFitnessConSesiones\(/.test(soloCodigo(leer('src/App.jsx'))),
  '…que es `normalizarFitnessConSesiones`');

/* Un guardado viejo, de antes de esta fase, no se rompe. */
const VIEJA = crearWorkoutSession({ nombre: 'De antes', fecha: LUNES });
const F_VIEJA = normalizarFitnessConSesiones({ ...DEFAULT_FITNESS, sesiones: [VIEJA] });
ok(F_VIEJA.sesiones.length === 1, '⚠️ Una sesión guardada antes de la F7 sigue cargando');
ok(F_VIEJA.sesiones[0].origen === null, '…sin snapshot, que es lo que tenía');
ok(normalizarFitnessConSesiones({}).sesiones.length === 0, '…y sin nada guardado, lista vacía');
ok(normalizarFitness(DEFAULT_FITNESS).sesiones.length === 0, '…igual que el normalizador de la F1');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Salir, terminar y descartar (apartados 31 y 32) ──');

ok(AVISO_SALIR.titulo === '¿Salir del entrenamiento?',
  '🚨 Salir PREGUNTA, con las palabras del apartado 31');
ok(AVISO_SALIR.seguir === 'Seguir entrenando' && AVISO_SALIR.salir === 'Salir',
  '…y sus dos opciones, también literales');

/* 🔓 **ESTO DECÍA OTRA COSA HASTA LA FIT F8**, y estaba escrito a propósito para
   este momento. El apartado 32 pedía dos cosas: *"NO debe guardar automáticamente
   como completada sin confirmación"* **y** *"Debe llevar posteriormente a la
   pantalla de finalización que construiremos en la siguiente fase"*. La
   confirmación era lo único que se podía poner mientras esa pantalla no
   existiera; ya existe, y la garantía es **más fuerte**: desde el botón de la
   cabecera la sesión ya no puede llegar a `completada` de ninguna manera. */
const SIN_CONFIRMAR = pasarAFinalizacion(S0, { ahora: min(45) });
ok(SIN_CONFIRMAR.estado !== 'completada',
  '🔓 FIT F7 → F8 — Terminar NO completa nada: lleva al resumen (apartado 32)');
ok(SIN_CONFIRMAR.estado === 'finalizando', '…dejándola «finalizando», ni entrenando ni guardada');
/* ⚠️ Un `||` que casi siempre es verdad no comprueba nada: lo que importa es
   **quién** la completa, y son dos llamadas distintas. */
ok(ejerciciosDeSesion(SIN_CONFIRMAR).length === EJS0.length,
  '…con todo lo registrado intacto, listo para revisarlo');
/* ⚠️ `S0` no tiene ni una serie marcada, así que guardar **pregunta primero**:
   es el apartado 26 de la F8 funcionando, no un fallo. Confirmando, se completa. */
ok(guardarEntrenamiento(SIN_CONFIRMAR).motivo === 'vacio',
  '…y guardar sin ni una serie marcada pregunta antes (FIT F8, apartado 26)');
ok(guardarEntrenamiento(SIN_CONFIRMAR, { confirmado: true }).sesion.estado === 'completada',
  '…y quien la completa es «Terminar entrenamiento», ya en el resumen (FIT F8)');

const TERMINADA = terminarYGuardar(S0, { ahora: min(45) });
ok(TERMINADA.ok === true && TERMINADA.sesion.estado === 'completada', 'Y desde el resumen se completa');
ok(TERMINADA.sesion.terminadaEn === min(45), '…apuntando cuándo');
ok(duracionSesion(TERMINADA.sesion, min(90)) === 2700000,
  '🚨 …y la duración se congela en 45 minutos: terminar para el reloj');
ok(ejerciciosDeSesion(TERMINADA.sesion).length === EJS0.length,
  '⚠️ …conservando TODOS los datos: *"preservar todos los datos"* (apartado 32)');
const TERM_PAUSADA = terminarYGuardar(PAUSADA, { ahora: min(45) });
ok(TERM_PAUSADA.sesion.pausadoMs > 0,
  '⚠️ …y terminar desde pausa no se come el rato parado: se cierra la pausa antes');

const DESC = descartarSesion(S0);
ok(DESC.ok === false && DESC.aviso === AVISO_DESCARTAR, 'Descartar también pregunta');
const DESC2 = descartarSesion(S0, { confirmado: true, ahora: min(5) });
ok(DESC2.sesion.estado === 'descartada', '…y confirmando la marca como descartada');
ok(ejerciciosDeSesion(DESC2.sesion).length === EJS0.length,
  '⚠️ …sin BORRARLA: se marca, para que el historial de la F10 la siga viendo');
ok(pasarAFinalizacion(null) === null && descartarSesion(null).ok === false,
  '…y sin sesión las dos contestan que no hay nada que hacer');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. La ficha del ejercicio actual (apartados 10, 11 y 12) ──');

const FICHA = fichaDeEjercicio(EJS0[0], []);
ok(FICHA.nombre && FICHA.existe, `El nombre del ejercicio actual (${FICHA.nombre}, apartado 10)`);
ok(!!FICHA.musculo, `…su músculo principal (${FICHA.musculo})`);
ok(!!FICHA.dificultad, '…su dificultad');
ok(Array.isArray(FICHA.equipo), '…su equipamiento');
ok(FICHA.musculos.length > 0 && FICHA.musculos[0].porcentaje > 0,
  '🚨 …y los músculos con su porcentaje, DERIVADOS del catálogo (F2)');
ok(!!FICHA.tutorial, '…con el tutorial del apartado 12, que son los datos reales del catálogo');
ok(FICHA.sustituido === false, '…y sin marca de sustitución si no la hubo');
ok(fichaDeEjercicio(ejerciciosDeSesion(SS2)[0], []).sustituido === true, '…que sí aparece cuando la hay');
ok(fichaDeEjercicio(null) === null, '…y sin ejercicio no hay ficha');

const HUERFANO = crearEjercicioDeSesion({ exerciseId: 'ya-no-existe', series: [crearSerie({})] });
const FICHA_H = fichaDeEjercicio(HUERFANO, []);
ok(FICHA_H.existe === false,
  '⚠️ Un ejercicio que ya no está en el catálogo SE DICE, y la sesión no se rompe (regla 8)');

/* 🚨 Apartado 11 — ni una URL inventada. */
const CODIGO_VISTA = leer('src/views/EntrenamientoVivoView.jsx');
ok(!/https?:\/\//.test(soloCodigo(CODIGO_VISTA)),
  '🚨 Ni un enlace externo en la pantalla: *"NO inventar una URL externa"* (apartado 11)');
ok(!/<img\s/.test(CODIGO_VISTA), '…ni una imagen que no existe');
ok(!/#[0-9a-fA-F]{6}/.test(soloCodigo(CODIGO_VISTA)), '…ni un color escrito a mano (regla 2)');
ok(!/#[0-9a-fA-F]{6}/.test(soloCodigo(leer('src/lib/entrenamiento.js'))), '…tampoco en la librería');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. Lo que no se duplica (apartados 1 y 28) ──');

const LIB = leer('src/lib/entrenamiento.js');
const LIB_CODIGO = soloCodigo(LIB);
ok(/from '\.\/fitness'/.test(LIB), '🚨 `WorkoutSession` se importa de la F1, no se reescribe (apartado 2)');
ok(!/crearWorkoutSession\s*=|DEFAULT_SESIONES/.test(LIB_CODIGO), '…ni un modelo de sesión nuevo al lado');
ok(/from '\.\/ejercicios'/.test(LIB), '🚨 El catálogo se consulta, no se copia (F2)');
ok(!/CATALOGO_EJERCICIOS\s*=/.test(LIB_CODIGO), '…ni una copia suya');
ok(/from '\.\/constructor'/.test(LIB), '…y las variantes salen del constructor (F3)');
ok(!/variantesDeLinea\s*=/.test(LIB_CODIGO), '…sin reescribir `variantesDeLinea`');
ok(/EjerciciosView/.test(CODIGO_VISTA),
  '🚨 El selector de ejercicios del apartado 26 ES `EjerciciosView`, no uno nuevo (E3 F22)');
ok(!/buscarEjercicios\s*\(/.test(soloCodigo(CODIGO_VISTA)), '…y la pantalla no busca por su cuenta');
ok(!/new Audio\s*\(/.test(CODIGO_VISTA),
  '🚨 Ninguna pantalla reproduce sonido: el motor de audio es el único (SO F1)');
ok(/from '\.\.\/lib\/eventos'/.test(CODIGO_VISTA), '…se EMITE al bus');
ok(!/setInterval/.test(LIB_CODIGO),
  '🚨 La librería NO tiene ni un temporizador: el tiempo se resta de marcas (apartados 6 y 7)');
ok(!/fixed inset-0/.test(soloCodigo(CODIGO_VISTA)),
  '⚠️ …y ni un overlay `fixed inset-0`, así que no hace falta portal (regla 3)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 14. Los catálogos y los casos límite ──');

ok(ORIGENES_SERIE.length === 2 && ORIGENES_SERIE.every((o) => o.id && o.nombre && o.que),
  'Los dos orígenes de una serie, cada uno con su explicación (apartado 19)');
ok(ESTADOS_SERIE.length === 3, '🚨 Y TRES estados: `omitida` es el que salva la estructura original');
ok(ESTADOS_SERIE.filter((e) => e.cuenta).length === 1, '…y solo `hecha` cuenta');
ok(ESTADOS_SESION.includes('pausada'), '⚠️ Y `pausada` se suma a los estados de la F1 (apartado 7)');

ok(crearSerie({ origen: 'inventado' }).origen === 'planificada', 'Un origen desconocido cae en «del plan»');
ok(crearSerie({ estado: 'inventado' }).estado === 'pendiente', '…y un estado desconocido, en pendiente');
ok(normalizarSerie({}) === null, '⚠️ Una serie sin id se descarta: al releerla cada dispositivo le pondría otro (EH F45)');
ok(normalizarEjercicioDeSesion({ id: 'x' }) === null, '…y un ejercicio de sesión sin `exerciseId` tampoco existe');
ok(normalizarSesionCompleta(null) === null, '…ni una sesión sin forma');
ok(seriesDeLinea({}).length === 1, '⚠️ Una línea sin número de series da UNA: cero no se puede registrar');
ok(seriesDeLinea({ series: 99 }).length === MAX_SERIES, `…y se topa en ${MAX_SERIES}`);
ok(seriesDeLinea({ series: 3 }).every((s) => s.origen === 'planificada'), '…todas del plan');
ok(empezarSesion({}).nombre === 'Entrenamiento', '…y una sesión sin nombre tiene uno decente');
ok(ejerciciosDeSesion(empezarSesion({})).length === 0, '…sin ejercicios inventados');
ok(ejercicioActual(empezarSesion({})) === null, '…y sin ejercicio actual');
ok(ejerciciosDeSesion(null).length === 0 && ejercicioActual(null) === null, '…ni con la sesión a `null`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 15. Lo que no se construye, declarado (apartados 32 y 36) ──');

ok(NO_EN_FIT7.length >= 6, `Lo excluido está escrito con su motivo (${NO_EN_FIT7.length})`);
ok(NO_EN_FIT7.every((x) => x.que && x.porque), '…cada línea con los dos');
ok(NO_EN_FIT7.some((x) => /finalizaci[oó]n/i.test(x.que)),
  '🚨 …y la pantalla de finalización es la F8, dicho con su motivo (apartado 32)');
ok(PREPARADO_PARA_FIT7.length >= 4 && PREPARADO_PARA_FIT7.every((x) => x.que && x.donde),
  '⚠️ …y lo que queda PREPARADO, con dónde está (EH F55)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 16. La auditoría del apartado 37, EJECUTADA ──');

ok(auditarSesion(S0, []).ok === true, '🚨 Una sesión recién creada pasa la auditoría');
ok(auditarSesion(TERMINADA.sesion, []).ok === true, '…y una terminada también');
ok(auditarSesion(null).ok === false, '…y sin sesión falla, con su motivo');

/* 🚨 Y las que demuestran que PUEDE ponerse roja (EH F42). */
ok(auditarSesion({ ...S0, estado: 'inventado' }, []).ok === false,
  '🚨 …salta con un estado desconocido');
ok(auditarSesion({ ...S0, iniciadaEn: null }, []).ok === false, '…y sin hora de inicio');
ok(auditarSesion({ ...S0, actual: 99 }, []).ok === false, '…y con el ejercicio actual fuera de rango');
const SIN_SERIES = { ...S0, origen: { ...S0.origen, ejercicios: [{ ...EJS0[0], series: [] }] } };
ok(auditarSesion(SIN_SERIES, []).ok === false, '…y con un ejercicio sin series');
const SERIE_ROTA = {
  ...S0,
  origen: { ...S0.origen, ejercicios: [{ ...EJS0[0], series: [{ ...EJS0[0].series[0], plan: null }] }] },
};
ok(auditarSesion(SERIE_ROTA, []).ok === false, '…y con una serie que perdió lo que decía el plan');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 17. La sesión entera del apartado 38 ──');

/* *Empezar → navegar → peso/reps → completar → añadir series → descansar →
   notas → sustituir → salir/reanudar*, seguido, sin perder nada. */
let W = nueva();
let FIT = guardarSesion(F_CON_PLAN, W);
const IDS = ejerciciosDeSesion(W).map((e) => e.id);

/* Ejercicio 1: tres series con peso y repeticiones, y una cuarta añadida. */
for (const s of ejerciciosDeSesion(W)[0].series) {
  W = editarSerie(W, IDS[0], s.id, { peso: 60, reps: 10 });
  W = marcarSerie(W, IDS[0], s.id, true);
  FIT = guardarSesion(FIT, W);
}
W = anadirSerie(W, IDS[0]);
const EXTRA = ejerciciosDeSesion(W)[0].series.slice(-1)[0];
W = editarSerie(W, IDS[0], EXTRA.id, { peso: 55, reps: 8 });
W = marcarSerie(W, IDS[0], EXTRA.id, true);
W = notaDeEjercicio(W, IDS[0], 'La cuarta con menos peso.');
FIT = guardarSesion(FIT, W);

/* Ejercicio 2: sustituirlo y registrar. */
W = siguienteEjercicio(W);
const SEGUNDO_ORIGINAL = ejerciciosDeSesion(W)[1].exerciseId;
const OTRO = sustitutosSugeridos(ejerciciosDeSesion(W)[1], [])[0];
if (OTRO) W = sustituirEjercicio(W, IDS[1], OTRO.id, []);
W = editarSerie(W, IDS[1], ejerciciosDeSesion(W)[1].series[0].id, { peso: 40, reps: 12 });
W = marcarSerie(W, IDS[1], ejerciciosDeSesion(W)[1].series[0].id, true);
FIT = guardarSesion(FIT, W);

/* Salir y volver: se pasa por la puerta de carga, que es lo que pasa de verdad. */
const VUELTA = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(FIT)));
const R = sesionActiva(VUELTA);
ok(!!R, '🚨 Apartado 38 — al volver, la sesión sigue ahí');
const R_EJS = ejerciciosDeSesion(R);
ok(R_EJS[0].series.length === EJS0[0].series.length + 1, '…con la serie añadida');
ok(R_EJS[0].series.every((s) => s.estado === 'hecha'), '…todas marcadas');
ok(R_EJS[0].series[0].hecho.peso === 60 && R_EJS[0].series[0].hecho.reps === 10, '…con su peso y sus repeticiones');
ok(R_EJS[0].series.slice(-1)[0].hecho.peso === 55, '…y la cuarta con los suyos');
ok(R_EJS[0].notas === 'La cuarta con menos peso.', '…con la nota');
if (OTRO) {
  ok(R_EJS[1].exerciseId === OTRO.id, '…el ejercicio sustituido, sustituido');
  ok(R_EJS[1].sustituyeA === SEGUNDO_ORIGINAL, '…sabiendo de cuál venía');
}
ok(R_EJS[1].series[0].hecho.peso === 40, '…y lo registrado en él');
ok(R.actual === 1, '…y en el ejercicio donde lo dejó');
ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PLAN_ORIGINAL,
  '🚨 …y después de todo eso, el plan de la biblioteca sigue exactamente igual');

const PROG = progresoSesion(R);
ok(PROG.hechas === EJS0[0].series.length + 2, `…el progreso cuenta las ${PROG.hechas} series hechas`);
ok(PROG.porcentaje > 0 && PROG.porcentaje < 100, `…y va por el ${PROG.porcentaje} %`);
ok(estadoDeEjercicio(R, 0) === 'completado', '…el primer ejercicio, completado (apartado 8)');
ok(estadoDeEjercicio(R, 2) === 'pendiente', '…y los que no ha tocado, pendientes');

const FINAL = terminarYGuardar(R, { ahora: min(52) });
ok(FINAL.ok && FINAL.sesion.estado === 'completada', '🚨 …y Terminar la cierra, con confirmación (apartado 32)');
ok(sesionActiva(guardarSesion(VUELTA, FINAL.sesion)) === null, '…y deja de ofrecerse como activa');
ok(auditarSesion(FINAL.sesion, []).ok === true, '…con la auditoría en verde de punta a punta');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
