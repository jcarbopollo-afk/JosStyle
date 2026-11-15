// ============================================================================
// HORARIOS · FASE 4, ENTREGA A — LA HOJA DE FECHAS (`docs/19` §1, §8.7 y §14.1)
//
// Tres utilidades de fecha que hoy importan Fitness y Sueño desde `horario.js` y
// `hoy.js`. Viven aquí, en una hoja sin imports, para que el rediseño de
// Horarios pueda cambiar esos dos archivos sin arrastrar a quien solo necesita
// saber qué día de la semana es una fecha.
//
// ⚠️ Se MUDAN, no se reescriben: misma firma y mismo resultado que tenían
// (`docs/19` §12.1, punto 7: «las utilidades de fecha conservan su firma»).
// `horario.js` y `hoy.js` las reexportan con `import` + `export { }` (nunca
// `export … from`, EH F17), así que nadie que las importe de allí cambia.
//
// ⚠️ `diasEntre` es la de `hoy.js`, NO la de `rachas.js`: son dos funciones
// distintas con el mismo nombre (`docs/18`, Fitness).
// ============================================================================

/** Los siete días, lunes primero (lunes = 1). */
export const DIAS_SEMANA = [
  { dia: 1, label: 'Lunes', corto: 'L' },
  { dia: 2, label: 'Martes', corto: 'M' },
  { dia: 3, label: 'Miércoles', corto: 'X' },
  { dia: 4, label: 'Jueves', corto: 'J' },
  { dia: 5, label: 'Viernes', corto: 'V' },
  { dia: 6, label: 'Sábado', corto: 'S' },
  { dia: 7, label: 'Domingo', corto: 'D' },
];

/** El día de la semana (1–7, lunes primero) de una fecha local. */
export function diaDeFecha(fechaISO) {
  const d = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  // `getDay()` da 0 para domingo; en España la semana empieza en lunes.
  return ((d.getDay() + 6) % 7) + 1;
}

/** Días enteros entre dos fechas ISO. Cero si alguna falta. */
export function diasEntre(desde, hasta) {
  if (!desde || !hasta) return 0;
  return Math.round((new Date(`${hasta}T00:00:00`) - new Date(`${desde}T00:00:00`)) / 86400000);
}
