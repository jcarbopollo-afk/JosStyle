// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1 — EL ESCRITOR PROTEGIDO DE `horarioTop` CONTRA UN POSTGREST REAL (nivel 3, D4)
//
// El código DE VERDAD (`src/lib/supabase.js` y `src/lib/escritorHorario.js`) contra un Postgres + PostgREST LOCALES y
// desechables, con la tabla `app_data` y sus cuatro políticas de `supabase/schema.sql`. Comprueba lo que el doble de
// `test-escritor-horario.mjs` no puede:
//   · que PostgREST aplica de verdad el filtro anidado `value->testigo->>revision` (`eq.` e `is.null`);
//   · el `insert` con 23505, la carrera de escrituras sobre la misma revisión (una sola entra) y RLS;
//   · dos escritores (dos aparatos) sobre la misma cuenta: el manual que llega tarde abre conflicto y no pisa;
//   · una respuesta perdida reconocida al releer (una sola escritura) y sin conexión (pendiente, nada se pierde);
//   · y la regla del servidor (`supabase/horarios-regla-revision.sql`, TP-15 B), instalada SOLO aquí y quitada
//     al terminar: para una copia antigua (upsert ciego, update sin testigo, borrado) y deja pasar a E1.
//
// ⚠️ NUNCA contra Supabase de producción. Es OPCIONAL: sin estas variables, se omite (y lo dice). Son las mismas que
// la prueba de nivel 3 del historial de versiones:
//   HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2   (ver `test-historial-versiones-postgrest.mjs`)
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-escritor-horario-postgrest.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { register } from 'node:module';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import http from 'node:http';
import crypto from 'node:crypto';

const { HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2 } = process.env;
if (!HV_PGRST_URL || !HV_JWT_SECRET || !HV_PSQL || !HV_U1 || !HV_U2) {
  console.log('  ⏭ omitida: no hay un PostgREST local configurado (HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2)');
  process.exit(0);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(HV_PGRST_URL) || !/@(127\.0\.0\.1|localhost)[:/]/.test(HV_PSQL)) {
  console.log('  ✗ se niega: esta prueba solo corre contra un PostgREST y un Postgres en este mismo aparato');
  process.exit(1);
}

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (sub) => { const h = b64({ alg: 'HS256', typ: 'JWT' }); const p = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', HV_JWT_SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const psql = (sql) => execFileSync('psql', [HV_PSQL, '-Atc', sql]).toString().trim();
const psqlArchivo = (ruta) => execFileSync('psql', [HV_PSQL, '-v', 'ON_ERROR_STOP=1', '-q', '-f', ruta], { env: { ...process.env, PGOPTIONS: '-c client_min_messages=warning' } }).toString();
const copia = (v) => JSON.parse(JSON.stringify(v));

/* ── El proxy: quita el `/rest/v1` de supabase-js, contesta CORS y apunta cada petición. ── */
// El proxy escucha en un puerto que da el sistema (listen(0)): uno fijo de 5544x cae en el rango efímero
// (32768–60999) y una conexión saliente podía tenerlo ocupado (EADDRINUSE en verificar.sh, R2).
const registro = [];
const destino = new URL(HV_PGRST_URL);
const proxy = http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
  const trozos = []; req.on('data', (c) => trozos.push(c));
  req.on('end', () => {
    const cuerpo = Buffer.concat(trozos);
    registro.push({ metodo: req.method, url: decodeURIComponent(req.url), cuerpo: cuerpo.toString() });
    const headers = { ...req.headers }; delete headers.host;
    const up = http.request({ host: destino.hostname, port: destino.port, method: req.method, path: req.url.replace(/^\/rest\/v1/, ''), headers }, (ur) => {
      const ub = []; ur.on('data', (c) => ub.push(c));
      ur.on('end', () => { res.writeHead(ur.statusCode, { ...ur.headers, ...cors }); res.end(Buffer.concat(ub)); });
    });
    up.end(cuerpo);
  });
});
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const URL_PROXY = `http://127.0.0.1:${proxy.address().port}`;

const entornos = { 1: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1) }, 2: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U2) } };
register('data:text/javascript,' + encodeURIComponent(`const E = ${JSON.stringify(entornos)};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = url.match(/\\/lib\\/supabase\\.js\\?eh=(\\d)$/);
  if (m) return { ...r, source: String(r.source).replace(/import\\.meta\\.env/g, JSON.stringify(E[m[1]])), shortCircuit: true };
  return r;
}`));
const S1 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?eh=1');
const S2 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?eh=2');
const W = await import(pathToFileURL(join(RAIZ, 'src/lib/escritorHorario.js')).href);
const G = await import(pathToFileURL(join(RAIZ, 'src/lib/guardiaHorario.js')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const enCuenta = (u = HV_U1) => { const t = psql(`select value::text from app_data where user_id='${u}' and key='horarioTop'`); return t ? JSON.parse(t) : null; };
const revEnCuenta = (u = HV_U1) => psql(`select coalesce(value->'testigo'->>'revision', '<null>') from app_data where user_id='${u}' and key='horarioTop'`);
const borrar = () => psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}') and key='horarioTop'`);
const sinErrores = (fn) => async (...a) => { const e = console.error; console.error = () => {}; try { return await fn(...a); } finally { console.error = e; } };

/* Una guardia mínima que escribe el testigo como la de verdad: revisión nueva, `base` = la que había y su aparato. */
const guardiaDe = (aparato, { baseFalsa = false } = {}) => ({
  prepararEscritura(nuevo, actual) {
    const revision = crypto.randomUUID();
    const base = baseFalsa ? 'una-base-que-no-es' : G.revisionDelTestigo(actual);
    return { valor: { ...nuevo, version: 1, testigo: { formato: 1, revision, base, aparato, desde: 'x', ultimaEscritura: 'x' } }, conTestigo: true, arranque: false, revision };
  },
  motivoBloqueo: () => null,
  despuesDeGuardar() { return Promise.resolve(); },
});
const escritor = async (S, aparato, { transporte = S.transporteDeHorario, guardia = guardiaDe(aparato), u = HV_U1 } = {}) => {
  const lh = await S.leerHorarioPropio(u);
  const apartadas = []; const adoptados = [];
  const w = W.crearEscritorDeHorario({
    transporte, usuario: u, guardia,
    inicial: { valor: lh.valor, existe: lh.existe },
    alAdoptar: (v) => adoptados.push(copia(v)),
    apartar: async (v) => { apartadas.push(copia(v)); return { estado: 'confirmada', opId: `ap${apartadas.length}` }; },
    reintentarApartado: async (opId) => ({ estado: 'confirmada', opId }),
    descartarApartado: async (id) => ({ estado: 'confirmada', opId: `del-${id}` }),
  });
  return { w, apartadas, adoptados };
};

borrar();
try {
  console.log('\n── A · El transporte contra PostgREST: insert, 23505, filtro anidado (eq. e is.null) y RLS ──');
  {
    const sin = await S1.leerHorarioPropio(HV_U1);
    ok(sin.ok && sin.existe === false, 'sin fila: existe = false');
    const ins = await S1.insertarHorarioPropio(HV_U1, { horarios: [], bloques: [], n: 1 });
    ok(ins.ok === true, 'la primera fila se inserta');
    ok(/updated_at/.test(registro.filter((e) => e.metodo === 'POST').at(-1).cuerpo), 'el insert lleva updated_at (lo hacía saveData), pero no es la condición');
    const dup = await S1.insertarHorarioPropio(HV_U1, { horarios: [], bloques: [], n: 2 });
    ok(dup.ok === false && dup.conflicto === true && enCuenta().n === 1, 'insertar otra vez: 23505 → conflicto, y la fila sigue igual');
    const nulo = await S1.actualizarHorarioSiRevision(HV_U1, { horarios: [], bloques: [], n: 3, testigo: { revision: 'r1', base: null } }, null);
    ok(nulo.ok && nulo.aplicada === true && revEnCuenta() === 'r1', 'base null sobre una fila sin testigo: «is.null» aplica');
    ok(/value->testigo->>revision=is\.null/.test(registro.filter((e) => e.metodo === 'PATCH').at(-1).url), '…y la petición lleva el filtro anidado value->testigo->>revision=is.null');
    const nulo2 = await S1.actualizarHorarioSiRevision(HV_U1, { horarios: [], bloques: [], n: 4 }, null);
    ok(nulo2.ok && nulo2.aplicada === false && enCuenta().n === 3, 'base null sobre una fila CON testigo: no aplica (nadie la vio sin testigo)');
    const bien = await S1.actualizarHorarioSiRevision(HV_U1, { horarios: [], bloques: [], n: 5, testigo: { revision: 'r2', base: 'r1' } }, 'r1');
    ok(bien.ok && bien.aplicada === true && revEnCuenta() === 'r2', 'base = la revisión de la cuenta: aplica');
    ok(/value->testigo->>revision=eq\.r1/.test(registro.filter((e) => e.metodo === 'PATCH').at(-1).url), '…con value->testigo->>revision=eq.r1');
    const vieja = await S1.actualizarHorarioSiRevision(HV_U1, { horarios: [], bloques: [], n: 6 }, 'r1');
    ok(vieja.ok && vieja.aplicada === false && enCuenta().n === 5, 'con una base vieja: no aplica y la fila sigue igual');
    psql(`update app_data set value = jsonb_set(value, '{testigo,revision}', '7'::jsonb) where user_id='${HV_U1}' and key='horarioTop'`);
    const num = await S1.actualizarHorarioSiRevision(HV_U1, { horarios: [], bloques: [], n: 7, testigo: { revision: 'r8', base: '7' } }, '7');
    ok(num.ok && num.aplicada === true && revEnCuenta() === 'r8', 'una revisión numérica se compara por su TEXTO (D3): eq.7 encuentra el 7');
    const carrera = await Promise.all(Array.from({ length: 10 }, (_, j) => S1.actualizarHorarioSiRevision(HV_U1, { horarios: [], bloques: [], n: 100 + j, testigo: { revision: `c${j}`, base: 'r8' } }, 'r8')));
    ok(carrera.filter((x) => x.aplicada === true).length === 1 && carrera.filter((x) => x.ok && x.aplicada === false).length === 9, 'diez escrituras a la vez sobre la misma revisión: entra UNA');
    const otro = await S2.actualizarHorarioSiRevision(HV_U2, { horarios: [], bloques: [], pisa: true }, null);
    ok(otro.ok && otro.aplicada === false && !('pisa' in (enCuenta() || {})), 'RLS: el usuario 2 no alcanza la fila del usuario 1');
    const lee2 = await S2.leerHorarioPropio(HV_U2);
    ok(lee2.ok && lee2.existe === false, 'RLS: y no la lee');
    const rechazoSave = await sinErrores(S1.saveData)(HV_U1, 'horarioTop', { pisa: true });
    ok(rechazoSave.ok === false && !('pisa' in (enCuenta() || {})), 'saveData de horarioTop se rechaza en el cliente: la fila no cambia');
  }

  console.log('\n── B · Dos escritores (dos aparatos) sobre la misma cuenta ──');
  {
    borrar();
    await S1.insertarHorarioPropio(HV_U1, { horarios: [], bloques: [], n: 0, version: 1, testigo: { formato: 1, revision: 'b0', base: null, aparato: 'X' } });
    const A = await escritor(S1, 'A');
    const B = await escritor(S1, 'B');
    const ra = await A.w.guardar({ horarios: [], bloques: [], n: 1, de: 'A' });
    ok(ra.ok === true && enCuenta().de === 'A' && enCuenta().testigo.base === 'b0', 'el aparato A guarda: su testigo nuevo, con base = la revisión que vio');
    const revA = revEnCuenta();
    const rb = await B.w.guardar({ horarios: [], bloques: [], n: 1, de: 'B' });
    ok(rb.ok === false && B.w.vista().conflicto, '🚨 el aparato B (manual, sobre lo viejo) abre conflicto');
    ok(enCuenta().de === 'A' && revEnCuenta() === revA, '🚨 …y NO pisa lo de A en el servidor');
    ok(B.apartadas.length === 1 && B.apartadas[0].de === 'B', '…su cambio queda apartado (D2-bis)');
    ok(B.w.motivoBloqueo() === W.MOTIVO_CONFLICTO_HORARIO, '…y el escritor de B no guarda nada hasta que elija');
    B.w.verLoDeAhora();
    ok(!B.w.vista().conflicto && B.adoptados.at(-1).de === 'A', '«Ver lo que hay ahora»: B pasa a ver lo de A');
    const rb2 = await B.w.guardar({ ...enCuenta(), n: 2, de: 'B' });
    ok(rb2.ok === true && enCuenta().de === 'B' && enCuenta().testigo.base === revA, 'después, B guarda sobre lo de A, condicionado a su revisión');
    const ra2 = await A.w.guardar({ horarios: [], bloques: [], n: 9, de: 'A-auto' }, { automatico: true });
    ok(ra2.ok === true && ra2.recalculado === true && enCuenta().de === 'B' && A.adoptados.at(-1).de === 'B', 'un guardado AUTOMÁTICO de A que llega tarde adopta lo de la cuenta: ni pisa ni abre conflicto');
    ok(A.apartadas.length === 0, '…y no genera ninguna copia apartada (condición 4)');
    A.w.cerrar(); B.w.cerrar();
  }

  console.log('\n── C · Respuesta perdida y sin conexión ──');
  {
    borrar();
    await S1.insertarHorarioPropio(HV_U1, { horarios: [], bloques: [], n: 0, version: 1, testigo: { formato: 1, revision: 'c0', base: null, aparato: 'X' } });
    let perder = 1;
    const tPerdida = { ...S1.transporteDeHorario, async actualizarHorarioSiRevision(u, v, b) { const r = await S1.actualizarHorarioSiRevision(u, v, b); if (perder > 0) { perder -= 1; return { ok: false, sinRespuesta: true, error: null }; } return r; } };
    const P = await escritor(S1, 'P', { transporte: tPerdida });
    const parches0 = registro.filter((e) => e.metodo === 'PATCH').length;
    const rp = await P.w.guardar({ horarios: [], bloques: [], n: 1, de: 'P' });
    ok(rp.ok === true && enCuenta().de === 'P', '🚨 la escritura llegó pero la respuesta se perdió: al releer se reconoce como suya');
    ok(registro.filter((e) => e.metodo === 'PATCH').length - parches0 === 1, '…con UNA sola escritura (no se repite a ciegas)');
    P.w.cerrar();
    let sinRed = true;
    const tSinRed = {
      leerHorario: async (u) => (sinRed ? { ok: false, sinRespuesta: true, error: null } : S1.leerHorarioPropio(u)),
      insertarHorario: async (u, v) => (sinRed ? { ok: false, sinRespuesta: true, error: null } : S1.insertarHorarioPropio(u, v)),
      actualizarHorarioSiRevision: async (u, v, b) => (sinRed ? { ok: false, sinRespuesta: true, error: null } : S1.actualizarHorarioSiRevision(u, v, b)),
    };
    const O = await escritor(S1, 'O', { transporte: tSinRed });
    const antes = enCuenta();
    const ro = await O.w.guardar({ horarios: [], bloques: [], n: 2, de: 'O' });
    ok(ro.ok === false && ro.pendiente === true && O.w.vista().pendiente, 'sin conexión: queda pendiente (en memoria), sin conflicto inventado');
    ok(JSON.stringify(enCuenta()) === JSON.stringify(antes), '…y la cuenta no cambia');
    const otroAparato = await escritor(S1, 'Q');
    await otroAparato.w.guardar({ horarios: [], bloques: [], n: 3, de: 'Q' });
    otroAparato.w.cerrar();
    sinRed = false;
    await O.w.reintentar();
    await O.w.esperar();
    ok(O.w.vista().conflicto && enCuenta().de === 'Q', '🚨 al volver la conexión, si otro aparato escribió entretanto: conflicto, y lo suyo se queda');
    ok(O.apartadas.length === 1 && O.apartadas[0].de === 'O', '…con el cambio de este aparato apartado');
    O.w.cerrar();
    const O2 = await escritor(S1, 'O2', { transporte: tSinRed });
    sinRed = true;
    await O2.w.guardar({ ...enCuenta(), n: 4, de: 'O2' });
    sinRed = false;
    await O2.w.reintentar();
    await O2.w.esperar();
    ok(!O2.w.vista().conflicto && !O2.w.vista().pendiente && enCuenta().de === 'O2', 'al volver la conexión sin cambios ajenos: sale con su condición y llega');
    O2.w.cerrar();
  }

  console.log('\n── D · La regla del servidor (TP-15 B), instalada SOLO en este laboratorio ──');
  {
    borrar();
    psqlArchivo(join(RAIZ, 'supabase/horarios-regla-revision.sql'));
    ok(psql("select tgenabled from pg_trigger where tgname = 'horario_regla_revision'") === 'O', 'la regla queda instalada (en el laboratorio local)');
    const ins = await S1.insertarHorarioPropio(HV_U1, { horarios: [], bloques: [], n: 0 });
    ok(ins.ok === true, 'con la regla: la primera fila sin testigo se inserta');
    const arr = await S1.actualizarHorarioSiRevision(HV_U1, { horarios: [], bloques: [], n: 1 }, null);
    ok(arr.ok && arr.aplicada === true, 'sin testigo antes ni después (arranque): pasa');
    const E = await escritor(S1, 'E');
    const re = await E.w.guardar({ horarios: [], bloques: [], n: 2, de: 'E' });
    ok(re.ok === true && enCuenta().de === 'E' && revEnCuenta() !== '<null>', 'el escritor de E1 escribe su primer testigo');
    const re2 = await E.w.guardar({ ...enCuenta(), n: 3, de: 'E2' });
    ok(re2.ok === true && enCuenta().de === 'E2', 'y los siguientes, con base = la revisión que había: la regla los deja pasar');
    const rev = revEnCuenta();
    const viejo = await S1.supabase.from('app_data').upsert({ user_id: HV_U1, key: 'horarioTop', value: { horarios: [], bloques: [], copiaAntigua: true }, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' });
    ok(viejo.error && viejo.error.code === 'P0001' && /horario_revision_obsoleta/.test(viejo.error.message) && revEnCuenta() === rev, '🚨 una copia ANTIGUA (upsert ciego sin testigo) se rechaza: P0001 horario_revision_obsoleta, y la fila no cambia');
    const sinCond = await S1.supabase.from('app_data').update({ value: { horarios: [], bloques: [], testigo: { revision: 'pirata', base: 'otra' } } }).eq('user_id', HV_U1).eq('key', 'horarioTop').select('key');
    ok(sinCond.error && sinCond.error.code === 'P0001' && revEnCuenta() === rev, 'un update sin condición cuya base no es la revisión que hay: rechazado');
    const repite = await S1.supabase.from('app_data').update({ value: { horarios: [], bloques: [], testigo: { revision: rev, base: rev } } }).eq('user_id', HV_U1).eq('key', 'horarioTop').select('key');
    ok(repite.error && repite.error.code === 'P0001', 'repetir la revisión: rechazado');
    const borra = await S1.supabase.from('app_data').delete().eq('user_id', HV_U1).eq('key', 'horarioTop').select('key');
    ok(borra.error && borra.error.code === 'P0001' && revEnCuenta() === rev, 'borrar la fila desde la aplicación: rechazado');
    const normal = await S1.saveData(HV_U1, 'sueno', { prueba: 'regla' });
    ok(normal.ok === true && psql(`select value->>'prueba' from app_data where user_id='${HV_U1}' and key='sueno'`) === 'regla', 'las demás claves no se enteran de la regla');
    const mal = await escritor(S1, 'MAL', { guardia: guardiaDe('MAL', { baseFalsa: true }) });
    const rm = await mal.w.guardar({ ...enCuenta(), n: 99, de: 'MAL' });
    ok(rm.ok === false && revEnCuenta() === rev && mal.w.vista().cuentas.rechazosRegla > 0, 'si la app escribiera una base que no es (un fallo), la regla la para y el escritor no fuerza nada');
    ok(rm.pendiente === true && !mal.w.vista().conflicto, '…queda pendiente (sin conflicto inventado: en la cuenta sigue lo que vio)');
    mal.w.cerrar(); E.w.cerrar();
    const lo = psql(`select count(*) from app_data where user_id='${HV_U1}' and key='horarioTop'`);
    ok(lo === '1', 'la fila sigue entera');
    psql(`insert into app_data (user_id, key, value) values ('${HV_U2}', 'horarioTop', '{"testigo":{"revision":"u2"}}'::jsonb)`);
    psql(`delete from auth.users where id = '${HV_U2}'`);
    ok(psql(`select count(*) from app_data where user_id='${HV_U2}'`) === '0', 'el borrado en cascada de una cuenta no lo bloquea la regla (lo hace el propietario)');
    psql(`insert into auth.users values ('${HV_U2}') on conflict do nothing`);
    psqlArchivo(join(RAIZ, 'supabase/horarios-regla-revision-deshacer.sql'));
    ok(psql("select count(*) from pg_trigger where tgname = 'horario_regla_revision'") === '0', 'la vuelta atrás quita la regla y su función');
    const tras = await S1.supabase.from('app_data').upsert({ user_id: HV_U1, key: 'horarioTop', value: { horarios: [], bloques: [], copiaAntigua: true }, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' });
    ok(!tras.error && enCuenta().copiaAntigua === true, '…y sin ella, un upsert ciego vuelve a pisar (por eso E2 la necesita)');
  }
} finally {
  try { psqlArchivo(join(RAIZ, 'supabase/horarios-regla-revision-deshacer.sql')); } catch { /* ya no estaba */ }
  borrar();
  proxy.close();
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${n - fallos}/${n} comprobaciones del escritor de horarioTop contra PostgREST local`);
process.exit(fallos ? 1 : 0);
