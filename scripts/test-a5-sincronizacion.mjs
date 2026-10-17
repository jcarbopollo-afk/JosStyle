// scripts/test-a5-sincronizacion.mjs — A5: guardados que no pierden el último cambio, con el saveData REAL.
//
// 🐛 La auditoría de A1–A4 reprodujo `A,B,B,C,B`: un reintento (al volver la conexión o con «Guardar ahora»)
// salía con el valor de cuando se programó DETRÁS de un cambio más nuevo y lo pisaba; la cuenta acababa en B,
// la pantalla en C y el indicador en «Guardado». Y la revisión de A5 encontró la variante siguiente (un
// reintento en cola que hacía saltarse la corrección de una escritura vieja, y luego se omitía). Esta suite
// lo prueba con:
//   · relojes FALSOS para los dos topes (`TOPE_ESPERA_ANTERIOR_MS` y `TOPE_PETICION_MS`): se disparan a mano,
//     así que el orden es exacto y no se espera ni un segundo de verdad;
//   · un servidor falso donde APLICAR y RESPONDER son dos cosas (una petición puede aplicarse sin que llegue
//     su respuesta, responder con un error de red después de aplicarse, o responder cuando el cliente ya la
//     dio por vencida);
//   · los escenarios con nombre que pide la fase y los que encontró la revisión, y
//   · un EXPLORADOR de calendarios aleatorios (con semilla, reproducible) que comprueba, EN CADA PASO, que si
//     no hay nada en vuelo ni pendiente la cuenta tiene el último valor pedido (nunca «Guardado» con la cuenta
//     vieja), y AL FINAL, con conexión, que todo converge. La limitación declarada (una petición que el
//     servidor aplica y cuya respuesta NO llega nunca) se mide aparte: eso solo lo cierra el servidor.
//
// `A5_SRC=<dir>` carga los módulos de otra carpeta: así se demuestra que la suite FALLA con versiones
// defectuosas (la de antes de A4, en git, y copias de trabajo que no están versionadas).
import { register } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = process.env.A5_SRC || join(RAIZ, 'src');

register('data:text/javascript,' + encodeURIComponent(`export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (url.endsWith('/lib/supabase.js')) {
    const src = String(r.source).replace(/import\\.meta\\.env/g, "({ VITE_SUPABASE_URL: 'http://127.0.0.1:9', VITE_SUPABASE_ANON_KEY: 'prueba' })");
    return { ...r, source: src, shortCircuit: true };
  }
  return r;
}`));

/* ── Relojes: los topes de la cola y de la petición son FALSOS (se disparan a mano); el resto, de verdad. */
const Y = await import(pathToFileURL(join(SRC, 'lib/sincronizacion.js')).href);
const TOPE_COLA = Y.TOPE_ESPERA_ANTERIOR_MS;
const TOPE_PETICION = Y.TOPE_PETICION_MS ?? null; // la versión de antes de A5 no lo tiene
const setTimeoutReal = globalThis.setTimeout;
const clearTimeoutReal = globalThis.clearTimeout;
let relojes = [];
let idReloj = 1;
globalThis.setTimeout = (fn, ms, ...a) => {
  if (ms === TOPE_COLA || (TOPE_PETICION && ms === TOPE_PETICION)) {
    const r = { id: `falso-${idReloj++}`, fn, ms, a };
    relojes.push(r);
    return r.id;
  }
  return setTimeoutReal(fn, ms, ...a);
};
globalThis.clearTimeout = (id) => {
  if (typeof id === 'string' && id.startsWith('falso-')) { relojes = relojes.filter((r) => r.id !== id); return; }
  return clearTimeoutReal(id);
};
const asentar = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)); };

const S = await import(pathToFileURL(join(SRC, 'lib/supabase.js')).href);

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

/* ── El servidor: una fila por clave. Cada petición se puede APLICAR y RESPONDER por separado. La respuesta
   tiene la forma de postgrest-js: `{ error, status }`, con el estado HTTP FUERA del error. */
const servidor = new Map();
let peticiones = [];
let llamadasThen = 0;
const errorOriginal = console.error;
console.error = () => {};
const RESPUESTAS = {
  ok: { error: null, status: 201 },
  e500: { error: { code: 'XX000', message: 'error del servidor' }, status: 500 },
  red: { error: { message: 'Failed to fetch' } },
  e504: { error: { message: 'Gateway Timeout' }, status: 504 },
  e502cf: { error: { message: 'error code: 502' }, status: 502 }, // la forma real: un cuerpo que no es JSON
  e520cf: { error: { message: 'error code: 520' }, status: 520 },
  e524cf: { error: { message: 'error code: 524' }, status: 524 },
  e500sinCodigo: { error: { message: 'Internal Server Error' }, status: 500 }, // un proxy, no PostgREST
  e57014: { error: { code: '57014', message: 'canceling statement due to statement timeout' }, status: 500 }, // la base de datos: deshecha
};
S.supabase.from = () => ({
  upsert: (fila) => {
    let responder;
    const promesa = new Promise((r) => { responder = r; });
    const p = { clave: fila.key, valor: fila.value, aplicada: false, respondida: false, vencida: false };
    p.aplicar = () => { if (!p.aplicada) { p.aplicada = true; servidor.set(fila.key, fila.value); } };
    p.responder = (modo = 'ok') => {
      if (p.respondida) return;
      /* Un 500 de la base de datos es una transacción deshecha: no puede contestarlo una petición ya APLICADA. */
      if (modo === 'e500' && p.aplicada) throw new Error('modelo imposible: un 500 de una petición ya aplicada');
      p.respondida = true; responder(RESPUESTAS[modo]);
    };
    peticiones.push(p);
    /* Como postgrest-js: un «thenable» que lanzaría la petición en CADA `then` (se cuenta). */
    return { then: (a, b) => { llamadasThen += 1; return promesa.then(a, b); } };
  },
});
const de = (k) => peticiones.filter((p) => p.clave === k);
const resumen = () => Y.resumenSincronizacion();
const nuevaRonda = (u = 'u1') => { servidor.clear(); peticiones = []; relojes = []; llamadasThen = 0; Y.empezarSesionDeDatos(u); };
const okYaplica = (p) => { p.aplicar(); p.responder('ok'); };
/** Dispara los topes de un tipo. Al vencer el de la petición, las que no han contestado quedan «vencidas»:
 *  el cliente ya no las espera, pero pueden aplicarse y contestar más tarde. */
const dispararTopes = (ms) => {
  if (ms === TOPE_PETICION) peticiones.filter((p) => !p.respondida).forEach((p) => { p.vencida = true; });
  const toca = relojes.filter((r) => r.ms === ms);
  relojes = relojes.filter((r) => r.ms !== ms);
  toca.forEach((r) => r.fn(...r.a));
  return toca.length;
};
/** Con conexión: responde bien a todo lo que vuele, dispara los topes de la cola, y repite hasta que no quede
 *  nada en vuelo. `soloVivas`: las vencidas que el explorador decidió que no contestan se dejan como están. */
const drenar = async ({ saltar = () => false } = {}) => {
  for (let i = 0; i < 80; i++) {
    await asentar();
    const vivas = peticiones.filter((p) => !p.respondida && !saltar(p));
    vivas.forEach(okYaplica);
    if (!vivas.length && !dispararTopes(TOPE_COLA) && resumen().guardando === 0) { await asentar(); if (resumen().guardando === 0 && !peticiones.some((p) => !p.respondida && !saltar(p))) return true; }
  }
  return false;
};
const conTiempo = (pr, ms = 300) => Promise.race([pr, new Promise((x) => setTimeoutReal(() => x('NO_RESUELVE'), ms))]);

/* ───────────────────────────────────────────────────────────────────────────
   1 · EL CASO DE LA AUDITORÍA: A,B,B,C,B
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 1 · A,B,B,C,B: el reintento ya no pisa el cambio más nuevo ──');
{
  nuevaRonda();
  const gA = S.saveData('u1', 'k', 'A');
  const gB = S.saveData('u1', 'k', 'B');
  await asentar();
  dispararTopes(TOPE_COLA); await asentar(); // B sale con A colgada
  ok(de('k').length === 2, '1 — A colgada, B sale por el tope de la cola');
  okYaplica(de('k')[1]); await gB;
  okYaplica(de('k')[0]); await gA; // A se aplica DESPUÉS de B: la cuenta en A
  await asentar();
  ok(resumen().pendientes.includes('k'), '1 — la vieja tardía deja la clave PENDIENTE (no se calla)');
  const gC = S.saveData('u1', 'k', 'C'); // él cambia algo: C
  await asentar();
  const reintento = S.reintentarGuardados(); // vuelve la conexión o pulsa «Guardar ahora»
  const fin = await drenar();
  await gC; await reintento;
  const valores = de('k').map((p) => p.valor);
  ok(fin && servidor.get('k') === 'C', `🚨 1 — la cuenta acaba en C, lo que enseña la pantalla (peticiones [${valores}])`);
  ok(resumen().pendientes.length === 0 && resumen().guardando === 0, '1 — sin pendientes ni nada en vuelo: «Guardado» es verdad');
  ok(!valores.includes('B', valores.indexOf('C')), '🚨 1 — ningún B sale después de C');
}

/* ───────────────────────────────────────────────────────────────────────────
   2 · [A,B,C] CON RESPUESTAS FUERA DE ORDEN (todas las permutaciones)
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 2 · [A,B,C]: respuestas en cualquier orden ──');
{
  const permutaciones = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutaciones([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r])));
  let malas = 0; let total = 0;
  for (const orden of permutaciones([0, 1, 2])) {
    for (const modoViejo of ['ok', 'red', 'e504', 'e502cf', 'e500']) {
      nuevaRonda(); total += 1;
      const gs = ['A', 'B', 'C'].map((v) => S.saveData('u1', 'k', v));
      for (let i = 0; i < 4; i++) { await asentar(); dispararTopes(TOPE_COLA); }
      await asentar();
      for (const i of orden) {
        const p = de('k')[i];
        if (!p) continue;
        if (i < 2 && modoViejo !== 'ok') { if (modoViejo !== 'e500') p.aplicar(); p.responder(modoViejo); } else okYaplica(p);
        await asentar();
      }
      await drenar();
      if (resumen().pendientes.length) { S.reintentarGuardados(); await drenar(); }
      await Promise.all(gs);
      if (servidor.get('k') !== 'C' || resumen().pendientes.length) malas += 1;
    }
  }
  ok(malas === 0, `🚨 2 — ${total} calendarios (6 órdenes × 5 formas de terminar las viejas, incluido el 502 real de una pasarela): la cuenta acaba en C sin pendientes (${malas} mal)`);
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · [A,B,C,B] CON REINTENTO, Y REINTENTOS MANUALES CON LA COLA LLENA
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 3 · [A,B,C,B] y reintentos con escrituras en cola ──');
{
  nuevaRonda();
  const gs = ['A', 'B', 'C', 'B2'].map((v) => S.saveData('u1', 'k', v));
  await asentar(); dispararTopes(TOPE_COLA); await asentar(); // B sale
  okYaplica(de('k')[1]); await asentar(); // B ok → C sale
  okYaplica(de('k')[0]); await asentar(); // A tardía
  const r1 = S.reintentarGuardados(); const r2 = S.reintentarGuardados(); const r3 = S.reintentarGuardados();
  ok(r2 === r3, '3 — pedir reintentar varias veces mientras hay uno en marcha deja UNO encadenado detrás, no varios');
  await drenar(); await Promise.all(gs); await r1; await r2;
  ok(servidor.get('k') === 'B2' && resumen().pendientes.length === 0, `🚨 3 — [A,B,C,B2] con reintentos en medio: la cuenta acaba en el último (B2) (peticiones [${de('k').map((p) => p.valor)}])`);
  ok(de('k').length <= 6, `3 — sin escrituras de más (${de('k').length} peticiones para 4 guardados y una vieja tardía)`);

  nuevaRonda();
  const g1 = S.saveData('u1', 'j', 'v1'); await asentar();
  de('j')[0].responder('red'); await g1; // v1 sin red: pendiente
  const g2 = S.saveData('u1', 'j', 'v2'); await asentar(); // v2 en vuelo
  const r = S.reintentarGuardados(); // reintento manual con v2 volando
  await asentar();
  okYaplica(de('j')[1]); await g2;
  await drenar(); await r;
  ok(servidor.get('j') === 'v2' && resumen().pendientes.length === 0, `🚨 3 (A4-2) — reintento con un cambio más nuevo en vuelo: la cuenta acaba en v2 (peticiones [${de('j').map((p) => p.valor)}])`);
  ok(de('j').filter((p) => p.valor === 'v1').length === 1, '3 (A4-2) — el v1 viejo no vuelve a salir');

  /* Un reintento en marcha no se traga lo que queda pendiente mientras tanto (SYNC-4). */
  nuevaRonda();
  const fi = S.saveData('u1', 'i', 'I1'); await asentar(); de('i')[0].responder('e500'); await fi;
  const ra = S.reintentarGuardados(); await asentar(); // su petición tarda
  const fj = S.saveData('u1', 'j', 'J1'); await asentar(); de('j')[0].responder('e500'); await fj; // j queda pendiente
  const rb = S.reintentarGuardados(); // «online» con el de i aún en marcha
  await drenar(); await ra; await rb; await drenar();
  ok(servidor.get('i') === 'I1' && servidor.get('j') === 'J1' && resumen().pendientes.length === 0,
    `🚨 3 (SYNC-4) — lo que quedó pendiente durante un reintento también se reintenta (i=${servidor.get('i')}, j=${servidor.get('j')})`);
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · REINTENTOS AL VOLVER LA CONEXIÓN (evento online, el de verdad)
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 4 · al volver la conexión ──');
{
  nuevaRonda();
  const eventos = {};
  const antes = globalThis.window;
  globalThis.window = { addEventListener: (ev, fn) => { eventos[ev] = fn; }, removeEventListener: () => {} };
  const soltar = S.vigilarLaConexion();
  ok(typeof eventos.online === 'function', '4 — `vigilarLaConexion` escucha «online» (sin respaldo: si no, el reintento automático no existe)');
  const g1 = S.saveData('u1', 'k', 'x1'); await asentar();
  de('k')[0].responder('red'); await g1;
  const g2 = S.saveData('u1', 'k', 'x2'); await asentar(); // x2 en vuelo
  if (typeof eventos.online === 'function') eventos.online();
  await asentar();
  okYaplica(de('k')[1]); await g2;
  await drenar();
  ok(servidor.get('k') === 'x2' && resumen().pendientes.length === 0, `🚨 4 — «online» con un cambio en vuelo: la cuenta acaba en x2 (peticiones [${de('k').map((p) => p.valor)}])`);
  if (typeof soltar === 'function') soltar();
  globalThis.window = antes;
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · ERRORES DE RED, PASARELAS Y RESPUESTAS TARDÍAS
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 5 · errores de red, pasarelas y respuestas tardías ──');
{
  for (const [modo, nombre] of [['e504', '504'], ['e502cf', '502 con el cuerpo «error code: 502» (la forma real de postgrest-js)']]) {
    nuevaRonda();
    const gA = S.saveData('u1', 'k', 'A'); const gB = S.saveData('u1', 'k', 'B');
    await asentar(); dispararTopes(TOPE_COLA); await asentar();
    okYaplica(de('k')[1]); await gB;
    de('k')[0].aplicar(); de('k')[0].responder(modo); await gA;
    await drenar();
    ok(servidor.get('k') === 'B' && resumen().pendientes.length === 0, `🚨 5 (A4-3) — una vieja que responde ${nombre} tras aplicarse se corrige: la cuenta acaba en B (peticiones [${de('k').map((p) => p.valor)}])`);
  }
  /* Un 500 de la base de datos (con su código) no se aplicó: no hay nada que reescribir. */
  nuevaRonda();
  const hA = S.saveData('u1', 'k', 'A'); const hB = S.saveData('u1', 'k', 'B');
  await asentar(); dispararTopes(TOPE_COLA); await asentar();
  okYaplica(de('k')[1]); await hB;
  de('k')[0].responder('e500'); await hA; await drenar();
  ok(servidor.get('k') === 'B' && de('k').length === 2 && resumen().pendientes.length === 0, '5 — una vieja que la base de datos rechaza (500) no provoca reescrituras');
  /* La nueva falla sin red: queda pendiente con su valor y el reintento la manda. */
  nuevaRonda();
  const i1 = S.saveData('u1', 'k', 'v1'); await asentar(); okYaplica(de('k')[0]); await i1;
  const i2 = S.saveData('u1', 'k', 'v2'); await asentar(); de('k')[1].responder('red'); await i2;
  ok(resumen().pendientes.includes('k'), '5 — sin red: v2 queda pendiente (el indicador no dice «Guardado»)');
  const rr = S.reintentarGuardados(); await drenar();
  ok(await rr === true && servidor.get('k') === 'v2' && resumen().pendientes.length === 0, '5 — al reintentar llega v2 y deja de estar pendiente');
  /* Cada guardado es UNA petición: el constructor de postgrest-js lanzaría otra en cada `then`. */
  nuevaRonda();
  const una = S.saveData('u1', 'k', 'uno'); await asentar(); okYaplica(de('k')[0]); await una;
  ok(llamadasThen === 1, `🚨 5 — un guardado llama UNA vez a la petición (${llamadasThen}): escucharla dos veces no la duplica`);
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · UNA PETICIÓN QUE NO CONTESTA, O QUE CONTESTA TARDE (A4-5 y SYNC-3)
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 6 · una petición que no contesta, o que contesta tarde ──');
{
  nuevaRonda();
  ok(TOPE_PETICION !== null && TOPE_PETICION > TOPE_COLA, '6 — hay un tope por petición, mayor que el de la cola');
  const g = S.saveData('u1', 'k', 'lenta');
  await asentar();
  ok(resumen().guardando === 1, '6 — mientras no contesta, «guardando»');
  dispararTopes(TOPE_PETICION); await asentar();
  const r = await conTiempo(g);
  ok(r !== 'NO_RESUELVE' && r.ok === false, '🚨 6 — al tope, la promesa de saveData termina (no se queda colgada para siempre)');
  ok(resumen().guardando === 0 && resumen().pendientes.includes('k'), '6 — deja de decir «Guardando…» y queda PENDIENTE (no se sabe si llegó): nunca «Guardado»');
  /* SYNC-3: no se aborta; una subida lenta que sigue bien acaba llegando, y entonces deja de estar pendiente. */
  okYaplica(de('k')[0]); await asentar();
  ok(servidor.get('k') === 'lenta' && resumen().pendientes.length === 0 && de('k').length === 1,
    '🚨 6 (SYNC-3) — la petición vencida NO se aborta: si llega tarde, se apunta y deja de estar pendiente (sin reenviarla)');

  /* La vencida contesta tarde DESPUÉS de que salga otra más nueva: pudo pisarla, y se corrige. */
  nuevaRonda();
  const vA = S.saveData('u1', 'k', 'A'); await asentar();
  dispararTopes(TOPE_PETICION); await vA; // A vencida
  const vB = S.saveData('u1', 'k', 'B'); await asentar(); okYaplica(de('k')[1]); await vB;
  okYaplica(de('k')[0]); await asentar(); // A se aplica y contesta ahora, detrás de B
  await drenar();
  ok(servidor.get('k') === 'B' && resumen().pendientes.length === 0, `🚨 6 — una vencida que se aplica y contesta después de la nueva se corrige: la cuenta acaba en B (peticiones [${de('k').map((p) => p.valor)}])`);

  /* Un reintento colgado no bloquea los siguientes (se libera al tope) ni pasa a otra sesión. */
  nuevaRonda();
  const f = S.saveData('u1', 'k', 'v'); await asentar(); de('k')[0].responder('red'); await f;
  const ret1 = S.reintentarGuardados(); await asentar(); // su petición se cuelga
  Y.empezarSesionDeDatos('u2');
  const ret2 = S.reintentarGuardados();
  ok(ret1 !== ret2, '🚨 6 — otra sesión no hereda el reintento colgado de la anterior');
  dispararTopes(TOPE_PETICION); await asentar();
  ok(await conTiempo(ret1) !== 'NO_RESUELVE', '6 — y el reintento colgado termina al tope de su petición');
}

/* ───────────────────────────────────────────────────────────────────────────
   7 · VARIAS CLAVES INDEPENDIENTES
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 7 · varias claves ──');
{
  nuevaRonda();
  const gs = [S.saveData('u1', 'x', 'X1'), S.saveData('u1', 'y', 'Y1'), S.saveData('u1', 'x', 'X2')];
  await asentar(); dispararTopes(TOPE_COLA); await asentar();
  okYaplica(de('x')[1]); await asentar();
  de('y')[0].responder('red'); await asentar(); // y queda pendiente
  okYaplica(de('x')[0]); await asentar(); // x vieja tardía
  const gx3 = S.saveData('u1', 'x', 'X3');
  const r = S.reintentarGuardados();
  await drenar(); await Promise.all([...gs, gx3]); await r;
  ok(servidor.get('x') === 'X3' && servidor.get('y') === 'Y1' && resumen().pendientes.length === 0,
    `7 — cada clave acaba en su último valor (x=${servidor.get('x')}, y=${servidor.get('y')}) y lo de una no toca la otra`);
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · CAMBIO DE SESIÓN CON ESCRITURAS PENDIENTES (A4-4)
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 8 · cambio de sesión ──');
{
  nuevaRonda('u1');
  const gA = S.saveData('u1', 'k', 'A'); const gB = S.saveData('u1', 'k', 'B');
  await asentar(); dispararTopes(TOPE_COLA); await asentar();
  okYaplica(de('k')[0]); await gA; // A ok con B volando
  const gViejo = S.saveData('u1', 'k', 'VIEJO-EN-COLA'); // en cola detrás de B
  await asentar();
  Y.empezarSesionDeDatos('u1'); // sale y vuelve a entrar con la misma cuenta
  const gZ = S.saveData('u1', 'k', 'Z'); await asentar();
  okYaplica(de('k').find((p) => p.valor === 'Z'));
  okYaplica(de('k')[1]); await gB; // B, que ya volaba de la sesión anterior, se aplica DESPUÉS de Z
  await drenar();
  const rv = await gViejo;
  await gZ;
  ok(!de('k').some((p) => p.valor === 'VIEJO-EN-COLA'), `🚨 8 (A4-4) — lo que esperaba en la cola de la sesión anterior ya no sale (peticiones [${de('k').map((p) => p.valor)}])`);
  ok(rv && rv.ok === false, '8 — y su saveData lo dice (no es un «guardado»)');
  ok(servidor.get('k') === 'Z' && resumen().pendientes.length === 0,
    `🚨 8 (A4-4) — B, de la sesión anterior y aplicada DESPUÉS de Z, se corrige: la cuenta acaba en Z (peticiones [${de('k').map((p) => p.valor)}])`);
  /* Con OTRO usuario no se reescribe nada suyo en la cuenta nueva (la RLS ya para lo de la anterior). */
  nuevaRonda('u1');
  const oA = S.saveData('u1', 'k', 'DE-U1'); await asentar();
  Y.empezarSesionDeDatos('u2');
  const oZ = S.saveData('u2', 'k', 'DE-U2'); await asentar();
  okYaplica(de('k').find((p) => p.valor === 'DE-U2')); await oZ;
  okYaplica(de('k')[0]); await oA; await drenar();
  ok(de('k').length === 2 && Y.pendientesParaReintentar().length === 0, '8 — con otro usuario, lo de la sesión anterior no provoca reescrituras en la nueva');
}

/* ───────────────────────────────────────────────────────────────────────────
   9 · LOS QUE ENCONTRÓ LA REVISIÓN DE A5: un reintento en cola no puede hacer que se salte la corrección
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 9 · un reintento en cola y una vieja tardía (revisión de A5) ──');
{
  /* Misma sesión: P falla; A se cuelga; B sale por el tope; reintento en cola; el servidor aplica B y luego A;
     A contesta antes que B. Antes: la cuenta en A, sin pendiente y «Guardado». */
  nuevaRonda();
  const gP = S.saveData('u1', 'k', 'P'); await asentar(); de('k')[0].responder('red'); await gP;
  const gA = S.saveData('u1', 'k', 'A'); await asentar();
  const gB = S.saveData('u1', 'k', 'B'); await asentar(); dispararTopes(TOPE_COLA); await asentar();
  const r = S.reintentarGuardados(); await asentar();
  const [, pA, pB] = de('k');
  pB.aplicar(); pA.aplicar(); pA.responder('ok'); await gA; await asentar();
  ok(resumen().pendientes.includes('k'), '9 — con la vieja aplicada detrás, la clave sigue PENDIENTE aunque haya un reintento en cola');
  pB.responder('ok'); await gB;
  await drenar(); await r;
  ok(servidor.get('k') === 'B' && resumen().pendientes.length === 0, `🚨 9 — la cuenta acaba en B, lo de la pantalla (peticiones [${de('k').map((p) => p.valor)}])`);

  /* Sesión anterior del mismo usuario: B-vieja vuela; sale y entra; P falla; Z sale; reintento; Z aplicada y
     luego B-vieja; B-vieja contesta antes que Z. */
  nuevaRonda();
  const gBv = S.saveData('u1', 'k', 'B-vieja'); await asentar();
  Y.empezarSesionDeDatos('u1');
  const gP2 = S.saveData('u1', 'k', 'P'); await asentar(); de('k')[1].responder('red'); await gP2;
  const gZ = S.saveData('u1', 'k', 'Z'); await asentar();
  const r2 = S.reintentarGuardados(); await asentar();
  const pBv = de('k')[0]; const pZ = de('k')[2];
  pZ.aplicar(); pBv.aplicar(); pBv.responder('ok'); await gBv; await asentar();
  pZ.responder('ok'); await gZ;
  await drenar(); await r2;
  ok(servidor.get('k') === 'Z' && resumen().pendientes.length === 0, `🚨 9 — tras salir y entrar: la cuenta acaba en Z (peticiones [${de('k').map((p) => p.valor)}])`);
}

/* ───────────────────────────────────────────────────────────────────────────
   10b · LO QUE ENCONTRÓ LA AUDITORÍA FINAL DE A5
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 10b · auditoría final de A5 ──');
{
  /* 520/524 de Cloudflare y un 500 sin código: pudo aplicarse detrás → se corrige. Un 500 con SQLSTATE no. */
  for (const [modo, nombre, corrige] of [['e520cf', '520 de Cloudflare', true], ['e524cf', '524 de Cloudflare', true], ['e500sinCodigo', '500 sin código de PostgREST', true], ['e57014', '500 con SQLSTATE 57014 (deshecha)', false]]) {
    nuevaRonda();
    const gA = S.saveData('u1', 'k', 'A'); const gB = S.saveData('u1', 'k', 'B');
    await asentar(); dispararTopes(TOPE_COLA); await asentar();
    okYaplica(de('k')[1]); await gB;
    if (corrige) de('k')[0].aplicar();
    de('k')[0].responder(modo); await gA; await drenar();
    ok(servidor.get('k') === 'B' && resumen().pendientes.length === 0 && de('k').length === (corrige ? 3 : 2),
      `🚨 10b — una vieja que contesta ${nombre}${corrige ? ' tras aplicarse se corrige' : ' no provoca reescritura'}: la cuenta en B (peticiones [${de('k').map((p) => p.valor)}])`);
  }

  /* Latencia sostenida de más de 10 s, todas con el mismo valor: ya no se encadenan reescrituras sin fin. Cada
     petición tarda 15 s: aquí se modela haciendo vencer el tope de la cola antes de cada respuesta. */
  nuevaRonda();
  S.saveData('u1', 'k', 'A');
  const gB = S.saveData('u1', 'k', 'B');
  for (let ciclo = 0; ciclo < 12; ciclo++) {
    await asentar(); dispararTopes(TOPE_COLA); await asentar(); // la siguiente sale con la anterior volando
    const vivas = peticiones.filter((p) => !p.respondida);
    if (vivas.length) okYaplica(vivas[0]); // la más vieja contesta (tarde)
    await asentar();
  }
  await drenar(); await gB;
  ok(servidor.get('k') === 'B' && resumen().pendientes.length === 0 && de('k').length <= 4,
    `🚨 10b — con latencia sostenida de más de 10 s converge sin bucle: ${de('k').length} peticiones (antes, sin fin), la cuenta en B y nada pendiente`);

  /* Una vencida viva no deja decir «Guardado»: k1 vence, k2 llega bien → sigue «sin guardar» hasta que k1 conteste. */
  nuevaRonda();
  const v1 = S.saveData('u1', 'k', 'k1'); await asentar();
  dispararTopes(TOPE_PETICION); await v1;
  const v2 = S.saveData('u1', 'k', 'k2'); await asentar(); okYaplica(de('k')[1]); await v2; await asentar();
  ok(resumen().pendientes.includes('k'), '🚨 10b — k2 llegó bien, pero con k1 vencida y viva la clave sigue «sin guardar» (k1 aún puede aplicarse)');
  okYaplica(de('k')[0]); await asentar(); await drenar(); // k1 se aplica y contesta: se corrige con k2
  ok(servidor.get('k') === 'k2' && resumen().pendientes.length === 0, `10b — al contestar k1 se corrige y deja de estar pendiente (peticiones [${de('k').map((p) => p.valor)}])`);
  nuevaRonda();
  const w1 = S.saveData('u1', 'k', 'k1'); await asentar();
  dispararTopes(TOPE_PETICION); await w1;
  const w2 = S.saveData('u1', 'k', 'k2'); await asentar(); okYaplica(de('k')[1]); await w2; await asentar();
  de('k')[0].responder('e57014'); await asentar(); await drenar(); // k1 NO se aplicó
  ok(servidor.get('k') === 'k2' && resumen().pendientes.length === 0 && de('k').length === 2, '10b — si la vencida resulta no aplicada (500 con SQLSTATE), la clave deja de estar pendiente sin reescribir');
}

/* ───────────────────────────────────────────────────────────────────────────
   10 · EL EXPLORADOR: calendarios aleatorios (con semilla) en busca de una pérdida silenciosa
   ─────────────────────────────────────────────────────────────────────────── */
console.log('\n── 10 · explorador de calendarios ──');
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ESCALA = Math.max(1, Number(process.env.A5_ESCALA) || 1); // A5_ESCALA=10: diez veces más calendarios
async function explorar({ semillas: base, claves, mudas, sesiones = false }) {
  const semillas = base * ESCALA;
  const silenciosas = []; const intermedias = []; let maxPeticiones = 0; let colgadas = 0; let sinConverger = 0; let limitacion = 0;
  for (let s = 1; s <= semillas; s++) {
    const azar = mulberry32(s * 7919 + claves.length * 31 + (mudas ? 1 : 0) + (sesiones ? 7 : 0));
    nuevaRonda();
    let deseado = {}; let cuenta = 0; const promesas = [];
    const mudasAplicadas = new Set(); // vencidas que el servidor aplica y que NO contestan nunca (la limitación)
    const saltar = (p) => mudasAplicadas.has(p);
    const traza = []; // lo que pasó, para reproducir un fallo
    const nom = (p) => `${p.valor}`;
    for (let paso = 0; paso < 16; paso++) {
      const r = azar();
      const vivas = peticiones.filter((p) => !p.respondida && !saltar(p));
      if (r < 0.3) {
        const k = claves[Math.floor(azar() * claves.length)];
        const v = `${k}${++cuenta}`;
        deseado[k] = v;
        traza.push(`guardar ${v}`);
        promesas.push(S.saveData('u1', k, v));
      } else if (r < 0.7 && vivas.length) {
        const p = vivas[Math.floor(azar() * vivas.length)];
        const m = azar();
        if (p.vencida && mudas && m < 0.3) { p.aplicar(); mudasAplicadas.add(p); traza.push(`${nom(p)} aplicada sin respuesta`); }
        else if (m < 0.5) { okYaplica(p); traza.push(`${nom(p)} ok`); }
        else if (m < 0.62 && !p.aplicada) { p.responder('e500'); traza.push(`${nom(p)} 500`); }
        else if (m < 0.62) { p.responder('ok'); traza.push(`${nom(p)} ok (ya aplicada)`); }
        else if (m < 0.74) { p.responder('red'); traza.push(`${nom(p)} red`); }
        else if (m < 0.84) { p.aplicar(); p.responder('red'); traza.push(`${nom(p)} aplicada+red`); }
        else if (m < 0.92) { p.aplicar(); p.responder('e502cf'); traza.push(`${nom(p)} aplicada+502`); }
        else { p.aplicar(); traza.push(`${nom(p)} aplicada`); } // contestará más tarde (o al drenar)
      } else if (r < 0.8) { dispararTopes(TOPE_COLA); traza.push('tope cola'); }
      else if (r < 0.87 && TOPE_PETICION) { dispararTopes(TOPE_PETICION); traza.push('tope petición'); }
      else if (r < 0.9 && sesiones) { Y.empezarSesionDeDatos('u1'); deseado = {}; traza.push('sale y entra'); } // la pantalla se recarga de la cuenta
      else { promesas.push(S.reintentarGuardados()); traza.push('reintentar'); }
      await asentar();
      /* EN CADA PASO: nada en vuelo ni pendiente ⇒ la cuenta tiene el último valor pedido (si no, el indicador
         diría «Guardado» con la cuenta vieja). Las vencidas que el cliente ya no escucha no cuentan como «en vuelo». */
      /* Sin excepciones (auditoría final de A5): ni siquiera con peticiones vencidas vivas o mudas, porque una
         vencida viva deja su clave «sin guardar». Y sin `servidor.has`: una clave que no llegó nunca, con nada
         pendiente, también sería un «Guardado» falso. */
      const sinNada = resumen().guardando === 0 && resumen().pendientes.length === 0;
      if (sinNada) {
        for (const k of Object.keys(deseado)) if (servidor.get(k) !== deseado[k]) intermedias.push({ semilla: s, paso, clave: k, cuenta: servidor.get(k), pantalla: deseado[k], traza: traza.join(' · ') });
      }
    }
    /* Final: todo lo que vuele termina bien (salvo las mudas); lo pendiente se reintenta hasta converger. */
    let convergio = await drenar({ saltar });
    for (let i = 0; i < 4 && resumen().pendientes.length; i++) { promesas.push(S.reintentarGuardados()); convergio = (await drenar({ saltar })) && convergio; }
    const res = await conTiempo(Promise.all(promesas), 500);
    if (res === 'NO_RESUELVE' || !convergio) colgadas += 1;
    /* Lo único que puede seguir «sin guardar» con conexión es una clave con una petición que el servidor aplicó y
       que no contestará nunca: el cliente no sabe si pisó algo, y lo dice. Cualquier otro pendiente es un fallo. */
    if (resumen().pendientes.some((k) => ![...mudasAplicadas].some((p) => p.clave === k))) sinConverger += 1;
    if (resumen().pendientes.length) limitacion += 1;
    maxPeticiones = Math.max(maxPeticiones, peticiones.length);
    for (const k of Object.keys(deseado)) {
      if (resumen().pendientes.includes(k)) continue; // lo dice el indicador: no es silencioso
      if (servidor.get(k) !== deseado[k]) silenciosas.push({ semilla: s, clave: k, cuenta: servidor.get(k), pantalla: deseado[k], peticiones: de(k).map((p) => p.valor).join(','), traza: traza.join(' · ') });
    }
  }
  return { silenciosas, intermedias, maxPeticiones, colgadas, sinConverger, limitacion };
}
const muestra = (xs) => (xs.length ? ` — p. ej. ${JSON.stringify(xs[0])}` : '');
{
  const una = await explorar({ semillas: 2000, claves: ['k'], mudas: false });
  ok(una.silenciosas.length === 0, `🚨 10 — ${2000 * ESCALA} calendarios con UNA clave (guardar; aplicar; responder ok/500/red/red-aplicada/502; topes de cola y de petición; reintentos): 0 pérdidas silenciosas al final${muestra(una.silenciosas)}`);
  ok(una.intermedias.length === 0, `🚨 10 — …y en ningún paso «sin nada pendiente» con la cuenta vieja${muestra(una.intermedias)}`);
  ok(una.colgadas === 0 && una.sinConverger === 0, `10 — con conexión, todo converge: nada colgado (${una.colgadas}) ni pendiente para siempre (${una.sinConverger})`);
  ok(una.maxPeticiones <= 40, `10 — sin bucles: como mucho ${una.maxPeticiones} peticiones por calendario`);
  const dos = await explorar({ semillas: 1000, claves: ['k', 'j'], mudas: false });
  ok(dos.silenciosas.length === 0 && dos.intermedias.length === 0 && dos.sinConverger === 0, `🚨 10 — ${1000 * ESCALA} calendarios con DOS claves: 0 pérdidas, 0 «Guardado» falsos, todo converge${muestra(dos.silenciosas)}${muestra(dos.intermedias)}`);
  const ses = await explorar({ semillas: 1000, claves: ['k'], mudas: false, sesiones: true });
  ok(ses.silenciosas.length === 0 && ses.sinConverger === 0, `🚨 10 — ${1000 * ESCALA} calendarios saliendo y entrando con la misma cuenta: 0 pérdidas, todo converge${muestra(ses.silenciosas)}`);
  const lim = await explorar({ semillas: 1000, claves: ['k'], mudas: true });
  ok(lim.silenciosas.length === 0 && lim.intermedias.length === 0, `🚨 10 — ${1000 * ESCALA} calendarios con peticiones que el servidor aplica y NO contestan nunca: 0 pérdidas SILENCIOSAS y 0 «Guardado» falsos (la clave se queda «sin guardar»)${muestra(lim.silenciosas)}${muestra(lim.intermedias)}`);
  ok(lim.sinConverger === 0 && lim.colgadas === 0, `10 — …y lo único que queda «sin guardar» es una clave con una petición muda (${lim.sinConverger} con otro motivo, ${lim.colgadas} colgados)`);
  console.log(`    (limitación declarada, solo la cierra el servidor: en ${lim.limitacion} de ${1000 * ESCALA} calendarios una petición muda deja la clave «sin guardar» —no se sabe si pisó algo—; si se cierra la app así, al volver puede cargar un valor viejo)`);
}

/* ── El cableado, leído del código (solo si se prueba la versión de verdad). */
if (!process.env.A5_SRC) {
  const { readFileSync } = await import('node:fs');
  const SUPA = readFileSync(join(RAIZ, 'src/lib/supabase.js'), 'utf8');
  ok(/saveData\(usuario, clave, valor, \{ reintento: true \}\)/.test(SUPA), 'A5 — reintentarGuardados sale en modo reintento (decide su valor al salir)');
  ok(/reintentoEnMarcha\.generacion === generacion/.test(SUPA), 'A5 — el reintento en marcha es de una sesión');
  ok(!/\.abort\(\)/.test(SUPA.replace(/\/\*[\s\S]*?\*\//g, '')), 'A5 — una petición vencida no se aborta (una subida lenta tiene que poder llegar)');
}

console.error = errorOriginal;
console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
