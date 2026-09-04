import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Camera, AlertCircle, HeartPulse } from 'lucide-react';
import { COLORS, TIPOS_HISTORIAL_MEDICO } from '../tokens';
import { uid, formatFecha, todayISO } from '../lib/helpers';
import { getSignedPhotoUrl } from '../lib/supabase';
import { BotonBorrar, BotonBorrarDefinitivo, Card, SectionTitle, Field, TextInput, Select, PrimaryButton, ToggleTab, EmptyHint, AIPanel, PinGate } from '../components/ui';

function diasDesde(fechaISO) {
  return Math.floor((Date.now() - new Date(fechaISO + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24));
}

function MedidasTab({ medidas, onAdd, accent , onDeleteMedida }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ peso: '', grasaCorporal: '', frecuenciaCardiaca: '', tensionSistolica: '', tensionDiastolica: '', notas: '' });

  const ultimos = medidas.slice(-10);
  const chartData = ultimos.filter((e) => e.peso).map((e) => ({ fecha: formatFecha(e.fecha), peso: Number(e.peso) }));
  const ultima = medidas[medidas.length - 1];
  const sinRegistroReciente = !ultima || diasDesde(ultima.fecha) >= 7;

  const submit = () => {
    if (!form.peso && !form.grasaCorporal && !form.frecuenciaCardiaca && !form.tensionSistolica) return;
    onAdd({ id: uid(), fecha: todayISO(), ...form });
    setShowForm(false);
    setForm({ peso: '', grasaCorporal: '', frecuenciaCardiaca: '', tensionSistolica: '', tensionDiastolica: '', notas: '' });
  };

  return (
    <div className="space-y-4">
      {sinRegistroReciente && (
        <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: 'rgba(180,160,80,0.08)', border: '1px solid rgba(180,160,80,0.25)' }}>
          <AlertCircle size={16} style={{ color: COLORS.warning, flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {ultima ? `Hace ${diasDesde(ultima.fecha)} días que no registras tus medidas.` : 'Todavía no has registrado ninguna medida.'} Un registro rápido ayuda a la IA a ver tu evolución real.
          </p>
        </div>
      )}

      <div style={{ width: 160 }}>
        <PrimaryButton accent={accent} onClick={() => setShowForm((s) => !s)}>Registrar medidas</PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (kg)">
              <TextInput type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            </Field>
            <Field label="Grasa corporal (%)">
              <TextInput type="number" step="0.1" value={form.grasaCorporal} onChange={(e) => setForm({ ...form, grasaCorporal: e.target.value })} />
            </Field>
            <Field label="Frecuencia cardíaca (ppm)">
              <TextInput type="number" value={form.frecuenciaCardiaca} onChange={(e) => setForm({ ...form, frecuenciaCardiaca: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tensión sist.">
                <TextInput type="number" value={form.tensionSistolica} onChange={(e) => setForm({ ...form, tensionSistolica: e.target.value })} />
              </Field>
              <Field label="Tensión diast.">
                <TextInput type="number" value={form.tensionDiastolica} onChange={(e) => setForm({ ...form, tensionDiastolica: e.target.value })} />
              </Field>
            </div>
          </div>
          <Field label="Notas (dolores, cómo te encuentras...)">
            <TextInput value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </Field>
          <PrimaryButton accent={accent} onClick={submit}>Guardar</PrimaryButton>
        </Card>
      )}

      {chartData.length > 1 && (
        <Card>
          <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>Evolución del peso</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="fecha" stroke={COLORS.textMuted} fontSize={11} />
              <YAxis stroke={COLORS.textMuted} fontSize={11} width={30} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
              <Line type="monotone" dataKey="peso" stroke={accent} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="space-y-2">
        {medidas.length === 0 && <EmptyHint text="Todavía no has registrado ninguna medida." />}
        {[...medidas].reverse().slice(0, 6).map((e) => (
          <Card key={e.id} style={{ padding: '1rem' }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{formatFecha(e.fecha)}</p>
              <BotonBorrar onClick={() => onDeleteMedida(e.id)} label="Eliminar medida" />
            </div>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              {[e.peso && `${e.peso} kg`, e.grasaCorporal && `${e.grasaCorporal}% grasa`, e.frecuenciaCardiaca && `${e.frecuenciaCardiaca} ppm`, e.tensionSistolica && `${e.tensionSistolica}/${e.tensionDiastolica || '?'} tensión`].filter(Boolean).join(' · ') || 'Sin valores numéricos'}
            </p>
            {e.notas && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{e.notas}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function HistorialTab({ historial, onAdd, accent , onDeleteHistorial }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: TIPOS_HISTORIAL_MEDICO[0], descripcion: '' });

  const submit = () => {
    if (!form.descripcion.trim()) return;
    onAdd({ id: uid(), fecha: todayISO(), ...form });
    setShowForm(false);
    setForm({ tipo: TIPOS_HISTORIAL_MEDICO[0], descripcion: '' });
  };

  return (
    <div className="space-y-4">
      <div style={{ width: 160 }}>
        <PrimaryButton accent={accent} onClick={() => setShowForm((s) => !s)}>Añadir al historial</PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS_HISTORIAL_MEDICO.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Descripción">
            <TextInput value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: esguince de tobillo derecho jugando al fútbol" />
          </Field>
          <PrimaryButton accent={accent} onClick={submit}>Guardar</PrimaryButton>
        </Card>
      )}

      <div className="space-y-2">
        {historial.length === 0 && <EmptyHint text="Todavía no hay nada en tu historial médico." />}
        {[...historial].reverse().map((e) => (
          <Card key={e.id} style={{ padding: '1rem' }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold min-w-0 truncate" style={{ color: COLORS.text }}>{e.tipo}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-xs" style={{ color: COLORS.textMuted }}>{formatFecha(e.fecha)}</p>
                <BotonBorrar onClick={() => onDeleteHistorial(e.id)} label="Eliminar entrada médica" />
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{e.descripcion}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FotosTab({ fotos, onAddFoto, onDeleteFoto, accent }) {
  const [urls, setUrls] = useState({});
  const [uploading, setUploading] = useState(false);
  const [nota, setNota] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(fotos.map(async (f) => [f.id, await getSignedPhotoUrl(f.path)]));
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [fotos]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await onAddFoto(file, nota);
      setNota('');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <Field label="Nota (opcional, para esta próxima foto)">
          <TextInput value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: después de 3 meses de rutina" />
        </Field>
        <label className="block">
          <div
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold w-full cursor-pointer"
            style={{ background: accent, color: COLORS.textOnAccent, opacity: uploading ? 0.6 : 1 }}
          >
            <Camera size={16} strokeWidth={2.5} />
            {uploading ? 'Subiendo…' : 'Añadir foto de progreso'}
          </div>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </Card>

      {fotos.length === 0 && <EmptyHint text="Todavía no has subido ninguna foto de progreso." />}
      <div className="grid grid-cols-2 gap-3">
        {[...fotos].reverse().map((f) => (
          <div key={f.id} className="rounded-2xl overflow-hidden relative" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            {urls[f.id]
              ? <img src={urls[f.id]} alt={f.nota || f.fecha} className="w-full aspect-square object-cover" />
              : <div className="w-full aspect-square" />}
            <div className="p-2">
              <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{formatFecha(f.fecha)}</p>
              {f.nota && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{f.nota}</p>}
            </div>
            {/* Entrega 3 · F1, apartado 3 — la foto se borra de verdad del almacenamiento y
                no pasa por la papelera, así que aquí sí se pregunta antes. */}
            <BotonBorrarDefinitivo
              onConfirm={() => onDeleteFoto(f.id, f.path)}
              label="Borrar foto"
              titulo="¿Eliminar esta foto?"
              detalle="La foto se borra del todo y no se puede recuperar."
              className="absolute top-2 right-2 rounded-full p-2 transition-transform active:scale-90"
              style={{ border: `1px solid ${COLORS.border}` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Fase de Seguridad Centralizada — "Ver fotos privadas" pasa de protección fija (siempre, sin
// opción) a protección de FUNCIÓN configurable (apartado 2): `protegidoFotos` viene de
// `seguridad.protectedActions.includes('fotos_privadas')` en vez de "siempre true". Si Josué la
// desactiva desde Seguridad, esta pestaña se ve directo, sin PinGate — el resto de props
// (`pinHash`/`pinSalt`/`desbloqueadoFotos`/`onDesbloquearFotos`/`onOlvidoPin`) vienen de App.jsx,
// que es quien de verdad decide y guarda el estado de protección (un único sistema).
export default function HealthView({ salud, fotos, onAddMedida, onDeleteMedida, onAddHistorial, onDeleteHistorial, onAddFoto, onDeleteFoto, protegidoFotos, pinHash, pinSalt, desbloqueadoFotos, onDesbloquearFotos, onOlvidoPin, accent }) {
  const [sub, setSub] = useState('medidas');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Entrada manual — la IA la interpreta, nunca prescribe objetivos estrictos por su cuenta">
        <span className="flex items-center gap-2"><HeartPulse size={18} style={{ color: accent }} /> Salud</span>
      </SectionTitle>

      <div className="flex gap-2">
        <ToggleTab active={sub === 'medidas'} onClick={() => setSub('medidas')} accent={accent}>Medidas</ToggleTab>
        <ToggleTab active={sub === 'historial'} onClick={() => setSub('historial')} accent={accent}>Historial</ToggleTab>
        <ToggleTab active={sub === 'fotos'} onClick={() => setSub('fotos')} accent={accent}>Fotos</ToggleTab>
      </div>

      {sub === 'medidas' && <MedidasTab medidas={salud.medidas} onAdd={onAddMedida} accent={accent} onDeleteMedida={onDeleteMedida} />}
      {sub === 'historial' && <HistorialTab historial={salud.historial} onAdd={onAddHistorial} accent={accent} onDeleteHistorial={onDeleteHistorial} />}
      {sub === 'fotos' && (
        protegidoFotos ? (
          <PinGate
            pinHash={pinHash} pinSalt={pinSalt} accent={accent}
            desbloqueado={desbloqueadoFotos} onDesbloquear={onDesbloquearFotos} onOlvidoPin={onOlvidoPin}
          >
            <FotosTab fotos={fotos} onAddFoto={onAddFoto} onDeleteFoto={onDeleteFoto} accent={accent} />
          </PinGate>
        ) : (
          <FotosTab fotos={fotos} onAddFoto={onAddFoto} onDeleteFoto={onDeleteFoto} accent={accent} />
        )
      )}

      <AIPanel
        label="Analizar mi salud"
        accent={accent}
        buildPrompt={() =>
          `Medidas de salud de Josué, 16 años, en desarrollo (JSON): ${JSON.stringify(salud.medidas.slice(-15))}. ` +
          `Historial médico reciente (JSON): ${JSON.stringify(salud.historial.slice(-10))}. ` +
          `No des objetivos de peso ni calóricos estrictos, ni interpretes esto como diagnóstico médico. ` +
          `Si detectas un patrón simple en los datos, dilo citando el dato concreto; si no hay suficientes datos, dilo abiertamente.`
        }
      />
    </div>
  );
}
