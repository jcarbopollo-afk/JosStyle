/* ============================================================================
   💧 LA JARRA DE AGUA (P2, 2026-10-18)

   Una jarra transparente que se llena con lo que ha bebido hoy frente a su
   objetivo. La lógica es `src/lib/aguaNutricion.js`; esto solo la dibuja.

   · El agua sube y baja con `jarra-nivel` (index.css): un `scaleY` desde el
     fondo, en `medium` con la curva de JosStyle —el ritmo de las barras de
     progreso (MS F14)—. Se escala el agua, no la jarra: el recorte es el cuerpo
     de la jarra, así que nada se deforma. En Reducido y sin movimiento, el nivel
     cambia sin animarse.
   · Lo que se lee (litros, objetivo, porcentaje) va en texto al lado, y la
     jarra entera lleva su `aria-label`: el dibujo nunca es lo único que lo dice.
   · Pasarse del objetivo la deja llena, con la marca de capacidad, y la cifra
     real (112 %) se ve igual: no se esconde lo que bebió.
   =========================================================================== */
import React, { useEffect, useId, useState } from 'react';
import { Check } from 'lucide-react';
import { COLORS, CAPAS } from '../tokens';
import { LatidoAlMarcar } from './motion';
import { hexToRgba, todayISO } from '../lib/helpers';
import { textoDeLitros } from '../lib/aguaNutricion';

/* El cuerpo de la jarra (sin el asa), en un lienzo de 100 × 140. */
const CUERPO = 'M18 14 H78 L80 22 Q84 70 82 118 Q81 130 70 132 H28 Q17 130 16 118 Q14 70 18 22 Z';
const ASA = 'M80 34 Q98 36 97 62 Q96 86 81 90';
const ARRIBA = 22;
const ABAJO = 132;

/**
 * @param progreso  lo que devuelve `progresoAgua`
 * @param accent    el acento (el agua va en el azul de `info`, el borde en neutro)
 */
export function JarraDeAgua({ progreso, className = '' }) {
  const id = useId().replace(/:/g, '');
  const p = progreso || { ml: 0, objetivo: null, porcentaje: null, relleno: 0, alcanzado: false };
  const relleno = Math.max(0, Math.min(1, Number(p.relleno) || 0));
  const etiqueta = p.objetivo
    ? `Jarra de agua: ${textoDeLitros(p.ml)} de ${textoDeLitros(p.objetivo)}, ${p.porcentaje} %${p.alcanzado ? ', objetivo cumplido' : ''}`
    : `Jarra de agua: ${textoDeLitros(p.ml)}`;
  const agua = COLORS.info;
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: 92 }}>
      <svg viewBox="0 0 100 140" width="92" height="129" role="img" aria-label={etiqueta}>
        <defs>
          <clipPath id={`jarra-${id}`}><path d={CUERPO} /></clipPath>
          <linearGradient id={`agua-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hexToRgba(agua, 0.75)} />
            <stop offset="100%" stopColor={hexToRgba(agua, 0.95)} />
          </linearGradient>
        </defs>
        {/* El cristal: un velo muy suave dentro y el contorno. */}
        <path d={CUERPO} fill={hexToRgba(COLORS.text, 0.04)} />
        <g clipPath={`url(#jarra-${id})`}>
          <rect
            className="jarra-nivel" data-relleno={relleno.toFixed(3)}
            x="0" y={ARRIBA} width="100" height={ABAJO - ARRIBA}
            fill={`url(#agua-${id})`}
            style={{ transform: `scaleY(${relleno})` }}
          />
        </g>
        {/* La marca de capacidad: hasta aquí es el objetivo. */}
        <line x1="24" x2="74" y1={ARRIBA + 4} y2={ARRIBA + 4} stroke={hexToRgba(COLORS.text, p.alcanzado ? 0.5 : 0.22)} strokeWidth="1.2" strokeDasharray="3 3" />
        <path d={CUERPO} fill="none" stroke={hexToRgba(COLORS.text, 0.42)} strokeWidth="2.2" strokeLinejoin="round" />
        <path d={ASA} fill="none" stroke={hexToRgba(COLORS.text, 0.42)} strokeWidth="2.2" strokeLinecap="round" />
        {/* Un reflejo del cristal, quieto. */}
        <path d="M26 30 Q23 70 25 112" fill="none" stroke={hexToRgba(CAPAS.sobreFoto, 0.28)} strokeWidth="3" strokeLinecap="round" />
      </svg>
      {/* El ✓ de «objetivo cumplido» late al conseguirlo, nunca al abrir (MS F18). */}
      <span className="absolute -top-1 -right-1" aria-hidden="true">
        <LatidoAlMarcar activo={!!p.alcanzado} latido="tarea">
          {p.alcanzado ? (
            <span className="rounded-full flex items-center justify-center" style={{ width: 22, height: 22, background: COLORS.positive, color: COLORS.textOnAccent }}>
              <Check size={13} strokeWidth={3} />
            </span>
          ) : null}
        </LatidoAlMarcar>
      </span>
    </div>
  );
}

/** El día de hoy, que cambia a medianoche y al volver a la aplicación (un iPhone que
 *  se queda abierto de un día para otro no puede seguir enseñando el agua de ayer). */
export function useHoyISO() {
  const [hoy, setHoy] = useState(() => todayISO());
  useEffect(() => {
    let reloj = null;
    const comprobar = () => setHoy((h) => (h === todayISO() ? h : todayISO()));
    const programar = () => {
      const ahora = new Date();
      const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 5);
      reloj = setTimeout(() => { comprobar(); programar(); }, Math.max(1000, manana - ahora));
    };
    programar();
    const alVolver = () => { if (document.visibilityState === 'visible') comprobar(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => { clearTimeout(reloj); document.removeEventListener('visibilitychange', alVolver); };
  }, []);
  return hoy;
}
