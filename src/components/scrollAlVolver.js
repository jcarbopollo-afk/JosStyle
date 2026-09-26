/* ══════════════════════════════════════════════════════════════════════════
   FIT F38 — volver a una lista donde estaba (apartado 32)
   ══════════════════════════════════════════════════════════════════════════

   *"Ejercicio → detalle → volver: conservar scroll cuando sea razonable.
   Especialmente en biblioteca, historial, progreso y planes."*

   En Fitness el detalle se abre DENTRO de la misma pantalla: la lista deja de
   pintarse y el detalle ocupa su sitio (un estado `abierto`, no una ruta). Así
   que al volver la lista se pinta de nuevo… con la página donde la hubiera
   dejado el detalle, que casi nunca es donde estaba. En un iPhone eso es volver
   a buscar la tarjeta que acababas de tocar entre cien.

   🚨 **Y quien hace scroll es LA PÁGINA** (SC F1: la cabecera es `sticky`, no
   un contenedor con su propio `overflow`), así que lo que se guarda y se
   devuelve es `window.scrollY`.

   ⚠️ Lo guardado es **de la pantalla**, nunca un dato (EH F40 y NAVO F1): vive
   en un `ref` mientras la vista está montada. Guardarlo en `app_data` te
   devolvería a media lista de anteayer.

   ⚠️ Y el detalle **empieza arriba**: abrirlo con la página a media lista
   dejaba su cabecera fuera de la pantalla. */
import { useEffect, useLayoutEffect, useRef } from 'react';

/* En el servidor (el banco de renderizado) `useLayoutEffect` avisa por
   consola y no hace nada; ahí da igual cuál corra, porque no hay página. */
const useEfectoAntesDePintar = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const leerScroll = () => {
  try { return window.scrollY || window.pageYOffset || 0; } catch { return 0; }
};
const irA = (y) => {
  try { window.scrollTo(0, y); } catch { /* en un entorno sin página, nada */ }
};

/* Qué está abierto, como texto: dos detalles distintos son dos claves
   distintas, aunque los dos sean «algo abierto». */
export const claveDeAbierto = (abierto) => {
  if (abierto === null || abierto === undefined || abierto === false || abierto === '') return null;
  if (typeof abierto === 'object') {
    try { return JSON.stringify(abierto); } catch { return '[abierto]'; }
  }
  return String(abierto);
};

/**
 * `abierto`: lo que tenga abierto la vista (un id, un objeto…). Mientras no
 * hay nada abierto se está viendo la lista y se apunta dónde está; al abrir
 * algo —o pasar de un detalle a otro— se empieza arriba; al cerrarlo todo, la
 * lista vuelve a donde estaba.
 */
export function useScrollAlVolver(abierto) {
  const clave = claveDeAbierto(abierto);
  const posicion = useRef(0);
  const antes = useRef(clave);
  /* 🐛 Se apunta solo mientras se ve la lista. El `scrollTo(0)` de abrir el
     detalle dispara un `scroll` que puede llegar ANTES de que se quite el
     escuchador, y apuntaría un 0 encima de la posición buena. */
  const viendoLista = useRef(clave === null);

  useEffect(() => {
    if (clave !== null) return undefined;
    const apuntar = () => { if (viendoLista.current) posicion.current = leerScroll(); };
    apuntar();
    window.addEventListener('scroll', apuntar, { passive: true });
    return () => window.removeEventListener('scroll', apuntar);
  }, [clave]);

  useEfectoAntesDePintar(() => {
    const estaba = antes.current;
    antes.current = clave;
    viendoLista.current = clave === null;
    if (clave !== null && clave !== estaba) irA(0);
    else if (estaba !== null && clave === null) irA(posicion.current);
  }, [clave]);
}
