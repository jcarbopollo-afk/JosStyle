/* Entrega 4 · FIT F10/45 — Historial de entrenamientos y detalle de sesiones.
   ═══════════════════════════════════════════════════════════════════════════
   Lo que más se vigila, por orden:
   1. Que solo entren las sesiones COMPLETADAS (apartados 4, 37 y 38).
   2. Que no haya un segundo modelo ni una segunda cuenta (apartado 3): el
      historial dice lo mismo que el resumen de la F8.
   3. Que los filtros se combinen y se limpien (apartados 33 y 34).
   4. Que planificado y realizado sigan separados, y que un isométrico diga
      segundos (apartados 20 y 25).
   5. Que eliminar vaya a la papelera y sea idempotente (apartados 28 y 29). */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ESTADO_DEL_HISTORIAL, sesionesDelHistorial, etiquetaDeFecha, entornoDeSesion, relacionConPlan,
  FILTROS_FECHA, FILTROS_PLAN, ORDENES_HISTORIAL, FILTROS_POR_DEFECTO, hayFiltros,
  normalizarBusqueda, rangoDeFecha, fichaDeHistorial, HISTORIAL_VACIO, SIN_RESULTADOS,
  contadorTexto, PAGINA_HISTORIAL, consultarHistorial, filaDeSerieHistorial, realizadoEnDetalle,
  detalleDeSesion, AVISO_ELIMINAR_SESION, SESION_YA_NO_ESTA, sesionDelHistorial,
  NO_EN_FIT10, DECISIONES_FIT10,
} from '../src/lib/historial.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, quitarSerie, anadirSerie,
  sustituirEjercicio, notaDeEjercicio, guardarSesion, descartarSesion,
  normalizarFitnessConSesiones,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento, resumenDeSesion } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { usarPlan } from '../src/lib/planes.js';
import { CATALOGO_PAPELERA, prepararEliminacion } from '../src/lib/papelera.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-17'; // jueves
const hora = (iso, h, m = 0) => new Date(`${iso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).getTime();

/* Dos rutinas de verdad: una de gimnasio con peso, y un core con un isométrico
   y unas dominadas a peso corporal. */
let push = crearRutina({ nombre: 'Push' });
push = anadirEjercicio(push, 'press-banca-barra');
push = editarLinea(push, push.lineas[0].id, { series: 4, repeticiones: 8, repsHasta: 10 });
push = anadirEjercicio(push, 'press-banca-mancuernas');
push = editarLinea(push, push.lineas[1].id, { series: 3, repeticiones: 10 });

let core = crearRutina({ nombre: 'Core' });
core = anadirEjercicio(core, 'l-sit');
core = editarLinea(core, core.lineas[0].id, { series: 2, duracion: 15 });

/* Entrena y guarda de verdad, por la F7 y la F8. */
function entrenar({ nombre, lineas, fecha, h = 18, minutos = 50, hacer = () => {}, planId = null, origenTipo = 'plantilla', origenId = null, entorno = '', notas = '' }) {
  const inicio = hora(fecha, h);
  let s = empezarSesion({ nombre, lineas, hoy: fecha, ahora: inicio, planId, origenTipo, origenId, entorno });
  s = hacer(s) || s;
  const fin = inicio + minutos * 60000;
  const cerrada = pasarAFinalizacion(s, { ahora: fin });
  return guardarEntrenamiento(cerrada, { confirmado: true, ahora: fin + 1000, notas }).sesion;
}
const marcarTodo = (i, datos = {}) => (s) => {
  let x = s;
  const e = ejerciciosDeSesion(x)[i];
  for (const serie of e.series) {
    x = editarSerie(x, e.id, serie.id, datos);
    x = marcarSerie(x, e.id, serie.id, true);
  }
  return x;
};

const S_HOY = entrenar({
  nombre: 'Push — Fuerza', lineas: push.lineas, fecha: HOY, h: 18, minutos: 57, entorno: 'gym',
  notas: 'Buen entrenamiento.',
  hacer: (s) => {
    let x = marcarTodo(0, { peso: 60, reps: 8 })(s);
    const e1 = ejerciciosDeSesion(x)[1];
    x = editarSerie(x, e1.id, e1.series[0].id, { peso: 22.5, reps: 10 });
    x = marcarSerie(x, e1.id, e1.series[0].id, true);
    x = quitarSerie(x, e1.id, e1.series[2].id);
    x = anadirSerie(x, ejerciciosDeSesion(x)[0].id);
    x = notaDeEjercicio(x, ejerciciosDeSesion(x)[0].id, 'Mejor técnica que la última sesión.');
    return x;
  },
});
const S_AYER = entrenar({
  nombre: 'Core', lineas: core.lineas, fecha: '2026-09-16', minutos: 20, entorno: 'calistenia',
  hacer: (s) => {
    const e = ejerciciosDeSesion(s)[0];
    let x = editarSerie(s, e.id, e.series[0].id, { duracion: 12 });
    x = marcarSerie(x, e.id, e.series[0].id, true);
    x = editarSerie(x, e.id, e.series[1].id, { duracion: 10 });
    return marcarSerie(x, e.id, e.series[1].id, true);
  },
});
const S_VIEJA = entrenar({
  nombre: 'Piérnas en casa', lineas: push.lineas, fecha: '2026-06-02', minutos: 35,
  hacer: (s) => {
    const e = ejerciciosDeSesion(s)[0];
    const x = sustituirEjercicio(s, e.id, 'press-banca-mancuernas');
    const e2 = ejerciciosDeSesion(x)[0];
    return marcarSerie(editarSerie(x, e2.id, e2.series[0].id, { peso: 20, reps: 12 }), e2.id, e2.series[0].id, true);
  },
});
/* Las que NO pueden aparecer. */
const EN_CURSO = empezarSesion({ nombre: 'En curso', lineas: push.lineas, hoy: HOY, ahora: hora(HOY, 20) });
const SIN_GUARDAR = pasarAFinalizacion(empezarSesion({ nombre: 'Sin guardar', lineas: push.lineas, hoy: HOY, ahora: hora(HOY, 7) }), { ahora: hora(HOY, 8) });
const DESCARTADA = descartarSesion(empezarSesion({ nombre: 'Descartada', lineas: push.lineas, hoy: HOY, ahora: hora(HOY, 9) }), { confirmado: true }).sesion;

let F = { ...DEFAULT_FITNESS };
for (const s of [S_VIEJA, EN_CURSO, S_AYER, SIN_GUARDAR, S_HOY, DESCARTADA]) F = guardarSesion(F, s);

console.log('\n═══ FIT F10/45 · Historial de entrenamientos ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Qué sesiones entran (apartados 4, 37 y 38) ──');

const H = sesionesDelHistorial(F);
ok(ESTADO_DEL_HISTORIAL === 'completada', 'El historial lee las sesiones completadas del modelo de la F1');
ok(H.length === 3, `🚨 Entran las TRES completadas, y nada más (${H.length})`);
ok(!H.some((s) => s.id === EN_CURSO.id), '🚨 Una sesión en curso NO aparece (apartado 38)');
ok(!H.some((s) => s.id === SIN_GUARDAR.id), '🚨 …ni una terminada y sin guardar');
ok(!H.some((s) => s.id === DESCARTADA.id), '🚨 …ni una descartada (apartado 38)');
ok(sesionesDelHistorial({}).length === 0 && sesionesDelHistorial(null).length === 0, 'Sin datos, lista vacía y sin romper');

/* Apartado 37 — lo que guarda la F8 aparece solo. */
const nueva = entrenar({ nombre: 'Recién guardada', lineas: core.lineas, fecha: HOY, h: 21, hacer: marcarTodo(0, { duracion: 20 }) });
ok(sesionesDelHistorial(guardarSesion(F, nueva)).some((s) => s.id === nueva.id),
  '🚨 Una sesión que la F8 guarda aparece en el historial SIN ningún paso más (apartado 37)');

/* Persistencia — lo mismo después de guardar y recargar. */
const recargado = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(F)));
ok(sesionesDelHistorial(recargado).length === 3, '🚨 Tras guardar y recargar, el historial es el mismo (apartado 36)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Fechas (apartados 5 y 39) ──');

ok(etiquetaDeFecha(HOY, HOY) === 'Hoy', '«Hoy»');
ok(etiquetaDeFecha('2026-09-16', HOY) === 'Ayer', '«Ayer»');
ok(etiquetaDeFecha('2026-09-10', HOY) === '10 septiembre 2026', '…y el resto en largo: «10 septiembre 2026»');
ok(etiquetaDeFecha('2026-09-01', '2026-09-02') === 'Ayer', '⚠️ «Ayer» también cruzando de mes');
ok(etiquetaDeFecha('', HOY) === '' && etiquetaDeFecha('basura', HOY) === '', 'Una fecha rota no revienta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. La tarjeta (apartados 6 y 7) ──');

const FICHAS = H.map((s) => fichaDeHistorial(s, { fitness: F, hoy: HOY }));
const fHoy = FICHAS.find((x) => x.id === S_HOY.id);
const rHoy = resumenDeSesion(S_HOY, { ahora: S_HOY.terminadaEn });
ok(fHoy.nombre === 'Push — Fuerza', 'La tarjeta lleva el nombre');
ok(fHoy.duracion === '57 min', `…la duración real (${fHoy.duracion})`);
ok(fHoy.hora === '18:00', `…la hora de inicio (${fHoy.hora})`);
ok(fHoy.series === rHoy.seriesCompletadas && fHoy.seriesPlanificadas === rHoy.seriesPlanificadas,
  '🚨 …y las MISMAS series que el resumen de la F8: no hay una segunda cuenta (apartado 3)');
ok(fHoy.parcial === true && fHoy.seriesTexto === `${rHoy.seriesCompletadas}/${rHoy.seriesPlanificadas} series`,
  `🚨 Una sesión parcial dice «${fHoy.seriesTexto}», no que se completó entera (apartado 7)`);
ok(!/mal|solo|incomplet|falt/i.test(fHoy.seriesTexto), '…sin tono negativo: es información');
const fAyer = FICHAS.find((x) => x.id === S_AYER.id);
ok(fAyer.parcial === false && fAyer.seriesTexto === '2 series', `Una completa dice solo «${fAyer.seriesTexto}»`);
ok(fHoy.ejerciciosTexto === '2 ejercicios', `…y los ejercicios realizados (${fHoy.ejerciciosTexto})`);
ok(fHoy.entorno === 'gym' && fHoy.entornoNombre === 'Gimnasio', 'El entorno guardado al empezar se lee');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Entorno y plan (apartados 12 y 13) ──');

ok(entornoDeSesion(S_VIEJA, F) === null, '⚠️ Una sesión sin entorno ni plan del que sacarlo es `null`, no un entorno inventado');
const Fplan = usarPlan({ ...DEFAULT_FITNESS }, 'ppl-estetico', { hoy: HOY }).fitness;
const conPlan = { ...S_VIEJA, id: 'x-plan', planId: Fplan.planActivo.planId, origen: { ...S_VIEJA.origen, tipo: 'preset' }, entorno: '' };
ok(!!entornoDeSesion(conPlan, Fplan), `…pero la de un plan de la biblioteca lo deduce de él (${entornoDeSesion(conPlan, Fplan)})`);
ok(relacionConPlan(conPlan, Fplan) === 'activo', 'Una sesión del plan activo es «Plan activo»');
ok(relacionConPlan(conPlan, { ...DEFAULT_FITNESS }) === 'otro', '…y si ya no es el activo, «Otros planes»');
ok(relacionConPlan(S_HOY, F) === 'independiente', '…y una sin plan, «Independientes»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Búsqueda y filtros (apartados 10-15, 33 y 34) ──');

ok(normalizarBusqueda('  PIÉRNAS ') === 'piernas', 'La búsqueda ignora mayúsculas, acentos y espacios');
const q = (filtros) => consultarHistorial(FICHAS, filtros, { hoy: HOY });
ok(q({}).cuantas === 3 && q({}).contador === '3 entrenamientos', `Sin filtros, las tres (${q({}).contador})`);
ok(q({ busqueda: 'push' }).cuantas === 1, 'Buscar «push» encuentra una');
ok(q({ busqueda: 'piernas' }).fichas[0]?.id === S_VIEJA.id, '🚨 «piernas» encuentra «Piérnas en casa» (apartado 10: tolerante a acentos)');
ok(q({ busqueda: 'FUERZA' }).cuantas === 1, '…y «FUERZA» a «Fuerza»');
ok(q({ busqueda: 'zzz' }).sinResultados === true && q({ busqueda: 'zzz' }).vacio === false,
  '🚨 Sin coincidencias es «sin resultados», NO «vacío» (apartado 35)');

const semana = rangoDeFecha('semana', HOY);
ok(semana.desde === '2026-09-14' && semana.hasta === '2026-09-20', `Esta semana es de lunes a domingo (${semana.desde} → ${semana.hasta})`);
ok(JSON.stringify(rangoDeFecha('mes', HOY)) === JSON.stringify({ desde: '2026-09-01', hasta: '2026-09-30' }), 'Este mes, del 1 al 30');
ok(rangoDeFecha('tres_meses', HOY).desde === '2026-06-17', `Últimos 3 meses desde el ${rangoDeFecha('tres_meses', HOY).desde}`);
ok(JSON.stringify(rangoDeFecha('rango', HOY, { desde: '2026-09-20', hasta: '2026-09-01' })) === JSON.stringify({ desde: '2026-09-01', hasta: '2026-09-20' }),
  '⚠️ Un rango puesto al revés se entiende');
ok(rangoDeFecha('semana', '2026-09-20').desde === '2026-09-14', '⚠️ El domingo sigue siendo de su semana (no de la siguiente)');
ok(q({ fecha: 'semana' }).cuantas === 2, 'Esta semana: hoy y ayer');
ok(q({ fecha: 'tres_meses' }).cuantas === 2, '⚠️ Últimos 3 meses deja fuera la del 2 de junio');
ok(q({ fecha: 'rango', desde: '2026-06-01', hasta: '2026-06-30' }).cuantas === 1, 'Un rango personalizado funciona (apartado 11)');
ok(q({ fecha: 'rango' }).cuantas === 3, '…y sin fechas puestas no quita nada');

ok(q({ entorno: 'calistenia' }).cuantas === 1, 'Filtrar por entorno');
ok(q({ entorno: 'casa' }).cuantas === 0, '…una sesión sin entorno no entra en uno concreto');
ok(q({ entorno: 'todos' }).cuantas === 3, '🚨 …pero con «Todos» no desaparece (apartado 13: no romper el filtro)');
ok(q({ fecha: 'semana', entorno: 'calistenia' }).cuantas === 1 && q({ fecha: 'semana', busqueda: 'push' }).cuantas === 1,
  '🚨 Los filtros se COMBINAN: esta semana + calistenia, push + esta semana (apartado 33)');

const opc = q({});
ok(opc.opcionesEntorno.map((o) => o.id).join() === 'todos,gym,calistenia',
  `🚨 Solo se ofrecen los entornos con sesiones: nada de «Casa» sin ninguna (apartado 12) → ${opc.opcionesEntorno.map((o) => o.id).join()}`);
ok(opc.opcionesPlan.map((o) => o.id).join() === 'todos,independiente', '…y lo mismo con el plan');
ok(q({ entorno: 'calistenia' }).opcionesEntorno.length === 3, '⚠️ …mirando TODAS las sesiones: elegir uno no hace desaparecer los otros del selector');

ok(q({}).agrupado === true && q({}).grupos.map((g) => g.etiqueta).join('|') === 'Hoy|Ayer|2 junio 2026',
  `🚨 Más recientes primero, agrupado por fecha (${q({}).grupos.map((g) => g.etiqueta).join(' · ')}, apartado 5)`);
ok(q({ orden: 'antiguos' }).fichas[0].id === S_VIEJA.id, 'Más antiguos primero');
ok(q({ orden: 'mas_larga' }).fichas[0].id === S_HOY.id && q({ orden: 'mas_corta' }).fichas[0].id === S_AYER.id, 'Por duración, en los dos sentidos');
ok(q({ orden: 'mas_larga' }).agrupado === false, '⚠️ Ordenando por duración no se agrupa por fecha: los grupos saldrían partidos');
ok(ORDENES_HISTORIAL.length === 4 && ORDENES_HISTORIAL[0].id === 'recientes', 'Cuatro órdenes, «Más recientes» por defecto (apartado 14)');

ok(hayFiltros(FILTROS_POR_DEFECTO) === false && hayFiltros({ busqueda: '   ' }) === false, 'Sin filtros no hay nada que limpiar (una búsqueda de espacios tampoco)');
ok(hayFiltros({ entorno: 'gym' }) && hayFiltros({ orden: 'antiguos' }), '…y con uno, sí (apartado 34)');
ok(q(FILTROS_POR_DEFECTO).cuantas === 3, '🚨 Limpiar filtros devuelve la lista entera (apartado 34)');
ok(FILTROS_FECHA.length === 5 && FILTROS_PLAN.length === 4, 'Los filtros del enunciado');

const vacia = consultarHistorial([], {}, { hoy: HOY });
ok(vacia.vacio === true && vacia.sinResultados === false && vacia.total === 0, 'Sin sesiones: «vacío»');
ok(HISTORIAL_VACIO.titulo === 'Aún no tienes entrenamientos' && HISTORIAL_VACIO.cta === 'Empezar entrenamiento', 'Con el texto y el botón del apartado 9');
ok(SIN_RESULTADOS.titulo === 'No hay entrenamientos que coincidan', 'Y el «sin resultados» del apartado 35');
ok(contadorTexto(1) === '1 entrenamiento' && contadorTexto(24) === '24 entrenamientos', 'El contador en singular y plural');

/* Apartado 32 — cientos de sesiones. */
const muchas = Array.from({ length: 400 }, (_, i) => ({ ...fHoy, id: `m${i}`, fecha: `2026-0${1 + (i % 9)}-${String(1 + (i % 28)).padStart(2, '0')}`, momento: i }));
const t0 = Date.now();
const grande = consultarHistorial(muchas, { busqueda: 'push', fecha: 'tres_meses', orden: 'mas_larga' }, { hoy: HOY });
ok(Date.now() - t0 < 200 && grande.total === 400, `🚨 400 sesiones se consultan en ${Date.now() - t0} ms (apartado 32)`);
ok(PAGINA_HISTORIAL > 0 && PAGINA_HISTORIAL <= 50, `…y la lista pinta de ${PAGINA_HISTORIAL} en ${PAGINA_HISTORIAL}`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. El detalle (apartados 16-27) ──');

const D = detalleDeSesion(S_HOY, { fitness: F, hoy: HOY });
ok(D.nombre === 'Push — Fuerza' && D.fechaTexto === '17 septiembre 2026' && D.duracion === '57 min',
  'La cabecera: nombre, fecha en largo y duración (apartado 16)');
ok(D.inicio === '18:00' && D.fin === '18:57', `Inicio y final (${D.inicio} → ${D.fin}, apartado 17)`);
ok(D.seriesTexto === rHoy.seriesTexto, `Las series, las mismas que la F8 (${D.seriesTexto})`);
ok(D.volumen && D.volumen.texto === rHoy.volumen.texto, `🚨 El volumen, solo el fiable de la F8 (${D.volumen && D.volumen.texto}, apartado 26)`);
ok(D.notas === 'Buen entrenamiento.', 'La nota general (apartado 24)');
const DA = detalleDeSesion(S_AYER, { fitness: F, hoy: HOY });
ok(DA.volumen === null, '🚨 Un entrenamiento de isométricos NO tiene volumen, y no se inventa un «0 kg» (apartado 26)');
ok(DA.notas === '', '…ni nota si no la escribió: sin bloque vacío (apartado 24)');

const banca = D.ejercicios[0];
ok(banca.planificado === '4 × 8–10', `🚨 Planificado «${banca.planificado}» (apartado 25)`);
ok(banca.realizado === '8 / 8 / 8 / 8', `…y realizado «${banca.realizado}», por separado`);
ok(banca.seriesTexto === '4/5 series', `«${banca.seriesTexto}»: cuatro del plan hechas y la extra sin hacer (apartado 18)`);
ok(banca.realizadoDetalle[0] === '8 × 60 kg', `…con los datos de cada serie («${banca.realizadoDetalle[0]}»)`);
ok(banca.notas === 'Mejor técnica que la última sesión.', 'La nota del ejercicio (apartado 23)');
ok(banca.filas.length === 5 && banca.filas[4].extra === true, '🚨 La serie añadida se identifica como «Extra» (apartado 22)');
ok(banca.filas[0].peso === '60 kg' && banca.filas[0].medida === '8' && banca.filas[0].estadoTexto === 'Hecha',
  'Cada serie: peso, repeticiones y estado (apartado 19)');
const manc = D.ejercicios[1];
ok(manc.filas.some((f) => f.estadoTexto === 'Omitida' && f.medida === '—'), '🚨 Una omitida se ve como «Omitida», con «—» y no con ceros (apartado 19)');
ok(manc.filas[0].peso === '22,5 kg', `⚠️ Los decimales en español: «${manc.filas[0].peso}»`);

const lsit = DA.ejercicios[0];
ok(lsit.porTiempo === true && lsit.filas[0].medida === '12 s' && lsit.filas[1].medida === '10 s',
  '🚨 Un isométrico dice SEGUNDOS: «12 s» y «10 s», nunca repeticiones (apartado 20)');
ok(lsit.realizado === '12 s / 10 s', `…también en el resumen (${lsit.realizado})`);

const DV = detalleDeSesion(S_VIEJA, { fitness: F, hoy: HOY });
ok(DV.ejercicios[0].sustituido === true && /Press/i.test(DV.ejercicios[0].original),
  `🚨 Un ejercicio sustituido dice de cuál venía («${DV.ejercicios[0].original}» → «${DV.ejercicios[0].nombre}», apartado 21)`);
ok(DV.ejercicios[0].realizadoDetalle[0] === '12 × 20 kg', '…y enseña los datos del ejercicio que de verdad hizo');

const conCorporal = { ...S_AYER, origen: { ...S_AYER.origen, ejercicios: ejerciciosDeSesion(S_AYER).map((e) => ({ ...e, modo: 'reps', linea: { ...e.linea, tipoCarga: 'corporal' }, series: e.series.map((s) => ({ ...s, modo: 'reps', hecho: { ...s.hecho, reps: 8, peso: null } })) })) } };
ok(realizadoEnDetalle(ejerciciosDeSesion(conCorporal)[0])[0] === '8 × peso corporal',
  '«8 × peso corporal» cuando la línea era a peso corporal (apartado 18, su ejemplo)');
const sinCarga = { ...ejerciciosDeSesion(conCorporal)[0], linea: { tipoCarga: 'externo' } };
ok(realizadoEnDetalle(sinCarga)[0] === '8', '⚠️ …y un peso que no se apuntó NO se convierte en «peso corporal»');
ok(filaDeSerieHistorial({ id: 'a', numero: 1, estado: 'pendiente', modo: 'reps', hecho: {} }).estadoTexto === 'Sin hacer', 'Una pendiente dice «Sin hacer»');
ok(detalleDeSesion(null) === null, 'Sin sesión no revienta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Eliminar (apartados 28, 29 y 30) ──');

ok(AVISO_ELIMINAR_SESION.titulo === '¿Eliminar este entrenamiento?' && AVISO_ELIMINAR_SESION.cancelar === 'Cancelar'
  && AVISO_ELIMINAR_SESION.eliminar === 'Eliminar', 'El aviso del apartado 28');
ok(/Papelera/.test(AVISO_ELIMINAR_SESION.texto), '…que promete la papelera, porque va a la papelera');
ok(!!CATALOGO_PAPELERA['fitness.sesiones'], '🚨 `fitness.sesiones` está en la papelera: borrar un entrenamiento no es para siempre');
const r1 = prepararEliminacion(F, 'fitness', 'sesiones', S_AYER.id, '2026-09-17T19:00:00.000Z');
ok(r1 && r1.moduloActualizado.sesiones.length === F.sesiones.length - 1, 'Eliminar quita UNA sesión');
ok(sesionesDelHistorial(r1.moduloActualizado).length === 2 && !sesionDelHistorial(r1.moduloActualizado, S_AYER.id),
  '…y deja de estar en el historial');
ok(JSON.stringify(r1.moduloActualizado.plantillas) === JSON.stringify(F.plantillas)
  && JSON.stringify(r1.moduloActualizado.planActivo) === JSON.stringify(F.planActivo),
  '🚨 …sin tocar ni plantillas ni el plan (apartado 28)');
ok(r1.moduloActualizado.sesiones.some((s) => s.id === S_HOY.id), '…ni las demás sesiones');
ok(prepararEliminacion(r1.moduloActualizado, 'fitness', 'sesiones', S_AYER.id, '2026-09-17T19:00:01.000Z') === null,
  '🚨 Eliminar dos veces no hace nada la segunda: idempotente (apartado 29)');
ok(SESION_YA_NO_ESTA.titulo === 'Este entrenamiento ya no está', '…y si se abre una que ya no existe, hay un estado para decirlo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. La pantalla y la arquitectura ──');

const VISTA = sinComentarios(leer('src/views/HistorialView.jsx'));
const LIB = sinComentarios(leer('src/lib/historial.js'));
ok(!/saveData|onGuardar|editarSerie|marcarSerie|notaDeEjercicio/.test(VISTA),
  '🚨 La pantalla es de CONSULTA: no escribe ni una serie ni una nota (apartado 30)');
ok(!/Compartir/i.test(VISTA), '🚨 …y no hay un «Compartir» muerto (apartado 31)');
ok(/resumenDeSesion/.test(LIB) && /resumenPlanificado/.test(LIB) && /volumenDeSesion/.test(LIB),
  '🚨 El historial se apoya en la F8 y la F9 en vez de volver a contar (apartado 3)');
ok(!/toISOString/.test(LIB), '⚠️ Ni una fecha sacada de `toISOString` (invariante 12)');
ok(/aria-pressed=\{activo\}/.test(VISTA) && /<Check /.test(VISTA), 'El filtro elegido se anuncia y lleva ✓, no solo color (apartado 42)');
ok(/aria-expanded=\{abierto\}/.test(VISTA), 'Un ejercicio se despliega y lo anuncia (apartado 19)');
ok(/max-w-2xl mx-auto/.test(VISTA), 'En escritorio el contenido tiene un ancho cómodo (apartado 41)');
ok(/PAGINA_HISTORIAL/.test(VISTA) && /Ver más/.test(leer('src/views/HistorialView.jsx')), 'La lista pinta por páginas (apartado 32)');
ok(/useMemo\(\s*\(\) => sesionesDelHistorial/.test(VISTA), '…y las tarjetas se calculan una vez, no en cada tecla');

const FITNESS_VIEW = leer('src/views/FitnessView.jsx');
ok(/dentro === 'historial'/.test(FITNESS_VIEW) && /<HistorialView/.test(FITNESS_VIEW), 'El historial está en Entrenamiento (apartado 2)');
ok(/id: 'historial'[^}]*existe: true/.test(leer('src/lib/fitness.js')), '…como una sección más, al lado de Más planes y Ejercicios');
ok(/eliminarConPapelera\('fitness', 'sesiones'/.test(leer('src/App.jsx')), 'Y eliminar llega a `App.jsx` por la papelera, como las plantillas');
ok(/entorno: resuelto\.plan\.entorno|entorno: plantilla\.entorno/.test(FITNESS_VIEW), '🚨 Al empezar un entrenamiento se guarda su entorno (apartado 13)');

ok(NO_EN_FIT10.length >= 4 && NO_EN_FIT10.every((x) => x.que && x.porque.length > 20), 'Lo que no se construye, con su motivo');
ok(DECISIONES_FIT10.length >= 3, '…y las decisiones, anotadas');

console.log(`\n  ${total - fallos}/${total} comprobaciones correctas.`);
if (fallos) {
  console.log(`  \x1b[31m${fallos} fallo(s).\x1b[0m\n`);
  process.exit(1);
}
