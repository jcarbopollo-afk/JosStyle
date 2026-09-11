// Entrega 3 · ES Fase 3 — Asignaturas y gestión académica.
//
// 🚨 LO PRIMERO, OTRA VEZ: **una asignatura YA EXISTE**. Es `{ id, programaId, nombre }` y vive en
// `estudios.asignaturas` desde la Fase 6 del proyecto. La leen `AsignaturaCard`, la papelera, el
// **Horario Top** —*sus asignaturas son las de Estudios*, HT F2 apartado 25—, `calendarioIntegracion`
// y `exportData`. Así que esta fase **amplía la entidad**: `icono`, `acento`, `profesor`, `aula`,
// `orden` y `oculto`, con su normalizador corriendo **al cargar** (regla 5, vigesimocuarta vez).
// Ni un campo renombrado: `id`, `programaId` y `nombre` siguen intactos.
//
// 🚨 Y LOS TEMAS SON UNA LISTA DE PRIMER NIVEL, `estudios.temas`, con su `asignaturaId` — igual que
// `examenes` y `horas` desde la Fase 6. Meterlos DENTRO de la asignatura habría sido más corto y los
// habría dejado **invisibles para la papelera**, que se indexa por `módulo.colección`: es la lección
// de EH F45, donde tres listas se borraban para siempre sin que nadie lo viera.
//
// ⚠️ El acento se guarda como TOKEN (`ACENTOS_COLECCION`, de la BL F7), nunca como hex: un hex
// guardado se queda fijo cuando Josué cambia de tema (regla 2, y la E3 F21 lo dijo con las
// colecciones). No se escribe un catálogo de colores nuevo: ya hay uno.

import { uid, todayISO } from './helpers';
import { ACENTOS_COLECCION, ACENTO_POR_DEFECTO, acentoColeccion } from './colecciones';
// ES F4 — las fechas académicas son de `fechasAcademicas.js`, que es la única que las junta
// (apartado 19). Aquí solo se leen para contar; ni una copia.
import { cuentasDeAsignatura, fechasAcademicas } from './fechasAcademicas';

export { ACENTOS_COLECCION, ACENTO_POR_DEFECTO, acentoColeccion };

// ── Lo que esta fase NO construye (apartado 15) ──────────────────────────────────────────────────
export const NO_EN_ES3 = [
  { que: 'Sistema completo de exámenes', porque: 'Es la ES F4. Los que ya existían desde la Fase 6 se conservan y se siguen usando.' },
  { que: 'Sistema completo de entregas', porque: 'La entidad no existe todavía, y deducirla del título de una tarea sería vincular dos cosas distintas (E3 F12).' },
  { que: 'Calendario global', porque: 'Los exámenes ya salen en el Calendario Universal desde `calendarioIntegracion.js`.' },
  { que: 'Estadísticas académicas avanzadas', porque: 'Excluidas del apartado 15.' },
  { que: 'Planificación con IA', porque: 'Excluida del apartado 15. El panel que ya existía sigue donde lo dejó la ES F1.' },
  { que: 'Apps de fútbol, ajedrez y música completas', porque: 'Cada área tiene su sitio en el árbol desde la ES F2, no su contenido.' },
];

// ── Iconos ───────────────────────────────────────────────────────────────────────────────────────
// Como en la ES F1, y por el mismo motivo: las asignaturas **las escribe Josué**, así que su icono
// tiene que ser algo que pueda elegir desde un iPhone.
export const ICONOS_ASIGNATURA = [
  '📐', '🧮', '🧬', '⚛️', '🧪', '🔬', '🌍', '🗺️',
  '📚', '📖', '✍️', '🇬🇧', '🇫🇷', '🎨', '🎼', '💻',
  '⚖️', '🏛️', '💰', '🧠', '🏃', '🛠️',
];

export const ICONO_ASIGNATURA_POR_DEFECTO = '📓';

export const SUGERENCIAS_ICONO_ASIGNATURA = [
  { busca: ['matem', 'álgebra', 'algebra', 'geometr', 'cálculo', 'calculo', 'estadíst', 'estadist'], icono: '📐' },
  { busca: ['biolog'], icono: '🧬' },
  { busca: ['física', 'fisica'], icono: '⚛️' },
  { busca: ['químic', 'quimic'], icono: '🧪' },
  { busca: ['geolog', 'ciencia'], icono: '🔬' },
  { busca: ['geograf'], icono: '🗺️' },
  { busca: ['histor'], icono: '🏛️' },
  { busca: ['ingl', 'english'], icono: '🇬🇧' },
  { busca: ['franc'], icono: '🇫🇷' },
  { busca: ['lengua', 'literat', 'castellan'], icono: '📖' },
  { busca: ['filosof', 'ética', 'etica'], icono: '🧠' },
  { busca: ['inform', 'program', 'tecnolog'], icono: '💻' },
  { busca: ['econom', 'empresa'], icono: '💰' },
  { busca: ['derecho', 'latín', 'latin', 'griego'], icono: '⚖️' },
  { busca: ['arte', 'dibuj', 'plástic', 'plastic'], icono: '🎨' },
  { busca: ['música', 'musica', 'solfeo'], icono: '🎼' },
  { busca: ['educación física', 'educacion fisica', 'deporte', 'gimnas'], icono: '🏃' },
];

export function sugerirIconoAsignatura(nombre) {
  const t = String(nombre || '').trim().toLowerCase();
  if (!t) return null;
  const hit = SUGERENCIAS_ICONO_ASIGNATURA.find((s) => s.busca.some((p) => t.includes(p)));
  return hit ? hit.icono : null;
}

// ⚠️ Se PINTA con el de por defecto, pero al normalizar **no se le escribe uno que él no eligió**
// (la lección de la E3 F41 con las apps, y la de la E3 F33 con el momento de una comida).
export function iconoDeAsignatura(a) {
  return (a && typeof a.icono === 'string' && a.icono.trim()) || ICONO_ASIGNATURA_POR_DEFECTO;
}

// ── Los temas y su estado (apartados 6 y 7) ──────────────────────────────────────────────────────
// *"No utilizar sistemas de porcentaje complicados si no aportan valor."* Tres estados, y cada uno
// con **icono y palabra**: el color nunca va solo (EH F42, apartado 6).
export const ESTADOS_TEMA = [
  { id: 'pendiente', nombre: 'Pendiente', icono: '○', acento: null },
  { id: 'progreso', nombre: 'En progreso', icono: '◐', acento: 'warning' },
  { id: 'completado', nombre: 'Completado', icono: '●', acento: 'positive' },
];

export const IDS_ESTADO_TEMA = ESTADOS_TEMA.map((e) => e.id);
export const ESTADO_TEMA_POR_DEFECTO = 'pendiente';
export const estadoTema = (id) => ESTADOS_TEMA.find((e) => e.id === id) || ESTADOS_TEMA[0];

// El siguiente estado al tocarlo: pendiente → en progreso → completado → pendiente.
export function siguienteEstadoTema(id) {
  const i = IDS_ESTADO_TEMA.indexOf(id);
  return IDS_ESTADO_TEMA[(i + 1) % IDS_ESTADO_TEMA.length];
}

export const MAX_NOMBRE_ASIGNATURA = 40;
export const MAX_NOMBRE_TEMA = 60;
export const MAX_DESCRIPCION_TEMA = 200;

// ── Normalizadores (regla 5) ─────────────────────────────────────────────────────────────────────
export function normalizarAsignatura(a, indice = 0) {
  if (!a || typeof a !== 'object') return null;
  const nombre = typeof a.nombre === 'string' ? a.nombre.trim().slice(0, MAX_NOMBRE_ASIGNATURA) : '';
  if (!nombre) return null;
  const texto = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  return {
    ...a,
    id: typeof a.id === 'string' && a.id ? a.id : uid(),
    // ⚠️ `programaId` se conserva TAL CUAL, incluso si apunta a un área borrada: quien limpia una
    // cascada es `App.jsx`, y adivinar aquí escondería la asignatura sin decírselo a nadie.
    nombre,
    icono: typeof a.icono === 'string' && a.icono.trim() ? a.icono.trim() : null,
    acento: ACENTOS_COLECCION.some((x) => x.id === a.acento) ? a.acento : null,
    profesor: texto(a.profesor, 60),
    aula: texto(a.aula, 20),
    orden: Number.isFinite(a.orden) ? a.orden : indice,
    oculto: a.oculto === true,
  };
}

export function normalizarTema(t, indice = 0) {
  if (!t || typeof t !== 'object') return null;
  const nombre = typeof t.nombre === 'string' ? t.nombre.trim().slice(0, MAX_NOMBRE_TEMA) : '';
  if (!nombre) return null;
  const asignaturaId = typeof t.asignaturaId === 'string' && t.asignaturaId ? t.asignaturaId : null;
  // 🚨 Un tema sin asignatura no existe: no se puede pintar en ninguna pantalla y sería un huérfano
  // invisible. Se descarta, como un accesorio sin `prendaId` (EH F26).
  if (!asignaturaId) return null;
  return {
    id: typeof t.id === 'string' && t.id ? t.id : uid(),
    asignaturaId,
    nombre,
    descripcion: typeof t.descripcion === 'string' && t.descripcion.trim()
      ? t.descripcion.trim().slice(0, MAX_DESCRIPCION_TEMA)
      : null,
    estado: IDS_ESTADO_TEMA.includes(t.estado) ? t.estado : ESTADO_TEMA_POR_DEFECTO,
    orden: Number.isFinite(t.orden) ? t.orden : indice,
  };
}

// ⚠️ Devuelve el módulo ENTERO: `saveData` sobrescribe, así que perder `programas`, `examenes` u
// `horas` aquí las borraría todas de una vez (regla 5).
export function normalizarAsignaturasDe(estudios) {
  if (!estudios || typeof estudios !== 'object') return estudios;
  const asignaturas = (Array.isArray(estudios.asignaturas) ? estudios.asignaturas : [])
    .map((a, i) => normalizarAsignatura(a, i)).filter(Boolean);
  const temas = (Array.isArray(estudios.temas) ? estudios.temas : [])
    .map((t, i) => normalizarTema(t, i)).filter(Boolean);
  return { ...estudios, asignaturas, temas };
}

// ── Crear y editar ───────────────────────────────────────────────────────────────────────────────
export function crearAsignatura({ nombre, programaId, icono, acento, profesor, aula } = {}, existentes = []) {
  const n = String(nombre || '').trim().slice(0, MAX_NOMBRE_ASIGNATURA);
  if (!n || !programaId) return null;
  const delArea = existentes.filter((a) => a.programaId === programaId);
  const orden = delArea.reduce((max, a) => Math.max(max, Number.isFinite(a?.orden) ? a.orden : 0), -1) + 1;
  return normalizarAsignatura({
    id: uid(), programaId, nombre: n,
    icono: (typeof icono === 'string' && icono.trim()) || sugerirIconoAsignatura(n) || null,
    acento: acento || null, profesor: profesor || null, aula: aula || null,
    orden, oculto: false,
  }, orden);
}

export function editarAsignatura(asignaturas = [], id, cambios = {}) {
  return asignaturas.map((a) => {
    if (a.id !== id) return a;
    // ⚠️ Ni el id ni el `programaId` se pueden cambiar desde aquí: mover una asignatura de área es
    // otra cosa, y hacerlo por la puerta de atrás dejaría sus exámenes en el área equivocada.
    const { id: _i, programaId: _p, ...resto } = cambios;
    return normalizarAsignatura({ ...a, ...resto }, a.orden);
  });
}

export const alternarOcultaAsignatura = (asignaturas = [], id) =>
  asignaturas.map((a) => (a.id === id ? { ...a, oculto: !a.oculto } : a));

// ⚠️ Ocultar no es eliminar (EH F36, y ya van tres veces en este bloque).
export const AVISO_OCULTAR_ASIGNATURA = 'Ocultarla solo la quita de la lista. Sus exámenes, sus horas y sus temas se quedan como están.';

export function asignaturasOrdenadas(estudios, programaId) {
  const lista = Array.isArray(estudios?.asignaturas) ? estudios.asignaturas : [];
  return lista
    .filter((a) => a && a.programaId === programaId)
    .sort((a, b) => (Number.isFinite(a.orden) ? a.orden : 0) - (Number.isFinite(b.orden) ? b.orden : 0));
}

export const asignaturasVisibles = (estudios, programaId) =>
  asignaturasOrdenadas(estudios, programaId).filter((a) => !a.oculto);

// Flechas, no arrastre (EH F50): funcionan con VoiceOver y no son un segundo mecanismo.
export function moverAsignatura(asignaturas = [], programaId, id, direccion) {
  const orden = asignaturas
    .filter((a) => a.programaId === programaId)
    .sort((a, b) => (Number.isFinite(a.orden) ? a.orden : 0) - (Number.isFinite(b.orden) ? b.orden : 0));
  const i = orden.findIndex((a) => a.id === id);
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= orden.length) return asignaturas;
  const movido = [...orden];
  [movido[i], movido[j]] = [movido[j], movido[i]];
  const nuevo = new Map(movido.map((a, k) => [a.id, k]));
  return asignaturas.map((a) => (nuevo.has(a.id) ? { ...a, orden: nuevo.get(a.id) } : a));
}

// ── Temas ────────────────────────────────────────────────────────────────────────────────────────
export function temasDe(estudios, asignaturaId) {
  const lista = Array.isArray(estudios?.temas) ? estudios.temas : [];
  return lista
    .filter((t) => t && t.asignaturaId === asignaturaId)
    .sort((a, b) => (Number.isFinite(a.orden) ? a.orden : 0) - (Number.isFinite(b.orden) ? b.orden : 0));
}

export function crearTema({ nombre, asignaturaId, descripcion } = {}, existentes = []) {
  const n = String(nombre || '').trim().slice(0, MAX_NOMBRE_TEMA);
  if (!n || !asignaturaId) return null;
  const delTema = existentes.filter((t) => t.asignaturaId === asignaturaId);
  const orden = delTema.reduce((max, t) => Math.max(max, Number.isFinite(t?.orden) ? t.orden : 0), -1) + 1;
  // ⚠️ Nace **Pendiente**, que es el estado de algo que no se ha empezado. No es una respuesta puesta
  // por él: es el único estado que puede tener un tema recién creado.
  return normalizarTema({ id: uid(), asignaturaId, nombre: n, descripcion: descripcion || null, estado: ESTADO_TEMA_POR_DEFECTO, orden }, orden);
}

export function editarTema(temas = [], id, cambios = {}) {
  return temas.map((t) => {
    if (t.id !== id) return t;
    const { id: _i, asignaturaId: _a, ...resto } = cambios;
    return normalizarTema({ ...t, ...resto }, t.orden);
  });
}

export const cambiarEstadoTema = (temas = [], id, estado) =>
  temas.map((t) => (t.id === id ? { ...t, estado: IDS_ESTADO_TEMA.includes(estado) ? estado : t.estado } : t));

export const avanzarTema = (temas = [], id) =>
  temas.map((t) => (t.id === id ? { ...t, estado: siguienteEstadoTema(t.estado) } : t));

export function moverTema(temas = [], asignaturaId, id, direccion) {
  const orden = temas
    .filter((t) => t.asignaturaId === asignaturaId)
    .sort((a, b) => (Number.isFinite(a.orden) ? a.orden : 0) - (Number.isFinite(b.orden) ? b.orden : 0));
  const i = orden.findIndex((t) => t.id === id);
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= orden.length) return temas;
  const movido = [...orden];
  [movido[i], movido[j]] = [movido[j], movido[i]];
  const nuevo = new Map(movido.map((t, k) => [t.id, k]));
  return temas.map((t) => (nuevo.has(t.id) ? { ...t, orden: nuevo.get(t.id) } : t));
}

// ── El resumen compacto de una asignatura (apartado 8) ───────────────────────────────────────────
// *"Esto debe ser compacto. No convertirlo en un panel gigante."* Así que son **líneas cortas, y solo
// las que tienen algo que decir**: `[]` cuando no hay nada, nunca una fila de ceros.
//
// 🚨 Y no hay línea de entregas, porque **no existe la entidad**: el apartado 8 la pone de ejemplo
// —*"1 entrega pendiente"*— y escribirla sería una cifra inventada (regla 8). Está declarado.
// 🔓 **La ES F3 tuvo que declarar esta línea imposible, y la ES F4 la construye.** El apartado 8 de
// la F3 ponía *"1 entrega pendiente"* de ejemplo cuando la entidad no existía; ahora existe, así que
// la frase deja de ser una cifra inventada y pasa a ser un dato. Se conserva la constante para que
// se vea de dónde viene la promesa y quién la cumplió.
export const NO_HAY_ENTREGAS = {
  que: 'Entregas pendientes',
  porque: 'Ya existen: las construyó la ES F4 y esta línea las cuenta.',
  resueltoEn: 'ES F4',
};

export const DIAS_EXAMEN_PROXIMO = 30;

export function resumenAsignatura(estudios, asignaturaId, hoy = todayISO()) {
  const temas = temasDe(estudios, asignaturaId);
  const pendientes = temas.filter((t) => t.estado === 'pendiente').length;
  const enProgreso = temas.filter((t) => t.estado === 'progreso').length;
  const { examenesProximos, entregasPendientes } = cuentasDeAsignatura(estudios, asignaturaId, hoy);

  const lineas = [];
  if (pendientes) lineas.push(`${pendientes} ${pendientes === 1 ? 'tema pendiente' : 'temas pendientes'}`);
  if (enProgreso) lineas.push(`${enProgreso} en progreso`);
  if (examenesProximos) lineas.push(`${examenesProximos} ${examenesProximos === 1 ? 'examen próximo' : 'exámenes próximos'}`);
  if (entregasPendientes) lineas.push(`${entregasPendientes} ${entregasPendientes === 1 ? 'entrega pendiente' : 'entregas pendientes'}`);
  return lineas;
}

// La línea de la LISTA de asignaturas: una como mucho, y `null` si no hay nada que decir (ES F1).
export function lineaDeAsignatura(estudios, asignaturaId, hoy = todayISO()) {
  return resumenAsignatura(estudios, asignaturaId, hoy)[0] || null;
}

// ── Las secciones de una asignatura (apartado 4) ─────────────────────────────────────────────────
// Mismo reparto que las ramas de la ES F2: cada sección declara el sistema que enseña, y la que no
// tiene uno **no se pinta como una tarjeta que no lleva a ninguna parte**.
// 🔓 **Entregas deja de estar declarada como imposible: la ES F4 la construye.** Y se suma Eventos,
// el cajón con tipo configurable del apartado 6 de esa fase.
export const SECCIONES_ASIGNATURA = [
  { id: 'examenes', nombre: 'Exámenes', icono: '📝', existe: true },
  { id: 'entregas', nombre: 'Entregas', icono: '📋', existe: true },
  { id: 'eventos', nombre: 'Eventos', icono: '📅', existe: true },
  { id: 'contenido', nombre: 'Contenido', icono: '📚', existe: true },
];

export const SECCIONES_QUE_EXISTEN = SECCIONES_ASIGNATURA.filter((s) => s.existe);
export const seccionAsignatura = (id) => SECCIONES_ASIGNATURA.find((s) => s.id === id) || null;

// ⚠️ Los tres tipos de fecha se cuentan con `fechasAcademicas()`, la única fuente (ES F4, apartado
// 19): ni una lista se recorre por su cuenta aquí.
const PALABRAS_SECCION = {
  contenido: ['tema', 'temas'],
  examenes: ['examen', 'exámenes'],
  entregas: ['entrega', 'entregas'],
  eventos: ['evento', 'eventos'],
};

export function seccionesDeAsignatura(estudios, asignaturaId) {
  const suyas = fechasAcademicas(estudios, { asignaturaId });
  return SECCIONES_QUE_EXISTEN.map((s) => {
    const n = s.id === 'contenido'
      ? temasDe(estudios, asignaturaId).length
      : suyas.filter((f) => `${f.tipo}s` === s.id || (f.tipo === 'examen' && s.id === 'examenes')).length;
    const [sing, plur] = PALABRAS_SECCION[s.id] || ['elemento', 'elementos'];
    return { ...s, cuantos: n, linea: n === 0 ? null : `${n} ${n === 1 ? sing : plur}` };
  });
}

// ── Eliminar: se enseña el impacto ANTES (apartado 3) ────────────────────────────────────────────
// *"Antes de eliminar, mostrar confirmación si existen datos asociados. No eliminar accidentalmente
// exámenes o entregas relacionados."* ⚠️ `impactoDeEliminarAsignatura` **enseña, no borra** (EH F39):
// quien borra sigue siendo `App.jsx` con `eliminarConPapelera`, la única puerta (ME F3).
export function impactoDeEliminarAsignatura(estudios, asignaturaId) {
  const examenes = (estudios?.examenes || []).filter((e) => e && e.asignaturaId === asignaturaId);
  const horas = (estudios?.horas || []).filter((h) => h && h.asignaturaId === asignaturaId);
  const temas = temasDe(estudios, asignaturaId);
  const entregas = (estudios?.entregas || []).filter((t) => t && t.asignaturaId === asignaturaId);
  const eventos = (estudios?.eventos || []).filter((v) => v && v.asignaturaId === asignaturaId);
  const arrastra = [];
  if (examenes.length) arrastra.push(`${examenes.length} ${examenes.length === 1 ? 'examen' : 'exámenes'}`);
  if (entregas.length) arrastra.push(`${entregas.length} ${entregas.length === 1 ? 'entrega' : 'entregas'}`);
  if (eventos.length) arrastra.push(`${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'}`);
  if (temas.length) arrastra.push(`${temas.length} ${temas.length === 1 ? 'tema' : 'temas'}`);
  if (horas.length) arrastra.push(`${horas.length} ${horas.length === 1 ? 'sesión de estudio' : 'sesiones de estudio'}`);
  return {
    tieneDatos: arrastra.length > 0,
    arrastra,
    // ⚠️ Va a la papelera y VUELVE, así que el aviso no promete un borrado definitivo: prometerlo
    // sería mentir en pantalla (E3 F26).
    aviso: arrastra.length
      ? `Se va con ella ${arrastra.join(', ')}. Puedes recuperarlo todo desde Eliminados recientemente.`
      : 'Puedes recuperarla desde Eliminados recientemente.',
  };
}

// ── La relación con las fechas (apartado 12) ─────────────────────────────────────────────────────
// *"En esta fase preparar correctamente la relación."* Ya estaba preparada: un examen lleva su
// `asignaturaId` desde la Fase 6, y por eso sale en el Calendario y en la zona de PRÓXIMO del Home
// sin que nadie lo copie. Se declara para que ninguna fase futura invente una segunda.
export const RELACION_FECHAS = [
  { entidad: 'Examen', campo: 'asignaturaId', desde: 'la Fase 6 del proyecto', loUsa: 'calendarioIntegracion.js, la zona de PRÓXIMO de la ES F1 y el Dashboard' },
  { entidad: 'Horas de estudio', campo: 'asignaturaId', desde: 'la Fase 6 del proyecto', loUsa: 'la correlación con el sueño y la exportación' },
  { entidad: 'Tema', campo: 'asignaturaId', desde: 'la ES F3', loUsa: 'el contenido de la asignatura' },
];

// ── Auditoría de la fase (apartado 16) ───────────────────────────────────────────────────────────
export function condicionES3(estudios) {
  const norm = normalizarAsignaturasDe(estudios);
  const asigs = norm.asignaturas || [];
  const a1 = asigs[0];

  // Persistencia: lo creado sobrevive a otra pasada del normalizador.
  const creada = crearAsignatura({ nombre: 'Prueba', programaId: a1?.programaId || 'x' }, asigs);
  const conTema = creada ? crearTema({ nombre: 'Tema 1', asignaturaId: creada.id }, norm.temas || []) : null;
  const rehecho = normalizarAsignaturasDe({
    ...norm,
    asignaturas: [...asigs, creada].filter(Boolean),
    temas: [...(norm.temas || []), conTema].filter(Boolean),
  });
  const persiste = !!creada && !!conTema
    && rehecho.asignaturas.some((a) => a.id === creada.id)
    && rehecho.temas.some((t) => t.id === conTema.id && t.asignaturaId === creada.id);

  return [
    { id: 'crear', ok: typeof crearAsignatura === 'function' && !!creada, texto: 'Se pueden crear asignaturas' },
    { id: 'editar', ok: typeof editarAsignatura === 'function' && typeof alternarOcultaAsignatura === 'function', texto: 'Se pueden editar y ocultar' },
    { id: 'eliminar', ok: typeof impactoDeEliminarAsignatura === 'function' && impactoDeEliminarAsignatura(norm, a1?.id).aviso.length > 0, texto: 'Se pueden eliminar, y antes se enseña lo que se va con ellas' },
    { id: 'espacio', ok: SECCIONES_QUE_EXISTEN.length >= 2 && typeof seccionesDeAsignatura === 'function', texto: 'Cada asignatura tiene su propio espacio' },
    { id: 'temas', ok: typeof crearTema === 'function' && typeof editarTema === 'function' && typeof temasDe === 'function', texto: 'Existe la estructura de temas, y se crean, editan y eliminan' },
    { id: 'progreso', ok: ESTADOS_TEMA.length === 3 && ESTADOS_TEMA.every((e) => e.nombre && e.icono), texto: 'Se puede marcar el progreso de un tema' },
    { id: 'orden', ok: typeof moverAsignatura === 'function' && typeof moverTema === 'function', texto: 'Se puede ordenar el contenido' },
    { id: 'relacion', ok: asigs.every((a) => typeof a.programaId === 'string'), texto: 'Las asignaturas están relacionadas con su área' },
    { id: 'preparado', ok: RELACION_FECHAS.length >= 3 && RELACION_FECHAS.every((r) => r.campo === 'asignaturaId'), texto: 'La arquitectura está preparada para exámenes y entregas' },
    { id: 'persiste', ok: persiste, texto: 'Todo persiste correctamente' },
    // ⚠️ No basta con contar: se comprueba que los exámenes y las horas vuelvan **idénticos**, porque
    // esta fase no los normaliza y tocarlos sería romper lo que ya funcionaba desde la Fase 6.
    { id: 'no_roto', ok: JSON.stringify(norm.examenes || []) === JSON.stringify(estudios?.examenes || []) && JSON.stringify(norm.horas || []) === JSON.stringify(estudios?.horas || []), texto: 'No se ha roto ninguna funcionalidad anterior' },
    { id: 'no_implementado_3', ok: NO_EN_ES3.length >= 6 && NO_EN_ES3.every((x) => x.porque), texto: 'Lo que no se implementa todavía está declarado con su motivo' },
  ];
}
