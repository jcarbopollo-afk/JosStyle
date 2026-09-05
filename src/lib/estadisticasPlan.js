/* ===========================================================================
   ENTREGA 3 · FASE 13 (HC F8) — ESTADÍSTICAS DE PLANIFICACIÓN
   ===========================================================================

   *"Responder visualmente: ¿en qué estoy utilizando mi tiempo? ¿Cuánto
   planifico? ¿Cuánto cumplo? ¿Qué días estoy más cargado?"*

   🚨 **Y el enunciado lo enmarca en su primera línea:** *"Esto NO es un sistema
   de productividad independiente. Las estadísticas deben utilizar los datos que
   ya existen."*

   Así que este archivo **no guarda ni una cifra**. Cuenta en el momento sobre
   `calendario.eventos` y `productividad.tareas`, igual que `progresoEstilo.js`
   (EH F35), y por el mismo motivo: **una estadística guardada miente en cuanto
   él borra un registro**.

   ─────────────────────────────────────────────────────────────────────────
   🚨 **LAS TRES COSAS QUE EL ENUNCIADO PROHÍBE, Y QUE AQUÍ SE RESPETAN**
   ─────────────────────────────────────────────────────────────────────────

   1. **No inventar un porcentaje** (apartado 6): *"si no hay suficientes datos,
      mostrar «Sin datos suficientes»"*. `cumplimiento()` devuelve `null`, no un
      cero — que es la lección de EH F35 y de la E3 F6: **`null` no es 0**.
   2. **No estimar una duración que no existe** (apartados 11 y 12). Un evento
      con hora de inicio y sin hora de fin **no dura una hora por defecto**: no se
      cuenta, y se dice cuántos se quedaron fuera.
   3. **No inventar historial retroactivo** (apartado 17): *"si actualmente NO
      existe historial de reprogramaciones, NO inventarlo"*. No existe, así que
      se declara con `existe: false` y su frase.

   ⚠️ Y **ni una interpretación** (apartados 14 y 25): *"no convertirlo en una
   recomendación. Es simplemente información."* Se enseña el número y su nombre;
   nunca *"deberías"*, nunca *"mejor que"*. Hay una prueba que barre los textos.
   =========================================================================== */

import { todayISO, addDays, horaValida } from './helpers';
import { expandirRecurrentes } from './calendario';
import { seRepite, instanciaHecha } from './semana';

/* ── El periodo (apartado 2) ───────────────────────────────────────────────
   *"7 días · 30 días · 3 meses · 1 año. Por defecto: 30 días."* */
export const PERIODOS = [
  { id: '7d', nombre: '7 días', dias: 7 },
  { id: '30d', nombre: '30 días', dias: 30 },
  { id: '3m', nombre: '3 meses', dias: 90 },
  { id: '1a', nombre: '1 año', dias: 365 },
];

export const PERIODO_POR_DEFECTO = '30d';
export const periodo = (id) => PERIODOS.find((p) => p.id === id) || PERIODOS.find((p) => p.id === PERIODO_POR_DEFECTO);

/** El rango de un periodo, **hacia atrás desde hoy**. ⚠️ En local: un
 *  `toISOString()` correría el día y dejaría fuera el primero (séptima vez). */
export function rangoDelPeriodo(periodoId, hoy = todayISO()) {
  const dias = periodo(periodoId).dias;
  return { desde: addDays(hoy, -(dias - 1)), hasta: hoy, dias };
}

/* ── Qué cuenta y qué no (apartados 4 y 6) ─────────────────────────────────

   *"No contar entidades que no tengan un concepto real de finalización."* Y el
   apartado 6: *"evitar dividir por elementos puramente informativos."*

   🚨 Es la misma regla que `FUENTES_PROGRESO` en la E3 F6: **una tarea se
   completa; un evento ocurre**. Un evento del calendario no tiene un estado de
   "hecho", así que entra en lo planificado pero **no en el denominador del
   cumplimiento** — meterlo bajaría el porcentaje por cosas que simplemente
   pasaron. */
export const FUENTES_ESTADISTICA = [
  {
    id: 'tarea', nombre: 'Tareas', icono: '📋',
    seCompleta: true, de: 'productividad.tareas',
    porque: 'Una tarea se marca como hecha, así que cuenta para el cumplimiento.',
  },
  {
    id: 'evento', nombre: 'Eventos', icono: '📅',
    seCompleta: false, de: 'calendario.eventos',
    porque: 'Un evento ocurre, no se completa: cuenta como planificación, nunca como incumplimiento.',
  },
];

export const fuenteEstadistica = (id) => FUENTES_ESTADISTICA.find((f) => f.id === id) || null;

/* ── Recoger lo planificado del periodo ────────────────────────────────────
   ⚠️ Las series se expanden **una vez para todo el rango** (E3 F10): un evento
   semanal cuenta una vez por semana, no una sola vez ni trescientas. */
export function elementosDelPeriodo(estado, periodoId, { hoy = todayISO() } = {}) {
  const { desde, hasta } = rangoDelPeriodo(periodoId, hoy);

  const eventos = expandirRecurrentes(estado?.calendario?.eventos || [], desde, hasta)
    .filter((e) => e.fecha >= desde && e.fecha <= hasta)
    .map((e) => ({ ...e, clase: 'evento', hecho: false, tipo: e.tipo || 'personal' }));

  const tareas = [];
  for (const t of estado?.productividad?.tareas || []) {
    if (!t) continue;
    if (seRepite(t)) {
      // Una serie: una entrada por aparición dentro del rango.
      for (const ap of expandirRecurrentes([t], desde, hasta)) {
        if (ap.fecha < desde || ap.fecha > hasta) continue;
        tareas.push({ ...t, fecha: ap.fecha, clase: 'tarea', hecho: instanciaHecha(t, ap.fecha), esInstancia: true });
      }
      continue;
    }
    if (t.fecha >= desde && t.fecha <= hasta) {
      tareas.push({ ...t, clase: 'tarea', hecho: !!t.hecha, esInstancia: false });
    }
  }

  return { desde, hasta, eventos, tareas, todos: [...eventos, ...tareas] };
}

/* ── El resumen principal (apartados 3, 5 y 6) ─────────────────────────────

   *"PLANIFICACIÓN 124 · COMPLETADOS 87 · PENDIENTES 37 · CUMPLIMIENTO 70 %.
   Estos datos deben calcularse realmente."*

   🚨 **Y el cumplimiento puede ser `null`**: *"si no hay suficientes datos,
   mostrar «Sin datos suficientes». No inventar un porcentaje."* */
export const MINIMO_PARA_CUMPLIMIENTO = 3;
export const TEXTO_SIN_DATOS = 'Sin datos suficientes';

export function resumenPlanificacion(estado, periodoId, opciones = {}) {
  const { todos, tareas, eventos, desde, hasta } = elementosDelPeriodo(estado, periodoId, opciones);
  // Solo lo que se completa entra en el cumplimiento (apartados 4 y 6).
  const completables = todos.filter((e) => fuenteEstadistica(e.clase)?.seCompleta);
  const hechos = completables.filter((e) => e.hecho);

  return {
    desde,
    hasta,
    planificados: todos.length,
    completados: hechos.length,
    pendientes: completables.length - hechos.length,
    /* 🚨 `null`, no 0: con dos tareas en un mes un porcentaje no dice nada, y
       un 0 % sería un reproche por no tener datos (la lección de EH F35). */
    cumplimiento: completables.length >= MINIMO_PARA_CUMPLIMIENTO
      ? Math.round((hechos.length / completables.length) * 100)
      : null,
    // Apartado 5 — el desglose de tareas.
    tareas: {
      creadas: tareas.length,
      completadas: tareas.filter((t) => t.hecho).length,
      pendientes: tareas.filter((t) => !t.hecho).length,
    },
    eventos: eventos.length,
  };
}

/* ── El gráfico, que son ocho caracteres (apartados 7 y 23) ────────────────

   *"Actividad ▁▃▅▂▆▇▃…"* — el enunciado lo pide **literalmente así**, y es
   además lo que ya usa `progresoEstilo.js` (EH F35): ni una librería, ni un
   `<canvas>`, ni un SVG. */
export const BARRAS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
export const MAX_BARRAS = 14;

/** Convierte una lista de números en barras. ⚠️ Todo ceros da la barra más baja
 *  en vez de reventar dividiendo por cero. */
export function grafico(valores) {
  const v = (valores || []).map((x) => (Number.isFinite(x) ? Math.max(0, x) : 0));
  if (v.length === 0) return '';
  const paso = Math.ceil(v.length / MAX_BARRAS);
  const agrupados = [];
  for (let i = 0; i < v.length; i += paso) {
    const trozo = v.slice(i, i + paso);
    agrupados.push(trozo.reduce((a, b) => a + b, 0) / trozo.length);
  }
  const alto = Math.max(...agrupados);
  if (alto === 0) return BARRAS[0].repeat(agrupados.length);
  return agrupados.map((x) => BARRAS[Math.min(BARRAS.length - 1, Math.round((x / alto) * (BARRAS.length - 1)))]).join('');
}

/** Apartado 7 — el cumplimiento por día. ⚠️ Un día **sin nada que completar no
 *  tiene porcentaje** (`null`), y no se dibuja como un cero: sería inventarse
 *  un mal día donde no tocaba nada. */
export function cumplimientoPorDia(estado, periodoId, opciones = {}) {
  const { todos, desde, hasta } = elementosDelPeriodo(estado, periodoId, opciones);
  const dias = [];
  let f = desde;
  while (f <= hasta) {
    const delDia = todos.filter((e) => e.fecha === f && fuenteEstadistica(e.clase)?.seCompleta);
    const hechos = delDia.filter((e) => e.hecho).length;
    dias.push({
      fecha: f,
      total: delDia.length,
      hechos,
      porcentaje: delDia.length > 0 ? Math.round((hechos / delDia.length) * 100) : null,
    });
    f = addDays(f, 1);
  }
  return dias;
}

/* ── La carga por día de la semana (apartados 8, 14 y 15) ──────────────────
   *"L 12 · M 5 · X 8…"*, y los días más y menos cargados. ⚠️ *"No convertirlo
   en una recomendación. Es simplemente información."* */
export const DIAS_SEMANA_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function cargaPorDiaSemana(estado, periodoId, opciones = {}) {
  const { todos } = elementosDelPeriodo(estado, periodoId, opciones);
  const cuenta = [0, 0, 0, 0, 0, 0, 0];
  for (const e of todos) {
    const [a, m, d] = e.fecha.split('-').map(Number);
    cuenta[(new Date(a, m - 1, d).getDay() + 6) % 7] += 1;
  }
  return cuenta.map((n, i) => ({ indice: i, letra: DIAS_SEMANA_CORTOS[i], nombre: NOMBRES_DIA[i], elementos: n }));
}

/** Apartado 14 — el ranking. ⚠️ Solo si hay algo: un ranking de ceros es ruido
 *  (apartado 15: *"no llenar la interfaz de rankings innecesarios"*). */
export function diasMasCargados(estado, periodoId, opciones = {}) {
  const carga = cargaPorDiaSemana(estado, periodoId, opciones).filter((d) => d.elementos > 0);
  if (carga.length === 0) return [];
  return [...carga].sort((a, b) => b.elementos - a.elementos).slice(0, 3);
}

/* ── Qué planificas (apartado 9) ───────────────────────────────────────────
   *"Los porcentajes deben calcularse realmente."* ⚠️ Y salen del `tipo` de cada
   evento —el catálogo que ya existe— más las tareas: ni una clasificación
   nueva. */
export function distribucionPorTipo(estado, periodoId, opciones = {}) {
  const { todos, tareas } = elementosDelPeriodo(estado, periodoId, opciones);
  if (todos.length === 0) return [];
  const cuenta = new Map();
  if (tareas.length > 0) cuenta.set('tarea', tareas.length);
  for (const e of todos.filter((x) => x.clase === 'evento')) {
    cuenta.set(e.tipo, (cuenta.get(e.tipo) || 0) + 1);
  }
  return [...cuenta.entries()]
    .map(([id, n]) => ({ id, elementos: n, porcentaje: Math.round((n / todos.length) * 100) }))
    .sort((a, b) => b.elementos - a.elementos);
}

/* ── Cuándo planificas (apartado 10) ───────────────────────────────────────
   *"Mañana 30 % · Tarde 50 % · Noche 20 %. Definir franjas de forma
   consistente."* Así que las franjas son datos, no números sueltos en el código. */
export const FRANJAS = [
  { id: 'manana', nombre: 'Mañana', desde: 5 * 60, hasta: 13 * 60 },
  { id: 'tarde', nombre: 'Tarde', desde: 13 * 60, hasta: 21 * 60 },
  { id: 'noche', nombre: 'Noche', desde: 21 * 60, hasta: 5 * 60 },
];

const minutosDeHora = (h) => (horaValida(h) ? Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5)) : null);

export function franjaDe(hora) {
  const m = minutosDeHora(hora);
  if (m === null) return null;
  for (const f of FRANJAS) {
    if (f.desde < f.hasta ? (m >= f.desde && m < f.hasta) : (m >= f.desde || m < f.hasta)) return f.id;
  }
  return null;
}

export function distribucionHoraria(estado, periodoId, opciones = {}) {
  const { todos } = elementosDelPeriodo(estado, periodoId, opciones);
  const conHora = todos.filter((e) => franjaDe(e.horaInicio || e.hora) !== null);
  // ⚠️ Sin nada con hora no hay distribución: repartir el 100 % entre franjas
  // vacías sería inventarse el dato.
  if (conHora.length === 0) return { franjas: [], sinHora: todos.length, hayDatos: false };
  const cuenta = new Map();
  for (const e of conHora) {
    const f = franjaDe(e.horaInicio || e.hora);
    cuenta.set(f, (cuenta.get(f) || 0) + 1);
  }
  return {
    hayDatos: true,
    sinHora: todos.length - conHora.length,
    franjas: FRANJAS.map((f) => ({
      ...f,
      elementos: cuenta.get(f.id) || 0,
      porcentaje: Math.round(((cuenta.get(f.id) || 0) / conHora.length) * 100),
    })),
  };
}

/* ── Las horas planificadas (apartados 11, 12 y 13) ────────────────────────

   🚨 *"Si los elementos contienen duración: calcular. **No estimar duración
   cuando no exista**."*

   Un evento con hora de inicio y **sin hora de fin no dura una hora por
   defecto**: no se cuenta. Y se dice **cuántos se quedaron fuera**, porque un
   total sin ese aviso parecería el tiempo real de la semana. */
export function horasPlanificadas(estado, periodoId, opciones = {}) {
  const { todos } = elementosDelPeriodo(estado, periodoId, opciones);
  let minutos = 0;
  let conDuracion = 0;
  let sinDuracion = 0;
  for (const e of todos) {
    const ini = minutosDeHora(e.horaInicio || e.hora);
    const fin = minutosDeHora(e.horaFin);
    if (ini === null || fin === null || fin <= ini) { sinDuracion += 1; continue; }
    minutos += fin - ini;
    conDuracion += 1;
  }
  return {
    // 🚨 `null` si no hay ni un elemento con duración: no se enseña un 0 h.
    minutos: conDuracion > 0 ? minutos : null,
    texto: conDuracion > 0 ? formatoHoras(minutos) : null,
    conDuracion,
    sinDuracion,
    // Apartado 11 — lo que falta se dice, no se estima.
    aviso: sinDuracion > 0 ? `${sinDuracion} ${sinDuracion === 1 ? 'elemento no tiene' : 'elementos no tienen'} hora de fin, así que no cuentan aquí.` : null,
  };
}

export function formatoHoras(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/* ── Las tareas atrasadas (apartado 16) ────────────────────────────────────
   *"Pendientes atrasadas 7. Al pulsar → abrir lista filtrada. **No crear otra
   base de datos**."* Así que se derivan, y lo que se devuelve son las tareas
   de siempre. */
export function tareasAtrasadas(estado, { hoy = todayISO() } = {}) {
  return (estado?.productividad?.tareas || [])
    .filter((t) => t && !t.hecha && !seRepite(t) && t.fecha && t.fecha < hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ── Las recurrencias (apartado 18) ────────────────────────────────────────
   *"Actividades recurrentes 18 · Instancias completadas 15."* */
export function resumenRecurrentes(estado, periodoId, opciones = {}) {
  const { desde, hasta } = rangoDelPeriodo(periodoId, opciones.hoy || todayISO());
  const series = (estado?.productividad?.tareas || []).filter(seRepite);
  let apariciones = 0;
  let hechas = 0;
  for (const t of series) {
    for (const ap of expandirRecurrentes([t], desde, hasta)) {
      if (ap.fecha < desde || ap.fecha > hasta) continue;
      apariciones += 1;
      if (instanciaHecha(t, ap.fecha)) hechas += 1;
    }
  }
  return {
    series: series.length,
    apariciones,
    hechas,
    // 🚨 El mismo mínimo: sin apariciones no hay porcentaje.
    porcentaje: apariciones >= MINIMO_PARA_CUMPLIMIENTO ? Math.round((hechas / apariciones) * 100) : null,
  };
}

/* ── Comparar dos periodos (apartados 25, 26 y 27) ─────────────────────────

   *"Esta semana vs semana anterior. +12 % elementos completados si existen
   datos suficientes. **No generar interpretaciones**."*

   ⚠️ Así que devuelve **el número y su signo**, y nada más. Ni *"vas mejor"*,
   ni *"deberías"*: es la lección de EH F35 y EH F58 —un cambio se cuenta con
   "más" y "menos", nunca con "mejor" y "peor"—. */
export function comparar(estado, periodoId, { hoy = todayISO() } = {}) {
  const dias = periodo(periodoId).dias;
  const ahora = resumenPlanificacion(estado, periodoId, { hoy });
  const antes = resumenPlanificacion(estado, periodoId, { hoy: addDays(hoy, -dias) });

  const dif = (a, b) => {
    if (b === null || a === null) return null;
    return a - b;
  };

  return {
    planificados: { ahora: ahora.planificados, antes: antes.planificados, diferencia: ahora.planificados - antes.planificados },
    completados: { ahora: ahora.completados, antes: antes.completados, diferencia: ahora.completados - antes.completados },
    /* 🚨 Si en cualquiera de los dos periodos no había datos suficientes, la
       comparación **no existe**: comparar contra un `null` daría un salto
       inventado. */
    cumplimiento: { ahora: ahora.cumplimiento, antes: antes.cumplimiento, diferencia: dif(ahora.cumplimiento, antes.cumplimiento) },
  };
}

/** La flechita del apartado 27, **sin adjetivos**: ↑ ↓ →, el número y ya. */
export function tendencia(diferencia) {
  if (diferencia === null || diferencia === undefined) return null;
  if (diferencia > 0) return { icono: '↑', texto: `+${diferencia}`, signo: 'mas' };
  if (diferencia < 0) return { icono: '↓', texto: `${diferencia}`, signo: 'menos' };
  return { icono: '→', texto: 'igual', signo: 'igual' };
}

/* ── Lo que NO existe, y no se inventa ─────────────────────────────────────

   🚨 Apartado 17, literal: *"si actualmente NO existe historial [de
   reprogramaciones], **NO inventarlo retroactivamente**. Preparar arquitectura
   para registrarlo posteriormente."*

   No existe: una tarea guarda su fecha, no las que tuvo antes. Se declara. */
export const NO_MEDIBLE_TODAVIA = [
  {
    id: 'reprogramaciones', apartado: 17, nombre: 'Reprogramaciones',
    existe: false,
    porque: 'Una tarea guarda la fecha que tiene ahora, no las que tuvo antes. Contarlas exigiría empezar a apuntar cada cambio desde hoy.',
  },
  {
    id: 'horas_reales', apartado: 12, nombre: 'Horas realizadas',
    existe: false,
    porque: 'Se sabe si una tarea está hecha, pero no cuánto duró de verdad. Estimarlo sería inventar el dato.',
  },
  {
    id: 'eventos_finalizados', apartado: 4, nombre: 'Eventos finalizados',
    existe: false,
    porque: 'Un evento ocurre, no se completa: no tiene un estado de hecho que contar.',
  },
];

export const noMedible = (id) => NO_MEDIBLE_TODAVIA.find((x) => x.id === id) || null;

/* ── Lo que ya lo mide otro módulo (apartados 19, 20, 21 y 22) ─────────────

   *"NO duplicar estadísticas de hábitos… las estadísticas de planificación
   deben medir planificación, no sustituir el módulo Hábitos."*

   ⚠️ Declarado con la función real, como `YA_RESUELTO` en la E3 F9: si alguien
   renombra una, esto deja de compilar. */
export const LO_MIDE_SU_MODULO = [
  { apartado: 19, que: 'Rachas, cumplimiento e historial de hábitos', modulo: 'Hábitos', con: 'panelHabitos y rachasServicio.js (RA F1 y F2)' },
  { apartado: 20, que: 'Pomodoros y tiempo enfocado', modulo: 'Productividad', con: 'productividad.pomodoros — y no se mezcla con las horas planificadas: son métricas distintas' },
  { apartado: 21, que: 'Las horas de estudio', modulo: 'Estudios', con: 'estudios.sesiones' },
  { apartado: 22, que: 'Los entrenamientos realizados', modulo: 'Calistenia y Fútbol', con: 'calistenia y futbol — aquí solo salen los que están planificados en el calendario' },
];

/* ── Ni una interpretación (apartados 14 y 25) ─────────────────────────────
   *"No convertirlo en una recomendación. Es simplemente información."* La lista
   la usa una prueba que barre todos los textos que genera este archivo. */
export const PALABRAS_DE_JUICIO = [
  'deberías', 'mejor', 'peor', 'bien', 'mal', 'flojo', 'excelente',
  'poco', 'demasiado', 'insuficiente', 'has fallado', 'enhorabuena',
];

export function sinJuicio(texto) {
  const t = String(texto || '').toLowerCase();
  return !PALABRAS_DE_JUICIO.some((p) => t.includes(p));
}
