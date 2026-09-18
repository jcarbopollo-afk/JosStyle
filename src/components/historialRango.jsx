/* ===========================================================================
   ENTREGA 4 · FASE 22/45 — EL HISTORIAL DE UN RANGO, EL COMPONENTE

   *"Rango global ↓ Historial · Rango muscular ↓ Historial · Rango de ejercicio
   ↓ Historial. No crear una sección completamente independiente si la
   navegación actual permite reutilizar la misma pantalla."* (apartado 30.)

   Así que hay **uno solo**, como `RankExplanation` en la F20: los tres sitios
   le pasan un destino y él pide `pantallaDeHistorial`. Los siete componentes
   del apartado 29 son las piezas de este archivo.

   🚨 **La pantalla no decide nada** (apartado 20): no mira si el rango subió,
   no compara scores y no calcula un solo número. Todo eso lo ha hecho
   `src/lib/historialRangos.js`; aquí solo se pinta.

   ⚠️ **Y ni confeti, ni sonido, ni vibración** (apartados 13 y 36). Una subida
   de rango se ve porque la línea lo dice —«↑ Subida de rango»— y porque su
   tarjeta tiene el acento, no porque la pantalla haga una fiesta.
   =========================================================================== */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, History, ChevronRight } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { RankBadge, RankLabel } from './rangos';
import {
  pantallaDeHistorial, detalleDeCambio, PERIODOS_HISTORIAL,
  PERIODO_POR_DEFECTO, HISTORIAL_INSUFICIENTE,
} from '../lib/historialRangos';

/* ── El botón que lo abre, igual en los tres sitios ──────────────────────── */
export function BotonHistorial({ onAbrir, etiqueta = 'Ver el historial de este rango' }) {
  if (!onAbrir) return null;
  return (
    <button
      onClick={onAbrir}
      aria-label={etiqueta}
      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full toque-44"
      style={{ background: COLORS.surface2, color: COLORS.textMuted }}
    >
      <History size={12} aria-hidden="true" />
      Historial
    </button>
  );
}

/* Una fecha en corto: «12 SEP», como el ejemplo del apartado 10. */
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
export function fechaCorta(iso) {
  if (typeof iso !== 'string' || iso.length < 10) return '';
  const [, m, d] = iso.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1] || ''}`;
}

/* ═══ 29 · `RankHistoryFilters` (apartado 23) ══════════════════════════════ */
export function RankHistoryFilters({ periodo, periodos = PERIODOS_HISTORIAL, accent, onElegir }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Periodo del historial">
      {periodos.map((p) => {
        const puesto = p.id === periodo;
        return (
          <button
            key={p.id}
            onClick={() => onElegir && onElegir(p.id)}
            aria-pressed={puesto}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full toque-44"
            style={{
              background: puesto ? hexToRgba(accent, 0.18) : COLORS.surface2,
              color: puesto ? accent : COLORS.textMuted,
            }}
          >
            {p.nombre}
          </button>
        );
      })}
    </div>
  );
}

/* ═══ 29 · `RankHistorySummary` (apartados 6, 8 y 27) ══════════════════════ */
export function RankHistorySummary({ resumen, accent }) {
  if (!resumen || !resumen.hay) return null;
  return (
    <div className="flex items-center gap-3">
      <RankBadge rank={resumen.actual.rango} size="md" accent={accent} />
      <div className="min-w-0 flex-1">
        <RankLabel rank={resumen.actual.rango} />
        {/* Apartado 6 — «Intermedio ↑ Anterior: Básico». */}
        {resumen.anterior && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            Anterior: {resumen.anterior.nombre}
          </p>
        )}
        {/* Apartado 27 — y si no ha cambiado, se dice, sin falsa evolución. */}
        {resumen.sigueEn && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{resumen.sigueEn}</p>
        )}
        {/* 🚨 Apartado 8 — progresar DENTRO del rango no es subir de rango, y
            por eso es otra frase y no la misma con un matiz. */}
        {resumen.textoDentro && (
          <p className="text-[11px] font-semibold" style={{ color: accent }}>{resumen.textoDentro}</p>
        )}
        {resumen.actual.score !== null && resumen.dentro && resumen.dentro.siguienteNombre && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {resumen.actual.score} · siguiente: {resumen.dentro.siguienteNombre}
          </p>
        )}
        {resumen.provisional && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Estimación provisional</p>
        )}
      </div>
    </div>
  );
}

/* ═══ 29 · `RankTimelineItem` (apartados 10, 11 y 31) ══════════════════════ */
export function RankTimelineItem({ linea, accent, onAbrir }) {
  if (!linea) return null;
  const hayCambio = !!linea.cambio;
  const Fila = onAbrir && hayCambio ? 'button' : 'div';
  return (
    <Fila
      {...(onAbrir && hayCambio
        ? { onClick: () => onAbrir(linea.cambio), 'aria-label': `${fechaCorta(linea.fecha)}: ${linea.marca.nombre} a ${linea.nombre}` }
        : {})}
      className={`w-full flex items-start gap-3 py-2 text-left ${onAbrir && hayCambio ? 'toque-44' : ''}`}
    >
      {/* La columna de la izquierda es la línea vertical del apartado 32. */}
      <div className="flex flex-col items-center pt-1" aria-hidden="true">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: hayCambio ? accent : hexToRgba(COLORS.border, 0.9) }}
        />
        <span className="w-px flex-1 mt-1" style={{ background: hexToRgba(COLORS.border, 0.6) }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-wide" style={{ color: COLORS.textMuted }}>
          {fechaCorta(linea.fecha)}
        </p>
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>{linea.nombre}</p>
        {/* 🚨 Apartado 31 — la flecha va con su PALABRA, nunca sola ni solo el
            color: «↑ desde Intermedio» se entiende sin distinguir tonos. */}
        <p className="text-[11px]" style={{ color: hayCambio ? accent : COLORS.textMuted }}>
          {linea.detalle}
        </p>
        <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
          {linea.score !== null && `${linea.score} · `}
          {linea.fuenteNombre || 'Sin fuente registrada'}
          {linea.provisional && ' · provisional'}
        </p>
      </div>
      {hayCambio && onAbrir && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
    </Fila>
  );
}

/* ═══ 29 · `RankTimeline` (apartado 10) ════════════════════════════════════ */
export function RankTimeline({ lineas = [], accent, onAbrir = null }) {
  if (!lineas.length) return null;
  return (
    <div>
      {lineas.map((l) => (
        <RankTimelineItem key={l.id} linea={l} accent={accent} onAbrir={onAbrir} />
      ))}
    </div>
  );
}

/* ═══ 29 · `RankScoreHistory` (apartados 24 y 25) ══════════════════════════
   🚨 **Cada punto va donde dice su FECHA**, no donde le toque por orden: entre
   el 12 de julio y el 30 de agosto no hay ningún dato, y el hueco tiene que
   verse. Los segmentos unen puntos reales; no se dibuja ni un valor entre
   medias (apartado 24, literal). */
export function RankScoreHistory({ grafica, accent }) {
  if (!grafica || !grafica.hay) return null;
  const An = 300;
  const Al = 90;
  const x = (p) => 4 + p.x * (An - 8);
  const y = (p) => Al - 8 - p.y * (Al - 20);
  const linea = grafica.puntos.map((p) => `${x(p)},${y(p)}`).join(' ');
  return (
    <div>
      <svg
        viewBox={`0 0 ${An} ${Al}`}
        className="w-full"
        role="img"
        aria-label={`Evolución de la puntuación entre ${fechaCorta(grafica.desde)} y ${fechaCorta(grafica.hasta)}, ${grafica.puntos.length} registros`}
      >
        <polyline points={linea} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {grafica.puntos.map((p) => (
          <circle key={p.fecha} cx={x(p)} cy={y(p)} r="3" fill={accent} />
        ))}
      </svg>
      <div className="flex justify-between text-[10px]" style={{ color: COLORS.textMuted }}>
        <span>{fechaCorta(grafica.desde)}</span>
        <span>{fechaCorta(grafica.hasta)}</span>
      </div>
    </div>
  );
}

/* ═══ 29 · `RankChangeCard` (apartados 14, 15 y 16) ════════════════════════ */
export function RankChangeCard({ detalle, accent, onCerrar }) {
  if (!detalle) return null;
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface2 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wide" style={{ color: COLORS.textMuted }}>
            {fechaCorta(detalle.fecha)}
          </p>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>{detalle.titulo}</p>
          <p className="text-[11px]" style={{ color: accent }}>{detalle.marca.texto}</p>
        </div>
        {/* ⚠️ `GhostBtn` NO reparte `aria-label` (FIT F4), así que un botón de
            solo icono hecho con él saldría sin nombre y el revisor de
            accesibilidad lo cazaría. Va como `<button>` crudo. */}
        {onCerrar && (
          <button
            onClick={onCerrar}
            aria-label="Cerrar el detalle del cambio"
            className="rounded-xl p-1.5 -m-1.5 toque-44"
            style={{ color: COLORS.textMuted }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-center">
          <RankBadge rank={detalle.desde.rango} size="sm" accent={accent} />
          <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{detalle.desde.nombre}</p>
          {detalle.desde.score !== null && (
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{detalle.desde.score}</p>
          )}
        </div>
        <span aria-hidden="true" style={{ color: COLORS.textMuted }}>→</span>
        <div className="text-center">
          <RankBadge rank={detalle.hasta.rango} size="sm" accent={accent} />
          <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{detalle.hasta.nombre}</p>
          {detalle.hasta.score !== null && (
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{detalle.hasta.score}</p>
          )}
        </div>
      </div>

      {/* 🚨 Apartado 16 — si no se puede saber qué lo provocó, se dice la frase
          general. Nunca una lista de ejercicios inventada. */}
      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{detalle.porque}</p>

      {detalle.responsables && (
        <div>
          <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Principales cambios</p>
          {detalle.responsables.map((r) => (
            <p key={r.exerciseId} className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {r.nombre} <span style={{ color: accent }}>↑ {r.cambioDeRango ? r.nombreRango : 'Mejora'}</span>
            </p>
          ))}
        </div>
      )}

      <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
        {detalle.fuenteNombre || 'Sin fuente registrada'}
        {detalle.provisional && ' · provisional'}
      </p>
    </div>
  );
}

/* ═══ 29 · `RankHistoryEmpty` (apartados 2 y 26) ═══════════════════════════ */
export function RankHistoryEmpty({ vacio, accent, onProgreso = null }) {
  if (!vacio) return null;
  return (
    <div className="text-center py-6">
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>{vacio.titulo}</p>
      <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{vacio.que}</p>
      {/* Un vacío sin salida es una pantalla rota (EH F41). */}
      {vacio.cta && onProgreso && (
        <button
          onClick={onProgreso}
          className="mt-3 text-[11px] font-semibold px-3 py-2 rounded-full toque-44"
          style={{ background: hexToRgba(accent, 0.18), color: accent }}
        >
          {vacio.cta}
        </button>
      )}
    </div>
  );
}

/* ═══ LA HOJA ENTERA, LA MISMA EN LOS TRES SITIOS (apartado 30) ════════════ */
export function RankHistory({ fitness, destino, propios = [], perfil = null, accent, onCerrar, onProgreso = null }) {
  const [periodo, setPeriodo] = useState(PERIODO_POR_DEFECTO);
  const [cambio, setCambio] = useState(null);

  const datos = useMemo(
    () => pantallaDeHistorial(fitness || {}, destino, { propios, perfil, periodo }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness && fitness.sesiones, fitness && fitness.clasificaciones, destino.tipo, destino.id, propios, perfil, periodo],
  );
  const detalle = cambio ? detalleDeCambio(fitness || {}, destino, cambio, { propios, perfil }) : null;

  /* Regla 3 — todo overlay `fixed inset-0` va con `createPortal`, o se ancla al
     contenedor de `.module-enter` y aparece abajo del todo. */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      /* ⚠️ El velo va como `rgba()` literal, igual que el de `RankExplanation`:
         un negro escrito en hexadecimal sería un color suelto fuera de
         `tokens.js` (regla 2) aunque solo sirva para oscurecer, y no es un
         color del tema: es la sombra de la hoja.
         ⚠️ Y el motivo está dicho CON PALABRAS a propósito: el barrido de la
         regla 2 solo se salta las líneas que EMPIEZAN por `*` o `//`, así que
         un comentario que cite el literal la hace saltar con el código bien
         (NAV F3). */
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ background: COLORS.surface, minHeight: 0 }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wide" style={{ color: COLORS.textMuted }}>HISTORIAL</p>
            <h2 className="text-lg font-bold truncate" style={{ color: COLORS.text }}>{datos.destino.nombre}</h2>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar el historial"
            className="rounded-xl p-1.5 -m-1.5 toque-44"
            style={{ color: COLORS.textMuted }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {datos.vacio ? (
          <RankHistoryEmpty vacio={datos.vacio} accent={accent} onProgreso={onProgreso} />
        ) : (
          <>
            <RankHistorySummary resumen={datos.resumen} accent={accent} />
            <RankHistoryFilters periodo={datos.periodo} periodos={datos.periodos} accent={accent} onElegir={setPeriodo} />

            {/* Apartado 23 — y si en ese periodo no ha pasado nada, se dice. */}
            {datos.aviso && (
              <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{datos.aviso}</p>
            )}

            <RankScoreHistory grafica={datos.grafica} accent={accent} />
            <RankTimeline lineas={datos.timeline} accent={accent} onAbrir={setCambio} />

            {detalle && <RankChangeCard detalle={detalle} accent={accent} onCerrar={() => setCambio(null)} />}

            {/* 🚨 Apartado 9 — si volvió a clasificar algo, la estimación de
                antes no existe en ninguna parte, y se dice en vez de dibujarla
                con la puntuación de hoy. */}
            {datos.estimacionAnteriorPerdida && (
              <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                Volviste a clasificar algún ejercicio: la estimación anterior no se guardó, así que el
                historial empieza en esa fecha.
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export { HISTORIAL_INSUFICIENTE };
export default RankHistory;
