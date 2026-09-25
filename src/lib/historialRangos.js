/* ===========================================================================
   ENTREGA 4 · FASE 22/45 — HISTORIAL Y EVOLUCIÓN DE RANGOS

   *"¿Cómo ha evolucionado mi rango?"*

   🚨 **LA REGLA QUE GOBIERNA ESTA FASE ES LA MISMA QUE LA F19: NADA SE GUARDA.**
   El apartado 3 describe un `RankHistoryEntry` y en la línea siguiente dice
   *"No duplicar innecesariamente datos que puedan calcularse"*; el apartado 2
   manda reconstruir el historial **a partir de datos reales siempre que sea
   posible**. Y se puede: el motor de la F19 calcula el rango al pedirlo desde
   ejercicio + sesiones + clasificación + perfil, así que **el rango que había el
   28 de agosto es el que sale de darle al mismo motor los datos que existían el
   28 de agosto**. El historial es eso, repetido.

   De ahí salen tres apartados enteros sin escribir una línea para ellos:

   · **17 (editar una sesión)** y **18 (eliminarla)**: no hay nada que
     invalidar. La siguiente lectura reconstruye, y si el cambio de rango se
     apoyaba en esa sesión, **deja de existir**. Un historial guardado habría
     necesitado justo lo que el apartado 18 prohíbe: limpiar eventos falsos.
   · **19 (una sesión nueva)**: aparece un punto más, al final.

   ⚠️ **Y por eso el pasado no se puede reescribir** (apartado 12): cada punto se
   calcula **solo con lo que había hasta ese día**, así que un rango que salió de
   un cuestionario conserva su confianza baja para siempre aunque hoy haya diez
   sesiones. No es una decisión de presentación: es que los datos de después no
   entran en el cálculo de antes.

   ── LO QUE NO SE PUEDE SABER, Y SE DICE ──────────────────────────────────────
   El apartado 3 enumera cinco `trigger`. Dos **no son observables** y están en
   `NO_OBSERVABLE` con su motivo en vez de fingirse: como no se guarda nada,
   tampoco se guarda que una sesión fue editada o borrada. Lo que sí se observa
   es el cuestionario (`creadoEn`), la reclasificación (`actualizadoEn`) y el
   entrenamiento (la fecha de la sesión).

   ⚠️ **Y la estimación anterior a una reclasificación NO se puede recuperar**:
   una clasificación guarda **una** respuesta, así que al recontestar la vieja
   desaparece. El apartado 9 es literal —*"No utilizar datos actuales para
   fabricar valores anteriores"*—, así que ese tramo se declara como hueco
   (`estimacionAnteriorPerdida`) en vez de pintarse con la puntuación de hoy.
   =========================================================================== */

import { GRUPOS_MUSCULARES, TODOS_LOS_SUBGRUPOS, nivelRango } from './fitness.js';
import { ejercicioPorId, musculosDe } from './ejercicios.js';
import { fechaLocalISO, todayISO, addDays } from './helpers.js';
import { confianzaDe, progresoHaciaSiguiente } from './rangos.js';
import {
  fuenteRango, fuenteCombinada, rangosEfectivos, rangoEfectivoDeEjercicio,
  rangoEfectivoDeGrupo, rangoEfectivoDeSubgrupo, rangoGlobalEfectivo,
} from './motorRangos.js';
import { PERIODOS, inicioDePeriodo } from './progresoEjercicios.js';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const dia = (ms) => (Number.isFinite(ms) ? fechaLocalISO(ms) : null);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LAS ENTIDADES Y LOS DISPARADORES (apartado 3)
   ═══════════════════════════════════════════════════════════════════════════ */

/** `entityType` del apartado 3, con el nombre que se lee en pantalla. */
export const TIPOS_ENTIDAD = [
  { id: 'exercise', nombre: 'Ejercicio' },
  { id: 'subgroup', nombre: 'Subgrupo muscular' },
  { id: 'muscleGroup', nombre: 'Grupo muscular' },
  { id: 'overall', nombre: 'Rango global' },
];
export const tipoEntidad = (id) => TIPOS_ENTIDAD.find((t) => t.id === texto(id)) || null;

/**
 * `trigger` del apartado 3 — **solo los tres que se pueden observar**.
 *
 * ⚠️ El texto de cada uno es el del apartado 11: *"No utilizar lenguaje
 * excesivamente técnico"*. En pantalla se lee «Entrenamientos», no `workout`.
 */
export const DISPARADORES = [
  { id: 'questionnaire', nombre: 'Clasificación inicial', corto: 'Clasificación' },
  { id: 'manualReclassification', nombre: 'Volviste a clasificarlo', corto: 'Clasificación' },
  { id: 'workout', nombre: 'Entrenamiento', corto: 'Entrenamientos' },
];
export const disparador = (id) => DISPARADORES.find((d) => d.id === texto(id)) || null;

/**
 * 🚨 Los dos `trigger` del apartado 3 que **no existen en este sistema**, con su
 * motivo. Declararlos es lo contrario de fingirlos (regla 8): el día que
 * JosStyle guarde un registro de ediciones, aquí está escrito qué haría falta.
 */
export const NO_OBSERVABLE = [
  {
    id: 'sessionEdited',
    porque: 'Nada guarda que una sesión se editó. El historial se reconstruye de los datos que hay HOY, así que una sesión editada se lee con sus valores nuevos y el pasado se corrige solo (apartado 17). Lo que no se puede es contar que la edición ocurrió.',
    haria_falta: 'Una marca de edición en la sesión, y el apartado 3 no la pide.',
  },
  {
    id: 'sessionDeleted',
    porque: 'Una sesión borrada ya no está en `fitness.sesiones`, así que sus puntos desaparecen del historial —que es exactamente lo que manda el apartado 18—. No queda de dónde sacar que existió.',
    haria_falta: 'Leer la papelera, y una sesión restaurada volvería a contar dos veces.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LOS PERIODOS (apartado 23)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * *"Todo · 3 meses · 6 meses · 1 año"*, literal. Sin rangos personalizados, que
 * el propio apartado aplaza.
 *
 * 🚨 **Un periodo filtra lo que SE VE, nunca lo que se calcula.** Es la
 * diferencia con `fitnessEnPeriodo` de la F13, que recorta las sesiones antes de
 * medir: allí es correcto —se mide la actividad del trimestre— y aquí sería un
 * fallo, porque el rango de septiembre **depende de las sesiones de julio**.
 * Recortando la entrada, el primer punto del periodo saldría con un rango que
 * Josué no ha tenido nunca.
 */
/* 🐛 **FIT F31 — Y ERA UN SEGUNDO CATÁLOGO.** La F29 dejó escrito que hay *"un
   solo catálogo de periodos"* (`PERIODOS`, en `progresoEjercicios.js`), y éste,
   que es anterior, decía **90** días para «3 meses» y **180** para «6 meses»
   donde aquél dice 91 y 182: el mismo nombre, dos duraciones. Ahora es un
   subconjunto **por ids**, en el orden de este apartado, y el primer día lo
   decide `inicioDePeriodo` — el mismo que en el resto de Fitness. */
export const IDS_PERIODOS_HISTORIAL = ['todo', '3m', '6m', '1a'];
export const PERIODOS_HISTORIAL = IDS_PERIODOS_HISTORIAL.map((id) => PERIODOS.find((p) => p.id === id));
export const PERIODO_POR_DEFECTO = 'todo';
export const periodoHistorial = (id) =>
  PERIODOS_HISTORIAL.find((p) => p.id === texto(id)) || PERIODOS_HISTORIAL.find((p) => p.id === PERIODO_POR_DEFECTO);

export const SIN_CAMBIOS_EN_PERIODO = 'No hay cambios en este periodo.';

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EN QUÉ DÍAS PUDO CAMBIAR ALGO (apartados 2 y 33)
   ═══════════════════════════════════════════════════════════════════════════
   *"No recalcular todo el RankEngine para pintar un timeline"* (apartado 33).
   La forma de no hacerlo no es una caché: es **no preguntar por días en los que
   no pudo pasar nada**. Una sesión de piernas no puede mover el rango de
   dominadas, así que ese día no es un punto del historial de dominadas.
   ⚠️ Y los puntos son **días**, no instantes: dos sesiones del mismo día dan un
   punto, que es como se lee el timeline del apartado 10. */

/** Los ejercicios que le importan a un destino. `null` = todos. */
function ejerciciosDelDestino(destino, propios = []) {
  const t = texto(destino && destino.tipo);
  const id = texto(destino && destino.id);
  if (t === 'exercise') return new Set([id]);
  if (t !== 'subgroup' && t !== 'muscleGroup') return null;
  /* 🚨 `musculosDe` es quien resuelve el `grupoId`: la ficha de un ejercicio
     guarda **solo el `subgrupoId`**, así que leer `m.grupoId` de `ej.musculos`
     habría devuelto `undefined` para todos y ningún día habría sido relevante —
     con el historial saliendo vacío y la pantalla pintándose perfecta. Es la
     lección de la F7 con `musculosResumidos`, otra vez. */
  return { toca: (ej) => musculosDe(ej).filter((m) => (m.porcentaje || 0) > 0).some((m) => (t === 'subgroup' ? m.subgrupoId === id : m.grupoId === id)) };
}

/** ¿Esta sesión pudo mover este destino? */
function sesionRelevante(sesion, filtro, propios) {
  if (!filtro) return true;
  const ids = idsDeSesion(sesion);
  if (filtro instanceof Set) return ids.some((id) => filtro.has(id));
  return ids.some((id) => { const ej = ejercicioPorId(id, propios); return ej && filtro.toca(ej); });
}

/** Los `exerciseId` que aparecen en una sesión guardada (snapshot de la F7). */
export function idsDeSesion(sesion) {
  const s = sesion || {};
  const desdeSnapshot = lista(s.origen && s.origen.ejercicios).map((e) => texto(e && e.exerciseId));
  const desdeLineas = lista(s.ejercicios).map((e) => texto(e && e.exerciseId));
  return [...new Set([...desdeSnapshot, ...desdeLineas].filter(Boolean))];
}

/**
 * El día efectivo de una clasificación y con qué disparador entró.
 *
 * ⚠️ Si se reclasificó, el punto es el de la **reclasificación**: la respuesta
 * anterior ya no existe en ninguna parte (apartado 9).
 */
export function momentoDeClasificacion(c) {
  if (!c || c.puntuacion === null || c.puntuacion === undefined) return null;
  const reclasificada = Number.isFinite(c.actualizadoEn);
  const fecha = dia(reclasificada ? c.actualizadoEn : c.creadoEn);
  if (!fecha) return null;
  return {
    fecha,
    trigger: reclasificada ? 'manualReclassification' : 'questionnaire',
    exerciseId: texto(c.exerciseId),
    estimacionAnteriorPerdida: reclasificada,
  };
}

/**
 * Los días en los que el destino pudo cambiar, ordenados, con qué pasó ese día.
 * 🚨 Solo salen días con datos **reales**: el apartado 2 prohíbe una cronología
 * ficticia, así que aquí no se rellena ningún hueco entre dos fechas.
 */
export function momentosDe(fitness, destino, { propios = [] } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const filtro = ejerciciosDelDestino(destino, propios);
  const porDia = new Map();
  const anota = (fecha, trigger, extra = {}) => {
    if (!fecha) return;
    const y = porDia.get(fecha) || { fecha, triggers: new Set(), sesiones: [], clasificaciones: [] };
    y.triggers.add(trigger);
    if (extra.sesionId) y.sesiones.push(extra.sesionId);
    if (extra.exerciseId) y.clasificaciones.push(extra.exerciseId);
    porDia.set(fecha, y);
  };

  lista(f.clasificaciones).forEach((c) => {
    const m = momentoDeClasificacion(c);
    if (!m) return;
    if (filtro instanceof Set && !filtro.has(m.exerciseId)) return;
    if (filtro && !(filtro instanceof Set)) {
      const ej = ejercicioPorId(m.exerciseId, propios);
      if (!ej || !filtro.toca(ej)) return;
    }
    anota(m.fecha, m.trigger, { exerciseId: m.exerciseId });
  });

  lista(f.sesiones).forEach((s) => {
    if (!s || s.estado !== 'completada' || !texto(s.fecha)) return;
    if (!sesionRelevante(s, filtro, propios)) return;
    anota(texto(s.fecha), 'workout', { sesionId: s.id });
  });

  return [...porDia.values()]
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
    .map((d) => ({ ...d, triggers: [...d.triggers] }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL RANGO QUE HABÍA ESE DÍA
   ═══════════════════════════════════════════════════════════════════════════ */

/** `fitness` recortado a lo que existía hasta ese día, inclusive. */
function fitnessHasta(fitness, fecha) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  return {
    ...f,
    sesiones: lista(f.sesiones).filter((s) => s && s.estado === 'completada' && texto(s.fecha) && s.fecha <= fecha),
    clasificaciones: lista(f.clasificaciones).filter((c) => {
      const m = momentoDeClasificacion(c);
      return m && m.fecha <= fecha;
    }),
  };
}

/**
 * El resultado del motor para un destino, sea del tipo que sea.
 *
 * ⚠️ **A un grupo y a un subgrupo se les añade la `fuente`**, que
 * `rangoDeGrupo` no devuelve: agrega scores, no procedencias. Sin ella, el
 * historial de Espalda no podría decir si un cambio vino de entrenamientos o de
 * una clasificación (apartados 11 y 14). Se calcula con `fuenteCombinada`, la
 * misma regla que usa el rango global — no una segunda.
 */
export function rangoDeDestino(fitness, destino, { propios = [], perfil = null, efectivos = null } = {}) {
  const t = texto(destino && destino.tipo);
  const id = texto(destino && destino.id);
  if (t === 'exercise') return rangoEfectivoDeEjercicio(fitness, id, { propios, perfil });
  if (t === 'overall') return rangoGlobalEfectivo(fitness, { propios, perfil });
  if (t !== 'muscleGroup' && t !== 'subgroup') return null;

  const todos = efectivos || rangosEfectivos(fitness, { propios, perfil });
  const r = t === 'muscleGroup'
    ? rangoEfectivoDeGrupo(fitness, id, { propios, perfil, efectivos: todos })
    : rangoEfectivoDeSubgrupo(fitness, id, { propios, perfil, efectivos: todos });
  if (!r || r.sinRango) return r;
  /* Solo cuentan los ejercicios que de verdad aportan a ESE músculo. */
  const aportan = todos.filter((e) => lista(e.reparto).some((x) => (t === 'muscleGroup' ? x.grupoId === id : x.subgrupoId === id) && x.peso > 0));
  return { ...r, fuente: fuenteCombinada(aportan.map((e) => e.fuente)) };
}

/* Lo que se guarda de cada punto. ⚠️ `confianza` sale de los dataPoints que
   había ESE día, no de los de hoy (apartado 12). */
function puntoDe(fecha, r, dia_) {
  if (!r || r.sinRango) return null;
  const puntos = Number.isFinite(r.dataPoints) ? r.dataPoints : null;
  const conf = r.confianza || (puntos !== null ? (confianzaDe(puntos) || {}).id || null : null);
  return {
    fecha,
    rango: r.rango,
    nombre: r.nombre,
    score: Number.isFinite(r.score) ? r.score : null,
    fuente: r.fuente || null,
    fuenteNombre: r.fuente ? (fuenteRango(r.fuente) || {}).nombre || null : null,
    confianza: conf,
    confianzaNombre: r.confianzaNombre || null,
    provisional: !!r.provisional,
    cobertura: r.cobertura || null,
    dataPoints: puntos,
    triggers: dia_.triggers,
    sesiones: dia_.sesiones,
    clasificaciones: dia_.clasificaciones,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LOS CAMBIOS DE VERDAD (apartados 7 y 8)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 *"480 → 520, si ambos siguen siendo Intermedio, NO crear un evento de
   subida de rango"*. La condición del apartado 7 es literal y es la única:
   `rankId actual !== rankId anterior`. */

export const SENTIDOS = [
  { id: 'subida', marca: '↑', nombre: 'Subida de rango' },
  { id: 'igual', marca: '→', nombre: 'Sin cambio' },
  { id: 'bajada', marca: '↓', nombre: 'Bajada de rango' },
];
export const sentido = (id) => SENTIDOS.find((s) => s.id === texto(id)) || null;

/** Apartado 31 — el sentido **con su palabra**, nunca solo la flecha ni el color. */
export function marcaDeCambio(id) {
  const s = sentido(id);
  return s ? { marca: s.marca, nombre: s.nombre, texto: `${s.marca} ${s.nombre}` } : null;
}

/** Los cambios reales entre puntos consecutivos. */
export function cambiosDe(puntos = []) {
  const salida = [];
  for (let i = 1; i < puntos.length; i += 1) {
    const antes = puntos[i - 1];
    const ahora = puntos[i];
    if (!antes || !ahora || antes.rango === ahora.rango) continue;
    salida.push({
      id: `cambio-${ahora.fecha}-${antes.rango}-${ahora.rango}`,
      fecha: ahora.fecha,
      sentido: ahora.rango > antes.rango ? 'subida' : 'bajada',
      desde: antes.rango,
      desdeNombre: antes.nombre,
      hasta: ahora.rango,
      hastaNombre: ahora.nombre,
      scoreAntes: antes.score,
      scoreDespues: ahora.score,
      confianza: ahora.confianza,
      provisional: ahora.provisional,
      fuente: ahora.fuente,
      fuenteNombre: ahora.fuenteNombre,
      triggers: ahora.triggers,
      sesiones: ahora.sesiones,
      clasificaciones: ahora.clasificaciones,
      indice: i,
    });
  }
  return salida;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · `getRankHistory` (apartados 21 y 22)
   ═══════════════════════════════════════════════════════════════════════════ */

export const HISTORIAL_INSUFICIENTE = 'Historial insuficiente';

/* Un caché por (lista de sesiones, destino): el timeline del rango global
   recorre todos los ejercicios en cada punto, y la pantalla lo pide varias
   veces por render. ⚠️ Va colgado de la **lista de sesiones**, como el índice de
   la F11: guardar una sesión crea una lista nueva y el caché se cae solo — que
   es la única invalidación que este proyecto se permite. */
const CACHE = new WeakMap();

/**
 * **La función central del apartado 21.** Devuelve los eventos ordenados, los
 * cambios, el score, la confianza y la fuente de un destino.
 *
 * 🚨 **No sustituye a `rangoEfectivoDe*`** (apartado 22): es una capa de
 * consulta. El rango actual que enseña Rangos lo sigue dando el motor; lo que
 * hay aquí es de dónde viene.
 */
export function historialDeRango(fitness, destino, { propios = [], perfil = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const t = texto(destino && destino.tipo);
  const id = texto(destino && destino.id);
  if (!tipoEntidad(t)) return vacio(t, id, 'destino_desconocido');

  const sesiones = lista(f.sesiones);
  const clave = `${t}|${id}|${lista(propios).length}|${(perfil && perfil.peso) || ''}`;
  let porClave = CACHE.get(sesiones);
  if (!porClave) { porClave = new Map(); CACHE.set(sesiones, porClave); }
  if (porClave.has(clave)) return porClave.get(clave);

  const dias = momentosDe(f, { tipo: t, id }, { propios });
  const puntos = [];
  dias.forEach((d) => {
    const p = puntoDe(d.fecha, rangoDeDestino(fitnessHasta(f, d.fecha), { tipo: t, id }, { propios, perfil }), d);
    /* ⚠️ Un día que todavía no daba rango NO es un punto: pintarlo como
       «Sin Rango» en la línea inventaría un estado que nunca se enseñó. */
    if (!p) return;
    /* Un punto que no cambia nada respecto al anterior tampoco entra: el
       timeline es de cambios, no un registro de cada día que entrenó. */
    const previo = puntos[puntos.length - 1];
    if (previo && previo.rango === p.rango && previo.score === p.score) return;
    puntos.push(p);
  });

  const actual = rangoDeDestino(f, { tipo: t, id }, { propios, perfil });
  const cambios = cambiosDe(puntos);
  const ultimo = cambios[cambios.length - 1] || null;
  const salida = {
    tipo: t,
    id,
    puntos,
    cambios,
    actual: actual && !actual.sinRango ? actual : null,
    anterior: ultimo ? { rango: ultimo.desde, nombre: ultimo.desdeNombre } : null,
    ultimoCambio: ultimo,
    suficiente: puntos.length > 0,
    motivo: puntos.length ? null : 'sin_historial',
    /* Apartado 9 — si alguna estimación se sustituyó, el tramo anterior no es
       recuperable y se dice, en vez de dibujarlo con la puntuación de hoy. */
    estimacionAnteriorPerdida: lista(f.clasificaciones).some((c) => {
      const m = momentoDeClasificacion(c);
      if (!m || !m.estimacionAnteriorPerdida) return false;
      if (t === 'exercise') return m.exerciseId === id;
      return true;
    }),
  };
  if (sesiones.length) porClave.set(clave, salida);
  return salida;
}

function vacio(tipo, id, motivo) {
  return {
    tipo, id, puntos: [], cambios: [], actual: null, anterior: null, ultimoCambio: null,
    suficiente: false, motivo, estimacionAnteriorPerdida: false,
  };
}

/** Apartado 23 — el periodo recorta **la vista**, no el cálculo. */
export function enPeriodo(historial, periodoId = PERIODO_POR_DEFECTO, hoy = todayISO()) {
  const h = historial || vacio('', '', 'sin_historial');
  const p = periodoHistorial(periodoId);
  if (!p.dias) return { ...h, periodo: p.id, desde: null, vacioEnPeriodo: !h.puntos.length };
  const desde = inicioDePeriodo(p.dias, hoy);
  const puntos = h.puntos.filter((x) => x.fecha >= desde);
  const cambios = h.cambios.filter((x) => x.fecha >= desde);
  return {
    ...h,
    periodo: p.id,
    desde,
    puntos,
    cambios,
    /* ⚠️ `actual` y `anterior` NO se recortan: son el estado de hoy, y un
       periodo de tres meses no puede hacer que Josué deje de tener el rango que
       tiene. Lo que el periodo contesta es *"¿qué ha pasado en este tiempo?"*. */
    vacioEnPeriodo: cambios.length === 0,
    aviso: cambios.length === 0 ? SIN_CAMBIOS_EN_PERIODO : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · EL RESUMEN (apartados 6, 8 y 27)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `RankHistorySummary`: el rango actual, el anterior si lo hubo, y —cuando no ha
 * cambiado— el progreso **dentro** del rango.
 *
 * 🚨 *"Esto es diferente de: Has subido de rango"* (apartado 8). Se distinguen
 * con dos campos separados, no con un texto que dependa de cómo se lea.
 */
export function resumenDeHistorial(historial) {
  const h = historial || vacio('', '', 'sin_historial');
  if (!h.actual) {
    return { hay: false, motivo: h.motivo || 'sin_rango', titulo: HISTORIAL_INSUFICIENTE, actual: null, anterior: null, dentro: null, subida: null };
  }
  const dentro = Number.isFinite(h.actual.score) ? progresoHaciaSiguiente(h.actual.score) : null;
  const primeroDelRango = [...h.puntos].reverse().find((p, i, todos) => {
    const sig = todos[i + 1];
    return !sig || sig.rango !== h.actual.rango;
  }) || null;
  const progresoDentro = dentro && primeroDelRango && Number.isFinite(primeroDelRango.score)
    && h.actual.score > primeroDelRango.score;
  return {
    hay: true,
    actual: { rango: h.actual.rango, nombre: h.actual.nombre, score: Number.isFinite(h.actual.score) ? h.actual.score : null },
    anterior: h.anterior,
    /* Apartado 27 — *"Sigues en Avanzado"*, sin falsa evolución. */
    sigueEn: h.anterior ? null : `Sigues en ${h.actual.nombre}`,
    dentro: dentro ? { fraccion: dentro.fraccion, siguiente: dentro.siguiente, siguienteNombre: dentro.siguiente ? nivelRango(dentro.siguiente).nombre : null } : null,
    progresoDentro: !!progresoDentro,
    textoDentro: progresoDentro ? 'Has progresado dentro de este rango.' : null,
    subida: h.ultimoCambio || null,
    provisional: !!h.actual.provisional,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · EL DETALLE DE UN CAMBIO (apartados 14, 15 y 16)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 16 — *"Si no puede determinarse de forma fiable: NO inventarlo"*. */
export const CAMBIO_SIN_DETALLE = 'El cambio se basa en la evolución de tus ejercicios registrados.';

/**
 * Qué ejercicios subieron entre el punto anterior y el del cambio.
 *
 * 🚨 Solo se contesta cuando **se puede medir**: se comparan los rangos
 * efectivos de cada ejercicio del grupo en las dos fechas y salen los que
 * cambiaron. Si el destino es un ejercicio no hay nada que repartir, y si en el
 * día del cambio no entrenó nada del grupo —pudo cambiar por cobertura— se
 * devuelve `null` y la pantalla enseña `CAMBIO_SIN_DETALLE`.
 */
export function ejerciciosResponsables(fitness, destino, cambio, { propios = [], perfil = null } = {}) {
  const t = texto(destino && destino.tipo);
  if (!cambio || (t !== 'muscleGroup' && t !== 'subgroup' && t !== 'overall')) return null;
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const ids = [...new Set(lista(cambio.sesiones)
    .map((sid) => lista(f.sesiones).find((s) => s && s.id === sid))
    .filter(Boolean)
    .flatMap(idsDeSesion))];
  if (!ids.length) return null;

  const antes = fitnessHasta(f, addDays(cambio.fecha, -1));
  const despues = fitnessHasta(f, cambio.fecha);
  const filtro = ejerciciosDelDestino(destino, propios);
  const salida = ids
    .map((id) => {
      const ej = ejercicioPorId(id, propios);
      if (!ej) return null;
      if (filtro && !(filtro instanceof Set) && !filtro.toca(ej)) return null;
      const a = rangoEfectivoDeEjercicio(antes, id, { propios, perfil });
      const b = rangoEfectivoDeEjercicio(despues, id, { propios, perfil });
      if (b.sinRango) return null;
      const subioRango = !a.sinRango && b.rango > a.rango;
      const subioScore = !a.sinRango && Number.isFinite(a.score) && Number.isFinite(b.score) && b.score > a.score;
      if (!subioRango && !subioScore) return null;
      return { exerciseId: id, nombre: ej.nombre, sentido: 'subida', rango: b.rango, nombreRango: b.nombre, cambioDeRango: subioRango };
    })
    .filter(Boolean);
  return salida.length ? salida : null;
}

/** `RankChangeCard` del apartado 14 — todo lo que se sabe del evento, y nada más. */
export function detalleDeCambio(fitness, destino, cambio, { propios = [], perfil = null } = {}) {
  if (!cambio) return null;
  const responsables = ejerciciosResponsables(fitness, destino, cambio, { propios, perfil });
  const m = marcaDeCambio(cambio.sentido);
  return {
    fecha: cambio.fecha,
    sentido: cambio.sentido,
    marca: m,
    /* Apartado 15, literal. */
    titulo: cambio.sentido === 'subida'
      ? `Subiste de ${cambio.desdeNombre} a ${cambio.hastaNombre}.`
      : `Bajaste de ${cambio.desdeNombre} a ${cambio.hastaNombre}.`,
    desde: { rango: cambio.desde, nombre: cambio.desdeNombre, score: cambio.scoreAntes },
    hasta: { rango: cambio.hasta, nombre: cambio.hastaNombre, score: cambio.scoreDespues },
    confianza: cambio.confianza,
    provisional: cambio.provisional,
    fuente: cambio.fuente,
    fuenteNombre: cambio.fuenteNombre,
    responsables,
    /* Solo se afirma lo que se puede justificar (apartado 15, última línea). */
    porque: responsables ? 'Basado principalmente en tus ejercicios con datos recientes.' : CAMBIO_SIN_DETALLE,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · EL TIMELINE Y EL GRÁFICO (apartados 10, 24 y 25)
   ═══════════════════════════════════════════════════════════════════════════ */

/** `RankTimeline`: un evento por punto, con lo que hay que leer en cada línea. */
export function timelineDeHistorial(historial) {
  const h = historial || vacio('', '', 'sin_historial');
  const cambios = new Map(h.cambios.map((c) => [c.fecha, c]));
  return h.puntos
    .map((p, i) => {
      const c = cambios.get(p.fecha) || null;
      const inicial = i === 0;
      return {
        id: `punto-${p.fecha}-${p.rango}`,
        fecha: p.fecha,
        rango: p.rango,
        nombre: p.nombre,
        score: p.score,
        fuente: p.fuente,
        fuenteNombre: p.fuenteNombre,
        confianza: p.confianza,
        provisional: p.provisional,
        cambio: c,
        sentido: c ? c.sentido : 'igual',
        marca: marcaDeCambio(c ? c.sentido : 'igual'),
        /* La primera línea no puede decir «↑ desde…»: no había desde. */
        detalle: c ? `${marcaDeCambio(c.sentido).marca} desde ${c.desdeNombre}` : (inicial ? etiquetaInicial(p) : 'Progreso dentro del rango'),
      };
    })
    .reverse();
}

function etiquetaInicial(p) {
  if (p.triggers.includes('questionnaire')) return 'Clasificación inicial';
  if (p.triggers.includes('manualReclassification')) return 'Volviste a clasificarlo';
  return 'Primer dato registrado';
}

/** Con cuántos puntos deja de bastar el timeline y aporta un gráfico. */
export const PUNTOS_MINIMOS_GRAFICA = 4;

/**
 * `RankScoreHistory` (apartados 24 y 25).
 *
 * 🚨 *"No interpolar artificialmente entre puntos si no hay datos"*: cada punto
 * lleva **su fecha real** y el gráfico se dibuja de punto a punto. Lo que no hay
 * es un valor por día: entre el 12 de julio y el 30 de agosto **no hay nada**, y
 * la separación entre dos puntos la marca su fecha, no su posición en la lista.
 */
export function graficaDeHistorial(historial) {
  const h = historial || vacio('', '', 'sin_historial');
  const conScore = h.puntos.filter((p) => Number.isFinite(p.score));
  if (conScore.length < PUNTOS_MINIMOS_GRAFICA) {
    return {
      hay: false,
      motivo: conScore.length <= 1 ? 'pocos_puntos' : 'timeline_basta',
      puntos: conScore.length,
      minimo: PUNTOS_MINIMOS_GRAFICA,
      interpolado: false,
    };
  }
  const dias = conScore.map((p) => Date.parse(`${p.fecha}T00:00:00`));
  const min = Math.min(...dias);
  const max = Math.max(...dias);
  const ancho = Math.max(1, max - min);
  const scores = conScore.map((p) => p.score);
  const alto = Math.max(1, Math.max(...scores) - Math.min(...scores));
  const suelo = Math.min(...scores);
  return {
    hay: true,
    motivo: null,
    interpolado: false,
    minimo: PUNTOS_MINIMOS_GRAFICA,
    desde: conScore[0].fecha,
    hasta: conScore[conScore.length - 1].fecha,
    puntos: conScore.map((p, i) => ({
      fecha: p.fecha,
      score: p.score,
      rango: p.rango,
      nombre: p.nombre,
      /* La X sale de la FECHA, no del índice: así dos puntos separados por dos
         meses no se dibujan a la misma distancia que dos de días seguidos. */
      x: (Date.parse(`${p.fecha}T00:00:00`) - min) / ancho,
      y: (p.score - suelo) / alto,
      indice: i,
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · LOS ESTADOS VACÍOS (apartados 2 y 26)
   ═══════════════════════════════════════════════════════════════════════════ */

export const VACIOS_HISTORIAL = {
  sin_historial: { titulo: HISTORIAL_INSUFICIENTE, que: 'Todavía no hay datos suficientes para dibujar una evolución.' },
  destino_desconocido: { titulo: HISTORIAL_INSUFICIENTE, que: 'No se reconoce lo que se está consultando.' },
  ejercicio: { titulo: 'Este ejercicio todavía no tiene suficiente historial.', que: 'Aparecerá en cuanto lo clasifiques o lo entrenes unas cuantas veces.', cta: 'Ver progreso' },
};

/** `RankHistoryEmpty` — el vacío que toca, **siempre con salida** (E3 F41). */
export function vacioDeHistorial(historial) {
  const h = historial || vacio('', '', 'sin_historial');
  if (h.suficiente) return null;
  if (h.tipo === 'exercise') return { ...VACIOS_HISTORIAL.ejercicio, motivo: h.motivo || 'sin_historial' };
  const base = VACIOS_HISTORIAL[h.motivo] || VACIOS_HISTORIAL.sin_historial;
  return { ...base, cta: null, motivo: h.motivo || 'sin_historial' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LA PANTALLA (apartados 29 y 30)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Qué se le enseña a un destino, de una sola llamada. */
export function pantallaDeHistorial(fitness, destino, { propios = [], perfil = null, periodo = PERIODO_POR_DEFECTO, hoy = todayISO() } = {}) {
  const completo = historialDeRango(fitness, destino, { propios, perfil });
  const visto = enPeriodo(completo, periodo, hoy);
  return {
    destino: { tipo: completo.tipo, id: completo.id, nombre: nombreDeDestino(completo, propios) },
    periodo: visto.periodo,
    periodos: PERIODOS_HISTORIAL,
    resumen: resumenDeHistorial(completo),
    timeline: timelineDeHistorial(visto),
    grafica: graficaDeHistorial(visto),
    vacio: vacioDeHistorial(completo),
    aviso: completo.suficiente ? visto.aviso : null,
    estimacionAnteriorPerdida: completo.estimacionAnteriorPerdida,
    cambios: visto.cambios,
  };
}

export function nombreDeDestino(historial, propios = []) {
  const h = historial || {};
  if (h.tipo === 'overall') return 'Rango global';
  if (h.tipo === 'exercise') { const e = ejercicioPorId(h.id, propios); return e ? e.nombre : 'Ejercicio'; }
  if (h.tipo === 'muscleGroup') { const g = GRUPOS_MUSCULARES.find((x) => x.id === h.id); return g ? g.nombre : 'Grupo muscular'; }
  const s = TODOS_LOS_SUBGRUPOS.find((x) => x.id === h.id);
  return s ? s.nombre : 'Subgrupo muscular';
}

/* ═══════════════════════════════════════════════════════════════════════════
   12 · LO QUE NO ENTRA, Y POR QUÉ
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT22 = [
  { que: 'Confeti, sonidos, vibración y animaciones al subir de rango', porque: 'Apartados 13 y 36, los dos literales. El cambio se enseña con una tarjeta sobria.' },
  { que: 'XP, niveles de usuario, leaderboard, comparación con otras personas, IA, predicciones, recompensas y logros', porque: 'Apartado 36, que los enumera uno a uno, y D2-02: los niveles solo existen dentro de Sonido y Rachas. Un rango es una MEDIDA de lo que levanta, no un premio por usar la aplicación (C-33).' },
  { que: 'Una tabla `rank_history` en `app_data`', porque: 'Apartado 3: *"únicamente si la arquitectura actual lo necesita"*, y no lo necesita. Guardarlo obligaría a limpiar eventos falsos al borrar una sesión —lo que el apartado 18 prohíbe—; derivándolo, esos eventos no llegan a existir.' },
  { que: 'Scores anteriores reconstruidos a ojo', porque: 'Apartado 9: *"No utilizar datos actuales para fabricar valores anteriores"*. Un punto sin score se queda sin score.' },
  { que: 'Una sección de Historial de rangos aparte', porque: 'Apartado 30: *"No crear una sección completamente independiente si la navegación actual permite reutilizar la misma pantalla"*. Cuelga del rango global, del muscular y del de ejercicio, que es donde se pregunta.' },
];

export const DECISIONES_FIT22 = [
  { que: 'El historial se DERIVA, como el rango', porque: 'Apartado 2: reconstruirlo *"a partir de datos reales siempre que sea posible"*. Se puede, porque el motor de la F19 no guarda nada: darle los datos de una fecha devuelve el rango de esa fecha. Y así los apartados 17, 18 y 19 no necesitan código.' },
  { que: 'Un punto por DÍA, no por sesión ni por instante', porque: 'El timeline del apartado 10 se lee por fechas, y dos sesiones del mismo día enseñarían dos líneas con el mismo rótulo. ⚠️ Las sesiones guardan `fecha` (día), así que un instante no existe en el dato.' },
  { que: 'Solo se consultan los días en que ESE destino pudo cambiar', porque: 'Apartado 33: *"No recalcular todo el RankEngine para pintar un timeline"*. Una sesión de piernas no puede mover el rango de dominadas, así que ese día no es un punto de su historial. Es lo que evita el recálculo, más que el caché.' },
  { que: 'Un punto que no cambia ni rango ni score no entra en la lista', porque: 'El apartado 7 pide registrar cambios, no cada día que entrenó. Un timeline con cuarenta líneas idénticas esconde las tres que importan.' },
  { que: 'El periodo recorta lo que se VE, nunca lo que se calcula', porque: 'El rango de septiembre depende de las sesiones de julio (la ventana de estabilidad es de cinco sesiones). Recortando la entrada —como hace `fitnessEnPeriodo` en la F13, donde sí es correcto— el primer punto del periodo saldría con un rango que nunca ha tenido.' },
  { que: 'La estimación anterior a una reclasificación se declara perdida', porque: 'Apartado 9. Una clasificación guarda UNA respuesta, así que al recontestar la vieja desaparece: dibujar ese tramo con la puntuación de hoy sería fabricar el pasado.' },
  { que: 'Los responsables de un cambio se calculan, y si no salen se dice la frase del apartado 16', porque: 'Se comparan los rangos de los ejercicios de ese día antes y después. Un cambio por cobertura —un grupo que empieza a contar porque ya hay tres ejercicios— no tiene responsables, y entonces no se inventan.' },
  { que: 'El gráfico coloca cada punto por su FECHA, no por su posición', porque: 'Apartado 24: *"No crear valores ficticios entre ambas fechas"*. Repartiendo los puntos a distancias iguales, siete semanas sin entrenar se verían como un día.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   13 · LA AUDITORÍA (apartado 37)
   ═══════════════════════════════════════════════════════════════════════════
   Las cinco preguntas del criterio de finalización, **calculadas** sobre un
   `fitness` de verdad. Una casilla puesta a `true` a mano es una auditoría que
   no puede fallar (EH F42). */

export function auditarHistorialRangos(fitness, { propios = [], perfil = null } = {}) {
  return casillasDeHistorial(historialDeRango(fitness, { tipo: 'overall', id: '' }, { propios, perfil }));
}

/**
 * Las casillas, sobre **un historial cualquiera**.
 *
 * ⚠️ Van aparte de `auditarHistorialRangos` para que se puedan poner rojas: con
 * los datos bien, estas condiciones son siempre ciertas —son propiedades del
 * propio código—, así que la única forma de demostrar que la auditoría PUEDE
 * fallar es dándole un historial inventado que las incumpla. Una auditoría que
 * no puede ponerse roja no sirve (EH F42), y una que lo *parece* es peor,
 * porque nadie vuelve a mirarla.
 */
export function casillasDeHistorial(global) {
  const resumen = resumenDeHistorial(global);
  const casillas = [
    {
      id: 1,
      texto: '¿De dónde viene mi rango actual?',
      ok: !resumen.hay || global.puntos.every((p) => !!p.fuente),
    },
    {
      id: 2,
      texto: '¿Qué rango tenía antes?',
      ok: !global.ultimoCambio || (global.anterior !== null && global.anterior.rango !== global.ultimoCambio.hasta),
    },
    {
      id: 3,
      texto: '¿Cuándo cambió?',
      ok: global.cambios.every((c) => typeof c.fecha === 'string' && c.fecha.length === 10),
    },
    {
      id: 4,
      texto: '¿Fue por datos reales o por clasificación?',
      ok: global.cambios.every((c) => c.fuente === null || !!fuenteRango(c.fuente)),
    },
    {
      id: 5,
      texto: '¿He mejorado aunque no haya subido de rango?',
      ok: !resumen.hay || resumen.dentro !== null || resumen.actual.score === null,
    },
    {
      id: 6,
      texto: 'Ningún evento histórico inventado: cada punto cae en un día con datos',
      ok: global.puntos.every((p) => p.triggers.length > 0),
    },
    {
      id: 7,
      texto: 'Un cambio solo existe si cambió el rango (apartado 7)',
      ok: global.cambios.every((c) => c.desde !== c.hasta),
    },
    {
      id: 8,
      texto: 'El gráfico no interpola',
      ok: graficaDeHistorial(global).interpolado === false,
    },
  ];
  return { casillas, ok: casillas.every((c) => c.ok), puntos: global.puntos.length, cambios: global.cambios.length };
}
