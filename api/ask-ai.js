// Función serverless de Vercel. Vive en el servidor, nunca en el navegador,
// así que es el único sitio donde puede existir la clave de Anthropic.

/* 🚨 **Quién puede llamar aquí** (EH F63 → cerrado; decisión de Josué, 4 de
   septiembre de 2026).

   Hasta hoy este endpoint no preguntaba quién llamaba. No era una fuga de datos
   —desde aquí no se lee nada de nadie— era una **factura**: cualquiera que
   supiera la URL podía llamarlo y gastar el saldo de Anthropic de Josué.

   Se cierra comprobando contra Supabase el token de la sesión que manda el
   navegador. ⚠️ Se comprueba **aquí**, no en el cliente: `src/lib/ai.js` manda la
   cabecera, pero quien decide si vale es el servidor. Un cliente que decide si
   hace falta autenticarse no autentica nada.

   ⚠️ Este endpoint lo usan seis módulos (Nutrición, Calistenia, Biblioteca,
   Estilo de hombre, Hoy y Estadísticas). Si esto falla, la IA se cae en todos a
   la vez — por eso lo que falla por configuración devuelve 503 **diciendo qué
   falta**, y no un 401 mudo que parecería un problema de la cuenta.
   🔓 P3 (2026-10-18) — y cada respuesta lleva su `codigo`: lo que falta se dice en
   `tecnico` (y en el registro del servidor), y `error` es una frase para el
   usuario. La pantalla decide con el código (`src/lib/disponibilidadIA.js`). */
const LIMITE_POR_USUARIO = 30; // peticiones
const VENTANA_MS = 60 * 60 * 1000; // por hora

/* ⚠️ Honestidad sobre este freno: vive en memoria, y Vercel levanta y tira
   instancias. Alguien decidido a saltárselo lo consigue repartiendo llamadas.
   Para un límite de verdad haría falta una tabla en Supabase —infraestructura
   nueva, no una ampliación—, y queda escrito como pendiente. Lo que esto sí para
   es lo que de verdad puede pasar: un bucle por un fallo de la app, o una
   pestaña reintentando sola toda la noche. */
const usos = new Map();

function pasaElLimite(userId) {
  const ahora = Date.now();
  if (usos.size > 500) usos.clear(); // techo de memoria, no de seguridad
  const previo = usos.get(userId);
  if (!previo || ahora - previo.desde > VENTANA_MS) {
    usos.set(userId, { desde: ahora, n: 1 });
    return true;
  }
  previo.n += 1;
  return previo.n <= LIMITE_POR_USUARIO;
}

// Le pregunta a Supabase de quién es este token. Si no vale, no dice de quién es.
async function quienEs(req) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { fallo: 'sin-config' };

  const cabecera = req.headers.authorization || req.headers.Authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : '';
  if (!token) return { fallo: 'sin-sesion' };

  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anon },
    });
    if (!r.ok) return { fallo: 'sin-sesion' };
    const u = await r.json();
    return u && u.id ? { id: u.id } : { fallo: 'sin-sesion' };
  } catch {
    /* ⚠️ Si Supabase no contesta, NO se deja pasar. Un fallo de red no puede ser
       la puerta de atrás: es justo lo que buscaría quien quisiera saltárselo. */
    return { fallo: 'sin-verificar' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ codigo: 'peticion_no_valida', error: 'Método no permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    /* 🔓 P3 — sin su clave, la IA todavía no está habilitada: la pantalla enseña
       «Estamos preparando algo nuevo.». Lo que falta va en `tecnico` (y al registro
       del servidor), nunca en la frase que ve el usuario. */
    console.warn('[ask-ai] ia_no_habilitada: falta ANTHROPIC_API_KEY');
    return res.status(503).json({
      codigo: 'ia_no_habilitada',
      error: 'La inteligencia artificial todavía no está disponible.',
      tecnico: 'IA no configurada todavía. Añade ANTHROPIC_API_KEY en las variables de entorno del proyecto en Vercel.',
    });
  }

  const quien = await quienEs(req);
  if (quien.fallo === 'sin-config') {
    console.warn('[ask-ai] ia_no_habilitada: faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
    return res.status(503).json({
      codigo: 'ia_no_habilitada',
      error: 'La inteligencia artificial todavía no está disponible.',
      tecnico: 'IA no configurada del todo: faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en las variables de entorno del proyecto en Vercel.',
    });
  }
  if (quien.fallo === 'sin-verificar') {
    return res.status(503).json({ codigo: 'sesion_no_verificada', error: 'No se ha podido comprobar tu sesión ahora mismo. Inténtalo en un minuto.' });
  }
  if (quien.fallo) {
    return res.status(401).json({ codigo: 'sin_sesion', error: 'Inicia sesión para usar la IA.' });
  }
  if (!pasaElLimite(quien.id)) {
    return res.status(429).json({ codigo: 'limite', error: 'Has usado la IA muchas veces seguidas. Espera un rato y vuelve a intentarlo.' });
  }

  // El modelo se lee de una variable de entorno para que cambiarlo no exija tocar código ni
  // volver a desplegar desde el editor: basta con cambiarlo en Vercel. El valor por defecto es
  // un modelo vigente; el anterior ('claude-sonnet-4-6') había quedado obsoleto y habría hecho
  // fallar TODAS las llamadas de IA en cuanto se activara la clave.
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const { system, prompt, image, images } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ codigo: 'peticion_no_valida', error: 'Falta el prompt' });
  }

  /* 🚨 ⚠️ **EH F63, apartados 14 y 15 — no confiar en lo que manda el cliente.**
     Esta función llama a un servicio **que cuesta dinero**, y hasta aquí aceptaba
     un texto de cualquier tamaño y cualquier número de imágenes.

     Los límites son holgados para lo que la aplicación manda de verdad —el
     contexto más largo no llega a 20 000 caracteres, y la Fase 5 manda ocho
     fotogramas—, así que **no cambian nada** para Josué y sí ponen un techo. */
  const LIMITE_PROMPT = 40000;
  const LIMITE_SYSTEM = 20000;
  const LIMITE_IMAGENES = 10;
  if (typeof prompt !== 'string' || prompt.length > LIMITE_PROMPT) {
    return res.status(400).json({ codigo: 'peticion_no_valida', error: 'La petición es demasiado larga.' });
  }
  if (system && (typeof system !== 'string' || system.length > LIMITE_SYSTEM)) {
    return res.status(400).json({ codigo: 'peticion_no_valida', error: 'La petición es demasiado larga.' });
  }
  if (Array.isArray(images) && images.length > LIMITE_IMAGENES) {
    return res.status(400).json({ codigo: 'peticion_no_valida', error: 'Demasiadas imágenes en una sola petición.' });
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
        /* 🔓 P3 — es un fallo de configuración DE VERDAD, no un «próximamente»: la
           pantalla dice que no está disponible ahora y lo técnico va en `tecnico`. */
        console.error(`[ask-ai] modelo_no_disponible: ${model}`);
        return res.status(404).json({
          codigo: 'modelo_no_disponible',
          error: 'La inteligencia artificial no está disponible ahora mismo.',
          tecnico: `El modelo de IA configurado ("${model}") no está disponible. Cámbialo en la variable de entorno ANTHROPIC_MODEL del proyecto en Vercel.`,
          detail,
        });
      }
      console.error(`[ask-ai] error_servicio: ${anthropicRes.status}`);
      return res.status(anthropicRes.status).json({ codigo: 'error_servicio', error: 'Error al llamar a la IA', detail });
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).map((b) => b.text || '').filter(Boolean).join('\n').trim();
    return res.status(200).json({ text });
  } catch (e) {
    console.error('[ask-ai] error_servicio: fallo interno', e && e.message);
    return res.status(500).json({ codigo: 'error_servicio', error: 'Fallo interno al llamar a la IA' });
  }
}
