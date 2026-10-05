/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F5 — FÍSICA, GESTOS, TOUCH Y COMPORTAMIENTO TÁCTIL

   *"El usuario debe sentir: «Estoy manipulando el elemento». No: «Estoy
   esperando a que termine una animación»."* (apartado 2). Y la condición de
   siempre: *"No convertir Jos Style en una demo de física"*.

   Esta librería es el motor de los gestos (apartado 38: *"no crear una solución
   aislada, integrarla dentro del Motion Engine"*), sin tocar el DOM:

     · **los umbrales** —arranque, eje, velocidades, distancias, resistencia—
       como tokens, una sola vez (apartado 10: *"no hardcodear arbitrariamente en
       múltiples componentes"*). El de cambiar de ejercicio (FIT F9) vive aquí y
       `entrenamientoUx.js` lo toma de aquí;
     · **el eje** de un gesto (apartados 12-13): no se decide hasta que el dedo
       se ha movido de verdad, y entonces se bloquea;
     · **la velocidad** del dedo (apartado 9), de sus últimas muestras;
     · **la resistencia** más allá de un límite (apartados 15-16, el «rubber
       band» de iOS);
     · **qué pasa al soltar** (apartado 11): distancia + velocidad + dirección,
       nunca solo la distancia;
     · **la vuelta con muelle y la salida con inercia** (apartados 14 y 17), con
       los muelles de la F1 (`SPRINGS_MOTION`).
   Las piezas que lo aplican viven en `src/components/gestosMotion.jsx`.
   =========================================================================== */
import { SPRINGS_MOTION, muestrearSpring, duracionMs, contextoMotion } from './motion';
import { UMBRALES_GESTO } from './umbralesGesto';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LOS UMBRALES (apartado 10)
   ─────────────────────────────────────────────────────────────────────────── */
/* Viven en una hoja del árbol de imports (`umbralesGesto.js`, sin dependencias): así un motor de
   Fitness puede tomar el de cambiar de ejercicio sin traerse el motor de movimiento, que es capa
   visual (FIT F44). Se reexportan con `export { }`, nunca `export … from` (EH F17). */
export { UMBRALES_GESTO };

/* ───────────────────────────────────────────────────────────────────────────
   2 · EL EJE (apartados 12 y 13)

   `null` mientras no se sepa; `'x'` o `'y'` en cuanto el dedo se haya movido
   `arranque` píxeles en un eje claramente más que en el otro; `'libre'` si es
   una diagonal, que no es de nadie (y se deja al scroll).
   ─────────────────────────────────────────────────────────────────────────── */
export function ejeDeGesto(dx, dy, { arranque = UMBRALES_GESTO.arranque, proporcion = UMBRALES_GESTO.proporcionEje } = {}) {
  const ax = Math.abs(Number(dx) || 0);
  const ay = Math.abs(Number(dy) || 0);
  if (Math.max(ax, ay) < arranque) return null;
  if (ax >= ay * proporcion) return 'x';
  if (ay >= ax * proporcion) return 'y';
  return 'libre';
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LA VELOCIDAD (apartado 9)

   De las muestras `{ t, x, y }` de los últimos `ventanaVelocidadMs`: la
   diferencia entre la primera y la última de esa ventana. En px/ms, con tope.
   ─────────────────────────────────────────────────────────────────────────── */
export function velocidadDeMuestras(muestras = [], { ventana = UMBRALES_GESTO.ventanaVelocidadMs, tope = UMBRALES_GESTO.velocidadMaxima } = {}) {
  const lista = (Array.isArray(muestras) ? muestras : []).filter((m) => m && Number.isFinite(m.t));
  if (lista.length < 2) return { vx: 0, vy: 0 };
  const ultima = lista[lista.length - 1];
  const dentro = lista.filter((m) => ultima.t - m.t <= ventana);
  const primera = dentro.length >= 2 ? dentro[0] : lista[lista.length - 2];
  const dt = ultima.t - primera.t;
  if (dt <= 0) return { vx: 0, vy: 0 };
  const limitar = (v) => Math.max(-tope, Math.min(tope, v));
  return { vx: limitar(((ultima.x || 0) - (primera.x || 0)) / dt), vy: limitar(((ultima.y || 0) - (primera.y || 0)) / dt) };
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · LA RESISTENCIA (apartados 15 y 16)

   Más allá de un límite, lo que se arrastra no sigue al dedo linealmente: cada
   píxel cuesta más, y nunca llega a `tamaño`. Es la fórmula de iOS:
   `(1 − 1 / (exceso · k / tamaño + 1)) · tamaño`. Solo donde aporta: el borde
   de una hoja y los extremos de una lista que no tiene más.
   ─────────────────────────────────────────────────────────────────────────── */
export function resistencia(exceso, tamano, k = UMBRALES_GESTO.resistencia) {
  const e = Math.max(0, Number(exceso) || 0);
  const d = Math.max(1, Number(tamano) || 1);
  return (1 - 1 / ((e * k) / d + 1)) * d;
}

/** Lo que se mueve de verdad cuando el dedo lleva `desplazamiento` y solo `[min, max]` es libre. */
export function conResistencia(desplazamiento, { min = 0, max = Infinity, tamano = 400 } = {}) {
  const v = Number(desplazamiento) || 0;
  if (v > max) return max + resistencia(v - max, tamano);
  if (v < min) return min - resistencia(min - v, tamano);
  return v;
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · AL SOLTAR (apartados 9, 11 y 17)

   `sentido` es hacia dónde se cierra (+1: hacia abajo o a la derecha). Cierra si
   ha recorrido más de `distanciaCierre` del tamaño Y no vuelve hacia atrás
   deprisa, o si se ha lanzado hacia fuera a `velocidadCierre` aunque haya
   recorrido poco. Lo demás vuelve: arrastrar despacio y soltar es «me lo he
   pensado».
   ─────────────────────────────────────────────────────────────────────────── */
export function decidirSoltar({ desplazamiento = 0, velocidad = 0, tamano = 400, sentido = 1 } = {}, u = UMBRALES_GESTO) {
  const d = (Number(desplazamiento) || 0) * sentido;
  const v = (Number(velocidad) || 0) * sentido;
  if (d <= 0) return 'volver';
  if (v >= u.velocidadCierre) return 'cerrar';
  if (d >= tamano * u.distanciaCierre && v > -u.velocidadMinima) return 'cerrar';
  return 'volver';
}

/**
 * Pasar de ejercicio deslizando (FIT F9, ahora con velocidad): `'siguiente'` (hacia
 * la izquierda), `'anterior'` o `null`. Hace falta recorrer `distanciaCambio`, o
 * lanzarlo a `velocidadCierre` con al menos el doble del arranque; y la velocidad
 * no puede ir en contra del recorrido.
 */
export function decidirCambio({ dx = 0, vx = 0 } = {}, u = UMBRALES_GESTO) {
  const x = Number(dx) || 0;
  const v = Number(vx) || 0;
  const lanzado = Math.abs(v) >= u.velocidadCierre && Math.abs(x) >= u.arranque * 2 && Math.sign(v) === Math.sign(x);
  const recorrido = Math.abs(x) >= u.distanciaCambio && !(Math.sign(v) === -Math.sign(x) && Math.abs(v) >= u.velocidadMinima);
  if (!lanzado && !recorrido) return null;
  return x < 0 ? 'siguiente' : 'anterior';
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · LA VUELTA Y LA SALIDA (apartados 4, 14 y 17)

   Volver: con el muelle `responsive` (ζ ≈ 0,95: llega sin rebotar), desde donde
   esté y con la velocidad que llevaba el dedo, así que un cambio de dirección
   no reinicia nada (apartado 19). Salir: sigue la inercia —cuanto más rápido el
   lanzamiento, más corta la salida—, entre `fast` y `normal`.
   En Reducido no hay muelle ni inercia: vuelve o sale en su sitio, al momento
   (C-52); el dedo, mientras arrastra, sí lo mueve, porque eso es manipular, no
   animar.
   ─────────────────────────────────────────────────────────────────────────── */
export function vueltaConMuelle({ desde = 0, velocidad = 0, ctx = contextoMotion() } = {}) {
  if (ctx.apagado || ctx.reducido || !desde) return { valores: [desde, 0], duracionMs: 0 };
  /* El muelle va en unidades de «desde → 0»; la velocidad del dedo (px/ms) pasa a px/s. */
  const m = muestrearSpring('responsive', { desde, hasta: 0, velocidad: velocidad * 1000, reposo: { distancia: UMBRALES_GESTO.reposoPx, velocidad: UMBRALES_GESTO.reposoVelocidad } });
  return { valores: m.valores, duracionMs: Math.round(m.duracionMs * ctx.factorTiempo) };
}

export function salidaConInercia({ desde = 0, hasta = 400, velocidad = 0, ctx = contextoMotion() } = {}) {
  if (ctx.apagado || ctx.reducido) return { duracionMs: 0 };
  const restante = Math.abs(hasta - desde);
  const v = Math.max(Math.abs(Number(velocidad) || 0), UMBRALES_GESTO.velocidadCierre);
  const minimo = duracionMs('fast', ctx);
  const maximo = duracionMs('normal', ctx);
  return { duracionMs: Math.round(Math.max(minimo, Math.min(maximo, restante / v))) };
}

/* Qué muelle para qué masa (apartados 5 y 6): ninguno es global. */
export const MUELLE_POR_MASA = Object.freeze({
  boton: 'responsive',
  tarjeta: 'normal',
  hoja: 'responsive',
  pantalla: 'soft',
  arrastrable: 'heavy',
});
export const muelleDe = (masa) => SPRINGS_MOTION[MUELLE_POR_MASA[masa]] || SPRINGS_MOTION.normal;

/* ───────────────────────────────────────────────────────────────────────────
   7 · LA AUDITORÍA DE LOS GESTOS REALES (apartado 1)
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F5 = [
  { gesto: 'Toque', hay: 'En toda la aplicación.', queda: 'Responde al contacto, no al soltar (MS F3: `ultrafast` al pulsar, vuelta con la curva que se posa).' },
  { gesto: 'Deslizar en horizontal', hay: 'La tarjeta del ejercicio en el entrenamiento en vivo (FIT F9): pasar al siguiente o al anterior.', queda: 'Ahora sigue al dedo, con resistencia en el primero y en el último, decide con distancia Y velocidad, vuelve con muelle si no llega y el ejercicio nuevo entra por el lado hacia el que se deslizó.' },
  { gesto: 'Arrastrar para cerrar (hojas)', hay: 'Ninguna hoja se arrastraba: se cerraban con su botón, tocando fuera o con Escape (FIT F39, F42).', queda: 'Las once que salen por abajo —las cuatro de Fitness, el ＋ de Hoy, la Agenda y el Calendario, las tres del Armario y el editor de color y de temas— se arrastran por su asa (`AsaHoja`): siguen al dedo, resisten hacia arriba, se cierran si se lanzan o pasan del 35 % y vuelven con muelle si no. El asa ya no promete nada falso.' },
  { gesto: 'Arrastrar (sin cerrar)', hay: 'El divisor del comparador de fotos y su zoom (FIT F27), y el selector de color de Ajustes.', queda: 'El zoom se desplaza por diferencias, así que no salta al agarrarlo (apartado 8). El divisor y el color ponen el valor bajo el dedo: ahí el dedo agarra el valor, no un asa, y es lo que se espera de ellos.' },
  { gesto: 'Sliders', hay: 'Cuatro `input type="range"` nativos.', queda: 'El navegador los lleva al dedo sin retraso (apartado 29).' },
  { gesto: 'Scroll', hay: 'La página entera (SC F1), con la cabecera fija de los hubs que se funde (SF2).', queda: 'Sin parallax ni nada que se mueva solo; la cabecera usa un escuchador pasivo y `transform`/`opacity` (apartado 23).' },
  { gesto: 'Mantener pulsado y menús contextuales', hay: 'Ninguno, a propósito (EH F50 y F61: ninguna acción depende de un gesto).', queda: 'Se queda así.' },
  { gesto: 'Reordenar', hay: 'Con flechas, que funcionan con VoiceOver (EH F50).', queda: 'Sin arrastre: cuando lo haya, es la F8 (la física al soltar) con `MUELLE_POR_MASA.arrastrable`.' },
  { gesto: 'Pellizcar', hay: 'Bloqueado por el `maximum-scale=1` del viewport (C-32, de Josué).', queda: 'El zoom de las fotos va por botones (FIT F27).' },
  { gesto: 'Tirar para recargar', hay: 'No existe: los datos se cargan al abrir.', queda: 'No se añade: no hay nada que recargar (F16).' },
  { gesto: 'Deslizar para volver', hay: 'No existe: JosStyle navega con una pila de React y solo pinta la pantalla de arriba (C-53).', queda: 'C-56: que la pantalla siguiera al dedo dejaría ver un hueco detrás. Es arquitectura de navegación, no un gesto.' },
];

export const NO_EN_F5 = [
  { que: 'Deslizar desde el borde para volver, con la pantalla siguiendo al dedo (apartado 18)', porque: 'La pantalla de antes no está pintada (F2: un contenedor por pantalla); habría que mantenerla montada detrás. C-56, con la C-53.' },
  { que: 'Reordenar arrastrando (apartados 28 y 31)', porque: 'Hoy se reordena con flechas (EH F50). La física de soltar y apartarse es la F8.' },
  { que: 'Mantener pulsado (apartados 26 y 27)', porque: 'Ninguna acción de JosStyle depende de un gesto (EH F50, F61): siempre hay un botón visible.' },
  { que: 'El asa en las hojas de Imagen personal', porque: 'El módulo está congelado a funciones nuevas (EH F65): solo correcciones. Sus hojas se siguen cerrando con su botón, tocando fuera o con Escape.' },
  { que: 'Arrastrar una confirmación o una ventana centrada', porque: 'Una decisión no se tira con un gesto perdido: se contesta con sus botones. El asa es solo para las hojas que salen por abajo.' },
  { que: 'La transición de foco de un campo (apartado 30)', porque: 'Cambiar cómo se ve un campo en el iPhone es la C-32, de Josué; el foco de teclado de los controles ya se ve (F3).' },
];
