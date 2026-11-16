// ============================================================================
// 🛡 HORARIOS · FASE 4, E1 — EL ESCRITOR PROTEGIDO DE `horarioTop` (TP-15 A y C), EL CONFLICTO DE EDICIÓN
// (D2, opción B; D2-bis), LA INCIDENCIA #5 Y LA ENTREGA CORTA (D1).
//
// Todo con DOBLES del servidor en memoria que aplican la condición de verdad: `value->testigo->>revision = base`
// (o `is null` con base nula), la clave primaria (23505), respuestas perdidas, sin conexión y el rechazo de la
// regla del servidor. Ninguna red, ningún dato de una cuenta. Las «copias antiguas» y los «otros aparatos» se
// simulan como lo que hacen: escribir directamente en el doble.
// ============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const imp = (rel) => import(pathToFileURL(join(RAIZ, rel)).href);
const E = await imp('src/lib/escritorHorario.js');
const G = await imp('src/lib/guardiaHorario.js');
const Y = await imp('src/lib/sincronizacion.js');
const V = await imp('src/lib/historialVersiones.js');
const A = await imp('src/lib/avisosHorario.js');
const H = await imp('src/lib/horario.js');

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
const copia = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`\\])\/\/.*$/gm, '$1');
const esperarTicks = async (k = 5) => { for (let i = 0; i < k; i += 1) await new Promise((r) => setTimeout(r, 0)); };

const { crearEscritorDeHorario, revisionDelSello, campoDelSello, esClaveProtegidaDeHorario, mismoContenido, MOTIVO_CONFLICTO_HORARIO, RUTA_SELLO } = E;

/* ── El doble del servidor de `horarioTop` ──────────────────────────────────── */
function servidorHorario(inicial = null) {
  const s = { existe: inicial !== null, valor: copia(inicial) };
  const fallar = { offline: false, perderRespuesta: 0, leer: 0, regla: false, antesDeEscribir: null };
  const enviados = [];
  const t = {
    async leerHorario() {
      if (fallar.offline || fallar.leer > 0) { if (fallar.leer > 0) fallar.leer -= 1; return { ok: false, sinRespuesta: true }; }
      return { ok: true, existe: s.existe, valor: copia(s.valor) };
    },
    async insertarHorario(_u, valor) {
      enviados.push({ tipo: 'insert', valor: copia(valor) });
      if (fallar.antesDeEscribir) { const fn = fallar.antesDeEscribir; fallar.antesDeEscribir = null; fn(); }
      if (fallar.offline) return { ok: false, sinRespuesta: true };
      if (s.existe) return { ok: false, conflicto: true, error: { code: '23505' } };
      s.existe = true; s.valor = copia(valor);
      if (fallar.perderRespuesta > 0) { fallar.perderRespuesta -= 1; return { ok: false, sinRespuesta: true }; }
      return { ok: true };
    },
    async actualizarHorarioSiRevision(_u, valor, base) {
      enviados.push({ tipo: 'update', valor: copia(valor), base });
      if (fallar.antesDeEscribir) { const fn = fallar.antesDeEscribir; fallar.antesDeEscribir = null; fn(); }
      if (fallar.offline) return { ok: false, sinRespuesta: true };
      const actual = revisionDelSello('horarioTop', s.existe ? s.valor : null);
      if (!s.existe || !actual.legible || actual.revision !== base) return { ok: true, aplicada: false };
      /* La regla del servidor (TP-15 B): una escritura que no trae una revisión nueva o no parte de la vigente. */
      if (fallar.regla) {
        const nueva = revisionDelSello('horarioTop', valor);
        const b = valor && valor.testigo ? valor.testigo.base ?? null : null;
        if (!nueva.revision || nueva.revision === actual.revision || b !== actual.revision) {
          return { ok: false, rechazada: true, error: { code: 'P0001', message: 'horario_revision_obsoleta' } };
        }
      }
      s.valor = copia(valor);
      if (fallar.perderRespuesta > 0) { fallar.perderRespuesta -= 1; return { ok: false, sinRespuesta: true }; }
      return { ok: true, aplicada: true };
    },
  };
  /* Otro aparato (o una copia antigua) escribe directamente. */
  const escribeOtro = (valor) => { s.existe = true; s.valor = copia(valor); };
  return { t, s, fallar, enviados, escribeOtro };
}

/* Una guardia de mentira que hace lo que hace la de la A-bis al preparar: `version: 1` y un testigo con
   revisión nueva y base = la revisión de lo que se le da como actual. */
let contadorRev = 0;
function guardiaFalsa({ bloqueo = null } = {}) {
  const g = {
    bloqueo, preparados: [], demostraciones: 0,
    prepararEscritura(nuevo, actual) {
      contadorRev += 1;
      const base = G.revisionDelTestigo(actual);
      const valor = { ...nuevo, version: 1, testigo: { formato: 1, revision: `r${contadorRev}`, base, aparato: 'A', desde: 'x', ultimaEscritura: 'x' } };
      g.preparados.push({ base });
      return { valor, conTestigo: true, arranque: false, revision: `r${contadorRev}` };
    },
    motivoBloqueo: () => g.bloqueo,
    despuesDeGuardar() { g.demostraciones += 1; return Promise.resolve(); },
  };
  return g;
}
const conRev = (rev, extra = {}) => ({ horarios: [], bloques: [], version: 1, testigo: { formato: 1, revision: rev, base: null, aparato: 'B' }, ...extra });

function crear({ inicial = conRev('r0', { n: 0 }), apartar = null, guardia = guardiaFalsa(), opciones = {} } = {}) {
  const srv = servidorHorario(inicial);
  const adoptados = [];
  const apartadas = [];
  const borradas = [];
  const w = crearEscritorDeHorario({
    transporte: srv.t, usuario: 'U', guardia,
    inicial: { valor: copia(inicial), existe: inicial !== null },
    alAdoptar: (v) => adoptados.push(copia(v)),
    apartar: apartar || (async (v) => { apartadas.push(copia(v)); return { estado: 'confirmada', opId: `op${apartadas.length}` }; }),
    reintentarApartado: async (opId) => ({ estado: 'confirmada', opId }),
    descartarApartado: async (id) => { borradas.push(id); return { estado: 'confirmada', opId: `del-${id}` }; },
    ...opciones,
  });
  return { srv, w, adoptados, apartadas, borradas, guardia };
}

console.log('\n── 1 · El contrato del sello (D3) ──');
{
  eq(RUTA_SELLO, { horarioTop: 'testigo', horarioBorradores: 'sello' }, 'Un solo sitio por clave: el testigo en horarioTop y el sello en horarioBorradores');
  eq(campoDelSello('horarioTop'), 'value->testigo->>revision', 'La condición se escribe sobre value->testigo->>revision');
  eq(revisionDelSello('horarioTop', null), { legible: true, revision: null }, 'Sin valor: revisión nula');
  eq(revisionDelSello('horarioTop', { horarios: [] }), { legible: true, revision: null }, 'Sin testigo (una copia antigua lo borró): nula');
  eq(revisionDelSello('horarioTop', { testigo: 'texto' }), { legible: true, revision: null }, 'Un testigo que no es objeto: nula (como Postgres)');
  eq(revisionDelSello('horarioTop', { testigo: [1] }), { legible: true, revision: null }, 'Un testigo lista: nula');
  eq(revisionDelSello('horarioTop', { testigo: { revision: 'abc' } }), { legible: true, revision: 'abc' }, 'Revisión de texto: tal cual (aunque el testigo no sea «válido» para la guardia)');
  eq(revisionDelSello('horarioTop', { testigo: { formato: 9, revision: 'abc' } }), { legible: true, revision: 'abc' }, 'No se «arregla» antes de comparar: un formato raro conserva su revisión');
  eq(revisionDelSello('horarioTop', { testigo: { revision: 7 } }), { legible: true, revision: '7' }, 'Un número entero: como lo imprime Postgres');
  eq(revisionDelSello('horarioTop', { testigo: { revision: true } }), { legible: true, revision: 'true' }, 'Un booleano: como lo imprime Postgres');
  eq(revisionDelSello('horarioTop', { testigo: { revision: { a: 1 } } }), { legible: false }, 'Un objeto: no legible (no se puede comparar con seguridad)');
  eq(revisionDelSello('horarioTop', { testigo: { revision: 1.5 } }), { legible: false }, 'Un decimal: no legible');
  eq(revisionDelSello('horarioBorradores', { sello: { revision: 's1' } }), { legible: true, revision: 's1' }, 'horarioBorradores lee su sello');
  let lanza = false; try { revisionDelSello('otra', {}); } catch { lanza = true; }
  ok(lanza, 'Una clave sin sello declarado no se lee a ciegas');
  ok(mismoContenido({ b: 1, a: { c: 2, d: 3 } }, { a: { d: 3, c: 2 }, b: 1 }), 'mismoContenido no depende del orden de las claves');
  ok(mismoContenido({ a: 1, version: 1, testigo: { revision: 'x' } }, { a: 1 }, { sinSello: true }) && !mismoContenido({ a: 1, version: 1 }, { a: 1 }), '…y sinSello ignora version y testigo (solo eso)');
}

console.log('\n── 2 · saveData y su cola ya no escriben horarioTop ni horarioBorradores ──');
{
  for (const k of ['horarioTop', 'horarioBorradores']) {
    ok(esClaveProtegidaDeHorario(k), `${k}: protegida`);
    const r = Y.antesDeGuardar(k, { valor: {} });
    ok(r.sale === false && r.error && r.error.code === 'clave_protegida', `${k}: la cola la rechaza antes de la red`);
  }
  ok(!esClaveProtegidaDeHorario('horarioTopX') && !esClaveProtegidaDeHorario('sueno'), 'Un nombre parecido u otra clave siguen siendo normales');
  const sup = sinComentarios(leer('src/lib/supabase.js'));
  ok(/if \(esClaveProtegidaDeHorario\(key\)\) \{[\s\S]{0,200}return \{ ok: false, error: ERROR_CLAVE_HORARIO, bloqueado: true, protegida: true \};/.test(sup)
    && sup.indexOf('esClaveProtegidaDeHorario(key)') < sup.indexOf('antesDeGuardar(key'), 'saveData las rechaza antes de la cola');
  ok(/\.filter\(\(\[clave\]\) => !esClaveProtegidaDeHorario\(clave\)\)/.test(leer('src/lib/sincronizacion.js')), 'Y nunca se reenvían con saveData (pendientesParaReintentar las filtra)');
  const tramo = sup.slice(sup.indexOf('export async function insertarHorarioPropio'), sup.indexOf('export const transporteDeHorario'));
  ok(/\.eq\('key', 'horarioTop'\)/.test(tramo) && /q\.is\(campoDelSello\('horarioTop'\), null\)/.test(tramo) && /q\.eq\(campoDelSello\('horarioTop'\), base\)/.test(tramo), 'El transporte actualiza SOLO horarioTop, con la condición sobre la revisión (o is null)');
  ok(/code === '23505'/.test(tramo) && /esRechazoDeLaRegla/.test(tramo) && (tramo.match(/\.select\('key'\)/g) || []).length === 2, 'Trata 23505 como conflicto, reconoce el rechazo de la regla y pide la fila de vuelta');
  ok(!/upsert/.test(tramo), 'Sin upsert: ni la primera fila se escribe sin condición');
}

console.log('\n── 3 · Guardar: condición sobre la revisión confirmada ──');
{
  const { srv, w, guardia } = crear();
  const r1 = await w.guardar({ horarios: [], n: 1 });
  ok(r1.ok === true, 'Un guardado sin nadie más: aplicado');
  eq(srv.enviados[0].base, 'r0', '…condicionado a la revisión que se cargó');
  eq(srv.s.valor.n, 1, '…y en la cuenta está lo nuevo');
  ok(srv.s.valor.version === 1 && srv.s.valor.testigo && srv.s.valor.testigo.revision === srv.enviados[0].valor.testigo.revision, '…con version y el testigo nuevo (los pone la guardia AL SALIR)');
  const r2 = await w.guardar({ horarios: [], n: 2 });
  ok(r2.ok === true && srv.enviados[1].base === srv.enviados[0].valor.testigo.revision, 'El siguiente se condiciona a la revisión que acaba de escribir');
  eq(guardia.preparados.map((p) => p.base), ['r0', srv.enviados[0].valor.testigo.revision], 'La guardia recibe como «actual» lo confirmado, nunca la pantalla');
  ok(w.vista().estado === 'en_orden' && !w.vista().pendiente, 'Y queda en orden, sin nada pendiente');
}

console.log('\n── 4 · Varios cambios seguidos: sale siempre el ÚLTIMO, nunca uno viejo ──');
{
  const { srv, w } = crear();
  const p1 = w.guardar({ horarios: [], n: 1 });
  const p2 = w.guardar({ horarios: [], n: 2 });
  const p3 = w.guardar({ horarios: [], n: 3 });
  const rs = await Promise.all([p1, p2, p3]);
  ok(rs.every((r) => r.ok), 'Los tres guardados se resuelven bien');
  ok(srv.enviados.length <= 2 && srv.enviados[srv.enviados.length - 1].valor.n === 3, `Lo último que sale es el último valor (${srv.enviados.map((e) => e.valor.n).join(',')})`);
  ok(srv.enviados.every((e, i, l) => i === 0 || e.valor.n >= l[i - 1].valor.n), 'Nunca sale un valor más viejo después de uno más nuevo');
  eq(srv.s.valor.n, 3, 'En la cuenta queda el último');
}

console.log('\n── 5 · D2, opción B: un cambio tuyo y otro aparato que escribió antes ──');
{
  const { srv, w, adoptados, apartadas } = crear();
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  const r = await w.guardar({ horarios: [], n: 'mio' });
  ok(r.ok === false && r.conflicto === true, 'El guardado no se aplica y dice que hay conflicto');
  eq(srv.s.valor.n, 'otro', '🚨 Lo del otro aparato sigue en la cuenta: no se ha pisado');
  eq(srv.enviados.length, 1, 'Se intentó UNA vez (condicionado) y no se reenvió el valor');
  ok(w.vista().estado === 'conflicto' && w.motivoBloqueo() === MOTIVO_CONFLICTO_HORARIO, 'El escritor queda en conflicto y bloquea Horarios (solo lectura)');
  eq(adoptados.length, 0, '🚨 La pantalla NO cambia: tu cambio sigue en pantalla');
  await esperarTicks();
  eq(apartadas.map((x) => x.n), ['mio'], 'Tu cambio se aparta en la cuenta (D2-bis), sin perderse');
  ok(w.vista().conflicto.copia.estado === 'guardada', '…y la pantalla sabe que está apartado');
  const r2 = await w.guardar({ horarios: [], n: 'mio2' });
  ok(r2.ok === false && r2.conflicto === true && srv.enviados.length === 1, 'Mientras el conflicto sigue abierto no se escribe nada (no se fuerza)');
  const r3 = await w.guardar({ horarios: [], aviso: 1 }, { automatico: true });
  ok(r3.ok === true && r3.omitido === true && srv.enviados.length === 1, '…ni siquiera lo automático (los avisos): se omite');
  // Salida 1: «Ver lo que hay ahora».
  w.verLoDeAhora();
  ok(w.vista().estado === 'en_orden' && w.motivoBloqueo() === null, '«Ver lo que hay ahora» cierra el conflicto: Horarios vuelve a guardar');
  eq(adoptados.map((x) => x.n), ['otro'], '…y la pantalla pasa a enseñar lo de la cuenta');
  const r4 = await w.guardar({ horarios: [], n: 'sobre-lo-otro' });
  ok(r4.ok === true && srv.enviados[srv.enviados.length - 1].base === 'rOtro', 'El siguiente cambio se condiciona a la revisión del otro aparato (nunca bloqueado para siempre)');
}

console.log('\n── 6 · D2: «Descartar mi cambio» solo con confirmación, y borra su copia ──');
{
  const { srv, w, adoptados, borradas } = crear();
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  await w.guardar({ horarios: [], n: 'mio' });
  await esperarTicks();
  const sin = await w.descartarMiCambio();
  ok(sin.ok === false && sin.motivo === 'sin_confirmacion' && w.vista().estado === 'conflicto', 'Sin confirmar no descarta nada');
  const d = await w.descartarMiCambio({ confirmado: true });
  ok(d.ok === true && d.copiaBorrada === true && borradas.length === 1, 'Con confirmación se descarta y se borra la copia apartada');
  ok(w.vista().estado === 'en_orden' && adoptados.length === 1 && adoptados[0].n === 'otro', 'La pantalla enseña lo de la cuenta y Horarios vuelve a guardar');
  eq(srv.s.valor.n, 'otro', 'Lo del otro aparato sigue intacto');
}

console.log('\n── 7 · Lo automático se recalcula sobre lo de ahora (política aprobada) ──');
{
  const { srv, w, adoptados, apartadas } = crear();
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  const r = await w.guardar({ horarios: [], avisos: ['a1'] }, { automatico: true });
  ok(r.ok === true && r.recalculado === true, 'Un aviso automático que choca: no hay conflicto, se recalcula');
  eq(srv.s.valor.n, 'otro', 'No se pisó lo del otro aparato');
  eq(adoptados.map((x) => x.n), ['otro'], 'La pantalla pasa a lo de la cuenta (y el aviso se volverá a pedir sobre eso)');
  ok(w.vista().estado === 'en_orden' && apartadas.length === 0, 'Sin conflicto ni copia apartada');
  const r2 = await w.guardar({ ...srv.s.valor, avisos: ['a1'] }, { automatico: true });
  ok(r2.ok === true && srv.s.valor.avisos[0] === 'a1' && srv.s.valor.n === 'otro', 'Recalculado sobre lo de ahora: se guarda encima de lo del otro, sin perder nada');
}

console.log('\n── 8 · Un cambio tuyo pedido mientras volaba uno automático que choca: conflicto, nunca a ciegas ──');
{
  const { srv, w, adoptados, apartadas } = crear();
  srv.fallar.antesDeEscribir = () => srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  const p1 = w.guardar({ horarios: [], avisos: ['a'] }, { automatico: true });
  const p2 = w.guardar({ horarios: [], avisos: ['a'], n: 'mio' });
  const [r1, r2] = await Promise.all([p1, p2]);
  ok(r2.ok === false && r2.conflicto === true, '🚨 El cambio tuyo (calculado sobre la pantalla de antes) es un conflicto');
  ok(r1 && r1.ok !== undefined, '…y el automático se resuelve');
  eq(srv.s.valor.n, 'otro', '🚨 No se mandó con la revisión nueva: lo del otro aparato sigue');
  eq(adoptados.length, 0, 'La pantalla sigue con tu cambio');
  await esperarTicks();
  eq(apartadas.map((x) => x.n), ['mio'], 'Tu cambio, apartado');
}

console.log('\n── 9 · Respuestas perdidas: se relee y se reconoce lo que llegó ──');
{
  const { srv, w } = crear();
  srv.fallar.perderRespuesta = 1;
  const r = await w.guardar({ horarios: [], n: 1 });
  ok(r.ok === true, 'Llegó aunque se perdiera la respuesta: confirmado al releer');
  eq(srv.enviados.length, 1, 'Sin reenviar (ni duplicar)');
  const r2 = await w.guardar({ horarios: [], n: 2 });
  ok(r2.ok === true && srv.enviados[1].base === srv.enviados[0].valor.testigo.revision, 'Y el siguiente parte de esa revisión');
}

console.log('\n── 10 · Sin conexión: pendiente en memoria, sale con su condición al volver ──');
{
  const { srv, w } = crear();
  srv.fallar.offline = true;
  const r1 = await w.guardar({ horarios: [], n: 1 });
  ok(r1.ok === false && r1.pendiente === true && w.vista().estado === 'pendiente', 'Sin conexión: pendiente (no se pierde mientras la app siga abierta)');
  const r2 = await w.guardar({ horarios: [], n: 2 });
  ok(r2.pendiente === true, 'Puedes seguir editando sin conexión');
  ok(srv.enviados.every((e) => e.base === 'r0'), 'Todo lo intentado sin conexión va condicionado a la revisión de antes');
  srv.fallar.offline = false;
  await w.reintentar();
  eq(srv.s.valor.n, 2, 'Al volver la conexión sale el ÚLTIMO valor');
  ok(w.vista().estado === 'en_orden', 'Y queda en orden');
}
{
  const { srv, w, adoptados, apartadas } = crear();
  srv.fallar.offline = true;
  await w.guardar({ horarios: [], n: 'mio-offline' });
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  srv.fallar.offline = false;
  await w.reintentar();
  await esperarTicks();
  ok(w.vista().estado === 'conflicto', '🚨 Si otro aparato escribió mientras estabas sin conexión: conflicto al volver');
  eq(srv.s.valor.n, 'otro', '…sin pisar lo suyo');
  eq([adoptados.length, apartadas.map((x) => x.n)], [0, ['mio-offline']], '…con tu cambio en pantalla y apartado');
}

console.log('\n── 11 · La regla del servidor (TP-15 B, cuando se active): su rechazo es un conflicto, no un reintento ──');
{
  const { srv, w } = crear();
  srv.fallar.regla = true;
  const r = await w.guardar({ horarios: [], n: 1 });
  ok(r.ok === true, 'Una escritura del escritor (revisión nueva y base vigente) pasa la regla');
  /* Un valor sin revisión nueva (lo que manda una copia antigua) no la pasa: se simula con una guardia que no pone testigo. */
  const sinTestigo = { prepararEscritura: (v) => ({ valor: { ...v }, conTestigo: false, arranque: false }), motivoBloqueo: () => null };
  const otro = crear({ inicial: srv.s.valor, guardia: sinTestigo });
  otro.srv.fallar.regla = true;
  const r2 = await otro.w.guardar({ horarios: [], n: 'viejo' });
  ok(r2.ok === false && otro.srv.s.valor.n === 1, 'Lo que la regla rechaza no se aplica');
  ok(otro.w.vista().estado !== 'en_orden' || r2.conflicto || r2.pendiente, `…y no queda como guardado (${otro.w.vista().estado})`);
}

console.log('\n── 12 · La primera fila de una cuenta, y otra creada a la vez ──');
{
  const { srv, w } = crear({ inicial: null });
  const r = await w.guardar({ horarios: [], n: 1 });
  ok(r.ok === true && srv.enviados[0].tipo === 'insert' && srv.s.existe, 'Sin fila: un insert (nunca un upsert)');
  const r2 = await w.guardar({ horarios: [], n: 2 });
  ok(r2.ok === true && srv.enviados[1].tipo === 'update', 'Después, updates condicionados');
}
{
  const { srv, w, apartadas } = crear({ inicial: null });
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  const r = await w.guardar({ horarios: [], n: 'mio' });
  await esperarTicks();
  ok(r.conflicto === true && srv.s.valor.n === 'otro' && apartadas.length === 1, 'Otro aparato creó la fila antes (23505): conflicto, sin pisar, con tu cambio apartado');
}

console.log('\n── 13 · Un testigo con una revisión que no se puede comparar: no se escribe a ciegas ──');
{
  const { srv, w } = crear({ inicial: { horarios: [], testigo: { revision: { raro: 1 } } } });
  const r = await w.guardar({ horarios: [], n: 1 });
  ok(r.ok === false && r.bloqueado === true && srv.enviados.length === 0 && w.vista().estado === 'bloqueado', 'Nada se envía, y se dice (límite L-E1-1)');
}

console.log('\n── 14 · La copia apartada que no llega a la cuenta se reintenta (y se dice) ──');
{
  let intentos = 0;
  const { srv, w } = crear({ apartar: async () => { intentos += 1; return intentos === 1 ? { estado: 'no_aplicada', motivo: 'sin_conexion' } : { estado: 'confirmada', opId: 'opX' }; } });
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  await w.guardar({ horarios: [], n: 'mio' });
  await esperarTicks();
  ok(w.vista().conflicto.copia.estado === 'sin_guardar', 'Si no se pudo apartar, el aviso lo dice (no está a salvo todavía)');
  w.verLoDeAhora();
  ok(w.vista().apartadasSinGuardar === 1, 'Tras «Ver lo que hay ahora» queda en memoria y se avisa');
  await w.reintentar();
  ok(intentos === 2 && w.vista().apartadasSinGuardar === 0, 'Al reintentar llega a la cuenta y el aviso se va');
}

console.log('\n── 15 · TP-15 C: releer al volver (y no pisar lo pendiente) ──');
{
  const { srv, w, adoptados } = crear();
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  await w.releer();
  eq(adoptados.map((x) => x.n), ['otro'], 'Sin nada tuyo pendiente: la pantalla pasa a lo de la cuenta');
  const r = await w.guardar({ horarios: [], n: 'mio' });
  ok(r.ok === true && srv.enviados[0].base === 'rOtro', 'Y el siguiente cambio parte de ahí (sin conflicto)');
  await w.releer();
  eq(adoptados.length, 1, 'Releer sin cambios ajenos no toca la pantalla');
}
{
  const { srv, w, adoptados } = crear();
  srv.fallar.offline = true;
  await w.guardar({ horarios: [], n: 'mio' });
  srv.fallar.offline = false;
  await w.releer();
  ok(adoptados.length === 0 && srv.s.valor.n === 'mio', 'Con algo tuyo pendiente, releer lo manda (con su condición) en vez de pisarlo');
}

console.log('\n── 16 · Deshacer: ¿hay cambios ajenos? ──');
{
  const { srv, w } = crear();
  eq(await w.sinCambiosAjenos(), true, 'Sin cambios de nadie: se puede deshacer');
  srv.escribeOtro(conRev('rOtro', { n: 'otro' }));
  eq(await w.sinCambiosAjenos(), false, 'Con un cambio de otro aparato: se bloquea');
  srv.fallar.offline = true;
  eq(await w.sinCambiosAjenos(), null, 'Sin conexión: no se sabe (decide la escritura condicional)');
}

console.log('\n── 17 · La guardia bloquea: el escritor no escribe ──');
{
  const g = guardiaFalsa({ bloqueo: 'guardia_comprobando' });
  const { srv, w } = crear({ guardia: g });
  const r = await w.guardar({ horarios: [], n: 1 });
  ok(r.ok === false && r.pendiente === true && srv.enviados.length === 0, 'Con la guardia comprobando, nada sale (queda pendiente)');
  g.bloqueo = null;
  await w.reintentar();
  ok(srv.s.valor.n === 1, 'Cuando la guardia deja, sale');
}

console.log('\n── 18 · Con la guardia de verdad (A-bis): testigo con base, y demostración en el arranque ──');
{
  /* Doble de las filas de la guardia, con la condición sobre ultimaOperacion. */
  const filas = new Map();
  const tg = {
    async leerTodas() { return { ok: true, filas: [...filas].map(([key, value]) => ({ key, value: copia(value), updated_at: '2026-11-01T00:00:00Z' })) }; },
    async leerPropia(_u, k) { const v = filas.get(k); return { ok: true, existe: !!v, valor: copia(v || null) }; },
    async insertar(_u, k, v) { if (filas.has(k)) return { ok: false, conflicto: true }; filas.set(k, copia(v)); return { ok: true }; },
    async actualizarSiBase(_u, k, v, b) { const a = filas.get(k); if (!a || a.ultimaOperacion !== b) return { ok: true, aplicada: false }; filas.set(k, copia(v)); return { ok: true, aplicada: true }; },
  };
  const inicial = { horarios: [], bloques: [], version: 1, testigo: { formato: 1, desde: '2026-11-01T00:00:00Z', ultimaEscritura: 'x', revision: 'r0', base: null, aparato: 'B' } };
  const srv = servidorHorario(inicial);
  tg.leerHorario = srv.t.leerHorario;
  const g = G.crearGuardiaDeHorario({ transporte: tg, usuario: 'U', versionApp: '3.163.0', aparato: 'APA', candado: null });
  await g.comprobar({ guardiaA: H.guardiaDeVersionHorario(inicial) });
  await g.esperar();
  ok(g.vista().estado === 'E1' && g.vista().demostrado, 'La guardia de verdad: E1 con el testigo demostrado al cargar');
  const w = crearEscritorDeHorario({ transporte: srv.t, usuario: 'U', guardia: g, inicial: { valor: inicial, existe: true } });
  const r = await w.guardar({ horarios: [], bloques: [], n: 1 });
  ok(r.ok === true && srv.s.valor.testigo.base === 'r0' && srv.s.valor.testigo.aparato === 'APA' && srv.s.valor.version === 1, 'El testigo nuevo lleva base = la revisión cargada, este aparato y version 1');
  eq(srv.s.valor.testigo.desde, '2026-11-01T00:00:00Z', 'Y conserva su «desde»');
}

console.log('\n── 19 · Incidencia #5: dos o más avisos a la vez ya no guardan en bucle ──');
{
  const HOY = '2026-08-24';   // lunes
  const resumen = { clave: `${HOY}|resumen`, tipo: 'recordatorio', prioridad: 'normal', titulo: '3 cosas hoy', cuerpo: 'x', incluye: ['k1', 'k2', 'k3'] };
  const base = H.normalizarHorarioTop(null);
  const e1 = A.registrarEnviado(base, resumen, { fecha: HOY, ahora: '00:05' });
  ok(e1 !== base, 'La primera vez se apunta el resumen');
  eq(A.clavesEnviadas(e1, HOY).sort(), [`${HOY}|resumen`, 'k1', 'k2', 'k3'].sort(), '…con las claves que incluye (los avisos sueltos ya no salen como «sin enviar»)');
  ok(A.registrarEnviado(e1, resumen, { fecha: HOY, ahora: '00:06' }) === e1, '🚨 Si ya estaba, devuelve EL MISMO objeto (quien llama sabe que no ha cambiado nada)');
  ok(A.registrarEnviado(e1, { clave: 'k2', tipo: 'clase', prioridad: 'normal', titulo: 't', cuerpo: 'c' }, { fecha: HOY }) === e1, 'Un aviso suelto ya incluido en el resumen tampoco se vuelve a apuntar');
  /* El escenario de la incidencia, de verdad: tres clases de hoy entre las 00:00 y las 00:03, consultado a las 00:05.
     Se repite lo que hace el efecto de HorarioView hasta que no hay nada que mandar (como mucho 6 vueltas). */
  const ED = await imp('src/lib/horarioEditor.js');
  const { estado: e0, horario } = ED.crearDesdePlantilla(H.DEFAULT_HORARIO_TOP, { nombre: 'Prueba', plantillaId: 'colegio', hoy: HOY });
  const col = horario.columnas.find((c) => c.dia === 1);
  let e = e0;
  for (const [ini, fin, txt] of [['00:00', '00:01', 'Uno'], ['00:01', '00:02', 'Dos'], ['00:02', '00:03', 'Tres']]) {
    e = ED.crearBloqueRapido(e, { horarioId: horario.id, columnaId: col.id, inicio: ini, fin, texto: txt, hoy: HOY }).estado;
  }
  let guardados = 0; let vueltasConAvisos = 0; let primera = null;
  for (let vuelta = 0; vuelta < 6; vuelta += 1) {
    const porAvisar = A.avisosAMandar(e, { fecha: HOY, ahora: '00:05', hoy: HOY });
    if (!porAvisar.mandar.length) break;
    vueltasConAvisos += 1;
    if (!primera) primera = porAvisar.mandar;
    let nuevo = e;
    for (const av of porAvisar.mandar) nuevo = A.registrarEnviado(nuevo, av, { fecha: HOY, ahora: '00:05' });
    if (nuevo !== e) guardados += 1;
    e = nuevo;
  }
  ok(primera && primera.length >= 1, `Hay algo que avisar en la primera vuelta (${primera ? primera.map((x) => x.clave).join(', ') : 'nada'})`);
  eq([vueltasConAvisos, guardados], [1, 1], '🚨 Una sola vuelta con avisos y un solo guardado: ya no hay bucle');
  const v = sinComentarios(leer('src/views/HorarioView.jsx'));
  ok(/const cambio = nuevo !== estado;/.test(v) && /if \(cambio && !soloLectura\) onCambiar\(nuevo, \{ automatico: true \}\);/.test(v), 'El efecto de avisos solo guarda si algo cambió de verdad, y como automático');
}

console.log('\n── 20 · D2-bis: la copia «conflicto» en el historial de versiones ──');
{
  eq([...V.MOTIVOS_MANUALES], ['manual', 'conflicto'], 'Los motivos no automáticos: manual y conflicto');
  ok(!V.MOTIVOS_AUTOMATICOS.includes('conflicto'), 'conflicto NO es automático');
  const filas = new Map();
  const t = {
    async leerTodas() { return { ok: true, filas: [...filas].map(([key, value]) => ({ key, value: copia(value) })) }; },
    async leerPropia(_u, k) { return { ok: true, valor: copia(filas.get(k) || null) }; },
    async insertar(_u, k, v) { if (filas.has(k)) return { ok: false, conflicto: true }; filas.set(k, copia(v)); return { ok: true }; },
    async actualizarSiBase(_u, k, v, b) { const a = filas.get(k); if (!a || a.ultimaOperacion !== b) return { ok: true, aplicada: false }; filas.set(k, copia(v)); return { ok: true, aplicada: true }; },
  };
  const mem = new Map();
  const almacen = { leer: (k) => (mem.has(k) ? mem.get(k) : null), escribir: (k, v) => mem.set(k, String(v)) };
  let id = 0;
  const w = V.crearEscritorDeVersiones({ transporte: t, usuario: 'U', almacen, candado: (fn) => fn(), sesion: 's1', idNuevo: () => `id${++id}` });
  const c = await w.crearVersion({ contenido: { n: 'mio' }, motivo: 'conflicto', nombre: 'Cambio apartado por un conflicto' });
  ok(c.estado === 'confirmada', 'Se crea una versión con motivo conflicto');
  const vista = (await w.leer()).vista;
  const ver = vista.visibles.find((x) => x.id === c.opId);
  ok(ver && ver.motivo === 'conflicto' && ver.protegida === false && ver.contenido.n === 'mio', 'Es visible, NO protegida, con tu cambio dentro');
  const sin = await w.eliminarVersionManual(c.opId);
  ok(sin.estado === 'no_aplicada' && sin.motivo === 'sin_confirmacion', 'Borrarla sin confirmar no hace nada');
  const del = await w.eliminarVersionManual(c.opId, { confirmado: true });
  ok(del.estado === 'confirmada' && (await w.leer()).vista.eliminadas.includes(c.opId), 'Con confirmación se borra (a mano)');
  const auto = await w.crearVersion({ contenido: {}, motivo: 'confirmacion' });
  const delAuto = await w.eliminarVersionManual(auto.opId, { confirmado: true });
  ok(delAuto.estado === 'no_aplicada' && delAuto.motivo === 'version_automatica', 'Una automática sigue sin poder borrarse');
  const raro = await w.crearVersion({ contenido: {}, motivo: 'inventado' });
  ok(raro.estado === 'no_aplicada' && raro.motivo === 'motivo_desconocido', 'Un motivo desconocido sigue rechazado');
}

console.log('\n── 21 · Entrega corta (D1): retirar, resolver y reabrir ──');
{
  const DIA = 24 * 3600 * 1000;
  const ahora = new Date('2026-11-16T10:00:00Z');
  const filas = new Map();
  const tg = {
    async leerTodas() { return { ok: true, filas: [...filas].map(([key, value]) => ({ key, value: copia(value), updated_at: '2026-11-01T00:00:00Z' })) }; },
    async leerPropia(_u, k) { const v = filas.get(k); return { ok: true, existe: !!v, valor: copia(v || null) }; },
    async insertar(_u, k, v) { if (filas.has(k)) return { ok: false, conflicto: true }; filas.set(k, copia(v)); return { ok: true }; },
    async actualizarSiBase(_u, k, v, b) { const a = filas.get(k); if (!a || a.ultimaOperacion !== b) return { ok: true, aplicada: false }; filas.set(k, copia(v)); return { ok: true, aplicada: true }; },
  };
  const filaDe = (aparato, enVisita, extra = {}) => ({
    formato: 1, aparato, secuencia: 3, ultimaOperacion: `op-${aparato}`, primeraVezA: { en: '2026-10-01T00:00:00Z', versionApp: '3.162.0' }, etiqueta: null,
    visitas: { '3.162.0': { primera: { en: enVisita, fecha: '2026-10-01', secuencia: 1 }, ultima: { en: enVisita, fecha: '2026-10-01', secuencia: 3 } } },
    testigo: { intenciones: [], visto: { primera: { revision: 'r0', secuencia: 2, en: enVisita }, ultima: { revision: 'r0', secuencia: 2, en: enVisita, conocidas: [] } } },
    detecciones: [], retiradas: [], resoluciones: [], ...extra,
  });
  filas.set('horarioGuardia:VIEJO', filaDe('VIEJO', new Date(ahora.getTime() - 40 * DIA).toISOString()));
  filas.set('horarioGuardia:ACTIVO', filaDe('ACTIVO', new Date(ahora.getTime() - 2 * DIA).toISOString(), {
    detecciones: [{ id: 'inc1', secuencia: 3, en: '2026-11-10T00:00:00Z', fecha: '2026-11-10', versionApp: '3.162.0', clase: 'perdida', motivo: 'testigo_ausente', huella: 'h1', evidencia: {} }],
  }));
  let horario = { horarios: [], version: 1, testigo: { formato: 1, revision: 'rN', base: 'r0', aparato: 'ACTIVO' } };
  tg.leerHorario = async () => ({ ok: true, existe: true, valor: copia(horario) });
  const g = G.crearGuardiaDeHorario({ transporte: tg, usuario: 'U', versionApp: '3.163.0', aparato: 'YO', candado: null, ahora: () => ahora });
  ok((await g.retirarAparato('VIEJO', 'sin_uso')).motivo === 'sin_comprobar', 'Antes de comprobar, nada (Horarios en «Comprobando»)');
  await g.comprobar({ guardiaA: H.guardiaDeVersionHorario(horario) });
  await g.esperar();
  ok(['E1', 'B', 'C'].includes(g.vista().estado), `Comprobada (${g.vista().estado})`);
  // Retirar
  eq((await g.retirarAparato('YO', 'sin_uso')).motivo, 'este_aparato', 'Retirar: no este aparato');
  eq((await g.retirarAparato('ACTIVO', 'sin_uso')).motivo, 'aparato_activo', 'Retirar: no un aparato con visitas en 30 días');
  eq((await g.retirarAparato('VIEJO', 'otro')).motivo, 'motivo_desconocido', 'Retirar: solo los tres motivos cerrados');
  eq((await g.retirarAparato('NADIE', 'sin_uso')).motivo, 'aparato_desconocido', 'Retirar: no un aparato que no existe');
  const ret = await g.retirarAparato('VIEJO', 'sin_uso');
  ok(ret.ok === true && ret.retirada.aparatoRetirado === 'VIEJO' && ret.retirada.secuenciaVista === 3, 'Retirar un aparato sin visitas recientes: hecho, con la secuencia que vio');
  const propia = filas.get('horarioGuardia:YO');
  ok(propia && propia.retiradas.length === 1 && propia.retiradas[0].motivo === 'sin_uso' && propia.retiradas[0].versionApp === '3.163.0', 'Queda en la fila de ESTE aparato, con su motivo y versión (trazabilidad)');
  ok(filas.get('horarioGuardia:VIEJO').retiradas.length === 0 && filas.get('horarioGuardia:VIEJO').secuencia === 3, 'La fila retirada no se toca');
  ok((await g.retirarAparato('VIEJO', 'sin_uso')).yaEstaba === true && filas.get('horarioGuardia:YO').retiradas.length === 1, 'Retirarlo otra vez no duplica nada');
  const ev4 = G.evaluarCondicionesB({ lectura: G.leerFilasDeGuardia([...filas].map(([key, value]) => ({ key, value }))), horario: { ok: true, existe: true, valor: horario }, versionMinima: '3.163.0', margenDias: undefined, ahora });
  ok(ev4.condiciones.find((c) => c.id === 'versiones').estado === 'no_cumple', 'Condición 4: el aparato ACTIVO (3.162.0, reciente) sigue contando aunque se intentara retirar');
  // Resolver
  eq((await g.resolverIncidencias([], 'conforme')).motivo, 'sin_incidencias', 'Resolver: hay que marcar al menos una');
  eq((await g.resolverIncidencias(['inc1'], 'resuelta')).motivo, 'decision_desconocida', 'Resolver: solo las dos decisiones cerradas');
  eq((await g.resolverIncidencias(['no-existe'], 'conforme')).motivo, 'incidencia_no_abierta', 'Resolver: solo incidencias abiertas que existen');
  const horarioAntes = horario;
  horario = { horarios: [] };
  eq((await g.resolverIncidencias(['inc1'], 'conforme')).motivo, 'sin_testigo_valido', 'Resolver: hace falta un testigo válido en la cuenta, leído ahora');
  horario = horarioAntes;
  const res = await g.resolverIncidencias(['inc1'], 'conforme');
  ok(res.ok === true && res.resolucion.decision === 'conforme' && res.resolucion.deteccionIds[0] === 'inc1', 'Resolver con testigo válido: hecho');
  const yo = filas.get('horarioGuardia:YO');
  ok(yo.resoluciones.length === 1 && yo.testigo.visto && yo.testigo.visto.ultima.revision === 'rN', '…y en la misma escritura se apunta el «visto» de esa lectura');
  const resumen = G.resumenDeFilas(G.leerFilasDeGuardia([...filas].map(([key, value]) => ({ key, value }))).filas);
  ok(resumen.registros.find((r) => r.id === 'inc1').resuelto === true, 'La incidencia queda resuelta');
  const ev2 = G.evaluarCondicionesB({ lectura: G.leerFilasDeGuardia([...filas].map(([key, value]) => ({ key, value }))), horario: { ok: true, existe: true, valor: horario }, ahora });
  eq(ev2.condiciones.find((c) => c.id === 'incidencias').estado, 'cumple', 'Condición 2: cumple');
  eq((await g.resolverIncidencias(['inc1'], 'asumida')).motivo, 'incidencia_no_abierta', 'Una incidencia resuelta no se vuelve a resolver');
  // Reabrir
  eq((await g.reabrirResolucion('nada')).motivo, 'resolucion_desconocida', 'Reabrir: solo una resolución que existe');
  const re = await g.reabrirResolucion(res.resolucion.id);
  ok(re.ok === true && re.resolucion.decision === 'reabrir' && re.resolucion.anula === res.resolucion.id, 'Reabrir: hecho, anulando esa resolución por su id');
  const r2 = G.resumenDeFilas(G.leerFilasDeGuardia([...filas].map(([key, value]) => ({ key, value }))).filas);
  ok(r2.registros.find((r) => r.id === 'inc1').resuelto === false, 'La incidencia vuelve a estar abierta');
  const ev3 = G.evaluarCondicionesB({ lectura: G.leerFilasDeGuardia([...filas].map(([key, value]) => ({ key, value }))), horario: { ok: true, existe: true, valor: horario }, ahora });
  eq(ev3.condiciones.find((c) => c.id === 'incidencias').estado, 'no_cumple', 'Condición 2: vuelve a no cumplir');
  eq((await g.reabrirResolucion(res.resolucion.id)).motivo, 'resolucion_no_vigente', 'Una resolución ya reabierta no se reabre otra vez');
  ok((await g.resolverIncidencias(['inc1'], 'asumida')).ok === true, 'Y se puede volver a resolver (otra decisión)');
  ok(filas.get('horarioGuardia:YO').resoluciones.every((x) => typeof x.id === 'string' && x.versionApp === '3.163.0' && x.en && x.fecha), 'Cada operación lleva id, fecha, marca y versión');
  ok(G.cumpleInvariante !== undefined, 'El invariante de la fila sigue aplicándose (las listas solo crecen)');
  eq([...G.DECISIONES_RESOLUCION], ['conforme', 'asumida'], 'La lista de decisiones reconocidas es la cerrada de D1');
  ok(!horario.notaDeNadie && horario.testigo.revision === 'rN', 'Ninguna operación tocó horarioTop');
}

console.log('\n── 22 · Inventario: ninguna escritura de horarioTop fuera del escritor protegido ──');
{
  const archivos = [];
  const recorrer = (dir) => {
    for (const nombre of readdirSync(join(RAIZ, dir))) {
      const rel = `${dir}/${nombre}`;
      if (statSync(join(RAIZ, rel)).isDirectory()) recorrer(rel);
      else if (/\.(js|jsx|mjs)$/.test(nombre)) archivos.push(rel);
    }
  };
  recorrer('src'); recorrer('api');
  const malos = [];
  for (const rel of archivos) {
    const t = sinComentarios(leer(rel));
    if (/saveData\([^)]*['"`]horarioTop['"`]/.test(t)) malos.push(`${rel}: saveData de horarioTop`);
    if (/saveData\([^)]*['"`]horarioBorradores['"`]/.test(t)) malos.push(`${rel}: saveData de horarioBorradores`);
    if (rel !== 'src/lib/supabase.js' && /from\(['"`]app_data['"`]\)/.test(t)) malos.push(`${rel}: habla con app_data por su cuenta`);
  }
  eq(malos, [], 'Ningún archivo guarda horarioTop por saveData ni toca app_data fuera de supabase.js');
  const sup = sinComentarios(leer('src/lib/supabase.js'));
  const conHorario = (sup.match(/key: 'horarioTop'|\.eq\('key', 'horarioTop'\)/g) || []).length;
  eq(conHorario, 3, 'En supabase.js, horarioTop solo aparece en sus tres funciones (leer, insertar, actualizar con condición)');
  const app = sinComentarios(leer('src/App.jsx'));
  eq((app.match(/w\.guardar\(|\.guardar\(nuevo/g) || []).length, 1, 'App.jsx llama al escritor en un solo sitio (guardarHorario)');
  ok(/const guardarHorario = \(nuevo, \{ automatico = false \} = \{\}\) => \{/.test(app), '…que es guardarHorario');
  eq((app.match(/guardarHorario\(/g) || []).length, 2, 'Y guardarHorario se usa en snapshotAndSave y en Deshacer: las dos únicas rutas de escritura de horarioTop');
  /* Cada sitio que pone `horarioTop:` en un parche lo hace dentro de un snapshotAndSave (la ruta protegida). */
  const lineas = app.split('\n');
  const sueltas = lineas.map((l, i) => [l, i]).filter(([l]) => /horarioTop: /.test(l) && !/snapshotAndSave|horarioTop: nuevo|limpiarHorarioDeAsignatura|patch\.horarioTop|ultimoPaso|DEFAULT_HORARIO_TOP|key:|horarioTop: \{/.test(l));
  eq(sueltas.map(([l, i]) => `${i + 1}: ${l.trim()}`), [], 'No hay ningún parche de horarioTop fuera de snapshotAndSave');
  const hv = sinComentarios(leer('src/views/HorarioView.jsx'));
  ok(!/saveData|supabase/.test(hv), 'HorarioView no guarda por su cuenta: todo pasa por onCambiar');
}

console.log('\n── 23 · Cableado en App.jsx ──');
{
  const app = sinComentarios(leer('src/App.jsx'));
  const primerReturn = app.indexOf('if (session === undefined) return');
  ok(app.indexOf('escritorHorarioRef = useRef') < primerReturn && app.indexOf("document.addEventListener('visibilitychange', alMostrarse)") < primerReturn, 'Los hooks nuevos van antes de los return (regla 4)');
  ok(/document\.removeEventListener\('visibilitychange', alMostrarse\)/.test(app), 'TP-15 C: el escuchador de volver a primer plano se limpia');
  ok(/const alVolver = \(\) => \{ const g = guardiaHorarioRef\.current; if \(g\) g\.reintentar\(\); releerHorario\(\); \};/.test(app), 'Al recuperar la conexión: la guardia reintenta y el horario se relee/manda');
  ok(/escritorHorarioRef\.current\.cerrar\(\)/.test(app) && /apuntarExterno\('horarioTop', null\)/.test(app), 'Al cambiar de usuario, el escritor de la sesión anterior se cierra');
  ok(/inicial: \{ valor: hor, existe: hor !== DEFAULT_HORARIO_TOP && !cargaFallida\('horarioTop'\) \}/.test(app), 'El escritor parte de LO CARGADO (la base es lo que ve la pantalla)');
  ok(/const gv = guardiaDeVersionHorario\(valor\);\s*if \(gv\.soloLectura\) horarioMotivoARef\.current = gv\.motivo;/.test(app), 'Lo que adopta de la cuenta pasa por la guardia de versión de la A (una versión futura no se normaliza encima)');
  ok(/motivo: 'conflicto', nombre: 'Cambio apartado por un conflicto'/.test(app), 'D2-bis: la copia va al historial de versiones con motivo conflicto');
  ok(/\(w \? w\.motivoBloqueo\(\) : null\)/.test(app), 'El conflicto pone Horarios en solo lectura (después de la A y la guardia)');
  ok(/if \(libre === false\) \{ setAvisoApp\('deshacer_bloqueado_horario'\); return; \}/.test(app), 'Deshacer se bloquea si otro aparato cambió el horario después (y lo dice)');
  ok(/\|\| !mismoContenido\(ultimoPaso\.horarioTop, horarioTop, \{ sinSello: true \}\)|&& !mismoContenido\(ultimoPaso\.horarioTop, horarioTop, \{ sinSello: true \}\)/.test(app), 'Deshacer solo reescribe el horario si ESE paso lo cambió');
  ok(/onCambiar=\{\(nuevo, opciones\) => snapshotAndSave\(\{ horarioTop: nuevo \}, opciones\)\}/.test(app), 'Los guardados automáticos de la pantalla llegan marcados');
  /* Ronda de correcciones (auditoría global de E1): un conflicto que se abre FUERA de Horarios se dice allí mismo (D2). */
  ok(/if \(v\.conflicto && !habiaConflicto && tabRef\.current !== 'horario'\) setAvisoApp\('conflicto_horario'\);/.test(app), '🚨 D2: un conflicto que se abre fuera de Horarios (Estudios, Ajustes) se dice donde está, una vez');
  /* Ronda de correcciones: después de adoptar lo de otro aparato, un paso de antes no puede reescribir el horario. */
  ok(/for \(const paso of historyRef\.current\) pasosAntesDeAjenoRef\.current\.add\(paso\);/.test(app.slice(app.indexOf('alAdoptar: (valor) =>'), app.indexOf('alAdoptar: (valor) =>') + 300)),
    '🚨 Deshacer: al adoptar lo de otro aparato, los pasos de antes quedan marcados (no pueden pisar lo suyo)');
  ok(/if \(pasosAntesDeAjenoRef\.current\.has\(ultimoPaso\)\) \{ setAvisoApp\('deshacer_bloqueado_horario'\); return; \}/.test(app), '…y Deshacer los bloquea, y lo dice');
  ok(/if \(!ultimoAparato \|\| ultimoAparato !== g\.vista\(\)\.aparato\) for \(const paso of historyRef\.current\) pasosAntesDeAjenoRef\.current\.add\(paso\);/.test(app), '…y al cargar, también los guardados, si lo último de la cuenta no lo escribió este aparato');
  ok(/else snapshot\.tocaHorario = !!patch\.horarioTop;/.test(app) && /ultimoPaso\.tocaHorario === true \|\| \(ultimoPaso\.tocaHorario === undefined && !mismoContenido/.test(app), 'Cada paso dice si tocó el horario (un paso de Fitness no se bloquea porque otro aparato cambiara el horario)');
  ok(app.indexOf('const pasosAntesDeAjenoRef = useRef(new WeakSet())') < primerReturn, '…con su ref antes de los return (regla 4)');
  const AH = await imp('src/lib/accionesHoyAgenda.js');
  ok(AH.avisoDe('conflicto_horario')?.error === true && /no se ha perdido/.test(AH.avisoDe('conflicto_horario').texto) && /Horarios/.test(AH.avisoDe('conflicto_horario').texto), '…con un aviso que dice que tu cambio no se ha perdido y dónde se elige');
  ok(/const tabRef = useRef\(tab\);\s*tabRef\.current = tab;/.test(app) && app.indexOf('const tabRef = useRef(tab)') < primerReturn, '…con la pantalla de ahora en un ref, antes de los return (regla 4)');
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${n - fallos}/${n} comprobaciones del escritor protegido del horario (E1)`);
if (fallos) process.exit(1);
