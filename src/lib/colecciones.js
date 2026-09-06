// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 21 (BL F7) — BIBLIOTECA: COLECCIONES
// ══════════════════════════════════════════════════════════════════════════
//
// *"Colecciones será la capa de organización de Biblioteca. **No debe almacenar
//  contenido propio como si fuera otra mini-app.** Su función es: agrupar
//  contenido existente."*
//
// 🚨 **UNA COLECCIÓN NO GUARDA CONTENIDO: GUARDA REFERENCIAS.** Es el apartado
//    más repetido del enunciado, dicho tres veces —*"IMPORTANTE: NO DUPLICAR"*,
//    *"RELACIÓN"*, *"DETALLE DE ELEMENTOS"*—: añadir una nota a una colección
//    **no crea una copia**, quitarla **no borra la nota**, y abrirla desde la
//    colección **abre la nota de verdad**. Por eso aquí no hay ni un `titulo`,
//    ni un `contenido`, ni una `url` copiados: solo `{ tipo, id }`.
//
// 🚨 **Y LA FÁBRICA SE MUDA, NO SE DUPLICA** (la lección de EH F17 y BL F2):
//    `crearColeccion` y `normalizarColeccion` vivían en `biblioteca.js` desde la
//    BL F1 con el modelo mínimo —nombre, descripción y fecha— y se mudan aquí al
//    desarrollarlas. `biblioteca.js` las importa y las reexporta con
//    `export { X }`, **nunca `export … from`**, que no crea binding local.
//
// ⚠️ **DÓNDE VIVE LA RELACIÓN, Y POR QUÉ AHÍ.** El enunciado describe una tabla
//    `COLLECTION_ITEMS` polimórfica… y a continuación dice: *"Si la base de
//    datos actual utiliza relaciones específicas por tabla en vez de una
//    relación polimórfica, **respetar la arquitectura existente. No introducir
//    una arquitectura incompatible únicamente por esta especificación**"*.
//
//    La arquitectura de JosStyle es `app_data`: **una fila por (usuario, clave)**
//    con un JSON dentro. No hay tablas por entidad, así que no hay dónde poner
//    una tabla de relación. La relación vive **dentro de la colección**, como
//    `elementos: [{ tipo, id, fecha }]`, y eso da gratis lo que el enunciado
//    pide:
//
//    · **Eliminar una colección elimina sus relaciones** (criterio 9) porque las
//      relaciones están *dentro* de ella. No hay una segunda lista que barrer a
//      mano — que es exactamente el fallo que E3 F20 se negó a repetir con las
//      etiquetas de los documentos.
//    · **Un elemento puede estar en varias colecciones** (criterio 7) porque
//      cada colección lleva su propia lista. Nada que limitar.
//    · **La seguridad sale sola** (criterio 20): todo esto vive en la clave
//      `biblioteca` del propio usuario, y las cuatro políticas de `app_data` son
//      `auth.uid() = user_id`. Una colección **no puede** referenciar un
//      elemento de otro usuario porque no existe ningún camino para llegar a él.
//
// 🚨 **Y ESO RESUELVE UNA CONTRADICCIÓN CON LA BL F4.** Aquella fase preparó un
//    `coleccionId` en cada guardado —*"preparar `collection_id` pero no
//    implementar Colecciones todavía"*—, y ésta dice literalmente lo contrario:
//    *"**No asumir que todos los elementos pueden tener un `collection_id`
//    único.** Como un elemento puede pertenecer a múltiples colecciones,
//    utilizar tablas de relación."* Manda la fase que construye la función:
//    `absorberColeccionId` convierte cualquier `coleccionId` guardado en una
//    relación de verdad y lo deja a `null`. Dos fuentes de verdad para lo mismo
//    es como se acaba enseñando una cosa distinta en cada pantalla.

import { uid, fechaLocalISO } from './helpers.js';
import { nombreDe } from './guardados.js';
import { nombreDoc } from './documentos.js';
import { textoDeIdea } from './ideas.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const txt = (s) => (typeof s === 'string' ? s : '');

/* ── Los tipos que una colección puede agrupar ─────────────────────────────

   *"Preparar la arquitectura para que pueda incorporar nuevos tipos en el
   futuro."*

   ⚠️ **Y así es como se incorpora uno: escribiendo una línea aquí.** Ni un
   `case`, ni un `if` por tipo en la pantalla — es el mismo reparto que
   `MINI_APPS`, `TIPOS_EVENTO_CALENDARIO` o `MODULOS_EH`. Cada línea dice de qué
   lista sale el elemento, cómo se llama, cómo se busca dentro de él y con qué
   icono se pinta.

   ⚠️ **Y son SEIS, no cinco.** El enunciado enumera cinco `item_type` —book,
   note, saved_item, idea, document—, pero en JosStyle *Documentos* enseña **dos
   listas bajo el mismo techo** (E3 F20): los documentos de texto y los archivos
   que Josué subió en la Fase 11. Dejar fuera los archivos significaría que un
   PDF suyo no se puede meter en «Estudios» mientras el documento de al lado sí:
   la asimetría no se ve en el código y se nota en la mano. `archivo` es el
   primer uso de *"incorporar nuevos tipos"*.

   ⚠️ El `icono` es el **nombre** del componente de Lucide, no el componente: una
   línea de datos no importa React. La pantalla lo traduce con
   `ICONOS_TIPO_ELEMENTO`, el mismo reparto que `CATEGORIAS_ARMARIO` /
   `ICONOS_CATEGORIA` (E3 F3) y que `MINI_APPS` / `ICONOS_MINI_APP` (E3 F16). */
export const TIPOS_ELEMENTO = [
  {
    id: 'libro',
    nombre: 'Libro',
    plural: 'Libros',
    emoji: '📚',
    icono: 'BookMarked',
    miniApp: 'libros',
    de: 'biblioteca',
    coleccion: 'libros',
    nombreDelElemento: (x) => txt(x.titulo) || 'Sin título',
    textos: (x) => [x.titulo, x.autor, x.notas],
  },
  {
    id: 'nota',
    nombre: 'Nota',
    plural: 'Notas',
    emoji: '📝',
    icono: 'StickyNote',
    miniApp: 'notas',
    de: 'biblioteca',
    coleccion: 'apuntes',
    nombreDelElemento: (x) => txt(x.titulo) || txt(x.contenido).split('\n')[0].slice(0, 60) || 'Nota',
    textos: (x) => [x.titulo, x.contenido],
  },
  {
    id: 'guardado',
    nombre: 'Guardado',
    plural: 'Guardados',
    emoji: '🔖',
    icono: 'Bookmark',
    miniApp: 'guardados',
    de: 'biblioteca',
    coleccion: 'enlaces',
    /* ⚠️ **Un guardado sin título se enseña por su dominio o por su texto**
       (E3 F18), nunca como *"Sin título"*. Se usa `nombreDe`, que ya lo hace:
       escribir aquí una segunda versión sería enseñar dos nombres distintos
       para la misma cosa según la pantalla. */
    nombreDelElemento: (x) => nombreDe(x),
    textos: (x) => [x.titulo, x.url, x.contenido, x.nota],
  },
  {
    id: 'idea',
    nombre: 'Idea',
    plural: 'Ideas',
    emoji: '💡',
    icono: 'Lightbulb',
    miniApp: 'ideas',
    de: 'biblioteca',
    coleccion: 'ideas',
    nombreDelElemento: (x) => textoDeIdea(x),
    textos: (x) => [x.titulo, x.descripcion, x.categoria],
  },
  {
    id: 'documento',
    nombre: 'Documento',
    plural: 'Documentos',
    emoji: '📄',
    icono: 'FileText',
    miniApp: 'documentos',
    de: 'biblioteca',
    coleccion: 'documentos',
    nombreDelElemento: (x) => nombreDoc(x),
    textos: (x) => [x.titulo, x.contenido, ...lista(x.etiquetas)],
  },
  {
    id: 'archivo',
    nombre: 'Archivo',
    plural: 'Archivos',
    emoji: '📎',
    icono: 'Paperclip',
    miniApp: 'documentos',
    /* 🚨 El único que **no** sale de la clave `biblioteca`: los archivos viven en
       `bibliotecaArchivos` desde la Fase 11. Por eso cada línea declara su `de`
       en vez de darlo por hecho. */
    de: 'archivos',
    coleccion: null,
    nombreDelElemento: (x) => txt(x.titulo) || 'Archivo',
    textos: (x) => [x.titulo, x.textoExtraido],
  },
];

export const tipoElemento = (id) => TIPOS_ELEMENTO.find((t) => t.id === id) || null;
export const TIPOS_VALIDOS = TIPOS_ELEMENTO.map((t) => t.id);

/* ── El acento ─────────────────────────────────────────────────────────────

   *"Color/acento. Opcional. **Utilizar el sistema de colores existente. No crear
   una paleta independiente.**"*

   🚨 Así que un acento se guarda como **el nombre de un token**, jamás como un
   hex: la regla 2 del proyecto prohíbe un hex suelto fuera de `tokens.js`, y un
   hex guardado además se quedaría fijo cuando Josué cambie de tema. Es el mismo
   reparto que `TIPOS_EVENTO_CALENDARIO.colorToken`, que ya resuelve esto desde
   el Calendario Universal: `'accent'` significa *el acento que él tenga puesto*.

   `colorDeAcento()` lo traduce, y vive en la pantalla —donde está `COLORS`—,
   no aquí. */
export const ACENTOS_COLECCION = [
  { id: 'accent', nombre: 'El de la app' },
  { id: 'info', nombre: 'Azul' },
  { id: 'positive', nombre: 'Verde' },
  { id: 'warning', nombre: 'Dorado' },
  { id: 'negative', nombre: 'Rojo' },
  { id: 'secondary', nombre: 'Secundario' },
  { id: 'tertiary', nombre: 'Terciario' },
];

export const ACENTO_POR_DEFECTO = 'accent';
export const acentoColeccion = (id) => ACENTOS_COLECCION.find((a) => a.id === id) || ACENTOS_COLECCION[0];

/* ── El icono ──────────────────────────────────────────────────────────────

   *"Icono. Seleccionable."* Nombres de Lucide, traducidos por
   `ICONOS_COLECCION` en la pantalla. **Nada de emojis** (E3 F3): la gramática de
   iconos de este proyecto es Lucide, 24×24, solo trazo, `currentColor`. */
export const ICONOS_DISPONIBLES = [
  { id: 'FolderOpen', nombre: 'Carpeta' },
  { id: 'GraduationCap', nombre: 'Estudios' },
  { id: 'Code', nombre: 'Programación' },
  { id: 'Briefcase', nombre: 'Negocio' },
  { id: 'Heart', nombre: 'Personal' },
  { id: 'Rocket', nombre: 'Proyectos' },
  { id: 'Dumbbell', nombre: 'Deporte' },
  { id: 'Sparkles', nombre: 'Inspiración' },
];

export const ICONO_POR_DEFECTO = 'FolderOpen';
export const iconoDisponible = (id) => ICONOS_DISPONIBLES.some((i) => i.id === id);

/* ── El modelo ─────────────────────────────────────────────────────────────

   El enunciado enumera los campos de `COLLECTION`. Se construyen los que existen
   de verdad en esta arquitectura:

   · `user_id` **no es un campo**: la fila entera de `app_data` es del usuario, y
     ahí es donde vive el aislamiento. Guardarlo dentro sería una copia que no
     protege nada (EH F43: *"el aislamiento es de la base de datos, nunca de la
     pantalla"*).
   · `status` y `archived_at` se resuelven con **un booleano**, `archivada`, como
     `archivado` en Guardados y Documentos y `archivada` en Ideas. Un `status`
     con dos valores posibles es un booleano con más letras.
   · `favorite` → `favorita`, el mismo campo que ya tienen guardados, documentos
     y libros. ⚠️ *"No crear un sistema de favoritos específico para
     Colecciones"*: no se crea ninguno — **no existen los favoritos globales**
     (EH F39) y esto es la marca por elemento que las otras mini-apps ya usan. */
export const MAX_NOMBRE = 200;
export const MAX_DESCRIPCION = 500;

export const CAMPOS_COLECCION = [
  'id', 'nombre', 'descripcion', 'icono', 'acento',
  'favorita', 'archivada', 'elementos', 'fecha', 'actualizado',
];

/** 🚨 Los cuatro campos que una colección **no** guarda nunca, porque son del
 *  elemento y copiarlos es el duplicado que prohíbe el apartado *"RELACIÓN"*. */
export const NUNCA_SE_COPIA = ['contenido', 'titulo del elemento', 'texto', 'url'];

export function nombreValido(n) {
  return typeof n === 'string' && n.trim().length > 0 && n.trim().length <= MAX_NOMBRE;
}

/** Una referencia válida: un tipo del catálogo y un id con algo dentro. */
export function refValida(ref) {
  return !!ref && typeof ref === 'object'
    && TIPOS_VALIDOS.includes(ref.tipo)
    && typeof ref.id === 'string' && ref.id.length > 0;
}

export const mismaRef = (a, b) => !!a && !!b && a.tipo === b.tipo && a.id === b.id;

/**
 * *"Nombre: obligatorio."* Todo lo demás es opcional, y sin nombre no se crea
 * nada — un botón que guarda una colección sin nombre deja una fila que no se
 * puede encontrar.
 */
export function crearColeccion({
  nombre, descripcion = '', icono = ICONO_POR_DEFECTO, acento = ACENTO_POR_DEFECTO,
  elementos = [],
} = {}) {
  if (!nombreValido(nombre)) return null;
  const ahora = fechaLocalISO(new Date());
  return {
    id: uid(),
    nombre: nombre.trim(),
    descripcion: txt(descripcion).trim().slice(0, MAX_DESCRIPCION),
    icono: iconoDisponible(icono) ? icono : ICONO_POR_DEFECTO,
    acento: acentoColeccion(acento).id,
    favorita: false,
    archivada: false,
    elementos: normalizarElementos(elementos, ahora),
    fecha: ahora,
    actualizado: ahora,
  };
}

/** Las referencias, limpias: sin tipos desconocidos, sin ids vacíos y **sin
 *  repetidas**. Meter dos veces la misma nota en «Estudios» es una sola
 *  relación, no dos — y si no se deduplica aquí, el contador dice 13 donde hay
 *  12 elementos. */
export function normalizarElementos(elementos, fechaPorDefecto = '') {
  const vistas = new Set();
  return lista(elementos)
    .map((e) => (refValida(e) ? { tipo: e.tipo, id: e.id, fecha: txt(e.fecha) || fechaPorDefecto } : null))
    .filter((e) => {
      if (!e) return false;
      const clave = `${e.tipo}·${e.id}`;
      if (vistas.has(clave)) return false;
      vistas.add(clave);
      return true;
    });
}

/* ── El normalizador ───────────────────────────────────────────────────────

   ⚠️ **Y es la vigesimoprimera vez de la misma lección.** La colección de la
   BL F1 tenía tres campos —nombre, descripción y fecha—; ésta le añade siete.
   Sin ponerlos aquí, el primer guardado desde la pantalla nueva se llevaría por
   delante el icono, el acento, la marca de favorita, el archivado **y todas las
   relaciones** de las colecciones que Josué ya hubiera creado (regla 5). */
export function normalizarColeccion(c) {
  if (!c || typeof c !== 'object') return null;
  const nombre = txt(c.nombre).trim();
  if (!nombre) return null;
  const fecha = txt(c.fecha);
  return {
    id: typeof c.id === 'string' && c.id ? c.id : uid(),
    nombre: nombre.slice(0, MAX_NOMBRE),
    descripcion: txt(c.descripcion).slice(0, MAX_DESCRIPCION),
    icono: iconoDisponible(c.icono) ? c.icono : ICONO_POR_DEFECTO,
    acento: acentoColeccion(c.acento).id,
    favorita: c.favorita === true,
    archivada: c.archivada === true,
    elementos: normalizarElementos(c.elementos, fecha),
    fecha,
    actualizado: txt(c.actualizado) || fecha,
  };
}

const tocada = (c, cambios) => ({ ...c, ...cambios, actualizado: fechaLocalISO(new Date()) });

export function editarColeccion(c, cambios = {}) {
  if (!c) return c;
  const siguiente = { ...c };
  if ('nombre' in cambios) {
    if (!nombreValido(cambios.nombre)) return c;
    siguiente.nombre = cambios.nombre.trim();
  }
  if ('descripcion' in cambios) siguiente.descripcion = txt(cambios.descripcion).trim().slice(0, MAX_DESCRIPCION);
  if ('icono' in cambios && iconoDisponible(cambios.icono)) siguiente.icono = cambios.icono;
  if ('acento' in cambios) siguiente.acento = acentoColeccion(cambios.acento).id;
  return tocada(c, siguiente);
}

export const alternarFavoritaColeccion = (c) => (c ? tocada(c, { favorita: !c.favorita }) : c);

/* ⚠️ **ARCHIVAR NO ES ELIMINAR, y aquí hay una tercera cosa que tampoco es**
   (E3 F5 y E3 F18 lo dijeron antes): *"Permitir archivar una colección. **Los
   elementos internos NO se archivan.** Solo desaparece la colección de las
   activas."* Así que archivar **no toca `elementos`** — ni las relaciones ni,
   por supuesto, los elementos originales. */
export const archivarColeccion = (c) => (c ? tocada(c, { archivada: true }) : c);
export const desarchivarColeccion = (c) => (c ? tocada(c, { archivada: false }) : c);

/* ── Añadir y quitar: lo único que toca la relación ────────────────────────

   🚨 *"Quitar de colección: esto elimina **únicamente la relación**. NO elimina
   el elemento original."* Por eso estas cuatro funciones devuelven **una
   colección** y no tienen forma de tocar ninguna otra lista: no reciben la
   biblioteca. Es la misma frontera escrita que `armarioEnEstiloHombre.js`
   (EH F5). */

export const contieneElemento = (c, tipo, id) =>
  lista(c && c.elementos).some((e) => e.tipo === tipo && e.id === id);

export function anadirElemento(c, tipo, id) {
  if (!c || !refValida({ tipo, id })) return c;
  if (contieneElemento(c, tipo, id)) return c;  // idempotente: ya está, no se duplica
  return tocada(c, { elementos: [...lista(c.elementos), { tipo, id, fecha: fechaLocalISO(new Date()) }] });
}

/** *"Permitir seleccionar múltiples elementos. Botón: Añadir seleccionados."* */
export function anadirElementos(c, refs) {
  if (!c) return c;
  const nuevas = lista(refs).filter((r) => refValida(r) && !contieneElemento(c, r.tipo, r.id));
  if (nuevas.length === 0) return c;
  const ahora = fechaLocalISO(new Date());
  return tocada(c, {
    elementos: normalizarElementos([...lista(c.elementos), ...nuevas.map((r) => ({ tipo: r.tipo, id: r.id, fecha: ahora }))], ahora),
  });
}

export function quitarElemento(c, tipo, id) {
  if (!c || !contieneElemento(c, tipo, id)) return c;
  return tocada(c, { elementos: lista(c.elementos).filter((e) => !(e.tipo === tipo && e.id === id)) });
}

/* ── El sistema único de "Añadir a colección" ──────────────────────────────

   🚨 *"En una Nota: ••• → Añadir a colección. En un Documento… En un Guardado…
   En una Idea… En un Libro… Esto debe reutilizar el mismo sistema. **No crear
   cinco sistemas distintos.**"*

   Éste es el sistema: **una función que recibe la lista entera de colecciones**
   y devuelve la lista entera. Las cinco pantallas llaman aquí; ninguna sabe cómo
   se guarda una relación. */
export function alternarEnColeccion(colecciones, coleccionId, tipo, id) {
  return lista(colecciones).map((c) => {
    if (c.id !== coleccionId) return c;
    return contieneElemento(c, tipo, id) ? quitarElemento(c, tipo, id) : anadirElemento(c, tipo, id);
  });
}

/** En qué colecciones está este elemento. Es lo que enseña el ••• de cada
 *  mini-app: **marcadas las que ya lo tienen**, y las archivadas al final. */
export function coleccionesDe(colecciones, tipo, id) {
  return lista(colecciones).filter((c) => contieneElemento(c, tipo, id));
}

/* ── Resolver: de una referencia al elemento de verdad ─────────────────────

   🚨 *"Al pulsar un elemento dentro de una colección: **abrir el elemento
   original**. No crear una copia de la nota."* Aquí está el motivo de que se
   pueda cumplir: la colección no tiene copia que enseñar, así que la única
   forma de pintar algo es ir a buscarlo a su lista.

   ⚠️ Y de aquí sale también la **integridad** (criterio 19): una referencia a
   algo que ya no existe **no resuelve**, así que no se cuenta, no se pinta y no
   aparece en ninguna búsqueda. Una relación huérfana no puede enseñarse aunque
   siga guardada. */
export function resolverElemento(ref, datos = {}) {
  const t = tipoElemento(ref && ref.tipo);
  if (!t || !ref.id) return null;
  const origen = t.de === 'archivos' ? lista(datos.archivos) : lista((datos.biblioteca || {})[t.coleccion]);
  return origen.find((x) => x && x.id === ref.id) || null;
}

/** Los elementos de una colección, resueltos y en el orden en que se añadieron.
 *  Cada uno viene con su referencia y su tipo, que es lo que la pantalla
 *  necesita para agrupar, filtrar y abrir el original. */
export function elementosDeColeccion(c, datos = {}) {
  return lista(c && c.elementos)
    .map((ref) => {
      const elemento = resolverElemento(ref, datos);
      return elemento ? { ref, tipo: ref.tipo, elemento, fecha: ref.fecha } : null;
    })
    .filter(Boolean);
}

/** El número que se enseña en la tarjeta. **Cuenta lo que resuelve**, nunca las
 *  referencias guardadas: decir "12 elementos" y enseñar 11 es peor que no
 *  decir nada. */
export const contarColeccion = (c, datos) => elementosDeColeccion(c, datos).length;

/** *"Agrupar visualmente por tipo… **No mostrar categorías vacías**."* Sale
 *  gratis: solo se devuelven los grupos que tienen algo. */
export function agruparPorTipo(resueltos) {
  return TIPOS_ELEMENTO
    .map((t) => ({ tipo: t, elementos: lista(resueltos).filter((r) => r.tipo === t.id) }))
    .filter((g) => g.elementos.length > 0);
}

/** La línea de la tarjeta: *"Nota · Documento · Guardado"*. Los tipos que hay
 *  de verdad dentro, en el orden del catálogo. */
export function tiposDe(c, datos) {
  return agruparPorTipo(elementosDeColeccion(c, datos)).map((g) => g.tipo.nombre);
}

/* ── La preview ────────────────────────────────────────────────────────────

   *"Opcionalmente mostrar hasta 3-4 iconos o miniaturas de elementos
   contenidos. **No cargar cientos de elementos solo para crear el preview.**"*

   ⚠️ Por eso corta **antes** de resolver: una colección con trescientas
   referencias resuelve cuatro, no trescientas. Y *"la preview debe utilizar
   datos reales"*: son los cuatro primeros elementos que existen de verdad. */
export const MAX_PREVIEW = 4;

export function previewDe(c, datos = {}, max = MAX_PREVIEW) {
  const salida = [];
  for (const ref of lista(c && c.elementos)) {
    if (salida.length >= max) break;
    const elemento = resolverElemento(ref, datos);
    if (elemento) salida.push({ ref, tipo: ref.tipo, elemento });
  }
  return salida;
}

/** El nombre con el que se enseña un elemento dentro de una colección — el de
 *  su propia mini-app, nunca uno inventado aquí. */
export function nombreDelElemento(tipo, elemento) {
  const t = tipoElemento(tipo);
  if (!t || !elemento) return '';
  return t.nombreDelElemento(elemento);
}

/* ── Buscar, filtrar y ordenar ─────────────────────────────────────────────

   *"En Colecciones: buscar por nombre y descripción. Dentro de una colección:
   buscar entre sus elementos."* Dos búsquedas distintas porque son dos
   preguntas distintas. */

const contiene = (textos, q) =>
  !q || lista(textos).filter(Boolean).join(' ').toLowerCase().includes(q.trim().toLowerCase());

export function buscarColecciones(colecciones, query) {
  return lista(colecciones).filter((c) => contiene([c.nombre, c.descripcion], query));
}

/** Dentro de una colección se busca **en el elemento de verdad**, con los campos
 *  que declara su tipo. Buscar "biología" encuentra la nota porque se lee la
 *  nota, no una copia de su título. */
export function buscarDentro(resueltos, query) {
  const q = txt(query).trim().toLowerCase();
  if (!q) return lista(resueltos);
  return lista(resueltos).filter((r) => {
    const t = tipoElemento(r.tipo);
    if (!t) return false;
    return contiene(t.textos(r.elemento), q);
  });
}

export const FILTROS_COLECCIONES = [
  { id: 'activas', label: 'Activas' },
  { id: 'favoritas', label: 'Favoritas' },
  { id: 'archivadas', label: 'Archivadas' },
  { id: 'todas', label: 'Todas' },
];

export const FILTRO_COLECCIONES_POR_DEFECTO = 'activas';

/* ⚠️ **Lo archivado desaparece de lo activo** (E3 F18): si siguiera saliendo, el
   botón de archivar no haría nada visible. Y sale **entero** en su filtro. */
export function filtrarColecciones(colecciones, filtro = FILTRO_COLECCIONES_POR_DEFECTO) {
  const todas = lista(colecciones);
  if (filtro === 'todas') return todas;
  if (filtro === 'archivadas') return todas.filter((c) => c.archivada);
  if (filtro === 'favoritas') return todas.filter((c) => c.favorita && !c.archivada);
  return todas.filter((c) => !c.archivada);
}

export const ORDENES_COLECCIONES = [
  { id: 'recientes', label: 'Más recientes' },
  { id: 'alfabetico', label: 'Alfabético' },
  { id: 'mas_elementos', label: 'Más elementos' },
];

export const ORDEN_COLECCIONES_POR_DEFECTO = 'recientes';

export function ordenarColecciones(colecciones, orden = ORDEN_COLECCIONES_POR_DEFECTO, datos = {}) {
  const copia = [...lista(colecciones)];
  if (orden === 'alfabetico') {
    return copia.sort((a, b) => txt(a.nombre).localeCompare(txt(b.nombre), 'es', { sensitivity: 'base' }));
  }
  if (orden === 'mas_elementos') {
    return copia.sort((a, b) => contarColeccion(b, datos) - contarColeccion(a, datos));
  }
  return copia.sort((a, b) => txt(b.actualizado || b.fecha).localeCompare(txt(a.actualizado || a.fecha)));
}

/** *"Filtro dentro de colección: Todo, Libros, Notas, Guardados, Ideas,
 *  Documentos."* Se deriva del catálogo: un tipo nuevo trae su filtro solo. */
export const FILTROS_DENTRO = [
  { id: 'todo', label: 'Todo' },
  ...TIPOS_ELEMENTO.map((t) => ({ id: t.id, label: t.plural })),
];

export const filtrarDentro = (resueltos, filtro = 'todo') =>
  (filtro === 'todo' ? lista(resueltos) : lista(resueltos).filter((r) => r.tipo === filtro));

export const ORDENES_DENTRO = [
  { id: 'recientes', label: 'Más recientes' },
  { id: 'alfabetico', label: 'Alfabético' },
  { id: 'tipo', label: 'Tipo' },
];

export const ORDEN_DENTRO_POR_DEFECTO = 'recientes';

export function ordenarDentro(resueltos, orden = ORDEN_DENTRO_POR_DEFECTO) {
  const copia = [...lista(resueltos)];
  if (orden === 'alfabetico') {
    return copia.sort((a, b) =>
      nombreDelElemento(a.tipo, a.elemento).localeCompare(nombreDelElemento(b.tipo, b.elemento), 'es', { sensitivity: 'base' }));
  }
  if (orden === 'tipo') {
    return copia.sort((a, b) => TIPOS_VALIDOS.indexOf(a.tipo) - TIPOS_VALIDOS.indexOf(b.tipo));
  }
  return copia.sort((a, b) => txt(b.fecha).localeCompare(txt(a.fecha)));
}

/* ── Eliminar una colección ────────────────────────────────────────────────

   🚨 *"Eliminar una colección debe eliminar: la colección + sus relaciones,
   pero **nunca los elementos originales**. Mostrar claramente: «Los elementos de
   esta colección no se eliminarán»."*

   ⚠️ Y esa frase **no es decorativa: es verdad por construcción**. Borrar la
   colección es sacarla de `biblioteca.colecciones`, y las relaciones se van con
   ella porque están dentro. No hay ni una función en este archivo capaz de
   tocar `libros`, `apuntes`, `enlaces`, `ideas`, `documentos` ni `archivos` —
   igual que `agendaDia.js` no puede escribir (E3 F7). */
export const AVISO_ELIMINAR = 'Los elementos de esta colección no se eliminarán.';

export function avisoDeEliminar(c, datos = {}) {
  const n = contarColeccion(c, datos);
  return {
    titulo: `¿Eliminar «${txt(c && c.nombre)}»?`,
    seVa: n === 0 ? 'La colección.' : (n === 1 ? 'La colección y su referencia.' : `La colección y sus ${n} referencias.`),
    seQueda: AVISO_ELIMINAR,
  };
}

/* ── Integridad ────────────────────────────────────────────────────────────

   *"Si se elimina un elemento original: la relación con la colección debe
   desaparecer correctamente. **No dejar relaciones huérfanas.**"*

   ⚠️ **Y hay un matiz que decide el diseño: en JosStyle eliminar casi nunca es
   definitivo.** Una nota borrada va a *Eliminados recientemente* y **vuelve**
   (ME F3). Si la relación se borrara en el momento del borrado, restaurar la
   nota la devolvería a la Biblioteca **pero no a su colección**, y eso es
   perder algo que Josué había organizado, en silencio.

   Así que la relación **se queda mientras el elemento pueda volver**, no se ve
   —`resolverElemento` no la resuelve, así que no cuenta ni se pinta— y se limpia
   cuando el elemento ya no existe en ninguna parte. `limpiarRelaciones` es la
   puerta para eso, y `relacionesHuerfanas` la lectura que lo audita. */
export function relacionesHuerfanas(colecciones, datos = {}) {
  return lista(colecciones).flatMap((c) =>
    lista(c.elementos)
      .filter((ref) => !resolverElemento(ref, datos))
      .map((ref) => ({ coleccionId: c.id, coleccion: c.nombre, tipo: ref.tipo, id: ref.id })));
}

/** Saca de TODAS las colecciones las referencias a un elemento. Se llama cuando
 *  el elemento se va de verdad —no cuando va a la papelera—, y devuelve la lista
 *  entera de colecciones. */
export function limpiarRelaciones(colecciones, tipo, id) {
  return lista(colecciones).map((c) => quitarElemento(c, tipo, id));
}

/* ── La contradicción de la BL F4, resuelta ────────────────────────────────

   🚨 La BL F4 dejó `coleccionId` en cada guardado —*"preparar `collection_id`"*—
   y esta fase dice literalmente *"no asumir que todos los elementos pueden tener
   un `collection_id` único"*. Manda ésta, que es la que construye la función.

   `absorberColeccionId` lo convierte en una relación de verdad y lo deja a
   `null`. Ningún guardado de Josué lo tiene puesto —ninguna pantalla lo escribió
   nunca—, así que hoy no mueve un solo dato; está para que **no queden dos
   fuentes de verdad** sobre en qué colección está un guardado. */
export function absorberColeccionId(colecciones, guardados) {
  const cols = lista(colecciones);
  const gs = lista(guardados);
  const pendientes = gs.filter((g) => g && g.coleccionId && cols.some((c) => c.id === g.coleccionId));
  if (pendientes.length === 0) return { colecciones: cols, guardados: gs };
  return {
    colecciones: cols.map((c) => {
      const suyos = pendientes.filter((g) => g.coleccionId === c.id);
      return suyos.reduce((acc, g) => anadirElemento(acc, 'guardado', g.id), c);
    }),
    guardados: gs.map((g) => (g && g.coleccionId ? { ...g, coleccionId: null } : g)),
  };
}

/* ── Estadísticas ──────────────────────────────────────────────────────────

   *"Mostrar información sencilla… **No crear estadísticas complejas.**"*

   ⚠️ **Y una estadística es una vista, no un dato** (E3 F13 y EH F35): aquí no
   se guarda ni una cifra. *"Elementos organizados"* son elementos **distintos**
   —una nota en tres colecciones está organizada una vez, no tres— y salen de
   resolver, así que un elemento borrado deja de contar solo. */
export function estadisticasColecciones(colecciones, datos = {}) {
  const todas = lista(colecciones);
  const activas = todas.filter((c) => !c.archivada);
  const distintos = new Set();
  let mayor = null;
  for (const c of todas) {
    const resueltos = elementosDeColeccion(c, datos);
    for (const r of resueltos) distintos.add(`${r.tipo}·${r.ref.id}`);
    if (resueltos.length > 0 && (!mayor || resueltos.length > mayor.elementos)) {
      mayor = { id: c.id, nombre: c.nombre, elementos: resueltos.length };
    }
  }
  return {
    total: todas.length,
    activas: activas.length,
    archivadas: todas.length - activas.length,
    elementosOrganizados: distintos.size,
    /* ⚠️ `null`, no un cero ni un nombre inventado: sin ninguna colección con
       contenido **no hay** "la que más tiene" (la lección de `null` no es `[]`,
       E3 F13 y EH F25). */
    coleccionMasGrande: mayor,
  };
}

/** La línea del lanzador. `null` cuando no hay nada: *"solo mostrar datos reales
 *  cuando existan"*. */
export function lineaColecciones(colecciones, datos = {}) {
  const e = estadisticasColecciones(colecciones, datos);
  if (e.total === 0) return null;
  const partes = [`${e.total} ${e.total === 1 ? 'colección' : 'colecciones'}`];
  if (e.elementosOrganizados > 0) {
    partes.push(`${e.elementosOrganizados} ${e.elementosOrganizados === 1 ? 'elemento organizado' : 'elementos organizados'}`);
  }
  if (e.archivadas > 0) partes.push(`${e.archivadas} archivada${e.archivadas === 1 ? '' : 's'}`);
  return partes.join(' · ');
}

/* ── Los estados vacíos ────────────────────────────────────────────────────

   ⚠️ **Un vacío sin salida es una pantalla rota** (EH F41): los dos llevan su
   botón. Los textos son los del enunciado, palabra por palabra. */
export const VACIO_COLECCIONES = {
  titulo: 'Organiza tu biblioteca',
  frase: 'Crea una colección para reunir notas, documentos, ideas y recursos relacionados.',
  boton: 'Nueva colección',
};

export const VACIO_DENTRO = {
  titulo: 'Esta colección está vacía',
  frase: 'Empieza añadiendo contenido de tu Biblioteca.',
  boton: 'Añadir contenido',
};

/* ── El aislamiento, dicho ─────────────────────────────────────────────────

   *"MUY IMPORTANTE. Una colección únicamente puede relacionar elementos del
   mismo usuario. Nunca permitir: Usuario A → Colección A → Elemento de Usuario
   B. Aplicar RLS y validaciones necesarias."*

   ⚠️ **El aislamiento es de la base de datos, nunca de la pantalla** (EH F43 y
   E3 F15). Aquí no hace falta ni una validación nueva: `resolverElemento` solo
   sabe mirar dentro del objeto que le pasan, que es la biblioteca **cargada para
   esta sesión** desde la fila de `app_data` de este usuario. No existe una
   consulta por id que pueda alcanzar la fila de otro. */
export const AISLAMIENTO_COLECCIONES = {
  donde: 'La clave `biblioteca` de `app_data`, una fila por usuario.',
  politicas: 'Las cuatro de `app_data`: `auth.uid() = user_id`.',
  porQue: 'Una referencia se resuelve dentro de la biblioteca ya cargada de este usuario; no hay ninguna consulta por id que pueda salir de su fila.',
  tablasNuevas: 0,
};

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────

   *"NO HACER: carpetas anidadas, colecciones dentro de colecciones, IA,
   etiquetado automático, recomendaciones automáticas, sincronización externa,
   compartición pública. La estructura debe mantenerse sencilla."* */
export const NO_EN_COLECCIONES = [
  { que: 'Carpetas anidadas y colecciones dentro de colecciones', porQue: 'el enunciado las prohíbe: la estructura se mantiene plana.' },
  { que: 'IA, etiquetado automático y recomendaciones', porQue: 'el enunciado las prohíbe, y la regla 7 del proyecto dice que la IA nunca se dispara sola.' },
  { que: 'Sincronización externa y compartición pública', porQue: 'el enunciado las prohíbe; compartir además sacaría datos de la fila del usuario.' },
  { que: 'Un sistema de favoritos propio', porQue: '*"no crear un sistema de favoritos específico para Colecciones"*: `favorita` es el mismo campo por elemento que ya usan Guardados, Documentos y Libros.' },
];

/* ── Lo que sigue guardándose donde ya estaba ──────────────────────────────

   Ni una tabla nueva, ni un SQL que Josué tenga que ejecutar. */
export const DONDE_SE_GUARDA_COLECCIONES = [
  { que: 'La colección y sus relaciones', donde: 'la clave `biblioteca` de `app_data`, lista `colecciones`', nuevo: false },
  { que: 'Los elementos referenciados', donde: 'donde ya vivían: `biblioteca.libros`, `.apuntes`, `.enlaces`, `.ideas`, `.documentos` y la clave `bibliotecaArchivos`', nuevo: false },
];
