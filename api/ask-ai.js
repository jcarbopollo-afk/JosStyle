// Función serverless de Vercel. Vive en el servidor, nunca en el navegador,
// así que es el único sitio donde puede existir la clave de Anthropic.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'IA no configurada todavía. Añade ANTHROPIC_API_KEY en las variables de entorno del proyecto en Vercel.',
    });
  }

  const { system, prompt, image, images } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt' });
  }

  // Content de la petición a Anthropic: puede llevar varias imágenes (Fase 5: fotogramas de
  // vídeo), una imagen suelta (Fase 4: escaneo de comida por foto), o solo texto — en ese orden
  // de prioridad. Sin imagen, el comportamiento es idéntico al original.
  const content = [];
  if (Array.isArray(images) && images.length > 0) {
    images.forEach((img) => {
      if (img && img.data) {
        content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.data } });
      }
    });
  } else if (image && image.data) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: image.mediaType || 'image/jpeg', data: image.data },
    });
  }
  content.push({ type: 'text', text: prompt });

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        system: system || '',
        messages: [{ role: 'user', content }],
      }),
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: 'Error al llamar a la IA', detail });
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).map((b) => b.text || '').filter(Boolean).join('\n').trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'Fallo interno al llamar a la IA' });
  }
}
