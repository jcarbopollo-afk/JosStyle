// ============================================================================
// REGLAS INVARIANTES — Entrega 3 · Fase 1 (Pulido global)
//
// Dos cosas que Josué vio en su iPhone y que ninguna prueba podía ver, porque
// las dos son de PRESENTACIÓN y las dos se rompen en silencio:
//
//   1. SAFE AREA (apartado 1). `index.html` lleva `viewport-fit=cover`, así que
//      la página se dibuja debajo de la barra de estado. Los dos botones de
//      arriba estaban en `top: 14` — es decir, encima de la hora, del Wi-Fi, de
//      la batería y de la Dynamic Island. Y como en un navegador de ordenador
//      `env(safe-area-inset-top)` vale 0, ahí se ve perfecto: el fallo SOLO
//      existe en el móvil, que es donde nunca llega una prueba automática.
//
//      ⚠️ El detalle que hace falta recordar: un `top` en el `style={{}}` de un
//      componente GANA a la clase de CSS. Volver a poner uno ahí deshace la
//      corrección entera sin que nada falle. Por eso se comprueba también eso.
//
//   2. TÍTULO DUPLICADO EN UN ACORDEÓN (apartados 4-6). `<Seccion titulo="Fondo">`
//      pintaba la cabecera "Fondo", y el bloque de dentro volvía a escribir
//      "Fondo" justo debajo al desplegarlo. Josué solo se quejó de ése; el
//      apartado 6 pide revisar todos, y había un segundo ("Apariencias
//      guardadas").
//
// ⚠️ Y la lección de siempre, la enésima: **una prueba que lee el código tiene
// que quitar los comentarios antes**. El primer barrido de esto saltó con el
// comentario que explica la corrección, porque el comentario cita el título
// duplicado que ya no existe.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

const sinComentarios = (t) => t
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // comentarios JSX: {/* … */}
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const CSS = leer('src/index.css');
const APP = sinComentarios(leer('src/App.jsx'));
const UI = sinComentarios(leer('src/components/ui.jsx'));
const HTML = leer('index.html');
const AJUSTES_BRUTO = leer('src/views/SettingsView.jsx');
const AJUSTES = sinComentarios(AJUSTES_BRUTO);

console.log('\n═══ 1. SAFE AREA DE iOS (apartado 1) ═══\n');

ok(/viewport-fit=cover/.test(HTML),
  'index.html declara `viewport-fit=cover` (sin él, `env(safe-area-inset-*)` vale siempre 0)');

for (const v of ['--safe-top', '--safe-bottom']) {
  const re = new RegExp(`${v}:\\s*env\\(safe-area-inset-(top|bottom),\\s*0px\\)`);
  ok(re.test(CSS), `index.css define \`${v}\` desde \`env(safe-area-inset-…)\` con respaldo 0px`);
}

ok(/\.accion-superior\s*\{[^}]*top:\s*calc\(var\(--safe-top\)/.test(CSS),
  '🚨 `.accion-superior` empieza por debajo de lo que reserva iOS, no en un número a ojo');
ok(/\.pantalla-segura\s*\{[^}]*padding-top:\s*calc\(var\(--safe-top\)/.test(CSS),
  '`.pantalla-segura` suma la reserva de arriba al hueco del contenido');
ok(/\.nav-segura\s*\{[^}]*padding-bottom:\s*var\(--safe-bottom\)/.test(CSS),
  '`.nav-segura` deja sitio al indicador de inicio del iPhone');

// Los dos botones fijos de arriba.
const botonBuscar = (APP.match(/<button[\s\S]{0,400}?aria-label="Buscar funciones o preguntar a la IA"/) || [''])[0];
const cajaSugerencias = (UI.match(/<div className="[^"]*fixed z-30"[\s\S]{0,200}/) || [''])[0];

ok(/accion-superior/.test(botonBuscar), 'el botón de buscar/preguntar usa `accion-superior`');
ok(/toque-44/.test(botonBuscar), 'y llega a 44 px de área táctil (`toque-44`)');
ok(/accion-superior/.test(cajaSugerencias), 'el botón de sugerencias usa `accion-superior`');
ok(/toque-44/.test(UI.slice(UI.indexOf('accion-superior'), UI.indexOf('accion-superior') + 500)),
  'y también llega a 44 px');

// ⚠️ La trampa: un `top` en línea gana a la clase y deshace todo sin fallar nada.
const topEnLinea = (t, trozo) => /style=\{[^}]*\btop:\s*\d/.test(trozo);
ok(!topEnLinea(APP, botonBuscar),
  '🚨 el botón de buscar NO lleva un `top` en línea (ganaría a la clase y volvería a taparse con la hora)');
ok(!topEnLinea(UI, cajaSugerencias),
  '🚨 el de sugerencias tampoco');

ok(/\.toque-44::after\s*\{[^}]*width:\s*44px/.test(CSS) && /\.toque-44::after\s*\{[^}]*height:\s*44px/.test(CSS),
  '`toque-44` amplía la zona del dedo a 44×44 sin agrandar el dibujo (EH F42)');

ok(/pantalla-segura/.test(APP) && !/\bpt-16\b/.test(APP),
  'el contenido ya no usa el `pt-16` fijo: usa `pantalla-segura`');
ok(/paddingBottom:\s*'calc\(100px \+ var\(--safe-bottom\)\)'/.test(APP),
  'y el hueco de abajo suma el del indicador de inicio');
ok(/<nav\s+className="nav-segura/.test(APP), 'la barra de 5 pestañas lleva `nav-segura`');

console.log('\n═══ 2. ACORDEONES SIN TÍTULO DUPLICADO (apartados 4-6) ═══\n');

// Cada `<Seccion titulo="X">` con su cuerpo, ya sin comentarios.
const secciones = [...AJUSTES.matchAll(/<Seccion\s+titulo="([^"]+)"([^>]*)>([\s\S]*?)<\/Seccion>/g)]
  .map((m) => ({ titulo: m[1], atributos: m[2], cuerpo: m[3] }));

ok(secciones.length >= 6, `se encuentran los desplegables de Apariencia (${secciones.length})`);

// El texto de encabezado que pinta un componente, mirando su definición.
function encabezadosDe(nombre) {
  const d = AJUSTES.match(new RegExp(`export function ${nombre}\\(([\\s\\S]*?)\\n\\}\\n`));
  if (!d) return [];
  return [...d[0].matchAll(/className="text-sm font-semibold[^"]*"[^>]*>([^<>{}\n]{2,60})</g)].map((x) => x[1].trim());
}

const duplicados = [];
for (const s of secciones) {
  // Un `<p>` con el título literal directamente en el cuerpo del desplegable.
  for (const t of [...s.cuerpo.matchAll(/>([^<>{}\n]{2,60})</g)].map((x) => x[1].trim())) {
    if (t === s.titulo) duplicados.push(`"${s.titulo}" se repite dentro de su propio desplegable`);
  }
  // O un bloque hijo que lo pinta él, sin que le hayan dicho `sinTitulo`.
  for (const m of s.cuerpo.matchAll(/<(Bloque\w+)([\s\S]*?)\/>/g)) {
    if (!encabezadosDe(m[1]).includes(s.titulo)) continue;
    if (!/\bsinTitulo\b/.test(m[2])) {
      duplicados.push(`<${m[1]}> repite el título "${s.titulo}" y no recibe \`sinTitulo\``);
    }
  }
}
duplicados.forEach((d) => console.log(`  ✗ ${d}`));
ok(duplicados.length === 0, '🚨 Ningún desplegable de Ajustes escribe su título dos veces');

// Un revisor que no puede fallar no sirve (EH F42): se le da el fallo original.
const ANTES = `
<Seccion titulo="Fondo" sub="algo" accent={accent} defecto>
<BloqueFondo fondo={f} accent={accent} />
</Seccion>`;
const cuerpoMalo = ANTES.match(/<Seccion\s+titulo="([^"]+)"([^>]*)>([\s\S]*?)<\/Seccion>/);
ok(!!cuerpoMalo && !/\bsinTitulo\b/.test(cuerpoMalo[3]),
  '⚠️ el revisor reconoce el caso original (un <BloqueFondo> sin `sinTitulo` dentro de la sección "Fondo")');

// Y los dos bloques siguen sabiendo pintar su título cuando se usan sueltos.
for (const b of ['BloqueFondo', 'BloquePresets']) {
  ok(new RegExp(`function ${b}\\([^)]*sinTitulo = false`).test(AJUSTES),
    `${b} sigue trayendo su propio título por defecto (\`sinTitulo = false\`): solo se calla si se lo piden`);
}

console.log('\n═══ 3. CONFIRMAR SOLO LO IRREVERSIBLE (apartado 3) ═══\n');

ok(/export function BotonBorrarDefinitivo/.test(UI),
  'existe un control común para el borrado que no se puede deshacer');
ok(/createPortal\(/.test(UI.slice(UI.indexOf('BotonBorrarDefinitivo'), UI.indexOf('BotonBorrarDefinitivo') + 3000)),
  '⚠️ y su aviso va por `createPortal` a `document.body` (regla 3: si no, aparece abajo del todo)');

// `BotonBorrar` NO pregunta, y eso es a propósito: lo suyo va a la papelera.
// ⚠️ Hasta el SIGUIENTE `export function`, no una ventana de caracteres a ojo:
// `BotonBorrarDefinitivo` viene justo detrás y sí tiene `useState`, así que un
// trozo de 700 caracteres se lo llevaba dentro y la comprobación saltaba con
// algo que estaba bien. Enésima vez de esta misma lección.
const iBorrar = UI.indexOf('export function BotonBorrar(');
const borrarNormal = UI.slice(iBorrar, UI.indexOf('export function ', iBorrar + 10));
ok(!/useState/.test(borrarNormal),
  '⚠️ `BotonBorrar` sigue sin preguntar nada: lo que borra va a Eliminados recientemente y vuelve (apartado 3: "no añadir confirmaciones innecesarias por todas partes")');

// Las tres cosas que borran un archivo de verdad, y que por tanto sí preguntan.
for (const [vista, que] of [['src/views/HealthView.jsx', 'la foto de progreso'],
  ['src/views/TrainingView.jsx', 'el vídeo de calistenia'],
  ['src/views/LibraryView.jsx', 'el archivo de la Biblioteca']]) {
  const v = sinComentarios(leer(vista));
  ok(/BotonBorrarDefinitivo/.test(v), `${que} pregunta antes de borrarse (se va del almacenamiento y no puede ir a la papelera)`);
}

// Y ninguno de los tres avisos promete algo que no es verdad ni al revés.
const avisos = ['src/views/HealthView.jsx', 'src/views/TrainingView.jsx', 'src/views/LibraryView.jsx']
  .flatMap((f) => [...sinComentarios(leer(f)).matchAll(/detalle="([^"]+)"/g)].map((m) => m[1]));
ok(avisos.length === 3, 'los tres avisos están escritos');
ok(avisos.every((a) => /no se puede recuperar/.test(a)),
  '🚨 y dicen la verdad: eso NO se recupera (lo de la papelera, en cambio, no se pregunta)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
