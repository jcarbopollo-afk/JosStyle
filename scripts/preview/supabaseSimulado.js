/* ═══════════════════════════════════════════════════════════════════════════
   PREVIEW DE FITNESS — un Supabase SIMULADO, en el navegador
   ═══════════════════════════════════════════════════════════════════════════
   🚨 Solo para la preview local (`vite.preview.config.mjs` lo pone en lugar de
   `@supabase/supabase-js`). No habla con ningún servidor: la sesión es de un
   usuario de prueba y `app_data` vive en el `localStorage` de quien abre la
   preview, con el prefijo `josstyle-preview:`. Así se puede usar la aplicación
   entera sin tocar ninguna cuenta ni ningún dato real.

   `src/lib/supabase.js` no cambia: su cola de guardados, la sincronización y la
   migración de Fitness funcionan igual; solo cambia a dónde van los datos.
   Las fotos se quedan en memoria (se pierden al recargar). La IA no está. */

import { escenarioDeFitness, escenarioDeRachas } from './escenario';

const PREFIJO = 'josstyle-preview:';
const USUARIO = { id: 'preview-josstyle', email: 'preview@josstyle.local', aud: 'authenticated' };
const SESION = { access_token: 'preview', token_type: 'bearer', user: USUARIO };
const hoy = () => new Date().toLocaleDateString('sv-SE');

const almacen = {
  leer(clave) {
    try { const v = window.localStorage.getItem(PREFIJO + clave); return v === null ? null : JSON.parse(v); } catch { return null; }
  },
  escribir(clave, valor) {
    try { window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor)); return null; } catch (e) { return e; }
  },
};

/* La primera vez (o con `?reiniciar=1`), el escenario de prueba. */
function sembrar() {
  if (typeof window === 'undefined') return;
  const reiniciar = /[?&]reiniciar=1\b/.test(window.location.search);
  if (reiniciar) {
    try {
      Object.keys(window.localStorage).filter((k) => k.startsWith(PREFIJO)).forEach((k) => window.localStorage.removeItem(k));
    } catch { /* sin almacenamiento: se queda sin sembrar */ }
  }
  if (almacen.leer('__sembrado')) return;
  const h = hoy();
  almacen.escribir('app_data:fitness', escenarioDeFitness(h));
  almacen.escribir('app_data:rachas', escenarioDeRachas(h));
  almacen.escribir('__sembrado', h);
  if (reiniciar) window.history.replaceState(null, '', window.location.pathname);
}

const oyentes = new Set();
const sesionActual = () => (almacen.leer('__fuera') ? null : SESION);
const avisar = (evento) => oyentes.forEach((cb) => { try { cb(evento, sesionActual()); } catch { /* un oyente roto no tumba los demás */ } });

const fotos = new Map();

function consulta(tabla) {
  const filtros = {};
  const api = {
    select() { return api; },
    eq(campo, valor) { filtros[campo] = valor; return api; },
    async maybeSingle() {
      if (tabla !== 'app_data') return { data: null, error: null };
      const v = almacen.leer(`app_data:${filtros.key}`);
      return { data: v === null ? null : { value: v }, error: null, status: 200 };
    },
    upsert(fila) {
      if (tabla !== 'app_data') return Promise.resolve({ data: null, error: null, status: 201 });
      const e = almacen.escribir(`app_data:${fila.key}`, fila.value);
      return Promise.resolve(e ? { data: null, error: { message: 'Sin espacio en el navegador (preview)', status: 413 }, status: 413 } : { data: null, error: null, status: 201 });
    },
  };
  return api;
}

export function createClient() {
  sembrar();
  return {
    auth: {
      async getSession() { return { data: { session: sesionActual() }, error: null }; },
      onAuthStateChange(cb) {
        oyentes.add(cb);
        setTimeout(() => cb(sesionActual() ? 'SIGNED_IN' : 'SIGNED_OUT', sesionActual()), 0);
        return { data: { subscription: { unsubscribe: () => oyentes.delete(cb) } } };
      },
      async signInWithPassword() { almacen.escribir('__fuera', false); avisar('SIGNED_IN'); return { data: { session: SESION, user: USUARIO }, error: null }; },
      async signUp() { almacen.escribir('__fuera', false); avisar('SIGNED_IN'); return { data: { session: SESION, user: USUARIO }, error: null }; },
      async signOut() { almacen.escribir('__fuera', true); avisar('SIGNED_OUT'); return { error: null }; },
      async resetPasswordForEmail() { return { data: {}, error: null }; },
    },
    from: (tabla) => consulta(tabla),
    storage: {
      from: () => ({
        async upload(path, file) { fotos.set(path, URL.createObjectURL(file)); return { data: { path }, error: null }; },
        async createSignedUrl(path) { return fotos.has(path) ? { data: { signedUrl: fotos.get(path) }, error: null } : { data: null, error: { message: 'No está en esta preview' } }; },
        async remove(paths) { (paths || []).forEach((p) => fotos.delete(p)); return { data: null, error: null }; },
      }),
    },
  };
}
