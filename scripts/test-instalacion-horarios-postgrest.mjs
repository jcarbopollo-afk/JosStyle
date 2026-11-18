// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · BLOQUE 1 — LA INSTALACIÓN CONJUNTA Y LA PUBLICACIÓN SEGURA, CONTRA POSTGRES (nivel 3, solo laboratorio)
//
// `supabase/horarios-instalacion.sql` (R1 + la red de rescate, solo `horarioTop` + P4, en UNA transacción; decisiones
// D1 b y D3 de Josué del 2026-11-18) en una BASE DE DATOS APARTE creada por esta prueba en el Postgres local, con su
// propio PostgREST, y quitada al terminar. El laboratorio de las demás pruebas no se toca, y esta prueba NO ejecuta
// `horarios-protegido-deshacer.sql` ni instala `horarios-regla-revision.sql` (los dos prohibidos en producción):
//   A · el archivo generado es exactamente sus tres piezas, en orden, dentro de BEGIN/COMMIT, sin nada que no admita
//       una transacción
//   B · la instalación completa (y lo que dice el protocolo)
//   C · un fallo provocado a mitad (tras R1, tras la red, en la comprobación final y por un bloqueo de `app_data`):
//       no queda NADA instalado y los datos no cambian
//   D · reinstalar es seguro (no toca copias, operaciones ni datos), y un fallo a mitad de una reinstalación deja la
//       instalación de antes intacta
//   E · antes de publicar (solo la versión antigua): lo suyo del horario se aparta; Estudios y la papelera, como hoy
//   F · la versión nueva con P4: guarda; lo antiguo se aparta; un conflicto entre dos aparatos; recuperar lo apartado
//       eligiendo, sin pisar lo de después
//   G · el despliegue falla y se vuelve atrás: el orden equivocado (la versión anterior con P4 puesto) y el correcto
//       (P4 → versión anterior → red), sin perder ni una copia ni una operación; y volver a instalar después
//
// ⚠️ NUNCA contra Supabase alojado. Es OPCIONAL: sin las variables del laboratorio se omite (y lo dice):
//   HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2, HV_POSTGREST_BIN
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-instalacion-horarios-postgrest.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { register } from 'node:module';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';

const { HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2, HV_POSTGREST_BIN } = process.env;
if (!HV_JWT_SECRET || !HV_PSQL || !HV_U1 || !HV_U2 || !HV_POSTGREST_BIN) {
  console.log('  ⏭ omitida: no hay un laboratorio local configurado (HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2, HV_POSTGREST_BIN)');
  process.exit(0);
}
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(HV_PSQL)) {
  console.log('  ✗ se niega: esta prueba solo corre contra un Postgres en este mismo aparato');
  process.exit(1);
}

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (r) => readFileSync(join(RAIZ, r), 'utf8');
const SQL_INSTALACION = join(RAIZ, 'supabase/horarios-instalacion.sql');
const SQL_ANTIGUAS_DESHACER = join(RAIZ, 'supabase/horarios-versiones-antiguas-deshacer.sql');
const SQL_RESCATE_DESHACER = join(RAIZ, 'supabase/horarios-rescate-deshacer.sql');
const { instalacionHorarios, PIEZAS_INSTALACION, ESPERA_BLOQUEO } = await import(pathToFileURL(join(RAIZ, 'scripts/generar-instalacion-horarios.mjs')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const dormir = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/* ── La base de datos aparte (no la del laboratorio de las demás pruebas) ── */
const BASE = 'josstyle_lab_instalacion';
const URL_ADMIN = HV_PSQL;
const URL_BASE = HV_PSQL.replace(/\/[^/?]*(\?|$)/, `/${BASE}$1`);
const PG_ENV = { ...process.env, PGOPTIONS: '-c client_min_messages=warning' };
const psqlEn = (url, sql) => execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-Atc', sql], { env: PG_ENV }).toString().trim();
const psql = (sql) => psqlEn(URL_BASE, sql);
const TMP = mkdtempSync(join(tmpdir(), 'josstyle-instalacion-'));
let nArchivo = 0;
/* Ejecuta un archivo (o un texto) entero con psql, parando al primer error. Devuelve `{ ok, error }`. */
const ejecutar = (rutaOTexto, { texto = false } = {}) => {
  let ruta = rutaOTexto;
  if (texto) { nArchivo += 1; ruta = join(TMP, `variante-${nArchivo}.sql`); writeFileSync(ruta, rutaOTexto); }
  try { execFileSync('psql', [URL_BASE, '-v', 'ON_ERROR_STOP=1', '-q', '-f', ruta], { env: PG_ENV, stdio: ['ignore', 'pipe', 'pipe'] }); return { ok: true }; }
  catch (e) { return { ok: false, error: String((e.stderr && e.stderr.toString()) || e.message) }; }
};
const lit = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;

/* Lo mínimo de Supabase en la base aparte: el esquema auth con su uid(), sus dos usuarios, `app_data` TAL COMO está en
   `supabase/schema.sql` (la misma definición y las mismas cuatro políticas) y los permisos de los roles de la API (los
   roles son del clúster y ya existen en el laboratorio). */
const APP_DATA = (() => {
  const s = leer('supabase/schema.sql');
  const i = s.indexOf('create table if not exists app_data');
  const j = s.indexOf(';', s.indexOf('create policy "delete propio" on app_data'));
  if (i < 0 || j < 0) throw new Error('No encuentro app_data en supabase/schema.sql');
  return s.slice(i, j + 1);
})();
const ARRANQUE = `
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
insert into auth.users values ('${HV_U1}'), ('${HV_U2}');
${APP_DATA}
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on app_data to anon, authenticated;
`;
const crearBase = () => {
  psqlEn(URL_ADMIN, `drop database if exists ${BASE} with (force)`);
  psqlEn(URL_ADMIN, `create database ${BASE}`);
  const r = ejecutar(ARRANQUE, { texto: true });
  if (!r.ok) throw new Error(`No se pudo preparar la base aparte: ${r.error}`);
};

/* El estado de la instalación, leído del catálogo. */
const estado = () => JSON.parse(psql(`select json_build_object(
  'funciones', (select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname like 'protegido\\_%'),
  'esquema', to_regnamespace('protegido_interno') is not null,
  'tablas', (select count(*) from pg_class where oid in (to_regclass('public.operaciones_protegidas'), to_regclass('public.copias_apartadas'), to_regclass('public.operaciones_corte'))),
  'rescate', (select count(*) from pg_trigger where tgname = 'horarios_rescate'),
  'p4', (select count(*) from pg_trigger where tgname = 'horarios_versiones_antiguas'),
  'reglaE1', (select count(*) from pg_trigger where tgname = 'horario_regla_revision'))`));
const vacio = (e) => e.funciones === 0 && !e.esquema && e.tablas === 0 && e.rescate === 0 && e.p4 === 0 && e.reglaE1 === 0;
const completo = (e) => e.funciones === 7 && e.esquema && e.tablas === 3 && e.rescate === 1 && e.p4 === 1 && e.reglaE1 === 0;
const valor = (k, uid = HV_U1) => { const t = psql(`select value::text from app_data where user_id='${uid}' and key='${k}'`); return t ? JSON.parse(t) : null; };
const poner = (k, v, uid = HV_U1) => psql(`insert into app_data (user_id, key, value) values ('${uid}','${k}',${lit(v)}) on conflict (user_id, key) do update set value = excluded.value, updated_at = now()`);
const huellaDatos = () => psql("select coalesce(string_agg(user_id || '/' || key || '=' || md5(value::text), ',' order by user_id, key), '') from app_data");
const idsCopias = () => psql('select coalesce(string_agg(id::text, \',\' order by id), \'\') from copias_apartadas').split(',').filter(Boolean);
const cuantas = (tipo = null, uid = HV_U1) => Number(psql(`select count(*) from copias_apartadas where user_id = '${uid}'${tipo ? ` and tipo='${tipo}'` : ''}`));
const cuantasOps = () => Number(psql('select count(*) from operaciones_protegidas'));

/* Las variantes con un fallo provocado: se parte el archivo generado por sus marcas de sección. */
const TEXTO = readFileSync(SQL_INSTALACION, 'utf8');
const antesDe = (marca, insertar) => { const i = TEXTO.indexOf(marca); if (i < 0) throw new Error(`Sin la marca «${marca}»`); return TEXTO.slice(0, i) + insertar + TEXTO.slice(i); };
const FALLO_TRAS_R1 = antesDe('-- ── 2 · ', "select 1 / 0;   -- fallo provocado (prueba)\n");
const FALLO_TRAS_RED = antesDe('-- ── 3 · ', "select 1 / 0;   -- fallo provocado (prueba)\n");
const FALLO_COMPROBACION = antesDe('-- ── 4 · ', 'drop trigger horarios_rescate on public.app_data;   -- falta una pieza (prueba)\n');

/* ── El PostgREST de la base aparte, con el proxy que quita `/rest/v1` (como en las demás pruebas de nivel 3) ── */
const puertoLibre = () => new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PUERTO_PGRST = await puertoLibre();
const URL_PGRST = `http://127.0.0.1:${PUERTO_PGRST}`;
const confPgrst = join(TMP, 'postgrest.conf');
const credAuth = /^postgres(ql)?:\/\/[^@]*@([^/]+)\//.exec(HV_PSQL)[2];
writeFileSync(confPgrst, `db-uri = "postgres://authenticator:solo-local@${credAuth}/${BASE}"\ndb-schemas = "public"\ndb-anon-role = "anon"\njwt-secret = "${HV_JWT_SECRET}"\nserver-host = "127.0.0.1"\nserver-port = ${PUERTO_PGRST}\nlog-level = "crit"\n`);
let pgrst = null;
const arrancarPgrst = async () => {
  pgrst = spawn(HV_POSTGREST_BIN, [confPgrst], { stdio: 'ignore' });
  for (let i = 0; i < 100; i += 1) {
    const vivo = await new Promise((r) => { const q = http.get(`${URL_PGRST}/`, (x) => { x.resume(); r(x.statusCode === 200); }); q.on('error', () => r(false)); });
    if (vivo) return true;
    await dormir(100);
  }
  return false;
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (sub) => { const h = b64({ alg: 'HS256', typ: 'JWT' }); const p = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', HV_JWT_SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const proxy = http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
  const trozos = []; req.on('data', (c) => trozos.push(c));
  req.on('end', () => {
    const headers = { ...req.headers }; delete headers.host;
    const up = http.request({ host: '127.0.0.1', port: PUERTO_PGRST, method: req.method, path: req.url.replace(/^\/rest\/v1/, ''), headers }, (ur) => {
      const ub = []; ur.on('data', (c) => ub.push(c));
      ur.on('end', () => { res.writeHead(ur.statusCode, { ...ur.headers, ...cors }); res.end(Buffer.concat(ub)); });
    });
    up.on('error', () => { res.writeHead(502, cors); res.end(); });
    up.end(Buffer.concat(trozos));
  });
});
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const URL_PROXY = `http://127.0.0.1:${proxy.address().port}`;
const entornos = { 1: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1) }, 2: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U2) } };
register('data:text/javascript,' + encodeURIComponent(`const E = ${JSON.stringify(entornos)};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = url.match(/\\/lib\\/supabase\\.js\\?inst=(\\d)$/);
  if (m) return { ...r, source: String(r.source).replace(/import\\.meta\\.env/g, JSON.stringify(E[m[1]])), shortCircuit: true };
  return r;
}`));
const S1 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?inst=1');
const S2 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?inst=2');
const W = await import(pathToFileURL(join(RAIZ, 'src/lib/escritorOperaciones.js')).href);
const C = await import(pathToFileURL(join(RAIZ, 'src/lib/cambiosApartados.js')).href);
const H = await import(pathToFileURL(join(RAIZ, 'src/lib/horario.js')).href);

const recargar = async () => { psql("notify pgrst, 'reload schema'"); for (let i = 0; i < 80; i += 1) { const p = await S1.transporteProtegido.protocolo(); if (p.ok) return p.data; await dormir(100); } return null; };
const reglas = async () => { await recargar(); return (await S1.transporteProtegido.protocolo()).data.reglas; };
const aula = (h, id) => (h && (h.bloques.find((b) => b.id === id) || {}).aula);
const tiene = (h, id) => !!(h && h.bloques.some((b) => b.id === id));
const conBloque = (h, id, cambio) => ({ ...h, bloques: h.bloques.map((b) => (b.id === id ? { ...b, ...cambio } : b)) });
const conTestigo = (h, aparato = 'viejo') => ({ ...h, version: 1, testigo: { formato: 1, revision: crypto.randomUUID(), base: (h.testigo && h.testigo.revision) || null, aparato } });
const HORARIO = () => ({
  horarios: [{ id: 'hh', nombre: 'Curso', activo: true, columnas: [{ id: 'c1', horarioId: 'hh', nombre: 'L', dia: 1, posicion: 0, visible: true }], filas: [{ id: 'f1', horarioId: 'hh', inicio: '08:00', fin: '09:00', posicion: 0 }] }],
  actividades: [{ id: 'am', nombre: 'Matemáticas' }, { id: 'ah', nombre: 'Historia' }, { id: 'af', nombre: 'Física' }],
  bloques: [
    { id: 'b1', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'am', inicio: '08:00', fin: '09:00', aula: 'A1' },
    { id: 'b2', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '09:00', fin: '10:00', aula: 'A2' },
  ],
  excepciones: [], version: 1, testigo: { formato: 1, revision: 'r0', base: null, aparato: 'semilla' },
});
const ESTUDIOS = { asignaturas: [{ id: 'mat', nombre: 'Matemáticas' }, { id: 'his', nombre: 'Historia' }], examenes: [] };
const PAPELERA = { elementos: [], retencionDias: 30 };
const sembrar = () => { poner('horarioTop', HORARIO()); poner('estudios', ESTUDIOS); poner('papelera', PAPELERA); };
/* LA VERSIÓN ANTIGUA (la v3.162 de producción): `saveData`, un upsert sin condición, con el mismo cliente de Supabase. */
const antigua = (S, clave, value, uid = HV_U1) => S.supabase.from('app_data').upsert({ user_id: uid, key: clave, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' });
/* LA VERSIÓN NUEVA: el escritor de operaciones de R2, como App.jsx. */
const aparato = (S, nombre) => {
  const pantalla = { horario: H.normalizarHorarioTop(valor('horarioTop')) };
  const w = W.crearEscritorDeOperaciones({
    transporte: S.transporteProtegido, usuario: HV_U1, aparato: nombre, versionApp: '3.164.3',
    inicial: { valor: valor('horarioTop'), existe: true }, alAdoptar: (v) => { pantalla.horario = H.normalizarHorarioTop(v); },
    normalizarHorario: H.normalizarHorarioTop,
  });
  return { w, pantalla };
};
async function recuperarElegido(S, A, id, quiere) {
  const fila = (await S.transporteProtegido.copia(id)).data;
  const actual = (await S.transporteProtegido.leer(C.CLAVES_RECUPERACION)).data.claves;
  const prep = C.prepararRecuperacion({ fila, actual });
  const elegidas = (prep.piezas || []).filter((p) => p.estado === 'aplicable' && quiere(p)).map((p) => p.id);
  const vista = C.prepararRecuperacion({ fila, actual, elegidas });
  if (vista.estado !== 'recuperable') return { ok: false, vista };
  const r = await A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: vista.horario, claves: vista.claves, base: actual.horarioTop });
  await A.w.esperar();
  return { ...r, vista };
}

/* El laboratorio de las demás pruebas, para comprobar al final que no se ha tocado. */
const huellaLaboratorio = () => psqlEn(URL_ADMIN, "select (select count(*) from pg_proc where proname like 'protegido\\_%') || '/' || (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid where c.relname = 'app_data' and not t.tgisinternal) || '/' || (select count(*) from app_data)");
const laboratorioAntes = huellaLaboratorio();

try {
  /* ═══ A · EL ARCHIVO GENERADO ═══ */
  seccion('A · El archivo generado: sus tres piezas, en orden, en una transacción');
  {
    ok(TEXTO === instalacionHorarios(), 'horarios-instalacion.sql es EXACTAMENTE lo que genera el script con las piezas de hoy (no se ha editado a mano)');
    const lineas = TEXTO.split('\n');
    ok(lineas.filter((l) => /^begin;$/i.test(l)).length === 1 && lineas.filter((l) => /^commit;$/i.test(l)).length === 1
      && TEXTO.indexOf('\nbegin;\n') < TEXTO.indexOf('-- ── 1 · ') && TEXTO.lastIndexOf('\ncommit;\n') > TEXTO.indexOf('-- ── 4 · '), 'un solo BEGIN, antes de todo, y un solo COMMIT, después de la comprobación final');
    const posiciones = PIEZAS_INSTALACION.map((p) => TEXTO.indexOf(leer(p.archivo).replace(/\s+$/, '')));
    ok(posiciones.every((p) => p > 0) && posiciones[0] < posiciones[1] && posiciones[1] < posiciones[2], 'R1, la red y P4, cada una entera y sin cambios, en ese orden (las dos últimas exigen R1)');
    ok(new RegExp(`set local lock_timeout = '${ESPERA_BLOQUEO}'`).test(TEXTO), `espera un bloqueo de app_data como mucho ${ESPERA_BLOQUEO} y, si no, no instala nada`);
    const sinComentarios = TEXTO.replace(/--[^\n]*/g, '');
    /* Las sentencias de primer nivel: sin los cuerpos de las funciones y bloques (entre $$), que no se ejecutan al
       instalar (dentro, `end;` cierra un bloque PL/pgSQL y el `delete` es el de «eliminar una copia a petición»). */
    const primerNivel = sinComentarios.replace(/\$\$[\s\S]*?\$\$/g, '$$ $$');
    ok(!/\b(concurrently|vacuum|alter\s+system|create\s+database|drop\s+database)\b/i.test(sinComentarios), 'ningún comando que no se pueda hacer dentro de una transacción');
    ok(!/^\s*(commit|rollback|end|start\s+transaction|begin\s+transaction|savepoint|abort)\s*;/im.test(primerNivel.replace(/^begin;$/m, '').replace(/^commit;$/m, '')), 'ninguna otra orden de transacción que cerrara la de la instalación a medias');
    ok(!/\b(drop\s+table|drop\s+schema|truncate|delete\s+from)\b/i.test(primerNivel), 'no borra ninguna tabla, ningún esquema ni ningún dato al instalarse');
    ok(!/create\s+trigger\s+horario_regla_revision/i.test(sinComentarios) && /drop trigger if exists horario_regla_revision/.test(sinComentarios), 'no instala la regla de E1 (prohibida); la quita si estuviera');
    ok(/claves_rescate\(\) returns text\[\]\s*\nlanguage sql immutable set search_path = '' as \$\$ select array\['horarioTop'\]::text\[\]/.test(TEXTO), 'D1 (b): la red de rescate, solo horarioTop');
    ok(/instalacion_incompleta/.test(TEXTO) && /tgname = 'horario_regla_revision'/.test(TEXTO), 'la comprobación final está dentro de la transacción y exige todas las piezas');
  }

  crearBase();
  ok(await arrancarPgrst(), `una base de datos aparte (${BASE}) con su propio PostgREST, sin tocar la del laboratorio`);

  /* ═══ B · INSTALACIÓN COMPLETA ═══ */
  seccion('B · La instalación completa, en una transacción');
  {
    sembrar();
    const datos = huellaDatos();
    ok(vacio(estado()), 'antes: nada instalado');
    const r = ejecutar(SQL_INSTALACION);
    ok(r.ok, `se instala de una vez y sin error${r.ok ? '' : ` (${r.error})`}`);
    const e = estado();
    ok(completo(e), `todo está: 7 funciones, el esquema interno, 3 tablas, la red y P4, y ni rastro de la regla de E1 (${JSON.stringify(e)})`);
    ok(psql('select array_to_string(protegido_interno.claves_rescate(), \',\')') === 'horarioTop' && psql('select array_to_string(protegido_interno.claves_versiones_antiguas(), \',\')') === 'horarioTop', 'la red y P4, solo para horarioTop');
    const rg = await reglas();
    ok(rg && rg.rescate === true && rg.versionesAntiguas === true && rg.horarioTop === true, `el protocolo lo dice: rescate, versiones antiguas y horario protegidos (${JSON.stringify(rg)})`);
    ok(huellaDatos() === datos && cuantas() === 0 && cuantasOps() === 0, 'instalar no cambia ningún dato ni crea copias');
  }

  /* ═══ C · FALLO A MITAD, DESDE CERO ═══ */
  seccion('C · Un fallo provocado a mitad: no queda NADA instalado');
  {
    crearBase(); await recargar();
    sembrar();
    const datos = huellaDatos();
    for (const [nombre, texto, motivo] of [
      ['tras instalar R1', FALLO_TRAS_R1, /division by zero/],
      ['tras instalar la red de rescate', FALLO_TRAS_RED, /division by zero/],
      ['en la comprobación final (falta una pieza)', FALLO_COMPROBACION, /instalacion_incompleta/],
    ]) {
      const r = ejecutar(texto, { texto: true });
      const e = estado();
      ok(!r.ok && motivo.test(r.error) && vacio(e) && huellaDatos() === datos, `${nombre}: falla, y no queda ni una función, ni el esquema, ni una tabla, ni un disparador (${JSON.stringify(e)})`);
    }
    /* Un bloqueo de app_data de otra conexión (la aplicación escribiendo): la instalación se rinde y no deja nada. */
    const bloqueo = spawn('psql', [URL_BASE, '-v', 'ON_ERROR_STOP=1', '-qc', 'begin; lock table public.app_data in access exclusive mode; select pg_sleep(9); commit;'], { env: PG_ENV, stdio: 'ignore' });
    for (let i = 0; i < 50 && psql("select count(*) from pg_locks l join pg_class c on c.oid = l.relation where c.relname = 'app_data' and l.mode = 'AccessExclusiveLock' and l.granted") === '0'; i += 1) await dormir(100);
    const t0 = Date.now();
    const rb = ejecutar(SQL_INSTALACION);
    const tarda = Date.now() - t0;
    ok(!rb.ok && /lock timeout/i.test(rb.error) && vacio(estado()), `con app_data bloqueada por otra conexión: se rinde (lock timeout, ${Math.round(tarda / 100) / 10} s) y no deja nada a medias`);
    bloqueo.kill('SIGTERM');
    await new Promise((r) => (bloqueo.exitCode !== null ? r() : bloqueo.on('exit', r)));
    ok(huellaDatos() === datos, 'y los datos siguen exactamente como estaban');
    const rbien = ejecutar(SQL_INSTALACION);
    ok(rbien.ok && completo(estado()), 'después de cada fallo, la instalación de verdad funciona a la primera');
  }

  /* ═══ D · REINSTALACIÓN ═══ */
  seccion('D · Reinstalar: seguro, y un fallo a mitad deja intacta la instalación de antes');
  {
    await recargar();
    sembrar();
    /* Algo que conservar: una copia de versión antigua, un conflicto entre dos aparatos y operaciones registradas. */
    await antigua(S1, 'horarioTop', conTestigo(conBloque(HORARIO(), 'b1', { aula: 'VIEJA' })));
    const A = aparato(S1, 'A'); const B = aparato(S1, 'B');
    ok((await B.w.guardar(conBloque(B.pantalla.horario, 'b2', { aula: 'DE-B' }))).ok, 'B (nueva) guarda');
    const rc = await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'DE-A' }));
    await A.w.esperar();
    ok(rc.conflicto === true, 'A, que no había visto lo de B, choca: su cambio se aparta');
    A.w.cerrar(); B.w.cerrar();
    const ids = idsCopias(); const ops = cuantasOps(); const datos = huellaDatos();
    ok(ids.length >= 2 && cuantas('version_antigua') === 1 && cuantas('conflicto') === 1 && ops >= 1, `hay algo que perder: ${ids.length} copias (versión antigua y conflicto) y ${ops} operaciones`);
    const r = ejecutar(SQL_INSTALACION);
    const e = estado();
    ok(r.ok && completo(e), 'reinstalar encima: sin error, y sigue habiendo UN disparador de cada (no se duplican)');
    ok(idsCopias().join() === ids.join() && cuantasOps() === ops && huellaDatos() === datos, '🚨 reinstalar no toca ni una copia, ni una operación, ni un dato');
    for (const [nombre, texto] of [['tras R1', FALLO_TRAS_R1], ['en la comprobación final', FALLO_COMPROBACION]]) {
      const rf = ejecutar(texto, { texto: true });
      ok(!rf.ok && completo(estado()) && idsCopias().join() === ids.join() && cuantasOps() === ops && huellaDatos() === datos, `🚨 una reinstalación que falla ${nombre}: la de antes sigue entera (con su red y su P4), y las copias y operaciones también`);
    }
    const rg = await reglas();
    ok(rg.rescate === true && rg.versionesAntiguas === true, 'el protocolo sigue diciendo que la red y P4 están activos');
  }

  /* ═══ E · ANTES DE PUBLICAR ═══ */
  seccion('E · Antes de publicar: solo la versión antigua (la de producción) escribe');
  {
    crearBase(); await recargar();
    ok(ejecutar(SQL_INSTALACION).ok, 'instalada');
    await recargar();
    sembrar();
    const antes = JSON.stringify(valor('horarioTop'));
    const r = await antigua(S1, 'horarioTop', conTestigo(conBloque(HORARIO(), 'b2', { aula: 'CAMBIO-VIEJO' })));
    ok(!r.error && r.status >= 200 && r.status < 300, `la versión antigua recibe «guardado» (${r.status})`);
    ok(JSON.stringify(valor('horarioTop')) === antes && cuantas('version_antigua') === 1 && cuantas('rescate') === 0, '🚨 su cambio del horario NO se aplica: queda apartado (versión antigua), sin rescate porque no se ha pisado nada');
    const cv = (await S1.transporteProtegido.copiasNuevasDeVersionAntigua()).data;
    ok(cv.length === 1 && C.avisoDeVersionesAntiguas(cv).cuantas === 1, 'la versión nueva, al abrirse, lo avisará');
    const e1 = await antigua(S1, 'estudios', { ...ESTUDIOS, asignaturas: [ESTUDIOS.asignaturas[0]] });
    const p1 = await antigua(S1, 'papelera', { elementos: [{ id: 'x' }], retencionDias: 30 });
    ok(!e1.error && valor('estudios').asignaturas.length === 1 && !p1.error && valor('papelera').elementos.length === 1, 'Estudios y la papelera se guardan como hoy (se aplican)');
    ok(cuantas() === 1, '🚨 D1 (b): y SIN copia: la red ya no vigila Estudios ni la papelera (como hoy en producción)');
    const del = await S1.supabase.from('app_data').delete().eq('user_id', HV_U1).eq('key', 'horarioTop');
    ok(!!del.error && del.error.message === 'protegido_solo_por_funciones' && valor('horarioTop') !== null, 'borrar la fila del horario desde la aplicación: se rechaza');
    const u2 = await antigua(S2, 'horarioTop', HORARIO(), HV_U2);
    ok(!u2.error && valor('horarioTop', HV_U2) === null, 'una cuenta sin horario: la versión antigua no lo crea (se aparta)');
  }

  /* ═══ F · LA VERSIÓN NUEVA CON P4 ═══ */
  seccion('F · Publicada la versión nueva: guarda, lo antiguo se aparta, conflictos y recuperar');
  {
    const A = aparato(S1, 'A');
    const copias0 = cuantas();
    ok((await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'NUEVA' }))).ok && aula(valor('horarioTop'), 'b1') === 'NUEVA' && cuantas() === copias0, 'la versión nueva guarda el horario (por sus funciones), sin dejar copias');
    A.pantalla.horario = H.normalizarHorarioTop(valor('horarioTop'));
    const viejo = conTestigo({ ...HORARIO(), bloques: [...HORARIO().bloques, { id: 'b4', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'af', inicio: '11:00', fin: '12:00', aula: 'L1' }] });
    const va0 = cuantas('version_antigua');
    const r = await antigua(S1, 'horarioTop', viejo);
    ok(!r.error && aula(valor('horarioTop'), 'b1') === 'NUEVA' && !tiene(valor('horarioTop'), 'b4') && cuantas('version_antigua') === va0 + 1, '🚨 una pestaña antigua que sigue abierta: su guardado (con b1 viejo) se aparta y NO pisa lo nuevo');
    const B = aparato(S1, 'B');
    ok((await B.w.guardar(conBloque(B.pantalla.horario, 'b2', { aula: 'DE-B' }))).ok, 'otro aparato nuevo (B) guarda');
    const rc = await A.w.guardar(conBloque(A.pantalla.horario, 'b2', { aula: 'DE-A' }));
    await A.w.esperar();
    ok(rc.conflicto === true && aula(valor('horarioTop'), 'b2') === 'DE-B' && cuantas('conflicto') === 1, 'A, sobre lo de antes, choca: no pisa lo de B y su cambio queda apartado (conflicto)');
    A.w.verLoDeAhora();
    const conB4 = JSON.parse(psql("select coalesce(json_agg(id), '[]') from copias_apartadas where tipo = 'version_antigua' and contenido -> 'intentado' -> 'bloques' @> '[{\"id\":\"b4\"}]'"));
    ok(conB4.length === 1, 'lo que intentó la pestaña antigua está en una copia');
    const rr = await recuperarElegido(S1, A, conB4[0], (p) => /Física/.test(p.texto));
    const h = valor('horarioTop');
    ok(rr.ok && tiene(h, 'b4') && aula(h, 'b1') === 'NUEVA' && aula(h, 'b2') === 'DE-B', `de lo apartado se recupera lo elegido (Física), sin pisar lo de después (${rr.vista && rr.vista.resumen && rr.vista.resumen.join(' ')})`);
    A.w.cerrar(); B.w.cerrar();
  }

  /* ═══ G · FALLO DE DESPLIEGUE Y VUELTA ATRÁS ═══ */
  seccion('G · El despliegue falla: volver atrás sin perder ni una copia ni una operación');
  {
    const ids0 = idsCopias(); const ops0 = cuantasOps();
    const conserva = () => { const ahora = new Set(idsCopias()); return ids0.every((id) => ahora.has(id)) && cuantasOps() >= ops0; };
    ok(ids0.length >= 4 && ops0 >= 2, `antes de volver atrás: ${ids0.length} copias y ${ops0} operaciones`);
    /* El orden EQUIVOCADO: volver a la versión anterior con P4 todavía puesto. */
    const antesMal = JSON.stringify(valor('horarioTop'));
    const mal = await antigua(S1, 'horarioTop', conTestigo(conBloque(H.normalizarHorarioTop(valor('horarioTop')), 'b2', { aula: 'TRAS-VOLVER-MAL' })));
    ok(!mal.error && JSON.stringify(valor('horarioTop')) === antesMal, '⚠️ orden equivocado (la versión anterior con P4 puesto): su cambio recibe «guardado» y NO se aplica, sin que nadie lo note → P4 se quita SIEMPRE primero');
    ok(conserva(), 'aun así, nada se ha perdido (queda apartado)');
    /* 1 · Quitar P4. */
    const r1 = ejecutar(SQL_ANTIGUAS_DESHACER);
    const rg1 = await reglas();
    ok(r1.ok && estado().p4 === 0 && estado().rescate === 1 && rg1.versionesAntiguas === false && rg1.rescate === true && conserva(), '1 · quitar P4: la red sigue y ni una copia ni una operación se pierde');
    /* 2 · Volver a la versión anterior: lo que guarda se aplica, y lo que pisa queda rescatado. */
    const pisado = JSON.stringify(valor('horarioTop'));
    const r2 = await antigua(S1, 'horarioTop', conTestigo(conBloque(H.normalizarHorarioTop(valor('horarioTop')), 'b2', { aula: 'VERSION-ANTERIOR' })));
    const resc = (await S1.transporteProtegido.copias()).data.filter((c) => c.tipo === 'rescate');
    ok(!r2.error && aula(valor('horarioTop'), 'b2') === 'VERSION-ANTERIOR' && resc.length === 1 && conserva(), '2 · la versión anterior vuelve a guardar el horario, y lo que había (lo de la nueva) queda rescatado');
    const filaR = (await S1.transporteProtegido.copia(resc[0].id)).data;
    ok(JSON.stringify(filaR.contenido.antes) === pisado, '   la copia de rescate guarda EXACTAMENTE lo que se pisó');
    const e2 = await antigua(S1, 'estudios', ESTUDIOS);
    ok(!e2.error && cuantas('rescate') === 1, '   Estudios, como hoy: se aplica sin copia (D1 b)');
    /* 3 · Quitar la red (cuando se decida). */
    const idsAntes3 = idsCopias();
    const r3 = ejecutar(SQL_RESCATE_DESHACER);
    const rg3 = await reglas();
    const r3w = await antigua(S1, 'horarioTop', conTestigo(conBloque(H.normalizarHorarioTop(valor('horarioTop')), 'b2', { aula: 'SIN-RED' })));
    ok(r3.ok && estado().rescate === 0 && rg3.rescate === false && !r3w.error && aula(valor('horarioTop'), 'b2') === 'SIN-RED' && idsCopias().join() === idsAntes3.join(), '3 · quitar la red: lo antiguo se aplica como hoy, y las copias que había se quedan todas');
    /* R1 se queda: sus tablas, sus funciones, sus copias y su registro. */
    const e = estado();
    ok(e.funciones === 7 && e.tablas === 3 && e.esquema && conserva(), '🚨 al final de la vuelta atrás, R1 sigue instalado con TODAS las copias y TODAS las operaciones');
    ok((await S1.transporteProtegido.copias()).data.length === cuantas(), '   y la aplicación nueva las seguiría viendo (si se vuelve a publicar)');
    /* Volver a instalar (el despliegue arreglado): todo vuelve, sin tocar nada de lo guardado. */
    const ids4 = idsCopias(); const ops4 = cuantasOps();
    const r4 = ejecutar(SQL_INSTALACION);
    const rg4 = await reglas();
    ok(r4.ok && completo(estado()) && rg4.rescate === true && rg4.versionesAntiguas === true && idsCopias().join() === ids4.join() && cuantasOps() === ops4, 'volver a instalar después de la vuelta atrás: la red y P4 vuelven, y las copias y operaciones siguen intactas');
  }
} finally {
  if (pgrst) { pgrst.kill('SIGTERM'); await new Promise((r) => (pgrst.exitCode !== null ? r() : pgrst.on('exit', r))); }
  proxy.close();
  try { psqlEn(URL_ADMIN, `drop database if exists ${BASE} with (force)`); } catch (e) { fallos += 1; console.log('  ✗ no se pudo quitar la base aparte:', e.message); }
  rmSync(TMP, { recursive: true, force: true });
}
ok(psqlEn(URL_ADMIN, `select count(*) from pg_database where datname = '${BASE}'`) === '0', 'al terminar, la base aparte ya no existe');
ok(huellaLaboratorio() === laboratorioAntes, `y el laboratorio de las demás pruebas está exactamente como estaba (${laboratorioAntes})`);
console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones de la instalación conjunta y la publicación segura (bloque 1)`);
process.exit(fallos ? 1 : 0);
