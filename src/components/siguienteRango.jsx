/* ===========================================================================
   ENTREGA 4 · FASE 23/45 — LA TARJETA DEL SIGUIENTE RANGO

   El apartado 29 enumera cinco componentes y **cuatro ya existían**:
   `RankProgressBar` es `RankProgress` (F15), `RankNextStep` es el de la F20, y
   `RankCoverage` y `RankConfidence` también son de la F20. *"Evitar
   duplicaciones"*, literal — así que aquí solo nace **`RankNextLevelCard`**, la
   tarjeta compacta del apartado 27, y reutiliza las otras.

   🚨 **No calcula nada** (apartado 37). El porcentaje, los puntos que faltan, la
   confianza y la cobertura los ha resuelto `src/lib/siguienteRango.js`, que a
   su vez se los pide al RankEngine. Aquí solo se pinta.

   ⚠️ **Sin siguiente rango no hay barra** (apartado 6): ni vacía ni llena. Lo
   que se lee es «Rango máximo alcanzado», que es la información de verdad.
   =========================================================================== */

import React from 'react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { RankBadge } from './rangos';
/* FIT F20 — la cobertura y la confianza ya tienen su forma de enseñarse. */
import { RankCoverage } from './explicacionRango';
/* 🐛 FIT F21 — la tendencia sale de SU catálogo, con icono **y** palabra. La
   contribución devuelve `tendencia` (un id), **no `tendenciaNombre`**: leer ese
   campo daba `undefined` y la línea se quedaba muda sin que fallara nada. Es la
   lección de la FORMA de lo que devuelve una función, otra vez. */
import { estadoDeContribucion } from './contribucionMuscular';

/* ── El porcentaje, con su barra (apartados 27 y 28) ─────────────────────── */
/**
 * ⚠️ La animación es la entrada de la barra y nada más (apartado 28): la
 * transición vive en la clase, así que **respeta «Reducir movimiento»** sola
 * (E3 F14). Ni confeti, ni vibración, ni sonido.
 */
export function RankNextLevelBar({ barra, accent, hacia }) {
  if (!barra) return null;
  const pct = Math.max(0, Math.min(100, Number(barra.porcentaje) || 0));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 rounded-full overflow-hidden"
        style={{ background: hexToRgba(COLORS.border, 0.6) }}
        role="img"
        aria-label={hacia ? `Progreso hacia ${hacia}: ${pct} %` : `Progreso: ${pct} %`}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: COLORS.text }}>{pct} %</span>
    </div>
  );
}

/* ── Los ejercicios que más pesan (apartados 21 y 22) ────────────────────── */
export function RankRelevantExercises({ relevantes, etiqueta, accent, onAbrir = null }) {
  if (!relevantes || !relevantes.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Ejercicios relevantes</p>
      {/* 🚨 Apartado 22 — lo único que se puede afirmar, y va escrito. */}
      <p className="text-[10px] mb-1" style={{ color: COLORS.textMuted }}>{etiqueta}</p>
      <div className="space-y-0.5">
        {relevantes.map((r) => {
          const est = estadoDeContribucion(r.tendencia || 'sin_datos');
          const Icono = est.icono;
          const linea = (
            <>
              <span className="truncate" style={{ color: COLORS.text }}>{r.nombre}</span>
              {/* Nunca solo el icono ni solo el color: icono Y palabra. */}
              <span className="shrink-0 ml-2 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                <Icono size={12} aria-hidden="true" />
                {est.palabra}
              </span>
            </>
          );
          if (!onAbrir) {
            return <div key={r.exerciseId} className="flex items-center justify-between text-[11px]">{linea}</div>;
          }
          return (
            <button
              key={r.exerciseId}
              onClick={() => onAbrir(r.exerciseId)}
              aria-label={`${r.nombre}: ${est.palabra}. Ver su progreso`}
              className="w-full flex items-center justify-between text-[11px] text-left toque-44"
            >
              {linea}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 27 · `RankNextLevelCard` ─────────────────────────────────────────────── */
/**
 * La tarjeta compacta del apartado 27:
 *
 *     INTERMEDIO
 *     ████████░░  72 %
 *     Siguiente: AVANZADO
 *     84 puntos restantes
 *
 * Con la cobertura y la fiabilidad al lado (apartados 18 y 19), porque un 72 %
 * suelto *"parece una medición física absoluta"*.
 */
export function RankNextLevelCard({
  tarjeta, accent, onPorQue = null, onEjercicio = null, compacta = false,
}) {
  if (!tarjeta) return null;
  const p = tarjeta.progreso || {};
  const sinRango = p.estado === 'sin_rango';

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface2 }}>
      <div className="flex items-center gap-3">
        <RankBadge
          rank={sinRango ? null : p.rango}
          size="lg"
          state={sinRango ? 'no_disponible' : 'actual'}
          locked={sinRango}
          accent={accent}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
            {tarjeta.destino.nombre}
          </p>
          <p
            className="text-xl font-extrabold leading-tight"
            style={{ color: sinRango ? COLORS.text : accent, fontFamily: "'Manrope', sans-serif" }}
          >
            {tarjeta.titulo}
          </p>
          {/* Apartado 23 — y si se movió dentro del mismo rango, se dice así. */}
          {tarjeta.cambio && (
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{tarjeta.cambio.texto}</p>
          )}
        </div>
      </div>

      {/* 🚨 Apartado 6 — la barra solo existe si hay un siguiente rango. */}
      {tarjeta.barra && (
        <RankNextLevelBar barra={tarjeta.barra} accent={accent} hacia={p.nombreSiguiente} />
      )}

      {p.nombreSiguiente && (
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
          Siguiente: <span className="font-semibold" style={{ color: COLORS.text }}>{p.nombreSiguiente}</span>
        </p>
      )}

      {/* La frase principal: los puntos si son fiables, y si no lo que sí se sabe. */}
      <p className="text-xs" style={{ color: COLORS.text }}>{tarjeta.falta}</p>

      {/* Apartado 14 — en un isométrico, con qué se está midiendo. */}
      {tarjeta.metrica && (
        <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{tarjeta.metrica}</p>
      )}

      {/* Apartado 10 — de dónde sale, cuando sale de entrenamientos de verdad. */}
      {tarjeta.base && (
        <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{tarjeta.base}</p>
      )}

      {/* Apartados 8, 18 y 19 — la fiabilidad y la cobertura, discretas pero ahí. */}
      {tarjeta.aviso && (
        <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{tarjeta.aviso}</p>
      )}
      {!compacta && tarjeta.cobertura && <RankCoverage cobertura={tarjeta.cobertura} accent={accent} />}

      {!compacta && (
        <RankRelevantExercises
          relevantes={tarjeta.relevantes}
          etiqueta={tarjeta.etiquetaRelevantes}
          accent={accent}
          onAbrir={onEjercicio}
        />
      )}

      {/* Apartado 30 — «Ver por qué» lleva a la explicación de la F20. */}
      {onPorQue && (
        <button
          onClick={onPorQue}
          aria-label={`Por qué tu rango en ${tarjeta.destino.nombre}`}
          className="text-[11px] font-semibold px-3 py-2 rounded-full toque-44"
          style={{ background: hexToRgba(accent, 0.18), color: accent }}
        >
          Ver por qué
        </button>
      )}
    </div>
  );
}

export default RankNextLevelCard;
