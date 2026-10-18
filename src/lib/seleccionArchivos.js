/* ============================================================================
   📎 SELECCIÓN DE FOTOS Y ARCHIVOS — la regla para toda la aplicación (P1, 2026-10-18)

   Josué: *"si cualquier apartado permite añadir, adjuntar, subir o seleccionar una
   imagen o un archivo, el usuario debe disponer de las opciones compatibles con su
   dispositivo para obtenerlo"*. Esto es la parte que decide, sin pintar nada:
   qué opciones se ofrecen, con qué `accept` y `capture`, y si un archivo vale.
   La pieza que lo pinta es `src/components/selectorArchivos.jsx`.

   🚨 **JOSSTYLE ES UNA WEB: LAS OPCIONES SON LAS DEL NAVEGADOR, NO UN MENÚ INVENTADO.**
     · iPhone y iPad (Safari): un `<input type="file" accept="image/*">` **sin**
       `capture` abre la hoja del propio iOS —Fototeca, Hacer foto, Elegir
       archivo—; **con** `capture` va directo a la cámara. Así que se ofrecen dos:
       «Hacer una foto» y «Fototeca o archivos». Una tercera abriría la misma hoja.
     · Android (Chrome): sin `capture` y con `image/*` abre la galería (el
       selector de fotos del sistema); con extensiones en vez de `image/*`, el
       gestor de archivos; con `capture`, la cámara. Las tres son distintas.
     · Ordenador: `capture` no hace nada, así que «Hacer una foto» va por la cámara
       del navegador (`getUserMedia`) **solo si existe y la página es segura**; si
       no, no se ofrece. La galería y los archivos son el mismo diálogo: uno.
   ⚠️ Un documento **nunca** ofrece la cámara (apartado 2).

   ⚠️ **ELEGIR NO ES GUARDAR** (apartado 6): esto solo dice si el archivo vale.
   Subirlo y decir si llegó sigue siendo de cada módulo.
   =========================================================================== */

/** Las clases de contenido. `camara` dice qué hace la cámara: una foto, un vídeo o nada. */
export const CLASES_DE_ARCHIVO = Object.freeze({
  imagen: { accept: 'image/*', camara: 'foto', extensiones: ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.gif'] },
  video: { accept: 'video/*', camara: 'video', extensiones: ['.mp4', '.mov', '.m4v', '.webm'] },
  documento: { accept: '', camara: null, extensiones: [] },
});

export const MB = 1024 * 1024;

/** Una foto o un PDF (el adjunto de la IA). ⚠️ Vive aquí y no escrito en `ui.jsx`: el
 *  comodín de imagen abre un comentario para los limpiadores de comentarios de las
 *  pruebas, que se comían el código que venía detrás. */
export const ACEPTA_IMAGEN_O_PDF = 'image/*,application/pdf';

/* ── La plataforma, de lo que dice el navegador de verdad ───────────────────── */
export function detectarPlataforma(entorno = (typeof window !== 'undefined' ? window : null)) {
  const nav = entorno && entorno.navigator ? entorno.navigator : {};
  const ua = String(nav.userAgent || '');
  const tactil = Number(nav.maxTouchPoints || 0) > 0
    || Boolean(entorno && typeof entorno.matchMedia === 'function' && entorno.matchMedia('(pointer: coarse)').matches);
  // iPadOS 13+ se presenta como un Mac: lo delata la pantalla táctil.
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && Number(nav.maxTouchPoints || 0) > 1);
  const android = /Android/i.test(ua);
  const segura = Boolean(entorno && entorno.isSecureContext);
  const camaraWeb = segura && Boolean(nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function');
  const tipo = ios ? 'ios' : android ? 'android' : (tactil ? 'tactil' : 'ordenador');
  return { tipo, ios, android, tactil, camaraWeb };
}

const sinComodin = (accept) => String(accept || '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Las opciones que tienen sentido para este contenido en este dispositivo.
 * @param clase      'imagen' | 'video' | 'documento'
 * @param accept     lo que acepta la función concreta (por defecto, el de su clase)
 * @param multiple   si se pueden elegir varios
 * @returns [{ id, etiqueta, modo: 'input' | 'camaraWeb', accept, capture }]
 */
export function opcionesDeSeleccion({ clase = 'imagen', accept = null, plataforma = detectarPlataforma() } = {}) {
  const c = CLASES_DE_ARCHIVO[clase] || CLASES_DE_ARCHIVO.documento;
  const acepta = accept || c.accept;
  const p = plataforma || {};
  const opciones = [];
  const esFoto = c.camara === 'foto';
  const esVideo = c.camara === 'video';

  if (c.camara) {
    if (p.ios || p.android) {
      opciones.push({ id: 'camara', etiqueta: esFoto ? 'Hacer una foto' : 'Grabar un vídeo', modo: 'input', accept: esFoto ? 'image/*' : 'video/*', capture: 'environment' });
    } else if (p.camaraWeb && esFoto) {
      // ⚠️ La cámara del ordenador solo para fotos: grabar vídeo en el navegador es otra función.
      opciones.push({ id: 'camara', etiqueta: 'Hacer una foto', modo: 'camaraWeb', accept: 'image/jpeg', capture: null });
    }
  }

  if (clase === 'documento' || !c.camara) {
    opciones.push({ id: 'archivos', etiqueta: 'Seleccionar archivo', modo: 'input', accept: acepta, capture: null });
    return opciones;
  }

  // Lo que acepta aparte de su clase (un PDF junto a las fotos): la galería no lo
  // enseña, así que esa opción se queda con lo suyo y el resto va a «Archivos».
  const grupo = esFoto ? 'image/' : 'video/';
  const reglas = sinComodin(acepta);
  const soloSuClase = reglas.filter((r) => r.toLowerCase().startsWith(grupo));
  const mezcla = reglas.some((r) => !r.toLowerCase().startsWith(grupo) && !c.extensiones.includes(r.toLowerCase()));

  if (p.ios) {
    // La hoja del propio iOS ya trae Fototeca, Hacer foto y Elegir archivo.
    opciones.push({ id: 'fototeca', etiqueta: esFoto ? 'Fototeca o archivos' : 'Vídeos o archivos', modo: 'input', accept: acepta, capture: null });
  } else if (p.android) {
    opciones.push({ id: 'fototeca', etiqueta: esFoto ? 'Galería' : 'Vídeos de la galería', modo: 'input', accept: soloSuClase.join(',') || c.accept, capture: null });
    // Con extensiones y sin `image/*`, Android abre su gestor de archivos.
    const porExtension = [...c.extensiones, ...sinComodin(acepta).filter((x) => !x.endsWith('/*'))];
    opciones.push({ id: 'archivos', etiqueta: 'Archivos', modo: 'input', accept: [...new Set(porExtension)].join(','), capture: null });
  } else {
    opciones.push({ id: 'archivos', etiqueta: mezcla ? 'Elegir un archivo' : (esFoto ? 'Elegir una imagen' : 'Elegir un vídeo'), modo: 'input', accept: acepta, capture: null });
  }
  return opciones;
}

/* ── Validar lo elegido ─────────────────────────────────────────────────────── */
const extensionDe = (nombre) => {
  const m = /\.[^.]+$/.exec(String(nombre || '').toLowerCase());
  return m ? m[0] : '';
};

/** ¿Este archivo es de lo que acepta la función? (MIME, comodín `image/*` o extensión) */
export function encajaConAccept(archivo, accept) {
  const reglas = sinComodin(accept);
  if (!reglas.length) return true;
  const tipo = String((archivo && archivo.type) || '').toLowerCase();
  const ext = extensionDe(archivo && archivo.name);
  return reglas.some((r) => {
    const regla = r.toLowerCase();
    if (regla.startsWith('.')) return ext === regla;
    if (regla.endsWith('/*')) {
      const grupo = regla.slice(0, -1);
      if (tipo) return tipo.startsWith(grupo);
      // Sin tipo (pasa con HEIC en algunos navegadores): por la extensión de su clase.
      const clase = grupo === 'image/' ? 'imagen' : grupo === 'video/' ? 'video' : null;
      return clase ? CLASES_DE_ARCHIVO[clase].extensiones.includes(ext) : false;
    }
    if (tipo) return tipo === regla;
    // Sin tipo y con una regla concreta («image/heic»): por su extensión; sin ninguna de
    // las dos, no se sabe, y decide la validación del módulo.
    if (!ext) return true;
    const sub = regla.split('/')[1] || '';
    return (sub === 'jpeg' ? ['.jpg', '.jpeg'] : [`.${sub}`]).includes(ext);
  });
}

export function textoDeTamano(bytes) {
  const b = Number(bytes) || 0;
  if (b >= MB) return `${(b / MB).toFixed(b >= 10 * MB ? 0 : 1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(b / 1024))} KB`;
}

/**
 * Lo que se queda y lo que no, con su motivo en palabras.
 * @returns { validos: File[], errores: string[] }
 */
export function validarArchivos(archivos, { accept = '', maxBytes = null, maxArchivos = null, nombreTipo = 'archivo' } = {}) {
  const lista = [...(archivos || [])].filter(Boolean);
  const validos = [];
  const errores = [];
  for (const a of lista) {
    const nombre = a.name || nombreTipo;
    if (!encajaConAccept(a, accept)) { errores.push(`«${nombre}» no es un formato que se pueda usar aquí.`); continue; }
    if (!Number(a.size)) { errores.push(`«${nombre}» está vacío o no se ha podido leer.`); continue; }
    if (maxBytes && a.size > maxBytes) { errores.push(`«${nombre}» pesa ${textoDeTamano(a.size)}: el máximo aquí es ${textoDeTamano(maxBytes)}.`); continue; }
    if (maxArchivos && validos.length >= maxArchivos) { errores.push(`Como mucho ${maxArchivos} a la vez.`); break; }
    validos.push(a);
  }
  return { validos, errores };
}

/* ── La cámara del navegador: qué decir cuando no se puede ─────────────────── */
export function textoDeErrorDeCamara(error) {
  const nombre = (error && error.name) || '';
  if (nombre === 'NotAllowedError' || nombre === 'SecurityError') return 'No hay permiso para usar la cámara. Puedes dárselo en los ajustes del navegador, o elegir un archivo.';
  if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') return 'No se ha encontrado ninguna cámara en este dispositivo. Puedes elegir un archivo.';
  if (nombre === 'NotReadableError') return 'La cámara la está usando otra aplicación. Ciérrala y vuelve a intentarlo, o elige un archivo.';
  return 'No se ha podido abrir la cámara. Puedes elegir un archivo.';
}

/** Para los manejadores de siempre, que reciben el evento de un `<input>`: el mismo
 *  `{ target: { files } }`, con lo ya validado. Así cada módulo conserva su validación. */
export const eventoDeArchivos = (files) => ({ target: { files: [...(files || [])], value: '' } });
