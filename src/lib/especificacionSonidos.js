// ============================================================================
// SO · Fase 4/5 — LA BIBLIOTECA SONORA, DEFINIDA
//
// *"Definir y preparar la biblioteca sonora."*
//
// ⚠️ **Esta fase no crea los sonidos, y no puede.** No hay ni un archivo de
// audio en el proyecto, y generarlos sería inventarse la mitad del trabajo
// (regla 8). Lo que sí se puede hacer —y es exactamente lo que pide el verbo
// "definir"— es escribir **la especificación de cada archivo como código**:
//
//   · qué familias hay y cuánto puede durar cada una;
//   · el nombre exacto de cada archivo y dónde va;
//   · cuáles pueden tener variantes y **cuáles tienen que ser únicos**;
//   · un validador que comprueba un archivo contra su ficha;
//   · y una lista de **qué falta**, para que Josué sepa qué grabar.
//
// Esto convierte *"dame los sonidos"* en una lista precisa. El día que los
// archivos estén en `public/sonidos/`, **suena sin tocar una línea**: el motor
// de SO F1 ya los busca ahí.
//
// ── LA FIRMA SONORA ────────────────────────────────────────────────────────
//
// *"Crear una pequeña firma sonora […] un motivo de 2-4 notas que pueda
// aparecer de forma evolucionada en level up, milestones, logros, récords y
// grandes recompensas."*
//
// Aquí está definido **como intervalos**, no como un archivo: es lo que se le
// puede dar a quien los produzca para que los ocho sonidos importantes suenen
// del mismo producto. Y **la firma se llama de JosStyle** (D2-08): *JC
// Lifestyle* es el nombre histórico que aparece en la especificación.
// ============================================================================

/* ===========================================================================
   1 · LAS FAMILIAS Y SUS DURACIONES
   ===========================================================================
   ⚠️ Las duraciones no son decoración: un sonido de interfaz de 400 ms se pisa
   con el siguiente toque, y uno de logro de 100 ms no se llega a oír. Son el
   límite entre "se nota bien" y "molesta". */

export const FAMILIAS = [
  { id: 'ui', label: 'Interfaz', min: 40, max: 150, categoria: 'ui' },
  { id: 'feedback', label: 'Confirmación', min: 100, max: 300, categoria: 'feedback' },
  { id: 'progress', label: 'Progreso', min: 150, max: 400, categoria: 'feedback' },
  { id: 'reward', label: 'Recompensa', min: 250, max: 700, categoria: 'streak' },
  { id: 'streak', label: 'Racha', min: 250, max: 1200, categoria: 'streak' },
  { id: 'achievement', label: 'Logro', min: 500, max: 2000, categoria: 'achievement' },
  { id: 'warning', label: 'Aviso', min: 150, max: 500, categoria: 'feedback' },
  { id: 'system', label: 'Sistema', min: 80, max: 400, categoria: 'ui' },
];

export const familia = (id) => FAMILIAS.find((f) => f.id === id) || null;

/** Los tramos de duración del enunciado, para poder comprobarlos. */
export const TRAMOS = [
  { id: 'microinteraccion', label: 'Microinteracción', min: 40, max: 150 },
  { id: 'feedback', label: 'Feedback', min: 100, max: 300 },
  { id: 'recompensa', label: 'Recompensa', min: 250, max: 700 },
  { id: 'milestone', label: 'Milestone', min: 500, max: 1200 },
  { id: 'gran_logro', label: 'Gran logro', min: 800, max: 2000 },
];

/* ===========================================================================
   2 · EL CARÁCTER
   ===========================================================================
   *"Premium, tecnológico, deportivo, elegante, motivacional, progreso,
   satisfacción."* Y lo que hay que evitar.

   Están aquí como listas y no como comentario porque es lo que se le entrega a
   quien produzca los sonidos: una frase suelta en un README se pierde. */

export const CARACTER = ['premium', 'tecnológico', 'deportivo', 'elegante', 'motivacional', 'progreso', 'satisfacción'];

export const EVITAR = [
  'infantil', 'arcade excesivo', 'molesto', 'demasiado largo', 'genérico', 'alarma agresiva',
];

/* ===========================================================================
   3 · LA FIRMA SONORA
   ===========================================================================
   ⚠️ Definida como **intervalos, no como notas concretas**: así se puede
   transportar a cualquier tonalidad y sigue reconociéndose. Es lo que hace que
   ocho sonidos distintos suenen del mismo producto. */

export const FIRMA = {
  nombre: 'Firma de JosStyle',
  // Cuarta justa ascendente + segunda mayor: tres notas, abierta y sin
  // resolver. Deja sitio para que las versiones grandes la completen.
  intervalos: [0, 5, 7],
  notas: 3,
  // Cómo aparece en cada nivel, de menor a mayor.
  evoluciones: [
    { en: 'logro', como: 'Las tres notas, limpias.' },
    { en: 'record', como: 'Las tres notas y la octava, más cuerpo.' },
    { en: 'milestone_medio', como: 'Las tres notas con una capa debajo.' },
    { en: 'milestone_grande', como: 'La firma completa, resuelta hacia arriba.' },
    { en: 'gran_logro', como: 'La firma completa con cola larga.' },
  ],
};

/** Los sonidos donde la firma tiene que aparecer (el enunciado los enumera). */
export const CON_FIRMA = [
  'level_up', 'achievement_unlocked', 'personal_record', 'grand_achievement',
  'streak_milestone_30', 'streak_milestone_100', 'streak_milestone_365', 'reward_major',
];

/* ===========================================================================
   4 · QUÉ ARCHIVOS HACEN FALTA
   ===========================================================================
   ⚠️ **Los importantes son ÚNICOS.** El enunciado los enumera: level up,
   milestones, personal record, grand achievement y 365 días. Un récord con tres
   variantes deja de ser un momento; es lo mismo que el cooldown largo que SO F1
   le puso.

   Y los que se repiten mucho **sí llevan variantes**, porque oír el mismo clic
   doscientas veces al día es exactamente lo que cansa. */

/* 🐛 **Dónde están los archivos y por dónde los pide el navegador NO son lo
   mismo**, y confundirlo tuvo el endpoint de audio roto desde la SO F4.

   En Vite, todo lo que está en `public/` se sirve desde la raíz: un archivo en
   `public/sonidos/ui_click_01.mp3` se pide como `/sonidos/ui_click_01.mp3`. El
   `public/` **no aparece en la URL**. Y `listaDeArchivos()` estaba montando la
   ruta con `CARPETA`, así que el motor hacía `fetch('public/sonidos/…')` — un
   404 garantizado.

   No saltó en 65 fases porque no había ni un archivo que cargar: el primer MP3
   de verdad, el 2026-09-04, lo destapó en el primer intento. Por eso ahora son
   dos constantes distintas y con nombres que no se confunden. */
export const CARPETA = 'public/sonidos'; // dónde se dejan los archivos (disco)
export const RUTA_WEB = '/sonidos'; // por dónde los pide el navegador (URL)
export const FORMATO = 'mp3';
export const MAX_KB = 60;

const s = (id, fam, { variantes = 1, tramo = 'feedback', unico = false } = {}) =>
  ({ id, familia: fam, variantes, tramo, unico });

export const ARCHIVOS = [
  // Interfaz: pocas cosas y muy cortas, con variantes para no cansar.
  s('ui_click', 'ui', { variantes: 3, tramo: 'microinteraccion' }),
  s('ui_toggle_on', 'ui', { variantes: 1, tramo: 'microinteraccion' }),
  s('ui_toggle_off', 'ui', { variantes: 1, tramo: 'microinteraccion' }),
  s('ui_open', 'ui', { variantes: 2, tramo: 'microinteraccion' }),
  s('ui_close', 'ui', { variantes: 2, tramo: 'microinteraccion' }),

  // Confirmaciones.
  s('success', 'feedback', { variantes: 2 }),
  s('error', 'warning', { variantes: 1 }),
  s('warning', 'warning', { variantes: 1 }),
  s('save', 'feedback', { variantes: 2 }),
  s('task_complete', 'progress', { variantes: 2 }),
  s('habit_complete', 'progress', { variantes: 2 }),
  s('goal_progress', 'progress', { variantes: 2 }),

  // Racha.
  s('streak_start', 'streak', { variantes: 1, tramo: 'recompensa' }),
  s('streak_increment', 'streak', { variantes: 3, tramo: 'recompensa' }),
  s('streak_at_risk', 'warning', { variantes: 1 }),
  s('streak_recovered', 'streak', { variantes: 1, tramo: 'recompensa' }),

  // Los milestones: los pequeños pueden compartir carácter, los grandes NO.
  s('streak_milestone_03', 'streak', { tramo: 'recompensa' }),
  s('streak_milestone_07', 'streak', { tramo: 'milestone' }),
  s('streak_milestone_14', 'streak', { tramo: 'milestone' }),
  s('streak_milestone_21', 'streak', { tramo: 'milestone' }),
  s('streak_milestone_30', 'streak', { tramo: 'milestone', unico: true }),
  s('streak_milestone_50', 'streak', { tramo: 'milestone', unico: true }),
  s('streak_milestone_75', 'streak', { tramo: 'milestone', unico: true }),
  s('streak_milestone_100', 'achievement', { tramo: 'gran_logro', unico: true }),
  s('streak_milestone_180', 'achievement', { tramo: 'gran_logro', unico: true }),
  s('streak_milestone_365', 'achievement', { tramo: 'gran_logro', unico: true }),

  // Lo que se reserva.
  s('personal_record', 'achievement', { tramo: 'gran_logro', unico: true }),
  s('achievement_unlocked', 'achievement', { tramo: 'milestone', unico: true }),
  s('badge_unlocked', 'achievement', { tramo: 'milestone' }),
  s('goal_complete', 'achievement', { tramo: 'milestone', unico: true }),
  s('grand_achievement', 'achievement', { tramo: 'gran_logro', unico: true }),
  s('level_up', 'reward', { tramo: 'recompensa', unico: true }),

  // Sistema.
  s('sync_complete', 'system', { tramo: 'microinteraccion' }),
  s('connection_lost', 'system', { tramo: 'feedback' }),
  s('connection_restored', 'system', { tramo: 'feedback' }),
];

export const fichaDe = (id) => ARCHIVOS.find((a) => a.id === id) || null;

/** Los nombres de fichero exactos de un sonido, con sus variantes. */
export function nombresDe(id) {
  const f = fichaDe(id);
  if (!f) return [];
  if (f.variantes <= 1) return [`${id}.${FORMATO}`];
  return Array.from({ length: f.variantes }, (_, i) => `${id}_${String(i + 1).padStart(2, '0')}.${FORMATO}`);
}

/** Todos los ficheros que hacen falta, con su ruta. */
export function listaDeArchivos() {
  return ARCHIVOS.flatMap((a) => nombresDe(a.id).map((nombre) => ({
    nombre,
    /* 🐛 `RUTA_WEB`, no `CARPETA`: esto lo consume `fetch()` en el navegador. */
    ruta: `${RUTA_WEB}/${nombre}`,
    enDisco: `${CARPETA}/${nombre}`,
    sonido: a.id,
    familia: a.familia,
    tramo: a.tramo,
    unico: a.unico,
    conFirma: CON_FIRMA.includes(a.id),
    ...duracionDe(a),
  })));
}

/** El rango de duración que le corresponde a un sonido, en milisegundos. */
export function duracionDe(ficha) {
  const t = TRAMOS.find((x) => x.id === ficha?.tramo);
  const f = familia(ficha?.familia);
  if (!t || !f) return { minMs: 0, maxMs: 0 };
  // ⚠️ Se cruzan los dos: la familia manda sobre el tramo cuando es más
  // estricta. Un `ui_click` de 300 ms cumpliría "feedback" y aun así se pisaría
  // con el siguiente toque.
  return { minMs: Math.max(t.min, f.min), maxMs: Math.min(t.max, f.max) };
}

/* ===========================================================================
   5 · VALIDAR UN ARCHIVO
   ===========================================================================
   Cuando lleguen, esto dice si cada uno cumple su ficha. Es lo que evita que un
   `ui_click` de dos segundos entre sin que nadie lo note. */

export function validarArchivo({ nombre = '', duracionMs = 0, tamanoKb = 0 } = {}) {
  const problemas = [];
  /* 🐛 **El número de un hito NO es un número de variante.**
     `ui_click_01` es la primera de tres versiones del mismo sonido, así que para
     encontrar su ficha hay que quitarle el `_01`. Pero `streak_milestone_30` es
     un sonido en sí mismo —el hito de 30 días—, y quitarle el `_30` daba
     `streak_milestone`, que no existe: los diez hitos se rechazaban con "ese
     nombre no está en la lista de sonidos", cada uno de ellos válido.

     ⚠️ Se prueba el nombre entero **primero**. Si es una ficha, es una ficha; el
     recorte de variante solo se intenta cuando no lo es. */
  const sinExtension = nombre.replace(/\.[a-z0-9]+$/i, '');
  const base = fichaDe(sinExtension) ? sinExtension : sinExtension.replace(/_\d{2}$/, '');
  const ficha = fichaDe(base);

  if (!nombre.toLowerCase().endsWith(`.${FORMATO}`)) problemas.push(`Tiene que ser .${FORMATO}.`);
  if (!ficha) {
    problemas.push('Ese nombre no está en la lista de sonidos.');
    return { valido: false, ficha: null, problemas };
  }

  const { minMs, maxMs } = duracionDe(ficha);
  if (duracionMs > 0) {
    if (duracionMs < minMs) problemas.push(`Se queda corto: mínimo ${minMs} ms.`);
    if (duracionMs > maxMs) problemas.push(`Se pasa de largo: máximo ${maxMs} ms.`);
  }
  if (tamanoKb > MAX_KB) problemas.push(`Pesa demasiado: máximo ${MAX_KB} KB.`);

  // ⚠️ Un sonido único con variantes deja de ser un momento.
  if (ficha.unico && /_\d{2}$/.test(nombre.replace(/\.[a-z0-9]+$/i, ''))) {
    problemas.push('Este sonido tiene que ser único: no lleva variantes.');
  }

  return { valido: problemas.length === 0, ficha, problemas, minMs, maxMs };
}

/* ===========================================================================
   6 · QUÉ FALTA
   ===========================================================================
   ⚠️ **La función más honesta del archivo.** Hoy devuelve la lista entera,
   porque no hay ni un sonido. El día que Josué meta los primeros, dirá
   exactamente cuáles quedan. */

export function queFalta(presentes = []) {
  const hay = new Set((presentes || []).map((x) => (typeof x === 'string' ? x : x?.nombre)).filter(Boolean));
  const todos = listaDeArchivos();
  const faltan = todos.filter((a) => !hay.has(a.nombre));
  const criticos = faltan.filter((a) => a.unico);

  return {
    total: todos.length,
    hay: todos.length - faltan.length,
    faltan,
    // Los únicos son los que más cuestan y los que más se notan: se dicen aparte.
    criticos,
    completo: faltan.length === 0,
    // Por dónde empezar: sin los de interfaz no se nota nada al usar la app.
    primeros: faltan.filter((a) => a.familia === 'ui').slice(0, 5),
    texto: faltan.length === 0
      ? 'Están todos los sonidos.'
      : `Faltan ${faltan.length} de ${todos.length} archivos${criticos.length ? `, ${criticos.length} de ellos únicos` : ''}.`,
  };
}

/** Lo que hay que darle a quien produzca los sonidos, en un objeto. */
export function briefing() {
  return {
    firma: FIRMA,
    conFirma: CON_FIRMA,
    caracter: CARACTER,
    evitar: EVITAR,
    formato: FORMATO,
    maxKb: MAX_KB,
    carpeta: CARPETA,
    familias: FAMILIAS,
    archivos: listaDeArchivos(),
  };
}

export function resumenBiblioteca(presentes = []) {
  const falta = queFalta(presentes);
  const todos = listaDeArchivos();
  return {
    ...falta,
    sonidos: ARCHIVOS.length,
    conVariantes: ARCHIVOS.filter((a) => a.variantes > 1).length,
    unicos: ARCHIVOS.filter((a) => a.unico).length,
    conFirma: todos.filter((a) => a.conFirma).length,
    porFamilia: FAMILIAS.map((f) => ({ ...f, cuantos: todos.filter((a) => a.familia === f.id).length })),
  };
}
