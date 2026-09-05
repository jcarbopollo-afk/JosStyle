// ============================================================================
// ENTREGA 3 · FASE 18 (BL F4) — BIBLIOTECA: GUARDADOS
//
// *"Guardados debe funcionar como un archivo personal de recursos."* Y el
// enunciado dedica un apartado entero a lo que NO puede pasar:
//
// > **NOTAS**: contenido creado por el usuario.
// > **GUARDADOS**: contenido conservado.
// > *"No permitir que Guardados se convierta en otra app de notas."*
//
// 🚨 **La colección sigue siendo `biblioteca.enlaces`**, la de la Fase 11 que la
// BL F1 identificó como Guardados. Crear `guardados` al lado habría escondido
// los enlaces que Josué ya tiene. Lo que hace esta fase es **ampliar la ficha**
// —tipo, contenido, nota, dominio, favorito, estado— con su migración, porque
// un normalizador que no conoce un campo lo borra en el siguiente guardado
// (regla 5, vigésima vez).
// ============================================================================

import { uid, fechaLocalISO, fechaValida } from './helpers.js';

/* ── Los tres tipos ────────────────────────────────────────────────────────

   *"La arquitectura debe permitir ampliar tipos posteriormente"*: añadir uno es
   añadir una línea aquí, como `MINI_APPS` o `ESTADOS_LIBRO`. Ni un `case`.

   ⚠️ Cada tipo trae su NOMBRE además de su icono (EH F42) y **qué se guarda de
   verdad en él**, que es lo que la pantalla enseña al elegir. */
export const TIPOS_GUARDADO = [
  { id: 'link', nombre: 'Enlace', icono: '🔗', que: 'Una dirección de internet.', principal: 'url' },
  { id: 'text', nombre: 'Texto', icono: '📝', que: 'Un fragmento que quieres conservar.', principal: 'contenido' },
  { id: 'resource', nombre: 'Recurso', icono: '📎', que: 'Cualquier otra cosa que quieras volver a encontrar.', principal: 'contenido' },
];

export const tipoGuardado = (id) => TIPOS_GUARDADO.find((t) => t.id === id) || null;

export const ESTADOS_GUARDADO = [
  { id: 'active', nombre: 'Activo' },
  { id: 'archived', nombre: 'Archivado' },
];

/* ── Las URL ───────────────────────────────────────────────────────────────

   *"Detectar automáticamente: URL, dominio…"* — las dos cosas se pueden hacer
   aquí mismo y son datos de verdad.

   ⚠️ **La forma no basta** (cuarta vez en el proyecto): `'http://'` encaja con
   casi cualquier expresión y no es una dirección. Se usa `new URL`, que es
   quien de verdad sabe si algo es una dirección. */
export function esURL(texto) {
  const t = String(texto || '').trim();
  if (!t || /\s/.test(t)) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return Boolean(u.hostname) && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Completa el `https://` que nadie escribe en el móvil. */
export function normalizarURL(texto) {
  const t = String(texto || '').trim();
  if (!esURL(t)) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export function dominioDe(url) {
  const u = normalizarURL(url);
  if (!u) return null;
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; }
}

/**
 * 🚨 **Lo que SÍ se puede saber de una dirección desde el navegador, y lo que
 * no.** El enunciado lo condiciona —*"si técnicamente es posible obtener
 * metadata de una URL"*— y la respuesta honesta es que **casi nada**:
 *
 * - El **dominio** sale de la propia dirección: es un dato de verdad.
 * - El **favicon** se pide **al sitio mismo** (`https://dominio/favicon.ico`),
 *   sin pasar por ningún servicio de terceros. Si no está, la tarjeta usa el
 *   icono de su tipo y sigue funcionando.
 * - El **título** y la **imagen de portada** exigen **descargar la página y
 *   leer sus etiquetas**, y el navegador no puede: lo impide la política de
 *   origen cruzado. Haría falta una función de servidor que hoy no existe —solo
 *   hay una, la de la IA—, así que **no se finge**: el título se escribe, y la
 *   pantalla lo dice en una frase (regla 8).
 */
export const METADATOS = {
  dominio: { seObtiene: true, como: 'de la propia dirección' },
  favicon: { seObtiene: true, como: 'pidiéndoselo al sitio, sin servicios de terceros' },
  titulo: { seObtiene: false, porque: 'haría falta descargar la página, y el navegador no puede por la política de origen cruzado.' },
  imagen: { seObtiene: false, porque: 'lo mismo que el título: exige leer las etiquetas de la página desde un servidor.' },
};

export const metadato = (id) => METADATOS[id] || null;

/** El favicon **del propio sitio**. `null` si no hay dominio. */
export function faviconDe(url) {
  const d = dominioDe(url);
  return d ? `https://${d}/favicon.ico` : null;
}

/* ── La ficha ──────────────────────────────────────────────────────────────

   El enunciado enumera diecisiete campos. Dos no se guardan:
   - `user_id`, porque el aislamiento es de `app_data` y una copia puede mentir.
   - `preview_image_url`, porque **no se puede obtener** (arriba). Guardar un
     campo que nadie puede rellenar es prometer una función que no existe.

   ⚠️ Y `dominio` y `favicon` **tampoco se guardan**: se derivan de la `url` en
   el momento. Guardarlos sería una copia que se queda vieja si él corrige la
   dirección. */
export const CAMPOS_GUARDADO = [
  'id', 'tipo', 'titulo', 'contenido', 'url', 'descripcion', 'nota',
  'favorito', 'estado', 'coleccionId', 'fecha', 'actualizado', 'archivado',
];

export const MAX_TITULO_GUARDADO = 300;

/**
 * 🚨 *"Guardar algo debe ser extremadamente rápido… no obligar a rellenar un
 * formulario enorme."* Así que lo único obligatorio es **una de las dos cosas**:
 * una dirección o un contenido. Todo lo demás es opcional.
 */
export function crearGuardado({
  tipo = null, titulo = '', contenido = '', url = '', descripcion = '', nota = '',
  favorito = false, coleccionId = null,
} = {}) {
  const direccion = normalizarURL(url) || (esURL(contenido) ? normalizarURL(contenido) : null);
  const texto = String(contenido || '').trim();
  /* ⚠️ El tipo se deduce si no lo dicen: pegar una dirección y darle a guardar
     es el flujo del enunciado, y ahí nadie ha elegido un tipo. */
  const t = tipoGuardado(tipo)?.id || (direccion ? 'link' : 'text');
  if (t === 'link' && !direccion) return null;
  if (t !== 'link' && !texto) return null;
  const hoy = fechaLocalISO(new Date());
  return {
    id: uid(),
    tipo: t,
    titulo: String(titulo || '').trim().slice(0, MAX_TITULO_GUARDADO),
    contenido: direccion && texto === direccion ? '' : texto,
    url: direccion,
    descripcion: String(descripcion || '').trim(),
    nota: String(nota || '').trim(),
    favorito: favorito === true,
    estado: 'active',
    /* ⚠️ *"Preparar `collection_id` pero no implementar Colecciones todavía"*:
       el campo existe y se conserva; la pantalla que lo usa es la BL F7. */
    coleccionId: coleccionId || null,
    fecha: hoy,
    actualizado: hoy,
    archivado: null,
  };
}

/* ── El normalizador y la migración ────────────────────────────────────────

   🚨 **Los enlaces de la Fase 11 tienen `{ id, fecha, titulo, url, descripcion }`
   y ninguno de los campos nuevos.** Sin esto, el primer guardado desde la nueva
   pantalla se llevaría por delante lo que no conociera (regla 5), y ésta es la
   **vigésima vez** que este proyecto paga ese fallo.

   ⚠️ Un enlace viejo se convierte en un guardado de tipo `link` **sin perder ni
   un campo**, y sin tocar su fecha: no lo guardó hoy. */
export function normalizarGuardado(g) {
  if (!g || typeof g !== 'object') return null;
  const direccion = normalizarURL(g.url);
  const texto = typeof g.contenido === 'string' ? g.contenido : '';
  const tipo = tipoGuardado(g.tipo)?.id || (direccion ? 'link' : 'text');
  /* Un guardado sin dirección y sin contenido y sin título no es nada: se
     descarta, como un libro sin título. */
  const titulo = typeof g.titulo === 'string' ? g.titulo.trim() : '';
  if (tipo === 'link' && !direccion) return null;
  if (tipo !== 'link' && !texto && !titulo) return null;
  const fecha = fechaValida(g.fecha) ? g.fecha : fechaLocalISO(new Date());
  const estado = ESTADOS_GUARDADO.some((e) => e.id === g.estado) ? g.estado : 'active';
  return {
    id: g.id || uid(),
    tipo,
    titulo: titulo.slice(0, MAX_TITULO_GUARDADO),
    contenido: texto,
    url: direccion,
    descripcion: typeof g.descripcion === 'string' ? g.descripcion : '',
    nota: typeof g.nota === 'string' ? g.nota : '',
    favorito: g.favorito === true,
    estado,
    coleccionId: g.coleccionId || null,
    fecha,
    actualizado: fechaValida(g.actualizado) ? g.actualizado : fecha,
    archivado: estado === 'archived' ? (fechaValida(g.archivado) ? g.archivado : fecha) : null,
  };
}

/* ── Las acciones ──────────────────────────────────────────────────────────

   Todas devuelven un guardado nuevo y suben `actualizado`. */
const tocado = (g, cambios) => ({ ...g, ...cambios, actualizado: fechaLocalISO(new Date()) });

export function alternarFavorito(g) {
  return g ? tocado(g, { favorito: !g.favorito }) : null;
}

/**
 * ⚠️ *"Un elemento archivado deja de aparecer entre los guardados activos. **No
 * eliminarlo.**"* Archivar y eliminar son dos acciones distintas, y esto ya se
 * aprendió en E3 F5 con los horarios: el aviso de archivar no promete nada que
 * no cumpla, y el elemento sigue entero.
 */
export function archivar(g) {
  if (!g) return null;
  return tocado(g, { estado: 'archived', archivado: fechaLocalISO(new Date()) });
}

export function desarchivar(g) {
  if (!g) return null;
  return tocado(g, { estado: 'active', archivado: null });
}

export function editarGuardado(g, cambios = {}) {
  if (!g) return null;
  const propuesta = normalizarGuardado({ ...g, ...cambios });
  if (!propuesta) return g;
  return { ...propuesta, id: g.id, fecha: g.fecha, actualizado: fechaLocalISO(new Date()) };
}

/* ── Búsqueda, filtros y orden ─────────────────────────────────────────────

   *"Buscar por: título, URL, dominio, descripción, nota personal, contenido
   textual."* Los seis, y el dominio derivado incluido: buscar "youtube"
   encuentra un enlace cuyo título no lo dice. */
const sinAcentos = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function textoBuscable(g) {
  return sinAcentos([g.titulo, g.url, dominioDe(g.url), g.descripcion, g.nota, g.contenido].filter(Boolean).join(' '));
}

export const FILTROS_GUARDADOS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'link', nombre: 'Enlaces' },
  { id: 'text', nombre: 'Textos' },
  { id: 'resource', nombre: 'Recursos' },
  { id: 'favoritos', nombre: 'Favoritos' },
  { id: 'archivados', nombre: 'Archivados' },
];

export const ORDENES_GUARDADOS = [
  { id: 'recientes', nombre: 'Más recientes' },
  { id: 'antiguos', nombre: 'Más antiguos' },
  { id: 'alfabetico', nombre: 'Alfabético' },
  { id: 'favoritos', nombre: 'Favoritos primero' },
];

export const ORDEN_POR_DEFECTO = 'recientes';

/**
 * 🚨 **Lo archivado NO sale entre lo activo**, y sale **solo** en su filtro. Es
 * la razón de ser de archivar: si apareciera igual, el botón no haría nada
 * visible y sería un control decorativo (regla 8).
 */
export function filtrarGuardados(lista = [], { filtro = 'todos', texto = '' } = {}) {
  const q = sinAcentos(texto).trim();
  const base = Array.isArray(lista) ? lista : [];
  return base.filter((g) => {
    if (filtro === 'archivados') {
      if (g.estado !== 'archived') return false;
    } else if (g.estado === 'archived') {
      return false;
    } else if (filtro === 'favoritos') {
      if (!g.favorito) return false;
    } else if (filtro !== 'todos' && g.tipo !== filtro) {
      return false;
    }
    if (!q) return true;
    return textoBuscable(g).includes(q);
  });
}

/** El nombre con el que se enseña un guardado. Sin título se usa lo que hay:
 *  el dominio de la dirección o el principio del texto — nunca "Sin título",
 *  que no ayuda a encontrarlo. */
export function nombreDe(g) {
  if (!g) return '';
  if (g.titulo) return g.titulo;
  if (g.tipo === 'link') return dominioDe(g.url) || g.url || '';
  const t = String(g.contenido || '').trim().replace(/\s+/g, ' ');
  return t.length > 60 ? `${t.slice(0, 60)}…` : t;
}

export function ordenarGuardados(lista = [], orden = ORDEN_POR_DEFECTO) {
  const base = [...(Array.isArray(lista) ? lista : [])];
  const porFecha = (a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''));
  switch (orden) {
    case 'antiguos':
      return base.sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
    case 'alfabetico':
      return base.sort((a, b) => nombreDe(a).localeCompare(nombreDe(b), 'es'));
    case 'favoritos':
      /* ⚠️ "Favoritos primero" es un ORDEN, no un filtro: los demás siguen
         estando, debajo. Esconderlos sería decidir por él (EH F25). */
      return base.sort((a, b) => (Number(b.favorito) - Number(a.favorito)) || porFecha(a, b));
    default:
      return base.sort(porFecha);
  }
}

/** El resumen de arriba. `null` sin ni un guardado: *"no inventar números"*. */
export function resumenGuardados(lista = []) {
  const base = Array.isArray(lista) ? lista : [];
  if (base.length === 0) return null;
  const activos = base.filter((g) => g.estado !== 'archived');
  const favoritos = activos.filter((g) => g.favorito).length;
  const archivados = base.length - activos.length;
  const partes = [`${activos.length} ${activos.length === 1 ? 'guardado' : 'guardados'}`];
  if (favoritos) partes.push(`${favoritos} ${favoritos === 1 ? 'favorito' : 'favoritos'}`);
  if (archivados) partes.push(`${archivados} ${archivados === 1 ? 'archivado' : 'archivados'}`);
  return partes.join(' · ');
}

/* ── Compartir desde el móvil ──────────────────────────────────────────────

   *"Preparar la arquitectura para que posteriormente sea posible compartir
   contenido desde el móvil hacia Biblioteca… **NO implementar necesariamente el
   Share Target PWA en esta fase. Solo dejar la estructura preparada.**"*

   🚨 Y "preparado" **no es un botón que no hace nada**. Lo que hace falta está
   escrito aquí, y `crearDesdeCompartido` es la función que recibiría lo
   compartido — la misma que usa el formulario, así que el día que exista el
   Share Target no hay que escribir nada nuevo.

   ⏸ Falta un **service worker**, que es exactamente lo que la E3 F15 dejó como
   decisión de Josué (DEP-30): sin él, `share_target` en el manifiesto no
   funciona. Por eso no se declara todavía: un `share_target` que Safari ofrezca
   y que luego no guarde nada sería peor que no ofrecerlo. */
export const COMPARTIR_DESDE_EL_MOVIL = {
  implementado: false,
  loQueFalta: [
    'Un `share_target` en `public/manifest.json`, con su ruta de destino.',
    'Un service worker que reciba lo compartido — la decisión de Josué en DEP-30.',
    'Una ruta en la aplicación que lea lo recibido y llame a `crearDesdeCompartido`.',
  ],
  yaListo: 'crearDesdeCompartido',
  porque: 'un `share_target` que Safari ofrezca y que luego no guarde nada sería peor que no ofrecerlo.',
};

/**
 * Lo que llegaría de *Compartir*: un texto, una dirección, o las dos cosas.
 * Devuelve un guardado ya hecho, o `null` si no había nada aprovechable.
 */
export function crearDesdeCompartido({ title = '', text = '', url = '' } = {}) {
  const direccion = normalizarURL(url) || normalizarURL(text) || null;
  if (direccion) return crearGuardado({ tipo: 'link', url: direccion, titulo: title });
  const texto = String(text || '').trim();
  if (!texto) return null;
  return crearGuardado({ tipo: 'text', contenido: texto, titulo: title });
}

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────*/
export const NO_EN_GUARDADOS = [
  { que: 'Ideas, Documentos y Colecciones', llega: 'BL F5, F6 y F7' },
  { que: 'IA y recomendaciones', llega: 'no está previsto en este bloque' },
  { que: 'Descargar páginas para sacarles el título y la imagen', llega: 'necesitaría una función de servidor que hoy no existe' },
  { que: 'El Share Target completo', llega: 'depende del service worker (DEP-30)' },
  { que: 'Un sistema de etiquetas', llega: 'no está previsto en este bloque' },
];

/* 🚨 **La diferencia con Notas, escrita y comprobable.** El enunciado la marca
   como IMPORTANTE, así que no se queda en un comentario: la pantalla la dice, y
   hay una prueba que comprueba que Guardados **no tiene** lo que haría de él una
   segunda aplicación de notas. */
export const DIFERENCIA_CON_NOTAS = {
  notas: 'Lo que escribes tú.',
  guardados: 'Lo que conservas de fuera.',
  ejemplo: 'Un enlace que quieres volver a encontrar es un guardado; lo que apuntas sobre él es una nota.',
};
