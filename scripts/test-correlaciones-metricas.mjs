/* ===========================================================================
   FASE 1B — CORRECCIÓN DE DATOS Y MÉTRICAS (CX-09, CX-11, CX-12, CX-14, CX-15)

   🚨 **Esta suite comprueba VALORES, no que las funciones devuelvan algo.** Las
   correlaciones llevaban desde la Fase 6 con una sola prueba —que devolvieran un
   objeto— y por eso nadie vio que tres asignaturas el mismo día contaban como
   tres días, ni que entrenar con Fitness daba «0 días con sesión». Cada bloque
   trae el escenario que reproducía el fallo y el número exacto que debe salir.

   ⚠️ Las sesiones de Fitness se fabrican con **el flujo de la aplicación**
   (constructor → empezar → marcar series → finalizar → guardar), no a mano: así
   la suite comprueba el contrato real de `fitness.sesiones`, no uno supuesto.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  correlacionSuenoEstudio, correlacionSuenoAnimo, correlacionEntrenoAnimo,
  horasDeEstudioPorDia, animoPorDia,
} from '../src/lib/correlaciones.js';
import { fechasDeEntreno } from '../src/lib/fechasDeEntreno.js';
import * as hoja from '../src/lib/sesionesCompletadas.js';
import * as historial from '../src/lib/historial.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';
import { puntuacionDelDia } from '../src/lib/puntuacion.js';
import { prediccionConstanciaEntreno, DIAS_MINIMOS_CONSTANCIA } from '../src/lib/predicciones.js';
import { calcularLogros } from '../src/lib/logros.js';
import { hayDatosPara, resumenNumeros, SERIES_DE_NUMEROS } from '../src/lib/numeros.js';
import { empezarSesion, editarSerie, marcarSerie, ejerciciosDeSesion, normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { addDays, todayISO, FECHA_NO_DISPONIBLE } from '../src/lib/helpers.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(Object.is(a, b), `${m}${Object.is(a, b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

/* ── Fábricas ─────────────────────────────────────────────────────────────── */

/** Un entrenamiento COMPLETADO de verdad, con el flujo de la aplicación. */
function entrenamiento(fecha, { nombre = 'Tirón', hora = 18 } = {}) {
  let r = crearRutina({ nombre });
  r = anadirEjercicio(r, 'dominada-prona');
  r = editarLinea(r, r.lineas[0].id, { series: 2, tipoCarga: 'corporal' });
  const inicio = new Date(`${fecha}T${String(hora).padStart(2, '0')}:00:00`).getTime();
  let s = empezarSesion({ nombre, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  for (let i = 0; i < 2; i += 1) {
    s = editarSerie(s, e.id, e.series[i].id, { reps: 8 });
    s = marcarSerie(s, e.id, e.series[i].id, true);
  }
  const fin = guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3000000 }), { confirmado: true, ahora: inicio + 3001000 });
  if (!fin || !fin.sesion) throw new Error(`No se pudo fabricar el entrenamiento del ${fecha}`);
  return fin.sesion;
}
/** Un entrenamiento EMPEZADO y sin terminar (en curso). */
function enCurso(fecha) {
  let r = crearRutina({ nombre: 'Pierna' });
  r = anadirEjercicio(r, 'dominada-prona');
  return empezarSesion({ nombre: 'Pierna', lineas: r.lineas, hoy: fecha, ahora: new Date(`${fecha}T10:00:00`).getTime() });
}
/** `fitness` tal y como lo deja la puerta de carga de la aplicación. */
const conSesiones = (sesiones) => normalizarFitnessConSesiones({ ...DEFAULT_FITNESS, sesiones });
const noche = (fecha, horaDormir, horaDespertar) => ({ id: `n-${fecha}`, fecha, horaDormir, horaDespertar });
const dias = (desde, n) => Array.from({ length: n }, (_, i) => addDays(desde, i));

/* ── Un reloj de mentira, para «hoy a las 15:00» y «hoy a las 23:59» ───────── */
const RealDate = Date;
function conReloj(anio, mes, dia, hora, minuto, fn) {
  const fijo = new RealDate(anio, mes - 1, dia, hora, minuto, 0).getTime();
  class FakeDate extends RealDate {
    constructor(...args) { if (args.length === 0) super(fijo); else super(...args); }
    static now() { return fijo; }
  }
  globalThis.Date = FakeDate;
  try { return fn(); } finally { globalThis.Date = RealDate; }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La regla de qué entrenamientos cuentan es UNA, y es una hoja ──');

ok(historial.sesionesDelHistorial === hoja.sesionesDelHistorial && historial.ESTADO_DEL_HISTORIAL === hoja.ESTADO_DEL_HISTORIAL,
  '🚨 `historial.js` reexporta la MISMA función de la hoja: no hay dos reglas de «qué cuenta»');
const importsHoja = [...leer('src/lib/sesionesCompletadas.js').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
ok(importsHoja.length === 1 && importsHoja[0] === './helpers',
  `🚨 La hoja solo importa helpers.js (sin ciclo con Predicciones → Calendario) — importa: ${importsHoja.join(', ')}`);
const importsFechas = [...leer('src/lib/fechasDeEntreno.js').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]).sort();
ok(JSON.stringify(importsFechas) === JSON.stringify(['./helpers', './sesionesCompletadas']),
  `…y \`fechasDeEntreno.js\` solo la hoja y helpers — importa: ${importsFechas.join(', ')}`);
for (const lib of ['correlaciones', 'puntuacion', 'predicciones', 'numeros']) {
  ok(!/from\s+'\.\/historial'/.test(leer(`src/lib/${lib}.js`)),
    `⚠️ \`${lib}.js\` no importa \`historial.js\` (que arrastra el Calendario, que importa Predicciones): lee la hoja`);
}

const hoy0 = '2026-10-10';
const fit0 = conSesiones([entrenamiento('2026-10-01'), entrenamiento('2026-10-01', { nombre: 'Core', hora: 20 }), enCurso('2026-10-02')]);
eq(fit0.sesiones.length, 3, 'El escenario tiene tres sesiones guardadas (dos completadas el mismo día y una en curso)');
const f0 = fechasDeEntreno({ fitness: fit0 });
eq(f0.todas.size, 1, '🚨 Dos entrenamientos el mismo día son UN día, y uno en curso no cuenta');
ok(f0.todas.has('2026-10-01') && !f0.todas.has('2026-10-02'), '…el día con entrenamiento completado sí, el del que está en curso no');
const repetida = fit0.sesiones[0];
eq(fechasDeEntreno({ fitness: { sesiones: [repetida, { ...repetida }] } }).todas.size, 1,
  '🚨 La misma sesión guardada dos veces cuenta una vez');
eq(fechasDeEntreno({ fitness: { sesiones: [{ ...repetida, estado: 'descartada' }, { ...repetida, id: 'x', estado: 'finalizando' }] } }).todas.size, 0,
  'Ni una descartada ni una que está «finalizando» sin guardar');
eq(fechasDeEntreno({ fitness: { sesiones: [{ ...repetida, fecha: '' }, { ...repetida, id: 'y', fecha: '2026-13-45' }] } }).todas.size, 0,
  'Una sesión sin fecha válida no cae en ningún día');
eq(fechasDeEntreno({ fitness: null, calistenia: null }).todas.size, 0, 'Sin nada guardado: ningún día, sin romperse');
const fMix = fechasDeEntreno({ fitness: fit0, calistenia: { planche: { sesiones: [{ fecha: '2026-10-01' }, { fecha: '2026-09-20' }, { fecha: 'basura' }] }, raro: null } });
eq(fMix.todas.size, 2, '🚨 Con la calistenia de antes: su día y el de Fitness, el mismo día UNA vez, y una fecha rota fuera');
eq(fMix.primera, '2026-09-20', '…y el primero de todos es el más antiguo');
eq(fMix.deFitness, 1, '…con su origen contado aparte (Fitness)');
eq(fMix.deCalistenia, 2, '…y (la calistenia de antes)');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. CX-11 · Sueño y estudio: la unidad es el DÍA, no la asignatura ──');

const sueno4 = [noche('2026-10-05', '23:00', '07:30'), noche('2026-10-06', '23:00', '07:30'), noche('2026-10-07', '02:00', '07:30'), noche('2026-10-08', '02:00', '07:30')];
const horasMismoDia = [
  { asignaturaId: 'mat', fecha: '2026-10-05', horas: 1 }, { asignaturaId: 'bio', fecha: '2026-10-05', horas: 1 }, { asignaturaId: 'his', fecha: '2026-10-05', horas: 1 },
  { asignaturaId: 'mat', fecha: '2026-10-06', horas: 3 },
  { asignaturaId: 'mat', fecha: '2026-10-07', horas: 2 }, { asignaturaId: 'bio', fecha: '2026-10-08', horas: 2 },
];
const c11 = correlacionSuenoEstudio(sueno4, horasMismoDia);
eq(c11.diasBuenSueno, 2, '🐛 Tres asignaturas el día 5 son UN día con 7 h+ de sueño (antes contaba 4)');
eq(c11.mediaHorasConBuenSueno, 3, '🐛 …y la media es 3 h AL DÍA (antes 1,5 h: la media de las entradas)');
eq(c11.diasSuenoCorto, 2, 'Días con menos de 7 h: 2');
eq(c11.mediaHorasConSuenoCorto, 2, '…con 2 h de media');
eq(c11.suficientesDatos, true, 'Dos días de cada grupo bastan');
eq(c11.pares.length, 4, 'Cuatro pares, uno por día');

const horasDistintosDias = [
  { asignaturaId: 'mat', fecha: '2026-10-05', horas: 1 }, { asignaturaId: 'bio', fecha: '2026-10-06', horas: 2 },
  { asignaturaId: 'his', fecha: '2026-10-07', horas: 4 }, { asignaturaId: 'mat', fecha: '2026-10-08', horas: 1 },
];
const c11b = correlacionSuenoEstudio(sueno4, horasDistintosDias);
eq(c11b.diasBuenSueno, 2, 'Asignaturas en días distintos: cada día cuenta una vez');
eq(c11b.mediaHorasConBuenSueno, 1.5, '…media (1 + 2) / 2 = 1,5 h');
eq(c11b.mediaHorasConSuenoCorto, 2.5, '…y (4 + 1) / 2 = 2,5 h: la media corta puede ser MAYOR que la larga');

const porDia = horasDeEstudioPorDia([
  { fecha: '2026-10-05', horas: 0.1 }, { fecha: '2026-10-05', horas: 0.2 },
  { fecha: '2026-10-06', horas: 'abc' }, { fecha: '2026-10-06', horas: null }, { fecha: '2026-10-06', horas: -2 },
  { fecha: '', horas: 3 }, { fecha: '2026-02-30', horas: 3 }, null,
]);
eq(porDia.length, 1, 'Horas que no son un número, negativas, sin fecha o con una fecha imposible no cuentan');
eq(porDia[0].horas, 0.3, '…y 0,1 + 0,2 h el mismo día son 0,3 h, sin ruido de coma flotante');

const c11Pocos = correlacionSuenoEstudio(sueno4.slice(0, 3), horasMismoDia);
eq(c11Pocos.suficientesDatos, false, 'Con un solo día de sueño corto: datos insuficientes, no una conclusión');
eq(c11Pocos.diasSuenoCorto, 1, '…y lo dice con el recuento real (1)');
const c11Vacio = correlacionSuenoEstudio([], []);
ok(c11Vacio.suficientesDatos === false && c11Vacio.mediaHorasConBuenSueno === null && c11Vacio.diasBuenSueno === 0,
  'Sin datos: insuficiente, medias `null` (no 0) y cero días');
ok(correlacionSuenoEstudio(null, undefined).suficientesDatos === false, 'Con `null` y `undefined` tampoco se rompe');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Sueño y ánimo: el Diario por días, y un ánimo que no está no es un 0 ──');

const suenoA = [noche('2026-10-05', '23:00', '07:30'), noche('2026-10-06', '23:00', '07:30'), noche('2026-10-07', '02:00', '07:30'), noche('2026-10-08', '02:00', '07:30')];
const diarioA = [
  { fecha: '2026-10-05', animo: 5 }, { fecha: '2026-10-06', animo: 4 },
  { fecha: '2026-10-07', animo: 2 }, { fecha: '2026-10-08', animo: 3 },
];
const cA = correlacionSuenoAnimo(suenoA, diarioA);
eq(cA.mediaAnimoConBuenSueno, 4.5, 'Diario con datos: ánimo medio con 7 h+ = 4,5');
eq(cA.mediaAnimoConSuenoCorto, 2.5, '…y con menos de 7 h = 2,5');
eq(cA.suficientesDatos, true, '…con dos días de cada');
const cARotos = correlacionSuenoAnimo(suenoA, [...diarioA, { fecha: '2026-10-05', animo: null }, { fecha: '2026-10-06', animo: '' }, { fecha: '2026-10-07', animo: 9 }, { fecha: '2026-10-08' }]);
eq(cARotos.mediaAnimoConBuenSueno, 4.5, '🐛 Una entrada sin ánimo, vacía o fuera de la escala no cuenta como 0 ni da NaN');
eq(cARotos.diasBuenSueno, 2, '…ni suma días');
const cADos = correlacionSuenoAnimo(suenoA, [...diarioA, { fecha: '2026-10-05', animo: 3 }]);
eq(cADos.diasBuenSueno, 2, 'Dos entradas el mismo día (una importación) son un día');
eq(cADos.mediaAnimoConBuenSueno, 4, '…y su ánimo se promedia: ((5 + 3) / 2 + 4) / 2 = 4');
const cAVacio = correlacionSuenoAnimo(suenoA, []);
ok(cAVacio.suficientesDatos === false && cAVacio.diasBuenSueno === 0 && cAVacio.mediaAnimoConBuenSueno === null,
  'Diario vacío: insuficiente, sin medias inventadas');
/* 🔓 Fase 1C — esta comprobación decía lo contrario («4» como texto se leía como 4) y se da la
   vuelta: el Diario guarda y reconoce solo el número entero de `ESTADOS_ANIMO`. */
eq(animoPorDia([{ fecha: '2026-10-05', animo: '4' }]).length, 0, '🔓 Fase 1C · un ánimo guardado como texto «4» NO cuenta: el Diario solo guarda (y pinta) el número');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. CX-09 · Entrenar y ánimo lee Fitness (y la calistenia de antes, solo por fechas) ──');

const diez = dias('2026-10-01', 10);
const diario10 = diez.map((f, i) => ({ id: `d${i}`, fecha: f, animo: i % 2 ? 2 : 5 }));
const fitPares = conSesiones(diez.filter((_, i) => i % 2 === 0).map((f) => entrenamiento(f)));
eq(fitPares.sesiones.filter((s) => s.estado === 'completada').length, 5, 'Escenario: cinco entrenamientos completados en Fitness, los días de ánimo 5');

const c9 = correlacionEntrenoAnimo({ fitness: fitPares, calistenia: {} }, diario10);
eq(c9.diasConEntreno, 5, '🐛 Con entrenamientos de Fitness: 5 días con entreno (antes «0 días con sesión»)');
eq(c9.diasSinEntreno, 4, '…y 4 sin (🔓 Fase 1C: el día 10, después del último entrenamiento registrado, ya no cuenta como «sin»)');
eq(c9.mediaAnimoConEntreno, 5, '…ánimo 5 los días con entreno');
eq(c9.mediaAnimoSinEntreno, 2, '…y 2 los demás: la conclusión correcta');
eq(c9.suficientesDatos, true, '…con datos suficientes (3 de cada como mínimo)');
eq(c9.conCalisteniaAnterior, false, '…sin calistenia de antes');

const calisteniaVieja = { planche: { sesiones: [{ fecha: diez[1] }, { fecha: diez[3] }, { fecha: diez[5] }] }, handstand: { sesiones: [{ fecha: diez[0] }] } };
const c9b = correlacionEntrenoAnimo({ fitness: fitPares, calistenia: calisteniaVieja }, diario10);
eq(c9b.diasConEntreno, 8, '🐛 Con calistenia vieja en otros días: esos días también fueron de entreno (8), y el día que coincide con Fitness cuenta UNA vez');
eq(c9b.mediaAnimoConEntreno, 3.9, '…ánimo con entreno (5×5 + 3×2) / 8 = 3,9 (antes salía 2,0: invertido)');
eq(c9b.mediaAnimoSinEntreno, 2, '…y 2 sin entreno');
eq(c9b.diasSinEntreno, 1, '…en 1 día (🔓 Fase 1C: el día 10, después del último, queda fuera)');
eq(c9b.suficientesDatos, false, '…y con 1 día sin entreno NO afirma nada (hacen falta 3)');
eq(c9b.conCalisteniaAnterior, true, '…diciendo que cuenta la calistenia de antes');

const c9Solo = correlacionEntrenoAnimo({ calistenia: calisteniaVieja }, diario10);
eq(c9Solo.diasConEntreno, 4, 'Solo con calistenia de antes: sus 4 días siguen siendo días de entreno (no se borra la historia)');
eq(c9Solo.diasEntrenoFitness, 0, '…y Fitness no aporta ninguno');

const c9Nada = correlacionEntrenoAnimo({ fitness: conSesiones([]), calistenia: {} }, diario10);
ok(c9Nada.suficientesDatos === false && c9Nada.desde === null && c9Nada.diasConEntreno === 0 && c9Nada.diasSinEntreno === 0,
  '🚨 Sin ningún entrenamiento: insuficiente y SIN días «sin entreno» (no se sabe si entrenaba)');
ok(c9Nada.mediaAnimoConEntreno === null && c9Nada.mediaAnimoSinEntreno === null, '…y sin medias');

const fitTarde = conSesiones([entrenamiento(diez[6]), entrenamiento(diez[8])]);
const c9Desde = correlacionEntrenoAnimo({ fitness: fitTarde }, diario10);
eq(c9Desde.desde, diez[6], '🚨 Solo cuentan los días del Diario desde el primer entrenamiento registrado');
eq(c9Desde.diasConEntreno + c9Desde.diasSinEntreno, 3, '…así que de 10 días de Diario se comparan 3: los 6 primeros no (antes del primero) y, desde la Fase 1C, tampoco el 10 (después del último)');
eq(c9Desde.suficientesDatos, false, '…y con 2 días de entreno, insuficiente');

const c9EnCurso = correlacionEntrenoAnimo({ fitness: conSesiones([enCurso(diez[0]), enCurso(diez[2])]) }, diario10);
eq(c9EnCurso.diasConEntreno, 0, 'Un entrenamiento en curso no es un día con entreno');
const c9DiarioVacio = correlacionEntrenoAnimo({ fitness: fitPares }, []);
ok(c9DiarioVacio.suficientesDatos === false && c9DiarioVacio.diasConEntreno === 0, 'Diario vacío: insuficiente, sin romperse');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. CX-12 · Las tarjetas, la puntuación y la predicción leen Fitness ──');

const HOY = '2026-10-19';
const hubVacio = calcularResumenModulo('entreno', { fitness: conSesiones([]), calistenia: {} }, HOY);
eq(hubVacio.estado, 'vacio', 'Hub sin entrenamientos: estado vacío');
eq(hubVacio.linea1, 'Sin entrenamientos en Fitness', '…que dice lo que mira');
const hubVieja = calcularResumenModulo('entreno', { fitness: conSesiones([]), calistenia: { planche: { nivel: 40, sesiones: [{ fecha: '2026-09-01' }] } }, futbol: [{ fecha: '2026-09-02' }] }, HOY);
ok(hubVieja.estado === 'vacio' && !/habilidad|partido/i.test(`${hubVieja.linea1} ${hubVieja.linea2}`),
  '🐛 Con calistenia y partidos de antes y nada en Fitness: no se inventa una «habilidad activa» congelada');
const fitHub = conSesiones([entrenamiento('2026-10-12', { nombre: 'Empuje' }), entrenamiento('2026-10-16', { nombre: 'Tirón' }), enCurso('2026-10-19')]);
const hub = calcularResumenModulo('entreno', { fitness: fitHub, calistenia: {} }, HOY);
eq(hub.estado, 'activo', 'Hub con entrenamientos completados: activo');
eq(hub.linea1, 'Tirón', '…con el nombre del ÚLTIMO completado (el en curso de hoy no cuenta)');
eq(hub.linea2, 'Último entrenamiento hace 3 días', '…y hace cuánto, en días de calendario');
eq(calcularResumenModulo('entreno', { fitness: fitHub }, '2026-10-16').linea2, 'Último entrenamiento hoy', '…el mismo día: «hoy»');
eq(calcularResumenModulo('entreno', { fitness: fitHub }, '2026-10-17').linea2, 'Último entrenamiento hace 1 día', '…al día siguiente: «hace 1 día»');

const DASH = leer('src/views/DashboardView.jsx');
ok(!/skillDestacada/.test(DASH), '🐛 La tarjeta «Entreno» de Inicio ya no calcula una habilidad de calistenia');
ok(/resumenes\?\.entreno/.test(DASH) && /valor=\{hayEntreno \? rEntreno\.linea1/.test(DASH),
  '…lee el MISMO resumen que el hub (una sola lectura)');
const APP = leer('src/App.jsx');
ok(/calcularResumenModulo\(m\.id, \{[^}]*\bfitness\b[^}]*\}(, diaDeHoy)?\)/.test(APP) && /\), \[sueno, calistenia, futbol, fitness,/.test(APP),
  '🚨 App.jsx pasa `fitness` a los resúmenes del hub y lo pone en sus dependencias (si no, la tarjeta no se actualiza)');
ok(/<DashboardView[\s\S]{0,200}fitness=\{fitness\}/.test(APP) && /<NumbersView[\s\S]{0,200}fitness=\{fitness\}/.test(APP),
  '…y a Inicio y a Progreso');

const area = (estado, hoy) => puntuacionDelDia(estado, hoy, []).detalle.find((d) => d.id === 'entreno');
eq(area({ sueno: [], fitness: conSesiones([]) }, HOY), undefined, 'Puntuación sin ningún entrenamiento: el área no cuenta');
const viejaSola = { calistenia: { planche: { sesiones: [{ fecha: '2026-08-01' }] } }, fitness: conSesiones([]) };
ok(area(viejaSola, HOY) && area(viejaSola, HOY).hecho === false, 'Con calistenia de antes y sin entrenar hoy: cuenta y no está hecha (como siempre)');
const viejaYHoy = { ...viejaSola, fitness: conSesiones([entrenamiento(HOY)]) };
ok(area(viejaYHoy, HOY) && area(viejaYHoy, HOY).hecho === true,
  '🐛 Con calistenia de antes y un entrenamiento de Fitness HOY: hecha (antes seguía sin hacer y bajaba la nota)');
const soloFitHoy = { fitness: conSesiones([entrenamiento(HOY)]) };
ok(area(soloFitHoy, HOY) && area(soloFitHoy, HOY).hecho === true, 'Solo Fitness, entrenado hoy: el área cuenta y está hecha');
const soloFitAyer = { fitness: conSesiones([entrenamiento(addDays(HOY, -1))]) };
ok(area(soloFitAyer, HOY) && area(soloFitAyer, HOY).hecho === false, '…entrenado ayer y no hoy: cuenta y no está hecha');
const enCursoHoy = { fitness: conSesiones([entrenamiento(addDays(HOY, -3)), enCurso(HOY)]) };
ok(area(enCursoHoy, HOY) && area(enCursoHoy, HOY).hecho === false, '…uno empezado hoy y sin terminar no lo da por hecho');
eq(puntuacionDelDia({ fitness: conSesiones([entrenamiento(HOY)]), sueno: [noche(HOY, '23:00', '07:00')] }, HOY, []).valor, 100,
  'Con sueño anotado y entrenamiento de Fitness hoy: 100');

eq(prediccionConstanciaEntreno({}, HOY).motivo, 'pocos_dias', 'Predicción sin datos: «pocos días», sin afirmar un ritmo');
eq(prediccionConstanciaEntreno({ fitness: conSesiones(dias('2026-08-01', DIAS_MINIMOS_CONSTANCIA - 1).map((f) => entrenamiento(f))) }, HOY).motivo, 'pocos_dias',
  `…con ${DIAS_MINIMOS_CONSTANCIA - 1} días, todavía insuficiente`);
const empezoHace10 = conSesiones(dias(addDays(HOY, -9), 6).map((f) => entrenamiento(f)));
const pCorto = prediccionConstanciaEntreno({ fitness: empezoHace10 }, HOY);
ok(pCorto.suficientesDatos === false && pCorto.motivo === 'historial_corto',
  '🚨 Empezó hace 10 días: no dice «subiendo» por comparar con una quincena en la que aún no entrenaba');
const parado = conSesiones(dias('2026-07-01', 5).map((f) => entrenamiento(f)));
const pParado = prediccionConstanciaEntreno({ fitness: parado }, HOY);
ok(pParado.suficientesDatos === false && pParado.motivo === 'sin_actividad_reciente',
  '🐛 Sin entrenar en cuatro semanas: lo dice (antes salía «estable» con 0 y 0)');
const ritmo = conSesiones([
  ...dias('2026-08-01', 3).map((f) => entrenamiento(f)),
  ...[addDays(HOY, -20), addDays(HOY, -18)].map((f) => entrenamiento(f)),
  ...[addDays(HOY, -12), addDays(HOY, -9), addDays(HOY, -5), HOY].map((f) => entrenamiento(f)),
  entrenamiento(HOY, { nombre: 'Core', hora: 21 }),
]);
const pRitmo = prediccionConstanciaEntreno({ fitness: ritmo }, HOY);
eq(pRitmo.suficientesDatos, true, 'Con historial largo y actividad reciente: hay lectura');
eq(pRitmo.diasRecientes, 4, '…4 DÍAS con entreno en los últimos 14 (dos entrenamientos hoy son un día)');
eq(pRitmo.diasAnteriores, 2, '…frente a 2 en los 14 anteriores');
eq(pRitmo.tendencia, 'subiendo', '…ritmo «subiendo»');
const pMixto = prediccionConstanciaEntreno({ fitness: conSesiones([entrenamiento(addDays(HOY, -2))]), calistenia: { l: { sesiones: [{ fecha: '2026-08-01' }, { fecha: '2026-08-02' }, { fecha: addDays(HOY, -16) }, { fecha: addDays(HOY, -2) }] } } }, HOY);
eq(pMixto.diasRecientes, 1, 'Con la calistenia de antes: el día que coincide con Fitness cuenta una vez');
eq(pMixto.diasAnteriores, 1, '…y su día de la quincena anterior también cuenta');
eq(pMixto.tendencia, 'estable', '…1 frente a 1: estable');

const PRED = leer('src/views/PredictionsView.jsx');
ok(!/habilidad/.test(PRED.replace(/\/\*[\s\S]*?\*\//g, '')), '🐛 Predicciones ya no pide «sesiones en alguna habilidad», que no se pueden registrar');

const pr1 = (estado) => calcularLogros(estado).find((l) => l.id === 'pr1');
eq(pr1({ calistenia: { planche: { prs: [{ valor: '30s hold' }] } } }).conseguido, true, '«Primer PR» conseguido con un PR de calistenia: se conserva');
eq(pr1({ calistenia: {} }).conseguido, false, '…sin PRs de calistenia sigue bloqueado');
eq(calcularLogros({ fitness: ritmo, calistenia: {} }).find((l) => l.id === 'pr1').conseguido, false,
  '🔓 Fase 1C · …y entrenar en Fitness SIN superar ninguna marca no lo desbloquea (la Fase 1B decía «no hay equivalencia segura»: ahora la hay, superar una marca — ver la sección 9)');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. CX-14 · «Hace N días» cuenta días de calendario, no horas ──');

const estadoHoy = (fecha) => ({
  salud: { medidas: [{ fecha, peso: 70 }] },
  diario: { entradas: [{ fecha, animo: 4 }] },
  fe: { servicio: [{ fecha, tipo: 'Misa' }] },
  fitness: conSesiones([entrenamiento(fecha)]),
});
const lineas = (estado) => ({
  salud: calcularResumenModulo('salud', estado).linea2,
  diario: calcularResumenModulo('diario', estado).linea1,
  fe: calcularResumenModulo('fe', estado).linea2,
  entreno: calcularResumenModulo('entreno', estado).linea2,
});
const tarde = conReloj(2026, 10, 19, 15, 0, () => lineas(estadoHoy('2026-10-19')));
eq(tarde.salud, 'Último registro hoy', '🐛 Registrado HOY y mirado a las 15:00: «hoy» (antes «hace 1 día» a partir de mediodía)');
eq(tarde.diario, 'Última entrada hoy', '…lo mismo en el Diario');
eq(tarde.fe, 'Hoy', '…en Fe');
eq(tarde.entreno, 'Último entrenamiento hoy', '…y en el entrenamiento');
const casiMedianoche = conReloj(2026, 10, 19, 23, 59, () => lineas(estadoHoy('2026-10-19')));
eq(casiMedianoche.salud, 'Último registro hoy', 'Registrado hoy y mirado a las 23:59: sigue siendo «hoy»');
const ayerTarde = conReloj(2026, 10, 19, 23, 59, () => lineas(estadoHoy('2026-10-18')));
eq(ayerTarde.diario, 'Última entrada hace 1 día', '🐛 Lo de ayer mirado a las 23:59: «hace 1 día» (antes «hace 2»)');
const pasadaMedianoche = conReloj(2026, 10, 20, 0, 5, () => lineas(estadoHoy('2026-10-19')));
eq(pasadaMedianoche.fe, 'Hace 1 día', 'Pasada la medianoche, lo de antes de dormir ya es «hace 1 día»');
eq(conReloj(2026, 10, 19, 12, 0, () => todayISO()), '2026-10-19', '(el reloj de mentira funciona: hoy es el 19)');

const tzAntes = process.env.TZ;
process.env.TZ = 'Europe/Madrid';
const cambioDeHora = calcularResumenModulo('diario', { diario: { entradas: [{ fecha: '2026-10-24', animo: 3 }] } }, '2026-10-26').linea1;
process.env.TZ = tzAntes === undefined ? '' : tzAntes;
if (tzAntes === undefined) delete process.env.TZ;
eq(cambioDeHora, 'Última entrada hace 2 días', 'Con el cambio de hora de octubre (día de 25 h) en Madrid: 2 días, no 2,04 redondeado a otra cosa');

const rota = calcularResumenModulo('diario', { diario: { entradas: [{ fecha: 'ayer', animo: 3 }] } }, HOY);
eq(rota.linea1, FECHA_NO_DISPONIBLE, 'Una fecha rota no da «hace null días» ni «hace NaN días»: dice que no está');
const RH = leer('src/lib/resumenesHub.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
ok(!/Date\.now\(\)\s*-\s*new Date\(`\$\{fechaISO\}/.test(RH), '🐛 No queda la resta de horas contra la medianoche del registro');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. CX-15 · Progreso reconoce el Diario (y las formas reales de los datos) ──');

const vacio = {};
eq(hayDatosPara('estadisticas', vacio), false, 'Sin datos: Estadísticas no tiene nada');
eq(hayDatosPara('estadisticas', { diario: { entradas: [{ fecha: HOY, animo: 4 }] } }), true,
  '🐛 Con entradas de Diario y ninguna noche: Estadísticas SÍ tiene datos (antes decía que no)');
eq(hayDatosPara('estadisticas', { diario: { entradas: [] } }), false, 'Con el Diario vacío: no');
eq(hayDatosPara('estadisticas', { fitness: conSesiones([entrenamiento(HOY)]) }), true, 'Con un entrenamiento de Fitness: sí');
eq(hayDatosPara('estadisticas', { fitness: conSesiones([enCurso(HOY)]) }), false, '…uno en curso todavía no');
eq(hayDatosPara('estadisticas', { calistenia: { planche: { sesiones: [{ fecha: '2026-09-01' }] } } }), true, 'Con la calistenia de antes: sí (antes, como era un objeto, contaba 0)');
eq(hayDatosPara('estadisticas', { estudios: { horas: [{ fecha: HOY, horas: 1 }] } }), true, 'Con horas de estudio: sí');
eq(hayDatosPara('predicciones', { objetivos: { lista: [{ id: 'o', texto: 'Aprobar' }] } }), true,
  '🐛 Predicciones con objetivos guardados como `{ lista }` (su forma real): sí');
eq(hayDatosPara('predicciones', { salud: { historial: [{ id: 'h' }] } }), false,
  '…y el historial MÉDICO de Salud ya no cuenta: ninguna tarjeta de Predicciones lo usa');
eq(hayDatosPara('predicciones', { salud: { medidas: [{ fecha: HOY, peso: 70 }] } }), true, '…las medidas sí (la tarjeta de peso)');
eq(hayDatosPara('logros', { objetivos: { lista: [{ id: 'o' }] } }), true, 'Logros con un objetivo: sí');
eq(hayDatosPara('logros', vacio), false, 'Logros sin registros: no (una insignia bloqueada no es un dato)');
eq(hayDatosPara('inventada', vacio), null, 'Una sub-app que no existe: `null`');
const soloRelacion = { relacion: { fechas: [{ fecha: HOY, etiqueta: 'x' }], album: [{ id: 'a' }] } };
ok(['estadisticas', 'predicciones', 'logros'].every((id) => hayDatosPara(id, soloRelacion) === false),
  '🔒 Los datos de Relación no cuentan en ninguna: no se amplía el acceso a lo privado');
/* ⚠️ Con límite de palabra: «Correlaciones» contiene «relacion» (la lección de «experto» y «xp»). */
const NUMEROS_CODIGO = leer('src/lib/numeros.js').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/\brelaci[oó]n\b/i.test(JSON.stringify(Object.values(SERIES_DE_NUMEROS).flat().map((x) => x.serie))) && !/\brelacion\b/.test(NUMEROS_CODIGO),
  '🔒 …ni aparece en las series que se miran');
ok(/\brelacion\b/.test('s.relacion.fechas') && !/\brelacion\b/.test('Correlaciones entre lo que registras'),
  '…y ese barrido caza `s.relacion` sin saltar con «Correlaciones»');
eq(resumenNumeros({ diario: { entradas: [{ fecha: HOY, animo: 3 }] } }).linea2, '2 de 3 con datos',
  '🐛 Con solo el Diario: «2 de 3» (Estadísticas y Logros; antes «1 de 3»)');
eq(resumenNumeros({ diario: { entradas: [{ fecha: HOY, animo: 3 }] }, objetivos: { lista: [{ id: 'o' }] } }).linea2, '3 de 3 con datos',
  '…y con un objetivo, las tres');
eq(resumenNumeros(vacio).estado, 'vacio', 'Sin nada: vacío, sin «0 de 3»');

const STATS = leer('src/views/StatsView.jsx');
ok(/correlacionEntrenoAnimo\(\{ fitness, calistenia \}, entradas\)/.test(STATS), 'Estadísticas pasa Fitness y la calistenia de antes a la correlación');
ok(!/Entrenar calistenia/.test(STATS), '…y la tarjeta ya no se titula con algo que no se puede registrar');
ok(/Array\.isArray\(diario\?\.entradas\)/.test(STATS), '…y no se cae con un `diario` sin `entradas`');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Lo que NO se toca ──');

const AI_PROMPT = /habilidadesActivas/;
ok(AI_PROMPT.test(DASH), '🔒 El prompt del panel de IA de Inicio sigue igual (DA-09: los paneles de IA no se tocan en esta fase)');
const LOGROS_SRC = leer('src/lib/logros.js');
ok(/prsCalistenia >= 1/.test(LOGROS_SRC), '«Primer PR» conserva su cálculo');
ok(!/saveData|loadData/.test(leer('src/lib/fechasDeEntreno.js') + leer('src/lib/sesionesCompletadas.js') + leer('src/lib/correlaciones.js')),
  'Las lecturas nuevas no escriben ni leen del almacén: no se migra ni se borra nada');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Datos y métricas (Fase 1B) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
