/* Fase 2 · Chatbots — el núcleo conversacional y las fechas relativas.
   ═══════════════════════════════════════════════════════════════════════════
   Especificación: docs/15_asistentes/ESPECIFICACION_CHATBOTS.md §7 (comprensión y contexto)
   y §16 (auditoría). Todo con el día fijado: el resultado no puede depender de cuándo se
   ejecute (las bombas de relojería de la FIT F23/F26). */

import {
  normalizarMensaje, detectarConceptos, resolverEntidad, responderMensaje, nuevaConversacion,
  textoDeRespuesta, incumpleHonestidad, MAX_MENSAJE, TURNOS_CONTEXTO, MINUTOS_CONTEXTO, bLista, MAX_ITEMS_LISTA,
} from '../src/lib/motorConversacion.js';
import {
  interpretarFechas, etiquetaDeDia, etiquetaDeRango, lunesDeFecha, periodoPorDefecto, diasDelRango, fechasDelRango,
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
ok(preguntar('press militar')[0].capacidad === 'ejercicio', 'Nombrar un ejercicio a secas ya es preguntar por él');
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

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos ? 1 : 0);
