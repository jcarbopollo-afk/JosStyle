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
export function planDeCifra(desde, hasta, { modo = 'relevo', ctx = contextoMotion(), duracion = 'auto', hayTurno = true, desdeUltimo = null } = {}) {
  if (!esNumero(desde) || !esNumero(hasta) || desde === hasta) return null;
  if (ctx.apagado) return null;
  const direccion = hasta > desde ? 1 : -1;
  if (modo === 'cuenta' && !ctx.reducido && hayTurno) {
    return {
      tipo: 'cuenta', desde, hasta, direccion,
      decimales: Math.max(decimalesDe(desde), decimalesDe(hasta)),
      duracion: duracion === 'auto' ? duracionDeCuenta(desde, hasta, ctx) : duracionMs(duracion, ctx),
    };
  }
  /* MS F17, apartado 7 — un relevo que llega mientras el anterior aún se está viendo no se repite: el
     valor se escribe y ya está. Cinco cambios seguidos (10, 11, 12…) son UN movimiento, no cinco. */
  if (esNumero(desdeUltimo) && desdeUltimo < duracionMs('normal', ctx)) return { tipo: 'agrupado', direccion };
  return { tipo: 'relevo', direccion, clase: direccion > 0 ? 'cifra-sube' : 'cifra-baja' };
}

/* ───────────────────────────────────────────────────────────────────────────
   MS F17 · LA CUENTA, SEGÚN CUÁNTO CAMBIA (apartado 5)

   *"La duración debe depender del cambio de valor de forma razonable. No
   permitir 1 → 100000 con una animación interminable."* Se mide el cambio
   RELATIVO a la cifra (12 de 88 no es lo mismo que 12 de 1850) y se elige una
   talla entre `fast` y `slow`: nunca más que una transición de página. Una cifra
   que va con su barra no la usa: va al ritmo de la barra (`medium`, F14).
   ─────────────────────────────────────────────────────────────────────────── */
export const TALLAS_DE_CUENTA = Object.freeze([
  { hasta: 0.05, talla: 'fast' },
  { hasta: 0.25, talla: 'normal' },
  { hasta: 0.6, talla: 'medium' },
  { hasta: Infinity, talla: 'slow' },
]);
export function tallaDeCuenta(desde, hasta) {
  if (!esNumero(desde) || !esNumero(hasta)) return 'normal';
  const relativo = Math.abs(hasta - desde) / Math.max(Math.abs(desde), Math.abs(hasta), 1);
  return TALLAS_DE_CUENTA.find((t) => relativo <= t.hasta).talla;
}
export const duracionDeCuenta = (desde, hasta, ctx = contextoMotion()) => duracionMs(tallaDeCuenta(desde, hasta), ctx);

/* ───────────────────────────────────────────────────────────────────────────
   MS F17 · QUÉ CLASE DE CIFRA ES (apartado 4: «counter intelligence»)

   *"No animar cualquier número."* Cada cifra de JosStyle es de una clase, y la
   clase dice cómo se mueve. Un reloj que cambia cada segundo o un identificador
   NUNCA se animan: sería un espectáculo permanente (apartado 45).
   ─────────────────────────────────────────────────────────────────────────── */
export const CLASES_DE_CIFRA = Object.freeze([
  { id: 'principal', modo: 'cuenta', como: 'La cifra que da sentido a una pantalla (la puntuación, el saldo, las calorías): recorre los valores intermedios.', ejemplos: ['puntuación del día', 'saldo', 'calorías del día', 'porcentaje de Hoy'] },
  { id: 'con_barra', modo: 'cuenta', duracion: 'medium', como: 'Una cifra que acompaña a su barra: cuenta AL RITMO DE LA BARRA (`medium`, F14), para no decir 68 con la barra en 42 (apartado 11).', ejemplos: ['calorías con su barra', 'porcentaje de Hoy con su barra'] },
  { id: 'secundaria', modo: 'relevo', como: 'El valor nuevo ya está escrito y entra con un fundido corto desde abajo si sube o desde arriba si baja.', ejemplos: ['«2/3 hechos»', 'los días de una racha', '«2 / 3 completado»', 'el texto de una meta'] },
  { id: 'estatica', modo: null, como: 'No cambia mientras se mira (un total del catálogo, un año): no se anima.', ejemplos: ['número de ejercicios del catálogo'] },
  { id: 'reloj', modo: null, como: 'Cambia solo con el tiempo (el reloj de un entrenamiento, el temporizador): el número cambia y ya está; lo que se mueve, si algo, es su aro lineal.', ejemplos: ['RelojSesion', 'DescansoVivo', 'el Pomodoro'] },
  { id: 'identificador', modo: null, como: 'Un id, una versión, una fecha: nunca.', ejemplos: ['v3.146.0', '12 SEP'] },
]);
export const claseDeCifra = (id) => CLASES_DE_CIFRA.find((c) => c.id === id) || null;

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

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F17 — MOTION DE DATOS, PANELES, MÉTRICAS Y GRÁFICAS

   *"El movimiento debe ayudar a comprender el dato, no distraer del dato."* La
   F4 dejó el motor (`planDeCifra`, `CifraQueCambia`, las gráficas gobernadas)
   en las cifras principales; la F17 lo MEJORA —la cuenta sigue desde lo que se
   ve si el valor cambia a mitad, dura según cuánto cambia, los cambios seguidos
   se agrupan y el lector de pantalla oye el valor final— y lo LLEVA al resto:
   las rachas, los porcentajes junto a su barra, el texto de cada meta y
   objetivo. No hay un segundo motor (apartado 2): todo pasa por aquí.
   =========================================================================== */

/* ───────────────────────────────────────────────────────────────────────────
   MS F17 · UN EJE QUE NO BAILA (apartados 31 y 32)

   Recharts interpola la línea al cambiar los datos, pero los rótulos del eje
   saltan al momento: con el eje calculado en cada pintado, mover la ventana de
   Sueño una semana cambiaba la escala y la línea viajaba a una escala que ya no
   decía lo mismo. Un dominio REDONDO —un múltiplo de un paso bonito, con un
   mínimo— casi nunca cambia, y cuando cambia lo hace a un número que se lee.
   ─────────────────────────────────────────────────────────────────────────── */
/** El paso «bonito» (1, 2 o 5 × 10ⁿ) para repartir `rango` en unas `marcas`. */
export function pasoBonito(rango, marcas = 4) {
  const r = Math.abs(Number(rango)) || 1;
  const bruto = r / Math.max(1, marcas);
  const exp = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / exp;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return m * exp;
}

/**
 * El dominio estable de un eje: `[mínimo, máximo]` redondeados a un paso.
 *   · `desdeCero`: el eje empieza en 0 (horas, calorías);
 *   · `alMenos`: el máximo nunca baja de aquí (una semana de 6 h no encoge el eje a 6);
 *   · `paso`: si no se da, uno bonito.
 * Sin datos, `['auto', 'auto']`: no se inventa una escala.
 */
export function dominioEstable(valores, { desdeCero = true, alMenos = null, paso = null, marcas = 4 } = {}) {
  const v = (Array.isArray(valores) ? valores : []).filter(esNumero);
  if (!v.length) return ['auto', 'auto'];
  let min = Math.min(...v);
  let max = Math.max(...v);
  if (esNumero(alMenos)) max = Math.max(max, alMenos);
  if (desdeCero) min = Math.min(0, min);
  const p = esNumero(paso) && paso > 0 ? paso : pasoBonito(max - min || Math.abs(max) || 1, marcas);
  const bajo = desdeCero && min >= 0 ? 0 : Math.floor((min - (desdeCero ? 0 : p / 2)) / p) * p;
  const alto = Math.ceil((max + (desdeCero ? 0 : p / 2)) / p) * p;
  return [Number(bajo.toFixed(6)), Number((alto === bajo ? bajo + p : alto).toFixed(6))];
}

/* ───────────────────────────────────────────────────────────────────────────
   MS F17 · EL PRESUPUESTO DE UNA ACTUALIZACIÓN (apartados 45-47 y 58)

   *"En una misma actualización: priorizar el dato más importante."* Lo que se
   mueve cuando cambia un dato, por orden; lo demás se queda quieto.
   ─────────────────────────────────────────────────────────────────────────── */
export const PRESUPUESTO_DATOS = Object.freeze([
  { orden: 1, que: 'La cifra que ha cambiado', como: 'Cuenta (la principal) o relevo (el resto); como mucho `CUENTAS_A_LA_VEZ` contando.' },
  { orden: 2, que: 'Su barra o su aro', como: 'Su transición, al ritmo de la cifra (`medium`; el aro de la puntuación, `cinematic`, y la cifra con él).' },
  { orden: 3, que: 'La lista, si cambia de orden o se filtra', como: '`ListaAnimada` (F10): lo que sale, sale; lo demás se recoloca.' },
  { orden: 4, que: 'Nada más', como: 'Ni la tarjeta entera, ni el icono, ni el fondo, ni un badge: no se anima lo que no ha cambiado (apartado 20: cada tarjeta, lo suyo).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   MS F17 · EL MAPA DE LOS DATOS (apartado 1)

   Cada sitio de JosStyle donde se pinta un dato que cambia, con su clase y cómo
   se mueve. `patron` es el trozo de código que lo cumple en `archivo`: la prueba
   lo busca allí, así que quitarlo pone la suite roja (FIT F36).
   ─────────────────────────────────────────────────────────────────────────── */
export const MAPA_DATOS = Object.freeze([
  { id: 'puntuacion', que: 'La puntuación del día (Inicio) y su aro', archivo: 'src/views/DashboardView.jsx', clase: 'principal', patron: 'valor={puntuacion.valor} modo="cuenta" duracion="cinematic"', como: 'Cuenta al ritmo del aro (`cinematic`).' },
  { id: 'progreso_hoy', que: 'El porcentaje de Hoy', archivo: 'src/views/DashboardView.jsx', clase: 'principal', patron: 'valor={progreso.porcentaje} modo="cuenta"', como: 'Cuenta, con duración según cuánto cambia.' },
  { id: 'hechos_hoy', que: '«2/3 hechos»', archivo: 'src/views/DashboardView.jsx', clase: 'secundaria', patron: 'valor={progreso.hechos}', como: 'Relevo.' },
  { id: 'saldo', que: 'El saldo de Economía', archivo: 'src/views/FinanceView.jsx', clase: 'principal', patron: 'valor={saldo} modo="cuenta"', como: 'Cuenta con sus dos decimales y el € fuera.' },
  { id: 'nutricion', que: 'Las calorías y los macros del día', archivo: 'src/views/NutritionView.jsx', clase: 'con_barra', patron: "duracion={dato.objetivo !== null ? 'medium' : 'auto'}", como: 'Cuenta al ritmo de su barra (`medium`) cuando la tiene.' },
  { id: 'nutricion_porcentaje', que: 'El porcentaje de cada indicador', archivo: 'src/views/NutritionView.jsx', clase: 'secundaria', patron: 'valor={dato.porcentaje}', como: 'Relevo.' },
  { id: 'racha', que: 'Los días de cada racha', archivo: 'src/views/RachasView.jsx', clase: 'secundaria', patron: 'valor={resumen.actual}', como: 'Relevo: subir un día es rápido y discreto (apartado 14); la llama y el «+1» son de la racha.' },
  { id: 'racha_principal', que: 'La racha principal', archivo: 'src/views/RachasView.jsx', clase: 'secundaria', patron: 'valor={principal.actual}', como: 'Relevo.' },
  { id: 'productividad_hoy', que: '«2 / 3 completado» de Productividad', archivo: 'src/views/ProductivityView.jsx', clase: 'secundaria', patron: 'valor={resumen.hechos}', como: 'Relevo, con la barra del día al lado.' },
  { id: 'meta', que: 'El texto de una meta', archivo: 'src/views/ProductivityView.jsx', clase: 'secundaria', patron: 'valor={p.porcentaje}', como: 'Relevo, con su barra.' },
  { id: 'objetivo', que: 'El texto de un objetivo', archivo: 'src/views/ObjectivesView.jsx', clase: 'secundaria', patron: 'valor={prog.porcentaje}', como: 'Relevo, con su barra.' },
  { id: 'barras', que: 'Las barras de progreso (día, metas, objetivos, rutinas, hitos, bienestar)', archivo: 'src/views/ProductivityView.jsx', clase: 'barra', patron: 'barra-progreso', como: 'La clase compartida: todas al mismo ritmo (`medium`, F14). Antes seis iban a `slow` escrito en su `style`.' },
  { id: 'barras_fitness', que: 'Las barras de Fitness', archivo: 'src/index.css', clase: 'barra', patron: '.fit-barra {', como: '`fit-barra` (`medium`).' },
  { id: 'grafica_sueno', que: 'La gráfica de 7 días de Sueño', archivo: 'src/views/SleepView.jsx', clase: 'grafica', patron: 'domain={dominioSueno}', como: 'Línea gobernada (F4) con un eje que no baila al mover la semana.' },
  { id: 'grafica_peso', que: 'La evolución del peso (Salud)', archivo: 'src/views/HealthView.jsx', clase: 'grafica', patron: 'domain={dominioPeso}', como: 'Línea gobernada con un eje redondo alrededor de los pesos.' },
  { id: 'grafica_nutricion', que: 'La evolución de cada indicador (Nutrición)', archivo: 'src/views/NutritionView.jsx', clase: 'grafica', patron: 'domain={dominioEstable(', como: 'Línea gobernada con el objetivo dentro del eje.' },
  { id: 'ranking_contribucion', que: 'Los ejercicios que contribuyen a un músculo, con su filtro', archivo: 'src/components/contribucionMuscular.jsx', clase: 'ranking', patron: 'data-flip-id={`contribucion-${x.exerciseId}`}', como: '`ListaAnimada`: filtrar saca lo que sobra y recoloca lo que queda, con su identidad (apartados 41-43).' },
  { id: 'reloj_entreno', que: 'El reloj de un entrenamiento y el descanso', archivo: 'src/views/EntrenamientoVivoView.jsx', clase: 'reloj', patron: 'RelojSesion', como: 'Nada: cambia cada segundo, y un número que se anima cada segundo es un espectáculo permanente (apartado 45).' },
  { id: 'aro_pomodoro', que: 'El aro del Pomodoro', archivo: 'src/index.css', clase: 'reloj', patron: '.aro-pomodoro', como: 'Lineal: es un reloj.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   MS F17 · LA AUDITORÍA (apartados 4, 10, 28, 45, 58 y 63)

   Lee las vistas y los componentes y caza, con su línea:
     · `barra_a_otro_ritmo` — una barra con su `transition` escrita en el
       `style` (`transicion('width', …)`): va con la clase compartida;
     · `cifra_de_reloj` — una `CifraQueCambia` cuyo valor es un tiempo que
       corre (segundos, ahora, restante): un reloj no se anima;
     · `grafica_rehecha` — una gráfica de Recharts con `key`: al cambiar los
       datos se desmonta y se redibuja entera en vez de interpolar (apartado 28);
     · `cuentas_de_mas` — más de dos `modo="cuenta"` escritos en un mismo
       archivo: una pantalla tiene UNA cifra principal (apartado 58).
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentariosF17 = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
const lineaF17 = (src, i) => src.slice(0, i).split('\n').length;
export const MAXIMO_CUENTAS_POR_ARCHIVO = 2;

export function auditarDatos({ archivos = {} } = {}) {
  const problemas = [];
  Object.entries(archivos).forEach(([ruta, src]) => {
    if (!/\.jsx?$/.test(ruta)) return;
    const limpio = sinComentariosF17(src);
    let m;
    const barra = /transicion\(\s*['"]width['"]/g;
    while ((m = barra.exec(limpio))) problemas.push({ regla: 'barra_a_otro_ritmo', archivo: ruta, linea: lineaF17(limpio, m.index) });
    const cifra = /<CifraQueCambia\s+valor=\{([^}]*)\}/g;
    while ((m = cifra.exec(limpio))) {
      if (/\b(ahora|segundos|restante|transcurrid|reloj|cronometro|tiempo)\w*/i.test(m[1])) problemas.push({ regla: 'cifra_de_reloj', archivo: ruta, linea: lineaF17(limpio, m.index) });
    }
    const grafica = /<(LineChart|BarChart|AreaChart|PieChart|ComposedChart|ResponsiveContainer)\b[^>]*\bkey=/g;
    while ((m = grafica.exec(limpio))) problemas.push({ regla: 'grafica_rehecha', archivo: ruta, linea: lineaF17(limpio, m.index) });
    const cuentas = limpio.match(/modo="cuenta"/g) || [];
    if (cuentas.length > MAXIMO_CUENTAS_POR_ARCHIVO) problemas.push({ regla: 'cuentas_de_mas', archivo: ruta, linea: lineaF17(limpio, limpio.indexOf('modo="cuenta"')) });
  });
  return problemas;
}

export const EJEMPLOS_MALOS_F17 = Object.freeze([
  { regla: 'barra_a_otro_ritmo', ruta: 'src/views/X.jsx', src: '<div style={{ width: `${p}%`, transition: transicion(\'width\', \'slow\') }} />' },
  { regla: 'cifra_de_reloj', ruta: 'src/views/X.jsx', src: '<CifraQueCambia valor={segundosRestantes}>{texto}</CifraQueCambia>' },
  { regla: 'grafica_rehecha', ruta: 'src/views/X.jsx', src: '<LineChart key={periodo} data={d}>' },
  { regla: 'cuentas_de_mas', ruta: 'src/views/X.jsx', src: 'a modo="cuenta" b modo="cuenta" c modo="cuenta"' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   MS F17 · LO QUE SE DECIDIÓ, LO QUE ESTABA BIEN Y LO QUE NO SE HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const DECISIONES_F17 = Object.freeze([
  { apartados: [6], que: '🐛 Una cuenta interrumpida sigue desde lo que se ve', porque: 'Si el valor cambiaba a mitad de una cuenta, la nueva salía del objetivo de antes: la cifra SALTABA a ese número y después contaba. Ahora sale del valor pintado.' },
  { apartados: [5], que: 'La duración de una cuenta, según cuánto cambia', porque: 'Relativo a la cifra (12 de 88 no es 12 de 1850), entre `fast` y `slow`: 1 → 100 000 no es una cuenta interminable. Una cifra con barra no la usa: va al ritmo de la barra.' },
  { apartados: [7], que: 'Los relevos seguidos se agrupan', porque: 'Un relevo que llega mientras el anterior aún se ve escribe el valor sin repetir el fundido: cinco toques seguidos son un movimiento, no cinco.' },
  { apartados: [9], que: 'El lector de pantalla oye el valor final', porque: 'Mientras cuenta, lo que se ve va con `aria-hidden` y el valor final está al lado (`sr-only`): no se lee cada fotograma. Quieta, una sola cifra.' },
  { apartados: [10, 11], que: 'Las barras, con su clase y al mismo ritmo; la cifra, al ritmo de su barra', porque: 'Seis barras escribían `transicion(\'width\', \'slow\')` en su `style` y las cuatro de CSS iban a `medium` (F14): la misma cosa a dos ritmos. Ahora todas `barra-progreso`. `width` se queda (y no `transform: scaleX`): una barra redondeada se deforma al escalar, son pocas y la F13 midió su coste.' },
  { apartados: [3, 4, 14], que: 'Las cifras que cambiaban de golpe', porque: 'La racha, el porcentaje de cada indicador, «2 / 3 completado» y el texto de cada meta y objetivo cambiaban sin transición junto a una barra que sí se movía (hallazgo `cifras_de_golpe` de la F0). Ahora se relevan; las principales siguen contando.' },
  { apartados: [31, 32], que: 'Un eje que no baila', porque: 'Recharts interpola la línea pero el eje salta: con un dominio redondo (`dominioEstable`) mover la semana de Sueño no cambia la escala, y el peso tiene un eje redondo alrededor de sus valores.' },
  { apartados: [41, 42, 43], que: 'El ranking que se filtra', porque: 'Los ejercicios que contribuyen a un músculo se filtran por tendencia: ahora con `ListaAnimada` —lo que sobra sale, lo que queda se recoloca, cada uno con su `exerciseId`—, y la lista se queda montada aunque el filtro la vacíe.' },
]);

export const REVISADO_Y_BIEN_F17 = Object.freeze([
  { que: 'Las gráficas de Recharts', donde: 'F4: 420 ms con la curva de JosStyle, interpolan al cambiar de periodo (sin `key`), y en Reducido no dibujan.' },
  { que: 'Las gráficas de Fitness', donde: 'SVG propio: se funden al cambiar de periodo o de métrica (`CambioDeContenido`, F4).' },
  { que: 'La entrada de una portada', donde: 'F10: una sola cadencia con tope de seis escalones (`escalonado`), lo primero arriba.' },
  { que: 'Lo que se celebra', donde: 'Completar (micro), la racha y subir de rango (momentos, F14): cada uno con su nivel; ni un 100 % celebrado de más (apartado 12).' },
  { que: 'La búsqueda', donde: 'F10: los resultados que siguen se quedan y se recolocan; el vacío y la carga, F16.' },
  { que: 'Subir y bajar', donde: 'Un relevo entra desde abajo si sube y desde arriba si baja, y la flecha y el signo (↑ +8) lo dicen sin depender del color (apartado 49).' },
]);

export const NO_EN_F17 = Object.freeze([
  { apartados: [25, 26], que: 'Gráficas de barras y donuts', porque: 'JosStyle no tiene ninguna de Recharts: sus barras son de progreso, y el único aro es el de la puntuación (`cinematic`, sin giro).' },
  { apartados: [34, 35], que: 'Una transición que diga qué puntos sobran al pasar de 7 a 30 días', porque: 'Recharts interpola de la línea de antes a la nueva; inventarle una animación por punto sería decorar. Los huecos siguen siendo huecos (`connectNulls={false}`): no se inventa un dato (apartado 30).' },
  { apartados: [38, 39, 40], que: 'Un cursor que sigue al dedo por la gráfica', porque: 'El tooltip de Recharts ya responde al toque y al puntero, rápido (`fast`) y sin parpadeo (F4).' },
  { apartados: [45, 46], que: 'Datos en vivo', porque: 'Nada cambia solo salvo los relojes, y los relojes no se animan.' },
]);

export const CUANDO_F17 = Object.freeze([
  { patron: '`<CifraQueCambia valor={n} modo="cuenta">`', cuando: 'La cifra principal de una pantalla (una, como mucho dos por archivo).' },
  { patron: '`<CifraQueCambia valor={n} modo="cuenta" duracion="medium">`', cuando: 'Una cifra que va con su barra.' },
  { patron: '`<CifraQueCambia valor={n}>{texto}</CifraQueCambia>`', cuando: 'Cualquier otra cifra que cambia mientras se mira (relevo).' },
  { patron: 'Nada', cuando: 'Un reloj, un identificador, una fecha, una cifra que no cambia mientras se mira.' },
  { patron: '`className="barra-progreso"`', cuando: 'Una barra de progreso (o `fit-barra` en Fitness, `nu-progreso` en Nutrición).' },
  { patron: '`domain={dominioEstable(valores, …)}`', cuando: 'El eje Y de una gráfica cuyos datos cambian mientras se mira.' },
  { patron: '`<ListaAnimada>` con `data-flip-id`', cuando: 'Una lista que se ordena o se filtra.' },
]);
