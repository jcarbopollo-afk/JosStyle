/* ===========================================================================
   NAV F4 — eliminar una tarea desde la fila, y el icono nuevo de Hábitos.

   Los dos encargos son pequeños, y los dos tienen la misma trampa: **parecen
   "añadir algo" y en realidad son "arreglar algo que ya estaba"**.

   1. **Eliminar tarea YA EXISTÍA**, dentro del detalle. Josué dijo *"parece que
      no existe"*, y tenía razón en lo que cuenta: si hay que abrir la tarea para
      encontrarlo, no existe. Así que esto **no añade una segunda puerta de
      borrado** —eso sí habría sido un sistema duplicado—: saca la de siempre a
      donde se ve.
   2. **La llama de Hábitos era la de Rachas.** Dos apartados distintos dibujados
      igual.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MINI_APPS_PR, miniAppPR } from '../src/lib/productividad.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(a === b, `${m}${a === b ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const VISTA = leer('src/views/ProductivityView.jsx');
const LIB = leer('src/lib/productividad.js');
const APP = leer('src/App.jsx');

/* Quita comentarios y cadenas: una prueba que busca si el código HACE algo no
   puede saltar con la frase que lo explica (lección repetida 14 veces). */
const soloCodigo = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')
  .replace(/'[^'\n]*'/g, "''")
  .replace(/"[^"\n]*"/g, '""')
  .replace(/`[^`]*`/g, '``');

const CODIGO = soloCodigo(VISTA);

console.log('\n── 1. Una tarea se puede eliminar desde la fila ──');

ok(/function TarjetaTarea\(\{[^}]*onEliminar/.test(CODIGO),
  '🚨 La fila de una tarea recibe `onEliminar`');
ok(/<BotonBorrar\s/.test(CODIGO),
  '🚨 …y pinta un `BotonBorrar` de verdad, no un icono decorativo');
ok(/import \{[^}]*\bBotonBorrar\b/.test(VISTA),
  '⚠️ …que está IMPORTADO: usarlo sin importar deja la pantalla en blanco y el build no lo ve (E3 F17)');

// 🚨 Lo que impide que esto sea un sistema duplicado: es el MISMO `onDelete`.
ok(/onEliminar=\{\(t\) => onDelete\(t\.id\)\}/.test(CODIGO),
  '🚨 Y llama al MISMO `onDelete` que ya usaba el detalle: una sola puerta de borrado, no dos');

// El detalle conserva el suyo: no se ha quitado nada.
ok(/BotonBorrarDefinitivo/.test(CODIGO),
  '⚠️ El borrado del detalle sigue existiendo: esto añade dónde se ve, no cambia lo que había');

console.log('\n── 2. No depende de marcarla como completada ──');

/* 🚨 El encargo, literal: *"sin tener que marcarla como completada"*. El botón
   se pinta siempre que llegue `onEliminar`, sin mirar `tarea.hecha`. */
const bloqueFila = CODIGO.slice(CODIGO.indexOf('function TarjetaTarea'), CODIGO.indexOf('function SeccionTareas'));
ok(/\{onEliminar && \(/.test(bloqueFila),
  '🚨 El botón depende SOLO de que haya `onEliminar`, no del estado de la tarea');
ok(!/hecha[^)]*BotonBorrar|BotonBorrar[^)]*hecha/.test(bloqueFila.replace(/\s+/g, ' ')),
  '⚠️ …y no está condicionado por `hecha`: se borra pendiente o completada');

console.log('\n── 3. El borrado es real y va por la puerta de siempre ──');

/* 🚨 `eliminarConPapelera` es la ÚNICA puerta de borrado (ME F3). Si la tarea se
   quitara de la lista a mano, no iría a Eliminados recientemente y Josué no
   podría recuperarla. */
ok(/eliminarConPapelera/.test(soloCodigo(APP)),
  '🚨 `App.jsx` borra con `eliminarConPapelera`: la tarea va a Eliminados recientemente');
ok(/onDeleteTarea/.test(soloCodigo(APP)),
  '⚠️ …y `onDeleteTarea` sigue cableada desde App.jsx (un manejador que nadie pasa no falla: calla)');

console.log('\n── 4. Hábitos ya no lleva la llama de Rachas ──');

const habitos = miniAppPR('habitos');
ok(!!habitos, 'La mini-app Hábitos existe');
ok(habitos.icono !== 'Flame', '🚨 El icono de Hábitos YA NO es `Flame`');
eq(habitos.icono, 'ArrowUpRight', '…es `ArrowUpRight` (↗), la flecha ascendente que pidió Josué');
ok(habitos.emoji !== '🔥', '🚨 …y su emoji tampoco es la llama');

// 🚨 Que no se repita con NINGÚN otro icono de la aplicación. Es la condición
// que él puso con todas las letras.
const repetido = MINI_APPS_PR.filter((a) => a.icono === habitos.icono).length;
eq(repetido, 1, '🚨 Ninguna otra mini-app de Productividad usa ese icono');

const usosEnApp = (APP.match(/\bArrowUpRight\b/g) || []).length;
eq(usosEnApp, 0, '🚨 …y no lo usa ningún módulo de la navegación: el icono es único en JosStyle');

// ⚠️ Y el mapa de componentes tiene que conocerlo, o la plaquita sale con el
// icono por defecto SIN FALLAR EN NINGUNA PARTE (E3 F16).
ok(/ICONOS_MINI_APP_PR = \{ ArrowUpRight/.test(CODIGO),
  '⚠️ `ICONOS_MINI_APP_PR` traduce `ArrowUpRight`: un icono que falte ahí sale como un hueco y no falla');

console.log('\n── 5. La llama sigue donde SÍ significa algo ──');

/* ⚠️ Josué: *"No cambies los iconos de otras secciones"*. La llama sigue siendo:
   (a) el icono del módulo **Rachas**, que es de donde viene el concepto, y
   (b) la marca que acompaña al número de racha DE UN HÁBITO.
   Las dos son correctas: la llama significa racha, y ahora solo significa eso. */
ok(/\{ id: 'rachas', label: 'Rachas', icon: Flame \}/.test(APP),
  '⚠️ Rachas conserva su llama: el concepto no se ha movido, se ha dejado de repetir');
ok(/<Flame size=\{11\} \/> \{racha\}/.test(CODIGO),
  '⚠️ …y la llama que acompaña a la racha de un hábito se queda: ahí SÍ es una racha');

console.log('\n── 6. Nada más ha cambiado ──');

/* El encargo termina con *"No hagas ningún cambio adicional fuera de estos dos
   puntos"*, así que se comprueba que las otras cinco mini-apps siguen igual. */
const esperados = { pomodoro: 'Timer', tareas: 'ListChecks', metas: 'Target', objetivos: 'Compass', rutinas: 'Repeat' };
for (const [id, icono] of Object.entries(esperados)) {
  const app = miniAppPR(id);
  ok(!!app && app.icono === icono, `⚠️ «${app?.nombre || id}» conserva su icono (${icono})`);
}
eq(MINI_APPS_PR.length, 6, '⚠️ Y siguen siendo seis mini-apps: no se ha añadido ni quitado ninguna');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Tareas y Hábitos (NAV F4) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
