/* Comprueba que /api/ask-ai no deja pasar a cualquiera.
   Se importa el handler de verdad y se le pasan un req y un res falsos, con
   `fetch` sustituido para no llamar ni a Supabase ni a Anthropic. Lo que se
   verifica es el orden de las puertas, que es donde estos fallos se cuelan:
   una comprobación correcta pero puesta después de la llamada que cuesta dinero
   no sirve de nada. */
import handler from '../api/ask-ai.js';

let ok = 0;
const fallos = [];
const check = (nombre, cond, extra = '') => {
  if (cond) { ok += 1; console.log(`  ✓ ${nombre}`); } else {
    fallos.push(`${nombre}${extra ? ` — ${extra}` : ''}`);
    console.log(`  ✗ ${nombre}${extra ? ` — ${extra}` : ''}`);
  }
};

const TOKEN_BUENO = 'token-de-sesion-valido';
const USER = '11111111-2222-3333-4444-555555555555';

function resFalso() {
  const r = { code: null, body: null };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
}

function reqFalso(token, body = { prompt: 'hola' }) {
  return { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body };
}

/* fetch falso: distingue Supabase de Anthropic por la URL. `llamadasAnthropic`
   es el dato importante — si sube en una prueba que debía cortar, es que se
   estaba gastando dinero. */
let llamadasAnthropic = 0;
let supabaseCae = false;
function ponerFetch() {
  llamadasAnthropic = 0;
  globalThis.fetch = async (url, opciones = {}) => {
    if (String(url).includes('/auth/v1/user')) {
      if (supabaseCae) throw new Error('red caída');
      const auth = (opciones.headers || {}).Authorization || '';
      if (auth === `Bearer ${TOKEN_BUENO}`) {
        return { ok: true, status: 200, json: async () => ({ id: USER }) };
      }
      return { ok: false, status: 401, json: async () => ({}) };
    }
    llamadasAnthropic += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({ content: [{ text: 'respuesta' }] }),
      text: async () => '',
    };
  };
}

const ENTORNO = {
  ANTHROPIC_API_KEY: 'clave-de-prueba',
  VITE_SUPABASE_URL: 'https://proyecto.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-de-prueba',
};
const ponerEntorno = (cambios = {}) => {
  Object.assign(process.env, ENTORNO, cambios);
  Object.entries(cambios).forEach(([k, v]) => { if (v === undefined) delete process.env[k]; });
};

async function llamar(req, cambios = {}) {
  ponerEntorno(cambios);
  ponerFetch();
  const res = resFalso();
  await handler(req, res);
  return res;
}

console.log('— /api/ask-ai: quién puede llamar —');

/* 1. Sin sesión. Es el caso que abría la puerta: antes esto devolvía 200. */
let r = await llamar(reqFalso(null));
check('sin sesión → 401', r.code === 401, `devolvió ${r.code}`);
check('sin sesión no llega a Anthropic', llamadasAnthropic === 0, `${llamadasAnthropic} llamadas`);

/* 2. Token inventado. */
r = await llamar(reqFalso('me-lo-acabo-de-inventar'));
check('token inválido → 401', r.code === 401, `devolvió ${r.code}`);
check('token inválido no llega a Anthropic', llamadasAnthropic === 0, `${llamadasAnthropic} llamadas`);

/* 3. Cabecera mal formada: el token suelto, sin "Bearer". */
r = await llamar({ method: 'POST', headers: { authorization: TOKEN_BUENO }, body: { prompt: 'hola' } });
check('sin "Bearer" → 401', r.code === 401, `devolvió ${r.code}`);

/* 4. Sesión buena: pasa y llama. */
r = await llamar(reqFalso(TOKEN_BUENO));
check('sesión válida → 200', r.code === 200, `devolvió ${r.code}`);
check('sesión válida devuelve el texto', r.body && r.body.text === 'respuesta');
check('sesión válida sí llega a Anthropic', llamadasAnthropic === 1);

/* 5. ⚠️ Supabase caído NO abre la puerta. Es el fallo clásico: dejar pasar
   "por si acaso" cuando el verificador no contesta. */
supabaseCae = true;
r = await llamar(reqFalso(TOKEN_BUENO));
check('Supabase caído → 503, no 200', r.code === 503, `devolvió ${r.code}`);
check('Supabase caído no llega a Anthropic', llamadasAnthropic === 0, `${llamadasAnthropic} llamadas`);
supabaseCae = false;

/* 6. Falta configuración → 503 diciendo qué falta, no un 401 mudo. Importa
   porque este endpoint lo usan seis módulos: un 401 haría pensar que es la
   cuenta del usuario cuando el problema está en Vercel. */
r = await llamar(reqFalso(TOKEN_BUENO), { VITE_SUPABASE_URL: undefined });
check('sin configurar → 503', r.code === 503, `devolvió ${r.code}`);
check('sin configurar dice qué falta', /VITE_SUPABASE_URL/.test((r.body || {}).error || ''));

/* 7. Sin clave de Anthropic sigue avisando como antes (no se ha roto). */
r = await llamar(reqFalso(TOKEN_BUENO), { ANTHROPIC_API_KEY: undefined });
check('sin ANTHROPIC_API_KEY → 503', r.code === 503, `devolvió ${r.code}`);

/* 8. Los límites de tamaño siguen vivos, y ahora detrás de la sesión. */
r = await llamar(reqFalso(TOKEN_BUENO, { prompt: 'x'.repeat(40001) }));
check('prompt gigante → 400', r.code === 400, `devolvió ${r.code}`);
r = await llamar(reqFalso(null, { prompt: 'x'.repeat(40001) }));
check('prompt gigante sin sesión → 401 (la sesión va primero)', r.code === 401, `devolvió ${r.code}`);

/* 9. El freno por usuario. Ya se han gastado varias llamadas buenas arriba, así
   que se cuenta desde aquí hasta que corte, con un techo para no colgarse. */
let cortoEn = null;
for (let i = 0; i < 80 && cortoEn === null; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  const rr = await llamar(reqFalso(TOKEN_BUENO));
  if (rr.code === 429) cortoEn = i;
}
check('el freno por usuario corta', cortoEn !== null, 'no cortó en 80 intentos');
check('el freno corta pasadas ~30, no antes', cortoEn === null || cortoEn > 20, `cortó en la ${cortoEn}`);

console.log(`\n${fallos.length === 0 ? '✅' : '❌'} ${ok} comprobaciones correctas`);
if (fallos.length) {
  fallos.forEach((f) => console.log(`   ❌ ${f}`));
  process.exit(1);
}
