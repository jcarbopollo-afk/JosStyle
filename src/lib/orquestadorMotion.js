/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 11 — EL ORQUESTADOR (orquestación global, coordinación
   y motion engine avanzado)

   *"No quiero una colección de animaciones. Quiero un Motion Engine real y
   orquestado."* De la F1 a la F10 cada sistema aprendió a moverse; esta capa
   decide qué pasa cuando dos coinciden: quién manda sobre cada propiedad, quién
   espera, quién se cancela y desde dónde sigue lo que se interrumpe.

   ⚠️ Es una HOJA del árbol de imports: no importa nada (ni `motion.js`), así que
   el motor de la F1 puede pasar por aquí sin un ciclo. Las duraciones llegan en
   milisegundos —las calcula quien llama con `duracionMs`—, y el modo «Sin
   movimiento» se lee del mismo atributo que lee `contextoDelDocumento`.

   🚨 Apartado 40: *"NO conviertas esto en un framework propio gigantesco."* No
   hay un estado global de React, ni una librería, ni una segunda forma de
   animar: todo sigue siendo la Web Animations API y el CSS de siempre. Lo que
   se añade es un REGISTRO —qué anima a qué elemento, de qué sistema, con qué
   prioridad— y las reglas que se aplican al empezar algo nuevo.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────────────────────────
   1 · LAS PRIORIDADES (apartado 7)

   Una navegación no pierde frente a una microinteracción. Lo crítico (una
   confirmación que hay que leer) va por encima de todo. Y el DEDO, aparte: un
   gesto no compite por prioridad, TOMA EL CONTROL (`tomarControl`, apartado 14).
   ─────────────────────────────────────────────────────────────────────────── */
export const PRIORIDADES_MOTION = Object.freeze([
  { id: 'critica', peso: 7, que: 'Lo que hay que leer o decidir ya: una confirmación, una alerta.' },
  { id: 'navegacion', peso: 6, que: 'Cambiar de pantalla, abrir o cerrar una capa, una tarjeta que crece hasta su pantalla.' },
  { id: 'gesto', peso: 5, que: 'Lo que sigue al dedo y lo que pasa al soltarlo.' },
  { id: 'estado', peso: 4, que: 'Lo que cuenta un estado real: guardando, hecho, error, un aviso que entra o sale, un dato que cambia.' },
  { id: 'layout', peso: 3, que: 'Lo que se recoloca: listas que cambian, desplegables que crecen.' },
  { id: 'micro', peso: 2, que: 'La respuesta de un control: pulsar, un interruptor, un chevron, un latido.' },
  { id: 'decorativa', peso: 1, que: 'Lo que adorna: la cascada de una portada, la llama de una racha.' },
]);
export const pesoDe = (id) => (PRIORIDADES_MOTION.find((p) => p.id === id) || PRIORIDADES_MOTION[PRIORIDADES_MOTION.length - 1]).peso;

/* ───────────────────────────────────────────────────────────────────────────
   2 · QUIÉN MANDA EN CADA MOVIMIENTO (apartados 1, 2 y 3)

   Cada sistema, su fase, sus archivos, por dónde anima (CSS, Web Animations,
   estilo directo, React) y QUÉ propiedades toca. Un componente no compite con
   el sistema que ya controla su movimiento: si necesita moverse, se lo pide.
   ─────────────────────────────────────────────────────────────────────────── */
export const SISTEMAS_MOTION = Object.freeze([
  { id: 'motor', nombre: 'Motion Engine', fase: 1, prioridad: 'estado', via: ['waapi'], propiedades: ['transform', 'opacity'],
    archivos: ['src/lib/motion.js', 'src/components/motion.jsx'],
    manda: 'Los tokens, los modos y las primitivas: `Presencia` (aparecer y desaparecer, el aviso de «hecho»), `useFlip`, `animar`.' },
  { id: 'navegacion', nombre: 'Navigation Motion', fase: 2, prioridad: 'navegacion', via: ['css'], propiedades: ['transform', 'opacity'],
    archivos: ['src/lib/transicionNavegacion.js', 'src/components/navegacionMotion.js'],
    manda: 'El contenedor de cada pantalla al entrar, volver o cambiar de sección, el indicador de la barra de abajo y las pestañas de dentro (`CambioDeContenido`).' },
  { id: 'scroll', nombre: 'Scroll Motion', fase: 2, prioridad: 'navegacion', via: ['navegador'], propiedades: ['scroll'],
    archivos: ['src/components/navegacionMotion.js'],
    manda: 'El scroll de cada pantalla (entrar empieza arriba, volver deja donde estaba). No hay ninguna animación ligada al scroll: las cabeceras son `sticky` y no cambian de tamaño (apartado 25).' },
  { id: 'micro', nombre: 'Microinteraction Motion', fase: 3, prioridad: 'micro', via: ['css', 'waapi'], propiedades: ['transform', 'opacity', 'background-color', 'color', 'scale'],
    archivos: ['src/lib/microinteraccionesMotion.js', 'src/components/motion.jsx', 'src/index.css'],
    manda: 'Pulsar (`ESCALAS_AL_TOCAR`), los interruptores, el chevron que gira, el latido de una marca.' },
  { id: 'datos', nombre: 'Data Motion', fase: 4, prioridad: 'estado', via: ['react', 'raf', 'recharts'], propiedades: ['texto', 'width'],
    archivos: ['src/lib/datosMotion.js', 'src/components/motion.jsx'],
    manda: 'Las cifras que cambian (`CifraQueCambia`), las gráficas gobernadas y las barras de progreso.' },
  { id: 'gestos', nombre: 'Gesture Motion', fase: 5, prioridad: 'gesto', via: ['estilo', 'waapi'], propiedades: ['transform', 'background-color'],
    archivos: ['src/lib/gestosMotion.js', 'src/lib/fisicaMotion.js', 'src/components/gestosMotion.jsx'],
    manda: 'Lo que se arrastra (el asa de una hoja, deslizar para cambiar de ejercicio) y el muelle al soltar (F8).' },
  { id: 'profundidad', nombre: 'Depth Motion', fase: 6, prioridad: 'navegacion', via: ['waapi', 'css'], propiedades: ['background-color', 'transform', 'opacity'],
    archivos: ['src/lib/profundidad.js', 'src/components/capasMotion.js'],
    manda: 'La entrada y la salida de cada capa (hoja, ventana, pantalla por encima, visor) y su velo.' },
  { id: 'continuidad', nombre: 'Shared Element Motion', fase: 7, prioridad: 'navegacion', via: ['waapi'], propiedades: ['clip-path', 'opacity', 'transform', 'filter'],
    archivos: ['src/lib/continuidad.js', 'src/components/continuidad.jsx'],
    manda: 'La pantalla que crece desde su tarjeta, la tarjeta que se posa al volver y el elemento compartido.' },
  { id: 'estados', nombre: 'State / Feedback Motion', fase: 9, prioridad: 'estado', via: ['css'], propiedades: ['opacity', 'border-color', 'box-shadow', 'visibility'],
    archivos: ['src/lib/estadosInteraccion.js', 'src/components/ui.jsx'],
    manda: 'Un botón que espera, un campo enfocado o con error, el mensaje de un campo, el esqueleto y los vacíos.' },
  { id: 'layout', nombre: 'Layout Motion', fase: 10, prioridad: 'layout', via: ['waapi', 'css'], propiedades: ['transform', 'opacity', 'grid-template-rows'],
    archivos: ['src/lib/layoutMotion.js', 'src/components/layoutMotion.jsx'],
    manda: 'Las listas que cambian (`ListaAnimada`) y lo que se abre y se cierra en su sitio (`Plegable`).' },
  { id: 'decorativa', nombre: 'Decorative Motion', fase: 18, prioridad: 'decorativa', via: ['css'], propiedades: ['transform', 'opacity'],
    archivos: ['src/index.css'],
    manda: 'La cascada de una portada, la llama y el «+1» de una racha, subir de rango.' },
]);
export const sistemaMotion = (id) => SISTEMAS_MOTION.find((s) => s.id === id) || null;

/** El dueño de una entrada del MOTION_MAP: por su fase, salvo las que la F0 dejó para fases de pulido. */
const DUENO_POR_FASE = Object.freeze({ 0: 'motor', 1: 'motor', 2: 'navegacion', 3: 'micro', 4: 'datos', 5: 'gestos', 6: 'profundidad', 7: 'continuidad', 8: 'gestos', 9: 'estados', 10: 'layout', 16: 'estados', 17: 'datos', 18: 'decorativa' });
const DUENO_POR_ID = Object.freeze({ racha_sube: 'decorativa', rango_sube: 'decorativa' });
export function duenoDeEntrada(entrada) {
  if (!entrada) return null;
  return DUENO_POR_ID[entrada.id] || DUENO_POR_FASE[entrada.fase] || null;
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LAS PROPIEDADES Y LOS CONFLICTOS (apartados 8 y 9)

   Dos animaciones chocan si quieren la MISMA propiedad del MISMO elemento. Lo
   que no choca, convive (`opacity` de una y `transform` de otra). Y las
   propiedades individuales de transformación —`translate`, `scale`, `rotate`—
   se COMPONEN con `transform` (el navegador las aplica antes), así que son la
   forma de combinar movimientos de dos sistemas sin que uno pise al otro.
   ─────────────────────────────────────────────────────────────────────────── */
const NO_SON_PROPIEDADES = new Set(['offset', 'easing', 'composite', 'computedOffset']);
const aGuiones = (p) => String(p).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Las propiedades que anima un juego de fotogramas (en CSS: `clip-path`, no `clipPath`). */
export function propiedadesDe(fotogramas) {
  const lista = Array.isArray(fotogramas) ? fotogramas : (fotogramas ? [fotogramas] : []);
  const out = new Set();
  lista.forEach((f) => Object.keys(f || {}).forEach((k) => { if (!NO_SON_PROPIEDADES.has(k)) out.add(aGuiones(k)); }));
  return [...out].sort();
}

/** ¿Quieren dos listas de propiedades la misma? */
export function chocan(a = [], b = []) {
  const B = new Set(b);
  return a.filter((p) => B.has(p));
}

/**
 * Qué hacer cuando empieza `nueva` y ya está `enMarcha` sobre el mismo elemento.
 * Las dos son `{ sistema, prioridad, propiedades }`.
 *   · `coexisten` — no tocan la misma propiedad.
 *   · `interrumpe` — la nueva manda: la de antes se para DONDE SE VE y la nueva sale de ahí.
 *   · `cede` — la de antes es más importante: la nueva no empieza (el elemento ya está en su estado final).
 * Regla: más peso gana; con el mismo peso gana la última (un cambio a mitad de otro sale de donde se ve).
 */
export function resolverConflicto(enMarcha, nueva) {
  if (!enMarcha || !nueva) return { accion: 'coexisten', motivo: 'sin_otra' };
  const comunes = chocan(enMarcha.propiedades, nueva.propiedades);
  if (!comunes.length) return { accion: 'coexisten', motivo: 'otras_propiedades', comunes };
  const a = pesoDe(enMarcha.prioridad);
  const b = pesoDe(nueva.prioridad);
  if (b < a) return { accion: 'cede', motivo: 'prioridad', comunes };
  return { accion: 'interrumpe', motivo: b > a ? 'prioridad' : (enMarcha.sistema === nueva.sistema ? 'mismo_sistema' : 'la_ultima'), comunes };
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · LA LÍNEA DE TIEMPO (apartados 4, 5 y 6)

   Un plan PURO: cada paso dice cuánto dura y de quién depende, y sale cuándo
   empieza. Así se expresa cualquier forma sin código por pantalla:
     · secuencial:  B despuesDe A
     · paralelo:    sin dependencias
     · escalonado:  `escalonado: { indice, paso }`
     · retrasado:   `retraso`
     · dependiente: `despuesDe: ['B', 'C', 'E']` (D espera a los tres)
     · solapado:    `solape: 0.5` (empieza a mitad del que espera, «item → exit → remaining move»)
   ─────────────────────────────────────────────────────────────────────────── */
export function planificarLinea(pasos = []) {
  const porId = new Map();
  pasos.forEach((p, i) => porId.set(p.id || `paso-${i}`, { ...p, id: p.id || `paso-${i}` }));
  const hechos = new Map();
  const visitando = new Set();
  const calcular = (id) => {
    if (hechos.has(id)) return hechos.get(id);
    const p = porId.get(id);
    if (!p) throw new Error(`La línea de tiempo depende de un paso que no existe: ${id}`);
    if (visitando.has(id)) throw new Error(`La línea de tiempo tiene un ciclo en ${id}`);
    visitando.add(id);
    const deps = p.despuesDe ? (Array.isArray(p.despuesDe) ? p.despuesDe : [p.despuesDe]) : [];
    const solape = Number.isFinite(p.solape) ? Math.min(1, Math.max(0, p.solape)) : 1;
    const base = deps.length ? Math.max(...deps.map((d) => { const x = calcular(d); return x.inicio + (x.fin - x.inicio) * solape; })) : 0;
    const escalon = p.escalonado ? Math.max(0, Number(p.escalonado.indice) || 0) * Math.max(0, Number(p.escalonado.paso) || 0) : 0;
    const inicio = Math.round(base + Math.max(0, Number(p.retraso) || 0) + escalon);
    const fin = inicio + Math.max(0, Number(p.duracion) || 0);
    visitando.delete(id);
    const r = { id, inicio, fin };
    hechos.set(id, r);
    return r;
  };
  const salida = [...porId.keys()].map(calcular);
  return { pasos: salida, total: salida.reduce((m, x) => Math.max(m, x.fin), 0) };
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · EL REGISTRO (apartados 8, 12, 13, 14, 16 y 38)

   Funciona sobre cualquier objeto que se parezca a un elemento (`animate`), así
   que se prueba en Node con un doble y en Chromium con el de verdad. Cada
   animación que pasa por aquí queda apuntada con su sistema, su prioridad, sus
   propiedades y su grupo, y se borra sola al terminar o al cancelarse — con
   guarda de identidad, para que el final de una vieja no borre a la nueva
   (apartado 16: *"A finishes, B cancels, A callback modifies state"*).
   ─────────────────────────────────────────────────────────────────────────── */
const VIVAS = new Map(); // elemento → Set de registros (Map y no WeakMap: hay que poder contarlas; se vacía sola)
const GRUPOS = new Map(); // nombre → { corrida, registros: Set, estado }
let SECUENCIA = 0;

/** Lo que hay que saber de cada momento; no es estado de React (apartado 13). */
export const ESTADOS_MOTION = Object.freeze(['idle', 'running', 'interrupting', 'cancelled', 'completed']);

/* — El modo depuración (apartados 35-37): solo en desarrollo y si se pide. — */
const enDesarrollo = () => {
  try { return !!(import.meta && import.meta.env && import.meta.env.DEV); } catch { return false; }
};
export const CLAVE_DEPURACION = 'josstyle:motion-debug';
let depuracionForzada = null;
/** Para las pruebas: fuerza el modo depuración sin tocar el almacenamiento. */
export const forzarDepuracion = (v) => { depuracionForzada = v === null ? null : !!v; };
export function depurando() {
  if (depuracionForzada !== null) return depuracionForzada;
  if (!enDesarrollo()) return false;
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(CLAVE_DEPURACION) === '1'; } catch { return false; }
}
export const EVENTOS_MOTION = Object.freeze(['MOTION_START', 'MOTION_CANCEL', 'MOTION_COMPLETE', 'MOTION_INTERRUPT', 'MOTION_ERROR']);
const DIARIO = [];
export const TOPE_DIARIO = 200;
function apuntar(tipo, r, extra = {}) {
  if (!depurando()) return;
  const evento = { tipo, t: Math.round(typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()), id: r && r.id, sistema: r && r.sistema, prioridad: r && r.prioridad, grupo: r && r.grupo, propiedades: r && r.propiedades, ...extra };
  DIARIO.push(evento);
  if (DIARIO.length > TOPE_DIARIO) DIARIO.shift();
  try { if (typeof console !== 'undefined' && console.debug) console.debug(`[motion] ${tipo}`, evento); } catch { /* sin consola, sin diario visible */ }
}
export const diarioMotion = () => DIARIO.slice();
export const vaciarDiario = () => { DIARIO.length = 0; };

/* El dibujo de depuración: un contorno con el nombre del sistema mientras se anima. Nunca en producción. */
let estiloDepuracion = false;
function marcar(el, r, encender) {
  if (!depurando() || !el || !el.setAttribute) return;
  try {
    if (encender) {
      el.setAttribute('data-motion-sistema', `${r.sistema}·${r.prioridad}${r.grupo ? `·${r.grupo}` : ''}`);
      if (!estiloDepuracion && typeof document !== 'undefined' && document.head) {
        const s = document.createElement('style');
        s.setAttribute('data-motion-depuracion', '');
        s.textContent = '[data-motion-sistema]{outline:1px dashed rgba(255,80,160,.9)!important;outline-offset:-1px}';
        document.head.appendChild(s);
        estiloDepuracion = true;
      }
    } else if (![...(VIVAS.get(el) || [])].length) {
      el.removeAttribute('data-motion-sistema');
    }
  } catch { /* depurar nunca rompe nada */ }
}

const viva = (a) => !!a && a.playState !== 'finished' && a.playState !== 'idle';

function quitarRegistro(r) {
  const set = VIVAS.get(r.el);
  if (set) { set.delete(r); if (!set.size) VIVAS.delete(r.el); }
  if (r.grupo) {
    const g = GRUPOS.get(r.grupo);
    if (g && g.registros.has(r)) {
      g.registros.delete(r);
      if (!g.registros.size && g.estado === 'running') g.estado = r.final === 'completada' ? 'completed' : 'cancelled';
    }
  }
  marcar(r.el, r, false);
}

/** Las animaciones vivas de un elemento que pasaron por el orquestador. */
export function animacionesDe(el) {
  const set = VIVAS.get(el);
  if (!set) return [];
  [...set].forEach((r) => { if (!viva(r.anim)) quitarRegistro(r); });
  return [...(VIVAS.get(el) || [])];
}

/** Lo que se ve AHORA de unas propiedades (antes de cancelar lo que las mueve). */
function loQueSeVe(el, propiedades) {
  const out = {};
  try {
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(el) : (el.style || {});
    propiedades.forEach((p) => {
      const v = typeof cs.getPropertyValue === 'function' ? cs.getPropertyValue(p) : cs[p];
      if (v !== undefined && v !== null && v !== '') out[p.replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = v;
    });
  } catch { /* sin estilo calculado, se sale del primer fotograma */ }
  return out;
}

/** «Sin movimiento» es una política global (apartado 27): aquí no empieza nada. */
const sinMovimiento = () => {
  try { return typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute('data-motion') === 'off'; } catch { return false; }
};

/** El presupuesto (apartado 30): con demasiadas a la vez, lo micro y lo decorativo no empiezan. */
export const PRESUPUESTO_ORQUESTADOR = Object.freeze({ simultaneas: 48, cedenPorPresupuesto: ['micro', 'decorativa'] });
export function enMarcha() {
  let n = 0;
  [...VIVAS.keys()].forEach((el) => { n += animacionesDe(el).length; });
  return n;
}

/**
 * Anima un elemento A TRAVÉS del orquestador (apartados 4, 8, 14 y 38).
 *   `meta`: `{ sistema, prioridad?, grupo?, id?, desdeLoQueSeVe? }`. Sin prioridad, la de su sistema.
 * Devuelve la animación, o `null` si no empieza: sin `animate`, «Sin movimiento», porque cede ante una más
 * importante, por presupuesto o porque el navegador falla. En los cinco casos el elemento queda en su estado
 * final —el del DOM—: una animación que no puede ejecutarse nunca rompe la función (apartado 28).
 */
export function animarOrquestado(el, fotogramas, opciones = {}, meta = {}) {
  if (!el || typeof el.animate !== 'function' || !Array.isArray(fotogramas) || fotogramas.length < 1) return null;
  const sistema = meta.sistema || 'motor';
  const prioridad = meta.prioridad || (sistemaMotion(sistema) || {}).prioridad || 'estado';
  const propiedades = propiedadesDe(fotogramas);
  const id = meta.id || opciones.id || null;
  const nueva = { sistema, prioridad, propiedades };
  if (sinMovimiento()) return null;
  if (PRESUPUESTO_ORQUESTADOR.cedenPorPresupuesto.includes(prioridad) && enMarcha() >= PRESUPUESTO_ORQUESTADOR.simultaneas) {
    apuntar('MOTION_CANCEL', { id, sistema, prioridad, propiedades }, { motivo: 'presupuesto' });
    return null;
  }
  const previas = animacionesDe(el);
  const decisiones = previas.map((r) => ({ r, d: resolverConflicto(r, nueva) }));
  const gana = decisiones.find(({ d }) => d.accion === 'cede');
  if (gana) {
    apuntar('MOTION_CANCEL', { id, sistema, prioridad, propiedades }, { motivo: 'cede', ante: gana.r.sistema });
    return null;
  }
  const aInterrumpir = decisiones.filter(({ d }) => d.accion === 'interrumpe');
  let frames = fotogramas;
  if (aInterrumpir.length && meta.desdeLoQueSeVe) {
    const comunes = [...new Set(aInterrumpir.flatMap(({ d }) => d.comunes))];
    frames = [{ ...fotogramas[0], ...loQueSeVe(el, comunes) }, ...fotogramas.slice(1)];
  }
  aInterrumpir.forEach(({ r }) => {
    r.final = 'interrumpida';
    apuntar('MOTION_INTERRUPT', r, { por: sistema });
    try { r.anim.cancel(); } catch { /* ya no estaba */ }
    quitarRegistro(r);
  });
  let anim;
  try {
    anim = el.animate(frames, id ? { ...opciones, id } : opciones);
  } catch (error) {
    apuntar('MOTION_ERROR', { id, sistema, prioridad, propiedades }, { error: String(error && error.message || error) });
    return null;
  }
  if (!anim) return null;
  if (camara) ajustarRitmo(anim);
  SECUENCIA += 1;
  const r = { n: SECUENCIA, el, anim, id, sistema, prioridad, propiedades, grupo: meta.grupo || null, final: null };
  if (!VIVAS.has(el)) VIVAS.set(el, new Set());
  VIVAS.get(el).add(r);
  if (r.grupo) {
    const g = GRUPOS.get(r.grupo) || { corrida: 0, registros: new Set(), estado: 'idle' };
    g.registros.add(r);
    g.estado = 'running';
    GRUPOS.set(r.grupo, g);
  }
  marcar(el, r, true);
  apuntar('MOTION_START', r, { duracion: opciones.duration });
  const alAcabar = () => {
    if (r.final === null) { r.final = 'completada'; apuntar('MOTION_COMPLETE', r); }
    quitarRegistro(r);
  };
  const alCancelar = () => {
    if (r.final === null) { r.final = 'cancelada'; apuntar('MOTION_CANCEL', r, { motivo: 'cancelada' }); }
    quitarRegistro(r);
  };
  if (anim.finished && typeof anim.finished.then === 'function') anim.finished.then(alAcabar, alCancelar);
  return anim;
}

/**
 * El usuario TOMA EL CONTROL de unas propiedades (apartado 14, y la F5): lo que se movía se para DONDE SE
 * VE —se lee antes de cancelar— y lo devuelve, para que el dedo siga desde ahí. Sea cual sea su prioridad:
 * entre animaciones manda la prioridad; sobre el dedo no manda ninguna.
 * Cancela también las animaciones que no pasaron por aquí (`getAnimations`) sobre esas propiedades.
 */
export function tomarControl(el, propiedades = [], sistema = 'gestos') {
  if (!el) return {};
  const visto = loQueSeVe(el, propiedades);
  animacionesDe(el).filter((r) => chocan(r.propiedades, propiedades).length).forEach((r) => {
    r.final = 'interrumpida';
    apuntar('MOTION_INTERRUPT', r, { por: sistema, motivo: 'el_dedo' });
    try { r.anim.cancel(); } catch { /* ya no estaba */ }
    quitarRegistro(r);
  });
  try {
    (el.getAnimations ? el.getAnimations() : []).forEach((a) => {
      const ps = a.effect && typeof a.effect.getKeyframes === 'function' ? propiedadesDe(a.effect.getKeyframes()) : [];
      if (chocan(ps, propiedades).length) a.cancel();
    });
  } catch { /* sin `getAnimations`, no hay nada más que parar */ }
  return visto;
}

/** Para las animaciones de UN sistema en un elemento (las suyas: un cambio a mitad de otro). */
export function cancelarDe(el, sistema) {
  animacionesDe(el).filter((r) => r.sistema === sistema).forEach((r) => {
    r.final = 'interrumpida';
    apuntar('MOTION_INTERRUPT', r, { por: sistema, motivo: 'mismo_sistema' });
    try { r.anim.cancel(); } catch { /* ya no estaba */ }
    quitarRegistro(r);
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · LOS GRUPOS (apartado 12)

   Un grupo junta lo que es UNA operación —abrir una capa (velo y caja), una
   lista que cambia (lo que sale, lo que se recoloca, lo que entra)— y se puede
   iniciar, cancelar, completar y consultar. Iniciar un grupo que sigue en
   marcha lo INTERRUMPE primero: abrir otra pantalla antes de que termine la
   anterior (apartado 14).
   ─────────────────────────────────────────────────────────────────────────── */
export function iniciarGrupo(nombre) {
  const g = GRUPOS.get(nombre) || { corrida: 0, registros: new Set(), estado: 'idle' };
  if (g.registros.size) {
    g.estado = 'interrupting';
    [...g.registros].forEach((r) => {
      r.final = 'interrumpida';
      apuntar('MOTION_INTERRUPT', r, { motivo: 'grupo_reiniciado' });
      try { r.anim.cancel(); } catch { /* ya no estaba */ }
      quitarRegistro(r);
    });
  }
  g.corrida += 1;
  g.estado = 'idle';
  GRUPOS.set(nombre, g);
  return g.corrida;
}
export function estadoDeGrupo(nombre) {
  const g = GRUPOS.get(nombre);
  if (!g) return 'idle';
  [...g.registros].forEach((r) => { if (!viva(r.anim)) quitarRegistro(r); });
  return g.estado;
}
export function cancelarGrupo(nombre) {
  const g = GRUPOS.get(nombre);
  if (!g) return 0;
  const n = g.registros.size;
  [...g.registros].forEach((r) => { r.final = 'cancelada'; apuntar('MOTION_CANCEL', r, { motivo: 'grupo' }); try { r.anim.cancel(); } catch { /* ya no estaba */ } quitarRegistro(r); });
  g.estado = 'cancelled';
  return n;
}
export function completarGrupo(nombre) {
  const g = GRUPOS.get(nombre);
  if (!g) return 0;
  const n = g.registros.size;
  [...g.registros].forEach((r) => { try { r.anim.finish(); } catch { try { r.anim.cancel(); } catch { /* ya no estaba */ } } });
  return n;
}
/* MS F15 (apartados 20, 42 y 52) — al girar el teléfono o cambiar el ancho de la ventana, lo que viaja con
   una geometría medida ANTES (una hoja que sube su alto de entonces, una tarjeta que crece desde un rectángulo
   que ya no está ahí, una fila que se recoloca con FLIP) acabaría en su sitio, pero cruzaría el diseño nuevo
   con las medidas del viejo. No se recalcula nada: se ASIENTA —salta a su final, que es el del DOM— y el diseño
   nuevo aparece quieto. *"La estabilidad tiene prioridad sobre el espectáculo."* Lo que no depende de la
   geometría (un color, una cifra, un toque, un bucle) sigue a lo suyo. */
export const SISTEMAS_QUE_SE_ASIENTAN = Object.freeze(['navegacion', 'profundidad', 'continuidad', 'layout', 'motor']);
export function asentarMovimiento(motivo = 'cambio_de_diseno', sistemas = SISTEMAS_QUE_SE_ASIENTAN) {
  let n = 0;
  [...VIVAS.keys()].forEach((el) => animacionesDe(el).forEach((r) => {
    if (!sistemas.includes(r.sistema)) return;
    n += 1;
    r.final = 'completada';
    apuntar('MOTION_COMPLETE', r, { motivo });
    try { r.anim.finish(); } catch { try { r.anim.cancel(); } catch { /* ya no estaba */ } }
    quitarRegistro(r);
  }));
  return n;
}

/** Una promesa que se cumple cuando todo lo del grupo ha terminado (o se ha cancelado). */
export function terminaGrupo(nombre) {
  const g = GRUPOS.get(nombre);
  if (!g || !g.registros.size) return Promise.resolve(estadoDeGrupo(nombre));
  return Promise.all([...g.registros].map((r) => (r.anim.finished ? r.anim.finished.then(() => null, () => null) : null))).then(() => estadoDeGrupo(nombre));
}

/** El estado global, mínimo (apartado 13): qué se mueve, de qué sistema y con qué prioridad. */
export function estadoGlobalMotion() {
  const porSistema = {};
  const porPrioridad = {};
  let total = 0;
  [...VIVAS.keys()].forEach((el) => animacionesDe(el).forEach((r) => {
    total += 1;
    porSistema[r.sistema] = (porSistema[r.sistema] || 0) + 1;
    porPrioridad[r.prioridad] = (porPrioridad[r.prioridad] || 0) + 1;
  }));
  const grupos = {};
  GRUPOS.forEach((g, nombre) => { grupos[nombre] = estadoDeGrupo(nombre); });
  return { estado: total ? 'running' : 'idle', enMarcha: total, porSistema, porPrioridad, grupos };
}

/** Para las pruebas: vacía el registro. */
export function olvidarTodo() {
  VIVAS.clear();
  GRUPOS.clear();
  DIARIO.length = 0;
}

/* ───────────────────────────────────────────────────────────────────────────
   7 · UNA LÍNEA DE TIEMPO QUE SE PUEDE MANEJAR (apartado 6)

   Pequeña: un plan de `planificarLinea` y una animación por paso, todas por el
   orquestador. Empieza pausada si se pide (`pausada`), y se puede reanudar,
   pausar, cancelar, completar, invertir e ir a un punto (`irA(0..1)`).
   ─────────────────────────────────────────────────────────────────────────── */
export function crearLinea(pasos = [], { grupo = null, sistema = 'motor', prioridad = null, pausada = false } = {}) {
  const plan = planificarLinea(pasos.map((p) => ({ id: p.id, duracion: p.duracion, retraso: p.retraso, despuesDe: p.despuesDe, solape: p.solape, escalonado: p.escalonado })));
  if (grupo) iniciarGrupo(grupo);
  const animaciones = [];
  pasos.forEach((p, i) => {
    const cuando = plan.pasos[i];
    const a = animarOrquestado(p.el, p.fotogramas, { duration: p.duracion, easing: p.curva || 'linear', delay: cuando.inicio, fill: p.fill || 'backwards' }, { sistema: p.sistema || sistema, prioridad: p.prioridad || prioridad, grupo, id: p.id, desdeLoQueSeVe: p.desdeLoQueSeVe });
    if (a) { animaciones.push(a); if (pausada && a.pause) a.pause(); }
  });
  const todas = (fn) => animaciones.forEach((a) => { try { fn(a); } catch { /* una que ya terminó no se queja */ } });
  const terminado = Promise.all(animaciones.map((a) => (a.finished ? a.finished.then(() => 'completada', () => 'cancelada') : 'completada')))
    .then((r) => (r.includes('cancelada') ? 'cancelada' : 'completada'));
  return {
    plan,
    animaciones,
    terminado,
    reanudar: () => todas((a) => a.play()),
    pausar: () => todas((a) => a.pause()),
    cancelar: () => todas((a) => a.cancel()),
    completar: () => todas((a) => a.finish()),
    invertir: () => todas((a) => (a.reverse ? a.reverse() : a.updatePlaybackRate(-(a.playbackRate || 1)))),
    irA: (progreso) => { const t = Math.max(0, Math.min(1, Number(progreso) || 0)) * plan.total; todas((a) => { a.currentTime = t; }); },
    estado: () => (grupo ? estadoDeGrupo(grupo) : (animaciones.some(viva) ? 'running' : 'completed')),
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   7 bis · INSPECCIONAR UN ELEMENTO (MS F18, apartados 56 y 57)

   *"¿De quién es esta animación? ¿Qué token? ¿Qué sistema? ¿Por qué se está ejecutando?"* Para lo que pasa
   por aquí, el registro ya lo sabe (sistema, prioridad, grupo, id). Para lo que mueve `index.css`, el
   navegador da el nombre del `@keyframes` o la propiedad, la duración y la curva. Qué TOKEN es cada
   duración y cada curva lo sabe `motion.js`, que este archivo no puede importar (es una hoja del árbol):
   se lo cuenta con `describirInspeccionCon`. Solo en desarrollo, como el resto de la consola.
   ─────────────────────────────────────────────────────────────────────────── */
let describirInspeccion = null;
/** `motion.js` enseña aquí a nombrar duraciones y curvas como tokens. */
export function describirInspeccionCon(fn) { describirInspeccion = typeof fn === 'function' ? fn : null; }

/* Una animación de CSS lleva su curva en los fotogramas, no en el efecto (que dice `linear`). */
const tiempoDe = (anim) => {
  try {
    const t = anim.effect && anim.effect.getTiming ? anim.effect.getTiming() : {};
    let curva = t.easing || 'linear';
    if (curva === 'linear' && anim.effect && typeof anim.effect.getKeyframes === 'function') {
      const k = anim.effect.getKeyframes();
      if (k && k[0] && k[0].easing) curva = k[0].easing;
    }
    return { duracion: Number(t.duration) || 0, retraso: Number(t.delay) || 0, curva };
  } catch { return { duracion: 0, retraso: 0, curva: 'linear' }; }
};

/**
 * Lo que mueve AHORA un elemento: una línea por animación, con su nombre, su duración y su curva (y el
 * token de cada una, si `motion.js` lo ha contado), de dónde sale (`orquestador` con su sistema, o
 * `index.css` con su clase), su prioridad y el elemento que la lleva. Un elemento quieto devuelve `[]`.
 */
export function inspeccionar(el) {
  if (!el || typeof el.getAnimations !== 'function') return [];
  const propias = animacionesDe(el);
  const porAnim = new Map(propias.map((r) => [r.anim, r]));
  const clases = el.classList ? [...el.classList] : [];
  let todas = [];
  try { todas = el.getAnimations(); } catch { todas = []; }
  return todas.filter((a) => a.playState !== 'finished' && a.playState !== 'idle').map((a) => {
    const r = porAnim.get(a);
    const t = tiempoDe(a);
    const css = !r;
    const linea = {
      nombre: css ? (a.animationName || a.transitionProperty || 'css') : (r.id || r.sistema),
      fuente: css ? 'index.css' : 'orquestador',
      sistema: css ? 'css' : r.sistema,
      prioridad: css ? null : r.prioridad,
      grupo: css ? null : r.grupo || null,
      propiedades: css ? (a.transitionProperty ? [a.transitionProperty] : []) : r.propiedades,
      duracion: t.duracion, retraso: t.retraso, curva: t.curva, estado: a.playState,
      elemento: `${(el.tagName || '').toLowerCase()}${clases.length ? `.${clases.join('.')}` : ''}`,
    };
    if (describirInspeccion) { try { Object.assign(linea, describirInspeccion(linea) || {}); } catch { /* depurar nunca rompe nada */ } }
    return linea;
  });
}

/**
 * 🔓 MS F19 (apartado 43) — lo que se mueve AHORA en toda la página: una línea por animación, como
 * `inspeccionar`, de cada elemento que tenga alguna. Es la vista general que el apartado pide a un
 * «overlay», en la consola que ya existe: sin pintar nada encima de la aplicación.
 */
export function inspeccionarTodo(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || typeof doc.getAnimations !== 'function') return [];
  let todas = [];
  try { todas = doc.getAnimations(); } catch { todas = []; }
  const elementos = [...new Set(todas.map((a) => a.effect && a.effect.target).filter(Boolean))];
  return elementos.flatMap((el) => inspeccionar(el));
}

/* ───────────────────────────────────────────────────────────────────────────
   7 ter · LA CÁMARA LENTA (MS F19, apartados 41 y 42)

   *"Un modo lento puede revelar: jumps, bad easing, layout shifts, wrong origin, race conditions. No debe
   utilizarse en producción."* Los tres modos de prueba del apartado 41 ya existían como ajustes de verdad
   —«Sin movimiento» es el instantáneo y la velocidad Lenta el ×1,3—, y un ×1,3 no enseña nada. Esto es otra
   cosa: `window.__motion.camaraLenta(4)` pone a un cuarto de velocidad TODO lo que se mueve —lo de
   `index.css` (al empezar: `animationstart` y `transitionrun`) y lo que pasa por aquí—, y
   `camaraLenta(1)` lo devuelve y quita sus escuchadores. Solo existe con la consola de depuración, que solo
   existe en desarrollo y con la marca puesta. ⚠️ Lo que espera con un reloj en vez de con `finished` se
   adelanta a la animación lenta: es exactamente la carrera que la cámara lenta está para enseñar.
   ─────────────────────────────────────────────────────────────────────────── */
export const CAMARA_LENTA_MAXIMA = 10;
let camara = null;
function ajustarRitmo(anim) {
  if (!camara || !anim) return;
  /* `playbackRate` directo, no `updatePlaybackRate`: conserva el instante en que va y se aplica YA (el otro
     espera al siguiente fotograma, y una entrada corta podría acabar entera antes). */
  try { anim.playbackRate = camara.ritmo; } catch { /* una animación ya terminada no se queja */ }
}
export const ritmoDeCamara = () => (camara ? camara.ritmo : 1);
export function camaraLenta(factor = 1) {
  if (typeof document === 'undefined' || !depurando()) return 1;
  if (camara) {
    document.removeEventListener('animationstart', camara.alEmpezar, true);
    document.removeEventListener('transitionrun', camara.alEmpezar, true);
    const todas = typeof document.getAnimations === 'function' ? document.getAnimations() : [];
    camara = null;
    todas.forEach((a) => { try { a.playbackRate = 1; } catch { /* terminada */ } });
  }
  const f = Number(factor);
  if (!Number.isFinite(f) || f <= 1) return 1;
  const veces = Math.min(f, CAMARA_LENTA_MAXIMA);
  const alEmpezar = (ev) => {
    const el = ev && ev.target;
    try { (el && typeof el.getAnimations === 'function' ? el.getAnimations() : []).forEach(ajustarRitmo); } catch { /* sin animaciones */ }
  };
  camara = { ritmo: 1 / veces, alEmpezar };
  document.addEventListener('animationstart', alEmpezar, true);
  document.addEventListener('transitionrun', alEmpezar, true);
  (typeof document.getAnimations === 'function' ? document.getAnimations() : []).forEach(ajustarRitmo);
  return veces;
}

/* La consola de depuración (apartado 35): `window.__motion`, solo en desarrollo y con la marca puesta.
   🔓 MS F18 — y `inspeccionar(el)` para preguntarle a un elemento quién lo mueve.
   🔓 MS F19 — `inspeccionarTodo()` para la página entera y `camaraLenta(n)` para verlo despacio. */
export const apiDeDepuracion = () => ({
  estado: estadoGlobalMotion, diario: diarioMotion, vaciar: vaciarDiario, grupo: estadoDeGrupo,
  prioridades: PRIORIDADES_MOTION, sistemas: SISTEMAS_MOTION, inspeccionar, inspeccionarTodo, camaraLenta,
});
export function exponerDepuracion() {
  if (typeof window === 'undefined' || !depurando()) return false;
  window.__motion = apiDeDepuracion();
  return true;
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · EL CICLO DE VIDA DE UNA TRANSICIÓN (apartado 18)

   No se obliga a ninguna pantalla a escribirlo: cada sistema YA tiene sus
   estados, y esto dice cómo se leen en las seis palabras del enunciado.
   ─────────────────────────────────────────────────────────────────────────── */
export const CICLO_TRANSICION = Object.freeze(['beforeEnter', 'enter', 'entered', 'beforeExit', 'exit', 'exited']);
const CICLOS = Object.freeze({
  presencia: { oculto: 'exited', entrando: 'enter', visible: 'entered', saliendo: 'exit' },
  plegable: { cerrado: 'exited', montado: 'beforeEnter', abriendo: 'enter', abierto: 'entered', cerrando: 'exit' },
  capa: { entrando: 'enter', abierta: 'entered', saliendo: 'exit', quitada: 'exited' },
  hoja: { quieta: 'entered', arrastrando: 'entered', umbral: 'entered', volviendo: 'entered', cerrando: 'exit', cerrada: 'exited' },
  navegacion: { entrar: 'enter', volver: 'enter', seccion: 'enter', ninguna: 'entered' },
});
export function faseDelCiclo(pieza, estado) {
  const c = CICLOS[pieza];
  return c && c[estado] ? c[estado] : null;
}
export const PIEZAS_CON_CICLO = Object.freeze(Object.keys(CICLOS));

/* ───────────────────────────────────────────────────────────────────────────
   9 · LOS PRESETS DEL ENUNCIADO, SOBRE LO QUE YA EXISTE (apartado 34)

   *"Los presets deben utilizar los sistemas existentes."* Ninguno es nuevo:
   cada nombre del enunciado apunta a la pieza que ya lo hace.
   ─────────────────────────────────────────────────────────────────────────── */
export const PRESETS_ORQUESTADOS = Object.freeze([
  { id: 'pageEnter', sistema: 'navegacion', usa: '`module-enter` (entrar) y `nav-seccion` (cambiar de sección), puestas por `tipoDeNavegacion`' },
  { id: 'pageExit', sistema: 'navegacion', usa: 'Ninguna: solo se pinta una pantalla; la que se va se sustituye y la nueva entra (`nav-vuelve` al volver)' },
  { id: 'modalEnter', sistema: 'profundidad', usa: '`animacionDeCapa(tipo, "entrar")`, la pone `useCapasMotion` a toda capa' },
  { id: 'modalExit', sistema: 'profundidad', usa: '`animacionDeCapa(tipo, "salir")` sobre la copia inerte' },
  { id: 'sheetEnter', sistema: 'profundidad', usa: 'La misma, con el tipo `hoja`: sube desde su borde' },
  { id: 'sheetExit', sistema: 'profundidad', usa: 'La misma de salida, o la del dedo si se cerró arrastrándola (F5)' },
  { id: 'cardExpand', sistema: 'continuidad', usa: '`planDeContenedor`: la pantalla crece desde su tarjeta' },
  { id: 'cardCollapse', sistema: 'continuidad', usa: '`planDeLlegada`: al volver, la tarjeta se posa' },
  { id: 'listInsert', sistema: 'layout', usa: '`ListaAnimada`: lo que entra se funde en su sitio' },
  { id: 'listRemove', sistema: 'layout', usa: '`ListaAnimada`: la copia inerte se desvanece y lo demás se recoloca' },
  { id: 'contentSwap', sistema: 'navegacion', usa: '`CambioDeContenido` (`contenido-cambia`)' },
  { id: 'success', sistema: 'estados', usa: '`estado="hecho"` de un botón y el aviso de «hecho» (`aviso-entra` / `toastExit`)' },
  { id: 'error', sistema: 'estados', usa: '`MensajeDeCampo` con `aria-invalid` (sin temblar) y `estado="fallo"`' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   10 · CSS, WEB ANIMATIONS, ESTILO O REACT (apartado 32)
   ─────────────────────────────────────────────────────────────────────────── */
export const CUANDO_CADA_HERRAMIENTA = Object.freeze([
  { via: 'Transición CSS', cuando: 'Un control que cambia de estado (pulsar, foco, un interruptor, un desplegable que crece): la clase de `index.css`, que obedece sola a los modos.' },
  { via: 'Animación CSS', cuando: 'Una entrada o una salida que siempre es igual (una pantalla, una cascada, un aviso): la clase de `index.css`, que termina con `backwards`.' },
  { via: 'Web Animations API (por `animarOrquestado`)', cuando: 'Lo que depende de una medida (FLIP, un recorte desde una tarjeta, una copia que se va) o de un valor calculado (un muelle muestreado).' },
  { via: 'Estilo directo', cuando: 'Solo lo que sigue al dedo, fotograma a fotograma: nada de estado de React mientras se arrastra (F5).' },
  { via: 'Estado de React', cuando: 'Qué se monta y qué no (`Presencia`, `Plegable`), nunca un valor intermedio de una animación.' },
  { via: '`requestAnimationFrame`', cuando: 'Una cifra que cuenta (F4) o esperar a un fotograma para medir: una vez, y se cancela al desmontar si se repite.' },
  { via: 'Librería de animación', cuando: 'Nunca: no hay ninguna, y `package.json` lo vigila (F0).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   11 · LAS CATEGORÍAS DE TOKENS (apartado 33): cada una vive en UN sitio
   ─────────────────────────────────────────────────────────────────────────── */
export const CATEGORIAS_TOKENS = Object.freeze([
  { categoria: 'duration', donde: 'src/lib/motion.js', nombre: 'DURACIONES_MOTION' },
  { categoria: 'easing', donde: 'src/lib/motion.js', nombre: 'CURVAS_MOTION' },
  { categoria: 'spring', donde: 'src/lib/motion.js', nombre: 'SPRINGS_MOTION' },
  { categoria: 'distance', donde: 'src/lib/motion.js', nombre: 'DISTANCIAS_MOTION' },
  { categoria: 'scale', donde: 'src/lib/motion.js', nombre: 'ESCALAS_MOTION' },
  { categoria: 'opacity', donde: 'src/lib/motion.js', nombre: 'OPACIDADES_MOTION' },
  { categoria: 'stagger', donde: 'src/lib/motion.js', nombre: 'STAGGER_MOTION' },
  { categoria: 'delay', donde: 'src/lib/motion.js', nombre: 'retrasosDe' },
  { categoria: 'priority', donde: 'src/lib/orquestadorMotion.js', nombre: 'PRIORIDADES_MOTION' },
  { categoria: 'depth', donde: 'src/lib/profundidad.js', nombre: 'CAPAS_Z' },
  { categoria: 'motion intensity', donde: 'src/lib/motion.js', nombre: 'MODOS_MOTION' },
  { categoria: 'gesture thresholds', donde: 'src/lib/umbralesGesto.js', nombre: 'UMBRALES_GESTO' },
  { categoria: 'layout budget', donde: 'src/lib/layoutMotion.js', nombre: 'PRESUPUESTO_LAYOUT' },
  /* MS F20, apartado 3 — las reglas responsive también tienen UN sitio: los cortes que cambian el movimiento. */
  { categoria: 'responsive', donde: 'src/lib/responsiveMotion.js', nombre: 'MOTION_BREAKPOINTS' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   12 · LO QUE NO PUEDE VOLVER (apartados 39 y 43)

   · Una animación que no pasa por el orquestador: `.animate(` fuera de este
     archivo y de los dos de la F1 que lo usan a través de él.
   · Un temporizador, un escuchador, un `requestAnimationFrame` o un observador
     sin su limpieza en las piezas de movimiento — salvo los declarados, con su
     motivo (`LIMPIEZA_DECLARADA`).
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentarios = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
const lineaDe = (src, i) => src.slice(0, i).split('\n').length;
/* 🐛 MS F20 — y sin el contenido de las cadenas: el `ejemploMalo` de la F13 lleva escrito
   `addEventListener('scroll', medir)` y contaba como un escuchador sin quitar. La llamada se queda (está
   fuera de las comillas); lo que se vacía es lo de dentro, conservando los saltos de línea. */
const sinCadenas = (src) => String(src)
  .replace(/`(?:\\[\s\S]|[^\\`])*`/g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/'(?:\\.|[^\\'\n])*'|"(?:\\.|[^\\"\n])*"/g, (m) => ' '.repeat(m.length));

/** Los únicos sitios que llaman a `.animate(` directamente. */
export const ANIMAN_DIRECTAMENTE = Object.freeze(['src/lib/orquestadorMotion.js']);

/** Las piezas de movimiento cuya limpieza se revisa (apartado 17). */
export const PIEZAS_DE_MOVIMIENTO = Object.freeze([
  'src/components/motion.jsx', 'src/components/gestosMotion.jsx', 'src/components/capasMotion.js',
  'src/components/continuidad.jsx', 'src/components/layoutMotion.jsx', 'src/components/navegacionMotion.js',
  'src/lib/motion.js', 'src/lib/orquestadorMotion.js', 'src/components/responsiveMotion.js',
  'src/components/estadosAsincronos.jsx', 'src/components/vacioMotion.js',
  /* 🐛 MS F20 — tres que usaban temporizadores, escuchadores u observadores y nunca se habían revisado:
     la lista se escribió en la F11 y las piezas de después no entraron. Ahora la F20 exige que toda pieza
     del mapa de capas que los use esté aquí (`piezasSinRevisarLimpieza`, `contratosMotion.js`). */
  'src/lib/sincronizacion.js', 'src/lib/rendimientoMotion.js', 'src/components/accesibilidadMotion.jsx',
]);

/** Lo que no se limpia a propósito, y por qué no hace falta. */
export const LIMPIEZA_DECLARADA = Object.freeze([
  { archivo: 'src/components/layoutMotion.jsx', que: 'setTimeout', porque: 'La red de una copia que sale: `quitar` es idempotente (mira `parentNode`) y no toca React, así que llegar después de desmontar no hace nada.' },
  { archivo: 'src/components/capasMotion.js', que: 'setTimeout', porque: 'La red de la copia de una capa que se va: `copia.remove()` sobre un nodo ya quitado no hace nada.' },
  { archivo: 'src/components/gestosMotion.jsx', que: 'setTimeout', porque: 'El rescate de una hoja que su dueño no cerró (F5, apartado 37): mira `caja.isConnected` antes de tocar nada.' },
  { archivo: 'src/components/continuidad.jsx', que: 'requestAnimationFrame', porque: 'Un solo fotograma para corregir el viaje con el scroll que puso el padre; sobre una animación ya cancelada, `setKeyframes` no hace nada.' },
  { archivo: 'src/components/navegacionMotion.js', que: 'requestAnimationFrame', porque: 'Un segundo intento de poner el scroll, guardado por `claveActual.current === clave`: si ya se navegó a otra pantalla, no hace nada.' },
]);

export function auditarOrquestacion({ archivos = {} } = {}) {
  const hallazgos = [];
  Object.entries(archivos).forEach(([archivo, src]) => {
    if (!/\.(jsx?|mjs)$/.test(archivo) || !/^src\//.test(archivo)) return;
    const limpio = sinCadenas(sinComentarios(src));
    if (!ANIMAN_DIRECTAMENTE.includes(archivo)) {
      const re = /\.animate\(/g;
      let m;
      while ((m = re.exec(limpio))) hallazgos.push({ tipo: 'anima_por_su_cuenta', archivo, linea: lineaDe(limpio, m.index), que: 'Una animación que no pasa por `animarOrquestado`: el orquestador no sabe de quién es ni con qué choca.' });
    }
    if (PIEZAS_DE_MOVIMIENTO.includes(archivo)) {
      const cuenta = (re) => (limpio.match(re) || []).length;
      /* Un temporizador o un fotograma se cuenta por su MANEJADOR: un bucle que reasigna el mismo
         (`id = requestAnimationFrame(avanzar)` dentro de `avanzar`) es UNO, y se limpia con un solo cancel. */
      const manejadores = (llamada, cierre) => {
        const asignados = [...limpio.matchAll(new RegExp(`([\\w.]+)\\s*=\\s*(?:window\\.)?${llamada}\\(`, 'g'))].map((m) => m[1]);
        const sueltos = cuenta(new RegExp(`\\b${llamada}\\(`, 'g')) - asignados.length;
        const cerrados = new Set([...limpio.matchAll(new RegExp(`\\b${cierre}\\(\\s*([\\w.]+)`, 'g'))].map((m) => m[1]));
        return new Set(asignados).size + sueltos - cerrados.size;
      };
      const pares = [
        ['setTimeout', () => manejadores('setTimeout', 'clearTimeout')],
        ['requestAnimationFrame', () => manejadores('requestAnimationFrame', 'cancelAnimationFrame')],
        ['addEventListener', () => cuenta(/\baddEventListener\(/g) - cuenta(/\bremoveEventListener\(/g)],
        ['Observer', () => cuenta(/new (?:Mutation|Resize|Intersection)Observer\(/g) - cuenta(/\.disconnect\(\)/g)],
      ];
      pares.forEach(([que, calcular]) => {
        const faltan = calcular();
        if (faltan > 0 && !LIMPIEZA_DECLARADA.some((d) => d.archivo === archivo && d.que === que)) {
          hallazgos.push({ tipo: 'sin_limpieza', archivo, linea: 0, que: `${faltan} ${que} sin su limpieza (apartado 17: cero fugas)` });
        }
      });
    }
  });
  const cuentas = { anima_por_su_cuenta: 0, sin_limpieza: 0 };
  hallazgos.forEach((h) => { cuentas[h.tipo] += 1; });
  return { hallazgos, cuentas };
}

/* ───────────────────────────────────────────────────────────────────────────
   13 · EL CENSO (apartado 1): lo que hay de verdad, contado del código
   ─────────────────────────────────────────────────────────────────────────── */
export function censoMotion({ css = '', archivos = {} } = {}) {
  const limpioCss = sinComentarios(css);
  const todo = Object.entries(archivos).filter(([a]) => /^src\/.*\.(jsx?|mjs)$/.test(a)).map(([, s]) => sinComentarios(s)).join('\n');
  const n = (src, re) => (src.match(re) || []).length;
  return {
    keyframes: n(limpioCss, /@keyframes\s+[\w-]+/g),
    animacionesCss: n(limpioCss, /\banimation:\s*[\w-]+/g),
    transicionesCss: n(limpioCss, /\btransition:\s*[^;]+/g),
    animate: n(todo, /\.animate\(/g),
    animarOrquestado: n(todo, /\banimarOrquestado\(/g),
    requestAnimationFrame: n(todo, /\brequestAnimationFrame\(/g),
    setTimeout: n(todo, /\bsetTimeout\(/g),
    observadores: n(todo, /new (?:Mutation|Resize|Intersection)Observer\(/g),
    gestos: n(todo, /onPointerDown=|addEventListener\('pointerdown'/g),
    scroll: n(todo, /addEventListener\('scroll'/g),
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   14 · LA AUDITORÍA DEL ENUNCIADO Y LO QUE NO SE HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F11 = Object.freeze([
  { apartados: [1, 2, 3], que: 'Quién manda en cada movimiento', queda: '`SISTEMAS_MOTION`: once sistemas con su fase, sus archivos, su vía y sus propiedades, y cada entrada del MOTION_MAP con su dueño (`duenoDeEntrada`).' },
  { apartados: [4, 5, 6], que: 'Orquestar, secuenciar y la línea de tiempo', queda: '`planificarLinea` (secuencial, paralelo, escalonado, retrasado, dependiente y solapado) y `crearLinea` (empezar, pausar, reanudar, cancelar, completar, invertir, ir a un punto). La lista de la F10 la usa: lo que sale, y a mitad de su salida, lo que se recoloca y entra.' },
  { apartados: [7, 8, 9], que: 'Prioridades, conflictos y composición', queda: '`PRIORIDADES_MOTION` y `resolverConflicto`: lo que no toca la misma propiedad convive; con la misma, gana el que más pesa y, a igual peso, el último —saliendo de donde se ve—. Para combinar movimientos de dos sistemas en un elemento: `translate`/`scale`/`rotate` (se componen con `transform`) o un envoltorio (como el brillo de `RankBadge`, FIT F37).' },
  { apartados: [12, 13], que: 'Grupos y estado global', queda: '`iniciarGrupo`, `cancelarGrupo`, `completarGrupo`, `terminaGrupo` y `estadoDeGrupo`; el estado global es un registro, no un estado de React (`estadoGlobalMotion`).' },
  { apartados: [14, 15, 16], que: 'Interrumpir, tocar deprisa y las carreras', queda: 'Lo interrumpido se lee ANTES de cancelarse y lo nuevo sale de ahí (`desdeLoQueSeVe`); el dedo toma el control (`tomarControl`); cada final borra SU registro (guarda de identidad). El recorrido abre y cierra el ＋ cinco veces, cambia de pestaña cuatro y borra tres tareas seguidas.' },
  { apartados: [17, 39], que: 'Desmontar y limpiar', queda: '`auditarOrquestacion` cuenta temporizadores, escuchadores, fotogramas y observadores de cada pieza contra su limpieza; los que no la necesitan están declarados con su motivo.' },
  { apartados: [18], que: 'El ciclo de vida', queda: '`faseDelCiclo`: los estados que ya tienen `Presencia`, `Plegable`, las capas, la hoja y la navegación, leídos como beforeEnter… exited. Ninguna pantalla tiene que escribirlo.' },
  { apartados: [19, 20, 21], que: 'Estados reales, lo asíncrono y los datos', queda: 'F9 (`estado="cargando"` solo mientras dura de verdad: el giro, pasado `slow`) y F4 (`CifraQueCambia`). Ni un `setTimeout` que finja una espera.' },
  { apartados: [22, 23, 24], que: 'Navegación, ventanas y hojas como UNA operación', queda: 'Las capas entran y salen como un grupo (velo y caja), la pantalla que crece desde su tarjeta y el nombre que viaja son del grupo `navegacion`, y el asa de una hoja toma el control de la caja y del velo a la vez.' },
  { apartados: [27, 28, 38], que: 'Reducido, alternativas y errores', queda: '«Sin movimiento» es una política del orquestador (no empieza nada); una animación que el navegador no puede hacer devuelve `null` y el elemento queda en su estado final; ninguna rompe la función.' },
  { apartados: [29, 30, 31], que: 'Rendimiento y presupuesto', queda: '`PRESUPUESTO_ORQUESTADOR`: con 48 animaciones a la vez, lo micro y lo decorativo no empiezan. Lo que se anima es `transform` y `opacity` salvo el recorte (F7), el velo, el brillo de la llegada y la altura de un desplegable: medirlo es la F13.' },
  { apartados: [32, 33, 34], que: 'Herramientas, tokens y presets', queda: '`CUANDO_CADA_HERRAMIENTA`, `CATEGORIAS_TOKENS` (cada categoría en un solo sitio) y `PRESETS_ORQUESTADOS` sobre lo que ya existe.' },
  { apartados: [35, 36, 37], que: 'Depuración', queda: 'Solo en desarrollo y con `localStorage["josstyle:motion-debug"] = "1"`: un diario de eventos (`MOTION_START`…`MOTION_ERROR`), `window.__motion` para consultarlo y un contorno con el sistema en lo que se anima. En producción no existe.' },
]);

export const NO_EN_F11 = Object.freeze([
  { que: 'Un framework de animación propio, o una librería', porque: 'Apartado 40. El orquestador es un registro y unas reglas sobre la Web Animations API; lo demás sigue en `index.css`.' },
  { que: 'Pasar las animaciones CSS por el orquestador', porque: 'Una clase de `index.css` ya obedece sola a los modos y a la velocidad, y la del pulsar o la del foco no compite con nadie. Las que podían chocar con una de JavaScript —la cascada de una portada con la tarjeta que se posa al volver— ya las termina la F2 al volver (`ENTRADAS_QUE_NO_SE_REPITEN`).' },
  { que: 'Un estado global de React para el movimiento', porque: 'Apartado 13: *"No conviertas Motion en un enorme estado global React si no es necesario."* Un registro basta, y no repinta nada.' },
  { que: 'Migrar todo a `translate`/`scale` individuales', porque: 'Apartado 31: *"No hagas una migración masiva sin necesidad."* Hoy ningún elemento tiene dos sistemas sobre `transform` a la vez: se resuelve por prioridad, y lo nuevo que lo necesite usa la propiedad individual.' },
  { que: 'Diferencias de orquestación entre móvil, tableta y escritorio', porque: 'Apartado 26: *"Usa variantes únicamente cuando realmente cambie la interacción."* Lo que cambia (el asa de una hoja solo en el móvil, `hover` solo con puntero) ya lo resuelven la F2 y la F5.' },
]);

/* Al cargar: si se está depurando, la consola queda a mano. En producción no hace nada. */
exponerDepuracion();
