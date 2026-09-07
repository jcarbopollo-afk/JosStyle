// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 31 (SU F1) — SUEÑO: REGISTRO SIMPLE Y EXPERIENCIA PREMIUM
// ══════════════════════════════════════════════════════════════════════════
//
// El enunciado empieza diciendo que NO se rehaga nada, así que la mitad de esta
// prueba comprueba **que lo que ya funcionaba sigue ahí**: la gráfica, la media,
// la lista, el panel de IA y la escala 1-5 que leen otras cuatro pantallas.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  PREGUNTA_CALIDAD, CALIDADES, MIN_CALIDAD, MAX_CALIDAD, calidadDe, valorDeCalidad, calidadPorId,
  PREGUNTA_INTERRUPCIONES, INTERRUPCIONES, MAX_INTERRUPCIONES, etiquetaInterrupciones,
  PREGUNTA_SIESTA, MAX_SIESTA_MIN,
  HORA_DORMIR_DEFECTO, HORA_DESPERTAR_DEFECTO,
  crearRegistroSueno, normalizarRegistro, normalizarSueno,
  NO_SE_GUARDA, duracionDe, textoDuracion, mediaDeHoras, resumenNoche,
  BLOQUES_REGISTRO, MAX_PREGUNTAS, NO_EN_SU1, AUDITORIA_SU1, condicionSU1,
} from '../src/lib/sueno.js';
import { calcularDuracion } from '../src/lib/helpers.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-09-07';
const VISTA = leer('src/views/SleepView.jsx');
const LIB = leer('src/lib/sueno.js');
const CODIGO = soloCodigo(LIB);
const APP = leer('src/App.jsx');

console.log('\n══ E3 · Fase 31 (SU F1) — el registro de Sueño ══');

console.log('\n── 1. 🚨 La calidad: tres caras fuera, 1-5 dentro (apartado 2) ──');
eq(PREGUNTA_CALIDAD, '¿Cómo has dormido?', 'la pregunta, literal del enunciado');
eq(CALIDADES.length, 3, '🚨 TRES opciones, no una escala de 1 a 10');
eq(CALIDADES.map((c) => c.emoji), ['😫', '🙂', '🤩'], 'con las tres caras del enunciado');
eq(CALIDADES.map((c) => c.nombre), ['Fatal', 'Muy bien', 'De maravilla'], 'y sus tres nombres');
ok(CALIDADES.every((c) => c.nombre && c.emoji),
  '⚠️ cada una con emoji Y palabra: quien no ve bien las caras tiene que poder elegir (EH F42)');
/* 🚨 El reparto literal: Fatal → 1-2, Muy bien → 3-4, De maravilla → 5. */
eq([CALIDADES[0].desde, CALIDADES[0].hasta], [1, 2], '😫 Fatal cubre el 1 y el 2');
eq([CALIDADES[1].desde, CALIDADES[1].hasta], [3, 4], '🙂 Muy bien cubre el 3 y el 4');
eq([CALIDADES[2].desde, CALIDADES[2].hasta], [5, 5], '🤩 De maravilla es el 5');
ok(CALIDADES.every((c) => c.valor >= MIN_CALIDAD && c.valor <= MAX_CALIDAD),
  '🚨 y por dentro se guarda 1-5, que es lo que ya leen el Dashboard, el hub y la exportación');
eq(valorDeCalidad('maravilla'), 5, 'tocar 🤩 guarda un 5');
eq(valorDeCalidad('fatal'), 2, 'tocar 😫 guarda un 2');
eq(valorDeCalidad('no-existe'), null, '⚠️ y un id que no existe no guarda nada');
eq(calidadDe(1).id, 'fatal', 'un 1 guardado enciende 😫');
eq(calidadDe(3).id, 'bien', 'un 3 enciende 🙂');
eq(calidadDe(5).id, 'maravilla', 'y un 5, 🤩');
eq(calidadPorId('bien').emoji, '🙂', '`calidadPorId` responde por id');
/* 🚨 `Number(null)` es 0, y sin la guarda una noche SIN contestar salía «Fatal». */
eq(calidadDe(null), null, '🚨 SIN CONTESTAR NO SE ENCIENDE NINGUNA CARA: `Number(null)` es 0, y eso pintaba 😫 Fatal');
eq(calidadDe(undefined), null, '⚠️ ni sin el campo');
eq(calidadDe(''), null, '⚠️ ni con la cadena vacía');
ok(/v === null \|\| v === undefined \|\| v === ''/.test(CODIGO),
  '⚠️ y la guarda está en el código, no en un comentario');

console.log('\n── 2. Las interrupciones: 0 · 1 · 2 · 3+ (apartado 3) ──────────');
eq(PREGUNTA_INTERRUPCIONES, '¿Te has despertado durante la noche?', 'la pregunta, literal');
eq(INTERRUPCIONES.map((i) => i.etiqueta), ['0', '1', '2', '3+'], '🚨 cuatro botones, y el último es «3+»');
eq(MAX_INTERRUPCIONES, 3, 'el tope guardado es 3');
eq(etiquetaInterrupciones(3), '3+', '🚨 un 3 guardado se enseña como «3+»: no se sabe si fueron tres o siete');
eq(etiquetaInterrupciones(9), '3+', '⚠️ y un número mayor se acota, no se enseña tal cual');
eq(etiquetaInterrupciones(0), '0', 'y el cero es cero');
eq(etiquetaInterrupciones(null), null, '⚠️ sin dato, `null`');

console.log('\n── 3. La siesta: una pregunta de sí o no (apartado 4) ───────────');
eq(PREGUNTA_SIESTA, '¿Has dormido siesta ayer?', 'la pregunta, literal');
eq(normalizarRegistro({ siestaAyer: true, siestaMinutos: 45 }).siestaMinutos, 45, 'con un sí se guardan sus minutos');
eq(normalizarRegistro({ siestaAyer: false, siestaMinutos: 45 }).siestaMinutos, 0,
  '🚨 y con un no NO se queda un 45 colgando: sería un dato que contradice a su propia pregunta');
eq(normalizarRegistro({ siestaAyer: true, siestaMinutos: 9999 }).siestaMinutos, MAX_SIESTA_MIN,
  '⚠️ los minutos se acotan');

console.log('\n── 4. 🚨 La migración: lo guardado antes no se pierde (ap. 9) ───');
eq(normalizarRegistro({ siesta: 30 }).siestaAyer, true, '🚨 una siesta de 30 minutos de antes es un «sí»');
eq(normalizarRegistro({ siesta: 30 }).siestaMinutos, 30, 'con sus 30 minutos');
eq(normalizarRegistro({ siesta: 0 }).siestaAyer, false,
  '🚨 Y UN «siesta: 0» DE ANTES NO SE CONVIERTE EN UN SÍ: era «no hice siesta»');
eq(normalizarRegistro({ siesta: 30 }).siesta, 30,
  '⚠️ y el campo viejo NO se reescribe: quien lo lea todavía lo sigue encontrando (E3 F26)');
eq(normalizarRegistro({ siesta: 20, siestaAyer: false }).siestaAyer, false,
  '⚠️ y si ya tenía el campo nuevo, manda el nuevo');
/* 🚨 Y la migración corre AL CARGAR, antes de que nadie lo lea. */
ok(APP.includes('setSueno(normalizarSueno(s))'),
  '🚨 `App.jsx` migra al cargar: al revés no arregla nada, porque quien lee ya ha leído (EH F46)');
eq(normalizarSueno([{ siesta: 15 }, null, 'basura']).length, 1, 'y la lista entera se limpia de lo que no es un registro');
eq(normalizarSueno(null).length, 0, '⚠️ con basura, lista vacía');
ok(normalizarRegistro({}).id.length > 0, '⚠️ un registro sin id recibe uno: sin él, cada dispositivo le pondría otro (EH F45)');

console.log('\n── 5. 🚨 La duración NO se guarda: se calcula ───────────────────');
ok(NO_SE_GUARDA.length >= 2 && NO_SE_GUARDA.every((n) => n.que && n.porque && n.seSirveCon),
  'lo que no se guarda está declarado, con su motivo y con quién lo sirve');
ok(NO_SE_GUARDA.some((n) => /duración/i.test(n.que)),
  '🚨 empezando por la duración: el apartado 9 la pide guardada y el 10 prohíbe duplicar almacenamiento');
const noche = crearRegistroSueno({ horaDormir: '23:45', horaDespertar: '08:15' });
ok(!('duracion' in noche) && !('duracionMin' in noche) && !('horas' in noche),
  '🚨 y el registro NO lleva ningún campo de duración: una copia mentiría al corregir una hora');
eq(textoDuracion(noche), '8 h 30 min', '🚨 *"23:45 → 08:15 · 8 h 30 min"*, el ejemplo literal del apartado 1');
eq(duracionDe(noche), 8.5, '⚠️ y en horas decimales, que es lo que espera la gráfica de siempre');
eq(duracionDe(noche), calcularDuracion('23:45', '08:15'),
  '🚨 con la MISMA función de siempre: ni un segundo cálculo que diga otra cosa');
eq(textoDuracion({ horaDormir: '23:00', horaDespertar: '07:00' }), '8 h', '⚠️ sin minutos no se escribe «8 h 0 min»');
eq(textoDuracion(null), null, '⚠️ sin registro, `null`');
eq(textoDuracion({ horaDormir: 'x', horaDespertar: 'y' }), null, '⚠️ y con horas imposibles tampoco se inventa');

console.log('\n── 6. La media y el resumen de una noche ───────────────────────');
eq(mediaDeHoras([noche, { horaDormir: '00:00', horaDespertar: '07:30' }]), 8,
  'la media de 8,5 y 7,5 es 8');
eq(mediaDeHoras([noche, { horaDormir: 'x', horaDespertar: 'y' }]), 8.5,
  '🚨 y una noche incompleta NO convierte la media en NaN: se salta, como hacía la pantalla');
eq(mediaDeHoras([]), null, '⚠️ sin noches no hay media, y `null` no es cero');
const r = resumenNoche(normalizarRegistro({ ...noche, calidad: 5, interrupciones: 2, siestaAyer: true, siestaMinutos: 30 }));
eq(r.duracion, '8 h 30 min', 'la línea de una noche trae su duración');
eq(r.horas, '23:45 → 08:15', 'sus dos horas');
eq(r.calidad.emoji, '🤩', '🚨 su CARA, no su número: la representación visual manda (apartado 2)');
eq(r.extras, '2 interrupciones · siesta de 30 min', 'y lo que hubo esa noche');
eq(resumenNoche(normalizarRegistro({ ...noche, interrupciones: 0, siestaAyer: false })).extras, null,
  '⚠️ una noche sin nada que contar no arrastra «0 interrupciones · sin siesta»');
eq(resumenNoche(normalizarRegistro({ ...noche, interrupciones: 1 })).extras, '1 interrupción',
  '⚠️ y en singular cuando es una');
eq(resumenNoche(normalizarRegistro({ ...noche })).calidad, null,
  '🚨 y una noche sin calidad contestada no pinta ninguna cara');

console.log('\n── 7. La estructura del registro (apartados 5 y 6) ──────────────');
eq(BLOQUES_REGISTRO.map((b) => b.id), ['noche', 'calidad', 'interrupciones', 'siesta'],
  '🌙 Tu noche · ¿Cómo has dormido? · 🌙 Durante la noche · ☀️ Ayer');
eq(BLOQUES_REGISTRO.length, MAX_PREGUNTAS,
  '🚨 CUATRO BLOQUES Y YA: el apartado 6 prohíbe "decenas de preguntas" y "formularios largos"');
ok(BLOQUES_REGISTRO.every((b) => b.titulo && b.que), 'cada uno con su título y lo que pregunta');
/* 🚨 Ninguna respuesta viene puesta. */
ok(/calidadId: null/.test(VISTA) && /interrupciones: null/.test(VISTA) && /siestaAyer: null/.test(VISTA),
  '🚨 NINGUNA RESPUESTA VIENE ELEGIDA: poner una guardaría algo que él no ha dicho (HT F3, EH F28)');
/* ⚠️ La vista usa las CONSTANTES, no los literales, así que se busca el nombre:
   una prueba que buscara "23:00" saltaría con el código mejor escrito. */
ok(VISTA.includes('HORA_DORMIR_DEFECTO') && VISTA.includes('HORA_DESPERTAR_DEFECTO')
  && HORA_DORMIR_DEFECTO === '23:00' && HORA_DESPERTAR_DEFECTO === '07:00',
  '⚠️ salvo las horas, que son un reloj y él mueve');
ok(VISTA.includes("form.siestaAyer === true &&"),
  '🚨 y los minutos de la siesta SOLO salen si dijo que sí (apartado 4)');
ok(VISTA.includes('aria-pressed'),
  '⚠️ y cada opción dice si está elegida, para quien use el lector de pantalla');
ok(VISTA.includes('toque-44'), '⚠️ con área táctil de 44 px (EH F42)');

console.log('\n── 8. 🚨 Lo que ya funcionaba sigue ahí (apartados 8 y 10) ──────');
ok(VISTA.includes('LineChart') && VISTA.includes('CartesianGrid') && VISTA.includes('recharts'),
  '🚨 LA GRÁFICA ES LA MISMA: el apartado 8 dice que está bien planteada');
ok(VISTA.includes('calcularDuracion'), '⚠️ alimentada por la misma función de siempre');
ok(VISTA.includes('AIPanel') && VISTA.includes('Analizar mi sueño'), '⚠️ el panel de IA sigue');
ok(VISTA.includes('BotonBorrar') && VISTA.includes('onDelete'), '⚠️ y se puede seguir borrando una noche');
ok(VISTA.includes('Media últimos'), '⚠️ y la media sigue en su sitio');
ok(VISTA.includes("foco?.accion === 'registrar'"),
  '⚠️ y la acción rápida «+ Sueño» del Dashboard sigue abriendo este formulario, sin uno nuevo');
/* 🚨 Y la ventana de la gráfica NO se toca: es la fase siguiente. */
eq(AUDITORIA_SU1.graficasRehechas, 0, '🚨 ni una gráfica rehecha');
eq(AUDITORIA_SU1.tablasNuevas, 0, 'ni una tabla nueva');
eq(AUDITORIA_SU1.clavesNuevas, 0, '🚨 ni una clave nueva: sigue siendo `sueno`, la lista de siempre');
ok(/const VENTANA_GRAFICA = 7/.test(VISTA),
  '🚨 y la ventana sigue siendo «las 7 últimas REGISTRADAS»: el cambio a 7 días de calendario es la Fase 2');
ok(!/eachDay|rellenarDias|diasDelCalendario/.test(soloCodigo(VISTA)),
  '⚠️ sin rellenar huecos de calendario: *"NO implementar todavía el cambio de ventana"*');
ok(NO_EN_SU1.some((n) => /ventana móvil de 7 días/i.test(n.que)),
  '⚠️ y está declarado como trabajo de la fase siguiente');

console.log('\n── 9. 🚨 Y los que leían la calidad siguen sin romperse ─────────');
/* Una calidad sin contestar es `null`, y tres pantallas la escribían como
   `Calidad ${x}/5` — o sea, «Calidad null/5» en la cara de Josué (EH F62). */
const HUB = leer('src/lib/resumenesHub.js');
ok(!/Calidad \$\{ultimo\.calidad\}\/5/.test(HUB),
  '🚨 el hub ya NO escribe «Calidad null/5»: `null` es una palabra técnica en pantalla (EH F62)');
const resHub = calcularResumenModulo('sueno', { sueno: [normalizarRegistro({ fecha: HOY, horaDormir: '23:00', horaDespertar: '07:00', calidad: 5 })] });
eq(resHub.linea2, '🤩 De maravilla', '⚠️ y enseña la cara que él eligió');
const resHubSin = calcularResumenModulo('sueno', { sueno: [normalizarRegistro({ fecha: HOY, horaDormir: '23:00', horaDespertar: '07:00' })] });
eq(resHubSin.linea2, 'Sin calidad anotada', '🚨 y sin calidad lo dice con palabras');
ok(!/null/.test(resHubSin.linea2) && !/undefined/.test(resHubSin.linea2), '⚠️ nunca con una palabra técnica');
const HOYV = leer('src/views/DashboardView.jsx');
ok(!/Calidad \$\{ultimoSueno\.calidad\}\/5/.test(HOYV), '🚨 y la tarjeta de Hoy tampoco');
const EXPORT = leer('src/lib/exportData.js');
ok(!/siesta \$\{e\.siesta\}min/.test(EXPORT),
  '🚨 y la exportación ya no escribe «siesta undefinedmin» en toda noche nueva');
ok(/siestaAyer/.test(EXPORT), '⚠️ lee el campo nuevo');

console.log('\n── 10. 🚨 La condición de finalización se CALCULA (apartado 11) ─');
const cond = condicionSU1({ vista: VISTA });
eq(cond.length, 12, 'los doce puntos del criterio');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y ninguno rojo — se calculan, no se ponen a mano');
const condRota = condicionSU1({ vista: 'export default function Nada() { return null; }' });
ok(condRota.filter((c) => !c.ok).length >= 5,
  '🚨 con una pantalla vacía se pone roja de verdad: una auditoría que no puede fallar no sirve (EH F42)');
ok(NO_EN_SU1.length >= 6 && NO_EN_SU1.every((n) => n.que && n.porque),
  '⚠️ y lo que esta fase NO hace está declarado con su motivo');
ok(NO_EN_SU1.some((n) => /médico/i.test(n.que) || /médica/i.test(n.porque)),
  '⚠️ incluido lo médico, que el apartado 6 prohíbe expresamente');

console.log('\n══════════════════════════════════════════════════════════════════════');
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F31 (SU F1) · El registro de Sueño`);
