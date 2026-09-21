import React from 'react';
import { Target, CheckCircle2, CalendarClock, Sparkles } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, EmptyHint, PrimaryButton } from './ui';
import { CELEBRACION, SIN_PORCENTAJE } from '../lib/objetivosFitness';

/* ===========================================================================
   ENTREGA 4 · FASE 30/45 — OBJETIVOS FITNESS

   Las cinco piezas nuevas del apartado 39. Las otras cuatro —`ObjetivosProgreso`,
   `TarjetaObjetivo`, `DetalleObjetivo` y `FormularioObjetivo`— **son de la F14**
   y viven en `ProgresoView.jsx`: el apartado dice *"Crear/reutilizar"*, y está
   declarado en `COMPONENTES_FIT30` con una prueba que abre cada archivo.

   🚨 **Aquí no se calcula nada.** Todo llega resuelto de
   `src/lib/objetivosFitness.js`, que a su vez solo reparte lo que decidieron la
   F14 y la F11.

   ⚠️ Apartado 44 — premium y minimalista: barras discretas, jerarquía fuerte y
   **ni una gamificación infantil** (apartado 16 y D2-02).
   =========================================================================== */

/* ── 10 y 33 · El progreso de un objetivo ───────────────────────────────────
   🚨 **La barra solo existe si la métrica es numérica.** Una habilidad no tiene
   porcentaje (apartado 14), así que en su lugar se dice qué significa — nunca
   una barra al 0 %, que se leería como «vas fatal».

   ⚠️ Y «cuánto falta» viene ya redactado; aquí no se resta nada. */
export function GoalProgress({ progreso, accent, distancia = '' }) {
  if (!progreso) return null;
  const { porcentaje, progresoTexto, sinDatos, numerico } = progreso;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-base font-bold tabular-nums" style={{ color: COLORS.text }}>{progresoTexto}</p>
        {porcentaje !== null && (
          <p className="text-xs font-bold tabular-nums" style={{ color: accent }}>{porcentaje} %</p>
        )}
      </div>

      {/* Apartado 10 — la barra, discreta. Solo con métrica numérica y datos. */}
      {numerico && !sinDatos && porcentaje !== null && (
        <div
          className="h-1.5 rounded-full overflow-hidden mt-1.5"
          style={{ background: hexToRgba(COLORS.border, 0.6) }}
          role="img"
          aria-label={`Progreso del objetivo: ${porcentaje} %`}
        >
          <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, background: accent }} />
        </div>
      )}

      {/* 🚨 Apartado 14 — y si no es numérica, se dice en vez de pintar un 0 %. */}
      {!numerico && (
        <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{SIN_PORCENTAJE}</p>
      )}

      {/* Apartado 33 — «Te faltan 3 reps», nunca «te quedan 3 semanas». */}
      {distancia && (
        <p className="text-xs font-semibold mt-1.5" style={{ color: COLORS.textMuted }}>{distancia}</p>
      )}
    </div>
  );
}

/* ── 10, 19 y 28 · El estado ────────────────────────────────────────────────
   ⚠️ El color NUNCA va solo (EH F42): icono y palabra siempre. */
export function GoalStatus({ estado, nombre, simbolo, accent, avisoFecha = '' }) {
  const hecho = estado === 'completado';
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
        style={{
          background: hecho ? hexToRgba(accent, 0.14) : hexToRgba(COLORS.border, 0.45),
          color: hecho ? accent : COLORS.textMuted,
        }}
      >
        <span aria-hidden="true">{simbolo}</span>
        {nombre}
      </span>
      {/* 🚨 Apartado 28 — se dice, y el objetivo SIGUE en progreso. Ni «fallido». */}
      {avisoFecha && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
          style={{ background: hexToRgba(COLORS.warning, 0.14), color: COLORS.warning }}
        >
          <CalendarClock size={12} aria-hidden="true" />
          {avisoFecha}
        </span>
      )}
    </span>
  );
}

/* ── 31 · Las sesiones que han contribuido ──────────────────────────────────
   *"Utilizar historial existente. No duplicar sesiones."* Llegan ya de las
   apariciones de la F11, con el valor de ESTA métrica. */
export function GoalHistory({ filas = [], accent, unidad = '', onVerSesion = null }) {
  if (!filas.length) return null;
  return (
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>
        Lo que has hecho
      </p>
      {filas.map((f) => (
        <div
          key={f.sesionId}
          className="flex items-center gap-2 py-2"
          style={{ borderTop: `1px solid ${hexToRgba(COLORS.border, 0.6)}` }}
        >
          <span className="text-xs min-w-0 flex-1" style={{ color: COLORS.textMuted }}>{f.fechaTexto}</span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: f.alcanza ? accent : COLORS.text }}
          >
            {f.valor}{unidad ? ` ${unidad}` : ''}
          </span>
          {onVerSesion && (
            <button
              onClick={() => onVerSesion(f.sesionId)}
              aria-label={`Ver el entrenamiento del ${f.fechaTexto}`}
              className="text-xs font-bold px-2 py-2 rounded-lg toque-44 shrink-0"
              style={{ color: accent }}
            >
              Ver
            </button>
          )}
        </div>
      ))}
    </Card>
  );
}

/* ── El vacío, con su salida (EH F41: un vacío sin salida es una pantalla rota) */
export function GoalEmpty({ vacio, accent, onCrear = null }) {
  if (!vacio) return null;
  return (
    <div className="space-y-3">
      <EmptyHint text={vacio.texto || vacio.titulo} />
      {onCrear && vacio.cta && (
        <PrimaryButton icon={Target} accent={accent} onClick={onCrear}>{vacio.cta}</PrimaryButton>
      )}
    </div>
  );
}

/* ── 16 · La microcelebración ───────────────────────────────────────────────
   🚨 *"Debe sentirse premium."* Y su lista de lo prohibido es explícita:
   confeti exagerado, XP, monedas, leaderboard. Esto es **una tarjeta y un
   botón**: se lee, se cierra y no interrumpe nada.

   ⚠️ No lleva temporizador ni se dispara sola: la enseña quien acaba de ver
   que un objetivo pasó a conseguido. */
export function GoalCompletion({ objetivo, accent, onCerrar }) {
  if (!objetivo) return null;
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Sparkles size={18} style={{ color: accent }} aria-hidden="true" />
        <p
          className="text-lg font-extrabold"
          style={{ color: accent, fontFamily: "'Manrope', sans-serif" }}
        >
          {CELEBRACION.titulo}
        </p>
      </div>
      <p className="text-sm font-semibold mt-1" style={{ color: COLORS.text }}>{objetivo.nombre}</p>
      <p className="text-xs tabular-nums" style={{ color: COLORS.textMuted }}>{objetivo.objetivoTexto}</p>
      {objetivo.conseguidoEn && (
        <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
          <CheckCircle2 size={11} className="inline mr-1" aria-hidden="true" />
          Conseguido el {objetivo.conseguidoEn}
        </p>
      )}
      {onCerrar && (
        <div className="mt-3">
          <PrimaryButton accent={accent} onClick={onCerrar}>{CELEBRACION.cerrar}</PrimaryButton>
        </div>
      )}
    </Card>
  );
}

/* ── 32 · La evolución, con su línea de objetivo ────────────────────────────
   ⚠️ **No es `GraficaProgreso` (F12) con un parámetro más.** Aquélla dibuja el
   rendimiento de un ejercicio y no tiene concepto de meta; ésta existe **por la
   línea**, que es lo único que el apartado 32 añade. Reutilizarla habría
   obligado a meterle un target que no le corresponde.

   🚨 Y para una habilidad no se dibuja nada: *"Para skills: no crear gráfico
   artificial"*. Lo decide la librería (`grafica.motivo`), no un `if` aquí. */
const ANCHO_G = 320;
const ALTO_G = 120;
export function GoalChart({ grafica, accent }) {
  if (!grafica) return null;
  if (!grafica.mostrar) {
    return grafica.motivo
      ? <p className="text-xs" style={{ color: COLORS.textMuted }}>{grafica.motivo}</p>
      : null;
  }
  const valores = grafica.puntos.map((p) => p.valor);
  /* El techo incluye la línea del objetivo: si no, quedaría fuera del dibujo. */
  const max = Math.max(...valores, grafica.linea ?? -Infinity);
  const min = Math.min(...valores, 0);
  const m = 16;
  const x = (i) => m + (grafica.puntos.length === 1 ? (ANCHO_G - m * 2) / 2 : (i / (grafica.puntos.length - 1)) * (ANCHO_G - m * 2));
  const y = (v) => (max === min ? ALTO_G / 2 : m + (1 - (v - min) / (max - min)) * (ALTO_G - m * 2));
  const camino = grafica.puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
  return (
    <div>
      <svg
        viewBox={`0 0 ${ANCHO_G} ${ALTO_G}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Evolución: de ${valores[0]} a ${valores[valores.length - 1]} ${grafica.unidad}, con el objetivo en ${grafica.linea} ${grafica.unidad}`}
      >
        {/* La línea del objetivo, discontinua y con su rótulo. */}
        {grafica.linea !== null && (
          <>
            <line
              x1={m} x2={ANCHO_G - m} y1={y(grafica.linea)} y2={y(grafica.linea)}
              stroke={accent} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7"
            />
            <text x={ANCHO_G - m} y={y(grafica.linea) - 4} textAnchor="end" fontSize="9" fill={accent}>
              {grafica.linea} {grafica.unidad}
            </text>
          </>
        )}
        <path d={camino} fill="none" stroke={COLORS.text} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {grafica.puntos.map((p, i) => (
          <circle key={p.fecha + i} cx={x(i)} cy={y(p.valor)} r="4" fill={COLORS.text} stroke={COLORS.surface} strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] tabular-nums" style={{ color: COLORS.textMuted }}>
        <span>{grafica.puntos[0].fechaTexto}</span>
        <span>{grafica.puntos[grafica.puntos.length - 1].fechaTexto}</span>
      </div>
    </div>
  );
}

/* ── 14 · Los peldaños de una habilidad ─────────────────────────────────────
   🚨 Una LISTA, nunca una fracción: contar «2 de 3 = 67 %» sería inventar la
   escala que el apartado 14 prohíbe. Y las progresiones de este catálogo
   apuntan hacia abajo —son los peldaños previos—, así que se leen como lo que
   son: lo que ya ha hecho para llegar ahí. */
export function GoalSkillSteps({ skill, accent }) {
  if (!skill) return null;
  return (
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
        Progresión
      </p>
      {skill.actual && (
        <p className="text-sm font-bold mt-1" style={{ color: COLORS.text }}>
          Ahora mismo: {skill.actual.nombre}
        </p>
      )}
      <div className="mt-2 space-y-1">
        {skill.peldanos.map((p) => (
          <div key={p.exerciseId} className="flex items-center gap-2">
            <span aria-hidden="true" style={{ color: p.hecho ? accent : COLORS.textMuted }}>
              {p.hecho ? '✓' : '·'}
            </span>
            <span className="text-xs min-w-0 flex-1" style={{ color: p.hecho ? COLORS.text : COLORS.textMuted }}>
              {p.nombre}
            </span>
            {p.hecho && (
              <span className="text-[10px] tabular-nums" style={{ color: COLORS.textMuted }}>
                {p.veces} {p.veces === 1 ? 'sesión' : 'sesiones'}
              </span>
            )}
          </div>
        ))}
      </div>
      <p
        className="text-xs font-semibold mt-2"
        style={{ color: skill.conseguida ? accent : COLORS.textMuted }}
      >
        {skill.conseguida ? `${skill.objetivoNombre}: conseguida` : `Objetivo: ${skill.objetivoNombre}`}
      </p>
    </Card>
  );
}

/* ── 36 · El objetivo durante el entrenamiento ──────────────────────────────
   🚨 *"Mostrar discretamente… No interferir con la tabla de series. El objetivo
   no debe modificar automáticamente la rutina."* Por eso es **una línea de
   texto y nada más**: sin botones, sin series sugeridas y sin nada que escriba
   en la sesión. */
export function GoalLiveHint({ enVivo, accent }) {
  if (!enVivo) return null;
  return (
    <p
      className="text-[11px] tabular-nums px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5"
      style={{ background: hexToRgba(accent, 0.1), color: COLORS.textMuted }}
    >
      <Target size={12} style={{ color: accent }} aria-hidden="true" />
      <span>
        Objetivo: <strong style={{ color: COLORS.text }}>{enVivo.objetivoTexto}</strong>
        {enVivo.actualTexto ? <> · Actual: <strong style={{ color: COLORS.text }}>{enVivo.actualTexto}</strong></> : null}
      </span>
    </p>
  );
}

export default GoalProgress;
