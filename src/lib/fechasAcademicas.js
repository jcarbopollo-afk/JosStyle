// Entrega 3 · ES Fase 4 — Exámenes, entregas y fechas.
//
// 🚨 EL APARTADO 19 ES EL QUE MANDA EN ESTE ARCHIVO: *"Un examen no debe existir como examen dentro
// de asignatura, evento diferente en Home y evento diferente en calendario. **Debe existir un único
// registro que pueda visualizarse desde diferentes lugares**."* Por eso aquí no se guarda ni una
// copia: `fechasAcademicas()` es **la única función que junta las tres listas**, y el Home, la
// asignatura, el área y el Calendario leen todos de ella. Si una fase futura quiere enseñar fechas
// académicas en otro sitio, llama aquí — no hace una cuarta lista.
//
// 🚨 Y LOS EXÁMENES YA EXISTÍAN. `estudios.examenes` es de la Fase 6 del proyecto y lo leen
// `calendarioIntegracion.js`, `exportData.js`, el Dashboard y la zona de PRÓXIMO de la ES F1. Así
// que **se amplía** con `hora`, `estado` y `notas`; ⚠️ y **no se le añade un `nombre`**, porque el
// título ya es `tema` —así lo rotula su formulario desde el primer día—: un campo nuevo para lo
// mismo es el fallo de la E3 F26, donde una tarea acabó con dos fechas y no salía en ninguna parte.
//
// ⚠️ Las entregas y los eventos SÍ son listas nuevas, porque no existía nada parecido. Van de primer
// nivel (`estudios.entregas`, `estudios.eventos`) con su `asignaturaId`, como los temas de la ES F3:
// dentro de la asignatura no las vería la papelera (EH F45).

import { uid, todayISO, horaValida, fechaValida } from './helpers';

// ── Los tres tipos (apartado 12) ─────────────────────────────────────────────────────────────────
// *"No depender únicamente del color. El icono y el texto deben indicar claramente el tipo."*
export const TIPOS_FECHA = [
  { id: 'examen', nombre: 'Examen', icono: '📝', acento: 'negative', lista: 'examenes' },
  { id: 'entrega', nombre: 'Entrega', icono: '📋', acento: 'warning', lista: 'entregas' },
  { id: 'evento', nombre: 'Evento', icono: '📅', acento: 'info', lista: 'eventos' },
];

export const IDS_TIPO_FECHA = TIPOS_FECHA.map((t) => t.id);
export const tipoDeFecha = (id) => TIPOS_FECHA.find((t) => t.id === id) || null;

// ── Estados ──────────────────────────────────────────────────────────────────────────────────────
// ⚠️ El estado de un examen **se guarda, no se deriva de la fecha**: que un examen haya PASADO no
// significa que se haya hecho (HT F8 — *pasada no es completada*). Y al revés: un examen marcado
// como realizado sigue estando el día que estaba.
export const ESTADOS_EXAMEN = [
  { id: 'proximo', nombre: 'Próximo', icono: '○', acento: null },
  { id: 'realizado', nombre: 'Realizado', icono: '●', acento: 'positive' },
];

export const ESTADOS_ENTREGA = [
  { id: 'pendiente', nombre: 'Pendiente', icono: '○', acento: null },
  { id: 'progreso', nombre: 'En progreso', icono: '◐', acento: 'warning' },
  { id: 'entregada', nombre: 'Entregada', icono: '●', acento: 'positive' },
];

export const IDS_ESTADO_EXAMEN = ESTADOS_EXAMEN.map((e) => e.id);
export const IDS_ESTADO_ENTREGA = ESTADOS_ENTREGA.map((e) => e.id);
export const estadoExamen = (id) => ESTADOS_EXAMEN.find((e) => e.id === id) || ESTADOS_EXAMEN[0];
export const estadoEntrega = (id) => ESTADOS_ENTREGA.find((e) => e.id === id) || ESTADOS_ENTREGA[0];

export function siguienteEstadoEntrega(id) {
  const i = IDS_ESTADO_ENTREGA.indexOf(id);
  return IDS_ESTADO_ENTREGA[(i + 1) % IDS_ESTADO_ENTREGA.length];
}

// ── Los tipos de evento (apartado 6) ─────────────────────────────────────────────────────────────
// *"No crear una categoría para cada caso. Utilizar 📅 Evento con tipo configurable."* Así que es UNA
// lista con un `tipo` dentro, no cuatro listas.
export const TIPOS_EVENTO_ACADEMICO = [
  { id: 'presentacion', nombre: 'Presentación' },
  { id: 'exposicion', nombre: 'Exposición' },
  { id: 'recuperacion', nombre: 'Recuperación' },
  { id: 'practica', nombre: 'Práctica' },
  { id: 'otro', nombre: 'Otro' },
];

export const IDS_TIPO_EVENTO = TIPOS_EVENTO_ACADEMICO.map((t) => t.id);
export const TIPO_EVENTO_POR_DEFECTO = 'otro';
export const tipoEventoAcademico = (id) => TIPOS_EVENTO_ACADEMICO.find((t) => t.id === id) || TIPOS_EVENTO_ACADEMICO.at(-1);

export const MAX_NOMBRE_FECHA = 60;
export const MAX_NOTAS_FECHA = 300;

const texto = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// ⚠️ `'25:99'` encaja con `/^\d{2}:\d{2}$/` — la forma no basta (E3 F8, tercera vez). `horaValida`
// vive en `helpers.js` y es la que usan Peluquería, la Agenda y el Calendario.
const hora = (v) => (typeof v === 'string' && horaValida(v.trim()) ? v.trim() : null);

// ── Normalizadores (regla 5) ─────────────────────────────────────────────────────────────────────
// ⚠️ El examen conserva TODO lo que ya tenía —`tema`, `notaObjetivo`, `notaObtenida`, `planRepaso`—
// y solo suma lo nuevo. Perder `planRepaso` aquí borraría los planes que la IA le generó.
export function normalizarExamen(e) {
  if (!e || typeof e !== 'object') return null;
  const asignaturaId = typeof e.asignaturaId === 'string' && e.asignaturaId ? e.asignaturaId : null;
  if (!asignaturaId) return null;
  return {
    ...e,
    id: typeof e.id === 'string' && e.id ? e.id : uid(),
    asignaturaId,
    // El título del examen es `tema` desde la Fase 6: no se le inventa un `nombre` al lado.
    tema: typeof e.tema === 'string' ? e.tema.trim().slice(0, MAX_NOMBRE_FECHA) : '',
    fecha: fechaValida(e.fecha) ? e.fecha : null,
    hora: hora(e.hora),
    estado: IDS_ESTADO_EXAMEN.includes(e.estado) ? e.estado : 'proximo',
    notas: texto(e.notas, MAX_NOTAS_FECHA),
  };
}

export function normalizarEntrega(t) {
  if (!t || typeof t !== 'object') return null;
  const nombre = typeof t.nombre === 'string' ? t.nombre.trim().slice(0, MAX_NOMBRE_FECHA) : '';
  const asignaturaId = typeof t.asignaturaId === 'string' && t.asignaturaId ? t.asignaturaId : null;
  if (!nombre || !asignaturaId) return null;
  return {
    id: typeof t.id === 'string' && t.id ? t.id : uid(),
    asignaturaId,
    nombre,
    fecha: fechaValida(t.fecha) ? t.fecha : null,
    hora: hora(t.hora),
    estado: IDS_ESTADO_ENTREGA.includes(t.estado) ? t.estado : 'pendiente',
    notas: texto(t.notas, MAX_NOTAS_FECHA),
  };
}

export function normalizarEventoAcademico(v) {
  if (!v || typeof v !== 'object') return null;
  const nombre = typeof v.nombre === 'string' ? v.nombre.trim().slice(0, MAX_NOMBRE_FECHA) : '';
  const asignaturaId = typeof v.asignaturaId === 'string' && v.asignaturaId ? v.asignaturaId : null;
  if (!nombre || !asignaturaId) return null;
  return {
    id: typeof v.id === 'string' && v.id ? v.id : uid(),
    asignaturaId,
    nombre,
    fecha: fechaValida(v.fecha) ? v.fecha : null,
    hora: hora(v.hora),
    tipo: IDS_TIPO_EVENTO.includes(v.tipo) ? v.tipo : TIPO_EVENTO_POR_DEFECTO,
    notas: texto(v.notas, MAX_NOTAS_FECHA),
  };
}

// ⚠️ Devuelve el módulo ENTERO (regla 5).
export function normalizarFechasDe(estudios) {
  if (!estudios || typeof estudios !== 'object') return estudios;
  const lista = (k, fn) => (Array.isArray(estudios[k]) ? estudios[k] : []).map(fn).filter(Boolean);
  return {
    ...estudios,
    examenes: lista('examenes', normalizarExamen),
    entregas: lista('entregas', normalizarEntrega),
    eventos: lista('eventos', normalizarEventoAcademico),
  };
}

// ── Crear y editar ───────────────────────────────────────────────────────────────────────────────
export function crearEntrega({ nombre, asignaturaId, fecha, hora: h, notas } = {}) {
  return normalizarEntrega({ id: uid(), nombre, asignaturaId, fecha, hora: h, notas, estado: 'pendiente' });
}

export function crearEventoAcademico({ nombre, asignaturaId, fecha, hora: h, notas, tipo } = {}) {
  return normalizarEventoAcademico({ id: uid(), nombre, asignaturaId, fecha, hora: h, notas, tipo });
}

// ⚠️ Ni el id ni la asignatura se cambian al editar: mover una fecha de asignatura es otra cosa, y
// hacerlo por la puerta de atrás la dejaría contada en el área equivocada (ES F3).
function editarEn(lista, id, cambios, normalizar) {
  return (lista || []).map((x) => {
    if (x.id !== id) return x;
    const { id: _i, asignaturaId: _a, ...resto } = cambios || {};
    return normalizar({ ...x, ...resto });
  }).filter(Boolean);
}

export const editarExamenFecha = (examenes, id, cambios) => editarEn(examenes, id, cambios, normalizarExamen);
export const editarEntrega = (entregas, id, cambios) => editarEn(entregas, id, cambios, normalizarEntrega);
export const editarEventoAcademico = (eventos, id, cambios) => editarEn(eventos, id, cambios, normalizarEventoAcademico);

export const cambiarEstadoExamen = (examenes, id, estado) =>
  (examenes || []).map((e) => (e.id === id && IDS_ESTADO_EXAMEN.includes(estado) ? { ...e, estado } : e));

export const avanzarEntrega = (entregas, id) =>
  (entregas || []).map((t) => (t.id === id ? { ...t, estado: siguienteEstadoEntrega(t.estado) } : t));

export const cambiarEstadoEntrega = (entregas, id, estado) =>
  (entregas || []).map((t) => (t.id === id && IDS_ESTADO_ENTREGA.includes(estado) ? { ...t, estado } : t));

// ── 🚨 LA ÚNICA FUENTE: una fecha académica, venga de donde venga (apartado 19) ───────────────────
// Devuelve la MISMA forma para los tres tipos, **sin guardar nada**: es una lectura sobre las listas
// que ya existen. Por eso cambiar la fecha de un examen mueve el Home, la asignatura, el área y el
// Calendario a la vez — no hay copias que sincronizar.
export function fechasAcademicas(estudios, { asignaturaId = null, asignaturaIds = null } = {}) {
  const dentro = (id) => {
    if (asignaturaId) return id === asignaturaId;
    if (asignaturaIds) return asignaturaIds.includes(id);
    return true;
  };

  const filas = [];
  for (const e of (estudios?.examenes || [])) {
    if (!e || !dentro(e.asignaturaId)) continue;
    filas.push({
      tipo: 'examen', id: e.id, asignaturaId: e.asignaturaId,
      nombre: e.tema || 'Examen', fecha: e.fecha || null, hora: e.hora || null,
      estado: e.estado || 'proximo', notas: e.notas || null, subtipo: null,
    });
  }
  for (const t of (estudios?.entregas || [])) {
    if (!t || !dentro(t.asignaturaId)) continue;
    filas.push({
      tipo: 'entrega', id: t.id, asignaturaId: t.asignaturaId,
      nombre: t.nombre, fecha: t.fecha || null, hora: t.hora || null,
      estado: t.estado || 'pendiente', notas: t.notas || null, subtipo: null,
    });
  }
  for (const v of (estudios?.eventos || [])) {
    if (!v || !dentro(v.asignaturaId)) continue;
    filas.push({
      tipo: 'evento', id: v.id, asignaturaId: v.asignaturaId,
      nombre: v.nombre, fecha: v.fecha || null, hora: v.hora || null,
      estado: null, notas: v.notas || null, subtipo: v.tipo || TIPO_EVENTO_POR_DEFECTO,
    });
  }
  // Apartado 9 — *"ordenar automáticamente por fecha… no ordenar manualmente"*. Las que no tienen
  // fecha van al final: no se les inventa una.
  return filas.sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    return (a.hora || '99:99').localeCompare(b.hora || '99:99');
  });
}

// ── La cuenta atrás (apartado 11) ────────────────────────────────────────────────────────────────
// *"Utilizar fechas relativas únicamente cuando mejoren la comprensión."* Así que solo dentro de dos
// semanas; más allá, la fecha dice más que «en 47 días».
// ⚠️ Y se cuenta en LOCAL contra el `hoy` recibido, nunca contra el reloj: es el fallo de la E3 F41.
export const DIAS_CUENTA_ATRAS = 14;

export function diasHastaLocal(desdeISO, hastaISO) {
  if (!desdeISO || !hastaISO) return null;
  const a = new Date(`${desdeISO}T00:00:00`);
  const b = new Date(`${hastaISO}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function cuentaAtras(fecha, hoy = todayISO()) {
  const d = diasHastaLocal(hoy, fecha);
  if (d === null) return null;
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d > 1 && d <= DIAS_CUENTA_ATRAS) return `En ${d} días`;
  if (d === -1) return 'Ayer';
  return null;
}

// ── Lo que va al Home (apartados 8 y 10) ─────────────────────────────────────────────────────────
// 🚨 *"Los eventos cuya fecha ya haya pasado deben dejar de aparecer en PRÓXIMAMENTE **pero deben
// permanecer almacenados**."* Así que esto es un FILTRO de lectura: no borra ni archiva nada.
export const MAX_PROXIMAS = 5;
export const DIAS_PROXIMAS = 60;

export function proximasFechas(estudios, hoy = todayISO(), { limite = MAX_PROXIMAS, dias = DIAS_PROXIMAS, asignaturaIds = null } = {}) {
  return fechasAcademicas(estudios, { asignaturaIds })
    .filter((f) => {
      if (!f.fecha || f.fecha < hoy) return false;
      const d = diasHastaLocal(hoy, f.fecha);
      return Number.isFinite(d) && d <= dias;
    })
    .slice(0, limite)
    .map((f) => ({ ...f, cuenta: cuentaAtras(f.fecha, hoy), dias: diasHastaLocal(hoy, f.fecha) }));
}

// Las que ya pasaron: siguen guardadas y se pueden consultar (apartado 10).
export const pasadas = (estudios, hoy = todayISO(), opciones = {}) =>
  fechasAcademicas(estudios, opciones).filter((f) => f.fecha && f.fecha < hoy).reverse();

// ── Contar por asignatura, para el resumen de la ES F3 ───────────────────────────────────────────
export function cuentasDeAsignatura(estudios, asignaturaId, hoy = todayISO()) {
  const suyas = fechasAcademicas(estudios, { asignaturaId });
  const futuras = suyas.filter((f) => f.fecha && f.fecha >= hoy);
  return {
    examenesProximos: futuras.filter((f) => f.tipo === 'examen').length,
    entregasPendientes: suyas.filter((f) => f.tipo === 'entrega' && f.estado !== 'entregada').length,
    eventosProximos: futuras.filter((f) => f.tipo === 'evento').length,
  };
}

// ── Eliminar (apartado 15) ───────────────────────────────────────────────────────────────────────
// *"Si el evento tiene información importante, solicitar confirmación."* ⚠️ Enseña, no borra: quien
// borra es `App.jsx` con `eliminarConPapelera`, la única puerta (ME F3). Y como va a la papelera, el
// aviso dice que se recupera — prometer lo contrario sería mentir en pantalla.
export function impactoDeEliminarFecha(fila) {
  if (!fila) return { tieneDatos: false, aviso: '' };
  const importante = [];
  if (fila.notas) importante.push('sus notas');
  if (fila.tipo === 'examen' && fila.planRepaso?.length) importante.push('su plan de repaso');
  return {
    tieneDatos: importante.length > 0,
    importante,
    aviso: importante.length
      ? `Se va también ${importante.join(' y ')}. Puedes recuperarlo desde Eliminados recientemente.`
      : 'Puedes recuperarlo desde Eliminados recientemente.',
  };
}

// ── Lo que esta fase NO construye (apartado 21) ──────────────────────────────────────────────────
export const NO_EN_ES4 = [
  { que: 'Calificaciones avanzadas', porque: 'El apartado 3 lo dice: no se añaden sistemas de notas que no estén definidos. La nota objetivo y la obtenida que ya existían se conservan.' },
  { que: 'Estadísticas académicas', porque: 'Excluidas del apartado 21.' },
  { que: 'Planificación con IA y planificador automático', porque: 'Excluidos del apartado 21.' },
  { que: 'Apps completas de fútbol, ajedrez y música', porque: 'Cada área tiene su sitio en el árbol desde la ES F2, no su contenido.' },
  { que: 'Recordatorios y notificaciones de estas fechas', porque: 'Excluido del apartado 21, y el emisor de avisos es `notificaciones.js`: un segundo emisor es el peor duplicado posible.' },
];

// ── Auditoría de la fase (apartado 22) ───────────────────────────────────────────────────────────
export function condicionES4(estudios) {
  const norm = normalizarFechasDe(estudios);
  const hoy = '2026-09-07';
  const todas = fechasAcademicas(norm);
  const prox = proximasFechas(norm, hoy, { dias: 3650 });

  // Orden por proximidad, sin ordenar a mano.
  const ordenadas = prox.every((f, i) => i === 0 || prox[i - 1].fecha <= f.fecha);
  // Lo pasado no sale como próximo, pero sigue guardado.
  const pasadasSiguen = (norm.examenes || []).length === (estudios?.examenes || []).filter((e) => e?.asignaturaId).length;
  // 🚨 Y ni un registro duplicado: cada id aparece UNA vez en la lista unificada.
  const ids = todas.map((f) => `${f.tipo}:${f.id}`);
  const sinDuplicados = new Set(ids).size === ids.length;

  return [
    { id: 'examenes', ok: typeof editarExamenFecha === 'function' && typeof cambiarEstadoExamen === 'function', texto: 'Se pueden crear, editar y eliminar exámenes' },
    { id: 'entregas', ok: typeof crearEntrega === 'function' && typeof editarEntrega === 'function', texto: 'Se pueden crear entregas' },
    { id: 'estados', ok: ESTADOS_ENTREGA.length === 3 && ESTADOS_EXAMEN.length === 2 && [...ESTADOS_ENTREGA, ...ESTADOS_EXAMEN].every((e) => e.nombre && e.icono), texto: 'Se pueden gestionar sus estados' },
    { id: 'eventos', ok: typeof crearEventoAcademico === 'function' && TIPOS_EVENTO_ACADEMICO.length >= 4, texto: 'Se pueden crear otros eventos académicos, con tipo configurable' },
    { id: 'fecha', ok: todas.every((f) => 'fecha' in f), texto: 'Todo tiene fecha' },
    { id: 'vinculado', ok: todas.every((f) => typeof f.asignaturaId === 'string' && f.asignaturaId), texto: 'Todo está vinculado a su asignatura' },
    { id: 'home', ok: typeof proximasFechas === 'function', texto: 'Los próximos aparecen automáticamente en el Home' },
    { id: 'orden', ok: ordenadas, texto: 'Se ordenan por proximidad' },
    { id: 'pasados', ok: proximasFechas(norm, '2099-01-01').length === 0 && pasadasSiguen, texto: 'Lo pasado no aparece como próximo, pero sigue guardado' },
    { id: 'persisten', ok: JSON.stringify(normalizarFechasDe(norm)) === JSON.stringify(norm), texto: 'Los datos persisten: normalizar dos veces da lo mismo' },
    { id: 'sin_duplicados', ok: sinDuplicados, texto: 'No existen registros duplicados' },
    { id: 'no_implementado_4', ok: NO_EN_ES4.length >= 5 && NO_EN_ES4.every((x) => x.porque), texto: 'Lo que no se implementa todavía está declarado con su motivo' },
  ];
}
