/* ─────────────────────────────────────────────────────────────────────────
   Entrega 4 · FIT F43/45 — AUDITORÍA FUNCIONAL INTEGRAL DE FITNESS.

   *"Esta fase no consiste en añadir funcionalidades nuevas. El objetivo es
   comprobar que TODO lo construido hasta ahora funciona conjuntamente."*

   Esto es el INFORME de la fase, escrito como datos para que la prueba lo
   pueda comprobar (apartado 71): los cincuenta flujos con DÓNDE se prueba cada
   uno —el archivo y la marca que la prueba busca en él—, los fallos
   encontrados con su prioridad (apartado 67), lo pendiente con su motivo
   (apartados 66 y 68) y lo que NO se añade.

   ⚠️ **No calcula nada de Fitness**: los flujos se EJECUTAN en
   `scripts/test-auditoria-fitness.mjs` (Node, con la puerta de carga de verdad
   entre paso y paso) y en la sección «FIT F43» del recorrido de Chromium. Una
   tabla que dijera «probado» sin que la prueba exista sería la auditoría que
   no puede fallar (EH F42), así que cada línea nombra la comprobación y la
   suite comprueba que está.
   ───────────────────────────────────────────────────────────────────────── */

const NODE = 'scripts/test-auditoria-fitness.mjs';
const RECORRIDO = 'scripts/test-app-real.mjs';

/** Dónde se prueba: el archivo y un texto que tiene que estar en él. En la
    suite de Node, la marca es el número del flujo entre paréntesis —«(flujo
    2)», «(flujos 6 y 8)»—, que es como cada comprobación dice qué mide. */
const en = (archivo, marca) => ({ archivo, marca });
const nodo = (n) => ({ archivo: NODE, flujo: n });

/** Los cincuenta flujos del enunciado, en su orden (apartados 3-52). */
export const FLUJOS_F43 = Object.freeze([
  { n: 1, nombre: 'Usuario nuevo', donde: [en(NODE, 'Usuario nuevo: ni un dato inventado (flujo 1)'), en(RECORRIDO, 'USUARIO NUEVO (apartado 58)')] },
  { n: 2, nombre: 'Crear entrenamiento', donde: [nodo(2), en(RECORRIDO, 'FIT F3')] },
  { n: 3, nombre: 'Editar entrenamiento', donde: [nodo(3), en(RECORRIDO, 'FIT F4')] },
  { n: 4, nombre: 'Duplicar', donde: [nodo(4), en(RECORRIDO, 'FIT F4')] },
  { n: 5, nombre: 'Eliminar', donde: [nodo(5), en(RECORRIDO, 'FIT F4')] },
  { n: 6, nombre: 'Plan predefinido', donde: [nodo(6), en(RECORRIDO, 'FIT F5')] },
  { n: 7, nombre: 'Personalizar plan', donde: [nodo(7), en(RECORRIDO, 'FIT F5')] },
  { n: 8, nombre: 'Tu Plan', donde: [nodo(8), en(RECORRIDO, 'FIT F6')] },
  { n: 9, nombre: 'Planificación semanal', donde: [nodo(9), en(RECORRIDO, 'FIT F32')] },
  { n: 10, nombre: 'Entrenamiento extra', donde: [nodo(10), en(RECORRIDO, 'FIT F32')] },
  { n: 11, nombre: 'Entrenamiento en vivo', donde: [en(RECORRIDO, 'FIT F7'), en(RECORRIDO, 'FIT F9')] },
  { n: 12, nombre: 'Persistencia durante el entrenamiento', donde: [nodo(12), en(RECORRIDO, 'FIT F41')] },
  { n: 13, nombre: 'Reemplazar ejercicio', donde: [nodo(13), en(RECORRIDO, 'FIT F33')] },
  { n: 14, nombre: 'Reemplazo desde el constructor', donde: [nodo(14), en(RECORRIDO, 'FIT F33')] },
  { n: 15, nombre: 'Completar entrenamiento', donde: [en(RECORRIDO, 'FIT F8')] },
  { n: 16, nombre: 'Doble guardado', donde: [nodo(16), en(RECORRIDO, 'FIT F41')] },
  { n: 17, nombre: 'Descartar', donde: [nodo(17), en(RECORRIDO, 'FIT F8')] },
  { n: 18, nombre: 'Historial', donde: [nodo(18), en(RECORRIDO, 'FIT F10')] },
  { n: 19, nombre: 'Progreso de ejercicio', donde: [nodo(19), en(RECORRIDO, 'FIT F36')] },
  { n: 20, nombre: 'Variantes', donde: [nodo(20), en(RECORRIDO, 'FIT F29')] },
  { n: 21, nombre: 'Isométricos', donde: [nodo(21), en(RECORRIDO, 'FIT F12')] },
  { n: 22, nombre: 'Peso corporal', donde: [nodo(22)] },
  { n: 23, nombre: 'Objetivo', donde: [nodo(23), en(RECORRIDO, 'FIT F30')] },
  { n: 24, nombre: 'Objetivo completado', donde: [nodo(24), en(RECORRIDO, 'FIT F14')] },
  { n: 25, nombre: 'Objetivo vencido', donde: [nodo(25)] },
  { n: 26, nombre: 'Rango de ejercicio', donde: [nodo(26), en(RECORRIDO, 'FIT F37')] },
  { n: 27, nombre: 'Rango muscular', donde: [nodo(27), en(RECORRIDO, 'FIT F18')] },
  { n: 28, nombre: 'Rango global', donde: [nodo(28), en(RECORRIDO, 'FIT F16')] },
  { n: 29, nombre: 'Clasificación', donde: [nodo(29), en(RECORRIDO, 'FIT F24')] },
  { n: 30, nombre: 'Clasificación frente a datos reales', donde: [nodo(30)] },
  { n: 31, nombre: 'Historial de rango', donde: [nodo(31), en(RECORRIDO, 'FIT F22')] },
  { n: 32, nombre: 'Siguiente rango', donde: [en(RECORRIDO, 'FIT F23')] },
  { n: 33, nombre: 'Ficha del ejercicio', donde: [nodo(33), en(RECORRIDO, 'FIT F34')] },
  { n: 34, nombre: 'Alternativas', donde: [nodo(34), en(RECORRIDO, 'FIT F33')] },
  { n: 35, nombre: 'Ejercicio archivado', donde: [nodo(35), en(RECORRIDO, 'FIT F39')] },
  { n: 36, nombre: 'Fotos', donde: [en(RECORRIDO, 'FIT F26')] },
  { n: 37, nombre: 'Comparador', donde: [nodo(37), en(RECORRIDO, 'FIT F27')] },
  { n: 38, nombre: 'Foto y entrenamiento', donde: [nodo(38), en(RECORRIDO, 'FIT F36')] },
  { n: 39, nombre: 'Progreso global', donde: [en(RECORRIDO, 'FIT F28')] },
  { n: 40, nombre: 'Actividad', donde: [nodo(40), en(RECORRIDO, 'FIT F31')] },
  { n: 41, nombre: 'Cambio de plan', donde: [nodo(41), en(RECORRIDO, 'FIT F32')] },
  { n: 42, nombre: 'Eliminación de plan', donde: [nodo(42)] },
  { n: 43, nombre: 'Recarga total', donde: [en(RECORRIDO, 'FIT F41')] },
  { n: 44, nombre: 'Datos grandes', donde: [en(RECORRIDO, 'FIT F40')] },
  { n: 45, nombre: 'Error controlado', donde: [en(RECORRIDO, 'FIT F39'), en(RECORRIDO, 'FIT F37')] },
  { n: 46, nombre: 'Navegación profunda', donde: [en(RECORRIDO, 'FIT F43 — Rangos → músculo → subgrupo'), en(NODE, '«Volver» lleva al contexto anterior (46 y 47)')] },
  { n: 47, nombre: 'Volver', donde: [en(RECORRIDO, 'FIT F43 — volver'), en(NODE, '«Volver» lleva al contexto anterior (46 y 47)')] },
  { n: 48, nombre: 'Cambio de orientación', donde: [en(RECORRIDO, 'FIT F43 — girar'), en(RECORRIDO, 'GIRAR EL iPHONE')] },
  { n: 49, nombre: 'Teclado', donde: [en(RECORRIDO, 'FIT F39')] },
  { n: 50, nombre: 'Movimiento reducido', donde: [en(RECORRIDO, 'FIT F43 — movimiento reducido'), en(RECORRIDO, "reducedMotion: 'reduce'")] },
]);

/** Las cinco consistencias (apartados 53-57). */
export const CONSISTENCIAS_F43 = Object.freeze([
  { apartado: 53, que: 'Tres series hechas se leen como tres en la sesión, el resumen, el historial, el progreso, la actividad y el rango' },
  { apartado: 54, que: 'El mismo `exerciseId` en catálogo, sesión, progreso, objetivo, rango e historial' },
  { apartado: 55, que: 'Variante, agarre y equipamiento no se mezclan ni se repiten' },
  { apartado: 56, que: 'Inicio y fin, fecha de la sesión, creación y fecha objetivo, fecha de la foto y de subida: cada una en su campo' },
  { apartado: 57, que: 'Ni sesión completada y en curso, ni objetivo completado y cancelado, ni plantilla borrada visible, ni archivado sugerido, ni rango provisional presentado como definitivo' },
]);

/** La escala del apartado 67. */
export const PRIORIDADES_F43 = Object.freeze([
  { id: 'P0', que: 'Rompe Fitness o puede perder datos', obligatorio: true },
  { id: 'P1', que: 'Rompe una función importante', obligatorio: true },
  { id: 'P2', que: 'Comportamiento incorrecto con alternativa', obligatorio: false },
  { id: 'P3', que: 'Detalle menor', obligatorio: false },
]);

/** Lo que encontró la auditoría. Cada corregido dice qué comprobación lo
    habría cazado; lo que no se corrige, por qué. */
export const BUGS_F43 = Object.freeze([
  {
    id: 'historial_desde_progreso', prioridad: 'P1', estado: 'corregido', fase: 'F28 + F31',
    que: '«Ver historial» y la tarjeta de entrenamientos de Progreso → Resumen no hacían nada: llamaban a `setDentro`, que vive en `AreaEntrenamiento` y no en `FitnessView`, y lanzaban un ReferenceError al tocarlos.',
    donde: 'src/views/FitnessView.jsx',
    prueba: 'El recorrido lo pulsa y exige el Historial; y la suite de la fase barre `FitnessView` buscando `setDentro(` fuera de su área. El recorrido no lo vio antes porque los errores de consola entre la F12 y la F37 no se comprobaban: ahora se comprueban al final de la sección de la F43.',
  },
  {
    id: 'volver_sin_origen', prioridad: 'P1', estado: 'corregido', fase: 'F12 + F18 + F31 + F32 + F34',
    que: 'El progreso de un ejercicio se abre desde Rangos, el Historial, Tu Plan, la ficha de la biblioteca y el propio Progreso, y «volver» llevaba siempre a la portada de Progreso: desde Rangos → Espalda → Dorsales se perdía el músculo, el subgrupo y el área (apartados 46 y 47).',
    donde: 'src/lib/vueltaFitness.js · FitnessView · ProgresoView · RangosView · DetalleMuscularView · HistorialView · EjerciciosView',
    prueba: 'La cadena Rangos → músculo → subgrupo → ejercicio → sesión → volver → volver, en Chromium; y `vueltaDelDetalle` en Node.',
  },
  {
    id: 'volver_mentia', prioridad: 'P2', estado: 'corregido', fase: 'F13 + F29 + F30',
    que: 'Dentro de Progreso, el botón decía «Progreso» y volvía al objetivo, al músculo o al ejercicio anterior; y la sesión abierta encima de un ejercicio decía «Volver a Progreso» y volvía al ejercicio.',
    donde: 'src/views/ProgresoView.jsx',
    prueba: '`vueltaDelDetalle` y `vueltaDeSesion` deciden el destino y el texto a la vez.',
  },
  {
    id: 'agarre_repetido', prioridad: 'P3', estado: 'corregido', fase: 'F9 + F10 + F29',
    que: 'En las tres dominadas y el curl martillo la variante ES el agarre, y el entrenamiento en vivo y el detalle de una sesión escribían «Agarre prono · Agarre prono» (apartado 55).',
    donde: 'src/lib/ejercicios.js (`agarreQueAnadir`) · entrenamientoUx.js · detalleEjercicio.js',
    prueba: 'La suite barre el catálogo entero buscando una variante y un agarre repetidos.',
  },
  {
    id: 'fecha_superada_dos_textos', prioridad: 'P3', estado: 'corregido', fase: 'F14 + F30',
    que: 'El mismo estado se llamaba «Fecha superada» en la lista de objetivos y «Fecha objetivo superada» en el detalle (apartados 25 y 57).',
    donde: 'src/views/ProgresoView.jsx',
    prueba: 'Las dos pantallas leen `FECHA_SUPERADA`.',
  },
  {
    id: 'errores_entre_secciones', prioridad: 'P2', estado: 'corregido', fase: 'recorrido',
    que: 'El recorrido solo comprobaba los errores de la consola al arrancar y en las ventanas de la F37 a la F42: un error lanzado en la sección de la F28 o la F31 se apuntaba y nadie lo leía. Así se escondió el ReferenceError de «Ver historial».',
    donde: 'scripts/test-app-real.mjs',
    prueba: 'Al final de la sección de la F43, ni un error de JavaScript en todo el recorrido que no se haya provocado a propósito.',
  },
  {
    id: 'parcial_completado', prioridad: 'P3', estado: 'documentado', fase: 'F31 + F32',
    que: 'Un día con un entrenamiento guardado a medias dice «Completado» en Tu Plan y «Parcial» en Actividad. Las dos cosas son ciertas —la F32 define «Completado» como «hay uno guardado», la F31 describe la sesión—, y unirlas sería una etiqueta nueva.',
    donde: 'src/lib/planificacionSemanal.js · actividadEntrenamiento.js',
    prueba: null,
  },
]);

export const bugsPorPrioridad = (p) => BUGS_F43.filter((b) => b.prioridad === p);

/** Lo que queda documentado y no se hace aquí (apartados 66 y 68). */
export const PENDIENTES_F43 = Object.freeze([
  { que: 'Unir «Completado» y «Parcial» en el día de Tu Plan', porque: 'Sería un estado nuevo de la F32 y el apartado 66 no deja añadir: queda como P3.' },
  { que: 'Una pila de navegación común a toda Fitness', porque: 'Apartado 68: sería reescribir cinco pantallas que abren sus detalles con estado propio. Se resuelve con un origen por destino, que es lo que pedían los apartados 46 y 47.' },
  { que: 'El pellizco para ampliar en el comparador', porque: 'Es la C-32 de Josué (viewport).' },
  { que: 'La prueba en el iPhone de verdad', porque: 'R1: Supabase real, la sincronización y el tacto no los cubre ninguna prueba.' },
]);

/** Lo que el apartado 66 prohíbe añadir durante la auditoría. */
export const NO_EN_FIT43 = Object.freeze([
  { que: 'IA, recomendaciones nuevas, predicciones', porque: 'Apartado 66.' },
  { que: 'Gamificación, XP, leaderboard, social', porque: 'Apartado 66 y D2-02.' },
  { que: 'Métricas nuevas', porque: 'Apartado 66: una cifra nueva no es una corrección.' },
]);

export const DECISIONES_FIT43 = Object.freeze([
  { que: 'El origen de «volver» es estado de pantalla y se consume al usarse', porque: 'EH F40: volver a Fitness mañana no puede dejarle a media ruta de hoy.' },
  { que: 'Las pestañas de Fitness reinician el recorrido', porque: 'NAVO F1: la barra reinicia, abrir apila.' },
  { que: 'Un origen caduca en cuanto se sale de su pantalla por otro camino', porque: 'Si no, abrir ese ejercicio mañana desde la lista volvería a Rangos.' },
  { que: 'Del progreso de una variante se vuelve primero al ejercicio anterior', porque: 'Es el contexto lógico anterior (apartado 47); antes volvía a la lista.' },
]);

export const flujo = (n) => FLUJOS_F43.find((x) => x.n === n) || null;

/** La auditoría de la propia fase: todo P0 y P1 corregido, cada fallo con su
    prioridad, y cada flujo con dónde se prueba. Se le puede pasar otra lista
    para demostrar que se pone roja. */
export function auditarAuditoria({ bugs = BUGS_F43, flujos = FLUJOS_F43 } = {}) {
  const fallos = [];
  const ids = new Set(PRIORIDADES_F43.map((p) => p.id));
  bugs.forEach((b) => {
    if (!ids.has(b.prioridad)) fallos.push(`${b.id}: prioridad desconocida`);
    const p = PRIORIDADES_F43.find((x) => x.id === b.prioridad);
    if (p && p.obligatorio && b.estado !== 'corregido') fallos.push(`${b.id}: ${b.prioridad} sin corregir`);
  });
  if (flujos.length !== 50) fallos.push(`hay ${flujos.length} flujos, no 50`);
  flujos.forEach((x) => { if (!x.donde || !x.donde.length) fallos.push(`flujo ${x.n} sin prueba`); });
  return { ok: fallos.length === 0, fallos };
}
