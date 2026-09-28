/* ─────────────────────────────────────────────────────────────────────────
   FIT F44 (apartado 39) — LOS NÚMEROS DE FITNESS, ESCRITOS DE UNA MANERA.

   *"Centralizar utilidades de: peso, repeticiones, duración, porcentajes,
   score. Evitar inconsistencias de redondeo."*

   🧹 Había OCHO copias de «número con coma decimal» —en el historial, la
   progresión, el progreso de un ejercicio, los objetivos, la actividad, el
   entrenamiento en vivo, la gráfica de Progreso y la ficha de un ejercicio—, y
   no redondeaban igual: cuatro dejaban dos decimales y las otras escribían el
   número tal cual, así que un peso de 33,333… habría salido «33,33» en una
   pantalla y «33,333333333333336» en otra. Ahora hay una.

   ⚠️ Es una HOJA del árbol de imports, como `fechasFitness.js` (F42): no
   importa nada, así que la puede usar cualquier librería o pantalla de Fitness
   sin crear un ciclo. Y no formatea el volumen: «1.240 kg» lleva separador de
   miles (`toLocaleString('es-ES')`, F8), que es otro papel.
   ───────────────────────────────────────────────────────────────────────── */

/** Máximo de decimales que se enseñan: 62,5 kg, 1,25 kg, nunca 33,333 kg. */
export const DECIMALES_FITNESS = 2;

/**
 * «62,5» y no «62.5»: redondeado a dos decimales como mucho, sin ceros de
 * relleno («60», no «60,00») y con la coma del español. Lo que no es un número
 * no se escribe: `''`, nunca «NaN» (F39).
 */
export function decimal(n, { max = DECIMALES_FITNESS } = {}) {
  const x = typeof n === 'number' ? n : Number(n);
  if (n === null || n === undefined || n === '' || !Number.isFinite(x)) return '';
  const f = 10 ** max;
  return String(Math.round(x * f) / f).replace('.', ',');
}
