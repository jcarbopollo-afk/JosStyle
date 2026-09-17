/* ===========================================================================
   ENTREGA 4 · FASE 10/45 — EL HISTORIAL DE ENTRENAMIENTOS

   *"Completar un entrenamiento → guardarlo → abrir Historial → encontrarlo →
   abrirlo → consultar exactamente lo que hice."* Y además: *"Buscar → filtrar →
   abrir → eliminar"* (apartado 45).

   🚨 **ESTA PANTALLA NO CALCULA NADA** — la regla de todo Fitness. Qué sesiones
   entran, las tarjetas, los filtros combinados, el orden, los grupos por fecha
   y el detalle salen de `src/lib/historial.js`, que a su vez se apoya en el
   resumen de la F8 y en planificado/realizado de la F9. Aquí se pinta y se
   llama.

   🚨 **Y ES DE CONSULTA** (apartado 30): no hay un solo campo que escriba en una
   sesión. Lo único que cambia algo es «Eliminar entrenamiento», que pregunta y
   va a la papelera.

   ⚠️ Lo que es estado de pantalla: los filtros, qué sesión está abierta, qué
   ejercicio está desplegado y cuántas tarjetas se enseñan. Nada de eso se
   guarda: volver al historial otro día lo abre limpio (EH F40).
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, SlidersHorizontal, X,
  Clock, Calendar, Dumbbell, Layers, Weight, Check, Minus, Trash2, Play,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO } from '../lib/helpers';
import { Card, GhostBtn, PrimaryButton, EmptyHint } from '../components/ui';
import { DatoResumen } from './FinalizacionView';
import {
  sesionesDelHistorial, fichaDeHistorial, consultarHistorial, detalleDeSesion, sesionDelHistorial,
  FILTROS_FECHA, ORDENES_HISTORIAL, FILTROS_POR_DEFECTO, PAGINA_HISTORIAL,
  HISTORIAL_VACIO, SIN_RESULTADOS, AVISO_ELIMINAR_SESION, SESION_YA_NO_ESTA,
} from '../lib/historial';

/* ── Un grupo de chips con su nombre (apartados 11-14 y 42) ────────────────
   ⚠️ `aria-pressed` y un ✓: el filtro elegido no se distingue solo por color. */
function GrupoChips({ titulo, opciones, valor, onCambiar, accent }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textMuted }}>{titulo}</p>
      <div className="flex gap-1.5 flex-wrap" role="group" aria-label={titulo}>
        {opciones.map((o) => {
          const activo = valor === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onCambiar(o.id)}
              aria-pressed={activo}
              className="h-9 px-3 rounded-xl text-xs font-semibold toque-44 active:scale-95 inline-flex items-center gap-1"
              style={{
                background: activo ? accent : hexToRgba(COLORS.border, 0.45),
                color: activo ? COLORS.textOnAccent : COLORS.text,
              }}
            >
              {activo && <Check size={12} aria-hidden="true" />}
              {o.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Los filtros (apartados 10-15, 33 y 34) ────────────────────────────── */
export function FiltrosHistorial({ filtros, consulta, accent, abiertos, onAbrir, onCambiar, onLimpiar }) {
  const cambiar = (campo) => (valor) => onCambiar({ ...filtros, [campo]: valor });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="flex-1 min-w-0 flex items-center gap-2 h-11 px-3 rounded-xl" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <Search size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
          <input
            type="search"
            value={filtros.busqueda}
            onChange={(ev) => cambiar('busqueda')(ev.target.value)}
            placeholder="Buscar por nombre"
            aria-label="Buscar entrenamientos por nombre"
            className="flex-1 min-w-0 bg-transparent outline-none text-base"
            style={{ color: COLORS.text }}
          />
        </label>
        <button
          onClick={onAbrir}
          aria-expanded={abiertos}
          aria-label={abiertos ? 'Ocultar filtros' : 'Mostrar filtros'}
          className="h-11 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 toque-44 active:scale-95 shrink-0"
          style={{
            background: abiertos || consulta.hayFiltros ? hexToRgba(accent, 0.16) : COLORS.surface2,
            color: abiertos || consulta.hayFiltros ? accent : COLORS.text,
            border: `1px solid ${abiertos || consulta.hayFiltros ? accent : COLORS.border}`,
          }}
        >
          <SlidersHorizontal size={15} aria-hidden="true" /> Filtros
        </button>
      </div>

      {abiertos && (
        <Card>
          <div className="space-y-3">
            <GrupoChips titulo="Fecha" opciones={FILTROS_FECHA} valor={filtros.fecha} onCambiar={cambiar('fecha')} accent={accent} />
            {filtros.fecha === 'rango' && (
              <div className="grid grid-cols-2 gap-2">
                {[['desde', 'Desde'], ['hasta', 'Hasta']].map(([campo, etiqueta]) => (
                  <label key={campo} className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{etiqueta}</span>
                    <input
                      type="date"
                      value={filtros[campo]}
                      onChange={(ev) => cambiar(campo)(ev.target.value)}
                      aria-label={`${etiqueta} esta fecha`}
                      className="w-full h-11 rounded-xl px-2 text-base outline-none mt-1"
                      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    />
                  </label>
                ))}
              </div>
            )}
            {/* 🚨 Apartado 12 — *"No crear filtros que no tengan datos reales"*:
                un grupo solo aparece si hay al menos DOS opciones con sesiones. */}
            {consulta.opcionesPlan.length > 2 && (
              <GrupoChips titulo="Plan" opciones={consulta.opcionesPlan} valor={filtros.plan} onCambiar={cambiar('plan')} accent={accent} />
            )}
            {consulta.opcionesEntorno.length > 2 && (
              <GrupoChips titulo="Entorno" opciones={consulta.opcionesEntorno} valor={filtros.entorno} onCambiar={cambiar('entorno')} accent={accent} />
            )}
            <GrupoChips titulo="Ordenar" opciones={ORDENES_HISTORIAL} valor={filtros.orden} onCambiar={cambiar('orden')} accent={accent} />
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 px-1">
        {/* Apartado 15 — el número sale de las sesiones DESPUÉS de filtrar. */}
        <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }} aria-live="polite">
          {consulta.contador}
          {consulta.hayFiltros && consulta.cuantas !== consulta.total ? ` de ${consulta.total}` : ''}
        </p>
        {consulta.hayFiltros && (
          <button
            onClick={onLimpiar}
            className="text-xs font-bold inline-flex items-center gap-1 px-2 py-1.5 rounded-lg toque-44"
            style={{ color: accent }}
          >
            <X size={13} aria-hidden="true" /> Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}

/* ── La tarjeta (apartados 6 y 7) ──────────────────────────────────────── */
export function TarjetaHistorial({ ficha, agrupado, accent, onAbrir }) {
  const f = ficha;
  /* Apartado 5 — *"No repetir innecesariamente la fecha en cada tarjeta"*:
     dentro de un grupo por fecha, la tarjeta lleva la hora. */
  const cuando = agrupado ? f.hora : f.etiquetaFecha;
  return (
    <button
      onClick={() => onAbrir(f.id)}
      aria-label={`Abrir ${f.nombre}, ${f.etiquetaFecha}`}
      className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(accent, 0.14), color: accent }}
      >
        <Dumbbell size={19} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {f.nombre}
        </p>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {[cuando, f.duracion].filter(Boolean).join(' · ')}
        </p>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {[f.ejerciciosTexto, f.seriesTexto, f.entornoNombre].filter(Boolean).join(' · ')}
        </p>
      </div>
      <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/* ── El estado vacío (apartado 9) ──────────────────────────────────────── */
export function HistorialVacio({ accent, onEmpezar }) {
  return (
    <Card>
      <div className="py-4 text-center">
        <div
          className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: hexToRgba(accent, 0.14), color: accent }}
        >
          <Dumbbell size={24} aria-hidden="true" />
        </div>
        <p className="text-base font-bold mt-3" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {HISTORIAL_VACIO.titulo}
        </p>
        <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{HISTORIAL_VACIO.texto}</p>
        {onEmpezar && (
          <div className="mt-4 max-w-xs mx-auto">
            <PrimaryButton accent={accent} icon={Play} onClick={onEmpezar}>{HISTORIAL_VACIO.cta}</PrimaryButton>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Una serie del detalle (apartados 19, 20 y 22) ─────────────────────── */
function FilaSerie({ fila, accent }) {
  const hecha = fila.estado === 'hecha';
  const omitida = fila.estado === 'omitida';
  return (
    <div
      className="grid gap-2 items-center py-1.5 text-xs"
      style={{ gridTemplateColumns: '3.2rem 1fr 1fr 5.2rem', borderTop: `1px solid ${hexToRgba(COLORS.border, 0.6)}`, opacity: omitida ? 0.6 : 1 }}
    >
      <span className="font-bold" style={{ color: COLORS.text }}>
        {fila.numero ?? '—'}
        {fila.extra && <span className="block text-[9px] font-bold uppercase" style={{ color: COLORS.textMuted }}>Extra</span>}
      </span>
      <span className="tabular-nums" style={{ color: COLORS.text }}>{omitida ? '—' : fila.peso}</span>
      <span className="tabular-nums" style={{ color: COLORS.text }}>{omitida ? '—' : fila.medida}</span>
      {/* El estado lleva palabra e icono, nunca solo color (apartado 42). */}
      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: hecha ? accent : COLORS.textMuted }}>
        {hecha ? <Check size={12} aria-hidden="true" /> : <Minus size={12} aria-hidden="true" />}
        {fila.estadoTexto}
      </span>
    </div>
  );
}

/* ── Un ejercicio del detalle, desplegable (apartados 18-25) ───────────── */
export function EjercicioHistorial({ ejercicio, accent, abierto = false, onAlternar }) {
  const e = ejercicio;
  const nada = e.estado === 'no_realizado';
  return (
    <Card>
      <button
        onClick={onAlternar}
        aria-expanded={abierto}
        aria-label={`${abierto ? 'Ocultar' : 'Ver'} las series de ${e.nombre}`}
        className="w-full text-left flex items-start gap-2"
      >
        <div className="min-w-0 flex-1">
          {/* 🚨 Apartado 21 — el que pedía el plan y el que hizo, con la flecha. */}
          {e.sustituido && (
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              <span className="line-through">{e.original}</span> ↓ sustituido por
            </p>
          )}
          <p className="text-sm font-bold" style={{ color: nada ? COLORS.textMuted : COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {e.nombre}
          </p>
          {e.variante && <p className="text-[11px]" style={{ color: accent }}>{e.variante}</p>}
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            {nada ? 'No realizado' : e.seriesTexto}
          </p>
        </div>
        {abierto
          ? <ChevronUp size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />
          : <ChevronDown size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
      </button>

      {/* 🚨 Apartado 25 — planificado y realizado, cada uno con su nombre. */}
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <div className="rounded-xl px-2.5 py-2" style={{ background: hexToRgba(COLORS.border, 0.3) }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Planificado</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: COLORS.text }}>{e.planificado || 'Sin planificar'}</p>
        </div>
        <div className="rounded-xl px-2.5 py-2" style={{ background: hexToRgba(accent, 0.1) }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Realizado</p>
          <p className="text-sm font-bold tabular-nums truncate" style={{ color: COLORS.text }}>{e.realizado || '—'}</p>
        </div>
      </div>
      {e.realizadoDetalle.length > 0 && (
        <p className="text-[11px] mt-2 tabular-nums" style={{ color: COLORS.textMuted }}>
          {e.realizadoDetalle.join(' · ')}
        </p>
      )}
      {/* 🔓 FIT F11, apartado 34 — la comparación con la vez anterior, discreta y
          solo si la hay. La flecha acompaña a la palabra, no la sustituye. */}
      {e.comparacion && (
        <p className="text-[11px] mt-1.5 font-semibold" style={{ color: e.comparacion.estado === 'mejora' ? accent : COLORS.textMuted }}>
          {e.comparacion.estado === 'mejora' ? '↑ ' : e.comparacion.estado === 'descenso' ? '↓ ' : '= '}{e.comparacion.texto}
        </p>
      )}
      {/* Apartado 23 — la nota, y sin bloque vacío si no la hay. */}
      {e.notas && (
        <p className="text-xs mt-2" style={{ color: COLORS.text }}>📝 {e.notas}</p>
      )}

      {abierto && (
        <div className="mt-3">
          <div
            className="grid gap-2 pb-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ gridTemplateColumns: '3.2rem 1fr 1fr 5.2rem', color: COLORS.textMuted }}
          >
            <span>Serie</span><span>Peso</span><span>{e.porTiempo ? 'Tiempo' : 'Reps'}</span><span>Estado</span>
          </div>
          {e.filas.map((f) => <FilaSerie key={f.id} fila={f} accent={accent} />)}
        </div>
      )}
    </Card>
  );
}

/* ── El detalle de una sesión (apartados 16-29) ────────────────────────── */
export function DetalleSesionHistorial({ detalle, accent, onVolver, onEliminar }) {
  const [abiertos, setAbiertos] = useState(() => new Set());
  const [confirmando, setConfirmando] = useState(false);
  const d = detalle;
  const alternar = (id) => setAbiertos((prev) => {
    const s = new Set(prev);
    if (s.has(id)) s.delete(id); else s.add(id);
    return s;
  });

  return (
    <div className="space-y-4">
      <button
        onClick={onVolver}
        aria-label="Volver al historial"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ChevronLeft size={16} /> Historial
      </button>

      <div>
        <h2 className="text-2xl font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {d.nombre}
        </h2>
        <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
          {[d.fechaTexto, d.duracion].filter(Boolean).join(' · ')}
        </p>
        {(d.entornoNombre || d.planNombre) && (
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            {[d.entornoNombre, d.planNombre].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Apartados 17 y 26 — la información general, y el volumen solo si vale. */}
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <DatoResumen icono={Clock} etiqueta="Inicio" valor={d.inicio} accent={accent} />
          <DatoResumen icono={Clock} etiqueta="Final" valor={d.fin} accent={accent} />
          <DatoResumen icono={Calendar} etiqueta="Duración" valor={d.duracion} accent={accent} />
          <DatoResumen icono={Dumbbell} etiqueta="Ejercicios" valor={d.ejerciciosTexto} accent={accent} />
          <DatoResumen icono={Layers} etiqueta="Series" valor={d.seriesTexto} accent={accent} />
          {d.volumen && <DatoResumen icono={Weight} etiqueta="Volumen" valor={d.volumen.texto} accent={accent} />}
        </div>
        {d.volumen && d.volumen.nota && (
          <p className="text-[11px] mt-2.5" style={{ color: COLORS.textMuted }}>{d.volumen.nota}</p>
        )}
      </Card>

      {/* Apartado 24 — la nota general, solo si existe. */}
      {d.notas && (
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Notas</p>
          <p className="text-sm mt-1" style={{ color: COLORS.text }}>{d.notas}</p>
        </Card>
      )}

      <div className="space-y-2">
        {d.ejercicios.length === 0 && <EmptyHint text="Este entrenamiento no tiene ejercicios registrados." />}
        {d.ejercicios.map((e) => (
          <EjercicioHistorial
            key={e.id}
            ejercicio={e}
            accent={accent}
            abierto={abiertos.has(e.id)}
            onAlternar={() => alternar(e.id)}
          />
        ))}
      </div>

      {/* Apartados 28 y 29 — eliminar, preguntando. */}
      {onEliminar && (confirmando ? (
        <Card style={{ border: `1px solid ${COLORS.negative}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {AVISO_ELIMINAR_SESION.titulo}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{AVISO_ELIMINAR_SESION.texto}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <GhostBtn onClick={() => setConfirmando(false)}>{AVISO_ELIMINAR_SESION.cancelar}</GhostBtn>
            <button
              onClick={() => { setConfirmando(false); onEliminar(d.id); }}
              aria-label="Eliminar este entrenamiento del historial"
              className="h-10 px-3.5 rounded-xl text-sm font-bold toque-44 active:scale-95"
              style={{ background: hexToRgba(COLORS.negative, 0.16), color: COLORS.negative }}
            >
              {AVISO_ELIMINAR_SESION.eliminar}
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setConfirmando(true)}
          className="w-full h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 toque-44"
          style={{ color: COLORS.negative, background: hexToRgba(COLORS.negative, 0.08) }}
        >
          <Trash2 size={16} aria-hidden="true" /> Eliminar entrenamiento
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════ */
export default function HistorialView({
  fitness, propios = [], accent, onVolver, onEmpezar = null, onEliminar = null,
}) {
  const [filtros, setFiltros] = useState(FILTROS_POR_DEFECTO);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [pagina, setPagina] = useState(1);
  const hoy = todayISO();
  const f = fitness || {};

  /* 🚨 Apartado 32 — las tarjetas se hacen UNA vez por cambio en las sesiones,
     no en cada tecla de la búsqueda. */
  const fichas = useMemo(
    () => sesionesDelHistorial(f).map((s) => fichaDeHistorial(s, { fitness: f, propios, hoy })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.sesiones, f.plantillas, f.planActivo, propios, hoy],
  );
  const consulta = useMemo(() => consultarHistorial(fichas, filtros, { hoy }), [fichas, filtros, hoy]);
  const sesionAbierta = abierta ? sesionDelHistorial(f, abierta) : null;
  /* Y el detalle completo, solo al abrirlo (apartado 32). */
  const detalle = useMemo(
    () => (sesionAbierta ? detalleDeSesion(sesionAbierta, { fitness: f, propios, hoy }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sesionAbierta, propios, hoy],
  );

  const cambiarFiltros = (siguientes) => { setFiltros(siguientes); setPagina(1); };

  /* ── El detalle ─────────────────────────────────────────────────────── */
  if (abierta) {
    if (!detalle) {
      /* Apartado 29 — la sesión ya no existe: un estado coherente, no un hueco. */
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{SESION_YA_NO_ESTA.titulo}</p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{SESION_YA_NO_ESTA.texto}</p>
            <div className="mt-3">
              <GhostBtn icon={ChevronLeft} onClick={() => setAbierta(null)}>{SESION_YA_NO_ESTA.volver}</GhostBtn>
            </div>
          </Card>
        </div>
      );
    }
    return (
      <div className="max-w-2xl mx-auto">
        <DetalleSesionHistorial
          detalle={detalle}
          accent={accent}
          onVolver={() => setAbierta(null)}
          onEliminar={onEliminar ? (id) => { onEliminar(id); setAbierta(null); } : null}
        />
      </div>
    );
  }

  const visibles = consulta.fichas.slice(0, PAGINA_HISTORIAL * pagina);
  const idsVisibles = new Set(visibles.map((x) => x.id));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={onVolver}
        aria-label="Volver a Entrenamiento"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ChevronLeft size={16} /> Entrenamiento
      </button>
      <h2 className="text-2xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Historial</h2>

      {consulta.vacio ? (
        <HistorialVacio accent={accent} onEmpezar={onEmpezar} />
      ) : (
        <>
          <FiltrosHistorial
            filtros={filtros}
            consulta={consulta}
            accent={accent}
            abiertos={filtrosAbiertos}
            onAbrir={() => setFiltrosAbiertos((v) => !v)}
            onCambiar={cambiarFiltros}
            onLimpiar={() => cambiarFiltros(FILTROS_POR_DEFECTO)}
          />

          {consulta.sinResultados ? (
            /* Apartado 35 — hay sesiones, pero los filtros no encuentran ninguna. */
            <Card>
              <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{SIN_RESULTADOS.titulo}</p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{SIN_RESULTADOS.texto}</p>
              <div className="mt-3">
                <GhostBtn icon={X} onClick={() => cambiarFiltros(FILTROS_POR_DEFECTO)}>{SIN_RESULTADOS.limpiar}</GhostBtn>
              </div>
            </Card>
          ) : consulta.agrupado ? (
            <div className="space-y-4">
              {consulta.grupos
                .map((g) => ({ ...g, fichas: g.fichas.filter((x) => idsVisibles.has(x.id)) }))
                .filter((g) => g.fichas.length > 0)
                .map((g) => (
                  <section key={g.fecha} aria-label={g.etiqueta}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: COLORS.textMuted }}>{g.etiqueta}</p>
                    <div className="space-y-2">
                      {g.fichas.map((x) => <TarjetaHistorial key={x.id} ficha={x} agrupado accent={accent} onAbrir={setAbierta} />)}
                    </div>
                  </section>
                ))}
            </div>
          ) : (
            <div className="space-y-2">
              {visibles.map((x) => <TarjetaHistorial key={x.id} ficha={x} agrupado={false} accent={accent} onAbrir={setAbierta} />)}
            </div>
          )}

          {visibles.length < consulta.fichas.length && (
            <GhostBtn onClick={() => setPagina((p) => p + 1)}>
              Ver más ({consulta.fichas.length - visibles.length})
            </GhostBtn>
          )}
        </>
      )}
    </div>
  );
}
