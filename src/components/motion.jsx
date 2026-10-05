import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  contextoDelDocumento, EVENTO_MOTION, animar, siguientePresencia, estaMontado,
  deltaFlip, duracionMs, CURVAS_MOTION,
} from '../lib/motion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F1 — LAS PIEZAS DE REACT DEL MOTOR

   La lógica vive en `src/lib/motion.js` (se prueba en Node); aquí solo está lo
   que necesita React: leer el contexto y volver a pintar cuando cambia,
   montar y desmontar con su animación (`Presencia`) y el FLIP de una lista
   (`useFlip`).

   🚨 **Ningún componente nuevo escribe su propia animación** (apartado 24): usa
   una clase de `index.css`, `transicion()`/`escalonado()` o estas piezas.
   =========================================================================== */

/* En el servidor (el banco de renderizado) `useLayoutEffect` no hace nada y
   React lo avisa por consola: allí basta con `useEffect`, que tampoco corre. */
const useEfectoDeDiseno = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * El contexto de movimiento de ahora —modo, velocidad, intensidad, si está
 * reducido— y se vuelve a leer cuando él cambia un ajuste (el aviso que lanza
 * `App.jsx`) o cuando cambia el «Reducir movimiento» del sistema.
 */
export function useMotion() {
  const [ctx, setCtx] = useState(() => contextoDelDocumento());
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const leer = () => setCtx(contextoDelDocumento());
    window.addEventListener(EVENTO_MOTION, leer);
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', leer); else if (mq.addListener) mq.addListener(leer); }
    return () => {
      window.removeEventListener(EVENTO_MOTION, leer);
      if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', leer); else if (mq.removeListener) mq.removeListener(leer); }
    };
  }, []);
  return ctx;
}

/**
 * Monta y desmonta su contenido con una animación de entrada y otra de salida
 * (apartado 9), con la máquina de `siguientePresencia`:
 *   · al ocultar NO desaparece de golpe: sale, y solo entonces se desmonta;
 *   · desmontado, no ocupa espacio;
 *   · si se vuelve a mostrar a mitad de la salida, **invierte desde donde está**
 *     (apartado 12) sin desmontarse ni volver a montarse: ni parpadeo ni doble
 *     montaje.
 * Con «Sin movimiento» entra y sale al instante; en Reducido, con un fundido.
 */
export function Presencia({ visible, entrada = 'modalEnter', salida = 'modalExit', animarAlMontar = true, onSalida, className, style, children, ...resto }) {
  const [estado, setEstado] = useState(() => (visible ? (animarAlMontar ? 'entrando' : 'visible') : 'oculto'));
  const ref = useRef(null);
  const onSalidaRef = useRef(onSalida);
  onSalidaRef.current = onSalida;

  useEffect(() => {
    setEstado((e) => siguientePresencia(e, visible ? 'mostrar' : 'ocultar'));
  }, [visible]);

  useEfectoDeDiseno(() => {
    const el = ref.current;
    if (!el || (estado !== 'entrando' && estado !== 'saliendo')) return undefined;
    const a = animar(el, estado === 'entrando' ? entrada : salida);
    const terminar = () => {
      setEstado((e) => siguientePresencia(e, 'fin'));
      if (estado === 'saliendo' && onSalidaRef.current) onSalidaRef.current();
    };
    if (!a) { terminar(); return undefined; }
    let vivo = true;
    a.finished.then(() => { if (vivo) terminar(); }, () => { /* cancelada por una interrupción: la sigue la nueva */ });
    return () => { vivo = false; };
  }, [estado, entrada, salida]);

  if (!estaMontado(estado)) return null;
  return (
    <div ref={ref} className={className} style={style} data-presencia={estado} {...resto}>
      {children}
    </div>
  );
}

/* La caja de un elemento relativa a su contenedor: así un desplazamiento de la
   página entre dos pintados no se confunde con un cambio de sitio. */
function cajaRelativa(el, base) {
  const r = el.getBoundingClientRect();
  return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height };
}

/**
 * El FLIP de una lista (apartado 10): cada hijo con `data-flip-id` que cambia
 * de sitio entre dos pintados viaja desde donde estaba, en vez de saltar. Se
 * mide DESPUÉS de cada cambio y se compara con lo medido la vez anterior, así
 * que no hace falta avisar antes de cambiar nada. En Reducido no se desplaza
 * nada (aparece en su sitio) y con «Sin movimiento» tampoco.
 */
export function useFlip(contenedorRef, clave) {
  const antes = useRef(new Map());
  useEfectoDeDiseno(() => {
    const cont = contenedorRef.current;
    if (!cont || typeof cont.querySelectorAll !== 'function') return;
    const base = cont.getBoundingClientRect();
    const hijos = [...cont.querySelectorAll('[data-flip-id]')];
    const ahora = new Map(hijos.map((el) => [el.dataset.flipId, cajaRelativa(el, base)]));
    const ctx = contextoDelDocumento();
    if (antes.current.size > 0 && ctx.espacial) {
      hijos.forEach((el) => {
        const d = deltaFlip(antes.current.get(el.dataset.flipId), ahora.get(el.dataset.flipId));
        if (!d || typeof el.animate !== 'function') return;
        el.animate([{ transform: `translate(${d.dx}px, ${d.dy}px)` }, { transform: 'none' }],
          { duration: duracionMs('medium', ctx), easing: CURVAS_MOTION.standard });
      });
    }
    antes.current = ahora;
  }, [clave]);
}
