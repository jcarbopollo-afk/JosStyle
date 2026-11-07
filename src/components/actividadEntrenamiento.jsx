import React, { useMemo } from 'react';
import { ChevronRight, History, CalendarDays } from 'lucide-react';
import { COLORS } from '../tokens';
import { OpcionSegmentada } from './piezasFitness';
import { acentoLegible } from '../lib/acabadoFitness';
import { hexToRgba, todayISO } from '../lib/helpers';
import { Card, GhostBtn } from './ui';
import {
  resumenDeActividad,
  PERIODOS_ACTIVIDAD, PERIODO_ACTIVIDAD_POR_DEFECTO,
} from '../lib/actividadEntrenamiento';
import { CATALOGO_PLANES } from '../lib/planes';

/* ===========================================================================
   ENTREGA 4 · FASE 31/45 — LA ACTIVIDAD DE ENTRENAMIENTO

   🚨 **AQUÍ NO SE CUENTA NADA** (apartado 20: *"No calcular estos valores
   directamente dentro de componentes"*). Todo llega de `resumenDeActividad`;
   estos componentes dibujan.

   ⚠️ **Y NI UN COLOR AGRESIVO NI UN DÍA «MALO»** (apartados 6, 7 y 27): un día
   con entrenamiento lleva una marca discreta del acento, uno sin registro un
   guion apagado —nunca rojo—, y cada casilla **dice con palabras** lo que es
   (apartado 37): *«12 de septiembre — entrenamiento Push»*.
   =========================================================================== */

const titulo = { color: COLORS.textMuted };

/* ── TrainingPeriodSelector (apartado 5) ─────────────────────────────────────
   🚨 **ES EL SELECTOR DEL RESUMEN DE LA F28, sacado aquí para REUTILIZARLO**:
   mismos cuatro periodos, mismo dibujo y la misma etiqueta. Dos selectores de
   periodo en la misma pantalla dirían dos cosas a la vez. */
export function TrainingPeriodSelector({ periodos = PERIODOS_ACTIVIDAD, valor, onCambiar, accent, etiqueta = 'Periodo del resumen' }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5" role="group" aria-label={etiqueta}>
      {periodos.map((p) => {
        const activo = valor === p.id;
        return (
          <OpcionSegmentada key={p.id} activa={activo} accent={accent} onClick={() => onCambiar(p.id)}>
            {p.nombre}
          </OpcionSegmentada>
        );
      })}
    </div>
  );
}

/* 🔓 FITNESS 8/8 — EL CALENDARIO DE ACTIVIDAD SE UNIFICÓ CON EL DE CUMPLIMIENTO.
   `TrainingActivityDay` y `TrainingActivityCalendar` (la semana y el mes de la
   F31) se retiraron: Josué pidió un solo calendario, el de Historial
   (`CalendarioCumplimiento`, en `disciplinaFitness.jsx`), y ése recoge lo que
   tenían —la vista de semana, los entrenamientos registrados de cada día con sus
   nombres (también antes del seguimiento) y los días con varios para elegir—.
   El resumen de abajo lleva a él con «Ver el calendario». */

/* ── TrainingFrequencyCard (apartados 8 y 9) ───────────────────────────────
   Una frase de constancia y, solo con historial suficiente, la media. Ni un
   porcentaje. */
export function TrainingFrequencyCard({ constancia, frecuencia, accent }) {
  if (!constancia && !frecuencia) return null;
  return (
    <div className="rounded-2xl px-3 py-2.5" style={{ background: hexToRgba(COLORS.border, 0.3) }}>
      {constancia && <p className="text-sm" style={{ color: COLORS.text }}>{constancia.frase}</p>}
      {frecuencia && (
        <>
          <p className="text-sm font-bold mt-1 tabular-nums" style={{ color: acentoLegible(accent) }}>{frecuencia.texto}</p>
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{frecuencia.detalle}</p>
        </>
      )}
    </div>
  );
}

/* ── TrainingPlanAdherence (apartados 11-14 y 31) ──────────────────────────
   Dos números por separado y la estructura real del plan. ⚠️ Ni una barra: una
   barra de 3/4 se lee como un 75 %, que es la nota que el apartado 11 prohíbe.
   Los puntos cuentan sesiones, no puntúan. */
export function TrainingPlanAdherence({ plan, accent, conTitulo = true }) {
  if (!plan) return null;
  return (
    <div className="rounded-2xl px-3 py-2.5" style={{ background: hexToRgba(accent, 0.08) }}>
      {conTitulo && <p className="text-[11px] font-bold uppercase tracking-wider" style={titulo}>Esta semana · {plan.plan}</p>}
      <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color: COLORS.text }}>{plan.texto}</p>
      <div className="flex gap-1 mt-1.5" aria-hidden="true">
        {Array.from({ length: plan.planificadas }).map((_, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={i < plan.hechasDelPlan ? { background: accent } : { border: `1.5px solid ${COLORS.textMuted}` }}
          />
        ))}
      </div>
      <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>{plan.detalle}</p>
      {plan.desdeActivacion && (
        <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>Contando desde que activaste el plan.</p>
      )}
    </div>
  );
}

/* ── TrainingRecentSessionCard y TrainingRecentSessions (apartados 17 y 18) ─ */
export function TrainingRecentSessionCard({ tarjeta, accent, onVer = null }) {
  const t = tarjeta;
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{t.nombre}</p>
        <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
          {[t.etiquetaFecha, t.duracion].filter(Boolean).join(' · ')}
          {/* Apartado 15 — el indicador discreto, con su palabra. */}
          {' · '}<span style={{ color: t.parcial ? acentoLegible(accent) : COLORS.textMuted }}>{t.estado}</span>
        </p>
      </div>
      {onVer && (
        <button
          onClick={() => onVer(t.id)}
          aria-label={`Ver el entrenamiento: ${t.etiqueta}`}
          className="text-xs font-bold px-3 py-2 rounded-xl toque-44 active:scale-95 shrink-0"
          style={{ color: acentoLegible(accent), background: hexToRgba(accent, 0.1) }}
        >
          Ver
        </button>
      )}
    </div>
  );
}

export function TrainingRecentSessions({ tarjetas, accent, onVer = null, onVerHistorial = null, titulo: tituloBloque = 'Actividad reciente' }) {
  if (!tarjetas || !tarjetas.length) return null;
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={titulo}>{tituloBloque}</p>
      <div>
        {tarjetas.map((t, i) => (
          <div key={t.id} style={i ? { borderTop: `1px solid ${COLORS.border}` } : undefined}>
            <TrainingRecentSessionCard tarjeta={t} accent={accent} onVer={onVer} />
          </div>
        ))}
      </div>
      {onVerHistorial && (
        <div className="mt-2">
          <GhostBtn icon={History} onClick={onVerHistorial}>Ver historial</GhostBtn>
        </div>
      )}
    </Card>
  );
}

/* ── TrainingActivitySummary (apartados 3, 4, 6-10, 32 y 41) ───────────────
   *"Cuándo entrenó + cuánto ha entrenado + cómo se distribuye su actividad +
   cómo va su planificación"*, en ese orden y en una tarjeta. ⚠️ El periodo
   llega de fuera: en Progreso es el del resumen (F28). */
export function TrainingActivitySummary({
  fitness, periodo = PERIODO_ACTIVIDAD_POR_DEFECTO, hoy = todayISO(), planes = CATALOGO_PLANES,
  accent, onVerSesion = null, onVerHistorial = null, conRecientes = true,
}) {
  const r = useMemo(() => resumenDeActividad(fitness, { periodo, hoy, planes }), [fitness, periodo, hoy, planes]);

  if (!r.hay) {
    return (
      <Card>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={titulo}>Último entrenamiento</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{r.vacio}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        {/* 1 · Cuándo (apartado 3). */}
        <p className="text-[11px] font-bold uppercase tracking-wider" style={titulo}>Último entrenamiento</p>
        {r.ultimo ? (
          <button
            onClick={onVerSesion ? () => onVerSesion(r.ultimo.id) : undefined}
            disabled={!onVerSesion}
            aria-label={`Último entrenamiento: ${r.ultimo.etiqueta}. Ver`}
            className="w-full text-left mt-1 flex items-center gap-2 toque-44"
          >
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold leading-tight truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                {r.ultimo.etiquetaFecha} · {r.ultimo.nombre}
              </p>
              {(r.ultimo.duracion || r.ultimo.parcial) && (
                <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                  {[r.ultimo.duracion, r.ultimo.parcial ? 'Parcial' : ''].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            {onVerSesion && <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
          </button>
        ) : (
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{r.vacio}</p>
        )}

        {/* 2 · Cuánto, esta semana (apartados 4 y 10). */}
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={titulo}>Esta semana</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.text }}>{r.semana.texto}</p>
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{r.semana.anterior.texto}</p>
        </div>

        {/* 3 · Cómo va el plan (apartados 11-14), si se puede calcular. */}
        {r.plan && <div className="mt-3"><TrainingPlanAdherence plan={r.plan} accent={accent} /></div>}

        {/* 4 · Cómo se distribuye (apartados 6 y 7). 🔓 Fitness 8/8 — en el calendario
            unificado del Historial, con sus estados de cumplimiento: aquí, el acceso. */}
        {onVerHistorial && (
          <div className="mt-3">
            <button
              type="button"
              onClick={onVerHistorial}
              aria-label="Ver el calendario de cumplimiento"
              className="w-full flex items-center gap-2 text-left toque-44 rounded-xl px-3 py-2"
              style={{ background: hexToRgba(COLORS.border, 0.25) }}
            >
              <CalendarDays size={16} aria-hidden="true" style={{ color: acentoLegible(accent) }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold" style={{ color: COLORS.text }}>Ver el calendario</span>
                <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>Cada día, con lo que entrenaste, tus descansos y lo que queda por recuperar.</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        )}

        {/* 5 · Constancia y media (apartados 8 y 9), del periodo elegido. */}
        <div className="mt-3">
          <TrainingFrequencyCard constancia={r.constancia} frecuencia={r.frecuencia} accent={accent} />
        </div>

        {/* Apartado 24 — lo que no se puede colocar en ningún día se dice. */}
        {r.avisoSinFecha && <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{r.avisoSinFecha}</p>}
      </Card>

      {/* 6 · Actividad reciente (apartados 17 y 18). */}
      {conRecientes && (
        <TrainingRecentSessions tarjetas={r.recientes} accent={accent} onVer={onVerSesion} onVerHistorial={onVerHistorial} />
      )}
    </div>
  );
}

export default TrainingActivitySummary;
