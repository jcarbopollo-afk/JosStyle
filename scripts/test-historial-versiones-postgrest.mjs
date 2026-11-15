// ═══════════════════════════════════════════════════════════════════════════
// 🕰 HORARIOS · EL HISTORIAL DE VERSIONES CONTRA UN POSTGREST REAL (nivel 3, docs/19 §18.9)
//
// El código DE VERDAD (`src/lib/supabase.js` y `src/lib/historialVersiones.js`) contra un Postgres + PostgREST
// LOCALES y desechables, con la tabla `app_data` y sus cuatro políticas de `supabase/schema.sql`. Comprueba lo que
// el doble de `test-historial-versiones.mjs` no puede: que PostgREST aplica de verdad la condición
// `value->>ultimaOperacion = base`, que RLS aísla a cada usuario y que dos escrituras a la vez no se pisan.
//
// ⚠️ NUNCA contra Supabase de producción. Es OPCIONAL: sin estas variables, se omite (y lo dice).
//   HV_PGRST_URL    PostgREST local, p. ej. http://127.0.0.1:55433
//   HV_JWT_SECRET   el jwt-secret de ese PostgREST
//   HV_PSQL         conexión de superusuario a esa base, p. ej. postgres://postgres@127.0.0.1:55432/postgres
//   HV_U1, HV_U2    dos usuarios de prueba que existan en auth.users de esa base
// Cómo montar el entorno: docs/19 §18.9 («Pruebas», nivel 3).
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-historial-versiones-postgrest.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { register, createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync, rmSync } from 'node:fs';
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
const filasServidor = (u = HV_U1) => JSON.parse(psql(`select coalesce(json_agg(json_build_object('key',key,'value',value) order by key),'[]') from app_data where user_id='${u}' and key like 'horarioVersiones:%'`));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── El proxy: quita el `/rest/v1` de supabase-js, contesta CORS y simula fallos de red. ── */
const PUERTO_PROXY = 55444;
const directivas = []; const registro = [];
/* Métodos «sin red»: toda petición de ese método se corta hasta que la prueba los quite. Un solo corte no basta
   para una lectura: el cliente HTTP de Node (undici) repite solo un GET cuya conexión reutilizada se cae. */
const cortados = new Set();
const destino = new URL(HV_PGRST_URL);
const proxy = http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
  const i = cortados.has(req.method) ? -1 : directivas.findIndex((d) => d.metodo === req.method);
  const d = cortados.has(req.method) ? { modo: 'sin-red' } : i >= 0 ? directivas.splice(i, 1)[0] : { modo: 'normal' };
  const trozos = []; req.on('data', (c) => trozos.push(c));
  req.on('end', async () => {
    const entrada = { metodo: req.method, url: decodeURIComponent(req.url), modo: d.modo, prefer: req.headers.prefer || null };
    registro.push(entrada);
    if (d.modo === 'perder-peticion' || d.modo === 'sin-red') { req.socket.destroy(); return; }
    if (d.espera) await d.espera;
    const headers = { ...req.headers }; delete headers.host;
    const up = http.request({ host: destino.hostname, port: destino.port, method: req.method, path: req.url.replace(/^\/rest\/v1/, ''), headers }, (ur) => {
      const ub = []; ur.on('data', (c) => ub.push(c));
      ur.on('end', () => {
        entrada.estado = ur.statusCode; entrada.respuesta = Buffer.concat(ub).toString().slice(0, 140);
        if (d.modo === 'perder-respuesta') { entrada.respuestaPerdida = true; if (d.cortarDespues) cortados.add(d.cortarDespues); req.socket.destroy(); return; }
        res.writeHead(ur.statusCode, { ...ur.headers, ...cors }); res.end(Buffer.concat(ub));
      });
    });
    up.end(Buffer.concat(trozos));
  });
});
await new Promise((r) => proxy.listen(PUERTO_PROXY, '127.0.0.1', r));
const URL_PROXY = `http://127.0.0.1:${PUERTO_PROXY}`;

/* ── Dos instancias de supabase.js, cada una con la sesión de un usuario (la clave anónima ES su token). ── */
const entornos = { 1: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1) }, 2: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U2) } };
register('data:text/javascript,' + encodeURIComponent(`const E = ${JSON.stringify(entornos)};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = url.match(/\\/lib\\/supabase\\.js\\?hv=(\\d)$/);
  if (m) return { ...r, source: String(r.source).replace(/import\\.meta\\.env/g, JSON.stringify(E[m[1]])), shortCircuit: true };
  return r;
}`));
const S1 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?hv=1');
const S2 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?hv=2');
const H = await import(pathToFileURL(join(RAIZ, 'src/lib/historialVersiones.js')).href);
const Y = await import(pathToFileURL(join(RAIZ, 'src/lib/sincronizacion.js')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const almacen = (inicial = {}) => { const m = new Map(Object.entries(inicial)); return { leer: (k) => (m.has(k) ? m.get(k) : null), escribir: (k, v) => m.set(k, String(v)), copia: () => Object.fromEntries(m), claves: () => [...m.keys()] }; };
const mutex = () => { let c = Promise.resolve(); return (fn) => { const r = c.then(fn, fn); c = r.catch(() => {}); return r; }; };
const escritor = (S, u, alm = almacen(), candado = mutex()) => H.crearEscritorDeVersiones({ transporte: S.transporteDeVersiones, usuario: u, almacen: alm, candado });
psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);

try {
  console.log('\n── A · La condición, con el transporte real de supabase.js ──');
  {
    const k = 'horarioVersiones:pg-a';
    const v = (n2, ult) => ({ formato: 1, aparato: 'pg-a', secuencia: n2, ultimaOperacion: ult, operaciones: Array.from({ length: n2 }, (_, i) => ({ opId: i === n2 - 1 ? ult : `o${i}`, n: i + 1, tipo: 'eliminar', versionId: 'x' })) });
    const ins = await S1.insertarRegistroDeVersiones(HV_U1, k, v(1, 'o-base'));
    ok(ins.ok, 'insertarRegistroDeVersiones crea la fila (201)');
    const dup = await S1.insertarRegistroDeVersiones(HV_U1, k, v(1, 'otra'));
    ok(dup.conflicto === true && dup.error.code === '23505', 'insertar otra vez la misma fila: conflicto 409 / 23505');
    const bien = await S1.actualizarRegistroDeVersiones(HV_U1, k, v(2, 'o-2'), 'o-base');
    const pet = registro.filter((e) => e.metodo === 'PATCH').at(-1);
    ok(bien.ok && bien.aplicada === true, 'actualizar con la base correcta: aplicada (PostgREST devuelve la fila)');
    ok(/value->>ultimaOperacion=eq\.o-base/.test(pet.url) && /return=representation/.test(pet.prefer || ''), `…la petición real lleva la condición y pide la fila: ${pet.metodo} ${pet.url.replace(/user_id=eq\.[^&]+/, 'user_id=eq.<u1>')}`);
    const mal = await S1.actualizarRegistroDeVersiones(HV_U1, k, v(2, 'o-pisa'), 'o-base');
    ok(mal.ok && mal.aplicada === false && psql(`select value->>'ultimaOperacion' from app_data where key='${k}'`) === 'o-2',
      'con la base vieja: aplicada false (200 y []) y la fila sigue igual');
    // Diez escrituras simultáneas sobre la misma base, treinta rondas, con el código real.
    let rondas = 0;
    for (let r = 0; r < 30; r++) {
      const actual = JSON.parse(psql(`select value from app_data where key='${k}'`));
      const res = await Promise.all(Array.from({ length: 10 }, (_, j) => S1.actualizarRegistroDeVersiones(HV_U1, k,
        { ...actual, secuencia: actual.secuencia + 1, ultimaOperacion: `r${r}-${j}`, operaciones: [...actual.operaciones, { opId: `r${r}-${j}`, n: actual.secuencia + 1, tipo: 'eliminar', versionId: 'x' }] }, actual.ultimaOperacion)));
      if (res.filter((x) => x.aplicada).length === 1 && res.filter((x) => x.ok && !x.aplicada).length === 9) rondas += 1;
    }
    ok(rondas === 30 && JSON.parse(psql(`select value from app_data where key='${k}'`)).operaciones.length === 32, '30 rondas × 10 escrituras simultáneas: un ganador por ronda y ninguna aceptada perdida');
  }

  console.log('\n── B · saveData real rechaza el historial sin tocar la red ──');
  {
    Y.empezarSesionDeDatos(HV_U1);
    const antes = registro.length;
    const errOriginal = console.error; console.error = () => {};
    const r = await S1.saveData(HV_U1, 'horarioVersiones:pg-a', { formato: 1 });
    console.error = errOriginal;
    ok(r.ok === false && r.protegida === true && registro.length === antes, 'saveData de horarioVersiones:* → protegida, y ninguna petición sale hacia PostgREST');
    ok(JSON.parse(psql("select value from app_data where key='horarioVersiones:pg-a'")).operaciones.length === 32, '…y la fila del servidor no ha cambiado');
    const normal = await S1.saveData(HV_U1, 'horarioTop', { prueba: true });
    ok(normal.ok === true && psql("select value->>'prueba' from app_data where key='horarioTop'") === 'true', 'una clave normal sigue guardándose con saveData (upsert real)');
  }

  console.log('\n── C · Lectura por prefijo y RLS ──');
  {
    await S2.insertarRegistroDeVersiones(HV_U2, 'horarioVersiones:del-2', { formato: 1, aparato: 'del-2', secuencia: 1, ultimaOperacion: 'u2', operaciones: [{ opId: 'u2', n: 1, tipo: 'eliminar', versionId: 'y' }] });
    const t1 = await S1.leerRegistrosDeVersiones(HV_U1);
    ok(t1.ok && t1.filas.length === 1 && t1.filas[0].key === 'horarioVersiones:pg-a', 'el usuario 1 lee solo SU fila del historial (ni horarioTop ni la del usuario 2)');
    const ajenaLeida = await S2.leerRegistrosDeVersiones(HV_U1);
    ok(ajenaLeida.ok && ajenaLeida.filas.length === 0, 'el usuario 2 pidiendo las filas del usuario 1: RLS devuelve cero');
    const base = psql("select value->>'ultimaOperacion' from app_data where key='horarioVersiones:pg-a'");
    const ajenaEscrita = await S2.actualizarRegistroDeVersiones(HV_U1, 'horarioVersiones:pg-a', { formato: 1 }, base);
    ok(ajenaEscrita.ok && ajenaEscrita.aplicada === false && psql("select value->>'ultimaOperacion' from app_data where key='horarioVersiones:pg-a'") === base, 'el usuario 2 no puede modificar la fila del usuario 1 (cero filas), aunque conozca la base');
    const intruso = await S2.insertarRegistroDeVersiones(HV_U1, 'horarioVersiones:intruso', { formato: 1 });
    ok(!intruso.ok && intruso.definitivo === true && intruso.error.code === '42501', 'el usuario 2 no puede insertar a nombre del usuario 1 (403 / 42501, definitivo)');
    psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);
  }

  console.log('\n── D · El escritor real: respuestas perdidas, reintentos, tardías, conflictos ──');
  {
    const alm = almacen(); const w = escritor(S1, HV_U1, alm);
    const r0 = await w.crearVersion({ contenido: { n: 0 }, nombre: 'Primera' });
    ok(r0.estado === 'confirmada' && filasServidor()[0].value.operaciones[0].version.id === r0.opId, 'primera versión confirmada; Version.id = opId en el servidor');
    directivas.push({ metodo: 'PATCH', modo: 'perder-respuesta' });
    const r1 = await w.crearVersion({ contenido: { n: 1 } });
    const perdida = registro.filter((e) => e.metodo === 'PATCH').at(-1);
    ok(perdida.respuestaPerdida && perdida.estado === 200 && r1.estado === 'confirmada', 'PostgREST aplicó (200) y la respuesta se perdió: al releer, confirmada por su opId');
    directivas.push({ metodo: 'PATCH', modo: 'perder-peticion' });
    const r2 = await w.crearVersion({ contenido: { n: 2 } });
    ok(r2.estado === 'sin_confirmar' && !filasServidor()[0].value.operaciones.some((o) => o.opId === r2.opId), 'petición perdida: «sin confirmar» y no está en el servidor');
    const r2b = await w.reintentar(r2.opId);
    ok(r2b.estado === 'confirmada' && filasServidor()[0].value.operaciones.filter((o) => o.opId === r2.opId).length === 1, 'el reintento (mismo opId, misma base) se aplica una sola vez');
    /* 🐛 Auditoría 2026-11-09: aquí había una comprobación VACÍA («reintentar lo ya confirmado no añade nada»):
       `reintentar` de algo ya confirmado contesta «no está en memoria» sin preguntar al servidor. Ahora se dice lo
       que es, y la ruta de verdad —aplicada en el servidor, respuesta perdida y comprobación sin respuesta— va debajo. */
    const getsAntes = registro.filter((e) => e.metodo === 'GET').length;
    const yaConf = await w.reintentar(r1.opId);
    ok(yaConf.estado === 'no_aplicada' && yaConf.motivo === 'no_esta_en_memoria' && registro.filter((e) => e.metodo === 'GET').length === getsAntes && filasServidor()[0].value.operaciones.length === 3,
      'reintentar algo YA confirmado: «no está en memoria», sin consultar el servidor y sin añadir nada');
    // Aplicada por PostgREST, respuesta perdida Y, desde ese momento, sin red para leer: la comprobación no llega.
    directivas.push({ metodo: 'PATCH', modo: 'perder-respuesta', cortarDespues: 'GET' });
    const r5 = await w.crearVersion({ contenido: { n: 5 } });
    const patch5 = registro.filter((e) => e.metodo === 'PATCH').at(-1);
    const tras5 = registro.slice(registro.indexOf(patch5) + 1);
    const getPerdido = tras5.filter((e) => e.metodo === 'GET');
    ok(patch5.respuestaPerdida && patch5.estado === 200 && getPerdido.length >= 1 && getPerdido.every((e) => e.modo === 'sin-red' && e.estado === undefined) && r5.estado === 'sin_confirmar'
      && filasServidor()[0].value.operaciones.filter((o) => o.opId === r5.opId).length === 1 && w.enMemoria().includes(r5.opId),
      'PostgREST la aplicó (200), la respuesta se perdió y la comprobación no tuvo respuesta: «sin confirmar», en memoria');
    cortados.delete('GET');   // vuelve la red
    const ya5 = w.cuentas.yaAplicadas; const n5 = registro.length;
    const r5b = await w.reintentar(r5.opId);
    const desde = registro.slice(n5);
    ok(r5b.estado === 'confirmada' && r5b.opId === r5.opId, '…el reintento desde la MISMA instancia la confirma (no «no está en memoria»)');
    ok(desde.some((e) => e.metodo === 'GET' && e.estado === 200) && !desde.some((e) => e.metodo === 'PATCH' || e.metodo === 'POST') && w.cuentas.yaAplicadas === ya5 + 1,
      '…porque lee el servidor de verdad (GET 200), encuentra el opId y no envía nada: yaAplicadas sube exactamente 1');
    ok(filasServidor()[0].value.operaciones.length === 4 && filasServidor()[0].value.operaciones.filter((o) => o.opId === r5.opId).length === 1,
      '…y en la base de datos sigue habiendo UNA sola copia');
    let soltar; const retenida = new Promise((r) => { soltar = r; });
    directivas.push({ metodo: 'PATCH', modo: 'retener', espera: retenida });
    const tardia = w.crearVersion({ contenido: { n: 3 } });
    await espera(150);
    const otra = escritor(S1, HV_U1, alm);   // otra pestaña, sin candado común a propósito
    const r4 = await otra.crearVersion({ contenido: { n: 4 } });
    soltar(); const r3 = await tardia;
    const vista = H.vistaFusionadaDeVersiones(filasServidor());
    ok(r4.estado === 'confirmada' && r3.estado === 'confirmada' && w.cuentas.rechazadasPorCondicion >= 1 && vista.visibles.length === 6,
      `la escritura tardía con base vieja la rechaza PostgREST y se reconstruye: 6 versiones (${w.cuentas.rechazadasPorCondicion} rechazo)`);
    const man = await w.crearVersion({ contenido: { m: 1 }, motivo: 'manual', nombre: 'Borrar' });
    const del = await w.eliminarVersionManual(man.opId, { confirmado: true });
    const tarde = escritor(S1, HV_U1, almacen());   // un aparato que vuelve tras días
    await tarde.crearVersion({ contenido: { tarde: 1 } });
    const v2 = H.vistaFusionadaDeVersiones(filasServidor());
    ok(del.estado === 'confirmada' && !v2.visibles.some((x) => x.id === man.opId) && v2.eliminadas.includes(man.opId), 'una eliminación confirmada no reaparece cuando otro aparato escribe después');
    const auto = await w.crearVersion({ contenido: {}, motivo: 'migracion' });
    ok((await w.eliminarVersionManual(auto.opId, { confirmado: true })).motivo === 'version_automatica', 'una automática no se puede eliminar');
    // Tres instalaciones con el mismo id creando la fila a la vez.
    psql(`delete from app_data where user_id='${HV_U1}'`);
    const compartido = almacen();
    const tres = [escritor(S1, HV_U1, compartido), escritor(S1, HV_U1, compartido), escritor(S1, HV_U1, compartido)];
    const rs = await Promise.all(tres.map((x, j) => x.crearVersion({ contenido: { j } })));
    for (const [j, r] of rs.entries()) if (r.estado === 'no_aplicada') await tres[j].reintentar(r.opId);
    ok(rs.every((r) => r.estado === 'confirmada' || r.motivo === 'conflictos_repetidos') && H.vistaFusionadaDeVersiones(filasServidor()).visibles.length === 3,
      'tres a la vez creando la fila: conflicto de clave primaria tratado, las tres acaban en el servidor');
  }

  console.log('\n── E · Concurrencia y fallos al azar, contra PostgREST ──');
  for (const semilla0 of [20261109, 31337]) {
    psql(`delete from app_data where user_id='${HV_U1}'`);
    let semilla = semilla0; const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
    const almA = almacen(); const cA = mutex();
    const A1 = escritor(S1, HV_U1, almA, cA), A2 = escritor(S1, HV_U1, almA, cA), B = escritor(S1, HV_U1);
    const confirmadas = new Set(); const eliminadas = new Set(); const violaciones = []; const previo = new Map();
    let pasos = 0;
    const comprobar = () => {
      const filas = filasServidor(); const v = H.vistaFusionadaDeVersiones(filas);
      for (const f of filas) { const ids = f.value.operaciones.map((o) => o.opId); const p = previo.get(f.key) || []; if (p.some((id, i) => ids[i] !== id)) violaciones.push(`${f.key} perdió operaciones`); previo.set(f.key, ids); }
      const todas = new Set(filas.flatMap((f) => f.value.operaciones.map((o) => o.opId)));
      for (const id of confirmadas) if (!todas.has(id)) violaciones.push(`falta ${id}`);
      for (const id of eliminadas) if (v.visibles.some((x) => x.id === id)) violaciones.push(`reapareció ${id}`);
    };
    const paso = async (w) => {
      const v = H.vistaFusionadaDeVersiones(filasServidor()); const man = v.visibles.filter((x) => x.motivo === 'manual');
      const f = azar(); const metodo = filasServidor().some((x) => x.key === w.clave()) ? 'PATCH' : 'POST';
      if (f < 0.15) directivas.push({ metodo, modo: 'perder-respuesta' }); else if (f < 0.25) directivas.push({ metodo, modo: 'perder-peticion' });
      else if (f < 0.35) directivas.push({ metodo, modo: 'retener', espera: espera(20 + Math.floor(azar() * 80)) });
      let r; let vid = null; const x = azar();
      if (x < 0.5 || !man.length) r = await w.crearVersion({ contenido: { pasos }, motivo: azar() < 0.7 ? 'manual' : 'confirmacion' });
      else if (x < 0.75) { vid = man[Math.floor(azar() * man.length)].id; r = await w.eliminarVersionManual(vid, { confirmado: true }); }
      else r = await w.renombrarVersionManual(man[Math.floor(azar() * man.length)].id, `n${pasos}`);
      if (r.opId && r.estado !== 'confirmada' && azar() < 0.7) r = await w.reintentar(r.opId);
      pasos += 1; if (r.estado === 'confirmada') { if (r.opId) confirmadas.add(r.opId); if (vid) eliminadas.add(vid); }
      comprobar();
    };
    const bucle = async (w, k) => { for (let i = 0; i < k; i++) { await paso(w); await espera(Math.floor(azar() * 10)); } };
    await Promise.all([bucle(A1, 30), bucle(A2, 30), bucle(B, 30)]);
    const clon = escritor(S1, HV_U1, almacen(almA.copia()));
    await Promise.all([bucle(A1, 25), bucle(clon, 25), bucle(B, 15)]);
    ok(violaciones.length === 0, `semilla ${semilla0}: ${pasos} pasos con dos pestañas, otro aparato y un clon (${confirmadas.size} confirmadas): sin pérdidas, sobrescrituras ni reapariciones ${violaciones.slice(0, 2).join(' | ')}`);
  }

  console.log('\n── F · Chromium: dos pestañas reales con el código empaquetado ──');
  {
    psql(`delete from app_data where user_id='${HV_U1}'`);
    const esbuild = createRequire(import.meta.url)('esbuild');
    const salida = join(tmpdir(), `hv-${process.pid}.js`);
    const entrada = `import { transporteDeVersiones } from '${join(RAIZ, 'src/lib/supabase.js')}';
import { crearEscritorDeVersiones, almacenDelNavegador, candadoDelNavegador } from '${join(RAIZ, 'src/lib/historialVersiones.js')}';
window.hv = crearEscritorDeVersiones({ transporte: transporteDeVersiones, usuario: ${JSON.stringify(HV_U1)}, almacen: almacenDelNavegador(), candado: candadoDelNavegador() });
window.listo = true;`;
    await esbuild.build({ stdin: { contents: entrada, resolveDir: RAIZ, loader: 'js' }, bundle: true, format: 'iife', outfile: salida, logLevel: 'silent',
      define: { 'import.meta.env': JSON.stringify(entornos[1]) } });
    const js = readFileSync(salida, 'utf8'); rmSync(salida, { force: true });
    const pagina = http.createServer((req, res) => {
      if (req.url.startsWith('/hv.js')) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(js); }
      res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><meta charset="utf-8"><script src="/hv.js"></script>');
    });
    await new Promise((r) => pagina.listen(55445, '127.0.0.1', r));
    const { chromium } = createRequire(import.meta.url)('playwright');
    /* El mismo navegador fijo que usa el recorrido (test-app-real.mjs) cuando existe. */
    const CHROMIUM_FIJO = '/opt/pw-browsers/chromium';
    const { existsSync } = await import('node:fs');
    const nav = await chromium.launch(existsSync(CHROMIUM_FIJO) ? { executablePath: CHROMIUM_FIJO } : {}); const errores = [];
    try {
      const ctx = await nav.newContext();
      const p1 = await ctx.newPage(); const p2 = await ctx.newPage();
      for (const p of [p1, p2]) { p.on('pageerror', (e) => errores.push(String(e))); await p.goto('http://127.0.0.1:55445/'); await p.waitForFunction(() => window.listo); }
      const [a, b] = await Promise.all([p1, p2].map((p, k) => p.evaluate(async (k2) => {
        const rs = await Promise.all(Array.from({ length: 15 }, (_, i) => window.hv.crearVersion({ contenido: { k2, i } }))); return { rs, cuentas: window.hv.cuentas };
      }, k)));
      const todas = [...a.rs, ...b.rs]; const vista = H.vistaFusionadaDeVersiones(filasServidor());
      ok(todas.every((r) => r.estado === 'confirmada') && filasServidor().length === 1 && vista.visibles.length === 30,
        `dos pestañas, 30 creaciones a la vez con navigator.locks: las 30 confirmadas en una fila (${a.cuentas.rechazadasPorCondicion + b.cuentas.rechazadasPorCondicion} rechazos: el candado las pone en fila)`);
      await ctx.setOffline(true);
      const sin = await p2.evaluate(async () => window.hv.crearVersion({ contenido: { sin: 1 } }));
      const local = await p2.evaluate(async () => ({ claves: Object.keys(localStorage), todo: JSON.stringify({ ...localStorage }), idb: (await indexedDB.databases()).length }));
      ok(sin.estado !== 'confirmada', `sin conexión no se da por hecha (${sin.estado}, ${sin.motivo})`);
      ok(local.claves.every((x) => /^josstyle:historialVersiones:(aparato|confirmada|sesiones)$/.test(x)) && !local.todo.includes(String(sin.opId)) && local.idb === 0,
        'en localStorage solo aparato, confirmada y sesiones; ni la operación ni nada pendiente; IndexedDB vacía');
      await ctx.setOffline(false);
      const re = await p2.evaluate(async (id) => window.hv.reintentar(id), sin.opId);
      ok(re.estado === 'confirmada' && filasServidor()[0].value.operaciones.filter((o) => o.opId === sin.opId).length === 1, 'al volver la conexión, el reintento con el mismo opId entra una sola vez');
      ok(errores.length === 0, 'ningún error de JavaScript en las pestañas');
    } finally { await nav.close(); pagina.close(); }
  }
} finally {
  psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);
  proxy.closeAllConnections?.(); proxy.close();
}
console.log(`\n${n - fallos}/${n} comprobaciones correctas (PostgREST real)`);
process.exit(fallos ? 1 : 0);
