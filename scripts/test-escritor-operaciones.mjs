// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R2 — EL ESCRITOR DE OPERACIONES (`src/lib/escritorOperaciones.js`) CONTRA UN SERVIDOR SIMULADO.
//
// El servidor de aquí imita `protegido_aplicar` de R1 (registro con su huella, la revisión nueva como segunda capa, las
// condiciones por elemento, la copia en la misma «transacción», `protegido_estado`) y sabe FALLAR: perder la respuesta
// antes o después de aplicar, no tener las funciones, caducar la sesión, tardar. La paridad con el servidor de verdad
// está en `test-escritor-operaciones-postgrest.mjs` (nivel 3).
//
//   A · lo básico: base, revisión nueva, un solo protocolo
//   B · una a la vez y la unión de lo que espera
//   C · respuestas perdidas: después de aplicar, antes, sin conexión, y el mismo opId siempre (I2, I7 en el cliente)
//   D · conflicto manual: la copia la guarda el servidor, nada se pisa, las dos salidas
//   E · automático: adopta sin copia; con un cambio tuyo detrás, ése se aparta (nunca con la revisión nueva)
//   F · protocolo: sin funciones, otra versión, versión antigua, sin conexión; la hora del servidor
//   G · respuestas del servidor: inválida, sin sesión, error definitivo
//   H · varias claves: todo o nada, condiciones con lo guardado, C1 y C2, la pantalla y la cola
//   I · la guardia: arranque sin testigo y bloqueo
//   J · releer, sinCambiosAjenos, cerrar
//   K · invariantes de todo lo enviado: un opId = un contenido, nunca sin condición
//
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-escritor-operaciones.mjs
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { crearEscritorDeOperaciones, MOTIVO_PROTOCOLO_HORARIO } from '../src/lib/escritorOperaciones.js';
import { MOTIVO_CONFLICTO_HORARIO, crearEscritorDeHorario } from '../src/lib/escritorHorario.js';
import { aplicarCambios, validarOperacion, igualJson } from '../src/lib/operacionesProtegidas.js';
import { textoCanonico } from '../src/lib/guardiaHorario.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const copia = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const dormir = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const uuid = () => crypto.randomUUID();

/* ── El servidor simulado ───────────────────────────────────────────────── */
function crearServidor({ inicial = {} } = {}) {
  const S = {
    filas: copia(inicial),                 // clave → valor
    registro: new Map(),                   // opId → { huella, resultado, revision, copiaId, motivo }
    copias: new Map(),                     // copiaId → { op, meta }
    corte: null,
    protocolo: { version: 1, versionMinima: null, reglas: { horarioTop: false } },
    desfaseServidorMs: 0,
    fallos: { protocolo: [], aplicar: [], estado: [], leer: [], copiaEliminar: [] },
    llamadas: { protocolo: 0, aplicar: 0, estado: 0, leer: 0, copiaEliminar: 0 },
    enviadas: [],                          // cada op recibida por `aplicar`, tal cual
    aplicaciones: 0,
  };
  const rev = () => (S.filas.horarioTop && S.filas.horarioTop.testigo ? S.filas.horarioTop.testigo.revision ?? null : null);
  function aplicarServidor(op) {
    const motivo = validarOperacion(op);
    if (motivo) return { estado: 'invalida', motivo };
    const huella = textoCanonico(op);
    const reg = S.registro.get(op.opId);
    if (reg) return reg.huella === huella ? { estado: reg.resultado, registrada: true, opId: op.opId, revision: reg.revision, copiaId: reg.copiaId, motivo: reg.motivo } : { estado: 'invalida', motivo: 'op_distinta' };
    if (S.corte && op.creadaEn < S.corte) return { estado: 'caducada', opId: op.opId };
    let fallo = null;
    const existe = 'horarioTop' in S.filas;
    if (op.horario) {
      if (existe && rev() === op.horario.valor.testigo.revision) return { estado: 'aplicada', reconocidaPor: 'revision', opId: op.opId };
      const b = op.horario.base;
      const bien = (b === null && !op.horario.baseExiste && !existe) || (b === null && op.horario.baseExiste && existe && rev() === null) || (b !== null && existe && rev() === b);
      if (!bien) fallo = { motivo: 'revision', clave: 'horarioTop', esperada: b, actual: rev() };
    }
    const nuevos = {};
    if (!fallo) {
      for (const c of [...(op.claves || [])].sort((a, b) => a.clave.localeCompare(b.clave))) {
        const r = aplicarCambios(c.clave in S.filas ? S.filas[c.clave] : (c.inicial || {}), c.cambios, c.clave);
        if (r.fallo) { fallo = r.fallo; break; }
        nuevos[c.clave] = r.nuevo;
      }
    }
    if (fallo) {
      let copiaId = null;
      if (op.manual) { copiaId = op.opId; S.copias.set(copiaId, { op: copia(op), meta: { motivo: fallo, tipoOperacion: op.tipo } }); }
      S.registro.set(op.opId, { huella, resultado: 'conflicto', revision: null, copiaId, motivo: fallo });
      return { estado: 'conflicto', opId: op.opId, motivo: fallo, copiaId, actual: op.horario ? { existe, valor: existe ? copia(S.filas.horarioTop) : null } : null };
    }
    if (op.horario) S.filas.horarioTop = copia(op.horario.valor);
    Object.assign(S.filas, copia(nuevos));
    S.aplicaciones += 1;
    S.registro.set(op.opId, { huella, resultado: 'aplicada', revision: op.horario ? op.horario.valor.testigo.revision : null, copiaId: null, motivo: null });
    return { estado: 'aplicada', opId: op.opId, revision: op.horario ? op.horario.valor.testigo.revision : null };
  }
  /* Cada llamada consume el siguiente fallo de su lista: 'antes' (no llega), 'despues' (llega y se pierde la respuesta),
     'sinFunciones', 'sesion', 'definitivo', o una promesa por la que esperar antes de contestar. */
  async function red(nombre, fn) {
    S.llamadas[nombre] += 1;
    const f = S.fallos[nombre].shift();
    if (f && typeof f.then === 'function') await f;
    if (f === 'antes') return { ok: false, sinRespuesta: true };
    if (f === 'sinFunciones') return { ok: false, sinFunciones: true };
    if (f === 'sesion') return { ok: false, sesion: true };
    if (f === 'definitivo') return { ok: false, definitivo: true, error: { code: '57014' } };
    const data = fn();
    await dormir(0);
    if (f === 'despues') return { ok: false, sinRespuesta: true };
    return { ok: true, data: copia(data) };
  }
  const transporte = {
    protocolo: () => red('protocolo', () => ({ ...S.protocolo, ahora: new Date(Date.now() + S.desfaseServidorMs).toISOString() })),
    aplicar: (op) => { S.enviadas.push(op); return red('aplicar', () => aplicarServidor(copia(op))); },
    estado: (opId) => red('estado', () => {
      const reg = S.registro.get(opId);
      return reg ? { estado: reg.resultado, opId, revision: reg.revision, copiaId: reg.copiaId, motivo: reg.motivo } : { estado: 'desconocida', opId };
    }),
    leer: (claves) => red('leer', () => ({ estado: 'leidas', claves: Object.fromEntries(claves.map((k) => [k, { existe: k in S.filas, valor: k in S.filas ? copia(S.filas[k]) : null }])) })),
    copiaEliminar: (id) => red('copiaEliminar', () => (S.copias.delete(id) ? { estado: 'eliminada', id } : { estado: 'no_existe', id })),
  };
  /* Otro aparato escribe el horario (con su testigo y una revisión nueva). */
  const otroAparato = (contenido = {}) => {
    const r = uuid();
    S.filas.horarioTop = { ...contenido, version: 1, testigo: { formato: 1, revision: r, base: rev(), aparato: 'otro' } };
    return r;
  };
  return { S, transporte, otroAparato, rev };
}

const horario = (n) => ({ horarios: [], bloques: [{ id: `b${n}` }], n });
function crear(srv, opciones = {}) {
  const adoptados = []; const aplicadas = [];
  const inicial = 'horarioTop' in srv.S.filas ? { valor: copia(srv.S.filas.horarioTop), existe: true } : { valor: null, existe: false };
  const w = crearEscritorDeOperaciones({
    transporte: srv.transporte, usuario: 'u1', aparato: 'yo', versionApp: '3.163.0', inicial,
    alAdoptar: (v, info) => adoptados.push({ v: copia(v), ...info }), alAplicar: (op) => aplicadas.push(op), ...opciones,
  });
  return { w, adoptados, aplicadas };
}
/* Una promesa que se puede soltar desde fuera: para dejar una petición «en el aire». */
const compuerta = () => { let abrir; const p = new Promise((r) => { abrir = r; }); return { p, abrir }; };

seccion('A · Lo básico');
{
  /* El MISMO contrato que el escritor de E1: en R3 la aplicación lo cambia sin tocar a quien lo llama. */
  const e1 = crearEscritorDeHorario({ transporte: {}, usuario: 'u' });
  const deR2 = crearEscritorDeOperaciones({ transporte: {}, usuario: 'u' });
  const faltan = Object.keys(e1).filter((k) => typeof deR2[k] !== typeof e1[k]);
  ok(faltan.length === 0, `el contrato público de E1 está entero (${Object.keys(e1).length} piezas)${faltan.length ? ` — faltan: ${faltan.join(', ')}` : ''}`);
  e1.cerrar(); deR2.cerrar();
  const srv = crearServidor();
  const { w } = crear(srv);
  const r1 = await w.guardar(horario(1));
  ok(r1.ok && srv.S.filas.horarioTop.n === 1, 'el primer guardado de una cuenta sin fila llega');
  const op1 = srv.S.enviadas[0];
  ok(op1.horario.base === null && op1.horario.baseExiste === false && op1.tipo === 'editar_horario' && op1.manual === true, '…como operación manual con base null y sin fila');
  ok(typeof op1.horario.valor.testigo.revision === 'string' && op1.horario.valor.version === 1, '…con su testigo y su revisión nueva (D3)');
  const r2 = await w.guardar(horario(2));
  const op2 = srv.S.enviadas[1];
  ok(r2.ok && op2.horario.base === op1.horario.valor.testigo.revision && op2.horario.baseExiste === true, 'el segundo lleva como base la revisión del primero');
  ok(op1.opId !== op2.opId, 'cada guardado es una operación con su opId');
  ok(srv.S.llamadas.protocolo === 1, 'el protocolo se consulta una sola vez por sesión');
  ok(w.vista().estado === 'en_orden' && !w.vista().pendiente, 'en orden, nada pendiente');
  ok(w.confirmado().valor.n === 2, 'lo confirmado es lo que hay en la cuenta');
  const a = await w.guardar(horario(3), { automatico: true });
  ok(a.ok && srv.S.enviadas[2].manual === false && srv.S.enviadas[2].tipo === 'aviso_automatico', 'un guardado automático va marcado como automático');
}

seccion('B · Una a la vez, y lo que espera se une');
{
  const srv = crearServidor();
  const { w } = crear(srv);
  const c = compuerta();
  srv.S.fallos.aplicar.push(c.p);
  const p1 = w.guardar(horario(1));
  await dormir(5);
  const p2 = w.guardar(horario(2));
  const p3 = w.guardar(horario(3), { automatico: true });
  const p4 = w.guardar(horario(4));
  ok(srv.S.llamadas.aplicar === 1, 'mientras vuela una, no sale otra');
  c.abrir();
  const rs = await Promise.all([p1, p2, p3, p4]);
  ok(rs.every((r) => r.ok), 'todas acaban bien');
  ok(srv.S.enviadas.length === 2 && srv.S.filas.horarioTop.n === 4, 'las tres que esperaban se unieron en UNA operación, con el último valor');
  ok(srv.S.enviadas[1].manual === true && srv.S.enviadas[1].tipo === 'editar_horario', 'unida con un cambio tuyo, la operación es manual');
  ok(srv.S.enviadas[1].horario.base === srv.S.enviadas[0].horario.valor.testigo.revision, 'y su base es la revisión de la anterior');
}

seccion('C · Respuestas perdidas (el mismo opId siempre)');
{
  /* I2 en el cliente: llega y se pierde la respuesta → se pregunta → aplicada. */
  let srv = crearServidor();
  let { w } = crear(srv);
  srv.S.fallos.aplicar.push('despues');
  let r = await w.guardar(horario(1));
  ok(r.ok && srv.S.aplicaciones === 1 && srv.S.llamadas.estado === 1, 'respuesta perdida DESPUÉS de aplicarse: se pregunta y se confirma, aplicada una sola vez');
  ok(srv.S.enviadas.length === 1, '…sin reenviar nada');
  /* No llegó → «desconocida» → se reenvía LA MISMA. */
  srv = crearServidor(); ({ w } = crear(srv));
  srv.S.fallos.aplicar.push('antes');
  r = await w.guardar(horario(1));
  ok(r.ok && srv.S.aplicaciones === 1 && srv.S.enviadas.length === 2, 'no llegó: el estado dice «desconocida» y se reenvía');
  ok(srv.S.enviadas[0] === srv.S.enviadas[1] && srv.S.enviadas[0].opId === srv.S.enviadas[1].opId, '…exactamente la MISMA operación (mismo objeto, mismo opId)');
  /* Sin conexión: ni aplicar ni estado contestan → pendiente; al volver, la misma. */
  srv = crearServidor(); ({ w } = crear(srv));
  srv.S.fallos.aplicar.push('antes'); srv.S.fallos.estado.push('antes');
  r = await w.guardar(horario(1));
  ok(!r.ok && r.pendiente && w.vista().estado === 'pendiente' && w.vista().motivo === 'sin_conexion', 'sin conexión: pendiente, en memoria (C-84)');
  ok(srv.S.aplicaciones === 0, '…y no se aplicó nada');
  const opPendiente = srv.S.enviadas[0];
  await w.reintentar();
  ok(srv.S.aplicaciones === 1 && srv.S.enviadas.at(-1) === opPendiente && w.vista().estado === 'en_orden', 'al reintentar sale la MISMA operación y se aplica una vez');
  /* Se aplicó, se perdió la respuesta y no se pudo preguntar → al reintentar, el registro contesta «aplicada». */
  srv = crearServidor(); ({ w } = crear(srv));
  srv.S.fallos.aplicar.push('despues'); srv.S.fallos.estado.push('antes');
  r = await w.guardar(horario(1));
  ok(!r.ok && r.pendiente && srv.S.aplicaciones === 1, 'aplicada sin saberlo: queda pendiente (no se sabe), con la cuenta ya cambiada');
  await w.reintentar();
  ok(srv.S.aplicaciones === 1 && w.vista().estado === 'en_orden' && w.confirmado().valor.n === 1, 'al reintentar, el registro contesta «aplicada»: no se aplica dos veces');
  /* Un cambio pedido mientras otra está pendiente va DETRÁS de ella, nunca la sustituye. */
  srv = crearServidor(); ({ w } = crear(srv));
  srv.S.fallos.aplicar.push('antes'); srv.S.fallos.estado.push('antes');
  await w.guardar(horario(1));
  const pendiente = srv.S.enviadas[0];
  srv.S.fallos.aplicar.push('antes'); srv.S.fallos.estado.push('antes');
  await w.guardar(horario(2));
  ok(srv.S.enviadas.every((o) => o === pendiente), 'un cambio nuevo con otra pendiente: reintenta la pendiente (la misma), no la sustituye');
  await w.reintentar();
  ok(srv.S.enviadas.length >= 3 && srv.S.filas.horarioTop.n === 2 && srv.S.aplicaciones === 2, 'al volver la conexión: la pendiente y después la nueva, en orden');
  ok(srv.S.enviadas.at(-1).horario.base === pendiente.horario.valor.testigo.revision, '…la nueva sobre la revisión de la pendiente');
  /* Dos vueltas de «desconocida» seguidas: queda pendiente, sin bucles. */
  srv = crearServidor(); ({ w } = crear(srv));
  srv.S.fallos.aplicar.push('antes', 'antes');
  r = await w.guardar(horario(1));
  ok(!r.ok && r.pendiente && srv.S.llamadas.aplicar === 2 && srv.S.llamadas.estado === 2, 'dos veces sin llegar: pendiente tras dos vueltas, sin bucle');
}

seccion('D · Conflicto manual: la copia la guarda el servidor');
{
  const srv = crearServidor({ inicial: {} });
  const { w, adoptados } = crear(srv);
  await w.guardar(horario(1));
  const suya = srv.otroAparato({ horarios: [], bloques: [], n: 'otro' });
  const r = await w.guardar(horario(2));
  ok(!r.ok && r.conflicto, 'un cambio tuyo que choca: conflicto');
  ok(srv.S.filas.horarioTop.testigo.revision === suya && srv.S.filas.horarioTop.n === 'otro', 'lo del otro aparato sigue en la cuenta: no se pisa');
  ok(srv.S.copias.size === 1 && [...srv.S.copias.values()][0].op.horario.valor.n === 2, 'el servidor apartó la operación ENTERA (en la misma transacción)');
  const v = w.vista();
  ok(v.estado === 'conflicto' && w.motivoBloqueo() === MOTIVO_CONFLICTO_HORARIO, 'Horarios en solo lectura por el conflicto');
  ok(v.conflicto.copia.estado === 'guardada' && v.conflicto.copia.opId === srv.S.enviadas.at(-1).opId, 'la copia está guardada en la cuenta (no se pierde al cerrar)');
  ok(v.conflicto.aparatoSuyo === 'otro' && v.conflicto.motivo.motivo === 'revision', 'el aviso sabe qué aparato y por qué');
  ok(adoptados.length === 0, 'la pantalla sigue con TU cambio (no se adopta nada sin que elijas)');
  const otro = await w.guardar(horario(3));
  const auto = await w.guardar(horario(4), { automatico: true });
  ok(!otro.ok && otro.conflicto && auto.ok && auto.omitido && srv.S.enviadas.length === 2, 'con el conflicto abierto no sale nada: lo tuyo contesta conflicto y lo automático se omite');
  ok((await w.descartarMiCambio()).motivo === 'sin_confirmacion' && w.vista().conflicto, '«Descartar» sin confirmar no hace nada');
  w.verLoDeAhora();
  ok(!w.vista().conflicto && adoptados.at(-1).motivo === 'ver_ahora' && adoptados.at(-1).v.n === 'otro', '«Ver lo que hay ahora»: la pantalla pasa a lo de la cuenta');
  ok(srv.S.copias.size === 1, '…y tu cambio queda apartado');
  const r3 = await w.guardar(horario(5));
  ok(r3.ok && srv.S.filas.horarioTop.n === 5 && srv.S.enviadas.at(-1).horario.base === suya, 'y puedes seguir: el siguiente cambio sale sobre lo de la cuenta');
  /* Descartar, con confirmación: la copia se borra en el servidor. */
  srv.otroAparato({ n: 'otro2' });
  await w.guardar(horario(6));
  ok(srv.S.copias.size === 2, 'otro conflicto: otra copia');
  const d = await w.descartarMiCambio({ confirmado: true });
  ok(d.ok && d.copiaBorrada && srv.S.copias.size === 1 && adoptados.at(-1).motivo === 'descartado', '«Descartar mi cambio» confirmado: se borra SU copia y la pantalla pasa a lo de la cuenta');
}

seccion('D2 · Un cambio tuyo que esperaba detrás de uno que choca también se aparta');
{
  const srv = crearServidor();
  const { w } = crear(srv);
  await w.guardar(horario(1));
  srv.otroAparato({ n: 'otro' });
  const c = compuerta(); srv.S.fallos.aplicar.push(c.p);
  const p1 = w.guardar(horario(2));
  await dormir(5);
  const p2 = w.guardar(horario(3));
  c.abrir();
  const [r1, r2] = await Promise.all([p1, p2]);
  await w.esperar();
  ok(!r1.ok && r1.conflicto && !r2.ok && r2.conflicto, 'los dos acaban en conflicto');
  ok(srv.S.copias.size === 2 && srv.S.filas.horarioTop.n === 'otro', 'y los dos quedan apartados en la cuenta, sin pisar lo del otro aparato');
  ok(w.vista().conflicto.copias.length === 2, 'el conflicto los cuenta a los dos');
  ok(srv.S.enviadas[2].horario.base === srv.S.enviadas[1].horario.base, 'el segundo se mandó con la base que vio la pantalla (nunca con la revisión nueva)');
}

seccion('D3 · «Descartar» y «Ver lo de ahora» con un cambio apartándose todavía');
{
  /* Descartar mientras el segundo se aparta (su petición está en el aire): su copia se borra al llegar. */
  let srv = crearServidor(); let { w } = crear(srv);
  await w.guardar(horario(1));
  srv.otroAparato({ n: 'otro' });
  let c1 = compuerta(); let c2 = compuerta();
  srv.S.fallos.aplicar.push(c1.p, c2.p);
  let p1 = w.guardar(horario(2)); await dormir(5); let p2 = w.guardar(horario(3));
  c1.abrir(); await p1; await dormir(5);
  ok(srv.S.llamadas.aplicar === 3 && srv.S.copias.size === 1 && w.vista().conflicto, 'el primero ya está apartado y el segundo se está apartando (en el aire)');
  const d = await w.descartarMiCambio({ confirmado: true });
  ok(d.ok && d.borradas === 1 && srv.S.copias.size === 0, '«Descartar» borra la copia que ya estaba');
  c2.abrir(); await p2; await w.esperar(); await dormir(5);
  ok(srv.S.copias.size === 0 && srv.S.registro.size === 3, 'la del segundo llega al servidor y también se borra: no queda ninguna copia');
  ok(!w.vista().conflicto, '…y el conflicto no se vuelve a abrir');
  /* «Ver lo de ahora» mientras el segundo se aparta: su copia se queda, y el conflicto no se reabre. */
  srv = crearServidor(); ({ w } = crear(srv));
  await w.guardar(horario(1));
  srv.otroAparato({ n: 'otro' });
  c1 = compuerta(); c2 = compuerta();
  srv.S.fallos.aplicar.push(c1.p, c2.p);
  p1 = w.guardar(horario(2)); await dormir(5); p2 = w.guardar(horario(3));
  c1.abrir(); await p1; await dormir(5);
  w.verLoDeAhora();
  ok(!w.vista().conflicto && w.vista().apartadasSinGuardar === 1, '«Ver lo de ahora»: conflicto cerrado, con un cambio todavía apartándose');
  c2.abrir(); await p2; await w.esperar();
  ok(!w.vista().conflicto && srv.S.copias.size === 2, 'su copia llega y se queda, y el conflicto NO se reabre');
  ok(w.vista().estado === 'en_orden' && srv.S.filas.horarioTop.n === 'otro', 'y la cuenta sigue con lo del otro aparato');
}

seccion('E · Un guardado automático que choca');
{
  let srv = crearServidor(); let r;
  let { w, adoptados } = crear(srv);
  await w.guardar(horario(1));
  srv.otroAparato({ n: 'otro' });
  r = await w.guardar(horario(2), { automatico: true });
  ok(r.ok && r.recalculado && !w.vista().conflicto, 'automático que choca: se recalcula, sin conflicto');
  ok(srv.S.copias.size === 0, '…y sin copia (condición 4 de D2-bis)');
  ok(adoptados.at(-1).motivo === 'automatico' && adoptados.at(-1).v.n === 'otro' && w.confirmado().valor.n === 'otro', '…la pantalla adopta lo de la cuenta');
  /* Con un cambio tuyo detrás, calculado sobre lo viejo: ése se aparta (nunca con la revisión nueva). */
  srv = crearServidor(); ({ w, adoptados } = crear(srv));
  await w.guardar(horario(1));
  const vieja = srv.rev();
  srv.otroAparato({ n: 'otro' });
  const c = compuerta(); srv.S.fallos.aplicar.push(c.p);
  const pa = w.guardar(horario(2), { automatico: true });
  await dormir(5);
  const pm = w.guardar(horario(3));
  c.abrir();
  const [ra, rm] = await Promise.all([pa, pm]);
  await w.esperar();
  ok(ra.ok && !rm.ok && rm.conflicto, 'el automático se recalcula y el tuyo de detrás es un conflicto');
  ok(srv.S.filas.horarioTop.n === 'otro' && srv.S.copias.size === 1 && [...srv.S.copias.values()][0].op.horario.valor.n === 3, 'el tuyo queda apartado en la cuenta y lo del otro aparato sigue');
  ok(srv.S.enviadas.at(-1).horario.base === vieja, 'el tuyo salió con la base que vio la pantalla, NO con la revisión nueva del otro aparato');
  ok(w.vista().conflicto && w.vista().conflicto.copias.length === 1 && !adoptados.length, 'conflicto abierto con su copia, y la pantalla sigue con lo tuyo');
}

seccion('F · El protocolo');
{
  for (const [motivo, prep] of [
    ['sin_protocolo', (S) => S.fallos.protocolo.push('sinFunciones')],
    ['protocolo_distinto', (S) => { S.protocolo.version = 2; }],
    ['version_antigua', (S) => { S.protocolo.versionMinima = '9.0.0'; }],
  ]) {
    const srv = crearServidor(); prep(srv.S);
    const { w } = crear(srv);
    const r = await w.guardar(horario(1));
    ok(!r.ok && r.bloqueado && r.error.code === motivo && w.vista().estado === 'bloqueado' && w.motivoBloqueo() === MOTIVO_PROTOCOLO_HORARIO, `${motivo}: Horarios en solo lectura`);
    ok(srv.S.llamadas.aplicar === 0 && !('horarioTop' in srv.S.filas), `${motivo}: no se escribe nada a ciegas`);
    const r2 = await w.guardar(horario(2));
    ok(!r2.ok && r2.bloqueado && srv.S.llamadas.protocolo === 1, `${motivo}: los siguientes guardados se niegan sin tocar la red`);
  }
  const srv = crearServidor(); srv.S.fallos.protocolo.push('antes');
  const { w } = crear(srv);
  const r = await w.guardar(horario(1));
  ok(!r.ok && r.pendiente && w.vista().motivo === 'sin_conexion' && srv.S.llamadas.aplicar === 0, 'protocolo sin conexión: pendiente, sin enviar nada');
  await w.reintentar();
  ok(srv.S.filas.horarioTop.n === 1 && srv.S.llamadas.protocolo === 2, 'al volver la conexión se consulta y sale');
  const srv2 = crearServidor(); srv2.S.desfaseServidorMs = 3600 * 1000;
  const { w: w2 } = crear(srv2);
  const antes = Date.now();
  await w2.guardar(horario(1));
  const creada = Date.parse(srv2.S.enviadas[0].creadaEn);
  ok(creada - antes > 3590 * 1000 && creada - antes < 3610 * 1000, 'creadaEn lleva la hora del servidor (una hora por delante del reloj del aparato)');
}

seccion('G · Respuestas del servidor que no son ni aplicada ni conflicto');
{
  let srv = crearServidor(); let { w } = crear(srv);
  await w.guardar(horario(1));
  srv.S.registro.set('x', null);
  /* Fuerza «op_distinta»: el registro tiene ese opId con otra huella. */
  srv.S.enviadas.length = 0;
  const aplicarOriginal = srv.transporte.aplicar;
  srv.transporte.aplicar = async (op) => { srv.S.enviadas.push(op); return { ok: true, data: { estado: 'invalida', motivo: 'op_distinta', opId: op.opId } }; };
  let r = await w.guardar(horario(2));
  ok(!r.ok && r.bloqueado && r.error.code === 'operacion_invalida' && w.vista().estado === 'bloqueado', '«inválida»: bloqueado, no se insiste');
  ok(srv.S.enviadas.length === 1, '…y no se reenvía');
  srv.transporte.aplicar = aplicarOriginal;
  srv = crearServidor(); ({ w } = crear(srv));
  srv.S.fallos.aplicar.push('sesion');
  r = await w.guardar(horario(1));
  ok(!r.ok && r.pendiente && w.vista().motivo === 'sesion', 'sin sesión: pendiente («sesion»)');
  srv.S.fallos.aplicar.push('definitivo');
  await w.reintentar();
  ok(w.vista().estado === 'pendiente' && w.vista().motivo === 'error' && srv.S.aplicaciones === 0, 'un error de la base de datos (la transacción se deshizo): pendiente, nada aplicado');
  await w.reintentar();
  ok(srv.S.aplicaciones === 1 && new Set(srv.S.enviadas.map((o) => o.opId)).size === 1, 'al reintentar, la MISMA operación se aplica una vez');
  srv = crearServidor(); ({ w } = crear(srv));
  srv.transporte.aplicar = async () => ({ ok: true, data: { estado: 'algo_nuevo' } });
  r = await w.guardar(horario(1));
  ok(!r.ok && r.bloqueado && r.error.code === 'respuesta_desconocida', 'una respuesta que no se entiende: bloqueado, nada más');
  srv = crearServidor(); ({ w } = crear(srv));
  srv.transporte.aplicar = async (op) => ({ ok: true, data: { estado: 'caducada', opId: op.opId } });
  r = await w.guardar(horario(1));
  ok(!r.ok && r.conflicto && w.vista().conflicto.copia.estado === 'sin_guardar' && w.vista().conflicto.copia.motivo === 'caducada', '«caducada»: no se aplica ni se reenvía; queda como cambio tuyo sin apartar');
}

seccion('H · Varias claves: todo o nada, con las condiciones de lo guardado');
{
  /* Lo guardado tiene una forma vieja; la pantalla lo enseña normalizado (con `oculto`). */
  const normalizar = (v) => ({ ...v, asignaturas: (v.asignaturas || []).map((a) => ({ oculto: false, ...a })), horas: v.horas || [] });
  const estudios = { asignaturas: [{ id: 'bio', nombre: 'Bio' }, { id: 'mat', nombre: 'Mates' }], horas: [{ id: 'h1', asignaturaId: 'bio' }] };
  const papelera = { elementos: [], retencionDias: 30 };
  const srv = crearServidor({ inicial: { estudios, papelera } });
  const llevadas = [];
  const cola = { reservar: () => ({ listo: Promise.resolve(), soltar: () => llevadas.push('soltado') }), aplicarAPendientes: (k, cambios) => llevadas.push([k, cambios.length]) };
  const { w, aplicadas } = crear(srv, { cola });
  await w.guardar(horario(1));
  const antesE = normalizar(estudios);
  const despuesE = { ...antesE, asignaturas: antesE.asignaturas.filter((a) => a.id !== 'bio'), horas: [] };
  const entrada = { id: 'pap1', modulo: 'estudios', item: antesE.asignaturas[0] };
  const r = await w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(2), claves: [
    { clave: 'estudios', antes: antesE, despues: despuesE, normalizar },
    { clave: 'papelera', antes: papelera, despues: { ...papelera, elementos: [entrada] } },
  ] });
  ok(r.ok, 'borrar una asignatura con clases: una operación de tres claves, aplicada');
  ok(srv.S.filas.estudios.asignaturas.map((a) => a.id).join() === 'mat' && srv.S.filas.estudios.horas.length === 0 && srv.S.filas.papelera.elementos.length === 1 && srv.S.filas.horarioTop.n === 2, '…las tres a la vez');
  ok(!('oculto' in srv.S.filas.estudios.asignaturas[0]), 'sin conflicto falso: las condiciones eran lo guardado (forma vieja), y lo demás no se reescribió normalizado');
  ok(aplicadas.length === 1 && aplicadas[0].claves.length === 2, 'la pantalla recibe la operación aplicada (alAplicar)');
  ok(llevadas.some((x) => Array.isArray(x) && x[0] === 'estudios') && llevadas.some((x) => Array.isArray(x) && x[0] === 'papelera') && llevadas.includes('soltado'), 'y la cola la lleva a lo pendiente de las dos claves y suelta el turno');
  /* C1: otro aparato cambió OTRA asignatura. */
  srv.S.filas.estudios.asignaturas.push({ id: 'his', nombre: 'Historia (otro)' });
  const antes2 = normalizar({ ...srv.S.filas.estudios, asignaturas: srv.S.filas.estudios.asignaturas.filter((a) => a.id !== 'his') });
  const r2 = await w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(3), claves: [{ clave: 'estudios', antes: antes2, despues: { ...antes2, asignaturas: [] }, normalizar }] });
  ok(r2.ok && srv.S.filas.estudios.asignaturas.map((a) => a.id).join() === 'his', 'C1: lo que otro aparato cambió en otra asignatura se conserva');
  /* C2: otro aparato cambió la que se borra → nada de nada, y la operación entera apartada. */
  srv.S.filas.estudios.asignaturas.push({ id: 'fis', nombre: 'Física' });
  const vista = normalizar(srv.S.filas.estudios);
  srv.S.filas.estudios.asignaturas = srv.S.filas.estudios.asignaturas.map((a) => (a.id === 'fis' ? { ...a, nombre: 'Física (otro)' } : a));
  const fotoAntes = JSON.stringify(srv.S.filas);
  const r3 = await w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(4), claves: [
    { clave: 'estudios', antes: vista, despues: { ...vista, asignaturas: vista.asignaturas.filter((a) => a.id !== 'fis') }, normalizar },
    { clave: 'papelera', antes: srv.S.filas.papelera, despues: { ...srv.S.filas.papelera, elementos: [...srv.S.filas.papelera.elementos, { id: 'pap2' }] } },
  ] });
  ok(!r3.ok && r3.conflicto && JSON.stringify(srv.S.filas) === fotoAntes, 'C2: si otro aparato cambió la asignatura que se borra, no se escribe NADA (ni el horario, ni estudios, ni la papelera)');
  const cop = [...srv.S.copias.values()].at(-1);
  ok(cop.op.claves.length === 2 && cop.op.horario.valor.n === 4 && cop.meta.motivo.motivo === 'elemento_distinto' && cop.meta.motivo.id === 'fis', '…y la operación ENTERA queda apartada, con el motivo exacto');
  ok(w.vista().conflicto.motivo.clave === 'estudios', 'el conflicto dice qué clave chocó');
  /* Reglas de entrada. */
  ok((await w.guardarOperacion({ tipo: 'x', claves: [] })).error.code === 'operacion_sin_horario', 'una operación sin horario se niega (la cadena de revisiones es lo que protege)');
  ok((await w.guardarOperacion({ tipo: 'x', horario: horario(9), claves: [{ clave: 'fitness', antes: {}, despues: {} }] })).error.code === 'clave_no_permitida', 'una clave fuera de la lista cerrada se niega');
}

seccion('H2 · Lo que se pide mientras espera se une (D-1 B), y lo que ya salió no');
{
  const srv = crearServidor({ inicial: { estudios: { asignaturas: [{ id: 'a' }, { id: 'b' }] } } });
  const { w } = crear(srv);
  await w.guardar(horario(1));
  const c = compuerta(); srv.S.fallos.aplicar.push(c.p);
  const p0 = w.guardar(horario(2));
  await dormir(5);
  const est = srv.S.filas.estudios;
  const p1 = w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(3), claves: [{ clave: 'estudios', antes: est, despues: { asignaturas: [{ id: 'b' }] } }] });
  const p2 = w.guardar(horario(4));
  const p3 = w.guardarOperacion({ tipo: 'borrar_asignatura', horario: horario(5), claves: [{ clave: 'estudios', antes: est, despues: { asignaturas: [{ id: 'a' }] } }] });
  c.abrir();
  await Promise.all([p0, p1, p2, p3]);
  ok(srv.S.enviadas.length === 4, 'una en vuelo + dos operaciones de varias claves = tres más (las de varias claves no se unen entre sí)');
  ok(srv.S.enviadas[2].horario.valor.n === 4 && srv.S.enviadas[2].tipo === 'borrar_asignatura', 'el cambio del horario pedido después se unió a la operación que esperaba (D-1 B)');
  ok(srv.S.filas.estudios.asignaturas.length === 0 && srv.S.filas.horarioTop.n === 5, 'y las dos se aplicaron en orden');
}

seccion('I · La guardia: arranque sin testigo y bloqueo');
{
  const oyentes = new Set();
  let intencion = false; let bloqueo = null;
  const guardia = {
    aparato: 'yo',
    prepararEscritura(nuevo, actual) {
      if (!intencion) return { valor: { ...nuevo, version: 1 }, conTestigo: false, arranque: true };
      const revision = uuid();
      return { valor: { ...nuevo, version: 1, testigo: { formato: 1, revision, base: actual && actual.testigo ? actual.testigo.revision : null, aparato: 'yo' } }, conTestigo: true, arranque: true, revision };
    },
    motivoBloqueo: () => bloqueo,
    despuesDeGuardar: () => { guardia.demostraciones = (guardia.demostraciones || 0) + 1; return Promise.resolve(); },
    suscribir: (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); },
  };
  const srv = crearServidor();
  const { w } = crear(srv, { guardia });
  const r = await w.guardar(horario(1));
  ok(!r.ok && r.pendiente && w.vista().motivo === 'arranque' && srv.S.llamadas.aplicar === 0, 'en el arranque sin intención confirmada no hay testigo: no se manda nada (el servidor exige revisión)');
  intencion = true;
  oyentes.forEach((fn) => fn());
  await w.esperar(); await dormir(5); await w.esperar();
  ok(srv.S.filas.horarioTop && srv.S.filas.horarioTop.n === 1 && srv.S.filas.horarioTop.testigo.aparato === 'yo', 'al confirmarse la intención (la guardia avisa), sale con testigo');
  ok(guardia.demostraciones === 1, 'y en el arranque se pide la relectura que demuestra el testigo');
  bloqueo = 'horario_guardia';
  const r2 = await w.guardar(horario(2));
  ok(!r2.ok && r2.pendiente && w.vista().motivo === 'guardia' && srv.S.filas.horarioTop.n === 1, 'con la guardia bloqueada: pendiente, nada sale');
  bloqueo = null;
  oyentes.forEach((fn) => fn());
  await w.esperar(); await dormir(5); await w.esperar();
  ok(srv.S.filas.horarioTop.n === 2, 'y al desbloquearse, sale');
  w.cerrar();
  ok(oyentes.size === 0, 'cerrar suelta la suscripción a la guardia');
}

seccion('J · Releer, sinCambiosAjenos y cerrar');
{
  const srv = crearServidor();
  const { w, adoptados } = crear(srv);
  await w.guardar(horario(1));
  ok((await w.sinCambiosAjenos()) === true, 'sinCambiosAjenos: true si en la cuenta sigue lo que vio');
  srv.otroAparato({ n: 'otro' });
  ok((await w.sinCambiosAjenos()) === false, '…false si otro aparato escribió después');
  srv.S.fallos.leer.push('antes');
  ok((await w.sinCambiosAjenos()) === null, '…null si no se puede saber');
  await w.releer();
  ok(adoptados.at(-1).motivo === 'releido' && w.confirmado().valor.n === 'otro', 'releer sin nada pendiente: la pantalla pasa a lo de la cuenta');
  const n0 = adoptados.length;
  await w.releer();
  ok(adoptados.length === n0, 'releer otra vez sin cambios: no adopta nada');
  const c = compuerta(); srv.S.fallos.aplicar.push(c.p);
  const p = w.guardar(horario(2));
  await dormir(5);
  w.cerrar();
  const r = await p;
  ok(!r.ok && r.error.code === 'cerrado', 'cerrar resuelve lo que esperaba (la sesión se cerró)');
  c.abrir();
  ok((await w.guardar(horario(3))).error.code === 'cerrado', 'y un escritor cerrado no guarda');
}

seccion('K · Invariantes de todo lo enviado en esta prueba');
{
  /* Un recorrido largo y desordenado: cada opId se mandó siempre con el mismo contenido y nunca sin condición. */
  const srv = crearServidor();
  const { w } = crear(srv);
  for (let i = 0; i < 40; i += 1) {
    const f = Math.random();
    if (f < 0.15) srv.S.fallos.aplicar.push('antes');
    else if (f < 0.3) srv.S.fallos.aplicar.push('despues');
    if (Math.random() < 0.1) srv.S.fallos.estado.push('antes');
    if (Math.random() < 0.08) { srv.otroAparato({ n: `otro${i}` }); }
    await w.guardar(horario(i), { automatico: Math.random() < 0.3 });
    if (w.vista().conflicto) w.verLoDeAhora();
    if (w.vista().estado === 'pendiente') await w.reintentar();
  }
  await w.reintentar(); await w.esperar();
  const porId = new Map();
  let distinto = 0;
  for (const op of srv.S.enviadas) {
    const t = textoCanonico(op);
    if (porId.has(op.opId) && porId.get(op.opId) !== t) distinto += 1;
    porId.set(op.opId, t);
  }
  ok(distinto === 0, `${srv.S.enviadas.length} envíos: un opId, un contenido (nunca «op_distinta»)`);
  ok(srv.S.enviadas.every((op) => validarOperacion(op) === null && op.horario && op.horario.base !== undefined && typeof op.horario.baseExiste === 'boolean'), 'todas válidas y todas con su condición de revisión');
  ok([...srv.S.registro.values()].filter((x) => x && x.resultado === 'aplicada').length === srv.S.aplicaciones, 'cada aplicación tiene su registro (ninguna aplicada dos veces)');
  ok(igualJson(w.confirmado().valor, srv.S.filas.horarioTop) || w.vista().estado !== 'en_orden', 'al terminar en orden, lo confirmado es lo de la cuenta');
}

console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones del escritor de operaciones`);
process.exit(fallos ? 1 : 0);
