/* ============================================================================
   ✨ LA DISPONIBILIDAD DE LA IA (P3, 2026-10-18)

   Josué: *"Eliminar los mensajes técnicos visibles para el usuario, como los que
   mencionan API Key… y mostrar una experiencia profesional que comunique que la
   funcionalidad llegará próximamente."*

   Lo que pasaba: `/api/ask-ai` contesta con una frase pensada para quien
   despliega («Añade ANTHROPIC_API_KEY en las variables de entorno…») y la
   pantalla la pintaba tal cual (`e.message`), en el panel de la IA de seis
   módulos y en «Explícame un concepto».

   La regla (apartado 4), en un sitio:
   · **No habilitada todavía** (el servidor sin su clave o sin Supabase, o la
     función sin desplegar) → `pendiente`: «Estamos preparando algo nuevo.» Es lo
     que vive Josué hoy si la clave no está puesta. ⚠️ No se inventa una fecha.
   · **Operativa** → igual que siempre (nada de esto se toca).
   · **Un fallo de verdad** (el modelo configurado no existe, el servicio falla,
     sin conexión, la sesión, el límite) → `error`, con una frase que se entiende
     y SIN ocultarlo tras un «próximamente» (apartado 5).
   · Lo técnico (qué variable falta, el código, el detalle) va a la consola con
     `console.warn`, nunca a la pantalla.

   Las claves, las variables y el servidor no cambian (apartado 5): el servidor
   solo añade un `codigo` a lo que ya contestaba y separa la frase para el
   usuario (`error`) de la técnica (`tecnico`).
   =========================================================================== */

export const TEXTOS_PROXIMAMENTE = Object.freeze({
  titulo: 'Estamos preparando algo nuevo.',
  texto: 'Esta función de inteligencia artificial todavía no está disponible. Estamos trabajando para ofrecerte una experiencia útil, inteligente y a la altura de Jos Style. Estará disponible próximamente.',
  volver: 'Entendido',
});

/** Cada respuesta del servidor, por su código: si es «todavía no» o un fallo, y qué se le dice. */
export const CODIGOS_IA = Object.freeze({
  ia_no_habilitada: { tipo: 'pendiente', texto: TEXTOS_PROXIMAMENTE.texto },
  modelo_no_disponible: { tipo: 'error', texto: 'La inteligencia artificial no está disponible ahora mismo. Inténtalo más tarde.' },
  error_servicio: { tipo: 'error', texto: 'No he podido conectar con la inteligencia artificial ahora mismo. Inténtalo en un momento.' },
  sin_conexion: { tipo: 'error', texto: 'Sin conexión: la inteligencia artificial necesita internet. Vuelve a intentarlo cuando tengas cobertura.' },
  sin_sesion: { tipo: 'error', texto: 'Inicia sesión para usar la inteligencia artificial.' },
  sesion_no_verificada: { tipo: 'error', texto: 'No se ha podido comprobar tu sesión ahora mismo. Inténtalo en un minuto.' },
  limite: { tipo: 'error', texto: 'Has usado la inteligencia artificial muchas veces seguidas. Espera un rato y vuelve a intentarlo.' },
  peticion_no_valida: { tipo: 'error', texto: 'Esta petición es demasiado grande para la inteligencia artificial. Prueba con menos datos.' },
});

/* Lo que no se puede enseñar nunca, por si un texto se colara: nombres de
   variables, de claves y de servicios internos. */
export const PALABRAS_TECNICAS_IA = /api[\s_-]?key|anthropic|variables? de entorno|vercel|process\.env|supabase|\bjson\b|\bundefined\b|\bnull\b|status|stack|token/i;

/**
 * Lo que contestó el servidor (o la red), traducido a un error con su código.
 * @param status   el código HTTP, o `null` si ni siquiera hubo respuesta
 * @param data     el cuerpo, si era JSON
 */
export function clasificarRespuestaIA(status, data) {
  const d = data && typeof data === 'object' ? data : null;
  let codigo = d && typeof d.codigo === 'string' && CODIGOS_IA[d.codigo] ? d.codigo : null;
  if (!codigo) {
    if (status === null || status === undefined) codigo = 'sin_conexion';
    // Sin cuerpo JSON y 404: la función no está desplegada (p. ej. en desarrollo) → todavía no.
    else if (!d && status === 404) codigo = 'ia_no_habilitada';
    else if (status === 401) codigo = 'sin_sesion';
    else if (status === 429) codigo = 'limite';
    else if (status === 400 || status === 413) codigo = 'peticion_no_valida';
    else codigo = 'error_servicio';
  }
  const tecnico = [d && d.tecnico, d && d.error, d && d.detail].filter(Boolean).join(' · ') || `HTTP ${status}`;
  return { codigo, tipo: CODIGOS_IA[codigo].tipo, texto: CODIGOS_IA[codigo].texto, tecnico };
}

/** Un `Error` que lleva su código: lo lanza `ai.js` y lo lee cada pantalla. */
export function errorDeIA(clasificado) {
  const e = new Error(clasificado.texto);
  e.codigo = clasificado.codigo;
  e.tipo = clasificado.tipo;
  e.tecnico = clasificado.tecnico;
  return e;
}

/**
 * Lo que una pantalla hace con un error de la IA: si es «todavía no», el estado de
 * próxima disponibilidad; si no, una frase que se entiende. Nunca el texto técnico.
 * @param respaldo  la frase de la pantalla para un fallo que no es de la IA (un JSON
 *                  mal formado, por ejemplo), que ya existía.
 */
export function estadoDeErrorIA(e, respaldo = CODIGOS_IA.error_servicio.texto) {
  const tipo = e && e.tipo;
  if (tipo === 'pendiente') return { pendiente: true, texto: TEXTOS_PROXIMAMENTE.texto };
  if (tipo === 'error' && e.codigo && CODIGOS_IA[e.codigo]) return { pendiente: false, texto: CODIGOS_IA[e.codigo].texto };
  return { pendiente: false, texto: respaldo };
}

/** Lo técnico, a la consola (para diagnosticar), nunca a la pantalla. */
export function registrarErrorIA(e, donde = 'IA') {
  try {
    if (e && (e.codigo || e.tecnico)) console.warn(`[${donde}] ${e.codigo || 'error'}: ${e.tecnico || ''}`);
    else if (e) console.warn(`[${donde}]`, e && e.message ? e.message : e);
  } catch { /* registrar nunca tumba la pantalla */ }
}
