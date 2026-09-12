/* ===========================================================================
   GE F1 — Tareas, Día, Agenda, Productividad y la fila de macros.

   Los cuatro encargos de Josué en este bloque comparten una idea: **una sola
   fuente de verdad, y cada cosa en un sitio**. No hay funcionalidad nueva; hay
   una duplicación que sobra y un botón que faltaba.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { paraHoyPR, pesoDe } from '../src/lib/integracionPR.js';
import { INDICADORES, MACROS } from '../src/lib/nutricion.js';
import { ACCIONES_ELEMENTO, accionesDe } from '../src/lib/accionesHoyAgenda.js';
import { completarTarea } from '../src/lib/tareas.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(a === b, `${m}${a === b ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const sinComentarios = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/(?<![:\w])\/\/[^\n]*/g, '');

const HOY = new Date().toLocaleDateString('sv-SE');
const AYER = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');

console.log('\n── 1. Una tarea se marca Y se desmarca ──');

/* Josué: *"Si una tarea se desmarca accidentalmente, debe volver correctamente a
   estado pendiente."* `completarTarea` ALTERNA, no pone `true`. */
const t0 = { id: 't', texto: 'Prueba', fecha: HOY, hecha: false };
const t1 = completarTarea(t0);
ok(t1.hecha === true, 'Marcar una tarea la completa');
ok(!!t1.completadaEn, '…y apunta CUÁNDO (sin eso, «completadas hoy» diría siempre cero)');
const t2 = completarTarea(t1);
ok(t2.hecha === false, '🚨 Y volver a tocarla la DESMARCA: vuelve a pendiente');
eq(t2.completadaEn, null, '⚠️ …y se borra el instante, porque ya no está completada');
eq(t2.id, t0.id, '🚨 Y sigue siendo LA MISMA tarea: ni se borra ni se crea una copia');

console.log('\n── 2. Eliminar existe, y es la misma puerta ──');

const accionesTarea = accionesDe({ tipo: 'tarea' }).map((a) => a.id);
ok(accionesTarea.includes('eliminar'), '🚨 Una tarea se puede eliminar desde el menú de Día');
ok(accionesTarea.includes('completar'), '…y completar');
ok(ACCIONES_ELEMENTO.find((a) => a.id === 'eliminar')?.destructiva === true,
  '⚠️ …y eliminar está marcada como destructiva, para que la pantalla la trate distinto');

/* 🐛 **EL FALLO QUE REPORTÓ JOSUÉ.** El menú `⋯` se pintaba en las tareas CON
   hora y no en las de SIN hora — que son las normales cuando apuntas algo para
   hoy. Por eso decía *"la única forma de que desaparezca es marcarla como
   completada"*. Se comprueba que el menú esté en LOS DOS bloques. */
const CAL = sinComentarios(leer('src/views/CalendarView.jsx'));
const menus = (CAL.match(/onMenu && onMenu\(e\)/g) || []).length;
ok(menus >= 2,
  `🚨 GE F1 — el menú de acciones está en los DOS bloques del día (${menus}): con hora y SIN hora`);

/* ⚠️ Y la casilla dice «Desmarcar» cuando ya está hecha: sin eso, alguien con
   lector de pantalla no sabe que el mismo botón deshace (EH F42). */
ok(/Desmarcar \$\{e\.titulo\}/.test(CAL),
  '⚠️ La casilla se anuncia como «Desmarcar» cuando la tarea está hecha');

console.log('\n── 3. Una tarea completada se ve, en gris ──');

/* Josué: *"Ver las tareas completadas en gris"* y *"mantenerlas visibles durante
   el día"*. No se esconden: se tachan. */
ok(/textDecoration: e\.hecha \? 'line-through' : 'none'/.test(CAL),
  '🚨 Una tarea hecha se TACHA, no desaparece de Día');

console.log('\n── 4. Productividad ya no copia las tareas de hoy ──');

const D = {
  hoy: HOY,
  productividad: {
    tareas: [
      { id: 'hoy1', texto: 'De hoy, normal', fecha: HOY, hecha: false, prioridad: 'media' },
      { id: 'hoy2', texto: 'De hoy, alta', fecha: HOY, hecha: false, prioridad: 'alta' },
      { id: 'vieja', texto: 'De ayer, sin hacer', fecha: AYER, hecha: false, prioridad: 'media' },
    ],
    habitos: [], rutinas: [], rutinaEjecuciones: [], metas: [], pomodoros: {}, pomodoroSesiones: [],
  },
  objetivos: { lista: [] },
};
const lista = paraHoyPR(D);
const textos = lista.map((e) => e.texto);

ok(!textos.includes('De hoy, normal'),
  '🚨 GE F1 — una tarea de HOY ya no sale en «Para hoy» de Productividad: su sitio es Día');
ok(!textos.includes('De hoy, alta'),
  '🚨 …tampoco una de prioridad alta: el criterio es DÓNDE vive, no lo urgente que sea');

/* 🚨 **Pero lo VENCIDO sí se queda, y no es una excepción de conveniencia.** Una
   tarea de ayer **no sale en Día**, porque Día es hoy. Si tampoco saliera aquí,
   dejaría de verse en ninguna parte — justo lo contrario de lo que él pide. */
ok(textos.includes('De ayer, sin hacer'),
  '🚨 …pero una VENCIDA sí: no sale en Día, y quitarla la dejaría invisible en toda la aplicación');

console.log('\n── 5. Y no se ha roto la prioridad ──');

ok(lista.every((e, i, a) => i === 0 || pesoDe(a[i - 1].motivo) >= pesoDe(e.motivo)),
  '⚠️ La lista sigue ordenada de más peso a menos: determinista, sin azar');

/* ⚠️ Las herramientas propias de Productividad SIGUEN saliendo: el encargo era
   quitar la copia de las tareas, no vaciar la portada. */
const D2 = {
  ...D,
  productividad: {
    ...D.productividad,
    habitos: [{ id: 'h', nombre: 'Beber agua', activo: true, frecuencia: 'diaria', historial: [] }],
  },
};
ok(paraHoyPR(D2).some((e) => e.app === 'habitos'),
  '🚨 Los hábitos SIGUEN en «Para hoy»: son herramienta de Productividad y no salen en Día');

console.log('\n── 6. Una sola fuente de verdad ──');

/* 🚨 Ni Día ni la Agenda guardan tareas: las leen de `productividad.tareas`. Por
   eso completar en una se ve en la otra **gratis** — no hay nada que
   sincronizar porque no hay copia (E3 F7, apartado 25). */
const AGENDA = sinComentarios(leer('src/lib/agendaDia.js'));
ok(!/saveData|localStorage/.test(AGENDA), '🚨 `agendaDia.js` no guarda nada: junta y ordena lo que ya existe');
ok(!/normalizar(Tarea|Agenda)/.test(AGENDA), '⚠️ …y no tiene normalizador propio, porque no tiene datos propios');

const APP = sinComentarios(leer('src/App.jsx'));
ok(/onCompletarTarea=\{toggleTarea\}/.test(APP),
  '🚨 Día y el Calendario completan con `toggleTarea`, la MISMA función: marcar en una vista marca en todas');

console.log('\n── 7. Agenda sigue siendo lo PRÓXIMO ──');

/* Josué: *"DÍA = qué tengo que hacer hoy. AGENDA = qué tengo programado
   próximamente."* Son dos preguntas distintas y por eso conviven (E3 F7). */
ok(/vista === 'dia'/.test(CAL) && /vista === 'agenda'/.test(CAL),
  '⚠️ Día y Agenda siguen siendo dos vistas distintas, no una copia la otra');
ok(/vista === 'mes'/.test(CAL) && /vista === 'semana'/.test(CAL),
  '⚠️ …y Mes y Semana tampoco se han tocado');

console.log('\n── 8. Los tres macros, en UNA fila ──');

eq(MACROS.length, 3, 'Los macros son tres: proteína, carbohidratos y grasas');
eq(INDICADORES.length, 4, '…y con las calorías, cuatro indicadores');

const NUT = leer('src/views/NutritionView.jsx');
ok(/macros\.length === 3 \? 'grid-cols-3' : 'grid-cols-2'/.test(NUT),
  '🚨 GE F1 — tres macros van en TRES columnas: ya no cae uno solo a una segunda fila');
/* ⚠️ Y el número de columnas sale de la longitud, no está escrito a mano: si un
   día hay cuatro macros, vuelven a 2×2 sin tocar la pantalla. */
ok(!/grid-cols-3 gap-2\.5/.test(NUT), '⚠️ …y no está escrito a mano un «3» que se quedaría viejo');

/* ⚠️ En un tercio de ancho «Carbohidratos» no cabe en una línea, así que la fila
   compacta usa el rótulo corto — que es un campo del catálogo, no un `if`. */
for (const m of MACROS) {
  ok(typeof m.corto === 'string' && m.corto.length > 0, `⚠️ «${m.nombre}» tiene su rótulo corto para la fila compacta`);
}
ok(MACROS.find((m) => m.id === 'carbohidratos').corto.length < 'Carbohidratos'.length,
  '🚨 …y el de Carbohidratos es más corto de verdad: es el único que no cabía');
ok(/principal \? dato\.nombre : \(dato\.corto \?\? dato\.nombre\)/.test(NUT),
  '⚠️ La tarjeta grande de kcal conserva el nombre entero: solo se abrevia la fila de tres');

/* 🚨 Y los DATOS no cambian: el encargo decía *"no cambies las métricas ni sus
   datos, únicamente la organización visual"*. */
for (const m of MACROS) {
  ok(!!m.campo && !!m.unidad, `⚠️ «${m.nombre}» conserva su campo y su unidad`);
}
eq(MACROS.map((m) => m.id).join(','), 'proteinas,carbohidratos,grasas',
  '🚨 …y siguen siendo los mismos tres, en el mismo orden');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Gestión: tareas, Día y macros (GE F1) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
