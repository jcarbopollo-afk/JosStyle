import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { PASOS_ESCALA } from '../lib/colorEngine';
import ColorPicker from './ColorPicker';

// Fase 3 del Sistema de Personalización Visual Extrema — Constructor de temas.
//
// El Principal (acento) ya se edita desde la Card "Color de acento" (Fase 2, ColorPicker.jsx).
// Este constructor cubre el resto de roles de marca/base descritos en el contexto maestro
// (apartado 8): Secundario, Terciario, Fondo, Superficie, Texto, Bordes — y, en una sección
// aparte y con aviso, los 4 Estados (apartado 8 pide que sean personalizables "avanzado", pero
// la Fase 1 los mantiene fijos por defecto por consistencia de UX — ver tokens.js).
//
// Cada rol es un objeto de "overrides" (`temaPersonalizado`, ver DEFAULT_TEMA_PERSONALIZADO en
// tokens.js): `null` = automático (se deriva del Principal por rotación de tono, o del tema
// Claro/Oscuro activo — según el rol); un hex = personalizado a mano. `aplicarTema()` en
// tokens.js ya hace todo el trabajo de calcular el valor efectivo de cada rol y aplicarlo a
// `COLORS` en cada render — este componente NUNCA calcula colores por su cuenta, solo lee
// `COLORS.<campo>` para el swatch (que ya refleja el valor efectivo, automático o personalizado)
// y escribe en `temaPersonalizado` a través de las mismas funciones preview/commit que ya
// introdujo el ColorPicker en la Fase 2: `onPreviewTemaPersonalizado` solo cambia estado de React
// (retematiza al instante mientras se arrastra el selector, sin tocar Supabase);
// `onUpdateTemaPersonalizado` es el guardado real, solo al confirmar.
//
// La red de seguridad de contraste (Texto/TextoMuted vs. Fondo efectivo) vive enteramente en
// `aplicarTema()`, no aquí — así que ninguna combinación elegida en este constructor puede dejar
// la app realmente ilegible, sin que este componente tenga que pensar en contraste él mismo.

const FILAS_PRINCIPALES = [
  { key: 'secundario', label: 'Secundario', desc: 'Automático: rotación de tono +35° desde el Principal.' },
  { key: 'terciario', label: 'Terciario', desc: 'Automático: rotación de tono −35° desde el Principal.' },
  { key: 'fondo', label: 'Fondo', desc: 'Automático: el fondo del tema Claro/Oscuro activo.' },
  { key: 'superficie', label: 'Superficie', desc: 'Automático: la superficie del tema Claro/Oscuro activo.' },
  { key: 'texto', label: 'Texto', desc: 'Automático: el texto principal del tema activo (con contraste garantizado).' },
  { key: 'bordes', label: 'Bordes', desc: 'Automático: el borde del tema activo.' },
  // FO Fase 7 — estos cuatro ya existían en el modelo desde FO F4, pero no tenían
  // control: se podían guardar y no había forma de tocarlos. Los apartados 6 y 13
  // los piden expresamente (control individual, y personalizar la navegación).
  { key: 'textoSecundario', label: 'Texto secundario', desc: 'Automático: el texto atenuado del tema (con contraste garantizado).' },
  { key: 'iconoActivo', label: 'Icono activo', desc: 'Automático: el color Principal.' },
  { key: 'iconoInactivo', label: 'Icono inactivo', desc: 'Automático: el texto secundario.' },
  { key: 'navegacionFondo', label: 'Barra inferior', desc: 'Automático: la superficie del tema activo.' },
];

const FILAS_ESTADOS = [
  { key: 'positive', label: 'Éxito' },
  { key: 'warning', label: 'Aviso' },
  { key: 'negative', label: 'Error' },
  { key: 'info', label: 'Información' },
];

// Cada rol "principal" de este constructor lee su valor efectivo actual de un campo distinto en
// COLORS (los Estados, en cambio, comparten el mismo nombre en ambos objetos: positive/warning/
// negative/info).
const CAMPO_COLORS = {
  secundario: 'secondary', terciario: 'tertiary', fondo: 'bg', superficie: 'surface', texto: 'text', bordes: 'border',
  textoSecundario: 'textMuted', iconoActivo: 'iconActive', iconoInactivo: 'iconMuted', navegacionFondo: 'navBg',
};

export default function TemaBuilder({
  accent, temaPersonalizado, onPreviewTemaPersonalizado, onUpdateTemaPersonalizado, onClose,
  historialColor, onRegistrarColorReciente, onToggleFavoritoColor,
}) {
  const [filaEditando, setFilaEditando] = useState(null); // { tipo: 'principal' | 'estado', key }
  const [estadosAbiertos, setEstadosAbiertos] = useState(false);

  const valorActualDe = (tipo, key) => (tipo === 'estado' ? COLORS[key] : COLORS[CAMPO_COLORS[key]]);
  const tpValorDe = (tipo, key) => (tipo === 'estado' ? temaPersonalizado.estados[key] : temaPersonalizado[key]);

  const previsualizar = (tipo, key, hex) => {
    onPreviewTemaPersonalizado(
      tipo === 'estado'
        ? { ...temaPersonalizado, estados: { ...temaPersonalizado.estados, [key]: hex } }
        : { ...temaPersonalizado, [key]: hex }
    );
  };
  const confirmar = (tipo, key, hex) => {
    onUpdateTemaPersonalizado(
      tipo === 'estado'
        ? { ...temaPersonalizado, estados: { ...temaPersonalizado.estados, [key]: hex } }
        : { ...temaPersonalizado, [key]: hex }
    );
  };
  const restablecer = (tipo, key) => confirmar(tipo, key, null);

  const Fila = ({ tipo, campo }) => {
    const valorActual = valorActualDe(tipo, campo.key);
    const esPersonalizado = tpValorDe(tipo, campo.key) != null;
    return (
      <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <button
          onClick={() => setFilaEditando({ tipo, key: campo.key })}
          className="w-9 h-9 rounded-full flex-shrink-0"
          style={{ background: valorActual, boxShadow: `0 0 0 1px ${COLORS.border}` }}
          aria-label={`Editar ${campo.label}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{campo.label}</p>
          {campo.desc && !esPersonalizado && (
            <p className="text-[11px] leading-snug" style={{ color: COLORS.textMuted }}>{campo.desc}</p>
          )}
        </div>
        {esPersonalizado ? (
          <button
            onClick={() => restablecer(tipo, campo.key)}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0"
            style={{ color: COLORS.textMuted, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
          >
            Automático
          </button>
        ) : (
          <span
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0"
            style={{ color: accent, background: hexToRgba(accent, 0.14) }}
          >
            Auto
          </span>
        )}
      </div>
    );
  };

  const escalasPreview = [
    { label: 'Principal', escala: COLORS.accentScale },
    { label: 'Secundario', escala: COLORS.secondaryScale },
    { label: 'Terciario', escala: COLORS.tertiaryScale },
  ].filter((e) => e.escala);

  // Optimización de navegación/scroll — mismo motivo que ColorPicker.jsx: sin `createPortal`, este
  // panel quedaba "fixed" respecto al contenedor `.module-enter` (que tiene un `transform` activo
  // permanente por su animación de entrada) en vez del viewport real, apareciendo muy por debajo
  // de "Constructor de temas" en vez de superpuesto de inmediato.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto"
        style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, paddingBottom: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Constructor de temas</p>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
          El Principal se edita en "Color de acento", arriba. Aquí controlas el resto de la paleta: cada rol es
          automático (se deriva del Principal o del tema Claro/Oscuro) hasta que lo personalizas a mano.
        </p>

        {escalasPreview.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>Escalas generadas</p>
            {escalasPreview.map(({ label, escala }) => (
              <div key={label} className="flex items-center gap-2 mb-1.5">
                <p className="text-[10px] w-16 flex-shrink-0" style={{ color: COLORS.textMuted }}>{label}</p>
                <div className="flex-1 flex rounded-lg overflow-hidden" style={{ height: 18 }}>
                  {PASOS_ESCALA.map((paso) => (
                    <div key={paso} className="flex-1" style={{ background: escala[paso] }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {FILAS_PRINCIPALES.map((campo) => <Fila key={campo.key} tipo="principal" campo={campo} />)}

        {/* Estados avanzados — tucked away y con aviso: apartado 8 del contexto maestro pide que
            sean personalizables, pero la Fase 1 los dejó fijos por consistencia de UX (un error
            que cambiara de color con la personalización sería una regresión). Esta sección
            resuelve ambas cosas: existe y funciona, pero no está a la vista por defecto. */}
        <button onClick={() => setEstadosAbiertos((v) => !v)} className="w-full flex items-center justify-between py-3 mt-1">
          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Estados avanzados</span>
          {estadosAbiertos ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
        </button>
        {estadosAbiertos && (
          <>
            <div
              className="flex items-start gap-2 mb-2 p-2.5 rounded-xl"
              style={{ background: hexToRgba(COLORS.warning, 0.12), border: `1px solid ${hexToRgba(COLORS.warning, 0.3)}` }}
            >
              <AlertTriangle size={14} style={{ color: COLORS.warning, marginTop: 1, flexShrink: 0 }} />
              <p className="text-[11px] leading-snug" style={{ color: COLORS.textMuted }}>
                Éxito/Aviso/Error/Información se mantienen fijos en el resto de la app a propósito, para que un error
                siempre se reconozca igual. Personalizarlos aquí es posible, pero puede hacer más difícil distinguir
                los estados a simple vista.
              </p>
            </div>
            {FILAS_ESTADOS.map((campo) => <Fila key={campo.key} tipo="estado" campo={campo} />)}
          </>
        )}

        {filaEditando && (
          <ColorPicker
            initialHex={valorActualDe(filaEditando.tipo, filaEditando.key)}
            accent={accent}
            onPreview={(hex) => previsualizar(filaEditando.tipo, filaEditando.key, hex)}
            onCommit={(hex) => { confirmar(filaEditando.tipo, filaEditando.key, hex); onRegistrarColorReciente(hex); }}
            onClose={() => setFilaEditando(null)}
            recientes={historialColor.recientes}
            favoritos={historialColor.favoritos}
            onToggleFavorito={onToggleFavoritoColor}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
