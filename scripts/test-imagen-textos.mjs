// ============================================================================
// Fase A de Imagen personal (2026-10-31) — ningún texto que se lea promete una fase
//
// Seis textos de pantalla y la ficha de los diecisiete apartados decían que algo
// «llega en la fase N» cuando esa fase ya se había construido (Pelo F9, F10 y F11,
// Skincare F14-F17, Barba F21). Era verdad el día que se escribieron, y nadie volvió
// a mirarlos. Esta suite barre lo que la pantalla lee para que no vuelva a pasar:
//   1. las constantes exportadas por las librerías de Imagen personal (`LIBRERIAS_EH`),
//      con una lista explícita de las internas que nombran una fase y NO se pintan;
//   2. lo que devuelven las funciones cuyos textos se pintan (paneles, fichas…);
//   3. que ninguna plaquita se quede en `listo: false`, que es lo único que hace
//      salir el respaldo «Llega en la fase N» de la vista.
// ⚠️ No borra ni oculta nada: solo comprueba.
// ============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

let n = 0;
let fallos = 0;
function ok(cond, msg) { n += 1; if (cond) console.log(`  ✓ ${msg}`); else { fallos += 1; console.log(`  ✗ ${msg}`); } }
function eq(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), `${msg}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`); }

const raiz = path.resolve(new URL('..', import.meta.url).pathname);
const lib = (f) => import(pathToFileURL(path.join(raiz, 'src/lib', `${f}.js`)).href);
const PROMETE_FASE = /\bfases?\s+\d/i;

console.log('\n1 · El detector caza lo que tiene que cazar');
ok(PROMETE_FASE.test('Los productos capilares se construyen en la fase 10.'), 'Caza «en la fase 10»');
ok(PROMETE_FASE.test('…llegan en las fases 14 a 17.'), 'Caza «en las fases 14 a 17»');
ok(!PROMETE_FASE.test('Tus productos capilares están en 🛒 Productos.'), 'Y no salta con un texto normal');

/* Constantes internas que nombran una fase y que ninguna pantalla pinta. Cada una
   con su motivo; la prueba comprueba además que de verdad no se importan en
   ninguna vista, componente ni en App.jsx. */
const INTERNAS = {
  'gestionModulos:MODULOS_DEL_ENUNCIADO_NO_CREADOS': 'Declara por qué cuatro módulos del enunciado no se crearon (auditoría de la F2).',
  'armarioEnEstiloHombre:PUENTE_PRODUCTOS': 'Declara el puente futuro a Productos (F5); la vista no lo importa.',
  'rendimiento:APARTADOS_RENDIMIENTO': 'Documentación de la F44.',
  'documentacionEH:COMO_ESTA_ORGANIZADO': 'Genera docs/08 (F53).',
};

console.log('\n2 · Las constantes exportadas por las librerías de Imagen personal');
const { LIBRERIAS_EH } = await lib('privacidadEstilo');
ok(Array.isArray(LIBRERIAS_EH) && LIBRERIAS_EH.length > 40, `Se recorren las ${LIBRERIAS_EH.length} librerías de Imagen personal`);
const hallazgos = [];
const vistos = new Set();
function recorre(v, ruta, raizNombre, d) {
  if (d > 7 || v == null) return;
  if (typeof v === 'string') { if (PROMETE_FASE.test(v)) hallazgos.push({ raizNombre, ruta, texto: v }); return; }
  if (typeof v !== 'object' || vistos.has(v)) return;
  vistos.add(v);
  for (const [k, x] of Object.entries(v)) recorre(x, `${ruta}.${k}`, raizNombre, d + 1);
}
for (const nombre of LIBRERIAS_EH) {
  const m = await lib(nombre);
  for (const [k, v] of Object.entries(m)) if (typeof v !== 'function') recorre(v, `${nombre}:${k}`, `${nombre}:${k}`, 0);
}
const fuera = hallazgos.filter((h) => !INTERNAS[h.raizNombre]);
eq(fuera.map((h) => `${h.ruta} → ${h.texto}`), [], '⚠️ Ninguna constante exportada que se pueda pintar promete una fase');

const pantallas = [
  readFileSync(path.join(raiz, 'src/App.jsx'), 'utf8'),
  ...readdirSync(path.join(raiz, 'src/views')).filter((f) => /\.jsx?$/.test(f)).map((f) => readFileSync(path.join(raiz, 'src/views', f), 'utf8')),
  ...readdirSync(path.join(raiz, 'src/components')).filter((f) => /\.jsx?$/.test(f)).map((f) => readFileSync(path.join(raiz, 'src/components', f), 'utf8')),
].join('\n');
for (const [clave, motivo] of Object.entries(INTERNAS)) {
  const nombre = clave.split(':')[1];
  ok(!new RegExp(`\\b${nombre}\\b`).test(pantallas), `${nombre} no se pinta en ninguna pantalla (${motivo})`);
}

console.log('\n3 · Lo que devuelven las funciones cuyos textos se pintan');
const eh = await lib('estiloDeHombre');
const base = eh.normalizarEstiloHombre({});
const rp = await lib('rutinasPelo');
const rcp = await lib('recomendacionesPelo');
const pc = await lib('perfilCapilar');
const pp = await lib('perfilPiel');
const gm = await lib('gestionModulos');
const textos = {
  'Pelo → Ajustes (baseParaRecomendar().nota)': rp.baseParaRecomendar(base).nota,
  'Pelo → Recomendaciones (PUENTE_PRODUCTOS_PELO.nota)': rcp.PUENTE_PRODUCTOS_PELO.nota,
  'Mi piel (panelPiel().nota)': pp.panelPiel(base).nota,
};
for (const q of pc.PREGUNTAS_PELO) textos[`Mi pelo → ${q.id} (ayuda)`] = q.ayuda || '';
for (const m of eh.MODULOS_EH) textos[`Gestionar → ficha de ${m.id}`] = gm.fichaModulo(base, m.id).avisoContenido;
for (const [donde, t] of Object.entries(textos)) ok(!PROMETE_FASE.test(t), `${donde}: no promete una fase`);
eq(rp.baseParaRecomendar(base).nota, 'Tus recomendaciones de pelo están en 💡 Recomendaciones, en tu panel de pelo.',
  'Pelo → Ajustes dice dónde están las recomendaciones');
eq(rcp.PUENTE_PRODUCTOS_PELO.nota, 'Tus productos capilares están en 🛒 Productos, en tu panel de pelo.',
  'Pelo → Recomendaciones dice dónde están los productos');
eq(pc.PREGUNTAS_PELO.find((q) => q.id === 'frecuenciaCorte').ayuda, 'Se usa para el calendario de peluquería.',
  'Mi pelo → «¿Cada cuánto…?» dice para qué se usa');
eq(pp.panelPiel(base).nota, 'Tus rutinas, seguimiento, recomendaciones y productos están en tu panel de Skincare.',
  'Mi piel dice dónde está lo demás');
ok(PROMETE_FASE.test(pp.auditarPiel().nota), 'La nota interna de la auditoría de Skincare se conserva tal cual (no se pinta)');
eq(pc.TEXTOS_PELO.educativo, 'Cuando llegue el apartado de educación podrás salir de dudas sin tener que adivinarlo.',
  'Y el texto de educación de Pelo se conserva (no promete una fase; Educación sigue prevista)');
// Los campos internos que acompañaban a esos textos no se tocan.
eq([rp.baseParaRecomendar(base).disponible, rp.baseParaRecomendar(base).fase], [false, 9], 'baseParaRecomendar conserva `disponible` y `fase`');
eq([rcp.PUENTE_PRODUCTOS_PELO.disponible, rcp.PUENTE_PRODUCTOS_PELO.fase, rcp.PUENTE_PRODUCTOS_PELO.etiqueta], [false, 10, 'Ver productos'],
  'PUENTE_PRODUCTOS_PELO conserva `disponible`, `fase` y `etiqueta`');

console.log('\n4 · Ninguna plaquita se queda en «Llega en la fase N»');
const listas = {};
// Solo se importan los archivos que declaran una lista de plaquitas (algunas librerías,
// como supabase.js, no se pueden cargar en Node).
const conPlaquitas = readdirSync(path.join(raiz, 'src/lib')).filter((x) => x.endsWith('.js'))
  .filter((f) => /^export const PLAQUITAS_/m.test(readFileSync(path.join(raiz, 'src/lib', f), 'utf8')));
for (const f of conPlaquitas) {
  const m = await lib(f.replace(/\.js$/, ''));
  for (const [k, v] of Object.entries(m)) if (/^PLAQUITAS_/.test(k) && Array.isArray(v)) listas[`${f}:${k}`] = v;
}
ok(Object.keys(listas).length >= 6, `Se recorren las ${Object.keys(listas).length} listas de plaquitas`);
for (const [k, v] of Object.entries(listas)) {
  eq(v.filter((p) => p.listo === false).map((p) => p.id), [], `${k}: ninguna plaquita «por llegar»`);
}
const { PLAQUITAS_BARBA } = await lib('perfilBarba');
eq(PLAQUITAS_BARBA.map((p) => p.id), ['perfil', 'rutina', 'seguimiento', 'productos'], 'Barba conserva sus cuatro plaquitas');

console.log(fallos ? `\n  ${fallos} de ${n} comprobaciones han fallado.` : `\n  ${n} comprobaciones correctas.`);
process.exit(fallos ? 1 : 0);
