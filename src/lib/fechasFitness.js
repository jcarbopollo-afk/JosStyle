/* Entrega 4 · Fase 42/45 — UNA FECHA, UN FORMATO POR PAPEL (apartado 59).
   ═══════════════════════════════════════════════════════════════════════════

   *"Unificar formato español: 12 sept 2026 o el formato establecido por Jos
   Style. No mezclar formatos."*

   El formato establecido ya existía y lo fijó la F8 (*"12 septiembre 2026"*,
   `fechaLarga`), y lo repiten el historial, los objetivos, el progreso y el
   detalle de un ejercicio. Lo que había mezclado eran **cuatro listas de meses
   escritas a mano** —la de la F8, dos copias idénticas de «ENE, FEB…» (la
   galería de la F26 y el historial de rangos de la F22) y un «ene, feb… sept»
   en la tarjeta de la F39— y una quinta forma que no salía de ninguna:
   `toLocaleDateString` en Tu Plan, que además **no es igual en todos los
   Node** (la lección de la F39).

   Así que no se inventa un formato: se dejan **tres papeles**, cada uno con UNA
   función, y ninguna pantalla de Fitness compone una fecha por su cuenta.

     · `fechaLarga`   «12 septiembre 2026» — una fecha suelta, en una lista o
                      una ficha (F8, apartado 4).
     · `diaYMes`      «12 de septiembre» — dentro de una frase: «Activo desde
                      el 12 de septiembre», «Empezado el 12 de septiembre».
     · `fechaEtiqueta`«12 SEP» / «12 SEP 2026» — el rótulo pequeño en
                      mayúsculas de una miniatura o de un eje (F26, F22), que
                      es donde el apartado 58 deja usar mayúsculas.

   ⚠️ **Es una hoja del árbol de imports**: solo depende de `helpers.js`. Así la
   pueden importar `entrenamiento.js` y `finalizacion.js`, que se importan entre
   sí de un lado (la F39 escribió su propia lista de meses porque desde ahí
   importar `finalizacion.js` habría sido un ciclo).
   ═══════════════════════════════════════════════════════════════════════════ */

import { fechaValida } from './helpers';

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* El rótulo corto. ⚠️ Se DERIVA de `MESES` —tres letras y en mayúsculas—, no se
   escribe una segunda lista: las dos copias de la F22 y la F26 eran justo eso. */
export const MESES_ETIQUETA = MESES.map((m) => m.slice(0, 3).toUpperCase());

/* ⚠️ En LOCAL (`T00:00:00`), nunca en UTC: en España devolvería el día anterior
   (la lección del UTC, siete veces en este proyecto). Y la forma no basta:
   `fechaValida` rechaza un «2026-13-45» que encaja con la expresión (E3 F9). */
const partes = (iso) => {
  if (typeof iso !== 'string' || !fechaValida(iso)) return null;
  const [a, m, d] = iso.split('-').map(Number);
  return { a, m, d };
};

/** *"12 septiembre 2026"* — la de la F8. Sin fecha válida, `''`. */
export function fechaLarga(iso) {
  const p = partes(iso);
  return p ? `${p.d} ${MESES[p.m - 1]} ${p.a}` : '';
}

/** *"12 de septiembre"* — la de dentro de una frase. Sin fecha válida, `''`. */
export function diaYMes(iso) {
  const p = partes(iso);
  return p ? `${p.d} de ${MESES[p.m - 1]}` : '';
}

/** *"12 SEP"*, o *"12 SEP 2026"* con `{ anio: true }` — el rótulo pequeño. */
export function fechaEtiqueta(iso, { anio = false } = {}) {
  const p = partes(iso);
  if (!p) return '';
  return anio ? `${p.d} ${MESES_ETIQUETA[p.m - 1]} ${p.a}` : `${p.d} ${MESES_ETIQUETA[p.m - 1]}`;
}

/** Los tres papeles, para la auditoría y para quien necesite saber cuál usar. */
export const FORMATOS_FECHA = [
  { id: 'larga', funcion: fechaLarga, ejemplo: '12 septiembre 2026', cuando: 'Una fecha suelta: una lista, una ficha, un detalle (F8, apartado 4).' },
  { id: 'frase', funcion: diaYMes, ejemplo: '12 de septiembre', cuando: 'Dentro de una frase: «Activo desde el…», «Empezado el…».' },
  { id: 'etiqueta', funcion: fechaEtiqueta, ejemplo: '12 SEP', cuando: 'El rótulo pequeño de una miniatura o de un eje, en mayúsculas (apartado 58).' },
];
