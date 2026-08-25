import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, Lock, Unlock, Palette, LayoutGrid,
  Star, Zap, Flame, Sparkles, Compass, Gem, Anchor, Feather, Plane,
} from 'lucide-react';
import { COLORS, ICONOS_PERSONALIZABLES_IDS, METRICAS_FAVORITAS_DISPONIBLES, MAX_METRICAS_FAVORITAS, MODOS_APP, DESCRIPCIONES_MODULOS } from '../tokens';
import { Card, Switch } from '../components/ui';

export const ICONOS_PERSONALIZABLES_MAP = { star: Star, zap: Zap, flame: Flame, sparkles: Sparkles, compass: Compass, gem: Gem, anchor: Anchor, feather: Feather };

function IconoPicker({ moduloId, iconoActual, onSetIcono, accent }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap py-2 pl-1">
      <button
        onClick={() => onSetIcono(moduloId, null)}
        className="text-xs px-2 py-1 rounded-lg font-medium"
        style={{ background: !iconoActual ? accent : COLORS.surface2, color: !iconoActual ? COLORS.textOnAccent : COLORS.textMuted }}
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
            <Icon size={14} style={{ color: activo ? COLORS.textOnAccent : COLORS.textMuted }} />
          </button>
        );
      })}
    </div>
  );
}

// Fase de Seguridad Centralizada — `protectedAreas` viene de `seguridad.protectedAreas` (App.jsx),
// ya no de `personalizacion.pinExtra`: este candado y la lista completa de "Protección mediante
// PIN" en Ajustes → Seguridad son la misma fuente de datos (apartado 8/9, un único sistema). El
// toggle sigue siendo `onTogglePinExtra`, mismo nombre de prop de siempre, pero ahora llama a
// `toggleAreaProtegida` — que pide el PIN actual si lo que se está haciendo es quitar protección.
function FilaModulo({ modulo, index, total, personalizacion, protectedAreas, onMove, onSetIcono, onTogglePinExtra, accent }) {
  const [pickerAbierto, setPickerAbierto] = useState(false);

  const oculto = personalizacion.ocultos.includes(modulo.id);
  const esRelacion = modulo.id === 'relacion';
  const protegidoExtra = esRelacion || protectedAreas.includes(modulo.id);
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

        {/* El activar/desactivar vive ahora en "Personalizar mi sistema" (arriba), con un
            interruptor de verdad. Tenerlo también aquí serían dos controles distintos para la
            misma configuración — justo lo que prohíbe el apartado 14 de la especificación. */}
        {oculto && (
          <span className="text-xs px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
            Desactivado
          </span>
        )}
      </div>

      {pickerAbierto && (
        <IconoPicker moduloId={modulo.id} iconoActual={personalizacion.iconos[modulo.id]} onSetIcono={(id, key) => { onSetIcono(id, key); }} accent={accent} />
      )}
    </div>
  );
}

// Entrega 2 · ME Fase 1 — "Personalizar mi sistema": el centro de módulos.
//
// QUÉ AÑADE SOBRE LO QUE YA HABÍA
// La lista de Personalización (Fase 19) ya permitía ocultar módulos, pero con un icono de ojo,
// en una lista plana y sin descripción. La especificación pide otra cosa: un centro donde cada
// módulo se presente con "icono; nombre; descripción; estado; interruptor ON/OFF", agrupado por
// áreas. Y, sobre todo, pide que desactivar reconstruya de verdad la interfaz.
//
// POR QUÉ AGRUPADO POR ÁREA
// La propia especificación lo enseña así (Salud → Sueño/Nutrición; Deporte → Calistenia/Fútbol).
// Además coincide con las cuatro áreas que ya existen en la barra inferior desde la Fase N1, así
// que no inventa una taxonomía nueva: reutiliza la que Josué ya conoce de navegar la app.
function CentroModulos({ areas, modulos, personalizacion, onToggleOculto, accent }) {
  const [confirmando, setConfirmando] = useState(null);
  const porId = Object.fromEntries(modulos.map((m) => [m.id, m]));
  const activos = modulos.filter((m) => !personalizacion.ocultos.includes(m.id)).length;

  const Fila = ({ modulo, ultimo }) => {
    const oculto = personalizacion.ocultos.includes(modulo.id);
    const IconoElegido = ICONOS_PERSONALIZABLES_MAP[personalizacion.iconos[modulo.id]];
    const Icono = IconoElegido || modulo.icon;
    const confirmandoEste = confirmando === modulo.id;

    return (
      <div className="py-2.5" style={{ borderBottom: ultimo ? 'none' : `1px solid ${COLORS.border}` }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }}>
            <Icono size={15} style={{ color: oculto ? COLORS.textMuted : accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: oculto ? COLORS.textMuted : COLORS.text }}>{modulo.label}</p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: COLORS.textMuted }}>
              {DESCRIPCIONES_MODULOS[modulo.id] || ''}
            </p>
          </div>
          <Switch
            checked={!oculto}
            onChange={() => (oculto ? onToggleOculto(modulo.id) : setConfirmando(modulo.id))}
            accent={accent}
            label={`${oculto ? 'Activar' : 'Desactivar'} ${modulo.label}`}
          />
        </div>

        {/* Confirmación al desactivar, nunca al volver a activar: activar es una acción segura y
            reversible. El texto insiste en que los datos se conservan porque es LA duda que tiene
            cualquiera al ver un interruptor de este tipo, y la especificación lo pide literalmente
            ("tus datos no se eliminarán"). */}
        {confirmandoEste && (
          <div className="mt-2 px-3 py-2.5 rounded-xl" style={{ background: COLORS.surface2 }}>
            <p className="text-xs leading-relaxed" style={{ color: COLORS.text }}>
              ¿Desactivar <span className="font-semibold">{modulo.label}</span>?
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>
              Dejará de aparecer en la app, pero <span className="font-semibold">no se borra nada</span>.
              Si lo vuelves a activar, seguirá todo como lo dejaste.
            </p>
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setConfirmando(null)} className="text-xs font-semibold px-2.5 py-1.5" style={{ color: COLORS.textMuted }}>Cancelar</button>
              <button
                onClick={() => { onToggleOculto(modulo.id); setConfirmando(null); }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ background: accent, color: COLORS.textOnAccent }}
              >
                Desactivar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
        <LayoutGrid size={16} style={{ color: accent }} /> Personalizar mi sistema
      </p>
      <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>
        Elige qué apartados quieres usar. Los que desactives desaparecen de la app, pero sus datos se conservan.
      </p>
      <p className="text-xs mb-4" style={{ color: COLORS.textMuted, opacity: 0.75 }}>
        {activos} de {modulos.length} activados
      </p>

      {areas.map((area) => {
        // Solo los módulos de esta área que además son personalizables (Ajustes queda fuera
        // siempre — sin él Josué no tendría forma de volver a activar lo que desactivó).
        const delArea = area.modulos.map((id) => porId[id]).filter(Boolean);
        if (delArea.length === 0) return null;
        return (
          <div key={area.id} className="mb-4 last:mb-0">
            <p className="text-xs font-semibold uppercase mb-1" style={{ color: COLORS.textMuted, letterSpacing: '0.08em' }}>
              {area.label}
            </p>
            {delArea.map((m, i) => (
              <Fila key={m.id} modulo={m} ultimo={i === delArea.length - 1} />
            ))}
          </div>
        );
      })}
    </Card>
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
              style={{ background: activo ? accent : COLORS.surface2, color: activo ? COLORS.textOnAccent : COLORS.textMuted, border: `1px solid ${activo ? accent : COLORS.border}` }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default function PersonalizationView({ areas, modulos, personalizacion, protectedAreas, onMove, onToggleOculto, onSetIcono, onTogglePinExtra, onToggleFavorita, onMoveFavorita, modo, onSetModo, accent }) {
  return (
    <div className="space-y-4">
      <ModoAppSection modo={modo} onSetModo={onSetModo} accent={accent} />

      {/* Entrega 2 · ME Fase 1 — el centro de módulos va primero: decidir QUÉ usas es previo a
          decidir cómo ordenarlo. */}
      <CentroModulos areas={areas} modulos={modulos} personalizacion={personalizacion} onToggleOculto={onToggleOculto} accent={accent} />
      <Card>
        <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
          <Palette size={16} style={{ color: accent }} /> Personalización avanzada
        </p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
          Reordena, cambia el icono o protege con PIN cualquier apartado activo. Para activar o desactivar apartados, usa "Personalizar mi sistema" de arriba.
        </p>
        <div>
          {modulos.map((m, i) => (
            <FilaModulo
              key={m.id}
              modulo={m}
              index={i}
              total={modulos.length}
              personalizacion={personalizacion}
              protectedAreas={protectedAreas}
              onMove={onMove}
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
