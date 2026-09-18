/* ===========================================================================
   ENTREGA 4 · FASE 21/45 — «EJERCICIOS QUE CONTRIBUYEN», LOS COMPONENTES

   *"Debe quedar completamente claro: este rango muscular se obtiene
   principalmente de estos ejercicios."*

   🚨 **No calculan nada** (apartado 23): reciben lo que
   `src/lib/contribucionMuscular.js` ya ha juntado del catálogo y del motor.

   ⚠️ **La barra es participación, no desarrollo** (apartado 15): lleva su
   etiqueta escrita al lado y su `aria-label`, porque un 60 % suelto se lee como
   «el 60 % de tu espalda» y no es eso.
   =========================================================================== */

import React from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Circle } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { SectionTitle, EmptyHint } from './ui';
import { RankBadge, RankLabel } from './rangos';
import { ETIQUETA_PARTICIPACION } from '../lib/contribucionMuscular';
/* 🔓 Los filtros por estado son los de la F18: esta lista la sustituye, así que
   se los queda en vez de dejar dos listas de lo mismo en la misma pantalla. */
import { FILTROS_EJERCICIOS, filtrarEjercicios } from '../lib/detalleMuscular';

/* Los mismos cuatro estados que el resto de Fitness, con icono **y** palabra
   (apartado 30: nunca solo el color). */
const ESTADOS = {
  mejora: { icono: TrendingUp, palabra: 'Mejorando' },
  estable: { icono: Minus, palabra: 'Estable' },
  descenso: { icono: TrendingDown, palabra: 'Descenso' },
  sin_datos: { icono: Circle, palabra: 'Sin datos' },
};
const estadoDe = (id) => ESTADOS[id] || ESTADOS.sin_datos;

/* ── 15 · La barra de participación ──────────────────────────────────────── */
export function MuscleContributionBar({ porcentaje, nombre, accent }) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(porcentaje) || 0)));
  return (
    <div
      className="h-1 rounded-full overflow-hidden"
      style={{ background: hexToRgba(COLORS.border, 0.6) }}
      role="img"
      aria-label={`${nombre}: ${pct} % de participación en este grupo muscular`}
    >
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hexToRgba(accent, 0.75) }} />
    </div>
  );
}

/* ── 8 y 11 · Los datos de debajo ────────────────────────────────────────── */
export function MuscleContributionMeta({ contribucion }) {
  const c = contribucion;
  const est = estadoDe(c.tendencia || 'sin_datos');
  const Icono = est.icono;
  const partes = [
    c.papelNombre,
    `${c.porcentaje} % de participación`,
    c.dataPoints > 0 ? `${c.dataPoints} ${c.dataPoints === 1 ? 'sesión' : 'sesiones'}` : null,
    /* Apartado 11 — con pocos datos se dice, no se esconde el ejercicio. */
    c.confianza === 'baja' && c.dataPoints > 0 ? 'Confianza limitada' : null,
  ].filter(Boolean);
  return (
    <div className="flex items-center gap-2 flex-wrap mt-0.5">
      <span className="flex items-center gap-1 text-[11px]" style={{ color: COLORS.textMuted }}>
        <Icono size={11} aria-hidden="true" />
        {est.palabra}
      </span>
      {c.ultima && <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{c.ultima}</span>}
      <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{partes.join(' · ')}</span>
    </div>
  );
}

/* ── 8 · La tarjeta de un ejercicio ──────────────────────────────────────── */
export function MuscleContributionCard({ contribucion, accent, onAbrir, onPorQue = null }) {
  const c = contribucion;
  const dentro = (
    <>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{c.nombre}</p>
        <MuscleContributionMeta contribucion={c} />
        <div className="mt-1.5">
          <MuscleContributionBar porcentaje={c.porcentaje} nombre={c.nombre} accent={accent} />
        </div>
      </div>
      {onAbrir && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
    </>
  );
  const clases = 'hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3';
  const estilo = { background: COLORS.surface, border: `1px solid ${COLORS.border}` };
  /* El hexágono abre la explicación del rango (F20) y el resto lleva al progreso
     (apartado 14). ⚠️ Dos botones **hermanos**: uno dentro de otro no se puede
     pulsar en iOS. */
  const insignia = c.rango ? (
    onPorQue ? (
      <button
        onClick={() => onPorQue(c.exerciseId)}
        aria-label={`Por qué tu rango en ${c.nombre}`}
        className="shrink-0 toque-44 flex items-center"
      >
        <RankBadge rank={c.rango} size="sm" state="actual" accent={accent} />
      </button>
    ) : <RankBadge rank={c.rango} size="sm" state="actual" accent={accent} />
  ) : null;

  if (!onAbrir) return <div className={clases} style={estilo}>{dentro}{insignia}</div>;
  return (
    <div className={clases} style={estilo}>
      <button
        onClick={() => onAbrir(c.exerciseId)}
        aria-label={`${c.nombre}: ${c.nombreRango}, ${estadoDe(c.tendencia || 'sin_datos').palabra}. Ver su progreso`}
        className="flex-1 min-w-0 text-left flex items-center gap-3 active:scale-[0.99]"
      >
        {dentro}
      </button>
      {insignia}
    </div>
  );
}

/* ── 10 y 28 · Los que todavía no cuentan ────────────────────────────────── */
export function MuscleContributionEmpty({ ejercicios = [], accent, onAbrir, vacio }) {
  if (!ejercicios.length) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider mt-3 mb-1.5" style={{ color: COLORS.textMuted }}>
        Todavía sin datos
      </p>
      {/* ⚠️ Se dice por qué están aquí: no restan, no suman, y son por donde
          seguir (apartado 10). */}
      <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>{vacio}</p>
      <div className="space-y-2">
        {ejercicios.map((c) => (
          <MuscleContributionCard key={c.exerciseId} contribucion={c} accent={accent} onAbrir={onAbrir} />
        ))}
      </div>
    </div>
  );
}

/* ── 1 y 25 · La sección entera ──────────────────────────────────────────── */
export function MuscleContributionList({
  contribuciones, accent, onAbrir, onPorQue = null, titulo = 'Ejercicios que contribuyen',
  mostrarSinDatos = true, filtro = 'todos', onFiltro = null,
}) {
  const c = contribuciones || { conDatos: [], sinDatos: [], aviso: '', vacio: '' };
  /* El filtro de la F18 mira la TENDENCIA, que aquí se llama `tendencia`. */
  const paraFiltrar = c.conDatos.map((x) => ({ ...x, estado: x.tendencia || 'sin_datos' }));
  const visibles = onFiltro ? filtrarEjercicios(paraFiltrar, filtro) : paraFiltrar;
  const conSinDatos = mostrarSinDatos && (!onFiltro || filtro === 'todos' || filtro === 'sin_datos');
  return (
    <div>
      <SectionTitle sub={c.aviso}>{titulo}</SectionTitle>
      {/* F18, apartado 20 — los cinco filtros por estado, que esta lista hereda. */}
      {onFiltro && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" role="group" aria-label="Filtros de ejercicios">
          {FILTROS_EJERCICIOS.map((f) => {
            const activo = f.id === filtro;
            return (
              <button
                key={f.id}
                onClick={() => onFiltro(f.id)}
                aria-pressed={activo}
                className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                style={{
                  background: activo ? hexToRgba(accent, 0.16) : COLORS.surface,
                  color: activo ? COLORS.text : COLORS.textMuted,
                  border: `1px solid ${activo ? accent : COLORS.border}`,
                }}
              >
                {f.nombre}
              </button>
            );
          })}
        </div>
      )}
      {visibles.length === 0 ? (
        <EmptyHint text={c.vacio} />
      ) : (
        <div className="space-y-2">
          {visibles.map((x) => (
            <MuscleContributionCard key={x.exerciseId} contribucion={x} accent={accent} onAbrir={onAbrir} onPorQue={onPorQue} />
          ))}
        </div>
      )}
      {conSinDatos && (
        <MuscleContributionEmpty ejercicios={c.sinDatos} accent={accent} onAbrir={onAbrir} vacio={c.vacio} />
      )}
      <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{ETIQUETA_PARTICIPACION}.</p>
    </div>
  );
}

/* ── 7 · El desglose por subgrupos ───────────────────────────────────────── */
export function MuscleContributionBySubgroup({ subgrupos = [], accent, onSubgrupo = null }) {
  if (!subgrupos.length) return null;
  return (
    <div>
      <SectionTitle sub="De dónde sale cada parte del grupo">Por subgrupo</SectionTitle>
      <div className="space-y-2">
        {subgrupos.map((s) => {
          const cuerpo = (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{s.nombre}</p>
                <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
                  {s.sinDatos
                    ? 'Sin datos'
                    : s.ejercicios.map((e) => e.nombre).join(' · ')}
                </p>
              </div>
              {onSubgrupo && <ChevronRight size={15} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
            </>
          );
          const clases = 'w-full text-left rounded-2xl p-3 flex items-center gap-3';
          const estilo = { background: COLORS.surface, border: `1px solid ${COLORS.border}` };
          if (!onSubgrupo) return <div key={s.id} className={clases} style={estilo}>{cuerpo}</div>;
          return (
            <button
              key={s.id}
              onClick={() => onSubgrupo(s.id)}
              aria-label={`${s.nombre}: ${s.sinDatos ? 'sin datos' : `${s.cuantos} ejercicios con datos`}`}
              className={`${clases} active:scale-[0.99]`}
              style={estilo}
            >
              {cuerpo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MuscleContributionList;
