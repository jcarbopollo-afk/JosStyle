// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 11 — Optimización de imágenes.
//
// EL PROBLEMA REAL, y no era ninguno de los que uno se imagina.
// Las capas del fondo son CSS puro (baratas), el análisis va sobre una
// miniatura de 96 px (F5) y las propuestas son aritmética. Lo caro es otra
// cosa: **la fotografía se subía y se servía tal cual**. Una foto de iPhone son
// 4032×3024 y unos 4 MB, y se estaba usando como fondo de una pantalla de
// 390 px de ancho. Se descargaban megabytes para pintar algo que no puede
// enseñar ni una décima parte de esos píxeles.
//
// LA REGLA DEL APARTADO 2: calidad visual ≠ coste de rendimiento.
// Se guarda una versión OPTIMIZADA para usarla de fondo y una MINIATURA para
// las listas. La original no se toca —el apartado 3 lo pide— pero tampoco se
// descarga para nada que no la necesite.
//
// LA PARTE PURA ESTÁ SEPARADA A PROPÓSITO: `calcularDimensiones` decide los
// tamaños y se prueba con Node; `optimizarImagen` es la que toca el `<canvas>`
// y vive sola al final, igual que en `detectorColores.js`.
// ---------------------------------------------------------------------------

/* ===========================================================================
   TAMAÑOS (apartados 3 y 4)
   =========================================================================== */

// 1600 px de lado largo cubre un iPhone 15 Pro Max en vertical (1290 px) con
// margen para el zoom del editor, que llega al 300 %... a costa de nitidez, sí,
// pero un fondo desenfocado y con velo detrás de la interfaz no necesita más.
// Subir esto no mejora nada visible y multiplica lo que se descarga.
export const LADO_FONDO = 1600;

// La miniatura de las listas de presets. 240 px es el doble del tamaño al que
// se pinta, para que no se vea borrosa en pantallas de 2x y 3x.
export const LADO_MINIATURA = 240;

// JPEG al 82 %: por encima el archivo crece deprisa y la diferencia no se ve en
// una imagen que va detrás de la interfaz, desenfocada y con velo.
export const CALIDAD = 0.82;

/**
 * Qué tamaño debe tener la copia, conservando la proporción.
 *
 * Si la imagen ya es más pequeña que el objetivo **no se agranda**: escalar
 * hacia arriba no añade detalle, solo peso y una imagen más borrosa.
 */
export function calcularDimensiones(ancho, alto, ladoMaximo) {
  const a = Number(ancho) || 0;
  const h = Number(alto) || 0;
  if (a <= 0 || h <= 0) return { ancho: 0, alto: 0, redimensionar: false };

  const mayor = Math.max(a, h);
  if (mayor <= ladoMaximo) return { ancho: a, alto: h, redimensionar: false };

  const escala = ladoMaximo / mayor;
  return {
    ancho: Math.max(1, Math.round(a * escala)),
    alto: Math.max(1, Math.round(h * escala)),
    redimensionar: true,
  };
}

/**
 * Cuánto se ahorra, en texto, para poder decírselo a quien sube la foto.
 * Devuelve `null` cuando no hay ahorro que contar — no se inventa un "0 %".
 */
export function ahorroDe(bytesAntes, bytesDespues) {
  const antes = Number(bytesAntes) || 0;
  const despues = Number(bytesDespues) || 0;
  if (!antes || !despues || despues >= antes) return null;
  const pct = Math.round((1 - despues / antes) * 100);
  if (pct < 5) return null;   // por debajo de eso no merece ni mencionarse
  return { pct, texto: `${pct} % más ligera (${mb(antes)} → ${mb(despues)})` };
}

const mb = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

/* ===========================================================================
   CACHÉ DE URLs FIRMADAS (apartado 6)
   =========================================================================== */

// Las URLs firmadas de Supabase duran una hora. Sin caché, cada vez que se monta
// la pantalla de Ajustes se pide otra firma para la MISMA foto: una petición de
// red para obtener algo que ya se tenía y sigue siendo válido.
//
// Se guarda con margen: se considera caducada un minuto antes de tiempo, para no
// entregar una URL que expire justo mientras la imagen se está descargando.
const MARGEN_MS = 60 * 1000;
const cacheUrls = new Map();

export function urlEnCache(path) {
  const e = cacheUrls.get(path);
  if (!e) return null;
  if (Date.now() >= e.caduca - MARGEN_MS) {
    cacheUrls.delete(path);
    return null;
  }
  return e.url;
}

export function guardarUrl(path, url, duracionMs = 3600 * 1000) {
  if (!path || !url) return;
  cacheUrls.set(path, { url, caduca: Date.now() + duracionMs });
}

/** Para las pruebas y para cuando se borra una foto. */
export const olvidarUrl = (path) => (path ? cacheUrls.delete(path) : cacheUrls.clear());

/**
 * Pide una URL firmada usando la caché. `firmar` es la función real (de
 * `supabase.js`), que se pasa como parámetro para que este módulo no dependa de
 * la red y se pueda probar con Node.
 */
export async function urlFirmada(path, firmar) {
  if (!path) return null;
  const guardada = urlEnCache(path);
  if (guardada) return guardada;
  const url = await firmar(path);
  if (url) guardarUrl(path, url);
  return url;
}

/* ===========================================================================
   EL PUENTE CON EL NAVEGADOR (apartados 3, 4 y 8)
   =========================================================================== */

/**
 * Genera una copia optimizada de una imagen.
 *
 * Devuelve `{ file, ancho, alto, original }`. Si algo falla —un formato que el
 * navegador no sabe decodificar, un canvas bloqueado— **devuelve el archivo
 * original** en vez de lanzar: no poder optimizar una foto no debe impedir
 * usarla. Es peor una foto pesada que ninguna foto.
 */
export async function optimizarImagen(file, ladoMaximo = LADO_FONDO, calidad = CALIDAD) {
  if (typeof document === 'undefined' || !file) return { file, ancho: 0, alto: 0, original: true };
  let url;
  try {
    url = URL.createObjectURL(file);
    const img = await cargar(url);
    const dim = calcularDimensiones(img.naturalWidth, img.naturalHeight, ladoMaximo);

    // Si ya es pequeña, se deja tal cual: recomprimir una imagen ya ligera solo
    // le quita calidad sin ahorrar nada.
    if (!dim.redimensionar) {
      return { file, ancho: img.naturalWidth, alto: img.naturalHeight, original: true };
    }

    const canvas = document.createElement('canvas');
    canvas.width = dim.ancho;
    canvas.height = dim.alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, ancho: img.naturalWidth, alto: img.naturalHeight, original: true };
    // `imageSmoothingQuality: 'high'` es lo que evita el aliasing feo al reducir
    // mucho una foto de golpe.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, dim.ancho, dim.alto);

    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', calidad));
    if (!blob) return { file, ancho: img.naturalWidth, alto: img.naturalHeight, original: true };

    // Y la última red de seguridad: si la "optimizada" pesara más que la original
    // (pasa con imágenes ya muy comprimidas), se queda la original.
    if (blob.size >= file.size) {
      return { file, ancho: img.naturalWidth, alto: img.naturalHeight, original: true };
    }

    const nombre = `${(file.name || 'fondo').replace(/\.[^.]+$/, '')}.jpg`;
    return {
      file: new File([blob], nombre, { type: 'image/jpeg' }),
      ancho: dim.ancho,
      alto: dim.alto,
      original: false,
      // Las medidas de la foto REAL, no las de la copia: la proporción y la
      // orientación tienen que seguir siendo las de la imagen que se eligió.
      anchoOriginal: img.naturalWidth,
      altoOriginal: img.naturalHeight,
      pesoOriginal: file.size,
    };
  } catch {
    return { file, ancho: 0, alto: 0, original: true };
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

function cargar(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
