/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 7/8 — LA DISCIPLINA: PERIODOS, INDICADORES, CALENDARIO Y DETALLE DE
   UNA FECHA (prompt 7 §4, §5, §8, §9 y §10)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 No calcula ningún estado: cada fecha la decide el motor de la Fase 4
   (`estadoDeFecha`, sobre `analisisDeCumplimiento`, que se calcula una vez por
   `fitness`). Aquí solo se CUENTAN esos estados y se ordenan para pintar. Así el
   calendario, la ventana de siete días, la tarjeta de recuperación y estas
   estadísticas no pueden decir cosas distintas del mismo día.

   ── LOS PERIODOS (§9) ──────────────────────────────────────────────────────
   Fechas naturales, en la hora del dispositivo (`addDays`, sin UTC), con los dos
   extremos incluidos, y **nunca más allá de hoy** (un día que no ha llegado no se
   evalúa):
   · `siete`  — hoy y los seis días anteriores (ventana MÓVIL, no de lunes a domingo).
   · `treinta` — hoy y los veintinueve anteriores.
   · `mes_actual` — del día 1 de este mes hasta hoy.
   · `mes_anterior` — el mes anterior entero (cruza el año en enero).
   · `personalizado` — de `desde` a `hasta` (si van al revés se entiende; `hasta`
     se recorta a hoy).

   ── LOS INDICADORES (§8) ───────────────────────────────────────────────────
   Cada fecha del periodo cuenta UNA vez, por su estado:
   · previstos        = días de entreno ya evaluables: cumplido + recuperado +
                        parcial + pendiente + perdido.
   · completos        = cumplido (en su fecha; «Completar entrenamiento» cuenta, D-03).
   · recuperados      = recuperado (la fecha ORIGINAL; el día en que se recuperó
                        se evalúa por lo que tocaba ese día, nunca como un segundo
                        entrenamiento hecho — no hay doble cuenta).
   · parciales, perdidos (caducados, D-02), pendientes (aún recuperables).
   · descansos respetados y sacrificados.
   · libres           = sesiones libres hechas en el periodo: se enseñan aparte y
                        no entran en la fórmula (un entrenamiento libre no es uno
                        planificado; si cayó en un descanso, ese día ya cuenta como
                        sacrificado).
   «hoy» (sin hacer todavía), los días futuros y los de «sin seguimiento» (antes de
   la entrada en vigor —PD-09—, sin rutina activa o con una plantilla usada como
   rutina) **no cuentan en nada**.

   ── LA FÓRMULA (§8) ────────────────────────────────────────────────────────
     evaluados  = completos + recuperados + parciales + perdidos
                  + descansos respetados + descansos sacrificados
     cumplidos  = completos + recuperados + descansos respetados + ½ · parciales
     porcentaje = round(100 · cumplidos / evaluados)   (sin evaluados: null, nunca 0)
   Un pendiente todavía se puede recuperar, así que no está en el denominador
   hasta que se recupera (cuenta a favor) o caduca (cuenta como perdido). Un día
   que no tocaba entrenar no penaliza: o es un descanso (respetado o sacrificado)
   o no se evalúa.

   ── LA RACHA (§10, PD-06 definitiva desde la Fase 8, C-79) ──────────────────
   «Días seguidos cumpliendo tu plan», hacia atrás desde hoy, con los mismos
   estados: suman cumplido, recuperado, parcial y descanso respetado; la cortan
   un perdido y un descanso sacrificado; un pendiente (aún recuperable) y «hoy»
   sin hacer ni suman ni cortan; «sin seguimiento» la termina. Un descanso
   respetado forma parte de la disciplina y la alarga. 🔓 **Desde la Fase 8 es la
   misma que la racha global de entrenamiento**: la pantalla Rachas lee los mismos
   días (`diasDeActividadDeEntrenamiento`, proyectados por `rachasServicio.js`).
   No da puntos, niveles ni recompensas (D2-02).
   ═══════════════════════════════════════════════════════════════════════════ */

import { todayISO, fechaValida, addDays } from './helpers';
import { celdasMes } from './calendario';
import { MESES, diaYMes } from './fechasFitness';
import { decimal } from './numerosFitness';
import {
  estadoDeFecha, analisisDeCumplimiento, claseDeSesion, gradoDeSesion,
} from './cumplimientoFitness';
import { sesionesDelHistorial } from './sesionesCompletadas';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS PERIODOS
   ═══════════════════════════════════════════════════════════════════════════ */

export const PERIODOS_DISCIPLINA = Object.freeze([
  Object.freeze({ id: 'siete', nombre: 'Últimos 7 días' }),
  Object.freeze({ id: 'treinta', nombre: 'Últimos 30 días' }),
  Object.freeze({ id: 'mes_actual', nombre: 'Este mes' }),
  Object.freeze({ id: 'mes_anterior', nombre: 'Mes anterior' }),
  Object.freeze({ id: 'personalizado', nombre: 'Elegir fechas' }),
]);
export const PERIODO_DISCIPLINA_POR_DEFECTO = 'treinta';

const finDeMes = (anio, mes1) => {
  const d = new Date(anio, mes1, 0); // día 0 del mes siguiente = último de éste
  return `${anio}-${String(mes1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** `{ desde, hasta, completo }` o `null` si no se puede calcular. `hasta` nunca
 *  pasa de hoy; `completo` dice si el periodo entero ya ha pasado. */
export function rangoDePeriodo(id, hoy = todayISO(), { desde = '', hasta = '' } = {}) {
  if (!fechaValida(hoy)) return null;
  const [y, m] = hoy.split('-').map(Number);
  let r = null;
  if (id === 'siete') r = { desde: addDays(hoy, -6), hasta: hoy };
  else if (id === 'treinta') r = { desde: addDays(hoy, -29), hasta: hoy };
  else if (id === 'mes_actual') r = { desde: `${hoy.slice(0, 7)}-01`, hasta: finDeMes(y, m) };
  else if (id === 'mes_anterior') {
    const ay = m === 1 ? y - 1 : y;
    const am = m === 1 ? 12 : m - 1;
    r = { desde: `${ay}-${String(am).padStart(2, '0')}-01`, hasta: finDeMes(ay, am) };
  } else if (id === 'personalizado') {
    const a = fechaValida(texto(desde)) ? texto(desde) : null;
    const b = fechaValida(texto(hasta)) ? texto(hasta) : null;
    if (!a || !b) return null;
    r = a <= b ? { desde: a, hasta: b } : { desde: b, hasta: a };
  }
  if (!r) return null;
  const completo = r.hasta < hoy;
  const hastaEfectivo = r.hasta > hoy ? hoy : r.hasta;
  if (r.desde > hastaEfectivo) return { desde: r.desde, hasta: hastaEfectivo, completo, vacio: true };
  return { desde: r.desde, hasta: hastaEfectivo, completo, vacio: false };
}

/** Todas las fechas de un rango (incluidos los dos extremos), en local. */
export function fechasDelRango(desde, hasta) {
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) return [];
  const out = [];
  for (let f = desde; f <= hasta && out.length < 3700; f = addDays(f, 1)) out.push(f);
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LOS INDICADORES
   ═══════════════════════════════════════════════════════════════════════════ */

const CUENTA_A_FAVOR = Object.freeze({ cumplido: 1, recuperado: 1, descanso_respetado: 1, parcial: 0.5 });
const EVALUADO = Object.freeze(['cumplido', 'recuperado', 'parcial', 'perdido', 'descanso_respetado', 'descanso_sacrificado']);
const ENTRENO = Object.freeze(['cumplido', 'recuperado', 'parcial', 'pendiente', 'perdido']);

export const FORMULA_CUMPLIMIENTO = 'Cumplidos ÷ días evaluados. Cumplidos = completos + recuperados + descansos respetados + la mitad de los parciales. Evaluados = esos más los perdidos y los descansos sacrificados. Los pendientes (aún se pueden recuperar), hoy, los días futuros y los días sin seguimiento no cuentan.';

/**
 * 🚨 Las estadísticas de disciplina de un rango. Cada fecha, una vez y con el
 * estado del motor de la Fase 4.
 */
export function estadisticasDeDisciplina(fitness, { desde, hasta, hoy = todayISO(), planes } = {}) {
  const opciones = planes ? { hoy, planes } : { hoy };
  const f = fitness || {};
  const r = {
    desde, hasta,
    previstos: 0, completos: 0, recuperados: 0, parciales: 0, perdidos: 0, pendientes: 0,
    descansosRespetados: 0, descansosSacrificados: 0, libres: 0,
    evaluados: 0, cumplidos: 0, porcentaje: null, dias: 0, sinSeguimiento: 0,
  };
  const fechas = fechasDelRango(desde, hasta > hoy ? hoy : hasta);
  for (const fecha of fechas) {
    const e = estadoDeFecha(f, fecha, opciones).estado;
    r.dias += 1;
    if (ENTRENO.includes(e)) r.previstos += 1;
    if (e === 'cumplido') r.completos += 1;
    else if (e === 'recuperado') r.recuperados += 1;
    else if (e === 'parcial') r.parciales += 1;
    else if (e === 'perdido') r.perdidos += 1;
    else if (e === 'pendiente') r.pendientes += 1;
    else if (e === 'descanso_respetado') r.descansosRespetados += 1;
    else if (e === 'descanso_sacrificado') r.descansosSacrificados += 1;
    else if (e === 'sin_seguimiento') r.sinSeguimiento += 1;
    if (EVALUADO.includes(e)) r.evaluados += 1;
    r.cumplidos += CUENTA_A_FAVOR[e] || 0;
  }
  /* Las libres: sesiones completadas, con algo hecho, de clase «libre», en el rango. */
  const tope = hasta > hoy ? hoy : hasta;
  for (const s of sesionesDelHistorial(f)) {
    const fe = texto(s.fecha);
    if (!fe || fe < desde || fe > tope) continue;
    if (gradoDeSesion(s) === 'vacia') continue;
    if (claseDeSesion(s, f, opciones) === 'libre') r.libres += 1;
  }
  r.porcentaje = r.evaluados ? Math.round((100 * r.cumplidos) / r.evaluados) : null;
  r.racha = rachaDeCumplimiento(f, { hoy, planes, hasta: tope });
  return r;
}

/** Las estadísticas de uno de los periodos (`id` de `PERIODOS_DISCIPLINA`). */
export function disciplinaDelPeriodo(fitness, id = PERIODO_DISCIPLINA_POR_DEFECTO, { hoy = todayISO(), desde = '', hasta = '', planes } = {}) {
  const rango = rangoDePeriodo(id, hoy, { desde, hasta });
  if (!rango) return { periodo: id, rango: null, estadisticas: null };
  const est = rango.vacio ? null : estadisticasDeDisciplina(fitness, { desde: rango.desde, hasta: rango.hasta, hoy, planes });
  return { periodo: id, rango, estadisticas: est };
}

/** «18 de 22 días evaluados cumplidos» — la regularidad en palabras, sin juicio. */
export function textoDeRegularidad(est) {
  if (!est || !est.evaluados) return 'Todavía no hay días evaluados en este periodo.';
  const n = decimal(est.cumplidos);
  return `${n} de ${est.evaluados} ${est.evaluados === 1 ? 'día evaluado' : 'días evaluados'} cumplidos.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA RACHA DE CUMPLIMIENTO (PD-06, definitiva desde la Fase 8)
   ═══════════════════════════════════════════════════════════════════════════ */

const SUMA = Object.freeze(['cumplido', 'recuperado', 'parcial', 'descanso_respetado']);
const CORTA = Object.freeze(['perdido', 'descanso_sacrificado']);
const NEUTRO = Object.freeze(['pendiente', 'hoy']);
export const MAX_DIAS_RACHA = 730;

/* 🚨 FITNESS 8/8 — LA FUENTE ÚNICA DE «QUÉ DÍA CUENTA COMO ACTIVIDAD DE
   ENTRENAMIENTO» (decisión de Josué del 2026-11-06, que cierra PD-06). La racha
   de Fitness (abajo) y la racha global de entrenamiento de la pantalla Rachas
   (`proyectarRachasDeEntrenamiento`, en `rachasServicio.js`) leen ESTA lista, así
   que no pueden interpretar distinto el mismo día:
   - **suma**: completo, recuperado, parcial (la racha mide constancia, no
     perfección; en el porcentaje sigue contando medio) y descanso respetado;
   - **corta**: perdido (ya caducado, D-02) y descanso sacrificado;
   - **neutro**: pendiente (aún se puede recuperar) y hoy: ni suman ni cortan.
   Antes de `cumplimientoDesde` (o de la primera rutina) no hay seguimiento: la
   lista se detiene ahí y no se inventa nada de aquellas fechas (PD-09). */
export const ACTIVIDAD_DE_ENTRENAMIENTO = Object.freeze({
  ...Object.fromEntries(SUMA.map((e) => [e, 'suma'])),
  ...Object.fromEntries(CORTA.map((e) => [e, 'corta'])),
  ...Object.fromEntries(NEUTRO.map((e) => [e, 'neutro'])),
});

/**
 * Los días con seguimiento, de `hasta` (o hoy) hacia atrás, cada uno con su
 * estado del motor de la Fase 4 y su `actividad` (suma · corta · neutro), y si
 * hoy tocaba descansar. `hay: false` si no hay ni un día con seguimiento.
 */
export function diasDeActividadDeEntrenamiento(fitness, { hoy = todayISO(), planes, hasta = null } = {}) {
  const opciones = planes ? { hoy, planes } : { hoy };
  const f = fitness || {};
  const a = analisisDeCumplimiento(f, opciones);
  const fin = hasta && hasta < hoy ? hasta : hoy;
  const dias = [];
  let n = 0;
  for (let fecha = fin; n < MAX_DIAS_RACHA; fecha = addDays(fecha, -1), n += 1) {
    if (a.desde && fecha < a.desde) break;
    const e = estadoDeFecha(f, fecha, opciones);
    if (e.estado === 'sin_seguimiento') break;
    const actividad = ACTIVIDAD_DE_ENTRENAMIENTO[e.estado] || 'neutro';
    dias.push({ fecha, estado: e.estado, actividad, descanso: !!(e.previsto && e.previsto.tipo === 'descanso') });
  }
  const conSeguimiento = dias.filter((d) => d.estado !== 'futuro');
  return { hay: conSeguimiento.length > 0, desde: dias.length ? dias[dias.length - 1].fecha : '', dias };
}

/** `{ actual, mejor }`: la de ahora (hacia atrás desde `hasta`) y la más larga
 *  que cabe en el seguimiento hasta esa fecha. Sale de la lista de arriba. */
export function rachaDeCumplimiento(fitness, { hoy = todayISO(), planes, hasta = null } = {}) {
  let actual = 0;
  let corriendo = 0;
  let mejor = 0;
  let cortadaLaActual = false;
  for (const d of diasDeActividadDeEntrenamiento(fitness, { hoy, planes, hasta }).dias) {
    if (d.actividad === 'suma') {
      corriendo += 1;
      if (!cortadaLaActual) actual = corriendo;
      if (corriendo > mejor) mejor = corriendo;
    } else if (d.actividad === 'corta') {
      cortadaLaActual = true;
      corriendo = 0;
    }
  }
  return { actual, mejor };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL CALENDARIO DEL MES Y EL DETALLE DE UNA FECHA
   ═══════════════════════════════════════════════════════════════════════════ */

/** `YYYY-MM` de una fecha, y el mes anterior o siguiente. */
export const mesDe = (fecha) => (fechaValida(fecha) ? fecha.slice(0, 7) : '');
export function moverMes(mes, d) {
  const [y, m] = String(mes).split('-').map(Number);
  if (!y || !m) return mes;
  const t = (y * 12 + (m - 1)) + d;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

/* Lo que se sabe de las sesiones de cada fecha: sus nombres (en el orden en que se
   hicieron) y qué fechas recuperaba alguna. 🔓 Fitness 8/8 — los entrenamientos
   registrados se enseñan también **antes del seguimiento**: es lo que decía el
   calendario de actividad de Progreso (F31) y no se pierde al unificarlo. */
function indicesDeSesiones(f) {
  const recuperaciones = new Map();
  const registradas = new Map();
  for (const s of sesionesDelHistorial(f)) {
    const fecha = texto(s.fecha);
    if (!fecha) continue;
    if (!registradas.has(fecha)) registradas.set(fecha, []);
    registradas.get(fecha).push(s);
    const d = s.diaDePlan || {};
    if (d.clase === 'recuperacion' && texto(d.fechaPrevista) && gradoDeSesion(s) !== 'vacia') {
      if (!recuperaciones.has(fecha)) recuperaciones.set(fecha, []);
      recuperaciones.get(fecha).push(texto(d.fechaPrevista));
    }
  }
  for (const [fecha, ss] of registradas) {
    registradas.set(fecha, [...ss]
      .sort((a, b) => (a.iniciadaEn || a.guardadaEn || 0) - (b.iniciadaEn || b.guardadaEn || 0))
      .map((x) => ({ id: x.id, nombre: texto(x.nombre) || 'Entrenamiento' })));
  }
  return { recuperaciones, registradas };
}

/** «entrenamiento Push» o «2 entrenamientos: Pull y Push» (las palabras de la F31). */
export function textoDeRegistradas(sesiones) {
  const l = lista(sesiones);
  if (!l.length) return '';
  if (l.length === 1) return `entrenamiento ${l[0].nombre}`;
  return `${l.length} entrenamientos: ${l.map((x) => x.nombre).join(' y ')}`;
}

function celdaDeFecha(f, fecha, opciones, indices, hoy) {
  const e = estadoDeFecha(f, fecha, opciones);
  return {
    fecha,
    dia: Number(fecha.slice(8, 10)),
    estado: e.estado,
    nombre: e.nombre,
    color: e.color,
    motivo: e.motivo,
    esHoy: fecha === hoy,
    descanso: !!(e.previsto && e.previsto.tipo === 'descanso'),
    recuperaDe: indices.recuperaciones.get(fecha) || [],
    sesiones: indices.registradas.get(fecha) || [],
  };
}

/**
 * La cuadrícula de un mes con el estado de cada día (el del motor). `null` en los
 * huecos de antes del día 1. Además: si es hoy, si alguna sesión de ese día fue
 * una recuperación (y de qué fecha), los entrenamientos registrados y el resumen
 * del mes.
 */
export function mesDeCumplimiento(fitness, mes, { hoy = todayISO(), planes } = {}) {
  const opciones = planes ? { hoy, planes } : { hoy };
  const f = fitness || {};
  const [y, m] = String(mes || mesDe(hoy)).split('-').map(Number);
  const indices = indicesDeSesiones(f);
  const celdas = celdasMes(y, m - 1).map((c) => (c ? celdaDeFecha(f, c.fecha, opciones, indices, hoy) : null));
  return {
    vista: 'mes',
    mes: `${y}-${String(m).padStart(2, '0')}`,
    titulo: `${MESES[m - 1] ? MESES[m - 1].charAt(0).toUpperCase() + MESES[m - 1].slice(1) : ''} ${y}`,
    celdas,
    anterior: moverMes(`${y}-${String(m).padStart(2, '0')}`, -1),
    siguiente: moverMes(`${y}-${String(m).padStart(2, '0')}`, 1),
    esteMes: `${y}-${String(m).padStart(2, '0')}` === mesDe(hoy),
  };
}

/** El lunes de la semana de una fecha (la semana empieza el lunes, en local). */
export function lunesDeLaSemana(fecha) {
  if (!fechaValida(fecha)) return '';
  const d = new Date(`${fecha}T12:00:00`).getDay();
  return addDays(fecha, -((d + 6) % 7));
}

/**
 * 🔓 Fitness 8/8 — la semana de lunes a domingo con los mismos estados y celdas
 * que el mes: la vista compacta que tenía el calendario de Progreso (F31), ahora
 * dentro del calendario unificado. `lunes` cualquiera (se lleva a su lunes).
 */
export function semanaDeCumplimiento(fitness, lunes, { hoy = todayISO(), planes } = {}) {
  const opciones = planes ? { hoy, planes } : { hoy };
  const f = fitness || {};
  const l = lunesDeLaSemana(fechaValida(lunes) ? lunes : hoy);
  const indices = indicesDeSesiones(f);
  const celdas = Array.from({ length: 7 }, (_, i) => celdaDeFecha(f, addDays(l, i), opciones, indices, hoy));
  const fin = addDays(l, 6);
  const estaSemana = l === lunesDeLaSemana(hoy);
  return {
    vista: 'semana',
    lunes: l,
    titulo: estaSemana ? 'Esta semana' : `Semana del ${diaYMes(l)}`,
    rango: `${diaYMes(l)} – ${diaYMes(fin)}`,
    celdas,
    anterior: addDays(l, -7),
    siguiente: addDays(l, 7),
    estaSemana,
  };
}

/**
 * 🚨 Lo que pasó un día (§5): el estado y su motivo, qué tocaba (rutina y
 * plantilla), las sesiones de ese día (cada una con su tipo y su fecha prevista),
 * y si lo cumplió una recuperación hecha otro día. No inventa una sesión: sin
 * registros, `sesiones` está vacío.
 */
export function detalleDeFecha(fitness, fecha, { hoy = todayISO(), planes } = {}) {
  const opciones = planes ? { hoy, planes } : { hoy };
  const f = fitness || {};
  const e = estadoDeFecha(f, fecha, opciones);
  const p = e.previsto || null;
  const sesiones = sesionesDelHistorial(f)
    .filter((s) => texto(s.fecha) === fecha)
    .map((s) => ({
      id: s.id,
      nombre: texto(s.nombre) || 'Entrenamiento',
      clase: claseDeSesion(s, f, opciones),
      grado: gradoDeSesion(s),
      fechaPrevista: texto((s.diaDePlan || {}).fechaPrevista) || null,
      completar: s.completadaCon === 'completar',
    }));
  const cumplidaPor = e.cumplidaPor && texto(e.cumplidaPor.fecha) !== fecha
    ? { id: e.cumplidaPor.id, fecha: texto(e.cumplidaPor.fecha), nombre: texto(e.cumplidaPor.nombre) || 'Entrenamiento' }
    : null;
  return {
    fecha,
    estado: e.estado,
    nombre: e.nombre,
    color: e.color,
    motivo: e.motivo,
    previsto: p && p.tipo !== 'sin_rutina' ? {
      tipo: p.tipo,
      plantilla: p.tipo === 'entreno' ? (texto(p.nombre) || null) : null,
      rutina: texto(p.planNombre) || null,
    } : null,
    sesiones,
    cumplidaPor,
  };
}

export const NOMBRE_CLASE = Object.freeze({ prevista: 'Planificado', recuperacion: 'Recuperación', libre: 'Libre' });

export const DECISIONES_FASE7 = Object.freeze([
  Object.freeze({ id: 'PD-06', que: 'Racha de cumplimiento de Fitness, derivada de los estados de la Fase 4 (suman completo, recuperado, parcial y descanso respetado; la cortan perdido y descanso sacrificado; pendiente y hoy, neutros). La racha global de entrenamiento de Rachas usa la MISMA lista (`diasDeActividadDeEntrenamiento`).', estado: 'definitiva (Josué, 2026-11-06; Fase 8)' }),
  Object.freeze({ id: 'PD-09', que: 'Lo anterior a `cumplimientoDesde` sale «Sin seguimiento», sin color de cumplimiento, y no cuenta en ninguna estadística.', estado: 'propuesta aplicada' }),
  Object.freeze({ id: 'DS-01', que: 'Un parcial cuenta medio en el porcentaje; un pendiente no está en el denominador hasta recuperarse o caducar.', estado: 'fórmula documentada (FORMULA_CUMPLIMIENTO)' }),
]);
