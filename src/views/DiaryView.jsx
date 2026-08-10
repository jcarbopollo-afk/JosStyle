import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS, ESTADOS_ANIMO } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { Card, SectionTitle, Field, Textarea, PrimaryButton, EmptyHint, AIPanel } from '../components/ui';

const FORM_VACIO = { animo: 3, comoMeSiento: '', queHeAprendido: '', queMejorareManana: '' };

function AnimoPicker({ value, onChange }) {
  return (
    <div className="flex justify-between gap-1">
      {ESTADOS_ANIMO.map((e) => (
        <button
          key={e.valor}
          onClick={() => onChange(e.valor)}
          className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2"
          style={{ background: value === e.valor ? COLORS.surface2 : 'transparent', border: `1px solid ${value === e.valor ? COLORS.border : 'transparent'}` }}
          aria-label={e.label}
        >
          <span style={{ fontSize: 22, opacity: value === e.valor ? 1 : 0.45 }}>{e.emoji}</span>
          <span className="text-[10px] font-medium" style={{ color: value === e.valor ? COLORS.text : COLORS.textMuted }}>{e.label}</span>
        </button>
      ))}
    </div>
  );
}

function EntradaCard({ entrada, accent, onDelete }) {
  const [abierta, setAbierta] = useState(false);
  const estado = ESTADOS_ANIMO.find((e) => e.valor === entrada.animo) || ESTADOS_ANIMO[2];
  return (
    <Card style={{ padding: '1rem' }}>
      <button onClick={() => setAbierta(!abierta)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 20 }}>{estado.emoji}</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{formatFecha(entrada.fecha)}</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{entrada.comoMeSiento ? entrada.comoMeSiento.slice(0, 40) + (entrada.comoMeSiento.length > 40 ? '…' : '') : estado.label}</p>
          </div>
        </div>
        {abierta ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
      </button>
      {abierta && (
        <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {entrada.comoMeSiento && (
            <div>
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: COLORS.textMuted }}>CÓMO ME HE SENTIDO</p>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{entrada.comoMeSiento}</p>
            </div>
          )}
          {entrada.queHeAprendido && (
            <div>
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: COLORS.textMuted }}>QUÉ HE APRENDIDO</p>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{entrada.queHeAprendido}</p>
            </div>
          )}
          {entrada.queMejorareManana && (
            <div>
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: COLORS.textMuted }}>QUÉ MEJORARÉ MAÑANA</p>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{entrada.queMejorareManana}</p>
            </div>
          )}
          <button onClick={() => onDelete(entrada.id)} className="flex items-center gap-1.5 text-xs font-medium pt-1" style={{ color: COLORS.textMuted }}>
            <Trash2 size={13} /> Eliminar entrada
          </button>
        </div>
      )}
    </Card>
  );
}

export default function DiaryView({ diario, onAdd, onUpdate, onDelete, accent }) {
  const hoy = todayISO();
  const entradaHoy = diario.entradas.find((e) => e.fecha === hoy);
  const [form, setForm] = useState(entradaHoy || FORM_VACIO);

  // Si ya existe una entrada de hoy (p.ej. al reabrir la app), precargarla para poder
  // completarla o corregirla en vez de crear una segunda entrada para el mismo día.
  useEffect(() => {
    setForm(entradaHoy || FORM_VACIO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradaHoy?.id]);

  const haytexto = form.comoMeSiento.trim() || form.queHeAprendido.trim() || form.queMejorareManana.trim();

  const guardar = () => {
    if (!haytexto) return;
    if (entradaHoy) {
      onUpdate({ ...entradaHoy, ...form });
    } else {
      onAdd({ id: uid(), fecha: hoy, ...form });
    }
  };

  const anteriores = diario.entradas.filter((e) => e.fecha !== hoy).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Una entrada breve al día — cómo te sientes, qué aprendes, qué mejorarás">Diario</SectionTitle>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>{formatFecha(hoy)} · hoy</p>
        <Field label="¿Cómo te sientes hoy?">
          <AnimoPicker value={form.animo} onChange={(v) => setForm({ ...form, animo: v })} />
        </Field>
        <Field label="Cómo me he sentido">
          <Textarea
            value={form.comoMeSiento}
            onChange={(e) => setForm({ ...form, comoMeSiento: e.target.value })}
            placeholder="Cuenta qué ha marcado tu día…"
          />
        </Field>
        <Field label="Qué he aprendido">
          <Textarea
            rows={2}
            value={form.queHeAprendido}
            onChange={(e) => setForm({ ...form, queHeAprendido: e.target.value })}
            placeholder="Algo nuevo, una idea, un error del que aprender…"
          />
        </Field>
        <Field label="Qué mejoraré mañana">
          <Textarea
            rows={2}
            value={form.queMejorareManana}
            onChange={(e) => setForm({ ...form, queMejorareManana: e.target.value })}
            placeholder="Un propósito pequeño y concreto para mañana"
          />
        </Field>
        <PrimaryButton accent={accent} disabled={!haytexto} onClick={guardar}>
          {entradaHoy ? 'Actualizar entrada de hoy' : 'Guardar entrada de hoy'}
        </PrimaryButton>
      </Card>

      <AIPanel
        label="Detectar patrones emocionales"
        accent={accent}
        buildPrompt={() =>
          `Últimas entradas del diario de Josué, de más reciente a más antigua (JSON, máximo 20): ${JSON.stringify(
            [...(entradaHoy ? [{ fecha: hoy, ...form }] : []), ...anteriores]
              .slice(0, 20)
              .map((e) => ({ fecha: e.fecha, animo: e.animo, comoMeSiento: e.comoMeSiento, queHeAprendido: e.queHeAprendido }))
          )}. Detecta patrones emocionales si los hay (días o situaciones que se repiten, tendencia del ánimo) basándote solo en estos datos concretos; si hay muy pocas entradas para ver un patrón real, dilo abiertamente en vez de forzar una conclusión.`
        }
      />

      {anteriores.length === 0 ? (
        <EmptyHint text="Todavía no hay entradas anteriores. Escribe la de hoy para empezar." />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.textMuted }}>ENTRADAS ANTERIORES</p>
          {anteriores.map((e) => (
            <EntradaCard key={e.id} entrada={e} accent={accent} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
