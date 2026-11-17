// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R4 — CAMBIOS APARTADOS CONTRA EL SERVIDOR DE VERDAD (nivel 3, solo laboratorio)
//
// Lo que hace la aplicación (`cambiosApartados.js` + `escritorOperaciones.js` + `transporteProtegido` de supabase.js)
// contra un Postgres + PostgREST LOCALES con `supabase/horarios-protegido.sql` instalado por esta prueba y quitado al
// terminar:
//   A · listar las copias (solo las propias, por RLS) y leer una con su contenido
//   B · la tabla solo se escribe por sus funciones: ni borrar ni cambiar una copia por otro camino
//   C · recuperar como operación NUEVA y protegida, sin pisar lo del otro aparato; la copia NO se borra
//   D · la cuenta cambia justo antes de que llegue la recuperación: no se aplica y nada se pisa
//   E · borrar una asignatura se repite sobre los datos de hoy (lo de después va a la papelera)
//   F · eliminar a petición: el tamaño lógico baja; otra vez, «no existe»
//   G · leer sin respuesta y con la sesión caducada: cada uno su motivo
//
// ⚠️ NUNCA contra Supabase alojado. Es OPCIONAL: sin las variables del laboratorio se omite (y lo dice):
//   HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2   (ver `test-historial-versiones-postgrest.mjs`)
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-cambios-apartados-postgrest.mjs
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
const valor = (k) => { const t = psql(`select value::text from app_data where user_id='${HV_U1}' and key='${k}'`); return t ? JSON.parse(t) : null; };
const poner = (k, v) => psql(`insert into app_data (user_id, key, value) values ('${HV_U1}','${k}',${lit(v)}) on conflict (user_id, key) do update set value = excluded.value, updated_at = now()`);
const instalado = () => psql("select to_regclass('public.operaciones_protegidas') is not null") === 't';
const copiasEnCuenta = () => Number(psql(`select count(*) from copias_apartadas where user_id='${HV_U1}'`));
const limpiar = () => {
  psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);
  if (instalado()) psql('truncate operaciones_protegidas, copias_apartadas, operaciones_corte');
};
const aula = (h, id) => (h.bloques.find((b) => b.id === id) || {}).aula;
const conBloque = (h, id, cambio) => ({ ...h, bloques: h.bloques.map((b) => (b.id === id ? { ...b, ...cambio } : b)) });

const sembrar = () => {
  limpiar();
  poner('estudios', {
    programas: [{ id: 'p1', nombre: 'Bachillerato' }],
    asignaturas: [{ id: 'mat', nombre: 'Matemáticas', programaIds: ['p1'] }, { id: 'his', nombre: 'Historia', programaIds: ['p1'] }],
    examenes: [{ id: 'e1', asignaturaId: 'mat', tema: 'Derivadas', fecha: '2026-12-01' }], horas: [], temas: [], entregas: [], eventos: [], actividades: [],
  });
  poner('papelera', { elementos: [], retencionDias: 30 });
  poner('horarioTop', {
    horarios: [{ id: 'hh', nombre: 'Curso', activo: true, columnas: [{ id: 'c1', horarioId: 'hh', nombre: 'L', dia: 1, posicion: 0, visible: true }], filas: [{ id: 'f1', horarioId: 'hh', inicio: '08:00', fin: '09:00', posicion: 0 }] }],
    actividades: [{ id: 'am', nombre: 'Matemáticas', asignaturaId: 'mat' }, { id: 'ah', nombre: 'Historia', asignaturaId: 'his' }],
    bloques: [
      { id: 'b1', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'am', inicio: '08:00', fin: '09:00', aula: 'A1' },
      { id: 'b2', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '09:00', fin: '10:00', aula: 'A2' },
      { id: 'b3', horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: 'ah', inicio: '10:00', fin: '11:00', aula: 'A3' },
    ],
    excepciones: [], version: 1, testigo: { formato: 1, revision: crypto.randomUUID(), base: null, aparato: 'semilla' },
  });
};
const aparato = (S, nombre) => {
  const pantalla = { horario: H.normalizarHorarioTop(valor('horarioTop')) };
  const w = W.crearEscritorDeOperaciones({
    transporte: S.transporteProtegido, usuario: HV_U1, aparato: nombre, versionApp: '3.163.0',
    inicial: { valor: valor('horarioTop'), existe: true }, alAdoptar: (v) => { pantalla.horario = H.normalizarHorarioTop(v); },
    normalizarHorario: H.normalizarHorarioTop,
  });
  return { w, pantalla };
};
/* Lo que hace App.jsx al recuperar (`recuperarCopiaApartada`): leer lo de ahora, preparar y mandar por el escritor. */
const leerAhora = async (S) => { const r = await S.transporteProtegido.leer(C.CLAVES_RECUPERACION); return r.ok ? r.data.claves : null; };
/* Una copia apartada de A: B cambia b2 y A cambia b1 sobre lo viejo. */
const apartarUnaDeA = async () => {
  const A = aparato(S1, 'A'); const B = aparato(S4, 'B');
  ok((await B.w.guardar(conBloque(B.pantalla.horario, 'b2', { aula: 'DE-B' }))).ok, 'B cambia una clase (b2)');
  const r = await A.w.guardar(conBloque(A.pantalla.horario, 'b1', { aula: 'DE-A' }));
  await A.w.esperar();
  ok(r.conflicto && copiasEnCuenta() === 1 && aula(valor('horarioTop'), 'b1') === 'A1', 'A cambia otra (b1) sobre lo viejo: el servidor la aparta entera y no la aplica');
  return { A, B };
};

limpiar();
try {
  if (instalado()) psqlArchivo(SQL_DESHACER);
  psqlArchivo(SQL);
  psql("notify pgrst, 'reload schema'");
  let listo = false;
  for (let i = 0; i < 60 && !listo; i += 1) { const p = await S1.transporteProtegido.protocolo(); const l = await S1.transporteProtegido.copias(); listo = !!p.ok && !!l.ok; if (!listo) await dormir(100); }
  ok(listo, 'el servidor de R1 está instalado en el laboratorio y contesta (funciones y tabla de copias)');

  seccion('A · Listar las copias (solo las propias) y leer una');
  sembrar();
  const { A, B } = await apartarUnaDeA();
  const l = await S1.transporteProtegido.copias();
  ok(l.ok && l.data.length === 1 && !('contenido' in l.data[0]) && l.data[0].tipo === 'conflicto' && l.data[0].vista === false && l.data[0].tamano > 0, 'la lista: una copia, sin el contenido, nueva y con su tamaño');
  const id = l.data[0].id;
  const c1 = await S1.transporteProtegido.copia(id);
  ok(c1.ok && c1.data && c1.data.contenido.opId === id && Array.isArray(c1.data.contenido.horario.cambios), 'al leerla: la operación entera, con su cambio del horario por elementos');
  const d = C.describirCopia(l.data[0], { aparato: 'A' });
  ok(d.titulo === 'Un cambio de tu horario' && d.deEsteAparato && d.motivoTexto === C.MOTIVOS_APARTADA.revision, 'descrita: «Un cambio de tu horario», de este aparato, por qué se apartó');
  const l2 = await S2.transporteProtegido.copias();
  const c2 = await S2.transporteProtegido.copia(id);
  ok(l2.ok && l2.data.length === 0 && c2.ok && c2.data === null, '🚨 otra cuenta no ve ni lee esta copia (RLS)');
  ok((await S1.transporteProtegido.copiaVista(id)).data.estado === 'vista' && (await S1.transporteProtegido.copias()).data[0].vista === true, 'inspeccionarla la marca vista');

  seccion('B · La tabla solo se escribe por sus funciones');
  {
    const borrar = await S1.supabase.from('copias_apartadas').delete().eq('id', id).select('id');
    const cambiar = await S1.supabase.from('copias_apartadas').update({ vista: false }).eq('id', id).select('id');
    ok(!!borrar.error && !!cambiar.error && copiasEnCuenta() === 1, '🚨 borrar o cambiar una copia directamente se rechaza: sigue ahí');
  }

  seccion('C · Recuperar como operación nueva y protegida, sin pisar a B');
  {
    A.w.verLoDeAhora();
    const actual = await leerAhora(S1);
    const prep = C.prepararRecuperacion({ fila: c1.data, actual });
    ok(prep.estado === 'recuperable', 'se puede recuperar: B tocó otra clase');
    const r = await A.w.guardarOperacion({ tipo: 'recuperar_copia', horario: prep.horario, claves: prep.claves, base: actual.horarioTop });
    const h = valor('horarioTop');
    ok(r.ok && aula(h, 'b1') === 'DE-A' && aula(h, 'b2') === 'DE-B', '🚨 en la cuenta: lo de A y lo de B (nada pisado)');
    ok(psql(`select count(*) from operaciones_protegidas where user_id='${HV_U1}' and tipo='recuperar_copia' and resultado='aplicada'`) === '1', 'en el registro: una operación recuperar_copia aplicada');
    ok(copiasEnCuenta() === 1, '🚨 la copia NO se borra sola al recuperarla');
    ok(C.prepararRecuperacion({ fila: c1.data, actual: await leerAhora(S1) }).estado === 'ya_aplicada', 'y ahora: «Ya está en tu cuenta»');
  }

  seccion('D · La cuenta cambia justo antes de que llegue: no se pisa nada');
  {
    sembrar();
    const { A: A2 } = await apartarUnaDeA();
    A2.w.verLoDeAhora();
    const fila = (await S1.transporteProtegido.copia((await S1.transporteProtegido.copias()).data[0].id)).data;
    const actual = await leerAhora(S1);
    const prep = C.prepararRecuperacion({ fila, actual });
    antesDe.push({ ruta: /protegido_aplicar/, fn: () => { const h = valor('horarioTop'); poner('horarioTop', { ...conBloque(h, 'b3', { aula: 'OTRO' }), testigo: { ...h.testigo, revision: crypto.randomUUID() } }); } });
    const r = await A2.w.guardarOperacion({ tipo: 'recuperar_copia', horario: prep.horario, claves: prep.claves, base: actual.horarioTop });
    await A2.w.esperar();
    const h = valor('horarioTop');
    ok(!r.ok && r.conflicto && aula(h, 'b3') === 'OTRO' && aula(h, 'b1') === 'A1', '🚨 el servidor no la aplica: lo de después se queda y lo de A no se escribe encima');
    ok(copiasEnCuenta() === 2, 'la recuperación se aparta entera (otra copia) y la original sigue');
    A2.w.cerrar();
  }

  seccion('E · Borrar una asignatura se repite sobre los datos de hoy');
  {
    sembrar();
    const A3 = aparato(S1, 'A'); const B3 = aparato(S4, 'B');
    ok((await B3.w.guardar(conBloque(B3.pantalla.horario, 'b3', { aula: 'Z' }))).ok, 'B cambia el horario');
    const est = P.normalizarEstudiosCargados(valor('estudios')); const pap = P.normalizarPapeleraCargada(valor('papelera'));
    const plan = P.prepararBorradoAsignatura({ estudios: est, papelera: pap, horarioTop: A3.pantalla.horario, id: 'mat' });
    const r = await A3.w.guardarOperacion({ tipo: 'borrar_asignatura', horario: plan.horario, asunto: plan.asunto, claves: [{ clave: 'estudios', antes: est, despues: plan.estudios, normalizar: P.normalizarEstudiosCargados }, { clave: 'papelera', antes: pap, despues: plan.papelera, normalizar: P.normalizarPapeleraCargada }] });
    await A3.w.esperar();
    ok(r.conflicto && copiasEnCuenta() === 1 && valor('estudios').asignaturas.some((a) => a.id === 'mat'), 'A borra Matemáticas sobre lo viejo: se aparta y no se borra nada');
    /* Después, alguien le cambia el aula a Matemáticas. */
    const e = valor('estudios'); poner('estudios', { ...e, asignaturas: e.asignaturas.map((a) => (a.id === 'mat' ? { ...a, aula: 'B2' } : a)) });
    A3.w.verLoDeAhora();
    const fila = (await S1.transporteProtegido.copia((await S1.transporteProtegido.copias()).data[0].id)).data;
    const actual = await leerAhora(S1);
    const prep = C.prepararRecuperacion({ fila, actual });
    ok(prep.estado === 'recuperable' && /Matemáticas tal como está ahora/.test(prep.resumen[0]), 'se puede recuperar: se repite el borrado sobre lo de hoy');
    const r2 = await A3.w.guardarOperacion({ tipo: 'recuperar_copia', horario: prep.horario, claves: prep.claves, asunto: prep.asunto, base: actual.horarioTop });
    const entrada = valor('papelera').elementos.find((x) => x.idOriginal === 'mat');
    ok(r2.ok && !valor('estudios').asignaturas.some((a) => a.id === 'mat') && entrada && entrada.datos.aula === 'B2', '🚨 borrada, y lo de después (aula B2) va a la papelera: no se pierde');
    ok(aula(valor('horarioTop'), 'b3') === 'Z' && !valor('horarioTop').bloques.some((b) => b.id === 'b1'), 'el cambio de B se queda; las clases de Matemáticas salen');
    A3.w.cerrar(); B3.w.cerrar();
  }

  seccion('F · Eliminar a petición, y el espacio lógico');
  {
    const e1 = await S1.transporteProtegido.espacio();
    const idE = (await S1.transporteProtegido.copias()).data[0].id;
    ok(e1.ok && e1.data.medida === 'logica' && e1.data.copias.cuantas === 1 && e1.data.copias.bytes > 0, 'antes: una copia, con sus bytes (medida lógica)');
    const texto = C.textoDelEspacio(e1.data);
    ok(texto && /datos guardados/.test(texto.linea) && /no el espacio en disco/.test(texto.explica), 'dicho como datos guardados, no como disco');
    const antesH = psql(`select value::text from app_data where user_id='${HV_U1}' and key='horarioTop'`);
    const r = await S1.transporteProtegido.copiaEliminar(idE);
    const e2 = await S1.transporteProtegido.espacio();
    ok(r.ok && r.data.estado === 'eliminada' && copiasEnCuenta() === 0 && e2.data.copias.cuantas === 0 && e2.data.copias.bytes === 0, 'eliminada: deja de contar al momento en el tamaño lógico');
    ok(psql(`select value::text from app_data where user_id='${HV_U1}' and key='horarioTop'`) === antesH, 'lo de la cuenta no cambia al eliminarla');
    ok((await S1.transporteProtegido.copiaEliminar(idE)).data.estado === 'no_existe' && (await S1.transporteProtegido.copia(idE)).data === null, 'otra vez: «no existe», y ya no se puede leer');
  }

  seccion('G · Leer sin respuesta, y con la sesión caducada');
  {
    /* El cliente de Supabase reintenta solo una lectura que se corta: se corta todas las veces que lo intente. */
    for (let i = 0; i < 6; i += 1) cortes.push({ ruta: /copias_apartadas/, modo: 'antes' });
    const r = await S1.transporteProtegido.copias();
    ok(!r.ok && r.sinRespuesta && C.motivoDeLectura(r) === 'sinConexion', `sin respuesta: «sin conexión», con su texto (${JSON.stringify({ ok: r.ok, sinRespuesta: r.sinRespuesta, status: r.status, code: r.error && r.error.code })})`);
    cortes.length = 0;
    const s = await S3.transporteProtegido.copias();
    ok(!s.ok && s.sesion && C.motivoDeLectura(s) === 'sesion', 'con la sesión caducada: «tu sesión ha caducado»');
  }
  A.w.cerrar(); B.w.cerrar();
} finally {
  limpiar();
  try { if (instalado()) psqlArchivo(SQL_DESHACER); } catch (e) { fallos += 1; console.log('  ✗ no se pudo quitar el SQL del laboratorio:', e.message); }
}
ok(!instalado(), 'al terminar, el laboratorio queda como estaba (las funciones y tablas de R1, quitadas)');
/* Sin la tabla (R1 quitada), la lista dice «sin funciones», no un error. */
psql("notify pgrst, 'reload schema'");
let sin = null;
for (let i = 0; i < 60; i += 1) { sin = await S1.transporteProtegido.copias(); if (!sin.ok && sin.status === 404) break; await dormir(100); }
proxy.close();
ok(!sin.ok && C.motivoDeLectura(sin) === 'sinFunciones', `sin las tablas de R1: «sin funciones» (la pantalla lo dice, no falla) (${JSON.stringify({ ok: sin.ok, status: sin.status, code: sin.error && sin.error.code, msg: sin.error && String(sin.error.message).slice(0, 80) })})`);
console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones de R4 contra el servidor de R1`);
process.exit(fallos ? 1 : 0);
