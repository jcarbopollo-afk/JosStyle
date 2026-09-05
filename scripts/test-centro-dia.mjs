// ============================================================================
// ENTREGA 3 · FASE 6 (HC F1) — HOY: EL CENTRO DEL DÍA
//
// 🚨 **LA CONDICIÓN QUE MÁS SE PUEDE ROMPER ES LA 25:** *"no crear today_tasks,
// agenda_tasks y calendar_tasks como tres copias independientes. Debe existir
// una fuente de verdad."* Y la 24: *"si desde Hoy marco una tarea como
// completada, Agenda debe reflejarla."*
//
// La forma de cumplirlas no es sincronizar: es **no tener copia**. Los recuentos
// y el progreso se derivan de las entidades originales en el momento, así que
// están sincronizados por construcción. Hay pruebas que leen el código para
// comprobar que esta capa no guarda ni un contador.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  tocaHoy, habitoHecho, tareasDeHoy, habitosDeHoy, resumenDelDia,
  FUENTES_PROGRESO, progresoDelDia,
  MAX_APUNTE, PUEDE_CONVERTIRSE_EN, TEXTOS_APUNTES,
  normalizarApunte, normalizarApuntes, apuntesDe, anadirApunte, ORDEN_HOY,
} from '../src/lib/centroDelDia.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { DEFAULT_PRODUCTIVIDAD } from '../src/tokens.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Primero los bloques de comentario, después las llaves vacías — el patrón de
// "llave, comentario, llave" se come el código desde el primer `(() => {` con un
// comentario dentro (la lección que dejó la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

// Jueves 3 de septiembre de 2026. Lunes = 0 en el índice del proyecto.
const HOY = '2026-09-03';
const AYER = '2026-09-02';
const JUEVES = 3;

const prod = {
  tareas: [
    { id: 't1', texto: 'Estudiar 45 min', fecha: HOY, hecha: false },
    { id: 't2', texto: 'Comprar material', fecha: HOY, hecha: true },
    { id: 't3', texto: 'Lo de la semana que viene', fecha: '2026-09-20', hecha: false },
    { id: 't4', texto: 'Sin fecha', fecha: '', hecha: false },
  ],
  habitos: [
    { id: 'h1', nombre: 'Beber agua', historial: { [HOY]: true } },
    { id: 'h2', nombre: 'Leer', historial: {} },
    { id: 'h3', nombre: 'Solo lunes', dias: [0], historial: {} },
  ],
  apuntes: [],
};

console.log('\n═══ 1. EL RESUMEN DEL DÍA (apartado 2) ═══\n');

eq(tareasDeHoy(prod, HOY).map((t) => t.id), ['t1', 't2'], 'las tareas de hoy son las que tienen fecha de hoy');
ok(!tareasDeHoy(prod, HOY).some((t) => t.id === 't4'),
  '⚠️ una tarea SIN fecha no es "de hoy": meterla sería decidir por él que hoy le toca');
eq(habitosDeHoy(prod, HOY).map((h) => h.id), ['h1', 'h2'],
  'y los hábitos, los que tocan hoy (el de "solo lunes" no, siendo jueves)');
ok(tocaHoy({ dias: [JUEVES] }, HOY), 'un hábito con el jueves marcado toca hoy');
ok(tocaHoy({}, HOY) && tocaHoy({ dias: [] }, HOY), '⚠️ y uno sin días marcados es diario');
ok(habitoHecho(prod.habitos[0], HOY) && !habitoHecho(prod.habitos[1], HOY), 'se sabe cuál está hecho');
ok(!habitoHecho(prod.habitos[0], AYER), 'y lo de hoy no cuenta como hecho ayer');

const vacio = { horarios: [], columnas: [], filas: [], actividades: [], bloques: [], excepciones: [] };
const r = resumenDelDia(vacio, { hoy: HOY, productividad: prod });
eq([r.tareas, r.habitos], [2, 2], 'el resumen cuenta las tareas y los hábitos de hoy');
ok(/2 tareas/.test(r.linea) && /2 hábitos/.test(r.linea),
  `🚨 y lo dice en una línea: "${r.linea}" (apartado 2)`);

const uno = resumenDelDia(vacio, { hoy: HOY, productividad: { tareas: [{ id: 'x', fecha: HOY }], habitos: [] } });
ok(/^1 tarea$/.test(uno.linea), `⚠️ una sola va en singular: "${uno.linea}"`);

const nada = resumenDelDia(vacio, { hoy: HOY, productividad: { tareas: [], habitos: [] } });
eq([nada.linea, nada.vacio], [null, true],
  '🚨 un día sin nada devuelve `null`, NO "0 tareas · 0 eventos": tres ceros todos los domingos son ruido');

console.log('\n═══ 2. EL PROGRESO DEL DÍA (apartado 20) ═══\n');

const p = progresoDelDia(prod, HOY);
eq([p.total, p.hechos, p.porcentaje], [4, 2, 50],
  '2 tareas + 2 hábitos, con 2 hechos: 50 %');
eq(p.texto, '50 % completado', 'y lo dice con las palabras del apartado 20');
ok(!p.completo, 'y no está completo');

const todo = progresoDelDia({ tareas: [{ id: 'a', fecha: HOY, hecha: true }], habitos: [] }, HOY);
eq([todo.porcentaje, todo.completo], [100, true], 'con todo hecho, 100 % y completo');

const sinNada = progresoDelDia({ tareas: [], habitos: [] }, HOY);
eq([sinNada.porcentaje, sinNada.texto], [null, null],
  '🚨 SIN NADA COMPLETABLE NO HAY PORCENTAJE: un 0 % de un día en el que no tocaba nada es un reproche (EH F8)');

// 🚨 *"NO contar eventos que simplemente ocurren."*
eq(FUENTES_PROGRESO.map((f) => f.id), ['tareas', 'habitos'],
  '🚨 el progreso cuenta SOLO tareas y hábitos: un evento que ocurre no se "completa" (apartado 20)');
ok(FUENTES_PROGRESO.every((f) => f.cuenta && f.porque),
  '⚠️ y el cálculo está declarado, no implícito: el apartado pide que "esté claramente definido"');

console.log('\n═══ 3. LOS APUNTES DE HOY (apartado 17) ═══\n');

const conApunte = anadirApunte(prod, '  Preguntar a mi hermano lo del proyecto  ', HOY);
eq(conApunte.apuntes.length, 1, 'se puede apuntar algo');
eq(conApunte.apuntes[0].texto, 'Preguntar a mi hermano lo del proyecto', 'y se guarda sin espacios de sobra');
eq(conApunte.apuntes[0].fecha, HOY, 'con su día: los apuntes pertenecen al día');
ok(!!conApunte.apuntes[0].id,
  '⚠️ y con id: uno guardado sin id es un duplicado esperando a pasar (EH F45)');
eq(anadirApunte(prod, '   ', HOY).apuntes, [], '⚠️ un apunte vacío no se guarda');
eq(anadirApunte(prod, 'x'.repeat(500), HOY).apuntes[0].texto.length, MAX_APUNTE, 'y uno larguísimo se recorta');

eq(apuntesDe(conApunte, HOY).length, 1, 'los apuntes de hoy salen');
eq(apuntesDe(conApunte, AYER).length, 0, '⚠️ y los de ayer NO se arrastran: siguen en su día');
eq(normalizarApunte({ texto: '   ' }), null, 'un apunte sin texto se descarta al normalizar');
eq(normalizarApuntes('no es una lista'), [], 'y algo que no es una lista, también');
eq(normalizarApunte({ id: 'a', texto: 'x', fecha: 'mañana' }).fecha, new Date().toLocaleDateString('sv-SE'),
  '⚠️ una fecha que no es una fecha se cae al día de hoy');

ok(TEXTOS_APUNTES.invita === 'Escribe algo que no quieras olvidar.'
  && TEXTOS_APUNTES.campo === '¿Qué tienes en mente?',
  '⚠️ y los textos son los del enunciado, literales');

// ⏸ Convertirlo en tarea o evento es de la HC F4: aquí se declara, no se finge.
eq(PUEDE_CONVERTIRSE_EN.map((x) => x.id), ['tarea', 'evento', 'nota'],
  '⏸ se declara en qué puede convertirse, con dónde vive cada cosa');
ok(PUEDE_CONVERTIRSE_EN.every((x) => x.donde.includes('.')),
  '⚠️ y apuntando a la colección REAL de cada una: nada de un sistema paralelo');

console.log('\n═══ 4. UNA SOLA FUENTE DE VERDAD (apartados 24 y 25) ═══\n');

const LIB = sinComentarios(leer('src/lib/centroDelDia.js'));
for (const copia of ['today_tasks', 'agendaTareas', 'tareasDeAgenda', 'copiaTarea']) {
  ok(!new RegExp(copia, 'i').test(LIB), `🚨 no existe \`${copia}\`: ni una copia de las tareas (apartado 25)`);
}
ok(!/DEFAULT_HOY|normalizarHoy\b/.test(LIB),
  '🚨 y esta capa NO tiene almacén propio: lo único que guarda son los apuntes, que no existían');
ok(!/saveData|supabase/i.test(LIB), '⚠️ ni guarda por su cuenta: devuelve, y escribe App.jsx');
ok(/agendaCompleta/.test(LIB),
  '⚠️ los eventos salen de `agendaCompleta` (HT F6), no de un recuento nuevo');

// ⚠️ Marcar en Hoy actualiza la tarea original — porque es la misma tarea.
const APP = sinComentarios(leer('src/App.jsx'));
ok(/onAddApunte=\{addApunteDelDia\}/.test(APP), 'App.jsx pasa la puerta de guardar apuntes');
ok(/eliminarConPapelera\('productividad', 'apuntes'/.test(APP),
  "🚨 y el borrado va por `eliminarConPapelera('productividad', 'apuntes', …)`, con los nombres literales (ME F4)");
ok(!!CATALOGO_PAPELERA['productividad.apuntes'],
  '🚨 y los apuntes están en CATALOGO_PAPELERA: toda lista que se pueda borrar va ahí (EH F45)');
ok(Array.isArray(DEFAULT_PRODUCTIVIDAD.apuntes),
  '⚠️ `apuntes` está en DEFAULT_PRODUCTIVIDAD: sin eso, lo guardado antes de esta fase llega sin el campo (regla 5)');

console.log('\n═══ 5. EL ORDEN Y LA PANTALLA (apartados 18 y 19) ═══\n');

eq(ORDEN_HOY[0].id, 'ahora', '🚨 lo primero es la situación inmediata (apartado 18)');
eq(ORDEN_HOY[1].id, 'tareas', 'y después lo que requiere acción');
eq(ORDEN_HOY[ORDEN_HOY.length - 1].id, 'secundario', 'lo secundario, al final');

const VISTA = sinComentarios(leer('src/views/DashboardView.jsx'));
/* ⚠️ En varias líneas desde la E3 F9, que le añadió "Ver todas →" (apartado 18):
   la expresión no puede dar por hecho que las props caben en una sola. */
ok(/<ResumenDelDia[\s\S]{0,120}resumen=\{resumenHoy\}/.test(VISTA),
  'la pantalla pinta el resumen que le llega derivado');
ok(!/const total = .*tareas.*length/.test(VISTA),
  '⚠️ y no cuenta por su cuenta: si dijera un número distinto del de Agenda, uno de los dos mentiría');
ok(/<ApuntesDeHoy/.test(VISTA), 'y los apuntes de hoy');
ok(/onChange=\{\(ev\) => setTexto\(ev\.target\.value\)\}/.test(VISTA),
  '🚨 `TextInput` da el EVENTO, no el valor: `onChange={setTexto}` se pinta perfecto y no funciona (EH F36/F37)');

// Apartado 18 — el resumen va arriba, los apuntes abajo.
ok(VISTA.indexOf('<ResumenDelDia') < VISTA.indexOf('<ApuntesDeHoy'),
  '⚠️ el resumen arriba y la captura abajo: lo accionable primero (apartado 18)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
