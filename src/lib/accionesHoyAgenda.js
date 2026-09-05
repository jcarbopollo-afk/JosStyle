/* ===========================================================================
   ENTREGA 3 · FASE 9 (HC F4) — ACCIONES RÁPIDAS ENTRE HOY, AGENDA Y CALENDARIO
   ===========================================================================

   🐛 **Este archivo NO se llama `accionesRapidas.js`, y hay un motivo:** ese
   nombre ya es de **EH F61**, que hace otra cosa (las acciones rápidas de
   Estilo de hombre) y está congelado. Escribirlo encima se llevó por delante
   310 líneas suyas antes de que git lo cantara. Es la lección de siempre —
   *antes de llamar a algo, mirar si ese nombre ya significa otra cosa*— esta
   vez sobre un **fichero**, no sobre una función.


   *"La prioridad ahora es conseguir que el usuario pueda pasar de una pantalla
   a otra y modificar su planificación sin sentir que está utilizando sistemas
   diferentes."*

   Las tres pantallas ya existen —🏠 Hoy (E3 F6), 📋 Agenda (E3 F7) y 🗓️
   Calendario (E3 F8)— y **ya comparten la fuente de verdad**: completar desde
   cualquiera de ellas llama a `toggleTarea`, y crear una tarea a `addTarea`.
   Los apartados 10, 17, 18 y 29 salen de ahí sin código nuevo.

   Lo que falta, y es lo que trae esta fase:

   1. 🚨 **UN SOLO ＋** (apartados 1 y 30): *"crear un componente reutilizable…
      no duplicar formularios"*. La E3 F8 dejó el selector y la tarea rápida
      **dentro de `CalendarView`**, así que Hoy y la Agenda no los tenían. Aquí
      se sacan a `src/components/quickAdd.jsx` y las tres pantallas usan el
      mismo.
   2. **El contexto de fecha y hora** (2, 3, 4, 26 y 27): desde Hoy la fecha es
      hoy; desde la Agenda, el día que se está mirando; desde el Calendario, el
      día seleccionado. *"No obligar a seleccionar nuevamente la fecha."*
   3. **Las acciones contextuales `•••`** (apartado 8): *"mostrar solamente las
      acciones relevantes… no mostrar opciones inútiles"*.
   4. **Cambiar fecha y cambiar hora** (11 y 12), que solo existían para eventos.
   5. **El aviso pequeño con Deshacer** (14 y 19): *"no usar modales grandes
      para acciones normales"*.
   6. **Las validaciones** (32): título obligatorio, y la hora de fin nunca
      antes que la de inicio.

   🚨 **Y NADA DE ESTO CREA UNA ENTIDAD NUEVA** (apartados 17 y 18): cada tipo
   dice en qué colección de verdad escribe, y quien escribe sigue siendo
   `App.jsx`. Este archivo **decide y valida**; no guarda.
   =========================================================================== */

import { uid, todayISO, horaValida, fechaValida } from './helpers';

/* ── Qué se puede añadir, y desde dónde (apartados 1 y 30) ─────────────────

   *"Opciones principales: 📋 Tarea · 📅 Evento · 🔔 Recordatorio · 📝 Apunte.
   Si existen otras entidades compatibles actualmente, pueden aparecer. No
   añadir funcionalidades futuras que todavía no estén implementadas."*

   ⚠️ Las cuatro **existen de verdad**, y cada línea dice dónde escribe:
   - la tarea y el apunte, en `productividad`;
   - el evento y el recordatorio, en `calendario.eventos` — un recordatorio es
     un evento de tipo `recordatorio`, no una entidad aparte (E3 F8).

   ⏸ **El apunte no se puede crear desde el Calendario**, y no es un olvido: un
   apunte es *"escribe algo que no quieras olvidar"* de **hoy** (E3 F6,
   apartado 17), y el Calendario está mirando un día cualquiera. Cada línea
   declara sus pantallas. */
export const TIPOS_QUICKADD = [
  {
    id: 'tarea', nombre: 'Tarea', icono: '📋', existe: true,
    escribeEn: 'productividad.tareas',
    en: ['hoy', 'agenda', 'calendario'],
    conHora: true,
  },
  {
    id: 'evento', nombre: 'Evento', icono: '📅', existe: true,
    escribeEn: 'calendario.eventos',
    en: ['hoy', 'agenda', 'calendario'],
    conHora: true,
  },
  {
    id: 'recordatorio', nombre: 'Recordatorio', icono: '🔔', existe: true,
    escribeEn: 'calendario.eventos (tipo: recordatorio)',
    en: ['hoy', 'agenda', 'calendario'],
    conHora: true,
  },
  {
    id: 'apunte', nombre: 'Apunte', icono: '📝', existe: true,
    escribeEn: 'productividad.apuntes',
    // ⚠️ Solo donde el día es HOY: un apunte no se programa (E3 F6).
    en: ['hoy', 'agenda'],
    conHora: false,
    soloHoy: true,
  },
];

export const tipoQuickAdd = (id) => TIPOS_QUICKADD.find((t) => t.id === id) || null;

/* Qué ofrece el ＋ en cada pantalla y para cada día (apartados 1, 2, 3 y 4).
   *"El contenido del menú dependerá del contexto."* */
export function opcionesDeAdd(pantalla, fecha, hoy = todayISO()) {
  return TIPOS_QUICKADD.filter((t) => t.existe && t.en.includes(pantalla) && (!t.soloHoy || fecha === hoy));
}

/* ── El contexto: qué fecha y qué hora vienen puestas ──────────────────────

   Apartado 2: *"si el usuario está en Hoy… fecha = hoy. No obligar a
   seleccionar nuevamente la fecha."*
   Apartado 3: *"si está viendo 15 septiembre… la tarea debe crearse para el 15
   de septiembre. Si además ha seleccionado 16:00, la hora debe preseleccionarse
   cuando corresponda."*

   ⚠️ **"Cuando corresponda"**: un apunte no tiene hora, así que no se la pone
   aunque venga en el contexto. */
export function contextoDeAdd(pantalla, { fecha = null, hora = null, hoy = todayISO() } = {}) {
  const dia = pantalla === 'hoy' ? hoy : (fecha || hoy);
  return {
    pantalla,
    fecha: dia,
    hora: horaValida(hora) ? hora : '',
    opciones: opcionesDeAdd(pantalla, dia, hoy),
  };
}

/** La hora que le toca a cada tipo dentro de un contexto (apartados 3 y 26). */
export function horaParaTipo(contexto, tipoId) {
  const tipo = tipoQuickAdd(tipoId);
  if (!tipo || !tipo.conHora) return '';
  return contexto.hora || '';
}

/* ── Las acciones de cada elemento (apartado 8) ────────────────────────────

   *"Mostrar solamente las acciones relevantes… No mostrar opciones inútiles."*
   El enunciado da los dos ejemplos y aquí están tal cual: una tarea se
   completa; un evento **no**, porque un evento ocurre (E3 F7, apartado 6).

   ⚠️ `destructiva` marca la única que pide confirmación. Un aviso delante de
   cada toque enseña a no leer los avisos (EH F61, apartado 11). */
export const ACCIONES_ELEMENTO = [
  { id: 'completar', nombre: 'Completar', icono: '✓', para: ['tarea'], destructiva: false },
  { id: 'editar', nombre: 'Editar', icono: '✎', para: ['tarea', 'evento'], destructiva: false },
  { id: 'fecha', nombre: 'Cambiar fecha', icono: '📅', para: ['tarea', 'evento'], destructiva: false },
  { id: 'hora', nombre: 'Cambiar hora', icono: '🕒', para: ['tarea', 'evento'], destructiva: false },
  { id: 'eliminar', nombre: 'Eliminar', icono: '🗑', para: ['tarea', 'evento', 'apunte'], destructiva: true },
];

/* ⚠️ Un apunte solo se puede eliminar: no tiene hora, no se completa (E3 F7,
   apartado 6) y su texto se edita borrándolo y escribiéndolo otra vez, que es
   como lo dejó la E3 F6. Ofrecerle "cambiar hora" sería una opción inútil. */
export function accionesDe(elemento) {
  if (!elemento || !elemento.tipo) return [];
  // ⚠️ Un elemento de solo lectura (los derivados de otros módulos) no se toca
  // desde aquí: se abre su módulo, que es donde vive.
  if (elemento.soloLectura) return [];
  return ACCIONES_ELEMENTO.filter((a) => a.para.includes(elemento.tipo));
}

/* ── Validaciones (apartado 32) ────────────────────────────────────────────

   *"Evento: hora fin no puede ser anterior a inicio. Tarea: título obligatorio.
   Fecha: formato válido. No permitir guardar datos claramente inválidos."*

   ⚠️ Devuelven **el motivo**, no un booleano: el apartado 21 pide que un error
   diga qué corregir, y EH F62 lo tiene escrito como regla —nunca *"Error"* a
   secas—. `null` significa que está bien.

   🐛 **Y la fecha se valida con `fechaValida`, no con su forma**: `'2026-13-45'`
   encaja con `\d{4}-\d{2}-\d{2}` y no es un día. Guardarla dejaba la tarea
   invisible en las tres pantallas, porque ningún día coincide con ella. Es la
   cuarta vez de esta lección, tras `'25:99'`. */

export function validarTarea({ texto, fecha, hora } = {}) {
  if (!String(texto || '').trim()) return 'Escribe un título para la tarea.';
  if (!fechaValida(fecha)) return 'La fecha no es válida. Usa un día que exista, como 2026-09-15.';
  if (hora && !horaValida(hora)) return 'La hora no existe. Usa un formato como 16:00.';
  return null;
}

export function validarEvento({ titulo, fecha, horaInicio, horaFin, todoElDia } = {}) {
  if (!String(titulo || '').trim()) return 'Escribe un título para el evento.';
  if (!fechaValida(fecha)) return 'La fecha no es válida. Usa un día que exista, como 2026-09-15.';
  if (todoElDia) return null;
  if (horaInicio && !horaValida(horaInicio)) return 'La hora de inicio no existe. Usa un formato como 16:00.';
  if (horaFin && !horaValida(horaFin)) return 'La hora de fin no existe. Usa un formato como 17:30.';
  // 🚨 El caso que nombra el enunciado.
  if (horaValida(horaInicio) && horaValida(horaFin) && horaFin < horaInicio) {
    return 'La hora de fin es anterior a la de inicio.';
  }
  return null;
}

export function validarApunte({ texto } = {}) {
  if (!String(texto || '').trim()) return 'Escribe algo antes de guardar.';
  return null;
}

/* ── Cambiar fecha y cambiar hora (apartados 11 y 12) ──────────────────────

   *"Si se modifica una fecha… actualizar inmediatamente Calendario, Agenda y
   Hoy. Si el nuevo día no es hoy: desaparece de Hoy."*

   🚨 **Eso sale gratis y por la misma razón de siempre**: no hay copia. Se
   cambia el campo de la tarea original y las tres pantallas la leen de ahí, así
   que "desaparece de Hoy" no hay que programarlo — deja de cumplir el filtro.

   ⚠️ Estas funciones devuelven **la tarea cambiada**, no el estado: quien
   escribe es `App.jsx`, que es el dueño del almacén. Y validan antes: mover una
   tarea a "2026-13-45" sería guardar una mentira. */
export function tareaEnFecha(tarea, fecha) {
  if (!tarea || !fechaValida(fecha)) return null;
  return { ...tarea, fecha };
}

export function tareaEnHora(tarea, hora) {
  if (!tarea) return null;
  // ⚠️ Vaciar la hora ES una operación válida: la tarea pasa a "Sin hora"
  // (E3 F7, apartado 4). Lo que no vale es una hora imposible.
  if (hora === '' || hora === null) return { ...tarea, hora: '' };
  if (!horaValida(hora)) return null;
  return { ...tarea, hora };
}

/* ── El aviso pequeño (apartados 14 y 19) ──────────────────────────────────

   *"Cuando una acción se complete: mostrar feedback pequeño. Ejemplo:
   ✓ Tarea añadida / ✓ Evento actualizado / ✓ Tarea completada. No usar modales
   grandes para acciones normales."*

   Y el 14: *"después de eliminar, mostrar brevemente: Elemento eliminado ·
   Deshacer"*.

   ⚠️ **Deshacer solo se ofrece donde de verdad se puede deshacer.** JosStyle
   tiene dos mecanismos: el histórico de diez pasos de `snapshotAndSave` y la
   papelera de ME F3. Un borrado pasa por los dos, así que `deshacer: true`;
   una creación no necesita botón, porque el elemento se ve y se puede borrar. */
export const AVISOS_ACCION = {
  tarea_creada: { texto: 'Tarea añadida', deshacer: false },
  evento_creado: { texto: 'Evento añadido', deshacer: false },
  recordatorio_creado: { texto: 'Recordatorio añadido', deshacer: false },
  apunte_creado: { texto: 'Apunte guardado', deshacer: false },
  tarea_completada: { texto: 'Tarea completada', deshacer: false },
  tarea_pendiente: { texto: 'Tarea marcada como pendiente', deshacer: false },
  fecha_cambiada: { texto: 'Fecha cambiada', deshacer: true },
  hora_cambiada: { texto: 'Hora cambiada', deshacer: true },
  eliminado: { texto: 'Elemento eliminado', deshacer: true },
};

export const avisoDe = (id) => AVISOS_ACCION[id] || null;

/** Segundos que el aviso se queda en pantalla. *"Mostrar brevemente"*, y con
 *  tiempo suficiente para leerlo y pulsar Deshacer con el pulgar. */
export const SEGUNDOS_AVISO = 5;

/* ── Lo que esta fase NO hace (apartado 37) ────────────────────────────────
   Escrito para que una fase futura no lo dé por pendiente sin querer. */
export const NO_EN_ESTA_FASE = [
  { que: 'Google Calendar, Outlook y calendarios externos', porque: 'El apartado 37 los excluye; son la HC F7.' },
  { que: 'IA y planificación automática', porque: 'El apartado 37 las excluye, y la regla 7 dice que la IA no se dispara sola.' },
  { que: 'Sugerencias automáticas de horarios', porque: 'El apartado 37 las excluye expresamente.' },
  { que: 'Recurrencias en las acciones rápidas', porque: 'El apartado 25 pide prepararlas, no implementarlas: el motor es `expandirRecurrentes` y se edita desde el evento.' },
  { que: 'Colaboración', porque: 'El apartado 37 la excluye; JosStyle es de una persona.' },
];

/* ── Lo que ya estaba, y por qué no se rehace (apartados 10, 17, 18 y 29) ──

   El enunciado pide varias cosas que **ya funcionan**, y rehacerlas sería
   crear el segundo sistema que la propia fase prohíbe. Se declaran con la
   función real que las resuelve, como `SISTEMAS_EH` en EH F39 o `YA_CONSTRUIDO`
   en EH F40: si alguien renombra una, esto deja de compilar. */
export const YA_RESUELTO = [
  { apartado: 10, que: 'Completar se sincroniza en las tres pantallas', con: 'toggleTarea — es la misma tarea, no hay copia (E3 F6, F7 y F8)' },
  { apartado: 13, que: 'Eliminar se sincroniza', con: 'eliminarConPapelera — la única puerta de borrado (ME F3)' },
  { apartado: 14, que: 'Deshacer existe', con: 'el histórico de diez pasos de snapshotAndSave + la papelera de ME F3' },
  { apartado: 15, que: 'Cambiar de día no pierde el contexto', con: 'el día es un parámetro de agendaDelDia y el `seleccionado` del Calendario (E3 F7 y F8)' },
  { apartado: 17, que: 'Los accesos entre las tres pantallas', con: 'accesosDelDia (E3 F8) y navegarDesdeHoy (EH F28)' },
  { apartado: 22, que: 'La sincronización con Supabase', con: 'saveData desde App.jsx, sin recarga completa' },
  { apartado: 24, que: 'La zona horaria', con: 'fechaLocalISO y todayISO — nunca toISOString (seis veces)' },
];

/* ⚠️ **El apartado 23 sigue sin poder cumplirse del todo, y está dicho.**
   *"Si dos dispositivos modifican el mismo elemento: respetar la estrategia de
   sincronización existente… como mínimo, evitar sobrescribir datos sin
   control."* Hoy el último en escribir gana, porque `app_data` no guarda una
   versión (EH F41, F45, F46 y F54). Esta fase **no lo empeora** —cada acción
   toca un elemento, no el paquete entero— pero tampoco lo resuelve: haría falta
   una columna nueva, y eso lo decide Josué. */
export const CONFLICTO_ENTRE_DISPOSITIVOS = {
  detectable: false,
  porque: 'app_data no guarda una versión, así que el último en escribir gana. Haría falta una columna nueva y lo decide Josué.',
  loQueSeHace: 'Cada acción rápida cambia un elemento concreto, nunca reescribe el módulo entero.',
};

/* ── La fábrica de un evento rápido (apartados 5 y 17) ─────────────────────

   ⚠️ **Devuelve un evento del Calendario, con TODOS sus campos.** El formulario
   rápido solo pregunta tres cosas, pero lo que se guarda tiene que tener la
   forma completa: un evento a medias lo recorta el normalizador en el siguiente
   guardado (regla 5, y van diecinueve veces).

   ⚠️ Y `origen: 'calendario'` es lo que le da su editor completo: un evento sin
   ese campo saldría como derivado y de solo lectura. */
export function eventoDesdeQuickAdd({ titulo, fecha, horaInicio, horaFin, tipo = 'personal' } = {}) {
  if (validarEvento({ titulo, fecha, horaInicio, horaFin })) return null;
  return {
    id: uid(),
    titulo: String(titulo).trim(),
    tipo,
    fecha,
    todoElDia: false,
    horaInicio: horaValida(horaInicio) ? horaInicio : '',
    horaFin: horaValida(horaFin) ? horaFin : '',
    ubicacion: '',
    notas: '',
    recurrencia: null,
    estado: 'activo',
    origen: 'calendario',
    origenId: null,
  };
}
