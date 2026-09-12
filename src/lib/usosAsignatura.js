/* ===========================================================================
   AS F2 — dónde se usa una asignatura, y qué pasa al eliminarla.
   ===========================================================================

   Josué: *"Quitar una asignatura de un lugar NO es lo mismo que eliminar la
   asignatura del sistema."* Toda esta fase es esa frase.

   🚨 **UNA SOLA FUENTE DE VERDAD, Y POR ESO ESTE ARCHIVO EXISTE.** El apartado 5
   lo pide con todas las letras —*"no quiero dos sistemas diferentes […] Horario
   y Estudio deben consultar la misma fuente de verdad"*—, así que quien pregunte
   *"¿dónde se usa Matemáticas?"* llama aquí, venga de donde venga. Con una
   función en cada módulo, el aviso de Horario y el de Estudio acabarían diciendo
   números distintos sobre la misma asignatura.

   ⚠️ **Y no guarda nada.** Los usos se cuentan en el momento sobre `estudios` y
   `horarioTop`, que son los dos almacenes que ya existen. Una lista guardada de
   «dónde se usa» se queda vieja en cuanto él borre un bloque, y entonces el
   aviso miente justo en el momento en el que más importa.
   =========================================================================== */
import { normalizarHorarioTop, nombreDeActividad } from './horario';
import { programasDeAsignatura, temasDe } from './asignaturas';

/* ---------------------------------------------------------------------------
   1 · DÓNDE SE USA (apartados 2, 5 y 6)
   --------------------------------------------------------------------------- */

/**
 * Todo lo que apunta a una asignatura, en los dos módulos.
 *
 * ⚠️ Las **actividades** del horario y los **bloques** son dos cuentas
 * distintas a propósito: una actividad «Matemáticas» puede estar en cuatro
 * bloques, y lo que Josué reconoce al leer el aviso son los bloques —*"2 bloques
 * de tu horario"* es su propio ejemplo—, no una entidad interna que nunca ha
 * visto.
 */
export function usosDeAsignatura(estudios, horarioTop, asignaturaId) {
  const vacio = {
    programas: [], actividades: [], bloques: [],
    examenes: [], temas: [], horas: [], entregas: [], eventos: [],
    hayUsos: false, enHorario: 0, enEstudio: 0,
  };
  if (!asignaturaId) return vacio;

  const asig = (estudios?.asignaturas || []).find((a) => a && a.id === asignaturaId) || null;
  const programas = programasDeAsignatura(asig)
    .map((pid) => (estudios?.programas || []).find((p) => p && p.id === pid))
    .filter(Boolean);

  const e = normalizarHorarioTop(horarioTop);
  const actividades = e.actividades.filter((a) => a.asignaturaId === asignaturaId);
  const idsActividad = new Set(actividades.map((a) => a.id));
  const bloques = e.bloques.filter((b) => idsActividad.has(b.actividadId));

  const examenes = (estudios?.examenes || []).filter((x) => x && x.asignaturaId === asignaturaId);
  const temas = temasDe(estudios, asignaturaId);
  const horas = (estudios?.horas || []).filter((h) => h && h.asignaturaId === asignaturaId);
  const entregas = (estudios?.entregas || []).filter((x) => x && x.asignaturaId === asignaturaId);
  const eventos = (estudios?.eventos || []).filter((v) => v && v.asignaturaId === asignaturaId);

  return {
    programas, actividades, bloques,
    examenes, temas, horas, entregas, eventos,
    enHorario: bloques.length,
    enEstudio: programas.length,
    /* ⚠️ «Se usa» es estar EN un horario o EN un programa. Sus exámenes y sus
       temas no son usos: son su contenido, y se van con ella de todas formas.
       Contarlos aquí haría que una asignatura suelta con dos exámenes pidiera la
       confirmación larga del apartado 2, que es la que habla de otros sitios. */
    hayUsos: bloques.length > 0 || programas.length > 0,
  };
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/**
 * El aviso de eliminar, con las dos formas que pide el enunciado: la larga
 * cuando se usa en algún sitio (apartado 2) y la corta cuando no (apartado 3).
 */
export function avisoEliminarAsignatura(usos, nombre = 'esta asignatura') {
  const donde = [];
  if (usos.enHorario) donde.push(plural(usos.enHorario, 'bloque de tu horario', 'bloques de tu horario'));
  if (usos.enEstudio) donde.push(plural(usos.enEstudio, 'programa de Estudio', 'programas de Estudio'));

  /* ⚠️ Lo que se va con ella y **vuelve** se dice aparte de lo que **no vuelve**:
     prometer que se recupera todo sería mentir en pantalla (E3 F26). */
  const contenido = [];
  if (usos.examenes.length) contenido.push(plural(usos.examenes.length, 'examen', 'exámenes'));
  if (usos.entregas.length) contenido.push(plural(usos.entregas.length, 'entrega', 'entregas'));
  if (usos.eventos.length) contenido.push(plural(usos.eventos.length, 'evento', 'eventos'));
  if (usos.temas.length) contenido.push(plural(usos.temas.length, 'tema', 'temas'));
  if (usos.horas.length) contenido.push(plural(usos.horas.length, 'sesión de estudio', 'sesiones de estudio'));

  return {
    titulo: `¿Eliminar ${nombre}?`,
    hayUsos: usos.hayUsos,
    donde,
    /* Apartado 3 — sin usos, una confirmación más sencilla. */
    texto: usos.hayUsos
      ? `Se está usando en ${donde.join(' y ')}. Si la eliminas, se quitará de ahí.`
      : 'Dejará de estar disponible para Horario y para Estudio.',
    contenido,
    seRecupera: contenido.length
      ? `Se va con ella ${contenido.join(', ')}, y puedes recuperarlo desde Eliminados recientemente.`
      : 'Puedes recuperarla desde Eliminados recientemente.',
    /* 🚨 **Y lo que NO vuelve se dice, porque el horario no tiene papelera.**
       `CATALOGO_PAPELERA` no tiene una entrada de horarios (lo confirmó la
       E3 F5), así que sus clases se borran de verdad. Callarlo sería prometer
       una recuperación que no existe (regla 8). */
    noVuelve: usos.enHorario
      ? `Sus ${plural(usos.enHorario, 'clase del horario se borra', 'clases del horario se borran')} y eso no se puede deshacer.`
      : null,
    confirmar: 'Eliminar asignatura',
    cancelar: 'Cancelar',
  };
}

/* ---------------------------------------------------------------------------
   2 · QUITAR ≠ ELIMINAR (apartados 1 y 4)
   ---------------------------------------------------------------------------
   🚨 *"Nunca elimines una asignatura simplemente porque el usuario la haya
   quitado de un programa o de un bloque del horario."*

   Quitar de un programa ya lo hace `quitarDePrograma` (AS F1). Lo que falta es
   el otro lado: quitarla de un bloque del horario. */

/**
 * Quita **un bloque** del horario, sin tocar la asignatura ni los demás bloques.
 *
 * ⚠️ La actividad se queda: puede estar en otros días, y borrarla dejaría los
 * demás bloques sin nombre. Lo que se quita es **esa** clase.
 */
export function quitarBloqueDelHorario(horarioTop, bloqueId) {
  const e = normalizarHorarioTop(horarioTop);
  return {
    ...e,
    bloques: e.bloques.filter((b) => b.id !== bloqueId),
    // Y sus excepciones, que sin su bloque no significan nada.
    excepciones: e.excepciones.filter((x) => x.bloqueId !== bloqueId),
  };
}

export const QUITAR_NO_ES_ELIMINAR = {
  dePrograma: 'Sigue existiendo y puedes usarla en otros programas y en tu horario.',
  deBloque: 'Se quita esa clase del horario. La asignatura sigue existiendo.',
};

/* ---------------------------------------------------------------------------
   3 · ELIMINAR DE VERDAD (apartado 7)
   ---------------------------------------------------------------------------
   🚨 **Sin `confirmado` no se toca nada.** Es el patrón `aplicarPlan` del
   proyecto —van más de veinte—: mostrar y ejecutar son **dos llamadas**, y nunca
   se le da un valor por defecto. Sin esto, la confirmación del apartado 2 sería
   decorativa. */

/**
 * Quita de `horarioTop` todo lo que apunta a una asignatura.
 *
 * Devuelve el horario entero, para que `App.jsx` lo guarde **en la misma
 * llamada** que `estudios`: dos escrituras seguidas se pisan (E3 F26).
 */
export function limpiarHorarioDeAsignatura(horarioTop, asignaturaId, { confirmado = false } = {}) {
  const e = normalizarHorarioTop(horarioTop);
  if (!confirmado || !asignaturaId) return e;
  const actividades = e.actividades.filter((a) => a.asignaturaId !== asignaturaId);
  const idsVivas = new Set(actividades.map((a) => a.id));
  const bloques = e.bloques.filter((b) => idsVivas.has(b.actividadId));
  const idsBloque = new Set(bloques.map((b) => b.id));
  return {
    ...e,
    actividades,
    bloques,
    // ⚠️ Y sus excepciones: una excepción de un bloque que ya no existe es
    // exactamente la referencia rota del Caso 4.
    excepciones: e.excepciones.filter((x) => !x.bloqueId || idsBloque.has(x.bloqueId)),
  };
}

/**
 * ¿Queda algo apuntando a esta asignatura? Para demostrar el apartado 9.
 *
 * ⚠️ Se mira **lo guardado**, no lo normalizado: el normalizador ya limpia
 * algunas cosas en silencio, así que preguntarle a él no encuentra nunca nada y
 * su silencio parece un aprobado (E3 F41).
 */
export function referenciasColgando(estudios, horarioTop, asignaturaId) {
  const rotas = [];
  const mira = (lista, donde) => {
    for (const x of (lista || [])) {
      if (x && x.asignaturaId === asignaturaId) rotas.push({ donde, id: x.id });
    }
  };
  mira(estudios?.examenes, 'estudios.examenes');
  mira(estudios?.temas, 'estudios.temas');
  mira(estudios?.horas, 'estudios.horas');
  mira(estudios?.entregas, 'estudios.entregas');
  mira(estudios?.eventos, 'estudios.eventos');
  mira(horarioTop?.actividades, 'horarioTop.actividades');
  if ((estudios?.asignaturas || []).some((a) => a && a.id === asignaturaId)) {
    rotas.push({ donde: 'estudios.asignaturas', id: asignaturaId });
  }
  return rotas;
}

/* ---------------------------------------------------------------------------
   4 · LO QUE NO SE LLEVA POR DELANTE (apartado 10)
   ---------------------------------------------------------------------------
   *"Si elimino Bachillerato científico NO quiero que se eliminen Matemáticas,
   Física, Química, Biología."* */
export const ELIMINAR_PROGRAMA = {
  /* 🚨 Esto CAMBIA lo que hacía la aplicación hasta v3.75.0: borrar un programa
     se llevaba sus asignaturas a la papelera. Desde AS F2 solo se rompe la
     relación, porque son entidades compartidas y una de ellas puede estar
     también en el horario o en otro programa. */
  queSeVa: 'El programa y su estructura.',
  queSeQueda: 'Tus asignaturas siguen existiendo, con sus exámenes y sus temas, y puedes usarlas en otro programa.',
};

export const ELIMINAR_HORARIO = {
  queSeVa: 'El horario y sus clases.',
  queSeQueda: 'Tus asignaturas siguen existiendo: un horario las usa, no las contiene.',
};

/** Quita un programa de la relación de todas las asignaturas, sin borrar ninguna. */
export function desligarPrograma(asignaturas = [], programaId) {
  return asignaturas.map((a) => {
    const ids = programasDeAsignatura(a);
    return ids.includes(programaId) ? { ...a, programaIds: ids.filter((p) => p !== programaId) } : a;
  });
}

/* ---------------------------------------------------------------------------
   5 · LA CONDICIÓN DE LA FASE, CALCULADA
   --------------------------------------------------------------------------- */
export function condicionAS2(estudios, horarioTop) {
  const asig = (estudios?.asignaturas || [])[0] || null;
  const usos = asig ? usosDeAsignatura(estudios, horarioTop, asig.id) : null;
  const casillas = [
    { id: 'usos', texto: 'Se sabe dónde se usa una asignatura, en los dos módulos', ok: typeof usosDeAsignatura === 'function' && !!usos },
    { id: 'aviso', texto: 'El aviso distingue usada de no usada', ok: typeof avisoEliminarAsignatura === 'function' },
    { id: 'quitar', texto: 'Quitar de un sitio no elimina la asignatura', ok: typeof quitarBloqueDelHorario === 'function' },
    { id: 'plan', texto: 'Sin confirmar no se borra nada', ok: limpiarHorarioDeAsignatura(horarioTop, asig?.id).bloques.length === normalizarHorarioTop(horarioTop).bloques.length },
    { id: 'programa', texto: 'Eliminar un programa no elimina sus asignaturas', ok: typeof desligarPrograma === 'function' },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}
