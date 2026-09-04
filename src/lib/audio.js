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
  UI_BACK: { categoria: 'ui', prioridad: 'LOW', cooldown: 60 },
  UI_SUCCESS: { categoria: 'ui', prioridad: 'LOW', cooldown: 120 },

  // Confirmaciones.
  ACTION_COMPLETED: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  ACTION_ERROR: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },
  SUCCESS: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 300 },

  // Rachas.
  STREAK_STARTED: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 1000 },
  STREAK_CONTINUED: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 1000 },
  STREAK_MILESTONE: { categoria: 'streak', prioridad: 'HIGH', cooldown: 2000 },
  STREAK_BROKEN: { categoria: 'streak', prioridad: 'NORMAL', cooldown: 2000 },

  // Lo verdaderamente especial (apartado 13). Se reserva, y por eso lleva el
  // cooldown más largo: un récord que sonara dos veces dejaría de ser un récord.
  NEW_RECORD: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  ACHIEVEMENT_UNLOCKED: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  MAJOR_GOAL_COMPLETED: { categoria: 'achievement', prioridad: 'CRITICAL', cooldown: 3000 },

  // Preparados y **sin conectar** (apartado 4: *"no conectes todavía todos los
  // módulos"*). Existen en el catálogo para que añadir el módulo sea emitir,
  // no editar esto.
  TRAINING_COMPLETED: { categoria: 'training', prioridad: 'NORMAL', cooldown: 1000 },
  STUDY_COMPLETED: { categoria: 'training', prioridad: 'NORMAL', cooldown: 1000 },
  SLEEP_LOGGED: { categoria: 'feedback', prioridad: 'LOW', cooldown: 1000 },
  GOAL_COMPLETED: { categoria: 'achievement', prioridad: 'HIGH', cooldown: 3000 },
  SAVING_COMPLETED: { categoria: 'feedback', prioridad: 'NORMAL', cooldown: 1000 },
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
export const SONIDOS_SISTEMA = [
  crearSonido({ id: 'click_01', nombre: 'Toque', categoria: 'ui', ruta: '/sonidos/ui_click_01.mp3', variantes: ['/sonidos/ui_click_01.mp3', '/sonidos/ui_click_02.mp3', '/sonidos/ui_click_03.mp3'] }),
  crearSonido({ id: 'toggle_01', nombre: 'Interruptor', categoria: 'ui', ruta: '/sonidos/ui_toggle_on.mp3' }),
  crearSonido({ id: 'back_01', nombre: 'Volver', categoria: 'ui', ruta: '/sonidos/ui_close_01.mp3' }),
  crearSonido({ id: 'success_01', nombre: 'Hecho', categoria: 'feedback', ruta: '/sonidos/success_01.mp3' }),
  crearSonido({ id: 'error_01', nombre: 'Error', categoria: 'feedback', ruta: '/sonidos/error.mp3' }),
  crearSonido({ id: 'streak_01', nombre: 'Racha', categoria: 'streak', ruta: '/sonidos/streak_increment_01.mp3' }),
  crearSonido({ id: 'milestone_01', nombre: 'Hito', categoria: 'streak', ruta: '/sonidos/streak_milestone_07.mp3' }),
  crearSonido({ id: 'record_01', nombre: 'Récord', categoria: 'achievement', ruta: '/sonidos/personal_record.mp3' }),
  crearSonido({ id: 'achievement_01', nombre: 'Logro', categoria: 'achievement', ruta: '/sonidos/achievement_unlocked.mp3' }),
];

export const sonidoDelSistema = (id) => SONIDOS_SISTEMA.find((s) => s.id === id) || null;

/** Apartado 21 — qué sonido corresponde a cada evento **de fábrica**. */
export const ASIGNACIONES_POR_DEFECTO = {
  UI_CLICK: 'click_01',
  UI_TOGGLE: 'toggle_01',
  UI_BACK: 'back_01',
  UI_SUCCESS: 'click_01',
  ACTION_COMPLETED: 'success_01',
  ACTION_ERROR: 'error_01',
  SUCCESS: 'success_01',
  STREAK_STARTED: 'streak_01',
  STREAK_CONTINUED: 'streak_01',
  STREAK_MILESTONE: 'milestone_01',
  STREAK_BROKEN: 'error_01',
  NEW_RECORD: 'record_01',
  ACHIEVEMENT_UNLOCKED: 'achievement_01',
  MAJOR_GOAL_COMPLETED: 'achievement_01',
  TRAINING_COMPLETED: 'success_01',
  STUDY_COMPLETED: 'success_01',
  SLEEP_LOGGED: 'success_01',
  GOAL_COMPLETED: 'achievement_01',
  SAVING_COMPLETED: 'success_01',
  CUSTOM: null,
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
  activado: false,          // ⚠️ apagado de fábrica — abajo se explica por qué
  volumen: 80,
  vibracion: false,
  volumenes: Object.fromEntries(CATEGORIAS_SONIDO.map((c) => [c.id, c.porDefecto])),
  asignaciones: {},         // evento → id de sonido, si Josué lo cambia
  silenciadas: [],          // categorías apagadas del todo
};

/**
 * ⚠️ **De fábrica el sonido está APAGADO, y es deliberado.**
 *
 * Encenderlo con una biblioteca que todavía no existe daría un interruptor que
 * dice "Sonidos: sí" y no suena nunca — el control decorativo que prohíbe la
 * regla 8. Encenderlo se hará en la fase que traiga los archivos, y entonces
 * será verdad.
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
export function resolverSonido(prefs, tipo, { sonidosUsuario = [] } = {}) {
  const p = normalizarAudio(prefs);
  const evento = eventoCanonico(tipo);
  if (!EVENTOS_SONIDO[evento]) return null;

  const buscar = (id) => {
    if (!id) return null;
    return sonidosUsuario.find((s) => s.id === id) || sonidoDelSistema(id) || null;
  };

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
export function decidirReproduccion(prefs, tipo, { ahora = Date.now(), estado = ESTADO_AUDIO_INICIAL, sonidosUsuario = [] } = {}) {
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

  const elegido = resolverSonido(p, evento, { sonidosUsuario });
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
