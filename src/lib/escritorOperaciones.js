/**
 * 🛡 HORARIOS · E1-R, R2 — EL ESCRITOR DE OPERACIONES PROTEGIDAS (docs/19 §18.16).
 *
 * Es el escritor protegido de E1 (`escritorHorario.js`, §18.14) adaptado a la operación protegida de R1: el MISMO
 * contrato público (`guardar`, `reintentar`, `releer`, `sinCambiosAjenos`, `verLoDeAhora`, `descartarMiCambio`,
 * `motivoBloqueo`, `vista`, `confirmado`, `suscribir`, `cerrar`, `esperar`), la misma política y los mismos textos,
 * pero cada guardado es una OPERACIÓN que el servidor (`protegido_aplicar`) guarda entera o no guarda:
 *   · **una a la vez**, en orden. Lo que se pide mientras una vuela va en la siguiente; un cambio del horario que se
 *     pide antes de que salga la anterior se UNE a ella (D-1 B: «lo que se cambie en el horario mientras la operación
 *     espera se une a ella»);
 *   · **el mismo `opId` en cada reintento**: una operación preparada no se vuelve a construir (el servidor guarda su
 *     huella; con otro contenido contestaría `op_distinta`);
 *   · **una respuesta perdida no se repite a ciegas**: se pregunta (`protegido_estado`, que espera a una operación en
 *     curso) y solo con «desconocida» se reenvía —la misma—;
 *   · **un cambio tuyo que choca** no se escribe y no se pierde: el SERVIDOR lo aparta entero en la misma transacción
 *     (H-08; antes, la copia iba al historial de versiones con otra escritura que podía fallar). Horarios queda en
 *     solo lectura con las dos salidas de siempre (D2, opción B);
 *   · **un guardado automático que choca** adopta lo de la cuenta sin copia (condición 4 de D2-bis). Si detrás hay un
 *     cambio tuyo calculado sobre lo viejo, ése sí se aparta: se manda con la base que vio, el servidor lo rechaza y
 *     lo guarda como copia. Nunca se manda con la revisión nueva: pisaría lo del otro aparato;
 *   · **el protocolo** se consulta antes del primer envío: sin las funciones del servidor, con otra versión del
 *     protocolo o con una aplicación más vieja que la mínima, Horarios queda en solo lectura y NO escribe a ciegas;
 *   · **las demás claves** (`estudios`, `papelera`) van por elementos, con sus condiciones construidas con lo GUARDADO
 *     (`prepararCambios`), y antes de leerlas se espera al guardado anterior de esas claves (`cola.reservar`). Cuando
 *     la operación se aplica, se lleva a lo que tenga pendiente la cola de esas claves (`cola.aplicarAPendientes`),
 *     para que un guardado de antes no la deshaga desde este aparato.
 * Nada pendiente en el aparato (C-84): lo que no ha llegado vive en memoria. Lo único duradero es la copia apartada,
 * que la guarda el servidor.
 *
 * 🔓 Desde R3 es el escritor de la aplicación (`App.jsx`): todo guardado del horario, borrar una asignatura que está
 * en él y Deshacer de esas operaciones pasan por aquí (§18.17). El de E1 (`crearEscritorDeHorario`) sigue en su
 * archivo, con sus pruebas, como la referencia del contrato. Este se prueba en Node y contra el servidor de verdad del
 * laboratorio (`test-escritor-operaciones*.mjs`, `test-asignatura-protegida*.mjs`).
 *
 * ⚠️ Solo importa hojas (`escritorHorario.js`, `operacionesProtegidas.js`, `guardiaHorario.js`).
 */
import { revisionDelSello, mismoContenido, TEXTOS_CONFLICTO, MOTIVO_CONFLICTO_HORARIO } from './escritorHorario';
import {
  crearOperacion, validarOperacion, prepararCambios, leerProtocolo, horaDelServidor, nuevoOpId, CLAVES_POR_ELEMENTOS, cambiosDelHorario,
} from './operacionesProtegidas';

/** El motivo de solo lectura cuando el servidor no tiene el protocolo que habla este cliente. */
export const MOTIVO_PROTOCOLO_HORARIO = 'horario_protocolo';
/** Los bloqueos que vienen del protocolo (Horarios en solo lectura hasta recargar o instalar el servidor). */
export const BLOQUEOS_DE_PROTOCOLO = Object.freeze(['sin_protocolo', 'protocolo_distinto', 'version_antigua', 'protocolo_ilegible']);
/** Dentro de un envío, cuántas veces se reenvía la MISMA operación tras «desconocida» antes de dejarla pendiente. */
export const VUELTAS_OPERACION = 2;

export const TEXTOS_PROTOCOLO = Object.freeze({
  sin_protocolo: 'Tu cuenta todavía no tiene la protección de los cambios del horario. Para no guardar nada a ciegas, Horarios no guarda cambios.',
  protocolo_distinto: 'Tu cuenta usa una versión de la protección del horario que esta aplicación no conoce. Recarga la aplicación.',
  version_antigua: 'Esta versión de la aplicación es antigua para tu cuenta. Recarga la aplicación para seguir guardando el horario.',
  protocolo_ilegible: 'No se ha podido comprobar la protección del horario. Para no guardar nada a ciegas, Horarios no guarda cambios.',
  operacion_invalida: 'Este cambio del horario no se puede guardar con seguridad. No se ha guardado nada.',
  inexpresable: 'Este cambio no se puede guardar sin reescribir tus datos enteros. No se ha guardado nada.',
  sin_aleatoriedad: 'Este aparato no puede crear un identificador seguro para el cambio. No se ha guardado nada.',
  respuesta_desconocida: 'El servidor ha contestado algo que esta aplicación no entiende. No se ha guardado nada más.',
});

const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const RESULTADO_CONFLICTO = Object.freeze({ ok: false, conflicto: true, error: { code: 'conflicto_horario', message: TEXTOS_CONFLICTO.titulo } });

/**
 * `transporte` (en la app, `transporteProtegido` de `supabase.js`): `protocolo()`, `aplicar(op)`, `estado(opId)`,
 * `leer(claves)`, `copiaEliminar(copiaId)`; cada uno devuelve `{ ok, data }` o `{ ok: false, sinRespuesta | sinFunciones |
 * sesion | definitivo }`.
 * `cola` (en la app, la de `sincronizacion.js`): `reservar(claves) → { listo, soltar }` y `aplicarAPendientes(clave,
 * cambios)`. Opcional: sin ella no se espera a nadie (pruebas).
 * `alAplicar(op)`: la pantalla aplica las demás claves de una operación guardada. `alAdoptar(valor, { existe, motivo })`:
 * la pantalla pasa a enseñar lo de la cuenta.
 */
export function crearEscritorDeOperaciones({
  transporte, usuario, guardia = null, inicial = { valor: null, existe: false }, aparato = null, versionApp = null,
  cola = null, alAdoptar = () => {}, alAplicar = () => {}, ahora = () => new Date(), crypto = globalThis.crypto,
  normalizarHorario = (v) => v,
} = {}) {
  if (!transporte || !usuario) throw new Error('crearEscritorDeOperaciones necesita transporte y usuario');
  const s = {
    confirmado: { valor: inicial ? inicial.valor : null, existe: !!(inicial && inicial.existe) },
    entradas: [],             // { seq, tipo, manual, horario, claves, op, salida, preparado, apartar, grupo, baseVista, reserva, esperas, descartada }
    seq: 0,
    enVuelo: null, otraVuelta: false,
    estado: 'en_orden', motivo: null,
    conflicto: null,          // { mio, suyo, detectadoEn, motivo, copias: [{ opId, copiaId, estado, motivo }] }
    protocolo: null,          // lo que dijo `leerProtocolo` cuando fue bien
    cerrado: false,
    cuentas: { enviados: 0, aplicados: 0, conflictos: 0, adoptados: 0, sinRespuesta: 0, consultas: 0, reenvios: 0, copias: 0 },
  };
  const oyentes = new Set();
  const avisar = () => { if (s.cerrado) return; oyentes.forEach((fn) => { try { fn(); } catch { /* un oyente roto no para a los demás */ } }); };
  const poner = (estado, motivo = null) => { s.estado = estado; s.motivo = motivo; avisar(); };
  const resolver = (e, r) => { const l = e.esperas; e.esperas = []; l.forEach((fn) => fn(r)); };
  const soltarReserva = (e) => { if (e.reserva) { try { e.reserva.soltar(); } catch { /* ya suelta */ } e.reserva = null; } };
  const quitar = (e) => { soltarReserva(e); s.entradas = s.entradas.filter((x) => x !== e); };
  const vistaActual = () => ({ valor: s.confirmado.valor, existe: s.confirmado.existe });
  const ultimoHorario = () => {
    for (let i = s.entradas.length - 1; i >= 0; i -= 1) if (s.entradas[i].horario !== undefined && !s.entradas[i].descartada) return s.entradas[i].horario;
    return null;
  };

  const deltaDelHorario = (base, valor) => {
    try { return cambiosDelHorario(base === null ? null : normalizarHorario(base), normalizarHorario(valor)); } catch { return null; }
  };

  /* El testigo nuevo: el de la guardia de la A-bis o, sin guardia (pruebas), uno mínimo con el mismo contrato. */
  function prepararTestigo(valor, base) {
    if (guardia && typeof guardia.prepararEscritura === 'function') return guardia.prepararEscritura(valor, base.existe ? base.valor : null);
    const revision = nuevoOpId(crypto);
    const anterior = revisionDelSello('horarioTop', base.existe ? base.valor : null);
    if (!revision || !esObjeto(valor)) return { valor, conTestigo: false, arranque: false };
    return { valor: { ...valor, version: 1, testigo: { formato: 1, revision, base: anterior.legible ? anterior.revision : null, aparato } }, conTestigo: true, arranque: false, revision };
  }

  async function leerHorario() {
    let r;
    try { r = await transporte.leer(['horarioTop']); } catch (e) { r = { ok: false, sinRespuesta: true, error: e }; }
    if (!r || !r.ok || !esObjeto(r.data) || r.data.estado !== 'leidas' || !esObjeto(r.data.claves) || !esObjeto(r.data.claves.horarioTop)) return { ok: false, r };
    const h = r.data.claves.horarioTop;
    return { ok: true, existe: !!h.existe, valor: h.existe ? h.valor : null };
  }

  function motivoDeTransporte(r) {
    if (!r) return 'error';
    if (r.sinFunciones) return 'sin_protocolo';
    if (r.sesion) return 'sesion';
    if (r.sinRespuesta) return 'sin_conexion';
    return 'error';
  }

  /* Lo que no ha llegado queda pendiente: la de delante y todo lo que espera detrás de ella (sale en orden). */
  function quedaPendiente(e, motivo) {
    poner('pendiente', motivo);
    const r = { ok: false, pendiente: true, error: { code: motivo === 'sin_conexion' ? 'sin_conexion' : 'pendiente', message: 'Tu cambio del horario todavía no ha llegado a tu cuenta.' } };
    for (const x of s.entradas) if (!x.apartar || x === e) resolver(x, r);
  }
  function bloquear(motivo, e = null) {
    poner('bloqueado', motivo);
    const mensaje = TEXTOS_PROTOCOLO[motivo] || TEXTOS_CONFLICTO.selloIlegible;
    for (const x of e ? [e] : s.entradas) resolver(x, { ok: false, bloqueado: true, error: { code: motivo, message: mensaje } });
  }

  /* ── 1 · El protocolo, una vez por sesión ─────────────────────────────── */
  async function asegurarProtocolo() {
    if (s.protocolo) return { ok: true };
    const enviadoEn = ahora().getTime();
    let r;
    try { r = await transporte.protocolo(); } catch (e) { r = { ok: false, sinRespuesta: true, error: e }; }
    if (!r || !r.ok) {
      const m = motivoDeTransporte(r);
      return m === 'sin_protocolo' ? { ok: false, bloqueo: 'sin_protocolo' } : { ok: false, pendiente: m };
    }
    const p = leerProtocolo(r.data, { versionApp, enviadoEn, recibidoEn: ahora().getTime() });
    if (!p.ok) return { ok: false, bloqueo: p.motivo };
    s.protocolo = p;
    return { ok: true };
  }

  /* ── 2 · Preparar una entrada: su operación, una sola vez ─────────────── */
  async function preparar(e) {
    const base = e.baseVista || vistaActual();
    const sello = revisionDelSello('horarioTop', base.existe ? base.valor : null);
    if (!sello.legible) return { bloqueo: 'sello_ilegible' };
    const preparado = prepararTestigo(e.horario, base);
    if (!preparado || !preparado.conTestigo) return { pendiente: 'arranque' };
    /* R4 — con su cambio por elementos respecto a lo que vio (la base): lo que deja recuperar su copia sin pisar. Las
       dos partes por la MISMA puerta de carga (`normalizarHorario`, la de la pantalla): si no, lo guardado por una
       versión anterior difiere en cada elemento y la copia «tocaría» todo. */
    const horario = { base: sello.revision, baseExiste: base.existe, valor: preparado.valor, cambios: deltaDelHorario(base.existe ? base.valor : null, preparado.valor) };
    let claves = [];
    if (e.claves && e.claves.length) {
      const nombres = e.claves.map((c) => c.clave);
      if (cola && typeof cola.reservar === 'function' && !e.reserva) {
        e.reserva = cola.reservar(nombres);
        try { await e.reserva.listo; } catch { /* con tope: sale igual */ }
        if (s.cerrado) return { fin: true };
      }
      let lectura;
      try { lectura = await transporte.leer(nombres); } catch (err) { lectura = { ok: false, sinRespuesta: true, error: err }; }
      if (s.cerrado) return { fin: true };
      if (!lectura || !lectura.ok || !esObjeto(lectura.data) || lectura.data.estado !== 'leidas') return { pendiente: lectura && lectura.ok ? 'error' : motivoDeTransporte(lectura) };
      for (const c of e.claves) {
        const guardado = (lectura.data.claves || {})[c.clave] || { existe: false, valor: null };
        const p = prepararCambios({ antes: c.antes, despues: c.despues, guardado, normalizar: c.normalizar });
        if (!p.ok) return { bloqueo: 'inexpresable' };
        if (p.cambios.length) claves.push({ clave: c.clave, cambios: p.cambios, ...(p.inicial ? { inicial: p.inicial } : {}) });
      }
    }
    const opId = nuevoOpId(crypto);
    if (!opId) return { bloqueo: 'sin_aleatoriedad' };
    const op = crearOperacion({
      opId, tipo: e.tipo, manual: e.manual, aparato: aparato || (guardia && guardia.aparato) || null, versionApp,
      creadaEn: horaDelServidor(s.protocolo ? s.protocolo.desfaseMs : 0, ahora().getTime()), horario, claves,
    });
    if (validarOperacion(op)) return { bloqueo: 'operacion_invalida' };
    e.op = op;
    e.preparado = preparado;
    return { listo: true };
  }

  /* ── 3 · Lo que contestó el servidor ──────────────────────────────────── */
  function aplicada(e) {
    s.cuentas.aplicados += 1;
    if (e.op.horario) s.confirmado = { valor: e.op.horario.valor, existe: true };
    for (const c of e.op.claves || []) {
      if (cola && typeof cola.aplicarAPendientes === 'function') { try { cola.aplicarAPendientes(c.clave, c.cambios); } catch { /* la cola decide */ } }
    }
    /* R3 — con su asunto (H-12) y su contexto (lo que la pantalla necesita para el paso de Deshacer). */
    if ((e.op.claves || []).length) { try { alAplicar(e.op, { asunto: e.asunto || null, contexto: e.contexto || null }); } catch { /* la pantalla decide */ } }
    if (guardia && e.preparado && e.preparado.conTestigo && e.preparado.arranque && typeof guardia.despuesDeGuardar === 'function') {
      guardia.despuesDeGuardar(e.preparado, Promise.resolve());
    }
    quitar(e);
    resolver(e, { ok: true, error: null, opId: e.op.opId, operacion: e.op });
    if (!s.conflicto) poner(s.entradas.some((x) => !x.apartar) ? 'guardando' : 'en_orden');
    else avisar();
  }

  /* Lo que esperaba detrás de un cambio que no se guardó se calculó sobre la pantalla de antes: lo tuyo se aparta con
     la base que vio (el servidor lo rechazará y lo guardará entero, nunca encima de lo de otro aparato); lo automático
     se recalcula. */
  function apartarLoDeDetras(e, grupo) {
    for (const x of [...s.entradas]) {
      if (x === e) continue;
      if (x.apartar || x.op) { if (x.apartar && !x.grupo) x.grupo = grupo; continue; }
      if (x.manual) { x.apartar = true; x.grupo = grupo; x.baseVista = e.baseVista || vistaActual(); } else { quitar(x); resolver(x, { ok: true, error: null, recalculado: true }); }
    }
  }

  /* Un cambio tuyo apartado por el servidor (o que no se pudo guardar). Abre el conflicto si no lo está. Si es de un
     conflicto que ya se cerró («Ver lo que hay ahora» o «Descartar»), solo se apunta su copia: no se vuelve a abrir. */
  function abrirOSumarConflicto(e, { suyo, motivo, copiaId }) {
    s.cuentas.conflictos += 1;
    if (copiaId) s.cuentas.copias += 1;
    const copia = { opId: e.op ? e.op.opId : null, copiaId: copiaId || null, estado: copiaId ? 'guardada' : 'sin_guardar', motivo: copiaId ? null : (motivo && motivo.motivo) || 'sin_copia', asunto: e.asunto || null };
    if (e.grupo && e.grupo !== s.conflicto) {
      e.grupo.copias.push(copia);
      quitar(e);
      resolver(e, RESULTADO_CONFLICTO);
      if (e.descartada && copiaId) borrarCopia(copiaId);
      avisar();
      return;
    }
    if (!s.conflicto) {
      s.conflicto = { mio: ultimoHorario(), suyo, detectadoEn: ahora().toISOString(), motivo: motivo || null, copias: [] };
      s.suyoPendiente = null;
      apartarLoDeDetras(e, s.conflicto);
      s.estado = 'conflicto'; s.motivo = null;
    } else if (!s.conflicto.suyo && suyo) s.conflicto.suyo = suyo;
    s.conflicto.copias.push(copia);
    quitar(e);
    resolver(e, RESULTADO_CONFLICTO);
    if (e.descartada && copiaId) borrarCopia(copiaId);
    avisar();
  }

  async function borrarCopia(copiaId) {
    let r;
    try { r = await transporte.copiaEliminar(copiaId); } catch (err) { r = { ok: false, sinRespuesta: true, error: err }; }
    return !!(r && r.ok && esObjeto(r.data) && (r.data.estado === 'eliminada' || r.data.estado === 'no_existe'));
  }

  async function conflicto(e, data) {
    let suyo = null;
    if (esObjeto(data.actual)) suyo = { valor: data.actual.existe ? data.actual.valor : null, existe: !!data.actual.existe };
    else { const lh = await leerHorario(); if (lh.ok) suyo = { valor: lh.valor, existe: lh.existe }; }
    if (s.cerrado) return;
    if (e.manual || e.apartar) { abrirOSumarConflicto(e, { suyo, motivo: data.motivo || null, copiaId: data.copiaId || null }); return; }
    /* Un guardado automático: sin copia (condición 4). Lo tuyo que espera detrás se aparta; si no hay nada tuyo, se
       adopta lo de la cuenta y la pantalla lo recalcula. */
    quitar(e);
    resolver(e, { ok: true, error: null, recalculado: true });
    const tuyos = s.entradas.filter((x) => x.manual && !x.op);
    if (tuyos.length) {
      apartarLoDeDetras(e, null);
      if (suyo) s.suyoPendiente = suyo;
      avisar();
      return;
    }
    for (const x of [...s.entradas]) if (!x.op) { quitar(x); resolver(x, { ok: true, error: null, recalculado: true }); }
    if (suyo) {
      s.cuentas.adoptados += 1;
      s.confirmado = suyo;
      poner(s.entradas.length ? 'guardando' : 'en_orden');
      try { alAdoptar(suyo.valor, { existe: suyo.existe, motivo: 'automatico' }); } catch { /* la pantalla decide */ }
    } else poner(s.entradas.length ? 'guardando' : 'en_orden');
  }

  /* Devuelve 'fin' (la entrada terminó o queda pendiente) o 'otra' (reenviar la MISMA operación). */
  async function interpretar(e, data) {
    if (!esObjeto(data)) { bloquear('respuesta_desconocida', e); return 'fin'; }
    switch (data.estado) {
      case 'aplicada': aplicada(e); return 'fin';
      case 'conflicto': await conflicto(e, data); return 'fin';
      case 'desconocida': return 'otra';
      case 'sin_sesion': quedaPendiente(e, 'sesion'); return 'fin';
      case 'caducada':
        /* No se aplica nunca ni se reenvía sola (capa 4): se trata como un cambio tuyo apartado que el servidor no
           guardó. Con la limpieza del registro sin aprobar (H-16), hoy no puede ocurrir. */
        abrirOSumarConflicto(e, { suyo: null, motivo: { motivo: 'caducada' }, copiaId: null });
        return 'fin';
      case 'invalida': bloquear('operacion_invalida', e); return 'fin';
      default: bloquear('respuesta_desconocida', e); return 'fin';
    }
  }

  async function enviarEntrada(e) {
    if (guardia && typeof guardia.motivoBloqueo === 'function' && guardia.motivoBloqueo()) { quedaPendiente(e, 'guardia'); return; }
    const pr = await asegurarProtocolo();
    if (s.cerrado) return;
    if (!pr.ok) { if (pr.bloqueo) bloquear(pr.bloqueo); else quedaPendiente(e, pr.pendiente); return; }
    if (!e.op) {
      /* Desde aquí ya no se le une nada: lo que se pida mientras se prepara va en la siguiente. */
      e.salida = true;
      if (!s.conflicto) poner('guardando');
      const p = await preparar(e);
      if (s.cerrado || p.fin) return;
      if (!e.op) e.salida = false;
      if (p.bloqueo) { bloquear(p.bloqueo, e); return; }
      if (p.pendiente) { quedaPendiente(e, p.pendiente); return; }
    }
    for (let vuelta = 1; vuelta <= VUELTAS_OPERACION; vuelta += 1) {
      s.cuentas.enviados += 1;
      if (vuelta > 1) s.cuentas.reenvios += 1;
      if (!s.conflicto) poner('guardando');
      let r;
      try { r = await transporte.aplicar(e.op); } catch (err) { r = { ok: false, sinRespuesta: true, error: err }; }
      if (s.cerrado) return;
      if (r && r.ok) {
        if ((await interpretar(e, r.data)) === 'fin') return;
        continue;
      }
      if (r && r.sinFunciones) { bloquear('sin_protocolo'); return; }
      if (r && r.sesion) { quedaPendiente(e, 'sesion'); return; }
      if (r && r.definitivo) { quedaPendiente(e, 'error'); return; }
      /* Sin respuesta: ¿llegó? Se pregunta sin aplicar nada; el servidor espera a una operación en curso. */
      s.cuentas.sinRespuesta += 1;
      s.cuentas.consultas += 1;
      let q;
      try { q = await transporte.estado(e.op.opId); } catch (err) { q = { ok: false, sinRespuesta: true, error: err }; }
      if (s.cerrado) return;
      if (!q || !q.ok) { quedaPendiente(e, motivoDeTransporte(q) === 'sin_protocolo' ? 'error' : motivoDeTransporte(q)); return; }
      if ((await interpretar(e, q.data)) === 'fin') return;
    }
    quedaPendiente(e, 'sin_conexion');
  }

  /* ── 4 · Una a la vez ──────────────────────────────────────────────────── */
  const puedeSalir = () => {
    const e = s.entradas[0];
    if (!e || s.cerrado || s.estado === 'bloqueado') return false;
    return !s.conflicto || e.apartar;
  };
  function bombear() {
    if (s.enVuelo || s.cerrado) return s.enVuelo || Promise.resolve();
    s.enVuelo = (async () => {
      try {
        while (puedeSalir()) {
          const e = s.entradas[0];
          await enviarEntrada(e);
          if (s.estado === 'pendiente' && s.entradas[0] === e) break;
        }
        /* Lo tuyo apartado tras un automático: si ya no queda nada que apartar y no se abrió el conflicto, se adopta. */
        if (s.suyoPendiente && !s.entradas.length && !s.conflicto) {
          const suyo = s.suyoPendiente; s.suyoPendiente = null;
          s.confirmado = suyo; s.cuentas.adoptados += 1;
          try { alAdoptar(suyo.valor, { existe: suyo.existe, motivo: 'automatico' }); } catch { /* la pantalla decide */ }
        }
      } finally {
        s.enVuelo = null;
        const otra = s.otraVuelta && puedeSalir();
        s.otraVuelta = false;
        if (!s.cerrado && s.estado === 'guardando' && !s.entradas.some((x) => !x.apartar)) s.estado = s.conflicto ? 'conflicto' : 'en_orden';
        avisar();
        if (otra) bombear();
      }
    })();
    return s.enVuelo;
  }
  async function enviarPendiente() {
    if (s.enVuelo) { s.otraVuelta = true; await s.enVuelo; }
    if (s.enVuelo) await s.enVuelo;
    else if (puedeSalir()) await bombear();
  }

  function encolar(pedido) {
    s.seq += 1;
    const promesa = new Promise((r) => {
      const ultima = s.entradas[s.entradas.length - 1];
      const unible = ultima && !ultima.op && !ultima.salida && !ultima.apartar && !ultima.descartada && !pedido.base && !ultima.baseVista && (!pedido.claves || !ultima.claves);
      if (unible) {
        ultima.horario = pedido.horario;
        if (pedido.claves) { ultima.claves = pedido.claves; ultima.tipo = pedido.tipo; ultima.asunto = pedido.asunto || null; ultima.contexto = pedido.contexto || null; } else if (pedido.manual && !ultima.manual) ultima.tipo = pedido.tipo;
        ultima.manual = ultima.manual || pedido.manual;
        ultima.esperas.push(r);
      } else {
        s.entradas.push({ seq: s.seq, tipo: pedido.tipo, manual: pedido.manual, horario: pedido.horario, claves: pedido.claves || null, asunto: pedido.asunto || null, contexto: pedido.contexto || null, op: null, salida: false, preparado: null, apartar: false, grupo: null, baseVista: pedido.base || null, reserva: null, esperas: [r], descartada: false });
      }
    });
    if (s.estado === 'en_orden') poner('guardando');
    if (s.enVuelo) s.otraVuelta = true;
    bombear();
    return promesa;
  }

  function rechazoInmediato(automatico) {
    if (s.cerrado) return { ok: false, error: { code: 'cerrado', message: 'La sesión se cerró.' } };
    if (s.conflicto) return automatico ? { ok: true, omitido: true, error: null } : RESULTADO_CONFLICTO;
    if (s.estado === 'bloqueado') return { ok: false, bloqueado: true, error: { code: s.motivo, message: TEXTOS_PROTOCOLO[s.motivo] || TEXTOS_CONFLICTO.selloIlegible } };
    return null;
  }

  /** Guarda el horario (`valor`). `automatico`: lo pide la aplicación sola (avisos), no él. */
  function guardar(valor, { automatico = false } = {}) {
    const no = rechazoInmediato(automatico);
    if (no) return Promise.resolve(no);
    return encolar({ tipo: automatico ? 'aviso_automatico' : 'editar_horario', manual: !automatico, horario: valor, claves: null });
  }

  /**
   * Una operación con el horario Y otras claves (borrar una asignatura con clases, Deshacer como operación inversa).
   * `claves`: `[{ clave, antes, despues, normalizar }]` (lo que se veía, lo que se quiere y la puerta de carga de esa
   * clave). Va entera o no va. 🚨 Siempre lleva el horario: la cadena de revisiones es lo que impide que una
   * operación calculada sobre una pantalla vieja se aplique encima de otra.
   * R3 — `asunto` (`{ asignaturaId, nombre, accion }`) es de qué va, para el bloqueo selectivo de Estudios (H-12): sale en
   * `vista().asuntos` mientras la operación vive o su conflicto sigue abierto. `contexto` lo recibe `alAplicar` cuando
   * se aplica (lo que la pantalla necesita para el paso de Deshacer). Ninguno de los dos viaja al servidor.
   * R4 — `base` (`{ valor, existe }`, opcional): el horario sobre el que se CALCULÓ la operación, cuando no es el que
   * conoce el escritor (recuperar una copia se calcula sobre una lectura fresca de la cuenta). La revisión de esa base
   * es la condición: si la cuenta cambió desde esa lectura, el servidor no la aplica. Una entrada con base propia no se
   * une a ninguna otra.
   */
  function guardarOperacion({ tipo, manual = true, horario, claves = [], asunto = null, contexto = null, base = null } = {}) {
    if (horario === undefined || !esObjeto(horario)) return Promise.resolve({ ok: false, error: { code: 'operacion_sin_horario', message: 'Una operación protegida lleva siempre el horario.' } });
    if (!Array.isArray(claves) || claves.some((c) => !c || !CLAVES_POR_ELEMENTOS.includes(c.clave))) return Promise.resolve({ ok: false, error: { code: 'clave_no_permitida', message: 'Esa clave no se puede guardar en una operación protegida.' } });
    const no = rechazoInmediato(!manual);
    if (no) return Promise.resolve(no);
    const baseOk = esObjeto(base) && typeof base.existe === 'boolean' ? { valor: base.existe ? base.valor : null, existe: base.existe } : null;
    return encolar({ tipo: tipo || 'editar_horario', manual: !!manual, horario, claves: claves.length ? claves.map((c) => ({ clave: c.clave, antes: c.antes, despues: c.despues, normalizar: typeof c.normalizar === 'function' ? c.normalizar : (v) => v })) : null, asunto: esObjeto(asunto) ? { ...asunto } : null, contexto, base: baseOk });
  }

  /** Al recuperar la conexión, con «Guardar ahora» o al volver a la app: lo pendiente sale otra vez (la MISMA
   *  operación, si ya salió). Los cambios que hay que apartar, también. */
  async function reintentar() {
    if (s.cerrado) return vista();
    /* No toca el estado: si el envío anterior está terminando, así sabe que quedó pendiente y para; el reintento es
       UNA vuelta más (`otraVuelta`), no dos. */
    await enviarPendiente();
    return vista();
  }

  /** TP-15 C — al volver: si no hay nada tuyo sin guardar, se lee la cuenta y la pantalla enseña lo de ahora. */
  async function releer() {
    if (s.cerrado) return vista();
    if (s.conflicto) {
      if (!s.conflicto.suyo) { const lh = await leerHorario(); if (lh.ok && s.conflicto && !s.conflicto.suyo) s.conflicto.suyo = { valor: lh.valor, existe: lh.existe }; }
      await enviarPendiente();
      return vista();
    }
    if (s.entradas.length || s.enVuelo) { if (s.estado !== 'bloqueado') await reintentar(); return vista(); }
    const lh = await leerHorario();
    if (s.cerrado || !lh.ok || s.entradas.length || s.enVuelo || s.conflicto) return vista();
    const suyo = { valor: lh.valor, existe: lh.existe };
    if (!(suyo.existe === s.confirmado.existe && mismoContenido(suyo.valor, s.confirmado.valor))) {
      s.confirmado = suyo;
      s.cuentas.adoptados += 1;
      try { alAdoptar(suyo.valor, { existe: suyo.existe, motivo: 'releido' }); } catch { /* la pantalla decide */ }
      avisar();
    }
    return vista();
  }

  /** Para Deshacer: `true` si en la cuenta sigue lo que vio este aparato, `false` si otro escribió después, `null` si
   *  no se puede saber (sin conexión: la operación decidirá). */
  async function sinCambiosAjenos() {
    if (s.conflicto) return false;
    const lh = await leerHorario();
    if (!lh.ok) return null;
    const a = revisionDelSello('horarioTop', lh.existe ? lh.valor : null);
    const b = revisionDelSello('horarioTop', s.confirmado.existe ? s.confirmado.valor : null);
    if (!a.legible || !b.legible) return false;
    return a.revision === b.revision && lh.existe === s.confirmado.existe;
  }

  /** «Ver lo que hay ahora»: el conflicto se cierra y la pantalla enseña lo de la cuenta. Tus cambios quedan apartados
   *  (los que todavía no llegaron a apartarse se siguen intentando). Sin saber qué hay en la cuenta, no hace nada. */
  function verLoDeAhora() {
    const c = s.conflicto;
    if (!c || !c.suyo) return vista();
    s.conflicto = null;
    s.confirmado = { valor: c.suyo.valor, existe: c.suyo.existe };
    poner(s.entradas.length ? 'guardando' : 'en_orden');
    try { alAdoptar(c.suyo.valor, { existe: c.suyo.existe, motivo: 'ver_ahora' }); } catch { /* la pantalla decide */ }
    if (s.entradas.length) bombear();
    return vista();
  }

  /** «Descartar mi cambio», solo con `confirmado: true`: el conflicto se cierra, la pantalla enseña lo de la cuenta y
   *  sus copias se borran (las que se están apartando, al llegar). Sin confirmar no hace nada. */
  async function descartarMiCambio({ confirmado = false } = {}) {
    const c = s.conflicto;
    if (!c || confirmado !== true) return { ok: false, motivo: !c ? 'sin_conflicto' : 'sin_confirmacion' };
    if (!c.suyo) return { ok: false, motivo: 'sin_saber_lo_de_la_cuenta' };
    s.conflicto = null;
    s.confirmado = { valor: c.suyo.valor, existe: c.suyo.existe };
    /* Lo que todavía se estaba apartando: si no salió nunca, se quita; si salió (puede estar ya en el servidor), se
       deja terminar con su MISMA operación y su copia se borra al llegar. */
    for (const x of [...s.entradas]) {
      if (!x.apartar) continue;
      if (x.op) x.descartada = true;
      else { quitar(x); resolver(x, RESULTADO_CONFLICTO); }
    }
    poner(s.entradas.some((x) => !x.descartada) ? 'guardando' : 'en_orden');
    try { alAdoptar(c.suyo.valor, { existe: c.suyo.existe, motivo: 'descartado' }); } catch { /* la pantalla decide */ }
    let borradas = 0;
    for (const x of c.copias) if (x.copiaId && (await borrarCopia(x.copiaId))) borradas += 1;
    avisar();
    return { ok: true, copiaBorrada: borradas > 0 && borradas === c.copias.filter((x) => x.copiaId).length, borradas };
  }

  function motivoBloqueo() {
    if (s.cerrado) return null;
    if (s.conflicto) return MOTIVO_CONFLICTO_HORARIO;
    if (s.estado === 'bloqueado' && BLOQUEOS_DE_PROTOCOLO.includes(s.motivo)) return MOTIVO_PROTOCOLO_HORARIO;
    return null;
  }

  function vista() {
    const c = s.conflicto;
    const principal = c && c.copias.length ? c.copias[0] : null;
    return {
      estado: s.estado, motivo: s.motivo,
      pendiente: s.entradas.some((x) => !x.apartar) || s.estado === 'pendiente',
      guardando: !!s.enVuelo,
      enCola: s.entradas.length,
      conflicto: c ? {
        detectadoEn: c.detectadoEn,
        motivo: c.motivo,
        copia: principal ? { estado: principal.estado, opId: principal.copiaId || principal.opId, motivo: principal.motivo } : { estado: 'guardando', opId: null, motivo: null },
        copias: c.copias.map((x) => ({ ...x })),
        aparatoSuyo: c.suyo && esObjeto(c.suyo.valor) && esObjeto(c.suyo.valor.testigo) ? c.suyo.valor.testigo.aparato || null : null,
      } : null,
      apartadasSinGuardar: s.entradas.filter((x) => x.apartar).length + (c ? c.copias.filter((x) => x.estado !== 'guardada').length : 0),
      /* R3 · H-12 — de qué van las operaciones vivas: las que esperan o vuelan (`pendiente`) y las retenidas por un
         conflicto que sigue abierto (`conflicto`). Al cerrarse el conflicto o aplicarse, desaparecen: sin estado propio. */
      asuntos: [
        ...s.entradas.filter((x) => x.asunto && !x.descartada).map((x) => ({ ...x.asunto, estado: x.apartar ? 'conflicto' : 'pendiente' })),
        ...(c ? c.copias.filter((x) => x.asunto).map((x) => ({ ...x.asunto, estado: 'conflicto' })) : []),
      ],
      protocolo: s.protocolo ? { desfaseMs: s.protocolo.desfaseMs, reglas: { ...s.protocolo.reglas } } : null,
      cuentas: { ...s.cuentas },
    };
  }

  const desuscribirGuardia = guardia && typeof guardia.suscribir === 'function'
    ? guardia.suscribir(() => { if (!s.cerrado && s.estado === 'pendiente' && (s.motivo === 'arranque' || s.motivo === 'guardia')) { s.otraVuelta = true; bombear(); } })
    : null;

  return {
    guardar, guardarOperacion, reintentar, releer, sinCambiosAjenos, verLoDeAhora, descartarMiCambio, motivoBloqueo, vista,
    /** El estado de una operación en el servidor, sin aplicarla (`protegido_estado`). */
    consultarEstado: async (opId) => { try { return await transporte.estado(opId); } catch (e) { return { ok: false, sinRespuesta: true, error: e }; } },
    confirmado: () => ({ ...s.confirmado }),
    suscribir: (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); },
    cerrar: () => {
      s.cerrado = true; oyentes.clear();
      if (desuscribirGuardia) { try { desuscribirGuardia(); } catch { /* ya suelto */ } }
      for (const e of s.entradas) { soltarReserva(e); resolver(e, { ok: false, error: { code: 'cerrado', message: 'La sesión se cerró.' } }); }
    },
    /** Para las pruebas: esperar a que termine lo que está en marcha. */
    esperar: async () => { while (s.enVuelo) await s.enVuelo; },
  };
}
