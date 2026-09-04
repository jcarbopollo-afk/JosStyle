// ============================================================================
// ENTREGA 3 · FASE 3 — ARMARIO: CATEGORÍAS, ICONOGRAFÍA Y DETALLE VISUAL
//
// Las once condiciones del criterio final de aceptación, y sobre todo la que
// más se puede romper sola:
//
// 🐛 **`CATEGORIAS_ARMARIO` declaraba un `icono` desde AR F1 y NADIE LO LEÍA.**
// La pantalla pintaba `<Shirt>` a pelo, así que un reloj salía con una camiseta
// y ocho categorías compartían dibujo. Un campo que no lee nadie no falla nunca:
// se queda ahí, pareciendo que funciona. Estas pruebas lo atan al código.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIAS_ARMARIO, categoriaDe, zonaDeCategoria, ZONAS_OUTFIT, crearPrenda, actualizarPrenda, prendasVisibles } from '../src/lib/armario';
import { ICONOS_CATEGORIA, ICONOS_EXTRA, iconoDeCategoria } from '../src/components/iconosPrenda';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

/* ⚠️ `process.cwd()` y no `import.meta.url`: `smoke.mjs` compila esta prueba con
   esbuild y ejecuta el paquete desde `node_modules/.cache/`, así que una ruta
   relativa al archivo apunta dentro de `node_modules`. `verificar.sh` hace `cd`
   a la raíz antes de lanzar nada, y las demás pruebas JSX hacen lo mismo. */
const RAIZ = process.cwd();
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (t) => t
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

console.log('\n═══ 1. ROPA INTERIOR (apartado 1) ═══\n');

const ids = CATEGORIAS_ARMARIO.map((c) => c.id);
ok(ids.includes('ropa_interior'), '🚨 existe la categoría Ropa interior');
ok(categoriaDe('ropa_interior').label === 'Ropa interior', 'y se llama así en pantalla');

// *"Debe funcionar exactamente igual que el resto de categorías del armario."*
const boxer = crearPrenda({ nombre: 'Bóxer negro', categoria: 'ropa_interior', color: 'negro' });
ok(boxer.categoria === 'ropa_interior', 'se puede crear una prenda de ropa interior');
ok(actualizarPrenda(boxer, { nombre: 'Bóxer gris' }).categoria === 'ropa_interior',
  '⚠️ y editarla no le cambia la categoría por el camino');
ok(prendasVisibles([boxer], { categoria: 'ropa_interior' }).length === 1,
  '🚨 y se filtra por su categoría como cualquier otra (apartado 1: "exactamente igual que el resto")');
ok(zonaDeCategoria('ropa_interior') === 'otros',
  'tiene su zona en el constructor de outfits: no desaparece de ahí');
ok(ZONAS_OUTFIT.find((z) => z.id === 'otros').categorias.includes('ropa_interior'),
  'y está escrito en la lista, no solo por el respaldo');

console.log('\n═══ 2. UN ICONO POR CATEGORÍA (apartados 3 y 4) ═══\n');

const sinIcono = ids.filter((id) => !ICONOS_CATEGORIA[id]);
ok(sinIcono.length === 0,
  `🚨 TODAS las categorías tienen su icono${sinIcono.length ? ` — faltan: ${sinIcono.join(', ')}` : ''}`);
ok(CATEGORIAS_ARMARIO.every((c) => typeof c.icono === 'string' && c.icono.length > 0),
  'y cada línea del catálogo dice cuál es');

// El apartado 3 lo nombra expresamente: *"Accesorios ya no utiliza un icono de camiseta"*.
ok(ICONOS_CATEGORIA.accesorios !== ICONOS_CATEGORIA.camisetas,
  '🚨 Accesorios YA NO usa el icono de camiseta (apartado 3, dicho con esas palabras)');
ok(ICONOS_CATEGORIA.pantalones !== ICONOS_CATEGORIA.camisetas,
  '🚨 y Pantalones tampoco: tiene un icono de pantalón (apartado 8)');

// *"Detectar categorías que actualmente compartan iconos"* (apartado 4).
const repetidos = [];
const vistos = new Map();
for (const id of ids) {
  const icono = ICONOS_CATEGORIA[id];
  if (vistos.has(icono)) repetidos.push(`${vistos.get(icono)} y ${id}`);
  else vistos.set(icono, id);
}
repetidos.forEach((r) => console.log(`  ✗ comparten icono: ${r}`));
ok(repetidos.length === 0, '🚨 Ninguna categoría comparte icono con otra (antes lo compartían ocho)');

ok(Object.keys(ICONOS_CATEGORIA).length >= 15,
  `⚠️ la biblioteca es lo bastante amplia (${Object.keys(ICONOS_CATEGORIA).length} iconos, apartado 4)`);
ok(Object.keys(ICONOS_EXTRA).length >= 3,
  'y hay iconos de prenda sueltos para dentro de las categorías (apartado 5)');

ok(!!iconoDeCategoria('no_existe'),
  '⚠️ una categoría que ya no está en el catálogo sigue pintando algo, no revienta');
ok(iconoDeCategoria('no_existe') === ICONOS_CATEGORIA.otros,
  'y lo que pinta es la caja de "Otros", como hace `categoriaDe`');

console.log('\n═══ 3. EL MISMO LENGUAJE VISUAL (apartado 4) ═══\n');

const ICONOS = leer('src/components/iconosPrenda.jsx');
const codigo = sinComentarios(ICONOS);

ok(/from 'lucide-react'/.test(codigo),
  '⚠️ lo que SÍ existe en Lucide se coge de Lucide, no se redibuja');
for (const deLucide of ['Shirt', 'Watch', 'Footprints', 'Package']) {
  ok(new RegExp(`\\b${deLucide}\\b`).test(codigo.split('\n')[codigo.split('\n').findIndex((l) => l.includes('lucide-react'))] || ''),
    `  · ${deLucide} viene de Lucide`);
}

// La gramática de Lucide: 24×24, solo trazo, grosor 2, extremos redondeados.
ok(/viewBox="0 0 24 24"/.test(codigo), 'los iconos propios usan el lienzo de 24×24 de Lucide');
ok(/fill="none"/.test(codigo), 'solo trazo, sin relleno');
ok(/stroke="currentColor"/.test(codigo), 'y el color lo hereda del texto, como cualquier icono de la app');
ok(/strokeWidth="2"/.test(codigo) && /strokeLinecap="round"/.test(codigo) && /strokeLinejoin="round"/.test(codigo),
  'mismo grosor y mismos remates redondeados: no se notan de otra familia');

// Apartado 4: *"No utilizar emojis directamente."*
const emojis = (codigo.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []);
ok(emojis.length === 0, `🚨 ni un emoji en la iconografía${emojis.length ? ` — hay ${emojis.join(' ')}` : ''} (apartado 4)`);

// Y una sola base: si cambia el grosor de trazo de la app, cambia en un sitio.
ok((codigo.match(/<svg/g) || []).length === 1,
  '⚠️ hay UNA sola base `<svg>` compartida: nueve copias envejecerían por separado');

console.log('\n═══ 4. EN LA PANTALLA (apartados 5, 6 y 7) ═══\n');

const VISTA_BRUTA = leer('src/views/ArmarioView.jsx');
const VISTA = sinComentarios(VISTA_BRUTA);

ok(/import \{ IconoCategoria \} from '\.\.\/components\/iconosPrenda'/.test(VISTA),
  'la vista importa el resolutor de iconos');
ok(/<IconoCategoria categoria=\{prenda\.categoria\}/.test(VISTA),
  '🚨 la miniatura sin foto pinta el icono de SU categoría, no una camiseta siempre');
ok(/<IconoCategoria categoria=\{c\.id\}/.test(VISTA),
  'y las píldoras de filtro llevan el suyo');

// Apartado 6 — *"no aumentar innecesariamente el tamaño"*. El icono entra en la
// píldora que ya existía; si alguien la convierte en una tarjeta, esto salta.
const pildora = VISTA.slice(VISTA.indexOf('<IconoCategoria categoria={c.id}') - 700, VISTA.indexOf('<IconoCategoria categoria={c.id}'));
ok(/rounded-full/.test(pildora) && /text-xs/.test(pildora),
  '⚠️ el icono va DENTRO de la píldora pequeña de siempre: la lista sigue compacta (apartado 6)');
ok(/<IconoCategoria categoria=\{c\.id\} size=\{1[0-9]\}/.test(VISTA),
  'y es pequeño, no un dibujo grande');

// Apartado 7 — *"mantener todo lo que ya funciona"*.
for (const pieza of ['crearOutfit', 'composicionPorZonas', 'resumenHistorial', 'usosDePrenda', 'prendasVisibles']) {
  ok(VISTA.includes(pieza), `⚠️ \`${pieza}\` sigue en su sitio: esta fase es un upgrade de detalle (apartado 7)`);
}
ok(/<Shirt size=\{18\}/.test(VISTA),
  '⚠️ y "Mi armario" sigue con su camiseta: ahí sí representa el módulo entero');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
