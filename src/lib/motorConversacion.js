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
import { interpretarFechas, periodoPorDefecto, fechasDelRango, etiquetaDeDia, etiquetaDeRango, periodoPrevio, unidadDePeriodo, diasDelRango } from './fechasConversacion';

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

/* Fase 2.1 (A7) — erratas de FECHA que se corrigen solas. Solo las que no pueden ser otra palabra: una
   lista cerrada, escrita a mano, y nunca una distancia de erratas (con ella «mes» y «mas», o «martes» y
   «partes», serían lo mismo). Lo que se parece a una fecha y no está aquí no se adivina: se avisa
   (`palabrasParecidasAFecha`). */
export const ERRATAS_FECHA = Object.freeze({
  hoi: 'hoy', ayr: 'ayer', ayerr: 'ayer', ayeer: 'ayer', ahyer: 'ayer', aier: 'ayer',
  antayer: 'anteayer', anteyer: 'anteayer', antesayer: 'anteayer', anterayer: 'anteayer',
  mnana: 'manana', mananna: 'manana', semna: 'semana', smana: 'semana', semanna: 'semana',
  psada: 'pasada', pasda: 'pasada', psado: 'pasado', pasdo: 'pasado',
  lnes: 'lunes', marts: 'martes', miercols: 'miercoles', miercoels: 'miercoles', jeves: 'jueves', juevs: 'jueves',
  vierns: 'viernes', sabdo: 'sabado', domigo: 'domingo', domngo: 'domingo',
});

/* Las palabras de fecha con las que se compara una que se les parece (`palabrasParecidasAFecha`). «hoy»,
   «mes» y «año» no: son tan cortas que cualquier errata es otra palabra («hay», «mas»). Y las que se parecen
   a una de ellas sin ser una errata («semanas», «manzana», «vienes») no cuentan. */
const PALABRAS_DE_FECHA = ['ayer', 'anteayer', 'anoche', 'manana', 'semana', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const NO_SON_FECHA = new Set(['semanas', 'semanal', 'mananas', 'manzana', 'partes', 'vienes', 'lunas', 'sabados', 'domingos']);

/* Una palabra suelta: si es una errata de fecha de la lista, la fecha; si no, la misma palabra. Se aplica
   palabra a palabra al normalizar, ANTES de leer fechas, así que «ayr» se entiende como «ayer» en todas
   partes —y la respuesta dice siempre la fecha que ha usado—. */
function corregirFecha(t) {
  if (!t || t === '¦') return t;
  return Object.prototype.hasOwnProperty.call(ERRATAS_FECHA, t) ? ERRATAS_FECHA[t] : t;
}

/* Fase 2.1 (A7) — palabras que se PARECEN a una fecha (una errata de margen) y no se han leído como fecha ni
   como ninguna otra cosa del mensaje: «¿cuánto dormí ayet?». No se corrigen —podrían ser otra palabra—: quien
   pregunta las recibe para decir sobre qué periodo contesta en vez de hacerlo en silencio sobre hoy. */
export function palabrasParecidasAFecha(tokens, consumidos = new Set()) {
  const dudosas = [];
  (tokens || []).forEach((t, i) => {
    if (!t || t === '¦' || consumidos.has(i) || t.length < 4 || /\d/.test(t)) return;
    if (PALABRAS_DE_FECHA.includes(t) || NO_SON_FECHA.has(t)) return;
    if (PALABRAS_DE_FECHA.some((p) => distanciaErratas(t, p, 2) <= Math.max(1, margenDeErratas(p)))) dudosas.push(t);
  });
  return dudosas;
}
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
    .flatMap((t) => (Object.prototype.hasOwnProperty.call(ABREVIATURAS, t) ? ABREVIATURAS[t].split(' ') : [t]))
    .map(corregirFecha);
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
/* Fase 2.1 (A9) — dos candidatas que casan con LAS MISMAS palabras del mensaje: lo dicho encaja igual con las dos. */
const mismasPalabras = (a, b) => a.tramos.length === b.tramos.length && a.tramos.every((i) => b.tramos.includes(i));


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
      let propia = false;
      for (const p of piezas) {
        const pieza = { t: p, raiz: normalizarRaiz(p), prefijo: false, exacta: false };
        const idx = libres.findIndex((t, i) => t && !usados.has(i) && (coincide(t, raices[i], pieza)
          || (t.length >= 3 && p.length >= t.length + 2 && p.startsWith(t))));
        if (idx >= 0) {
          usados.add(idx); casadas += 1;
          if (p.length >= 4) distintiva = true;
          /* Fase 2.1 (A9) — casada con la palabra entera (no por ser el principio de otra más larga). */
          if (p.length >= 4 && coincide(libres[idx], raices[idx], pieza)) propia = true;
        }
      }
      if (!casadas || (!distintiva && casadas < piezas.length)) continue;
      const v = { cobertura: casadas / piezas.length, casadas, sobran: piezas.length - casadas, tramos: [...usados], exacta: casadas === piezas.length && usados.size === piezas.length, propia };
      if (!mejor || v.cobertura > mejor.cobertura || (v.cobertura === mejor.cobertura && v.sobran < mejor.sobran)
        || (v.cobertura === mejor.cobertura && v.sobran === mejor.sobran && v.casadas > mejor.casadas)) mejor = v;
    }
    if (mejor) puntuadas.push({ e, ...mejor });
  }
  if (!puntuadas.length) return { estado: 'ninguna', candidatas: [], tramos: [] };
  puntuadas.sort((a, b) => b.cobertura - a.cobertura || b.casadas - a.casadas || a.sobran - b.sobran || (b.e.reciente || 0) - (a.e.reciente || 0) || a.e.nombre.localeCompare(b.e.nombre));
  const [p1, p2] = puntuadas;
  /* 🐛 Fase 2.1 (A9) — con «leer», «Leer la Biblia» (la mitad de su nombre) ganaba a «Leer 30 minutos» (un
     tercio) solo por tener el nombre más corto. Si casan con las MISMAS palabras, ninguna es mejor: se pregunta. */
  const iguales = p2 && p1.cobertura < 1 ? puntuadas.filter((x) => mismasPalabras(x, p1)) : [];
  if (iguales.length > 1) {
    const orden = iguales.sort((a, b) => (b.e.reciente || 0) - (a.e.reciente || 0) || a.e.nombre.localeCompare(b.e.nombre));
    return { estado: 'ambigua', candidatas: orden.slice(0, MAX_OPCIONES).map((x) => x.e), tramos: p1.tramos, total: orden.length };
  }
  const empata = (x) => x && x.cobertura === p1.cobertura && x.casadas === p1.casadas && x.sobran === p1.sobran;
  const unica = p1.cobertura === 1 ? !empata(p2) : (!empata(p2) && p1.cobertura >= 0.5 && (!p2 || p2.cobertura < p1.cobertura));
  if (unica) return { estado: 'unica', entidad: p1.e, candidatas: [p1.e], tramos: p1.tramos };
  /* Fase 2.1 (A9) — una sola que encaja: si lo que la nombra es una palabra entera de su nombre, es ella;
     si no (solo el principio de una palabra), se pregunta «¿Te refieres a…?» con esa sola opción. */
  if (puntuadas.length === 1 && p1.propia) return { estado: 'unica', entidad: p1.e, candidatas: [p1.e], tramos: p1.tramos };
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

/** Fase 2.3 · B0 — las aclaraciones con botones que siguen vivas (las de un contexto anterior a B0 solo
 *  guardaban una: `id` + `opciones`). */
const MAX_ACLARACIONES_VIVAS = MAX_INTENCIONES;
function aclaracionesVivas(pendiente) {
  if (!pendiente) return [];
  if (Array.isArray(pendiente.aclaraciones)) return pendiente.aclaraciones.filter((a) => a && a.id && Array.isArray(a.opciones));
  return pendiente.id && Array.isArray(pendiente.opciones) ? [{ id: pendiente.id, opciones: pendiente.opciones }] : [];
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
  /* Fase 2.2 (P2) — «la anterior», «el pasado», «la de antes»: una referencia a lo último que se contestó. */
  const anterior = referenciaAnterior(tokens, ocupados);
  /* Fase 2.1 (A2, A7) — lo que ya es algo (un concepto, uno común, una fecha, una entidad hallada o esa
     referencia) no puede ser ni una mención desconocida ni una fecha mal escrita. */
  const consumidos = indicesConsumidos(conceptos, comunes, ocupados);
  for (const r of Object.values(entidades)) for (const i of r.tramos || []) consumidos.add(i);
  if (anterior) for (const i of anterior.indices) consumidos.add(i);
  const mencion = mencionSinResolver(tokens, consumidos);
  const ranking = (asistente.capacidades || [])
    .map((c) => ({ capacidad: c, puntos: puntuar(c, conceptos, fechas, entidades) }))
    .filter((x) => x.puntos !== null)
    .sort((a, b) => b.puntos - a.puntos || (b.capacidad.prioridad || 0) - (a.capacidad.prioridad || 0));
  return { tokens, texto, conceptos, comunes, fechas, entidades, ranking, anterior, consumidos, mencion };
}
/* Fase 2.2 (P2) — «¿y la anterior?», «¿y el pasado?», «¿y la de antes?»: una referencia a la ÚLTIMA pregunta
   contestada, con su misma intención. 🚨 Decisión de Josué: es el periodo ANTERIOR DEL
   CALENDARIO (`periodoPrevio`), no el registro anterior que exista, y la respuesta dice sus fechas. Lo que
   forma parte de una fecha («la semana pasada», «el lunes pasado», «pasado mañana») ya lo lee
   `interpretarFechas` y no cuenta aquí. «Lo de antes» tampoco: es la comparación de Sueño (v3.161.3). */
const ARTICULO_DE_REFERENCIA = new Set(['la', 'el']);
export function referenciaAnterior(tokens, ocupados = new Set()) {
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (ocupados.has(i)) continue;
    if (t === 'anterior' || t === 'previa' || t === 'previo') return { indices: [i], texto: t };
    if ((t === 'pasada' || t === 'pasado') && i > 0 && ARTICULO_DE_REFERENCIA.has(tokens[i - 1]) && !ocupados.has(i - 1)) {
      return { indices: [i - 1, i], texto: `${tokens[i - 1]} ${t}` };
    }
    if (t === 'antes' && i > 1 && tokens[i - 1] === 'de' && ARTICULO_DE_REFERENCIA.has(tokens[i - 2])) {
      return { indices: [i - 2, i - 1, i], texto: `${tokens[i - 2]} de antes` };
    }
  }
  return null;
}

/* Dónde empieza el token i en el texto (los tokens se unen con un espacio): para que una fecha
   sobreentendida ocupe su sitio en el orden del mensaje. */
const posicionDe = (tokens, i) => tokens.slice(0, i).reduce((n, t) => n + t.length + 1, 0);

/** Una fecha calculada (no escrita) con la forma de las de `interpretarFechas`. `fija`: no se reinterpreta. */
function fechaCalculada(p, hoy, extra = {}) {
  return { desde: p.desde, hasta: p.hasta, tipo: p.tipo, etiqueta: p.etiqueta, unidad: p.unidad, futura: p.hasta > hoy, fija: true, texto: extra.texto || 'anterior', inicio: extra.inicio ?? -1, fin: extra.fin ?? -1 };
}

/* P3 — una unidad sobreentendida DENTRO del mensaje: «este mes y el pasado», «esta semana con la pasada»,
   «la semana pasada y la anterior». Con UNA fecha al lado, se completa con su unidad (el periodo anterior al
   de esa fecha). Con varias, no se adivina cuál: queda marcada como dudosa y se pregunta. */
function completarSobreentendida(e, hermanas, hoy) {
  if (!e.anterior) return e;
  const validas = (hermanas || []).filter((f) => !f.invalida && !f.fija);
  if (!validas.length) return e;
  if (validas.length > 1) return { ...e, anteriorDudosa: validas };
  const previo = periodoPrevio(validas[0], hoy);
  if (!previo) return e;
  const inicio = posicionDe(e.tokens, e.anterior.indices[0]);
  const fecha = fechaCalculada(previo, hoy, { texto: e.anterior.texto, inicio, fin: inicio + e.anterior.texto.length });
  return { ...e, anterior: null, fechas: [...e.fechas, fecha].sort((a, b) => a.inicio - b.inicio) };
}

/* P2 — «la semana anterior», «el mes anterior», «el año anterior»: `interpretarFechas` las lee como la
   semana (mes, año) pasada DEL CALENDARIO. 🚨 Decisión de Josué: con una fecha de esa unidad delante en el
   mismo mensaje, o hablando ya de un periodo de esa unidad, es la anterior A ESA; sin nada, la del calendario
   (como hasta ahora). */
const UNIDAD_DE_ANTERIOR = [[/\bsemana anterior\b/, 'semana'], [/\bmes anterior\b/, 'mes'], [/\bano anterior\b/, 'ano']];
function relativizarAnteriores(e, entero, item, hoy, par = null) {
  /* 🐛 Fase 2.3 · B0 — «¿y la semana anterior?» justo después de comparar dos semanas (y lo mismo con meses o
     años): es «¿y la anterior?» de esa comparación, así que pasa por la misma regla (desplazar los dos) en
     vez de leerse como la semana pasada del calendario, que repetía la comparación. Solo si es la única
     fecha del mensaje y no hay otra de esa unidad delante. */
  const validas = e.fechas.filter((f) => !f.invalida);
  if (par && validas.length === 1 && !validas[0].fija) {
    const f = validas[0];
    const regla = UNIDAD_DE_ANTERIOR.find(([re]) => re.test(f.texto || ''));
    if (regla && unidadDePeriodo(par.periodo, hoy) === regla[1] && unidadDePeriodo(par.segundo, hoy) === regla[1]) {
      return { ...e, fechas: e.fechas.filter((x) => x !== f), anterior: { indices: [], texto: f.texto } };
    }
  }
  let cambio = false;
  const fechas = e.fechas.map((f) => {
    if (f.invalida || f.fija) return f;
    const regla = UNIDAD_DE_ANTERIOR.find(([re]) => re.test(f.texto || ''));
    if (!regla) return f;
    const unidad = regla[1];
    const delante = (entero.fechas || []).filter((x) => !x.invalida && x.inicio < f.inicio && x !== f && unidadDePeriodo(x, hoy) === unidad);
    const base = delante.length ? delante[delante.length - 1] : (item && item.periodo && unidadDePeriodo(item.periodo, hoy) === unidad ? item.periodo : null);
    if (!base) return f;
    const previo = periodoPrevio(base, hoy);
    if (!previo) return f;
    cambio = true;
    return fechaCalculada(previo, hoy, { texto: f.texto, inicio: f.inicio, fin: f.fin });
  });
  return cambio ? { ...e, fechas } : e;
}

/** Los índices de token que ya son algo: un concepto del léxico, uno común o una fecha. */
function indicesConsumidos(conceptos, comunes, ocupados) {
  const s = new Set(ocupados);
  for (const mapa of [conceptos, comunes]) {
    for (const tramos of mapa.values()) for (const { inicio, fin } of tramos) for (let i = inicio; i <= fin; i += 1) s.add(i);
  }
  return s;
}

/* Fase 2.1 (A2) — algo nombrado tras «de», «en», «con» o «sobre» que no es nada conocido: «¿y mi récord de
   remo?» sin ningún ejercicio que se llame así. Se devuelve tal cual, para decir que no se encuentra en vez de
   contestar sobre otra cosa (lo de antes u otra entidad del mensaje). No es una mención: lo que ya es algo
   (`consumidos`), una palabra que nunca es un nombre (`NO_ENTIDAD`) ni las de esta lista. */
const PREPOSICIONES_DE_MENCION = new Set(['de', 'del', 'en', 'con', 'sobre']);
const NO_ES_MENCION = new Set(['general', 'total', 'resumen', 'serio', 'verdad', 'nuevo', 'realidad', 'momento', 'medio', 'plan', 'vez', 'veces']);
export function mencionSinResolver(tokens, consumidos = new Set()) {
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (!PREPOSICIONES_DE_MENCION.has(tokens[i]) || consumidos.has(i)) continue;
    const indices = [];
    for (let j = i + 1; j < tokens.length && indices.length < 3; j += 1) {
      const t = tokens[j];
      if (t === '¦' || consumidos.has(j) || PREPOSICIONES_DE_MENCION.has(t)) break;
      if (RELLENO.has(t) && !indices.length) continue;
      if (NO_ENTIDAD.has(t) || NO_ES_MENCION.has(t) || /^\d+$/.test(t)) break;
      indices.push(j);
    }
    if (indices.some((k) => tokens[k].length >= 3)) return { indices, texto: indices.map((k) => tokens[k]).join(' ') };
  }
  return null;
}
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
  /* Fase 2.2 — una fecha CALCULADA («la anterior», «el pasado») no está en el texto: no se reinterpreta. */
  const reinterpretar = (lista, texto) => (tiempo === 'futuro'
    ? [...interpretarFechas(texto, hoy, { tiempo }).filter((f) => !f.invalida), ...lista.filter((f) => f.fija)]
    : lista);
  /* 🐛 Fase 2.1 (A1) — la única fecha del mensaje solo pasa a una parte que no tiene la suya si ENCAJA con
     esa pregunta: que mire fechas y que sea de su mismo tiempo (una fecha que no ha llegado no va a lo
     registrado; una que ya pasó no va a lo que toca). Así «¿cuánto dormí y qué tal ayer?» o «¿cuántas
     calorías llevo y cuánta agua hoy?» la comparten, y «¿cuántos entrenos llevo y qué me toca mañana?» no
     le pasa «mañana» a la primera. Un rango en una pregunta de un día lo resuelve `capacidadParaPeriodo`. */
  const prestada = (f) => {
    if (!f || !capacidad.periodo) return false;
    if (tiempo === 'pasado' && f.futura) return false;
    if (tiempo === 'futuro' && f.hasta < hoy) return false;
    return true;
  };
  let elegidas = [];
  if (propias.length) elegidas = reinterpretar(propias, trozo.texto);
  else if (delMensaje.length === 1 && trozo !== entero && prestada(delMensaje[0])) {
    /* La comprobación va sobre la fecha COMO SE DIJO (en pasado) y, si la pregunta es de futuro, también
       sobre su lectura en futuro: «el lunes» de «la calidad el lunes» es el que pasó, y releído para «qué
       me toca» sería el siguiente, que nadie ha nombrado. */
    const r = reinterpretar(delMensaje, entero.texto);
    if (r.length === 1 && prestada(r[0]) && (tiempo !== 'futuro' || !(delMensaje[0].hasta < hoy))) elegidas = r;
  }
  if (elegidas.length) return { periodo: elegidas[0], segundo: elegidas[1] || null, origen: 'mensaje' };
  /* 🐛 Fase 2.3 · B0 — lo último que se contestó fue una COMPARACIÓN: sin fecha en el mensaje no hay un único
     periodo que heredar (¿el primero?, ¿el segundo?, ¿los dos juntos?). No se elige: se pregunta
     (`aclaracionDePareja`). Y tampoco se hereda lo que se miraba antes de la comparación. */
  const par = comparacionVigente(ctx);
  if (par) {
    const tipos = [par.periodo.tipo, par.segundo.tipo];
    const encaja = capacidad.periodo && (capacidad.tiempo || 'pasado') === 'pasado'
      && (capacidad.dosPeriodos || capacidad.periodo === 'ambos' || tipos.includes(capacidad.periodo) || (capacidad.periodo === 'dia' && capacidad.siRango));
    if (encaja) return { periodo: null, segundo: null, origen: 'comparacion', pareja: par };
    return { periodo: capacidad.porDefecto ? periodoPorDefecto(capacidad.porDefecto, hoy) : null, segundo: null, origen: 'defecto' };
  }
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
      /* Fase 2.3 · B0 — una capacidad que compara dice qué DOS periodos comparó de verdad: la conversación
         los guarda como pareja (nunca su unión) para «¿y la anterior?» y «compáralo con lo de antes». */
      periodosComparados: parejaValida(r.periodosComparados),
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

/* Las palabras tal como las escribió (con tildes y mayúsculas), para citarlas: «inglés», no «ingles». */
function palabrasOriginales(mensaje) {
  const m = new Map();
  for (const w of String(mensaje ?? '').slice(0, MAX_MENSAJE).split(/[\s?¿!¡;.,:()"']+/)) {
    const n = normalizar(w).trim();
    if (n && !m.has(n)) m.set(n, w.trim());
  }
  return m;
}
function textoOriginal(normalizado, originales) {
  if (!originales) return normalizado;
  return normalizado.split(' ').map((t) => originales.get(t) || t).join(' ');
}

function argumentosPara(asistente, capacidad, trozo, entero, ctx, hoy) {
  const p = periodoParaCapacidad(capacidad, trozo, entero, ctx, hoy);
  const args = { periodo: p.periodo, segundoPeriodo: p.segundo, origenPeriodo: p.origen, hoy, conceptos: trozo.conceptos, tokens: trozo.tokens,
    /* v3.161.3 — el periodo de la pregunta anterior a la última, para «compáralo con lo de antes». */
    periodoAnterior: ctx.periodoAnterior && heredable(ctx, ctx.periodoTurno) ? ctx.periodoAnterior : null };
  if (p.pareja) args.pareja = p.pareja;
  if (capacidad.entidad) {
    const tipo = capacidad.entidad.tipo;
    /* 🐛 Fase 2.1 (A2) — si esta pregunta nombra algo que no existe, ni se toma lo nombrado en otra parte
       del mensaje ni se hereda lo de antes: se dice que no se encuentra (`noEncontrada`). */
    const propia = trozo.entidades[tipo];
    const r = propia?.estado !== 'ninguna' ? propia : (trozo.mencion ? null : entero.entidades[tipo]);
    if (r && r.estado === 'unica') args.entidad = r.entidad;
    else if (r && r.estado === 'ambigua') args.ambigua = r;
    else if (trozo.mencion) args.desconocida = textoOriginal(trozo.mencion.texto, entero.originales);
    else if (ctx.entidades[tipo] && heredable(ctx, ctx.entidades[tipo].turno)) {
      /* Una entidad que la capacidad EXIGE se hereda («¿y su récord?»). Una que solo acota, solo si se
         sigue con la misma pregunta o se señala («eso», «esa»): si no, «¿qué notas he sacado?» después
         de hablar de Biología contestaría solo las de Biología sin que él lo haya pedido. */
      const sigue = ctx.ultima && ctx.ultima.capacidad === capacidad.id;
      if (capacidad.entidad.obligatoria || sigue || trozo.comunes.has('referencia')) args.entidad = ctx.entidades[tipo].entidad;
    }
  }
  if (typeof capacidad.argumentos === 'function') {
    const propios = { ...(capacidad.argumentos(trozo, args) || {}) };
    /* Fase 2.3 · B0 — «¿y la anterior?» después de comparar las proteínas sigue comparando las proteínas: lo
       que la capacidad sacó del mensaje de la comparación (`argsHeredados`) rellena lo que este no dice. */
    for (const [k, v] of Object.entries(trozo.argsHeredados || {})) if (propios[k] === null || propios[k] === undefined) propios[k] = v;
    Object.assign(args, propios);
    args.argsPropios = propios;
  }
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
  const bloques = [bTexto(opciones.length === 1 && total === 1
    ? `¿Te refieres a «${opciones[0].texto}»?`
    : total > opciones.length
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
/* Fase 2.1 (A2) — lo que nombró no está entre los suyos: se dice, y se ofrece lo que sí hay. Nunca se contesta
   sobre otra entidad —la de antes o la última que salió— como si fuera la que pidió. */
function noEncontrada(asistente, capacidad, args, disponibles) {
  const nombre = capacidad.entidad.nombre || 'elemento';
  const lista = (disponibles[capacidad.entidad.tipo] || []).slice().sort((a, b) => (b.reciente || 0) - (a.reciente || 0)).slice(0, MAX_OPCIONES);
  const dicho = `No encuentro «${args.desconocida}» entre tus ${pluralDe(nombre)}.`;
  if (!lista.length) return respuestaFija(asistente, capacidad.id, [bTexto(dicho)], { tipo: 'respuesta' });
  return {
    asistente: asistente.id, capacidad: capacidad.id, tipo: 'aclaracion',
    bloques: [bTexto(`${dicho} ¿Es alguno de estos?`)], fuente: null, confianza: null, acciones: [],
    opciones: opcionesDeEntidades(lista, capacidad, args.periodo),
  };
}
const pluralDe = (nombre) => (/[aeiouáéíóú]$/i.test(nombre) ? `${nombre}s` : `${nombre}es`);
function ejecutarConArgs(asistente, capacidad, args, datos, sinCargar, disponibles = {}) {
  const faltan = (asistente.lee || []).filter((k) => sinCargar.includes(k));
  if (faltan.length) {
    return respuestaFija(asistente, 'datos_no_cargados', [bTexto(`No he podido leer tus datos de ${asistente.nombre} (no se cargaron), así que no te contesto con ellos para no decirte algo que no es. Prueba a recargar la aplicación.`)], { tipo: 'error' });
  }
  if (capacidad.entidad && !args.entidad && !args.ambigua && args.desconocida) {
    if (capacidad.entidad.obligatoria) return noEncontrada(asistente, capacidad, args, disponibles);
    const r = ejecutarConArgs(asistente, capacidad, { ...args, desconocida: null }, datos, sinCargar, disponibles);
    if (r.tipo === 'respuesta') r.bloques = [bNota(`No encuentro «${args.desconocida}» entre tus ${pluralDe(capacidad.entidad.nombre || 'elemento')}, así que te lo enseño sin filtrar.`), ...r.bloques];
    return r;
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
export function responderMensaje(asistente, mensaje, { datos = {}, hoy, contexto = null, sinCargar = [], ajenos = [], ahora = Date.now(), opcion = null, aclaracionesQueSiguen = [] } = {}) {
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
    /* 🐛 Fase 2.3 · B0 — TODAS las aclaraciones con botones siguen vivas, no solo la última: «¿cuándo es el
       examen y qué temas me quedan?» pregunta dos veces «¿de qué asignatura?», y la primera nacía apagada.
       Cada botón lleva el id de la suya (`origen`), así que contesta a su pregunta y no a la otra. Las que
       quedaban sin contestar de la misma tanda (`restantes`) siguen vivas mientras se van contestando con
       sus botones; cualquier otra pregunta las da por terminadas (como antes). `id` y `opciones` siguen
       siendo los de la última, que es la que se contesta escribiendo («la primera», «Biología»). */
    const nuevas = respuestas.filter((r) => r.tipo === 'aclaracion' && r.opciones.length).map((r) => ({ id: r.id, opciones: r.opciones }));
    const vivas = [...restantes, ...nuevas].slice(-MAX_ACLARACIONES_VIVAS);
    const ultimaAclaracion = vivas[vivas.length - 1];
    ctx.pendiente = ultimaAclaracion ? { id: ultimaAclaracion.id, opciones: ultimaAclaracion.opciones, aclaraciones: vivas } : null;
    return { respuestas, contexto: ctx };
  };

  /* Fase 2.3 · B2 — comparar DOS periodos con una métrica que el asistente declara (contrato de B1): una
     sola respuesta del comparador común, que la conversación recuerda como pareja. Pasa por
     `ejecutarConArgs`, así que los datos sin cargar y un fallo se tratan como en cualquier respuesta. */
  const compararConMetrica = (capacidad, metrica, f1, f2, trozo) => {
    const periodos = [f1, f2].map((f) => ({ desde: f.desde, hasta: f.hasta, tipo: f.tipo || (f.desde === f.hasta ? 'dia' : 'rango'), etiqueta: f.etiqueta || null }));
    const pseudo = { ...capacidad, entidad: null, ejecutar: (d) => {
      const c = compararMetrica(metrica, d, periodos, { hoy });
      return { bloques: c.bloques, periodosComparados: c.periodosComparados, confianza: c.confianza, fuente: metrica.fuente || null, sinDatos: c.estado !== 'comparable' };
    } };
    const args = { periodo: periodos[0], segundoPeriodo: periodos[1], origenPeriodo: 'mensaje', hoy, conceptos: trozo.conceptos, tokens: trozo.tokens, argsPropios: { ...(trozo.argsHeredados || {}), metrica: metrica.id } };
    const r = ejecutarConArgs(asistente, pseudo, args, datos, sinCargar, disponibles);
    if (r.tipo === 'respuesta') recordar(ctx, capacidad, args, r);
    return r;
  };

  /* 🐛 v3.161.2 — un botón de aclaración que ya no es el pendiente (se hizo otra pregunta después, se
     contestó ya o la conversación caducó) NO se ejecuta: antes se mandaba su texto («Martes», un nombre)
     y se interpretaba con el contexto de AHORA. Se dice, y la aclaración de ahora sigue viva. */
  const pend = ctx0.pendiente;
  const grupo = aclaracionesVivas(pend);
  if (opcion && opcion.origen) {
    const suya = grupo.find((a) => a.id === opcion.origen);
    const vigente = suya && Array.isArray(suya.opciones) && suya.opciones[opcion.indice];
    if (!vigente) {
      const caducada = respuestaFija(asistente, 'opcion_caducada', [bTexto('Ese botón era de una pregunta anterior y ya no vale. Pregúntamelo otra vez y te contesto con lo de ahora, por ejemplo:')], { opciones: sugerenciasDe(asistente, 3) });
      caducada.id = `${ctx.turno}-0`;
      return { respuestas: [caducada], contexto: { ...ctx, pendiente: ctx0.pendiente || null } };
    }
  }

  /* 1 · Una aclaración pendiente que se contesta (un botón, «la primera», el nombre). */
  const contestada = opcion && opcion.origen ? grupo.find((a) => a.id === opcion.origen) : (pend ? grupo[grupo.length - 1] : null);
  const elegida = opcion && opcion.origen ? contestada.opciones[opcion.indice] : opcionDePendiente(pend, tokens);
  /* Lo que sigue pendiente de la misma tanda cuando se contesta una (Fase 2.3 · B0). */
  const restantes = elegida ? grupo.filter((a) => a !== contestada) : aclaracionesQueSiguen;
  if (elegida && elegida.plan) {
    const capacidad = (asistente.capacidades || []).find((c) => c.id === elegida.plan.capacidad);
    if (capacidad && capacidad.dosPeriodos && Array.isArray(elegida.plan.periodos) && elegida.plan.periodos.length === 2) {
      /* Fase 2.3 · B0 — el botón de una capacidad que compara de verdad («¿quieres comparar la semana pasada
         con la anterior?»): se ejecuta UNA vez con los dos periodos, como si los hubiera escrito. */
      const [periodo, segundoPeriodo] = elegida.plan.periodos;
      const args = { periodo, segundoPeriodo, origenPeriodo: 'mensaje', hoy, conceptos: new Map(), tokens, entidad: elegida.plan.entidad || null, ...(elegida.plan.args || {}) };
      const r = ejecutarConArgs(asistente, capacidad, args, datos, sinCargar, disponibles);
      respuestas.push(r);
      recordar(ctx, capacidad, args, r);
      return terminar();
    }
    const metricaDelPlan = capacidad && Array.isArray(elegida.plan.periodos) && elegida.plan.periodos.length === 2
      ? metricaPara(asistente, capacidad, { conceptos: new Map(), argsHeredados: elegida.plan.args || null }) : null;
    if (metricaDelPlan) {
      /* Fase 2.3 · B2 — el botón de «¿qué quieres comparar?» (o de «¿anterior a cuál?») con una métrica
         comparable: una comparación de verdad, no dos respuestas sueltas. */
      const [f1, f2] = elegida.plan.periodos;
      respuestas.push(compararConMetrica(capacidad, metricaDelPlan, f1, f2, { conceptos: new Map(), tokens, argsHeredados: elegida.plan.args || null }));
      return terminar();
    }
    if (capacidad && Array.isArray(elegida.plan.periodos) && elegida.plan.periodos.length) {
      /* Fase 2.2 (P5) — el botón de «¿qué quieres comparar?»: cada periodo con la capacidad elegida, por
         separado, y la nota de que la diferencia no se calcula (la comparación real es la Fase 2.3). */
      for (const periodo of elegida.plan.periodos.slice(0, MAX_INTENCIONES)) {
        const ajuste = capacidadParaPeriodo(asistente, capacidad, { periodo, hoy, conceptos: new Map(), tokens, entidad: elegida.plan.entidad || null });
        if (ajuste.aclaracion) { respuestas.push(ajuste.aclaracion); continue; }
        const r = ejecutarConArgs(asistente, ajuste.capacidad, ajuste.args, datos, sinCargar, disponibles);
        respuestas.push(r);
        recordar(ctx, ajuste.capacidad, ajuste.args, r);
      }
      const primera = respuestas.find((r) => r.tipo === 'respuesta');
      if (primera) primera.bloques = [bNota(TEXTO_SIN_DIFERENCIA), ...primera.bloques];
      return terminar();
    }
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
    return responderMensaje(asistente, elegida.mensaje, { datos, hoy, contexto: { ...ctx0, pendiente: null }, sinCargar, ajenos, ahora, aclaracionesQueSiguen: restantes });
  }

  const troceado = trozos(asistente, tokens, hoy, disponibles);
  /* Fase 2.2 — antes de contestar: «la semana anterior» relativa a lo que se hablaba (P2) y las unidades
     sobreentendidas del propio mensaje («este mes y el pasado», P3). Primero sobre el mensaje entero, y
     luego se lleva a la parte que la contiene (sus posiciones son de esa parte, no del mensaje). */
  const itemDelContexto = itemUnicoConPeriodo(ctx0);
  const enteroRel = relativizarAnteriores(troceado.entero, troceado.entero, itemDelContexto, hoy, troceado.partes.length === 1 ? comparacionVigente(ctx0) : null);
  const entero = completarSobreentendida(enteroRel, enteroRel.fechas, hoy);
  entero.originales = palabrasOriginales(mensaje);
  const partes = troceado.partes.length === 1 && troceado.partes[0] === troceado.entero
    ? [entero]
    : troceado.partes.map((parte) => {
      const fechas = parte.fechas.map((f) => (f.invalida ? f : (enteroRel.fechas.find((x) => x.fija && x.texto === f.texto) || f)));
      const conAnteriores = fechas.some((f, i) => f !== parte.fechas[i]) ? { ...parte, fechas } : parte;
      return completarSobreentendida(conAnteriores, conAnteriores.fechas.length ? conAnteriores.fechas : enteroRel.fechas, hoy);
    });

  /* Contestar una capacidad en un trozo. 🐛 D2 — «¿cuánto dormí el lunes y el martes?» contestaba solo el
     lunes sin decirlo: con varias fechas en la misma pregunta, cada una se contesta por separado (hasta
     MAX_INTENCIONES, y se dice si sobran). Las que comparan dos periodos (`dosPeriodos`) las usan juntas. */
  const contestarUno = (capacidad, trozo) => {
    const argsBase = argumentosPara(asistente, capacidad, trozo, entero, ctx, hoy);
    if (argsBase.pareja) { recordar(ctx, capacidad, { periodo: null }); return aclaracionDePareja(asistente, capacidad, argsBase, hoy); }
    const ajuste = capacidadParaPeriodo(asistente, capacidad, argsBase);
    if (ajuste.aclaracion) { recordar(ctx, ajuste.capacidad, { periodo: null }); return ajuste.aclaracion; }
    const r = ejecutarConArgs(asistente, ajuste.capacidad, ajuste.args, datos, sinCargar, disponibles);
    if (r.tipo === 'respuesta' || r.tipo === 'aclaracion') recordar(ctx, ajuste.capacidad, ajuste.args, r);
    if (r.tipo === 'respuesta') {
      /* 🐛 Fase 2.1 (A3) — una capacidad que no mira fechas («tu récord», «cómo vas en un ejercicio») no
         puede contestar como si hubiera filtrado por la que dijo: se dice que no se ha filtrado. */
      const ignoradas = !ajuste.capacidad.periodo ? fechasDistintas(trozo) : [];
      if (ignoradas.length) {
        r.bloques = [bNota(`Esto no lo puedo filtrar por fechas, así que no es solo de ${ignoradas.map((f) => f.etiqueta).join(' ni de ')}: te enseño lo que hay sin filtrar.`), ...r.bloques];
      }
      /* Fase 2.1 (A7) — una palabra que se parece a una fecha y no se ha entendido como tal, con el periodo
         puesto por defecto: se dice cuál se ha usado, en vez de contestar sobre hoy como si lo hubiera pedido. */
      const p = ajuste.args.periodo;
      const dudosas = (ajuste.args.origenPeriodo === 'defecto' || ajuste.args.origenPeriodo === 'contexto') && ajuste.capacidad.periodo && p ? palabrasParecidasAFecha(trozo.tokens, trozo.consumidos) : [];
      if (dudosas.length) {
        r.bloques = [bNota(`No he entendido «${textoOriginal(dudosas[0], entero.originales)}» como una fecha, así que te contesto sobre ${p.etiqueta || 'el periodo de siempre'}. Si te referías a otro día, dímelo con otras palabras.`), ...r.bloques];
      }
    }
    return r;
  };
  const contestar = (capacidad, trozo) => {
    const fechas = fechasDistintas(trozo);
    const metrica = fechas.length >= 2 && capacidad.periodo && !capacidad.dosPeriodos && (trozo.parejaDesplazada || (trozo.conceptos && trozo.conceptos.has('comparar')))
      ? metricaPara(asistente, capacidad, trozo) : null;
    if (metrica) {
      const salida = [compararConMetrica(capacidad, metrica, fechas[0], fechas[1], trozo)];
      if (fechas.length > 2) salida.push(respuestaFija(asistente, 'demasiadas_fechas', [bNota(`Has nombrado ${fechas.length} periodos y he comparado los 2 primeros. Pregúntame los demás aparte.`)]));
      return salida;
    }
    const salida = fechas.length < 2 || !capacidad.periodo || capacidad.dosPeriodos
      ? [contestarUno(capacidad, trozo)]
      : fechas.slice(0, MAX_INTENCIONES).map((f) => contestarUno(capacidad, { ...trozo, fechas: [f], texto: f.texto }));
    const primera = salida.find((r) => r.tipo === 'respuesta');
    /* Fase 2.2 (P5) — pidió COMPARAR y esta capacidad no compara (la comparación real es la Fase 2.3): se
       contesta cada periodo y se dice, para que no parezca que la diferencia está calculada. */
    if (primera && fechas.length >= 2 && capacidad.periodo && !capacidad.dosPeriodos && trozo.conceptos && trozo.conceptos.has('comparar')) {
      primera.bloques = [bNota(TEXTO_SIN_DIFERENCIA), ...primera.bloques];
    }
    /* Fase 2.2 — una fecha imposible al lado de una buena no se pierde en silencio. */
    const imposible = (trozo.fechas || []).find((f) => f.invalida);
    if (primera && imposible && fechas.length) {
      primera.bloques = [bNota(`«${imposible.texto}» no es una fecha que exista, así que no la he mirado.`), ...primera.bloques];
    }
    if (capacidad.periodo && !capacidad.dosPeriodos && fechas.length > MAX_INTENCIONES) {
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
  for (const parte of partes) {
    let trozo = parte;
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
    /* 🐛 Fase 2.2 (P4) — «¿Cuál es mi récord?» → «¿y en press banca?» pasaba a «cómo vas»: esa capacidad no
       exige ninguna palabra y ganaba solo por nombrar el ejercicio. Si lo único que dice el mensaje es OTRA
       entidad (ni una señal propia de la ganadora) y la pregunta anterior, todavía vigente, es DE ese mismo
       tipo de entidad, se sigue con ella. Una intención dicha con palabras («¿cómo voy en press?») gana. */
    if (capacidad && capacidad.entidad && senalesPropias(capacidad, trozo) === 0 && ctx0.ultima && heredable(ctx0, ctx0.ultima.turno)) {
      const tipo = capacidad.entidad.tipo;
      const nombra = trozo.entidades[tipo] && trozo.entidades[tipo].estado !== 'ninguna';
      const previa = (asistente.capacidades || []).find((c) => c.id === ctx0.ultima.capacidad);
      if (nombra && previa && previa.id !== capacidad.id && previa.entidad && previa.entidad.tipo === tipo) capacidad = previa;
    }
    /* Lo de otro módulo va ANTES que la elipsis: «¿cuánto gasté este mes?» trae una fecha, pero no es
       «¿y este mes?» de lo anterior. */
    const nombraAlgoSuyo = Object.values(trozo.entidades).some((r) => r.estado !== 'ninguna');
    if (!capacidad && !nombraAlgoSuyo && buscarAjeno(trozo.tokens, ajenos, asistente.modulo)) {
      respuestas.push(sinCapacidad(asistente, trozo, ajenos, ctx0));
      continue;
    }
    /* Fase 2.2 (P3) — «el anterior» con varias fechas al lado: no se adivina a cuál se refiere. */
    if (trozo.anteriorDudosa) {
      const cap = capacidad || capacidadDeLaUltima(asistente, ctx0);
      respuestas.push({
        asistente: asistente.id, capacidad: 'referencia_dudosa', tipo: 'aclaracion',
        bloques: [bTexto(`No sé a qué fecha te refieres con «${trozo.anterior.texto}»: ¿anterior a cuál?`)],
        fuente: null, confianza: null, acciones: [],
        opciones: cap ? trozo.anteriorDudosa.slice(0, MAX_OPCIONES).map((f) => {
          const previo = periodoPrevio(f, hoy);
          return { texto: `Anterior ${aEtiqueta(f.etiqueta)}`, mensaje: `Anterior ${aEtiqueta(f.etiqueta)}`, plan: { capacidad: cap.id, entidad: null, periodo: previo } };
        }).filter((o) => o.plan.periodo) : [],
      });
      continue;
    }
    /* Fase 2.2 (P2) — «¿y la anterior?», «la anterior a esa», «el periodo anterior», «¿y la pasada?»: el
       periodo anterior DEL CALENDARIO al último que se contestó (también si era uno por defecto). La
       comparación de Sueño («compáralo con lo de antes») tiene su propia regla y no pasa por aquí. */
    if (trozo.anterior && !trozo.fechas.some((f) => !f.invalida) && !(capacidad && capacidad.dosPeriodos)) {
      const res = resolverAnterior(asistente, ctx0, hoy, capacidad, trozo.anterior.texto);
      if (res.respuesta) { respuestas.push(res.respuesta); continue; }
      trozo = { ...trozo, fechas: res.fechas || [res.fecha], ...(res.argsHeredados ? { argsHeredados: res.argsHeredados } : {}), ...(res.fechas ? { parejaDesplazada: true } : {}) };
      if (!capacidad) capacidad = res.capacidad;
    }
    /* Elipsis y corrección (§7.6): sin pregunta propia pero con fecha o con algo nombrado (también algo
       nombrado que no existe: «¿y de inglés?» tiene que oír que no hay inglés, no «no lo he entendido»). */
    const tieneFecha = trozo.fechas.length > 0;
    const tieneEntidad = Object.values(trozo.entidades).some((r) => r.estado !== 'ninguna');
    let porElipsis = false;
    if (!capacidad && ctx0.ultima && heredable(ctx0, ctx0.ultima.turno) && (tieneFecha || tieneEntidad || trozo.mencion)) {
      capacidad = (asistente.capacidades || []).find((c) => c.id === ctx0.ultima.capacidad) || null;
      porElipsis = !!capacidad;
      /* Un nombre desconocido solo sigue la pregunta anterior si esa pregunta era DE algo nombrable. */
      if (capacidad && !tieneFecha && !tieneEntidad && !capacidad.entidad) { capacidad = null; porElipsis = false; }
    }
    /* Fase 2.2 (P5) — pidió comparar periodos. La comparación real es la Fase 2.3, pero nada se pierde:
       · sin saber QUÉ comparar (o con una pregunta que no va por fechas), se pregunta, con las capacidades que
         sí pueden mirar esos periodos;
       · siguiendo una pregunta con un solo periodo nuevo («compáralo con la semana pasada»), se añade el que
         ya se estaba mirando en vez de sustituirlo. Cada periodo se contesta por separado y se dice. */
    const comparando = trozo.conceptos.has('comparar') && !(capacidad && capacidad.dosPeriodos);
    const validasTrozo = fechasDistintas(trozo);
    if (comparando && validasTrozo.length >= 1 && (!capacidad || (porElipsis && !capacidad.periodo))) {
      const aComparar = validasTrozo.length >= 2 ? validasTrozo.slice(0, 2) : null;
      respuestas.push(preguntaQueComparar(asistente, aComparar, validasTrozo, hoy, trozo.fechas.filter((f) => f.invalida)));
      continue;
    }
    if (comparando && capacidad && capacidad.periodo && validasTrozo.length === 1) {
      const item = itemUnicoConPeriodo(ctx0);
      const nueva = validasTrozo[0];
      if (item && item.capacidad === capacidad.id && (item.periodo.desde !== nueva.desde || item.periodo.hasta !== nueva.hasta)) {
        const antes = { ...item.periodo, etiqueta: item.periodo.etiqueta || etiquetaDeRangoSimple(item.periodo, hoy) };
        trozo = { ...trozo, fechas: [fechaCalculada({ ...antes, unidad: null }, hoy, { texto: 'lo de antes' }), ...trozo.fechas] };
      }
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
    /* 🐛 Fase 2.1 (A3) — «¿y ayer?» después de una pregunta que no mira fechas («cómo voy en press») devolvía
       lo mismo como si hubiera filtrado por ayer. Solo con la fecha y nada más, no se repite: se dice. */
    if (porElipsis && !capacidad.periodo && tieneFecha && !tieneEntidad && !trozo.mencion) {
      const f = trozo.fechas.find((x) => !x.invalida);
      const conFechas = (asistente.capacidades || []).filter((c) => c.periodo && c.ejemplo).slice(0, 3);
      const heredada = capacidad.entidad && ctx0.entidades && ctx0.entidades[capacidad.entidad.tipo] ? ctx0.entidades[capacidad.entidad.tipo].entidad : null;
      respuestas.push({
        asistente: asistente.id, capacidad: 'fecha_no_aplicable', tipo: 'aclaracion',
        bloques: [bTexto(`«${capacidad.titulo}» no lo puedo mirar por fechas, así que no puedo contestarte solo sobre ${f ? f.etiqueta : 'esa fecha'}.`), bNota('Puedo enseñártelo sin fecha, o contestarte otra cosa que sí va por fechas:')],
        fuente: null, confianza: null, acciones: [],
        opciones: [
          { texto: `${capacidad.titulo} (sin fecha)`, mensaje: `${capacidad.titulo} (sin fecha)`, plan: { capacidad: capacidad.id, entidad: heredada, periodo: null } },
          ...conFechas.map((c) => ({ texto: c.ejemplo, mensaje: c.ejemplo })),
        ].slice(0, MAX_OPCIONES),
      });
      continue;
    }
    /* 🐛 Fase 2.1 (A8) — dos partes que piden lo mismo con el mismo periodo («¿cuánto dormí y qué tal
       ayer?») daban dos respuestas idénticas: la segunda no se repite. Partes con objetivos distintos dan
       respuestas distintas y se quedan las dos. */
    for (const r of contestar(capacidad, trozo)) {
      const clave = `${r.capacidad}|${r.tipo}|${textoDeRespuesta(r)}`;
      if ((r.tipo === 'respuesta' || r.tipo === 'aclaracion') && respuestas.some((x) => `${x.capacidad}|${x.tipo}|${textoDeRespuesta(x)}` === clave)) continue;
      respuestas.push(r);
    }
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

/* ══════════════════════════════════════════════════════════════════════════
   FASE 2.2 — ayudas del contexto estructurado
   ══════════════════════════════════════════════════════════════════════════ */

export const TEXTO_SIN_DIFERENCIA = 'Todavía no calculo la diferencia entre los dos periodos: te enseño cada uno por separado.';

const etiquetaDeRangoSimple = (p, hoy) => etiquetaDeRango(p.desde, p.hasta, hoy);
/** «a» + una etiqueta, con la contracción: «al lunes 19», «a esta semana», «a la semana del 5 al 11». */
const aEtiqueta = (etq) => (/^el /.test(etq || '') ? `al ${etq.slice(3)}` : `a ${etq}`);

/** Cuánto suma una capacidad SOLO con las palabras del mensaje (sin fechas ni entidades). */
function senalesPropias(capacidad, trozo) {
  let n = 0;
  for (const [c, peso] of Object.entries(capacidad.senales || {})) if (trozo.conceptos.has(c)) n += peso;
  return n;
}

/** La última respuesta, si sigue vigente y contestó UNA cosa con UN periodo. */
function itemUnicoConPeriodo(ctx) {
  const u = ctx && ctx.ultimaRespuesta;
  if (!u || !heredable(ctx, u.turno)) return null;
  const con = (u.items || []).filter((i) => i.periodo);
  /* Una comparación no es «un periodo»: es una pareja (`comparacionVigente`). */
  return con.length === 1 && !con[0].segundo ? con[0] : null;
}

/* ── Fase 2.3 · B0 — la comparación como PAREJA de periodos ─────────────────────────────────────────── */

const periodoValido = (p) => !!(p && typeof p.desde === 'string' && typeof p.hasta === 'string' && p.desde && p.hasta && p.desde <= p.hasta);
/** Los dos periodos que una capacidad dice haber comparado, con su forma; si no son dos válidos, `null`. */
function parejaValida(lista) {
  if (!Array.isArray(lista) || lista.length !== 2 || !lista.every(periodoValido)) return null;
  return lista.map((p) => ({ desde: p.desde, hasta: p.hasta, tipo: p.tipo || (p.desde === p.hasta ? 'dia' : 'rango'), etiqueta: p.etiqueta || null }));
}

/** La última respuesta, si sigue vigente y fue UNA comparación (sus dos periodos y su capacidad). */
function comparacionVigente(ctx) {
  const u = ctx && ctx.ultimaRespuesta;
  if (!u || !heredable(ctx, u.turno)) return null;
  const items = u.items || [];
  return items.length === 1 && items[0].segundo ? items[0] : null;
}

const etiquetaDe = (p, hoy) => p.etiqueta || etiquetaDeRangoSimple(p, hoy);
const mayuscula = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/**
 * «¿y la anterior?» después de comparar dos periodos (decisión de Josué, opción A): los DOS un paso atrás,
 * con la misma unidad y la misma distancia entre ellos — hoy/ayer → ayer/anteayer; esta semana/la pasada →
 * la pasada/la anterior; un mes/el anterior → los dos meses de antes, con sus días de verdad. Solo si se
 * puede saber con seguridad: los dos de la misma unidad del calendario, o dos rangos de los mismos días.
 * Si no, `null` (y quien llama pregunta en vez de adivinar).
 */
export function desplazarPareja(a, b, hoy) {
  if (!periodoValido(a) || !periodoValido(b)) return null;
  const ua = unidadDePeriodo(a, hoy);
  const ub = unidadDePeriodo(b, hoy);
  if (!ua || ua !== ub) return null;
  if (ua === 'rango' && diasDelRango(a.desde, a.hasta) !== diasDelRango(b.desde, b.hasta)) return null;
  if (a.desde === b.desde && a.hasta === b.hasta) return null;
  const pa = periodoPrevio(a, hoy);
  const pb = periodoPrevio(b, hoy);
  if (!pa || !pb || (pa.desde === pb.desde && pa.hasta === pb.hasta)) return null;
  return [pa, pb].map((p) => ({ desde: p.desde, hasta: p.hasta, tipo: p.tipo || (p.desde === p.hasta ? 'dia' : 'rango'), etiqueta: p.etiqueta, unidad: p.unidad }));
}

/* Lo que se pregunta cuando una pregunta sin fecha llega justo después de una comparación:
   · otra pregunta de un periodo («¿y la calidad?», «¿y las proteínas?») → ¿de cuál de los dos?;
   · la propia comparación otra vez («compáralo con lo de antes») → ya está comparado: se ofrece el paso
     atrás de los dos, o se pide que diga qué dos periodos. Nunca se elige uno ni se juntan los dos. */
function aclaracionDePareja(asistente, capacidad, args, hoy) {
  const par = args.pareja;
  const ea = etiquetaDe(par.periodo, hoy);
  const eb = etiquetaDe(par.segundo, hoy);
  const base = { asistente: asistente.id, capacidad: 'comparacion_que_periodo', tipo: 'aclaracion', fuente: null, confianza: null, acciones: [] };
  /* Lo que pidió en este mensaje («¿y las proteínas?») viaja con el botón; si no pidió nada, lo de la comparación. */
  const dichos = Object.fromEntries(Object.entries(args.argsPropios || {}).filter(([, v]) => v !== null && v !== undefined));
  if (capacidad.dosPeriodos) {
    const atras = desplazarPareja(par.periodo, par.segundo, hoy);
    if (!atras) {
      return { ...base, bloques: [bTexto(`Ya te he comparado ${ea} con ${eb}. Dime qué dos periodos quieres comparar ahora, por ejemplo:`)],
        opciones: capacidad.ejemplo ? [{ texto: capacidad.ejemplo, mensaje: capacidad.ejemplo }] : [] };
    }
    const texto = mayuscula(`${etiquetaDe(atras[0], hoy)} con ${etiquetaDe(atras[1], hoy)}`);
    return { ...base, bloques: [bTexto(`Ya te he comparado ${ea} con ${eb}. ¿Quieres comparar ${etiquetaDe(atras[0], hoy)} con ${etiquetaDe(atras[1], hoy)}?`), bNota('Si es otra cosa, dime qué dos periodos quieres comparar.')],
      opciones: [{ texto, mensaje: texto, plan: { capacidad: capacidad.id, entidad: args.entidad || null, periodos: atras, args: { ...(par.args || {}), ...dichos } } }] };
  }
  return { ...base, bloques: [bTexto(`Te he comparado ${ea} con ${eb}. ¿De cuál de los dos quieres saber «${capacidad.titulo.toLowerCase()}»?`)],
    opciones: [par.periodo, par.segundo].map((p) => ({ texto: mayuscula(etiquetaDe(p, hoy)), mensaje: mayuscula(etiquetaDe(p, hoy)), plan: { capacidad: capacidad.id, entidad: args.entidad || null, periodo: { desde: p.desde, hasta: p.hasta, tipo: p.tipo, etiqueta: p.etiqueta }, args: dichos } })) };
}

const capacidadDeLaUltima = (asistente, ctx) => (ctx && ctx.ultima && heredable(ctx, ctx.ultima.turno)
  ? (asistente.capacidades || []).find((c) => c.id === ctx.ultima.capacidad) || null : null);

const ejemplosConFechas = (asistente, n = 3) => (asistente.capacidades || [])
  .filter((c) => c.periodo && c.ejemplo).slice(0, n).map((c) => ({ texto: c.ejemplo, mensaje: c.ejemplo }));

/* P2 — resolver «¿y la anterior?» con la última respuesta. Cuando no se puede hacer con seguridad, se
   pregunta o se explica (nunca se elige al azar ni se inventa un periodo):
   · sin contexto vigente → «¿anterior a qué?»;
   · la pregunta anterior no iba por fechas (un récord, una racha, las notas, el próximo examen) → se dice;
   · contestó varios periodos → «¿anterior a cuál?», con un botón por periodo;
   · lo que mira el futuro (lo que toca, las próximas fechas) no tiene un «anterior» que ya pasó. */
function resolverAnterior(asistente, ctx, hoy, capacidadPropia, dicho = null) {
  const u = ctx && ctx.ultimaRespuesta;
  if (!u || !heredable(ctx, u.turno) || !(u.items || []).length) {
    /* Sin nada a qué referirse. Si la pregunta está clara («pomodoros el pasado») y mira el pasado, se pregunta
       solo la unidad, con un botón por cada una; si no, qué quiere consultar. Nunca se elige la unidad por él. */
    if (capacidadPropia && capacidadPropia.periodo && (capacidadPropia.tiempo || 'pasado') === 'pasado') {
      const unidades = [periodoPorDefecto('hoy', hoy), periodoPorDefecto('estaSemana', hoy), { ...periodoPorDefecto('ultimos30', hoy), desde: `${hoy.slice(0, 8)}01` }]
        .map((p) => periodoPrevio(p, hoy)).filter(Boolean);
      const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
      return { respuesta: {
        asistente: asistente.id, capacidad: 'referencia_sin_unidad', tipo: 'aclaracion',
        bloques: [bTexto(`No sé a qué periodo te refieres con «${dicho || 'el anterior'}». ¿Cuál de estos?`)],
        fuente: null, confianza: null, acciones: [],
        opciones: unidades.map((p) => ({ texto: mayus(p.etiqueta), mensaje: mayus(p.etiqueta), plan: { capacidad: capacidadPropia.id, entidad: null, periodo: p } })),
      } };
    }
    return { respuesta: { ...respuestaFija(asistente, 'referencia_sin_contexto', [bTexto(`¿${dicho && /pasad/.test(dicho) ? 'Qué periodo pasado' : 'Anterior a qué'}? Dime qué quieres consultar y de qué fecha, por ejemplo:`)], { opciones: ejemplosConFechas(asistente) }), tipo: 'aclaracion' } };
  }
  const conPeriodo = u.items.filter((i) => i.periodo);
  if (!conPeriodo.length) {
    const cap = (asistente.capacidades || []).find((c) => c.id === u.items[0].capacidad);
    return { respuesta: respuestaFija(asistente, 'referencia_sin_periodo', [
      bTexto(`«${cap ? cap.titulo : 'Lo que te he contestado'}» no va por fechas, así que no tiene un periodo anterior.`),
      bNota('Si quieres mirar algo por fechas, por ejemplo:'),
    ], { tipo: 'respuesta', opciones: ejemplosConFechas(asistente) }) };
  }
  const titulo = (id) => ((asistente.capacidades || []).find((c) => c.id === id) || { titulo: id }).titulo;
  /* 🐛 Fase 2.3 · B0 — después de una COMPARACIÓN, «¿y la anterior?» (sin otra pregunta, o con la misma)
     desplaza LOS DOS periodos un paso atrás (`desplazarPareja`), con la misma capacidad y lo mismo que se
     comparaba (las proteínas siguen siendo las proteínas). Antes se calculaba el anterior solo del primero
     y la comparación de días repetía hoy contra ayer. Si los dos no se pueden mover a la vez con seguridad,
     se pregunta. Con OTRA pregunta («¿y las proteínas de la anterior?»), cada periodo de la pareja cuenta
     por separado y se pregunta anterior a cuál. */
  const propiaDistinta = (i) => capacidadPropia && capacidadPropia.id !== i.capacidad;
  if (conPeriodo.length === 1 && conPeriodo[0].segundo && !propiaDistinta(conPeriodo[0])) {
    const i = conPeriodo[0];
    const cap = (asistente.capacidades || []).find((c) => c.id === i.capacidad) || null;
    const atras = cap ? desplazarPareja(i.periodo, i.segundo, hoy) : null;
    if (!atras) {
      return { respuesta: {
        asistente: asistente.id, capacidad: 'referencia_pareja', tipo: 'aclaracion',
        bloques: [bTexto(`Te he comparado ${etiquetaDe(i.periodo, hoy)} con ${etiquetaDe(i.segundo, hoy)} y no sé cómo pasar los dos al periodo anterior a la vez. Dime qué dos periodos quieres comparar, por ejemplo:`)],
        fuente: null, confianza: null, acciones: [],
        opciones: cap && cap.ejemplo ? [{ texto: cap.ejemplo, mensaje: cap.ejemplo }] : [],
      } };
    }
    return { fechas: atras.map((p) => fechaCalculada(p, hoy, { texto: 'anterior' })), capacidad: cap, argsHeredados: i.args || null, entidad: i.entidad || null };
  }
  const sueltos = conPeriodo.flatMap((i) => (i.segundo && propiaDistinta(i) ? [{ ...i, segundo: null }, { ...i, periodo: i.segundo, segundo: null }] : [i]));
  const previos = [];
  for (const i of sueltos) {
    if (i.segundo) {
      /* Una comparación entre otras respuestas del mismo turno: una opción con los dos periodos movidos. */
      const atras = desplazarPareja(i.periodo, i.segundo, hoy);
      if (atras) previos.push({ i, pareja: atras });
      continue;
    }
    const p = periodoPrevio(i.periodo, hoy);
    if (p && !previos.some((x) => x.p && x.p.desde === p.desde && x.p.hasta === p.hasta && x.i.capacidad === i.capacidad)) previos.push({ i, p });
  }
  if (previos.length > 1 || (previos.length === 1 && previos[0].pareja)) {
    const variasCapacidades = new Set(previos.map((x) => x.i.capacidad)).size > 1;
    return { respuesta: {
      asistente: asistente.id, capacidad: 'referencia_ambigua', tipo: 'aclaracion',
      bloques: [bTexto('Te he contestado más de un periodo: ¿anterior a cuál?')],
      fuente: null, confianza: null, acciones: [],
      opciones: previos.slice(0, MAX_OPCIONES).map(({ i, p, pareja }) => {
        if (pareja) {
          const texto = mayuscula(`${titulo(i.capacidad)} · ${etiquetaDe(pareja[0], hoy)} con ${etiquetaDe(pareja[1], hoy)}`);
          return { texto, mensaje: texto, plan: { capacidad: i.capacidad, entidad: i.entidad || null, periodos: pareja, args: i.args || null } };
        }
        const etq = i.periodo.etiqueta || etiquetaDeRangoSimple(i.periodo, hoy);
        const texto = `${variasCapacidades ? `${titulo(i.capacidad)} · ` : ''}anterior ${aEtiqueta(etq)}`;
        const mayus = texto.charAt(0).toUpperCase() + texto.slice(1);
        return { texto: mayus, mensaje: mayus, plan: { capacidad: capacidadPropia ? capacidadPropia.id : i.capacidad, entidad: i.entidad || null, periodo: p } };
      }),
    } };
  }
  if (!previos.length) {
    return { respuesta: respuestaFija(asistente, 'referencia_sin_contexto', [bTexto('¿Anterior a qué? Dime qué quieres consultar y de qué fecha.')], { tipo: 'respuesta', opciones: ejemplosConFechas(asistente) }) };
  }
  const { i, p } = previos[0];
  const cap = capacidadPropia || (asistente.capacidades || []).find((c) => c.id === i.capacidad) || null;
  if (!cap) return { respuesta: respuestaFija(asistente, 'referencia_sin_contexto', [bTexto('¿Anterior a qué? Dime qué quieres consultar y de qué fecha.')], { tipo: 'respuesta', opciones: ejemplosConFechas(asistente) }) };
  if ((cap.tiempo || 'pasado') === 'futuro' && p.hasta < hoy) {
    return { respuesta: respuestaFija(asistente, 'referencia_pasada', [bTexto(`«${cap.titulo}» mira lo que viene, no lo que ya ha pasado (${p.etiqueta}).`)], { tipo: 'respuesta', opciones: ejemplosConFechas(asistente) }) };
  }
  return { fecha: fechaCalculada(p, hoy, { texto: 'anterior' }), capacidad: cap };
}

/* P5 — «compara esta semana con la pasada» sin decir qué: se pregunta, ofreciendo SOLO capacidades que pueden
   mirar esos periodos (de su mismo tiempo, y que no comparan ya por sí mismas). El botón contesta cada
   periodo por separado, con la nota de que la diferencia no se calcula. */
function preguntaQueComparar(asistente, dos, validas, hoy, imposibles = []) {
  const futuras = validas.every((f) => f.desde > hoy);
  const candidatas = (asistente.capacidades || []).filter((c) => (c.periodo === 'rango' || c.periodo === 'ambos' || (c.periodo === 'dia' && c.siRango))
    && !c.dosPeriodos && ((c.tiempo || 'pasado') === 'futuro') === futuras && (!c.entidad || !c.entidad.obligatoria))
    /* Una capacidad de un día que con un rango pasa a su hermana daría lo mismo que ella: no se ofrece dos veces. */
    .filter((c, _, todas) => !(c.siRango && todas.some((x) => x.id === c.siRango)));
  const etiquetas = validas.slice(0, 2).map((f) => f.etiqueta).join(' y ');
  /* Fase 2.3 · B2 — lo que tiene métrica comparable se compara de verdad; solo lo demás va por separado. */
  const ofrecidas = candidatas.slice(0, MAX_OPCIONES);
  const conMetrica = ofrecidas.filter((c) => metricaPara(asistente, c));
  const todasConMetrica = !!dos && ofrecidas.length > 0 && conMetrica.length === ofrecidas.length;
  const notaDiferencia = todasConMetrica ? []
    : [bNota(dos && conMetrica.length ? 'De algunas cosas todavía no calculo la diferencia: de esas te enseñaré cada periodo por separado.' : 'Todavía no calculo la diferencia: te enseñaré cada periodo por separado.')];
  return {
    asistente: asistente.id, capacidad: 'comparar_que', tipo: 'aclaracion',
    bloques: [
      bTexto(`¿Qué quieres comparar de ${etiquetas}?`),
      ...imposibles.map((f) => bNota(`«${f.texto}» no es una fecha que exista, así que no la puedo mirar.`)),
      ...notaDiferencia,
    ],
    fuente: null, confianza: null, acciones: [],
    opciones: candidatas.slice(0, MAX_OPCIONES).map((c) => ({
      texto: c.titulo, mensaje: c.titulo,
      plan: dos ? { capacidad: c.id, entidad: null, periodos: dos.map((f) => ({ desde: f.desde, hasta: f.hasta, tipo: f.tipo, etiqueta: f.etiqueta })) }
        : { capacidad: c.id, entidad: null, periodo: { desde: validas[0].desde, hasta: validas[0].hasta, tipo: validas[0].tipo, etiqueta: validas[0].etiqueta } },
    })),
  };
}

function recordar(ctx, capacidad, args, respuesta = null) {
  ctx.ultima = { capacidad: capacidad.id, turno: ctx.turno };
  const pareja = respuesta && respuesta.tipo === 'respuesta' ? respuesta.periodosComparados : null;
  if (pareja) {
    /* 🐛 Fase 2.3 · B0 — una comparación se guarda como PAREJA: ni su unión pasa a ser «el periodo de la
       conversación» ni se pisa el periodo simple de antes. Lo que viene después la lee con
       `comparacionVigente` (pregunta de cuál de los dos, o desplaza los dos con «¿y la anterior?»). */
    const previos = ctx.ultimaRespuesta && ctx.ultimaRespuesta.turno === ctx.turno ? ctx.ultimaRespuesta.items : [];
    const item = { capacidad: capacidad.id, periodo: { ...pareja[0], porDefecto: false }, segundo: { ...pareja[1], porDefecto: false }, entidad: capacidad.entidad && args.entidad ? args.entidad : null, args: args.argsPropios || null };
    ctx.ultimaRespuesta = { turno: ctx.turno, items: [...previos, item].slice(-MAX_INTENCIONES) };
    if (capacidad.entidad && args.entidad) ctx.entidades[capacidad.entidad.tipo] = { entidad: args.entidad, turno: ctx.turno };
    return;
  }
  const periodo = respuesta && respuesta.periodoUsado ? respuesta.periodoUsado : args.periodo;
  if (periodo && !periodo.porDefecto) {
    /* v3.161.3 — el periodo de antes se guarda para «compáralo con lo de antes» (solo si cambia). */
    if (ctx.periodo && (ctx.periodo.desde !== periodo.desde || ctx.periodo.hasta !== periodo.hasta)) {
      ctx.periodoAnterior = ctx.periodo;
    }
    ctx.periodo = { ...periodo, tiempo: capacidad.tiempo || 'pasado' };
    ctx.periodoTurno = ctx.turno;
  }
  /* Fase 2.2 (P1) — lo que se contestó DE VERDAD en este turno: cada capacidad con el periodo que usó
     (también el puesto por defecto, marcado) y su entidad. Solo sirve para resolver una referencia explícita
     («¿y la anterior?»): la herencia automática de fechas sigue leyendo `ctx.periodo`, que no guarda los
     periodos por defecto. Con varias respuestas en el turno se guardan todas (como mucho MAX_INTENCIONES). */
  if (respuesta && respuesta.tipo === 'respuesta') {
    const previos = ctx.ultimaRespuesta && ctx.ultimaRespuesta.turno === ctx.turno ? ctx.ultimaRespuesta.items : [];
    const p = capacidad.periodo && periodo && periodo.desde && periodo.hasta
      ? { desde: periodo.desde, hasta: periodo.hasta, tipo: periodo.tipo || (periodo.desde === periodo.hasta ? 'dia' : 'rango'), etiqueta: periodo.etiqueta || null, porDefecto: !!periodo.porDefecto }
      : null;
    const item = { capacidad: capacidad.id, periodo: p, entidad: capacidad.entidad && args.entidad ? args.entidad : null };
    const repetido = previos.some((x) => x.capacidad === item.capacidad && (x.periodo && x.periodo.desde) === (p && p.desde) && (x.periodo && x.periodo.hasta) === (p && p.hasta));
    ctx.ultimaRespuesta = { turno: ctx.turno, items: repetido ? previos : [...previos, item].slice(-MAX_INTENCIONES) };
  }
  if (capacidad.entidad && args.entidad) ctx.entidades[capacidad.entidad.tipo] = { entidad: args.entidad, turno: ctx.turno };
  /* Fase 2.1 (A2) — si nombró algo que no existe, lo de antes deja de ser «de lo que hablamos»: la siguiente
     pregunta no puede heredarlo como si nada. */
  else if (capacidad.entidad && args.desconocida) delete ctx.entidades[capacidad.entidad.tipo];
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

/* ══════════════════════════════════════════════════════════════════════════
   11 · FASE 2.3 · B1 — EL COMPARADOR COMÚN DE MÉTRICAS
   ══════════════════════════════════════════════════════════════════════════
   Comparar dos periodos son siempre las mismas cuentas y las mismas reglas de honestidad, así que viven
   aquí una vez. Lo que cada asistente sabe de sus datos se queda en el asistente:

   · El asistente DECLARA lo que puede comparar (`asistente.metricas`, ver `validarMetrica`): nombre,
     unidad, tipo, si es un total o una media, si admite porcentaje, cuántos días con datos hacen falta
     y `calcular(datos, periodo, hoy)`, que reutiliza SU cálculo de siempre y devuelve una MEDIDA.
   · Una medida (`medidaDePeriodo`) es lo que sale de un periodo: su valor (`null` = no hay dato; un 0 es
     un 0 de verdad), cuántos días tienen datos, cuántos días abarca y si basta para fiarse.
   · `compararMedidas` hace las cuentas sobre dos medidas ya calculadas —nunca sobre un texto— y devuelve
     el resultado estructurado y los bloques para el chat. Nunca juzga: «más» y «menos», no «mejor».

   Reglas (decisiones D1, D3 y D5 de Josué):
   · Un periodo sin dato no es un 0: no se calcula ni diferencia ni porcentaje, y se dice cuál falta.
   · Con menos días con datos de los que pide la métrica, no se compara y se dice cuántos hay.
   · El porcentaje, solo si la métrica lo admite y la referencia (el segundo periodo) es mayor que 0.
   · Periodos de distinta duración o uno que no ha terminado: se comparan los valores tal cual y se dicen
     las fechas y los días de cada uno; nunca se pasa a «por día» por cuenta propia.
   · La pareja de periodos sale tal cual (`periodosComparados`) para que la conversación la recuerde como
     pareja (B0), nunca unida en un solo intervalo. */

export const TIPOS_DE_METRICA = ['entero', 'decimal'];
export const AGREGACIONES_DE_METRICA = ['total', 'media'];

/** Una medida de un periodo, con su forma. `valor` null = no hay dato (nunca se convierte en 0). */
export function medidaDePeriodo({ periodo, valor = null, diasConDatos = null, diasDelPeriodo = null, suficiente = true, motivo = null, notas = [], unidad = null, detalle = null } = {}) {
  const v = typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
  const n = (x) => (Number.isInteger(x) && x >= 0 ? x : null);
  const p = periodoValido(periodo) ? { desde: periodo.desde, hasta: periodo.hasta, tipo: periodo.tipo || (periodo.desde === periodo.hasta ? 'dia' : 'rango'), etiqueta: periodo.etiqueta || null } : null;
  return {
    periodo: p,
    valor: v,
    diasConDatos: n(diasConDatos),
    diasDelPeriodo: n(diasDelPeriodo) ?? (p ? diasDelRango(p.desde, p.hasta) : null),
    suficiente: suficiente !== false,
    motivo: motivo || null,
    notas: (Array.isArray(notas) ? notas : []).filter((t) => typeof t === 'string' && t),
    unidad,
    /* B2 — lo que dice la cifra debajo («en 3 días de 5») cuando «días con datos» no es lo que cuenta la
       métrica (un recuento de entrenamientos no tiene «días con datos», tiene días con entrenamiento). */
    detalle: typeof detalle === 'string' && detalle ? detalle : null,
  };
}

/** Lo que le falta a la declaración de una métrica para poder compararla (lista vacía = válida). */
export function validarMetrica(m) {
  const errores = [];
  if (!m || typeof m !== 'object') return ['no es una métrica'];
  if (!m.id || typeof m.id !== 'string') errores.push('id');
  if (!m.nombre || typeof m.nombre !== 'string') errores.push('nombre');
  if (!TIPOS_DE_METRICA.includes(m.tipo)) errores.push('tipo');
  if (!AGREGACIONES_DE_METRICA.includes(m.agregacion)) errores.push('agregacion');
  if (typeof m.admitePorcentaje !== 'boolean') errores.push('admitePorcentaje');
  if (m.minimoDias !== undefined && !(Number.isInteger(m.minimoDias) && m.minimoDias >= 0)) errores.push('minimoDias');
  if (m.diasParaFiable !== undefined && !(Number.isInteger(m.diasParaFiable) && m.diasParaFiable >= 0)) errores.push('diasParaFiable');
  const u = m.unidad;
  const unidadValida = u === null || typeof u === 'string' || (u && typeof u.singular === 'string' && typeof u.plural === 'string');
  if (!unidadValida && typeof m.formatear !== 'function') errores.push('unidad');
  if (m.comparable !== false && typeof m.calcular !== 'function') errores.push('calcular');
  return errores;
}

/** Las métricas que un asistente puede comparar DE VERDAD: declaradas, válidas y no marcadas como no comparables. */
export function metricasComparables(asistente) {
  return (Array.isArray(asistente && asistente.metricas) ? asistente.metricas : [])
    .filter((m) => m && m.comparable !== false && !validarMetrica(m).length);
}

/**
 * Fase 2.3 · B2 — la métrica con la que se compara una pregunta: una de las que su capacidad declara
 * (`capacidad.metricas`) y el asistente puede comparar. Manda la que ya se estaba comparando (al seguir la
 * conversación), luego la que nombra el mensaje (`metrica.concepto`) y si no, la primera de la capacidad.
 * Sin ninguna, `null`: esa pregunta no se compara (y se contesta cada periodo por separado, como antes).
 */
export function metricaPara(asistente, capacidad, trozo = {}) {
  const ids = Array.isArray(capacidad && capacidad.metricas) ? capacidad.metricas : [];
  if (!ids.length) return null;
  const posibles = metricasComparables(asistente).filter((m) => ids.includes(m.id));
  if (!posibles.length) return null;
  const heredada = trozo.argsHeredados && trozo.argsHeredados.metrica;
  const conceptos = trozo.conceptos instanceof Map ? trozo.conceptos : new Map();
  return posibles.find((m) => m.id === heredada)
    || posibles.find((m) => m.concepto && conceptos.has(m.concepto))
    || posibles.find((m) => m.id === ids[0]) || posibles[0];
}

/* Un número para leer: sin errores de coma flotante, con los decimales de la métrica y sin ceros de más. */
const limpiar = (x) => Number(Number(x).toPrecision(12));
export function numeroLegible(x, decimales = 0) {
  if (typeof x !== 'number' || !Number.isFinite(x)) return null;
  const d = Math.max(0, Math.min(4, Number.isInteger(decimales) ? decimales : 0));
  const r = limpiar(Math.round(limpiar(x) * 10 ** d) / 10 ** d);
  const fija = r.toFixed(d);
  const t = fija.includes('.') ? fija.replace(/0+$/, '').replace(/\.$/, '') : fija;
  return (t === '-0' ? '0' : t).replace('.', ',');
}
const decimalesDe = (m) => (Number.isInteger(m.decimales) ? m.decimales : (m.tipo === 'entero' ? 0 : 1));
function valorConUnidad(m, v) {
  if (typeof m.formatear === 'function') return m.formatear(v);
  const n = numeroLegible(v, decimalesDe(m));
  const u = m.unidad;
  if (!u) return n;
  if (typeof u === 'string') return `${n} ${u}`;
  return `${n} ${Math.abs(limpiar(v)) === 1 ? u.singular : u.plural}`;
}
/* El porcentaje para leer: entero desde el 10 %, con un decimal por debajo. */
const porcentajeLegible = (p) => `${numeroLegible(Math.abs(p), Math.abs(p) >= 10 ? 0 : 1)} %`;

/**
 * Compara dos medidas ya calculadas de la misma métrica: `a` es el periodo que se pregunta (esta semana) y
 * `b` la referencia (la pasada). Devuelve `estado` ('comparable' | 'sin_datos' | 'insuficiente' |
 * 'no_comparable'), las cifras, la diferencia (a − b), el porcentaje (o por qué no hay), las notas, los
 * `bloques` para el chat y `periodosComparados` para la conversación (B0).
 */
export function compararMedidas(metrica, a, b, { hoy = null } = {}) {
  const base = { metrica: metrica && metrica.id ? metrica.id : null, a: a || null, b: b || null, diferencia: null, sentido: null, porcentaje: null, sinPorcentaje: null, notas: [], confianza: null };
  const errores = validarMetrica({ calcular: () => null, ...(metrica || {}) });
  const ma = a && a.periodo ? a : null;
  const mb = b && b.periodo ? b : null;
  const ea = ma ? etiquetaDe(ma.periodo, hoy || ma.periodo.hasta) : null;
  const eb = mb ? etiquetaDe(mb.periodo, hoy || mb.periodo.hasta) : null;
  const pareja = ma && mb ? [ma.periodo, mb.periodo] : null;
  const fin = (estado, bloques, extra = {}) => ({ ...base, ...extra, estado, bloques, periodosComparados: pareja, etiquetas: [ea, eb] });
  const nombre = metrica && metrica.nombre ? metrica.nombre : 'Esto';
  if (errores.length || metrica.comparable === false) {
    return fin('no_comparable', [bTexto(`«${nombre}» no lo puedo comparar entre dos periodos${metrica && metrica.motivoNoComparable ? `: ${metrica.motivoNoComparable}` : '.'}`)]);
  }
  if (!ma || !mb) return fin('no_comparable', [bTexto(`Para comparar «${nombre.toLowerCase()}» necesito dos periodos con sus fechas.`)]);
  if (ma.periodo.desde === mb.periodo.desde && ma.periodo.hasta === mb.periodo.hasta) {
    return fin('no_comparable', [bTexto(`Has nombrado dos veces el mismo periodo (${ea}). Dime con qué otro lo comparo.`)]);
  }
  for (const m of [ma, mb]) {
    if (m.unidad !== null && m.unidad !== undefined && JSON.stringify(m.unidad) !== JSON.stringify(metrica.unidad ?? null)) {
      return fin('no_comparable', [bTexto(`No puedo comparar «${nombre.toLowerCase()}»: los dos periodos no vienen en la misma unidad.`)]);
    }
  }
  /* Sin dato no es 0 (D5): se dice qué periodo no tiene, y no se calcula nada. */
  const sinDato = [[ma, ea], [mb, eb]].filter(([m]) => m.valor === null);
  if (sinDato.length) {
    const cuales = sinDato.map(([m, e]) => `${e}${m.motivo ? ` (${m.motivo})` : ''}`);
    return fin('sin_datos', [
      bTexto(`No puedo comparar «${nombre.toLowerCase()}»: ${sinDato.length === 2 ? `ni ${cuales[0]} ni ${cuales[1]} tienen datos` : `${cuales[0]} no tiene datos`}.`),
      bNota('Un periodo sin registros no cuenta como cero: simplemente no hay datos.'),
    ]);
  }
  /* Con menos días con datos de los que pide la métrica, no se compara (D5) y se dice cuántos hay. */
  const minimo = Number.isInteger(metrica.minimoDias) ? metrica.minimoDias : 0;
  const cortos = [[ma, ea], [mb, eb]].filter(([m]) => m.suficiente === false || (minimo && m.diasConDatos !== null && m.diasConDatos < minimo));
  if (cortos.length) {
    return fin('insuficiente', [
      bTexto(`No puedo comparar «${nombre.toLowerCase()}» de forma fiable: ${cortos.map(([m, e]) => `${e} ${m.diasConDatos === null ? 'no tiene datos suficientes' : `solo tiene ${plural(m.diasConDatos, 'día', 'días')} con datos`}`).join(' y ')}${minimo ? `, y hacen falta al menos ${minimo}` : ''}.`),
      ...cortos.filter(([m]) => m.motivo).map(([m, e]) => bNota(`${mayuscula(e)}: ${m.motivo}`)),
    ]);
  }
  const va = limpiar(ma.valor);
  const vb = limpiar(mb.valor);
  const diferencia = limpiar(va - vb);
  const d = decimalesDe(metrica);
  const igual = numeroLegible(Math.abs(diferencia), d) === '0';
  const sentido = igual ? 'igual' : (diferencia > 0 ? 'mas' : 'menos');
  let porcentaje = null;
  let sinPorcentaje = null;
  if (!igual) {
    if (!metrica.admitePorcentaje) sinPorcentaje = 'no_admite';
    else if (vb === 0) sinPorcentaje = 'referencia_cero';
    else if (vb < 0) sinPorcentaje = 'referencia_negativa';
    else porcentaje = limpiar((diferencia / vb) * 100);
  }
  const notas = [];
  if (sinPorcentaje === 'referencia_cero') notas.push(`No calculo un porcentaje: ${eb} el valor es 0 y no hay de dónde partir.`);
  if (sinPorcentaje === 'referencia_negativa') notas.push(`No calculo un porcentaje: ${eb} el valor es negativo.`);
  const duracion = (m) => m.diasDelPeriodo;
  if (duracion(ma) !== null && duracion(mb) !== null && duracion(ma) !== duracion(mb)) {
    notas.push(`Los periodos no duran lo mismo (${plural(duracion(ma), 'día', 'días')} y ${plural(duracion(mb), 'día', 'días')})${metrica.agregacion === 'total' ? ': comparo los totales tal cual, sin pasarlos a días' : ''}.`);
  }
  for (const [m, e] of [[ma, ea], [mb, eb]]) {
    if (hoy && m.periodo.hasta >= hoy && m.periodo.desde <= hoy) notas.push(`${mayuscula(e)} sigue en curso: cuenta lo registrado hasta hoy.`);
  }
  if (ma.periodo.desde <= mb.periodo.hasta && mb.periodo.desde <= ma.periodo.hasta) notas.push('Los dos periodos comparten días, así que la diferencia dice menos.');
  const fiable = Number.isInteger(metrica.diasParaFiable) ? metrica.diasParaFiable : 0;
  const pocos = fiable && [ma, mb].some((m) => m.diasConDatos !== null && m.diasConDatos < fiable);
  if (pocos) notas.push('Con tan pocos días con datos en uno de los dos, la diferencia dice poco.');
  for (const m of [ma, mb]) notas.push(...m.notas);
  const conDias = (m) => m.detalle || (m.diasConDatos !== null ? `${plural(m.diasConDatos, 'día', 'días')} con datos de ${m.diasDelPeriodo}` : null);
  const frase = igual
    ? `${nombre}: ${valorConUnidad(metrica, va)} ${ea} y lo mismo ${eb}.`
    : `${nombre}: ${valorConUnidad(metrica, va)} ${ea} y ${valorConUnidad(metrica, vb)} ${eb}. Son ${valorConUnidad(metrica, Math.abs(diferencia))} ${sentido === 'mas' ? 'más' : 'menos'} ${ea}${porcentaje !== null ? `, un ${porcentajeLegible(porcentaje)} ${sentido === 'mas' ? 'más' : 'menos'}` : ''}.`;
  const bloques = [
    bTexto(frase),
    bCifra(mayuscula(ea), valorConUnidad(metrica, va), 'calculo', conDias(ma)),
    bCifra(mayuscula(eb), valorConUnidad(metrica, vb), 'calculo', conDias(mb)),
    ...notas.map(bNota),
    bNota('Es solo la diferencia entre los dos periodos: no dice si es bueno o malo ni a qué se debe.'),
  ];
  return fin('comparable', bloques, { diferencia, sentido, porcentaje, sinPorcentaje, notas, confianza: pocos ? 'pocos_datos' : 'normal' });
}

/**
 * Calcula una métrica declarada en los dos periodos con la función del propio asistente y los compara.
 * Un fallo al calcular no tumba el chat: el periodo queda sin dato y se dice.
 */
export function compararMetrica(metrica, datos, [pa, pb] = [], { hoy = null } = {}) {
  if (validarMetrica(metrica).length || metrica.comparable === false) return compararMedidas(metrica, null, null, { hoy });
  const medir = (p) => {
    if (!periodoValido(p)) return null;
    try {
      const r = metrica.calcular(datos, p, hoy);
      return medidaDePeriodo({ ...(r || {}), periodo: { ...p, ...(r && r.periodo ? r.periodo : {}) } });
    } catch (error) {
      registrarErrorAsistente('nucleo', `metrica:${metrica.id}`, error);
      return medidaDePeriodo({ periodo: p, valor: null, motivo: 'no he podido calcularlo' });
    }
  };
  return compararMedidas(metrica, medir(pa), medir(pb), { hoy });
}
