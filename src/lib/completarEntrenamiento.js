/* «Completar entrenamiento» — apuntar un entrenamiento que ya hizo fuera de la aplicación
   ═══════════════════════════════════════════════════════════════════════════

   Al lado de «Empezar entrenamiento» está «Completar entrenamiento»: para cuando entrenó por su cuenta
   (o se le olvidó abrir la aplicación) y quiere que cuente, hoy o en el día en que lo hizo.

   🚨 **Registra que lo hizo, no cómo lo hizo.** La sesión se guarda completada, en su fecha real, con su
   nombre y de dónde sale (el día del plan o la plantilla), y SIN copia de ejercicios ni series: ni una
   repetición, un peso, un tiempo ni una marca inventados. Por eso no la lee como rendimiento nadie que
   mire series —progreso, récords, rangos, volumen, «ejercicios recientes»—, y sí la cuenta todo lo que
   cuenta entrenamientos completados: el historial, la actividad de Progreso, la semana de Tu Plan y los
   días con entrenamiento. `registradaAMano` es lo que la distingue de una sesión con datos registrados.

   🚨 **No es un segundo sistema**: es una sesión de `fitness.sesiones`, construida con
   `crearWorkoutSession` y guardada con `guardarSesion` (que sustituye por id, F7), igual que las demás.
   Las rachas siguen su regla de siempre: la de entrenamiento se marca en Rachas (o en Hoy) y Fitness solo
   la lee, así que guardar una sesión —en vivo o a mano— no la toca (`rachaDeFitness`).

   🚨 **Ni fechas futuras ni duplicados por repetir el toque**: con una completada del MISMO entrenamiento
   (mismo plan y mismo día del plan, o la misma plantilla) en esa fecha, o uno empezado sin terminar, no se
   guarda otra. Dos entrenamientos DISTINTOS el mismo día sí se pueden registrar. */

import { todayISO, fechaValida, addDays } from './helpers';
import { crearWorkoutSession } from './fitness';
import { planActivoCompleto, sesionDelDia } from './tuPlan';
import { planARutina } from './constructor';
import { guardarSesion } from './entrenamiento';
import { diaDePlanDe } from './finalizacion';
import { diaYMes } from './fechasFitness';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (x) => (typeof x === 'string' ? x.trim() : '');

export const TEXTOS_COMPLETAR = Object.freeze({
  boton: 'Completar entrenamiento',
  titulo: 'Completar entrenamiento',
  subtitulo: 'Para un entrenamiento que ya has hecho fuera de la aplicación.',
  elegir: '¿Qué entrenamiento hiciste?',
  fecha: '¿Qué día?',
  continuar: 'Continuar',
  confirmar: 'Completar entrenamiento',
  cancelar: 'Cancelar',
  volver: 'Volver',
  hecho: 'Hecho',
  sinDetalles: 'Se guarda como hecho, sin series, pesos ni tiempos: no se inventa nada que no hayas apuntado.',
  vacioTitulo: 'No tienes entrenamientos para elegir',
  vacioTexto: 'Activa un plan o crea una plantilla en Entrenamiento, y podrás completar sus entrenamientos.',
  guardado: 'Entrenamiento registrado',
});

/* La etiqueta del día elegido, para leerla: «hoy», «ayer» o «el 19 de octubre». */
export function etiquetaDelDia(fecha, hoy = todayISO()) {
  if (!fechaValida(fecha)) return '';
  if (fecha === hoy) return 'hoy';
  return fecha === addDays(hoy, -1) ? 'ayer' : `el ${diaYMes(fecha)}`;
}

/* Qué entrenamiento es, para no contarlo dos veces: el mismo plan y el mismo día del plan, o la misma
   plantilla. Es el enlace que ya lee Tu Plan (`diaDePlanDe`): por ids, nunca por el nombre (E3 F12). */
const claveDeOrigen = (planId, origenId) => `${texto(planId)}|${texto(origenId)}`;
export function claveDeSesion(sesion) {
  const o = sesion && sesion.origen;
  if (!sesion || !o || !texto(o.id)) return null;
  return claveDeOrigen(sesion.planId, o.id);
}

/**
 * Los entrenamientos que se pueden completar: los días con entrenamiento del plan activo y sus
 * plantillas con ejercicios. Son los mismos que se pueden EMPEZAR (FitnessView: `empezarDelPlan` y
 * `empezarDePlantilla`), con los mismos ids, así que una sesión completada a mano marca el día de Tu Plan
 * igual que una en vivo. Sin plan ni plantillas, una lista vacía (la hoja lo dice y deja volver).
 */
export function opcionesParaCompletar(fitness, { propios = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const mios = propios || lista(f.ejercicios);
  const opciones = [];
  const resuelto = planActivoCompleto(f);
  if (resuelto && resuelto.plan && !resuelto.perdido) {
    lista(resuelto.plan.dias).forEach((_, indice) => {
      const ficha = sesionDelDia(resuelto.plan, indice, mios);
      if (!ficha || ficha.descanso || !texto(ficha.id)) return;
      opciones.push({
        clave: claveDeOrigen(resuelto.activo.planId, ficha.id),
        nombre: texto(ficha.nombre) || 'Entrenamiento',
        detalle: `${texto(resuelto.plan.nombre) || 'Tu plan'} · Día ${indice + 1}`,
        planId: resuelto.activo.planId,
        origenTipo: resuelto.origen,
        origenId: ficha.id,
        entorno: texto(resuelto.plan.entorno),
        indiceDelPlan: indice,
      });
    });
  }
  lista(f.plantillas).forEach((p) => {
    if (!p || !texto(p.id)) return;
    const rutina = planARutina(p);
    if (!rutina || !lista(rutina.lineas).length) return;
    const clave = claveDeOrigen(p.id, p.id);
    if (opciones.some((o) => o.clave === clave)) return;
    opciones.push({
      clave,
      nombre: texto(p.nombre) || 'Entrenamiento',
      detalle: 'Tu plantilla',
      planId: p.id,
      origenTipo: 'plantilla',
      origenId: p.id,
      entorno: texto(p.entorno),
      indiceDelPlan: null,
    });
  });
  return opciones;
}

/** La opción que corresponde a un día del plan o a una plantilla (para preseleccionarla). */
export function opcionPreseleccionada(opciones, { indiceDelPlan = null, plantillaId = null } = {}) {
  const l = lista(opciones);
  if (indiceDelPlan !== null && indiceDelPlan !== undefined) return l.find((o) => o.indiceDelPlan === indiceDelPlan) || null;
  if (plantillaId) return l.find((o) => o.origenTipo === 'plantilla' && o.origenId === plantillaId && o.indiceDelPlan === null) || l.find((o) => o.origenId === plantillaId) || null;
  return null;
}

/**
 * Comprueba si se puede registrar, sin escribir nada: la opción existe, la fecha es válida y no futura,
 * y no está ya registrada (ni empezada) ese día. Devuelve `{ ok, motivo, mensaje }`.
 */
export function comprobarCompletar(fitness, { opcion = null, fecha = '', hoy = todayISO() } = {}) {
  if (!opcion || !texto(opcion.origenId)) return { ok: false, motivo: 'sin_entrenamiento', mensaje: 'Elige qué entrenamiento hiciste.' };
  if (!fechaValida(fecha)) return { ok: false, motivo: 'fecha_invalida', mensaje: 'Elige un día que exista.' };
  if (fecha > hoy) return { ok: false, motivo: 'fecha_futura', mensaje: 'Ese día todavía no ha llegado: solo puedes completar entrenamientos de hoy o de días pasados.' };
  const clave = claveDeOrigen(opcion.planId, opcion.origenId);
  const mismos = lista((fitness || {}).sesiones).filter((s) => s && s.fecha === fecha && claveDeSesion(s) === clave);
  const dia = etiquetaDelDia(fecha, hoy);
  if (mismos.some((s) => s.estado === 'completada')) {
    return { ok: false, motivo: 'duplicado', mensaje: `«${opcion.nombre}» ya está completado ${dia}. No se registra otra vez.` };
  }
  if (mismos.some((s) => s.estado === 'en_curso' || s.estado === 'finalizando')) {
    return { ok: false, motivo: 'empezado', mensaje: `Tienes «${opcion.nombre}» empezado ${dia}. Termínalo o descártalo antes de completarlo a mano.` };
  }
  return { ok: true, motivo: null, mensaje: null };
}

/**
 * Registra el entrenamiento como hecho. Devuelve `{ ok, motivo, mensaje, fitness, sesion }`; sin `ok` no
 * cambia nada (el `fitness` que vuelve es el mismo). La sesión: completada, en `fecha`, sin series
 * (`origen.ejercicios` vacío), sin duración (no se sabe cuánto duró), y marcada `registradaAMano`.
 */
export function registrarEntrenamientoHecho(fitness, { opcion = null, fecha = '', hoy = todayISO(), ahora = Date.now() } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const c = comprobarCompletar(f, { opcion, fecha, hoy });
  if (!c.ok) return { ...c, fitness: f, sesion: null };
  const base = crearWorkoutSession({
    planId: opcion.planId || null,
    nombre: opcion.nombre,
    fecha,
    estado: 'completada',
    origen: { tipo: texto(opcion.origenTipo) || 'plan', id: texto(opcion.origenId), ejercicios: [] },
    guardadaEn: ahora,
    entorno: opcion.entorno || '',
    registradaAMano: true,
  });
  const sesion = { ...base, diaDePlan: diaDePlanDe(base) };
  return { ok: true, motivo: null, mensaje: null, fitness: guardarSesion(f, sesion), sesion };
}
