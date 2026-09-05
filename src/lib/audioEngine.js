// ============================================================================
// SO · Fase 1/5 — EL MOTOR: lo único del proyecto que toca el audio
//
// *"Queda prohibido crear lógica como `new Audio(...)` repartida por la
// aplicación… Todo debe pasar por un servicio central."* (apartado 3)
//
// Este archivo es ese servicio, y es **el único sitio del proyecto donde puede
// aparecer un `AudioContext`**. Hay una regla invariante en `verificar.sh` que
// falla si aparece en cualquier otro. Un componente llama a `reproducir('SUCCESS')`
// y no sabe —ni tiene que saber— qué archivo suena, dónde está, a qué volumen ni
// cómo se ha cargado (apartado 6).
//
// ── LA TECNOLOGÍA, Y POR QUÉ (apartado 14) ─────────────────────────────────
//
// **Web Audio API, con `HTMLAudioElement` de respaldo.**
//
// Las prioridades que pide el apartado son compatibilidad iOS, Android, PWA,
// rendimiento, baja latencia, simplicidad y control de volumen. Con
// `HTMLAudioElement` solo se pierde una, pero es la que sostiene el apartado 8:
// **un elemento tiene un `volume` propio y nada más**, así que "Interfaz al 30 %
// y Rachas al 90 %" habría que calcularlo a mano en cada reproducción y no
// habría forma de bajar una categoría entera de golpe. Con Web Audio es un
// `GainNode` por categoría, que es exactamente la forma del problema.
//
// Además iOS limita cuántos elementos `<audio>` pueden sonar a la vez y cada uno
// pesa lo suyo; un solo `AudioContext` con nodos es más barato (apartado 34).
//
// El respaldo existe porque Web Audio puede no estar —un navegador viejo, un
// modo de ahorro—, y el apartado 26 dice que la app no puede romperse por el
// audio. Si tampoco hay respaldo, silencio.
//
// **Ninguna librería.** *"No añadas una librería pesada sin necesidad."* Lo que
// hace falta son un contexto, un nodo de ganancia por categoría y un `fetch`.
//
// ── iOS (apartados 15 y 16) ────────────────────────────────────────────────
//
// Safari crea el `AudioContext` en estado `suspended` y no deja reanudarlo hasta
// que hay un gesto del usuario. Eso no se puede saltar y no se intenta: el motor
// se engancha al primer toque y se desbloquea ahí. Hasta entonces **no falla**,
// simplemente no suena, que es lo que dice el apartado 15.
//
// Y **un solo contexto** (apartado 16): crear uno por sonido los dejaría abiertos
// hasta agotar el límite del navegador.
// ============================================================================

import {
  normalizarAudio, decidirReproduccion, ESTADO_AUDIO_INICIAL,
  sonidosAPrecargar, CATEGORIAS_SONIDO, volumenEfectivo,
} from './audio';
import { suscribir, emitir } from './eventos';

/* ===========================================================================
   ESTADO DEL MOTOR — una sola instancia, viva mientras viva la pestaña
   =========================================================================== */
const motor = {
  contexto: null,
  ganancias: new Map(),     // categoría → GainNode
  buffers: new Map(),       // id de sonido → AudioBuffer
  cargando: new Map(),      // id → promesa, para no pedir el mismo archivo dos veces
  desbloqueado: false,
  prefs: normalizarAudio(null),
  sonidosUsuario: [],
  estado: ESTADO_AUDIO_INICIAL,
  soltarGestos: null,
  fallos: [],
};

const HAY_DOM = typeof window !== 'undefined' && typeof document !== 'undefined';
const MAX_FALLOS = 20;

/** Un fallo de audio se apunta y se sigue. Nunca sube (apartado 26). */
function anotar(donde, error) {
  motor.fallos.push({ donde, mensaje: String(error?.message || error), en: Date.now() });
  if (motor.fallos.length > MAX_FALLOS) motor.fallos.shift();
}

export const fallosDeAudio = () => [...motor.fallos];

/* ===========================================================================
   1 · ARRANQUE Y DESBLOQUEO (apartados 15 y 16)
   =========================================================================== */

/**
 * Prepara el motor. **No crea el `AudioContext`**: eso espera al primer gesto,
 * porque crearlo antes lo dejaría `suspended` en iOS y ocupando memoria para
 * nada si Josué nunca enciende el sonido.
 *
 * Devuelve la función de limpieza — sin ella, los oyentes del primer gesto se
 * quedarían pegados al documento para siempre (apartado 34).
 */
export function iniciarAudio({ prefs = null, sonidosUsuario = [] } = {}) {
  motor.prefs = normalizarAudio(prefs);
  motor.sonidosUsuario = Array.isArray(sonidosUsuario) ? sonidosUsuario : [];
  if (!HAY_DOM) return () => {};

  // Un solo desbloqueo, en el primer gesto que llegue, sea cual sea.
  const alPrimerGesto = () => { desbloquear(); };
  const eventos = ['pointerdown', 'touchstart', 'keydown'];
  for (const e of eventos) document.addEventListener(e, alPrimerGesto, { once: true, passive: true });

  motor.soltarGestos = () => {
    for (const e of eventos) document.removeEventListener(e, alPrimerGesto);
    motor.soltarGestos = null;
  };
  return motor.soltarGestos;
}

/** Las preferencias cambian; el motor las lee de un sitio (apartado 7). */
export function actualizarPreferencias(prefs, sonidosUsuario = null) {
  motor.prefs = normalizarAudio(prefs);
  if (sonidosUsuario) motor.sonidosUsuario = sonidosUsuario;
  // Los volúmenes se aplican a los nodos ya creados: cambiar el volumen no puede
  // obligar a recrear nada ni a recargar los sonidos.
  for (const c of CATEGORIAS_SONIDO) {
    const nodo = motor.ganancias.get(c.id);
    if (nodo) nodo.gain.value = volumenEfectivo(motor.prefs, c.id);
  }
  // Apagado, se sueltan los buffers: ocupan memoria para nada (apartado 34).
  if (!motor.prefs.activado) motor.buffers.clear();
}

function crearContexto() {
  if (motor.contexto || !HAY_DOM) return motor.contexto;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;                       // se usará el respaldo
  try {
    motor.contexto = new Ctx();
    for (const c of CATEGORIAS_SONIDO) {
      const g = motor.contexto.createGain();
      g.gain.value = volumenEfectivo(motor.prefs, c.id);
      g.connect(motor.contexto.destination);
      motor.ganancias.set(c.id, g);
    }
  } catch (e) { anotar('crearContexto', e); motor.contexto = null; }
  return motor.contexto;
}

/**
 * Apartado 16 — reanudar el contexto tras un gesto. Es lo único que iOS exige, y
 * no hay forma de saltárselo ni se intenta.
 */
export async function desbloquear() {
  if (!HAY_DOM) return false;
  const ctx = crearContexto();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    motor.desbloqueado = ctx.state === 'running';
    if (motor.desbloqueado) {
      emitir('AUDIO_DESBLOQUEADO', {});
      precargar();          // ahora sí: hay permiso y hay contexto
    }
    return motor.desbloqueado;
  } catch (e) { anotar('desbloquear', e); return false; }
}

export const estadoAudio = () => ({
  disponible: HAY_DOM && !!(window.AudioContext || window.webkitAudioContext),
  desbloqueado: motor.desbloqueado,
  contexto: motor.contexto?.state || 'sin_crear',
  cargados: motor.buffers.size,
  activado: motor.prefs.activado,
});

/* ===========================================================================
   2 · CARGA Y PRECARGA (apartados 17, 18 y 25)
   =========================================================================== */

async function cargar(sonido) {
  if (!sonido?.ruta) return null;
  if (motor.buffers.has(sonido.id)) return motor.buffers.get(sonido.id);
  // Dos eventos seguidos no pueden pedir el mismo archivo dos veces.
  if (motor.cargando.has(sonido.id)) return motor.cargando.get(sonido.id);

  const ctx = motor.contexto;
  if (!ctx) return null;

  const promesa = (async () => {
    try {
      // El navegador ya cachea con su política y con el service worker de la
      // PWA; montar un segundo sistema de caché sería el "sistema paralelo" que
      // prohíbe el apartado 18.
      const res = await fetch(sonido.ruta);
      if (!res.ok) throw new Error(`${res.status} al cargar ${sonido.ruta}`);
      const datos = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(datos);
      motor.buffers.set(sonido.id, buffer);
      return buffer;
    } catch (e) {
      // Un archivo que no está —el caso de HOY, porque todavía no hay ninguno—
      // se apunta y se devuelve nada. El apartado 25 lo llama fallback; aquí
      // acaba en silencio, y el 26 exige que no rompa la app.
      anotar(`cargar:${sonido.id}`, e);
      return null;
    } finally {
      motor.cargando.delete(sonido.id);
    }
  })();

  motor.cargando.set(sonido.id, promesa);
  return promesa;
}

/** Apartado 17 — solo lo crítico, y solo si el sonido está encendido. */
export function precargar() {
  if (!motor.contexto || !motor.prefs.activado) return 0;
  const lista = sonidosAPrecargar(motor.prefs, { sonidosUsuario: motor.sonidosUsuario });
  for (const s of lista) cargar(s);
  return lista.length;
}

/* ===========================================================================
   3 · REPRODUCIR (apartados 6, 10, 11 y 26)
   ===========================================================================
   La interfaz entera del apartado 6 pasa por aquí. Un componente escribe
   `reproducir('SUCCESS')` y ya.

   **Quién decide no es este archivo**: es `audio.js`, que es puro y está
   probado. Aquí solo se obedece. Esa separación es la que permite comprobar el
   cooldown, las colisiones y el volumen sin un navegador delante. */
export function reproducir(tipo, { ahora = Date.now(), contexto = {} } = {}) {
  /* `contexto` lleva el dato que distingue sonidos dentro de un mismo evento:
     hoy solo los dias de racha, para elegir entre los diez hitos. */
  const decision = decidirReproduccion(motor.prefs, tipo, {
    ahora, estado: motor.estado, sonidosUsuario: motor.sonidosUsuario, contexto,
  });
  motor.estado = decision.estado;
  if (!decision.suena) return decision;

  // Sin contexto o sin desbloquear no se fuerza nada: se devuelve la decisión
  // igual, para que quien llame sepa que la intención era sonar.
  if (!HAY_DOM || !motor.contexto || !motor.desbloqueado) {
    return { ...decision, reproducido: false, motivo: motor.desbloqueado ? 'sin_contexto' : 'bloqueado_hasta_el_primer_toque' };
  }

  (async () => {
    try {
      const buffer = await cargar(decision.sonido);
      if (!buffer) return;                      // silencio: el fallback ya no da más
      const fuente = motor.contexto.createBufferSource();
      fuente.buffer = buffer;
      fuente.connect(motor.ganancias.get(decision.categoria) || motor.contexto.destination);
      // Un `BufferSource` es de un solo uso: se suelta al acabar para no dejar
      // nodos abandonados (apartado 34).
      fuente.onended = () => { try { fuente.disconnect(); } catch { /* ya estaba suelto */ } };
      fuente.start(0);
    } catch (e) { anotar(`reproducir:${tipo}`, e); }
  })();

  return { ...decision, reproducido: true };
}

/* Apartado 6 — el resto de la interfaz. `pausar`/`reanudar` son del contexto
   entero, que es lo que tiene sentido aquí: los sonidos duran menos de un
   segundo, así que pausar uno concreto no significaría nada. */
export function silenciar() { actualizarPreferencias({ ...motor.prefs, activado: false }); }
export function activar() { actualizarPreferencias({ ...motor.prefs, activado: true }); }
export function ajustarVolumen(v) { actualizarPreferencias({ ...motor.prefs, volumen: v }); }
export async function pausar() { try { await motor.contexto?.suspend(); } catch (e) { anotar('pausar', e); } }
export async function reanudar() { try { await motor.contexto?.resume(); } catch (e) { anotar('reanudar', e); } }

/**
 * Cierra el motor y suelta todo: el contexto, los nodos, los buffers y los
 * oyentes. Se llama al cerrar sesión.
 */
export function detener() {
  try { motor.soltarGestos?.(); } catch (e) { anotar('detener', e); }
  try { motor.contexto?.close(); } catch (e) { anotar('detener', e); }
  motor.contexto = null;
  motor.ganancias.clear();
  motor.buffers.clear();
  motor.cargando.clear();
  motor.desbloqueado = false;
  motor.estado = ESTADO_AUDIO_INICIAL;
}

/* ===========================================================================
   4 · EL PUENTE CON EL BUS (apartados 30 y 31)
   ===========================================================================
   *"El Audio Engine puede suscribirse."*

   Y eso es todo lo que hace falta para que un módulo suene: emitir en el bus.
   Ni Entrenamiento ni Rachas importan nada de audio, que es el desacoplamiento
   del apartado 31.

   Los eventos de RA F3 llegan con SUS nombres y `eventoCanonico` los traduce, de
   modo que ningún módulo tiene que aprenderse un segundo catálogo. */
export function conectarAlBus() {
  return suscribir('*', (evento) => {
    /* 🚨 **Los días del hito tienen que viajar con el evento.**
       RA F3 emite `STREAK_MILESTONE_REACHED` con `hito: 30` — el número de días—,
       y desde el 2026-09-04 el motor sabe elegir entre los diez archivos de hito
       si se lo dicen. Sin esta línea no se lo decía nadie: los diez sonaban
       igual, y la biblioteca entera de hitos se reducía a uno.

       ⚠️ Rachas sigue sin saber que existe el audio. Emite su evento con sus
       datos, como siempre; es el motor quien sabe que `hito` son días. */
    reproducir(evento.tipo, { contexto: { dias: evento.hito } });
  });
}

/**
 * 🚨 **Los toques de la interfaz**, que es lo que de verdad se oye al usar la
 * aplicación. Un solo oyente en el documento, aquí y no en veinte pantallas.
 *
 * *"No quiero que el audio se implemente directamente dentro de cada
 * componente"* (cabecera de SO F1). Meter un `reproducir()` en cada `onClick`
 * habría sido justo eso, y además garantiza que el botón número veintiuno se
 * quede mudo sin que nadie se entere.
 *
 * ⚠️ Suena solo lo que es un control de verdad —un botón, un enlace, algo con
 * `role="button"`—, no cualquier sitio donde se pueda pinchar. Y un elemento con
 * `data-sin-sonido` queda fuera: lo usa el botón «▶ Escuchar» de Ajustes, que ya
 * reproduce su propio ejemplo y sonaría dos veces.
 */
export function conectarLosToques() {
  if (!HAY_DOM) return () => {};

  const alTocar = (e) => {
    const el = e.target?.closest?.('button, a, [role="button"], [role="tab"], input[type="checkbox"], input[type="radio"]');
    if (!el || el.disabled || el.closest('[data-sin-sonido]')) return;

    /* Un interruptor no suena como un botón, y encenderlo no suena como
       apagarlo: son tres sonidos distintos y la biblioteca los declara aparte. */
    const esInterruptor = el.matches('input[type="checkbox"]') || el.getAttribute('role') === 'switch'
      || el.getAttribute('aria-checked') !== null || el.getAttribute('aria-pressed') !== null;
    if (esInterruptor) {
      /* Se lee DESPUÉS del clic, así que `checked` ya es el estado nuevo. Para
         los que usan aria, el atributo todavía no se ha actualizado en este
         punto del ciclo de React, así que se invierte lo que hay. */
      const marcado = el.matches('input[type="checkbox"]')
        ? el.checked
        : !(el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-pressed') === 'true');
      reproducir(marcado ? 'UI_TOGGLE' : 'UI_TOGGLE_OFF');
      return;
    }

    /* 🚨 Abrir un panel, volver atrás y pulsar un botón son tres gestos
       distintos, y la biblioteca los declara por separado. Se distinguen por lo
       que el propio elemento ya dice de sí mismo —`aria-expanded`, su etiqueta—,
       no por una lista de botones que habría que mantener a mano y que se
       quedaría vieja al añadir la pantalla siguiente. */
    if (el.getAttribute('aria-expanded') !== null) {
      /* `aria-expanded` se lee ANTES de que React lo actualice, así que lo que
         hay es el estado viejo: si ponía "cerrado", este toque lo está abriendo. */
      reproducir(el.getAttribute('aria-expanded') === 'true' ? 'UI_BACK' : 'UI_OPEN');
      return;
    }

    const etiqueta = `${el.getAttribute('aria-label') || ''} ${el.title || ''}`.toLowerCase();
    if (/volver|atrás|atras|cerrar|cancelar/.test(etiqueta)) {
      reproducir('UI_BACK');
      return;
    }

    /* 🚨 **Guardar a propósito sí suena; los otros ochenta y seis, no.**
       `saveData()` se llama desde 86 sitios de `App.jsx` —cada cambio de estado
       se persiste solo— y un sonido en cada uno, encima del clic, sería ruido
       constante. Pero un botón que pone "Guardar" es otra cosa: ahí guardar **es
       el propósito del gesto**, no un efecto secundario.

       ⚠️ Suena al pulsar, no al confirmarse. Si el guardado falla, el error
       llega detrás desde `saveData()` — que es como se comporta cualquier
       aplicación y sigue siendo información honesta: primero "recibido", luego
       "no ha podido ser". */
    const texto = `${etiqueta} ${el.textContent || ''}`.trim().toLowerCase();
    if (/^guardar\b/.test(texto)) {
      reproducir('ACTION_SAVED');
      return;
    }

    reproducir('UI_CLICK');
  };

  document.addEventListener('click', alTocar, true);
  return () => document.removeEventListener('click', alTocar, true);
}

/* ===========================================================================
   5 · MODO DE PRUEBA (apartado 32)
   ===========================================================================
   *"Crea, si resulta útil, una forma interna de probar… No expongas una
   herramienta de desarrollo peligrosa en producción."*

   No es peligrosa: solo reproduce, no escribe nada y no toca preferencias. Lo
   que sí hace, y por eso vale la pena, es **decir por qué no ha sonado** — que
   hoy será siempre "no hay archivo", y así se ve de un vistazo en vez de
   parecer que el motor está roto.
   =========================================================================== */
export function probarSonidos(tipos = ['UI_CLICK', 'SUCCESS', 'STREAK_MILESTONE', 'NEW_RECORD', 'ACHIEVEMENT_UNLOCKED']) {
  const salida = [];
  let ahora = Date.now();
  for (const t of tipos) {
    // Se separan en el tiempo a mano: si no, la ventana de colisión callaría a
    // los cuatro últimos y la prueba no diría nada útil.
    ahora += 4000;
    const r = reproducir(t, { ahora });
    salida.push({ evento: t, suena: r.suena, motivo: r.motivo, sonido: r.sonido?.id || null });
  }
  return salida;
}
