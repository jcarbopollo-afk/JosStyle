/* ===========================================================================
   ENTREGA 4 · FASE 15/45 — LOS COMPONENTES DE RANGOS

   *"Preparar componentes simples si son necesarios: RankBadge, RankLabel,
   RankStatus, RankProgress. Deben ser reutilizables posteriormente."*

   🚨 **Un solo hexágono para toda la aplicación** (apartado 27: *"No hardcodear
   el diseño en cada pantalla"*). La insignia de la F1 (`InsigniaRango`, en
   Fitness) ya dibuja con éste: dos hexágonos distintos acabarían con dos
   estilos de rango distintos.

   ⚠️ Ninguno calcula: reciben el rango ya resuelto por `src/lib/rangos.js`.
   =========================================================================== */

import React from 'react';
import { Lock } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { SIN_RANGO, nivelRango } from '../lib/fitness';

const TAMANOS = { sm: 32, md: 44, lg: 72, xl: 112 };
export const HEXAGONO = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';

/**
 * La insignia hexagonal (apartado 27): `rank` (orden 1-10 o null), `size`,
 * `state` (actual | conseguido | bloqueado | no_disponible), `locked` y
 * `selected`. ⚠️ El candado va además del color, nunca en su lugar.
 */
export function RankBadge({ rank = null, size = 'md', state = null, locked = false, selected = false, accent, etiqueta = null }) {
  const px = typeof size === 'number' ? size : (TAMANOS[size] || TAMANOS.md);
  const estado = locked ? 'bloqueado' : (state || (rank ? 'actual' : 'no_disponible'));
  const actual = estado === 'actual';
  const conseguido = estado === 'conseguido';
  const nivel = rank ? nivelRango(rank) : null;
  const nombre = etiqueta || (nivel ? `Rango ${nivel.nombre}` : SIN_RANGO.nombre);
  return (
    <div
      role="img"
      aria-label={`${nombre}${estado === 'bloqueado' ? ', bloqueado' : estado === 'conseguido' ? ', conseguido' : ''}`}
      className="flex items-center justify-center shrink-0"
      style={{
        width: px,
        height: px,
        clipPath: HEXAGONO,
        background: actual ? accent : conseguido ? hexToRgba(accent, 0.35) : hexToRgba(COLORS.border, estado === 'bloqueado' ? 0.45 : 0.3),
        color: actual ? COLORS.textOnAccent : conseguido ? COLORS.text : COLORS.textMuted,
        outline: selected ? `2px solid ${accent}` : 'none',
        outlineOffset: 2,
        filter: selected ? `drop-shadow(0 0 0 ${accent})` : 'none',
      }}
    >
      {estado === 'bloqueado'
        ? <Lock size={Math.max(12, Math.round(px * 0.32))} aria-hidden="true" />
        : <span className="font-extrabold" style={{ fontSize: Math.round(px * (rank ? 0.36 : 0.3)) }}>{rank || '–'}</span>}
    </div>
  );
}

/** El nombre del rango, o «Sin Rango». */
export function RankLabel({ rank = null, className = 'text-sm font-bold' }) {
  const n = rank ? nivelRango(rank) : null;
  return <span className={className} style={{ color: n ? COLORS.text : COLORS.textMuted }}>{n ? n.nombre : SIN_RANGO.nombre}</span>;
}

/** Provisional, y con cuánta información (apartados 11 y 12). ⚠️ Con palabra. */
export function RankStatus({ resultado }) {
  if (!resultado || resultado.sinRango) {
    return <span className="text-[11px]" style={{ color: COLORS.textMuted }}>{SIN_RANGO.que}</span>;
  }
  return (
    <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
      {resultado.provisional ? 'Clasificación provisional' : 'Clasificación estable'}
      {resultado.confianzaNombre ? ` · ${resultado.confianzaNombre}` : ''}
    </span>
  );
}

/** Cuánto falta para el siguiente rango. ⚠️ Sin rango, nada: una barra a 0 diría
 *  que va mal cuando lo que pasa es que no hay datos. */
export function RankProgress({ siguiente, accent }) {
  if (!siguiente) return null;
  if (!siguiente.siguiente) {
    return <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Rango más alto de la escala</p>;
  }
  const n = nivelRango(siguiente.siguiente);
  const pct = Math.round(siguiente.fraccion * 100);
  return (
    <div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: hexToRgba(COLORS.border, 0.6) }} role="img" aria-label={`Camino hacia ${n.nombre}: ${pct} %`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>Hacia {n.nombre}</p>
    </div>
  );
}
