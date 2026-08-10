import React, { useState } from 'react';
import { Heart, Trash2, CalendarHeart } from 'lucide-react';
import { COLORS } from '../tokens';
import { uid, formatFecha, diasHasta } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, PrimaryButton, ToggleTab, EmptyHint } from '../components/ui';

// Fase 13 — solo la lista de nombres del Prompt Maestro. Tocar uno abre el formulario de fecha
// para que Josué la escriba él mismo — nada se calcula ni se repite en automático (ver HANDOFF).
const DIAS_ESPECIALES_PRESET = [
  'Aniversario', 'Cumpleaños', 'Día de la Novia', 'Día del Peluche', 'Día de las Flores Amarillas',
  'Día del Chocolate', 'Día del Cine', 'Día del Maquillaje', 'Día del Anillo de Promesa',
  'Día de los Collares', 'Día de los Poemas',
];

function diasLabel(dias) {
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

function NombreCard({ nombre, onUpdate, accent }) {
  const [valor, setValor] = useState(nombre);
  const [showForm, setShowForm] = useState(!nombre);

  const guardar = () => {
    if (!valor.trim()) return;
    onUpdate(valor.trim());
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart size={18} style={{ color: accent }} fill={accent} />
          <p className="text-base font-semibold" style={{ color: COLORS.text }}>{nombre}</p>
        </div>
        <button onClick={() => { setValor(nombre); setShowForm(true); }} className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
          Editar
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <Field label="Nombre de tu pareja">
        <TextInput value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ej: Ana" />
      </Field>
      <PrimaryButton accent={accent} disabled={!valor.trim()} onClick={guardar}>Guardar</PrimaryButton>
    </Card>
  );
}

function FechasTab({ fechas, onAdd, onDelete, accent }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ etiqueta: '', fecha: '' });

  const submit = () => {
    if (!form.etiqueta.trim() || !form.fecha) return;
    onAdd({ id: uid(), etiqueta: form.etiqueta.trim(), fecha: form.fecha });
    setShowForm(false);
    setForm({ etiqueta: '', fecha: '' });
  };

  const ordenadas = [...fechas].sort((a, b) => diasHasta(a.fecha) - diasHasta(b.fecha));

  return (
    <div className="space-y-4">
      <div style={{ width: 180 }}>
        <PrimaryButton accent={accent} onClick={() => setShowForm((s) => !s)}>Añadir fecha importante</PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <Field label="Qué se celebra">
            <TextInput value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} placeholder="Ej: Aniversario" />
          </Field>
          <Field label="Fecha">
            <TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
          <PrimaryButton accent={accent} onClick={submit}>Guardar</PrimaryButton>
        </Card>
      )}

      <div className="space-y-2">
        {ordenadas.length === 0 && <EmptyHint text="Todavía no has añadido ninguna fecha importante." />}
        {ordenadas.map((f) => {
          const dias = diasHasta(f.fecha);
          return (
            <Card key={f.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarHeart size={16} style={{ color: accent, flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{f.etiqueta}</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{formatFecha(f.fecha)} · {diasLabel(dias)}</p>
                </div>
              </div>
              <button onClick={() => onDelete(f.id)} className="p-1.5" aria-label="Borrar fecha">
                <Trash2 size={14} style={{ color: COLORS.textMuted }} />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function EspecialesTab({ fechas, onAdd, accent }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [fecha, setFecha] = useState('');
  const yaAñadidos = new Set(fechas.map((f) => f.etiqueta));

  const confirmar = () => {
    if (!seleccionado || !fecha) return;
    onAdd({ id: uid(), etiqueta: seleccionado, fecha });
    setSeleccionado(null);
    setFecha('');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: COLORS.textMuted }}>
        Toca un día para añadirle una fecha — tú decides cuándo, nada se calcula ni se repite solo.
      </p>
      <div className="flex flex-wrap gap-2">
        {DIAS_ESPECIALES_PRESET.map((d) => (
          <button
            key={d}
            onClick={() => { setSeleccionado(d); setFecha(''); }}
            className="rounded-full px-3 py-1.5 text-xs font-medium"
            style={seleccionado === d
              ? { background: accent, color: '#080A0D' }
              : { background: COLORS.surface2, color: yaAñadidos.has(d) ? COLORS.textMuted : COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            {d}{yaAñadidos.has(d) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {seleccionado && (
        <Card>
          <Field label={`Fecha de "${seleccionado}"`}>
            <TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <PrimaryButton accent={accent} disabled={!fecha} onClick={confirmar}>Añadir</PrimaryButton>
        </Card>
      )}
    </div>
  );
}

export default function RelationView({ relacion, onUpdateNombre, onAddFecha, onDeleteFecha, accent }) {
  const [sub, setSub] = useState('fechas');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Privado — protegido por tu PIN, entrada manual">
        <span className="flex items-center gap-2"><Heart size={18} style={{ color: accent }} /> Relación</span>
      </SectionTitle>

      <NombreCard nombre={relacion.nombre} onUpdate={onUpdateNombre} accent={accent} />

      <div className="flex gap-1.5">
        <ToggleTab active={sub === 'fechas'} onClick={() => setSub('fechas')} accent={accent}>Fechas</ToggleTab>
        <ToggleTab active={sub === 'especiales'} onClick={() => setSub('especiales')} accent={accent}>Días especiales</ToggleTab>
      </div>

      {sub === 'fechas' && <FechasTab fechas={relacion.fechas} onAdd={onAddFecha} onDelete={onDeleteFecha} accent={accent} />}
      {sub === 'especiales' && <EspecialesTab fechas={relacion.fechas} onAdd={onAddFecha} accent={accent} />}
    </div>
  );
}
