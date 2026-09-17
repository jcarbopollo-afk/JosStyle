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
import { DetalleEjercicio } from './EjerciciosView';
import { DetalleSesionHistorial } from './HistorialView';
import { ejercicioPorId } from '../lib/ejercicios';
import { detalleDeSesion, sesionDelHistorial } from '../lib/historial';
import {
  tarjetasDeProgreso, consultarProgreso, resumenDeProgreso, detalleDeProgreso, geometriaGrafica,
  FILTROS_PROGRESO, RANGOS_GRAFICA, PROGRESO_VACIO,
} from '../lib/progresoEjercicios';

/* Las secciones de Progreso (apartado 2). */
export const SECCIONES_PROGRESO = [
  { id: 'resumen', nombre: 'Resumen' },
  { id: 'ejercicios', nombre: 'Ejercicios' },
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
   LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ProgresoView({ fitness, fotos = [], accent, onEntrenar = null, onIrAFotos = null, resumenFotos = null }) {
  const [seccion, setSeccion] = useState('resumen');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [abierto, setAbierto] = useState(null); // exerciseId
  const [rango, setRango] = useState('todo');
  const [vista, setVista] = useState(null); // { tipo: 'sesion' | 'ejercicio', id }
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
  const consulta = useMemo(() => consultarProgreso(tarjetas, { busqueda, filtro, propios }), [tarjetas, busqueda, filtro, propios]);
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

            {consulta.tarjetas.length === 0 && consulta.nuncaHechos.length === 0 && (
              <Card>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>No hay ejercicios que coincidan.</p>
                <div className="mt-2">
                  <GhostBtn icon={X} onClick={() => { setBusqueda(''); setFiltro('todos'); }}>Limpiar</GhostBtn>
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
