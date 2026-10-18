// ============================================================================
// 🐛 P4 — LOS DOS FALLOS VISUALES DEL iPHONE Y EL iPAD (2026-10-18)
//
// A · La tarjeta de progreso de Inicio se quedaba con el alto de abierta.
// B · Un rectángulo dibujado por su perímetro al abrir o volver a la aplicación.
//
// Lo que se ve en Chromium (alturas, toques, foco, recargar, volver a la pestaña,
// el anillo con el teclado) está en la sección «P4» del recorrido. Aquí, que la
// causa de cada uno no pueda volver: la estructura y la regla.
// ⚠️ Ninguna de las dos cosas se ha visto en un iPhone o un iPad de verdad: eso
// queda para Josué (R1).
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACORDEONES, ACORDEONES_RETIRADOS, condicionSC } from '../src/lib/scrollCabecera.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const DASH = leer('src/views/DashboardView.jsx');
const tarjeta = DASH.slice(DASH.indexOf('function TarjetaPuntuacion('), DASH.indexOf('// Ampliación del Dashboard — Centro de Control: a qué módulo pertenece'));

console.log('\nA · La tarjeta de progreso');
ok(tarjeta.length > 500, 'se encuentra la tarjeta (`TarjetaPuntuacion`)');
const boton = tarjeta.slice(tarjeta.indexOf('<button'), tarjeta.indexOf('</button>'));
ok(!/gridTemplateRows|<Plegable|<ul|puntuacion\.detalle/.test(boton), '🚨 el desglose ya NO vive dentro del `<button>` (WebKit mide un botón por su contenido: ésa era la causa)');
ok(/<Plegable abierto=\{expandido\}/.test(tarjeta) && tarjeta.indexOf('<Plegable') > tarjeta.indexOf('</button>'), '…va FUERA, en `Plegable` (MS F10): cerrado no está en la página, así que no puede dejar hueco');
ok(!/gridTemplateRows/.test(tarjeta), '…sin un acordeón de rejilla escrito a mano');
ok(!/opacity: expandido \? 1 : 0/.test(tarjeta), '🚨 …ni lo oculta solo la opacidad (el contenedor seguiría ocupando su sitio)');
ok(/aria-expanded=\{expandido\}/.test(tarjeta) && /aria-controls="puntuacion-desglose"/.test(tarjeta), 'el botón dice si está abierta (VoiceOver)');
ok(/<ChevronDespliegue abierto=\{expandido\}/.test(tarjeta), 'el icono gira con el estado (MS F3)');
ok(/puntuacion\.detalle\.map/.test(tarjeta) && /Solo cuentan las áreas en las que ya registras cosas/.test(tarjeta), 'el desglose y su texto, los de siempre (sale de los datos reales)');
ok(!/@media|innerWidth|matchMedia|onMouseEnter|onMouseOver|:hover/.test(tarjeta), '…y nada depende del tamaño de pantalla, del ratón ni del `hover`');
ok(!/(height|minHeight|maxHeight):\s*['"]?\d+px/.test(tarjeta), '…ni una altura fija');
ok(ACORDEONES.every((a) => a.componente !== 'TarjetaPuntuacion') && ACORDEONES_RETIRADOS.some((a) => a.componente === 'TarjetaPuntuacion' && /Plegable/.test(a.ahora)),
  'el catálogo de la SC F1 lo dice: ya no es un acordeón de rejilla, es `Plegable`');
const SC = condicionSC({ css: leer('src/index.css'), hub: leer('src/views/HubView.jsx'), dashboard: DASH });
ok(SC.ok, `…y la condición de la SC F1 sigue en verde (${SC.casillas.filter((c) => !c.ok).map((c) => c.id).join(', ') || 'todas'})`);
const PLEG = leer('src/components/layoutMotion.jsx');
ok(/if \(estado === 'cerrado'\) return null;/.test(PLEG), '`Plegable` cerrado se desmonta (por eso no deja hueco en ningún navegador)');

console.log('\nB · El rectángulo del perímetro');
const APP = leer('src/App.jsx');
ok(/<style>\{`\*:focus-visible:not\(\[tabindex='-1'\]\) \{ outline: 2px solid \$\{accent\}; outline-offset: 2px; \}`\}<\/style>/.test(APP),
  '🚨 el anillo de foco de la aplicación ya no se pinta en lo que tiene `tabIndex={-1}` (el contenedor de la pantalla, enfocado por código)');
ok(!/<style>\{`\*:focus-visible \{/.test(APP), '…la regla de antes (que lo pintaba alrededor de toda la pantalla) no vuelve');
ok(/ref=\{pantallaRef\} tabIndex=\{-1\} role="region"/.test(APP), 'el contenedor de la pantalla sigue pudiendo recibir el foco (VoiceOver no se queda en el vacío al navegar, MS F2/F12)');
const NAV = leer('src/components/navegacionMotion.js');
ok(/if \(perdido && ref\.current && typeof ref\.current\.focus === 'function'\) ref\.current\.focus\(\{ preventScroll: true \}\)/.test(NAV), '…y la navegación lo sigue llevando ahí: no se quita la accesibilidad para esconder el fallo');
const CSS = leer('src/index.css');
ok(/:where\(button, a, \[role='switch'\], \[role='tab'\], summary, \[tabindex\]:not\(\[tabindex='-1'\]\)\):focus-visible \{\s*outline: 2px solid var\(--accent, currentColor\);/.test(CSS),
  '🚨 los controles conservan su anillo con el teclado (MS F3), con el acento');
ok(!/outline:\s*none\s*!important/.test(CSS) && !/\*\s*\{[^}]*outline:\s*none/.test(CSS), '…y no se ha quitado ningún contorno de foco de forma global');
/* La regla nueva, frente a un elemento con y sin `tabindex="-1"`: se comprueba el selector. */
const selector = (APP.match(/<style>\{`([^{]+)\{ outline/) || [])[1] || '';
ok(/:not\(\[tabindex='-1'\]\)/.test(selector) && /^\*:focus-visible/.test(selector.trim()), `el selector excluye justo eso (${selector.trim()})`);

console.log(`\n${n - fallos}/${n} comprobaciones${fallos ? ` · ${fallos} FALLOS` : ''}`);
process.exit(fallos ? 1 : 0);
