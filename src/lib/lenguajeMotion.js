/* ===========================================================================
   lenguajeMotion.js — MOTION SYSTEM · FASE 14: cómo se SIENTE el movimiento

   *"Dos interfaces pueden utilizar 300ms y parecer completamente diferentes."*
   Los tokens existen desde la F1 (`motion.js`: duraciones, curvas, muelles,
   distancias, escalas, pulsos, el escalonado) y cada fase los fue usando. Lo
   que faltaba es la GRAMÁTICA: qué curva le toca a qué papel, qué duración a
   qué talla, que abrir y cerrar no sean lo mismo al revés, que lo equivalente
   vaya al mismo ritmo, y quién lo comprueba.

   Nada aquí es un valor nuevo: todo son ids de los tokens de la F1 (apartado
   51: *"Los tokens deben ser la única fuente de verdad"*). Y la auditoría lee
   el CSS de verdad: una curva fuera de su papel, una duración fuera de su
   talla o una velocidad que no es la del sistema ponen la suite roja.
   =========================================================================== */
import { CURVAS_MOTION, DURACIONES_MOTION, DISTANCIAS_MOTION, PRESETS_MOTION, STAGGER_MOTION, TOPES_ESCALA } from './motion';
import { MOTION_MAP, NIVELES_MOTION, escanearCss } from './motionMapa';
import { JERARQUIA_MUELLES, MUELLES_EN_USO } from './fisicaMotion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA FIRMA (apartados 44, 45, 49 y 50)

   *"Definir qué hace que el movimiento sea reconociblemente JOS STYLE."* La
   temperatura es **precisa, premium y natural**: ni mecánica (lineal, robótica)
   ni de dibujos (rebotes, elástica). Y no es una landing page: el movimiento
   está al servicio de entender, orientarse, tocar y seguir el hilo.
   ─────────────────────────────────────────────────────────────────────────── */
export const TEMPERATURA_MOTION = Object.freeze({
  punto: 'Preciso, premium y natural.',
  noFrio: 'Nunca lineal ni mecánico donde algo se mueve: `linear` es solo de relojes y bucles.',
  noCaliente: 'Nunca elástico ni juguetón: ningún muelle que se use rebota (F8) y una superficie no pasa de 1,03.',
});

export const FIRMA_MOTION = Object.freeze([
  { que: 'Una deceleración larga y suave', como: '`--ease-premium` (la `standard`), la curva de la Fase N2: arranca decidida y se posa sin frenazo. Es la de casi todo lo que se mueve a su sitio.', donde: 'CURVAS_MOTION.standard' },
  { que: 'Distancias cortas', como: 'De 4 a 24 px (y 40 solo para lo protagonista): las cosas no vuelan por la pantalla, se desplazan lo justo para decir de dónde vienen.', donde: 'DISTANCIAS_MOTION' },
  { que: 'Escalas contenidas', como: `Una superficie entra desde ${TOPES_ESCALA.superficie.min} y no pasa de ${TOPES_ESCALA.superficie.max}; solo una marca pequeña (la llama, un ✓) late hasta ${TOPES_ESCALA.marca.max}.`, donde: 'TOPES_ESCALA' },
  { que: 'Volver es más corto que entrar', como: 'Una pantalla entra en `slow` desde la derecha y se vuelve en `normal` desde la izquierda, sin escala: volver no es abrir al revés.', donde: 'PRESETS_MOTION.pageEnter / pageBack' },
  { que: 'Lo que se va no se queda mirando', como: 'Toda salida dura menos que su entrada y acelera hacia fuera (`exit`).', donde: 'PRESETS_MOTION.*Exit' },
  { que: 'Una cascada que no hace esperar', como: `Un paso de ${STAGGER_MOTION.pasoMs} ms y como mucho ${STAGGER_MOTION.escalones} escalones: el séptimo entra con el sexto.`, donde: 'STAGGER_MOTION' },
  { que: 'Las sombras se funden, no se estiran', como: 'Una sombra que aparece es una capa ya pintada que se funde (F13): elevarse se ve, y no cuesta.', donde: 'index.css · button.hub-card::after' },
  { que: 'Un solo momento de firma', como: 'El «+1» de una racha es lo único que dura `firma` (900 ms): si estuviera en todas partes dejaría de ser una firma.', donde: 'NIVELES_MOTION (Firma)' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   2 · LAS CURVAS TIENEN PAPEL (apartados 3-6, 13, 14 y 49)

   *"Crear una jerarquía semántica."* Las seis curvas de la F1, cada una con
   UN papel. Qué papel tiene cada animación lo dice su línea del `MOTION_MAP`
   —su categoría y su nivel—, y unas pocas excepciones con su motivo.
   ─────────────────────────────────────────────────────────────────────────── */
export const ROLES_MOTION = Object.freeze([
  { id: 'llega', curva: 'standard', que: 'Algo se mueve a su sitio con relación espacial: una pantalla que entra o vuelve, una tarjeta, una cifra, una fila que se recoloca, lo que responde al dedo.', fases: 'preparación → movimiento → asentamiento (apartado 4): la deceleración larga ES el asentamiento, sin rebote.' },
  { id: 'aparece', curva: 'entrance', que: 'Algo aparece en su sitio sin venir de otro: una hoja, una ventana, un menú, un aviso, un mensaje de error, un estado vacío.', fases: 'Llega deprisa y se posa: lo que aparece tiene que estar YA, no venir de camino.' },
  { id: 'sale', curva: 'exit', que: 'Algo se va.', fases: 'visible → acelera → se va (apartado 5): arranca suave y sale sin frenar. Nunca la misma curva que su entrada.' },
  { id: 'abreCierra', curva: 'smooth', que: 'Lo que va y vuelve en su sitio: un desplegable y su chevron.', fases: 'Simétrica: abrir y cerrar son el mismo camino, a distinta duración.' },
  { id: 'momento', curva: 'emphasized', que: 'Algo importante acaba de pasar: los niveles Momento y Firma del mapa (subir de rango, la racha, el «+1»).', fases: 'El énfasis: se toma su tiempo al llegar.' },
  { id: 'ritmo', curva: 'linear', que: 'Relojes y bucles (el aro del Pomodoro): frenar mentiría.', fases: 'Constante.' },
]);

/** Las categorías del mapa cuyo papel es APARECER (todas las demás LLEGAN). */
export const CATEGORIAS_QUE_APARECEN = Object.freeze(['G', 'H', 'I', 'O', 'P']);

/** Las excepciones, con su motivo: una clase cuyo papel no es el de su categoría. */
export const ROL_POR_CLASE = Object.freeze({
  'plegable': { rol: 'abreCierra', porque: 'Va y vuelve en su sitio (F10).' },
  'chevron-gira': { rol: 'abreCierra', porque: 'Gira con su desplegable, de ida y de vuelta (F3).' },
  'despliegue-entra': { rol: 'aparece', porque: 'El contenido que aparece al abrir un desplegable: no viene de otro sitio.' },
  'vacio-entra': { rol: 'aparece', porque: 'Un estado vacío aparece en su sitio (está en «Gráficas» por dónde vive, no por lo que hace).' },
  'aviso-entra': { rol: 'aparece', porque: 'Un aviso aparece abajo y se va (F9): está en «Éxito» por lo que dice, no por cómo se mueve.' },
  'fondo-entra': { rol: 'llega', porque: 'El velo de detrás de una hoja: lo del fondo responde más suave que lo de delante (apartado 28), así que no se apresura como la hoja.' },
});

/** Clases que usan DOS curvas a propósito (una por propiedad), con su motivo. */
export const CURVAS_DOBLES = Object.freeze({
  'interruptor-bola': { curvas: ['entrance', 'standard'], porque: 'La bola vuelve con `entrance` (F3: pulsa en `ultraFast` y se posa) y su color con la estándar.' },
  'nav-indicador': { curvas: ['emphasized', 'standard'], porque: 'El indicador de la pestaña viaja con énfasis (F2): es el único que cruza la barra; su color, con la estándar.' },
  'aro-pomodoro': { curvas: ['linear', 'standard'], porque: 'El aro avanza como un reloj (`linear`); su color cambia con la estándar.' },
});

const ID_DE_VAR = (v) => (v === '--ease-premium' ? 'standard' : String(v || '').replace('--motion-curva-', ''));
export const curvaDeVar = (v) => ID_DE_VAR(String(v || '').replace(/^var\(|\)$/g, ''));

/** El papel de una línea del mapa: su excepción, su nivel (Momento y Firma), o su categoría. */
export function rolDe(entrada) {
  if (!entrada) return 'llega';
  if (ROL_POR_CLASE[entrada.clase]) return ROL_POR_CLASE[entrada.clase].rol;
  if (entrada.nivel >= 4) return 'momento';
  if (CATEGORIAS_QUE_APARECEN.includes(entrada.categoria)) return 'aparece';
  return 'llega';
}

/** Las curvas que puede usar una línea del mapa. */
export function curvasEsperadas(entrada) {
  if (entrada && CURVAS_DOBLES[entrada.clase]) return [...CURVAS_DOBLES[entrada.clase].curvas];
  const rol = ROLES_MOTION.find((r) => r.id === rolDe(entrada));
  return [rol.curva];
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LA ESCALA DEL MOVIMIENTO (apartados 9, 16-18)

   *"Basada no solo en duración sino también en distancia, complejidad e
   importancia."* Son los niveles del mapa de la F0 con su talla: un botón no
   pesa lo que una hoja. Cada talla dice qué duraciones le caben (los tokens de
   la F1), cuánto se desplaza como mucho y su masa (los muelles de la F8).
   ─────────────────────────────────────────────────────────────────────────── */
export const ESCALA_MOVIMIENTO = Object.freeze([
  { talla: 'XS', nivel: 1, nombre: 'Micro', que: 'Responde al dedo: pulsar, marcar, un interruptor, un chevron, un mensaje bajo un campo.', duraciones: ['ultraFast', 'fast', 'normal'], distanciaMax: 'small', masa: 'Un toque: va por tiempo, no es un muelle (F8).' },
  { talla: 'SM', nivel: 2, nombre: 'Suave', que: 'Algo aparece, se va o cambia de sitio: una pantalla, una hoja, una tarjeta, un aviso.', duraciones: ['fast', 'normal', 'medium', 'slow'], distanciaMax: 'large', masa: 'Una hoja o un botón arrastrado: `responsive`.' },
  { talla: 'MD', nivel: 3, nombre: 'Protagonista', que: 'El movimiento es la información: la portada que entra, una barra que avanza, un mes que cambia.', duraciones: ['normal', 'medium', 'slow', 'cinematic'], distanciaMax: 'large', masa: 'Una tarjeta: `normal`.' },
  { talla: 'LG', nivel: 4, nombre: 'Momento', que: 'Algo importante acaba de pasar.', duraciones: ['medium', 'slow', 'cinematic', 'momento'], distanciaMax: 'hero', masa: 'Una pantalla entera: `soft`.' },
  { talla: 'XL', nivel: 5, nombre: 'Firma', que: 'Lo único que es solo de JosStyle: el «+1» de una racha.', duraciones: ['firma'], distanciaMax: 'hero', masa: '—' },
]);

export const tallaDeNivel = (nivel) => ESCALA_MOVIMIENTO.find((t) => t.nivel === nivel) || null;

/* ───────────────────────────────────────────────────────────────────────────
   4 · LA VELOCIDAD QUE SE VE (apartados 7 y 8)

   *"La duración no puede evaluarse aislada."* Lo que el ojo compara es
   cuántos píxeles recorre algo por milisegundo. Las entradas de JosStyle van
   de 0,018 px/ms (una cifra que asoma 4 px) a 0,071 (una pantalla que entra
   24 px): todo dentro de una banda en la que nada parece lento al lado de otra
   cosa. El «+1» de una racha va a propósito más despacio: es la firma, sube
   para leerse.
   ─────────────────────────────────────────────────────────────────────────── */
export const BANDA_VELOCIDAD = Object.freeze({ minPxMs: 0.015, maxPxMs: 0.08 });
export const VELOCIDAD_A_PROPOSITO = Object.freeze({ masUnoSube: 'La firma: el «+1» sube despacio para que se lea (900 ms, 4 px).' });

const sinComentariosCss = (css) => String(css || '').replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' '));
const claveDuracion = (t) => Object.keys(DURACIONES_MOTION).find((k) => k.toLowerCase() === String(t).toLowerCase()) || null;

/** De cada `@keyframes`, las distancias que usa su `transform` (`var(--motion-dist-*)`). */
function distanciasDeKeyframes(css) {
  const limpio = sinComentariosCss(css);
  const out = {};
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let mt;
  while ((mt = re.exec(limpio))) {
    let nivel = 1;
    let i = re.lastIndex;
    while (i < limpio.length && nivel > 0) { if (limpio[i] === '{') nivel += 1; if (limpio[i] === '}') nivel -= 1; i += 1; }
    const cuerpo = limpio.slice(re.lastIndex, i - 1);
    out[mt[1]] = [...cuerpo.matchAll(/transform\s*:[^;}]*/g)].flatMap((d) => [...d[0].matchAll(/var\(--motion-dist-([a-z]+)\)/g)].map((x) => x[1]));
  }
  return out;
}

/** Las entradas que se desplazan, con su velocidad: `{ selector, keyframe, distancia, duracion, pxPorMs }`. */
export function velocidadesPercibidas(css = '') {
  const dist = distanciasDeKeyframes(css);
  return escanearCss(css)
    .filter((r) => r.tipo === 'animation' && r.keyframe && (dist[r.keyframe] || []).length && !/^html\[|@media/.test(r.selector))
    .map((r) => {
      const t = claveDuracion((r.valor.match(/--motion-dur-([a-z]+)/) || [])[1]);
      const px = Math.max(...dist[r.keyframe].map((d) => DISTANCIAS_MOTION[d] || 0));
      const ms = t ? DURACIONES_MOTION[t] : null;
      return { selector: r.selector, keyframe: r.keyframe, distancia: px, duracion: t, pxPorMs: ms ? Math.round((px / ms) * 1000) / 1000 : null };
    });
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · EL LENGUAJE DE CADA CAPA, DE LA NAVEGACIÓN Y DE LOS GESTOS (33-43)

   Cada pieza ya existía (F2, F5, F6, F8, F9, F11): aquí está escrito qué dice
   cada una, para que la siguiente no invente otra manera de entrar.
   ─────────────────────────────────────────────────────────────────────────── */
export const LENGUAJE_CAPAS = Object.freeze([
  { capa: 'Ventana (un aviso que pregunta, un formulario)', entra: PRESETS_MOTION.modalEnter, sale: PRESETS_MOTION.modalExit, como: 'Aparece casi en su sitio (`small`, `micro`) con `entrance`; se va en `fast` con `exit`.', donde: 'src/lib/profundidad.js (animacionDeCapa)' },
  { capa: 'Hoja (sube del borde)', entra: PRESETS_MOTION.sheetEnter, sale: PRESETS_MOTION.sheetExit, como: 'Física y pegada al borde: sube desde abajo, el dedo la arrastra (`AsaHoja`, F5) y al soltarla decide la velocidad del dedo (F8).', donde: 'src/components/gestosMotion.jsx (AsaHoja)' },
  { capa: 'Menú (popover)', entra: { duracion: 'fast', curva: 'entrance', desde: { y: 'micro' } }, sale: null, como: 'Más ligero que una ventana: `fast`, 4 px, sin velo (apartado 35).', donde: 'index.css · .menu-entra' },
  { capa: 'Aviso (toast)', entra: PRESETS_MOTION.toastEnter, sale: PRESETS_MOTION.toastExit, como: 'Aparece, dice y se va por donde vino sin robar atención (apartado 37, F9).', donde: 'index.css · .aviso-entra' },
  { capa: 'Información pequeña (tooltip)', entra: null, sale: null, como: 'No hay: en el iPhone no hay puntero que se pose (F2), y lo que explica algo se lee en la propia pantalla.', donde: '—' },
]);

export const LENGUAJE_NAVEGACION = Object.freeze([
  { nivel: 'Raíz (las cinco pestañas)', preset: 'sectionSwitch', como: 'Un fundido con un pellizco hacia arriba: las secciones son hermanas, no se apilan.' },
  { nivel: 'Dentro de una pantalla (otra pestaña)', preset: 'contentChange', como: 'Solo cambia lo de dentro, sin moverse: `fast`.' },
  { nivel: 'Detalle (abrir un módulo)', preset: 'pageEnter', como: 'Entra desde la derecha, `large` y `slow`: se va más hondo.' },
  { nivel: 'Volver', preset: 'pageBack', como: 'Desde la izquierda, `small` y `normal`, sin escala: se vuelve a algo que ya estaba (apartado 39).' },
  { nivel: 'Ventana u hoja', preset: 'sheetEnter', como: 'No es navegación: se apila encima (F6), y lo de detrás se queda.' },
]);

export const LENGUAJE_GESTOS = Object.freeze([
  { que: 'La velocidad del dedo decide (apartados 40 y 43)', donde: 'src/lib/gestosMotion.js', como: 'Un arrastre lento que no pasa del umbral vuelve con suavidad; un tirón rápido cierra aunque haya recorrido poco (`UMBRALES_GESTO`).' },
  { que: 'Sin rebote (apartados 13 y 14)', donde: 'src/lib/fisicaMotion.js', como: `Los muelles que se usan (${MUELLES_EN_USO.join(', ')}) no se pasan de su sitio: ningún «boing».` },
  { que: 'Se interrumpe desde donde se ve (apartado 41)', donde: 'src/lib/orquestadorMotion.js', como: 'El dedo que agarra algo que se mueve lo para donde está (`tomarControl`), sin saltar al principio.' },
  { que: 'Reversible (apartado 42)', donde: 'src/index.css · .plegable', como: 'Un desplegable, una hoja o un arrastre se pueden deshacer a medias: las transiciones vuelven desde donde iban.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   6 · LAS ACCIONES EQUIVALENTES (apartado 46)

   Abrir y cerrar, entrar y volver, desplegar y plegar: cada pareja con su
   preset. La regla: **lo que se va dura menos que lo que llega y acelera hacia
   fuera**, y lo que va y vuelve usa la curva simétrica.
   ─────────────────────────────────────────────────────────────────────────── */
export const PAREJAS = Object.freeze([
  { accion: 'Abrir una pantalla / volver', ida: 'pageEnter', vuelta: 'pageBack' },
  { accion: 'Una pantalla entra / se va', ida: 'pageEnter', vuelta: 'pageExit' },
  { accion: 'Una ventana aparece / se cierra', ida: 'modalEnter', vuelta: 'modalExit' },
  { accion: 'Una hoja sube / baja', ida: 'sheetEnter', vuelta: 'sheetExit' },
  { accion: 'Una tarjeta entra / se va', ida: 'cardEnter', vuelta: 'cardExit' },
  { accion: 'Un aviso aparece / se va', ida: 'toastEnter', vuelta: 'toastExit' },
  { accion: 'Desplegar / plegar', ida: 'expand', vuelta: 'collapse' },
]);

/** Las clases que hacen lo mismo y tienen que ir al MISMO ritmo (apartado 8). */
export const EQUIVALENTES = Object.freeze([
  { que: 'Las barras de progreso', clases: ['barra-progreso', 'progreso-libro', 'nu-progreso', 'fit-barra'] },
  { que: 'Las hojas que suben', clases: ['hoja-entra', 'calendar-sheet'] },
  { que: 'Volver y cambiar de sección', clases: ['nav-vuelve', 'nav-seccion'] },
  { que: 'Lo que aparece en su sitio, pequeño', clases: ['despliegue-entra', 'vacio-entra', 'campo-mensaje-entra', 'menu-entra'] },
]);

/* ───────────────────────────────────────────────────────────────────────────
   7 · LA AUDITORÍA DEL LENGUAJE (apartados 1, 2, 19, 20, 47 y 56)

   Lee el CSS de verdad. Cada problema dice qué clase, qué esperaba y qué hay.
   ─────────────────────────────────────────────────────────────────────────── */
const clasesDe = (selector) => [...selector.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((x) => x[1]);
const curvasDeValor = (valor) => [...new Set((valor.match(/var\(--(?:ease-premium|motion-curva-[a-z]+)\)/g) || []).map(curvaDeVar))];
const duracionesDeValor = (valor) => [...new Set((valor.match(/--motion-dur-([a-z]+)/g) || []).map((x) => claveDuracion(x.replace('--motion-dur-', ''))).filter(Boolean))];

/** Las reglas que animan una clase (sin las de modo y las globales). */
function reglasDe(reglas, clase) {
  return reglas.filter((r) => !/^html\[|@media|^\*/.test(r.selector) && clasesDe(r.selector).includes(clase));
}

/** Lo que dice el CSS de una clase: sus curvas y sus duraciones (las de la animación, si la tiene). */
export function movimientoDeClase(css, clase, reglas = escanearCss(css)) {
  const rs = reglasDe(reglas, clase);
  const anim = rs.filter((r) => r.tipo === 'animation');
  const base = anim.length ? anim : rs;
  return {
    reglas: rs.length,
    curvas: [...new Set(rs.flatMap((r) => curvasDeValor(r.valor)))],
    duraciones: [...new Set(base.flatMap((r) => duracionesDeValor(r.valor)))],
  };
}

export function auditarLenguaje({ css = '' } = {}) {
  const reglas = escanearCss(css);
  const problemas = [];
  const mapa = MOTION_MAP.filter((e) => e.clase);
  mapa.forEach((e) => {
    const mov = movimientoDeClase(css, e.clase, reglas);
    if (!mov.reglas) return;
    const esperadas = curvasEsperadas(e);
    const fuera = mov.curvas.filter((c) => !esperadas.includes(c));
    if (fuera.length) problemas.push({ tipo: 'curva_fuera_de_su_papel', clase: e.clase, id: e.id, rol: rolDe(e), esperadas, hay: mov.curvas });
    const delMapa = curvaDeVar(e.easing);
    if (!mov.curvas.includes(delMapa)) problemas.push({ tipo: 'mapa_dice_otra_curva', clase: e.clase, id: e.id, mapa: delMapa, hay: mov.curvas });
    const talla = tallaDeNivel(e.nivel);
    if (talla && !e.bucle && mov.duraciones.some((d) => !talla.duraciones.includes(d))) {
      problemas.push({ tipo: 'duracion_fuera_de_su_talla', clase: e.clase, id: e.id, talla: talla.talla, caben: talla.duraciones, hay: mov.duraciones });
    }
  });
  Object.entries(PRESETS_MOTION).filter(([, p]) => p.clase).forEach(([id, p]) => {
    const mov = movimientoDeClase(css, p.clase, reglas);
    if (!mov.reglas) return;
    if (!mov.curvas.includes(p.curva) || !mov.duraciones.includes(p.duracion)) {
      problemas.push({ tipo: 'preset_y_css_distintos', preset: id, clase: p.clase, preset_dice: `${p.duracion} ${p.curva}`, css_dice: `${mov.duraciones.join('/')} ${mov.curvas.join('/')}` });
    }
  });
  PAREJAS.forEach((par) => {
    const ida = PRESETS_MOTION[par.ida];
    const vuelta = PRESETS_MOTION[par.vuelta];
    if (!ida || !vuelta) { problemas.push({ tipo: 'pareja_sin_preset', accion: par.accion }); return; }
    if (DURACIONES_MOTION[vuelta.duracion] > DURACIONES_MOTION[ida.duracion]) problemas.push({ tipo: 'vuelta_mas_lenta_que_ida', accion: par.accion });
    const simetrica = ida.curva === 'smooth' && vuelta.curva === 'smooth';
    const esVolver = par.vuelta === 'pageBack';
    if (!simetrica && !esVolver && vuelta.curva !== 'exit') problemas.push({ tipo: 'salida_sin_curva_de_salida', accion: par.accion, curva: vuelta.curva });
    if (!simetrica && !esVolver && ida.curva === vuelta.curva) problemas.push({ tipo: 'entrada_igual_que_salida', accion: par.accion });
  });
  EQUIVALENTES.forEach((g) => {
    const durs = g.clases.map((c) => movimientoDeClase(css, c, reglas).duraciones.join('/')).filter(Boolean);
    if (new Set(durs).size > 1) problemas.push({ tipo: 'equivalentes_a_distinto_ritmo', que: g.que, hay: g.clases.map((c, i) => `${c}:${durs[i] || '—'}`) });
  });
  velocidadesPercibidas(css).forEach((v) => {
    if (VELOCIDAD_A_PROPOSITO[v.keyframe] || v.pxPorMs === null) return;
    if (v.pxPorMs < BANDA_VELOCIDAD.minPxMs || v.pxPorMs > BANDA_VELOCIDAD.maxPxMs) problemas.push({ tipo: 'velocidad_fuera_de_banda', ...v });
  });
  return { problemas };
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · LO QUE SE MIDIÓ, LO QUE SE CORRIGIÓ Y LO QUE NO SE HACE (apartados 47, 48 y 53)
   ─────────────────────────────────────────────────────────────────────────── */
export const CORREGIDO_F14 = Object.freeze([
  { que: 'Las barras de progreso iban a tres ritmos', antes: 'Libros 420, el día 340, Nutrición 420 y Fitness 280 ms', ahora: 'Las cuatro en `medium` (280): la misma cosa se mueve igual en toda la aplicación (apartado 8).' },
  { que: 'Abrir y cerrar un desplegable eran lo mismo al revés', antes: '`normal` y la estándar en los dos sentidos, aunque `PRESETS_MOTION` decía otra cosa', ahora: 'Abre en `medium` y cierra en `fast`, los dos con `smooth` (apartados 6 y 42), y el respaldo de `Plegable` espera lo suyo.' },
  { que: 'Los momentos no usaban su curva', antes: 'Subir de rango, la llama y el «+1» con la estándar, y el preset de subir de rango decía `momento` mientras el CSS duraba `medium`', ahora: '`emphasized`, la que la F1 creó para eso, y el preset dice lo que hace el CSS.' },
  { que: 'Lo que aparece en su sitio llegaba como si viniera de lejos', antes: 'Hojas, avisos, mensajes de error, estados vacíos y el contenido de un desplegable con la estándar (las capas de la F6 ya usaban `entrance`)', ahora: '`entrance`: llega deprisa y se posa. Los presets de hoja y de aviso, también.' },
  { que: 'El chevron giraba con otra curva que su desplegable', antes: 'La estándar', ahora: '`smooth`, la de lo que va y vuelve.' },
]);

export const REVISADO_Y_BIEN_F14 = Object.freeze([
  { que: 'Las duraciones (apartado 19)', porque: 'Diez tokens separados al menos 40 ms (120, 160, 220, 280, 340, 420 y los tres de momento, firma y latido): ninguno es un 190 junto a un 195. La F1 ya acercó los sueltos al más próximo.' },
  { que: 'Los retrasos (apartado 20)', porque: 'Solo los del escalonado (`--motion-retraso-*`, un paso de 60 ms) y la línea de tiempo de la F11: ni un `delay` suelto en el CSS ni en las vistas (`DEUDA_F0` a cero).' },
  { que: 'Los muelles (apartados 10-14)', porque: `Una jerarquía de seis papeles (F8) y los que se usan (${MUELLES_EN_USO.join(', ')}) no rebotan; \`bouncy\` no lo usa nadie.` },
  { que: 'La cascada (apartados 21 y 22)', porque: `Seis escalones como mucho; una lista que cambia entera se funde (F10).` },
  { que: 'Lo importante primero (apartados 23 y 24)', porque: 'La cabecera de un área entra antes que sus tarjetas (Fase N2) y ninguna información espera más de seis escalones.' },
  { que: 'La profundidad y la curva (apartado 28)', porque: 'Lo de delante (la caja de una hoja) responde con `entrance`; lo de detrás (el velo), con la estándar y sin prisa (F6).' },
  { que: 'La escala (apartado 32)', porque: 'Una superficie entra desde 0,95-0,98 y crece hasta 1,03 como mucho (`TOPES_ESCALA`): ni un 1,05 de anuncio.' },
  { que: 'La anticipación (apartado 15)', porque: 'Un botón ya encoge al pulsarlo antes de hacer nada (la escalera de `ui.jsx`, F3): no se añade otra anticipación artificial.' },
  { que: 'El desenfoque (apartado 30)', porque: 'Fijo, nunca animado (F13): no hay un desenfoque que haga lenta una entrada.' },
]);

export const NO_EN_F14 = Object.freeze([
  { que: 'Parallax (apartado 29)', porque: 'No hay ni uno, y la F0 lo dejó escrito: mueve el fondo contra el contenido, que es lo que marea, y no explica nada en una aplicación de datos.' },
  { que: 'Tooltips (apartado 36)', porque: 'No existen: sin puntero que se pose en el iPhone (F2), lo que explica algo está escrito en la pantalla.' },
  { que: 'Un muelle por cada cosa (apartado 12)', porque: 'Los toques van por tiempo (F8): un fundido, una pestaña o un aviso con un muelle serían un rebote donde no hay dedo.' },
  { que: 'Tokens nuevos (apartado 51)', porque: 'Ninguno hacía falta: todo lo de esta fase son ids de los de la F1. Si un día falta uno, se crea con nombre en `motion.js` y en `index.css` a la vez.' },
  { que: 'Typecheck y lint (apartado 54)', porque: 'El proyecto no tiene ni uno ni otro (C-48): lo que vigila es esta auditoría y `verificar.sh`.' },
]);

/** Los papeles de la jerarquía de muelles de la F8, para el documento (apartado 11). */
export const MUELLES_DEL_LENGUAJE = JERARQUIA_MUELLES;
export const NIVELES_DEL_LENGUAJE = NIVELES_MOTION;
export const CURVAS_DEL_LENGUAJE = CURVAS_MOTION;
