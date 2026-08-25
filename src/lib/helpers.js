export const uid = () => Math.random().toString(36).slice(2, 10);

export function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function shade(hex, amt) {
  const h = hex.replace('#', '');
  const clamp = (v) => Math.min(255, Math.max(0, v));
  const r = clamp(parseInt(h.substring(0, 2), 16) + amt);
  const g = clamp(parseInt(h.substring(2, 4), 16) + amt);
  const b = clamp(parseInt(h.substring(4, 6), 16) + amt);
  return `rgb(${r}, ${g}, ${b})`;
}

export function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// Devuelve las horas dormidas entre dos "HH:MM", cruzando medianoche cuando toca.
//
// Devuelve `null` si falta cualquiera de las dos horas o no tienen el formato esperado.
// Sin esa comprobación, un registro de sueño incompleto —guardado por una versión
// anterior, o a medias— hacía reventar con "Cannot read properties of undefined
// (reading 'split')" a las CUATRO pantallas que llaman a esta función (Hoy, Sueño,
// Estadísticas y las tarjetas de hub), dejándolas en blanco. Quien la llama ya trataba
// el caso "sin datos", así que devolver null encaja con lo que esperan.
export function calcularDuracion(horaDormir, horaDespertar) {
  if (typeof horaDormir !== 'string' || typeof horaDespertar !== 'string') return null;
  const [h1, m1] = horaDormir.split(':').map(Number);
  const [h2, m2] = horaDespertar.split(':').map(Number);
  if ([h1, m1, h2, m2].some((n) => !Number.isFinite(n))) return null;
  let start = h1 * 60 + m1;
  let end = h2 * 60 + m2;
  if (end <= start) end += 24 * 60;
  return Math.round(((end - start) / 60) * 10) / 10;
}

// Presentación de un resultado de `calcularDuracion`. Existe para que un registro de sueño
// incompleto se vea como "— h" y no como el literal "null h" en las cuatro pantallas que
// muestran horas dormidas.
export function formatHoras(horas) {
  return horas === null || horas === undefined ? '—' : String(horas);
}

export function formatFecha(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Fase 12 — Relación: dado un ISO (aniversario, cumpleaños, o cualquier fecha importante
// guardada con su año real), devuelve la próxima vez que "toca" — mismo mes/día de este año
// si todavía no ha pasado, o del año que viene si ya pasó. Sirve igual para fechas que se
// repiten cada año (aniversario) que para una fecha puntual futura (esta última nunca "ya
// pasó", así que simplemente se devuelve tal cual).
export function proximaOcurrencia(fechaISO) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const [, mes, dia] = fechaISO.split('-').map(Number);
  let candidata = new Date(hoy.getFullYear(), mes - 1, dia);
  if (candidata < hoy) candidata = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  return candidata;
}

export function diasHasta(fechaISO) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const objetivo = proximaOcurrencia(fechaISO);
  return Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));
}

// Fase 18 — IA con memoria a fondo: mismo patrón que ya usaba NutritionView.jsx (Fase 4) para
// el escaneo de comida por foto, ahora compartido para que AIPanel (ui.jsx) pueda adjuntar
// una imagen (foto o captura) a cualquier pregunta de IA de cualquier sección.
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
