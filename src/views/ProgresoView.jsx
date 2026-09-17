/* ===========================================================================
   ENTREGA 4 · FASE 12/45 — FITNESS → PROGRESO

   *"La fase está terminada cuando puedo entrar en Fitness → Progreso y ver una
   representación real de cómo estoy evolucionando."* Y el recorrido que tiene
   que cuadrar de punta a punta: **Progreso → Ejercicio → Comparación →
   Historial → Sesión** (apartado 45).

   🚨 **ESTA PANTALLA NO COMPARA NADA** (apartado 38). Tendencias, mejores series,
   cambios y la gráfica salen de `progresoEjercicios.js`, que a su vez solo
   ordena lo que decidió la F11. Y **«Ver entrenamiento» es la pantalla de la
   F10**, no una copia: si el historial dice 20 kg × 10, aquí también (31).

   ⚠️ Sin confeti, sin puntos, sin niveles (apartado 27): deportivo y serio.
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Dumbbell, Camera, Play, X,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO } from '../lib/helpers';
import { Card, GhostBtn, PrimaryButton, EmptyHint, SectionTitle } from '../components/ui';
import { iconoDeGrupo } from '../components/iconosFitness';
import EjerciciosView, { DetalleEjercicio } from './EjerciciosView';
import { DetalleSesionHistorial } from './HistorialView';
import { ejercicioPorId, nombreCompleto } from '../lib/ejercicios';
/* 🔓 FIT F14 — los objetivos de rendimiento. */
import {
  listaDeObjetivos, progresoDeObjetivo, metricasDeEjercicio, tipoObjetivo, anadirObjetivo, editarObjetivo,
  cancelarObjetivo, FILTROS_OBJETIVOS, OBJETIVOS_VACIO, AVISO_CANCELAR_OBJETIVO, AVISO_ELIMINAR_OBJETIVO,
} from '../lib/objetivosProgreso';
import { detalleDeSesion, sesionDelHistorial } from '../lib/historial';
import {
  tarjetasDeProgreso, consultarProgreso, resumenDeProgreso, detalleDeProgreso, geometriaGrafica,
  FILTROS_PROGRESO, RANGOS_GRAFICA, PROGRESO_VACIO,
} from '../lib/progresoEjercicios';
/* 🔓 FIT F13 — el progreso por grupos musculares. */
import {
  resumenMuscular, ejerciciosDeMusculo, ejercicioEnGrupo, FILTROS_GRUPO, AVISO_RENDIMIENTO,
} from '../lib/progresoMuscular';

/* Las secciones de Progreso (apartado 2). */
export const SECCIONES_PROGRESO = [
  { id: 'resumen', nombre: 'Resumen' },
  /* FIT F13, apartado 7 — el progreso muscular, entre el resumen y los ejercicios. */
  { id: 'musculos', nombre: 'Músculos' },
  { id: 'ejercicios', nombre: 'Ejercicios' },
  /* FIT F14, apartado 15 — «Mis objetivos». */
  { id: 'objetivos', nombre: 'Objetivos' },
  { id: 'fotos', nombre: 'Fotos' },
];

/* ── Chips de una fila (secciones, filtros, rangos) ─────────────────────── */
function Chips({ opciones, valor, onCambiar, accent, etiqueta }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5" role="group" aria-label={etiqueta}>
      {opciones.map((o) => {
        const activo = valor === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onCambiar(o.id)}
            aria-pressed={activo}
            className="h-9 px-3 rounded-xl text-xs font-semibold shrink-0 toque-44 active:scale-95"
            style={{
              background: activo ? accent : hexToRgba(COLORS.border, 0.45),
              color: activo ? COLORS.textOnAccent : COLORS.text,
            }}
          >
            {o.nombre}
          </button>
        );
      })}
    </div>
  );
}

/* ── El estado, con símbolo y palabra (apartados 15 y 34) ───────────────── */
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
      <span aria-hidden="true">{simbolo}</span>{nombre}
    </span>
  );
}

/* ── La tarjeta de un ejercicio (apartado 7) ───────────────────────────── */
export function TarjetaProgreso({ tarjeta, accent, onAbrir }) {
  const t = tarjeta;
  const Icono = iconoDeGrupo(t.grupoId);
  return (
    <button
      onClick={() => onAbrir(t.exerciseId)}
      aria-label={`Ver el progreso de ${t.nombre}: ${t.estadoNombre}`}
      className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(accent, 0.14), color: accent }}
      >
        <Icono size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{t.nombre}</p>
        <p className="text-sm font-extrabold tabular-nums" style={{ color: COLORS.text }}>
          {t.ultima}
          {t.cambio && <span className="text-xs font-semibold ml-1.5" style={{ color: COLORS.textMuted }}>{t.cambio}</span>}
        </p>
        <div className="mt-1">
          <EtiquetaEstado estado={t.estado} nombre={t.estadoNombre} simbolo={t.simbolo} accent={accent} />
        </div>
      </div>
      <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/* ── El resumen (apartados 3, 4, 5 y 26) ───────────────────────────────── */
export function ResumenProgreso({ resumen, accent, onEntrenar, onAbrir }) {
  if (!resumen.suficiente) {
    return (
      <Card>
        <div className="py-4 text-center">
          <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{PROGRESO_VACIO.titulo}</p>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{PROGRESO_VACIO.texto}</p>
          {onEntrenar && (
            <div className="mt-4 max-w-xs mx-auto">
              <PrimaryButton accent={accent} icon={Play} onClick={onEntrenar}>{PROGRESO_VACIO.cta}</PrimaryButton>
            </div>
          )}
        </div>
      </Card>
    );
  }
  const cifras = [
    ['Mejorando', resumen.mejorando],
    ['Estables', resumen.estables],
    ['Descenso', resumen.descenso],
    ['Entrenamientos', resumen.entrenamientos],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cifras.map(([nombre, n]) => (
          <Card key={nombre}>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{n}</p>
            <p className="text-[11px] font-semibold mt-1" style={{ color: COLORS.textMuted }}>{nombre}</p>
          </Card>
        ))}
      </div>
      {resumen.recientes.length > 0 && (
        <div>
          <SectionTitle sub="Tus últimas mejoras">Progreso reciente</SectionTitle>
          <div className="space-y-2">
            {resumen.recientes.map((r) => (
              <button
                key={r.exerciseId}
                onClick={() => onAbrir(r.exerciseId)}
                aria-label={`Ver el progreso de ${r.nombre}`}
                className="hub-card w-full text-left rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99]"
                style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: COLORS.text }}>{r.nombre}</p>
                  <p className="text-xs tabular-nums" style={{ color: COLORS.textMuted }}>{r.antes} → {r.despues}</p>
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: accent }}>↗ {r.cambio}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── La gráfica (apartados 21-25 y 40) ─────────────────────────────────────
   Una línea de 2 px con el acento, puntos de 10 px con un anillo del color de
   fondo, rejilla mínima y ni un eje de más. Se toca un punto y dice fecha,
   resultado y lleva a la sesión. ⚠️ Los puntos son botones de verdad, así que
   también se llega con el teclado. */
const ANCHO = 320;
const ALTO = 150;
export function GraficaProgreso({ grafica, accent, onVerSesion }) {
  const [elegido, setElegido] = useState(null);
  const puntos = useMemo(() => geometriaGrafica(grafica.puntos, { ancho: ANCHO, alto: ALTO, margen: 18 }), [grafica.puntos]);
  if (!grafica.mostrar) {
    return grafica.motivo ? <p className="text-xs" style={{ color: COLORS.textMuted }}>{grafica.motivo}</p> : null;
  }
  const valores = puntos.map((p) => p.valor);
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const sel = elegido !== null ? puntos[elegido] : null;
  const camino = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fmt = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{grafica.etiqueta}</p>
        <p className="text-[11px] tabular-nums" style={{ color: COLORS.textMuted }}>
          {fmt(min)}–{fmt(max)} {grafica.unidad}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full h-auto mt-1"
        role="img"
        aria-label={`${grafica.etiqueta}: de ${fmt(puntos[0].valor)} a ${fmt(puntos[puntos.length - 1].valor)} ${grafica.unidad} en ${puntos.length} sesiones`}
      >
        {/* Rejilla mínima: la base y el techo, recesivos. */}
        {[18, ALTO - 18].map((y) => (
          <line key={y} x1="18" x2={ANCHO - 18} y1={y} y2={y} stroke={COLORS.border} strokeWidth="1" strokeDasharray="3 4" />
        ))}
        <path d={camino} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {puntos.map((p, i) => (
          <g key={p.sesionId + i}>
            <circle cx={p.x} cy={p.y} r={elegido === i ? 6.5 : 5} fill={accent} stroke={COLORS.surface} strokeWidth="2" />
            {/* Zona de toque mayor que la marca. */}
            <circle
              cx={p.x}
              cy={p.y}
              r="16"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={`${p.fechaTexto}: ${p.texto}`}
              onClick={() => setElegido(elegido === i ? null : i)}
              onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setElegido(elegido === i ? null : i); } }}
              style={{ cursor: 'pointer', outline: 'none' }}
            />
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] tabular-nums" style={{ color: COLORS.textMuted }}>
        <span>{puntos[0].fechaTexto}</span>
        <span>{puntos[puntos.length - 1].fechaTexto}</span>
      </div>
      {sel ? (
        <div className="mt-2 rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: hexToRgba(accent, 0.1) }} aria-live="polite">
          <div className="min-w-0 flex-1">
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{sel.fechaTexto}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: COLORS.text }}>{sel.texto}</p>
          </div>
          {onVerSesion && (
            <button
              onClick={() => onVerSesion(sel.sesionId)}
              className="text-xs font-bold px-2.5 py-2 rounded-lg toque-44 shrink-0"
              style={{ color: accent }}
            >
              Ver entrenamiento
            </button>
          )}
        </div>
      ) : (
        <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>Toca un punto para ver esa sesión.</p>
      )}
    </div>
  );
}

/* ── Una sesión en la historia del ejercicio (apartados 16, 17 y 30) ────── */
function FilaHistoria({ fila, accent, abierta, onAlternar, onVerSesion }) {
  return (
    <div style={{ borderTop: `1px solid ${hexToRgba(COLORS.border, 0.6)}` }}>
      <button
        onClick={onAlternar}
        aria-expanded={abierta}
        aria-label={`${abierta ? 'Ocultar' : 'Ver'} las series del ${fila.fechaTexto}`}
        className="w-full flex items-center gap-2 py-2.5 text-left"
      >
        <span className="text-xs min-w-0 flex-1" style={{ color: COLORS.textMuted }}>{fila.fechaTexto}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: COLORS.text }}>{fila.resumen}</span>
        {abierta ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
      </button>
      {abierta && (
        <div className="pb-2.5 space-y-0.5">
          {fila.series.map((s) => (
            <p key={s} className="text-xs tabular-nums" style={{ color: COLORS.text }}>{s}</p>
          ))}
          {onVerSesion && (
            <button onClick={() => onVerSesion(fila.sesionId)} className="text-xs font-bold mt-1.5 py-1.5 toque-44" style={{ color: accent }}>
              Ver entrenamiento
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── El detalle de un ejercicio (apartados 11-20, 29 y 30) ─────────────── */
export function DetalleProgreso({ detalle, accent, rango, onRango, onVolver, onVerEjercicio, onVerSesion }) {
  const [abiertas, setAbiertas] = useState(() => new Set());
  const d = detalle;
  const alternar = (id) => setAbiertas((prev) => {
    const s = new Set(prev);
    if (s.has(id)) s.delete(id); else s.add(id);
    return s;
  });
  return (
    <div className="space-y-4">
      <button
        onClick={onVolver}
        aria-label="Volver a Progreso"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ChevronLeft size={16} /> Progreso
      </button>

      <div>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Progreso</p>
        <h2 className="text-2xl font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{d.nombre}</h2>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{[d.tipo, d.grupo, d.medida].filter(Boolean).join(' · ')}</p>
        {!d.existe && (
          <p className="text-[11px] mt-1" style={{ color: COLORS.warning }}>Este ejercicio ya no está en el catálogo. Su historia se conserva.</p>
        )}
        <div className="mt-2">
          <EtiquetaEstado estado={d.estado} nombre={d.estadoNombre} simbolo={d.simbolo} accent={accent} />
        </div>
      </div>

      {!d.ultima ? (
        <EmptyHint text="Todavía no has hecho este ejercicio." />
      ) : (
        <>
          {/* Apartado 12 — la última marca, destacada. */}
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Última vez · {d.ultima.fechaTexto}</p>
            <p className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{d.ultima.texto}</p>

            {/* Apartado 13 — Anterior ↓ Actual, con la lógica de la F11. */}
            {d.comparacion && (
              <div className="mt-3 pt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Anterior · {d.comparacion.antesFecha}</p>
                  <p className="text-base font-bold tabular-nums" style={{ color: COLORS.text }}>{d.comparacion.antes}</p>
                </div>
                <span aria-hidden="true" style={{ color: COLORS.textMuted }}>→</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Resultado</p>
                  <p className="text-base font-bold tabular-nums" style={{ color: d.estado === 'mejora' ? accent : COLORS.text }}>{d.comparacion.resultado}</p>
                  {d.comparacion.porcentaje !== null && (
                    <p className="text-[10px] tabular-nums" style={{ color: COLORS.textMuted }}>{d.comparacion.porcentaje > 0 ? '+' : ''}{String(d.comparacion.porcentaje).replace('.', ',')} % de peso</p>
                  )}
                </div>
              </div>
            )}
            {d.avisoMedida && <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{d.avisoMedida}</p>}
          </Card>

          {/* Apartado 14 — el mejor resultado, o «Primer registro». */}
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Mejor resultado</p>
            {d.soloUna ? (
              <p className="text-sm font-bold mt-1" style={{ color: COLORS.text }}>Primer registro</p>
            ) : d.mejor && (
              <p className="text-base font-bold tabular-nums mt-1" style={{ color: COLORS.text }}>
                {d.mejor.texto} <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>· {d.mejor.fecha}</span>
              </p>
            )}
          </Card>

          {/* Apartados 21-25 — la gráfica, con su rango. */}
          {d.veces >= 2 && (
            <Card>
              <Chips opciones={RANGOS_GRAFICA} valor={rango} onCambiar={onRango} accent={accent} etiqueta="Periodo de la gráfica" />
              <div className="mt-3">
                <GraficaProgreso grafica={d.grafica} accent={accent} onVerSesion={onVerSesion} />
              </div>
            </Card>
          )}

          {/* Apartados 16 y 17 — la historia del ejercicio. */}
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>Historial · {d.veces} {d.veces === 1 ? 'sesión' : 'sesiones'}</p>
            {d.historial.map((f) => (
              <FilaHistoria
                key={f.sesionId}
                fila={f}
                accent={accent}
                abierta={abiertas.has(f.sesionId)}
                onAlternar={() => alternar(f.sesionId)}
                onVerSesion={onVerSesion}
              />
            ))}
          </Card>
        </>
      )}

      {/* Apartado 29 — la ficha del catálogo, sin duplicarla. */}
      {d.existe && onVerEjercicio && (
        <GhostBtn icon={Dumbbell} onClick={onVerEjercicio}>Ver ejercicio</GhostBtn>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   🔓 FIT F13 — PROGRESO MUSCULAR
   ═══════════════════════════════════════════════════════════════════════════
   *"Qué grupos musculares están progresando, cuáles están estables y cuáles
   todavía no tienen suficientes datos."* 🚨 Y mide RENDIMIENTO, no músculo
   (apartado 2): la pantalla lo dice.

   ⚠️ Como el resto de Progreso, no calcula nada: el reparto por porcentajes y el
   voto salen de `progresoMuscular.js`, que usa la F11 y la F12. */

/* ── El estado de un músculo, con símbolo y palabra (apartados 15 y 21) ── */
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

/* ── La barra de un músculo: cuántos de los que tienen datos mejoran ────── */
function BarraMuscular({ fraccion, accent, etiqueta }) {
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden mt-2"
      style={{ background: hexToRgba(COLORS.border, 0.6) }}
      role="img"
      aria-label={etiqueta}
    >
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(fraccion * 100)}%`, background: accent }} />
    </div>
  );
}

/* ── Una tarjeta de grupo o de subgrupo (apartados 3 y 6) ─────────────── */
export function TarjetaMusculo({ musculo, accent, onAbrir, conIcono = true }) {
  const m = musculo;
  const Icono = iconoDeGrupo(m.icono || null);
  return (
    <button
      onClick={() => onAbrir(m.id)}
      aria-label={`${m.nombre}: ${m.estadoNombre}. ${m.resumen}`}
      className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      {conIcono && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
          <Icono size={19} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{m.nombre}</p>
          <EstadoMuscular estado={m.estado} nombre={m.estadoNombre} simbolo={m.simbolo} accent={accent} />
        </div>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{m.resumen}</p>
        {m.ejerciciosConDatos > 0 && (
          <BarraMuscular fraccion={m.fraccion} accent={accent} etiqueta={`${m.mejoran} de ${m.ejerciciosConDatos} ejercicios con datos mejoran`} />
        )}
      </div>
      <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/* ── Los ejercicios de un músculo (apartado 6) ─────────────────────────── */
export function EjerciciosDeMusculo({ ejercicios, accent, onAbrir }) {
  if (!ejercicios.length) {
    return <EmptyHint text="Ninguno de tus ejercicios trabaja este músculo en este periodo." />;
  }
  return (
    <div className="space-y-2">
      {ejercicios.map((t) => (
        <div key={t.exerciseId}>
          <TarjetaProgreso tarjeta={t} accent={accent} onAbrir={onAbrir} />
          <p className="text-[10px] mt-0.5 px-2" style={{ color: COLORS.textMuted }}>
            Implicación en este músculo: {t.implicacion} %{t.fecha ? ` · ${t.fecha.split('-').reverse().join('/')}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── El detalle de un grupo o de un subgrupo (apartados 6 y 9) ─────────── */
export function DetalleMusculo({ musculo, subgrupos = null, ejercicios, accent, onVolver, volverA, onSubgrupo, onEjercicio }) {
  const m = musculo;
  return (
    <div className="space-y-4">
      <button
        onClick={onVolver}
        aria-label={`Volver a ${volverA}`}
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ChevronLeft size={16} /> {volverA}
      </button>
      <div>
        <h2 className="text-2xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{m.nombre}</h2>
        <p className="text-sm mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: COLORS.textMuted }}>
          Rendimiento general:
          <EstadoMuscular estado={m.estado} nombre={m.estadoNombre} simbolo={m.simbolo} accent={accent} pocaInformacion={m.pocaInformacion} />
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{m.resumen}</p>
        <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{AVISO_RENDIMIENTO}</p>
      </div>

      {subgrupos && (
        <div>
          <SectionTitle sub="Cada ejercicio cuenta según su implicación">Subgrupos</SectionTitle>
          <div className="space-y-2">
            {subgrupos.map((s) => <TarjetaMusculo key={s.id} musculo={s} accent={accent} onAbrir={onSubgrupo} conIcono={false} />)}
          </div>
        </div>
      )}

      <div>
        <SectionTitle sub="Toca uno para ver su evolución">Ejercicios</SectionTitle>
        <EjerciciosDeMusculo ejercicios={ejercicios} accent={accent} onAbrir={onEjercicio} />
      </div>
    </div>
  );
}

/* ── La sección «Músculos» de Progreso (apartados 3, 7, 11 y 13) ───────── */
export function MusculosProgreso({ resumen, periodo, onPeriodo, accent, onAbrir, onEntrenar }) {
  return (
    <div className="space-y-3">
      <Chips opciones={RANGOS_GRAFICA} valor={periodo} onCambiar={onPeriodo} accent={accent} etiqueta="Periodo del progreso muscular" />
      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{AVISO_RENDIMIENTO}</p>
      {!resumen.hayEjercicios ? (
        periodo === 'todo'
          ? <ResumenProgreso resumen={{ suficiente: false }} accent={accent} onEntrenar={onEntrenar} onAbrir={() => {}} />
          : <Card><p className="text-sm" style={{ color: COLORS.textMuted }}>Datos insuficientes: no entrenaste en este periodo.</p></Card>
      ) : (
        <>
          {!resumen.hayDatos && (
            <Card>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                Datos insuficientes: en este periodo ningún ejercicio tiene con qué compararse todavía.
              </p>
            </Card>
          )}
          <div className="space-y-2">
            {resumen.grupos.map((g) => <TarjetaMusculo key={g.id} musculo={g} accent={accent} onAbrir={onAbrir} />)}
          </div>
        </>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   🔓 FIT F14 — MIS OBJETIVOS
   ═══════════════════════════════════════════════════════════════════════════
   *"Fitness → Progreso → Mis objetivos → + Crear objetivo → Dominadas → 15
   repeticiones"*. ⚠️ La pantalla no calcula nada: valor actual, porcentaje, si
   está conseguido y la tendencia salen de `objetivosProgreso.js`, que usa la
   F11. Y **sin datos no es 0 %** (apartado 23). */

/* ── Una tarjeta de objetivo (apartados 11, 15 y 23) ───────────────────── */
export function TarjetaObjetivo({ objetivo, accent, onAbrir }) {
  const o = objetivo;
  const Icono = iconoDeGrupo(o.grupoId);
  const conseguidoYa = o.estado === 'completado';
  return (
    <button
      onClick={() => onAbrir(o.id)}
      aria-label={`Objetivo ${o.nombre}: ${o.objetivoTexto}. ${o.progresoTexto}. ${o.estadoNombre}`}
      className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${conseguidoYa ? accent : COLORS.border}`, opacity: o.estado === 'cancelado' ? 0.65 : 1 }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
        <Icono size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{o.nombre}</p>
        <p className="text-sm font-extrabold tabular-nums" style={{ color: o.sinDatos ? COLORS.textMuted : COLORS.text }}>
          {o.progresoTexto}
          {o.porcentaje !== null && <span className="text-xs font-semibold ml-1.5" style={{ color: COLORS.textMuted }}>{o.porcentaje} %</span>}
        </p>
        {/* 🚨 Apartado 23 — sin datos NO se dibuja una barra vacía: 0 % no es «sin datos». */}
        {o.porcentaje !== null && (
          <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: hexToRgba(COLORS.border, 0.6) }} aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${o.porcentaje}%`, background: accent }} />
          </div>
        )}
        <p className="text-[11px] mt-1.5 flex flex-wrap gap-x-2" style={{ color: COLORS.textMuted }}>
          <span style={{ color: conseguidoYa ? accent : COLORS.textMuted, fontWeight: 700 }}>{o.simbolo} {o.estadoNombre}</span>
          {!o.sinDatos && o.estado === 'activo' && <span>{o.tendenciaSimbolo} {o.tendenciaNombre}</span>}
          {o.fechaSuperada && <span>Fecha superada</span>}
        </p>
      </div>
      <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/* ── El formulario de crear y editar (apartados 4, 5 y 13) ─────────────── */
export function FormularioObjetivo({ inicial = null, ejercicio, accent, onElegirEjercicio, onGuardar, onCancelar }) {
  const metricas = ejercicio ? metricasDeEjercicio(ejercicio) : [];
  const [tipo, setTipo] = useState(inicial ? inicial.tipo : (metricas[0] || 'reps'));
  const [valor, setValor] = useState(inicial && inicial.valor !== null ? String(inicial.valor).replace('.', ',') : '');
  const [fecha, setFecha] = useState(inicial ? inicial.fechaObjetivo : '');
  const [nota, setNota] = useState(inicial ? inicial.nota : '');
  const [motivo, setMotivo] = useState('');
  const t = tipoObjetivo(metricas.includes(tipo) ? tipo : metricas[0]) || null;
  const editando = !!inicial;
  return (
    <div className="space-y-4">
      <button
        onClick={onCancelar}
        aria-label="Volver a Mis objetivos"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ChevronLeft size={16} /> Mis objetivos
      </button>
      <h2 className="text-2xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {editando ? 'Editar objetivo' : 'Nuevo objetivo'}
      </h2>

      <Card>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>1 · Ejercicio</p>
        {ejercicio ? (
          <p className="text-base font-bold mt-1" style={{ color: COLORS.text }}>{nombreCompleto(ejercicio)}</p>
        ) : (
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>Todavía no has elegido ninguno.</p>
        )}
        {!editando && (
          <div className="mt-2.5">
            <GhostBtn icon={Dumbbell} onClick={onElegirEjercicio}>{ejercicio ? 'Cambiar ejercicio' : 'Elegir ejercicio'}</GhostBtn>
          </div>
        )}
      </Card>

      {ejercicio && (
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>2 · Qué quieres medir</p>
          {editando ? (
            <p className="text-sm font-bold mt-1" style={{ color: COLORS.text }}>{t ? t.nombre : ''}</p>
          ) : (
            <div className="mt-2">
              <Chips
                opciones={metricas.map((m) => ({ id: m, nombre: tipoObjetivo(m).nombre }))}
                valor={t ? t.id : null}
                onCambiar={setTipo}
                accent={accent}
                etiqueta="Métrica del objetivo"
              />
            </div>
          )}

          <p className="text-[10px] font-bold uppercase tracking-wider mt-4" style={{ color: COLORS.textMuted }}>3 · Objetivo</p>
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="text"
              inputMode={t && t.decimales ? 'decimal' : 'numeric'}
              value={valor}
              onChange={(ev) => { setValor(ev.target.value); setMotivo(''); }}
              placeholder={t && t.id === 'peso' ? '100' : t && t.id === 'duracion' ? '60' : '15'}
              aria-label={`Objetivo en ${t ? t.unidad : ''}`}
              className="h-11 w-28 rounded-xl px-3 text-base font-bold outline-none toque-44"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            />
            <span className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>{t ? (t.id === 'duracion' ? 'segundos' : t.unidad === 'reps' ? 'repeticiones' : 'kg') : ''}</span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wider mt-4" style={{ color: COLORS.textMuted }}>Fecha objetivo · opcional</p>
          <input
            type="date"
            value={fecha}
            onChange={(ev) => setFecha(ev.target.value)}
            aria-label="Fecha objetivo, opcional"
            className="h-11 rounded-xl px-3 text-base outline-none mt-1.5"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          />

          <p className="text-[10px] font-bold uppercase tracking-wider mt-4" style={{ color: COLORS.textMuted }}>Nota · opcional</p>
          <textarea
            value={nota}
            onChange={(ev) => setNota(ev.target.value)}
            rows={2}
            aria-label="Nota del objetivo, opcional"
            className="w-full rounded-xl px-3 py-2 text-base outline-none mt-1.5"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          />

          {motivo && <p className="text-xs mt-2" role="alert" style={{ color: COLORS.negative }}>{motivo}</p>}
          <div className="mt-3">
            <PrimaryButton
              accent={accent}
              onClick={() => {
                const r = onGuardar({ exerciseId: ejercicio.id, tipo: t ? t.id : tipo, valor, fechaObjetivo: fecha, nota });
                if (r && !r.ok) setMotivo(r.motivo);
              }}
            >
              {editando ? 'Guardar cambios' : 'Crear objetivo'}
            </PrimaryButton>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── El detalle de un objetivo (apartados 12, 14, 16, 17 y 18) ─────────── */
export function DetalleObjetivo({ objetivo, accent, onVolver, onVerProgreso, onEditar, onCancelarObjetivo, onEliminar }) {
  const [aviso, setAviso] = useState(null); // 'cancelar' | 'eliminar'
  const o = objetivo;
  const fila = (etiqueta, valor) => (valor ? (
    <div className="flex items-start justify-between gap-3 py-1.5" style={{ borderTop: `1px solid ${hexToRgba(COLORS.border, 0.5)}` }}>
      <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>{etiqueta}</span>
      <span className="text-xs font-semibold text-right" style={{ color: COLORS.text }}>{valor}</span>
    </div>
  ) : null);
  const textosAviso = aviso === 'cancelar' ? AVISO_CANCELAR_OBJETIVO : AVISO_ELIMINAR_OBJETIVO;
  return (
    <div className="space-y-4">
      <button
        onClick={onVolver}
        aria-label="Volver a Mis objetivos"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ChevronLeft size={16} /> Mis objetivos
      </button>
      <div>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Objetivo</p>
        <h2 className="text-2xl font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{o.nombre}</h2>
        <p className="text-base font-bold mt-1" style={{ color: COLORS.text }}>{o.objetivoTexto}</p>
      </div>

      <Card style={o.estado === 'completado' ? { border: `1px solid ${accent}` } : undefined}>
        {/* 🚨 Apartado 12 — «Objetivo conseguido», sin confeti ni recompensa. */}
        <p className="text-sm font-bold" style={{ color: o.estado === 'completado' ? accent : COLORS.text }}>{o.simbolo} {o.estadoNombre}</p>
        <p className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: o.sinDatos ? COLORS.textMuted : COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {o.progresoTexto}
        </p>
        {o.porcentaje !== null && (
          <>
            <div className="h-2 rounded-full overflow-hidden mt-2" style={{ background: hexToRgba(COLORS.border, 0.6) }} role="img" aria-label={`${o.porcentaje} % del objetivo`}>
              <div className="h-full rounded-full" style={{ width: `${o.porcentaje}%`, background: accent }} />
            </div>
            {/* Apartado 6 — el porcentaje es actual / objetivo, y se dice. */}
            <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{o.porcentaje} % del objetivo: tu mejor resultado entre lo que te propusiste.</p>
          </>
        )}
        {o.fechaSuperada && <p className="text-xs mt-2 font-semibold" style={{ color: COLORS.textMuted }}>Fecha superada · puedes seguir intentándolo</p>}
      </Card>

      <Card>
        {fila('Métrica', o.metrica)}
        {fila('Mejor resultado', o.mejor)}
        {fila('Tendencia', o.sinDatos ? '' : `${o.tendenciaSimbolo} ${o.tendenciaNombre}`)}
        {fila('Última sesión', o.ultimaSesion)}
        {fila('Conseguido el', o.conseguidoEn)}
        {fila('Creado el', o.creadoEn)}
        {fila('Fecha objetivo', o.fechaObjetivo)}
        {fila('Nota', o.nota)}
      </Card>

      {o.existe && onVerProgreso && (
        <PrimaryButton accent={accent} icon={ChevronRight} onClick={onVerProgreso}>Ver progreso del ejercicio</PrimaryButton>
      )}

      {aviso ? (
        <AvisoObjetivo
          textos={textosAviso}
          accent={accent}
          onNo={() => setAviso(null)}
          onSi={() => { const a = aviso; setAviso(null); if (a === 'cancelar') onCancelarObjetivo(); else onEliminar(); }}
        />
      ) : (
        <div className="flex gap-2 flex-wrap">
          {o.estado !== 'cancelado' && onEditar && <GhostBtn onClick={onEditar}>Editar</GhostBtn>}
          {o.estado !== 'cancelado' && onCancelarObjetivo && <GhostBtn onClick={() => setAviso('cancelar')}>Cancelar objetivo</GhostBtn>}
          {onEliminar && <GhostBtn onClick={() => setAviso('eliminar')}>Eliminar</GhostBtn>}
        </div>
      )}
    </div>
  );
}

function AvisoObjetivo({ textos, accent, onNo, onSi }) {
  return (
    <Card style={{ border: `1px solid ${accent}` }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>{textos.titulo}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{textos.texto}</p>
      <div className="flex gap-2 mt-3 flex-wrap">
        <GhostBtn onClick={onNo}>{textos.cancelar}</GhostBtn>
        <button
          onClick={onSi}
          aria-label={textos.confirmar}
          className="h-10 px-3.5 rounded-xl text-sm font-bold toque-44 active:scale-95"
          style={{ background: hexToRgba(COLORS.negative, 0.14), color: COLORS.negative }}
        >
          {textos.confirmar}
        </button>
      </div>
    </Card>
  );
}

/* ── La lista (apartados 15, 21 y 22) ──────────────────────────────────── */
export function ObjetivosProgreso({ resultado, filtro, onFiltro, grupo, onGrupo, accent, onAbrir, onCrear }) {
  const r = resultado;
  if (r.total === 0) {
    return (
      <Card>
        <div className="py-4 text-center">
          <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{OBJETIVOS_VACIO.titulo}</p>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{OBJETIVOS_VACIO.texto}</p>
          {onCrear && (
            <div className="mt-4 max-w-xs mx-auto">
              <PrimaryButton accent={accent} onClick={onCrear}>{OBJETIVOS_VACIO.cta}</PrimaryButton>
            </div>
          )}
        </div>
      </Card>
    );
  }
  /* Apartado 21 — «Cancelados» solo si los hay, y el filtro por grupo solo con
     bastantes objetivos para que sirva de algo. */
  const opciones = FILTROS_OBJETIVOS.filter((f) => f.id !== 'cancelado' || r.cancelados > 0);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle sub={`${r.activos} activos · ${r.completados} conseguidos`}>Mis objetivos</SectionTitle>
      </div>
      {onCrear && <GhostBtn onClick={onCrear}>+ Añadir objetivo</GhostBtn>}
      <Chips opciones={opciones} valor={filtro} onCambiar={onFiltro} accent={accent} etiqueta="Filtrar objetivos" />
      {r.total >= 4 && <Chips opciones={FILTROS_GRUPO} valor={grupo} onCambiar={onGrupo} accent={accent} etiqueta="Filtrar objetivos por grupo muscular" />}
      {r.objetivos.length === 0 ? (
        <EmptyHint text="No hay objetivos con este filtro." />
      ) : (
        <div className="space-y-2">
          {r.objetivos.map((o) => <TarjetaObjetivo key={o.id} objetivo={o} accent={accent} onAbrir={onAbrir} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ProgresoView({
  fitness, fotos = [], accent, onEntrenar = null, onIrAFotos = null, resumenFotos = null,
  onGuardarFitness = null, onEliminarObjetivo = null,
}) {
  const [seccion, setSeccion] = useState('resumen');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [abierto, setAbierto] = useState(null); // exerciseId
  const [rango, setRango] = useState('todo');
  const [vista, setVista] = useState(null); // { tipo: 'sesion' | 'ejercicio', id }
  /* FIT F13 — el periodo del progreso muscular, el grupo y el subgrupo abiertos,
     y el filtro por grupo de la lista de ejercicios (apartados 6, 8 y 13). */
  const [periodo, setPeriodo] = useState('todo');
  const [musculo, setMusculo] = useState(null);
  const [subgrupo, setSubgrupo] = useState(null);
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  /* FIT F14 — qué objetivo está abierto, si se crea o se edita, y el ejercicio
     elegido en el formulario: estado de pantalla, nunca un dato (EH F40). */
  const [objetivoAbierto, setObjetivoAbierto] = useState(null);
  const [formulario, setFormulario] = useState(null); // { modo: 'crear' | 'editar', exerciseId, eligiendo }
  const [filtroObjetivos, setFiltroObjetivos] = useState('todos');
  const [grupoObjetivos, setGrupoObjetivos] = useState('todos');
  const f = fitness || {};
  const propios = f.ejercicios || [];
  const hoy = todayISO();

  /* 🚨 Apartado 32 — las tarjetas, una vez por cambio en las sesiones. */
  const tarjetas = useMemo(() => tarjetasDeProgreso(f, { propios }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.sesiones, propios]);
  const resumen = useMemo(() => resumenDeProgreso(f, tarjetas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.sesiones, tarjetas]);
  const consulta = useMemo(() => {
    const c = consultarProgreso(tarjetas, { busqueda, filtro, propios });
    /* FIT F13, apartado 8 — el filtro por grupo usa la implicación del catálogo,
       el MISMO criterio que el detalle del músculo. */
    return filtroGrupo === 'todos' ? c : { ...c, tarjetas: c.tarjetas.filter((t) => ejercicioEnGrupo(t.exerciseId, filtroGrupo, propios)) };
  }, [tarjetas, busqueda, filtro, filtroGrupo, propios]);
  /* FIT F14, apartado 27 — los objetivos, una vez por sesiones y objetivos. */
  const objetivos = useMemo(() => listaDeObjetivos(f, { filtro: filtroObjetivos, grupo: grupoObjetivos, propios, hoy }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.sesiones, f.objetivos, filtroObjetivos, grupoObjetivos, propios, hoy]);
  /* FIT F13, apartado 19 — el resumen muscular, una vez por sesiones y periodo. */
  const muscular = useMemo(() => resumenMuscular(f, { rango: periodo, hoy, propios }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.sesiones, periodo, hoy, propios]);
  const detalle = useMemo(() => (abierto ? detalleDeProgreso(f, abierto, { propios, rango, hoy }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [abierto, f.sesiones, propios, rango, hoy]);

  /* Apartado 30 — «Ver entrenamiento» es la pantalla de la F10. */
  if (vista && vista.tipo === 'sesion') {
    const s = sesionDelHistorial(f, vista.id);
    return (
      <div className="max-w-2xl mx-auto">
        {s ? (
          <DetalleSesionHistorial detalle={detalleDeSesion(s, { fitness: f, propios, hoy })} accent={accent} onVolver={() => setVista(null)} onEliminar={null} />
        ) : (
          <div className="space-y-3">
            <EmptyHint text="Ese entrenamiento ya no está." />
            <GhostBtn icon={ChevronLeft} onClick={() => setVista(null)}>Volver</GhostBtn>
          </div>
        )}
      </div>
    );
  }
  /* Apartado 29 — y «Ver ejercicio», la ficha del catálogo de la F2. */
  if (vista && vista.tipo === 'ejercicio') {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <button
          onClick={() => setVista(null)}
          aria-label="Volver al progreso del ejercicio"
          className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ChevronLeft size={16} /> Progreso
        </button>
        <DetalleEjercicio ejercicio={ejercicioPorId(vista.id, propios)} accent={accent} />
      </div>
    );
  }

  /* ── FIT F14 · crear, editar y ver un objetivo ───────────────────────── */
  if (!detalle && !vista && formulario) {
    if (formulario.eligiendo) {
      /* Apartado 4 — *"La selección de ejercicio debe utilizar el catálogo
         existente"*: es `EjerciciosView` en modo elegir, como en el constructor. */
      return (
        <EjerciciosView
          propios={propios}
          accent={accent}
          volverA="Nuevo objetivo"
          onVolver={() => setFormulario({ ...formulario, eligiendo: false })}
          onElegir={(id) => setFormulario({ ...formulario, exerciseId: id, eligiendo: false })}
          yaElegidos={formulario.exerciseId ? [formulario.exerciseId] : []}
        />
      );
    }
    const inicial = formulario.modo === 'editar' ? (f.objetivos || []).find((o) => o.id === formulario.id) || null : null;
    return (
      <div className="max-w-2xl mx-auto">
        <FormularioObjetivo
          key={formulario.exerciseId || 'sin'}
          inicial={inicial}
          ejercicio={ejercicioPorId(formulario.exerciseId, propios)}
          accent={accent}
          onElegirEjercicio={() => setFormulario({ ...formulario, eligiendo: true })}
          onCancelar={() => setFormulario(null)}
          onGuardar={(datos) => {
            if (!onGuardarFitness) return { ok: false, motivo: 'No se puede guardar ahora.' };
            const r = inicial ? editarObjetivo(f, inicial.id, datos, { propios }) : anadirObjetivo(f, datos, { propios });
            if (r.ok) {
              onGuardarFitness(r.fitness);
              setFormulario(null);
              setObjetivoAbierto(r.objetivo.id);
            }
            return r;
          }}
        />
      </div>
    );
  }

  if (!detalle && !vista && objetivoAbierto) {
    const guardado = (f.objetivos || []).find((o) => o.id === objetivoAbierto) || null;
    if (guardado) {
      const datos = progresoDeObjetivo(f, guardado, { propios, hoy });
      return (
        <div className="max-w-2xl mx-auto">
          <DetalleObjetivo
            objetivo={datos}
            accent={accent}
            onVolver={() => setObjetivoAbierto(null)}
            /* Apartado 16 — «Ver progreso del ejercicio» es la pantalla de la F12. */
            onVerProgreso={() => setAbierto(guardado.exerciseId)}
            onEditar={onGuardarFitness ? () => setFormulario({ modo: 'editar', id: guardado.id, exerciseId: guardado.exerciseId }) : null}
            onCancelarObjetivo={onGuardarFitness ? () => onGuardarFitness(cancelarObjetivo(f, guardado.id)) : null}
            onEliminar={onEliminarObjetivo ? () => { onEliminarObjetivo(guardado.id); setObjetivoAbierto(null); } : null}
          />
        </div>
      );
    }
  }

  if (!detalle && musculo) {
    /* FIT F13 — Progreso → Músculos → grupo → subgrupo (apartados 6 y 9). */
    const grupo = muscular.grupos.find((g) => g.id === musculo) || null;
    const sub = grupo && subgrupo ? grupo.subgrupos.find((s) => s.id === subgrupo) || null : null;
    if (grupo) {
      return (
        <div className="max-w-2xl mx-auto">
          {sub ? (
            <DetalleMusculo
              musculo={sub}
              ejercicios={ejerciciosDeMusculo(muscular.senales, { subgrupoId: sub.id })}
              accent={accent}
              volverA={grupo.nombre}
              onVolver={() => setSubgrupo(null)}
              onEjercicio={setAbierto}
            />
          ) : (
            <DetalleMusculo
              musculo={grupo}
              subgrupos={grupo.subgrupos}
              ejercicios={ejerciciosDeMusculo(muscular.senales, { grupoId: grupo.id })}
              accent={accent}
              volverA="Progreso"
              onVolver={() => setMusculo(null)}
              onSubgrupo={setSubgrupo}
              onEjercicio={setAbierto}
            />
          )}
        </div>
      );
    }
  }

  if (detalle) {
    return (
      <div className="max-w-2xl mx-auto">
        <DetalleProgreso
          detalle={detalle}
          accent={accent}
          rango={rango}
          onRango={setRango}
          onVolver={() => { setAbierto(null); setRango('todo'); }}
          onVerEjercicio={() => setVista({ tipo: 'ejercicio', id: detalle.exerciseId })}
          onVerSesion={(id) => setVista({ tipo: 'sesion', id })}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Apartado 3 — la cabecera compacta. */}
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Tu progreso</h2>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Evolución de tu rendimiento</p>
      </div>

      <Chips opciones={SECCIONES_PROGRESO} valor={seccion} onCambiar={setSeccion} accent={accent} etiqueta="Secciones de Progreso" />

      {seccion === 'resumen' && (
        <ResumenProgreso resumen={resumen} accent={accent} onEntrenar={onEntrenar} onAbrir={setAbierto} />
      )}

      {seccion === 'objetivos' && (
        <ObjetivosProgreso
          resultado={objetivos}
          filtro={filtroObjetivos}
          onFiltro={setFiltroObjetivos}
          grupo={grupoObjetivos}
          onGrupo={setGrupoObjetivos}
          accent={accent}
          onAbrir={setObjetivoAbierto}
          onCrear={onGuardarFitness ? () => setFormulario({ modo: 'crear', exerciseId: null }) : null}
        />
      )}

      {seccion === 'musculos' && (
        <MusculosProgreso
          resumen={muscular}
          periodo={periodo}
          onPeriodo={setPeriodo}
          accent={accent}
          onAbrir={(id) => { setSubgrupo(null); setMusculo(id); }}
          onEntrenar={onEntrenar}
        />
      )}

      {seccion === 'ejercicios' && (
        tarjetas.length === 0 ? (
          <ResumenProgreso resumen={{ ...resumen, suficiente: false }} accent={accent} onEntrenar={onEntrenar} onAbrir={setAbierto} />
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-2 h-11 px-3 rounded-xl" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <Search size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(ev) => setBusqueda(ev.target.value)}
                placeholder="Buscar ejercicio"
                aria-label="Buscar ejercicio en tu progreso"
                className="flex-1 min-w-0 bg-transparent outline-none text-base"
                style={{ color: COLORS.text }}
              />
            </label>
            <Chips opciones={FILTROS_PROGRESO} valor={filtro} onCambiar={setFiltro} accent={accent} etiqueta="Filtrar por tendencia" />
            {/* FIT F13, apartado 8 — y por grupo muscular. */}
            <Chips opciones={FILTROS_GRUPO} valor={filtroGrupo} onCambiar={setFiltroGrupo} accent={accent} etiqueta="Filtrar por grupo muscular" />

            {consulta.tarjetas.length === 0 && consulta.nuncaHechos.length === 0 && (
              <Card>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>No hay ejercicios que coincidan.</p>
                <div className="mt-2">
                  <GhostBtn icon={X} onClick={() => { setBusqueda(''); setFiltro('todos'); setFiltroGrupo('todos'); }}>Limpiar</GhostBtn>
                </div>
              </Card>
            )}
            <div className="space-y-2">
              {consulta.tarjetas.map((t) => <TarjetaProgreso key={t.exerciseId} tarjeta={t} accent={accent} onAbrir={setAbierto} />)}
            </div>
            {/* Apartado 9 — los que nunca ha hecho, APARTE. */}
            {consulta.nuncaHechos.length > 0 && (
              <div>
                <SectionTitle sub="Todavía no los has registrado">Sin datos</SectionTitle>
                <div className="space-y-1.5">
                  {consulta.nuncaHechos.map((e) => (
                    <button
                      key={e.exerciseId}
                      onClick={() => setVista({ tipo: 'ejercicio', id: e.exerciseId })}
                      aria-label={`Ver la ficha de ${e.nombre}`}
                      className="w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2"
                      style={{ background: hexToRgba(COLORS.border, 0.25) }}
                    >
                      <span className="text-sm min-w-0 flex-1 truncate" style={{ color: COLORS.text }}>{e.nombre}</span>
                      <span className="text-[11px]" style={{ color: COLORS.textMuted }}>Sin datos</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Apartado 2 — Fotos: la estructura, compatible con el sistema que llegará.
          Cuenta las de Salud física y lleva allí, que es donde viven. */}
      {seccion === 'fotos' && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
              <Camera size={19} />
            </div>
            <p className="text-sm min-w-0 flex-1" style={{ color: COLORS.text }}>
              {resumenFotos ? resumenFotos.texto : `${(fotos || []).length} fotos de progreso`}
            </p>
          </div>
          {onIrAFotos && (
            <div className="mt-3">
              <GhostBtn icon={Camera} onClick={onIrAFotos}>{resumenFotos && resumenFotos.vacio ? 'Añadir foto' : 'Ver y añadir fotos'}</GhostBtn>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
