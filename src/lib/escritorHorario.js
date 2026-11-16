/**
 * 🛡 HORARIOS · FASE 4, E1 — EL ESCRITOR PROTEGIDO DE `horarioTop` (TP-15 A y C, docs/19 §18.12 y §18.14).
 *
 * Lo que hace, en una frase: que ninguna escritura de `horarioTop` pise un cambio de otro aparato. Cada
 * guardado es una **escritura condicional**: solo se aplica si en la cuenta sigue la revisión sobre la que se
 * calculó el cambio. Si no, no se escribe nada y se aplica la política aprobada:
 *   · un guardado **automático** (avisos enviados) se recalcula sobre lo que hay ahora en la cuenta;
 *   · un cambio **tuyo** abre un conflicto (D2, opción B): tu versión sigue en pantalla, Horarios deja de
 *     guardar hasta que elijas «Ver lo que hay ahora» o «Descartar mi cambio», y tu cambio se aparta como una
 *     versión del historial con motivo «conflicto» (D2-bis) para que no se pierda al cerrar la aplicación.
 *
 * El CONTRATO DEL SELLO (D3): la revisión y la base de una clave protegida viven en un solo sitio por clave.
 *   · `horarioTop` → el testigo de la A-bis (`testigo.revision`, `testigo.base`), que la guardia ya escribe en
 *     cada guardado (`prepararEscritura`);
 *   · `horarioBorradores` → `sello` (`{ revision, base, aparato, en }`), para la entrega B. Aquí solo se declara.
 * La condición compara la revisión GUARDADA TAL CUAL (como la lee Postgres con `->>`): un testigo malformado no
 * se «arregla» antes de comparar.
 *
 * Reglas que este archivo cumple (y `scripts/test-escritor-horario.mjs` comprueba):
 *   · 🚨 **Nada pendiente en el aparato** (C-84): lo que no ha llegado vive en memoria; al cerrar la app se
 *     pierde, como lo pendiente de `saveData`, y el indicador lo dice. Lo único duradero es la copia apartada,
 *     que va a la cuenta (no al aparato).
 *   · 🚨 **Nunca se reenvía un valor viejo**: lo que sale es siempre el ÚLTIMO valor pedido, calculado sobre la
 *     revisión confirmada. Un conflicto no se «arregla» reintentando: se relee.
 *   · 🚨 **Nunca se descarta un cambio tuyo en silencio**: solo «Descartar mi cambio», con su confirmación.
 *   · `saveData` y su cola ya no pueden escribir `horarioTop` (`esClaveProtegidaDeHorario`).
 *
 * ⚠️ Es una HOJA del árbol de imports (solo importa `guardiaHorario.js`, que también lo es): la importan
 * `supabase.js` y `sincronizacion.js` para rechazar sus claves. Quien habla con Supabase es el «transporte»
 * (`transporteDeHorario` en `supabase.js`).
 */
import { textoCanonico } from './guardiaHorario';

/* ═══════════════════════════════════════════════════════════════════════════
   0 · LAS CLAVES PROTEGIDAS Y EL CONTRATO DEL SELLO (D3)
   =========================================================================== */
export const CLAVES_PROTEGIDAS_HORARIO = Object.freeze(['horarioTop', 'horarioBorradores']);
/** Dónde vive el sello de cada clave protegida: un solo sitio por clave. */
export const RUTA_SELLO = Object.freeze({ horarioTop: 'testigo', horarioBorradores: 'sello' });
/** Las claves que `saveData` y su cola NUNCA escriben: las escribe este escritor. */
export const esClaveProtegidaDeHorario = (clave) => typeof clave === 'string' && CLAVES_PROTEGIDAS_HORARIO.includes(clave);

/** El motivo de solo lectura de un conflicto abierto (lo leen los guardados y la pantalla de Horario). */
export const MOTIVO_CONFLICTO_HORARIO = 'horario_conflicto';
/** El motivo con el que la regla del servidor (TP-15 B, `supabase/horarios-regla-revision.sql`) rechaza una
 *  escritura que no respeta la revisión vigente. Se trata como un conflicto: se relee, nunca se reenvía. */
export const RECHAZO_DE_LA_REGLA = 'horario_revision_obsoleta';
/** Dentro de un envío, como mucho dos vueltas (un primer guardado que choca con una fila creada a la vez). */
export const VUELTAS_ESCRITOR = 2;

const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const tiene = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * La revisión vigente del sello de una clave, tal como la compara Postgres (`value->sello->>revision`):
 *   · `{ legible: true, revision: null }` si no hay sello, no es un objeto o no tiene revisión (Postgres da NULL);
 *   · `{ legible: true, revision: '…' }` con un texto, o con un número o un booleano escritos como texto
 *     (igual que los imprime Postgres);
 *   · `{ legible: false }` si la revisión es un objeto o una lista: su texto en Postgres no se puede reproducir
 *     con seguridad, y comparar mal sería escribir a ciegas. Entonces no se escribe (límite L-E1-1).
 */
export function revisionDelSello(clave, valor) {
  const ruta = RUTA_SELLO[clave];
  if (!ruta) throw new Error(`Clave sin sello: ${clave}`);
  if (!esObjeto(valor) || !tiene(valor, ruta)) return { legible: true, revision: null };
  const sello = valor[ruta];
  if (!esObjeto(sello) || !tiene(sello, 'revision')) return { legible: true, revision: null };
  const r = sello.revision;
  if (r === null || r === undefined) return { legible: true, revision: null };
  if (typeof r === 'string') return { legible: true, revision: r };
  if (typeof r === 'boolean') return { legible: true, revision: String(r) };
  if (typeof r === 'number' && Number.isFinite(r) && Number.isInteger(r) && Math.abs(r) < Number.MAX_SAFE_INTEGER) return { legible: true, revision: String(r) };
  return { legible: false };
}

/** El campo de PostgREST sobre el que se condiciona una escritura de esa clave. */
export const campoDelSello = (clave) => `value->${RUTA_SELLO[clave]}->>revision`;

/** Lo mismo con otro orden de claves: mismo contenido. Sin `version` ni testigo, para comparar lo que ve él. */
export function mismoContenido(a, b, { sinSello = false } = {}) {
  const limpiar = (v) => {
    if (!sinSello || !esObjeto(v)) return v;
    const { testigo, version, ...resto } = v;
    void testigo; void version;
    return resto;
  };
  return textoCanonico(limpiar(a)) === textoCanonico(limpiar(b));
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS TEXTOS DEL CONFLICTO (D2)
   =========================================================================== */
export const TEXTOS_CONFLICTO = Object.freeze({
  titulo: 'Otro aparato ha cambiado tu horario',
  explica: 'Tu cambio no se ha guardado y no se ha perdido: sigue en pantalla. Para no pisar lo del otro aparato, Horarios no guarda nada hasta que elijas qué hacer.',
  copiaGuardada: 'Tu cambio está apartado en tu cuenta: no se pierde aunque cierres la aplicación.',
  copiaGuardando: 'Apartando tu cambio en tu cuenta…',
  copiaSinGuardar: 'Tu cambio todavía no está apartado en tu cuenta: si cierras la aplicación ahora, se pierde. Se vuelve a intentar al recuperar la conexión.',
  verAhora: 'Ver lo que hay ahora',
  verAhoraExplica: 'Pasas a ver el horario de tu cuenta y puedes seguir editando. Tu cambio queda apartado.',
  descartar: 'Descartar mi cambio',
  descartarConfirma: 'Se perderá el cambio que hiciste en este aparato y se borrará su copia apartada. ¿Descartarlo?',
  descartarSi: 'Sí, descartarlo',
  cancelar: 'Cancelar',
  apartadaPendiente: 'Un cambio tuyo apartado todavía no está guardado en tu cuenta. Se vuelve a intentar al recuperar la conexión.',
  selloIlegible: 'No se puede guardar tu horario con seguridad: su testigo no se puede leer. No se ha guardado nada.',
});

/* ═══════════════════════════════════════════════════════════════════════════
   2 · EL ESCRITOR
   ---------------------------------------------------------------------------
   `transporte` (en la app, `transporteDeHorario` de `supabase.js`):
     leerHorario(usuario)                                → { ok, existe, valor, sinRespuesta?, error? }
     insertarHorario(usuario, valor)                     → { ok, conflicto?, sinRespuesta?, error?, definitivo?, rechazada? }
     actualizarHorarioSiRevision(usuario, valor, base)   → { ok, aplicada, sinRespuesta?, error?, definitivo?, rechazada? }
   `guardia`: el controlador de la A-bis (pone `version` y el testigo, y demuestra el testigo en el arranque).
   `inicial`: `{ valor, existe }`, lo que llegó de la cuenta al cargar (lo que ve la pantalla).
   `alAdoptar(valor)`: la pantalla pasa a enseñar lo que hay en la cuenta (sin cambios propios pendientes).
   `apartar(valor)`: guarda tu cambio como versión «conflicto» → `{ estado, opId }` (historial de versiones).
   `reintentarApartado(opId)`, `descartarApartado(opId)`: lo mismo con su id.
   Estados: `en_orden` · `guardando` · `pendiente` (sin conexión o error) · `conflicto` · `bloqueado`.
   =========================================================================== */
export function crearEscritorDeHorario({
  transporte, usuario, guardia = null, inicial = { valor: null, existe: false },
  alAdoptar = () => {}, apartar = null, reintentarApartado = null, descartarApartado = null,
  ahora = () => new Date(), clave = 'horarioTop',
} = {}) {
  if (!transporte || !usuario) throw new Error('crearEscritorDeHorario necesita transporte y usuario');
  const s = {
    confirmado: { valor: inicial ? inicial.valor : null, existe: !!(inicial && inicial.existe) },
    deseado: null,            // { valor, manual, seq }
    seq: 0,
    enVuelo: null,            // la promesa del envío en marcha
    estado: 'en_orden', motivo: null,
    conflicto: null,          // { mio, suyo, detectadoEn, copia: { estado, opId, motivo } }
    apartadas: [],            // copias que no llegaron a la cuenta: { opId, valor, estado }
    cerrado: false,
    otraVuelta: false,        // se pidió un guardado mientras volaba un envío
    cuentas: { enviados: 0, aplicados: 0, conflictos: 0, adoptados: 0, sinRespuesta: 0, rechazosRegla: 0 },
  };
  const oyentes = new Set();
  const avisar = () => { if (s.cerrado) return; oyentes.forEach((fn) => { try { fn(); } catch { /* un oyente roto no para a los demás */ } }); };
  const poner = (estado, motivo = null) => { s.estado = estado; s.motivo = motivo; avisar(); };

  /* Lo que se espera de un guardado: se resuelve cuando ese valor (o uno más nuevo) llega, o con su conflicto. */
  let esperas = [];
  const resolverEsperas = (hasta, resultado) => {
    const quedan = [];
    for (const e of esperas) { if (e.seq <= hasta) e.resolver(resultado); else quedan.push(e); }
    esperas = quedan;
  };

  const lecturaValida = (lh) => !!(lh && lh.ok);

  async function abrirConflicto(d, suyo) {
    s.cuentas.conflictos += 1;
    s.deseado = null;
    const copia = { estado: apartar ? 'guardando' : 'sin_guardar', opId: null, motivo: apartar ? null : 'sin_historial' };
    s.conflicto = { mio: d.valor, suyo, detectadoEn: ahora().toISOString(), copia };
    poner('conflicto');
    resolverEsperas(d.seq, { ok: false, conflicto: true, error: { code: 'conflicto_horario', message: TEXTOS_CONFLICTO.titulo } });
    if (apartar) await apartarCopia(s.conflicto);
  }

  async function apartarCopia(conflicto) {
    let r;
    try { r = await apartar(conflicto.mio); } catch (e) { r = { estado: 'no_aplicada', motivo: 'error', error: e }; }
    const copia = conflicto.copia;
    copia.opId = (r && r.opId) || copia.opId;
    copia.estado = r && r.estado === 'confirmada' ? 'guardada' : 'sin_guardar';
    copia.motivo = r && r.estado !== 'confirmada' ? (r.motivo || r.estado || 'error') : null;
    copia.enMemoria = !!(r && r.estado !== 'confirmada' && r.opId);
    avisar();
  }

  function confirmar(d, preparado) {
    s.confirmado = { valor: preparado.valor, existe: true };
    s.cuentas.aplicados += 1;
    if (s.deseado && s.deseado.seq === d.seq) s.deseado = null;
    resolverEsperas(d.seq, { ok: true, error: null });
    /* A-bis §7.5 — en el arranque, la relectura que demuestra el testigo (ya está escrito: no hay cola que esperar). */
    if (guardia && preparado.conTestigo && preparado.arranque && typeof guardia.despuesDeGuardar === 'function') {
      guardia.despuesDeGuardar(preparado, Promise.resolve());
    }
    poner(s.deseado ? 'guardando' : 'en_orden');
  }

  function quedaPendiente(d, motivo) {
    poner('pendiente', motivo);
    resolverEsperas(d.seq, { ok: false, pendiente: true, error: { code: motivo === 'sin_conexion' ? 'sin_conexion' : 'pendiente', message: 'Tu cambio del horario todavía no ha llegado a tu cuenta.' } });
  }

  /* Tras un «no se aplicó» (condición, fila creada a la vez o la regla del servidor): se relee. */
  async function decidirTrasRechazo(d, preparado, base) {
    let lh;
    try { lh = await transporte.leerHorario(usuario); } catch { lh = null; }
    if (s.cerrado) return 'fin';
    if (!lecturaValida(lh)) { quedaPendiente(d, lh && lh.sinRespuesta ? 'sin_conexion' : 'lectura'); return 'fin'; }
    /* Era lo nuestro (una respuesta que se perdió): confirmado. */
    if (lh.existe && mismoContenido(lh.valor, preparado.valor)) { confirmar(d, preparado); return 'fin'; }
    const actual = revisionDelSello(clave, lh.existe ? lh.valor : null);
    /* Nadie más escribió: lo que creíamos no era lo de la cuenta (la fila no existía o ya existía). Se repite. */
    if (actual.legible && actual.revision === base && lh.existe === s.confirmado.existe) return 'otra_vez';
    if (actual.legible && actual.revision === base && lh.existe !== s.confirmado.existe) {
      s.confirmado = { valor: lh.existe ? lh.valor : null, existe: lh.existe };
      return 'otra_vez';
    }
    /* Otro aparato escribió. */
    const suyo = { valor: lh.existe ? lh.valor : null, existe: lh.existe };
    /* Lo tuyo manda sobre lo automático: si hay un cambio tuyo pedido después, el conflicto lleva ESE valor
       (es el que está en pantalla e incluye todo lo de antes). */
    const ultimo = s.deseado && s.deseado.seq > d.seq ? s.deseado : d;
    if (d.manual || ultimo.manual) { if (ultimo !== d) resolverEsperas(d.seq, { ok: false, conflicto: true, error: { code: 'conflicto_horario', message: TEXTOS_CONFLICTO.titulo } }); await abrirConflicto({ ...ultimo, manual: true }, suyo); return 'fin'; }
    /* 🚨 Lo pedido DESPUÉS de este guardado se calculó sobre la pantalla de antes, que no tenía lo del otro
       aparato: si es tuyo, es un conflicto (nunca se manda con la revisión nueva, pisaría lo suyo); si es
       automático, se recalcula como este. */
    const despues = s.deseado && s.deseado.seq !== d.seq ? s.deseado : null;
    if (despues && despues.manual) { resolverEsperas(d.seq, { ok: true, error: null, recalculado: true }); await abrirConflicto(despues, suyo); return 'fin'; }
    /* Un guardado automático: se recalcula sobre lo de ahora (la pantalla lo vuelve a pedir si hace falta). */
    s.cuentas.adoptados += 1;
    s.confirmado = suyo;
    s.deseado = null;
    resolverEsperas(despues ? despues.seq : d.seq, { ok: true, error: null, recalculado: true });
    poner(s.deseado ? 'guardando' : 'en_orden');
    try { alAdoptar(suyo.valor, { existe: suyo.existe, motivo: 'automatico' }); } catch { /* la pantalla decide */ }
    return 'fin';
  }

  async function enviarUna() {
    const d = s.deseado;
    if (!d || s.conflicto || s.cerrado) return;
    if (guardia && typeof guardia.motivoBloqueo === 'function' && guardia.motivoBloqueo()) { quedaPendiente(d, 'guardia'); return; }
    for (let vuelta = 1; vuelta <= VUELTAS_ESCRITOR; vuelta += 1) {
      const sello = revisionDelSello(clave, s.confirmado.existe ? s.confirmado.valor : null);
      if (!sello.legible) {
        poner('bloqueado', 'sello_ilegible');
        resolverEsperas(d.seq, { ok: false, bloqueado: true, error: { code: 'sello_ilegible', message: TEXTOS_CONFLICTO.selloIlegible } });
        return;
      }
      const base = sello.revision;
      const preparado = guardia && typeof guardia.prepararEscritura === 'function'
        ? guardia.prepararEscritura(d.valor, s.confirmado.existe ? s.confirmado.valor : null)
        : { valor: d.valor, conTestigo: false, arranque: false };
      s.cuentas.enviados += 1;
      poner('guardando');
      let r;
      try {
        r = s.confirmado.existe
          ? await transporte.actualizarHorarioSiRevision(usuario, preparado.valor, base)
          : await transporte.insertarHorario(usuario, preparado.valor);
      } catch (e) { r = { ok: false, sinRespuesta: true, error: e }; }
      if (s.cerrado) return;
      if (r && r.ok && (r.aplicada === true || r.aplicada === undefined)) { confirmar(d, preparado); return; }
      if (r && r.rechazada) s.cuentas.rechazosRegla += 1;
      const rechazo = r && (r.conflicto || r.rechazada || (r.ok && r.aplicada === false));
      if (rechazo) {
        const siguiente = await decidirTrasRechazo(d, preparado, base);
        if (siguiente === 'otra_vez') continue;
        return;
      }
      /* Sin respuesta, o un error: se relee para saber si llegó. Si no se puede leer, pendiente. */
      if (r && r.sinRespuesta) s.cuentas.sinRespuesta += 1;
      let lh;
      try { lh = await transporte.leerHorario(usuario); } catch { lh = null; }
      if (s.cerrado) return;
      if (lecturaValida(lh) && lh.existe && mismoContenido(lh.valor, preparado.valor)) { confirmar(d, preparado); return; }
      if (!lecturaValida(lh)) { quedaPendiente(d, (r && r.sinRespuesta) || (lh && lh.sinRespuesta) ? 'sin_conexion' : 'error'); return; }
      const actual = revisionDelSello(clave, lh.existe ? lh.valor : null);
      if (actual.legible && actual.revision === base) { quedaPendiente(d, r && r.sinRespuesta ? 'sin_conexion' : 'error'); return; }
      /* Ni lo nuestro ni lo de antes: otro aparato escribió entretanto. */
      const siguiente = await decidirTrasRechazo(d, preparado, base);
      if (siguiente === 'otra_vez') continue;
      return;
    }
    quedaPendiente(d, 'conflicto_repetido');
  }

  /* Un envío a la vez. Si mientras volaba se pidió otro valor, sale después con la revisión nueva. */
  function bombear() {
    if (s.enVuelo || s.cerrado) return s.enVuelo || Promise.resolve();
    s.enVuelo = (async () => {
      try {
        let antes = -1;
        while (s.deseado && !s.conflicto && !s.cerrado && s.deseado.seq !== antes && s.estado !== 'bloqueado') {
          antes = s.deseado.seq;
          await enviarUna();
          if (s.estado === 'pendiente') break;
        }
      } finally {
        s.enVuelo = null;
        /* Un guardado pedido mientras este envío ya terminaba (por ejemplo, sin conexión): tiene su intento. */
        const otra = s.otraVuelta && s.deseado && !s.conflicto && s.estado !== 'bloqueado';
        s.otraVuelta = false;
        avisar();
        if (otra) bombear();
      }
    })();
    return s.enVuelo;
  }

  /* Que lo pendiente salga (otra vez): si hay un envío en marcha, cuando acabe; y se espera a que termine. */
  async function enviarPendiente() {
    if (s.enVuelo) { s.otraVuelta = true; await s.enVuelo; }
    if (s.enVuelo) await s.enVuelo;
    else if (s.deseado && !s.conflicto) await bombear();
  }

  /** Guarda `valor`. `automatico`: lo pide la aplicación sola (avisos), no él. Devuelve cómo acabó ESE valor. */
  function guardar(valor, { automatico = false } = {}) {
    if (s.cerrado) return Promise.resolve({ ok: false, error: { code: 'cerrado', message: 'La sesión se cerró.' } });
    if (s.conflicto) {
      return Promise.resolve(automatico
        ? { ok: true, omitido: true, error: null }
        : { ok: false, conflicto: true, error: { code: 'conflicto_horario', message: TEXTOS_CONFLICTO.titulo } });
    }
    if (s.estado === 'bloqueado') return Promise.resolve({ ok: false, bloqueado: true, error: { code: s.motivo, message: TEXTOS_CONFLICTO.selloIlegible } });
    s.seq += 1;
    const manual = !automatico || !!(s.deseado && s.deseado.manual);
    s.deseado = { valor, manual, seq: s.seq };
    const promesa = new Promise((resolver) => { esperas.push({ seq: s.seq, resolver }); });
    if (s.enVuelo) s.otraVuelta = true;
    bombear();
    return promesa;
  }

  /** Al recuperar la conexión, con «Guardar ahora» o al volver a la app: lo pendiente sale otra vez, y una
   *  copia apartada que no llegó se vuelve a intentar. */
  async function reintentar() {
    if (s.cerrado) return vista();
    if (s.deseado && !s.conflicto && s.estado !== 'bloqueado') await enviarPendiente();
    await reintentarCopias();
    return vista();
  }

  async function reintentarCopias() {
    const lista = [
      ...(s.conflicto && s.conflicto.copia.estado === 'sin_guardar' ? [{ valor: s.conflicto.mio, copia: s.conflicto.copia }] : []),
      ...s.apartadas.filter((a) => a.copia.estado === 'sin_guardar'),
    ];
    for (const item of lista) {
      let r;
      try {
        r = item.copia.enMemoria && item.copia.opId && reintentarApartado
          ? await reintentarApartado(item.copia.opId)
          : apartar ? await apartar(item.valor) : null;
      } catch (e) { r = { estado: 'no_aplicada', motivo: 'error', error: e }; }
      if (r) {
        item.copia.opId = r.opId || item.copia.opId;
        item.copia.estado = r.estado === 'confirmada' ? 'guardada' : 'sin_guardar';
        item.copia.motivo = r.estado === 'confirmada' ? null : (r.motivo || r.estado);
        item.copia.enMemoria = !!(r.estado !== 'confirmada' && r.opId);
      }
    }
    s.apartadas = s.apartadas.filter((a) => a.copia.estado !== 'guardada');
    avisar();
  }

  /** TP-15 C — al volver a primer plano o al recuperar la conexión: si no hay nada tuyo sin guardar, se lee la
   *  cuenta y la pantalla pasa a enseñar lo de ahora. Si hay algo pendiente, sale (con su condición). */
  async function releer() {
    if (s.cerrado) return vista();
    if (s.conflicto) { await reintentarCopias(); return vista(); }
    if (s.deseado || s.enVuelo) { if (s.estado !== 'bloqueado') await enviarPendiente(); return vista(); }
    let lh;
    try { lh = await transporte.leerHorario(usuario); } catch { lh = null; }
    if (s.cerrado || !lecturaValida(lh)) return vista();
    /* Mientras se leía pudo pedirse un guardado: entonces manda ese (con su condición). */
    if (s.deseado || s.enVuelo || s.conflicto) return vista();
    const suyo = { valor: lh.existe ? lh.valor : null, existe: lh.existe };
    const igual = suyo.existe === s.confirmado.existe && mismoContenido(suyo.valor, s.confirmado.valor);
    if (!igual) {
      s.confirmado = suyo;
      s.cuentas.adoptados += 1;
      try { alAdoptar(suyo.valor, { existe: suyo.existe, motivo: 'releido' }); } catch { /* la pantalla decide */ }
      avisar();
    }
    return vista();
  }

  /** Para Deshacer (política aprobada): `true` si en la cuenta sigue lo que vio este aparato, `false` si otro
   *  aparato escribió después, `null` si no se puede saber (sin conexión: la condición decidirá al escribir). */
  async function sinCambiosAjenos() {
    if (s.conflicto) return false;
    let lh;
    try { lh = await transporte.leerHorario(usuario); } catch { lh = null; }
    if (!lecturaValida(lh)) return null;
    const a = revisionDelSello(clave, lh.existe ? lh.valor : null);
    const b = revisionDelSello(clave, s.confirmado.existe ? s.confirmado.valor : null);
    if (!a.legible || !b.legible) return false;
    return a.revision === b.revision && lh.existe === s.confirmado.existe;
  }

  /** «Ver lo que hay ahora»: el conflicto se cierra, la pantalla enseña lo de la cuenta y tu cambio queda
   *  apartado (si todavía no llegó a la cuenta, se sigue intentando desde memoria). */
  function verLoDeAhora() {
    const c = s.conflicto;
    if (!c) return vista();
    if (c.copia.estado !== 'guardada') s.apartadas.push({ valor: c.mio, copia: c.copia });
    s.conflicto = null;
    s.confirmado = { valor: c.suyo.valor, existe: c.suyo.existe };
    poner('en_orden');
    try { alAdoptar(c.suyo.valor, { existe: c.suyo.existe, motivo: 'ver_ahora' }); } catch { /* la pantalla decide */ }
    return vista();
  }

  /** «Descartar mi cambio», solo con `confirmado: true`: el conflicto se cierra, la pantalla enseña lo de la
   *  cuenta y la copia apartada se borra (si llegó a guardarse). Sin confirmar no hace nada. */
  async function descartarMiCambio({ confirmado = false } = {}) {
    const c = s.conflicto;
    if (!c || confirmado !== true) return { ok: false, motivo: !c ? 'sin_conflicto' : 'sin_confirmacion' };
    s.conflicto = null;
    s.confirmado = { valor: c.suyo.valor, existe: c.suyo.existe };
    poner('en_orden');
    try { alAdoptar(c.suyo.valor, { existe: c.suyo.existe, motivo: 'descartado' }); } catch { /* la pantalla decide */ }
    let borrada = null;
    if (c.copia.estado === 'guardada' && c.copia.opId && descartarApartado) {
      try { borrada = await descartarApartado(c.copia.opId); } catch (e) { borrada = { estado: 'no_aplicada', motivo: 'error', error: e }; }
    }
    avisar();
    return { ok: true, copiaBorrada: !!(borrada && borrada.estado === 'confirmada'), borrada };
  }

  function motivoBloqueo() {
    if (s.cerrado) return null;
    if (s.conflicto) return MOTIVO_CONFLICTO_HORARIO;
    return null;
  }

  function vista() {
    const c = s.conflicto;
    return {
      estado: s.estado, motivo: s.motivo,
      pendiente: !!s.deseado || s.estado === 'pendiente',
      guardando: !!s.enVuelo,
      conflicto: c ? { detectadoEn: c.detectadoEn, copia: { ...c.copia }, aparatoSuyo: esObjeto(c.suyo.valor) && esObjeto(c.suyo.valor.testigo) ? c.suyo.valor.testigo.aparato || null : null } : null,
      apartadasSinGuardar: s.apartadas.filter((a) => a.copia.estado !== 'guardada').length,
      cuentas: { ...s.cuentas },
    };
  }

  return {
    guardar, reintentar, releer, sinCambiosAjenos, verLoDeAhora, descartarMiCambio, motivoBloqueo, vista,
    /** Lo que este aparato cree que hay en la cuenta (para comparar en Deshacer). Una copia. */
    confirmado: () => ({ ...s.confirmado }),
    suscribir: (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); },
    cerrar: () => { s.cerrado = true; oyentes.clear(); resolverEsperas(Infinity, { ok: false, error: { code: 'cerrado', message: 'La sesión se cerró.' } }); },
    /** Para las pruebas: esperar a que termine lo que está en marcha. */
    esperar: async () => { while (s.enVuelo) await s.enVuelo; },
  };
}
