import React, { useRef } from 'react';
import { COLORS } from '../tokens';
import { contextoDelDocumento, CURVAS_MOTION } from '../lib/motion';
import {
  ejeDeGesto, velocidadDeMuestras, conResistencia, decidirSoltar, decidirCambio,
  vueltaConMuelle, salidaConInercia,
} from '../lib/gestosMotion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F5 — LAS PIEZAS DE REACT DE LOS GESTOS

   La decisión vive en `src/lib/gestosMotion.js` (se prueba en Node); aquí solo
   está lo que necesita el DOM: seguir al dedo con `transform` (nunca con `top` ni
   con un estado de React por fotograma, apartado 35) y animar la vuelta o la
   salida con la Web Animations API.

   ⚠️ Cada gesto vive en una ZONA (apartado 13, y la lección de la FIT F9): el asa
   de una hoja lleva `touch-action: none` y el resto de la hoja se desplaza como
   siempre; la tarjeta del ejercicio lleva `pan-y`, así que el scroll vertical es
   del navegador y el horizontal, del gesto. Ningún gesto se pelea con el scroll.
   =========================================================================== */

const MAX_MUESTRAS = 12;
const muestra = (ev) => ({ t: ev.timeStamp || (typeof performance !== 'undefined' ? performance.now() : Date.now()), x: ev.clientX, y: ev.clientY });

/**
 * MS F5, apartados 14-17 — EL ASA DE UNA HOJA. Va como primer hijo de la caja de una hoja
 * que sale por abajo (`HOJA.caja`): arrastrarla mueve la hoja con el dedo (hacia arriba,
 * con resistencia), y al soltar la cierra si se ha lanzado o ha pasado del 35 % de su
 * altura, o la devuelve con muelle si no. En una pantalla ancha la hoja va centrada y no
 * hay asa (`sm:hidden`). ⚠️ Es un añadido para el dedo: el botón de cerrar, tocar fuera y
 * Escape siguen ahí (FIT F39), así que el asa no lleva ni nombre ni foco.
 */
export function AsaHoja({ cajaRef, onCerrar, className = '-mt-3 mb-1' }) {
  const gesto = useRef(null);

  const mover = (caja, y) => { caja.style.transform = y ? `translateY(${y}px)` : ''; };

  const empezar = (ev) => {
    const caja = cajaRef && cajaRef.current;
    if (!caja) return;
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch { /* sin captura, el gesto sigue mientras el dedo esté encima */ }
    /* Una vuelta que estaba en marcha se para donde está: se sigue desde ahí (apartado 19). */
    let desde = 0;
    try {
      const m = new DOMMatrix(getComputedStyle(caja).transform === 'none' ? undefined : getComputedStyle(caja).transform);
      desde = m.m42 || 0;
      /* La entrada de la capa (F6) también: si el dedo agarra la hoja mientras sube, manda el dedo. */
      (caja.getAnimations ? caja.getAnimations() : []).forEach((a) => { if (a.id === 'asa-hoja' || a.id === 'capa-entra') a.cancel(); });
    } catch { desde = 0; }
    mover(caja, desde);
    gesto.current = { y0: ev.clientY - desde, x0: ev.clientX, eje: desde ? 'y' : null, muestras: [muestra(ev)], alto: caja.getBoundingClientRect().height || 400, actual: desde };
    caja.dataset.arrastre = 'arrastrando';
  };

  const seguir = (ev) => {
    const g = gesto.current;
    const caja = cajaRef && cajaRef.current;
    if (!g || !caja) return;
    g.muestras.push(muestra(ev));
    if (g.muestras.length > MAX_MUESTRAS) g.muestras.shift();
    const dy = ev.clientY - g.y0;
    if (!g.eje) g.eje = ejeDeGesto(ev.clientX - g.x0, dy);
    if (g.eje !== 'y') return;
    /* Hacia abajo, libre; hacia arriba, con resistencia: la hoja no se despega de su borde. */
    g.actual = conResistencia(dy, { min: 0, tamano: g.alto });
    mover(caja, g.actual);
  };

  /* Edge case (apartado 37): si quien la abrió no la cierra —o tarda—, la hoja no puede
     quedarse fuera de la pantalla con la página bloqueada detrás. Pasado un momento, si
     sigue montada, vuelve a su sitio. */
  const cerrarDeVerdad = (caja) => {
    if (onCerrar) onCerrar();
    setTimeout(() => {
      if (caja.isConnected && caja.dataset.arrastre === 'cerrando') { mover(caja, 0); caja.dataset.arrastre = 'quieta'; }
    }, 150);
  };

  const soltar = (ev, cancelado = false) => {
    const g = gesto.current;
    gesto.current = null;
    const caja = cajaRef && cajaRef.current;
    if (!g || !caja) return;
    if (ev && !cancelado) {
      g.muestras.push(muestra(ev));
      /* Un lanzamiento muy rápido puede llegar sin ningún `pointermove` en medio (el navegador
         los agrupa): el eje y el recorrido se deciden también con el punto donde se suelta. */
      if (!g.eje) g.eje = ejeDeGesto(ev.clientX - g.x0, ev.clientY - g.y0);
      if (g.eje === 'y') g.actual = conResistencia(ev.clientY - g.y0, { min: 0, tamano: g.alto });
    }
    const { vy } = velocidadDeMuestras(g.muestras);
    const ctx = contextoDelDocumento();
    const resultado = cancelado ? 'volver' : decidirSoltar({ desplazamiento: g.actual, velocidad: vy, tamano: g.alto, sentido: 1 });
    if (resultado === 'cerrar') {
      caja.dataset.arrastre = 'cerrando';
      const hasta = g.alto + 24;
      const { duracionMs } = salidaConInercia({ desde: g.actual, hasta, velocidad: vy, ctx });
      if (duracionMs > 0 && typeof caja.animate === 'function') {
        mover(caja, hasta);
        const a = caja.animate([{ transform: `translateY(${g.actual}px)` }, { transform: `translateY(${hasta}px)` }],
          { duration: duracionMs, easing: CURVAS_MOTION.exit, id: 'asa-hoja' });
        a.finished.then(() => cerrarDeVerdad(caja), () => {});
      } else {
        cerrarDeVerdad(caja);
      }
      return;
    }
    caja.dataset.arrastre = 'volviendo';
    const { valores, duracionMs } = vueltaConMuelle({ desde: g.actual, velocidad: vy, ctx });
    mover(caja, 0);
    if (duracionMs > 0 && typeof caja.animate === 'function' && g.actual) {
      const a = caja.animate(valores.map((v) => ({ transform: `translateY(${v}px)` })), { duration: duracionMs, easing: 'linear', id: 'asa-hoja' });
      a.finished.then(() => { if (caja.dataset.arrastre === 'volviendo') caja.dataset.arrastre = 'quieta'; }, () => {});
    } else {
      caja.dataset.arrastre = 'quieta';
    }
  };

  return (
    <div
      aria-hidden="true"
      data-asa-hoja=""
      className={`sm:hidden ${className} h-7 flex items-center justify-center cursor-grab`}
      style={{ touchAction: 'none' }}
      onPointerDown={empezar}
      onPointerMove={seguir}
      onPointerUp={(ev) => soltar(ev)}
      onPointerCancel={(ev) => soltar(ev, true)}
    >
      <span className="block rounded-full" style={{ width: 36, height: 5, background: COLORS.border }} />
    </div>
  );
}

/**
 * MS F5, apartados 7-12 y 19 — DESLIZAR PARA PASAR DE EJERCICIO (FIT F9, ahora físico).
 * Devuelve las props de la zona del gesto. La tarjeta sigue al dedo en horizontal —con
 * resistencia donde ya no hay más—, y al soltar `decidirCambio` mira distancia Y velocidad:
 * si cambia, llama a `alCambiar('siguiente'|'anterior')`; si no, vuelve con muelle desde
 * donde esté. ⚠️ `touch-action: pan-y` lo pone quien la usa: el scroll vertical sigue siendo
 * del navegador. Un toque en un botón o un campo de dentro no empieza ningún gesto.
 */
export function useDeslizarParaCambiar(zonaRef, { hayAnterior = true, haySiguiente = true, alCambiar } = {}) {
  const gesto = useRef(null);
  const mover = (el, x) => { el.style.transform = x ? `translateX(${x}px)` : ''; };
  const onPointerDown = (ev) => {
    if (ev.target && ev.target.closest && ev.target.closest('button, input, textarea, select, a')) return;
    const el = zonaRef.current;
    if (!el) return;
    /* Apartado 19 — si la tarjeta todavía vuelve con su muelle, se para DONDE ESTÁ y el gesto nuevo
       sigue desde ahí. Sin cancelarla, la animación mandaría sobre el dedo hasta acabar. */
    let base = 0;
    try {
      const t = getComputedStyle(el).transform;
      base = t && t !== 'none' ? (new DOMMatrix(t).m41 || 0) : 0;
      (el.getAnimations ? el.getAnimations() : []).forEach((a) => { if (a.id === 'deslizar-ejercicio') a.cancel(); });
    } catch { base = 0; }
    mover(el, base);
    gesto.current = { x0: ev.clientX, y0: ev.clientY, base, eje: null, muestras: [muestra(ev)], actual: base, ancho: el.getBoundingClientRect().width || 360, id: ev.pointerId };
  };
  const onPointerMove = (ev) => {
    const g = gesto.current;
    const el = zonaRef.current;
    if (!g || !el) return;
    g.muestras.push(muestra(ev));
    if (g.muestras.length > MAX_MUESTRAS) g.muestras.shift();
    const dx = ev.clientX - g.x0;
    if (!g.eje) {
      g.eje = ejeDeGesto(dx, ev.clientY - g.y0);
      if (g.eje === 'x') { try { el.setPointerCapture(g.id); } catch { /* sin captura, el gesto sigue mientras el dedo esté encima */ } el.dataset.deslizando = 'si'; }
    }
    if (g.eje !== 'x') return;
    /* Sin anterior (o sin siguiente), ese lado resiste: no hay nada detrás. */
    g.actual = conResistencia(g.base + dx, { min: haySiguiente ? -Infinity : 0, max: hayAnterior ? Infinity : 0, tamano: g.ancho });
    mover(el, g.actual);
  };
  const terminar = (ev, cancelado) => {
    const g = gesto.current;
    gesto.current = null;
    const el = zonaRef.current;
    if (!g || !el) return;
    delete el.dataset.deslizando;
    if (ev && !cancelado) {
      g.muestras.push(muestra(ev));
      /* Lo mismo que el asa: sin ningún `pointermove` en medio, se decide con el punto final. */
      if (!g.eje) {
        g.eje = ejeDeGesto(ev.clientX - g.x0, ev.clientY - g.y0);
        if (g.eje === 'x') g.actual = conResistencia(g.base + ev.clientX - g.x0, { min: haySiguiente ? -Infinity : 0, max: hayAnterior ? Infinity : 0, tamano: g.ancho });
      }
    }
    if (g.eje !== 'x') { mover(el, 0); return; }
    const { vx } = velocidadDeMuestras(g.muestras);
    let dir = cancelado ? null : decidirCambio({ dx: g.actual, vx });
    if ((dir === 'siguiente' && !haySiguiente) || (dir === 'anterior' && !hayAnterior)) dir = null;
    if (dir) {
      mover(el, 0);
      if (alCambiar) alCambiar(dir);
      return;
    }
    const { valores, duracionMs } = vueltaConMuelle({ desde: g.actual, velocidad: vx, ctx: contextoDelDocumento() });
    mover(el, 0);
    if (duracionMs > 0 && typeof el.animate === 'function' && g.actual) {
      el.animate(valores.map((v) => ({ transform: `translateX(${v}px)` })), { duration: duracionMs, easing: 'linear', id: 'deslizar-ejercicio' });
    }
  };
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (ev) => terminar(ev, false),
    onPointerCancel: (ev) => terminar(ev, true),
  };
}

