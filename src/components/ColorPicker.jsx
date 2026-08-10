import React, { useState, useRef, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  hexToHsv, hsvToHex, hexToRgb, rgbToHex, hexToHsl, hslToHex, isValidHex, normalizeHex,
} from '../lib/colorEngine';

// Fase 2 del Sistema de Personalización Visual Extrema — Editor de color avanzado.
//
// Selector visual completo, construido sobre el motor de la Fase 1 (`colorEngine.js`), sin
// ninguna librería externa (este entorno no tiene acceso al registro de npm). Cubre el apartado 7
// de la especificación: espectro 2D (saturación × brillo, en HSV — más intuitivo que HSL para
// esto, ver nota en colorEngine.js), slider de tono, campos HEX/RGB/HSL editables a mano, color
// actual vs. anterior, recientes/favoritos, copiar/pegar, y cuentagotas si el navegador lo soporta
// (EyeDropper API — no disponible en Safari/iOS a día de hoy, así que el botón se oculta solo ahí
// en vez de mostrar algo que no va a funcionar en el propio móvil de Josué).
//
// Vista previa en tiempo real vs. guardado: `onPreview(hex)` se llama en CADA paso de una
// interacción continua (arrastrar el cuadrado o el slider, teclear un dígito) — solo cambia el
// estado de React (`accent`) y retematiza toda la app al instante, sin tocar Supabase. `onCommit
// (hex)` se llama solo en los puntos "de verdad" (soltar el arrastre, salir de un campo, tocar un
// recientes/favorito, cerrar el editor) — ahí es donde el padre guarda de verdad y registra el
// color en el historial. Sin esta separación, arrastrar el dedo por el cuadrado dispararía decenas
// de escrituras a Supabase por segundo.
export default function ColorPicker({
  initialHex, accent, onPreview, onCommit, onClose,
  recientes = [], favoritos = [], onToggleFavorito,
}) {
  const [hex, setHex] = useState(initialHex);
  const [hexInput, setHexInput] = useState(initialHex);
  const anteriorRef = useRef(initialHex);
  const squareRef = useRef(null);
  const hueRef = useRef(null);
  const arrastrandoSquare = useRef(false);
  const arrastrandoHue = useRef(false);
  const [pegarError, setPegarError] = useState('');

  const { h, s, v } = hexToHsv(hex);
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);
  const esFavorito = favoritos.includes(hex);
  const eyedropperSoportado = typeof window !== 'undefined' && 'EyeDropper' in window;

  const previsualizar = (nuevoHex) => {
    setHex(nuevoHex);
    setHexInput(nuevoHex);
    onPreview(nuevoHex);
  };
  const confirmar = (nuevoHex) => {
    previsualizar(nuevoHex);
    onCommit(nuevoHex);
  };

  const desdeSquare = (clientX, clientY) => {
    if (!squareRef.current) return;
    const rect = squareRef.current.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, clientX - rect.left));
    const y = Math.min(rect.height, Math.max(0, clientY - rect.top));
    previsualizar(hsvToHex({ h, s: (x / rect.width) * 100, v: 100 - (y / rect.height) * 100 }));
  };
  const desdeHue = (clientX) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, clientX - rect.left));
    previsualizar(hsvToHex({ h: (x / rect.width) * 360, s, v }));
  };

  useEffect(() => {
    const posDe = (e) => (e.touches ? e.touches[0] : e);
    const onMove = (e) => {
      if (!arrastrandoSquare.current && !arrastrandoHue.current) return;
      if (e.cancelable) e.preventDefault();
      const p = posDe(e);
      if (arrastrandoSquare.current) desdeSquare(p.clientX, p.clientY);
      if (arrastrandoHue.current) desdeHue(p.clientX);
    };
    const onUp = () => {
      if (arrastrandoSquare.current || arrastrandoHue.current) onCommit(hex);
      arrastrandoSquare.current = false;
      arrastrandoHue.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [h, s, v, hex]);

  const commitHexInput = () => {
    if (isValidHex(hexInput)) confirmar(normalizeHex(hexInput));
    else setHexInput(hex);
  };

  const cambiarCanalRgb = (canal, valor) => {
    const n = Math.min(255, Math.max(0, Number(valor) || 0));
    previsualizar(rgbToHex({ ...rgb, [canal]: n }));
  };
  const cambiarCanalHsl = (canal, valor, max) => {
    const n = Math.min(max, Math.max(0, Number(valor) || 0));
    previsualizar(hslToHex({ ...hsl, [canal]: n }));
  };

  const copiar = async () => {
    try { await navigator.clipboard.writeText(hex); } catch { /* sin permiso — silencioso */ }
  };
  const pegar = async () => {
    setPegarError('');
    try {
      const texto = await navigator.clipboard.readText();
      if (isValidHex(texto.trim())) confirmar(normalizeHex(texto.trim()));
      else setPegarError('El portapapeles no tiene un color HEX válido.');
    } catch {
      setPegarError('No se pudo leer el portapapeles.');
    }
  };
  const usarCuentagotas = async () => {
    try {
      const ed = new window.EyeDropper();
      const resultado = await ed.open();
      if (resultado?.sRGBHex) confirmar(normalizeHex(resultado.sRGBHex));
    } catch { /* el usuario canceló — nada que hacer */ }
  };

  const CampoNumero = ({ label, value, onChange, max }) => (
    <label className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-center mb-1" style={{ color: COLORS.textMuted }}>{label}</p>
      <input
        type="number" min={0} max={max} value={Math.round(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-center text-sm font-semibold rounded-lg py-1.5"
        style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto"
        style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, paddingBottom: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Editor de color</p>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>

        {/* Espectro 2D: eje X = saturación, eje Y = brillo (HSV), tono fijado por el slider de abajo. */}
        <div
          ref={squareRef}
          className="relative w-full rounded-2xl mb-3 select-none touch-none"
          style={{
            height: 180,
            background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl(${h}, 100%, 50%)`,
          }}
          onMouseDown={(e) => { arrastrandoSquare.current = true; desdeSquare(e.clientX, e.clientY); }}
          onTouchStart={(e) => { arrastrandoSquare.current = true; const t = e.touches[0]; desdeSquare(t.clientX, t.clientY); }}
        >
          <div
            className="absolute w-5 h-5 rounded-full pointer-events-none"
            style={{
              left: `calc(${s}% - 10px)`, top: `calc(${100 - v}% - 10px)`,
              background: hex, border: '2.5px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        {/* Slider de tono (0-360°). */}
        <div
          ref={hueRef}
          className="relative w-full rounded-full mb-4 select-none touch-none"
          style={{
            height: 16,
            background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
          }}
          onMouseDown={(e) => { arrastrandoHue.current = true; desdeHue(e.clientX); }}
          onTouchStart={(e) => { arrastrandoHue.current = true; desdeHue(e.touches[0].clientX); }}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `calc(${(h / 360) * 100}% - 10px)`, top: -2, width: 20, height: 20,
              background: `hsl(${h},100%,50%)`, border: '2.5px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        {/* Color actual vs. anterior + favorito. */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex rounded-xl overflow-hidden" style={{ height: 40, border: `1px solid ${COLORS.border}` }}>
            <button onClick={() => confirmar(anteriorRef.current)} className="flex-1" style={{ background: anteriorRef.current }} aria-label="Volver al color anterior" />
            <div className="flex-1" style={{ background: hex }} />
          </div>
          <p className="text-[10px] text-center" style={{ color: COLORS.textMuted, width: 70 }}>Anterior · Actual</p>
          <button
            onClick={() => onToggleFavorito(hex)}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: esFavorito ? hexToRgba(accent, 0.16) : COLORS.surface2, border: `1px solid ${esFavorito ? accent : COLORS.border}` }}
            aria-label={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Star size={16} style={{ color: esFavorito ? accent : COLORS.textMuted }} fill={esFavorito ? accent : 'none'} />
          </button>
        </div>

        {/* HEX + copiar/pegar/cuentagotas. */}
        <div className="flex items-center gap-2 mb-3">
          <input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={commitHexInput}
            onKeyDown={(e) => e.key === 'Enter' && commitHexInput()}
            className="flex-1 min-w-0 text-sm font-semibold rounded-lg px-3 py-2"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            placeholder="#RRGGBB"
          />
          <button onClick={copiar} className="text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0" style={{ background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>Copiar</button>
          <button onClick={pegar} className="text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0" style={{ background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>Pegar</button>
          {eyedropperSoportado && (
            <button onClick={usarCuentagotas} className="text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0" style={{ background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>Cuentagotas</button>
          )}
        </div>
        {pegarError && <p className="text-xs mb-3" style={{ color: COLORS.negative }}>{pegarError}</p>}

        {/* RGB. */}
        <div className="flex gap-2 mb-3">
          <CampoNumero label="R" value={rgb.r} max={255} onChange={(v2) => cambiarCanalRgb('r', v2)} />
          <CampoNumero label="G" value={rgb.g} max={255} onChange={(v2) => cambiarCanalRgb('g', v2)} />
          <CampoNumero label="B" value={rgb.b} max={255} onChange={(v2) => cambiarCanalRgb('b', v2)} />
        </div>
        {/* HSL. */}
        <div className="flex gap-2 mb-4">
          <CampoNumero label="H°" value={hsl.h} max={360} onChange={(v2) => cambiarCanalHsl('h', v2, 360)} />
          <CampoNumero label="S%" value={hsl.s} max={100} onChange={(v2) => cambiarCanalHsl('s', v2, 100)} />
          <CampoNumero label="L%" value={hsl.l} max={100} onChange={(v2) => cambiarCanalHsl('l', v2, 100)} />
        </div>

        {/* Recientes. */}
        {recientes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>Recientes</p>
            <div className="flex flex-wrap gap-2">
              {recientes.map((c) => (
                <button
                  key={c} onClick={() => confirmar(c)} aria-label={c}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ background: c, boxShadow: hex === c ? `0 0 0 2px ${COLORS.surface}, 0 0 0 4px ${c}` : `0 0 0 1px ${COLORS.border}` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Favoritos. */}
        {favoritos.length > 0 && (
          <div className="mb-1">
            <p className="text-xs font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>Favoritos</p>
            <div className="flex flex-wrap gap-2">
              {favoritos.map((c) => (
                <button
                  key={c} onClick={() => confirmar(c)} aria-label={c}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ background: c, boxShadow: hex === c ? `0 0 0 2px ${COLORS.surface}, 0 0 0 4px ${c}` : `0 0 0 1px ${COLORS.border}` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
