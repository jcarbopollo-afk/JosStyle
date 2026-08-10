import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, Eye, EyeOff, Lock, Unlock, Palette,
  Star, Zap, Flame, Sparkles, Compass, Gem, Anchor, Feather, Plane,
} from 'lucide-react';
import { COLORS, ICONOS_PERSONALIZABLES_IDS, METRICAS_FAVORITAS_DISPONIBLES, MAX_METRICAS_FAVORITAS, MODOS_APP } from '../tokens';
import { Card } from '../components/ui';

export const ICONOS_PERSONALIZABLES_MAP = { star: Star, zap: Zap, flame: Flame, sparkles: Sparkles, compass: Compass, gem: Gem, anchor: Anchor, feather: Feather };

function IconoPicker({ moduloId, iconoActual, onSetIcono, accent }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap py-2 pl-1">
      <button
        onClick={() => onSetIcono(moduloId, null)}
        className="text-xs px-2 py-1 rounded-lg font-medium"
        style={{ background: !iconoActual ? accent : COLORS.surface2, color: !iconoActual ? '#080A0D' : COLORS.textMuted }}
      >
        Original
      </button>
      {ICONOS_PERSONALIZABLES_IDS.map((key) => {
        const Icon = ICONOS_PERSONALIZABLES_MAP[key];
        const activo = iconoActual === key;
        return (
          <button
            key={key}
            onClick={() => onSetIcono(moduloId, key)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: activo ? accent : COLORS.surface2, border: `1px solid ${activo ? accent : COLORS.border}` }}
            aria-label={key}
          >
            <Icon size={14} style={{ color: activo ? '#080A0D' : COLORS.textMuted }} />
          </button>
        );
      })}
    </div>
  );
}

function FilaModulo({ modulo, index, total, personalizacion, onMove, onToggleOculto, onSetIcono, onTogglePinExtra, accent }) {
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [confirmandoOcultar, setConfirmandoOcultar] = useState(false);

  const oculto = personalizacion.ocultos.includes(modulo.id);
  const esRelacion = modulo.id === 'relacion';
  const protegidoExtra = esRelacion || personalizacion.pinExtra.includes(modulo.id);
  const IconoBase = modulo.icon;
  const IconoElegido = ICONOS_PERSONALIZABLES_MAP[personalizacion.iconos[modulo.id]];
  const Icono = IconoElegido || IconoBase;

  return (
    <div className="py-2" style={{ borderBottom: index < total - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
      <div className="flex items-center gap-2.5">
        <button onClick={() => setPickerAbierto((s) => !s)} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }} aria-label="Cambiar icono">
          <Icono size={15} style={{ color: accent }} />
        </button>
        <p className="text-sm font-medium flex-1" style={{ color: oculto ? COLORS.textMuted : COLORS.text }}>{modulo.label}</p>

        <button onClick={() => onMove(modulo.id, -1)} disabled={index === 0} className="p-1 disabled:opacity-30" aria-label="Subir">
          <ChevronUp size={15} style={{ color: COLORS.textMuted }} />
        </button>
        <button onClick={() => onMove(modulo.id, 1)} disabled={index === total - 1} className="p-1 disabled:opacity-30" aria-label="Bajar">
          <ChevronDown size={15} style={{ color: COLORS.textMuted }} />
        </button>

        <button
          onClick={() => (esRelacion ? null : onTogglePinExtra(modulo.id))}
          disabled={esRelacion}
          className="p-1 disabled:opacity-50"
          aria-label={protegidoExtra ? 'Quitar PIN' : 'Proteger con PIN'}
          title={esRelacion ? 'Relación siempre está protegida' : undefined}
        >
          {protegidoExtra ? <Lock size={15} style={{ color: accent }} /> : <Unlock size={15} style={{ color: COLORS.textMuted }} />}
        </button>

        <button
          onClick={() => (oculto ? onToggleOculto(modulo.id) : setConfirmandoOcultar(true))}
          className="p-1"
          aria-label={oculto ? 'Mostrar sección' : 'Ocultar sección'}
        >
          {oculto ? <EyeOff size={15} style={{ color: COLORS.textMuted }} /> : <Eye size={15} style={{ color: COLORS.textMuted }} />}
        </button>
      </div>

      {confirmandoOcultar && (
        <div className="flex items-center justify-between mt-2 px-2 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>¿Ocultar "{modulo.label}" de Más? Podrás volver a mostrarla cuando quieras.</p>
          <div className="flex gap-2 flex-shrink-0 ml-2">
            <button onClick={() => setConfirmandoOcultar(false)} className="text-xs font-semibold px-2 py-1" style={{ color: COLORS.textMuted }}>Cancelar</button>
            <button
              onClick={() => { onToggleOculto(modulo.id); setConfirmandoOcultar(false); }}
              className="text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ background: accent, color: '#080A0D' }}
            >
              Ocultar
            </button>
          </div>
        </div>
      )}

      {pickerAbierto && (
        <IconoPicker moduloId={modulo.id} iconoActual={personalizacion.iconos[modulo.id]} onSetIcono={(id, key) => { onSetIcono(id, key); }} accent={accent} />
      )}
    </div>
  );
}

function FavoritasSection({ personalizacion, onToggleFavorita, onMoveFavorita, accent }) {
  const seleccionadas = personalizacion.favoritas;
  const alLimite = seleccionadas.length >= MAX_METRICAS_FAVORITAS;

  return (
    <Card>
      <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Métricas favoritas en "Hoy"</p>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Elige hasta {MAX_METRICAS_FAVORITAS} para verlas siempre arriba en el panel Hoy.</p>

      {seleccionadas.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {seleccionadas.map((id, i) => {
            const m = METRICAS_FAVORITAS_DISPONIBLES.find((x) => x.id === id);
            if (!m) return null;
            return (
              <div key={id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: COLORS.surface2 }}>
                <p className="text-xs flex-1" style={{ color: COLORS.text }}>{m.label}</p>
                <button onClick={() => onMoveFavorita(id, -1)} disabled={i === 0} className="p-0.5 disabled:opacity-30"><ChevronUp size={13} style={{ color: COLORS.textMuted }} /></button>
                <button onClick={() => onMoveFavorita(id, 1)} disabled={i === seleccionadas.length - 1} className="p-0.5 disabled:opacity-30"><ChevronDown size={13} style={{ color: COLORS.textMuted }} /></button>
                <button onClick={() => onToggleFavorita(id)} className="text-xs font-semibold px-1.5" style={{ color: COLORS.negative }}>Quitar</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {METRICAS_FAVORITAS_DISPONIBLES.filter((m) => !seleccionadas.includes(m.id)).map((m) => (
          <button
            key={m.id}
            onClick={() => !alLimite && onToggleFavorita(m.id)}
            disabled={alLimite}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-40"
            style={{ background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
          >
            + {m.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

// Fase 20 — Modos "viaje/vacaciones/exámenes": plantillas ligeras, no un motor configurable.
// Tocar un modo ya activo lo desactiva (onSetModo hace el toggle en App.jsx). No toca MORE_NAV
// ni oculta nada — solo activa el aviso de MODOS_APP en el Dashboard (ver DashboardView.jsx).
function ModoAppSection({ modo, onSetModo, accent }) {
  return (
    <Card>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
        <Plane size={16} style={{ color: accent }} /> Modo actual
      </p>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
        Activa un modo para ver recordatorios relevantes en "Hoy" durante unos días. Vuelve a tocarlo para desactivarlo.
      </p>
      <div className="flex gap-2 flex-wrap">
        {MODOS_APP.map((m) => {
          const activo = modo === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSetModo(m.id)}
              className="text-xs px-3 py-2 rounded-xl font-semibold"
              style={{ background: activo ? accent : COLORS.surface2, color: activo ? '#080A0D' : COLORS.textMuted, border: `1px solid ${activo ? accent : COLORS.border}` }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default function PersonalizationView({ modulos, personalizacion, onMove, onToggleOculto, onSetIcono, onTogglePinExtra, onToggleFavorita, onMoveFavorita, modo, onSetModo, accent }) {
  return (
    <div className="space-y-4">
      <ModoAppSection modo={modo} onSetModo={onSetModo} accent={accent} />
      <Card>
        <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
          <Palette size={16} style={{ color: accent }} /> Personalización avanzada
        </p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
          Reordena, oculta, cambia el icono o protege con PIN cualquier sección de "Más". Los 4 accesos de abajo y Ajustes se quedan siempre fijos.
        </p>
        <div>
          {modulos.map((m, i) => (
            <FilaModulo
              key={m.id}
              modulo={m}
              index={i}
              total={modulos.length}
              personalizacion={personalizacion}
              onMove={onMove}
              onToggleOculto={onToggleOculto}
              onSetIcono={onSetIcono}
              onTogglePinExtra={onTogglePinExtra}
              accent={accent}
            />
          ))}
        </div>
      </Card>

      <FavoritasSection personalizacion={personalizacion} onToggleFavorita={onToggleFavorita} onMoveFavorita={onMoveFavorita} accent={accent} />
    </div>
  );
}
