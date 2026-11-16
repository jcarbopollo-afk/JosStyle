// ============================================================================
// 🛡 HORARIOS · FASE 4, A-BIS — LA GUARDIA DEL HORARIO (especificación A-bis consolidada, §0–§15, con la
// corrección del §6.3/§6.6: E1 SOLO con un testigo válido presente).
//
// Todo con un DOBLE del servidor en memoria que aplica la condición de verdad (`value->>ultimaOperacion = base`),
// la clave primaria (23505) y las respuestas perdidas. Ninguna red, ningún dato de una cuenta. Las «copias
// antiguas» se simulan como lo que hacen: guardar `horarioTop` sin `version` ni `testigo` (su normalizador tira
// lo que no conoce).
// ============================================================================
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const G = await import(pathToFileURL(join(RAIZ, 'src/lib/guardiaHorario.js')).href);
const H = await import(pathToFileURL(join(RAIZ, 'src/lib/horario.js')).href);
const Y = await import(pathToFileURL(join(RAIZ, 'src/lib/sincronizacion.js')).href);
const D = await import(pathToFileURL(join(RAIZ, 'src/lib/diagnosticoHorario.js')).href);

const {
  crearGuardiaDeHorario, conceptoDelHorario, clasificarHorario, leerFilasDeGuardia, leerFilaDeGuardia, cumpleInvariante,
  construirFila, parteVisita, parteIntencion, parteRegistro, huellaDeHorario, textoCanonico, nuevoUuid, idDelAparato,
  evaluarCondicionesB, esClaveDeGuardiaHorario, claveDeGuardia, MOTIVOS_BLOQUEO_GUARDIA, resumenDeFilas, revisionDelTestigo,
  compararVersiones, versionComparable, DECISIONES_RESOLUCION,
} = G;
const { guardiaDeVersionHorario, normalizarHorarioTop } = H;

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
const copia = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`\\])\/\/.*$/gm, '$1');
const VERSION = '3.162.0';

/* ── El doble del servidor ─────────────────────────────────────────────────── */
function servidor() {
  const filas = new Map();
  let reloj = Date.parse('2026-11-01T10:00:00Z');
  const fallar = { leerTodas: 0, leerPropia: 0, insertar: 0, actualizar: 0, leerHorario: 0, perderRespuesta: 0, definitivo: 0, noAplicarSinRespuesta: 0 };
  const escrituras = [];
  const antes = { insertar: null, actualizar: null };
  const t = {
    async leerTodas() {
      if (fallar.leerTodas > 0) { fallar.leerTodas -= 1; return { ok: false, sinRespuesta: true }; }
      return { ok: true, filas: [...filas].filter(([k]) => k.startsWith('horarioGuardia:')).map(([k, v]) => ({ key: k, value: copia(v.value), updated_at: v.updated_at })) };
    },
    async leerPropia(_u, k) {
      if (fallar.leerPropia > 0) { fallar.leerPropia -= 1; return { ok: false, sinRespuesta: true }; }
      const f = filas.get(k);
      return { ok: true, existe: !!f, valor: f ? copia(f.value) : null };
    },
    async insertar(_u, k, v) {
      if (antes.insertar) { const fn = antes.insertar; antes.insertar = null; await fn(); }
      if (fallar.insertar > 0) { fallar.insertar -= 1; return { ok: false, sinRespuesta: true }; }
      if (fallar.definitivo > 0) { fallar.definitivo -= 1; return { ok: false, error: { code: '42501' }, status: 403, definitivo: true }; }
      if (filas.has(k)) return { ok: false, conflicto: true, error: { code: '23505' } };
      filas.set(k, { value: copia(v), updated_at: new Date(reloj += 1000).toISOString() });
      escrituras.push({ tipo: 'insert', k });
      if (fallar.perderRespuesta > 0) { fallar.perderRespuesta -= 1; return { ok: false, sinRespuesta: true }; }
      return { ok: true };
    },
    async actualizarSiBase(_u, k, v, base) {
      if (antes.actualizar) { const fn = antes.actualizar; antes.actualizar = null; await fn(); }
      if (fallar.actualizar > 0) { fallar.actualizar -= 1; return { ok: false, sinRespuesta: true }; }
      if (fallar.definitivo > 0) { fallar.definitivo -= 1; return { ok: false, error: { code: '42501' }, status: 403, definitivo: true }; }
      const f = filas.get(k);
      if (!f || !f.value || f.value.ultimaOperacion !== base) return { ok: true, aplicada: false };
      f.value = copia(v);
      escrituras.push({ tipo: 'update', k });
      if (fallar.perderRespuesta > 0) { fallar.perderRespuesta -= 1; return { ok: false, sinRespuesta: true }; }
      return { ok: true, aplicada: true };
    },
    async leerHorario() {
      if (fallar.leerHorario > 0) { fallar.leerHorario -= 1; return { ok: false, sinRespuesta: true }; }
      const f = filas.get('horarioTop');
      return { ok: true, existe: !!f, valor: f ? copia(f.value) : null };
    },
  };
  return {
    t, filas, fallar, escrituras, antes,
    horario: () => (filas.has('horarioTop') ? copia(filas.get('horarioTop').value) : undefined),
    ponerHorario: (v) => filas.set('horarioTop', { value: copia(v), updated_at: new Date(reloj += 1000).toISOString() }),
    borrarHorario: () => filas.delete('horarioTop'),
    /** Lo que hace una copia ANTIGUA al guardar: su normalizador tira `version` y `testigo`. */
    copiaAntigua: (cambio = {}) => {
      const v = filas.has('horarioTop') ? copia(filas.get('horarioTop').value) : {};
      const { version, testigo, ...resto } = v || {};
      filas.set('horarioTop', { value: { ...resto, ...cambio }, updated_at: new Date(reloj += 1000).toISOString() });
    },
    fila: (ap) => (filas.has(claveDeGuardia(ap)) ? copia(filas.get(claveDeGuardia(ap)).value) : null),
    registros: () => [...filas].filter(([k]) => k.startsWith('horarioGuardia:')).flatMap(([, v]) => v.value.detecciones || []),
    escriturasGuardia: () => escrituras.length,
  };
}

const HT = { horarios: [{ id: 'h1', nombre: 'Instituto', columnas: [], filas: [] }], bloques: [], actividades: [], excepciones: [] };
let relojSesiones = Date.parse('2026-11-01T09:00:00Z');
/** Una sesión de la aplicación A-bis: carga, comprueba, y guarda como lo hace App.jsx (el mismo objeto a la
 *  pantalla y al servidor; la relectura del §7.5 después del guardado). */
async function abrir(srv, aparato, { versionApp = VERSION, cargaFallida = false, horas = 0 } = {}) {
  relojSesiones += horas * 3600 * 1000;
  let ahoraMs = relojSesiones;
  const g = crearGuardiaDeHorario({ transporte: srv.t, usuario: 'u', aparato, versionApp, candado: null, ahora: () => new Date(ahoraMs += 1000) });
  const crudo = srv.horario();
  const ses = { g, actual: crudo === undefined ? {} : normalizarHorarioTop(crudo) };
  await g.comprobar({ guardiaA: guardiaDeVersionHorario(crudo), cargaFallida });
  await g.esperar();
  ses.guardar = async (cambio = {}, { llega = true, esperarRespuesta = null } = {}) => {
    const nuevo = { ...ses.actual, ...cambio, bloques: [...(ses.actual.bloques || []), { id: `b${Math.random().toString(36).slice(2, 6)}` }] };
    const p = g.prepararEscritura(nuevo, ses.actual);
    ses.actual = p.valor;
    if (llega) srv.ponerHorario(p.valor);
    g.despuesDeGuardar(p, esperarRespuesta || Promise.resolve());
    await g.esperar();
    return p;
  };
  return ses;
}
const motivo = (ses) => ses.g.motivoBloqueo();
const vista = (ses) => ses.g.vista();

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1 · Los cuatro conceptos del §6.3 (corregido) ──');
{
  const c = (valor, existe = true) => conceptoDelHorario({ existe, valor }).concepto;
  const T = { formato: 1, revision: 'r1', base: null, aparato: 'X', desde: 'd', ultimaEscritura: 'd' };
  eq(c({ ...HT, version: 1, testigo: T }), '2', 'Concepto 2: estructuralmente válido + version 1 + testigo con formato 1 y revisión');
  eq(c({ ...HT }), '3', 'Concepto 3: estructuralmente válido sin testigo (sin version)');
  eq(c({ ...HT, version: 1 }), '3', 'Concepto 3: estructuralmente válido sin testigo (con version 1)');
  eq(c({ ...HT, version: 1, testigo: undefined }), '3', 'Concepto 3: testigo undefined cuenta como ausente');
  for (const [nombre, t] of [['texto', 'x'], ['lista', []], ['null', null], ['formato "1"', { ...T, formato: '1' }], ['formato 0', { ...T, formato: 0 }],
    ['formato 1,5', { ...T, formato: 1.5 }], ['formato −1', { ...T, formato: -1 }], ['sin revision', { formato: 1 }], ["revision ''", { ...T, revision: '' }], ['revision 5', { ...T, revision: 5 }]]) {
    eq(c({ ...HT, version: 1, testigo: t }), '4a', `Concepto 4a: testigo ${nombre}`);
  }
  eq(c({ ...HT, testigo: T }), '4a', 'Concepto 4a: testigo con forma válida y horarioTop SIN version');
  for (const v of [[], null, 7, 'texto']) eq(c(v), '4a', `Concepto 4a: el valor de horarioTop es ${JSON.stringify(v)}`);
  eq(c({ ...HT, version: 1, testigo: { ...T, formato: 2 } }), '4b', 'Concepto 4b: formato entero mayor que 1');
  eq(c(null, false), 'fila_ausente', 'Sin fila: fila ausente');
  eq(conceptoDelHorario({ existe: true, valor: { ...HT } }).estructural, true, 'Concepto 1 (estructural) es independiente del testigo…');
  ok(conceptoDelHorario({ existe: true, valor: { ...HT } }).concepto !== '2', '…y NO implica el concepto 2');
}

console.log('\n── 2 · La tabla del §6.6: E1 solo con el concepto 2 ──');
{
  const fila = (ap, extra = {}) => ({ formato: 1, aparato: ap, secuencia: 1, ultimaOperacion: 'op', primeraVezA: { en: 'x', versionApp: VERSION }, visitas: { [VERSION]: { primera: {}, ultima: {} } }, testigo: { intenciones: [], ...extra }, detecciones: [], retiradas: [], resoluciones: [] });
  const lect = (filas) => ({ ok: true, filas });
  const conDem = [fila('X', { visto: { primera: { revision: 'r0' }, ultima: { revision: 'r0', conocidas: [] } } })];
  const conInt = [fila('X', { intenciones: [{ id: 'i1' }] })];
  const cl = (valor, filas, existe = true) => clasificarHorario({ lectura: lect(filas), horario: { ok: true, existe, valor }, aparato: 'X', huella: 'h', guardiaA: guardiaDeVersionHorario(existe ? valor : undefined) }).clase;
  const T = { formato: 1, revision: 'r1' };
  eq(cl({ ...HT, version: 1, testigo: T }, conDem), 'E1', 'Concepto 2 con testigo demostrado → E1');
  eq(cl({ ...HT, version: 1, testigo: T }, []), 'E1', 'Concepto 2 sin demostración → E1');
  eq(cl({ ...HT }, []), 'E2', 'Concepto 3 sin demostración ni intenciones → E2');
  eq(cl({ ...HT }, conInt), 'AI', 'Concepto 3 sin demostración, con intenciones → AI');
  eq(cl({ ...HT, version: 1, testigo: 'x' }, []), 'E2', '4a sin demostración → E2');
  eq(cl({ ...HT, version: 1, testigo: 'x' }, conInt), 'AI', '4a sin demostración con intenciones → AI');
  eq(cl(null, [], false), 'E2', 'Fila ausente sin demostración → E2');
  eq(cl({ ...HT }, conDem), 'B', '🚨 Estructuralmente válido SIN version y sin testigo, con testigo demostrado → B (nunca E1)');
  eq(cl({ ...HT, version: 1 }, conDem), 'C', '🚨 Estructuralmente válido CON version 1 y sin testigo, con testigo demostrado → C (nunca E1)');
  eq(cl({ ...HT, version: 1, testigo: 'x' }, conDem), 'B', '4a con demostración → B (testigo_ilegible)');
  eq(cl(null, conDem, false), 'B', 'Fila ausente con demostración → B (fila_ausente)');
  eq(cl({ ...HT, version: 1, testigo: { formato: 2, revision: 'r' } }, conDem), 'no_verificable', '4b → lectura no verificable');
  eq(cl({ ...HT, version: 2 }, conDem), 'sin_clasificar', 'version posterior (la guardia de la A no la reconoce) → sin clasificar');
  eq(cl({ ...HT, version: 'x' }, conDem), 'sin_clasificar', 'version ilegible → sin clasificar');
  const motivoDe = (valor, existe = true) => clasificarHorario({ lectura: lect(conDem), horario: { ok: true, existe, valor }, aparato: 'X', huella: 'h' }).motivoRegistro;
  eq(motivoDe({ ...HT }), 'testigo_ausente', 'B por testigo ausente lleva su motivo');
  eq(motivoDe({ ...HT, version: 1, testigo: [] }), 'testigo_ilegible', 'B por 4a lleva testigo_ilegible');
  eq(motivoDe(null, false), 'fila_ausente', 'B sin fila lleva fila_ausente');
  eq(clasificarHorario({ lectura: lect(conDem), horario: { ok: true, existe: true, valor: { ...HT, version: 1 } }, aparato: 'X', huella: 'h' }).claseRegistro, 'ambigua', 'C se registra como «ambigua»');
}

console.log('\n── 3 · Lectura no verificable (§6.4) ──');
{
  const lect = (filas) => leerFilasDeGuardia(filas);
  const valida = { formato: 1, aparato: 'X', secuencia: 1, ultimaOperacion: 'op', primeraVezA: {}, visitas: {}, detecciones: [], retiradas: [], resoluciones: [] };
  eq(lect([{ key: 'horarioGuardia:X', value: valida }]).ok, true, 'Una fila bien formada se entiende');
  eq(lect([{ key: 'horarioGuardia:X', value: { ...valida, formato: 2 } }]).motivo, 'fila_formato_futuro', 'Fila de un formato futuro → no verificable');
  eq(lect([{ key: 'horarioGuardia:Y', value: valida }]).motivo, 'fila_aparato_distinto', 'Su aparato no coincide con la clave → no verificable');
  eq(lect([{ key: 'horarioGuardia:X', value: { ...valida, detecciones: 'x' } }]).motivo, 'fila_malformada', 'Una lista que no es lista → no verificable');
  eq(lect([{ key: 'horarioGuardia:X', value: { ...valida, detecciones: [{ sinId: 1 }] } }]).motivo, 'fila_malformada', 'Un registro sin id → no verificable');
  const cl = (o) => clasificarHorario({ lectura: { ok: true, filas: [] }, horario: { ok: true, existe: true, valor: HT }, aparato: 'X', ...o });
  eq(cl({ aparato: null }).clase, 'no_verificable', 'Sin id del aparato → no verificable');
  eq(cl({ cargaFallida: true }).motivo, 'horario_sin_cargar', 'horarioTop no se pudo cargar → no verificable');
  eq(cl({ horario: { ok: false } }).motivo, 'lectura_horario', 'La lectura propia falla → no verificable');
  eq(cl({ lectura: { ok: false, motivo: 'lectura_guardia' } }).motivo, 'lectura_guardia', 'La lectura de las filas falla → no verificable');
  // En vivo: no se escribe NADA en la guardia y Horarios queda bloqueado; Reintentar vuelve a comprobar.
  for (const [nombre, preparar] of [['leerTodas', (s) => { s.fallar.leerTodas = 1; }], ['leerHorario', (s) => { s.fallar.leerHorario = 1; }],
    ['fila malformada', (s) => s.filas.set('horarioGuardia:Z', { value: { formato: 1 } })]]) {
    const srv = servidor(); srv.ponerHorario(HT); preparar(srv);
    const ses = await abrir(srv, 'X');
    eq(vista(ses).estado, 'no_verificable', `${nombre}: estado «no verificable»`);
    eq(motivo(ses), MOTIVOS_BLOQUEO_GUARDIA.noVerificable, `${nombre}: Horarios bloqueado`);
    eq(srv.escriturasGuardia(), 0, `${nombre}: no se escribe nada en la guardia`);
    if (nombre !== 'fila malformada') {
      await ses.g.reintentar(); await ses.g.esperar();
      eq(vista(ses).estado, 'E2', `${nombre}: «Reintentar» con la lectura arreglada clasifica (E2)`);
      eq(motivo(ses), null, `${nombre}: y Horarios vuelve a escribir`);
    }
  }
  const srv = servidor(); srv.ponerHorario(HT);
  const ses = await abrir(srv, 'X', { cargaFallida: true });
  eq(motivo(ses), MOTIVOS_BLOQUEO_GUARDIA.noVerificable, 'Con horarioTop sin cargar: bloqueado («no verificable»)');
  const sinAp = crearGuardiaDeHorario({ transporte: srv.t, usuario: 'u', aparato: null });
  await sinAp.comprobar({}); eq(sinAp.vista().motivo, 'sin_aparato', 'Sin id de aparato: «no verificable», sin registrar nada');
}

console.log('\n── 4 · E0, sin clasificar y la prioridad del motivo de la A ──');
{
  const srv = servidor(); srv.ponerHorario(HT);
  const g = crearGuardiaDeHorario({ transporte: srv.t, usuario: 'u', aparato: 'X', candado: null });
  eq(g.motivoBloqueo(), MOTIVOS_BLOQUEO_GUARDIA.comprobando, 'E0: Horarios en solo lectura («Comprobando tu horario») antes de comprobar');
  eq(g.prepararEscritura({ ...HT }, HT).conTestigo, false, 'En E0 no se prepara ninguna escritura con testigo');
  const srv2 = servidor(); srv2.ponerHorario({ ...HT, version: 2 });
  const ses = await abrir(srv2, 'X');
  eq(vista(ses).estado, 'sin_clasificar', 'version posterior: sin clasificar');
  ok(srv2.fila('X') && Object.keys(srv2.fila('X').visitas).length === 1 && srv2.registros().length === 0, '…solo se apunta la visita');
  const app = sinComentarios(leer('src/App.jsx'));
  ok(/horarioMotivoARef\.current \|\| \(g \? g\.motivoBloqueo\(\) : null\)/.test(app), 'App.jsx: el motivo de la A tiene prioridad sobre el de la guardia');
  ok(/horarioSoloLecturaRef\.current = guardiaHor\.soloLectura \? guardiaHor\.motivo : \(g\.motivoBloqueo\(\) \|\| false\)/.test(app), 'App.jsx: al cargar, E0 bloquea solo Horarios (mismo mecanismo de la A)');
  ok(/guardiaNueva\.comprobar\(entradaGuardia\)/.test(app) && app.indexOf('guardiaNueva.comprobar(entradaGuardia)') > app.indexOf('setLoaded(true);'), 'App.jsx: la comprobación empieza al terminar la carga, sin esperar');
}

console.log('\n── 5 · La fila: forma, invariante, propiedades desconocidas y huella ──');
{
  const srv = servidor(); srv.ponerHorario(HT);
  await abrir(srv, 'X');
  const f = srv.fila('X');
  ok(leerFilaDeGuardia(claveDeGuardia('X'), f).ok, 'La fila creada se entiende');
  eq([f.formato, f.aparato, f.secuencia, typeof f.ultimaOperacion, f.etiqueta], [1, 'X', 1, 'string', null], 'formato, aparato, secuencia, ultimaOperacion y etiqueta');
  eq(f.primeraVezA.versionApp, VERSION, 'primeraVezA con la versión de la app');
  ok(f.visitas[VERSION] && f.visitas[VERSION].primera && f.visitas[VERSION].ultima, 'visitas con primera y última');
  ok(Array.isArray(f.detecciones) && Array.isArray(f.retiradas) && Array.isArray(f.resoluciones), 'las tres listas existen');
  ok(!('updated_at' in f), 'la fila no lleva updated_at dentro (lo pone el servidor)');
  // Desconocidos: se conservan al escribir.
  const v = srv.fila('X'); v.futuro = { a: 1 }; v.testigo.futuroT = 2; srv.filas.set(claveDeGuardia('X'), { value: v, updated_at: 'x' });
  const ses = await abrir(srv, 'X', { horas: 30 });
  const f2 = srv.fila('X');
  eq([f2.futuro, f2.testigo.futuroT, f2.secuencia], [{ a: 1 }, 2, 2], 'Lo que esta versión no conoce de la fila se conserva al escribir');
  void ses;
  // Invariante.
  const base = srv.fila('X');
  const nueva = construirFila(base, [parteIntencion({ id: 'i9', en: 'e' })], { opId: 'op2', aparato: 'X', versionApp: VERSION, en: 'e', fecha: '2026-11-02' });
  ok(cumpleInvariante(base, nueva), 'Una escritura bien construida cumple el invariante');
  ok(!cumpleInvariante(base, { ...nueva, primeraVezA: { en: 'otro' } }), 'Cambiar primeraVezA lo rompe');
  ok(!cumpleInvariante(base, { ...nueva, secuencia: base.secuencia + 2 }), 'Saltarse una secuencia lo rompe');
  ok(!cumpleInvariante(base, { ...nueva, aparato: 'Y' }), 'Cambiar el aparato lo rompe');
  ok(!cumpleInvariante({ ...base, detecciones: [{ id: 'd1' }] }, { ...nueva, detecciones: [] }), 'Quitar un registro lo rompe');
  ok(!cumpleInvariante({ ...base, testigo: { intenciones: [{ id: 'i1' }] } }, { ...nueva, testigo: { intenciones: [{ id: 'i2' }] } }), 'Cambiar una intención lo rompe');
  ok(!cumpleInvariante({ ...base, resoluciones: [{ id: 'r1', a: 1 }] }, { ...nueva, resoluciones: [{ id: 'r1', a: 2 }] }), 'Cambiar una resolución lo rompe');
  ok(construirFila(nueva, [parteIntencion({ id: 'i9', en: 'e' })], { opId: 'op3', aparato: 'X', versionApp: VERSION, en: 'e', fecha: '2026-11-02' }) === null, 'Reconstruir con lo ya aplicado no cambia nada (idempotente)');
  // Huella canónica.
  const h1 = await huellaDeHorario({ b: 1, a: { d: 2, c: [1, 2] } });
  const h2 = await huellaDeHorario({ a: { c: [1, 2], d: 2 }, b: 1 });
  const h3 = await huellaDeHorario({ a: { c: [2, 1], d: 2 }, b: 1 });
  ok(/^[0-9a-f]{64}$/.test(h1) && h1 === h2, 'La huella es SHA-256 del JSON con claves ordenadas en todos los niveles');
  ok(h1 !== h3, '…y las listas cuentan en su orden');
  eq(await huellaDeHorario(undefined, false), await huellaDeHorario(null), 'Sin fila, la huella es la de null');
  eq(await huellaDeHorario({ a: 1 }, true, {}), null, 'Sin crypto.subtle, la huella es null');
  eq(textoCanonico({ b: [1, { d: 1, c: 2 }], a: null }), '{"a":null,"b":[1,{"c":2,"d":1}]}', 'El texto canónico');
}

console.log('\n── 6 · Identidad del aparato (§3) ──');
{
  const almacen = () => { const m = new Map(); return { leer: (k) => (m.has(k) ? m.get(k) : null), escribir: (k, v) => m.set(k, v) }; };
  const a = almacen();
  const id1 = idDelAparato({ almacen: a }); const id2 = idDelAparato({ almacen: a });
  ok(typeof id1 === 'string' && id1 === id2, 'El id se crea una vez y se reutiliza');
  const soloAleatorio = { getRandomValues: (b) => { for (let i = 0; i < b.length; i += 1) b[i] = (i * 37 + 11) & 255; return b; } };
  ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(nuevoUuid(soloAleatorio)), 'Sin randomUUID: un uuid v4 hecho con getRandomValues');
  eq(nuevoUuid({}), null, 'Sin ninguno de los dos: null');
  eq(idDelAparato({ almacen: almacen(), crypto: {} }), null, '…y entonces no hay id de aparato');
  const src = sinComentarios(leer('src/lib/guardiaHorario.js'));
  ok(!/Math\.random/.test(src), 'guardiaHorario.js no usa Math.random');
  ok(!/localStorage|sessionStorage|indexedDB/.test(src), 'C-84: guardiaHorario.js no guarda nada en el aparato (solo el id, por el almacén del historial)');
  ok(/almacenUnico/.test(src) && /almacenDelNavegador\(\)/.test(src), 'Una sola instancia del almacén para toda la aplicación');
  ok(!/from '\.\/sincronizacion'|from '\.\/supabase'/.test(src) && (src.match(/^import /gm) || []).length === 1, 'Es una hoja: solo importa historialVersiones.js (no toca la cola)');
}

console.log('\n── 7 · El testigo que se escribe (§1) ──');
{
  const srv = servidor(); srv.ponerHorario(HT);
  const x = await abrir(srv, 'X'); // E2
  const p1 = await x.guardar();
  eq([p1.valor.version, 'testigo' in p1.valor], [1, false], 'En E2, el primer guardado sale con version 1 y SIN testigo');
  ok(srv.fila('X').testigo.intenciones.length === 1, '…y pone en marcha la intención (confirmada al releer)');
  const p2 = await x.guardar();
  const t = p2.valor.testigo;
  ok(t && t.formato === 1 && typeof t.revision === 'string' && t.aparato === 'X' && t.base === null && t.desde && t.ultimaEscritura, 'Con la intención confirmada: testigo con formato, desde, ultimaEscritura, revision, base (null) y aparato');
  ok(srv.fila('X').testigo.escrito && srv.fila('X').testigo.escrito.ultima.revision === t.revision, 'La relectura demuestra el testigo: se apunta «escrito»');
  const p3 = await x.guardar();
  eq([p3.valor.testigo.base, p3.valor.testigo.desde], [t.revision, t.desde], 'Fuera del arranque: la base es la revisión del estado actual y «desde» se conserva');
  ok(p3.valor.testigo.revision !== t.revision, 'Cada escritura, una revisión nueva');
  eq(srv.fila('X').testigo.intenciones.length, 1, 'No se escribe otra intención');
  // Desconocidos del testigo anterior; anterior malformado se sustituye.
  const g = x.g;
  const conRaro = { ...x.actual, testigo: { ...x.actual.testigo, futuroT: 'z' } };
  eq(g.prepararEscritura({ ...HT }, conRaro).valor.testigo.futuroT, 'z', 'Lo desconocido del testigo anterior se conserva');
  const malo = g.prepararEscritura({ ...HT }, { ...HT, version: 1, testigo: { formato: 'x', futuroT: 'z' } }).valor.testigo;
  ok(!('futuroT' in malo) && malo.base === null, 'Un testigo anterior mal formado se sustituye (sin base)');
  const sinRevision = g.prepararEscritura({ ...HT }, { ...HT, version: 1, testigo: { formato: 1, futuroT: 'z', desde: 'viejo' } }).valor.testigo;
  ok(!('futuroT' in sinRevision) && sinRevision.desde !== 'viejo', 'Un testigo con formato 1 sin revisión (4a) también se sustituye: ni sus desconocidos ni su «desde»');
  // Deshacer: la base sale del estado ACTUAL, nunca de la copia que se restaura.
  const restaurado = { ...HT, version: 1, testigo: { formato: 1, revision: 'vieja' } };
  eq(g.prepararEscritura(restaurado, x.actual).valor.testigo.base, x.actual.testigo.revision, 'Deshacer: la base es la del estado actual, no la de la copia restaurada');
  // Nunca se escribe horarioTop desde la guardia.
  const src = sinComentarios(leer('src/lib/guardiaHorario.js'));
  ok(!/'horarioTop'/.test(src), 'guardiaHorario.js nunca escribe horarioTop (ni nombra la clave)');
  eq(revisionDelTestigo({ ...HT, version: 1, testigo: { formato: 1, revision: 'r' } }), 'r', 'revisionDelTestigo lee la revisión del concepto 2');
  eq(revisionDelTestigo({ ...HT, testigo: { formato: 1, revision: 'r' } }), null, '…y no la de un testigo sin version (4a)');
}

console.log('\n── 8 · Casos 1–3: arranque incompleto (AI) ──');
{
  const srv = servidor(); srv.ponerHorario(HT);
  const x = await abrir(srv, 'X');
  await x.guardar(); x.g.cerrar(); // intención confirmada, ningún testigo; se cierra
  const x2 = await abrir(srv, 'X', { horas: 1 });
  eq(vista(x2).estado, 'AI', 'Caso 1: al volver a abrir tras confirmar la intención y sin testigo → AI');
  eq([srv.registros().length, motivo(x2)], [0, null], 'Caso 1: ningún registro y Horarios libre');
  const ev = await x2.g.evaluar({ versionMinima: VERSION });
  eq(ev.condiciones.find((c) => c.id === 'testigo').estado, 'no_verificable', 'Caso 1: condición 3 no verificable');
  const y = await abrir(srv, 'Y', { horas: 1 });
  eq(vista(y).estado, 'AI', 'Caso 2: con intención y sin testigo demostrado, desde otro aparato también → AI');
  const intAntes = resumenDeFilas([srv.fila('X'), srv.fila('Y')]).intenciones.length;
  const p = await x2.guardar();
  ok(p.conTestigo, 'Caso 3: en AI, el siguiente guardado normal lleva testigo…');
  eq(resumenDeFilas([srv.fila('X'), srv.fila('Y')]).intenciones.length, intAntes, '…sin una intención nueva');
  ok(srv.fila('X').testigo.escrito && srv.fila('X').testigo.escrito.ultima.revision === p.revision && vista(x2).arranque === false, 'Caso 3: se relee, se apunta «escrito» y se sale del arranque');
}

console.log('\n── 9 · Caso 4: copia antigua tras la demostración → B, bloqueo hasta confirmar ──');
{
  const srv = servidor(); srv.ponerHorario(HT);
  const x = await abrir(srv, 'X'); await x.guardar(); await x.guardar();
  ok(vista(x).demostrado, 'Escenario: testigo demostrado');
  srv.copiaAntigua({ bloques: [{ id: 'antiguo' }] });
  ok(H.guardiaDeVersionHorario(srv.horario()).soloLectura === false, 'La copia antigua deja un horario estructuralmente válido (la guardia de la A no lo bloquea)');
  srv.fallar.actualizar = 5;
  const z = await abrir(srv, 'X', { horas: 1 });
  eq(vista(z).estado, 'B', 'Caso 4: B, nunca E1');
  eq(vista(z).estadoRegistro, 'E4', 'El registro sin respuesta queda en E4');
  eq(motivo(z), MOTIVOS_BLOQUEO_GUARDIA.incidencia, 'Horarios bloqueado hasta confirmar el registro');
  const idAntes = vista(z).registroPendiente.id;
  srv.fallar.actualizar = 0;
  await z.g.reintentar(); await z.g.esperar();
  eq([vista(z).estadoRegistro, motivo(z)], ['E6', null], 'Al reintentar se confirma (E6) y Horarios vuelve a escribir');
  eq(srv.registros().map((r) => [r.id, r.clase, r.motivo]), [[idAntes, 'perdida', 'testigo_ausente']], 'Un solo registro, con el MISMO id del primer intento');
  const ev = await z.g.evaluar({ versionMinima: VERSION });
  eq(ev.condiciones.find((c) => c.id === 'incidencias').estado, 'no_cumple', 'La B queda bloqueada (condición 2 no cumple)');
}

console.log('\n── 10 · Casos 5–9: cierres, respuestas perdidas, revisiones de otro aparato e intenciones a la vez ──');
{
  // 5a · el guardado con testigo no llega y se cierra.
  let srv = servidor(); srv.ponerHorario(HT);
  let x = await abrir(srv, 'X'); await x.guardar(); await x.guardar({}, { llega: false }); x.g.cerrar();
  let r = await abrir(srv, 'X', { horas: 1 });
  ok(['AI', 'E1'].includes(vista(r).estado) && srv.registros().length === 0, `Caso 5: cierre durante un guardado con testigo que no llega → ${vista(r).estado}, nunca B ni C`);
  // 5b · llega, pero se cierra antes de releer.
  srv = servidor(); srv.ponerHorario(HT);
  x = await abrir(srv, 'X'); await x.guardar();
  const p = x.g.prepararEscritura({ ...x.actual }, x.actual); srv.ponerHorario(p.valor); x.g.cerrar();
  r = await abrir(srv, 'X', { horas: 1 });
  eq([vista(r).estado, srv.registros().length], ['E1', 0], 'Caso 5: llega y se cierra sin releer → al abrir E1 (se apunta visto), nunca B ni C');
  ok(srv.fila('X').testigo.visto && srv.fila('X').testigo.visto.ultima.revision === p.revision, '…y el «visto» demuestra esa revisión');
  // 6 · respuesta perdida: la relectura sigue (con error), y si no está, no hace nada.
  srv = servidor(); srv.ponerHorario(HT);
  x = await abrir(srv, 'X'); await x.guardar();
  const escritasAntes = srv.escriturasGuardia();
  await x.guardar({}, { llega: false, esperarRespuesta: Promise.reject(new Error('sin respuesta')) });
  eq([srv.escriturasGuardia(), vista(x).arranque], [escritasAntes, true], 'Caso 6: respuesta perdida y nada en el servidor → la relectura no hace nada');
  srv.ponerHorario(x.actual); // la cola reintenta y llega
  x.g.despuesDeGuardar({ conTestigo: true, arranque: true }, Promise.resolve()); await x.g.esperar();
  ok(srv.fila('X').testigo.escrito && vista(x).arranque === false, 'Caso 6: cuando la cola reintenta y llega, la relectura lo demuestra');
  // 7 · la relectura encuentra una revisión POSTERIOR de la misma sesión.
  srv = servidor(); srv.ponerHorario(HT);
  x = await abrir(srv, 'X'); await x.guardar();
  let soltar; const espera = new Promise((res) => { soltar = res; });
  const pA = x.g.prepararEscritura({ ...x.actual, n: 1 }, x.actual); x.actual = pA.valor; srv.ponerHorario(pA.valor);
  x.g.despuesDeGuardar(pA, espera);
  const pB = x.g.prepararEscritura({ ...x.actual, n: 2 }, x.actual); x.actual = pB.valor; srv.ponerHorario(pB.valor);
  soltar(); await x.g.esperar();
  eq(srv.fila('X').testigo.escrito.ultima.revision, pB.revision, 'Caso 7: «escrito» con la revisión posterior de la misma sesión');
  // 8 · la relectura encuentra la revisión de OTRO aparato.
  srv = servidor(); srv.ponerHorario(HT);
  x = await abrir(srv, 'X'); await x.guardar(); // intención de X
  const yy = await abrir(srv, 'Y'); // AI
  let soltarX; const esperaX = new Promise((res) => { soltarX = res; });
  const pX = x.g.prepararEscritura({ ...x.actual }, x.actual); srv.ponerHorario(pX.valor); x.g.despuesDeGuardar(pX, esperaX);
  const pY = yy.g.prepararEscritura({ ...yy.actual }, yy.actual); srv.ponerHorario(pY.valor); // Y escribe antes de que X relea
  soltarX(); await x.g.esperar();
  ok(srv.fila('X').testigo.visto && srv.fila('X').testigo.visto.ultima.revision === pY.revision && !srv.fila('X').testigo.escrito, 'Caso 8: la revisión de otro aparato en la relectura → «visto»');
  // 9 · intenciones a la vez en varios aparatos.
  srv = servidor(); srv.ponerHorario(HT);
  const a = await abrir(srv, 'A'); const b = await abrir(srv, 'B');
  await Promise.all([a.guardar(), b.guardar()]);
  ok(srv.fila('A').testigo.intenciones.length === 1 && srv.fila('B').testigo.intenciones.length === 1, 'Caso 9: las dos intenciones se conservan, cada una en su fila');
  eq(srv.registros().length, 0, 'Caso 9: nada se registra');
  ok((await b.guardar()).conTestigo, 'Caso 9: cualquiera habilita el testigo');
}

console.log('\n── 11 · Casos 10–14: X e Y, copias antiguas y C ──');
async function escenarioXY(orden) {
  const srv = servidor(); srv.ponerHorario(HT);
  const y = await abrir(srv, 'Y'); // E2 desde el principio (pestaña antigua)
  const x = await abrir(srv, 'X'); await x.guardar(); // intención de X
  return { srv, x, y, orden };
}
{
  // 10 · X demuestra R y después Y (empezó en E2) guarda sin testigo con version 1.
  let { srv, x, y } = await escenarioXY();
  const pR = await x.guardar(); ok(vista(x).demostrado && pR.conTestigo, 'Escenario 10: X demuestra R');
  const pY = y.g.prepararEscritura({ ...y.actual, de: 'Y' }, y.actual); srv.ponerHorario(pY.valor);
  eq([pY.valor.version, 'testigo' in pY.valor], [1, false], 'Y (en E2) escribe con version 1 y sin testigo');
  ok(conceptoDelHorario({ existe: true, valor: srv.horario() }).estructural, 'El horario queda estructuralmente válido (concepto 1)…');
  srv.fallar.insertar = 1;
  const z = await abrir(srv, 'Z', { horas: 1 });
  eq(vista(z).estado, 'C', 'Caso 10: …pero sin el concepto 2 → C, nunca E1');
  eq(motivo(z), MOTIVOS_BLOQUEO_GUARDIA.incidencia, 'Caso 10: bloqueo hasta confirmar el registro');
  await z.g.reintentar(); await z.g.esperar();
  eq(motivo(z), null, 'Caso 10: confirmado, Horarios vuelve a escribir');
  let ev = await z.g.evaluar({ versionMinima: VERSION });
  eq([ev.condiciones[1].estado, ev.condiciones[2].estado], ['no_cumple', 'no_verificable'], 'Caso 10: condición 2 no cumple, condición 3 no verificable');
  // 11 · Y escribe antes de R.
  ({ srv, x, y } = await escenarioXY());
  const pY11 = y.g.prepararEscritura({ ...y.actual }, y.actual); srv.ponerHorario(pY11.valor);
  await x.guardar();
  const z11 = await abrir(srv, 'Z', { horas: 1 });
  eq([vista(z11).estado, srv.registros().length], ['E1', 0], 'Caso 11: Y escribe antes de R → E1, sin C');
  // 12 · la relectura de X llega después de la escritura de Y.
  ({ srv, x, y } = await escenarioXY());
  let soltar; const espera = new Promise((res) => { soltar = res; });
  const pX = x.g.prepararEscritura({ ...x.actual }, x.actual); srv.ponerHorario(pX.valor); x.g.despuesDeGuardar(pX, espera);
  const pY12 = y.g.prepararEscritura({ ...y.actual }, y.actual); srv.ponerHorario(pY12.valor);
  soltar(); await x.g.esperar();
  ok(!srv.fila('X').testigo.escrito && !srv.fila('X').testigo.visto, 'Caso 12: la relectura encuentra el concepto 3 y no demuestra nada');
  const z12 = await abrir(srv, 'Z', { horas: 1 });
  eq([vista(z12).estado, srv.registros().length], ['AI', 0], 'Caso 12: AI (aunque el horario sea estructuralmente válido), nunca E1 ni C');
  // 13 · copia antigua y después una A-bis sin testigo.
  ({ srv, x, y } = await escenarioXY());
  await x.guardar(); srv.copiaAntigua({ de: 'antigua' });
  const pY13 = y.g.prepararEscritura({ ...y.actual }, y.actual); srv.ponerHorario(pY13.valor);
  const z13 = await abrir(srv, 'Z', { horas: 1 });
  eq(vista(z13).estado, 'C', 'Caso 13: copia antigua y después A-bis sin testigo → C, nunca E1 ni «inocua»');
  // 14 · copia antigua y después una A-bis con testigo (ventana V2).
  ({ srv, x, y } = await escenarioXY());
  await x.guardar(); srv.copiaAntigua({ de: 'antigua' });
  x.actual = normalizarHorarioTop(srv.horario());
  await x.guardar();
  const z14 = await abrir(srv, 'Z', { horas: 1 });
  eq([vista(z14).estado, srv.registros().length], ['E1', 0], 'Caso 14: con testigo después de la copia antigua → E1 (ventana V2: la prueba documenta que NO se ve)');
}

console.log('\n── 12 · Casos 15–19: ilegible, C que se arregla, C sin confirmar, supresión y pestañas antiguas ──');
async function demostrado(aparato = 'X') {
  const srv = servidor(); srv.ponerHorario(HT);
  const x = await abrir(srv, aparato); await x.guardar(); await x.guardar();
  return { srv, x };
}
{
  // 15
  for (const [nombre, valor] of [['con version', { ...HT, version: 1, testigo: 'roto' }], ['sin version', { ...HT, testigo: [] }]]) {
    const { srv } = await demostrado();
    srv.ponerHorario(valor);
    const z = await abrir(srv, 'Z', { horas: 1 });
    eq([vista(z).estado, srv.registros()[0] && srv.registros()[0].motivo], ['B', 'testigo_ilegible'], `Caso 15: testigo ilegible (4a, ${nombre}) tras la demostración → B (testigo_ilegible)`);
  }
  {
    const { srv } = await demostrado();
    srv.ponerHorario({ ...HT, version: 1, testigo: { formato: 2, revision: 'r' } });
    const z = await abrir(srv, 'Z', { horas: 1 });
    eq([vista(z).estado, srv.registros().length], ['no_verificable', 0], 'Caso 15: con un formato posterior (4b) → lectura no verificable, sin registro');
  }
  // 16
  {
    const { srv, x } = await demostrado();
    srv.ponerHorario({ ...normalizarHorarioTop(srv.horario()), testigo: undefined, version: 1 });
    srv.ponerHorario(JSON.parse(JSON.stringify(srv.horario())));
    await abrir(srv, 'Z', { horas: 1 });
    eq(srv.registros().map((r) => r.clase), ['ambigua'], 'Caso 16: escenario con una C registrada');
    x.actual = normalizarHorarioTop(srv.horario()); await x.guardar();
    const z2 = await abrir(srv, 'W', { horas: 1 });
    eq(vista(z2).estado, 'E1', 'Caso 16: una escritura vuelve a poner el testigo → E1 al cargar…');
    const ev = await z2.g.evaluar({ versionMinima: VERSION });
    eq([ev.condiciones[2].estado, ev.condiciones[1].estado], ['no_verificable', 'no_cumple'], 'Caso 16: …pero condición 3 no verificable y condición 2 no cumple, hasta resolverla');
  }
  // 17 · C-1: un registro de C sin poder confirmarse → Horarios sigue bloqueado.
  for (const [nombre, preparar] of [['sin conexión', (s) => { s.fallar.insertar = 3; }], ['error definitivo', (s) => { s.fallar.definitivo = 3; }],
    ['respuesta incierta', (s) => { s.fallar.leerPropia = 0; s.fallar.perderRespuesta = 1; s.fallar.noAplicarSinRespuesta = 1; s.antes.insertar = async () => { s.fallar.leerPropia = 2; }; }]]) {
    const { srv } = await demostrado();
    srv.ponerHorario({ ...normalizarHorarioTop(srv.horario()), testigo: undefined });
    preparar(srv);
    const z = await abrir(srv, 'Z', { horas: 1 });
    eq(vista(z).estado, 'C', `Caso 17 (${nombre}): C`);
    eq(motivo(z), MOTIVOS_BLOQUEO_GUARDIA.incidencia, `Caso 17 (${nombre}): Horarios sigue bloqueado (C-1, estado ${vista(z).estadoRegistro})`);
    ok(z.g.prepararEscritura({ ...HT }, HT).conTestigo === false, `Caso 17 (${nombre}): y no se prepara ninguna escritura`);
  }
  // 18 · el mismo estado ambiguo en dos cargas: un registro; un estado distinto: otro.
  {
    const { srv, x } = await demostrado();
    void x;
    srv.ponerHorario({ ...normalizarHorarioTop(srv.horario()), testigo: undefined });
    await abrir(srv, 'Z', { horas: 1 });
    const z2 = await abrir(srv, 'Z', { horas: 1 });
    eq(srv.registros().length, 1, 'Caso 18: el mismo estado ambiguo en dos cargas → un solo registro');
    ok(vista(z2).clasificacion.suprimido && motivo(z2) === null, 'Caso 18: el episodio suprimido no bloquea');
    await abrir(srv, 'W', { horas: 1 });
    eq(srv.registros().length, 1, 'Caso 18: …tampoco desde otro aparato (misma huella)');
    srv.ponerHorario({ ...srv.horario(), otra: 'cosa' });
    await abrir(srv, 'Z', { horas: 1 });
    eq(srv.registros().length, 2, 'Caso 18: un estado distinto → un registro nuevo');
  }
  // 19 · pestaña abierta mucho tiempo en E2 que guarda días después de la demostración.
  {
    const srv = servidor(); srv.ponerHorario(HT);
    const vieja = await abrir(srv, 'V'); // E2, se queda abierta
    const x = await abrir(srv, 'X', { horas: 1 }); await x.guardar(); await x.guardar();
    const p = vieja.g.prepararEscritura({ ...vieja.actual }, vieja.actual); srv.ponerHorario(p.valor);
    const z = await abrir(srv, 'Z', { horas: 72 });
    eq(vista(z).estado, 'C', 'Caso 19: la pestaña E2 que guarda días después de la demostración → C, nunca B');
  }
}

console.log('\n── 13 · Casos 20–23: ni falsos positivos, ni pérdidas sin ver, condición 3 y relecturas ──');
{
  // 20 · cero registros en uso normal.
  const srv = servidor(); srv.ponerHorario(HT);
  const x = await abrir(srv, 'X');
  for (let i = 0; i < 6; i += 1) await x.guardar();
  const deshacer = x.g.prepararEscritura({ ...HT }, x.actual); x.actual = deshacer.valor; srv.ponerHorario(deshacer.valor); x.g.despuesDeGuardar(deshacer, Promise.resolve()); await x.g.esperar();
  await x.guardar({}, { llega: false }); // sin conexión: se queda en la cola de saveData…
  srv.ponerHorario(x.actual); // …y llega al volver
  const x2 = await abrir(srv, 'X', { horas: 1 });
  srv.fallar.leerTodas = 1; await abrir(srv, 'X', { horas: 1 });
  const y = await abrir(srv, 'Y', { horas: 1 }); await y.guardar(); await x2.guardar(); await y.guardar();
  await abrir(srv, 'X', { horas: 1 }); await abrir(srv, 'Y', { horas: 1 });
  eq(srv.registros().length, 0, 'Caso 20: un aparato en uso normal, Deshacer, sin conexión, lecturas fallidas y dos aparatos con el testigo demostrado → cero registros');
  // 21 · ninguna pérdida pasada por alto.
  const casos = [
    ['concepto 3 sin version', (s) => s.copiaAntigua(), 'B'],
    ['4a: testigo null', (s) => s.ponerHorario({ ...HT, version: 1, testigo: null }), 'B'],
    ['4a: valor no objeto', (s) => s.ponerHorario([1, 2]), 'B'],
    ['fila ausente', (s) => s.borrarHorario(), 'B'],
    ['concepto 3 con version 1', (s) => s.ponerHorario({ ...HT, version: 1 }), 'C'],
  ];
  for (const [nombre, romper, esperado] of casos) {
    const d = await demostrado();
    romper(d.srv);
    const z = await abrir(d.srv, 'Z', { horas: 1 });
    eq(vista(z).estado, esperado, `Caso 21: ${nombre} tras la demostración → ${esperado} (ninguno da E1)`);
  }
  // 22 · condición 3 nunca cumple con una intención sola ni con una C sin resolver.
  const s22 = servidor(); s22.ponerHorario(HT);
  const a = await abrir(s22, 'A'); await a.guardar();
  ok((await a.g.evaluar({ versionMinima: VERSION })).condiciones[2].estado !== 'cumple', 'Caso 22: con una intención sola, la condición 3 no cumple');
  const src = sinComentarios(leer('src/lib/guardiaHorario.js'));
  const cuerpo = src.slice(src.indexOf('export function evaluarCondicionesB'), src.indexOf('function condicionVersiones'));
  ok(cuerpo.length > 100 && !/intenciones/.test(cuerpo), 'Caso 22: el evaluador no lee testigo.intenciones (leyendo el código)');
  // 23 · relectura sin testigo dentro de la sesión.
  const s23 = servidor(); s23.ponerHorario(HT);
  const b = await abrir(s23, 'B'); await b.guardar();
  const escritas = s23.escriturasGuardia();
  const pb = b.g.prepararEscritura({ ...b.actual }, b.actual); s23.ponerHorario({ ...HT }); b.g.despuesDeGuardar(pb, Promise.resolve()); await b.g.esperar();
  eq([s23.escriturasGuardia(), s23.registros().length], [escritas, 0], 'Caso 23: relectura sin testigo → ninguna escritura en la guardia ni registro');
}

console.log('\n── 14 · Casos 24–27: las variantes de 4a y 4b ──');
{
  const T = { formato: 1, revision: 'r' };
  const variantes = [['testigo texto', 'x'], ['testigo lista', []], ['testigo null', null], ['formato "1"', { ...T, formato: '1' }], ['formato 0', { ...T, formato: 0 }],
    ['formato 1,5', { ...T, formato: 1.5 }], ['formato −1', { ...T, formato: -1 }], ['sin revision', { formato: 1 }], ["revision ''", { ...T, revision: '' }], ['revision 5', { ...T, revision: 5 }]];
  for (const [nombre, testigo] of variantes) {
    const d = await demostrado();
    d.srv.ponerHorario({ ...HT, version: 1, testigo });
    const z = await abrir(d.srv, 'Z', { horas: 1 });
    eq([vista(z).estado, d.srv.registros()[0] && d.srv.registros()[0].motivo], ['B', 'testigo_ilegible'], `Caso 24: ${nombre} → B (testigo_ilegible), nunca E1`);
  }
  {
    const d = await demostrado(); d.srv.ponerHorario({ ...HT, testigo: T });
    eq(vista(await abrir(d.srv, 'Z', { horas: 1 })).estado, 'B', 'Caso 25: testigo con forma válida sin version, con demostración → B');
    const s = servidor(); s.ponerHorario({ ...HT, testigo: T });
    eq(vista(await abrir(s, 'Z')).estado, 'E2', 'Caso 25: …y sin demostración → E2');
  }
  for (const v of [[], null, 7, 'texto']) {
    const d = await demostrado(); d.srv.ponerHorario(v);
    const z = await abrir(d.srv, 'Z', { horas: 1 });
    eq([vista(z).estado, d.srv.registros()[0] && d.srv.registros()[0].motivo], ['B', 'testigo_ilegible'], `Caso 26: horarioTop ${JSON.stringify(v)} con demostración → B (testigo_ilegible)`);
    const s = servidor(); s.ponerHorario(v);
    eq(vista(await abrir(s, 'Z')).estado, 'E2', `Caso 26: ${JSON.stringify(v)} sin demostración → E2`);
  }
  {
    const d = await demostrado(); d.srv.ponerHorario({ ...HT, version: 1, testigo: { formato: 2, revision: 'r', base: null } });
    const z = await abrir(d.srv, 'Z', { horas: 1 });
    eq([vista(z).estado, d.srv.registros().length, motivo(z)], ['no_verificable', 0, MOTIVOS_BLOQUEO_GUARDIA.noVerificable], 'Caso 27: formato 2 → lectura no verificable, sin registro ni clasificación');
  }
}

console.log('\n── 15 · Caso 28: propiedad sobre entradas generadas ──');
{
  const valores = [undefined, null, 7, 'x', [], {}, { ...HT }];
  const versiones = [undefined, 1, 2, 'x'];
  const testigos = [undefined, null, 'x', [], {}, { formato: 1 }, { formato: 1, revision: 'r' }, { formato: 1, revision: '' }, { formato: 2, revision: 'r' }, { formato: '1', revision: 'r' }, { formato: 1.5, revision: 'r' }];
  const fila = (dem, int) => ({ formato: 1, aparato: 'X', secuencia: 1, ultimaOperacion: 'o', primeraVezA: {}, visitas: {}, testigo: { intenciones: int ? [{ id: 'i' }] : [], ...(dem ? { visto: { ultima: { revision: 'r0', conocidas: [] } } } : {}) }, detecciones: [], retiradas: [], resoluciones: [] });
  let total = 0; let rotos = 0;
  for (const base of valores) for (const v of versiones) for (const t of testigos) for (const dem of [false, true]) for (const int of [false, true]) for (const existe of [true, false]) {
    let valor = base;
    if (base && typeof base === 'object' && !Array.isArray(base)) { valor = { ...base }; if (v !== undefined) valor.version = v; if (t !== undefined) valor.testigo = t; }
    const horario = { ok: true, existe, valor: existe ? valor : null };
    const c = conceptoDelHorario(horario);
    const cl = clasificarHorario({ lectura: { ok: true, filas: [fila(dem, int)] }, horario, aparato: 'X', huella: null, guardiaA: guardiaDeVersionHorario(existe ? valor : undefined) });
    total += 1;
    const e1SiYSoloSi2 = (cl.clase === 'E1') === (c.concepto === '2');
    const bcSoloConDemostracion = !['B', 'C'].includes(cl.clase) || dem;
    const estructuralSin2NuncaE1 = !(c.estructural && c.concepto !== '2' && cl.clase === 'E1');
    if (!(e1SiYSoloSi2 && bcSoloConDemostracion && estructuralSin2NuncaE1)) rotos += 1;
  }
  ok(total > 1000 && rotos === 0, `Caso 28: en ${total} entradas, E1 si y solo si el concepto 2; B o C solo con un testigo demostrado; concepto 1 sin el 2 nunca E1 (${rotos} fallos)`);
}

console.log('\n── 16 · Casos 29–30: la relectura del §7.5 y la condición 3 por estados ──');
{
  for (const [nombre, valor] of [['concepto 3', (r) => ({ ...HT, version: 1 })], ['4a', (r) => ({ ...HT, version: 1, testigo: [] })],
    ['revisión de esta sesión dentro de un testigo 4a', (r) => ({ ...HT, testigo: { formato: 1, revision: r } })]]) {
    const srv = servidor(); srv.ponerHorario(HT);
    const x = await abrir(srv, 'X'); await x.guardar();
    const p = x.g.prepararEscritura({ ...x.actual }, x.actual);
    const antes = srv.escriturasGuardia();
    srv.ponerHorario(valor(p.revision));
    x.g.despuesDeGuardar(p, Promise.resolve()); await x.g.esperar();
    ok(srv.escriturasGuardia() === antes && !srv.fila('X').testigo.escrito && !srv.fila('X').testigo.visto && srv.registros().length === 0,
      `Caso 29: la relectura encuentra ${nombre} → ni «escrito», ni «visto», ni registro`);
  }
  const estructural = { ...HT, version: 1 };
  const filaCon = (extra) => ({ formato: 1, aparato: 'X', secuencia: 1, ultimaOperacion: 'o', primeraVezA: {}, visitas: { [VERSION]: { ultima: { en: new Date().toISOString() } } }, testigo: { intenciones: [], ...extra.testigo }, detecciones: extra.detecciones || [], retiradas: [], resoluciones: [] });
  const dem = { visto: { ultima: { revision: 'r', conocidas: [] } } };
  const estados = [
    ['E2', [filaCon({ testigo: {} })], estructural, 'no_verificable'],
    ['AI', [filaCon({ testigo: { intenciones: [{ id: 'i' }] } })], estructural, 'no_verificable'],
    ['B', [filaCon({ testigo: dem, detecciones: [{ id: 'd', clase: 'perdida', motivo: 'testigo_ausente' }] })], { ...HT }, 'no_cumple'],
    ['C', [filaCon({ testigo: dem, detecciones: [{ id: 'd', clase: 'ambigua', motivo: 'testigo_ausente' }] })], estructural, 'no_verificable'],
  ];
  for (const [nombre, filas, valor, esperado] of estados) {
    const ev = evaluarCondicionesB({ lectura: { ok: true, filas }, horario: { ok: true, existe: true, valor }, versionMinima: VERSION });
    eq(ev.condiciones.find((c) => c.id === 'testigo').estado, esperado, `Caso 30: ${nombre} con un horario estructuralmente válido sin el concepto 2 → condición 3 ${esperado}`);
  }
}

console.log('\n── 17 · Estados de una escritura, reintentos y concurrencia (§5) ──');
{
  // Conflicto repetido → E7, y reintentar con los mismos identificadores.
  const srv = servidor(); srv.ponerHorario(HT);
  const x = await abrir(srv, 'X'); await x.guardar(); await x.guardar();
  srv.copiaAntigua();
  let rompe = 0;
  const original = srv.t.actualizarSiBase;
  srv.t.actualizarSiBase = async (...a) => { if (rompe < 2) { rompe += 1; const f = srv.filas.get(claveDeGuardia('Z')); f.value = { ...f.value, secuencia: f.value.secuencia + 1, ultimaOperacion: `otro${rompe}` }; } return original(...a); };
  srv.filas.set(claveDeGuardia('Z'), { value: { formato: 1, aparato: 'Z', secuencia: 1, ultimaOperacion: 'z0', primeraVezA: {}, visitas: { [VERSION]: { ultima: { fecha: '2000-01-01' } } }, detecciones: [], retiradas: [], resoluciones: [] }, updated_at: 'x' });
  const z = await abrir(srv, 'Z', { horas: 1 });
  eq(vista(z).estadoRegistro, 'E7', 'Dos conflictos seguidos → E7 (conflicto repetido)');
  eq(motivo(z), MOTIVOS_BLOQUEO_GUARDIA.incidencia, 'E7 bloquea Horarios');
  const opAntes = vista(z).operaciones.find((o) => o.tipo === 'registro').opId;
  const idAntes = vista(z).registroPendiente.id;
  await z.g.reintentar(); await z.g.esperar();
  eq([vista(z).estadoRegistro, vista(z).operaciones.find((o) => o.tipo === 'registro').opId], ['E6', opAntes], 'Reintentar confirma con el MISMO opId');
  eq(srv.registros().filter((r) => r.id === idAntes).length, 1, '…y el mismo id de registro, una sola vez');
  // Respuesta perdida en un insert que sí se aplicó: la relectura lo confirma.
  const s2 = servidor(); s2.ponerHorario(HT); s2.fallar.perderRespuesta = 1;
  const a = await abrir(s2, 'A');
  ok(vista(a).operaciones.every((o) => o.estado === 'E6') && s2.fila('A'), 'Respuesta perdida tras aplicarse → la relectura confirma (E6)');
  // Carrera de inserciones (23505): dos pestañas del mismo aparato, sin candado.
  const s3 = servidor(); s3.ponerHorario(HT);
  const g1 = crearGuardiaDeHorario({ transporte: s3.t, usuario: 'u', aparato: 'C', candado: null, versionApp: VERSION });
  const g2 = crearGuardiaDeHorario({ transporte: s3.t, usuario: 'u', aparato: 'C', candado: null, versionApp: VERSION });
  await Promise.all([g1.comprobar({ guardiaA: guardiaDeVersionHorario(HT) }), g2.comprobar({ guardiaA: guardiaDeVersionHorario(HT) })]);
  await Promise.all([g1.esperar(), g2.esperar()]);
  ok(leerFilaDeGuardia(claveDeGuardia('C'), s3.fila('C')).ok && g1.vista().operaciones.every((o) => o.estado === 'E6') && g2.vista().operaciones.every((o) => o.estado === 'E6'), 'Carrera de inserciones (dos pestañas o un clon): las dos confirman y la fila es válida');
  // Escritores intercalados: varias intenciones a la vez desde dos pestañas del mismo aparato.
  const p1 = g1.prepararEscritura({ ...HT }, HT); const p2 = g2.prepararEscritura({ ...HT }, HT);
  void p1; void p2;
  await Promise.all([g1.esperar(), g2.esperar()]);
  eq(s3.fila('C').testigo.intenciones.length, 2, 'Escritores intercalados: las dos intenciones se conservan (ninguna pisa a la otra)');
  // Error definitivo → E3 (no aplicada) y bloquea si es un registro.
  const d = await demostrado(); d.srv.copiaAntigua(); d.srv.fallar.definitivo = 1;
  const zz = await abrir(d.srv, 'Q', { horas: 1 });
  eq([vista(zz).estadoRegistro, motivo(zz)], ['E3', MOTIVOS_BLOQUEO_GUARDIA.incidencia], 'Un error definitivo deja el registro sin enviar (E3) y Horarios bloqueado');
  // El candado se usa si existe.
  let usado = 0;
  const conCandado = crearGuardiaDeHorario({ transporte: servidor().t, usuario: 'u', aparato: 'L', candado: (fn) => { usado += 1; return fn(); } });
  await conCandado.comprobar({}); await conCandado.esperar();
  ok(usado >= 1, 'Con navigator.locks (o su equivalente), la escritura va dentro del candado');
}

console.log('\n── 18 · Supresión y repetición legítima (§6.7) ──');
{
  const d = await demostrado();
  d.srv.copiaAntigua();
  await abrir(d.srv, 'Z', { horas: 1 });
  eq(d.srv.registros().length, 1, 'Escenario: una pérdida registrada');
  d.x.actual = normalizarHorarioTop(d.srv.horario());
  await d.x.guardar(); // vuelve a poner el testigo
  await abrir(d.srv, 'Z', { horas: 1 }); // E1: el visto de Z conoce el registro
  const antes = d.srv.horario();
  d.srv.copiaAntigua(); // MISMO contenido otra vez, sin testigo
  const { version, testigo, ...mismo } = antes; void version; void testigo;
  d.srv.ponerHorario(mismo);
  await abrir(d.srv, 'W', { horas: 1 });
  ok(d.srv.registros().length === 2, 'Repetición legítima: misma huella pero el testigo se vio después del registro → registro nuevo');
  // Huella null: suprime con un registro propio sin un visto posterior en esa fila.
  const filas = [{ formato: 1, aparato: 'X', secuencia: 3, ultimaOperacion: 'o', primeraVezA: {}, visitas: {}, testigo: { visto: { ultima: { secuencia: 1, conocidas: [] } } }, detecciones: [{ id: 'd', secuencia: 2 }], retiradas: [], resoluciones: [] }];
  ok(!!G.suprimir({ filas, registros: resumenDeFilas(filas).registros, aparato: 'X', huella: null }), 'Huella null: se suprime si la fila propia tiene un registro sin un visto posterior');
  filas[0].testigo.visto.ultima.secuencia = 5;
  ok(!G.suprimir({ filas, registros: resumenDeFilas(filas).registros, aparato: 'X', huella: null }), '…y no si hay un visto posterior en esa fila');
}

console.log('\n── 18b · «Visto»: la primera vez, cuando cambian las conocidas y una vez al día (§6.6) ──');
{
  const d = await demostrado();
  await abrir(d.srv, 'Z', { horas: 1 }); // E1: visto de Z
  const v1 = d.srv.fila('Z').testigo.visto.ultima;
  d.x.actual = normalizarHorarioTop(d.srv.horario()); await d.x.guardar(); // otra revisión, el mismo día
  await abrir(d.srv, 'Z');
  eq(d.srv.fila('Z').testigo.visto.ultima, v1, 'Otra revisión el mismo día y las mismas conocidas → no se reescribe «visto»');
  d.srv.filas.set('horarioGuardia:Q', { value: { formato: 1, aparato: 'Q', secuencia: 1, ultimaOperacion: 'q', primeraVezA: {}, visitas: { [VERSION]: { ultima: { fecha: '2000-01-01' } } }, detecciones: [{ id: 'nuevo-registro' }], retiradas: [], resoluciones: [] }, updated_at: 'x' });
  await abrir(d.srv, 'Z');
  ok(d.srv.fila('Z').testigo.visto.ultima.conocidas.includes('nuevo-registro'), 'Cambian las conocidas → se reescribe con ellas');
  await abrir(d.srv, 'Z', { horas: 30 });
  ok(d.srv.fila('Z').testigo.visto.ultima.en > v1.en && G.fechaLocal(new Date(d.srv.fila('Z').testigo.visto.ultima.en)) !== G.fechaLocal(new Date(v1.en)), 'Otro día → se reescribe');
}

console.log('\n── 19 · El evaluador de la B (§9) con cada parámetro sin definir ──');
{
  const ahora = new Date('2026-11-14T10:00:00Z');
  const reciente = '2026-11-10T10:00:00Z'; const vieja = '2026-09-01T10:00:00Z';
  const fila = (ap, visitas, extra = {}) => ({ formato: 1, aparato: ap, secuencia: 4, ultimaOperacion: 'o', primeraVezA: {}, visitas, testigo: { visto: { ultima: { revision: 'r', conocidas: [] } } }, detecciones: [], retiradas: [], resoluciones: [], ...extra });
  const conc2 = { ok: true, existe: true, valor: { ...HT, version: 1, testigo: { formato: 1, revision: 'r' } } };
  const ev = (filas, o = {}) => evaluarCondicionesB({ lectura: { ok: true, filas }, horario: conc2, ahora, ...o });
  const est = (r, id) => r.condiciones.find((c) => c.id === id).estado;
  const sinParams = ev([fila('X', { '3.162.0': { ultima: { en: reciente } } })]);
  eq([est(sinParams, 'margen'), est(sinParams, 'versiones'), est(sinParams, 'confirmacion')], ['no_verificable', 'no_verificable', 'no_verificable'], 'Sin margenDias ni versionMinima: margen y versiones no verificables; confirmación siempre no verificable');
  eq(sinParams.cumpleTodas, false, 'La B no se habilita en la A-bis');
  const conMin = ev([fila('X', { '3.162.0': { ultima: { en: reciente } } })], { versionMinima: '3.162.0', margenDias: 7 });
  eq([est(conMin, 'margen'), est(conMin, 'incidencias'), est(conMin, 'testigo'), est(conMin, 'versiones')], ['no_verificable', 'cumple', 'cumple', 'cumple'], 'Todo en orden salvo la hora del servidor y la confirmación');
  eq(est(ev([fila('X', { '3.150.0': { ultima: { en: reciente } } })], { versionMinima: '3.162.0' }), 'versiones'), 'no_cumple', 'Una visita reciente con una versión anterior → no cumple');
  eq(est(ev([fila('X', { desarrollo: { ultima: { en: reciente } } })], { versionMinima: '3.162.0' }), 'versiones'), 'no_verificable', 'Una visita reciente no comparable → no verificable');
  eq(est(ev([fila('X', { '3.162.0': { ultima: { en: 'no es fecha' } } })], { versionMinima: '3.200.0' }), 'versiones'), 'no_cumple', 'Una fecha inválida cuenta como reciente');
  eq(est(ev([fila('X', { '3.100.0': { ultima: { en: vieja } } })], { versionMinima: '3.162.0' }), 'versiones'), 'no_cumple', 'Sin visitas en 30 días con una versión menor → bloquea');
  eq(est(ev([fila('X', { '3.100.0': { ultima: { en: vieja } } }), fila('Y', { '3.162.0': { ultima: { en: reciente } } }, { retiradas: [{ id: 'rt', aparatoRetirado: 'X', secuenciaVista: 4 }] })], { versionMinima: '3.162.0' }), 'versiones'), 'cumple', '…salvo con una retirada vigente (secuenciaVista = secuencia actual)');
  eq(est(ev([fila('X', { '3.100.0': { ultima: { en: vieja } } }), fila('Y', {}, { retiradas: [{ id: 'rt', aparatoRetirado: 'X', secuenciaVista: 3 }] })], { versionMinima: '3.162.0' }), 'versiones'), 'no_cumple', 'Una retirada no vigente no vale');
  eq(est(ev([fila('X', {}, { detecciones: [{ id: 'd', clase: 'perdida' }] })]), 'incidencias'), 'no_cumple', 'Una incidencia sin resolver → condición 2 no cumple');
  eq(est(ev([fila('X', {}, { detecciones: [{ id: 'd', clase: 'perdida' }], resoluciones: [{ id: 'rs', deteccionIds: ['d'], decision: DECISIONES_RESOLUCION[0] }] })]), 'incidencias'), 'cumple', 'Con una resolución reconocida que nombra su id → cumple');
  eq(est(ev([fila('X', {}, { detecciones: [{ id: 'd', clase: 'perdida' }], resoluciones: [{ id: 'rs', deteccionIds: ['d'], decision: 'inventada' }] })]), 'incidencias'), 'no_cumple', 'Una decisión no reconocida no cuenta');
  eq(est(ev([fila('X', {})], { pendientes: 1 }), 'incidencias'), 'no_verificable', 'Con escrituras sin confirmar → no verificable');
  const nv = evaluarCondicionesB({ lectura: { ok: false }, horario: { ok: false }, versionMinima: '3.162.0' });
  ok(nv.condiciones.every((c) => c.estado === 'no_verificable'), 'Sin lectura: todo no verificable');
  ok(versionComparable('3.162.0') && !versionComparable('desarrollo') && compararVersiones('3.10.0', '3.9.9') === 1, 'Las versiones se comparan número a número');
}

console.log('\n── 20 · Rechazos de los cuatro nombres (saveData y la cola) ──');
{
  for (const k of ['horarioGuardia:X', 'horarioGuardia', 'horarioAparatos', 'horarioAparatos:X']) {
    ok(esClaveDeGuardiaHorario(k), `${k}: es una clave protegida`);
    const r = Y.antesDeGuardar(k, { valor: {} });
    ok(r.sale === false && r.error && r.error.code === 'clave_protegida', `${k}: la cola la rechaza antes de la red`);
  }
  ok(!esClaveDeGuardiaHorario('horarioTop') && !esClaveDeGuardiaHorario('horarioGuardiaX'), 'horarioTop (y un nombre parecido) no son claves de la guardia (horarioTop la protege su escritor, E1)');
  const sup = sinComentarios(leer('src/lib/supabase.js'));
  ok(/if \(esClaveDeGuardiaHorario\(key\)\) \{[\s\S]{0,200}return \{ ok: false, error: ERROR_CLAVE_GUARDIA, bloqueado: true, protegida: true \};/.test(sup)
    && sup.indexOf('esClaveDeGuardiaHorario(key)') < sup.indexOf('antesDeGuardar(key'), 'saveData las rechaza antes de la cola');
  ok(/\.filter\(\(\[clave\]\) => !esClaveDeGuardiaHorario\(clave\)\)/.test(leer('src/lib/sincronizacion.js')), 'Y nunca se reenvían (pendientesParaReintentar las filtra)');
  const tramo = sup.slice(sup.indexOf('const claveDeGuardiaValida'), sup.indexOf('export const transporteDeGuardia'));
  ok(tramo.length > 500 && !/updated_at:/.test(tramo), 'El transporte de la guardia nunca envía updated_at');
  ok(/\.like\('key', `\$\{PREFIJO_GUARDIA_HORARIO\}%`\)/.test(tramo) && /\.eq\('value->>ultimaOperacion', base\)/.test(tramo) && /code === '23505'/.test(tramo), 'Lee por prefijo, actualiza con condición y trata 23505 como conflicto');
  ok((tramo.match(/claveDeGuardiaValida\(clave\)/g) || []).length === 3, 'Cada operación sobre una fila se niega a tocar otra clave');
}

console.log('\n── 21 · Integración en App.jsx y en la pantalla ──');
{
  const app = sinComentarios(leer('src/App.jsx'));
  /* 🔓 E1 (TP-15 A) — se da la vuelta: la `version` y el testigo ya no los pone App.jsx al guardar, los pone el
     escritor protegido AL SALIR (`escritorHorario.js` llama a `guardia.prepararEscritura` con la revisión
     confirmada). Lo que se protege es lo mismo: que el horario no se escriba sin ellos ni en solo lectura. */
  ok(/if \(patch\.horarioTop\) \{ setHorarioTop\(patch\.horarioTop\); guardados\.push\(guardarHorario\(patch\.horarioTop, \{ automatico \}\)\); \}/.test(app), 'snapshotAndSave guarda el horario por su escritor protegido');
  ok(app.indexOf('guardarHorario(patch.horarioTop') > app.indexOf('return Promise.resolve(NO_GUARDA_HORARIO());'), '…DESPUÉS de la comprobación de solo lectura');
  ok(/if \(tocaHorario\) \{ setHorarioTop\(last\.horarioTop\); guardarHorario\(last\.horarioTop\); \}/.test(app) && /const tocaHorario = !horarioSoloLecturaRef\.current/.test(app), 'Deshacer también lo guarda por el escritor (y no en solo lectura)');
  eq((app.match(/guardarHorario\(/g) || []).length, 2, 'guardarHorario se llama solo en los dos puntos de escritura');
  eq((app.match(/saveData\(uidUser, 'horarioTop'/g) || []).length, 0, 'Ninguna escritura de horarioTop por saveData');
  const esc = sinComentarios(leer('src/lib/escritorHorario.js'));
  ok(/guardia\.prepararEscritura\(d\.valor, s\.confirmado\.existe \? s\.confirmado\.valor : null\)/.test(esc), 'El escritor prepara version y testigo con la revisión CONFIRMADA (la base, §1)');
  ok(/guardia\.despuesDeGuardar\(preparado, Promise\.resolve\(\)\)/.test(esc), 'La relectura del §7.5 sale después de un guardado ya confirmado');
  ok(/window\.addEventListener\('online', alVolver\)/.test(app) && /window\.removeEventListener\('online', alVolver\)/.test(app), 'Al volver la conexión, la guardia reintenta (y el escuchador se limpia)');
  const primerReturn = app.indexOf('if (session === undefined) return');
  ok(app.indexOf("window.addEventListener('online', alVolver)") < primerReturn && app.indexOf('guardiaHorarioRef = useRef') < primerReturn, 'Los hooks nuevos van antes de los return (regla 4)');
  ok(/guardiaHorarioRef\.current\.cerrar\(\)/.test(app), 'Al cambiar de usuario, la guardia de la sesión anterior se cierra');
  const hv = sinComentarios(leer('src/views/HorarioView.jsx'));
  eq((hv.match(/guardia=\{guardia\}/g) || []).length, 4, 'HorarioView pasa la guardia a los dos avisos y a los dos diagnósticos');
  // El normalizador conserva version y testigo; el diagnóstico no los cuenta como desconocidos.
  const conTodo = { ...HT, version: 1, testigo: { formato: 1, revision: 'r', futuro: 1 } };
  const nrm = normalizarHorarioTop(conTodo);
  eq([nrm.version, nrm.testigo], [1, conTodo.testigo], 'normalizarHorarioTop conserva version y testigo tal cual');
  eq(D.diagnosticoHorarios({ ...conTodo, config: 1 }).camposDesconocidos.horarioTop, ['config'], 'El diagnóstico no cuenta version ni testigo como campos desconocidos (sí lo que de verdad no conoce)');
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${n - fallos}/${n} comprobaciones de la guardia del horario (A-bis)`);
if (fallos) process.exit(1);
