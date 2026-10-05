/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F2 — LO QUE PASA EN LA PÁGINA AL NAVEGAR

   `src/lib/transicionNavegacion.js` decide qué clase de navegación es (entrar,
   volver, cambiar de sección o quedarse); esto la ejecuta en el navegador,
   **antes de pintar** (`useLayoutEffect`), para que no se vea ni un fotograma
   de la pantalla nueva en el sitio equivocado:

     · **El scroll** (apartado 13): se apunta por pantalla de la pila mientras
       se está en ella, y al llegar se lleva la página arriba (entrar, cambiar
       de sección) o donde estaba (volver). 🐛 Hasta la F2 no se tocaba nunca:
       abrir un módulo con Inicio bajado lo dejaba a media altura, y volver
       dejaba Inicio arriba del todo.
     · **Lo que no se repite al volver** (apartado 6): las entradas de
       `ENTRADAS_QUE_NO_SE_REPITEN` que la pantalla acaba de empezar se terminan
       en el acto con la Web Animations API (`finish()`). Solo en ese momento:
       lo que entre después anima como siempre.
     · **El foco** (apartado 20, teclado): si al navegar se ha perdido —la
       tarjeta que se tocó ya no existe—, pasa a la pantalla nueva sin moverla
       (`preventScroll`). Si sigue en la barra de abajo, se queda ahí.

   ⚠️ Lo apuntado vive en un `ref` de la sesión, nunca en `app_data` (NAVO F1,
   EH F40). Y hay **un solo** escuchador de scroll para toda la navegación
   (apartado 23: nada que se acumule al navegar deprisa).
   =========================================================================== */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { destinoDeScroll, podarMemoriaDeScroll, esEntradaQueNoSeRepite } from '../lib/transicionNavegacion';

/* En el servidor (el banco de renderizado) `useLayoutEffect` avisa por consola
   y no hace nada; ahí da igual cuál corra, porque no hay página. */
const useEfectoAntesDePintar = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const leerScroll = () => {
  try { return window.scrollY || window.pageYOffset || 0; } catch { return 0; }
};
const irA = (y) => {
  try { window.scrollTo(0, y); } catch { /* en un entorno sin página, nada */ }
};

/**
 * Termina las entradas de montaje de un contenedor (las de la lista de la F2).
 * Devuelve cuántas ha terminado, para poder comprobarlo.
 */
export function terminarEntradas(contenedor) {
  if (!contenedor || typeof contenedor.getAnimations !== 'function') return 0;
  let n = 0;
  try {
    contenedor.getAnimations({ subtree: true }).forEach((a) => {
      if (esEntradaQueNoSeRepite(a.animationName)) {
        try { a.finish(); n += 1; } catch { /* una animación ya terminada no se puede terminar otra vez */ }
      }
    });
  } catch { /* un navegador sin `subtree`: la pantalla entra como antes, que no rompe nada */ }
  return n;
}

/**
 * `ref`: el contenedor de la pantalla. `clave`: la ruta de la pila hasta ella
 * (`claveDeScroll`). `tipo`: lo que devolvió `tipoDeNavegacion` para llegar.
 */
export function useNavegacionEnLaPagina(ref, { clave, tipo }) {
  const memoria = useRef(new Map());
  const claveActual = useRef(clave);

  useEffect(() => {
    const apuntar = () => { memoria.current.set(claveActual.current, leerScroll()); };
    window.addEventListener('scroll', apuntar, { passive: true });
    return () => window.removeEventListener('scroll', apuntar);
  }, []);

  useEfectoAntesDePintar(() => {
    if (claveActual.current === clave) return;
    /* Lo de la pantalla que se deja ya está apuntado por el escuchador: aquí no
       se vuelve a leer, porque el contenido nuevo ya está en la página y el
       navegador puede haber recortado el scroll al cambiar la altura. */
    claveActual.current = clave;
    const destino = destinoDeScroll(tipo, memoria.current, clave);
    podarMemoriaDeScroll(memoria.current, clave);
    if (destino !== null) {
      irA(destino);
      memoria.current.set(clave, destino);
      /* Si la pantalla todavía no mide lo bastante (algo que se pinta en el
         siguiente fotograma), se intenta una vez más. */
      if (destino > 0 && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          if (claveActual.current === clave && Math.abs(leerScroll() - destino) > 1) irA(destino);
        });
      }
    }
    if (tipo === 'volver') terminarEntradas(ref.current);
    try {
      const activo = document.activeElement;
      const perdido = !activo || activo === document.body || !activo.isConnected;
      if (perdido && ref.current && typeof ref.current.focus === 'function') ref.current.focus({ preventScroll: true });
    } catch { /* el foco nunca tumba la navegación */ }
  }, [clave]);
}
