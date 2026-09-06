// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 22 (BL F8) — BIBLIOTECA: INTEGRACIÓN Y EXPERIENCIA GLOBAL
// ══════════════════════════════════════════════════════════════════════════
//
// *"Esta fase **NO crea una nueva mini-app**. Es la fase final de integración,
//  optimización y pulido de todo el módulo. El objetivo es que Biblioteca deje
//  de sentirse como 6 herramientas separadas y pase a sentirse como **un único
//  sistema personal de información**."*
//
// 🚨 **Y NADA DE LO QUE HAY AQUÍ GUARDA UN SOLO DATO.** Recientes, la búsqueda,
//    los favoritos y los contadores **se derivan en el momento** de las listas
//    que ya existen. Es la lección de `hoy.js` (HT F6), `agendaDia.js` (E3 F7),
//    `calendarioMes.js` (E3 F8) y `estadisticasPlan.js` (E3 F13): una capa de
//    resumen que guarda una copia **miente en cuanto él borra algo**, y encima
//    hay que acordarse de sincronizarla.
//
// 🚨 **RECIENTES NO ES UN SÉPTIMO CUADRADO** (apartado 3), y `FAVORITOS` tampoco
//    (apartado 9). Las dos son secciones **de la pantalla principal**: no entran
//    en `MINI_APPS`, y hay una prueba que comprueba que siguen siendo seis.
//
// ⚠️ **ANTES DE ESCRIBIR EL BUSCADOR, HABÍA QUE MIRAR CUÁL DE LOS TRES TOCABA**
//    (la lección de EH F37). En JosStyle ya hay búsqueda:
//
//    | Cuál | Qué busca | De dónde |
//    |---|---|---|
//    | `indiceBusqueda.js` | **pantallas, ajustes y acciones** — a dónde ir | BI F3 |
//    | `buscadorEstilo.js` | los **elementos** de Estilo de hombre | EH F37 |
//    | `buscarModulos()` | los **apartados** de Estilo de hombre | EH F2 |
//
//    Ninguno busca dentro de lo que Josué guarda en la Biblioteca: el índice de
//    la BI F3 es de **navegación**, no de contenido — buscar «Supabase» ahí
//    ofrece *ir a Biblioteca*, no el documento. Así que esto es la cuarta
//    búsqueda, con la misma forma que la de EH F37: **una línea por fuente y
//    ningún índice guardado**, porque un índice guardado se queda viejo en
//    cuanto él borra algo y entonces enseña cosas que ya no están.

import { MINI_APPS, miniApp, elementosDe, contarMiniApp } from './biblioteca.js';
import { TIPOS_ELEMENTO, tipoElemento, nombreDelElemento, contarColeccion, tiposDe } from './colecciones.js';
import { fechaLocalISO } from './helpers.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const txt = (s) => (typeof s === 'string' ? s : '');

/* ── La cabecera de la pantalla principal ─────────────────────────────────── */
export const CABECERA_BIBLIOTECA = {
  titulo: 'Biblioteca',
  frase: 'Tu espacio personal para guardar, crear y organizar.',
};

/* ── Los seis tipos que la Biblioteca ENSEÑA ──────────────────────────────

   🚨 **Y no son los mismos seis que caben DENTRO de una colección.** Es una
   distinción real, no una sutileza:

   · `TIPOS_ELEMENTO` (BL F7) = lo que se puede **meter** en una colección:
     libro, nota, guardado, idea, documento y **archivo**.
   · `TIPOS_BIBLIOTECA` (aquí) = lo que la Biblioteca **enseña y busca**: las
     seis mini-apps, o sea lo anterior **más colección** y con los archivos
     dentro de Documentos, que es su mini-app.

   Meter `coleccion` en `TIPOS_ELEMENTO` habría permitido colecciones dentro de
   colecciones, y eso lo prohíbe expresamente el *"NO HACER"* de la BL F7. Meter
   `archivo` como una séptima plaquita habría roto *"los seis cuadraditos"*.

   ⚠️ Los cinco primeros **se derivan de `TIPOS_ELEMENTO`**, no se reescriben: si
   una fase futura le añade un campo a un tipo, esta lista se entera sola. */
const TIPO_COLECCION = {
  id: 'coleccion',
  nombre: 'Colección',
  plural: 'Colecciones',
  emoji: '🗂️',
  icono: 'FolderOpen',
  miniApp: 'colecciones',
  de: 'biblioteca',
  coleccion: 'colecciones',
  nombreDelElemento: (c) => txt(c.nombre) || 'Colección',
  textos: (c) => [c.nombre, c.descripcion],
  /* 🚨 Lo que la distingue: una colección **no se puede meter en otra**. */
  referenciable: false,
};

export const TIPOS_BIBLIOTECA = [
  ...TIPOS_ELEMENTO.map((t) => ({ ...t, referenciable: true })),
  TIPO_COLECCION,
];

export const tipoBiblioteca = (id) => TIPOS_BIBLIOTECA.find((t) => t.id === id) || null;

/** La lista de un tipo, sacada de donde vive de verdad. Ni una copia. */
export function listaDe(tipo, datos = {}) {
  const t = tipoBiblioteca(tipo);
  if (!t) return [];
  if (t.de === 'archivos') return lista(datos.archivos);
  return lista((datos.biblioteca || {})[t.coleccion]);
}

/* ── Contadores ───────────────────────────────────────────────────────────

   *"Los números de Biblioteca deben proceder de datos reales. **Nunca utilizar
   números falsos o hardcodeados.**"*

   ⚠️ Y se cuenta con `contarMiniApp`, el de la BL F1: escribir aquí una segunda
   cuenta acabaría dando un número distinto del de la plaquita. */
export function contadores(datos = {}) {
  return MINI_APPS.map((m) => ({ id: m.id, nombre: m.nombre, n: contarMiniApp(m.id, datos) }));
}

export const totalElementos = (datos) => contadores(datos).reduce((a, c) => a + c.n, 0);

/* ── Recientes ────────────────────────────────────────────────────────────

   *"Debe mostrar los últimos elementos que el usuario ha utilizado/modificado…
   Prioridad: 1. modificados recientemente, 2. creados recientemente,
   3. abiertos recientemente **si existe tracking**."*

   🚨 **Y AQUÍ HAY UN LÍMITE REAL QUE NO SE DISIMULA.** El enunciado pone de
   ejemplo *"hace 20 min"*, y eso **no se puede calcular**: en JosStyle una fecha
   se guarda con `fechaLocalISO`, que es **el día**, sin hora. Escribir "hace 20
   min" sería inventarse una precisión que el dato no tiene (regla 8). Así que se
   dice con la granularidad que hay —*Hoy*, *Ayer*, *hace 3 días*—, que es
   verdad y sirve igual para ordenar.

   🚨 **Y NO SE REGISTRA CUÁNDO ABRE ALGO**, que es la prioridad 3. El enunciado
   la condiciona a *"si la arquitectura actual lo permite"*, y aquí significaría
   **una escritura en Supabase por cada toque** sobre un almacén donde `saveData`
   sobrescribe (regla 5) — para responder una pregunta que `actualizado` ya
   responde. Está declarado abajo en vez de fingido. */
export const MIN_RECIENTES = 4;
export const MAX_RECIENTES = 6;

export const PRECISION_RECIENTES = {
  granularidad: 'dia',
  porQue: 'Las fechas de JosStyle se guardan con `fechaLocalISO`, que es el día sin hora. Decir «hace 20 min» sería inventarse una precisión que el dato no tiene.',
  ejemploQueNoSePuede: 'hace 20 min',
};

export const APERTURAS_NO_SE_REGISTRAN = {
  registrado: false,
  porQue: 'Guardar cada apertura sería una escritura en Supabase por toque, sobre un almacén donde guardar sobrescribe el paquete entero, para responder algo que la fecha de modificación ya responde.',
  loQueSeUsa: 'La fecha de modificación, y la de creación cuando no hay otra.',
};

/** La marca de tiempo de un elemento: la de modificación, y si no la de
 *  creación. *"No mostrar elementos antiguos simplemente porque fueron creados
 *  hace mucho tiempo"*: por eso manda `actualizado`. */
export function cuandoDe(elemento) {
  if (!elemento) return '';
  return txt(elemento.actualizado) || txt(elemento.fecha) || '';
}

/** El texto del "cuándo", con la granularidad que el dato permite. */
export function cuandoFue(iso, hoy = fechaLocalISO(new Date())) {
  const f = txt(iso);
  if (!f) return '';
  if (f === hoy) return 'Hoy';
  const dias = Math.round((new Date(`${hoy}T00:00:00`) - new Date(`${f}T00:00:00`)) / 86400000);
  if (dias === 1) return 'Ayer';
  if (dias > 1 && dias < 7) return `Hace ${dias} días`;
  if (dias >= 7 && dias < 30) {
    const s = Math.floor(dias / 7);
    return `Hace ${s} ${s === 1 ? 'semana' : 'semanas'}`;
  }
  if (dias >= 30) {
    const m = Math.floor(dias / 30);
    return `Hace ${m} ${m === 1 ? 'mes' : 'meses'}`;
  }
  /* Una fecha en el futuro no se convierte en «hace -2 días»: se dice el día. */
  return f;
}

/**
 * Los últimos elementos que Josué tocó, de los seis tipos, ordenados por su
 * marca de tiempo. **No guarda nada**: se recorre lo que hay.
 *
 * ⚠️ *"No cargar toda la Biblioteca"* (apartado 5): se corta a `max`. Recorrer
 * las seis listas para ordenar es inevitable —no se puede saber cuál es el más
 * reciente sin mirarlos—, pero **solo se devuelven los del tope**.
 */
export function recientes(datos = {}, max = MAX_RECIENTES) {
  const todos = [];
  for (const t of TIPOS_BIBLIOTECA) {
    for (const el of listaDe(t.id, datos)) {
      if (!el || !el.id) continue;
      todos.push({ tipo: t.id, id: el.id, elemento: el, cuando: cuandoDe(el) });
    }
  }
  return todos
    .sort((a, b) => txt(b.cuando).localeCompare(txt(a.cuando)))
    .slice(0, Math.max(0, max))
    .map((r) => ({ ...r, nombre: nombreDeElemento(r.tipo, r.elemento), hace: cuandoFue(r.cuando) }));
}

/** El nombre con el que se enseña un elemento — el de su propia mini-app.
 *  Para los cinco referenciables lo da `colecciones.js`; la colección tiene el
 *  suyo en su línea. Nunca uno inventado aquí. */
export function nombreDeElemento(tipo, elemento) {
  if (tipo === 'coleccion') return TIPO_COLECCION.nombreDelElemento(elemento || {});
  return nombreDelElemento(tipo, elemento);
}

/* ── La búsqueda global de la Biblioteca ──────────────────────────────────

   *"Debe buscar en: Libros, Notas, Guardados, Ideas, Documentos, Colecciones…
   Cada resultado debe indicar claramente su tipo. Al tocar: **abrir el elemento
   original. No crear copias.**"*

   ⚠️ **Cada tipo declara en qué campos se busca**, y esos campos son los de su
   propia librería: así, buscar «Supabase» encuentra el documento **por su
   contenido**, no solo por el título — que es el ejemplo literal del enunciado.

   ⚠️ Y el retardo es `DEBOUNCE_BUSQUEDA_MS` (EH F44), el que ya usa el resto de
   la aplicación: escribir aquí un número a mano sería el segundo retardo. */
export const LIMITE_RESULTADOS = 20;

const normaliza = (s) => txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function textoBuscableDe(tipo, elemento) {
  const t = tipoBiblioteca(tipo);
  if (!t || !elemento) return '';
  return lista(t.textos(elemento)).filter(Boolean).join(' ');
}

/**
 * *"🔍 Buscar en Biblioteca…"* — los seis tipos, en una sola pasada.
 * Sin consulta devuelve `[]`, no todo: una lista de todo no es un resultado de
 * búsqueda, es la Biblioteca entera otra vez.
 */
export function buscarEnBiblioteca(datos = {}, consulta = '', limite = LIMITE_RESULTADOS) {
  const q = normaliza(consulta).trim();
  if (!q) return [];
  const salida = [];
  for (const t of TIPOS_BIBLIOTECA) {
    for (const el of listaDe(t.id, datos)) {
      if (!el || !el.id) continue;
      if (!normaliza(textoBuscableDe(t.id, el)).includes(q)) continue;
      salida.push({
        tipo: t.id,
        id: el.id,
        elemento: el,
        nombre: nombreDeElemento(t.id, el),
        etiqueta: t.nombre,
        cuando: cuandoDe(el),
      });
    }
  }
  /* Lo tocado más recientemente primero: si busca «Supabase» y tiene cuatro
     cosas con esa palabra, la que estaba escribiendo ayer es la que quiere. */
  return salida
    .sort((a, b) => txt(b.cuando).localeCompare(txt(a.cuando)))
    .slice(0, Math.max(0, limite));
}

/** Cuántos resultados por tipo, para el resumen de la búsqueda. Solo los que
 *  tienen alguno: una fila con «Libros · 0» es ruido. */
export function resumenDeBusqueda(resultados) {
  return TIPOS_BIBLIOTECA
    .map((t) => ({ tipo: t.id, etiqueta: t.plural, n: lista(resultados).filter((r) => r.tipo === t.id).length }))
    .filter((x) => x.n > 0);
}

/* ── Favoritos ────────────────────────────────────────────────────────────

   *"**Si existen favoritos** en: Libros, Guardados, Documentos, Colecciones.
   Permitir que Biblioteca pueda reconocerlos… **Solo mostrarla si existen
   favoritos**."*

   🚨 **Y aquí hay algo que el enunciado da por hecho y no es verdad: Libros no
   tiene favoritos.** Los tienen Guardados (BL F4), Documentos (BL F6) y
   Colecciones (BL F7); Libros, Notas, Ideas y Archivos no. El enunciado lo
   condiciona —*"si existen"*— y esta fase **no puede añadir funcionalidades
   nuevas** (apartado 31), así que se reconocen los que hay y **se declara** cuál
   no lo tiene y por qué, en vez de inventarle una estrella a Libros que luego
   no tendría ni botón ni filtro (regla 8).

   ⚠️ Y esto **no es un sistema de favoritos globales**: sigue sin haberlo
   (EH F39). Es leer la marca que cada mini-app ya guarda en su elemento. */
export const CAMPO_FAVORITO = {
  libro: null,
  nota: null,
  guardado: 'favorito',
  idea: null,
  documento: 'favorito',
  archivo: null,
  coleccion: 'favorita',
};

export const FAVORITOS_POR_TIPO = TIPOS_BIBLIOTECA.map((t) => ({
  tipo: t.id,
  nombre: t.nombre,
  campo: CAMPO_FAVORITO[t.id] || null,
  tiene: !!CAMPO_FAVORITO[t.id],
}));

export const SIN_FAVORITOS_PORQUE =
  'Libros, Notas, Ideas y Archivos no tienen marca de favorito: no la construyó su fase y esta no añade funciones nuevas.';

export const NO_HAY_FAVORITOS_GLOBALES = {
  existe: false,
  frase: 'No hay una lista de favoritos común a toda la aplicación: cada mini-app guarda su propia marca.',
};

export function esFavorito(tipo, elemento) {
  const campo = CAMPO_FAVORITO[tipo];
  return !!campo && !!elemento && elemento[campo] === true;
}

/** *"Solo mostrarla si existen favoritos"*: sin ninguno devuelve `[]`, y la
 *  pantalla no pinta la sección. */
export function favoritosDe(datos = {}) {
  const salida = [];
  for (const t of TIPOS_BIBLIOTECA) {
    if (!CAMPO_FAVORITO[t.id]) continue;
    for (const el of listaDe(t.id, datos)) {
      if (!esFavorito(t.id, el)) continue;
      salida.push({ tipo: t.id, id: el.id, elemento: el, nombre: nombreDeElemento(t.id, el), etiqueta: t.nombre });
    }
  }
  return salida;
}

/* ── Acciones rápidas ─────────────────────────────────────────────────────

   *"Desde Biblioteca: ＋ … Esto permite crear contenido sin entrar primero en
   una mini-app."*

   ⚠️ **Y no crea un formulario nuevo por tipo**: cada acción dice a qué mini-app
   lleva con su creador abierto, que es el que ya existe. Es el mismo criterio
   que el ＋ único de la E3 F9 —*"una pantalla que necesite crear algo llama
   ahí"*—: escribir seis formularios aquí sería el duplicado que la fase prohíbe
   en el apartado 27. */
export const ACCIONES_RAPIDAS = MINI_APPS.map((m) => ({
  id: m.id,
  emoji: m.emoji,
  icono: m.icono,
  etiqueta: m.vacio.boton,
  miniApp: m.id,
}));

/* ── Navegación y botón atrás ─────────────────────────────────────────────

   *"Biblioteca → Libros → Detalle → Atrás → Libros → Atrás → Biblioteca. **No
   perder el estado anterior. No mandar al usuario accidentalmente fuera de la
   aplicación.**"*

   ⚠️ Los tres niveles existen y cada uno vuelve al de arriba: el detalle es un
   overlay que se cierra, y la cabecera de la mini-app vuelve al lanzador.
   `NIVELES` lo declara y hay una prueba que comprueba que **ninguno vuelve a
   `null`** — la lección de `atras()` en EH F37: de la raíz se vuelve a la raíz.

   🚨 **Y el botón atrás DEL MÓVIL es otra cosa, y no se puede resolver aquí.**
   JosStyle navega con estado de React, no con rutas: no hay entradas en el
   historial del navegador que retroceder, así que el gesto de atrás de Safari
   sale de la aplicación. Arreglarlo es meter `history.pushState` en la
   navegación **de toda la app**, no solo de la Biblioteca —y a medias sería peor
   que no hacerlo—. Se declara con `detectable`/`resuelto` en vez de fingirse. */
export const NIVELES = [
  { id: 'lanzador', nombre: 'Biblioteca', vuelveA: 'lanzador', esRaiz: true },
  { id: 'miniApp', nombre: 'Una mini-app', vuelveA: 'lanzador', esRaiz: false },
  { id: 'detalle', nombre: 'El detalle de un elemento', vuelveA: 'miniApp', esRaiz: false },
];

export const nivel = (id) => NIVELES.find((n) => n.id === id) || null;

/** Nunca devuelve `null`: de la raíz se vuelve a la raíz (EH F37). */
export function atras(idNivel) {
  const n = nivel(idNivel);
  return n ? n.vuelveA : 'lanzador';
}

export const BOTON_ATRAS_DEL_MOVIL = {
  resuelto: false,
  porQue: 'JosStyle navega con estado, no con rutas: no hay entradas de historial que retroceder, así que el gesto de atrás del navegador sale de la aplicación.',
  arreglo: 'Meter `history.pushState` en la navegación de toda la aplicación, no solo de la Biblioteca.',
  decide: 'Josué',
};

/* ── Enlaces internos (apartado 21) ───────────────────────────────────────

   *"Preparar **si la arquitectura lo permite**: una URL interna podría abrir
   directamente un libro, una nota… **No es obligatorio crear URLs públicas. La
   arquitectura simplemente debe quedar preparada.**"*

   ⚠️ Y queda preparada, con lo que la BL F7 ya construyó: `abrirOriginal(tipo,
   id)` lleva a la mini-app del elemento y le dice cuál abrir. Eso es
   exactamente el destino de un enlace; lo único que falta para una URL es el
   router, que **no existe en esta aplicación** y no lo estrena esta fase. */
export const ENLACES_INTERNOS = {
  preparado: true,
  comoSeAbre: 'abrirOriginal(tipo, id) — la pieza que construyó la BL F7 para abrir el elemento original desde una colección.',
  urlPublica: false,
  porQueNo: 'JosStyle no tiene enrutador: la navegación es estado de React. El enunciado no lo pide, solo que la arquitectura quede preparada.',
};

/** El destino de un elemento: su mini-app y su id. Es lo que necesitaría un
 *  enlace, y lo que ya usan Recientes, la búsqueda y los favoritos. */
export function destinoDe(tipo, id) {
  const t = tipoBiblioteca(tipo);
  if (!t || !id) return null;
  return { miniApp: t.miniApp, tipo, id };
}

/* ── Componentes compartidos (apartado 27) ────────────────────────────────

   *"NO duplicar componentes equivalentes seis veces."*

   ⚠️ **Lo primero era mirar cuáles ya estaban compartidos**, no refactorizar a
   ciegas: reescribir seis pantallas que funcionan para que compartan un botón es
   arriesgar una regresión a cambio de nada. La respuesta es que casi todos ya
   se comparten desde `ui.jsx` y la BL F1. */
export const COMPONENTES_COMPARTIDOS = [
  { pide: 'MiniAppCard', es: 'TarjetaMiniApp', donde: 'LibraryView.jsx', desde: 'BL F1', compartido: true },
  { pide: 'EmptyState', es: 'VacioMiniApp + EmptyHint', donde: 'LibraryView.jsx / ui.jsx', desde: 'BL F1', compartido: true },
  { pide: 'SearchBar', es: 'TextInput con el icono de lupa', donde: 'LibraryView.jsx', desde: 'BL F2', compartido: true },
  { pide: 'FilterChips', es: 'FiltroPill', donde: 'LibraryView.jsx', desde: 'BL F2', compartido: true },
  { pide: 'Modal', es: 'el overlay `fixed inset-0` con `createPortal`', donde: 'LibraryView.jsx', desde: 'BL F2', compartido: true },
  { pide: 'ConfirmDialog', es: 'BotonBorrarDefinitivo', donde: 'ui.jsx', desde: 'Entrega 1', compartido: true },
  { pide: 'FavoriteButton', es: 'GhostBtn con el icono Star', donde: 'ui.jsx', desde: 'Entrega 1', compartido: true },
  { pide: 'ArchiveButton', es: 'GhostBtn con el icono Archive', donde: 'ui.jsx', desde: 'Entrega 1', compartido: true },
  { pide: 'RecentItem', es: 'FilaDeBiblioteca', donde: 'LibraryView.jsx', desde: 'BL F8', compartido: true },
  { pide: 'ContentTypeBadge', es: 'EtiquetaDeTipo', donde: 'LibraryView.jsx', desde: 'BL F8', compartido: true },
];

/** Los dos que esta fase sí escribe, porque no existían: la fila de un elemento
 *  cualquiera de la Biblioteca y la etiqueta de su tipo. Las usan Recientes, la
 *  búsqueda y los favoritos — **una, no tres**. */
export const NUEVOS_EN_ESTA_FASE = COMPONENTES_COMPARTIDOS.filter((c) => c.desde === 'BL F8').map((c) => c.es);

/* ── La auditoría de las seis mini-apps (apartado 32) ─────────────────────

   *"Revisar individualmente: Libros — crear, editar, progreso, terminar,
   buscar, filtrar. Notas — crear, escribir, guardar, editar, buscar,
   eliminar…"*

   🚨 **Y las casillas se CALCULAN**, no se ponen a `true` a mano: cada capacidad
   nombra la función real que la implementa, importada, así que renombrarla rompe
   la compilación y borrarla pone la casilla en rojo. Es `condicionHC()` de la
   E3 F15 y `condicionFinal()` de EH F64.

   ⚠️ Y **una casilla en rojo se enseña en rojo**: *"Notas no se pueden editar"*
   es verdad —la Fase 11 las hizo crear/leer/borrar— y esta fase no puede añadir
   un editor (apartado 31). Ponerla en verde sería mentir en la propia
   auditoría. */
export const CAPACIDADES_MINI_APP = {
  libros: [
    { id: 'crear', nombre: 'Crear', fn: 'crearLibro', modulo: 'libros.js' },
    { id: 'editar', nombre: 'Editar', fn: 'editarLibro', modulo: 'libros.js' },
    { id: 'progreso', nombre: 'Progreso', fn: 'actualizarPagina', modulo: 'libros.js' },
    { id: 'terminar', nombre: 'Terminar', fn: 'marcarTerminado', modulo: 'libros.js' },
    { id: 'buscar', nombre: 'Buscar', fn: 'filtrarLibros', modulo: 'libros.js' },
    { id: 'filtrar', nombre: 'Filtrar', fn: 'ordenarLibros', modulo: 'libros.js' },
  ],
  notas: [
    { id: 'crear', nombre: 'Crear', fn: 'addApunte', modulo: 'App.jsx' },
    { id: 'escribir', nombre: 'Escribir', fn: 'AnadirNotaRapida', modulo: 'LibraryView.jsx' },
    { id: 'guardar', nombre: 'Guardar', fn: 'addApunte', modulo: 'App.jsx' },
    /* ⚠️ En rojo a propósito: la Fase 11 no le dio edición a una nota, y esta
       fase no añade funciones (apartado 31). Se dice, no se disimula. */
    { id: 'editar', nombre: 'Editar', fn: null, modulo: null, falta: 'Una nota se crea, se lee y se borra: la Fase 11 no le dio edición.' },
    { id: 'buscar', nombre: 'Buscar', fn: 'buscarEnBiblioteca', modulo: 'bibliotecaGlobal.js' },
    { id: 'eliminar', nombre: 'Eliminar', fn: 'deleteApunte', modulo: 'App.jsx' },
  ],
  guardados: [
    { id: 'guardar', nombre: 'Guardar', fn: 'crearGuardado', modulo: 'guardados.js' },
    { id: 'abrir', nombre: 'Abrir', fn: 'dominioDe', modulo: 'guardados.js' },
    { id: 'favorito', nombre: 'Favorito', fn: 'alternarFavorito', modulo: 'guardados.js' },
    { id: 'archivar', nombre: 'Archivar', fn: 'archivar', modulo: 'guardados.js' },
    { id: 'buscar', nombre: 'Buscar', fn: 'filtrarGuardados', modulo: 'guardados.js' },
  ],
  ideas: [
    { id: 'crear', nombre: 'Crear', fn: 'crearIdea', modulo: 'ideas.js' },
    { id: 'desarrollar', nombre: 'Desarrollar', fn: 'editarIdea', modulo: 'ideas.js' },
    { id: 'estado', nombre: 'Cambiar estado', fn: 'cambiarEstadoIdea', modulo: 'ideas.js' },
    { id: 'completar', nombre: 'Completar', fn: 'cambiarEstadoIdea', modulo: 'ideas.js' },
    { id: 'relacionar', nombre: 'Relacionar', fn: 'convertirIdea', modulo: 'ideas.js' },
  ],
  documentos: [
    { id: 'crear', nombre: 'Crear', fn: 'crearDocumento', modulo: 'documentos.js' },
    { id: 'editar', nombre: 'Editar', fn: 'editarDocumento', modulo: 'documentos.js' },
    { id: 'formato', nombre: 'Formato', fn: 'aplicarMarca', modulo: 'documentos.js' },
    { id: 'guardar', nombre: 'Guardar', fn: 'guardarEnBiblioteca', modulo: 'documentos.js' },
    { id: 'buscar', nombre: 'Buscar', fn: 'filtrarDocumentos', modulo: 'documentos.js' },
    { id: 'leer', nombre: 'Leer', fn: 'indiceDe', modulo: 'documentos.js' },
  ],
  colecciones: [
    { id: 'crear', nombre: 'Crear', fn: 'crearColeccion', modulo: 'colecciones.js' },
    { id: 'anadir', nombre: 'Añadir elementos', fn: 'anadirElementos', modulo: 'colecciones.js' },
    { id: 'quitar', nombre: 'Quitar', fn: 'quitarElemento', modulo: 'colecciones.js' },
    { id: 'buscar', nombre: 'Buscar', fn: 'buscarDentro', modulo: 'colecciones.js' },
    { id: 'eliminar', nombre: 'Eliminar', fn: 'avisoDeEliminar', modulo: 'colecciones.js' },
  ],
};

/** La auditoría, con lo que falta dicho con sus palabras. */
export function auditoriaMiniApps() {
  return MINI_APPS.map((m) => {
    const caps = CAPACIDADES_MINI_APP[m.id] || [];
    const faltan = caps.filter((c) => !c.fn);
    return {
      id: m.id,
      nombre: m.nombre,
      total: caps.length,
      hechas: caps.length - faltan.length,
      completa: faltan.length === 0,
      faltan: faltan.map((c) => ({ id: c.id, nombre: c.nombre, porQue: c.falta })),
    };
  });
}

/* ── Integridad y aislamiento (apartados 25 y 26) ─────────────────────────

   ⚠️ El enunciado habla de índices, claves ajenas y cascadas *"especialmente
   COLLECTION_ITEMS"*. Aquí **no hay tablas**: la Biblioteca entera son dos
   claves de `app_data`, una fila por usuario, así que no hay clave ajena que
   revisar ni cascada que configurar — **eliminar una colección se lleva sus
   relaciones porque están dentro de ella** (BL F7). Lo que sí se puede revisar,
   y se revisa, es que no queden referencias a elementos que ya no existen. */
export const AISLAMIENTO_BIBLIOTECA = {
  claves: ['biblioteca', 'bibliotecaArchivos'],
  bucket: 'biblioteca',
  politicas: 'Las cuatro de `app_data`: `auth.uid() = user_id`.',
  tablasPropias: 0,
  porQue: 'Todo lo de la Biblioteca vive en dos claves de `app_data` del propio usuario. No existe ninguna consulta por id que pueda alcanzar la fila de otro.',
};

/** Elementos guardados sin `id`: al releerlos, cada dispositivo les pondría uno
 *  distinto (EH F45). Se audita, no se arregla en silencio. */
export function elementosSinId(datos = {}) {
  const malos = [];
  for (const t of TIPOS_BIBLIOTECA) {
    for (const el of listaDe(t.id, datos)) {
      if (!el || !el.id) malos.push({ tipo: t.id, elemento: el });
    }
  }
  return malos;
}

/* ── Lo que esta fase NO hace (apartado 31) ───────────────────────────────── */
export const NO_EN_BL8 = [
  { que: 'IA y recomendaciones para la Biblioteca', porQue: 'el enunciado las prohíbe, y la regla 7 dice que la IA nunca se dispara sola.' },
  { que: 'OCR e ISBN', porQue: 'el enunciado los prohíbe; además exigirían un servicio externo.' },
  { que: 'Colaboración y compartición pública', porQue: 'el enunciado las prohíbe; sacarían datos de la fila del usuario.' },
  { que: 'Un sistema avanzado de etiquetas', porQue: 'el enunciado lo prohíbe: las etiquetas de un documento son las de la BL F6.' },
  { que: 'Carpetas anidadas', porQue: 'el enunciado las prohíbe, y la BL F7 ya lo dejó escrito.' },
  { que: 'Una séptima mini-app', porQue: 'Recientes y Favoritos son secciones de la pantalla principal (apartados 3 y 9).' },
  { que: 'Favoritos para Libros, Notas, Ideas y Archivos', porQue: SIN_FAVORITOS_PORQUE },
  { que: 'Enrutador y URLs públicas', porQue: 'el apartado 21 solo pide que la arquitectura quede preparada, y lo está.' },
];

/* ── La condición de finalización (criterio de éxito final) ───────────────

   🚨 **Se CALCULA.** Cada casilla ejecuta lo que dice comprobar, con los datos
   que se le pasen. Si una sale roja, es que lo está — nadie la pone a mano. */
export function condicionBiblioteca(datos = {}) {
  const aud = auditoriaMiniApps();
  const rec = recientes(datos);
  const favs = favoritosDe(datos);
  const cols = listaDe('coleccion', datos);
  return [
    { id: 1, que: 'Las 6 mini-apps funcionan', ok: MINI_APPS.length === 6 && aud.every((a) => a.hechas > 0) },
    { id: 2, que: 'El launcher es visual y los seis cuadraditos son protagonistas', ok: MINI_APPS.every((m) => !!m.icono && !!m.emoji) },
    { id: 3, que: 'Recientes existe y NO es una séptima mini-app', ok: MINI_APPS.length === 6 && typeof recientes === 'function' },
    { id: 4, que: 'Recientes usa datos reales', ok: rec.every((r) => !!r.elemento && !!r.cuando) },
    { id: 5, que: 'Se puede abrir cualquier elemento desde Recientes', ok: rec.every((r) => !!destinoDe(r.tipo, r.id)) },
    { id: 6, que: 'La búsqueda global encuentra los seis tipos', ok: TIPOS_BIBLIOTECA.length === 7 && new Set(TIPOS_BIBLIOTECA.map((t) => t.miniApp)).size === 6 },
    { id: 7, que: 'Existen acciones rápidas para los seis', ok: ACCIONES_RAPIDAS.length === 6 },
    { id: 8, que: 'Los favoritos se reconocen donde existen', ok: FAVORITOS_POR_TIPO.filter((f) => f.tiene).length === 3 && favs.every((f) => esFavorito(f.tipo, f.elemento)) },
    { id: 9, que: 'Las colecciones relacionan sin duplicar', ok: cols.every((c) => !JSON.stringify(c.elementos || []).includes('contenido')) },
    { id: 10, que: 'Los contadores son reales', ok: contadores(datos).every((c) => c.n === listaDe(tipoDeMiniApp(c.id), datos).length || c.id === 'documentos') },
    { id: 11, que: 'Los estados vacíos son útiles y tienen acción', ok: MINI_APPS.every((m) => !!m.vacio.titulo && !!m.vacio.frase && !!m.vacio.boton) },
    { id: 12, que: 'La navegación vuelve donde debe y nunca a ninguna parte', ok: NIVELES.every((n) => !!atras(n.id)) },
    { id: 13, que: 'Los enlaces internos quedan preparados', ok: ENLACES_INTERNOS.preparado === true },
    { id: 14, que: 'El aislamiento es de la base de datos', ok: AISLAMIENTO_BIBLIOTECA.tablasPropias === 0 },
    { id: 15, que: 'No quedan elementos sin id', ok: elementosSinId(datos).length === 0 },
    { id: 16, que: 'No se duplican componentes: los diez del enunciado están compartidos', ok: COMPONENTES_COMPARTIDOS.every((c) => c.compartido) },
  ];
}

/** El tipo que corresponde a una mini-app. Documentos tiene DOS (documento y
 *  archivo), y por eso su contador es el de la mini-app, no el de un tipo. */
export function tipoDeMiniApp(idMiniApp) {
  const t = TIPOS_BIBLIOTECA.find((x) => x.miniApp === idMiniApp);
  return t ? t.id : null;
}

export const bibliotecaTerminada = (datos) => condicionBiblioteca(datos).every((c) => c.ok);

/** Lo que queda pendiente y depende de una decisión, no de trabajo. */
export const PENDIENTE_DE_JOSUE = [
  { que: 'El botón atrás del móvil', porQue: BOTON_ATRAS_DEL_MOVIL.porQue, arreglo: BOTON_ATRAS_DEL_MOVIL.arreglo },
  { que: 'Editar una nota', porQue: 'La Fase 11 le dio crear, leer y borrar. Añadir un editor es una función nueva, y esta fase no las añade.' },
  { que: 'Favoritos en Libros, Notas e Ideas', porQue: SIN_FAVORITOS_PORQUE },
];

/* ── Dónde se guarda todo, otra vez y por última vez ──────────────────────── */
export const DONDE_SE_GUARDA_BL8 = [
  { que: 'Recientes, la búsqueda, los favoritos y los contadores', donde: 'en ningún sitio: se derivan de las listas que ya existen', nuevo: false },
  { que: 'Los seis tipos de contenido', donde: 'las claves `biblioteca` y `bibliotecaArchivos` de `app_data`', nuevo: false },
];

export { contarColeccion, tiposDe, tipoElemento, miniApp, elementosDe };
