// ============================================================================
// HT · Fase 9/12 — EL PLANIFICADOR (y lo que la IA puede y no puede hacer)
//
// La arquitectura del apartado 52, que es la que decide todo lo demás:
//
//   DATOS → MOTOR TEMPORAL → **MOTOR DE PLANIFICACIÓN** → IA → PROPUESTA
//         → CONFIRMACIÓN → CAMBIOS
//
// Fíjate dónde está la IA: **después del planificador y antes de la
// confirmación**. No calcula y no escribe. Este archivo es el motor de
// planificación, y es **determinista**: los mismos datos dan el mismo plan, y
// se prueba entero con Node.
//
// ── LAS CINCO REGLAS QUE NO SE NEGOCIAN ────────────────────────────────────
//
// **1. La IA nunca escribe** (apartado 6 y regla 7 del proyecto). Propone; el
// cambio lo hace `aplicarPlan`, y solo con una confirmación explícita.
//
// **2. Las respuestas salen de los datos, no de una estimación** (apartado 51).
// *"Tienes 1 h 20 min libres"* lo dice el motor temporal, no la IA. Por eso
// `contextoParaIA` lleva los números ya calculados.
//
// **3. No se manda toda la base de datos** (apartado 50). Solo el contexto
// relevante: mejor privacidad, menos coste y respuestas más precisas. Y **nunca
// las notas privadas** (HT F5, apartados 52 y 73).
//
// **4. No decide por ti** (apartado 37). Enseña opciones y sus consecuencias;
// elige Josué.
//
// **5. No castiga** (apartado 19). Si no estudiaste el martes, el plan **no
// dice "has fallado"**: dice *"el plan necesita reajustarse"*. Hay una prueba
// que falla si aparece un reproche.
//
// ── LO QUE NO SE HA VUELTO A CONSTRUIR ─────────────────────────────────────
//
// El motor temporal es HT F6 (`hoy.js`), los huecos y conflictos son HT F1, y
// el motor de reglas es HT F8. Aquí solo está lo que faltaba: **decidir qué
// poner en qué hueco, y en qué orden**.
// ============================================================================

import { todayISO, addDays } from './helpers';
import {
  normalizarHorarioTop, minutosDe, duracionMinutos, diaDeFecha, DIAS_SEMANA,
  huecosDelDia, resolverDia, crearBloque, pesoPrioridad,
} from './horario';
import { pendientes, diasEntre, describirMinutos, estadoDelDia } from './hoy';

/* ===========================================================================
   1 · PRIORIDAD (apartados 20 y 21)
   ===========================================================================
   *"Internamente podrá existir un cálculo."* Aquí está, y es **determinista**:
   fecha límite, tipo, prioridad declarada y proximidad de examen.

   ⚠️ El número **no se enseña**. "Esto vale 87 puntos" no le dice nada a nadie;
   lo que sirve es el orden y el motivo. */

export const PESOS = {
  vencida: 100,
  hoy: 60,
  examen: 40,
  prioridadAlta: 25,
  porDiaDeMargen: -4,
};

export function puntuacionPrioridad(item, { hoy = todayISO() } = {}) {
  let n = 0;
  if (item?.estado === 'vencida') n += PESOS.vencida;
  if (item?.estado === 'hoy') n += PESOS.hoy;
  if (item?.tipo === 'examen') n += PESOS.examen;
  n += pesoPrioridad(item?.prioridad) * (PESOS.prioridadAlta / 3);
  // Cuanto más lejos la fecha, menos urge. Sin fecha no resta nada: no urge,
  // pero tampoco se hunde al final de la lista.
  if (item?.fecha) n += Math.max(-40, diasEntre(hoy, item.fecha) * PESOS.porDiaDeMargen);
  return Math.round(n);
}

/** Por qué está donde está, dicho para una persona (apartado 67). */
export function motivoDePrioridad(item, { hoy = todayISO() } = {}) {
  if (item?.estado === 'vencida') return `Se pasó hace ${item.diasDeRetraso} ${item.diasDeRetraso === 1 ? 'día' : 'días'}.`;
  if (item?.tipo === 'examen') {
    const d = diasEntre(hoy, item.fecha);
    return d <= 0 ? 'Es hoy.' : d === 1 ? 'Es mañana.' : `Faltan ${d} días.`;
  }
  if (item?.estado === 'hoy') return 'Es para hoy.';
  if (item?.fecha) return `Para el ${item.fecha.split('-').reverse().slice(0, 2).join('/')}.`;
  return 'Sin fecha.';
}

export function ordenarPorPrioridad(items, opciones = {}) {
  return [...(items || [])]
    .map((x) => ({ ...x, puntos: puntuacionPrioridad(x, opciones), motivo: motivoDePrioridad(x, opciones) }))
    .sort((a, b) => b.puntos - a.puntos || (a.fecha || '9999').localeCompare(b.fecha || '9999'));
}

/* ===========================================================================
   2 · HUECOS ADECUADOS (apartados 13, 14, 28 y 30)
   ===========================================================================
   *"No simplemente moverá una actividad a cualquier hora."*

   Un hueco de 35 minutos **no sirve** para una sesión de 30 si hace falta
   levantarse, llegar y sentarse. Por eso hay margen y tiempo de transición: sin
   ellos, el planificador propone cosas que en la vida real no caben. */

export const MARGEN_MINUTOS = 10;
export const TRANSICION_MINUTOS = 5;

export const DEFAULT_PREFERENCIAS = {
  // Apartado 31 — cuándo prefiere trabajar. No se adivina: se pregunta.
  desde: '09:00',
  hasta: '21:00',
  duracionSesion: 45,
  descansoEntreSesiones: 15,
  maximoPorDia: 3,
  // Apartado 44 — "no estudiar después de entrenar", etc.
  evitarDespuesDe: [],
};

export function normalizarPreferencias(guardadas) {
  const g = guardadas || {};
  const n = (v, d, min, max) => (Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.floor(Number(v)))) : d);
  return {
    ...DEFAULT_PREFERENCIAS,
    ...g,
    desde: /^\d{2}:\d{2}$/.test(g.desde || '') ? g.desde : DEFAULT_PREFERENCIAS.desde,
    hasta: /^\d{2}:\d{2}$/.test(g.hasta || '') ? g.hasta : DEFAULT_PREFERENCIAS.hasta,
    // Una sesión de 5 minutos o de 6 horas no es una sesión de estudio.
    duracionSesion: n(g.duracionSesion, 45, 15, 180),
    descansoEntreSesiones: n(g.descansoEntreSesiones, 15, 0, 60),
    maximoPorDia: n(g.maximoPorDia, 3, 1, 8),
    evitarDespuesDe: (Array.isArray(g.evitarDespuesDe) ? g.evitarDespuesDe : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean),
  };
}

const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * Los huecos de un día donde de verdad cabe algo de `duracion` minutos.
 *
 * ⚠️ Devuelve la **hora concreta** en la que empezaría, ya con la transición
 * descontada. Un hueco "de 10:00 a 11:00" para una sesión de 45 no empieza a
 * las 10:00: empieza a las 10:05, y termina con margen antes de la siguiente.
 */
export function huecosAdecuados(estado, fecha, { duracion = 45, asignaturas = [], preferencias = null } = {}) {
  const p = normalizarPreferencias(preferencias);
  const necesita = duracion + TRANSICION_MINUTOS + MARGEN_MINUTOS;
  const eventos = resolverDia(estado, fecha, { asignaturas });

  return huecosDelDia(estado, fecha, { asignaturas, minimo: necesita, desde: p.desde, hasta: p.hasta })
    .map((h) => {
      const inicio = minutosDe(h.inicio) + TRANSICION_MINUTOS;
      // Apartado 44 — "no estudiar después de entrenar". Se mira qué había
      // justo antes del hueco.
      const anterior = eventos.filter((ev) => minutosDe(ev.fin) <= minutosDe(h.inicio)).pop();
      const evitado = !!anterior && p.evitarDespuesDe.includes((anterior.titulo || '').toLowerCase());
      return {
        inicio: aHora(inicio),
        fin: aHora(inicio + duracion),
        minutos: h.minutos,
        holgura: h.minutos - necesita,
        despuesDe: anterior?.titulo || '',
        evitado,
      };
    })
    // Lo que Josué ha pedido evitar se queda fuera, no se ordena al final: si
    // sale en la lista, acabará eligiéndose un día con prisa.
    .filter((h) => !h.evitado);
}

/* ===========================================================================
   3 · EL PLAN DE ESTUDIO (apartados 16, 17, 18 y 19)
   ===========================================================================
   *"Lunes tema 1, martes tema 2, miércoles tema 3, jueves repaso, viernes
   examen."*

   ⚠️ **El día antes del examen es repaso, no materia nueva.** Meter el último
   tema la víspera es exactamente lo que hace que se llegue sin haberlo visto
   dos veces. */

export function planDeEstudio(estado, { examenFecha, temas = [], hoy = todayISO(), asignaturas = [], preferencias = null, titulo = 'Estudiar' } = {}) {
  const p = normalizarPreferencias(preferencias);
  const dias = diasEntre(hoy, examenFecha);
  if (!examenFecha || dias < 0) return { sesiones: [], aviso: 'Ese examen ya pasó.', imposible: true };
  if (dias === 0) return { sesiones: [], aviso: 'El examen es hoy. Ya no hay plan que hacer, suerte.', imposible: true };

  // Los días disponibles: de hoy a la víspera. El día del examen no se estudia.
  const disponibles = [];
  for (let i = 0; i < dias; i++) {
    const f = addDays(hoy, i);
    const huecos = huecosAdecuados(estado, f, { duracion: p.duracionSesion, asignaturas, preferencias: p });
    if (huecos.length) disponibles.push({ fecha: f, huecos });
  }

  if (!disponibles.length) {
    return {
      sesiones: [],
      // Apartado 19 — ni un reproche. Es un dato, no una culpa.
      aviso: 'No queda ningún hueco libre antes del examen. Habría que mover algo.',
      imposible: true,
    };
  }

  // La víspera es repaso; el resto se reparte el temario.
  const conRepaso = disponibles.length > 1;
  const paraTemas = conRepaso ? disponibles.slice(0, -1) : disponibles;
  const lista = temas.length ? temas : ['Repasar todo'];
  const sesiones = [];

  paraTemas.forEach((d, i) => {
    // Con más días que temas, se reparte de menos a más carga por día; con más
    // temas que días, se agrupan. Nunca se deja un día sin nada que hacer.
    const desde = Math.floor((i * lista.length) / paraTemas.length);
    const hasta = Math.floor(((i + 1) * lista.length) / paraTemas.length);
    const suyos = lista.slice(desde, Math.max(hasta, desde + 1));
    const hueco = d.huecos[0];
    sesiones.push({
      fecha: d.fecha,
      dia: DIAS_SEMANA[(diaDeFecha(d.fecha) || 1) - 1]?.label || '',
      inicio: hueco.inicio,
      fin: hueco.fin,
      titulo: `${titulo}: ${suyos.join(' y ')}`,
      temas: suyos,
      tipo: 'estudio',
    });
  });

  if (conRepaso) {
    const v = disponibles[disponibles.length - 1];
    sesiones.push({
      fecha: v.fecha,
      dia: DIAS_SEMANA[(diaDeFecha(v.fecha) || 1) - 1]?.label || '',
      inicio: v.huecos[0].inicio,
      fin: v.huecos[0].fin,
      titulo: `${titulo}: repaso general`,
      temas: [],
      tipo: 'repaso',
    });
  }

  return {
    sesiones,
    dias,
    imposible: false,
    aviso: sesiones.length < lista.length
      ? `Caben ${sesiones.length} ${sesiones.length === 1 ? 'sesión' : 'sesiones'} para ${lista.length} temas: en algunas tocan varios.`
      : '',
  };
}

/**
 * Apartado 18 — el plan adaptativo. Si un día no se estudió, se recalcula con
 * lo que queda.
 *
 * ⚠️ Y el 19: **no castiga**. *"El plan necesita reajustarse"*, nunca *"has
 * fallado"*. Hay una prueba que busca esas palabras.
 */
export function replanificarEstudio(estado, { examenFecha, temasPendientes = [], hoy = todayISO(), ...opciones } = {}) {
  const nuevo = planDeEstudio(estado, { examenFecha, temas: temasPendientes, hoy, ...opciones });
  const quedan = diasEntre(hoy, examenFecha);
  return {
    ...nuevo,
    mensaje: nuevo.imposible
      ? nuevo.aviso
      : `Te quedan ${nuevo.sesiones.length} ${nuevo.sesiones.length === 1 ? 'sesión' : 'sesiones'} antes del examen. El plan se reajusta así.`,
    diasRestantes: quedan,
  };
}

/* ===========================================================================
   4 · REPLANIFICAR UNA ACTIVIDAD (apartados 9 y 10)
   ===========================================================================
   *"Hoy no puedo entrenar."* → *"He encontrado dos huecos posibles."*
   Opciones, no una decisión (apartado 37). */
export function huecosParaMover(estado, { duracion = 60, desde = todayISO(), dias = 7, maximo = 4, ...opciones } = {}) {
  const salida = [];
  for (let i = 0; i < dias && salida.length < maximo; i++) {
    const f = addDays(desde, i);
    for (const h of huecosAdecuados(estado, f, { duracion, ...opciones })) {
      if (salida.length >= maximo) break;
      salida.push({
        fecha: f,
        dia: DIAS_SEMANA[(diaDeFecha(f) || 1) - 1]?.label || '',
        ...h,
        texto: `${i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_SEMANA[(diaDeFecha(f) || 1) - 1]?.label} de ${h.inicio} a ${h.fin}`,
      });
    }
  }
  return salida;
}

/* ===========================================================================
   5 · CARGA SEMANAL Y SOBRECARGA (apartados 33, 34, 35 y 36)
   =========================================================================== */
export function mapaDeCarga(estado, { desde = todayISO(), dias = 7, ...opciones } = {}) {
  const salida = [];
  for (let i = 0; i < dias; i++) {
    const f = addDays(desde, i);
    const d = estadoDelDia(estado, f, { ...opciones, fecha: f });
    salida.push({ fecha: f, dia: DIAS_SEMANA[(diaDeFecha(f) || 1) - 1]?.corto || '', ...d });
  }
  return salida;
}

/**
 * Apartado 36 — *"detección de sobrecarga"*. ⚠️ Se **informa**, no se riñe: un
 * día cargado no es un día malo, y el apartado 37 dice que no decide por ti.
 */
export function detectarSobrecarga(estado, opciones = {}) {
  const mapa = mapaDeCarga(estado, opciones);
  const cargados = mapa.filter((d) => d.carga === 'alta');
  const libres = mapa.filter((d) => d.vacio || d.diaLibre);
  return {
    mapa,
    cargados,
    libres,
    hay: cargados.length > 0,
    // Se dice el hecho y se ofrece la alternativa. Nada más.
    mensaje: cargados.length === 0
      ? ''
      : `${cargados.map((d) => d.nombreDia).join(', ')} ${cargados.length === 1 ? 'lo tienes' : 'los tienes'} bastante lleno${cargados.length === 1 ? '' : 's'}.`
        + (libres.length ? ` ${libres.length === 1 ? 'Hay' : 'Hay'} ${libres.length} ${libres.length === 1 ? 'día' : 'días'} más despejado${libres.length === 1 ? '' : 's'} esa semana.` : ''),
  };
}

/* ===========================================================================
   6 · LAS ACCIONES QUE LA IA PUEDE PROPONER (apartados 53, 54, 55 y 56)
   ===========================================================================
   *"La IA podrá proponer acciones ESTRUCTURADAS."*

   Estructuradas, no texto libre: una lista cerrada que se puede validar antes
   de tocar nada. ⚠️ **Ninguna borra.** Una IA que pueda proponer un borrado
   acabará proponiéndolo el día que no te fijes. */

export const ACCIONES_IA = [
  { id: 'CREAR_BLOQUE_ESTUDIO', label: 'Crear una sesión de estudio', reversible: true },
  { id: 'CREAR_TAREA', label: 'Crear una tarea', reversible: true },
  { id: 'MOVER_BLOQUE', label: 'Mover una clase o entrenamiento', reversible: true },
  { id: 'SUGERIR_MATERIAL', label: 'Añadir algo a la mochila', reversible: true },
];

export const accionIA = (id) => ACCIONES_IA.find((a) => a.id === id) || null;

/**
 * Apartado 54 — **validar antes de nada**. Una acción que llega mal formada de
 * la IA no puede convertirse en un bloque roto en el horario de Josué.
 */
export function validarAccion(accion, estado) {
  if (!accion || !accionIA(accion.tipo)) return { ok: false, error: 'Esa acción no existe.' };
  const e = normalizarHorarioTop(estado);

  if (accion.tipo === 'CREAR_BLOQUE_ESTUDIO' || accion.tipo === 'MOVER_BLOQUE') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(accion.fecha || '')) return { ok: false, error: 'Falta la fecha.' };
    if (minutosDe(accion.inicio) === null || minutosDe(accion.fin) === null) return { ok: false, error: 'Faltan las horas.' };
    if (!duracionMinutos(accion.inicio, accion.fin)) return { ok: false, error: 'Esa hora de fin no va después de la de inicio.' };
  }
  if (accion.tipo === 'MOVER_BLOQUE' && !e.bloques.some((b) => b.id === accion.bloqueId)) {
    return { ok: false, error: 'Esa clase ya no existe.' };
  }
  if ((accion.tipo === 'CREAR_TAREA' || accion.tipo === 'SUGERIR_MATERIAL') && !(accion.texto || '').trim()) {
    return { ok: false, error: 'Falta el texto.' };
  }
  return { ok: true, error: null };
}

/**
 * Apartado 56 — la previsualización. Devuelve qué pasaría **sin escribir**,
 * exactamente igual que los `impacto*()` de HT F4 y el `previsualizar` de F8.
 */
export function previsualizarPlan(estado, acciones = [], opciones = {}) {
  return (acciones || []).map((a) => {
    const v = validarAccion(a, estado);
    return {
      ...a,
      valida: v.ok,
      error: v.error,
      etiqueta: accionIA(a.tipo)?.label || 'Acción',
      texto: describirAccion(a),
    };
  });
}

export function describirAccion(a) {
  if (!a) return '';
  const cuando = a.fecha ? `${a.fecha.split('-').reverse().slice(0, 2).join('/')}${a.inicio ? ` a las ${a.inicio}` : ''}` : '';
  if (a.tipo === 'CREAR_BLOQUE_ESTUDIO') return `Estudiar ${a.texto || ''} el ${cuando}`.trim();
  if (a.tipo === 'CREAR_TAREA') return `Tarea: ${a.texto}${a.fecha ? ` para el ${cuando}` : ''}`;
  if (a.tipo === 'MOVER_BLOQUE') return `Mover a ${cuando}`;
  if (a.tipo === 'SUGERIR_MATERIAL') return `Llevar ${a.texto}${a.fecha ? ` el ${cuando}` : ''}`;
  return a.texto || '';
}

/**
 * Apartados 6, 7 y 55 — **aceptar el plan**. Es el único sitio de toda la fase
 * que escribe, y **exige confirmación explícita**.
 *
 * ⚠️ Sin `confirmado` no hace nada. No es una comprobación defensiva: es la
 * regla 7 del proyecto puesta en código, para que sea imposible que una
 * respuesta de la IA acabe cambiando el horario sola.
 */
export function aplicarPlan(estado, acciones = [], { confirmado = false, horarioId = null, columnaId = null, hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  if (!confirmado) return { estado: e, error: 'Un plan no se aplica sin confirmarlo.', aplicadas: [] };

  let d = e;
  const aplicadas = [];
  const rechazadas = [];

  for (const a of acciones) {
    const v = validarAccion(a, d);
    if (!v.ok) { rechazadas.push({ accion: a, error: v.error }); continue; }

    if (a.tipo === 'CREAR_BLOQUE_ESTUDIO' && horarioId && columnaId) {
      const bloque = crearBloque({
        horarioId, columnaId, inicio: a.inicio, fin: a.fin,
        titulo: a.texto || 'Estudio', tipo: 'estudio', hoy,
      });
      d = { ...d, bloques: [...d.bloques, bloque] };
      aplicadas.push({ ...a, bloqueId: bloque.id });
    } else if (a.tipo === 'MOVER_BLOQUE') {
      d = { ...d, bloques: d.bloques.map((b) => (b.id === a.bloqueId ? { ...b, inicio: a.inicio, fin: a.fin } : b)) };
      aplicadas.push(a);
    } else if (a.tipo === 'SUGERIR_MATERIAL') {
      d = {
        ...d,
        mochila: [...(d.mochila || []), {
          id: `plan-${Date.now()}-${aplicadas.length}`, fecha: a.fecha || hoy, materialId: null,
          nombre: a.texto, cantidad: 1, metido: false, manual: false, automatico: true,
        }],
      };
      aplicadas.push(a);
    } else {
      // `CREAR_TAREA` vive en Productividad: aquí se devuelve para que lo
      // escriba quien es dueño del dato (apartado 92 de F5, "referencia única").
      aplicadas.push({ ...a, paraOtroModulo: 'productividad' });
    }
  }
  return { estado: d, aplicadas, rechazadas, error: null };
}

/* ===========================================================================
   7 · EL CONTEXTO QUE SE LE MANDA (apartados 2, 49, 50, 62 y 64)
   ===========================================================================
   *"No se enviará innecesariamente toda la base de datos. Solo el contexto
   relevante."*

   ⚠️ Y lo que **nunca** sale: las notas privadas de una actividad (HT F5,
   apartados 52 y 73) y el módulo de Relación, que ya está excluido de la
   exportación por una regla invariante. Hay pruebas de las dos cosas. */
export function contextoParaIA(estado, { fecha = todayISO(), hoy = todayISO(), dias = 7, ...opciones } = {}) {
  const e = normalizarHorarioTop(estado);
  const pend = ordenarPorPrioridad(pendientes({ ...opciones, hoy }), { hoy });
  const carga = mapaDeCarga(e, { desde: fecha, dias, ...opciones });
  const libres = huecosParaMover(e, { desde: fecha, dias: 3, duracion: 45, ...opciones });

  return {
    fecha,
    dia: DIAS_SEMANA[(diaDeFecha(fecha) || 1) - 1]?.label || '',
    // ⚠️ Los números vienen YA CALCULADOS (apartado 51): la IA no estima
    // cuánto tiempo libre hay, lo lee.
    agenda: resolverDia(e, fecha, opciones).map((ev) => ({ titulo: ev.titulo, inicio: ev.inicio, fin: ev.fin })),
    pendientes: pend.slice(0, 10).map((p) => ({ titulo: p.titulo, tipo: p.tipo, fecha: p.fecha, estado: p.estado, motivo: p.motivo })),
    huecos: libres.map((h) => ({ fecha: h.fecha, inicio: h.inicio, fin: h.fin, minutos: h.minutos })),
    minutosLibresHoy: libres.filter((h) => h.fecha === fecha).reduce((t, h) => t + h.minutos, 0),
    carga: carga.map((d) => ({ fecha: d.fecha, dia: d.dia, nivel: d.carga, actividades: d.actividades })),
    // Lo que la IA PUEDE proponer, para que no invente acciones que no existen.
    accionesPosibles: ACCIONES_IA.map((a) => a.id),
  };
}

/* ===========================================================================
   8 · AUTONOMÍA Y MODO (apartados 59, 60 y 61)
   ===========================================================================
   *"Nivel de autonomía."*

   ⚠️ El proyecto tiene una regla que gana a este apartado: **la IA nunca se
   dispara sola** (regla 7). Así que los niveles existen, pero **el más alto
   sigue exigiendo confirmar** — lo que cambia es cuánto trabajo hace antes de
   preguntar, no si pregunta. */
export const NIVELES_AUTONOMIA = [
  { id: 'manual', label: 'Solo si se lo pido', sugiere: false },
  { id: 'sugiere', label: 'Que me sugiera', sugiere: true },
];

export const nivelAutonomia = (id) => NIVELES_AUTONOMIA.find((n) => n.id === id) || NIVELES_AUTONOMIA[0];

/* ===========================================================================
   9 · EXPLICAR Y COMPARAR (apartados 67, 68 y 69)
   =========================================================================== */

/** Apartado 67 — *"explicación del plan"*. Por qué está cada sesión donde está. */
export function explicarPlan(plan) {
  if (!plan || plan.imposible) return plan?.aviso || 'No hay plan que explicar.';
  const s = plan.sesiones || [];
  if (!s.length) return 'No cabe ninguna sesión con los huecos que tienes.';
  const repaso = s.some((x) => x.tipo === 'repaso');
  return `${s.length} ${s.length === 1 ? 'sesión' : 'sesiones'} en los huecos que ya tenías libres`
    + `${repaso ? ', y la víspera para repasar' : ''}.`;
}

/**
 * Apartados 68 y 69 — un plan alternativo, para comparar. Sesiones más cortas y
 * más días: la misma materia repartida de otra forma.
 */
export function planAlternativo(estado, opciones = {}) {
  const p = normalizarPreferencias(opciones.preferencias);
  return planDeEstudio(estado, {
    ...opciones,
    preferencias: { ...p, duracionSesion: Math.max(15, Math.round(p.duracionSesion / 2)) },
  });
}

export function compararPlanes(a, b) {
  const min = (p) => (p?.sesiones || []).reduce((t, s) => t + (duracionMinutos(s.inicio, s.fin) || 0), 0);
  return {
    a: { sesiones: a?.sesiones?.length || 0, minutos: min(a), texto: describirMinutos(min(a)) },
    b: { sesiones: b?.sesiones?.length || 0, minutos: min(b), texto: describirMinutos(min(b)) },
  };
}

/* ===========================================================================
   10 · RESUMEN
   =========================================================================== */
export function resumenPlanificador(estado, opciones = {}) {
  const sob = detectarSobrecarga(estado, opciones);
  const pend = ordenarPorPrioridad(pendientes({ ...opciones, hoy: opciones.hoy || todayISO() }), opciones);
  return {
    pendientes: pend.length,
    loPrimero: pend[0] || null,
    diasCargados: sob.cargados.length,
    diasLibres: sob.libres.length,
    huecosHoy: huecosAdecuados(estado, opciones.fecha || todayISO(), opciones).length,
  };
}
