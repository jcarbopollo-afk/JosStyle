// ============================================================================
// HT · Fase 10/12 — EL MOTOR DE DECISIÓN DE AVISOS
//
// *"La idea no es llenar el móvil de avisos. La idea es que el sistema se
// adelante a lo que necesitas, pero sin molestarte."*
//
// ── LA SEPARACIÓN, QUE ES LA MISMA QUE EN EL SONIDO ────────────────────────
//
// El proyecto **ya tiene** quien manda notificaciones: `notificaciones.js`
// (Fase A4), con el permiso, el interruptor global, las categorías y el horario
// de descanso. Un segundo emisor daría dos avisos por lo mismo.
//
// Así que esto es **la otra mitad**, y es la que faltaba:
//
//   `avisosHorario.js` — DECIDE qué avisar, cuándo y con qué prioridad. Puro,
//                        se prueba entero con Node.
//   `notificaciones.js` — MANDA. Toca el navegador.
//
// Es exactamente el reparto de SO F1 (`audio.js` decide, `audioEngine.js`
// suena), y por el mismo motivo: la decisión es donde están los errores que
// importan, y la decisión sí se puede probar.
//
// ── LAS CUATRO REGLAS ──────────────────────────────────────────────────────
//
// **1. Que exista un evento NO significa que haya que avisar** (apartado 4).
// Es la regla fundamental de la fase, y por eso hay un motor de decisión con
// seis preguntas (apartado 5) en vez de un `if`.
//
// **2. No se crean cientos de recordatorios** (apartado 34). Seis clases un
// martes no son seis avisos: es **uno** con lo que hay que saber.
//
// **3. Un aviso caduca** (apartado 52). Si la clase ya pasó o la tarea ya está
// hecha, el aviso programado **se cancela solo** — avisar de algo que ya no
// aplica es peor que no avisar.
//
// **4. No molestar se respeta siempre** (apartado 39), y lo crítico tampoco lo
// salta. Un aviso de mochila a las 3 de la mañana no es más útil por ser
// urgente.
// ============================================================================

import { uid, todayISO, addDays } from './helpers';
import { normalizarHorarioTop, resolverDia, minutosDe, diaDeFecha, DIAS_SEMANA } from './horario';
import { minutosAhora, pendientes, diasEntre, describirMinutos } from './hoy';
import { mochilaDeFecha, progresoMochila } from './mochila';

/* ===========================================================================
   1 · TIPOS Y PRIORIDADES (apartados 2 y 3)
   =========================================================================== */

export const TIPOS_AVISO = [
  { id: 'recordatorio', label: 'Recordatorio', icono: '⏰', categoria: 'sistema' },
  { id: 'estudio', label: 'Estudio', icono: '📚', categoria: 'estudios' },
  { id: 'mochila', label: 'Mochila', icono: '🎒', categoria: 'estudios' },
  { id: 'calendario', label: 'Calendario', icono: '📅', categoria: 'sistema' },
  { id: 'tarea', label: 'Tarea', icono: '📝', categoria: 'productividad' },
  { id: 'alerta', label: 'Alerta', icono: '⚠️', categoria: 'sistema' },
  { id: 'entrenamiento', label: 'Entrenamiento', icono: '💪', categoria: 'entrenamiento' },
];

export const tipoAviso = (id) => TIPOS_AVISO.find((t) => t.id === id) || TIPOS_AVISO[0];

export const PRIORIDADES_AVISO = [
  { id: 'critica', label: 'Crítica', peso: 3 },
  { id: 'alta', label: 'Alta', peso: 2 },
  { id: 'normal', label: 'Normal', peso: 1 },
  { id: 'baja', label: 'Baja', peso: 0 },
];

export const prioridadAviso = (id) => PRIORIDADES_AVISO.find((p) => p.id === id) || PRIORIDADES_AVISO[2];

/* ===========================================================================
   2 · LOS AJUSTES (apartados 76-80)
   ===========================================================================
   ⚠️ **No hay un segundo interruptor global.** El de `ajustes.notificaciones`
   ya existe desde la Fase A4 y sigue mandando; esto solo añade lo que es del
   horario y no cabía allí. */

export const DEFAULT_AVISOS_HORARIO = {
  // Apartado 9 — cuántos minutos antes.
  minutosAntesClase: 10,
  minutosAntesExamen: 1440,      // el día antes
  // Apartados 31 y 37 — el resumen de la noche, para preparar la mochila.
  resumenNocturno: true,
  horaResumenNocturno: '21:00',
  resumenMatutino: false,
  horaResumenMatutino: '07:30',
  // Apartado 78 — a partir de qué importancia avisar.
  minimaPrioridad: 'normal',
  // Apartado 4 — qué tipos avisan, sin tocar el interruptor de la Fase A4.
  tipos: { recordatorio: true, estudio: true, mochila: true, calendario: true, tarea: true, alerta: true, entrenamiento: true },
};

export function normalizarAvisosHorario(guardado) {
  const g = guardado || {};
  const n = (v, d, min, max) => (Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.floor(Number(v)))) : d);
  const tipos = { ...DEFAULT_AVISOS_HORARIO.tipos };
  for (const t of TIPOS_AVISO) if (g.tipos && g.tipos[t.id] === false) tipos[t.id] = false;
  return {
    ...DEFAULT_AVISOS_HORARIO,
    ...g,
    minutosAntesClase: n(g.minutosAntesClase, 10, 0, 120),
    minutosAntesExamen: n(g.minutosAntesExamen, 1440, 0, 10080),
    horaResumenNocturno: /^\d{2}:\d{2}$/.test(g.horaResumenNocturno || '') ? g.horaResumenNocturno : '21:00',
    horaResumenMatutino: /^\d{2}:\d{2}$/.test(g.horaResumenMatutino || '') ? g.horaResumenMatutino : '07:30',
    minimaPrioridad: PRIORIDADES_AVISO.some((p) => p.id === g.minimaPrioridad) ? g.minimaPrioridad : 'normal',
    resumenNocturno: g.resumenNocturno !== false,
    resumenMatutino: !!g.resumenMatutino,
    tipos,
  };
}

/* ===========================================================================
   3 · QUÉ HAY QUE AVISAR (apartados 11-33)
   ===========================================================================
   Se calculan los avisos **candidatos** de una fecha. Todavía no se decide si
   se mandan: eso es el motor del apartado 5, que va después. */

/** La clave de un aviso. Es lo que impide mandarlo dos veces (apartado 5). */
export const claveAviso = (tipo, referencia, fecha) => `${fecha}|${tipo}|${referencia}`;

export function avisosCandidatos(estado, fecha, { asignaturas = [], productividad = null, estudios = null, hoy = todayISO(), ajustes = null } = {}) {
  const a = normalizarAvisosHorario(ajustes);
  const e = normalizarHorarioTop(estado);
  const salida = [];

  // Apartado 11 — que empieza una clase. Uno por clase, con su hora.
  for (const ev of resolverDia(e, fecha, { asignaturas })) {
    const i = minutosDe(ev.inicio);
    if (i === null) continue;
    salida.push({
      clave: claveAviso('recordatorio', ev.bloqueId || ev.titulo, fecha),
      tipo: 'recordatorio',
      prioridad: 'normal',
      fecha,
      cuando: Math.max(0, i - a.minutosAntesClase),
      titulo: ev.titulo,
      cuerpo: `Empieza a las ${ev.inicio}${ev.ubicacion ? ` en ${ev.ubicacion}` : ''}.`,
      referencia: ev.bloqueId || null,
    });
  }

  // Apartados 17 y 18 — un examen. Es lo único que sube a crítica sola.
  for (const x of estudios?.examenes || []) {
    if (!x.fecha || x.fecha < hoy) continue;
    const dias = diasEntre(fecha, x.fecha);
    if (dias < 0 || dias > 3) continue;
    const asig = (estudios?.asignaturas || []).find((s) => s.id === x.asignaturaId);
    salida.push({
      clave: claveAviso('estudio', x.id, fecha),
      tipo: 'estudio',
      prioridad: dias <= 1 ? 'critica' : 'alta',
      fecha,
      cuando: minutosDe(a.horaResumenNocturno),
      titulo: `Examen${asig?.nombre ? ` de ${asig.nombre}` : ''}`,
      cuerpo: dias === 0 ? 'Es hoy.' : dias === 1 ? 'Es mañana.' : `Faltan ${dias} días.`,
      referencia: x.id,
    });
  }

  // Apartados 20, 21 y 22 — la mochila de mañana, y solo si falta algo.
  if (a.resumenNocturno) {
    const manana = addDays(fecha, 1);
    const p = progresoMochila(mochilaDeFecha(e, manana, { asignaturas }));
    if (!p.vacia && p.faltanObligatorios > 0) {
      salida.push({
        clave: claveAviso('mochila', manana, fecha),
        tipo: 'mochila',
        // ⚠️ Que falte material NO es crítico. Crítico es un examen mañana;
        // esto es importante, y confundirlos hace que lo crítico deje de serlo.
        prioridad: 'alta',
        fecha,
        cuando: minutosDe(a.horaResumenNocturno),
        titulo: 'Prepara la mochila',
        cuerpo: p.aviso,
        referencia: manana,
      });
    }
  }

  // Apartados 14, 15 y 16 — tareas. Las vencidas, una sola vez al día.
  const pend = pendientes({ productividad, estudios, hoy: fecha, dias: 1 });
  const vencidas = pend.filter((t) => t.estado === 'vencida');
  if (vencidas.length) {
    salida.push({
      clave: claveAviso('tarea', 'vencidas', fecha),
      tipo: 'tarea',
      prioridad: 'alta',
      fecha,
      cuando: minutosDe(a.horaResumenNocturno),
      titulo: `${vencidas.length} ${vencidas.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}`,
      // Apartado 15 — se dice cuál, no solo cuántas.
      cuerpo: vencidas.slice(0, 3).map((t) => t.titulo).join(', '),
      referencia: 'vencidas',
    });
  }

  return salida.filter((x) => a.tipos[x.tipo] !== false);
}

/* ===========================================================================
   4 · EL MOTOR DE DECISIÓN (apartados 4, 5, 39, 41, 42 y 52)
   ===========================================================================
   *"¿Es importante? → ¿Está configurado? → ¿Es el momento adecuado? → ¿Ya se
   avisó? → ¿La situación sigue siendo válida? → ENVIAR"*

   Seis preguntas, y **cada una tiene su motivo de rechazo por escrito**: sin
   eso, depurar "por qué no me ha avisado" sería imposible. */

export const MOTIVOS_RECHAZO = {
  tipo_apagado: 'Ese tipo de aviso está apagado.',
  poca_prioridad: 'No llega a la importancia mínima que pediste.',
  aun_no: 'Todavía no toca.',
  ya_paso: 'Ya pasó la hora.',
  repetido: 'Ya se avisó de esto.',
  caducado: 'Ya no hace falta.',
  descanso: 'Estás en horas de descanso.',
  pospuesto: 'Lo pospusiste.',
};

/**
 * ¿Se manda este aviso ahora?
 *
 * Devuelve `{ enviar, motivo }` **siempre**: cuando dice que no, dice por qué.
 */
export function decidirAviso(aviso, {
  ahora = null, ajustes = null, enviados = [], pospuestos = {}, descanso = false, sigueValido = true,
} = {}) {
  const a = normalizarAvisosHorario(ajustes);
  const m = minutosAhora(ahora);

  if (a.tipos[aviso.tipo] === false) return { enviar: false, motivo: 'tipo_apagado' };
  if (prioridadAviso(aviso.prioridad).peso < prioridadAviso(a.minimaPrioridad).peso) {
    return { enviar: false, motivo: 'poca_prioridad' };
  }
  // ⚠️ Apartado 39 — no molestar se respeta SIEMPRE, también con lo crítico.
  // Un aviso de mochila a las 3 de la mañana no es más útil por ser urgente.
  if (descanso) return { enviar: false, motivo: 'descanso' };
  if (enviados.includes(aviso.clave)) return { enviar: false, motivo: 'repetido' };
  // Apartado 52 — si la situación cambió, el aviso ya no vale.
  if (!sigueValido) return { enviar: false, motivo: 'caducado' };

  const pospuestoHasta = pospuestos[aviso.clave];
  if (Number.isFinite(pospuestoHasta) && m < pospuestoHasta) return { enviar: false, motivo: 'pospuesto' };

  if (m < aviso.cuando) return { enviar: false, motivo: 'aun_no' };
  // Con más de dos horas de retraso ya no sirve: avisar a las 12 de una clase
  // de las 8 solo hace ruido.
  if (m > aviso.cuando + 120) return { enviar: false, motivo: 'ya_paso' };

  return { enviar: true, motivo: null };
}

/**
 * Apartados 34, 35 y 36 — **un resumen, no cientos de avisos**.
 *
 * Seis clases un martes no son seis notificaciones. Cuando hay más de uno que
 * mandar a la vez, se junta en uno solo con lo más importante primero.
 */
export const MAXIMO_SUELTOS = 1;

export function agrupar(avisos) {
  const lista = [...(avisos || [])].sort((a, b) =>
    prioridadAviso(b.prioridad).peso - prioridadAviso(a.prioridad).peso || a.cuando - b.cuando);
  if (lista.length <= MAXIMO_SUELTOS) return lista;

  const principal = lista[0];
  const resto = lista.slice(1);
  return [{
    ...principal,
    clave: `${principal.fecha}|resumen`,
    tipo: 'recordatorio',
    agrupado: true,
    titulo: `${lista.length} cosas hoy`,
    cuerpo: `${principal.titulo}${resto.length ? `, ${resto.slice(0, 2).map((x) => x.titulo).join(', ')}` : ''}${resto.length > 2 ? '…' : ''}`,
    incluye: lista.map((x) => x.clave),
  }];
}

/* ===========================================================================
   5 · EL CENTRO DE AVISOS (apartados 51, 54, 55, 56, 72, 73 y 74)
   ===========================================================================
   Lo que se avisó, si se leyó, y las tres acciones: posponer, marcar hecho y
   archivar. */

export const MAX_AVISOS_GUARDADOS = 80;
export const MINUTOS_SNOOZE = [10, 30, 60];

export const avisosDe = (estado) => (Array.isArray(estado?.avisos) ? estado.avisos : [])
  .filter((x) => x && x.id && x.clave);

export function registrarEnviado(estado, aviso, { ahora = null, fecha = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const previos = avisosDe(e);
  if (previos.some((x) => x.clave === aviso.clave)) return e;
  const entrada = {
    id: uid(),
    clave: aviso.clave,
    tipo: aviso.tipo,
    prioridad: aviso.prioridad,
    titulo: aviso.titulo,
    cuerpo: aviso.cuerpo,
    fecha,
    hora: typeof ahora === 'string' ? ahora : new Date().toTimeString().slice(0, 5),
    leido: false,
    archivado: false,
  };
  return { ...e, avisos: [entrada, ...previos].slice(0, MAX_AVISOS_GUARDADOS) };
}

export const clavesEnviadas = (estado, fecha = null) => avisosDe(estado)
  .filter((x) => (fecha ? x.fecha === fecha : true))
  .map((x) => x.clave);

export function marcarLeido(estado, avisoId, leido = true) {
  const e = normalizarHorarioTop(estado);
  return { ...e, avisos: avisosDe(e).map((x) => (x.id === avisoId ? { ...x, leido } : x)) };
}

export function archivarAviso(estado, avisoId, archivado = true) {
  const e = normalizarHorarioTop(estado);
  return { ...e, avisos: avisosDe(e).map((x) => (x.id === avisoId ? { ...x, archivado, leido: true } : x)) };
}

export function marcarTodosLeidos(estado) {
  const e = normalizarHorarioTop(estado);
  return { ...e, avisos: avisosDe(e).map((x) => ({ ...x, leido: true })) };
}

/** Apartados 54 y 55 — posponer. Vive en memoria de la sesión, no se guarda. */
export function posponer(pospuestos, clave, minutos, { ahora = null } = {}) {
  const m = minutosAhora(ahora);
  return { ...(pospuestos || {}), [clave]: m + Math.max(1, minutos) };
}

/** Los avisos del centro, sin archivar y con los no leídos primero. */
export function centroDeAvisos(estado, { incluirArchivados = false, tipo = null } = {}) {
  const lista = avisosDe(estado)
    .filter((x) => (incluirArchivados ? true : !x.archivado))
    .filter((x) => (tipo ? x.tipo === tipo : true));
  return {
    avisos: [...lista].sort((a, b) => (a.leido - b.leido) || `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`)),
    sinLeer: lista.filter((x) => !x.leido).length,
    total: lista.length,
  };
}

/* ===========================================================================
   6 · LOS RESÚMENES (apartados 36, 37 y 38)
   =========================================================================== */

/**
 * Apartado 37 — el resumen nocturno. *"Mañana tienes…"*, con lo que hace falta
 * para preparar la mochila esta noche.
 *
 * ⚠️ Devuelve `null` si mañana no hay nada. Un resumen que dice "mañana no
 * tienes nada" todas las noches de las vacaciones es exactamente el ruido que
 * el apartado 34 quiere evitar.
 */
export function resumenNocturno(estado, { fecha = todayISO(), asignaturas = [], ...opciones } = {}) {
  const manana = addDays(fecha, 1);
  const e = normalizarHorarioTop(estado);
  const eventos = resolverDia(e, manana, { asignaturas });
  const p = progresoMochila(mochilaDeFecha(e, manana, { asignaturas }));
  if (!eventos.length && p.vacia) return null;

  return {
    fecha: manana,
    dia: DIAS_SEMANA[(diaDeFecha(manana) || 1) - 1]?.label || '',
    titulo: `Mañana: ${eventos.length} ${eventos.length === 1 ? 'cosa' : 'cosas'}`,
    primera: eventos[0] ? `${eventos[0].inicio} ${eventos[0].titulo}` : '',
    mochila: p.vacia ? '' : p.completa ? 'La mochila ya está lista.' : p.aviso,
    faltan: p.faltanObligatorios,
  };
}

/** Apartado 38 — el resumen de la mañana: lo de hoy, en una línea. */
export function resumenMatutino(estado, { fecha = todayISO(), asignaturas = [], ...opciones } = {}) {
  const eventos = resolverDia(normalizarHorarioTop(estado), fecha, { asignaturas });
  const pend = pendientes({ ...opciones, hoy: fecha, dias: 0 });
  if (!eventos.length && !pend.length) return null;
  return {
    fecha,
    titulo: eventos.length ? `Hoy empiezas a las ${eventos[0].inicio}` : 'Hoy no tienes clases',
    cuerpo: [
      eventos.length ? `${eventos.length} ${eventos.length === 1 ? 'actividad' : 'actividades'}` : '',
      pend.length ? `${pend.length} ${pend.length === 1 ? 'pendiente' : 'pendientes'}` : '',
    ].filter(Boolean).join(' · '),
  };
}

/* ===========================================================================
   7 · LO QUE HAY QUE MANDAR AHORA MISMO
   ===========================================================================
   La función que usa la pantalla: candidatos → decisión → agrupación.
   ⚠️ **No manda nada**: devuelve qué mandar, y quien manda es
   `notificaciones.js`, que es el único que toca el navegador. */
export function avisosAMandar(estado, { fecha = todayISO(), ahora = null, ajustes = null, pospuestos = {}, descanso = false, ...opciones } = {}) {
  const e = normalizarHorarioTop(estado);
  const enviados = clavesEnviadas(e, fecha);
  const candidatos = avisosCandidatos(e, fecha, { ...opciones, ajustes });

  const decididos = candidatos
    .map((x) => ({ aviso: x, ...decidirAviso(x, { ahora, ajustes, enviados, pospuestos, descanso }) }));

  return {
    mandar: agrupar(decididos.filter((d) => d.enviar).map((d) => d.aviso)),
    // Se devuelven también los descartados con su motivo: es lo que permite
    // contestar "¿por qué no me ha avisado?" sin adivinar.
    descartados: decididos.filter((d) => !d.enviar).map((d) => ({ clave: d.aviso.clave, titulo: d.aviso.titulo, motivo: d.motivo, texto: MOTIVOS_RECHAZO[d.motivo] })),
    candidatos: candidatos.length,
  };
}

export function resumenAvisos(estado, opciones = {}) {
  const centro = centroDeAvisos(estado);
  const ahora = avisosAMandar(estado, opciones);
  return {
    sinLeer: centro.sinLeer,
    guardados: centro.total,
    porMandar: ahora.mandar.length,
    descartados: ahora.descartados.length,
  };
}
