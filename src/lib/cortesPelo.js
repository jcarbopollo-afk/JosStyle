// ============================================================================
// EH · Fase 12/65 — PELUQUERÍA: CORTES, PREFERENCIAS Y RECOMENDACIONES
//
// *"Son recomendaciones, no órdenes. Y como acordamos, sin IA."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ El apartado 5 YA ESTÁ CONTESTADO, y no se vuelve a preguntar.**
// Pide *"¿Cuánto tiempo quieres dedicar a peinarte?"* con cinco opciones —menos
// de 5, 5–10, 10–20, más de 20, me da igual—. La **Fase 7 ya hizo esa pregunta**
// (`tiempoPelo`) **con esas cinco opciones exactas**, y dejó escrito para qué:
// *"así las recomendaciones futuras no propondrán una rutina de 20 minutos a
// alguien que quiere tardar 3"*. Volver a preguntarla crearía el segundo perfil
// que el apartado 10 de la Fase 1 prohíbe, y dejaría a Josué con dos respuestas
// distintas a la misma pregunta y ninguna forma de saber cuál manda. Así que se
// **lee** de allí, y la pantalla dice dónde se cambia — igual que `guardarDato()`
// se niega a escribir un dato global.
//
// **2. Los niveles 🟢🟡🔴 se importan, no se reescriben.** El apartado 6 pide
// tres niveles de mantenimiento con esos tres iconos. `NIVELES_ESTILO` (F6) ya
// es esa escala, y las fases 9, 18 y 22 la comparten. Aquí se toman **sus ids y
// sus iconos** —para que un nivel siga siendo comparable entre módulos— con
// **los nombres que escribió Josué**: Bajo / Medio / Alto, no Básico /
// Intermedio / Avanzado. Una segunda escala de tres niveles habría sido el
// segundo sistema de siempre.
//
// **3. Un corte es una línea del catálogo.** Igual que `MODULOS_EH` en la Fase 1
// y `REGLAS_PELO` en la Fase 9: mantenimiento, minutos, longitudes, tipos de
// pelo y estilos compatibles van EN LA LÍNEA. *"La lista debe ser ampliable"*
// (apartado 3), así que Josué puede añadir los suyos y salen mezclados con los
// nueve del enunciado, sin un `case` aparte.
//
// **4. ⚠️ Nada se toca sin confirmar** (apartado 18): *"la aplicación nunca
// cambiará el corte actual, creará una cita, modificará el calendario, añadirá
// un producto ni cambiará preferencias sin que el usuario lo confirme"*. Las
// recomendaciones **se calculan y se devuelven**; fijar el corte actual, marcar
// un objetivo o guardar un favorito son llamadas distintas que hace él. Es el
// mismo `aplicarPlan` de HT F9 y `aplicarARutina` de EH F9.
//
// **5. El historial NO es un diagnóstico** (apartado 15). *"Parece que este
// estilo encaja bastante con tus preferencias"* es lo más lejos que llega, y por
// debajo de dos cortes valorados bien **no se afirma nada** — misma disciplina
// que `frecuenciaReal` (F11), HT F11 y AR F4.
//
// **6. Sin IA**, como la Fase 9, y comprobado sobre el código fuente.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { MODULO_PELO, respuestaPelo } from './perfilCapilar';
import { datosPelo, parteActiva } from './rutinasPelo';
import {
  PARTE_PELUQUERIA, datosPeluqueria, historialDeCortes, editarCorte,
  fijarObjetivoDeCorte,
} from './peluqueria';
import { NIVELES_ESTILO, nivelEstilo } from './perfilEstilo';
import { leerDato } from './datosEstiloHombre';
import { NO_LO_SE, leerCuestionario, progresoCuestionario, contextoDelCuestionario, contestar, auditarCuestionario } from './cuestionarios';
import { reglaAplicable } from './motorRecomendaciones';
import { uid } from './helpers';

/** Apartado 1 — *"Dentro de ✂️ Peluquería añadir: Mi estilo de corte"*. */
export const ZONA_CORTE = 'corte';

/* ===========================================================================
   1 · LO QUE NO SE VUELVE A PREGUNTAR (apartado 5)
   ===========================================================================
   ⚠️ Existe como constante para que se pueda comprobar con una prueba, y para
   que la pantalla pueda decir dónde se cambia en vez de callarse. */

export const TIEMPO_YA_PREGUNTADO = {
  pregunta: 'tiempoPelo',
  de: 'El perfil capilar',
  archivo: 'perfilCapilar.js',
  apartado: 5,
  porque: 'Ya lo contestaste al configurar tu pelo, con estas mismas opciones.',
  donde: 'Pelo → Mi pelo',
};

/** Devuelve el tiempo que él dijo, sin volver a preguntarlo. */
export function tiempoParaPeinarse(estado, datosGlobales = {}) {
  const r = respuestaPelo(estado, TIEMPO_YA_PREGUNTADO.pregunta, datosGlobales);
  return {
    contestada: r.contestada,
    // ⚠️ "Me da igual" y "no lo sé" no son un número de minutos: los dos dejan
    // la restricción sin aplicar, y eso es correcto.
    valor: r.contestada && !r.noSabe ? r.valores[0] : null,
    etiqueta: r.etiquetas[0] || '',
    noSabe: r.noSabe,
    de: TIEMPO_YA_PREGUNTADO.de,
    donde: TIEMPO_YA_PREGUNTADO.donde,
  };
}

/** Cuántos minutos representa cada respuesta, para poder comparar con un corte. */
export const MINUTOS_DE_TIEMPO = {
  menos_5: 5, '5_10': 10, '10_20': 20, mas_20: 60,
  // ⚠️ `null`, no un número grande: *"me da igual"* no es "tengo una hora", es
  // "no me pongas esa restricción".
  igual: null,
};

/* ===========================================================================
   2 · LAS PREFERENCIAS (apartados 2, 3, 4 y 6)
   ===========================================================================
   Todas van por el motor de cuestionarios de la Fase 7. Ninguna está en el
   registro de la Fase 4, así que todas viven en la `config` de Pelo — que es lo
   que dice `destinoDe()`, no una decisión que se toma aquí. */

export const LONGITUDES = [
  { id: 'corto', nombre: 'Corto' },
  { id: 'medio', nombre: 'Medio' },
  { id: 'largo', nombre: 'Largo' },
];

export const PARTES_LONGITUD = [
  { id: 'longitudLaterales', nombre: 'Laterales' },
  { id: 'longitudSuperior', nombre: 'Parte superior' },
  { id: 'longitudPosterior', nombre: 'Parte posterior' },
];

export const FORMAS_PEINADO = [
  { id: 'natural', nombre: 'Natural' },
  { id: 'delante', nombre: 'Hacia delante' },
  { id: 'atras', nombre: 'Hacia atrás' },
  { id: 'lado', nombre: 'De lado' },
  { id: 'volumen', nombre: 'Con volumen' },
  { id: 'texturizado', nombre: 'Texturizado' },
  { id: 'otro', nombre: 'Otro' },
];

/**
 * Apartado 6 — ⚠️ **los ids y los iconos son los de `NIVELES_ESTILO` (F6)**, para
 * que un nivel signifique lo mismo en todo el proyecto; los nombres y las frases
 * son los que escribió Josué. Reescribir la escala habría creado dos.
 */
export const NIVELES_MANTENIMIENTO = NIVELES_ESTILO.map((n) => ({
  ...n,
  nombre: { basico: 'Bajo', intermedio: 'Medio', avanzado: 'Alto' }[n.id],
  frase: {
    basico: 'Quiero preocuparme poco.',
    intermedio: 'No me importa dedicarle algo de tiempo.',
    avanzado: 'Quiero mantener el corte perfectamente.',
  }[n.id],
}));

export const nivelMantenimiento = (id) => NIVELES_MANTENIMIENTO.find((n) => n.id === id) || null;

/** Las seis preguntas del perfil de corte. El tiempo NO está: es la del apartado 5. */
export const PREGUNTAS_CORTE = [
  ...PARTES_LONGITUD.map((p) => ({
    id: p.id,
    titulo: `${p.nombre}: ¿cómo los prefieres?`,
    apartado: 2,
    opciones: LONGITUDES,
  })),
  {
    id: 'estilosCorte',
    titulo: '¿Qué estilos de corte te gustan?',
    apartado: 3,
    multiple: true,
    // ⚠️ Función, no array: el catálogo crece cuando Josué añade un corte
    // (*"la lista debe ser ampliable"*), y una lista congelada al importar el
    // archivo no lo vería nunca.
    opciones: [],
  },
  {
    id: 'comoPeinar',
    titulo: '¿Cómo te gusta peinarlo?',
    apartado: 4,
    multiple: true,
    opciones: FORMAS_PEINADO,
  },
  {
    id: 'mantenimientoCorte',
    titulo: '¿Cuánto mantenimiento estás dispuesto a hacer?',
    apartado: 6,
    opciones: NIVELES_MANTENIMIENTO.map((n) => ({ id: n.id, nombre: `${n.icono} ${n.nombre}`, ayuda: n.frase })),
  },
];

/** Las preguntas con el catálogo de estilos ya resuelto. */
export function preguntasDeCorte(estado) {
  return PREGUNTAS_CORTE.map((p) => (p.id === 'estilosCorte'
    ? { ...p, opciones: cortesDisponibles(estado).map((c) => ({ id: c.id, nombre: c.nombre })) }
    : p));
}

export const perfilDeCorte = (estado, datosGlobales = {}) =>
  leerCuestionario(estado, MODULO_PELO, preguntasDeCorte(estado), datosGlobales);

export const progresoCorte = (estado, datosGlobales = {}) =>
  progresoCuestionario(estado, MODULO_PELO, preguntasDeCorte(estado), datosGlobales);

export const contestarCorte = (estado, preguntaId, valor, opciones = {}) => {
  const p = preguntasDeCorte(estado).find((q) => q.id === preguntaId);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Esa pregunta no existe.' };
  return contestar(estado, MODULO_PELO, p, valor, opciones);
};

/**
 * Apartado 2 — *"no obligar a utilizar medidas exactas… o introducir una
 * referencia si lo desea"*. La referencia es un texto libre y **convive** con la
 * opción: decir "corto" y "número 2 por los lados" no es una contradicción.
 */
export function guardarReferencia(estado, parteId, texto) {
  if (!PARTES_LONGITUD.some((p) => p.id === parteId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa parte no existe.' };
  }
  const refs = { ...datosCorte(estado).referencias, [parteId]: String(texto || '').trim() };
  return { estado: escribir(estado, { ...datosCorte(estado), referencias: refs }), error: null };
}

export const referenciaDe = (estado, parteId) => datosCorte(estado).referencias[parteId] || '';

/* ===========================================================================
   3 · EL CATÁLOGO DE CORTES (apartado 3)
   ===========================================================================
   ⚠️ **Añadir un corte es añadir una línea.** Todo lo que las recomendaciones
   necesitan saber de él va aquí: nada de un `if` por corte en el motor.

   `minutos` es cuánto pide al peinarse, y se compara con la respuesta de la
   Fase 7. `peloOk` vacío significa "le va bien a cualquier pelo", no "a
   ninguno". */

export const CATALOGO_CORTES = [
  {
    id: 'fade', nombre: 'Fade', mantenimiento: 'avanzado', minutos: 10,
    longitudes: ['corto'], peloOk: ['liso', 'ondulado', 'rizado'],
    estilosOk: ['urbano', 'deportivo', 'streetwear'],
    // ⚠️ La descripción NO es una recomendación: describe el corte, no le dice
    // a Josué qué hacer. El "por qué" lo escribe la regla que lo propone.
    descripcion: 'Degradado marcado en los laterales.',
  },
  {
    id: 'taper', nombre: 'Taper', mantenimiento: 'intermedio', minutos: 5,
    longitudes: ['corto', 'medio'], peloOk: ['liso', 'ondulado', 'rizado'],
    estilosOk: ['clasico', 'smart_casual', 'casual', 'elegante'],
    descripcion: 'Degradado suave, más discreto que el fade.',
  },
  {
    id: 'clasico', nombre: 'Clásico', mantenimiento: 'intermedio', minutos: 5,
    longitudes: ['corto', 'medio'], peloOk: ['liso', 'ondulado'],
    estilosOk: ['clasico', 'formal', 'elegante'],
    descripcion: 'Corte de toda la vida, sin degradados.',
  },
  {
    id: 'texturizado', nombre: 'Texturizado', mantenimiento: 'intermedio', minutos: 10,
    longitudes: ['medio'], peloOk: ['liso', 'ondulado', 'rizado'],
    estilosOk: ['casual', 'urbano', 'streetwear'],
    descripcion: 'Con movimiento y puntas desiguales.',
  },
  {
    id: 'largo', nombre: 'Largo', mantenimiento: 'avanzado', minutos: 20,
    longitudes: ['largo'], peloOk: ['liso', 'ondulado', 'rizado', 'muy_rizado'],
    estilosOk: ['casual', 'urbano'],
    descripcion: 'Sin recoger, por encima de los hombros o más.',
  },
  {
    id: 'undercut', nombre: 'Undercut', mantenimiento: 'avanzado', minutos: 10,
    longitudes: ['medio'], peloOk: ['liso', 'ondulado'],
    estilosOk: ['urbano', 'streetwear'],
    descripcion: 'Laterales muy cortos y parte superior larga.',
  },
  {
    id: 'crew_cut', nombre: 'Crew cut', mantenimiento: 'basico', minutos: 5,
    longitudes: ['corto'], peloOk: ['liso', 'ondulado', 'rizado'],
    estilosOk: ['deportivo', 'casual', 'minimalista'],
    descripcion: 'Muy corto arriba, un poco más largo por delante.',
  },
  {
    id: 'buzz_cut', nombre: 'Buzz cut', mantenimiento: 'basico', minutos: 5,
    longitudes: ['corto'], peloOk: ['liso', 'ondulado', 'rizado', 'muy_rizado'],
    estilosOk: ['deportivo', 'minimalista'],
    descripcion: 'Al uno o al dos, toda la cabeza igual.',
  },
  {
    id: 'otro', nombre: 'Otro', mantenimiento: null, minutos: null,
    longitudes: [], peloOk: [], estilosOk: [],
    descripcion: 'Para el que no está en la lista.',
  },
];

/* ═══ El almacén de la fase: una sola llave dentro de la `config` de Pelo ═══ */

export const DEFAULT_CORTE = {
  propios: [],        // los que añade él (apartado 3, *"ampliable"*)
  referencias: {},    // apartado 2, texto libre por parte
  favoritos: [],      // apartado 10
  actual: null,       // apartado 11
};

function normalizarCortePropio(g) {
  const c = g || {};
  const nombre = String(c.nombre || '').trim();
  if (!nombre) return null;
  return {
    id: c.id || uid(),
    nombre,
    mantenimiento: nivelEstilo(c.mantenimiento) ? c.mantenimiento : null,
    minutos: Number.isInteger(Number(c.minutos)) && Number(c.minutos) > 0 ? Number(c.minutos) : null,
    longitudes: (Array.isArray(c.longitudes) ? c.longitudes : []).filter((l) => LONGITUDES.some((x) => x.id === l)),
    peloOk: Array.isArray(c.peloOk) ? c.peloOk : [],
    estilosOk: Array.isArray(c.estilosOk) ? c.estilosOk : [],
    descripcion: String(c.descripcion || '').trim(),
    propio: true,
  };
}

export function normalizarCorteEH(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const refs = g.referencias && typeof g.referencias === 'object' ? g.referencias : {};
  return {
    propios: (Array.isArray(g.propios) ? g.propios : []).map(normalizarCortePropio).filter(Boolean),
    referencias: Object.fromEntries(
      PARTES_LONGITUD.map((p) => [p.id, String(refs[p.id] || '').trim()]).filter(([, v]) => v),
    ),
    favoritos: [...new Set((Array.isArray(g.favoritos) ? g.favoritos : []).filter((x) => typeof x === 'string'))],
    actual: typeof g.actual === 'string' && g.actual ? g.actual : null,
  };
}

export const datosCorte = (estado) => normalizarCorteEH(datosPelo(estado)[ZONA_CORTE]);

const escribir = (estado, datos) => {
  const d = datosPelo(estado);
  return guardarConfig(estado, MODULO_PELO, { pelo: { ...d, [ZONA_CORTE]: datos } });
};

/** El catálogo del enunciado más los suyos, en una sola lista (apartado 3). */
export function cortesDisponibles(estado) {
  const propios = datosCorte(estado).propios;
  return [
    ...CATALOGO_CORTES.map((c) => ({ ...c, propio: false })),
    // ⚠️ Los suyos van antes de "Otro", que siempre cierra la lista.
    ...propios,
  ].sort((a, b) => (a.id === 'otro' ? 1 : b.id === 'otro' ? -1 : 0));
}

export const corteDe = (estado, id) => cortesDisponibles(estado).find((c) => c.id === id) || null;

export function anadirCorte(estado, { nombre = '', mantenimiento = null, minutos = null, longitudes = [], descripcion = '' } = {}) {
  const limpio = String(nombre).trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El corte necesita un nombre.' };
  const d = datosCorte(estado);
  if (cortesDisponibles(estado).some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  }
  const corte = normalizarCortePropio({ nombre: limpio, mantenimiento, minutos, longitudes, descripcion });
  return { estado: escribir(estado, { ...d, propios: [...d.propios, corte] }), error: null, corte };
}

/**
 * ⚠️ Borrar un corte suyo **no lo borra del historial**: un corte que se hizo se
 * hizo. Misma decisión que borrar un sitio en la Fase 11, y misma que la del
 * apartado 15 de aquella: el historial no se toca desde fuera.
 */
export function borrarCorte(estado, id) {
  const d = datosCorte(estado);
  if (!d.propios.some((c) => c.id === id)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese corte no es tuyo, no se puede borrar.' };
  }
  return {
    estado: escribir(estado, {
      ...d,
      propios: d.propios.filter((c) => c.id !== id),
      favoritos: d.favoritos.filter((f) => f !== id),
      actual: d.actual === id ? null : d.actual,
    }),
    error: null,
  };
}

/* ===========================================================================
   4 · FAVORITOS, CORTE ACTUAL Y OBJETIVO (apartados 10, 11 y 12)
   ===========================================================================
   ⚠️ Los tres son **decisiones suyas** (apartado 18). Ninguna función de este
   archivo los cambia por su cuenta, ni siquiera al recomendar. */

export function alternarFavoritoCorte(estado, id) {
  if (!corteDe(estado, id)) return { estado: normalizarEstiloHombre(estado), error: 'Ese corte no existe.' };
  const d = datosCorte(estado);
  return {
    estado: escribir(estado, {
      ...d,
      favoritos: d.favoritos.includes(id) ? d.favoritos.filter((f) => f !== id) : [...d.favoritos, id],
    }),
    error: null,
  };
}

export const favoritosDeCorte = (estado) =>
  datosCorte(estado).favoritos.map((id) => corteDe(estado, id)).filter(Boolean);

/** Apartado 11 — *"no modificarlo automáticamente"*. Lo pone él, y solo él. */
export function fijarCorteActual(estado, id) {
  if (id !== null && !corteDe(estado, id)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese corte no existe.' };
  }
  return { estado: escribir(estado, { ...datosCorte(estado), actual: id }), error: null };
}

export const corteActual = (estado) => {
  const id = datosCorte(estado).actual;
  return id ? corteDe(estado, id) : null;
};

/**
 * Apartado 12 — *"🎯 Quiero probar"*. Se guarda en la Fase 11, que es donde vive
 * la cita, para que el evento del calendario lo pueda enseñar **sin un segundo
 * evento** y sin que los dos archivos se importen en círculo.
 */
export function marcarQuieroProbar(estado, id) {
  const c = corteDe(estado, id);
  if (!c) return { estado: normalizarEstiloHombre(estado), error: 'Ese corte no existe.' };
  return fijarObjetivoDeCorte(estado, { id: c.id, nombre: c.nombre });
}

export const quitarObjetivoDeCorte = (estado) => fijarObjetivoDeCorte(estado, null);

export const objetivoDeCorte = (estado) => {
  const o = datosPeluqueria(estado).objetivo;
  if (!o) return null;
  // El corte puede haber desaparecido del catálogo; el objetivo guardado no
  // miente por eso: lleva su nombre encima.
  return { ...o, corte: corteDe(estado, o.id), texto: `🎯 Próximo corte: ${o.nombre}` };
};

/* ===========================================================================
   5 · HISTORIAL Y VALORACIÓN (apartados 13 y 14)
   =========================================================================== */

export const VALORACIONES_CORTE = [
  { id: 'encanto', nombre: 'Me encantó', icono: '❤️', bueno: true },
  { id: 'bien', nombre: 'Bien', icono: '🙂', bueno: true },
  { id: 'normal', nombre: 'Normal', icono: '😐', bueno: false },
  { id: 'no_gusto', nombre: 'No me gustó', icono: '👎', bueno: false },
];

export const valoracionCorte = (id) => VALORACIONES_CORTE.find((v) => v.id === id) || null;

/** Apartado 13 — *"¿Qué corte te hiciste?"*, opcional, sobre un corte ya registrado. */
export function decirQueCorteFue(estado, registroId, corteId) {
  if (corteId !== null && !corteDe(estado, corteId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese corte no existe.' };
  }
  return editarCorte(estado, registroId, { corteId });
}

/** Apartado 14 — *"¿Qué te pareció?"*, con nota opcional. */
export function valorarCorte(estado, registroId, valoracion, nota = null) {
  if (valoracion !== null && !valoracionCorte(valoracion)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa valoración no existe.' };
  }
  const cambios = { valoracion };
  if (nota !== null) cambios.nota = nota;
  return editarCorte(estado, registroId, cambios);
}

/** El historial de la Fase 11 con el corte y la valoración ya resueltos. */
export function historialConCortes(estado) {
  return historialDeCortes(estado).map((c) => ({
    ...c,
    corte: c.corteId ? corteDe(estado, c.corteId) : null,
    // ⚠️ El nombre guardado en el registro sobrevive a que borre el corte.
    corteNombre: c.corteId ? (corteDe(estado, c.corteId)?.nombre || '') : '',
    valoracionInfo: valoracionCorte(c.valoracion),
  }));
}

/* ===========================================================================
   6 · EL CONTEXTO (apartados 16 y 17)
   ===========================================================================
   ⚠️ **Nada se copia.** El pelo se lee del perfil capilar (F7), el estilo de la
   capa de la Fase 4, el tiempo de la pregunta de la Fase 7 y las preferencias
   de este cuestionario. Este objeto se calcula al vuelo y no se guarda. */

export function contextoParaCortes(estado, datosGlobales = {}) {
  const respuestas = Object.fromEntries(
    perfilDeCorte(estado, datosGlobales).map((q) => [q.id, q.noSabe ? [] : q.valores]),
  );
  const pelo = respuestaPelo(estado, 'tipoPelo', datosGlobales);
  const tiempo = tiempoParaPeinarse(estado, datosGlobales);
  const estilos = leerDato(estado, 'estilosFavoritos', datosGlobales);

  return {
    // Apartado 16 — el perfil capilar.
    tipoPelo: pelo.contestada && !pelo.noSabe ? pelo.valores[0] : null,
    // Apartado 5, leído de donde ya estaba.
    tiempo: tiempo.valor,
    minutos: tiempo.valor ? MINUTOS_DE_TIEMPO[tiempo.valor] ?? null : null,
    // Apartado 17 — el perfil de estilo.
    estilos: Array.isArray(estilos.valor) ? estilos.valor : (estilos.valor ? [estilos.valor] : []),
    // Lo de este cuestionario.
    longitudes: PARTES_LONGITUD.map((p) => respuestas[p.id]?.[0]).filter(Boolean),
    estilosCorte: respuestas.estilosCorte || [],
    comoPeinar: respuestas.comoPeinar || [],
    mantenimiento: respuestas.mantenimientoCorte?.[0] || null,
    // Apartado 11 — qué lleva ahora.
    actual: datosCorte(estado).actual,
    favoritos: datosCorte(estado).favoritos,
    // Apartado 15 — lo que dice su historial.
    gustaron: cortesQueGustaron(estado),
  };
}

/* ===========================================================================
   7 · LAS REGLAS (apartados 7 y 8)
   ===========================================================================
   Misma forma que `REGLAS_PELO` de la Fase 9, y por el mismo motivo: ⚠️ **toda
   regla declara `requiere`**, sin esos datos no se dispara, y **una regla sin
   requisitos no se aplica nunca** — se dispararía con el contexto vacío y
   acabaría recomendándole cortes a alguien de quien no sabemos nada. */

export const REGLAS_CORTE = [
  {
    id: 'mantenimiento_bajo',
    requiere: ['mantenimiento'],
    cuando: (c) => c.mantenimiento === 'basico',
    // ⚠️ Devuelve ids del catálogo, no cortes: si él borra uno, la regla no
    // se queda apuntando a un fantasma.
    propone: ['buzz_cut', 'crew_cut'],
    porque: () => 'Podría encajarte porque has dicho que quieres preocuparte poco por el mantenimiento.',
  },
  {
    id: 'mantenimiento_medio',
    requiere: ['mantenimiento'],
    cuando: (c) => c.mantenimiento === 'intermedio',
    propone: ['taper', 'texturizado', 'clasico'],
    // El ejemplo literal del apartado 8.
    porque: () => 'Podría encajarte porque buscas un mantenimiento medio y un estilo limpio que puedas llevar de forma natural.',
  },
  {
    id: 'mantenimiento_alto',
    requiere: ['mantenimiento'],
    cuando: (c) => c.mantenimiento === 'avanzado',
    propone: ['fade', 'undercut'],
    porque: () => 'Podría encajarte porque has dicho que no te importa mantenerlo al día.',
  },
  {
    id: 'poco_tiempo',
    requiere: ['minutos'],
    cuando: (c) => c.minutos !== null && c.minutos <= 5,
    propone: ['buzz_cut', 'crew_cut', 'taper'],
    porque: (c) => `Podría encajarte porque dijiste que quieres tardar ${c.tiempo === 'menos_5' ? 'menos de 5 minutos' : 'poco'} en peinarte.`,
  },
  {
    id: 'rizado_corto',
    requiere: ['tipoPelo', 'longitudes'],
    cuando: (c) => ['rizado', 'muy_rizado'].includes(c.tipoPelo) && c.longitudes.includes('corto'),
    propone: ['taper', 'crew_cut'],
    porque: () => 'Podría encajarte porque tu pelo es rizado y has dicho que lo prefieres corto.',
  },
  {
    id: 'liso_medio',
    requiere: ['tipoPelo', 'longitudes'],
    cuando: (c) => c.tipoPelo === 'liso' && c.longitudes.includes('medio'),
    propone: ['texturizado', 'undercut'],
    porque: () => 'Podría encajarte porque tu pelo es liso y lo prefieres de longitud media.',
  },
  {
    id: 'estilo_deportivo',
    requiere: ['estilos'],
    cuando: (c) => c.estilos.some((e) => ['deportivo', 'casual'].includes(e)),
    propone: ['crew_cut', 'taper', 'texturizado'],
    porque: () => 'Una opción compatible con el estilo que has dicho que te gusta llevar.',
  },
  {
    id: 'estilo_elegante',
    requiere: ['estilos'],
    cuando: (c) => c.estilos.some((e) => ['elegante', 'formal', 'clasico'].includes(e)),
    propone: ['clasico', 'taper'],
    porque: () => 'Una opción compatible con el estilo que has dicho que te gusta llevar.',
  },
  {
    id: 'volumen_arriba',
    requiere: ['comoPeinar'],
    cuando: (c) => c.comoPeinar.includes('volumen'),
    propone: ['texturizado', 'undercut'],
    porque: () => 'Podrías probarlo porque has dicho que te gusta peinarlo con volumen.',
  },
  {
    id: 'ya_te_gustaron',
    requiere: ['gustaron'],
    cuando: (c) => c.gustaron.length > 0,
    propone: null,   // los suyos, resueltos en `recomendarCortes`
    // ⚠️ Apartado 15 — *"no presentarlo como diagnóstico ni como una conclusión
    // absoluta"*. "Parece" y "bastante" son las dos palabras que lo evitan.
    porque: () => 'Parece que este estilo encaja bastante con tus preferencias.',
  },
];

export const reglaCorte = (id) => REGLAS_CORTE.find((r) => r.id === id) || null;

/**
 * ⚠️ Sin sus datos no se dispara, y sin requisitos declarados tampoco.
 *
 * ⚠️ **EH F16 extrajo el motor**: esto era una copia del `reglaAplicable` de la
 * Fase 9, y la 16 iba a ser la tercera. Ahora las tres llaman al mismo sitio.
 * Lo único propio de aquí es que **"No lo sé" tampoco cuenta como valor**: el
 * contexto ya lo filtra antes (`contextoParaCortes` devuelve `[]`), así que la
 * comprobación extra se queda como red por si una fase futura pasa el valor
 * crudo.
 */
export const reglaAplicableCorte = (regla, contexto) => reglaAplicable(
  regla,
  Object.fromEntries(Object.entries(contexto || {}).map(([k, v]) => [k, v === NO_LO_SE ? null : v])),
);

/* ===========================================================================
   8 · RECOMENDAR (apartados 7, 8 y 15)
   ===========================================================================
   ⚠️ **Esto calcula y devuelve. No escribe nada** (apartado 18). */

export function recomendarCortes(estado, datosGlobales = {}, { limite = 5 } = {}) {
  if (!parteActiva(estado, 'recomendaciones')) {
    return { recomendaciones: [], total: 0, activo: false, falta: { hayQueAfinar: false, campos: [] } };
  }
  const c = contextoParaCortes(estado, datosGlobales);
  const disponibles = cortesDisponibles(estado);

  // Cada regla que se dispara vota por unos cuantos cortes, y el corte se queda
  // con TODOS sus motivos: el apartado 8 pide un "¿por qué?", y dos razones
  // buenas no se tiran para dejar una.
  const votos = new Map();
  REGLAS_CORTE.forEach((r) => {
    if (!reglaAplicableCorte(r, c)) return;
    const ids = r.propone === null ? c.gustaron : r.propone;
    ids.forEach((id) => {
      if (!disponibles.some((x) => x.id === id)) return;
      if (!votos.has(id)) votos.set(id, []);
      votos.get(id).push({ regla: r.id, porque: r.porque(c) });
    });
  });

  const recomendaciones = [...votos.entries()]
    // ⚠️ El que ya lleva no se le propone: no es una recomendación, es su pelo.
    .filter(([id]) => id !== c.actual)
    .map(([id, motivos]) => {
      const corte = disponibles.find((x) => x.id === id);
      const nivel = nivelMantenimiento(corte.mantenimiento);
      return {
        id,
        corte,
        nombre: corte.nombre,
        // Apartado 9 — lo que se enseña al comparar.
        mantenimiento: nivel ? `${nivel.icono} ${nivel.nombre}` : 'Sin indicar',
        nivel: corte.mantenimiento,
        motivos,
        // Apartado 8 — el "¿por qué?" de la ficha.
        porque: motivos.map((m) => m.porque),
        favorito: c.favoritos.includes(id),
        objetivo: objetivoDeCorte(estado)?.id === id,
      };
    })
    .sort((a, b) => b.motivos.length - a.motivos.length || a.nombre.localeCompare(b.nombre));

  return {
    activo: true,
    total: recomendaciones.length,
    recomendaciones: recomendaciones.slice(0, limite),
    falta: loQueFaltaParaCortes(estado, datosGlobales),
    // ⚠️ Que quede en el propio dato: aquí no se ha guardado nada.
    guardado: false,
  };
}

/** Qué falta por contestar para afinar. **Dice, no pide.** */
export function loQueFaltaParaCortes(estado, datosGlobales = {}) {
  const c = contextoParaCortes(estado, datosGlobales);
  const campos = [];
  if (!c.mantenimiento) campos.push({ id: 'mantenimientoCorte', texto: 'Cuánto mantenimiento quieres hacer', donde: 'Mi estilo de corte' });
  if (!c.tipoPelo) campos.push({ id: 'tipoPelo', texto: 'Qué tipo de pelo tienes', donde: 'Pelo → Mi pelo' });
  if (c.minutos === null && c.tiempo === null) campos.push({ id: 'tiempoPelo', texto: 'Cuánto tiempo quieres dedicarle', donde: TIEMPO_YA_PREGUNTADO.donde });
  if (c.longitudes.length === 0) campos.push({ id: 'longitud', texto: 'Qué longitud prefieres', donde: 'Mi estilo de corte' });
  return {
    campos,
    hayQueAfinar: campos.length > 0,
    texto: campos.length === 0 ? '' : 'Cuéntanos un poco más y afinamos las opciones.',
  };
}

/* ===========================================================================
   9 · COMPARAR (apartado 9)
   =========================================================================== */

export const MAX_COMPARAR_CORTES = 4;

export function compararCortes(estado, ids = []) {
  const lista = ids.slice(0, MAX_COMPARAR_CORTES).map((id) => corteDe(estado, id)).filter(Boolean);
  return lista.map((c) => {
    const nivel = nivelMantenimiento(c.mantenimiento);
    return {
      id: c.id,
      nombre: c.nombre,
      // La forma exacta del ejemplo del enunciado.
      mantenimiento: nivel ? `${nivel.icono} ${nivel.nombre}` : 'Sin indicar',
      nivel: c.mantenimiento,
      // ⚠️ Ni "mejor" ni "peor" ni una puntuación: el apartado dice *"así el
      // usuario puede decidir"*, no "así la aplicación decide".
      minutos: c.minutos,
      descripcion: c.descripcion,
      favorito: datosCorte(estado).favoritos.includes(c.id),
    };
  });
}

/* ===========================================================================
   10 · PATRONES DEL HISTORIAL (apartado 15)
   ===========================================================================
   ⚠️ *"No presentarlo como diagnóstico ni como una conclusión absoluta."* */

export const MINIMO_PARA_PATRON = 2;

/** Los cortes que ha valorado bien más de una vez. Derivado, nunca guardado. */
export function cortesQueGustaron(estado) {
  const cuenta = new Map();
  datosPeluqueria(estado).cortes.forEach((c) => {
    if (!c.corteId || !valoracionCorte(c.valoracion)?.bueno) return;
    cuenta.set(c.corteId, (cuenta.get(c.corteId) || 0) + 1);
  });
  return [...cuenta.entries()]
    .filter(([, n]) => n >= MINIMO_PARA_PATRON)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

export function patronesDeCorte(estado) {
  const ids = cortesQueGustaron(estado);
  if (ids.length === 0) {
    return {
      hay: false,
      // ⚠️ Con un solo corte valorado NO se afirma nada: misma disciplina que
      // `frecuenciaReal` (F11), HT F11 y AR F4.
      texto: '',
      de: datosPeluqueria(estado).cortes.filter((c) => c.valoracion).length,
    };
  }
  return {
    hay: true,
    cortes: ids.map((id) => corteDe(estado, id)).filter(Boolean),
    texto: 'Parece que este estilo encaja bastante con tus preferencias.',
    de: ids.length,
  };
}

/* ===========================================================================
   11 · TONO (apartado 8)
   ===========================================================================
   ⚠️ Se importa el guardián de la Fase 9, no se escribe otro. Y la frase que el
   enunciado prohíbe expresamente —*"este es el mejor corte para ti"*— se
   comprueba aparte, porque no lleva ninguna palabra de la lista de F9. */

export const FRASES_PROHIBIDAS_CORTE = [
  'el mejor corte', 'mejor corte para ti', 'el corte ideal', 'tienes que cortarte',
];

export function tonoCorrectoCorte(texto) {
  const t = String(texto || '').toLowerCase();
  return !FRASES_PROHIBIDAS_CORTE.some((f) => t.includes(f));
}

/* ===========================================================================
   12 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenCortes(estado, datosGlobales = {}) {
  const d = datosCorte(estado);
  const p = progresoCorte(estado, datosGlobales);
  return {
    activo: parteActiva(estado, PARTE_PELUQUERIA),
    contestadas: p.contestadas,
    total: p.total,
    propios: d.propios.length,
    favoritos: d.favoritos.length,
    actual: corteActual(estado)?.nombre || null,
    objetivo: objetivoDeCorte(estado)?.nombre || null,
    disponibles: recomendarCortes(estado, datosGlobales, { limite: 99 }).total,
    valorados: datosPeluqueria(estado).cortes.filter((c) => c.valoracion).length,
  };
}

/**
 * ⚠️ Lo que esta fase NO hace, declarado y con prueba. El apartado 18 es una
 * lista de cinco cosas que la aplicación nunca hace sola; esto las enumera para
 * que se puedan comprobar en vez de confiar en que sea así.
 */
export function auditarCortes(estado) {
  return {
    // Cero almacenes nuevos: una llave en la `config` de Pelo, y el objetivo en
    // la Fase 11.
    almacenesNuevos: 0,
    // Apartado 5 — no se vuelve a preguntar.
    preguntasPropias: PREGUNTAS_CORTE.length,
    tiempoPreguntadoAqui: PREGUNTAS_CORTE.some((p) => p.id === 'tiempoPelo'),
    // Apartado 18 — lo que nunca pasa solo.
    cambiaCorteActual: false,
    creaCitas: false,
    tocaElCalendario: false,
    anadeProductos: false,
    cambiaPreferencias: false,
    // Sin IA, como la Fase 9.
    usaIA: false,
    ...auditarCuestionario(MODULO_PELO, PREGUNTAS_CORTE),
  };
}

/** Todo lo que la pantalla necesita, en una llamada. */
export function panelCortes(estado, datosGlobales = {}) {
  return {
    activo: parteActiva(estado, PARTE_PELUQUERIA),
    perfil: perfilDeCorte(estado, datosGlobales),
    progreso: progresoCorte(estado, datosGlobales),
    tiempo: tiempoParaPeinarse(estado, datosGlobales),
    actual: corteActual(estado),
    objetivo: objetivoDeCorte(estado),
    favoritos: favoritosDeCorte(estado),
    patron: patronesDeCorte(estado),
    contexto: contextoDelCuestionario(estado, MODULO_PELO, preguntasDeCorte(estado), datosGlobales),
  };
}
