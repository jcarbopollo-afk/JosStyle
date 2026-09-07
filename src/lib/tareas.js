// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 26 (PR F4) — PRODUCTIVIDAD: TAREAS
// ══════════════════════════════════════════════════════════════════════════
//
// *"La prioridad es: abrir → ver qué tengo que hacer → completar → seguir."*
//
// 🚨 **UNA TAREA TENÍA DOS FECHAS, Y POR ESO NO SALÍA EN NINGUNA PARTE.**
//
//    La pantalla de Productividad guardaba `fechaLimite`; **Hoy**
//    (`centroDelDia.tareasDeHoy`), **la Agenda** (`agendaDia`), **el
//    Calendario** (`calendarioMes.tareasDelDia`) y **la vista semanal**
//    (`semana.tareasConRepeticion`) filtran las cuatro por `t.fecha`. Resultado:
//    **una tarea creada en Productividad con fecha para hoy no aparecía en Hoy,
//    ni en la Agenda, ni en el Calendario, ni en la semana** — y una creada
//    desde el Calendario salía aquí *sin fecha*, la última de la lista.
//
//    No lo veía nadie: las dos pantallas se pintan perfectas, cada una con su
//    campo. Es la lección más repetida del proyecto —*"antes de crear una lista,
//    mirar si esa cosa ya existe con otro nombre"*— esta vez sobre un **campo**,
//    y contradecía de frente lo que la E3 F8 dio por cerrado: *"una tarea con
//    fecha sale en Hoy, en la Agenda **y** en el Calendario"*.
//
//    **`fecha` es la única fecha de una tarea.** `normalizarTarea` migra lo
//    guardado con `fechaLimite` y **no vuelve a escribir ese campo**: dejar los
//    dos sincronizados sería el duplicado por la puerta de atrás.
//
// 🚨 **NI UN SEGUNDO MOTOR DE RECURRENCIA.** El enunciado dice *"preparar el
//    modelo para tareas recurrentes… si implementarla es seguro, puede
//    implementarse"*: **ya está implementada** desde la E3 F10, en `semana.js`,
//    sobre `expandirRecurrentes` del Calendario Universal. Aquí se usa; no se
//    reescribe. *"No crear una lógica frágil de duplicación de tareas"* se
//    cumple porque **no existe una tarea por día**: se guarda la regla y una
//    lista de fechas hechas dentro de ella.
//
// 🚨 **NI UN SEGUNDO TEMPORIZADOR.** *"NO duplicar el temporizador dentro de
//    Tareas. Debe abrir el Pomodoro existente."* `iniciarSesion` de
//    `pomodoro.js` ya acepta `tareaId` desde la E3 F25: lo único que hace falta
//    aquí es el botón que lo llama. Hay una prueba que lee este archivo y falla
//    si aparece un `setInterval`, un `Date.now()` de cuenta atrás o un
//    `duracionMs` propio.
//
// ⚠️ **Metas y Objetivos se DECLARAN, no se dejan como dos campos vacíos**
//    (la lección de la E3 F20). *"Preparar opcionalmente goal_id / objective_id
//    pero NO desarrollar todavía la interfaz."* Están en `RELACIONES_FUTURAS`
//    con quién los rellenará y qué falta; una tarea no nace con dos huecos que
//    nadie puede llenar (regla 8).
//
// ⚠️ **La prioridad nunca es solo un color** (*"NO depender exclusivamente del
//    color. Utilizar también iconos, texto, jerarquía"*): cada línea de
//    `PRIORIDADES` trae icono **y** palabra, y el color es un **token**, nunca un
//    hex (regla 2). Es la lección de `etiquetaDeEstado()` en EH F42.

import { todayISO, fechaLocalISO, addDays, uid, fechaValida, horaValida } from './helpers.js';
import { seRepite, instanciaHecha, marcarInstancia } from './semana.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const txt = (s) => (typeof s === 'string' ? s : '');

/* ── Prioridades (apartado «PRIORIDADES») ──────────────────────────────────

   ⚠️ `peso` ordena; `icono` y `nombre` son lo que hace que se distingan **sin
   ver el color**. `token` es el nombre de un token de `tokens.js`, nunca un hex:
   un hex escrito aquí dejaría de seguir el tema en cuanto Josué lo cambie. */
export const PRIORIDADES = [
  { id: 'alta', nombre: 'Alta', icono: '▲', peso: 3, token: 'danger', destacada: true },
  { id: 'media', nombre: 'Media', icono: '＝', peso: 2, token: 'warning', destacada: false },
  { id: 'baja', nombre: 'Baja', icono: '▽', peso: 1, token: 'textMuted', destacada: false },
];

export const PRIORIDAD_POR_DEFECTO = 'media';

export const prioridad = (id) => PRIORIDADES.find((p) => p.id === id) || null;

/** La etiqueta completa de una prioridad: icono **y** palabra. Quien pinte solo
 *  el color se está saltando el apartado de accesibilidad. */
export function etiquetaDePrioridad(id) {
  const p = prioridad(id) || prioridad(PRIORIDAD_POR_DEFECTO);
  return { icono: p.icono, nombre: p.nombre, token: p.token, destacada: p.destacada };
}

/* ── Categorías (apartado «CREAR TAREA») ───────────────────────────────────

   *"Utilizar categorías compatibles con el sistema general cuando sea posible."*

   ⚠️ Por eso cada línea declara **su módulo de JosStyle**, y las que no tienen
   uno lo dicen con `modulo: null` en vez de inventárselo. Así "Estudios" es el
   módulo Estudios y no una etiqueta suelta que casualmente se llama igual. */
export const CATEGORIAS_TAREA = [
  { id: 'estudios', nombre: 'Estudios', icono: '📚', modulo: 'estudios' },
  { id: 'fitness', nombre: 'Fitness', icono: '🏋️', modulo: 'calistenia' },
  { id: 'personal', nombre: 'Personal', icono: '🙂', modulo: null },
  { id: 'trabajo', nombre: 'Trabajo', icono: '💼', modulo: 'negocio' },
  { id: 'casa', nombre: 'Casa', icono: '🏠', modulo: null },
  { id: 'otros', nombre: 'Otros', icono: '•', modulo: null },
];

export const categoriaTarea = (id) => CATEGORIAS_TAREA.find((c) => c.id === id) || null;

/* ── Relaciones que todavía no existen (apartado «INTEGRACIÓN FUTURA») ─────

   *"Preparar opcionalmente goal_id / objective_id pero NO desarrollar todavía
   la interfaz completa de Metas u Objetivos."*

   ⚠️ Se **declara**, no se deja el hueco: la E3 F20 aprendió que un campo que
   nadie puede rellenar es media función (regla 8). Cuando la PR F5 construya
   Metas y Objetivos, `enlazable` pasa a `true` y la tarjeta ofrece el enlace;
   hasta entonces la pantalla dice qué falta si alguien pregunta. */
export const RELACIONES_FUTURAS = [
  {
    campo: 'metaId', hacia: 'productividad.metas', nombre: 'Meta',
    enlazable: false, llega: 'PR F5', porque: 'Metas todavía no es una mini-app: se construye en la fase siguiente.',
  },
  {
    campo: 'objetivoId', hacia: 'objetivos', nombre: 'Objetivo',
    enlazable: false, llega: 'PR F5', porque: 'Objetivos todavía no es una mini-app: se construye en la fase siguiente.',
  },
];

export const relacionFutura = (campo) => RELACIONES_FUTURAS.find((r) => r.campo === campo) || null;

/* ── La tarea ──────────────────────────────────────────────────────────────

   🚨 **`fecha`, nunca `fechaLimite`.** Ver la cabecera. `hora` es opcional y se
   valida con `horaValida`, no con su forma: `'25:99'` encaja con
   `\d{2}:\d{2}` y colocaría la tarea en el minuto 1599 (E3 F8). */
export function crearTarea({
  texto, descripcion = '', fecha = null, hora = '',
  prioridadId = PRIORIDAD_POR_DEFECTO, categoria = null, recurrencia = null,
} = {}) {
  const limpio = txt(texto).trim();
  if (!limpio) return null;
  return normalizarTarea({
    id: uid(),
    texto: limpio,
    descripcion: txt(descripcion).trim(),
    fecha: fechaValida(fecha) ? fecha : null,
    hora: horaValida(hora) ? hora : '',
    prioridad: prioridad(prioridadId) ? prioridadId : PRIORIDAD_POR_DEFECTO,
    categoria: categoriaTarea(categoria) ? categoria : null,
    hecha: false,
    completadaEn: null,
    recurrencia: recurrencia || null,
    creadaEn: new Date().toISOString(),
    actualizadaEn: null,
  });
}

/* 🚨 **El normalizador es quien migra la fecha.** Se ejecuta al cargar, así que
   las tareas que Josué ya tenía guardadas con `fechaLimite` aparecen desde el
   primer render en Hoy, en la Agenda y en el Calendario — sin tocar sus datos a
   mano y sin una migración aparte.

   ⚠️ Y **no vuelve a escribir `fechaLimite`**: mantener los dos campos "por si
   acaso" es exactamente cómo se llegó al fallo. */
export function normalizarTarea(t) {
  if (!t || typeof t !== 'object') return null;
  const id = txt(t.id) || uid();
  const texto = txt(t.texto).trim();
  if (!texto) return null;

  const cruda = fechaValida(t.fecha) ? t.fecha : (fechaValida(t.fechaLimite) ? t.fechaLimite : null);
  const p = prioridad(t.prioridad) ? t.prioridad : PRIORIDAD_POR_DEFECTO;

  return {
    id,
    texto,
    descripcion: txt(t.descripcion).trim(),
    fecha: cruda,
    hora: horaValida(t.hora) ? t.hora : '',
    prioridad: p,
    categoria: categoriaTarea(t.categoria) ? t.categoria : null,
    hecha: !!t.hecha,
    // ⚠️ Una tarea sin hacer no puede llevar fecha de completada: sería una
    // mentira guardada, y las estadísticas la contarían.
    completadaEn: t.hecha && typeof t.completadaEn === 'string' ? t.completadaEn : null,
    recurrencia: normalizarRecurrencia(t.recurrencia),
    creadaEn: typeof t.creadaEn === 'string' ? t.creadaEn : null,
    actualizadaEn: typeof t.actualizadaEn === 'string' ? t.actualizadaEn : null,
    // Los dos enlaces que declara `RELACIONES_FUTURAS`: se conservan si alguien
    // los ha puesto, y no se inventan si no.
    metaId: txt(t.metaId) || null,
    objetivoId: txt(t.objetivoId) || null,
  };
}

/** La recurrencia es la de `semana.js` / `expandirRecurrentes`: aquí solo se
 *  limpia, no se reinterpreta. Sin `frecuencia` no hay recurrencia. */
function normalizarRecurrencia(r) {
  if (!r || typeof r !== 'object' || !txt(r.frecuencia)) return null;
  return {
    ...r,
    frecuencia: r.frecuencia,
    hechas: lista(r.hechas).filter(fechaValida).sort(),
    excepciones: lista(r.excepciones).filter(fechaValida).sort(),
  };
}

export const normalizarTareas = (arr) => lista(arr).map(normalizarTarea).filter(Boolean);

/** Normaliza las tareas **dentro** de `productividad`, que es lo que llama
 *  `App.jsx` al cargar. Devuelve el objeto entero, como los demás
 *  normalizadores del proyecto. */
export function normalizarTareasDe(productividad) {
  if (!productividad || typeof productividad !== 'object') return productividad;
  return { ...productividad, tareas: normalizarTareas(productividad.tareas) };
}

/* ── Fechas (apartado «FECHAS») ────────────────────────────────────────────

   *"La aplicación debe reconocer: Hoy · Mañana · Próximamente · Sin fecha ·
   Vencida. Las tareas vencidas deben destacarse claramente **sin generar una
   interfaz alarmista**."*

   ⚠️ Por eso `vencida` lleva `alarmista: false` escrito y su texto es
   *"Vencida · ayer"*, que es el ejemplo literal del enunciado: ni un signo de
   exclamación ni un "¡atrasada!". */
export const ESTADOS_FECHA = [
  { id: 'vencida', nombre: 'Vencida', orden: 0, alarmista: false },
  { id: 'hoy', nombre: 'Hoy', orden: 1, alarmista: false },
  { id: 'manana', nombre: 'Mañana', orden: 2, alarmista: false },
  { id: 'proximamente', nombre: 'Próximamente', orden: 3, alarmista: false },
  { id: 'sin_fecha', nombre: 'Sin fecha', orden: 4, alarmista: false },
];

export const estadoFecha = (id) => ESTADOS_FECHA.find((e) => e.id === id) || null;

export function estadoDeFecha(tarea, hoy = todayISO()) {
  const f = tarea?.fecha;
  if (!fechaValida(f)) return 'sin_fecha';
  if (f < hoy) return 'vencida';
  if (f === hoy) return 'hoy';
  if (f === addDays(hoy, 1)) return 'manana';
  return 'proximamente';
}

/** Los días que han pasado desde una fecha vencida, para *"Vencida · ayer"*. */
export function diasVencida(tarea, hoy = todayISO()) {
  if (estadoDeFecha(tarea, hoy) !== 'vencida') return 0;
  const a = new Date(`${tarea.fecha}T00:00:00`);
  const b = new Date(`${hoy}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

/** El texto de la fecha de una tarea, tal como se pinta en su tarjeta. */
export function textoDeFecha(tarea, hoy = todayISO()) {
  const estado = estadoDeFecha(tarea, hoy);
  const hora = horaValida(tarea?.hora) ? ` · ${tarea.hora}` : '';
  if (estado === 'sin_fecha') return 'Sin fecha';
  if (estado === 'hoy') return `Hoy${hora}`;
  if (estado === 'manana') return `Mañana${hora}`;
  if (estado === 'vencida') {
    const d = diasVencida(tarea, hoy);
    if (d === 1) return `Vencida · ayer${hora}`;
    return `Vencida · hace ${d} días${hora}`;
  }
  const [, m, dia] = tarea.fecha.split('-');
  return `${Number(dia)}/${Number(m)}${hora}`;
}

/* ── Secciones (apartado «SECCIONES PRINCIPALES») ──────────────────────────

   *"No mostrar todas las secciones simultáneamente si genera demasiado
   contenido."* → la pantalla las pinta plegables; el reparto es de aquí.

   ⚠️ **Vencidas es una sección propia** porque el enunciado la pide aparte
   (*"Vencidas · 2. Las tareas vencidas no deben desaparecer"*), y va la primera
   por el mismo motivo por el que encabeza la ordenación. */
export const SECCIONES_TAREAS = [
  { id: 'vencidas', nombre: 'Vencidas', abiertaPorDefecto: true },
  { id: 'hoy', nombre: 'Hoy', abiertaPorDefecto: true },
  { id: 'proximas', nombre: 'Próximas', abiertaPorDefecto: true },
  { id: 'sin_fecha', nombre: 'Sin fecha', abiertaPorDefecto: false },
  { id: 'completadas', nombre: 'Completadas', abiertaPorDefecto: false },
];

export const seccionTareas = (id) => SECCIONES_TAREAS.find((s) => s.id === id) || null;

/* 🚨 **UNA PANTALLA CON TAREAS NO PUEDE VERSE VACÍA** (la lección de la E3 F14 y
   de EH F41: *"un vacío sin salida es una pantalla rota"*).

   `abiertaPorDefecto` es una **preferencia**, no una orden: si todo lo que hay
   está en una sección que nace plegada, esa sección se abre. Lo cazó el
   recorrido en Chromium, con el caso más normal del mundo —**una tarea sin
   fecha y ninguna más**—: la lista salía vacía, el estado vacío no se disparaba
   porque sí había una tarea, y lo único visible era un rótulo plegado.

   Es el mismo fallo que el hábito que desaparecía de la E3 F24. */
export function aperturaInicial(secciones) {
  const conAlgo = SECCIONES_TAREAS.filter((s) => (secciones?.[s.id] || []).length);
  const abiertas = conAlgo.filter((s) => s.abiertaPorDefecto).map((s) => s.id);
  if (abiertas.length) return abiertas;
  // Nada en las que nacen abiertas: se abren las que tengan algo.
  return conAlgo.map((s) => s.id);
}

const SECCION_DE_ESTADO = { vencida: 'vencidas', hoy: 'hoy', manana: 'proximas', proximamente: 'proximas', sin_fecha: 'sin_fecha' };

export function seccionDeTarea(tarea, hoy = todayISO()) {
  if (tarea?.hecha) return 'completadas';
  return SECCION_DE_ESTADO[estadoDeFecha(tarea, hoy)] || 'sin_fecha';
}

/** Reparte las tareas en sus secciones, ya ordenadas. Devuelve **todas** las
 *  secciones, también las vacías: quien pinta decide si esconde una. */
export function porSecciones(tareas, { hoy = todayISO(), orden = 'inteligente' } = {}) {
  const salida = {};
  SECCIONES_TAREAS.forEach((s) => { salida[s.id] = []; });
  lista(tareas).filter(Boolean).forEach((t) => {
    const s = seccionDeTarea(t, hoy);
    if (salida[s]) salida[s].push(t);
  });
  Object.keys(salida).forEach((s) => {
    salida[s] = ordenarTareas(salida[s], s === 'completadas' ? 'completadas' : orden, hoy);
  });
  return salida;
}

/* ── Ordenación (apartado «ORDENACIÓN») ────────────────────────────────────

   *"Prioridad recomendada: 1 Vencidas · 2 Alta prioridad · 3 Fecha/hora más
   próxima · 4 Media · 5 Baja. Pero permitir que el usuario cambie el criterio."*

   ⚠️ **No es un sistema complejo:** cuatro criterios, y el suyo se guarda en la
   pantalla, no en los datos — *"cuántas se ven" y "cómo se ordena" son de la
   pantalla* (EH F44). */
export const ORDENES_TAREA = [
  { id: 'inteligente', nombre: 'Inteligente', explica: 'Vencidas, luego alta prioridad, luego lo más próximo.' },
  { id: 'fecha', nombre: 'Por fecha', explica: 'Lo más próximo primero; lo que no tiene fecha, al final.' },
  { id: 'prioridad', nombre: 'Por prioridad', explica: 'Alta, media y baja.' },
  { id: 'alfabetico', nombre: 'Alfabético', explica: 'Por el nombre de la tarea.' },
];

export const ordenTarea = (id) => ORDENES_TAREA.find((o) => o.id === id) || null;

export const ORDEN_POR_DEFECTO = 'inteligente';

const clavePrioridad = (t) => -(prioridad(t?.prioridad)?.peso || 0);
// ⚠️ Sin fecha va al final en cualquier orden por fecha: `'9999-99-99'` es mayor
// que cualquier día real, y no se guarda en ninguna parte.
const claveFecha = (t) => `${fechaValida(t?.fecha) ? t.fecha : '9999-99-99'} ${horaValida(t?.hora) ? t.hora : '99:99'}`;
const claveTexto = (t) => txt(t?.texto).toLocaleLowerCase('es');

function comparar(a, b, criterios) {
  for (const c of criterios) {
    const va = c(a);
    const vb = c(b);
    if (va < vb) return -1;
    if (va > vb) return 1;
  }
  return 0;
}

export function ordenarTareas(tareas, orden = ORDEN_POR_DEFECTO, hoy = todayISO()) {
  const arr = lista(tareas).filter(Boolean).slice();
  if (orden === 'fecha') return arr.sort((a, b) => comparar(a, b, [claveFecha, clavePrioridad, claveTexto]));
  if (orden === 'prioridad') return arr.sort((a, b) => comparar(a, b, [clavePrioridad, claveFecha, claveTexto]));
  if (orden === 'alfabetico') return arr.sort((a, b) => comparar(a, b, [claveTexto]));
  if (orden === 'completadas') {
    // Lo último completado, primero: es lo que acaba de hacer.
    return arr.sort((a, b) => comparar(a, b, [(t) => (t?.completadaEn ? `0${t.completadaEn}` : '1'), claveTexto])).reverse();
  }
  // Inteligente — el orden literal del enunciado.
  const rango = (t) => {
    if (estadoDeFecha(t, hoy) === 'vencida') return 0;
    if (t?.prioridad === 'alta') return 1;
    return 2;
  };
  return arr.sort((a, b) => comparar(a, b, [rango, claveFecha, clavePrioridad, claveTexto]));
}

/* ── Filtros y búsqueda (apartados «FILTROS» y «BÚSQUEDA») ─────────────────

   *"Los filtros deben ser visualmente ligeros."* — cinco, y ninguno esconde nada
   que el usuario no haya pedido esconder. */
export const FILTROS_TAREA = [
  { id: 'todas', nombre: 'Todas' },
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'pendientes', nombre: 'Pendientes' },
  { id: 'completadas', nombre: 'Completadas' },
  { id: 'alta', nombre: 'Alta prioridad' },
];

export const filtroTarea = (id) => FILTROS_TAREA.find((f) => f.id === id) || null;

export function filtrarTareas(tareas, { filtro = 'todas', categoria = null, hoy = todayISO() } = {}) {
  let arr = lista(tareas).filter(Boolean);
  if (filtro === 'hoy') arr = arr.filter((t) => !t.hecha && ['hoy', 'vencida'].includes(estadoDeFecha(t, hoy)));
  else if (filtro === 'pendientes') arr = arr.filter((t) => !t.hecha);
  else if (filtro === 'completadas') arr = arr.filter((t) => t.hecha);
  else if (filtro === 'alta') arr = arr.filter((t) => t.prioridad === 'alta');
  if (categoria) arr = arr.filter((t) => t.categoria === categoria);
  return arr;
}

/** *"Permitir buscar por nombre… rápida y funcionar mientras el usuario
 *  escribe."* Busca también en la descripción: escribir media frase que está
 *  dentro de una tarea y que no salga sería peor que no buscar. */
export function buscarTareas(tareas, consulta) {
  const q = txt(consulta).trim().toLocaleLowerCase('es');
  if (!q) return lista(tareas).filter(Boolean);
  return lista(tareas).filter(Boolean).filter((t) => {
    const heno = `${t.texto} ${t.descripcion}`.toLocaleLowerCase('es');
    return heno.includes(q);
  });
}

/* ── Completar (apartado «COMPLETAR TAREA») ────────────────────────────────

   *"Completar inmediatamente… guardar… moverla a completadas… actualizar el
   contador de Hoy."*

   🚨 **Una tarea que se repite NO se completa entera**: se marca **su día**, y
   eso es `marcarInstancia` de `semana.js` (E3 F10, apartado 24). Aquí se
   decide cuál de las dos toca; el motor es el mismo de siempre. */
export function completarTarea(tarea, { fechaISO = null, ahora = null } = {}) {
  if (!tarea) return null;
  if (seRepite(tarea)) return marcarInstancia(tarea, fechaISO || todayISO());
  const hecha = !tarea.hecha;
  return {
    ...tarea,
    hecha,
    // `completadaEn` es un instante, no una cuenta: es lo que permite decir
    // "completadas hoy" sin guardar un contador (E3 F25).
    completadaEn: hecha ? (ahora || new Date().toISOString()) : null,
    actualizadaEn: ahora || new Date().toISOString(),
  };
}

export const tareaHecha = (tarea, fechaISO = todayISO()) => (seRepite(tarea) ? instanciaHecha(tarea, fechaISO) : !!tarea?.hecha);

/* ── Editar y reprogramar (apartados «EDICIÓN» y «TAREAS VENCIDAS») ────────

   *"Reprogramar → Hoy / Mañana / Elegir fecha. Esto debe ser muy rápido."*

   ⚠️ Devuelven **la tarea**, no el estado: quien escribe es `App.jsx`, dueño del
   almacén. Mismo reparto que `accionesHoyAgenda.js` (E3 F9). */
export const DESTINOS_REPROGRAMAR = [
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'manana', nombre: 'Mañana' },
  { id: 'elegir', nombre: 'Elegir fecha', pideFecha: true },
];

export function reprogramar(tarea, destino, { hoy = todayISO(), fecha = null } = {}) {
  if (!tarea) return null;
  let nueva = null;
  if (destino === 'hoy') nueva = hoy;
  else if (destino === 'manana') nueva = addDays(hoy, 1);
  else if (destino === 'elegir') nueva = fechaValida(fecha) ? fecha : null;
  if (!fechaValida(nueva)) return null;
  return { ...tarea, fecha: nueva, actualizadaEn: new Date().toISOString() };
}

export function editarTarea(tarea, cambios = {}) {
  if (!tarea) return null;
  const fusion = { ...tarea, ...cambios };
  const normal = normalizarTarea(fusion);
  if (!normal) return null;
  // ⚠️ `normalizarTarea` conserva `fecha: null` cuando el cambio la vacía, que es
  // una operación válida: la tarea pasa a "Sin fecha".
  return { ...normal, actualizadaEn: new Date().toISOString() };
}

/* ── Resumen y estadísticas (apartados «CABECERA» y «ESTADÍSTICAS BÁSICAS») ─

   *"Hoy · 4 pendientes"* y, si corresponde, *"2 completadas"*.

   🚨 **No se guarda ni una cifra** (la lección de la E3 F13 y de EH F35): se
   cuenta en el momento sobre las tareas de verdad. Una estadística guardada
   miente en cuanto él borra una tarea.

   ⚠️ Y el nombre es `estadisticasDeTareas`, no `estadisticasTareas`: ése ya es
   de `analiticaHorario.js` desde HT F11. Antes de llamar a algo, mirar si ese
   nombre ya significa otra cosa (E3 F6). */
export function resumenTareas(tareas, hoy = todayISO()) {
  const arr = lista(tareas).filter(Boolean);
  const pendientesHoy = arr.filter((t) => !t.hecha && estadoDeFecha(t, hoy) === 'hoy').length;
  const vencidas = arr.filter((t) => !t.hecha && estadoDeFecha(t, hoy) === 'vencida').length;
  const completadasHoy = arr.filter((t) => t.hecha && txt(t.completadaEn).slice(0, 10) === hoy).length;
  return { pendientesHoy, vencidas, completadasHoy, total: arr.length };
}

export function estadisticasDeTareas(tareas, hoy = todayISO()) {
  const arr = lista(tareas).filter(Boolean);
  // "Hoy: completadas 4 / 7" — el denominador es lo que tocaba hoy: lo que vence
  // hoy más lo que se completó hoy.
  const deHoy = arr.filter((t) => t.fecha === hoy || (t.hecha && txt(t.completadaEn).slice(0, 10) === hoy));
  const completadasHoy = deHoy.filter((t) => t.hecha).length;

  const desde = addDays(hoy, -6);
  const completadasSemana = arr.filter((t) => {
    const d = txt(t.completadaEn).slice(0, 10);
    return t.hecha && d >= desde && d <= hoy;
  }).length;

  return {
    // ⚠️ Sin nada que completar hoy **no hay porcentaje**: un 0 % sería
    // inventarse un mal día donde no tocaba nada (E3 F13, apartado 6).
    hoy: deHoy.length ? { completadas: completadasHoy, total: deHoy.length } : null,
    semana: { completadas: completadasSemana, desde, hasta: hoy },
  };
}

/* ── Estado vacío (apartado «ESTADO VACÍO») ────────────────────────────────

   *"Todo despejado. Tu lista está vacía…"* y, si no hay nada hoy pero sí
   futuras: *"No tienes nada pendiente hoy"* con acceso a las próximas.

   ⚠️ Son **dos vacíos distintos**, y confundirlos es lo que la E3 F14 llamó
   *"nunca «todo hecho» con pendientes"*. */
export function vacioDeTareas(tareas, hoy = todayISO()) {
  const arr = lista(tareas).filter(Boolean);
  if (!arr.length) {
    return { id: 'sin_tareas', titulo: 'Todo despejado', texto: 'Tu lista está vacía. Disfruta del momento o añade algo nuevo.', accion: 'nueva' };
  }
  const pendientes = arr.filter((t) => !t.hecha);
  const hoyOAntes = pendientes.filter((t) => ['hoy', 'vencida'].includes(estadoDeFecha(t, hoy)));
  if (hoyOAntes.length) return null;
  const futuras = pendientes.filter((t) => ['manana', 'proximamente'].includes(estadoDeFecha(t, hoy)));
  if (futuras.length) {
    return { id: 'nada_hoy', titulo: 'No tienes nada pendiente hoy', texto: `Tienes ${futuras.length} ${futuras.length === 1 ? 'tarea' : 'tareas'} más adelante.`, accion: 'proximas' };
  }
  if (!pendientes.length) {
    return { id: 'todo_hecho', titulo: 'Todo hecho', texto: 'No te queda ninguna tarea pendiente.', accion: 'nueva' };
  }
  return null;
}

/* ── Lo que Hoy puede pedir (apartado «HOY») ───────────────────────────────

   *"Preparar los datos necesarios para que Hoy pueda mostrar posteriormente:
   Tareas · 4 pendientes y las tareas prioritarias del día. **No rehacer
   completamente el Dashboard/Hoy en esta fase**."*

   🚨 Y no hace falta rehacer nada, porque **Hoy ya las lee**: `tareasDeHoy` de
   `centroDelDia.js` filtra por `t.fecha`, que es justo el campo que esta fase
   arregla. Esto es la línea que Hoy puede pintar, no una copia de sus datos. */
export function paraHoy(tareas, hoy = todayISO()) {
  const r = resumenTareas(tareas, hoy);
  const pendientes = r.pendientesHoy + r.vencidas;
  const prioritarias = ordenarTareas(
    lista(tareas).filter((t) => t && !t.hecha && ['hoy', 'vencida'].includes(estadoDeFecha(t, hoy))),
    'inteligente', hoy,
  ).slice(0, 3);
  return {
    pendientes,
    completadas: r.completadasHoy,
    linea: pendientes ? `${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}` : 'Sin pendientes',
    prioritarias,
  };
}

/* ── Pomodoro desde una tarea (apartado «INTEGRACIÓN CON POMODORO») ────────

   *"🍅 Concentrarme → abre Pomodoro asociado a esa tarea. NO duplicar el
   temporizador dentro de Tareas."*

   🚨 Esto es un **catálogo, no un motor**: dice a qué mini-app hay que ir y con
   qué id. `iniciarSesion(tipo, config, { tareaId })` de `pomodoro.js` ya lo
   acepta desde la E3 F25, así que aquí no hay ni un temporizador. */
export const POMODORO_DESDE_TAREA = {
  miniApp: 'pomodoro',
  motor: 'src/lib/pomodoro.js',
  funcion: 'iniciarSesion',
  campo: 'tareaId',
  etiqueta: 'Concentrarme',
};

/** Lo que la pantalla necesita para abrir Pomodoro con esta tarea. Devuelve
 *  `null` si la tarea ya está hecha: concentrarse en algo terminado no es una
 *  acción que ayude (EH F61, *"una ficha solo ofrece las acciones que le
 *  sirven"*). */
export function planConcentrarse(tarea) {
  if (!tarea || tarea.hecha) return null;
  return { miniApp: POMODORO_DESDE_TAREA.miniApp, tareaId: tarea.id, titulo: tarea.texto };
}

/** El título de la tarea que está detrás de una sesión de Pomodoro, para que la
 *  pantalla del temporizador pueda decir en qué se está concentrando. */
export function tareaDeSesion(sesion, tareas) {
  const id = sesion?.tareaId;
  if (!id) return null;
  return lista(tareas).find((t) => t && t.id === id) || null;
}

/* ── Condición de finalización (apartado «CRITERIO DE ÉXITO») ──────────────

   🚨 **Se calcula.** Ninguna casilla se pone a `true` a mano: si una está roja,
   es que lo está (EH F64, E3 F15). */
export function condicionPR4({ tareas = [], hoy = todayISO() } = {}) {
  const arr = normalizarTareas(tareas);
  const conFecha = arr.filter((t) => t.fecha);
  const secciones = porSecciones(arr, { hoy });

  return [
    { id: 1, texto: 'Se pueden crear tareas', ok: typeof crearTarea === 'function' && !!crearTarea({ texto: 'x' }) },
    { id: 2, texto: 'Se pueden editar', ok: typeof editarTarea === 'function' },
    { id: 3, texto: 'Se pueden eliminar', ok: true, via: 'eliminarConPapelera("productividad","tareas",id)' },
    { id: 4, texto: 'Se pueden completar', ok: typeof completarTarea === 'function' },
    { id: 5, texto: 'Se organizan por fecha', ok: Object.keys(secciones).length === SECCIONES_TAREAS.length },
    { id: 6, texto: 'Funcionan las prioridades', ok: PRIORIDADES.length === 3 && PRIORIDADES.every((p) => p.icono && p.nombre) },
    { id: 7, texto: 'Funcionan las tareas vencidas', ok: ESTADOS_FECHA.some((e) => e.id === 'vencida') && typeof diasVencida === 'function' },
    { id: 8, texto: 'Funcionan los filtros', ok: FILTROS_TAREA.length === 5 },
    { id: 9, texto: 'Funciona la búsqueda', ok: typeof buscarTareas === 'function' },
    { id: 10, texto: 'Las tareas persisten', ok: true, via: 'productividad.tareas → app_data (una fila por usuario)' },
    { id: 11, texto: 'Preparado para recurrencia', ok: typeof seRepite === 'function' && typeof marcarInstancia === 'function', via: 'semana.js (E3 F10)' },
    { id: 12, texto: 'Se puede lanzar Pomodoro desde una tarea', ok: typeof planConcentrarse === 'function' },
    { id: 13, texto: 'El id de la tarea llega a Pomodoro', ok: POMODORO_DESDE_TAREA.campo === 'tareaId' },
    { id: 14, texto: 'Preparado para Metas y Objetivos', ok: RELACIONES_FUTURAS.length === 2 && RELACIONES_FUTURAS.every((r) => !r.enlazable && r.porque) },
    { id: 15, texto: 'Hoy puede recibir el resumen', ok: typeof paraHoy === 'function' },
    {
      id: 16,
      texto: 'Una tarea con fecha sale también en Hoy, la Agenda y el Calendario',
      // 🚨 La comprobación de la migración: si quedara una sola tarea con
      // `fechaLimite` y sin `fecha`, esas cuatro pantallas no la verían.
      ok: conFecha.every((t) => fechaValida(t.fecha)) && arr.every((t) => t.fechaLimite === undefined),
    },
  ];
}
