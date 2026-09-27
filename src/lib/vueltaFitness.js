/* ─────────────────────────────────────────────────────────────────────────
   FIT F43 (apartados 46 y 47) — «VOLVER» LLEVA AL CONTEXTO LÓGICO ANTERIOR.

   *"Desde cualquier pantalla profunda: Back debe llevar al contexto lógico
   anterior. No enviar al usuario innecesariamente a: Inicio Fitness."*

   🐛 Lo que había: el progreso de un ejercicio (F12/F29) se abre desde CINCO
   sitios —el detalle muscular de Rangos, el historial, una sesión de Tu Plan,
   la ficha de la biblioteca y el propio Progreso—, y su botón decía siempre
   «Volver a Progreso» y llevaba siempre a la portada de Progreso. Desde
   Rangos → Espalda → Dorsales → Dominadas, volver dejaba a Josué en otra área,
   con el músculo cerrado. Y dentro de Progreso el botón mentía tres veces más:
   decía «Progreso» y volvía al objetivo, al músculo o al ejercicio anterior,
   que es a donde de verdad lleva el estado de la pantalla.

   Esto NO es un segundo sistema de navegación (NAVO F1 lleva la pila de la
   aplicación entera en `navegacion.js`). Es lo que falta DENTRO de Fitness, que
   abre sus subpantallas con estado de React: quien abre una pantalla de otra
   área dice **de dónde viene** (`crearOrigen`), y la pantalla que se abre
   pregunta **a dónde vuelve** (`vueltaDelDetalle`, `vueltaDeSesion`). Es estado
   de pantalla, nunca un dato: no se guarda en `app_data` (EH F40) — volver a
   Fitness mañana no te deja a media ruta de hoy.
   ───────────────────────────────────────────────────────────────────────── */

/** Las áreas a las que se puede volver (las tres de `AREAS_FITNESS`). */
export const AREAS_DE_VUELTA = ['rangos', 'progreso', 'entrenamiento'];

/** Qué pantalla de Progreso se abrió desde fuera: el progreso de un ejercicio,
    un objetivo o el formulario de uno nuevo. */
export const TIPOS_DE_ORIGEN = ['ejercicio', 'objetivo', 'formulario'];

export const VUELTA_POR_DEFECTO = Object.freeze({ texto: 'Progreso', etiqueta: 'Volver a Progreso' });

const textoValido = (t) => typeof t === 'string' && t.trim().length > 0;

/**
 * De dónde viene una pantalla que se abre en Progreso. `inicio` es lo que el
 * área de origen necesita para volver a pintarse como estaba —el músculo y el
 * subgrupo abiertos, la sesión del historial, la ficha de la biblioteca—, y
 * `texto` lo que dirá el botón. Sin área, tipo o texto válidos devuelve `null`:
 * un origen a medias sería un botón que no sabe a dónde lleva.
 */
export function crearOrigen({ area, inicio = null, texto, etiqueta = null, tipo, id } = {}) {
  if (!AREAS_DE_VUELTA.includes(area)) return null;
  if (!TIPOS_DE_ORIGEN.includes(tipo)) return null;
  if (!textoValido(texto)) return null;
  if (id === null || id === undefined || id === '') return null;
  return {
    area,
    inicio: inicio && typeof inicio === 'object' ? { ...inicio } : null,
    texto: texto.trim(),
    etiqueta: textoValido(etiqueta) ? etiqueta.trim() : `Volver a ${texto.trim()}`,
    tipo,
    id,
  };
}

/**
 * Si el origen sigue siendo el de la pantalla que se está viendo. Se pierde en
 * cuanto Josué sale de ella por otro camino —abre otro ejercicio desde la lista,
 * cambia de sección—: si no, abrir el mismo ejercicio mañana desde Progreso
 * volvería a Rangos.
 */
export function origenVigente(origen, { abierto = null, previos = [], objetivoAbierto = null, formulario = null } = {}) {
  if (!origen) return false;
  if (origen.tipo === 'ejercicio') return !!abierto && (abierto === origen.id || (previos || []).length > 0);
  if (origen.tipo === 'objetivo') return !abierto && objetivoAbierto === origen.id;
  if (origen.tipo === 'formulario') return !abierto && !!formulario && formulario.exerciseId === origen.id;
  return false;
}

/**
 * A dónde vuelve el progreso de un ejercicio, en el orden en que la pantalla se
 * pinta al cerrarlo:
 *   1. al ejercicio anterior, si se llegó por una variante o desde una sesión;
 *   2. al origen de fuera de Progreso (Rangos, el historial, la ficha…);
 *   3. al objetivo que lo abrió («Ver progreso del ejercicio», F30);
 *   4. al músculo de la sección Músculos (F13);
 *   5. a la portada de Progreso.
 * Devuelve la acción y lo que dice el botón: el texto nunca promete un sitio
 * distinto del que abre.
 */
export function vueltaDelDetalle({
  previos = [], origen = null, vigente = false, objetivoAbierto = null,
  musculo = null, nombreAnterior = null, nombreMusculo = null,
} = {}) {
  const pila = previos || [];
  if (pila.length > 0) {
    const id = pila[pila.length - 1];
    const texto = textoValido(nombreAnterior) ? nombreAnterior : 'Ejercicio anterior';
    return { accion: 'anterior', id, texto, etiqueta: `Volver a ${texto}` };
  }
  if (origen && vigente) {
    return { accion: 'origen', origen, texto: origen.texto, etiqueta: origen.etiqueta };
  }
  if (objetivoAbierto) return { accion: 'cerrar', texto: 'Objetivo', etiqueta: 'Volver al objetivo' };
  if (musculo) {
    const texto = textoValido(nombreMusculo) ? nombreMusculo : 'Músculos';
    return { accion: 'cerrar', texto, etiqueta: `Volver a ${texto}` };
  }
  return { accion: 'cerrar', ...VUELTA_POR_DEFECTO };
}

/**
 * Y lo que dice el botón de una sesión abierta dentro de Progreso: vuelve a la
 * pantalla que estaba debajo, que casi nunca es la portada.
 */
export function vueltaDeSesion({ nombreEjercicio = null, objetivoAbierto = null } = {}) {
  if (textoValido(nombreEjercicio)) return { texto: nombreEjercicio, etiqueta: `Volver al progreso de ${nombreEjercicio}` };
  if (objetivoAbierto) return { texto: 'Objetivo', etiqueta: 'Volver al objetivo' };
  return { ...VUELTA_POR_DEFECTO };
}

/** Lo que resuelve cada apartado, para la auditoría de la fase. */
export const QUE_RESUELVE = Object.freeze([
  { apartado: 46, que: 'Rangos → músculo → subgrupo → ejercicio → progreso → sesión → volver, y cada volver deshace un paso' },
  { apartado: 47, que: 'El progreso de un ejercicio vuelve a Rangos, al historial, a Tu Plan o a la ficha de donde se abrió, no a la portada de Progreso' },
  { apartado: 47, que: 'Dentro de Progreso, el botón dice a dónde vuelve: el ejercicio anterior, el objetivo o el músculo' },
]);
