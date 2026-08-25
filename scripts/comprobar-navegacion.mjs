// ---------------------------------------------------------------------------
// Comprueba la coherencia de la navegación de JC Fitness leyendo App.jsx:
//
//   1. Todo módulo de MORE_NAV aparece exactamente una vez en AREAS_NAV.
//   2. Todo módulo de MORE_NAV tiene un `case` en el switch de renderContent.
//   3. Todo `case` del switch (salvo 'hoy', que vive en la pestaña Inicio)
//      está declarado en MORE_NAV.
//
// Existe porque estas tres cosas se han comprobado a mano fase a fase desde la
// Fase N1, y es justo el tipo de comprobación que un script hace mejor que una
// persona. Un módulo huérfano (navegable pero sin `case`, o al revés) es un
// error silencioso: no rompe el build, solo deja una pantalla en blanco.
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const fallos = [];

// --- MORE_NAV: catálogo plano de módulos ---
const moreNavBloque = src.match(/const MORE_NAV = \[([\s\S]*?)\n\];/);
if (!moreNavBloque) {
  console.error('  ✗ No se ha encontrado MORE_NAV en App.jsx');
  process.exit(1);
}
const moreNav = [...moreNavBloque[1].matchAll(/id: '([^']+)'/g)].map((m) => m[1]);

// --- AREAS_NAV: reparto de esos módulos en las 4 áreas ---
const areasBloque = src.match(/const AREAS_NAV = \[([\s\S]*?)\n\];/);
if (!areasBloque) {
  console.error('  ✗ No se ha encontrado AREAS_NAV en App.jsx');
  process.exit(1);
}
const enAreas = [...areasBloque[1].matchAll(/modulos: \[([^\]]*)\]/g)]
  .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));

// --- Los `case` del switch de renderContent ---
const cases = [...src.matchAll(/^\s*case '([^']+)':/gm)].map((m) => m[1]);

// 1. Cada módulo de MORE_NAV, exactamente una vez en AREAS_NAV
for (const id of moreNav) {
  const veces = enAreas.filter((x) => x === id).length;
  if (veces === 0) fallos.push(`'${id}' está en MORE_NAV pero no en ninguna área de AREAS_NAV`);
  if (veces > 1) fallos.push(`'${id}' aparece ${veces} veces en AREAS_NAV (debe aparecer una sola)`);
}

// 2. Ningún módulo en AREAS_NAV que no exista en MORE_NAV
for (const id of new Set(enAreas)) {
  if (!moreNav.includes(id)) fallos.push(`'${id}' está en AREAS_NAV pero no existe en MORE_NAV`);
}

// 3. Cada módulo navegable tiene su `case`
for (const id of moreNav) {
  if (!cases.includes(id)) fallos.push(`'${id}' es navegable pero no tiene 'case' en renderContent (pantalla en blanco)`);
}

// 4. Cada `case` es alcanzable ('hoy' es la pestaña Inicio, vive fuera de MORE_NAV)
for (const id of cases) {
  if (id !== 'hoy' && !moreNav.includes(id)) {
    fallos.push(`'case ${id}' existe en renderContent pero no está en MORE_NAV (código inalcanzable)`);
  }
}

if (fallos.length) {
  for (const f of fallos) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`  ✓ Navegación coherente (${moreNav.length} módulos, ${cases.length} cases, 4 áreas)`);
