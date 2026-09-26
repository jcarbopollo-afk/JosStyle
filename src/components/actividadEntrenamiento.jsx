import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, History, CalendarDays } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO } from '../lib/helpers';
import { Card, GhostBtn } from './ui';
import {
  resumenDeActividad, mesDeActividad, sesionesDelDiaDeActividad,
  PERIODOS_ACTIVIDAD, PERIODO_ACTIVIDAD_POR_DEFECTO,
} from '../lib/actividadEntrenamiento';
import { CATALOGO_PLANES } from '../lib/planes';

/* ===========================================================================
   ENTREGA 4 · FASE 31/45 — LA ACTIVIDAD DE ENTRENAMIENTO

   🚨 **AQUÍ NO SE CUENTA NADA** (apartado 20: *"No calcular estos valores
   directamente dentro de componentes"*). Todo llega de `resumenDeActividad` y
   `mesDeActividad`; estos componentes dibujan.

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
          <button
            key={p.id}
            onClick={() => onCambiar(p.id)}
            aria-pressed={activo}
            className="h-9 px-3 rounded-xl text-xs font-semibold shrink-0 toque-44 active:scale-95"
            style={{ background: activo ? accent : hexToRgba(COLORS.border, 0.45), color: activo ? COLORS.textOnAccent : COLORS.text }}
          >
            {p.nombre}
          </button>
        );
      })}
    </div>
  );
}

/* ── TrainingActivityDay (apartados 6, 28, 30 y 37) ────────────────────────
   Un día: su letra o su número, y una marca. Solo un día con entrenamiento es
   un botón (apartado 30: *"Desde un día sin entrenamiento: no hacer nada
   especial"*); los demás se leen igual, con su frase entera. */
function Marca({ estado, accent }) {
  if (estado === 'entrenado') {
    return <span className="block w-2 h-2 rounded-full mx-auto" style={{ background: accent }} aria-hidden="true" />;
  }
  if (estado === 'descanso') {
    return <span className="block w-2 h-2 rounded-full mx-auto" style={{ border: `1.5px solid ${COLORS.textMuted}` }} aria-hidden="true" />;
  }
  return (
    <span className="block text-[11px] leading-none text-center" style={{ color: COLORS.textMuted, opacity: estado === 'futuro' ? 0.4 : 0.75 }} aria-hidden="true">
      {estado === 'futuro' ? '·' : '—'}
    </span>
  );
}

export function TrainingActivityDay({ dia, accent, arriba = 'letra', seleccionado = false, onElegir = null }) {
  const cabeza = arriba === 'numero' ? dia.numero : dia.corto;
  const contenido = (
    <>
      <span
        className="block text-[11px] font-bold"
        style={{ color: dia.esHoy ? accent : COLORS.textMuted, textDecoration: dia.esHoy ? 'underline' : 'none' }}
        aria-hidden="true"
      >
        {cabeza}
      </span>
      <span className="block mt-1.5 h-2.5"><Marca estado={dia.estado} accent={accent} /></span>
    </>
  );
  const fondo = seleccionado ? hexToRgba(accent, 0.2) : 'transparent';
  if (dia.navegable && onElegir) {
    return (
      <button
        onClick={() => onElegir(dia)}
        aria-label={dia.etiqueta}
        aria-current={dia.esHoy ? 'date' : undefined}
        aria-pressed={seleccionado}
        className="rounded-xl py-1.5 toque-44 active:scale-95 w-full"
        style={{ background: fondo }}
      >
        {contenido}
      </button>
    );
  }
  return (
    <div className="rounded-xl py-1.5 w-full text-center" aria-current={dia.esHoy ? 'date' : undefined}>
      <span className="sr-only">{dia.etiqueta}</span>
      {contenido}
    </div>
  );
}

/* ── TrainingActivityCalendar (apartados 6, 7 y 36) ────────────────────────
   Compacto: la semana en una fila de siete. El mes es **opcional** y se abre a
   un toque; es una cuadrícula de siete columnas que cabe en 375 px sin
   arrastrar la página (GE F1). */
export function TrainingActivityCalendar({
  dias, mes = null, vista = 'semana', onVista = null, onMes = null, accent,
  seleccionado = null, onElegir = null,
}) {
  return (
    <div>
      {onVista && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={titulo}>
            {vista === 'mes' && mes ? mes.titulo : 'Esta semana'}
          </p>
          <button
            onClick={() => onVista(vista === 'mes' ? 'semana' : 'mes')}
            aria-label={vista === 'mes' ? 'Ver solo esta semana' : 'Ver el mes entero'}
            className="text-xs font-semibold inline-flex items-center gap-1 py-1.5 toque-44"
            style={{ color: accent }}
          >
            <CalendarDays size={14} aria-hidden="true" /> {vista === 'mes' ? 'Semana' : 'Mes'}
          </button>
        </div>
      )}
      {vista === 'mes' && mes ? (
        <>
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => onMes && onMes(mes.anterior)}
              aria-label="Mes anterior"
              className="w-9 h-9 rounded-xl flex items-center justify-center toque-44 active:scale-90"
              style={{ color: COLORS.textMuted }}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{mes.texto}</p>
            <button
              onClick={() => onMes && mes.haySiguiente && onMes(mes.siguiente)}
              disabled={!mes.haySiguiente}
              aria-label="Mes siguiente"
              className="w-9 h-9 rounded-xl flex items-center justify-center toque-44 active:scale-90 disabled:opacity-30"
              style={{ color: COLORS.textMuted }}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label={`Actividad de ${mes.titulo}`}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((l, i) => (
              <span key={`c${i}`} className="text-[10px] font-bold text-center" style={titulo} aria-hidden="true">{l}</span>
            ))}
            {mes.celdas.map((d, i) => (d ? (
              <TrainingActivityDay
                key={d.fecha}
                dia={d}
                accent={accent}
                arriba="numero"
                seleccionado={seleccionado === d.fecha}
                onElegir={onElegir}
              />
            ) : <span key={`v${i}`} aria-hidden="true" />))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-7 gap-1" role="group" aria-label="Actividad de esta semana">
          {dias.map((d) => (
            <TrainingActivityDay
              key={d.fecha}
              dia={d}
              accent={accent}
              seleccionado={seleccionado === d.fecha}
              onElegir={onElegir}
            />
          ))}
        </div>
      )}
      {/* La leyenda, con palabras (apartado 37): el guion no es un fallo. */}
      <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>
        ● entrenamiento · ○ sin entrenamiento planificado · — sin entrenamiento registrado
      </p>
    </div>
  );
}

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
          <p className="text-sm font-bold mt-1 tabular-nums" style={{ color: accent }}>{frecuencia.texto}</p>
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
          {' · '}<span style={{ color: t.parcial ? accent : COLORS.textMuted }}>{t.estado}</span>
        </p>
      </div>
      {onVer && (
        <button
          onClick={() => onVer(t.id)}
          aria-label={`Ver el entrenamiento: ${t.etiqueta}`}
          className="text-xs font-bold px-3 py-2 rounded-xl toque-44 active:scale-95 shrink-0"
          style={{ color: accent, background: hexToRgba(accent, 0.1) }}
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
  const [vista, setVista] = useState('semana');
  const [mesClave, setMesClave] = useState(null);
  const [diaElegido, setDiaElegido] = useState(null);
  const r = useMemo(() => resumenDeActividad(fitness, { periodo, hoy, planes }), [fitness, periodo, hoy, planes]);
  const mes = useMemo(
    () => (vista === 'mes' ? mesDeActividad(fitness, { mes: mesClave, hoy, planes }) : null),
    [fitness, vista, mesClave, hoy, planes],
  );
  const delDia = useMemo(
    () => (diaElegido ? sesionesDelDiaDeActividad(fitness, diaElegido, { hoy, planes }) : []),
    [fitness, diaElegido, hoy, planes],
  );

  if (!r.hay) {
    return (
      <Card>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={titulo}>Último entrenamiento</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{r.vacio}</p>
      </Card>
    );
  }

  /* Apartado 30 — un día con un entrenamiento abre su detalle; con varios, se
     enseñan debajo y se elige. */
  const elegirDia = (d) => {
    if (d.sesiones.length === 1 && onVerSesion) { onVerSesion(d.sesiones[0].id); return; }
    setDiaElegido(diaElegido === d.fecha ? null : d.fecha);
  };

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

        {/* 4 · Cómo se distribuye (apartados 6 y 7). */}
        <div className="mt-3">
          <TrainingActivityCalendar
            dias={r.semana.dias}
            mes={mes}
            vista={vista}
            onVista={(v) => { setVista(v); setDiaElegido(null); }}
            onMes={setMesClave}
            accent={accent}
            seleccionado={diaElegido}
            onElegir={elegirDia}
          />
          {delDia.length > 1 && (
            <div className="mt-2 rounded-2xl px-3" style={{ background: hexToRgba(COLORS.border, 0.25) }}>
              {delDia.map((t) => <TrainingRecentSessionCard key={t.id} tarjeta={t} accent={accent} onVer={onVerSesion} />)}
            </div>
          )}
        </div>

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
