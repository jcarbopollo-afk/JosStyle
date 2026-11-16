// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R2 — EL CLIENTE DE VERDAD CONTRA EL SERVIDOR DE R1 (nivel 3, D4, solo laboratorio local)
//
// `src/lib/supabase.js` (`transporteProtegido`), `src/lib/operacionesProtegidas.js` y `src/lib/escritorOperaciones.js`
// contra un Postgres + PostgREST LOCALES con `supabase/horarios-protegido.sql` instalado por esta prueba (y quitado al
// terminar). Comprueba que el cliente RESPETA las respuestas y condiciones del servidor:
//   A · sin las funciones instaladas: el cliente no escribe nada a ciegas
//   B · el transporte: protocolo, leer, estado, una operación inválida, espacio
//   C · paridad de la validación: cliente y servidor dicen el mismo motivo
//   D · paridad de los cambios por elemento: el mismo resultado y el mismo fallo (400 casos al azar)
//   E · dos aparatos: el que llega tarde no pisa, su operación queda apartada en el servidor; las dos salidas
//   F · respuestas perdidas de verdad (la conexión se corta después de aplicarse, o antes): estado, reenvío, mismo opId
//   G · varias claves: todo o nada; condiciones con lo guardado (sin conflictos falsos); C1 y C2
//   H · automático que choca: adopta sin copia
//   I · dos aparatos a la vez sobre la misma revisión: uno entra y el otro se aparta
//
// ⚠️ NUNCA contra Supabase alojado. Es OPCIONAL: sin las variables del laboratorio se omite (y lo dice):
//   HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2   (ver `test-historial-versiones-postgrest.mjs`)
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-escritor-operaciones-postgrest.mjs
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
const token = (sub) => { const h = b64({ alg: 'HS256', typ: 'JWT' }); const p = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', HV_JWT_SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const PG_ENV = { ...process.env, PGOPTIONS: '-c client_min_messages=warning' };
const psql = (sql) => execFileSync('psql', [HV_PSQL, '-Atc', sql], { env: PG_ENV }).toString().trim();
const psqlArchivo = (ruta) => execFileSync('psql', [HV_PSQL, '-v', 'ON_ERROR_STOP=1', '-q', '-f', ruta], { env: PG_ENV }).toString();
const lit = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const copia = (v) => JSON.parse(JSON.stringify(v));
const dormir = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/* ── El proxy: quita el `/rest/v1` de supabase-js, contesta CORS y sabe perder la red de una petición concreta:
      'despues' = la reenvía, el servidor la aplica y el cliente NO recibe la respuesta; 'antes' = no la reenvía. ── */
// El proxy escucha en un puerto que da el sistema (listen(0)): uno fijo de 5544x cae en el rango efímero
// (32768–60999) y una conexión saliente podía tenerlo ocupado (EADDRINUSE en verificar.sh, R2).
const destino = new URL(HV_PGRST_URL);
const cortes = [];            // [{ ruta: /protegido_aplicar/, modo: 'antes' | 'despues' }]
const vistas = [];            // cada petición: { ruta, cuerpo }
const proxy = http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
  const trozos = []; req.on('data', (c) => trozos.push(c));
  req.on('end', () => {
    const cuerpo = Buffer.concat(trozos);
    const ruta = req.url.replace(/^\/rest\/v1/, '');
    vistas.push({ ruta, cuerpo: cuerpo.toString() });
    const i = cortes.findIndex((c) => c.ruta.test(ruta));
    const corte = i >= 0 ? cortes.splice(i, 1)[0] : null;
    if (corte && corte.modo === 'antes') { req.socket.destroy(); return; }
    const headers = { ...req.headers }; delete headers.host;
    const up = http.request({ host: destino.hostname, port: destino.port, method: req.method, path: ruta, headers }, (ur) => {
      const ub = []; ur.on('data', (c) => ub.push(c));
      ur.on('end', () => {
        if (corte && corte.modo === 'despues') { req.socket.destroy(); return; }
        res.writeHead(ur.statusCode, { ...ur.headers, ...cors }); res.end(Buffer.concat(ub));
      });
    });
    up.end(cuerpo);
  });
});
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const URL_PROXY = `http://127.0.0.1:${proxy.address().port}`;
const entornos = { 1: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1) }, 2: { VITE_SUPABASE_URL: URL_PROXY, VITE_SUPABASE_ANON_KEY: token(HV_U1) } };
register('data:text/javascript,' + encodeURIComponent(`const E = ${JSON.stringify(entornos)};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = url.match(/\\/lib\\/supabase\\.js\\?op=(\\d)$/);
  if (m) return { ...r, source: String(r.source).replace(/import\\.meta\\.env/g, JSON.stringify(E[m[1]])), shortCircuit: true };
  return r;
}`));
/* Dos «aparatos» del MISMO usuario: dos clientes de supabase-js con su propia conexión. */
const S1 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?op=1');
const S2 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?op=2');
const O = await import(pathToFileURL(join(RAIZ, 'src/lib/operacionesProtegidas.js')).href);
const W = await import(pathToFileURL(join(RAIZ, 'src/lib/escritorOperaciones.js')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const valor = (k, u = HV_U1) => { const t = psql(`select value::text from app_data where user_id='${u}' and key='${k}'`); return t ? JSON.parse(t) : null; };
const poner = (k, v, u = HV_U1) => psql(`insert into app_data (user_id, key, value) values ('${u}','${k}',${lit(v)}) on conflict (user_id, key) do update set value = excluded.value, updated_at = now()`);
const instalado = () => psql("select to_regclass('public.operaciones_protegidas') is not null") === 't';
const registros = () => Number(psql(`select count(*) from operaciones_protegidas where user_id='${HV_U1}'`));
const copiasEnCuenta = () => Number(psql(`select count(*) from copias_apartadas where user_id='${HV_U1}'`));
const limpiar = () => {
  psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);
  if (instalado()) psql('truncate operaciones_protegidas, copias_apartadas, operaciones_corte');
};
const sinErrores = async (fn) => { const e = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = e; } };
const horario = (n) => ({ horarios: [], bloques: [{ id: `b${n}` }], n });
const escritor = (S, aparato, opciones = {}) => {
  const adoptados = []; const aplicadas = [];
  const v = valor('horarioTop');
  const w = W.crearEscritorDeOperaciones({
    transporte: S.transporteProtegido, usuario: HV_U1, aparato, versionApp: '3.163.0',
    inicial: { valor: v, existe: v !== null },
    alAdoptar: (x, info) => adoptados.push({ v: copia(x), ...info }), alAplicar: (op) => aplicadas.push(op), ...opciones,
  });
  return { w, adoptados, aplicadas };
};
/* La operación tal como la construye el cliente, a mano, para las pruebas de paridad. */
const opCon = ({ claves = [], horarioValor, manual = true, opId = crypto.randomUUID() } = {}) => {
  const rev = crypto.randomUUID();
  const actual = valor('horarioTop');
  const base = actual && actual.testigo ? actual.testigo.revision : null;
  return O.crearOperacion({
    opId, tipo: 'editar_horario', manual, aparato: 'lab', versionApp: '3.163.0', creadaEn: new Date().toISOString(),
    horario: { base, baseExiste: actual !== null, valor: { ...(horarioValor || { bloques: [] }), version: 1, testigo: { formato: 1, revision: rev, base, aparato: 'lab' } } },
    claves,
  });
};

limpiar();
try {
  if (instalado()) psqlArchivo(SQL_DESHACER);
  psql("notify pgrst, 'reload schema'");
  for (let i = 0; i < 50; i += 1) { const p = await sinErrores(() => S1.transporteProtegido.protocolo()); if (!p.ok && p.sinFunciones) break; await dormir(100); }

  seccion('A · Sin las funciones del servidor: nada a ciegas');
  {
    const p = await sinErrores(() => S1.transporteProtegido.protocolo());
    ok(!p.ok && p.sinFunciones === true, 'protocolo sin las funciones instaladas: «sinFunciones» (no «sin respuesta»)');
    const { w } = escritor(S1, 'A');
    const r = await sinErrores(() => w.guardar(horario(1)));
    ok(!r.ok && r.bloqueado && r.error.code === 'sin_protocolo' && w.motivoBloqueo() === W.MOTIVO_PROTOCOLO_HORARIO, 'el escritor queda en solo lectura (sin_protocolo)');
    ok(valor('horarioTop') === null && !vistas.some((x) => /protegido_aplicar/.test(x.ruta)), 'y no ha escrito nada ni ha intentado aplicar');
    w.cerrar();
  }

  psqlArchivo(SQL);
  psql("notify pgrst, 'reload schema'");
  for (let i = 0; i < 50; i += 1) { const p = await sinErrores(() => S1.transporteProtegido.protocolo()); if (p.ok) break; await dormir(100); }

  seccion('B · El transporte, por RPC');
  {
    const t0 = Date.now();
    const p = await S1.transporteProtegido.protocolo();
    const lp = O.leerProtocolo(p.data, { versionApp: '3.163.0', enviadoEn: t0, recibidoEn: Date.now() });
    ok(p.ok && p.data.version === 1 && lp.ok && Math.abs(lp.desfaseMs) < 5000, 'protocolo: versión 1, la hora del servidor y el desfase medido');
    ok(vistas.at(-1).ruta === '/rpc/protegido_protocolo', '…por /rpc/protegido_protocolo');
    poner('estudios', { asignaturas: [{ id: 'a' }] });
    const l = await S1.transporteProtegido.leer(['horarioTop', 'estudios']);
    ok(l.ok && l.data.estado === 'leidas' && l.data.claves.estudios.existe && l.data.claves.horarioTop.existe === false && typeof l.data.claves.estudios.sello === 'string', 'leer: lo guardado tal cual, con su sello, y lo que no existe');
    const e = await S1.transporteProtegido.estado(crypto.randomUUID());
    ok(e.ok && e.data.estado === 'desconocida', 'estado de una operación que no existe: desconocida');
    const inv = await S1.transporteProtegido.aplicar({ formato: 1 });
    ok(inv.ok && inv.data.estado === 'invalida' && inv.data.motivo === 'opId', 'una operación inválida: el servidor contesta «invalida» con su motivo (no un error de transporte)');
    const esp = await S1.transporteProtegido.espacio();
    ok(esp.ok && esp.data.medida === 'logica', 'espacio: la medida lógica');
    const prohibida = await S1.transporteProtegido.leer(['fitness']);
    ok(prohibida.ok && prohibida.data.estado === 'invalida' && prohibida.data.motivo === 'clave_no_permitida', 'leer una clave fuera de la lista: el servidor se niega');
    limpiar();
  }

  seccion('C · Paridad de la validación: el mismo motivo en los dos lados');
  {
    const base = () => ({ formato: 1, opId: crypto.randomUUID(), tipo: 'editar_horario', manual: true, aparato: 'lab', versionApp: '3.163.0', creadaEn: new Date().toISOString(),
      horario: { base: 'r1', baseExiste: true, valor: { version: 1, testigo: { formato: 1, revision: crypto.randomUUID(), base: 'r1' } } } });
    const casos = [
      (o) => ({ ...o, formato: 2 }), (o) => ({ ...o, opId: 'x' }), (o) => ({ ...o, tipo: '' }), (o) => ({ ...o, manual: 1 }), (o) => ({ ...o, creadaEn: 'nunca' }),
      (o) => ({ ...o, horario: { ...o.horario, valor: {} } }), (o) => ({ ...o, horario: { ...o.horario, valor: { testigo: { revision: '' } } } }),
      (o) => ({ ...o, horario: { ...o.horario, base: 3 } }), (o) => ({ ...o, horario: { ...o.horario, baseExiste: null } }),
      (o) => ({ ...o, horario: { ...o.horario, base: o.horario.valor.testigo.revision } }),
      (o) => ({ ...o, claves: {} }), (o) => ({ ...o, claves: [{ clave: 1 }] }), (o) => ({ ...o, claves: [{ clave: 'fitness', cambios: [{ fijar: [] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ fijar: [{ campo: 'a', valor: 1 }] }] }, { clave: 'estudios', cambios: [{ fijar: [{ campo: 'a', valor: 1 }] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', inicial: 3, cambios: [{ fijar: [] }] }] }), (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: ['x'] }] }), (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: [3], fijar: [] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], orden: [], fijar: [] }] }] }), (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ anadir: [] }] }] }), (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], quitar: [{ id: 'x' }] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], reemplazar: [{ id: 'x', igual: 1, nuevo: { id: 'z' } }] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], anadir: [{ elemento: { id: 5 } }] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], anadir: [{ elemento: { id: 'x' }, posicion: true }] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], orden: ['x', 2] }] }] }), (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ fijar: [{ valor: 1 }] }] }] }),
      (o) => { const { horario: _h, ...r } = o; void _h; return r; },
      (o) => o,
      (o) => ({ ...o, claves: [{ clave: 'papelera', cambios: [{ camino: ['elementos'], anadir: [{ elemento: { id: 'p' }, posicion: 0 }], orden: ['p'] }] }] }),
      (o) => { const { opId: _o, ...r } = o; void _o; return r; }, (o) => { const { tipo: _t, ...r } = o; void _t; return r; },
      (o) => { const { manual: _m, ...r } = o; void _m; return r; }, (o) => { const { creadaEn: _c, ...r } = o; void _c; return r; },
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], orden: 'x' }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], quitar: [3] }] }] }),
      (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ fijar: 'x' }] }] }),
    ];
    let iguales = 0; const distintos = [];
    for (const f of casos) {
      const op = f(base());
      const cli = O.validarOperacion(op);
      const r = await S1.transporteProtegido.aplicar(op);
      const srv = r.ok && r.data.estado === 'invalida' ? r.data.motivo : null;
      if (cli === srv) iguales += 1; else distintos.push(`${cli}≠${srv}`);
    }
    ok(iguales === casos.length, `${casos.length} operaciones: el cliente y el servidor dicen lo mismo (${iguales}/${casos.length})${distintos.length ? ` — distintos: ${distintos.join(', ')}` : ''}`);
    limpiar();
  }

  seccion('D · Paridad de los cambios por elemento (400 casos al azar)');
  {
    const azar = (k) => Math.floor(Math.random() * k);
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const elem = (id) => ({ id, v: azar(3), ...(Math.random() < 0.3 ? { sub: { x: azar(2), y: [1, 2] } } : {}) });
    let iguales = 0; const distintos = [];
    for (let i = 0; i < 400; i += 1) {
      const est = { asignaturas: ids.filter(() => Math.random() < 0.6).map(elem), nota: azar(3) };
      if (Math.random() < 0.15) delete est.asignaturas;
      poner('estudios', est);
      const lista = est.asignaturas || [];
      const algo = () => (lista.length && Math.random() < 0.7 ? lista[azar(lista.length)] : elem(ids[azar(5)]));
      const cambio = {};
      const tipo = azar(6);
      if (tipo === 5) {
        cambio.camino = []; cambio.fijar = [{ campo: 'nota', ...(Math.random() < 0.7 ? { igual: Math.random() < 0.7 ? est.nota : 9 } : {}), valor: azar(9) }];
      } else {
        cambio.camino = Math.random() < 0.05 ? ['nota'] : ['asignaturas'];
        if (tipo === 0 || tipo === 4) { const x = algo(); cambio.quitar = [{ id: x.id, igual: Math.random() < 0.75 ? x : { ...x, v: 9 } }]; }
        if (tipo === 1 || tipo === 4) { const x = algo(); cambio.reemplazar = [{ id: x.id, igual: Math.random() < 0.75 ? x : { ...x, v: 9 }, nuevo: { ...x, v: 7 } }]; }
        if (tipo === 2 || tipo === 4) cambio.anadir = [{ elemento: elem(ids[azar(5)]), ...(Math.random() < 0.5 ? { posicion: azar(4) } : {}) }];
        if (tipo === 3 || Math.random() < 0.2) cambio.orden = [...ids].sort(() => Math.random() - 0.5).slice(0, 3);
      }
      const cli = O.aplicarCambios(est, [cambio], 'estudios');
      const op = opCon({ claves: [{ clave: 'estudios', cambios: [cambio] }] });
      const r = await S1.transporteProtegido.aplicar(op);
      const despues = valor('estudios');
      let igual;
      if (r.ok && r.data.estado === 'aplicada') igual = !cli.fallo && O.igualJson(cli.nuevo, despues);
      else if (r.ok && r.data.estado === 'conflicto') {
        const m = r.data.motivo;
        igual = !!cli.fallo && cli.fallo.motivo === m.motivo && (cli.fallo.id ?? null) === (m.id ?? null) && (cli.fallo.campo ?? null) === (m.campo ?? null) && O.igualJson(despues, est);
      } else igual = false;
      if (igual) iguales += 1; else if (distintos.length < 3) distintos.push(JSON.stringify({ cambio, cli: cli.fallo || 'aplicada', srv: r.data && (r.data.motivo || r.data.estado) }));
    }
    ok(iguales === 400, `el cliente y el servidor llegan al mismo resultado, o al mismo fallo (${iguales}/400)${distintos.length ? ` — ${distintos.join(' | ')}` : ''}`);
    limpiar();
  }

  seccion('E · Dos aparatos: el que llega tarde no pisa');
  {
    const A = escritor(S1, 'A');
    ok((await A.w.guardar(horario(1))).ok && valor('horarioTop').n === 1, 'A guarda su horario');
    const B = escritor(S2, 'B');
    ok((await B.w.guardar(horario(2))).ok && valor('horarioTop').n === 2, 'B (que vio lo de A) guarda encima, con su condición');
    const tarde = await A.w.guardar(horario(3));
    ok(!tarde.ok && tarde.conflicto && valor('horarioTop').n === 2, 'A, con lo de antes, NO pisa lo de B: conflicto');
    const c = A.w.vista().conflicto;
    ok(c && c.copia.estado === 'guardada' && copiasEnCuenta() === 1, 'su operación quedó apartada en la cuenta, en la misma transacción');
    const fila = JSON.parse(psql(`select json_build_object('contenido', contenido, 'meta', meta)::text from copias_apartadas where user_id='${HV_U1}' and id='${c.copia.opId}'`));
    ok(fila.contenido.horario.valor.n === 3 && fila.meta.aparatoSuyo === 'B' && fila.meta.motivo.motivo === 'revision', 'la copia es la operación ENTERA, con quién chocó y por qué');
    ok(c.aparatoSuyo === 'B', 'el aviso sabe que fue el aparato B');
    A.w.verLoDeAhora();
    ok(A.adoptados.at(-1).v.n === 2, '«Ver lo que hay ahora»: A pasa a enseñar lo de B');
    ok((await A.w.guardar(horario(4))).ok && valor('horarioTop').n === 4 && copiasEnCuenta() === 1, 'y sigue editando sobre lo de ahora; su copia sigue apartada');
    const tarde2 = await B.w.guardar(horario(5));
    ok(!tarde2.ok && copiasEnCuenta() === 2, 'ahora es B el que llega tarde: otra copia');
    const d = await B.w.descartarMiCambio({ confirmado: true });
    ok(d.ok && d.copiaBorrada && copiasEnCuenta() === 1 && valor('horarioTop').n === 4, '«Descartar mi cambio»: su copia se borra de la cuenta (la de A sigue) y el horario no cambia');
    A.w.cerrar(); B.w.cerrar();
    limpiar();
  }

  seccion('F · Respuestas perdidas de verdad');
  {
    let { w } = escritor(S1, 'A');
    await w.guardar(horario(1));
    cortes.push({ ruta: /protegido_aplicar/, modo: 'despues' });
    const antes = registros();
    let r = await sinErrores(() => w.guardar(horario(2)));
    ok(r.ok && valor('horarioTop').n === 2 && registros() === antes + 1, 'la conexión se corta DESPUÉS de aplicarse: el cliente pregunta y confirma; una sola aplicación');
    ok(vistas.slice(-2).map((x) => x.ruta).join() === '/rpc/protegido_aplicar,/rpc/protegido_estado', '…preguntando por su estado (protegido_estado), sin reenviar');
    cortes.push({ ruta: /protegido_aplicar/, modo: 'antes' });
    r = await sinErrores(() => w.guardar(horario(3)));
    const aplicar = vistas.filter((x) => x.ruta === '/rpc/protegido_aplicar').slice(-2).map((x) => JSON.parse(x.cuerpo).op);
    ok(r.ok && valor('horarioTop').n === 3 && aplicar[0].opId === aplicar[1].opId && O.igualJson(aplicar[0], aplicar[1]), 'la conexión se corta ANTES: «desconocida» y se reenvía la MISMA operación (mismo opId y contenido)');
    cortes.push({ ruta: /protegido_aplicar/, modo: 'despues' }, { ruta: /protegido_estado/, modo: 'antes' });
    const reg0 = registros();
    r = await sinErrores(() => w.guardar(horario(4)));
    ok(!r.ok && r.pendiente && valor('horarioTop').n === 4 && registros() === reg0 + 1, 'aplicada sin poder saberlo: pendiente en memoria (la cuenta ya cambió)');
    await w.reintentar();
    ok(w.vista().estado === 'en_orden' && registros() === reg0 + 1 && valor('horarioTop').n === 4, 'al reintentar, el registro del servidor contesta «aplicada»: ni una segunda aplicación');
    w.cerrar();
    /* Con otro aparato escribiendo mientras la respuesta estaba perdida: el reenvío de la misma no pisa. */
    ({ w } = escritor(S1, 'A'));
    cortes.push({ ruta: /protegido_aplicar/, modo: 'antes' }, { ruta: /protegido_estado/, modo: 'antes' });
    r = await sinErrores(() => w.guardar(horario(5)));
    const B = escritor(S2, 'B');
    await B.w.guardar(horario(6));
    await w.reintentar();
    ok(valor('horarioTop').n === 6 && w.vista().conflicto && copiasEnCuenta() === 1, 'si otro aparato escribió mientras tanto, la misma operación ya no entra: se aparta, no pisa');
    w.cerrar(); B.w.cerrar();
    limpiar();
  }

  seccion('G · Varias claves: todo o nada, con las condiciones de lo guardado');
  {
    /* Lo guardado con una forma vieja (sin `oculto`): la pantalla lo enseña normalizado. */
    const normalizar = (v) => ({ ...v, asignaturas: (v.asignaturas || []).map((a) => ({ oculto: false, ...a })), horas: v.horas || [] });
    poner('estudios', { asignaturas: [{ id: 'bio', nombre: 'Bio' }, { id: 'mat', nombre: 'Mates' }], horas: [{ id: 'h1', asignaturaId: 'bio' }] });
    poner('papelera', { elementos: [], retencionDias: 30 });
    const { w, aplicadas } = escritor(S1, 'A');
    await w.guardar(horario(1));
    const antes = normalizar(valor('estudios'));
    const r = await w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(2), claves: [
      { clave: 'estudios', antes, despues: { ...antes, asignaturas: antes.asignaturas.filter((a) => a.id !== 'bio'), horas: [] }, normalizar },
      { clave: 'papelera', antes: valor('papelera'), despues: { ...valor('papelera'), elementos: [{ id: 'p1', item: { id: 'bio' } }] } },
    ] });
    ok(r.ok && valor('estudios').asignaturas.map((a) => a.id).join() === 'mat' && valor('estudios').horas.length === 0 && valor('papelera').elementos.length === 1 && valor('horarioTop').n === 2, 'borrar una asignatura con clases: las tres claves, en una transacción');
    ok(!('oculto' in valor('estudios').asignaturas[0]), 'sin conflicto falso: la condición fue lo guardado, y lo que no se tocó no se reescribió normalizado');
    ok(aplicadas.length === 1, 'y la pantalla recibe la operación aplicada');
    /* C1: otro aparato añade otra asignatura antes; se conserva. */
    const vista2 = normalizar(valor('estudios'));
    psql(`update app_data set value = jsonb_set(value, '{asignaturas}', (value->'asignaturas') || '[{"id":"his","nombre":"Historia (B)"}]'::jsonb) where user_id='${HV_U1}' and key='estudios'`);
    const r2 = await w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(3), claves: [{ clave: 'estudios', antes: vista2, despues: { ...vista2, asignaturas: [] }, normalizar }] });
    ok(r2.ok && valor('estudios').asignaturas.map((a) => a.id).join() === 'his', 'C1: lo que otro aparato añadió se conserva (no se reescribe la clave entera)');
    /* C2: otro aparato cambió justo la que se borra → nada de nada. */
    poner('estudios', { asignaturas: [{ id: 'fis', nombre: 'Física' }], horas: [] });
    const vista3 = normalizar(valor('estudios'));
    psql(`update app_data set value = jsonb_set(value, '{asignaturas,0,nombre}', '"Física (B)"') where user_id='${HV_U1}' and key='estudios'`);
    const foto = psql(`select string_agg(key || md5(value::text), ',' order by key) from app_data where user_id='${HV_U1}'`);
    const r3 = await w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(4), claves: [
      { clave: 'estudios', antes: vista3, despues: { ...vista3, asignaturas: [] }, normalizar },
      { clave: 'papelera', antes: valor('papelera'), despues: { ...valor('papelera'), elementos: [...valor('papelera').elementos, { id: 'p2' }] } },
    ] });
    ok(!r3.ok && r3.conflicto && psql(`select string_agg(key || md5(value::text), ',' order by key) from app_data where user_id='${HV_U1}'`) === foto, 'C2: otro aparato cambió la que se borra: NO se escribe ninguna de las tres claves');
    const cop = JSON.parse(psql(`select meta::text from copias_apartadas where user_id='${HV_U1}' order by creada_en desc limit 1`));
    ok(cop.motivo.motivo === 'elemento_distinto' && cop.motivo.id === 'fis' && cop.claves.join() === 'estudios,papelera', '…y la operación entera queda apartada con el motivo exacto');
    w.cerrar();
    limpiar();
  }

  seccion('H · Un guardado automático que choca: adopta, sin copia');
  {
    const A = escritor(S1, 'A');
    await A.w.guardar(horario(1));
    const B = escritor(S2, 'B');
    await B.w.guardar(horario(2));
    const r = await A.w.guardar(horario(3), { automatico: true });
    ok(r.ok && r.recalculado && !A.w.vista().conflicto && copiasEnCuenta() === 0 && valor('horarioTop').n === 2, 'el automático no pisa, no abre conflicto y no deja copia');
    ok(A.adoptados.at(-1).motivo === 'automatico' && A.adoptados.at(-1).v.n === 2, '…la pantalla adopta lo de la cuenta');
    A.w.cerrar(); B.w.cerrar();
    limpiar();
  }

  seccion('I · Dos aparatos a la vez sobre la misma revisión');
  {
    const A0 = escritor(S1, 'A');
    await A0.w.guardar(horario(1));
    A0.w.cerrar();
    let entran = 0; let apartadas = 0;
    for (let i = 0; i < 10; i += 1) {
      const A = escritor(S1, 'A'); const B = escritor(S2, 'B');
      const [ra, rb] = await Promise.all([A.w.guardar(horario(`A${i}`)), B.w.guardar(horario(`B${i}`))]);
      entran += [ra, rb].filter((r) => r.ok).length;
      apartadas += [ra, rb].filter((r) => r.conflicto).length;
      const gano = valor('horarioTop').n;
      if (!((ra.ok && gano === `A${i}`) || (rb.ok && gano === `B${i}`))) entran = -99;
      A.w.cerrar(); B.w.cerrar();
    }
    ok(entran === 10 && apartadas === 10, 'diez veces: en cada una entra exactamente uno, el otro se aparta, y la cuenta tiene al que entró');
    ok(copiasEnCuenta() === 10, 'y las diez apartadas están en la cuenta');
  }
} finally {
  limpiar();
  try { if (instalado()) psqlArchivo(SQL_DESHACER); } catch (e) { fallos += 1; console.log('  ✗ no se pudo quitar el SQL del laboratorio:', e.message); }
  proxy.close();
}
ok(!instalado(), 'al terminar, el laboratorio queda como estaba (las funciones y tablas de R1, quitadas)');
console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones del cliente contra el servidor de R1`);
process.exit(fallos ? 1 : 0);
