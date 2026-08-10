import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Circle, CalendarClock, Sparkles, Loader2 } from 'lucide-react';
import { COLORS, PLAZOS_OBJETIVO, DIAS_ENTRE_REVISIONES } from '../tokens';
import { uid, todayISO } from '../lib/helpers';
import { askAI, AI_SYSTEM } from '../lib/ai';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, EmptyHint, AIPanel } from '../components/ui';

function diasDesde(iso) {
  if (!iso) return Infinity;
  const ms = new Date(todayISO() + 'T00:00:00') - new Date(iso + 'T00:00:00');
  return Math.floor(ms / 86400000);
}

function RevisionBanner({ ultimaRevision, objetivos, accent, onRevisionHecha }) {
  const [abierta, setAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const dias = diasDesde(ultimaRevision);
  const toca = dias >= DIAS_ENTRE_REVISIONES;

  if (!toca && !abierta) return null;

  const pedirRevision = async () => {
    setAbierta(true);
    setCargando(true);
    setError('');
    try {
      const respuesta = await askAI(
        AI_SYSTEM,
        `Objetivos actuales de Josué, 16 años (JSON): ${JSON.stringify(objetivos.map((o) => ({ texto: o.texto, plazo: o.plazo, cumplido: o.cumplido })))}. ` +
          `Haz una revisión breve: valora en 2-3 frases si parece ir por buen camino según lo que tiene registrado, y sugiere como máximo un objetivo nuevo razonable si ves un hueco claro (ej. sin nada a 5-10 años). ` +
          `No decidas ni asumas que va a cumplir nada — es una reflexión, no una orden. Con 16 años es normal y sano que estos objetivos cambien con el tiempo.`
      );
      setTexto(respuesta || 'No he podido generar la revisión.');
      onRevisionHecha();
    } catch (e) {
      setError('No he podido generar la revisión ahora mismo. Inténtalo de nuevo en un momento.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card style={{ background: `${COLORS.surface}`, border: `1px solid ${accent}55` }}>
      <div className="flex items-start gap-3">
        <CalendarClock size={18} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1">
          {!abierta ? (
            <>
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
                {ultimaRevision ? `Hace ${dias} días que no revisas tus objetivos a largo plazo` : 'Todavía no has hecho una revisión de objetivos'}
              </p>
              <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>Es normal que cambien con el tiempo — merece la pena echarles un vistazo de vez en cuando.</p>
              <button onClick={pedirRevision} className="flex items-center gap-2 text-sm font-semibold" style={{ color: accent }}>
                <Sparkles size={15} /> Hacer revisión ahora
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: COLORS.text }}>
                {cargando && <Loader2 size={14} className="animate-spin" />} Revisión
              </p>
              {error && <p className="text-xs" style={{ color: COLORS.textMuted }}>{error}</p>}
              {texto && <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{texto}</p>}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ObjectivesView({ objetivos, onAdd, onUpdate, onDelete, onRevisionHecha, accent, foco, onFocoConsumido }) {
  const [texto, setTexto] = useState('');
  const [plazo, setPlazo] = useState(PLAZOS_OBJETIVO[0]);
  // Ampliación del Dashboard — Centro de Control: `destacadoId` resalta brevemente (apartado 4/6:
  // "Dashboard → Objetivo específico") el objetivo al que se ha llegado por deep-link, para que
  // Josué vea de un vistazo cuál es sin tener que leer toda la lista.
  const [destacadoId, setDestacadoId] = useState(null);

  useEffect(() => {
    if (!foco) return;
    if (foco.accion === 'nuevo') {
      document.getElementById('nuevo-objetivo-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('nuevo-objetivo-input')?.querySelector('input')?.focus();
      onFocoConsumido && onFocoConsumido();
    } else if (foco.id) {
      const el = document.getElementById(`objetivo-${foco.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setDestacadoId(foco.id);
      onFocoConsumido && onFocoConsumido();
      const t = setTimeout(() => setDestacadoId(null), 2200);
      return () => clearTimeout(t);
    }
  }, [foco]);

  const submit = () => {
    if (!texto.trim()) return;
    onAdd({ id: uid(), texto: texto.trim(), plazo, cumplido: false, fechaCreacion: todayISO() });
    setTexto('');
  };

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="De 30 días a 10 años — fijos hasta que tú decidas cambiarlos">Objetivos</SectionTitle>

      <RevisionBanner ultimaRevision={objetivos.ultimaRevision} objetivos={objetivos.lista} accent={accent} onRevisionHecha={onRevisionHecha} />

      <Card id="nuevo-objetivo-input">
        <Field label="Objetivo">
          <TextInput value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. sacar Bachillerato con buena nota" />
        </Field>
        <Field label="Plazo">
          <Select value={plazo} onChange={(e) => setPlazo(e.target.value)}>
            {PLAZOS_OBJETIVO.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <PrimaryButton accent={accent} icon={Plus} onClick={submit}>Añadir objetivo</PrimaryButton>
      </Card>

      {objetivos.lista.length === 0 && <EmptyHint text="Todavía no tienes objetivos. Empieza por uno a 30 o 90 días." />}

      {PLAZOS_OBJETIVO.map((p) => {
        const delPlazo = objetivos.lista.filter((o) => o.plazo === p);
        if (delPlazo.length === 0) return null;
        return (
          <div key={p} className="space-y-2">
            <p className="text-xs font-semibold px-1" style={{ color: COLORS.textMuted }}>{p.toUpperCase()}</p>
            {delPlazo.map((o) => (
              <Card
                key={o.id} id={`objetivo-${o.id}`} className="flex items-center justify-between"
                style={{ padding: '1rem', transition: 'box-shadow 0.3s ease', boxShadow: destacadoId === o.id ? `0 0 0 2px ${accent}` : 'none' }}
              >
                <button onClick={() => onUpdate({ ...o, cumplido: !o.cumplido })} className="flex items-center gap-3 flex-1 text-left">
                  {o.cumplido ? <CheckCircle2 size={19} style={{ color: accent }} /> : <Circle size={19} style={{ color: COLORS.textMuted }} />}
                  <p className="text-sm" style={{ color: o.cumplido ? COLORS.textMuted : COLORS.text, textDecoration: o.cumplido ? 'line-through' : 'none' }}>
                    {o.texto}
                  </p>
                </button>
                <button onClick={() => onDelete(o.id)} aria-label="Eliminar objetivo"><Trash2 size={15} style={{ color: COLORS.textMuted }} /></button>
              </Card>
            ))}
          </div>
        );
      })}

      <AIPanel
        label="¿Voy por buen camino?"
        accent={accent}
        buildPrompt={() =>
          `Objetivos de Josué (JSON): ${JSON.stringify(objetivos.lista.map((o) => ({ texto: o.texto, plazo: o.plazo, cumplido: o.cumplido })))}. ` +
          `Valora brevemente si parece ir avanzando según lo que tiene marcado como cumplido, sin inventar datos que no tengas.`
        }
      />
    </div>
  );
}
