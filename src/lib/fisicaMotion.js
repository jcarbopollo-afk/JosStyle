/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F8 — FÍSICA, MUELLES, GESTOS E INTERACCIÓN DIRECTA

   *"No quiero una app llena de rebotes. Quiero una app que parezca responder
   físicamente al usuario."* La F5 construyó el motor de los gestos
   (`gestosMotion.js`): seguir al dedo, la velocidad, la resistencia, cerrar o
   volver. La F8 no escribe otro: le pone **el orden** que pide su enunciado.

     · La jerarquía de muelles (apartados 3-8): cuál es para qué, cuándo NO hay
       muelle (*"no todo debe ser spring"*) y que ninguno oscile.
     · La máquina de estados de un gesto (apartados 35 y 36): reposo →
       arrastrando → umbral → asentando / cerrando → reposo, y la interrupción.
     · El velo que responde al gesto (apartado 16): al bajar una hoja, lo de
       debajo recupera protagonismo.
     · Un solo dedo (apartado 34): un segundo dedo no corrompe un gesto.
     · Los puntos hápticos (apartado 22), con lo que hoy se puede y lo que no.

   Lo que toca el DOM sigue en `src/components/gestosMotion.jsx`.
   =========================================================================== */
import { SPRINGS_MOTION, amortiguacionRelativa, muestrearSpring } from './motion';
import { MUELLE_POR_MASA } from './gestosMotion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA JERARQUÍA DE MUELLES (apartados 3-7)

   *"No crear decenas de configuraciones. Mantener una jerarquía pequeña."* Los
   muelles son los de la F1 (`SPRINGS_MOTION`) y aquí se dice para qué es cada
   uno. ⚠️ El SNAPPY del enunciado —interruptores, botones, indicadores— **no es
   un muelle**: son toques, no hay dedo que soltar ni nada que vuelva, así que van
   por tiempo (`ultraFast` al pulsar y la curva que se posa al soltar, F3). Es
   justo el apartado 4: *"No reemplazar todas las transiciones por springs"*.
   ─────────────────────────────────────────────────────────────────────────── */
export const JERARQUIA_MUELLES = Object.freeze([
  { papel: 'snappy', muelle: null, usa: 'Interruptores, botones, indicadores, cambios rápidos', porque: 'Un toque no suelta nada con velocidad: va por tiempo (F3, `ultraFast` + `entrance`).' },
  { papel: 'standard', muelle: 'normal', usa: 'Tarjetas y paneles', porque: 'Hoy ninguna tarjeta se arrastra; queda para la primera que lo haga (`MUELLE_POR_MASA.tarjeta`).' },
  { papel: 'soft', muelle: 'soft', usa: 'Superficies grandes y movimientos amplios', porque: 'Una pantalla entera (`MUELLE_POR_MASA.pantalla`): más masa, menos rigidez.' },
  { papel: 'responsive', muelle: 'responsive', usa: 'Lo que va pegado al dedo: hojas, la tarjeta del ejercicio', porque: 'Es el que USA la aplicación hoy: la vuelta de una hoja y de un ejercicio (F5).' },
  { papel: 'heavy', muelle: 'heavy', usa: 'Arrastrar y soltar para reordenar', porque: 'Hoy se reordena con flechas (EH F50): está para cuando haya arrastre (`MUELLE_POR_MASA.arrastrable`).' },
  { papel: 'bouncy', muelle: 'bouncy', usa: 'Nada', porque: 'Es el único que rebota (ζ < 1): no lo usa ninguna pieza, y la que lo quiera tiene que justificar ese rebote (apartado 8).' },
]);

/** Cuánto se pasa un muelle de su destino, en fracción del recorrido (apartado 8). 0 = no se pasa. */
export function sobrepasoDe(muelle) {
  const m = muestrearSpring(muelle, { desde: 0, hasta: 1 });
  return Math.max(0, Math.round((m.pasoMaximo - 1) * 1000) / 1000);
}

/** Cuántas veces cruza el destino antes de asentarse: más de una es la oscilación que el apartado 8 prohíbe. */
export function cruces(muelle) {
  const m = muestrearSpring(muelle, { desde: 0, hasta: 1 });
  let n = 0;
  for (let i = 1; i < m.valores.length; i++) {
    if ((m.valores[i - 1] - 1) * (m.valores[i] - 1) < 0) n += 1;
  }
  return n;
}

/** Los muelles que usa de verdad la aplicación (el `MUELLE_POR_MASA` de la F5): ninguno puede rebotar. */
export const MUELLES_EN_USO = Object.freeze([...new Set(Object.values(MUELLE_POR_MASA))]);
/** Lo más que se puede pasar un muelle «sin rebote»: medio por ciento del recorrido —en la hoja más alta,
 *  dos píxeles—. Se MIDE el muelle (`sobrepasoDe`), no se decide por su amortiguación a ojo: `heavy`
 *  tiene ζ ≈ 0,9 y no se pasa ni un píxel; `bouncy`, con 0,6, se pasa un 6 %. */
export const SOBREPASO_MAXIMO = 0.005;
export const muelleSinRebote = (id) => !!SPRINGS_MOTION[id] && sobrepasoDe(id) <= SOBREPASO_MAXIMO && amortiguacionRelativa(SPRINGS_MOTION[id]) > 0.8;

/* ───────────────────────────────────────────────────────────────────────────
   2 · LA MÁQUINA DE ESTADOS DE UN GESTO (apartados 33, 35 y 36)

   Los estados son los mismos nombres que la hoja lleva escritos en
   `data-arrastre` desde la F5 —así no hay una segunda forma de decir lo mismo—
   y corresponden a los del enunciado:
     quieta (IDLE) · arrastrando (DRAGGING) · umbral (THRESHOLD: si se suelta
     ahora, se cierra) · volviendo (SETTLING hacia su sitio) · cerrando
     (SETTLING hacia fuera) · cerrada (DISMISSED).
   La interrupción —agarrarla mientras vuelve o mientras se va— es otra
   transición, no un caso raro (apartado 35: *"settling → dragging"*).
   ─────────────────────────────────────────────────────────────────────────── */
export const ESTADOS_GESTO = Object.freeze(['quieta', 'arrastrando', 'umbral', 'volviendo', 'cerrando', 'cerrada']);

const TRANSICIONES = {
  quieta: { empezar: 'arrastrando' },
  arrastrando: { pasarUmbral: 'umbral', soltarVolver: 'volviendo', soltarCerrar: 'cerrando', cancelar: 'volviendo' },
  umbral: { volverDelUmbral: 'arrastrando', soltarVolver: 'volviendo', soltarCerrar: 'cerrando', cancelar: 'volviendo' },
  volviendo: { fin: 'quieta', empezar: 'arrastrando' },
  cerrando: { fin: 'cerrada', empezar: 'arrastrando' },
  /* Si quien la abrió no la cierra (F5, apartado 37), la hoja vuelve a su sitio: la única salida de «cerrada». */
  cerrada: { recuperar: 'quieta' },
};

/** El estado siguiente; un evento que no toca en ese estado lo deja como está (nunca un estado imposible). */
export function siguienteEstadoGesto(estado, evento) {
  const t = TRANSICIONES[estado] || TRANSICIONES.quieta;
  return t[evento] || (TRANSICIONES[estado] ? estado : 'quieta');
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · EL VELO RESPONDE AL GESTO (apartados 15 y 16)

   *"Durante el gesto: sheet position + backdrop opacity + underlying content
   pueden responder conjuntamente."* Al bajar una hoja, su velo se aclara en
   proporción —lo de debajo recupera protagonismo— hasta un 60 % menos al llegar
   abajo. Si vuelve, el velo vuelve con ella; si se cierra, se apaga (F6).
   ─────────────────────────────────────────────────────────────────────────── */
export const ACLARADO_MAXIMO = 0.6;

export function veloDuranteArrastre(fondo, progreso) {
  const m = /^rgba?\(([^)]+)\)$/.exec(String(fondo || '').trim());
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean);
  const alfa = p.length >= 4 ? Number(p[3]) : 1;
  const k = Math.max(0, Math.min(1, Number(progreso) || 0));
  const nuevo = Math.round(alfa * (1 - ACLARADO_MAXIMO * k) * 1000) / 1000;
  return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${nuevo})`;
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · UN SOLO DEDO (apartado 34)

   Un gesto es de UN puntero: el que lo empezó. Mientras dura, un segundo dedo
   no empieza otro ni mueve éste, y su `pointerup` no lo termina. ⚠️ No se exige
   que el dedo sea el «principal»: con un dedo apoyado en otro sitio, el que
   agarra el asa también tiene que poder arrastrarla.
   ─────────────────────────────────────────────────────────────────────────── */
export function punteroQueCuenta(gesto, ev) {
  if (!ev) return false;
  if (!gesto) return true;
  return ev.pointerId === undefined || gesto.id === undefined || ev.pointerId === gesto.id;
}

/** Un gesto que lleva un rato sin muestras es un dedo que se levantó donde no se le oyó (sin captura):
 *  no puede bloquear el siguiente para siempre (apartado 33: *"no dejar el scroll bloqueado"*).
 *  ⚠️ Un dedo QUIETO tampoco manda muestras, así que el tiempo solo no basta: si el elemento todavía
 *  tiene capturado ese puntero (`capturado`), el dedo sigue apoyado y el gesto es suyo —un segundo dedo
 *  no se lo quita—. La captura se suelta sola al levantarlo. */
export const GESTO_ABANDONADO_MS = 600;
export function gestoAbandonado(gesto, ev, capturado = false) {
  if (!gesto) return true;
  if (capturado) return false;
  const ultima = gesto.muestras && gesto.muestras.length ? gesto.muestras[gesto.muestras.length - 1].t : null;
  const ahora = ev && Number.isFinite(ev.timeStamp) ? ev.timeStamp : null;
  return ultima !== null && ahora !== null && ahora - ultima > GESTO_ABANDONADO_MS;
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · LOS PUNTOS HÁPTICOS (apartado 22)

   *"Crear puntos de integración semánticos. No acoplar la lógica de movimiento
   directamente a una API específica."* Eso ya existe: un gesto o un control
   EMITE un evento al bus (`emitir`, SO F3) y el motor de audio decide si suena
   y si vibra —`navigator.vibrate` en Android y, en el iPhone, el toque háptico
   de un interruptor nativo de iOS 17.4+ (`vibrar`, en `audioEngine.js`)—, respetando 📳 de
   Ajustes. Ninguna pantalla vibra por su cuenta (FIT F9).
   ⚠️ De los cinco puntos, hoy se emiten los que ya sonaban; los del gesto NO, y
   está dicho por qué: cerrar una hoja con su botón o tocando fuera no suena, y
   un gesto no puede sentirse distinto que el botón que hace lo mismo; el umbral,
   además, se cruza de ida y de vuelta mientras se arrastra, y un toque en cada
   cruce sería ruido.
   ─────────────────────────────────────────────────────────────────────────── */
export const PUNTOS_HAPTICOS = Object.freeze([
  { punto: 'seleccion', cuando: 'Pasar de ejercicio deslizando', evento: null, seEmite: false, porque: '«Siguiente» y «Anterior» con el dedo no suenan; deslizar hace lo mismo.' },
  { punto: 'umbral', cuando: 'Una hoja pasa del punto en que, soltándola, se cierra', evento: null, seEmite: false, porque: 'Se cruza de ida y de vuelta mientras se arrastra: un toque en cada cruce sería ruido.' },
  { punto: 'descartar', cuando: 'Una hoja se cierra arrastrándola', evento: null, seEmite: false, porque: 'Cerrarla con su botón o tocando fuera no suena: el gesto tampoco.' },
  { punto: 'exito', cuando: 'Marcar una serie (FIT F9)', evento: 'SUCCESS', seEmite: true, porque: 'Ya sonaba, por el bus.' },
  { punto: 'fin', cuando: 'Termina un descanso (FIT F9)', evento: 'ACTION_COMPLETED', seEmite: true, porque: 'Ya sonaba, por el bus.' },
  { punto: 'anclaje', cuando: 'Una hoja que se queda en una altura intermedia', evento: null, seEmite: false, porque: 'Ninguna hoja tiene alturas intermedias (NO_EN_F8).' },
]);
export const POR_QUE_NO_VIBRA_EL_GESTO = 'Un gesto no puede sentirse distinto que el botón que hace lo mismo, y cerrar una hoja con su botón no suena ni vibra. Lo que sí vibra va por el bus de sonido (`audioEngine.js`), que respeta 📳.';

/* ───────────────────────────────────────────────────────────────────────────
   6 · LA AUDITORÍA DE LA FÍSICA ACTUAL (apartado 1) Y LO QUE NO SE HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F8 = Object.freeze([
  { que: 'Hojas que se arrastran (F5)', fisica: 'Siguen al dedo 1:1, resisten hacia arriba, se cierran por distancia o por velocidad, vuelven con `responsive`.', queda: 'Su velo responde al gesto (apartado 16), la máquina de estados las lleva (apartado 36) y un segundo dedo no las corrompe (apartado 34).' },
  { que: 'La tarjeta del ejercicio (F5)', fisica: 'Sigue al dedo en horizontal, resiste en los extremos, decide con distancia y velocidad.', queda: 'Un solo dedo (apartado 34).' },
  { que: 'Interruptores (F3)', fisica: 'Tiempo, no muelle: la bola se desliza en `normal` y se estira mientras se pulsa.', queda: 'Así: un toque no tiene velocidad que conservar (apartados 4 y 19).' },
  { que: 'Botones y tarjetas al pulsar (F3)', fisica: 'Encogen en `ultraFast` y vuelven con la curva que se posa; una tarjeta encoge menos que un botón (la escalera de EH F50).', queda: 'Así (apartados 20 y 21): sin mover el diseño, sin combinarlo todo.' },
  { que: 'Deslizadores', fisica: 'Los `input type="range"` nativos: el pulgar es del navegador, pegado al dedo.', queda: 'Así (apartado 18).' },
  { que: 'El divisor y el zoom del comparador (FIT F27)', fisica: 'Directos, sin animación mientras se arrastra.', queda: 'Así (apartado 11).' },
  { que: 'El scroll y la cabecera de las portadas (SF2)', fisica: 'Escuchador pasivo y un fotograma por cambio; las tarjetas se funden al pasar bajo la cabecera, sin compactarla.', queda: 'Así (apartados 28-30): no hay cabecera que se compacte y por eso no hay nervios con el scroll.' },
  { que: '`hover`', fisica: 'Solo con puntero de verdad (F2, `hoverOnlyWhenSupported`); hoy ninguna pantalla lo usa.', queda: 'Así (apartados 23 y 24).' },
]);

export const NO_EN_F8 = Object.freeze([
  { que: 'Puntos de anclaje de una hoja (media altura, entera) (apartado 14)', porque: 'Ninguna hoja de JosStyle tiene dos alturas: se abren a su tamaño y se cierran. Inventar una media altura sería un control que nadie ha pedido (regla 8). El día que la haya, `decidirSoltar` ya mira posición, velocidad y dirección.' },
  { que: 'Efectos magnéticos, de cursor y parallax (apartados 25-27)', porque: 'No hay ninguno, y el enunciado pide no ponerlos por moda: no mejoran nada en un iPhone.' },
  { que: 'Pellizcar (apartado 34)', porque: 'Bloqueado por el viewport (C-32, de Josué). Lo que sí se protege es el gesto de un dedo frente a un segundo dedo.' },
  { que: 'Un muelle «snappy» nuevo (apartado 3)', porque: 'Sus usos —interruptores, botones, indicadores— son toques y van por tiempo (apartado 4). Un muelle más sería una configuración sin nadie que la use (apartado 42, anti-sobreingeniería).' },
  { que: 'Vibrar al arrastrar una hoja o al pasar su umbral (apartado 22)', porque: POR_QUE_NO_VIBRA_EL_GESTO },
]);
