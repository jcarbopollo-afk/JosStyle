import { todayISO } from './helpers';
import {
  TIPOS_OBJETIVO, tipoObjetivo, ESTADOS_OBJETIVO, crearObjetivo, normalizarObjetivo,
} from './fitness';
import { ejercicioPorId, musculoPrincipal, nombreCompleto } from './ejercicios';
import { aparicionesDeEjercicio, mejorHistorico, progresoDeEjercicio } from './progresion';
import { fechaLarga } from './finalizacion';
import { estadoDe, estadoProgreso } from './progresoEjercicios';
import { ejercicioEnGrupo } from './progresoMuscular';

/* Entrega 4 · Fase 14/45 — «Objetivos y metas de progreso».
   ═══════════════════════════════════════════════════════════════════════════

   *"Fitness → Progreso → Mis objetivos → + Crear objetivo → Dominadas → 15
   repeticiones"*, y registrar entrenamientos reales hasta ver **15 / 15 ·
   ✓ Objetivo conseguido** — sin inventar datos ni tocar el historial.

   🚨 **LO GUARDADO ES SOLO EL OBJETIVO.** El valor actual, el porcentaje, si se
   ha conseguido y la tendencia **se calculan** cada vez de las sesiones, con las
   funciones de la F11. Un «objetivo conseguido» guardado se quedaría viejo el
   día que él borrara la sesión que lo consiguió.

   ── QUÉ SE MIDE (apartados 3, 7, 8, 9 y 10) ─────────────────────────────────
   Una métrica por objetivo (apartado 7: *"Implementa inicialmente objetivos de
   una única métrica"*):
     · **peso** (kg) — el mayor peso de una serie hecha: la mejor serie de la F11
       con carga o con lastre (`mejorHistorico`).
     · **duración** (s) — el mayor tiempo de una serie: la mejor serie de la F11
       en un isométrico (`mejorHistorico`).
     · **repeticiones** — las de **la mejor serie**, nunca la suma de la sesión
       (apartado 9). Se cuentan en cualquier serie hecha del ejercicio: quien
       quiera «15 reps con 20 kg» tiene que marcarse un objetivo de peso.
   Las series son las de la F11 (`aparicionesDeEjercicio`): hechas, limpias de
   datos rotos y del ejercicio exacto — la variante no se mezcla (apartado 19).

   ── QUÉ MÉTRICAS ADMITE UN EJERCICIO (apartado 3) ───────────────────────────
   Lo dicen las `medidas` del catálogo (F2): solo tiempo → segundos; con
   repeticiones → repeticiones; y con peso, también kilos. Un objetivo en una
   unidad que el ejercicio no mide no se puede crear. */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL MODELO (apartado 2) — `ProgressGoal`
   ═══════════════════════════════════════════════════════════════════════════ */

/* El modelo vive en `fitness.js`, donde la puerta de carga lo conoce (regla 5).
   Aquí se reexporta para quien use los objetivos. */
export { TIPOS_OBJETIVO, tipoObjetivo, ESTADOS_OBJETIVO, crearObjetivo, normalizarObjetivo };

const numero = (v) => {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const esISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(texto(v));

/* ═══════════════════════════════════════════════════════════════════════════
   2 · MÉTRICAS Y VALIDACIÓN (apartados 3 y 5)
   ═══════════════════════════════════════════════════════════════════════════ */

const CARGA_EXTERNA = ['barra', 'discos', 'mancuernas', 'kettlebell', 'maquina', 'polea'];

/** Qué métricas admite un ejercicio, la más natural primero. */
export function metricasDeEjercicio(ejercicio) {
  const m = lista(ejercicio?.medidas);
  if (!m.length) return [];
  if (m.includes('tiempo') && !m.includes('reps')) return ['duracion'];
  const salida = [];
  /* Con peso, qué va primero lo decide el MATERIAL: si se hace con barra de
     discos, mancuernas, máquina o polea, lo natural es el peso; si no (dominadas,
     fondos), las repeticiones — y el peso queda para el lastre. El entorno no
     sirve: unas dominadas figuran como de gimnasio y se hacen a peso corporal. */
  const conCargaExterna = lista(ejercicio.equipamiento).some((e) => CARGA_EXTERNA.includes(e));
  if (m.includes('peso') && conCargaExterna) salida.push('peso');
  if (m.includes('reps')) salida.push('reps');
  if (m.includes('peso') && !conCargaExterna) salida.push('peso');
  if (m.includes('tiempo')) salida.push('duracion');
  return salida;
}

/** Apartado 5 — qué se puede crear. Devuelve el objetivo o el motivo en
 *  palabras. */
export function validarObjetivo({ exerciseId, tipo, valor, fechaObjetivo = '' } = {}, { propios = [] } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), propios);
  if (!ej) return { ok: false, motivo: 'Elige un ejercicio del catálogo.' };
  const t = tipoObjetivo(texto(tipo));
  if (!t) return { ok: false, motivo: 'Elige qué quieres medir.' };
  if (!metricasDeEjercicio(ej).includes(t.id)) {
    return { ok: false, motivo: `${ej.nombre} no se mide en ${t.unidad === 's' ? 'segundos' : t.unidad === 'kg' ? 'kilos' : 'repeticiones'}.` };
  }
  if (valor === null || valor === undefined || String(valor).trim() === '') return { ok: false, motivo: 'Escribe el objetivo.' };
  const n = numero(valor);
  if (n === null) return { ok: false, motivo: 'El objetivo tiene que ser un número.' };
  if (n <= 0) return { ok: false, motivo: 'El objetivo tiene que ser mayor que cero.' };
  if (n > t.maximo) return { ok: false, motivo: `Como mucho ${t.maximo} ${t.unidad}.` };
  if (!t.decimales && !Number.isInteger(n)) return { ok: false, motivo: t.id === 'reps' ? 'Las repeticiones van sin decimales.' : 'Los segundos van sin decimales.' };
  if (t.decimales && Math.round(n * 100) !== n * 100) return { ok: false, motivo: 'Como mucho dos decimales.' };
  if (fechaObjetivo && !esISO(fechaObjetivo)) return { ok: false, motivo: 'La fecha no es válida.' };
  return { ok: true, motivo: null, valor: n };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL PROGRESO DE UN OBJETIVO (apartados 6-12, 17, 18 y 23)
   ═══════════════════════════════════════════════════════════════════════════ */

/** El mejor valor real de esa métrica, o `null` si no hay datos (apartado 23:
 *  **sin datos no es 0**). `excluirSesion` deja fuera una sesión, para saber
 *  qué había ANTES de ella. */
export function valorActual(fitness, objetivo, { propios = [], excluirSesion = null } = {}) {
  const todas = aparicionesDeEjercicio(fitness, objetivo.exerciseId, propios);
  const apariciones = excluirSesion ? todas.filter((a) => a.sesionId !== excluirSesion) : todas;
  if (objetivo.tipo === 'duracion') {
    const m = mejorHistorico(apariciones, 'tiempo');
    return m ? { valor: m.serie.duracion, fecha: m.fecha, sesionId: m.sesionId } : null;
  }
  if (objetivo.tipo === 'peso') {
    /* La mejor serie con peso de la F11, sea carga o lastre: la que más pesa. */
    const candidatos = ['carga', 'lastre'].map((c) => mejorHistorico(apariciones, c)).filter(Boolean);
    if (!candidatos.length) return null;
    const m = candidatos.reduce((a, b) => (b.serie.peso > a.serie.peso ? b : a));
    return { valor: m.serie.peso, fecha: m.fecha, sesionId: m.sesionId };
  }
  let mejor = null;
  for (const a of apariciones) {
    if (a.clase === 'tiempo') continue;
    for (const s of a.series) {
      if (s.reps && (!mejor || s.reps > mejor.valor)) mejor = { valor: s.reps, fecha: a.fecha, sesionId: a.sesionId };
    }
  }
  return mejor;
}

export const conseguido = (actual, objetivo) => !!actual && typeof objetivo?.valor === 'number' && actual.valor >= objetivo.valor;

/** El `getGoalStatus` del apartado 26: cancelado > conseguido > activo. */
export function estadoDeObjetivo(objetivo, actual) {
  if (objetivo.estado === 'cancelado') return 'cancelado';
  if (objetivo.estado === 'completado' || conseguido(actual, objetivo)) return 'completado';
  return 'activo';
}

export const ESTADOS_VISIBLES = {
  activo: { nombre: 'En progreso', simbolo: '●' },
  completado: { nombre: 'Objetivo conseguido', simbolo: '✓' },
  cancelado: { nombre: 'Cancelado', simbolo: '—' },
};

const decimal = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
const conUnidad = (valor, tipo) => {
  const t = tipoObjetivo(tipo);
  if (valor === null || valor === undefined) return '';
  if (t.id === 'reps') return `${decimal(valor)} ${valor === 1 ? 'rep' : 'reps'}`;
  return `${decimal(valor)} ${t.unidad}`;
};

/** El `getGoalProgress` del apartado 26: todo lo que enseña una tarjeta. */
export function progresoDeObjetivo(fitness, objetivo, { propios = [], hoy = todayISO() } = {}) {
  const ej = ejercicioPorId(objetivo.exerciseId, propios);
  const actual = valorActual(fitness, objetivo, { propios });
  const estado = estadoDeObjetivo(objetivo, actual);
  const p = progresoDeEjercicio(fitness, objetivo.exerciseId, { propios });
  const tendencia = estadoDe(p);
  const principal = ej ? musculoPrincipal(ej) : null;
  return {
    id: objetivo.id,
    exerciseId: objetivo.exerciseId,
    nombre: ej ? nombreCompleto(ej) : 'Ejercicio desconocido',
    existe: !!ej,
    grupoId: principal ? principal.grupoId : null,
    tipo: objetivo.tipo,
    metrica: tipoObjetivo(objetivo.tipo).nombre,
    objetivo: objetivo.valor,
    objetivoTexto: conUnidad(objetivo.valor, objetivo.tipo),
    actual: actual ? actual.valor : null,
    /* 🚨 Apartado 23 — sin datos NO es «0 %». */
    sinDatos: !actual,
    progresoTexto: actual
      ? `${decimal(actual.valor)} / ${conUnidad(objetivo.valor, objetivo.tipo)}`
      : 'Sin datos todavía',
    /* Apartado 6 — *"simplemente actual / objetivo"*, y acotado a 100: pasarse no
       es un 130 %, es conseguido. */
    porcentaje: actual && objetivo.valor > 0 ? Math.min(100, Math.round((actual.valor / objetivo.valor) * 100)) : null,
    estado,
    estadoNombre: ESTADOS_VISIBLES[estado].nombre,
    simbolo: ESTADOS_VISIBLES[estado].simbolo,
    tendencia,
    tendenciaNombre: estadoProgreso(tendencia).nombre,
    tendenciaSimbolo: estadoProgreso(tendencia).simbolo,
    mejor: p.mejor ? p.mejor.texto : '',
    ultimaSesion: p.ultima ? fechaLarga(p.ultima.fecha) : '',
    conseguidoEn: estado === 'completado' && actual ? fechaLarga(actual.fecha) : '',
    creadoEn: fechaLarga(new Date(objetivo.creadoEn).toLocaleDateString('sv-SE')),
    fechaObjetivo: objetivo.fechaObjetivo ? fechaLarga(objetivo.fechaObjetivo) : '',
    /* 🚨 Apartado 18 — «Fecha superada», y NADA más: ni «fallido» ni predicción. */
    fechaSuperada: !!objetivo.fechaObjetivo && objetivo.fechaObjetivo < hoy && estado === 'activo',
    nota: objetivo.nota,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LISTAS Y FILTROS (apartados 15, 21 y 26)
   ═══════════════════════════════════════════════════════════════════════════ */

export const FILTROS_OBJETIVOS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'activo', nombre: 'Activos' },
  { id: 'completado', nombre: 'Completados' },
  { id: 'cancelado', nombre: 'Cancelados' },
];

/** Activos primero (los más avanzados arriba), luego conseguidos; los
 *  cancelados, solo si se piden (apartado 15). */
export function listaDeObjetivos(fitness, { filtro = 'todos', grupo = 'todos', propios = [], hoy = todayISO() } = {}) {
  const todos = lista((fitness || {}).objetivos).map((o) => progresoDeObjetivo(fitness, o, { propios, hoy }));
  const orden = { activo: 0, completado: 1, cancelado: 2 };
  const visibles = todos
    .filter((o) => (filtro === 'todos' ? o.estado !== 'cancelado' : o.estado === filtro))
    .filter((o) => grupo === 'todos' || ejercicioEnGrupo(o.exerciseId, grupo, propios))
    .sort((a, b) => orden[a.estado] - orden[b.estado] || (b.porcentaje ?? -1) - (a.porcentaje ?? -1));
  return {
    objetivos: visibles,
    total: todos.length,
    activos: todos.filter((o) => o.estado === 'activo').length,
    completados: todos.filter((o) => o.estado === 'completado').length,
    cancelados: todos.filter((o) => o.estado === 'cancelado').length,
  };
}

export const objetivosActivos = (fitness, opciones) => listaDeObjetivos(fitness, { ...opciones, filtro: 'activo' }).objetivos;
export const objetivosCompletados = (fitness, opciones) => listaDeObjetivos(fitness, { ...opciones, filtro: 'completado' }).objetivos;

/* ═══════════════════════════════════════════════════════════════════════════
   5 · CREAR, EDITAR, CANCELAR (apartados 4, 13 y 14)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Devuelven el `fitness` siguiente; quien guarda es `App.jsx` (regla 5). Y
   eliminar va por la papelera, como toda la aplicación. */

export function anadirObjetivo(fitness, datos, { propios = [], ahora = Date.now() } = {}) {
  const v = validarObjetivo(datos, { propios });
  if (!v.ok) return { ok: false, motivo: v.motivo, fitness };
  const nuevo = crearObjetivo({ ...datos, valor: v.valor, creadoEn: ahora, estado: 'activo' });
  return { ok: true, objetivo: nuevo, fitness: { ...(fitness || {}), objetivos: [...lista((fitness || {}).objetivos), nuevo] } };
}

/** Apartado 13 — editar un objetivo ACTIVO, conservando su id. */
export function editarObjetivo(fitness, id, cambios, { propios = [], ahora = Date.now() } = {}) {
  const objetivos = lista((fitness || {}).objetivos);
  const actual = objetivos.find((o) => o.id === id);
  if (!actual) return { ok: false, motivo: 'Ese objetivo ya no está.', fitness };
  if (actual.estado === 'cancelado') return { ok: false, motivo: 'Un objetivo cancelado no se edita.', fitness };
  const datos = { ...actual, ...cambios, exerciseId: actual.exerciseId };
  const v = validarObjetivo(datos, { propios });
  if (!v.ok) return { ok: false, motivo: v.motivo, fitness };
  const editado = crearObjetivo({ ...datos, id: actual.id, valor: v.valor, creadoEn: actual.creadoEn, actualizadoEn: ahora });
  return { ok: true, objetivo: editado, fitness: { ...fitness, objetivos: objetivos.map((o) => (o.id === id ? editado : o)) } };
}

export function cancelarObjetivo(fitness, id, { ahora = Date.now() } = {}) {
  const objetivos = lista((fitness || {}).objetivos);
  if (!objetivos.some((o) => o.id === id)) return fitness;
  return { ...fitness, objetivos: objetivos.map((o) => (o.id === id ? { ...o, estado: 'cancelado', actualizadoEn: ahora } : o)) };
}

export const AVISO_CANCELAR_OBJETIVO = {
  titulo: '¿Cancelar este objetivo?',
  texto: 'Dejará de contar como activo. Tus entrenamientos no se tocan.',
  cancelar: 'Mantenerlo',
  confirmar: 'Cancelar objetivo',
};
export const AVISO_ELIMINAR_OBJETIVO = {
  titulo: '¿Eliminar este objetivo?',
  texto: 'Irá a la Papelera. Tus entrenamientos no se tocan.',
  cancelar: 'Cancelar',
  confirmar: 'Eliminar',
};

export const OBJETIVOS_VACIO = {
  titulo: 'Sin objetivos todavía',
  texto: 'Marca un objetivo de rendimiento y sigue tu progreso.',
  cta: '+ Crear objetivo',
};

/* ═══════════════════════════════════════════════════════════════════════════
   6 · PARA EL ENTRENAMIENTO EN VIVO (apartado 28)
   ═══════════════════════════════════════════════════════════════════════════
   *"La detección debe existir en la lógica para que pueda utilizarse
   posteriormente."* Qué objetivos ha conseguido **esta sesión**: los que ahora
   están conseguidos y sin ella no lo estaban. Sin celebraciones: eso no es de
   esta fase. */
export function objetivosQueConsigueLaSesion(fitness, sesionId, { propios = [] } = {}) {
  return lista((fitness || {}).objetivos)
    .filter((o) => o.estado === 'activo')
    .filter((o) => {
      const con = valorActual(fitness, o, { propios });
      const sin = valorActual(fitness, o, { propios, excluirSesion: sesionId });
      return conseguido(con, o) && !conseguido(sin, o);
    })
    .map((o) => o.id);
}

export const NO_EN_FIT14 = [
  { que: 'Logros, medallas, XP, niveles, recompensas, notificaciones y retos', porque: 'Apartado 29.' },
  { que: 'Predicciones («lo conseguirás en 42 días»)', porque: 'Apartados 1 y 17. Solo se enseña la fecha que él puso, y «Fecha superada» si pasó.' },
  { que: 'Objetivos compuestos («20 kg × 8»)', porque: 'Apartado 7: se empieza por una métrica. El modelo (`tipo` + `valor`) admite añadir una segunda condición sin migrar nada.' },
  { que: 'Un estado «fallido»', porque: 'Apartado 18: una fecha superada no convierte el objetivo en fallido.' },
  { que: 'Celebrarlo en el entrenamiento en vivo', porque: 'Apartado 28: la detección existe (`objetivosQueConsigueLaSesion`), la celebración no.' },
];
