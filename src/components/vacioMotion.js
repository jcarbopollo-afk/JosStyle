import { useEffect, useLayoutEffect, useRef } from 'react';
import { vacioTrasContenido } from '../lib/estadosAsincronos';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F16 — EL VACÍO QUE LLEGA DESPUÉS DEL CONTENIDO (apartado 23)

   *"content → empty: animar la desaparición y después introducir el estado
   vacío."* Un estado vacío lleva `vacio-entra` (F4). Si se monta CON su
   pantalla —ella está entrando—, entra con ella, como siempre. Si se monta
   después —se ha borrado lo último—, espera a que la fila que se va termine de
   salir (`vacio-tras-salida`, un retraso de `fast` en `index.css`): primero se
   va lo de antes, después llega el vacío.

   Se decide en un efecto de diseño, antes de pintar: se mira si la pantalla
   que lo contiene (`[data-navegacion]`, F2) tiene su entrada en marcha.
   ⚠️ Solo lee: no anima nada ni guarda nada (F11).
   =========================================================================== */
const useEfectoDeDiseno = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* Lo que lo contiene está ENTRANDO si algún antepasado, hasta la pantalla incluida, tiene una
   animación en marcha: la de la pantalla (F2), la de una pestaña de dentro (`contenido-cambia`) o la
   de una hoja que se abre. Entonces el vacío es parte de esa entrada, no de un borrado. */
const enMarcha = (el) => typeof el.getAnimations === 'function'
  && el.getAnimations().some((a) => a.playState === 'running' || a.playState === 'pending');
function pantallaEntrando(el) {
  const pantalla = el && typeof el.closest === 'function' ? el.closest('[data-navegacion]') : null;
  if (!pantalla) return { dentro: false, entrando: false };
  for (let n = el.parentElement; n; n = n.parentElement) {
    if (enMarcha(n)) return { dentro: true, entrando: true };
    if (n === pantalla) break;
  }
  return { dentro: true, entrando: false };
}

/** Pone `vacio-tras-salida` en el elemento si su estado vacío llega después del contenido. */
export function useVacioQueLlega(ref) {
  const decidido = useRef(false);
  useEfectoDeDiseno(() => {
    if (decidido.current) return;
    decidido.current = true;
    const el = ref.current;
    if (!el || !el.classList) return;
    const { dentro, entrando } = pantallaEntrando(el);
    if (vacioTrasContenido({ pantallaEntrando: entrando, dentroDePantalla: dentro })) el.classList.add('vacio-tras-salida');
  }, []);
}
