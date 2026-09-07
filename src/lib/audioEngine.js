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
/* ⚠️ Los patrones de vibración viven en la SO F2 con el resto de la
   especificación. El motor no se los inventa: los pide. */
import { patronDe } from './sonidoProduccion';
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
  palanca: null,            // el interruptor invisible de iOS — ver `vibrar()`
  contextoImposible: false, // crear el AudioContext fallo: no insistir (iOS limita cuantos)
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
  armarLosGestos();
  /* ⚠️ Se devuelve un envoltorio y no `motor.soltarGestos` directamente: los
     oyentes se sueltan y se vuelven a poner solos, así que una referencia
     guardada al montar apuntaría a la tanda de hace media hora. */
  return () => { motor.soltarGestos?.(); };
}

/* ===========================================================================
   🚨 **EL FALLO DEL IPHONE, y por qué en el PC no se veía**
   ===========================================================================
   Josué, 2026-09-07: *"en mi cuenta y en este PC funciona, pero en el iPhone no,
   y encienda o apague el interruptor me sale siempre el aviso: apagado, que lo
   encienda; encendido, que toque algún botón — con todo activado."*

   Ese aviso es literal: el motor NUNCA llegaba a desbloquearse. Dos motivos, y
   los dos explican por qué en un ordenador no pasaba.

   **1 · Había UNA sola oportunidad, y se la llevaba el primer roce.** Los
   oyentes se ponían con `{ once: true }`: se borran al PRIMER evento, haya
   servido o no. En un ordenador el primer gesto es un clic de verdad y funciona.
   En un móvil el primer gesto casi siempre es **arrastrar para bajar la
   pantalla** — un `touchstart` que empieza un desplazamiento, durante el cual
   Safari no concede permiso de audio. Se gastaba el único intento con el dedo
   deslizando, se borraban los oyentes, y ya no había forma de desbloquear nada
   sin recargar. Por eso podía funcionarle al hermano y a él no: depende de si tu
   primer toque fue pulsar o deslizar.

   **2 · Y en iOS no basta con `resume()`.** Safari no da un contexto por
   despierto hasta que ha SONADO algo por él. Hay que empujarle un sonido mudo
   dentro del mismo gesto; sin eso, `resume()` puede resolverse y el contexto
   quedarse igual de dormido.

   Ahora se insiste hasta que funciona de verdad, y los oyentes solo se sueltan
   cuando el contexto está `running`. Insistir es barato; quedarse mudo, no.
   =========================================================================== */
function armarLosGestos() {
  if (!HAY_DOM || motor.soltarGestos) return;
  const alGesto = () => {
    desbloquear().then((listo) => { if (listo) motor.soltarGestos?.(); });
  };
  /* `touchend` y `click` van con los demás a propósito: son los que iOS acepta
     con más seguridad, y llegan cuando el dedo ya ha terminado de moverse. */
  const eventos = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
  for (const e of eventos) document.addEventListener(e, alGesto, { passive: true });
  motor.soltarGestos = () => {
    for (const e of eventos) document.removeEventListener(e, alGesto);
    motor.soltarGestos = null;
  };
}

/**
 * 🚨 El contexto se puede volver a dormir solo: en iOS pasa a `interrupted` con
 * una llamada, con Siri o al bloquear la pantalla, y ahí se queda. Sin esto, el
 * motor seguiría creyéndose desbloqueado y no sonaría nada nunca más.
 */
function alCambiarDeEstado() {
  const ctx = motor.contexto;
  if (!ctx) return;
  const despierto = ctx.state === 'running';
  if (despierto === motor.desbloqueado) return;
  motor.desbloqueado = despierto;
  // Dormido otra vez: se vuelve a esperar un gesto, como al principio.
  if (!despierto) armarLosGestos();
  emitir('AUDIO_ESTADO', { estado: ctx.state });
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

/**
 * 🚨 **Dos trampas aquí, y la segunda la habría creado el arreglo de arriba.**
 *
 * **1 · Un `catch` que tiraba el contexto entero.** Si fallaba UN nodo de
 * volumen, se ponía `motor.contexto = null` y se perdía un contexto que estaba
 * perfectamente creado. Y sin nodos no pasa nada grave: `reproducir()` ya sabe
 * caer al destino directo. Ahora se separan los dos errores.
 *
 * **2 · Y ahora que se reintenta en cada gesto, insistir sería peor.** Safari de
 * iOS **limita cuántos `AudioContext` puede crear una página** (unos pocos, y no
 * se recuperan). Con el contexto puesto a `null` en cada fallo, cada toque
 * crearía uno nuevo, se agotaría el cupo en segundos y el móvil quedaría mudo
 * para siempre — que es exactamente el síntoma que se está persiguiendo. Si
 * crear uno falla, se apunta y **no se vuelve a intentar**.
 */
function crearContexto() {
  if (motor.contexto || !HAY_DOM) return motor.contexto;
  if (motor.contextoImposible) return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;                       // se usará el respaldo
  try {
    motor.contexto = new Ctx();
  } catch (e) {
    anotar('crearContexto', e);
    motor.contextoImposible = true;            // otro daría el mismo error y gastaría cupo
    return null;
  }
  // A partir de aquí el contexto YA existe: lo que falle no puede costarlo.
  try {
    motor.contexto.addEventListener('statechange', alCambiarDeEstado);
    for (const c of CATEGORIAS_SONIDO) {
      const g = motor.contexto.createGain();
      g.gain.value = volumenEfectivo(motor.prefs, c.id);
      g.connect(motor.contexto.destination);
      motor.ganancias.set(c.id, g);
    }
  } catch (e) { anotar('crearContexto:nodos', e); }
  return motor.contexto;
}

/**
 * 🚨 **El empujón mudo.** Safari de iOS no da un contexto por despierto hasta
 * que ha reproducido algo por él: una muestra de silencio basta, y es
 * inaudible. Se lanza DENTRO del gesto, que es el único momento en que vale.
 *
 * Si el contexto todavía está dormido, la muestra se queda en la cola y suena en
 * cuanto despierte — que es justo lo que hace falta.
 */
function empujarElSilencio(ctx) {
  try {
    const mudo = ctx.createBuffer(1, 1, 22050);
    const fuente = ctx.createBufferSource();
    fuente.buffer = mudo;
    fuente.connect(ctx.destination);
    fuente.start(0);
  } catch (e) { anotar('empujarElSilencio', e); }
}

/**
 * Apartado 16 — despertar el contexto con un gesto. Es lo único que iOS exige, y
 * no hay forma de saltárselo ni se intenta.
 *
 * ⚠️ Devuelve si lo ha conseguido, y eso **no es decoración**: quien la llama
 * suelta los oyentes solo cuando dice que sí. Antes no lo miraba nadie y el
 * único intento se gastaba con el primer dedo que rozara la pantalla.
 */
export async function desbloquear() {
  if (!HAY_DOM) return false;
  const ctx = crearContexto();
  if (!ctx) return false;
  try {
    empujarElSilencio(ctx);                       // primero, y dentro del gesto
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

/**
 * 🚨 **Por qué no suena, dicho para Josué y no para un programador.**
 *
 * Nació de una tarde entera de adivinar: los 46 archivos publicados, el motor
 * conectado, y en su iPhone no sonaba nada — mientras que en el de su hermano
 * sí. Tres mensajes preguntando cosas a ciegas.
 *
 * Con esto lo mira él y me lo dice en una frase. `estadoAudio()` ya tenía los
 * datos; lo que faltaba era que alguien los enseñara.
 *
 * ⚠️ Nada de "AudioContext suspended" ni "0 buffers": eso es lo que la EH F62
 * prohíbe en un texto que lee él. Cada estado dice **qué hacer**, no qué pasa.
 *
 * 🚨 **`prefs` no es un adorno: sin él este aviso va un paso por detrás.**
 *
 * `motor.prefs` es una COPIA. Quien la pone al día es el efecto de `App.jsx`, y
 * React ejecuta los efectos de los hijos ANTES que los del padre — así que en el
 * mismo renderizado en que Josué enciende el interruptor, el panel de Ajustes ya
 * ha preguntado y el motor todavía contesta "apagado". Y ahí se queda, porque el
 * panel solo vuelve a preguntar cuando pasa algo en el bus.
 *
 * Eso fue exactamente lo del 2026-09-06 en su iPhone: **el interruptor encendido
 * y el recuadro diciéndole que lo encendiera.** El mismo sitio que acababa de
 * dejar de mentirle sobre los archivos, mintiéndole ahora sobre el interruptor.
 *
 * Quien tiene las preferencias delante las pasa, y entonces manda la verdad en
 * vez del reflejo. El motor queda de respaldo, para quien no las tenga.
 */
export function diagnosticoAudio(prefs = null) {
  const e = estadoAudio();
  const activado = prefs ? !!prefs.activado : e.activado;
  if (!e.disponible) {
    return { ok: false, texto: 'Este navegador no puede reproducir sonido. Prueba con Safari o Chrome.' };
  }
  if (!activado) {
    // «Aquí debajo», no «arriba»: el interruptor va justo bajo este recuadro.
    return { ok: false, texto: 'El sonido está apagado. Enciende el interruptor 🔊 Sonidos, aquí debajo.' };
  }
  if (!e.desbloqueado) {
    /* No es un fallo: iOS y Safari exigen que la primera vez el sonido nazca de
       un toque de verdad. Se explica en vez de dejar un "no funciona".

       🚨 Y se distinguen dos situaciones que antes daban el MISMO texto, que es
       lo que dejó a Josué dando vueltas: si el contexto ni siquiera existe es
       que aún no ha tocado nada; si existe y sigue dormido es que se ha
       intentado y el navegador no ha dejado — y entonces el consejo es otro. */
    if (e.contexto === 'sin_crear') {
      return { ok: false, texto: 'Toca cualquier botón para activar el sonido. Los navegadores del móvil lo piden la primera vez.' };
    }
    /* ⚠️ Y si al intentarlo saltó un error, se enseña. Estaba apuntado desde el
       primer día en `motor.fallos` y no lo leía nadie: tres días adivinando con
       la respuesta guardada en memoria. */
    const ultimo = motor.fallos[motor.fallos.length - 1];
    return {
      ok: false,
      texto: 'Lo he intentado y el navegador todavía no deja sonar. Pulsa un botón de verdad —deslizar para bajar la pantalla no cuenta— y vuelve a mirar aquí.',
      aviso: 'Si tienes un iPhone: el interruptor de silencio del lateral también calla las webs.',
      detalle: ultimo ? `${ultimo.donde}: ${ultimo.mensaje}` : '',
    };
  }
  const fallos = fallosDeAudio().length;
  if (fallos > 0) {
    return { ok: false, texto: `El sonido está listo, pero ${fallos} ${fallos === 1 ? 'archivo no se pudo cargar' : 'archivos no se pudieron cargar'}. Puede ser la conexión.` };
  }
  return {
    ok: true,
    texto: e.cargados > 0
      ? `Todo listo. ${e.cargados} ${e.cargados === 1 ? 'sonido cargado' : 'sonidos cargados'}.`
      : 'Todo listo. Los sonidos se cargan al usarlos.',
    /* ⚠️ Lo único que el código no puede saber, y que hay que decir: en iPhone
       el interruptor lateral de silencio calla también el sonido de las webs. */
    aviso: 'Si tienes un iPhone y sigues sin oír nada, mira el interruptor de silencio del lateral: silencia también las webs.',
  };
}

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
   2 bis · VIBRAR (apartado 22)
   ===========================================================================
   🚨 **Esto no existía, y el interruptor llevaba cinco fases puesto.**

   `vibracion` estaba en las preferencias, tenía su casilla en Ajustes y su
   patrón por categoría escrito en la SO F2… y **nadie llamaba a
   `navigator.vibrate` en toda la aplicación**. Josué lo encendía y no pasaba
   nada. Es la regla 8 —ningún control decorativo— incumplida a la vista de
   todos, y sobrevivió porque *parecía* implementada: había preferencia, había
   casilla y había especificación. Faltaba la línea que la usa.

   ⚠️ **Y en iPhone Apple no deja.** No es un fallo que se pueda arreglar aquí:
   `navigator.vibrate` no existe en Safari de iOS, ni en Chrome de iOS (que por
   dentro es Safari). Lo único que hay desde iOS 17.4 es que un interruptor
   nativo —`<input type="checkbox" switch>`— da un toque háptico al cambiar. Se
   intenta con eso, se detecta si existe, y **la pantalla dice la verdad sobre
   lo que puede pasar**. No se promete lo que no se puede cumplir.
   =========================================================================== */

/** El interruptor invisible de iOS 17.4+. Se crea una sola vez, y solo si hace falta. */
function palancaHaptica() {
  if (!HAY_DOM) return null;
  if (motor.palanca) return motor.palanca;
  // Si el navegador no entiende el atributo `switch`, no hay nada que intentar.
  const prueba = document.createElement('input');
  if (!('switch' in prueba)) return null;
  prueba.type = 'checkbox';
  prueba.switch = true;
  prueba.setAttribute('aria-hidden', 'true');
  prueba.tabIndex = -1;
  /* ⚠️ Ni `display:none` ni `visibility:hidden`: un elemento que no se pinta no
     da háptica. Se deja pintado, de un píxel y transparente, y fuera del alcance
     del ratón para que nadie pueda tocarlo sin querer. */
  prueba.style.cssText = 'position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(prueba);
  motor.palanca = prueba;
  return prueba;
}

/** Qué se puede hacer aquí: 'vibrar' (Android y escritorio), 'toque' (iOS 17.4+) o null. */
export function soporteVibracion() {
  if (!HAY_DOM) return null;
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') return 'vibrar';
  if ('switch' in document.createElement('input')) return 'toque';
  return null;
}

/**
 * Vibra con el patrón del evento. **Nunca sube un error**: un móvil que ignora
 * la orden, una pestaña en segundo plano o un iPhone que no puede acaban en
 * `false`, y la aplicación sigue igual (apartado 26).
 */
export function vibrar(tipo) {
  const soporte = soporteVibracion();
  if (!soporte) return false;
  try {
    if (soporte === 'vibrar') return navigator.vibrate(patronDe(tipo).ms) === true;
    const palanca = palancaHaptica();
    if (!palanca) return false;
    palanca.checked = !palanca.checked;   // el cambio es lo que da el toque
    palanca.dispatchEvent(new Event('change', { bubbles: false }));
    return true;
  } catch (e) { anotar(`vibrar:${tipo}`, e); return false; }
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

  /* 🚨 La vibración va ANTES del `return`, y por eso está aquí y no dentro del
     bloque que reproduce: son dos interruptores (apartado 22). Con el sonido
     apagado y la vibración encendida, `decision.suena` es `false` y `vibra` es
     `true` — y ése es justo el caso de una clase, que es cuando más falta hace. */
  if (decision.vibra) vibrar(tipo);

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
  try { motor.palanca?.remove(); } catch (e) { anotar('detener', e); }
  motor.palanca = null;
  try { motor.contexto?.close(); } catch (e) { anotar('detener', e); }
  motor.contexto = null;
  motor.ganancias.clear();
  motor.buffers.clear();
  motor.cargando.clear();
  motor.desbloqueado = false;
  motor.contextoImposible = false;
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
