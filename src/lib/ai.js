export const AI_SYSTEM =
  'Eres el asistente de IA integrado en la app personal de Josué, un chico de 16 años. Respondes en español, ' +
  'en un tono a medio camino entre prudente y directo. Basas cada afirmación únicamente en los datos concretos ' +
  'que te pasan, citando brevemente en qué dato te apoyas; si son pocos datos, lo dices abiertamente en vez de ' +
  'inventar patrones. Máximo 3-4 frases cortas, sin rodeos.';

export async function askAI(systemPrompt, userPrompt) {
  const res = await fetch('/api/ask-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: systemPrompt, prompt: userPrompt, images: images.map((data) => ({ data, mediaType })) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fallo en la petición de IA');
  return data.text || '';
}
