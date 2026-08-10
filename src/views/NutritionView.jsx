import React, { useState } from 'react';
import { Camera, Droplet, Star, Loader2, Barcode, Plus, Trash2 } from 'lucide-react';
import { COLORS, VASO_ML } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { buscarProductoPorCodigoBarras } from '../lib/openFoodFacts';
import { askAIWithImage, AI_SYSTEM } from '../lib/ai';
import { Card, SectionTitle, Field, TextInput, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel } from '../components/ui';
import BarcodeScanner from '../components/BarcodeScanner';

const emptyForm = () => ({ nombre: '', calorias: '', proteinas: '', carbohidratos: '', grasas: '', fibra: '' });
const round1 = (v) => Math.round((v || 0) * 10) / 10;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MealForm({ onSave, onSaveFavorite, accent }) {
  const [form, setForm] = useState(emptyForm());
  const [scanning, setScanning] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState(null);
  const [gramos, setGramos] = useState('100');
  const [analizandoFoto, setAnalizandoFoto] = useState(false);
  const [aviso, setAviso] = useState('');

  const handleBarcodeDetected = async (codigo) => {
    setScanning(false);
    setAviso('Buscando el producto…');
    try {
      const producto = await buscarProductoPorCodigoBarras(codigo);
      if (!producto) {
        setAviso('No he encontrado ese código en Open Food Facts — rellena los datos a mano.');
        return;
      }
      setProductoEscaneado(producto);
      setGramos('100');
      setForm({
        nombre: producto.nombre,
        calorias: producto.por100g.calorias,
        proteinas: producto.por100g.proteinas,
        carbohidratos: producto.por100g.carbohidratos,
        grasas: producto.por100g.grasas,
        fibra: producto.por100g.fibra,
      });
      setAviso('');
    } catch (e) {
      setAviso('No se pudo consultar la base de datos de productos. Prueba otra vez o rellena a mano.');
    }
  };

  const aplicarGramos = (g) => {
    setGramos(g);
    if (!productoEscaneado) return;
    const factor = Number(g) / 100;
    const p = productoEscaneado.por100g;
    setForm((f) => ({
      ...f,
      calorias: Math.round(p.calorias * factor),
      proteinas: round1(p.proteinas * factor),
      carbohidratos: round1(p.carbohidratos * factor),
      grasas: round1(p.grasas * factor),
      fibra: round1(p.fibra * factor),
    }));
  };

  const handleFotoComida = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAnalizandoFoto(true);
    setAviso('');
    setProductoEscaneado(null);
    try {
      const base64 = await fileToBase64(file);
      const respuesta = await askAIWithImage(
        AI_SYSTEM,
        'Mira esta foto de comida. Devuelve SOLO un JSON, sin texto antes ni después ni marcas de código, con este formato exacto: {"nombre":"...", "calorias":N, "proteinas":N, "carbohidratos":N, "grasas":N, "fibra":N} — valores aproximados del plato completo visible. Si no hay comida identificable, responde {"nombre":"", "calorias":0, "proteinas":0, "carbohidratos":0, "grasas":0, "fibra":0}.',
        base64,
        file.type || 'image/jpeg'
      );
      const limpio = respuesta.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(limpio);
      if (!parsed.nombre) {
        setAviso('No he podido identificar comida en esa foto — prueba con otra o rellena a mano.');
      } else {
        setForm({
          nombre: parsed.nombre,
          calorias: parsed.calorias || '',
          proteinas: parsed.proteinas || '',
          carbohidratos: parsed.carbohidratos || '',
          grasas: parsed.grasas || '',
          fibra: parsed.fibra || '',
        });
        setAviso('Estimación de la IA a partir de la foto — revisa los números antes de guardar, no es una medición exacta.');
      }
    } catch (err) {
      setAviso('No he podido analizar la foto ahora mismo. Prueba otra vez o rellena a mano.');
    } finally {
      setAnalizandoFoto(false);
    }
  };

  const submit = (guardarFavorito) => {
    if (!form.nombre) return;
    const entry = {
      id: uid(),
      fecha: todayISO(),
      nombre: form.nombre,
      calorias: Number(form.calorias) || 0,
      proteinas: Number(form.proteinas) || 0,
      carbohidratos: Number(form.carbohidratos) || 0,
      grasas: Number(form.grasas) || 0,
      fibra: Number(form.fibra) || 0,
    };
    onSave(entry);
    if (guardarFavorito) onSaveFavorite(entry);
    setForm(emptyForm());
    setProductoEscaneado(null);
    setAviso('');
  };

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <GhostBtn onClick={() => setScanning(true)} icon={Barcode}>Escanear código</GhostBtn>
        <label className="block">
          <div
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}`, opacity: analizandoFoto ? 0.6 : 1 }}
          >
            {analizandoFoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {analizandoFoto ? 'Analizando…' : 'Foto del plato'}
          </div>
          <input type="file" accept="image/*" capture="environment" onChange={handleFotoComida} disabled={analizandoFoto} className="hidden" />
        </label>
      </div>

      {aviso && <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{aviso}</p>}

      {productoEscaneado && (
        <div className="rounded-xl p-3 mb-3" style={{ background: COLORS.surface2 }}>
          <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
            {productoEscaneado.marca && `${productoEscaneado.marca} — `}valores de la etiqueta por 100 g. Ajusta a la cantidad que comes de verdad:
          </p>
          <Field label="Cantidad consumida (g)">
            <TextInput type="number" value={gramos} onChange={(e) => aplicarGramos(e.target.value)} />
          </Field>
        </div>
      )}

      <Field label="Nombre">
        <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. tortilla de patatas" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Calorías (kcal)">
          <TextInput type="number" value={form.calorias} onChange={(e) => setForm({ ...form, calorias: e.target.value })} />
        </Field>
        <Field label="Proteínas (g)">
          <TextInput type="number" value={form.proteinas} onChange={(e) => setForm({ ...form, proteinas: e.target.value })} />
        </Field>
        <Field label="Carbohidratos (g)">
          <TextInput type="number" value={form.carbohidratos} onChange={(e) => setForm({ ...form, carbohidratos: e.target.value })} />
        </Field>
        <Field label="Grasas (g)">
          <TextInput type="number" value={form.grasas} onChange={(e) => setForm({ ...form, grasas: e.target.value })} />
        </Field>
      </div>
      <Field label="Fibra (g)">
        <TextInput type="number" value={form.fibra} onChange={(e) => setForm({ ...form, fibra: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton accent={accent} onClick={() => submit(false)}>Guardar comida</PrimaryButton>
        <GhostBtn onClick={() => submit(true)} icon={Star}>Guardar y marcar favorita</GhostBtn>
      </div>

      {scanning && <BarcodeScanner accent={accent} onDetected={handleBarcodeDetected} onClose={() => setScanning(false)} />}
    </Card>
  );
}

function ComidasTab({ comidas, onAdd, onAddFavorito, accent }) {
  const hoy = todayISO();
  const deHoy = comidas.filter((c) => c.fecha === hoy);
  const totales = deHoy.reduce(
    (acc, c) => ({
      calorias: acc.calorias + c.calorias,
      proteinas: acc.proteinas + c.proteinas,
      carbohidratos: acc.carbohidratos + c.carbohidratos,
      grasas: acc.grasas + c.grasas,
    }),
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  );

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Hoy</p>
        <p className="text-3xl font-extrabold mt-1" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {totales.calorias} <span className="text-base font-medium" style={{ color: COLORS.textMuted }}>kcal</span>
        </p>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: COLORS.textMuted }}>
          <span>{round1(totales.proteinas)} g prot.</span>
          <span>{round1(totales.carbohidratos)} g carb.</span>
          <span>{round1(totales.grasas)} g grasa</span>
        </div>
      </Card>

      <MealForm onSave={onAdd} onSaveFavorite={onAddFavorito} accent={accent} />

      <div className="space-y-2">
        {deHoy.length === 0 && <EmptyHint text="Todavía no has registrado ninguna comida hoy." />}
        {[...deHoy].reverse().map((c) => (
          <Card key={c.id} style={{ padding: '1rem' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{c.nombre}</p>
              <p className="text-sm font-bold" style={{ color: COLORS.text }}>{c.calorias} kcal</p>
            </div>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              {round1(c.proteinas)}g prot. · {round1(c.carbohidratos)}g carb. · {round1(c.grasas)}g grasa · {round1(c.fibra)}g fibra
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AguaTab({ agua, onSetAgua, accent }) {
  const hoy = todayISO();
  const mlHoy = agua[hoy] || 0;
  const vasos = Math.round(mlHoy / VASO_ML);

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center py-8">
        <Droplet size={32} style={{ color: accent }} />
        <p className="text-3xl font-extrabold mt-3" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {(mlHoy / 1000).toFixed(2)} L
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{vasos} vasos de {VASO_ML} ml hoy</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onSetAgua(hoy, Math.max(0, mlHoy - VASO_ML))}
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            −
          </button>
          <button
            onClick={() => onSetAgua(hoy, mlHoy + VASO_ML)}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: accent, color: '#080A0D' }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </Card>
    </div>
  );
}

function FavoritosTab({ favoritos, onRegistrar, onEliminar, accent }) {
  return (
    <div className="space-y-2">
      {favoritos.length === 0 && <EmptyHint text="Guarda una comida como favorita desde 'Comidas' para verla aquí." />}
      {[...favoritos].reverse().map((f) => (
        <Card key={f.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{f.nombre}</p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{f.calorias} kcal · {round1(f.proteinas)}g prot.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onRegistrar(f)} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: accent, color: '#080A0D' }}>
              Registrar hoy
            </button>
            <button onClick={() => onEliminar(f.id)} aria-label="Eliminar favorito">
              <Trash2 size={15} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function NutritionView({ nutricion, onAddComida, onAddFavorito, onRegistrarFavorito, onEliminarFavorito, onSetAgua, accent }) {
  const [sub, setSub] = useState('comidas');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Registra para que la IA vea tus hábitos, no para perseguir cifras exactas">Nutrición</SectionTitle>

      <div className="flex gap-2">
        <ToggleTab active={sub === 'comidas'} onClick={() => setSub('comidas')} accent={accent}>Comidas</ToggleTab>
        <ToggleTab active={sub === 'agua'} onClick={() => setSub('agua')} accent={accent}>Agua</ToggleTab>
        <ToggleTab active={sub === 'favoritos'} onClick={() => setSub('favoritos')} accent={accent}>Favoritos</ToggleTab>
      </div>

      {sub === 'comidas' && <ComidasTab comidas={nutricion.comidas} onAdd={onAddComida} onAddFavorito={onAddFavorito} accent={accent} />}
      {sub === 'agua' && <AguaTab agua={nutricion.agua} onSetAgua={onSetAgua} accent={accent} />}
      {sub === 'favoritos' && (
        <FavoritosTab favoritos={nutricion.favoritos} onRegistrar={onRegistrarFavorito} onEliminar={onEliminarFavorito} accent={accent} />
      )}

      <AIPanel
        label="Analizar mi nutrición"
        accent={accent}
        buildPrompt={() =>
          `Comidas registradas por Josué, 16 años, recientemente (JSON): ${JSON.stringify(nutricion.comidas.slice(-20))}. ` +
          `Agua de los últimos días (JSON, ml por fecha): ${JSON.stringify(nutricion.agua)}. ` +
          `No des objetivos calóricos estrictos ni un plan de dieta — céntrate en hábitos, constancia, variedad y energía. ` +
          `Si detectas un patrón simple, cítalo con el dato concreto; si hay pocos datos, dilo abiertamente.`
        }
      />
    </div>
  );
}
