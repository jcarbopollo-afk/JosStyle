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

/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 5/8 — LAS REPETICIONES: ENTERAS O DE MEDIA EN MEDIA
   (prompt 5 §8, ARQUITECTURA_TECNICA.md §11.4)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 Una sola regla para toda Fitness: unas repeticiones valen si son un número
   finito, ≥ 0 y **múltiplo de 0,5** (6 · 6,5 · 7). 6,2 o 7,8 no valen, y **no
   se redondean**: se rechazan con una frase que dice qué escribir.

   Dónde se aplica (prompt 5 §8):
   - **Al escribir** (plantilla, entrenamiento en directo, edición de series):
     `leerRepeticiones` devuelve el valor o el motivo; nunca lo corrige.
   - **Al guardar desde el motor** (`editarSerie`, `crearLinea`): un valor que
     no vale no se escribe (el de antes se queda).
   - **Al cargar lo guardado** (normalizadores): `repeticionesGuardadas`
     conserva el número TAL CUAL. Antes se redondeaba (`Math.round`), así que
     todo lo guardado hasta ahora es entero y sigue valiendo: no hay que migrar
     nada. Un valor raro que llegara de fuera (una importación, otro
     dispositivo) no se toca ni se tira: se conserva, la progresión lo ignora
     como dato y la validación de la plantilla lo dice.
   - **Al enseñar**: `textoReps` con coma («8,5»).

   ⚠️ Vive aquí, en `numerosFitness.js`, porque es una hoja del árbol de
   imports: la pueden importar el modelo, el motor y las pantallas sin ciclos.
   ═══════════════════════════════════════════════════════════════════════════ */


/** ¿Valen estas repeticiones? Entero o x,5, finito y no negativo. */
export function repeticionValida(v) {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return false;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 && Number.isInteger(n * 2);
}

/** Para los normalizadores de carga: el número tal cual, sin redondear. */
export function repeticionesGuardadas(v) {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Para el motor: el valor si vale, `null` si está vacío y `undefined` si NO
 *  vale (quien llama deja el de antes). */
export function repeticionesAlEscribir(v) {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'));
  return repeticionValida(n) ? n : undefined;
}

export const MENSAJE_REPETICIONES = 'Las repeticiones van enteras o de media en media: 8 u 8,5.';

/**
 * Lo que él ha escrito en un campo. `{ ok: true, valor }` (con `valor: null` si
 * lo ha dejado vacío) o `{ ok: false, mensaje }`. Admite la coma y el punto.
 */
export function leerRepeticiones(textoEscrito) {
  const t = String(textoEscrito ?? '').trim();
  if (t === '') return { ok: true, valor: null, mensaje: null };
  if (!/^\d+([.,]\d+)?$/.test(t)) return { ok: false, valor: null, mensaje: 'Escribe un número: 8 u 8,5.' };
  const n = Number(t.replace(',', '.'));
  if (!repeticionValida(n)) return { ok: false, valor: null, mensaje: MENSAJE_REPETICIONES };
  return { ok: true, valor: n, mensaje: null };
}

/** «8», «8,5». Vacío si no hay número. */
export function textoReps(n) {
  return decimal(n);
}

/** Un paso de − o + sobre unas repeticiones que ya valen: conserva la media
 *  (8,5 + 1 = 9,5) en vez de redondear al entero. */
export function sumarRepeticiones(actual, paso) {
  const siguiente = Math.max(0, Number(actual) + paso);
  return Math.round(siguiente * 2) / 2;
}
