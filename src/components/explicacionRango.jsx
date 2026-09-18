/* ===========================================================================
   ENTREGA 4 · FASE 20/45 — «¿POR QUÉ TENGO ESTE RANGO?», EL COMPONENTE

   *"Desde cualquier rango —global, muscular o de ejercicio— debe poder abrirse
   una explicación compacta. Debe reutilizar el mismo componente."*

   Así que hay **uno solo** (`RankExplanation`), y los tres sitios le pasan lo
   que `src/lib/explicacionRangos.js` ya ha redactado.

   🚨 **No calcula nada** (apartado 3) y **no promete nada** (apartado 9): dice
   qué sostiene el rango y qué hay que mejorar, nunca «te faltan 5 kg» ni
   «llegarás a Élite en 20 días».
   =========================================================================== */

import React from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Info } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { PrimaryButton, GhostBtn } from './ui';
import { RankBadge, RankLabel } from './rangos';

/* ── El botón que la abre, igual en los tres sitios ──────────────────────── */
export function BotonPorQue({ onAbrir, etiqueta = 'Por qué este rango' }) {
  if (!onAbrir) return null;
  return (
    <button
      onClick={onAbrir}
      aria-label={etiqueta}
      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full toque-44"
      style={{ background: COLORS.surface2, color: COLORS.textMuted }}
    >
      <Info size={12} aria-hidden="true" />
      ¿Por qué?
    </button>
  );
}

function Barra({ fraccion, accent, etiqueta }) {
  const pct = Math.max(0, Math.min(100, Math.round((Number(fraccion) || 0) * 100)));
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: hexToRgba(COLORS.border, 0.6) }}
      role="img"
      aria-label={`${etiqueta}: ${pct} %`}
    >
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

/* ── 14 · La confianza, con su frase ─────────────────────────────────────── */
export function RankConfidence({ texto: t }) {
  if (!t) return null;
  return (
    <div>
      <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{t.titulo}</p>
      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{t.que}</p>
    </div>
  );
}

/* ── 15 · La cobertura ───────────────────────────────────────────────────── */
export function RankCoverage({ cobertura, accent }) {
  if (!cobertura) return null;
  return (
    <div>
      <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{cobertura.texto}</p>
      <div className="mt-1.5">
        <Barra fraccion={cobertura.fraccion} accent={accent} etiqueta="Cobertura de datos" />
      </div>
      <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
        Mide cuánta información hay detrás, no tu forma física.
      </p>
    </div>
  );
}

/* ── 1, 5 y 6 · En qué se basa ───────────────────────────────────────────── */
export function RankEvidence({ evidencias = [], relevantes = [] }) {
  if (!evidencias.length && !relevantes.length) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>En qué se basa</p>
      <div className="mt-1.5 space-y-1">
        {evidencias.map((e) => (
          <div key={e.etiqueta} className="flex items-baseline justify-between gap-3">
            <span className="text-xs" style={{ color: COLORS.textMuted }}>{e.etiqueta}</span>
            <span className="text-xs font-semibold text-right" style={{ color: COLORS.text }}>{e.valor}</span>
          </div>
        ))}
      </div>
      {relevantes.length > 0 && (
        <div className="mt-2 pt-2 space-y-1" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {relevantes.map((r) => (
            <div key={r.nombre} className="flex items-baseline justify-between gap-3">
              <span className="text-xs truncate" style={{ color: COLORS.text }}>{r.nombre}</span>
              <span className="text-[11px] shrink-0" style={{ color: COLORS.textMuted }}>
                {r.simbolo} {r.ultima || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 9 · Qué falta, dicho con prudencia ──────────────────────────────────── */
export function RankNextStep({ paso, siguiente, accent, onEntrenar, onClasificar }) {
  if (!paso) return null;
  const accion = paso.accion === 'entrenar' ? onEntrenar : (paso.accion === 'clasificar' ? onClasificar : null);
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Qué te acerca al siguiente</p>
      <p className="text-sm mt-1" style={{ color: COLORS.text }}>{paso.texto}</p>
      {accion && (
        <div className="mt-2">
          <GhostBtn onClick={accion}>{paso.accion === 'entrenar' ? 'Entrenar ahora' : 'Clasificar ejercicios'}</GhostBtn>
        </div>
      )}
      {siguiente && !siguiente.siguiente && (
        <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>Rango máximo de la escala.</p>
      )}
    </div>
  );
}

/* ── 16 · El camino de rangos ────────────────────────────────────────────── */
export function RankPath({ camino = [], accent }) {
  if (!camino.length) return null;
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" role="img" aria-label="Escala de rangos, con el tuyo marcado">
      {camino.map((n) => (
        <span
          key={n.orden}
          className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
          style={{
            background: n.estado === 'actual' ? hexToRgba(accent, 0.18) : COLORS.surface2,
            color: n.estado === 'pendiente' ? COLORS.textMuted : COLORS.text,
            border: `1px solid ${n.estado === 'actual' ? accent : 'transparent'}`,
          }}
        >
          {n.nombre}
        </span>
      ))}
    </div>
  );
}

/* ── La explicación entera ───────────────────────────────────────────────── */
/* 🚨 Va con `createPortal` (regla 3 del proyecto), como todas las hojas. */
export function RankExplanation({ explicacion, accent, onCerrar, onEntrenar = null, onClasificar = null, onProgreso = null }) {
  if (!explicacion || typeof document === 'undefined') return null;
  const e = explicacion;
  const nivelSiguiente = e.siguiente && e.siguiente.siguiente ? e.siguiente : null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={`Por qué tu rango en ${e.titulo}`}
    >
      {/* ⚠️ Con scroll interno y tope de altura: en un iPhone pequeño, con
          textos largos, la hoja se quedaba cortada por abajo (apartado 28). */}
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 overflow-y-auto"
        style={{
          background: COLORS.surface,
          maxHeight: '85vh',
          paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)',
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* 23 · Rango actual → descripción → progreso → por qué → datos → acciones */}
        <div className="flex items-start gap-3">
          <RankBadge
            rank={e.sinRango ? null : e.rango}
            size="lg"
            state={e.sinRango ? 'no_disponible' : 'actual'}
            locked={e.sinRango}
            accent={accent}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{e.titulo}</p>
            <p className="text-xl font-extrabold leading-tight" style={{ color: e.sinRango ? COLORS.text : accent, fontFamily: "'Manrope', sans-serif" }}>
              {e.nombre}
            </p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{e.descripcion}</p>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-full shrink-0 toque-44" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={16} style={{ color: COLORS.text }} />
          </button>
        </div>

        {/* 11, 12 y 13 · De dónde sale */}
        {e.fuenteTexto && (
          <div className="rounded-2xl p-3" style={{ background: COLORS.surface2 }}>
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Basado en: {e.fuenteTexto.titulo}</p>
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{e.fuenteTexto.que}</p>
          </div>
        )}

        {/* 20 · Dónde está dentro de su rango, y 8 · el camino al siguiente */}
        {e.dentro && (
          <div>
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{e.dentro.texto}</p>
            <div className="mt-1.5">
              <Barra fraccion={e.dentro.fraccion} accent={accent} etiqueta="Dentro de tu rango actual" />
            </div>
            {nivelSiguiente && (
              <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                Siguiente: <RankLabel rank={nivelSiguiente.siguiente} className="text-[10px] font-bold" />
              </p>
            )}
          </div>
        )}

        {/* 17, 18 y 19 · Comparación con antes, solo si la hay */}
        {e.comparacion && (
          <div className="rounded-2xl p-3" style={{ background: COLORS.surface2 }}>
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{e.comparacion.texto}</p>
            {e.comparacion.cambio !== 'estable' && (
              <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
                {e.comparacion.antes} → {e.comparacion.ahora}
              </p>
            )}
          </div>
        )}

        <RankEvidence evidencias={e.evidencias} relevantes={e.relevantes || []} />
        <RankCoverage cobertura={e.cobertura} accent={accent} />
        <RankConfidence texto={e.confianzaTexto} />
        <RankPath camino={e.camino} accent={accent} />
        <RankNextStep
          paso={e.paso}
          siguiente={e.siguiente}
          accent={accent}
          onEntrenar={onEntrenar}
          onClasificar={onClasificar}
        />

        {/* 21 · Y a donde se puede ir desde aquí, sin rutas nuevas */}
        {onProgreso && e.acciones && e.acciones.progreso && (
          <PrimaryButton onClick={onProgreso} accent={accent} icon={ChevronRight}>Ver su progreso</PrimaryButton>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default RankExplanation;
