/* ═══════════════════════════════════════════════════════════════════════════
   QUÉ ENTRENAMIENTOS CUENTAN — la regla del historial, como hoja del árbol
   ═══════════════════════════════════════════════════════════════════════════

   🔓 Fase 1B (CX-09 y CX-12). La regla nació en `historial.js` (FIT F10): un
   entrenamiento cuenta si está **completado** —ni en curso, ni «finalizando»
   sin guardar, ni descartado—. Las tarjetas de fuera de Fitness (Inicio, el hub
   de Bienestar, la puntuación del día, Estadísticas y Predicciones) necesitaban
   leerla, y `historial.js` arrastra medio Fitness —y por él, el Calendario, que
   importa `predicciones.js`—: importarlo desde Predicciones sería un **ciclo**.

   Así que la regla **se muda aquí** (FIT F22: *"antes de escribir una regla que
   ya se aplica en otro sitio, sacarla de donde está"*) y `historial.js` la
   reexporta con `export { }` (EH F17), como `fechasFitness.js` y
   `numerosFitness.js`. Solo importa `helpers.js`.

   ⚠️ Una sesión vive en `fitness.sesiones` y su `fecha` es la **local** del día
   en que empezó (`todayISO()`, F7): comparar cadenas ISO ya es comparar días. */

import { fechaValida } from './helpers';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/** 🚨 Solo las completadas. Y una parcial SÍ entra (F10, apartado 4): lo que
 *  decide es que él la guardó, no cuántas series hizo. */
export const ESTADO_DEL_HISTORIAL = 'completada';

export function sesionesDelHistorial(fitness) {
  return lista((fitness || {}).sesiones).filter((s) => s && s.id && s.estado === ESTADO_DEL_HISTORIAL);
}

/** Los días (fecha local) con al menos un entrenamiento completado. Es un
 *  conjunto de **días**, no de sesiones: dos entrenamientos el mismo día —o la
 *  misma sesión guardada dos veces— son **un** día. Una sesión sin fecha válida
 *  no cae en ninguno (F31, apartado 24).
 *
 *  🔓 Fase 1C — **una sesión es su `id`**, y si aparece dos veces cuenta una,
 *  **en la fecha de su última copia**: es la regla de `sinDuplicadosPorId`
 *  (`fitness.js`), la que aplica la puerta de carga (F31, apartado 24). Aquí se
 *  repite en tres líneas porque esta hoja no puede importar `fitness.js` (que
 *  arrastra las rachas): la suite de la Fase 1C comprueba que las dos digan lo
 *  mismo. ⚠️ El contrato del `id` es el de esa puerta —`normalizarWorkoutSession`
 *  descarta solo el que falta o es falso—: un `id` numérico de una importación
 *  vale; no se le exige el formato de `uid()`. */
export function fechasConEntrenamiento(fitness) {
  const porId = new Map();
  for (const s of sesionesDelHistorial(fitness)) porId.set(s.id, s);
  const dias = new Set();
  for (const s of porId.values()) {
    const f = texto(s.fecha);
    if (fechaValida(f)) dias.add(f);
  }
  return dias;
}
