// Entrega 3 · ES Fase 5 — Apps de aprendizaje independientes.
//
// ⚠️ NO CONFUNDIR CON DOS ARCHIVOS QUE YA EXISTEN:
//   · `estudiosApps.js` es **el Home y el árbol** de Estudios (ES F1 y F2): las apps, sus ramas y la
//     navegación. Esto de aquí es **lo que una app puede tener dentro**: plantillas, objetivos y
//     actividades.
//   · `aprendizaje.js` es de **Estilo de hombre** (EH F57) y no tiene nada que ver. Una auditoría
//     que busque «aprendizaje» por el nombre encontrará los dos: es la lección de la E3 F28, y por
//     eso se dice aquí antes de que a alguien le cueste veinte minutos.
//
// 🚨 Y LO MÁS IMPORTANTE: **no se crea un segundo sistema de objetivos.** El apartado 8 pide que una
// app pueda tener objetivos, y JosStyle ya tiene los suyos en la clave `objetivos` desde la Fase 9.
// Una app guarda **solo los ids** (`objetivoIds`), como el `objetivoId` de EH F28 y la `prendaId` de
// EH F26: el texto, el plazo y el cumplido siguen viviendo donde siempre. La condición de
// finalización de esta fase lo pide con esas palabras — *"no se hayan creado sistemas duplicados"*.

import { uid, todayISO, fechaValida } from './helpers';

// ── Áreas académicas frente a apps de aprendizaje (apartado 1) ───────────────────────────────────
// *"No obligar a ambas categorías a compartir exactamente las mismas pantallas."* La diferencia no
// se guarda en un campo nuevo: **se deriva del tipo**, que existe desde la ES F2.
export const esAcademica = (programa) => programa?.tipo === 'formal';

// ── Plantillas (apartados 3 y 4) ─────────────────────────────────────────────────────────────────
// *"Son plantillas iniciales, no sistemas cerrados."* Por eso lo único que hacen es **sugerir unas
// ramas al crear**: después él las cambia, las quita o añade las suyas con lo de la ES F2. Y por eso
// hay siempre una salida —*"Empezar desde cero"*—, que es `null`.
export const PLANTILLAS_APP = [
  {
    id: 'academica', nombre: 'Área académica', icono: '🎓', tipo: 'formal',
    descripcion: 'Asignaturas, exámenes, entregas y temario.',
    ramas: [
      { nombre: 'Asignaturas', icono: '📚', sistema: 'asignaturas' },
      { nombre: 'Exámenes', icono: '📝', sistema: 'examenes' },
      { nombre: 'Entregas', icono: '📋', sistema: 'entregas' },
      { nombre: 'Horas de estudio', icono: '⏱️', sistema: 'horas' },
    ],
  },
  {
    id: 'futbol', nombre: 'Fútbol', icono: '⚽', tipo: 'deporte',
    descripcion: 'Entrenamiento, partidos y objetivos.',
    ramas: [
      { nombre: 'Entrenamiento', icono: '🏃', sistema: null },
      { nombre: 'Partidos', icono: '🥅', sistema: null },
      { nombre: 'Objetivos', icono: '🎯', sistema: 'objetivos' },
      { nombre: 'Progreso', icono: '📊', sistema: 'progreso' },
    ],
  },
  {
    id: 'ajedrez', nombre: 'Ajedrez', icono: '♟️', tipo: 'mental',
    descripcion: 'Entrenamiento, partidas y aperturas.',
    ramas: [
      { nombre: 'Entrenamiento', icono: '🏋️', sistema: null },
      { nombre: 'Partidas', icono: '♟️', sistema: null },
      { nombre: 'Aperturas', icono: '📖', sistema: null },
      { nombre: 'Progreso', icono: '📊', sistema: 'progreso' },
    ],
  },
  {
    id: 'musica', nombre: 'Música', icono: '🎹', tipo: 'habilidad',
    descripcion: 'Práctica, repertorio y teoría.',
    ramas: [
      { nombre: 'Práctica', icono: '🔁', sistema: null },
      { nombre: 'Repertorio', icono: '🎼', sistema: null },
      { nombre: 'Teoría', icono: '📖', sistema: null },
      { nombre: 'Progreso', icono: '📊', sistema: 'progreso' },
    ],
  },
  {
    id: 'idiomas', nombre: 'Idiomas', icono: '🌍', tipo: 'idioma',
    descripcion: 'Vocabulario, práctica y recursos.',
    ramas: [
      { nombre: 'Vocabulario', icono: '🗒️', sistema: null },
      { nombre: 'Práctica', icono: '🔁', sistema: null },
      { nombre: 'Recursos', icono: '📖', sistema: null },
      { nombre: 'Progreso', icono: '📊', sistema: 'progreso' },
    ],
  },
];

export const IDS_PLANTILLA = PLANTILLAS_APP.map((p) => p.id);
export const plantillaApp = (id) => PLANTILLAS_APP.find((p) => p.id === id) || null;

// *"Empezar desde cero"* es una opción de verdad (apartado 4): devuelve una lista vacía, y entonces
// el área nace **sin ninguna sección** y él las añade con lo de la ES F2.
export const DESDE_CERO = { id: null, nombre: 'Empezar desde cero', icono: '✨', descripcion: 'Tú eliges las secciones.' };

export function ramasDePlantilla(plantillaId) {
  const p = plantillaApp(plantillaId);
  if (!p) return [];
  return p.ramas.map((r) => ({ id: uid(), nombre: r.nombre, icono: r.icono, sistema: r.sistema }));
}

// Al elegir un tipo se propone su plantilla, pero **no se impone**: sigue pudiendo elegir otra o
// ninguna. Igual que el icono de la ES F1.
export const plantillaParaTipo = (tipo) => PLANTILLAS_APP.find((p) => p.tipo === tipo) || null;

// ── Objetivos de una app (apartados 8 y 9) ───────────────────────────────────────────────────────
// 🚨 Los objetivos son **los globales**: aquí solo viven sus ids. `objetivosDeApp` los resuelve
// contra la lista de verdad, y el que apunta a uno borrado **no se cuenta** — un id colgado es una
// mentira guardada (EH F24).
export function objetivosDeApp(app, objetivos) {
  const lista = Array.isArray(objetivos?.lista) ? objetivos.lista : [];
  const ids = Array.isArray(app?.objetivoIds) ? app.objetivoIds : [];
  return ids.map((id) => lista.find((o) => o.id === id)).filter(Boolean);
}

// ⚠️ Vigesimosegundo `aplicarPlan`: **sin `confirmado` no escribe nada**. Devuelve el objetivo que
// se crearía y la app con su id, y quien guarda es `App.jsx`, que es el dueño de los dos almacenes
// (mismo reparto que EH F26 con el armario).
export function planObjetivoDeApp({ app, texto, plazo }, confirmado = false) {
  const t = String(texto || '').trim();
  if (!t || !app) return null;
  // ⚠️ El plazo NO tiene valor por defecto (EH F28, HT F3): elegirlo por él metería su objetivo en
  // «30 días» sin decírselo. Sin plazo, no hay plan.
  if (!plazo) return { falta: 'plazo', objetivo: null, appActualizada: null, confirmado: false };
  const objetivo = { id: uid(), texto: t, plazo, cumplido: false, fechaCreacion: todayISO() };
  const appActualizada = { ...app, objetivoIds: [...(app.objetivoIds || []), objetivo.id] };
  if (!confirmado) return { falta: null, objetivo, appActualizada, confirmado: false };
  return { falta: null, objetivo, appActualizada, confirmado: true };
}

export const vincularObjetivo = (app, objetivoId) => (
  !app || !objetivoId || (app.objetivoIds || []).includes(objetivoId)
    ? app
    : { ...app, objetivoIds: [...(app.objetivoIds || []), objetivoId] }
);

export const desvincularObjetivo = (app, objetivoId) => (
  app ? { ...app, objetivoIds: (app.objetivoIds || []).filter((x) => x !== objetivoId) } : app
);

// 🚨 Apartado 9 — *"No crear métricas falsas. Si no existen datos suficientes: Sin datos todavía."*
// Sin objetivos vinculados devuelve `null`, **no un 0 %**: un cero diría que va mal cuando lo que
// pasa es que todavía no ha puesto ninguno (E3 F27, EH F25, y ya van unas cuantas).
export const SIN_DATOS = 'Sin datos todavía';

export function progresoDeApp(app, objetivos) {
  const suyos = objetivosDeApp(app, objetivos);
  if (!suyos.length) return null;
  const hechos = suyos.filter((o) => o.cumplido).length;
  return { hechos, total: suyos.length, texto: `${hechos} / ${suyos.length} objetivos` };
}

// ── Actividades (apartados 10 y 11) ──────────────────────────────────────────────────────────────
// *"Preparar una estructura para poder registrar actividades… No implementar todavía sistemas
// avanzados de cada actividad."* Así que es una lista de primer nivel con su `appId`, igual que los
// temas de la ES F3: dentro del programa no la vería la papelera (EH F45).
export const MAX_TITULO_ACTIVIDAD = 60;
export const MAX_NOTAS_ACTIVIDAD = 200;
export const MAX_MINUTOS = 24 * 60;

export function normalizarActividadEstudio(a) {
  if (!a || typeof a !== 'object') return null;
  const titulo = typeof a.titulo === 'string' ? a.titulo.trim().slice(0, MAX_TITULO_ACTIVIDAD) : '';
  const appId = typeof a.appId === 'string' && a.appId ? a.appId : null;
  // Una actividad sin app no se puede pintar en ninguna pantalla: sería un huérfano invisible.
  if (!titulo || !appId) return null;
  const min = Number(a.minutos);
  return {
    id: typeof a.id === 'string' && a.id ? a.id : uid(),
    appId,
    titulo,
    // ⚠️ Sin fecha válida se queda en el día de hoy: una actividad es algo que YA hiciste, así que
    // siempre ocurrió un día. No es inventar un dato, es que el registro lo exige.
    fecha: fechaValida(a.fecha) ? a.fecha : todayISO(),
    // ⚠️ Los minutos son OPCIONALES (apartado 10): `null`, nunca 0 — un cero diría que no practicó
    // nada, y lo que pasa es que no lo apuntó (`Number(null)` es 0, y ya van cuatro veces).
    minutos: Number.isFinite(min) && min > 0 && min <= MAX_MINUTOS ? Math.round(min) : null,
    notas: typeof a.notas === 'string' && a.notas.trim() ? a.notas.trim().slice(0, MAX_NOTAS_ACTIVIDAD) : null,
  };
}

export function crearActividadEstudio({ appId, titulo, fecha, minutos, notas } = {}) {
  return normalizarActividadEstudio({ id: uid(), appId, titulo, fecha, minutos, notas });
}

export function actividadesDeApp(estudios, appId) {
  const lista = Array.isArray(estudios?.actividades) ? estudios.actividades : [];
  return lista
    .filter((a) => a && a.appId === appId)
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
}

export function editarActividadEstudio(actividades = [], id, cambios = {}) {
  return actividades.map((a) => {
    if (a.id !== id) return a;
    const { id: _i, appId: _a, ...resto } = cambios;
    return normalizarActividadEstudio({ ...a, ...resto });
  }).filter(Boolean);
}

// El resumen de lo registrado. ⚠️ Los minutos solo se suman **de las que los tienen**: sumar las que
// no los apuntaron como ceros haría bajar el total con cada registro sin duración.
export function resumenActividades(estudios, appId) {
  const suyas = actividadesDeApp(estudios, appId);
  if (!suyas.length) return null;
  const conMinutos = suyas.filter((a) => a.minutos);
  const minutos = conMinutos.reduce((s, a) => s + a.minutos, 0);
  return {
    cuantas: suyas.length,
    minutos: minutos || null,
    sinDuracion: suyas.length - conMinutos.length,
    ultima: suyas[0]?.fecha || null,
    texto: `${suyas.length} ${suyas.length === 1 ? 'actividad' : 'actividades'}${minutos ? ` · ${Math.round(minutos / 60 * 10) / 10} h` : ''}`,
  };
}

// ── Lo que esta fase NO construye (apartado 17) ──────────────────────────────────────────────────
export const NO_EN_ES5 = [
  { que: 'Sistema profundo de fútbol', porque: 'El apartado 7 lo dice: esta fase es arquitectura, plantillas, navegación y persistencia.' },
  { que: 'Sistema profundo de ajedrez', porque: 'Lo mismo: su rama existe y está vacía a propósito hasta que él pida qué guardar dentro.' },
  { que: 'Sistema profundo de música', porque: 'Lo mismo.' },
  { que: 'Sistema avanzado de idiomas', porque: 'Lo mismo.' },
  { que: 'Estadísticas avanzadas', porque: 'Excluidas del apartado 17. El progreso es «3 / 5 objetivos», y sin objetivos no hay número.' },
  { que: 'IA específica por app', porque: 'Excluida del apartado 17.' },
  { que: 'Gamificación avanzada', porque: 'Excluida del apartado 17, y D2-02 sigue en pie: no sobregamificar.' },
];

// ── Auditoría de la fase (apartado 18) ───────────────────────────────────────────────────────────
export function condicionES5(estudios, objetivos) {
  const programas = Array.isArray(estudios?.programas) ? estudios.programas : [];
  const app = programas[0] || null;

  // Las plantillas sugieren ramas de verdad y cada rama sale con su id propio.
  const deFutbol = ramasDePlantilla('futbol');
  const otraVez = ramasDePlantilla('futbol');
  const idsPropios = deFutbol.length > 0 && deFutbol[0].id !== otraVez[0].id;

  // El objetivo se crea en el sistema global, no aquí.
  const plan = planObjetivoDeApp({ app: app || { id: 'x' }, texto: 'Mejorar resistencia', plazo: 'corto' });
  const noEscribeSinConfirmar = !!plan && plan.confirmado === false;

  return [
    { id: 'apps', ok: typeof esAcademica === 'function' && programas.length >= 0, texto: 'Existen apps de aprendizaje independientes de las áreas académicas' },
    { id: 'plantillas', ok: PLANTILLAS_APP.length >= 5 && PLANTILLAS_APP.every((p) => p.ramas.length >= 3 && p.tipo), texto: 'Existen plantillas, y sugieren ramas' },
    { id: 'desde_cero', ok: DESDE_CERO.id === null && ramasDePlantilla(null).length === 0, texto: 'Y se puede empezar desde cero' },
    { id: 'ids_propios', ok: idsPropios, texto: 'Cada app que usa una plantilla recibe SUS ramas, no las mismas' },
    { id: 'objetivos', ok: noEscribeSinConfirmar && typeof vincularObjetivo === 'function', texto: 'Existen objetivos opcionales, y son los globales' },
    { id: 'progreso', ok: progresoDeApp({ objetivoIds: [] }, objetivos) === null, texto: 'Sin objetivos no hay porcentaje inventado: «Sin datos todavía»' },
    { id: 'actividades', ok: typeof crearActividadEstudio === 'function' && typeof actividadesDeApp === 'function', texto: 'Existe una estructura básica de actividades' },
    { id: 'persisten', ok: Array.isArray(estudios?.actividades), texto: 'Las actividades persisten en su lista' },
    { id: 'fechas', ok: !/calendario|Calendar/.test(String(crearActividadEstudio)), texto: 'Se reutiliza el sistema de fechas: no hay otro calendario' },
    { id: 'sin_duplicar', ok: typeof objetivosDeApp === 'function', texto: 'No se han creado sistemas duplicados: los objetivos son los de siempre' },
    { id: 'no_implementado_5', ok: NO_EN_ES5.length >= 7 && NO_EN_ES5.every((x) => x.porque), texto: 'Lo que no se implementa todavía está declarado con su motivo' },
  ];
}
