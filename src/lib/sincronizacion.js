/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F16 — LO QUE SE GUARDA, LO QUE NO HA LLEGADO Y LO QUE NO SE
   PUDO CARGAR

   *"El usuario nunca debe sentir que la aplicación se ha quedado congelada, ha
   perdido información o ha cambiado de estado arbitrariamente."* JosStyle
   guarda de una forma —`setX(nuevo)` y `saveData(clave, nuevo)`: la pantalla
   cambia primero y la cuenta después (la UI optimista del apartado 14)— y hasta
   hoy nadie llevaba la cuenta de cómo había ido. Esto la lleva, para TODA la
   aplicación y en un solo sitio (apartado 3: un dueño por estado):

     · 🚨 **una clave que no se pudo CARGAR no se GUARDA** (apartado 20). Hasta
       la F16, `loadData` devolvía el valor por defecto si fallaba y la
       aplicación arrancaba como una cuenta nueva: el siguiente guardado de esa
       clave PISABA lo que había en la cuenta con lo que se veía en pantalla. Y
       el primero llegaba solo: la migración de `ajustes` del arranque guardaba
       los ajustes por defecto —el acento, la apariencia y **el PIN**— si esa
       carga fallaba. No fallar al cargar es cosa de la red; no pisar lo que no
       se ha visto es cosa de aquí;
     · **lo que no llegó a la cuenta se queda PENDIENTE** (apartados 26 y 33),
       con su último valor, y se vuelve a mandar al pedirlo o al volver la
       conexión. Mandar otra vez el valor ENTERO de una clave es idempotente
       (`saveData` sobrescribe), así que reintentar no duplica nada — al revés
       que repetir una acción (EH F41: *"añadir un perfume dos veces son dos
       perfumes"*);
     · **los guardados de una misma clave salen en orden** (apartado 41): uno
       espera a que termine el anterior. Y una respuesta que llega después de
       otra más nueva no reescribe lo pendiente;
     · 🐛 **y si el orden se rompe, el último valor vuelve a salir** (A4, fase 4
       de la auditoría). La espera tiene tope (`TOPE_ESPERA_ANTERIOR_MS`): con
       una petición colgada, la siguiente sale igual, y si la colgada termina
       DESPUÉS, el `upsert` incondicional deja en la cuenta el valor VIEJO —la
       pantalla enseñaba el nuevo, sin nada pendiente ni aviso—. Ahora, si una
       escritura vieja termina cuando ya salió otra más nueva de su clave, y la
       vieja pudo aplicarse (llegó bien, o falló por la red y no se sabe), el
       último valor enviado queda PENDIENTE y se reescribe una vez. La garantía
       es de consistencia eventual: con conexión acaba ganando el último valor,
       y si la reescritura falla se queda pendiente y se dice. Lo que el cliente
       no puede saber es una petición vieja que se aplique aún más tarde y cuya
       respuesta no llegue nunca: eso solo lo cierra una condición en el
       servidor;
     · 🐛 **un reintento o una reescritura deciden QUÉ mandan al salir, no al
       programarse** (A5). Se ponían en la cola con el valor de ese momento y,
       si detrás ya esperaba un cambio más nuevo, salían después y lo pisaban
       (`A,B,B,C,B`: la cuenta en B, la pantalla en C y el indicador en
       «Guardado»). Ahora, cuando les toca —tras esperar su turno— miran si la
       clave sigue pendiente (si no, no salen) y mandan el ÚLTIMO valor que
       pidió la aplicación para esa clave (`ultimoDeseado`), nunca uno viejo.
       Y una escritura de una sesión que se cerró mientras esperaba ya no sale;
     · ⏱ **ninguna petición tiene a la cola esperando para siempre** (A5): a
       los `TOPE_PETICION_MS` se da por fallida «sin saber si llegó», así que
       su cola, el indicador y los reintentos se liberan. NO se aborta (una
       subida lenta tiene que poder llegar) y se la sigue escuchando: si
       contesta tarde, `respuestaTardia` la trata como una escritura vieja o
       retira su pendiente. Lo que el cliente no puede saber es una petición
       aplicada cuya respuesta no llega nunca.

   ⚠️ **Es una hoja del árbol de imports** —la importa `supabase.js`— y no
   guarda NADA fuera de la memoria: lo pendiente lleva los datos de Relación, el
   diario o la piel, y escribirlos en el dispositivo para reintentarlos sería
   guardar datos sensibles donde no hace falta. Si se cierra la aplicación con
   algo pendiente, se pierde, y por eso el aviso lo dice.

   ⚠️ **Y no detecta conflictos entre dispositivos** (EH F41, F45, F54): el
   último en escribir sigue ganando. Reintentar manda lo que hay en ESTA
   pantalla, que es lo último que él tocó aquí.
   =========================================================================== */

/** Cuánto espera un guardado a que termine el anterior de su misma clave antes de salir igual. Con
 *  una petición colgada, la cola no puede quedarse parada para siempre. */
export const TOPE_ESPERA_ANTERIOR_MS = 10000;

/** Cuánto espera una petición de guardado su respuesta antes de darse por fallida «sin saber si llegó»
 *  (A5). Mayor que el tope de la cola, para no cortar una petición lenta que todavía va bien. */
export const TOPE_PETICION_MS = 30000;

/** El error con el que se niega un guardado de una clave que no se pudo cargar. */
export const ERROR_CARGA_FALLIDA = Object.freeze({ code: 'carga_fallida', message: 'Esta parte de tus datos no se pudo cargar: guardarla pisaría lo que tienes en tu cuenta.' });
/** Y el de un guardado que llega con el usuario de una sesión que ya no está. */
export const ERROR_OTRA_SESION = Object.freeze({ code: 'otra_sesion', message: 'Este cambio era de una sesión que ya se cerró.' });

const nuevoEstado = (usuario = null) => ({
  usuario,
  /** Sube con cada sesión: lo que conteste una sesión vieja no toca la nueva. */
  generacion: (estado ? estado.generacion : 0) + 1,
  seq: 0,
  /** clave → motivo, de lo que no se pudo cargar. */
  sinCargar: new Map(),
  /** clave → { valor, seq, motivo, desde }: lo último que no llegó a la cuenta. */
  pendientes: new Map(),
  /** seq → { clave, desde }: lo que está saliendo ahora mismo. */
  enVuelo: new Map(),
  /** clave → la promesa del último guardado de esa clave (la cola). */
  colas: new Map(),
  /** clave → el seq más nuevo que sí llegó. */
  ultimoOk: new Map(),
  /** clave → { seq, valor } de lo último que SALIÓ de verdad (tras su espera). Es lo que se reescribe si
   *  una escritura vieja termina después (A4). Una entrada por clave, solo en memoria. */
  ultimoEnviado: new Map(),
  /** clave → { seq, valor } del último valor que PIDIÓ la aplicación (lo que hay en pantalla). Es lo que
   *  manda un reintento o una reescritura cuando le toca salir (A5): nunca algo más viejo. Solo en memoria. */
  ultimoDeseado: new Map(),
  /** seq → clave de las peticiones VENCIDAS (pasó `TOPE_PETICION_MS`) que todavía no han contestado: pueden
   *  aplicarse aún, así que mientras vivan su clave no se da por guardada (A5). */
  vencidas: new Map(),
  /** Si está reintentando lo pendiente (lo pidió él o volvió la conexión). */
  reintentando: false,
  /** Cuándo terminó bien el último reintento: «Guardado», un momento. */
  confirmadoEn: 0,
});

let estado = null;
estado = nuevoEstado(null);
const oyentes = new Set();

function avisar() {
  const r = resumenSincronizacion();
  oyentes.forEach((fn) => { try { fn(r); } catch { /* un oyente roto no para a los demás */ } });
}

/** Qué pasó, en una palabra: lo que se enseña cambia con ello (sin conexión no es lo mismo que «el servidor dijo que no»). */
export function motivoDeError(error) {
  if (!error) return null;
  const e = typeof error === 'object' ? error : { message: String(error) };
  const codigo = String(e.code ?? '');
  if (codigo === 'carga_fallida' || codigo === 'otra_sesion') return codigo;
  const estadoHttp = Number(e.status ?? e.statusCode);
  const mensaje = [e.message, e.details, e.hint, e.error, e.name].filter((x) => typeof x === 'string').join(' ');
  if (estadoHttp === 413 || codigo === '54000' || /quota|row is too big|too large|payload/i.test(mensaje)) return 'sin_espacio';
  if (estadoHttp === 401 || codigo === 'PGRST301' || /jwt|expired|not authenticated|invalid claim/i.test(mensaje)) return 'sesion';
  if (/failed to fetch|networkerror|network|load failed|offline|timeout|abort/i.test(mensaje)) return 'sin_conexion';
  return 'servidor';
}

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA SESIÓN DE DATOS

   Se empieza al cargar los datos de un usuario y se vacía al salir: lo
   pendiente de una cuenta no puede reintentarse con la sesión de otra.
   ─────────────────────────────────────────────────────────────────────────── */
export function empezarSesionDeDatos(usuario = null) {
  estado = nuevoEstado(usuario || null);
  avisar();
}

export const usuarioDeLaSesion = () => estado.usuario;
/** El número de la sesión de datos: lo que cuelga de una sesión (un reintento en marcha) caduca con ella. */
export const generacionActual = () => estado.generacion;

/* ───────────────────────────────────────────────────────────────────────────
   2 · LO QUE NO SE PUDO CARGAR
   ─────────────────────────────────────────────────────────────────────────── */
export function apuntarCargaFallida(clave, error) {
  estado.sinCargar.set(String(clave), motivoDeError(error) || 'servidor');
  avisar();
}

/** Una carga que sí ha ido bien (al reintentar) desbloquea su clave. */
export function apuntarCargaBuena(clave) {
  if (estado.sinCargar.delete(String(clave))) avisar();
}

export const cargaFallida = (clave) => estado.sinCargar.has(String(clave));
export const clavesSinCargar = () => [...estado.sinCargar.keys()];

/* ───────────────────────────────────────────────────────────────────────────
   3 · UN GUARDADO: ANTES Y DESPUÉS

   `antesDeGuardar` decide si sale (y con qué número) y a qué guardado de su
   clave tiene que esperar; `despuesDeGuardar` apunta cómo fue. Entre los dos,
   quien guarda (`saveData`) habla con la red.
   ─────────────────────────────────────────────────────────────────────────── */
/* `valor` es lo que la aplicación pide guardar (lo que hay en pantalla) y se apunta como el último deseado
   de su clave. Un reintento o una reescritura (`reintento: true`) NO lo traen: deciden qué mandan al salir
   (`alSalir`), porque mientras esperan en la cola puede llegar un cambio más nuevo. */
export function antesDeGuardar(clave, { usuario = null, ahora = Date.now(), valor, reintento = false } = {}) {
  const k = String(clave);
  if (estado.usuario && usuario && usuario !== estado.usuario) return { sale: false, error: ERROR_OTRA_SESION };
  if (estado.sinCargar.has(k)) return { sale: false, error: ERROR_CARGA_FALLIDA };
  const seq = ++estado.seq;
  const anterior = estado.colas.get(k) || null;
  let soltar = null;
  const esta = new Promise((r) => { soltar = r; });
  estado.colas.set(k, esta);
  estado.enVuelo.set(seq, { clave: k, desde: ahora, soltar, esta });
  if (!reintento && valor !== undefined) estado.ultimoDeseado.set(k, { seq, valor });
  avisar();
  return { sale: true, seq, generacion: estado.generacion, usuario: usuario || estado.usuario, anterior, reintento: !!reintento, soltar, esta };
}

/* Deja un turno sin salir a la red: suelta al siguiente de su cola y deja de contarse como «guardando».
   Si su sesión ya no es la de ahora, lo de esa sesión ya no existe: solo se suelta la cola. */
function abandonarTurno(k, turno) {
  if (turno.soltar) turno.soltar();
  if (turno.generacion !== estado.generacion) return;
  estado.enVuelo.delete(turno.seq);
  if (estado.colas.get(k) === turno.esta) estado.colas.delete(k);
  avisar();
}

/** 🐛 A5 — lo que decide un guardado CUANDO LE TOCA SALIR (después de esperar a su anterior), no cuando se
 *  pidió:
 *   · si su sesión se cerró mientras esperaba, no sale (con el mismo usuario, la RLS no lo pararía y pisaría
 *     un cambio de la sesión nueva);
 *   · un reintento o una reescritura solo salen si la clave SIGUE pendiente —si un guardado más nuevo ya
 *     llegó, no queda nada que corregir— y mandan el ÚLTIMO valor pedido para esa clave, nunca el de cuando
 *     se programaron (el `A,B,B,C,B` de la auditoría);
 *   · un guardado normal manda lo suyo.
 *  Devuelve `{ sale: true, valor }`, o `{ sale: false, error? , omitido? }` con el turno ya liberado. */
export function alSalir(clave, turno, valorPedido) {
  const k = String(clave);
  if (!turno || !turno.seq) return { sale: false, error: ERROR_OTRA_SESION };
  if (turno.generacion !== estado.generacion) { abandonarTurno(k, turno); return { sale: false, error: ERROR_OTRA_SESION }; }
  if (!turno.reintento) return { sale: true, valor: valorPedido };
  const p = estado.pendientes.get(k);
  if (!p) { abandonarTurno(k, turno); return { sale: false, omitido: true }; }
  const d = estado.ultimoDeseado.get(k);
  return { sale: true, valor: d ? d.valor : p.valor };
}

/** El guardado ya ha esperado a su anterior y sale a la red ahora: es lo último ENVIADO de su clave (A4).
 *  Se apunta aquí y no en `antesDeGuardar` porque, mientras espera en la cola, todavía no compite con nadie. */
export function marcarEnviado(clave, turno, valor) {
  if (!turno || !turno.seq || turno.generacion !== estado.generacion) return;
  const k = String(clave);
  const u = estado.ultimoEnviado.get(k);
  if (!u || turno.seq > u.seq) estado.ultimoEnviado.set(k, { seq: turno.seq, valor });
}

/** ¿Pudo aplicarse en la cuenta una escritura que terminó así? Si llegó bien, sí. Si falló por la red, no se
 *  sabe (la respuesta se pierde también después de aplicarse). Si la base de datos contestó con un error, no:
 *  la transacción se deshizo. */
/* 🐛 A5 (A4-3) — ¿pudo aplicarse? Solo hay una respuesta que asegura que NO: la de la base de datos o de
   PostgREST con su código (`PGRST…` o un SQLSTATE de cinco caracteres: la transacción se deshizo) o un 4xx (la
   petición se rechazó antes). Todo lo demás —red, tiempo agotado, un 5xx de una pasarela (502, 503, 504, los
   520–527 de Cloudflare) o un 500 sin código— pudo llegar a confirmarse detrás, y se trata como tal. La
   auditoría final de A5 lo cazó: con una lista de «sí» (502/503/504), un 524 de Cloudflare dejaba la cuenta
   con el valor viejo. El motivo que se ENSEÑA no cambia (`motivoDeError`). */
const pudoAplicarse = (ok, error) => {
  if (ok) return true;
  const e = error && typeof error === 'object' ? error : { message: String(error ?? '') };
  const codigo = String(e.code ?? '');
  if (/^PGRST\d+$/i.test(codigo) || /^[0-9A-Z]{5}$/.test(codigo)) return false;
  const estadoHttp = Number(e.status ?? e.statusCode);
  if (estadoHttp >= 400 && estadoHttp < 500 && estadoHttp !== 408) return false;
  return true;
};

/* ¿Dos valores son el mismo? (la misma referencia, o el mismo contenido). Una escritura vieja que llevaba el
   mismo valor que el último pedido no puede dejar la cuenta vieja aunque se aplique la última. */
function mismoValor(a, b) {
  if (a === b) return true;
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}
/** ¿Queda viva alguna petición vencida de esta clave (anterior a `antesDe`)? */
const hayVencida = (k, antesDe = Infinity) => [...estado.vencidas.entries()].some(([s, c]) => c === k && s < antesDe);

/** ⏱ A5 — esta petición pasó `TOPE_PETICION_MS` sin contestar: se deja de esperar, pero puede aplicarse aún. */
export function marcarVencida(clave, turno) {
  if (!turno || !turno.seq || turno.generacion !== estado.generacion) return;
  estado.vencidas.set(turno.seq, String(clave));
}

/* 🐛 A5 — una escritura VIEJA que pudo aplicarse cuando ya había salido otra más nueva de su clave: puede haber
   dejado la cuenta con su valor viejo. La clave queda PENDIENTE con el último valor pedido, y ese pendiente solo
   lo puede borrar una escritura que SALGA DESPUÉS de este momento (las que ya volaban pudieron aplicarse antes
   que la vieja: su «ok» no garantiza nada).
     · Si ya espera alguna escritura de la clave sin salir (normal o reintento), el pendiente se ata a la
       primera de ellas (`seq` justo por debajo): un reintento lo encuentra y manda el último valor, y una
       normal, al llegar bien, lo borra. No hace falta reescribir.
       (La revisión de A5 lo cazó: antes «otra en cola» bastaba para no dejar nada pendiente, la que esperaba
       era un reintento, el «ok» de una escritura que ya volaba borraba el pendiente, el reintento se omitía y
       la cuenta se quedaba con el valor viejo y el indicador en «Guardado».)
     · Si no espera ninguna, se pide reescribir. */
function corregirEscrituraVieja(k, u, ahora, valorViejo) {
  const p = estado.pendientes.get(k);
  const d = estado.ultimoDeseado.get(k);
  const valor = d && d.seq >= u.seq ? d.valor : u.valor;
  /* 🐛 A5 — si la vieja llevaba el mismo valor que el que tiene que quedar, aplicarse la última no deja la cuenta
     vieja: no hay nada que corregir. Sin esto, con una latencia sostenida de más de 10 s las reescrituras se
     encadenaban sin fin, todas con el mismo valor (auditoría final de A5). */
  if (valorViejo !== undefined && mismoValor(valorViejo, valor)) return null;
  const enCola = [...estado.enVuelo.entries()].filter(([s, v]) => v.clave === k && s > u.seq).map(([s]) => s);
  const seq = enCola.length ? Math.min(...enCola) - 1 : estado.seq;
  const seqFinal = p && p.forzado && p.seq > seq ? p.seq : seq;
  estado.pendientes.set(k, { valor, seq: seqFinal, motivo: null, desde: p ? p.desde : ahora, forzado: true });
  avisar();
  return enCola.length ? null : { reescribir: true, valor };
}

export function despuesDeGuardar(clave, turno, { ok, error = null, valor, ahora = Date.now() } = {}) {
  if (!turno || !turno.seq) return null;
  const k = String(clave);
  /* De una sesión que ya no está: no toca nada de la de ahora… */
  if (turno.generacion !== estado.generacion) {
    /* 🐛 A5 — …salvo que sea del MISMO usuario (salió y volvió a entrar), pudo aplicarse, y la sesión de ahora
       ya mandó esa clave: entonces pudo pisar lo nuevo (la RLS solo para a OTRO usuario). Igual que una vieja
       tardía: la clave queda pendiente con el último valor de AHORA y se reescribe — salvo que ya espere otra
       escritura de la clave sin salir, que lo corregirá sola. Nada de la sesión anterior pasa a la nueva. */
    const u = estado.ultimoEnviado.get(k);
    if (!u || !turno.usuario || turno.usuario !== estado.usuario || !pudoAplicarse(ok, error)) return null;
    return corregirEscrituraVieja(k, u, ahora, valor);
  }
  const vuelo = estado.enVuelo.get(turno.seq);
  estado.enVuelo.delete(turno.seq);
  if (vuelo) {
    vuelo.soltar();
    if (estado.colas.get(k) === vuelo.esta) estado.colas.delete(k);
  }
  const p = estado.pendientes.get(k);
  /* A4 — esta escritura es vieja: ya salió otra más nueva de su clave. Si ésta pudo aplicarse, puede haber
     llegado a la cuenta DESPUÉS que la nueva (dos peticiones no ordenan sus respuestas), así que el último
     valor enviado vuelve a quedar pendiente y quien guarda lo reescribe. El pendiente queda `forzado`: solo
     lo borra una escritura que salga después de esto (seq mayor que el de ahora), no una que ya volaba. */
  const u = estado.ultimoEnviado.get(k);
  if (u && u.seq > turno.seq && pudoAplicarse(ok, error)) {
    if (ok && turno.seq > (estado.ultimoOk.get(k) || 0)) estado.ultimoOk.set(k, turno.seq);
    const correccion = corregirEscrituraVieja(k, u, ahora, valor);
    if (correccion || estado.pendientes.has(k)) return correccion;
    /* Llevaba el mismo valor: se trata como un «ok» o un fallo normal de esta escritura (abajo). */
  }
  if (ok) {
    if (turno.seq > (estado.ultimoOk.get(k) || 0)) estado.ultimoOk.set(k, turno.seq);
    if (p && (p.forzado ? p.seq < turno.seq : p.seq <= turno.seq)) {
      /* 🐛 A5 — mientras viva una petición VENCIDA más vieja de esta clave, puede aplicarse aún: no se da por
         guardada. El pendiente se queda (con el último valor) hasta que la vencida conteste. */
      if (hayVencida(k, turno.seq)) {
        const d = estado.ultimoDeseado.get(k);
        estado.pendientes.set(k, { valor: d ? d.valor : p.valor, seq: turno.seq, motivo: p.motivo, desde: p.desde, porVencida: true });
      } else estado.pendientes.delete(k);
    }
  } else if (turno.seq > (estado.ultimoOk.get(k) || 0) && (!p || turno.seq >= p.seq)) {
    /* Solo lo más nuevo que no llegó: una respuesta vieja que falla después de
       que una más nueva llegara bien no vuelve a dejar nada pendiente. */
    estado.pendientes.set(k, { valor, seq: turno.seq, motivo: motivoDeError(error), desde: p ? p.desde : ahora });
  }
  avisar();
  return null;
}

/** ⏱ A5 — la respuesta de una petición que ya se dio por fallida al vencer `TOPE_PETICION_MS` (no se aborta:
 *  puede ser una subida lenta que sigue bien). Si llega —bien, o con un error que no descarta que se aplicara—
 *  y entretanto salió otra escritura más nueva de su clave, pudo pisarla: se corrige como cualquier escritura
 *  vieja (`corregirEscrituraVieja`). Si no salió ninguna y llegó bien, lo que quedó pendiente por ella deja de
 *  estarlo: ya está en la cuenta. Nada de otra sesión de otro usuario. Devuelve lo mismo que `despuesDeGuardar`. */
export function respuestaTardia(clave, turno, { ok, error = null, valor, ahora = Date.now() } = {}) {
  if (!turno || !turno.seq) return null;
  const k = String(clave);
  const mismaSesion = turno.generacion === estado.generacion;
  if (mismaSesion) estado.vencidas.delete(turno.seq);
  if (!mismaSesion && (!turno.usuario || turno.usuario !== estado.usuario)) return null;
  const u = estado.ultimoEnviado.get(k);
  if (pudoAplicarse(ok, error) && u && (!mismaSesion || u.seq > turno.seq)) {
    const correccion = corregirEscrituraVieja(k, u, ahora, valor);
    if (correccion || (estado.pendientes.get(k) || {}).forzado) return correccion;
  }
  if (mismaSesion) {
    /* Lo que quedó pendiente por ESTA petición (si llegó bien), o solo porque vivía una vencida (si ya no queda
       ninguna), deja de estarlo. Un pendiente de otro fallo no se toca. */
    const p = estado.pendientes.get(k);
    const suyo = p && !p.forzado && !p.porVencida && p.seq === turno.seq && ok;
    const porVencida = p && p.porVencida && !hayVencida(k);
    if ((suyo && !hayVencida(k)) || porVencida) { estado.pendientes.delete(k); avisar(); }
  }
  return null;
}

/** Espera al guardado anterior de la misma clave, con tope (`TOPE_ESPERA_ANTERIOR_MS`). */
export function esperarAnterior(anterior, tope = TOPE_ESPERA_ANTERIOR_MS) {
  if (!anterior) return Promise.resolve();
  let reloj = null;
  const tiempo = new Promise((r) => { reloj = setTimeout(r, tope); });
  return Promise.race([anterior, tiempo]).then(() => { if (reloj) clearTimeout(reloj); });
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · REINTENTAR (apartados 18, 32 y 33)

   Lo pendiente de la sesión de ahora, con su último valor. Quien reintenta
   (`reintentarGuardados` en `supabase.js`) lo vuelve a mandar por la puerta de
   siempre, así que pasa otra vez por la cola y por el número de orden.
   ─────────────────────────────────────────────────────────────────────────── */
export const pendientesParaReintentar = () => [...estado.pendientes.entries()].map(([clave, p]) => ({ clave, valor: p.valor }));

export function marcarReintento(enMarcha, { ahora = Date.now(), salioBien = false } = {}) {
  estado.reintentando = !!enMarcha;
  if (!enMarcha && salioBien) estado.confirmadoEn = ahora;
  avisar();
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · SALIR A PROPÓSITO (apartados 44 y 45)

   Supabase dice lo mismo cuando él cierra la sesión que cuando caduca y no se
   puede renovar: que ya no hay sesión. Lo que lo distingue es si alguien lo
   pidió. `signOut` lo apunta y quien pinta la pantalla de entrar lo consume
   una vez: sin marca, la sesión se fue sola, y se explica.
   ─────────────────────────────────────────────────────────────────────────── */
let salidaPedida = false;
export function marcarSalidaPedida() { salidaPedida = true; }
export function consumirSalidaPedida() {
  const habia = salidaPedida;
  salidaPedida = false;
  return habia;
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · EL RESUMEN, PARA QUIEN LO ENSEÑA
   ─────────────────────────────────────────────────────────────────────────── */
export function resumenSincronizacion() {
  const vuelos = [...estado.enVuelo.values()];
  return {
    usuario: estado.usuario,
    sinCargar: [...estado.sinCargar.keys()],
    pendientes: [...estado.pendientes.keys()],
    motivos: [...new Set([...estado.pendientes.values()].map((p) => p.motivo).filter(Boolean))],
    guardando: vuelos.length,
    guardandoDesde: vuelos.length ? Math.min(...vuelos.map((v) => v.desde)) : null,
    reintentando: estado.reintentando,
    confirmadoEn: estado.confirmadoEn,
  };
}

/** Quien enseña el estado se suscribe; devuelve la función de soltar (apartado 50). */
export function suscribirSincronizacion(fn) {
  if (typeof fn !== 'function') return () => {};
  oyentes.add(fn);
  return () => { oyentes.delete(fn); };
}

/** 🐛 2026-10-18 — lo que contesta un `snapshotAndSave` que escribe varias claves: el primer guardado
 *  que no llegó, o `{ ok: true }` si llegaron todos. Una promesa que lanza cuenta como no llegada. */
export function resultadoDeGuardados(promesas) {
  return Promise.all((promesas || []).map((p) => Promise.resolve(p).catch((error) => ({ ok: false, error }))))
    .then((rs) => rs.find((r) => r && r.ok === false) || { ok: true, error: null });
}

/** El texto de un guardado que no ha llegado (`{ ok: false, error }`). Nunca vacío: sin saber por
 *  qué, sigue habiendo aviso. Si la clave no se pudo cargar o la sesión cambió, lo dice. */
export const FALLO_AL_GUARDAR = 'No se ha podido guardar en tu cuenta. Vuelve a intentarlo.';
export function textoDeFalloAlGuardar(res) {
  const code = res && res.error && res.error.code;
  if ((code === 'carga_fallida' || code === 'otra_sesion') && res.error.message) return `${res.error.message} El cambio no se ha guardado.`;
  return FALLO_AL_GUARDAR;
}
