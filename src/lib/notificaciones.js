// Fase A4 — Notificaciones reales (Entrega 1 de la especificación extendida, apartados 111-138).
//
// Alcance honesto: esto NO es Web Push. Web Push de verdad (notificaciones con la app cerrada
// del todo) exige un Service Worker que escuche eventos `push`, una tabla de suscripciones en
// Supabase y otra función serverless en Vercel que las dispare — es infraestructura nueva, no
// una ampliación de lo que ya existe, y queda fuera de esta fase (documentado en HANDOFF.md).
//
// Lo que SÍ hace este archivo, de verdad: usa la Notification API del navegador directamente
// para mostrar notificaciones reales del sistema mientras la PWA está abierta (aunque la pestaña
// no tenga el foco). Centraliza las comprobaciones que pide la especificación antes de mostrar
// cualquier aviso: permiso concedido, interruptor global activado, categoría activada y fuera
// del horario de descanso configurado (apartados 116, 117, 122).

export function permisoNotificaciones() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'no-soportado';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export async function pedirPermisoNotificaciones() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'no-soportado';
  try {
    return await Notification.requestPermission();
  } catch {
    return permisoNotificaciones();
  }
}

// Apartado 122 — horas de descanso: soporta franjas que cruzan medianoche (ej. 23:00-07:00).
function dentroDeHorarioDescanso(notificaciones) {
  if (!notificaciones.horarioDescansoActivo) return false;
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const [hIni, mIni] = notificaciones.horarioDescansoInicio.split(':').map(Number);
  const [hFin, mFin] = notificaciones.horarioDescansoFin.split(':').map(Number);
  const inicio = hIni * 60 + mIni;
  const fin = hFin * 60 + mFin;
  if (inicio === fin) return false;
  if (inicio < fin) return minutosAhora >= inicio && minutosAhora < fin;
  return minutosAhora >= inicio || minutosAhora < fin; // cruza medianoche
}

// `clave` identifica el aviso (ej. "sueno-corto"), no hace falta que incluya la fecha — esta
// función ya evita repetir el mismo aviso el mismo día guardando una marca en localStorage
// (a propósito, no en Supabase: es un detalle de este dispositivo/navegador, no un dato a
// sincronizar entre dispositivos, ver apartado 134).
export function notificarSiCorresponde(notificaciones, categoria, clave, titulo, cuerpo) {
  if (!notificaciones || !notificaciones.activadas) return;
  if (notificaciones.categorias && notificaciones.categorias[categoria] === false) return;
  if (permisoNotificaciones() !== 'granted') return;
  if (dentroDeHorarioDescanso(notificaciones)) return;

  if (typeof window !== 'undefined' && window.localStorage) {
    const marcaKey = `notif-${clave}-${new Date().toISOString().slice(0, 10)}`;
    if (window.localStorage.getItem(marcaKey)) return;
    window.localStorage.setItem(marcaKey, '1');
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(titulo, { body: cuerpo, icon: '/icon-192.png' });
  } catch {
    // Algunos navegadores (sobre todo móviles) no permiten `new Notification()` directo y
    // exigen pasar por un Service Worker (`registration.showNotification`). Si falla aquí,
    // no se rompe nada más — el aviso dentro de la propia app (la tarjeta en "Hoy") sigue
    // mostrándose igual, solo no llega el aviso extra del sistema.
  }
}
