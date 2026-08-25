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

  // El modelo se lee de una variable de entorno para que cambiarlo no exija tocar código ni
  // volver a desplegar desde el editor: basta con cambiarlo en Vercel. El valor por defecto es
  // un modelo vigente; el anterior ('claude-sonnet-4-6') había quedado obsoleto y habría hecho
  // fallar TODAS las llamadas de IA en cuanto se activara la clave.
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

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
        model,
        max_tokens: 700,
        system: system || '',
        messages: [{ role: 'user', content }],
      }),
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      // Un modelo inexistente o retirado devuelve 404. Sin este caso especial, el usuario solo
      // vería "Error al llamar a la IA" y no tendría forma de saber que lo único que falla es el
      // nombre del modelo — que se arregla cambiando una variable de entorno, sin tocar código.
      if (anthropicRes.status === 404) {
        return res.status(404).json({
          error: `El modelo de IA configurado ("${model}") no está disponible. Cámbialo en la variable de entorno ANTHROPIC_MODEL del proyecto en Vercel.`,
          detail,
        });
      }
      return res.status(anthropicRes.status).json({ error: 'Error al llamar a la IA', detail });
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).map((b) => b.text || '').filter(Boolean).join('\n').trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'Fallo interno al llamar a la IA' });
  }
}
