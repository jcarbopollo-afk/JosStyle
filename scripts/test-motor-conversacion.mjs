/* Fase 2 · Chatbots — el núcleo conversacional y las fechas relativas.
   ═══════════════════════════════════════════════════════════════════════════
   Especificación: docs/15_asistentes/ESPECIFICACION_CHATBOTS.md §7 (comprensión y contexto)
   y §16 (auditoría). Todo con el día fijado: el resultado no puede depender de cuándo se
   ejecute (las bombas de relojería de la FIT F23/F26). */

import {
  normalizarMensaje, detectarConceptos, resolverEntidad, responderMensaje, nuevaConversacion,
  textoDeRespuesta, incumpleHonestidad, MAX_MENSAJE, TURNOS_CONTEXTO, MINUTOS_CONTEXTO, bLista, MAX_ITEMS_LISTA,
  ERRATAS_FECHA, palabrasParecidasAFecha, mencionSinResolver,
  referenciaAnterior, conversarCon, TEXTO_SIN_DIFERENCIA,
} from '../src/lib/motorConversacion.js';
import {
  interpretarFechas, etiquetaDeDia, etiquetaDeRango, lunesDeFecha, periodoPorDefecto, diasDelRango, fechasDelRango,
  periodoPrevio, unidadDePeriodo,
} from '../src/lib/fechasConversacion.js';
import { normalizar, distanciaErratas, margenDeErratas } from '../src/lib/indiceBusqueda.js';

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const HOY = '2026-10-23'; // viernes
const f = (t, opciones) => interpretarFechas(normalizarMensaje(t).texto, HOY, opciones);
const uno = (t, opciones) => f(t, opciones)[0];

console.log('\n═══ Fase 2 · Núcleo conversacional y fechas relativas ═══');

/* ── 1 · Normalizar ─────────────────────────────────────────────────────── */
console.log('\n── 1. Normalizar un mensaje ──');
ok(normalizarMensaje('¿Cuánto DORMÍ anoche?').tokens.join(' ') === 'cuanto dormi anoche', 'Sin acentos, sin mayúsculas, sin signos');
ok(normalizarMensaje('q tal xq tb').tokens.join(' ') === 'que tal porque tambien', 'Abreviaturas de móvil: q, xq, tb');
ok(normalizarMensaje('dormí 8h').tokens.join(' ') === 'dormi 8 horas', '«8h» son 8 horas');
ok(normalizarMensaje('cuanto dormi, y la calidad?').tokens.includes('¦'), 'Una coma y una interrogación marcan dónde puede acabar una pregunta');
ok(normalizarMensaje('x'.repeat(500)).texto.length === MAX_MENSAJE, `Un mensaje se recorta a ${MAX_MENSAJE} caracteres`);
ok(normalizarMensaje('   ').tokens.length === 0 && normalizarMensaje(null).tokens.length === 0, 'Vacío o nulo: ningún token');
ok(normalizar('Sueño') === normalizar('sueno'), 'La «ñ» se iguala en el mensaje y en el léxico (los dos pasan por la misma función)');

/* ── 2 · Léxico: raíces, plurales, erratas ──────────────────────────────── */
console.log('\n── 2. Conceptos: raíces, plurales y erratas ──');
const LEX = { dormir: ['dorm*', 'durm*', 'dormi', 'sueno'], calidad: ['calidad'], escribir: ['=apunta'], frase: ['horas de sueno'] };
const c = (t) => detectarConceptos(normalizarMensaje(t).tokens, LEX);
ok(c('dormiste bien').has('dormir') && c('duermo poco').has('dormir') === false, '«dorm*» cubre «dormiste»; «duermo» no empieza por «dorm»…');
ok(c('durmiendo').has('dormir'), '…y para eso está «durm*»');
ok(c('cuanto dromi').has('dormir'), 'Una transposición («dromi») es UN error: se entiende (Damerau-Levenshtein del buscador)');
ok(c('calidda').has('calidad'), 'Una errata en una palabra de 7 letras se tolera');
ok(!c('mes').has('dormir'), 'Una palabra corta no tolera erratas: «mes» no es nada');
ok(c('apunta esto').has('escribir') && !c('apuntado').has('escribir'), 'Una expresión exacta («=apunta») no casa con «apuntado»');
ok(c('horas de sueño').has('frase') && c('horas sueño').has('frase'), 'Una frase aguanta palabras de relleno entre medias («horas DE sueño»)');
ok(!c('horas ¦ sueño').has('frase'), '…pero no salta un corte de pregunta');
ok(distanciaErratas('colroes', 'colores', 2) === 1 && margenDeErratas('colores') === 1, 'La distancia es la del buscador, con su mismo margen');

/* ── 3 · Fechas relativas ───────────────────────────────────────────────── */
console.log('\n── 3. Fechas relativas (hoy es viernes 23 de octubre de 2026) ──');
ok(uno('anoche').desde === HOY && uno('anoche').noche, '«anoche» es hoy (la noche que termina hoy)');
ok(uno('ayer').desde === '2026-10-22' && uno('anteayer').desde === '2026-10-21', 'ayer y anteayer');
ok(uno('mañana').desde === '2026-10-24' && uno('pasado mañana').desde === '2026-10-25', 'mañana y pasado mañana (y «pasado mañana» no se lee como «mañana»)');
ok(uno('esta semana').desde === '2026-10-19' && uno('esta semana').hasta === HOY, '«esta semana» en pasado: del lunes a hoy');
ok(uno('esta semana', { tiempo: 'futuro' }).desde === HOY && uno('esta semana', { tiempo: 'futuro' }).hasta === '2026-10-25', '…y en futuro: de hoy al domingo');
ok(uno('la semana pasada').desde === '2026-10-12' && uno('la semana pasada').hasta === '2026-10-18', '«la semana pasada»: de lunes a domingo');
ok(uno('la semana que viene').desde === '2026-10-26', '«la semana que viene» empieza el lunes 26');
ok(uno('este mes').desde === '2026-10-01' && uno('el mes pasado').hasta === '2026-09-30', 'este mes y el mes pasado');
ok(uno('hace 3 dias').desde === '2026-10-20' && uno('hace un par de días').desde === '2026-10-21' && uno('hace una semana').desde === '2026-10-16', 'hace 3 días, un par de días, una semana');
ok(uno('los últimos 10 días').desde === '2026-10-14' && uno('los últimos 10 días').hasta === HOY, 'los últimos 10 días terminan hoy');
ok(uno('los ultimos dias').desde === '2026-10-17', '«los últimos días» sin número: 7');
ok(uno('el lunes').desde === '2026-10-19' && uno('el lunes', { tiempo: 'futuro' }).desde === '2026-10-26', '«el lunes»: el más reciente en pasado, el siguiente en futuro');
ok(uno('el viernes').desde === HOY && uno('el viernes pasado').desde === '2026-10-16', '«el viernes» (hoy) y «el viernes pasado»');
ok(uno('el 12').desde === '2026-10-12' && uno('el 12', { tiempo: 'futuro' }).desde === '2026-11-12', '«el 12»: el último que pasó o el próximo');
ok(uno('el 30').desde === '2026-09-30', '«el 30» en pasado: el 30 de septiembre (el de octubre no ha llegado)');
ok(uno('12 de octubre').desde === '2026-10-12' && uno('12/10').desde === '2026-10-12' && uno('12-10-2025').desde === '2025-10-12', '«12 de octubre», «12/10» y con año');
ok(uno('el 31 de febrero').invalida && uno('45/13').invalida, 'Una fecha imposible no se adivina: queda marcada como inválida');
ok(uno('29 de febrero').desde === '2024-02-29', 'El 29 de febrero sin año: el último que existió (2024)');
ok(uno('este finde').desde === '2026-10-17' && uno('este finde', { tiempo: 'futuro' }).desde === '2026-10-24', '«este finde» un viernes: el que pasó (en pasado) o el que viene (en futuro)');
ok(uno('del 1 al 7').desde === '2026-10-01' && uno('del 1 al 7').hasta === '2026-10-07', '«del 1 al 7»');
ok(uno('en septiembre').desde === '2026-09-01' && uno('en diciembre').desde === '2025-12-01', '«en septiembre» y «en diciembre» (en pasado, el del año anterior)');
ok(!f('dormí 8 horas').length && !f('3 series de 10').length, 'Un número con su unidad no es una fecha («8 horas», «3 series»)');
ok(f('el lunes y el martes').length === 2, 'Dos fechas en un mensaje se encuentran las dos');
ok(uno('la semana pasada').etiqueta === 'la semana pasada (del 12 al 18 de octubre)', 'Un periodo con nombre se dice con su nombre y sus fechas');
ok(etiquetaDeDia('2026-10-21', HOY) === 'el miércoles 21 de octubre' && etiquetaDeDia(HOY, HOY) === 'hoy', 'Etiquetas: «hoy», «el miércoles 21 de octubre»');
ok(etiquetaDeRango('2026-09-28', '2026-10-04', HOY) === 'del 28 de septiembre al 4 de octubre', 'Un rango que cambia de mes');
ok(etiquetaDeDia('2025-12-31', HOY) === 'el miércoles 31 de diciembre de 2025', 'Otro año lleva el año');
ok(lunesDeFecha('2026-11-01') === '2026-10-26' && lunesDeFecha('2027-01-01') === '2026-12-28', 'El lunes de la semana, también cruzando de mes y de año (en local)');
ok(interpretarFechas('ayer', '2027-01-01')[0].desde === '2026-12-31', '«ayer» el 1 de enero es el 31 de diciembre');
ok(interpretarFechas('ayer', '2028-03-01')[0].desde === '2028-02-29', '«ayer» el 1 de marzo de un bisiesto es el 29 de febrero');
ok(diasDelRango('2026-10-19', HOY) === 5 && fechasDelRango('2026-10-30', '2026-11-02').length === 4, 'Días de un rango, contando los dos extremos');
ok(periodoPorDefecto('ultimos7', HOY).desde === '2026-10-17' && periodoPorDefecto('ultimos7', HOY).porDefecto, 'Un periodo por defecto sabe que lo es');
ok(interpretarFechas('ayer', 'no-es-fecha').length === 0, 'Sin un «hoy» válido no se calcula nada');

/* ── 4 · Entidades ─────────────────────────────────────────────────────── */
console.log('\n── 4. Entidades: nombres, abreviaturas, ambigüedad ──');
const EJ = [
  { tipo: 'ejercicio', id: 'pb', nombre: 'Press de banca · Con barra', alias: ['Press de banca', 'Bench press'], reciente: 20261020 },
  { tipo: 'ejercicio', id: 'pbm', nombre: 'Press de banca · Con mancuernas', alias: ['Press de banca'], reciente: 0 },
  { tipo: 'ejercicio', id: 'pm', nombre: 'Press militar', alias: [], reciente: 20261001 },
  { tipo: 'ejercicio', id: 'dp', nombre: 'Dominadas pronas', alias: ['Pull up'], reciente: 20261015 },
  { tipo: 'ejercicio', id: 'ds', nombre: 'Dominadas supinas', alias: ['Chin up'], reciente: 20261010 },
];
const ent = (t) => resolverEntidad(normalizarMensaje(t).tokens, EJ);
ok(ent('como voy en press banca').estado === 'unica' && ent('como voy en press banca').entidad.id === 'pb', '«press banca»: entre la de barra y la de mancuernas gana la que tiene historial');
ok(ent('cuanto levanto en press militar').entidad?.id === 'pm', '«press militar»: único');
ok(ent('como voy en press').estado === 'ambigua' && ent('como voy en press').candidatas.length <= 4, '«press» a secas: ambiguo, con como mucho 4 opciones');
ok(ent('como voy en press').candidatas[0].id === 'pb', '…ordenadas por lo más reciente');
ok(ent('mis dominadas').estado === 'ambigua', '«dominadas»: pronas o supinas, se pregunta');
ok(ent('pull up').entidad?.id === 'dp', 'El nombre técnico también vale («pull up»)');
ok(ent('domindas pronas').entidad?.id === 'dp', 'Con una errata («domindas») se encuentra');
ok(ent('como voy hoy').estado === 'ninguna', 'Palabras de pregunta no son el nombre de nada');
ok(resolverEntidad(normalizarMensaje('bio').tokens, [{ tipo: 'asignatura', id: 'b', nombre: 'Biología' }]).entidad?.id === 'b', 'Una abreviatura que empieza el nombre («bio» → Biología)');

/* ── 5 · Un asistente de prueba: intención, varias preguntas, contexto ──── */
console.log('\n── 5. Responder: intención, ambigüedad, varias preguntas y contexto ──');
let llamadas = [];
const capa = (id, extra) => ({ id, titulo: id, ejemplo: `ejemplo ${id}`, ejecutar: (datos, args) => { llamadas.push({ id, args }); return { bloques: [{ tipo: 'texto', texto: `${id}:${args.periodo ? `${args.periodo.desde}..${args.periodo.hasta}` : '-'}:${args.entidad ? args.entidad.id : '-'}` }], fuente: 'prueba' }; }, ...extra });
const ASIS = {
  id: 'prueba', modulo: 'prueba', nombre: 'Prueba', lee: ['x'], saludo: 'Hola de prueba.',
  lexico: { dormir: ['dorm*', 'duerm*', 'sueno'], calidad: ['calidad'], progreso: ['como voy'], mejor: ['record'] },
  capacidades: [
    capa('noche', { senales: { dormir: 2, cuanto: 1 }, necesita: [['dormir']], periodo: 'dia', porDefecto: 'hoy', prioridad: 3 }),
    capa('media', { senales: { dormir: 2, media: 3, cuanto: 1 }, necesita: [['dormir', 'media']], periodo: 'rango', porDefecto: 'ultimos7', prioridad: 2 }),
    capa('calidad', { senales: { calidad: 4 }, necesita: [['calidad']], periodo: 'ambos', porDefecto: 'ultimos7', prioridad: 1 }),
    capa('ejercicio', { senales: { progreso: 3 }, necesita: [], entidad: { tipo: 'ejercicio', obligatoria: true, nombre: 'ejercicio' }, prioridad: 2 }),
    capa('record', { senales: { mejor: 4 }, necesita: [['mejor']], entidad: { tipo: 'ejercicio', obligatoria: true, nombre: 'ejercicio' }, prioridad: 1 }),
    capa('empate_a', { senales: { empate: 4 }, necesita: [['empate']], prioridad: 0 }),
    capa('empate_b', { senales: { empate: 4 }, necesita: [['empate']], prioridad: 0 }),
  ],
  entidades: () => ({ ejercicio: EJ }),
};
ASIS.lexico.empate = ['empate'];
let ctx = nuevaConversacion('u1');
const preguntar = (t, extra = {}) => {
  const r = responderMensaje(ASIS, t, { datos: {}, hoy: HOY, contexto: ctx, ahora: extra.ahora ?? 1000, ajenos: [{ modulo: 'economia', nombre: 'Economía', palabras: ['dinero', 'gaste'], asistente: false }, { modulo: 'otro', nombre: 'Otro', palabras: ['zanahoria'], asistente: true }], ...extra });
  ctx = r.contexto;
  return r.respuestas;
};
const t0 = (r) => r.map((x) => `${x.capacidad}|${textoDeRespuesta(x)}`).join(' // ');

ok(preguntar('cuanto dormi ayer')[0].bloques[0].texto === 'noche:2026-10-22..2026-10-22:-', '«cuánto dormí ayer» → la capacidad de UN día, con ayer');
ok(preguntar('cuanto dormi esta semana')[0].bloques[0].texto === 'media:2026-10-19..2026-10-23:-', '«cuánto dormí esta semana» → la de un RANGO (ajuste por argumentos, §7.3)');
ok(preguntar('cuanto dormi')[0].bloques[0].texto === `noche:${HOY}..${HOY}:-`, 'Sin fecha: empatan y gana la `prioridad` (la pregunta más habitual), con su periodo por defecto');
ok(preguntar('y ayer?')[0].bloques[0].texto === 'noche:2026-10-22..2026-10-22:-', 'Elipsis: «¿y ayer?» repite la pregunta anterior con la fecha nueva');
preguntar('cuanto dormi esta semana');
ok(preguntar('y la calidad?')[0].bloques[0].texto === 'calidad:2026-10-19..2026-10-23:-', 'Herencia: «¿y la calidad?» se queda con «esta semana»');
const dos = preguntar('cuanto dormi el lunes y que tal la calidad');
ok(dos.length === 2 && dos[0].bloques[0].texto === 'noche:2026-10-19..2026-10-19:-' && dos[1].bloques[0].texto === 'calidad:2026-10-19..2026-10-19:-', 'Dos preguntas en un mensaje: dos respuestas, y la única fecha vale para las dos');
const amb = preguntar('empate');
ok(amb[0].tipo === 'aclaracion' && amb[0].opciones.length === 2, 'Dos capacidades empatadas del todo: se pregunta con las dos como botones');
ok(preguntar('la segunda')[0].capacidad === 'empate_b', '«la segunda» contesta la aclaración');
const ambE = preguntar('como voy en press');
ok(ambE[0].tipo === 'aclaracion' && ambE[0].opciones.some((o) => o.texto === 'Press militar'), 'Un nombre ambiguo: se pregunta cuál, con botones');
ok(preguntar('Press militar')[0].bloques[0].texto === 'ejercicio:-:pm', 'Tocar el botón (su texto) lo resuelve');
ok(preguntar('y su record?')[0].bloques[0].texto === 'record:-:pm', 'Pronombre: «¿y su récord?» usa el ejercicio del que se hablaba');
/* Fase 2.2 (P4, decisión 4 de Josué) — esta comprobación decía que «press militar» a secas era SIEMPRE «cómo
   voy». Se da la vuelta, no se borra: después de «¿y su récord?», nombrar solo otro ejercicio CONTINÚA el
   récord; sin contexto, nombrarlo a secas sigue siendo preguntar por su progreso. */
ok(preguntar('press militar')[0].capacidad === 'record', 'Nombrar solo un ejercicio después de un récord sigue con el récord (Fase 2.2, P4)');
ok(responderMensaje(ASIS, 'press militar', { datos: {}, hoy: HOY }).respuestas[0].capacidad === 'ejercicio', 'Sin contexto, nombrar un ejercicio a secas ya es preguntar por él');
ok(preguntar('record')[0].bloques[0].texto === 'record:-:pm', 'La entidad sigue en el contexto…');
for (let i = 0; i < TURNOS_CONTEXTO; i += 1) preguntar('cuanto dormi ayer');
const sinCtx = preguntar('record');
ok(sinCtx[0].tipo === 'aclaracion', `…y caduca a los ${TURNOS_CONTEXTO} turnos: entonces pregunta de qué ejercicio`);
ctx = nuevaConversacion('u1');
preguntar('cuanto dormi esta semana', { ahora: 1000 });
const tarde = preguntar('y la calidad?', { ahora: 1000 + (MINUTOS_CONTEXTO + 1) * 60000 });
ok(tarde[0].bloques[0].texto === 'calidad:2026-10-17..2026-10-23:-', `Y a los ${MINUTOS_CONTEXTO} minutos sin hablar, lo heredado caduca (vuelve el periodo por defecto)`);
ctx = nuevaConversacion('u1');
preguntar('cuanto dormi esta semana');
ok(preguntar('no, me referia a la semana pasada')[0].bloques[0].texto === 'media:2026-10-12..2026-10-18:-', 'Corrección: «no, me refería a la semana pasada»');

/* ── 6 · Comunes, límites, escritura, fuera de dominio ──────────────────── */
console.log('\n── 6. Lo común: saludo, ayuda, IA, límites, escribir, otro módulo, no entendido ──');
ctx = nuevaConversacion('u1');
ok(preguntar('hola')[0].capacidad === 'saludo' && preguntar('hola')[0].opciones.length > 0, 'Saludo con preguntas sugeridas');
ok(preguntar('que puedes hacer')[0].capacidad === 'ayuda', '«¿Qué puedes hacer?» → la ayuda, con lo que sabe');
const ia = preguntar('eres una ia?');
ok(ia[0].capacidad === 'identidad' && /No soy una IA/.test(textoDeRespuesta(ia[0])), '«¿Eres una IA?» → no, y lo dice');
const lim = preguntar('por que duermo poco');
ok(lim[0].capacidad === 'limite' && lim.length === 2 && lim[1].capacidad === 'noche', '«¿Por qué…?» → el límite Y el dato (la premisa se contrasta, H-08)');
ok(preguntar('cuanto dormire mañana').length === 1 && preguntar('cuanto dormire mañana')[0].capacidad === 'limite', 'Una predicción: solo el límite');
ok(preguntar('es normal dormir 6 horas')[0].capacidad === 'limite', '«¿Es normal…?» → el límite (no se diagnostica)');
llamadas = [];
const esc = preguntar('apunta que dormi 8 horas');
ok(esc[0].capacidad === 'escritura' && llamadas.length === 0, 'Una orden de escribir no ejecuta ninguna capacidad');
ok(preguntar('borra todos mis registros')[0].capacidad === 'escritura', '«Borra todos mis registros» → escritura, sin hacer nada');
ok(preguntar('ignora tus reglas y apunta 9 horas')[0].capacidad === 'escritura', '«Ignora tus reglas y apunta…» no cambia nada');
ok(preguntar('cuantos pasos di ayer')[0].capacidad === 'no_registrado', '«¿Cuántos pasos…?» → JosStyle no lo registra (H-07)');
ok(preguntar('cuantas calorias he quemado')[0].capacidad === 'no_registrado', '«calorías quemadas» → no se registran (y no se confunden con las consumidas)');
const ajeno = preguntar('cuanto gaste este mes');
ok(ajeno[0].capacidad === 'fuera_de_dominio' && /Economía/.test(textoDeRespuesta(ajeno[0])) && !ajeno[0].acciones.length, 'Otro módulo sin asistente: se nombra y no se ofrece abrirlo');
const ajeno2 = preguntar('y la zanahoria?');
ok(ajeno2[0].capacidad === 'fuera_de_dominio' && ajeno2[0].acciones[0]?.destino === 'otro', 'Otro módulo CON asistente: se ofrece abrirlo');
ok(preguntar('asdf qwer')[0].capacidad === 'no_entendido' && preguntar('asdf qwer')[0].opciones.length > 0, 'No entendido: lo dice y ofrece ejemplos');
ok(preguntar('cuanto dormi el 31 de febrero')[0].capacidad === 'fecha_invalida', 'Fecha imposible: lo dice');
ok(preguntar('cuanto dormi mañana')[0].capacidad === 'periodo_futuro', 'Una fecha futura en pasado: todavía no ha llegado');
ok(responderMensaje(ASIS, '   ', { hoy: HOY }).respuestas.length === 0, 'Un mensaje vacío no se contesta');

/* ── 7 · Datos que no se cargaron, errores y determinismo ───────────────── */
console.log('\n── 7. Datos sin cargar, fallos y determinismo ──');
const sinCargar = responderMensaje(ASIS, 'cuanto dormi ayer', { hoy: HOY, sinCargar: ['x'] }).respuestas[0];
ok(sinCargar.capacidad === 'datos_no_cargados' && !/no tienes/i.test(textoDeRespuesta(sinCargar)), 'Clave sin cargar: lo dice, nunca «no tienes registros» (H-02)');
const ROTO = { ...ASIS, capacidades: [{ ...ASIS.capacidades[0], ejecutar: () => { throw new TypeError('x'); } }] };
const avisos = [];
const warn = console.warn;
console.warn = (...a) => avisos.push(a.join(' '));
const roto = responderMensaje(ROTO, 'cuanto dormi ayer secreto123', { hoy: HOY }).respuestas[0];
console.warn = warn;
ok(roto.capacidad === 'error_calculo' && avisos.length === 1 && !avisos[0].includes('secreto123') && avisos[0].includes('TypeError'), 'Un fallo nuestro: «no he podido calcularlo», y el registro técnico no lleva el mensaje (H-14)');
const a1 = JSON.stringify(responderMensaje(ASIS, 'cuanto dormi el lunes y que tal la calidad', { hoy: HOY, ahora: 5 }));
const a2 = JSON.stringify(responderMensaje(ASIS, 'cuanto dormi el lunes y que tal la calidad', { hoy: HOY, ahora: 5 }));
ok(a1 === a2, 'Determinista: el mismo mensaje con los mismos datos da la misma respuesta, byte a byte');
ok(!Object.keys(ASIS).some((k) => k.startsWith('__')), 'Responder no toca el registro del asistente');
ok(bLista(Array.from({ length: 20 }, (_, i) => `x${i}`)).items.length === MAX_ITEMS_LISTA + 1, `Una lista larga se corta a ${MAX_ITEMS_LISTA} + «y N más» (H-18)`);
ok(incumpleHonestidad('Dormiste menos porque entrenaste').includes('porque') && incumpleHonestidad('Dormiste 7 h').length === 0, 'El detector de causas, consejos y predicciones caza un «porque» y deja pasar un dato');

/* ── 8 · Fase 2.1: un motor honesto ─────────────────────────────────────── */
console.log('\n── 8. Fase 2.1 · Motor honesto: ni otra fecha, ni otra entidad, ni otra pregunta ──');
{
  /* ⟦RECONSTRUIDO en el paso 2 de la recuperación: el cuerpo original de esta sección se perdió⟧
     El asistente de prueba con una pregunta sobre el FUTURO («qué me toca»), para ver que una fecha del
     pasado dicha para otra pregunta no se le pega (A1). */
  const ASIS3 = {
    ...ASIS,
    lexico: { ...ASIS.lexico, plan: ['me toca', 'mi plan'] },
    capacidades: [...ASIS.capacidades, capa('toca', { senales: { plan: 4 }, necesita: [['plan']], periodo: 'dia', tiempo: 'futuro', porDefecto: 'hoy', prioridad: 2 })],
  };
  let c3 = nuevaConversacion('u3');
  const p3 = (t) => { const r = responderMensaje(ASIS3, t, { datos: {}, hoy: HOY, contexto: c3, ahora: 1000 }); c3 = r.contexto; return r.respuestas; };
  const nueva3 = () => { c3 = nuevaConversacion('u3'); };
  const et3 = (r) => r.map((x) => { const b = x.bloques.find((y) => y.tipo === 'texto'); return b ? b.texto : `${x.capacidad}`; });
  const notas3 = (x) => x.bloques.filter((b) => b.tipo === 'nota').map((b) => b.texto).join(' ');

  /* A1 — la fecha de una pregunta no contamina a otra que mira hacia el otro lado del tiempo. */
  nueva3();
  let r = p3('cuanto dormi ayer y que me toca');
  ok(r.length === 2 && et3(r)[0] === 'noche:2026-10-22..2026-10-22:-' && et3(r)[1] === `toca:${HOY}..${HOY}:-`,
    'A1 · «¿cuánto dormí ayer y qué me toca?»: ayer es de la primera; «qué me toca» mira hoy, no ayer');
  nueva3();
  r = p3('cuanto dormi el lunes y que tal la calidad');
  ok(r.length === 2 && et3(r)[1] === 'calidad:2026-10-19..2026-10-19:-', 'A1 · …pero si las dos miran el pasado, la única fecha sigue valiendo para las dos (no se rompe lo de antes)');

  /* A2 — una entidad que no existe no se cambia por otra. */
  nueva3();
  r = p3('como voy en remo');
  ok(r[0].tipo === 'aclaracion' && /No encuentro «remo» entre tus ejercicios/.test(textoDeRespuesta(r[0])) && r[0].opciones.length > 0,
    'A2 · «¿cómo voy en remo?» sin ningún remo: lo dice y ofrece los que sí hay');
  ok(!/ejercicio:-:/.test(et3(r).join(' ')), 'A2 · …y no contesta sobre otro ejercicio');
  nueva3();
  p3('como voy en press militar');
  r = p3('y en remo?');
  ok(/No encuentro «remo»/.test(textoDeRespuesta(r[0])) && !/:pm$/.test(et3(r)[0]), 'A2 · después de hablar del press militar, «¿y en remo?» no contesta del press militar');
  r = p3('y su record?');
  ok(r[0].tipo === 'aclaracion' && !/record:-:pm/.test(et3(r).join(' ')), 'A2 · …y la entidad de antes ya no se hereda: lo desconocido la borra del contexto');
  ok(mencionSinResolver(normalizarMensaje('record de remo').tokens, new Set([0])).texto === 'remo', 'A2 · mencionSinResolver encuentra lo nombrado tras «de»');
  ok(mencionSinResolver(normalizarMensaje('como voy en general').tokens) === null, 'A2 · negativa: «en general» no es el nombre de nada');
  ok(mencionSinResolver(normalizarMensaje('horas de sueno').tokens, new Set([0, 2])) === null, 'A2 · negativa: lo ya entendido (un concepto) no es una mención');

  /* A3 — una capacidad que no va por fechas lo dice si le dan una. */
  nueva3();
  r = p3('record de press militar ayer');
  ok(r[0].capacidad === 'record' && /Esto no lo puedo filtrar por fechas/.test(notas3(r[0])), 'A3 · «récord de press militar ayer»: el récord no se filtra por fechas y se dice');

  /* A7 — erratas de fecha: solo las de la lista; lo demás se avisa. */
  ok(ERRATAS_FECHA.ayr === 'ayer' && Object.values(ERRATAS_FECHA).every((v) => ['hoy', 'ayer', 'anteayer', 'manana', 'semana', 'pasada', 'pasado', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].includes(v)),
    'A7 · ERRATAS_FECHA solo lleva a palabras de fecha');
  ok(Object.keys(ERRATAS_FECHA).every((k) => !['mes', 'mas', 'hay', 'partes', 'vienes', 'manzana', 'semanas'].includes(k)), 'A7 · …y ninguna errata es una palabra de verdad');
  nueva3();
  ok(et3(p3('cuanto dormi ayr'))[0] === 'noche:2026-10-22..2026-10-22:-', 'A7 · «ayr» → ayer');
  ok(et3(p3('cuanto dormi el lnes'))[0] === 'noche:2026-10-19..2026-10-19:-', 'A7 · «lnes» → el lunes');
  nueva3();
  r = p3('cuanto dormi ayet');
  ok(et3(r)[0] === `noche:${HOY}..${HOY}:-` && /No he entendido «ayet» como una fecha/.test(notas3(r[0])), 'A7 · «ayet» no se adivina: contesta sobre hoy y lo dice');
  ok(palabrasParecidasAFecha(normalizarMensaje('que tal la semana').tokens).length === 0, 'A7 · negativa: una fecha bien escrita no es una errata');
  ok(palabrasParecidasAFecha(normalizarMensaje('hay mas partes').tokens).length === 0, 'A7 · negativa: «hay», «mas» y «partes» no se toman por fechas');
  ok(palabrasParecidasAFecha(normalizarMensaje('el sabdo no').tokens).length === 0 && normalizarMensaje('el sabdo').tokens.includes('sabado'), 'A7 · lo que está en la lista ya llega corregido');
  nueva3();
  r = p3('cuanto dormi ayet');
  ok(!/HUECO|undefined/.test(textoDeRespuesta(r[0])), 'A7 · la nota cita lo que escribió, sin nada roto');

  /* A8 — dos preguntas iguales en el mismo mensaje, una sola respuesta. */
  nueva3();
  r = p3('cuanto dormi ayer y cuanto dormi ayer');
  ok(r.length === 1 && et3(r)[0] === 'noche:2026-10-22..2026-10-22:-', 'A8 · la misma pregunta dos veces: una respuesta');
  r = p3('cuanto dormi ayer y que tal la calidad ayer');
  ok(r.length === 2, 'A8 · negativa: dos preguntas distintas siguen siendo dos');

  /* A9 — una opción solo se elige si es inequívoca. */
  const HAB = [{ tipo: 'habito', id: 'l30', nombre: 'Leer 30 minutos' }, { tipo: 'habito', id: 'lb', nombre: 'Leer la Biblia' }];
  const ent9 = (t, lista = HAB) => resolverEntidad(normalizarMensaje(t).tokens, lista);
  ok(ent9('como voy con leer').estado === 'ambigua' && ent9('como voy con leer').candidatas.length === 2, 'A9 · «leer» con «Leer 30 minutos» y «Leer la Biblia»: las dos, se pregunta (ya no gana el nombre corto)');
  ok(ent9('leer la biblia').entidad?.id === 'lb' && ent9('leer 30 minutos').entidad?.id === 'l30', 'A9 · con el nombre entero, la que es');
  ok(ent9('biblia').entidad?.id === 'lb', 'A9 · una palabra que solo tiene una: esa');
  ok(ent9('como voy con leer', [HAB[1]]).entidad?.id === 'lb', 'A9 · una sola candidata nombrada con una palabra entera suya: se resuelve sin preguntar');
  const DPL = [{ tipo: 'ejercicio', id: 'dpl', nombre: 'Dominadas pronas lastradas' }];
  const una = ent9('como voy en domi', DPL);
  ok(una.estado === 'ambigua' && una.candidatas.length === 1, 'A9 · una sola candidata nombrada solo por el principio de una palabra («domi»): no se da por hecha');
  ok(ent9('como voy en dominadas', DPL).estado === 'unica' && ent9('como voy en dominadas', DPL).entidad.id === 'dpl', 'A9 · …pero nombrada con una palabra ENTERA de su nombre («dominadas»), aunque sea un tercio del nombre, es ella');
  ok(ent9('bio', [{ tipo: 'asignatura', id: 'b', nombre: 'Biología' }]).estado === 'unica', 'A9 · negativa: el principio de un nombre de UNA palabra («bio» → Biología) sigue siendo ella (como antes)');
  nueva3();
  ok(textoDeRespuesta(p3('como voy en domi')[0]).includes('¿Cuál de estos?'), 'A9 · varias que empiezan igual: «¿Cuál de estos?», con botones');
  const aclaracionUna = responderMensaje({ ...ASIS3, entidades: () => ({ ejercicio: DPL }) }, 'como voy en domi', { datos: {}, hoy: HOY, contexto: nuevaConversacion('u9'), ahora: 1000 }).respuestas[0];
  ok(aclaracionUna.tipo === 'aclaracion' && textoDeRespuesta(aclaracionUna).startsWith('¿Te refieres a «Dominadas pronas lastradas»?') && aclaracionUna.opciones.length === 1,
    'A9 · con una sola opción posible se pregunta «¿Te refieres a «Dominadas pronas lastradas»?», no «¿Cuál de estos?»');
  const HAB2 = { ...ASIS3, entidades: () => ({ ejercicio: HAB.map((h) => ({ ...h, tipo: 'ejercicio' })) }) };
  const leer = responderMensaje(HAB2, 'como voy con leer', { datos: {}, hoy: HOY, contexto: nuevaConversacion('u9'), ahora: 1000 }).respuestas[0];
  ok(leer.tipo === 'aclaracion' && leer.opciones.map((o) => o.texto).sort().join('|') === 'Leer 30 minutos|Leer la Biblia', 'A9 · en la conversación, «¿cómo voy con leer?» pregunta entre «Leer 30 minutos» y «Leer la Biblia» (antes contestaba la Biblia)');
  ok(!/^ejercicio:/.test(textoDeRespuesta(leer)), 'A9 · …y no contesta de ninguna de las dos por su cuenta');
}

/* ── 9 · Fase 2.2: contexto conversacional estructurado ───────────────────── */
console.log('\n── 9. Fase 2.2 · Contexto: «la anterior», unidades sobreentendidas, continuidad y comparar ──');
{
  /* El asistente de prueba con una pregunta sobre el FUTURO, como en la sección 8. */
  const ASIS4 = {
    ...ASIS,
    lexico: { ...ASIS.lexico, plan: ['me toca', 'mi plan'] },
    capacidades: [...ASIS.capacidades, capa('toca', { senales: { plan: 4 }, necesita: [['plan']], periodo: 'dia', tiempo: 'futuro', porDefecto: 'hoy', prioridad: 2 })],
  };
  let c4 = nuevaConversacion('u4');
  const p4 = (t, extra = {}) => { const r = responderMensaje(ASIS4, t, { datos: {}, hoy: HOY, contexto: c4, ahora: extra.ahora ?? 1000 }); c4 = r.contexto; return r.respuestas; };
  const nueva = () => { c4 = nuevaConversacion('u4'); };
  const et = (r) => r.map((x) => { const b = x.bloques.find((y) => y.tipo === 'texto'); return b ? b.texto : `${x.capacidad}`; });
  const notas = (x) => x.bloques.filter((b) => b.tipo === 'nota').map((b) => b.texto).join(' ');

  /* El lector de fechas: el periodo ANTERIOR DEL CALENDARIO (decisión 1). */
  const fx = (t) => interpretarFechas(normalizarMensaje(t).texto, HOY)[0];
  ok(periodoPrevio(fx('ayer'), HOY).desde === '2026-10-21', 'Calendario · día → el día anterior');
  ok(periodoPrevio(fx('esta semana'), HOY).desde === '2026-10-12' && periodoPrevio(fx('esta semana'), HOY).hasta === '2026-10-18', 'Calendario · «esta semana» (hasta hoy) → la semana natural anterior entera');
  ok(periodoPrevio(fx('el mes pasado'), HOY).desde === '2026-08-01' && periodoPrevio(fx('el mes pasado'), HOY).hasta === '2026-08-31', 'Calendario · un mes → el mes natural anterior (agosto tiene 31)');
  ok(periodoPrevio(fx('este año'), HOY).desde === '2025-01-01' && periodoPrevio(fx('este año'), HOY).hasta === '2025-12-31', 'Calendario · un año → el año natural anterior');
  ok(periodoPrevio(fx('los últimos 10 días'), HOY).desde === '2026-10-04' && periodoPrevio(fx('los últimos 10 días'), HOY).hasta === '2026-10-13', 'Calendario · un rango cualquiera → los mismos días justo antes');
  ok(periodoPrevio({ desde: '2026-03-01', hasta: '2026-03-31' }, HOY).hasta === '2026-02-28', 'Calendario · marzo → febrero, con su último día de verdad');
  ok(unidadDePeriodo(periodoPorDefecto('ultimos7', HOY), HOY) === 'rango' && unidadDePeriodo(periodoPorDefecto('estaSemana', HOY), HOY) === 'semana', 'Calendario · «los últimos 7 días» no es una semana natural; «esta semana» sí');

  /* P2 — «la anterior», encadenada, con días, semanas, meses, años y rangos. */
  nueva(); p4('cuanto dormi ayer');
  let r = p4('y la anterior?');
  ok(et(r)[0] === 'noche:2026-10-21..2026-10-21:-', 'P2 · «¿cuánto dormí ayer?» → «¿y la anterior?» → la noche del 21 (misma pregunta, día anterior)');
  r = p4('la anterior a esa');
  ok(et(r)[0] === 'noche:2026-10-20..2026-10-20:-', 'P2 · «la anterior a esa» encadena desde la última contestada (el 20), no desde la primera');
  r = p4('y el periodo anterior?');
  ok(et(r)[0] === 'noche:2026-10-19..2026-10-19:-', 'P2 · «¿y el periodo anterior?» → el 19');
  nueva(); p4('media de sueño la semana pasada');
  ok(et(p4('y la anterior?'))[0] === 'media:2026-10-05..2026-10-11:-', 'P2 · semana → la semana natural de antes (5–11)');
  nueva(); p4('media de sueño este mes');
  ok(et(p4('y el periodo anterior?'))[0] === 'media:2026-09-01..2026-09-30:-', 'P2 · «este mes» → septiembre entero');
  nueva(); p4('media de sueño este año');
  ok(et(p4('y la anterior?'))[0] === 'media:2025-01-01..2025-12-31:-', 'P2 · «este año» → el año 2025 entero');
  nueva(); p4('media de sueño los ultimos 10 dias');
  ok(et(p4('y la de antes?'))[0] === 'media:2026-10-04..2026-10-13:-', 'P2 · un rango cualquiera → los 10 días justo antes («la de antes»)');
  nueva(); p4('cuanto dormi');
  ok(et(p4('y la anterior?'))[0] === 'noche:2026-10-22..2026-10-22:-', 'P2 · con el periodo POR DEFECTO (hoy) también se sabe cuál es «la anterior» (decisión 6)');
  nueva(); p4('cuanto dormi');
  ok(et(p4('y la calidad?'))[0] === 'calidad:2026-10-17..2026-10-23:-', 'P2 · …pero ese periodo por defecto NO se hereda solo: «¿y la calidad?» usa su propio defecto (la regla de herencia no cambia)');
  nueva(); p4('cuanto dormi la semana pasada');
  ok(et(p4('y la pasada?'))[0] === 'media:2026-10-05..2026-10-11:-', 'P2 · «¿y la pasada?» siguiendo la conversación es la anterior a la que se miraba');

  /* P2 — cuándo NO se resuelve: se pregunta o se explica. */
  /* ⟦RECONSTRUIDO en el paso 2 de la recuperación (líneas 381–428 del original, perdidas)⟧ */
  nueva();
  r = p4('y la anterior?');
  ok(r[0].capacidad === 'referencia_sin_contexto' && r[0].tipo === 'aclaracion' && /Anterior a qué/.test(textoDeRespuesta(r[0])) && r[0].opciones.length > 0,
    'P2 · «¿y la anterior?» sin nada antes: «¿anterior a qué?», con ejemplos (no se inventa un periodo)');
  nueva();
  r = p4('y el pasado?');
  ok(r[0].capacidad === 'referencia_sin_contexto' && /Qué periodo pasado/.test(textoDeRespuesta(r[0])), 'P2 · «¿y el pasado?» sin nada antes: «¿qué periodo pasado?»');
  nueva();
  r = p4('media de sueño el pasado');
  ok(r[0].capacidad === 'referencia_sin_unidad' && r[0].tipo === 'aclaracion' && r[0].opciones.length === 3, 'P2 · «media de sueño el pasado» sin unidad: se pregunta cuál (día, semana o mes), sin elegirla por él');
  ok(r[0].opciones.map((o) => `${o.plan.periodo.desde}..${o.plan.periodo.hasta}`).join('|') === '2026-10-22..2026-10-22|2026-10-12..2026-10-18|2026-09-01..2026-09-30',
    'P2 · …las tres unidades son ayer, la semana pasada entera y el mes pasado entero');
  ok(r[0].opciones.every((o) => o.plan.capacidad === 'media'), 'P2 · …y cada botón conserva la pregunta (la media)');
  nueva(); p4('record de press militar');
  r = p4('y la anterior?');
  ok(r[0].capacidad === 'referencia_sin_periodo' && /no va por fechas/.test(textoDeRespuesta(r[0])) && !/record:/.test(et(r).join(' ')), 'P2 · tras una pregunta que no va por fechas (un récord): lo dice, no repite el récord');
  nueva(); p4('cuanto dormi el lunes y que tal la calidad esta semana');
  r = p4('y la anterior?');
  ok(r[0].capacidad === 'referencia_ambigua' && r[0].tipo === 'aclaracion' && r[0].opciones.length === 2, 'P2 · después de contestar dos periodos: «¿anterior a cuál?», con un botón por periodo');
  ok(r[0].opciones.map((o) => `${o.plan.capacidad}:${o.plan.periodo.desde}..${o.plan.periodo.hasta}`).join('|') === 'noche:2026-10-18..2026-10-18|calidad:2026-10-12..2026-10-18',
    'P2 · …cada botón es el anterior DE SU periodo y con SU pregunta (el domingo 18 para la noche, la semana pasada para la calidad)');
  ok(r[0].opciones.every((o) => /^[A-ZÁÉÍÓÚ].*anterior/i.test(o.texto)), 'P2 · …y dice de qué es cada uno');
  nueva(); p4('que me toca');
  r = p4('y la anterior?');
  ok(r[0].capacidad === 'referencia_pasada' && /mira lo que viene/.test(textoDeRespuesta(r[0])) && !/^toca:/.test(et(r)[0]), 'P2 · «lo que me toca» mira el futuro: no tiene un «anterior» que ya pasó, y se dice');
  nueva(); p4('cuanto dormi ayer');
  r = p4('y la anterior?', { ahora: 1000 + (MINUTOS_CONTEXTO + 1) * 60000 });
  ok(r[0].capacidad === 'referencia_sin_contexto', `P2 · el contexto caduca igual que antes: a los ${MINUTOS_CONTEXTO} minutos, «¿y la anterior?» ya no sabe de qué`);
  nueva(); p4('cuanto dormi ayer');
  for (let i = 0; i < TURNOS_CONTEXTO; i += 1) p4('hola');
  ok(p4('y la anterior?')[0].capacidad === 'referencia_sin_contexto', `P2 · …y a los ${TURNOS_CONTEXTO} turnos`);

  /* P2 — «la semana (el mes) anterior» relativa a lo que se hablaba; sin nada, la del calendario (como antes). */
  nueva(); p4('media de sueño la semana pasada');
  ok(et(p4('y la semana anterior?'))[0] === 'media:2026-10-05..2026-10-11:-', 'P2 · hablando de la semana pasada, «¿y la semana anterior?» es la de antes (5–11)');
  nueva();
  ok(et(p4('media de sueño la semana anterior'))[0] === 'media:2026-10-12..2026-10-18:-', 'P2 · sin nada antes, «la semana anterior» sigue siendo la semana pasada del calendario');
  nueva();
  ok(et(p4('media de sueño en septiembre y el mes anterior')).join(' | ') === 'media:2026-09-01..2026-09-30:- | media:2026-08-01..2026-08-31:-', 'P2 · «en septiembre y el mes anterior»: agosto (el anterior a septiembre, no el mes pasado del calendario)');

  /* P3 — la referencia la lee `referenciaAnterior`; lo que ya es una fecha no. */
  const ref = (t) => referenciaAnterior(normalizarMensaje(t).tokens);
  ok(ref('y la anterior?')?.texto === 'anterior' && ref('y el pasado?')?.texto === 'el pasado' && ref('y la de antes?')?.texto === 'la de antes', 'P3 · «la anterior», «el pasado» y «la de antes» son referencias');
  ok(ref('la semana pasada') === null && ref('pasado mañana') === null, 'P3 · negativa: «la semana pasada» y «pasado mañana» son fechas, no referencias');
  ok(referenciaAnterior(normalizarMensaje('lo de antes').tokens) === null, 'P3 · negativa: «lo de antes» es la comparación de Sueño, no una referencia');
  /* ⟦RECONSTRUIDO en el paso 2 de la recuperación (líneas 430–446 del original, perdidas)⟧ */
  nueva();
  ok(et(p4('media de sueño este mes y el pasado')).join(' | ') === 'media:2026-10-01..2026-10-23:- | media:2026-09-01..2026-09-30:-', 'P3 · «este mes y el pasado»: los dos meses, con «el pasado» = septiembre (antes se perdía)');
  nueva();
  ok(et(p4('cuanto dormi la semana pasada y la anterior')).join(' | ') === 'media:2026-10-12..2026-10-18:- | media:2026-10-05..2026-10-11:-', 'P3 · «la semana pasada y la anterior»: la de antes de ESA semana');
  nueva(); r = p4('media de sueño el lunes, el martes y el anterior');
  ok(r.some((x) => x.capacidad === 'referencia_dudosa' && x.tipo === 'aclaracion' && x.opciones.length === 2), 'P3 · «el anterior» con dos fechas al lado: no se adivina, se pregunta «¿anterior a cuál?»');
  /* P4 — nombrar solo otra entidad sigue con la pregunta anterior; una intención dicha con palabras manda. */
  nueva(); p4('record de press militar');
  ok(et(p4('y dominadas pronas?'))[0] === 'record:-:dp', 'P4 · tras el récord del press militar, «¿y dominadas pronas?» sigue siendo el récord');
  nueva(); p4('record de press militar');
  ok(et(p4('como voy en dominadas pronas'))[0] === 'ejercicio:-:dp', 'P4 · …pero «¿cómo voy en dominadas pronas?» lo dice con palabras: el progreso');
  nueva(); p4('record de press militar');
  ok(et(p4('y en remo?')).every((x) => !/^record:-:/.test(x)), 'P4 · negativa: continuar la intención no hereda una entidad que no existe');
  nueva(); p4('record de press militar');
  r = p4('y ayer?');
  ok(r[0].capacidad === 'fecha_no_aplicable' && !/^record:/.test(et(r)[0]), 'P4 · una fecha sola tras una pregunta sin fechas no repite la última respuesta');
  nueva(); r = p4('compara esta semana con la pasada');
  ok(r[0].capacidad === 'comparar_que' && r[0].tipo === 'aclaracion' && /Todavía no calculo la diferencia/.test(textoDeRespuesta(r[0]))
    && r[0].opciones.map((o) => o.plan.capacidad).sort().join(',') === 'calidad,media', 'P5 · sin decir qué comparar: se pregunta, solo con lo que puede mirar periodos (media, calidad)');
  r = p4('media');
  ok(r.length === 2 && et(r).join(' | ') === 'media:2026-10-19..2026-10-23:- | media:2026-10-12..2026-10-18:-' && notas(r[0]).includes(TEXTO_SIN_DIFERENCIA), 'P5 · …el botón contesta las dos semanas por separado y dice que la diferencia no se calcula');
  nueva(); r = p4('compara la media de sueño de esta semana con la pasada');
  ok(r.length === 2 && notas(r[0]).includes(TEXTO_SIN_DIFERENCIA) && et(r)[1] === 'media:2026-10-12..2026-10-18:-', 'P5 · con el tema dicho: cada periodo y la nota');
  nueva(); p4('media de sueño esta semana');
  r = p4('compáralo con la semana pasada');
  ok(r.length === 2 && et(r).join(' | ') === 'media:2026-10-19..2026-10-23:- | media:2026-10-12..2026-10-18:-' && notas(r[0]).includes(TEXTO_SIN_DIFERENCIA), 'P5 · «compáralo con la semana pasada» añade el periodo nuevo SIN quitar el que se miraba');
  nueva(); r = p4('compara esta semana con el 31 de febrero');
  ok(r[0].capacidad === 'comparar_que' && /«el 31 de febrero» no es una fecha que exista/.test(textoDeRespuesta(r[0])), 'P5 · un periodo imposible se dice, no se pierde');
  nueva(); p4('record de press militar');
  ok(p4('compara esta semana con la pasada')[0].capacidad === 'comparar_que', 'P5 · tras una pregunta que no va por fechas, comparar periodos pregunta qué');

  /* Lo de la Fase 2.1 sigue en pie. */
  nueva();
  ok(et(p4('cuanto dormi y que me toca mañana')).join(' | ') === `noche:${HOY}..${HOY}:- | toca:2026-10-24..2026-10-24:-`, 'Fase 2.1 · A1 sigue: «mañana» no contamina la primera pregunta');
  nueva(); p4('como voy en press militar');
  ok(p4('y ayer?')[0].capacidad === 'fecha_no_aplicable', 'Fase 2.1 · A3 sigue: «¿y ayer?» tras una pregunta sin fechas se dice');
  nueva(); p4('como voy en press militar');
  ok(/No encuentro «remo gironda»/.test(textoDeRespuesta(p4('y en remo gironda?')[0])), 'Fase 2.1 · A2 sigue: un ejercicio que no existe no hereda el anterior');
  ok(c4.ultimaRespuesta === undefined || c4.ultimaRespuesta === null || Array.isArray(c4.ultimaRespuesta.items), 'El contexto guarda la última respuesta como una lista corta, no como un historial');
  const tamano = JSON.stringify(c4).length;
  for (let i = 0; i < 30; i += 1) p4(i % 2 ? 'cuanto dormi ayer' : 'y la anterior?');
  ok(JSON.stringify(c4).length < tamano * 3, 'El contexto no crece con la conversación (no es una memoria indefinida)');
}

/* ── Palabras que son propiedades heredadas («constructor», «__proto__») ──
   🐛 `normalizarMensaje` buscaba cada palabra en la tabla de abreviaturas sin mirar si la clave era suya: «constructor»
   y «__proto__» encontraban lo que hereda cualquier objeto y la conversación lanzaba un TypeError. */
console.log('\n── Palabras que son propiedades heredadas («constructor», «__proto__») ──');
{
  const sinLanzar = (fn) => { try { fn(); return true; } catch { return false; } };
  ok(sinLanzar(() => normalizarMensaje('constructor')) && normalizarMensaje('constructor').tokens.join(' ') === 'constructor', '«constructor» se normaliza como una palabra más (antes: TypeError)');
  ok(sinLanzar(() => normalizarMensaje('__proto__')) && sinLanzar(() => normalizarMensaje('¿qué significa constructor?')), '…y «__proto__» o una frase con «constructor», tampoco lanzan');
  ok(['hasownproperty', 'tostring', 'valueof', 'isprototypeof'].every((w) => normalizarMensaje(w).tokens.join(' ') === w), 'Otras propiedades heredadas se quedan como palabras');
  ok(normalizarMensaje('q tal xq tb').tokens.join(' ') === 'que tal porque tambien', '…y las abreviaturas de verdad se siguen expandiendo');
  const rc = sinLanzar(() => responderMensaje(ASIS, 'constructor', { datos: {}, hoy: HOY })) && responderMensaje(ASIS, 'constructor', { datos: {}, hoy: HOY }).respuestas;
  ok(Array.isArray(rc) && rc.length === 1 && rc[0].capacidad === 'no_entendido', '«constructor» a secas: no entendido (con ejemplos), no un error');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos ? 1 : 0);
