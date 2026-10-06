import React, { useLayoutEffect, useRef } from 'react';
import { contextoDelDocumento } from '../lib/motion';
import {
  registrarOrigen, tomarOrigen, planDeContenedor, planDeCompartido, planDeLlegada,
} from '../lib/continuidad';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F7 — LAS PIEZAS DE REACT DE LA CONTINUIDAD

   La decisión vive en `src/lib/continuidad.js` (se prueba en Node). Aquí solo
   está lo que necesita el DOM: medir, apuntar el origen y animar con la Web
   Animations API —antes de pintarse, en un `useLayoutEffect`, para que el
   primer fotograma ya salga del origen y no haya un destello del final—.
   =========================================================================== */

const lanzar = (el, plan, id) => {
  if (!el || !plan || typeof el.animate !== 'function') return null;
  try { return el.animate(plan.keyframes, { ...plan.opciones, id }); } catch { return null; }
};

/** El radio de las esquinas de un elemento, en px (la primera esquina basta). */
const radioDe = (el) => {
  try { return parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0; } catch { return 0; }
};

/** El tamaño de letra, en px: un texto que viaja escala por su letra, no por su caja (que cambia al partirse en líneas). */
const fuenteDe = (el) => {
  try { return parseFloat(getComputedStyle(el).fontSize) || null; } catch { return null; }
};
const scrollY = () => {
  try { return window.scrollY || window.pageYOffset || 0; } catch { return 0; }
};

/** Apunta el rectángulo de un elemento como origen de `id` (al tocarlo, antes de navegar; `efimero` si es porque se va). */
export function apuntarOrigen(id, el, opciones) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return false;
  return registrarOrigen(id, { rect: el.getBoundingClientRect(), radio: radioDe(el), fuente: fuenteDe(el), elemento: el }, undefined, opciones);
}

/**
 * MS F7, apartados 5, 20, 21 y 24 — el contenedor de una pantalla nueva CRECE DESDE el origen que dejó
 * apuntado quien la abrió. `clave` es lo que identifica la pantalla (cambia al navegar) y `id` el origen
 * que le toca. Si no hay origen, no hace nada: la pantalla entra con su clase de siempre (F2).
 */
export function useContenedorDesdeOrigen(ref, { id, clave }) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !id) return;
    const origen = tomarOrigen(id);
    if (!origen) return;
    const plan = planDeContenedor({ origen, contenedor: el.getBoundingClientRect(), ctx: contextoDelDocumento() });
    lanzar(el, plan, 'continuidad-contenedor');
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** MS F7, apartado 6 — la tarjeta de la que se salió se posa al volver. */
export function animarLlegada(el) {
  return lanzar(el, planDeLlegada(contextoDelDocumento()), 'continuidad-llegada');
}

/**
 * MS F7, apartados 3, 4, 19, 22 y 23 — UN ELEMENTO COMPARTIDO. Se pone en los dos sitios con el mismo
 * `id`: donde se toca y donde llega. Al tocarlo —o al desaparecer— apunta dónde estaba; al aparecer el
 * otro con el mismo id, sale de ahí (FLIP). No hace falta escribir nada más en cada pantalla
 * (apartado 4: *"no implementar shared elements manualmente en cada pantalla"*).
 * `forma`: `texto` e `icono` escalan igual en los dos ejes (nunca se estiran); `superficie` e `imagen`
 * interpolan también sus esquinas.
 */
export function Compartido({ id, forma = 'texto', as: Etiqueta = 'span', className, style, children, ...resto }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !id) return undefined;
    /* 🐛 Un elemento no sale de SU PROPIO origen. React (en desarrollo, `StrictMode`) monta, deshace y
       vuelve a montar cada efecto sobre el mismo nodo: la despedida de abajo apuntaba dónde estaba y la
       vuelta lo tomaba, así que los veinte nombres de una lista «viajaban» a su propio sitio. */
    const origen = tomarOrigen(`compartido:${id}`);
    if (origen && origen.elemento !== el) {
      const destino = el.getBoundingClientRect();
      const ctx = contextoDelDocumento();
      const datos = { origen, forma, radioDestino: radioDe(el), fuenteDestino: fuenteDe(el), ctx };
      const animacion = lanzar(el, planDeCompartido({ ...datos, destino }), 'compartido');
      /* 🐛 Quien pone el scroll arriba al abrir un detalle (FIT F38, `useScrollAlVolver`) es el PADRE, y
         su efecto corre después de éste: el destino se midió con la página donde estaba. El primer
         `requestAnimationFrame` corre antes de pintar nada, así que ahí se corrige el viaje con lo que
         se haya movido la página, y el primer fotograma ya sale del sitio bueno. */
      const yAntes = scrollY();
      if (animacion && typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          const d = scrollY() - yAntes;
          if (!d || !animacion.effect || typeof animacion.effect.setKeyframes !== 'function') return;
          const plan = planDeCompartido({ ...datos, destino: { top: destino.top - d, left: destino.left, width: destino.width, height: destino.height } });
          if (plan) animacion.effect.setKeyframes(plan.keyframes);
        });
      }
    }
    /* Al desaparecer (la lista se va y llega el detalle), apunta dónde estaba. React llama a esto
       ANTES de quitar el nodo, así que todavía se puede medir. Y es EFÍMERO: vale para lo que llega
       en este mismo cambio; si no, los veinte nombres de una lista viajarían al volver. */
    return () => { apuntarOrigen(`compartido:${id}`, el, { efimero: true }); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const apuntar = () => apuntarOrigen(`compartido:${id}`, ref.current);
  return (
    <Etiqueta ref={ref} data-compartido={id} className={className} style={{ display: Etiqueta === 'span' ? 'inline-block' : undefined, ...style }} onPointerDownCapture={apuntar} onClickCapture={apuntar} {...resto}>
      {children}
    </Etiqueta>
  );
}
