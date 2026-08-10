import React, { useState, useRef } from 'react';
import { Plus, Trash2, Download, Upload, RotateCcw } from 'lucide-react';
import { COLORS, PALETAS_PREDEFINIDAS, MAX_TEMAS_GUARDADOS } from '../tokens';
import { shade, hexToRgba } from '../lib/helpers';
import { Card, GhostBtn } from './ui';

// Fase 4 del Sistema de Personalización Visual Extrema — Presets + gestión de temas.
//
// Cierra el sistema de personalización visual con dos piezas que faltaban: (1) una galería de
// temas completos "de un toque" (las paletas predefinidas de la Fase A7, ahora también con
// overrides de `temaPersonalizado` reales para las tres nuevas — Monocromático/Neón/Pastel —, más
// el azul metálico original marcado como preset oficial), y (2) gestión completa de temas propios
// guardados por Josué: crear desde el estado actual, renombrar, duplicar, eliminar, exportar/
// importar como JSON, y restaurar el oficial en un toque.
//
// "Modo avanzado" (`apariencia.modoColorAvanzado`) separa lo sencillo de lo potente: en modo
// sencillo solo se ve la galería de presets (tocar y ya, cero conceptos nuevos que aprender); en
// modo avanzado aparece además la gestión de temas propios. `SettingsView.jsx` usa este mismo
// interruptor para decidir si muestra también la tarjeta "Constructor de temas" (Fase 3) — un
// componente de 10 campos no debería verse por accidente la primera vez que alguien abre Apariencia.
//
// Aplicar un preset o un tema guardado es SIEMPRE una operación atómica de tema+accent+
// temaPersonalizado a la vez, vía `onAplicarConjuntoTema` (ver App.jsx, `aplicarConjuntoTema`) —
// este componente nunca llama a `onUpdateAccent`/`onUpdateApariencia` por separado para esto,
// evita justo la condición de carrera de closures que documenta esa función en App.jsx.

function SwatchPreset({ label, accentHex, activo, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 68 }}>
      <span
        className="w-12 h-12 rounded-2xl block"
        style={{
          background: `linear-gradient(135deg, ${shade(accentHex, 45)}, ${accentHex} 55%, ${shade(accentHex, -35)})`,
          boxShadow: activo ? `0 0 0 2px ${COLORS.bg}, 0 0 0 4px ${accentHex}` : `0 0 0 1px ${COLORS.border}`,
        }}
      />
      <span className="text-[11px] font-medium text-center leading-tight" style={{ color: COLORS.textMuted }}>{label}</span>
    </button>
  );
}

export default function GestionTemas({
  accent, apariencia, onUpdateApariencia,
  temasGuardados, onAplicarConjuntoTema, onRestablecerTemaOficial,
  onGuardarTemaComoNuevo, onRenombrarTemaGuardado, onDuplicarTemaGuardado,
  onEliminarTemaGuardado, onImportarTemaGuardado,
}) {
  const modoAvanzado = apariencia.modoColorAvanzado;
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [creando, setCreando] = useState(false);
  const [avisoLimite, setAvisoLimite] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState(null);
  const [errorImport, setErrorImport] = useState('');
  const fileInputRef = useRef(null);

  // Comprobación deliberadamente sencilla (accent + tema): mismo criterio que ya usaba la
  // galería de 12 acentos de la Card de arriba, que tampoco compara los overrides finos. Sirve
  // para resaltar visualmente "esto es lo que tienes activo ahora mismo", no para una igualdad
  // estricta.
  const esActivo = (p) => accent === p.accent && apariencia.tema === p.tema;

  const guardarComoNuevo = () => {
    const ok = onGuardarTemaComoNuevo(nombreNuevo);
    if (!ok) {
      setAvisoLimite(`Límite de ${MAX_TEMAS_GUARDADOS} temas guardados alcanzado. Elimina alguno para guardar uno nuevo.`);
      return;
    }
    setNombreNuevo('');
    setCreando(false);
    setAvisoLimite('');
  };

  const duplicar = (id) => {
    const ok = onDuplicarTemaGuardado(id);
    if (!ok) setAvisoLimite(`Límite de ${MAX_TEMAS_GUARDADOS} temas guardados alcanzado. Elimina alguno para duplicar.`);
  };

  const exportarTema = (t) => {
    const paquete = { nombre: t.nombre, tema: t.tema, accent: t.accent, temaPersonalizado: t.temaPersonalizado };
    const blob = new Blob([JSON.stringify(paquete, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tema-${(t.nombre || 'sin-nombre').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorImport('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const temaValido = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          && (parsed.tema === 'oscuro' || parsed.tema === 'claro')
          && typeof parsed.accent === 'string' && /^#[0-9A-Fa-f]{6}$/.test(parsed.accent);
        if (!temaValido) throw new Error('formato');
        const ok = onImportarTemaGuardado({
          nombre: typeof parsed.nombre === 'string' && parsed.nombre.trim() ? parsed.nombre.trim() : 'Importado',
          tema: parsed.tema,
          accent: parsed.accent,
          temaPersonalizado: parsed.temaPersonalizado && typeof parsed.temaPersonalizado === 'object' ? parsed.temaPersonalizado : null,
        });
        if (!ok) setAvisoLimite(`Límite de ${MAX_TEMAS_GUARDADOS} temas guardados alcanzado. Elimina alguno para importar.`);
      } catch {
        setErrorImport('Ese archivo no es un tema válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Modo avanzado de color</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              Activa esto para guardar, renombrar, duplicar, exportar/importar tus propios temas, y para abrir el
              Constructor de temas completo. Desactivado, solo ves esta galería.
            </p>
          </div>
          <button
            onClick={() => onUpdateApariencia({ ...apariencia, modoColorAvanzado: !modoAvanzado })}
            className="w-12 h-7 rounded-full flex-shrink-0 relative transition-colors"
            style={{ background: modoAvanzado ? accent : COLORS.surface2, border: `1px solid ${COLORS.border}` }}
            aria-label="Alternar modo avanzado de color"
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{ left: modoAvanzado ? 22 : 2, background: COLORS.text }}
            />
          </button>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Temas predefinidos</p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
          Cada uno aplica de golpe un tema completo (claro/oscuro, acento y el resto de la paleta). "Clásico" es el
          azul metálico original de la app.
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {PALETAS_PREDEFINIDAS.map((p) => (
            <SwatchPreset
              key={p.id}
              label={p.label}
              accentHex={p.accent}
              activo={esActivo(p)}
              onClick={() => onAplicarConjuntoTema(p)}
            />
          ))}
        </div>
      </Card>

      {modoAvanzado && (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Tus temas guardados</p>
            {!creando && (
              <button
                onClick={() => setCreando(true)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ color: accent, background: hexToRgba(accent, 0.13) }}
              >
                <Plus size={13} /> Guardar actual
              </button>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
            Guarda la combinación de tema, acento y personalización que tienes activa ahora mismo con un nombre, para
            volver a ella cuando quieras.
          </p>

          {creando && (
            <div className="flex items-center gap-2 mb-3">
              <input
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && guardarComoNuevo()}
                placeholder="Nombre del tema"
                autoFocus
                className="flex-1 min-w-0 text-sm rounded-lg px-3 py-2"
                style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
              />
              <button onClick={guardarComoNuevo} className="text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0" style={{ color: accent, background: hexToRgba(accent, 0.13) }}>Guardar</button>
              <button onClick={() => { setCreando(false); setNombreNuevo(''); }} className="text-xs font-semibold px-2 flex-shrink-0" style={{ color: COLORS.textMuted }}>Cancelar</button>
            </div>
          )}

          {avisoLimite && <p className="text-xs mb-3" style={{ color: COLORS.warning }}>{avisoLimite}</p>}

          {temasGuardados.length === 0 ? (
            <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Todavía no has guardado ningún tema propio.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {temasGuardados.map((t) => (
                <div key={t.id} className="rounded-xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onAplicarConjuntoTema(t)}
                      className="w-9 h-9 rounded-full flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${shade(t.accent, 45)}, ${t.accent} 55%, ${shade(t.accent, -35)})`,
                        boxShadow: esActivo(t) ? `0 0 0 2px ${COLORS.surface2}, 0 0 0 4px ${t.accent}` : `0 0 0 1px ${COLORS.border}`,
                      }}
                      aria-label={`Aplicar ${t.nombre}`}
                    />
                    <div className="flex-1 min-w-0">
                      {editandoId === t.id ? (
                        <input
                          value={nombreEdit}
                          onChange={(e) => setNombreEdit(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { onRenombrarTemaGuardado(t.id, nombreEdit); setEditandoId(null); } }}
                          onBlur={() => { onRenombrarTemaGuardado(t.id, nombreEdit); setEditandoId(null); }}
                          autoFocus
                          className="w-full text-sm font-semibold rounded-lg px-2 py-1"
                          style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
                        />
                      ) : (
                        <button
                          onClick={() => { setEditandoId(t.id); setNombreEdit(t.nombre); }}
                          className="text-sm font-semibold text-left truncate block w-full"
                          style={{ color: COLORS.text }}
                        >
                          {t.nombre}
                        </button>
                      )}
                      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{t.tema === 'claro' ? 'Claro' : 'Oscuro'}</p>
                    </div>
                    <button onClick={() => duplicar(t.id)} className="text-[11px] font-semibold px-2 py-1.5 rounded-lg flex-shrink-0" style={{ color: COLORS.textMuted, background: COLORS.surface }}>Duplicar</button>
                    <button onClick={() => exportarTema(t)} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: COLORS.surface }} aria-label={`Exportar ${t.nombre}`}>
                      <Download size={13} style={{ color: COLORS.textMuted }} />
                    </button>
                    <button onClick={() => setConfirmandoEliminarId(confirmandoEliminarId === t.id ? null : t.id)} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: COLORS.surface }} aria-label={`Eliminar ${t.nombre}`}>
                      <Trash2 size={13} style={{ color: COLORS.negative }} />
                    </button>
                  </div>
                  {confirmandoEliminarId === t.id && (
                    <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>¿Eliminar "{t.nombre}"?</p>
                      <div className="flex gap-3">
                        <button onClick={() => setConfirmandoEliminarId(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                        <button onClick={() => { onEliminarTemaGuardado(t.id); setConfirmandoEliminarId(null); }} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Eliminar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-2">
            <GhostBtn onClick={() => fileInputRef.current?.click()} icon={Upload}>Importar tema</GhostBtn>
            <GhostBtn onClick={onRestablecerTemaOficial} icon={RotateCcw}>Restablecer oficial</GhostBtn>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportar} className="hidden" />
          {errorImport && <p className="text-xs" style={{ color: COLORS.negative }}>{errorImport}</p>}
        </Card>
      )}
    </>
  );
}
