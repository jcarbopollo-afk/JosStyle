/* ===========================================================================
   rendimientoMotion.js — MOTION SYSTEM · FASE 13: lo que cuesta cada movimiento

   *"Esta fase NO consiste en eliminar animaciones para ganar rendimiento. El
   objetivo es mantener la máxima calidad visual utilizando el mínimo coste
   técnico necesario."* Y *"No optimices a ciegas"* (apartado 1): lo que hay
   aquí salió de MEDIR primero (docs/MOTION_SYSTEM.md §8.12) y se queda para
   que la siguiente animación pueda contestar *"¿qué coste tiene?"* (apartado 47).

   Seis piezas:
     1 · el presupuesto de un fotograma y el resumen de unos fotogramas medidos;
     2 · el coste de cada propiedad que se anima (componer, pintar, recolocar);
     3 · el inventario de lo que anima index.css, y lo caro que se queda DECLARADO;
     4 · la auditoría que caza lo caro sin declarar, el desenfoque animado, el
         `will-change`, un escuchador de scroll que no es pasivo y un intervalo
         en una pieza de movimiento;
     5 · la calidad adaptativa: una política interna, nunca un ajuste visible;
     6 · el monitor de fotogramas, solo en desarrollo y con la marca de la F11.

   ⚠️ Importa del orquestador (MS F11) para el monitor: `depurando()` y
   `estadoGlobalMotion()`. Los dos son hojas del árbol de imports.

   ⚠️ Ojo con el nombre: `auditarRendimiento` es de la EH F44 (`rendimiento.js`)
   y `rendimientoFitness.js` de la FIT F40. Lo de aquí es `auditarCosteMotion`.
   =========================================================================== */
import { depurando, estadoGlobalMotion } from './orquestadorMotion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · EL PRESUPUESTO DE UN FOTOGRAMA (apartados 3 y 4)

   *"No asumir que conseguir 60 FPS significa que todo está perfectamente
   optimizado en una pantalla de 120 Hz."* El iPhone con ProMotion pinta cada
   8,33 ms; uno sin él, cada 16,67. Un fotograma que tarda el doble de lo que
   toca es un fotograma perdido, y uno de más de 50 ms es una tarea larga.
   ─────────────────────────────────────────────────────────────────────────── */
export const PRESUPUESTO_FOTOGRAMA = Object.freeze({ 60: 1000 / 60, 120: 1000 / 120 });
export const UMBRAL_TAREA_LARGA_MS = 50;

export const presupuestoDe = (hz = 60) => PRESUPUESTO_FOTOGRAMA[hz] || 1000 / (Number(hz) || 60);

const numeros = (lista) => (Array.isArray(lista) ? lista : []).map(Number).filter((n) => Number.isFinite(n) && n > 0);

/** A qué frecuencia se estaba pintando: la mediana de los intervalos lo dice. */
export function hzProbable(intervalos) {
  const v = numeros(intervalos).sort((a, b) => a - b);
  if (!v.length) return 60;
  const mediana = v[Math.floor(v.length / 2)];
  return mediana < 11 ? 120 : 60;
}

/**
 * El resumen de unos fotogramas medidos (los intervalos entre dos
 * `requestAnimationFrame` seguidos, en ms): cuántos, la media, el percentil 95,
 * el peor, cuántos se perdieron (un intervalo de 3 presupuestos son 2 perdidos)
 * y cuántos fueron tareas largas. Sin fotogramas, `null` en las cifras: un 0
 * diría que se pintó a 0 FPS (EH F23).
 */
export function resumenDeFotogramas(intervalos, { hz = 60 } = {}) {
  const v = numeros(intervalos);
  const presupuestoMs = presupuestoDe(hz);
  if (!v.length) return { fotogramas: 0, hz, presupuestoMs, mediaMs: null, p95Ms: null, peorMs: null, fps: null, perdidos: 0, largos: 0, enPresupuesto: null };
  const orden = [...v].sort((a, b) => a - b);
  const suma = v.reduce((s, x) => s + x, 0);
  const media = suma / v.length;
  const p95 = orden[Math.min(orden.length - 1, Math.ceil(orden.length * 0.95) - 1)];
  const perdidos = v.reduce((s, x) => s + Math.max(0, Math.round(x / presupuestoMs) - 1), 0);
  const dentro = v.filter((x) => x <= presupuestoMs * 1.5).length;
  const r1 = (x) => Math.round(x * 10) / 10;
  return {
    fotogramas: v.length,
    hz,
    presupuestoMs: r1(presupuestoMs),
    mediaMs: r1(media),
    p95Ms: r1(p95),
    peorMs: r1(orden[orden.length - 1]),
    fps: Math.round(1000 / media),
    perdidos,
    largos: v.filter((x) => x > UMBRAL_TAREA_LARGA_MS).length,
    enPresupuesto: Math.round((dentro / v.length) * 100) / 100,
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   2 · LO QUE CUESTA CADA PROPIEDAD (apartados 9-17)

   Tres clases, por lo que el navegador tiene que rehacer en cada fotograma:
   · `composicion` — solo mover o fundir una capa ya pintada (`transform`,
     `opacity`). Es lo que la GPU hace sin despertar al hilo principal.
   · `pintado` — repintar la caja (`box-shadow`, `filter`, `background-color`,
     `clip-path`…). Caro según el área; un desenfoque, lo que más.
   · `diseno` — recolocar la página (`width`, `height`, `top`, `margin`,
     `grid-template-rows`…): lo de alrededor se mueve con ella.
   ─────────────────────────────────────────────────────────────────────────── */
export const COSTE_PROPIEDAD = Object.freeze({
  composicion: ['transform', 'opacity', 'translate', 'scale', 'rotate'],
  pintado: ['color', 'background', 'background-color', 'background-position', 'border-color', 'outline-color', 'box-shadow', 'text-shadow', 'filter', 'backdrop-filter', 'clip-path', 'border-radius', 'mask', 'mask-image', 'mask-position', 'fill', 'stroke', 'stroke-dashoffset', 'text-decoration-color', 'visibility'],
  diseno: ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'top', 'left', 'right', 'bottom', 'inset', 'margin', 'padding', 'grid-template-rows', 'grid-template-columns', 'font-size', 'line-height', 'letter-spacing', 'gap', 'flex-basis', 'border-width'],
});

/** La clase de coste de una propiedad animada (`margin-top` es de la familia `margin`). */
export function costeDe(propiedad) {
  const p = String(propiedad || '').trim().toLowerCase();
  if (!p) return 'desconocido';
  if (p === 'all') return 'todo';
  for (const clase of ['composicion', 'pintado', 'diseno']) {
    if (COSTE_PROPIEDAD[clase].includes(p)) return clase;
  }
  if (/^(margin|padding|inset)-/.test(p)) return 'diseno';
  if (/^border-.*-(width)$/.test(p)) return 'diseno';
  if (/^border-.*-(color|radius)$/.test(p) || /^-webkit-(backdrop-filter|mask)/.test(p)) return 'pintado';
  if (p.startsWith('--')) return 'desconocido';
  return 'desconocido';
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LO QUE ANIMA index.css

   Cada regla con `transition` o `animation`, y de cada una las propiedades que
   mueve de verdad: las que nombra la transición (o `all` si no nombra
   ninguna) y las que cambian los fotogramas de su `@keyframes`.
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentariosCss = (css) => String(css || '').replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' '));
const lineaDe = (texto, i) => texto.slice(0, i).split('\n').length;

/** Parte por comas que no estén dentro de un paréntesis. */
function partirPorComas(valor) {
  const out = [];
  let nivel = 0;
  let actual = '';
  for (const c of String(valor)) {
    if (c === '(') nivel += 1;
    if (c === ')') nivel -= 1;
    if (c === ',' && nivel === 0) { out.push(actual.trim()); actual = ''; } else actual += c;
  }
  if (actual.trim()) out.push(actual.trim());
  return out;
}

const PALABRAS_DE_TIEMPO = /^(var\(|calc\(|\d|\.|ease|linear|step|cubic-bezier|none$|initial$|inherit$)/;

/** Las propiedades que nombra un `transition` (o `all` si el tramo empieza por un tiempo). */
export function propiedadesDeTransicion(valor) {
  return partirPorComas(String(valor).replace(/!important/g, '')).map((tramo) => {
    const primero = (tramo.trim().split(/\s+/)[0] || '').toLowerCase();
    if (primero === 'none') return null;
    return PALABRAS_DE_TIEMPO.test(primero) ? 'all' : primero;
  }).filter(Boolean);
}

/** Cada `@keyframes` con las propiedades que cambian sus fotogramas. */
export function keyframesConPropiedades(css = '') {
  const limpio = sinComentariosCss(css);
  const out = {};
  const re = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/g;
  let mt;
  while ((mt = re.exec(limpio))) {
    let nivel = 1;
    let i = re.lastIndex;
    while (i < limpio.length && nivel > 0) {
      if (limpio[i] === '{') nivel += 1;
      if (limpio[i] === '}') nivel -= 1;
      i += 1;
    }
    const cuerpo = limpio.slice(re.lastIndex, i - 1);
    const props = new Set();
    const valores = {};
    [...cuerpo.matchAll(/([a-z-]+)\s*:\s*([^;}]+)/g)].forEach((d) => {
      props.add(d[1]);
      (valores[d[1]] = valores[d[1]] || []).push(d[2].trim());
    });
    out[mt[1]] = { propiedades: [...props], valores };
  }
  return out;
}

/** Todo lo que anima el CSS: `{ selector, linea, via, keyframe, propiedad, coste }`. */
export function animacionesDelCss(css = '') {
  const limpio = sinComentariosCss(css);
  const kf = keyframesConPropiedades(css);
  const nombres = Object.keys(kf);
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let mt;
  while ((mt = re.exec(limpio))) {
    const selector = mt[1].replace(/\s+/g, ' ').trim();
    if (/^(from|to|\d)/.test(selector) || selector.startsWith('@')) continue;
    const linea = lineaDe(limpio, mt.index + mt[1].length);
    const cuerpo = mt[2];
    [...cuerpo.matchAll(/(?:^|;)\s*(transition(?:-property)?|animation(?:-name)?)\s*:\s*([^;]+)/g)].forEach((d) => {
      const tipo = d[1];
      const valor = d[2].trim();
      if (tipo.startsWith('transition')) {
        const props = tipo === 'transition-property'
          ? partirPorComas(valor.replace(/!important/g, '')).map((x) => x.trim().toLowerCase()).filter((x) => x && x !== 'none')
          : propiedadesDeTransicion(valor);
        props.forEach((p) => out.push({ selector, linea, via: 'transition', keyframe: null, propiedad: p, coste: costeDe(p) }));
      } else {
        const usados = nombres.filter((n) => new RegExp(`(^|[\\s,])${n}(?=$|[\\s,])`).test(valor));
        usados.forEach((n) => kf[n].propiedades.forEach((p) => out.push({ selector, linea, via: 'keyframes', keyframe: n, propiedad: p, coste: costeDe(p) })));
      }
    });
  }
  return out;
}

/* ───────────────────────────────────────────────────────────────────────────
   LO CARO QUE SE QUEDA, Y POR QUÉ (apartados 11, 12, 15, 16 y 55)

   *"No eliminarlas automáticamente."* Una animación de pintado o de diseño
   puede ser la correcta: la altura de un desplegable (la F10) no tiene una
   alternativa que no mida en cada fotograma. Lo que no puede es entrar sin que
   nadie lo diga: cada una tiene aquí su línea —qué regla, qué propiedad y por
   qué es el coste justo—, y una nueva sin línea pone la suite roja.
   `selector` es una expresión sobre el selector de la regla.
   ─────────────────────────────────────────────────────────────────────────── */
export const COSTES_DECLARADOS = Object.freeze([
  { selector: /\.plegable/, propiedad: 'grid-template-rows', motivo: 'La altura de un desplegable (MS F10): `grid-template-rows` 0fr → 1fr es la única forma de animar `height: auto` sin medir en cada fotograma (apartado 12). La mide el navegador una vez, y dura `normal`.' },
  { selector: /(barra|progreso)/, propiedad: 'width', motivo: 'Una barra de progreso que cambia de valor (MS F4): una vez por cambio, en una caja de pocos píxeles de alto dentro de un carril de ancho fijo, que no empuja a nadie. `scaleX` deformaría sus esquinas redondeadas.' },
  { selector: /barra-progreso/, propiedad: 'background', motivo: 'El color de la barra cuando cambia de tramo (MS F4): un repintado de la misma caja pequeña, a la vez que su ancho.' },
  { selector: /\.fit-miniatura/, propiedad: 'width', motivo: 'La tira de miniaturas del entrenamiento en vivo (FIT F37, apartado 10): la del ejercicio actual crece y empuja a las demás, que es justo lo que se quiere ver. Seis cajas como mucho, solo al cambiar de ejercicio.' },
  { selector: /\.fit-miniatura/, propiedad: 'padding', motivo: 'La misma miniatura, a la vez que su ancho (FIT F37).' },
  { selector: /./, propiedad: 'background-color', motivo: 'El color de un botón, una pestaña o una fila al tocarla o al cambiar de estado: un repintado de una caja pequeña, una vez.' },
  { selector: /./, propiedad: 'color', motivo: 'El color del texto al cambiar de estado (una pestaña activa, un enlace): un repintado de unas letras, una vez.' },
  { selector: /./, propiedad: 'fill', motivo: 'El color de un icono al cambiar de estado (lo trae `transition-colors`): un repintado de un dibujo pequeño, una vez.' },
  { selector: /./, propiedad: 'stroke', motivo: 'El trazo de un icono o de un aro al cambiar de estado: un repintado de un dibujo pequeño, una vez.' },
  { selector: /./, propiedad: 'border-color', motivo: 'El borde de un campo que se enfoca o de un interruptor (MS F3 y F9): un repintado de un marco, una vez.' },
  { selector: /\.campo/, propiedad: 'box-shadow', motivo: 'El anillo de un campo que se enfoca (MS F9): una sombra de 1-2 px alrededor de UN campo, una vez al enfocarlo. Un pseudo-elemento no puede: un `<input>` no tiene `::after`.' },
  { selector: /\.fit-descanso-fin/, propiedad: 'box-shadow', motivo: 'El único pulso de una barra cuando termina el descanso (FIT F37, apartado 9): una vez por descanso, alrededor de una caja de una línea.' },
  { selector: /\.hub-card/, propiedad: 'filter', motivo: 'El brillo de una tarjeta de la portada al pulsarla (Fase N3): `brightness` lo compone el navegador (Chromium lo hace en la GPU) y dura `fast`. Un velo blanco encima no se ve igual: aclara distinto en claro y en oscuro.' },
  { selector: /\.fuego-sube/, propiedad: 'filter', motivo: 'El brillo de la llama al subir una racha (E3 F2): una marca de 16 px, una vez.' },
  { selector: /\.aro-pomodoro/, propiedad: 'stroke-dashoffset', motivo: 'El aro del Pomodoro al avanzar (E3 F25): un SVG pequeño que cambia una vez por segundo como mucho.' },
  { selector: /./, propiedad: 'visibility', motivo: 'Lo que se esconde al final de su salida: no se interpola, cambia en el último fotograma.' },
]);

/** ¿Está declarado el coste de esta animación? */
export const costeDeclarado = (a) => COSTES_DECLARADOS.find((d) => d.propiedad === a.propiedad && d.selector.test(a.selector)) || null;

/* ───────────────────────────────────────────────────────────────────────────
   4 · LA AUDITORÍA (apartados 13, 14, 18, 19, 23, 25, 27 y 47)

   Cada regla trae su `ejemploMalo`, y la prueba comprueba que lo caza: una
   regla que no puede ponerse roja no vigila nada (EH F42).
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentariosJs = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:\\'"`])\/\/.*$/gm, (x, a) => a + ' '.repeat(x.length - a.length));
const sinCadenas = (src) => String(src || '').replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, (x) => x[0] + ' '.repeat(Math.max(0, x.length - 2)) + x[0]);

/** Las piezas de movimiento: en ellas un intervalo se cambia por un fotograma (apartado 23). */
export const PIEZAS_MOTION = Object.freeze([
  'src/lib/motion.js', 'src/lib/orquestadorMotion.js', 'src/lib/continuidad.js', 'src/lib/layoutMotion.js',
  'src/lib/gestosMotion.js', 'src/lib/fisicaMotion.js', 'src/lib/datosMotion.js', 'src/lib/accesibilidadMotion.js',
  'src/lib/rendimientoMotion.js', 'src/components/motion.jsx', 'src/components/layoutMotion.jsx',
  'src/components/continuidad.jsx', 'src/components/gestosMotion.jsx', 'src/components/capasMotion.js',
  'src/components/navegacionMotion.js', 'src/components/fundidoBajoCabecera.js', 'src/components/accesibilidadMotion.jsx',
  'src/lib/responsiveMotion.js', 'src/components/responsiveMotion.js',
  'src/lib/estadosAsincronos.js', 'src/lib/sincronizacion.js', 'src/components/estadosAsincronos.jsx', 'src/components/vacioMotion.js',
]);

export const REGLAS_COSTE = Object.freeze([
  { id: 'coste_sin_declarar', que: 'Una animación de pintado o de diseño en index.css sin su línea en `COSTES_DECLARADOS`', ejemploMalo: '.tarjeta-nueva { transition: box-shadow var(--motion-dur-fast) var(--ease-premium); }' },
  { id: 'transicion_de_todo', que: '`transition: all` (o un tiempo sin propiedad): anima cualquier cosa que cambie, también las caras', ejemploMalo: '.algo { transition: var(--motion-dur-fast) var(--ease-premium); }' },
  { id: 'desenfoque_animado', que: 'Un desenfoque animado (`backdrop-filter` o `filter: blur()` en una transición o unos fotogramas): lo más caro que hay en un iPhone', ejemploMalo: '@keyframes velo { from { backdrop-filter: blur(0); } to { backdrop-filter: blur(12px); } } .velo { animation: velo 200ms; }' },
  { id: 'will_change', que: '`will-change`: una capa que no es gratis, puesta para siempre (apartados 18-20)', ejemploMalo: '<div style={{ willChange: \'transform\' }} />' },
  { id: 'escuchador_no_pasivo', que: 'Un escuchador de `scroll`, `wheel`, `touchstart` o `touchmove` sin decir `passive` (apartado 25)', ejemploMalo: "window.addEventListener('scroll', medir);" },
  { id: 'intervalo_en_motion', que: 'Un `setInterval` en una pieza de movimiento: lo que se pinta va con `requestAnimationFrame`, que se para solo con la pestaña escondida (apartados 23 y 41)', ejemploMalo: 'const t = setInterval(avanzar, 16);' },
]);

const ESCUCHADOR = /addEventListener\(\s*['"](scroll|wheel|touchstart|touchmove)['"]\s*,\s*[\w.]+\s*(\)|,\s*([^)]*)\))/g;

/** Lo que dice el código de una pieza (o de cualquier archivo): `will-change`, escuchadores e intervalos. */
export function problemasDeFuente(src = '', archivo = '') {
  const out = [];
  const limpio = sinComentariosJs(src);
  const sinTextos = sinCadenas(limpio);
  const linea = (i) => lineaDe(limpio, i);
  [...sinTextos.matchAll(/\bwillChange\b|will-change\s*:/g)].forEach((m) => out.push({ regla: 'will_change', archivo, linea: linea(m.index) }));
  /* La cadena del evento se lee del código con las cadenas (es un `'scroll'`). */
  [...limpio.matchAll(ESCUCHADOR)].forEach((m) => {
    /* Un ejemplo escrito dentro de un texto (el `ejemploMalo` de una regla) no escucha nada. */
    if (sinTextos.slice(m.index, m.index + 16) !== 'addEventListener') return;
    if (!/passive/.test(m[3] || '')) out.push({ regla: 'escuchador_no_pasivo', archivo, linea: linea(m.index), evento: m[1] });
  });
  if (PIEZAS_MOTION.includes(archivo)) {
    [...sinTextos.matchAll(/\bsetInterval\s*\(/g)].forEach((m) => out.push({ regla: 'intervalo_en_motion', archivo, linea: linea(m.index) }));
  }
  return out;
}

/** Lo que dice el CSS: lo caro sin declarar, `transition: all` y el desenfoque animado. */
export function problemasDeCss(css = '') {
  const out = [];
  const kf = keyframesConPropiedades(css);
  animacionesDelCss(css).forEach((a) => {
    if (a.coste === 'todo') { out.push({ regla: 'transicion_de_todo', ...a }); return; }
    const blur = a.propiedad === 'backdrop-filter' || a.propiedad === '-webkit-backdrop-filter'
      || (a.propiedad === 'filter' && a.keyframe && (kf[a.keyframe].valores.filter || []).some((v) => /blur\(/.test(v)));
    if (blur) { out.push({ regla: 'desenfoque_animado', ...a }); return; }
    if (a.coste !== 'composicion' && !costeDeclarado(a)) out.push({ regla: 'coste_sin_declarar', ...a });
  });
  if (/will-change\s*:/.test(sinComentariosCss(css))) out.push({ regla: 'will_change', archivo: 'src/index.css' });
  return out;
}

/** La auditoría entera: `{ css, fuentes: { 'src/…': código } }` → `{ problemas, animaciones, porCoste }`. */
export function auditarCosteMotion({ css = '', fuentes = {} } = {}) {
  const animaciones = animacionesDelCss(css);
  const problemas = [...problemasDeCss(css), ...Object.entries(fuentes).flatMap(([archivo, src]) => problemasDeFuente(src, archivo))];
  const porCoste = animaciones.reduce((acc, a) => { acc[a.coste] = (acc[a.coste] || 0) + 1; return acc; }, {});
  return { problemas, animaciones, porCoste };
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · LA CALIDAD ADAPTATIVA (apartados 38, 44 y 45)

   *"No convertir esto en una configuración visible obligatoria. Puede ser una
   política interna."* Cuatro calidades, que son los cinco modos de la F1 vistos
   desde el coste. Y *"si el sistema detecta condiciones claramente limitadas"*
   (apartado 44), las rebajas son las que se MIDEN, no las que se adivinan:
   🔓 **C-64** — la F12 ya decidió (`ADAPTACION`, su apartado 37) que la batería,
   la memoria y los núcleos no cuentan —Safari de iOS no da los dos primeros y
   adivinar castiga a quien no lo necesita—, y la F13 pide rebajar solo *"cuando
   sea seguro hacerlo"*. Las dos caben: se rebaja con lo que el sistema VE —demasiadas
   animaciones a la vez, una lista que cambia entera—, nunca con una suposición
   sobre el aparato.
   ─────────────────────────────────────────────────────────────────────────── */
export const CALIDADES_MOTION = Object.freeze([
  { id: 'full', nombre: 'Completa', modos: ['premium', 'ultra'], queda: 'Todo: la amplitud de Premium y la profundidad de Ultra (el velo que desenfoca).' },
  { id: 'standard', nombre: 'Estándar', modos: ['normal'], queda: 'El movimiento de siempre, sin materiales caros añadidos.' },
  { id: 'reduced', nombre: 'Reducida', modos: ['reducido'], queda: 'Fundidos en su sitio (F1 y F12).' },
  { id: 'minimal', nombre: 'Mínima', modos: ['off'], queda: 'Nada se anima.' },
]);

export const calidadDeModo = (modo) => (CALIDADES_MOTION.find((c) => c.modos.includes(modo)) || CALIDADES_MOTION[1]).id;

/** Las rebajas automáticas: cada una con lo que mide y dónde vive. Ninguna toca una función, la navegación ni el feedback. */
export const REBAJAS_AUTOMATICAS = Object.freeze([
  { senal: 'Demasiadas animaciones a la vez', mide: 'Las vivas del orquestador contra `PRESUPUESTO_ORQUESTADOR.simultaneas`', rebaja: 'Lo micro y lo decorativo no empiezan; lo que informa, sí.', donde: 'src/lib/orquestadorMotion.js', trozo: 'cedenPorPresupuesto' },
  { senal: 'Una lista que cambia entera o es muy larga', mide: 'Las filas medidas contra `PRESUPUESTO_LAYOUT`', rebaja: 'Un fundido de la lista en vez de cuarenta viajes; lo que no se ve ni antes ni después, no se anima.', donde: 'src/lib/layoutMotion.js', trozo: 'maxMedidos' },
  { senal: 'Una cascada larga (una pantalla densa, apartado 38)', mide: 'El índice del elemento contra `STAGGER_MOTION.escalones`', rebaja: 'A partir del sexto, todos entran a la vez: una pantalla llena no tarda más en aparecer.', donde: 'src/lib/motion.js', trozo: 'STAGGER_MOTION.escalones - 1' },
  { senal: 'Reducir movimiento (el del iPhone o el de Ajustes)', mide: 'La preferencia de verdad', rebaja: 'Reducido (F1 y F12).', donde: 'src/lib/motion.js', trozo: 'export function contextoMotion' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   6 · EL MONITOR DE FOTOGRAMAS (apartado 46: *"Debe ser desarrollo-only"*)

   Mide los intervalos entre fotogramas y cuenta las tareas largas, y dice qué
   pantalla se ve, con qué calidad se pinta y cuántas animaciones hay en marcha
   (las del orquestador).
   🚨 **Se para solo con la pestaña escondida** (apartados 41 y 42): un bucle de
   `requestAnimationFrame` que sigue vivo en segundo plano es justo lo que esta
   fase persigue. Las dependencias se inyectan para poder probarlo en Node.
   ─────────────────────────────────────────────────────────────────────────── */
export const TOPE_MUESTRAS = 600;

export function crearMonitorDeFotogramas({
  raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null,
  cancelar = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : () => {},
  documento = typeof document !== 'undefined' ? document : null,
  observarTareasLargas = null,
  estado = estadoGlobalMotion,
} = {}) {
  let id = 0;
  let ultimo = null;
  let activo = false;
  let pausado = false;
  let tareasLargas = 0;
  let observador = null;
  const intervalos = [];
  const paso = (t) => {
    if (!activo || pausado) return;
    if (ultimo !== null) {
      intervalos.push(t - ultimo);
      if (intervalos.length > TOPE_MUESTRAS) intervalos.shift();
    }
    ultimo = t;
    id = raf(paso);
  };
  const alCambiarVisibilidad = () => {
    if (!documento || !activo) return;
    if (documento.visibilityState === 'hidden') {
      pausado = true;
      cancelar(id);
      ultimo = null;
    } else if (pausado) {
      pausado = false;
      id = raf ? raf(paso) : 0;
    }
  };
  const leer = () => {
    const e = typeof estado === 'function' ? estado() : null;
    const region = documento && documento.querySelector ? documento.querySelector('[role="region"][aria-label]') : null;
    return {
      ...resumenDeFotogramas(intervalos, { hz: hzProbable(intervalos) }),
      tareasLargas,
      animaciones: e ? e.enMarcha : null,
      porSistema: e ? e.porSistema : null,
      grupos: e ? e.grupos : null,
      pantalla: region ? region.getAttribute('aria-label') : null,
      calidad: documento && documento.documentElement && documento.documentElement.dataset ? calidadDeModo(documento.documentElement.dataset.motion || 'normal') : null,
      pausado,
      activo,
    };
  };
  return {
    empezar() {
      if (activo || !raf) return false;
      activo = true;
      pausado = !!documento && documento.visibilityState === 'hidden';
      intervalos.length = 0;
      ultimo = null;
      tareasLargas = 0;
      if (documento && documento.addEventListener) documento.addEventListener('visibilitychange', alCambiarVisibilidad);
      if (typeof observarTareasLargas === 'function') observador = observarTareasLargas((n) => { tareasLargas += n; });
      if (!pausado) id = raf(paso);
      return true;
    },
    parar() {
      if (!activo) return leer();
      const r = leer();
      activo = false;
      cancelar(id);
      if (documento && documento.removeEventListener) documento.removeEventListener('visibilitychange', alCambiarVisibilidad);
      if (observador && typeof observador.disconnect === 'function') observador.disconnect();
      observador = null;
      return { ...r, activo: false };
    },
    leer,
  };
}

/** Las tareas largas del navegador (Chromium; Safari no tiene `longtask` y entonces no se cuentan). */
export function observadorDeTareasLargas(alContar) {
  try {
    if (typeof PerformanceObserver === 'undefined' || !(PerformanceObserver.supportedEntryTypes || []).includes('longtask')) return null;
    const o = new PerformanceObserver((lista) => alContar(lista.getEntries().length));
    o.observe({ type: 'longtask', buffered: false });
    return o;
  } catch { return null; }
}

/** Con la marca de depuración de la F11: `window.__motion.fotogramas`. En producción no existe. */
export function exponerMonitor() {
  if (typeof window === 'undefined' || !depurando()) return false;
  window.__motion = { ...(window.__motion || {}), fotogramas: crearMonitorDeFotogramas({ observarTareasLargas: observadorDeTareasLargas }) };
  return true;
}

/* ───────────────────────────────────────────────────────────────────────────
   LA REGLA PERMANENTE (apartado 53)

   *"Toda nueva animación debe cumplir: Visual quality + Accessibility +
   Performance + Interruptibility + Cleanup."* Cada una ya tiene quien la vigila,
   y aquí está escrito quién: una animación nueva pasa por las cinco auditorías
   que `verificar.sh` ejecuta.
   ─────────────────────────────────────────────────────────────────────────── */
export const CINCO_CRITERIOS = Object.freeze([
  { id: 'calidad', que: 'Calidad visual: una curva, sus tokens, su sitio en el mapa', vigila: 'auditarMotion', archivo: 'src/lib/motionMapa.js' },
  { id: 'accesibilidad', que: 'Accesibilidad: Reducido, el teclado y VoiceOver', vigila: 'auditarAccesibilidadMotion', archivo: 'src/lib/accesibilidadMotion.js' },
  { id: 'rendimiento', que: 'Rendimiento: componer antes que pintar, pintar antes que recolocar, y lo caro declarado', vigila: 'auditarCosteMotion', archivo: 'src/lib/rendimientoMotion.js' },
  { id: 'interrumpible', que: 'Se puede interrumpir: pasa por el orquestador, que decide quién manda', vigila: 'resolverConflicto', archivo: 'src/lib/orquestadorMotion.js' },
  { id: 'limpieza', que: 'Se limpia: ningún temporizador, fotograma, escuchador ni observador vivo al desmontar', vigila: 'auditarOrquestacion', archivo: 'src/lib/orquestadorMotion.js' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   LO QUE SE MIDIÓ Y SE DECIDIÓ (apartados 1, 2, 54, 55 y 57)

   Una línea por cada cosa que la auditoría encontró: qué era, qué se hizo y
   dónde. Lo que se miró y está bien se queda dicho, para no volver a barrerlo
   (FIT F44, `REVISADO_Y_BIEN`).
   ─────────────────────────────────────────────────────────────────────────── */
export const HALLAZGOS_F13 = Object.freeze([
  { id: 'sombra_animada', apartados: [15], que: 'Pulsar una tarjeta de la portada animaba `box-shadow` (repintado en cada fotograma, la caja y su sombra de 26-40 px)', queda: '🔓 La sombra levantada es un pseudo-elemento que se FUNDE (`opacity`): mismo dibujo, solo composición. La de la expansión, otro encima del primero.', donde: 'src/index.css', trozo: 'button.hub-card:not([class*=\'active:scale\'])::after' },
  { id: 'fundido_lee_escribe', apartados: [6, 7], que: 'El fundido bajo la cabecera (SF2) leía una tarjeta y le escribía la máscara, y luego leía la siguiente: un recálculo de estilo forzado por tarjeta en cada fotograma de scroll', queda: '🔓 Lee todas y luego escribe todas: un recálculo por fotograma.', donde: 'src/components/fundidoBajoCabecera.js', trozo: 'const bordes = tarjetas.map(' },
  { id: 'origenes_retenidos', apartados: [21], que: 'Los orígenes de la continuidad (F7) se quedaban en el registro hasta que alguien los tomaba: cada nombre de la biblioteca que se iba dejaba su nodo desmontado guardado para siempre', queda: '🔓 Cada vez que se apunta uno se podan los caducados: el registro no guarda un nodo más allá de su caducidad.', donde: 'src/lib/continuidad.js', trozo: 'podarOrigenes(ahora);' },
  { id: 'fuentes_tarde', apartados: [37], que: 'Las tipografías se pedían desde dentro de index.css (`@import`): la conexión con Google Fonts no empezaba hasta descargar y leer el CSS, y el cambio de la de respaldo a la buena llegaba más tarde', queda: '🔓 `preconnect` en index.html: la conexión se abre a la vez que la página. ⚠️ Las métricas de la de respaldo (`size-adjust`) NO se inventan: harían falta las de verdad de Manrope e Inter.', donde: 'index.html', trozo: 'rel="preconnect" href="https://fonts.gstatic.com"' },
]);

export const REVISADO_Y_BIEN_F13 = Object.freeze([
  { que: 'Las listas (F10)', porque: 'Miden todas las filas y luego escriben (FLIP de verdad), no animan lo que no se ve ni antes ni después (`seVe`) y se rinden por encima de `PRESUPUESTO_LAYOUT`.' },
  { que: 'Los gestos (F5 y F8)', porque: 'El dedo mueve el `transform` por un `ref`, nunca un estado de React; la medida de la caja se lee UNA vez al empezar, no en cada `pointermove`.' },
  { que: 'El comparador de fotos (FIT F27)', porque: 'Su divisor sí pasa por React en cada `pointermove`, pero el navegador ya entrega un `pointermove` por fotograma (Chromium y Safari los alinean con `requestAnimationFrame`): agruparlos no ahorraría ninguno.' },
  { que: 'La cifra que cuenta (F4)', porque: 'Un repintado de React por fotograma de UNA cifra, como mucho cuatro a la vez, durante `slow`; React no repinta si el texto no cambia. Escribir el texto a mano rompería que acabe pintando exactamente su `children`.' },
  { que: 'Las animaciones del orquestador (F11)', porque: 'El registro de las vivas se vacía solo al acabar o cancelarse cada una, y ninguna es infinita (ni un `iterations: Infinity`).' },
  { que: '`will-change`', porque: 'Ni uno en todo el proyecto: el navegador sube a su capa lo que anima `transform` u `opacity` mientras dura, y la suelta al acabar. Una capa permanente cuesta memoria aunque nada se mueva (apartados 18-20).' },
  { que: 'Los escuchadores de scroll', porque: 'Los cuatro son pasivos y no escriben en el documento (el del fundido pide un fotograma y escribe allí).' },
  { que: 'Las animaciones en segundo plano', porque: 'Las de CSS y las de la Web Animations API no pintan con la pestaña escondida, y `requestAnimationFrame` no corre: no hay ni un intervalo en una pieza de movimiento. Los bucles infinitos (F12) son solo de carga.' },
  { que: 'El peso del paquete (apartado 34)', porque: 'Cero librerías de animación (F0, y `package.json` lo vigila): todo es CSS y la Web Animations API del navegador.' },
  { que: 'Imágenes (apartado 36)', porque: 'Todas reservan su hueco (F10, `imagenesSinHueco`) y las miniaturas de las fotos son perezosas (FIT F38).' },
]);

export const NO_EN_F13 = Object.freeze([
  { que: 'Typecheck y lint (apartado 56)', porque: 'El proyecto no tiene ni uno ni otro (FIT F35, C-48): fingirlos sería la regla 8. Lo que vigila son las auditorías y `verificar.sh`.' },
  { que: 'Virtualizar listas (apartado 39)', porque: 'Ninguna lista pinta cientos de filas a la vez: las largas van de veinte en veinte (FIT F34) y la F10 tiene su presupuesto. Una lista virtual rompería la búsqueda del navegador y VoiceOver sin ganar nada medible.' },
  { que: 'Forzar capas de GPU (apartado 20)', porque: '*"Medir primero"*: ni un `translateZ(0)` ni un `will-change` puesto a mano.' },
  { que: 'Una opción visible de calidad (apartado 45)', porque: 'Es una política interna: lo que él elige son los modos de la F1, y la calidad sale de ellos.' },
  { que: 'Rebajar por los núcleos, la memoria o la batería del aparato (apartado 44)', porque: '🔓 C-64: la F12 lo descartó con su motivo (`ADAPTACION`) —Safari de iOS no da la memoria ni la batería, y adivinar castiga a quien no lo necesita—. Las rebajas son las que se miden (`REBAJAS_AUTOMATICAS`).' },
  { que: 'Quitar el cristal de la portada o de la barra de abajo (apartados 13 y 14)', porque: '*"No eliminarlos automáticamente."* Son material fijo —ni uno se anima—, y es el diseño que él pidió (Fase N4). Lo que sí se vigila es que ninguno se anime nunca.' },
]);

/* Al cargar: si se está depurando, el monitor queda a mano. En producción no hace nada. */
exponerMonitor();
