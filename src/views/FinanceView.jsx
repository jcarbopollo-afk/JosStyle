import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { COLORS } from '../tokens';
import { uid, formatFecha, todayISO } from '../lib/helpers';
import { Card, ListCard, ListRow, SectionTitle, Field, TextInput, Select, PrimaryButton, EmptyHint, AIPanel } from '../components/ui';

export default function FinanceView({ economia, onAddMovimiento, onUpdateHucha, accent, foco, onFocoConsumido }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'gasto', concepto: '', cantidad: '' });

  // Ampliación del Dashboard — Centro de Control: la acción rápida "+ Gasto" llega aquí como
  // `foco.accion === 'nuevoMovimiento'` — abre el mismo formulario de siempre.
  useEffect(() => {
    if (foco?.accion === 'nuevoMovimiento') {
      setShowForm(true);
      onFocoConsumido && onFocoConsumido();
    }
  }, [foco]);

  const saldo = economia.saldoInicial + economia.movimientos.reduce((a, m) => a + (m.tipo === 'ingreso' ? m.cantidad : -m.cantidad), 0);
  const esteMes = economia.movimientos.filter((m) => m.fecha.slice(0, 7) === todayISO().slice(0, 7));
  const ingresosMes = esteMes.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.cantidad, 0);
  const gastosMes = esteMes.filter((m) => m.tipo === 'gasto').reduce((a, m) => a + m.cantidad, 0);

  const handleSubmit = () => {
    if (!form.concepto || !form.cantidad) return;
    onAddMovimiento({ id: uid(), fecha: todayISO(), tipo: form.tipo, concepto: form.concepto, cantidad: Number(form.cantidad) });
    setForm({ tipo: 'gasto', concepto: '', cantidad: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>Economía</SectionTitle>
        <div style={{ width: 140 }}>
          <PrimaryButton accent={accent} onClick={() => setShowForm((s) => !s)}>Movimiento</PrimaryButton>
        </div>
      </div>

      {/* Optimización de navegación/scroll — "Hucha" pasa de tarjeta propia a una fila dentro de
          la misma Card de "Cuenta principal": mismo contenido, una tarjeta menos apilada. */}
      <Card>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Cuenta principal</p>
        <p className="text-3xl font-extrabold mt-1" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{saldo.toFixed(2)} €</p>
        <div className="flex gap-4 mt-3 text-xs">
          <span style={{ color: COLORS.positive }} className="flex items-center gap-1"><TrendingUp size={13} /> +{ingresosMes.toFixed(2)} € este mes</span>
          <span style={{ color: COLORS.negative }} className="flex items-center gap-1"><TrendingDown size={13} /> -{gastosMes.toFixed(2)} € este mes</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Hucha</p>
          <TextInput type="number" value={economia.hucha} onChange={(e) => onUpdateHucha(Number(e.target.value))} style={{ width: 100, textAlign: 'right' }} />
        </div>
      </Card>

      {showForm && (
        <Card>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </Select>
          </Field>
          <Field label="Concepto">
            <TextInput value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Ej. propina, libro…" />
          </Field>
          <Field label="Cantidad (€)">
            <TextInput type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
          </Field>
          <PrimaryButton accent={accent} onClick={handleSubmit}>Guardar movimiento</PrimaryButton>
        </Card>
      )}

      {economia.movimientos.length === 0
        ? <EmptyHint text="Todavía no has registrado ningún movimiento." />
        : (
          <ListCard>
            {[...economia.movimientos].reverse().slice(0, 8).map((m, i, arr) => (
              <ListRow key={m.id} last={i === arr.length - 1}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{m.concepto}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{formatFecha(m.fecha)}</p>
                </div>
                <p className="text-sm font-bold flex-shrink-0" style={{ color: m.tipo === 'ingreso' ? COLORS.positive : COLORS.negative }}>
                  {m.tipo === 'ingreso' ? '+' : '-'}{m.cantidad.toFixed(2)} €
                </p>
              </ListRow>
            ))}
          </ListCard>
        )}

      <AIPanel
        label="Consejo financiero"
        accent={accent}
        buildPrompt={() => `Saldo actual de Josué: ${saldo.toFixed(2)}€. Este mes: ${ingresosMes.toFixed(2)}€ de ingresos y ${gastosMes.toFixed(2)}€ de gastos. Movimientos recientes (JSON): ${JSON.stringify(esteMes.slice(-10))}. Da un consejo breve.`}
      />
    </div>
  );
}
