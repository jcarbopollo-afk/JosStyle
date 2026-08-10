import React, { useState } from 'react';
import { Trophy, Map, CheckCircle2, Circle, Award } from 'lucide-react';
import { COLORS, PLAZOS_OBJETIVO } from '../tokens';
import { hexToRgba, formatFecha } from '../lib/helpers';
import { calcularLogros } from '../lib/logros';
import { Card, SectionTitle, ToggleTab, EmptyHint } from '../components/ui';

// Fase 20 — Logros: igual que Estadísticas/Predicciones, sin datos propios ni exportación —
// insignias binarias calculadas al vuelo, sin puntos/niveles/monedas (mismo criterio "no
// sobregamificar" ya aplicado a Bienestar digital en la Fase 15).
function LogrosTab({ logros, accent }) {
  const conseguidos = logros.filter((l) => l.conseguido);
  const pendientes = logros.filter((l) => !l.conseguido);
  return (
    <div className="space-y-4">
      <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
        {conseguidos.length} de {logros.length} insignias conseguidas — se calculan solas a partir de lo que ya registras, nada que configurar.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[...conseguidos, ...pendientes].map((l) => (
          <Card
            key={l.id}
            style={{
              opacity: l.conseguido ? 1 : 0.55,
              border: `1px solid ${l.conseguido ? hexToRgba(accent, 0.4) : COLORS.border}`,
              padding: '1rem',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {l.conseguido
                ? <Trophy size={16} style={{ color: accent }} />
                : <Award size={16} style={{ color: COLORS.textMuted }} />}
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{l.titulo}</p>
            </div>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{l.desc}</p>
            {!l.conseguido && l.meta > 1 && (
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.surface2 }}>
                <div className="h-full rounded-full" style={{ width: `${(l.progreso / l.meta) * 100}%`, background: accent }} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Fase 20 — Mapa de vida: visualización cronológica de los Objetivos ya existentes (30 días a
// 10 años), sin datos propios — reutiliza objetivos.lista tal cual, solo cambia cómo se muestra
// (línea de tiempo en vez de la lista agrupada de ObjectivesView). No duplica ni guarda nada.
function MapaVidaTab({ objetivos, accent }) {
  const lista = objetivos?.lista || [];
  if (lista.length === 0) {
    return <EmptyHint text="Todavía no tienes objetivos. Añádelos en la pestaña Objetivos y aparecerán aquí como un mapa de tu vida." />;
  }
  return (
    <div className="space-y-4">
      <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
        Tus objetivos, de más cercano a más lejano — el mismo mapa que ya tienes en Objetivos, visto como línea de tiempo.
      </p>
      {PLAZOS_OBJETIVO.map((plazo, idxPlazo) => {
        const delPlazo = lista.filter((o) => o.plazo === plazo);
        if (delPlazo.length === 0) return null;
        return (
          <div key={plazo} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: accent }} />
              {idxPlazo < PLAZOS_OBJETIVO.length - 1 && <div className="flex-1 w-px mt-1" style={{ background: COLORS.border, minHeight: 12 }} />}
            </div>
            <div className="flex-1 pb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: accent }}>{plazo.toUpperCase()}</p>
              <div className="space-y-2">
                {delPlazo.map((o) => (
                  <Card key={o.id} style={{ padding: '0.75rem 1rem' }} className="flex items-center gap-2">
                    {o.cumplido ? <CheckCircle2 size={15} style={{ color: accent, flexShrink: 0 }} /> : <Circle size={15} style={{ color: COLORS.textMuted, flexShrink: 0 }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: o.cumplido ? COLORS.textMuted : COLORS.text, textDecoration: o.cumplido ? 'line-through' : 'none' }}>
                        {o.texto}
                      </p>
                      {o.fechaCreacion && <p className="text-xs" style={{ color: COLORS.textMuted }}>desde {formatFecha(o.fechaCreacion)}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AchievementsView({ productividad, diario, objetivos, bienestar, fe, nutricion, salud, calistenia, economia, sueno, accent }) {
  const [tab, setTab] = useState('logros');
  const logros = calcularLogros({ productividad, diario, objetivos, bienestar, fe, nutricion, salud, calistenia, economia, sueno });

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Un vistazo a lo que ya has conseguido y hacia dónde vas — nada de esto cambia tus datos">
        <span className="flex items-center gap-2"><Trophy size={18} style={{ color: accent }} /> Logros</span>
      </SectionTitle>

      <div className="flex gap-2">
        <ToggleTab active={tab === 'logros'} onClick={() => setTab('logros')} accent={accent}>
          <span className="flex items-center justify-center gap-1.5"><Trophy size={14} /> Logros</span>
        </ToggleTab>
        <ToggleTab active={tab === 'mapa'} onClick={() => setTab('mapa')} accent={accent}>
          <span className="flex items-center justify-center gap-1.5"><Map size={14} /> Mapa de vida</span>
        </ToggleTab>
      </div>

      {tab === 'logros' ? <LogrosTab logros={logros} accent={accent} /> : <MapaVidaTab objetivos={objetivos} accent={accent} />}
    </div>
  );
}
