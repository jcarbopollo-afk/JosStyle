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
//
// ── Y LA SEGUNDA REGLA: UN COMPONENTE JSX SIN IMPORTAR (EH F39) ────────────
//
// `IntegracionEH` usó `<Field label="…">` y **`Field` no está importado en
// `EstiloHombreView.jsx`**. React lanza al renderizar ese trozo, así que la
// tarjeta de confirmar **no llegaba a existir** y el botón que escribe la tarea
// tampoco. Ni el build ni los 1304 casos de renderizado lo vieron, porque esa
// tarjeta **solo aparece tras pulsar un botón** y ningún caso de renderizado
// llega ahí. Lo cazó el recorrido en Chromium — y a partir de aquí, también
// esto: todo `<Componente>` con mayúscula tiene que estar importado o definido
// en el propio archivo.
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

/* ---------------------------------------------------------------------------
   4 · REGLA INVARIANTE — un componente JSX usado sin importar (EH F39)
   ---------------------------------------------------------------------------
   ⚠️ Se mira **el archivo con sus textos**, no `sinTextos`: ése sustituye el
   texto suelto de JSX y podría llevarse una etiqueta por delante. Lo que sí se
   quitan son los comentarios, para no cazar un `<Componente>` de una cabecera.

   No se comprueban los nombres con punto (`<Foo.Bar>`), que son propiedades de
   algo ya importado, ni las etiquetas de HTML, que van en minúscula. */
const componentes = [];
for (const ruta of archivos) {
  const bruto = readFileSync(ruta, 'utf8');
  /* ⚠️ **Lo que ESTÁ en el archivo se busca en el BRUTO, y lo que se USA en el
     limpio.** `sinComentarios` no es un analizador: en `ui.jsx` se lleva 22 000
     caracteres de código de verdad, y con ellos la línea que define
     `FilaResultado`. Buscar las definiciones ahí daba tres falsos positivos.
     Al revés no pasa nada: perder una definición sería un aviso de más, perder
     un uso es solo un aviso de menos. Es la **octava vez** en este bloque que
     una comprobación salta con algo que estaba bien. */
  const usos = sinComentarios(bruto);
  if (!/<[A-Z]/.test(usos)) continue;

  const importados = new Set();
  for (const m of bruto.matchAll(/import\s*(?:([\w$]+)\s*,\s*)?\{([^}]*)\}\s*from/g)) {
    if (m[1]) importados.add(m[1]);
    for (const parte of m[2].split(',')) {
      const trozo = parte.trim();
      if (!trozo) continue;
      const alias = trozo.split(/\s+as\s+/);
      importados.add((alias[1] || alias[0]).trim());
    }
  }
  for (const m of bruto.matchAll(/import\s+([\w$]+)\s+from/g)) importados.add(m[1]);

  const definidos = new Set([
    ...[...bruto.matchAll(/\bfunction\s+([A-Z][\w$]*)/g)].map((m) => m[1]),
    ...[...bruto.matchAll(/\b(?:const|let|var)\s+([A-Z][\w$]*)/g)].map((m) => m[1]),
    /* ⚠️ Y el renombrado al desestructurar, que es como este proyecto recibe un
       icono: `function Bloque({ icono: Icono })`, y luego `<Icono …/>`. */
    ...[...bruto.matchAll(/:\s*([A-Z][\w$]*)\s*[,}=]/g)].map((m) => m[1]),
  ]);

  const usados = new Set([...usos.matchAll(/<([A-Z][\w$]*)[\s/>]/g)].map((m) => m[1]));
  for (const nombre of usados) {
    if (importados.has(nombre) || definidos.has(nombre)) continue;
    componentes.push(`${relative(RAIZ, ruta)} usa <${nombre}> sin importarlo ni definirlo`);
  }
}

if (componentes.length > 0) componentes.forEach((p) => console.log(`  ✗ ${p}`));
ok(componentes.length === 0,
  '⚠️ Ningún archivo usa un componente JSX sin importarlo (React lanzaría al pintar ese trozo)');

/* ===========================================================================
   3 · UN `const` DE PRIMER NIVEL DECLARADO DOS VECES
   ===========================================================================
   🚨 Existe porque pasó **dos veces en el mismo turno** (EH F18 y F19): el
   recorrido de Chromium es un módulo largo y plano, y una sección nueva que
   reutiliza un nombre ya usado —`portada`, `rut`— **no compila**. Ni el build
   ni las pruebas de renderizado lo ven, y cuesta una ejecución de doce minutos
   descubrirlo. Esto lo caza en un segundo. */

const PLANOS = ['scripts/test-app-real.mjs'];
const repetidos = [];
for (const rel of PLANOS) {
  const bruto = readFileSync(join(RAIZ, rel), 'utf8');
  const nombres = [...bruto.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=/gm)].map((m) => m[1]);
  const vistos = new Set();
  nombres.forEach((x) => {
    if (vistos.has(x)) repetidos.push(`${rel} declara \`const ${x}\` dos veces`);
    vistos.add(x);
  });
}
if (repetidos.length > 0) repetidos.forEach((p) => console.log(`  ✗ ${p}`));
ok(repetidos.length === 0,
  '⚠️ Ningún recorrido declara dos veces el mismo `const` (no compilaría, y se tarda 12 min en verlo)');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
