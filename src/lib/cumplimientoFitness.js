/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 4/8 — EL MOTOR DE CUMPLIMIENTO, DESCANSOS Y RECUPERACIÓN
   ═══════════════════════════════════════════════════════════════════════════

   Una sola fuente de verdad (prompt 4 §11 y §12): qué tocaba cada día, qué se
   hizo, qué queda pendiente, qué se puede recuperar, qué ha caducado y de qué
   color es cada fecha. La pantalla principal, la ventana de siete días, el
   historial y el futuro calendario LEEN de aquí; ninguna calcula su propio color.

   🚨 **Funciones puras.** Reciben `fitness` y `hoy`; no leen el reloj (salvo el
   valor por defecto de `hoy`), no guardan nada y no importan pantallas. Lo único
   que se escribe de verdad es la SESIÓN (con su `diaDePlan` completo al empezar):
   el estado de cada fecha, los pendientes y su caducidad **se derivan** de ella
   (ARQUITECTURA_TECNICA.md §8, AT-04).

   🚨 **La regla central (D-02):** un entrenamiento perdido se puede recuperar
   mientras no se hayan realizado DOS entrenamientos en fechas posteriores a su
   fecha prevista. Individual por pendiente, sin ventana de días, y los descansos
   no cuentan. Una recuperación cuenta como entrenamiento posterior para los
   pendientes de fechas anteriores (ejemplo obligatorio 1).

   Decisiones de esta fase (anotadas en el documento maestro y en `docs/03`):
   - PD-01 (qué cuenta como «realizado» para la caducidad) → `REALIZADO`.
   - PD-02 («Completar entrenamiento» en fechas pasadas) → `completarEntrenamiento.js`.
   - PD-08 (sesión parcial) → la fecha queda «parcial» (amarillo verdoso) y no
     pendiente; una recuperación parcial deja así su fecha prevista.
   - PD-10 (sesión descartada) → libera la fecha.
   - PD-11 (serie planificada omitida) → cuenta como no hecha: la sesión es parcial.
   - PD-12 (plantilla en la papelera) → el pendiente no es recuperable hasta
     restaurarla; su caducidad sigue contando.
   ═══════════════════════════════════════════════════════════════════════════ */

import { todayISO, addDays, fechaValida } from './helpers';
import { diasEntre } from './hoy';
import {
  CATALOGO_PLANES, planActivoDe, planesAnterioresDe, idPlantillaDeDia,
} from './planes';
import { planActivoCompleto, tramoEnFecha, posicionDelDia } from './tuPlan';
import { rutinaDisponible, plantillaDisponible } from './rutinasCiclicas';
import { enlaceDeSesion, relacionConElDia } from './planificacionSemanal';
import { diaYMes } from './fechasFitness';
import { planARutina } from './constructor';
import { empezarSesion } from './entrenamiento';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/* ═══════════════════════════════════════════════════════════════════════════
   1 · CATÁLOGOS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Tipo de cumplimiento de una sesión (prompt 4 §9). */
export const CLASES_SESION = Object.freeze([
  { id: 'prevista', nombre: 'Entrenamiento previsto', explicacion: 'El entrenamiento que tocaba ese mismo día.' },
  { id: 'recuperacion', nombre: 'Recuperación', explicacion: 'Un entrenamiento pendiente de otro día, hecho más tarde.' },
  { id: 'libre', nombre: 'Sesión libre', explicacion: 'Un entrenamiento que no era el previsto ese día.' },
]);

/** El estado de cumplimiento de una fecha (ARQUITECTURA §9.2). Es un eje distinto
 *  del estado de la sesión (prompt 4 §4). Su `color` es un id —verde,
 *  amarillo_verdoso, rojo, pendiente, futuro o neutro—, nunca un hex: la pantalla
 *  lo traduce a sus tokens (`colorDeCumplimiento`). El grado de una sesión
 *  (completa, parcial o vacía) lo da `gradoDeSesion`, y cómo se registró, su campo
 *  `completadaCon` ('directo' o 'completar', D-03). */
export const ESTADOS_FECHA = Object.freeze([
  { id: 'cumplido', nombre: 'Cumplido', color: 'verde' },
  { id: 'recuperado', nombre: 'Recuperado', color: 'verde' },
  { id: 'parcial', nombre: 'Parcial', color: 'amarillo_verdoso' },
  { id: 'pendiente', nombre: 'Pendiente de recuperar', color: 'pendiente' },
  { id: 'perdido', nombre: 'Perdido', color: 'rojo' },
  { id: 'descanso_respetado', nombre: 'Descanso respetado', color: 'verde' },
  { id: 'descanso_sacrificado', nombre: 'Descanso sacrificado', color: 'rojo' },
  { id: 'hoy', nombre: 'Hoy', color: 'futuro' },
  { id: 'futuro', nombre: 'Todavía no ha llegado', color: 'futuro' },
  { id: 'sin_seguimiento', nombre: 'Sin seguimiento', color: 'neutro' },
]);
export const estadoFecha = (id) => ESTADOS_FECHA.find((e) => e.id === id) || null;

/**
 * 🔓 PD-01 — qué cuenta como «entrenamiento realizado» para la caducidad.
 * Lo que está decidido: cuentan las sesiones completas, las recuperaciones y
 * «Completar entrenamiento»; no cuentan los descansos ni una sesión sin ninguna
 * serie (caso 11). Lo que no estaba dicho, con la lectura literal de D-02
 * («entrenamientos realizados») y del caso 11 (la única exclusión es «ninguna
 * serie completada»): **una sesión parcial y una sesión libre también son
 * entrenamientos realizados**. Es un parámetro: si Josué decide otra cosa, se
 * cambia aquí y la suite lo recoge.
 */
export const REALIZADO = Object.freeze({ parcial: true, libre: true });

/** Cuántos entrenamientos posteriores hacen caducar un pendiente (D-02). */
export const CADUCA_TRAS = 2;

/** 🔓 PD-10 — los estados de una sesión que OCUPAN su fecha. Una `descartada` no
 *  es un entrenamiento y la libera. */
export const ESTADOS_QUE_OCUPAN = Object.freeze(['en_curso', 'pausada', 'finalizando', 'completada']);

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA SESIÓN: GRADO, SI CUENTA Y DE QUÉ CLASE ES
   ═══════════════════════════════════════════════════════════════════════════ */

/** Las series de su fotografía (FIT F7: viven en `origen.ejercicios`). */
const seriesDe = (sesion) => lista(objeto(objeto(sesion).origen).ejercicios)
  .flatMap((e) => lista(objeto(e).series)).filter((s) => s && typeof s === 'object');

/**
 * El grado (§9.1): `completa`, `parcial` o `vacia`.
 * - «Completar entrenamiento» es siempre completa (D-03).
 * - 🔓 PD-11 — una serie planificada **omitida** cuenta como no hecha.
 * - Las series añadidas no cambian el grado (no estaban en el plan), pero una
 *   añadida hecha sí cuenta como «algo hecho».
 */
export function gradoDeSesion(sesion) {
  const s = objeto(sesion);
  if (s.completadaCon === 'completar') return 'completa';
  const series = seriesDe(s);
  const hechas = series.filter((x) => x.estado === 'hecha').length;
  if (hechas === 0) return 'vacia';
  const planificadas = series.filter((x) => x.origen !== 'anadida');
  const sinHacer = planificadas.filter((x) => x.estado !== 'hecha').length;
  return sinHacer > 0 ? 'parcial' : 'completa';
}

/** Una sesión que cuenta para el cumplimiento: guardada, no vacía y que no está
 *  en conflicto con otra de su misma fecha. */
const guardada = (s) => !!s && s.estado === 'completada' && fechaValida(texto(s.fecha));

/** La fecha desde la que se evalúa el cumplimiento (PD-09). La pone la migración
 *  M1 (el día en que se migra) o la primera carga de una cuenta nueva. Sin ella,
 *  hoy: no se evalúa nada de antes. */
export function cumplimientoDesdeDe(fitness, hoy = todayISO()) {
  const d = texto(objeto(fitness).cumplimientoDesde);
  return fechaValida(d) ? d : hoy;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · QUÉ TOCABA CADA DÍA
   ═══════════════════════════════════════════════════════════════════════════ */

function contextoDelPlan(fitness, hoy, planes) {
  const f = objeto(fitness);
  const resuelto = planActivoCompleto(f, planes);
  const activo = planActivoDe(f);
  return {
    plan: resuelto && !resuelto.perdido ? resuelto.plan : null,
    desde: activo ? texto(activo.desde) : '',
    planId: activo ? activo.planId : '',
    origen: resuelto ? resuelto.origen : (activo ? activo.origen : ''),
    anteriores: planesAnterioresDe(f),
    hoy,
  };
}

/**
 * Lo que tocaba una fecha: `{ tipo: 'entreno'|'descanso', planId, diaId,
 * plantillaId, posicion, nombre, origen, actual }`, `{ tipo: 'sin_rutina' }` si
 * se sabe que no había ninguna (o era una plantilla usada como plan, que no tiene
 * días fijos: F31) o `null` si no se sabe.
 */
function previstoConContexto(fecha, ctx) {
  const t = tramoEnFecha(fecha, ctx);
  if (!t) return null;
  if (t.sinPlan) return { tipo: 'sin_rutina' };
  /* Una plantilla suya usada como plan no tiene días fijos (F31, apartado 13):
     contarle un entrenamiento cada día sería inventarle un compromiso. */
  if (t.origen === 'plantilla') return { tipo: 'sin_rutina', plantillaComoPlan: true, planId: t.planId };
  const pos = posicionDelDia(t.plan, fecha, t.desde);
  if (pos === null) return null;
  const dia = objeto(lista(t.plan.dias)[pos]);
  if (!texto(dia.id)) return null;
  const descanso = !!dia.descanso || dia.tipo === 'descanso';
  return {
    tipo: descanso ? 'descanso' : 'entreno',
    planId: t.planId,
    diaId: texto(dia.id),
    plantillaId: descanso ? null : (texto(dia.plantillaId) || idPlantillaDeDia(dia.id)),
    posicion: pos,
    nombre: descanso ? 'Descanso' : (texto(dia.nombre) || 'Entrenamiento'),
    planNombre: texto(t.plan.nombre),
    origen: texto(t.origen),
    actual: !!t.actual,
  };
}

export function previstoEn(fitness, fecha, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  return previstoConContexto(fecha, contextoDelPlan(fitness, hoy, planes));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CLASIFICAR UNA SESIÓN
   ═══════════════════════════════════════════════════════════════════════════ */

/** Si una sesión ejecuta lo que tocaba ese día: el mismo día del plan, o la misma
 *  plantilla (empezarla desde «Tus plantillas» el día que toca es lo mismo). */
export function ejecutaElPrevisto(sesion, previsto) {
  const p = objeto(previsto);
  if (p.tipo !== 'entreno') return false;
  const s = objeto(sesion);
  const o = objeto(s.origen);
  const d = objeto(s.diaDePlan);
  const plantillaId = texto(d.plantillaId) || (o.tipo === 'plantilla' ? texto(o.id) : '');
  if (plantillaId && plantillaId === p.plantillaId) return true;
  const e = enlaceDeSesion(s);
  return !!e && e.planId === p.planId && !!e.diaId && e.diaId === p.diaId;
}

/**
 * La clase de una sesión (§8.2): la guardada al empezar o, para las de antes de
 * esta fase, la de compatibilidad del §14.6 (`prevista` si su enlace coincide con
 * el día; si no, `libre`). Las anteriores a `cumplimientoDesde` son historia y no
 * se evalúan (`historica`).
 */
function claseConContexto(sesion, desde, ctx) {
  const s = objeto(sesion);
  const d = objeto(s.diaDePlan);
  const guardadaClase = CLASES_SESION.some((c) => c.id === d.clase) ? d.clase : null;
  if (texto(s.fecha) < desde) return 'historica';
  if (guardadaClase) return guardadaClase;
  const p = previstoConContexto(texto(s.fecha), ctx);
  if (!p || p.tipo !== 'entreno') return 'libre';
  const relacion = relacionConElDia(s, { ...p, descanso: false, sinPlan: false, idsDelPlan: [] });
  return relacion === 'coincide' || ejecutaElPrevisto(s, p) ? 'prevista' : 'libre';
}

export function claseDeSesion(sesion, fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  return claseConContexto(sesion, cumplimientoDesdeDe(fitness, hoy), contextoDelPlan(fitness, hoy, planes));
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL ANÁLISIS (una pasada, en memoria)
   ═══════════════════════════════════════════════════════════════════════════ */

const cache = new WeakMap();

/** La sesión que «es» la de una fecha y las que están en conflicto con ella
 *  (§8.8): si por sincronización hay dos, cuenta la primera guardada y la otra no
 *  se borra: se marca para que él decida. */
function repartirPorFecha(sesiones, desde) {
  const porFecha = new Map();
  for (const s of sesiones) {
    const f = texto(s.fecha);
    if (!porFecha.has(f)) porFecha.set(f, []);
    porFecha.get(f).push(s);
  }
  const principal = new Map();
  const conflicto = new Set();
  for (const [f, ss] of porFecha) {
    const orden = [...ss].sort((a, b) => (a.guardadaEn || a.terminadaEn || 0) - (b.guardadaEn || b.terminadaEn || 0));
    principal.set(f, orden[0]);
    /* Antes de la entrada en vigor varias sesiones el mismo día son historia:
       se conservan todas y no se marca ninguna (§14.6). */
    if (f >= desde) orden.slice(1).forEach((s) => conflicto.add(s.id));
  }
  return { principal, conflicto };
}

/**
 * Todo lo que el motor sabe, calculado una vez por `fitness` y `hoy`.
 * Devuelve `{ hoy, desde, ctx, sesiones, conflicto, realizadas, cumplidoras,
 * pendientes }`.
 */
export function analisisDeCumplimiento(fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const llave = `${hoy}|${planes === CATALOGO_PLANES ? '' : 'otros'}`;
  const porLlave = cache.get(f);
  if (porLlave && porLlave.has(llave)) return porLlave.get(llave);

  const desde = cumplimientoDesdeDe(f, hoy);
  const ctx = contextoDelPlan(f, hoy, planes);
  const sesiones = lista(f.sesiones).filter(guardada);
  const { conflicto } = repartirPorFecha(sesiones, desde);

  /* Cada sesión que cuenta, con su clase y su grado. */
  const evaluadas = sesiones
    .filter((s) => !conflicto.has(s.id))
    .map((s) => ({ sesion: s, fecha: texto(s.fecha), clase: claseConContexto(s, desde, ctx), grado: gradoDeSesion(s) }))
    .filter((x) => x.clase !== 'historica');

  /* Las fechas con un entrenamiento REALIZADO (D-02): para la caducidad. */
  const realizadas = [...new Set(evaluadas
    .filter((x) => x.grado !== 'vacia')
    .filter((x) => x.grado === 'completa' || REALIZADO.parcial)
    .filter((x) => x.clase !== 'libre' || REALIZADO.libre)
    .map((x) => x.fecha))].sort();

  /* Qué sesión cumple cada fecha prevista: la prevista de ese día o una
     recuperación que la apunta (terna planId + diaId + fechaPrevista). */
  const cumplidoras = new Map();
  const apuntar = (fecha, x) => {
    if (x.grado === 'vacia') return;
    const antes = cumplidoras.get(fecha);
    if (!antes || (antes.grado !== 'completa' && x.grado === 'completa')) cumplidoras.set(fecha, x);
  };
  for (const x of evaluadas) {
    if (x.clase === 'prevista') apuntar(x.fecha, x);
    if (x.clase === 'recuperacion') {
      const d = objeto(x.sesion.diaDePlan);
      if (fechaValida(texto(d.fechaPrevista))) apuntar(texto(d.fechaPrevista), x);
    }
  }

  const analisis = { hoy, desde, ctx, planes, sesiones, conflicto, evaluadas, realizadas, cumplidoras };
  analisis.pendientes = calcularPendientes(f, analisis);
  if (!cache.has(f)) cache.set(f, new Map());
  cache.get(f).set(llave, analisis);
  return analisis;
}

/** Las fechas realizadas estrictamente entre `p` y `t` (sin incluir ninguna). */
function realizadasEntre(realizadas, p, t) {
  return realizadas.filter((f) => f > p && f < t);
}

/** Por qué un pendiente no se puede recuperar ahora, aunque no haya caducado. */
function bloqueoDe(fitness, p, a) {
  const activo = planActivoDe(fitness);
  if (!activo || activo.planId !== p.planId) {
    return { motivo: 'otra_rutina', texto: `Es de «${p.planNombre || 'otra rutina'}», que no es tu rutina activa. Si la vuelves a activar antes de que caduque, podrás recuperarlo.` };
  }
  if (activo.origen !== 'preset' && !rutinaDisponible(fitness, p.planId, a.planes)) {
    return { motivo: 'rutina_eliminada', texto: 'Su rutina ya no está.' };
  }
  if (!plantillaDisponible(fitness, p.plantillaId, a.planes)) {
    return { motivo: 'plantilla_eliminada', texto: 'Su plantilla está en Eliminados recientes. Restáurala para poder recuperarlo; mientras tanto sigue contando su caducidad.' };
  }
  return null;
}

function calcularPendientes(fitness, a) {
  const { hoy, desde, ctx, realizadas, cumplidoras } = a;
  const out = [];
  if (!(desde < hoy)) return out;
  const dias = diasEntre(desde, hoy);
  for (let i = 0; i < dias; i += 1) {
    const fecha = addDays(desde, i);
    const p = previstoConContexto(fecha, ctx);
    if (!p || p.tipo !== 'entreno') continue;
    if (cumplidoras.has(fecha)) continue;
    /* Hasta hoy (sin incluirlo): lo que cuenta para poder recuperarlo ahora. */
    const antesDeHoy = realizadasEntre(realizadas, fecha, hoy);
    /* Y con lo de hoy: si con lo ya hecho hoy llega a dos, ha caducado. */
    const conHoy = realizadas.filter((f) => f > fecha && f <= hoy);
    const caducado = conHoy.length >= CADUCA_TRAS;
    const pend = {
      fecha,
      planId: p.planId,
      diaId: p.diaId,
      plantillaId: p.plantillaId,
      posicion: p.posicion,
      nombre: p.nombre,
      planNombre: p.planNombre,
      posteriores: conHoy,
      /* Cuántos entrenamientos más puede hacer antes de que caduque (lo de hoy
         incluido: si hoy ya entrenó, le queda uno menos). */
      quedan: Math.max(0, CADUCA_TRAS - conHoy.length),
      antesDeHoy,
      caducado,
      caducoEl: caducado ? conHoy[CADUCA_TRAS - 1] : null,
    };
    pend.bloqueo = caducado ? null : bloqueoDe(fitness, pend, a);
    pend.recuperable = !caducado && !pend.bloqueo;
    out.push(pend);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL ESTADO DE UNA FECHA (y su explicación)
   ═══════════════════════════════════════════════════════════════════════════ */

const fechaCorta = (f) => (fechaValida(f) ? diaYMes(f) : '');

/**
 * El estado de cumplimiento de una fecha, con su color y un `motivo` que dice por
 * qué (prompt 4 §4: el sistema debe poder explicarlo). Nada de esto se guarda.
 */
export function estadoDeFecha(fitness, fecha, opciones = {}) {
  const a = analisisDeCumplimiento(fitness, opciones);
  return estadoConAnalisis(fitness, fecha, a);
}

function estadoConAnalisis(fitness, fecha, a) {
  const { hoy, desde, ctx } = a;
  const deLaFecha = a.evaluadas.filter((x) => x.fecha === fecha);
  const sesionDelDia = deLaFecha[0] ? deLaFecha[0].sesion : null;
  const enConflicto = a.sesiones.filter((s) => texto(s.fecha) === fecha && a.conflicto.has(s.id));
  const base = (id, motivo, extra = {}) => {
    const e = estadoFecha(id);
    return { fecha, estado: id, nombre: e.nombre, color: e.color, motivo, sesion: sesionDelDia, conflicto: enConflicto, ...extra };
  };
  if (!fechaValida(fecha)) return base('sin_seguimiento', 'Fecha no válida.');
  if (fecha > hoy) return base('futuro', 'Este día todavía no ha llegado.', { previsto: previstoConContexto(fecha, ctx) });
  if (fecha < desde) return base('sin_seguimiento', 'Antes de que empezara el seguimiento del cumplimiento.');
  const p = previstoConContexto(fecha, ctx);
  if (!p || p.tipo === 'sin_rutina') {
    return base('sin_seguimiento', p && p.plantillaComoPlan ? 'Una plantilla usada como rutina no tiene días fijos.' : 'Ese día no tenías una rutina activa.', { previsto: p });
  }

  /* Lo que se hizo ese día y no era lo previsto (una recuperación de otro día o
     una sesión libre): en un descanso, lo sacrifica. */
  const hechasQueCuentan = deLaFecha.filter((x) => x.grado !== 'vacia');

  if (p.tipo === 'descanso') {
    if (hechasQueCuentan.length) {
      const x = hechasQueCuentan[0];
      const motivo = x.clase === 'recuperacion'
        ? `Recuperaste «${texto(x.sesion.nombre) || 'un entrenamiento'}» del ${fechaCorta(texto(objeto(x.sesion.diaDePlan).fechaPrevista))} en un día de descanso.`
        : 'Entrenaste en un día de descanso.';
      return base('descanso_sacrificado', motivo, { previsto: p });
    }
    if (fecha === hoy) return base('hoy', 'Hoy toca descansar. Descansar también cuenta.', { previsto: p });
    return base('descanso_respetado', 'Era un día de descanso y descansaste.', { previsto: p });
  }

  /* Un día de entreno. */
  const c = a.cumplidoras.get(fecha);
  if (c) {
    const cs = c.sesion;
    const conCompletar = cs.completadaCon === 'completar' ? ' con «Completar entrenamiento»' : '';
    if (c.clase === 'recuperacion') {
      const motivo = `Lo recuperaste el ${fechaCorta(c.fecha)}${conCompletar}.`;
      return c.grado === 'parcial'
        ? base('parcial', `${motivo} Se completaron algunas series, no todas.`, { previsto: p, cumplidaPor: cs, recuperado: true })
        : base('recuperado', motivo, { previsto: p, cumplidaPor: cs, recuperado: true });
    }
    return c.grado === 'parcial'
      ? base('parcial', 'Entrenaste, pero no completaste todas las series.', { previsto: p, cumplidaPor: cs })
      : base('cumplido', `Hiciste el entrenamiento previsto${conCompletar}.`, { previsto: p, cumplidaPor: cs });
  }
  if (fecha === hoy) {
    const otra = hechasQueCuentan[0];
    const motivo = otra && otra.clase === 'recuperacion'
      ? `Hoy has recuperado «${texto(otra.sesion.nombre) || 'otro entrenamiento'}». «${p.nombre}» quedará pendiente al terminar el día.`
      : `Hoy toca «${p.nombre}».`;
    return base('hoy', motivo, { previsto: p });
  }
  const pend = a.pendientes.find((x) => x.fecha === fecha);
  if (pend && pend.caducado) {
    return base('perdido', explicarCaducidad(pend), { previsto: p, pendiente: pend });
  }
  const vacia = deLaFecha.find((x) => x.grado === 'vacia' && x.clase === 'prevista');
  const prefijo = vacia ? 'Se guardó un entrenamiento sin ninguna serie completada, así que no cuenta. ' : '';
  const motivo = pend && pend.bloqueo
    ? `${prefijo}No lo hiciste. ${pend.bloqueo.texto}`
    : `${prefijo}No lo hiciste. ${explicarQuedan(pend)}`;
  return base('pendiente', motivo, { previsto: p, pendiente: pend || null });
}

export function explicarCaducidad(pend) {
  const ps = lista(pend && pend.posteriores).slice(0, CADUCA_TRAS);
  return ps.length >= CADUCA_TRAS
    ? `Ya no se puede recuperar: hiciste dos entrenamientos después, el ${fechaCorta(ps[0])} y el ${fechaCorta(ps[1])}.`
    : 'Ya no se puede recuperar.';
}

export function explicarQuedan(pend) {
  if (!pend) return 'Puedes recuperarlo.';
  if (pend.quedan >= CADUCA_TRAS) return 'Se puede recuperar hasta que hagas dos entrenamientos más.';
  return 'Se puede recuperar hasta que hagas un entrenamiento más.';
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LA VENTANA DE SIETE DÍAS (D-02: es una vista, no decide la caducidad)
   ═══════════════════════════════════════════════════════════════════════════ */

export const DIAS_VENTANA = 7;

/** Los últimos siete días naturales, hoy incluido, del más antiguo a hoy. */
export function ventanaDeSieteDias(fitness, opciones = {}) {
  const a = analisisDeCumplimiento(fitness, opciones);
  return Array.from({ length: DIAS_VENTANA }, (_, i) => addDays(a.hoy, i - (DIAS_VENTANA - 1)))
    .map((f) => estadoConAnalisis(fitness, f, a));
}

/** Cuántos días de la ventana hay de cada color (para un resumen sin porcentajes). */
export function resumenDeVentana(dias) {
  const r = { verde: 0, amarillo_verdoso: 0, rojo: 0, pendiente: 0 };
  lista(dias).forEach((d) => { if (r[d.color] !== undefined) r[d.color] += 1; });
  return r;
}

/** Si la ventana tiene algo que decir: con todo sin seguimiento, no se pinta. */
export const ventanaConDatos = (dias) => lista(dias).some((d) => d.estado !== 'sin_seguimiento' && d.estado !== 'futuro');

/* ═══════════════════════════════════════════════════════════════════════════
   8 · UNA SESIÓN POR FECHA (prompt 4 §3.2)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ **Garantía de cliente**: todas las entradas pasan por aquí, y la sesión se
   crea y se guarda al momento, así que cubre todas las pantallas del mismo
   dispositivo. Con dos dispositivos a la vez, el objeto único de `app_data` no lo
   puede impedir (PD-03): si llegan dos, ninguna se borra y la segunda queda en
   conflicto (§5). La garantía de servidor necesita el SQL preparado en
   `docs/15_FITNESS/sql/fitness_reserva_fechas.sql`, que solo puede ejecutar Josué. */

export function sesionQueOcupa(fitness, fecha) {
  return lista(objeto(fitness).sesiones)
    .filter((s) => s && texto(s.fecha) === fecha && ESTADOS_QUE_OCUPAN.includes(s.estado))
    .sort((a, b) => (a.guardadaEn || a.iniciadaEn || 0) - (b.guardadaEn || b.iniciadaEn || 0))[0] || null;
}

export const fechaOcupada = (fitness, fecha) => !!sesionQueOcupa(fitness, fecha);

/** El aviso de la fecha ocupada, con lo que hay ese día. */
export function avisoFechaOcupada(sesion, fecha, hoy = todayISO()) {
  const s = objeto(sesion);
  const dia = fecha === hoy ? 'hoy' : `el ${fechaCorta(fecha)}`;
  const enCurso = s.estado === 'en_curso' || s.estado === 'pausada' || s.estado === 'finalizando';
  return {
    titulo: enCurso ? `Ya tienes un entrenamiento empezado ${dia}` : `Ya entrenaste ${dia}`,
    texto: enCurso
      ? `«${texto(s.nombre) || 'Entrenamiento'}» está sin terminar. Solo se registra un entrenamiento por día: termínalo o descártalo antes de empezar otro.`
      : `«${texto(s.nombre) || 'Entrenamiento'}» ya está registrado ${dia}. Solo se registra un entrenamiento por día.`,
    enCurso,
    sesionId: s.id || null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · CLASIFICAR LO QUE SE EMPIEZA (se escribe al empezar, §8.2 y §5.6)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Comprueba si se puede empezar `sesion` en su fecha y, si se puede, la devuelve
 * con su `diaDePlan` completo (`planId`, `diaId`, `plantillaId`, `posicion`,
 * `fechaPrevista`, `clase`) y `completadaCon`. Con `recuperar` (un pendiente de
 * `opcionesDeRecuperacion`), es una recuperación.
 *
 * Devuelve `{ ok, motivo, aviso, sesion, ocupadaPor }`; sin `ok` no hay nada que
 * guardar.
 */
export function prepararSesionNueva(fitness, sesion, {
  hoy = todayISO(), planes = CATALOGO_PLANES, recuperar = null, completadaCon = 'directo',
} = {}) {
  const s = objeto(sesion);
  const fecha = texto(s.fecha) || hoy;
  if (!fechaValida(fecha)) return { ok: false, motivo: 'fecha_invalida', aviso: null, sesion: null, ocupadaPor: null };
  if (fecha > hoy) return { ok: false, motivo: 'fecha_futura', aviso: null, sesion: null, ocupadaPor: null };
  const ocupa = sesionQueOcupa(fitness, fecha);
  if (ocupa && ocupa.id !== s.id) {
    return { ok: false, motivo: 'fecha_ocupada', aviso: avisoFechaOcupada(ocupa, fecha, hoy), sesion: null, ocupadaPor: ocupa };
  }
  const o = objeto(s.origen);
  const anterior = objeto(s.diaDePlan);
  const base = {
    ...anterior,
    planId: texto(anterior.planId) || s.planId || null,
    tipo: texto(anterior.tipo) || texto(o.tipo) || 'plan',
    diaId: texto(anterior.diaId) || texto(o.id) || null,
    nombre: texto(anterior.nombre) || texto(s.nombre) || '',
  };
  if (recuperar) {
    const opciones = opcionesDeRecuperacion(fitness, { hoy, planes });
    const r = opciones.recuperables.find((x) => x.fecha === recuperar.fecha && x.planId === recuperar.planId && x.diaId === recuperar.diaId);
    if (!r) return { ok: false, motivo: 'no_recuperable', aviso: null, sesion: null, ocupadaPor: null };
    if (fecha !== hoy) return { ok: false, motivo: 'recuperar_solo_hoy', aviso: null, sesion: null, ocupadaPor: null };
    return {
      ok: true, motivo: null, aviso: null, ocupadaPor: null,
      sesion: {
        ...s,
        planId: r.planId,
        completadaCon,
        diaDePlan: {
          ...base, planId: r.planId, diaId: r.diaId, plantillaId: r.plantillaId, posicion: r.posicion,
          fechaPrevista: r.fecha, clase: 'recuperacion', nombre: r.nombre,
        },
      },
    };
  }
  const p = previstoEn(fitness, fecha, { hoy, planes });
  const prevista = !!p && p.tipo === 'entreno' && ejecutaElPrevisto({ ...s, diaDePlan: base }, p);
  const plantillaId = texto(anterior.plantillaId) || (o.tipo === 'plantilla' ? texto(o.id) : (prevista ? p.plantillaId : null));
  return {
    ok: true, motivo: null, aviso: null, ocupadaPor: null,
    sesion: {
      ...s,
      completadaCon,
      diaDePlan: {
        ...base,
        /* Empezada desde «Tus plantillas» el día que toca, es ESE día de la rutina:
           el vínculo apunta a la rutina y a su día, no a la plantilla suelta. */
        ...(prevista ? { planId: p.planId, diaId: p.diaId } : {}),
        plantillaId: plantillaId || null,
        posicion: prevista ? p.posicion : null,
        fechaPrevista: prevista ? fecha : null,
        clase: prevista ? 'prevista' : 'libre',
      },
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · OPCIONES DE RECUPERACIÓN Y SUS CONSECUENCIAS (prompt 4 §6, §7 y §10)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lo que se le puede ofrecer hoy. Solo si hoy no tiene ya un entrenamiento (una
 * sesión por día). Recuperables del más antiguo al más reciente, y el
 * recomendado es el más antiguo: el más próximo a caducar (D-05). También los
 * bloqueados y los que han caducado mientras se veía la ventana, con su motivo.
 */
export function opcionesDeRecuperacion(fitness, opciones = {}) {
  const a = analisisDeCumplimiento(fitness, opciones);
  const { hoy } = a;
  const ocupada = sesionQueOcupa(fitness, hoy);
  const previstoHoy = previstoConContexto(hoy, a.ctx);
  const recuperables = a.pendientes.filter((p) => p.recuperable).sort((x, y) => (x.fecha < y.fecha ? -1 : 1));
  const bloqueados = a.pendientes.filter((p) => !p.caducado && p.bloqueo);
  const inicioVentana = addDays(hoy, -(DIAS_VENTANA - 1));
  const caducados = a.pendientes.filter((p) => p.caducado && (p.fecha >= inicioVentana || (p.caducoEl && p.caducoEl >= inicioVentana)));
  return {
    hoy,
    ocupada: !!ocupada,
    sesionDeHoy: ocupada,
    previstoHoy,
    descansoHoy: !!previstoHoy && previstoHoy.tipo === 'descanso',
    recuperables,
    recomendado: recuperables[0] || null,
    bloqueados,
    caducados,
    /* Hay algo que decir solo si hay pendientes que se pueden recuperar hoy. */
    disponible: !ocupada && recuperables.length > 0,
  };
}

/** Una sesión hipotética completa hoy, para simular una elección. */
function sesionSimulada(hoy, eleccion, previstoHoy) {
  const id = `__simulada__${hoy}`;
  if (eleccion.tipo === 'recuperar') {
    const r = eleccion.pendiente;
    return {
      id, fecha: hoy, estado: 'completada', completadaCon: 'completar', guardadaEn: Number.MAX_SAFE_INTEGER,
      diaDePlan: { planId: r.planId, diaId: r.diaId, plantillaId: r.plantillaId, fechaPrevista: r.fecha, clase: 'recuperacion' },
      origen: { tipo: 'plan', id: r.diaId, ejercicios: [] },
    };
  }
  if (eleccion.tipo === 'previsto' && previstoHoy && previstoHoy.tipo === 'entreno') {
    return {
      id, fecha: hoy, estado: 'completada', completadaCon: 'completar', guardadaEn: Number.MAX_SAFE_INTEGER,
      diaDePlan: { planId: previstoHoy.planId, diaId: previstoHoy.diaId, plantillaId: previstoHoy.plantillaId, fechaPrevista: hoy, clase: 'prevista' },
      origen: { tipo: 'plan', id: previstoHoy.diaId, ejercicios: [] },
    };
  }
  if (eleccion.tipo === 'libre') {
    return {
      id, fecha: hoy, estado: 'completada', completadaCon: 'completar', guardadaEn: Number.MAX_SAFE_INTEGER,
      diaDePlan: { clase: 'libre' }, origen: { tipo: 'plantilla', id: '__libre__', ejercicios: [] },
    };
  }
  return null;
}

/**
 * La sesión que recupera un pendiente, lista para `prepararSesionNueva` con
 * `recuperar`: la plantilla de aquel día (PD-12: si está en la papelera no hay
 * sesión), su fotografía al empezar (F7) y el enlace con su día.
 */
export function sesionParaRecuperar(fitness, pendiente, {
  hoy = todayISO(), ahora = Date.now(), propios = null, planes = CATALOGO_PLANES, pesoCorporal = null,
} = {}) {
  const f = objeto(fitness);
  const p = objeto(pendiente);
  const pl = plantillaDisponible(f, p.plantillaId, planes);
  const rutina = pl ? planARutina(pl) : null;
  if (!rutina || !lista(rutina.lineas).length) return null;
  const resuelto = planActivoCompleto(f, planes);
  return empezarSesion({
    nombre: texto(p.nombre) || texto(pl.nombre) || 'Entrenamiento',
    lineas: rutina.lineas,
    planId: p.planId,
    origenTipo: (resuelto && resuelto.origen) || 'preset',
    origenId: p.diaId,
    ahora,
    hoy,
    propios: propios || lista(f.ejercicios),
    entorno: (resuelto && resuelto.plan && resuelto.plan.entorno) || texto(pl.entorno),
    pesoCorporal,
  });
}

/**
 * Qué pasaría al terminar hoy si eligiera `eleccion` (`{ tipo: 'recuperar',
 * pendiente }`, `{ tipo: 'previsto' }`, `{ tipo: 'libre' }` o `{ tipo:
 * 'descansar' }`). Es el mismo motor aplicado a una copia con la sesión
 * hipotética: no hay un segundo cálculo (§8.5). Devuelve qué pendientes
 * caducarían, si hoy pasaría a descanso sacrificado y si lo previsto hoy quedaría
 * pendiente, con frases para enseñarlas antes de confirmar.
 */
export function consecuenciasDeElegir(fitness, eleccion, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const e = objeto(eleccion);
  const antes = opcionesDeRecuperacion(f, { hoy, planes });
  const sim = sesionSimulada(hoy, e, antes.previstoHoy);
  const copia = sim ? { ...f, sesiones: [...lista(f.sesiones), sim] } : f;
  /* Al terminar hoy: se evalúa con «mañana» como hoy. */
  const manana = addDays(hoy, 1);
  const despues = analisisDeCumplimiento(copia, { hoy: manana, planes });
  const recuperableAntes = new Set(antes.recuperables.map((p) => p.fecha));
  const elegida = e.tipo === 'recuperar' && e.pendiente ? e.pendiente.fecha : null;
  const caducarian = despues.pendientes.filter((p) => p.caducado && recuperableAntes.has(p.fecha) && p.fecha !== elegida);
  const ph = antes.previstoHoy;
  const sacrificaDescanso = !!ph && ph.tipo === 'descanso' && !!sim;
  const hoyQuedaPendiente = !!ph && ph.tipo === 'entreno' && e.tipo !== 'previsto';
  const frases = [];
  if (e.tipo === 'recuperar' && e.pendiente) frases.push(`El ${fechaCorta(e.pendiente.fecha)} quedará cumplido como recuperado.`);
  if (sacrificaDescanso) frases.push('Hoy era descanso: quedará como descanso sacrificado.');
  if (e.tipo === 'descansar' && ph && ph.tipo === 'descanso') frases.push('Hoy quedará como descanso respetado. Descansar también es una opción válida.');
  if (hoyQuedaPendiente) frases.push(`«${ph.nombre}», el de hoy, quedará pendiente al terminar el día.`);
  caducarian.forEach((p) => frases.push(`«${p.nombre}» del ${fechaCorta(p.fecha)} caducará: ya serían dos entrenamientos después.`));
  if (!caducarian.length && sim) frases.push('Ningún otro pendiente caducará.');
  return { eleccion: e, caducarian, sacrificaDescanso, hoyQuedaPendiente, frases };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LO QUE NO SE CONSTRUYE Y LAS DECISIONES, CON SU MOTIVO
   ═══════════════════════════════════════════════════════════════════════════ */

export const DECISIONES_FASE4 = Object.freeze([
  { id: 'PD-01', decision: 'Una sesión parcial y una sesión libre cuentan como entrenamiento realizado para la caducidad.', motivo: 'Lectura literal de D-02 («entrenamientos realizados») y del caso 11 (la única exclusión es «ninguna serie»). Parámetro `REALIZADO`.', estado: 'provisional: falta que Josué la confirme' },
  { id: 'PD-02', decision: '«Completar entrenamiento» admite hoy o un día pasado, y cuenta en ESA fecha (no como recuperación).', motivo: 'Se conserva lo que hacía la PR #2 (D-03) y la fecha es la real que él declara (prompt 4 §9).', estado: 'provisional: falta que Josué la confirme' },
  { id: 'PD-08', decision: 'Una sesión parcial deja su fecha «parcial» (amarillo verdoso) y no pendiente; una recuperación parcial deja así su fecha prevista.', motivo: 'Caso 10 del prompt 4: «La fecha aparece amarillo verdoso» (no «pendiente»). El documento no tenía propuesta.', estado: 'provisional: el documento no traía propuesta' },
  { id: 'PD-10', decision: 'Una sesión descartada libera su fecha.', motivo: 'Propuesta documentada: no es un entrenamiento.', estado: 'aplicada (propuesta documentada)' },
  { id: 'PD-11', decision: 'Una serie planificada omitida cuenta como no hecha: la sesión es parcial.', motivo: 'Propuesta documentada.', estado: 'aplicada (propuesta documentada)' },
  { id: 'PD-12', decision: 'Un pendiente cuya plantilla está en la papelera no es recuperable hasta restaurarla; su caducidad sigue contando.', motivo: 'Propuesta documentada: no hay qué ejecutar sin inventarlo.', estado: 'aplicada (propuesta documentada)' },
]);

export const NO_EN_FASE4 = Object.freeze([
  { que: 'Garantía de servidor de una sesión por fecha', porque: 'Con el objeto único de `app_data` no se puede; el SQL de reserva de fechas está preparado y no se ejecuta (PD-03).' },
  { que: 'Calendario mensual con colores', porque: 'Es de la Fase 7; el motor ya da los estados (`estadoDeFecha`).' },
  { que: 'Racha calculada desde el cumplimiento', porque: 'PD-06, Fase 7.' },
]);
