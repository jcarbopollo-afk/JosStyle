/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 5/8 — LAS PIEZAS DE LA PROGRESIÓN
   ═══════════════════════════════════════════════════════════════════════════

   Solo dibujan. Lo que se propone lo decide `progresion.js` (los modos, el
   interruptor por línea y la regla de cálculo); aquí no se calcula nada.

   - `SelectorProgresion`: el modo, global (PD-13), en Tu Plan.
   - `InterruptorProgresion`: el «Progresión» de una línea, en el editor de la
     plantilla. Discreto: una fila con su interruptor (`PistaInterruptor`, MS F3).
   - `LineaPropuesta`: una frase corta encima de la tabla de series cuando hay
     propuesta. Nunca un panel de estadísticas (prompt 5 §14).
   ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react';
import { ArrowUp } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, PistaInterruptor } from './ui';
import { OpcionSegmentada } from './piezasFitness';
import { MODOS_PROGRESION, TEXTOS_PROGRESION } from '../lib/progresion';

export function SelectorProgresion({ modo = 'manual', accent, onCambiar }) {
  const actual = MODOS_PROGRESION.find((m) => m.id === modo) || MODOS_PROGRESION[0];
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>Progresión</p>
      <div className="flex gap-1.5 mt-2 flex-wrap" role="group" aria-label="Modo de progresión">
        {MODOS_PROGRESION.map((m) => (
          <OpcionSegmentada
            key={m.id}
            activa={m.id === actual.id}
            accent={accent}
            label={`Progresión: ${m.nombre}`}
            onClick={() => onCambiar && m.id !== actual.id && onCambiar(m.id)}
          >
            {m.nombre}
          </OpcionSegmentada>
        ))}
      </div>
      <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{actual.que}</p>
    </Card>
  );
}

export function InterruptorProgresion({ activa = true, accent, onCambiar }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!activa}
      aria-label="Progresión de este ejercicio"
      onClick={() => onCambiar && onCambiar(!activa)}
      className="w-full flex items-center justify-between gap-3 py-2 toque-44"
    >
      <span className="text-left min-w-0">
        <span className="block text-sm font-semibold" style={{ color: COLORS.text }}>Progresión</span>
        <span className="block text-xs" style={{ color: COLORS.textMuted }}>
          {activa ? 'Se te propondrá una mejora en este ejercicio.' : 'Sin propuestas en este ejercicio.'}
        </span>
      </span>
      <PistaInterruptor encendido={!!activa} accent={accent} />
    </button>
  );
}

/** La frase de la propuesta de un ejercicio, a partir de lo que se guardó al
 *  empezar (`plan.propuesta` de sus series): sin volver a calcular nada. */
export function LineaPropuesta({ filas = [] }) {
  const conPropuesta = filas.filter((f) => f && f.plan && f.plan.propuesta);
  if (!conPropuesta.length) return null;
  const sube = conPropuesta.some((f) => f.plan.propuesta.mejora);
  const color = COLORS.positive;
  return (
    <p
      className="text-xs mb-2 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1.5"
      style={{ color: COLORS.text, background: hexToRgba(color, 0.12) }}
    >
      {sube && <ArrowUp size={13} aria-hidden="true" style={{ color }} />}
      <span>{sube ? 'Propuesta de mejora en verde. Es solo una guía: tú decides.' : 'En verde, lo de la última vez como referencia.'}</span>
    </p>
  );
}

/** Lo que dice una serie hecha frente a su propuesta, en una palabra. */
export function MarcaProgreso({ supera = false }) {
  if (!supera) return null;
  return (
    <p className="text-[10px] font-bold leading-none mt-0.5" style={{ color: COLORS.positive }}>
      {TEXTOS_PROGRESION.conseguido}
    </p>
  );
}
