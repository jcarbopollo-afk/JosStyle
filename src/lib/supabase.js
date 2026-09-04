import { createClient } from '@supabase/supabase-js';
/* El bus de eventos (SO F1). Supabase no sabe que existe el audio: emite lo que
   pasa y quien quiera reacciona — el desacoplamiento del apartado 31. */
import { emitir } from './eventos';

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
  const { data, error } = await supabase
    .from('app_data')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.error('Error cargando', key, error);
    return fallback;
  }
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
export async function saveData(userId, key, value) {
  const { error } = await supabase
    .from('app_data')
    .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' });
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
  const vuelta = () => emitir('CONNECTION_RESTORED', {});
  window.addEventListener('offline', perdida);
  window.addEventListener('online', vuelta);
  return () => {
    window.removeEventListener('offline', perdida);
    window.removeEventListener('online', vuelta);
  };
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
