// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · A-BIS — EL TRANSPORTE DE LA GUARDIA CONTRA UN POSTGREST REAL (nivel 3, especificación A-bis §13)
//
// El código DE VERDAD (`src/lib/supabase.js` y `src/lib/guardiaHorario.js`) contra un Postgres + PostgREST LOCALES y
// desechables, con la tabla `app_data` y sus cuatro políticas de `supabase/schema.sql`. Comprueba lo que el doble de
// `test-guardia-horario.mjs` no puede:
//   · que PostgREST aplica la condición `value->>ultimaOperacion = base` y que la carrera de inserciones da 23505;
//   · el listado por prefijo con RLS (cada usuario solo ve sus filas);
//   · que un `insert` SIN `updated_at` toma la hora del servidor y un `update` SIN `updated_at` la conserva;
//   · y una comprobación entera del controlador (E2 → intención → testigo → «escrito»).
//
// ⚠️ NUNCA contra Supabase de producción. Es OPCIONAL: sin estas variables, se omite (y lo dice). Son las mismas que
// la prueba de nivel 3 del historial de versiones:
//   HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2   (ver `test-historial-versiones-postgrest.mjs`)
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-guardia-horario-postgrest.mjs
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
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── El proxy: quita el `/rest/v1` de supabase-js y contesta CORS. ── */
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
  const m = url.match(/\\/lib\\/supabase\\.js\\?gh=(\\d)$/);
  if (m) return { ...r, source: String(r.source).replace(/import\\.meta\\.env/g, JSON.stringify(E[m[1]])), shortCircuit: true };
  return r;
}`));
const S1 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?gh=1');
const S2 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?gh=2');
const G = await import(pathToFileURL(join(RAIZ, 'src/lib/guardiaHorario.js')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const fila = (ap, sec, ult, extra = {}) => ({ formato: 1, aparato: ap, secuencia: sec, ultimaOperacion: ult, primeraVezA: { en: 'e', versionApp: '3.162.0' }, etiqueta: null, visitas: { '3.162.0': { primera: {}, ultima: { fecha: '2026-11-14' } } }, testigo: { intenciones: [] }, detecciones: [], retiradas: [], resoluciones: [], ...extra });
psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);

try {
  console.log('\n── A · insert sin updated_at, la condición, 23505 y updated_at conservado ──');
  {
    const k = 'horarioGuardia:pg-a';
    const ins = await S1.insertarFilaDeGuardiaHorario(HV_U1, k, fila('pg-a', 1, 'o1'));
    ok(ins.ok, 'insertar la fila (201)');
    ok(!/updated_at/.test(registro.filter((e) => e.metodo === 'POST').at(-1).cuerpo), 'el insert NO envía updated_at');
    const creada = psql(`select extract(epoch from updated_at) from app_data where user_id='${HV_U1}' and key='${k}'`);
    const ahora = Number(psql('select extract(epoch from now())'));
    ok(Math.abs(Number(creada) - ahora) < 60, `el servidor pone updated_at al crear (${creada})`);
    const dup = await S1.insertarFilaDeGuardiaHorario(HV_U1, k, fila('pg-a', 1, 'otra'));
    ok(dup.conflicto === true, 'insertar otra vez: conflicto (23505)');
    await espera(1100);
    const bien = await S1.actualizarFilaDeGuardiaHorario(HV_U1, k, fila('pg-a', 2, 'o2'), 'o1');
    ok(bien.ok && bien.aplicada === true, 'actualizar con la base correcta: aplicada');
    ok(!/updated_at/.test(registro.filter((e) => e.metodo === 'PATCH').at(-1).cuerpo), 'el update NO envía updated_at');
    ok(psql(`select extract(epoch from updated_at) from app_data where user_id='${HV_U1}' and key='${k}'`) === creada, 'un update sin updated_at conserva la hora de creación');
    const mal = await S1.actualizarFilaDeGuardiaHorario(HV_U1, k, fila('pg-a', 2, 'o-pisa'), 'o1');
    ok(mal.ok && mal.aplicada === false && psql(`select value->>'ultimaOperacion' from app_data where key='${k}'`) === 'o2', 'con la base vieja: no aplicada y la fila sigue igual');
    // Carrera de inserciones: diez a la vez sobre una fila que no existe.
    const res = await Promise.all(Array.from({ length: 10 }, (_, j) => S1.insertarFilaDeGuardiaHorario(HV_U1, 'horarioGuardia:pg-b', fila('pg-b', 1, `i${j}`))));
    ok(res.filter((x) => x.ok).length === 1 && res.filter((x) => x.conflicto).length === 9, 'carrera de diez inserciones: una entra, nueve 23505');
    // Diez actualizaciones a la vez sobre la misma base: solo una.
    const act = await Promise.all(Array.from({ length: 10 }, (_, j) => S1.actualizarFilaDeGuardiaHorario(HV_U1, k, fila('pg-a', 3, `u${j}`), 'o2')));
    ok(act.filter((x) => x.aplicada).length === 1 && act.filter((x) => x.ok && !x.aplicada).length === 9, 'diez actualizaciones sobre la misma base: aplica una');
  }

  console.log('\n── B · El listado por prefijo con RLS, y la lectura propia de horarioTop ──');
  {
    await S2.insertarFilaDeGuardiaHorario(HV_U2, 'horarioGuardia:pg-u2', fila('pg-u2', 1, 'x'));
    psql(`insert into app_data (user_id, key, value) values ('${HV_U1}', 'horarioVersiones:no-es-guardia', '{}'::jsonb)`);
    const l1 = await S1.leerFilasDeGuardiaHorario(HV_U1);
    ok(l1.ok && l1.filas.every((f) => f.key.startsWith('horarioGuardia:')) && l1.filas.length === 2, `el usuario 1 ve solo SUS filas de la guardia (${l1.filas && l1.filas.map((f) => f.key).join(', ')})`);
    ok(l1.filas.every((f) => typeof f.updated_at === 'string'), '…con su updated_at');
    const l2 = await S2.leerFilasDeGuardiaHorario(HV_U2);
    ok(l2.ok && l2.filas.length === 1 && l2.filas[0].key === 'horarioGuardia:pg-u2', 'el usuario 2 solo ve la suya (RLS)');
    const sin = await S1.leerHorarioPropio(HV_U1);
    ok(sin.ok && sin.existe === false, 'sin fila de horarioTop: existe = false');
    psql(`insert into app_data (user_id, key, value) values ('${HV_U1}', 'horarioTop', 'null'::jsonb)`);
    const nulo = await S1.leerHorarioPropio(HV_U1);
    ok(nulo.ok && nulo.existe === true && nulo.valor === null, 'con la fila a null: existe = true y valor null (4a, no «fila ausente»)');
    psql(`delete from app_data where user_id='${HV_U1}' and key='horarioTop'`);
  }

  console.log('\n── C · Una comprobación entera del controlador, contra el servidor de verdad ──');
  {
    psql(`delete from app_data where user_id='${HV_U1}' and key like 'horarioGuardia:%'`);
    psql(`insert into app_data (user_id, key, value) values ('${HV_U1}', 'horarioTop', '{"horarios":[],"bloques":[]}'::jsonb)`);
    const transporte = { ...S1.transporteDeGuardia, leerHorario: S1.leerHorarioPropio };
    const g = G.crearGuardiaDeHorario({ transporte, usuario: HV_U1, aparato: 'pg-c', candado: null, versionApp: '3.162.0' });
    await g.comprobar({});
    await g.esperar();
    ok(g.vista().estado === 'E2', 'E2 sin filas ni testigo');
    const guardar = async (actual) => {
      const p = g.prepararEscritura({ ...actual, n: Math.random() }, actual);
      await S1.supabase.from('app_data').update({ value: p.valor }).eq('user_id', HV_U1).eq('key', 'horarioTop');
      g.despuesDeGuardar(p, Promise.resolve());
      await g.esperar();
      return p;
    };
    const p1 = await guardar({ horarios: [], bloques: [] });
    ok(!p1.conTestigo && JSON.parse(psql(`select value from app_data where user_id='${HV_U1}' and key='horarioGuardia:pg-c'`)).testigo.intenciones.length === 1, 'el primer guardado sale sin testigo y la intención queda en el servidor');
    const p2 = await guardar(p1.valor);
    const f = JSON.parse(psql(`select value from app_data where user_id='${HV_U1}' and key='horarioGuardia:pg-c'`));
    ok(p2.conTestigo && f.testigo.escrito && f.testigo.escrito.ultima.revision === p2.revision, 'el segundo lleva testigo y la relectura apunta «escrito»');
    psql(`update app_data set value = value - 'testigo' - 'version' where user_id='${HV_U1}' and key='horarioTop'`);
    const z = G.crearGuardiaDeHorario({ transporte, usuario: HV_U1, aparato: 'pg-z', candado: null, versionApp: '3.162.0' });
    await z.comprobar({ guardiaA: { motivo: null } });
    await z.esperar();
    const regs = JSON.parse(psql(`select value from app_data where user_id='${HV_U1}' and key='horarioGuardia:pg-z'`)).detecciones;
    ok(z.vista().estado === 'B' && regs.length === 1 && regs[0].clase === 'perdida' && z.motivoBloqueo() === null, 'una copia antigua simulada → B, registrada y confirmada en el servidor (deja de bloquear)');
  }
} finally {
  psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);
  proxy.close();
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${n - fallos}/${n} comprobaciones de la guardia contra PostgREST local`);
if (fallos) process.exit(1);
