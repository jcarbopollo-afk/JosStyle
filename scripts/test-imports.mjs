// ============================================================================
// REGLA INVARIANTE — usar una función de `src/lib/` sin importarla
//
// ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
//
// EH F15 enganchó los registros de piel a la papelera desde `App.jsx` llamando a
// `eliminarRegistroPiel(...)` **y se olvidó de importarla**.
//
// Ni `vite build` ni las 632 pruebas de renderizado lo vieron: JavaScript no
// comprueba los identificadores al compilar, y `App.jsx` no se renderiza en las
// pruebas porque necesita Supabase. Habría sido un `ReferenceError` en el iPhone
// de Josué, al tocar el botón — el peor sitio posible para descubrirlo.
//
// ⚠️ Esto lo caza: recoge todo lo que exporta `src/lib/`, y para cada archivo de
// `src/` comprueba que cada uno de esos nombres que use esté importado ahí.
//
// Falsos positivos evitados: un nombre declarado en el propio archivo
// (`const x = …`, `function x`, `let x`, un parámetro desestructurado o una
// propiedad `x:`) no cuenta como uso de la función de la librería.
// ============================================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

const RAIZ = new URL('..', import.meta.url).pathname;
const LIB = join(RAIZ, 'src/lib');

const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

/* ⚠️ **Y sin literales de texto.** El primer barrido dio un falso positivo con
   `"Mano dominante (opcional)"`, que encajaba con `dominante(` — una función de
   `audioEventos.js`. Es la sexta vez en este bloque que una comprobación salta
   con algo que estaba bien: mirar QUÉ LÍNEA la hace saltar antes de tocar el
   código. */
const sinTextos = (t) => t
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``')
  // Y sin el texto suelto de JSX, que tampoco es código.
  .replace(/>[^<>{}]+</g, '><');

/* 1 · Qué exporta cada archivo de `src/lib/`. */
const exportaciones = new Map();   // nombre → [archivos]
for (const f of readdirSync(LIB).filter((x) => x.endsWith('.js'))) {
  const src = sinTextos(sinComentarios(readFileSync(join(LIB, f), 'utf8')));
  const nombres = [
    ...[...src.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]),
    ...[...src.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]),
  ];
  for (const nombre of nombres) {
    if (!exportaciones.has(nombre)) exportaciones.set(nombre, []);
    exportaciones.get(nombre).push(f);
  }
}

console.log(`\n  ${exportaciones.size} nombres exportados por src/lib/`);
ok(exportaciones.size > 100, 'Se han leído las exportaciones de la librería');

/* 2 · Los archivos que consumen la librería. */
const archivos = [];
const recorrer = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== 'lib') recorrer(p); continue; }
    if (/\.jsx?$/.test(e)) archivos.push(p);
  }
};
recorrer(join(RAIZ, 'src'));

/* 3 · Para cada uno: nombres importados, nombres declarados, nombres usados. */
const problemas = [];
for (const ruta of archivos) {
  const bruto = readFileSync(ruta, 'utf8');
  const src = sinTextos(sinComentarios(bruto));

  const importados = new Set();
  for (const m of src.matchAll(/import\s*(?:([\w$]+)\s*,\s*)?\{([^}]*)\}\s*from/g)) {
    if (m[1]) importados.add(m[1]);
    for (const parte of m[2].split(',')) {
      const trozo = parte.trim();
      if (!trozo) continue;
      // `x as y` deja `y` en el ámbito, que es lo que se usa.
      const alias = trozo.split(/\s+as\s+/);
      importados.add((alias[1] || alias[0]).trim());
    }
  }
  for (const m of src.matchAll(/import\s+([\w$]+)\s+from/g)) importados.add(m[1]);

  // Lo que el propio archivo declara con ese nombre no es un uso de la librería.
  const declarados = new Set([
    ...[...src.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
    ...[...src.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
    ...[...src.matchAll(/\b([A-Za-z_$][\w$]*)\s*:/g)].map((m) => m[1]),
  ]);

  for (const [nombre, origen] of exportaciones) {
    if (importados.has(nombre) || declarados.has(nombre)) continue;
    // Un uso de verdad: llamada, o referencia suelta que no sea una propiedad.
    const usado = new RegExp(`(?<![.\\w$])${nombre}\\s*\\(`).test(src);
    if (usado) {
      problemas.push(`${relative(RAIZ, ruta)} usa ${nombre}() (de ${origen.join(', ')}) sin importarla`);
    }
  }
}

console.log(`\n  ${archivos.length} archivos de src/ revisados`);
if (problemas.length > 0) problemas.forEach((p) => console.log(`  ✗ ${p}`));
ok(problemas.length === 0,
  '⚠️ Ningún archivo usa una función de src/lib/ sin importarla (sería un ReferenceError en el móvil)');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
