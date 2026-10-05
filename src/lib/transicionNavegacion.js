import { normalizarPila } from './navegacion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F2 — NAVEGACIÓN, TRANSICIONES Y CONTINUIDAD ESPACIAL

   *"La aplicación debe sentirse como un único espacio continuo. NO debe
   percibirse como «cerrar una página → abrir otra»."*

   🚨 **LA AUDITORÍA DE LA NAVEGACIÓN REAL (apartado 1), ANTES DE TOCAR NADA.**
   JosStyle **no tiene router** (NAVO F1): navega con una pila de React, y
   `tab` es lo de arriba de la pila. Lo que pasaba al moverse por ella:
     · **Entrar en un módulo** deslizaba la pantalla desde la derecha
       (`module-enter`, Fase N1/N2)… y **volver también**: Inicio → Tareas →
       atrás pintaba Inicio como si se entrara en él otra vez —la cascada de
       sus tarjetas incluida—, que es justo lo que el apartado 6 prohíbe
       (*"estás volviendo, no estás entrando otra vez"*).
     · **Cambiar de sección** con la barra de abajo no tenía transición
       ninguna en Inicio y en los hubs, y en Ajustes deslizaba desde la
       derecha como si fuera un nivel más hondo.
     · 🐛 **El scroll no se tocaba nunca**: abrir un módulo desde Inicio con la
       página bajada dejaba el módulo a media altura, y volver dejaba Inicio
       arriba del todo (apartado 13: *"usuario entra → vuelve → pantalla
       aparece arriba inesperadamente"*).
     · 🐛 **No había ni un límite de error fuera de Fitness**: una excepción al
       pintar una pantalla dejaba la aplicación en blanco, sin barra de abajo
       para salir (apartado 18).
     · La barra de abajo cambiaba de color de golpe y **no tenía indicador**.

   Así que esta librería decide **qué clase de movimiento es** cada cambio de
   la pila —la pregunta del apartado 24: *"qué está cambiando, de dónde viene,
   a dónde va, qué relación espacial tiene"*—, y el resto (las clases de
   `index.css`, el hook de `src/components/navegacionMotion.js` y `App.jsx`)
   solo la obedece. Funciones puras: se prueban en Node.
   =========================================================================== */

/* ───────────────────────────────────────────────────────────────────────────
   1 · LOS CUATRO TIPOS DE NAVEGACIÓN (apartados 5, 6, 8 y 24)

   *"NO utilices siempre slide izquierda/derecha. La navegación debe sentirse
   inteligente."* Cada tipo tiene su movimiento porque cada uno dice una cosa
   distinta del espacio:
   ─────────────────────────────────────────────────────────────────────────── */
export const TIPOS_NAVEGACION = {
  entrar: {
    id: 'entrar', clase: 'module-enter', preset: 'pageEnter',
    que: 'Abrir algo desde donde estás: un nivel más hondo.',
    movimiento: 'Llega desde la derecha y un poco por delante (escala), en `slow`: comunica profundidad (apartado 8). Es la entrada de la Fase N1/N2, que ya funcionaba.',
    scroll: 'Empieza arriba: es una pantalla nueva.',
  },
  volver: {
    id: 'volver', clase: 'nav-vuelve', preset: 'pageBack',
    que: 'Volver a donde estabas.',
    movimiento: 'Llega desde la izquierda —el lado del que salió—, más corto (`normal`) y sin escala, y lo que ya habías visto NO repite su entrada: las tarjetas de un hub, la cabecera y la barra de volver aparecen en su sitio (apartado 6).',
    scroll: 'Donde lo dejaste (apartado 13).',
  },
  seccion: {
    id: 'seccion', clase: 'nav-seccion', preset: 'sectionSwitch',
    que: 'Cambiar de sección con la barra de abajo.',
    movimiento: 'Un fundido corto con un leve ascenso, sin desplazamiento lateral: Inicio, Bienestar, Vida, Gestión y Ajustes son hermanas, no una dentro de otra (apartado 5). Empieza ya visible a medias para que no haya un instante vacío entre una y otra (apartado 28: flashes).',
    scroll: 'Empieza arriba.',
  },
  quieto: {
    id: 'quieto', clase: null, preset: null,
    que: 'Mismo sitio con otro foco (un enlace a algo de dentro de la misma pantalla).',
    movimiento: 'Ninguno: no es una transición de página (apartado 15). Lo que cambie dentro lo cuenta su propia transición de contenido.',
    scroll: 'No se toca.',
  },
};

const idsDe = (pila) => normalizarPila(pila).map((e) => e.id);

/**
 * Qué clase de movimiento es pasar de `antes` a `despues`.
 *
 * `principal` dice si lo ha pedido la barra de abajo (que **reinicia** la pila,
 * NAVO F1) y `principales` son sus destinos (Inicio, las áreas y Ajustes).
 *  · La pila nueva es un trozo de la anterior → **volver** (atrás, o abrir algo
 *    que ya estaba más abajo, que `abrir()` recorta). ⚠️ Salvo que lo pida la
 *    barra estando en otra sección principal: Vida → Inicio son hermanas, y eso
 *    es **seccion**. Desde un módulo de Vida, tocar Vida sí es volver a su hub.
 *  · La pide la barra y no es volver → **seccion**.
 *  · Crece por arriba → **entrar**.
 *  · Los mismos ids (cambia solo el foco) → **quieto**.
 */
export function tipoDeNavegacion(antes, despues, { principal = false, principales = [] } = {}) {
  const a = idsDe(antes);
  const d = idsDe(despues);
  if (a.join('>') === d.join('>')) return 'quieto';
  const esTrozo = d.length < a.length && d.every((x, i) => x === a[i]);
  if (esTrozo) {
    if (principal && principales.includes(a[a.length - 1])) return 'seccion';
    return 'volver';
  }
  if (principal) return 'seccion';
  return 'entrar';
}

/** La clase de `index.css` que lleva el contenedor de la pantalla en cada tipo. */
export const claseDeNavegacion = (tipo) => (TIPOS_NAVEGACION[tipo] ? TIPOS_NAVEGACION[tipo].clase : null) || '';

/* ───────────────────────────────────────────────────────────────────────────
   2 · LO QUE NO SE REPITE AL VOLVER (apartado 6)

   Las entradas que una pantalla hace al montarse. Al **volver** a ella se
   terminan en el acto (la Web Animations API: `finish()`), así que aparece
   como la dejaste. ⚠️ Solo en ese momento: lo que entre después —el mes
   siguiente del calendario, otra área de Fitness— anima como siempre. Por eso
   no es una regla de CSS colgada del contenedor, que se quedaría puesta
   mientras estés en la pantalla.
   ─────────────────────────────────────────────────────────────────────────── */
export const ENTRADAS_QUE_NO_SE_REPITEN = [
  { keyframe: 'hubCardIn', clase: 'hub-card', que: 'La cascada de tarjetas de un hub (y de las plaquitas de la Biblioteca, Productividad…)' },
  { keyframe: 'hubHeaderIn', clase: 'hub-header', que: 'La cabecera de un área' },
  { keyframe: 'backBarIn', clase: 'back-bar', que: 'La barra de «← Volver»' },
  { keyframe: 'fitEntra', clase: 'fit-entra', que: 'El área de Fitness que estaba abierta' },
  { keyframe: 'calendarMonthIn', clase: 'calendar-month-grid', que: 'La rejilla del mes del Calendario' },
];
const KEYFRAMES_NO_SE_REPITEN = new Set(ENTRADAS_QUE_NO_SE_REPITEN.map((x) => x.keyframe));

/** ¿Es ésta una animación de entrada que no se repite al volver? (por su nombre de `@keyframes`). */
export const esEntradaQueNoSeRepite = (nombre) => KEYFRAMES_NO_SE_REPITEN.has(String(nombre || ''));

/* ───────────────────────────────────────────────────────────────────────────
   3 · EL SCROLL (apartado 13)

   Quien hace scroll es **la página** (SC F1), así que se apunta `window.scrollY`
   por pantalla de la pila. La clave es la ruta hasta ella —`hoy>area-vida`—, no
   solo su id: así, si se vuelve a la misma pantalla por otro camino, no hereda
   la posición de otro recorrido. ⚠️ Vive en la memoria de la sesión, nunca en
   `app_data` (NAVO F1, EH F40): por dónde has pasado no es un dato tuyo.
   ─────────────────────────────────────────────────────────────────────────── */
export const claveDeScroll = (pila) => idsDe(pila).join('>');

/**
 * A dónde se lleva la página al llegar: arriba al entrar o al cambiar de
 * sección, donde estaba al volver, y `null` (no tocar) si no ha cambiado de
 * pantalla.
 */
export function destinoDeScroll(tipo, memoria, clave) {
  if (tipo === 'quieto') return null;
  if (tipo !== 'volver') return 0;
  const y = memoria && typeof memoria.get === 'function' ? Number(memoria.get(clave)) : NaN;
  return Number.isFinite(y) && y > 0 ? Math.round(y) : 0;
}

/**
 * Se olvida lo que ya no está en el camino: solo se guardan las pantallas por
 * debajo de la actual (a las que se puede volver). Volver a entrar en algo de
 * lo que se salió es entrar de nuevo, y empieza arriba.
 */
export function podarMemoriaDeScroll(memoria, clave) {
  if (!memoria || typeof memoria.forEach !== 'function') return memoria;
  const ruta = String(clave || '');
  [...memoria.keys()].forEach((k) => {
    const esAntepasado = ruta === k || ruta.startsWith(`${k}>`);
    if (!esAntepasado) memoria.delete(k);
  });
  return memoria;
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · EL INDICADOR DE LA BARRA DE ABAJO (apartados 2 y 3)

   *"Preferir: indicador → se desplaza hacia la nueva posición."* Una sola
   pastilla que viaja de pestaña a pestaña (`transform`, en CSS), en vez de un
   resaltado que desaparece en una y aparece en otra. Sin pestaña activa —un
   módulo que no es de ningún área—, se apaga en su sitio.
   ─────────────────────────────────────────────────────────────────────────── */
export function indiceDePestana(ids, activa) {
  if (!Array.isArray(ids) || activa === null || activa === undefined) return null;
  const i = ids.indexOf(activa);
  return i === -1 ? null : i;
}

/** El estilo del indicador: su ancho es el de una pestaña y se mueve por porcentajes de sí mismo. */
export function estiloDelIndicador(indice, total) {
  const n = Math.max(1, Number(total) || 1);
  const visible = Number.isInteger(indice) && indice >= 0 && indice < n;
  return {
    width: `${100 / n}%`,
    transform: `translateX(${(visible ? indice : 0) * 100}%)`,
    opacity: visible ? 1 : 0,
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · LO QUE SE MIRÓ Y CÓMO QUEDA (apartados 7, 10–12, 17–23)
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F2 = [
  { que: 'Routing', hay: 'No hay router: una pila de React (NAVO F1). `tab` es lo de arriba.', queda: 'Cada cambio de la pila se clasifica (`tipoDeNavegacion`) y el contenedor de la pantalla lleva su clase.' },
  { que: 'Barra de abajo', hay: 'Cinco pestañas que reinician la pila; el color cambiaba con 220 ms y no había indicador.', queda: 'Una pastilla que viaja de pestaña a pestaña, el icono se encoge un poco al pulsar y la pestaña activa lleva `aria-current`.' },
  { que: 'Atrás de la aplicación', hay: 'La barra «← …» desapila (NAVO F1).', queda: 'Vuelve desde la izquierda, sin repetir entradas y al scroll de antes.' },
  { que: 'Atrás del navegador y el gesto del sistema', hay: 'JosStyle se instala como aplicación (`display: standalone`): en el iPhone no hay botón de atrás del navegador. Fuera de ahí, el gesto sale de la aplicación porque no hay `history.pushState` (E3 F22).', queda: 'Sigue declarado (C-53): meterlo es cambiar la navegación de toda la aplicación, y a medias sería peor.' },
  { que: 'Modales, hojas y su arrastre', hay: 'Unas cuarenta ventanas que aparecen de golpe; ninguna hoja se arrastra (FIT F42).', queda: 'Son la F6 (capas) y la F5/F8 (gestos y física). La F2 garantiza que navegar con una abierta no la deja atrapada: se monta en `document.body` y la cierra quien navega.' },
  { que: 'Datos cargando al navegar', hay: 'Todo se carga una vez al abrir la aplicación (con su esqueleto, E3 F14); navegar no espera a nada.', queda: 'No hay pantalla vacía que tapar. Las fotos y las URL firmadas ya tienen su propio estado de carga.' },
  { que: 'Error durante la transición', hay: 'Fuera de Fitness, un fallo al pintar dejaba la aplicación en blanco.', queda: 'Cada pantalla va dentro de un límite de error (`AreaSegura`): sale su aviso con «Reintentar», y la barra de abajo sigue ahí para salir.' },
  { que: 'Hover', hay: 'Ni una clase `hover:` en las pantallas: nada depende del puntero.', queda: 'Y desde la F2 Tailwind solo genera `hover:` donde hay un puntero de verdad (`hoverOnlyWhenSupported`), para que un `hover:` futuro no se quede pegado en el iPhone.' },
  { que: 'Escritorio y teclado', hay: 'La misma navegación; al tocar una tarjeta que desaparece, el foco se perdía.', queda: 'Si el foco se pierde al navegar, pasa a la pantalla nueva sin moverla (`preventScroll`).' },
  { que: 'Rendimiento', hay: 'Cada pantalla se monta y se desmonta; HubView limpia su temporizador.', queda: 'Un solo escuchador de scroll para toda la navegación, y ninguna animación de JavaScript que acumular: las de página son CSS y las de entrada se terminan, no se encadenan.' },
];

export const NO_EN_F2 = [
  { que: 'Animar la entrada y salida de las ~40 ventanas, con su fondo', porque: 'Es la F6 (profundidad y capas). Tiene `Presencia` y los presets `modalEnter`/`sheetEnter` de la F1 esperándola.' },
  { que: 'Arrastrar una hoja y soltarla con su velocidad', porque: 'Son la F5 (el gesto) y la F8 (la física al soltar). Hoy ninguna hoja se arrastra, y un asa que no arrastra sería la regla 8.' },
  { que: 'Tarjeta → detalle con el elemento compartido', porque: 'Es la F7 (continuidad). `compartirElemento` (F1) está probado y esperando.' },
  { que: 'Filtros, periodos y orden que recolocan una lista', porque: 'Es la F10 (el diseño que cambia: FLIP). La F2 hace la parte de las pestañas de una pantalla (`contenido-cambia`).' },
  { que: '`history.pushState` y el gesto de atrás del sistema', porque: 'C-53: instalada en el iPhone no existe; fuera, cambia la navegación de toda la aplicación y lo decide Josué (E3 F22).' },
];
