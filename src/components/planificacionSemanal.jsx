/* ===========================================================================
   ENTREGA 4 · FASE 32/45 — LA PLANIFICACIÓN SEMANAL, LOS COMPONENTES

   🚨 **NO CALCULAN NADA** (apartado 30: *"No calcular esta lógica dentro de
   los componentes visuales"*). Qué tenía el plan cada día, qué hizo, en qué
   estado queda y cómo se describe salen de `src/lib/planificacionSemanal.js`;
   aquí solo se pinta.

   De los ocho componentes del apartado 29, **dos ya existían** y se reutilizan
   en `TuPlanView.jsx`: `NextWorkoutCard` es `TarjetaProximo` (F6) y el detalle
   de la rutina de un día es `SesionDelDia` (F6), que este archivo **recibe ya
   pintado** en `rutina`: importarlo desde aquí sería un ciclo con la vista
   (FIT F24, `ClassificationHub`).

   ⚠️ Y **ni un color de alarma**: un día planificado que pasó sin registro no
   es un fallo (apartados 7 y 16). El acento marca lo hecho; lo demás va en el
   color apagado de siempre.
   =========================================================================== */

import React from 'react';
import { ChevronLeft, ChevronRight, Play, Repeat, CalendarDays } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, GhostBtn, PrimaryButton } from './ui';

const hecho = (estado) => estado === 'completed' || estado === 'completed_extra';

/* ── TrainingDayStatus (apartados 5-7, 17 y 32) ──────────────────────────── */
export function TrainingDayStatus({ dia, accent }) {
  if (!dia) return null;
  const color = hecho(dia.estado) ? accent : COLORS.textMuted;
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold" style={{ color }}>{dia.principal}</p>
      {dia.detalle && <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{dia.detalle}</p>}
    </div>
  );
}

/* ── WorkoutDayHeader ───────────────────────────────────────────────────────
   *"Viernes 12 de septiembre"* y su estado. ⚠️ «Hoy» va con palabra, no solo
   con el color (apartado 39). */
export function WorkoutDayHeader({ dia, accent }) {
  if (!dia) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {dia.nombreDia} {dia.numero}
          {dia.esHoy && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>Hoy</span>
          )}
        </p>
        <TrainingDayStatus dia={dia} accent={accent} />
      </div>
    </div>
  );
}

/* ── PlannedWorkoutCard (apartados 4, 26, 27 y 28) ──────────────────────────
   Lo que el plan tenía ese día. ⚠️ De un plan anterior solo se sabe el nombre
   del día (C-39), y se dice de qué plan era. */
export function PlannedWorkoutCard({ planificado, accent }) {
  /* ⚠️ Una plantilla como plan no tiene días fijos: no se dice «Planificado». */
  if (!planificado || planificado.descanso || planificado.sinPlan || planificado.libre) return null;
  return (
    <div className="rounded-xl p-3" style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${COLORS.border}` }}>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Planificado</p>
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>{planificado.nombre}</p>
      {planificado.anterior ? (
        <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
          {planificado.planNombre ? `De tu plan anterior, «${planificado.planNombre}»` : 'De tu plan anterior'}
        </p>
      ) : (
        <>
          {typeof planificado.ejercicios === 'number' && (
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
              {[`${planificado.ejercicios} ${planificado.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`, planificado.duracion]
                .filter(Boolean).join(' · ')}
            </p>
          )}
          {planificado.musculos && planificado.musculos.length > 0 && (
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{planificado.musculos.join(' · ')}</p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Las sesiones que hizo ese día (apartados 6, 12, 18 y 21) ───────────────
   Todas, en el orden en que las hizo, cada una con su «Ver». */
function SesionesRealizadas({ dia, accent, onVerSesion, sinVer = false }) {
  if (!dia.realizadas.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
        {dia.realizadas.length === 1 ? 'Realizado' : `Realizados · ${dia.realizadas.length}`}
      </p>
      {dia.realizadas.map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded-xl p-2.5" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate" style={{ color: COLORS.text }}>{r.nombre}</p>
            <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
              {[r.hora, r.duracion, r.estadoSesion].filter(Boolean).join(' · ')}
            </p>
          </div>
          {onVerSesion && !sinVer && (
            <button
              onClick={() => onVerSesion(r.id)}
              aria-label={`Ver el entrenamiento: ${r.nombre}, ${dia.nombreDia.toLowerCase()} ${dia.numero}`}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg toque-44 active:scale-95 shrink-0"
              style={{ color: accent, background: hexToRgba(accent, 0.1) }}
            >
              Ver
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── TrainingDayCard: el día elegido, ampliado (apartados 4, 6, 11-13, 37) ──
   ⚠️ `rutina` llega YA PINTADA desde la vista (`SesionDelDia`), porque es donde
   vive. Con ella, tocar un día planificado enseña sus ejercicios y «Empezar
   entrenamiento» como en la F6; ya hecho, «Ver entrenamiento» y «Repetir». */
export function TrainingDayCard({
  dia, accent, rutina = null, onVerSesion = null, onRepetir = null,
}) {
  if (!dia) return null;
  const unaSola = dia.realizadas.length === 1 ? dia.realizadas[0] : null;
  return (
    <Card>
      <WorkoutDayHeader dia={dia} accent={accent} />
      {/* Lo planificado se enseña resumido cuando no va la rutina entera. */}
      {!rutina && dia.planificado && !dia.planificado.descanso && !dia.planificado.sinPlan && (
        <div className="mt-3"><PlannedWorkoutCard planificado={dia.planificado} accent={accent} /></div>
      )}
      {dia.realizadas.length > 0 && (
        <div className="mt-3">
          {/* Con una sola sesión ya hecha, su «Ver» es el «Ver entrenamiento» de
              abajo: dos botones para lo mismo, no. */}
          <SesionesRealizadas
            dia={dia}
            accent={accent}
            onVerSesion={onVerSesion}
            sinVer={!!unaSola && dia.acciones.repetir && !!onVerSesion}
          />
        </div>
      )}
      {/* Apartado 12 — ya hecho: «Ver entrenamiento» lleva a la sesión real y
          «Repetir» crea otra nueva, sin tocar la anterior (apartado 13). */}
      {dia.acciones.repetir && (onVerSesion || onRepetir) && (
        <div className="flex gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {unaSola && onVerSesion && (
            <PrimaryButton accent={accent} icon={ChevronRight} onClick={() => onVerSesion(unaSola.id)}>
              Ver entrenamiento
            </PrimaryButton>
          )}
          {onRepetir && <GhostBtn icon={Repeat} onClick={onRepetir}>Repetir</GhostBtn>}
        </div>
      )}
      {rutina && <div className="mt-3">{rutina}</div>}
    </Card>
  );
}

/* ── TrainingWeekDay (apartados 3, 8 y 39) ──────────────────────────────────
   Cada casilla con su letra, su número, su marca **y su palabra corta**, y una
   descripción completa para VoiceOver: *"Viernes 12 de septiembre. Push.
   Planificado y completado."* ⚠️ El día de hoy se destaca con un fondo suave y
   subrayado, **sin animación** (apartado 8). */
export function TrainingWeekDay({ dia, accent, seleccionado = false, onElegir = null }) {
  const marcado = hecho(dia.estado);
  const fondo = seleccionado ? accent : (dia.esHoy ? hexToRgba(accent, 0.18) : hexToRgba(COLORS.border, 0.45));
  const color = seleccionado ? COLORS.textOnAccent : (dia.esHoy || marcado ? accent : COLORS.textMuted);
  /* En la casilla, lo que el plan tenía; y si hizo otra cosa, lo que hizo —
     el plan sigue en la descripción y en la tarjeta del día (apartado 18). */
  const delPlan = dia.planificado && !dia.planificado.descanso && !dia.planificado.sinPlan && !dia.planificado.libre;
  const corto = delPlan && (dia.relacion === 'coincide' || !dia.realizadas.length)
    ? dia.planificado.nombre
    : (dia.realizadas[0]?.nombre || '—');
  return (
    <button
      onClick={() => onElegir && onElegir(dia)}
      disabled={!onElegir}
      aria-label={dia.descripcion}
      aria-current={dia.esHoy ? 'date' : undefined}
      aria-pressed={onElegir ? seleccionado : undefined}
      className="min-w-0 rounded-xl py-2 px-1 toque-44 active:scale-[0.97] text-center"
      style={{ background: fondo, color }}
    >
      <span className="block text-[11px] font-bold" style={{ textDecoration: dia.esHoy ? 'underline' : 'none' }}>
        {dia.corto} {dia.numero}
      </span>
      <span className="block text-[12px] leading-none mt-1" aria-hidden="true">{dia.simbolo}</span>
      <span className="block text-[10px] truncate mt-1">{corto}</span>
    </button>
  );
}

/* ── WeekNavigation (apartados 14-16) ───────────────────────────────────────
   ← semana anterior · esta semana · semana siguiente →. ⚠️ Navegar es mirar:
   no crea ni una sesión (apartado 14). */
export function WeekNavigation({ semana, accent, onAnterior = null, onSiguiente = null, onEstaSemana = null }) {
  if (!semana) return null;
  const flecha = (activo) => ({
    background: hexToRgba(COLORS.border, 0.45),
    color: activo ? COLORS.text : COLORS.textMuted,
    opacity: activo ? 1 : 0.4,
  });
  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        onClick={onAnterior || undefined}
        disabled={!onAnterior || !semana.hayAnterior}
        aria-label="Semana anterior"
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
        style={flecha(!!onAnterior && semana.hayAnterior)}
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {semana.titulo}
        </p>
        {semana.titulo !== `Semana del ${semana.rango}` && (
          <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>{semana.rango}</p>
        )}
      </div>
      <button
        onClick={onSiguiente || undefined}
        disabled={!onSiguiente || !semana.haySiguiente}
        aria-label="Semana siguiente"
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
        style={flecha(!!onSiguiente && semana.haySiguiente)}
      >
        <ChevronRight size={18} />
      </button>
      {!semana.esActual && onEstaSemana && (
        <button
          onClick={onEstaSemana}
          aria-label="Volver a esta semana"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
          style={{ background: hexToRgba(accent, 0.14), color: accent }}
        >
          <CalendarDays size={16} />
        </button>
      )}
    </div>
  );
}

/* ── TrainingWeekView (apartados 3, 22 y 38) ────────────────────────────────
   Las siete casillas en rejilla: caben a 375 px sin arrastrar la página de lado
   (GE F1), y en una pantalla ancha la semana entera se ve de un vistazo. */
export function TrainingWeekView({ semana, accent, seleccionado = null, onElegir = null }) {
  if (!semana || !semana.dias || !semana.dias.length) return null;
  return (
    <div>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label={`${semana.titulo}: ${semana.rango}`}>
        {semana.dias.map((d) => (
          <TrainingWeekDay
            key={d.fecha}
            dia={d}
            accent={accent}
            seleccionado={seleccionado === d.fecha}
            onElegir={onElegir}
          />
        ))}
      </div>
      {semana.aviso && (
        <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{semana.aviso}</p>
      )}
      {/* La leyenda, con palabras (apartado 39): ni el guion ni el círculo son
          un fallo. */}
      <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>
        ✓ completado · ● otro entrenamiento · ○ planificado · + extra · — sin entrenamiento planificado
      </p>
    </div>
  );
}

/* ── El plan que no se puede repartir (apartado 23) ─────────────────────────
   *"No romper Tu Plan"*: se dice qué pasa y se ofrece arreglarlo. */
export function PlanSinPlanificacion({ textos, accent, onEditar = null }) {
  return (
    <Card style={{ border: `1px solid ${COLORS.warning}` }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{textos.titulo}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{textos.texto}</p>
      {onEditar && (
        <div className="mt-3">
          <PrimaryButton accent={accent} icon={Play} onClick={onEditar}>{textos.editar}</PrimaryButton>
        </div>
      )}
    </Card>
  );
}
