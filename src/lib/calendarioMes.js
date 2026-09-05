/* ===========================================================================
   ENTREGA 3 · FASE 8 (HC F3) — CALENDARIO: LA VISTA TEMPORAL
   ===========================================================================

   *"El sistema tiene tres piezas: 🏠 HOY, 📋 AGENDA y 🗓️ CALENDARIO. Las tres
   deben utilizar las mismas entidades y datos. NO crear un calendario
   independiente."*

   Y la mayor parte del Calendario **ya estaba construida** desde el Calendario
   Universal: la cuadrícula del mes, los puntos por tipo, la navegación entre
   meses, el día seleccionado, el detalle, la edición, el buscador, los filtros
   y las recurrencias. Lo que esta fase añade es lo que **faltaba de verdad**:

   1. 🚨 **Las tareas con fecha no salían en el Calendario** (apartados 12 y 14).
      *"Si una tarea tiene fecha: debe aparecer en Calendario."* No aparecían: ni
      un punto en la celda, ni una línea en el día. El Calendario enseñaba solo
      `calendario.eventos` y los derivados, así que una tarea del 29 de agosto
      era invisible hasta abrir la Agenda.
   2. El resumen del día contaba **solo eventos** (apartado 5), y el enunciado lo
      escribe con tareas dentro: *"4 tareas · 2 eventos · 1 recordatorio"*.
   3. No había manera de **crear una tarea desde el Calendario** (apartado 18),
      ni de saltar del día a su **Agenda** (6 y 29) o a **Hoy** (28).
   4. El botón de volver a hoy **solo aparecía fuera del mes actual**, y el
      apartado 10 lo quiere *"siempre accesible"*.

   🚨 **Y NADA DE ESTO GUARDA UNA COPIA** (apartados 30 y 31): *"no crear
   `calendar_tasks` / `calendar_events` si ya existen las entidades globales. El
   calendario es una representación."* Este archivo **lee** los eventos que le
   pasan ya expandidos y las tareas de `productividad.tareas`; no tiene almacén,
   ni normalizador, ni escribe nada. Marcar una tarea desde el Calendario la
   marca en Hoy, en la Agenda y en Productividad **porque es la misma tarea**.
   =========================================================================== */

import { TIPOS_EVENTO_CALENDARIO } from '../tokens';
import { uid, todayISO, horaValida } from './helpers';
import { isoDeFecha, diasDelMes, eventosDelDia, tiposDelDia } from './calendario';

/* ── Qué se puede crear desde el Calendario (apartado 16) ──────────────────

   *"Al pulsar ＋ debe permitir: 📅 Evento · 📋 Tarea · 🔔 Recordatorio. Si el
   usuario está situado en 29 agosto, la fecha debe venir preseleccionada."*

   ⚠️ **Y un recordatorio NO es una entidad nueva**: es un evento del calendario
   con `tipo: 'recordatorio'`, que existe en `TIPOS_EVENTO_CALENDARIO` desde el
   Calendario Universal. Crear una lista de recordatorios aparte sería
   exactamente el duplicado que prohíbe el apartado 31.

   ⏸ **El pomodoro programado del apartado 11 no existe** y no se finge: las
   sesiones de Pomodoro se hacen en el momento, no se ponen a una hora, así que
   no hay nada que colocar en un día (regla 8). */
export const QUE_SE_PUEDE_CREAR = [
  {
    id: 'evento', nombre: 'Evento', icono: '📅', existe: true,
    entidad: 'calendario.eventos',
    comoSeCrea: 'nuevoEventoBase(fecha) → el editor de siempre',
  },
  {
    id: 'tarea', nombre: 'Tarea', icono: '📋', existe: true,
    entidad: 'productividad.tareas',
    comoSeCrea: 'nuevaTareaDeCalendario(texto, fecha, hora) → onAddTarea',
  },
  {
    id: 'recordatorio', nombre: 'Recordatorio', icono: '🔔', existe: true,
    entidad: 'calendario.eventos (tipo: recordatorio)',
    comoSeCrea: 'nuevoEventoBase(fecha) con el tipo ya puesto',
  },
  {
    id: 'pomodoro', nombre: 'Pomodoro programado', icono: '🍅', existe: false,
    entidad: null,
    porque: 'Las sesiones de Pomodoro se hacen en el momento; no se programan a una hora, así que no hay nada que colocar en un día.',
  },
];

export const sePuedeCrear = () => QUE_SE_PUEDE_CREAR.filter((x) => x.existe);
export const queSeCrea = (id) => QUE_SE_PUEDE_CREAR.find((x) => x.id === id) || null;

/* ── La forma real de una tarea ────────────────────────────────────────────

   ⚠️ **Es la de Productividad, no una nueva.** `{ id, texto, fecha, hora,
   hecha }` — los mismos campos que crea `ProductivityView`, para que la tarea
   nacida en el Calendario sea indistinguible de cualquier otra. Añadir aquí un
   campo `origen: 'calendario'` la convertiría en una tarea de segunda que el
   resto de la aplicación no sabría leer. */
export function nuevaTareaDeCalendario(texto, fecha, hora = '') {
  const limpio = String(texto || '').trim();
  if (!limpio) return null;
  return {
    id: uid(),
    texto: limpio,
    fecha,
    /* ⚠️ La hora es OPCIONAL (apartado 18: *"Hora opcional"*), y sin ella la
       tarea va a la sección "Sin hora" de la Agenda (apartado 14).
       🐛 Y se valida con `horaValida`, no con la forma: `'25:99'` encaja con
       `\d{2}:\d{2}` y colocaba la tarea en el minuto 1599, fuera del día. */
    hora: horaValida(hora) ? hora : '',
    hecha: false,
  };
}

/* ── Las tareas de un día (apartados 12 y 14) ──────────────────────────────
   Se leen de `productividad.tareas` tal cual. Ni se copian ni se reescriben:
   lo que sale de aquí lleva `refId`, que es el id de LA tarea, para que
   completarla llame a `toggleTarea` sobre la original. */
export function tareasDelDia(productividad, fechaISO) {
  return (productividad?.tareas || [])
    .filter((t) => t && t.fecha === fechaISO)
    .map((t) => ({
      id: `tarea:${t.id}`,
      refId: t.id,
      titulo: t.texto || 'Tarea',
      hora: horaValida(t.hora) ? t.hora : '',
      hecha: !!t.hecha,
      esTarea: true,
    }))
    .sort((a, b) => {
      if (!a.hora && b.hora) return 1;
      if (a.hora && !b.hora) return -1;
      return a.hora.localeCompare(b.hora);
    });
}

/* ── Los indicadores de una celda (apartados 2, 3 y 14) ────────────────────

   *"No escribir títulos completos dentro de cada día"*: puntos. El del tipo
   `tarea` es el que faltaba —🟢 en el enunciado—, y va **el último** para que
   añadirlo no mueva de sitio los que ya había.

   ⚠️ Tres como mucho, igual que antes: una celda de un móvil no aguanta más, y
   un punto de más no dice nada que el resumen del día no diga mejor. Por eso,
   **cuando hay tareas se les reserva su hueco**: sin eso, un día con tres tipos
   de evento se comería el punto verde y las tareas volverían a ser invisibles,
   que es justo lo que esta fase viene a arreglar.

   ⚠️ Y los tipos de evento salen de `tiposDelDia`, la función que ya hacía esto
   desde el Calendario Universal: aquí solo se le añade el punto que faltaba. */
export const TOPE_INDICADORES = 3;

export function indicadoresDelDia(eventos, fechaISO, productividad = null) {
  const hayTareas = tareasDelDia(productividad, fechaISO).length > 0;
  const tipos = tiposDelDia(eventos, fechaISO).slice(0, TOPE_INDICADORES - (hayTareas ? 1 : 0));
  return hayTareas ? [...tipos, 'tarea'] : tipos;
}

/* ── El resumen del día seleccionado (apartado 5) ──────────────────────────

   *"4 tareas · 2 eventos · 1 recordatorio"*. Las tareas primero, como en el
   enunciado, y después los tipos de evento en el orden fijo del catálogo —para
   que el resumen no salte de orden según qué se creó antes.

   ⚠️ Devuelve `null` si el día no tiene nada: un *"0 tareas · 0 eventos"* sería
   anunciar tres ceros, que es lo que la E3 F6 ya decidió no hacer. */
export function resumenDeDia(eventos, fechaISO, productividad = null) {
  const evs = eventosDelDia(eventos, fechaISO);
  const tareas = tareasDelDia(productividad, fechaISO);
  if (evs.length === 0 && tareas.length === 0) return null;

  const partes = [];
  if (tareas.length > 0) partes.push(`${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'}`);
  TIPOS_EVENTO_CALENDARIO.forEach((t) => {
    const n = evs.filter((e) => e.tipo === t.id).length;
    if (n > 0) partes.push(`${n} ${n === 1 ? t.label.toLowerCase() : t.labelPlural}`);
  });
  return partes.join(' · ');
}

/* ── La carga del día (apartado 23) ────────────────────────────────────────

   *"Opcionalmente mostrar de manera muy ligera: Día ocupado / Día normal / Día
   libre. Basado en cantidad de elementos. No convertirlo en un sistema de
   puntuación complejo."*

   Así que son **tres estados y un umbral**, no una nota. ⚠️ Y cada uno lleva
   **icono y palabra**, nunca solo un color: la lección de EH F42 —quien no
   distingue los colores no puede leer un semáforo—. */
export const CARGAS = [
  { id: 'libre', nombre: 'Día libre', icono: '○', desde: 0 },
  { id: 'normal', nombre: 'Día normal', icono: '◐', desde: 1 },
  { id: 'ocupado', nombre: 'Día ocupado', icono: '●', desde: 5 },
];

export function cargaDelDia(eventos, fechaISO, productividad = null) {
  const n = eventosDelDia(eventos, fechaISO).length + tareasDelDia(productividad, fechaISO).length;
  // De más cargado a menos: el primero cuyo umbral se alcanza.
  const carga = [...CARGAS].reverse().find((c) => n >= c.desde) || CARGAS[0];
  return { ...carga, elementos: n };
}

/* ── Hoy, y que se note aunque esté seleccionado (apartado 4) ──────────────

   *"Hoy debe destacarse claramente. No depender únicamente del color."*

   🐛 Y había un hueco real: la celda de hoy llevaba borde y negrita, **pero el
   borde solo se pintaba si no estaba seleccionada**. Como al entrar el día
   seleccionado ES hoy, la marca desaparecía justo en el caso más común, y hoy
   se veía igual que cualquier otro día tocado.

   `marcaDeHoy` devuelve las tres cosas que el apartado pide —tipografía, marca
   y su nombre para el lector de pantalla— **también cuando está seleccionado**. */
export const MARCAS_DE_HOY = ['borde', 'tipografia', 'punto'];

export function marcaDeHoy(fechaISO, { hoy = todayISO(), seleccionado = null } = {}) {
  const esHoy = fechaISO === hoy;
  const estaSeleccionado = fechaISO === seleccionado;
  return {
    esHoy,
    // El borde solo tiene sentido cuando el fondo no es ya el acento.
    borde: esHoy && !estaSeleccionado,
    // ⚠️ La negrita y la marca se quedan SIEMPRE que sea hoy.
    negrita: esHoy || estaSeleccionado,
    punto: esHoy,
    etiqueta: esHoy ? 'Hoy' : null,
  };
}

/* ── El rango que se pide (apartado 39) ────────────────────────────────────
   *"No cargar infinitos meses. Cargar bajo demanda. Utilizar rangos de
   fechas."* El mes visible, y nada más. */
export function rangoDelMes(anio, mes) {
  return { desde: isoDeFecha(anio, mes, 1), hasta: isoDeFecha(anio, mes, diasDelMes(anio, mes)) };
}

/* ── El mes vacío (apartado 38) ────────────────────────────────────────────
   *"Tu calendario está libre ✨ / No tienes nada programado para este periodo.
   / ＋ Añadir"*, con sus palabras. */
export const VACIO_MES = {
  titulo: 'Tu calendario está libre ✨',
  explica: 'No tienes nada programado para este periodo.',
  boton: 'Añadir',
};

/** ¿Hay algo en todo el mes? Para decidir entre la cuadrícula normal y el
 *  texto del apartado 38 — sin recorrer nada que no sea el mes pedido. */
export function mesVacio(eventos, anio, mes, productividad = null) {
  const { desde, hasta } = rangoDelMes(anio, mes);
  if (eventos.some((e) => e.fecha >= desde && e.fecha <= hasta)) return false;
  return !(productividad?.tareas || []).some((t) => t && t.fecha >= desde && t.fecha <= hasta);
}

/* ── Los accesos del día (apartados 28 y 29) ───────────────────────────────

   *"Si se selecciona la fecha actual: 🏠 Ver Hoy. Si se selecciona cualquier
   fecha: 📋 Ver Agenda."*

   ⚠️ **Ver Agenda abre el día SELECCIONADO** (apartados 7 y 24): *"no volver
   automáticamente a hoy"*. Como la Agenda de un día (E3 F7) ya recibe la fecha
   como parámetro, esto es cambiar de pestaña, no navegar a otro sitio. */
export function accesosDelDia(fechaISO, hoy = todayISO()) {
  const accesos = [{ id: 'agenda', nombre: 'Ver Agenda', icono: '📋', vista: 'dia' }];
  if (fechaISO === hoy) accesos.unshift({ id: 'hoy', nombre: 'Ver Hoy', icono: '🏠', tab: 'hoy' });
  return accesos;
}

/* ── Lo que esta fase NO hace (apartado 41) ────────────────────────────────
   Está escrito para que una fase futura no lo dé por pendiente sin querer: son
   decisiones del enunciado, no cosas a medias. */
export const NO_EN_ESTA_FASE = [
  { que: 'Google Calendar y Outlook', porque: 'El apartado 41 los excluye expresamente; son la HC F7.' },
  { que: 'Planificación automática con IA', porque: 'El apartado 41 la excluye, y la regla 7 dice que la IA no se dispara sola.' },
  { que: 'Sistema avanzado de recurrencias', porque: 'El apartado 15 pide reutilizar el que ya existe, y existe: `expandirRecurrentes`.' },
  { que: 'Compartición y calendarios colaborativos', porque: 'El apartado 41 los excluye; JosStyle es de una persona.' },
  { que: 'Vista semanal', porque: 'El apartado 22 la deja opcional y pide no sacrificar estabilidad; es la HC F5.' },
  { que: 'Arrastrar y soltar', porque: 'El apartado 21 dice que en móvil no se dependa de ello, y EH F50 prohíbe que una acción dependa de un gesto.' },
];
