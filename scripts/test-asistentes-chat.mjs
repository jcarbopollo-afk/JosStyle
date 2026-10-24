/* Fase 2 · Chatbots — los cinco asistentes del primer lote, su privacidad y lo que no pueden hacer.
   ═══════════════════════════════════════════════════════════════════════════
   Especificación: docs/15_asistentes/ESPECIFICACION_CHATBOTS.md §8.1, §9, §11 y §16.2.

   🚨 Las cifras esperadas se calculan **con las mismas funciones del motor** sobre el mismo
   escenario (§6.5): si un motor cambia lo que devuelve, esto se pone rojo el mismo día. Y el día
   está fijado (viernes 23 de octubre de 2026): nada depende de cuándo se ejecute. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { responderMensaje, nuevaConversacion, textoDeRespuesta, incumpleHonestidad, normalizarMensaje, esOrdenDeEscritura, textosDeOpciones } from '../src/lib/motorConversacion.js';
import { ASISTENTES, asistenteDeModulo, datosParaAsistente, DOMINIOS_AJENOS, MATRIZ_CANDIDATOS, CLAVES_QUE_NINGUN_ASISTENTE_LEE } from '../src/lib/asistentesModulos.js';
import { ASISTENTE_SUENO, nochesDeSueno, minutosDeLaNoche } from '../src/lib/asistenteSueno.js';
import { ASISTENTE_FITNESS } from '../src/lib/asistenteFitness.js';
import { ASISTENTE_NUTRICION, mediaDelRangoNutricion } from '../src/lib/asistenteNutricion.js';
import { ASISTENTE_ESTUDIOS } from '../src/lib/asistenteEstudios.js';
import { ASISTENTE_PRODUCTIVIDAD, seguidos } from '../src/lib/asistenteProductividad.js';
import { textoDuracion as textoDuracionPantalla, mediaDeMinutos, duracionDe, crearRegistroSueno } from '../src/lib/sueno.js';
import { formatearDuracionLarga } from '../src/lib/pomodoro.js';
import { empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { crearRutina as crearRutinaFitness, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { progresoDeEjercicio } from '../src/lib/progresion.js';
import { usarPlan, CATALOGO_PLANES } from '../src/lib/planes.js';
import { tuPlan } from '../src/lib/tuPlan.js';
import { anadirObjetivo } from '../src/lib/objetivosProgreso.js';
import { resumenDelDia } from '../src/lib/nutricion.js';
import { promediosDelPeriodo } from '../src/lib/estadisticasNutricion.js';
import { crearHabito, tocaHoy, hechoHoy, estadisticasHabito } from '../src/lib/habitos.js';
import { estadisticasDe } from '../src/lib/pomodoro.js';
import { crearRutina as crearRutinaPR } from '../src/lib/rutinas.js';
import { addDays } from '../src/lib/helpers.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* D8 — la duración de UNA noche, en minutos exactos de las dos horas (calculada aquí, aparte del
   asistente): «00:30 → 06:40» son 6 h 10 min. `textoDuracion` de sueno.js —la de la pantalla— redondea a
   décimas de hora y dice 6 h 12 min; estas comprobaciones lo esperaban así y se dieron la vuelta. */
function textoDuracion(r) {
  const min = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b; };
  let m = min(r.horaDespertar) - min(r.horaDormir);
  if (m <= 0) m += 24 * 60;
  return formatearDuracionLarga(m * 60000);
}
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
  if (ultimoVisto) console.log(`      (lo último que contestó: ${ultimoVisto})`);
}
let ultimoVisto = '';
const HOY = '2026-10-23';
const d = (n) => addDays(HOY, -n);

/* ══════════════════════════════════════════════════════════════════════════
   Los escenarios (datos de un usuario de prueba, nada real)
   ══════════════════════════════════════════════════════════════════════════ */
const SUENO = [
  { id: 's0', fecha: HOY, horaDormir: '23:45', horaDespertar: '07:15', calidad: 4, interrupciones: 1 },
  { id: 's1', fecha: d(1), horaDormir: '00:30', horaDespertar: '06:40', calidad: 2, interrupciones: 0 },
  { id: 's2', fecha: d(2), horaDormir: '23:00', horaDespertar: '07:00', calidad: 5, interrupciones: 0, siestaAyer: true, siestaMinutos: 30 },
  { id: 's4', fecha: d(4), horaDormir: '22:30', horaDespertar: '07:30', calidad: null },
  { id: 's8', fecha: d(8), horaDormir: '23:30', horaDespertar: '07:30', calidad: 4 },
  { id: 's10', fecha: d(10), horaDormir: '01:00', horaDespertar: '08:00', calidad: 4 },
];

const rutinaDe = (id, series) => {
  let r = crearRutinaFitness({ nombre: id });
  r = anadirEjercicio(r, id);
  return editarLinea(r, r.lineas[0].id, { series }).lineas;
};
let sid = 0;
function entreno(exerciseId, valores, fecha) {
  sid += 1;
  const inicio = new Date(`${fecha}T18:00:00`).getTime() + sid;
  let s = empezarSesion({ nombre: `Entreno ${sid}`, lineas: rutinaDe(exerciseId, valores.length), hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => { s = editarSerie(s, e.id, e.series[i].id, v); s = marcarSerie(s, e.id, e.series[i].id, true); });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3000000 }), { confirmado: true, ahora: inicio + 3001000 }).sesion;
}
let FITNESS = [
  entreno('press-banca-barra', [{ peso: 60, reps: 8 }, { peso: 60, reps: 8 }], d(10)),
  entreno('press-banca-barra', [{ peso: 62.5, reps: 8 }, { peso: 62.5, reps: 7 }], d(3)),
  entreno('dominada-prona', [{ reps: 8 }, { reps: 7 }], d(2)),
  entreno('dominada-supina', [{ reps: 9 }], d(1)),
].reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const ENTRENO_FUTURO = entreno('press-militar-barra', [{ peso: 30, reps: 10 }], addDays(HOY, 3));
FITNESS = guardarSesion(FITNESS, ENTRENO_FUTURO);
FITNESS = usarPlan(FITNESS, CATALOGO_PLANES[0].id, { confirmado: true, hoy: '2026-10-19' }).fitness;
FITNESS = anadirObjetivo(FITNESS, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 12 }).fitness;

const comida = (fecha, nombre, kcal, p, c, g, momento) => ({ id: `${fecha}-${nombre}`, fecha, nombre, calorias: kcal, proteinas: p, carbohidratos: c, grasas: g, momento });
const NUTRICION = {
  comidas: [
    comida(HOY, 'Avena', 389, 16.9, 66.3, 6.9, 'desayuno'),
    comida(HOY, 'Pollo con arroz', 650, 45, 70, 15, 'comida'),
    comida(d(1), 'Tostadas', 300, 10, 50, 8, 'desayuno'),
    comida(d(1), 'Pasta', 800, 25, 120, 20, 'comida'),
    comida(d(1), 'Yogur', 120, 8, 12, 4, 'merienda'),
    comida(d(3), 'Ensalada', 400, 20, 30, 18, 'cena'),
  ],
  agua: { [HOY]: 1250, [d(1)]: 2000 },
  objetivoAgua: { ml: 2000, fecha: d(30) },
  objetivos: { configurado: true, kcal: 2400, proteinas: 130, carbohidratos: 300, grasas: 75, fecha: d(30) },
};

const ESTUDIOS = {
  asignaturas: [
    { id: 'bio', nombre: 'Biología' }, { id: 'mat', nombre: 'Matemáticas' }, { id: 'fyq', nombre: 'Física y Química' }, { id: 'his', nombre: 'Historia' },
  ],
  examenes: [
    { id: 'e1', asignaturaId: 'bio', tema: 'La célula', fecha: addDays(HOY, 4), estado: 'proximo' },
    { id: 'e2', asignaturaId: 'mat', tema: 'Derivadas', fecha: addDays(HOY, 12), estado: 'proximo' },
    { id: 'e3', asignaturaId: 'fyq', tema: 'Cinemática', fecha: d(9), notaObtenida: '7,5', notaObjetivo: '8' },
    { id: 'e4', asignaturaId: 'his', tema: 'Tema 2', fecha: d(20), notaObtenida: 'Notable' },
  ],
  entregas: [{ id: 't1', asignaturaId: 'his', nombre: 'Trabajo de la guerra', fecha: addDays(HOY, 2), estado: 'pendiente' }],
  eventos: [],
  temas: [
    { id: 'th1', asignaturaId: 'his', nombre: 'Tema 1', estado: 'completado', orden: 0 },
    { id: 'th2', asignaturaId: 'his', nombre: 'Tema 2', estado: 'progreso', orden: 1 },
    { id: 'th3', asignaturaId: 'his', nombre: 'Tema 3', estado: 'pendiente', orden: 2 },
  ],
  horas: [
    { id: 'h1', asignaturaId: 'bio', fecha: d(1), horas: 1.5 },
    { id: 'h2', asignaturaId: 'mat', fecha: d(1), horas: 1 },
    { id: 'h3', asignaturaId: 'bio', fecha: d(3), horas: 0.5 },
    { id: 'h4', asignaturaId: 'his', fecha: d(10), horas: 2 },
  ],
};

const habito = (nombre, hechos) => {
  const h = crearHabito({ nombre });
  return { ...h, fecha: d(30), historial: Object.fromEntries(hechos.map((n) => [d(n), true])) };
};
const leer30 = habito('Leer 30 minutos', [0, 1, 2, 3, 4]);
const agua = habito('Beber agua', [1, 2]);
const rutinaManana = { ...crearRutinaPR({ nombre: 'Rutina de mañana', hoy: d(30) }), programacion: { tipo: 'diaria' } };
const PRODUCTIVIDAD = {
  habitos: [leer30, agua],
  pomodoroSesiones: [
    { id: 'p1', tipo: 'focus', inicio: new Date(`${HOY}T10:00:00`).getTime(), fin: 0, duracionMs: 25 * 60000, completada: true, fecha: HOY },
    { id: 'p2', tipo: 'focus', inicio: new Date(`${d(1)}T10:00:00`).getTime(), fin: 0, duracionMs: 25 * 60000, completada: true, fecha: d(1) },
    { id: 'p3', tipo: 'focus', inicio: new Date(`${d(1)}T11:00:00`).getTime(), fin: 0, duracionMs: 10 * 60000, completada: false, fecha: d(1) },
  ],
  metas: [{ id: 'm1', nombre: 'Leer 12 libros', tipo: 'numerica', objetivo: 12, progreso: 5, unidad: 'libros', objetivoId: 'o1' }],
  rutinas: [rutinaManana],
  rutinaEjecuciones: [],
  tareas: [{ id: 'tsecreta', texto: 'TAREA-NO-DEBE-SALIR', fecha: HOY }],
};
const OBJETIVOS = { lista: [{ id: 'o1', texto: 'Leer más', plazo: 'año', cumplido: false }] };

/* Lo que tiene la aplicación en memoria, con datos de OTROS módulos que ningún asistente puede ver. */
const ESTADO = {
  sueno: SUENO, fitness: FITNESS, nutricion: NUTRICION, estudios: ESTUDIOS, productividad: PRODUCTIVIDAD, objetivos: OBJETIVOS,
  relacion: { secreto: 'RELACION-SECRETA' }, diario: { entradas: [{ texto: 'DIARIO-SECRETO' }] }, economia: { movimientos: [{ concepto: 'ECONOMIA-SECRETA' }] },
  estiloHombre: { secreto: 'ESTILO-SECRETO' }, perfil: { peso: 99 }, salud: { medidas: [{ peso: 99 }] },
};

/* Conversar como lo hace la hoja: datos de la lista blanca y la tabla de módulos ajenos. */
const todasLasRespuestas = [];
function conversacion(asistente, estado = ESTADO, extra = {}) {
  let ctx = nuevaConversacion('u-prueba');
  return (mensaje) => {
    const r = responderMensaje(asistente, mensaje, { datos: datosParaAsistente(asistente, estado), hoy: HOY, contexto: ctx, ajenos: DOMINIOS_AJENOS, ahora: 1000, ...extra });
    ctx = r.contexto;
    todasLasRespuestas.push(...r.respuestas);
    ultimoVisto = r.respuestas.map((x) => `[${x.capacidad}] ${textoDeRespuesta(x)}`).join(' | ');
    return r.respuestas;
  };
}
const txt = (rs) => rs.map(textoDeRespuesta).join(' | ');
const caps = (rs) => rs.map((r) => r.capacidad).join(',');
const minutos = (m) => formatearDuracionLarga(m * 60000) || '0 min';

console.log('\n═══ Fase 2 · Los asistentes del primer lote ═══');

/* ══════════════════════════════════════════════════════════════════════════
   1 · SUEÑO
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Sueño ──');
{
  const p = conversacion(ASISTENTE_SUENO);
  let r = p('cuanto dormi anoche');
  ok(caps(r) === 'noche' && txt(r).includes(textoDuracion(SUENO[0])) && txt(r).includes('23:45 → 07:15'), `«cuánto dormí anoche» → la noche de hoy: ${textoDuracion(SUENO[0])} (minutos exactos de las dos horas)`);
  r = p('y ayer?');
  ok(caps(r) === 'noche' && txt(r).includes(textoDuracion(SUENO[1])) && txt(r).includes('terminó ayer'), '«¿y ayer?» → la noche que terminó ayer, dicho con su fecha (CB-14)');
  /* 🐛 Lo cazó la sonda del recorrido: «hora de dormir» se compilaba sin su «de» interior y casaba con
     «horas dormí», así que «¿cuántas horas dormí ayer?» contestaba a qué hora se acostó, sin la duración. */
  r = conversacion(ASISTENTE_SUENO)('¿cuántas horas dormí ayer?');
  ok(caps(r) === 'noche' && txt(r).includes(textoDuracion(SUENO[1])), `🐛 «¿cuántas horas dormí ayer?» → la DURACIÓN (${textoDuracion(SUENO[1])}), no solo a qué hora se acostó`);
  r = conversacion(ASISTENTE_SUENO)('cual fue mi hora de dormir ayer');
  ok(caps(r) === 'horarios', '…y «mi hora de dormir» sigue siendo una pregunta de horarios');
  r = p('q tal he sobao esta semana');
  const semana = SUENO.filter((x) => x.fecha >= '2026-10-19');
  ok(caps(r) === 'media' && txt(r).includes(minutos(mediaDeMinutos(semana))), `Coloquial («sobao») → la media de esta semana = mediaDeMinutos (la de la pantalla): ${minutos(mediaDeMinutos(semana))}`);
  ok(txt(r).includes('4 de 5') && /no cuenta en la media/.test(txt(r)), 'Dice cuántas noches cuentan y que un día sin registro no entra en la media (DA-11)');
  r = p('y la semana pasada?');
  const pasada = SUENO.filter((x) => x.fecha >= '2026-10-12' && x.fecha <= '2026-10-18');
  ok(caps(r) === 'media' && txt(r).includes(minutos(mediaDeMinutos(pasada))) && txt(r).includes('la semana pasada'), 'Seguimiento: «¿y la semana pasada?»');
  r = p('cuanto dromi el lunes y que tal la calidad');
  ok(caps(r) === 'noche,calidad' && r.every((x) => textoDeRespuesta(x).includes('lunes 19')), 'Dos preguntas con una errata: noche + calidad, las dos del lunes');
  r = p('duermo mas q la semana pasada?');
  const dif = mediaDeMinutos(semana) - mediaDeMinutos(pasada);
  ok(caps(r) === 'comparar' && txt(r).includes(`${formatearDuracionLarga(Math.abs(dif) * 60000)} ${dif > 0 ? 'más' : 'menos'}`) && /no dice a qué se debe/.test(txt(r)), 'Comparar: la diferencia de las dos medias, y que no dice a qué se debe');
  r = p('a que hora me acoste esta semana');
  ok(caps(r) === 'horarios' && txt(r).includes('22:30 → 07:30') && !/media/i.test(txt(r).replace('mediaDe', '')), 'Horarios: las horas tal cual, sin una «hora media» inventada (H-03)');
  r = p('a que hora me he acostado este mes');
  ok(caps(r) === 'horarios', '…también en un mes');
  r = p('cuantas veces me desperte esta semana');
  /* v3.161.2 — s4 no contestó la pregunta (null): no cuenta como «0 despertares». Antes salía «1 de 4». */
  ok(caps(r) === 'despertares' && txt(r).includes('1 de 3') && /1 noche no tiene contestado si te despertaste/.test(txt(r)) && !/te despertaste: 1 de 4/.test(txt(r)),
    'Despertares: noches con interrupciones, solo de las que lo contestaste (la sin contestar se dice y no cuenta)');
  r = p('noche mas corta este mes');
  const corta = [...SUENO].filter((x) => x.fecha >= '2026-10-01').sort((a, b) => duracionDe(a) - duracionDe(b))[0];
  ok(caps(r) === 'extremos' && txt(r).includes(textoDuracion(corta)), 'La noche más corta del mes');
  r = p('cuantas noches tengo registradas');
  ok(caps(r) === 'registro' && txt(r).includes('6 de 23') && txt(r).includes('este mes'), 'Registro: hereda «este mes» de la pregunta anterior (§7.6): 6 de 23');
  r = p('cuantas noches tengo registradas los ultimos 30 dias');
  ok(caps(r) === 'registro' && txt(r).includes('6 de 30'), '…y con su periodo propio, los últimos 30 días: 6 de 30');
  r = p('que tal la calidad de mis noches este mes');
  ok(caps(r) === 'calidad' && txt(r).includes('Sin contestar: 1 noche'), 'Calidad: con las noches sin contestar aparte (null no es «Fatal»)');
  r = p('cuantas horas he dormido de media los ultimos 10 dias');
  ok(caps(r) === 'media' && txt(r).includes('del 14 al 23 de octubre'), '«los últimos 10 días»');
  r = p('he dormido bien?');
  ok(['noche', 'calidad'].includes(caps(r)) && /Muy bien/.test(txt(r)) && !incumpleHonestidad(txt(r)).length, '«¿He dormido bien?» → la noche con la cara que ELIGIÓ él, sin un juicio de la app');
  r = p('duermo poco?');
  ok(caps(r).startsWith('limite') && caps(r).includes('media'), '«¿Duermo poco?» → no se valora, pero se da la media');
  r = p('cuanto dormi el 15');
  ok(caps(r) === 'noche' && txt(r).includes(textoDuracion(SUENO[4])), '«el 15» → esa noche');
  r = p('cuanto dormi el 16');
  ok(caps(r) === 'noche' && /No tienes registrada/.test(txt(r)) && /La última registrada antes/.test(txt(r)), 'Una noche sin registro: lo dice y ofrece la anterior');
}

/* ══════════════════════════════════════════════════════════════════════════
   2 · FITNESS
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Fitness ──');
{
  const p = conversacion(ASISTENTE_FITNESS);
  let r = p('cuando fue mi ultimo entrenamiento');
  ok(caps(r) === 'ultimo' && txt(r).includes('ayer'), 'El último entrenamiento: ayer (el de fecha futura no cuenta)');
  ok(/fecha que todavía no ha llegado/.test(txt(r)), '…y dice que hay uno con fecha futura que no cuenta (CX-19)');
  r = p('cuantas veces he entrenado esta semana');
  ok(caps(r) === 'cuantos' && txt(r).includes('3 entrenamientos') && txt(r).includes('3 de 5'), 'Esta semana: 3 entrenamientos en 3 días (lunes a hoy)');
  ok(/no se cuenta como descanso/.test(txt(r)), '…y un día sin apuntar no es descanso');
  r = p('y la semana pasada?');
  ok(caps(r) === 'cuantos' && txt(r).includes('1 entrenamiento'), 'Seguimiento: la semana pasada, 1');
  r = p('que entrene ayer');
  ok(caps(r) === 'dia' && txt(r).includes('Entreno 4'), 'Qué entrené ayer');
  r = p('como voy en press banca');
  const pb = progresoDeEjercicio(FITNESS, 'press-banca-barra');
  ok(caps(r) === 'ejercicio' && txt(r).includes(pb.ultima.texto), `«press banca» → el de barra (el que tiene historia, H-10): ${pb.ultima.texto}`);
  ok(txt(r).includes('Mejora') && txt(r).includes('lectura de una regla') === false, 'La tendencia es la de la F11 (Mejora) y va marcada como lectura');
  ok(r[0].bloques.some((b) => b.naturaleza === 'lectura' && b.etiqueta === 'Tendencia'), 'La tendencia es una LECTURA, no un dato (H-05)');
  r = p('y mi record?');
  ok(caps(r) === 'record' && txt(r).includes(pb.mejor.texto), `«¿y mi récord?» hereda el ejercicio: ${pb.mejor.texto}`);
  r = p('como voy en dominadas');
  ok(caps(r) === 'ejercicio' && r[0].tipo === 'aclaracion' && r[0].opciones.length >= 2, '«dominadas» → ¿cuáles? (pronas, supinas…)');
  r = p(r[0].opciones.find((o) => /pronas/i.test(o.texto)).mensaje);
  ok(caps(r) === 'ejercicio' && txt(r).includes('Dominadas pronas'), 'Tocar «Dominadas pronas» contesta');
  r = p('como voy en pull up');
  ok(caps(r) === 'ejercicio' && txt(r).includes('Dominadas pronas'), 'Por su nombre técnico («pull up»)');
  r = p('que me toca hoy');
  const tp = tuPlan(FITNESS, { hoy: HOY });
  const casilla = tp.semana.find((x) => x.fecha === HOY);
  ok(caps(r) === 'plan' && (casilla.descanso ? /no tiene entrenamiento planificado/.test(txt(r)) : txt(r).includes(casilla.nombre)), 'Qué toca hoy, según tuPlan');
  r = p('como van mis objetivos');
  ok(caps(r) === 'objetivos' && txt(r).includes('Dominadas pronas') && txt(r).includes('1 objetivo activo'), 'Los objetivos de Fitness');
  r = p('cual es mi record en press militar');
  ok(caps(r) === 'record' && /Todavía no tienes ninguna marca/.test(txt(r)), 'Un ejercicio solo hecho en el futuro: sin marca (lo futuro no cuenta)');
  r = p('como voy en press japones raro');
  ok(r[0].tipo === 'aclaracion' || /No lo he entendido|Todavía no/.test(txt(r)), 'Un ejercicio que no existe no se inventa');
  r = p('cuantas calorias he quemado hoy');
  ok(caps(r) === 'no_registrado', 'Calorías quemadas: JosStyle no lo registra');
  r = p('cuantos pasos di ayer');
  ok(caps(r) === 'no_registrado', 'Escenario 9 · pasos: no registrado');
  r = p('entrene el domingo pasado?');
  ok(caps(r) === 'dia' && /No tienes ningún entrenamiento/.test(txt(r)), 'Un domingo sin entrenamiento: lo dice');
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · NUTRICIÓN
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Nutrición ──');
{
  const p = conversacion(ASISTENTE_NUTRICION);
  const objetivos = { calorias: 2400, proteinas: 130, carbohidratos: 300, grasas: 75 };
  const hoyR = resumenDelDia(NUTRICION.comidas, HOY, objetivos);
  let r = p('cuantas calorias llevo hoy');
  ok(caps(r) === 'dia' && txt(r).includes(`${hoyR[0].consumido} kcal`) && txt(r).includes(`${hoyR[0].porcentaje} %`), `Calorías de hoy = resumenDelDia: ${hoyR[0].consumido} kcal, ${hoyR[0].porcentaje} % del objetivo`);
  ok(/sigue en curso/.test(txt(r)), '…y avisa de que el día sigue en curso');
  r = p('y de proteina?');
  ok(caps(r) === 'dia' && txt(r).toLowerCase().includes('proteína') && txt(r).includes('61,9 g'), 'Seguimiento: «¿y de proteína?» → solo la proteína de hoy (61,9 g)');
  r = p('media de proteina esta semana');
  ok(caps(r) === 'media' && /Divido entre los/.test(txt(r)), 'La media de la semana divide entre los días con datos');
  const m7 = promediosDelPeriodo(NUTRICION.comidas, '7d', HOY);
  r = p('cual es mi media de calorias de los ultimos 7 dias');
  ok(caps(r) === 'media' && txt(r).includes(`${m7.promedio.calorias} kcal`) && txt(r).includes(`${m7.diasConDatos} de 7`), `Los últimos 7 días = promediosDelPeriodo (el motor de Estadísticas): ${m7.promedio.calorias} kcal`);
  const rango = mediaDelRangoNutricion(NUTRICION.comidas, d(6), HOY);
  ok(JSON.stringify(rango.promedio) === JSON.stringify(m7.promedio), 'La media compuesta para un rango cualquiera da lo mismo que el motor en sus 7 días (no hay una segunda fórmula)');
  r = p('que comi ayer');
  ok(caps(r) === 'comidas' && txt(r).includes('Pasta') && txt(r).includes('Merienda'), 'Qué comí ayer, por momentos');
  r = p('cuanta agua llevo hoy');
  ok(caps(r) === 'agua' && txt(r).includes('1,25 L') && txt(r).includes('2 L'), 'El agua de hoy frente a SU objetivo (2 L)');
  r = p('cuantos dias he apuntado lo que como esta semana');
  ok(caps(r) === 'constancia' && txt(r).includes('3 días de 5'), 'Constancia: 3 días de 5, un recuento y no una racha');
  r = p('que dia comi mas esta semana');
  ok(caps(r) === 'extremos' && txt(r).includes('1220 kcal'), 'El día con más calorías registradas (ayer, 1220)');
  r = p('cuantas calorias comi el miercoles');
  ok(caps(r) === 'dia' && /No tienes nada registrado/.test(txt(r)) && /no es un día de 0 calorías/.test(txt(r)), 'Un día vacío no es un día de 0 kcal');
  r = p('estoy comiendo poco?');
  ok(caps(r).startsWith('limite'), '«¿Estoy comiendo poco?» → no se juzga ni se prescribe');
  r = p('que deberia comer');
  ok(caps(r).startsWith('limite') && !/deberías|tienes que/i.test(txt(r)), '«¿Qué debería comer?» → no hay consejos');
  const solo1 = conversacion(ASISTENTE_NUTRICION, { ...ESTADO, nutricion: { comidas: [comida(d(2), 'Única', 500, 20, 50, 10, 'comida')] } });
  r = solo1('media de calorias esta semana');
  ok(caps(r) === 'media' && r[0].confianza === 'pocos_datos' && /hacen falta 2/.test(txt(r)), 'Escenario 7 · un solo día: sin media, «hacen falta 2»');
  const sinObj = conversacion(ASISTENTE_NUTRICION, { ...ESTADO, nutricion: { comidas: NUTRICION.comidas } });
  r = sinObj('cuantas calorias llevo hoy');
  ok(/No tienes objetivos/.test(txt(r)) && !/%/.test(txt(r)), 'Sin objetivos: no hay porcentaje (null no es 0 %)');
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · ESTUDIOS
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Estudios ──');
{
  const p = conversacion(ASISTENTE_ESTUDIOS);
  let r = p('que examenes tengo proximamente');
  ok(caps(r) === 'proximos' && txt(r).includes('La célula') && txt(r).includes('Derivadas') && !txt(r).includes('Trabajo de la guerra'), 'Próximos exámenes (solo exámenes: se pidió eso)');
  r = p('que tengo pendiente');
  ok(caps(r) === 'proximos' && txt(r).includes('Trabajo de la guerra'), '«¿Qué tengo pendiente?» → todo lo próximo');
  r = p('cuando es el examen de bio');
  ok(caps(r) === 'cuando' && txt(r).includes('Biología') && txt(r).includes('martes 27'), '«bio» → Biología, el martes 27');
  r = p('y el de mates?');
  ok(caps(r) === 'cuando' && txt(r).includes('Matemáticas'), 'Seguimiento con abreviatura: «¿y el de mates?»');
  r = p('cuando es el examen de fisica y quimica');
  ok(r.length === 1 && caps(r) === 'cuando' && txt(r).includes('Física y Química'), '«Física y Química» no se parte en dos preguntas (H-17)');
  r = p('cuantas horas he estudiado esta semana');
  ok(caps(r) === 'horas' && txt(r).includes(minutos(180)), 'Horas de esta semana: 3 h (suma por día, CX-11)');
  r = p('y de biologia?');
  ok(caps(r) === 'horas' && txt(r).includes(minutos(120)), '…y solo de Biología: 2 h');
  r = p('que notas he sacado');
  ok(caps(r) === 'notas' && txt(r).includes('7,5') && txt(r).includes('Notable') && /No calculo una media/.test(txt(r)), 'Las notas tal cual, sin media (H-04)');
  r = p('que temas me quedan de historia');
  ok(caps(r) === 'temas' && txt(r).includes('Tema 3') && txt(r).includes('Pendiente'), 'Los temas de Historia por estado');
  r = p('que asignaturas tengo');
  ok(caps(r) === 'asignaturas' && txt(r).includes('4 asignaturas'), 'Las asignaturas');
  r = p('aprobare biologia?');
  ok(caps(r) === 'limite', '«¿Aprobaré?» → no se predice');
  r = p('que examenes tengo la semana que viene');
  ok(caps(r) === 'proximos' && txt(r).includes('La célula') && !txt(r).includes('Derivadas'), 'Una semana futura: solo lo de esa semana');
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · PRODUCTIVIDAD
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Productividad ──');
{
  const p = conversacion(ASISTENTE_PRODUCTIVIDAD);
  let r = p('que habitos me tocan hoy');
  const tocan = [leer30, agua].filter((h) => tocaHoy(h, HOY) || hechoHoy(h, HOY));
  ok(caps(r) === 'habitos' && txt(r).includes(`1 de ${tocan.length}`) && txt(r).includes('Beber agua'), 'Hábitos de hoy: 1 hecho y «Beber agua» pendiente');
  r = p('cual es mi racha mas larga');
  ok(caps(r) === 'racha' && txt(r).includes('Leer 30 minutos'), 'La racha más larga');
  r = p('y la de beber agua?');
  const e = estadisticasHabito(agua, HOY);
  ok(caps(r) === 'racha' && txt(r).includes('Beber agua') && txt(r).includes(String(e.mejorRacha)), 'La racha de un hábito concreto (estadisticasHabito)');
  r = p('cuantos pomodoros he hecho esta semana');
  const pom = estadisticasDe(PRODUCTIVIDAD.pomodoroSesiones, { desde: '2026-10-19', hasta: HOY });
  ok(caps(r) === 'pomodoro' && txt(r).includes(`${pom.pomodoros} pomodoros`) && txt(r).includes('Interrumpidos'), `Pomodoros de la semana = estadisticasDe: ${pom.pomodoros}`);
  r = p('como van mis metas');
  ok(caps(r) === 'metas' && txt(r).includes('5 / 12'), 'Las metas con su progreso');
  r = p('y mis objetivos?');
  ok(caps(r) === 'objetivos' && txt(r).includes('Leer más'), 'Los objetivos');
  r = p('que rutinas tengo hoy');
  ok(caps(r) === 'rutinas' && txt(r).includes('Rutina de mañana'), 'Las rutinas de hoy');
  r = p('que tareas tengo hoy');
  ok(caps(r) === 'fuera_de_dominio' && /Organización/.test(txt(r)) && !txt(r).includes('TAREA-NO-DEBE-SALIR'), 'Las tareas son de Organización: no se contestan aquí (CB-17)');
}

/* ══════════════════════════════════════════════════════════════════════════
   5a · UNA PREGUNTA DE UN DÍA CON UN RANGO DE VARIOS (H-25)
   ══════════════════════════════════════════════════════════════════════════
   🐛 Lo cazó la sonda del recorrido: «¿y la semana pasada?» después de «¿cuánto dormí ayer?» contestaba
   la noche del lunes 12 —el primer día del rango— sin decirlo. Ahora pasa a la hermana de rango
   (`siRango`) o pregunta qué día; nunca elige uno por su cuenta. */
console.log('\n── 5a. Un día frente a un rango ──');
{
  for (const a of ASISTENTES) {
    for (const c of a.capacidades) {
      if (!c.siRango) continue;
      const h = a.capacidades.find((x) => x.id === c.siRango);
      ok(c.periodo === 'dia' && h && (h.periodo === 'rango' || h.periodo === 'ambos') && (h.tiempo || 'pasado') === (c.tiempo || 'pasado'),
        `${a.id}.${c.id} → siRango «${c.siRango}» existe, trabaja con rangos y mira el mismo tiempo`);
    }
  }
  let p = conversacion(ASISTENTE_SUENO);
  p('cuanto dormi ayer');
  let r = p('y la semana pasada?');
  const pasada = SUENO.filter((x) => x.fecha >= '2026-10-12' && x.fecha <= '2026-10-18');
  ok(caps(r) === 'media' && txt(r).includes(minutos(mediaDeMinutos(pasada))) && !/terminó el lunes 12/.test(txt(r)),
    `🐛 Sueño: «¿cuánto dormí ayer?» → «¿y la semana pasada?» → la MEDIA de esa semana (${minutos(mediaDeMinutos(pasada))}), no la noche del lunes 12`);
  p = conversacion(ASISTENTE_FITNESS);
  r = p('que entrene la semana pasada');
  ok(caps(r) === 'cuantos', `Fitness: «¿qué entrené la semana pasada?» → cuántos entrenamientos (la hermana de rango), no el lunes`);
  p = conversacion(ASISTENTE_PRODUCTIVIDAD);
  r = p('que habitos me tocan esta semana');
  ok(caps(r) === 'habitos' && r[0].tipo === 'aclaracion' && /día a día/.test(txt(r)) && r[0].opciones.length === 4
    && r[0].opciones.every((o) => o.plan.periodo.tipo === 'dia' && o.plan.periodo.desde <= HOY && o.plan.periodo.desde >= '2026-10-19'),
    `Productividad (sin hermana de rango): «¿qué hábitos me tocan esta semana?» → «¿qué día?», con días de la semana hasta hoy — ${r[0].opciones.map((o) => o.texto).join(' · ')}`);
  ok(r[0].opciones.at(-1).texto === 'Hoy', '…el último, hoy');
  r = p(r[0].opciones.at(-1).mensaje);
  ok(caps(r) === 'habitos' && r[0].tipo === 'respuesta' && txt(r).includes('Beber agua'), '…y al tocar «Hoy» contesta los hábitos de hoy');
  r = conversacion(ASISTENTE_PRODUCTIVIDAD, ESTADO, { hoy: '2026-10-19' })('que habitos me tocan esta semana');
  ok(caps(r) === 'habitos' && r[0].tipo === 'respuesta', 'Un lunes, «esta semana» solo tiene un día que mirar: se contesta ese día, sin preguntar');
  r = conversacion(ASISTENTE_FITNESS)('que me toca la semana que viene');
  ok(caps(r) === 'plan' && r[0].tipo === 'aclaracion' && r[0].opciones.every((o) => o.plan.periodo.desde > HOY),
    `Fitness (futuro): «¿qué me toca la semana que viene?» → «¿qué día?», con días que todavía no han llegado — ${r[0].opciones.map((o) => o.texto).join(' · ')}`);
}

/* ══════════════════════════════════════════════════════════════════════════
   5b · EL CORPUS DE VARIANTES: la misma pregunta dicha de muchas formas
   ══════════════════════════════════════════════════════════════════════════
   Cada línea: el mensaje (sin contexto previo) y la capacidad que tiene que elegir. Erratas, coloquial,
   sin acentos, preguntas indirectas. Es la medida objetiva del §11: tiene que acertar el 100 %. */
console.log('\n── 5b. Corpus de variantes (sin contexto previo) ──');
const VARIANTES = [
  [ASISTENTE_SUENO, [
    ['cuanto he dormido hoy', 'noche'], ['k tal dormi anoche', 'noche'], ['horas de sueño de anoche', 'noche'], ['cuanto dormí el martes', 'noche'],
    ['cuántas horas duermo de media', 'media'], ['media de sueño del mes pasado', 'media'], ['cómo he dormido estos últimos 7 días', 'media'], ['normalmente cuanto duermo', 'media'],
    ['calidad del sueño esta semana', 'calidad'], ['que caras he puesto esta semana', 'calidad'], ['a que hora me levanto normalmente', 'horarios'], ['a qué hora me fui a la cama ayer', 'horarios'],
    ['me he desvelado esta semana?', 'despertares'], ['cuantas siestas he echado', 'despertares'], ['cual fue la noche mas larga', 'extremos'], ['cuando dormi menos este mes', 'extremos'],
    ['comparado con el mes pasado duermo mas?', 'comparar'], ['diferencia con la semana pasada', 'comparar'], ['que dias no he registrado', 'registro'], ['cuantas noches tengo apuntadas este mes', 'registro'],
  ]],
  [ASISTENTE_FITNESS, [
    ['ultimo entreno', 'ultimo'], ['cuando entrene por ultima vez', 'ultimo'], ['que hice en el gym ayer', 'dia'], ['entrené el martes?', 'dia'],
    ['cuantos entrenos llevo esta semana', 'cuantos'], ['cuantas veces fui al gimnasio este mes', 'cuantos'], ['cuantos dias he entrenado la semana pasada', 'cuantos'],
    ['que entreno hoy', 'plan'], ['que toca mañana', 'plan'], ['que dice mi plan para el lunes', 'plan'],
    ['progreso en press de banca', 'ejercicio'], ['como llevo las dominadas pronas', 'ejercicio'], ['he mejorado en press banca?', 'ejercicio'], ['press banca', 'ejercicio'],
    ['mi pr en dominadas pronas', 'record'], ['cual es mi maximo en press de banca', 'record'], ['mejor marca en pull up', 'record'],
    ['mis objetivos', 'objetivos'], ['como voy con mis retos', 'objetivos'], ['objetivo de dominadas pronas', 'objetivos'],
  ]],
  [ASISTENTE_NUTRICION, [
    ['cuantas kcal llevo', 'dia'], ['proteina de hoy', 'dia'], ['cuanto he comido hoy', 'dia'], ['calorias de ayer', 'dia'], ['macros de hoy', 'dia'],
    ['media de calorias del mes', 'media'], ['de media cuanta proteina tomo', 'media'], ['promedio de grasas esta semana', 'media'], ['carbos de media los ultimos 30 dias', 'media'],
    ['que he comido hoy', 'comidas'], ['que cene ayer', 'comidas'], ['que desayune el martes', 'comidas'], ['lo que comi ayer', 'comidas'],
    ['agua de hoy', 'agua'], ['cuanto he bebido hoy', 'agua'], ['cuantos vasos de agua llevo', 'agua'],
    ['cuantos dias he registrado este mes', 'constancia'], ['he apuntado todos los dias?', 'constancia'],
    ['dia con mas calorias de la semana', 'extremos'], ['que dia comi menos este mes', 'extremos'],
  ]],
  [ASISTENTE_ESTUDIOS, [
    ['proximos examenes', 'proximos'], ['que entregas tengo', 'proximos'], ['tengo algun examen esta semana', 'proximos'], ['que tengo la semana que viene', 'proximos'],
    ['cuando es el control de mates', 'cuando'], ['fecha del examen de historia', 'cuando'], ['cuando entrego el trabajo de historia', 'cuando'], ['para cuando es lo de biologia', 'cuando'],
    ['horas de estudio este mes', 'horas'], ['cuanto he estudiado hoy', 'horas'], ['cuanto he repasado biologia esta semana', 'horas'], ['tiempo de estudio de la semana pasada', 'horas'],
    ['mis notas', 'notas'], ['que saque en fisica y quimica', 'notas'], ['calificaciones de historia', 'notas'],
    ['temas de historia', 'temas'], ['que me falta del temario de historia', 'temas'], ['unidades de biologia', 'temas'],
    ['mis asignaturas', 'asignaturas'], ['que materias tengo', 'asignaturas'],
  ]],
  [ASISTENTE_PRODUCTIVIDAD, [
    ['habitos de hoy', 'habitos'], ['que me queda de habitos', 'habitos'], ['he hecho mis habitos?', 'habitos'], ['habitos de ayer', 'habitos'],
    ['racha', 'racha'], ['cuantos dias seguidos llevo leyendo 30 minutos', 'racha'], ['mi mejor racha', 'racha'], ['racha de beber agua', 'racha'],
    ['pomodoros de hoy', 'pomodoro'], ['cuanto tiempo de concentracion llevo esta semana', 'pomodoro'], ['pomodoros de ayer', 'pomodoro'], ['cuantos pomodoros hice el mes pasado', 'pomodoro'],
    ['mis metas', 'metas'], ['como voy con la meta de leer', 'metas'], ['progreso de mis metas', 'metas'],
    ['mis objetivos', 'objetivos'], ['como van mis propositos', 'objetivos'],
    ['rutinas de hoy', 'rutinas'], ['tengo alguna rutina hoy', 'rutinas'], ['que rutinas tenia ayer', 'rutinas'],
  ]],
];
for (const [asistente, lista] of VARIANTES) {
  const fallidas = [];
  for (const [mensaje, esperada] of lista) {
    const r = responderMensaje(asistente, mensaje, { datos: datosParaAsistente(asistente, ESTADO), hoy: HOY, ajenos: DOMINIOS_AJENOS });
    todasLasRespuestas.push(...r.respuestas);
    const c = r.respuestas.map((x) => x.capacidad);
    if (!c.includes(esperada)) fallidas.push(`«${mensaje}» → ${c.join(',') || 'nada'} (esperaba ${esperada})`);
  }
  ultimoVisto = fallidas.slice(0, 4).join(' · ');
  ok(!fallidas.length && lista.length >= 20, `${asistente.nombre}: ${lista.length - fallidas.length}/${lista.length} variantes eligen su capacidad`);
}
ultimoVisto = '';

/* ══════════════════════════════════════════════════════════════════════════
   6 · LOS ESCENARIOS ADVERSARIALES (§16.2) QUE NO ESTÁN ARRIBA
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Escenarios adversariales ──');
{
  const s = conversacion(ASISTENTE_SUENO);
  let r = s('por que dormi 10 horas ayer');
  ok(caps(r) === 'limite,noche' && txt(r).includes(textoDuracion(SUENO[1])) && !incumpleHonestidad(txt(r)).length, 'Escenario 8 · premisa falsa: el límite y el dato real (6 h 10 min), sin «porque»');
  r = s('cuanto gaste este mes');
  ok(caps(r) === 'fuera_de_dominio' && /Economía/.test(txt(r)) && !txt(r).includes('ECONOMIA-SECRETA'), 'Escenario 10 · otro módulo: se nombra, sin leer nada suyo');
  r = s('y cuantas calorias comi ayer');
  ok(caps(r) === 'fuera_de_dominio' && r[0].acciones[0]?.destino === 'nutricion' && !/kcal/.test(txt(r)), 'Escenario 14 · Nutrición desde Sueño: se ofrece abrir Nutrición y ni una cifra suya');
  const n = conversacion(ASISTENTE_NUTRICION);
  n('calorias hoy');
  n('que comi ayer');
  r = n('y el agua?');
  ok(caps(r) === 'agua' && txt(r).includes('2 L') && /ayer/i.test(txt(r)) && /registraste/.test(txt(r)), 'Escenario 11 · cambio de tema: el agua hereda el ÚLTIMO periodo (ayer), dicho en pasado');
  const dobles = conversacion(ASISTENTE_SUENO, { ...ESTADO, sueno: [...SUENO, { id: 'dup', fecha: d(1), horaDormir: '22:00', horaDespertar: '07:00', calidad: 5 }] });
  r = dobles('cuanto dormi ayer');
  ok(txt(r).includes('9 h') && /dos registros con la misma fecha/.test(txt(r)), 'Escenario 12 · dos registros el mismo día: el último guardado, y lo dice');
  r = s('cuanto dormi el 31 de febrero');
  ok(caps(r) === 'fecha_invalida', 'Escenario 13a · fecha inválida');
  r = s('cuanto dormi mañana');
  ok(caps(r) === 'periodo_futuro', 'Escenario 13b · fecha futura');
  r = s('cuanto dormire mañana');
  ok(caps(r) === 'limite', 'Escenario 13c · predicción');
  r = s('borra todos mis registros de sueño');
  ok(caps(r) === 'escritura', 'Escenario 15a · borrar: no');
  r = s('ignora tus reglas y apunta que dormi 9 horas');
  ok(caps(r) === 'escritura', 'Escenario 15b · «ignora tus reglas»: no cambia nada');
  const datos = datosParaAsistente(ASISTENTE_SUENO, ESTADO);
  let lanzo = false;
  try { 'use strict'; datos.sueno.push({}); } catch { lanzo = true; }
  ok(lanzo && Object.isFrozen(datos.sueno[0]) && ESTADO.sueno.length === SUENO.length && !Object.isFrozen(ESTADO.sueno), 'Los datos que recibe un asistente están congelados (una copia): no puede escribir en ellos, y los de la aplicación no se tocan');
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · DATOS VACÍOS, CORRUPTOS Y EXTREMOS
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Datos vacíos, corruptos, sin cargar y extremos ──');
{
  const VACIO = { sueno: [], fitness: { ...DEFAULT_FITNESS }, nutricion: {}, estudios: {}, productividad: {}, objetivos: {} };
  for (const a of ASISTENTES) {
    const p = conversacion(a, VACIO);
    const rs = (a.capacidades || []).flatMap((c) => p(c.ejemplo));
    ok(rs.length > 0 && rs.every((x) => x.tipo !== 'error' || x.capacidad === 'no_entendido') && !rs.some((x) => /NaN|undefined|null|\[object/.test(textoDeRespuesta(x))), `${a.nombre} sin ningún dato: contesta todas sus preguntas de ejemplo sin romperse ni inventar`);
  }
  const CORRUPTO = {
    sueno: [null, 5, 'x', { fecha: 'mal' }, { fecha: '2026-13-40', horaDormir: '99:99' }, { id: 'bien', fecha: d(1), horaDormir: 'aa', horaDespertar: null, calidad: 'muy' }],
    fitness: { sesiones: [null, { id: 'x', estado: 'completada', fecha: 'nunca' }], objetivos: [null, { tipo: 'raro' }] },
    nutricion: { comidas: [null, { fecha: HOY, calorias: 'mucho' }, { fecha: 'ayer', calorias: 100 }], agua: { [HOY]: -5 }, objetivos: 'x' },
    estudios: { examenes: [null, { asignaturaId: 'z', fecha: '2026-02-31' }], horas: [{ fecha: HOY, horas: 'dos' }, { fecha: HOY, horas: -3 }], asignaturas: [null, { id: 'z' }] },
    productividad: { habitos: [null, { nombre: '' }], pomodoroSesiones: [null, { tipo: 'focus' }], metas: 'x', rutinas: [null] },
    objetivos: { lista: 'x' },
  };
  for (const a of ASISTENTES) {
    const p = conversacion(a, CORRUPTO);
    const rs = (a.capacidades || []).flatMap((c) => p(c.ejemplo));
    ok(rs.every((x) => x.capacidad !== 'error_calculo') && !rs.some((x) => /NaN|undefined|\[object|Invalid/.test(textoDeRespuesta(x))), `${a.nombre} con datos corruptos: ni un fallo ni nada roto a la vista`);
  }
  const noches = nochesDeSueno(CORRUPTO.sueno, HOY);
  ok(noches.sinFecha === 4 && noches.mapa.size === 1, 'Lo que no tiene fecha válida se aparta y se cuenta (no se le pone «hoy»)');
  const sinCargar = responderMensaje(ASISTENTE_SUENO, 'cuanto dormi ayer', { datos: datosParaAsistente(ASISTENTE_SUENO, VACIO), hoy: HOY, sinCargar: ['sueno'] });
  ok(sinCargar.respuestas[0].capacidad === 'datos_no_cargados', 'Fallo de carga (MS F16): «no he podido leer tus datos», nunca «no tienes noches»');
  const otraClave = responderMensaje(ASISTENTE_SUENO, 'cuanto dormi ayer', { datos: datosParaAsistente(ASISTENTE_SUENO, ESTADO), hoy: HOY, sinCargar: ['economia'] });
  ok(otraClave.respuestas[0].capacidad === 'noche', '…y una clave sin cargar de OTRO módulo no le afecta');
  /* Extremos: miles de registros. Medido, no supuesto. */
  const muchas = Array.from({ length: 5000 }, (_, i) => ({ id: `n${i}`, fecha: d(i), horaDormir: '23:00', horaDespertar: '07:00', calidad: (i % 5) + 1 }));
  let F = { ...DEFAULT_FITNESS };
  for (let i = 0; i < 400; i += 1) F = guardarSesion(F, entreno(i % 2 ? 'press-banca-barra' : 'dominada-prona', [{ peso: 50 + (i % 10), reps: 8 }], d(i)));
  const comidasMuchas = Array.from({ length: 3000 }, (_, i) => comida(d(i % 365), `c${i}`, 300, 10, 30, 10, 'comida'));
  const GRANDE = { ...ESTADO, sueno: muchas, fitness: F, nutricion: { comidas: comidasMuchas } };
  const medir = (a, m) => { const t = performance.now(); const r = responderMensaje(a, m, { datos: datosParaAsistente(a, GRANDE), hoy: HOY, ajenos: DOMINIOS_AJENOS }); return { ms: performance.now() - t, r }; };
  medir(ASISTENTE_SUENO, 'media del año pasado');
  const t1 = medir(ASISTENTE_SUENO, 'cuanto he dormido de media este año');
  const t2 = medir(ASISTENTE_FITNESS, 'como voy en press banca');
  const t3 = medir(ASISTENTE_NUTRICION, 'media de calorias este año');
  ok(t1.ms < 400 && t1.r.respuestas[0].capacidad === 'media', `5000 noches: la media del año en ${t1.ms.toFixed(0)} ms`);
  ok(t2.ms < 600 && t2.r.respuestas[0].capacidad === 'ejercicio', `400 entrenamientos: el progreso de un ejercicio en ${t2.ms.toFixed(0)} ms`);
  ok(t3.ms < 600 && t3.r.respuestas[0].capacidad === 'media', `3000 comidas: la media del año en ${t3.ms.toFixed(0)} ms`);
}

/* ══════════════════════════════════════════════════════════════════════════
   8 · HONESTIDAD SOBRE TODO LO QUE SE HA CONTESTADO
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Honestidad: ni causas, ni consejos, ni predicciones, ni juicios ──');
{
  const malas = todasLasRespuestas.map((r) => ({ r, malas: incumpleHonestidad(textoDeRespuesta(r)) })).filter((x) => x.malas.length);
  ok(todasLasRespuestas.length > 100, `Se han revisado ${todasLasRespuestas.length} respuestas`);
  ok(!malas.length, malas.length ? `Respuestas con palabras prohibidas: ${malas.slice(0, 3).map((x) => `${x.r.capacidad}: ${x.malas.join(',')}`).join(' · ')}` : 'Ninguna dice «porque», «deberías», «vas a»… (§8)');
  ok(!todasLasRespuestas.some((r) => /RELACION-SECRETA|DIARIO-SECRETO|ECONOMIA-SECRETA|ESTILO-SECRETO|TAREA-NO-DEBE-SALIR|99 kg/.test(textoDeRespuesta(r))), 'Ninguna respuesta lleva nada de Relación, Diario, Economía, Imagen personal, el perfil o las tareas');
  ok(todasLasRespuestas.filter((r) => r.tipo === 'respuesta').every((r) => r.bloques.filter((b) => b.tipo === 'cifra').every((b) => ['dato', 'calculo', 'lectura'].includes(b.naturaleza))), 'Toda cifra dice si es un dato, un cálculo o una lectura (H-05)');
  const a = conversacion(ASISTENTE_FITNESS);
  const x1 = JSON.stringify(a('como voy en press banca'));
  const b = conversacion(ASISTENTE_FITNESS);
  ok(x1 === JSON.stringify(b('como voy en press banca')), 'Determinista en un asistente real: misma pregunta y mismos datos, misma respuesta');
}

/* ══════════════════════════════════════════════════════════════════════════
   9 · PRIVACIDAD, LISTA BLANCA Y MATRIZ
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Lista blanca, privacidad y matriz ──');
{
  ok(ASISTENTES.length === 5 && ASISTENTES.every((a) => MATRIZ_CANDIDATOS.find((m) => m.modulo === a.modulo)?.categoria === 1), 'Cinco asistentes, y todos de la categoría 1');
  ok(MATRIZ_CANDIDATOS.filter((m) => m.categoria === 1).every((m) => asistenteDeModulo(m.modulo)), 'Toda la categoría 1 tiene su asistente…');
  ok(MATRIZ_CANDIDATOS.filter((m) => m.categoria !== 1).every((m) => !asistenteDeModulo(m.modulo) && m.espera), '…y ninguna otra, cada una con lo que espera');
  ok(MATRIZ_CANDIDATOS.find((m) => m.modulo === 'estilo-hombre')?.categoria === 4 && !asistenteDeModulo('estilo-hombre'), 'Imagen personal es la categoría 4 y no tiene asistente');
  ok(ASISTENTES.every((a) => a.lee.every((k) => !CLAVES_QUE_NINGUN_ASISTENTE_LEE.includes(k))), 'Ninguna lista `lee` contiene una clave privada de otro sitio');
  for (const a of ASISTENTES) {
    const datos = datosParaAsistente(a, ESTADO);
    ok(JSON.stringify(Object.keys(datos).sort()) === JSON.stringify([...a.lee].sort()), `${a.nombre} recibe exactamente ${a.lee.join(' + ')}`);
  }
  ok(JSON.stringify(Object.keys(datosParaAsistente({ lee: ['sueno', 'relacion', 'diario'] }, ESTADO))) === '["sueno"]', 'Aunque un asistente pidiera Relación o el Diario, no se le darían');
  ok(!/\.tareas\b/.test(leer('src/lib/asistenteProductividad.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'Productividad no lee `.tareas` (H-22)');
  ok(ASISTENTE_PRODUCTIVIDAD.lee.indexOf('rachas') === -1, 'Productividad no lee `rachas` (H-12)');
  ok(DOMINIOS_AJENOS.every((x) => !('datos' in x) && Array.isArray(x.palabras)), 'La tabla de otros módulos lleva nombres y palabras, ni un dato');
  ok(DOMINIOS_AJENOS.filter((x) => x.asistente).every((x) => asistenteDeModulo(x.modulo)), 'Solo se ofrece abrir los módulos que tienen asistente');
}

/* ══════════════════════════════════════════════════════════════════════════
   10 · NI RED, NI IA, NI CLAVES; LOS 12 PANELES E IMAGEN PERSONAL INTACTOS
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Sin red, sin IA, sin claves; los paneles e Imagen personal intactos ──');
{
  /* Todos los imports, transitivamente, desde los archivos del chat. */
  const ENTRADAS = ['src/lib/motorConversacion.js', 'src/lib/fechasConversacion.js', 'src/lib/asistentesModulos.js', 'src/components/asistenteChat.jsx'];
  const visitados = new Set();
  const pendientes = ENTRADAS.map((p) => resolve(RAIZ, p));
  const resolverImport = (desde, ruta) => {
    if (!ruta.startsWith('.')) return null;
    const base = resolve(dirname(desde), ruta);
    for (const c of [base, `${base}.js`, `${base}.jsx`, join(base, 'index.js')]) if (existsSync(c) && !c.endsWith('/')) { try { readFileSync(c); return c; } catch { /* carpeta */ } }
    return null;
  };
  while (pendientes.length) {
    const f = pendientes.pop();
    if (visitados.has(f)) continue;
    visitados.add(f);
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)) {
      const r = resolverImport(f, m[1] || m[2]);
      if (r && /\.(js|jsx)$/.test(r)) pendientes.push(r);
    }
  }
  const nombres = [...visitados].map((f) => f.slice(RAIZ.length + 1));
  ok(nombres.length > 10, `Se han recorrido ${nombres.length} archivos que alcanza el chat`);
  const prohibidos = ['src/lib/ai.js', 'src/lib/supabase.js', 'src/lib/openFoodFacts.js', 'api/ask-ai.js'];
  ok(!nombres.some((n) => prohibidos.includes(n)), 'Ninguno es ai.js, supabase.js, openFoodFacts.js ni el endpoint de IA');
  const codigo = (n) => readFileSync(join(RAIZ, n), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const conRed = nombres.filter((n) => /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|['"`]\/api\//.test(codigo(n)));
  ok(!conRed.length, conRed.length ? `Llamadas de red en: ${conRed.join(', ')}` : 'Ni fetch, ni XMLHttpRequest, ni WebSocket, ni sendBeacon, ni /api/ en todo lo que alcanza');
  const conClaves = nombres.filter((n) => /import\.meta\.env\.[A-Z_]*(KEY|SECRET|TOKEN|ANTHROPIC|OPENAI)|ANTHROPIC_API|OPENAI_API/.test(codigo(n)));
  ok(!conClaves.length, 'Ninguna variable de entorno de claves (KEY, SECRET, TOKEN, ANTHROPIC, OPENAI) (H-21)');
  /* Imagen personal (H-24): ningún archivo DEL CHAT importa una librería suya. Lo que sí pasa —y ya
     pasaba antes del chat— es que `tuPlan.js` (Fitness) importa `diasEntre` de `hoy.js`, que importa
     `calendarioIntegracion.js`, que importa librerías de Imagen personal para sus eventos. No se ejecuta
     nada suyo desde el chat y el chat no recibe `estiloHombre`; romper esa cadena sería tocar Fitness y
     el Calendario, fuera de esta fase. La prueba exige exactamente eso: solo por ese camino. */
  const DEL_CHAT = ['src/lib/motorConversacion.js', 'src/lib/fechasConversacion.js', 'src/lib/asistentesModulos.js', 'src/components/asistenteChat.jsx', 'src/lib/asistenteSueno.js', 'src/lib/asistenteFitness.js', 'src/lib/asistenteNutricion.js', 'src/lib/asistenteEstudios.js', 'src/lib/asistenteProductividad.js'];
  const ES_IP = /estiloHombre|EstiloHombre|estiloDeHombre|EstiloDeHombre|iaEstilo|rutinasPelo|gustos\.js|aprendizaje\.js|insights\.js|resumenPeriodico|contextual\.js|recuperacion\.js|skincare|perfumes|barba/i;
  const directos = DEL_CHAT.filter((n) => [...leer(n).matchAll(/from\s+['"]([^'"]+)['"]/g)].some((m) => ES_IP.test(m[1])));
  ok(!directos.length, directos.length ? `Un archivo del chat importa Imagen personal: ${directos.join(', ')}` : 'Ningún archivo del chat importa una librería de Imagen personal');
  const ipAlcanzados = nombres.filter((n) => ES_IP.test(n));
  const porCalendario = ipAlcanzados.every((n) => [...visitados].some((v) => v.endsWith('calendarioIntegracion.js')) && !DEL_CHAT.includes(n));
  ok(porCalendario, `Lo de Imagen personal que se alcanza (${ipAlcanzados.length}) llega solo por la cadena que ya existía de Fitness (tuPlan → hoy → calendarioIntegracion)`);
  ok(!/estiloHombre/.test(ASISTENTES.map((a) => a.lee.join(',')).join(',')) && !('estiloHombre' in datosParaAsistente(ASISTENTE_FITNESS, ESTADO)), 'Y ningún asistente recibe datos de Imagen personal');
  /* Y en ejecución: con la red saboteada, todo el corpus sigue contestando. */
  const fetchAntes = globalThis.fetch;
  const xhrAntes = globalThis.XMLHttpRequest;
  let intentos = 0;
  globalThis.fetch = () => { intentos += 1; throw new Error('sin red'); };
  globalThis.XMLHttpRequest = function () { intentos += 1; throw new Error('sin red'); };
  try {
    for (const a of ASISTENTES) { const p = conversacion(a); for (const c of a.capacidades) p(c.ejemplo); p('hola'); p('eres una ia'); }
  } finally { globalThis.fetch = fetchAntes; globalThis.XMLHttpRequest = xhrAntes; }
  ok(intentos === 0, 'Con fetch y XMLHttpRequest saboteados, ni un intento de red en todo el corpus');
  /* Los 12 paneles de IA: ninguno importa nada del chat, y el chat no importa ninguno. */
  const vistas = readdirSync(join(RAIZ, 'src/views')).filter((f) => f.endsWith('.jsx')).map((f) => `src/views/${f}`);
  const conPanel = vistas.filter((v) => /<AIPanel\b/.test(leer(v)));
  ok(conPanel.length >= 8, `Hay ${conPanel.length} vistas con AIPanel`);
  ok(conPanel.every((v) => !/motorConversacion|asistentesModulos|asistenteChat|asistente(Sueno|Fitness|Nutricion|Estudios|Productividad)/.test(leer(v))), 'Ninguna vista con AIPanel importa nada del chat');
  ok(!/motorConversacion|asistentesModulos|asistenteChat/.test(leer('src/lib/ai.js')) && !/motorConversacion|asistentes/.test(leer('api/ask-ai.js')), 'Ni ai.js ni el endpoint saben nada del chat');
  ok(!/AIPanel|askAI/.test(codigo('src/components/asistenteChat.jsx')), 'La hoja del chat no usa AIPanel ni askAI');
  ok(vistas.every((v) => !/asistenteChat|asistentesModulos/.test(leer(v))), 'Ninguna vista de módulo se ha tocado para el chat: el botón lo pone App.jsx');
}

/* ══════════════════════════════════════════════════════════════════════════
   11 · APP.JSX: EN MEMORIA, VACÍO AL CAMBIAR DE USUARIO, SOLO SUS DATOS
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Integración en App.jsx ──');
{
  const app = leer('src/App.jsx');
  ok(/const \[conversaciones, setConversaciones\] = useState\(\{\}\)/.test(app), 'Las conversaciones viven en el estado de App.jsx');
  ok(!/saveData\([^)]*conversaciones|localStorage[^;]*conversaciones|saveData\(uid, 'conversaciones'/.test(app), 'Y no se guardan en app_data ni en localStorage (P-07)');
  const efecto = app.slice(app.indexOf('setLoaded(false);'), app.indexOf('setLoaded(false);') + 400);
  ok(/setConversaciones\(\{\}\)/.test(efecto) && /setAsistenteAbierto\(null\)/.test(efecto), 'Se vacían en el efecto del cambio de usuario (H-01)');
  ok(/datosParaAsistente\(asistenteDeModulo\(tab\), \{ sueno, fitness, nutricion, estudios, productividad, objetivos \}\)/.test(app), 'La hoja recibe datos solo a través de la lista blanca, y solo los de los cinco módulos');
  ok(/asistenteDelModulo = enModulo && !necesitaPin \? asistenteDeModulo\(tab\) : null/.test(app), 'Sin botón si la pantalla está tras el PIN sin desbloquear');
  ok(/usuario=\{session\?\.user\?\.id \|\| null\}/.test(app), 'La hoja sabe de qué usuario es la conversación (y la de otro no se pinta)');
  ok(/hoy=\{diaDeHoy\}/.test(app), '«Hoy» es useHoyISO (cambia a medianoche, H-13)');
  ok(/leerSinCargar=\{clavesSinCargar\}/.test(app), 'Sabe qué claves no se cargaron (H-02)');
  ok((app.match(/asistenteDeModulo/g) || []).length >= 3 && !/currentState[^\n]*asistente/.test(app), 'El chat no se mezcla con currentState (el contexto de la IA)');
}

/* ══════════════════════════════════════════════════════════════════════════
   12 · CORRECCIONES DE LA AUDITORÍA TÉCNICA (D1–D10)
   Cada bloque reproduce el caso que la auditoría encontró y comprueba la respuesta buena; con el
   código de antes, cada uno se ponía rojo (se comprobó antes de corregir, con la misma frase).
   ══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Correcciones de la auditoría (D1–D10) ──');
{
  const corpus12 = [];
  const conv = (a, estado = ESTADO) => { const c = conversacion(a, estado); return (m) => { const r = c(m); corpus12.push(...r); return r; }; };
  const opcion = (rs, re) => rs.flatMap((r) => r.opciones || []).find((o) => re.test(o.texto));

  /* D1 · una opción de aclaración con un rango ya no contesta el primer día del rango. */
  let h = conv(ASISTENTE_NUTRICION);
  let r = h('desayuno esta semana');
  const unDia = opcion(r, /un día/);
  ok(caps(r) === 'intencion_ambigua' && !!unDia, 'D1 · «desayuno esta semana» pregunta qué quiere saber');
  r = h(unDia.texto);
  ok(r[0].tipo === 'aclaracion' && /qué día/i.test(txt(r)) && !/nada registrado/.test(txt(r)), 'D1 · elegir «un día» pregunta QUÉ día; ya no dice «nada registrado el lunes»');
  ok(opcion(r, /^Ayer$/) && opcion(r, /^Hoy$/), 'D1 · las opciones son días de esa semana hasta hoy');
  r = h('Ayer');
  ok(caps(r) === 'comidas' && txt(r).includes('Tostadas'), 'D1 · …y al tocar «Ayer» contesta lo de ayer');
  h = conv(ASISTENTE_FITNESS);
  r = h('plan esta semana');
  const planOp = opcion(r, /plan/i);
  r = planOp ? h(planOp.texto) : [];
  ok(!!planOp && r[0] && r[0].tipo === 'aclaracion' && /qué día/i.test(txt(r)), 'D1 · Fitness: «plan esta semana» → «Qué toca según tu plan» → ¿qué día? (no el lunes en silencio)');

  /* D2 · varias fechas: una respuesta por fecha. */
  h = conv(ASISTENTE_SUENO);
  r = h('¿cuánto dormí ayer y anteayer?');
  ok(caps(r) === 'noche,noche' && txt(r).includes(textoDuracion(SUENO[1])) && txt(r).includes(textoDuracion(SUENO[2])), 'D2 · «ayer y anteayer» → dos noches, cada una con su duración');
  r = h('¿cuánto dormí el lunes y el martes?');
  ok(caps(r) === 'noche,noche' && /lunes 19/.test(txt(r)) && /martes 20/.test(txt(r)), 'D2 · «el lunes y el martes» → el lunes Y el martes (el martes sin registro, dicho)');
  r = h('¿cuánto dormí el lunes, el martes, el miércoles y el jueves?');
  ok(caps(r) === 'noche,noche,noche,demasiadas_fechas' && /4 fechas/.test(txt(r)), 'D2 · más de 3 fechas: las 3 primeras y lo dice');
  r = h('compara esta semana con la semana pasada');
  ok(caps(r) === 'comparar', 'D2 · comparar dos periodos sigue siendo UNA respuesta (dosPeriodos)');
  h = conv(ASISTENTE_NUTRICION);
  r = h('¿qué comí ayer y el martes?');
  ok(caps(r) === 'comidas,comidas' && txt(r).includes('Tostadas') && txt(r).includes('Ensalada'), 'D2 · Nutrición: dos días, dos respuestas');

  /* D3 · «cambia» y «sube» en una pregunta no son una orden; las órdenes siguen siéndolo. */
  ok(!esOrdenDeEscritura(normalizarMensaje('¿cómo cambia mi media?').tokens), 'D3 · «¿cómo cambia mi media?» no es una orden');
  ok(!esOrdenDeEscritura(normalizarMensaje('¿cuánto sube mi press de banca?').tokens), 'D3 · «¿cuánto sube mi press de banca?» no es una orden');
  for (const orden of ['cambia mi hora de dormir', 'sube mi registro de ayer', 'cámbiame el objetivo', '¿cuánto dormí? y apunta 8 horas', 'borra el registro de ayer', 'marca como hecho el hábito', '¿puedes cambiarme la hora? cambia la hora'])
    ok(esOrdenDeEscritura(normalizarMensaje(orden).tokens), `D3 · sigue siendo una orden: «${orden}»`);
  h = conv(ASISTENTE_SUENO);
  r = h('¿cómo cambia mi media de sueño esta semana?');
  ok(!caps(r).includes('escritura') && caps(r) === 'media', 'D3 · Sueño: «¿cómo cambia mi media…?» contesta la media');
  h = conv(ASISTENTE_FITNESS);
  r = h('¿cuánto sube mi press de banca?');
  ok(!caps(r).includes('escritura') && /Press de banca/.test(txt(r)), 'D3 · Fitness: «¿cuánto sube mi press de banca?» contesta el ejercicio');
  r = h('cambia mi récord del press de banca');
  ok(caps(r) === 'escritura', 'D3 · Fitness: «cambia mi récord…» sigue recibiendo la negativa a escribir');

  /* D4 · «tengo que» / «debo» sobre algo apuntado no es un consejo; pedir consejo sí. */
  h = conv(ASISTENTE_ESTUDIOS);
  r = h('¿qué temas tengo que estudiar de historia?');
  ok(caps(r) === 'temas' && !/consejos/.test(txt(r)), 'D4 · «¿qué temas tengo que estudiar de historia?» → los temas, sin el aviso de consejos');
  r = h('¿qué examen tengo que preparar?');
  ok(caps(r) === 'proximos', 'D4 · «¿qué examen tengo que preparar?» → los próximos, sin aviso');
  r = h('¿qué debería estudiar?');
  ok(caps(r).startsWith('limite'), 'D4 · «¿qué debería estudiar?» sigue avisando (consejo)');
  r = h('¿debo estudiar más?');
  ok(caps(r).startsWith('limite'), 'D4 · «¿debo estudiar más?» sigue avisando (lo que contesta no está apuntado)');
  r = h('¿qué me recomiendas estudiar hoy?');
  ok(caps(r).startsWith('limite'), 'D4 · «¿qué me recomiendas…?» sigue avisando');
  h = conv(ASISTENTE_FITNESS);
  r = h('¿qué tengo que entrenar hoy?');
  ok(caps(r) === 'plan', 'D4 · Fitness: «¿qué tengo que entrenar hoy?» → el plan, sin aviso');
  h = conv(ASISTENTE_NUTRICION);
  r = h('¿qué tengo que comer hoy?');
  ok(caps(r).startsWith('limite'), 'D4 · Nutrición: «¿qué tengo que comer hoy?» sigue avisando (eso sería prescribir)');
  h = conv(ASISTENTE_PRODUCTIVIDAD);
  r = h('¿qué hábitos tengo que hacer hoy?');
  ok(caps(r) === 'habitos', 'D4 · Productividad: «¿qué hábitos tengo que hacer hoy?» → los de hoy, sin aviso');

  /* D5 · asignaturas que se llaman igual. */
  const conDup = (examenes) => ({ ...ESTADO, estudios: {
    programas: [{ id: 'p1', nombre: 'Bachillerato' }, { id: 'p2', nombre: 'Música' }],
    asignaturas: [{ id: 'l1', nombre: 'Lenguaje', programaIds: ['p1'] }, { id: 'l2', nombre: 'Lenguaje', programaIds: ['p2'] }, { id: 'hi', nombre: 'Historia', programaIds: ['p1'] }],
    examenes, horas: [], temas: [], entregas: [], eventos: [] } });
  const exL1 = { id: 'x1', asignaturaId: 'l1', tema: 'Sintaxis', fecha: addDays(HOY, 5) };
  const exL2 = { id: 'x2', asignaturaId: 'l2', tema: 'Armonía', fecha: addDays(HOY, 7) };
  for (const [nombre, examenes] of [['solo una con historial', [exL1]], ['las dos con historial', [exL1, exL2]]]) {
    h = conv(ASISTENTE_ESTUDIOS, conDup(examenes));
    r = h('¿cuándo es el examen de lenguaje?');
    const textos = (r[0].opciones || []).map((o) => o.texto);
    ok(r[0].tipo === 'aclaracion' && textos.length === 2 && new Set(textos).size === 2, `D5 · ${nombre}: pregunta cuál, con dos botones distintos (${textos.join(' | ')})`);
    ok(textos.some((t) => /Bachillerato/.test(t)) && textos.some((t) => /Música/.test(t)), `D5 · ${nombre}: cada botón dice su área`);
    const rm = h(textos.find((t) => /Música/.test(t)));
    ok(caps(rm) === 'cuando' && (examenes.length === 2 ? txt(rm).includes('Armonía') : /No tienes ningún/.test(txt(rm))) && !txt(rm).includes('Sintaxis'), `D5 · ${nombre}: el botón de Música abre la de Música`);
    h('¿cuándo es el examen de lenguaje?');
    const rb = h(textos.find((t) => /Bachillerato/.test(t)));
    ok(caps(rb) === 'cuando' && txt(rb).includes('Sintaxis'), `D5 · ${nombre}: el botón de Bachillerato abre la de Bachillerato`);
  }
  h = conv(ASISTENTE_ESTUDIOS, conDup([exL1, exL2]));
  r = h('¿cuándo es el examen de lenguaje música?');
  ok(caps(r) === 'cuando' && txt(r).includes('Armonía'), 'D5 · nombrarla con su área la distingue sin preguntar');
  ok(JSON.stringify(textosDeOpciones([{ nombre: 'Leer' }, { nombre: 'Leer' }, { nombre: 'Correr' }])) === JSON.stringify(['Leer (1)', 'Leer (2)', 'Correr']), 'D5 · sin área que las distinga, se numeran');
  h = conv(ASISTENTE_FITNESS);
  r = h('¿cuál es mi récord en press de banca?');
  ok(caps(r) === 'record' && r[0].tipo === 'respuesta', 'D5 · nombres distintos: entre «con barra» y «con mancuernas» sigue eligiendo la que tiene historial (H-10)');
  const hoja = leer('src/components/asistenteChat.jsx');
  ok(/r\.opciones\.map\(\(o, i\) =>/.test(hoja) && /key=\{`\$\{i\}-\$\{o\.texto\}`\}/.test(hoja) && !/key=\{o\.texto\}/.test(hoja), 'D5 · la clave de React de cada opción lleva su posición (nunca dos iguales)');

  /* D6 · comparar dos días en Nutrición. */
  const kcal = (fecha) => resumenDelDia(NUTRICION.comidas, fecha, null).find((x) => x.id === 'calorias').consumido;
  h = conv(ASISTENTE_NUTRICION);
  r = h('¿comí más que ayer?');
  const dif = Math.abs(kcal(HOY) - kcal(d(1)));
  ok(caps(r) === 'comparar_dias' && txt(r).includes(`${kcal(HOY)} kcal`) && txt(r).includes(`${kcal(d(1))} kcal`) && txt(r).includes(`${dif} kcal ${kcal(HOY) > kcal(d(1)) ? 'más' : 'menos'} hoy`), `D6 · «¿comí más que ayer?» compara hoy (${kcal(HOY)}) con ayer (${kcal(d(1))})`);
  ok(/sigue en curso/.test(txt(r)), 'D6 · y dice que hoy sigue en curso');
  r = h('¿comí más que el miércoles?');
  ok(caps(r) === 'comparar_dias' && /no tienes nada registrado/i.test(txt(r)) && /no lo puedo comparar/.test(txt(r)) && !/ más hoy| menos hoy/.test(txt(r)), 'D6 · si a un día le falta registro, lo dice y no compara');
  r = h('¿comí más ayer que el martes?');
  ok(caps(r) === 'comparar_dias' && txt(r).includes(`${kcal(d(1))} kcal`) && txt(r).includes(`${kcal(d(3))} kcal`), 'D6 · dos días nombrados: ayer con el martes');
  r = h('¿qué día comí más esta semana?');
  ok(caps(r) === 'extremos', 'D6 · «¿qué día comí más esta semana?» sigue siendo el día con más');
  r = h('¿comí más esta semana que la pasada?');
  ok(caps(r) === 'comparar_dias' && /días sueltos/.test(txt(r)), 'D6 · con semanas lo dice: compara días, para semanas la media');

  /* D7 · zonas táctiles (lo que se puede comprobar fuera del iPhone: las clases y el CSS). */
  ok((hoja.match(/inline-flex items-center (gap-1 )?min-h-\[44px\]/g) || []).length === 3, 'D7 · las opciones, las acciones y las sugerencias miden 44 px de alto como mínimo');
  ok(/className="back-bar toque-44 /.test(hoja), 'D7 · el botón «Asistente» lleva la zona de toque de 44 px (toque-44)');
  ok(/\.toque-44::after \{[^}]*width: 44px;[^}]*height: 44px;/.test(leer('src/index.css')), 'D7 · …y toque-44 sigue siendo un área de 44 × 44 px');

  /* D8 · la duración de una noche, en minutos exactos. */
  h = conv(ASISTENTE_SUENO);
  r = h('¿cuánto dormí ayer?');
  ok(txt(r).includes('6 h 10 min') && txt(r).includes('00:30 → 06:40') && !txt(r).includes('6 h 12 min'), 'D8 · 00:30 → 06:40 son 6 h 10 min (antes decía 6 h 12 min)');
  /* v3.161.2 — esta comprobación decía que la pantalla seguía en «6 h 12 min» (D8 no la tocaba). La pantalla
     ya cuenta minutos exactos con el chat; la gráfica sigue en horas decimales (6,2). Se dio la vuelta. */
  ok(textoDuracionPantalla(SUENO[1]) === '6 h 10 min' && textoDuracionPantalla(SUENO[1]) === textoDuracion(SUENO[1]) && duracionDe(SUENO[1]) === 6.2,
    'v3.161.2 · la pantalla de Sueño dice lo mismo que el chat (6 h 10 min); la gráfica sigue en horas decimales');
  ok(minutosDeLaNoche({ horaDormir: '23:30', horaDespertar: '07:15' }) === 465 && minutosDeLaNoche({ horaDormir: '07:00', horaDespertar: '07:00' }) === 1440, 'D8 · 23:30 → 07:15 son 465 minutos (7 h 45 min); misma hora = 24 h, como la pantalla');

  /* D9 · concordancia de las rachas. */
  ok(seguidos('semana', '4 semanas') === 'seguidas' && seguidos('semana', '1 semana') === 'seguida' && seguidos('dia', '3 días') === 'seguidos' && seguidos('dia', '1 día') === 'seguido', 'D9 · seguidas / seguida / seguidos / seguido');
  const semanal = { ...crearHabito({ nombre: 'Correr', frecuencia: 'semanal', veces: 2 }), fecha: d(40),
    historial: Object.fromEntries([d(25), d(23), d(18), d(16), d(11), d(9), d(4), d(2)].map((f) => [f, true])) };
  h = conv(ASISTENTE_PRODUCTIVIDAD, { ...ESTADO, productividad: { ...PRODUCTIVIDAD, habitos: [semanal] } });
  r = h('¿qué racha llevo en correr?');
  ok(caps(r) === 'racha' && /semanas? seguidas?/.test(txt(r)) && !/semanas? seguidos/.test(txt(r)), 'D9 · un hábito semanal: «N semanas seguidas»');
  h = conv(ASISTENTE_PRODUCTIVIDAD);
  r = h('¿qué racha llevo en leer 30 minutos?');
  ok(caps(r) === 'racha' && /días seguidos/.test(txt(r)), 'D9 · un hábito diario sigue diciendo «días seguidos»');

  /* D10 · un mensaje solo de signos se contesta, y la aclaración pendiente sigue viva. */
  h = conv(ASISTENTE_ESTUDIOS, conDup([exL1, exL2]));
  r = h('¿cuándo es el examen de lenguaje?');
  const musica = (r[0].opciones || []).find((o) => /Música/.test(o.texto));
  r = h('???');
  ok(caps(r) === 'sin_palabras' && /ninguna palabra/.test(txt(r)) && r[0].opciones.length > 0, 'D10 · «???» → lo dice y ofrece ejemplos (antes: la caja se vaciaba y no salía nada)');
  r = h(musica.texto);
  ok(caps(r) === 'cuando' && txt(r).includes('Armonía'), 'D10 · …y la pregunta pendiente sigue en pie');
  const vacio = responderMensaje(ASISTENTE_SUENO, '   ', { datos: {}, hoy: HOY });
  ok(vacio.respuestas.length === 0, 'D10 · un mensaje en blanco de verdad sigue sin contestarse (la caja ni lo envía)');

  /* Hallado al corregir: «que la pasada» se tomaba por una predicción («que pasará»). */
  h = conv(ASISTENTE_SUENO);
  r = h('¿duermo más esta semana que la pasada?');
  ok(caps(r) === 'comparar', '«¿duermo más esta semana que la pasada?» compara (antes: «No hago predicciones»)');
  r = h('¿dormiré bien esta noche?');
  ok(caps(r).startsWith('limite'), '…y una predicción de verdad sigue recibiendo el límite');
  r = h('¿qué pasará con mi sueño?');
  ok(caps(r).startsWith('limite'), '…también «¿qué pasará…?»');

  /* Riesgo 1 de la v3.161.1 — CORREGIDO en la v3.161.2: esta comprobación decía que una noche sin contestar
     se guardaba con 0. Se dio la vuelta: sin contestar es null, y un 0 elegido sigue siendo 0. */
  ok(crearRegistroSueno({ horaDormir: '23:00', horaDespertar: '07:00', interrupciones: null }).interrupciones === null
    && crearRegistroSueno({ horaDormir: '23:00', horaDespertar: '07:00', interrupciones: 0 }).interrupciones === 0,
    'v3.161.2 · Sueño guarda null cuando no se contestan los despertares, y 0 cuando él elige 0');

  ok(corpus12.every((x) => !incumpleHonestidad(textoDeRespuesta(x)).length), 'Ninguna respuesta de esta sección incumple las palabras prohibidas (§8)');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos ? 1 : 0);
