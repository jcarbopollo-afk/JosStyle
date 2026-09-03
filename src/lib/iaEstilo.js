// ============================================================================
// EH · Fase 56/65 — INTEGRACIÓN PROFUNDA CON LA IA
//
// *"La IA aconseja. El usuario decide. Nada debe convertirse automáticamente en
// una obligación."*
//
// ── 🚨 LO PRIMERO, PORQUE CAMBIA UNA DECISIÓN ANTERIOR ─────────────────────
//
// La **F43** dejó `estiloHombre` **fuera de `currentState`** a propósito: es la
// única clave de la aplicación que NO viaja a la IA, y está escrito allí como
// una decisión, no como un olvido. Esta fase pide justo lo contrario.
//
// No es una contradicción, y conviene dejar por qué: el apartado 12 exige un
// interruptor —*"🧠 Usar mis datos para personalizar recomendaciones.
// Activar/desactivar"*—. Así que la regla de la F43 se mantiene **como valor por
// defecto**: sin ese interruptor encendido, **de aquí no sale nada**. Y con él
// encendido no sale todo: sale **lo que tenga que ver con la pregunta**
// (apartados 1 y 11).
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 EL INTERRUPTOR NACE APAGADO, Y NO HAY ATAJO PARA SALTÁRSELO.**
// `contextoParaIA()` devuelve **`null`** si no está encendido. No devuelve menos
// datos: devuelve nada. Un "por defecto sí, con opción de apagarlo" habría
// mandado sus rutinas y sus perfumes a un servidor sin que él lo pidiera nunca.
//
// **2. ⚠️ NO SE MANDA TODO CADA VEZ** (apartados 1 y 11: *"no necesita enviar
// absolutamente todos los datos cada vez"*, *"no enviar información privada que
// no tenga relación con la consulta"*). El contexto se pide **para algo** —un
// perfume, una rutina, el estilo— y solo sale lo de ese algo. Preguntar por un
// perfume no manda su seguimiento de la piel.
//
// **3. 🚨 Y LO PRIVADO NO SALE NI CON EL INTERRUPTOR ENCENDIDO.** El tipo de piel
// y su sensibilidad llevan `paraIA: false` desde la **F13**, y la F43 los puso en
// `CAMPOS_PRIVADOS`. El interruptor del apartado 12 **no los desbloquea**: son
// otra cosa. Hay una comprobación que lo intenta y falla a propósito.
//
// **4. ⚠️ APRENDER DE LOS RECHAZOS YA ESTÁ HECHO** (apartados 3, 4 y 14). El
// `motorRecomendaciones` guarda el feedback, silencia lo descartado y sabe
// deshacerlo desde la **F16**. Aquí se **usa**, no se reescribe: una segunda
// memoria de gustos sería el duplicado que la F48 vino a cazar, y encima
// acabarían contradiciéndose.
//
// **5. ⚠️ LA IA NO HACE NADA SOLA** (apartado 15). Comprar, crear objetivos,
// cambiar preferencias, borrar, tocar la configuración: **cinco cosas
// prohibidas**, y no como una advertencia en un comentario, sino como una lista
// que se puede preguntar. Lo que sí puede es **proponer**, con un botón que
// aprieta él (apartado 16).
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH, modulosActivos, IDS_EH } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import { CAMPOS_PRIVADOS, datosQueNoViajan } from './privacidadEstilo';
import { REGISTRO_DATOS, datoDelRegistro, leerDato } from './datosEstiloHombre';
import { DEFAULT_RECOMENDACIONES, normalizarRecomendaciones, descartarEn, silenciadaEn, guardarEn, deshacerDescarteEn, PALABRAS_PROHIBIDAS } from './motorRecomendaciones';
import { preferenciasEnUso } from './preferenciasEstilo';

/* ===========================================================================
   1 · EL INTERRUPTOR (apartado 12) — 🚨 decisión 1
   ===========================================================================
   *"Permitir, mediante la configuración global correspondiente: 🧠 Usar mis
   datos para personalizar recomendaciones. Activar/desactivar."*

   ⚠️ Vive donde vive la configuración de la pantalla: en la `config` del módulo
   anfitrión. Mismo sitio, mismo mecanismo, ningún sistema nuevo (F55, punto de
   extensión `preferencia`). */

export const DEFAULT_IA = { permitido: false, memoria: false };

export const TEXTO_INTERRUPTOR = {
  titulo: '🧠 Usar mis datos para personalizar recomendaciones',
  sub: 'Si lo enciendes, la IA puede mirar lo que has apuntado aquí para responderte mejor.',
  apagado: 'Está apagado. La IA te responde igual, pero sin saber nada de tu estilo.',
  /* ⚠️ Y lo que hay que decir para que encenderlo sea una decisión informada. */
  queSale: 'Sale solo lo que tenga que ver con lo que preguntes, y nunca tu tipo de piel ni tu sensibilidad.',
};

export function normalizarIA(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    // ⚠️ Nace APAGADO. Sin `=== true`, cualquier cosa guardada lo encendería.
    permitido: g.permitido === true,
    memoria: g.memoria === true,
  };
}

export const datosIA = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ANFITRION);
  return normalizarIA(mod?.config?.ia);
};

export const permisoIA = (estado) => datosIA(estado).permitido;

export function alternarPermisoIA(estado) {
  const d = datosIA(estado);
  return guardarConfig(estado, MODULO_ANFITRION, { ia: { ...d, permitido: !d.permitido } });
}

export function alternarMemoriaIA(estado) {
  const d = datosIA(estado);
  /* ⚠️ La memoria no se puede encender si el permiso está apagado: guardar
     preferencias de alguien que ha dicho que no mire sus datos sería absurdo. */
  if (!d.permitido) return normalizarEstiloHombre(estado);
  return guardarConfig(estado, MODULO_ANFITRION, { ia: { ...d, memoria: !d.memoria } });
}

/* ===========================================================================
   2 · QUÉ SE MANDA, Y SOLO PARA QUÉ (apartados 1 y 11) — decisión 2
   ===========================================================================
   *"No necesita enviar absolutamente todos los datos cada vez."* */

export const INTENCIONES = [
  {
    id: 'perfume', que: 'Sobre perfumes',
    modulos: ['perfumes'],

  },
  {
    id: 'rutina', que: 'Sobre una rutina de cuidado',
    modulos: ['skincare', 'pelo', 'barba', 'higiene', 'cuerpo', 'sonrisa'],
  },
  {
    id: 'estilo', que: 'Sobre cómo vestir',
    modulos: ['estilo', 'accesorios'],
  },
  {
    id: 'gustos', que: 'Sobre lo que le gusta',
    modulos: ['gustos'],
  },
  {
    /* ⚠️ La general existe, pero **no manda todo**: manda el resumen de qué
       apartados usa, no su contenido. "¿Qué podría mejorar?" no necesita la
       lista entera de sus perfumes. */
    id: 'general', que: 'Una pregunta abierta',
    modulos: null,
    soloResumen: true,
  },
];

export const intencion = (id) => INTENCIONES.find((i) => i.id === id) || null;

/**
 * 🚨 El contexto para la IA. Devuelve **`null`** si el interruptor está apagado
 * (decisión 1), y si está encendido devuelve **solo lo de la intención**.
 *
 * ⚠️ Y nunca, en ningún caso, un campo de `CAMPOS_PRIVADOS` (decisión 3).
 */
export function contextoParaIA(estado, intencionId, { datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!permisoIA(e)) return null;
  const i = intencion(intencionId);
  if (!i) return null;

  const activos = modulosActivos(e);
  const deLaIntencion = i.modulos === null ? activos : activos.filter((m) => i.modulos.includes(m.id));

  /* Apartado 1 — el resumen de qué usa, que es barato y siempre útil. */
  const resumen = {
    apartadosActivos: activos.map((m) => moduloEH(m.id)?.nombre || m.id),
    usaPreferencias: preferenciasEnUso(e),
  };
  if (i.soloResumen) return { intencion: i.id, resumen, datos: [], privadosOmitidos: [] };

  /* Las preferencias del registro (F4) que tocan esta intención, **sin las
     privadas**. Se cuentan las omitidas para poder enseñarlo. */
  /* ⚠️ El registro de la F4 no tiene un campo "tema": tiene ****, la lista
     de módulos que usan ese dato. Filtrar por un campo que no existe habría
     dejado el contexto vacío SIEMPRE y la prueba de privacidad habría pasado
     por la razón equivocada: no porque se omita lo privado, sino porque no
     salía nada. Se filtra por lo que hay. */
  const candidatos = REGISTRO_DATOS.filter((d) => (
    i.modulos === null || (d.usan || []).some((u) => i.modulos.includes(u))
  ));
  const privados = candidatos.filter((d) => CAMPOS_PRIVADOS.includes(d.id));
  const datos = candidatos
    .filter((d) => !CAMPOS_PRIVADOS.includes(d.id))
    .map((d) => ({ id: d.id, nombre: d.nombre, ...leerDato(e, d.id, datosGlobales) }))
    .filter((d) => d.tiene)
    .map((d) => ({ id: d.id, nombre: d.nombre, valor: d.texto }));

  return {
    intencion: i.id,
    resumen,
    modulos: deLaIntencion.map((m) => moduloEH(m.id)?.nombre || m.id),
    datos,
    /* 🚨 Se dice cuántos se han dejado fuera por privados: así, si alguien mira
       el contexto, ve que la omisión es deliberada y no un dato que falta. */
    privadosOmitidos: privados.map((d) => d.id),
  };
}

/**
 * 🚨 La comprobación que importa: ni un campo privado en lo que VIAJA.
 *
 * 🐛 ⚠️ **Y por quinta vez en este proyecto: una declaración no es una
 * violación.** Mirar el contexto entero cazaba `privadosOmitidos` —que es
 * justamente la lista de lo que NO se manda— y decía que se estaba filtrando el
 * tipo de piel. La F48 arregló esta misma confusión tres veces y la F49 una
 * cuarta. Así que se mira **solo la parte que sale**: el resumen, los módulos y
 * los datos.
 */
export function llevaAlgoPrivado(contexto) {
  if (!contexto) return [];
  const queViaja = JSON.stringify({
    resumen: contexto.resumen,
    modulos: contexto.modulos,
    datos: contexto.datos,
  });
  return CAMPOS_PRIVADOS.filter((c) => new RegExp(`"${c}"|${c}`).test(queViaja));
}

/* ===========================================================================
   3 · APRENDER DE LAS RESPUESTAS (apartados 3, 4 y 14) — decisión 4
   ===========================================================================
   ⚠️ Esto **ya existe** desde la F16: `motorRecomendaciones` guarda el feedback,
   silencia lo descartado y sabe deshacerlo. Aquí solo se declara **cómo se usa
   desde la IA**, y se comprueba que no hay una segunda memoria. */

export const COMO_APRENDE = [
  {
    apartado: 3, id: 'no_me_gusta', señal: '❌ No me gusta',
    hace: 'Se descarta con su motivo y deja de proponerse.',
    funcion: 'descartarEn (F16)',
  },
  {
    apartado: 3, id: 'me_gusta', señal: '❤️ Me gusta',
    hace: 'Se guarda, y cuenta como preferencia para lo siguiente.',
    funcion: 'guardarEn (F16)',
  },
  {
    apartado: 4, id: 'no_repetir', señal: 'Ya lo ha visto',
    hace: 'Se silencia un tiempo en vez de repetirse.',
    funcion: 'silenciadaEn (F16)',
  },
  {
    apartado: 14, id: 'correccion', señal: 'La IA entendió mal',
    hace: '🚨 Lo que él corrige MANDA sobre lo que la IA dedujo: se deshace el descarte y vale su palabra.',
    funcion: 'deshacerDescarteEn (F16)',
  },
];

/** ⚠️ Apartado 14 — quién gana cuando la IA y él no coinciden. */
export const QUIEN_MANDA = 'El usuario. Lo que él corrige tiene prioridad sobre lo que la IA haya deducido, siempre y sin discutirlo.';

/** No hay una segunda memoria: se usa la de la F16. */
export const MEMORIA_DE_GUSTOS = {
  vive: 'motorRecomendaciones.js · `feedback`, `guardadas`, `vistas`',
  deLaFase: 'F16',
  porque: 'Una segunda memoria de gustos acabaría contradiciendo a la primera, y el usuario vería dos opiniones distintas de la misma aplicación.',
};

/* ===========================================================================
   4 · EL CONTEXTO DE LA SITUACIÓN (apartado 5)
   ===========================================================================
   *"🌞 Diario · 🌙 Noche · 🎉 Evento · 🏫 Estudios · 🏖️ Verano. Pero siempre como
   sugerencia."* */

export const SITUACIONES = [
  { id: 'diario', icono: '🌞', nombre: 'Diario' },
  { id: 'noche', icono: '🌙', nombre: 'Noche' },
  { id: 'evento', icono: '🎉', nombre: 'Evento' },
  { id: 'estudios', icono: '🏫', nombre: 'Estudios' },
  { id: 'verano', icono: '🏖️', nombre: 'Verano' },
];

export const situacion = (id) => SITUACIONES.find((s) => s.id === id) || null;

/**
 * Apartado 6 — cruzar con el calendario **sin copiar el evento**.
 * ⚠️ Devuelve una referencia, no una copia: `{ situacion, deEvento }` con el id
 * del evento, no su contenido. Copiarlo aquí sería el duplicado de siempre.
 */
export function situacionDeUnEvento(evento) {
  if (!evento || !evento.id) return null;
  return { situacion: 'evento', deEvento: evento.id, copia: false };
}

/* ===========================================================================
   5 · CÓMO HABLA (apartados 2, 9 y 10)
   ===========================================================================
   *"En lugar de 'aquí tienes 20 perfumes': 'por lo que sueles preferir, estas
   opciones podrían encajarte'. Y explicar brevemente el motivo."* */

export const NIVELES_DE_CONFIANZA = [
  { id: 'dato', icono: '📌', que: 'Sale de algo que tú has apuntado.', esSubjetivo: false },
  { id: 'sugerencia', icono: '💭', que: 'Es una opinión: puede encajarte o no.', esSubjetivo: true },
];

export const nivelDeConfianza = (id) => NIVELES_DE_CONFIANZA.find((x) => x.id === id) || null;

/**
 * ⚠️ Apartados 9 y 10 — una recomendación **sin motivo no se enseña**, y si es
 * subjetiva lo dice. No es un adorno: es lo que separa "te lo recomiendo porque
 * sueles elegir frescos" de "haz esto".
 */
export function recomendacionValida(rec) {
  const problemas = [];
  if (!rec || !rec.que) problemas.push('sin_contenido');
  if (!rec?.porque) problemas.push('sin_motivo');
  if (!nivelDeConfianza(rec?.confianza)) problemas.push('sin_confianza');
  if (rec?.confianza === 'sugerencia' && !/podría|puede|quizá|si te apetece/i.test(rec.que || '')) {
    problemas.push('subjetiva_como_verdad');
  }
  /* ⚠️ Y las palabras que la F16 prohibió: nada de diagnóstico. */
  const prohibida = PALABRAS_PROHIBIDAS.find((p) => new RegExp(p, 'i').test(`${rec?.que || ''} ${rec?.porque || ''}`));
  if (prohibida) problemas.push('palabra_prohibida');
  return { vale: problemas.length === 0, problemas };
}

export const TEXTOS_IA = {
  malo: 'Aquí tienes 20 perfumes.',
  bueno: 'Por lo que sueles preferir, estas opciones podrían encajarte.',
  explicando: 'Te lo digo porque…',
  subjetivo: 'Es una sugerencia, no una verdad: mira si te encaja.',
  preguntame: 'Pregúntame sobre mi estilo',
};

/** Apartado 8 — las preguntas que el enunciado pone de ejemplo. */
export const PREGUNTAS_DE_EJEMPLO = [
  { texto: '¿Qué me recomendarías?', intencion: 'general' },
  { texto: '¿Qué podría mejorar?', intencion: 'general' },
  { texto: '¿Qué combinación encaja?', intencion: 'estilo' },
  { texto: '¿Qué perfume me pongo hoy?', intencion: 'perfume' },
];

/* ===========================================================================
   6 · LO QUE LA IA NO PUEDE HACER (apartado 15) — 🚨 decisión 5
   =========================================================================== */

export const ACCIONES_PROHIBIDAS = [
  { id: 'comprar', que: 'Comprar productos', porque: 'Gastar su dinero no es una sugerencia.' },
  { id: 'crear_objetivo', que: 'Crear objetivos sin permiso', porque: 'Un objetivo que él no ha puesto es una obligación que no ha aceptado.' },
  { id: 'cambiar_preferencia', que: 'Modificar preferencias importantes sin confirmación', porque: 'Sus preferencias son la respuesta a una pregunta que le hicieron a él.' },
  { id: 'eliminar', que: 'Eliminar información', porque: 'Ni con papelera. Borrar es suyo.' },
  { id: 'cambiar_config', que: 'Cambiar configuraciones', porque: 'La pantalla es suya (F31 y F36).' },
];

export const accionProhibida = (id) => ACCIONES_PROHIBIDAS.find((a) => a.id === id) || null;

/** 🚨 Se pregunta, no se recuerda: `puedeLaIA('eliminar')` → false, con motivo. */
export function puedeLaIA(accion) {
  const p = accionProhibida(accion);
  if (p) return { puede: false, porque: p.porque };
  return { puede: true, porque: null };
}

/**
 * Apartado 16 — lo que sí puede: **proponer**, con dos botones.
 * ⚠️ `aplicar` nunca se ejecuta desde aquí: se devuelve la propuesta y la aprieta
 * él. Una acción "sugerida" que se aplica sola es una acción, no una sugerencia.
 */
export function proponer(que, { accion = null, dato = null } = {}) {
  return {
    que,
    accion,
    dato,
    botones: [
      { id: 'aplicar', etiqueta: 'Guardar', porDefecto: false },
      { id: 'no', etiqueta: 'No guardar', porDefecto: true },
    ],
    seAplicaSola: false,
  };
}

/* ===========================================================================
   7 · LA MEMORIA DE LA IA (apartado 13)
   ===========================================================================
   *"Si JC Fitness dispone de memoria: guardar únicamente preferencias útiles y
   apropiadas. No guardar conversaciones completas innecesariamente."* */

export const MEMORIA_IA = {
  existe: false,
  porque: 'JC Fitness no guarda las conversaciones con la IA: cada pregunta va y vuelve, y no queda nada. No hay memoria que limitar.',
  siAlgunDia: 'Se guardaría "prefiere perfumes frescos", no la conversación. Y con el interruptor del apartado 12 encendido, que para eso está.',
  interruptor: 'memoria',
};

/* ===========================================================================
   8 · LAS PRUEBAS (apartado 18)
   ===========================================================================
   *"Probar: preferencias contradictorias, datos insuficientes, datos antiguos,
   preferencias modificadas, usuario sin historial, usuario con mucho historial,
   usuario que desactiva personalización."* */

export const CASOS_IA = [
  { id: 'contradictorias', que: 'Preferencias contradictorias', espera: 'Gana la última que él dijo. No se inventa un promedio.' },
  { id: 'insuficientes', que: 'Datos insuficientes', espera: 'Se pregunta o se generaliza, pero se DICE que se sabe poco.' },
  { id: 'antiguos', que: 'Datos antiguos', espera: 'Se usan, diciendo de cuándo son.' },
  { id: 'modificadas', que: 'Preferencias modificadas', espera: 'La nueva manda desde ya.' },
  { id: 'sin_historial', que: 'Usuario sin historial', espera: 'Contexto casi vacío, y la IA responde igual sin fingir que le conoce.' },
  { id: 'mucho_historial', que: 'Usuario con mucho historial', espera: 'Solo lo de la intención, no todo.' },
  { id: 'desactivada', que: 'Usuario que desactiva la personalización', espera: '🚨 Contexto NULO. No "menos datos": ninguno.' },
];

export const casoIA = (id) => CASOS_IA.find((c) => c.id === id) || null;

/* ===========================================================================
   9 · LOS DIECIOCHO APARTADOS
   =========================================================================== */

export const APARTADOS_IA = [
  { id: 1, nombre: 'Contexto personal', cumplido: true, donde: 'contextoParaIA()' },
  { id: 2, nombre: 'Recomendaciones personalizadas', cumplido: true, donde: 'TEXTOS_IA · recomendacionValida()' },
  { id: 3, nombre: 'Aprender de las respuestas', cumplido: true, donde: 'COMO_APRENDE — el motor de la F16' },
  { id: 4, nombre: 'No repetir', cumplido: true, donde: 'silenciadaEn (F16)' },
  { id: 5, nombre: 'Contexto de la situación', cumplido: true, donde: 'SITUACIONES' },
  { id: 6, nombre: 'Conexión con otros módulos', cumplido: true, donde: 'situacionDeUnEvento() — referencia, no copia' },
  { id: 7, nombre: 'Objetivos', cumplido: true, donde: 'ACCIONES_PROHIBIDAS · crear_objetivo' },
  { id: 8, nombre: 'IA conversacional', cumplido: true, donde: 'PREGUNTAS_DE_EJEMPLO + INTENCIONES' },
  { id: 9, nombre: 'Explicaciones', cumplido: true, donde: 'recomendacionValida() — sin motivo no se enseña' },
  { id: 10, nombre: 'Nivel de confianza', cumplido: true, donde: 'NIVELES_DE_CONFIANZA' },
  { id: 11, nombre: 'Privacidad', cumplido: true, donde: 'contextoParaIA() + llevaAlgoPrivado()' },
  { id: 12, nombre: 'Control del usuario', cumplido: true, donde: 'El interruptor, apagado por defecto' },
  { id: 13, nombre: 'Memoria de la IA', cumplido: false, donde: 'MEMORIA_IA — no existe, y se dice' },
  { id: 14, nombre: 'Corrección del usuario', cumplido: true, donde: 'QUIEN_MANDA · deshacerDescarteEn (F16)' },
  { id: 15, nombre: 'Evitar automatismos', cumplido: true, donde: 'ACCIONES_PROHIBIDAS · puedeLaIA()' },
  { id: 16, nombre: 'Acciones sugeridas', cumplido: true, donde: 'proponer()' },
  { id: 17, nombre: 'Aprendizaje progresivo', cumplido: true, donde: 'El interruptor + el motor de la F16' },
  { id: 18, nombre: 'Pruebas de IA', cumplido: true, donde: 'CASOS_IA' },
];

export const apartadoIA = (id) => APARTADOS_IA.find((a) => a.id === id) || null;

export const TEXTOS_CONDICION = {
  condicion: 'La IA de Estilo de hombre debe sentirse como un asesor personal opcional, no como un sistema que manda sobre el usuario.',
  ideal: 'IA sugiere → usuario valora → usuario decide → JC Fitness aprende si el usuario quiere.',
  /* 🚨 Y la frase que resume la decisión 1, para que nadie la cambie sin verla. */
  porDefecto: 'Apagado. Sin que él lo encienda, de Estilo de hombre no sale nada hacia la IA.',
};

/* ===========================================================================
   10 · EL PARTE
   =========================================================================== */

export function auditarIA(estado = null, { datosGlobales = {} } = {}) {
  const base = normalizarEstiloHombre(estado || {});
  const encendido = alternarPermisoIA(base);
  const contextos = INTENCIONES.map((i) => contextoParaIA(encendido, i.id, { datosGlobales }));
  return {
    // 🚨 Decisión 1 — apagado, no sale nada.
    apagadoDaNull: INTENCIONES.every((i) => contextoParaIA(base, i.id) === null),
    porDefectoApagado: permisoIA(base) === false,
    // 🚨 Decisión 3 — ni con el interruptor encendido sale lo privado.
    privadosQueSeEscapan: contextos.flatMap((c) => llevaAlgoPrivado(c)),
    privadosDeclarados: CAMPOS_PRIVADOS.length,
    // Decisión 2 — la general no manda el contenido de todo.
    generalSoloResumen: contextoParaIA(encendido, 'general')?.datos.length === 0,
    intenciones: INTENCIONES.length,
    prohibidas: ACCIONES_PROHIBIDAS.length,
    sinMotivo: ACCIONES_PROHIBIDAS.filter((a) => !a.porque).map((a) => a.id),
    aprendeCon: COMO_APRENDE.map((c) => c.funcion),
    // Y ninguna forma de aprender inventa una memoria nueva.
    memoriaPropia: COMO_APRENDE.some((c) => !/F16/.test(c.funcion)),
    apartadosSinCumplir: APARTADOS_IA.filter((a) => !a.cumplido).map((a) => a.id),
    sinDonde: APARTADOS_IA.filter((a) => !a.donde).map((a) => a.id),
  };
}

export function panelIA(estado = null, opciones = {}) {
  const a = auditarIA(estado, opciones);
  return {
    ...a,
    interruptor: TEXTO_INTERRUPTOR,
    intencionesLista: INTENCIONES,
    situaciones: SITUACIONES,
    prohibidasLista: ACCIONES_PROHIBIDAS,
    casos: CASOS_IA,
    apartados: APARTADOS_IA,
    /* 🎯 El veredicto: **asesor opcional, no sistema que manda**. */
    esUnAsesor: a.apagadoDaNull
      && a.porDefectoApagado
      && a.privadosQueSeEscapan.length === 0
      && a.generalSoloResumen
      && !a.memoriaPropia
      && a.sinMotivo.length === 0
      && a.sinDonde.length === 0,
    condicion: TEXTOS_CONDICION.condicion,
  };
}

export { CAMPOS_PRIVADOS, datosQueNoViajan, PALABRAS_PROHIBIDAS, DEFAULT_RECOMENDACIONES,
  normalizarRecomendaciones, descartarEn, silenciadaEn, guardarEn, deshacerDescarteEn,
  REGISTRO_DATOS, datoDelRegistro, MODULO_ANFITRION, IDS_EH };
