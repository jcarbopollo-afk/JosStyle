import React, { useState } from 'react';
import { Sparkles, Loader2, ShieldCheck, Lock, Paperclip, X, FileText, Image as ImageIcon, Lightbulb, Search } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, shade, fileToBase64 } from '../lib/helpers';
import { askAI, askAIWithImage, AI_SYSTEM } from '../lib/ai';
import { extractPdfText } from '../lib/pdfText';

export function Card({ children, style, className = '' }) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, ...style }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div className="mb-1">
      <h2 className="text-lg font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{children}</h2>
      {sub && <p className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>{sub}</p>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs mb-1.5 font-medium" style={{ color: COLORS.textMuted }}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props) {
  const { style, className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none ${className || ''}`}
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text, ...style }}
    />
  );
}

// Fase 10 — Diario: primera vez que se necesita texto libre de varias líneas (hasta ahora
// TextInput cubría inputs de una sola línea). Mismo estilo visual que TextInput para que no
// desentone, solo cambia la etiqueta y que crece en altura en vez de desbordar.
export function Textarea(props) {
  const { style, className, rows = 3, ...rest } = props;
  return (
    <textarea
      {...rest}
      rows={rows}
      className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${className || ''}`}
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontFamily: 'inherit', ...style }}
    />
  );
}

export function Select({ children, ...rest }) {
  return (
    <select
      {...rest}
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
    >
      {children}
    </select>
  );
}

export function PrimaryButton({ children, onClick, accent, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-60 w-full"
      style={{ background: accent, color: COLORS.textOnAccent }}
    >
      {Icon && <Icon size={16} strokeWidth={2.5} />}
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold"
      style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export function ToggleTab({ children, active, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold"
      style={active
        ? { background: accent, color: COLORS.textOnAccent }
        : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
    >
      {children}
    </button>
  );
}

export function EmptyHint({ text }) {
  return (
    <div className="text-center py-6 rounded-2xl" style={{ border: `1px dashed ${COLORS.border}` }}>
      <p className="text-sm" style={{ color: COLORS.textMuted }}>{text}</p>
    </div>
  );
}

export function PinSetter({ pin, onSetPin, accent }) {
  const [value, setValue] = useState('');
  return (
    <div>
      <div className="flex items-center gap-2">
        <TextInput
          type="password" inputMode="numeric" maxLength={6}
          placeholder={pin ? 'PIN actual: ••••' : 'Nuevo PIN (4-6 dígitos)'}
          value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
        />
        <div style={{ width: 92, flexShrink: 0 }}>
          <PrimaryButton accent={accent} disabled={value.length < 4} onClick={() => { onSetPin(value); setValue(''); }}>
            {pin ? 'Cambiar' : 'Crear'}
          </PrimaryButton>
        </div>
      </div>
      {pin && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: COLORS.positive }}><ShieldCheck size={12} /> PIN activo</p>}
    </div>
  );
}

// Envuelve contenido privado y pide el PIN ya configurado en Ajustes antes de mostrarlo.
// Si el usuario todavía no ha creado un PIN, lo avisa en vez de bloquear con un PIN vacío.
export function PinGate({ pin, accent, children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (unlocked) return children;

  if (!pin) {
    return (
      <div className="text-center py-8 rounded-2xl" style={{ border: `1px dashed ${COLORS.border}` }}>
        <Lock size={20} style={{ color: COLORS.textMuted, margin: '0 auto 8px' }} />
        <p className="text-sm px-6" style={{ color: COLORS.textMuted }}>
          Todavía no has creado un PIN. Ve a Ajustes → "PIN de secciones privadas" para proteger esta sección.
        </p>
      </div>
    );
  }

  const tryUnlock = () => {
    if (value === pin) { setUnlocked(true); setError(''); }
    else { setError('PIN incorrecto'); setValue(''); }
  };

  return (
    <div className="text-center py-8 rounded-2xl" style={{ border: `1px dashed ${COLORS.border}` }}>
      <Lock size={20} style={{ color: accent, margin: '0 auto 10px' }} />
      <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>Sección protegida por PIN</p>
      <div className="flex items-center gap-2 justify-center px-6">
        <TextInput
          type="password" inputMode="numeric" maxLength={6} placeholder="PIN"
          value={value} onChange={(e) => { setValue(e.target.value.replace(/\D/g, '')); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
          style={{ textAlign: 'center', maxWidth: 120 }}
        />
        <div style={{ width: 84 }}>
          <PrimaryButton accent={accent} disabled={value.length < 4} onClick={tryUnlock}>Entrar</PrimaryButton>
        </div>
      </div>
      {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
    </div>
  );
}

// Fase 18 — IA con memoria a fondo: AIPanel gana multimodalidad (foto, captura o PDF adjunto a
// la pregunta) sin tocar ninguna de las vistas que ya lo usan — buildPrompt(label, accent) sigue
// teniendo la misma firma de siempre, el adjunto es un añadido interno y opcional. Una imagen usa
// askAIWithImage (mismo mecanismo que el escaneo de comida de Nutrición); un PDF extrae su texto
// en el navegador con extractPdfText (mismo lector que Biblioteca) y se añade como contexto extra
// al prompt de texto normal — no hace falta mandar el PDF entero a la IA.
export function AIPanel({ label, accent, buildPrompt }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [adjunto, setAdjunto] = useState(null); // { tipo: 'imagen' | 'pdf', file, nombre }

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type === 'application/pdf') setAdjunto({ tipo: 'pdf', file, nombre: file.name });
    else if (file.type.startsWith('image/')) setAdjunto({ tipo: 'imagen', file, nombre: file.name });
  };

  const handleAsk = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const promptBase = buildPrompt();
      let text;
      if (adjunto?.tipo === 'imagen') {
        const base64 = await fileToBase64(adjunto.file);
        text = await askAIWithImage(AI_SYSTEM, promptBase, base64, adjunto.file.type || 'image/jpeg');
      } else if (adjunto?.tipo === 'pdf') {
        const texto = await extractPdfText(adjunto.file);
        const promptConPdf = texto
          ? `${promptBase}\n\nTexto extraído del PDF adjunto ("${adjunto.nombre}"):\n${texto.slice(0, 6000)}`
          : `${promptBase}\n\n(Se adjuntó el PDF "${adjunto.nombre}" pero no tiene texto extraíble, probablemente un escaneo — ignóralo si no aporta nada.)`;
        text = await askAI(AI_SYSTEM, promptConPdf);
      } else {
        text = await askAI(AI_SYSTEM, promptBase);
      }
      setResponse(text || 'No he podido generar una respuesta con estos datos todavía.');
    } catch (e) {
      setErrorMsg(e.message || 'No he podido conectar con la IA ahora mismo.');
    } finally {
      setLoading(false);
      setAdjunto(null);
    }
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
      <div className="flex items-center justify-between gap-2">
        <button onClick={handleAsk} disabled={loading} className="flex items-center gap-2 text-sm font-semibold disabled:opacity-70" style={{ color: accent }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'Pensando…' : label}
        </button>
        <label className="flex items-center gap-1 text-xs cursor-pointer flex-shrink-0" style={{ color: COLORS.textMuted }} title="Adjuntar foto, captura o PDF">
          <Paperclip size={13} />
          <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {adjunto && (
        <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.textMuted }}>
          {adjunto.tipo === 'imagen' ? <ImageIcon size={12} /> : <FileText size={12} />}
          <span className="truncate flex-1">{adjunto.nombre}</span>
          <button onClick={() => setAdjunto(null)} aria-label="Quitar adjunto"><X size={12} /></button>
        </div>
      )}
      {errorMsg && <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{errorMsg}</p>}
      {response && !errorMsg && <p className="text-sm mt-2 leading-relaxed" style={{ color: COLORS.text }}>{response}</p>}
    </div>
  );
}

// Fase 18 — panel de sugerencias fijo arriba a la izquierda. Nunca se dispara solo (mismo
// criterio que el resto de la IA en toda la app): el icono solo abre/cierra el panel, y dentro
// hace falta un toque explícito en "Generar sugerencias" para llamar a la IA la primera vez.
export function SuggestionsButton({ accent, buildPrompt }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [asked, setAsked] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const text = await askAI(AI_SYSTEM, buildPrompt());
      setResponse(text || 'No tengo suficientes datos todavía para sugerir algo concreto.');
      setAsked(true);
    } catch (e) {
      setErrorMsg(e.message || 'No he podido conectar con la IA ahora mismo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed z-30" style={{ top: 14, left: 14 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: hexToRgba(accent, 0.15), border: `1px solid ${hexToRgba(accent, 0.3)}`, backdropFilter: 'blur(8px)' }}
        aria-label="Sugerencias de la IA"
      >
        <Lightbulb size={16} style={{ color: accent }} />
      </button>
      {open && (
        <div
          className="mt-2 rounded-2xl p-3"
          style={{ width: 252, background: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: '0 12px 28px rgba(0,0,0,0.45)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Sugerencias</p>
            <button onClick={() => setOpen(false)} aria-label="Cerrar sugerencias"><X size={12} style={{ color: COLORS.textMuted }} /></button>
          </div>
          {!asked && !loading && (
            <button onClick={handleAsk} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: accent }}>
              <Sparkles size={13} /> Generar sugerencias
            </button>
          )}
          {loading && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
              <Loader2 size={12} className="animate-spin" /> Pensando…
            </p>
          )}
          {errorMsg && <p className="text-xs" style={{ color: COLORS.textMuted }}>{errorMsg}</p>}
          {response && !errorMsg && (
            <>
              <p className="text-xs leading-relaxed" style={{ color: COLORS.text }}>{response}</p>
              <button onClick={handleAsk} disabled={loading} className="text-xs font-semibold mt-2" style={{ color: accent }}>Actualizar</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Fase 18 — buscador universal en lenguaje natural. Se abre a mano desde el icono fijo de
// App.jsx, nunca automático. La IA responde solo con lo que encuentre en el contexto de datos
// que se le pasa (buildContext) y dice abiertamente si no puede responder algo, mismo criterio
// honesto que Estadísticas y Predicciones.
export function UniversalSearchModal({ accent, onClose, buildContext }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setResponse('');
    try {
      const contexto = buildContext();
      const prompt =
        `Josué pregunta en lenguaje natural sobre sus propios datos guardados en la app: "${query}". ` +
        `Datos disponibles de todos sus módulos (JSON, puede venir recortado a lo más reciente): ${JSON.stringify(contexto)}. ` +
        `Responde solo con lo que puedas encontrar o calcular a partir de esos datos; si la pregunta no se puede responder con ellos, dilo abiertamente en vez de inventar.`;
      const text = await askAI(AI_SYSTEM, prompt);
      setResponse(text || 'No he encontrado nada relevante para eso en tus datos.');
    } catch (e) {
      setErrorMsg(e.message || 'No he podido conectar con la IA ahora mismo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl p-4"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.text }}>
            <Search size={15} /> Buscar en tus datos
          </p>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar buscador">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <TextInput
            placeholder="Ej: ¿cuántas horas dormí de media esta semana?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-60"
            style={{ width: 44, height: 42, background: accent }}
            aria-label="Buscar"
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ color: COLORS.textOnAccent }} /> : <Search size={16} style={{ color: COLORS.textOnAccent }} />}
          </button>
        </div>
        {errorMsg && <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>{errorMsg}</p>}
        {response && !errorMsg && <p className="text-sm mt-3 leading-relaxed" style={{ color: COLORS.text }}>{response}</p>}
        {!response && !errorMsg && !loading && (
          <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>
            Pregunta lo que sea sobre datos ya guardados — sueño, entreno, economía, estudios, hábitos, objetivos, diario, y el resto de módulos.
          </p>
        )}
      </div>
    </div>
  );
}

export function ScoreGauge({ value, accent, size = 118 }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shade(accent, 55)} />
          <stop offset="55%" stopColor={accent} />
          <stop offset="100%" stopColor={shade(accent, -45)} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.surface2} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="url(#gaugeGrad)" strokeWidth={stroke} strokeLinecap="round" fill="none"
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}
