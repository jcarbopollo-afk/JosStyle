// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R1 — LA OPERACIÓN PROTEGIDA CONTRA UN POSTGREST REAL (nivel 3, D4)
//
// Instala `supabase/horarios-protegido.sql` en un Postgres + PostgREST LOCALES y desechables (los del laboratorio de
// E1) y lo prueba llamando a sus funciones por HTTP, como lo hará la aplicación:
//   A · instalación y protocolo
//   B · una operación de varias claves (la forma de «borrar una asignatura con clases»): todo o nada
//   C · idempotencia I1–I10 (repetir, respuesta perdida, concurrencia, sin registro, cada primitiva, caducada,
//       desconocida, fallo a mitad, mismo opId con otro contenido, conflicto repetido)
//   D · rechazos: cada condición falla sin escribir nada, la manual se aparta ENTERA, la automática no
//   E · concurrencia entre aparatos y el riesgo C7 que R1 NO cubre (se demuestra, no se esconde)
//   F · RLS y la guardia de las tablas propias
//   G · copias: listar, marcar vista, eliminar, espacio lógico y una medida física (solo informativa)
//   H · convivencia con la regla de E1 (`horarios-regla-revision.sql`)
//   I · borrado de una cuenta en cascada
//   J · la vuelta atrás (`horarios-protegido-deshacer.sql`)
//
// ⚠️ NUNCA contra Supabase alojado. Es OPCIONAL: sin las variables del laboratorio se omite (y lo dice):
//   HV_PGRST_URL, HV_JWT_SECRET, HV_PSQL, HV_U1, HV_U2   (ver `test-historial-versiones-postgrest.mjs`)
//
// Uso: node scripts/test-protegido-postgrest.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const SQL_REGLA = join(RAIZ, 'supabase/horarios-regla-revision.sql');
const SQL_REGLA_DESHACER = join(RAIZ, 'supabase/horarios-regla-revision-deshacer.sql');
const U3 = '33333333-3333-4333-8333-333333333333';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (sub) => { const h = b64({ alg: 'HS256', typ: 'JWT' }); const p = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', HV_JWT_SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const psql = (sql) => execFileSync('psql', [HV_PSQL, '-Atc', sql], { env: { ...process.env, PGOPTIONS: '-c client_min_messages=warning' } }).toString().trim();
const psqlArchivo = (ruta) => execFileSync('psql', [HV_PSQL, '-v', 'ON_ERROR_STOP=1', '-q', '-f', ruta], { env: { ...process.env, PGOPTIONS: '-c client_min_messages=warning' } }).toString();
const lit = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const uuid = () => crypto.randomUUID();
/* Postgres guarda `jsonb` con sus claves en otro orden: se compara el contenido, no el texto. */
const canonico = (v) => (Array.isArray(v) ? `[${v.map(canonico).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonico(v[k])}`).join(',')}}`
    : JSON.stringify(v));
const ahora = () => new Date().toISOString();

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);

/* ── HTTP: directo a PostgREST, o a través de un proxy que sabe cortar la respuesta (respuesta perdida). ── */
async function peticion(base, metodo, ruta, { u = HV_U1, cuerpo, cabeceras = {}, sinToken = false } = {}) {
  const headers = { 'content-type': 'application/json', ...cabeceras };
  if (!sinToken) headers.authorization = `Bearer ${token(u)}`;
  const r = await fetch(`${base}${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  let json = null; try { json = texto ? JSON.parse(texto) : null; } catch { json = texto; }
  return { status: r.status, json };
}
const rpc = (fn, args, opciones = {}) => peticion(HV_PGRST_URL, 'POST', `/rpc/${fn}`, { ...opciones, cuerpo: args });
const aplicar = (op, opciones = {}) => rpc('protegido_aplicar', { op }, opciones);

// El proxy escucha en un puerto que da el sistema (listen(0)): uno fijo de 5544x cae en el rango efímero
// (32768–60999) y una conexión saliente podía tenerlo ocupado (EADDRINUSE en verificar.sh, R2).
const destino = new URL(HV_PGRST_URL);
const proxy = http.createServer((req, res) => {
  const trozos = []; req.on('data', (c) => trozos.push(c));
  req.on('end', () => {
    const cortar = req.headers['x-cortar'] === '1';
    const headers = { ...req.headers }; delete headers.host; delete headers['x-cortar'];
    const up = http.request({ host: destino.hostname, port: destino.port, method: req.method, path: req.url, headers }, (ur) => {
      const ub = []; ur.on('data', (c) => ub.push(c));
      ur.on('end', () => {
        // La petición llegó y el servidor contestó; el cliente NO recibe la respuesta.
        if (cortar) { req.socket.destroy(); return; }
        res.writeHead(ur.statusCode, ur.headers); res.end(Buffer.concat(ub));
      });
    });
    up.end(Buffer.concat(trozos));
  });
});
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const URL_PROXY = `http://127.0.0.1:${proxy.address().port}`;

/* ── Lo que hay en la base, leído como propietario (sin RLS). ── */
const valor = (k, u = HV_U1) => { const t = psql(`select value::text from app_data where user_id='${u}' and key='${k}'`); return t ? JSON.parse(t) : null; };
const actualizado = (k, u = HV_U1) => psql(`select updated_at from app_data where user_id='${u}' and key='${k}'`);
const revision = (u = HV_U1) => psql(`select coalesce(value->'testigo'->>'revision','<null>') from app_data where user_id='${u}' and key='horarioTop'`);
const registros = (u = HV_U1) => Number(psql(`select count(*) from operaciones_protegidas where user_id='${u}'`));
const registroDe = (id, u = HV_U1) => psql(`select resultado from operaciones_protegidas where user_id='${u}' and op_id='${id}'`);
const copias = (u = HV_U1) => Number(psql(`select count(*) from copias_apartadas where user_id='${u}'`));
/* Una «foto» de las claves del usuario: contenido (md5) y hora de escritura, sin espacios dentro de cada pieza. */
const foto = (u = HV_U1) => psql(`select coalesce(string_agg(key || '=' || md5(value::text) || '@' || extract(epoch from updated_at)::text, ' ' order by key), '') from app_data where user_id='${u}'`);
const poner = (k, v, u = HV_U1) => psql(`insert into app_data (user_id, key, value) values ('${u}','${k}',${lit(v)}) on conflict (user_id, key) do update set value = excluded.value, updated_at = now()`);
const limpiar = () => {
  psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}','${U3}')`);
  psql(`delete from auth.users where id='${U3}'`);
  if (psql("select to_regclass('public.operaciones_protegidas') is not null") === 't') {
    psql('truncate operaciones_protegidas, copias_apartadas, operaciones_corte');
  }
};

/* ── Fábricas de operaciones (la forma que construirá el cliente en R2). ── */
const horarioCon = (base, { rev = uuid(), baseExiste = true, contenido = { horarios: [], actividades: [] } } = {}) => ({
  base, baseExiste, valor: { ...contenido, version: 1, testigo: { formato: 1, revision: rev, base, aparato: 'lab-A' } },
});
const operacion = ({ opId = uuid(), tipo = 'editar_horario', manual = true, horario, claves, creadaEn = ahora(), aparato = 'lab-A' } = {}) => ({
  formato: 1, opId, tipo, manual, aparato, versionApp: '3.163.0', creadaEn,
  ...(horario ? { horario } : {}), ...(claves ? { claves } : {}),
});

/* El escenario: Estudios con dos asignaturas y su contenido, la papelera vacía, un horario con testigo r0. */
const A1 = { id: 'asig-1', nombre: 'Biología', programaIds: ['bach'] };
const A2 = { id: 'asig-2', nombre: 'Historia', programaIds: ['bach'] };
const E1 = { id: 'ex-1', asignaturaId: 'asig-1', fecha: '2026-12-01', tema: 'Célula' };
const E2 = { id: 'ex-2', asignaturaId: 'asig-2', fecha: '2026-12-02', tema: 'Edad Media' };
const BLOQUE_A1 = { id: 'b-1', asignaturaId: 'asig-1', dia: 1, desde: '09:00', hasta: '10:00' };
const BLOQUE_A2 = { id: 'b-2', asignaturaId: 'asig-2', dia: 2, desde: '10:00', hasta: '11:00' };
const ESTUDIOS = { programas: [{ id: 'bach', nombre: 'Bachillerato' }], asignaturas: [A1, A2], examenes: [E1, E2], horas: [], temas: [], entregas: [], eventos: [], actividades: [] };
const PAPELERA = { elementos: [], retencionDias: 30 };
const horarioInicial = (rev = 'r0') => ({ horarios: [{ id: 'h1', bloques: [BLOQUE_A1, BLOQUE_A2] }], actividades: [], version: 1, testigo: { formato: 1, revision: rev, base: null, aparato: 'lab-B' } });
const sembrar = () => { limpiar(); poner('estudios', ESTUDIOS); poner('papelera', PAPELERA); poner('horarioTop', horarioInicial()); poner('sueno', { registros: [{ id: 's1', horas: 8 }] }); };
const entradaPapelera = (id = uuid()) => ({ id, modulo: 'estudios', coleccion: 'asignaturas', idOriginal: 'asig-1', datos: A1, relacionados: [{ coleccion: 'examenes', elementos: [E1] }] });
/* «Borrar la asignatura 1»: quita la asignatura y su examen, apunta la entrada en la papelera y limpia el horario. */
const borrarAsignatura1 = ({ base = 'r0', rev, opId, manual = true, entrada = entradaPapelera(), igualA1 = A1 } = {}) => operacion({
  opId, tipo: 'borrar_asignatura', manual,
  horario: horarioCon(base, { rev, contenido: { horarios: [{ id: 'h1', bloques: [BLOQUE_A2] }], actividades: [] } }),
  claves: [
    { clave: 'estudios', cambios: [
      { camino: ['asignaturas'], quitar: [{ id: 'asig-1', igual: igualA1 }] },
      { camino: ['examenes'], quitar: [{ id: 'ex-1', igual: E1 }] },
    ] },
    { clave: 'papelera', cambios: [{ camino: ['elementos'], anadir: [{ elemento: entrada }] }] },
  ],
});

try {
  // ═══════════════════════════════════════════════════════════════════════
  seccion('A · Instalación y protocolo (solo en este laboratorio)');
  psqlArchivo(SQL);
  psqlArchivo(SQL); // dos veces: se puede volver a ejecutar sin romper nada
  limpiar();
  ok(psql("select count(*) from pg_proc where proname like 'protegido\\_%'") === '7', 'siete funciones protegido_* instaladas (y el SQL se puede ejecutar dos veces)');
  ok(psql("select string_agg(relname || ':' || relrowsecurity, ',' order by relname) from pg_class where relname in ('operaciones_protegidas','copias_apartadas','operaciones_corte')")
    === 'copias_apartadas:true,operaciones_corte:true,operaciones_protegidas:true', 'tres tablas propias (H-18), las tres con RLS');
  psql("notify pgrst, 'reload schema'");
  let proto = { status: 0 };
  for (let i = 0; i < 30 && proto.status !== 200; i += 1) { await new Promise((r) => setTimeout(r, 200)); proto = await rpc('protegido_protocolo', {}); }
  ok(proto.status === 200 && proto.json.version === 1 && proto.json.versionMinima === null && typeof proto.json.ahora === 'string', 'protocolo: versión 1, sin versión mínima y con la hora del servidor');
  ok(proto.json.reglas && proto.json.reglas.horarioTop === false, 'protocolo: la regla de E1 NO está instalada (se dice, no se supone)');
  const anonimo = await rpc('protegido_aplicar', { op: operacion({ horario: horarioCon(null, { baseExiste: false }) }) }, { sinToken: true });
  ok(anonimo.status >= 400 && psql(`select count(*) from app_data where key='horarioTop'`) === '0', 'sin sesión (anon) no se puede llamar: ni se ejecuta ni escribe');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('B · Una operación de varias claves (borrar una asignatura con clases): todo o nada');
  sembrar();
  const suenoAntes = foto().split(' ').find((x) => x.startsWith('sueno='));
  const op1 = borrarAsignatura1({ rev: 'r1' });
  const r1 = await aplicar(op1);
  ok(r1.status === 200 && r1.json.estado === 'aplicada' && r1.json.revision === 'r1' && !r1.json.registrada, 'se aplica: estado «aplicada» con la revisión nueva');
  const est1 = valor('estudios');
  ok(est1.asignaturas.length === 1 && est1.asignaturas[0].id === 'asig-2' && est1.examenes.length === 1 && est1.examenes[0].id === 'ex-2', 'Estudios: se van la asignatura 1 y su examen; la 2 y el suyo se quedan');
  ok(JSON.stringify(est1.programas) === JSON.stringify(ESTUDIOS.programas) && Array.isArray(est1.actividades), '…y el resto de Estudios queda tal cual (cambio por elemento, no reescritura)');
  ok(valor('papelera').elementos.length === 1 && valor('papelera').retencionDias === 30, 'Papelera: una entrada nueva, y su retención intacta');
  ok(revision() === 'r1' && valor('horarioTop').horarios[0].bloques.length === 1, 'Horario: revisión r1 y sin la clase de la asignatura 1');
  ok(foto().split(' ').find((x) => x.startsWith('sueno=')) === suenoAntes, 'una clave que no está en la operación (sueno) no se toca');
  ok(registros() === 1 && registroDe(op1.opId) === 'aplicada', 'el registro apunta UNA operación aplicada');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('C · Idempotencia I1–I10');
  // I1 — repetir una operación aplicada no la vuelve a ejecutar
  const fotoI1 = foto();
  const rep = [await aplicar(op1), await aplicar(op1), await aplicar(op1)];
  ok(rep.every((r) => r.json.estado === 'aplicada' && r.json.registrada === true && r.json.revision === 'r1'), 'I1 · tres repeticiones contestan «aplicada» (desde el registro)');
  ok(foto() === fotoI1 && registros() === 1, 'I1 · …y no escriben NADA: mismas claves, mismos contenidos y mismo updated_at; un solo registro');

  // I2 — respuesta perdida: llegó, se aplicó, el cliente no recibió la respuesta
  sembrar();
  const op2 = borrarAsignatura1({ rev: 'r2' });
  let cortada = false;
  try { await peticion(URL_PROXY, 'POST', '/rpc/protegido_aplicar', { cuerpo: { op: op2 }, cabeceras: { 'x-cortar': '1' } }); } catch { cortada = true; }
  ok(cortada, 'I2 · la respuesta se pierde (el cliente ve un fallo de red)');
  ok(revision() === 'r2' && registroDe(op2.opId) === 'aplicada', 'I2 · …pero el servidor SÍ la aplicó');
  const fotoI2 = foto();
  const reintento = await aplicar(op2);
  ok(reintento.json.estado === 'aplicada' && reintento.json.registrada === true, 'I2 · el reintento con el mismo opId contesta «aplicada»…');
  ok(foto() === fotoI2 && valor('papelera').elementos.length === 1 && registros() === 1, 'I2 · …sin segunda aplicación (una sola entrada en la papelera, un registro)');

  // I3 — la misma operación cinco veces a la vez
  sembrar();
  const op3 = borrarAsignatura1({ rev: 'r3' });
  const cinco = await Promise.all([1, 2, 3, 4, 5].map(() => aplicar(op3)));
  ok(cinco.every((r) => r.json.estado === 'aplicada'), 'I3 · cinco envíos simultáneos: todos contestan «aplicada»');
  ok(cinco.filter((r) => !r.json.registrada).length === 1, 'I3 · …y solo UNO la aplicó (los otros esperaron y leyeron el registro)');
  ok(valor('papelera').elementos.length === 1 && registros() === 1, 'I3 · una sola entrada en la papelera y un solo registro');

  // I4 — sin su registro (como si una limpieza futura lo hubiera borrado)
  psql(`delete from operaciones_protegidas where op_id='${op3.opId}'`);
  const fotoI4 = foto();
  const sinReg = await aplicar(op3);
  ok(sinReg.json.estado === 'aplicada' && sinReg.json.reconocidaPor === 'revision', 'I4 · sin registro, se reconoce por la revisión vigente (capa 2)…');
  ok(foto() === fotoI4, 'I4 · …y no escribe nada');
  const opOtra = operacion({ horario: horarioCon('r3', { rev: 'r4' }) });
  ok((await aplicar(opOtra)).json.estado === 'aplicada' && revision() === 'r4', 'I4 · después otro cambio deja la revisión en r4');
  psql(`delete from operaciones_protegidas where op_id='${op3.opId}'`);
  const fotoI4b = foto();
  const sinRegTarde = await aplicar(op3);
  ok(sinRegTarde.json.estado === 'conflicto' && sinRegTarde.json.motivo.motivo === 'revision', 'I4 · sin registro y con la revisión ya cambiada: conflicto (falso), NUNCA una segunda aplicación');
  ok(foto() === fotoI4b && valor('papelera').elementos.length === 1, 'I4 · …nada escrito: la papelera sigue con una entrada');

  // I5 — cada primitiva, repetida SIN registro y SIN horario: o su condición la para o no cambia nada
  sembrar();
  const primitivas = [
    ['quitar', { clave: 'estudios', cambios: [{ camino: ['examenes'], quitar: [{ id: 'ex-2', igual: E2 }] }] }],
    ['reemplazar', { clave: 'estudios', cambios: [{ camino: ['asignaturas'], reemplazar: [{ id: 'asig-2', igual: A2, nuevo: { ...A2, nombre: 'Historia de España' } }] }] }],
    ['añadir', { clave: 'papelera', cambios: [{ camino: ['elementos'], anadir: [{ elemento: { id: 'p-5', modulo: 'sueno' } }] }] }],
    ['fijar con condición', { clave: 'papelera', cambios: [{ camino: [], fijar: [{ campo: 'retencionDias', igual: 30, valor: 15 }] }] }],
    ['fijar sin condición', { clave: 'papelera', cambios: [{ camino: [], fijar: [{ campo: 'nota', valor: 'x' }] }] }],
    ['ordenar', { clave: 'estudios', cambios: [{ camino: ['asignaturas'], orden: ['asig-2', 'asig-1'] }] }],
  ];
  for (const [nombre, clave] of primitivas) {
    const op = operacion({ claves: [clave] });
    const primera = await aplicar(op);
    const tras = foto();
    psql(`delete from operaciones_protegidas where op_id='${op.opId}'`);
    const otra = await aplicar(op);
    const tras2 = foto();
    const contenido = (f) => f.split(' ').map((x) => x.replace(/@.*$/, '')).join(' ');
    ok(primera.json.estado === 'aplicada' && contenido(tras2) === contenido(tras),
      `I5 · ${nombre}: aplicada una vez; repetida sin registro no cambia el contenido (${otra.json.estado}${otra.json.motivo ? ' · ' + otra.json.motivo.motivo : ''})`);
  }

  // I6 — una operación caducada nunca se aplica
  sembrar();
  const opVieja = operacion({ horario: horarioCon('r0', { rev: 'r6' }) });
  const reg6 = await aplicar(opVieja);
  psql(`insert into operaciones_corte (user_id, corte) values ('${HV_U1}', now() + interval '1 second')`);
  await new Promise((r) => setTimeout(r, 1100));
  const fotoI6 = foto();
  const caducada = await aplicar(operacion({ horario: horarioCon('r6', { rev: 'r6b' }), creadaEn: new Date(Date.now() - 3600_000).toISOString() }));
  ok(caducada.json.estado === 'caducada' && foto() === fotoI6, 'I6 · desconocida y anterior al corte: «caducada», sin escribir nada');
  ok(registros() === 1, 'I6 · …y ni siquiera se registra');
  ok(reg6.json.estado === 'aplicada' && (await aplicar(opVieja)).json.registrada === true, 'I6 · una ya registrada anterior al corte sigue contestando desde su registro');
  const nueva6 = await aplicar(operacion({ horario: horarioCon('r6', { rev: 'r6c' }) }));
  ok(nueva6.json.estado === 'aplicada' && revision() === 'r6c', 'I6 · una posterior al corte se aplica con normalidad');
  psql(`delete from operaciones_corte where user_id='${HV_U1}'`);

  // I7 — una operación desconocida no se interpreta como aplicada
  const idDesconocido = uuid();
  const est7 = await rpc('protegido_estado', { op_id: idDesconocido });
  ok(est7.json.estado === 'desconocida', 'I7 · el estado de un opId que no llegó es «desconocida», nunca «aplicada»');
  const op7 = operacion({ opId: idDesconocido, horario: horarioCon('r6c', { rev: 'r7' }) });
  ok((await aplicar(op7)).json.estado === 'aplicada' && (await rpc('protegido_estado', { op_id: idDesconocido })).json.estado === 'aplicada', 'I7 · enviarla después funciona, y su estado pasa a «aplicada»');

  // I8 — un fallo a mitad de la escritura: nada a medias
  sembrar();
  psql(`create or replace function public.lab_fallo_inyectado() returns trigger language plpgsql as $$
        begin if new.key = 'papelera' and new.value::text like '%__fallo_inyectado__%' then raise exception 'fallo inyectado'; end if; return new; end $$`);
  psql('create trigger lab_fallo_inyectado before insert or update on app_data for each row execute function public.lab_fallo_inyectado()');
  const fotoI8 = foto();
  const op8 = borrarAsignatura1({ rev: 'r8', entrada: { ...entradaPapelera(), marca: '__fallo_inyectado__' } });
  const r8 = await aplicar(op8);
  ok(r8.status >= 400, 'I8 · la escritura de la papelera (la última) falla a mitad de la operación');
  ok(foto() === fotoI8 && revision() === 'r0' && valor('estudios').asignaturas.length === 2, 'I8 · …y NO queda nada a medias: ni el horario ni Estudios cambiaron');
  ok(registroDe(op8.opId) === '' && copias() === 0, 'I8 · …ni registro ni copia');
  ok((await rpc('protegido_estado', { op_id: op8.opId })).json.estado === 'desconocida', 'I8 · su estado es «desconocida»: se puede reenviar');
  psql('drop trigger lab_fallo_inyectado on app_data; drop function public.lab_fallo_inyectado()');
  const r8b = await aplicar(op8);
  ok(r8b.json.estado === 'aplicada' && registros() === 1 && valor('papelera').elementos.length === 1, 'I8 · reenviada con el mismo opId: se aplica UNA vez');

  // I9 — el mismo opId con otro contenido
  const fotoI9 = foto();
  const r9 = await aplicar({ ...op8, tipo: 'otra_cosa' });
  ok(r9.json.estado === 'invalida' && r9.json.motivo === 'op_distinta' && foto() === fotoI9, 'I9 · mismo opId y otro contenido: «op_distinta», sin escribir nada');

  // I10 — el conflicto repetido: una sola copia
  const op10 = operacion({ horario: horarioCon('r0', { rev: 'r10' }) });
  const c10 = [await aplicar(op10), await aplicar(op10), await aplicar(op10)];
  ok(c10.every((r) => r.json.estado === 'conflicto' && r.json.copiaId === op10.opId), 'I10 · tres envíos de una operación en conflicto: los tres «conflicto», con la misma copia');
  ok(copias() === 1 && registros() === 2, 'I10 · …una sola copia y un solo registro de ese conflicto');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('D · Rechazos: cada condición falla sin escribir nada');
  const casos = [
    ['revision', borrarAsignatura1({ base: 'otra' })],
    ['elemento_distinto', borrarAsignatura1({ igualA1: { ...A1, nombre: 'Biología (otro aparato)' } })],
    ['elemento_ausente', operacion({ horario: horarioCon('r0', { rev: uuid() }), claves: [{ clave: 'estudios', cambios: [{ camino: ['asignaturas'], quitar: [{ id: 'no-existe', igual: {} }] }] }] })],
    ['elemento_existe', operacion({ horario: horarioCon('r0', { rev: uuid() }), claves: [{ clave: 'estudios', cambios: [{ camino: ['asignaturas'], anadir: [{ elemento: A2 }] }] }] })],
    ['camino_ausente', operacion({ claves: [{ clave: 'estudios', cambios: [{ camino: ['asignaturas', { id: 'no-existe' }, 'temas'], anadir: [{ elemento: { id: 't' } }] }] }] })],
    ['campo_distinto', operacion({ claves: [{ clave: 'papelera', cambios: [{ camino: [], fijar: [{ campo: 'retencionDias', igual: 7, valor: 1 }] }] }] })],
  ];
  for (const [motivo, op] of casos) {
    sembrar();
    const antes = foto();
    const r = await aplicar(op);
    ok(r.json.estado === 'conflicto' && r.json.motivo.motivo === motivo && foto() === antes, `${motivo}: conflicto y NADA escrito (ni el horario ni ninguna otra clave)`);
    const fila = psql(`select contenido::text || '|' || (meta->'motivo'->>'motivo') from copias_apartadas where user_id='${HV_U1}' and id='${op.opId}'`);
    const [contenido, m] = fila.split('|');
    ok(!!contenido && canonico(JSON.parse(contenido)) === canonico(op) && m === motivo,
      `${motivo}: …y la operación ENTERA queda apartada, con su motivo (H-08)`);
  }
  // los dos de la operación de varias claves: la parte que sí cumplía tampoco se escribe
  sembrar();
  const parcial = borrarAsignatura1({ igualA1: { ...A1, nombre: 'cambiada' } });
  await aplicar(parcial);
  ok(revision() === 'r0' && valor('papelera').elementos.length === 0 && valor('estudios').examenes.length === 2,
    'todo o nada: si falla Estudios, tampoco cambian el horario, la papelera ni el examen que sí cumplía');
  // automática: conflicto sin copia (condición 4)
  sembrar();
  const auto = operacion({ manual: false, tipo: 'aviso_automatico', horario: horarioCon('vieja', { rev: uuid() }) });
  const ra = await aplicar(auto);
  ok(ra.json.estado === 'conflicto' && ra.json.copiaId === null && copias() === 0, 'una operación automática en conflicto NO crea copia (condición 4)');
  ok(ra.json.actual && ra.json.actual.existe === true && ra.json.actual.valor.testigo.revision === 'r0', '…y devuelve lo que hay en la cuenta para recalcular');
  // operaciones inválidas: ni se registran ni se apartan
  const invalidas = [
    ['clave_no_permitida', operacion({ claves: [{ clave: 'horarioGuardia:x', cambios: [{ camino: ['a'], anadir: [{ elemento: { id: '1' } }] }] }] })],
    ['clave_no_permitida', operacion({ claves: [{ clave: 'fitness', cambios: [{ camino: ['a'], anadir: [{ elemento: { id: '1' } }] }] }] })],
    ['horario_revision_repetida', operacion({ horario: horarioCon('r0', { rev: 'r0' }) })],
    ['opId', { ...operacion({ horario: horarioCon('r0') }), opId: 'no-es-un-uuid' }],
    ['vacia', operacion({})],
    ['cambio_mezclado', operacion({ claves: [{ clave: 'papelera', cambios: [{ camino: ['elementos'], fijar: [{ campo: 'a', valor: 1 }], anadir: [{ elemento: { id: 'z' } }] }] }] })],
    ['reemplazar', operacion({ claves: [{ clave: 'estudios', cambios: [{ camino: ['asignaturas'], reemplazar: [{ id: 'asig-2', igual: A2, nuevo: { id: 'otro-id' } }] }] }] })],
    ['creadaEn', operacion({ horario: horarioCon('r0'), creadaEn: 'ayer' })],
    /* R2 — sin `opId` o sin `tipo` (la paridad con el cliente destapó que no saltaban). */
    ['opId', (() => { const { opId: _o, ...r } = operacion({ horario: horarioCon('r0') }); void _o; return r; })()],
    ['tipo', (() => { const { tipo: _t, ...r } = operacion({ horario: horarioCon('r0') }); void _t; return r; })()],
  ];
  sembrar();
  const antesInv = foto();
  for (const [motivo, op] of invalidas) {
    const r = await aplicar(op);
    ok(r.json.estado === 'invalida' && r.json.motivo === motivo, `inválida (${motivo}): rechazada como fallo del cliente`);
  }
  ok(foto() === antesInv && registros() === 0 && copias() === 0, '…ninguna inválida escribe, se registra ni se aparta');
  // la primera fila de una cuenta
  limpiar();
  const primera = await aplicar(operacion({ horario: horarioCon(null, { baseExiste: false, rev: 'p1' }), claves: [{ clave: 'estudios', inicial: { asignaturas: [] }, cambios: [{ camino: ['asignaturas'], anadir: [{ elemento: A1 }] }] }] }));
  ok(primera.json.estado === 'aplicada' && revision() === 'p1' && valor('estudios').asignaturas[0].id === 'asig-1', 'una cuenta sin filas: se insertan el horario y Estudios (con su valor inicial)');
  const segunda = await aplicar(operacion({ horario: horarioCon(null, { baseExiste: false, rev: 'p2' }) }));
  ok(segunda.json.estado === 'conflicto' && revision() === 'p1', '…y otra «primera vez» llega tarde: conflicto, no pisa');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('E · Concurrencia entre aparatos');
  sembrar();
  const deA = operacion({ aparato: 'lab-A', horario: horarioCon('r0', { rev: 'deA' }) });
  const deB = operacion({ aparato: 'lab-B', horario: horarioCon('r0', { rev: 'deB' }) });
  const [ra2, rb2] = await Promise.all([aplicar(deA), aplicar(deB)]);
  const estados = [ra2.json.estado, rb2.json.estado].sort().join(',');
  ok(estados === 'aplicada,conflicto', 'dos aparatos a la vez sobre la misma revisión: uno se aplica y el otro queda en conflicto');
  const ganador = ra2.json.estado === 'aplicada' ? 'deA' : 'deB';
  ok(revision() === ganador && copias() === 1, '…el horario es el del ganador y lo del otro queda apartado, no pisado');
  // otro aparato cambia OTRA asignatura antes: la operación no lo pisa (C1)
  sembrar();
  const A2b = { ...A2, nombre: 'Historia (editada en B)' };
  poner('estudios', { ...ESTUDIOS, asignaturas: [A1, A2b] });
  const c1 = await aplicar(borrarAsignatura1());
  ok(c1.json.estado === 'aplicada' && valor('estudios').asignaturas.length === 1 && valor('estudios').asignaturas[0].nombre === 'Historia (editada en B)',
    'C1 · otro aparato editó OTRA asignatura antes: la operación quita la suya y CONSERVA el cambio del otro');
  // C7: lo que R1 NO cubre (E1-S): una escritura ciega posterior con un Estudios antiguo
  poner('estudios', ESTUDIOS);
  ok(valor('estudios').asignaturas.some((a) => a.id === 'asig-1'),
    'C7 (riesgo conocido, E1-S) · una escritura CIEGA posterior con un Estudios antiguo devuelve la asignatura: la transacción no protege lo que se escribe después');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('F · RLS y la guardia de las tablas propias');
  sembrar();
  await aplicar(operacion({ horario: horarioCon('vieja', { rev: uuid() }) })); // una copia de U1
  const idCopia = psql(`select id from copias_apartadas where user_id='${HV_U1}' limit 1`);
  const verU2 = await peticion(HV_PGRST_URL, 'GET', '/copias_apartadas?select=id', { u: HV_U2 });
  ok(verU2.status === 200 && Array.isArray(verU2.json) && verU2.json.length === 0, 'el usuario 2 no ve las copias del usuario 1');
  const regU2 = await peticion(HV_PGRST_URL, 'GET', '/operaciones_protegidas?select=op_id', { u: HV_U2 });
  ok(regU2.status === 200 && regU2.json.length === 0, '…ni su registro de operaciones');
  const borrarU2 = await rpc('protegido_copia_eliminar', { copia_id: idCopia }, { u: HV_U2 });
  ok(borrarU2.json.estado === 'no_existe' && copias() === 1, '…ni puede eliminar una copia suya');
  const insDirecto = await peticion(HV_PGRST_URL, 'POST', '/copias_apartadas', { cuerpo: { user_id: HV_U1, id: uuid(), tipo: 'conflicto', meta: {}, contenido: {}, tamano: 1 } });
  ok(insDirecto.status >= 400 && copias() === 1, 'la app NO puede insertar una copia directamente (la guardia la para)');
  const patchDirecto = await peticion(HV_PGRST_URL, 'PATCH', `/copias_apartadas?id=eq.${idCopia}`, { cuerpo: { vista: true } });
  ok(patchDirecto.status >= 400 && psql(`select vista from copias_apartadas where id='${idCopia}'`) === 'f', '…ni cambiarla directamente');
  const delDirecto = await peticion(HV_PGRST_URL, 'DELETE', `/copias_apartadas?id=eq.${idCopia}`, {});
  ok(delDirecto.status >= 400 && copias() === 1, '…ni borrarla sin pasar por la función');
  const falsoReg = await peticion(HV_PGRST_URL, 'POST', '/operaciones_protegidas', { cuerpo: { user_id: HV_U1, op_id: uuid(), huella: 'x', tipo: 'x', manual: true, creada_en: ahora(), resultado: 'aplicada', tamano: 1 } });
  ok(falsoReg.status >= 400, 'la app NO puede inventarse un registro «aplicada» (que haría saltar una operación de verdad)');
  const corteDirecto = await peticion(HV_PGRST_URL, 'POST', '/operaciones_corte', { cuerpo: { user_id: HV_U1, corte: ahora() } });
  ok(corteDirecto.status >= 400 && psql(`select count(*) from operaciones_corte`) === '0', '…ni poner una marca de corte');
  const leer = await rpc('protegido_leer', { claves: ['horarioTop', 'estudios', 'papelera'] });
  ok(leer.json.estado === 'leidas' && leer.json.claves.horarioTop.revision === 'r0' && /^[0-9a-f]{64}$/.test(leer.json.claves.estudios.sello)
    && leer.json.claves.estudios.valor.asignaturas.length === 2, 'leer: devuelve lo guardado TAL CUAL, con su sello y la revisión del horario');
  const leerMal = await rpc('protegido_leer', { claves: ['fitness'] });
  ok(leerMal.json.estado === 'invalida', '…y no lee claves fuera de las protegidas');
  const leerU2 = await rpc('protegido_leer', { claves: ['estudios'] }, { u: HV_U2 });
  ok(leerU2.json.claves.estudios.existe === false, '…ni las del usuario 1 siendo el usuario 2');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('G · Copias: listar, marcar vista, eliminar y espacio');
  for (let i = 0; i < 2; i += 1) await aplicar(operacion({ horario: horarioCon('vieja', { rev: uuid(), contenido: { horarios: [{ id: `h${i}`, relleno: 'x'.repeat(3000) }] } }) }));
  const lista = await peticion(HV_PGRST_URL, 'GET', '/copias_apartadas?select=id,tipo,vista,tamano,meta&order=creada_en', {});
  ok(lista.status === 200 && lista.json.length === 3 && lista.json.every((c) => c.tipo === 'conflicto' && c.meta.motivo.motivo === 'revision' && !('contenido' in c)),
    'se listan sin descargar el contenido (solo la cabecera)');
  ok((await rpc('protegido_copia_vista', { copia_id: lista.json[0].id })).json.estado === 'vista' && psql(`select vista from copias_apartadas where id='${lista.json[0].id}'`) === 't', 'marcar vista');
  const esp1 = (await rpc('protegido_espacio', {})).json;
  ok(esp1.medida === 'logica' && esp1.copias.cuantas === 3 && esp1.copias.bytes > 0 && esp1.copiasPorTipo.conflicto === 3, 'espacio: medida LÓGICA, tres copias con sus bytes');
  const elim = await rpc('protegido_copia_eliminar', { copia_id: lista.json[1].id });
  const esp2 = (await rpc('protegido_espacio', {})).json;
  ok(elim.json.estado === 'eliminada' && elim.json.tamano > 0 && esp2.copias.cuantas === 2 && esp2.copias.bytes < esp1.copias.bytes, 'eliminar: la fila desaparece y el espacio lógico baja al momento');
  ok((await rpc('protegido_copia_eliminar', { copia_id: lista.json[1].id })).json.estado === 'no_existe', 'eliminarla otra vez: «no_existe» (sin error)');
  // Medida física, solo informativa (la de verdad es de E2-0): borrar todo y limpiar la tabla en este laboratorio.
  const fisico = () => psql("select pg_relation_size('copias_apartadas') || ',' || coalesce(pg_relation_size(reltoastrelid), 0) from pg_class where relname='copias_apartadas'");
  const antesFis = fisico();
  for (const c of lista.json) await rpc('protegido_copia_eliminar', { copia_id: c.id });
  const trasBorrar = fisico();
  psql('vacuum copias_apartadas');
  const trasVacuum = fisico();
  console.log(`    (informativo · tabla de copias, bytes heap,toast: con copias ${antesFis} · tras borrarlas ${trasBorrar} · tras VACUUM ${trasVacuum})`);
  ok(trasBorrar === antesFis, 'física: borrar las filas NO reduce el tamaño de la tabla al momento');
  ok(trasVacuum.split(',')[0] === '0', 'física: con la tabla vacía, la limpieza la acorta (en este laboratorio, sin otras escrituras)');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('H · Convive con la regla de E1 (instalada SOLO aquí)');
  sembrar();
  psqlArchivo(SQL_REGLA);
  ok((await rpc('protegido_protocolo', {})).json.reglas.horarioTop === true, 'protocolo: ahora dice que la regla está activa');
  const conRegla = await aplicar(borrarAsignatura1({ rev: 'rr1' }));
  ok(conRegla.json.estado === 'aplicada' && revision() === 'rr1', 'la operación protegida pasa la regla (base = la revisión que había)');
  const ciego = await peticion(HV_PGRST_URL, 'POST', '/app_data?on_conflict=user_id,key', {
    cuerpo: { user_id: HV_U1, key: 'horarioTop', value: { horarios: [] } }, cabeceras: { prefer: 'resolution=merge-duplicates' } });
  ok(ciego.status >= 400 && revision() === 'rr1', '…y la regla sigue parando el upsert ciego de una copia antigua');
  psqlArchivo(SQL_REGLA_DESHACER);

  // ═══════════════════════════════════════════════════════════════════════
  seccion('I · Borrar una cuenta: todo se va en cascada');
  psql(`insert into auth.users (id) values ('${U3}') on conflict do nothing`);
  await aplicar(operacion({ horario: horarioCon(null, { baseExiste: false, rev: 'u3' }) }), { u: U3 });
  await aplicar(operacion({ horario: horarioCon('otra', { rev: uuid() }) }), { u: U3 });
  ok(registros(U3) === 2 && copias(U3) === 1, 'el usuario 3 tiene registro y una copia');
  psql(`delete from auth.users where id='${U3}'`);
  ok(registros(U3) === 0 && copias(U3) === 0 && psql(`select count(*) from app_data where user_id='${U3}'`) === '0', 'al borrar la cuenta se van sus filas: la guardia no bloquea la cascada');

  // ═══════════════════════════════════════════════════════════════════════
  seccion('J · La vuelta atrás');
  sembrar();
  const filasAntes = psql('select count(*) from app_data');
  psqlArchivo(SQL_DESHACER);
  ok(psql("select count(*) from pg_proc where proname like 'protegido\\_%'") === '0'
    && psql("select count(*) from pg_class where relname in ('operaciones_protegidas','copias_apartadas','operaciones_corte')") === '0'
    && psql("select count(*) from pg_namespace where nspname='protegido_interno'") === '0', 'quita las funciones, las tablas y el esquema interno');
  ok(psql('select count(*) from app_data') === filasAntes && valor('estudios').asignaturas.length === 2, '…y app_data queda intacta');
} catch (e) {
  fallos += 1;
  console.log(`  ✗ error inesperado: ${e && e.stack ? e.stack : e}`);
} finally {
  try { psql('drop trigger if exists lab_fallo_inyectado on app_data; drop function if exists public.lab_fallo_inyectado()'); } catch { /* el laboratorio puede no tenerla */ }
  try { psqlArchivo(SQL_REGLA_DESHACER); } catch { /* quizá no estaba */ }
  try { psqlArchivo(SQL_DESHACER); } catch { /* quizá ya se quitó */ }
  try { psql(`delete from app_data where user_id in ('${HV_U1}','${HV_U2}','${U3}')`); psql(`delete from auth.users where id='${U3}'`); } catch { /* sin conexión al laboratorio */ }
  proxy.close();
}

console.log(fallos ? `\n✗ ${fallos} de ${n} comprobaciones fallan` : `\n✓ ${n}/${n} comprobaciones de la operación protegida contra PostgREST local`);
process.exit(fallos ? 1 : 0);
