/* ===========================================================================
   ENTREGA 3 · FASE 5 — HORARIO: UX, NAVEGACIÓN Y GESTIÓN DE HORARIOS
   ===========================================================================

   *"El apartado Horario actual está muy bien resuelto visual y funcionalmente.
   No quiero rehacerlo ni cambiar su concepto general."*

   Josué nombra **tres problemas** y esta capa contesta a los tres:

     1. *"Los horarios no se pueden eliminar completamente; actualmente parece
        que solo pueden archivarse."*
     2. *"No existe suficiente diferenciación entre mis horarios y las vistas de
        planificación como Hoy, Semana, Día y Agenda."*
     3. *"La navegación inicial puede resultar confusa."*

   🐛 **Y el primero era el mismo fallo que el de Economía:** `eliminarHorario`
   **existe desde HT F2** en `horario.js`, con su borrado en cascada de bloques y
   excepciones… y **ninguna pantalla la llamaba**. La única acción destructiva
   que ofrecía la interfaz era *Archivar*, así que un horario de un curso pasado
   se quedaba dentro para siempre. La función estaba escrita, probada y muerta.

   ⚠️ **Aquí no se recalcula nada del horario.** `eliminarHorario`,
   `archivarHorario`, `duplicarHorario`, `horariosActivos` y `horariosArchivados`
   son de HT F2 y HT F4: esta capa **decide qué hay que llamar y qué se le
   enseña antes**, igual que `gestionModulos.js` con `estiloDeHombre.js`.
   =========================================================================== */

import { normalizarHorarioTop, eliminarHorario } from './horario';
import { horariosActivos, horariosArchivados } from './horarioEstructura';

/* ── Los dos conceptos que Josué quiere separar (apartados 1, 2 y 6) ───────

   *"Esto evita que el usuario confunda «Semana» con «Horario semanal». Son
   conceptos relacionados pero diferentes."*

   Se declaran aquí, con su explicación en una frase, para que la pantalla no
   tenga que inventarse los rótulos y para que **las dos secciones existan de
   verdad** en vez de ser un `<p>` suelto que alguien borre sin darse cuenta. */
export const SECCIONES_HORARIO = [
  {
    id: 'planificacion',
    titulo: 'Planificación',
    explica: 'Lo que hay en tus días: tus clases y el resto de la aplicación.',
  },
  {
    id: 'mis_horarios',
    titulo: 'Mis horarios',
    explica: 'Las estructuras que organizan esa planificación.',
  },
];

export const seccionHorario = (id) => SECCIONES_HORARIO.find((s) => s.id === id) || SECCIONES_HORARIO[0];

/* ── Las acciones de un horario (apartados 3 y 8) ──────────────────────────

   *"Cada horario debe tener acciones claramente diferenciadas: Activar,
   Archivar, Eliminar."* Y el apartado 8 reparte: cambiar de horario activo es
   principal; editar, duplicar, archivar y eliminar son secundarias.

   ⚠️ **`destructiva` decide quién pide confirmación.** Solo eliminar la lleva:
   un aviso delante de cada toque enseña a no leer los avisos (EH F61). */
export const ACCIONES_HORARIO = [
  { id: 'activar', label: 'Activar', explica: 'Pasa a ser el horario que se usa.', principal: true, destructiva: false },
  { id: 'editar', label: 'Editar', explica: 'Cambiar sus clases, franjas y estructura.', principal: false, destructiva: false },
  { id: 'duplicar', label: 'Duplicar', explica: 'Una copia para otro curso, sin tocar éste.', principal: false, destructiva: false },
  { id: 'archivar', label: 'Archivar', explica: 'Lo conserva, pero deja de estar activo.', principal: false, destructiva: false },
  { id: 'eliminar', label: 'Eliminar', explica: 'Lo borra para siempre, con sus clases.', principal: false, destructiva: true },
];

export const accionHorario = (id) => ACCIONES_HORARIO.find((a) => a.id === id) || null;

/** Las acciones que se ofrecen sobre un horario concreto. Un archivado no se
 *  archiva otra vez: se restaura. */
export function accionesDe(estado, horarioId) {
  const e = normalizarHorarioTop(estado);
  const h = e.horarios.find((x) => x.id === horarioId);
  if (!h) return [];
  return ACCIONES_HORARIO.filter((a) => {
    if (a.id === 'activar') return !h.activo || h.archivado;
    if (a.id === 'archivar') return !h.archivado;
    return true;
  });
}

/* ── Qué se lleva por delante eliminar (apartado 3) ────────────────────────

   *"Para evitar eliminaciones accidentales: pulsar Eliminar, mostrar
   confirmación, explicar que la acción es permanente."*

   ⚠️ **Nada se mueve en silencio** (HT F4, apartado 30): toda operación de
   estructura enseña su impacto ANTES de escribir. Esto cuenta lo que hay de
   verdad —no una frase genérica— para que la confirmación diga la verdad.

   🚨 **Y no promete recuperarlo**, porque un horario **no va a la papelera**:
   `CATALOGO_PAPELERA` no tiene una entrada de horarios, así que prometerlo
   sería mentir (la lección de EH F41). */
export function impactoEliminarHorario(estado, horarioId) {
  const e = normalizarHorarioTop(estado);
  const h = e.horarios.find((x) => x.id === horarioId);
  if (!h) return null;
  const bloques = e.bloques.filter((b) => b.horarioId === horarioId);
  const excepciones = e.excepciones.filter((x) => x.horarioId === horarioId);
  return {
    nombre: h.nombre,
    bloques: bloques.length,
    excepciones: excepciones.length,
    // Las actividades NO se borran: son de Estudios y las usan otros horarios.
    conservaActividades: true,
    permanente: true,
    quedan: e.horarios.length - 1,
    texto: `Se borrará «${h.nombre}» y ${bloques.length === 1 ? 'su clase' : `sus ${bloques.length} clases`}`
      + `${excepciones.length > 0 ? `, y ${excepciones.length === 1 ? 'su excepción' : `sus ${excepciones.length} excepciones`}` : ''}.`,
    aviso: 'Esta acción es permanente: un horario borrado no se puede recuperar.',
    seConserva: 'Tus asignaturas y actividades no se tocan: las usan también los demás horarios.',
  };
}

/* 🚨 **`eliminarDeVerdad` sin `confirmado` no borra nada.** Es el patrón
   `aplicarPlan` del proyecto (HT F9, y ya van veinte): mostrar y ejecutar son
   dos llamadas, y **nunca se le da un valor por defecto**. Sin esto, la
   confirmación del apartado 3 sería decorativa. */
export function eliminarDeVerdad(estado, horarioId, { confirmado = false } = {}) {
  if (!confirmado) return normalizarHorarioTop(estado);
  return eliminarHorario(estado, horarioId);
}

/* ── La pantalla de Mis horarios (apartados 2, 4 y 7) ──────────────────────

   *"Los horarios archivados pueden mantenerse accesibles en una sección
   secundaria: Mis horarios → Archivados. Esto permite conservarlos sin
   mezclarlos con los horarios activos."* */
export function misHorarios(estado, horarioActivoId = null) {
  const e = normalizarHorarioTop(estado);
  const activos = horariosActivos(e);
  const archivados = horariosArchivados(e);
  return {
    activos: activos.map((h) => ({ ...h, enUso: h.id === horarioActivoId })),
    archivados,
    // Apartado 7 — *"si no existe: mostrar un estado vacío extremadamente
    // sencillo"*. Y ⚠️ vacío NO es lo mismo que "todos archivados": ahí sí hay
    // horarios, solo que ninguno en uso, y esconderlos sería un callejón.
    vacio: activos.length === 0 && archivados.length === 0,
    soloArchivados: activos.length === 0 && archivados.length > 0,
  };
}

/* Los textos del estado vacío, con las palabras del apartado 7. */
export const VACIO_HORARIOS = {
  titulo: 'Aún no tienes ningún horario',
  explica: 'Crea tu horario para organizar automáticamente tu semana.',
  boton: 'Crear mi primer horario',
};
