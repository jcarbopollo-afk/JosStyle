/* El barrido de Safari (SF F1).
 *
 * 🚨 Esta suite existe por lo que enseñó la SC F1: el cuadrado vacío del
 * acordeón llevaba desde la v1.21.0 y **ninguna de las 19 578 comprobaciones
 * podía verlo**, porque todas corren en Chromium y la aplicación solo se usa en
 * un iPhone. Así que aquí no se prueba una función: se busca **más de lo mismo**.
 *
 * ⚠️ Y la trampa de siempre, que aquí es especialmente fácil de pisar: este
 * archivo y `safari.js` NOMBRAN los patrones que prohíben. Todos los barridos
 * miran los archivos de producción, nunca éste.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  POR_QUE_NO_SE_VE, HALLAZGOS_SF, MIRADO_Y_CORRECTO, MIRADO_Y_SE_QUEDA,
  backdropSinPrefijo, escriturasSinTry, condicionSF, FUERA_DEL_ALCANCE_SF,
} from '../src/lib/safari.js';

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
const APP = leer('src/App.jsx');
const UI = leer('src/components/ui.jsx');
const AJUSTES = leer('src/views/SettingsView.jsx');
const NOTIF = leer('src/lib/notificaciones.js');
const HUB = leer('src/views/HubView.jsx');

console.log('\n── 1. Por qué ninguna prueba podía ver esto ──');
ok(POR_QUE_NO_SE_VE.donde_corren_las_pruebas === 'Chromium'
  && /Safari/.test(POR_QUE_NO_SE_VE.donde_se_usa_la_aplicacion),
  '🚨 queda escrito el hueco: las pruebas miran Chromium y él usa Safari');
ok(/VERDE/.test(POR_QUE_NO_SE_VE.consecuencia),
  '⚠️ …y la consecuencia: lo que difiere entre los dos sale verde y falla en su pantalla');
ok(/R1/.test(POR_QUE_NO_SE_VE.loQueNoSeHace),
  '⚠️ …y lo que NO se promete: que ya no quede ninguno. Eso solo lo dice él abriéndola');

console.log('\n── 2. El desenfoque, en los OCHO sitios y no en uno ──');
/* 🚨 El proyecto ya sabía esto desde la Fase N4 y lo tenía puesto en un solo
   archivo. Es el patrón de siempre: el arreglo existe y no se aplicó en el resto. */
ok(/WebkitBackdropFilter/.test(HUB), 'HubView ya lo llevaba desde la Fase N4 (de ahí sale el hallazgo)');
ok(backdropSinPrefijo(UI) === 0, `🚨 ui.jsx no deja ningún desenfoque sin prefijo (${backdropSinPrefijo(UI)} sueltos)`);
ok(backdropSinPrefijo(APP) === 0, `🚨 App.jsx tampoco — la barra inferior y la lupa incluidas (${backdropSinPrefijo(APP)})`);
ok(backdropSinPrefijo(AJUSTES) === 0, `Ajustes tampoco (${backdropSinPrefijo(AJUSTES)})`);
ok(backdropSinPrefijo(CSS) === 0, `y el CSS tampoco, banda de la cabecera incluida (${backdropSinPrefijo(CSS)})`);
/* ⚠️ Y el caso rojo, que es lo que hace que el barrido sirva (EH F42). */
ok(backdropSinPrefijo("style={{ backdropFilter: 'blur(8px)' }}") === 1,
  '⚠️ …y el barrido CAZA uno suelto: si no, daría siempre cero problemas');
ok(backdropSinPrefijo("style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}") === 0,
  '⚠️ …y no salta con uno que sí lleva su pareja');

console.log('\n── 3. La altura visible del iPhone ──');
/* 🚨 En Safari de iOS `100vh` incluye lo que tapan las barras del navegador, así que la raíz medía
   más que la pantalla. `100dvh` es la altura VISIBLE. */
/* ⚠️ Va en `index.css` y NO en el `style` de React, y eso es parte del hallazgo: en un objeto de
   estilo dos claves iguales no son un respaldo — la segunda borra a la primera—, así que el
   `100vh` de reserva solo existe de verdad en CSS. */
const bloqueAlto = (CSS.match(/\.alto-visible\s*\{[^}]*\}/) || [''])[0];
ok(/min-height:\s*100dvh/.test(bloqueAlto), '🚨 la raíz mide `100dvh`: la altura que de verdad se ve');
ok(bloqueAlto.indexOf('100vh') < bloqueAlto.indexOf('100dvh') && /100vh/.test(bloqueAlto),
  '⚠️ …con `100vh` escrito ANTES como respaldo, para un navegador que no conozca `dvh`');
ok(/className="alto-visible"/.test(APP), '…y la raíz de la aplicación lleva esa clase');
ok(!/minHeight: '100vh'/.test(APP),
  '🚨 …y ya no queda el `100vh` suelto en el estilo en línea, que era el que no admitía respaldo');
ok(HALLAZGOS_SF.find((h) => h.id === 'vh_en_la_raiz'),
  'el hallazgo está declarado con su consecuencia en el iPhone');

console.log('\n── 4. La marca del aviso no puede llevarse el aviso ──');
/* 🚨 En una ventana privada de Safari, escribir en `localStorage` LANZA. Y esa escritura estaba
   ANTES de mandar el aviso: no es que se perdiera la marca, es que no llegaba el aviso. */
ok(escriturasSinTry(NOTIF).length === 0,
  `🚨 ninguna escritura en \`localStorage\` queda fuera de un \`try\` (${escriturasSinTry(NOTIF).join(', ') || 'ninguna'})`);
ok(escriturasSinTry("localStorage.setItem('x', '1');").length === 1,
  '⚠️ …y el barrido caza una suelta (si no, no serviría)');
ok(escriturasSinTry("try {\n  localStorage.setItem('x', '1');\n} catch {}").length === 0,
  '⚠️ …y no salta con una protegida');
/* ⚠️ Y lo que de verdad importa: que perder la marca NO impida el aviso. Repetir un aviso una vez
   es molesto; perderlo es perderlo. */
ok(NOTIF.indexOf('new Notification') > NOTIF.indexOf('marcaKey'),
  '⚠️ …y el aviso se manda DESPUÉS, así que un fallo al marcar ya no lo cancela');

console.log('\n── 5. Lo que se miró y estaba bien, declarado ──');
/* 🚨 Sin esto, la siguiente sesión vuelve a barrer lo mismo. */
ok(MIRADO_Y_CORRECTO.length >= 4, 'se declara lo que se revisó y ya estaba correcto');
ok(MIRADO_Y_CORRECTO.every((x) => x.que && x.porque), '⚠️ cada cosa con su motivo');
/* La trampa de las fechas: Safari NO acepta una cadena con espacio en vez de T. */
const fechasConEspacio = (APP + UI + AJUSTES).match(/new Date\(['"`][^'"`]*\d \d\d:/g) || [];
ok(fechasConEspacio.length === 0,
  '🚨 ni una fecha construida con espacio en vez de `T` (Safari la daría por inválida)');
ok(MIRADO_Y_SE_QUEDA.length >= 2 && MIRADO_Y_SE_QUEDA.every((x) => x.que && x.porque),
  '⚠️ …y lo que se deja como está, también con su motivo: cambiar por si acaso hace el código peor');

console.log('\n── 6. Los hallazgos, con su consecuencia real ──');
ok(HALLAZGOS_SF.length === 3, 'los tres hallazgos están declarados');
ok(HALLAZGOS_SF.every((h) => h.que && h.enElIphone && h.porQueDuele && h.arreglo && h.regla),
  '🚨 cada uno dice QUÉ SE VE EN EL iPHONE, no "podría fallar"');
ok(HALLAZGOS_SF.every((h) => h.enElIphone.length > 60),
  '⚠️ …y lo dice entero: un hallazgo sin consecuencia concreta no se puede priorizar');

console.log('\n── 7. La condición de la fase, CALCULADA ──');
const informe = condicionSF({ css: CSS, app: APP, ui: UI, ajustes: AJUSTES, notificaciones: NOTIF });
informe.casillas.forEach((c) => ok(c.ok, c.texto));
ok(informe.ok, '🚨 LAS CUATRO CASILLAS SALEN VERDES');
ok(!condicionSF({}).ok, '⚠️ …y se pone ROJA si alguien deshace los arreglos');

console.log('\n── 8. Lo que esta fase NO puede demostrar, dicho ──');
ok(FUERA_DEL_ALCANCE_SF.length >= 2, 'se declara lo que queda fuera');
ok(FUERA_DEL_ALCANCE_SF.every((x) => x.que && x.porque && x.decide),
  '⚠️ con su motivo y quién decide');
ok(/pescadilla|Chromium/.test(FUERA_DEL_ALCANCE_SF[0].porque),
  '🚨 …empezando por la más incómoda: esto no se puede comprobar en el navegador donde no fallaba');

console.log(fallos === 0
  ? `\n  \x1b[32m✓\x1b[0m El barrido de Safari (SF F1) — ${total} comprobaciones`
  : `\n  \x1b[31m✗ ${fallos} de ${total} comprobaciones han fallado\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
