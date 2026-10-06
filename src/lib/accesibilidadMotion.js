/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 12 — ACCESIBILIDAD, MOVIMIENTO REDUCIDO, MOVIMIENTO
   ADAPTATIVO Y CALIDAD DE EXPERIENCIA

   *"El movimiento debe mejorar la comprensión de la interfaz, nunca convertirse
   en una barrera."* Y el principio que lo ordena todo (apartado 2): separar el
   MOVIMIENTO del SIGNIFICADO — si se quita una animación, lo que quería decir
   tiene que seguir diciéndose.

   Mucho de lo que pide ya estaba: «Reducir no es apagar» (F1), el hover solo
   con puntero (F2), el foco con el acento (F3, F9), los diálogos con teclado
   (FIT F39), el dedo que manda (F11). Esta fase lo junta en UNA política que se
   comprueba, y arregla lo que no la cumplía: los bucles que seguían girando en
   Reducido, el desplazamiento suave que ignoraba «Reducir movimiento», el foco
   que se perdía al borrar una fila o al plegar un desplegable, y la navegación
   que no decía a VoiceOver a dónde se había llegado.
   ═══════════════════════════════════════════════════════════════════════════ */

import { contextoDelDocumento, contextoMotion, MODOS_MOTION } from './motion';
import { PATRONES_VIBRACION } from './sonidoProduccion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA INTENSIDAD (apartados 3, 4, 5, 6 y 7)

   Una sola fuente de verdad: el contexto del motor (`contextoMotion`, F1), que
   ya junta el modo de Ajustes, «Reducir movimiento» de Ajustes y el del
   iPhone. Aquí solo se le pone nombre a lo que significa.
   ─────────────────────────────────────────────────────────────────────────── */
export const INTENSIDADES_MOTION = Object.freeze([
  { id: 'full', modos: ['normal', 'premium', 'ultra'], que: 'La experiencia completa: muelles, elementos compartidos, profundidad, cascadas, gestos y listas que se recolocan, dentro del presupuesto.' },
  { id: 'reduced', modos: ['reducido'], que: 'Fundidos cortos en su sitio: sin desplazamientos, sin escalas, sin bucles, sin muelle al soltar. Se conserva el feedback, el foco, la selección y el cambio de estado.' },
  { id: 'none', modos: ['off'], que: 'Todo aparece en su estado final. La aplicación funciona igual: nada depende de que una animación termine.' },
]);
export function intensidadDe(ctx = contextoMotion()) {
  if (ctx.apagado) return 'none';
  if (ctx.reducido || !ctx.espacial) return 'reduced';
  return 'full';
}

/* ───────────────────────────────────────────────────────────────────────────
   2 · LA POLÍTICA, ÁREA POR ÁREA (apartados 5-13, 33 y 46)

   Qué pasa en cada intensidad, y DÓNDE se cumple: la prueba abre cada archivo
   y busca el trozo. Ninguna pantalla decide su reducido.
   ─────────────────────────────────────────────────────────────────────────── */
export const POLITICA_MOTION = Object.freeze([
  { area: 'Navegación', full: 'La pantalla entra desde la derecha o la izquierda (F2).', reduced: 'Un fundido en su sitio: la distancia vale 0. Y se dice dónde se ha llegado (`AnuncioDeNavegacion`).', none: 'Aparece.', donde: 'src/index.css', trozo: "html[data-motion='reducido'] {" },
  { area: 'Elementos compartidos', full: 'La pantalla crece desde su tarjeta; el nombre viaja (F7).', reduced: 'La entrada de siempre, que ya es un fundido: ni recorte ni viaje (apartado 10).', none: 'Aparece.', donde: 'src/lib/continuidad.js', trozo: 'if (!ctx.espacial || ctx.apagado || ctx.reducido) return null;' },
  { area: 'Capas (hojas y ventanas)', full: 'La hoja sube desde su borde, la ventana aparece desde el centro (F6).', reduced: 'Se funden en su sitio: el recorrido de la hoja vale 0 %.', none: 'Aparecen.', donde: 'src/index.css', trozo: '--hoja-recorrido: 0%;' },
  { area: 'Listas', full: 'Lo que entra sube un poco, lo que sale se desvanece, lo demás se recoloca (F10).', reduced: 'Lo que entra y lo que sale se funden; lo demás se coloca sin viajar.', none: 'Cambia de golpe, en orden.', donde: 'src/components/layoutMotion.jsx', trozo: 'if (ctx.espacial) {' },
  { area: 'Desplegables', full: 'La altura crece y decrece (F10).', reduced: 'Cambia de altura sin animarse.', none: 'Igual.', donde: 'src/index.css', trozo: "html[data-motion='reducido'] .plegable {" },
  { area: 'Microinteracciones', full: 'Pulsar encoge un poco (F3).', reduced: 'Pulsar baja la opacidad: el feedback sigue, sin escala (apartado 12).', none: 'El estado cambia.', donde: 'src/index.css', trozo: "[class*='active:scale']:active:not(:disabled)" },
  { area: 'Gestos', full: 'La hoja sigue al dedo y vuelve con un muelle (F5, F8).', reduced: 'El dedo SIGUE moviendo la hoja (es una función, no un adorno, apartado 8); al soltar no hay muelle.', none: 'Igual que reducido.', donde: 'src/lib/gestosMotion.js', trozo: "if (ctx.apagado || ctx.reducido || !desde) return { valores: [desde, 0], duracionMs: 0 };" },
  { area: 'Carga y bucles', full: 'El esqueleto late y el giro gira.', reduced: 'Quietos: el esqueleto ya dice que algo carga, y el giro va siempre con su texto (apartados 13 y 14).', none: 'Quietos.', donde: 'src/index.css', trozo: "html[data-motion='reducido'] .esqueleto" },
  { area: 'Celebraciones', full: 'La llama late y brilla, el «+1» sube, el rango crece (apartado 19).', reduced: 'Sin escala ni desplazamiento (los pulsos valen 1): queda el fundido y el brillo — una confirmación, no un salto.', none: 'El estado final: la cifra nueva.', donde: 'src/index.css', trozo: '--motion-pulso-firma: 1;' },
  { area: 'Desplazamiento automático', full: 'Llevar a un elemento se desliza.', reduced: 'Se salta directamente (apartado 33).', none: 'Se salta directamente.', donde: 'src/lib/accesibilidadMotion.js', trozo: "return intensidadDe(ctx) === 'full' ? 'smooth' : 'auto';" },
  { area: 'Hápticos', full: 'Vibran si el 📳 de Ajustes está encendido.', reduced: 'IGUAL: reducir el movimiento no apaga la vibración (apartado 22). Son dos preferencias.', none: 'Igual.', donde: 'src/lib/audioEngine.js', trozo: 'if (decision.vibra) vibrar(tipo);' },
  { area: 'Ajustes', full: 'Cinco modos y tres velocidades (F1).', reduced: '«Reducir movimiento» de Ajustes y el del iPhone llevan a Reducido; es la MISMA preferencia, no una segunda (apartado 46).', none: '«Sin movimiento».', donde: 'src/lib/motion.js', trozo: 'export function sistemaPideReducir()' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   3 · LOS BUCLES (apartados 13, 14, 15 y 42)

   Todo lo que se repite sin fin, con su estrategia. La prueba barre el CSS y
   las vistas: un bucle nuevo que no esté aquí pone la suite roja.
   ─────────────────────────────────────────────────────────────────────────── */
export const BUCLES_INFINITOS = Object.freeze([
  { id: 'esqueleto', clase: 'esqueleto', keyframe: 'latido', aporta: 'Dice que algo está cargando, con la forma de lo que viene.', reduced: 'Quieto: la forma ya lo dice.', none: 'Quieto.' },
  { id: 'giro', clase: 'animate-spin', keyframe: 'spin', aporta: 'Dice que algo está pasando AHORA.', reduced: 'Quieto: va siempre con su texto («Guardando…», «Pensando…») o en un botón ocupado (`aria-busy`).', none: 'Quieto.' },
]);
/** Las utilidades de Tailwind que repiten sin fin. */
export const UTILIDADES_EN_BUCLE = Object.freeze(['animate-spin', 'animate-pulse', 'animate-bounce', 'animate-ping']);

/* ───────────────────────────────────────────────────────────────────────────
   4 · LAS CELEBRACIONES (apartados 16, 18 y 19): completa, reducida, estática
   ─────────────────────────────────────────────────────────────────────────── */
export const CELEBRACIONES = Object.freeze([
  { id: 'racha_sube', clase: 'fuego-sube', keyframe: 'fuegoSube', completa: 'La llama late y brilla.', reducida: 'Solo el brillo: el latido es un pulso, y vale 1.', estatica: 'La cifra nueva de la racha.' },
  { id: 'racha_mas_uno', clase: 'racha-mas-uno', keyframe: 'masUnoSube', completa: 'El «+1» sube y se desvanece.', reducida: 'Aparece y se desvanece en su sitio.', estatica: 'La cifra nueva de la racha.' },
  { id: 'tarea_hecha', clase: 'tarea-hecha', keyframe: 'tareaHecha', completa: 'La casilla late al marcarla.', reducida: 'La casilla se marca: el estado cambia sin latido.', estatica: 'La casilla marcada.' },
  { id: 'favorito', clase: 'favorito-guardado', keyframe: 'favoritoPulso', completa: 'La estrella late al marcarla (F3).', reducida: 'La estrella se rellena: sin latido.', estatica: 'La estrella rellena.' },
  { id: 'rango_sube', clase: 'fit-rango-sube', keyframe: 'fitRangoSube', completa: 'El hexágono nuevo crece hasta su sitio.', reducida: 'Aparece con un fundido.', estatica: 'El hexágono nuevo y el texto que dice qué ha pasado.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   5 · LOS HÁPTICOS, CON NOMBRE (apartados 20, 21 y 22)

   Ya existían: el bus de audio decide si vibra con el 📳 de Ajustes, y lo que
   vibra lo dice la CATEGORÍA del evento (`PATRONES_VIBRACION`). Aquí se les pone
   el nombre del enunciado. Ningún componente vibra por su cuenta (una prueba
   lo busca), y un evento importante se entiende igual sin vibración y sin sonido.
   ─────────────────────────────────────────────────────────────────────────── */
export const HAPTICOS = Object.freeze([
  { id: 'light', patron: 'suave', para: 'Tocar algo de la interfaz (categoría `ui`).' },
  { id: 'selection', patron: 'suave', para: 'Elegir una opción: es un toque de la interfaz.' },
  { id: 'medium', patron: 'normal', para: 'Un resultado o un avance (categorías `feedback` y `progress`).' },
  { id: 'warning', patron: 'normal', para: 'No hay ningún evento de aviso que vibre: un aviso se lee (apartado 16, no llamar la atención con movimiento).' },
  { id: 'error', patron: 'normal', para: 'Igual: un error se dice con palabras, bajo su campo (F9); no hay vibración propia.' },
  { id: 'success', patron: 'doble', para: 'Una recompensa o una racha que sube (`reward`, `streak`).' },
  { id: 'strong', patron: 'fuerte', para: 'Un logro (`achievement`).' },
]);
export const patronHaptico = (id) => {
  const h = HAPTICOS.find((x) => x.id === id);
  return h ? PATRONES_VIBRACION.find((p) => p.id === h.patron) || null : null;
};

/* ───────────────────────────────────────────────────────────────────────────
   6 · EL DESPLAZAMIENTO AUTOMÁTICO (apartados 32, 33 y 34)

   Llevar la vista a un elemento (el foco que llega de otra pantalla, la serie
   que toca ahora) se desliza con movimiento completo y SALTA en Reducido. Era
   `behavior: 'smooth'` escrito a mano en siete sitios, ignorando la preferencia.
   ─────────────────────────────────────────────────────────────────────────── */
export function comportamientoDeScroll(ctx = contextoMotion()) {
  return intensidadDe(ctx) === 'full' ? 'smooth' : 'auto';
}
/** Lleva un elemento a la vista con el comportamiento que toca. Nunca lanza. */
export function desplazarHasta(el, opciones = {}, ctx = contextoDelDocumento()) {
  if (!el || typeof el.scrollIntoView !== 'function') return false;
  try { el.scrollIntoView({ block: 'center', ...opciones, behavior: comportamientoDeScroll(ctx) }); return true; } catch { return false; }
}

/* ───────────────────────────────────────────────────────────────────────────
   7 · EL FOCO DURANTE UNA ANIMACIÓN (apartados 23, 24 y 25)

   Borrar una fila con el teclado se llevaba el foco con ella —al `body`, y el
   siguiente Tab volvía al principio de la página—. Ahora pasa a la fila que
   ocupa su sitio (o a la anterior si era la última). Y un desplegable que se
   cierra con el foco dentro lo devuelve a su botón ANTES de volverse inerte.
   ─────────────────────────────────────────────────────────────────────────── */
export function filaParaElFoco(ordenAntes = [], idsAhora = [], idPerdido = null) {
  const ahora = new Set(idsAhora);
  const i = ordenAntes.indexOf(idPerdido);
  if (i < 0 || ahora.has(idPerdido)) return null;
  for (let j = i + 1; j < ordenAntes.length; j += 1) if (ahora.has(ordenAntes[j])) return ordenAntes[j];
  for (let j = i - 1; j >= 0; j -= 1) if (ahora.has(ordenAntes[j])) return ordenAntes[j];
  return null;
}
export const ENFOCABLES = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="switch"]';

/* ───────────────────────────────────────────────────────────────────────────
   8 · LA JERARQUÍA (apartado 44), EL MÓVIL QUE NO SE CASTIGA (39) Y LA
   ADAPTACIÓN (37 y 38)
   ─────────────────────────────────────────────────────────────────────────── */
/** Los niveles del enunciado sobre los de la F0 (`NIVELES_MOTION`, 0-5), que ya los tenían. */
export const JERARQUIA_F12 = Object.freeze([
  { nivel: 0, enunciado: 'NONE', f0: 'static' },
  { nivel: 1, enunciado: 'FEEDBACK', f0: 'micro' },
  { nivel: 2, enunciado: 'CONTEXT', f0: 'soft' },
  { nivel: 3, enunciado: 'TRANSITION', f0: 'premium' },
  { nivel: 4, enunciado: 'EMPHASIS', f0: 'hero' },
  { nivel: 5, enunciado: 'DECORATIVE', f0: 'signature' },
]);
/** Con moderación (apartado 44): cuántas animaciones del mapa pueden ser de nivel 4 o 5. */
export const TOPE_NIVELES_ALTOS = 12;

export const ADAPTACION = Object.freeze([
  { senal: 'Reducir movimiento (iPhone o Ajustes)', fiable: true, efecto: 'Reducido.' },
  { senal: 'Demasiadas animaciones a la vez', fiable: true, efecto: 'El presupuesto del orquestador (F11): lo micro y lo decorativo no empiezan.' },
  { senal: 'Una lista que cambia entera', fiable: true, efecto: 'El presupuesto de la F10: un fundido en vez de cuarenta viajes.' },
  { senal: 'Que sea un móvil', fiable: false, efecto: 'NINGUNO (apartado 39): un iPhone moderno las mueve todas.' },
  { senal: 'Batería, memoria, núcleos', fiable: false, efecto: 'Ninguno: Safari de iOS no da la batería ni la memoria, y adivinarlo castigaría a quien no lo necesita (apartado 37: *"no intentar adivinar demasiado"*).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   9 · LA MATRIZ DE QA (apartado 47), sobre el proyecto real
   ─────────────────────────────────────────────────────────────────────────── */
export const MATRIZ_QA = Object.freeze([
  { entorno: 'iPhone (390 × 844)', motion: 'Completo', entrada: 'Toque', donde: '── MS F10 · Layout motion' },
  { entorno: 'iPhone (390 × 844)', motion: 'Reducido', entrada: 'Toque', donde: '── MS F12 · Accesibilidad' },
  { entorno: 'Escritorio (1280 × 900)', motion: 'Completo', entrada: 'Ratón', donde: '── MS F2 · Navegación' },
  { entorno: 'Teclado', motion: 'Completo', entrada: 'Teclado', donde: 'MS F12 — con el teclado' },
  { entorno: 'Teclado', motion: 'Reducido', entrada: 'Teclado', donde: 'MS F12 — en Reducido, con el teclado' },
  { entorno: 'Lector de pantalla', motion: 'Reducido', entrada: 'Teclado', donde: 'MS F12 — VoiceOver' },
  { entorno: 'Sin movimiento', motion: 'Ninguno', entrada: 'Toque', donde: '── MS F1 · El motor' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   10 · LA AUDITORÍA (apartados 1, 3, 14, 21 y 33): lo que no puede volver
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentarios = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
const lineaDe = (src, i) => src.slice(0, i).split('\n').length;
/* Las cadenas, en blanco (conservando los saltos de línea): para saber si el código HACE algo, una frase que
   lo NOMBRA —«lo llama `vibrar()`»— no cuenta. */
const sinCadenas = (src) => src.replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, (m) => m.replace(/[^\n]/g, ' '));

/** Quien puede preguntar al navegador por «Reducir movimiento»: el motor y su escuchador. */
export const LEEN_REDUCIR = Object.freeze(['src/lib/motion.js', 'src/components/motion.jsx']);
/** Quien puede vibrar: el motor de audio. */
export const VIBRAN = Object.freeze(['src/lib/audioEngine.js']);

export function auditarAccesibilidadMotion({ archivos = {}, css = '' } = {}) {
  const hallazgos = [];
  Object.entries(archivos).forEach(([archivo, src]) => {
    if (!/^src\/.*\.(jsx?|mjs)$/.test(archivo)) return;
    const limpio = sinComentarios(src);
    const buscar = (re, tipo, que) => {
      const r = new RegExp(re.source, 'g');
      let m;
      while ((m = r.exec(limpio))) hallazgos.push({ tipo, archivo, linea: lineaDe(limpio, m.index), que });
    };
    if (archivo !== 'src/lib/accesibilidadMotion.js') buscar(/behavior:\s*['"]smooth['"]/, 'scroll_suave_a_mano', 'Un desplazamiento suave escrito a mano ignora «Reducir movimiento»: es `desplazarHasta` (apartado 33).');
    if (!LEEN_REDUCIR.includes(archivo)) buscar(/matchMedia\(\s*['"]\(prefers-reduced-motion/, 'reducir_por_su_cuenta', 'Una pantalla que pregunta por su cuenta si reducir: la fuente de verdad es el contexto del motor (apartado 3).');
    if (!VIBRAN.includes(archivo)) {
      const codigo = sinCadenas(limpio);
      const r = /navigator\.vibrate\(|\bvibrar\(/g;
      let m;
      while ((m = r.exec(codigo))) hallazgos.push({ tipo: 'vibra_por_su_cuenta', archivo, linea: lineaDe(codigo, m.index), que: 'Una vibración desde un componente: se emite al bus y el motor de audio decide (apartado 21).' });
    }
    if (/\.jsx$/.test(archivo) && archivo !== 'src/components/accesibilidadMotion.jsx') {
      /* Un giro tiene que decir algo QUIETO: su texto al lado («Guardando…»), un botón ocupado
         (`aria-busy`) o ser `GiroDeCarga`, que lleva el suyo para VoiceOver (apartados 2 y 26). */
      const r = /\banimate-spin\b/g;
      let m;
      while ((m = r.exec(limpio))) {
        const alrededor = limpio.slice(Math.max(0, m.index - 300), m.index + 200);
        if (!/…|aria-busy|boton-giro/.test(alrededor)) hallazgos.push({ tipo: 'giro_sin_texto', archivo, linea: lineaDe(limpio, m.index), que: 'Un giro de carga solo dice algo mientras gira: quieto (Reducido) o para VoiceOver no dice nada. Es `GiroDeCarga`, o un texto al lado.' });
      }
    }
    if (/\.jsx$/.test(archivo)) {
      UTILIDADES_EN_BUCLE.forEach((u) => {
        if (!BUCLES_INFINITOS.some((b) => b.clase === u)) buscar(new RegExp(`\\b${u}\\b`), 'bucle_sin_estrategia', `\`${u}\` repite sin fin y no tiene estrategia de Reducido (apartado 14).`);
      });
    }
  });
  const limpioCss = sinComentarios(css);
  [...limpioCss.matchAll(/animation:\s*([\w-]+)[^;]*\binfinite\b/g)].forEach((m) => {
    if (!BUCLES_INFINITOS.some((b) => b.keyframe === m[1])) hallazgos.push({ tipo: 'bucle_sin_estrategia', archivo: 'src/index.css', linea: lineaDe(limpioCss, m.index), que: `La animación \`${m[1]}\` repite sin fin y no está en \`BUCLES_INFINITOS\` (apartado 14).` });
  });
  const tipos = ['scroll_suave_a_mano', 'reducir_por_su_cuenta', 'vibra_por_su_cuenta', 'bucle_sin_estrategia', 'giro_sin_texto'];
  return { hallazgos, cuentas: Object.fromEntries(tipos.map((t) => [t, hallazgos.filter((h) => h.tipo === t).length])) };
}

/* ───────────────────────────────────────────────────────────────────────────
   11 · LA REGLA PERMANENTE (apartado 50), LA AUDITORÍA DEL ENUNCIADO Y LO QUE
   NO SE HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const PREGUNTAS_DE_UN_MOVIMIENTO = Object.freeze([
  '¿Qué comunica?', '¿Es necesario?', '¿Qué ocurre con Reducido?', '¿Qué ocurre con teclado?',
  '¿Qué ocurre con VoiceOver?', '¿Qué ocurre en táctil?', '¿Qué ocurre en un dispositivo con menos rendimiento?',
  '¿Puede interrumpirse?', '¿Puede quitarse sin romper la función?',
]);

export const AUDITORIA_F12 = Object.freeze([
  { apartados: [2, 3, 4], que: 'Movimiento frente a significado, una fuente de verdad, la intensidad', queda: '`intensidadDe(ctx)` sobre el contexto del motor: full, reduced, none. Solo el motor pregunta al navegador (`LEEN_REDUCIR`); una pantalla que lo haga pone la suite roja.' },
  { apartados: [5, 6, 7, 8, 9, 10, 11, 12], que: 'Qué pasa en cada área con cada intensidad', queda: '`POLITICA_MOTION`, con el sitio donde se cumple cada línea: la prueba lo abre y lo busca.' },
  { apartados: [13, 14, 15, 42], que: 'Bucles y lo que se mueve solo', queda: '🐛 El esqueleto y el giro seguían en bucle con «Reducir movimiento». Ahora se quedan quietos (y el giro va siempre con su texto). Un bucle nuevo sin estrategia pone la suite roja.' },
  { apartados: [16, 17, 18, 19], que: 'Errores, éxitos y celebraciones', queda: 'Un error no tiembla (F9); las celebraciones tienen su versión completa, reducida y estática (`CELEBRACIONES`), y se comprueba que se mueven con los pulsos del motor.' },
  { apartados: [20, 21, 22], que: 'Sonido y hápticos', queda: '`HAPTICOS`: los nombres del enunciado sobre los patrones que ya existían. Vibrar es del motor de audio y del 📳 de Ajustes, independiente de reducir el movimiento.' },
  { apartados: [23, 24, 25], que: 'Teclado y foco durante una animación', queda: '🐛 Borrar una fila con el teclado dejaba el foco en el `body`: ahora pasa a la fila que ocupa su sitio. 🐛 Plegar un desplegable con el foco dentro lo perdía: vuelve a su botón antes de volverse inerte. El anillo de foco no lo recorta un desplegable quieto (F10).' },
  { apartados: [9, 26], que: 'VoiceOver y la navegación', queda: '🐛 Cambiar de pantalla no le decía nada: ahora el contenedor tiene el nombre de la pantalla y un aviso educado (`aria-live`) dice a dónde se ha llegado.' },
  { apartados: [28, 29, 30, 31], que: 'Puntero, hover, zonas de toque y no esperar', queda: 'El hover solo con puntero (F2), las zonas de 44 px (EH F42) y ninguna animación hace esperar para tocar otra cosa: la tarjeta de una portada navega al tocarla (F7).' },
  { apartados: [32, 33, 34], que: 'El desplazamiento automático', queda: '🐛 Siete `scrollIntoView({ behavior: \'smooth\' })` ignoraban «Reducir movimiento». Ahora son `desplazarHasta`.' },
  { apartados: [37, 38, 39], que: 'Adaptarse sin castigar', queda: '`ADAPTACION`: solo señales fiables (Reducir, el presupuesto); ni el móvil ni la batería.' },
  { apartados: [44, 45], que: 'Jerarquía y coherencia', queda: 'Los seis niveles del enunciado son los de la F0, y los altos se usan con moderación (`TOPE_NIVELES_ALTOS`). Dos ventanas se mueven igual: lo decide `useCapasMotion` (F6), no cada una.' },
  { apartados: [47, 48], que: 'La matriz de QA', queda: '`MATRIZ_QA`, cada fila con la sección del recorrido que la prueba.' },
]);

export const NO_EN_F12 = Object.freeze([
  { que: 'Una intensidad «minimal» aparte', porque: 'No hay ninguna señal fiable que la pida (apartado 37) y ningún ajuste la elige: sería un modo que nadie puede encender. Lo que haría —sin bucles ni celebraciones— ya lo hace Reducido.' },
  { que: 'Adaptar por el tipo de dispositivo, la batería o la memoria', porque: 'Apartado 39, y Safari de iOS no da esas señales. La adaptación es Reducir y los presupuestos.' },
  { que: 'Una preferencia de movimiento nueva en Ajustes', porque: 'Apartado 46: ya existen el modo, la velocidad y «Reducir movimiento». Una cuarta sería un duplicado.' },
  { que: 'Un temblor para los errores', porque: 'La F9 lo quitó a propósito (apartado 23 de aquella): un error se dice debajo del campo, con palabras.' },
]);
