// ============================================================================
// HT · Fase 8/12 — EL MOTOR TEMPORAL Y LAS AUTOMATIZACIONES
//
// *"La aplicación dejará de ser una agenda estática. Será un sistema temporal
// vivo."* (apartado 1)
//
// Dos cosas distintas en un archivo, porque la segunda depende de la primera:
//
//   1. **El estado temporal de cada actividad** — programada, próxima, en
//      curso, pasada, completada.
//   2. **El motor de reglas** — trigger → condiciones → acción.
//
// ── LA DISTINCIÓN QUE SOSTIENE LA FASE (apartados 6, 7 y 8) ────────────────
//
// **PASADA no es COMPLETADA.** *"La hora terminó"* y *"la actividad se
// realizó"* son cosas distintas, y confundirlas rompe el histórico: una clase a
// la que no fuiste terminó igual, pero no la hiciste.
//
// Por eso "pasada" **se calcula del reloj** y "completada" **se guarda**, y es
// lo único que se guarda de todo esto. Un estado temporal guardado dejaría de
// ser verdad en cuanto pasara un minuto.
//
// ── LAS TRES REGLAS DE LAS AUTOMATIZACIONES ────────────────────────────────
//
// **1. La excepción gana a la regla** (apartado 45). *"Añadir bata"* y *"no
// llevar bata el 15 de septiembre"* conviven, y el 15 no se lleva bata. Sin
// esto, una regla general no se podría matizar nunca.
//
// **2. Nada crítico se ejecuta solo** (apartado 53). Las acciones tienen nivel:
// informativa, reversible, importante y crítica. **Las críticas no se ejecutan
// sin autorización, y aquí directamente no existen** — nada de lo que puede
// hacer una regla borra datos.
//
// **3. Todo lo automático se explica y se puede deshacer** (apartados 50, 51 y
// 52). *"Añadida bata automáticamente por Biología"*, con su hora y con un
// botón para revertirlo.
//
// ⚠️ **La IA no es el motor** (apartado 55). El motor es determinista y se
// prueba entero con Node; la IA, cuando llegue (Fase 9), propondrá reglas para
// que las apruebe Josué, no las ejecutará.
// ============================================================================

import { uid, todayISO, addDays } from './helpers';
import {
  normalizarHorarioTop, resolverDia, minutosDe, diaDeFecha, nombreDeActividad,
} from './horario';
import { minutosAhora } from './hoy';

/* ===========================================================================
   1 · EL ESTADO TEMPORAL (apartados 2-14)
   ===========================================================================
   PROGRAMADA → PRÓXIMA → EN CURSO → PASADA → COMPLETADA */

export const ESTADOS_TEMPORALES = [
  { id: 'programada', label: 'Programada', enTablon: true },
  { id: 'proxima', label: 'Próxima', enTablon: true },
  { id: 'en_curso', label: 'Ahora', enTablon: true },
  // Apartado 6 — *"pasa a Pasada y desaparece del tablón principal"*.
  { id: 'pasada', label: 'Pasada', enTablon: false },
  { id: 'completada', label: 'Hecha', enTablon: false },
];

export const estadoTemporal = (id) => ESTADOS_TEMPORALES.find((e) => e.id === id) || ESTADOS_TEMPORALES[0];

/** Cuántos minutos antes una actividad pasa a ser "la próxima". */
export const MINUTOS_PROXIMA = 30;

/**
 * El estado de UN evento a una hora dada.
 *
 * ⚠️ Se calcula, no se guarda. Guardarlo dejaría de ser verdad en un minuto, y
 * a las 23:59 media app estaría diciendo "en curso" de algo de por la mañana.
 *
 * `completada` es la única excepción: la pone Josué y sí se guarda, porque no
 * hay forma de deducir del reloj si fue a clase.
 */
export function estadoDeEvento(evento, { fecha, hoy = todayISO(), ahora = null, completadas = [] } = {}) {
  const clave = claveEvento(evento, fecha);
  if (completadas.includes(clave)) return 'completada';
  if (fecha < hoy) return 'pasada';
  if (fecha > hoy) return 'programada';

  const m = minutosAhora(ahora);
  const i = minutosDe(evento.inicio);
  const f = minutosDe(evento.fin);
  // Apartado 27 — una actividad sin hora no está ni en curso ni pasada: no
  // tiene reloj al que agarrarse.
  if (i === null || f === null) return 'programada';
  if (m >= f) return 'pasada';
  if (m >= i) return 'en_curso';
  if (i - m <= MINUTOS_PROXIMA) return 'proxima';
  return 'programada';
}

/**
 * La clave de un evento resuelto en una fecha. ⚠️ Un evento resuelto **no
 * tiene id propio** (HT F1): es el resultado de componer una regla con una
 * fecha, así que la clave la forman las dos cosas.
 */
export const claveEvento = (evento, fecha) => `${fecha}|${evento?.bloqueId || evento?.id || evento?.titulo || ''}`;

export const completadasDe = (estado) => {
  const c = normalizarHorarioTop(estado).completadas;
  return Array.isArray(c) ? c.filter((x) => typeof x === 'string') : [];
};

/** Apartado 9 — confirmar que algo se hizo de verdad. Es opcional siempre. */
export function marcarCompletada(estado, evento, fecha, completada = true) {
  const e = normalizarHorarioTop(estado);
  const clave = claveEvento(evento, fecha);
  const previas = completadasDe(e);
  return {
    ...e,
    completadas: completada ? [...new Set([...previas, clave])] : previas.filter((x) => x !== clave),
  };
}

/**
 * El tablón de una fecha: cada evento con su estado temporal.
 *
 * Apartado 15 — lo pasado **desaparece del tablón**, pero sigue en la lista con
 * `enTablon: false`, que es lo que permite el botón "Ver pasado" (apartado 16)
 * sin volver a calcular nada.
 */
export function tablonDelDia(estado, fecha, { asignaturas = [], hoy = todayISO(), ahora = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const completadas = completadasDe(e);
  const eventos = resolverDia(e, fecha, { asignaturas }).map((ev) => {
    const est = estadoDeEvento(ev, { fecha, hoy, ahora, completadas });
    return { ...ev, clave: claveEvento(ev, fecha), estadoTemporal: est, enTablon: estadoTemporal(est).enTablon };
  });

  return {
    fecha,
    activos: eventos.filter((ev) => ev.enTablon),
    pasados: eventos.filter((ev) => !ev.enTablon),
    todos: eventos,
    // Apartado 17 — el historial del día: cuántas se hicieron de verdad.
    completadas: eventos.filter((ev) => ev.estadoTemporal === 'completada').length,
    // ⚠️ "Terminadas" incluye las completadas: una clase a la que fuiste
    // también terminó. Contarlas aparte daría totales que no suman.
    terminadas: eventos.filter((ev) => ['pasada', 'completada'].includes(ev.estadoTemporal)).length,
    total: eventos.length,
  };
}

/**
 * Apartados 22 y 23 — *"no depender de abrir la app"*.
 *
 * No hay proceso de fondo en una PWA, así que el "cambio de día" es esto:
 * comparar la fecha que la pantalla creía con la de ahora. Si no coinciden, hay
 * que recalcular. Es honesto y funciona; un temporizador que corriera toda la
 * noche no existe en iOS.
 */
export function hayCambioDeDia(fechaVista, hoy = todayISO()) {
  return !!fechaVista && fechaVista !== hoy;
}

/* ===========================================================================
   2 · EL MOTOR DE REGLAS (apartados 43-48)
   ===========================================================================
   TRIGGER → CONDICIONES → ACCIÓN.

   Deliberadamente cerrado: cuatro triggers, cinco condiciones y cuatro
   acciones. Un motor abierto sería un lenguaje de programación dentro de una
   app de instituto, y nadie podría depurar por qué apareció una bata. */

export const TRIGGERS = [
  { id: 'dia', label: 'Cada día' },
  { id: 'antes_de', label: 'Antes de una actividad' },
  { id: 'al_terminar', label: 'Al terminar una actividad' },
  { id: 'manual', label: 'Solo cuando yo lo pida' },
];

export const CONDICIONES = [
  { id: 'actividad', label: 'La actividad es' },
  { id: 'tipo', label: 'El tipo de actividad es' },
  { id: 'dia_semana', label: 'Es este día de la semana' },
  { id: 'etiqueta', label: 'La actividad lleva la etiqueta' },
  { id: 'fecha', label: 'Es este día concreto' },
];

/**
 * Apartado 53 — los niveles. ⚠️ **No hay acciones críticas**: nada de lo que
 * una regla puede hacer borra datos. Una automatización que borrase sería la
 * que hay que deshacer justo cuando no te has enterado de que pasó.
 */
export const ACCIONES = [
  { id: 'anadir_material', label: 'Añadir a la mochila', nivel: 'reversible' },
  { id: 'avisar', label: 'Avisarme', nivel: 'informativa' },
  { id: 'etiquetar', label: 'Poner una etiqueta', nivel: 'reversible' },
  { id: 'sugerir_tarea', label: 'Sugerir una tarea', nivel: 'importante' },
];

export const NIVELES_ACCION = ['informativa', 'reversible', 'importante'];

export const accionDe = (id) => ACCIONES.find((a) => a.id === id) || null;
export const necesitaConfirmar = (id) => accionDe(id)?.nivel === 'importante';

export function crearAutomatizacion({
  nombre = '', trigger = 'dia', condiciones = [], accion = 'anadir_material',
  valor = '', activa = true, excepcion = false, prioridad = 0, hoy = todayISO(),
} = {}) {
  return {
    id: uid(),
    nombre: (nombre || '').trim(),
    trigger: TRIGGERS.some((t) => t.id === trigger) ? trigger : 'dia',
    condiciones: normalizarCondiciones(condiciones),
    accion: accionDe(accion) ? accion : 'avisar',
    valor: String(valor || '').trim(),
    activa: activa !== false,
    // Apartado 46 — una regla puede ser una EXCEPCIÓN de otra, y entonces gana.
    excepcion: !!excepcion,
    prioridad: Number.isFinite(Number(prioridad)) ? Number(prioridad) : 0,
    creadaEn: hoy,
  };
}

const normalizarCondiciones = (cs) => (Array.isArray(cs) ? cs : [])
  .map((c) => ({
    tipo: CONDICIONES.some((x) => x.id === c?.tipo) ? c.tipo : 'actividad',
    valor: String(c?.valor || '').trim(),
  }))
  .filter((c) => c.valor);

export const automatizacionesDe = (estado) => (Array.isArray(estado?.automatizaciones) ? estado.automatizaciones : [])
  .map((a) => crearAutomatizacionDesde(a));

const crearAutomatizacionDesde = (a) => ({
  id: a?.id || uid(),
  nombre: (a?.nombre || '').trim(),
  trigger: TRIGGERS.some((t) => t.id === a?.trigger) ? a.trigger : 'dia',
  condiciones: normalizarCondiciones(a?.condiciones),
  accion: accionDe(a?.accion) ? a.accion : 'avisar',
  valor: String(a?.valor || '').trim(),
  activa: a?.activa !== false,
  excepcion: !!a?.excepcion,
  prioridad: Number.isFinite(Number(a?.prioridad)) ? Number(a.prioridad) : 0,
  creadaEn: a?.creadaEn || null,
});

/**
 * Apartado 44 — **todas** las condiciones tienen que cumplirse.
 *
 * ⚠️ Una regla **sin condiciones** se cumple siempre. Es deliberado: "cada día,
 * avisarme de preparar la mochila" no necesita ninguna. Lo que no puede pasar
 * es que una regla sin condiciones *y sin valor* haga algo, y por eso
 * `automatizacionesQueTocan` las descarta.
 */
export function cumpleCondiciones(automatizacion, { fecha, eventos = [], actividades = [], asignaturas = [] } = {}) {
  return automatizacion.condiciones.every((c) => {
    const v = c.valor.toLowerCase();
    if (c.tipo === 'fecha') return fecha === c.valor;
    if (c.tipo === 'dia_semana') return String(diaDeFecha(fecha)) === c.valor;
    return eventos.some((ev) => {
      const act = actividades.find((a) => a.id === ev.actividadId);
      if (!act) return false;
      if (c.tipo === 'tipo') return act.tipo === v;
      if (c.tipo === 'etiqueta') return (act.etiquetas || []).includes(v);
      return nombreDeActividad(act, asignaturas).toLowerCase() === v;
    });
  });
}

/**
 * Qué automatizaciones se disparan en una fecha, ya resueltas las excepciones.
 *
 * ⚠️ **La excepción gana** (apartado 45): si una regla dice "añadir bata" y otra
 * excepción dice "no bata el 15", el 15 no se añade. Se compara por `valor`,
 * que es lo que las dos tienen en común.
 */
export function automatizacionesQueTocan(estado, fecha, { asignaturas = [], trigger = 'dia', ahora = null, hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const eventos = resolverDia(e, fecha, { asignaturas });
  const contexto = { fecha, eventos, actividades: e.actividades, asignaturas };

  const candidatas = automatizacionesDe(e)
    .filter((a) => a.activa && a.trigger === trigger)
    // Una regla sin nada que hacer no se dispara: sería ruido con historial.
    .filter((a) => a.valor)
    .filter((a) => cumpleCondiciones(a, contexto));

  const excepciones = candidatas.filter((a) => a.excepcion);
  return candidatas
    .filter((a) => !a.excepcion)
    .filter((a) => !excepciones.some((x) => x.valor.toLowerCase() === a.valor.toLowerCase() && x.accion === a.accion))
    .sort((a, b) => b.prioridad - a.prioridad);
}

/* ===========================================================================
   3 · EJECUTAR, EXPLICAR Y DESHACER (apartados 48-52)
   ===========================================================================
   *"21:00 → Añadida bata automáticamente."* Con su hora, su motivo y su
   botón de deshacer. */

export const MAX_HISTORIAL = 60;

export const historialDe = (estado) => (Array.isArray(estado?.historialAuto) ? estado.historialAuto : [])
  .filter((x) => x && x.id && x.fecha);

/** Un texto que dice qué pasó y por qué (apartado 52). */
export function explicarAccion(entrada) {
  if (!entrada) return '';
  const a = accionDe(entrada.accion);
  const porQue = entrada.porQue ? ` por ${entrada.porQue}` : '';
  if (entrada.accion === 'anadir_material') return `Añadida ${entrada.valor} automáticamente${porQue}.`;
  if (entrada.accion === 'etiquetar') return `Puesta la etiqueta ${entrada.valor}${porQue}.`;
  if (entrada.accion === 'sugerir_tarea') return `Sugerida la tarea "${entrada.valor}"${porQue}.`;
  return `${a?.label || 'Acción'}: ${entrada.valor}${porQue}.`;
}

/**
 * Simula qué haría una automatización, **sin escribir nada**.
 *
 * Es lo que permite enseñar el plan antes de aplicarlo, igual que los
 * `impacto*()` de HT F4: nada se mueve en silencio.
 */
export function previsualizar(estado, fecha, opciones = {}) {
  return automatizacionesQueTocan(estado, fecha, opciones).map((a) => ({
    automatizacionId: a.id,
    nombre: a.nombre || a.valor,
    accion: a.accion,
    valor: a.valor,
    nivel: accionDe(a.accion)?.nivel || 'informativa',
    confirmar: necesitaConfirmar(a.accion),
    porQue: a.condiciones.map((c) => c.valor).join(' y ') || 'la regla que tienes puesta',
  }));
}

/**
 * Ejecuta una automatización y **deja constancia**.
 *
 * ⚠️ Solo escribe el historial y el efecto de la acción. Una acción que
 * necesite confirmar (`importante`) **no se ejecuta sin `confirmada`**: es el
 * apartado 53 aplicado, no una nota en un comentario.
 */
export function ejecutar(estado, propuesta, { fecha = todayISO(), confirmada = false, ahora = null } = {}) {
  const e = normalizarHorarioTop(estado);
  if (!propuesta) return { estado: e, error: 'No hay nada que ejecutar.' };
  if (propuesta.confirmar && !confirmada) return { estado: e, error: 'Esto hay que confirmarlo antes.', necesitaConfirmar: true };

  const entrada = {
    id: uid(),
    fecha,
    hora: typeof ahora === 'string' ? ahora : new Date().toTimeString().slice(0, 5),
    automatizacionId: propuesta.automatizacionId || null,
    accion: propuesta.accion,
    valor: propuesta.valor,
    porQue: propuesta.porQue || '',
    deshecha: false,
  };

  let nuevo = { ...e, historialAuto: [entrada, ...historialDe(e)].slice(0, MAX_HISTORIAL) };

  // Apartado 32 y siguientes — el único efecto real de hoy es la mochila. Las
  // demás acciones informan; no fingen hacer algo que no hacen (regla 8).
  if (propuesta.accion === 'anadir_material') {
    const yaEsta = (e.mochila || []).some((m) => m.fecha === fecha && m.nombre === propuesta.valor);
    if (!yaEsta) {
      nuevo = {
        ...nuevo,
        mochila: [...(e.mochila || []), {
          id: uid(), fecha, materialId: null, nombre: propuesta.valor,
          cantidad: 1, metido: false,
          // ⚠️ `manual: false` a propósito: lo puso una regla, así que el motor
          // de la mochila puede recalcularlo. Marcarlo manual lo haría eterno.
          manual: false, automatico: true, entradaId: entrada.id,
        }],
      };
    }
  }

  return { estado: nuevo, entrada, error: null };
}

/**
 * Apartado 51 — deshacer. *"Deberá poder revertir la acción cuando sea
 * posible"*, y ese "cuando sea posible" es literal: solo se puede deshacer lo
 * que dejó rastro. Lo informativo no tiene nada que revertir.
 */
export function deshacer(estado, entradaId) {
  const e = normalizarHorarioTop(estado);
  const entrada = historialDe(e).find((x) => x.id === entradaId);
  if (!entrada) return { estado: e, error: 'Esa acción ya no está en el historial.' };
  if (entrada.deshecha) return { estado: e, error: 'Eso ya estaba deshecho.' };

  const historial = historialDe(e).map((x) => (x.id === entradaId ? { ...x, deshecha: true } : x));
  if (entrada.accion !== 'anadir_material') {
    // No es un fallo: un aviso ya dado no se puede "no dar". Se marca y ya.
    return { estado: { ...e, historialAuto: historial }, error: null, sinEfecto: true };
  }
  return {
    estado: {
      ...e,
      historialAuto: historial,
      mochila: (e.mochila || []).filter((m) => m.entradaId !== entradaId),
    },
    error: null,
    sinEfecto: false,
  };
}

export const puedeDeshacerse = (entrada) => !!entrada && !entrada.deshecha && entrada.accion === 'anadir_material';

/**
 * Apartado 48 — ejecutar todo lo que toca hoy, de una vez.
 *
 * ⚠️ **Lo que necesita confirmación se queda fuera** y se devuelve aparte, para
 * que la pantalla pueda preguntarlo. Ejecutarlo "porque estaba en el lote"
 * sería saltarse el apartado 53 por comodidad.
 */
export function ejecutarTodo(estado, fecha, opciones = {}) {
  let d = normalizarHorarioTop(estado);
  const propuestas = previsualizar(d, fecha, opciones);
  const hechas = [];
  const pendientesDeConfirmar = [];

  for (const p of propuestas) {
    if (p.confirmar) { pendientesDeConfirmar.push(p); continue; }
    const r = ejecutar(d, p, { fecha, ...opciones });
    if (!r.error) { d = r.estado; hechas.push(r.entrada); }
  }
  return { estado: d, hechas, pendientesDeConfirmar };
}

/* ===========================================================================
   4 · RESUMEN
   =========================================================================== */
export function resumenAutomatizaciones(estado, fecha = todayISO(), opciones = {}) {
  const e = normalizarHorarioTop(estado);
  const todas = automatizacionesDe(e);
  const historial = historialDe(e);
  return {
    total: todas.length,
    activas: todas.filter((a) => a.activa).length,
    excepciones: todas.filter((a) => a.excepcion).length,
    tocanHoy: previsualizar(e, fecha, opciones).length,
    ejecutadas: historial.filter((x) => !x.deshecha).length,
    deshechas: historial.filter((x) => x.deshecha).length,
    ultima: historial[0] || null,
  };
}
