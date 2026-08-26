// ============================================================================
// HT · Fase 5/12 — LA ACTIVIDAD COMO ENTIDAD, NO COMO TEXTO
//
// *"«Biología» no será solamente una palabra dentro de una celda. Será una
// entidad que pueda tener identidad, color, icono, profesor, aula, materiales,
// tareas, exámenes, estadísticas… relación con HOY, con la mochila y con la
// IA."* (apartado 1)
//
// ── LO QUE DECIDE LA FASE ──────────────────────────────────────────────────
//
// **1. Todo lo que se puede derivar, se deriva.** Los usos, el tiempo semanal,
// las más utilizadas, las recientes y la carga por día NO SE GUARDAN: salen de
// los bloques. Un contador de "veces usada" empieza a mentir en cuanto se borra
// un bloque, y entonces "Biología (6 bloques)" dice 6 cuando quedan 4 — que es
// exactamente el aviso que el apartado 58 usa para decidir si se borra o no.
//
// **2. Nunca se fusiona sola.** El apartado 57 lo dice literalmente: *"no
// deberá fusionar automáticamente entidades ambiguas"*. Si hay "Biología",
// "Biología 2" y "Biología y Geología", se enseñan las tres y elige Josué.
//
// **3. Borrar una actividad enseña el impacto primero** (apartado 58), y la
// opción recomendada es **archivar**. Una asignatura del curso pasado tiene
// exámenes, notas y horas de estudio colgando; borrarla los deja huérfanos.
//
// **4. Las notas privadas no salen de aquí** (apartados 52 y 73). No aparecen
// en HOY y **no viajan en el contexto que se le manda a la IA**. Hay una prueba
// que falla si aparecen.
//
// ── LO QUE NO HACE ─────────────────────────────────────────────────────────
//
// · **No llama a ninguna IA** (regla 7). `contextoActividadIA` devuelve
//   estructura; quien la use decidirá si la manda y cuándo, a un toque.
// · **No escribe en Estudios ni en Productividad.** Los exámenes y las tareas
//   se LEEN de sus módulos; el horario no es dueño de ese dato (apartado 92:
//   *"principio de referencia única"*).
// ============================================================================

import { uid, todayISO } from './helpers';
import {
  normalizarHorarioTop, normalizarActividad, nombreDeActividad, crearActividad,
  ESTADOS_ACTIVIDAD, VISTAS_ACTIVIDAD, TIPOS_ACTIVIDAD, duracionMinutos, DIAS_SEMANA,
} from './horario';
import { PALETA_ACTIVIDADES } from './horarioEditor';

/* ===========================================================================
   1 · IDENTIDAD: NOMBRE, CORTO, ALIAS (apartados 5, 6, 7 y 27)
   =========================================================================== */

/** Todo lo que identifica a una actividad, en minúsculas y sin repetir. */
export function terminosDe(actividad, asignaturas = []) {
  const a = normalizarActividad(actividad);
  const partes = [nombreDeActividad(a, asignaturas), a.nombre, a.corto, ...a.alias, ...a.etiquetas];
  return [...new Set(partes.map((x) => (x || '').trim().toLowerCase()).filter(Boolean))];
}

/**
 * El nombre corto que se enseña en la cuadrícula. Si no hay, se recorta el
 * nombre — **nunca se deja vacío**, porque una celda sin texto no se distingue
 * de una celda libre (apartado 60 de F3: el color no puede ser lo único).
 */
export function cortoDe(actividad, asignaturas = [], largo = 3) {
  const a = normalizarActividad(actividad);
  if (a.corto) return a.corto;
  const nombre = nombreDeActividad(a, asignaturas);
  return nombre.slice(0, Math.max(2, largo)).toUpperCase();
}

/* ===========================================================================
   2 · ICONOS (apartados 9 y 10)
   ===========================================================================
   Una biblioteca corta de emojis. La especificación pide *"soporte futuro para
   emojis, iconos personalizados, imágenes, avatares y símbolos"*: el emoji es
   el único de los cinco que funciona hoy sin subir un archivo, así que es el
   que se ofrece, y el campo acepta cualquier cadena para que mañana quepa otra
   cosa sin migrar nada. */
export const ICONOS_ACTIVIDAD = [
  { id: '📐', etiqueta: 'Matemáticas' },
  { id: '🧬', etiqueta: 'Biología' },
  { id: '🌍', etiqueta: 'Geografía' },
  { id: '📚', etiqueta: 'Lengua' },
  { id: '🗣️', etiqueta: 'Idiomas' },
  { id: '⚗️', etiqueta: 'Química' },
  { id: '🔭', etiqueta: 'Física' },
  { id: '💻', etiqueta: 'Informática' },
  { id: '🎨', etiqueta: 'Arte' },
  { id: '🎵', etiqueta: 'Música' },
  { id: '🏛️', etiqueta: 'Historia' },
  { id: '⚽', etiqueta: 'Deporte' },
  { id: '🏋️', etiqueta: 'Entrenamiento' },
  { id: '💼', etiqueta: 'Trabajo' },
  { id: '📝', etiqueta: 'Estudio' },
  { id: '☕', etiqueta: 'Descanso' },
];

/** Un icono por defecto según el tipo, para que crear no obligue a elegir. */
const ICONO_POR_TIPO = {
  asignatura: '📚', entrenamiento: '🏋️', estudio: '📝', trabajo: '💼',
  reunion: '🗣️', personal: '⭐', rutina: '🔁', descanso: '☕', otro: '•',
};

export const iconoDe = (actividad) => {
  const a = normalizarActividad(actividad);
  return a.icono || ICONO_POR_TIPO[a.tipo] || ICONO_POR_TIPO.otro;
};

/* ===========================================================================
   3 · GRUPOS Y COLORES (apartados 15, 64 y 65)
   ===========================================================================
   *"Un grupo podrá tener un color general. Las actividades individuales podrán
   heredar, sobrescribir o utilizar un color propio."*

   Y el apartado 15: la actividad tiene un color global, pero **un bloque
   concreto puede tener otro** — "Examen de Biología" en rojo sin repintar
   Biología entera. La cadena es: bloque → actividad → grupo → acento. */

export function crearGrupo({ nombre = '', color = '', icono = '' } = {}) {
  return { id: uid(), nombre: (nombre || '').trim() || 'Grupo', color: (color || '').trim(), icono: (icono || '').trim() };
}

export const normalizarGrupo = (g) => ({
  id: g?.id || uid(),
  nombre: (g?.nombre || '').trim() || 'Grupo',
  color: (g?.color || '').trim(),
  icono: (g?.icono || '').trim(),
});

export const gruposDe = (estado) => (Array.isArray(estado?.grupos) ? estado.grupos : []).map(normalizarGrupo);

/** El color de una actividad, heredando del grupo si ella no tiene uno propio. */
export function colorDeActividad(actividad, grupos = [], acento = '') {
  const a = normalizarActividad(actividad);
  if (a.color) return a.color;
  const grupo = grupos.find((g) => g.id === a.grupoId);
  return grupo?.color || acento || '';
}

/**
 * El color con el que se pinta UN BLOQUE. El override del bloque gana.
 * ⚠️ Cambiar el color de un bloque **no toca la actividad**: es la mitad del
 * apartado 44 que evita que marcar un examen en rojo repinte la asignatura.
 */
export function colorDeBloque(bloque, actividades = [], grupos = [], acento = '') {
  if (bloque?.color) return bloque.color;
  const act = actividades.find((a) => a.id === bloque?.actividadId);
  return act ? colorDeActividad(act, grupos, acento) : acento || '';
}

/**
 * Apartado 13 — *"el sistema elegirá un color disponible intentando evitar que
 * dos actividades importantes tengan colores demasiado parecidos"*.
 *
 * Se recorre la paleta y se coge el primero que no esté usado. Solo cuando
 * están todos usados se repite, y entonces se elige el menos repetido — dos
 * asignaturas del mismo color es feo, pero dejar una sin color es peor.
 */
export function colorLibre(actividades = [], grupos = []) {
  const usados = actividades.map((a) => colorDeActividad(a, grupos)).filter(Boolean);
  const libre = PALETA_ACTIVIDADES.find((c) => !usados.includes(c));
  if (libre) return libre;
  const cuenta = new Map(PALETA_ACTIVIDADES.map((c) => [c, 0]));
  for (const c of usados) if (cuenta.has(c)) cuenta.set(c, cuenta.get(c) + 1);
  return [...cuenta.entries()].sort((a, b) => a[1] - b[1])[0][0];
}

/* ===========================================================================
   4 · BUSCAR, DUPLICADOS Y PARECIDAS (apartados 27, 56 y 57)
   =========================================================================== */

/** Busca por nombre, nombre corto, alias y etiquetas. "bio" encuentra Biología. */
export function buscarActividades(estado, texto, { asignaturas = [], incluirArchivadas = false } = {}) {
  const e = normalizarHorarioTop(estado);
  const q = (texto || '').trim().toLowerCase();
  if (!q) return [];
  return e.actividades
    .filter((a) => (incluirArchivadas ? true : a.estado !== 'archivada'))
    .filter((a) => terminosDe(a, asignaturas).some((t) => t.includes(q)));
}

const sinAcentos = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Apartados 56 y 57 — antes de crear "Biología", decir si ya existe.
 *
 * Devuelve `exacta` (misma cosa escrita igual, sin importar tildes ni mayúsculas)
 * y `parecidas` (una contiene a la otra: "Biología" vs "Biología y Geología").
 *
 * ⚠️ **No fusiona nada.** Solo informa; quien decide es Josué. Fusionar
 * "Biología" y "Biología 2" por parecerse podría juntar dos asignaturas
 * distintas de dos cursos, y eso no se deshace.
 */
export function duplicadosDe(estado, nombre, { asignaturas = [], ignorarId = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const q = sinAcentos(nombre);
  if (!q) return { exacta: null, parecidas: [] };

  const candidatas = e.actividades.filter((a) => a.id !== ignorarId);
  const exacta = candidatas.find((a) => terminosDe(a, asignaturas).some((t) => sinAcentos(t) === q)) || null;
  const parecidas = candidatas.filter((a) => {
    if (a.id === exacta?.id) return false;
    return terminosDe(a, asignaturas).some((t) => {
      const s = sinAcentos(t);
      return s !== q && (s.includes(q) || q.includes(s));
    });
  });
  return { exacta, parecidas };
}

/* ===========================================================================
   5 · CREAR, DUPLICAR, ARCHIVAR Y BORRAR (apartados 18, 28, 58, 59, 60 y 61)
   =========================================================================== */

/**
 * Crear una actividad avisando si ya existe (apartado 56). Si hay exacta y no
 * se ha dicho `forzar`, **no se crea nada** y se devuelve la que ya había.
 */
export function crearActividadUnica(estado, datos = {}, { asignaturas = [], forzar = false, hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const nombre = (datos.nombre || '').trim();
  if (!nombre && !datos.asignaturaId) return { estado: e, actividad: null, error: 'Ponle un nombre.' };

  const { exacta, parecidas } = duplicadosDe(e, nombre, { asignaturas });
  if (exacta && !forzar) {
    return { estado: e, actividad: exacta, yaExistia: true, parecidas, error: null };
  }
  const actividad = crearActividad({
    ...datos,
    color: datos.color || colorLibre(e.actividades, gruposDe(e)),
    hoy,
  });
  return {
    estado: { ...e, grupos: gruposDe(e), actividades: [...e.actividades, actividad] },
    actividad, yaExistia: false, parecidas, error: null,
  };
}

/** Editar. `actualizadoEn` se toca siempre, que es lo que ordena "recientes". */
export function editarActividad(estado, actividadId, cambios = {}) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    grupos: gruposDe(e),
    actividades: e.actividades.map((a) => (a.id === actividadId
      ? normalizarActividad({ ...a, ...cambios, id: a.id, actualizadoEn: new Date().toISOString() })
      : a)),
  };
}

/**
 * Apartado 61 — duplicar crea una **entidad nueva**, no una referencia.
 * *"Esto evitará modificar accidentalmente la actividad histórica."*
 * Los bloques NO se copian: duplicar Biología 26/27 a 27/28 no debe traerse
 * las clases del año pasado.
 */
export function duplicarActividad(estado, actividadId, { nombre = '', hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const original = e.actividades.find((a) => a.id === actividadId);
  if (!original) return { estado: e, actividad: null, error: 'Esa actividad ya no existe.' };
  const copia = normalizarActividad({
    ...original,
    id: uid(),
    nombre: (nombre || '').trim() || `${nombreDeActividad(original)} (copia)`,
    // La copia es suya: no arrastra el enlace con Estudios, o renombrar una
    // cambiaría el nombre de las dos.
    asignaturaId: null,
    favorita: false,
    estado: 'activa',
    creadoEn: hoy,
    actualizadoEn: hoy,
  });
  return { estado: { ...e, grupos: gruposDe(e), actividades: [...e.actividades, copia] }, actividad: copia, error: null };
}

/** Cuántos bloques usan la actividad. **Derivado**, nunca guardado. */
export const usosDeActividad = (estado, actividadId) =>
  normalizarHorarioTop(estado).bloques.filter((b) => b.actividadId === actividadId).length;

/**
 * Apartado 58 — *"Biología está utilizada en 6 bloques, 4 tareas y 1 examen."*
 * Se calcula **antes** de borrar y la opción recomendada es archivar.
 *
 * Los exámenes salen de Estudios por `asignaturaId`, que es un enlace de
 * verdad. Las tareas de Productividad **no tienen asignatura**, así que solo se
 * cuentan las que MENCIONAN la actividad por su nombre o su alias — y se dice
 * así, en vez de fingir un enlace que no existe (regla 8).
 */
export function impactoEliminarActividad(estado, actividadId, { asignaturas = [], estudios = null, productividad = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const act = e.actividades.find((a) => a.id === actividadId);
  if (!act) return null;

  const bloques = e.bloques.filter((b) => b.actividadId === actividadId);
  const idsBloque = bloques.map((b) => b.id);
  const excepciones = e.excepciones.filter((x) => idsBloque.includes(x.bloqueId));
  const examenes = act.asignaturaId
    ? (estudios?.examenes || []).filter((x) => x.asignaturaId === act.asignaturaId)
    : [];
  const tareas = tareasQueMencionan(productividad, act, asignaturas);
  const hijas = e.actividades.filter((a) => a.padreId === actividadId);

  return {
    nombre: nombreDeActividad(act, asignaturas),
    bloques: bloques.length,
    excepciones: excepciones.length,
    examenes: examenes.length,
    tareas: tareas.length,
    hijas: hijas.length,
    // Vacía del todo se puede borrar sin pensarlo; con algo colgando, archivar.
    recomendado: (bloques.length + examenes.length + tareas.length + hijas.length) > 0 ? 'archivar' : 'eliminar',
  };
}

/**
 * Apartados 31 y 92 — las tareas viven en Productividad y no tienen campo de
 * asignatura. Enlazarlas de verdad exigiría cambiar ese módulo; mientras tanto
 * se buscan las que la nombran, y la interfaz lo dice tal cual.
 */
export function tareasQueMencionan(productividad, actividad, asignaturas = []) {
  const terminos = terminosDe(actividad, asignaturas).filter((t) => t.length >= 3);
  if (!terminos.length) return [];
  return (productividad?.tareas || []).filter((t) => {
    const texto = sinAcentos(t?.texto || t?.titulo || '');
    return terminos.some((q) => texto.includes(sinAcentos(q)));
  });
}

/**
 * Apartados 17, 49 y 59 — archivar conserva todo. Los bloques **no se borran**:
 * si la actividad vuelve, el horario vuelve con ella.
 */
export const archivarActividad = (estado, actividadId, archivar = true) =>
  editarActividad(estado, actividadId, { estado: archivar ? 'archivada' : 'activa' });

export const ocultarActividad = (estado, actividadId, ocultar = true) =>
  editarActividad(estado, actividadId, { estado: ocultar ? 'oculta' : 'activa' });

/**
 * Borrar de verdad. Los bloques se quedan **sin actividad, no borrados** — la
 * misma decisión que HT F1 tomó y que AR F2 tomó con una prenda de un outfit:
 * perder la hora de una clase por haber borrado la asignatura sería mucho peor
 * que un hueco que se vuelve a rellenar.
 */
export function eliminarActividadDefinitiva(estado, actividadId) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    grupos: gruposDe(e),
    actividades: e.actividades.filter((a) => a.id !== actividadId),
    bloques: e.bloques.map((b) => (b.actividadId === actividadId ? { ...b, actividadId: null } : b)),
    // Una hija sin madre se queda suelta, no desaparece (apartado 63).
    // Se hace en el mismo paso para no dejar un `padreId` apuntando a la nada.
  };
}

/* ===========================================================================
   6 · ORDEN, FAVORITOS Y RECIENTES (apartados 25, 26, 83 y 84)
   ===========================================================================
   *"Favoritas · Recientes · Más utilizadas · Alfabéticamente."*

   Ninguno de los tres primeros se guarda. "Reciente" es el bloque más nuevo que
   la usa, "más utilizada" es cuántos bloques la usan, y favorita sí es una
   marca porque la pone Josué a mano. */

export const ORDENES_ACTIVIDAD = [
  { id: 'inteligente', label: 'Recomendado' },
  { id: 'recientes', label: 'Recientes' },
  { id: 'usadas', label: 'Más usadas' },
  { id: 'alfabetico', label: 'A-Z' },
];

/** El bloque más reciente que usa cada actividad, como marca de tiempo. */
function ultimoUsoPorActividad(estado) {
  const mapa = new Map();
  for (const b of normalizarHorarioTop(estado).bloques) {
    if (!b.actividadId) continue;
    const t = b.actualizadoEn || b.creadoEn || '';
    if (!mapa.has(b.actividadId) || t > mapa.get(b.actividadId)) mapa.set(b.actividadId, t);
  }
  return mapa;
}

export function actividadesOrdenadas(estado, { orden = 'inteligente', asignaturas = [], incluirArchivadas = false, tipo = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const usos = ultimoUsoPorActividad(e);
  const cuenta = new Map();
  for (const b of e.bloques) if (b.actividadId) cuenta.set(b.actividadId, (cuenta.get(b.actividadId) || 0) + 1);

  const lista = e.actividades
    .filter((a) => (incluirArchivadas ? true : a.estado !== 'archivada'))
    .filter((a) => (tipo ? a.tipo === tipo : true))
    .map((a) => ({
      ...a,
      titulo: nombreDeActividad(a, asignaturas),
      usos: cuenta.get(a.id) || 0,
      ultimoUso: usos.get(a.id) || a.actualizadoEn || '',
    }));

  const porNombre = (x, y) => x.titulo.localeCompare(y.titulo, 'es');
  if (orden === 'alfabetico') return lista.sort(porNombre);
  if (orden === 'usadas') return lista.sort((x, y) => y.usos - x.usos || porNombre(x, y));
  if (orden === 'recientes') return lista.sort((x, y) => (y.ultimoUso > x.ultimoUso ? 1 : y.ultimoUso < x.ultimoUso ? -1 : porNombre(x, y)));
  // "Recomendado" es el orden del apartado 83: favoritas, recientes, usadas, A-Z.
  return lista.sort((x, y) =>
    (y.favorita - x.favorita)
    || (y.ultimoUso > x.ultimoUso ? 1 : y.ultimoUso < x.ultimoUso ? -1 : 0)
    || (y.usos - x.usos)
    || porNombre(x, y));
}

export const alternarFavorita = (estado, actividadId) => {
  const act = normalizarHorarioTop(estado).actividades.find((a) => a.id === actividadId);
  return act ? editarActividad(estado, actividadId, { favorita: !act.favorita }) : normalizarHorarioTop(estado);
};

/* ===========================================================================
   7 · VISIBILIDAD (apartados 50 y 51)
   ===========================================================================
   *"Trabajo personal puede aparecer en HOY y en calendario, pero no
   necesariamente en el horario escolar."* */

export function visibleEn(actividad, vista) {
  const a = normalizarActividad(actividad);
  if (a.estado === 'archivada') return false;
  // "Oculta" es exactamente eso: sigue viva, no se enseña.
  if (a.estado === 'oculta') return false;
  if (!VISTAS_ACTIVIDAD.includes(vista)) return true;
  return a.visibilidad[vista] !== false;
}

/** Filtra una lista de eventos resueltos por la visibilidad de su actividad. */
export function filtrarPorVisibilidad(eventos, actividades, vista) {
  return (eventos || []).filter((ev) => {
    if (!ev.actividadId) return true;
    const act = actividades.find((a) => a.id === ev.actividadId);
    return act ? visibleEn(act, vista) : true;
  });
}

/* ===========================================================================
   8 · ESTADÍSTICAS DERIVADAS (apartados 45, 46 y 47)
   ===========================================================================
   *"Esta semana tienes 4 h de Biología."* Todo sale de los bloques. */

/** Minutos a la semana de una actividad, sumando la duración de sus bloques. */
export function tiempoSemanal(estado, actividadId) {
  const e = normalizarHorarioTop(estado);
  return e.bloques
    .filter((b) => b.actividadId === actividadId)
    .reduce((total, b) => total + (duracionMinutos(b.inicio, b.fin) || 0), 0);
}

export const horasYMinutos = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!min) return '0 min';
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/** El reparto semanal completo, de más a menos tiempo. */
export function repartoSemanal(estado, { asignaturas = [] } = {}) {
  const e = normalizarHorarioTop(estado);
  return e.actividades
    .map((a) => ({ id: a.id, titulo: nombreDeActividad(a, asignaturas), minutos: tiempoSemanal(e, a.id) }))
    .filter((x) => x.minutos > 0)
    .sort((x, y) => y.minutos - x.minutos);
}

/**
 * Apartado 47 — la carga de cada día, para que más adelante alguien pueda decir
 * *"el jueves tienes demasiadas actividades concentradas"*. Aquí solo se
 * calcula: **no se emite ningún juicio ni se avisa de nada** (eso es Fase 11).
 */
export function cargaPorDia(estado, horarioId) {
  const e = normalizarHorarioTop(estado);
  const salida = DIAS_SEMANA.map((d) => ({ dia: d.id, label: d.label, bloques: 0, minutos: 0 }));
  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return salida;
  const dias = new Map((horario.columnas || []).map((c) => [c.id, c.dia]));
  for (const b of e.bloques.filter((x) => x.horarioId === horarioId)) {
    const dia = dias.get(b.columnaId);
    if (!dia) continue;
    const fila = salida[dia - 1];
    if (!fila) continue;
    fila.bloques++;
    fila.minutos += duracionMinutos(b.inicio, b.fin) || 0;
  }
  return salida;
}

/* ===========================================================================
   9 · LA FICHA (apartados 29, 30, 77, 79 y 100)
   ===========================================================================
   *"El panel será una puerta de entrada al resto de la información
   relacionada."* No calcula nada nuevo: junta lo que ya existe. */

export function fichaActividad(estado, actividadId, { asignaturas = [], estudios = null, productividad = null, grupos = null, acento = '', hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const act = e.actividades.find((a) => a.id === actividadId);
  if (!act) return null;

  const grupitos = grupos || gruposDe(e);
  const bloques = e.bloques.filter((b) => b.actividadId === actividadId);
  const columnas = new Map();
  for (const h of e.horarios) for (const c of h.columnas || []) columnas.set(c.id, c);

  const horario = bloques
    .map((b) => {
      const col = columnas.get(b.columnaId);
      return {
        bloqueId: b.id,
        dia: col?.dia || null,
        diaLabel: col?.dia ? DIAS_SEMANA[col.dia - 1].label : (col?.nombre || ''),
        inicio: b.inicio,
        fin: b.fin,
        minutos: duracionMinutos(b.inicio, b.fin) || 0,
      };
    })
    .sort((x, y) => (x.dia || 9) - (y.dia || 9) || x.inicio.localeCompare(y.inicio));

  const examenes = act.asignaturaId
    ? (estudios?.examenes || [])
      .filter((x) => x.asignaturaId === act.asignaturaId)
      .sort((x, y) => (x.fecha || '').localeCompare(y.fecha || ''))
    : [];

  const tareas = tareasQueMencionan(productividad, act, asignaturas);

  return {
    id: act.id,
    titulo: nombreDeActividad(act, asignaturas),
    corto: cortoDe(act, asignaturas),
    icono: iconoDe(act),
    color: colorDeActividad(act, grupitos, acento),
    tipo: TIPOS_ACTIVIDAD.find((t) => t.id === act.tipo)?.label || 'Otro',
    estado: ESTADOS_ACTIVIDAD.find((s) => s.id === act.estado)?.label || 'Activa',
    favorita: act.favorita,
    grupo: grupitos.find((g) => g.id === act.grupoId) || null,
    profesor: act.persona,
    aula: act.ubicacion,
    descripcion: act.descripcion,
    etiquetas: act.etiquetas,
    alias: act.alias,
    material: act.material,
    // Las notas van en la ficha porque es la pantalla privada de Josué; lo que
    // NO hacen es salir de aquí (ni a HOY, ni a la IA).
    notas: act.notas,
    horario,
    minutosSemana: horario.reduce((t, x) => t + x.minutos, 0),
    usos: bloques.length,
    examenes: examenes.map((x) => ({ id: x.id, fecha: x.fecha, tema: x.tema, pasado: !!x.fecha && x.fecha < hoy })),
    examenesProximos: examenes.filter((x) => x.fecha && x.fecha >= hoy).length,
    tareas: tareas.map((t) => ({ id: t.id, texto: t.texto || t.titulo || '', hecha: !!t.hecha })),
    tareasPendientes: tareas.filter((t) => !t.hecha).length,
    // ⚠️ Se dice de dónde sale el enlace de las tareas, porque no es un enlace
    // real: Productividad no tiene campo de asignatura.
    tareasPorMencion: true,
  };
}

/* ===========================================================================
   10 · CONTEXTO PARA LA IA (apartados 53, 54, 73 y 99)
   ===========================================================================
   *"La IA podrá consultar la ficha completa de una actividad cuando sea
   necesario."*

   ⚠️ **Devuelve estructura, no un texto, y NO LLAMA A NADIE** (regla 7). Y
   **nunca incluye las notas privadas** (apartados 52 y 73): hay una prueba que
   falla si aparecen. Lo que no sale de aquí no puede acabar en un servidor. */
export function contextoActividadIA(estado, actividadId, opciones = {}) {
  const f = fichaActividad(estado, actividadId, opciones);
  if (!f) return null;
  return {
    nombre: f.titulo,
    tipo: f.tipo,
    profesor: f.profesor || null,
    aula: f.aula || null,
    material: f.material,
    etiquetas: f.etiquetas,
    horario: f.horario.map((h) => ({ dia: h.diaLabel, inicio: h.inicio, fin: h.fin })),
    minutosSemana: f.minutosSemana,
    examenesProximos: f.examenesProximos,
    proximoExamen: f.examenes.find((x) => !x.pasado) || null,
    tareasPendientes: f.tareasPendientes,
  };
}

/* ===========================================================================
   11 · SUGERENCIAS (apartado 86)
   ===========================================================================
   *"¿Quieres añadir Biología? La utilizas habitualmente en este horario."*
   *"El usuario decide. No se deberá modificar el horario automáticamente."*

   Así que esto devuelve candidatas y nada más: no escribe. */
export function sugerenciasParaCelda(estado, { horarioId, columnaId, filaId, asignaturas = [], maximo = 4 } = {}) {
  const e = normalizarHorarioTop(estado);
  const horario = e.horarios.find((h) => h.id === horarioId);
  const fila = (horario?.filas || []).find((f) => f.id === filaId);
  const columna = (horario?.columnas || []).find((c) => c.id === columnaId);

  const puntos = new Map();
  const sumar = (id, n) => { if (id) puntos.set(id, (puntos.get(id) || 0) + n); };

  for (const b of e.bloques.filter((x) => x.horarioId === horarioId)) {
    // Lo que suele ir a esta misma hora pesa más que lo que suele ir este día:
    // el patrón de "los martes a las 10 toca Biología" es el que acierta.
    if (fila && b.inicio === fila.inicio) sumar(b.actividadId, 3);
    if (columna && b.columnaId === columnaId) sumar(b.actividadId, 2);
    sumar(b.actividadId, 1);
  }

  return actividadesOrdenadas(e, { asignaturas })
    .map((a) => ({ ...a, peso: puntos.get(a.id) || 0 }))
    .filter((a) => a.peso > 0 || a.favorita)
    .sort((x, y) => y.peso - x.peso || y.favorita - x.favorita)
    .slice(0, maximo);
}

/* ===========================================================================
   12 · JERARQUÍA Y RESUMEN (apartados 62, 63, 64 y 79)
   =========================================================================== */

/** Las hijas de una actividad. La jerarquía es opcional (apartado 63). */
export const hijasDe = (estado, actividadId) =>
  normalizarHorarioTop(estado).actividades.filter((a) => a.padreId === actividadId);

/**
 * ⚠️ Una actividad no puede ser su propia madre ni su propia abuela. Sin esta
 * comprobación, `hijasDe` recorrido en árbol daría una recursión infinita y la
 * pantalla se quedaría en blanco.
 */
export function puedeSerPadre(estado, actividadId, padreId) {
  if (!padreId || actividadId === padreId) return false;
  const e = normalizarHorarioTop(estado);
  const vistos = new Set([actividadId]);
  let actual = e.actividades.find((a) => a.id === padreId);
  while (actual) {
    if (vistos.has(actual.id)) return false;
    vistos.add(actual.id);
    actual = actual.padreId ? e.actividades.find((a) => a.id === actual.padreId) : null;
  }
  return true;
}

export function resumenActividades(estado, { asignaturas = [] } = {}) {
  const e = normalizarHorarioTop(estado);
  const lista = actividadesOrdenadas(e, { asignaturas, incluirArchivadas: true });
  return {
    total: lista.length,
    activas: lista.filter((a) => a.estado === 'activa').length,
    archivadas: lista.filter((a) => a.estado === 'archivada').length,
    ocultas: lista.filter((a) => a.estado === 'oculta').length,
    favoritas: lista.filter((a) => a.favorita).length,
    sinUsar: lista.filter((a) => a.usos === 0).length,
    conAsignatura: lista.filter((a) => a.asignaturaId).length,
    grupos: gruposDe(e).length,
    minutosSemana: lista.reduce((t, a) => t + tiempoSemanal(e, a.id), 0),
  };
}
