// Fase 5 — Calistenia: la IA "analiza vídeo" leyendo unos pocos fotogramas clave, no el vídeo
// fluido en tiempo real como lo vería un entrenador en persona (limitación aceptada desde el
// Prompt Maestro original). Esto pasa entero en el navegador, con <video> + <canvas>; no hace
// falta subir el vídeo a ningún sitio para extraer los fotogramas.
//
// `src` puede ser una URL de objeto local (`URL.createObjectURL(file)`) o una URL remota firmada
// de Supabase Storage. Para una URL remota hace falta `crossOrigin: true` para poder leer los
// píxeles del vídeo con canvas sin que el navegador los bloquee por seguridad (CORS).
export async function extractFramesFromSrc(src, count = 4, crossOrigin = false) {
  const video = document.createElement('video');
  if (crossOrigin) video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.src = src;

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('No se ha podido leer el vídeo.'));
  });

  const width = 480;
  const ratio = (video.videoHeight || 3) / (video.videoWidth || 4);
  const height = Math.round(width * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const duration = video.duration || 0;
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = duration > 0 ? (duration * (i + 0.5)) / count : 0;
    await new Promise((resolve) => {
      const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = t;
    });
    try {
      ctx.drawImage(video, 0, 0, width, height);
      frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]); // solo el base64, sin el prefijo data:
    } catch (e) {
      throw new Error('El navegador ha bloqueado leer los fotogramas de este vídeo (posible restricción CORS).');
    }
  }
  return frames;
}
