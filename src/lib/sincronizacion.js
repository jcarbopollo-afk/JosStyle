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
       espera a que termine el anterior, así que la cuenta nunca se queda con
       uno más viejo que llegó tarde. Y una respuesta que llega después de otra
       más nueva no reescribe lo pendiente.

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
export function antesDeGuardar(clave, { usuario = null, ahora = Date.now() } = {}) {
  const k = String(clave);
  if (estado.usuario && usuario && usuario !== estado.usuario) return { sale: false, error: ERROR_OTRA_SESION };
  if (estado.sinCargar.has(k)) return { sale: false, error: ERROR_CARGA_FALLIDA };
  const seq = ++estado.seq;
  const anterior = estado.colas.get(k) || null;
  let soltar = null;
  const esta = new Promise((r) => { soltar = r; });
  estado.colas.set(k, esta);
  estado.enVuelo.set(seq, { clave: k, desde: ahora, soltar, esta });
  avisar();
  return { sale: true, seq, generacion: estado.generacion, anterior };
}

export function despuesDeGuardar(clave, turno, { ok, error = null, valor, ahora = Date.now() } = {}) {
  if (!turno || !turno.seq) return;
  const k = String(clave);
  /* De una sesión que ya no está: no toca nada de la de ahora. */
  if (turno.generacion !== estado.generacion) return;
  const vuelo = estado.enVuelo.get(turno.seq);
  estado.enVuelo.delete(turno.seq);
  if (vuelo) {
    vuelo.soltar();
    if (estado.colas.get(k) === vuelo.esta) estado.colas.delete(k);
  }
  const p = estado.pendientes.get(k);
  if (ok) {
    if (turno.seq > (estado.ultimoOk.get(k) || 0)) estado.ultimoOk.set(k, turno.seq);
    if (p && p.seq <= turno.seq) estado.pendientes.delete(k);
  } else if (turno.seq > (estado.ultimoOk.get(k) || 0) && (!p || turno.seq >= p.seq)) {
    /* Solo lo más nuevo que no llegó: una respuesta vieja que falla después de
       que una más nueva llegara bien no vuelve a dejar nada pendiente. */
    estado.pendientes.set(k, { valor, seq: turno.seq, motivo: motivoDeError(error), desde: p ? p.desde : ahora });
  }
  avisar();
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
