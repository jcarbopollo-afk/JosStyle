import { createClient } from '@supabase/supabase-js';
/* El bus de eventos (SO F1). Supabase no sabe que existe el audio: emite lo que
   pasa y quien quiera reacciona — el desacoplamiento del apartado 31. */
import { emitir } from './eventos';
/* MS F16 — la cuenta de lo que se carga, se guarda y no ha llegado: un solo
   sitio para toda la aplicación (`sincronizacion.js`, una hoja del árbol). */
import {
  antesDeGuardar, despuesDeGuardar, esperarAnterior, marcarEnviado, alSalir, respuestaTardia, marcarVencida, apuntarCargaFallida, apuntarCargaBuena,
  pendientesParaReintentar, marcarReintento, usuarioDeLaSesion, generacionActual, marcarSalidaPedida, TOPE_PETICION_MS,
} from './sincronizacion';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

/* ---------- Autenticación ---------- */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  /* MS F16, apartado 45 — salir porque él lo pide no es que la sesión caduque:
     la pantalla de entrar solo explica la caducidad cuando nadie pidió salir. */
  marcarSalidaPedida();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => sub.subscription.unsubscribe();
}

// Fase de Seguridad Centralizada — recuperación de PIN. Suscripción aparte de onAuthChange (no la
// sustituye: App.jsx sigue usando esa para la sesión general) que expone también el propio evento,
// para poder detectar específicamente 'PASSWORD_RECOVERY' — el momento en que Josué ha pulsado el
// enlace de recuperación que le llegó por correo. Supabase permite varias suscripciones a la vez
// sin conflicto entre ellas.
export function onAuthEvent(callback) {
  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => sub.subscription.unsubscribe();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Envía el correo de recuperación de Supabase — se usa como verificación real de identidad para
// "¿No recuerdas tu PIN?" (nunca para tocar la contraseña de la cuenta: no se pide ni se guarda en
// ningún momento). Al abrir el enlace desde el correo, Supabase arranca una sesión de recuperación
// en el propio dispositivo y dispara el evento 'PASSWORD_RECOVERY' que escucha onAuthEvent — solo
// entonces la app deja crear un PIN nuevo.
export async function sendPasswordReset(email, redirectTo) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

/* ---------- Datos: una fila por usuario + "clave" (misma idea que las claves de window.storage) ---------- */
export async function loadData(userId, key, fallback) {
  let data = null;
  let error = null;
  try {
    ({ data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle());
  } catch (e) { error = e; }
  if (error) {
    console.error('Error cargando', key, error);
    /* 🚨 MS F16, apartado 20 — **no haber podido cargar no es no tener nada.**
       Se sigue devolviendo el valor por defecto (la aplicación arranca y el
       resto de apartados funciona), pero la clave queda apuntada: hasta que se
       cargue de verdad, `saveData` no la escribe, porque pisaría con lo que se
       ve en pantalla lo que hay en la cuenta. */
    apuntarCargaFallida(key, error);
    return fallback;
  }
  apuntarCargaBuena(key);
  return data ? data.value : fallback;
}

/**
 * 🚨 ⚠️ **EH F52 — guardar puede fallar, y no se enteraba nadie.** Esta función
 * se tragaba el error con un `console.error` y **no devolvía nada**: si la
 * escritura fallaba —sin conexión, servidor caído, política de RLS— la
 * aplicación seguía como si se hubiera guardado, y el usuario se enteraba al
 * volver y no encontrar su cambio. El estado `error_guardado` existe desde la
 * F41 con `detectable: false` **por esto exactamente**.
 *
 * ⚠️ Ahora **devuelve el resultado**: `{ ok, error }`. Sigue sin lanzar, así que
 * las llamadas que la usan como `await saveData(...)` funcionan igual que antes;
 * lo que cambia es que **ya se puede preguntar**. Encender el aviso en la
 * interfaz es otra cosa, y mientras no esté hecha, `error_guardado` sigue con
 * `detectable: false`: decir lo contrario sería fingir un aviso que nadie
 * enciende (regla 8).
 */
export async function saveData(userId, key, value, { reintento = false } = {}) {
  /* 🚨 MS F16 — antes de salir: una clave que no se pudo cargar no se escribe
     (pisaría lo que hay en la cuenta), un guardado de una sesión que ya se
     cerró tampoco, y los de una misma clave salen EN ORDEN (apartado 41): este
     espera a que termine el anterior, así que la cuenta no se queda con uno más
     viejo que llegó tarde. */
  const turno = antesDeGuardar(key, { usuario: userId, valor: value, reintento });
  if (!turno.sale) {
    console.error('No se guarda', key, turno.error.message);
    emitir('ACTION_ERROR', { de: 'guardar', clave: key, motivo: turno.error.code });
    return { ok: false, error: turno.error, bloqueado: true };
  }
  await esperarAnterior(turno.anterior);
  /* 🐛 A5 — qué sale se decide AHORA, no al pedirlo: si la sesión cambió mientras esperaba, no sale; un
     reintento o una reescritura solo salen si la clave sigue pendiente, y con el último valor pedido. */
  const salida = alSalir(key, turno, value);
  const tardia = (r) => { const d = respuestaTardia(key, turno, { ...r, valor: value }); if (d && d.reescribir) saveData(userId, key, d.valor, { reintento: true }); };
  if (!salida.sale) return salida.omitido ? { ok: true, error: null, omitido: true } : { ok: false, error: salida.error, bloqueado: true };
  value = salida.valor;
  /* A4 — sale ahora: es lo último enviado de su clave. Si una escritura más vieja termina después, se
     reescribe el último valor (abajo). */
  marcarEnviado(key, turno, value);
  let error = null;
  /* ⏱ A5 — ninguna petición tiene a la cola esperando para siempre: a los `TOPE_PETICION_MS` se da por
     fallida «sin saber si llegó» (cuenta como sin conexión), y la cola, el indicador y el reintento se
     liberan. ⚠️ NO se aborta: una subida grande con poca cobertura puede tardar más y seguir bien, y
     abortarla haría que no llegara nunca (cada reintento se cortaría igual). Se la sigue ESCUCHANDO: si su
     respuesta llega tarde, `respuestaTardia` la trata como una escritura vieja (y reescribe si pudo pisar
     algo) o retira su pendiente si ya está en la cuenta. Lo único que el cliente no puede saber es una
     petición que se aplica y cuya respuesta no llega nunca: eso solo lo cierra el servidor. */
  let reloj = null;
  let vencida = false;
  try {
    /* Se envuelve UNA vez: el constructor de postgrest-js lanza la petición cada vez que se llama a su `then`,
       y aquí se escucha dos veces (la carrera con el tope y la respuesta tardía). */
    const peticion = Promise.resolve(supabase
      .from('app_data')
      .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' }));
    const tiempo = new Promise((r) => {
      reloj = setTimeout(() => { vencida = true; marcarVencida(key, turno); r({ error: { name: 'TimeoutError', message: 'timeout: la petición no contestó a tiempo' } }); }, TOPE_PETICION_MS);
    });
    peticion.then(
      (r) => { if (vencida) tardia({ ok: !(r && r.error), error: r && r.error ? (r.status && r.error.status === undefined ? { ...r.error, message: r.error.message, status: r.status } : r.error) : null }); },
      (e) => { if (vencida) tardia({ ok: false, error: e }); },
    );
    let status;
    ({ error, status } = await Promise.race([peticion, tiempo]));
    /* 🐛 A5 — postgrest-js deja el estado HTTP en la respuesta, no en el error (con un cuerpo que no es JSON, el
       error es solo `{ message: cuerpo }`): sin pegarlo, un 502/503 de una pasarela no se reconocía. */
    if (error && status && typeof error === 'object' && error.status === undefined) error = { ...error, message: error.message, status };
  } catch (e) { error = e; } finally { if (reloj) clearTimeout(reloj); }
  /* Y después: si no llegó, se queda pendiente con su último valor; si llegó,
     lo pendiente de esa clave (más viejo) deja de estarlo. */
  const decision = despuesDeGuardar(key, turno, { ok: !error, error, valor: value });
  /* 🐛 A4 — esta escritura era vieja y pudo llegar a la cuenta DESPUÉS de una más nueva (la cola tiene tope):
     el último valor enviado ya está pendiente, y se reescribe una vez por la puerta de siempre, con su cola
     y su número. No se espera aquí: lo que devuelve este guardado es lo de esta escritura. Si la
     reescritura falla, queda pendiente con su motivo y el indicador lo dice. */
  if (decision && decision.reescribir) saveData(userId, key, decision.valor, { reintento: true });
  if (error) {
    console.error('No se pudo guardar', key, error);
    /* 🚨 **Un guardado que falla tiene que oírse.** Es el caso que el proyecto
       persigue desde la F52: Josué escribe algo, cree que está guardado, y no
       lo está.

       ⚠️ Se emite el fallo y NO el acierto. Guardar sale bien decenas de veces
       por sesión —esta función se llama desde 86 sitios de App.jsx— y un sonido
       en cada una, encima del clic, sería ruido. Lo que hay que oír es lo que
       no se espera. */
    emitir('ACTION_ERROR', { de: 'guardar', clave: key });
  }
  return { ok: !error, error: error || null };
}

/**
 * 🚨 **Perder y recuperar la conexión, dicho en voz alta.**
 *
 * La biblioteca declara `connection_lost` y `connection_restored` como pareja
 * —la misma frase al revés, una baja y otra sube— y hasta ahora no los emitía
 * nadie: los dos archivos existían sin que nada pudiera dispararlos.
 *
 * ⚠️ Va aquí, con el resto de lo que habla con la red, y no en una pantalla: es
 * un hecho de la conexión, no de una vista. Devuelve la función de soltar, que
 * es lo que impide dejar oyentes pegados a `window` entre montajes.
 */
export function vigilarLaConexion() {
  if (typeof window === 'undefined' || !window.addEventListener) return () => {};
  const perdida = () => emitir('CONNECTION_LOST', {});
  /* MS F16, apartado 32 — al volver la conexión, lo que no llegó se vuelve a
     mandar solo: *"reconnecting → synced"*. */
  const vuelta = () => { emitir('CONNECTION_RESTORED', {}); reintentarGuardados(); };
  window.addEventListener('offline', perdida);
  window.addEventListener('online', vuelta);
  return () => {
    window.removeEventListener('offline', perdida);
    window.removeEventListener('online', vuelta);
  };
}

/**
 * 🔓 **MS F16, apartados 18, 32 y 33 — volver a mandar lo que no llegó.**
 *
 * Lo pendiente de la sesión de ahora, cada clave con SU último valor, por la
 * puerta de siempre (`saveData`): pasa otra vez por la cola y por el número de
 * orden, así que un cambio que él haga mientras tanto no queda por debajo.
 * Devuelve si todo llegó. Sin nada pendiente, no hace nada (ni un «Guardado»
 * que nadie ha pedido).
 */
/* 🐛 A5 — cada reintento sale en modo `reintento`: espera su turno en la cola y, cuando le toca, solo sale si
   la clave sigue pendiente y con el ÚLTIMO valor pedido (antes mandaba el de cuando se pulsó, detrás de un
   cambio más nuevo, y lo pisaba). El reintento en marcha es de UNA sesión: otra sesión no hereda una promesa
   suya, y como cada petición tiene tope (`TOPE_PETICION_MS`), siempre termina. */
let reintentoEnMarcha = null;
export function reintentarGuardados() {
  const generacion = generacionActual();
  /* Si ya hay uno en marcha en esta sesión, el nuevo se encadena DETRÁS (uno solo, por mucho que se pida):
     lo que haya quedado pendiente mientras tanto no se queda sin reintentar. */
  if (reintentoEnMarcha && reintentoEnMarcha.generacion === generacion) {
    if (!reintentoEnMarcha.siguiente) reintentoEnMarcha.siguiente = reintentoEnMarcha.promesa.then(() => reintentarGuardados());
    return reintentoEnMarcha.siguiente;
  }
  const usuario = usuarioDeLaSesion();
  const lista = pendientesParaReintentar();
  if (!usuario || !lista.length) return Promise.resolve(true);
  marcarReintento(true);
  const este = { generacion, promesa: null, siguiente: null };
  este.promesa = Promise.all(lista.map(({ clave, valor }) => saveData(usuario, clave, valor, { reintento: true })))
    .then((r) => r.every((x) => x && x.ok), () => false)
    .then((bien) => {
      if (reintentoEnMarcha === este) reintentoEnMarcha = null;
      if (generacionActual() === generacion) marcarReintento(false, { salioBien: bien });
      return bien;
    });
  reintentoEnMarcha = este;
  return este.promesa;
}

/* ---------- Storage: fotos de progreso (bucket privado "progreso", una carpeta por usuario) ----------
   Fase 3 — Salud. El bucket es privado (no público), así que cada foto se sirve con una URL firmada
   de corta duración en vez de una URL pública fija. Las políticas de storage (ver supabase/schema.sql)
   solo dejan a cada usuario leer/escribir dentro de su propia carpeta `${user_id}/...`. */
export async function uploadProgressPhoto(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('progreso').upload(path, file);
  if (error) throw error;
  return path;
}

export async function getSignedPhotoUrl(path) {
  const { data, error } = await supabase.storage.from('progreso').createSignedUrl(path, 3600);
  if (error) { console.error('No se pudo firmar la foto', path, error); return null; }
  return data.signedUrl;
}

export async function deleteProgressPhoto(path) {
  const { error } = await supabase.storage.from('progreso').remove([path]);
  if (error) console.error('No se pudo borrar la foto', path, error);
}

/* ---------- Storage: vídeos de calistenia (bucket privado "entrenamiento-videos") ----------
   Fase 5 — Calistenia. Mismo patrón exacto que las fotos de progreso de Salud: bucket privado,
   una carpeta por usuario, URL firmada de corta duración para reproducir o para extraer fotogramas. */
export async function uploadTrainingVideo(userId, file) {
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('entrenamiento-videos').upload(path, file);
  if (error) throw error;
  return path;
}

export async function getSignedVideoUrl(path) {
  const { data, error } = await supabase.storage.from('entrenamiento-videos').createSignedUrl(path, 3600);
  if (error) { console.error('No se pudo firmar el vídeo', path, error); return null; }
  return data.signedUrl;
}

export async function deleteTrainingVideo(path) {
  const { error } = await supabase.storage.from('entrenamiento-videos').remove([path]);
  if (error) console.error('No se pudo borrar el vídeo', path, error);
}

/* ---------- Storage: archivos de la Biblioteca (bucket privado "biblioteca") ----------
   Fase 11 — Biblioteca. Mismo patrón exacto que "progreso" y "entrenamiento-videos": bucket
   privado, una carpeta por usuario, URL firmada de corta duración. Un único bucket sirve para
   los tres tipos de archivo (pdf/vídeo/foto) porque comparten el mismo modelo de acceso — el
   tipo se guarda aparte, en el propio registro de `bibliotecaArchivos` (App.jsx). */
export async function uploadBibliotecaArchivo(userId, file) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('biblioteca').upload(path, file);
  if (error) throw error;
  return path;
}

export async function getSignedBibliotecaUrl(path) {
  const { data, error } = await supabase.storage.from('biblioteca').createSignedUrl(path, 3600);
  if (error) { console.error('No se pudo firmar el archivo de biblioteca', path, error); return null; }
  return data.signedUrl;
}

export async function deleteBibliotecaArchivo(path) {
  const { error } = await supabase.storage.from('biblioteca').remove([path]);
  if (error) console.error('No se pudo borrar el archivo de biblioteca', path, error);
}

/* ---------- Storage: fotos de prendas (bucket privado "armario") ----------
   Entrega 2 · AR Fase 1. Mismo patrón que las fotos de Salud y los vídeos de Calistenia:
   bucket privado, una carpeta por usuario, URL firmada de corta duración para verlas.

   La foto es OPCIONAL por diseño (apartado 4 de la especificación: "no obligar al usuario a
   fotografiar sus prendas"), así que si el bucket todavía no existe en Supabase el armario
   sigue funcionando entero — solo falla subir una imagen, y con un mensaje que lo explica. */
export async function uploadPrendaFoto(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('armario').upload(path, file);
  if (error) throw error;
  return path;
}

export async function getSignedPrendaUrl(path) {
  const { data, error } = await supabase.storage.from('armario').createSignedUrl(path, 3600);
  if (error) { console.error('No se pudo firmar la foto de la prenda', path, error); return null; }
  return data.signedUrl;
}

export async function deletePrendaFoto(path) {
  const { error } = await supabase.storage.from('armario').remove([path]);
  if (error) console.error('No se pudo borrar la foto de la prenda', path, error);
}

// ---------------------------------------------------------------------------
// NAV F3 — el Álbum de Relación.
//
// Mismo patrón exacto que las fotos de prenda, las de Salud, los vídeos de
// Calistenia, los archivos de Biblioteca y los fondos: **el archivo va a
// Storage y lo que se guarda en `app_data` es el CAMINO**, nunca la URL
// firmada — que caduca en una hora, así que guardarla sería guardar algo que
// deja de funcionar mientras Josué duerme (E3 F17).
//
// 🚨 **Bucket propio y privado**, no una carpeta dentro de otro: estas fotos son
// lo más privado de la aplicación —viven detrás del PIN— y meterlas en
// `biblioteca` o en `armario` obligaría a distinguirlas por convenio de nombre
// de archivo, que es el tipo de acuerdo implícito que se rompe solo (el mismo
// motivo por el que `fondos` no está dentro de `armario`).
//
// ⚠️ El aislamiento lo da **la base de datos**, no la pantalla: la primera
// carpeta del camino es el `auth.uid()`, y las políticas RLS del bucket exigen
// que coincida. Esconder un botón no protege nada (EH F43, EH F63).
// ---------------------------------------------------------------------------
export async function uploadFotoRelacion(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('relacion').upload(path, file);
  if (error) throw error;
  return path;
}

export async function getSignedFotoRelacionUrl(path) {
  const { data, error } = await supabase.storage.from('relacion').createSignedUrl(path, 3600);
  if (error) { console.error('No se pudo firmar la foto del álbum', path, error); return null; }
  return data.signedUrl;
}

export async function deleteFotoRelacion(path) {
  const { error } = await supabase.storage.from('relacion').remove([path]);
  if (error) console.error('No se pudo borrar la foto del álbum', path, error);
}

// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 2 — la fotografía de fondo.
//
// Mismo patrón que las fotos de prenda, de Salud y los vídeos de Calistenia:
// bucket privado, carpeta por usuario, URL firmada de una hora. Nunca pública.
// ---------------------------------------------------------------------------
export async function uploadFondoFoto(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('fondos').upload(path, file);
  if (error) throw error;
  return path;
}

export async function getSignedFondoUrl(path) {
  const { data, error } = await supabase.storage.from('fondos').createSignedUrl(path, 3600);
  if (error) { console.error('No se pudo firmar la foto de fondo', path, error); return null; }
  return data.signedUrl;
}

export async function deleteFondoFoto(path) {
  const { error } = await supabase.storage.from('fondos').remove([path]);
  if (error) console.error('No se pudo borrar la foto de fondo', path, error);
}
