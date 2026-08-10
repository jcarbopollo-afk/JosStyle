import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS, ESTADOS_NEGOCIO } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, EmptyHint, AIPanel } from '../components/ui';

// Fase 7 — módulo deliberadamente simple (petición explícita de Josué): una lista de proyectos,
// sin sub-listas de movimientos. Ingresos/gastos son totales que se editan a mano, no un libro
// de transacciones — eso ya lo cubre Economía.
function ProyectoCard({ proyecto, onUpdate, onDelete, accent }) {
  const [abierto, setAbierto] = useState(false);

  const balance = (Number(proyecto.ingresos) || 0) - (Number(proyecto.gastos) || 0);

  return (
    <Card>
      <button onClick={() => setAbierto((a) => !a)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{proyecto.nombre}</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{proyecto.estado} · {formatFecha(proyecto.fecha)}</p>
        </div>
        {abierto ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
      </button>

      {abierto && (
        <div className="mt-3 space-y-3">
          <Field label="Estado">
            <Select value={proyecto.estado} onChange={(e) => onUpdate({ ...proyecto, estado: e.target.value })}>
              {ESTADOS_NEGOCIO.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Notas / clientes">
            <TextInput value={proyecto.notas} onChange={(e) => onUpdate({ ...proyecto, notas: e.target.value })} placeholder="Ideas, clientes, tareas pendientes..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ingresos totales (€)">
              <TextInput type="number" value={proyecto.ingresos} onChange={(e) => onUpdate({ ...proyecto, ingresos: e.target.value })} />
            </Field>
            <Field label="Gastos totales (€)">
              <TextInput type="number" value={proyecto.gastos} onChange={(e) => onUpdate({ ...proyecto, gastos: e.target.value })} />
            </Field>
          </div>
          <p className="text-xs" style={{ color: balance >= 0 ? COLORS.positive : COLORS.negative }}>
            Balance: {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
          </p>
          <button onClick={() => onDelete(proyecto.id)} className="text-xs" style={{ color: COLORS.negative }}>Borrar proyecto</button>
        </div>
      )}
    </Card>
  );
}

export default function BusinessView({ negocio, onAddProyecto, onUpdateProyecto, onDeleteProyecto, accent }) {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');

  const crear = () => {
    if (!nombre.trim()) return;
    onAddProyecto({ id: uid(), nombre: nombre.trim(), estado: ESTADOS_NEGOCIO[0], notas: '', ingresos: 0, gastos: 0, fecha: todayISO() });
    setNombre('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Sencillo a propósito — ideas y proyectos, sin complicarlo">
        <span className="flex items-center gap-2"><Briefcase size={18} style={{ color: accent }} /> Negocio</span>
      </SectionTitle>

      <div style={{ width: 190 }}>
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setShowForm((s) => !s)}>Nuevo proyecto</PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center gap-2">
            <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && crear()} placeholder="Nombre del proyecto o idea" />
            <div style={{ width: 90, flexShrink: 0 }}><PrimaryButton accent={accent} onClick={crear}>Crear</PrimaryButton></div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {negocio.proyectos.length === 0 && <EmptyHint text="Todavía no has añadido ningún proyecto o idea." />}
        {[...negocio.proyectos].reverse().map((p) => (
          <ProyectoCard key={p.id} proyecto={p} onUpdate={onUpdateProyecto} onDelete={onDeleteProyecto} accent={accent} />
        ))}
      </div>

      <AIPanel
        label="Mejorar mis ideas"
        accent={accent}
        buildPrompt={() =>
          `Proyectos e ideas de negocio de Josué, 16 años (JSON): ${JSON.stringify(negocio.proyectos)}. ` +
          `Dale ideas concretas para mejorar o avanzar cada proyecto — sugiere, no le digas qué debe hacer. ` +
          `Si no hay ningún proyecto todavía, anímale a apuntar la primera idea que tenga, por pequeña que sea.`
        }
      />
    </div>
  );
}
