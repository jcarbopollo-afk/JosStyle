// ============================================================================
// ENTREGA 3 · FASE 10 (HC F5) — PLANIFICACIÓN AVANZADA Y VISTA SEMANAL
//
// 🚨 **Las dos condiciones que más se pueden romper:**
//   · el apartado 23 — *"no crear tres instancias independientes"*: una tarea
//     recurrente sale en Hoy, en la Agenda y en el Calendario porque las tres
//     preguntan por su día, no porque exista tres veces;
//   · el apartado 25 — *"Hábitos debe seguir siendo la fuente de verdad de las
//     rachas"*: esta capa **representa**, no cuenta rachas.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  inicioDeSemana, finDeSemana, semanaAnterior, semanaSiguiente, esSemanaActual, tituloSemana,
  seRepite, idInstancia, instanciaHecha, marcarInstancia,
  ALCANCES_SERIE, alcanceSerie, saltarInstanciaTarea,
  tareasConRepeticion, ORDEN_PRIORIDAD, pesoDe,
  TEXTO_DIA_LIBRE, diaDeLaSemana, semanaDe,
  YA_RESUELTO_SEMANA, PREPARADO_PARA_AVISOS, NO_EN_LA_SEMANA,
} from '../src/lib/semana.js';
import { FRECUENCIAS_RECURRENCIA } from '../src/tokens.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Bloques primero, llaves vacías después (la lección de la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

// Jueves 3 de septiembre de 2026. Su semana: lunes 31/08 — domingo 06/09.
const JUEVES = '2026-09-03';
const LUNES = '2026-08-31';
const DOMINGO = '2026-09-06';

console.log('\n═══ 1. LA SEMANA EMPIEZA EL LUNES (apartados 2, 5 y 6) ═══\n');

eq(inicioDeSemana(JUEVES), LUNES, 'el lunes de la semana del jueves');
eq(finDeSemana(JUEVES), DOMINGO, 'y su domingo');
eq(inicioDeSemana(LUNES), LUNES, 'un lunes es su propio inicio');
eq(inicioDeSemana(DOMINGO), LUNES,
  '🚨 y un DOMINGO pertenece a la semana que empieza el lunes anterior: es el caso que se rompe solo');
eq(inicioDeSemana('2026-01-01'), '2025-12-29',
  '⚠️ y cruzar de año funciona: la fecha se construye en local, nunca con `toISOString` (séptima vez)');

eq(semanaAnterior(JUEVES), '2026-08-24', 'la semana anterior');
eq(semanaSiguiente(JUEVES), '2026-09-07', 'y la siguiente');
ok(esSemanaActual('2026-09-06', JUEVES) && !esSemanaActual('2026-09-07', JUEVES),
  '⚠️ "Esta semana" es la que CONTIENE hoy, no el día de hoy (apartado 6)');

eq(tituloSemana('2026-09-07'), '7 — 13 septiembre', '⚠️ la cabecera del apartado 2');
ok(/agosto/.test(tituloSemana(JUEVES)) && /septiembre/.test(tituloSemana(JUEVES)),
  '🚨 y una semana que cruza de mes dice LOS DOS: decir solo uno sería mentir la mitad de las veces');

console.log('\n═══ 2. UNA TAREA QUE SE REPITE (apartados 9, 10 y 23) ═══\n');

const suelta = { id: 't1', texto: 'Comprar material', fecha: JUEVES, hecha: false };
const serie = { id: 't2', texto: 'Leer', fecha: LUNES, recurrencia: { frecuencia: 'diaria' } };
const prod = { tareas: [suelta, serie] };

ok(!seRepite(suelta) && seRepite(serie), 'se distingue una tarea suelta de una serie');
ok(!seRepite({ id: 'x', recurrencia: {} }), '⚠️ y una `recurrencia` sin frecuencia no es una serie');

const delJueves = tareasConRepeticion(prod, JUEVES);
eq(delJueves.map((t) => t.texto).sort(), ['Comprar material', 'Leer'],
  '🚨 la tarea diaria sale el jueves aunque su fecha sea el lunes: la regla se expande (apartado 10)');
eq(tareasConRepeticion(prod, '2026-09-05').map((t) => t.texto), ['Leer'],
  '⚠️ y el sábado sale solo ella: la suelta se quedó en su día');

const instancia = delJueves.find((t) => t.texto === 'Leer');
eq(instancia.id, 't2@2026-09-03',
  '🚨 la aparición lleva SU FECHA en el id: es lo que distingue el jueves del viernes sin que exista una tarea por día');
eq(instancia.tareaId, 't2', '⚠️ y guarda el id de la regla, que es lo que hay que escribir');
ok(instancia.esInstancia, 'y se sabe que es una aparición, no una tarea suelta');

eq(FRECUENCIAS_RECURRENCIA.map((f) => f.value), ['diaria', 'semanal', 'mensual', 'anual'],
  '⚠️ las frecuencias son las del catálogo que YA existe: dos listas acabarían diciendo cosas distintas');

console.log('\n═══ 3. COMPLETAR UNA APARICIÓN NO COMPLETA LA SERIE (apartado 24) ═══\n');

const trasMarcar = marcarInstancia(serie, JUEVES);
ok(instanciaHecha(trasMarcar, JUEVES),
  'marcar el jueves lo deja hecho');
ok(!instanciaHecha(trasMarcar, '2026-09-04'),
  '🚨 y el VIERNES sigue pendiente: *"completar una instancia no debe marcar todas las demás"* (apartado 24)');
eq(trasMarcar.recurrencia.frecuencia, 'diaria',
  '🚨 y la regla permanece: se guardan las fechas hechas DENTRO de ella, no una tarea por día');
eq(marcarInstancia(trasMarcar, JUEVES).recurrencia.hechas, [],
  '⚠️ y volver a pulsarlo lo desmarca');
eq(marcarInstancia(suelta, JUEVES).hecha, true, 'una tarea suelta se marca como siempre');
eq(marcarInstancia(serie, '2026-13-45'), null,
  '🐛 y una fecha imposible no escribe nada: la forma no basta (cuarta vez)');

// Y la aparición ya sale marcada.
const conHecha = tareasConRepeticion({ tareas: [trasMarcar] }, JUEVES)[0];
ok(conHecha.hecha, '⚠️ la aparición del jueves sale ya marcada, sin que nadie la sincronice');

console.log('\n═══ 4. ESTE DÍA O TODA LA SERIE (apartados 12, 13 y 14) ═══\n');

eq(ALCANCES_SERIE.map((a) => a.id), ['dia', 'serie'],
  '⚠️ las dos opciones del apartado 12, con sus nombres');
ok(ALCANCES_SERIE.every((a) => a.explica),
  '🚨 y cada una explica qué le pasa al resto: *"evitar modificar accidentalmente todas las repeticiones"*');
eq(alcanceSerie('inventado'), null,
  '⚠️ y no hay valor por defecto: elegir por él se cargaría todos los lunes (la lección de HT F3)');

const saltado = saltarInstanciaTarea(serie, JUEVES);
eq(saltado.recurrencia.excepciones, [JUEVES], 'saltar un día lo apunta como excepción');
eq(tareasConRepeticion({ tareas: [saltado] }, JUEVES).length, 0,
  '🚨 y ese día ya no sale…');
eq(tareasConRepeticion({ tareas: [saltado] }, '2026-09-04').length, 1,
  '🚨 …pero el siguiente SÍ: la serie no se corta (apartado 14)');
eq(saltarInstanciaTarea(suelta, JUEVES), null, '⚠️ una tarea suelta no tiene serie que saltar');

console.log('\n═══ 5. EL ORDEN DENTRO DE UN DÍA (apartado 17) ═══\n');

eq(ORDEN_PRIORIDAD.map((o) => o.id), ['evento', 'con_hora', 'tarea_prioritaria', 'tarea', 'sin_hora'],
  '⚠️ los cinco escalones del apartado 17, en su orden');
ok(ORDEN_PRIORIDAD.every((o) => o.que), 'y cada uno con su nombre');

ok(pesoDe({ tipoElemento: 'evento', horaInicio: '17:00' }) < pesoDe({ hora: '09:00', esTarea: true }),
  '🚨 un evento con hora va antes que una tarea con hora');
ok(pesoDe({ hora: '09:00', esTarea: true }) < pesoDe({ prioridad: 'alta', esTarea: true }),
  '⚠️ lo que tiene hora, antes que una tarea prioritaria sin ella');
ok(pesoDe({ prioridad: 'alta', esTarea: true }) < pesoDe({ esTarea: true }),
  '⚠️ y una prioritaria antes que una normal');
ok(pesoDe({ tipoElemento: 'evento' }) === 5,
  '⚠️ un evento SIN hora baja al final: es un elemento sin hora, como dice el apartado');

console.log('\n═══ 6. UN DÍA Y LA SEMANA ENTERA (apartados 2, 15 y 16) ═══\n');

const eventos = [
  { id: 'e1', titulo: 'Entrenamiento', fecha: JUEVES, tipo: 'entrenamiento', horaInicio: '17:00' },
  { id: 'e2', titulo: 'Clase', fecha: LUNES, tipo: 'estudio', horaInicio: '08:00', recurrencia: { frecuencia: 'semanal' } },
];

const dia = diaDeLaSemana(eventos, JUEVES, prod, JUEVES);
eq(dia.total, 3, 'el jueves tiene el entrenamiento y las dos tareas');
ok(dia.esHoy, 'y se sabe que es hoy');
ok(!dia.libre, 'y que no está libre');
eq(dia.elementos[0].titulo, 'Entrenamiento',
  '⚠️ el evento con hora va primero (apartado 17)');
ok(dia.carga && dia.carga.nombre,
  '⚠️ y la carga es la de la E3 F8: *"no crear una puntuación artificial"* (apartado 15)');

const libre = diaDeLaSemana([], '2026-09-05', { tareas: [] }, JUEVES);
ok(libre.libre && libre.total === 0, 'un día sin nada se sabe que está libre');
eq(TEXTO_DIA_LIBRE, 'Libre',
  '⚠️ y su texto es el del apartado 16: *"no rellenar con tarjetas vacías"*');

const sem = semanaDe(eventos, JUEVES, { productividad: prod, hoy: JUEVES });
eq(sem.dias.length, 7, 'la semana son siete días');
eq([sem.desde, sem.hasta], [LUNES, DOMINGO], 'de lunes a domingo');
ok(sem.esActual, 'y es la actual');
ok(sem.dias.find((d) => d.seleccionado).fecha === JUEVES, 'con el día seleccionado marcado');
ok(sem.dias.find((d) => d.fecha === LUNES).elementos.some((e) => e.titulo === 'Clase'),
  '⚠️ la clase semanal sale su lunes');
/* ⚠️ Con una tarea DIARIA no hay ni un día libre, y está bien: la que hay se
   repite todos los días. Los días libres se comprueban con una semana sin ella. */
const semSinDiaria = semanaDe(eventos, JUEVES, { productividad: { tareas: [suelta] }, hoy: JUEVES });
ok(semSinDiaria.dias.filter((d) => d.libre).length > 0, 'y sin la tarea diaria hay días libres');
ok(!sem.vacia && sem.total >= 3, 'la semana no está vacía y cuenta sus elementos');

const semVacia = semanaDe([], '2026-12-07', { productividad: { tareas: [] }, hoy: JUEVES });
ok(semVacia.vacia && !semVacia.esActual, 'una semana sin nada se sabe vacía, y no es la actual');

console.log('\n═══ 7. LO QUE YA ESTABA, Y NO SE REHACE (apartados 9, 14, 20, 21, 22 y 25) ═══\n');

ok(YA_RESUELTO_SEMANA.length >= 7 && YA_RESUELTO_SEMANA.every((x) => x.apartado && x.con),
  '⚠️ lo que ya funcionaba se declara CON la función real que lo resuelve');
ok(YA_RESUELTO_SEMANA.some((x) => x.apartado === 9 && /expandirRecurrentes/.test(x.con)),
  '🚨 el motor de recurrencias YA existía: escribir un segundo sería la duplicación que prohíbe el apartado 14');
ok(YA_RESUELTO_SEMANA.some((x) => x.apartado === 20 && /QuickAdd/.test(x.con)),
  '🚨 y el ＋ es el de la E3 F9: *"no crear otro Quick Add específico para Semana"* (apartado 20)');
ok(YA_RESUELTO_SEMANA.some((x) => x.apartado === 25 && /rachasServicio/.test(x.con)),
  '🚨 y las rachas siguen siendo de Hábitos (apartado 25)');

eq(PREPARADO_PARA_AVISOS.filter((c) => !c.existe).map((c) => c.campo), ['reminder'],
  '⏸ el apartado 30 pide dejar los campos preparados: tres existen y el recordatorio NO, y se dice');
ok(PREPARADO_PARA_AVISOS.filter((c) => !c.existe).every((c) => c.porque),
  '⚠️ con su motivo: añadir un aviso propio a una tarea sería un segundo emisor (HT F10, EH F38)');
ok(PREPARADO_PARA_AVISOS.filter((c) => c.existe).every((c) => c.donde),
  '⚠️ y los que existen dicen dónde viven');

ok(NO_EN_LA_SEMANA.length >= 4 && NO_EN_LA_SEMANA.every((x) => x.porque),
  '⚠️ y lo que no se hace está escrito con su motivo');
ok(NO_EN_LA_SEMANA.some((x) => /rrastrar/.test(x.que)),
  '⚠️ arrastrar y soltar no se construye: EH F50 prohíbe que una acción dependa de un gesto (apartado 8)');

console.log('\n═══ 8. NI UN SEGUNDO MOTOR, NI UNA SEGUNDA RACHA ═══\n');

const LIB = sinComentarios(leer('src/lib/semana.js'));
ok(/expandirRecurrentes/.test(LIB),
  '🚨 la expansión la hace el motor del Calendario: no se reescribe (apartado 14)');
for (const propio of ['function expandir', 'tocaEnFecha', 'function siguienteOcurrencia']) {
  ok(!new RegExp(propio).test(LIB), `🚨 y no hay un \`${propio}\` propio: sería el segundo motor`);
}
/* 🚨 Apartado 25 — las rachas son de Hábitos. ⚠️ Se busca la LLAMADA y el
   IMPORT, no la palabra: `YA_RESUELTO_SEMANA` NOMBRA `rachasServicio` para decir
   quién manda, y eso es una declaración. Decimocuarta vez de esta lección. */
/* Se miran los IMPORTS, que es lo que no se puede fingir: sin importar nada de
   rachas es imposible llamarlas. Buscar la palabra saltaba con la línea que
   NOMBRA a `rachasServicio.js` para decir quién manda. */
const IMPORTS_SEMANA = (LIB.match(/^import [\s\S]*?;$/gm) || []).join('\n');
for (const racha of ['rachas', 'gamificacion']) {
  ok(!new RegExp(racha, 'i').test(IMPORTS_SEMANA),
    `🚨 no se importa nada de \`${racha}\`: *"Hábitos debe seguir siendo la fuente de verdad de las rachas"* (apartado 25)`);
}
ok(!/registrarRacha\(|calcularRacha\(/.test(LIB), '🚨 ni se llama a ninguna función de rachas');
ok(!/saveData\(|supabase\./i.test(LIB),
  '🚨 y esta capa no guarda: devuelve la tarea cambiada y escribe `App.jsx`');
for (const copia of ['week_items', 'semana_events', 'DEFAULT_SEMANA', 'normalizarSemana']) {
  ok(!new RegExp(copia, 'i').test(LIB), `🚨 ni un almacén propio: no existe \`${copia}\``);
}
ok(/cargaDelDia/.test(LIB),
  '⚠️ y la carga es la de la E3 F8: una segunda escala diría un número distinto del de la vista de mes');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
