/* Integración de los chatbots (v3.161.2) — calidad de los datos de Sueño y botones de aclaración.
   ═══════════════════════════════════════════════════════════════════════════

   1. La duración de una noche es UNA cuenta, en minutos exactos (`minutosEntreHoras`, helpers.js):
      la pantalla, la media, la exportación y el asistente dicen lo mismo («23:30 → 07:15» = 7 h 45 min).
   2. Los despertares sin contestar son `null`, no 0, desde el formulario hasta el asistente.
   3. «Tus últimas noches registradas»: lee los últimos registros, no rellena huecos, no saca tendencias
      y dice qué le falta (`CALIDAD_ANALISIS_SUENO`).
   4. Un botón de aclaración solo vale mientras su pregunta es la pendiente.
   5. (v3.161.3) Datos incompletos de Sueño y el botón «Analizar mi sueño»:
      A. la siesta es sí / no / sin contestar (null), y sin contestar no cuenta como «no»;
      B. ninguna hora se inventa: una noche sin las dos horas no tiene duración y no entra en las cuentas
         de duración, pero lo demás que apuntó sí cuenta;
      C. las noches se eligen por su FECHA, no por el orden en que se guardaron;
      D. «Analizar mi sueño» empieza una conversación que sigue con contexto y sin contradecirse.

   node --import ./scripts/resolver-vite.mjs scripts/test-integracion-chatbots.mjs */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcularDuracion, minutosEntreHoras, formatHoras } from '../src/lib/helpers.js';
import {
  normalizarRegistro, crearRegistroSueno, normalizarSueno, duracionDe, minutosDeNoche, textoDuracion, textoMinutos,
  mediaDeMinutos, mediaDeHoras, resumenNoche, ventanaDeDias, mediaDeVentana, mediaMinutosDeVentana, CALIDAD_ANALISIS_SUENO, DIAS_VENTANA,
} from '../src/lib/sueno.js';
import { buildExportRows } from '../src/lib/exportData.js';
import { ASISTENTE_SUENO, minutosDeLaNoche, TEXTO_ANALIZAR_SUENO } from '../src/lib/asistenteSueno.js';
import { responderMensaje, nuevaConversacion, textoDeRespuesta, incumpleHonestidad, conversarCon, conversacionVacia } from '../src/lib/motorConversacion.js';
import { nochesPorFechaReciente, ultimaNoche, horasQueFaltan, nocheTieneAlgo, nochesSinHorasDeVentana } from '../src/lib/sueno.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  else { fallos += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}
const HOY = '2026-10-23'; // viernes
const VACIO_EXPORT = {
  sueno: [], calistenia: {}, futbol: [], economia: { movimientos: [] }, salud: { historial: [], medidas: [] },
  nutricion: { agua: {}, comidas: [] }, estudios: { examenes: [], horas: [] }, negocio: { proyectos: [] },
  productividad: { habitos: [], metas: [], tareas: [] }, objetivos: { lista: [] }, calendario: { eventos: [] },
  diario: { entradas: [] }, biblioteca: { apuntes: [], enlaces: [] }, fe: { diario: [], eventos: [], objetivos: [], servicio: [] },
  bienestar: { reflexiones: [], registros: [], sesiones: [] },
};
const exportarSueno = (sueno) => buildExportRows({ ...VACIO_EXPORT, sueno }).filter((f) => f.modulo === 'Sueño');
const noche = (fecha, a, b, extra = {}) => ({ id: `n-${fecha}`, fecha, horaDormir: a, horaDespertar: b, calidad: 4, ...extra });

/* ── 1 · La duración, en minutos exactos ─────────────────────────────── */
console.log('\n── 1. La duración de una noche: una sola cuenta, en minutos exactos ──');
ok(minutosEntreHoras('23:30', '07:15') === 465, 'Normal: 23:30 → 07:15 son 465 minutos');
ok(textoDuracion(noche(HOY, '23:30', '07:15')) === '7 h 45 min', '…y la pantalla de Sueño dice 7 h 45 min (antes decía 7 h 48 min)');
ok(minutosEntreHoras('00:30', '06:40') === 370 && textoDuracion(noche(HOY, '00:30', '06:40')) === '6 h 10 min', 'Después de medianoche: 00:30 → 06:40 = 6 h 10 min');
ok(minutosEntreHoras('22:00', '06:00') === 480, 'Cruzando la medianoche: 22:00 → 06:00 = 8 h');
ok(minutosEntreHoras('23:59', '00:01') === 2, 'Cambio de día por un minuto: 23:59 → 00:01 = 2 min');
ok(minutosEntreHoras('07:00', '07:00') === 1440, 'La misma hora es un día entero (lo que ya hacía calcularDuracion)');
ok(minutosEntreHoras('13:00', '15:30') === 150, 'Sin cruzar la medianoche (una siesta larga): 2 h 30 min');
ok(minutosEntreHoras('23:01', '07:14') === 493 && textoDuracion(noche(HOY, '23:01', '07:14')) === '8 h 13 min', 'Minutos exactos: 23:01 → 07:14 = 8 h 13 min');
ok(minutosEntreHoras(null, '07:00') === null && minutosEntreHoras('23:00', undefined) === null && minutosEntreHoras('', '07:00') === null, 'Incompleto: sin una de las dos horas, null');
ok(['25:00', '23:60', '7:5', '7:05', 'ab:cd', '23-00', 2300].every((h) => minutosEntreHoras(h, '07:00') === null && calcularDuracion(h, '07:00') === null), 'Horas imposibles («25:00», «23:60», «7:5», un número…): null, nunca un número');
ok(textoDuracion({ fecha: HOY, horaDormir: '25:99', horaDespertar: '07:00' }) === null, '…y el texto tampoco se inventa');
ok(calcularDuracion('23:30', '07:15') === 7.8 && duracionDe(noche(HOY, '23:30', '07:15')) === 7.8, 'La gráfica sigue en horas decimales (7,8) y sale de los mismos minutos');
ok(minutosDeNoche(noche(HOY, '23:30', '07:15')) === minutosDeLaNoche(noche(HOY, '23:30', '07:15')), 'El asistente usa la MISMA función que la pantalla (minutosDeNoche, reexportada)');
ok(textoMinutos(0) === '0 min' && textoMinutos(null) === null && textoMinutos(NaN) === null, 'textoMinutos: 0 es «0 min», sin dato es null');
const tres = [noche('2026-10-21', '23:30', '07:15'), noche('2026-10-22', '23:30', '07:15'), noche('2026-10-23', '00:00', '07:45')];
ok(mediaDeMinutos(tres) === 465 && textoMinutos(mediaDeMinutos(tres)) === '7 h 45 min', 'La media es de minutos exactos: tres noches de 7 h 45 min dan 7 h 45 min');
ok(mediaDeHoras(tres) === 7.8, '…y la misma media en horas decimales para quien las pida');
ok(mediaDeMinutos([noche(HOY, '23:00', '07:00'), { fecha: HOY, horaDormir: 'x', horaDespertar: 'y' }]) === 480, 'Una noche sin horas válidas no entra en la media (no cuenta como 0)');
ok(mediaDeMinutos([]) === null && mediaDeHoras([]) === null, 'Sin noches no hay media');
const v = ventanaDeDias(tres, { hoy: HOY, desplazamiento: 0, dias: DIAS_VENTANA });
ok(mediaMinutosDeVentana(v) === 465 && mediaDeVentana(v) === 7.8, 'La media de la ventana de la pantalla: 465 min (7,8 h en la gráfica)');
const VISTA = leer('src/views/SleepView.jsx');
ok(/mediaMinutosDeVentana/.test(VISTA) && /textoMinutos\(media\)/.test(VISTA) && !/formatHoras\(media\)/.test(VISTA), 'La pantalla de Sueño pinta la media en horas y minutos exactos, no en décimas');
const filas = exportarSueno([noche(HOY, '23:30', '07:15', { interrupciones: null })]);
ok(filas.length === 1 && filas[0].valor === `${formatHoras(7.8)} h`, 'La exportación conserva su columna en horas decimales (7.8 h), de los mismos minutos');

/* ── 2 · Los despertares sin contestar ───────────────────────────────── */
console.log('\n── 2. Despertares sin contestar: null de punta a punta ──');
ok(crearRegistroSueno({ horaDormir: '23:00', horaDespertar: '07:00', interrupciones: null }).interrupciones === null, 'El formulario sin contestar guarda null (antes 0)');
ok(crearRegistroSueno({ horaDormir: '23:00', horaDespertar: '07:00', interrupciones: 0 }).interrupciones === 0, 'Un 0 elegido es 0');
ok(normalizarRegistro({ fecha: HOY, horaDormir: '23:00', horaDespertar: '07:00' }).interrupciones === null, 'Un registro sin el campo carga como null (no se inventa un 0)');
ok(normalizarRegistro({ fecha: HOY, interrupciones: '' }).interrupciones === null && normalizarRegistro({ fecha: HOY, interrupciones: 'x' }).interrupciones === null, 'Vacío o basura: null');
ok(normalizarRegistro({ fecha: HOY, interrupciones: 9 }).interrupciones === 3, 'Un número mayor se acota a 3 («3+»), como siempre');
const sinContestar = normalizarRegistro({ fecha: HOY, horaDormir: '23:30', horaDespertar: '07:15', calidad: 4 });
ok(duracionDe(sinContestar) === 7.8 && textoDuracion(sinContestar) === '7 h 45 min' && sinContestar.calidad === 4, 'Una noche sin contestar los despertares sigue siendo válida para lo demás');
ok(normalizarSueno([sinContestar, { ...sinContestar, interrupciones: 0 }]).length === 2, 'Ningún registro se descarta por no tener los despertares');
ok(resumenNoche(sinContestar).extras === null && [resumenNoche(sinContestar).duracion, resumenNoche(sinContestar).horas].every((t) => typeof t === 'string' && !/null|undefined|NaN/.test(t)), 'La lista de la pantalla no escribe «null» (y no inventa «0 interrupciones»)');
const exp = exportarSueno([noche(HOY, '23:30', '07:15', { interrupciones: null }), noche('2026-10-22', '23:30', '07:15', { interrupciones: 0 })]);
ok(exp.some((f) => /interrupciones sin contestar/.test(f.extra)) && exp.some((f) => /interrupciones 0/.test(f.extra)), 'La exportación dice «sin contestar» y «0» por separado (antes los dos salían 0)');
let ctx = nuevaConversacion('u');
const pS = (sueno, m, extra = {}) => { const r = responderMensaje(ASISTENTE_SUENO, m, { datos: { sueno }, hoy: HOY, contexto: nuevaConversacion('u'), ajenos: [], ahora: 1, ...extra }); return r.respuestas; };
const txt = (rs) => rs.map(textoDeRespuesta).join(' | ');
let r = pS([noche('2026-10-22', '23:30', '07:15')], 'cuanto dormi ayer');
ok(/Te despertaste: sin contestar/.test(txt(r)), 'El asistente: una noche sin contestar dice «sin contestar»');
r = pS([noche('2026-10-22', '23:30', '07:15', { interrupciones: 0 })], 'cuanto dormi ayer');
ok(/Te despertaste: ninguna vez/.test(txt(r)), '…y un 0 elegido, «ninguna vez»');
const semana = [noche('2026-10-19', '23:00', '07:00', { interrupciones: 2 }), noche('2026-10-20', '23:00', '07:00', { interrupciones: 0 }), noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')];
r = pS(semana, 'cuantas veces me desperte esta semana');
ok(/te despertaste: 1 de 2/.test(txt(r)) && /2 noches no tienen contestado/.test(txt(r)) && !/de 4/.test(txt(r).split('Días con siesta')[0]), 'Despertares de un periodo: cuenta solo las contestadas y dice cuántas faltan');
r = pS([noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')], 'cuantas veces me desperte esta semana');
ok(/no contestaste en ninguna noche si te despertaste/.test(txt(r)) && !/te despertaste: 0 de 2/.test(txt(r)), 'Sin ninguna contestada: lo dice, no «0 de 2»');

/* ── 3 · Tus últimas noches registradas ──────────────────────────────── */
console.log('\n── 3. Las últimas noches registradas: lo que hay, lo que falta ──');
const Q = CALIDAD_ANALISIS_SUENO;
ok(Q.noches === DIAS_VENTANA && Q.diasReciente === DIAS_VENTANA && Q.diasSeparadas === 2 * DIAS_VENTANA && Q.minimoFiable === 3 && Object.isFrozen(Q), 'Las reglas están declaradas en un solo sitio y salen de la ventana de la pantalla');
const AS = leer('src/lib/asistenteSueno.js');
ok(/CALIDAD_ANALISIS_SUENO/.test(AS) && !/haceDias > 7\b|abarca > 14\b/.test(AS), 'El asistente no escribe los umbrales a mano');
r = pS([], 'analiza mi sueño');
ok(r[0].capacidad === 'ultimas' && r[0].sinDatos && /ninguna noche registrada/.test(txt(r)), 'Sin noches: lo dice, sin cifras');
r = pS([noche('2026-10-22', '23:30', '07:15')], '¿Cómo han ido mis últimas noches?');
ok(r[0].capacidad === 'ultimas' && r[0].confianza === 'pocos_datos' && /Solo tengo una noche/.test(txt(r)) && /no hay media/.test(txt(r)) && !/Media:/.test(txt(r)), 'Una sola noche: sin media ni tendencia, y dice que hacen falta más');
const ocho = Array.from({ length: 8 }, (_, i) => noche(`2026-10-${String(15 + i).padStart(2, '0')}`, i % 2 ? '23:30' : '23:00', '07:15', { interrupciones: i % 3 === 0 ? 1 : 0 }));
r = pS(ocho, 'analiza mi sueño');
const elegidas = ocho.slice(-7);
ok(r[0].confianza === 'normal' && /últimas 7 noches/.test(txt(r)) && txt(r).includes(`Media: ${textoMinutos(mediaDeMinutos(elegidas))}`), `Siete noches seguidas y recientes: la media es la de las 7 últimas (${textoMinutos(mediaDeMinutos(elegidas))}), la de la pantalla`);
ok(!/tendencia (sube|baja)|mejorando|empeorando|cada vez/i.test(txt(r)) && /no saca tendencias/.test(txt(r)), 'No calcula tendencias ni causas, y lo dice');
r = pS([noche('2026-10-18', '23:00', '07:00'), noche('2026-10-20', '23:00', '07:00'), noche('2026-10-22', '23:30', '07:15')], 'analiza mi sueño');
ok(/2 días sin registro/.test(txt(r)) && /no es una noche de 0 horas/.test(txt(r)) && txt(r).includes(`Media: ${textoMinutos(mediaDeMinutos([noche('a', '23:00', '07:00'), noche('a', '23:00', '07:00'), noche('a', '23:30', '07:15')]))}`), 'Huecos entre noches: se cuentan y no entran en la media como 0');
r = pS([noche('2026-09-01', '23:00', '07:00'), noche('2026-09-20', '23:00', '07:00'), noche('2026-10-22', '23:30', '07:15')], 'analiza mi sueño');
ok(r[0].confianza === 'pocos_datos' && /muy separadas/.test(txt(r)) && /abarcan 52 días/.test(txt(r)), 'Noches muy separadas (más de 14 días): lo avisa y la marca con pocos datos');
r = pS([noche('2026-10-01', '23:00', '07:00'), noche('2026-10-02', '23:00', '07:00'), noche('2026-10-03', '23:00', '07:00')], 'analiza mi sueño');
ok(r[0].confianza === 'pocos_datos' && /hace 20 días/.test(txt(r)) && /hacen falta noches más recientes/.test(txt(r)), 'Noches poco recientes: dice que describen cómo dormía entonces y pide más recientes');
r = pS([noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')], 'analiza mi sueño');
ok(r[0].confianza === 'pocos_datos' && /Con solo 2 noches/.test(txt(r)), 'Dos noches: hay media, marcada como poco fiable');
r = pS([noche('2026-10-20', '23:00', '07:00', { interrupciones: 1 }), noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00', { interrupciones: 0 })], 'analiza mi sueño');
ok(/te despertaste: 1 de 2/.test(txt(r)) && /1 noche no tiene contestado/.test(txt(r)), 'En el análisis, los despertares sin contestar tampoco cuentan como 0');
r = pS([noche('2026-10-20', '23:00', '07:00'), noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')], 'analiza mi sueño');
ok(/Todas duraron: 8 h/.test(txt(r)) && !/La más larga/.test(txt(r)), 'Todas iguales: no inventa una «más larga» y una «más corta»');
r = pS([noche('2026-10-10', '23:00', '07:00'), noche('2026-10-20', '23:00', '07:00'), noche('2026-10-22', '23:30', '07:15'), { id: 'fut', fecha: '2026-10-30', horaDormir: '23:00', horaDespertar: '07:00' }], 'analiza mis ultimas noches de esta semana');
ok(/últimas 2 noches registradas esta semana/.test(txt(r)) && !/10 de octubre/.test(txt(r)) && /todavía no ha llegado/.test(txt(r)), 'Con un periodo en la pregunta, solo mira ese periodo; lo futuro no cuenta y se dice');
ok(pS([noche('2026-10-22', '23:30', '07:15')], 'cuanto dormi anoche')[0].capacidad === 'noche' && pS(ocho, 'cuanto he dormido de media esta semana')[0].capacidad === 'media', 'Las preguntas de siempre siguen yendo a su capacidad');
const corpus = [];
for (const s of [[], [noche('2026-10-22', '23:30', '07:15')], ocho, semana]) for (const m of ['analiza mi sueño', 'mis ultimas noches', 'cuantas veces me desperte esta semana', 'cuanto dormi ayer']) corpus.push(...pS(s, m));
ok(corpus.every((x) => !incumpleHonestidad(textoDeRespuesta(x)).length && !/undefined|NaN|null/.test(textoDeRespuesta(x))), 'Ninguna respuesta de esta sección incumple las palabras prohibidas ni enseña nada roto');

/* ── 4 · Los botones de aclaración ───────────────────────────────────── */
console.log('\n── 4. Un botón de aclaración solo vale para su pregunta ──');
const EJ = [
  { tipo: 'ejercicio', id: 'pb', nombre: 'Press de banca', alias: [], reciente: 20261020 },
  { tipo: 'ejercicio', id: 'pm', nombre: 'Press militar', alias: [], reciente: 20261001 },
  { tipo: 'ejercicio', id: 'dp', nombre: 'Dominadas pronas', alias: [], reciente: 20261015 },
  { tipo: 'ejercicio', id: 'ds', nombre: 'Dominadas supinas', alias: [], reciente: 20261010 },
];
let llamadas = [];
const capa = (id, extra) => ({ id, titulo: id, ejemplo: `ejemplo ${id}`, ejecutar: (datos, args) => { llamadas.push({ id, args }); return { bloques: [{ tipo: 'texto', texto: `${id}:${args.periodo ? `${args.periodo.desde}..${args.periodo.hasta}` : '-'}:${args.entidad ? args.entidad.id : '-'}` }], fuente: 'prueba' }; }, ...extra });
const ASIS = {
  id: 'prueba', modulo: 'prueba', nombre: 'Prueba', lee: ['x'], saludo: 'Hola.',
  lexico: { progreso: ['como voy'], dia: ['que dia'] },
  capacidades: [
    capa('ejercicio', { senales: { progreso: 3 }, necesita: [], entidad: { tipo: 'ejercicio', obligatoria: true, nombre: 'ejercicio' }, periodo: 'rango', prioridad: 2 }),
    capa('dia', { senales: { dia: 4 }, necesita: [['dia']], periodo: 'dia', porDefecto: 'hoy', prioridad: 1 }),
  ],
  entidades: () => ({ ejercicio: EJ }),
};
ctx = nuevaConversacion('u1');
const preguntar = (t, opcion = null, ahora = 1000) => {
  const res = responderMensaje(ASIS, t, { datos: {}, hoy: HOY, contexto: ctx, ahora, ajenos: [], opcion });
  ctx = res.contexto;
  return res.respuestas;
};
const a1 = preguntar('como voy en press');
ok(a1[0].tipo === 'aclaracion' && a1[0].opciones.every((o) => o.origen === a1[0].id) && ctx.pendiente.id === a1[0].id, 'Cada opción lleva la pregunta que la creó, y esa es la pendiente');
const a2 = preguntar('como voy en dominadas');
ok(a2[0].tipo === 'aclaracion' && ctx.pendiente.id === a2[0].id && a2[0].id !== a1[0].id, 'Una pregunta nueva crea su propia aclaración y deja la anterior sin valor');
llamadas = [];
const iPm = a1[0].opciones.findIndex((o) => o.texto === 'Press militar');
let res = preguntar('Press militar', { origen: a1[0].id, indice: iPm });
ok(res[0].capacidad === 'opcion_caducada' && llamadas.length === 0 && /era de una pregunta anterior/.test(textoDeRespuesta(res[0])), 'Tocar un botón de la pregunta anterior NO consulta nada: lo dice');
ok(ctx.pendiente && ctx.pendiente.id === a2[0].id, '…y la aclaración de ahora sigue viva');
const iDs = a2[0].opciones.findIndex((o) => o.texto === 'Dominadas supinas');
res = preguntar('Dominadas supinas', { origen: a2[0].id, indice: iDs });
ok(res[0].bloques[0].texto === 'ejercicio:-:ds' && llamadas.length === 1, 'El botón de la pregunta vigente sí funciona, con su propio plan');
ok(ctx.pendiente === null, 'Contestada, ya no queda nada pendiente');
llamadas = [];
res = preguntar('Dominadas pronas', { origen: a2[0].id, indice: 0 });
ok(res[0].capacidad === 'opcion_caducada' && llamadas.length === 0, 'Volver a tocar un botón de una aclaración ya contestada tampoco consulta nada');
preguntar('como voy en press');
res = preguntar('la segunda');
ok(/^ejercicio:-:(pb|pm)$/.test(res[0].bloques[0].texto), 'Escribir «la segunda» sigue contestando la aclaración pendiente');
const a3 = preguntar('como voy en press');
res = preguntar('Press militar', { origen: a3[0].id, indice: 99 });
ok(res[0].capacidad === 'opcion_caducada', 'Una posición que no existe no se ejecuta');
const a4 = preguntar('como voy en press', null, 1000);
llamadas = [];
res = preguntar('Press militar', { origen: a4[0].id, indice: a4[0].opciones.findIndex((o) => o.texto === 'Press militar') }, 1000 + 31 * 60000);
ok(res[0].capacidad === 'opcion_caducada' && llamadas.length === 0, 'Si la conversación caducó por tiempo, el botón tampoco vale (no hereda nada viejo)');
ok(incumpleHonestidad(textoDeRespuesta(res[0])).length === 0 && res[0].opciones.length > 0 && res[0].opciones.every((o) => !o.origen), 'El aviso no incumple las palabras prohibidas y ofrece preguntas completas, sin botones atados a nada');
const UI = leer('src/components/asistenteChat.jsx');
ok(/pendienteId/.test(UI) && /disabled=\{caducada\(o\)\}/.test(UI) && /origen: o\.origen, indice: i/.test(UI) && /de una pregunta anterior/.test(UI), 'La hoja manda el origen del botón y apaga (con su texto) los de preguntas anteriores');
ok(/min-h-\[44px\]/.test(UI), 'Los botones siguen midiendo 44 px de alto');

/* ══════════════════════════════════════════════════════════════════════════
   5 · v3.161.3 — DATOS INCOMPLETOS DE SUEÑO Y «ANALIZAR MI SUEÑO»
   ══════════════════════════════════════════════════════════════════════════ */
const sinRuido = (t) => !/\bNaN\b|undefined|\bnull\b|\[object/.test(t);

console.log('\n── 5A. La siesta: sí, no o sin contestar ──');
const sinSiesta = normalizarRegistro({ fecha: HOY, horaDormir: '23:00', horaDespertar: '07:00' });
ok(sinSiesta.siestaAyer === null && sinSiesta.siestaMinutos === null, 'Sin contestar: siestaAyer null y sin minutos (antes se cargaba como «no»)');
ok(crearRegistroSueno({ horaDormir: '23:00', horaDespertar: '07:00', siestaAyer: null }).siestaAyer === null, 'El formulario sin tocar la pregunta guarda null');
const siNo = normalizarRegistro({ fecha: HOY, siestaAyer: false });
ok(siNo.siestaAyer === false && siNo.siestaMinutos === 0, 'Un «no» explícito es false (y 0 minutos)');
const siSi = normalizarRegistro({ fecha: HOY, siestaAyer: true, siestaMinutos: 30 });
ok(siSi.siestaAyer === true && siSi.siestaMinutos === 30, 'Un «sí» explícito es true, con sus minutos');
ok(normalizarRegistro({ fecha: HOY, siestaAyer: true }).siestaMinutos === null, 'Un «sí» sin minutos: los minutos no se inventan (null, no 0)');
ok(normalizarRegistro({ fecha: HOY, siesta: 0 }).siestaAyer === false && normalizarRegistro({ fecha: HOY, siesta: 45 }).siestaAyer === true && normalizarRegistro({ fecha: HOY, siesta: 45 }).siestaMinutos === 45, 'Lo guardado antes de la F31 (minutos sueltos) se sigue leyendo: 0 = no, 45 = sí con 45 min');
ok(['si', 1, 'true', {}].every((v) => normalizarRegistro({ fecha: HOY, siestaAyer: v }).siestaAyer === null), 'Basura en la siesta: sin contestar, nunca «sí» ni «no»');
ok(normalizarRegistro({ fecha: HOY, siestaAyer: false, siestaMinutos: 40 }).siestaMinutos === 0, 'Con «no», unos minutos sueltos no cuentan');
const conSiestas = [noche('2026-10-19', '23:00', '07:00', { siestaAyer: true, siestaMinutos: 20 }), noche('2026-10-20', '23:00', '07:00', { siestaAyer: false }), noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00', { siestaAyer: null })];
r = pS(conSiestas, '¿he dormido siesta esta semana?');
ok(r[0].capacidad === 'despertares' && /Días con siesta: 1 de 2/.test(txt(r)) && /2 noches no tienen contestado lo de la siesta/.test(txt(r)) && /no es un «no»/.test(txt(r)), 'Estadística mixta: 1 de 2 contestadas, y las 2 sin contestar se dicen aparte (antes: 1 de 4)');
r = pS([noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')], '¿he dormido siesta esta semana?');
ok(/No contestaste lo de la siesta en ninguna/.test(txt(r)) && !/Días con siesta: 0 de/.test(txt(r)), 'Ninguna contestada: lo dice, no «0 de 2»');
r = pS([noche('2026-10-22', '23:00', '07:00')], 'cuanto dormi ayer');
ok(/Siesta el día antes: sin contestar/.test(txt(r)), 'Una noche: la siesta sin contestar se dice');
r = pS([noche('2026-10-22', '23:00', '07:00', { siestaAyer: false })], 'cuanto dormi ayer');
ok(/Siesta el día antes: no/.test(txt(r)), '…y un «no» se dice como «no»');
const expS = exportarSueno([noche(HOY, '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00', { siestaAyer: false }), noche('2026-10-21', '23:00', '07:00', { siestaAyer: true })]);
ok(expS.some((f) => /siesta sin contestar/.test(f.extra)) && expS.some((f) => /siesta no/.test(f.extra)) && expS.some((f) => /siesta sí \(sin minutos\)/.test(f.extra)), 'La exportación separa «sin contestar», «no» y «sí»');
ok(/siestaAyer: form\.siestaAyer/.test(VISTA) && /siestaAyer: null/.test(VISTA) && !/siestaAyer: false,/.test(VISTA.slice(VISTA.indexOf('useState({'), VISTA.indexOf('useState({') + 400)), 'El formulario empieza con la siesta sin contestar y guarda lo que él elija');

console.log('\n── 5B. Las horas: nunca inventadas ──');
const sinDormir = normalizarRegistro({ fecha: HOY, horaDespertar: '07:00', calidad: 5 });
ok(sinDormir.horaDormir === null && sinDormir.horaDespertar === '07:00' && duracionDe(sinDormir) === null && minutosDeNoche(sinDormir) === null && textoDuracion(sinDormir) === null, 'Sin hora de dormir: no hay duración (ni 0 ni 8 h) y la otra hora se conserva');
const sinDespertar = normalizarRegistro({ fecha: HOY, horaDormir: '23:00', calidad: 5 });
ok(sinDespertar.horaDespertar === null && minutosDeNoche(sinDespertar) === null, 'Sin hora de despertar: tampoco');
ok(normalizarRegistro({ fecha: HOY }).horaDormir === null && normalizarRegistro({ fecha: HOY }).horaDespertar === null, 'Un registro sin horas NO recibe 23:00 → 07:00 (antes sí, y salía una noche de 8 h)');
ok(crearRegistroSueno({}).horaDormir === null && crearRegistroSueno({}).horaDespertar === null, 'Crear un registro sin horas tampoco las inventa');
ok(normalizarRegistro({ fecha: HOY, horaDormir: '25:00', horaDespertar: '07:00' }).horaDormir === null, 'Una hora imposible se queda sin hora, no se corrige a otra');
ok(minutosDeNoche(normalizarRegistro({ fecha: HOY, horaDormir: '23:30', horaDespertar: '07:15' })) === 465 && minutosDeNoche(normalizarRegistro({ fecha: HOY, horaDormir: '00:30', horaDespertar: '06:40' })) === 370, 'Las dos válidas, con y sin cruzar la medianoche: 465 y 370 min');
ok(JSON.stringify(horasQueFaltan(sinDormir)) === '["dormir"]' && JSON.stringify(horasQueFaltan(sinDespertar)) === '["despertar"]' && horasQueFaltan(noche(HOY, '23:00', '07:00')).length === 0, 'horasQueFaltan dice cuál falta');
ok(nocheTieneAlgo(sinDormir) && !nocheTieneAlgo({ fecha: HOY }), 'Una noche con algo contestado vale aunque le falte una hora; una vacía no');
ok(resumenNoche(sinDespertar).duracion === null && resumenNoche(sinDespertar).horas === '23:00 → ¿?', 'La lista de la pantalla: «23:00 → ¿?» y sin duración');
const expH = exportarSueno([{ id: 'x', fecha: HOY, horaDormir: '23:00', calidad: 4 }]);
ok(/Despertar sin anotar/.test(expH[0].detalle) && sinRuido(JSON.stringify(expH[0])), 'La exportación dice «sin anotar», no «null»');
r = pS([{ id: 'p', fecha: '2026-10-22', horaDormir: '23:00', calidad: 5, interrupciones: 0 }], 'cuanto dormi ayer');
ok(/falta la hora de despertar, así que no sé cuánto dormiste/.test(txt(r)) && /23:00 → sin anotar/.test(txt(r)) && /De maravilla/.test(txt(r)) && /ninguna vez/.test(txt(r)), 'El asistente: dice qué hora falta y conserva lo demás (cara, despertares)');
r = pS([{ id: 'p', fecha: '2026-10-22', horaDormir: '25:00', horaDespertar: '07:00', calidad: 4 }], 'cuanto dormi ayer');
ok(/la hora de dormir no es válida/.test(txt(r)), 'Una hora imposible se dice como «no es válida», no como «falta»');
const mezcla = [noche('2026-10-20', '23:00', '07:00', { calidad: 4 }), noche('2026-10-21', '23:30', '06:30', { calidad: 4 }), { id: 'i', fecha: '2026-10-22', horaDormir: '23:00', calidad: 1 }];
r = pS(mezcla, '¿cuánto he dormido de media esta semana?');
ok(r[0].capacidad === 'media' && txt(r).includes(`de media ${textoMinutos(mediaDeMinutos(mezcla.slice(0, 2)))}`) && textoMinutos(mediaDeMinutos(mezcla.slice(0, 2))) === '7 h 30 min', 'Media con noches completas e incompletas: solo de las completas (7 h 30 min)');
ok(/de 2 noches con las dos horas/.test(txt(r)) && /Una noche no tiene las dos horas y no cuenta en la media/.test(txt(r)) && /falta la hora de despertar/.test(txt(r)), '…y dice cuál no entra y por qué');
ok(/Fatal ×1/.test(txt(r)) && /Muy bien ×2/.test(txt(r)), 'Lo demás de la noche incompleta (cómo durmió) sí cuenta');
r = pS(mezcla, '¿cuál fue mi noche más corta esta semana?');
ok(/La más corta: 7 h \(terminó/.test(txt(r)) && !/0 min/.test(txt(r)), 'La noche incompleta no es «la más corta» (no vale 0)');
r = pS([{ id: 'a', fecha: '2026-10-21', horaDormir: '23:00' }, { id: 'b', fecha: '2026-10-22', horaDespertar: '07:00' }], '¿cuánto he dormido de media esta semana?');
ok(r[0].confianza === 'pocos_datos' && /ninguna tiene las dos horas/.test(txt(r)) && !/Media:/.test(txt(r)), 'Ninguna noche con las dos horas: no hay media, y lo dice');
const vSin = ventanaDeDias(mezcla, { hoy: HOY, desplazamiento: 0, dias: DIAS_VENTANA });
ok(nochesSinHorasDeVentana(vSin) === 1 && mediaMinutosDeVentana(vSin) === 450, 'La pantalla: cuenta la noche sin horas aparte y su media es la misma (7 h 30 min)');
ok(!/HORA_DORMIR_DEFECTO|HORA_DESPERTAR_DEFECTO|'23:00'|'07:00'/.test(VISTA), 'El formulario de Sueño no trae ninguna hora puesta');
ok(/Falta la hora de/.test(VISTA) && /Apunta al menos una cosa/.test(VISTA), 'Y avisa al guardar con una sola hora, o con nada');
for (const raro of [[{ fecha: HOY }], [{ fecha: HOY, horaDormir: 'x', horaDespertar: '' }], [{ fecha: 'mañana', horaDormir: '23:00' }], [null, 5, 'a']]) {
  const t = txt([...pS(raro, TEXTO_ANALIZAR_SUENO), ...pS(raro, 'cuanto dormi hoy'), ...pS(raro, 'media de esta semana')]);
  ok(sinRuido(t) && incumpleHonestidad(t).length === 0, `Datos raros (${JSON.stringify(raro).slice(0, 40)}): sin «null», «NaN» ni frases prohibidas`);
}

console.log('\n── 5C. Las noches se eligen por su fecha ──');
const desordenadas = [noche('2026-10-22', '23:00', '07:00'), noche('2026-10-15', '23:00', '06:00'), noche('2026-10-21', '22:00', '07:00'), noche('2026-10-18', '23:30', '07:00')];
ok(nochesPorFechaReciente(desordenadas).map((x) => x.fecha).join(',') === '2026-10-22,2026-10-21,2026-10-18,2026-10-15', 'nochesPorFechaReciente ordena por la fecha de la noche, no por el orden de guardado');
ok(ultimaNoche([noche('2026-10-22', '23:00', '07:00'), noche('2026-10-10', '23:00', '07:00')], HOY).fecha === '2026-10-22', 'La última noche es la de fecha más reciente aunque se guardara antes');
ok(ultimaNoche([noche('2026-10-30', '23:00', '07:00'), noche('2026-10-01', '23:00', '07:00')], HOY).fecha === '2026-10-01', '…y una con fecha futura no es «la última»');
const ordenadas = [...desordenadas].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
ok(txt(pS(desordenadas, TEXTO_ANALIZAR_SUENO)) === txt(pS(ordenadas, TEXTO_ANALIZAR_SUENO)), 'El análisis es el mismo guarde las noches en el orden que las guarde');
const recientes = Array.from({ length: 8 }, (_, i) => noche(`2026-10-${String(15 + i).padStart(2, '0')}`, '23:00', '07:00'));
const conVieja = [...recientes.slice(0, 4), noche('2026-08-02', '21:00', '10:00'), ...recientes.slice(4)];
r = pS(conVieja, TEXTO_ANALIZAR_SUENO);
ok(/últimas 7 noches/.test(txt(r)) && !/agosto/.test(txt(r)) && /Todas duraron: 8 h/.test(txt(r)) && r[0].confianza === 'normal', 'Una noche vieja guardada en medio no entra en las últimas 7 (que son las de fecha más reciente)');
r = pS([noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '06:00')], TEXTO_ANALIZAR_SUENO);
ok(r[0].confianza === 'pocos_datos' && /Con solo 2 noches con las dos horas, esta media dice poco/.test(txt(r)), 'Pocas noches: media con su aviso');
const separadasInc = [noche('2026-08-30', '23:00', '07:00'), { id: 'z', fecha: '2026-10-22', horaDormir: '23:00' }, noche('2026-10-21', '23:00', '06:00')];
r = pS(separadasInc, TEXTO_ANALIZAR_SUENO);
ok(/muy separadas/.test(txt(r)) && /Media: 7 h 30 min \(de las 2 con las dos horas\)/.test(txt(r)) && /Una noche no tiene las dos horas/.test(txt(r)) && r[0].confianza === 'pocos_datos', 'Huecos grandes + una incompleta: la incompleta no entra en la media, y se dicen las dos cosas');
const viejas = [noche('2026-09-01', '23:00', '07:00'), noche('2026-09-02', '23:00', '07:00'), noche('2026-09-03', '23:00', '07:00')];
r = pS(viejas, TEXTO_ANALIZAR_SUENO);
ok(/describe cómo dormías entonces, no ahora/.test(txt(r)) && r[0].confianza === 'pocos_datos' && !/(últimamente|ahora) duermes/.test(txt(r)), 'Noches viejas: no se presentan como cómo duerme ahora');
/* Los umbrales, en su borde (justificación en ESPECIFICACION_CHATBOTS.md §20): 3 noches seguidas y de ayer
   ya son fiables; 2 no; la última de hace 7 días todavía vale y la de hace 8 no; 14 días de abarque valen y 15 no. */
const tresSeguidas = [noche('2026-10-20', '23:00', '07:00'), noche('2026-10-21', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')];
ok(pS(tresSeguidas, TEXTO_ANALIZAR_SUENO)[0].confianza === 'normal', 'Borde: 3 noches seguidas y recientes son fiables');
ok(pS(tresSeguidas.map((x) => ({ ...x, fecha: x.fecha.replace('2026-10-2', '2026-10-1').replace('-10-10', '-10-14').replace('-10-11', '-10-15').replace('-10-12', '-10-16') })), TEXTO_ANALIZAR_SUENO)[0].confianza === 'normal', 'Borde: la última de hace 7 días todavía vale');
ok(pS(tresSeguidas.map((x, i) => ({ ...x, fecha: ['2026-10-13', '2026-10-14', '2026-10-15'][i] })), TEXTO_ANALIZAR_SUENO)[0].confianza === 'pocos_datos', 'Borde: la última de hace 8 días ya no');
ok(pS([noche('2026-10-09', '23:00', '07:00'), noche('2026-10-15', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')], TEXTO_ANALIZAR_SUENO)[0].confianza === 'normal', 'Borde: abarcar 14 días vale');
ok(pS([noche('2026-10-08', '23:00', '07:00'), noche('2026-10-15', '23:00', '07:00'), noche('2026-10-22', '23:00', '07:00')], TEXTO_ANALIZAR_SUENO)[0].confianza === 'pocos_datos', 'Borde: abarcar 15 ya no');

console.log('\n── 5D. «Analizar mi sueño»: una conversación, no un informe fijo ──');
const APP = leer('src/App.jsx');
ok(/const abrirAsistenteCon = \(modulo, texto\)/.test(APP) && /conversarCon\(asistente, x\[asistente\.id\], texto/.test(APP) && /setAsistenteAbierto\(modulo\)/.test(APP), 'App.jsx: el botón contesta la primera pregunta con el núcleo y abre la hoja del asistente');
ok(/onAnalizar=\{asistenteDeModulo\('sueno'\) \? \(\) => abrirAsistenteCon\('sueno', TEXTO_ANALIZAR_SUENO\) : null\}/.test(APP), '…y es el botón de Sueño el que lo hace (con la pregunta declarada en el asistente)');
ok(!/AIPanel/.test(VISTA) && /onAnalizar/.test(VISTA) && /Analizar mi sueño/.test(VISTA) && !/askAI|fetch\(/.test(VISTA), 'La pantalla de Sueño ya no tiene el panel de IA «próximamente»: el botón llama a onAnalizar, sin red');
ok(!/askAI|fetch\(|XMLHttpRequest|anthropic|import\.meta\.env/i.test(AS), 'El asistente de Sueño no llama a ninguna IA ni a la red');
const DATOS_D = [
  noche('2026-10-15', '23:00', '07:00', { calidad: 4, interrupciones: 0 }),
  noche('2026-10-16', '23:00', '06:30', { calidad: 2, interrupciones: 1, siestaAyer: true, siestaMinutos: 30 }),
  noche('2026-10-17', '00:30', '07:00', { calidad: 1, interrupciones: 2 }),
  noche('2026-10-19', '23:15', '07:30', { calidad: 4, interrupciones: 0 }),
  noche('2026-10-20', '22:45', '06:45', { calidad: 4, interrupciones: 0, siestaAyer: false }),
  { id: 'inc', fecha: '2026-10-21', horaDormir: '23:00', calidad: 4 },
  noche('2026-10-22', '23:30', '07:15', { calidad: 5, interrupciones: 0 }),
  noche('2026-09-02', '21:00', '10:00', { calidad: 5 }),
];
const charla = (preguntas, datos = DATOS_D) => {
  let c = conversacionVacia('u');
  const salida = [];
  preguntas.forEach((p, i) => {
    const antes = c.mensajes.length;
    c = conversarCon(ASISTENTE_SUENO, c, p, { usuario: 'u', datos: { sueno: datos }, hoy: HOY, ajenos: [], ahora: 1000 + i * 1000 });
    salida.push(c.mensajes.slice(antes).filter((m) => m.rol === 'asistente').map((m) => m.respuesta));
  });
  return { c, salida };
};
const { c: conv, salida: S } = charla([TEXTO_ANALIZAR_SUENO, '¿Cuánto he dormido de media?', '¿Cuál ha sido mi mejor noche?', '¿Y la peor?', '¿Qué noches no tienen datos completos?', '¿Por qué no puedes calcular una media fiable?']);
const ultimasSiete = DATOS_D.filter((x) => x.fecha >= '2026-10-15');
const completasSiete = ultimasSiete.filter((x) => minutosDeNoche(x) !== null);
const mediaEsperada = textoMinutos(mediaDeMinutos(completasSiete));
ok(conv.mensajes[0].rol === 'yo' && conv.mensajes[0].texto === TEXTO_ANALIZAR_SUENO && S[0][0].capacidad === 'ultimas', 'El botón deja su pregunta en la conversación y la contesta el análisis de las últimas noches');
ok(txt(S[0]).includes(`Media: ${mediaEsperada} (de las ${completasSiete.length} con las dos horas)`) && /últimas 7 noches/.test(txt(S[0])) && !/septiembre/.test(txt(S[0])), `Primera respuesta con datos reales: las 7 noches de fecha más reciente (la de septiembre se queda fuera), media ${mediaEsperada}`);
ok(/Una noche no tiene las dos horas/.test(txt(S[0])) && /falta la hora de despertar/.test(txt(S[0])) && /Noches en las que te despertaste: 2 de 6/.test(txt(S[0])), '…dice qué noche está incompleta y cuenta los despertares solo de las contestadas');
ok(S[1][0].capacidad === 'media' && txt(S[1]).includes(`de media ${mediaEsperada}`) && /^En esos mismos días/.test(txt(S[1])), 'Seguimiento «¿cuánto he dormido de media?»: las MISMAS noches, la MISMA media, y lo dice («en esos mismos días»)');
ok(S[2][0].capacidad === 'extremos' && /dormiste mejor: terminó ayer: 🤩 De maravilla/.test(txt(S[2])) && /La más larga: 8 h 15 min \(terminó el lunes 19/.test(txt(S[2])) && !/La más corta:/.test(txt(S[2])), '«¿Cuál ha sido mi mejor noche?»: la que dijo que durmió mejor y la más larga, cada una con su criterio');
ok(S[3][0].capacidad === 'extremos' && /dormiste peor: terminó el sábado 17 de octubre: 😫 Fatal/.test(txt(S[3])) && /La más corta: 6 h 30 min/.test(txt(S[3])) && !/septiembre/.test(txt(S[3])), '«¿Y la peor?»: sigue en las mismas noches (no salta a la de septiembre)');
ok(S[4][0].capacidad === 'incompletas' && /mié 21 de octubre: falta la hora de despertar/.test(txt(S[4])), '«¿Qué noches no tienen datos completos?»: la nombra y dice qué le falta');
ok(S[5][0].capacidad === 'fiabilidad' && S[5].every((x) => x.tipo !== 'limite') && /media fiable/.test(txt(S[5])) && /Lo que pido: al menos 3 noches con las dos horas/.test(txt(S[5])) && /1 noche no tiene las dos horas/.test(txt(S[5])), '«¿Por qué no puedes calcular una media fiable?»: no es un límite de «causa»: dice si esas noches dan una media fiable, con qué criterio y qué no entra');
ok((S[0][0].confianza === 'normal') === /sí te doy una media fiable/.test(txt(S[5])), 'El análisis y la explicación de fiabilidad dicen lo mismo de las mismas noches');
const { salida: S2 } = charla(['¿Cuánto he dormido esta semana?', '¿Y la semana pasada?', 'Compáralo con lo que te he preguntado antes']);
const estaS = DATOS_D.filter((x) => x.fecha >= '2026-10-19' && minutosDeNoche(x) !== null);
const pasadaS = DATOS_D.filter((x) => x.fecha >= '2026-10-12' && x.fecha <= '2026-10-18' && minutosDeNoche(x) !== null);
const dif = mediaDeMinutos(pasadaS) - mediaDeMinutos(estaS);
ok(S2[2][0].capacidad === 'comparar' && /la semana pasada/i.test(txt(S2[2])) && /esta semana/i.test(txt(S2[2])) && txt(S2[2]).includes(`${textoMinutos(Math.abs(dif))} ${dif > 0 ? 'más' : 'menos'}`), `«Compáralo con lo que te he preguntado antes»: la semana pasada contra esta semana, con la diferencia real (${textoMinutos(Math.abs(dif))})`);
const equivalentes = [TEXTO_ANALIZAR_SUENO, 'analiza mi sueño', '¿Cómo he dormido últimamente?', 'como han ido mis ultimas noches', 'como e dormido ultimamente', 'analisis de mi sueño', 'que tal duermo ultimamente'];
const medias = equivalentes.map((p) => { const rr = pS(DATOS_D, p); return rr[0].capacidad === 'ultimas' ? (txt(rr).match(/Media: [^(]+/) || [''])[0] : `otra:${rr[0].capacidad}`; });
ok(medias.every((m) => m === `Media: ${mediaEsperada} `), `Siete formas de pedirlo (con erratas y coloquiales) dan el mismo análisis y la misma media: ${[...new Set(medias)].join(' / ')}`);
const fresca = txt(pS(DATOS_D, '¿cuánto he dormido de media del 15 al 22 de octubre?'));
ok(/^Del 15 al 22 de octubre has dormido de media/.test(fresca) && fresca.includes(mediaEsperada) && txt(S[1]) !== fresca, 'La misma cifra con otra frase según el contexto: «del 15 al 22…» en frío, «en esos mismos días…» siguiendo la charla');
const amb = responderMensaje(ASISTENTE_SUENO, 'calidad de mis siestas', { datos: { sueno: DATOS_D }, hoy: HOY, contexto: nuevaConversacion('u'), ajenos: [], ahora: 1 });
ok(amb.respuestas[0].tipo === 'aclaracion' && amb.respuestas[0].opciones.length === 2 && amb.contexto.pendiente, 'Una pregunta ambigua («calidad de mis siestas») pide aclaración con dos opciones');
const elegida = responderMensaje(ASISTENTE_SUENO, amb.respuestas[0].opciones[1].texto, { datos: { sueno: DATOS_D }, hoy: HOY, contexto: amb.contexto, ajenos: [], ahora: 2, opcion: { origen: amb.respuestas[0].opciones[1].origen, indice: 1 } });
ok(elegida.respuestas[0].tipo === 'respuesta' && ['calidad', 'despertares'].includes(elegida.respuestas[0].capacidad), '…y la opción elegida se contesta con datos');
r = pS([], TEXTO_ANALIZAR_SUENO);
ok(r[0].sinDatos && /ninguna noche registrada/.test(txt(r)) && !/Media/.test(txt(r)), 'Sin datos: lo reconoce y no da cifras');
r = pS([{ id: 'x', fecha: '2026-10-22', horaDormir: '23:00' }], TEXTO_ANALIZAR_SUENO);
ok(r[0].confianza === 'pocos_datos' && /falta la hora de despertar, así que no sé cuánto dormiste/.test(txt(r)), 'Una sola noche y sin una hora: no inventa la duración');
const todo = [...S, ...S2].flat().map(textoDeRespuesta).join(' | ');
ok(sinRuido(todo) && incumpleHonestidad(todo).length === 0 && !/tendencia (sube|baja)|mejorando|empeorando|deberías|te recomiendo/i.test(todo), 'En toda la charla: ni «null»/«NaN», ni palabras prohibidas, ni tendencias ni consejos');
ok(charla([TEXTO_ANALIZAR_SUENO, '¿Y la peor?']).salida.map((x) => x.map(textoDeRespuesta).join()).join() === charla([TEXTO_ANALIZAR_SUENO, '¿Y la peor?']).salida.map((x) => x.map(textoDeRespuesta).join()).join(), 'Determinista: la misma charla dice exactamente lo mismo');
const capIds = ASISTENTE_SUENO.capacidades.map((x) => x.id);
ok(['ultimas', 'incompletas', 'fiabilidad'].every((id) => capIds.includes(id)) && ASISTENTE_SUENO.capacidades.find((x) => x.id === 'fiabilidad').cubreCausa === true, 'Las capacidades nuevas son líneas del registro del asistente (ni un `if` en el núcleo)');

console.log(`\n${fallos ? '\x1b[31m' : '\x1b[32m'}${total - fallos}/${total} comprobaciones\x1b[0m`);
if (fallos) process.exit(1);
