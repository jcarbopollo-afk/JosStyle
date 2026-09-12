// ---------------------------------------------------------------------------
// Ajustes · Perfil — la foto de perfil y el nombre con el que se le saluda.
//
// 🚨 POR QUÉ ESTA FOTO **NO** VA A UN BUCKET DE SUPABASE, que es lo que hacen
// las otras cuatro (Salud, Calistenia, Biblioteca, Armario y Fondos).
//
// Esos cinco buckets se crean ejecutando un bloque de `supabase/schema.sql` a
// mano en el editor de Supabase, y **dos de ellos llevan meses sin ejecutarse**:
// el de `armario` (AR F1) y el de `fondos` (FO F2). Está escrito en `CLAUDE.md`
// como recordatorio para Josué. Un sexto bucket significaría que el día que él
// entre en Ajustes → Perfil y elija una foto, **no se guarda nada** y le sale un
// error — que es exactamente lo que su encargo prohíbe ("la foto se guarda
// realmente", "sigue apareciendo después de recargar") y lo que la regla 8
// llama un control decorativo.
//
// Y un avatar es el único caso de foto de este proyecto que **cabe en el dato**:
// es cuadrado y diminuto por definición. A 256 px y JPEG al 80 % son unos 15-25
// KB, así que vive como `perfil.foto` dentro de la clave `perfil` de `app_data`
// — que ya es **una fila por usuario con RLS `auth.uid() = user_id`**, así que
// "vinculada al usuario" y "persistente" salen gratis, sin SQL nuevo.
//
// ⚠️ Eso NO convierte esto en el sistema de fotos general que la EH F28 y la
// EH F39 declararon inexistente. Una foto de progreso o una prenda **no** caben
// aquí, y por eso hay un tope duro: si la imagen no baja del límite, no se
// guarda y se dice. Nada de meter medio megabyte de base64 en el perfil.
//
// ⚠️ Y un aviso para no perder el rato: la auditoría de Estilo de hombre busca
// sus librerías **por el nombre**, y `perfil` la caza por el `perfilEstilo.js` de
// la EH F6. Es la **séptima** exclusión a mano de esa regla (tras
// `horarioEstructura`, `sonidoProduccion`, `rutinas`, `cierreNutricion`,
// `appsAprendizaje` y `cierreEstudios`). Está excluida en
// `scripts/test-auditoria-final.mjs`: no es un fallo, es la regla funcionando.
//
// LA PARTE PURA ESTÁ SEPARADA A PROPÓSITO, como en `imagenes.js` y en
// `detectorColores.js`: la geometría del recorte y las medidas se prueban con
// Node; `prepararFotoPerfil` es la única que toca el `<canvas>` y vive al final.
// ---------------------------------------------------------------------------

// 256 px es el doble del tamaño al que se pinta el círculo más grande (128 px en
// la cabecera de Perfil), para que no se vea borroso en pantallas de 2x y 3x del
// iPhone. Subirlo solo engorda la fila del perfil sin que se note.
export const LADO_AVATAR = 256;

// JPEG al 80 %: en una imagen de 256 px recortada a un círculo, la diferencia
// con 90 no se ve y el archivo crece un tercio.
export const CALIDAD_AVATAR = 0.8;

// 🚨 EL TOPE DURO. `saveData` sobrescribe la clave entera (regla 5), así que una
// foto gorda no solo pesa: viaja en cada guardado del perfil. 96 KB deja sitio
// de sobra para un JPEG de 256 px y corta en seco cualquier intento de meter una
// foto sin optimizar (una de iPhone en base64 pasa de 5 MB).
export const MAX_BYTES_FOTO = 96 * 1024;

// Lo que se acepta elegir desde el dispositivo. El `accept` del input usa esta
// misma lista, para no ofrecer un formato que después se rechaza.
export const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * La geometría del recorte cuadrado y centrado.
 *
 * ⚠️ `calcularDimensiones` de `imagenes.js` **no sirve aquí**: aquélla conserva
 * la proporción, que es lo correcto para un fondo de pantalla. Un avatar
 * circular necesita un cuadrado, y si se le mete una foto 4032×3024 escalada sin
 * recortar, el círculo se come los lados y deja la cara descentrada.
 *
 * Se recorta el cuadrado más grande que quepa, centrado, y se escala a `lado`.
 * Una imagen ya más pequeña **no se agranda**: no añade detalle, solo peso.
 */
export function recorteCuadrado(ancho, alto, lado = LADO_AVATAR) {
  const a = Number(ancho) || 0;
  const h = Number(alto) || 0;
  if (a <= 0 || h <= 0) return null;

  const corte = Math.min(a, h);
  const destino = Math.min(lado, corte);
  return {
    // De dónde se recorta en la imagen original.
    sx: Math.round((a - corte) / 2),
    sy: Math.round((h - corte) / 2),
    sLado: corte,
    // Y a qué tamaño se pinta.
    destino,
  };
}

/**
 * Cuántos bytes ocupa de verdad una imagen guardada como `data:` URI.
 *
 * ⚠️ No es `texto.length`: base64 son 4 caracteres por cada 3 bytes, y el
 * relleno `=` del final no cuenta. Medir mal por exceso rechazaría fotos
 * legítimas, y medir mal por defecto dejaría pasar las que el tope quiere parar.
 */
export function bytesDeDataUri(dataUri) {
  if (typeof dataUri !== 'string') return 0;
  const coma = dataUri.indexOf(',');
  if (coma < 0) return 0;
  const b64 = dataUri.slice(coma + 1);
  if (!b64) return 0;
  const relleno = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - relleno);
}

/**
 * ¿Esto que hay guardado es una foto que se puede pintar?
 *
 * Se comprueba la FORMA y el TAMAÑO, no solo que sea una cadena: un `data:` URI
 * truncado o de otro tipo se pintaría como un hueco roto. Es la lección de
 * `'25:99'` encaja con `/^\d{2}:\d{2}$/` — la forma sola no basta (E3 F8).
 */
export function esFotoValida(valor) {
  if (typeof valor !== 'string' || !valor) return false;
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(valor)) return false;
  const bytes = bytesDeDataUri(valor);
  return bytes > 0 && bytes <= MAX_BYTES_FOTO;
}

/**
 * El normalizador del campo nuevo (regla 5, y ya van muchas).
 *
 * `App.jsx` hace `{ ...DEFAULT_PERFIL, ...guardado }` al cargar, así que un
 * perfil de antes de esta fase recibe `foto: null` solo. Esto además **descarta
 * una foto corrupta o demasiado grande** en vez de dejar que la pantalla intente
 * pintarla: un dato que no se puede usar es peor que no tenerlo.
 *
 * ⚠️ Devuelve el perfil ENTERO. `saveData` sobrescribe: devolver solo la foto
 * se llevaría por delante el nombre, la altura y todo lo demás.
 */
export function normalizarPerfilFoto(perfil) {
  const p = perfil && typeof perfil === 'object' ? perfil : {};
  return { ...p, foto: esFotoValida(p.foto) ? p.foto : null };
}

/* ===========================================================================
   EL NOMBRE CON EL QUE SE LE SALUDA
   =========================================================================== */

/**
 * 🚨 LA ÚNICA RESPUESTA A "¿CÓMO SE LE LLAMA?", como `tallaDe()` (EH F5) y
 * `frecuenciaDeCorte()` (EH F11).
 *
 * 🐛 Y nace de un fallo real: `nombreMostrado` existía en `DEFAULT_PERFIL` desde
 * la Fase A2, Ajustes lo ofrecía con el marcador *"Se usará el nombre"*… y **no
 * lo leía nadie**. Escribirlo no cambiaba nada en ninguna pantalla: el saludo de
 * Hoy hacía `perfil.nombre.split(' ')[0]` por su cuenta. Un campo que el usuario
 * rellena y que no hace nada es la regla 8 por la puerta de atrás — van varios
 * en este proyecto (el `icono` del armario en la E3 F3, el `ref` de `Textarea`
 * en la E3 F20).
 *
 * El orden es el que promete la propia pantalla: manda el nombre mostrado, y si
 * no lo ha puesto, el primer nombre. Devuelve **`null` si no hay ninguno**, no
 * una cadena vacía: quien salude tiene que poder distinguir "no tiene nombre" de
 * "se llama ''" y no escribir *"Buenos días, "* con la coma colgando.
 */
export function nombreParaSaludo(perfil) {
  const p = perfil && typeof perfil === 'object' ? perfil : {};
  const mostrado = typeof p.nombreMostrado === 'string' ? p.nombreMostrado.trim() : '';
  if (mostrado) return mostrado;
  const nombre = typeof p.nombre === 'string' ? p.nombre.trim() : '';
  if (nombre) return nombre.split(/\s+/)[0];
  return null;
}

/**
 * El saludo entero, ya montado, para que ninguna pantalla vuelva a pegar la coma
 * a mano. Sin nombre devuelve solo el saludo — nunca *"Buenos días, "*.
 */
export function saludoCompleto(saludo, perfil) {
  const nombre = nombreParaSaludo(perfil);
  return nombre ? `${saludo}, ${nombre}` : saludo;
}

/**
 * Las iniciales para el círculo cuando todavía no hay foto.
 *
 * ⚠️ Sin foto **no se pinta un avatar genérico de desconocido**: se pintan sus
 * iniciales, que es lo que hace que el hueco parezca suyo y no un error. Y si
 * tampoco hay nombre, `null` — y entonces la pantalla dibuja el icono de
 * persona, que es lo único honesto que queda.
 */
export function inicialesDe(perfil) {
  const p = perfil && typeof perfil === 'object' ? perfil : {};
  const nombre = typeof p.nombre === 'string' ? p.nombre.trim() : '';
  const apellidos = typeof p.apellidos === 'string' ? p.apellidos.trim() : '';
  const letras = [];
  if (nombre) letras.push(nombre[0]);
  if (apellidos) letras.push(apellidos[0]);
  // Sin apellidos, con la inicial del nombre basta: "JJ" inventado a partir de
  // "Josué" sería una letra que él no ha escrito.
  if (!letras.length) return null;
  return letras.join('').toUpperCase();
}

/* ===========================================================================
   LOS MOTIVOS, DECLARADOS (regla 8 y la lección de la E3 F46)
   =========================================================================== */

export const DONDE_VIVE = {
  clave: 'perfil',
  campo: 'foto',
  formato: 'data: URI (JPEG base64)',
  porque: 'app_data ya es una fila por usuario con RLS; un bucket nuevo exigiría un SQL que Josué todavía no ha ejecutado en los dos anteriores.',
};

export const NO_ES_UN_SISTEMA_DE_FOTOS = [
  { que: 'Fotos de progreso de Salud', donde: 'bucket `progreso`', porque: 'Son fotos completas y muchas: no caben en el dato.' },
  { que: 'Fotos de prenda del Armario', donde: 'bucket `armario`', porque: 'Igual, y además son decenas por usuario.' },
  { que: 'Fondos de pantalla', donde: 'bucket `fondos`', porque: 'Necesitan 1600 px de lado: dos órdenes de magnitud más que un avatar.' },
];

/* ===========================================================================
   LA PARTE QUE TOCA EL CANVAS (solo navegador)
   =========================================================================== */

const cargar = (url) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = rej;
  img.src = url;
});

/**
 * Del archivo que elige en el iPhone al `data:` URI cuadrado que se guarda.
 *
 * Devuelve `{ ok: true, foto }` o `{ ok: false, motivo }` — **nunca lanza**, y
 * el motivo es una frase que se puede enseñar tal cual: un error que no dice qué
 * corregir es el que prohíbe la EH F62.
 */
export async function prepararFotoPerfil(file, { lado = LADO_AVATAR, calidad = CALIDAD_AVATAR } = {}) {
  if (!file) return { ok: false, motivo: 'No se ha elegido ninguna imagen.' };
  if (typeof document === 'undefined') return { ok: false, motivo: 'Aquí no se puede preparar la imagen.' };
  if (file.type && !TIPOS_ACEPTADOS.includes(file.type)) {
    return { ok: false, motivo: 'Ese archivo no es una imagen. Elige una foto.' };
  }

  let url;
  try {
    url = URL.createObjectURL(file);
    const img = await cargar(url);
    const corte = recorteCuadrado(img.naturalWidth, img.naturalHeight, lado);
    if (!corte) return { ok: false, motivo: 'No se ha podido leer esa imagen. Prueba con otra.' };

    const canvas = document.createElement('canvas');
    canvas.width = corte.destino;
    canvas.height = corte.destino;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, motivo: 'No se ha podido preparar la imagen en este navegador.' };
    // Lo mismo que hace `imagenes.js`: sin esto, reducir una foto de golpe deja
    // los bordes dentados.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, corte.sx, corte.sy, corte.sLado, corte.sLado, 0, 0, corte.destino, corte.destino);

    const foto = canvas.toDataURL('image/jpeg', calidad);
    if (!esFotoValida(foto)) {
      // Se comprueba el resultado, no la intención: si aun recortada no baja del
      // tope, se dice en vez de guardar algo que engorda el perfil entero.
      return { ok: false, motivo: 'Esa imagen es demasiado pesada incluso reducida. Prueba con otra.' };
    }
    return { ok: true, foto, bytes: bytesDeDataUri(foto) };
  } catch {
    return { ok: false, motivo: 'No se ha podido leer esa imagen. Prueba con otra.' };
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}
