import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, ShieldCheck, Lock, Paperclip, X, FileText, Image as ImageIcon, Lightbulb, Search, Mail, Plus, Trash2, ChevronRight, CornerDownLeft } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, shade, fileToBase64 } from '../lib/helpers';
import { buscar, pareceUnaPregunta } from '../lib/indiceBusqueda';
import { askAI, askAIWithImage, AI_SYSTEM } from '../lib/ai';
import { extractPdfText } from '../lib/pdfText';
import { verificarPin } from '../lib/pin';

export function Card({ children, style, className = '', id }) {
  return (
    <div
      id={id}
      className={`rounded-3xl p-5 ${className}`}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, ...style }}
    >
      {children}
    </div>
  );
}

// Ampliación del Dashboard — Centro de Control: tarjeta reutilizable para cualquier módulo del
// nuevo "Hoy" interactivo — icono + título arriba, valor destacado + línea secundaria debajo,
// toda la tarjeta es un único `<button>` (apartado 3: "siempre que una tarjeta represente una
// funcionalidad existente, debe poder pulsarse", apartado 14: "pulsación normal → abrir módulo").
// `vacio` cambia el cuerpo por el texto de invitación del estado vacío (apartado 12) sin dejar de
// ser pulsable — nunca una tarjeta "rota" sin nada que hacer. Sin botón de acción propio a
// propósito (apartado 13/14: la fila de "Acciones rápidas" del Dashboard cubre eso aparte, para no
// mezclar dos comportamientos distintos en el mismo elemento).
export function DashboardModuleCard({ icon: Icon, titulo, valor, sub, vacio = false, accent, onClick, style, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl transition-transform active:scale-[0.96] ${className}`}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '0.9rem 1rem', ...style }}
    >
      <p className="text-xs font-semibold flex items-center gap-1.5 mb-1.5 min-w-0" style={{ color: COLORS.textMuted }}>
        {Icon && <Icon size={13} style={{ color: accent, flexShrink: 0 }} />}
        <span className="truncate">{titulo}</span>
      </p>
      {vacio ? (
        <p className="text-sm leading-snug" style={{ color: COLORS.textMuted }}>{sub}</p>
      ) : (
        <>
          <p className="text-base font-bold leading-snug truncate" style={{ color: COLORS.text }}>{valor}</p>
          {sub && <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>{sub}</p>}
        </>
      )}
    </button>
  );
}

// Ampliación del Dashboard — mini-acceso compacto para los módulos de Nivel 3 (Diario, Negocio,
// Relación, Biblioteca, Fe, Bienestar): solo icono + etiqueta, sin resumen de datos — deliberado,
// para que la fila quepa en un móvil pequeño sin desbordar ni necesitar scroll horizontal, y para
// no mostrar de refilón nada de Relación (protegida por PIN) fuera de su propia pantalla.
export function MiniAccessCard({ icon: Icon, label, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-1 transition-transform active:scale-95 w-full"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      {Icon && <Icon size={17} style={{ color: accent }} />}
      <span className="text-[11px] font-medium truncate w-full text-center leading-none" style={{ color: COLORS.textMuted }}>{label}</span>
    </button>
  );
}

// Ampliación del Dashboard — botón de la fila "Acciones rápidas" (apartado 13/14): distinto a
// propósito de `DashboardModuleCard` (icono "+" en un círculo en vez de una tarjeta rectangular)
// para que se note de un vistazo que esto ABRE UN FORMULARIO, no navega a mirar un resumen.
export function QuickActionButton({ icon: Icon, label, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full pl-2.5 pr-3.5 py-2 flex-shrink-0 transition-transform active:scale-95"
      style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${hexToRgba(accent, 0.3)}` }}
    >
      <span className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: accent, color: COLORS.textOnAccent }}>
        {Icon ? <Icon size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
      </span>
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: accent }}>{label}</span>
    </button>
  );
}

// Optimización de navegación/scroll — sustituye al patrón repetido de "una Card suelta por cada
// fila de una lista" (registros de sueño, movimientos de economía, partidos, PRs...): antes cada
// fila pagaba su propio borde+esquinas+`space-y-2` entre ellas, sumando bastante alto en vertical
// cuando había varias; `ListCard` es una única tarjeta con las filas separadas por un borde fino
// interior — mismo contenido, mismo orden, la mitad (o menos) del espacio vertical. No es un
// componente nuevo de verdad: por dentro sigue siendo `Card`, solo cambia cómo se agrupan las
// filas — nada de esto quita información, solo la compacta (spec: "no eliminar funcionalidades").
export function ListCard({ children, style, className = '' }) {
  return (
    <Card className={`p-0 overflow-hidden ${className}`} style={style}>
      {children}
    </Card>
  );
}

// Entrega 2 · ME Fase 4 — botón de borrar reutilizable.
//
// La auditoría de esta fase encontró que varios módulos dejaban CREAR pero no BORRAR (Sueño,
// Economía, Salud, Nutrición, partidos de fútbol y horas de estudio). Al añadirles el borrado
// hacía falta un control común: el apartado 14 de la especificación de Ajustes exige que una
// misma acción se represente siempre igual, y "eliminar un elemento de una lista" aparece ya en
// media docena de pantallas.
//
// No pide confirmación a propósito: desde ME Fase 3 lo borrado va a la papelera y se puede
// recuperar, así que una confirmación aquí sería fricción para algo reversible. La confirmación
// se reserva para el borrado definitivo, que sí es irreversible.
export function BotonBorrar({ onClick, label = 'Eliminar' }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg flex-shrink-0 transition-transform active:scale-90"
      style={{ background: COLORS.surface2 }}
      aria-label={label}
      title={label}
    >
      <Trash2 size={13} style={{ color: COLORS.textMuted }} />
    </button>
  );
}

export function ListRow({ children, onClick, style, className = '', last = false }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left ${className}`}
      style={{ borderBottom: last ? 'none' : `1px solid ${COLORS.border}`, ...style }}
    >
      {children}
    </Tag>
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

// `forwardRef` desde BI Fase 2: el buscador necesita enfocar el campo al abrirse (apartado 3),
// y un componente de función normal se traga la `ref` en silencio — el foco simplemente no
// ocurriría, sin error ni aviso. Es aditivo: ningún uso anterior pasa `ref`, así que nada cambia
// para los ~60 TextInput que ya había.
export const TextInput = React.forwardRef(function TextInput(props, ref) {
  const { style, className, ...rest } = props;
  return (
    <input
      {...rest}
      ref={ref}
      className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none ${className || ''}`}
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text, ...style }}
    />
  );
});

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

// Interruptor ON/OFF. El apartado 8 de la especificación de Ajustes lista el Switch como uno de
// los componentes permitidos, y el apartado 14 exige que un mismo tipo de configuración se
// represente siempre igual en toda la app — hasta ahora cada sitio resolvía el "activado/
// desactivado" a su manera (iconos de ojo, píldoras, casillas), justo lo que esa regla prohíbe.
//
// Accesible por teclado y para lectores de pantalla: es un <button> real con role="switch" y
// aria-checked, no un div con onClick.
export function Switch({ checked, onChange, accent, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative flex-shrink-0 rounded-full disabled:opacity-40"
      style={{
        width: 44, height: 26,
        background: checked ? accent : COLORS.surface2,
        border: `1px solid ${checked ? accent : COLORS.border}`,
        transition: 'background 200ms var(--ease-premium), border-color 200ms var(--ease-premium)',
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: 18, height: 18, top: 3,
          left: checked ? 22 : 3,
          background: checked ? COLORS.textOnAccent : COLORS.textMuted,
          transition: 'left 200ms var(--ease-premium), background 200ms var(--ease-premium)',
        }}
      />
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

// Fase de Seguridad Centralizada — sustituye a PinSetter/PinGate en texto plano. `EntradaPin` es
// el único input numérico de PIN de toda la app: lo usan PinGate, VerificacionPinModal y (desde
// App.jsx) BloqueoAutomaticoGate, para que las tres pantallas que piden un PIN se vean y se
// comporten exactamente igual (apartado 8/9 de la especificación: un único sistema, nunca varios
// repartidos por la app). Verifica siempre contra el hash (src/lib/pin.js) — el PIN en claro nunca
// sale del propio input hasta que se descarta tras comprobarlo.
export function EntradaPin({ accent, onSubmit, cargando, error, autoFocus }) {
  const [value, setValue] = useState('');
  const submit = () => { if (value.length >= 4 && !cargando) onSubmit(value); };
  return (
    <div>
      <div className="flex items-center gap-2 justify-center">
        <TextInput
          type="password" inputMode="numeric" maxLength={6} placeholder="PIN" autoFocus={autoFocus}
          value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          style={{ textAlign: 'center', maxWidth: 120 }}
        />
        <div style={{ width: 84, flexShrink: 0 }}>
          <PrimaryButton accent={accent} disabled={value.length < 4 || cargando} onClick={submit}>
            {cargando ? '…' : 'Entrar'}
          </PrimaryButton>
        </div>
      </div>
      {error && <p className="text-xs mt-2 text-center" style={{ color: COLORS.negative }}>{error}</p>}
    </div>
  );
}

// Envuelve contenido protegido por PIN — protección "de sección", a la entrada (apartado 2).
// Componente controlado desde App.jsx: `desbloqueado` refleja el mapa centralizado de sesiones
// temporales (apartado 6), así que da igual si la sección se protegió desde Seguridad o desde
// Personalización — es el mismo desbloqueo, no dos sistemas distintos. Mensaje discreto y sin
// alarmismo si el PIN falla (apartado 5); nunca revela nada del contenido protegido.
export function PinGate({ pinHash, pinSalt, accent, desbloqueado, onDesbloquear, onOlvidoPin, children }) {
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);

  if (desbloqueado) return children;

  if (!pinHash) {
    return (
      <div className="text-center py-8 rounded-2xl" style={{ border: `1px dashed ${COLORS.border}` }}>
        <Lock size={20} style={{ color: COLORS.textMuted, margin: '0 auto 8px' }} />
        <p className="text-sm px-6" style={{ color: COLORS.textMuted }}>
          Todavía no has creado un PIN. Ve a Ajustes → Seguridad → "Protección mediante PIN" para proteger esta sección.
        </p>
      </div>
    );
  }

  const intentar = async (valor) => {
    setVerificando(true);
    const ok = await verificarPin(valor, pinHash, pinSalt);
    setVerificando(false);
    if (ok) { setError(''); onDesbloquear(); } else setError('PIN incorrecto');
  };

  return (
    <div className="text-center py-8 rounded-2xl" style={{ border: `1px dashed ${COLORS.border}` }}>
      <Lock size={20} style={{ color: accent, margin: '0 auto 10px' }} />
      <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>Sección protegida por PIN</p>
      <EntradaPin accent={accent} onSubmit={intentar} cargando={verificando} error={error} />
      {onOlvidoPin && (
        <button onClick={onOlvidoPin} className="text-xs mt-3 font-medium" style={{ color: COLORS.textMuted }}>
          ¿No recuerdas tu PIN?
        </button>
      )}
    </div>
  );
}

// Modal de confirmación reutilizado por TODA acción sensible: cambiar el PIN, desactivarlo, o
// quitar protección de una sección/función (apartado 3, el caso crítico de Seguridad). Al ser un
// único componente, cualquier sitio nuevo que en el futuro necesite "pedir el PIN antes de hacer
// algo" lo reutiliza en vez de inventar su propia pantalla de verificación.
export function VerificacionPinModal({ seguridad, accent, motivo, onSuccess, onCancel, onOlvidoPin }) {
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);

  const intentar = async (valor) => {
    setVerificando(true);
    const ok = await verificarPin(valor, seguridad.pinHash, seguridad.pinSalt);
    setVerificando(false);
    if (ok) onSuccess(); else setError('PIN incorrecto');
  };

  // Optimización de navegación/scroll — `createPortal` saca el modal fuera de cualquier árbol con
  // `.module-enter` (transform permanente por su animación de entrada, ver App.jsx/index.css) para
  // que `fixed inset-0` se ancle siempre al viewport real, no a un contenedor de página larga.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <ShieldCheck size={22} style={{ color: accent, margin: '0 auto 10px' }} />
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Confirma tu PIN</p>
        <p className="text-xs mb-4 px-2" style={{ color: COLORS.textMuted }}>{motivo}</p>
        <EntradaPin accent={accent} onSubmit={intentar} cargando={verificando} error={error} autoFocus />
        <div className="flex items-center justify-center gap-5 mt-4">
          <button onClick={onCancel} className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Cancelar</button>
          {onOlvidoPin && (
            <button onClick={onOlvidoPin} className="text-xs font-medium" style={{ color: COLORS.textMuted }}>¿No recuerdas tu PIN?</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal de creación/cambio de PIN — en dos pasos (nuevo → confirmar) para evitar que un error de
// tecleo deje a Josué con un PIN distinto al que cree que puso. Se usa tanto para crear el primer
// PIN, como para cambiarlo (tras confirmar el actual con VerificacionPinModal) y como paso final
// de la recuperación por correo — en los tres casos es la misma pantalla, coherente con el resto.
export function CrearPinModal({ accent, titulo, onGuardar, onCancel, permitirCancelar = true }) {
  const [paso, setPaso] = useState(1);
  const [nuevo, setNuevo] = useState('');
  const [valor, setValor] = useState('');
  const [error, setError] = useState('');

  const continuar = () => {
    if (valor.length < 4) return;
    if (paso === 1) {
      setNuevo(valor); setValor(''); setError(''); setPaso(2);
    } else if (valor !== nuevo) {
      setError('No coincide con el PIN anterior. Empieza de nuevo.');
      setPaso(1); setNuevo(''); setValor('');
    } else {
      onGuardar(nuevo);
    }
  };

  // Optimización de navegación/scroll — mismo motivo que VerificacionPinModal: portal para anclar
  // siempre al viewport real, no a un `.module-enter` con transform permanente.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <Lock size={22} style={{ color: accent, margin: '0 auto 10px' }} />
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>{titulo || 'Crea tu PIN'}</p>
        <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
          {paso === 1 ? 'Elige un PIN de 4 a 6 dígitos.' : 'Repite el mismo PIN para confirmarlo.'}
        </p>
        <div className="flex items-center gap-2 justify-center">
          <TextInput
            type="password" inputMode="numeric" maxLength={6} placeholder="PIN" autoFocus
            value={valor} onChange={(e) => setValor(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && continuar()}
            style={{ textAlign: 'center', maxWidth: 120 }}
          />
          <div style={{ width: 92, flexShrink: 0 }}>
            <PrimaryButton accent={accent} disabled={valor.length < 4} onClick={continuar}>
              {paso === 1 ? 'Siguiente' : 'Guardar'}
            </PrimaryButton>
          </div>
        </div>
        {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
        {permitirCancelar && (
          <button onClick={onCancel} className="text-xs font-medium mt-4" style={{ color: COLORS.textMuted }}>Cancelar</button>
        )}
      </div>
    </div>,
    document.body
  );
}

// "¿No recuerdas tu PIN?" — verificación de identidad real vía el sistema de recuperación de
// Supabase (nunca solo con el correo: hace falta abrir el enlace que llega a esa bandeja). Nunca
// pide ni guarda la contraseña de la cuenta de correo — solo compara el email introducido con el
// de la cuenta ya autenticada, como paso previo para no enviar el enlace a un correo cualquiera.
export function RecuperarPinModal({ accent, emailCuenta, onEnviar, onCancel }) {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState('form'); // 'form' | 'enviando' | 'enviado'
  const [error, setError] = useState('');

  const enviar = async () => {
    setError('');
    if (email.trim().toLowerCase() !== (emailCuenta || '').toLowerCase()) {
      setError('Ese correo no coincide con el de tu cuenta.');
      return;
    }
    setEstado('enviando');
    try {
      await onEnviar(email.trim());
      setEstado('enviado');
    } catch (e) {
      setError(e.message || 'No se ha podido enviar el correo. Prueba de nuevo.');
      setEstado('form');
    }
  };

  // Optimización de navegación/scroll — mismo motivo que el resto de modales de esta fase.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-1">
          <Mail size={22} style={{ color: accent, margin: '0 auto 10px' }} />
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Recuperar PIN</p>
        </div>
        {estado === 'enviado' ? (
          <p className="text-xs text-center mt-3 px-1" style={{ color: COLORS.textMuted }}>
            Te hemos enviado un enlace a {email}. Ábrelo desde este dispositivo — al hacerlo podrás crear un PIN nuevo aquí mismo, sin que se muestre el anterior.
          </p>
        ) : (
          <>
            <p className="text-xs text-center mb-4 px-1" style={{ color: COLORS.textMuted }}>
              Introduce el correo de tu cuenta. Te enviaremos un enlace de verificación real — nunca se te pedirá la contraseña de tu correo.
            </p>
            <TextInput
              type="email" placeholder="tu@correo.com" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar()}
              style={{ textAlign: 'center' }}
            />
            {error && <p className="text-xs mt-2 text-center" style={{ color: COLORS.negative }}>{error}</p>}
            <div style={{ marginTop: 12 }}>
              <PrimaryButton accent={accent} disabled={!email.trim() || estado === 'enviando'} onClick={enviar}>
                {estado === 'enviando' ? 'Enviando…' : 'Enviar enlace'}
              </PrimaryButton>
            </div>
          </>
        )}
        <button onClick={onCancel} className="text-xs font-medium mt-4 w-full text-center" style={{ color: COLORS.textMuted }}>
          {estado === 'enviado' ? 'Cerrar' : 'Cancelar'}
        </button>
      </div>
    </div>,
    document.body
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
// `lado` desde BI Fase 2: la lupa se queda con la esquina izquierda (apartado 1), así que este
// panel se va a la derecha. El desplegable se alinea al mismo lado que su botón para no salirse
// de la pantalla en un móvil estrecho.
export function SuggestionsButton({ accent, buildPrompt, lado = 'izquierda' }) {
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
    <div className="fixed z-30" style={lado === 'derecha' ? { top: 14, right: 14 } : { top: 14, left: 14 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{ background: hexToRgba(accent, 0.15), border: `1px solid ${hexToRgba(accent, 0.3)}`, backdropFilter: 'blur(8px)' }}
        aria-expanded={open}
        aria-label="Sugerencias de la IA"
      >
        <Lightbulb size={16} style={{ color: accent }} />
      </button>
      {open && (
        <div
          className="mt-2 rounded-2xl p-3 absolute"
          style={{ width: 252, background: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: '0 12px 28px rgba(0,0,0,0.45)', ...(lado === 'derecha' ? { right: 0 } : { left: 0 }) }}
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

// Apartado 10: la pregunta que ya ha escrito se le pasa tal cual a la IA. No se le pide
// que la vuelva a escribir, que es justo lo que la especificación prohíbe.
function BotonPreguntarIA({ query, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left mt-3 transition-transform active:scale-[0.98]"
      style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${hexToRgba(accent, 0.28)}` }}
    >
      <Sparkles size={15} style={{ color: accent, flexShrink: 0 }} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold" style={{ color: COLORS.text }}>Preguntar a la IA</span>
        <span className="block text-xs truncate" style={{ color: COLORS.textMuted }}>{query}</span>
      </span>
      <CornerDownLeft size={14} style={{ color: COLORS.textMuted, flexShrink: 0 }} />
    </button>
  );
}

// Fase 18 + Entrega 2 · BI Fase 2 — el acceso único de búsqueda e IA.
//
// LO QUE HACÍA (Fase 18)
// Buscar en los DATOS de Josué preguntando a la IA: "¿cuántas horas dormí de media?".
// Eso sigue funcionando exactamente igual, y sigue disparándose solo a un toque.
//
// LO QUE AÑADE BI FASE 2
// Buscar FUNCIONES, PANTALLAS Y AJUSTES y abrirlos directo. Antes, para cambiar un color,
// Josué tenía que recordar que eso vive en Más → Ajustes → Apariencia. Ahora escribe
// "colores" y pulsa el resultado.
//
// POR QUÉ ES EL MISMO MODAL Y NO UNO NUEVO
// El apartado 20 lo pide literalmente: "BUSCAR → ENCONTRAR → ABRIR y también PREGUNTAR →
// IA → RESPUESTA. Todo desde el mismo acceso". Y el apartado 16 prohíbe duplicar la IA que
// ya existe. Así que se amplía este componente en vez de poner un segundo buscador al lado.
//
// CÓMO DECIDE QUÉ ENSEÑAR (apartado 11)
// No obliga a elegir entre "buscar" o "preguntar". Mientras escribe salen los resultados
// del índice; si además el texto parece una pregunta, la opción de preguntar a la IA sube
// arriba del todo. "¿cómo cambio los colores?" enseña las dos cosas.
export function UniversalSearchModal({ accent, onClose, buildContext, indice, onIr }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  // Apartado 3: el campo recibe el foco al abrirse. En iOS eso además levanta el teclado,
  // que es lo que Josué quiere si ha pulsado la lupa a propósito.
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  // Apartado 7: los resultados aparecen mientras escribe. Es una búsqueda local sobre un
  // índice de unas treinta entradas — instantánea, sin red y sin debounce que la retrase
  // (apartado 13: "VELOCIDAD > EFECTOS").
  const resultados = useMemo(() => buscar(indice, query), [indice, query]);
  const esPregunta = pareceUnaPregunta(query);
  const hayTexto = query.trim().length > 0;

  const abrir = (entrada) => {
    onIr && onIr(entrada);
    onClose();
  };

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

  // Optimización de navegación/scroll — portal, mismo motivo que el resto de modales de esta fase.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl p-4"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.text }}>
            <Search size={15} /> Buscar o preguntar
          </p>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar buscador">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <TextInput
              ref={inputRef}
              placeholder="Buscar funciones, ajustes o preguntar…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setResponse(''); setErrorMsg(''); }}
              onKeyDown={(e) => {
                // Enter abre el primer resultado si lo hay; si no, pregunta a la IA. Es el
                // atajo que hace que "colores" + Enter sea todo el recorrido (apartado 12).
                if (e.key !== 'Enter') return;
                if (resultados.length > 0 && !esPregunta) abrir(resultados[0]);
                else handleSearch();
              }}
              style={{ paddingRight: hayTexto ? 34 : undefined }}
            />
            {/* Apartado 3: botón para limpiar. Solo aparece si hay algo que limpiar. */}
            {hayTexto && (
              <button
                onClick={() => { setQuery(''); setResponse(''); setErrorMsg(''); inputRef.current && inputRef.current.focus(); }}
                className="absolute rounded-full flex items-center justify-center"
                style={{ right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, background: COLORS.surface2 }}
                aria-label="Limpiar búsqueda"
              >
                <X size={11} style={{ color: COLORS.textMuted }} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !hayTexto}
            className="rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-60"
            style={{ width: 44, height: 42, background: accent }}
            aria-label="Preguntar a la IA"
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ color: COLORS.textOnAccent }} /> : <Sparkles size={16} style={{ color: COLORS.textOnAccent }} />}
          </button>
        </div>

        {/* Apartado 14: con el teclado abierto en un iPhone queda poca altura. La lista scrollea
            ella sola en vez de empujar el modal fuera de la pantalla. */}
        <div style={{ maxHeight: '46vh', overflowY: 'auto' }}>
          {/* Apartado 11: si parece una pregunta, la IA va primero — pero los resultados
              siguen debajo, no se le obliga a elegir. */}
          {hayTexto && esPregunta && !response && !loading && (
            <BotonPreguntarIA query={query} accent={accent} onClick={handleSearch} />
          )}

          {hayTexto && resultados.length > 0 && (
            <ul className="mt-3 space-y-1">
              {resultados.map((r) => {
                const IconoR = r.icono;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => abrir(r)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-transform active:scale-[0.98]"
                      style={{ background: COLORS.surface2 }}
                    >
                      {IconoR
                        ? <IconoR size={15} style={{ color: accent, flexShrink: 0 }} />
                        : <Search size={15} style={{ color: accent, flexShrink: 0 }} />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold truncate" style={{ color: COLORS.text }}>{r.titulo}</span>
                        <span className="block text-xs truncate" style={{ color: COLORS.textMuted }}>
                          {r.categoria === 'Ajustes' ? 'Ajustes' : 'Módulo'}{r.descripcion ? ` · ${r.descripcion}` : ''}
                        </span>
                      </span>
                      <ChevronRight size={14} style={{ color: COLORS.textMuted, flexShrink: 0 }} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Apartado 9: sin coincidencias no se deja una pantalla vacía — se ofrece la IA. */}
          {hayTexto && resultados.length === 0 && !esPregunta && !response && !loading && (
            <div className="mt-3">
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>No hemos encontrado esa función</p>
              <p className="text-xs mt-1 mb-2" style={{ color: COLORS.textMuted }}>
                Puedes preguntárselo a la IA sobre tus propios datos.
              </p>
              <BotonPreguntarIA query={query} accent={accent} onClick={handleSearch} />
            </div>
          )}

          {errorMsg && <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>{errorMsg}</p>}
          {response && !errorMsg && <p className="text-sm mt-3 leading-relaxed" style={{ color: COLORS.text }}>{response}</p>}
          {!hayTexto && !response && !errorMsg && !loading && (
            <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>
              Escribe el nombre de una pantalla o un ajuste para abrirlo — "colores", "dormir", "dinero" —, o haz una pregunta sobre tus datos guardados.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
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
