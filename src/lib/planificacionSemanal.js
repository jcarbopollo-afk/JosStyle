import { todayISO, addDays, fechaValida } from './helpers';
import { DIAS_SEMANA, diaDeFecha } from './horario';
import { CATALOGO_PLANES, planesAnterioresDe } from './planes';
import {
  tuPlan, planActivoCompleto, semanaDelPlan, proximoEntrenamiento, sesionDelDia,
  planValido, DESCANSO_HOY,
} from './tuPlan';
import {
  sesionesDeActividad, conFecha, lunesDe, diaYMes, tarjetaDeSesion, resumenDeActividad,
} from './actividadEntrenamiento';
import { diaDePlanDe, MESES } from './finalizacion';
import { distribucionMuscular, duracionEstimada } from './constructor';

/* Entrega 4 · Fase 32/45 — «Planificación semanal avanzada de entrenamiento».
   ═══════════════════════════════════════════════════════════════════════════

   El criterio de finalización: entrar en *Fitness → Entrenamiento → Tu Plan* y
   entender **qué toca hoy, qué toca después, qué hizo y qué está planificado**,
   *"sin perder información histórica. El plan futuro puede cambiar. El pasado
   NO debe cambiar."*

   ───────────────────────────────────────────────────────────────────────────
   1 · LA SEMANA DEL PLAN YA EXISTÍA DOS VECES, Y NO HAY UNA TERCERA
   ───────────────────────────────────────────────────────────────────────────

   El apartado 2 lo dice con todas las letras: *"La planificación debe
   derivarse de activePlan y su estructura de días. No crear una segunda
   planificación independiente."* Y ya había dos lecturas de la semana:

   - **`semanaDelPlan`** (FIT F6, `tuPlan.js`): qué día del plan cae cada día,
     con sus estados y su «Completado» (F8).
   - **`resumenDeActividad`** (FIT F31): qué entrenamientos hay cada día.

   🚨 **Esta librería no recorre ni un día por su cuenta**: pide la semana a
   `semanaDelPlan` —que se amplió para aceptar cualquier semana, los planes
   anteriores y lo realizado de cada día— y la sesiones a la puerta de la F31
   (`sesionesDeActividad`), que es la del Historial. Lo que añade es **la
   lectura**: los seis estados del apartado 31, los textos, la descripción
   accesible y la navegación entre semanas.

   ───────────────────────────────────────────────────────────────────────────
   2 · EL PASADO NO SE REESCRIBE (apartado 22), Y ESO SÍ HA NECESITADO UN DATO
   ───────────────────────────────────────────────────────────────────────────

   `fitness.planActivo` guarda **un** plan y desde cuándo. Con eso solo, cambiar
   de plan reescribía todas las semanas pasadas con el nuevo —justo lo que el
   apartado prohíbe—. Y el plan anterior **no se puede derivar** de nada: es un
   hecho que pasó. Así que al cambiarlo, `usarPlan` y `quitarPlanActivo`
   (F5, `planes.js`) apuntan en **`fitness.planesAnteriores`** el tramo que se
   cierra —qué plan, desde cuándo, hasta cuándo y la estructura de sus días—,
   que es la copia que este proyecto sí hace de lo que es historia (FIT F7 con
   el snapshot de una sesión, E3 F28 con las ejecuciones de una rutina).
   Está anotado como **C-39** en `docs/03`.

   ⚠️ Y **solo la estructura**: el nombre de cada día y si descansaba. Ni las
   líneas, ni los ejercicios —eso es lo que la sesión realizada ya congela (F7)—.

   ───────────────────────────────────────────────────────────────────────────
   3 · CÓMO SE RELACIONA UNA SESIÓN CON UN DÍA DEL PLAN (apartados 19 y 20)
   ───────────────────────────────────────────────────────────────────────────

   Por **identificadores**, nunca por el título (E3 F12): una sesión empezada
   desde un día del plan guarda `planId` y, en su `origen`, el id del día (F7);
   al guardarla, `diaDePlan` lo congela (F8). Coincide si es **el mismo plan y el
   mismo día** —o, cuando el plan es una plantilla suya, esa misma plantilla—.
   Una sesión de otra plantilla **conserva su origen** y sale como *«Otro
   entrenamiento realizado»*: ni se da por cumplido el plan ni se marca como
   fallido (apartados 17, 18 y 20). */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const objeto = (v) => (v && typeof v === 'object' ? v : {});

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LO QUE YA RESOLVÍAN OTRAS FASES (apartados 2, 28, 34 y 37)
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ Guarda **las funciones**, no sus nombres: renombrar una rompe la
   compilación y la prueba compara `es.name` con `nombre` (FIT F27). */
export const YA_LO_RESUELVE = [
  { nombre: 'semanaDelPlan', es: semanaDelPlan, fase: 'FIT F6', para: 'La semana del plan, ampliada a cualquier semana y a los planes anteriores (apartados 2, 14-16 y 22).' },
  { nombre: 'proximoEntrenamiento', es: proximoEntrenamiento, fase: 'FIT F6', para: 'El próximo entrenamiento, ampliado para buscar más allá de la semana (apartado 9).' },
  { nombre: 'sesionDelDia', es: sesionDelDia, fase: 'FIT F5 y F6', para: 'Los ejercicios de un día planificado (apartados 4 y 37).' },
  { nombre: 'sesionesDeActividad', es: sesionesDeActividad, fase: 'FIT F31', para: 'Qué sesiones cuentan: las del Historial, sin repetidas (apartado 34).' },
  { nombre: 'resumenDeActividad', es: resumenDeActividad, fase: 'FIT F31', para: 'Lo realizado frente a lo planificado de la semana en curso (apartado 34).' },
  { nombre: 'tarjetaDeSesion', es: tarjetaDeSesion, fase: 'FIT F31', para: 'La ficha de cada sesión realizada: hora, duración, parcial o completa.' },
  { nombre: 'diaDePlanDe', es: diaDePlanDe, fase: 'FIT F8', para: 'Qué día del plan dice la sesión que completó (apartado 19).' },
  { nombre: 'distribucionMuscular', es: distribucionMuscular, fase: 'FIT F3', para: 'Los músculos principales, sin otra fórmula (apartado 28).' },
  { nombre: 'duracionEstimada', es: duracionEstimada, fase: 'FIT F3', para: 'La duración estimada, que no se inventa (apartado 26).' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LOS ESTADOS DE UN DÍA (apartados 5, 6, 7, 16, 17, 31 y 32)
   ═══════════════════════════════════════════════════════════════════════════

   Los seis del apartado 31, **con sus ids en inglés** porque así los nombra el
   enunciado y así los busca quien los lea, y con las palabras en español que
   se enseñan. 🚨 Ninguno es negativo: un día planificado que pasó sin registro
   **dice «Planificado»** (apartado 7: *"No marcarlo como fracaso"*) y debajo,
   *«Sin entrenamiento registrado»* — que no es lo mismo que no entrenó
   (apartado 16). */
export const ESTADOS_PLANIFICACION = [
  { id: 'planned', nombre: 'Planificado', simbolo: '○', que: 'El plan tiene entrenamiento ese día y todavía no hay ninguno guardado.' },
  { id: 'completed', nombre: 'Completado', simbolo: '✓', que: 'El plan tenía entrenamiento ese día y hay uno guardado.' },
  { id: 'planned_not_completed', nombre: 'Planificado', simbolo: '○', que: 'Un día que ya pasó, con entrenamiento en el plan y ninguno guardado. No es un fallo: puede que no lo registrara.' },
  { id: 'unplanned', nombre: 'Sin entrenamiento planificado', simbolo: '—', que: 'El plan no tiene entrenamiento ese día. No se afirma que descansara: puede haber entrenamiento libre (apartado 5).' },
  { id: 'completed_extra', nombre: 'Entrenamiento extra', simbolo: '+', que: 'Hay un entrenamiento guardado un día sin sesión planificada. No es negativo (apartado 32).' },
  { id: 'unknown', nombre: 'Sin datos del plan', simbolo: '·', que: 'No se sabe qué plan había ese día, así que no se afirma nada de él (apartado 31: «No inventar»).' },
];
export const estadoPlanificacion = (id) => ESTADOS_PLANIFICACION.find((e) => e.id === id) || null;

export const TEXTO_OTRO = 'Otro entrenamiento realizado';
export const TEXTO_REALIZADO = 'Entrenamiento realizado';
export const TEXTO_SIN_REGISTRO = 'Sin entrenamiento registrado';
export const TEXTO_SIN_DURACION = 'Duración no disponible';
export const PLAN_INVALIDO = {
  titulo: 'Este plan no tiene una planificación válida.',
  texto: 'No tiene ningún día con ejercicios, así que no se puede repartir la semana.',
  editar: 'Editar plan',
};

/* ═══════════════════════════════════════════════════════════════════════════
   5b · QUÉ DÍA DEL PLAN DICE UNA SESIÓN QUE HIZO (apartados 17-20)
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ **No es `relacionConPlan` de la F10**, y no la duplica: aquélla contesta
   *«¿de qué plan salió?»* —el activo, otro o ninguno— para el filtro del
   Historial; ésta, *«¿es el entrenamiento que el plan tenía ESE día?»*. Son dos
   preguntas, y las dos leen los mismos campos: `planId` y el `origen` de la F7,
   o el `diaDePlan` que la F8 congela al guardar. */

/** El enlace de una sesión con un día del plan, o `null` si no lo tiene. */
export function enlaceDeSesion(sesion) {
  const g = sesion && sesion.diaDePlan;
  if (g && typeof g === 'object' && texto(g.planId)) {
    return { planId: texto(g.planId), diaId: texto(g.diaId), tipo: texto(g.tipo) };
  }
  const d = diaDePlanDe(sesion);
  return d && texto(d.planId) ? { planId: texto(d.planId), diaId: texto(d.diaId), tipo: texto(d.tipo) } : null;
}

/** `coincide`, `otro` o `desconocida` (apartados 17-20). 🚨 Por ids, nunca por
 *  el nombre (E3 F12): «Push» de otra plantilla no es el Push del plan. */
export function relacionConElDia(sesion, planificado) {
  const e = enlaceDeSesion(sesion);
  if (!e) return 'desconocida';
  const p = planificado || null;
  if (!p || p.descanso || p.sinPlan || !p.planId) return 'otro';
  if (e.planId !== p.planId) return 'otro';
  if (e.diaId && e.diaId === p.diaId) return 'coincide';
  /* Con una plantilla suya como plan, empezarla desde «Tus plantillas» es el
     mismo entrenamiento: el plan ES esa plantilla (F6, apartado 18). */
  if (p.origen === 'plantilla' && e.diaId === p.planId) return 'coincide';
  /* ⚠️ Mismo plan y un día que ese plan no tiene: es un id de antes de la F32,
     cuando los días de un preset nacían aleatorios en cada carga. No se sabe
     qué día fue, y decir «otro» sería afirmar que no era éste. */
  if (lista(p.idsDelPlan).length && !lista(p.idsDelPlan).includes(e.diaId)) return 'desconocida';
  return 'otro';
}

/** El estado de un día, a partir de lo que dice el plan y lo que hay guardado.
 *  ⚠️ Sin información del plan es `unknown` **aunque haya entrenado**: que
 *  entrenara se sabe y se enseña, pero decir si era extra o del plan sería
 *  inventarse qué plan había (apartado 31). */
export function estadoDeCasilla(casilla, { hoy = todayISO(), relacion = null } = {}) {
  const c = objeto(casilla);
  const p = c.planificado;
  const hechas = lista(c.realizadas).length > 0;
  if (!p) return 'unknown';
  if (p.sinPlan || p.descanso) return hechas ? 'completed_extra' : 'unplanned';
  /* Una plantilla como plan no tiene días fijos (F31, apartado 13): hecha, es
     `completed`; si no, **no se sabe** si tocaba — ni planificado ni extra. */
  if (p.libre) return hechas && relacion === 'coincide' ? 'completed' : 'unknown';
  if (hechas) return 'completed';
  return c.fecha < hoy ? 'planned_not_completed' : 'planned';
}

export const TEXTO_SIN_DIA_FIJO = 'Sin día fijo';

/* ═══════════════════════════════════════════════════════════════════════════
   6 · CADA DÍA, LISTO PARA PINTAR (apartados 3-8, 12, 17, 18, 21 y 39)
   ═══════════════════════════════════════════════════════════════════════════ */

const nombresJuntos = (ns) => (ns.length > 1 ? `${ns.slice(0, -1).join(', ')} y ${ns[ns.length - 1]}` : ns[0] || '');

/** El día de un plan con lo que enseña el apartado 4 —nombre, ejercicios,
 *  duración y músculos—, **solo si es del plan activo**: de un plan anterior
 *  se conserva el nombre del día y nada más (§2). */
function planificadoParaPintar(p, { plan, propios }) {
  if (!p) return null;
  const base = {
    nombre: p.nombre, descanso: !!p.descanso, sinPlan: !!p.sinPlan, libre: !!p.libre, diaId: p.diaId || '',
    planId: p.planId || '', origen: p.origen || '', planNombre: p.planNombre || '', anterior: !!p.anterior,
    idsDelPlan: lista(p.idsDelPlan),
    indice: p.indice ?? null,
  };
  if (p.descanso || p.sinPlan || p.indice === null || p.indice === undefined || !plan) return base;
  const dia = lista(plan.dias)[p.indice];
  const lineas = lista(dia?.lineas);
  const dist = distribucionMuscular({ lineas }, propios);
  const dur = duracionEstimada({ lineas }, propios).texto;
  return {
    ...base,
    /* Apartado 27 — el número real de ejercicios de ese día. */
    ejercicios: lineas.length,
    /* Apartado 26 — si no se puede estimar, se dice. Nunca un número inventado. */
    duracion: dur || TEXTO_SIN_DURACION,
    /* Apartado 28 — los principales, de la distribución de la F3. */
    musculos: dist.grupos.slice(0, 3).map((g) => g.nombre),
  };
}

/** *"Viernes 12 de septiembre. Push. Planificado y completado."* (apartado 39).
 *  ⚠️ Empieza SIEMPRE por el nombre del día —el «hoy» va entre paréntesis—, así
 *  que quien busque un día por su nombre lo encuentra igual. */
function descripcionDelDia(d) {
  const cabeza = `${d.nombreDia} ${diaYMes(d.fecha)}${d.esHoy ? ' (hoy)' : ''}.`;
  const p = d.planificado;
  const hechas = d.realizadas.map((r) => r.nombre);
  const hechasTexto = hechas.length > 1 ? `${hechas.length} entrenamientos: ${nombresJuntos(hechas)}` : hechas[0] || '';
  switch (d.estado) {
    case 'completed':
      if (d.relacion === 'coincide') {
        return hechas.length > 1
          ? `${cabeza} ${p.nombre}. Planificado y completado. ${hechasTexto}.`
          : `${cabeza} ${p.nombre}. Planificado y completado.`;
      }
      if (d.relacion === 'otro') return `${cabeza} Planificado: ${p.nombre}. Realizado: ${nombresJuntos(hechas)}.`;
      return `${cabeza} ${p.nombre}. Planificado. ${TEXTO_REALIZADO}: ${nombresJuntos(hechas)}.`;
    case 'planned':
      return `${cabeza} ${p.nombre}. Planificado.`;
    case 'planned_not_completed':
      return `${cabeza} ${p.nombre}. Planificado. ${TEXTO_SIN_REGISTRO}.`;
    case 'unplanned':
      return `${cabeza} Sin entrenamiento planificado.`;
    case 'completed_extra':
      return `${cabeza} Sin entrenamiento planificado. Entrenamiento extra: ${hechasTexto}.`;
    default: {
      /* Una plantilla como plan: se dice cuál es y que no tiene día. */
      const que = p && p.libre ? `${p.nombre}, ${TEXTO_SIN_DIA_FIJO.toLowerCase()}.` : 'Sin datos del plan.';
      if (hechas.length) return `${cabeza} ${que} ${TEXTO_REALIZADO}: ${hechasTexto}.`;
      return d.futuro ? `${cabeza} ${que}` : `${cabeza} ${que} ${TEXTO_SIN_REGISTRO}.`;
    }
  }
}

/** Un día de la semana, ya interpretado. Recibe la casilla de `semanaDelPlan`. */
export function diaDePlanificacion(casilla, {
  hoy = todayISO(), fitness = {}, plan = null, propios = [], planes = CATALOGO_PLANES,
} = {}) {
  const c = objeto(casilla);
  const planificado = planificadoParaPintar(c.planificado, { plan, propios });
  /* Apartado 21 — dos sesiones el mismo día se enseñan las dos, en el orden en
     que las hizo. Cada una con su relación con el plan (apartados 17-20). */
  const realizadas = lista(c.realizadas).map((s) => {
    const ficha = tarjetaDeSesion(s, { fitness, planes, hoy });
    return {
      id: s.id,
      nombre: texto(s.nombre) || 'Entrenamiento',
      relacion: relacionConElDia(s, c.planificado),
      hora: ficha?.hora || '',
      duracion: ficha?.duracion || '',
      estadoSesion: ficha?.estado || '',
    };
  });
  const relaciones = realizadas.map((r) => r.relacion);
  const relacion = !realizadas.length ? null
    : (relaciones.includes('coincide') ? 'coincide' : (relaciones.includes('otro') ? 'otro' : 'desconocida'));
  const estado = estadoDeCasilla(c, { hoy, relacion });
  const e = estadoPlanificacion(estado);

  let principal;
  let detalle = '';
  if (estado === 'completed') {
    principal = relacion === 'coincide' ? `${e.simbolo} ${e.nombre}` : (relacion === 'otro' ? TEXTO_OTRO : TEXTO_REALIZADO);
    /* Apartado 18 — el plan no se reescribe: se dice qué tocaba y qué hizo. */
    if (relacion !== 'coincide') detalle = `Planificado: ${planificado.nombre}`;
  } else if (estado === 'planned_not_completed') {
    principal = e.nombre;
    detalle = TEXTO_SIN_REGISTRO;
  } else if (estado === 'unknown') {
    const libre = !!planificado && planificado.libre;
    principal = realizadas.length ? TEXTO_REALIZADO
      : (c.fecha <= hoy ? TEXTO_SIN_REGISTRO : (libre ? TEXTO_SIN_DIA_FIJO : e.nombre));
  } else {
    principal = e.nombre;
  }

  const dia = diaDeFecha(c.fecha);
  const d = {
    fecha: c.fecha,
    dia,
    corto: DIAS_SEMANA[dia - 1]?.corto || '',
    nombreDia: DIAS_SEMANA[dia - 1]?.label || '',
    numero: Number(String(c.fecha).slice(8, 10)),
    esHoy: c.fecha === hoy,
    pasado: c.fecha < hoy,
    futuro: c.fecha > hoy,
    estado,
    estadoNombre: e.nombre,
    /* ⚠️ Con otro entrenamiento, el ✓ junto al nombre del plan diría que hizo
       ése (apartado 18): se marca como entrenamiento, con el ● de la F31. */
    simbolo: estado === 'completed' && relacion !== 'coincide' ? '●' : e.simbolo,
    principal,
    detalle,
    planificado,
    realizadas,
    relacion,
  };
  /* Lo que se puede hacer desde ese día (apartados 4, 11, 12, 13 y 37).
     ⚠️ Solo del plan ACTIVO se puede ver o empezar la rutina: de un plan
     anterior se guardó el nombre de cada día, no sus ejercicios (§2). */
  const delPlanActivo = !!planificado && !planificado.descanso && !planificado.sinPlan
    && planificado.indice !== null && !planificado.anterior;
  d.acciones = {
    verRutina: delPlanActivo,
    empezar: delPlanActivo && relacion !== 'coincide',
    /* Apartado 12 — ya hecho: «Ver entrenamiento» lleva a la sesión real, y
       «Repetir» crea otra desde el plan sin tocar la anterior (apartado 13). */
    repetir: delPlanActivo && relacion === 'coincide',
    verSesiones: realizadas.length > 0,
  };
  d.descripcion = descripcionDelDia(d);
  return d;
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LA SEMANA, CUALQUIER SEMANA (apartados 3, 14, 15, 16 y 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Hasta dónde se deja ir hacia delante. ⚠️ El plan futuro se puede derivar
 *  sin fin —es la misma semana repetida—, pero pasado un mes ya no dice nada
 *  nuevo y *"el plan futuro puede cambiar"* (criterio de finalización). */
export const SEMANAS_HACIA_DELANTE = 4;

function rangoDeSemana(lunes, hoy) {
  const domingo = addDays(lunes, 6);
  const [a1, m1, d1] = lunes.split('-').map(Number);
  const [a2, m2, d2] = domingo.split('-').map(Number);
  const anioHoy = Number(hoy.slice(0, 4));
  if (a1 !== a2) return `${d1} de ${MESES[m1 - 1]} de ${a1} al ${d2} de ${MESES[m2 - 1]} de ${a2}`;
  const anio = a1 !== anioHoy ? ` de ${a1}` : '';
  if (m1 !== m2) return `${d1} de ${MESES[m1 - 1]} al ${d2} de ${MESES[m2 - 1]}${anio}`;
  return `${d1} al ${d2} de ${MESES[m1 - 1]}${anio}`;
}

function tituloDeSemana(desplazamiento, rango) {
  if (desplazamiento === 0) return 'Esta semana';
  if (desplazamiento === -1) return 'Semana pasada';
  if (desplazamiento === 1) return 'Próxima semana';
  return `Semana del ${rango}`;
}

/** Lo que `semanaDelPlan` necesita del almacén, resuelto una vez. */
function contexto(fitness, planes) {
  const f = objeto(fitness);
  const r = planActivoCompleto(f, planes);
  return {
    f,
    r,
    propios: lista(f.ejercicios),
    anteriores: planesAnterioresDe(f),
    sesiones: sesionesDeActividad(f).filter(conFecha),
  };
}

/**
 * **getWeekPlan(date, activePlan)** del apartado 30 — la semana que contiene
 * `fecha`, de lunes a domingo, con lo planificado y lo realizado de cada día.
 * ⚠️ Recibe el `fitness` entero y no solo el plan activo: el pasado se lee con
 * los planes que había entonces (apartado 22), y eso no está en `activePlan`.
 */
export function getWeekPlan(fecha, fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const ctx = contexto(fitness, planes);
  const lunesHoy = lunesDe(hoy);
  const lunes = lunesDe(fechaValida(texto(fecha)) ? texto(fecha) : hoy) || lunesHoy;
  const desplazamiento = Math.round((new Date(`${lunes}T00:00:00`) - new Date(`${lunesHoy}T00:00:00`)) / (7 * 86400000));
  const rango = rangoDeSemana(lunes, hoy);
  const base = {
    lunes,
    domingo: addDays(lunes, 6),
    desplazamiento,
    esActual: desplazamiento === 0,
    pasada: desplazamiento < 0,
    futura: desplazamiento > 0,
    titulo: tituloDeSemana(desplazamiento, rango),
    rango,
    anterior: addDays(lunes, -7),
    siguiente: addDays(lunes, 7),
  };

  if (!ctx.r) return { ...base, estado: 'sin_plan', dias: [], hayAnterior: false, haySiguiente: false };
  if (ctx.r.perdido || !ctx.r.plan) return { ...base, estado: 'perdido', dias: [], hayAnterior: false, haySiguiente: false };
  /* Apartado 23 — un plan corrupto o vacío no rompe Tu Plan: se dice. */
  if (!planValido(ctx.r.plan)) {
    return { ...base, estado: 'invalido', origen: ctx.r.origen, dias: [], hayAnterior: false, haySiguiente: false };
  }

  const casillas = semanaDelPlan(ctx.r.plan, {
    hoy,
    lunes,
    desde: texto(ctx.r.activo.desde),
    propios: ctx.propios,
    sesiones: ctx.sesiones,
    anteriores: ctx.anteriores,
    planId: ctx.r.activo.planId,
    origen: ctx.r.origen,
  });
  /* Sin fecha de activación, un plan que no es de siete días no se reparte
     (F6, apartado 16). Se dice, no se dibuja una semana inventada. */
  if (!casillas.length) return { ...base, estado: 'sin_semana', dias: [], hayAnterior: false, haySiguiente: false };

  const dias = casillas.map((c) => diaDePlanificacion(c, {
    hoy, fitness: ctx.f, plan: ctx.r.plan, propios: ctx.propios, planes,
  }));

  /* ← Hasta la primera semana con algo que enseñar: antes no hay ni plan
     conocido ni sesiones, y siete «Sin datos del plan» no dicen nada. */
  const primeras = [
    ...[texto(ctx.r.activo.desde), ...ctx.anteriores.map((a) => a.desde)].filter(fechaValida),
    ctx.sesiones.reduce((m, s) => (!m || s.fecha < m ? s.fecha : m), ''),
  ].filter(Boolean).sort();
  const primera = primeras[0] || lunesHoy;
  const hayAnterior = lunes > (lunesDe(primera) || lunesHoy);

  /* Apartado 22 — si en esta semana cambió de plan, se dice cuál había cada día. */
  const planesDeLaSemana = [...new Set(dias.map((d) => d.planificado?.planNombre).filter(Boolean))];
  const aviso = planesDeLaSemana.length > 1
    ? `Esta semana cambiaste de plan: ${planesDeLaSemana.map((n) => `«${n}»`).join(' y después ')}.`
    : '';

  return {
    ...base,
    estado: 'ok',
    dias,
    hayAnterior,
    haySiguiente: desplazamiento < SEMANAS_HACIA_DELANTE,
    aviso,
    /* Solo en el pasado y el presente hay algo realizado que contar. */
    realizados: dias.reduce((n, d) => n + d.realizadas.length, 0),
  };
}

/** **getPlannedWorkoutForDay(date, activePlan)** — lo que el plan tenía ese día,
 *  con sus ejercicios si es del plan activo. `null` si no se sabe. */
export function getPlannedWorkoutForDay(fecha, fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const semana = getWeekPlan(fecha, fitness, { hoy, planes });
  const d = semana.dias.find((x) => x.fecha === fecha);
  if (!d || !d.planificado) return null;
  const p = d.planificado;
  if (p.descanso || p.sinPlan || p.indice === null) return p;
  const r = planActivoCompleto(objeto(fitness), planes);
  const sesion = r && r.plan ? sesionDelDia(r.plan, p.indice, lista(objeto(fitness).ejercicios)) : null;
  return { ...p, sesion };
}

/** **getDayTrainingStatus(date, activePlan, sessions)** — el estado de un día. */
export function getDayTrainingStatus(fecha, fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const semana = getWeekPlan(fecha, fitness, { hoy, planes });
  const d = semana.dias.find((x) => x.fecha === fecha);
  return d || null;
}

/** **getNextPlannedWorkout(date, activePlan)** — el de hoy si sigue pendiente;
 *  si no, el siguiente día planificado, **aunque sea la semana que viene**
 *  (apartado 9). Es `proximoEntrenamiento` de la F6, ampliada. */
export function getNextPlannedWorkout(fecha, fitness, { planes = CATALOGO_PLANES } = {}) {
  const hoy = fechaValida(texto(fecha)) ? texto(fecha) : todayISO();
  const v = tuPlan(objeto(fitness), { hoy, planes });
  if (v.estado !== 'activo' || !v.proximo) return null;
  return { ...v.proximo, estado: 'Planificado' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · HOY (apartados 10, 12 y 35)
   ═══════════════════════════════════════════════════════════════════════════

   Lo que Tu Plan enseña arriba: **qué toca hoy** y **qué toca después**. Si el
   de hoy sigue pendiente, la tarjeta del próximo ya es la de hoy; si no —hecho,
   extra o sin nada en el plan—, hoy se enseña aparte y el próximo debajo. */
export function planificacionDeTuPlan(fitness, { hoy = todayISO(), planes = CATALOGO_PLANES, semana = null } = {}) {
  const semanaActual = getWeekPlan(hoy, fitness, { hoy, planes });
  const vista = semana && semana !== semanaActual.lunes ? getWeekPlan(semana, fitness, { hoy, planes }) : semanaActual;
  const diaHoy = semanaActual.dias.find((d) => d.esHoy) || null;
  const proximo = semanaActual.estado === 'ok' ? getNextPlannedWorkout(hoy, fitness, { planes }) : null;
  const hoyEsElProximo = !!proximo && proximo.esHoy;
  return {
    estado: semanaActual.estado,
    semana: vista,
    hoy: diaHoy,
    /* ⚠️ Un día sin nada en el plan y sin entrenar no dice «Descanso»
       (apartado 5): lo dice `DESCANSO_HOY`, que es de la F6 y dice ahora
       *«Hoy no hay entrenamiento planificado»*. */
    hoyAparte: !!diaHoy && !hoyEsElProximo,
    textoHoy: diaHoy && diaHoy.estado === 'unplanned' ? DESCANSO_HOY : null,
    proximo,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LO QUE NO SE CONSTRUYE, Y LO QUE SE DECIDIÓ
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT32 = [
  { que: 'Un calendario global, IA, recomendaciones, predicciones, penalizaciones, puntuación de adherencia, XP, gamificación o rachas nuevas', porque: 'Apartado 42, literal. La planificación es descriptiva.' },
  { que: 'Crear sesiones al navegar a una semana futura', porque: 'Apartados 14 y 15: se enseña el plan; una sesión nace solo al pulsar «Empezar entrenamiento».' },
  { que: 'El filtro Todos / Planificados / Completados / Extras', porque: 'Apartado 33, «opcionalmente» y «no añadir demasiados filtros»: en una semana de siete casillas, esconder días rompería la semana en vez de aclararla. Cada día ya dice su estado con palabras.' },
  { que: 'Ver los ejercicios de un día de un plan anterior', porque: 'De un plan que ya no está activo se guardó el nombre de cada día y si descansaba (§2), no sus ejercicios: lo que hizo de verdad lo guarda la sesión (F7).' },
  { que: 'Una semana de más de un mes hacia delante', porque: 'El plan futuro es la misma semana repetida, y el criterio de finalización avisa de que puede cambiar.' },
];

export const DECISIONES_FIT32 = [
  { que: 'Las cuatro funciones del apartado 30 reciben el `fitness`, no el `activePlan`', porque: 'El pasado se lee con los planes de entonces (apartado 22), y eso no está en el plan activo. El enunciado pide «funciones equivalentes».' },
  { que: '«Descanso» pasa a «Sin entrenamiento planificado» en la F6 y en la F31', porque: 'Apartado 5: «No afirmar "Descanso" porque puede haber entrenamiento libre». Los ids (`descanso`) no cambian: son la forma del dato.' },
  { que: 'Un entrenamiento distinto del planificado es `completed` con «Otro entrenamiento realizado»', porque: 'Apartados 17 y 18: entrenó ese día —no es un fallo— y se conservan los dos nombres. Decir «Completado» a secas afirmaría que hizo el del plan.' },
  { que: 'La relación sesión–día es nueva y no sustituye a `relacionConPlan` (F10)', porque: 'Aquélla dice de qué plan salió una sesión, para el filtro del Historial; ésta si era el entrenamiento que el plan tenía ese día. Leen los mismos campos (`planId`, `origen`, `diaDePlan`).' },
  { que: 'Una sesión sin ningún enlace al plan dice «Entrenamiento realizado»', porque: 'Apartado 20: no se asume que pertenece al plan activo. Toda sesión empezada en la aplicación lleva su origen desde la F7; esto es para lo guardado sin él.' },
  { que: 'Una plantilla suya como plan no tiene días fijos: sus días son `unknown` («Sin día fijo») salvo cuando la hace', porque: 'La F6 la ofrece cada día porque se puede hacer cualquiera, pero la F31 se negó a contarla como «siete planificadas» (su apartado 13). Llamar «Planificado» a cada día y «sin registro» a los que no la hizo sería inventarle un compromiso diario (apartado 31: «No inventar»).' },
  { que: 'Sin información del plan de un día, el estado es `unknown`', porque: 'Apartado 31. Antes del primer plan apuntado no se sabe si había otro: se enseña lo que hizo y no se dice si era extra.' },
  { que: 'Los planes anteriores se apuntan al cambiar de plan (C-39)', porque: 'Apartado 22: no se pueden derivar, y sin ellos cambiar de plan reescribía el pasado.' },
  { que: 'El próximo entrenamiento busca más allá de la semana', porque: 'Apartado 9. La F6 devolvía `null` el domingo para no adivinar el ciclo, pero el ciclo no se adivina: un plan de siete días ES la semana y cualquier otro cicla desde su fecha de activación.' },
  { que: '«Empezar entrenamiento» sigue en cualquier día del plan activo, y «Repetir» en uno ya hecho', porque: 'Apartados 11-13. Las dos crean una sesión NUEVA con `empezarSesion` (F7): ni tocan la anterior ni el plan.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   10 · LA AUDITORÍA
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ El tercer argumento es para poder ponerla ROJA (EH F42 y FIT F31): una
   auditoría que calcula su propia entrada no puede fallar nunca. */
export function auditarPlanificacion(fitness, opciones = {}, semana = null) {
  const hoy = opciones.hoy || todayISO();
  const s = semana || getWeekPlan(hoy, fitness, opciones);
  const ids = new Set(sesionesDeActividad(objeto(fitness)).map((x) => x.id));
  const ok = s.estado !== 'ok' ? true : null;
  const casillas = [
    { id: 'siete_dias', texto: 'Siete días, de lunes a domingo', ok: ok ?? (s.dias.length === 7 && s.dias[0].dia === 1) },
    { id: 'estados', texto: 'Cada día tiene uno de los seis estados', ok: ok ?? s.dias.every((d) => !!estadoPlanificacion(d.estado)) },
    { id: 'sin_descanso', texto: 'Ningún día afirma «Descanso»', ok: ok ?? s.dias.every((d) => !/\bdescanso\b/i.test(`${d.principal} ${d.descripcion}`)) },
    { id: 'historial', texto: 'Toda sesión realizada está en el Historial', ok: ok ?? s.dias.every((d) => d.realizadas.every((r) => ids.has(r.id))) },
    { id: 'sin_puntuacion', texto: 'Ni un porcentaje ni una puntuación', ok: ok ?? !/%/.test(JSON.stringify(s.dias.map((d) => [d.principal, d.detalle, d.descripcion]))) },
    { id: 'descripcion', texto: 'Cada día tiene una descripción completa que empieza por su nombre', ok: ok ?? s.dias.every((d) => d.descripcion.startsWith(d.nombreDia)) },
    { id: 'uno_hoy', texto: 'En la semana en curso, un solo día es hoy', ok: ok ?? (!s.esActual || s.dias.filter((d) => d.esHoy).length === 1) },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}

export default getWeekPlan;
