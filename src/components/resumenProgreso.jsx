import React, { useState, useMemo } from 'react';
import {
  ChevronRight, Camera, Play, Target, Dumbbell, Columns2, Calendar, Award,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO } from '../lib/helpers';
import { Card, GhostBtn, PrimaryButton, SectionTitle, EmptyHint } from './ui';
import { iconoDeGrupo } from './iconosFitness';
import { RankBadge } from './rangos';
import { useUrlsFirmadas } from './fotosProgreso';
import { fotosEnOrden } from '../lib/fotosProgreso';
import {
  centroDeProgreso, FILTROS_TIMELINE, PERIODOS_RESUMEN, VER_TODO, FOTOS_RESUMEN_MAX,
} from '../lib/resumenProgreso';

/* ===========================================================================
   ENTREGA 4 · FASE 28/45 — EL CENTRO DE SEGUIMIENTO

   *"Fitness → Progreso debe sentirse como un verdadero centro de seguimiento
   personal"* (apartado 34), conectando entrenamientos, ejercicios, músculos,
   rangos, objetivos y fotos **sin mezclarlos artificialmente**.

   🚨 **AQUÍ NO SE CALCULA NADA** (apartado 21). Todo llega ya resuelto de
   `src/lib/resumenProgreso.js`, que a su vez solo reparte lo que decidieron los
   seis motores. Es la F16 con la pantalla de Rangos otra vez: la librería
   redacta, la vista dibuja.

   ⚠️ **Y una vista previa no es la tarjeta de su sección** (apartados 22 y 26):
   aquí caben cuatro ejercicios, cuatro músculos, tres objetivos y tres fotos,
   en una línea cada uno. La tarjeta entera —con su barra, su resumen y su
   detalle— vive en su sección, a un toque. Lo que **sí** se comparte es la
   etiqueta de estado, que se importa de aquí en vez de escribirse dos veces.
   =========================================================================== */

/* ── El estado, con símbolo y palabra (FIT F12, apartados 15 y 34) ───────────
   🚨 Vive aquí desde la FIT F28 y `ProgresoView` la importa: la vista previa la
   necesita y la vista importa la vista previa, así que dejarla allí sería un
   ciclo entre los dos archivos (FIT F24 y F27). Una sola dirección. */
export function EtiquetaEstado({ estado, nombre, simbolo, accent }) {
  const destacado = estado === 'mejora';
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
      style={{
        background: destacado ? hexToRgba(accent, 0.14) : hexToRgba(COLORS.border, 0.45),
        color: destacado ? accent : COLORS.textMuted,
      }}
    >
      <span aria-hidden="true">{simbolo}</span>
      {nombre}
    </span>
  );
}

/* ── El estado de un músculo, con su aviso de poca información (FIT F13) ─── */
export function EstadoMuscular({ estado, nombre, simbolo, accent, pocaInformacion = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <EtiquetaEstado estado={estado} nombre={nombre} simbolo={simbolo} accent={accent} />
      {pocaInformacion && (
        <span className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Poca información</span>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LAS PIEZAS COMUNES (apartado 20)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * La caja de una sección del resumen: título, su «Ver todo» cuando queda algo
 * fuera (apartado 26) y el contenido.
 *
 * ⚠️ *"Ver todo"* **solo si hay más**: uno que lleve a la misma lista que ya
 * estás viendo es un botón que no hace nada (E3 F46, regla 8).
 */
export function ProgressSummaryCard({
  titulo, sub = '', accent, hayMas = false, onVerTodo = null, etiquetaVerTodo = VER_TODO, children,
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <SectionTitle sub={sub}>{titulo}</SectionTitle>
        </div>
        {hayMas && onVerTodo && (
          <button
            onClick={onVerTodo}
            aria-label={`${etiquetaVerTodo}: ${titulo}`}
            className="text-xs font-bold shrink-0 rounded-lg px-2 py-1.5 toque-44 active:scale-95"
            style={{ color: accent }}
          >
            {etiquetaVerTodo}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/** Una cifra grande con su nombre. ⚠️ Nunca un porcentaje combinado: lo que
 *  entra aquí es un recuento de UNA fuente (apartado 10). */
export function ProgressMetricCard({ valor, nombre, sub = '', icon: Icon = null, accent, onClick = null }) {
  const cuerpo = (
    <>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
            <Icon size={16} />
          </span>
        )}
        <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{valor}</p>
      </div>
      <p className="text-[11px] font-semibold mt-1.5" style={{ color: COLORS.textMuted }}>{nombre}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{sub}</p>}
    </>
  );
  if (!onClick) return <Card>{cuerpo}</Card>;
  return (
    <button
      onClick={onClick}
      aria-label={`${valor} ${nombre}. Ver`}
      className="hub-card w-full text-left rounded-2xl p-3.5 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      {cuerpo}
    </button>
  );
}

/* ── Una fila de vista previa: nombre a la izquierda, estado a la derecha ── */
function FilaPreview({ etiquetaAria, icono: Icono = null, nombre, secundario = '', derecha, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={etiquetaAria}
      className="hub-card w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      {Icono && (
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
          <Icono size={16} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold truncate" style={{ color: COLORS.text }}>{nombre}</span>
        {secundario && <span className="block text-[11px] truncate" style={{ color: COLORS.textMuted }}>{secundario}</span>}
      </span>
      {derecha}
      <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LAS SEIS VISTAS PREVIAS (apartados 3 a 9)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 9 — el rango global y su evolución. Al pulsarlo → Rangos. */
export function ProgressRankPreview({ bloque, accent, onIr }) {
  const b = bloque;
  if (!b || b.error) return null;
  if (!b.hay) {
    return (
      <Card>
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Tu rango</p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{b.vacio}</p>
      </Card>
    );
  }
  return (
    <button
      onClick={onIr}
      aria-label={`Tu rango: ${b.nombre}. ${b.evolucion.texto}. Ver tus rangos`}
      className="hub-card w-full text-left rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <RankBadge rank={b.rango} size="md" accent={accent} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold" style={{ color: COLORS.textMuted }}>Tu rango</p>
        <p className="text-lg font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{b.nombre}</p>
        {/* ⚠️ Ni una puntuación aquí: un número suelto de 0 a 1000 en un resumen
            que junta seis sistemas se leería como la métrica global que prohíbe
            el apartado 10. */}
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{b.evolucion.texto}</p>
        {b.confianzaNombre && (
          <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{b.confianzaNombre}</p>
        )}
      </div>
      <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/** Apartado 4 — *"Ejercicios en progreso"*, con 2-4 relevantes de la F11/F12. */
export function ProgressExercisePreview({ bloque, accent, onAbrir, onVerTodo }) {
  const b = bloque;
  if (!b) return null;
  return (
    <ProgressSummaryCard titulo="Ejercicios en progreso" accent={accent} hayMas={b.hayMas} onVerTodo={onVerTodo}>
      {b.error ? (
        <EmptyHint text="Tus ejercicios no están disponibles ahora mismo." />
      ) : !b.hay ? (
        <EmptyHint text={b.vacio} />
      ) : (
        <div className="space-y-1.5">
          {b.ejercicios.map((e) => (
            <FilaPreview
              key={e.exerciseId}
              etiquetaAria={`${e.nombre}: ${e.estadoNombre}. Ver su progreso`}
              icono={Dumbbell}
              nombre={e.nombre}
              /* 🚨 El cambio de verdad, que es lo que ya enseñaba el Resumen de
                 la F12: «62,5 kg × 8 → 62,5 kg × 10». Rediseñar la pantalla no
                 puede llevarse una función (E3 F43), y esto no es una métrica
                 nueva: son los dos campos de la MISMA tarjeta de la F12. */
              secundario={e.anterior ? `${e.anterior} → ${e.ultima}` : e.ultima}
              accent={accent}
              onClick={() => onAbrir(e.exerciseId)}
              derecha={<EtiquetaEstado estado={e.estado} nombre={e.estadoNombre} simbolo={e.simbolo} accent={accent} />}
            />
          ))}
        </div>
      )}
    </ProgressSummaryCard>
  );
}

/** Apartado 5 — *"Progreso muscular"*, con algunos grupos relevantes. */
export function ProgressMusclePreview({ bloque, accent, onAbrir, onVerTodo }) {
  const b = bloque;
  if (!b) return null;
  return (
    <ProgressSummaryCard titulo="Progreso muscular" sub={b.aviso} accent={accent} hayMas={b.hayMas} onVerTodo={onVerTodo}>
      {b.error ? (
        <EmptyHint text="El progreso muscular no está disponible ahora mismo." />
      ) : !b.hay ? (
        <EmptyHint text={b.vacio} />
      ) : (
        <div className="space-y-1.5">
          {b.grupos.map((g) => {
            const Icono = iconoDeGrupo(g.icono || g.id);
            return (
              <FilaPreview
                key={g.id}
                etiquetaAria={`${g.nombre}: ${g.estadoNombre}. ${g.resumen}`}
                icono={Icono}
                nombre={g.nombre}
                accent={accent}
                onClick={() => onAbrir(g.id)}
                derecha={<EstadoMuscular estado={g.estado} nombre={g.estadoNombre} simbolo={g.simbolo} accent={accent} pocaInformacion={g.pocaInformacion} />}
              />
            );
          })}
        </div>
      )}
    </ProgressSummaryCard>
  );
}

/** Apartado 8 — 1-3 objetivos activos, con la barra del sistema de la F14.
 *  ⚠️ Sin botón de crear: *"No crear objetivos nuevos desde este resumen"*. */
export function ProgressGoalPreview({ bloque, accent, onAbrir, onVerTodo }) {
  const b = bloque;
  if (!b) return null;
  return (
    <ProgressSummaryCard titulo="Tus objetivos" accent={accent} hayMas={b.hayMas} onVerTodo={onVerTodo}>
      {b.error ? (
        <EmptyHint text="Tus objetivos no están disponibles ahora mismo." />
      ) : !b.hay ? (
        <EmptyHint text={b.vacio} />
      ) : (
        <div className="space-y-1.5">
          {b.objetivos.map((o) => (
            <button
              key={o.id}
              onClick={() => onAbrir(o.id)}
              aria-label={`Objetivo ${o.nombre}: ${o.objetivoTexto}. ${o.progresoTexto}. Ver`}
              className="hub-card w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 active:scale-[0.99]"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
                <Target size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate" style={{ color: COLORS.text }}>{o.nombre}</span>
                <span className="block text-xs font-extrabold tabular-nums" style={{ color: o.sinDatos ? COLORS.textMuted : COLORS.text }}>{o.objetivoTexto}</span>
                {/* 🚨 Sin datos NO se dibuja una barra vacía (F14, apartado 23). */}
                {o.porcentaje !== null && (
                  <span className="block h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: hexToRgba(COLORS.border, 0.6) }} aria-hidden="true">
                    <span className="block h-full rounded-full" style={{ width: `${o.porcentaje}%`, background: accent }} />
                  </span>
                )}
                <span className="block text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{o.progresoTexto}</span>
              </span>
              <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </ProgressSummaryCard>
  );
}

/**
 * Apartados 6 y 7 — la última foto, la anterior si existe, su fecha, «Ver
 * progreso» y, con dos o más, «Comparar progreso» directo al comparador.
 *
 * 🚨 Apartado 30 — si las fotos no se pueden leer, este bloque lo dice **y el
 * resto de la pantalla sigue entero**. Y una foto rota se avisa sola: lo que
 * falla no es firmar, es cargar (FIT F27).
 */
export function ProgressPhotoPreview({ bloque, urls = {}, fallidas = {}, accent, onIr, onComparar, onFallo = null }) {
  const b = bloque;
  if (!b) return null;
  if (b.error) {
    return (
      <ProgressSummaryCard titulo="Progreso físico" accent={accent}>
        <Card>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>{b.aviso}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{b.detalle}</p>
        </Card>
      </ProgressSummaryCard>
    );
  }
  return (
    <ProgressSummaryCard titulo="Progreso físico" accent={accent}>
      {!b.hay ? (
        <Card>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
              <Camera size={19} />
            </span>
            <p className="text-sm min-w-0 flex-1" style={{ color: COLORS.text }}>{b.vacio}</p>
          </div>
          <div className="mt-3">
            <GhostBtn icon={Camera} onClick={onIr}>{b.cta}</GhostBtn>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex gap-2">
            {b.recientes.map((f) => (
              <button
                key={f.id}
                onClick={onIr}
                aria-label={`Foto del ${f.etiqueta}. Ver tus fotos de progreso`}
                className="relative flex-1 rounded-xl overflow-hidden active:scale-[0.98]"
                style={{ background: hexToRgba(COLORS.border, 0.4), aspectRatio: '3 / 4' }}
              >
                {urls[f.id] && !fallidas[f.id] ? (
                  <img
                    src={urls[f.id]}
                    alt={`Foto de progreso del ${f.etiqueta}`}
                    className="w-full h-full object-cover"
                    onError={onFallo ? () => onFallo(f.id) : undefined}
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] px-1 text-center" style={{ color: COLORS.textMuted }}>
                    {fallidas[f.id] ? 'No se ha podido cargar' : f.etiqueta}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
            Última: {b.ultima.etiqueta}
            {b.anterior ? ` · anterior: ${b.anterior.etiqueta}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <GhostBtn icon={Camera} onClick={onIr}>{b.cta}</GhostBtn>
            {/* Apartado 7 — directo al comparador, con la más antigua y la más
                reciente ya elegidas. Sin dos fotos no se pinta (regla 8). */}
            {b.comparacion.hay && (
              <GhostBtn icon={Columns2} onClick={() => onComparar(b.comparacion)}>{b.comparacion.cta}</GhostBtn>
            )}
          </div>
          {b.comparacion.hay && (
            <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
              {b.comparacion.etiquetaAntes} → {b.comparacion.etiquetaDespues} · {b.comparacion.texto}
            </p>
          )}
        </Card>
      )}
    </ProgressSummaryCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA LÍNEA TEMPORAL (apartados 12 a 15)
   ═══════════════════════════════════════════════════════════════════════════ */

const ICONO_EVENTO = {
  photo: Camera,
  workout: Dumbbell,
  rankChange: Award,
  goalCompleted: Target,
  goalCreated: Target,
};

export function ProgressTimelineItem({ evento, accent, onAbrir }) {
  const e = evento;
  const Icono = ICONO_EVENTO[e.tipo] || Calendar;
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center shrink-0" aria-hidden="true">
        <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
          <Icono size={15} />
        </span>
        <span className="flex-1 w-px mt-1" style={{ background: COLORS.border }} />
      </div>
      <button
        onClick={() => onAbrir(e)}
        aria-label={`${e.etiqueta}. ${e.tipoNombre}: ${e.titulo}. Ver`}
        className="min-w-0 flex-1 text-left rounded-xl px-3 py-2 mb-2 active:scale-[0.99]"
        style={{ background: hexToRgba(COLORS.border, 0.25) }}
      >
        <p className="text-[10px] font-bold tracking-wide" style={{ color: COLORS.textMuted }}>{e.etiqueta}</p>
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text }}>{e.titulo}</p>
        {e.detalle && <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>{e.detalle}</p>}
      </button>
    </li>
  );
}

export function ProgressTimeline({ timeline, accent, filtro, onFiltro, onAbrir }) {
  const t = timeline;
  if (!t) return null;
  return (
    <ProgressSummaryCard titulo="Línea temporal" accent={accent}>
      {/* Apartado 15 — cinco pastillas y ya. ⚠️ Con su recuento: una que dejaría
          la lista vacía se apaga, en vez de vaciar la pantalla sin avisar. */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5" role="group" aria-label="Filtrar la línea temporal">
        {t.porFiltro.map((f) => {
          const activo = filtro === f.id;
          const apagado = f.cuantos === 0 && !activo;
          return (
            <button
              key={f.id}
              onClick={() => onFiltro(f.id)}
              disabled={apagado}
              aria-pressed={activo}
              className="h-9 px-3 rounded-xl text-xs font-semibold shrink-0 toque-44 active:scale-95"
              style={{
                background: activo ? accent : hexToRgba(COLORS.border, 0.45),
                color: activo ? COLORS.textOnAccent : COLORS.text,
                opacity: apagado ? 0.45 : 1,
              }}
            >
              {f.nombre} {f.cuantos}
            </button>
          );
        })}
      </div>
      {!t.hay ? (
        <EmptyHint text={t.vacio} />
      ) : (
        <ul className="mt-2">
          {t.eventos.map((e) => <ProgressTimelineItem key={e.id} evento={e} accent={accent} onAbrir={onAbrir} />)}
        </ul>
      )}
      {t.hayMas && (
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
          Se enseñan los {t.eventos.length} más recientes de {t.total}.
        </p>
      )}
    </ProgressSummaryCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL CENTRO (apartados 1, 2, 17, 18, 19, 25 y 29)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 17 — *"Tu progreso empieza aquí."*, con sus salidas de verdad. */
function Onboarding({ onboarding, accent, acciones }) {
  return (
    <Card>
      <div className="py-3 text-center">
        <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{onboarding.titulo}</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{onboarding.texto}</p>
        <div className="mt-4 max-w-xs mx-auto space-y-2">
          {onboarding.acciones.map((a, i) => (
            i === 0
              ? <PrimaryButton key={a.id} accent={accent} icon={Play} onClick={acciones[a.id]}>{a.texto}</PrimaryButton>
              : <GhostBtn key={a.id} icon={a.id === 'foto' ? Camera : Target} onClick={acciones[a.id]}>{a.texto}</GhostBtn>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * `ProgressOverview` — la pantalla del apartado 2.
 *
 * ⚠️ El orden lo manda `centroDeProgreso` (`resumen.orden`), no este archivo:
 * así la jerarquía del apartado 25 está escrita **una sola vez** y ninguna
 * pantalla la decide (FIT F25 con `RankDashboard`).
 */
export function ProgressOverview({
  fitness, fotos = [], propios = [], perfil = null, accent, hoy = todayISO(),
  onIrASeccion, onAbrirEjercicio, onAbrirMusculo, onAbrirObjetivo, onVerSesion,
  onIrAHistorial = null, onIrARangos = null, onComparar = null,
  onEntrenar = null, onAnadirFoto = null, onCrearObjetivo = null,
}) {
  const [periodo, setPeriodo] = useState('todo');
  const [filtro, setFiltro] = useState('todos');

  /* Apartado 22 — solo se firman las fotos que se van a ver. */
  const orden = useMemo(() => fotosEnOrden(fotos), [fotos]);
  const primeras = useMemo(() => orden.slice(0, FOTOS_RESUMEN_MAX), [orden]);
  const { urls, fallidas, marcarFallida } = useUrlsFirmadas(primeras, { porTanda: FOTOS_RESUMEN_MAX });
  /* 🚨 Apartado 30 — «las fotos no se pueden cargar» es que **ninguna** de las
     que se iban a enseñar llegó. Una rota no apaga el bloque (FIT F27). */
  const errorFotos = primeras.length > 0 && primeras.every((f) => !!fallidas[f.id]);

  const resumen = useMemo(
    () => centroDeProgreso(fitness, fotos, {
      propios,
      perfil,
      periodo,
      hoy,
      filtroTimeline: filtro,
      errorFotos,
      puede: { entrenar: !!onEntrenar, foto: !!onAnadirFoto, objetivo: !!onCrearObjetivo },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness, fotos, propios, perfil, periodo, hoy, filtro, errorFotos, onEntrenar, onAnadirFoto, onCrearObjetivo],
  );

  if (resumen.error) {
    return (
      <Card>
        <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{resumen.error.titulo}</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{resumen.error.texto}</p>
      </Card>
    );
  }

  const b = resumen.bloques;
  const irA = (id) => () => onIrASeccion(id);

  if (resumen.onboarding) {
    return (
      <Onboarding
        onboarding={resumen.onboarding}
        accent={accent}
        acciones={{ entrenar: onEntrenar, foto: onAnadirFoto, objetivo: onCrearObjetivo }}
      />
    );
  }

  const trozo = {
    rango: (
      <ProgressRankPreview
        key="rango"
        bloque={b.rango}
        accent={accent}
        onIr={onIrARangos || irA('musculos')}
      />
    ),
    entrenamientos: b.entrenamientos && !b.entrenamientos.error ? (
      <div key="entrenamientos" className="grid grid-cols-2 gap-2">
        <ProgressMetricCard
          valor={b.entrenamientos.total}
          nombre={b.entrenamientos.total === 1 ? 'Entrenamiento registrado' : 'Entrenamientos registrados'}
          sub={b.entrenamientos.textoPeriodo}
          icon={Dumbbell}
          accent={accent}
          onClick={onIrAHistorial}
        />
        <ProgressMetricCard
          valor={resumen.objetivosActivos}
          nombre={resumen.objetivosActivos === 1 ? 'Objetivo activo' : 'Objetivos activos'}
          icon={Target}
          accent={accent}
          onClick={irA('objetivos')}
        />
      </div>
    ) : null,
    ejercicios: (
      <ProgressExercisePreview key="ejercicios" bloque={b.ejercicios} accent={accent} onAbrir={onAbrirEjercicio} onVerTodo={irA('ejercicios')} />
    ),
    fotos: (
      <ProgressPhotoPreview
        key="fotos"
        bloque={b.fotos}
        urls={urls}
        fallidas={fallidas}
        accent={accent}
        onIr={irA('fotos')}
        onComparar={onComparar || irA('fotos')}
        onFallo={marcarFallida}
      />
    ),
    musculos: (
      <ProgressMusclePreview key="musculos" bloque={b.musculos} accent={accent} onAbrir={onAbrirMusculo} onVerTodo={irA('musculos')} />
    ),
    objetivos: (
      <ProgressGoalPreview key="objetivos" bloque={b.objetivos} accent={accent} onAbrir={onAbrirObjetivo} onVerTodo={irA('objetivos')} />
    ),
  };

  return (
    <div className="space-y-5">
      {/* Apartado 16 — el periodo, que filtra lo que se ve y **no toca** ni el
          rango ni los objetivos. */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5" role="group" aria-label="Periodo del resumen">
        {PERIODOS_RESUMEN.map((p) => {
          const activo = resumen.periodo === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              aria-pressed={activo}
              className="h-9 px-3 rounded-xl text-xs font-semibold shrink-0 toque-44 active:scale-95"
              style={{ background: activo ? accent : hexToRgba(COLORS.border, 0.45), color: activo ? COLORS.textOnAccent : COLORS.text }}
            >
              {p.nombre}
            </button>
          );
        })}
      </div>

      {/* Apartado 30 — lo que no se ha podido calcular se dice, y lo demás sigue. */}
      {resumen.avisos.length > 0 && (
        <div className="space-y-1.5">
          {resumen.avisos.map((a) => <EmptyHint key={a} text={a} />)}
        </div>
      )}

      {resumen.orden.map((id) => trozo[id]).filter(Boolean)}

      <ProgressTimeline
        timeline={resumen.timeline}
        accent={accent}
        filtro={filtro}
        onFiltro={setFiltro}
        onAbrir={(e) => {
          const d = e.referencia.destino;
          if (d === 'sesion') { if (onVerSesion) onVerSesion(e.referencia.id); return; }
          if (d === 'rangos') { if (onIrARangos) onIrARangos(); else onIrASeccion('musculos'); return; }
          if (d === 'objetivos' && e.referencia.id) { onAbrirObjetivo(e.referencia.id); return; }
          onIrASeccion(d);
        }}
      />
    </div>
  );
}

export default ProgressOverview;
