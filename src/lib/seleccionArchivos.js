/* ============================================================================
   📎 SELECCIÓN DE FOTOS Y ARCHIVOS — la regla para toda la aplicación (P1, 2026-10-18)

   Josué: *"si cualquier apartado permite añadir, adjuntar, subir o seleccionar una
   imagen o un archivo, el usuario debe disponer de las opciones compatibles con su
   dispositivo para obtenerlo"*. Esto es la parte que decide, sin pintar nada:
   qué se abre, con qué `accept`, y si un archivo vale.
   La pieza que lo pinta es `src/components/selectorArchivos.jsx`.

   🚨 **UN SOLO TOQUE: EL SELECTOR DEL SISTEMA, SIN UN MENÚ DELANTE** (2026-10-18,
   «Simplificar selección de fotos»). La primera versión ponía una hoja propia con
   «Hacer una foto» y «Fototeca o archivos», y Josué la quitó: *"es redundante,
   porque el selector nativo ya ofrece la opción de cámara"*. Así que se abre UN
   `<input type="file">` **sin `capture`** y el navegador enseña lo suyo:
     · iPhone y iPad (Safari): la hoja del propio iOS —Fototeca, Hacer foto,
       Elegir archivo—.
     · Android (Chrome): su selector, con la cámara, la galería y los archivos.
     · Ordenador: el diálogo de archivos, directamente (la cámara del navegador
       sería un paso más que nadie ha pedido).
   🚨 **Nunca `capture`**: obliga a la cámara y en el iPhone quita la fototeca.
   ⚠️ Un documento **nunca** ofrece la cámara: su `accept` no es de imagen.

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

const sinComodin = (accept) => String(accept || '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Lo que se abre al tocar: siempre UNA opción, el selector del sistema.
 * @param clase   'imagen' | 'video' | 'documento'
 * @param accept  lo que acepta la función concreta (por defecto, el de su clase)
 * @returns [{ id: 'archivos', etiqueta, accept }]
 */
export function opcionesDeSeleccion({ clase = 'imagen', accept = null } = {}) {
  const c = CLASES_DE_ARCHIVO[clase] || CLASES_DE_ARCHIVO.documento;
  const acepta = accept || c.accept;
  const grupo = c.camara === 'foto' ? 'image/' : c.camara === 'video' ? 'video/' : null;
  const mezcla = !grupo || sinComodin(acepta).some((r) => !r.toLowerCase().startsWith(grupo) && !c.extensiones.includes(r.toLowerCase()));
  const etiqueta = mezcla ? 'Seleccionar archivo' : (grupo === 'image/' ? 'Elegir o hacer foto' : 'Elegir o grabar vídeo');
  return [{ id: 'archivos', etiqueta, accept: acepta }];
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

/** Para los manejadores de siempre, que reciben el evento de un `<input>`: el mismo
 *  `{ target: { files } }`, con lo ya validado. Así cada módulo conserva su validación. */
export const eventoDeArchivos = (files) => ({ target: { files: [...(files || [])], value: '' } });
