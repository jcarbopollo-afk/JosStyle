// ============================================================================
// ENTREGA 3 · FASE 19 (BL F5) — BIBLIOTECA: IDEAS
//
// *"Ideas debe ser el lugar donde el usuario pueda capturar algo que se le
// acaba de ocurrir y **decidir posteriormente** qué hacer con ello."*
//
// > NOTA: *"quiero conservar esta información."*
// > IDEA: *"se me ha ocurrido algo que podría desarrollar."*
//
// 🚨 **La colección es `biblioteca.ideas`**, la que creó la BL F1 con su modelo
// mínimo. Como en Libros y en Guardados, esta fase **amplía la ficha con su
// migración** y **muda aquí la fábrica** en vez de escribir una segunda: dos
// formas de la misma idea conviviendo acaban con una perdiendo campos en el
// siguiente guardado (regla 5, vigesimoprimera vez).
// ============================================================================

import { uid, fechaLocalISO, fechaValida } from './helpers.js';
import { PERIODOS_META, PLAZOS_OBJETIVO } from '../tokens.js';

/* ── Los cinco estados ─────────────────────────────────────────────────────

   ⚠️ Cada uno con su NOMBRE además del icono (EH F42), y con la frase que el
   enunciado le da: es lo que la pantalla enseña al elegir. */
export const ESTADOS_IDEA = [
  { id: 'captured', nombre: 'Capturada', icono: '💡', que: 'Acaba de surgir.' },
  { id: 'developing', nombre: 'Desarrollando', icono: '🔧', que: 'Estás trabajando en ella.' },
  { id: 'paused', nombre: 'En pausa', icono: '⏸️', que: 'Ahora mismo no la tocas.' },
  { id: 'completed', nombre: 'Realizada', icono: '✅', que: 'La has llevado a cabo.' },
  { id: 'discarded', nombre: 'Descartada', icono: '🗃️', que: 'Has decidido no continuar.' },
];

export const estadoIdea = (id) => ESTADOS_IDEA.find((e) => e.id === id) || null;
export const ESTADO_IDEA_POR_DEFECTO = 'captured';

/* ── Prioridad y categorías ────────────────────────────────────────────────

   *"Por defecto: Media. **No hacer que la prioridad sea obligatoria.**"* Así
   que siempre tiene valor y nunca se pregunta al crear. */
export const PRIORIDADES_IDEA = [
  { id: 'baja', nombre: 'Baja', peso: 0 },
  { id: 'media', nombre: 'Media', peso: 1 },
  { id: 'alta', nombre: 'Alta', peso: 2 },
];

export const prioridadIdea = (id) => PRIORIDADES_IDEA.find((p) => p.id === id) || null;
export const PRIORIDAD_POR_DEFECTO = 'media';

/**
 * Las categorías del enunciado, **opcionales**.
 *
 * ⚠️ *"El usuario debe poder crear categorías personalizadas posteriormente si
 * la arquitectura lo permite"*: se guarda **el texto**, no un id contra este
 * catálogo, así que una categoría escrita a mano ya funciona hoy y estas siete
 * son solo las sugerencias de la pantalla. Un catálogo cerrado habría hecho
 * falta cambiarlo para admitir la primera categoría suya.
 */
export const CATEGORIAS_IDEA = ['Personal', 'Estudios', 'Fitness', 'Negocio', 'Tecnología', 'Contenido', 'Otros'];

export const MAX_TITULO_IDEA = 300;

/* ── La ficha ──────────────────────────────────────────────────────────────

   El enunciado enumera quince campos. Uno no se guarda —`user_id`, porque el
   aislamiento es de `app_data`— y `archived_at` se acompaña de `archivada`,
   porque **archivar y descartar son dos cosas distintas** y el propio enunciado
   lo subraya: *"una idea puede estar realizada y posteriormente archivarse"*.
   Con un solo campo de estado no cabrían las dos. */
export const CAMPOS_IDEA = [
  'id', 'titulo', 'descripcion', 'notas', 'estado', 'prioridad', 'categoria',
  'objetivoId', 'metaId', 'tareaId',
  'fecha', 'actualizado', 'completado', 'archivada',
];

/**
 * 🚨 *"Debe existir una forma de crear una idea rápidamente… `+` → título →
 * guardar. **Sin obligar a rellenar descripción, categoría o prioridad.**"*
 *
 * ⚠️ Y el título es *"recomendado pero no necesariamente obligatorio"*: basta
 * con **una de las dos cosas**, título o descripción. Escribir solo la idea en
 * el campo grande y guardarla tiene que funcionar.
 */
export function crearIdea({
  titulo = '', descripcion = '', notas = '', detalle = '',
  estado = ESTADO_IDEA_POR_DEFECTO, prioridad = PRIORIDAD_POR_DEFECTO, categoria = '',
} = {}) {
  /* ⚠️ `detalle` era el nombre del campo en el modelo mínimo de la BL F1. Se
     acepta al crear para que nada de lo que ya llamaba a esta fábrica se rompa,
     y se guarda donde le toca. */
  const desc = String(descripcion || detalle || '').trim();
  const tit = String(titulo || '').trim().slice(0, MAX_TITULO_IDEA);
  if (!tit && !desc) return null;
  const hoy = fechaLocalISO(new Date());
  const est = estadoIdea(estado) ? estado : ESTADO_IDEA_POR_DEFECTO;
  return {
    id: uid(),
    titulo: tit,
    descripcion: desc,
    notas: String(notas || '').trim(),
    estado: est,
    prioridad: prioridadIdea(prioridad) ? prioridad : PRIORIDAD_POR_DEFECTO,
    categoria: String(categoria || '').trim(),
    /* *"Preparar campos para objective_id, goal_id y task_id."* Existen desde
       el primer día para que convertir no tenga que migrar nada. */
    objetivoId: null,
    metaId: null,
    tareaId: null,
    fecha: hoy,
    actualizado: hoy,
    completado: est === 'completed' ? hoy : null,
    archivada: false,
  };
}

export function normalizarIdea(i) {
  if (!i || typeof i !== 'object') return null;
  /* ⚠️ La migración desde el modelo mínimo de la BL F1: allí el campo largo se
     llamaba `detalle`. Si no se leyera, el texto que Josué escribió entonces
     desaparecería de la pantalla sin que nada fallara. */
  const titulo = typeof i.titulo === 'string' ? i.titulo.trim().slice(0, MAX_TITULO_IDEA) : '';
  const descripcion = typeof i.descripcion === 'string'
    ? i.descripcion
    : (typeof i.detalle === 'string' ? i.detalle : '');
  if (!titulo && !String(descripcion).trim()) return null;
  const estado = estadoIdea(i.estado) ? i.estado : ESTADO_IDEA_POR_DEFECTO;
  const fecha = fechaValida(i.fecha) ? i.fecha : fechaLocalISO(new Date());
  return {
    id: i.id || uid(),
    titulo,
    descripcion,
    notas: typeof i.notas === 'string' ? i.notas : '',
    estado,
    prioridad: prioridadIdea(i.prioridad) ? i.prioridad : PRIORIDAD_POR_DEFECTO,
    categoria: typeof i.categoria === 'string' ? i.categoria : '',
    objetivoId: i.objetivoId || null,
    metaId: i.metaId || null,
    tareaId: i.tareaId || null,
    fecha,
    actualizado: fechaValida(i.actualizado) ? i.actualizado : fecha,
    completado: estado === 'completed' ? (fechaValida(i.completado) ? i.completado : fecha) : (fechaValida(i.completado) ? i.completado : null),
    archivada: i.archivada === true,
  };
}

/* ── Las acciones ──────────────────────────────────────────────────────────*/
const tocada = (i, cambios) => ({ ...i, ...cambios, actualizado: fechaLocalISO(new Date()) });

/**
 * ⚠️ *"Cuando una idea pasa a REALIZADA, guardar `completed_at`. **No borrar el
 * contenido.**"* Y salir de *Realizada* **no borra esa fecha**: pasó de verdad,
 * como la fecha de fin de un libro (E3 F17).
 */
export function cambiarEstadoIdea(idea, estado) {
  if (!idea || !estadoIdea(estado)) return idea || null;
  const hoy = fechaLocalISO(new Date());
  return tocada(idea, {
    estado,
    completado: estado === 'completed' ? (idea.completado || hoy) : idea.completado,
  });
}

/**
 * 🚨 **Archivar y descartar son DOS cosas**, y el enunciado dedica un apartado
 * entero a separarlas: *"una idea puede estar realizada y posteriormente
 * archivarse"*. Por eso `archivada` es un campo aparte del estado — con uno
 * solo, archivar una idea realizada le borraría que la hizo.
 */
export function archivarIdea(idea) {
  return idea ? tocada(idea, { archivada: true }) : null;
}

export function desarchivarIdea(idea) {
  return idea ? tocada(idea, { archivada: false }) : null;
}

export function editarIdea(idea, cambios = {}) {
  if (!idea) return null;
  const propuesta = normalizarIdea({ ...idea, ...cambios });
  if (!propuesta) return idea;
  return { ...propuesta, id: idea.id, fecha: idea.fecha, actualizado: fechaLocalISO(new Date()) };
}

/* ── Convertir una idea en otra cosa ───────────────────────────────────────

   *"Una funcionalidad importante… **no crear copias innecesarias**. Si se
   convierte una idea en una tarea, debe existir una relación con la idea
   original. **La idea original no debe desaparecer automáticamente.**"*

   🚨 Así que `convertirIdea` es un `aplicarPlan` —el decimoctavo del
   proyecto—: **sin `confirmado` no escribe nada**, y lo que devuelve es un plan
   con las dos piezas. Quien guarda es `App.jsx`, que es el dueño de los tres
   almacenes; mismo reparto que `gestionModulos.js` / `estiloDeHombre.js`.

   ⚠️ Y **el destino tiene que existir de verdad**. Documento no existe todavía
   —es la BL F6—, así que se declara con `existe: false` y su frase, que es la
   que se lee en pantalla. Fingirlo sería el control decorativo de la regla 8. */
export const CONVERSIONES = [
  {
    id: 'tarea',
    nombre: 'Tarea',
    icono: '✅',
    existe: true,
    donde: 'Productividad → Tareas',
    campo: 'tareaId',
    /* ⚠️ Una tarea de JosStyle es `{ id, texto, fecha, hecha }` (EH F39; el
       campo paso de `fechaLimite` a `fecha` en la E3 F26, que es el que leen
       Hoy, la Agenda y el Calendario).
       No se le inventan campos: sería el segundo sistema de tareas. */
    pide: [],
  },
  {
    id: 'meta',
    nombre: 'Meta',
    icono: '🎯',
    existe: true,
    donde: 'Productividad → Metas',
    campo: 'metaId',
    /* 🚨 Una meta tiene periodo y cifra, y **ninguno tiene valor por defecto**:
       elegirlos por él metería su idea en "Diaria, 1" sin decírselo, que es la
       lección de `ALCANCES` (HT F3) y del plazo de EH F28. */
    pide: ['periodo', 'objetivo'],
  },
  {
    id: 'objetivo',
    nombre: 'Objetivo',
    icono: '🗺️',
    existe: true,
    donde: 'Objetivos',
    campo: 'objetivoId',
    pide: ['plazo'],
  },
  {
    id: 'documento',
    nombre: 'Documento',
    icono: '📄',
    existe: false,
    donde: 'la mini-app Documentos',
    campo: null,
    pide: [],
    porque: 'Documentos todavía no guarda documentos de texto: llega en su propia fase.',
  },
];

export const conversion = (id) => CONVERSIONES.find((c) => c.id === id) || null;

/** Las que se pueden ofrecer hoy. Una que no existe **no se enseña como
 *  disponible**, se enseña con su frase. */
export const conversionesDisponibles = () => CONVERSIONES.filter((c) => c.existe);

/** El texto con el que nace el elemento convertido: el título si lo hay, y si
 *  no el principio de la descripción. Nunca "Sin título". */
export function textoDeIdea(idea) {
  if (!idea) return '';
  if (idea.titulo) return idea.titulo;
  const t = String(idea.descripcion || '').trim().replace(/\s+/g, ' ');
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
}

/**
 * Devuelve `{ tipo, elemento, idea }` — el elemento nuevo y la idea **con su
 * relación puesta** —, o `{ error }` si no se puede.
 *
 * 🚨 Sin `confirmado` devuelve `{ plan }` y **no construye nada**: mostrar y
 * escribir son dos llamadas.
 */
export function convertirIdea(idea, tipo, opciones = {}, confirmado = false) {
  const destino = conversion(tipo);
  if (!idea) return { error: 'No hay ninguna idea que convertir.' };
  if (!destino) return { error: 'Ese destino no existe.' };
  if (!destino.existe) return { error: destino.porque };
  if (idea[destino.campo]) return { error: `Esta idea ya generó ${destino.nombre.toLowerCase() === 'tarea' ? 'una tarea' : `un ${destino.nombre.toLowerCase()}`}.` };

  const texto = textoDeIdea(idea);
  if (!texto) return { error: 'La idea no tiene texto con el que empezar.' };

  /* Lo que falta por decidir, dicho antes de escribir nada. */
  const faltan = destino.pide.filter((campo) => {
    if (campo === 'periodo') return !PERIODOS_META.includes(opciones.periodo);
    if (campo === 'plazo') return !PLAZOS_OBJETIVO.includes(opciones.plazo);
    if (campo === 'objetivo') return !(Number.isInteger(Number(opciones.objetivo)) && Number(opciones.objetivo) > 0);
    return false;
  });
  if (faltan.length > 0) return { error: 'Falta por decidir algo antes de convertirla.', faltan };

  if (!confirmado) return { plan: { tipo, texto, destino: destino.donde } };

  const hoy = fechaLocalISO(new Date());
  let elemento = null;
  if (tipo === 'tarea') {
    elemento = { id: uid(), texto, fecha: opciones.fechaLimite || opciones.fecha || null, hecha: false };
  } else if (tipo === 'meta') {
    elemento = { id: uid(), nombre: texto, periodo: opciones.periodo, objetivo: Number(opciones.objetivo), progreso: 0 };
  } else if (tipo === 'objetivo') {
    elemento = { id: uid(), texto, plazo: opciones.plazo, cumplido: false, fechaCreacion: hoy };
  }
  if (!elemento) return { error: 'Ese destino no existe.' };

  return {
    tipo,
    elemento,
    /* ⚠️ La idea **no cambia de estado ni desaparece**: solo guarda el id de lo
       que generó. *"La idea original no debe desaparecer automáticamente."* */
    idea: tocada(idea, { [destino.campo]: elemento.id }),
  };
}

/** Qué ha generado ya una idea, para enseñarlo en su detalle. */
export function generadosDe(idea) {
  if (!idea) return [];
  return CONVERSIONES
    .filter((c) => c.campo && idea[c.campo])
    .map((c) => ({ tipo: c.id, nombre: c.nombre, icono: c.icono, donde: c.donde, id: idea[c.campo] }));
}

/* ── Búsqueda, filtros y orden ─────────────────────────────────────────────*/
const sinAcentos = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** *"Buscar por: título, descripción, **notas de desarrollo**."* Las tres. */
export function textoBuscableIdea(idea) {
  return sinAcentos([idea.titulo, idea.descripcion, idea.notas, idea.categoria].filter(Boolean).join(' '));
}

export const FILTROS_IDEAS = [
  { id: 'todas', nombre: 'Todas' },
  ...ESTADOS_IDEA.map((e) => ({ id: e.id, nombre: e.nombre })),
  { id: 'archivadas', nombre: 'Archivadas' },
];

export const ORDENES_IDEAS = [
  { id: 'recientes', nombre: 'Más recientes' },
  { id: 'antiguas', nombre: 'Más antiguas' },
  { id: 'prioridad', nombre: 'Prioridad' },
  { id: 'alfabetico', nombre: 'Alfabético' },
];

export const ORDEN_IDEAS_POR_DEFECTO = 'recientes';

/**
 * 🚨 **Lo archivado no sale entre lo demás**, y sale solo en su filtro — igual
 * que en Guardados. Y **una idea descartada NO se borra**: sigue existiendo y
 * tiene su propio filtro, *"esto permite revisar posteriormente ideas antiguas"*.
 */
export function filtrarIdeas(lista = [], { filtro = 'todas', texto = '' } = {}) {
  const q = sinAcentos(texto).trim();
  return (Array.isArray(lista) ? lista : []).filter((i) => {
    if (filtro === 'archivadas') {
      if (!i.archivada) return false;
    } else if (i.archivada) {
      return false;
    } else if (filtro !== 'todas' && i.estado !== filtro) {
      return false;
    }
    if (!q) return true;
    return textoBuscableIdea(i).includes(q);
  });
}

export function ordenarIdeas(lista = [], orden = ORDEN_IDEAS_POR_DEFECTO) {
  const base = [...(Array.isArray(lista) ? lista : [])];
  const recientes = (a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''));
  switch (orden) {
    case 'antiguas':
      return base.sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
    case 'prioridad':
      return base.sort((a, b) =>
        ((prioridadIdea(b.prioridad)?.peso ?? 1) - (prioridadIdea(a.prioridad)?.peso ?? 1)) || recientes(a, b));
    case 'alfabetico':
      return base.sort((a, b) => textoDeIdea(a).localeCompare(textoDeIdea(b), 'es'));
    default:
      return base.sort(recientes);
  }
}

/* ── Estadísticas sencillas ────────────────────────────────────────────────

   *"Mostrar únicamente información sencilla… **no crear estadísticas
   complejas**."* Cuatro números y uno opcional, todos derivados. */
export function estadisticasIdeas(lista = [], mes = null) {
  const base = (Array.isArray(lista) ? lista : []).filter((i) => !i.archivada);
  const cuenta = (id) => base.filter((i) => i.estado === id).length;
  const esteMes = mes || fechaLocalISO(new Date()).slice(0, 7);
  return {
    total: base.length,
    /* ⚠️ "Activas" son las que siguen vivas: ni realizadas ni descartadas. */
    activas: base.filter((i) => i.estado !== 'completed' && i.estado !== 'discarded').length,
    desarrollando: cuenta('developing'),
    realizadas: cuenta('completed'),
    realizadasEsteMes: base.filter((i) => i.estado === 'completed' && String(i.completado || '').startsWith(esteMes)).length,
  };
}

/** La línea de arriba. `null` sin ni una idea: *"no inventar números"*. */
export function lineaIdeas(lista = []) {
  const s = estadisticasIdeas(lista);
  if (s.total === 0) return null;
  const partes = [`${s.total} ${s.total === 1 ? 'idea' : 'ideas'}`];
  if (s.desarrollando) partes.push(`${s.desarrollando} en desarrollo`);
  if (s.realizadas) partes.push(`${s.realizadas} ${s.realizadas === 1 ? 'realizada' : 'realizadas'}`);
  return partes.join(' · ');
}

/* ── La diferencia con Notas, dicha en la pantalla ─────────────────────────

   El enunciado la llama *"fundamental"* y además pide que Ideas **se
   diferencie** de las otras tres mini-apps. */
export const DIFERENCIA_IDEAS = {
  nota: 'Una nota es información que quieres conservar.',
  idea: 'Una idea es algo que se te ha ocurrido y podrías desarrollar.',
  ejemplo: '«El examen es el viernes» es una nota. «Crear una app que automatice X» es una idea.',
};

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────*/
export const NO_EN_IDEAS = [
  { que: 'Documentos y Colecciones', llega: 'BL F6 y F7' },
  { que: 'IA generativa y generación automática de ideas', llega: 'no está previsto en este bloque' },
  { que: 'Un sistema de votación', llega: 'no está previsto en este bloque' },
  { que: 'Compartir ideas públicamente y cualquier cosa de redes sociales', llega: 'no está previsto en este bloque' },
  { que: 'Estadísticas avanzadas', llega: 'BL F8' },
];
