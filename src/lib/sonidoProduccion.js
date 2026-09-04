// ============================================================================
// SO · Fase 5/5 — PRODUCCIÓN, INTEGRACIÓN Y TEST FINAL
//
// *"Convertir toda la especificación de las fases anteriores en un sistema de
// audio real, organizado, optimizado y preparado para producción."*
//
// ── LO PRIMERO, PORQUE CAMBIA CÓMO SE LEE TODO LO DEMÁS ────────────────────
//
// ⏸ **Sigue sin haber ni un archivo de audio en el proyecto.** La SO F2 —la
// biblioteca— está bloqueada esperando a que Josué los dé *"cuando la web ya
// tenga todos los botones activos"*, y esta fase **no puede desbloquearla**.
//
// Pero de los cuarenta y ocho apartados de esta fase, **la mayoría no necesitan
// los archivos**: los perfiles, el cálculo del volumen, los grupos de precarga,
// el fallback por familia, la separación entre sonido y vibración, el modo
// silencioso, la pantalla de Ajustes y casi toda la batería de pruebas. Todo eso
// **sí se construye**, y el día que los archivos aparezcan en `public/sonidos/`
// **suena sin tocar una línea**.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 EL MOTOR NO SE REESCRIBE.** La SO F1 construyó `audioEngine.js` y
// `audio.js` con la cola, el cooldown, las prioridades y la resolución de
// sonidos. El apartado 2 de esta fase propone una estructura de carpetas
// distinta —`src/audio/engine/…`— y **no se adopta**: mover un motor que
// funciona para que el árbol se parezca a un dibujo es exactamente el *"cambio
// de arquitectura innecesario"* que el proyecto lleva 65 fases evitando. Se dice
// aquí, con su motivo, en vez de hacerlo callando.
//
// **2. ⚠️ EL VOLUMEN SE MULTIPLICA, NO SE SUSTITUYE** (apartado 23: *"master ×
// category × event"*). La SO F1 ya multiplicaba maestro por categoría; esta fase
// añade **el del evento**, que es lo que permite que un `ui_click` suene por
// debajo de un `level_up` sin tocar los archivos.
//
// **3. ⚠️ LOS PERFILES NO SON UN SEXTO SISTEMA** (apartado 25). Un perfil es
// **un atajo que escribe las preferencias que ya existen**: no guarda nada
// aparte, no compite con los interruptores, y en cuanto tocas uno a mano pasas a
// `personalizado`. Sin eso serían dos verdades sobre el mismo ajuste.
//
// **4. 🚨 SILENCIO NO ES "NO PASA NADA"** (apartado 21). Con el sonido apagado el
// motor **sigue procesando el evento**: la interfaz enseña el milestone, la racha
// se actualiza y el logro se guarda. Lo único que no ocurre es el audio. Y la
// vibración es **otro interruptor** (apartado 22): sonido apagado + vibración
// encendida tiene que funcionar.
//
// **5. ⚠️ Y LOS TESTS DE MÓVIL SON DE JOSUÉ.** Los apartados 42 a 46 —iPhone,
// auriculares, llamada entrante, bloqueo de pantalla, cien eventos seguidos— no
// se simulan desde aquí. Van a **R1** con su motivo, como en la EH F47, F51, F62
// y F64.
// ============================================================================

import {
  CATEGORIAS_SONIDO, categoriaSonido, EVENTOS_SONIDO, definicionEvento, eventoCanonico,
  PRIORIDADES_SONIDO, DEFAULT_AUDIO, normalizarAudio, acotarVolumen, volumenEfectivo,
  resolverSonido, decidirReproduccion, VENTANA_COLISION,
} from './audio';
import { CATALOGO, definicion as definicionCatalogo, NIVELES } from './audioEventos';
import { FAMILIAS, familia, ARCHIVOS, fichaDe, listaDeArchivos, queFalta } from './especificacionSonidos';

/* ===========================================================================
   1 · LA ESTRUCTURA QUE HAY, Y LA QUE NO SE ADOPTA (apartado 2) — decisión 1
   =========================================================================== */

export const ESTRUCTURA_REAL = {
  motor: 'src/lib/audioEngine.js',
  configuracion: 'src/lib/audio.js',
  catalogo: 'src/lib/audioEventos.js',
  biblioteca: 'src/lib/especificacionSonidos.js',
  produccion: 'src/lib/sonidoProduccion.js',
  archivos: 'public/sonidos/',
};

export const ESTRUCTURA_PROPUESTA_NO_ADOPTADA = {
  que: 'La del apartado 2: `src/audio/engine/`, `src/audio/config/`, `src/audio/hooks/`, `src/audio/assets/`.',
  /* 🚨 Decisión 1 — se dice por qué no, en vez de hacerlo callando. */
  porque: 'El motor ya existe, funciona y está probado desde la SO F1. Moverlo de carpeta para que el árbol se parezca a un dibujo es un cambio de arquitectura sin ninguna ganancia, y el riesgo de romper el audio de toda la aplicación es real.',
  loQueSiSeCumple: 'Lo que el apartado quiere de verdad: **los sonidos no están dispersos por los módulos**. Todo el audio vive en cuatro archivos de `src/lib/`, y ninguna pantalla hace `new Audio(...)`.',
};

/** 🚨 Apartado 9 y 12 — ninguna pantalla toca el audio directamente. */
export const PROHIBIDO_EN_PANTALLAS = /new Audio\s*\(|\.play\s*\(\s*\)/;

export function pantallasQueTocanElAudio(fuentes = {}) {
  return Object.entries(fuentes)
    .filter(([, texto]) => PROHIBIDO_EN_PANTALLAS.test(String(texto || '')))
    .map(([nombre]) => nombre);
}

/* ===========================================================================
   2 · LOS PERFILES (apartado 25) — decisión 3
   ===========================================================================
   *"SILENCIOSO · EQUILIBRADO · INMERSIVO · PERSONALIZADO."* */

export const PERFILES = [
  {
    id: 'silencioso', icono: '🔇', nombre: 'Silencioso',
    que: 'Todo apagado.',
    prefs: { activado: false, silenciadas: CATEGORIAS_SONIDO.map((c) => c.id) },
  },
  {
    id: 'equilibrado', icono: '🎚️', nombre: 'Equilibrado',
    que: 'Lo recomendado: se oye lo que importa y no molesta lo de siempre.',
    /* ⚠️ La interfaz callada es lo que hace que el resto no canse. */
    prefs: { activado: true, silenciadas: ['ui'], volumen: 70 },
  },
  {
    id: 'inmersivo', icono: '🔊', nombre: 'Inmersivo',
    que: 'Todos los sonidos importantes activos.',
    prefs: { activado: true, silenciadas: [], volumen: 90 },
  },
  {
    /* ⚠️ No es un preajuste: es **dónde acabas** en cuanto tocas algo a mano. */
    id: 'personalizado', icono: '🎛️', nombre: 'Personalizado',
    que: 'Lo que tú hayas puesto.',
    prefs: null,
  },
];

export const perfilSonido = (id) => PERFILES.find((p) => p.id === id) || null;

/** Aplica un perfil **escribiendo las preferencias que ya existen** (decisión 3). */
export function aplicarPerfil(prefs, id) {
  const p = perfilSonido(id);
  const base = normalizarAudio(prefs);
  if (!p || !p.prefs) return base;
  return normalizarAudio({ ...base, ...p.prefs });
}

/**
 * ⚠️ Y al revés: **qué perfil tienes puesto** se deduce de tus preferencias, no
 * se guarda. Un perfil guardado aparte se desincroniza en cuanto tocas un
 * interruptor, y entonces la pantalla dice "Equilibrado" mientras suena otra cosa.
 */
export function perfilActual(prefs) {
  const p = normalizarAudio(prefs);
  const iguales = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
  const encontrado = PERFILES.filter((x) => x.prefs).find((x) => (
    x.prefs.activado === p.activado
    && iguales(x.prefs.silenciadas, p.silenciadas)
    && (x.prefs.volumen === undefined || x.prefs.volumen === p.volumen)
  ));
  return encontrado ? encontrado.id : 'personalizado';
}

/* ===========================================================================
   3 · EL VOLUMEN: MAESTRO × CATEGORÍA × EVENTO (apartado 23) — decisión 2
   =========================================================================== */

/* ⚠️ El peso de cada evento, por su nivel de intensidad (SO F3, escala 0-5). Un
   clic de interfaz no puede sonar igual de fuerte que un récord. */
export const PESO_POR_INTENSIDAD = [0.55, 0.7, 0.8, 0.9, 1, 1];

export function pesoDeEvento(tipo) {
  const canon = eventoCanonico(tipo);
  /* ⚠️ El catálogo de la SO F3 va por nombre de sonido y apunta al evento del
     motor. Aquí se llega desde el evento del motor, así que se busca al revés. */
  const entrada = Object.values(CATALOGO).find((c) => c.motor === canon);
  const nivel = Number.isFinite(entrada?.nivel) ? entrada.nivel : 2;
  return PESO_POR_INTENSIDAD[Math.max(0, Math.min(PESO_POR_INTENSIDAD.length - 1, nivel))];
}

/**
 * 🚨 Apartado 23 — **master × category × event**, en 0-1. Y nunca se toca el
 * archivo original: esto es lo que se le pasa al reproductor.
 */
export function volumenFinal(prefs, tipo) {
  const porCategoria = volumenEfectivo(normalizarAudio(prefs), definicionEvento(tipo)?.categoria || 'feedback');
  const v = porCategoria * pesoDeEvento(tipo);
  return Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
}

/* ===========================================================================
   4 · LOS GRUPOS DE PRECARGA (apartados 7 y 8)
   ===========================================================================
   *"GRUPO A frecuente · GRUPO B moderado · GRUPO C eventos raros."* */

export const GRUPOS_PRECARGA = [
  {
    id: 'A', nombre: 'Uso frecuente', cuando: 'Se precargan al arrancar.',
    categorias: ['ui', 'feedback'],
  },
  {
    id: 'B', nombre: 'Uso moderado', cuando: 'Se cargan rápido cuando hacen falta.',
    categorias: ['progress', 'reward', 'streak'],
  },
  {
    id: 'C', nombre: 'Eventos raros', cuando: 'Solo bajo demanda.',
    categorias: ['achievement', 'system'],
    /* ⚠️ Y los milestones grandes, que pueden sonar una vez al año. */
    tambien: ['STREAK_MILESTONE_100', 'STREAK_MILESTONE_180', 'STREAK_MILESTONE_365', 'GRAND_ACHIEVEMENT'],
  },
];

export const grupoPrecarga = (id) => GRUPOS_PRECARGA.find((g) => g.id === id) || null;

export function grupoDe(tipo) {
  const canon = eventoCanonico(tipo);
  const conNombre = GRUPOS_PRECARGA.find((g) => (g.tambien || []).includes(canon));
  if (conNombre) return conNombre.id;
  const cat = definicionEvento(canon)?.categoria;
  return GRUPOS_PRECARGA.find((g) => g.categorias.includes(cat))?.id || 'B';
}

/* ===========================================================================
   5 · EL FALLBACK POR FAMILIA (apartado 31)
   ===========================================================================
   *"Si un sonido no está disponible: fallback family sound."* */

/* ⚠️ Uno por familia de la SO F4, **las ocho**. Y son ids de archivos que
   existen en `ARCHIVOS`, no nombres inventados: un fallback que apunta a un
   archivo que tampoco está no es un fallback, es el mismo silencio con otro
   nombre. */
export const FALLBACK_POR_FAMILIA = {
  ui: 'ui_click',
  feedback: 'success',
  progress: 'task_complete',
  reward: 'level_up',
  streak: 'streak_increment',
  achievement: 'achievement_unlocked',
  warning: 'warning',
  system: 'sync_complete',
};

/**
 * ⚠️ Devuelve el archivo que suena, o **el de su familia**, o `null`.
 * Y `null` no es un error: es *"no hay nada que sonar"*, que es el estado de hoy
 * y por eso la aplicación no se rompe (apartado 30).
 */
export function conFallback(idArchivo, { disponibles = [] } = {}) {
  if (disponibles.includes(idArchivo)) return { archivo: idArchivo, esFallback: false };
  const ficha = fichaDe(String(idArchivo || '').replace(/_d+$/, ''));
  const familia = ficha?.familia || String(idArchivo || '').split('_')[0];
  const suplente = FALLBACK_POR_FAMILIA[familia];
  if (suplente && disponibles.includes(suplente)) return { archivo: suplente, esFallback: true };
  return { archivo: null, esFallback: false, porque: 'no_disponible' };
}

/* ===========================================================================
   6 · LAS SECUENCIAS (apartado 17)
   ===========================================================================
   *"LEVEL UP → impact → ascending tone → resolution. El motor debe tratarlo como
   un único acontecimiento, no como tres sonidos independientes."* */

export const SECUENCIAS = [
  { id: 'LEVEL_UP', partes: ['impacto', 'ascenso', 'resolucion'], comoUno: true },
  { id: 'GRAND_ACHIEVEMENT', partes: ['impacto', 'coro', 'resolucion'], comoUno: true },
  { id: 'PERSONAL_RECORD', partes: ['impacto', 'resolucion'], comoUno: true },
];

export const secuencia = (id) => SECUENCIAS.find((s) => s.id === eventoCanonico(id)) || null;
export const esSecuencia = (id) => !!secuencia(id);

/** ⚠️ Y se cancela, se sube de volumen y se prioriza **como uno solo**. */
export const REGLA_SECUENCIA = 'Una secuencia es un evento, no tres. Se cancela entera, se le aplica un volumen y compite con una sola prioridad.';

/* ===========================================================================
   7 · SILENCIO Y VIBRACIÓN (apartados 21 y 22) — 🚨 decisión 4
   =========================================================================== */

export const MODO_SILENCIOSO = {
  audio: 'No se reproduce.',
  /* 🚨 Y esto es lo que el apartado 21 subraya. */
  evento: 'SÍ se procesa: la gamificación actualiza, la racha sube y la interfaz enseña el milestone.',
  regla: 'No se elimina el evento porque el sonido esté desactivado.',
};

export const HAPTICS = {
  separado: true,
  porque: 'El usuario puede querer sonido apagado y vibración encendida. Son dos interruptores, no uno.',
  interruptor: 'vibracion',
  /* ⚠️ Y con lo que hay de verdad: `navigator.vibrate`, que en iOS no existe. */
  soporte: 'navigator.vibrate — no existe en iOS Safari, así que allí no vibra y no pasa nada.',
};

export const PATRONES_VIBRACION = [
  { id: 'suave', ms: [10], para: ['ui'] },
  { id: 'normal', ms: [20], para: ['feedback', 'progress'] },
  { id: 'doble', ms: [15, 40, 15], para: ['reward', 'streak'] },
  { id: 'fuerte', ms: [30, 60, 30], para: ['achievement'] },
];

export function patronDe(tipo) {
  const cat = definicionEvento(tipo)?.categoria || 'feedback';
  return PATRONES_VIBRACION.find((p) => p.para.includes(cat)) || PATRONES_VIBRACION[1];
}

/**
 * 🚨 Decisión 4 — qué pasa con un evento según los dos interruptores. **El
 * evento se procesa siempre**: lo que cambia es si suena y si vibra.
 */
export function queHaceElEvento(prefs, tipo) {
  const p = normalizarAudio(prefs);
  const d = decidirReproduccion(p, tipo);
  return {
    procesaElEvento: true,
    suena: !!d.suena,
    vibra: p.vibracion === true,
    patron: p.vibracion ? patronDe(tipo).id : null,
    motivo: d.motivo,
  };
}

/* ===========================================================================
   8 · LA PANTALLA DE AJUSTES (apartados 24, 26, 27 y 28)
   ===========================================================================
   *"Sonido y respuesta: 🔊 Sonidos · 🔉 Volumen · 🎛 Perfil · 🔥 racha ·
   🏆 recompensas · ✨ interfaz · 📳 Vibración."* */

export const PANTALLA_SONIDO = {
  titulo: 'Sonido y respuesta',
  sub: 'Qué suena, cuánto y cuándo vibra.',
};

export const CONTROLES = [
  { id: 'activado', icono: '🔊', etiqueta: 'Sonidos', tipo: 'interruptor' },
  { id: 'volumen', icono: '🔉', etiqueta: 'Volumen', tipo: 'deslizante' },
  { id: 'perfil', icono: '🎛', etiqueta: 'Perfil', tipo: 'opciones' },
  { id: 'streak', icono: '🔥', etiqueta: 'Sonidos de racha', tipo: 'interruptor', categoria: 'streak' },
  { id: 'reward', icono: '🏆', etiqueta: 'Sonidos de recompensas', tipo: 'interruptor', categoria: 'reward' },
  { id: 'ui', icono: '✨', etiqueta: 'Sonidos de interfaz', tipo: 'interruptor', categoria: 'ui' },
  { id: 'vibracion', icono: '📳', etiqueta: 'Vibración', tipo: 'interruptor' },
];

export const control = (id) => CONTROLES.find((c) => c.id === id) || null;

/** Apartado 27 — las marcas del deslizante, sin números encima todo el rato. */
export const MARCAS_VOLUMEN = [0, 25, 50, 75, 100];

/**
 * ⚠️ Apartado 26 — *"el botón debe reproducir exactamente el sonido que
 * utilizaría el sistema. No crear un sonido diferente solamente para la pantalla
 * de ajustes."*
 */
export const EJEMPLOS_PARA_ESCUCHAR = {
  ui: 'UI_CLICK',
  feedback: 'SUCCESS',
  progress: 'TASK_COMPLETE',
  reward: 'LEVEL_UP',
  streak: 'STREAK_MILESTONE',
  achievement: 'ACHIEVEMENT_UNLOCKED',
  system: 'SYNC_COMPLETE',
};

export const ejemploDe = (categoria) => EJEMPLOS_PARA_ESCUCHAR[categoria] || null;

/** 🚨 Apartado 28 — y ningún control comunica su estado solo con el sonido. */
export const ACCESIBILIDAD_CONTROLES = {
  regla: 'Nunca depender del sonido para saber si un control está encendido. El interruptor se ve y se lee.',
  cadaControl: ['etiqueta', 'estado', 'feedback visual', 'lector de pantalla', 'área táctil'],
};

/* ===========================================================================
   9 · ARRANQUE, ERRORES Y TELEMETRÍA (apartados 29, 30 y 32)
   =========================================================================== */

export const PRIMERA_INTERACCION = {
  regla: 'Al abrir la aplicación NO se intenta reproducir nada. El contexto de audio se crea con el primer toque.',
  donde: 'audioEngine.js · desbloquear()',
  porque: 'Los navegadores lo bloquean, y forzarlo deja el contexto en un estado raro del que no se sale.',
};

export const ANTE_UN_ERROR = {
  regla: 'Si la reproducción falla: se anota y la aplicación sigue. Nunca una pantalla en blanco por un sonido.',
  donde: 'audioEngine.js · anotar() y fallosDeAudio()',
};

export const TELEMETRIA = {
  existe: false,
  porque: 'JosStyle no tiene analítica (EH F43). No hay dónde registrar nada.',
  siAlgunDia: 'Solo lo técnico: qué evento, si sonó o falló y qué versión del sonido. Nunca nada personal.',
};

/* ===========================================================================
   10 · LA BATERÍA DE PRUEBAS (apartados 33 a 41)
   =========================================================================== */

export const PRUEBAS_MOTOR = [
  { id: 'play', que: 'play()', donde: 'decidirReproduccion() + reproducir()' },
  { id: 'stop', que: 'stop() y stopAll()', donde: 'audioEngine · detener()' },
  { id: 'volume', que: 'volume()', donde: 'volumenFinal()' },
  { id: 'cooldown', que: 'cooldown()', donde: `decidirReproduccion() · ventana de ${VENTANA_COLISION} ms` },
  { id: 'priority', que: 'priority()', donde: 'PRIORIDADES_SONIDO + el dominante de SO F3' },
  { id: 'queue', que: 'queue()', donde: 'audioEngine · la cola de SO F1' },
  { id: 'fallback', que: 'fallback()', donde: 'conFallback()' },
  { id: 'disabled', que: 'disabled()', donde: 'queHaceElEvento()' },
];

/* 🚨 Decisión 5 — lo que necesita un teléfono. */
export const PRUEBAS_DE_JOSUE = [
  { apartado: 42, que: 'iPhone Safari, PWA de iOS y Chrome Android', porque: 'La primera interacción y la suspensión se comportan distinto en cada uno.' },
  { apartado: 43, que: 'Altavoz, AirPods y auriculares con cable', porque: 'Hay que enchufarlos.' },
  { apartado: 44, que: 'Una llamada, una notificación o el bloqueo en mitad de un sonido', porque: 'El contexto de audio se suspende de verdad, y eso no se simula.' },
  { apartado: 45, que: 'Volver a la aplicación después de suspenderla', porque: 'Igual.' },
  { apartado: 46, que: 'Cien eventos en pocos segundos, midiendo memoria y CPU', porque: 'Se puede simular la cola, pero no lo que hace el teléfono con ella.' },
];

/* ===========================================================================
   11 · ⏸ LO QUE SIGUE BLOQUEADO
   =========================================================================== */

export const BLOQUEADO_POR_LOS_ARCHIVOS = {
  fase: 'SO F2 — la biblioteca de sonidos',
  que: 'No hay ni un archivo de audio en `public/sonidos/`.',
  loDijoJosue: 'Los dará "cuando la web ya tenga todos los botones activos".',
  /* ⚠️ Y lo que pasa mientras tanto, dicho sin adornos. */
  mientrasTanto: 'HOY NO SUENA NADA. El interruptor de sonido nace apagado desde la SO F1 justo para que no sea un control decorativo.',
  elDiaQue: 'Cuando estén en `public/sonidos/` con los nombres de la SO F4, suenan sin tocar una línea: el motor ya los busca ahí.',
};

/* 🚨 Cuántos faltan **de los que hay de verdad**. Antes era `queFalta([])` fijo:
   decía "faltan 46" aunque hubiera archivos en la carpeta, porque nadie se la
   pasaba. El 2026-09-04 apareció el primero (`ui_click_01.mp3`) y la cuenta
   siguió diciendo 46. Ahora se le pasan los que hay; este módulo vive en el
   navegador y no puede leer el disco, así que quien los lista es quien puede:
   el test, con `readdirSync`. */
export const cuantosArchivosFaltan = (presentes = []) => queFalta(presentes).faltan.length;

/* ===========================================================================
   12 · LOS APARTADOS
   =========================================================================== */

export const APARTADOS_SO5 = [
  { id: 2, nombre: 'Estructura de archivos', estado: 'adaptado', donde: 'ESTRUCTURA_REAL — no se mueve el motor, y se dice por qué' },
  { id: 3, nombre: 'Nombres de archivo', estado: 'hecho', donde: 'SO F4 · BIBLIOTECA' },
  { id: 4, nombre: 'Formatos', estado: 'hecho', donde: 'SO F4 · FORMATOS' },
  { id: 7, nombre: 'Preload por grupos', estado: 'hecho', donde: 'GRUPOS_PRECARGA' },
  { id: 9, nombre: 'Sound engine único', estado: 'hecho', donde: 'pantallasQueTocanElAudio()' },
  { id: 10, nombre: 'API del motor', estado: 'hecho', donde: 'audioEngine.js (SO F1)' },
  { id: 12, nombre: 'No acoplar UI y audio', estado: 'hecho', donde: 'PROHIBIDO_EN_PANTALLAS' },
  { id: 15, nombre: 'Prioridades', estado: 'hecho', donde: 'SO F1 y SO F3' },
  { id: 16, nombre: 'Interrupción', estado: 'hecho', donde: 'decidirReproduccion()' },
  { id: 17, nombre: 'Secuencias', estado: 'hecho', donde: 'SECUENCIAS' },
  { id: 21, nombre: 'Modo silencioso', estado: 'hecho', donde: 'queHaceElEvento()' },
  { id: 22, nombre: 'Haptics independientes', estado: 'hecho', donde: 'HAPTICS · PATRONES_VIBRACION' },
  { id: 23, nombre: 'Control de volumen', estado: 'hecho', donde: 'volumenFinal()' },
  { id: 24, nombre: 'Ajustes', estado: 'hecho', donde: 'PANTALLA_SONIDO · CONTROLES' },
  { id: 25, nombre: 'Perfiles', estado: 'hecho', donde: 'PERFILES · aplicarPerfil() · perfilActual()' },
  { id: 26, nombre: 'Botones de prueba', estado: 'hecho', donde: 'EJEMPLOS_PARA_ESCUCHAR' },
  { id: 27, nombre: 'Indicador de volumen', estado: 'hecho', donde: 'MARCAS_VOLUMEN' },
  { id: 28, nombre: 'Accesibilidad', estado: 'hecho', donde: 'ACCESIBILIDAD_CONTROLES' },
  { id: 29, nombre: 'Primera interacción', estado: 'hecho', donde: 'PRIMERA_INTERACCION' },
  { id: 30, nombre: 'Error de audio', estado: 'hecho', donde: 'ANTE_UN_ERROR' },
  { id: 31, nombre: 'Fallback', estado: 'hecho', donde: 'conFallback()' },
  { id: 32, nombre: 'Telemetría', estado: 'no_existe', donde: 'TELEMETRIA — JosStyle no tiene analítica' },
  { id: 33, nombre: 'Test automático', estado: 'hecho', donde: 'PRUEBAS_MOTOR' },
  { id: 34, nombre: 'Test de racha', estado: 'hecho', donde: 'SO F3 · los diez milestones' },
  { id: 35, nombre: 'Test de récord', estado: 'hecho', donde: 'SO F3' },
  { id: 38, nombre: 'Test de modo silencioso', estado: 'hecho', donde: 'queHaceElEvento()' },
  { id: 39, nombre: 'Test de haptics', estado: 'hecho', donde: 'queHaceElEvento()' },
  { id: 40, nombre: 'Cambio de volumen en caliente', estado: 'hecho', donde: 'volumenFinal() es puro' },
  { id: 41, nombre: 'Cambio de perfil en caliente', estado: 'hecho', donde: 'aplicarPerfil()' },
  { id: 42, nombre: 'Test en móvil', estado: 'josue', donde: 'R1' },
  { id: 43, nombre: 'Test de auriculares', estado: 'josue', donde: 'R1' },
  { id: 44, nombre: 'Test de interrupción', estado: 'josue', donde: 'R1' },
  { id: 46, nombre: 'Test de carga', estado: 'josue', donde: 'R1' },
  { id: 5, nombre: 'Calidad de los sonidos', estado: 'bloqueado', donde: '⏸ SO F2 — no hay archivos' },
  { id: 6, nombre: 'Optimización', estado: 'bloqueado', donde: '⏸ SO F2' },
  { id: 47, nombre: 'Criterio de calidad', estado: 'bloqueado', donde: '⏸ SO F2 — se aplica a archivos que no existen' },
  { id: 48, nombre: 'Control de versiones de los sonidos', estado: 'bloqueado', donde: '⏸ SO F2' },
];

export const apartadoSO5 = (id) => APARTADOS_SO5.find((a) => a.id === id) || null;
export const apartadosBloqueados = () => APARTADOS_SO5.filter((a) => a.estado === 'bloqueado');
export const apartadosDeJosueSO = () => APARTADOS_SO5.filter((a) => a.estado === 'josue');

export const CONDICION = 'El sistema de audio queda listo para producción: motor, perfiles, volumen, precarga, fallback, ajustes y pruebas. Lo único que falta son los archivos, y esos los da Josué.';

/* ===========================================================================
   13 · EL PARTE
   =========================================================================== */

export function auditarSonidoProduccion({ fuentes = {}, archivosPresentes = [] } = {}) {
  return {
    perfiles: PERFILES.length,
    // Decisión 3 — el perfil se deduce, no se guarda
    perfilPorDefecto: perfilActual(DEFAULT_AUDIO),
    sinPrefs: PERFILES.filter((p) => !p.prefs).map((p) => p.id),
    // Decisión 2 — el volumen multiplica
    volumenDeUnClic: volumenFinal({ ...DEFAULT_AUDIO, activado: true }, 'UI_CLICK'),
    volumenDeUnRecord: volumenFinal({ ...DEFAULT_AUDIO, activado: true }, 'NEW_RECORD'),
    // Decisión 1 — ninguna pantalla toca el audio
    pantallasQueTocanElAudio: pantallasQueTocanElAudio(fuentes),
    // Apartado 7
    grupos: GRUPOS_PRECARGA.length,
    // Apartado 31
    familiasConFallback: Object.keys(FALLBACK_POR_FAMILIA).length,
    familiasSinFallback: FAMILIAS.filter((f) => !FALLBACK_POR_FAMILIA[f.id]).map((f) => f.id),
    // Decisión 4
    silencioProcesaElEvento: queHaceElEvento({ ...DEFAULT_AUDIO, activado: false }, 'SUCCESS').procesaElEvento,
    vibraSinSonido: queHaceElEvento({ ...DEFAULT_AUDIO, activado: false, vibracion: true }, 'SUCCESS').vibra,
    // ⏸ Lo que sigue bloqueado
    archivosQueFaltan: cuantosArchivosFaltan(archivosPresentes),
    archivosQueHay: archivosPresentes.length,
    bloqueados: apartadosBloqueados().map((a) => a.id),
    paraJosue: apartadosDeJosueSO().map((a) => a.id),
    sinDonde: APARTADOS_SO5.filter((a) => !a.donde).map((a) => a.id),
  };
}

export function panelSonidoProduccion(prefs = DEFAULT_AUDIO, opciones = {}) {
  const a = auditarSonidoProduccion(opciones);
  const p = normalizarAudio(prefs);
  return {
    ...a,
    prefs: p,
    perfil: perfilActual(p),
    perfilesLista: PERFILES,
    controles: CONTROLES,
    marcas: MARCAS_VOLUMEN,
    grupos: GRUPOS_PRECARGA,
    pruebas: PRUEBAS_MOTOR,
    bloqueadoPorArchivos: BLOQUEADO_POR_LOS_ARCHIVOS,
    apartados: APARTADOS_SO5,
    /* 🎯 El veredicto: **el sistema está listo desde la SO F5; lo que faltaban
       eran los archivos**. Y eso no se disimula: `hoySuena` sale de contarlos. */
    listoParaProduccion: a.pantallasQueTocanElAudio.length === 0
      && a.familiasSinFallback.length === 0
      && a.silencioProcesaElEvento
      && a.sinDonde.length === 0
      && a.volumenDeUnClic < a.volumenDeUnRecord,
    /* 🚨 Se calcula, no se declara. Fue `false` fijo hasta el 2026-09-04, y ese
       día habría seguido diciendo que no suena nada con un archivo ya en la
       carpeta. Un panel que no puede cambiar de opinión no informa de nada. */
    hoySuena: a.archivosQueHay > 0,
    condicion: CONDICION,
  };
}

export { CATEGORIAS_SONIDO, categoriaSonido, EVENTOS_SONIDO, definicionEvento, eventoCanonico,
  PRIORIDADES_SONIDO, DEFAULT_AUDIO, normalizarAudio, acotarVolumen, volumenEfectivo,
  resolverSonido, decidirReproduccion, VENTANA_COLISION, CATALOGO, definicionCatalogo,
  NIVELES, FAMILIAS, familia, ARCHIVOS, fichaDe, listaDeArchivos, queFalta };
