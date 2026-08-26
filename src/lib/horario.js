// ============================================================================
// HT · Fase 1/12 — ARQUITECTURA GENERAL DE HORARIO TOP
//
// *"Al finalizar la Fase 1 debe quedar definida la arquitectura conceptual
// completa. No estamos construyendo todavía la interfaz definitiva, la base de
// datos definitiva, el editor definitivo, la mochila, las notificaciones ni la
// IA. Estamos estableciendo cómo debe funcionar todo el ecosistema antes de
// empezar a construirlo."* (apartado 31)
//
// En este proyecto "arquitectura definida" ha significado siempre lo mismo —
// AR F1, FO F1, RA F1—: **un módulo puro y probado**, no un documento. Un
// documento se contradice con el código en la segunda fase; un modelo con 200
// comprobaciones no puede. Así que aquí está el ecosistema entero **como
// código**, sin una sola pantalla.
//
// ── LOS DOS CONCEPTOS QUE NO SE PUEDEN MEZCLAR (apartados 2 y 5) ───────────
//
//   EL HORARIO      — lo que ocurre NORMALMENTE. "Los martes a las 10:00 hay
//                     Biología." Es una regla, no un hecho.
//   LO QUE PASA     — lo que ocurre UN DÍA CONCRETO. "El martes 15 no hubo
//                     Biología." "El martes 22 fue a las 12:00."
//
// Son cosas distintas y se guardan aparte. Materializar el horario en eventos
// —crear 40 "Biología" para el curso— haría que cambiar la hora de la clase
// obligara a editar 40 filas, y que un festivo tuviera que borrarlas a mano. Es
// exactamente el error que el proyecto ya evitó en el Calendario (regla 11:
// *"nunca materializar ocurrencias de un evento recurrente"*).
//
// Aquí se resuelve igual: la regla base vive en `bloques`, los cambios puntuales
// en `excepciones`, y `resolverDia()` los compone al vuelo.
//
// ── LA REGLA QUE MÁS DECIDE (apartado 25) ──────────────────────────────────
//
// *"El mismo dato no debería tener que introducirse varias veces. Si el usuario
// crea Biología, no debería tener que volver a escribir «Biología» para
// Horario, Tareas, Exámenes, Mochila y Estudios."*
//
// **Y JosStyle ya tiene las asignaturas de Josué**, en `estudios.asignaturas`
// desde la Fase 6. Así que una actividad de horario **no las copia: apunta a
// ellas** por `asignaturaId`. Sin eso habría dos "Biología" —una en Estudios y
// otra en Horario— y ningún examen podría enlazarse con su clase.
//
// Las actividades que no son asignaturas (entrenamiento, trabajo, rutina) sí son
// propias, porque no existen en ningún otro sitio.
//
// ── LO QUE ESTA FASE NO HACE, Y ES DELIBERADO ──────────────────────────────
//
// Sin interfaz, sin editor, sin mochila, sin notificaciones y sin IA. Lo que sí
// hay es el punto de enganche de cada una, identificado y con su función:
// `materialDelDia` (mochila), `avisosDelDia` (notificaciones) y `contextoIA`.
// ============================================================================

import { uid, todayISO, addDays } from './helpers';

/* ===========================================================================
   1 · TIPOS DE HORARIO (apartado 4)
   ===========================================================================
   *"El sistema no debe asumir que únicamente existe el horario escolar."*

   El tipo no cambia la mecánica —todos son columnas, filas y bloques— sino lo
   que la interfaz ofrece por defecto. Un horario de entrenamiento no necesita
   aula ni profesor. */
export const TIPOS_HORARIO = [
  { id: 'escolar', label: 'Clases', icono: 'estudios', conAsignaturas: true },
  { id: 'entrenamiento', label: 'Entrenamiento', icono: 'entreno', conAsignaturas: false },
  { id: 'estudio', label: 'Estudio', icono: 'estudios', conAsignaturas: true },
  { id: 'trabajo', label: 'Trabajo', icono: 'negocio', conAsignaturas: false },
  { id: 'rutina', label: 'Rutina', icono: 'productividad', conAsignaturas: false },
  { id: 'personalizado', label: 'Personalizado', icono: 'calendario', conAsignaturas: false },
];

export const tipoHorario = (id) => TIPOS_HORARIO.find((t) => t.id === id) || TIPOS_HORARIO[TIPOS_HORARIO.length - 1];

/* Apartado 15 — las prioridades. No son decoración: son lo que permitirá que HOY
   *"no muestre simplemente una lista enorme"*. El peso es lo que ordenará. */
export const PRIORIDADES = [
  { id: 'baja', label: 'Baja', peso: 0 },
  { id: 'normal', label: 'Normal', peso: 1 },
  { id: 'alta', label: 'Alta', peso: 2 },
  { id: 'urgente', label: 'Urgente', peso: 3 },
];

export const prioridad = (id) => PRIORIDADES.find((p) => p.id === id) || PRIORIDADES[1];
export const pesoPrioridad = (id) => prioridad(id).peso;

/* ===========================================================================
   2 · COLUMNAS Y FILAS (apartados 6, 7 y 8)
   ===========================================================================
   *"La cuadrícula será un editor, no una imagen estática."* Y sobre todo:
   *"el sistema no dependerá obligatoriamente de esos nombres [Lunes…Domingo].
   En un horario personalizado podrían representar Persona 1, Semana A,
   Proyecto 1."*

   De ahí la pieza clave del modelo: **una columna guarda su `dia` aparte de su
   nombre.** `dia` es 1–7 (lunes a domingo) cuando la columna representa un día
   real, y `null` cuando no —"Semana A", "Persona 2"—.

   Eso es lo que permite las dos cosas a la vez: que `resolverDia()` sepa qué
   columna toca en una fecha, y que un horario que no va por días siga siendo
   posible. Sin ese campo habría que adivinar el día por el nombre, y "Semana A"
   no es ningún día. */

export const DIAS_SEMANA = [
  { dia: 1, label: 'Lunes', corto: 'L' },
  { dia: 2, label: 'Martes', corto: 'M' },
  { dia: 3, label: 'Miércoles', corto: 'X' },
  { dia: 4, label: 'Jueves', corto: 'J' },
  { dia: 5, label: 'Viernes', corto: 'V' },
  { dia: 6, label: 'Sábado', corto: 'S' },
  { dia: 7, label: 'Domingo', corto: 'D' },
];

/** El día de la semana (1–7, lunes primero) de una fecha local. */
export function diaDeFecha(fechaISO) {
  const d = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  // `getDay()` da 0 para domingo; en España la semana empieza en lunes.
  return ((d.getDay() + 6) % 7) + 1;
}

export function crearColumna({ nombre = '', dia = null } = {}) {
  // El día se valida ANTES de usarlo para el nombre. Con `dia: 9` —truthy pero
  // fuera de rango— la versión anterior indexaba `DIAS_SEMANA[8]` y reventaba.
  const valido = Number.isInteger(dia) && dia >= 1 && dia <= 7 ? dia : null;
  return {
    id: uid(),
    nombre: (nombre || '').trim() || (valido ? DIAS_SEMANA[valido - 1].label : 'Columna'),
    dia: valido,
  };
}

/**
 * Una fila es una franja horaria. *"Tampoco se limitarán a una hora fija: 30,
 * 45, 50, 60 minutos o franjas personalizadas"* (apartado 8), así que se guarda
 * **inicio y fin**, no una hora suelta con una duración implícita. Con solo la
 * hora de inicio, un recreo de 20 minutos entre clases de 50 no se podría
 * representar sin inventarse una duración.
 */
export const crearFila = ({ inicio = '08:00', fin = '09:00', etiqueta = '' } = {}) => ({
  id: uid(),
  inicio: normalizarHora(inicio) || '08:00',
  fin: normalizarHora(fin) || '09:00',
  etiqueta: (etiqueta || '').trim(),
});

/** `HH:MM` o nada. Se compara como texto, que para `HH:MM` ordena bien. */
export function normalizarHora(h) {
  const m = String(h || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return '';
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return '';
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Minutos desde medianoche. Para duraciones y solapamientos. */
export const minutosDe = (h) => {
  const n = normalizarHora(h);
  if (!n) return null;
  const [hh, mm] = n.split(':').map(Number);
  return hh * 60 + mm;
};

export const duracionMinutos = (inicio, fin) => {
  const a = minutosDe(inicio);
  const b = minutosDe(fin);
  return a === null || b === null || b <= a ? 0 : b - a;
};

/** La rejilla que se ofrece al empezar: lunes a viernes, 08:00–14:00 (apartado 6). */
export function cuadriculaInicial() {
  const columnas = [1, 2, 3, 4, 5].map((dia) => crearColumna({ dia }));
  const filas = [];
  for (let h = 8; h < 14; h++) {
    filas.push(crearFila({ inicio: `${String(h).padStart(2, '0')}:00`, fin: `${String(h + 1).padStart(2, '0')}:00` }));
  }
  return { columnas, filas };
}

/* ===========================================================================
   3 · LAS ENTIDADES (apartado 12)
   ===========================================================================
   *"HORARIO — contenedor. BLOQUE — instancia temporal. ASIGNATURA/ACTIVIDAD —
   entidad reutilizable. EVENTO — acontecimiento concreto."*

   Separadas de verdad, y en listas planas en vez de anidadas. Un bloque guarda
   `horarioId` y `actividadId` en vez de vivir dentro de su horario, por lo mismo
   que un outfit guarda `prendaIds` en vez de copiar las prendas (AR F2): así
   renombrar una actividad no obliga a recorrer nada. */

export const DEFAULT_HORARIO_TOP = {
  horarios: [],      // los contenedores
  actividades: [],   // las entidades reutilizables
  bloques: [],       // la regla base: lo que ocurre normalmente
  excepciones: [],   // lo que cambia un día concreto
};

/* ---------------------------------------------------------------------------
   HORARIO (capa 1)
   --------------------------------------------------------------------------- */

/**
 * Apartados 23 y 24 — *"el usuario podrá definir Horario 2026–2027 y después
 * Horario 2027–2028 sin destruir el anterior"*.
 *
 * Por eso un horario tiene `periodo` y `activo`. Cambiar de curso es crear uno
 * nuevo y desactivar el viejo, no borrar nada: el histórico se conserva y las
 * notas del curso pasado siguen apuntando a algo que existe.
 */
export function crearHorario({ nombre = '', tipo = 'escolar', periodo = '', hoy = todayISO() } = {}) {
  const t = tipoHorario(tipo);
  const { columnas, filas } = cuadriculaInicial();
  return normalizarHorarioObj({
    id: uid(),
    nombre: (nombre || '').trim() || t.label,
    tipo: t.id,
    periodo: (periodo || '').trim(),
    columnas,
    filas,
    activo: true,
    creadoEn: hoy,
  });
}

export function normalizarHorarioObj(guardado) {
  const g = guardado || {};
  const t = tipoHorario(g.tipo);
  const columnas = (Array.isArray(g.columnas) ? g.columnas : []).map((c) => ({
    id: c?.id || uid(),
    nombre: (c?.nombre || '').trim() || 'Columna',
    dia: c?.dia >= 1 && c?.dia <= 7 ? c.dia : null,
  }));
  const filas = (Array.isArray(g.filas) ? g.filas : []).map((f) => ({
    id: f?.id || uid(),
    inicio: normalizarHora(f?.inicio) || '08:00',
    fin: normalizarHora(f?.fin) || '09:00',
    etiqueta: (f?.etiqueta || '').trim(),
  }));
  return {
    id: g.id || uid(),
    nombre: (g.nombre || '').trim() || t.label,
    tipo: t.id,
    periodo: (g.periodo || '').trim(),
    columnas,
    filas,
    activo: g.activo !== false,
    creadoEn: g.creadoEn || null,
  };
}

/* ---------------------------------------------------------------------------
   ACTIVIDAD (apartados 11, 12, 16 y 25)
   ---------------------------------------------------------------------------
   *"Si aparece Matemáticas lunes, martes y jueves, el sistema deberá entender
   que esos tres bloques hacen referencia a la misma entidad."*

   Y `asignaturaId` es la respuesta al apartado 25: **una actividad escolar no
   guarda el nombre de la asignatura, apunta a la de Estudios**. El nombre se
   resuelve al leer (`nombreDeActividad`), así que renombrar "Bio" a "Biología"
   en Estudios lo cambia en el horario sin tocar el horario.

   `material` (apartado 16) se guarda aquí y no en el bloque a propósito: la
   calculadora hace falta para Matemáticas, no para el martes a las 10. */

export const TIPOS_ACTIVIDAD = [
  { id: 'asignatura', label: 'Asignatura' },
  { id: 'entrenamiento', label: 'Entrenamiento' },
  { id: 'estudio', label: 'Estudio' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'descanso', label: 'Descanso' },
  { id: 'otro', label: 'Otro' },
];

export function crearActividad({ nombre = '', tipo = 'otro', color = '', icono = '', asignaturaId = null, material = [], ubicacion = '', persona = '', prioridad: pri = 'normal' } = {}) {
  return normalizarActividad({
    id: uid(),
    nombre,
    tipo,
    color,
    icono,
    asignaturaId,
    material,
    ubicacion,
    persona,
    prioridad: pri,
  });
}

export function normalizarActividad(guardada) {
  const g = guardada || {};
  const tipo = TIPOS_ACTIVIDAD.some((t) => t.id === g.tipo) ? g.tipo : 'otro';
  return {
    id: g.id || uid(),
    // Puede quedar vacío **a propósito**: si hay `asignaturaId`, el nombre bueno
    // es el de Estudios y copiarlo aquí sería la duplicación del apartado 25.
    nombre: (g.nombre || '').trim(),
    tipo,
    color: (g.color || '').trim(),
    icono: (g.icono || '').trim(),
    asignaturaId: g.asignaturaId || null,
    material: (Array.isArray(g.material) ? g.material : [])
      .map((m) => (typeof m === 'string' ? m.trim() : ''))
      .filter(Boolean),
    ubicacion: (g.ubicacion || '').trim(),
    persona: (g.persona || '').trim(),
    prioridad: prioridad(g.prioridad).id,
  };
}

/**
 * El nombre que se enseña. **Manda Estudios.**
 *
 * Es la mitad práctica del apartado 25: el horario no guarda "Biología", la pide.
 * Si la asignatura desapareció de Estudios se cae al nombre propio, y si tampoco
 * lo hay, a "Sin nombre" — nunca a un id ni a una cadena vacía.
 */
export function nombreDeActividad(actividad, asignaturas = []) {
  const a = normalizarActividad(actividad);
  if (a.asignaturaId) {
    const asig = (asignaturas || []).find((x) => x.id === a.asignaturaId);
    if (asig?.nombre) return asig.nombre;
  }
  return a.nombre || 'Sin nombre';
}

/* ---------------------------------------------------------------------------
   BLOQUE (capa 2) — la regla base
   ---------------------------------------------------------------------------
   *"Un bloque tendrá: identificador, día, hora de inicio, hora de finalización,
   título, tipo, color, icono, descripción, ubicación, etiquetas."*

   Casi todo eso vive en la ACTIVIDAD, no aquí, por el apartado 11: tres bloques
   de Matemáticas son la misma entidad, así que el color se guarda una vez. El
   bloque solo guarda lo que es suyo: **cuándo** y **dónde, si ese día cambia**.

   El bloque guarda `columnaId`, no un día: la columna sabe qué día es (o si no
   es ninguno). Guardar el día aquí lo duplicaría, y renombrar una columna
   dejaría los dos valores discrepando. */

export function crearBloque({ horarioId, columnaId, actividadId = null, inicio, fin, titulo = '', ubicacion = '', notas = '', etiquetas = [] } = {}) {
  return normalizarBloque({ id: uid(), horarioId, columnaId, actividadId, inicio, fin, titulo, ubicacion, notas, etiquetas });
}

export function normalizarBloque(guardado) {
  const g = guardado || {};
  return {
    id: g.id || uid(),
    horarioId: g.horarioId || null,
    columnaId: g.columnaId || null,
    actividadId: g.actividadId || null,
    inicio: normalizarHora(g.inicio) || '',
    fin: normalizarHora(g.fin) || '',
    // Un bloque puede tener título propio sin actividad: "Recreo", "Hueco".
    // Obligar a crear una entidad para eso sería fricción sin motivo (apartado 26).
    titulo: (g.titulo || '').trim(),
    ubicacion: (g.ubicacion || '').trim(),
    notas: (g.notas || '').trim(),
    etiquetas: (Array.isArray(g.etiquetas) ? g.etiquetas : []).map((e) => String(e).trim()).filter(Boolean),
  };
}

/* ---------------------------------------------------------------------------
   EXCEPCIÓN (apartado 5) — lo que cambia un día concreto
   ---------------------------------------------------------------------------
   *"Un horario recurrente puede decir: Martes 10:00 Biología. Pero puede existir
   una excepción: el martes 15 no hay Biología. O el martes 22 Biología cambia a
   las 12:00."*

   Cuatro clases, que es lo que hace falta para cubrir la lista del apartado
   (vacaciones, festivos, excursiones, cambios de aula, exámenes, sustituciones):

     · `cancelado`   — ese bloque no ocurre ese día.
     · `modificado`  — ocurre, pero cambia algo (hora, aula, actividad, título).
     · `anadido`     — ocurre algo que no está en el horario.
     · `dia_libre`   — **no ocurre NADA ese día.** Un festivo con seis clases
                       necesitaría seis cancelaciones; con esto, una. */

export const TIPOS_EXCEPCION = [
  { id: 'cancelado', label: 'No hay' },
  { id: 'modificado', label: 'Cambia' },
  { id: 'anadido', label: 'Se añade' },
  { id: 'dia_libre', label: 'Día libre' },
];

export function crearExcepcion({ fecha = todayISO(), tipo = 'cancelado', bloqueId = null, horarioId = null, cambios = {}, motivo = '' } = {}) {
  return normalizarExcepcion({ id: uid(), fecha, tipo, bloqueId, horarioId, cambios, motivo });
}

export function normalizarExcepcion(guardada) {
  const g = guardada || {};
  const tipo = TIPOS_EXCEPCION.some((t) => t.id === g.tipo) ? g.tipo : 'cancelado';
  const c = g.cambios || {};
  return {
    id: g.id || uid(),
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(g.fecha || '') ? g.fecha : todayISO(),
    tipo,
    bloqueId: g.bloqueId || null,
    horarioId: g.horarioId || null,
    cambios: {
      inicio: normalizarHora(c.inicio) || '',
      fin: normalizarHora(c.fin) || '',
      actividadId: c.actividadId || null,
      titulo: (c.titulo || '').trim(),
      ubicacion: (c.ubicacion || '').trim(),
    },
    motivo: (g.motivo || '').trim(),
  };
}

/* ===========================================================================
   4 · EL ESTADO COMPLETO
   =========================================================================== */

export function normalizarHorarioTop(guardado) {
  const g = guardado || {};
  return {
    horarios: (Array.isArray(g.horarios) ? g.horarios : []).map(normalizarHorarioObj),
    actividades: (Array.isArray(g.actividades) ? g.actividades : []).map(normalizarActividad),
    bloques: (Array.isArray(g.bloques) ? g.bloques : []).map(normalizarBloque).filter((b) => b.horarioId && b.columnaId),
    excepciones: (Array.isArray(g.excepciones) ? g.excepciones : []).map(normalizarExcepcion),
  };
}

/* ===========================================================================
   5 · RESOLVER UN DÍA (apartados 5, 14 y 29) — el corazón del módulo
   ===========================================================================
   *"REGLA BASE: lo que ocurre normalmente. EXCEPCIÓN: un cambio puntual.
   EVENTO REAL: lo que finalmente ocurre en una fecha concreta."*

   Esta función es el "evento real". Compone, no materializa: no guarda nada, así
   que cambiar la hora de una clase la cambia en todos los días pasados y futuros
   a la vez, y un festivo no obliga a borrar seis filas.

   Devuelve la lista ya ordenada por hora, que es como la quiere HOY. */
export function resolverDia(estado, fecha, { asignaturas = [], horarioId = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const dia = diaDeFecha(fecha);
  if (!dia) return [];

  const excepcionesHoy = e.excepciones.filter((x) => x.fecha === fecha);

  // Un día libre que no nombra horario los vacía todos: es lo que se espera de
  // un festivo. Si nombra uno, solo ese — hay festivos de instituto que no
  // afectan al entrenamiento.
  const libres = excepcionesHoy.filter((x) => x.tipo === 'dia_libre');
  const horarioLibre = (id) => libres.some((x) => !x.horarioId || x.horarioId === id);

  const horarios = e.horarios.filter((h) => h.activo && (!horarioId || h.id === horarioId));
  const salida = [];

  for (const horario of horarios) {
    if (horarioLibre(horario.id)) continue;
    // Solo las columnas que representan un día real resuelven a una fecha. Una
    // columna "Semana A" no es ningún día: sus bloques existen, pero no caen en
    // ninguna fecha hasta que una fase futura decida qué semana es cuál.
    const columnas = horario.columnas.filter((c) => c.dia === dia);
    if (!columnas.length) continue;

    for (const bloque of e.bloques.filter((b) => b.horarioId === horario.id && columnas.some((c) => c.id === b.columnaId))) {
      const cancelado = excepcionesHoy.find((x) => x.tipo === 'cancelado' && x.bloqueId === bloque.id);
      if (cancelado) continue;

      const cambio = excepcionesHoy.find((x) => x.tipo === 'modificado' && x.bloqueId === bloque.id);
      salida.push(componerEvento(e, horario, bloque, cambio, asignaturas));
    }
  }

  // Lo añadido a mano ese día. No necesita bloque: es lo que cubre una excursión
  // o una clase de recuperación que no está en el horario.
  for (const x of excepcionesHoy.filter((v) => v.tipo === 'anadido')) {
    const horario = e.horarios.find((h) => h.id === x.horarioId) || null;
    if (horario && (!horario.activo || horarioLibre(horario.id))) continue;
    if (horarioId && x.horarioId !== horarioId) continue;
    salida.push(componerEvento(e, horario, null, x, asignaturas));
  }

  return salida.sort(porHora);
}

/** Ordena por hora de inicio; sin hora, al final — nunca desaparece nada. */
function porHora(a, b) {
  const ma = minutosDe(a.inicio);
  const mb = minutosDe(b.inicio);
  if (ma === null && mb === null) return 0;
  if (ma === null) return 1;
  if (mb === null) return -1;
  return ma - mb || (minutosDe(a.fin) ?? 0) - (minutosDe(b.fin) ?? 0);
}

/** Un evento real: bloque + excepción + actividad, ya resuelto. */
function componerEvento(estado, horario, bloque, excepcion, asignaturas) {
  const c = excepcion?.cambios || {};
  const actividadId = c.actividadId || bloque?.actividadId || null;
  const actividad = actividadId ? estado.actividades.find((a) => a.id === actividadId) || null : null;

  const titulo = c.titulo
    || (actividad ? nombreDeActividad(actividad, asignaturas) : '')
    || bloque?.titulo
    || 'Sin nombre';

  return {
    // Un evento resuelto **no tiene id propio**: no es una entidad guardada, es
    // el resultado de componer otras. Darle uno invitaría a guardarlo, que es
    // justo lo que esta arquitectura evita.
    bloqueId: bloque?.id || null,
    horarioId: horario?.id || bloque?.horarioId || null,
    horarioNombre: horario?.nombre || '',
    actividadId,
    titulo,
    inicio: c.inicio || bloque?.inicio || '',
    fin: c.fin || bloque?.fin || '',
    color: actividad?.color || '',
    icono: actividad?.icono || '',
    ubicacion: c.ubicacion || bloque?.ubicacion || actividad?.ubicacion || '',
    material: actividad?.material || [],
    prioridad: actividad?.prioridad || 'normal',
    etiquetas: bloque?.etiquetas || [],
    notas: bloque?.notas || '',
    // De dónde sale, para que la interfaz pueda decir "cambiado hoy" sin
    // adivinarlo comparando contra el horario.
    origen: excepcion ? (excepcion.tipo === 'anadido' ? 'anadido' : 'modificado') : 'horario',
    motivo: excepcion?.motivo || '',
  };
}

/** ¿Es un día sin nada por una excepción, y no por estar vacío el horario? */
export function esDiaLibre(estado, fecha, horarioId = null) {
  const e = normalizarHorarioTop(estado);
  return e.excepciones.some((x) => x.fecha === fecha && x.tipo === 'dia_libre' && (!x.horarioId || !horarioId || x.horarioId === horarioId));
}

/* ===========================================================================
   6 · LA CAPA «HOY» (apartado 14)
   ===========================================================================
   *"HOY no será simplemente la fecha actual. Será una vista agregadora
   inteligente."* Y las seis preguntas que debe responder: qué tengo, qué tengo
   que hacer, qué no puedo olvidar, qué viene después, qué necesito, qué es
   prioritario.

   La agregación completa —tareas, exámenes, entrenamientos— es de la Fase 6.
   Aquí queda la parte que el horario sí puede contestar hoy, con su forma
   definitiva, para que esa fase añada fuentes y no rehaga la vista. */

/**
 * La línea temporal del día, con el bloque en curso y el siguiente ya marcados.
 * `ahora` entra como parámetro: sin eso la función no sería pura y no habría
 * forma de probar "las 10:30 de un martes".
 */
export function lineaDelDia(estado, fecha, { asignaturas = [], ahora = null, horarioId = null } = {}) {
  const eventos = resolverDia(estado, fecha, { asignaturas, horarioId });
  const minutosAhora = ahora ? minutosDe(ahora) : null;

  let enCurso = null;
  let siguiente = null;
  if (minutosAhora !== null) {
    for (const ev of eventos) {
      const i = minutosDe(ev.inicio);
      const f = minutosDe(ev.fin);
      if (i !== null && f !== null && minutosAhora >= i && minutosAhora < f) { enCurso = ev; continue; }
      if (i !== null && i > minutosAhora && !siguiente) siguiente = ev;
    }
  }

  return {
    fecha,
    eventos,
    enCurso,
    siguiente,
    libre: esDiaLibre(estado, fecha),
    // Sin nada y sin ser festivo es distinto de un día libre declarado: un
    // domingo vacío no es "día libre", es que no hay horario ese día.
    vacio: eventos.length === 0,
    total: eventos.length,
    minutos: eventos.reduce((n, ev) => n + duracionMinutos(ev.inicio, ev.fin), 0),
  };
}

/** *"¿Qué viene después?"* — también sirve para mañana, si hoy ya se acabó. */
export function proximoEvento(estado, { asignaturas = [], desdeFecha = todayISO(), ahora = null, dias = 7 } = {}) {
  for (let i = 0; i < dias; i++) {
    const fecha = addDays(desdeFecha, i);
    const linea = lineaDelDia(estado, fecha, { asignaturas, ahora: i === 0 ? ahora : '00:00' });
    const ev = linea.enCurso || linea.siguiente || (i > 0 ? linea.eventos[0] : null);
    if (ev) return { ...ev, fecha, enCurso: linea.enCurso === ev };
  }
  return null;
}

/* ===========================================================================
   7 · LOS PUNTOS DE ENGANCHE DE LAS FASES SIGUIENTES
   ===========================================================================
   El apartado 31 prohíbe construir la mochila, las notificaciones y la IA. Lo
   que sí pide (apartados 16, 17 y 18) es que la estructura las admita **sin
   rehacer nada**. Estas tres funciones son ese contrato: pequeñas, honestas y
   ya probadas, para que la fase que las use no tenga que tocar el modelo. */

/**
 * Apartado 16 — *"¿Qué tengo mañana?" → "Mañana necesitas llevar…"*.
 *
 * Solo la relación, que es lo único que esta fase debe dar. La mochila de
 * verdad (marcar, recordar, avisar) es la Fase 7.
 */
export function materialDelDia(estado, fecha, { asignaturas = [] } = {}) {
  const eventos = resolverDia(estado, fecha, { asignaturas });
  const porNombre = new Map();
  for (const ev of eventos) {
    for (const m of ev.material) {
      // Se agrupa por material y se dice para qué hace falta: "Libreta — para
      // Biología y Matemáticas" es más útil que la libreta repetida dos veces.
      if (!porNombre.has(m)) porNombre.set(m, new Set());
      porNombre.get(m).add(ev.titulo);
    }
  }
  return [...porNombre.entries()]
    .map(([material, para]) => ({ material, para: [...para].sort() }))
    .sort((a, b) => a.material.localeCompare(b.material, 'es'));
}

/**
 * Apartado 17 — *"07:45: en 15 minutos tienes Matemáticas."*
 *
 * **Describe, no notifica.** Devuelve qué se podría avisar y cuándo; quién avise
 * y con qué permisos es de la Fase 10. Es el mismo criterio que RA F2 con los
 * eventos de racha, y evita que dos sistemas manden el mismo aviso.
 */
export function avisosDelDia(estado, fecha, { asignaturas = [], minutosAntes = 15 } = {}) {
  const eventos = resolverDia(estado, fecha, { asignaturas });
  return eventos
    .filter((ev) => minutosDe(ev.inicio) !== null)
    .map((ev) => {
      const m = minutosDe(ev.inicio) - minutosAntes;
      return {
        tipo: 'bloque_proximo',
        fecha,
        a: m >= 0 ? `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` : ev.inicio,
        titulo: ev.titulo,
        texto: `En ${minutosAntes} minutos tienes ${ev.titulo}${ev.ubicacion ? ` en ${ev.ubicacion}` : ''}.`,
        prioridad: ev.prioridad,
      };
    });
}

/**
 * Apartado 18 — *"La IA no deberá recibir simplemente una lista de textos. La
 * información deberá estar estructurada."*
 *
 * Y regla 7 del proyecto: **la IA nunca se dispara sola.** Esto no llama a
 * ninguna IA; prepara el contexto para cuando Josué toque un botón.
 */
export function contextoIA(estado, { asignaturas = [], fecha = todayISO(), dias = 3 } = {}) {
  const salida = [];
  for (let i = 0; i < dias; i++) {
    const f = addDays(fecha, i);
    const linea = lineaDelDia(estado, f, { asignaturas });
    salida.push({
      fecha: f,
      libre: linea.libre,
      bloques: linea.eventos.map((ev) => ({
        titulo: ev.titulo,
        inicio: ev.inicio,
        fin: ev.fin,
        ubicacion: ev.ubicacion || undefined,
        material: ev.material.length ? ev.material : undefined,
        prioridad: ev.prioridad !== 'normal' ? ev.prioridad : undefined,
        cambiado: ev.origen !== 'horario' ? ev.origen : undefined,
      })),
      material: materialDelDia(estado, f, { asignaturas }).map((m) => m.material),
    });
  }
  return salida;
}

/* ===========================================================================
   8 · CONFLICTOS Y HUECOS (apartados 14 y 15, y la capa 5)
   ===========================================================================
   La capa de inteligencia es de fases posteriores, pero *"qué conflictos
   existen"* y *"cuándo tengo un hueco para estudiar"* son preguntas que se
   contestan con el modelo de esta fase, sin nada más. Dejarlas aquí evita que
   la Fase 8 tenga que volver a recorrer los bloques a su manera. */

/** Dos eventos se solapan si comparten un minuto. Tocarse no es solaparse. */
export function seSolapan(a, b) {
  const ia = minutosDe(a.inicio); const fa = minutosDe(a.fin);
  const ib = minutosDe(b.inicio); const fb = minutosDe(b.fin);
  if ([ia, fa, ib, fb].some((v) => v === null)) return false;
  return ia < fb && ib < fa;
}

/** Los choques de un día. Cada par se devuelve UNA vez, no dos. */
export function conflictosDelDia(estado, fecha, { asignaturas = [] } = {}) {
  const eventos = resolverDia(estado, fecha, { asignaturas });
  const pares = [];
  for (let i = 0; i < eventos.length; i++) {
    for (let j = i + 1; j < eventos.length; j++) {
      if (seSolapan(eventos[i], eventos[j])) pares.push([eventos[i], eventos[j]]);
    }
  }
  return pares;
}

/** Los huecos libres entre bloques, de `minimo` minutos o más. */
export function huecosDelDia(estado, fecha, { asignaturas = [], minimo = 30, desde = '08:00', hasta = '22:00' } = {}) {
  const eventos = resolverDia(estado, fecha, { asignaturas })
    .filter((ev) => minutosDe(ev.inicio) !== null && minutosDe(ev.fin) !== null);

  const huecos = [];
  let cursor = minutosDe(desde);
  const limite = minutosDe(hasta);
  const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  for (const ev of eventos) {
    const i = minutosDe(ev.inicio);
    if (i - cursor >= minimo) huecos.push({ inicio: aHora(cursor), fin: aHora(i), minutos: i - cursor });
    cursor = Math.max(cursor, minutosDe(ev.fin));
  }
  if (limite - cursor >= minimo) huecos.push({ inicio: aHora(cursor), fin: aHora(limite), minutos: limite - cursor });
  return huecos;
}

/* ===========================================================================
   9 · INTEGRIDAD Y BORRADO EN CASCADA (apartados 25 y 29)
   ===========================================================================
   *"La finalidad es evitar que cada módulo funcione como una isla."* Lo que en
   una base de datos serían claves foráneas, aquí son estas funciones. */

/** Borrar un horario se lleva sus bloques y sus excepciones. Nada queda huérfano. */
export function eliminarHorario(estado, horarioId) {
  const e = normalizarHorarioTop(estado);
  const bloques = e.bloques.filter((b) => b.horarioId !== horarioId);
  const idsBloques = new Set(bloques.map((b) => b.id));
  return {
    ...e,
    horarios: e.horarios.filter((h) => h.id !== horarioId),
    bloques,
    excepciones: e.excepciones.filter((x) => x.horarioId !== horarioId && (!x.bloqueId || idsBloques.has(x.bloqueId))),
  };
}

/**
 * Borrar una actividad **no borra sus bloques**: los deja sin actividad.
 *
 * Es la misma decisión que AR F2 con una prenda borrada de un outfit: perder la
 * hora de una clase porque se borró la asignatura sería mucho peor que quedarse
 * con un hueco que se puede volver a rellenar.
 */
export function eliminarActividad(estado, actividadId) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    actividades: e.actividades.filter((a) => a.id !== actividadId),
    bloques: e.bloques.map((b) => (b.actividadId === actividadId ? { ...b, actividadId: null, titulo: b.titulo } : b)),
    excepciones: e.excepciones.map((x) => (x.cambios.actividadId === actividadId
      ? { ...x, cambios: { ...x.cambios, actividadId: null } }
      : x)),
  };
}

/** Borrar una columna se lleva sus bloques: sin columna no tienen cuándo. */
export function eliminarColumna(estado, horarioId, columnaId) {
  const e = normalizarHorarioTop(estado);
  const bloques = e.bloques.filter((b) => b.columnaId !== columnaId);
  const idsBloques = new Set(bloques.map((b) => b.id));
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id === horarioId ? { ...h, columnas: h.columnas.filter((c) => c.id !== columnaId) } : h)),
    bloques,
    excepciones: e.excepciones.filter((x) => !x.bloqueId || idsBloques.has(x.bloqueId)),
  };
}

/**
 * Qué está roto. Como `revisarIntegridad` de RA F2: **informa, no toca nada**,
 * para que la decisión sea de quien mire.
 */
export function revisarHorario(estado, { asignaturas = [] } = {}) {
  const e = normalizarHorarioTop(estado);
  const problemas = [];
  const idsHorario = new Set(e.horarios.map((h) => h.id));
  const idsActividad = new Set(e.actividades.map((a) => a.id));
  const idsColumna = new Set(e.horarios.flatMap((h) => h.columnas.map((c) => c.id)));
  const idsBloque = new Set(e.bloques.map((b) => b.id));

  for (const b of e.bloques) {
    if (!idsHorario.has(b.horarioId)) problemas.push({ tipo: 'bloque_sin_horario', id: b.id });
    else if (!idsColumna.has(b.columnaId)) problemas.push({ tipo: 'bloque_sin_columna', id: b.id });
    if (b.actividadId && !idsActividad.has(b.actividadId)) problemas.push({ tipo: 'bloque_sin_actividad', id: b.id });
    if (!duracionMinutos(b.inicio, b.fin)) problemas.push({ tipo: 'bloque_sin_horas', id: b.id });
  }
  for (const x of e.excepciones) {
    if (x.bloqueId && !idsBloque.has(x.bloqueId)) problemas.push({ tipo: 'excepcion_sin_bloque', id: x.id });
  }
  // Una actividad escolar cuya asignatura ya no está en Estudios: no rompe nada
  // —`nombreDeActividad` cae a su nombre propio— pero conviene saberlo.
  for (const a of e.actividades) {
    if (a.asignaturaId && !(asignaturas || []).some((s) => s.id === a.asignaturaId)) {
      problemas.push({ tipo: 'actividad_sin_asignatura', id: a.id });
    }
  }
  return { ok: problemas.length === 0, problemas };
}

/* ===========================================================================
   10 · RESUMEN, PARA EL HUB Y PARA EL BUSCADOR
   =========================================================================== */
export function resumenHorario(estado, { asignaturas = [], fecha = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const linea = lineaDelDia(estado, fecha, { asignaturas });
  return {
    horarios: e.horarios.filter((h) => h.activo).length,
    actividades: e.actividades.length,
    bloques: e.bloques.length,
    hoy: linea.total,
    libre: linea.libre,
    minutosHoy: linea.minutos,
  };
}
