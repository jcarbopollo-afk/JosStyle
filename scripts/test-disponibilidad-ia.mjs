// ============================================================================
// ✨ LA IA QUE TODAVÍA NO ESTÁ DISPONIBLE (P3, 2026-10-18)
//
// Las ocho pruebas que pidió Josué, en Node (la parte de verlo en pantalla está
// en la sección «P3 · IA» del recorrido):
//    1 cada función pendiente enseña el mensaje · 2 ni una API Key en pantalla ·
//    3 lo que funciona sigue funcionando · 4 los fallos de verdad se dicen ·
//    5 se puede volver · 6 Motion · 7 pantallas pequeñas y grandes · 8 sin
//    regresiones.
// ============================================================================

import { readFileSync } from 'node:fs';
import { register } from 'node:module';

/* `supabase.js` lee `import.meta.env`, que en Node no existe: se le da uno de mentira
   (como `test-a5-sincronizacion`), sin red de verdad. */
register('data:text/javascript,' + encodeURIComponent(`export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (url.endsWith('/lib/supabase.js')) {
    const src = String(r.source).replace(/import\\.meta\\.env/g, "({ VITE_SUPABASE_URL: 'http://127.0.0.1:9', VITE_SUPABASE_ANON_KEY: 'prueba' })");
    return { ...r, source: src, shortCircuit: true };
  }
  return r;
}`));
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEXTOS_PROXIMAMENTE, CODIGOS_IA, PALABRAS_TECNICAS_IA, clasificarRespuestaIA, errorDeIA, estadoDeErrorIA, registrarErrorIA,
} from '../src/lib/disponibilidadIA.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

console.log('\n1 · Lo que todavía no está habilitado');
eq(TEXTOS_PROXIMAMENTE.titulo, 'Estamos preparando algo nuevo.', 'el título, el que pidió Josué');
ok(/todavía no está disponible/.test(TEXTOS_PROXIMAMENTE.texto) && /a la altura de Jos Style/.test(TEXTOS_PROXIMAMENTE.texto) && /Estará disponible próximamente\./.test(TEXTOS_PROXIMAMENTE.texto), '…y su texto');
ok(!/\b(19|20)\d\d\b|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|semanas?|\bdías\b|mes(es)?\b/i.test(TEXTOS_PROXIMAMENTE.texto), '🚨 sin una fecha ni un plazo inventados (apartado 5)');
const sinClave = clasificarRespuestaIA(503, { codigo: 'ia_no_habilitada', error: 'La inteligencia artificial todavía no está disponible.', tecnico: 'Añade ANTHROPIC_API_KEY…' });
eq([sinClave.codigo, sinClave.tipo], ['ia_no_habilitada', 'pendiente'], 'el servidor sin su clave: «todavía no»');
eq(estadoDeErrorIA(errorDeIA(sinClave)).pendiente, true, '…y la pantalla enseña el estado de próxima disponibilidad');
const sinDesplegar = clasificarRespuestaIA(404, null);
eq([sinDesplegar.codigo, sinDesplegar.tipo], ['ia_no_habilitada', 'pendiente'], 'la función sin desplegar (un 404 que no es JSON): «todavía no»');
const antiguo = clasificarRespuestaIA(503, { error: 'IA no configurada todavía. Añade ANTHROPIC_API_KEY en las variables de entorno del proyecto en Vercel.' });
eq(antiguo.tipo, 'error', '⚠️ una respuesta sin código no se da por «todavía no»: un 503 cualquiera es un fallo (no se esconde un error real tras un «próximamente»)');

console.log('\n2 · Ni una API Key en la pantalla');
ok(!PALABRAS_TECNICAS_IA.test(TEXTOS_PROXIMAMENTE.titulo + TEXTOS_PROXIMAMENTE.texto), 'el estado de próxima disponibilidad no nombra nada interno');
for (const [codigo, c] of Object.entries(CODIGOS_IA)) ok(!PALABRAS_TECNICAS_IA.test(c.texto), `«${codigo}» se dice sin palabras técnicas`);
ok(PALABRAS_TECNICAS_IA.test('Añade ANTHROPIC_API_KEY en las variables de entorno del proyecto en Vercel.'), '…y el barrido SÍ caza la frase de antes (no puede pasar sin mirar)');
eq(errorDeIA(sinClave).message, CODIGOS_IA.ia_no_habilitada.texto, '🚨 el `message` del error es la frase, no la técnica');
ok(/ANTHROPIC_API_KEY/.test(errorDeIA(sinClave).tecnico), '…lo técnico va aparte (`tecnico`), para la consola');
const SRC = ['src/components/ui.jsx', 'src/views/EstudiosView.jsx', 'src/views/ObjectivesView.jsx', 'src/views/TrainingView.jsx', 'src/views/NutritionView.jsx'];
for (const r of SRC) {
  const c = leer(r);
  ok(!/set\w*\(\s*(e|err|error)\.message \|\| '[^']*\bIA\b/.test(c), `${r}: ninguna pantalla pinta \`e.message\` de la IA`);
  ok(!/(Configurar|Introducir|Añadir)\s+(la\s+)?(API|clave)/i.test(c), `${r}: ni «Configurar API Key» ni «Introducir clave»`);
}
const AI = leer('src/lib/ai.js');
ok(!/throw new Error\(data\.error/.test(AI) && (AI.match(/return leerRespuesta\(res\)/g) || []).length === 3, 'ai.js ya no lanza la frase del servidor: las tres llamadas pasan por `leerRespuesta`');
const API = leer('api/ask-ai.js');
const respuestas = API.match(/res\.status\(\d+\)\.json\(\{[\s\S]*?\}\)/g) || [];
const sinCodigo = respuestas.filter((r) => !/codigo:/.test(r) && !/status\(200\)/.test(r));
eq(sinCodigo, [], '🚨 cada respuesta de error del servidor lleva su `codigo`');
ok(/codigo: 'ia_no_habilitada',\s*error: 'La inteligencia artificial todavía no está disponible\.',\s*tecnico: 'IA no configurada todavía\. Añade ANTHROPIC_API_KEY/.test(API), '…y sin clave: la frase para el usuario y la técnica, separadas');
ok(/process\.env\.ANTHROPIC_API_KEY/.test(API) && /process\.env\.ANTHROPIC_MODEL/.test(API), '🚨 la clave y el modelo se siguen leyendo igual (no se ha tocado la configuración)');

console.log('\n3 · Lo que funciona sigue funcionando (con `fetch` simulado)');
const respuestas_sim = [];
globalThis.fetch = async (url, init) => {
  respuestas_sim.push({ url, cuerpo: JSON.parse(init.body) });
  const r = globalThis.__respuesta;
  if (r === 'red') throw new TypeError('Failed to fetch');
  return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => { if (r.cuerpo === undefined) throw new SyntaxError('no es JSON'); return r.cuerpo; } };
};
let ai;
try { ai = await import('../src/lib/ai.js'); } catch (e) { ai = null; console.log(`  (ai.js no se puede importar en Node: ${e.message})`); }
if (ai) {
  globalThis.__respuesta = { status: 200, cuerpo: { text: 'Hola, Josué.' } };
  eq(await ai.askAI('s', 'p'), 'Hola, Josué.', '🚨 una respuesta buena devuelve su texto, como siempre');
  eq(respuestas_sim.at(-1).url, '/api/ask-ai', '…al mismo endpoint');
  eq(respuestas_sim.at(-1).cuerpo, { system: 's', prompt: 'p' }, '…con el mismo cuerpo');
  globalThis.__respuesta = { status: 200, cuerpo: { text: 'Plato' } };
  eq(await ai.askAIWithImage('s', 'p', 'BASE64'), 'Plato', 'con una foto, igual');
  eq(respuestas_sim.at(-1).cuerpo.image, { data: 'BASE64', mediaType: 'image/jpeg' }, '…y la foto viaja como antes');
  globalThis.__respuesta = { status: 200, cuerpo: { text: 'Fotogramas' } };
  eq(await ai.askAIWithImages('s', 'p', ['A', 'B']), 'Fotogramas', 'con varias imágenes, igual');
  const lanza = async (resp) => { globalThis.__respuesta = resp; try { await ai.askAI('s', 'p'); return null; } catch (e) { return e; } };
  const e1 = await lanza({ status: 503, cuerpo: { codigo: 'ia_no_habilitada', error: 'x', tecnico: 'Añade ANTHROPIC_API_KEY' } });
  ok(e1 && e1.tipo === 'pendiente' && !/ANTHROPIC/.test(e1.message), '1 · sin clave: un error «todavía no», sin la clave en su texto');
  console.log('\n4 · Los fallos de verdad se dicen');
  const e2 = await lanza({ status: 404, cuerpo: { codigo: 'modelo_no_disponible', error: 'x', tecnico: 'El modelo «claude-x» no está disponible' } });
  ok(e2 && e2.tipo === 'error' && e2.codigo === 'modelo_no_disponible', '🚨 un modelo mal configurado es un ERROR, no un «próximamente»');
  eq(estadoDeErrorIA(e2), { pendiente: false, texto: CODIGOS_IA.modelo_no_disponible.texto }, '…con una frase que se entiende');
  const e3 = await lanza('red');
  ok(e3 && e3.codigo === 'sin_conexion' && e3.tipo === 'error', 'sin red: «sin conexión»');
  const e4 = await lanza({ status: 500, cuerpo: undefined });
  ok(e4 && e4.codigo === 'error_servicio', 'una respuesta rota (sin JSON): un fallo del servicio, no un cuelgue');
  const e5 = await lanza({ status: 401, cuerpo: { codigo: 'sin_sesion', error: 'Inicia sesión para usar la IA.' } });
  eq(estadoDeErrorIA(e5).texto, CODIGOS_IA.sin_sesion.texto, 'sin sesión: se dice');
  const e6 = await lanza({ status: 429, cuerpo: { codigo: 'limite', error: 'x' } });
  eq(estadoDeErrorIA(e6).texto, CODIGOS_IA.limite.texto, 'el límite: se dice');
} else {
  ok(false, 'ai.js tiene que poder importarse para probar su comportamiento');
}
eq(estadoDeErrorIA(new SyntaxError('Unexpected token'), 'No he podido generar el plan ahora mismo.'), { pendiente: false, texto: 'No he podido generar el plan ahora mismo.' },
  'un fallo que no es de la IA (un JSON mal formado) conserva la frase de su pantalla');
const avisos = [];
const avisoOriginal = console.warn;
console.warn = (...a) => avisos.push(a.join(' '));
registrarErrorIA(errorDeIA(sinClave), 'Prueba');
console.warn = avisoOriginal;
ok(avisos.length === 1 && /ia_no_habilitada/.test(avisos[0]) && /ANTHROPIC_API_KEY/.test(avisos[0]), '🚨 lo técnico se registra en la consola, para diagnosticar (apartado 5)');

console.log('\n1 y 5 · En cada función de IA, y se puede volver');
const UI = leer('src/components/ui.jsx');
ok(/export function IAProximamente/.test(UI), 'una sola pieza compartida: `IAProximamente` (en ui.jsx, junto al panel de la IA)');
ok(/role="status"/.test(UI.slice(UI.indexOf('export function IAProximamente'), UI.indexOf('export function AIPanel'))), '…que se anuncia sola con VoiceOver');
ok(/\{TEXTOS_PROXIMAMENTE\.volver\}/.test(UI) && TEXTOS_PROXIMAMENTE.volver === 'Entendido', '…y se cierra con «Entendido», que deja la pantalla como estaba');
const SITIOS = [
  ['src/components/ui.jsx', 'el panel de la IA (seis módulos)', 'AIPanel'],
  ['src/components/ui.jsx', 'las sugerencias de arriba', 'Sugerencias'],
  ['src/views/EstudiosView.jsx', '«Explícame un concepto»', 'Explícame un concepto'],
  ['src/views/EstudiosView.jsx', 'el plan de repaso de un examen', 'Plan de repaso'],
  ['src/views/ObjectivesView.jsx', 'la revisión de objetivos', 'Revisión de objetivos'],
  ['src/views/TrainingView.jsx', 'la progresión de calistenia', 'Progresión de calistenia'],
  ['src/views/TrainingView.jsx', 'el análisis de un vídeo', 'Análisis de vídeo'],
  ['src/views/NutritionView.jsx', 'la foto de un plato', 'Foto del plato'],
];
for (const [ruta, que, etiqueta] of SITIOS) {
  const c = leer(ruta);
  ok(c.includes(`registrarErrorIA(e, '${etiqueta}')`) || c.includes(`registrarErrorIA(err, '${etiqueta}')`), `${que}: registra lo técnico y decide con \`estadoDeErrorIA\``);
}
for (const ruta of new Set(SITIOS.map((s) => s[0]))) ok(/<IAProximamente/.test(leer(ruta)), `${ruta} enseña \`IAProximamente\``);
const TRAIN = leer('src/views/TrainingView.jsx');
ok(/if \(estadoDeErrorIA\(err\)\.pendiente\) setIaPendienteVideo\(video\.id\);\s*else onSetVideoFeedback/.test(TRAIN), '🚨 con la IA sin habilitar NO se guarda un «no se ha podido» como análisis del vídeo');

console.log('\n6 y 7 · Motion y tamaños');
const bloque = UI.slice(UI.indexOf('export function IAProximamente'), UI.indexOf('export function AIPanel'));
ok(/vacio-entra/.test(bloque), 'aparece en su sitio con `vacio-entra` (Motion System: en Reducido, solo el fundido)');
ok(!/style=\{\{[^}]*transition/.test(bloque) && !/animation:/.test(bloque), '…sin una animación escrita a mano');
ok(/min-w-0/.test(bloque) && !/w-\[\d{3,}px\]|width: \d{3,}/.test(bloque), '…y sin anchos fijos: cabe en un iPhone pequeño y en un ordenador');

console.log('\n8 · Sin regresiones');
ok(/export async function askAI\(systemPrompt, userPrompt\)/.test(AI) && /export async function askAIWithImage\(/.test(AI) && /export async function askAIWithImages\(/.test(AI), 'las tres funciones de siempre, con su firma');
ok(/Authorization = `Bearer \$\{token\}`/.test(AI), 'y la sesión viaja como antes (EH F63)');

console.log(`\n${n - fallos}/${n} comprobaciones${fallos ? ` · ${fallos} FALLOS` : ''}`);
process.exit(fallos ? 1 : 0);
