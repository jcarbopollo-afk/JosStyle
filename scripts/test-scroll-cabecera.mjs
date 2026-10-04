/* Scroll, cabeceras fijas y acordeones (SC F1).
 *
 * Los tres fallos que reportó Josué desde su iPhone, con la causa de cada uno
 * comprobada contra los archivos de verdad — no contra una lista que se cuenta a
 * sí misma (EH F42).
 *
 * ⚠️ Ojo con la trampa de siempre: este archivo NOMBRA lo que prohíbe
 * (`max-height`, alturas fijas), así que los barridos de la auditoría reciben el
 * contenido de los archivos, nunca el de esta prueba.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DONDE_HAY_SCROLL, CAPAS_SUPERIORES, Z_CABECERA, Z_ACCESOS_FIJOS, BANDA,
  COMPACTADO, LINEAS_QUE_SE_CONSERVAN, ACORDEON, ACORDEONES, NO_SE_TOCA,
  condicionSC, FUERA_DEL_ALCANCE_SC, FIXED_QUE_NO_LO_ERA,
  FUNDIDO_BAJO_CABECERA_PX, mascaraBajoCabecera,
} from '../src/lib/scrollCabecera.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const CSS = leer('src/index.css');
const HUB = leer('src/views/HubView.jsx');
const DASH = leer('src/views/DashboardView.jsx');
const APP = leer('src/App.jsx');
const FUNDIDO = leer('src/components/fundidoBajoCabecera.js');

/* 🐛 **DECIMOCTAVA VEZ DE LA LECCIÓN DE SIEMPRE, y esta prueba la cazó en su primera pasada.** Una
   comprobación que busca si el código HACE algo tiene que quitar los comentarios antes: el barrido
   de «aquí no hay ningún `@media`» saltaba **con el comentario que promete justamente eso**, igual
   que pasó en EH F38 con `new Notification` y en la E3 F26 con `setInterval`. El código de verdad es
   el que queda después de quitarlos. */
const sinComentarios = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const DASH_CODIGO = sinComentarios(DASH);

console.log('\n── 1. Dónde ocurre el scroll de verdad ──');
/* 🚨 La pregunta 4 de su revisión técnica, y la que decide cuál es el arreglo
   correcto. Si un día alguien mete un contenedor con scroll propio en la ruta de
   un hub, esta comprobación salta y hay que releer la decisión. */
ok(DONDE_HAY_SCROLL.donde === 'la página entera', 'el scroll es de la página, no de un contenedor interno');
ok(/min-h-screen/.test(APP), '…y se comprueba en App.jsx: el contenedor crece con su contenido');
ok(!/overflow-y-(auto|scroll)/.test(HUB), '🚨 el hub NO tiene un scroll propio: sería una altura que calcular a mano');
ok(DONDE_HAY_SCROLL.porEsoSticky.length > 40, 'y está escrito por qué eso obliga a `sticky` y no a otra cosa');

console.log('\n── 2. Lo que se queda quieto, y en qué orden ──');
ok(CAPAS_SUPERIORES.length === 3, 'las tres capas de arriba están declaradas');
ok(CAPAS_SUPERIORES.every((c) => c.que && c.comoSeQuedaQuieto && c.z && c.nota),
  '⚠️ cada una con cómo se queda quieta, a qué altura y por qué');
ok(Z_CABECERA < Z_ACCESOS_FIJOS,
  '🚨 la cabecera va POR DEBAJO de la lupa y del botón de la IA: con z-index mayor los taparía');
ok(/\.hub-sticky\s*\{[^}]*z-index:\s*20/.test(CSS), '…y el CSS lleva ese mismo número');
ok(/accion-superior toque-44 fixed z-30/.test(APP),
  '⚠️ la lupa sigue siendo `fixed` y en z-30: no se le ha cambiado ni la posición ni la función');

/* 🚨 EL HALLAZGO GORDO: `.toque-44` le ponía `position: relative` y le GANABA, así que los dos
   accesos de arriba llevaban sin estar fijos desde la E3 F1 — se iban con el scroll, que es
   literalmente lo que reportó Josué, y su hueco de 36 px empujaba TODO el contenido hacia abajo. */
ok(/:where\(\.toque-44\)\s*\{[^}]*position:\s*relative/.test(CSS),
  '🚨 SC F1 — `.toque-44` ya no pisa a `fixed`: va con `:where()`, que tiene especificidad cero');
ok(!/(^|\n)\.toque-44\s*\{[^}]*position:/.test(CSS),
  '🚨 …y no queda ninguna versión sin `:where()` que vuelva a ganarle');
ok(/\.toque-44::after/.test(CSS),
  '⚠️ …y el pseudoelemento de 44 px sigue igual: lo que cambia es quién manda, no el área táctil');
ok(FIXED_QUE_NO_LO_ERA.quienLoPisaba && FIXED_QUE_NO_LO_ERA.seVeiaAsi && FIXED_QUE_NO_LO_ERA.arreglo,
  'el hallazgo queda declarado: qué lo pisaba, qué se veía y cómo se arregla');
ok(/E3 F1/.test(FIXED_QUE_NO_LO_ERA.cuantoLlevaba),
  '⚠️ …con desde cuándo llevaba ahí, que es lo que explica por qué nadie lo vio');
ok(/Medirlo en el navegador/.test(FIXED_QUE_NO_LO_ERA.loQueLoDestapo),
  '🚨 …y lo que lo destapó: medirlo. Un `className` no es una prueba de nada');
/* ⚠️ Él lo pidió expresamente: "No quiero que el icono de Buscar se comporte como el botón de la
   guía". Son dos componentes distintos y siguen siéndolo. */
ok(/SuggestionsButton/.test(APP) && /setShowSearch\(true\)/.test(APP),
  '⚠️ …y sigue siendo otra cosa distinta del botón de sugerencias');

console.log('\n── 3. La banda: por qué se sale de su caja ──');
ok(/\.hub-sticky\s*\{[^}]*position:\s*sticky/.test(CSS), 'la cabecera es `sticky`');
ok(/margin-top:\s*calc\(-1 \* \(var\(--safe-top\) \+ 4rem\)\)/.test(CSS),
  '🚨 sube hasta el borde de la pantalla, así que nada asoma por el hueco de arriba');
ok(/padding-top:\s*calc\(var\(--safe-top\) \+ 4rem\)/.test(CSS),
  '⚠️ …y el relleno devuelve el texto a su sitio: la cabecera NO se mueve ni al empezar a desplazar');
ok(/margin-left:\s*-1rem/.test(CSS) && /margin-right:\s*-1rem/.test(CSS),
  '…y se ensancha a los lados, que es por donde también se colaban las tarjetas');
/* 🚨 La Safe Area del iPhone vive en `index.css` y se usa con sus variables, nunca con un número a
   ojo (E3 F1). Aquí importa el doble: un número fijo dejaría la cabecera debajo de la hora. */
ok(/var\(--safe-top\)/.test((sinComentarios(CSS).match(/\.hub-sticky\s*\{[^}]*\}/) || [''])[0]),
  '🚨 usa `--safe-top`, nunca un número a ojo (la lección de la E3 F1)');
ok(BANDA.clase === 'hub-sticky' && /className="hub-sticky"/.test(HUB), 'y la clase está puesta en el hub');
/* 🔓 v3.129.1 — ESTA COMPROBACIÓN SE DIO LA VUELTA. Exigía que la banda llevara el color de la
   barra de abajo, y con su `blur(20px)` eso era el rectángulo borroso que Josué enseñó en un vídeo:
   "quiero que sea transparente totalmente, como un cristal". Ahora se exige que no pinte nada. */
const bandaCodigo = (sinComentarios(CSS).match(/\.hub-sticky\s*\{[^}]*\}/) || [''])[0];
const etiquetaBanda = (HUB.match(/<div[^>]*className="hub-sticky"[^>]*>/) || [''])[0];
ok(bandaCodigo && !/background|backdrop-filter/.test(bandaCodigo),
  '🚨 v3.129.1 — la regla de la banda no lleva ni fondo ni desenfoque');
ok(etiquetaBanda && !/style=/.test(etiquetaBanda) && !/navBgAlpha/.test(HUB),
  '🚨 …y en el hub tampoco: ni un estilo en línea en la banda, ni el color de la barra de abajo');
ok(/ref=\{cabeceraRef\}/.test(etiquetaBanda), '…y la banda lleva su `ref`, que es lo que mide el fundido');
ok('pinta' in BANDA && /transparente/.test(BANDA.pinta),
  '⚠️ y la decisión queda escrita en `BANDA`, con lo que había antes y por qué se quitó');

console.log('\n── 3b. Lo que la banda tapaba lo hacen las tarjetas: se desvanecen al llegar a ella ──');
/* En reposo ninguna tarjeta lleva máscara: con su contenido entero en pantalla —su iPhone— el hook
   no cambia nada. Solo actúa cuando una tarjeta ha subido por encima del borde de la cabecera. */
ok(mascaraBajoCabecera(-12) === null, 'en reposo (la tarjeta 12 px por debajo del borde) no hay máscara');
ok(mascaraBajoCabecera(0) === null, '…ni tocando el borde: hasta que no sube, nada');
ok(mascaraBajoCabecera(null) === null && mascaraBajoCabecera(NaN) === null && mascaraBajoCabecera(undefined) === null,
  '⚠️ …ni con una medida que no es un número (nunca un `NaN` en un estilo)');
const m40 = mascaraBajoCabecera(40);
ok(m40 === `linear-gradient(to bottom, transparent ${40 - FUNDIDO_BAJO_CABECERA_PX}px, black 40px)`,
  `🚨 con 40 px por encima del borde, lo de arriba es transparente y la rampa ACABA en el borde (${m40})`);
/* 🚨 Sin salto: recién llegada al borde, la rampa empieza por ENCIMA de la tarjeta (una parada
   negativa), así que su borde de arriba no se vuelve transparente de golpe. */
ok(/transparent -\d+px, black 1px/.test(mascaraBajoCabecera(1) || ''),
  '🚨 …y con 1 px la rampa empieza fuera de la tarjeta: entra en ella poco a poco, sin un salto');
ok(FUNDIDO_BAJO_CABECERA_PX > 0 && FUNDIDO_BAJO_CABECERA_PX <= 16,
  `⚠️ la rampa es corta (${FUNDIDO_BAJO_CABECERA_PX} px): cabe en el relleno de abajo de la cabecera, sin meterse en el título`);
ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(m40), '⚠️ sin un color suelto: en una máscara solo cuenta la opacidad (regla 2)');
/* El hook: escribe en el nodo, no en el estado de React, y se apoya en la función de arriba. */
ok(/import \{ mascaraBajoCabecera \} from '\.\.\/lib\/scrollCabecera'/.test(FUNDIDO),
  'el hook usa ESTA función: la regla vive una vez, donde se prueba');
ok(/webkitMaskImage/.test(FUNDIDO) && /\.maskImage/.test(FUNDIDO),
  '⚠️ …y pone las dos, la de Safari con prefijo incluida');
ok(/passive: true/.test(FUNDIDO) && /requestAnimationFrame/.test(FUNDIDO),
  '⚠️ …escuchando el desplazamiento sin frenarlo y como mucho una vez por fotograma');
ok(!/useState|setState/.test(sinComentarios(FUNDIDO)) && !/saveData|localStorage/.test(sinComentarios(FUNDIDO)),
  '🚨 …sin pasar por el estado de React (no repinta el hub a cada píxel) y sin guardar nada');
ok(/useFundidoBajoCabecera\(cabeceraRef, listaRef,/.test(HUB) && /ref=\{listaRef\} className="space-y-3 pb-4"/.test(HUB),
  '…y el hub lo usa con su cabecera y la lista de sus tarjetas');

console.log('\n── 4. Las filas, algo más finas y sin perder información ──');
ok(COMPACTADO.length === 5, 'se declara qué encogió y cuánto');
ok(COMPACTADO.every((c) => c.antes !== c.ahora), '⚠️ cada línea dice lo de antes y lo de ahora');
ok(/rounded-3xl p-4 flex/.test(HUB), 'la tarjeta pasa de `p-5` a `p-4`');
ok(/space-y-3 pb-4/.test(HUB), 'el hueco entre tarjetas pasa de `space-y-5` a `space-y-3`');
ok(/w-12 h-12 rounded-2xl/.test(HUB), 'el círculo del icono pasa de 56 a 48 px');
ok(LINEAS_QUE_SE_CONSERVAN.every((l) => new RegExp(`resumen\\.${l}`).test(HUB)),
  '🚨 …y las DOS líneas de resumen siguen pintándose: encoge el aire, no la información');
/* 🚨 La lección de `ToggleTab` en GE F1: `.hub-card` la comparten otras pantallas, así que el
   compactado va en las clases de HubView y NUNCA en la clase compartida. */
const bloqueHubCard = (CSS.match(/\.hub-card\s*\{[^}]*\}/g) || []).join(' ');
ok(!/padding|gap|width|height/.test(bloqueHubCard),
  '🚨 no se ha tocado la clase compartida `.hub-card`: la usan otras pantallas (E3 F16)');

console.log('\n── 5. El acordeón: la causa, no el parche ──');
const acordeones = (DASH.match(/gridTemplateRows:/g) || []).length;
const conFix = (DASH.match(/overflow: 'hidden', minHeight: 0/g) || []).length;
ok(acordeones === ACORDEONES.length, `los ${ACORDEONES.length} acordeones declarados son los que hay en el código`);
ok(conFix === acordeones, '🚨 TODOS llevan `minHeight: 0`: es lo que hacía que Safari dejara el cuadrado vacío');
ok(ACORDEON.loQueFaltaba === 'min-height: 0 en el elemento de rejilla', 'la causa está declarada con nombre y apellidos');
ok(/min-height: auto/.test(ACORDEON.porque), '…y explicada: un elemento de rejilla se niega a bajar de su contenido');
ok(/Chromium/.test(ACORDEON.porQueNoSeVeiaEnElOrdenador),
  '🚨 y por qué el ordenador iba bien y el móvil no — que es lo que lo hacía invisible para las pruebas');
ok(ACORDEON.loQueNoSeHizo.length >= 4, 'se declara lo que NO se hizo, que es lo que él prohibió expresamente');
/* 🚨 Su apartado 4, literal: "No quiero solucionar el problema poniendo simplemente otro `height`
   fijo para móvil". Esto lo comprueba sobre el archivo, no sobre una promesa. */
ok(!/(maxHeight|minHeight):\s*['"]?\d+px/.test(DASH_CODIGO), '🚨 ni una altura fija en la tarjeta desplegable');
ok(!/@media/.test(DASH_CODIGO), '…ni un tamaño de pantalla: el fallo no era del tamaño, era del navegador');
ok(/transition: 'grid-template-rows 300ms/.test(DASH),
  '⚠️ y la animación se conserva: su apartado 5 pide mantenerla si está bien implementada');

console.log('\n── 6. Lo que no se toca ──');
ok(NO_SE_TOCA.length >= 4, 'se declara lo que queda igual, con su motivo');
ok(NO_SE_TOCA.every((x) => x.que && x.porque), '⚠️ cada cosa con el motivo, no solo la lista');
ok(/nav-segura fixed bottom-0/.test(APP), 'la barra inferior sigue exactamente igual');

console.log('\n── 7. La condición de la fase, CALCULADA ──');
const informe = condicionSC({ css: CSS, hub: HUB, dashboard: DASH });
informe.casillas.forEach((c) => ok(c.ok, `${c.texto}`));
ok(informe.ok, `🚨 LAS ${informe.casillas.length} CASILLAS SALEN VERDES`);
ok(['banda_transparente', 'fundido_bajo_cabecera'].every((id) => informe.casillas.some((c) => c.id === id)),
  '⚠️ …incluidas las dos de la v3.129.1: la banda transparente y el fundido de las tarjetas');
/* ⚠️ Y el caso rojo, que es lo que hace que la auditoría sirva (EH F42): con los archivos vacíos
   tiene que ponerse roja entera. Una auditoría que no puede fallar no sirve. */
ok(!condicionSC({ css: '', hub: '', dashboard: '' }).ok,
  '⚠️ …y se pone ROJA si alguien deshace los arreglos');
ok(!condicionSC({ css: CSS, hub: HUB, dashboard: DASH.replace(/, minHeight: 0/g, '') }).ok,
  '🚨 …y basta con quitar UN `minHeight: 0` para que salte');
const casillaSC = (arch, id) => condicionSC({ css: CSS, hub: HUB, dashboard: DASH, ...arch }).casillas.find((c) => c.id === id).ok;
ok(!casillaSC({ hub: HUB.replace('className="hub-sticky">', 'className="hub-sticky" style={{ background: COLORS.navBgAlpha || COLORS.bg }}>') }, 'banda_transparente'),
  '🚨 …y la de la banda se pone roja si vuelve el color de la v3.129.0');
ok(!casillaSC({ css: CSS.replace(/(\.hub-sticky\s*\{[^}]*)\}/, '$1  backdrop-filter: blur(20px);\n}') }, 'banda_transparente'),
  '🚨 …y si vuelve el desenfoque al CSS');
ok(!casillaSC({ hub: HUB.replace(/^\s*useFundidoBajoCabecera\(.*$/m, '') }, 'fundido_bajo_cabecera'),
  '⚠️ …y la del fundido, si el hub deja de llamarlo');

console.log('\n── 8. Lo que esta fase NO puede comprobar, dicho ──');
ok(FUERA_DEL_ALCANCE_SC.length >= 2, 'se declara lo que queda fuera de alcance');
ok(FUERA_DEL_ALCANCE_SC.every((x) => x.que && x.porque && x.decide),
  '⚠️ con su motivo y quién decide: un informe que solo enumera lo verde miente por omisión');
ok(/Safari/.test(FUERA_DEL_ALCANCE_SC[0].porque),
  '🚨 …y lo primero que se dice es que el navegador donde fallaba no es el que prueba');

console.log(fallos === 0
  ? `\n  \x1b[32m✓\x1b[0m Scroll, cabeceras y acordeones (SC F1) — ${total} comprobaciones`
  : `\n  \x1b[31m✗ ${fallos} de ${total} comprobaciones han fallado\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
