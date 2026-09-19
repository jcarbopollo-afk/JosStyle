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
  detalleDeGrupo, detalleDeSubgrupo,
} from '../lib/detalleMuscular';
/* FIT F20 — la misma explicación que usa Rangos, aquí para el músculo y para
   cada ejercicio (su apartado 2: un solo componente). */
import { RankExplanation, BotonPorQue } from '../components/explicacionRango';
/* FIT F22 — el historial de un rango, el mismo componente en los tres sitios
   (su apartado 30: nada de una sección independiente). */
import { RankHistory, BotonHistorial } from '../components/historialRango';
/* FIT F23 — qué falta para el siguiente rango de ESTE músculo, con los
   ejercicios que más contribuyen debajo (su apartado 16). */
import { RankNextLevelCard } from '../components/siguienteRango';
import { tarjetaSiguienteRango } from '../lib/siguienteRango';
import { explicacionDeMusculo, explicacionDeEjercicio } from '../lib/explicacionRangos';
/* 🔓 FIT F21 — la lista de ejercicios pasa a decir **cuánto aporta cada uno** a
   este músculo, y separa los que todavía no tienen datos. Sustituye a la de la
   F18 (que era la misma lista con menos información): dos listas de lo mismo en
   la misma pantalla acabarían diciendo cosas distintas. */
import { MuscleContributionList, MuscleContributionBySubgroup } from '../components/contribucionMuscular';
import { contribucionesDeMusculo, contribucionesPorSubgrupo } from '../lib/contribucionMuscular';

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
export function MuscleRankHeader({ detalle, accent, onVolver, volverA = 'Rangos', onPorQue = null, onHistorial = null }) {
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
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                {d.grupoNombre ? `${d.grupoNombre} · ${d.nombre}` : d.nombre}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <BotonPorQue onAbrir={onPorQue} etiqueta={`Por qué tu rango en ${d.nombre}`} />
                <BotonHistorial onAbrir={onHistorial} etiqueta={`Historial de tu rango en ${d.nombre}`} />
              </div>
            </div>
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

/* 🔓 **FIT F21 — `MuscleExerciseCard` y `MuscleExerciseList` se retiran.** La
   lista de contribución (`src/components/contribucionMuscular.jsx`) enseña lo
   mismo y además cuánto aporta cada ejercicio al músculo, separa los que no
   tienen datos y hereda estos filtros. Dejar las dos habría dejado dos listas
   del mismo músculo, una al lado de la otra, que se contradicen en cuanto una
   cambie. */

/* ── El detalle de un subgrupo (apartado 6) ──────────────────────────────── */
export function MuscleSubgroupDetail({ detalle, contribuciones, accent, onVolver, onEjercicio, onPorQue = null, onPorQueEjercicio = null, onHistorial = null, siguiente = null }) {
  const [filtro, setFiltro] = useState('todos');
  if (!detalle) return null;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <MuscleRankHeader detalle={detalle} accent={accent} onVolver={onVolver} volverA={detalle.grupoNombre || 'Volver'} onPorQue={onPorQue} onHistorial={onHistorial} />
      {/* 🐛 FIT F23 — ESTA pantalla es OTRO camino de pintado, y el reemplazo
          que puso la tarjeta se coló en los dos: aquí `siguiente` no existía y
          `MuscleSubgroupDetail` reventaba con `siguiente is not defined`. La
          tarjeta llega como PROP, calculada por quien conoce el subgrupo
          abierto. Es la lección de los dos caminos de pintado (FIT F5). */}
      <RankNextLevelCard tarjeta={siguiente} accent={accent} onPorQue={onPorQue} onEjercicio={onEjercicio} />
      <MuscleProgressSummary resumen={detalle.resumen} accent={accent} />
      <MuscleContributionList
        contribuciones={contribuciones}
        accent={accent}
        onAbrir={onEjercicio}
        onPorQue={onPorQueEjercicio}
        filtro={filtro}
        onFiltro={setFiltro}
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
  /* FIT F20 — qué se está explicando: `{ tipo, id }` o nada. */
  const [porQue, setPorQue] = useState(null);
  /* FIT F22 — qué historial está abierto. Estado de PANTALLA, nunca un dato
     guardado (EH F40): por dónde va el dedo no se guarda en `app_data`. */
  const [historial, setHistorial] = useState(null);

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
  /* 🚨 FIT F21, apartado 31 — solo el músculo que se está mirando, y una vez
     por cambio en las sesiones: el grupo si no hay subgrupo abierto, el
     subgrupo si lo hay. */
  const contribuciones = useMemo(
    () => contribucionesDeMusculo(fitness || {}, subgrupo ? { subgrupoId: subgrupo } : { grupoId }, { propios, perfil }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness && fitness.sesiones, fitness && fitness.clasificaciones, grupoId, subgrupo, propios, perfil],
  );
  /* FIT F23 — una sola vez por cambio en las sesiones, como el resto. */
  const siguiente = useMemo(
    () => tarjetaSiguienteRango(
      fitness || {},
      subgrupo ? { tipo: 'subgroup', id: subgrupo } : { tipo: 'muscleGroup', id: grupoId },
      { propios, perfil },
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness && fitness.sesiones, fitness && fitness.clasificaciones, grupoId, subgrupo, propios, perfil],
  );
  const porSubgrupo = useMemo(
    () => (subgrupo ? [] : contribucionesPorSubgrupo(fitness || {}, grupoId, { propios, perfil })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness && fitness.sesiones, fitness && fitness.clasificaciones, grupoId, subgrupo, propios, perfil],
  );

  if (!detalle) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <EmptyHint text="Ese grupo muscular ya no está." />
        <GhostBtn icon={ChevronLeft} onClick={onVolver}>Volver a Rangos</GhostBtn>
      </div>
    );
  }

  /* La explicación, que es la misma para las tres cosas (F20, apartado 2). */
  const hoja = porQue ? (
    <RankExplanation
      explicacion={porQue.tipo === 'ejercicio'
        ? explicacionDeEjercicio(fitness || {}, porQue.id, { propios, perfil })
        : explicacionDeMusculo(fitness || {}, porQue.tipo === 'grupo' ? { grupoId: porQue.id } : { subgrupoId: porQue.id }, { propios, perfil })}
      accent={accent}
      onCerrar={() => setPorQue(null)}
      onProgreso={porQue.tipo === 'ejercicio' && onEjercicio ? () => { const id = porQue.id; setPorQue(null); onEjercicio(id); } : null}
      /* 🔓 FIT F22 — desde la explicación se pasa al historial, y esta hoja se
         CIERRA al hacerlo: dos overlays apilados dejan el de abajo pulsable
         por los bordes. Es el único sitio desde el que se llega al historial
         de un EJERCICIO, que es donde se pregunta (su apartado 30). */
      onHistorial={() => {
        const tipo = { ejercicio: 'exercise', grupo: 'muscleGroup', subgrupo: 'subgroup' }[porQue.tipo];
        const id = porQue.id;
        setPorQue(null);
        setHistorial({ tipo, id });
      }}
    />
  ) : null;

  /* FIT F22 — y el historial, que es el mismo componente para las tres cosas
     (su apartado 30). ⚠️ Los tipos son los de `TIPOS_ENTIDAD`, no los de
     `porQue`: «grupo» aquí es `muscleGroup` allí. */
  const hojaHistorial = historial ? (
    <RankHistory
      fitness={fitness || {}}
      destino={historial}
      propios={propios}
      perfil={perfil}
      accent={accent}
      onCerrar={() => setHistorial(null)}
      onProgreso={historial.tipo === 'exercise' && onEjercicio ? () => { const id = historial.id; setHistorial(null); onEjercicio(id); } : null}
    />
  ) : null;

  if (detalleSub) {
    return (
      <>
        <MuscleSubgroupDetail
          detalle={detalleSub}
          contribuciones={contribuciones}
          accent={accent}
          onVolver={() => setSubgrupo(null)}
          onEjercicio={onEjercicio}
          onPorQue={() => setPorQue({ tipo: 'subgrupo', id: detalleSub.id })}
          onPorQueEjercicio={(id) => setPorQue({ tipo: 'ejercicio', id })}
          onHistorial={() => setHistorial({ tipo: 'subgroup', id: detalleSub.id })}
          siguiente={siguiente}
        />
        {hoja}
        {hojaHistorial}
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <MuscleRankHeader
        detalle={detalle}
        accent={accent}
        onVolver={onVolver}
        volverA="Rangos"
        onPorQue={() => setPorQue({ tipo: 'grupo', id: detalle.id })}
        onHistorial={() => setHistorial({ tipo: 'muscleGroup', id: detalle.id })}
      />
      {/* FIT F23, apartado 16 — «ESPALDA · Avanzado · 72 % hacia Experto», con
          los ejercicios que más contribuyen justo debajo. */}
      <RankNextLevelCard
        tarjeta={siguiente}
        accent={accent}
        onPorQue={() => setPorQue({ tipo: 'grupo', id: detalle.id })}
        onEjercicio={onEjercicio}
      />
      <MuscleProgressSummary resumen={detalle.resumen} accent={accent} />
      <MuscleSubgroupList subgrupos={detalle.subgrupos} accent={accent} onAbrir={setSubgrupo} />
      <MuscleContributionList
        contribuciones={contribuciones}
        accent={accent}
        onAbrir={onEjercicio}
        onPorQue={(id) => setPorQue({ tipo: 'ejercicio', id })}
        filtro={filtro}
        onFiltro={setFiltro}
      />
      <MuscleContributionBySubgroup subgrupos={porSubgrupo} accent={accent} onSubgrupo={setSubgrupo} />
      {hoja}
      {hojaHistorial}
    </div>
  );
}
