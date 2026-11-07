/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 6/8 — LAS ANOTACIONES POR EJERCICIO (prompt 6, ARQUITECTURA §12)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 Una anotación pertenece a UNA ejecución de un ejercicio, no a la plantilla.
   Vive donde ya vivía desde la FIT F7: `sesion.origen.ejercicios[].notas`, dentro
   de la fotografía de la sesión. Por eso ya está vinculada, sin un campo nuevo, a:
   - la sesión (`sesion.id`) y su fecha real (`sesion.fecha`);
   - la plantilla de origen (`plantillaDeSesion`: `diaDePlan.plantillaId` o, para
     lo de antes, la regla del §14.6);
   - la línea estable (`linea.id`, que la sesión guarda desde la Fase 5);
   - el ejercicio (`exerciseId`);
   - su texto (`notas`).
   Y por eso **no depende de que la plantilla siga existiendo**: borrar o editar la
   plantilla no toca las sesiones.

   Los tres niveles, sin mezclarse (prompt 6 §8):
   - `sesion.notas` — la nota general del entrenamiento (al finalizar).
   - `ejercicio.notas` (`notaDeEjercicio`) — la anotación de esa ejecución. Es el
     sistema principal de anotaciones históricas.
   - `linea.notas` de la plantilla — una indicación permanente. Al empezar viaja en
     la foto como `linea.indicacion` (lo que decía el plan, como las repeticiones)
     y se enseña aparte, con su nombre; **nunca** se escribe en `ejercicio.notas` ni
     se lee como una anotación.

   Esta librería solo LEE: la nota anterior y las antiguas se derivan de las
   sesiones (no hay una lista de notas que mantener, ni que pueda quedarse vieja).
   La correspondencia es la de la progresión (`ejerciciosDeLineaEnSesiones`): la
   misma plantilla, la misma línea y el mismo ejercicio; sin `linea.id`, solo si es
   inequívoco. Lo que no se puede asociar con seguridad no se asocia: sigue en su
   sesión y en el historial, pero no sale como «nota anterior» de nadie.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ejerciciosDeLineaEnSesiones, plantillaDeSesion } from './progresion';
import { ejerciciosDeSesion } from './entrenamiento';
import { diaYMes } from './fechasFitness';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

export const TEXTOS_ANOTACIONES = Object.freeze({
  anterior: 'Nota anterior',
  verAnteriores: 'Ver notas anteriores de este ejercicio',
  ocultarAnteriores: 'Ocultar las notas anteriores',
  tituloAnteriores: 'Notas anteriores',
  indicacion: 'Indicación de la plantilla',
  nueva: 'Nota de hoy',
  vacia: 'Escribe cómo ha ido: técnica, sensaciones…',
});

/** ¿Es el único ejercicio de la sesión con ese `exerciseId` (entre los que salen
 *  de una línea)? Lo necesita la compatibilidad con las sesiones sin `linea.id`. */
export function esUnicoEnSesion(sesion, ej) {
  if (!ej) return false;
  return ejerciciosDeSesion(sesion).filter((e) => e && e.linea && texto(e.exerciseId) === texto(ej.exerciseId)).length === 1;
}

const momento = (s) => s?.terminadaEn || s?.iniciadaEn || s?.guardadaEn || 0;

/**
 * 🚨 Las anotaciones anteriores de ESTA línea, de la más reciente a la más antigua
 * (prompt 6 §6). Solo las que tienen texto: una ejecución sin nota no genera una
 * anotación artificial. `hasta` (una sesión) deja solo lo que pasó antes de ella:
 * así el historial de una fecha no enseña notas del futuro.
 */
export function notasDeLinea(fitness, sesion, ej, { hasta = null } = {}) {
  if (!sesion || !ej || !texto(ej.linea && ej.linea.id)) return [];
  const plantillaId = plantillaDeSesion(sesion, fitness);
  const nombreDeHoy = texto(sesion.nombre);
  return ejerciciosDeLineaEnSesiones(fitness, {
    plantillaId, ej, unica: esUnicoEnSesion(sesion, ej), antesDe: sesion.id, sinCompletar: false,
    hasta: hasta ? { fecha: hasta.fecha || '', momento: momento(hasta) } : null,
  })
    .filter((x) => texto(x.ejercicio.notas))
    .map((x) => ({
      sesionId: x.sesion.id,
      ejercicioId: x.ejercicio.id,
      fecha: x.fecha || '',
      fechaTexto: x.fecha ? diaYMes(x.fecha) : '',
      /* El nombre de aquel entrenamiento solo si era otro (renombrado): es lo
         que distingue la ejecución cuando hace falta (prompt 6 §6). */
      entrenamiento: texto(x.sesion.nombre) && texto(x.sesion.nombre) !== nombreDeHoy ? texto(x.sesion.nombre) : '',
      texto: texto(x.ejercicio.notas),
    }));
}

/** La última anotación de esa línea, o `null` (y entonces no se pinta nada). */
export function notaAnterior(fitness, sesion, ej, opciones = {}) {
  return notasDeLinea(fitness, sesion, ej, opciones)[0] || null;
}

/** La indicación permanente de la plantilla que viajó en la foto, o ''. */
export const indicacionDeLinea = (ej) => texto(ej && ej.linea && ej.linea.indicacion);

/** Todo lo que el entrenamiento en directo necesita de un ejercicio. */
export function anotacionesDeEjercicio(fitness, sesion, ej) {
  const anteriores = notasDeLinea(fitness, sesion, ej);
  return { anterior: anteriores[0] || null, anteriores, indicacion: indicacionDeLinea(ej) };
}

export const DECISIONES_FASE6 = Object.freeze([
  Object.freeze({ id: 'AN-01', que: 'La anotación es `ejercicio.notas` de la foto de la sesión (ya existía): no hay modelo nuevo ni migración de datos.' }),
  Object.freeze({ id: 'AN-02', que: 'La «nota anterior» es la última ejecución de esa línea CON nota (una ejecución sin nota no tapa la anterior), con su fecha a la vista.' }),
  Object.freeze({ id: 'AN-03', que: 'La nota de la plantilla viaja como `linea.indicacion` y se enseña aparte; nunca se copia a `ejercicio.notas`.' }),
  Object.freeze({ id: 'AN-04', que: 'Sesiones sin `linea.id`: solo si es inequívoco (la regla de la progresión); si no, la nota se queda en su sesión sin asignarse a otra línea.' }),
]);
