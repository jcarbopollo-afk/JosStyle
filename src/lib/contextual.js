// ============================================================================
// EH · Fase 60/65 — RECOMENDACIONES CONTEXTUALES
//
// *"No queremos que JC Fitness diga simplemente 'aquí tienes una
// recomendación'. Queremos: 'ahora mismo esto puede tener sentido para ti'."*
//
// Y la condición de finalización, que es la fase entera en tres palabras:
// *"Momento adecuado + contexto adecuado + usuario adecuado. Si falta alguno:
// **no recomendar**. La aplicación debe aprender a decir: no tengo nada útil que
// decir ahora."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. 🚨 LO NORMAL ES NO RECOMENDAR NADA.** `recomendarAhora()` devuelve
// `{ hay: false }` **con su motivo** siempre que falte una de las tres
// condiciones, y eso es la mayoría de las veces. Una fase de recomendaciones
// que recomienda siempre no es contextual: es un escaparate.
//
// **2. 🚨 NO HAY CLIMA NI UBICACIÓN, Y NO SE FINGEN** (apartados 4 y 15). El
// apartado 4 empieza con *"si JC Fitness dispone de información meteorológica"*:
// no dispone. Y ubicación no hay ninguna. Se declaran como lo que son —fuentes
// que **no existen**— en vez de escribir reglas sobre un dato que nunca llegará.
//
// **3. 🚨 UNA FUENTE DISPONIBLE NO ES UNA FUENTE AUTORIZADA** (apartado 15, con
// sus palabras: *"no utilizar una fuente simplemente porque técnicamente esté
// disponible"*). Cada fuente tiene **su propio interruptor**, y **todos nacen
// apagados**. El calendario está ahí desde hace veinte fases; que esté no
// significa que Estilo de hombre pueda mirarlo.
//
// **4. ⚠️ Y NO SE ASUME NADA** (apartado 7). Si no se sabe dónde va, no se
// inventa. Cada regla declara **qué fuentes necesita**, y si una falta —o está
// apagada— la regla **no se evalúa**: no se "estima". La diferencia entre
// sugerir y adivinar es exactamente ésta.
//
// **5. ⚠️ UNA A LA VEZ, Y CON DESCANSO** (apartados 8 y 9). Si hay cinco
// candidatas se enseña **la más relevante**, y no se enseña otra hasta pasado un
// tiempo. *"No una recomendación cada vez que abre la app"*, literal.
//
// **6. ⚠️ Y GUARDARLA NO CREA UNA COPIA** (apartados 11, 12 y 13). Convertirla en
// objetivo o en tarea usa **los sistemas globales**, con una acción suya. Aquí no
// se queda una segunda versión de nada.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH, modulosActivos, IDS_EH } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import { permisoIA, ACCIONES_PROHIBIDAS, SITUACIONES } from './iaEstilo';
import { preferencia } from './aprendizaje';
import { PALABRAS_DE_PRESION, suenaAReproche } from './insights';
import { todayISO } from './papelera';
import { diasDesde } from './motorRecomendaciones';

/* ===========================================================================
   1 · LAS FUENTES, Y SU INTERRUPTOR (apartado 15) — 🚨 decisiones 2 y 3
   ===========================================================================
   *"El usuario debe poder controlar qué fuentes utiliza la personalización."* */

export const FUENTES = [
  {
    id: 'calendario', icono: '📅', nombre: 'Calendario', existe: true,
    que: 'Si tienes un evento hoy, para poder ofrecerte algo relacionado.',
  },
  {
    id: 'historial', icono: '📈', nombre: 'Historial', existe: true,
    que: 'Lo que sueles hacer, para saber cuándo toca tu rutina.',
  },
  {
    id: 'preferencias', icono: '❤️', nombre: 'Preferencias', existe: true,
    que: 'Lo que te gusta, para que la sugerencia encaje contigo.',
  },
  {
    /* 🚨 Decisión 2 — el apartado 4 dice "si dispone". No dispone. */
    id: 'clima', icono: '🌦️', nombre: 'Clima', existe: false,
    porque: 'JosStyle no tiene información meteorológica. Ni la pide ni la guarda, así que no hay nada que autorizar.',
  },
  {
    id: 'ubicacion', icono: '📍', nombre: 'Ubicación', existe: false,
    porque: 'Ninguna función la necesita, y pedirla "por si acaso" es justo lo que el apartado 15 prohíbe.',
  },
];

export const fuente = (id) => FUENTES.find((f) => f.id === id) || null;
export const fuentesQueExisten = () => FUENTES.filter((f) => f.existe);
export const fuentesQueNoExisten = () => FUENTES.filter((f) => !f.existe);

/* 🚨 Decisión 3 — todas apagadas, y el modo silencioso apagado (o sea, se
   pueden recibir recomendaciones… si autoriza alguna fuente). */
export const DEFAULT_CONTEXTUAL = { fuentes: [], silencio: false, vistas: [], tiposRechazados: [] };

export const DESCANSO_DIAS = 2;

export function normalizarContextual(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    // ⚠️ Solo fuentes que existen: una apagada por no existir no se puede encender.
    fuentes: (Array.isArray(g.fuentes) ? g.fuentes : []).filter((id) => fuente(id)?.existe),
    silencio: g.silencio === true,
    vistas: (Array.isArray(g.vistas) ? g.vistas : [])
      .filter((v) => v && typeof v.id === 'string').slice(-20),
    tiposRechazados: (Array.isArray(g.tiposRechazados) ? g.tiposRechazados : [])
      .filter((x) => typeof x === 'string'),
  };
}

export const datosContextual = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ANFITRION);
  return normalizarContextual(mod?.config?.contextual);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { contextual: datos });

export function alternarFuente(estado, id) {
  if (!fuente(id)?.existe) return normalizarEstiloHombre(estado);
  const d = datosContextual(estado);
  const dentro = d.fuentes.includes(id);
  return escribir(estado, { ...d, fuentes: dentro ? d.fuentes.filter((x) => x !== id) : [...d.fuentes, id] });
}

export const fuenteAutorizada = (estado, id) => datosContextual(estado).fuentes.includes(id);

/* ===========================================================================
   2 · EL MODO SILENCIOSO (apartado 16)
   ===========================================================================
   *"Debe existir una forma sencilla de no mostrar recomendaciones
   contextuales. El usuario puede seguir utilizando Estilo normalmente."* */

export const TEXTO_SILENCIO = {
  titulo: '🔕 Sin sugerencias',
  que: 'Estilo de hombre funciona igual: solo deja de proponerte cosas.',
};

export const alternarSilencio = (estado) => {
  const d = datosContextual(estado);
  return escribir(estado, { ...d, silencio: !d.silencio });
};

export const enSilencio = (estado) => datosContextual(estado).silencio;

/* ===========================================================================
   3 · EL MOMENTO Y LA OCASIÓN (apartados 1 y 6)
   =========================================================================== */

export const MOMENTOS = [
  { id: 'manana', icono: '🌅', nombre: 'Mañana', desde: 6, hasta: 12 },
  { id: 'tarde', icono: '🌤️', nombre: 'Tarde', desde: 12, hasta: 20 },
  { id: 'noche', icono: '🌙', nombre: 'Noche', desde: 20, hasta: 6 },
];

export const momentoDe = (hora) => {
  /* 🐛 ⚠️ `Number(null)` es **0**, y 0 cae dentro de la noche. Sin esta línea,
     "no sé qué hora es" se convertía en "son las doce de la noche" — que es
     exactamente lo que el apartado 7 prohíbe: **no asumir**. Un dato que no
     está no es un cero. */
  if (hora === null || hora === undefined || hora === '') return null;
  const h = Number(hora);
  if (!Number.isFinite(h)) return null;
  return MOMENTOS.find((m) => (m.desde < m.hasta ? h >= m.desde && h < m.hasta : h >= m.desde || h < m.hasta)) || null;
};

export const esFinDeSemana = (fechaISO) => {
  const d = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay() === 0 || d.getDay() === 6;
};

export const TEMPORADAS = [
  { id: 'invierno', icono: '❄️', meses: [12, 1, 2] },
  { id: 'primavera', icono: '🌸', meses: [3, 4, 5] },
  { id: 'verano', icono: '🏖️', meses: [6, 7, 8] },
  { id: 'otono', icono: '🍂', meses: [9, 10, 11] },
];

export const temporadaDe = (fechaISO) => {
  const mes = Number(String(fechaISO || '').slice(5, 7));
  return TEMPORADAS.find((t) => t.meses.includes(mes)) || null;
};

/** Apartado 6 — las seis ocasiones, y la que se supone cuando no hay nada. */
export const OCASIONES = [
  { id: 'clase', icono: '🏫', nombre: 'Clase', necesita: 'calendario' },
  { id: 'entrenamiento', icono: '🏋️', nombre: 'Entrenamiento', necesita: 'calendario' },
  { id: 'evento', icono: '🎉', nombre: 'Evento', necesita: 'calendario' },
  { id: 'fiesta', icono: '🥳', nombre: 'Fiesta', necesita: 'calendario' },
  { id: 'viaje', icono: '🧳', nombre: 'Viaje', necesita: 'calendario' },
  /* ⚠️ La sexta no necesita nada, y es la de casi todos los días. */
  { id: 'dia_normal', icono: '🙂', nombre: 'Día normal', necesita: null },
];

export const ocasion = (id) => OCASIONES.find((o) => o.id === id) || null;

/* ===========================================================================
   4 · LAS REGLAS (apartados 2, 3 y 7) — decisión 4
   ===========================================================================
   ⚠️ Cada una declara **qué fuentes necesita**. Sin ellas, no se evalúa. */

export const REGLAS_CONTEXTUALES = [
  {
    id: 'evento_hoy',
    apartado: 2,
    necesita: ['calendario'],
    ocasiones: ['evento', 'fiesta'],
    modulo: 'estilo',
    prioridad: 3,
    texto: 'Tienes un evento esta noche. ¿Quieres revisar tu estilo?',
    /* 🚨 Apartado 2 — *"nunca modificar nada automáticamente"*. */
    cambiaAlgo: false,
  },
  {
    id: 'viaje',
    apartado: 5,
    necesita: ['calendario'],
    ocasiones: ['viaje'],
    modulo: 'estilo',
    prioridad: 3,
    texto: 'Te vas de viaje mañana. ¿Quieres revisar lo que necesitas?',
    cambiaAlgo: false,
  },
  {
    id: 'rutina_ahora',
    apartado: 3,
    necesita: ['historial'],
    /* 🚨 Apartado 7 y la condición de finalización: hacen falta LAS TRES cosas
       —momento, contexto y usuario—, así que ninguna regla se dispara sin saber
       qué día es hoy para él. Un recordatorio de rutina en mitad de un evento no
       es un recordatorio: es una interrupción. */
    ocasiones: ['dia_normal', 'clase', 'entrenamiento'],
    momentos: ['manana', 'noche'],
    modulo: 'skincare',
    prioridad: 2,
    texto: 'Es el momento habitual de tu rutina de cuidado.',
    cambiaAlgo: false,
    /* ⚠️ Apartado 3 — *"debe poder desactivarse"*. Se apaga con su tipo. */
    sePuedeApagar: true,
  },
  {
    id: 'temporada',
    apartado: 1,
    necesita: ['preferencias'],
    ocasiones: ['dia_normal'],
    modulo: 'perfumes',
    prioridad: 1,
    texto: 'Ha cambiado la temporada. Quizá te apetezca otro perfume.',
    cambiaAlgo: false,
    soloAlCambiarTemporada: true,
  },
];

export const reglaContextual = (id) => REGLAS_CONTEXTUALES.find((r) => r.id === id) || null;

/* ===========================================================================
   5 · RECOMENDAR AHORA — 🚨 decisiones 1, 4 y 5
   ===========================================================================
   *"Momento adecuado + contexto adecuado + usuario adecuado. Si falta alguno:
   no recomendar."* */

export const MOTIVOS_DE_SILENCIO = [
  { id: 'silencio', que: 'El usuario ha pedido no recibir sugerencias.' },
  { id: 'sin_fuentes', que: 'No ha autorizado ninguna fuente, así que no se sabe nada del momento.' },
  { id: 'sin_ocasion', que: 'No se sabe qué hace hoy, y no se inventa.' },
  { id: 'sin_modulo', que: 'El apartado al que llevaría está apagado.' },
  { id: 'descanso', que: 'Ya se le propuso algo hace poco.' },
  { id: 'rechazado', que: 'Dijo que no quería sugerencias de este tipo.' },
  { id: 'nada_relevante', que: 'No tengo nada útil que decir ahora.' },
];

export const motivoSilencio = (id) => MOTIVOS_DE_SILENCIO.find((m) => m.id === id) || null;

export const TEXTO_NADA = 'No tengo nada útil que decir ahora.';

/**
 * 🚨 Devuelve **una** recomendación o **ninguna**, siempre con el motivo.
 *
 * ⚠️ `contexto` es lo que se SABE, no lo que se supone: `{ ocasion, hora,
 * cambioDeTemporada }`. Lo que no venga, no se estima (decisión 4).
 */
export function recomendarAhora(estado, {
  ocasion: ocasionId = null, hora = null, cambioDeTemporada = false, hoy = todayISO(),
} = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosContextual(e);
  const nada = (porque) => ({ hay: false, porque, texto: TEXTO_NADA, recomendacion: null });

  // Apartado 16 — el silencio manda sobre todo lo demás.
  if (d.silencio) return nada('silencio');
  // 🚨 Decisión 3 — sin fuentes autorizadas no se mira nada.
  if (d.fuentes.length === 0) return nada('sin_fuentes');

  const momento = momentoDe(hora);
  const activos = modulosActivos(e).map((m) => m.id);

  const candidatas = REGLAS_CONTEXTUALES.filter((r) => {
    // Decisión 4 — todas sus fuentes autorizadas, o no se evalúa.
    if (!r.necesita.every((f) => d.fuentes.includes(f))) return false;
    if (d.tiposRechazados.includes(r.id)) return false;
    // El apartado al que lleva tiene que estar encendido.
    if (r.modulo && !activos.includes(r.modulo)) return false;
    // ⚠️ Apartado 7 — sin ocasión conocida, la regla que la pide no entra.
    if (r.ocasiones && (!ocasionId || !r.ocasiones.includes(ocasionId))) return false;
    if (r.momentos && (!momento || !r.momentos.includes(momento.id))) return false;
    if (r.soloAlCambiarTemporada && !cambioDeTemporada) return false;
    return true;
  });

  if (candidatas.length === 0) {
    if (!ocasionId) return nada('sin_ocasion');
    return nada('nada_relevante');
  }

  /* ⚠️ Decisión 5 — la más relevante, una sola. */
  const elegida = [...candidatas].sort((a, b) => b.prioridad - a.prioridad)[0];

  // Apartado 8 — y no otra hasta pasado el descanso.
  const ultima = [...d.vistas].reverse()[0];
  if (ultima) {
    const dias = diasDesde(ultima.cuando, hoy);
    if (dias !== null && dias < DESCANSO_DIAS) return nada('descanso');
  }

  return {
    hay: true,
    porque: null,
    texto: elegida.texto,
    recomendacion: {
      id: elegida.id,
      texto: elegida.texto,
      modulo: elegida.modulo,
      ocasion: ocasionId,
      momento: momento?.id || null,
      /* Apartado 10 — siempre se puede decir que no. */
      acciones: ACCIONES_POSIBLES,
      cambiaAlgo: false,
    },
    candidatas: candidatas.length,
  };
}

export function marcarVista(estado, id, { hoy = todayISO() } = {}) {
  const d = datosContextual(estado);
  return escribir(estado, { ...d, vistas: [...d.vistas, { id, cuando: hoy }].slice(-20) });
}

/* ===========================================================================
   6 · QUÉ SE PUEDE HACER CON ELLA (apartados 10 a 13) — decisión 6
   =========================================================================== */

export const ACCIONES_POSIBLES = [
  { id: 'no_interesa', icono: '❌', etiqueta: 'No me interesa', crea: null },
  { id: 'no_este_tipo', icono: '🔕', etiqueta: 'No quiero recomendaciones de este tipo', crea: null },
  { id: 'guardar', icono: '❤️', etiqueta: 'Guardar', crea: 'el sistema correspondiente', copia: false },
  { id: 'objetivo', icono: '🎯', etiqueta: 'Convertir en objetivo', crea: 'Objetivos', copia: false, explicita: true },
  { id: 'tarea', icono: '📋', etiqueta: 'Añadir a tareas', crea: 'Productividad', copia: false, explicita: true },
];

export const accion = (id) => ACCIONES_POSIBLES.find((a) => a.id === id) || null;

export function rechazarTipo(estado, id) {
  if (!reglaContextual(id)) return normalizarEstiloHombre(estado);
  const d = datosContextual(estado);
  return escribir(estado, { ...d, tiposRechazados: [...new Set([...d.tiposRechazados, id])] });
}

/** 🚨 Ninguna acción crea una copia aquí dentro (apartado 11). */
export const CREA_COPIA = false;

/* ===========================================================================
   7 · LA IA (apartado 14)
   =========================================================================== */

export const IA_CONTEXTO = {
  puede: 'Juntar preferencias + evento + momento y decirlo con sus palabras.',
  necesita: 'El interruptor de la F56 y las fuentes autorizadas de esta fase. Las dos cosas.',
  noPuede: 'Rellenar lo que no se sabe. Si no hay ocasión, no hay recomendación (apartado 7).',
};

export const iaPuedeAyudar = (estado) => permisoIA(estado) && datosContextual(estado).fuentes.length > 0;

/* ===========================================================================
   8 · LAS CINCO SITUACIONES (apartado 17)
   =========================================================================== */

export const SITUACIONES_PRUEBA = [
  { id: 'dia_normal', que: 'Día normal', ctx: { ocasion: 'dia_normal', hora: 15 }, espera: 'Nada, o poco. Un día normal no necesita una sugerencia.' },
  { id: 'evento', que: 'Evento importante', ctx: { ocasion: 'evento', hora: 18 }, espera: 'La del evento.' },
  { id: 'viaje', que: 'Viaje', ctx: { ocasion: 'viaje', hora: 10 }, espera: 'La del viaje.' },
  { id: 'estacion', que: 'Cambio de estación', ctx: { ocasion: 'dia_normal', hora: 15, cambioDeTemporada: true }, espera: 'La del perfume de temporada.' },
  { id: 'sin_historial', que: 'Usuario sin historial', ctx: { hora: 10 }, espera: '🚨 Nada: sin ocasión no se inventa.' },
];

export const situacionPrueba = (id) => SITUACIONES_PRUEBA.find((s) => s.id === id) || null;

/* ===========================================================================
   9 · LOS DIECISIETE APARTADOS
   =========================================================================== */

export const APARTADOS_CONTEXTUAL = [
  { id: 1, nombre: 'Contexto temporal', cumplido: true, donde: 'MOMENTOS · TEMPORADAS · esFinDeSemana()' },
  { id: 2, nombre: 'Contexto de eventos', cumplido: true, donde: 'regla `evento_hoy` — no cambia nada sola' },
  { id: 3, nombre: 'Contexto de rutina', cumplido: true, donde: 'regla `rutina_ahora`, que se puede apagar' },
  { id: 4, nombre: 'Contexto climático', cumplido: false, donde: 'FUENTES · clima — no existe, y se dice' },
  { id: 5, nombre: 'Contexto de viaje', cumplido: true, donde: 'regla `viaje`, desde el calendario' },
  { id: 6, nombre: 'Contexto de ocasiones', cumplido: true, donde: 'OCASIONES' },
  { id: 7, nombre: 'No asumir', cumplido: true, donde: 'recomendarAhora() — sin ocasión, `sin_ocasion`' },
  { id: 8, nombre: 'Frecuencia', cumplido: true, donde: 'DESCANSO_DIAS' },
  { id: 9, nombre: 'Priorización', cumplido: true, donde: 'La de mayor prioridad, y UNA' },
  { id: 10, nombre: 'Rechazar', cumplido: true, donde: 'ACCIONES_POSIBLES · rechazarTipo()' },
  { id: 11, nombre: 'Guardar', cumplido: true, donde: 'CREA_COPIA = false' },
  { id: 12, nombre: 'Convertir en objetivo', cumplido: true, donde: 'acción `objetivo`, explícita' },
  { id: 13, nombre: 'Convertir en tarea', cumplido: true, donde: 'acción `tarea`, en Productividad' },
  { id: 14, nombre: 'IA', cumplido: true, donde: 'IA_CONTEXTO' },
  { id: 15, nombre: 'Privacidad', cumplido: true, donde: 'FUENTES, todas apagadas por defecto' },
  { id: 16, nombre: 'Modo silencioso', cumplido: true, donde: 'alternarSilencio()' },
  { id: 17, nombre: 'Prueba de relevancia', cumplido: true, donde: 'SITUACIONES_PRUEBA' },
];

export const apartadoContextual = (id) => APARTADOS_CONTEXTUAL.find((a) => a.id === id) || null;

export const CONDICION = 'Momento adecuado + contexto adecuado + usuario adecuado. Si falta alguno, no se recomienda: la aplicación sabe decir que no tiene nada útil que decir ahora.';

/* ===========================================================================
   10 · EL PARTE
   =========================================================================== */

/** Un estado de trabajo: módulos encendidos y las tres fuentes autorizadas. */
function estadoDePrueba() {
  let e = normalizarEstiloHombre({
    configurado: true,
    modulos: IDS_EH.map((id, i) => ({ id, activo: true, oculto: false, orden: i, config: {} })),
  });
  fuentesQueExisten().forEach((f) => { e = alternarFuente(e, f.id); });
  return e;
}

export function auditarContextual({ hoy = todayISO() } = {}) {
  const limpio = normalizarEstiloHombre({});
  const listo = estadoDePrueba();
  const resultados = SITUACIONES_PRUEBA.map((s) => ({
    id: s.id,
    r: recomendarAhora(listo, { ...s.ctx, hoy }),
  }));
  return {
    // 🚨 Decisión 3 — todas las fuentes apagadas al principio.
    fuentesPorDefecto: datosContextual(limpio).fuentes.length,
    // 🚨 Decisión 1 — sin autorizar nada, no se recomienda.
    sinFuentesNoRecomienda: recomendarAhora(limpio, { ocasion: 'evento', hora: 20, hoy }).hay === false,
    // 🚨 Decisión 4 — sin ocasión, tampoco.
    sinOcasionNoRecomienda: recomendarAhora(listo, { hora: 10, hoy }).hay === false,
    // Decisión 5 — nunca más de una.
    masDeUna: resultados.filter((x) => Array.isArray(x.r.recomendacion)).length,
    // 🚨 Y ninguna cambia nada sola (apartado 2).
    cambianAlgo: REGLAS_CONTEXTUALES.filter((r) => r.cambiaAlgo).map((r) => r.id),
    // Cada regla dice qué fuentes necesita.
    sinFuentesDeclaradas: REGLAS_CONTEXTUALES.filter((r) => !Array.isArray(r.necesita) || r.necesita.length === 0).map((r) => r.id),
    fuentesInventadas: REGLAS_CONTEXTUALES.flatMap((r) => r.necesita).filter((f) => !fuente(f)?.existe),
    // Decisión 2 — lo que no existe, con su motivo.
    noExisten: fuentesQueNoExisten().map((f) => f.id),
    sinMotivo: fuentesQueNoExisten().filter((f) => !f.porque).map((f) => f.id),
    // Y ni un texto que suene a reproche (la lección de la F58).
    conReproche: REGLAS_CONTEXTUALES.flatMap((r) => suenaAReproche(r.texto)),
    situaciones: resultados.map((x) => ({ id: x.id, hay: x.r.hay, porque: x.r.porque })),
    sinDonde: APARTADOS_CONTEXTUAL.filter((a) => !a.donde).map((a) => a.id),
    sinCumplir: APARTADOS_CONTEXTUAL.filter((a) => !a.cumplido).map((a) => a.id),
  };
}

export function panelContextual(estado = null, opciones = {}) {
  const e = normalizarEstiloHombre(estado || {});
  const a = auditarContextual(opciones);
  return {
    ...a,
    fuentesLista: FUENTES,
    autorizadas: datosContextual(e).fuentes,
    silencio: enSilencio(e),
    reglas: REGLAS_CONTEXTUALES,
    acciones: ACCIONES_POSIBLES,
    ocasiones: OCASIONES,
    apartados: APARTADOS_CONTEXTUAL,
    /* 🎯 El veredicto: **sabe callarse**. */
    sabeCallarse: a.fuentesPorDefecto === 0
      && a.sinFuentesNoRecomienda
      && a.sinOcasionNoRecomienda
      && a.masDeUna === 0
      && a.cambianAlgo.length === 0
      && a.fuentesInventadas.length === 0
      && a.sinMotivo.length === 0
      && a.conReproche.length === 0
      && a.sinDonde.length === 0,
    condicion: CONDICION,
  };
}

export { permisoIA, ACCIONES_PROHIBIDAS, SITUACIONES, preferencia, PALABRAS_DE_PRESION,
  suenaAReproche, todayISO, MODULO_ANFITRION, moduloEH };
