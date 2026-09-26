// scripts/recorrido-parcial.mjs — el recorrido de Chromium, desde UNA sección.
//
// Uso:  node scripts/recorrido-parcial.mjs "FIT F37 — microinteracciones" [puerto]
//
// 🚨 **NO SUSTITUYE A `verificar.sh`.** Una fase sube a `main` con la pasada
// entera en verde, siempre. Esto es para ITERAR sobre una sección sin esperar
// los cincuenta minutos del recorrido completo: se queda con el arranque, con
// las definiciones de las que depende lo que se lanza —aunque estén en
// secciones de antes— y con todo lo que va desde el marcador hasta el final.
//
// ⚠️ Lo que NO trae son los EFECTOS de las secciones de antes: si una sección
// depende de lo que otra dejó guardado, aquí sale roja y en la pasada entera
// no. Eso ya es un fallo de la sección (E3 F6: cada una limpia lo que mira),
// así que lo que diga este atajo también vale.
//
// Nació en la FIT F37: la F36 salió roja en la pasada entera por dos fallos de
// su propio escenario, y cada intento costaba otra hora.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [marcador, puerto = '5299'] = process.argv.slice(2);
if (!marcador) {
  console.error('Falta el marcador: el texto con el que empieza la sección (p. ej. "FIT F37 —").');
  process.exit(2);
}

const require = createRequire(join(RAIZ, 'package.json'));
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const src = readFileSync(join(RAIZ, 'scripts/test-app-real.mjs'), 'utf8');
const cuerpo = parse(src, { sourceType: 'module', allowAwaitOutsideFunction: true }).program.body;

const declara = (st) => {
  if (st.type === 'VariableDeclaration') return st.declarations.flatMap((d) => (d.id.type === 'Identifier' ? [d.id.name] : []));
  if (st.type === 'FunctionDeclaration' && st.id) return [st.id.name];
  return [];
};
/* El arranque es todo lo de antes de la primera comprobación de la app. */
const finArranque = cuerpo.findIndex((st) => declara(st).includes('inicio'));
const pos = src.indexOf(marcador);
if (finArranque < 0 || pos < 0) {
  console.error(pos < 0 ? `No encuentro «${marcador}» en test-app-real.mjs.` : 'No encuentro el final del arranque.');
  process.exit(2);
}
const desde = cuerpo.findIndex((st) => st.end > pos);

const quedan = new Set();
for (let i = 0; i < finArranque; i += 1) quedan.add(i);
for (let i = desde; i < cuerpo.length; i += 1) quedan.add(i);

const nombresUsados = (st) => {
  const s = new Set();
  traverse({ type: 'File', program: { type: 'Program', body: [st], sourceType: 'module' } }, {
    noScope: true,
    Identifier(p) { s.add(p.node.name); },
  });
  return s;
};
const dondeSeDefine = new Map();
cuerpo.forEach((st, i) => declara(st).forEach((n) => { if (!dondeSeDefine.has(n)) dondeSeDefine.set(n, i); }));

/* Las definiciones de las que depende, y las de las que dependen ellas. */
for (let cambio = true; cambio;) {
  cambio = false;
  for (const i of [...quedan]) {
    for (const n of nombresUsados(cuerpo[i])) {
      const j = dondeSeDefine.get(n);
      if (j !== undefined && !quedan.has(j)) { quedan.add(j); cambio = true; }
    }
  }
}

const trozos = [...quedan].sort((a, b) => a - b).map((i) => src.slice(cuerpo[i].start, cuerpo[i].end));
const salida = join(RAIZ, 'node_modules/.cache/recorrido-parcial.mjs');
mkdirSync(dirname(salida), { recursive: true });
/* Otro puerto: así no choca con una pasada entera que esté en marcha. */
writeFileSync(salida, trozos.join('\n').replace('const PUERTO = 5199;', `const PUERTO = ${Number(puerto)};`));
console.log(`Recorrido parcial desde «${marcador}»: ${quedan.size} de ${cuerpo.length} sentencias, puerto ${puerto}.`);

const r = spawnSync(process.execPath, [salida], { cwd: RAIZ, stdio: 'inherit' });
process.exit(r.status ?? 1);
