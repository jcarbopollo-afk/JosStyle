import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Target } from 'lucide-react';
import { COLORS } from '../tokens';
import { uid, formatFecha, todayISO } from '../lib/helpers';
import { Card, ListCard, ListRow, BotonBorrar, SectionTitle, Field, TextInput, Select, PrimaryButton, EmptyHint, AIPanel } from '../components/ui';
// Entrega 3 · F4 — los números de la hucha los calcula la librería, nunca la pantalla.
import {
  FRECUENCIAS_HUCHA, panelHucha, normalizarObjetivoHucha,
  anadirAhorro, guardarObjetivoHucha, quitarObjetivoHucha,
} from '../lib/hucha';

/* ===========================================================================
   ENTREGA 3 · FASE 4 — LA HUCHA
   ===========================================================================
   *"La hucha debe seguir ocupando prácticamente el mismo espacio que ocupa
   actualmente. […] No quiero una pantalla nueva para esto."* (apartado 9)

   Por eso esto es **una fila de la tarjeta de Cuenta principal**, no una Card
   propia: el icono, la cifra, la barra de doce bloques, la línea del objetivo y
   un botón discreto que despliega la configuración **debajo, sin salir de aquí**.

   ⚠️ **Los números los calcula `src/lib/hucha.js`**, no esta pantalla. Aquí no
   se suma ni se divide nada: si la tarjeta dijera un porcentaje distinto del de
   la librería, sería porque alguien contó por su cuenta.
   =========================================================================== */
function BloqueHucha({ economia, accent, onUpdateHucha, onUpdateEconomia }) {
  const [abierto, setAbierto] = useState(false);
  const [ahorro, setAhorro] = useState('');
  const [meta, setMeta] = useState('');
  const [porPeriodo, setPorPeriodo] = useState('');
  const [frecuencia, setFrecuencia] = useState('semana');

  const panel = panelHucha(economia);
  const objetivo = normalizarObjetivoHucha(economia?.objetivoHucha);

  // Al abrir la configuración se rellena con lo que ya hay, para que editar no
  // obligue a volver a escribirlo todo.
  const abrir = () => {
    setMeta(objetivo.cantidad === null ? '' : String(objetivo.cantidad));
    setPorPeriodo(objetivo.porPeriodo === null ? '' : String(objetivo.porPeriodo));
    setFrecuencia(objetivo.frecuencia);
    setAbierto(true);
  };

  const guardarAhorro = () => {
    const c = Number(ahorro);
    if (!Number.isFinite(c) || c === 0) return;
    onUpdateEconomia(anadirAhorro(economia, c));
    setAhorro('');
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Apartado 3 — un icono pequeño y elegante, del mismo juego que el resto
              de la app. `PiggyBank` de Lucide: se reconoce al instante y no convierte
              la tarjeta en algo infantil. */}
          <PiggyBank size={16} style={{ color: accent, flexShrink: 0 }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Hucha</p>
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{panel.titulo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <TextInput
            type="number"
            value={economia.hucha}
            onChange={(e) => onUpdateHucha(Number(e.target.value))}
            style={{ width: 84, textAlign: 'right' }}
            aria-label="Total ahorrado"
          />
          <button
            onClick={() => (abierto ? setAbierto(false) : abrir())}
            className="p-1.5 -m-1.5 rounded-lg"
            aria-expanded={abierto}
            aria-label={objetivo.cantidad === null ? 'Añadir objetivo de ahorro' : 'Cambiar el objetivo de ahorro'}
          >
            <Target size={14} style={{ color: abierto ? accent : COLORS.textMuted }} />
          </button>
        </div>
      </div>

      {/* Apartado 6 — la barra y la línea del objetivo, solo cuando hay objetivo. */}
      {panel.barra && (
        <div className="mt-2">
          <p className="text-xs tabular-nums tracking-tight" style={{ color: accent, fontFamily: 'monospace' }}>
            {panel.barra} {panel.porcentaje} %
          </p>
          {panel.detalle && (
            <p className="text-[11px] mt-1 font-semibold" style={{ color: COLORS.positive }}>🎉 {panel.detalle}</p>
          )}
          {panel.periodo && (
            <>
              <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{panel.periodo.linea}</p>
              <p className="text-[11px] mt-0.5 font-semibold" style={{ color: panel.periodo.cumplido ? COLORS.positive : COLORS.textMuted }}>
                {panel.periodo.cumplido ? '✅' : '⚠️'} {panel.periodo.estado}
              </p>
            </>
          )}
        </div>
      )}

      {/* Apartado 4 — añadir ahorro. Es lo que alimenta el seguimiento del periodo:
          una sola vez, sin pedir el dato dos veces (apartado 7). */}
      <div className="flex items-center gap-2 mt-2">
        <TextInput
          type="number"
          value={ahorro}
          onChange={(e) => setAhorro(e.target.value)}
          placeholder="Añadir ahorro (€)"
          style={{ flex: 1 }}
          aria-label="Cantidad que añades a la hucha"
        />
        <div style={{ width: 96 }}>
          <PrimaryButton accent={accent} onClick={guardarAhorro}>Añadir</PrimaryButton>
        </div>
      </div>

      {abierto && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Field label="Cantidad objetivo (€)">
            <TextInput type="number" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Ej. 500" />
          </Field>
          <Field label="Quiero ahorrar (€)">
            <TextInput type="number" value={porPeriodo} onChange={(e) => setPorPeriodo(e.target.value)} placeholder="Ej. 50" />
          </Field>
          <Field label="Cada">
            <Select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
              {FRECUENCIAS_HUCHA.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </Select>
          </Field>
          <div className="flex gap-2">
            <PrimaryButton
              accent={accent}
              onClick={() => {
                onUpdateEconomia(guardarObjetivoHucha(economia, { cantidad: meta, porPeriodo, frecuencia }));
                setAbierto(false);
              }}
            >
              Guardar objetivo
            </PrimaryButton>
            {objetivo.cantidad !== null && (
              <button
                onClick={() => { onUpdateEconomia(quitarObjetivoHucha(economia)); setAbierto(false); }}
                className="text-xs font-semibold px-3 rounded-xl flex-shrink-0"
                style={{ color: COLORS.textMuted, background: COLORS.surface2 }}
              >
                Quitar
              </button>
            )}
          </div>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            El progreso de cada periodo cuenta lo que añades aquí a la hucha.
          </p>
        </div>
      )}
    </div>
  );
}

export default function FinanceView({ economia, onAddMovimiento, onDeleteMovimiento, onUpdateHucha, onUpdateEconomia, accent, foco, onFocoConsumido }) {
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
        {/* Entrega 3 · F4 — la hucha sigue siendo una fila dentro de esta misma tarjeta
            (apartados 2, 9 y 11): *"una pequeña herramienta dentro de Economía"*, no otro
            módulo. No hay pantalla nueva; lo del objetivo se despliega aquí mismo. */}
        <BloqueHucha
          economia={economia}
          accent={accent}
          onUpdateHucha={onUpdateHucha}
          onUpdateEconomia={onUpdateEconomia}
        />
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: m.tipo === 'ingreso' ? COLORS.positive : COLORS.negative }}>
                    {m.tipo === 'ingreso' ? '+' : '-'}{m.cantidad.toFixed(2)} €
                  </p>
                  <BotonBorrar onClick={() => onDeleteMovimiento(m.id)} label="Eliminar movimiento" />
                </div>
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
