/* ===========================================================================
   ENTREGA 4 · FASE 18/45 — EL DETALLE DE UN GRUPO MUSCULAR, LA PANTALLA

   *"El usuario debe poder entender de dónde procede su rango muscular."*

   Rangos → Espalda → Dorsales → Dominadas → el progreso del ejercicio (F12).

   🚨 **Nada se calcula aquí** (apartado 24): el rango del grupo y del subgrupo
   son los de la F15, la tendencia de cada ejercicio es la de la F11, y qué
   ejercicios tocan el músculo lo dice el catálogo. Esta pantalla enseña lo que
   `src/lib/detalleMuscular.js` ya ha juntado.

   ⚠️ **Sin datos no es mal rendimiento** (apartado 14): un subgrupo sin
   entrenar dice «Sin datos», sin barra y sin porcentaje.
   =========================================================================== */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Circle } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, GhostBtn, EmptyHint } from '../components/ui';
import { RankBadge, RankLabel } from '../components/rangos';
import { iconoDeGrupo } from '../components/iconosFitness';
import { nivelRango, SIN_RANGO } from '../lib/fitness';
import { AVISO_RENDIMIENTO } from '../lib/progresoMuscular';
import {
  detalleDeGrupo, detalleDeSubgrupo, filtrarEjercicios, FILTROS_EJERCICIOS,
} from '../lib/detalleMuscular';

/* Los cuatro estados del apartado 9, **con icono y con palabra**: el color solo
   no vale (apartado 29). Son los mismos que enseña Progreso. */
const ESTADOS = {
  mejora: { icono: TrendingUp, palabra: 'Mejorando' },
  estable: { icono: Minus, palabra: 'Estable' },
  descenso: { icono: TrendingDown, palabra: 'Descenso' },
  sin_datos: { icono: Circle, palabra: 'Sin datos' },
};
const estadoDe = (id) => ESTADOS[id] || ESTADOS.sin_datos;

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

/* ── 2, 3 y 4 · La cabecera ──────────────────────────────────────────────── */
export function MuscleRankHeader({ detalle, accent, onVolver, volverA = 'Rangos' }) {
  const d = detalle;
  const Icono = iconoDeGrupo(d.grupoId || d.id);
  const siguiente = d.siguiente;
  const nivelSiguiente = siguiente && siguiente.siguiente ? nivelRango(siguiente.siguiente) : null;
  return (
    <div>
      {onVolver && (
        <div className="mb-2">
          <GhostBtn icon={ChevronLeft} onClick={onVolver}>{volverA}</GhostBtn>
        </div>
      )}
      <Card>
        <div className="flex items-center gap-4">
          <RankBadge
            rank={d.sinRango ? null : d.rango.rango}
            size="lg"
            state={d.sinRango ? 'no_disponible' : 'actual'}
            locked={d.sinRango}
            accent={accent}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
              {d.grupoNombre ? `${d.grupoNombre} · ${d.nombre}` : d.nombre}
            </p>
            <p className="text-2xl font-extrabold leading-tight" style={{ color: d.sinRango ? COLORS.text : accent, fontFamily: "'Manrope', sans-serif" }}>
              {d.sinRango ? SIN_RANGO.nombre : d.rango.nombre}
            </p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              {d.sinRango ? d.sinDatosTexto : 'Rendimiento general'}
            </p>
          </div>
        </div>

        {/* Apartado 2 — de dónde sale, en números que NO son progreso físico. */}
        {!d.sinRango && (
          <div className="mt-3 pt-3 flex flex-wrap gap-x-4 gap-y-1" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            {(d.cabecera || [d.resumen.cobertura]).map((t) => (
              <span key={t} className="text-[11px]" style={{ color: COLORS.textMuted }}>{t}</span>
            ))}
          </div>
        )}
        {/* Apartado 15 — la transparencia, en una línea y solo si dice algo. */}
        {d.nota && <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>{d.nota}</p>}

        {/* Apartado 4 — el camino al siguiente rango, y en el diez, el techo. */}
        {siguiente && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            {nivelSiguiente ? (
              <>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Próximo rango</span>
                  <span className="text-xs font-semibold" style={{ color: COLORS.text }}>{d.rango.nombre} → {nivelSiguiente.nombre}</span>
                </div>
                <Barra fraccion={siguiente.fraccion} accent={accent} etiqueta={`Camino hacia ${nivelSiguiente.nombre}`} />
              </>
            ) : (
              <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Rango máximo de la escala</p>
            )}
          </div>
        )}
        <p className="text-[10px] mt-3" style={{ color: COLORS.textMuted }}>{AVISO_RENDIMIENTO}</p>
      </Card>
    </div>
  );
}

/* ── 12 · Progreso reciente ──────────────────────────────────────────────── */
export function MuscleProgressSummary({ resumen, accent }) {
  if (!resumen || !resumen.hayAlgo) return null;
  const filas = [
    { id: 'mejora', n: resumen.mejorando, texto: 'mejorando' },
    { id: 'estable', n: resumen.estables, texto: 'estables' },
    { id: 'descenso', n: resumen.descenso, texto: 'en descenso' },
  ];
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Progreso reciente</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {filas.map((f) => {
          const Icono = estadoDe(f.id).icono;
          return (
            <span key={f.id} className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.text }}>
              <Icono size={13} style={{ color: f.n > 0 ? accent : COLORS.textMuted }} aria-hidden="true" />
              {f.n} {f.texto}
            </span>
          );
        })}
      </div>
      <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{resumen.cobertura}</p>
    </Card>
  );
}

/* ── 5 · Los subgrupos ───────────────────────────────────────────────────── */
export function MuscleSubgroupCard({ subgrupo, accent, onAbrir }) {
  const s = subgrupo;
  const dentro = (
    <>
      <RankBadge rank={s.rango} size="sm" state={s.sinRango ? 'no_disponible' : 'actual'} locked={s.sinRango} accent={accent} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{s.nombre}</p>
        <div className="flex items-baseline gap-2">
          <RankLabel rank={s.rango} className="text-xs font-bold" />
          <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{s.datos}</span>
        </div>
        {s.siguiente && (
          <div className="mt-1.5">
            <Barra fraccion={s.siguiente.fraccion} accent={accent} etiqueta={`${s.nombre}, camino al siguiente rango`} />
          </div>
        )}
      </div>
      {onAbrir && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
    </>
  );
  const clases = 'hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3';
  const estilo = { background: COLORS.surface, border: `1px solid ${COLORS.border}` };
  if (!onAbrir) return <div className={clases} style={estilo}>{dentro}</div>;
  return (
    <button
      onClick={() => onAbrir(s.id)}
      aria-label={`${s.nombre}: ${s.nombreRango}. Ver ejercicios`}
      className={`${clases} active:scale-[0.99]`}
      style={estilo}
    >
      {dentro}
    </button>
  );
}

export function MuscleSubgroupList({ subgrupos = [], accent, onAbrir }) {
  if (!subgrupos.length) return null;
  return (
    <div>
      <SectionTitle sub="De dónde sale el rango del grupo">Subgrupos</SectionTitle>
      <div className="space-y-2">
        {subgrupos.map((s) => <MuscleSubgroupCard key={s.id} subgrupo={s} accent={accent} onAbrir={onAbrir} />)}
      </div>
    </div>
  );
}

/* ── 7 · La contribución ─────────────────────────────────────────────────── */
/* *"No mostrar simplemente: Dominadas pertenece a Dorsales"*: se dice cuánto
   pone ahí, que es lo que de verdad pesa en el rango. */
export function MuscleContribution({ texto: t }) {
  if (!t) return null;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>{t}</span>;
}

/* ── 6, 9, 10 y 11 · Los ejercicios ──────────────────────────────────────── */
export function MuscleExerciseCard({ ejercicio, accent, onAbrir }) {
  const e = ejercicio;
  const est = estadoDe(e.estado);
  const Icono = est.icono;
  const dentro = (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{e.nombre}</p>
          <MuscleContribution texto={e.contribucion} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px]" style={{ color: COLORS.textMuted }}>
            <Icono size={11} aria-hidden="true" />
            {est.palabra}
          </span>
          {/* Apartado 10 — la última marca, con la unidad que toque (la pone la F11). */}
          {e.ultima && <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{e.ultima}</span>}
          {e.cambio && <span className="text-[11px]" style={{ color: COLORS.textMuted }}>{e.cambio}</span>}
          {/* FIT F17 — si el nivel es una estimación suya, se dice. */}
          {e.estimado && <span className="text-[10px]" style={{ color: COLORS.textMuted }}>Nivel estimado</span>}
          {e.aviso && <span className="text-[11px]" style={{ color: COLORS.textMuted }}>{e.aviso}</span>}
        </div>
      </div>
      {e.rango ? <RankBadge rank={e.rango} size="sm" state="actual" accent={accent} /> : null}
      {onAbrir && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
    </>
  );
  const clases = 'hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3';
  const estilo = { background: COLORS.surface, border: `1px solid ${COLORS.border}` };
  /* ⚠️ Un ejercicio que ya no está en el catálogo no lleva a ninguna parte: la
     pantalla de progreso necesita el ejercicio (apartado 27). */
  if (!onAbrir || !e.existe) return <div className={clases} style={estilo}>{dentro}</div>;
  return (
    <button
      onClick={() => onAbrir(e.exerciseId)}
      aria-label={`${e.nombre}: ${est.palabra}. Ver su progreso`}
      className={`${clases} active:scale-[0.99]`}
      style={estilo}
    >
      {dentro}
    </button>
  );
}

export function MuscleExerciseList({ ejercicios = [], filtro = 'todos', onFiltro = null, accent, onAbrir }) {
  const visibles = filtrarEjercicios(ejercicios, filtro);
  return (
    <div>
      <SectionTitle sub="Los que tocan este músculo, según el catálogo">Ejercicios</SectionTitle>
      {/* Apartado 20 — los cinco filtros por estado, y ninguno más. */}
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
        <EmptyHint text="Ningún ejercicio de este músculo está en ese estado." />
      ) : (
        <div className="space-y-2">
          {visibles.map((e) => <MuscleExerciseCard key={e.exerciseId} ejercicio={e} accent={accent} onAbrir={onAbrir} />)}
        </div>
      )}
    </div>
  );
}

/* ── El detalle de un subgrupo (apartado 6) ──────────────────────────────── */
export function MuscleSubgroupDetail({ detalle, accent, onVolver, onEjercicio }) {
  const [filtro, setFiltro] = useState('todos');
  if (!detalle) return null;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <MuscleRankHeader detalle={detalle} accent={accent} onVolver={onVolver} volverA={detalle.grupoNombre || 'Volver'} />
      <MuscleProgressSummary resumen={detalle.resumen} accent={accent} />
      <MuscleExerciseList
        ejercicios={detalle.ejercicios}
        filtro={filtro}
        onFiltro={setFiltro}
        accent={accent}
        onAbrir={onEjercicio}
      />
    </div>
  );
}

/* ── La pantalla ─────────────────────────────────────────────────────────── */
export default function DetalleMuscularView({
  fitness = null, propios = [], perfil = null, grupoId, accent,
  onVolver = null, onEjercicio = null,
}) {
  /* Qué subgrupo está abierto: estado de pantalla, nunca un dato. */
  const [subgrupo, setSubgrupo] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  /* 🚨 Apartado 31 — **solo el grupo que se ha pedido**, y una vez por cambio
     en las sesiones: recorrer los siete grupos aquí sería calcular seis de más. */
  const detalle = useMemo(
    () => detalleDeGrupo(fitness || {}, grupoId, { propios, perfil }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness && fitness.sesiones, fitness && fitness.clasificaciones, grupoId, propios, perfil],
  );
  const detalleSub = useMemo(
    () => (subgrupo ? detalleDeSubgrupo(fitness || {}, subgrupo, { propios, perfil }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness && fitness.sesiones, fitness && fitness.clasificaciones, subgrupo, propios, perfil],
  );

  if (!detalle) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <EmptyHint text="Ese grupo muscular ya no está." />
        <GhostBtn icon={ChevronLeft} onClick={onVolver}>Volver a Rangos</GhostBtn>
      </div>
    );
  }

  if (detalleSub) {
    return (
      <MuscleSubgroupDetail
        detalle={detalleSub}
        accent={accent}
        onVolver={() => setSubgrupo(null)}
        onEjercicio={onEjercicio}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <MuscleRankHeader detalle={detalle} accent={accent} onVolver={onVolver} volverA="Rangos" />
      <MuscleProgressSummary resumen={detalle.resumen} accent={accent} />
      <MuscleSubgroupList subgrupos={detalle.subgrupos} accent={accent} onAbrir={setSubgrupo} />
      <MuscleExerciseList
        ejercicios={detalle.ejercicios}
        filtro={filtro}
        onFiltro={setFiltro}
        accent={accent}
        onAbrir={onEjercicio}
      />
    </div>
  );
}
