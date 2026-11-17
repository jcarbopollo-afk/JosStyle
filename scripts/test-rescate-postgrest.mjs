// ═══════════════════════════════════════════════════════════════════════════
// 🛟 HORARIOS · E1-R · R5 — LA RED DE RESCATE Y LAS VERSIONES ANTIGUAS CONTRA POSTGRES (nivel 3, solo laboratorio)
//
// `supabase/horarios-rescate.sql` (P1, H-22 y H-25) y `supabase/horarios-versiones-antiguas.sql` (P4, H-23) sobre R1, en
// un Postgres + PostgREST LOCALES, instalados por esta prueba y quitados al terminar. La «versión antigua» guarda como
// la v3.162 (`saveData`: un upsert sin condición, con el mismo cliente de Supabase); la nueva, con el escritor de R2:
//   A · antes de P1, como hoy: lo pisado no queda en ningún sitio
//   B · P1: cada escritura a ciegas que cambia o borra horarioTop, estudios o papelera deja su copia; nada más; H-25
//   C · P2–P3: la nueva y una antigua a la vez; lo pisado se recupera eligiendo, y nada se pierde
//   D · P4: las escrituras antiguas de horarioTop se apartan (no se aplican, no se rechazan); reintentos; sin horario;
//       borrar; Estudios sigue en la red; si no se puede apartar, se rechaza; recuperar lo elegido; el aviso
//   E · concurrencia: escrituras antiguas y nuevas a la vez
//   F · la secuencia P1 → P4 entera, con una versión antigua escribiendo en cada momento: nada se pierde
//   G · la vuelta atrás: quitar las reglas no borra ninguna copia
//
// ⚠️ NUNCA contra Supabase alojado. Es OPCIONAL: sin las variables del laboratorio se omite (y lo dice):
//   HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2   (ver `test-historial-versiones-postgrest.mjs`)
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-rescate-postgrest.mjs
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
const SQL = join(RAIZ, 'supabase/horarios-protegido.sql');
const SQL_DESHACER = join(RAIZ, 'supabase/horarios-protegido-deshacer.sql');
const SQL_RESCATE = join(RAIZ, 'supabase/horarios-rescate.sql');
const SQL_RESCATE_DESHACER = join(RAIZ, 'supabase/horarios-rescate-deshacer.sql');
const SQL_ANTIGUAS = join(RAIZ, 'supabase/horarios-versiones-antiguas.sql');
const SQL_ANTIGUAS_DESHACER = join(RAIZ, 'supabase/horarios-versiones-antiguas-deshacer.sql');
const SQL_REGLA_E1 = join(RAIZ, 'supabase/horarios-regla-revision.sql');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (sub, exp = Math.floor(Date.now() / 1000) + 3600) => { const h = b64({ alg: 'HS256', typ: 'JWT' }); const p = b64({ sub, role: 'authenticated', aud: 'authenticated', exp }); return `${h}.${p}.${crypto.createHmac('sha256', HV_JWT_SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const PG_ENV = { ...process.env, PGOPTIONS: '-c client_min_messages=warning' };
const psql = (sql) => execFileSync('psql', [HV_PSQL, '-Atc', sql], { env: PG_ENV }).toString().trim();
const psqlArchivo = (ruta) => execFileSync('psql', [HV_PSQL, '-v', 'ON_ERROR_STOP=1', '-q', '-f', ruta], { env: PG_ENV }).toString();
const lit = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const dormir = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/* ── El proxy del laboratorio (como en R3): quita `/rest/v1`, contesta CORS, puede perder una respuesta y ejecutar algo
      justo antes de reenviar una petición. ── */
const destino = new URL(HV_PGRST_URL);
const cortes = [];
const antesDe = [];
const proxy = http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
  const trozos = []; req.on('data', (c) => trozos.push(c));
  req.on('end', () => {
    const cuerpo = Buffer.concat(trozos);
    const ruta = req.url.replace(/^\/rest\/v1/, '');
    const ia = antesDe.findIndex((c) => c.ruta.test(ruta));
    if (ia >= 0) { const a = antesDe.splice(ia, 1)[0]; try { a.fn(); } catch (e) { console.log('  (antesDe falló)', e.message); } }
    const i = cortes.findIndex((c) => c.ruta.test(ruta));
    const corte = i >= 0 ? cortes.splice(i, 1)[0] : null;
    if (corte && corte.modo === 'antes') { req.socket.destroy(); return; }
    const headers = { ...req.headers }; delete headers.host;
    const up = http.request({ host: destino.hostname, port: destino.port, method: req.method, path: ruta, headers }, (ur) => {
      const ub = []; ur.on('data', (c) => ub.push(c));
      ur.on('end', () => { res.writeHead(ur.statusCode, { ...ur.headers, ...cors }); res.end(Buffer.concat(ub)); });
    });
    up.end(cuerpo);
  });
});
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const URL_PROXY = `http://127.0.0.1:${proxy.address().port}`;
const entornos = {
  1: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1) },
  2: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U2) },
  3: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1, Math.floor(Date.now() / 1000) - 60) },
  4: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1) },
};
register('data:text/javascript,' + encodeURIComponent(`const E = ${JSON.stringify(entornos)};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = url.match(/\\/lib\\/supabase\\.js\\?ca=(\\d)$/);
  if (m) return { ...r, source: String(r.source).replace(/import\\.meta\\.env/g, JSON.stringify(E[m[1]])), shortCircuit: true };
  return r;
}`));
const S1 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?ca=1');
const S2 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?ca=2');
const S3 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?ca=3');
const S4 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?ca=4');
const W = await import(pathToFileURL(join(RAIZ, 'src/lib/escritorOperaciones.js')).href);
const C = await import(pathToFileURL(join(RAIZ, 'src/lib/cambiosApartados.js')).href);
const P = await import(pathToFileURL(join(RAIZ, 'src/lib/asignaturaProtegida.js')).href);
const H = await import(pathToFileURL(join(RAIZ, 'src/lib/horario.js')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const valor = (k, uid = HV_U1) => { const t = psql(`select value::text from app_data where user_id='${uid}' and key='${k}'`); return t ? JSON.parse(t) : null; };
/* Como el propietario (el editor SQL): no pasa por las reglas de R5, igual que en Supabase. */
const poner = (k, v, uid = HV_U1) => psql(`insert into app_data (user_id, key, value) values ('${uid}','${k}',${lit(v)}) on conflict (user_id, key) do update set value = excluded.value, updated_at = now()`);
const instalado = () => psql("select to_regclass('public.operaciones_protegidas') is not null") === 't';
const hayDisparador = (nombre) => psql(`select count(*) from pg_trigger where tgname = '${nombre}'`) === '1';
const cuantas = (tipo = null, uid = HV_U1) => Number(psql(`select count(*) from copias_apartadas where user_id='${uid}'${tipo ? ` and tipo='${tipo}'` : ''}`));
const copiasDe = (tipo, uid = HV_U1) => JSON.parse(psql(`select coalesce(json_agg(json_build_object('id', id, 'tipo', tipo, 'aparato', aparato, 'meta', meta, 'contenido', contenido, 'vista', vista) order by creada_en, id), '[]') from copias_apartadas where user_id='${uid}' and tipo='${tipo}'`));
const limpiar = () => {
  psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);
  if (instalado()) psql('truncate operaciones_protegidas, copias_apartadas, operaciones_corte');
};
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v));
const aula = (h, id) => (h && (h.bloques.find((b) => b.id === id) || {}).aula);
const tiene = (h, id) => !!(h && h.bloques.some((b) => b.id === id));
const conBloque = (h, id, cambio) => ({ ...h, bloques: h.bloques.map((b) => (b.id === id ? { ...b, ...cambio } : b)) });
const sinBloque = (h, id) => ({ ...h, bloques: h.bloques.filter((b) => b.id !== id) });
const conTestigo = (h, aparato = 'viejo') => ({ ...h, version: 1, testigo: { formato: 1, revision: crypto.randomUUID(), base: (h.testigo && h.testigo.revision) || null, aparato } });
const HORARIO = () => ({
  horarios: [{ id: 'hh', nombre: 'Curso', activo: true, columnas: [{ id: 'c1', horarioId: 'hh', nombre: 'L', dia: 1, posicion: 0, visible: true }], filas: [{ id: 'f1', horarioId: 'hh', inicio: '08:00', fin: '09:00', posicion: 0 }] }],
  actividades: [{ id: 'am', nombre: 'Matemáticas' }, { id: 'ah', nombre: 'Historia' }, { id: 'af', nombre: 'Física' }],
  bloques: [
    { id: 'b1', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'am', inicio: '08:00', fin: '09:00', aula: 'A1' },
    { id: 'b2', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '09:00', fin: '10:00', aula: 'A2' },
    { id: 'b3', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '10:00', fin: '11:00', aula: 'A3' },
  ],
  excepciones: [], version: 1, testigo: { formato: 1, revision: 'r0', base: null, aparato: 'semilla' },
});
const sembrar = () => {
  limpiar();
  poner('horarioTop', HORARIO());
  poner('estudios', { asignaturas: [{ id: 'mat', nombre: 'Matemáticas' }, { id: 'his', nombre: 'Historia' }], examenes: [] });
  poner('papelera', { elementos: [], retencionDias: 30 });
};
/* LA VERSIÓN ANTIGUA: guarda como `saveData` de la v3.162 (un upsert sin condición), con el mismo cliente de Supabase. */
const antigua = (S, clave, value, uid = HV_U1) => S.supabase.from('app_data').upsert({ user_id: uid, key: clave, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' });
/* LA VERSIÓN NUEVA: el escritor de operaciones de R2 (como App.jsx). */
const aparato = (S, nombre) => {
  const pantalla = { horario: H.normalizarHorarioTop(valor('horarioTop')) };
  const w = W.crearEscritorDeOperaciones({
    transporte: S.transporteProtegido, usuario: HV_U1, aparato: nombre, versionApp: '3.164.0',
    inicial: { valor: valor('horarioTop'), existe: true }, alAdoptar: (v) => { pantalla.horario = H.normalizarHorarioTop(v); },
    normalizarHorario: H.normalizarHorarioTop,
  });
  return { w, pantalla };
};
const leerAhora = async (S) => { const r = await S.transporteProtegido.leer(C.CLAVES_RECUPERACION); return r.ok ? r.data.claves : null; };
/* Lo que hace App.jsx al recuperar lo elegido de una copia de rescate o de versión antigua. */
async function recuperarElegido(S, A, id, quiere) {
  const fila = (await S.transporteProtegido.copia(id)).data;
  const actual = await leerAhora(S);
  const prep = C.prepararRecuperacion({ fila, actual });
  const elegidas = (prep.piezas || []).filter((p) => p.estado === 'aplicable' && quiere(p)).map((p) => p.id);
  const vista = C.prepararRecuperacion({ fila, actual, elegidas });
  if (vista.estado !== 'recuperable') return { ok: false, vista, prep };
  const r = await A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: vista.horario, claves: vista.claves, base: actual.horarioTop });
  await A.w.esperar();
  return { ...r, vista, prep };
}
const recargar = async () => { psql("notify pgrst, 'reload schema'"); for (let i = 0; i < 60; i += 1) { const p = await S1.transporteProtegido.protocolo(); if (p.ok) return p.data; await dormir(100); } return null; };
const reglas = async () => (await S1.transporteProtegido.protocolo()).data.reglas;
const quitarTodo = () => {
  for (const f of [SQL_ANTIGUAS_DESHACER, SQL_RESCATE_DESHACER]) { try { if (instalado()) psqlArchivo(f); } catch { /* no estaba */ } }
  if (instalado()) psqlArchivo(SQL_DESHACER);
};

limpiar();
try {
  quitarTodo();
  psqlArchivo(SQL);
  ok(!!(await recargar()), 'R1 instalado en el laboratorio y contesta');

  seccion('A · Antes de P1 (como hoy): una versión antigua pisa y no queda nada');
  {
    sembrar();
    const r = await antigua(S1, 'horarioTop', conTestigo(sinBloque(HORARIO(), 'b2')));
    ok(!r.error && !tiene(valor('horarioTop'), 'b2') && cuantas() === 0, 'sin red: la escritura antigua se aplica y lo de antes (b2) no está en ningún sitio');
    const rg = await reglas();
    ok(rg.rescate === false && rg.versionesAntiguas === false && rg.horarioTop === false, 'el protocolo lo dice: ni rescate ni versiones antiguas');
  }

  seccion('B · P1: la red de rescate (H-22) y su fallo (H-25)');
  {
    psqlArchivo(SQL_RESCATE);
    ok(hayDisparador('horarios_rescate'), 'instalada (después de R1)');
    const rg = await reglas();
    ok(rg.rescate === true && rg.versionesAntiguas === false && rg.horarioTop === false, 'el protocolo: rescate sí, versiones antiguas no');
    sembrar();
    const pisado = conTestigo(sinBloque(HORARIO(), 'b2'));
    const r = await antigua(S1, 'horarioTop', pisado);
    const cs = copiasDe('rescate');
    ok(!r.error && !tiene(valor('horarioTop'), 'b2'), 'la escritura antigua se aplica (la red no la para)');
    ok(cs.length === 1 && tiene(cs[0].contenido.antes, 'b2') && !tiene(cs[0].contenido.despues, 'b2') && cs[0].contenido.clave === 'horarioTop', '🚨 y lo de antes (con b2) queda rescatado, con lo que se escribió encima');
    ok(cs[0].meta.revisionAntes === 'r0' && cs[0].meta.revisionDespues === pisado.testigo.revision && cs[0].aparato === 'viejo' && cs[0].meta.accion === 'escritura' && 'navegador' in cs[0].meta, 'con las revisiones, el aparato que escribió, la acción y el navegador');
    await antigua(S1, 'horarioTop', pisado);
    ok(cuantas('rescate') === 1, 'la misma escritura otra vez (no cambia nada): ninguna copia más');
    const x2 = conTestigo(conBloque(pisado, 'b1', { aula: 'X2' }));
    await antigua(S1, 'horarioTop', x2); await antigua(S1, 'horarioTop', pisado); await antigua(S1, 'horarioTop', x2);
    ok(cuantas('rescate') === 3, 'ida, vuelta e ida otra vez: la pareja repetida no se guarda dos veces (3, no 4)');
    await antigua(S1, 'estudios', { asignaturas: [{ id: 'mat', nombre: 'Matemáticas' }], examenes: [] });
    await antigua(S1, 'papelera', { elementos: [{ id: 'p1' }], retencionDias: 30 });
    const ce = copiasDe('rescate').filter((c) => c.contenido.clave === 'estudios');
    ok(ce.length === 1 && ce[0].contenido.antes.asignaturas.length === 2 && copiasDe('rescate').some((c) => c.contenido.clave === 'papelera'), 'Estudios y Eliminados recientes también quedan rescatados');
    const borrar = await S1.supabase.from('app_data').delete().eq('user_id', HV_U1).eq('key', 'estudios');
    const cb = copiasDe('rescate').find((c) => c.meta.accion === 'borrado');
    ok(!borrar.error && valor('estudios') === null && cb && cb.contenido.despues === null && cb.contenido.antes.asignaturas.length === 1, 'un borrado desde la aplicación: se borra, y lo que había queda rescatado');
    const antes = cuantas();
    await antigua(S1, 'fitness', { a: 1 }); await antigua(S1, 'fitness', { a: 2 });
    await antigua(S1, 'horarioTop', HORARIO(), HV_U2);
    ok(cuantas() === antes && cuantas(null, HV_U2) === 0, 'otra clave (fitness) o la primera fila de una clave: nada que rescatar');
    sembrar();
    const A = aparato(S1, 'A');
    ok((await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'NUEVA' }))).ok && aula(valor('horarioTop'), 'b1') === 'NUEVA' && cuantas() === 0, 'lo que guarda la versión nueva (operación protegida) no se rescata: ya va con su condición');
    A.w.cerrar();
    const intruso = await antigua(S2, 'horarioTop', conTestigo(HORARIO()), HV_U1);
    ok(!!intruso.error && aula(valor('horarioTop'), 'b1') === 'NUEVA' && cuantas() === 0 && cuantas(null, HV_U2) === 0, '🚨 otra cuenta no puede escribir la fila de U1, y no se rescata ni se aparta nada ajeno');
    ok((await S2.transporteProtegido.copias()).data.length === 0, '🚨 otra cuenta no ve las copias de rescate de U1 (RLS)');
    /* H-25: la copia no se puede guardar → la escritura se rechaza y no cambia nada. */
    psql("alter table copias_apartadas add constraint prueba_r5_falla check (tipo <> 'rescate') not valid");
    const antesF = JSON.stringify(valor('horarioTop'));
    const f = await antigua(S1, 'horarioTop', conTestigo(sinBloque(HORARIO(), 'b3')));
    ok(!!f.error && f.error.message === 'rescate_fallido' && JSON.stringify(valor('horarioTop')) === antesF && cuantas() === 0, `🚨 H-25: si la copia falla, la escritura se rechaza (rescate_fallido) y la cuenta no cambia (${f.error && f.error.message})`);
    psql('alter table copias_apartadas drop constraint prueba_r5_falla');
    const f2 = await antigua(S1, 'horarioTop', conTestigo(sinBloque(HORARIO(), 'b3')));
    ok(!f2.error && !tiene(valor('horarioTop'), 'b3') && cuantas('rescate') === 1, 'y en cuanto la copia se puede guardar, la escritura pasa y queda rescatada');
  }

  seccion('C · P2–P3: la versión nueva publicada y una antigua todavía abierta');
  {
    sembrar();
    const A = aparato(S1, 'A');
    const h1 = conBloque(A.pantalla.horario, 'b1', { aula: 'DE-A' });
    ok((await A.w.guardar(h1)).ok, 'A (nueva) cambia b1');
    /* Una pestaña antigua, con lo de antes en pantalla, guarda quitando b2. */
    const r = await antigua(S1, 'horarioTop', conTestigo(sinBloque(HORARIO(), 'b2')));
    ok(!r.error && aula(valor('horarioTop'), 'b1') === 'A1' && cuantas('rescate') === 1, 'la antigua pisa lo de A (b1 vuelve a A1) y lo de A queda rescatado');
    const rc = await A.w.guardar(conBloque(h1, 'b3', { aula: 'B3-A' }));   // sobre lo que A ve (con su b1)
    await A.w.esperar();
    ok(rc.conflicto && cuantas('conflicto') === 1, 'el siguiente cambio de A choca (el horario cambió sin pasar por sus funciones): se aparta, no se escribe encima');
    A.w.verLoDeAhora();
    const resc = copiasDe('rescate')[0];
    const rr = await recuperarElegido(S1, A, resc.id, (p) => /Matemáticas|Historia» \(09:00/.test(p.texto));
    const h = valor('horarioTop');
    ok(rr.ok && aula(h, 'b1') === 'DE-A' && tiene(h, 'b2'), `del rescate se recuperan lo de A (b1) y b2, elegidos uno a uno (${rr.vista && rr.vista.resumen.join(' ')})`);
    const conf = (await S1.transporteProtegido.copias()).data.find((c) => c.tipo === 'conflicto');
    const filaC = (await S1.transporteProtegido.copia(conf.id)).data;
    const actual = await leerAhora(S1);
    const prepC = C.prepararRecuperacion({ fila: filaC, actual });
    const r2 = prepC.estado === 'recuperable' ? await A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: prepC.horario, claves: prepC.claves, base: actual.horarioTop }) : { ok: false };
    await A.w.esperar();
    const h2 = valor('horarioTop');
    ok(r2.ok && aula(h2, 'b3') === 'B3-A' && aula(h2, 'b1') === 'DE-A' && tiene(h2, 'b2'), `🚨 y el cambio apartado de A también: nada de lo que hizo nadie se ha perdido (${prepC.resumen && prepC.resumen.join(' ')})`);
    ok(cuantas() === 2, 'las dos copias siguen (nada se elimina solo)');
    A.w.cerrar();
  }

  seccion('D · P4: las escrituras de versiones antiguas se apartan (H-23)');
  {
    psqlArchivo(SQL_REGLA_E1);
    ok(hayDisparador('horario_regla_revision'), '(la regla de E1, rechazar, estaba puesta)');
    psqlArchivo(SQL_ANTIGUAS);
    ok(hayDisparador('horarios_versiones_antiguas') && !hayDisparador('horario_regla_revision'), 'instalada, y la de E1 (rechazar, TP-15 B) se quita: H-23 la sustituye');
    const rg = await reglas();
    ok(rg.versionesAntiguas === true && rg.horarioTop === true && rg.rescate === true, 'el protocolo: versiones antiguas sí (y rescate sigue)');
    sembrar();
    const antes = JSON.stringify(valor('horarioTop'));
    const intento = conTestigo({ ...HORARIO(), bloques: [...HORARIO().bloques, { id: 'b4', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'af', inicio: '11:00', fin: '12:00', aula: 'L1' }] });
    const r = await antigua(S1, 'horarioTop', intento);
    const cv = copiasDe('version_antigua');
    ok(!r.error && r.status >= 200 && r.status < 300, `la versión antigua recibe «guardado» (${r.status}): no reintenta ni enseña un error`);
    ok(JSON.stringify(valor('horarioTop')) === antes && cuantas('rescate') === 0, '🚨 pero NO se aplica: la cuenta no cambia (y no hay nada que rescatar)');
    ok(cv.length === 1 && tiene(cv[0].contenido.intentado, 'b4') && cv[0].contenido.vigente.testigo.revision === 'r0' && cv[0].contenido.existia === true, '🚨 lo que intentó guardar queda apartado, con lo que había');
    ok(cv[0].meta.revisionVigente === 'r0' && cv[0].meta.revisionIntentada === intento.testigo.revision && cv[0].meta.baseIntentada === 'r0' && cv[0].aparato === 'viejo', 'con las revisiones, la base de la versión antigua y su aparato');
    await antigua(S1, 'horarioTop', intento);
    await antigua(S1, 'horarioTop', valor('horarioTop'));
    ok(cuantas('version_antigua') === 1, 'un reintento de lo mismo, o una escritura igual a lo que hay: ninguna copia más');
    const nuevas = await S1.transporteProtegido.copiasNuevasDeVersionAntigua();
    ok(nuevas.ok && nuevas.data.length === 1 && !('contenido' in nuevas.data[0]) && C.avisoDeVersionesAntiguas(nuevas.data).cuantas === 1, 'la aplicación nueva lo ve sin abrir la pantalla (una consulta pequeña) y lo avisa');
    const u2 = await antigua(S2, 'horarioTop', HORARIO(), HV_U2);
    ok(!u2.error && valor('horarioTop', HV_U2) === null && cuantas('version_antigua', HV_U2) === 1 && copiasDe('version_antigua', HV_U2)[0].contenido.existia === false, 'sin horario todavía: la versión antigua no lo crea, se aparta (existía: no)');
    const del = await S1.supabase.from('app_data').delete().eq('user_id', HV_U1).eq('key', 'horarioTop');
    ok(!!del.error && del.error.message === 'protegido_solo_por_funciones' && valor('horarioTop') !== null, 'borrar la fila del horario desde la aplicación: se rechaza');
    const A = aparato(S1, 'A');
    ok((await A.w.guardar(conBloque(A.pantalla.horario, 'b2', { aula: 'NUEVA' }))).ok && aula(valor('horarioTop'), 'b2') === 'NUEVA', 'la versión nueva sigue guardando (por sus funciones)');
    const e = await antigua(S1, 'estudios', { asignaturas: [], examenes: [] });
    ok(!e.error && valor('estudios').asignaturas.length === 0 && copiasDe('rescate').some((c) => c.contenido.clave === 'estudios'), 'Estudios no se aparta (es de E1-S): se aplica y queda rescatado');
    psql("alter table copias_apartadas add constraint prueba_r5_falla check (tipo <> 'version_antigua') not valid");
    const antesF = JSON.stringify(valor('horarioTop'));
    const f = await antigua(S1, 'horarioTop', conTestigo(sinBloque(HORARIO(), 'b1')));
    ok(!!f.error && f.error.message === 'version_antigua_no_apartada' && JSON.stringify(valor('horarioTop')) === antesF && cuantas('version_antigua') === 1, '🚨 si no se puede apartar, la escritura se rechaza (nunca se descarta sin dejarla a salvo)');
    psql('alter table copias_apartadas drop constraint prueba_r5_falla');
    const rr = await recuperarElegido(S1, A, cv[0].id, (p) => /Física/.test(p.texto));
    const h = valor('horarioTop');
    ok(rr.ok && tiene(h, 'b4') && aula(h, 'b2') === 'NUEVA', `lo que intentó (Física) se recupera si él lo elige, sin pisar lo de después (b2) (${rr.vista && rr.vista.resumen.join(' ')})`);
    const choque = C.prepararRecuperacion({ fila: (await S1.transporteProtegido.copia(cv[0].id)).data, actual: await leerAhora(S1) });
    ok(choque.estado === 'ya_aplicada' || (choque.piezas || []).every((p) => p.estado !== 'aplicable' || !/b2|09:00/.test(p.texto)), 'y lo que la versión antigua tenía viejo de b2 no se puede elegir para pisarlo');
    ok((await S1.transporteProtegido.copiaVista(cv[0].id)).data.estado === 'vista' && (await S1.transporteProtegido.copiasNuevasDeVersionAntigua()).data.length === 0, 'vista: deja de avisarse (y sigue en la lista)');
    A.w.cerrar();
  }

  seccion('E · Concurrencia: escrituras antiguas y nuevas a la vez');
  {
    sembrar();
    const A = aparato(S1, 'A');
    const estudiosInicial = valor('estudios');
    const valoresE = Array.from({ length: 6 }, (_, i) => ({ asignaturas: [{ id: `x${i}`, nombre: `X${i}` }], examenes: [] }));
    const valoresH = Array.from({ length: 6 }, (_, i) => conTestigo(conBloque(HORARIO(), 'b3', { aula: `V${i}` })));
    const nuevas = [];
    let h = A.pantalla.horario;
    for (let i = 0; i < 3; i += 1) { h = conBloque(h, 'b1', { aula: `N${i}` }); nuevas.push(A.w.guardar(h)); }
    const res = await Promise.all([...valoresE.map((v) => antigua(S1, 'estudios', v)), ...valoresH.map((v) => antigua(S1, 'horarioTop', v)), ...nuevas]);
    await A.w.esperar();
    ok(res.slice(0, 12).every((r) => !r.error), 'doce escrituras antiguas a la vez: ninguna falla');
    const hf = valor('horarioTop');
    ok(aula(hf, 'b1') === 'N2' && aula(hf, 'b3') === 'A3', '🚨 el horario es el de la versión nueva (las antiguas no se aplicaron)');
    const apartadas = copiasDe('version_antigua').map((c) => aula(c.contenido.intentado, 'b3')).sort();
    ok(apartadas.join() === valoresH.map((v) => aula(v, 'b3')).sort().join(), 'y cada una de las seis está apartada, una vez');
    const rescE = copiasDe('rescate').filter((c) => c.contenido.clave === 'estudios');
    const vistos = new Set([canon(valor('estudios')), ...rescE.flatMap((c) => [canon(c.contenido.antes), canon(c.contenido.despues)])]);
    ok([estudiosInicial, ...valoresE].every((v) => vistos.has(canon(v))), '🚨 Estudios: cada valor (el inicial y los seis) está en la cuenta o en una copia: nada se perdió');
    A.w.cerrar();
    /* Solo con la red (sin P4): seis escrituras del horario a la vez. */
    psqlArchivo(SQL_ANTIGUAS_DESHACER);
    sembrar();
    const inicial = valor('horarioTop');
    await Promise.all(valoresH.map((v) => antigua(S1, 'horarioTop', v)));
    const rescH = copiasDe('rescate').filter((c) => c.contenido.clave === 'horarioTop');
    const vistosH = new Set([canon(valor('horarioTop')), ...rescH.flatMap((c) => [canon(c.contenido.antes), canon(c.contenido.despues)])]);
    ok([inicial, ...valoresH].every((v) => vistosH.has(canon(v))) && rescH.length === 6, '🚨 solo con la red: seis escrituras a la vez, seis rescates, y ningún valor perdido');
    psqlArchivo(SQL_ANTIGUAS);
  }

  seccion('F · La secuencia entera P1 → P4, con una versión antigua escribiendo en cada momento');
  {
    psqlArchivo(SQL_ANTIGUAS_DESHACER); psqlArchivo(SQL_RESCATE_DESHACER);
    sembrar();
    const escritos = [];
    const old = async (v) => { escritos.push(v); return antigua(S1, 'horarioTop', v); };
    await old(conTestigo(conBloque(HORARIO(), 'b1', { aula: 'antes-de-P1' })));
    escritos.length = 0;   // lo de antes de P1 no está cubierto (es la situación de hoy)
    psqlArchivo(SQL_RESCATE);   // P1
    await old(conTestigo(conBloque(HORARIO(), 'b1', { aula: 'P1' })));
    const A = aparato(S1, 'A');   // P2: se publica la versión nueva
    /* Sobre lo que A tiene en pantalla; si choca, «Ver lo de ahora» (su cambio queda apartado) y sigue desde ahí. */
    const nuevo = async (cambio) => { const v = conBloque(A.pantalla.horario, 'b2', { aula: cambio }); const r = await A.w.guardar(v); await A.w.esperar(); if (r.ok) A.pantalla.horario = H.normalizarHorarioTop(valor('horarioTop')); if (r.conflicto) A.w.verLoDeAhora(); return r; };
    await nuevo('P2-nueva');
    await old(conTestigo(conBloque(HORARIO(), 'b1', { aula: 'P2-antigua' })));
    await nuevo('P3-nueva');   // P3: los aparatos se van actualizando
    await old(conTestigo(conBloque(HORARIO(), 'b1', { aula: 'P3-antigua' })));
    psqlArchivo(SQL_ANTIGUAS);   // P4
    await old(conTestigo(conBloque(HORARIO(), 'b1', { aula: 'P4-antigua' })));
    await nuevo('P4-nueva');
    await old(conTestigo(conBloque(HORARIO(), 'b1', { aula: 'P4-antigua-2' })));
    const todas = JSON.parse(psql(`select coalesce(json_agg(contenido), '[]') from copias_apartadas where user_id='${HV_U1}'`));
    const enAlgunSitio = (aulaB1) => aula(valor('horarioTop'), 'b1') === aulaB1 || todas.some((c) => [c.antes, c.despues, c.intentado, c.vigente, c.horario && c.horario.valor].some((v) => v && aula(v, 'b1') === aulaB1));
    const perdidos = escritos.map((v) => aula(v, 'b1')).filter((x) => !enAlgunSitio(x));
    ok(perdidos.length === 0, `🚨 todo lo que escribió la versión antigua desde P1 está en la cuenta o en una copia (${escritos.length} escrituras; perdidas: ${perdidos.join(', ') || 'ninguna'})`);
    const enCopias = (aulaB2) => aula(valor('horarioTop'), 'b2') === aulaB2 || todas.some((c) => [c.antes, c.despues, c.intentado, c.vigente, c.horario && c.horario.valor].some((v) => v && aula(v, 'b2') === aulaB2));
    ok(['P2-nueva', 'P3-nueva', 'P4-nueva'].every(enCopias), '🚨 y todo lo que guardó la versión nueva, también');
    ok(aula(valor('horarioTop'), 'b1') !== 'P4-antigua' && aula(valor('horarioTop'), 'b1') !== 'P4-antigua-2', 'desde P4, lo de la versión antigua no se aplica: está apartado');
    A.w.cerrar();
  }

  seccion('G · La vuelta atrás: quitar las reglas no borra ninguna copia');
  {
    const antes = cuantas();
    psqlArchivo(SQL_ANTIGUAS_DESHACER);
    const rg = await reglas();
    ok(!hayDisparador('horarios_versiones_antiguas') && rg.versionesAntiguas === false && rg.horarioTop === false && cuantas() === antes, 'quitar P4: el disparador se va, las copias se quedan');
    const r = await antigua(S1, 'horarioTop', conTestigo(conBloque(HORARIO(), 'b1', { aula: 'tras-P4' })));
    ok(!r.error && aula(valor('horarioTop'), 'b1') === 'tras-P4' && cuantas() === antes + 1, 'sin P4, la versión antigua vuelve a escribir, y la red (P1) rescata lo que pisa');
    psqlArchivo(SQL_RESCATE_DESHACER);
    const rg2 = await reglas();
    await antigua(S1, 'horarioTop', conTestigo(conBloque(HORARIO(), 'b1', { aula: 'sin-red' })));
    ok(!hayDisparador('horarios_rescate') && rg2.rescate === false && cuantas() === antes + 1, 'quitar P1: ya no se rescata nada, y lo rescatado se queda');
  }
} finally {
  limpiar();
  try { quitarTodo(); } catch (e) { fallos += 1; console.log('  ✗ no se pudo quitar el SQL del laboratorio:', e.message); }
}
ok(!instalado() && !hayDisparador('horarios_rescate') && !hayDisparador('horarios_versiones_antiguas'), 'al terminar, el laboratorio queda como estaba');
proxy.close();
console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones de R5 contra Postgres (rescate y versiones antiguas)`);
process.exit(fallos ? 1 : 0);
