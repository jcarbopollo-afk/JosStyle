import React, { useState } from 'react';
import { signIn, signUp } from '../lib/supabase';
import { COLORS, ACCENTS } from '../tokens';
import { TextoDeBoton } from './ui';
import { TEXTOS_SALIDA } from '../lib/estadosAsincronos';
/* ⚠️ La versión, ANTES de iniciar sesión. Existe por un problema real: durante
   semanas la web se veía igual después de cada entrega y no había manera de
   saber, sin entrar y navegar hasta Ajustes, si lo que estaba cargado era lo
   nuevo o una copia guardada por el navegador. Se lee de `package.json`, que es
   donde ya estaba (la misma fuente que usa Ajustes → Información): ni un número
   escrito a mano, que se quedaría desfasado a la primera. */
import pkg from '../../package.json';

export default function Auth({ salida = null }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setInfo('Cuenta creada. Si Supabase pide confirmación por email, revisa tu correo y luego inicia sesión.');
        setMode('signin');
      }
    } catch (e) {
      setError(e.message || 'Algo ha fallado');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: COLORS.surface2,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: COLORS.bg }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          JosStyle
        </h1>
        <p className="text-sm mb-1" style={{ color: COLORS.textMuted }}>
          {mode === 'signin' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
        </p>
        <p className="text-[11px] mb-6" style={{ color: COLORS.textMuted }}>v{pkg.version}</p>

        {/* MS F16, apartado 45 — si la sesión se ha ido sola (no la ha cerrado él), se dice: la
            pantalla de la aplicación no desaparece sin explicación. Entra en su sitio (`vacio-entra`). */}
        {salida && TEXTOS_SALIDA[salida.motivo] && (
          <div role="status" data-salida={salida.motivo} className="vacio-entra rounded-xl px-3 py-2.5 mb-4" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_SALIDA[salida.motivo].titulo}</p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{TEXTOS_SALIDA[salida.motivo].texto}</p>
            {TEXTOS_SALIDA[salida.motivo].sinGuardar(salida.sinGuardar || 0) && (
              <p className="text-xs mt-1" style={{ color: COLORS.warning }}>{TEXTOS_SALIDA[salida.motivo].sinGuardar(salida.sinGuardar || 0)}</p>
            )}
          </div>
        )}

        <input
          className="w-full rounded-xl px-3 py-2.5 text-sm mb-3 outline-none"
          style={inputStyle} type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-xl px-3 py-2.5 text-sm mb-3 outline-none"
          style={inputStyle} type="password" placeholder="Contraseña"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-xs mb-3" style={{ color: COLORS.negative }}>{error}</p>}
        {info && <p className="text-xs mb-3" style={{ color: COLORS.positive }}>{info}</p>}

        {/* MS F9 — mientras entra, «Entrando…» en su sitio: el botón no se apaga (parecería roto) y el
            toque no repite la acción (`aria-busy`). */}
        <button
          onClick={loading ? undefined : submit}
          disabled={!loading && (!email || !password)}
          aria-busy={loading || undefined}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold mb-3 disabled:opacity-60"
          style={{ background: ACCENTS[0].value, color: COLORS.textOnAccent }}
        >
          <TextoDeBoton estado={loading ? 'cargando' : 'reposo'} textoCargando={mode === 'signin' ? 'Entrando…' : 'Creando la cuenta…'}>
            {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </TextoDeBoton>
        </button>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
          className="text-xs w-full text-center"
          style={{ color: COLORS.textMuted }}
        >
          {mode === 'signin' ? '¿No tienes cuenta? Créala' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}
