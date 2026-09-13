/* Navegación por origen (NAVO F1).
 *
 * Los seis criterios de aceptación que escribió Josué, comprobados sobre la pila
 * de verdad — y además sobre `App.jsx`, para que no quede una regla vieja suelta.
 *
 * 🚨 El criterio que más importa es el 6: *"Crear/abrir cualquier nueva
 * funcionalidad desde Inicio → Atrás → Inicio, **sin tener que añadir una
 * condición específica para esa funcionalidad**"*. Por eso hay una comprobación
 * con un módulo inventado que no existe en ninguna parte del catálogo.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  RAIZ, normalizarPila, actual, tabDe, origen, abrir, irAPrincipal, atras,
  puedeVolver, etiquetaDeOrigen, ruta, NO_HACE,
} from '../src/lib/navegacion.js';

const RAIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ_DIR, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const APP = leer('src/App.jsx');
/* ⚠️ La lección de siempre (van diecinueve): una prueba que mira si el código HACE algo tiene que
   quitar los comentarios antes. Este archivo y `App.jsx` NOMBRAN a `areaActual.id` y a
   `vueltaBusqueda` justamente para explicar que ya no se usan. */
const sinComentarios = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const APP_CODIGO = sinComentarios(APP);

console.log('\n── 1. La pila nunca se queda vacía ──');
/* 🚨 La lección de `atras()` en EH F37: "de la raíz se vuelve a la raíz, y así es como no se sale de
   JosStyle sin querer". Una pila vacía sería una pantalla en blanco sin forma de volver. */
ok(tabDe([]) === RAIZ, 'una pila vacía se normaliza a Inicio');
ok(tabDe(atras([{ id: RAIZ }])) === RAIZ, '🚨 atrás desde la raíz se queda en la raíz, nunca deja la pantalla sin nada');
ok(normalizarPila(null).length === 1, 'y lo mismo con cualquier cosa que no sea una pila');
ok(actual([{ id: 'hoy' }, { id: 'tareas' }]).id === 'tareas', '`actual` es el último de la pila');
ok(origen([{ id: 'hoy' }]) === null, 'en la raíz no hay de dónde venir');
ok(!puedeVolver([{ id: 'hoy' }]) && puedeVolver([{ id: 'hoy' }, { id: 'x' }]), 'y se sabe cuándo hay a dónde volver');

console.log('\n── 2. Sus seis criterios de aceptación, uno a uno ──');
/* Test 1: Inicio → Tareas → Atrás = Inicio */
let p = irAPrincipal([], RAIZ);
p = abrir(p, 'tareas');
ok(ruta(p) === 'hoy → tareas', `Test 1 · Inicio → Tareas (${ruta(p)})`);
ok(tabDe(atras(p)) === 'hoy', '🚨 Test 1 · …y atrás devuelve a INICIO, no a Gestión');

/* Test 2 y 3: Inicio → Productividad → (sub) → Atrás → Atrás = Inicio.
   ⚠️ El nivel de la mini-app («Piano») lo lleva cada lanzador con su propio estado, y por eso su
   atrás ya funcionaba: lo que estaba roto era el de arriba. Aquí se comprueba el de arriba. */
let p2 = abrir(irAPrincipal([], RAIZ), 'productividad');
ok(ruta(p2) === 'hoy → productividad', `Test 2 · Inicio → Productividad (${ruta(p2)})`);
ok(tabDe(atras(p2)) === 'hoy', '🚨 Test 3 · …y desde ahí atrás lleva a INICIO');

/* Test 4: Gestión → Productividad → Atrás = Gestión */
let p3 = abrir(irAPrincipal([], 'area-gestion'), 'productividad');
ok(ruta(p3) === 'hoy → area-gestion → productividad', `Test 4 · Gestión → Productividad (${ruta(p3)})`);
ok(tabDe(atras(p3)) === 'area-gestion', '🚨 Test 4 · …y atrás devuelve a GESTIÓN');

/* Test 5: Gestión → Tareas → Atrás = Gestión */
let p4 = abrir(irAPrincipal([], 'area-gestion'), 'tareas');
ok(tabDe(atras(p4)) === 'area-gestion', '🚨 Test 5 · Gestión → Tareas → atrás devuelve a GESTIÓN');

/* 🚨 Test 6 — EL QUE DE VERDAD DEMUESTRA QUE ES ARQUITECTURA Y NO UNA LISTA DE EXCEPCIONES.
   Un módulo que no existe en ningún catálogo se comporta igual, sin que nadie escriba nada. */
let p5 = abrir(irAPrincipal([], RAIZ), 'una-funcionalidad-que-todavia-no-existe');
ok(tabDe(atras(p5)) === 'hoy',
  '🚨 Test 6 · un módulo INVENTADO abierto desde Inicio vuelve a Inicio, sin una condición para él');
ok(tabDe(atras(abrir(irAPrincipal([], 'area-vida'), 'otra-cosa-nueva'))) === 'area-vida',
  '🚨 …y el mismo módulo inventado abierto desde Vida vuelve a Vida: el origen manda, no el catálogo');

console.log('\n── 3. Lo mismo desde dos sitios: el origen manda, no el área ──');
/* 🚨 Éste es el fallo que él reportó, escrito como comprobación: LA MISMA pantalla tiene que volver
   a un sitio distinto según de dónde se abriera. Con la regla vieja —"pregunta a qué área
   pertenece"— las dos líneas darían el mismo resultado. */
const desdeInicio = atras(abrir(irAPrincipal([], RAIZ), 'productividad'));
const desdeGestion = atras(abrir(irAPrincipal([], 'area-gestion'), 'productividad'));
ok(tabDe(desdeInicio) !== tabDe(desdeGestion),
  '🚨 la MISMA pantalla vuelve a sitios distintos según de dónde se abrió');
ok(tabDe(desdeInicio) === 'hoy' && tabDe(desdeGestion) === 'area-gestion',
  '…y cada uno al suyo de verdad');

console.log('\n── 4. Navegación principal y navegación interna son dos cosas ──');
/* Apartado 4: la barra de abajo no "entra" en nada, cambia de sección. Si apilara, atrás desharía
   el recorrido de pestañas y se darían vueltas (su apartado 8). */
let p6 = abrir(irAPrincipal([], 'area-vida'), 'diario');
p6 = irAPrincipal(p6, 'area-gestion');
ok(ruta(p6) === 'hoy → area-gestion', `una pestaña de abajo REINICIA el recorrido (${ruta(p6)})`);
ok(tabDe(atras(p6)) === 'hoy', '…y desde un área siempre se vuelve a Inicio');
ok(ruta(irAPrincipal(p6, RAIZ)) === 'hoy', '⚠️ y tocar Inicio deja la pila en su estado de arranque');

console.log('\n── 5. Ni duplicados ni bucles (su apartado 8) ──');
let p7 = abrir(abrir(irAPrincipal([], RAIZ), 'tareas'), 'tareas');
ok(ruta(p7) === 'hoy → tareas', `abrir lo que ya estás viendo no apila una copia (${ruta(p7)})`);
let p8 = abrir(abrir(abrir(irAPrincipal([], RAIZ), 'productividad'), 'diario'), 'productividad');
ok(ruta(p8) === 'hoy → productividad',
  `🚨 volver a algo que ya está en el recorrido RECORTA en vez de duplicar (${ruta(p8)})`);
ok(atras(p8).length === 1, '…así que atrás sigue llevando a Inicio y no se entra en bucle');

console.log('\n── 6. El estado de la pantalla viaja con la entrada (su apartado 9) ──');
const conFoco = abrir(irAPrincipal([], RAIZ), 'productividad', { app: 'habitos' });
ok(actual(conFoco).foco?.app === 'habitos', 'el deep-link de EH F28 sigue viajando con la entrada');
ok(actual(abrir(conFoco, 'productividad', { app: 'pomodoro' })).foco?.app === 'pomodoro',
  '⚠️ …y abrir la misma pantalla con otro foco la actualiza en vez de apilarla otra vez');

console.log('\n── 7. El rótulo del botón sale del catálogo, no de una lista a mano ──');
const nombres = { hoy: 'Inicio', 'area-gestion': 'Gestión' };
ok(etiquetaDeOrigen(abrir(irAPrincipal([], 'area-gestion'), 'tareas'), (id) => nombres[id]) === 'Gestión',
  'el botón de atrás dice de dónde vienes');
ok(etiquetaDeOrigen(abrir(irAPrincipal([], RAIZ), 'tareas'), (id) => nombres[id]) === 'Inicio',
  '…y desde Inicio dice Inicio');
ok(etiquetaDeOrigen([{ id: RAIZ }], (id) => nombres[id]) === null, 'y en la raíz no hay botón que pintar');
ok(etiquetaDeOrigen(abrir(irAPrincipal([], RAIZ), 'x'), () => null) === 'Atrás',
  '⚠️ un módulo sin nombre en el catálogo dice «Atrás», nunca un id crudo en la cara de Josué');

console.log('\n── 8. Y en App.jsx no queda ni rastro de la regla vieja ──');
/* 🚨 La línea que causaba el fallo. Si vuelve, esta comprobación salta. */
ok(!/destinoVuelta/.test(APP_CODIGO), '🚨 ya no existe `destinoVuelta`: atrás no se calcula desde el área');
ok(!/areaActual\.label/.test(APP_CODIGO),
  '🚨 …ni el rótulo sale de `areaActual.label`, que es lo que decía «Gestión» viniendo de Inicio');
ok(!/setVueltaBusqueda/.test(APP_CODIGO),
  '🔓 …y el rastro a medias del buscador se ha absorbido: una sola memoria del origen, no dos');
ok(/origenNav\(pilaNav\)/.test(APP_CODIGO), 'el destino de atrás sale de la pila');
ok(/const tab = tabDe\(pilaNav\)/.test(APP_CODIGO), '`tab` es ahora el último de la pila');
/* ⚠️ Su apartado 2, literal: "No quiero solucionar esto añadiendo condiciones independientes… dentro
   de cada módulo". Esto lo comprueba: ni un id de módulo escrito a mano al decidir el atrás. */
const bloqueAtras = (APP_CODIGO.match(/const desde = origenNav[\s\S]{0,600}/) || [''])[0];
ok(!/=== '(productividad|tareas|calendario|horario|diario|economia)'/.test(bloqueAtras),
  '🚨 …y no hay ni una condición por módulo en el cálculo de atrás (su apartado 2)');
/* ⚠️ Y la barra de abajo no apila: su apartado 4 y su "no cambies la navegación inferior". */
ok((APP_CODIGO.match(/irAPestana\(/g) || []).length >= 5,
  'las cinco pestañas de abajo reinician el recorrido en vez de apilar');
ok(/nav-segura fixed bottom-0/.test(APP_CODIGO), '⚠️ …y la barra inferior no se ha tocado');

console.log('\n── 9. Lo que esta fase NO hace, declarado ──');
ok(NO_HACE.length >= 3, 'se declara lo que queda fuera');
ok(NO_HACE.every((x) => x.que && x.porque), '⚠️ cada cosa con su motivo');
ok(NO_HACE.some((x) => /bot[oó]n atr[aá]s del M[OÓ]VIL/i.test(x.que) && x.decide),
  '🚨 …incluido que el gesto de atrás del móvil sigue siendo otra cosa, y quién lo decide');
/* 🚨 Por dónde has pasado es de la sesión: guardarlo en `app_data` te devolvería a media ruta de
   anteayer al abrir la aplicación (la lección de la EH F40). */
const LIB = leer('src/lib/navegacion.js');
/* 🐛 **VIGÉSIMA VEZ DE LA LECCIÓN, y la cazó esta misma prueba en su primera pasada.** Para saber si
   un archivo TOCA algo no basta con quitar los comentarios: hay que quitar también **las cadenas**
   (E3 F20). `NO_HACE` dice con todas las letras *"No guarda nada en `app_data`"* — o sea que la
   frase que hace la promesa hacía saltar el barrido que la comprueba. Lo que se mira es si hay una
   LLAMADA, no si aparece la palabra. */
const soloCodigo = sinComentarios(LIB)
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');
ok(!/saveData\(|localStorage|app_data/.test(soloCodigo),
  '🚨 la pila NO se guarda en ninguna parte: es de la sesión, no un dato de Josué');
ok(/No guarda nada en `app_data`/.test(LIB),
  '⚠️ …y está declarado por qué, que es lo que hacía saltar el barrido mal escrito');

console.log(fallos === 0
  ? `\n  \x1b[32m✓\x1b[0m Navegación por origen (NAVO F1) — ${total} comprobaciones`
  : `\n  \x1b[31m✗ ${fallos} de ${total} comprobaciones han fallado\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
