/* Fase 2 · Chatbots — el núcleo conversacional determinista
   ═══════════════════════════════════════════════════════════════════════════

   Comprender → planificar → ejecutar → componer, con reglas y sin un solo modelo
   generativo, sin red y sin claves (DA-09). La especificación entera está en
   `docs/15_asistentes/ESPECIFICACION_CHATBOTS.md` (§6 contratos, §7 comprensión
   y contexto, §8 respuestas) y su auditoría en el §16; aquí solo se recuerda lo
   que cuesta ver leyendo el código.

   🚨 **Este archivo no conoce ningún módulo ni ningún dato.** Recibe un
   asistente (su léxico y sus capacidades, `asistente*.js`), el mensaje, SOLO
   los datos que ese asistente puede leer (`datosParaAsistente`) y el contexto
   de la conversación, y devuelve respuestas compuestas de bloques. No escribe
   nada, no guarda nada y no importa nada que pueda salir del dispositivo —
   `test-asistentes-chat.mjs` recorre sus imports para demostrarlo—.

   🚨 **No son palabras clave sueltas.** Un mensaje se normaliza (sin acentos,
   abreviaturas de móvil, números escritos), se buscan CONCEPTOS del léxico con
   raíces, plurales y erratas (la misma distancia de Damerau-Levenshtein que el
   buscador, `indiceBusqueda.js`), se puntúa cada capacidad con sus señales y
   lo que admite (una fecha de un día o de un rango, una entidad) y, si dos
   empatan, se pregunta. Varias preguntas en un mensaje se contestan por
   separado; «¿y ayer?» reutiliza la pregunta anterior; «no, me refería a…» la
   corrige.

   ⚠️ **Determinista**: el mismo mensaje con los mismos datos y el mismo
   contexto da la misma respuesta. Sin azar: la variedad sale de lo que dicen
   los datos (qué bloques hay), no de sinónimos tirados a suertes. */

import { normalizar, normalizarRaiz, distanciaErratas, margenDeErratas } from './indiceBusqueda';
import { interpretarFechas, periodoPorDefecto, fechasDelRango, etiquetaDeDia } from './fechasConversacion';

/* ══════════════════════════════════════════════════════════════════════════
   1 · LÍMITES
   ══════════════════════════════════════════════════════════════════════════ */

export const MAX_MENSAJE = 300;
export const MAX_MENSAJES_CONVERSACION = 40;
export const MAX_INTENCIONES = 3;
export const MAX_ITEMS_LISTA = 6;
export const MAX_OPCIONES = 4;
export const TURNOS_CONTEXTO = 6;
export const MINUTOS_CONTEXTO = 30;
export const PUNTOS_MINIMOS = 2;
export const VENTAJA_MINIMA = 1;

/* ══════════════════════════════════════════════════════════════════════════
   2 · NORMALIZAR UN MENSAJE
   ══════════════════════════════════════════════════════════════════════════ */

/* Cómo se escribe en un móvil. Solo se traducen palabras ENTERAS. */
const ABREVIATURAS = {
  q: 'que', k: 'que', ke: 'que', xq: 'porque', pq: 'porque', porq: 'porque', xk: 'porque',
  tb: 'tambien', tmb: 'tambien', tbn: 'tambien', tambn: 'tambien', d: 'de', dl: 'del', x: 'por',
  xa: 'para', pa: 'para', toy: 'estoy', hrs: 'horas', hr: 'horas', hs: 'horas', min: 'minutos',
  mins: 'minutos', kcal: 'calorias', kcals: 'calorias', cals: 'calorias', prote: 'proteina',
  gym: 'gimnasio', gim: 'gimnasio', ejer: 'ejercicio', info: 'informacion', dnd: 'donde',
  xfa: 'por favor', pls: 'por favor', porfa: 'por favor', ns: 'no se', nse: 'no se',
  sobao: 'sobado', dormio: 'dormido', cuantoo: 'cuanto', tal: 'tal',
};

/** Separa por signos ANTES de normalizar (normalizar los borra): «?», «,», «;» y «.» marcan dónde
 *  puede acabar una pregunta. El marcador `¦` no casa con nada y corta las frases del léxico. */
export function normalizarMensaje(entrada) {
  const crudo = String(entrada ?? '').slice(0, MAX_MENSAJE);
  const conCortes = crudo.replace(/[?¿!¡;.,]+/g, ' ¦ ').replace(/(\d)\s*h\b/gi, '$1 horas');
  const tokens = normalizar(conCortes)
    .split(' ')
    .filter(Boolean)
    /* 🐛 Solo las claves PROPIAS de la tabla: con `ABREVIATURAS[t]` a secas, «constructor» y «__proto__» encontraban
       lo que hereda cualquier objeto y la conversación lanzaba un TypeError. */
    .flatMap((t) => (Object.prototype.hasOwnProperty.call(ABREVIATURAS, t) ? ABREVIATURAS[t].split(' ') : [t]));
  /* Sin cortes al principio ni al final, ni dos seguidos. */
  const limpios = [];
  for (const t of tokens) {
    if (t === '¦' && (!limpios.length || limpios[limpios.length - 1] === '¦')) continue;
    limpios.push(t);
  }
  while (limpios.length && limpios[limpios.length - 1] === '¦') limpios.pop();
  return { texto: limpios.join(' '), tokens: limpios };
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · EL LÉXICO: conceptos con raíces, plurales y erratas
   ══════════════════════════════════════════════════════════════════════════ */

/* Palabras que pueden ir entre las de una expresión sin romperla: «horas DE sueño». */
const RELLENO = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'mi', 'mis', 'un', 'una', 'lo', 'al', 'en', 'a', 'me', 'te', 'tu', 'tus', 'su', 'sus', 'que', 'he', 'has', 'ha']);

/* Una expresión: «dorm*» es raíz (dormí, dormido, dormir); «=apunta» es exacta (ni plural ni
   erratas: «registra» es una orden y «registrado» no). Se compila una vez y se guarda. */
const compiladas = new Map();
function compilar(expresion) {
  if (compiladas.has(expresion)) return compiladas.get(expresion);
  const exacta = expresion.startsWith('=');
  /* Las palabras de relleno DE DENTRO de una expresión no se exigen («horas de sueño» casa con «horas
     sueño»); las del principio sí, porque cambian el sentido («a qué hora», «me desperté»). */
  const crudas = normalizar(exacta ? expresion.slice(1) : expresion).split(' ').filter(Boolean);
  const sinRellenoInterior = crudas.filter((t, i) => exacta || i === 0 || i === crudas.length - 1 || !RELLENO.has(t) || RELLENO.has(crudas[0]));
  const piezas = sinRellenoInterior.map((t) => {
    const prefijo = t.endsWith('*');
    const base = prefijo ? t.slice(0, -1) : t;
    return { t: base, raiz: normalizarRaiz(base), prefijo, exacta };
  });
  compiladas.set(expresion, piezas);
  return piezas;
}

function coincide(tok, raizTok, pieza) {
  if (tok === '¦') return false;
  if (pieza.exacta) return tok === pieza.t;
  if (pieza.prefijo) {
    if (tok.startsWith(pieza.t)) return true;
    return pieza.t.length >= 5 && tok.length >= pieza.t.length
      && distanciaErratas(tok.slice(0, pieza.t.length), pieza.t, 1) <= 1;
  }
  if (tok === pieza.t || raizTok === pieza.raiz) return true;
  const margen = margenDeErratas(pieza.t);
  return margen > 0 && distanciaErratas(tok, pieza.t, margen) <= margen;
}

/** Dónde aparece una expresión en los tokens: [{ inicio, fin }] (fin incluido). */
function buscarExpresion(tokens, raices, expresion) {
  const piezas = compilar(expresion);
  if (!piezas.length) return [];
  const halladas = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (!coincide(tokens[i], raices[i], piezas[0])) continue;
    let j = i;
    let ok = true;
    for (let p = 1; p < piezas.length; p += 1) {
      let k = j + 1;
      let saltos = 0;
      while (k < tokens.length && !coincide(tokens[k], raices[k], piezas[p]) && RELLENO.has(tokens[k]) && saltos < 2) { k += 1; saltos += 1; }
      if (k >= tokens.length || !coincide(tokens[k], raices[k], piezas[p])) { ok = false; break; }
      j = k;
    }
    if (ok) halladas.push({ inicio: i, fin: j });
  }
  return halladas;
}

/**
 * Los conceptos de un léxico que aparecen en los tokens: Map concepto → [{ inicio, fin }].
 * @param {string[]} tokens
 * @param {Record<string, string[]>} lexico
 */
export function detectarConceptos(tokens, lexico) {
  const raices = tokens.map((t) => (t === '¦' ? t : normalizarRaiz(t)));
  const salida = new Map();
  for (const [concepto, expresiones] of Object.entries(lexico || {})) {
    for (const e of expresiones) {
      const h = buscarExpresion(tokens, raices, e);
      if (h.length) salida.set(concepto, [...(salida.get(concepto) || []), ...h]);
    }
  }
  return salida;
}

/* Lo que entienden TODOS los asistentes: cómo se pregunta y lo que no se puede hacer. */
export const LEXICO_GENERAL = {
  /* «=cantidad» exacta: con dos erratas de margen, «calidad» casaba con «cantidad». */
  cuanto: ['cuanto', 'cuanta', 'cuantos', 'cuantas', '=cantidad', '=total', 'numero de'],
  /* «=suelo» exacta: con una errata de margen, «sueño» casaba con «suelo». */
  media: ['media', 'promedio', 'de media', 'normalmente', '=suelo', '=sueles', 'habitual', 'por dia', 'al dia', 'diario'],
  comparar: ['compara*', 'comparacion', 'respecto', 'diferencia', 'vs', 'versus', 'frente a', 'mas que', 'menos que', 'que la semana pasada', 'que el mes pasado', 'que la pasada', 'que el pasado', 'he mejorado', 'he empeorado'],
  ultimo: ['ultimo', 'ultima', 'la ultima vez', 'reciente', 'mas reciente'],
  proximo: ['proximo', 'proxima', 'proximos', 'proximas', 'siguiente', 'que viene', 'que toca', 'toca', 'tengo pendiente', 'pendientes'],
  cuando: ['cuando', 'que dia', 'fecha', 'para cuando'],
  mejor: ['record', 'mejor marca', 'maximo', 'mejor resultado', 'mi mejor', 'pr'],
  extremos: ['mas larga', 'mas corta', 'mas alto', 'mas bajo', 'mejor dia', 'peor dia', 'mas largo', 'mas corto'],
  lista: ['cuales', 'lista', 'dime', 'ensename', 'muestrame', 'que tengo', 'resumen'],
};

export const LEXICO_COMUN = {
  saludo: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'ey', 'holi', 'hello', 'que pasa', 'que hay'],
  gracias: ['gracias', 'muchas gracias', 'thanks', 'grax', 'mil gracias', 'vale gracias', 'ok gracias'],
  despedida: ['adios', 'chao', 'hasta luego', 'nos vemos', 'bye', 'hasta otra'],
  ayuda: ['ayuda', 'que puedes hacer', 'que sabes hacer', 'que te puedo preguntar', 'que puedo preguntar', 'como funcionas', 'que haces', 'para que sirves', 'help', 'que sabes'],
  identidad: ['eres una ia', 'eres ia', 'eres un robot', 'eres un bot', 'quien eres', 'que eres', 'chatgpt', 'inteligencia artificial', 'eres real', 'eres humano', 'eres una persona'],
  escritura: ['=apunta', '=apuntame', '=apuntalo', '=anota', '=anotame', '=anotalo', '=registra', '=registrame', '=guarda', '=guardame', '=guardalo',
    '=anade', '=anademe', '=agrega', '=borra', '=borrame', '=borralo', '=elimina', '=eliminame', '=quita', '=quitame', '=cambia', '=cambiame',
    '=modifica', '=edita', '=crea', '=creame', '=actualiza', '=marca como', '=marcalo', '=ponme', '=pon que', '=mete', '=sube', '=resetea',
    '=vacia', '=escribe', '=apunte', '=borres', '=anadas', '=cambies', '=elimines'],
  causa: ['por que', 'porque', 'motivo', 'a que se debe', 'como es que', 'la culpa', 'que lo causa', 'razon de'],
  consejo: ['deberia', 'debo', 'tengo que', 'que hago', 'que me recomiendas', 'recomiendame', 'recomiendas', 'consejo', 'aconsejas', 'que harias', 'como mejoro', 'como puedo mejorar', 'para mejorar', 'que puedo mejorar', 'que cambio'],
  diagnostico: ['es normal', 'es malo', 'es bueno', 'es sano', 'es grave', 'estoy enfermo', 'insomnio', 'enfermedad', 'trastorno', 'me pasa algo', 'medico', 'deficit', 'anemia', 'obesidad', 'anorexia', 'bulimia', 'es suficiente', 'es poco', 'es mucho', 'esta bien', 'estoy bien', 'voy bien', 'voy mal',
    'comiendo poco', 'comiendo mucho', 'como poco', 'como demasiado', 'duermo poco', 'duermo mucho', 'duermo suficiente', 'es demasiado', 'estoy gordo', 'estoy delgado'],
  /* Los futuros, exactos: con una errata de margen «dormir» casaba con «dormiré» y «¿cuál fue mi hora de
     dormir?» se contestaba como una predicción (lo cazó la sonda del recorrido). Y «que pasara» también:
     casaba con «que la PASADA» y «¿duermo más esta semana que la pasada?» se tomaba por una predicción. */
  prediccion: ['=dormire', 'voy a dormir', '=aprobare', '=suspendere', '=llegare', '=conseguire', '=lograre', '=pesare', 'predice', 'prediccion', 'pronostico', 'adivina', 'cuanto tardare', 'va a pasar', '=que pasara', '=sacare'],
  no_registrado: ['=pasos', '=paso', 'pulsaciones', 'frecuencia cardiaca', 'ritmo cardiaco', '=rem', 'fases del sueno', 'sueno profundo', 'sueno ligero', 'ronquidos', 'roncar', 'ronque', 'oxigeno', 'spo2', 'vo2', '=estres',
    'calorias quemadas', 'calorias gastadas', 'quemado calorias', 'quemar calorias', 'he quemado', 'temperatura', 'glucosa', 'tension arterial', 'kilometros', '=km'],
  correccion: ['no me referia', 'me referia', 'quiero decir', 'queria decir', 'mejor dicho', 'no hablo de', 'no era eso', 'corrijo', 'no eso no'],
  referencia: ['eso', 'ese', 'esa', 'esto', 'lo anterior', 'lo mismo', 'el mismo', 'la misma'],
};

const CONECTORES = new Set(['y', 'e', 'ademas', 'tambien', 'luego', 'aparte', 'despues', '¦']);

/* 🐛 D3 — «¿cómo CAMBIA mi media?» y «¿cuánto SUBE mi press?» recibían la negativa a escribir: la
   tercera persona del presente se escribe igual que el imperativo («cambia el objetivo»). Esas formas
   solo cuentan como orden si en su frase no hay delante una palabra de pregunta. Las que no se
   confunden con nada («cámbiame», «bórralo», «marca como…») siguen siendo una orden siempre. */
const ESCRITURA_AMBIGUA = new Set(['apunta', 'anota', 'registra', 'guarda', 'anade', 'agrega', 'borra', 'elimina', 'quita', 'cambia',
  'modifica', 'edita', 'crea', 'actualiza', 'mete', 'sube', 'resetea', 'vacia', 'escribe']);
const INTERROGATIVAS = new Set(['cuanto', 'cuanta', 'cuantos', 'cuantas', 'como', 'cual', 'cuales', 'cuando', 'donde', 'que', 'quien']);

/** ¿Pide de verdad apuntar, cambiar o borrar algo? (y no solo usa un verbo que se escribe igual) */
export function esOrdenDeEscritura(tokens) {
  const hallazgos = detectarConceptos(tokens, { escritura: LEXICO_COMUN.escritura }).get('escritura') || [];
  return hallazgos.some(({ inicio, fin }) => {
    if (inicio !== fin || !ESCRITURA_AMBIGUA.has(tokens[inicio])) return true;
    for (let i = inicio - 1; i >= 0 && !CONECTORES.has(tokens[i]); i -= 1) {
      if (INTERROGATIVAS.has(tokens[i])) return false;
    }
    return true;
  });
}

/* 🐛 D4 — «¿qué temas TENGO QUE estudiar?» recibía «no doy consejos» antes del dato. «Tengo que» y
   «debo» piden consejo… salvo cuando lo que preguntan está apuntado: un examen, un tema pendiente, lo
   que toca según el plan, los hábitos de hoy. Por eso son DÉBILES: no avisan si gana sin duda una
   capacidad que lo contesta con datos (`cubreObligacion`). «Debería», «qué hago» o «recomiéndame»
   siguen avisando siempre. */
const CONSEJO_DEBIL = ['tengo que', 'debo'];
function consejoCubierto(tokens, ganadoraDelMensaje) {
  const fuertes = LEXICO_COMUN.consejo.filter((e) => !CONSEJO_DEBIL.includes(e));
  const h = detectarConceptos(tokens, { fuerte: fuertes, debil: CONSEJO_DEBIL });
  return !h.has('fuerte') && h.has('debil') && ganadoraDelMensaje.estado === 'unica' && !!ganadoraDelMensaje.capacidad.cubreObligacion;
}
const ORDINALES = { 1: ['1', 'uno', 'primero', 'primera', 'el primero', 'la primera', 'el 1'], 2: ['2', 'dos', 'segundo', 'segunda', 'el segundo', 'la segunda'], 3: ['3', 'tres', 'tercero', 'tercera', 'el tercero', 'la tercera'], 4: ['4', 'cuatro', 'cuarto', 'cuarta', 'el cuarto', 'la cuarta'] };

/* ══════════════════════════════════════════════════════════════════════════
   4 · ENTIDADES (un ejercicio, una asignatura, un hábito…)
   ══════════════════════════════════════════════════════════════════════════ */

/* Palabras que nunca son el nombre de algo, aunque empiecen igual que uno. */
const NO_ENTIDAD = new Set([...RELLENO, 'como', 'voy', 'va', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'que', 'mas', 'menos', 'hoy', 'ayer', 'dia', 'dias',
  'mes', 'semana', 'horas', 'hora', 'media', 'tal', 'tengo', 'hice', 'hago', 'hecho', 'este', 'esta', 'ese', 'esa', 'eso', 'por', 'para', 'con', 'sin', 'pasada',
  'pasado', 'ultimo', 'ultima', 'cuando', 'record', 'mejor', 'marca', 'y', 'e', 'o', 'es', 'son', 'fue', 'mio', 'mia', 'mis', 'cual', 'cuales', 'donde', 'todo',
  'todos', 'todas', 'algo', 'nada', 'muy', 'bien', 'mal', 'si', 'no', 'ya', 'aun', 'lleva', 'llevo', 'van', 'dime', 'ver', 'mira', 'proximo', 'proxima',
  'examen', 'examenes', 'entrega', 'entregas', 'nota', 'notas', 'tema', 'temas', 'habito', 'habitos', 'racha', 'ejercicio', 'ejercicios', 'entreno', 'entrenamiento']);

const piezasDeNombre = (nombre) => normalizar(nombre).split(' ').filter((t) => t && !RELLENO.has(t));

/**
 * Busca entidades de una lista en los tokens.
 * @param {string[]} tokens
 * @param {Array<{ tipo, id, nombre, alias?: string[], reciente?: number }>} entidades
 * @param {Set<number>} [ocupados] índices que ya son otra cosa (fechas)
 * @returns {{ estado: 'unica'|'ambigua'|'ninguna', entidad?, candidatas: [], tramos: number[] }}
 */
export function resolverEntidad(tokens, entidades, ocupados = new Set()) {
  const lista = Array.isArray(entidades) ? entidades.filter((e) => e && e.id && e.nombre) : [];
  const libres = tokens.map((t, i) => (t === '¦' || ocupados.has(i) || NO_ENTIDAD.has(t) ? null : t));
  const raices = libres.map((t) => (t ? normalizarRaiz(t) : null));
  const puntuadas = [];
  for (const e of lista) {
    let mejor = null;
    /* D5 — el nombre con su detalle («Lenguaje Bachillerato») es otra forma de nombrarla: así lo que
       dice el botón de una aclaración, escrito a mano, la distingue de su homónima. */
    for (const variante of [e.nombre, ...(e.detalle ? [`${e.nombre} ${e.detalle}`] : []), ...(e.alias || [])]) {
      const piezas = piezasDeNombre(variante);
      if (!piezas.length) continue;
      const usados = new Set();
      let casadas = 0;
      let distintiva = false;
      for (const p of piezas) {
        const pieza = { t: p, raiz: normalizarRaiz(p), prefijo: false, exacta: false };
        const idx = libres.findIndex((t, i) => t && !usados.has(i) && (coincide(t, raices[i], pieza)
          || (t.length >= 3 && p.length >= t.length + 2 && p.startsWith(t))));
        if (idx >= 0) { usados.add(idx); casadas += 1; if (p.length >= 4) distintiva = true; }
      }
      if (!casadas || (!distintiva && casadas < piezas.length)) continue;
      const v = { cobertura: casadas / piezas.length, casadas, sobran: piezas.length - casadas, tramos: [...usados], exacta: casadas === piezas.length && usados.size === piezas.length };
      if (!mejor || v.cobertura > mejor.cobertura || (v.cobertura === mejor.cobertura && v.sobran < mejor.sobran)
        || (v.cobertura === mejor.cobertura && v.sobran === mejor.sobran && v.casadas > mejor.casadas)) mejor = v;
    }
    if (mejor) puntuadas.push({ e, ...mejor });
  }
  if (!puntuadas.length) return { estado: 'ninguna', candidatas: [], tramos: [] };
  puntuadas.sort((a, b) => b.cobertura - a.cobertura || b.casadas - a.casadas || a.sobran - b.sobran || (b.e.reciente || 0) - (a.e.reciente || 0) || a.e.nombre.localeCompare(b.e.nombre));
  const [p1, p2] = puntuadas;
  const empata = (x) => x && x.cobertura === p1.cobertura && x.casadas === p1.casadas && x.sobran === p1.sobran;
  const unica = p1.cobertura === 1 ? !empata(p2) : (!empata(p2) && p1.cobertura >= 0.5 && (!p2 || p2.cobertura < p1.cobertura));
  if (unica) return { estado: 'unica', entidad: p1.e, candidatas: [p1.e], tramos: p1.tramos };
  const empatadas = puntuadas.filter((x) => x.cobertura === p1.cobertura && x.casadas === p1.casadas)
    .sort((a, b) => (b.e.reciente || 0) - (a.e.reciente || 0) || a.e.nombre.localeCompare(b.e.nombre));
  /* H-10 — entre las que empatan, si solo UNA tiene historia, es esa: «press banca» con la de barra
     entrenada y la de mancuernas nunca hecha no es una duda de verdad. */
  const conHistoria = p1.cobertura === 1 ? empatadas.filter((x) => (x.e.reciente || 0) > 0 && x.sobran === p1.sobran) : [];
  /* 🐛 D5 — pero NO entre dos que se llaman igual: «Lenguaje» de Bachillerato y «Lenguaje» de Música
     son dos asignaturas, y elegir la que tiene historial sería decidir por él sin decírselo. */
  const homonima = (x) => empatadas.some((y) => y !== x && normalizar(y.e.nombre) === normalizar(x.e.nombre));
  if (conHistoria.length === 1 && !homonima(conHistoria[0])) return { estado: 'unica', entidad: conHistoria[0].e, candidatas: [conHistoria[0].e], tramos: conHistoria[0].tramos };
  return { estado: 'ambigua', candidatas: empatadas.slice(0, MAX_OPCIONES).map((x) => x.e), tramos: p1.tramos, total: empatadas.length };
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · CONVERSACIÓN Y CONTEXTO (§7.6)
   ══════════════════════════════════════════════════════════════════════════ */

/** Una conversación nueva. Lleva el usuario con el que empezó: la de otro no se usa (H-01). */
export function nuevaConversacion(usuario = null) {
  return { usuario, turno: 0, actualizado: 0, ultima: null, periodo: null, periodoTurno: 0, entidades: {}, pendiente: null };
}

/** Lo heredable caduca por turnos y por tiempo. */
function contextoVigente(ctx, ahora) {
  if (!ctx) return nuevaConversacion(null);
  const viejo = ctx.actualizado && ahora - ctx.actualizado > MINUTOS_CONTEXTO * 60000;
  return viejo ? { ...nuevaConversacion(ctx.usuario), turno: ctx.turno } : ctx;
}
const heredable = (ctx, turnoGuardado) => turnoGuardado && ctx.turno - turnoGuardado < TURNOS_CONTEXTO;

/* ══════════════════════════════════════════════════════════════════════════
   6 · LAS RESPUESTAS: bloques y ayudas para componerlas
   ══════════════════════════════════════════════════════════════════════════ */

export const NATURALEZAS = {
  dato: 'registrado',
  calculo: 'calculado',
  lectura: 'lectura de una regla',
};

export const bTexto = (texto) => ({ tipo: 'texto', texto });
export const bNota = (texto) => ({ tipo: 'nota', texto });
export const bCifra = (etiqueta, valor, naturaleza = 'dato', detalle = null) => ({ tipo: 'cifra', etiqueta, valor, naturaleza, detalle });
export function bLista(items, max = MAX_ITEMS_LISTA) {
  const l = (items || []).filter(Boolean);
  const vistos = l.slice(0, max);
  if (l.length > max) vistos.push(`y ${l.length - max} más`);
  return { tipo: 'lista', items: vistos };
}
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/** El texto plano de una respuesta: lo que lee VoiceOver y lo que miran las pruebas. */
export function textoDeRespuesta(r) {
  if (!r) return '';
  const partes = [];
  for (const b of r.bloques || []) {
    if (b.tipo === 'texto' || b.tipo === 'nota') partes.push(b.texto);
    else if (b.tipo === 'cifra') partes.push(`${b.etiqueta}: ${b.valor}${b.detalle ? ` (${b.detalle})` : ''}`);
    else if (b.tipo === 'lista') partes.push(b.items.join(' · '));
  }
  if (r.fuente) partes.push(r.fuente);
  return partes.join(' ');
}

/* 🚨 Lo que ninguna respuesta puede decir (§8): causas, consejos, predicciones, diagnósticos ni
   juicios. Se comprueba sobre el corpus entero en la suite. Los nombres de las caras de Sueño
   («😫 Fatal», «🙂 Muy bien») son SUS respuestas, no un juicio, y por eso no están. */
export const PALABRAS_PROHIBIDAS_CHAT = [
  'porque', 'debido a', 'gracias a', 'por culpa', 'hace que', 'provoca', 'provocado', 'causa', 'causado', 'deberias', 'deberia',
  'tienes que', 'te recomiendo', 'recomendable', 'te aconsejo', 'dormiras', 'conseguiras', 'llegaras', 'aprobaras', 'vas a',
  'insomnio', 'trastorno', 'enfermedad', 'deficit', 'sano', 'perjudicial', 'peligroso', 'preocupante', 'excelente', 'fenomenal',
  'lo estas haciendo', 'bien hecho', 'enhorabuena', 'felicidades', 'desastre', 'horrible', 'soy una ia', 'inteligencia artificial',
];
export function incumpleHonestidad(texto) {
  const t = ` ${normalizar(texto)} `;
  return PALABRAS_PROHIBIDAS_CHAT.filter((p) => t.includes(` ${p} `));
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · ENTENDER UN TROZO DE MENSAJE
   ══════════════════════════════════════════════════════════════════════════ */

/* El léxico de un asistente: el general + el suyo. Se junta una vez (una caché que no toca el objeto). */
const LEXICOS = new WeakMap();
function lexicoDe(asistente) {
  if (!LEXICOS.has(asistente)) LEXICOS.set(asistente, { ...LEXICO_GENERAL, ...(asistente.lexico || {}) });
  return LEXICOS.get(asistente);
}

function tiposDeEntidad(asistente) {
  return [...new Set((asistente.capacidades || []).map((c) => c.entidad && c.entidad.tipo).filter(Boolean))];
}

function puntuar(capacidad, conceptos, fechas, entidadesHalladas) {
  const necesita = capacidad.necesita || [];
  if (!necesita.every((grupo) => grupo.some((c) => conceptos.has(c)))) return null;
  let puntos = 0;
  for (const [c, peso] of Object.entries(capacidad.senales || {})) if (conceptos.has(c)) puntos += peso;
  const fecha = fechas.find((f) => !f.invalida);
  if (fecha && capacidad.periodo) {
    if (capacidad.periodo === fecha.tipo) puntos += 1;
    else if (capacidad.periodo !== 'ambos') puntos -= 1;
  }
  /* Nombrar algo pesa: +2 si la capacidad no tiene sentido sin ello (el progreso DE un ejercicio), +1 si
     solo lo acota. Así «press de banca» a secas ya es una pregunta por ese ejercicio. */
  const hallada = capacidad.entidad && entidadesHalladas[capacidad.entidad.tipo];
  if (hallada && hallada.estado !== 'ninguna') puntos += capacidad.entidad.obligatoria ? 2 : 1;
  return puntos;
}

/**
 * Lo que dice un trozo de mensaje, sin ejecutar nada.
 * @returns {{ tokens, texto, conceptos, comunes, fechas, entidades, ranking: [{ capacidad, puntos }] }}
 */
export function entender(asistente, tokens, hoy, disponibles = {}) {
  const texto = tokens.join(' ');
  const conceptos = detectarConceptos(tokens, lexicoDe(asistente));
  const comunes = detectarConceptos(tokens, LEXICO_COMUN);
  const fechas = interpretarFechas(texto, hoy, { tiempo: 'pasado' });
  /* Qué índices de token son una fecha (no pueden ser el nombre de nada). */
  const ocupados = new Set();
  if (fechas.length) {
    let pos = 0;
    tokens.forEach((t, i) => {
      const ini = pos;
      const fin = pos + t.length;
      if (fechas.some((f) => ini < f.fin && fin > f.inicio)) ocupados.add(i);
      pos = fin + 1;
    });
  }
  const entidades = {};
  for (const tipo of tiposDeEntidad(asistente)) {
    const lista = disponibles[tipo] || [];
    entidades[tipo] = resolverEntidad(tokens, lista, ocupados);
  }
  const ranking = (asistente.capacidades || [])
    .map((c) => ({ capacidad: c, puntos: puntuar(c, conceptos, fechas, entidades) }))
    .filter((x) => x.puntos !== null)
    .sort((a, b) => b.puntos - a.puntos || (b.capacidad.prioridad || 0) - (a.capacidad.prioridad || 0));
  return { tokens, texto, conceptos, comunes, fechas, entidades, ranking };
}

/* §7.3, paso 4: gana con PUNTOS_MINIMOS y VENTAJA_MINIMA sobre la segunda; un empate exacto lo
   rompe la `prioridad` (la pregunta más habitual del módulo) y, si también empatan, se pregunta. */
function ganadora(e) {
  const [a, b] = e.ranking;
  if (!a || a.puntos < PUNTOS_MINIMOS) return { estado: 'ninguna' };
  if (b && a.puntos - b.puntos < VENTAJA_MINIMA && (a.capacidad.prioridad || 0) === (b.capacidad.prioridad || 0)) {
    return { estado: 'ambigua', opciones: [a.capacidad, b.capacidad] };
  }
  return { estado: 'unica', capacidad: a.capacidad };
}

/* Partir un mensaje en preguntas (§7.4): por conectores, salvo dentro del nombre de algo. */
function trozos(asistente, tokens, hoy, disponibles) {
  const entero = entender(asistente, tokens, hoy, disponibles);
  const protegidos = new Set();
  for (const r of Object.values(entero.entidades)) for (const i of r.tramos || []) protegidos.add(i);
  if (protegidos.size) {
    const idx = [...protegidos].sort((a, b) => a - b);
    for (let i = idx[0]; i <= idx[idx.length - 1]; i += 1) protegidos.add(i);
  }
  const partes = [];
  let actual = [];
  tokens.forEach((t, i) => {
    if (CONECTORES.has(t) && !protegidos.has(i)) {
      if (actual.length) partes.push(actual);
      actual = [];
    } else actual.push(t);
  });
  if (actual.length) partes.push(actual);
  if (partes.length < 2) return { entero, partes: [entero] };
  const entendidas = partes.map((p) => entender(asistente, p, hoy, disponibles));
  const validas = entendidas.filter((e) => ganadora(e).estado === 'unica');
  if (validas.length >= 2) return { entero, partes: entendidas.filter((e) => ganadora(e).estado !== 'ninguna' || e.fechas.length).slice(0, MAX_INTENCIONES) };
  return { entero, partes: [entero] };
}

/* ══════════════════════════════════════════════════════════════════════════
   8 · RESPUESTAS FIJAS (comunes, límites, errores)
   ══════════════════════════════════════════════════════════════════════════ */

const sugerenciasDe = (asistente, n = MAX_OPCIONES) => (asistente.capacidades || [])
  .filter((c) => c.ejemplo).slice(0, n).map((c) => ({ texto: c.ejemplo, mensaje: c.ejemplo }));

function respuestaFija(asistente, tipo, bloques, extra = {}) {
  return { asistente: asistente.id, capacidad: tipo, tipo: extra.tipo || 'charla', bloques, fuente: null, confianza: null, opciones: extra.opciones || [], acciones: extra.acciones || [] };
}

const TEXTOS_LIMITE = {
  causa: 'No puedo decirte por qué pasa algo: con tus registros veo qué pasó y cuándo, no el motivo.',
  consejo: 'No doy consejos ni te digo qué hacer: te enseño lo que dicen tus datos para que decidas tú.',
  diagnostico: 'No puedo valorar si algo es normal o es un problema de salud; eso lo puede mirar un profesional. Lo que sí tengo son tus registros.',
  prediccion: 'No hago predicciones: solo te cuento lo que ya ha pasado según tus registros.',
};

/* ══════════════════════════════════════════════════════════════════════════
   9 · RESPONDER
   ══════════════════════════════════════════════════════════════════════════ */

function periodoParaCapacidad(capacidad, trozo, entero, ctx, hoy) {
  const propias = trozo.fechas.filter((f) => !f.invalida);
  const delMensaje = entero.fechas.filter((f) => !f.invalida);
  const tiempo = capacidad.tiempo || 'pasado';
  const reinterpretar = (lista, texto) => (tiempo === 'futuro' ? interpretarFechas(texto, hoy, { tiempo }).filter((f) => !f.invalida) : lista);
  let elegidas = propias.length ? reinterpretar(propias, trozo.texto) : (delMensaje.length === 1 ? reinterpretar(delMensaje, entero.texto) : []);
  if (elegidas.length) return { periodo: elegidas[0], segundo: elegidas[1] || null, origen: 'mensaje' };
  if (ctx.periodo && heredable(ctx, ctx.periodoTurno) && capacidad.periodo
    && (capacidad.periodo === 'ambos' || capacidad.periodo === ctx.periodo.tipo)
    && (ctx.periodo.tiempo || 'pasado') === tiempo) {
    return { periodo: ctx.periodo, segundo: null, origen: 'contexto' };
  }
  return { periodo: capacidad.porDefecto ? periodoPorDefecto(capacidad.porDefecto, hoy) : null, segundo: null, origen: 'defecto' };
}

function ejecutarCapacidad(asistente, capacidad, args, datos) {
  try {
    const r = capacidad.ejecutar(datos, args) || {};
    return {
      asistente: asistente.id, capacidad: capacidad.id, tipo: 'respuesta',
      bloques: Array.isArray(r.bloques) ? r.bloques : [],
      fuente: r.fuente || null,
      confianza: r.confianza || null,
      opciones: (r.opciones || []).slice(0, MAX_OPCIONES),
      acciones: r.acciones || [],
      sinDatos: !!r.sinDatos,
      /* v3.161.3 — el periodo que la capacidad usó DE VERDAD (p. ej. «tus últimas noches registradas» son
         del 15 al 21), para que la siguiente pregunta lo herede y no conteste sobre otras noches. */
      periodoUsado: r.periodoUsado && r.periodoUsado.desde && r.periodoUsado.hasta ? r.periodoUsado : null,
    };
  } catch (error) {
    registrarErrorAsistente(asistente.id, capacidad.id, error);
    return respuestaFija(asistente, 'error_calculo', [bTexto('No he podido calcularlo. No se ha cambiado nada; prueba a preguntarlo de otra forma.')], { tipo: 'error' });
  }
}

/** Registro técnico de un fallo nuestro (H-14): el asistente, la capacidad y el TIPO de error.
 *  Nunca el mensaje que escribió ni un dato suyo. */
export function registrarErrorAsistente(asistente, capacidad, error) {
  try { console.warn(`[asistente:${asistente}] ${capacidad}: ${(error && error.name) || 'Error'}`); } catch { /* registrar nunca tumba el chat */ }
}

function argumentosPara(asistente, capacidad, trozo, entero, ctx, hoy) {
  const p = periodoParaCapacidad(capacidad, trozo, entero, ctx, hoy);
  const args = { periodo: p.periodo, segundoPeriodo: p.segundo, origenPeriodo: p.origen, hoy, conceptos: trozo.conceptos, tokens: trozo.tokens,
    /* v3.161.3 — el periodo de la pregunta anterior a la última, para «compáralo con lo de antes». */
    periodoAnterior: ctx.periodoAnterior && heredable(ctx, ctx.periodoTurno) ? ctx.periodoAnterior : null };
  if (capacidad.entidad) {
    const tipo = capacidad.entidad.tipo;
    const r = trozo.entidades[tipo]?.estado !== 'ninguna' ? trozo.entidades[tipo] : entero.entidades[tipo];
    if (r && r.estado === 'unica') args.entidad = r.entidad;
    else if (r && r.estado === 'ambigua') args.ambigua = r;
    else if (ctx.entidades[tipo] && heredable(ctx, ctx.entidades[tipo].turno)) {
      /* Una entidad que la capacidad EXIGE se hereda («¿y su récord?»). Una que solo acota, solo si se
         sigue con la misma pregunta o se señala («eso», «esa»): si no, «¿qué notas he sacado?» después
         de hablar de Biología contestaría solo las de Biología sin que él lo haya pedido. */
      const sigue = ctx.ultima && ctx.ultima.capacidad === capacidad.id;
      if (capacidad.entidad.obligatoria || sigue || trozo.comunes.has('referencia')) args.entidad = ctx.entidades[tipo].entidad;
    }
  }
  if (typeof capacidad.argumentos === 'function') Object.assign(args, capacidad.argumentos(trozo, args) || {});
  return args;
}

/**
 * 🐛 D5 — Lo que dice cada botón cuando dos se llaman igual: dos «Lenguaje» daban dos botones iguales,
 * el segundo abría siempre el primero (la opción se reconoce por su texto) y React recibía dos claves
 * repetidas. Se añade el detalle que da el asistente (el área de una asignatura) y, si aun así se
 * repiten, su número.
 */
export function textosDeOpciones(entidades) {
  const lista = Array.isArray(entidades) ? entidades : [];
  const veces = (textos) => textos.reduce((m, t) => m.set(normalizar(t), (m.get(normalizar(t)) || 0) + 1), new Map());
  const porNombre = veces(lista.map((e) => e.nombre));
  const conDetalle = lista.map((e) => (porNombre.get(normalizar(e.nombre)) > 1 && e.detalle ? `${e.nombre} · ${e.detalle}` : e.nombre));
  const repetidos = veces(conDetalle);
  const contados = new Map();
  return conDetalle.map((t) => {
    const k = normalizar(t);
    if (repetidos.get(k) < 2) return t;
    contados.set(k, (contados.get(k) || 0) + 1);
    return `${t} (${contados.get(k)})`;
  });
}
/** El primer nombre que se repite en la lista, o `null`. */
const nombreRepetido = (entidades) => {
  const e = entidades.find((x, i) => entidades.findIndex((y) => normalizar(y.nombre) === normalizar(x.nombre)) !== i);
  return e ? e.nombre : null;
};

function opcionesDeEntidades(entidades, capacidad, periodo) {
  const textos = textosDeOpciones(entidades);
  return entidades.map((e, i) => ({ texto: textos[i], mensaje: textos[i], plan: { capacidad: capacidad.id, entidad: e, periodo } }));
}

function aclaracionDeEntidad(asistente, capacidad, args) {
  const candidatas = args.ambigua.candidatas;
  const opciones = opcionesDeEntidades(candidatas, capacidad, args.periodo);
  const total = args.ambigua.total || opciones.length;
  const bloques = [bTexto(total > opciones.length
    ? `Hay ${total} que encajan. ¿Cuál de estos? (los que más has usado últimamente)`
    : '¿Cuál de estos?')];
  const repetido = nombreRepetido(candidatas);
  if (repetido) bloques.push(bNota(`Hay más de una que se llama «${repetido}»; al lado de cada una te digo cuál es.`));
  return {
    asistente: asistente.id, capacidad: capacidad.id, tipo: 'aclaracion',
    bloques, fuente: null, confianza: null, opciones, acciones: [],
  };
}

function faltaEntidad(asistente, capacidad, args, disponibles) {
  const lista = (disponibles[capacidad.entidad.tipo] || []).slice().sort((a, b) => (b.reciente || 0) - (a.reciente || 0)).slice(0, MAX_OPCIONES);
  const nombre = capacidad.entidad.nombre || 'cuál';
  if (!lista.length) {
    return respuestaFija(asistente, capacidad.id, [bTexto(capacidad.entidad.vacio || `Todavía no tienes ningún ${nombre} con datos.`)], { tipo: 'respuesta' });
  }
  return {
    asistente: asistente.id, capacidad: capacidad.id, tipo: 'aclaracion',
    bloques: [bTexto(`¿De qué ${nombre}?`)], fuente: null, confianza: null, acciones: [],
    opciones: opcionesDeEntidades(lista, capacidad, args.periodo),
  };
}

function ejecutarConArgs(asistente, capacidad, args, datos, sinCargar, disponibles = {}) {
  const faltan = (asistente.lee || []).filter((k) => sinCargar.includes(k));
  if (faltan.length) {
    return respuestaFija(asistente, 'datos_no_cargados', [bTexto(`No he podido leer tus datos de ${asistente.nombre} (no se cargaron), así que no te contesto con ellos para no decirte algo que no es. Prueba a recargar la aplicación.`)], { tipo: 'error' });
  }
  if (capacidad.entidad && capacidad.entidad.obligatoria && !args.entidad) {
    return args.ambigua ? aclaracionDeEntidad(asistente, capacidad, args) : faltaEntidad(asistente, capacidad, args, disponibles);
  }
  if (args.ambigua && !args.entidad && capacidad.entidad) return aclaracionDeEntidad(asistente, capacidad, args);
  const p = args.periodo;
  if (p && (capacidad.tiempo || 'pasado') === 'pasado' && p.desde > args.hoy) {
    return respuestaFija(asistente, 'periodo_futuro', [bTexto(`${p.etiqueta ? p.etiqueta[0].toUpperCase() + p.etiqueta.slice(1) : 'Esa fecha'} todavía no ha llegado, así que no hay nada registrado.`)], { tipo: 'respuesta' });
  }
  if (p && (capacidad.tiempo || 'pasado') === 'pasado' && p.hasta > args.hoy) {
    args.periodo = { ...p, hasta: args.hoy, recortado: true };
  }
  return ejecutarCapacidad(asistente, capacidad, args, datos);
}

/* Una capacidad de UN día con un rango de varios días (H-25): «¿y la semana pasada?» después de «¿cuánto
   dormí ayer?» contestaba la noche del lunes —el primer día del rango— sin decirlo. Si el asistente declara
   la hermana que trabaja con rangos (`siRango`), se pasa a ella; si no, se pregunta qué día, con los días
   del rango que se pueden mirar (hasta hoy si es pasado, desde hoy si es futuro). Con un solo día posible
   («esta semana» un lunes) se contesta ese día, que no hay nada que preguntar. */
function capacidadParaPeriodo(asistente, capacidad, args) {
  const p = args.periodo;
  if (!p || capacidad.periodo !== 'dia' || !p.desde || !p.hasta || p.desde === p.hasta) return { capacidad, args };
  const hermana = capacidad.siRango ? (asistente.capacidades || []).find((c) => c.id === capacidad.siRango) : null;
  if (hermana) return { capacidad: hermana, args };
  const futuro = (capacidad.tiempo || 'pasado') === 'futuro';
  const todos = fechasDelRango(p.desde, p.hasta, 400);
  const posibles = futuro ? todos.filter((f) => f >= args.hoy) : todos.filter((f) => f <= args.hoy);
  if (!posibles.length) return { capacidad, args };
  const diaComo = (f) => ({ desde: f, hasta: f, tipo: 'dia', etiqueta: etiquetaDeDia(f, args.hoy) });
  if (posibles.length === 1) return { capacidad, args: { ...args, periodo: diaComo(posibles[0]) } };
  const elegidos = futuro ? posibles.slice(0, MAX_OPCIONES) : posibles.slice(-MAX_OPCIONES);
  const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  return {
    capacidad,
    aclaracion: {
      asistente: asistente.id, capacidad: capacidad.id, tipo: 'aclaracion',
      bloques: [bTexto(`Eso lo miro día a día. ¿Qué día de ${p.etiqueta || 'ese periodo'}?`)],
      fuente: null, confianza: null, acciones: [],
      opciones: elegidos.map((f) => ({ texto: mayus(etiquetaDeDia(f, args.hoy)), mensaje: mayus(etiquetaDeDia(f, args.hoy)), plan: { capacidad: capacidad.id, entidad: args.entidad || null, periodo: diaComo(f) } })),
    },
  };
}

/** Las fechas válidas de un trozo, sin repetir el mismo periodo («hoy y hoy» es una). */
function fechasDistintas(trozo) {
  const vistas = new Set();
  return (trozo.fechas || []).filter((f) => {
    if (f.invalida) return false;
    const k = `${f.desde}|${f.hasta}`;
    if (vistas.has(k)) return false;
    vistas.add(k);
    return true;
  });
}

function opcionDePendiente(pendiente, tokens) {
  if (!pendiente || !Array.isArray(pendiente.opciones)) return null;
  const texto = tokens.filter((t) => t !== '¦').join(' ');
  const directa = pendiente.opciones.find((o) => normalizar(o.texto) === texto || normalizar(o.mensaje) === texto);
  if (directa) return directa;
  for (const [n, formas] of Object.entries(ORDINALES)) {
    if (formas.includes(texto) && pendiente.opciones[Number(n) - 1]) return pendiente.opciones[Number(n) - 1];
  }
  return null;
}

/**
 * La puerta del núcleo: un mensaje → respuestas + contexto nuevo.
 *
 * @param {object} asistente  su registro (`asistente*.js`)
 * @param {string} mensaje    lo que escribió (o el texto de un botón que tocó)
 * @param {object} op
 * @param {object} op.datos       SOLO sus claves (`datosParaAsistente`)
 * @param {string} op.hoy         'YYYY-MM-DD' local (`useHoyISO()` en la aplicación)
 * @param {object} [op.contexto]  la conversación (`nuevaConversacion()`)
 * @param {string[]} [op.sinCargar] claves que no se pudieron cargar (`clavesSinCargar()`)
 * @param {Array} [op.ajenos]     otros módulos: nombres y palabras, ni un dato (`DOMINIOS_AJENOS`)
 * @param {number} [op.ahora]
 * @param {{origen: string, indice: number}} [op.opcion]  el botón de aclaración que se tocó: la respuesta
 *        que lo creó (`origen`) y su posición. Solo vale si esa aclaración sigue siendo la pendiente.
 */
export function responderMensaje(asistente, mensaje, { datos = {}, hoy, contexto = null, sinCargar = [], ajenos = [], ahora = Date.now(), opcion = null } = {}) {
  const ctx0 = contextoVigente(contexto, ahora);
  const ctx = { ...ctx0, turno: (ctx0.turno || 0) + 1, actualizado: ahora, entidades: { ...(ctx0.entidades || {}) } };
  const { tokens } = normalizarMensaje(mensaje);
  if (!tokens.filter((t) => t !== '¦').length) {
    /* Un mensaje vacío de verdad no se contesta (la caja ni lo envía). 🐛 D10 — pero «???» sí llegaba, la
       caja se vaciaba y no aparecía nada. Ahora se dice, y la aclaración pendiente sigue viva. */
    if (!String(mensaje ?? '').trim()) return { respuestas: [], contexto: ctx0 };
    const sinPalabras = respuestaFija(asistente, 'sin_palabras', [bTexto('No he visto ninguna palabra en tu mensaje. Escríbeme la pregunta con palabras, por ejemplo:')], { opciones: sugerenciasDe(asistente, 3) });
    sinPalabras.id = `${ctx.turno}-0`;
    return { respuestas: [sinPalabras], contexto: { ...ctx, pendiente: ctx0.pendiente || null } };
  }

  /* Las entidades del asistente (sus ejercicios, asignaturas, hábitos…) se calculan UNA vez por
     mensaje, de sus datos, y viajan como parámetro: el registro del asistente no se toca. */
  const disponibles = typeof asistente.entidades === 'function' ? safe(() => asistente.entidades(datos, hoy) || {}, {}) : {};

  const respuestas = [];
  const terminar = () => {
    respuestas.forEach((r, i) => {
      r.id = `${ctx.turno}-${i}`;
      /* 🐛 v3.161.2 — cada opción de una aclaración lleva la respuesta que la creó (`origen`): así un botón
         de una pregunta anterior no se puede leer como si contestara a la de ahora. */
      if (r.tipo === 'aclaracion') r.opciones = r.opciones.map((o) => ({ ...o, origen: r.id }));
    });
    const ultimaAclaracion = [...respuestas].reverse().find((r) => r.tipo === 'aclaracion' && r.opciones.length);
    ctx.pendiente = ultimaAclaracion ? { id: ultimaAclaracion.id, opciones: ultimaAclaracion.opciones } : null;
    return { respuestas, contexto: ctx };
  };

  /* 🐛 v3.161.2 — un botón de aclaración que ya no es el pendiente (se hizo otra pregunta después, se
     contestó ya o la conversación caducó) NO se ejecuta: antes se mandaba su texto («Martes», un nombre)
     y se interpretaba con el contexto de AHORA. Se dice, y la aclaración de ahora sigue viva. */
  if (opcion && opcion.origen) {
    const pend = ctx0.pendiente;
    const vigente = pend && pend.id === opcion.origen && Array.isArray(pend.opciones) && pend.opciones[opcion.indice];
    if (!vigente) {
      const caducada = respuestaFija(asistente, 'opcion_caducada', [bTexto('Ese botón era de una pregunta anterior y ya no vale. Pregúntamelo otra vez y te contesto con lo de ahora, por ejemplo:')], { opciones: sugerenciasDe(asistente, 3) });
      caducada.id = `${ctx.turno}-0`;
      return { respuestas: [caducada], contexto: { ...ctx, pendiente: ctx0.pendiente || null } };
    }
  }

  /* 1 · Una aclaración pendiente que se contesta (un botón, «la primera», el nombre). */
  const elegida = opcion && opcion.origen ? ctx0.pendiente.opciones[opcion.indice] : opcionDePendiente(ctx0.pendiente, tokens);
  if (elegida && elegida.plan) {
    const capacidad = (asistente.capacidades || []).find((c) => c.id === elegida.plan.capacidad);
    if (capacidad) {
      const args = { periodo: elegida.plan.periodo || (capacidad.porDefecto ? periodoPorDefecto(capacidad.porDefecto, hoy) : null), hoy, conceptos: new Map(), tokens, entidad: elegida.plan.entidad || null, ...(elegida.plan.args || {}) };
      /* 🐛 D1 — la opción elegida trae el periodo de la pregunta («esta semana»), y aquí se ejecutaba sin
         pasar por `capacidadParaPeriodo`: una capacidad de un día contestaba el lunes («No tienes nada
         registrado el lunes») aunque hubiera datos el martes. Ahora pasa por la misma regla que el resto. */
      const ajuste = capacidadParaPeriodo(asistente, capacidad, args);
      if (ajuste.aclaracion) {
        respuestas.push(ajuste.aclaracion);
        recordar(ctx, ajuste.capacidad, { periodo: null });
        return terminar();
      }
      const r = ejecutarConArgs(asistente, ajuste.capacidad, ajuste.args, datos, sinCargar, disponibles);
      respuestas.push(r);
      recordar(ctx, ajuste.capacidad, ajuste.args, r);
      return terminar();
    }
  }
  if (elegida && !elegida.plan && elegida.mensaje && normalizar(elegida.mensaje) !== tokens.join(' ')) {
    return responderMensaje(asistente, elegida.mensaje, { datos, hoy, contexto: { ...ctx0, pendiente: null }, sinCargar, ajenos, ahora });
  }

  const { entero, partes } = trozos(asistente, tokens, hoy, disponibles);

  /* Contestar una capacidad en un trozo. 🐛 D2 — «¿cuánto dormí el lunes y el martes?» contestaba solo el
     lunes sin decirlo: con varias fechas en la misma pregunta, cada una se contesta por separado (hasta
     MAX_INTENCIONES, y se dice si sobran). Las que comparan dos periodos (`dosPeriodos`) las usan juntas. */
  const contestarUno = (capacidad, trozo) => {
    const ajuste = capacidadParaPeriodo(asistente, capacidad, argumentosPara(asistente, capacidad, trozo, entero, ctx, hoy));
    if (ajuste.aclaracion) { recordar(ctx, ajuste.capacidad, { periodo: null }); return ajuste.aclaracion; }
    const r = ejecutarConArgs(asistente, ajuste.capacidad, ajuste.args, datos, sinCargar, disponibles);
    if (r.tipo === 'respuesta' || r.tipo === 'aclaracion') recordar(ctx, ajuste.capacidad, ajuste.args, r);
    return r;
  };
  const contestar = (capacidad, trozo) => {
    const fechas = fechasDistintas(trozo);
    if (fechas.length < 2 || !capacidad.periodo || capacidad.dosPeriodos) return [contestarUno(capacidad, trozo)];
    const salida = fechas.slice(0, MAX_INTENCIONES).map((f) => contestarUno(capacidad, { ...trozo, fechas: [f], texto: f.texto }));
    if (fechas.length > MAX_INTENCIONES) {
      salida.push(respuestaFija(asistente, 'demasiadas_fechas', [bNota(`Has nombrado ${fechas.length} fechas y te he contestado las ${MAX_INTENCIONES} primeras. Pregúntame las demás aparte.`)]));
    }
    return salida;
  };

  /* 2 · Lo que manda antes que nada: escribir, lo que no se registra y los límites. */
  if (entero.comunes.has('escritura') && esOrdenDeEscritura(entero.tokens)) {
    respuestas.push(respuestaFija(asistente, 'escritura', [bTexto(`Desde aquí no puedo apuntar, cambiar ni borrar nada: solo consultar tus datos de ${asistente.nombre}. Eso se hace en la pantalla de ${asistente.nombre}, que tienes debajo.`)]));
    return terminar();
  }
  if (entero.comunes.has('no_registrado')) {
    respuestas.push(respuestaFija(asistente, 'no_registrado', [bTexto('Eso JosStyle no lo registra, así que no puedo saberlo.'), bNota('Lo que sí puedo contarte:')], { opciones: sugerenciasDe(asistente, 3) }));
    return terminar();
  }
  const gEntero = ganadora(entero);
  /* v3.161.3 — «¿por qué no puedes calcular una media fiable?» no pregunta la causa de algo de su vida:
     pregunta por qué el asistente no puede; la capacidad que lo explica declara `cubreCausa`. */
  const causaCubierta = gEntero.estado === 'unica' && !!gEntero.capacidad.cubreCausa;
  const limite = ['causa', 'consejo', 'diagnostico', 'prediccion']
    .find((k) => entero.comunes.has(k) && !(k === 'consejo' && consejoCubierto(entero.tokens, gEntero)) && !(k === 'causa' && causaCubierta));
  if (limite) {
    const fija = respuestaFija(asistente, 'limite', [bTexto(TEXTOS_LIMITE[limite])], { tipo: 'limite' });
    respuestas.push(fija);
    /* 7b · la premisa se contrasta con el dato (H-08): si además pregunta algo que sé, lo contesto. */
    const g = gEntero;
    if (g.estado === 'unica' && limite !== 'prediccion') {
      const contestadas = contestar(g.capacidad, entero).filter((r) => r.tipo === 'respuesta');
      if (contestadas.length) contestadas[0].bloques = [bNota('Lo que sí dicen tus registros:'), ...contestadas[0].bloques];
      respuestas.push(...contestadas);
    } else if (g.estado !== 'unica') {
      fija.opciones = sugerenciasDe(asistente, 3);
    }
    return terminar();
  }

  /* 3 · Cada pregunta del mensaje. */
  for (const trozo of partes) {
    const g = ganadora(trozo);
    if (g.estado === 'ambigua') {
      respuestas.push({
        asistente: asistente.id, capacidad: 'intencion_ambigua', tipo: 'aclaracion',
        bloques: [bTexto(`¿Qué quieres saber: ${g.opciones.map((c) => c.titulo.toLowerCase()).join(' o ')}?`)],
        fuente: null, confianza: null, acciones: [],
        opciones: g.opciones.map((c) => ({ texto: c.titulo, mensaje: c.titulo, plan: { capacidad: c.id, entidad: null, periodo: periodoParaCapacidad(c, trozo, entero, ctx, hoy).periodo } })),
      });
      continue;
    }
    let capacidad = g.estado === 'unica' ? g.capacidad : null;
    /* Lo de otro módulo va ANTES que la elipsis: «¿cuánto gasté este mes?» trae una fecha, pero no es
       «¿y este mes?» de lo anterior. */
    const nombraAlgoSuyo = Object.values(trozo.entidades).some((r) => r.estado !== 'ninguna');
    if (!capacidad && !nombraAlgoSuyo && buscarAjeno(trozo.tokens, ajenos, asistente.modulo)) {
      respuestas.push(sinCapacidad(asistente, trozo, ajenos, ctx0));
      continue;
    }
    /* Elipsis y corrección (§7.6): sin pregunta propia pero con fecha o con algo nombrado. */
    const tieneFecha = trozo.fechas.length > 0;
    const tieneEntidad = Object.values(trozo.entidades).some((r) => r.estado !== 'ninguna');
    if (!capacidad && ctx0.ultima && heredable(ctx0, ctx0.ultima.turno) && (tieneFecha || tieneEntidad)) {
      capacidad = (asistente.capacidades || []).find((c) => c.id === ctx0.ultima.capacidad) || null;
    }
    if (!capacidad) {
      if (partes.length > 1) continue;
      respuestas.push(sinCapacidad(asistente, trozo, ajenos, ctx0));
      continue;
    }
    const invalida = trozo.fechas.find((f) => f.invalida);
    if (invalida && !trozo.fechas.some((f) => !f.invalida)) {
      respuestas.push(respuestaFija(asistente, 'fecha_invalida', [bTexto(`«${invalida.texto}» no es una fecha que exista, así que no la busco. Prueba con otra.`)], { tipo: 'respuesta' }));
      continue;
    }
    respuestas.push(...contestar(capacidad, trozo));
  }
  if (!respuestas.length) respuestas.push(sinCapacidad(asistente, entero, ajenos, ctx0));
  return terminar();
}

/* ══════════════════════════════════════════════════════════════════════════
   10 · LA CONVERSACIÓN (lo que guarda la hoja en memoria)
   ══════════════════════════════════════════════════════════════════════════ */

/** Una conversación vacía de un usuario: el contexto del núcleo y los mensajes que se ven. */
export const conversacionVacia = (usuario = null) => ({ usuario, contexto: nuevaConversacion(usuario), mensajes: [] });

/**
 * Un mensaje más en una conversación (v3.161.3): lo usan la hoja al escribir o tocar un botón, y el
 * botón «Analizar mi sueño», que abre la hoja con su primera pregunta ya hecha. Pura: devuelve la
 * conversación nueva y no guarda nada. Una conversación de otro usuario no se continúa (H-01).
 */
export function conversarCon(asistente, conversacion, texto, { usuario = null, datos = {}, hoy, sinCargar = [], ajenos = [], opcion = null, ahora } = {}) {
  const conv = conversacion && conversacion.usuario === usuario ? conversacion : conversacionVacia(usuario);
  const t = String(texto ?? '').trim().slice(0, MAX_MENSAJE);
  if (!t) return conv;
  const { respuestas, contexto } = responderMensaje(asistente, t, { datos, hoy, contexto: conv.contexto, sinCargar, ajenos, opcion, ...(ahora !== undefined ? { ahora } : {}) });
  if (!respuestas.length) return conv;
  const turno = contexto.turno;
  return {
    ...conv,
    contexto,
    mensajes: [
      ...conv.mensajes,
      { id: `yo-${turno}`, rol: 'yo', texto: t },
      ...respuestas.map((r) => ({ id: `as-${r.id}`, rol: 'asistente', respuesta: r })),
    ].slice(-MAX_MENSAJES_CONVERSACION),
  };
}

function safe(fn, alternativa) {
  try { return fn(); } catch (e) { registrarErrorAsistente('nucleo', 'entidades', e); return alternativa; }
}

function recordar(ctx, capacidad, args, respuesta = null) {
  ctx.ultima = { capacidad: capacidad.id, turno: ctx.turno };
  const periodo = respuesta && respuesta.periodoUsado ? respuesta.periodoUsado : args.periodo;
  if (periodo && !periodo.porDefecto) {
    /* v3.161.3 — el periodo de antes se guarda para «compáralo con lo de antes» (solo si cambia). */
    if (ctx.periodo && (ctx.periodo.desde !== periodo.desde || ctx.periodo.hasta !== periodo.hasta)) {
      ctx.periodoAnterior = ctx.periodo;
    }
    ctx.periodo = { ...periodo, tiempo: capacidad.tiempo || 'pasado' };
    ctx.periodoTurno = ctx.turno;
  }
  if (capacidad.entidad && args.entidad) ctx.entidades[capacidad.entidad.tipo] = { entidad: args.entidad, turno: ctx.turno };
}

function sinCapacidad(asistente, trozo, ajenos, ctx0) {
  const c = trozo.comunes;
  if (c.has('identidad')) {
    return respuestaFija(asistente, 'identidad', [bTexto(`No soy una IA. Soy el asistente de ${asistente.nombre} de JosStyle: entiendo tus preguntas con reglas y te contesto con tus propios datos de ${asistente.nombre}, sin enviarlos a ningún sitio y sin guardar la conversación.`)], { opciones: sugerenciasDe(asistente, 3) });
  }
  if (c.has('ayuda')) {
    return respuestaFija(asistente, 'ayuda', [
      bTexto(`Puedo contestarte sobre tus datos de ${asistente.nombre}:`),
      bLista((asistente.capacidades || []).map((x) => x.titulo), 10),
      bNota('Pregúntamelo con tus palabras; si no lo entiendo, te lo digo. Desde aquí no puedo apuntar ni cambiar nada.'),
    ], { opciones: sugerenciasDe(asistente) });
  }
  /* Otro módulo (§6.3): se nombra, y si tiene asistente se ofrece abrirlo. Ni un dato suyo. */
  const ajeno = buscarAjeno(trozo.tokens, ajenos, asistente.modulo);
  if (ajeno) {
    return respuestaFija(asistente, 'fuera_de_dominio', [bTexto(`Eso es de ${ajeno.nombre}. Aquí solo veo tus datos de ${asistente.nombre}${ajeno.asistente ? `; el asistente de ${ajeno.nombre} sí puede contestártelo.` : `, y ${ajeno.nombre} todavía no tiene asistente.`}`)],
      { acciones: ajeno.asistente ? [{ tipo: 'navegar', destino: ajeno.modulo, texto: `Abrir ${ajeno.nombre}` }] : [] });
  }
  if (c.has('saludo')) return respuestaFija(asistente, 'saludo', [bTexto(asistente.saludo || `¡Hola! Pregúntame lo que quieras sobre tus datos de ${asistente.nombre}.`)], { opciones: sugerenciasDe(asistente) });
  if (c.has('gracias')) return respuestaFija(asistente, 'gracias', [bTexto('De nada. Si quieres saber algo más, pregúntamelo.')]);
  if (c.has('despedida')) return respuestaFija(asistente, 'despedida', [bTexto('Hasta luego. La conversación se queda aquí mientras no recargues la aplicación.')]);
  const fecha = trozo.fechas.find((f) => !f.invalida);
  const bloques = [bTexto('No lo he entendido.')];
  if (fecha) bloques.push(bNota(`He visto una fecha (${fecha.etiqueta}), pero no sé qué quieres saber de ella.`));
  bloques.push(bNota('Puedo contestarte cosas como estas:'));
  return respuestaFija(asistente, 'no_entendido', bloques, { tipo: 'error', opciones: sugerenciasDe(asistente) });
}

function buscarAjeno(tokens, ajenos, propio) {
  for (const a of ajenos || []) {
    if (!a || a.modulo === propio) continue;
    const h = detectarConceptos(tokens, { [a.modulo]: a.palabras || [] });
    if (h.size) return a;
  }
  return null;
}
