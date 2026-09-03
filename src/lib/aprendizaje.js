// ============================================================================
// EH · Fase 57/65 — APRENDIZAJE Y PERSONALIZACIÓN PROGRESIVA
//
// *"No queremos que el usuario tenga que rellenar 50 formularios. Utilizar lo
// que el usuario hace para mejorar las sugerencias. Siempre con control."*
//
// Y la condición de finalización, que es la frontera entera de esta fase:
// *"Cuanto más uses JC Fitness, más útiles pueden ser sus sugerencias. Pero
// nunca: **la aplicación decide quién eres**."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. 🚨 SIN EL INTERRUPTOR DE LA F56, AQUÍ NO SE APRENDE NADA.** No "se aprende
// pero no se usa": **no se aprende**. `aprender()` devuelve el estado tal cual si
// el permiso está apagado. Un sistema que sigue tomando notas de alguien que ha
// dicho que no es exactamente lo que el apartado 16 prohíbe.
//
// **2. 🚨 LO QUE ÉL DICE VALE MÁS QUE LO QUE YO DEDUZCA** (apartado 2, con sus
// palabras: *"estas preferencias tendrán más peso que las inferidas
// automáticamente"*). Una preferencia explícita **no la puede pisar** ninguna
// cantidad de comportamiento. Ni diez señales, ni cien: si él dijo que no le
// gustan los dulces, el sistema **pregunta**, no cambia (apartado 8).
//
// **3. ⚠️ LO RECIENTE PESA MÁS, PERO LO VIEJO NO SE BORRA** (apartados 6 y 7).
// El peso de una señal **baja con el tiempo** en vez de desaparecer: así una
// preferencia antigua deja de mandar sola, sin que se pierda lo que pasó. Los
// gustos cambian, y el sistema tiene que poder cambiar con ellos.
//
// **4. ⚠️ UNA SOSPECHA NO ES UNA VERDAD** (apartado 3: *"pero no convertirlo
// automáticamente en una verdad absoluta"*). Lo inferido nace como **posible
// preferencia**, con su confianza, y solo se convierte en preferencia cuando él
// contesta que sí (apartado 4). Con tres respuestas, no dos: sí, no, y **no
// volver a preguntar**.
//
// **5. 🚨 BORRAR LO APRENDIDO NO BORRA SUS DATOS** (apartado 12). Se van las
// deducciones; sus perfumes, sus rutinas y sus registros **no se tocan**. Hay
// una comprobación que cuenta los datos antes y después.
//
// **6. ⚠️ Y NO SE PERFILA A NADIE** (apartado 13: *"no intentar construir un
// perfil psicológico completo"*). Hay una lista de cosas que **no se deducen
// nunca** —cómo es, cómo está de ánimo, cuánto dinero tiene, su salud—, y una
// comprobación que falla si alguien añade una regla para deducirlas.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import { permisoIA, ACCIONES_PROHIBIDAS, puedeLaIA, NIVELES_DE_CONFIANZA } from './iaEstilo';
import { REGISTRO_DATOS, datoDelRegistro } from './datosEstiloHombre';
import { CAMPOS_PRIVADOS } from './privacidadEstilo';
import { diasDesde } from './motorRecomendaciones';
import { todayISO } from './papelera';

/* ===========================================================================
   1 · DE QUÉ SE APRENDE (apartado 1)
   ===========================================================================
   *"Marcar favorito, rechazar recomendación, valorar algo, guardar un producto,
   repetir una rutina, cambiar una preferencia, ocultar un apartado. No preguntar
   constantemente."*

   ⚠️ Cada señal con **cuánto pesa**, y el peso no es un número al azar: una
   preferencia que él escribe vale más que una que yo deduzco de que guardó tres
   cosas parecidas (decisión 2). */

export const SENALES = [
  { id: 'favorito', icono: '❤️', que: 'Marcar favorito', peso: 3, señal: 'a_favor' },
  { id: 'rechazo', icono: '❌', que: 'Rechazar una recomendación', peso: 4, señal: 'en_contra' },
  { id: 'valorar', icono: '⭐', que: 'Valorar algo', peso: 3, señal: 'a_favor' },
  { id: 'guardar', icono: '💾', que: 'Guardar un producto', peso: 2, señal: 'a_favor' },
  { id: 'repetir', icono: '🔁', que: 'Repetir una rutina', peso: 2, señal: 'a_favor' },
  { id: 'cambiar_preferencia', icono: '✏️', que: 'Cambiar una preferencia', peso: 10, señal: 'explicita' },
  { id: 'ocultar', icono: '🙈', que: 'Ocultar un apartado', peso: 3, señal: 'en_contra' },
];

export const senal = (id) => SENALES.find((s) => s.id === id) || null;

/** 🚨 Decisión 2 — lo explícito no compite con lo inferido: gana. */
export const PESO_EXPLICITO = 100;

/* ===========================================================================
   2 · LO RECIENTE PESA MÁS (apartados 6 y 7) — decisión 3
   ===========================================================================
   *"Dar más peso al comportamiento reciente que al de hace mucho tiempo."*
   *"Una preferencia antigua no debe dominar para siempre."* */

export const VENTANAS = [
  { id: 'reciente', dias: 30, factor: 1 },
  { id: 'medio', dias: 90, factor: 0.6 },
  { id: 'antiguo', dias: 365, factor: 0.3 },
  /* ⚠️ Más de un año: sigue contando **algo**, no cero. Borrarlo del todo sería
     olvidar lo que pasó; que mande sería lo que el apartado 6 prohíbe. */
  { id: 'muy_antiguo', dias: Infinity, factor: 0.1 },
];

export function factorPorFecha(fecha, hoy = todayISO()) {
  const dias = diasDesde(fecha, hoy);
  if (dias === null) return VENTANAS[0].factor;
  return (VENTANAS.find((v) => dias <= v.dias) || VENTANAS[VENTANAS.length - 1]).factor;
}

export function pesoDe(suceso, hoy = todayISO()) {
  const s = senal(suceso?.senal);
  if (!s) return 0;
  return s.peso * factorPorFecha(suceso.cuando, hoy);
}

/* ===========================================================================
   3 · LA CONFIANZA (apartados 3 y 5) — decisión 4
   ===========================================================================
   *"Baja → Media → Alta. Pero no hace falta enseñársela al usuario
   constantemente."* */

export const CONFIANZAS = [
  { id: 'baja', nombre: 'Baja', desde: 0, seEnseña: false },
  { id: 'media', nombre: 'Media', desde: 6, seEnseña: false },
  /* ⚠️ Solo la alta llega a la pantalla, y solo para PREGUNTAR (apartado 4). */
  { id: 'alta', nombre: 'Alta', desde: 12, seEnseña: true },
];

export const confianzaDe = (puntos) => [...CONFIANZAS].reverse().find((c) => puntos >= c.desde) || CONFIANZAS[0];

/** Apartado 4 — a partir de aquí se pregunta. Antes, ni se menciona. */
export const UMBRAL_PARA_PREGUNTAR = 'alta';

/* ===========================================================================
   4 · LO QUE NUNCA SE DEDUCE (apartado 13) — 🚨 decisión 6
   ===========================================================================
   *"No intentar construir un perfil psicológico completo."* */

export const NUNCA_SE_DEDUCE = [
  { id: 'personalidad', que: 'Cómo es como persona' },
  { id: 'animo', que: 'Cómo está de ánimo' },
  { id: 'dinero', que: 'Cuánto dinero tiene o gasta' },
  { id: 'salud', que: 'Nada de salud: eso lo dice él o no se sabe' },
  { id: 'relaciones', que: 'Con quién queda o sale' },
  { id: 'cuerpo', que: 'Qué opina de su cuerpo' },
];

export const SOLO_SE_DEDUCE = 'Lo que sirve para recomendar mejor: qué familias de perfume elige, qué productos guarda, qué rutinas repite y qué rechaza.';

/* ===========================================================================
   5 · DÓNDE VIVE LO APRENDIDO
   ===========================================================================
   ⚠️ En la `config` del módulo anfitrión, igual que la pantalla (F29) y el
   interruptor de la IA (F56). Ningún sistema nuevo. */

export const DEFAULT_APRENDIZAJE = { inferidas: [], explicitas: [], noPreguntar: [] };

export function normalizarAprendizaje(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const lista = (x) => (Array.isArray(x) ? x.filter((p) => p && typeof p.id === 'string') : []);
  return {
    inferidas: lista(g.inferidas),
    explicitas: lista(g.explicitas),
    /* Apartado 4 — *"no volver a preguntar"*. Se guarda, y se respeta. */
    noPreguntar: Array.isArray(g.noPreguntar) ? g.noPreguntar.filter((x) => typeof x === 'string') : [],
  };
}

export const datosAprendizaje = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ANFITRION);
  return normalizarAprendizaje(mod?.config?.aprendizaje);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { aprendizaje: datos });

/* ===========================================================================
   6 · APRENDER (apartados 1, 3 y 16) — 🚨 decisión 1
   =========================================================================== */

/**
 * 🚨 Sin el interruptor de la F56 **no se aprende nada**: el estado vuelve tal
 * cual. No es que se aprenda y no se use; es que no se toma la nota.
 */
export function aprender(estado, sucesos = [], { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!permisoIA(e)) return e;

  const d = datosAprendizaje(e);
  const acumulado = new Map(d.inferidas.map((p) => [p.id, { ...p }]));

  (Array.isArray(sucesos) ? sucesos : []).forEach((s) => {
    if (!senal(s?.senal) || !s?.sobre) return;
    // 🚨 Decisión 6 — no se deduce nada de la lista prohibida, venga como venga.
    if (NUNCA_SE_DEDUCE.some((x) => x.id === s.sobre)) return;
    // Ni nada marcado como privado (F13 y F43).
    if (CAMPOS_PRIVADOS.includes(s.sobre)) return;

    const previo = acumulado.get(s.sobre) || { id: s.sobre, puntos: 0, evidencias: 0, desde: s.cuando || hoy, ultima: null };
    const suma = pesoDe(s, hoy) * (senal(s.senal).señal === 'en_contra' ? -1 : 1);
    acumulado.set(s.sobre, {
      ...previo,
      puntos: previo.puntos + suma,
      evidencias: previo.evidencias + 1,
      ultima: s.cuando || hoy,
    });
  });

  const inferidas = [...acumulado.values()].map((p) => ({
    ...p,
    confianza: confianzaDe(Math.abs(p.puntos)).id,
    sentido: p.puntos >= 0 ? 'a_favor' : 'en_contra',
  }));

  return escribir(e, { ...d, inferidas });
}

/* ===========================================================================
   7 · LO QUE ÉL DICE (apartado 2) — 🚨 decisión 2
   =========================================================================== */

export function guardarExplicita(estado, id, { valor = true, hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosAprendizaje(e);
  const sin = d.explicitas.filter((p) => p.id !== id);
  return escribir(e, { ...d, explicitas: [...sin, { id, valor, cuando: hoy, peso: PESO_EXPLICITO }] });
}

/** 🚨 Lo explícito gana. Siempre, y sin cuentas. */
export function preferencia(estado, id) {
  const d = datosAprendizaje(estado);
  const explicita = d.explicitas.find((p) => p.id === id);
  if (explicita) {
    return { id, valor: explicita.valor, de: 'explicita', peso: PESO_EXPLICITO, confianza: 'alta' };
  }
  const inferida = d.inferidas.find((p) => p.id === id);
  if (!inferida) return null;
  return {
    id,
    valor: inferida.sentido === 'a_favor',
    de: 'inferida',
    peso: Math.abs(inferida.puntos),
    confianza: inferida.confianza,
  };
}

/* ===========================================================================
   8 · PREGUNTAR, NO DECIDIR (apartado 4)
   ===========================================================================
   *"Parece que sueles preferir X. ¿Quieres que lo tenga en cuenta?"* */

export const RESPUESTAS = [
  { id: 'si', etiqueta: 'Sí', hace: 'Se convierte en preferencia explícita.' },
  { id: 'no', etiqueta: 'No', hace: 'Se descarta esa deducción.' },
  { id: 'nunca', etiqueta: 'No volver a preguntar', hace: 'No se vuelve a preguntar por esto.' },
];

export const nombreDe = (id) => datoDelRegistro(id)?.nombre || moduloEH(id)?.nombre || id;

export function loQueSePregunta(estado) {
  const d = datosAprendizaje(estado);
  return d.inferidas
    .filter((p) => p.confianza === UMBRAL_PARA_PREGUNTAR)
    .filter((p) => !d.noPreguntar.includes(p.id))
    // ⚠️ Y no se pregunta por algo que él ya ha contestado a mano.
    .filter((p) => !d.explicitas.some((x) => x.id === p.id))
    .map((p) => ({
      id: p.id,
      texto: `Parece que sueles ${p.sentido === 'a_favor' ? 'preferir' : 'evitar'} ${nombreDe(p.id)}. ¿Quieres que lo tenga en cuenta?`,
      opciones: RESPUESTAS,
      confianza: p.confianza,
    }));
}

export function responderPregunta(estado, id, respuesta, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosAprendizaje(e);
  const inferida = d.inferidas.find((p) => p.id === id);
  if (respuesta === 'si' && inferida) {
    return guardarExplicita(e, id, { valor: inferida.sentido === 'a_favor', hoy });
  }
  if (respuesta === 'no') {
    return escribir(e, { ...d, inferidas: d.inferidas.filter((p) => p.id !== id) });
  }
  if (respuesta === 'nunca') {
    return escribir(e, {
      ...d,
      inferidas: d.inferidas.filter((p) => p.id !== id),
      noPreguntar: [...new Set([...d.noPreguntar, id])],
    });
  }
  return e;
}

/* ===========================================================================
   9 · CUANDO SE CONTRADICE (apartado 8)
   ===========================================================================
   *"No asumir automáticamente que cambió de opinión. Puede aparecer: ¿ha
   cambiado tu preferencia?"* */

export function contradicciones(estado) {
  const d = datosAprendizaje(estado);
  return d.explicitas
    .map((ex) => {
      const inf = d.inferidas.find((p) => p.id === ex.id);
      if (!inf) return null;
      const infAFavor = inf.sentido === 'a_favor';
      if (infAFavor === !!ex.valor) return null;
      return {
        id: ex.id,
        dijo: ex.valor ? 'que le gusta' : 'que no le gusta',
        hace: infAFavor ? 'guardar cosas así' : 'evitarlas',
        /* 🚨 Y esto es lo que NO se hace: cambiarla sola. */
        texto: `Antes dijiste ${ex.valor ? 'que te gusta' : 'que no te gusta'} ${nombreDe(ex.id)}, pero últimamente haces lo contrario. ¿Ha cambiado tu preferencia?`,
        seCambiaSola: false,
        confianza: inf.confianza,
      };
    })
    .filter(Boolean);
}

/* ===========================================================================
   10 · EXPLICAR Y CORREGIR (apartados 9 y 10)
   =========================================================================== */

export function explicar(estado, id) {
  const p = preferencia(estado, id);
  if (!p) return null;
  if (p.de === 'explicita') return `Lo tengo en cuenta porque me lo dijiste tú.`;
  const inf = datosAprendizaje(estado).inferidas.find((x) => x.id === id);
  return `Te lo recomiendo porque anteriormente guardaste ${inf?.evidencias || 0} opciones similares.`;
}

export const TEXTO_CORREGIR = '❌ Eso no representa mis gustos';

/** Apartado 10 — corregir es una acción suya, y gana sobre lo deducido. */
export function corregir(estado, id, { valor = false, hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosAprendizaje(e);
  const sinInferida = { ...d, inferidas: d.inferidas.filter((p) => p.id !== id) };
  return guardarExplicita(escribir(e, sinInferida), id, { valor, hoy });
}

/* ===========================================================================
   11 · SU PANEL, Y BORRAR LO APRENDIDO (apartados 11 y 12) — 🚨 decisión 5
   =========================================================================== */

export const PANEL_MEMORIA = {
  titulo: '🧠 Personalización',
  puede: ['activarla', 'desactivarla', 'revisar lo aprendido', 'corregirlo', 'eliminarlo'],
  /* ⚠️ Activar y desactivar es **el interruptor de la F56**, no un segundo. */
  interruptor: 'El de la F56: 🧠 Usar mis datos para personalizar recomendaciones.',
};

export function loQueHaAprendido(estado) {
  const d = datosAprendizaje(estado);
  return [
    ...d.explicitas.map((p) => ({ id: p.id, nombre: nombreDe(p.id), de: 'explicita', valor: p.valor, cuando: p.cuando })),
    ...d.inferidas.map((p) => ({ id: p.id, nombre: nombreDe(p.id), de: 'inferida', valor: p.sentido === 'a_favor', confianza: p.confianza, evidencias: p.evidencias })),
  ];
}

export const TEXTO_BORRAR = 'Esto borra lo que la aplicación ha deducido de ti. Tus perfumes, tus rutinas y tus registros no se tocan.';

/**
 * 🚨 Apartado 12 — *"esto no debería eliminar los datos originales. Solo lo que
 * el sistema había inferido."* Se van **las inferidas**; lo que él dijo a mano
 * también se puede borrar, pero **por separado y diciéndolo**.
 */
export function borrarAprendizaje(estado, { tambienExplicitas = false } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosAprendizaje(e);
  return escribir(e, {
    inferidas: [],
    explicitas: tambienExplicitas ? [] : d.explicitas,
    // ⚠️ El "no volver a preguntar" se respeta igual: borrar no es permiso para insistir.
    noPreguntar: d.noPreguntar,
  });
}

/* ===========================================================================
   12 · LO QUE NO SE HACE CON ESTO (apartados 14 y 15)
   =========================================================================== */

/** ⚠️ Apartado 14 — las mismas cinco de la F56. No hay una segunda lista. */
export const NO_DECIDE = ACCIONES_PROHIBIDAS;

export const FUENTE_UNICA = {
  regla: 'Una preferencia vive en un sitio. Si ya está en el registro de la F4, aquí se apunta su id, no una copia.',
  donde: 'REGISTRO_DATOS · datosEstiloHombre.js',
  porque: 'Copiar la misma preferencia cinco veces es tener cinco versiones que se contradicen en cuanto una cambie.',
};

/** ¿Este id ya vive en el registro global? */
export const yaViveFuera = (id) => !!datoDelRegistro(id);

/* ===========================================================================
   13 · LOS CINCO USUARIOS (apartado 17)
   =========================================================================== */

export const USUARIOS = [
  { id: 'nuevo', que: 'Usuario nuevo', sucesos: 0, espera: 'Sin preferencias, y sin preguntar nada.' },
  { id: 'ocasional', que: 'Usuario ocasional', sucesos: 2, espera: 'Confianza baja: se apunta, no se pregunta.' },
  { id: 'frecuente', que: 'Usuario frecuente', sucesos: 8, espera: 'Confianza alta: aquí sí se pregunta.' },
  { id: 'cambiante', que: 'Usuario cambiante', sucesos: 6, espera: 'Se detecta la contradicción y se PREGUNTA, no se cambia sola.' },
  { id: 'sin_ia', que: 'Usuario que desactiva la IA', sucesos: 8, espera: '🚨 No se aprende NADA. Ni una nota.' },
];

export const usuario = (id) => USUARIOS.find((u) => u.id === id) || null;

/* ===========================================================================
   14 · LOS DIECISIETE APARTADOS
   =========================================================================== */

export const APARTADOS_APRENDIZAJE = [
  { id: 1, nombre: 'Aprender de forma natural', cumplido: true, donde: 'SENALES' },
  { id: 2, nombre: 'Preferencias explícitas', cumplido: true, donde: 'guardarExplicita() · PESO_EXPLICITO' },
  { id: 3, nombre: 'Preferencias inferidas', cumplido: true, donde: 'aprender()' },
  { id: 4, nombre: 'Confirmación', cumplido: true, donde: 'loQueSePregunta() · RESPUESTAS' },
  { id: 5, nombre: 'Nivel de confianza', cumplido: true, donde: 'CONFIANZAS' },
  { id: 6, nombre: 'Cambio de gustos', cumplido: true, donde: 'VENTANAS — lo antiguo pesa menos, no desaparece' },
  { id: 7, nombre: 'Preferencias actuales', cumplido: true, donde: 'factorPorFecha()' },
  { id: 8, nombre: 'Contradicciones', cumplido: true, donde: 'contradicciones() — pregunta, no cambia' },
  { id: 9, nombre: 'Explicar recomendaciones', cumplido: true, donde: 'explicar()' },
  { id: 10, nombre: 'Corregir el sistema', cumplido: true, donde: 'corregir() · TEXTO_CORREGIR' },
  { id: 11, nombre: 'Control de memoria', cumplido: true, donde: 'PANEL_MEMORIA · loQueHaAprendido()' },
  { id: 12, nombre: 'Borrar aprendizaje', cumplido: true, donde: 'borrarAprendizaje() — no toca sus datos' },
  { id: 13, nombre: 'No perfilar en exceso', cumplido: true, donde: 'NUNCA_SE_DEDUCE' },
  { id: 14, nombre: 'No tomar decisiones importantes', cumplido: true, donde: 'NO_DECIDE — las cinco de la F56' },
  { id: 15, nombre: 'Aprendizaje entre módulos', cumplido: true, donde: 'FUENTE_UNICA' },
  { id: 16, nombre: 'Privacidad', cumplido: true, donde: 'aprender() no hace nada sin el permiso de la F56' },
  { id: 17, nombre: 'Pruebas', cumplido: true, donde: 'USUARIOS' },
];

export const apartadoAprendizaje = (id) => APARTADOS_APRENDIZAJE.find((a) => a.id === id) || null;

export const TEXTOS_APRENDIZAJE = {
  condicion: 'Cuanto más uses JC Fitness, más útiles pueden ser sus sugerencias. Pero nunca "la aplicación decide quién eres": el usuario siempre tiene la última palabra.',
  sinFormularios: 'No hace falta rellenar cincuenta formularios: se aprende de lo que hace.',
  soloSeDeduce: SOLO_SE_DEDUCE,
};

/* ===========================================================================
   15 · EL PARTE
   =========================================================================== */

export function auditarAprendizaje() {
  /* Se prueba de verdad: sin permiso, con permiso, y con contradicción. */
  const base = normalizarEstiloHombre({});
  const sucesos = [
    { senal: 'guardar', sobre: 'familiaPerfume', cuando: todayISO() },
    { senal: 'favorito', sobre: 'familiaPerfume', cuando: todayISO() },
    { senal: 'valorar', sobre: 'familiaPerfume', cuando: todayISO() },
    { senal: 'repetir', sobre: 'familiaPerfume', cuando: todayISO() },
  ];
  const sinPermiso = aprender(base, sucesos);
  const conPermiso = aprender(guardarConfig(base, MODULO_ANFITRION, { ia: { permitido: true, memoria: false } }), sucesos);
  const conDatos = guardarExplicita(conPermiso, 'familiaPerfume', { valor: false });
  const borrado = borrarAprendizaje(conDatos);

  return {
    // 🚨 Decisión 1
    sinPermisoNoAprende: datosAprendizaje(sinPermiso).inferidas.length === 0,
    conPermisoAprende: datosAprendizaje(conPermiso).inferidas.length > 0,
    // 🚨 Decisión 2 — lo explícito gana
    explicitaGana: preferencia(conDatos, 'familiaPerfume')?.de === 'explicita',
    // Apartado 8 — y la contradicción se pregunta
    contradiccionesDetectadas: contradicciones(conDatos).length,
    contradiccionesQueSeCambianSolas: contradicciones(conDatos).filter((c) => c.seCambiaSola).length,
    // 🚨 Decisión 5 — borrar lo aprendido deja lo suyo
    borradoDejaExplicitas: datosAprendizaje(borrado).explicitas.length === datosAprendizaje(conDatos).explicitas.length,
    borradoQuitaInferidas: datosAprendizaje(borrado).inferidas.length === 0,
    // 🚨 Decisión 6
    seDeduceAlgoProhibido: NUNCA_SE_DEDUCE.filter((x) => datosAprendizaje(
      aprender(guardarConfig(base, MODULO_ANFITRION, { ia: { permitido: true } }), [{ senal: 'guardar', sobre: x.id, cuando: todayISO() }]),
    ).inferidas.some((p) => p.id === x.id)).map((x) => x.id),
    senales: SENALES.length,
    sinDonde: APARTADOS_APRENDIZAJE.filter((a) => !a.donde).map((a) => a.id),
    sinCumplir: APARTADOS_APRENDIZAJE.filter((a) => !a.cumplido).map((a) => a.id),
  };
}

export function panelAprendizaje(estado = null) {
  const a = auditarAprendizaje();
  const e = estado ? normalizarEstiloHombre(estado) : null;
  return {
    ...a,
    senales: SENALES,
    confianzas: CONFIANZAS,
    nuncaSeDeduce: NUNCA_SE_DEDUCE,
    usuarios: USUARIOS,
    apartados: APARTADOS_APRENDIZAJE,
    aprendido: e ? loQueHaAprendido(e) : [],
    preguntas: e ? loQueSePregunta(e) : [],
    /* 🎯 El veredicto: **aprende, pero no decide quién eres**. */
    aprendeSinDecidir: a.sinPermisoNoAprende
      && a.conPermisoAprende
      && a.explicitaGana
      && a.contradiccionesQueSeCambianSolas === 0
      && a.borradoDejaExplicitas
      && a.borradoQuitaInferidas
      && a.seDeduceAlgoProhibido.length === 0
      && a.sinDonde.length === 0,
    condicion: TEXTOS_APRENDIZAJE.condicion,
  };
}

export { permisoIA, ACCIONES_PROHIBIDAS, puedeLaIA, NIVELES_DE_CONFIANZA, REGISTRO_DATOS,
  datoDelRegistro, CAMPOS_PRIVADOS, todayISO, MODULO_ANFITRION, guardarConfig };
