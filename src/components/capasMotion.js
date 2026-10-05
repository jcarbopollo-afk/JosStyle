import { useEffect } from 'react';
import { contextoDelDocumento } from '../lib/motion';
import {
  tipoDeCapa, animacionDeCapa, salidaPosible, ENTRADAS_CSS_DE_CAPA,
} from '../lib/profundidad';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F6 — LAS CAPAS SE MUEVEN SOLAS (apartados 8-11 y 40)

   Toda ventana, hoja, pantalla por encima o visor de JosStyle es un portal
   sobre el `body` (regla 3). Así que un solo vigilante sobre los hijos del
   `body` les da a TODAS su entrada y su salida, sin que ninguna escriba la
   suya: *"NINGÚN NUEVO COMPONENTE FLOTANTE puede crear su propia lógica
   arbitraria de profundidad"*. Qué movimiento le toca a cada una lo decide
   `profundidad.js` con el estilo ya calculado (`tipoDeCapa`).

   · ENTRADA: al añadirse, antes de pintarse (un `MutationObserver` corre antes
     del siguiente fotograma), el velo se funde y la caja hace lo suyo. Las que
     ya traen su entrada en CSS (Fitness, Calendario) la conservan.
   · SALIDA: React ya ha quitado la capa cuando nos enteramos, así que se pone
     una COPIA en su mismo sitio —inerte, fuera de VoiceOver, sin `role` y sin
     que reciba toques— y la copia se va. Al acabar, se quita. Lo que se haya
     desplazado dentro se copia también, para que no salte arriba.
   ⚠️ Solo los hijos directos del `body` que cubren la pantalla (`inset: 0`):
   ni la raíz de la aplicación, ni un aviso pequeño, ni nada de dentro.
   =========================================================================== */

const MARCA_SALIENDO = 'capaSaliendo';
const SCROLL = new WeakMap();

const esCapa = (n) => {
  if (!n || n.nodeType !== 1 || n.id === 'root' || (n.dataset && n.dataset[MARCA_SALIENDO] !== undefined)) return false;
  try {
    const cs = getComputedStyle(n);
    return cs.position === 'fixed' && cs.top === '0px' && cs.left === '0px' && cs.right === '0px' && cs.bottom === '0px';
  } catch { return false; }
};

const traeSuEntrada = (n) => {
  const tiene = (el) => !!el && !!el.classList && ENTRADAS_CSS_DE_CAPA.some((c) => el.classList.contains(c));
  return tiene(n) || [...(n.children || [])].some(tiene);
};

const lanzar = (el, anim, id) => {
  if (!el || !anim || typeof el.animate !== 'function') return null;
  try { return el.animate(anim.keyframes, { ...anim.opciones, id }); } catch { return null; }
};

function entrar(n) {
  const cs = getComputedStyle(n);
  const tipo = tipoDeCapa({ alignItems: cs.alignItems, overflowY: cs.overflowY, fondo: cs.backgroundColor });
  /* El tipo se apunta SIEMPRE: al quitarla ya no se puede calcular (fuera del documento no hay estilo),
     y es lo que dice cómo sale. Las que traen su entrada en CSS la conservan, pero salen igual. */
  n.dataset.capa = tipo;
  if (traeSuEntrada(n)) return;
  const caja = n.firstElementChild;
  const anim = animacionDeCapa(tipo, 'entrar', { ctx: contextoDelDocumento(), alto: caja ? caja.getBoundingClientRect().height : 0, fondo: cs.backgroundColor });
  if (!anim) return;
  lanzar(n, anim.velo, 'capa-velo');
  lanzar(caja, anim.caja, 'capa-entra');
  lanzar(n, anim.raiz, 'capa-entra');
}

/* La copia de lo que se acaba de quitar, colocada donde estaba. */
function salir(n, siguiente, anterior, padre) {
  const ctx = contextoDelDocumento();
  if (ctx.apagado || !padre || !padre.isConnected) return;
  const caja = n.firstElementChild;
  const modo = salidaPosible({
    nodos: n.getElementsByTagName('*').length,
    conVideo: !!n.querySelector('video, canvas'),
    arrastrada: !!(caja && caja.dataset && caja.dataset.arrastre === 'cerrando'),
  });
  if (modo === 'ninguna') return;
  const tipo = n.dataset.capa || 'modal';
  const fondo = n.style.backgroundColor || '';
  const copia = n.cloneNode(true);
  copia.removeAttribute('role');
  copia.removeAttribute('aria-modal');
  copia.removeAttribute('aria-label');
  copia.removeAttribute('id');
  copia.setAttribute('aria-hidden', 'true');
  copia.inert = true;
  copia.dataset[MARCA_SALIENDO] = '';
  copia.style.pointerEvents = 'none';
  copia.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
  /* Los valores escritos en los campos no viajan con `cloneNode`. */
  const origen = n.querySelectorAll('input, textarea, select');
  copia.querySelectorAll('input, textarea, select').forEach((e, i) => { try { e.value = origen[i].value; } catch { /* un campo de archivo no deja */ } });
  if (siguiente && siguiente.parentNode === padre) padre.insertBefore(copia, siguiente);
  else if (anterior && anterior.parentNode === padre) padre.insertBefore(copia, anterior.nextSibling);
  else padre.appendChild(copia);
  /* El scroll de dentro, en su sitio. */
  const a = [n, ...n.querySelectorAll('*')];
  const b = [copia, ...copia.querySelectorAll('*')];
  a.forEach((e, i) => { const y = SCROLL.get(e); if (y && b[i]) b[i].scrollTop = y; });
  const fondoReal = fondo || getComputedStyle(copia).backgroundColor;
  const anim = animacionDeCapa(tipo, 'salir', { ctx, alto: copia.firstElementChild ? copia.firstElementChild.getBoundingClientRect().height : 0, fondo: fondoReal });
  if (!anim) { copia.remove(); return; }
  const animaciones = [lanzar(copia, anim.velo, 'capa-velo')];
  if (modo === 'completa') {
    animaciones.push(lanzar(copia.firstElementChild, anim.caja, 'capa-sale'));
    animaciones.push(lanzar(copia, anim.raiz, 'capa-sale'));
  }
  const vivas = animaciones.filter(Boolean);
  if (!vivas.length) { copia.remove(); return; }
  const quitar = () => copia.remove();
  Promise.all(vivas.map((x) => x.finished)).then(quitar, quitar);
  /* Por si una animación no llega a terminar (una pestaña en segundo plano). */
  setTimeout(quitar, anim.duracionMs + 400);
}

/** Se monta UNA vez, en App.jsx, antes de cualquier `return` (regla 4). */
export function useCapasMotion() {
  useEffect(() => {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return undefined;
    const alDesplazar = (ev) => {
      const t = ev.target;
      if (t && t.nodeType === 1) SCROLL.set(t, t.scrollTop);
    };
    document.addEventListener('scroll', alDesplazar, { capture: true, passive: true });
    const vigia = new MutationObserver((cambios) => {
      for (const c of cambios) {
        c.addedNodes.forEach((n) => { if (esCapa(n)) entrar(n); });
        c.removedNodes.forEach((n) => {
          if (n.nodeType === 1 && n.dataset && n.dataset.capa !== undefined && n.dataset[MARCA_SALIENDO] === undefined) salir(n, c.nextSibling, c.previousSibling, c.target);
        });
      }
    });
    vigia.observe(document.body, { childList: true });
    return () => {
      vigia.disconnect();
      document.removeEventListener('scroll', alDesplazar, { capture: true });
    };
  }, []);
}
