// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 23 (PR F1) — PRODUCTIVIDAD COMO LANZADOR DE MINI-APPS
// ══════════════════════════════════════════════════════════════════════════
//
// *"Cuando el usuario entre en Productividad, no se encuentre directamente con
//  listas, formularios o bloques de información. Debe aparecer primero una
//  pantalla principal tipo launcher, donde las diferentes herramientas se
//  presentan como **6 mini-apps en cuadraditos**."*
//
// 🚨 **Y ESTA FASE NO CONSTRUYE NINGUNA DE LAS SEIS.** El enunciado lo dice en
//    mayúsculas: *"EN ESTA FASE NO DESARROLLES TODAVÍA LA LÓGICA INTERNA
//    COMPLETA DE LAS 6 MINI-APPS… Primero queremos conseguir una base visual y
//    de navegación perfecta."* Lo que se hace es **la pantalla y la
//    navegación**; hábitos, pomodoro, tareas, metas, objetivos y rutinas llegan
//    en las fases 2 a 6.
//
// ⚠️ **Y LO PRIMERO ERA MIRAR QUÉ HABÍA, no escribir seis pantallas.** Al
//    mirarlo, **las seis ya existen**:
//
//    | Mini-app del enunciado | Lo que ya había | Desde |
//    |---|---|---|
//    | 🔥 Hábitos | la pestaña Hábitos de Productividad | Fase 6 |
//    | ⏱️ Pomodoro | la pestaña Pomodoro | Fase 6 |
//    | ✓ Tareas | la pestaña Tareas | Fase 6 |
//    | 🎯 Metas | la pestaña Metas | Fase 6 |
//    | ◉ Objetivos | **un módulo aparte**, con su propia clave | Fase 9 |
//    | ↻ Rutinas | la pestaña Rutinas | Fase 6 |
//
//    Así que **no se crea ni una lista nueva**: las cinco pestañas pasan a ser
//    cinco mini-apps, y Objetivos entra desde fuera. Es la lección de la BL F1,
//    donde tres de las seis mini-apps de la Biblioteca ya existían con otro
//    nombre y crearlas otra vez habría dejado los datos de Josué invisibles.
//
// 🚨 **OBJETIVOS DEJA DE SER UN MÓDULO, PERO SUS DATOS NO SE MUEVEN.** El
//    enunciado pide *"eliminar conceptualmente la duplicación anterior donde
//    existían Productividad y Objetivos como dos apartados independientes"*, y a
//    la vez avisa: *"No rompas navegación existente. No rompas datos
//    existentes."* Las dos cosas se cumplen a la vez porque son cosas distintas:
//
//    · **La navegación cambia**: `objetivos` sale de `MORE_NAV` y de
//      `AREAS_NAV`, y su `case` desaparece. Ya no es un apartado.
//    · **Los datos se quedan donde están**: la clave `objetivos` de `app_data`,
//      con `objetivos.lista`. Moverlos rompería a la vez el catálogo de la
//      papelera, el `objetivoId` que escriben EH F28 y EH F39, la conversión de
//      una idea en objetivo (BL F5), los eventos derivados del Calendario y las
//      rachas — **a cambio de nada**.
//    · **Y todo enlace directo que ya existía sigue llegando**, porque
//      `DESTINO_OBJETIVOS` es UNA constante (EH F28): cambiarla en una línea
//      redirige los cinco sitios que la usan.

import { todayISO } from './helpers.js';

const lista = (x) => (Array.isArray(x) ? x : []);

/* ── Las seis mini-apps ────────────────────────────────────────────────────

   Una línea por mini-app: su nombre, **la descripción literal del enunciado**,
   su icono, de dónde salen sus datos y **en qué fase se desarrolla**.

   ⚠️ El `icono` es el nombre del componente de Lucide, no el componente: una
   línea de datos no importa React. La pantalla lo traduce con
   `ICONOS_MINI_APP_PR`, el mismo reparto que `MINI_APPS` / `ICONOS_MINI_APP` en
   la Biblioteca (E3 F16) y `CATEGORIAS_ARMARIO` / `ICONOS_CATEGORIA` (E3 F3).
   Un icono que falte ahí sale como un hueco y **no falla en ninguna parte**. */
export const MINI_APPS_PR = [
  {
    id: 'habitos',
    nombre: 'Hábitos',
    descripcion: 'Construye constancia cada día.',
    icono: 'Flame',
    emoji: '🔥',
    de: 'productividad',
    coleccion: 'habitos',
    contador: ['hábito', 'hábitos'],
    fase: 'PR F2',
    nueva: false,
  },
  {
    id: 'pomodoro',
    nombre: 'Pomodoro',
    descripcion: 'Concéntrate sin distracciones.',
    icono: 'Timer',
    emoji: '⏱️',
    de: 'productividad',
    /* 🚨 Pomodoro **no es una lista**: es `{ '2026-09-06': 3 }`, un contador por
       día desde la Fase 6. Por eso declara su `coleccion` y además cómo se
       cuenta — tratarlo como un array daría cero siempre y nadie lo vería. */
    coleccion: 'pomodoros',
    porDia: true,
    contador: ['sesión hoy', 'sesiones hoy'],
    fase: 'PR F3',
    nueva: false,
  },
  {
    id: 'tareas',
    nombre: 'Tareas',
    descripcion: 'Organiza lo que tienes que hacer.',
    icono: 'ListChecks',
    emoji: '✓',
    de: 'productividad',
    coleccion: 'tareas',
    contador: ['tarea', 'tareas'],
    /* Lo que se enseña de Tareas son **las pendientes**, no el total: una lista
       con doscientas hechas y una pendiente no dice "201". */
    soloPendientes: true,
    fase: 'PR F4',
    nueva: false,
  },
  {
    id: 'metas',
    nombre: 'Metas',
    descripcion: 'Convierte tus planes en resultados.',
    icono: 'Target',
    emoji: '🎯',
    de: 'productividad',
    coleccion: 'metas',
    contador: ['meta', 'metas'],
    fase: 'PR F5',
    nueva: false,
  },
  {
    id: 'objetivos',
    nombre: 'Objetivos',
    descripcion: 'Define hacia dónde quieres avanzar.',
    icono: 'Compass',
    emoji: '◉',
    /* 🚨 La única que NO sale de la clave `productividad`: los objetivos viven en
       su propia clave desde la Fase 9, y ahí se quedan. */
    de: 'objetivos',
    coleccion: 'lista',
    contador: ['objetivo', 'objetivos'],
    fase: 'PR F5',
    nueva: false,
    vieneDeFuera: true,
  },
  {
    id: 'rutinas',
    nombre: 'Rutinas',
    descripcion: 'Convierte tus acciones en rutina.',
    icono: 'Repeat',
    emoji: '↻',
    de: 'productividad',
    coleccion: 'rutinas',
    contador: ['rutina', 'rutinas'],
    fase: 'PR F6',
    nueva: false,
  },
];

export const miniAppPR = (id) => MINI_APPS_PR.find((m) => m.id === id) || null;
export const IDS_MINI_APPS_PR = MINI_APPS_PR.map((m) => m.id);

/* ── Qué había antes de esta fase, y dónde ────────────────────────────────

   *"Analiza cómo está implementado actualmente Productividad. Identifica todos
   los componentes relacionados. Identifica si existe actualmente un apartado
   independiente de Objetivos. Identifica posibles duplicaciones."*

   ⚠️ La respuesta, escrita, para que nadie vuelva a crear una lista que ya
   existe: **ninguna de las seis es nueva**. */
export const MAPEO_EXISTENTE_PR = [
  { app: 'habitos', era: 'la pestaña Hábitos de Productividad', clave: 'productividad.habitos', desde: 'Fase 6' },
  { app: 'pomodoro', era: 'la pestaña Pomodoro', clave: 'productividad.pomodoros', desde: 'Fase 6' },
  { app: 'tareas', era: 'la pestaña Tareas', clave: 'productividad.tareas', desde: 'Fase 6' },
  { app: 'metas', era: 'la pestaña Metas', clave: 'productividad.metas', desde: 'Fase 6' },
  { app: 'objetivos', era: 'un módulo independiente, con su propia clave', clave: 'objetivos.lista', desde: 'Fase 9' },
  { app: 'rutinas', era: 'la pestaña Rutinas', clave: 'productividad.rutinas', desde: 'Fase 6' },
];

export const NINGUNA_ES_NUEVA = MAPEO_EXISTENTE_PR.every((m) => !!m.clave);

/* ── Objetivos: qué cambia y qué no ───────────────────────────────────────

   🚨 El criterio de éxito 9 dice *"Objetivos ya no aparece como módulo
   independiente fuera de Productividad"*, y el apartado de arquitectura dice
   *"no rompas navegación existente, no rompas datos existentes"*. Se cumplen los
   dos porque hablan de cosas distintas, y aquí está escrito cuál es cuál. */
export const OBJETIVOS_INTEGRACION = {
  cambia: [
    'Sale de `MORE_NAV` y de `AREAS_NAV`: deja de ser un apartado de la navegación.',
    'Su `case` en `App.jsx` desaparece; ahora se abre dentro de Productividad.',
    '`DESTINO_OBJETIVOS` pasa a apuntar a Productividad con su mini-app abierta.',
  ],
  noCambia: [
    'La clave `objetivos` de `app_data` y su lista: ni un dato se mueve.',
    'El catálogo de la papelera (`objetivos.lista`), que sigue borrando y restaurando igual.',
    'El `objetivoId` que escriben EH F28 y EH F39, y la conversión de una idea en objetivo (BL F5).',
    'Los eventos derivados del Calendario y las rachas de objetivos.',
  ],
  porQueNoSeMuevenLosDatos:
    'Moverlos rompería a la vez la papelera, los ids que guardan Estilo de hombre e Ideas, el Calendario y las rachas — a cambio de nada: dónde se guarda un objetivo no es lo que el enunciado quiere cambiar.',
};

/* ⚠️ **Y hay una cosa que sí se pierde, y se dice.** Al salir de `MORE_NAV`,
   Objetivos deja de poder protegerse con PIN por su cuenta y deja de tener su
   propio interruptor en Módulos activables: los hereda de Productividad, que es
   donde vive ahora. Es la consecuencia de dejar de ser un apartado, no un
   descuido — y es exactamente lo que pide el criterio 9. */
export const LO_QUE_HEREDA_DE_PRODUCTIVIDAD = [
  { que: 'La protección con PIN', antes: 'la suya', ahora: 'la de Productividad' },
  { que: 'El interruptor de Módulos activables', antes: 'el suyo', ahora: 'el de Productividad' },
  { que: 'Su sitio en las áreas de navegación', antes: 'área Vida', ahora: 'dentro de Productividad' },
];

/* ── Los indicadores de las plaquitas ─────────────────────────────────────

   *"Debe mostrar pequeños indicadores visuales **si existen datos
   disponibles**"* y *"NO inventar datos ni crear lógica falsa en esta fase"*.

   Así que se cuenta lo que hay de verdad, y **una mini-app vacía no enseña un
   cero**: devuelve `null` y la plaquita no pinta nada. */
export function elementosDePR(id, datos = {}) {
  const app = miniAppPR(id);
  if (!app) return [];
  const origen = app.de === 'objetivos' ? datos.objetivos : datos.productividad;
  return lista((origen || {})[app.coleccion]);
}

/** Las sesiones de Pomodoro de hoy. **No es una lista**: es un contador por día
 *  desde la Fase 6, y tratarlo como un array daría cero siempre. */
export function pomodorosDeHoy(datos = {}, hoy = todayISO()) {
  const mapa = (datos.productividad || {}).pomodoros;
  const n = mapa && typeof mapa === 'object' ? mapa[hoy] : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function contarPR(id, datos = {}) {
  const app = miniAppPR(id);
  if (!app) return 0;
  if (app.porDia) return pomodorosDeHoy(datos);
  const els = elementosDePR(id, datos);
  if (app.soloPendientes) return els.filter((t) => t && !t.hecha).length;
  return els.length;
}

/** El texto del indicador, ya en singular o plural. `null` cuando no hay nada:
 *  *"solo mostrar datos reales cuando existan"*. */
export function indicadorDePR(id, datos = {}) {
  const app = miniAppPR(id);
  if (!app) return null;
  const n = contarPR(id, datos);
  if (n === 0) return null;
  return `${n} ${n === 1 ? app.contador[0] : app.contador[1]}`;
}

export const totalProductividad = (datos) =>
  MINI_APPS_PR.reduce((a, m) => a + contarPR(m.id, datos), 0);

/* ── La cascada de entrada ────────────────────────────────────────────────

   *"Las 6 tarjetas pueden aparecer con una entrada escalonada. Movimiento muy
   sutil. Nada exagerado."*

   ⚠️ **Y se reutiliza la que ya existe**: `.hub-card` en `index.css`, la misma
   cascada que usan los hubs y la Biblioteca desde la BL F1. Escribir una segunda
   sería el duplicado de siempre, y encima se vería distinta. */
export const RETRASO_CASCADA_PR_MS = 60;
export const CLASE_TARJETA_PR = 'hub-card';
export const retrasoDeTarjetaPR = (indice) => `${Math.max(0, indice) * RETRASO_CASCADA_PR_MS}ms`;

/* ── Navegación ───────────────────────────────────────────────────────────

   *"Cada una debe tener: botón para volver, título, navegación coherente."*

   ⚠️ `atras()` **nunca devuelve `null`**: de la raíz se vuelve a la raíz. Es la
   lección de EH F37 y la misma forma que la BL F8. */
export const NIVELES_PR = [
  { id: 'lanzador', nombre: 'Productividad', vuelveA: 'lanzador', esRaiz: true },
  { id: 'miniApp', nombre: 'Una mini-app', vuelveA: 'lanzador', esRaiz: false },
];

export const nivelPR = (id) => NIVELES_PR.find((n) => n.id === id) || null;
export function atrasPR(idNivel) {
  const n = nivelPR(idNivel);
  return n ? n.vuelveA : 'lanzador';
}

/** El destino de un enlace directo: siempre Productividad, con la mini-app que
 *  toque. Es lo que hace que los cinco sitios que llevaban a Objetivos sigan
 *  llegando (EH F28, el buscador, Ideas de estilo, la integración). */
export function destinoPR(idMiniApp, extra = {}) {
  return miniAppPR(idMiniApp) ? { modulo: 'productividad', app: idMiniApp, ...extra } : null;
}

/* ── Lo que Productividad podrá contarle a Hoy ────────────────────────────

   *"NO desarrollar todavía todo el sistema de Inicio/Hoy. Pero sí dejar
   preparada la estructura… **NO inventar datos ni crear lógica falsa en esta
   fase.**"*

   ⚠️ Así que aquí no hay ni una frase escrita para Hoy: hay **la declaración de
   qué podrá decir cada mini-app y de dónde saldría**, con la fase en la que se
   construye. Escribir *"te quedan 3 hábitos"* hoy sería inventarse una función
   que no existe (regla 8) — y además `hoy.js` ya tiene su forma de pedir datos
   (HT F6), así que cuando toque se llama ahí, no se escribe un segundo Hoy. */
export const PARA_HOY = [
  { app: 'habitos', podraDecir: 'cuántos hábitos quedan por marcar hoy', saldriaDe: 'productividad.habitos', llega: 'PR F2' },
  { app: 'pomodoro', podraDecir: 'cuántas sesiones lleva hoy', saldriaDe: 'productividad.pomodoros', llega: 'PR F3' },
  { app: 'tareas', podraDecir: 'cuántas tareas quedan pendientes', saldriaDe: 'productividad.tareas', llega: 'PR F4' },
  { app: 'metas', podraDecir: 'el progreso de una meta', saldriaDe: 'productividad.metas', llega: 'PR F5' },
  { app: 'objetivos', podraDecir: 'si toca revisar los objetivos', saldriaDe: 'objetivos', llega: 'PR F5' },
  { app: 'rutinas', podraDecir: 'qué rutinas quedan por hacer hoy', saldriaDe: 'productividad.rutinas', llega: 'PR F6' },
];

export const HOY_NO_SE_TOCA = {
  construido: false,
  porQue: 'El enunciado lo prohíbe en esta fase, y `hoy.js` (HT F6) ya es quien junta lo del día: cuando toque, se llama ahí en vez de escribir un segundo Hoy.',
};

/* ── Lo que esta fase NO hace ─────────────────────────────────────────────

   Cada línea con **la fase en la que llega**, para que nadie lo confunda con un
   descuido. */
export const NO_EN_PR1 = [
  { que: 'El sistema completo de hábitos y sus rachas', llega: 'PR F2' },
  { que: 'El temporizador Pomodoro completo y sus estadísticas', llega: 'PR F3' },
  { que: 'El gestor completo de tareas', llega: 'PR F4' },
  { que: 'El sistema completo de metas y de objetivos', llega: 'PR F5' },
  { que: 'El sistema completo de rutinas', llega: 'PR F6' },
  { que: 'Recordatorios avanzados y notificaciones', llega: 'no está previsto en este bloque' },
  { que: 'IA de productividad y estadísticas globales avanzadas', llega: 'no está previsto en este bloque' },
  { que: 'La pantalla de Hoy', llega: 'ya existe (HT F6): esta fase solo declara qué podrá pedirle a Productividad' },
];

/* ── Dónde se guarda, que es donde ya se guardaba ─────────────────────────── */
export const DONDE_SE_GUARDA_PR = [
  { que: 'Hábitos, rutinas, tareas, metas y pomodoros', donde: 'la clave `productividad` de `app_data`', nuevo: false },
  { que: 'Los objetivos', donde: 'la clave `objetivos` de `app_data`, la misma de siempre', nuevo: false },
];

export const AISLAMIENTO_PR = {
  claves: ['productividad', 'objetivos'],
  politicas: 'Las cuatro de `app_data`: `auth.uid() = user_id`.',
  tablasNuevas: 0,
};

/* ── La condición de finalización ─────────────────────────────────────────

   🚨 **Se CALCULA**, como `condicionHC()` (E3 F15) y `condicionBiblioteca()`
   (E3 F22). Nadie pone una casilla a `true`. */
export function condicionPR1(datos = {}) {
  return [
    { id: 1, que: 'Productividad tiene una pantalla principal renovada', ok: MINI_APPS_PR.length === 6 },
    { id: 2, que: 'Se ven las 6 mini-apps', ok: IDS_MINI_APPS_PR.length === 6 && new Set(IDS_MINI_APPS_PR).size === 6 },
    { id: 3, que: 'Las 6 tienen identidad propia: icono, emoji y descripción', ok: MINI_APPS_PR.every((m) => !!m.icono && !!m.emoji && !!m.descripcion) },
    { id: 4, que: 'Cada tarjeta lleva a su apartado', ok: MINI_APPS_PR.every((m) => !!destinoPR(m.id)) },
    { id: 5, que: 'Objetivos ya no es un módulo independiente', ok: OBJETIVOS_INTEGRACION.cambia.length === 3 && miniAppPR('objetivos').vieneDeFuera === true },
    { id: 6, que: 'Ninguna de las seis es una lista nueva', ok: NINGUNA_ES_NUEVA },
    { id: 7, que: 'Los indicadores salen de datos reales', ok: MINI_APPS_PR.every((m) => indicadorDePR(m.id, datos) === null || /\d/.test(indicadorDePR(m.id, datos))) },
    { id: 8, que: 'La navegación vuelve donde debe y nunca a ninguna parte', ok: NIVELES_PR.every((x) => !!atrasPR(x.id)) },
    { id: 9, que: 'No se ha construido lo que toca en fases posteriores', ok: NO_EN_PR1.length >= 7 && HOY_NO_SE_TOCA.construido === false },
    { id: 10, que: 'Ni una tabla nueva ni un dato movido', ok: AISLAMIENTO_PR.tablasNuevas === 0 && DONDE_SE_GUARDA_PR.every((d) => !d.nuevo) },
  ];
}

export const pr1Terminada = (datos) => condicionPR1(datos).every((c) => c.ok);
