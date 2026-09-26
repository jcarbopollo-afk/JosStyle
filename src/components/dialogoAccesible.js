/* ══════════════════════════════════════════════════════════════════════════
   FIT F39 — un diálogo que se puede usar con el teclado (apartados 36-38)
   ══════════════════════════════════════════════════════════════════════════

   *"Al abrir un modal: focus dentro del modal · Escape cierra cuando
   corresponda · focus vuelve al elemento que lo abrió. No permitir navegar
   accidentalmente por el contenido detrás."*

   Las ocho hojas de Fitness eran un `createPortal` con un velo: se cerraban
   tocando fuera, y ya está. Con un teclado, el foco se quedaba DETRÁS —el
   tabulador recorría la pantalla tapada— y solo una de las ocho (la de
   sustituir, F33) cerraba con Escape. Esto es lo que les faltaba, en un sitio:
   quien abre una hoja llama al hook y pone el `ref` en la caja.

   ⚠️ **Varios abiertos a la vez** (una explicación de rango sobre su historial):
   solo el de ARRIBA escucha el teclado. Si no, un Escape los cerraría todos. */
import { useEffect, useRef } from 'react';

const ENFOCABLES = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/* La pila de diálogos abiertos: el último es el que manda. Es de la página y
   vive mientras están montados, nunca se guarda (EH F40). */
const pila = [];

const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));

export function enfocablesDe(caja) {
  if (!caja || typeof caja.querySelectorAll !== 'function') return [];
  return Array.from(caja.querySelectorAll(ENFOCABLES)).filter(visible);
}

/**
 * `abierto`: si el diálogo está a la vista. `onCerrar`: lo que hace Escape
 * (sin él, Escape no hace nada: hay avisos que no se cierran sin decidir).
 * Devuelve el `ref` para la caja del diálogo, que lleva `tabIndex={-1}`.
 */
export function useDialogoAccesible(abierto, onCerrar) {
  const ref = useRef(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    if (!abierto || typeof document === 'undefined') return undefined;
    const token = {};
    pila.push(token);
    const antes = document.activeElement;
    /* El foco va a la CAJA, no al primer botón: así el lector de pantalla lee
       el diálogo desde arriba, y un Intro pulsado sin querer no acepta nada. */
    const caja = ref.current;
    if (caja && !caja.contains(document.activeElement)) {
      try { caja.focus({ preventScroll: true }); } catch { /* sin foco, nada */ }
    }

    const alPulsar = (ev) => {
      if (pila[pila.length - 1] !== token) return;
      const c = ref.current;
      if (ev.key === 'Escape') {
        if (cerrar.current) { ev.preventDefault(); ev.stopPropagation(); cerrar.current(); }
        return;
      }
      if (ev.key !== 'Tab' || !c) return;
      const els = enfocablesDe(c);
      const activo = document.activeElement;
      if (!els.length) { ev.preventDefault(); c.focus(); return; }
      const primero = els[0];
      const ultimo = els[els.length - 1];
      const fuera = !c.contains(activo);
      if (ev.shiftKey && (fuera || activo === primero || activo === c)) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && (fuera || activo === ultimo)) { ev.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', alPulsar);

    return () => {
      document.removeEventListener('keydown', alPulsar);
      const i = pila.indexOf(token);
      if (i >= 0) pila.splice(i, 1);
      /* Y el foco vuelve a quien lo abrió, si sigue en la página. */
      if (antes && typeof antes.focus === 'function' && document.contains(antes)) {
        try { antes.focus({ preventScroll: true }); } catch { /* ya no se puede */ }
      }
    };
  }, [abierto]);

  return ref;
}
