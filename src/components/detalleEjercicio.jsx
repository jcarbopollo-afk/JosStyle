import React from 'react';
import { History, Target, CheckCircle2, AlertTriangle, Repeat2 } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, EmptyHint } from './ui';
import { RankBadge } from './rangos';
import { RankNextLevelCard } from './siguienteRango';
import { OBJETIVO_CONSEGUIDO, VER_HISTORIAL_RANGO } from '../lib/detalleEjercicio';

/* ===========================================================================
   ENTREGA 4 · FASE 29/45 — ANÁLISIS AVANZADO DE RENDIMIENTO POR EJERCICIO

   Las nueve piezas nuevas del apartado 31. Las otras cinco **ya estaban** y se
   importan donde toca: `DetalleProgreso`, `GraficaProgreso` y `FilaHistoria`
   son de la F12 y viven en `ProgresoView.jsx`; `EtiquetaEstado` es la de la
   F28. Está declarado en `COMPONENTES_FIT29`, con una prueba que abre cada
   archivo.

   🚨 **AQUÍ NO SE CALCULA NADA.** Todo llega resuelto de
   `src/lib/detalleEjercicio.js`, que a su vez solo reparte lo que ya decidieron
   la F11, la F12, la F19, la F23, la F14 y la F8. Es la F16 otra vez: la
   librería redacta, la vista dibuja.
   =========================================================================== */

/* ── 2 · La cabecera ───────────────────────────────────────────────────────
   *"DOMINADAS / Agarre pronado · Peso corporal / Espalda"*.

   ⚠️ Apartado 34 — **compacta en el móvil**, que es donde se usa esto: el
   nombre, una línea de contexto y el grupo. Nada más, porque cada línea de más
   empuja la última marca fuera de la pantalla. */
export function ExerciseProgressHeader({ cabecera, tendencia, accent, children }) {
  if (!cabecera) return null;
  return (
    <div>
      <p className="text-xs" style={{ color: COLORS.textMuted }}>Progreso</p>
      <h2
        className="text-2xl font-extrabold leading-tight"
        style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}
      >
        {cabecera.nombre}
      </h2>
      {/* ⚠️ Solo lo que de verdad tiene: la librería ya ha quitado el «· »
          suelto del agarre que no existe (regla 8). */}
      {cabecera.linea && (
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{cabecera.linea}</p>
      )}
      {cabecera.grupo && (
        <p className="text-xs font-semibold mt-0.5" style={{ color: COLORS.textMuted }}>{cabecera.grupo}</p>
      )}
      {/* Apartado 28 — «Ejercicio archivado», con su explicación. */}
      {cabecera.archivado && (
        <p
          className="text-[11px] mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: hexToRgba(COLORS.warning, 0.14), color: COLORS.warning }}
        >
          <AlertTriangle size={13} aria-hidden="true" />
          {cabecera.aviso}
        </p>
      )}
      {cabecera.archivado && (
        <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{cabecera.avisoTexto}</p>
      )}
      {(tendencia || children) && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">{children}</div>
      )}
    </div>
  );
}

/* ── 4 · El último resultado ───────────────────────────────────────────────
   Lo que más se mira, así que va arriba y grande. El texto lo redacta la F11
   con la unidad de su clase: *«12 reps»*, *«+10 kg × 8»*, *«32 s»* — aquí no se
   formatea nada ni se convierte ninguna unidad (apartado 30). */
export function ExerciseLatestResult({ ultima }) {
  if (!ultima) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
        Última vez · {ultima.fechaTexto}
      </p>
      <p
        className="text-3xl font-extrabold tabular-nums mt-1"
        style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}
      >
        {ultima.texto}
      </p>
    </div>
  );
}

/* ── 5 · La sesión anterior ────────────────────────────────────────────────
   🚨 *"Solo si los datos son realmente comparables"*. Quien lo decide es la
   F11, y la F12 ya devuelve `comparacion: null` cuando no lo son: aquí no se
   vuelve a juzgar, simplemente no hay nada que pintar. */
export function ExercisePreviousResult({ comparacion, estado, avisoMedida, accent }) {
  if (!comparacion) {
    return avisoMedida
      ? <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{avisoMedida}</p>
      : null;
  }
  return (
    <div
      className="mt-3 pt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2"
      style={{ borderTop: `1px solid ${COLORS.border}` }}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          Anterior · {comparacion.antesFecha}
        </p>
        <p className="text-base font-bold tabular-nums" style={{ color: COLORS.text }}>{comparacion.antes}</p>
      </div>
      <span aria-hidden="true" style={{ color: COLORS.textMuted }}>→</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Cambio</p>
        <p
          className="text-base font-bold tabular-nums"
          style={{ color: estado === 'mejora' ? accent : COLORS.text }}
        >
          {comparacion.resultado}
        </p>
        {comparacion.porcentaje !== null && comparacion.porcentaje !== undefined && (
          <p className="text-[10px] tabular-nums" style={{ color: COLORS.textMuted }}>
            {comparacion.porcentaje > 0 ? '+' : ''}
            {String(comparacion.porcentaje).replace('.', ',')} % de peso
          </p>
        )}
      </div>
    </div>
  );
}

/* ── 6 · El mejor resultado ────────────────────────────────────────────────
   🚨 *"No crear un sistema de PR separado"* (apartado 7): el mejor histórico es
   el de la F11, y con una sola vez no es un récord, es **el único registro**.
   ⚠️ Y cuando el mejor ES el último, se dice — que es lo que ese apartado
   ofrece como alternativa a un sistema de récords. */
export function ExerciseBestResult({ mejor, soloUna, esElUltimo = false, accent }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
        Mejor resultado
      </p>
      {soloUna ? (
        <p className="text-sm font-bold mt-1" style={{ color: COLORS.text }}>Primer registro</p>
      ) : mejor ? (
        <>
          <p className="text-base font-bold tabular-nums mt-1" style={{ color: COLORS.text }}>
            {mejor.texto}
            <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}> · {mejor.fecha}</span>
          </p>
          {esElUltimo && (
            <p className="text-[11px] font-semibold mt-1" style={{ color: accent }}>Mejor marca registrada</p>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ── 4, 5 y 6 juntos · el resumen de rendimiento ───────────────────────────
   ⚠️ Una sola tarjeta para los tres, porque son **una sola pregunta leída de
   arriba abajo**: qué hice, qué hacía antes y qué es lo mejor que he hecho.
   Repartirlos en tres tarjetas obliga a desplazar para comparar dos números que
   solo significan algo juntos. */
export function ExercisePerformanceSummary({ progreso, accent }) {
  if (!progreso || !progreso.ultima) return null;
  const esElUltimo = !!(progreso.mejor && progreso.ultima
    && progreso.mejor.texto === progreso.ultima.texto);
  return (
    <Card>
      <ExerciseLatestResult ultima={progreso.ultima} />
      <ExercisePreviousResult
        comparacion={progreso.comparacion}
        estado={progreso.estado}
        avisoMedida={progreso.avisoMedida}
        accent={accent}
      />
      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <ExerciseBestResult
          mejor={progreso.mejor}
          soloUna={progreso.soloUna}
          esElUltimo={esElUltimo}
          accent={accent}
        />
      </div>
    </Card>
  );
}

/* ── 10 y 11 · El selector de métrica ──────────────────────────────────────
   🚨 *"No crear un gráfico «Rendimiento total»"*: cada clase es su propia
   línea, con su unidad, y esto solo elige cuál se mira.

   ⚠️ *"Pero solo cuando ambas existan realmente. No mostrar selectores
   inútiles"*: con una sola métrica registrada **no se pinta**. Lo decide la
   librería (`hayselector`), no un `if` aquí. */
export function ExerciseMetricSelector({ metricas = [], valor, accent, onElegir }) {
  if (!metricas.length) return null;
  return (
    <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Métrica del gráfico">
      {metricas.map((m) => {
        const activa = m.id === valor;
        return (
          <button
            key={m.id}
            onClick={() => onElegir && onElegir(m.id)}
            aria-pressed={activa}
            className="text-xs font-bold px-3 py-2 rounded-full toque-44"
            style={{
              background: activa ? hexToRgba(accent, 0.16) : hexToRgba(COLORS.border, 0.4),
              color: activa ? accent : COLORS.textMuted,
            }}
          >
            {m.nombre}
            <span className="font-normal tabular-nums"> · {m.registros}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── 18 · Las series completadas, omitidas y añadidas ──────────────────────
   🚨 *"No considerar series omitidas como rendimiento real"*. Eso ya lo
   garantiza la F11, que solo indexa las hechas; aquí se **enseñan** para que él
   vea lo que pasó de verdad (apartado 17: *"No ocultar los datos originales"*).

   ⚠️ Y un cero no se pinta: *«0 omitidas»* es el cero inventado de siempre. */
export function ExerciseSetBreakdown({ fila, accent }) {
  if (!fila) return null;
  const trozos = [];
  if (fila.seriesTexto) trozos.push(fila.seriesTexto);
  if (fila.omitidas > 0) trozos.push(`${fila.omitidas} ${fila.omitidas === 1 ? 'omitida' : 'omitidas'}`);
  if (fila.anadidas > 0) trozos.push(`${fila.anadidas} ${fila.anadidas === 1 ? 'añadida' : 'añadidas'}`);
  if (!trozos.length && !fila.parcial && !fila.nota) return null;
  return (
    <div className="space-y-1">
      {trozos.length > 0 && (
        <p className="text-[11px] tabular-nums" style={{ color: COLORS.textMuted }}>{trozos.join(' · ')}</p>
      )}
      {/* Apartado 19 — parcial se dice, no se descarta. */}
      {fila.parcial && (
        <p
          className="text-[11px] font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-lg"
          style={{ background: hexToRgba(COLORS.warning, 0.14), color: COLORS.warning }}
        >
          <AlertTriangle size={12} aria-hidden="true" />
          {fila.avisoParcial}
        </p>
      )}
      {/* 🚨 Apartado 27 — la nota, TAL CUAL. Ni resumen, ni interpretación. */}
      {fila.nota && (
        <p
          className="text-xs italic px-2.5 py-1.5 rounded-lg"
          style={{ background: hexToRgba(accent, 0.08), color: COLORS.text }}
        >
          “{fila.nota}”
        </p>
      )}
    </div>
  );
}

/* ── 16 · El historial ─────────────────────────────────────────────────────
   ⚠️ Las filas las pinta `FilaHistoria`, que es de la F12 y ya sabe abrirse
   para enseñar las series numeradas (apartado 17). Lo que esta fase añade va
   **dentro** de la fila abierta, con `ExerciseSetBreakdown`. */
export function ExerciseHistory({ filas = [], veces, children }) {
  return (
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>
        Historial · {veces} {veces === 1 ? 'sesión' : 'sesiones'}
      </p>
      {filas.length === 0
        ? <EmptyHint text="Todavía no has hecho este ejercicio." />
        : children}
    </Card>
  );
}

/* ── 23 y 24 · El objetivo ─────────────────────────────────────────────────
   🚨 *"Utilizar ProgressGoal. No crear un objetivo nuevo"*: esto **no crea
   nada**, ni siquiera ofrece crearlo — eso es la F14 y vive en su sección.
   ⚠️ Y un objetivo conseguido se enseña **con su fecha real**, la de la sesión
   en la que lo superó, no la de hoy. */
export function ExerciseGoalPreview({ objetivo, accent, onAbrir = null, onCrear = null }) {
  /* 🔓 FIT F30, apartado 35 — sin objetivo se ofrece **crearlo**, en vez de
     dejar el hueco: *"Si no existe: «Crear objetivo»"*. Y solo si hay con qué
     crearlo, que si no sería un botón muerto (regla 8). */
  if (!objetivo || !objetivo.hay) {
    return onCrear ? (
      <Card>
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Objetivo</p>
        </div>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Todavía no te has puesto un objetivo con este ejercicio.
        </p>
        <button
          onClick={onCrear}
          className="mt-2 text-xs font-bold py-2 px-1 toque-44"
          style={{ color: accent }}
        >
          Crear objetivo
        </button>
      </Card>
    ) : null;
  }
  const hecho = objetivo.conseguido;
  const Cuerpo = (
    <>
      <div className="flex items-center gap-2">
        {hecho
          ? <CheckCircle2 size={16} style={{ color: accent }} aria-hidden="true" />
          : <Target size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: hecho ? accent : COLORS.textMuted }}
        >
          {hecho ? OBJETIVO_CONSEGUIDO : 'Objetivo'}
        </p>
      </div>
      <p className="text-base font-bold tabular-nums mt-1" style={{ color: COLORS.text }}>
        {objetivo.etiqueta}
      </p>
      {objetivo.texto && (
        <p className="text-xs mt-0.5 tabular-nums" style={{ color: COLORS.textMuted }}>{objetivo.texto}</p>
      )}
      {hecho && objetivo.fecha && (
        <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>Conseguido el {objetivo.fecha}</p>
      )}
    </>
  );
  if (!onAbrir) return <Card>{Cuerpo}</Card>;
  return (
    <Card>
      <button onClick={onAbrir} className="w-full text-left toque-44" aria-label={`Ver el objetivo: ${objetivo.etiqueta}`}>
        {Cuerpo}
      </button>
    </Card>
  );
}

/* ── 3, 25 y 26 · El rango ─────────────────────────────────────────────────
   🚨 *"Utilizar RankEngine. No duplicar cálculos"* (3) y *"Reutilizar Fase 23"*
   (25): el badge es `RankBadge` de la F15 y la tarjeta del siguiente rango es
   `RankNextLevelCard` de la F23, con su barra y sus puntos. Aquí no se calcula
   ni un punto.

   ⚠️ Y *"No crear otro historial"* (26): el botón lleva al de la **F22**. */
export function ExerciseRankPreview({ rango, accent, onHistorial = null, onPorQue = null }) {
  if (!rango) return null;
  if (!rango.hay) {
    return rango.vacio
      ? <Card><p className="text-xs" style={{ color: COLORS.textMuted }}>{rango.vacio}</p></Card>
      : null;
  }
  return (
    <Card>
      <div className="flex items-center gap-3">
        <RankBadge rank={rango.rango} size="md" state="actual" accent={accent} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Rango</p>
          <p
            className="text-xl font-extrabold leading-tight"
            style={{ color: accent, fontFamily: "'Manrope', sans-serif" }}
          >
            {rango.nombre}
          </p>
          {/* ⚠️ La confianza **siempre** al lado del rango: un nivel sin decir
              cuánta información hay detrás se lee como una medida absoluta
              (FIT F23, apartado 18). */}
          {rango.confianzaNombre && (
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{rango.confianzaNombre}</p>
          )}
        </div>
      </div>

      {/* Apartado 25 — el progreso hacia el siguiente, tal y como lo pinta la F23. */}
      {rango.siguiente && (
        <div className="mt-3">
          <RankNextLevelCard tarjeta={rango.siguiente} accent={accent} onPorQue={onPorQue} compacta />
        </div>
      )}

      {onHistorial && (
        <button
          onClick={onHistorial}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold py-2 px-1 toque-44"
          style={{ color: accent }}
        >
          <History size={14} aria-hidden="true" />
          {rango.ctaHistorial || VER_HISTORIAL_RANGO}
        </button>
      )}
    </Card>
  );
}

/* ── 20 y 21 · Las variantes ───────────────────────────────────────────────
   🚨 *"No mezclar sus gráficos automáticamente"*. Cada variante es un
   `exerciseId` distinto y la F11 solo compara el mismo id, así que **ya están
   separadas**: lo que faltaba era decirlo y poder ir a la otra. */
export function ExerciseVariants({ variantes, accent, onAbrir = null }) {
  if (!variantes || !variantes.hay) return null;
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Repeat2 size={15} style={{ color: COLORS.textMuted }} aria-hidden="true" />
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          Variantes
        </p>
      </div>
      <p className="text-xs mt-1" style={{ color: COLORS.text }}>{variantes.aviso}</p>
      <div className="mt-2 space-y-1">
        {variantes.otras.map((v) => (
          <button
            key={v.exerciseId}
            onClick={() => onAbrir && onAbrir(v.exerciseId)}
            disabled={!onAbrir}
            className="w-full flex items-center gap-2 text-left py-2 toque-44"
            aria-label={`Ver el progreso de ${v.nombre}`}
          >
            <span className="text-sm font-semibold min-w-0 flex-1" style={{ color: onAbrir ? accent : COLORS.text }}>
              {v.nombre}
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: COLORS.textMuted }}>
              {v.registros} {v.registros === 1 ? 'sesión' : 'sesiones'}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export default ExercisePerformanceSummary;
