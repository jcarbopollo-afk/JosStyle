/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 1 — EL MOTOR DE MOVIMIENTO DE JOSSTYLE
   ═══════════════════════════════════════════════════════════════════════════

   *"No empieces haciendo animaciones individuales sin sistema. Primero crea el
   MOTOR."* Esto es el motor: los tokens, los modos, la velocidad, la
   intensidad, el escalonado, los presets y las primitivas (presencia,
   interrupción, FLIP y elemento compartido). Lo que decidió la F0
   (`motionMapa.js`, `ARQUITECTURA_MOTION`) se cumple así:

   🚨 **UNA SOLA FUENTE, DOS MATERIALIZACIONES, Y UNA PRUEBA QUE LAS COMPARA.**
   Los valores viven AQUÍ. `index.css` los escribe como variables CSS —en
   `:root` lo de siempre, y por modo (`html[data-motion=…]`) y por velocidad
   (`html[data-velocidad=…]`) lo que cambia— para que el CSS se mueva solo, sin
   una línea de JavaScript y respetando los modos. Y `scripts/test-motion-f1.mjs`
   **lee `index.css` y exige que diga exactamente lo que dice esta tabla**: si
   alguien toca un número en un sitio y no en el otro, la suite se pone roja.
   Es `ANIMACIONES_HC` (E3 F14) contra el CSS, la lección de la FIT F37.

   🚨 **NI UN `calc()` CON TIEMPOS EN EL CSS** (y es a propósito). Escalar una
   duración con `calc(160ms * var(--x))` sería lo más corto, y es justo lo que
   no se puede probar: todas las pruebas corren en Chromium y la aplicación solo
   se usa en un iPhone (SF F1). Si Safari no resolviera ese `calc` dentro de un
   `animation`, la declaración entera sería inválida y **la aplicación se
   quedaría sin una sola animación sin que fallara nada**. Así que las
   duraciones se escriben ya calculadas, un bloque por velocidad, y el retraso
   del escalonado son seis tokens (`--motion-retraso-0…5`), no una fórmula.

   ⚠️ **LO QUE YA EXISTÍA SE RESPETA** (F0, apartado 1): la curva de siempre
   sigue llamándose `--ease-premium` (Fase N2) y es la `standard` de aquí; los
   ids guardados de Ajustes (`completa`, `reducida`, `desactivadas`) no se
   renombran (FIT F1: un id es una ranura estable).

   ⚠️ **Sin librería de animación** (F0). Lo que el CSS no puede hacer —salir
   antes de desmontar, invertir a mitad, FLIP, un elemento que viaja— va por la
   Web Animations API del navegador (`element.animate`), que se interrumpe desde
   el estado visual de AHORA (apartado 12) y existe en Safari desde la 13.1.
   =========================================================================== */
import { animarOrquestado } from './orquestadorMotion';

const lista = (x) => (Array.isArray(x) ? x : []);
const redondear = (n, d = 0) => { const f = 10 ** d; return Math.round(n * f) / f; };
const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

/* ───────────────────────────────────────────────────────────────────────────
   1 · DURACIONES (apartado 2)

   Las siete del enunciado y tres que JosStyle ya usaba y tienen nombre propio
   en la jerarquía de la F0: el momento (subir una racha), la firma (el «+1») y
   el latido del esqueleto, que es un ritmo y no una entrada.

   ⚠️ Los valores salen de lo que ya había en `index.css` (F0): 120-220 es la
   respuesta al dedo, 280-340 lo que entra o se va, 420 lo protagonista. Las
   duraciones sueltas del CSS se acercan al token más próximo (190 → 160,
   240 → 220, 260/300 → 280, 380 → 340): **la misma clase de movimiento dura
   lo mismo en toda la aplicación**, que es lo que la F0 encontró roto.
   ─────────────────────────────────────────────────────────────────────────── */
export const DURACIONES_MOTION = {
  instant: 0,
  ultraFast: 120,
  fast: 160,
  normal: 220,
  medium: 280,
  slow: 340,
  cinematic: 420,
  momento: 620,
  firma: 900,
  latido: 1400,
};

/** El nombre de la variable CSS de una duración: `ultraFast` → `--motion-dur-ultrafast`. */
export const varDuracion = (id) => `--motion-dur-${String(id).toLowerCase()}`;

/* ───────────────────────────────────────────────────────────────────────────
   2 · CURVAS (apartado 2)

   `standard` ES `--ease-premium`, la de la Fase N2 que usan las 35 reglas
   animadas de la aplicación: no se sustituye, se nombra. Las otras cinco son
   su familia, para los casos que la estándar no cubre:
     · `smooth`: simétrica, para lo que va y vuelve (abrir y cerrar);
     · `entrance`: llega deprisa y se posa, para lo que aparece;
     · `exit`: arranca suave y se va sin frenar — lo que sale no se queda mirando;
     · `emphasized`: el énfasis de un momento (subir de rango);
     · `linear`: relojes y bucles, donde frenar mentiría.
   ─────────────────────────────────────────────────────────────────────────── */
export const CURVAS_MOTION = {
  standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
  smooth: 'cubic-bezier(0.45, 0, 0.2, 1)',
  entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  linear: 'linear',
};

export const varCurva = (id) => (id === 'standard' ? '--ease-premium' : `--motion-curva-${id}`);

/* ───────────────────────────────────────────────────────────────────────────
   3 · SPRINGS (apartado 2: *"No abuses del rebote"*)

   Un muelle es rigidez, amortiguación y masa. El rebote lo decide la
   amortiguación relativa (ζ): con ζ ≥ 1 no rebota nada; por debajo, cuanto más
   baja, más rebota. **Ninguno baja de 0,6**: `bouncy` se pasa un 10 % y vuelve,
   no un 30 %. Y la F0 ya dijo cuándo se usan: **solo cuando el movimiento lo
   suelta el dedo** (una hoja que se arrastra), nunca en una entrada que no ha
   tocado nadie (`PRESUPUESTO_MOTION`).
   ─────────────────────────────────────────────────────────────────────────── */
export const SPRINGS_MOTION = {
  soft: { rigidez: 120, amortiguacion: 22, masa: 1 },
  normal: { rigidez: 170, amortiguacion: 26, masa: 1 },
  responsive: { rigidez: 320, amortiguacion: 34, masa: 1 },
  bouncy: { rigidez: 220, amortiguacion: 18, masa: 1 },
  heavy: { rigidez: 140, amortiguacion: 30, masa: 2 },
};

/** La amortiguación relativa ζ de un muelle: < 1 rebota, ≥ 1 no. */
export const amortiguacionRelativa = (s) => s.amortiguacion / (2 * Math.sqrt(s.rigidez * s.masa));

/**
 * Simula un muelle de `desde` a `hasta` y devuelve sus valores a 60 fps hasta
 * que se queda quieto, con su duración. Es lo que la Web Animations API recibe
 * como fotogramas: un spring de verdad sin una librería.
 */
export function muestrearSpring(spring, { desde = 0, hasta = 1, velocidad = 0, fps = 60, maxMs = 1200, reposo = null } = {}) {
  const s = SPRINGS_MOTION[spring] || spring || SPRINGS_MOTION.normal;
  const dt = 1 / fps;
  let x = desde - hasta;
  let v = velocidad;
  const valores = [desde];
  let t = 0;
  while (t * 1000 < maxMs) {
    const fuerza = -s.rigidez * x - s.amortiguacion * v;
    v += (fuerza / s.masa) * dt;
    x += v * dt;
    t += dt;
    valores.push(hasta + x);
    /* Por defecto, en reposo cuando le queda una milésima del recorrido. Con `reposo` (MS F5), un
       umbral en las unidades de lo que se mueve: para píxeles, lo que ya no se ve. */
    if (reposo ? (Math.abs(x) < reposo.distancia && Math.abs(v) < reposo.velocidad)
      : (Math.abs(x) < 0.001 * Math.max(1, Math.abs(hasta - desde)) && Math.abs(v) < 0.01)) break;
  }
  valores[valores.length - 1] = hasta;
  return { valores, duracionMs: Math.round(t * 1000), pasoMaximo: Math.max(...valores.map((y) => (hasta >= desde ? y : -y))) };
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · DISTANCIAS, ESCALAS, PULSOS, OPACIDADES Y DESENFOQUES (apartados 3-6)

   Los valores del modo Normal. Salen de los fotogramas que ya había en
   `index.css` (F0): 4 px el mes del Calendario, 8 el aviso, 14 la cascada de
   la portada, 24-26 entrar en un módulo. Lo que estaba a medio camino (6, 12,
   16) se acerca al token más próximo.

   🚨 **LA ESCALA TIENE DOS TECHOS, Y LA F0 SOLO ESCRIBIÓ UNO** (hallazgo de la
   F1). La F0 dijo *"nunca por encima de 1,03"*, y la llama de una racha sube a
   1,35 desde la E3 F2. Las dos cosas son ciertas para cosas distintas: **una
   superficie** (una tarjeta, una hoja, una pantalla) no pasa de 1,03 ni baja de
   0,95 al entrar —crecer más se lee como un salto—; **una marca pequeña** (una
   llama, un ✓, una estrella) puede latir hasta 1,35 porque mide 16 px y el
   pulso ES el mensaje. `PRESUPUESTO_MOTION` de la F0 se corrige con esto.
   ─────────────────────────────────────────────────────────────────────────── */
export const DISTANCIAS_MOTION = { micro: 4, small: 8, medium: 14, large: 24, hero: 40 };

/** Desde dónde entra algo que crece hasta su tamaño (factor < 1). */
export const ESCALAS_MOTION = { micro: 0.98, subtle: 0.97, normal: 0.96, hero: 0.82 };

/** Hasta dónde late una marca pequeña (factor > 1), y el sobrepaso de una superficie. */
export const PULSOS_MOTION = { micro: 1.08, suave: 1.12, medio: 1.18, fuerte: 1.25, firma: 1.35, sobrepaso: 1.03 };

export const OPACIDADES_MOTION = { hidden: 0, subtle: 0.45, secondary: 0.65, visible: 0.9, full: 1 };

export const DESENFOQUES_MOTION = { none: 0, subtle: 4, medium: 10, strong: 20 };

export const TOPES_ESCALA = {
  superficie: { min: 0.95, max: 1.03 },
  marca: { min: 0.6, max: 1.35 },
};

/** Qué tokens de escala son de superficie y cuáles de marca. */
const ESCALA_ES_MARCA = { micro: false, subtle: false, normal: false, hero: true };
const PULSO_ES_MARCA = { micro: true, suave: true, medio: true, fuerte: true, firma: true, sobrepaso: false };

/* ───────────────────────────────────────────────────────────────────────────
   5 · EL ESCALONADO (apartado 7)

   *"Nunca: elemento 1, elemento 2, elemento 3… con retrasos exageradamente
   evidentes."* Un paso de 60 ms y **como mucho seis escalones**: el séptimo
   elemento de una lista entra con el sexto, no 420 ms después. Antes había
   cinco cadencias (60, 70, 80 ms y dos funciones) y ningún tope: el libro
   cincuenta de la Biblioteca esperaba tres segundos (hallazgo `cadencias`).
   ─────────────────────────────────────────────────────────────────────────── */
export const STAGGER_MOTION = { pasoMs: 60, escalones: 6, pasoMaxMs: 80 };
export const DIRECCIONES_STAGGER = ['normal', 'inversa', 'centro'];

/** El escalón de un elemento, de 0 a `escalones - 1`, según la dirección. */
export function escalonDe(indice, { total = 0, direccion = 'normal' } = {}) {
  const i = Math.max(0, Math.floor(Number(indice) || 0));
  const n = Math.max(0, Math.floor(Number(total) || 0));
  let e = i;
  if (direccion === 'inversa' && n > 0) e = Math.max(0, n - 1 - i);
  if (direccion === 'centro' && n > 0) e = Math.round(Math.abs(i - (n - 1) / 2));
  return Math.min(e, STAGGER_MOTION.escalones - 1);
}

/**
 * El retraso de un elemento de una cascada, **como estilo**: una variable CSS
 * que apunta al token de su escalón. Así el retraso respeta el modo y la
 * velocidad sin que la vista sepa un solo milisegundo, y no es un
 * `animationDelay` en línea (que además ganaría a la clase de expansión).
 */
export function escalonado(indice, opciones = {}) {
  return { '--motion-retraso': `var(--motion-retraso-${escalonDe(indice, opciones)})` };
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · LA VELOCIDAD GLOBAL (apartado 15)

   *"No modificar cada animación individual. Debe existir una escala global."*
   Un factor que multiplica todas las duraciones y los retrasos. Lo que no
   escala es `instant` (0 es 0).
   ─────────────────────────────────────────────────────────────────────────── */
export const VELOCIDADES_MOTION = [
  { id: 'lenta', nombre: 'Pausada', factor: 1.3, explica: 'Todo dura un poco más. Para seguir con calma lo que cambia.' },
  { id: 'normal', nombre: 'Normal', factor: 1, explica: 'El ritmo de JosStyle.' },
  { id: 'rapida', nombre: 'Rápida', factor: 0.75, explica: 'Todo dura un cuarto menos, sin perder lo que explica cada movimiento.' },
];

export const velocidadMotion = (id) => VELOCIDADES_MOTION.find((v) => v.id === id) || VELOCIDADES_MOTION[1];

/** Las duraciones de una velocidad, ya calculadas (las que escribe `index.css`). */
export function duracionesDeVelocidad(id = 'normal') {
  const { factor } = velocidadMotion(id);
  const out = {};
  Object.entries(DURACIONES_MOTION).forEach(([k, ms]) => { out[k] = Math.round(ms * factor); });
  return out;
}

/** Los retrasos de cada escalón con una velocidad (los que escribe `index.css`). */
export function retrasosDe(velocidadId = 'normal') {
  const { factor } = velocidadMotion(velocidadId);
  return Array.from({ length: STAGGER_MOTION.escalones }, (_, i) => Math.round(i * STAGGER_MOTION.pasoMs * factor));
}

/* ───────────────────────────────────────────────────────────────────────────
   7 · LOS MODOS (apartado 14)

   El enunciado pide como mínimo OFF, REDUCED, NORMAL, PREMIUM y ULTRA. Son
   cinco, y los tres primeros **guardan el id que ya tenían** (`desactivadas`,
   `reducida`, `completa`): lo guardado en la cuenta de Josué no se toca.

   🔓 **«MÍNIMA» SE LEE COMO «REDUCIDO»** (C-52). Había cuatro niveles y tres no
   hacían nada (hallazgo de la F0). «Mínima» —*"solo el feedback
   imprescindible"*— y el REDUCED del enunciado —*"solo movimiento esencial"*—
   son lo mismo dicho dos veces, y ofrecer los dos sería un control que no
   cambia nada visible (regla 8). Lo guardado como `minima` no se reescribe:
   se lee como Reducido, y si él elige otro, se guarda el nuevo.

   🔓 **PREMIUM Y ULTRA SE OFRECEN, PORQUE LA F1 DEMUESTRA SU DIFERENCIA** (lo
   que la F0 puso como condición). No son *"más duración"* —el apartado 14 lo
   prohíbe—: son **más intensidad** (desplazamientos y escalas algo más
   amplios, siempre dentro del presupuesto) y,
   en Ultra, **profundidad**: el velo de una hoja desenfoca lo de detrás. El
   recorrido de Chromium mide la diferencia en una pantalla de verdad.
   ─────────────────────────────────────────────────────────────────────────── */
export const MODOS_MOTION = [
  { id: 'off', guardado: 'desactivadas', nombre: 'Sin movimiento', intensidad: 0, espacial: false,
    explica: 'Nada se desplaza ni se anima: cada cambio aparece en su estado final.' },
  { id: 'reducido', guardado: 'reducida', nombre: 'Reducido', intensidad: 0, espacial: false,
    explica: 'Sin desplazamientos ni escalas: fundidos que conservan el orden y el aviso de cada cambio.' },
  { id: 'normal', guardado: 'completa', nombre: 'Normal', intensidad: 1, espacial: true,
    explica: 'El movimiento de JosStyle: lo que entra, lo que se completa y lo que cambia se nota sin estorbar.' },
  { id: 'premium', guardado: 'premium', nombre: 'Premium', intensidad: 1.25, espacial: true,
    explica: 'Desplazamientos y escalas algo más amplios, sin pasar de lo que se lee como un salto. Misma duración.' },
  { id: 'ultra', guardado: 'ultra', nombre: 'Ultra', intensidad: 1.4, espacial: true, extras: ['profundidad'],
    explica: 'Lo de Premium con más amplitud, y profundidad: al abrir una hoja, lo de detrás se desenfoca.' },
];

/** Los ids que pudo guardar una versión anterior y cómo se leen hoy. */
export const GUARDADOS_ANTIGUOS = { minima: 'reducido' };

export const modoMotion = (id) => MODOS_MOTION.find((x) => x.id === id) || MODOS_MOTION[2];

/** El modo que corresponde a lo guardado en `apariencia.animaciones`. */
export function modoDeGuardado(guardado) {
  if (GUARDADOS_ANTIGUOS[guardado]) return GUARDADOS_ANTIGUOS[guardado];
  const m = MODOS_MOTION.find((x) => x.guardado === guardado);
  return m ? m.id : 'normal';
}

/** Lo que se guarda para un modo (el id de siempre si ya lo tenía). */
export const guardadoDeModo = (id) => modoMotion(id).guardado;

/** El valor que hay que marcar en el selector de Ajustes para lo guardado. */
export const valorSelector = (guardado) => guardadoDeModo(modoDeGuardado(guardado));

/* ───────────────────────────────────────────────────────────────────────────
   8 · LA INTENSIDAD (apartado 16)

   *"Intensidad 50 % no significa todo × 0,5. Debe existir una función
   inteligente."* Lo es así:
     · **cada escalón de la jerarquía responde distinto**: lo micro casi no
       cambia (exponente 0,5) y lo grande cambia más (1,15). Al 50 %, el
       desplazamiento micro baja un 30 % y el grande un 55 %: la jerarquía se
       conserva, que es lo que pide el apartado;
     · **todo se recorta al presupuesto de la F0**: una superficie nunca entra
       desde menos de 0,95 ni crece por encima de 1,03, y una marca no late por
       encima de 1,35, por mucha intensidad que se pida;
     · **cero es cero**: sin intensidad no hay desplazamiento ni escala (Reducido).
   ─────────────────────────────────────────────────────────────────────────── */
const PESO_DISTANCIA = { micro: 0.5, small: 0.75, medium: 1, large: 1, hero: 1.15 };
const PESO_ESCALA = { micro: 0.5, subtle: 0.75, normal: 1, hero: 1 };
const PESO_PULSO = { micro: 0.5, suave: 0.75, medio: 1, fuerte: 1, firma: 1, sobrepaso: 1 };
export const TOPE_DISTANCIA_PX = 56;

export function intensificar(tipo, id, intensidad) {
  const I = Math.max(0, Number(intensidad) || 0);
  if (tipo === 'distancia') {
    if (I === 0) return 0;
    return Math.min(TOPE_DISTANCIA_PX, Math.round(DISTANCIAS_MOTION[id] * I ** PESO_DISTANCIA[id]));
  }
  if (tipo === 'escala') {
    if (I === 0) return 1;
    const tope = ESCALA_ES_MARCA[id] ? TOPES_ESCALA.marca : TOPES_ESCALA.superficie;
    return redondear(limitar(1 - (1 - ESCALAS_MOTION[id]) * I ** PESO_ESCALA[id], tope.min, 1), 3);
  }
  if (tipo === 'pulso') {
    if (I === 0) return 1;
    const tope = PULSO_ES_MARCA[id] ? TOPES_ESCALA.marca : TOPES_ESCALA.superficie;
    return redondear(limitar(1 + (PULSOS_MOTION[id] - 1) * I ** PESO_PULSO[id], 1, tope.max), 3);
  }
  throw new Error(`intensificar: tipo desconocido «${tipo}»`);
}

/**
 * El paso del escalonado de un modo. ⚠️ **La intensidad NO lo cambia, y es a
 * propósito**: en Premium saldría 63 ms y en Ultra 65 frente a 60 — tres y
 * cinco milisegundos que nadie distingue, a cambio de doblar los bloques de
 * `index.css` (uno por modo y velocidad). Un ajuste que no se nota es la regla
 * 8. Lo que sí hace es apagarse con «Sin movimiento». Y en Reducido **se
 * conserva**: lo que entra en cascada con un fundido sigue diciendo en qué
 * orden se lee (apartado 17: *"mantener orientación"*).
 */
export function pasoDeStagger(modoId) {
  return modoMotion(modoId).id === 'off' ? 0 : STAGGER_MOTION.pasoMs;
}

/**
 * El muelle de un modo (apartado 16: la intensidad también afecta al spring).
 * 🚨 **Nunca rebota más que el de serie** (*"No abuses del rebote"*): con una
 * intensidad por debajo de 1 se amortigua más (rebota menos); por encima, el
 * mismo. Y en Reducido o apagado no hay muelle: lo que suelte el dedo llega a
 * su sitio con la curva estándar.
 */
export function springDeModo(id, modoId) {
  const m = modoMotion(modoId);
  const base = SPRINGS_MOTION[id];
  if (!base || !m.espacial) return null;
  if (m.intensidad >= 1) return { ...base };
  return { ...base, amortiguacion: redondear(base.amortiguacion / Math.max(0.25, m.intensidad) ** 0.5, 2) };
}

/** El desenfoque del velo de una hoja: solo en Ultra (profundidad), y fijo — nunca animado. */
export function desenfoqueDelVelo(modoId) {
  const m = modoMotion(modoId);
  return lista(m.extras).includes('profundidad') ? Math.round(DESENFOQUES_MOTION.subtle * m.intensidad) : 0;
}

/**
 * Las variables CSS de intensidad de un modo, **exactamente** como las escribe
 * `index.css` (la prueba compara las dos). Las duraciones no están aquí: son
 * de la velocidad.
 */
export function tokensDeModo(modoId) {
  const m = modoMotion(modoId);
  const I = m.intensidad;
  const t = {};
  Object.keys(DISTANCIAS_MOTION).forEach((k) => { t[`--motion-dist-${k}`] = `${intensificar('distancia', k, I)}px`; });
  Object.keys(ESCALAS_MOTION).forEach((k) => { t[`--motion-escala-${k}`] = String(intensificar('escala', k, I)); });
  Object.keys(PULSOS_MOTION).forEach((k) => { t[`--motion-pulso-${k}`] = String(intensificar('pulso', k, I)); });
  t['--motion-velo-desenfoque'] = `${desenfoqueDelVelo(m.id)}px`;
  return t;
}

/** Las variables CSS de tiempo de una velocidad (duraciones y retrasos). */
export function tokensDeTiempo(velocidadId = 'normal') {
  const t = {};
  const d = duracionesDeVelocidad(velocidadId);
  Object.entries(d).forEach(([k, ms]) => { t[varDuracion(k)] = `${ms}ms`; });
  retrasosDe(velocidadId).forEach((ms, i) => { t[`--motion-retraso-${i}`] = `${ms}ms`; });
  return t;
}

/** Las variables que no cambian ni con el modo ni con la velocidad. */
export function tokensFijos() {
  const t = {};
  Object.entries(CURVAS_MOTION).forEach(([k, v]) => { if (k !== 'standard') t[varCurva(k)] = v; });
  t['--ease-premium'] = CURVAS_MOTION.standard;
  Object.entries(OPACIDADES_MOTION).forEach(([k, v]) => { t[`--motion-opac-${k}`] = String(v); });
  Object.entries(DESENFOQUES_MOTION).forEach(([k, v]) => { t[`--motion-blur-${k}`] = `${v}px`; });
  return t;
}

/* ───────────────────────────────────────────────────────────────────────────
   9 · EL CONTEXTO (apartados 13 y 17)

   *"Un sistema global que conozca: nivel, velocidad, reduced motion,
   intensidad, preferencias del usuario."* Una función pura de lo que hay
   guardado y de lo que dice el sistema operativo.

   🚨 **REDUCIR NO ES APAGAR** (apartado 17 y F0). Si el iPhone tiene
   «Reducir movimiento», o él lo enciende en Ajustes, Normal, Premium y Ultra se
   comportan como **Reducido**: sin desplazamientos, con fundidos, conservando
   el feedback, los estados y el orden. Antes las dos reglas llevaban TODO a
   0,01 ms, y eso es lo que el enunciado llama romper. Solo «Sin movimiento»
   lo quita todo, porque es lo que él ha pedido.
   ─────────────────────────────────────────────────────────────────────────── */
export function contextoMotion({ animaciones = 'completa', reducirMovimiento = false, velocidad = 'normal', sistemaReduce = false } = {}) {
  const elegido = modoDeGuardado(animaciones);
  let modo = elegido;
  let motivo = null;
  const quiereReducir = !!reducirMovimiento || !!sistemaReduce;
  if (quiereReducir && modoMotion(elegido).espacial) {
    modo = 'reducido';
    motivo = reducirMovimiento ? 'ajuste' : 'sistema';
  }
  const v = velocidadMotion(velocidad);
  const m = modoMotion(modo);
  return {
    modo,
    elegido,
    motivo,
    velocidad: v.id,
    factorTiempo: v.factor,
    intensidad: m.intensidad,
    apagado: modo === 'off',
    reducido: modo === 'reducido',
    espacial: m.espacial,
    extras: lista(m.extras),
  };
}

/**
 * El modo que `App.jsx` escribe en `<html data-motion>`: lo elegido y el
 * interruptor de Ajustes. **El del sistema operativo no**: ése lo aplica el
 * propio CSS con `@media (prefers-reduced-motion)`, que se entera al momento
 * de que él lo cambia, sin escuchar nada.
 */
export function atributoMotion({ animaciones = 'completa', reducirMovimiento = false } = {}) {
  return contextoMotion({ animaciones, reducirMovimiento }).modo;
}

/** ¿Tiene el sistema operativo «Reducir movimiento» activado? (`false` donde no se puede saber.) */
export function sistemaPideReducir() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** El contexto de la página de ahora (para las animaciones de JavaScript). */
export function contextoDelDocumento() {
  if (typeof document === 'undefined') return contextoMotion();
  const ds = document.documentElement.dataset || {};
  return contextoMotion({
    animaciones: guardadoDeModo(ds.motion || 'normal'),
    reducirMovimiento: false,
    velocidad: ds.velocidad || 'normal',
    sistemaReduce: sistemaPideReducir(),
  });
}

/**
 * El aviso de que el modo o la velocidad han cambiado, para que `useMotion`
 * (src/components/motion.jsx) vuelva a leer el documento. `App.jsx` lo lanza
 * después de escribir los atributos; nadie más lo necesita.
 */
export const EVENTO_MOTION = 'josstyle:motion';
export function avisarCambioDeMotion() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(EVENTO_MOTION));
}

/** Cuánto dura un token en un contexto: 0 si no se mueve nada. */
export function duracionMs(token, ctx = contextoMotion()) {
  if (ctx.apagado) return 0;
  const base = DURACIONES_MOTION[token];
  if (base === undefined) throw new Error(`duracionMs: duración desconocida «${token}»`);
  return Math.round(base * ctx.factorTiempo);
}

/** El valor de un token de intensidad en un contexto. */
export const distancia = (id, ctx = contextoMotion()) => intensificar('distancia', id, ctx.intensidad);
export const escala = (id, ctx = contextoMotion()) => intensificar('escala', id, ctx.intensidad);
export const pulso = (id, ctx = contextoMotion()) => intensificar('pulso', id, ctx.intensidad);

/* ───────────────────────────────────────────────────────────────────────────
   10 · LA API PARA LAS VISTAS (apartados 19 y 21)

   *"Quiero una entrada premium"* sin saber duraciones ni curvas. Una vista que
   necesite una transición en su `style` la pide con nombres:
       transicion('width', 'slow')
       → 'width var(--motion-dur-slow) var(--ease-premium)'
   y nunca escribe `0.4s ease` (la auditoría de la F0 cuenta los literales, y
   la deuda no puede crecer).
   ─────────────────────────────────────────────────────────────────────────── */
export function transicion(propiedades, duracion = 'normal', curva = 'standard', { retraso = null } = {}) {
  if (DURACIONES_MOTION[duracion] === undefined) throw new Error(`transicion: duración desconocida «${duracion}»`);
  if (!CURVAS_MOTION[curva]) throw new Error(`transicion: curva desconocida «${curva}»`);
  const props = Array.isArray(propiedades) ? propiedades : [propiedades];
  const r = retraso ? ` var(${varDuracion(retraso)})` : '';
  return props.map((p) => `${p} var(${varDuracion(duracion)}) var(${varCurva(curva)})${r}`).join(', ');
}

/* ───────────────────────────────────────────────────────────────────────────
   11 · LOS PRESETS (apartado 20)

   Cada uno dice qué hace con nombres —cuánto se desplaza, desde qué escala,
   con qué duración y qué curva— y `fotogramas()` lo traduce al contexto de
   ahora. **Ningún preset lleva un número propio**: todo sale de los tokens.

   `clase` dice qué clase de `index.css` ya lo hace en CSS (la entrada de un
   módulo, la de una hoja…): esos se usan poniendo la clase, y el preset es
   para cuando el CSS no basta (salir antes de desmontar, invertir a mitad).
   ─────────────────────────────────────────────────────────────────────────── */
export const PRESETS_MOTION = {
  pageEnter: { que: 'Una pantalla entra', clase: 'module-enter', duracion: 'slow', curva: 'standard', desde: { opacidad: 'hidden', x: 'large', escala: 'micro' } },
  pageExit: { que: 'Una pantalla se va', duracion: 'normal', curva: 'exit', hasta: { opacidad: 'hidden', x: '-small' } },
  /* MS F2 — volver no es entrar otra vez (apartado 6): llega del lado del que salió, más corto y
     sin escala. Y cambiar de sección no es ni lo uno ni lo otro: las secciones son hermanas. Los dos
     arrancan medio visibles para que entre una pantalla y otra no haya un instante vacío. */
  pageBack: { que: 'Volver a una pantalla', clase: 'nav-vuelve', duracion: 'normal', curva: 'standard', desde: { opacidad: 'secondary', x: '-small' } },
  sectionSwitch: { que: 'Cambiar de sección con la barra de abajo', clase: 'nav-seccion', duracion: 'normal', curva: 'standard', desde: { opacidad: 'secondary', y: 'small' } },
  /* MS F2, apartado 15 — una transición de CONTENIDO, no de página: otra pestaña dentro de la misma
     pantalla. Más corta y sin moverse: lo que cambia es lo de dentro, no el sitio. */
  contentChange: { que: 'Cambia lo de dentro de una pantalla (otra pestaña)', clase: 'contenido-cambia', duracion: 'fast', curva: 'standard', desde: { opacidad: 'secondary' } },
  cardEnter: { que: 'Una tarjeta entra', clase: 'hub-card', duracion: 'cinematic', curva: 'standard', desde: { opacidad: 'hidden', y: 'medium', escala: 'subtle' } },
  cardExit: { que: 'Una tarjeta se va', duracion: 'normal', curva: 'exit', hasta: { opacidad: 'hidden', escala: 'subtle' } },
  modalEnter: { que: 'Una ventana aparece', duracion: 'normal', curva: 'entrance', desde: { opacidad: 'hidden', y: 'small', escala: 'micro' } },
  modalExit: { que: 'Una ventana se cierra', duracion: 'fast', curva: 'exit', hasta: { opacidad: 'hidden', y: 'small', escala: 'micro' } },
  sheetEnter: { que: 'Una hoja sube', clase: 'hoja-entra', duracion: 'normal', curva: 'standard', desde: { opacidad: 'hidden', y: 'medium', escala: 'micro' } },
  sheetExit: { que: 'Una hoja baja', duracion: 'fast', curva: 'exit', hasta: { opacidad: 'hidden', y: 'large' } },
  listReveal: { que: 'Una lista entra en cascada', clase: 'hub-card', duracion: 'cinematic', curva: 'standard', escalonado: true, desde: { opacidad: 'hidden', y: 'medium', escala: 'subtle' } },
  success: { que: 'Algo ha salido bien', clase: 'exito-entra', duracion: 'medium', curva: 'standard', desde: { opacidad: 'hidden', escala: 'hero' } },
  error: { que: 'Algo ha fallado: un vaivén corto, sin agresividad', duracion: 'medium', curva: 'smooth', vaiven: 'micro' },
  /* MS F3 — `fuerte`, como el fotograma de `favoritoPulso` en index.css: el preset decía `suave` y el
     CSS latía a `fuerte`, así que la misma marca latía distinto por JavaScript que por CSS. */
  selection: { que: 'Se ha elegido algo', clase: 'favorito-guardado', duracion: 'normal', curva: 'standard', pulso: 'fuerte' },
  press: { que: 'Pulsar', clase: 'fit-pulsable', duracion: 'fast', curva: 'standard', hasta: { escala: 'micro' } },
  hover: { que: 'Pasar el puntero (solo con ratón)', duracion: 'fast', curva: 'standard', hasta: { y: '-micro' } },
  expand: { que: 'Abrir un desplegable', duracion: 'medium', curva: 'smooth', acordeon: true },
  collapse: { que: 'Cerrar un desplegable', duracion: 'fast', curva: 'smooth', acordeon: true },
  dataChange: { que: 'Una cifra cambia', duracion: 'normal', curva: 'standard', desde: { opacidad: 'secondary', y: 'micro' } },
  heroReveal: { que: 'Un momento importante', clase: 'fit-rango-sube', duracion: 'momento', curva: 'emphasized', desde: { opacidad: 'subtle', escala: 'hero' }, sobrepaso: true },
  /* MS F9, apartado 33 — un aviso entra (`aviso-entra`, CSS) y SE VA por donde vino: hacia abajo, en
     `fast` y con la curva de salida. Antes desaparecía de golpe. */
  toastEnter: { que: 'Un aviso aparece', clase: 'aviso-entra', duracion: 'medium', curva: 'standard', desde: { opacidad: 'hidden', y: 'small' } },
  toastExit: { que: 'Un aviso se va', duracion: 'fast', curva: 'exit', hasta: { opacidad: 'hidden', y: 'small' } },
};

const signoYToken = (v) => {
  const s = String(v || '');
  return s.startsWith('-') ? { signo: -1, id: s.slice(1) } : { signo: 1, id: s };
};

function estadoDe(parte, ctx) {
  if (!parte) return { opacity: '1', transform: 'none' };
  const op = parte.opacidad ? OPACIDADES_MOTION[parte.opacidad] : 1;
  const tr = [];
  if (parte.x) { const { signo, id } = signoYToken(parte.x); tr.push(`translateX(${signo * distancia(id, ctx)}px)`); }
  if (parte.y) { const { signo, id } = signoYToken(parte.y); tr.push(`translateY(${signo * distancia(id, ctx)}px)`); }
  if (parte.escala) tr.push(`scale(${escala(parte.escala, ctx)})`);
  const limpio = tr.filter((x) => !/\((0px|1)\)$/.test(x));
  return { opacity: String(op), transform: limpio.length ? limpio.join(' ') : 'none' };
}

/**
 * Los fotogramas y las opciones de un preset en un contexto, listos para la
 * Web Animations API. En Reducido salen sin desplazamiento ni escala (solo el
 * fundido); apagado, con duración 0.
 */
export function fotogramas(presetId, ctx = contextoMotion()) {
  const p = PRESETS_MOTION[presetId];
  if (!p) throw new Error(`fotogramas: preset desconocido «${presetId}»`);
  const opciones = {
    duration: duracionMs(p.duracion, ctx),
    easing: CURVAS_MOTION[p.curva],
    fill: p.hasta ? 'forwards' : 'backwards',
  };
  if (p.acordeon) return { keyframes: [], opciones, acordeon: true };
  if (p.vaiven) {
    const d = distancia(p.vaiven, ctx);
    const k = d === 0 ? [{ opacity: '1' }, { opacity: String(OPACIDADES_MOTION.secondary) }, { opacity: '1' }]
      : [{ transform: 'none' }, { transform: `translateX(${-d}px)` }, { transform: `translateX(${d}px)` }, { transform: 'none' }];
    return { keyframes: k, opciones: { ...opciones, fill: 'none' } };
  }
  if (p.pulso) {
    const s = pulso(p.pulso, ctx);
    return { keyframes: [{ transform: 'none' }, { transform: s === 1 ? 'none' : `scale(${s})` }, { transform: 'none' }], opciones: { ...opciones, fill: 'none' } };
  }
  const desde = p.desde ? estadoDe(p.desde, ctx) : { opacity: '1', transform: 'none' };
  const hasta = p.hasta ? estadoDe(p.hasta, ctx) : { opacity: '1', transform: 'none' };
  const keyframes = [desde];
  if (p.sobrepaso && ctx.espacial) keyframes.push({ offset: 0.6, opacity: '1', transform: `scale(${pulso('sobrepaso', ctx)})` });
  keyframes.push(hasta);
  return { keyframes, opciones };
}

/* ───────────────────────────────────────────────────────────────────────────
   12 · LAS PRIMITIVAS (apartados 8-12)

   Funcionan sobre cualquier objeto que se parezca a un elemento del DOM
   (`animate`, `getBoundingClientRect`, `style`), así que se prueban en Node con
   un doble y en Chromium con el de verdad.
   ─────────────────────────────────────────────────────────────────────────── */

const ANIMACIONES_VIVAS = new WeakMap();

/** Lo que se ve AHORA de un elemento: su opacidad y su transformación calculadas. */
export function estadoVisual(el) {
  try {
    const cs = (typeof getComputedStyle === 'function' ? getComputedStyle(el) : el.style) || {};
    return { opacity: String(cs.opacity === '' || cs.opacity === undefined ? '1' : cs.opacity), transform: cs.transform && cs.transform !== '' ? cs.transform : 'none' };
  } catch {
    return { opacity: '1', transform: 'none' };
  }
}

/**
 * Anima un elemento con un preset. 🚨 **Si ya había una animación suya en
 * marcha, la nueva empieza desde donde está AHORA** (apartado 12): *"el
 * usuario abre una card y antes de terminar pulsa atrás — el sistema debe
 * invertir desde el estado actual, NO terminar, volver al inicio y hacer otra"*.
 * Por eso se lee el estado visual **antes** de cancelar la anterior.
 */
export function animar(el, presetId, { ctx = contextoDelDocumento(), retraso = 0 } = {}) {
  if (!el) return null;
  const { keyframes, opciones } = fotogramas(presetId, ctx);
  const previa = ANIMACIONES_VIVAS.get(el);
  let frames = keyframes;
  let interrumpida = false;
  if (previa && (previa.playState === 'running' || previa.playState === 'pending')) {
    const ahora = estadoVisual(el);
    frames = [ahora, ...keyframes.slice(1)];
    interrumpida = true;
  }
  if (previa && typeof previa.cancel === 'function') previa.cancel();
  if (typeof el.animate !== 'function' || opciones.duration === 0 || frames.length < 2) {
    ANIMACIONES_VIVAS.delete(el);
    return null;
  }
  /* MS F11 — por el orquestador: queda apuntada con su sistema y su prioridad. Lo de «desde donde se ve»
     ya lo ha resuelto esta función (leyó el estado antes de cancelar la previa). */
  const a = animarOrquestado(el, frames, { ...opciones, delay: retraso }, { sistema: 'motor' });
  if (!a) { ANIMACIONES_VIVAS.delete(el); return null; }
  a.interrumpida = interrumpida;
  ANIMACIONES_VIVAS.set(el, a);
  const limpiar = () => { if (ANIMACIONES_VIVAS.get(el) === a) ANIMACIONES_VIVAS.delete(el); };
  if (a.finished && typeof a.finished.then === 'function') a.finished.then(limpiar, limpiar);
  return a;
}

/** ¿Tiene este elemento una animación del motor en marcha? */
export const animandose = (el) => {
  const a = el && ANIMACIONES_VIVAS.get(el);
  return !!a && (a.playState === 'running' || a.playState === 'pending');
};

/* ── PRESENCIA (apartado 9) ────────────────────────────────────────────────
   Cuatro estados y tres eventos. Es una máquina pura para poder probar las
   cuatro cosas que el apartado prohíbe:
     · desaparición instantánea → al ocultar se pasa por `saliendo`;
     · ocupar espacio después de desaparecer → `fin` en `saliendo` desmonta;
     · parpadeos → mostrar durante `saliendo` vuelve a `entrando` SIN desmontar;
     · doble montaje → mostrar algo que ya está entrando o visible no hace nada. */
export const ESTADOS_PRESENCIA = ['oculto', 'entrando', 'visible', 'saliendo'];

export function siguientePresencia(estado, evento) {
  if (evento === 'mostrar') return estado === 'oculto' || estado === 'saliendo' ? 'entrando' : estado;
  if (evento === 'ocultar') return estado === 'visible' || estado === 'entrando' ? 'saliendo' : estado;
  if (evento === 'fin') {
    if (estado === 'entrando') return 'visible';
    if (estado === 'saliendo') return 'oculto';
  }
  return estado;
}

export const estaMontado = (estado) => estado !== 'oculto';

/* ── LAYOUT: FLIP (apartado 10) ───────────────────────────────────────────
   First, Last, Invert, Play: se mide dónde estaba cada cosa, se cambia el
   diseño, se mide dónde ha quedado y se anima la diferencia con `transform`
   (que no recalcula el diseño en cada fotograma). Así *"una card que aumenta de
   tamaño mueve el resto de elementos de manera natural. NO deben saltar"*. */
export function deltaFlip(antes, despues) {
  if (!antes || !despues) return null;
  const dx = antes.left - despues.left;
  const dy = antes.top - despues.top;
  const sx = despues.width ? antes.width / despues.width : 1;
  const sy = despues.height ? antes.height / despues.height : 1;
  const quieto = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.005 && Math.abs(sy - 1) < 0.005;
  return quieto ? null : { dx: redondear(dx, 2), dy: redondear(dy, 2), sx: redondear(sx, 4), sy: redondear(sy, 4) };
}

const rect = (el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

/**
 * Mide `elementos`, ejecuta `cambiar()` (que mueve el diseño) y anima cada
 * elemento desde donde estaba. En Reducido no se desplaza nada (aparece en su
 * sitio): mover el diseño es justo el movimiento que se quita.
 */
export function flip(elementos, cambiar, { ctx = contextoDelDocumento(), duracion = 'medium', curva = 'standard', escalar = false } = {}) {
  const els = lista(elementos).filter(Boolean);
  const antes = new Map(els.map((el) => [el, rect(el)]));
  if (typeof cambiar === 'function') cambiar();
  if (!ctx.espacial || ctx.apagado) return [];
  const ms = duracionMs(duracion, ctx);
  const animaciones = [];
  els.forEach((el) => {
    const d = deltaFlip(antes.get(el), rect(el));
    if (!d || typeof el.animate !== 'function') return;
    const desde = escalar ? `translate(${d.dx}px, ${d.dy}px) scale(${d.sx}, ${d.sy})` : `translate(${d.dx}px, ${d.dy}px)`;
    const a = animarOrquestado(el, [{ transform: desde, transformOrigin: 'top left' }, { transform: 'none', transformOrigin: 'top left' }], { duration: ms, easing: CURVAS_MOTION[curva] }, { sistema: 'layout' });
    if (a) animaciones.push(a);
  });
  return animaciones;
}

/* ── ELEMENTO COMPARTIDO (apartado 11) ────────────────────────────────────
   CARD → DETAIL, THUMBNAIL → IMAGE: el destino nace donde estaba el origen y
   viaja hasta su sitio. Es un FLIP entre DOS elementos: se mide el origen
   antes de cambiar de pantalla y el destino después. La F7 decide dónde tiene
   sentido; aquí está la pieza. */
export function compartirElemento(rectOrigen, destino, { ctx = contextoDelDocumento(), duracion = 'slow', curva = 'standard' } = {}) {
  if (!destino || !rectOrigen) return null;
  if (!ctx.espacial || ctx.apagado) {
    if (!ctx.apagado && typeof destino.animate === 'function') {
      return animarOrquestado(destino, [{ opacity: 0 }, { opacity: 1 }], { duration: duracionMs('fast', ctx), easing: CURVAS_MOTION.standard }, { sistema: 'continuidad' });
    }
    return null;
  }
  const d = deltaFlip(rectOrigen, rect(destino));
  if (!d || typeof destino.animate !== 'function') return null;
  return animarOrquestado(destino, [
    { transform: `translate(${d.dx}px, ${d.dy}px) scale(${d.sx}, ${d.sy})`, transformOrigin: 'top left' },
    { transform: 'none', transformOrigin: 'top left' },
  ], { duration: duracionMs(duracion, ctx), easing: CURVAS_MOTION[curva] }, { sistema: 'continuidad' });
}

/* ───────────────────────────────────────────────────────────────────────────
   13 · LEER index.css (para que la tabla y el CSS no puedan decir dos cosas)
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentariosCss = (css) => String(css || '').replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' '));

/** Las variables que declara un bloque cuyo selector es EXACTAMENTE `selector`. */
export function variablesDeBloque(css, selector) {
  const limpio = sinComentariosCss(css);
  const out = {};
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let mt;
  while ((mt = re.exec(limpio))) {
    const sel = mt[1].replace(/\s+/g, ' ').trim();
    if (sel !== selector) continue;
    for (const d of mt[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  }
  return out;
}

/** Las variables de `:root` (todas las declaraciones de los bloques `:root`). */
export const tokensRaiz = (css) => variablesDeBloque(css, ':root');

/**
 * Sustituye en un valor las `var(--motion-dur-*)` por su valor de `:root`, para
 * que una auditoría que mide milisegundos (`duracionEnCss` de la FIT F37, la F0)
 * siga midiendo de verdad cuando la regla usa un token.
 */
export function resolverDuraciones(valor, raiz) {
  return String(valor || '').replace(/var\((--motion-(?:dur|retraso)-[\w-]+)\)/g, (x, nombre) => (raiz && raiz[nombre]) || x);
}

/**
 * 🚨 La comparación que hace que la tabla y el CSS no puedan decir dos cosas.
 * Devuelve cada variable que no coincide —en `:root`, en cada modo, en cada
 * velocidad y en el bloque del sistema operativo—, y también las `--motion-*`
 * que el CSS declara y la tabla no conoce. Vacío es que dicen lo mismo.
 */
export function auditarTokensCss(css) {
  const diferencias = [];
  const comparar = (selector, esperado) => {
    const real = variablesDeBloque(css, selector);
    Object.entries(esperado).forEach(([k, v]) => {
      if (real[k] !== v) diferencias.push({ selector, variable: k, esperado: v, real: real[k] === undefined ? null : real[k] });
    });
    Object.keys(real).filter((k) => /^--motion-/.test(k) && !(k in esperado))
      .forEach((k) => diferencias.push({ selector, variable: k, esperado: null, real: real[k] }));
  };
  comparar(':root', { ...tokensFijos(), ...tokensDeModo('normal'), ...tokensDeTiempo('normal') });
  ['reducido', 'premium', 'ultra'].forEach((m) => comparar(`html[data-motion='${m}']`, tokensDeModo(m)));
  ['lenta', 'rapida'].forEach((v) => comparar(`html[data-velocidad='${v}']`, tokensDeTiempo(v)));
  comparar("html:not([data-motion='off'])", tokensDeModo('reducido'));
  return diferencias;
}

/**
 * El movimiento reducido, en el CSS de verdad: el del sistema operativo y el
 * de Ajustes llevan los desplazamientos a cero (no la duración: eso es
 * «Sin movimiento»), y «Sin movimiento» lleva todo a 0,01 ms.
 */
export function movimientoReducidoEnCss(css) {
  const limpio = sinComentariosCss(css);
  const ajuste = variablesDeBloque(css, "html[data-motion='reducido']");
  const sistemaBloque = (limpio.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*html:not\(\[data-motion='off'\]\)\s*\{([^{}]*)\}/) || [])[1] || '';
  const sistema = {};
  for (const d of sistemaBloque.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) sistema[d[1]] = d[2].trim();
  const sinDesplazar = (vars) => Object.keys(DISTANCIAS_MOTION).every((k) => vars[`--motion-dist-${k}`] === '0px');
  const apagado = /html\[data-motion='off'\][^{]*\{[^}]*animation-duration:\s*0\.01ms/.test(limpio)
    && /html\[data-motion='off'\][^{]*\{[^}]*transition-duration:\s*0\.01ms/.test(limpio);
  return { ajuste: sinDesplazar(ajuste), sistema: sinDesplazar(sistema), apagado, ok: sinDesplazar(ajuste) && sinDesplazar(sistema) && apagado };
}

/* ───────────────────────────────────────────────────────────────────────────
   14 · LA REGLA DE FUTURO (apartado 24) y lo que no se hace
   ─────────────────────────────────────────────────────────────────────────── */
export const REGLA_DE_FUTURO_F1 = [
  'Ningún componente nuevo de JosStyle crea su propio sistema de animación: usa una clase de index.css que ya existe, `transicion()`, `escalonado()` o un preset de `animar()`.',
  'Si algo no se puede expresar con lo que hay: se identifica el patrón, se añade el token, el preset o la primitiva AQUÍ (y su variable a index.css), se documenta en MOTION_SYSTEM.md y se usa.',
  'Ni una duración, una curva, un desplazamiento ni una escala escritos a mano: la auditoría de la F0 cuenta los literales y la deuda no puede crecer.',
];

export const NO_EN_F1 = [
  { que: 'Animar las ~40 ventanas que hoy aparecen de golpe', porque: 'Es la F6 (profundidad y capas). La F1 deja `Presencia` y los presets `modalEnter/Exit` y `sheetEnter/Exit` listos para ella.' },
  { que: 'Tarjeta → detalle en la navegación', porque: 'Es la F7. Aquí está `compartirElemento`, probado en Chromium.' },
  { que: 'Gobernar las gráficas de Recharts', porque: 'Es la F4 (hallazgo `graficas_sin_control`).' },
  { que: 'Unificar los tres interruptores y los `transition-all` de Ajustes', porque: 'Es la F3 (hallazgo `tres_interruptores`). La F1 pasa a `Switch` solo el de «Reducir movimiento», que es el que toca.' },
  { que: 'Las cifras que cuentan', porque: 'Es la F17. El preset `dataChange` es su punto de partida.' },
];
