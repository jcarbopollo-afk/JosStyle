/* ===========================================================================
   ENTREGA 4 · FIT F42 — LAS PIEZAS QUE SE REPETÍAN (apartados 38, 42 y 64)
   ===========================================================================

   *"Buscar componentes que hagan lo mismo con nombres diferentes… Si comparten
   estructura: crear una base reutilizable cuando sea razonable."* Tres piezas
   estaban escritas varias veces, cada vez un poco distinta:

     · **El botón de cerrar de una hoja**, de dos formas (redondo sobre
       `surface2`, y sin fondo, más grande y en gris).
     · **La pastilla de un filtro**, SIETE veces: cuatro funciones `Pastilla`
       idénticas o casi (constructor, plantillas, planes y sustitución), la de la
       biblioteca, la del historial y la de la contribución a un músculo — con
       tres radios, dos tamaños de letra y dos maneras de marcar la elegida.
     · **La opción de un selector de periodo o de métrica** —7 días, 30 días…—,
       de tres formas en cinco pantallas.

   Ninguna cambia lo que hace: son el mismo botón con el mismo `aria-pressed`,
   ahora dibujado igual en todas partes. ⚠️ Y ninguna es de `ui.jsx`: `ToggleTab`
   y compañía los usan diez vistas fuera de Fitness, y cambiarlos desde aquí
   cambiaría toda la aplicación (GE F1).
   =========================================================================== */

import React from 'react';
import { X, Check } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { CERRAR_HOJA } from '../lib/acabadoFitness';

/* ── El botón de cerrar de una hoja (apartados 38 y 39) ───────────────────────
   ⚠️ El nombre accesible lo pone quien lo usa («Cerrar el historial»): dos hojas
   abiertas a la vez —el historial encima de la explicación de un rango— no
   pueden tener dos botones llamados igual (E3 F30). */
export function BotonCerrarHoja({ onClick, etiqueta = 'Cerrar' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className={CERRAR_HOJA.clase}
      style={{ background: COLORS.surface2 }}
    >
      <X size={CERRAR_HOJA.icono} style={{ color: COLORS.text }} aria-hidden="true" />
    </button>
  );
}

/* ── La pastilla de un filtro (apartado 42) ───────────────────────────────────
   *"Mismo tamaño, mismo radio, mismo padding, estado activo claro."* La elegida
   va rellena con el acento **y con ✓**: el estado no se distingue solo por el
   color (F10 y F33 ya lo hacían así, y la F39 lo pide). Con su recuento al lado,
   y apagada si dejaría la pantalla vacía —salvo que esté puesta: un filtro
   puesto se tiene que poder quitar— (F2, apartado 23). */
export function PastillaFiltro({ activa = false, cuantos = null, accent, onClick, label, children }) {
  const apagada = cuantos === 0 && !activa;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={apagada}
      aria-pressed={activa}
      aria-label={label}
      /* ⚠️ Sin `inline-flex`: con él, el texto de cada pieza se lee en su propia
         línea (`innerText`), y el nombre y el recuento dejarían de ir juntos. */
      className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 toque-44 active:scale-[0.97]"
      style={{
        background: activa ? accent : hexToRgba(COLORS.border, 0.5),
        color: activa ? COLORS.textOnAccent : COLORS.textMuted,
        opacity: apagada ? 0.4 : 1,
      }}
    >
      {activa && <Check size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />}
      {children}
      {/* Con un espacio de verdad, no solo un margen: así se lee «Fotos 3» y no
          «Fotos3», con VoiceOver y en el texto de la página. */}
      {cuantos !== null && <>{' '}<span className="ml-1 opacity-70">{cuantos}</span></>}
    </button>
  );
}

/* ── Una opción de un selector de periodo o de métrica (apartados 19 y 42) ────
   Es una elección entre pocas —«7 días · 30 días · 3 meses»—, no un filtro que se
   suma a otros: por eso es rectangular y del mismo alto en toda Fitness. */
export function OpcionSegmentada({ activa = false, accent, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      aria-label={label}
      className="h-9 px-3 rounded-xl text-xs font-semibold shrink-0 toque-44 active:scale-95"
      style={{
        background: activa ? accent : hexToRgba(COLORS.border, 0.45),
        color: activa ? COLORS.textOnAccent : COLORS.text,
      }}
    >
      {children}
    </button>
  );
}
