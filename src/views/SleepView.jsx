import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { COLORS } from '../tokens';
import { uid, calcularDuracion, formatHoras, formatFecha, todayISO } from '../lib/helpers';
import { Card, ListCard, ListRow, BotonBorrar, SectionTitle, Field, TextInput, PrimaryButton, EmptyHint, AIPanel } from '../components/ui';

export default function SleepView({ sueno, onAdd, onDelete, accent, foco, onFocoConsumido }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ horaDormir: '23:00', horaDespertar: '07:00', calidad: 3, interrupciones: 0, siesta: 0 });

  // Ampliación del Dashboard — Centro de Control: la acción rápida "+ Sueño" llega aquí como
  // `foco.accion === 'registrar'` — abre el mismo formulario de siempre, sin inventar uno nuevo.
  useEffect(() => {
    if (foco?.accion === 'registrar') {
      setShowForm(true);
      onFocoConsumido && onFocoConsumido();
    }
  }, [foco]);

  const ultimos = sueno.slice(-7);
  const chartData = ultimos.map((e) => ({ fecha: formatFecha(e.fecha), horas: calcularDuracion(e.horaDormir, e.horaDespertar) }));
  // Solo promediamos los registros con horas válidas: uno incompleto convertiría la media
  // entera en NaN. En la gráfica sí se dejan como `null`, que recharts dibuja como hueco.
  const horasValidas = ultimos
    .map((e) => calcularDuracion(e.horaDormir, e.horaDespertar))
    .filter((h) => h !== null);
  const media = horasValidas.length
    ? (horasValidas.reduce((a, h) => a + h, 0) / horasValidas.length).toFixed(1)
    : '—';

  const handleSubmit = () => {
    onAdd({ id: uid(), fecha: todayISO(), ...form });
    setShowForm(false);
    setForm({ horaDormir: '23:00', horaDespertar: '07:00', calidad: 3, interrupciones: 0, siesta: 0 });
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle sub={ultimos.length ? `Media últimos ${ultimos.length}: ${media} h` : 'Todavía sin registros'}>Sueño</SectionTitle>
        <div style={{ width: 130 }}>
          <PrimaryButton accent={accent} onClick={() => setShowForm((s) => !s)}>Registrar</PrimaryButton>
        </div>
      </div>

      {showForm && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hora de dormir">
              <TextInput type="time" value={form.horaDormir} onChange={(e) => setForm({ ...form, horaDormir: e.target.value })} />
            </Field>
            <Field label="Hora de despertar">
              <TextInput type="time" value={form.horaDespertar} onChange={(e) => setForm({ ...form, horaDespertar: e.target.value })} />
            </Field>
            <Field label="Calidad (1-5)">
              <TextInput type="number" min="1" max="5" value={form.calidad} onChange={(e) => setForm({ ...form, calidad: Number(e.target.value) })} />
            </Field>
            <Field label="Interrupciones">
              <TextInput type="number" min="0" value={form.interrupciones} onChange={(e) => setForm({ ...form, interrupciones: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Siesta (minutos, si hiciste)">
            <TextInput type="number" min="0" value={form.siesta} onChange={(e) => setForm({ ...form, siesta: Number(e.target.value) })} />
          </Field>
          <PrimaryButton accent={accent} onClick={handleSubmit}>Guardar registro</PrimaryButton>
        </Card>
      )}

      {chartData.length > 1 && (
        <Card>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="fecha" stroke={COLORS.textMuted} fontSize={11} />
              <YAxis stroke={COLORS.textMuted} fontSize={11} width={26} />
              <Tooltip contentStyle={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
              <Line type="monotone" dataKey="horas" stroke={accent} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {sueno.length === 0
        ? <EmptyHint text="Todavía no has registrado ninguna noche." />
        : (
          <ListCard>
            {[...sueno].reverse().slice(0, 6).map((e, i, arr) => (
              <ListRow key={e.id} last={i === arr.length - 1}>
                <p className="text-sm font-semibold min-w-0 truncate" style={{ color: COLORS.text }}>{formatFecha(e.fecha)} · {formatHoras(calcularDuracion(e.horaDormir, e.horaDespertar))} h</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{e.horaDormir}–{e.horaDespertar} · {e.calidad}/5</p>
                  <BotonBorrar onClick={() => onDelete(e.id)} label="Eliminar registro de sueño" />
                </div>
              </ListRow>
            ))}
          </ListCard>
        )}

      <AIPanel
        label="Analizar mi sueño"
        accent={accent}
        buildPrompt={() => `Últimos registros de sueño de Josué (JSON): ${JSON.stringify(ultimos)}. Si hay suficientes datos, detecta un patrón simple; si no, dilo abiertamente. Da una recomendación breve.`}
      />
    </div>
  );
}
