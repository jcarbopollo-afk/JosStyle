// ============================================================================
// ENTREGA 3 · FASE 8 (HC F3) — CALENDARIO: LA VISTA TEMPORAL
//
// 🚨 **Lo que esta fase arregla de verdad es el apartado 12:** *"si una tarea
// tiene fecha, debe aparecer en Calendario"*. No aparecía. Ni un punto en la
// celda, ni una línea en el día: el Calendario enseñaba solo `calendario.eventos`
// y los derivados, así que una tarea del 29 era invisible hasta abrir la Agenda.
//
// Y la condición que más se puede romper al arreglarlo es la 31: *"no crear
// `calendar_tasks` / `calendar_events` si ya existen las entidades globales"*.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  QUE_SE_PUEDE_CREAR, sePuedeCrear, queSeCrea,
  nuevaTareaDeCalendario, tareasDelDia,
  TOPE_INDICADORES, indicadoresDelDia, resumenDeDia,
  CARGAS, cargaDelDia, MARCAS_DE_HOY, marcaDeHoy,
  rangoDelMes, VACIO_MES, mesVacio, accesosDelDia, NO_EN_ESTA_FASE,
} from '../src/lib/calendarioMes.js';
import { TIPOS_EVENTO_CALENDARIO } from '../src/tokens.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Bloques primero, llaves vacías después (la lección de la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

const HOY = '2026-09-03';
const eventos = [
  { id: 'e1', titulo: 'Entrenamiento', fecha: HOY, tipo: 'entrenamiento', horaInicio: '17:00' },
  { id: 'e2', titulo: 'Cumple de Ana', fecha: HOY, tipo: 'fecha_importante', todoElDia: true },
  { id: 'e3', titulo: 'Tomar la pastilla', fecha: HOY, tipo: 'recordatorio', horaInicio: '08:00' },
  { id: 'e4', titulo: 'De otro día', fecha: '2026-09-20', tipo: 'personal', horaInicio: '10:00' },
];
const prod = {
  tareas: [
    { id: 't1', texto: 'Estudiar Biología', fecha: HOY, hora: '10:00', hecha: false },
    { id: 't2', texto: 'Comprar material', fecha: HOY, hecha: false },
    { id: 't3', texto: 'De otro día', fecha: '2026-10-01', hecha: false },
  ],
};

console.log('\n═══ 1. UNA TAREA CON FECHA SALE EN EL CALENDARIO (apartados 12 y 14) ═══\n');

const tareas = tareasDelDia(prod, HOY);
eq(tareas.map((t) => t.titulo), ['Estudiar Biología', 'Comprar material'],
  '🚨 las tareas del día salen, y las que tienen hora van primero');
eq(tareas.map((t) => t.hora), ['10:00', ''],
  '⚠️ y una tarea SIN hora sigue saliendo: va a "Sin hora" (apartado 14), no desaparece');
eq(tareas[0].refId, 't1',
  '🚨 cada fila lleva el id de LA tarea original: completarla llama a `toggleTarea`, no a una copia');
ok(!tareas.some((t) => t.titulo === 'De otro día'), 'y lo de otro día no se cuela');
eq(tareasDelDia(null, HOY), [], 'sin productividad no revienta: devuelve una lista vacía');

console.log('\n═══ 2. LOS PUNTOS DE LA CELDA (apartados 2, 3 y 14) ═══\n');

const puntos = indicadoresDelDia(eventos, HOY, prod);
ok(puntos.includes('tarea'),
  '🚨 un día con tareas enseña su punto: era exactamente lo que faltaba');
eq(puntos.length, TOPE_INDICADORES, 'y nunca más de tres, que una celda de móvil no aguanta más');
ok(puntos[puntos.length - 1] === 'tarea',
  '⚠️ el punto de tarea va el último: añadirlo no mueve de sitio los que ya había');

const soloEventos = indicadoresDelDia(eventos, HOY, { tareas: [] });
eq(soloEventos.length, 3, 'sin tareas, los tres tipos de evento siguen cabiendo');
ok(!soloEventos.includes('tarea'), 'y no se inventa un punto verde donde no hay tareas');

// 🐛 El caso que se rompe solo: tres tipos de evento + tareas.
const lleno = indicadoresDelDia(eventos, HOY, prod);
ok(lleno.includes('tarea'),
  '🚨 con tres tipos de evento Y tareas, el punto de tarea SIGUE saliendo: si no, las tareas volverían a ser invisibles');

eq(indicadoresDelDia(eventos, '2026-09-15', prod), [], 'un día sin nada no tiene puntos');

console.log('\n═══ 3. EL RESUMEN DEL DÍA (apartado 5) ═══\n');

const resumen = resumenDeDia(eventos, HOY, prod);
ok(resumen.startsWith('2 tareas'),
  '🚨 el resumen empieza por las tareas, como el enunciado: "4 tareas · 2 eventos · 1 recordatorio"');
ok(/1 entrenamiento/.test(resumen) && /1 fecha importante/.test(resumen) && /1 recordatorio/.test(resumen),
  '⚠️ y desglosa los tipos de evento presentes, en el orden fijo del catálogo');
eq(resumenDeDia(eventos, HOY, { tareas: [{ id: 'u', texto: 'Una', fecha: HOY }] }).split(' · ')[0], '1 tarea',
  'una sola tarea se dice en singular');
eq(resumenDeDia(eventos, '2026-09-15', prod), null,
  '⚠️ un día sin nada devuelve `null`: nunca "0 tareas · 0 eventos" (la lección de la E3 F6)');
eq(resumenDeDia([], HOY, prod), '2 tareas',
  '🚨 y un día que SOLO tiene tareas ya tiene resumen — antes no tenía ninguno');

console.log('\n═══ 4. LA CARGA DEL DÍA (apartado 23) ═══\n');

eq(CARGAS.map((c) => c.id), ['libre', 'normal', 'ocupado'],
  '⚠️ tres estados, no un sistema de puntuación');
ok(CARGAS.every((c) => c.icono && c.nombre),
  '🚨 cada uno con icono Y palabra: el color nunca va solo (EH F42)');
eq(cargaDelDia([], '2026-09-15', { tareas: [] }).id, 'libre', 'un día sin nada está libre');
eq(cargaDelDia([eventos[0]], HOY, { tareas: [] }).id, 'normal', 'con un elemento, un día normal');
eq(cargaDelDia(eventos, HOY, prod).id, 'ocupado', 'y con cinco, ocupado');
eq(cargaDelDia(eventos, HOY, prod).elementos, 5, 'y dice de cuántos elementos habla, sin inventarse una nota');

console.log('\n═══ 5. HOY SE NOTA, TAMBIÉN SELECCIONADO (apartado 4) ═══\n');

ok(MARCAS_DE_HOY.length >= 3,
  '⚠️ "no depender únicamente del color": al menos tres marcas distintas');
const hoySinSeleccion = marcaDeHoy(HOY, { hoy: HOY, seleccionado: '2026-09-10' });
ok(hoySinSeleccion.borde && hoySinSeleccion.negrita && hoySinSeleccion.punto,
  'hoy sin seleccionar lleva borde, negrita y marca');
const hoySeleccionado = marcaDeHoy(HOY, { hoy: HOY, seleccionado: HOY });
ok(!hoySeleccionado.borde, 'seleccionado, el borde sobra: el fondo ya es el acento');
ok(hoySeleccionado.negrita && hoySeleccionado.punto && hoySeleccionado.etiqueta === 'Hoy',
  '🐛 pero la negrita, la marca y la etiqueta SIGUEN ahí: antes hoy-y-seleccionado se veía igual que cualquier otro día tocado');
const otro = marcaDeHoy('2026-09-10', { hoy: HOY, seleccionado: '2026-09-10' });
ok(!otro.esHoy && !otro.punto && otro.etiqueta === null, 'y otro día seleccionado no se hace pasar por hoy');

console.log('\n═══ 6. CREAR DESDE EL CALENDARIO (apartados 16, 17 y 18) ═══\n');

eq(sePuedeCrear().map((x) => x.id), ['evento', 'tarea', 'recordatorio'],
  '⚠️ el ＋ ofrece las tres cosas del apartado 16');
eq(queSeCrea('recordatorio').entidad, 'calendario.eventos (tipo: recordatorio)',
  '🚨 un recordatorio NO es una entidad nueva: es un evento de ese tipo, que ya existía');
ok(TIPOS_EVENTO_CALENDARIO.some((t) => t.id === 'recordatorio'),
  '🐛 y se comprueba contra el catálogo de verdad: por eso la E3 F7 se equivocó al declararlo inexistente');
eq(queSeCrea('tarea').entidad, 'productividad.tareas',
  '🚨 y una tarea creada aquí es una TAREA DE PRODUCTIVIDAD, no una lista del calendario (apartado 31)');
eq(QUE_SE_PUEDE_CREAR.filter((x) => !x.existe).map((x) => x.id), ['pomodoro'],
  '⏸ el pomodoro programado no existe, y se declara');
ok(QUE_SE_PUEDE_CREAR.filter((x) => !x.existe).every((x) => x.porque),
  '⚠️ con su motivo escrito: fingirlo sería un botón muerto (regla 8)');
ok(sePuedeCrear().every((x) => x.comoSeCrea),
  '⚠️ y cada uno dice con qué función se crea de verdad');

const nueva = nuevaTareaDeCalendario('  Estudiar  ', '2026-09-29', '10:00');
eq([nueva.texto, nueva.fecha, nueva.hora, nueva.hecha], ['Estudiar', '2026-09-29', '10:00', false],
  '⚠️ la tarea nace con la forma de siempre: `{ id, texto, fecha, hora, hecha }`');
ok(nueva.id && !('origen' in nueva),
  '🚨 y SIN un campo `origen`: una tarea de segunda que el resto de la app no sabe leer es media entidad');
eq(nuevaTareaDeCalendario('Sin hora', '2026-09-29').hora, '',
  '⚠️ la hora es opcional (apartado 18)');
eq(nuevaTareaDeCalendario('Mala hora', '2026-09-29', '25:99').hora, '',
  '⚠️ y una hora imposible no se guarda: la FORMA no basta (la lección de EH F11)');
eq(nuevaTareaDeCalendario('   ', '2026-09-29'), null, 'una tarea sin texto no se crea');

console.log('\n═══ 7. VER AGENDA Y VER HOY (apartados 7, 24, 28 y 29) ═══\n');

eq(accesosDelDia(HOY, HOY).map((a) => a.id), ['hoy', 'agenda'],
  '⚠️ en el día de hoy salen los dos accesos');
eq(accesosDelDia('2026-09-20', HOY).map((a) => a.id), ['agenda'],
  '🚨 y en otro día, "Ver Hoy" NO sale: llevaría a un sitio que no es el que está mirando');
eq(accesosDelDia('2026-09-20', HOY)[0].vista, 'dia',
  '🚨 "Ver Agenda" abre la vista de día, que ya recibe la fecha seleccionada: no vuelve a hoy (apartados 7 y 24)');

console.log('\n═══ 8. RANGO, MES VACÍO Y LO QUE NO SE HACE (apartados 38, 39 y 41) ═══\n');

eq(rangoDelMes(2026, 8), { desde: '2026-09-01', hasta: '2026-09-30' },
  '⚠️ el rango es el mes pedido y nada más: "no cargar infinitos meses" (apartado 39)');
eq(rangoDelMes(2026, 1), { desde: '2026-02-01', hasta: '2026-02-28' }, 'y febrero sabe cuántos días tiene');

ok(!mesVacio(eventos, 2026, 8, prod), 'un mes con cosas no está vacío');
ok(mesVacio(eventos, 2026, 11, prod), 'y uno sin nada, sí');
ok(!mesVacio([], 2026, 9, prod),
  '🚨 un mes con SOLO una tarea tampoco está vacío: si no, el calendario diría "libre" con una tarea dentro');
eq([VACIO_MES.titulo, VACIO_MES.boton], ['Tu calendario está libre ✨', 'Añadir'],
  '⚠️ y sus textos son los del apartado 38');

ok(NO_EN_ESTA_FASE.length >= 6 && NO_EN_ESTA_FASE.every((x) => x.porque),
  '⚠️ lo que el apartado 41 excluye está escrito con su motivo, para que una fase futura no lo dé por pendiente');

console.log('\n═══ 9. NI UNA COPIA (apartados 30 y 31) ═══\n');

const LIB = sinComentarios(leer('src/lib/calendarioMes.js'));
for (const copia of ['calendar_tasks', 'calendar_events', 'DEFAULT_CALENDARIO_MES', 'normalizarCalendarioMes']) {
  ok(!new RegExp(copia, 'i').test(LIB), `🚨 no existe \`${copia}\`: el calendario es una representación (apartado 31)`);
}
ok(!/saveData|supabase/i.test(LIB),
  '🚨 esta capa no guarda nada: lee los eventos que le pasan y las tareas de su módulo');
ok(/tiposDelDia/.test(LIB),
  '⚠️ y reutiliza `tiposDelDia`, que ya hacía esto desde el Calendario Universal: no se reescribe');

const APP = sinComentarios(leer('src/App.jsx'));
ok(/onAddTarea=\{addTarea\}/.test(APP),
  '🚨 crear una tarea desde el Calendario llama a `addTarea`, LA MISMA de Productividad (apartados 30 y 31)');

console.log('\n═══ 10. EN LA PANTALLA ═══\n');

const VISTA = sinComentarios(leer('src/views/CalendarView.jsx'));
ok(/<FilaTarea/.test(VISTA), '🚨 las tareas se pintan en el panel del día');
ok(/onCompletar=\{onCompletarTarea\}/.test(VISTA),
  '🚨 y su casilla marca la tarea de verdad');
ok(/resumenDeDia\(/.test(VISTA) && !/resumen = resumenDelDia\(/.test(VISTA),
  '⚠️ el resumen del día es el que cuenta las tareas, no el viejo');
ok(/indicadoresDelDia\(/.test(VISTA), 'los puntos de la celda incluyen el de tarea');
ok(/marcaDeHoy\(/.test(VISTA), 'y hoy se marca con `marcaDeHoy`');
ok(/aria-current=\{marca\.esHoy \? 'date' : undefined\}/.test(VISTA),
  '⚠️ con `aria-current` para quien no ve el borde (apartado 37)');
ok(/<QueCreamos/.test(VISTA) && /<TareaRapida/.test(VISTA),
  '⚠️ el ＋ pregunta qué se crea, y la tarea rápida existe (apartados 16 y 18)');
ok(/VACIO_MES\.titulo/.test(VISTA), 'el mes vacío usa los textos del apartado 38');
ok(/accesosDelDia\(/.test(VISTA), 'y los accesos a Hoy y a la Agenda salen del catálogo');
// Apartado 10 — el botón Hoy, siempre.
const cabecera = VISTA.slice(VISTA.indexOf('tituloMes(cursor.anio'), VISTA.indexOf('tituloMes(cursor.anio') + 600);
ok(!/cursor\.mes === Number\(hoy/.test(cabecera),
  '🚨 el botón "Hoy" ya no depende de estar fuera del mes actual: "debe estar siempre accesible" (apartado 10)');
// 🚨 Los dos overlays nuevos van por createPortal (regla 3).
ok((VISTA.match(/createPortal\(/g) || []).length >= 5,
  '🚨 y los overlays nuevos van con `createPortal`, o se anclarían al contenedor de `.module-enter` (regla 3)');
// 🚨 `TextInput` reparte sus props: `onChange` recibe el EVENTO.
ok(!/onChange=\{set[A-Z]\w*\}/.test(VISTA),
  '🚨 ningún `onChange={setX}`: `TextInput` pasa el EVENTO, no el valor (la lección de EH F36/F37)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
