import { useEffect } from 'react';
import { cambioDeDiseno } from '../lib/layoutMotion';
import { asentarMovimiento } from '../lib/orquestadorMotion';
import { tecladoAbierto } from '../lib/responsiveMotion';
import { reevaluarCapas } from './capasMotion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F15 — EL CONTEXTO FÍSICO, ESCUCHADO UNA VEZ

   Girar el teléfono, cambiar el ancho de la ventana o abrir el teclado: UNA
   pieza lo escucha para toda la aplicación (apartado 41: *"no multiplicar
   listeners, observers, animation systems, DOM, state"*), y no toca el estado
   de React —ni un repintado por un giro (apartado 42)—:
     · si cambia el ANCHO (girar, redimensionar), lo que viaja con medidas de
       antes se asienta (`asentarMovimiento`) y cada capa abierta vuelve a decir
       cómo sale (`reevaluarCapas`). Un cambio solo de ALTO —la barra de Safari
       que aparece al desplazar— no asienta nada: pasa a cada rato;
     · si hay un campo enfocado y lo que se ve ha encogido, `data-teclado` en la
       raíz, y la barra de abajo se aparta (index.css).
   Un fotograma de por medio junta las ráfagas: redimensionar arrastrando son
   decenas de eventos y una sola lectura.
   =========================================================================== */
export function useContextoFisico() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    const raiz = document.documentElement;
    let ancho = window.innerWidth;
    let pendiente = 0;
    const revisar = () => {
      pendiente = 0;
      const ahora = window.innerWidth;
      if (cambioDeDiseno(ancho, ahora)) {
        ancho = ahora;
        asentarMovimiento('cambio_de_diseno');
        reevaluarCapas();
      }
      const vv = window.visualViewport;
      const abierto = tecladoAbierto({
        altoPagina: raiz.clientHeight,
        altoVisible: vv ? vv.height : raiz.clientHeight,
        escala: vv ? vv.scale : 1,
        enfocado: document.activeElement,
      });
      if (abierto && raiz.getAttribute('data-teclado') !== 'abierto') raiz.setAttribute('data-teclado', 'abierto');
      else if (!abierto && raiz.hasAttribute('data-teclado')) raiz.removeAttribute('data-teclado');
    };
    const pedir = () => { if (!pendiente) pendiente = requestAnimationFrame(revisar); };
    const vv = window.visualViewport;
    window.addEventListener('resize', pedir, { passive: true });
    window.addEventListener('orientationchange', pedir, { passive: true });
    if (vv) vv.addEventListener('resize', pedir, { passive: true });
    document.addEventListener('focusin', pedir, { passive: true });
    document.addEventListener('focusout', pedir, { passive: true });
    return () => {
      if (pendiente) cancelAnimationFrame(pendiente);
      window.removeEventListener('resize', pedir);
      window.removeEventListener('orientationchange', pedir);
      if (vv) vv.removeEventListener('resize', pedir);
      document.removeEventListener('focusin', pedir);
      document.removeEventListener('focusout', pedir);
      raiz.removeAttribute('data-teclado');
    };
  }, []);
}
