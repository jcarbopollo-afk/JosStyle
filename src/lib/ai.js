import { supabase } from './supabase';

/**
 * 🚨 **La cabecera que dice quién llama** (EH F63 → cerrado aquí).
 *
 * `/api/ask-ai` no pedía identificarse: cualquiera que supiera la URL podía
 * llamarlo desde una terminal y **gastar el dinero de Josué** en la API de
 * Anthropic. No era una fuga de datos —con eso no se lee nada de nadie— era una
 * factura.
 *
 * Ahora cada petición manda el token de la sesión de Supabase, que el navegador
 * ya tiene, y el servidor lo comprueba. ⚠️ Si no hay sesión se manda igual **sin
 * cabecera**: es el servidor quien decide, no el cliente. Un cliente que decide
 * si hace falta autenticarse no está autenticando nada.
 */
async function cabeceras() {
  const base = { 'Content-Type': 'application/json' };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) base.Authorization = `Bearer ${token}`;
  } catch { /* sin sesión: el servidor responderá 401 */ }
  return base;
}

export const AI_SYSTEM =
  'Eres el asistente de IA integrado en la app personal de Josué, un chico de 16 años. Respondes en español, ' +
  'en un tono a medio camino entre prudente y directo. Basas cada afirmación únicamente en los datos concretos ' +
  'que te pasan, citando brevemente en qué dato te apoyas; si son pocos datos, lo dices abiertamente en vez de ' +
  'inventar patrones. Máximo 3-4 frases cortas, sin rodeos.';

export async function askAI(systemPrompt, userPrompt) {
  const res = await fetch('/api/ask-ai', {
    method: 'POST',
    headers: await cabeceras(),
    body: JSON.stringify({ system: systemPrompt, prompt: userPrompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fallo en la petición de IA');
  return data.text || '';
}

// Fase 4 — Nutrición: igual que askAI, pero adjuntando una foto (base64 sin el prefijo
// "data:image/...;base64,"). Se usa para el escaneo de comida por foto.
export async function askAIWithImage(systemPrompt, userPrompt, base64Data, mediaType = 'image/jpeg') {
  const res = await fetch('/api/ask-ai', {
    method: 'POST',
    headers: await cabeceras(),
    body: JSON.stringify({ system: systemPrompt, prompt: userPrompt, image: { data: base64Data, mediaType } }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fallo en la petición de IA');
  return data.text || '';
}

// Fase 5 — Calistenia: análisis de vídeo por fotogramas clave. Manda varias imágenes (base64,
// sin el prefijo "data:image/...;base64,") en una sola petición, en vez de una imagen suelta.
export async function askAIWithImages(systemPrompt, userPrompt, images, mediaType = 'image/jpeg') {
  const res = await fetch('/api/ask-ai', {
    method: 'POST',
    headers: await cabeceras(),
    body: JSON.stringify({ system: systemPrompt, prompt: userPrompt, images: images.map((data) => ({ data, mediaType })) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fallo en la petición de IA');
  return data.text || '';
}
