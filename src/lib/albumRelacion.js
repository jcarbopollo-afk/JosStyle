/* ===========================================================================
   ÁLBUM — las fotos dentro de Relación (NAV F3)
   ===========================================================================

   Josué: *"que el usuario pueda subir/guardar fotos relacionadas con su pareja
   y que funcione literalmente como un pequeño álbum privado dentro de la
   aplicación"*, y con todas las letras: *"que sea una funcionalidad REAL, no un
   mockup"*.

   🚨 **LO QUE SE GUARDA ES EL CAMINO, NUNCA LA URL FIRMADA.** Una URL de
   Supabase caduca en una hora, así que guardarla sería guardar algo que deja de
   funcionar mientras él duerme — la lección de la E3 F17 con las portadas de los
   libros. La URL se pide en el momento de pintar.

   🚨 **Y EL AISLAMIENTO ES DE LA BASE DE DATOS, NO DE LA PANTALLA.** La primera
   carpeta del camino es el `auth.uid()` y las políticas RLS del bucket exigen
   que coincida, así que **un usuario no puede ver ni borrar las fotos de otro
   aunque sepa el camino**. Esconder un botón no protege nada (EH F43, EH F63).

   ⚠️ **Esto NO es el sistema de fotos general** que la EH F39 declaró
   inexistente: es el sexto almacén de fotos del proyecto, con su propio bucket,
   como los otros cinco.

   ⚠️ **Y no sale de Relación.** El módulo entero vive detrás del `PinGate`
   (regla 6), así que el álbum hereda el PIN sin escribir una línea: no hay una
   segunda puerta que proteger.
   =========================================================================== */
import { uid, fechaLocalISO } from './helpers';

/* ---------------------------------------------------------------------------
   Qué se acepta.

   ⚠️ El tope es **del archivo que se sube**, no de lo que se guarda: aquí la
   foto va a Storage entera, no recortada a un `data:` URI como el avatar de
   Ajustes. Diez megas es lo que pesa una foto de iPhone sin tocar.
   --------------------------------------------------------------------------- */
export const TIPOS_FOTO_ALBUM = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_BYTES_FOTO_ALBUM = 10 * 1024 * 1024;
export const MAX_NOTA_ALBUM = 140;

/**
 * ¿Se puede subir este archivo?
 *
 * Devuelve `{ ok: true }` o `{ ok: false, motivo }` — y el motivo es una frase
 * que se puede enseñar tal cual: un error que no dice qué corregir es el que
 * prohíbe la EH F62.
 */
export function validarFotoAlbum(file) {
  if (!file) return { ok: false, motivo: 'No se ha elegido ninguna foto.' };
  if (file.type && !TIPOS_FOTO_ALBUM.includes(file.type)) {
    return { ok: false, motivo: 'Ese archivo no es una foto. Elige una imagen.' };
  }
  if (typeof file.size === 'number' && file.size > MAX_BYTES_FOTO_ALBUM) {
    return { ok: false, motivo: 'Esa foto pesa más de 10 MB. Prueba con otra.' };
  }
  return { ok: true };
}

/* ---------------------------------------------------------------------------
   La entidad.

   `{ id, path, fecha, nota }` y nada más. ⚠️ **Ni el nombre del archivo, ni su
   tamaño, ni la URL**: son cosas que o no sirven para nada o se quedan viejas.
   --------------------------------------------------------------------------- */
export function crearFotoAlbum(path, { nota = '', fecha = null } = {}) {
  return {
    id: uid(),
    path,
    // La fecha en la que la guardó, en LOCAL: `toISOString` devuelve el día
    // anterior en España, y este proyecto ya lo ha pagado seis veces.
    fecha: fecha || fechaLocalISO(new Date()),
    nota: typeof nota === 'string' ? nota.slice(0, MAX_NOTA_ALBUM).trim() : '',
  };
}

/**
 * ⚠️ **El normalizador, y corre AL CARGAR** (regla 5, y es la vigésima vez que
 * este proyecto se acuerda de ella). Una foto sin `path` no se puede pintar en
 * ninguna pantalla: sería un hueco invisible, así que se descarta aquí en vez de
 * dejar que la vista se las apañe (EH F26 con los accesorios).
 */
export function normalizarFotoAlbum(f) {
  if (!f || typeof f !== 'object') return null;
  if (typeof f.path !== 'string' || !f.path) return null;
  return {
    id: f.id || uid(),
    path: f.path,
    fecha: typeof f.fecha === 'string' ? f.fecha : null,
    nota: typeof f.nota === 'string' ? f.nota.slice(0, MAX_NOTA_ALBUM) : '',
  };
}

/**
 * Normaliza el módulo entero de Relación.
 *
 * ⚠️ **Devuelve el objeto COMPLETO**, no solo el álbum: `saveData` sobrescribe,
 * así que perder `nombre` o `fechas` aquí los borraría en el siguiente guardado
 * (regla 5). Es el fallo que la E3 F26 tuvo que arreglar en `normalizarTareasDe`.
 */
export function normalizarRelacion(rel) {
  const r = rel && typeof rel === 'object' ? rel : {};
  return {
    ...r,
    nombre: typeof r.nombre === 'string' ? r.nombre : '',
    fechas: Array.isArray(r.fechas) ? r.fechas : [],
    album: Array.isArray(r.album) ? r.album.map(normalizarFotoAlbum).filter(Boolean) : [],
  };
}

/* ---------------------------------------------------------------------------
   Leer el álbum.
   --------------------------------------------------------------------------- */

/** Las fotos, de la más reciente a la más antigua. */
export function fotosDelAlbum(relacion) {
  const album = Array.isArray(relacion?.album) ? relacion.album : [];
  return [...album].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
}

/**
 * La línea del álbum: cuántas hay.
 *
 * ⚠️ Sin ninguna **no dice «0 fotos»**: dice qué hacer. Un cero aquí no informa
 * de nada que él no sepa ya (E3 F41 con el *«0 exámenes»*).
 */
export function resumenAlbum(relacion) {
  const n = fotosDelAlbum(relacion).length;
  if (n === 0) return { vacio: true, texto: 'Todavía no has guardado ninguna foto' };
  return { vacio: false, texto: `${n} ${n === 1 ? 'foto' : 'fotos'}` };
}

/* ---------------------------------------------------------------------------
   Escribir.

   ⚠️ Las dos devuelven **el módulo entero**, por lo mismo de arriba.
   --------------------------------------------------------------------------- */
export function anadirFotoAlAlbum(relacion, foto) {
  const r = normalizarRelacion(relacion);
  const limpia = normalizarFotoAlbum(foto);
  if (!limpia) return r;
  return { ...r, album: [limpia, ...r.album] };
}

export function quitarFotoDelAlbum(relacion, id) {
  const r = normalizarRelacion(relacion);
  return { ...r, album: r.album.filter((f) => f.id !== id) };
}

/** El camino de una foto, para poder borrarla también de Storage. */
export function pathDeFoto(relacion, id) {
  const f = (normalizarRelacion(relacion).album || []).find((x) => x.id === id);
  return f ? f.path : null;
}

/* ---------------------------------------------------------------------------
   Lo declarado (regla 8 y la lección de la E3 F46).
   --------------------------------------------------------------------------- */

/* 🚨 **Borrar una foto del álbum NO se recupera**, y por eso es de las pocas
   cosas de JosStyle que preguntan antes. La papelera global guarda **elementos
   de una lista**, y aquí además hay un archivo de verdad en Storage: es el mismo
   caso que la foto de Salud, el vídeo de calistenia y el archivo de Biblioteca,
   las tres únicas que usan `BotonBorrarDefinitivo`. Prometer que se recupera
   sería mentir en pantalla. */
export const BORRADO_ALBUM = {
  vaAPapelera: false,
  porque: 'Se borra el archivo de Storage, y la papelera guarda elementos de una lista, no archivos.',
  aviso: 'Se borra la foto del álbum y del almacenamiento. Esto no se puede deshacer.',
};

/* ⚠️ Lo que este álbum NO es, para que ninguna fase futura lo confunda. */
export const NO_ES = [
  {
    que: 'El sistema de fotos general',
    porque: 'La EH F39 declaró que no existe y sigue sin existir. Esto es el sexto almacén con bucket propio, como los otros cinco.',
  },
  {
    que: 'Una función social',
    porque: 'Josué: "No hace falta complicarlo con funciones sociales ni nada parecido". No se comparte, no se publica y no sale de su cuenta.',
  },
  {
    que: 'Una galería del Calendario',
    porque: 'Las fechas de Relación siguen siendo las de siempre; el álbum no las toca ni añade eventos (regla 11).',
  },
];

/* ---------------------------------------------------------------------------
   La condición de la fase, calculada.
   --------------------------------------------------------------------------- */
export function condicionAlbum(relacion) {
  const r = normalizarRelacion(relacion);
  const casillas = [
    { id: 'existe', texto: 'El álbum es una lista dentro de Relación', ok: Array.isArray(r.album) },
    { id: 'camino', texto: 'Se guarda el camino, nunca una URL firmada', ok: r.album.every((f) => !/^https?:/.test(f.path)) },
    { id: 'fechas', texto: 'Las fechas de Relación siguen intactas', ok: Array.isArray(r.fechas) },
    { id: 'nombre', texto: 'El nombre de la pareja sigue intacto', ok: typeof r.nombre === 'string' },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}
