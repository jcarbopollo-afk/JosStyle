import React, { useState } from 'react';
import { Camera, Droplet, Star, Loader2, Barcode, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS, VASO_ML } from '../tokens';
import { uid, todayISO, addDays, hexToRgba } from '../lib/helpers';
/* Entrega 3 · F33 (NU F1) — el catálogo de indicadores y momentos, el resumen del
   día y los estados vacíos. 🚨 Los objetivos NO están: son la Fase 3, y aquí no
   se inventa ninguno (`NO_EN_NU1`). */
import {
  MOMENTOS, resumenDelDia, porMomento, hayAlgoRegistrado,
  etiquetaDeDia, VACIO_DIA, VACIO_MOMENTO,
} from '../lib/nutricion';
import { buscarProductoPorCodigoBarras } from '../lib/openFoodFacts';
import { askAIWithImage, AI_SYSTEM } from '../lib/ai';
import { BotonBorrar, Card, SectionTitle, Field, TextInput, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel } from '../components/ui';
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

/* 🚨 E3 F33 (NU F1) — el formulario recibe **el día que se está mirando y el
   momento desde el que se ha abierto**. Antes escribía `todayISO()` a pelo, así
   que con un selector de días que funciona habría guardado siempre en hoy: el
   selector habría sido decorativo (regla 8). */
function MealForm({ onSave, onSaveFavorite, accent, fecha, momentoId }) {
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
      fecha: fecha || todayISO(),
      momento: momentoId || null,
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

/* ── El resumen del día — apartados 2, 3 y 4 ───────────────────────────────
   🚨 **Sin objetivo no se pinta un objetivo.** `resumenDelDia` deja `objetivo` y
   `porcentaje` en `null` mientras no exista la Fase 3, así que aquí se ve lo
   consumido y ya: ni un «/ 2.400» inventado, ni una barra al 0 %. El día que la
   Fase 3 traiga los objetivos, esta pantalla **no cambia**. */
function Indicador({ dato, accent, principal = false, indice = 0 }) {
  return (
    <div
      className="hub-card rounded-2xl p-3"
      style={{
        animationDelay: `${indice * 60}ms`,
        background: principal
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.04)})`
          : COLORS.surface2,
        border: `1px solid ${principal ? hexToRgba(accent, 0.3) : COLORS.border}`,
      }}
    >
      <p className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
        <span>{dato.emoji}</span>{dato.nombre}
      </p>
      <p
        className={`${principal ? 'text-3xl' : 'text-xl'} font-extrabold mt-1 leading-none`}
        style={{ color: principal ? accent : COLORS.text, fontFamily: "'Manrope', sans-serif" }}
      >
        {dato.consumido}
        <span className={`${principal ? 'text-sm' : 'text-xs'} font-bold ml-1`} style={{ color: COLORS.textMuted }}>{dato.unidad}</span>
      </p>
      {/* Solo cuando de verdad hay un objetivo (apartados 3 y 4). */}
      {dato.objetivo !== null && (
        <>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>de {dato.objetivo} {dato.unidad}</p>
          <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.border }}>
            <div className="h-full rounded-full nu-progreso" style={{ width: `${dato.porcentajePintado}%`, background: accent }} />
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{dato.porcentaje} %</p>
        </>
      )}
    </div>
  );
}

/* ── El selector de días — apartado 5 ────────────────────────────────────── */
function SelectorDia({ fecha, hoy, accent, onCambiar }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={() => onCambiar(addDays(fecha, -1))}
        aria-label="Día anterior"
        className="toque-44 p-1.5 -m-1.5 rounded-xl"
        style={{ color: COLORS.text }}
      >
        <ChevronLeft size={18} />
      </button>
      <div className="text-center min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {etiquetaDeDia(fecha, hoy)}
        </p>
        {fecha !== hoy && (
          <button onClick={() => onCambiar(hoy)} className="text-xs font-semibold toque-44" style={{ color: accent }}>
            Volver a hoy
          </button>
        )}
      </div>
      <button
        onClick={() => onCambiar(addDays(fecha, 1))}
        aria-label="Día siguiente"
        className="toque-44 p-1.5 -m-1.5 rounded-xl"
        style={{ color: COLORS.text }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

/* ── Un momento del día, con sus comidas — apartado 6 ──────────────────────
   🚨 *"Ahora mismo los botones pueden ser visuales/no funcionales si es
   necesario"*, dice el enunciado — pero **el registro de comidas ya funciona**
   desde la Fase 4 del proyecto, así que un botón que no hiciera nada sería un
   control decorativo (regla 8). Cada «Añadir» abre el formulario que ya existe,
   con su escáner de códigos y su foto, y guarda **en ese momento y en ese día**. */
function MomentoDelDia({ mom, comidas, abierto, onAbrir, onCerrar, accent, fecha, onAdd, onAddFavorito, onDeleteComida, indice }) {
  const kcal = comidas.reduce((a, c) => a + (Number(c.calorias) || 0), 0);
  return (
    <div
      className="hub-card rounded-2xl overflow-hidden"
      style={{ animationDelay: `${indice * 60}ms`, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 p-3.5">
        <span className="text-base">{mom.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{mom.nombre}</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {comidas.length ? `${comidas.length} ${comidas.length === 1 ? 'comida' : 'comidas'} · ${kcal} kcal` : VACIO_MOMENTO}
          </p>
        </div>
        <button
          onClick={() => (abierto ? onCerrar() : onAbrir(mom.id))}
          aria-label={`Añadir a ${mom.nombre}`}
          className="toque-44 rounded-xl px-3 py-2 text-xs font-semibold flex-shrink-0 transition-transform active:scale-95"
          style={{ background: abierto ? COLORS.surface2 : hexToRgba(accent, 0.14), color: abierto ? COLORS.textMuted : accent, border: `1px solid ${abierto ? COLORS.border : hexToRgba(accent, 0.3)}` }}
        >
          {abierto ? 'Cerrar' : '+ Añadir'}
        </button>
      </div>

      {comidas.length > 0 && (
        <div className="px-3.5 pb-3 space-y-1.5">
          {comidas.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: COLORS.text }}>{c.nombre}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  {round1(c.proteinas)}g prot. · {round1(c.carbohidratos)}g carb. · {round1(c.grasas)}g grasa
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: COLORS.text }}>{c.calorias} kcal</p>
                <BotonBorrar onClick={() => onDeleteComida(c.id)} label="Eliminar comida" />
              </div>
            </div>
          ))}
        </div>
      )}

      {abierto && (
        <div className="px-3.5 pb-3.5">
          <MealForm onSave={onAdd} onSaveFavorite={onAddFavorito} accent={accent} fecha={fecha} momentoId={mom.id} />
        </div>
      )}
    </div>
  );
}

function ComidasTab({ comidas, onAdd, onAddFavorito, onDeleteComida, accent }) {
  const hoy = todayISO();
  const [fecha, setFecha] = useState(hoy);
  const [momentoAbierto, setMomentoAbierto] = useState(null);

  /* 🚨 Los números salen de las comidas de verdad, del día que se está mirando.
     `objetivos` va en `null` a propósito: son la Fase 3 (ver `NO_EN_NU1`). */
  const resumen = resumenDelDia(comidas, fecha, null);
  const principal = resumen.find((r) => r.principal);
  const macros = resumen.filter((r) => !r.principal);
  const grupos = porMomento(comidas, fecha);
  const hayComidas = hayAlgoRegistrado(comidas, fecha);

  const cambiarDia = (f) => { setFecha(f); setMomentoAbierto(null); };

  return (
    <div className="space-y-4">
      <SelectorDia fecha={fecha} hoy={hoy} accent={accent} onCambiar={cambiarDia} />

      {/* Apartado 4 — las kcal con jerarquía superior, y los tres macros en 2×2
          debajo (apartado 9: móvil primero, sin desplazamiento horizontal). */}
      <div className="space-y-2.5">
        <Indicador dato={principal} accent={accent} principal indice={0} />
        <div className="grid grid-cols-2 gap-2.5">
          {macros.map((m, i) => <Indicador key={m.id} dato={m} accent={accent} indice={i + 1} />)}
        </div>
      </div>

      {/* Apartado 7 — el estado vacío, que no es un mensaje de error. */}
      {!hayComidas && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{VACIO_DIA.titulo}</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{VACIO_DIA.detalle}</p>
          <div style={{ width: 170 }}>
            <PrimaryButton accent={accent} icon={Plus} onClick={() => setMomentoAbierto(MOMENTOS[0].id)}>{VACIO_DIA.accion}</PrimaryButton>
          </div>
        </Card>
      )}

      {/* Apartado 6 — la zona de comidas, con los cinco momentos. */}
      <div className="space-y-2.5">
        {MOMENTOS.map((m, i) => (
          <MomentoDelDia
            key={m.id}
            mom={m}
            comidas={grupos[m.id]}
            abierto={momentoAbierto === m.id}
            onAbrir={setMomentoAbierto}
            onCerrar={() => setMomentoAbierto(null)}
            accent={accent}
            fecha={fecha}
            onAdd={onAdd}
            onAddFavorito={onAddFavorito}
            onDeleteComida={onDeleteComida}
            indice={i}
          />
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
            style={{ background: accent, color: COLORS.textOnAccent }}
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
            <button onClick={() => onRegistrar(f)} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: accent, color: COLORS.textOnAccent }}>
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

export default function NutritionView({ nutricion, onAddComida, onDeleteComida, onAddFavorito, onRegistrarFavorito, onEliminarFavorito, onSetAgua, accent }) {
  const [sub, setSub] = useState('comidas');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Registra para que la IA vea tus hábitos, no para perseguir cifras exactas">Nutrición</SectionTitle>

      <div className="flex gap-2">
        <ToggleTab active={sub === 'comidas'} onClick={() => setSub('comidas')} accent={accent}>Comidas</ToggleTab>
        <ToggleTab active={sub === 'agua'} onClick={() => setSub('agua')} accent={accent}>Agua</ToggleTab>
        <ToggleTab active={sub === 'favoritos'} onClick={() => setSub('favoritos')} accent={accent}>Favoritos</ToggleTab>
      </div>

      {sub === 'comidas' && <ComidasTab comidas={nutricion.comidas} onAdd={onAddComida} onAddFavorito={onAddFavorito} accent={accent} onDeleteComida={onDeleteComida} />}
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
