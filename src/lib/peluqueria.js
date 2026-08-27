// ============================================================================
// EH · Fase 11/65 — PELUQUERÍA: CALENDARIO Y SEGUIMIENTO DE CORTES
//
// *"Saber cuándo te cortaste el pelo, cuándo quieres volver a cortártelo y
// recibir recordatorios."* Y, subrayado en el objetivo: **"No crear otro
// calendario independiente."**
//
// ── ⚠️ LA DISTINCIÓN QUE SOSTIENE TODA LA FASE ─────────────────────────────
//
// El apartado 15 la escribe entera: **evento planificado ≠ historial.**
//
//   - Un **corte realizado** es historia. Pasó. No se cancela: se borra si fue
//     un error, y punto.
//   - Un **próximo corte** es un plan. Se puede cambiar, cancelar o dejar pasar,
//     y **borrarlo no borra ningún corte**.
//
// Son dos cosas, y por eso son dos listas. Meterlas en una sola —un "corte" con
// un campo `hecho`— parece más simple hasta el día en que cancelar una cita
// borra el corte que sí te diste.
//
// ── LAS TRES REGLAS QUE VIENEN DE FASES ANTERIORES ─────────────────────────
//
// **1. La frecuencia YA se preguntó** (F7, apartado 13: *"¿Cada cuánto sueles
// cortarte el pelo?"*, y el propio enunciado decía *"este dato podrá utilizarse
// posteriormente para el calendario"*). Así que **se lee de allí**, y solo se
// guarda aquí un número si él lo cambia a mano — con el mismo criterio que
// `tallaDe()` en la Fase 5: lo que ya se sabe manda, lo guardado rellena huecos,
// y el choque se enseña.
//
// **2. Este archivo DECIDE avisos, no los manda.** El emisor es
// `notificaciones.js` desde la Fase A4, con su permiso, su interruptor global y
// su horario de descanso. Mismo reparto que `avisosHorario.js` en HT F10: un
// segundo emisor daría dos avisos por lo mismo.
//
// **3. Nada se crea solo** (apartado 16). *"No reservar ni crear automáticamente
// nada sin que el usuario lo confirme."* `sugerirProximoCorte()` **sugiere**;
// guardarlo es otra llamada, y la hace él.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { MODULO_PELO, respuestaPelo } from './perfilCapilar';
import { datosPelo, parteActiva } from './rutinasPelo';
import { uid, todayISO, addDays } from './helpers';

export const PARTE_PELUQUERIA = 'peluqueria';

/* ===========================================================================
   1 · FRECUENCIA — LA QUE YA SE PREGUNTÓ (apartado 4)
   ===========================================================================
   ⚠️ F7 ya la preguntó. Aquí solo se traduce a semanas, que es lo que el
   calendario necesita para calcular. */

export const OPCIONES_FRECUENCIA_CORTE = [1, 2, 3, 4, 5, 6];

/* Las respuestas de la Fase 7, en semanas. Las dos últimas **no dan un número**,
   y eso no es un fallo: *"cuando lo necesito"* es una respuesta legítima que
   sencillamente no permite calcular una fecha. */
export const SEMANAS_DE_RESPUESTA = {
  semana: 1,
  '2_semanas': 2,
  '3_semanas': 3,
  mes: 4,
  '2_meses': 8,
  necesito: null,
  otro: null,
};

export const ORIGENES_FRECUENCIA = ['perfil', 'propia', 'ninguna'];

/**
 * ⚠️ **La única respuesta a "cada cuánto se corta".** Igual que `tallaDe()` en
 * la Fase 5: lo que ya se sabe manda, lo guardado rellena el hueco, y si los dos
 * existen y no coinciden **se enseña el choque** en vez de elegir en silencio.
 */
export function frecuenciaDeCorte(estado, datosGlobales = {}) {
  const d = datosPeluqueria(estado);
  const respuesta = respuestaPelo(estado, 'frecuenciaCorte', datosGlobales);
  const delPerfil = respuesta.contestada && !respuesta.noSabe
    ? SEMANAS_DE_RESPUESTA[respuesta.valores[0]] ?? null
    : null;

  if (delPerfil !== null) {
    return {
      semanas: delPerfil,
      origen: 'perfil',
      texto: `Cada ${delPerfil} ${delPerfil === 1 ? 'semana' : 'semanas'}`,
      de: 'Lo que indicaste en tu perfil capilar',
      conflicto: d.semanas !== null && d.semanas !== delPerfil
        ? { guardada: d.semanas, perfil: delPerfil }
        : null,
    };
  }
  if (d.semanas !== null) {
    return {
      semanas: d.semanas, origen: 'propia',
      texto: `Cada ${d.semanas} ${d.semanas === 1 ? 'semana' : 'semanas'}`,
      de: 'La que has puesto aquí', conflicto: null,
    };
  }
  return {
    semanas: null, origen: 'ninguna',
    // ⚠️ Sin frecuencia no se calcula nada, y se dice por qué.
    texto: 'Sin frecuencia fija',
    de: respuesta.contestada ? 'Dijiste que te lo cortas cuando lo necesitas' : '',
    conflicto: null,
  };
}

export function guardarFrecuencia(estado, semanas) {
  const n = Number(semanas);
  if (semanas === null) return { estado: escribir(estado, { ...datosPeluqueria(estado), semanas: null }), error: null };
  if (!Number.isInteger(n) || n < 1 || n > 52) {
    return { estado: normalizarEstiloHombre(estado), error: 'La frecuencia va de 1 a 52 semanas.' };
  }
  return { estado: escribir(estado, { ...datosPeluqueria(estado), semanas: n }), error: null };
}

/* ===========================================================================
   2 · EL ALMACÉN — DOS LISTAS, A PROPÓSITO (apartado 15)
   =========================================================================== */

export const PREFERENCIAS_CORTE = [
  { id: 'mas_corto', nombre: 'Más corto' },
  { id: 'mas_largo', nombre: 'Más largo' },
  { id: 'mantener', nombre: 'Mantener' },
  { id: 'cambiar', nombre: 'Cambiar estilo' },
];

export const preferenciaCorte = (id) => PREFERENCIAS_CORTE.find((p) => p.id === id) || null;

export const ANTELACIONES_AVISO = [
  { id: 'mismo_dia', nombre: 'El mismo día', dias: 0 },
  { id: '1_dia', nombre: '1 día antes', dias: 1 },
  { id: '2_dias', nombre: '2 días antes', dias: 2 },
  { id: '3_dias', nombre: '3 días antes', dias: 3 },
  { id: '1_semana', nombre: '1 semana antes', dias: 7 },
];

export const antelacion = (id) => ANTELACIONES_AVISO.find((a) => a.id === id) || null;

/* ⚠️ **`corteId`, `valoracion` y `objetivo` los añadió la Fase 12**, y son el
   décimo, undécimo y duodécimo campo que se enseña a un normalizador en este
   proyecto. Un normalizador que no conoce un campo LO BORRA en el siguiente
   guardado (regla 5): valorar un corte habría funcionado hasta recargar. */
export const DEFAULT_PELUQUERIA = {
  cortes: [],      // historia: [{ id, fecha, nota, preferencia, sitioId, corteId, valoracion }]
  cita: null,      // el plan: { id, fecha, hora, nota, recordatorio, antelacion }
  sitios: [],      // [{ id, nombre, lugar, nota }] — apartado 12
  semanas: null,   // frecuencia propia, solo si la pone a mano
  // F12, apartado 12 — *"🎯 Quiero probar"*. Aquí solo se guarda; QUIÉN puede
  // ser objetivo y por qué lo decide `cortesPelo.js`. Mismo reparto que
  // `gestionModulos.js` con `estiloDeHombre.js`.
  objetivo: null,  // { id, nombre }
};

function normalizarCorte(g) {
  const c = g || {};
  return {
    id: c.id || uid(),
    fecha: typeof c.fecha === 'string' ? c.fecha : null,
    nota: (c.nota || '').trim(),
    preferencia: preferenciaCorte(c.preferencia) ? c.preferencia : null,
    sitioId: c.sitioId || null,
    // F12, apartado 13 — *"¿Qué corte te hiciste? Opcional."* Un id suelto, sin
    // validar contra el catálogo: un corte que él borró del catálogo no puede
    // desaparecer de su propio historial.
    corteId: c.corteId || null,
    // F12, apartado 14 — la valoración. `null` es "todavía no la ha dado", que
    // no es lo mismo que "normal".
    valoracion: typeof c.valoracion === 'string' && c.valoracion ? c.valoracion : null,
  };
}

/** F12, apartado 12 — el objetivo es un id y un nombre, y nada más. */
function normalizarObjetivo(g) {
  if (!g || typeof g !== 'object' || !g.id) return null;
  return { id: String(g.id), nombre: String(g.nombre || g.id) };
}

function horaValida(h) {
  if (typeof h !== 'string' || !/^\d{2}:\d{2}$/.test(h)) return false;
  const [hh, mm] = h.split(':').map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function normalizarCita(g) {
  if (!g || typeof g !== 'object' || typeof g.fecha !== 'string') return null;
  return {
    id: g.id || uid(),
    fecha: g.fecha,
    // ⚠️ La forma no basta: "25:99" encaja con `\d{2}:\d{2}` y no es una hora.
    // Lo encontró la prueba.
    hora: horaValida(g.hora) ? g.hora : null,
    nota: (g.nota || '').trim(),
    // ⚠️ Apartado 5 — el recordatorio nace APAGADO. *"Nunca activarlos de forma
    // invasiva."* Aquí sí se quieren, pero se piden.
    recordatorio: g.recordatorio === true,
    antelacion: antelacion(g.antelacion) ? g.antelacion : '3_dias',
    sitioId: g.sitioId || null,
  };
}

export function normalizarPeluqueria(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const semanas = Number(g.semanas);
  return {
    cortes: (Array.isArray(g.cortes) ? g.cortes : [])
      .map(normalizarCorte).filter((c) => c.fecha)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    cita: normalizarCita(g.cita),
    sitios: (Array.isArray(g.sitios) ? g.sitios : [])
      .filter((s) => s && (s.nombre || '').trim())
      .map((s) => ({ id: s.id || uid(), nombre: s.nombre.trim(), lugar: (s.lugar || '').trim(), nota: (s.nota || '').trim() })),
    semanas: Number.isInteger(semanas) && semanas >= 1 && semanas <= 52 ? semanas : null,
    objetivo: normalizarObjetivo(g.objetivo),
  };
}

export const datosPeluqueria = (estado) => normalizarPeluqueria(datosPelo(estado).peluqueria);

const escribir = (estado, datos) => {
  const d = datosPelo(estado);
  return guardarConfig(estado, MODULO_PELO, { pelo: { ...d, peluqueria: datos } });
};

/* ===========================================================================
   3 · REGISTRAR UN CORTE (apartados 2, 8, 9 y 10)
   ===========================================================================
   *"+ Registrar corte… También: Hoy, para hacerlo rápidamente."* */

export function registrarCorte(estado, { fecha = todayISO(), nota = '', preferencia = null, sitioId = null, corteId = null, valoracion = null } = {}) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa fecha no vale.', corte: null };
  }
  const d = datosPeluqueria(estado);
  // Dos cortes el mismo día no son dos cortes.
  if (d.cortes.some((c) => c.fecha === fecha)) {
    return { estado: normalizarEstiloHombre(estado), error: null, corte: d.cortes.find((c) => c.fecha === fecha), yaExistia: true };
  }
  const corte = normalizarCorte({ fecha, nota, preferencia, sitioId, corteId, valoracion });
  return { estado: escribir(estado, { ...d, cortes: [...d.cortes, corte] }), error: null, corte };
}

/**
 * F12, apartado 12 — el almacén del objetivo. ⚠️ **Aquí solo se guarda.** Qué
 * cortes existen y cuál puede ser objetivo lo decide `cortesPelo.js`; este
 * archivo no sabe qué es un "Taper". Mismo reparto que `gestionModulos.js` con
 * `estiloDeHombre.js`, y evita que los dos archivos se importen en círculo.
 */
export function fijarObjetivoDeCorte(estado, objetivo) {
  const d = datosPeluqueria(estado);
  return { estado: escribir(estado, { ...d, objetivo: normalizarObjetivo(objetivo) }), error: null };
}

export function editarCorte(estado, id, cambios = {}) {
  const d = datosPeluqueria(estado);
  const actual = d.cortes.find((c) => c.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese corte no existe.' };
  const nuevo = normalizarCorte({ ...actual, ...cambios, id: actual.id });
  if (!nuevo.fecha) return { estado: normalizarEstiloHombre(estado), error: 'Un corte necesita su fecha.' };
  return { estado: escribir(estado, { ...d, cortes: d.cortes.map((c) => (c.id === id ? nuevo : c)) }), error: null };
}

export function borrarCorte(estado, id) {
  const d = datosPeluqueria(estado);
  if (!d.cortes.some((c) => c.id === id)) return { estado: normalizarEstiloHombre(estado), error: 'Ese corte no existe.' };
  return { estado: escribir(estado, { ...d, cortes: d.cortes.filter((c) => c.id !== id) }), error: null };
}

export const ultimoCorte = (estado) => datosPeluqueria(estado).cortes[0] || null;

/** Apartado 9 — *"esto permite ver la frecuencia real"*. Derivada, no guardada. */
export function historialDeCortes(estado) {
  const d = datosPeluqueria(estado);
  return d.cortes.map((c, i) => {
    const siguiente = d.cortes[i + 1];
    const dias = siguiente
      ? Math.round((new Date(`${c.fecha}T00:00:00`) - new Date(`${siguiente.fecha}T00:00:00`)) / 86400000)
      : null;
    return {
      ...c,
      // Cuánto pasó desde el anterior. `null` en el más antiguo, porque no hay
      // con qué compararlo — no 0.
      diasDesdeElAnterior: dias,
      sitio: d.sitios.find((s) => s.id === c.sitioId)?.nombre || '',
      preferenciaNombre: preferenciaCorte(c.preferencia)?.nombre || '',
    };
  });
}

/** La frecuencia que de verdad lleva, frente a la que dice. Descriptivo. */
export function frecuenciaReal(estado) {
  const h = historialDeCortes(estado).filter((c) => c.diasDesdeElAnterior !== null);
  // ⚠️ Con menos de dos intervalos no se afirma nada: misma disciplina que
  // HT F11 y AR F4.
  if (h.length < 2) return { suficiente: false, semanas: null, texto: '', de: h.length };
  const media = h.reduce((s, c) => s + c.diasDesdeElAnterior, 0) / h.length;
  const semanas = Math.round(media / 7);
  return {
    suficiente: true,
    semanas,
    dias: Math.round(media),
    texto: `De media te lo cortas cada ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`,
    de: h.length,
  };
}

/* ===========================================================================
   4 · LA CITA — EL PLAN (apartados 3, 7, 8 y 15)
   =========================================================================== */

export const MODOS_PROXIMO = [
  { id: 'fecha', nombre: 'Una fecha concreta' },
  { id: 'semanas', nombre: 'En X semanas' },
  { id: 'dias', nombre: 'En X días' },
  { id: 'no_se', nombre: 'Todavía no lo sé' },
];

/**
 * Apartado 3 — las cuatro formas de decir cuándo. ⚠️ *"Todavía no lo sé"* **no
 * crea nada**: es una respuesta, no un hueco que haya que rellenar.
 */
export function planificarCorte(estado, { modo = 'fecha', fecha = null, cantidad = null, desde = todayISO(), ...resto } = {}) {
  const d = datosPeluqueria(estado);
  if (modo === 'no_se') return { estado: escribir(estado, { ...d, cita: null }), error: null, cita: null };

  /* ⚠️ `Number(null)` es 0, y `Number.isInteger(0)` es `true`: sin esta
     comprobación, "en X semanas" **sin decir la X** planificaba el corte para
     HOY, en silencio. Lo encontró la prueba. Una cantidad tiene que venir, y
     tiene que ser positiva. */
  const n = cantidad === null || cantidad === undefined || cantidad === '' ? NaN : Number(cantidad);
  const cantidadValida = Number.isInteger(n) && n > 0;

  let cuando = null;
  if (modo === 'fecha') cuando = fecha;
  else if (modo === 'semanas' && cantidadValida) cuando = addDays(desde, n * 7);
  else if (modo === 'dias' && cantidadValida) cuando = addDays(desde, n);

  if (typeof cuando !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(cuando)) {
    return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido calcular la fecha.', cita: null };
  }
  const cita = normalizarCita({ ...d.cita, ...resto, fecha: cuando });
  return { estado: escribir(estado, { ...d, cita }), error: null, cita };
}

/** Apartado 7 — *"Editar corte"*: fecha, hora, recordatorio y notas. */
export function editarCita(estado, cambios = {}) {
  const d = datosPeluqueria(estado);
  if (!d.cita) return { estado: normalizarEstiloHombre(estado), error: 'No hay ninguna cita planificada.' };
  const cita = normalizarCita({ ...d.cita, ...cambios });
  if (!cita) return { estado: normalizarEstiloHombre(estado), error: 'Esa fecha no vale.' };
  return { estado: escribir(estado, { ...d, cita }), error: null };
}

/**
 * ⚠️ Apartado 15 — *"Esto eliminará el evento del calendario, **pero no el
 * historial del corte**."* La confirmación se pide con este texto, y borrar la
 * cita no toca ni un corte.
 */
export function avisoEliminarCita(estado) {
  const d = datosPeluqueria(estado);
  if (!d.cita) return null;
  return {
    titulo: '¿Eliminar este evento?',
    texto: `Se quitará del calendario el corte del ${d.cita.fecha}. Tu historial de cortes no se toca.`,
    confirmar: 'Eliminar',
    cancelar: 'Cancelar',
  };
}

export function eliminarCita(estado) {
  const d = datosPeluqueria(estado);
  const cortesAntes = d.cortes.length;
  const nuevo = escribir(estado, { ...d, cita: null });
  return { estado: nuevo, error: null, cortesConservados: cortesAntes };
}

/**
 * Apartado 8 — *"✅ Corte realizado"*. ⚠️ **Convierte el plan en historia**: crea
 * el corte y quita la cita, que es exactamente la distinción del apartado 15
 * ocurriendo de verdad.
 */
export function marcarCorteRealizado(estado, { fecha = null, nota = null } = {}) {
  const d = datosPeluqueria(estado);
  if (!d.cita) return { estado: normalizarEstiloHombre(estado), error: 'No hay ninguna cita que marcar.' };
  const cuando = fecha || d.cita.fecha;
  const r = registrarCorte(estado, { fecha: cuando, nota: nota === null ? d.cita.nota : nota, sitioId: d.cita.sitioId });
  if (r.error) return { estado: normalizarEstiloHombre(estado), error: r.error };
  return { estado: escribir(r.estado, { ...datosPeluqueria(r.estado), cita: null }), error: null, corte: r.corte };
}

/* ===========================================================================
   5 · PRÓXIMO CORTE SUGERIDO (apartado 16)
   ===========================================================================
   *"Tu próximo corte podría ser alrededor del 20 de septiembre."*

   ⚠️ *"**No reservar ni crear automáticamente nada sin que el usuario lo
   confirme**."* Esto SUGIERE. Guardarlo es `planificarCorte`, y la hace él. */

export function sugerirProximoCorte(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const ultimo = ultimoCorte(estado);
  const f = frecuenciaDeCorte(estado, datosGlobales);

  if (!ultimo) return { hay: false, motivo: 'sin_cortes', texto: 'Cuando registres un corte podremos calcular el siguiente.' };
  if (f.semanas === null) {
    return {
      hay: false, motivo: 'sin_frecuencia',
      // ⚠️ Y NO se propone una por defecto: "cuando lo necesito" es una
      // respuesta, no un dato que falte.
      texto: 'Dinos cada cuánto sueles cortártelo y te propondremos una fecha.',
    };
  }

  const fecha = addDays(ultimo.fecha, f.semanas * 7);
  return {
    hay: true,
    fecha,
    // *"alrededor del"* — el enunciado usa esa palabra, y con razón.
    texto: `Tu próximo corte podría ser alrededor del ${fecha}.`,
    de: `Último corte el ${ultimo.fecha}, ${f.texto.toLowerCase()}`,
    pasada: fecha < hoy,
    // ⚠️ Que quede claro en el propio dato: esto no está guardado.
    guardado: false,
    accion: 'Planificarlo',
  };
}

/* ===========================================================================
   6 · RECORDATORIOS — SE DECIDEN AQUÍ, SE MANDAN FUERA (apartados 5 y 13)
   ===========================================================================
   *"Aquí sí queremos recordatorios… Pero el usuario decide si quiere
   recordatorios. **Nunca activarlos de forma invasiva**."*

   ⚠️ Y el apartado 13: *"Si el usuario no quiere recordatorios, el calendario
   puede seguir funcionando. **Son dos cosas independientes**."* */

export const MOTIVOS_SIN_AVISO = {
  sin_cita: 'No hay ninguna cita planificada.',
  desactivado: 'No has pedido que te avise de esta cita.',
  modulo_apagado: 'El apartado de Peluquería está desactivado.',
  ya_paso: 'Esa cita ya pasó.',
  todavia_no: 'Todavía no toca avisar.',
};

/**
 * ⚠️ **DECIDE, no manda.** Devuelve qué habría que avisar y cuándo; quien emite
 * sigue siendo `notificaciones.js` (Fase A4), con su permiso, su interruptor
 * global y su horario de descanso. Un segundo emisor daría dos avisos.
 */
export function avisoDeCorte(estado, { hoy = todayISO() } = {}) {
  if (!parteActiva(estado, PARTE_PELUQUERIA)) {
    return { avisar: false, motivo: 'modulo_apagado', texto: MOTIVOS_SIN_AVISO.modulo_apagado };
  }
  const d = datosPeluqueria(estado);
  if (!d.cita) return { avisar: false, motivo: 'sin_cita', texto: MOTIVOS_SIN_AVISO.sin_cita };
  if (!d.cita.recordatorio) return { avisar: false, motivo: 'desactivado', texto: MOTIVOS_SIN_AVISO.desactivado };
  if (d.cita.fecha < hoy) return { avisar: false, motivo: 'ya_paso', texto: MOTIVOS_SIN_AVISO.ya_paso };

  const dias = antelacion(d.cita.antelacion)?.dias ?? 3;
  const cuando = addDays(d.cita.fecha, -dias);
  if (hoy < cuando) return { avisar: false, motivo: 'todavia_no', texto: MOTIVOS_SIN_AVISO.todavia_no, cuando };

  return {
    avisar: true,
    titulo: '✂️ Corte de pelo',
    cuerpo: dias === 0 ? 'Es hoy.' : `Lo tienes el ${d.cita.fecha}.`,
    fecha: d.cita.fecha,
    // ⚠️ Quién manda esto: no este archivo.
    emisor: 'notificaciones.js',
  };
}

export const alternarRecordatorio = (estado) => {
  const d = datosPeluqueria(estado);
  if (!d.cita) return { estado: normalizarEstiloHombre(estado), error: 'No hay ninguna cita planificada.' };
  return editarCita(estado, { recordatorio: !d.cita.recordatorio });
};

/* ===========================================================================
   7 · DÓNDE SE CORTA (apartado 12)
   ===========================================================================
   *"Pero **no crear todavía un sistema completo de reservas de peluquería**."*
   Así que es un nombre, un lugar y una nota. Ni horarios, ni teléfonos, ni
   disponibilidad.

   ⚠️ El TIPO (peluquería / barbería / en casa) ya lo preguntó la Fase 7. Aquí
   se guarda el sitio concreto, que es otra cosa. */

export function anadirSitio(estado, { nombre = '', lugar = '', nota = '' } = {}) {
  const limpio = String(nombre).trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El sitio necesita un nombre.' };
  const d = datosPeluqueria(estado);
  if (d.sitios.some((s) => s.nombre.toLowerCase() === limpio.toLowerCase())) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  }
  return {
    estado: escribir(estado, { ...d, sitios: [...d.sitios, { id: uid(), nombre: limpio, lugar: String(lugar).trim(), nota: String(nota).trim() }] }),
    error: null,
  };
}

/** ⚠️ Borrar un sitio **desengancha** los cortes que lo usaban; no los borra. */
export function borrarSitio(estado, id) {
  const d = datosPeluqueria(estado);
  return {
    estado: escribir(estado, {
      ...d,
      sitios: d.sitios.filter((s) => s.id !== id),
      cortes: d.cortes.map((c) => (c.sitioId === id ? { ...c, sitioId: null } : c)),
      cita: d.cita && d.cita.sitioId === id ? { ...d.cita, sitioId: null } : d.cita,
    }),
    error: null,
  };
}

/* ===========================================================================
   8 · CALENDARIO (apartado 6)
   ===========================================================================
   *"El evento debe poder aparecer en el calendario global. **No crear un segundo
   calendario**."*

   ⚠️ Misma forma que los eventos del Armario y los de las rutinas (F8), para
   que encaje sin adaptadores. Y **una sola cita, no una serie**: el próximo
   corte es un plan concreto, no una recurrencia. */

export function eventosDePeluqueria(estado) {
  if (!parteActiva(estado, PARTE_PELUQUERIA)) return [];
  const d = datosPeluqueria(estado);
  if (!d.cita) return [];
  return [{
    id: `peluqueria:${d.cita.id}`,
    titulo: '✂️ Corte de pelo',
    fecha: d.cita.fecha,
    todoElDia: !d.cita.hora,
    horaInicio: d.cita.hora,
    horaFin: null,
    tipo: 'recordatorio',
    /* ⚠️ F12, apartado 12 — *"✂️ Próximo corte / Taper"*. El corte que quiere
       probar entra en la NOTA del evento que ya existe, no en una clave nueva:
       la forma tiene que seguir siendo la misma que la de los eventos del
       Armario y las rutinas, o deja de encajar sin adaptadores. Y desde luego
       no en un segundo evento (apartado 6). */
    notas: [d.objetivo?.nombre, d.cita.nota].filter(Boolean).join(' · '),
    ubicacion: d.sitios.find((s) => s.id === d.cita.sitioId)?.lugar || '',
    origen: 'pelo',
    origenId: d.cita.id,
    soloLectura: true,
  }];
}

/* ===========================================================================
   9 · DESACTIVAR (apartado 14)
   ===========================================================================
   *"Oculta la plaquita. Conserva el historial, las preferencias y los datos. Si
   existen eventos futuros en el calendario, **no eliminarlos automáticamente sin
   confirmación**."* */

export function impactoDesactivarPeluqueria(estado, { hoy = todayISO() } = {}) {
  const d = datosPeluqueria(estado);
  const citaFutura = d.cita && d.cita.fecha >= hoy ? d.cita : null;
  return {
    cortes: d.cortes.length,
    sitios: d.sitios.length,
    citaFutura: citaFutura ? citaFutura.fecha : null,
    // ⚠️ Se avisa de la cita futura, y NO se borra: apagar no es cancelar.
    texto: citaFutura
      ? `Tienes un corte planificado para el ${citaFutura.fecha}. Se queda guardado, pero dejará de salir en el calendario.`
      : 'Tu historial y tus preferencias se conservan.',
    seBorraAlgo: false,
  };
}

/* ===========================================================================
   10 · LA PANTALLA (apartado 1) Y EL RESUMEN
   =========================================================================== */

export function panelPeluqueria(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const d = datosPeluqueria(estado);
  const ultimo = ultimoCorte(estado);
  const sug = sugerirProximoCorte(estado, datosGlobales, { hoy });
  return {
    activo: parteActiva(estado, PARTE_PELUQUERIA),
    ultimo: ultimo ? { fecha: ultimo.fecha, nota: ultimo.nota } : null,
    // ⚠️ Nunca una fecha inventada: si no hay cita ni se puede sugerir, `null`
    // y una frase (regla 8).
    proximo: d.cita ? { fecha: d.cita.fecha, planificado: true, recordatorio: d.cita.recordatorio } : null,
    sugerido: !d.cita && sug.hay ? sug : null,
    sinNada: !ultimo && !d.cita,
    textoVacio: !ultimo ? 'Registra tu último corte y a partir de ahí llevamos la cuenta.' : '',
    frecuencia: frecuenciaDeCorte(estado, datosGlobales),
    real: frecuenciaReal(estado),
    cortes: d.cortes.length,
    sitios: d.sitios,
  };
}

export function resumenPeluqueria(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const d = datosPeluqueria(estado);
  const aviso = avisoDeCorte(estado, { hoy });
  return {
    activo: parteActiva(estado, PARTE_PELUQUERIA),
    cortes: d.cortes.length,
    ultimo: ultimoCorte(estado)?.fecha || null,
    proximo: d.cita?.fecha || null,
    recordatorio: d.cita?.recordatorio === true,
    avisaHoy: aviso.avisar === true,
    sitios: d.sitios.length,
    frecuencia: frecuenciaDeCorte(estado, datosGlobales).semanas,
    // ⚠️ Cero: aquí no hay reservas (apartado 12).
    reservas: 0,
  };
}
