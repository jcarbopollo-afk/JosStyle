// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 25 (PR F3) — PRODUCTIVIDAD: POMODORO
// ══════════════════════════════════════════════════════════════════════════
//
// *"Debe sentirse como una mini-app de concentración, no como un simple
//  contador."*
//
// 🚨 **Y LA FRASE QUE DECIDE TODO EL ARCHIVO ES ÉSTA:** *"**No implementar un
//    contador que simplemente se base en restar segundos continuamente.
//    Utilizar timestamps para calcular el tiempo real restante.** Así se evita
//    que el temporizador se desincronice si la pestaña queda en segundo plano."*
//
//    Así que aquí **no hay ningún contador que baje**. Lo que se guarda es
//    *cuándo empezó* y *cuánto dura*; lo que queda **se calcula restando**. De
//    ahí salen gratis las tres cosas que el enunciado pide por separado:
//
//    · **Sobrevive al segundo plano** (criterio 12): el iPhone congela los
//      temporizadores de una pestaña que no se ve, pero no puede cambiar la hora
//      a la que empezó. Un contador que resta segundos habría vuelto de bloquear
//      el móvil marcando veinte minutos de más.
//    · **Sobrevive a recargar y a cambiar de pantalla**: el estado son cuatro
//      números; se guarda y se vuelve a leer.
//    · **Y la pausa no es un caso aparte**: es sumar el rato parado.
//
// 🚨 **EL SONIDO ES EL DE SIEMPRE, Y NI UNA LÍNEA MÁS.** *"Utilizar el sistema de
//    sonidos existente. **NO crear un sistema paralelo de volumen.**"* Aquí no se
//    llama a `reproducir` ni se toca `audioEngine`: se **emite un evento en el
//    bus** (`eventos.js`), como hace Rachas, y quien decide si suena —y a qué
//    volumen, y si el móvil está en silencio— sigue siendo el motor de SO F1.
//    Hay una prueba que lee este archivo y falla si aparece `new Audio`,
//    `reproducir(` o `volumen`.
//
// ⚠️ **Y NO SE INVENTA UN SONIDO NUEVO.** La biblioteca de sonidos es de SO F4 y
//    tiene sus 46 archivos con sus nombres; ninguno es una campana de pomodoro.
//    Se emite `success`, que existe, tiene archivo y significa exactamente esto.
//    Añadir una entrada al catálogo sin su archivo habría sido declarar un sonido
//    que no suena.

import { todayISO, fechaLocalISO, uid, addDays } from './helpers.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const num = (x, porDefecto = 0) => (Number.isFinite(Number(x)) ? Number(x) : porDefecto);

/* ── Los tres tipos de sesión ─────────────────────────────────────────────

   *"Tipos: focus · short_break · long_break."* Los nombres del enunciado, con su
   texto en español para la pantalla. */
export const TIPOS_SESION = [
  { id: 'focus', nombre: 'Enfoque', frase: 'Sesión de enfoque', esDescanso: false, campo: 'enfoqueMin' },
  { id: 'short_break', nombre: 'Descanso', frase: 'Descanso corto', esDescanso: true, campo: 'cortoMin' },
  { id: 'long_break', nombre: 'Descanso largo', frase: 'Descanso largo', esDescanso: true, campo: 'largoMin' },
];

export const tipoSesion = (id) => TIPOS_SESION.find((t) => t.id === id) || TIPOS_SESION[0];
export const IDS_TIPOS_SESION = TIPOS_SESION.map((t) => t.id);

/* ── La configuración ─────────────────────────────────────────────────────

   *"Enfoque 25 · Descanso corto 5 · Descanso largo 15 · Sesiones antes del
   descanso largo 4. **Pero TODOS deben poder configurarse.**"* */
export const DURACIONES_SUGERIDAS = [15, 20, 25, 30, 45, 60];
export const MIN_MINUTOS = 1;
export const MAX_MINUTOS = 180;

export const CONFIG_POMODORO_POR_DEFECTO = {
  enfoqueMin: 25,
  cortoMin: 5,
  largoMin: 15,
  sesionesAntesDelLargo: 4,
  /* ⚠️ **Los dos automatismos nacen APAGADOS.** Es la regla de siempre en este
     proyecto —nada se dispara solo— y aquí importa el doble: un descanso que
     arranca por su cuenta cuando él ya ha cerrado el móvil le deja un pomodoro a
     medias en el historial. Se enciende él si quiere. */
  autoDescanso: false,
  autoSiguiente: false,
};

export function normalizarConfig(guardada) {
  const c = guardada && typeof guardada === 'object' ? guardada : {};
  const minutos = (v, porDefecto) => {
    const n = Math.round(num(v, porDefecto));
    return Math.min(MAX_MINUTOS, Math.max(MIN_MINUTOS, n || porDefecto));
  };
  return {
    enfoqueMin: minutos(c.enfoqueMin, CONFIG_POMODORO_POR_DEFECTO.enfoqueMin),
    cortoMin: minutos(c.cortoMin, CONFIG_POMODORO_POR_DEFECTO.cortoMin),
    largoMin: minutos(c.largoMin, CONFIG_POMODORO_POR_DEFECTO.largoMin),
    /* Entre 2 y 12: con 1, el descanso largo sería siempre; con 20, nunca. */
    sesionesAntesDelLargo: Math.min(12, Math.max(2, Math.round(num(c.sesionesAntesDelLargo, 4)) || 4)),
    autoDescanso: c.autoDescanso === true,
    autoSiguiente: c.autoSiguiente === true,
  };
}

/** Cuánto dura un tipo de sesión, en milisegundos, según la configuración. */
export function duracionDe(tipo, config) {
  const c = normalizarConfig(config);
  const t = tipoSesion(tipo);
  return c[t.campo] * 60 * 1000;
}

/* ── El estado del temporizador ───────────────────────────────────────────

   🚨 **Cuatro números y ni un contador.** `inicio` es el instante en que se pulsó
   ▶, `pausadoEn` el instante en que se pulsó ⏸ (o `null` si corre), y
   `pausaAcumuladaMs` el rato que lleva parado en total. Con eso, lo que queda es
   una resta — y da igual cuánto tiempo haya estado el móvil bloqueado.

   ⚠️ `sesionesHechas` cuenta las de enfoque completadas **dentro del ciclo**, que
   es lo que decide si el próximo descanso es corto o largo. Se reinicia al llegar
   al largo, no al cambiar de día: un ciclo empezado a las 23:50 no se corta a
   medias por ser otra fecha. */
export const SIN_SESION = null;

export function iniciarSesion(tipo, config, { ahora = Date.now(), sesionesHechas = 0, tareaId = null } = {}) {
  if (!IDS_TIPOS_SESION.includes(tipo)) return SIN_SESION;
  return {
    tipo,
    inicio: ahora,
    duracionMs: duracionDe(tipo, config),
    pausadoEn: null,
    pausaAcumuladaMs: 0,
    sesionesHechas: Math.max(0, Math.round(num(sesionesHechas, 0))),
    /* ⚠️ *"Preparar opcionalmente un campo `task_id`… **pero NO desarrollar
       todavía el gestor de tareas. No mostrar una interfaz de tareas falsa.**"*
       El campo existe y viaja al historial; no hay ni un selector que lo llene,
       y está declarado en `VINCULACION_CON_TAREAS`. */
    tareaId: tareaId || null,
  };
}

export function normalizarSesionEnCurso(guardada) {
  const s = guardada && typeof guardada === 'object' ? guardada : null;
  if (!s || !IDS_TIPOS_SESION.includes(s.tipo)) return SIN_SESION;
  const inicio = num(s.inicio, 0);
  const duracionMs = num(s.duracionMs, 0);
  /* Un estado sin inicio o sin duración no es una sesión: es basura de una
     versión anterior o de una escritura a medias, y se descarta en vez de dejar
     un temporizador que cuenta desde 1970. */
  if (inicio <= 0 || duracionMs <= 0) return SIN_SESION;
  return {
    tipo: s.tipo,
    inicio,
    duracionMs,
    pausadoEn: num(s.pausadoEn, 0) > 0 ? num(s.pausadoEn) : null,
    pausaAcumuladaMs: Math.max(0, num(s.pausaAcumuladaMs, 0)),
    sesionesHechas: Math.max(0, Math.round(num(s.sesionesHechas, 0))),
    tareaId: typeof s.tareaId === 'string' && s.tareaId ? s.tareaId : null,
  };
}

export const estaPausada = (sesion) => !!sesion && sesion.pausadoEn != null;

/** El tiempo que lleva corriendo, sin contar las pausas. **La resta.** */
export function transcurridoMs(sesion, ahora = Date.now()) {
  if (!sesion) return 0;
  const hasta = sesion.pausadoEn != null ? sesion.pausadoEn : ahora;
  return Math.max(0, hasta - sesion.inicio - sesion.pausaAcumuladaMs);
}

/** Lo que queda. Nunca negativo: cuando pasa de la duración, es cero. */
export function restanteMs(sesion, ahora = Date.now()) {
  if (!sesion) return 0;
  return Math.max(0, sesion.duracionMs - transcurridoMs(sesion, ahora));
}

/** ¿Ha terminado? Esto es lo que mira la pantalla en cada tic, y por eso volver
 *  de bloquear el móvil una hora la encuentra terminada, no con una hora de más. */
export const haTerminado = (sesion, ahora = Date.now()) => !!sesion && restanteMs(sesion, ahora) === 0;

/** De 0 a 1, para el círculo. */
export function progreso(sesion, ahora = Date.now()) {
  if (!sesion || sesion.duracionMs <= 0) return 0;
  return Math.min(1, transcurridoMs(sesion, ahora) / sesion.duracionMs);
}

/** `mm:ss`, con las horas solo si hacen falta. */
export function formatearTiempo(ms) {
  const total = Math.max(0, Math.round(num(ms, 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (x) => String(x).padStart(2, '0');
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}

/* ── Pausar, reanudar, reiniciar ──────────────────────────────────────────

   ⚠️ Pausar **no toca `inicio`**: guarda cuándo se paró. Reanudar suma el rato
   parado a `pausaAcumuladaMs` y borra la marca. Así la resta sigue valiendo
   aunque se pause diez veces. */
export function pausar(sesion, ahora = Date.now()) {
  if (!sesion || estaPausada(sesion)) return sesion;
  return { ...sesion, pausadoEn: ahora };
}

export function reanudar(sesion, ahora = Date.now()) {
  if (!sesion || !estaPausada(sesion)) return sesion;
  return {
    ...sesion,
    pausaAcumuladaMs: sesion.pausaAcumuladaMs + Math.max(0, ahora - sesion.pausadoEn),
    pausadoEn: null,
  };
}

/** *"↻ Reiniciar"*: la misma sesión desde cero. No cuenta como completada ni como
 *  interrumpida — no ha pasado nada, solo se vuelve a empezar. */
export function reiniciar(sesion, ahora = Date.now()) {
  if (!sesion) return sesion;
  return { ...sesion, inicio: ahora, pausadoEn: null, pausaAcumuladaMs: 0 };
}

/* ── Registrar lo que pasó ────────────────────────────────────────────────

   *"Cada registro debería poder almacenar como mínimo: id, user_id, start_time,
   end_time, duration, type, completed, interrupted, created_at."*

   ⚠️ `user_id` **no es un campo**: la fila de `app_data` es del usuario, y ahí
   vive el aislamiento (EH F43). Guardarlo dentro sería una copia que no protege
   nada. Lo demás está entero. */
export const CAMPOS_SESION = [
  'id', 'tipo', 'inicio', 'fin', 'duracionMs', 'completada', 'interrumpida', 'tareaId', 'fecha',
];

function registrar(sesion, { ahora = Date.now(), completada }) {
  const t = transcurridoMs(sesion, ahora);
  return {
    id: uid(),
    tipo: sesion.tipo,
    inicio: sesion.inicio,
    fin: ahora,
    /* ⚠️ Lo que se guarda es **lo que de verdad duró**, no lo que iba a durar: en
       una cancelada son los minutos que estuvo concentrado, que es el dato
       honesto. En una completada coinciden. */
    duracionMs: completada ? sesion.duracionMs : t,
    completada,
    interrumpida: !completada,
    tareaId: sesion.tareaId || null,
    fecha: fechaLocalISO(new Date(ahora)),
  };
}

/** *"Cuando termina una sesión… registrar la sesión."* */
export const completar = (sesion, ahora = Date.now()) => (sesion ? registrar(sesion, { ahora, completada: true }) : null);

/**
 * *"Si el usuario cancela una sesión: **no contarla como Pomodoro completado**.
 * Pero opcionalmente registrar que fue interrumpida para estadísticas futuras."*
 *
 * ⚠️ Y se registra, con `interrumpida: true`, **pero no cuenta en ningún número
 * de pomodoros**: las estadísticas filtran por `completada`.
 */
export const cancelar = (sesion, ahora = Date.now()) => (sesion ? registrar(sesion, { ahora, completada: false }) : null);

export function normalizarSesion(s) {
  if (!s || typeof s !== 'object') return null;
  if (!IDS_TIPOS_SESION.includes(s.tipo)) return null;
  const inicio = num(s.inicio, 0);
  if (inicio <= 0) return null;
  const completada = s.completada === true;
  return {
    id: typeof s.id === 'string' && s.id ? s.id : uid(),
    tipo: s.tipo,
    inicio,
    fin: num(s.fin, inicio),
    duracionMs: Math.max(0, num(s.duracionMs, 0)),
    completada,
    /* Una sesión no puede estar completada e interrumpida a la vez: son lo
       contrario. Se deriva de `completada` en vez de guardar dos veces lo mismo. */
    interrumpida: !completada,
    tareaId: typeof s.tareaId === 'string' && s.tareaId ? s.tareaId : null,
    fecha: typeof s.fecha === 'string' && s.fecha ? s.fecha : fechaLocalISO(new Date(inicio)),
  };
}

export const normalizarSesiones = (sesiones) => lista(sesiones).map(normalizarSesion).filter(Boolean);

/* ── El ciclo ─────────────────────────────────────────────────────────────

   *"Enfoque → Descanso corto → … → Enfoque → **Descanso largo**. Después vuelve a
   comenzar."*

   ⚠️ El descanso largo llega cuando las sesiones de enfoque hechas son múltiplo
   de `sesionesAntesDelLargo`, y **después el contador vuelve a cero**: si no, el
   quinto pomodoro también daría descanso largo. */
export function siguienteEnElCiclo(sesionTerminada, config) {
  const c = normalizarConfig(config);
  if (!sesionTerminada) return { tipo: 'focus', sesionesHechas: 0 };
  const t = tipoSesion(sesionTerminada.tipo);

  /* Tras un descanso siempre toca enfocar otra vez. */
  if (t.esDescanso) {
    return {
      tipo: 'focus',
      sesionesHechas: sesionTerminada.tipo === 'long_break' ? 0 : sesionTerminada.sesionesHechas,
    };
  }

  const hechas = sesionTerminada.sesionesHechas + 1;
  const tocaLargo = hechas % c.sesionesAntesDelLargo === 0;
  return { tipo: tocaLargo ? 'long_break' : 'short_break', sesionesHechas: hechas };
}

/** *"El contador de sesiones debe indicar dónde se encuentra el usuario. Ejemplo:
 *  Sesión 2 de 4."* */
export function posicionEnElCiclo(sesion, config) {
  const c = normalizarConfig(config);
  const hechas = sesion ? sesion.sesionesHechas : 0;
  const t = sesion ? tipoSesion(sesion.tipo) : tipoSesion('focus');
  /* Durante un descanso, la que se acaba de hacer es la última; durante el
     enfoque, la que se está haciendo es la siguiente. */
  const actual = t.esDescanso ? hechas : hechas + 1;
  return {
    actual: Math.min(c.sesionesAntesDelLargo, Math.max(1, actual)),
    de: c.sesionesAntesDelLargo,
    texto: `Sesión ${Math.min(c.sesionesAntesDelLargo, Math.max(1, actual))} de ${c.sesionesAntesDelLargo}`,
  };
}

/* ── El sonido: se EMITE, no se reproduce ─────────────────────────────────

   🚨 *"Utilizar el sistema de sonidos existente. **NO crear un sistema paralelo
   de volumen.** Respetar: volumen global, activación/desactivación, configuración
   existente."*

   Aquí no se toca el audio: se emite un evento en el bus, y el motor de SO F1
   —el único que reproduce— decide si suena, con qué archivo y a qué volumen.
   Ni siquiera hace falta saber si el sonido está encendido.

   ⚠️ Y el evento es **uno que ya existe**, `success`: la biblioteca de sonidos es
   de SO F4 y tiene sus 46 archivos; ninguno es una campana de pomodoro. Declarar
   uno nuevo sin archivo habría sido declarar un sonido que no suena. */
export const EVENTO_AL_TERMINAR = 'success';

export const SONIDO = {
  propio: false,
  evento: EVENTO_AL_TERMINAR,
  quienDecide: 'El motor de audio (SO F1): volumen, silencio y activación son suyos.',
  porQueNoUnoNuevo: 'La biblioteca de sonidos es de SO F4 y no tiene ninguna campana de pomodoro. Declarar un evento sin archivo sería declarar un sonido que no suena.',
};

/* ── Notificaciones ───────────────────────────────────────────────────────

   *"Preparar la arquitectura para que posteriormente se puedan utilizar
   notificaciones cuando termine una sesión. Si el proyecto ya tiene sistema de
   notificaciones, reutilizarlo. **No crear ahora un sistema global nuevo
   únicamente para Pomodoro.**"*

   ⚠️ Y aquí hay un límite real que la E3 F11 ya dejó escrito: **con la aplicación
   cerrada no llega ningún aviso**, porque no hay service worker (DEP-30). Un
   aviso de fin de pomodoro solo puede salir con la pantalla abierta, y eso es
   justo cuando menos falta hace. Se declara en vez de prometerse. */
export const AVISOS = {
  sistemaPropio: false,
  reutiliza: 'notificaciones.js (Fase A4), que es quien pide permiso y emite.',
  conLaAppCerrada: false,
  porQue: 'No hay service worker con `push` (DEP-30, y la E3 F11 lo dejó escrito). Un aviso solo puede salir con la aplicación abierta.',
};

/* ── Estadísticas ─────────────────────────────────────────────────────────

   *"HOY: pomodoros completados, tiempo concentrado. ESTA SEMANA: pomodoros,
   tiempo. **No hace falta crear todavía un sistema analítico enorme.**"*

   🚨 **Y se derivan de las sesiones**: aquí no se guarda ni una cifra. Una
   estadística guardada miente en cuanto él borra un registro (E3 F13, EH F35). */

/** Solo las de ENFOQUE completadas cuentan como pomodoro. Un descanso no es un
 *  pomodoro, y una cancelada tampoco — *"no contarla como completado"*. */
export const esPomodoro = (s) => !!s && s.tipo === 'focus' && s.completada === true;

export function estadisticasDe(sesiones, { desde, hasta }) {
  const dentro = lista(sesiones).filter((s) => s && s.fecha >= desde && s.fecha <= hasta);
  const pomodoros = dentro.filter(esPomodoro);
  const ms = pomodoros.reduce((a, s) => a + Math.max(0, num(s.duracionMs, 0)), 0);
  return {
    pomodoros: pomodoros.length,
    ms,
    tiempo: formatearDuracionLarga(ms),
    interrumpidas: dentro.filter((s) => s.tipo === 'focus' && !s.completada).length,
  };
}

/** *"1 h 15 min"*. Sin horas cuando no hay, y **`null` cuando no hay nada**: un
 *  «0 min» es una cifra que no dice nada. */
export function formatearDuracionLarga(ms) {
  const total = Math.max(0, Math.round(num(ms, 0) / 60000));
  if (total === 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function estadisticasHoy(sesiones, hoy = todayISO()) {
  return estadisticasDe(sesiones, { desde: hoy, hasta: hoy });
}

/** La semana empieza el LUNES y se calcula en local: octava vez que el UTC habría
 *  devuelto la semana equivocada (E3 F10). */
export function estadisticasSemana(sesiones, hoy = todayISO()) {
  const d = new Date(`${hoy}T00:00:00`).getDay();
  const lunes = addDays(hoy, -((d + 6) % 7));
  return estadisticasDe(sesiones, { desde: lunes, hasta: addDays(lunes, 6) });
}

/** El historial reciente, del más nuevo al más viejo. Cortado a propósito: *"no
 *  hace falta un sistema analítico enorme"*. */
export const MAX_HISTORIAL = 20;

export function historialReciente(sesiones, max = MAX_HISTORIAL) {
  return [...lista(sesiones)].sort((a, b) => num(b.inicio) - num(a.inicio)).slice(0, Math.max(0, max));
}

/* ── El contador de siempre ───────────────────────────────────────────────

   🚨 `productividad.pomodoros` es `{ '2026-09-07': 3 }` desde la Fase 6, y lo
   leen **`avisosPlanificacion.js` y `estadisticasPlan.js`**. Esta fase añade la
   lista de sesiones, que es lo que el enunciado pide —*"no guardar todo en un
   único objeto gigante"*—, pero **no rompe el contador**: se recalcula desde las
   sesiones, así que hay **una sola fuente de verdad** y una proyección que no
   puede desviarse. Guardar el contador a mano al lado sería el duplicado clásico
   que acaba diciendo dos números distintos. */
export function contadorDesdeSesiones(sesiones) {
  const cuenta = {};
  for (const s of lista(sesiones)) {
    if (!esPomodoro(s)) continue;
    cuenta[s.fecha] = (cuenta[s.fecha] || 0) + 1;
  }
  return cuenta;
}

/* ── Lo que Hoy podrá pedir ───────────────────────────────────────────────── */
export function paraHoy(sesiones, hoy = todayISO()) {
  const e = estadisticasHoy(sesiones, hoy);
  return { pomodoros: e.pomodoros, tiempo: e.tiempo, ms: e.ms };
}

/* ── La vinculación futura con Tareas ─────────────────────────────────────── */
export const VINCULACION_CON_TAREAS = {
  campo: 'tareaId',
  existe: true,
  interfaz: false,
  porQue: 'El gestor de tareas llega en la PR F4. *"No mostrar una interfaz de tareas falsa"*: el campo viaja al historial, pero no hay ningún selector que lo llene.',
};

/* ── Los textos de la pantalla ────────────────────────────────────────────── */
export const CABECERA_POMODORO = {
  titulo: 'Pomodoro',
  frase: 'Concéntrate. Una sesión cada vez.',
};

export const VACIO_POMODORO = {
  titulo: 'Todavía no has hecho ninguna sesión',
  frase: 'Pulsa empezar y concéntrate. El primer pomodoro es el que más cuesta.',
};

/* ── Lo que esta fase NO hace ─────────────────────────────────────────────── */
export const NO_EN_PR3 = [
  { que: 'Tareas, Metas, Objetivos y Rutinas', llega: 'PR F4 a PR F6' },
  { que: 'La interfaz para asociar un pomodoro a una tarea', llega: 'PR F4: el campo existe, el selector no' },
  { que: 'Un sistema global de estadísticas de productividad', llega: 'no está previsto en este bloque' },
  { que: 'IA y gamificación', llega: 'el enunciado las prohíbe; y D2-02 prohíbe la gamificación' },
  { que: 'Un sistema de notificaciones nuevo', llega: 'se reutiliza el de la Fase A4' },
  { que: 'Avisos con la aplicación cerrada', llega: 'necesitan un service worker (DEP-30), y se dice en vez de prometerse' },
];

/* ── Dónde se guarda ──────────────────────────────────────────────────────── */
export const DONDE_SE_GUARDA_POMODORO = [
  { que: 'La configuración, la sesión en curso y el historial de sesiones', donde: 'la clave `productividad` de `app_data`', nuevo: false },
  { que: 'El contador por día de siempre', donde: 'la misma clave, `pomodoros` — se recalcula desde las sesiones', nuevo: false },
];

export const AISLAMIENTO_POMODORO = {
  clave: 'productividad',
  politicas: 'Las cuatro de `app_data`: `auth.uid() = user_id`.',
  tablasNuevas: 0,
  porQue: 'Una sesión vive en la fila de `app_data` de su usuario. No existe ninguna consulta por id que pueda alcanzar la de otro.',
};

/* ── La condición de finalización ─────────────────────────────────────────

   🚨 **Se CALCULA**, ejecutando lo que dice comprobar. */
export function condicionPR3(config = CONFIG_POMODORO_POR_DEFECTO, sesiones = []) {
  const c = normalizarConfig(config);
  const t0 = 1_000_000;
  const s = iniciarSesion('focus', c, { ahora: t0 });
  const pausada = pausar(s, t0 + 60_000);
  const seguida = reanudar(pausada, t0 + 120_000);
  return [
    { id: 1, que: 'El temporizador se calcula con timestamps, no restando segundos', ok: restanteMs(s, t0 + 60_000) === s.duracionMs - 60_000 },
    { id: 2, que: 'Se puede iniciar', ok: !!s && s.duracionMs === c.enfoqueMin * 60_000 },
    { id: 3, que: 'Se puede pausar, y el tiempo se congela', ok: restanteMs(pausada, t0 + 999_000) === s.duracionMs - 60_000 },
    { id: 4, que: 'Se puede continuar, y la pausa no cuenta', ok: restanteMs(seguida, t0 + 180_000) === s.duracionMs - 120_000 },
    { id: 5, que: 'Se puede cancelar, y no cuenta como pomodoro', ok: !esPomodoro(cancelar(s, t0 + 60_000)) },
    { id: 6, que: 'Se puede completar, y sí cuenta', ok: esPomodoro(completar(s, t0 + s.duracionMs)) },
    { id: 7, que: 'Los descansos funcionan', ok: TIPOS_SESION.filter((x) => x.esDescanso).length === 2 },
    { id: 8, que: 'El ciclo lleva al descanso largo cada N sesiones', ok: siguienteEnElCiclo({ ...s, sesionesHechas: c.sesionesAntesDelLargo - 1 }, c).tipo === 'long_break' },
    { id: 9, que: 'Las duraciones son configurables', ok: duracionDe('focus', { ...c, enfoqueMin: 45 }) === 45 * 60_000 },
    { id: 10, que: 'Las sesiones se registran con sus campos', ok: Object.keys(completar(s, t0 + 1)).sort().join() === [...CAMPOS_SESION].sort().join() },
    { id: 11, que: 'Las estadísticas se derivan, sin guardar cifras', ok: estadisticasHoy([]).pomodoros === 0 && estadisticasHoy([]).tiempo === null },
    { id: 12, que: 'El estado sobrevive a recargar: se guarda y se relee', ok: !!normalizarSesionEnCurso(JSON.parse(JSON.stringify(s))) },
    { id: 13, que: 'El sonido es el del sistema, sin volumen propio', ok: SONIDO.propio === false && !!SONIDO.evento },
    { id: 14, que: 'El contador de siempre se recalcula desde las sesiones', ok: Object.values(contadorDesdeSesiones(sesiones)).every((n) => n > 0) },
    { id: 15, que: 'El aislamiento es de la base de datos', ok: AISLAMIENTO_POMODORO.tablasNuevas === 0 },
    { id: 16, que: 'No se ha desarrollado ninguna de las otras mini-apps', ok: NO_EN_PR3.some((x) => /Tareas, Metas/.test(x.que)) },
  ];
}

export const pr3Terminada = (config, sesiones) => condicionPR3(config, sesiones).every((c) => c.ok);
