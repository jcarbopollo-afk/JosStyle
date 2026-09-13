// ---------------------------------------------------------------------------
// Comprueba la coherencia de la navegación de JosStyle leyendo App.jsx:
//
//   1. Todo módulo de MORE_NAV aparece exactamente una vez en AREAS_NAV
//      —salvo 'ajustes', que desde DIST F1 es la QUINTA PESTAÑA y no vive
//      dentro de ningún área—.
//   2. Todo módulo de MORE_NAV se puede pintar: o tiene su `case` en el switch,
//      o es una agrupadora que `renderContent` resuelve con `AgrupadorView`.
//   3. Todo `case` del switch es alcanzable: como módulo de MORE_NAV, como
//      sub-app de una agrupadora, como mini-app de Productividad, o 'hoy'.
//   4. Todo módulo de MORE_NAV es buscable: tiene palabras clave en
//      `indiceBusqueda.js` (BI Fase 2). Sin ellas el módulo solo se encuentra
//      escribiendo su nombre exacto, que es justo lo que la fase vino a evitar.
//   5. Y ninguna palabra clave apunta a un id que ya no lleva a ninguna parte.
//
// Existe porque estas cosas se han comprobado a mano fase a fase desde la
// Fase N1, y es justo el tipo de comprobación que un script hace mejor que una
// persona. Un módulo huérfano (navegable pero sin `case`, o al revés) es un
// error silencioso: no rompe el build, solo deja una pantalla en blanco.
//
// 🚨 DIST F1 — **LA JERARQUÍA PASÓ DE DOS NIVELES A TRES**, así que este
// comprobador tuvo que aprenderla. Antes «navegable» y «módulo de MORE_NAV»
// eran lo mismo; ahora Fe, Relación, Bienestar digital, Tareas, Calendario,
// Horario y Rachas **se pintan sin estar en MORE_NAV**, porque se llega a ellos
// desde dentro de Mente, Organización o Productividad. Sin enseñárselo, marcaba
// siete `case` como código inalcanzable teniendo la navegación bien — y lo peor:
// habría hecho falta relajarlo hasta que callara, que es como se le escapa uno
// de verdad. Lo que hace es **conocer las tres puertas**, no mirar menos.
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { PALABRAS_MODULOS } from '../src/lib/indiceBusqueda.js';
import { IDS_AGRUPADORES, APPS_DE_AGRUPADORES } from '../src/lib/agrupadores.js';
import { IDS_MINI_APPS_PR } from '../src/lib/productividad.js';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const fallos = [];

// --- MORE_NAV: catálogo plano de módulos ---
const moreNavBloque = src.match(/const MORE_NAV = \[([\s\S]*?)\n\];/);
if (!moreNavBloque) {
  console.error('  ✗ No se ha encontrado MORE_NAV en App.jsx');
  process.exit(1);
}
const moreNav = [...moreNavBloque[1].matchAll(/id: '([^']+)'/g)].map((m) => m[1]);

// --- AREAS_NAV: reparto de esos módulos en las áreas ---
const areasBloque = src.match(/const AREAS_NAV = \[([\s\S]*?)\n\];/);
if (!areasBloque) {
  console.error('  ✗ No se ha encontrado AREAS_NAV en App.jsx');
  process.exit(1);
}
const areas = [...areasBloque[1].matchAll(/id: '(area-[^']+)'/g)].map((m) => m[1]);
const enAreas = [...areasBloque[1].matchAll(/modulos: \[([^\]]*)\]/g)]
  .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));

// --- Los `case` del switch de renderModulo ---
const cases = [...src.matchAll(/^\s*case '([^']+)':/gm)].map((m) => m[1]);

/* Las sub-apps que se pintan desde dentro de otra pantalla. No están en
   MORE_NAV a propósito: se llega a ellas por su agrupadora (Mente,
   Organización) o por Productividad, y su `case` sigue haciendo falta porque un
   enlace directo del buscador o de Hoy también tiene que resolver. */
const subApps = APPS_DE_AGRUPADORES.map((a) => a.id);
const dentroDeProductividad = IDS_MINI_APPS_PR.filter((id) => !moreNav.includes(id));
const alcanzables = new Set([...moreNav, ...subApps, ...dentroDeProductividad, 'hoy']);

/* 🚨 La quinta pestaña. Josué (DIST F1): *"La pestaña actual «Más» debe
   desaparecer como categoría principal y pasar a llamarse directamente
   «Ajustes»"*, así que Ajustes es un módulo que NO pertenece a ningún área.
   Está escrito aquí, y no como un `if` suelto, para que se vea que es una
   excepción declarada y no un descuido. */
const FUERA_DE_AREA = ['ajustes'];

// 1. Cada módulo de MORE_NAV, exactamente una vez en AREAS_NAV
for (const id of moreNav) {
  const veces = enAreas.filter((x) => x === id).length;
  if (veces === 0 && !FUERA_DE_AREA.includes(id)) {
    fallos.push(`'${id}' está en MORE_NAV pero no en ninguna área de AREAS_NAV`);
  }
  if (veces > 1) fallos.push(`'${id}' aparece ${veces} veces en AREAS_NAV (debe aparecer una sola)`);
  if (veces > 0 && FUERA_DE_AREA.includes(id)) {
    fallos.push(`'${id}' es una pestaña propia y no debe estar además dentro de un área (saldría dos veces)`);
  }
}

// 2. Ningún módulo en AREAS_NAV que no exista en MORE_NAV
for (const id of new Set(enAreas)) {
  if (!moreNav.includes(id)) fallos.push(`'${id}' está en AREAS_NAV pero no existe en MORE_NAV`);
}

// 3. Cada módulo navegable se puede pintar: por su `case` o por ser agrupadora
for (const id of moreNav) {
  if (!cases.includes(id) && !IDS_AGRUPADORES.includes(id)) {
    fallos.push(`'${id}' es navegable pero no tiene 'case' en renderModulo (pantalla en blanco)`);
  }
}

// 4. Cada `case` es alcanzable por alguna de las tres puertas
for (const id of cases) {
  if (!alcanzables.has(id)) {
    fallos.push(`'case ${id}' existe en renderModulo pero no se llega desde ninguna parte (código inalcanzable)`);
  }
}

/* 5. Cada sub-app de una agrupadora tiene su `case`: es lo que la agrupadora le
      pide a `renderModulo` para pintarla. Sin él, la plaquita abre en blanco. */
for (const id of subApps) {
  if (!cases.includes(id)) {
    fallos.push(`'${id}' es una sub-app de una agrupadora pero no tiene 'case' en renderModulo (abriría en blanco)`);
  }
}

/* 6. Y ninguna sub-app está ADEMÁS en MORE_NAV: saldría dos veces en la
      navegación, que es exactamente el duplicado que DIST F1 vino a evitar. */
for (const id of subApps) {
  if (moreNav.includes(id)) {
    fallos.push(`'${id}' está dentro de una agrupadora Y en MORE_NAV: se vería dos veces`);
  }
}

// 7. Cada módulo es buscable por sinónimos. Se comprueba contra el MORE_NAV real de
//    App.jsx, no contra una copia, para que un módulo nuevo no pueda entrar en la
//    navegación y quedarse fuera del buscador sin que nadie se entere.
for (const id of moreNav) {
  const palabras = PALABRAS_MODULOS[id];
  if (!palabras || palabras.length === 0) {
    fallos.push(`'${id}' es navegable pero no tiene palabras clave en indiceBusqueda.js (solo se encontrará por su nombre exacto)`);
  }
}

// 8. Y al revés: palabras clave de un módulo que ya no existe son ruido en el índice.
for (const id of Object.keys(PALABRAS_MODULOS)) {
  if (!moreNav.includes(id)) {
    fallos.push(`indiceBusqueda.js tiene palabras clave para '${id}', que no está en MORE_NAV`);
  }
}

if (fallos.length) {
  for (const f of fallos) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`  ✓ Navegación coherente (${moreNav.length} módulos, ${subApps.length} sub-apps, ${cases.length} cases, ${areas.length} áreas + Ajustes, todos buscables)`);
