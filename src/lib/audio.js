// ============================================================================
// SO · Fase 1/5 — SISTEMA GLOBAL DE SONIDO: catálogo, preferencias y decisión
//
// *"No quiero que el audio se implemente directamente dentro de cada
// componente. Quiero crear un motor de audio global, reutilizable por toda la
// aplicación."* (cabecera)
//
// Este archivo es **la mitad que decide**, y es pura: dado un evento y unas
// preferencias, dice qué sonido corresponde, a qué volumen, y si toca sonar o
// callarse. No toca el navegador, así que se prueba entero con Node.
//
// La otra mitad —la que de verdad reproduce— es `audioEngine.js`, y es lo único
// del proyecto que puede tocar un `AudioContext`.
//
// ── LO QUE HAY QUE DECIR ANTES DE NADA ─────────────────────────────────────
//
// 🚨 **Esto ya no es verdad, y se deja escrito en vez de borrarlo.** El
// 2026-09-04 Josué produjo en FL Studio los tres primeros archivos
// (`ui_click_01/02/03.mp3`). Quedan 43. Lo de abajo es lo que fue cierto durante
// cinco fases, y explica por qué el motor está construido como está.
//
// **No hay ni un archivo de audio en el proyecto.** Josué escribió en la
// especificación de Rachas que los daría *"cuando la web ya tenga todos los
// botones activos"*, y el apartado 38 de esta fase prohíbe expresamente
// construir la biblioteca: *"En esta fase NO quiero: biblioteca completa de
// sonidos…"*. El 21 lo remata: *"NO es necesario crear todavía una biblioteca
// completa de sonidos. Esta fase solo necesita dejar la arquitectura lista."*
//
// Así que el motor está entero y **hoy no suena nada**, porque no hay nada que
// sonar. Eso no es una función a medias: es exactamente el camino de fallback
// del apartado 25 —*"si tampoco existe: silencio"*—, y el apartado 26 exige que
// eso no rompa nada. En cuanto Josué deje los archivos en `public/sonidos/`,
// suena sin tocar una línea de código.
//
// Lo que **no** se ha hecho es fingir. Nada de un interruptor de sonido en
// Ajustes que no haga nada (regla 8), ni un `click.mp3` inventado.
//
// ── EVENTO ≠ SONIDO (apartado 5) ───────────────────────────────────────────
//
// *"No hagas STREAK_MILESTONE → streak.mp3 directamente dentro del código."*
//
// Hay tres saltos, y cada uno se puede cambiar sin tocar el anterior:
//
//     EVENTO  →  ASIGNACIÓN  →  SONIDO  →  archivo
//
// Por eso cambiar el sonido de un hito es escribir una asignación, no editar
// código, y por eso un sonido propio de Josué entra por el mismo sitio que uno
// del sistema.
// ============================================================================

import { uid } from './helpers';

/* ===========================================================================
   1 · CATEGORÍAS (apartado 8)
   ===========================================================================
   *"Volumen general: 70%. Interfaz: 30%. Feedback: 70%. Rachas: 90%.
   Logros: 100%."*

   Las categorías no son etiquetas: son **el volumen que se puede bajar sin
   bajar los demás**. Que los clics de interfaz molesten no tiene por qué
   obligar a renunciar al sonido de un récord. */
export const CATEGORIAS_SONIDO = [
  { id: 'ui', label: 'Interfaz', porDefecto: 40 },
  { id: 'feedback', label: 'Confirmaciones', porDefecto: 70 },
  { id: 'streak', label: 'Rachas', porDefecto: 90 },
  { id: 'achievement', label: 'Logros', porDefecto: 100 },
  { id: 'training', label: 'Entrenamiento', porDefecto: 80 },
  { id: 'notification', label: 'Avisos', porDefecto: 80 },
  { id: 'custom', label: 'Personalizados', porDefecto: 80 },
];

export const categoriaSonido = (id) => CATEGORIAS_SONIDO.find((c) => c.id === id) || CATEGORIAS_SONIDO[1];

/* ===========================================================================
   2 · PRIORIDADES (apartado 9)
   ===========================================================================
   *"UI_CLICK → LOW. SUCCESS → NORMAL. STREAK_MILESTONE → HIGH."*

   El peso decide quién gana cuando dos sonidos caen juntos (apartado 10). */
export const PRIORIDADES_SONIDO = { LOW: 0, NORMAL: 1, HIGH: 2, CRITICAL: 3 };

/* ===========================================================================
   3 · EL CATÁLOGO DE EVENTOS (apartado 4)
   ===========================================================================
   Cada evento trae su categoría, su prioridad y su cooldown.

   ⚠️ **Los eventos de racha NO se redefinen aquí.** RA F3 ya los emite con sus
   nombres (`STREAK_MILESTONE_REACHED`, `STREAK_PERSONAL_RECORD`), y el apartado
   30 prohíbe montar un catálogo paralelo. La especificación de audio los llama
   `STREAK_MILESTONE` y `NEW_RECORD`, así que **se traducen** en `ALIAS_EVENTO`
   más abajo. Traducir cuesta una línea; renombrarlos en RA F3 rompería su API y
   sus pruebas, y dejaría dos catálogos separándose con cada fase. */
export const EVENTOS_SONIDO = {
  // Interfaz — discretos a propósito (apartado 12).
  UI_CLICK: { categoria: 'ui', prioridad: 'LOW', cooldown: 60 },
  UI_TOGGLE: { categoria: 'ui', prioridad: 'LOW', cooldown: 60 },
  /* 🚨 Encender y apagar NO son el mismo sonido: la biblioteca declara
     `ui_toggle_on` y `ui_toggle_off` por separado, y la SO F3 también. Aquí
     faltaba el segundo, así que los dos caían en `UI_TOGGLE` y el de apagar no
     se habría oído nunca. Lo destapó el archivo real, el 2026-09-04. */
  UI_TOGGLE_OFF: { categoria: 'ui', prioridad: 'LOW', cooldown: 60 },
  UI_BACK: { categoria: 'ui', prioridad: 'LOW', cooldown: 60 },
  UI_OPEN: { categoria: 'ui', prioridad: 'LOW', cooldown: 60 },
  UI_SUCCESS: { categoria: 'ui', prioridad: 'LOW', cooldown: 120 },

  // Confirmaciones.
  ACTION_COMPLETED: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  ACTION_ERROR: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  /* 🚨 Aviso y error NO son lo mismo, y la biblioteca los declara aparte. Sin
     evento propio, warning.mp3 no sonaría jamás. */
  ACTION_WARNING: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  /* Guardar tampoco es 'acción completada': es más discreto, y tiene su sonido. */
  ACTION_SAVED: { categoria: 'feedback', prioridad: 'LOW', cooldown: 300 },
  SUCCESS: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  /* 🚨 Cada uno con su evento propio. El catálogo de la SO F3 los declara por
     separado y hasta hoy caían todos en ACTION_COMPLETED o UI_SUCCESS, así que
     solo sonaba uno de cada grupo. Ver el CHANGELOG de v3.14.0. */
  TASK_COMPLETED: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  HABIT_COMPLETED: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  GOAL_PROGRESS: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  SYNC_COMPLETED: { categoria: 'ui', prioridad: 'LOW', cooldown: 1000 },
  CONNECTION_LOST: { categoria: 'notification', prioridad: 'NORMAL', cooldown: 3000 },
  CONNECTION_RESTORED: { categoria: 'notification', prioridad: 'NORMAL', cooldown: 3000 },

  // Rachas.
  STREAK_STARTED: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 1000 },
  STREAK_CONTINUED: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 1000 },
  /* Que la racha esté en peligro no es que haya subido: son avisos distintos. */
  STREAK_AT_RISK: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 3000 },
  /* Recuperar una racha perdida no es empezarla de cero. */
  STREAK_RECOVERED: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 2000 },
  STREAK_MILESTONE: { categoria: 'streak', prioridad: 'HIGH', cooldown: 2000 },
  STREAK_BROKEN: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 2000 },

  // Lo verdaderamente especial (apartado 13). Se reserva, y por eso lleva el
  // cooldown más largo: un récord que sonara dos veces dejaría de ser un récord.
  NEW_RECORD: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  ACHIEVEMENT_UNLOCKED: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  BADGE_UNLOCKED: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  MAJOR_GOAL_COMPLETED: { categoria: 'achievement', prioridad: 'CRITICAL', cooldown: 3000 },

  // Preparados y **sin conectar** (apartado 4: *"no conectes todavía todos los
  // módulos"*). Existen en el catálogo para que añadir el módulo sea emitir,
  // no editar esto.
  TRAINING_COMPLETED: { categoria: 'training', prioridad: 'NORMAL', cooldown: 1000 },
  STUDY_COMPLETED: { categoria: 'training', prioridad: 'NORMAL', cooldown: 1000 },
  SLEEP_LOGGED: { categoria: 'feedback', prioridad: 'LOW', cooldown: 1000 },
  GOAL_COMPLETED: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  SAVING_COMPLETED: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 1000 },
  /* 🚨 `level_up` es de los ocho que el catálogo marca `motor: null` porque
     RA F3 decidió no construir niveles. Los otros siete no tienen archivo; éste
     sí —está en la biblioteca de 46 y Josué lo grabó el 2026-09-04—, así que sin
     evento el archivo existiría y nada podría reproducirlo.

     ⚠️ Tener el evento NO es fingir que hay niveles: es exactamente lo mismo que
     TRAINING_COMPLETED y los otros "preparados y sin conectar" de más arriba.
     Hoy no lo emite nadie, y el día que haya niveles suena sin tocar esto. */
  LEVEL_UP: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  CUSTOM: { categoria: 'custom', prioridad: 'NORMAL', cooldown: 500 },
};

/**
 * Los nombres de RA F3, traducidos a los de esta especificación. Un evento que
 * ya se emite en la app entra por aquí sin que nadie lo renombre.
 */
export const ALIAS_EVENTO = {
  STREAK_MILESTONE_REACHED: 'STREAK_MILESTONE',
  STREAK_PERSONAL_RECORD: 'NEW_RECORD',
};

/** El nombre canónico de un evento, venga como venga. */
export const eventoCanonico = (tipo) => ALIAS_EVENTO[tipo] || tipo;

export function definicionEvento(tipo) {
  return EVENTOS_SONIDO[eventoCanonico(tipo)] || null;
}

/* ===========================================================================
   4 · SONIDOS Y ASIGNACIONES (apartados 21, 22, 23 y 24)
   ===========================================================================
   *"SoundSource: type: system | custom, id, url/path, duration, metadata."*

   Un sonido del sistema vive en `public/sonidos/<categoria>/`; uno de Josué
   vivirá en Storage, en su carpeta. **No se mezclan** (apartado 19), y esa
   separación es también la del apartado 36: los suyos son suyos. */

export const ORIGENES_SONIDO = { SISTEMA: 'system', USUARIO: 'custom' };

export function crearSonido({ id = '', nombre = '', categoria = 'feedback', origen = 'system', ruta = '', variantes = null, duracion = 0, formato = '', tamano = 0, creadoEn = null } = {}) {
  return normalizarSonido({ id: id || uid(), nombre, categoria, origen, ruta, variantes, duracion, formato, tamano, creadoEn });
}

export function normalizarSonido(guardado) {
  const g = guardado || {};
  const n = Number(g.duracion);
  const t = Number(g.tamano);
  return {
    id: g.id || uid(),
    nombre: (g.nombre || '').trim(),
    categoria: categoriaSonido(g.categoria).id,
    origen: g.origen === ORIGENES_SONIDO.USUARIO ? ORIGENES_SONIDO.USUARIO : ORIGENES_SONIDO.SISTEMA,
    ruta: (g.ruta || '').trim(),
    /* 🚨 **Las variantes** (SO F4). Los sonidos que se oyen doscientas veces al
       día llevan varias versiones casi idénticas —`ui_click_01/02/03`— y la
       aplicación va alternando: lo que cansa es la repetición exacta, no el
       sonido. Un sonido sin variantes es simplemente uno con una sola.

       ⚠️ Va aquí, en la lista de rutas, y NO en un catálogo aparte: un segundo
       sitio donde declarar archivos es exactamente lo que llevó a que el motor
       y la biblioteca se separaran durante cuatro fases. */
    variantes: Array.isArray(g.variantes) && g.variantes.length > 0
      ? g.variantes.map((v) => String(v || '').trim()).filter(Boolean)
      : [(g.ruta || '').trim()].filter(Boolean),
    // Apartado 23 — metadata útil, y nada más. Sin `duracion` no se puede
    // decidir si un sonido personalizado es demasiado largo (apartado 37).
    duracion: Number.isFinite(n) && n > 0 ? n : 0,
    formato: (g.formato || '').trim(),
    tamano: Number.isFinite(t) && t > 0 ? t : 0,
    creadoEn: g.creadoEn || null,
  };
}

/**
 * Apartado 21 — la definición central: el motor pide **estos nueve**, y los
 * eventos se reparten entre ellos con `ASIGNACIONES_POR_DEFECTO`.
 *
 * 🐛 **Estas rutas estaban inventadas.** Esta fase (SO F1) se sacó unos nombres
 * —`/sonidos/ui/click_01.webm`, con subcarpetas y en webm— y **tres fases más
 * tarde la SO F4 definió la biblioteca de verdad**: 46 archivos, planos y en
 * mp3, con duraciones, validador y el brief que Josué usa para producirlos. Los
 * dos catálogos convivieron sin hablarse.
 *
 * No saltó en ninguna fase porque no había ni un archivo: con la carpeta vacía,
 * dos sistemas de nombres incompatibles dan exactamente el mismo resultado
 * —silencio— que uno correcto. Lo destapó el primer MP3 real, `ui_click_01.mp3`,
 * el 2026-09-04: el motor seguía pidiendo un `.webm` que nadie iba a producir.
 *
 * 🚨 **Manda la SO F4**, y no es arbitrario: es la que tiene las 46 fichas, el
 * validador y el documento desde el que Josué está grabando. Los `id` NO se
 * tocan —viven en las preferencias guardadas de Josué— y sí las rutas.
 *
 * ⚠️ La correspondencia es a mano a propósito: son nueve, y cada una es una
 * decisión (`back_01` → el sonido de cerrar; `milestone_01` → el hito de 7 días,
 * que es el genérico). `scripts/test-audio.mjs` comprueba que **las nueve
 * apuntan a un archivo que la SO F4 declara**, así que no pueden volver a
 * separarse en silencio.
 */
/**
 * 🚨 **Los diez hitos de racha, que la SO F4 declara uno a uno.**
 *
 * *"El milestone de 7 días y el de 365 no pueden ser el mismo sonido más alto:
 * debe existir una evolución real de la identidad sonora."* (SO F3)
 *
 * Los diez comparten el evento `STREAK_MILESTONE` —misma categoría, misma
 * prioridad, mismo cooldown— y eso está bien. Lo que los separa no es el evento
 * sino **los días**, que son del momento y llegan por `contexto`.
 *
 * ⚠️ Los días están también en el catálogo de la SO F3. Es duplicación, y se
 * asume a conciencia: la alternativa era que `audio.js` importara
 * `audioEventos.js`, que ya importa `audio.js` — una dependencia circular a
 * cambio de no repetir diez números. `test-audio.mjs` comprueba que las dos
 * listas coinciden, así que separarse no es posible en silencio.
 */
export const HITOS_DE_RACHA = [3, 7, 14, 21, 30, 50, 75, 100, 180, 365].map((dias) => {
  const nn = String(dias).padStart(dias >= 100 ? 3 : 2, '0');
  return { dias, id: `hito_${nn}`, ruta: `/sonidos/streak_milestone_${nn}.mp3` };
});

/**
 * El hito que corresponde a una racha de `dias` días.
 *
 * ⚠️ Exacto si lo hay; si no, **el mayor por debajo**. Una racha de 200 días no
 * tiene hito propio, pero celebrarla con el de 180 es mejor que callarse — y
 * mucho mejor que celebrarla con el de 365, que aún no ha llegado.
 */
export function hitoDeRacha(dias) {
  const n = Number(dias);
  if (!Number.isFinite(n) || n <= 0) return null;
  const exacto = HITOS_DE_RACHA.find((h) => h.dias === n);
  if (exacto) return exacto;
  const menores = HITOS_DE_RACHA.filter((h) => h.dias < n);
  return menores.length > 0 ? menores[menores.length - 1] : null;
}

export const SONIDOS_SISTEMA = [
  crearSonido({ id: 'click_01', nombre: 'Toque', categoria: 'ui', ruta: '/sonidos/ui_click_01.mp3', variantes: ['/sonidos/ui_click_01.mp3', '/sonidos/ui_click_02.mp3', '/sonidos/ui_click_03.mp3'] }),
  crearSonido({ id: 'toggle_01', nombre: 'Interruptor (encender)', categoria: 'ui', ruta: '/sonidos/ui_toggle_on.mp3' }),
  crearSonido({ id: 'toggle_off_01', nombre: 'Interruptor (apagar)', categoria: 'ui', ruta: '/sonidos/ui_toggle_off.mp3' }),
  /* 🚨 Abrir tenía sonido de clic: el catálogo de la SO F3 mandaba `ui_open` a
     `UI_CLICK`, así que los dos archivos de abrir no se habrían oído nunca.
     Abrir un panel y pulsar un botón no son el mismo gesto. */
  crearSonido({ id: 'open_01', nombre: 'Abrir', categoria: 'ui', ruta: '/sonidos/ui_open_01.mp3', variantes: ['/sonidos/ui_open_01.mp3', '/sonidos/ui_open_02.mp3'] }),
  crearSonido({ id: 'back_01', nombre: 'Volver y cerrar', categoria: 'ui', ruta: '/sonidos/ui_close_01.mp3', variantes: ['/sonidos/ui_close_01.mp3', '/sonidos/ui_close_02.mp3'] }),
  crearSonido({ id: 'success_01', nombre: 'Hecho', categoria: 'feedback', ruta: '/sonidos/success_01.mp3', variantes: ['/sonidos/success_01.mp3', '/sonidos/success_02.mp3'] }),
  crearSonido({ id: 'save_01', nombre: 'Guardado', categoria: 'feedback', ruta: '/sonidos/save_01.mp3', variantes: ['/sonidos/save_01.mp3', '/sonidos/save_02.mp3'] }),
  crearSonido({ id: 'warning_01', nombre: 'Aviso', categoria: 'feedback', ruta: '/sonidos/warning.mp3' }),
  /* ⚠️ Estos apuntan a archivos que Josué todavía no ha grabado. No es fingir:
     el motor cae en silencio si el archivo no está (apartado 25), y así el día
     que aparezcan suenan sin tocar nada — que es justo lo que NO pasaba antes,
     cuando el sonido existía pero ningún evento podía elegirlo. */
  crearSonido({ id: 'task_01', nombre: 'Tarea hecha', categoria: 'feedback', ruta: '/sonidos/task_complete_01.mp3', variantes: ['/sonidos/task_complete_01.mp3', '/sonidos/task_complete_02.mp3'] }),
  crearSonido({ id: 'habito_01', nombre: 'Hábito hecho', categoria: 'feedback', ruta: '/sonidos/habit_complete_01.mp3', variantes: ['/sonidos/habit_complete_01.mp3', '/sonidos/habit_complete_02.mp3'] }),
  crearSonido({ id: 'progreso_01', nombre: 'Progreso de objetivo', categoria: 'feedback', ruta: '/sonidos/goal_progress_01.mp3', variantes: ['/sonidos/goal_progress_01.mp3', '/sonidos/goal_progress_02.mp3'] }),
  crearSonido({ id: 'inicio_racha_01', nombre: 'Racha empezada', categoria: 'streak', ruta: '/sonidos/streak_start.mp3' }),
  crearSonido({ id: 'racha_recuperada_01', nombre: 'Racha recuperada', categoria: 'streak', ruta: '/sonidos/streak_recovered.mp3' }),
  /* Los diez hitos salen de HITOS_DE_RACHA: escribirlos a mano seria la tercera
     copia de los mismos numeros. */
  ...HITOS_DE_RACHA.map((h) => crearSonido({ id: h.id, nombre: `Hito de ${h.dias} dias`, categoria: 'streak', ruta: h.ruta })),
  crearSonido({ id: 'insignia_01', nombre: 'Insignia', categoria: 'achievement', ruta: '/sonidos/badge_unlocked.mp3' }),
  crearSonido({ id: 'nivel_01', nombre: 'Subir de nivel', categoria: 'achievement', ruta: '/sonidos/level_up.mp3' }),
  /* 🚨 Los dos apuntaban a `achievement_01`, el logro genérico. Un objetivo
     completado y el logro más grande de la aplicación no pueden sonar igual que
     desbloquear cualquier cosa: la biblioteca los declara aparte. */
  crearSonido({ id: 'objetivo_01', nombre: 'Objetivo completado', categoria: 'achievement', ruta: '/sonidos/goal_complete.mp3' }),
  crearSonido({ id: 'gran_logro_01', nombre: 'Gran logro', categoria: 'achievement', ruta: '/sonidos/grand_achievement.mp3' }),
  crearSonido({ id: 'sync_01', nombre: 'Sincronizado', categoria: 'ui', ruta: '/sonidos/sync_complete.mp3' }),
  crearSonido({ id: 'sin_conexion_01', nombre: 'Sin conexión', categoria: 'notification', ruta: '/sonidos/connection_lost.mp3' }),
  crearSonido({ id: 'con_conexion_01', nombre: 'Conexión recuperada', categoria: 'notification', ruta: '/sonidos/connection_restored.mp3' }),
  crearSonido({ id: 'racha_riesgo_01', nombre: 'Racha en peligro', categoria: 'streak', ruta: '/sonidos/streak_at_risk.mp3' }),
  crearSonido({ id: 'error_01', nombre: 'Error', categoria: 'feedback', ruta: '/sonidos/error.mp3' }),
  crearSonido({ id: 'streak_01', nombre: 'Racha', categoria: 'streak', ruta: '/sonidos/streak_increment_01.mp3', variantes: ['/sonidos/streak_increment_01.mp3', '/sonidos/streak_increment_02.mp3', '/sonidos/streak_increment_03.mp3'] }),
  crearSonido({ id: 'milestone_01', nombre: 'Hito', categoria: 'streak', ruta: '/sonidos/streak_milestone_07.mp3' }),
  crearSonido({ id: 'record_01', nombre: 'Récord', categoria: 'achievement', ruta: '/sonidos/personal_record.mp3' }),
  crearSonido({ id: 'achievement_01', nombre: 'Logro', categoria: 'achievement', ruta: '/sonidos/achievement_unlocked.mp3' }),
];

export const sonidoDelSistema = (id) => SONIDOS_SISTEMA.find((s) => s.id === id) || null;

/** Apartado 21 — qué sonido corresponde a cada evento **de fábrica**. */
export const ASIGNACIONES_POR_DEFECTO = {
  UI_CLICK: 'click_01',
  UI_TOGGLE: 'toggle_01',
  UI_TOGGLE_OFF: 'toggle_off_01',
  UI_BACK: 'back_01',
  UI_OPEN: 'open_01',
  UI_SUCCESS: 'click_01',
  ACTION_COMPLETED: 'success_01',
  ACTION_ERROR: 'error_01',
  ACTION_WARNING: 'warning_01',
  ACTION_SAVED: 'save_01',
  TASK_COMPLETED: 'task_01',
  SYNC_COMPLETED: 'sync_01',
  CONNECTION_LOST: 'sin_conexion_01',
  CONNECTION_RESTORED: 'con_conexion_01',
  STREAK_AT_RISK: 'racha_riesgo_01',
  HABIT_COMPLETED: 'habito_01',
  GOAL_PROGRESS: 'progreso_01',
  STREAK_RECOVERED: 'racha_recuperada_01',
  SUCCESS: 'success_01',
  STREAK_STARTED: 'inicio_racha_01',
  STREAK_CONTINUED: 'streak_01',
  STREAK_MILESTONE: 'milestone_01',
  STREAK_BROKEN: 'error_01',
  NEW_RECORD: 'record_01',
  ACHIEVEMENT_UNLOCKED: 'achievement_01',
  BADGE_UNLOCKED: 'insignia_01',
  LEVEL_UP: 'nivel_01',
  MAJOR_GOAL_COMPLETED: 'gran_logro_01',
  TRAINING_COMPLETED: 'success_01',
  STUDY_COMPLETED: 'success_01',
  SLEEP_LOGGED: 'success_01',
  GOAL_COMPLETED: 'objetivo_01',
  SAVING_COMPLETED: 'success_01',
  CUSTOM: null,
};

/**
 * 🚨 **Los eventos que tienen sonido y todavía no los emite nadie, con el motivo.**
 *
 * Éste es EL fallo que se repitió toda la sesión del 2026-09-04: el archivo
 * existe, el motor sabe cuál es, y nada lo dispara. Un sonido sin emisor es tan
 * mudo como un archivo que falta, pero cuesta muchísimo más verlo — porque todo
 * lo demás está en su sitio.
 *
 * ⚠️ Ninguno de éstos es un olvido, y por eso están escritos. Emitirlos exigiría
 * **construir la función que no existe** —niveles, insignias, metas de ahorro—,
 * que es justo lo que prohíbe la regla 8: un sonido de "has subido de nivel" sin
 * niveles es un control decorativo con altavoz.
 *
 * `test-audio.mjs` comprueba que **todo evento con sonido está emitido o está
 * aquí**. Añadir uno nuevo y no conectarlo pone la suite en rojo: no se puede
 * volver a colar en silencio.
 */
export const SIN_EMISOR_TODAVIA = {
  // Alias que quedaron sueltos al dar evento propio a cada sonido (2026-09-04).
  SUCCESS: 'Genérico. Cada acción que sale bien tiene ya su evento propio (TASK, HABIT, GOAL, STUDY, SLEEP).',
  ACTION_COMPLETED: 'Genérico, mismo caso que SUCCESS. Se conserva porque el apartado 4 lo nombra.',
  UI_SUCCESS: 'Genérico de interfaz. `sync_complete` y `connection_restored` ya tienen el suyo.',
  ACTION_SAVED: '🚨 A propósito: guardar sale bien decenas de veces por sesión y un sonido en cada una, encima del clic, sería ruido. Solo se oye cuando FALLA.',

  // Funciones que no existen, y no se van a fingir.
  LEVEL_UP: 'No hay niveles: RA F3 decidió no construirlos (D2-02).',
  BADGE_UNLOCKED: 'No hay insignias separadas de los logros. Hoy todo logro es ACHIEVEMENT_UNLOCKED.',
  MAJOR_GOAL_COMPLETED: 'No hay objetivos "mayores": un objetivo se cumple o no, sin tamaño.',
  GOAL_PROGRESS: 'Un objetivo es `cumplido` sí o no. Sin porcentaje no hay progreso que anunciar.',
  ACTION_WARNING: 'No hay ningún aviso intermedio todavía: lo que puede ir mal, va mal del todo y suena a error.',

  // Aplazado por su propia fase, con fecha.
  STREAK_AT_RISK: '⚠️ "En riesgo" depende de la HORA, no del día, y RA F1 lo aplazó expresamente a RA F4 con el resto de estados visuales.',
};

/* ===========================================================================
   5 · PREFERENCIAS (apartados 7, 27 y 28)
   ===========================================================================
   *"Si soundEnabled = false, ningún evento debe producir sonido. No hagas
   comprobaciones independientes en cada componente. La decisión debe
   centralizarse."*

   Se guardan en `ajustes`, con el resto de la app, así que sincronizan solas
   (apartados 28 y 29: *"si el sistema de ajustes actual utiliza otra
   arquitectura, intégrate con ella"*). Ni clave nueva ni tabla nueva. */

export const DEFAULT_AUDIO = {
  activado: true,           // ✅ encendido desde el 2026-09-04 — abajo, por qué
  volumen: 80,
  vibracion: false,
  volumenes: Object.fromEntries(CATEGORIAS_SONIDO.map((c) => [c.id, c.porDefecto])),
  asignaciones: {},         // evento → id de sonido, si Josué lo cambia
  silenciadas: [],          // categorías apagadas del todo
};

/**
 * ✅ **De fábrica el sonido está ENCENDIDO, desde el 2026-09-04.**
 *
 * Estuvo apagado cinco fases, y por un motivo escrito aquí mismo: *"encenderlo
 * con una biblioteca que todavía no existe daría un interruptor que dice
 * 'Sonidos: sí' y no suena nunca — el control decorativo que prohíbe la regla
 * 8. Encenderlo se hará en la fase que traiga los archivos, y entonces será
 * verdad."*
 *
 * Los archivos llegaron: Josué produjo los 46 en FL Studio, el motor puede
 * reproducirlos todos y los toques de la interfaz están conectados. La condición
 * que se puso entonces se ha cumplido entera, así que se cumple la promesa.
 *
 * ⚠️ Y sigue siendo un interruptor de verdad: Ajustes → Sonido y respuesta lo
 * apaga, y con él apagado el evento **se sigue procesando** (SO F5). Encenderlo
 * de fábrica no es imponerlo, es que la primera vez que se abre la aplicación
 * responda — que era el objetivo desde el principio.
 */
export function normalizarAudio(guardado) {
  const g = guardado || {};
  const volumenes = {};
  for (const c of CATEGORIAS_SONIDO) {
    volumenes[c.id] = acotarVolumen(g.volumenes?.[c.id], c.porDefecto);
  }
  return {
    activado: !!g.activado,
    volumen: acotarVolumen(g.volumen, DEFAULT_AUDIO.volumen),
    vibracion: !!g.vibracion,
    volumenes,
    asignaciones: sanearAsignaciones(g.asignaciones),
    silenciadas: (Array.isArray(g.silenciadas) ? g.silenciadas : []).filter((id) => CATEGORIAS_SONIDO.some((c) => c.id === id)),
  };
}

/** 0-100 y entero. Un volumen de 250 o de -5 no significa nada. */
export function acotarVolumen(v, porDefecto = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/* Una asignación a un evento o a un sonido que no existen se descarta al
   cargar: es lo que impide que una copia vieja deje el motor apuntando al
   vacío. El fallback del apartado 25 la recogería igual, pero mejor no llegar. */
function sanearAsignaciones(guardadas) {
  const salida = {};
  for (const [evento, sonidoId] of Object.entries(guardadas || {})) {
    if (!EVENTOS_SONIDO[eventoCanonico(evento)]) continue;
    if (typeof sonidoId !== 'string' || !sonidoId) continue;
    salida[eventoCanonico(evento)] = sonidoId;
  }
  return salida;
}

/* ===========================================================================
   6 · EL VOLUMEN EFECTIVO (apartados 7 y 8)
   ===========================================================================
   General × categoría. Nada más: multiplicar tres factores haría que bajar la
   categoría al 50 con el general al 50 diera un 25 inaudible, y nadie espera
   eso de dos controles al 50.

   Devuelve 0-1, que es lo que quiere un `GainNode`. */
export function volumenEfectivo(prefs, categoria) {
  const p = normalizarAudio(prefs);
  if (!p.activado) return 0;
  const cat = categoriaSonido(categoria).id;
  if (p.silenciadas.includes(cat)) return 0;
  return (p.volumen / 100) * ((p.volumenes[cat] ?? 100) / 100);
}

/* ===========================================================================
   7 · RESOLVER QUÉ SONIDO SUENA (apartados 5, 24 y 25)
   ===========================================================================
   La cadena entera, con su fallback:

       asignación de Josué → asignación de fábrica → nada

   *"Si el sonido asignado no existe, está corrupto, no carga o fue eliminado, el
   sistema debe intentar un fallback. Si tampoco existe: silencio."* */
export function resolverSonido(prefs, tipo, { sonidosUsuario = [], contexto = {} } = {}) {
  const p = normalizarAudio(prefs);
  const evento = eventoCanonico(tipo);
  if (!EVENTOS_SONIDO[evento]) return null;

  const buscar = (id) => {
    if (!id) return null;
    return sonidosUsuario.find((s) => s.id === id) || sonidoDelSistema(id) || null;
  };

  /* 🚨 **El hito de 3 días y el de un año no pueden ser el mismo sonido.**
     La SO F3 lo dice con estas palabras: *"debe existir una evolución real de la
     identidad sonora"*. Pero los diez hitos comparten el evento
     `STREAK_MILESTONE` —y está bien que lo compartan: tienen la misma categoría,
     la misma prioridad y el mismo cooldown—, así que resolver solo por el evento
     los reducía a uno. Nueve archivos de la biblioteca eran inalcanzables.

     ⚠️ Lo que faltaba no era un evento por hito: era **el dato**. Un hito se
     distingue por los días, y los días son del momento, no del evento. Por eso
     entran por `contexto`, igual que `ahora` entra por parámetro en vez de
     leerse del reloj: así esto sigue siendo una función pura y se prueba sin
     inventarse una racha.

     Si el emisor no dice los días, se cae en la asignación normal en vez de
     callarse — el apartado 25 otra vez. */
  if (evento === 'STREAK_MILESTONE' && Number.isFinite(Number(contexto.dias))) {
    const hito = hitoDeRacha(Number(contexto.dias));
    if (hito) {
      const suyo = buscar(hito.id);
      if (suyo) return suyo;
    }
  }

  // Lo que Josué haya elegido manda; si ese sonido ya no está, se cae al de
  // fábrica en vez de callarse — que es lo que pide el apartado 25.
  return buscar(p.asignaciones[evento]) || buscar(ASIGNACIONES_POR_DEFECTO[evento]) || null;
}

/* ===========================================================================
   8 · COOLDOWN Y COLISIONES (apartados 10 y 11)
   ===========================================================================
   *"Si el usuario pulsa rápidamente un botón 20 veces: 20 eventos no deben
   convertirse necesariamente en 20 sonidos."* Y el 10: *"Nunca como una máquina
   tragaperras."*

   Se resuelve con dos reglas, y las dos son puras: el estado del que dependen
   entra y sale como parámetro, así que se pueden probar sin reloj y sin audio.

     COOLDOWN     — el mismo evento no se repite antes de su tiempo.
     COLISIÓN     — dentro de una ventana corta, suena **el más importante**, y
                    los demás se callan. Es lo que separa "elegante" de
                    "tragaperras": completar un entrenamiento puede disparar
                    ACTION_COMPLETED + STREAK_CONTINUED + SUCCESS a la vez, y
                    eso tiene que sonar UNA vez.
   =========================================================================== */

export const VENTANA_COLISION = 180;   // ms

export const ESTADO_AUDIO_INICIAL = { ultimos: {}, ultimaReproduccion: 0, ultimaPrioridad: -1, variantes: {} };

/**
 * ¿Suena este evento? Devuelve la decisión **y el estado nuevo**, sin mutar el
 * que recibe: así el motor no guarda nada por su cuenta y las pruebas pueden
 * pasar el reloj a mano.
 *
 * `motivo` no es decoración: sin él, depurar "por qué no ha sonado" sería
 * adivinar entre cinco causas distintas.
 */
export function decidirReproduccion(prefs, tipo, { ahora = Date.now(), estado = ESTADO_AUDIO_INICIAL, sonidosUsuario = [], contexto = {} } = {}) {
  const p = normalizarAudio(prefs);
  const evento = eventoCanonico(tipo);
  const def = EVENTOS_SONIDO[evento];
  const nuevo = {
    ultimos: { ...estado.ultimos },
    ultimaReproduccion: estado.ultimaReproduccion,
    ultimaPrioridad: estado.ultimaPrioridad,
    variantes: { ...(estado.variantes || {}) },
  };

  // Un evento que no existe **no rompe nada** (apartado 33). Se ignora y ya.
  if (!def) return { suena: false, motivo: 'evento_desconocido', estado: nuevo };
  if (!p.activado) return { suena: false, motivo: 'sonido_desactivado', estado: nuevo };

  const volumen = volumenEfectivo(p, def.categoria);
  if (volumen <= 0) return { suena: false, motivo: 'volumen_cero', estado: nuevo };

  const desdeElMismo = ahora - (estado.ultimos[evento] || 0);
  if (desdeElMismo < def.cooldown) return { suena: false, motivo: 'cooldown', estado: nuevo };

  // Colisión: dentro de la ventana, solo pasa algo MÁS importante que lo último
  // que sonó. Igual de importante tampoco: dos hitos a la vez son un hito.
  const prioridad = PRIORIDADES_SONIDO[def.prioridad] ?? PRIORIDADES_SONIDO.NORMAL;
  const desdeElUltimo = ahora - estado.ultimaReproduccion;
  if (desdeElUltimo < VENTANA_COLISION && prioridad <= estado.ultimaPrioridad) {
    return { suena: false, motivo: 'colision', estado: nuevo };
  }

  const elegido = resolverSonido(p, evento, { sonidosUsuario, contexto });
  // Si no hay sonido asignado no es un error — es el "silencio" del apartado 25,
  // y el 26 exige que no rompa nada.
  if (!elegido) return { suena: false, motivo: 'sin_sonido_asignado', estado: nuevo };

  /* 🚨 **La rotación de variantes** (SO F4). Un sonido con tres versiones va
     alternando 1 → 2 → 3 → 1: lo que cansa de un clic oído doscientas veces al
     día es la repetición idéntica, no el clic.

     ⚠️ Se rota en orden y no al azar, por dos motivos: el azar repite —tres
     veces seguidas la misma no es raro— y además no se puede probar sin
     inyectar un generador. El turno vive en el mismo `estado` que ya viajaba de
     forma pura, así que esto sigue sin guardar nada por su cuenta. */
  const turno = nuevo.variantes[elegido.id] || 0;
  const lista = elegido.variantes && elegido.variantes.length > 0 ? elegido.variantes : [elegido.ruta];
  const sonido = { ...elegido, ruta: lista[turno % lista.length] };
  if (lista.length > 1) nuevo.variantes[elegido.id] = (turno + 1) % lista.length;

  nuevo.ultimos[evento] = ahora;
  nuevo.ultimaReproduccion = ahora;
  nuevo.ultimaPrioridad = prioridad;
  return { suena: true, motivo: 'ok', sonido, volumen, categoria: def.categoria, prioridad: def.prioridad, estado: nuevo };
}

/* ===========================================================================
   9 · PRECARGA (apartado 17)
   ===========================================================================
   *"No cargues todos los sonidos de la aplicación al abrirla. Los sonidos
   críticos pueden precargarse. Los secundarios, bajo demanda."*

   Críticos = los que tienen que sonar **en el mismo instante** del gesto. Un
   clic que suena 200 ms tarde se siente roto; un logro que tarda 200 ms, no.
   Por eso los de interfaz y confirmación se precargan y los demás no. */
export const CATEGORIAS_PRECARGA = ['ui', 'feedback'];

export function sonidosAPrecargar(prefs, { sonidosUsuario = [] } = {}) {
  const p = normalizarAudio(prefs);
  if (!p.activado) return [];   // apagado no se descarga nada (apartado 18)
  const vistos = new Set();
  const salida = [];
  for (const [evento, def] of Object.entries(EVENTOS_SONIDO)) {
    if (!CATEGORIAS_PRECARGA.includes(def.categoria)) continue;
    if (volumenEfectivo(p, def.categoria) <= 0) continue;
    const s = resolverSonido(p, evento, { sonidosUsuario });
    if (s && !vistos.has(s.id)) { vistos.add(s.id); salida.push(s); }
  }
  return salida;
}

/* ===========================================================================
   10 · LO QUE VALIDARÁ LA SUBIDA (apartado 37)
   ===========================================================================
   *"Cuando posteriormente se implemente subida de archivos deberán validarse
   tipo MIME, extensión, tamaño, duración, usuario propietario. NO confíes
   únicamente en la extensión del archivo. No implementes todavía todo el upload,
   pero deja documentados estos requisitos."*

   Documentados **y en código**, que es más difícil de ignorar que un comentario.
   La subida es de otra fase; la regla ya se puede llamar. */

export const FORMATOS_SONIDO = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'];
export const MAX_TAMANO_SONIDO = 1024 * 1024;   // 1 MB
export const MAX_DURACION_SONIDO = 10;          // segundos

export function validarSonidoSubido(archivo, { duracion = 0 } = {}) {
  if (!archivo) return { ok: false, motivo: 'No hay archivo.' };
  // El MIME primero, porque la extensión la pone quien quiera: un `.mp3` puede
  // ser cualquier cosa. Es literalmente lo que avisa el apartado 37.
  if (!FORMATOS_SONIDO.includes(archivo.type)) return { ok: false, motivo: 'Ese tipo de archivo no es un sonido admitido.' };
  if (!/\.(webm|ogg|mp3|m4a|wav)$/i.test(archivo.name || '')) return { ok: false, motivo: 'La extensión no coincide con un sonido.' };
  if (archivo.size > MAX_TAMANO_SONIDO) return { ok: false, motivo: 'El sonido pesa más de 1 MB.' };
  if (duracion > MAX_DURACION_SONIDO) return { ok: false, motivo: 'El sonido dura más de 10 segundos.' };
  return { ok: true };
}

/* ===========================================================================
   11 · LO QUE EL MOTOR **NO** DECIDE (apartado 35)
   ===========================================================================
   *"El sonido nunca debe ser la única forma de comunicar algo."*

   Esto no se puede imponer desde aquí: se impone **no dándole al motor ninguna
   forma de suprimir la interfaz**. `decidirReproduccion` devuelve si suena, y
   nada más; ninguna pantalla del proyecto condiciona su feedback visual a que
   haya sonado, y la celebración de RA F4 se ve igual con el sonido apagado.

   Hay una prueba que comprueba que la decisión no lleva ningún campo que
   pudiera usarse para eso. */
export const describirDecision = (d) => ({ suena: !!d?.suena, motivo: d?.motivo || 'desconocido' });
