/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F4 — DATOS DINÁMICOS, LISTAS, GRÁFICAS Y ESTADOS

   *"El movimiento debe ayudar al usuario a entender QUÉ ha cambiado. No animar
   por decorar."* (la misión de la fase). Esta librería decide, sin tocar el DOM,
   cómo se mueve un dato que cambia:

     · **las gráficas de Recharts**, que animaban 1,5 s y no obedecían a «Reducir
       movimiento» (hallazgo `graficas_sin_control` de la F0): ahora piden su
       duración, su curva y si se animan al motor (`animacionDeGrafica`);
     · **una cifra que cambia** (apartados 2-4 y 38-39): qué hace —contar, relevarse
       o nada—, en qué dirección, con qué decimales, y cuántas pueden contar a la
       vez (`planDeCifra`, el presupuesto);
     · y lo que la fase pide y es de otra (`NO_EN_F4`).

   Las piezas que lo pintan son `CifraQueCambia` y `useAnimacionDeGrafica`
   (`src/components/motion.jsx`), y el movimiento de CSS vive en `index.css`.
   ⚠️ No importa nada de React ni del DOM: se prueba en Node.
   =========================================================================== */
import { CURVAS_MOTION, duracionMs, contextoMotion } from './motion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LAS GRÁFICAS (apartados 21-28)

   Recharts anima con JavaScript (`react-smooth`), así que las reglas de
   `index.css` —modos, velocidad, Reducido— no le llegaban: dibujaba cada línea
   durante 1,5 s con su propia curva. Ahora:
     · dibuja en `cinematic` (420 ms, el tope del nivel 3): *"no hacer una
       animación exageradamente larga"* (apartado 21), con la curva de JosStyle;
     · al cambiar los datos —otro periodo, otra semana— **no se destruye**: la
       misma gráfica interpola de los puntos de antes a los nuevos (apartado 22),
       que es lo que hace Recharts mientras no se le cambie la `key`;
     · en Reducido y con «Sin movimiento» **no dibuja**: la línea aparece en su
       sitio. Dibujar es un desplazamiento (C-52).
   El tooltip, rápido (apartado 27): aparece y se va en `fast`.
   ─────────────────────────────────────────────────────────────────────────── */
export function animacionDeGrafica(ctx = contextoMotion()) {
  if (ctx.apagado || ctx.reducido) return { isAnimationActive: false };
  return {
    isAnimationActive: true,
    animationBegin: 0,
    animationDuration: duracionMs('cinematic', ctx),
    animationEasing: CURVAS_MOTION.standard,
  };
}

export function animacionDeTooltip(ctx = contextoMotion()) {
  if (ctx.apagado || ctx.reducido) return { isAnimationActive: false };
  return { isAnimationActive: true, animationDuration: duracionMs('fast', ctx), animationEasing: CURVAS_MOTION.standard };
}

/* ───────────────────────────────────────────────────────────────────────────
   2 · UNA CIFRA QUE CAMBIA (apartados 2-6)

   Dos maneras, y la mayoría de las cifras usa la primera:
     · **relevo**: el valor nuevo ya está escrito desde el primer momento (lo
       lee VoiceOver y lo lee una prueba) y entra con un fundido corto desde
       abajo si SUBE o desde arriba si BAJA (`cifra-sube`, `cifra-baja`): se
       entiende el sentido del cambio sin colores ni sustos (apartado 6);
     · **cuenta**: el número recorre los valores intermedios (72 → 73,
       420 € → 465 €), para las cifras principales de una pantalla.
   🚨 **Nunca al aparecer** (apartado 4: *"no hacer 0 → 100 cada vez que aparece
   una pantalla"*): sin valor anterior no hay nada que contar. Y sin dato
   (`null`), tampoco: un hueco no se anima hacia un número.
   En Reducido una cuenta se vuelve relevo —el fundido, sin moverse— y con «Sin
   movimiento» el valor cambia sin más.
   ─────────────────────────────────────────────────────────────────────────── */
const esNumero = (v) => typeof v === 'number' && Number.isFinite(v);

/** Los decimales con los que viene escrito un número (12.5 → 1, 1850 → 0), con un tope. */
export function decimalesDe(n) {
  if (!esNumero(n)) return 0;
  const s = String(n);
  if (/e/i.test(s)) return 0;
  const i = s.indexOf('.');
  return i < 0 ? 0 : Math.min(6, s.length - i - 1);
}

/** El valor intermedio de una cuenta, con la precisión de la cifra. */
export function interpolarCifra(desde, hasta, t, decimales = 0) {
  const p = Math.max(0, Math.min(1, t));
  const v = desde + (hasta - desde) * p;
  return Number(v.toFixed(decimales));
}

/** La curva de una cuenta: arranca deprisa y se posa en el valor (la `standard` de JosStyle, aproximada). */
export const curvaDeCuenta = (t) => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3;

/** Cuántas cifras pueden contar a la vez (apartados 38 y 39); a partir de ahí, las demás se relevan. */
export const CUENTAS_A_LA_VEZ = 4;
let cuentasEnMarcha = 0;
export function reservarCuenta() {
  if (cuentasEnMarcha >= CUENTAS_A_LA_VEZ) return false;
  cuentasEnMarcha += 1;
  return true;
}
export function liberarCuenta() { cuentasEnMarcha = Math.max(0, cuentasEnMarcha - 1); }
export const cuentasActivas = () => cuentasEnMarcha;

/**
 * Qué hacer cuando una cifra pasa de `desde` a `hasta`. `null` = nada (no ha
 * cambiado, es la primera vez, falta el dato o el movimiento está apagado).
 */
export function planDeCifra(desde, hasta, { modo = 'relevo', ctx = contextoMotion(), duracion = 'normal', hayTurno = true } = {}) {
  if (!esNumero(desde) || !esNumero(hasta) || desde === hasta) return null;
  if (ctx.apagado) return null;
  const direccion = hasta > desde ? 1 : -1;
  if (modo === 'cuenta' && !ctx.reducido && hayTurno) {
    return {
      tipo: 'cuenta', desde, hasta, direccion,
      decimales: Math.max(decimalesDe(desde), decimalesDe(hasta)),
      duracion: duracionMs(duracion, ctx),
    };
  }
  return { tipo: 'relevo', direccion, clase: direccion > 0 ? 'cifra-sube' : 'cifra-baja' };
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LA AUDITORÍA DE LO QUE CAMBIA (apartados 1 y 43)

   *"Analiza todo el proyecto y localiza"*: lo que hay, qué movimiento tenía y
   qué queda. Lo que es de otra fase lo dice.
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F4 = [
  { que: 'Gráficas', hay: 'Tres de Recharts (el peso en Salud, el sueño de 7 días, la evolución de Nutrición) y las de Fitness, dibujadas a mano en SVG.', antes: 'Las de Recharts animaban 1,5 s con su curva y no obedecían a «Reducir movimiento» (hallazgo `graficas_sin_control`).', queda: 'Gobernadas por el motor: 420 ms con la curva de JosStyle, interpolan al cambiar de periodo y en Reducido aparecen sin dibujarse. Las de Fitness se funden al cambiar de periodo o de métrica (`CambioDeContenido`).' },
  { que: 'Cifras principales', hay: 'La puntuación del día, el progreso de Hoy, las calorías y macros de Nutrición, el saldo de Economía.', antes: 'Cambiaban de golpe (hallazgo `cifras_de_golpe`).', queda: '`CifraQueCambia`: la puntuación, el porcentaje de Hoy, las calorías y el saldo CUENTAN; «2/3 hechos» y lo demás se RELEVAN, subiendo o bajando según el cambio. Nunca al aparecer. La F17 la lleva al resto de cifras.' },
  { que: 'Barras de progreso', hay: 'Las de Nutrición, Fitness (`fit-barra`), objetivos y hábitos, y el aro de la puntuación.', antes: 'Ya iban del valor anterior al nuevo (MS F1: `transicion(\'width\', …)`), y al montarse no se disparan: no hay un 0 → 100 al abrir.', queda: 'Igual, en las dos direcciones: retroceder no es un error (apartado 6), y la cifra de al lado dice si subió o bajó.' },
  { que: 'Estados vacíos', hay: '`EmptyHint` y los vacíos de cada pantalla.', antes: 'Aparecían plantados.', queda: 'Entran con un fundido corto (`vacio-entra`), sin ser protagonistas (apartado 14).' },
  { que: 'Carga y esqueletos', hay: 'Una sola carga, al abrir la aplicación, con un `Esqueleto` con la forma de Hoy (E3 F14).', antes: 'El latido del esqueleto ya es sutil y barato (opacidad), y respeta los modos.', queda: 'Del esqueleto al contenido, la pantalla entra con el fundido de «cambiar de sección» (F2), sin salto. No hay más cargadores: navegar no espera a nada.' },
  { que: 'Listas que cambian (añadir, quitar, reordenar, filtrar)', hay: 'Tareas, comidas, movimientos, hábitos…', antes: 'El resto de la lista salta (hallazgo `listas_que_saltan`).', queda: 'Es la F10 (el diseño que cambia), con `useFlip` de la F1. La identidad sí se conserva ya: cada fila lleva su `id` como `key`, así que completar una tarea es el mismo objeto cambiando (`tarea-hecha`).' },
  { que: 'Búsqueda', hay: 'El buscador global y los de cada módulo.', antes: 'Los resultados aparecen sin entrada.', queda: 'Se queda así: *"la prioridad es respuesta inmediata"* (apartado 13).' },
  { que: 'Cambios de estado', hay: 'Completar una tarea (`tarea-hecha`), un hábito (`habito-hecho`), una rutina (`rutina-fin`), un libro (`celebracion-libro`), subir de rango (`fit-rango-sube`), la racha (`fuego-sube`, `racha-mas-uno`).', antes: 'Ya existen, cada uno con su nivel: lo cotidiano es micro y lo importante, una firma escasa.', queda: 'Se quedan: es exactamente la distinción del apartado 33.' },
  { que: 'Calendarios', hay: 'El mes del Calendario y el de Nutrición, la tira de días.', antes: 'El mes cambia con su entrada (`calendar-month-grid`).', queda: 'Se queda (apartado 29). Que la tira de días se desplace con continuidad es la F10 (scroll).' },
  { que: 'Sincronización, tiempo real y acciones optimistas', hay: 'Todo se carga una vez; guardar actualiza la pantalla al momento y luego sube (`saveData`).', antes: 'No hay tiempo real, y un guardado que falla no se deshace en la pantalla (solo Fitness lo avisa, FIT F37).', queda: 'Es la F16 (estados de sistema, sincronización y offline). No se finge un rollback que no existe.' },
];

export const NO_EN_F4 = [
  { que: 'Añadir, quitar, reordenar y filtrar una lista sin que salte (apartados 7-12)', porque: 'Es la F10 (`SOLAPES_ROADMAP`: el diseño que cambia), con `useFlip` de la F1 esperándola.' },
  { que: 'Las cifras de todos los paneles y estadísticas (apartados 30-31)', porque: 'La F17 es la capa de datos completa; la F4 deja el sistema (`CifraQueCambia`) y lo pone en las cifras principales.' },
  { que: 'Rollback animado de una acción optimista que falla (apartados 36-37)', porque: 'Hoy un guardado que falla no se deshace en la pantalla: es la F16 (sincronización y errores). Animar un rollback que no existe sería la regla 8.' },
  { que: 'Cambios que llegan de otro dispositivo (apartados 19-20)', porque: 'No hay tiempo real: se carga al abrir. La F16.' },
];

/* El reparto de la intensidad cuando cambian varias cosas a la vez (apartados 30 y 39). */
export const JERARQUIA_DATOS_F4 = [
  { que: 'La cifra principal de una pantalla', como: 'Cuenta (si hay turno en el presupuesto)' },
  { que: 'Las cifras secundarias y las comparaciones', como: 'Relevo: el valor nuevo ya está escrito y entra con un fundido corto' },
  { que: 'Las barras', como: 'Su transición de anchura, del valor anterior al nuevo' },
  { que: 'Más de cuatro cuentas a la vez', como: 'Las que sobran se relevan (`CUENTAS_A_LA_VEZ`)' },
];
