// ═══════════════════════════════════════════════════════════════════════════
// 🕰 HORARIOS · EL ALMACENAMIENTO DEL HISTORIAL DE VERSIONES (docs/19 §18.9)
//
// Las tres piezas: (1) `saveData` y su cola rechazan las claves `horarioVersiones:*`, (2) la lectura por prefijo y
// (3) el escritor condicional. Es la prueba de nivel 3 llevada al proyecto, con un DOBLE de PostgREST en memoria
// (la condición atómica, la clave primaria, el filtro por usuario y el `like`). La misma lógica contra un
// PostgREST REAL está en `scripts/test-historial-versiones-postgrest.mjs` (opcional: necesita uno local).
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-historial-versiones.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { register } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
register('data:text/javascript,' + encodeURIComponent(`export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (url.endsWith('/lib/supabase.js')) {
    const src = String(r.source).replace(/import\\.meta\\.env/g, "({ VITE_SUPABASE_URL: 'http://127.0.0.1:9', VITE_SUPABASE_ANON_KEY: 'prueba' })");
    return { ...r, source: src, shortCircuit: true };
  }
  return r;
}`));

const H = await import(pathToFileURL(join(RAIZ, 'src/lib/historialVersiones.js')).href);
const Y = await import(pathToFileURL(join(RAIZ, 'src/lib/sincronizacion.js')).href);
const S = await import(pathToFileURL(join(RAIZ, 'src/lib/supabase.js')).href);
const {
  crearEscritorDeVersiones, vistaFusionadaDeVersiones, registroValido, esClaveDeHistorialVersiones,
  almacenDelNavegador, candadoDelNavegador, CLAVES_LOCALES_HISTORIAL, PREFIJO_HISTORIAL_VERSIONES,
} = H;

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const errorOriginal = console.error;
const callarErrores = () => { console.error = () => {}; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const U1 = 'u1'; const U2 = 'u2';

/* ── El doble de PostgREST: filas por (usuario, clave). La condición se evalúa EN EL MOMENTO de aplicar, de una vez
   (JavaScript no se interrumpe dentro de una función síncrona): es la atomicidad del `UPDATE … WHERE` de Postgres.
   `fallos` son directivas para la siguiente operación de escritura: aplicar y perder la respuesta, perder la
   petición, retenerla hasta que se suelte, o contestar un error definitivo. */
function crearDoble() {
  const filas = new Map(); // `${usuario}|${clave}` → valor
  const directivas = [];
  /* Directivas de LECTURA de la fila propia: `fallar` hace que esa lectura no tenga respuesta (sin conexión). */
  const lecturas = [];
  const cuenta = { leerPropia: 0, leerTodas: 0 };
  /* Cuántas lecturas del historial entero (todas las filas) fallarán sin respuesta. */
  const fallosLeerTodas = { n: 0 };
  const historia = []; // cada estado de cada fila, para comprobar que nunca pierde operaciones
  const k = (u, c) => `${u}|${c}`;
  const clon = (x) => JSON.parse(JSON.stringify(x));
  const apuntar = (u, c) => historia.push({ u, c, ops: filas.get(k(u, c)).operaciones.map((o) => o.opId) });
  async function escribir(aplicarla) {
    const d = directivas.shift() || { modo: 'normal' };
    if (d.modo === 'perder-peticion') return { ok: false, sinRespuesta: true };
    if (d.espera) await d.espera;
    if (d.modo === 'error-definitivo') return { ok: false, error: { code: '42501' }, status: 403, definitivo: true };
    const r = aplicarla();
    if (d.modo === 'perder-respuesta') return { ok: false, sinRespuesta: true };
    return r;
  }
  const transporte = (usuario) => ({
    async leerTodas(u) {
      cuenta.leerTodas += 1;
      if (fallosLeerTodas.n > 0) { fallosLeerTodas.n -= 1; return { ok: false, sinRespuesta: true }; }
      if (u !== usuario) return { ok: true, filas: [] };
      return { ok: true, filas: [...filas].filter(([key]) => key.startsWith(`${u}|${PREFIJO_HISTORIAL_VERSIONES}`)).map(([key, value]) => ({ key: key.split('|')[1], value: clon(value) })) };
    },
    async leerPropia(u, c) {
      cuenta.leerPropia += 1;
      const d = lecturas.shift();
      if (d && d.modo === 'fallar') return { ok: false, sinRespuesta: true };
      if (u !== usuario) return { ok: true, valor: null }; const v = filas.get(k(u, c)); return { ok: true, valor: v ? clon(v) : null };
    },
    insertar: (u, c, valor) => escribir(() => {
      if (u !== usuario) return { ok: false, error: { code: '42501' }, status: 403, definitivo: true };
      if (filas.has(k(u, c))) return { ok: false, conflicto: true };
      filas.set(k(u, c), clon(valor)); apuntar(u, c); return { ok: true };
    }),
    actualizarSiBase: (u, c, valor, base) => escribir(() => {
      const actual = filas.get(k(u, c));
      if (u !== usuario || !actual || actual.ultimaOperacion !== base) return { ok: true, aplicada: false };
      filas.set(k(u, c), clon(valor)); apuntar(u, c); return { ok: true, aplicada: true };
    }),
  });
  return { filas, directivas, lecturas, cuenta, fallosLeerTodas, historia, transporte, todas: (u = U1) => [...filas].filter(([key]) => key.startsWith(`${u}|`)).map(([key, value]) => ({ key: key.split('|')[1], value: clon(value) })) };
}
function almacenMemoria(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return { leer: (x) => (m.has(x) ? m.get(x) : null), escribir: (x, v) => { if (!CLAVES_LOCALES_HISTORIAL.includes(x)) throw new Error('clave local no permitida: ' + x); m.set(x, String(v)); }, copia: () => Object.fromEntries(m), claves: () => [...m.keys()] };
}
function mutex() { let cola = Promise.resolve(); return (fn) => { const r = cola.then(fn, fn); cola = r.catch(() => {}); return r; }; }
const escritor = (doble, almacen, { candado = mutex(), usuario = U1 } = {}) => crearEscritorDeVersiones({ transporte: doble.transporte(usuario), usuario, almacen, candado });
const nuncaPierde = (doble) => {
  const ultimo = new Map();
  for (const h of doble.historia) {
    const key = `${h.u}|${h.c}`; const prev = ultimo.get(key) || [];
    if (prev.some((id, i) => h.ops[i] !== id)) return false;
    ultimo.set(key, h.ops);
  }
  return true;
};

/* ═══════════════════════════════════════════════════════════════════════════
   1 · saveData Y LA COLA RECHAZAN EL HISTORIAL
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1 · saveData y la cola rechazan las claves horarioVersiones:* ──');
{
  const llamadas = [];
  const fromOriginal = S.supabase.from;
  S.supabase.from = (tabla) => ({ upsert: (fila) => { llamadas.push({ tabla, fila }); return Promise.resolve({ error: null, status: 201 }); } });
  Y.empezarSesionDeDatos(U1);
  callarErrores();
  const r = await S.saveData(U1, 'horarioVersiones:aparato-1', { formato: 1, operaciones: [] });
  const r2 = await S.saveData(U1, 'horarioVersiones:aparato-1', { cualquier: 'cosa' }, { reintento: true });
  console.error = errorOriginal;
  ok(r.ok === false && r.protegida === true && r.error && r.error.code === 'clave_protegida', 'saveData de una clave del historial devuelve { ok: false, protegida, clave_protegida }');
  ok(r2.ok === false && r2.protegida === true, '…también en modo reintento');
  ok(llamadas.length === 0, '…y NO llega a la red: ni un upsert');
  const resumen = Y.resumenSincronizacion();
  ok(!resumen.pendientes.includes('horarioVersiones:aparato-1') && resumen.guardando === 0, '…ni queda pendiente ni «guardando» en la cola');
  const turno = Y.antesDeGuardar('horarioVersiones:x', { usuario: U1, valor: {} });
  ok(turno.sale === false && turno.error === Y.ERROR_CLAVE_PROTEGIDA, 'la entrada de la cola (antesDeGuardar) también la rechaza: segunda barrera');
  ok(Y.pendientesParaReintentar().every((p) => !esClaveDeHistorialVersiones(p.clave)), 'la lista de reintentos no contiene ninguna clave del historial');
  ok(/filter\(\(\[clave\]\) => !esClaveDeHistorialVersiones\(clave\)\)/.test(readFileSync(join(RAIZ, 'src/lib/sincronizacion.js'), 'utf8')), '…porque la filtra (tercera barrera, en el código)');
  const bien = await S.saveData(U1, 'horarioTop', { nada: 1 });
  ok(bien.ok === true && llamadas.length === 1 && llamadas[0].fila.key === 'horarioTop', 'una clave normal sigue guardándose como siempre (upsert)');
  await S.reintentarGuardados();
  ok(llamadas.every((l) => !esClaveDeHistorialVersiones(l.fila.key)), 'reintentarGuardados nunca manda una clave del historial');
  S.supabase.from = fromOriginal;
  // Lo que pasaría sin el rechazo: un upsert con un valor viejo borra una marca de eliminación confirmada.
  const d = crearDoble(); const a = almacenMemoria();
  const w = escritor(d, a);
  const v = await w.crearVersion({ contenido: { x: 1 }, nombre: 'Antes' });
  const viejo = d.todas()[0].value;
  await w.eliminarVersionManual(v.opId, { confirmado: true });
  const conMarca = vistaFusionadaDeVersiones(d.todas());
  d.filas.set(`${U1}|${d.todas()[0].key}`, viejo); // lo que haría un upsert ciego con el valor viejo
  const sinMarca = vistaFusionadaDeVersiones(d.todas());
  ok(conMarca.eliminadas.includes(v.opId) && sinMarca.visibles.some((x) => x.id === v.opId),
    'demostrado otra vez: un upsert ciego con un valor viejo hace REAPARECER una versión eliminada (por eso el rechazo)');
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · EL TRANSPORTE DE supabase.js: QUÉ PIDE A POSTGREST
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2 · El transporte: lectura por prefijo, inserción y escritura condicional ──');
{
  const registro = [];
  const fromOriginal = S.supabase.from;
  /* Un constructor que apunta cada llamada y contesta lo que se le diga. */
  let respuesta = { data: [], error: null, status: 200 };
  S.supabase.from = (tabla) => {
    const pasos = [{ tabla }];
    const b = {};
    for (const m of ['select', 'eq', 'like', 'insert', 'update', 'upsert', 'delete', 'maybeSingle']) b[m] = (...a) => { pasos.push({ m, a }); return b; };
    b.then = (ok2, ko) => { registro.push(pasos); return Promise.resolve(respuesta).then(ok2, ko); };
    return b;
  };
  respuesta = { data: [{ key: 'horarioVersiones:a', value: {} }], error: null, status: 200 };
  const todas = await S.leerRegistrosDeVersiones(U1);
  const p0 = registro.at(-1);
  ok(todas.ok && todas.filas.length === 1, 'leerRegistrosDeVersiones devuelve las filas');
  ok(p0.some((x) => x.m === 'like' && x.a[0] === 'key' && x.a[1] === 'horarioVersiones:%') && p0.some((x) => x.m === 'eq' && x.a[0] === 'user_id' && x.a[1] === U1) && !p0.some((x) => ['update', 'upsert', 'insert', 'delete'].includes(x.m)),
    '…con like horarioVersiones:% y su usuario, y SOLO lectura (ni update, ni upsert, ni insert, ni delete)');
  respuesta = { data: null, error: { message: 'TypeError: fetch failed' }, status: 0 };
  const sinRed = await S.leerRegistrosDeVersiones(U1);
  ok(sinRed.ok === false && sinRed.sinRespuesta === true && !sinRed.filas, 'sin conexión: ok false, sinRespuesta, y ninguna lista a medias');
  respuesta = { data: { no: 'lista' }, error: null, status: 200 };
  ok((await S.leerRegistrosDeVersiones(U1)).ok === false, 'una respuesta incompleta (no es una lista) no se da por buena');
  respuesta = { data: [{ key: 'horarioVersiones:a' }], error: null, status: 200 };
  const act = await S.actualizarRegistroDeVersiones(U1, 'horarioVersiones:a', { v: 1 }, 'op-base');
  const p1 = registro.at(-1);
  ok(act.ok && act.aplicada === true, 'actualizar: una fila devuelta = aplicada');
  ok(p1.some((x) => x.m === 'update') && !p1.some((x) => x.m === 'upsert')
    && p1.some((x) => x.m === 'eq' && x.a[0] === 'value->>ultimaOperacion' && x.a[1] === 'op-base')
    && p1.some((x) => x.m === 'eq' && x.a[0] === 'key' && x.a[1] === 'horarioVersiones:a')
    && p1.some((x) => x.m === 'select'), '…con update (no upsert), la condición value->>ultimaOperacion = base y .select()');
  respuesta = { data: [], error: null, status: 200 };
  const rech = await S.actualizarRegistroDeVersiones(U1, 'horarioVersiones:a', { v: 2 }, 'op-vieja');
  ok(rech.ok === true && rech.aplicada === false, 'cero filas devueltas = rechazada por la condición (no es un error)');
  respuesta = { data: null, error: { code: '23505', message: 'duplicate key' }, status: 409 };
  const conf = await S.insertarRegistroDeVersiones(U1, 'horarioVersiones:a', { v: 1 });
  const p2 = registro.at(-1);
  ok(conf.conflicto === true && p2.some((x) => x.m === 'insert') && !p2.some((x) => x.m === 'upsert'), 'insertar con insert (no upsert); el 409 23505 es un conflicto');
  let lanza = 0;
  for (const malo of ['horarioTop', 'ajustes', 'horarioVersiones:', '']) {
    try { await S.actualizarRegistroDeVersiones(U1, malo, {}, 'b'); } catch { lanza += 1; }
    try { await S.insertarRegistroDeVersiones(U1, malo, {}); } catch { lanza += 1; }
  }
  ok(lanza === 8, 'el transporte se niega a escribir cualquier clave que no sea horarioVersiones:<aparato> (no altera otras claves)');
  let sinBase = false; try { await S.actualizarRegistroDeVersiones(U1, 'horarioVersiones:a', {}, ''); } catch { sinBase = true; }
  ok(sinBase, 'una escritura sin base no se intenta: la condición es obligatoria');
  ok(S.transporteDeVersiones.leerTodas === S.leerRegistrosDeVersiones && S.transporteDeVersiones.actualizarSiBase === S.actualizarRegistroDeVersiones && Object.isFrozen(S.transporteDeVersiones),
    'transporteDeVersiones reúne las cuatro y no se puede cambiar');
  S.supabase.from = fromOriginal;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL ESCRITOR: RESPUESTAS PERDIDAS, REINTENTOS Y ESCRITURAS TARDÍAS
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3 · El escritor: respuestas perdidas, reintentos, escrituras tardías ──');
{
  const d = crearDoble(); const a = almacenMemoria(); const w = escritor(d, a);
  const r0 = await w.crearVersion({ contenido: { n: 0 }, nombre: 'Primera' });
  ok(r0.estado === 'confirmada' && d.filas.size === 1, 'la primera versión crea la fila del aparato (insert) y queda confirmada');
  const vista0 = vistaFusionadaDeVersiones(d.todas());
  ok(vista0.visibles[0].id === r0.opId, 'Version.id = opId de su creación');
  d.directivas.push({ modo: 'perder-respuesta' });
  const r1 = await w.crearVersion({ contenido: { n: 1 } });
  ok(r1.estado === 'confirmada' && w.cuentas.sinRespuesta === 1, 'respuesta perdida tras aplicarse: al releer se encuentra el opId y queda confirmada');
  d.directivas.push({ modo: 'perder-peticion' });
  const r2 = await w.crearVersion({ contenido: { n: 2 } });
  const enServidor = (id) => d.todas().some((f) => f.value.operaciones.some((o) => o.opId === id));
  ok(r2.estado === 'sin_confirmar' && !enServidor(r2.opId), 'petición perdida: «sin confirmar», y no está en el servidor');
  ok(w.enMemoria().includes(r2.opId) && !JSON.stringify(a.copia()).includes(r2.opId), '…la operación vive solo en memoria, nunca en el almacén local');
  const filaAntes = JSON.stringify(d.todas()[0].value);
  const r2b = await w.reintentar(r2.opId);
  const enviada = d.todas()[0].value.operaciones.find((o) => o.opId === r2.opId);
  ok(r2b.estado === 'confirmada' && w.cuentas.reintentosMismaBase >= 1 && enviada.base === JSON.parse(filaAntes).ultimaOperacion,
    'el reintento va con el MISMO opId y la MISMA base, y queda confirmado');
  /* 🐛 Auditoría 2026-11-09: aquí había una comprobación VACÍA («repetir operaciones ya confirmadas no añade
     nada»): `reintentar` de algo ya confirmado contesta «no está en memoria» sin consultar el servidor, así que no
     demostraba nada. Lo que hace de verdad se comprueba así, con su nombre: */
  const total = d.todas()[0].value.operaciones.length;
  const lecturasAntes = d.cuenta.leerPropia;
  const yaConfirmada = await w.reintentar(r1.opId);
  ok(yaConfirmada.estado === 'no_aplicada' && yaConfirmada.motivo === 'no_esta_en_memoria' && d.cuenta.leerPropia === lecturasAntes && d.todas()[0].value.operaciones.length === total,
    'reintentar una operación YA confirmada: «no está en memoria», no consulta el servidor y no añade nada');
  /* La ruta real del reintento de una operación ya aplicada: el servidor la aplica, se pierde la respuesta Y falla la
     lectura de comprobación → «sin confirmar». El reintento, desde la MISMA instancia, tiene que consultar el
     servidor, encontrar el opId y confirmarla sin crear una segunda copia (contador yaAplicadas). */
  d.directivas.push({ modo: 'perder-respuesta' });
  d.lecturas.push({ modo: 'bien' }, { modo: 'fallar' });   // 1.ª lectura (la base) bien; la de comprobación, sin respuesta
  const r3 = await w.crearVersion({ contenido: { n: 3 } });
  const enElServidor = d.todas()[0].value.operaciones.filter((o) => o.opId === r3.opId).length;
  ok(r3.estado === 'sin_confirmar' && r3.motivo === 'respuesta_perdida' && enElServidor === 1 && w.enMemoria().includes(r3.opId),
    'aplicada en el servidor, respuesta perdida y comprobación sin respuesta: «sin confirmar», en memoria (y sí está en el servidor)');
  const yaAntes = w.cuentas.yaAplicadas; const lecturasAntes2 = d.cuenta.leerPropia; const opsAntes = d.todas()[0].value.operaciones.length;
  const r3b = await w.reintentar(r3.opId);
  ok(r3b.estado === 'confirmada' && r3b.opId === r3.opId, '…el reintento desde la misma instancia la confirma (no contesta «no está en memoria»)');
  ok(d.cuenta.leerPropia > lecturasAntes2 && w.cuentas.yaAplicadas === yaAntes + 1, '…porque consulta el servidor y encuentra el opId: yaAplicadas sube exactamente 1');
  ok(d.todas()[0].value.operaciones.length === opsAntes && d.todas()[0].value.operaciones.filter((o) => o.opId === r3.opId).length === 1,
    '…y no crea una segunda copia');
  // Escritura retenida (llega tarde) mientras otra pestaña escribe: la condición la rechaza y se reconstruye.
  let soltar; const retenida = new Promise((r) => { soltar = r; });
  const otraPestana = escritor(d, a);  // mismo aparato, SIN candado común a propósito
  d.directivas.push({ modo: 'retener', espera: retenida });
  const tardia = w.crearVersion({ contenido: { n: 4 } });
  await espera(10);
  const r5 = await otraPestana.crearVersion({ contenido: { n: 5 } });
  soltar();
  const r4 = await tardia;
  const vista = vistaFusionadaDeVersiones(d.todas());
  ok(r5.estado === 'confirmada' && r4.estado === 'confirmada' && w.cuentas.rechazadasPorCondicion >= 1
    && [r0, r1, r2, r3, r4, r5].every((x) => vista.visibles.some((v) => v.id === x.opId)) && vista.visibles.length === 6,
  'una escritura que llega tarde con base vieja se rechaza (cero filas) y se reconstruye sobre la nueva: las 6 están');
  ok(nuncaPierde(d), 'ninguna fila perdió ni reordenó una operación en ningún momento');
  // Un error definitivo (403): consta que no se aplicó.
  d.directivas.push({ modo: 'error-definitivo' });
  const r6 = await w.crearVersion({ contenido: { n: 6 } });
  ok(r6.estado === 'no_aplicada' && !enServidor(r6.opId), 'un error definitivo (403) es «no aplicada», y no está en el servidor');
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · INSERCIÓN INICIAL Y CONFLICTO DE CLAVE PRIMARIA
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4 · Inserción inicial y conflicto de clave primaria ──');
{
  let sinCandadoBien = 0, conCandadoBien = 0, paradas = 0;
  for (let i = 0; i < 50; i++) {
    // Sin candado común (tres instalaciones que comparten id): el diseño permite como mucho DOS intentos; la que
    // agota los dos se para como «no aplicada» (consta que no se aplicó) y se reintenta con su mismo opId.
    const d = crearDoble(); const a = almacenMemoria();
    const ws = [escritor(d, a), escritor(d, a), escritor(d, a)];
    const rs = await Promise.all(ws.map((w, j) => w.crearVersion({ contenido: { j } })));
    const correctas = rs.every((r) => r.estado === 'confirmada' || (r.estado === 'no_aplicada' && r.motivo === 'conflictos_repetidos'));
    for (const [j, r] of rs.entries()) if (r.estado === 'no_aplicada') { paradas += 1; await ws[j].reintentar(r.opId); }
    const v = vistaFusionadaDeVersiones(d.todas());
    if (correctas && d.filas.size === 1 && v.visibles.length === 3 && nuncaPierde(d)) sinCandadoBien += 1;
    // Con el candado común (tres pestañas del mismo aparato, navigator.locks): las tres a la primera.
    const d2 = crearDoble(); const a2 = almacenMemoria(); const c = mutex();
    const rs2 = await Promise.all([0, 1, 2].map((j) => escritor(d2, a2, { candado: c }).crearVersion({ contenido: { j } })));
    if (rs2.every((r) => r.estado === 'confirmada') && vistaFusionadaDeVersiones(d2.todas()).visibles.length === 3) conCandadoBien += 1;
  }
  ok(sinCandadoBien === 50, `50 rondas sin candado común: una inserta, las demás reciben el conflicto y añaden con la condición; la que agota sus dos intentos se para «no aplicada» (${paradas}) y al reintentar entra; nada se pierde`);
  ok(conCandadoBien === 50, '50 rondas con el candado común: las tres pestañas confirmadas a la primera');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LECTURA, AISLAMIENTO Y VISTA FUSIONADA
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5 · Lectura, aislamiento y vista fusionada ──');
{
  const d = crearDoble();
  const w1 = escritor(d, almacenMemoria()); const w2 = escritor(d, almacenMemoria(), { usuario: U2 });
  await w1.crearVersion({ contenido: { de: 1 } }); await w2.crearVersion({ contenido: { de: 2 } });
  const l1 = await w1.leer(); const l2 = await w2.leer();
  ok(l1.ok && l1.vista.visibles.length === 1 && l2.vista.visibles.length === 1 && l1.vista.visibles[0].contenido.de === 1, 'cada usuario lee solo sus filas');
  // La misma operación en dos filas cuenta una vez, y no se borra ninguna copia.
  const op = { opId: 'op-x', n: 1, tipo: 'crear', version: { id: 'op-x', motivo: 'manual', nombre: 'X', contenido: {} }, sesion: 's' };
  const fila = (ap, ops) => ({ key: `horarioVersiones:${ap}`, value: { formato: 1, aparato: ap, secuencia: ops.length, ultimaOperacion: ops.at(-1).opId, operaciones: ops } });
  const dos = [fila('a', [op]), fila('b', [op])];
  const vd = vistaFusionadaDeVersiones(dos);
  ok(vd.visibles.length === 1 && vd.copias === 2 && vd.operacionesUnicas === 1, 'la misma operación en dos filas aparece UNA vez y se conservan las dos copias');
  const distinta = fila('c', [{ ...op, version: { ...op.version, nombre: 'Otro' } }]);
  ok(vistaFusionadaDeVersiones([...dos, distinta]).distintas.includes('op-x'), 'dos copias del mismo opId que no dicen lo mismo se avisan, sin elegir una');
  const ilegible = { key: 'horarioVersiones:roto', value: { formato: 1, operaciones: 'no' } };
  const vi = vistaFusionadaDeVersiones([...dos, ilegible]);
  ok(vi.ilegibles.includes('horarioVersiones:roto') && vi.visibles.length === 1, 'una fila ilegible se aparta: no se enseña ni rompe la vista');
  ok(!registroValido(ilegible) && registroValido(dos[0]), 'registroValido distingue una fila buena de una incompleta');
  const malSecuencia = fila('d', [op]); malSecuencia.value.secuencia = 5;
  ok(!registroValido(malSecuencia), '…también una con la secuencia que no cuadra');
  /* 🔄 Último ajuste previo a la Fase 4: antes, con la fila propia ilegible, el escritor cambiaba de id y escribía en
     una fila nueva. Ahora una fila ilegible (propia o de otro aparato) deja la vista incompleta y no se escribe. */
  const d2 = crearDoble(); const a2 = almacenMemoria({ aparato: 'roto', confirmada: 'null' });
  d2.filas.set(`${U1}|horarioVersiones:roto`, { formato: 1, aparato: 'roto', operaciones: 'no' });
  const w3 = escritor(d2, a2);
  const r = await w3.crearVersion({ contenido: {} });
  ok(r.estado === 'no_aplicada' && r.motivo === 'vista_incompleta' && JSON.stringify(d2.filas.get(`${U1}|horarioVersiones:roto`)) === '{"formato":1,"aparato":"roto","operaciones":"no"}' && d2.filas.size === 1,
    'con la fila propia ilegible: no se escribe (ni en ella ni en una fila nueva) y la ilegible no se toca');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5b · FILAS ILEGIBLES Y FORMATO FUTURO: NINGUNA ELIMINADA REAPARECE (auditoría 2026-11-09)
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5b · Filas ilegibles, eliminaciones dudosas, conflictos y formato futuro ──');
{
  const crear = (id, motivo = 'manual', n = 1) => ({ opId: id, n, tipo: 'crear', version: { id, motivo, nombre: id, creadaEn: `2026-11-0${n}T10:00:00Z` }, sesion: 's' });
  const marca = (id, versionId, n = 1, extra = {}) => ({ opId: id, n, tipo: 'eliminar', versionId, sesion: 't', ...extra });
  const fila = (ap, ops, extra = {}) => ({ key: `horarioVersiones:${ap}`, value: { formato: 1, aparato: ap, secuencia: ops.length, ultimaOperacion: ops.at(-1).opId, operaciones: ops, ...extra } });
  const danada = (ap, ops) => fila(ap, ops, { secuencia: 99, ultimaOperacion: 'x' });
  const A = fila('A', [crear('v1', 'manual', 1), crear('v2', 'manual', 2), crear('v3', 'manual', 3), crear('auto1', 'migracion', 4)]);
  const ids = (v) => v.visibles.map((x) => x.id);
  /* El resultado no puede depender del orden de las filas: se prueban TODAS las permutaciones. */
  const permutaciones = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutaciones([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
  const igualEnTodoOrden = (filas) => {
    const res = permutaciones(filas).map((p) => JSON.stringify(vistaFusionadaDeVersiones(p)));
    return res.every((r) => r === res[0]);
  };

  const base = vistaFusionadaDeVersiones([A, fila('B', [marca('m1', 'v1')])]);
  ok(!ids(base).includes('v1') && base.eliminadas.includes('v1') && base.completa === true && base.definitiva === true && base.eliminacionesDudosas.length === 0,
    'con todas las filas legibles: v1 eliminada por una marca válida; la vista, completa y definitiva');

  /* 🔄 Antes (primera corrección del 2026-11-09) una marca recuperada de una fila dañada ELIMINABA. Ahora no: es una
     eliminación dudosa, y esta comprobación se ha dado la vuelta. */
  const v1 = vistaFusionadaDeVersiones([A, danada('B', [marca('m1', 'v1')])]);
  const d1 = v1.eliminacionesDudosas.find((x) => x.opId === 'm1');
  ok(ids(v1).includes('v1') && !v1.eliminadas.includes('v1') && d1 && d1.versionId === 'v1' && d1.objetivo === 'visible' && d1.filas.includes('horarioVersiones:B'),
    'fila dañada: su marca NO elimina; v1 sigue visible y la marca queda como eliminación dudosa (con su fila, para «Revisión»)');
  ok(v1.visibles.find((x) => x.id === 'v1').eliminacionDudosa.includes('m1'), '…y la propia versión lleva apuntada la eliminación dudosa');
  ok(v1.completa === false && v1.definitiva === false && v1.detalleIlegibles.some((x) => x.key === 'horarioVersiones:B' && x.motivo === 'fila_ilegible'),
    '…la vista sale incompleta y NO definitiva, con la fila descrita');

  // R2 · el mismo opId en una fila válida (elimina v2) y en una dañada (dice v1): manda la válida, en cualquier orden.
  const C = fila('C', [marca('m2', 'v2')]);
  const Br2 = danada('B', [marca('m2', 'v1')]);
  const r2a = vistaFusionadaDeVersiones([A, C, Br2]); const r2b = vistaFusionadaDeVersiones([A, Br2, C]);
  ok(JSON.stringify(r2a) === JSON.stringify(r2b) && igualEnTodoOrden([A, C, Br2]), 'R2: el resultado es el mismo en cualquier orden de lectura');
  ok(!ids(r2a).includes('v2') && ids(r2a).includes('v1') && r2a.eliminadas.join() === 'v2',
    'R2: manda la operación de la fila válida (v2 eliminada); la copia dañada no oculta v1');
  ok(r2a.conflictos.some((c) => c.opId === 'm2' && c.origen === 'valida_y_recuperada' && c.variantes.length === 2) && !r2a.eliminacionesDudosas.some((x) => x.opId === 'm2'),
    'R2: la diferencia se apunta como conflicto (con las dos variantes), sin convertirse en eliminación dudosa');

  // R3 · una marca dañada con el opId de una versión (Version.id = opId): ninguna versión válida desaparece.
  const Br3 = danada('B', [marca('v3', 'v1')]);
  const r3a = vistaFusionadaDeVersiones([A, Br3]); const r3b = vistaFusionadaDeVersiones([Br3, A]);
  ok(JSON.stringify(r3a) === JSON.stringify(r3b), 'R3: el resultado es el mismo en los dos órdenes');
  ok(['v1', 'v2', 'v3', 'auto1'].every((id) => ids(r3a).includes(id)) && r3a.eliminadas.length === 0,
    'R3: ninguna versión válida desaparece (ni v3, la del opId, ni v1, la que decía la marca)');
  ok(r3a.conflictos.some((c) => c.opId === 'v3' && c.origen === 'valida_y_recuperada') && r3a.definitiva === false, 'R3: queda como conflicto y la vista no es definitiva');

  // R4 · versionId corrupto pero válido (se quería v1 y guarda v2): la marca dudosa no oculta v2.
  const r4 = vistaFusionadaDeVersiones([A, danada('B', [marca('m4', 'v2')])]);
  ok(ids(r4).includes('v2') && ids(r4).includes('v1') && !r4.eliminadas.includes('v2'), 'R4: la marca dudosa no oculta v2');
  ok(r4.eliminacionesDudosas.some((x) => x.opId === 'm4' && x.versionId === 'v2' && x.objetivo === 'visible' && x.nombre === 'v2') && r4.definitiva === false,
    'R4: queda como eliminación dudosa sobre v2, visible, con su nombre: «Revisión» puede enseñarla');

  // Duplicados de un opId dentro de una fila dañada.
  const igual = vistaFusionadaDeVersiones([A, danada('B', [marca('m5', 'v1', 1), marca('m5', 'v1', 1)])]);
  ok(igual.eliminacionesDudosas.filter((x) => x.opId === 'm5').length === 1 && ids(igual).includes('v1') && !igual.conflictos.some((c) => c.opId === 'm5'),
    'dos copias idénticas en una fila dañada: una sola eliminación dudosa (y no elimina)');
  const meta = vistaFusionadaDeVersiones([A, danada('B', [marca('m6', 'v1', 1), marca('m6', 'v1', 7, { sesion: 'otra', base: 'z' })])]);
  ok(!meta.eliminacionesDudosas.some((x) => x.opId === 'm6') && meta.conflictos.some((c) => c.opId === 'm6' && c.origen === 'copias_en_fila_ilegible' && c.variantes.length === 2),
    'copias en una fila dañada que solo difieren en n, base o sesion: no es una marca fiable; se apunta como conflicto');
  const dosIds = vistaFusionadaDeVersiones([A, danada('B', [marca('m7', 'v1', 1), marca('m7', 'v2', 2)])]);
  ok(!dosIds.eliminacionesDudosas.some((x) => x.opId === 'm7') && dosIds.conflictos.some((c) => c.opId === 'm7') && ids(dosIds).includes('v1') && ids(dosIds).includes('v2'),
    'copias en una fila dañada con distinto versionId: conflicto, ninguna se elige y nada se oculta');
  const dosFilas = vistaFusionadaDeVersiones([A, danada('B', [marca('m8', 'v1')]), danada('D', [marca('m8', 'v2')])]);
  ok(dosFilas.conflictos.some((c) => c.opId === 'm8' && c.origen === 'recuperadas') && !dosFilas.eliminacionesDudosas.some((x) => x.opId === 'm8'),
    'el mismo opId recuperado de dos filas dañadas diciendo cosas distintas: conflicto, no eliminación dudosa');

  // Una marca parcial (sin versionId) no se da por válida, y de una fila dañada no se recupera ninguna versión.
  const v2p = vistaFusionadaDeVersiones([A, danada('B', [{ opId: 'm2p', n: 1, tipo: 'eliminar', sesion: 't' }, { ...crear('v9'), n: 2 }])]);
  ok(!v2p.marcasRecuperadas.includes('m2p') && !v2p.eliminacionesDudosas.length && ids(v2p).includes('v1') && v2p.completa === false, 'una marca parcial (sin versionId) no se lee; la vista, incompleta');
  ok(!ids(v2p).includes('v9'), '…y de una fila dañada no se recupera ninguna VERSIÓN (sería inventarla)');

  // Conflictos entre filas válidas: no se elige la primera copia.
  const C1 = fila('C', [marca('m9', 'v1')]); const D1 = fila('D', [marca('m9', 'v2')]);
  const cv = vistaFusionadaDeVersiones([A, C1, D1]);
  ok(igualEnTodoOrden([A, C1, D1]) && ids(cv).includes('v1') && ids(cv).includes('v2') && cv.eliminadas.length === 0
    && cv.conflictos.some((c) => c.opId === 'm9' && c.origen === 'filas_validas') && cv.definitiva === false,
    'dos filas válidas con el mismo opId eliminando cosas distintas: ninguna se aplica, conflicto, mismo resultado en todo orden');
  const otraV2 = fila('E', [{ ...crear('v2', 'manual', 2), n: 1, version: { ...crear('v2', 'manual', 2).version, nombre: 'Otra' } }]);
  const cc = vistaFusionadaDeVersiones([A, otraV2]);
  ok(igualEnTodoOrden([A, otraV2]) && ids(cc).includes('v2') && cc.visibles.find((x) => x.id === 'v2').enConflicto === true && cc.conflictos.some((c) => c.opId === 'v2' && c.variantes.length === 2),
    'una creación con dos copias distintas: la versión NO desaparece, sale marcada «en conflicto» con sus dos variantes');
  const crearYMarca = fila('F', [marca('v3', 'v1')]);
  const cm = vistaFusionadaDeVersiones([A, crearYMarca]);
  ok(igualEnTodoOrden([A, crearYMarca]) && ['v1', 'v3'].every((id) => ids(cm).includes(id)) && cm.conflictos.some((c) => c.opId === 'v3'),
    'entre filas válidas, una marca con el opId de una versión tampoco la hace desaparecer');

  // Las automáticas siguen protegidas: con una marca dudosa y con una válida.
  const auto = vistaFusionadaDeVersiones([A, danada('B', [marca('m10', 'auto1')])]);
  ok(ids(auto).includes('auto1') && auto.eliminacionesDudosas.some((x) => x.opId === 'm10' && x.objetivo === 'automatica'), 'una marca dudosa sobre una automática: la automática sigue, y se dice que es automática');
  const autoV = vistaFusionadaDeVersiones([A, fila('B', [marca('m11', 'auto1')])]);
  ok(ids(autoV).includes('auto1') && autoV.marcasIgnoradas.includes('m11'), 'una marca válida sobre una automática se ignora: la automática sigue protegida');

  // Objetivo ya eliminado o desconocido.
  const ya = vistaFusionadaDeVersiones([A, fila('C', [marca('m12', 'v1')]), danada('B', [marca('m13', 'v1')])]);
  ok(!ids(ya).includes('v1') && ya.eliminacionesDudosas.some((x) => x.opId === 'm13' && x.objetivo === 'ya_eliminada'), 'dudosa sobre una versión que una marca válida ya eliminó: «ya_eliminada»');
  const desc = vistaFusionadaDeVersiones([A, danada('B', [marca('m14', 'zzz')])]);
  ok(desc.eliminacionesDudosas.some((x) => x.opId === 'm14' && x.objetivo === 'desconocida') && !desc.eliminadas.includes('zzz') && ids(desc).length === 4,
    'dudosa sobre una versión que no se ve: «desconocida», y no se apunta como eliminada');

  // Versiones creadas en dos aparatos: el orden de la lista no depende de qué fila llegue antes (fecha de creación, luego id).
  const H = fila('H', [{ ...crear('v0', 'manual', 5), n: 1 }]);
  const o1 = ids(vistaFusionadaDeVersiones([A, H])); const o2 = ids(vistaFusionadaDeVersiones([H, A]));
  ok(o1.join() === o2.join() && o1.join() === 'v1,v2,v3,auto1,v0', `versiones de dos aparatos: el mismo orden en las dos lecturas (${o1.join(' · ')})`);
  // Todo junto, en cualquier orden.
  ok(igualEnTodoOrden([A, C, Br2, Br3, danada('G', [marca('m4', 'v2')])]), 'filas válidas, dañadas y en conflicto a la vez: el mismo resultado en las 120 permutaciones');

  // Formato futuro: no se interpreta nada, la vista sale incompleta y la fila no se toca.
  const Bfuturo = { key: 'horarioVersiones:B', value: { formato: 2, aparato: 'B', algo: 'nuevo', operaciones: [marca('m1', 'v1')] } };
  const v5 = vistaFusionadaDeVersiones([A, Bfuturo]);
  ok(v5.completa === false && v5.formatoFuturo.includes('horarioVersiones:B') && v5.detalleIlegibles.some((x) => x.motivo === 'formato_futuro' && x.formato === 2),
    'formato futuro: la fila se reconoce como de una versión desconocida y la vista sale incompleta');
  ok(v5.marcasRecuperadas.length === 0, '…de ella no se interpreta nada (ni siquiera lo que parezca una marca)');
  // El escritor con filas de formato futuro.
  const d = crearDoble(); const a = almacenMemoria({ aparato: 'propio' });
  const futuroPropio = { formato: 2, aparato: 'propio', operaciones: [] };
  d.filas.set(`${U1}|horarioVersiones:propio`, futuroPropio);
  const w = escritor(d, a);
  const rf = await w.crearVersion({ contenido: {} });
  ok(rf.estado === 'no_aplicada' && rf.motivo === 'formato_nuevo' && JSON.stringify(d.filas.get(`${U1}|horarioVersiones:propio`)) === JSON.stringify(futuroPropio) && d.filas.size === 1,
    'con su propia fila en un formato futuro, el escritor no escribe (ni en ella ni cambiando de id): «formato_nuevo», y la fila queda intacta');
  const d2 = crearDoble(); const a2 = almacenMemoria(); const w2 = escritor(d2, a2);
  const man = await w2.crearVersion({ contenido: {}, nombre: 'M' });
  d2.filas.set(`${U1}|horarioVersiones:otro`, { formato: 3, aparato: 'otro', operaciones: [] });
  ok((await w2.eliminarVersionManual(man.opId, { confirmado: true })).motivo === 'formato_nuevo', 'con otra fila en formato futuro: no se elimina (no se sabe qué dice esa fila)');
  ok((await w2.renombrarVersionManual(man.opId, 'N')).motivo === 'formato_nuevo', '…ni se renombra');
  d2.filas.set(`${U1}|horarioVersiones:otro`, { formato: 1, aparato: 'otro', operaciones: 'dañada' });
  ok((await w2.renombrarVersionManual(man.opId, 'N')).motivo === 'vista_incompleta', 'con una fila dañada (vista incompleta): renombrar no se permite');
  /* 🔄 Cierre previo a la Fase 4: con la vista incompleta tampoco se elimina (antes se permitía). */
  const el = await w2.eliminarVersionManual(man.opId, { confirmado: true });
  ok(el.estado === 'no_aplicada' && el.motivo === 'vista_incompleta' && vistaFusionadaDeVersiones(d2.todas()).visibles.some((v) => v.id === man.opId),
    '…ni eliminar: con la vista incompleta no se modifica el historial, y la versión sigue');
  ok(JSON.stringify(d2.filas.get(`${U1}|horarioVersiones:otro`)) === '{"formato":1,"aparato":"otro","operaciones":"dañada"}', '…y la fila dañada no se toca');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5c · VERSIONES AFECTADAS: NI SE RENOMBRAN NI SE ELIMINAN (cierre previo a la Fase 4)
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5c · Versiones afectadas por conflictos ──');
{
  const crear = (id, extra = {}) => ({ opId: id, n: 1, tipo: 'crear', version: { id, motivo: 'manual', nombre: id, creadaEn: '2026-11-01T00:00:00Z', contenido: {}, ...extra }, sesion: 's' });
  const fila = (ap, ops, extra = {}) => ({ formato: 1, aparato: ap, secuencia: ops.length, ultimaOperacion: ops.at(-1).opId, operaciones: ops.map((o, i) => ({ ...o, n: i + 1 })), ...extra });
  const poner = (d, ap, valor) => d.filas.set(`${U1}|horarioVersiones:${ap}`, valor);
  const foto = (d) => JSON.stringify([...d.filas].filter(([k]) => !k.endsWith(':propia')).sort());
  const vista = (d) => vistaFusionadaDeVersiones(d.todas());
  const de = (v, id) => v.visibles.find((x) => x.id === id);
  const nuevoEscritor = (d) => escritor(d, almacenMemoria({ aparato: 'propia' }));

  // 1-3 · Una creación con dos variantes incompatibles (dos filas válidas): ni renombrar ni eliminar.
  {
    const d = crearDoble();
    poner(d, 'A', fila('A', [crear('vX', { nombre: 'Lunes', contenido: { a: 1 } })]));
    poner(d, 'B', fila('B', [crear('vX', { nombre: 'Martes', contenido: { b: 2 } })]));
    const w = nuevoEscritor(d);
    const v0 = vista(d); const antes = foto(d);
    ok(de(v0, 'vX').afectada && de(v0, 'vX').afectadaPor.some((a) => a.motivo === 'creacion_en_conflicto' && a.origen === 'filas_validas' && a.opId === 'vX') && v0.completa && !v0.definitiva,
      'creación con variantes incompatibles: la versión sale afectada, con su origen y motivo (vista completa pero no definitiva)');
    const rn = await w.renombrarVersionManual('vX', 'Resuelta');
    ok(rn.estado === 'no_aplicada' && rn.motivo === 'version_afectada', '1 · renombrar una versión afectada por un conflicto: bloqueado');
    const el = await w.eliminarVersionManual('vX', { confirmado: true });
    ok(el.estado === 'no_aplicada' && el.motivo === 'version_afectada', '2 · eliminarla: bloqueado');
    ok(foto(d) === antes && !d.filas.has(`${U1}|horarioVersiones:propia`), '3 · operar sobre la creación en conflicto no escribe nada en ninguna fila');
    const c = vista(d).conflictos.find((x) => x.opId === 'vX');
    ok(c && c.variantes.length === 2 && c.variantes.some((x) => x.v.nombre === 'Lunes' && x.v.contenido.a === 1) && c.variantes.some((x) => x.v.nombre === 'Martes' && x.v.contenido.b === 2),
      '11 · las dos variantes siguen enteras (con su contenido y sus filas) en los conflictos');
  }

  // 4-5 · Una variante automática frente a otra manual: toda la identidad está protegida.
  {
    const d = crearDoble();
    poner(d, 'A', fila('A', [crear('vM', { motivo: 'migracion', nombre: 'auto' })]));
    poner(d, 'B', fila('B', [crear('vM', { motivo: 'manual', nombre: 'auto' })]));
    const w = nuevoEscritor(d);
    const v0 = vista(d);
    ok(de(v0, 'vM').protegida === true, 'una creación con una variante automática y otra manual: la identidad sale protegida');
    const el = await w.eliminarVersionManual('vM', { confirmado: true });
    ok(el.motivo === 'version_automatica' && de(vista(d), 'vM'), '4 · el escritor no la elimina aunque la variante que se enseña sea manual');
    ok((await w.renombrarVersionManual('vM', 'x')).motivo === 'version_automatica', '…ni la renombra');
    poner(d, 'C', fila('C', [{ opId: 'm-otro', tipo: 'eliminar', versionId: 'vM', sesion: 'z' }]));
    const v1 = vista(d);
    ok(de(v1, 'vM') && v1.marcasIgnoradas.includes('m-otro') && !v1.eliminadas.includes('vM'),
      '5 · una marca VÁLIDA de otro aparato sobre esa versión se ignora al fusionar: sigue visible');
  }

  // 6 · Renombre en conflicto: la versión que nombra queda afectada (no solo el opId del renombre).
  {
    const d = crearDoble();
    poner(d, 'A', fila('A', [crear('v1'), crear('v2')]));
    const r = (n) => ({ opId: 'r1', tipo: 'renombrar', versionId: 'v1', nombre: n, sustituye: null, sesion: 's' });
    poner(d, 'C', fila('C', [r('Uno')])); poner(d, 'D', fila('D', [r('Dos')]));
    const w = nuevoEscritor(d);
    const v0 = vista(d);
    ok(de(v0, 'v1').afectadaPor.some((a) => a.opId === 'r1' && a.motivo === 'renombre_en_conflicto') && de(v0, 'v1').enConflicto && !de(v0, 'v2').afectada,
      '6 · renombre en conflicto: v1 queda identificada como afectada (y v2, no)');
    ok((await w.renombrarVersionManual('v1', 'Tres')).motivo === 'version_afectada' && (await w.eliminarVersionManual('v1', { confirmado: true })).motivo === 'version_afectada',
      '…y v1 no se puede renombrar ni eliminar');
    // 9 · Las versiones no afectadas siguen funcionando aunque la vista no sea definitiva.
    const rn2 = await w.renombrarVersionManual('v2', 'Nueva');
    ok(rn2.estado === 'confirmada' && de(vista(d), 'v2').nombre === 'Nueva', '9 · una versión no afectada se sigue pudiendo renombrar…');
    const el2 = await w.eliminarVersionManual('v2', { confirmado: true });
    ok(el2.estado === 'confirmada' && vista(d).eliminadas.includes('v2'), '…y eliminar');
  }

  // 7 · Eliminación en conflicto: las DOS versiones que nombran sus variantes quedan afectadas.
  {
    const d = crearDoble();
    poner(d, 'A', fila('A', [crear('v1'), crear('v2'), crear('v3')]));
    const m = (vid) => ({ opId: 'm9', tipo: 'eliminar', versionId: vid, sesion: 's' });
    poner(d, 'C', fila('C', [m('v1')])); poner(d, 'D', fila('D', [m('v2')]));
    const w = nuevoEscritor(d);
    const v0 = vista(d);
    ok(['v1', 'v2'].every((id) => de(v0, id).afectadaPor.some((a) => a.opId === 'm9' && a.motivo === 'eliminacion_en_conflicto')) && !de(v0, 'v3').afectada && v0.eliminadas.length === 0,
      '7 · eliminación en conflicto: v1 y v2 quedan afectadas y visibles; v3, no');
    ok((await w.eliminarVersionManual('v1', { confirmado: true })).motivo === 'version_afectada' && (await w.renombrarVersionManual('v2', 'x')).motivo === 'version_afectada',
      '…y ninguna de las dos se puede eliminar ni renombrar');
    ok(v0.afectadas.map((a) => a.versionId).join() === 'v1,v2', '…la vista lista las versiones afectadas');
  }

  // 8 · Una marca dudosa que comparte id con una creación válida afecta a la versión que NOMBRA, no a esa creación.
  {
    const A = { key: 'horarioVersiones:A', value: fila('A', [crear('v1'), crear('v3')]) };
    const B = { key: 'horarioVersiones:B', value: { ...fila('B', [{ opId: 'v3', tipo: 'eliminar', versionId: 'v1', sesion: 's' }]), secuencia: 99 } };
    const v = vistaFusionadaDeVersiones([A, B]);
    ok(!de(v, 'v3').afectada && !de(v, 'v3').enConflicto, '8 · la creación válida v3 NO se marca por compartir id con una marca dudosa');
    ok(de(v, 'v1').afectadaPor.some((a) => a.opId === 'v3' && a.origen === 'valida_y_recuperada' && a.motivo === 'marca_recuperada_en_conflicto'),
      '…la afectada es v1, la que nombra la marca, con su origen y motivo');
    ok(v.conflictos.some((c) => c.opId === 'v3' && c.variantes.length === 2), '…y el conflicto conserva las dos variantes');
  }

  // Una eliminación dudosa afecta a su versión.
  {
    const A = { key: 'horarioVersiones:A', value: fila('A', [crear('v1')]) };
    const B = { key: 'horarioVersiones:B', value: { ...fila('B', [{ opId: 'md', tipo: 'eliminar', versionId: 'v1', sesion: 's' }]), secuencia: 99 } };
    const v = vistaFusionadaDeVersiones([A, B]);
    ok(de(v, 'v1').afectada && de(v, 'v1').afectadaPor.some((a) => a.motivo === 'eliminacion_dudosa') && !de(v, 'v1').enConflicto,
      'una eliminación dudosa deja la versión afectada (sin llamarlo conflicto)');
  }

  // 10 · Vistas incompletas y de formato futuro: nada que modifique el historial.
  {
    const d = crearDoble(); const w = nuevoEscritor(d);
    const v = await w.crearVersion({ contenido: {}, nombre: 'M' });
    poner(d, 'rota', { formato: 1, aparato: 'rota', operaciones: 'dañada' });
    const antes = foto(d);
    ok((await w.eliminarVersionManual(v.opId, { confirmado: true })).motivo === 'vista_incompleta' && (await w.renombrarVersionManual(v.opId, 'x')).motivo === 'vista_incompleta' && foto(d) === antes,
      '10 · con una fila dañada: ni eliminar ni renombrar, y no se escribe nada');
    poner(d, 'rota', { formato: 2, aparato: 'rota', operaciones: [] });
    const antes2 = foto(d);
    ok((await w.eliminarVersionManual(v.opId, { confirmado: true })).motivo === 'formato_nuevo' && (await w.renombrarVersionManual(v.opId, 'x')).motivo === 'formato_nuevo' && foto(d) === antes2,
      '…con una fila de formato futuro: tampoco, y no se escribe nada');
  }

  // 11 · Ninguna corrección hace desaparecer datos: lo que la vista deja fuera sigue en `conflictos` o `eliminacionesDudosas`.
  {
    const A = { key: 'horarioVersiones:A', value: fila('A', [crear('v1'), crear('v2')]) };
    const C = { key: 'horarioVersiones:C', value: fila('C', [{ opId: 'm9', tipo: 'eliminar', versionId: 'v1', sesion: 's' }]) };
    const D = { key: 'horarioVersiones:D', value: fila('D', [{ opId: 'm9', tipo: 'eliminar', versionId: 'v2', sesion: 's' }]) };
    const E = { key: 'horarioVersiones:E', value: fila('E', [crear('v2', { nombre: 'Otra' })]) };
    const v = vistaFusionadaDeVersiones([A, C, D, E]);
    const ops = [A, C, D, E].flatMap((f) => f.value.operaciones);
    const presente = (o) => o.tipo === 'crear'
      ? v.visibles.some((x) => x.id === o.version.id) || v.conflictos.some((c) => c.variantes.some((x) => x.v && x.v.id === o.version.id && x.v.nombre === o.version.nombre))
      : v.conflictos.some((c) => c.opId === o.opId && c.variantes.some((x) => x.id === o.versionId)) || v.eliminadas.includes(o.versionId);
    ok(ops.every(presente) && ['v1', 'v2'].every((id) => de(v, id)), '11 · cada operación de cada fila sigue a la vista: aplicada, visible o como variante de un conflicto; ninguna versión desaparece');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   5d · CREAR TAMBIÉN EXIGE EL HISTORIAL ENTERO LEGIBLE (último ajuste previo a la Fase 4)
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5d · Crear con la vista global incompleta ──');
{
  const otraFila = (ap) => ({ formato: 1, aparato: ap, secuencia: 1, ultimaOperacion: 'o-' + ap,
    operaciones: [{ opId: 'o-' + ap, n: 1, tipo: 'crear', version: { id: 'o-' + ap, motivo: 'manual', nombre: ap }, sesion: 's' }] });
  const foto = (d) => JSON.stringify([...d.filas].sort());
  const nuevo = () => { const d = crearDoble(); d.filas.set(`${U1}|horarioVersiones:otro`, otraFila('otro')); return { d, w: escritor(d, almacenMemoria({ aparato: 'propio' })) }; };

  // 1 y 6 · Con todas las filas válidas, crear funciona (y la creación normal sigue igual).
  {
    const { d, w } = nuevo();
    const r = await w.crearVersion({ contenido: { a: 1 }, nombre: 'Normal' });
    const v = vistaFusionadaDeVersiones(d.todas());
    ok(r.estado === 'confirmada' && v.visibles.some((x) => x.id === r.opId) && v.completa && d.cuenta.leerTodas >= 1,
      '1 · crear con todas las filas válidas: permitido (y se ha comprobado el historial entero)');
    const r2 = await w.crearVersion({ contenido: { a: 2 }, nombre: 'Otra', motivo: 'migracion' });
    ok(r2.estado === 'confirmada' && vistaFusionadaDeVersiones(d.todas()).visibles.length === 3, '6 · las creaciones normales siguen funcionando (manual y automática)');
  }
  // 2 · Una fila dañada de otro aparato.
  {
    const { d, w } = nuevo();
    d.filas.set(`${U1}|horarioVersiones:rota`, { formato: 1, aparato: 'rota', operaciones: 'dañada' });
    const antes = foto(d);
    const r = await w.crearVersion({ contenido: { a: 1 } });
    ok(r.estado === 'no_aplicada' && r.motivo === 'vista_incompleta' && foto(d) === antes && !d.filas.has(`${U1}|horarioVersiones:propio`),
      '2 · crear con una fila dañada de otro aparato: bloqueado, y no se escribe nada (ni siquiera se crea la fila propia)');
    // Se queda en memoria; cuando la fila deja de estar dañada, el reintento con el mismo opId entra una sola vez.
    d.filas.set(`${U1}|horarioVersiones:rota`, otraFila('rota'));
    const r2 = await w.reintentar(r.opId);
    ok(r2.estado === 'confirmada' && d.todas().flatMap((f) => f.value.operaciones).filter((o) => o.opId === r.opId).length === 1,
      '…queda en memoria y, con el historial ya legible, el reintento entra una sola vez');
  }
  // 3 · Una fila de formato futuro de otro aparato.
  {
    const { d, w } = nuevo();
    d.filas.set(`${U1}|horarioVersiones:futura`, { formato: 2, aparato: 'futura', operaciones: [] });
    const antes = foto(d);
    const r = await w.crearVersion({ contenido: { a: 1 } });
    ok(r.estado === 'no_aplicada' && r.motivo === 'formato_nuevo' && foto(d) === antes, '3 · crear con una fila de formato futuro de otro aparato: bloqueado, sin escribir nada');
  }
  // 4 · Falla la lectura global.
  {
    const { d, w } = nuevo();
    d.fallosLeerTodas.n = 1;
    const antes = foto(d);
    const r = await w.crearVersion({ contenido: { a: 1 } });
    ok(r.estado === 'no_aplicada' && r.motivo === 'sin_conexion' && foto(d) === antes && w.enMemoria().includes(r.opId),
      '4 · crear cuando falla la lectura del historial entero: bloqueado, sin escribir, y en memoria para reintentar');
  }
  // 5 · Ningún bloqueo deja una operación a medias: tampoco en un reintento de algo ya enviado.
  {
    const { d, w } = nuevo();
    d.directivas.push({ modo: 'perder-peticion' });                        // se envía y no llega
    const r = await w.crearVersion({ contenido: { a: 1 } });
    d.filas.set(`${U1}|horarioVersiones:rota`, { formato: 1, aparato: 'rota', operaciones: 'dañada' });
    const antes = foto(d);
    const r2 = await w.reintentar(r.opId);
    ok(r.estado === 'sin_confirmar' && r2.estado === 'sin_confirmar' && r2.motivo === 'vista_incompleta' && foto(d) === antes && w.enMemoria().includes(r.opId),
      '5 · el reintento de algo ya enviado con la vista incompleta: no escribe, sigue «sin confirmar» y en memoria');
    ok(nuncaPierde(d) && d.todas().every((f) => f.key === 'horarioVersiones:rota' || registroValido(f)),
      '…ninguna fila quedó con una operación parcial ni perdió nada');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · ELIMINAR Y RENOMBRAR: SOLO MANUALES, CON CONFIRMACIÓN, SIN REAPARECER
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6 · Eliminar y renombrar ──');
{
  const d = crearDoble(); const a = almacenMemoria(); const w = escritor(d, a);
  const man = await w.crearVersion({ contenido: { m: 1 }, motivo: 'manual', nombre: 'Mía' });
  const auto = await w.crearVersion({ contenido: { a: 1 }, motivo: 'confirmacion' });
  ok((await w.eliminarVersionManual(man.opId)).estado === 'no_aplicada', 'eliminar sin confirmado: no se aplica');
  ok((await w.eliminarVersionManual(auto.opId, { confirmado: true })).motivo === 'version_automatica', 'una automática no se puede eliminar');
  ok((await w.renombrarVersionManual(auto.opId, 'X')).motivo === 'version_automatica', '…ni renombrar');
  const del = await w.eliminarVersionManual(man.opId, { confirmado: true });
  const v1 = vistaFusionadaDeVersiones(d.todas());
  ok(del.estado === 'confirmada' && !v1.visibles.some((v) => v.id === man.opId) && v1.eliminadas.includes(man.opId), 'eliminar una manual con confirmación: desaparece de la vista');
  const opsAntes = d.todas()[0].value.operaciones.length;
  const otra = await w.eliminarVersionManual(man.opId, { confirmado: true });
  ok(otra.estado === 'confirmada' && d.todas()[0].value.operaciones.length === opsAntes, 'eliminarla otra vez no añade una segunda marca');
  ok(d.todas()[0].value.operaciones.some((o) => o.opId === man.opId), 'la versión eliminada SIGUE en el registro (no se destruye nada): la marca solo la oculta');
  // Otro aparato que llevaba días sin conectarse escribe después: la eliminada no reaparece.
  const viejo = escritor(d, almacenMemoria());
  await viejo.crearVersion({ contenido: { tarde: 1 } });
  ok(!vistaFusionadaDeVersiones(d.todas()).visibles.some((v) => v.id === man.opId), 'un aparato que vuelve tras días y escribe no hace reaparecer la eliminada');
  // Renombres: la cadena y el conflicto.
  const m2 = await w.crearVersion({ contenido: {}, nombre: 'A' });
  await w.renombrarVersionManual(m2.opId, 'B'); await w.renombrarVersionManual(m2.opId, 'C');
  ok(vistaFusionadaDeVersiones(d.todas()).visibles.find((v) => v.id === m2.opId).nombre === 'C', 'los renombres se encadenan: vale el último');
  const otroAparato = escritor(d, almacenMemoria());
  await Promise.all([w.renombrarVersionManual(m2.opId, 'D'), otroAparato.renombrarVersionManual(m2.opId, 'E')]);
  const vc = vistaFusionadaDeVersiones(d.todas()).visibles.find((v) => v.id === m2.opId);
  ok(Array.isArray(vc.conflictoDeNombre) && vc.conflictoDeNombre.length === 2, 'dos renombres a la vez del mismo: conflicto con los dos nombres, sin elegir uno');
  // Una marca escrita a mano sobre una automática (no debería existir) se ignora.
  const f = d.todas()[0];
  const marcaMala = { opId: 'marca-mala', n: f.value.secuencia + 1, tipo: 'eliminar', versionId: auto.opId, sesion: 'x' };
  d.filas.set(`${U1}|${f.key}`, { ...f.value, secuencia: marcaMala.n, ultimaOperacion: 'marca-mala', operaciones: [...f.value.operaciones, marcaMala] });
  const vm = vistaFusionadaDeVersiones(d.todas());
  ok(vm.visibles.some((v) => v.id === auto.opId) && vm.marcasIgnoradas.includes('marca-mala'), 'una marca sobre una automática se ignora y la versión sigue');
  ok(nuncaPierde(d), 'ninguna fila perdió operaciones');
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · CONCURRENCIA Y FALLOS AL AZAR (pestañas, aparatos, un clon)
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7 · Concurrencia y fallos al azar ──');
for (const semilla0 of [20261109, 7, 424242]) {
  let semilla = semilla0; const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
  const d = crearDoble();
  const almA = almacenMemoria(); const candA = mutex();
  const actores = { A1: escritor(d, almA, { candado: candA }), A2: escritor(d, almA, { candado: candA }), B: escritor(d, almacenMemoria()) };
  const confirmadas = new Set(); const eliminadasConfirmadas = new Set(); const violaciones = [];
  let pasos = 0, sinConf = 0;
  const comprobar = () => {
    const v = vistaFusionadaDeVersiones(d.todas());
    const todas = new Set(d.todas().flatMap((f) => f.value.operaciones.map((o) => o.opId)));
    for (const id of confirmadas) if (!todas.has(id)) violaciones.push(`falta ${id}`);
    for (const id of eliminadasConfirmadas) if (v.visibles.some((x) => x.id === id)) violaciones.push(`reapareció ${id}`);
    if (v.distintas.length || v.ilegibles.length) violaciones.push('copias distintas o filas ilegibles');
  };
  const paso = async (w) => {
    const v = vistaFusionadaDeVersiones(d.todas()); const manuales = v.visibles.filter((x) => x.motivo === 'manual');
    const f = azar();
    if (f < 0.15) d.directivas.push({ modo: 'perder-respuesta' });
    else if (f < 0.25) d.directivas.push({ modo: 'perder-peticion' });
    else if (f < 0.35) d.directivas.push({ modo: 'retener', espera: espera(Math.floor(azar() * 8)) });
    const x = azar(); let r; let versionId = null;
    if (x < 0.5 || !manuales.length) r = await w.crearVersion({ contenido: { pasos }, motivo: azar() < 0.7 ? 'manual' : 'confirmacion' });
    else if (x < 0.75) { versionId = manuales[Math.floor(azar() * manuales.length)].id; r = await w.eliminarVersionManual(versionId, { confirmado: true }); }
    else r = await w.renombrarVersionManual(manuales[Math.floor(azar() * manuales.length)].id, `n${pasos}`);
    if (r.estado === 'sin_confirmar' && r.opId && azar() < 0.7) r = await w.reintentar(r.opId);
    pasos += 1;
    if (r.estado === 'confirmada') { if (r.opId) confirmadas.add(r.opId); if (versionId) eliminadasConfirmadas.add(versionId); } else sinConf += 1;
    comprobar();
  };
  const bucle = async (w, k) => { for (let i = 0; i < k; i++) { await paso(w); await espera(Math.floor(azar() * 3)); } };
  await Promise.all([bucle(actores.A1, 50), bucle(actores.A2, 50), bucle(actores.B, 50)]);
  const clon = escritor(d, almacenMemoria(almA.copia()));   // como un iPhone restaurado desde la copia de A
  await Promise.all([bucle(actores.A1, 40), bucle(clon, 40), bucle(actores.B, 30)]);
  ok(violaciones.length === 0 && nuncaPierde(d), `semilla ${semilla0}: ${pasos} pasos (${confirmadas.size} confirmadas, ${sinConf} sin confirmar o no aplicadas) sin pérdidas, sobrescrituras ni reapariciones ${violaciones.slice(0, 2).join(' | ')}`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · NADA PENDIENTE EN EL APARATO (MS F16) Y SIN CANDADO NO SE ESCRIBE
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8 · Nada pendiente en el aparato ──');
{
  const d = crearDoble(); const a = almacenMemoria(); const w = escritor(d, a);
  await w.crearVersion({ contenido: { secreto: 'contenido' } });
  d.directivas.push({ modo: 'perder-peticion' }); await w.crearVersion({ contenido: { pendiente: 1 } });
  ok(a.claves().every((k) => CLAVES_LOCALES_HISTORIAL.includes(k)), `en el aparato solo hay ${CLAVES_LOCALES_HISTORIAL.join(', ')}`);
  ok(!JSON.stringify(a.copia()).includes('contenido') && !JSON.stringify(a.copia()).includes('"tipo"'), '…y ninguna versión ni operación, tampoco la que quedó sin confirmar');
  const sinCandado = crearEscritorDeVersiones({ transporte: d.transporte(U1), usuario: U1, almacen: almacenMemoria(), candado: null });
  const r = await sinCandado.crearVersion({ contenido: {} });
  ok(r.estado === 'no_aplicada' && r.motivo === 'sin_candado', 'sin candado entre pestañas (navigator.locks) no se escribe, y se dice por qué');
  ok(candadoDelNavegador() === null, 'en Node no hay navigator.locks: candadoDelNavegador devuelve null');
  const alm = almacenDelNavegador('prueba:');
  let lanza = false; try { alm.escribir('pendiente', 'x'); } catch { lanza = true; }
  ok(lanza, 'almacenDelNavegador se niega a guardar una clave que no sea aparato, confirmada o sesiones');
  alm.escribir('aparato', 'id-1');
  ok(alm.leer('aparato') === 'id-1', '…y sin localStorage (Node) recuerda en memoria: el peor caso es un id nuevo');
  const fuente = readFileSync(join(RAIZ, 'src/lib/historialVersiones.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok(!/indexedDB|sessionStorage/.test(fuente), 'historialVersiones.js no usa IndexedDB ni sessionStorage');
  ok((fuente.match(/localStorage/g) || []).length > 0 && !/localStorage\.setItem\((?!prefijo \+ k)/.test(fuente), '…y solo escribe en localStorage dentro de almacenDelNavegador (prefijo + clave permitida)');
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · NADIE ESCRIBE EL HISTORIAL POR OTRO CAMINO
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9 · Nadie escribe el historial por otro camino ──');
{
  const archivos = [];
  const recorrer = (dir) => { for (const e of readdirSync(dir)) { const p = join(dir, e); if (statSync(p).isDirectory()) recorrer(p); else if (/\.(jsx?|mjs)$/.test(e)) archivos.push(p); } };
  recorrer(join(RAIZ, 'src'));
  /* Lo que importa es quién lo ESCRIBE. Nombrarlo en un catálogo (`estadosAsincronos.js`, MAPA_ASINCRONO) no es escribirlo. */
  /* Las llamadas se buscan en el CÓDIGO (sin comentarios ni textos): un catálogo puede citar `saveData(` en una frase. */
  const soloCodigo = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/`(?:\\.|[^`\\])*`/g, '``').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  const escriben = archivos.filter((p) => {
    const src = readFileSync(p, 'utf8');
    return /horarioVersiones/.test(src) && /saveData\(|\.upsert\(|\.update\(|\.insert\(|from\(''\)/.test(soloCodigo(src));
  }).map((p) => relative(RAIZ, p));
  ok(escriben.length === 1 && escriben[0] === 'src/lib/supabase.js', `solo supabase.js nombra el historial Y escribe en app_data (${escriben.join(', ')})`);
  const conSaveData = archivos.filter((p) => /saveData\([^)]*horarioVersiones/.test(readFileSync(p, 'utf8'))).map((p) => relative(RAIZ, p));
  ok(conSaveData.length === 0, 'ningún archivo llama a saveData con una clave del historial');
  const sup = readFileSync(join(RAIZ, 'src/lib/supabase.js'), 'utf8');
  const upserts = [...sup.matchAll(/\.upsert\(/g)].length;
  ok(upserts === 1 && /if \(esClaveDeHistorialVersiones\(key\)\) \{[\s\S]{0,200}return \{ ok: false, error: ERROR_CLAVE_PROTEGIDA/.test(sup),
    'el único upsert de supabase.js es el de saveData, y el rechazo va antes de él');
  const inicio = sup.indexOf('export async function saveData'); const rechazo = sup.indexOf('esClaveDeHistorialVersiones(key)', inicio); const cola = sup.indexOf('antesDeGuardar(key', inicio);
  ok(rechazo > inicio && rechazo < cola, '…y antes de entrar en la cola');
}

console.log(`\n${n - fallos}/${n} comprobaciones correctas`);
process.exit(fallos ? 1 : 0);
