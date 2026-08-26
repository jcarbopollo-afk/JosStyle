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

/* HT F4 · apartado 5 — *"Aunque normalmente representarán días, técnicamente
   podrán representar cualquier dimensión."* El tipo NO cambia la mecánica: solo
   una columna con `dia` resuelve a una fecha. Lo que cambia es lo que la
   interfaz ofrece y cómo se agrupa. */
export const TIPOS_COLUMNA = [
  { id: 'dia', label: 'Día' },
  { id: 'persona', label: 'Persona' },
  { id: 'semana', label: 'Semana' },
  { id: 'turno', label: 'Turno' },
  { id: 'proyecto', label: 'Proyecto' },
  { id: 'categoria', label: 'Categoría' },
  { id: 'nota', label: 'Notas' },
  { id: 'personalizado', label: 'Personalizado' },
];

/* HT F4 · apartados 12, 13 y 14 — no todas las filas son una hora. */
export const TIPOS_FILA = [
  { id: 'hora', label: 'Franja horaria', conHora: true },
  { id: 'etiqueta', label: 'Sin hora', conHora: false },     // "Mañana", "Prioridad alta"
  { id: 'separador', label: 'Separador', conHora: false },   // "Descanso"
];

export const tipoColumna = (id) => TIPOS_COLUMNA.find((t) => t.id === id) || TIPOS_COLUMNA[TIPOS_COLUMNA.length - 1];
export const tipoFila = (id) => TIPOS_FILA.find((t) => t.id === id) || TIPOS_FILA[0];

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

export function crearColumna({ nombre = '', dia = null, posicion = 0, corto = '', color = '', icono = '' } = {}) {
  // El día se valida ANTES de usarlo para el nombre. Con `dia: 9` —truthy pero
  // fuera de rango— la versión anterior indexaba `DIAS_SEMANA[8]` y reventaba.
  const valido = Number.isInteger(dia) && dia >= 1 && dia <= 7 ? dia : null;
  return {
    id: uid(),
    nombre: (nombre || '').trim() || (valido ? DIAS_SEMANA[valido - 1].label : 'Columna'),
    // HT F2 · apartado 8 — `short_name`, `position`, `is_visible`, color e icono.
    // `corto` no se deriva del nombre: "Miércoles" abrevia a "X" en España, no a
    // "Mi", y adivinarlo con las tres primeras letras daría "Mié".
    corto: (corto || '').trim() || (valido ? DIAS_SEMANA[valido - 1].corto : ''),
    dia: valido,
    posicion: Number.isFinite(posicion) ? posicion : 0,
    visible: true,
    color: (color || '').trim(),
    icono: (icono || '').trim(),
    tipo: valido ? 'dia' : 'personalizado',
    bloqueada: false,
    grupo: '',
  };
}

/**
 * Una fila es una franja horaria. *"Tampoco se limitarán a una hora fija: 30,
 * 45, 50, 60 minutos o franjas personalizadas"* (apartado 8), así que se guarda
 * **inicio y fin**, no una hora suelta con una duración implícita. Con solo la
 * hora de inicio, un recreo de 20 minutos entre clases de 50 no se podría
 * representar sin inventarse una duración.
 */
export const crearFila = ({ inicio = '08:00', fin = '09:00', etiqueta = '', posicion = 0, tipo = 'hora', color = '' } = {}) => {
  const t = tipoFila(tipo);
  return {
    id: uid(),
    inicio: t.conHora ? (normalizarHora(inicio) || '08:00') : '',
    fin: t.conHora ? (normalizarHora(fin) || '09:00') : '',
    etiqueta: (etiqueta || '').trim(),
    posicion: Number.isFinite(posicion) ? posicion : 0,
    visible: true,
    tipo: t.id,
    color: (color || '').trim(),
  };
};

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
  const columnas = [1, 2, 3, 4, 5].map((dia, i) => crearColumna({ dia, posicion: i }));
  const filas = [];
  for (let h = 8; h < 14; h++) {
    filas.push(crearFila({ inicio: `${String(h).padStart(2, '0')}:00`, fin: `${String(h + 1).padStart(2, '0')}:00`, posicion: h - 8 }));
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
  // HT F5 · apartado 64 — agrupar actividades ("Colegio", "Fitness"). El grupo
  // puede dar color a las suyas, y ellas pueden sobrescribirlo.
  grupos: [],
  // HT F2 y F7 — el material y la mochila. Viven aquí, en la misma clave
  // `horarioTop` de `app_data`, porque el apartado 51 de F2 obliga a adaptarse
  // a la arquitectura del proyecto en vez de crear tablas propias.
  materiales: [],
  enlacesMaterial: [],
  mochila: [],
  mochilas: [],
  inventario: {},
  kits: [],
  dependencias: {},
  reglas: [],
  // HT F8 — el estado temporal se CALCULA; lo único que se guarda es qué
  // hiciste de verdad, y qué han hecho las automatizaciones.
  completadas: [],
  automatizaciones: [],
  historialAuto: [],
  // HT F10 — el historial de avisos. Lo que se decide NO se guarda: se calcula
  // cada vez. Lo que se guarda es lo que YA se avisó, para no repetirlo.
  avisos: [],
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
export function crearHorario({ nombre = '', tipo = 'escolar', periodo = '', descripcion = '', desde = '', hasta = '', porDefecto = false, hoy = todayISO() } = {}) {
  const t = tipoHorario(tipo);
  const { columnas, filas } = cuadriculaInicial();
  return normalizarHorarioObj({
    id: uid(),
    nombre: (nombre || '').trim() || t.label,
    tipo: t.id,
    periodo: (periodo || '').trim(),
    descripcion,
    // HT F2 · apartado 7 — `start_date` y `end_date`. El periodo era una etiqueta
    // ("2026-2027"); esto son fechas de verdad, y `resolverDia` las respeta: un
    // horario del curso pasado deja de resolver solo, sin desactivarlo a mano.
    desde,
    hasta,
    porDefecto: !!porDefecto,
    columnas,
    filas,
    activo: true,
    // HT F4 · apartados 25 y 27 — un horario del curso pasado se archiva, no se
    // borra, y lleva su propia identidad visual y su zona horaria.
    archivado: false,
    icono: '',
    color: '',
    zonaHoraria: '',
    // El ciclo de semanas alternas (A/B…) vive en el horario, no en un ajuste
    // global: dos horarios pueden alternar de forma distinta. Su forma la
    // normaliza `horarioEstructura.js`; aquí solo se conserva.
    ciclo: null,
    creadoEn: hoy,
    actualizadoEn: hoy,
  });
}

export function normalizarHorarioObj(guardado) {
  const g = guardado || {};
  const t = tipoHorario(g.tipo);
  // ⚠️ Este normalizador tiene que conocer TODOS los campos: lo que no aparezca
  // aquí se pierde en el siguiente guardado, aunque `crearColumna` lo escriba.
  // Pasó de verdad al añadir `visible` en HT F2: ocultar el sábado funcionaba
  // hasta recargar la app.
  const columnas = (Array.isArray(g.columnas) ? g.columnas : []).map((c, i) => {
    const dia = Number.isInteger(c?.dia) && c.dia >= 1 && c.dia <= 7 ? c.dia : null;
    return {
      id: c?.id || uid(),
      nombre: (c?.nombre || '').trim() || (dia ? DIAS_SEMANA[dia - 1].label : 'Columna'),
      corto: (c?.corto || '').trim() || (dia ? DIAS_SEMANA[dia - 1].corto : ''),
      dia,
      posicion: Number.isFinite(c?.posicion) ? c.posicion : i,
      visible: c?.visible !== false,
      color: (c?.color || '').trim(),
      icono: (c?.icono || '').trim(),
      // HT F4 · apartados 5 y 6 — una columna no tiene por qué ser un día.
      // Si trae `dia` es de tipo 'dia' aunque diga otra cosa: el campo que
      // decide si resuelve a una fecha es `dia`, y dos verdades sobre lo mismo
      // acabarían discrepando.
      tipo: dia ? 'dia' : (TIPOS_COLUMNA.some((t) => t.id === c?.tipo) ? c.tipo : 'personalizado'),
      // Apartado 8 — bloquear evita modificaciones accidentales.
      bloqueada: !!c?.bloqueada,
      // Apartado 9 — el encabezado superior que agrupa columnas ("Semana A").
      grupo: (c?.grupo || '').trim(),
    };
  });
  const filas = (Array.isArray(g.filas) ? g.filas : []).map((f, i) => {
    const tipo = TIPOS_FILA.some((t) => t.id === f?.tipo) ? f.tipo : 'hora';
    // HT F4 · apartados 13 y 14 — una fila puede NO tener hora ("Mañana",
    // "Tarde") o ser un separador ("Descanso"). Esas no se rellenan con un
    // 08:00 inventado: se quedan vacías, y `resolverDia` no las mira.
    const conHora = tipo === 'hora';
    return {
      id: f?.id || uid(),
      inicio: conHora ? (normalizarHora(f?.inicio) || '08:00') : normalizarHora(f?.inicio),
      fin: conHora ? (normalizarHora(f?.fin) || '09:00') : normalizarHora(f?.fin),
      etiqueta: (f?.etiqueta || '').trim(),
      posicion: Number.isFinite(f?.posicion) ? f.posicion : i,
      visible: f?.visible !== false,
      tipo,
      color: (f?.color || '').trim(),
    };
  });
  return {
    id: g.id || uid(),
    nombre: (g.nombre || '').trim() || t.label,
    tipo: t.id,
    periodo: (g.periodo || '').trim(),
    descripcion: (g.descripcion || '').trim(),
    desde: fechaValida(g.desde),
    hasta: fechaValida(g.hasta),
    porDefecto: !!g.porDefecto,
    columnas,
    filas,
    activo: g.activo !== false,
    archivado: !!g.archivado,
    icono: (g.icono || '').trim(),
    color: (g.color || '').trim(),
    zonaHoraria: (g.zonaHoraria || '').trim(),
    ciclo: g.ciclo && Number.isFinite(Number(g.ciclo.semanas)) ? g.ciclo : null,
    creadoEn: g.creadoEn || null,
    actualizadoEn: g.actualizadoEn || g.creadoEn || null,
  };
}

/** Una fecha `AAAA-MM-DD` o cadena vacía. Nunca `undefined`, que rompe las comparaciones. */
export const fechaValida = (f) => (/^\d{4}-\d{2}-\d{2}$/.test(f || '') ? f : '');

/**
 * HT F2 · apartado 7 — ¿está el horario vigente esa fecha?
 *
 * Sin fechas, siempre. Es lo que permite *"Horario curso 2026/27 y después
 * 2027/28 sin borrar el anterior"* (apartado 24 de F1): el viejo deja de
 * resolver por su `hasta`, no porque alguien se acuerde de desactivarlo.
 */
export function horarioVigente(horario, fecha) {
  const h = normalizarHorarioObj(horario);
  if (!h.activo || h.archivado) return false;
  if (h.desde && fecha < h.desde) return false;
  if (h.hasta && fecha > h.hasta) return false;
  return true;
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
  // HT F5 · apartado 8 — *"el sistema deberá permitir ampliar esta lista"*.
  // `descanso` no está en la lista de la especificación pero ya existía desde
  // F1: quitarlo dejaría sin tipo a lo que Josué ya hubiera creado.
  { id: 'reunion', label: 'Reunión' },
  { id: 'personal', label: 'Personal' },
  { id: 'rutina', label: 'Rutina' },
  { id: 'descanso', label: 'Descanso' },
  { id: 'otro', label: 'Otro' },
];

/**
 * HT F5 · apartados 16 y 49 — `activa` / `archivada` / `oculta`.
 *
 * ⚠️ **Oculta no es archivada.** Archivada es "esto es del curso pasado";
 * oculta es "existe y sigue viva, pero no quiero verla en esta pantalla". La
 * especificación las distingue expresamente, y juntarlas haría imposible tener
 * una actividad activa que no salga en el horario escolar (apartado 51).
 */
export const ESTADOS_ACTIVIDAD = [
  { id: 'activa', label: 'Activa' },
  { id: 'archivada', label: 'Archivada' },
  { id: 'oculta', label: 'Oculta' },
];

export const estadoActividad = (id) => ESTADOS_ACTIVIDAD.find((e) => e.id === id) || ESTADOS_ACTIVIDAD[0];

/**
 * HT F5 · apartados 50 y 51 — dónde se usa la actividad. Cuatro interruptores,
 * todos encendidos de fábrica: una actividad recién creada tiene que aparecer
 * donde se espera, y esconderla es la excepción.
 */
export const VISTAS_ACTIVIDAD = ['horario', 'hoy', 'calendario', 'mochila'];

export function normalizarVisibilidad(guardada) {
  const g = guardada || {};
  const salida = {};
  for (const v of VISTAS_ACTIVIDAD) salida[v] = g[v] !== false;
  return salida;
}

export function crearActividad({
  nombre = '', tipo = 'otro', color = '', icono = '', asignaturaId = null, material = [],
  ubicacion = '', persona = '', corto = '', descripcion = '', prioridad: pri = 'normal',
  // HT F5 — la identidad completa del apartado 4, más lo que la conecta con el
  // resto del Sistema Personal.
  alias = [], etiquetas = [], favorita = false, estado = 'activa', visibilidad = null,
  notas = '', grupoId = null, padreId = null, origen = '', origenId = '',
  hoy = todayISO(),
} = {}) {
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
    corto,
    descripcion,
    prioridad: pri,
    alias,
    etiquetas,
    favorita,
    estado,
    visibilidad,
    notas,
    grupoId,
    padreId,
    origen,
    origenId,
    creadoEn: hoy,
    actualizadoEn: hoy,
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
    // HT F2 · apartado 11 — `teacher` y `room` son campos suyos, no de cada
    // bloque: el profesor de Biología es el mismo los tres días. `persona` era
    // el nombre de F1 y se conserva como sinónimo para no romper lo guardado.
    persona: (g.profesor || g.persona || '').trim(),
    corto: (g.corto || '').trim(),
    descripcion: (g.descripcion || '').trim(),
    prioridad: prioridad(g.prioridad).id,
    // HT F5 · apartado 7 — los alias son para buscar y para que la IA reconozca
    // "mates". No se enseñan en la cuadrícula.
    alias: (Array.isArray(g.alias) ? g.alias : []).map((x) => String(x).trim()).filter(Boolean),
    etiquetas: (Array.isArray(g.etiquetas) ? g.etiquetas : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean),
    favorita: !!g.favorita,
    // `activa` era el campo de F1. Un `false` guardado significaba "archivada",
    // así que se traduce en vez de perderse.
    estado: ESTADOS_ACTIVIDAD.some((e) => e.id === g.estado) ? g.estado : (g.activa === false ? 'archivada' : 'activa'),
    visibilidad: normalizarVisibilidad(g.visibilidad),
    // Apartados 52 y 73 — las notas son privadas por defecto: no salen en HOY
    // ni viajan en el contexto de la IA.
    notas: (g.notas || '').trim(),
    grupoId: g.grupoId || null,
    padreId: g.padreId || null,
    // Apartados 94 y 95 — de dónde vino, para no importar dos veces lo mismo.
    origen: (g.origen || '').trim(),
    origenId: (g.origenId || '').trim(),
    creadoEn: g.creadoEn || null,
    actualizadoEn: g.actualizadoEn || g.creadoEn || null,
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

export function crearBloque({ horarioId, columnaId, filaId = null, actividadId = null, inicio, fin, titulo = '', ubicacion = '', notas = '', etiquetas = [], colorPropio = '', iconoPropio = '', recurrencia = null, hoy = todayISO() } = {}) {
  return normalizarBloque({
    id: uid(), horarioId, columnaId, filaId, actividadId, inicio, fin, titulo, ubicacion, notas, etiquetas,
    colorPropio, iconoPropio, recurrencia, creadoEn: hoy, actualizadoEn: hoy,
  });
}

/* ---------------------------------------------------------------------------
   RECURRENCIA (HT F2 · apartado 23)
   ---------------------------------------------------------------------------
   *"Se deberá preparar soporte para: diariamente, semanalmente, determinados
   días, cada dos semanas, semanas A/B, fechas de inicio, fechas de finalización,
   excepciones."*

   La mayoría ya la daba F1: la columna dice qué día, el horario dice desde
   cuándo y hasta cuándo, y las excepciones son las excepciones. Lo que NO se
   podía expresar era **la alternancia**: "Educación Física solo las semanas
   pares", "esta hora es Semana A y la otra Semana B".

   Eso es lo único que se añade, y se resuelve contando semanas ISO desde una
   fecha ancla en vez de guardando "esta semana toca": un contador guardado se
   desincroniza en cuanto pasa una semana sin abrir la app. */
export const CLASES_RECURRENCIA = [
  { id: 'siempre', label: 'Todas las semanas' },
  { id: 'alternas', label: 'Semanas alternas' },
];

export function normalizarRecurrencia(r) {
  const g = r || {};
  const clase = CLASES_RECURRENCIA.some((c) => c.id === g.clase) ? g.clase : 'siempre';
  if (clase === 'siempre') return { clase: 'siempre' };
  return {
    clase: 'alternas',
    // El ancla es la semana en la que SÍ toca. Sin ella no hay forma de saber
    // cuál de las dos alternas es esta.
    ancla: fechaValida(g.ancla) || '',
  };
}

/** El lunes de la semana de una fecha. La unidad de la alternancia es la semana. */
export function lunesDe(fechaISO) {
  const dia = diaDeFecha(fechaISO);
  return dia ? addDays(fechaISO, -(dia - 1)) : fechaISO;
}

/** ¿Toca este bloque esa fecha, según su recurrencia? */
export function tocaEsaSemana(recurrencia, fecha) {
  const r = normalizarRecurrencia(recurrencia);
  if (r.clase === 'siempre') return true;
  // Sin ancla no se puede decidir, y adivinar sería peor que no alternar: se
  // trata como "siempre" para no hacer desaparecer clases en silencio.
  if (!r.ancla) return true;
  const semanas = Math.round((new Date(`${lunesDe(fecha)}T00:00:00`) - new Date(`${lunesDe(r.ancla)}T00:00:00`)) / 604800000);
  return semanas % 2 === 0;
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
    // HT F2 · apartados 15 y 16 — `color_override` / `icon_override`. Sin
    // override manda el de la actividad, para que la identidad visual sea
    // consistente: "Matemáticas es azul" y un bloque especial puede no serlo.
    colorPropio: (g.colorPropio || '').trim(),
    iconoPropio: (g.iconoPropio || '').trim(),
    // Apartado 13 — `row_id`. Es informativo: el que manda es `inicio`/`fin`,
    // porque el apartado 14 pide expresamente que un bloque pueda NO ocupar una
    // fila exacta ("09:00–09:30 Recreo" entre filas de una hora).
    filaId: g.filaId || null,
    descripcion: (g.descripcion || '').trim(),
    posicion: Number.isFinite(g.posicion) ? g.posicion : 0,
    recurrencia: normalizarRecurrencia(g.recurrencia),
    creadoEn: g.creadoEn || null,
    actualizadoEn: g.actualizadoEn || g.creadoEn || null,
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
    // ⚠️ Sin esta línea los grupos se perderían en el siguiente guardado: es el
    // fallo que ya pasó dos veces (HT F2 con `visible`, HT F4 con `archivado`).
    // La forma la valida `actividades.js`; aquí solo se conserva la lista.
    grupos: (Array.isArray(g.grupos) ? g.grupos : []).filter((x) => x && typeof x === 'object'),
    // ⚠️ Estas siete se CONSERVAN tal cual: su forma la validan
    // `horarioDatos.js` (HT F2) y `mochila.js` (HT F7). Si no estuvieran aquí,
    // cualquier función que devuelva `normalizarHorarioTop(estado)` —y son
    // muchas— borraría el material y la mochila enteros en el siguiente
    // guardado. Es el mismo fallo de `visible`, `archivado` y `grupos`, pero
    // con más datos por delante.
    materiales: Array.isArray(g.materiales) ? g.materiales : [],
    enlacesMaterial: Array.isArray(g.enlacesMaterial) ? g.enlacesMaterial : [],
    mochila: Array.isArray(g.mochila) ? g.mochila : [],
    mochilas: Array.isArray(g.mochilas) ? g.mochilas : [],
    inventario: g.inventario && typeof g.inventario === 'object' ? g.inventario : {},
    kits: Array.isArray(g.kits) ? g.kits : [],
    dependencias: g.dependencias && typeof g.dependencias === 'object' ? g.dependencias : {},
    reglas: Array.isArray(g.reglas) ? g.reglas : [],
    completadas: Array.isArray(g.completadas) ? g.completadas.filter((x) => typeof x === 'string') : [],
    automatizaciones: Array.isArray(g.automatizaciones) ? g.automatizaciones : [],
    historialAuto: Array.isArray(g.historialAuto) ? g.historialAuto : [],
    avisos: Array.isArray(g.avisos) ? g.avisos : [],
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

  // HT F2 · apartado 7 — además de estar activo, el horario tiene que estar
  // VIGENTE esa fecha. Así el curso pasado deja de resolver solo.
  const horarios = e.horarios.filter((h) => horarioVigente(h, fecha) && (!horarioId || h.id === horarioId));
  const salida = [];

  for (const horario of horarios) {
    if (horarioLibre(horario.id)) continue;
    // Solo las columnas que representan un día real resuelven a una fecha. Una
    // columna "Semana A" no es ningún día: sus bloques existen, pero no caen en
    // ninguna fecha hasta que una fase futura decida qué semana es cuál.
    // Una columna oculta (apartado 8, `is_visible`) no resuelve: es como
    // plegar el sábado sin borrar lo que hay dentro.
    // Una columna bloqueada SÍ resuelve: bloquear impide editarla, no la
    // esconde (apartado 8). La que no resuelve es la oculta.
    const columnas = horario.columnas.filter((c) => c.dia === dia && c.visible !== false);
    if (!columnas.length) continue;

    for (const bloque of e.bloques.filter((b) => b.horarioId === horario.id && columnas.some((c) => c.id === b.columnaId))) {
      const cancelado = excepcionesHoy.find((x) => x.tipo === 'cancelado' && x.bloqueId === bloque.id);
      if (cancelado) continue;
      // Apartado 23 — la alternancia de semanas. Si esta semana no toca, el
      // bloque simplemente no ocurre; no es una cancelación.
      if (!tocaEsaSemana(bloque.recurrencia, fecha)) continue;

      const cambio = excepcionesHoy.find((x) => x.tipo === 'modificado' && x.bloqueId === bloque.id);
      salida.push(componerEvento(e, horario, bloque, cambio, asignaturas));
    }
  }

  // Lo añadido a mano ese día. No necesita bloque: es lo que cubre una excursión
  // o una clase de recuperación que no está en el horario.
  for (const x of excepcionesHoy.filter((v) => v.tipo === 'anadido')) {
    const horario = e.horarios.find((h) => h.id === x.horarioId) || null;
    if (horario && (!horarioVigente(horario, fecha) || horarioLibre(horario.id))) continue;
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
    // Apartados 15 y 16 — el override del bloque gana; si no hay, el de la
    // actividad. Nunca al revés, o "Matemáticas es azul" dejaría de ser cierto.
    color: bloque?.colorPropio || actividad?.color || '',
    icono: bloque?.iconoPropio || actividad?.icono || '',
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
    horarios: e.horarios.filter((h) => horarioVigente(h, fecha)).length,
    actividades: e.actividades.length,
    bloques: e.bloques.length,
    hoy: linea.total,
    libre: linea.libre,
    minutosHoy: linea.minutos,
  };
}
