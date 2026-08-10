import React, { useState, useEffect } from 'react';
import { User, Download, Undo2, Lock, LogOut } from 'lucide-react';
import { COLORS, ACCENTS, ACTIVIDAD_FACTORES } from '../tokens';
import { calcularEdad, shade } from '../lib/helpers';
import { Card, Field, TextInput, Select, GhostBtn, PinSetter, SectionTitle } from '../components/ui';

export default function SettingsView({
  perfil, onUpdatePerfil, accent, onUpdateAccent,
  onExportCSV, onExportXLSX, onUndo, canUndo,
  pin, onSetPin, onSignOut,
}) {
  const [local, setLocal] = useState(perfil);
  useEffect(() => { setLocal(perfil); }, [perfil]);

  const edad = calcularEdad(local.fechaNacimiento);
  const alturaM = local.altura / 100;
  const imc = local.peso / (alturaM * alturaM);
  const bmr = 10 * local.peso + 6.25 * local.altura - 5 * edad + 5;
  const tdee = bmr * (ACTIVIDAD_FACTORES[local.actividad] || 1.55);
  const pesoMin = (18.5 * alturaM * alturaM).toFixed(0);
  const pesoMax = (24.9 * alturaM * alturaM).toFixed(0);

  const commit = (next) => { setLocal(next); onUpdatePerfil(next); };

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle>Personalización</SectionTitle>

      <Card>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
          <User size={16} style={{ color: accent }} /> Perfil
        </p>
        <Field label="Nombre">
          <TextInput value={local.nombre} onChange={(e) => setLocal({ ...local, nombre: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Altura (cm)">
            <TextInput type="number" value={local.altura} onChange={(e) => setLocal({ ...local, altura: Number(e.target.value) })} onBlur={() => onUpdatePerfil(local)} />
          </Field>
          <Field label="Peso (kg)">
            <TextInput type="number" value={local.peso} onChange={(e) => setLocal({ ...local, peso: Number(e.target.value) })} onBlur={() => onUpdatePerfil(local)} />
          </Field>
        </div>
        <Field label="Nivel de actividad">
          <Select value={local.actividad} onChange={(e) => commit({ ...local, actividad: e.target.value })}>
            <option value="sedentario">Sedentario</option>
            <option value="ligero">Ligero</option>
            <option value="moderado">Moderado</option>
            <option value="intenso">Intenso</option>
          </Select>
        </Field>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Cálculos corporales</p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{edad}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>años</p></div>
          <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{imc.toFixed(1)}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>IMC</p></div>
          <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{Math.round(bmr)}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>BMR kcal</p></div>
          <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{Math.round(tdee)}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>TDEE kcal</p></div>
        </div>
        <p className="text-xs mt-3 text-center leading-relaxed" style={{ color: COLORS.textMuted }}>
          Peso saludable orientativo: {pesoMin}–{pesoMax} kg. Son datos orientativos, no un diagnóstico — con 16 años y en desarrollo, dicen poco por sí solos.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Copia de seguridad</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <GhostBtn onClick={onExportCSV} icon={Download}>Exportar CSV</GhostBtn>
          <GhostBtn onClick={onExportXLSX} icon={Download}>Exportar Excel</GhostBtn>
        </div>
        <button
          onClick={onUndo} disabled={!canUndo}
          className="flex items-center gap-2 text-xs font-semibold disabled:opacity-40"
          style={{ color: COLORS.textMuted }}
        >
          <Undo2 size={14} /> Deshacer último cambio
        </button>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
          <Lock size={16} style={{ color: accent }} /> PIN de secciones privadas
        </p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Protegerá módulos como Relación en cuanto estén listos.</p>
        <PinSetter pin={pin} onSetPin={onSetPin} accent={accent} />
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Color de acento</p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Toca un color para aplicarlo a toda la app al instante.</p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              onClick={() => onUpdateAccent(a.value)}
              aria-label={a.name}
              className="w-10 h-10 rounded-full transition-transform active:scale-90"
              style={{
                background: `linear-gradient(135deg, ${shade(a.value, 45)}, ${a.value} 55%, ${shade(a.value, -35)})`,
                boxShadow: accent === a.value ? `0 0 0 2px ${COLORS.bg}, 0 0 0 4px ${a.value}` : 'none',
              }}
            />
          ))}
        </div>
      </Card>

      <button onClick={onSignOut} className="flex items-center justify-center gap-2 text-xs font-semibold w-full py-2" style={{ color: COLORS.textMuted }}>
        <LogOut size={14} /> Cerrar sesión
      </button>
    </div>
  );
}
