/* ===========================================================================
   ENTREGA 3 · FASE 7 (HC F2) — LA AGENDA DEL DÍA
   ===========================================================================

   *"Agenda NO debe ser simplemente otra forma de mostrar las tareas. Debe
   funcionar como la agenda personal real del usuario."* Y al entrar, sentir:
   *"Esta es mi agenda de hoy."*

   ⚠️ **Ya había una "Agenda" y NO es ésta.** La del Calendario (Fase 3) lista
   los eventos de los próximos días en una tira; ésta es **de UN día**, con su
   línea temporal, sus cosas sin hora, la raya de AHORA y el siguiente pendiente.
   Son dos preguntas distintas —*"¿qué viene?"* y *"¿cómo es mi sábado?"*— y por
   eso conviven; lo que no puede haber es dos fuentes de datos.

   🚨 **Y NO LAS HAY** (apartado 25): *"no crear `agenda_events` y
   `calendar_events` como duplicados"*. Todo lo que sale aquí viene de donde ya
   vivía: los eventos de `agendaCompleta` (HT F6), las tareas de
   `productividad.tareas`, los apuntes de `productividad.apuntes` (E3 F6). Esta
   capa **junta y ordena**; no guarda ni un elemento.

   Por eso el apartado 14 sale gratis: *"completar desde Agenda debe actualizar
   Tareas, Hoy, el progreso diario y las rachas"*. Marcar la tarea la marca en
   todas partes **porque es la misma tarea**.
   =========================================================================== */

import { todayISO, addDays, fechaLocalISO, horaValida } from './helpers';
import { agendaCompleta, minutosAhora } from './hoy';
import { apuntesDe } from './centroDelDia';

/* ── Los tipos que la Agenda sabe enseñar (apartado 5) ─────────────────────

   *"Si proceden de módulos reales. No crear copias independientes."*

   ⚠️ Cada línea dice **de dónde sale** y **si se completa**, que es la
   diferencia del apartado 6: una TAREA se completa; un EVENTO ocurre.

   ⏸ **El pomodoro programado NO está**, y no se finge: las sesiones se hacen en
   el momento, no se ponen a una hora, así que no hay nada que colocar en el día.
   Declararlo con `existe: false` es lo que hace que la pantalla diga la verdad
   en vez de ofrecer un botón muerto (regla 8).

   🐛 **Y el recordatorio SÍ existe, aunque esta fase lo declaró al revés.** Se
   corrigió en la E3 F8: `TIPOS_EVENTO_CALENDARIO` tiene `recordatorio` desde el
   Calendario Universal, así que un recordatorio es **un evento de ese tipo** y
   ya salía aquí como evento. Lo que no existe es un *módulo* de recordatorios
   aparte —y crearlo sería el duplicado que prohíbe el apartado 31 de la F8—.
   Es la lección de siempre: **antes de declarar que algo no existe, mirar si ya
   existe con otro nombre.** */
export const TIPOS_AGENDA = [
  { id: 'evento', nombre: 'Evento', icono: '📅', deDonde: 'calendario y horario', seCompleta: false, existe: true },
  { id: 'tarea', nombre: 'Tarea', icono: '📋', deDonde: 'productividad.tareas', seCompleta: true, existe: true },
  { id: 'apunte', nombre: 'Apunte', icono: '📝', deDonde: 'productividad.apuntes', seCompleta: false, existe: true },
  { id: 'recordatorio', nombre: 'Recordatorio', icono: '🔔', deDonde: 'calendario.eventos (tipo: recordatorio)', seCompleta: false, existe: true },
  { id: 'pomodoro', nombre: 'Pomodoro', icono: '🍅', deDonde: null, seCompleta: false, existe: false,
    porque: 'Las sesiones de Pomodoro no se programan a una hora, así que no hay nada que colocar en el día.' },
];

export const tipoAgenda = (id) => TIPOS_AGENDA.find((t) => t.id === id) || null;
export const tiposDisponibles = () => TIPOS_AGENDA.filter((t) => t.existe);

/* ── Navegar entre días (apartados 1, 21 y 24) ─────────────────────────────
   *"Cambiar de día NO debe perder el contexto"*, y desde el Calendario se abre
   **el día seleccionado**, no siempre hoy. Por eso el día es un parámetro y no
   un estado escondido. */
export const diaAnterior = (fecha) => addDays(fecha, -1);
export const diaSiguiente = (fecha) => addDays(fecha, 1);

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** La tira de días del apartado 2, centrada en el seleccionado. */
export function tiraDeDias(fecha, { antes = 2, despues = 2, hoy = todayISO() } = {}) {
  const salida = [];
  for (let i = -antes; i <= despues; i += 1) {
    const f = addDays(fecha, i);
    const [a, m, d] = f.split('-').map(Number);
    salida.push({
      fecha: f,
      dia: d,
      etiqueta: DIAS_CORTOS[new Date(a, m - 1, d).getDay()],
      seleccionado: f === fecha,
      esHoy: f === hoy,
    });
  }
  return salida;
}

/* ── El día entero (apartados 3, 4, 15, 16, 17, 18 y 19) ───────────────── */

/* 🐛 `horaValida`, no la forma: `'25:99'` encaja con `\d{2}:\d{2}` y daba el
   minuto 1599 — una tarea colocada fuera del día. La lección de EH F11, que
   volvió a pasar aquí y se arregló en la E3 F8. */
const minutosDe = (hhmm) => {
  if (!horaValida(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function agendaDelDia(estado, fecha, opciones = {}) {
  const { hoy = todayISO(), ahora = null, productividad = null, ...resto } = opciones;
  const base = agendaCompleta(estado, fecha, { ...resto, hoy });

  // Apartado 5 — los eventos, tal cual vienen de su fuente.
  const eventos = base.eventos.map((ev) => ({
    ...ev,
    tipoAgenda: 'evento',
    minutos: minutosDe(ev.inicio),
    completable: false,
  }));

  // Las tareas del día. ⚠️ Una tarea PUEDE tener hora y puede no tenerla: con
  // hora entra en la línea temporal, sin hora va a su sección (apartado 4).
  const tareas = (productividad?.tareas || [])
    .filter((t) => t && t.fecha === fecha)
    .map((t) => ({
      id: `tarea:${t.id}`,
      refId: t.id,
      titulo: t.texto || t.titulo || 'Tarea',
      inicio: horaValida(t.hora) ? t.hora : '',
      minutos: minutosDe(t.hora),
      tipoAgenda: 'tarea',
      completable: true,
      hecha: !!t.hecha,
      prioridad: t.prioridad || 'normal',
      modulo: 'productividad',
    }));

  // Los apuntes del día (E3 F6). No tienen hora nunca: son captura.
  const apuntes = apuntesDe(productividad, fecha).map((a) => ({
    id: `apunte:${a.id}`,
    refId: a.id,
    titulo: a.texto,
    inicio: '',
    minutos: null,
    tipoAgenda: 'apunte',
    completable: false,
    modulo: 'productividad',
  }));

  const conHora = [...eventos, ...tareas.filter((t) => t.minutos !== null)]
    .sort((a, b) => (a.minutos ?? 0) - (b.minutos ?? 0));

  // Apartado 4 — *"no todo tiene que tener hora"*. Los todo-el-día del
  // calendario, las tareas sin hora y los apuntes.
  const sinHora = [
    ...base.todoElDia.map((ev) => ({ ...ev, tipoAgenda: 'evento', minutos: null, completable: false })),
    ...tareas.filter((t) => t.minutos === null),
    ...apuntes,
  ];

  /* Apartado 16 — la raya de AHORA, y **solo en el día de hoy**. En un día
     pasado o futuro no significa nada. */
  const esHoy = fecha === hoy;
  const minutosAhoraMismo = esHoy ? minutosAhora(ahora) : null;

  /* Apartado 17 — el siguiente pendiente. *"No utilizar una tarjeta gigante"*:
     esto solo dice CUÁL es; la pantalla decide cómo destacarlo. */
  const proximo = esHoy
    ? conHora.find((e) => e.minutos !== null && e.minutos >= minutosAhoraMismo && !e.hecha) || null
    : null;

  /* Apartado 18 — *"si existen dos eventos a la misma hora, no esconder uno"*.
     Se marcan, y la pantalla los pinta juntos: esconder uno sería perder algo
     que el usuario ha puesto. */
  const porHora = new Map();
  conHora.forEach((e) => porHora.set(e.minutos, (porHora.get(e.minutos) || 0) + 1));
  const conSolape = conHora.map((e) => ({ ...e, solapado: (porHora.get(e.minutos) || 0) > 1 }));

  const total = conHora.length + sinHora.length;
  return {
    fecha,
    esHoy,
    // Apartado 15 — un evento pasado SIGUE VISIBLE, solo se distingue.
    conHora: conSolape.map((e) => ({
      ...e,
      pasado: esHoy && e.minutos !== null && e.minutos < minutosAhoraMismo,
    })),
    sinHora,
    total,
    // Apartado 19 — *"si el día está vacío, no mostrar una lista vacía"*.
    vacio: total === 0,
    ahora: minutosAhoraMismo,
    proximo,
    completables: [...conHora, ...sinHora].filter((e) => e.completable).length,
    hechas: [...conHora, ...sinHora].filter((e) => e.completable && e.hecha).length,
  };
}

/* Los textos del día vacío, con las palabras del apartado 19. */
export const VACIO_AGENDA = {
  titulo: 'Agenda libre',
  explica: 'No tienes nada programado.',
  boton: 'Añadir',
};

/** La cabecera del apartado 1: "Sábado, 29 de agosto", en español y sin
 *  escribir fechas a mano. */
export function tituloDelDia(fecha, hoy = todayISO()) {
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(a, m - 1, d);
  const largo = f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return {
    fecha,
    texto: largo.charAt(0).toUpperCase() + largo.slice(1),
    esHoy: fecha === hoy,
    // ⚠️ "Hoy" es una etiqueta, no un sustituto: la fecha se sigue viendo, que
    // es lo que pide el apartado 1 ("Agenda" y debajo el día).
    etiqueta: fecha === hoy ? 'Hoy' : fecha === addDays(hoy, 1) ? 'Mañana' : fecha === addDays(hoy, -1) ? 'Ayer' : null,
  };
}

/* ⚠️ **Y la fecha se construye SIEMPRE en local.** `fechaLocalISO` está
   importada a propósito y se usa arriba a través de `addDays`: un
   `toISOString()` sobre una medianoche local retrocede un día en España, y aquí
   eso enseñaría la agenda del día equivocado. Sexta vez en este proyecto. */
export const hoyDeLaAgenda = () => fechaLocalISO(new Date());
