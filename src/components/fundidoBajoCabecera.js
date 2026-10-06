/* ══════════════════════════════════════════════════════════════════════════
   v3.129.1 — la cabecera de los hubs, transparente "como un cristal"
   ══════════════════════════════════════════════════════════════════════════

   Josué, con un vídeo de su iPhone (2026-10-04): la cabecera de Bienestar,
   Vida y Gestión era un rectángulo borroso —el color de la barra de abajo con
   `blur(20px)` sobre su foto de fondo—, y la quería *"transparente totalmente,
   como un cristal"*, como Inicio y Ajustes.

   Esa banda estaba para algo (SC F1): que las tarjetas que suben al desplazar
   pasaran POR DETRÁS del título y no se leyeran encima de él. Sin fondo, eso lo
   hace este hook: cada tarjeta lleva una máscara que la recorta justo en el
   borde de abajo de la cabecera, con una rampa corta por encima del borde
   (`mascaraBajoCabecera`, en `src/lib/scrollCabecera.js`, que es donde se
   prueba en Node). Arriba solo queda el fondo, y la cabecera se sigue quedando
   quieta, que es lo que pidió la SC F1.

   ⚠️ **En reposo no hace nada**: con el contenido entero en la pantalla —en su
   iPhone, los tres hubs caben— ninguna tarjeta llega al borde y ninguna lleva
   máscara. Solo trabaja mientras algo pasa por debajo.
   ⚠️ **Escribe en el estilo del nodo, no en el estado de React**: es un efecto
   de cada fotograma del desplazamiento, y pasarlo por React repintaría el hub
   entero a cada píxel (FIT F40: el tic repinta el número, no la pantalla). React
   no gestiona `maskImage` en esas tarjetas, así que no lo pisa al repintar.
   ⚠️ **Y no guarda nada** (EH F40): es disposición de pantalla. */
import { useEffect } from 'react';
import { mascaraBajoCabecera } from '../lib/scrollCabecera';

const ponerMascara = (el, m) => {
  const valor = m || '';
  if (el.style.maskImage === valor && el.style.webkitMaskImage === valor) return;
  el.style.maskImage = valor;
  el.style.webkitMaskImage = valor;
};

/**
 * `cabeceraRef`: la banda pegada (`.hub-sticky`). `listaRef`: el contenedor de las tarjetas
 * (`.hub-card`). `clave`: lo que cambia qué tarjetas hay, para volver a medir al cambiar de área.
 */
export function useFundidoBajoCabecera(cabeceraRef, listaRef, clave) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      const cab = cabeceraRef.current;
      const lista = listaRef.current;
      if (!cab || !lista) return;
      /* 🐛 MS F13 (apartados 6 y 7) — PRIMERO SE LEE TODO, LUEGO SE ESCRIBE. Leía una tarjeta,
         le escribía la máscara y leía la siguiente: cada lectura después de una escritura obliga al
         navegador a recalcular el estilo en el acto, uno por tarjeta en cada fotograma de scroll. */
      const borde = cab.getBoundingClientRect().bottom;
      const tarjetas = [...lista.querySelectorAll('.hub-card')];
      const bordes = tarjetas.map((el) => borde - el.getBoundingClientRect().top);
      tarjetas.forEach((el, i) => ponerMascara(el, mascaraBajoCabecera(bordes[i])));
    };
    const pedir = () => {
      if (!pendiente) pendiente = window.requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    return () => {
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
      if (pendiente) window.cancelAnimationFrame(pendiente);
      const lista = listaRef.current;
      if (lista) lista.querySelectorAll('.hub-card').forEach((el) => ponerMascara(el, null));
    };
  }, [cabeceraRef, listaRef, clave]);
}
