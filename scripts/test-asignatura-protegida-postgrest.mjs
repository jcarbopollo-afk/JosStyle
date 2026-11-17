// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R3 — BORRAR UNA ASIGNATURA Y DESHACERLO CONTRA EL SERVIDOR DE VERDAD (nivel 3, solo laboratorio)
//
// Lo que hace la aplicación (`asignaturaProtegida.js` + `escritorOperaciones.js` + `transporteProtegido` de supabase.js)
// contra un Postgres + PostgREST LOCALES con `supabase/horarios-protegido.sql` instalado por esta prueba y quitado al
// terminar:
//   A · borrar una asignatura con clases: UNA transacción con el horario, Estudios y la papelera
//   B · atomicidad de verdad: una condición que falla en la SEGUNDA clave (provocada a mitad de vuelo) no deja nada escrito
//   C · Deshacer como operación inversa: todo vuelve, en otra transacción
//   D · dos aparatos: C1, C2, C3 y C4 contra el servidor
//   E · respuestas perdidas de verdad (la conexión se corta después de aplicarse): una sola aplicación
//
// ⚠️ NUNCA contra Supabase alojado. Es OPCIONAL: sin las variables del laboratorio se omite (y lo dice):
//   HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2   (ver `test-historial-versiones-postgrest.mjs`)
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-asignatura-protegida-postgrest.mjs
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

/* ── El proxy: quita el `/rest/v1`, contesta CORS, sabe perder la respuesta de una petición ('despues') y ejecutar algo
      JUSTO ANTES de reenviar una (`antes`: para provocar un fallo a mitad de vuelo). Puerto del sistema (listen(0)). ── */
const destino = new URL(HV_PGRST_URL);
const cortes = [];            // [{ ruta, modo: 'despues' }]
const antesDe = [];           // [{ ruta, fn(cuerpo) }]
const vistas = [];
const proxy = http.createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
  const trozos = []; req.on('data', (c) => trozos.push(c));
  req.on('end', () => {
    const cuerpo = Buffer.concat(trozos);
    const ruta = req.url.replace(/^\/rest\/v1/, '');
    vistas.push({ ruta, cuerpo: cuerpo.toString() });
    const ia = antesDe.findIndex((c) => c.ruta.test(ruta));
    if (ia >= 0) { const a = antesDe.splice(ia, 1)[0]; try { a.fn(JSON.parse(cuerpo.toString() || '{}')); } catch (e) { console.log('  (antesDe falló)', e.message); } }
    const i = cortes.findIndex((c) => c.ruta.test(ruta));
    const corte = i >= 0 ? cortes.splice(i, 1)[0] : null;
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
  const m = url.match(/\\/lib\\/supabase\\.js\\?ap=(\\d)$/);
  if (m) return { ...r, source: String(r.source).replace(/import\\.meta\\.env/g, JSON.stringify(E[m[1]])), shortCircuit: true };
  return r;
}`));
const S1 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?ap=1');
const S2 = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href + '?ap=2');
const W = await import(pathToFileURL(join(RAIZ, 'src/lib/escritorOperaciones.js')).href);
const P = await import(pathToFileURL(join(RAIZ, 'src/lib/asignaturaProtegida.js')).href);
const O = await import(pathToFileURL(join(RAIZ, 'src/lib/operacionesProtegidas.js')).href);
const H = await import(pathToFileURL(join(RAIZ, 'src/lib/horario.js')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const valor = (k) => { const t = psql(`select value::text from app_data where user_id='${HV_U1}' and key='${k}'`); return t ? JSON.parse(t) : null; };
const fila = (k) => psql(`select value::text || '|' || updated_at::text from app_data where user_id='${HV_U1}' and key='${k}'`);
const poner = (k, v) => psql(`insert into app_data (user_id, key, value) values ('${HV_U1}','${k}',${lit(v)}) on conflict (user_id, key) do update set value = excluded.value, updated_at = now()`);
const instalado = () => psql("select to_regclass('public.operaciones_protegidas') is not null") === 't';
const registros = (res = null) => Number(psql(`select count(*) from operaciones_protegidas where user_id='${HV_U1}'${res ? ` and resultado='${res}'` : ''}`));
const copiasEnCuenta = () => Number(psql(`select count(*) from copias_apartadas where user_id='${HV_U1}'`));
const limpiar = () => {
  psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}')`);
  if (instalado()) psql('truncate operaciones_protegidas, copias_apartadas, operaciones_corte');
};

const ASIG = ['mat', 'fis', 'his', 'qui'];
const CON_CLASES = ['mat', 'fis', 'qui'];
const sembrar = () => {
  limpiar();
  poner('estudios', {
    programas: [{ id: 'p1', nombre: 'Bachillerato' }],
    asignaturas: ASIG.map((k) => ({ id: k, nombre: k.toUpperCase(), programaIds: ['p1'] })),
    examenes: [{ id: 'e1', asignaturaId: 'mat', tema: 'Derivadas', fecha: '2026-12-01' }, { id: 'e2', asignaturaId: 'fis', tema: 'Ondas', fecha: '2026-12-02' }],
    horas: [{ id: 'h1', asignaturaId: 'mat', fecha: '2026-11-10', horas: 2 }], temas: [{ id: 't1', asignaturaId: 'mat', nombre: 'Límites' }],
    entregas: [], eventos: [], actividades: [],
  });
  poner('papelera', { elementos: [{ id: 'pp', modulo: 'fitness', coleccion: 'sesiones', idOriginal: 's1', datos: { id: 's1' } }], retencionDias: 30 });
  poner('horarioTop', {
    horarios: [{ id: 'hh', nombre: 'Curso', activo: true, columnas: [{ id: 'c1', horarioId: 'hh', nombre: 'L', dia: 1, posicion: 0, visible: true }], filas: [{ id: 'f1', horarioId: 'hh', inicio: '08:00', fin: '09:00', posicion: 0 }] }],
    actividades: CON_CLASES.map((k) => ({ id: `a${k}`, nombre: k, asignaturaId: k })),
    bloques: CON_CLASES.map((k, i) => ({ id: `b${k}`, horarioId: 'hh', columnaId: 'c1', filaId: 'f1', actividadId: `a${k}`, inicio: `0${i}:00`, fin: `0${i}:30` })),
    excepciones: [], version: 1, testigo: { formato: 1, revision: crypto.randomUUID(), base: null, aparato: 'semilla' },
  });
};
/* Un aparato: lo que cargó (por las puertas de carga de la app), su escritor y lo que hace App.jsx al borrar y deshacer. */
const aparato = (S, nombre) => {
  const pantalla = {
    horario: H.normalizarHorarioTop(valor('horarioTop')), estudios: P.normalizarEstudiosCargados(valor('estudios')), papelera: P.normalizarPapeleraCargada(valor('papelera')),
  };
  const aplicadas = [];
  const w = W.crearEscritorDeOperaciones({
    transporte: S.transporteProtegido, usuario: HV_U1, aparato: nombre, versionApp: '3.163.0',
    inicial: { valor: valor('horarioTop'), existe: true },
    alAplicar: (op, info) => { aplicadas.push({ op, info }); for (const c of op.claves || []) pantalla[c.clave] = O.aplicarCambios(pantalla[c.clave], c.cambios, c.clave, { sinCondiciones: true }).nuevo; },
  });
  const borrar = (id) => {
    const plan = P.prepararBorradoAsignatura({ estudios: pantalla.estudios, papelera: pantalla.papelera, horarioTop: pantalla.horario, id });
    const paso = { operacion: { tipo: 'borrar_asignatura', asunto: plan.asunto, horarioAntes: pantalla.horario } };
    pantalla.horario = plan.horario;
    return { plan, p: w.guardarOperacion({
      tipo: 'borrar_asignatura', manual: true, horario: plan.horario, asunto: plan.asunto, contexto: { paso },
      claves: [{ clave: 'estudios', antes: pantalla.estudios, despues: plan.estudios, normalizar: P.normalizarEstudiosCargados }, { clave: 'papelera', antes: pantalla.papelera, despues: plan.papelera, normalizar: P.normalizarPapeleraCargada }],
    }) };
  };
  const pasoDe = (reg) => ({ operacion: { ...reg.info.contexto.paso.operacion, claves: reg.op.claves.map((c) => ({ clave: c.clave, cambios: c.cambios })) } });
  const deshacer = (paso) => {
    const plan = P.prepararDeshacerOperacion(paso, { estudios: pantalla.estudios, papelera: pantalla.papelera });
    if (!plan.ok) return Promise.resolve({ ok: false, motivo: plan.motivo });
    pantalla.horario = plan.horario;
    return w.guardarOperacion({ tipo: 'deshacer', manual: true, horario: plan.horario, asunto: { ...paso.operacion.asunto, accion: 'restaurar' }, claves: plan.claves.map((c) => ({ ...c, normalizar: c.clave === 'estudios' ? P.normalizarEstudiosCargados : P.normalizarPapeleraCargada })) });
  };
  return { w, pantalla, aplicadas, borrar, deshacer, pasoDe };
};
const tiene = (k) => (valor('estudios').asignaturas || []).some((a) => a.id === k);
const conjunto = (l) => JSON.stringify([...(l || [])].sort((a, b) => String(a.id).localeCompare(String(b.id))));

limpiar();
try {
  if (instalado()) psqlArchivo(SQL_DESHACER);
  psqlArchivo(SQL);
  psql("notify pgrst, 'reload schema'");
  let listo = false;
  for (let i = 0; i < 60 && !listo; i += 1) { const p = await S1.transporteProtegido.protocolo(); listo = !!p.ok; if (!listo) await dormir(100); }
  ok(listo, 'el servidor de R1 está instalado en el laboratorio y contesta');

  seccion('A · Borrar una asignatura con clases: UNA transacción');
  {
    sembrar();
    const antes = { estudios: valor('estudios'), papelera: valor('papelera'), horario: valor('horarioTop') };
    const A = aparato(S1, 'A');
    const r = await A.borrar('mat').p;
    ok(r.ok && registros('aplicada') === 1, 'se aplica, con UN registro en el servidor');
    const e = valor('estudios'); const pap = valor('papelera'); const h = valor('horarioTop');
    ok(!tiene('mat') && !e.examenes.some((x) => x.id === 'e1') && !e.horas.length && !e.temas.length, 'Estudios: sin la asignatura ni lo suyo');
    ok(pap.elementos.length === 2 && pap.elementos.some((x) => x.idOriginal === 'mat' && (x.relacionados || []).length === 3) && pap.elementos.some((x) => x.id === 'pp'), 'la papelera: su entrada, con lo arrastrado, y la de antes');
    ok(!h.actividades.some((a) => a.asignaturaId === 'mat') && !h.bloques.some((b) => b.id === 'bmat') && h.testigo.base === antes.horario.testigo.revision, 'el horario: sin sus clases, con una revisión nueva encadenada a la de antes');
    ok(tiene('fis') && e.examenes.some((x) => x.id === 'e2') && h.bloques.some((b) => b.id === 'bfis'), 'lo demás, intacto');

    seccion('C · Deshacer como operación inversa');
    const rd = await A.deshacer(A.pasoDe(A.aplicadas[0]));
    ok(rd.ok && registros('aplicada') === 2, 'Deshacer: otra transacción aplicada');
    const e2 = valor('estudios');
    ok(['asignaturas', 'examenes', 'horas', 'temas'].every((c) => conjunto(e2[c]) === conjunto(antes.estudios[c])), '🚨 Estudios vuelve entero (la asignatura y todo lo suyo)');
    ok(JSON.stringify(valor('papelera')) === JSON.stringify(antes.papelera), 'la papelera, exactamente como estaba');
    ok(valor('horarioTop').bloques.some((b) => b.id === 'bmat') && valor('horarioTop').actividades.some((a) => a.asignaturaId === 'mat'), 'y el horario con sus clases');
    A.w.cerrar();
  }

  seccion('B · Atomicidad de verdad: un fallo en la segunda clave, provocado a mitad de vuelo');
  {
    sembrar();
    const A = aparato(S1, 'A');
    const antes = { estudios: fila('estudios'), papelera: fila('papelera'), horario: fila('horarioTop') };
    /* Justo antes de que la operación llegue al servidor, «otro aparato» pone en la papelera una entrada con el MISMO id
       que la que va a añadir: Estudios (la primera clave, por nombre) cumpliría, la papelera no. */
    antesDe.push({ ruta: /protegido_aplicar/, fn: (c) => {
      const anadida = c.op.claves.find((k) => k.clave === 'papelera').cambios[0].anadir[0].elemento;
      const pap = valor('papelera');
      poner('papelera', { ...pap, elementos: [...pap.elementos, { ...anadida, otroAparato: true }] });
      antes.papelera = fila('papelera');
    } });
    const r = await A.borrar('mat').p;
    ok(!r.ok && r.conflicto, 'la operación no se aplica: conflicto');
    ok(fila('estudios') === antes.estudios && fila('horarioTop') === antes.horario && fila('papelera') === antes.papelera, '🚨 NI Estudios (que habría cumplido) NI el horario cambian: ni el valor ni updated_at (todo o nada en Postgres)');
    const c = JSON.parse(psql(`select row_to_json(x)::text from (select tipo, meta, contenido from copias_apartadas where user_id='${HV_U1}') x`));
    ok(c.tipo === 'conflicto' && c.meta.motivo.motivo === 'elemento_existe' && c.meta.motivo.clave === 'papelera' && c.contenido.claves.length === 2, 'la operación ENTERA queda apartada, con el motivo exacto (la papelera, elemento_existe)');
    ok(registros('conflicto') === 1 && registros('aplicada') === 0, 'y su registro dice conflicto');
    ok(P.bloqueosDeEstudios(A.w.vista().asuntos).get('mat')?.motivo === 'conflicto', 'H-12: la asignatura queda retenida en el cliente');
    A.w.cerrar();
  }

  seccion('D · Dos aparatos contra el servidor');
  {
    /* C1 */
    sembrar();
    const A = aparato(S1, 'A');
    const e = valor('estudios');
    poner('estudios', { ...e, asignaturas: e.asignaturas.map((x) => (x.id === 'his' ? { ...x, aula: 'B' } : x)) });
    ok((await A.borrar('mat').p).ok && !tiene('mat') && valor('estudios').asignaturas.find((x) => x.id === 'his').aula === 'B', '🚨 C1 · B cambió otra asignatura: A borra la suya y lo de B se conserva');
    A.w.cerrar();
  }
  {
    /* C2 */
    sembrar();
    const A = aparato(S1, 'A');
    const e = valor('estudios');
    /* Un campo que la aplicación conoce (el nombre del tema): uno que su puerta de carga descarta no es un cambio que ella vea. */
    poner('estudios', { ...e, temas: e.temas.map((t) => ({ ...t, nombre: 'Límites (B)' })) });
    const antes = [fila('estudios'), fila('papelera'), fila('horarioTop')].join('\n');
    const r = await A.borrar('mat').p;
    const despues = [fila('estudios'), fila('papelera'), fila('horarioTop')].join('\n');
    ok(r.conflicto && despues === antes && copiasEnCuenta() === 1, `C2 · B cambió algo de X: conflicto, nada escrito, la operación apartada${r.conflicto && despues === antes && copiasEnCuenta() === 1 ? '' : ` (${JSON.stringify({ r, igual: despues === antes, copias: copiasEnCuenta(), reg: psql(`select resultado || ' ' || coalesce(motivo::text,'') from operaciones_protegidas where user_id='${HV_U1}'`) })})`}`);
    A.w.cerrar();
  }
  {
    /* C3 */
    sembrar();
    const A = aparato(S1, 'A'); const B = aparato(S2, 'B');
    ok((await B.borrar('mat').p).ok, 'C3 · B borra X');
    const antes = [fila('estudios'), fila('papelera'), fila('horarioTop')].join('\n');
    const r = await A.borrar('mat').p;
    ok(r.conflicto && [fila('estudios'), fila('papelera'), fila('horarioTop')].join('\n') === antes && valor('papelera').elementos.filter((x) => x.idOriginal === 'mat').length === 1, '🚨 C3 · A, sin verlo, también: choca con la revisión, X no vuelve y no hay dos entradas');
    A.w.cerrar(); B.w.cerrar();
  }
  {
    /* C4 */
    sembrar();
    const A = aparato(S1, 'A');
    const pap = valor('papelera');
    poner('papelera', { ...pap, elementos: [...pap.elementos, { id: 'pB', modulo: 'salud', coleccion: 'medidas', idOriginal: 'm1', datos: { id: 'm1' } }] });
    ok((await A.borrar('fis').p).ok && valor('papelera').elementos.some((x) => x.id === 'pB') && valor('papelera').elementos.some((x) => x.idOriginal === 'fis'), 'C4 · B añadió algo a la papelera a la vez: se quedan las dos entradas');
    A.w.cerrar();
  }
  {
    /* C6 */
    sembrar();
    const A = aparato(S1, 'A'); const B = aparato(S2, 'B');
    const [ra, rb] = await Promise.all([A.borrar('mat').p, B.borrar('qui').p]);
    ok([ra, rb].filter((r) => r.ok).length === 1 && [ra, rb].filter((r) => r.conflicto).length === 1 && registros('aplicada') === 1, 'C6 · a la vez sobre la misma revisión: una entra, la otra se aparta (en Postgres)');
    ok(tiene('mat') !== tiene('qui'), 'C6 · y la cuenta es la de la que entró');
    A.w.cerrar(); B.w.cerrar();
  }

  seccion('E · Respuestas perdidas de verdad');
  {
    sembrar();
    const A = aparato(S1, 'A');
    cortes.push({ ruta: /protegido_aplicar/, modo: 'despues' });
    const r = await A.borrar('mat').p;
    ok(r.ok && registros('aplicada') === 1 && !tiene('mat'), 'la conexión se corta después de aplicarse: se pregunta y es «aplicada», una sola vez');
    ok(vistas.filter((v) => /protegido_estado/.test(v.ruta)).length >= 1, '…preguntando a protegido_estado, sin reenviar a ciegas');
    ok(valor('papelera').elementos.filter((x) => x.idOriginal === 'mat').length === 1, '…y una sola entrada en la papelera');
    const rd = await A.deshacer(A.pasoDe(A.aplicadas[0]));
    ok(rd.ok && tiene('mat') && registros('aplicada') === 2, 'y Deshacer después, una vez');
    A.w.cerrar();
  }
} finally {
  limpiar();
  try { if (instalado()) psqlArchivo(SQL_DESHACER); } catch (e) { fallos += 1; console.log('  ✗ no se pudo quitar el SQL del laboratorio:', e.message); }
  proxy.close();
}
ok(!instalado(), 'al terminar, el laboratorio queda como estaba (las funciones y tablas de R1, quitadas)');
console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones de R3 contra el servidor de R1`);
process.exit(fallos ? 1 : 0);
