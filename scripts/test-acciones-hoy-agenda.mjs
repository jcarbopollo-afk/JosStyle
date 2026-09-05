// ============================================================================
// ENTREGA 3 · FASE 9 (HC F4) — ACCIONES RÁPIDAS ENTRE HOY, AGENDA Y CALENDARIO
//
// 🚨 **La condición que más se puede romper es la 17/18:** *"no haya
// duplicaciones… exista una única fuente de verdad"*. Y el apartado 30 lo dice
// en componentes: *"no duplicar formularios"*.
//
// 🐛 **Y esta fase empezó rompiendo otra cosa:** el archivo se llamó primero
// `accionesRapidas.js` y **ese nombre ya era de EH F61**, que está congelado.
// Escribirlo encima se llevó 310 líneas suyas. La lección de siempre —*antes de
// llamar a algo, mirar si ese nombre ya significa otra cosa*— esta vez sobre un
// FICHERO.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_QUICKADD, tipoQuickAdd, opcionesDeAdd, contextoDeAdd, horaParaTipo,
  ACCIONES_ELEMENTO, accionesDe,
  validarTarea, validarEvento, validarApunte,
  tareaEnFecha, tareaEnHora,
  AVISOS_ACCION, avisoDe, SEGUNDOS_AVISO,
  eventoDesdeQuickAdd, YA_RESUELTO, NO_EN_ESTA_FASE, CONFLICTO_ENTRE_DISPOSITIVOS,
} from '../src/lib/accionesHoyAgenda.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Bloques primero, llaves vacías después (la lección de la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

const HOY = '2026-09-05';
const OTRO = '2026-09-15';

console.log('\n═══ 1. UN SOLO ＋, Y SUS CUATRO COSAS (apartados 1 y 30) ═══\n');

eq(TIPOS_QUICKADD.filter((t) => t.existe).map((t) => t.id), ['tarea', 'evento', 'recordatorio', 'apunte'],
  '⚠️ las cuatro opciones del apartado 1, y las cuatro existen de verdad');
ok(TIPOS_QUICKADD.filter((t) => t.existe).every((t) => t.escribeEn),
  '🚨 cada una dice EN QUÉ ENTIDAD escribe: ni una lista nueva del ＋ (apartados 17 y 18)');
eq(tipoQuickAdd('tarea').escribeEn, 'productividad.tareas', 'la tarea va a Productividad');
eq(tipoQuickAdd('recordatorio').escribeEn, 'calendario.eventos (tipo: recordatorio)',
  '🚨 y un recordatorio es un evento de ese tipo, no una entidad aparte (la corrección de la E3 F8)');
eq(TIPOS_QUICKADD.filter((t) => !t.existe).map((t) => t.id), [],
  '⏸ y no hay ninguna fingida: *"no añadir funcionalidades que todavía no estén implementadas"*');

console.log('\n═══ 2. EL CONTEXTO DE FECHA Y HORA (apartados 2, 3, 4 y 26) ═══\n');

const desdeHoy = contextoDeAdd('hoy', { hoy: HOY });
eq(desdeHoy.fecha, HOY,
  '🚨 desde Hoy la fecha ES hoy: *"no obligar a seleccionar nuevamente la fecha"* (apartado 2)');

const desdeAgenda = contextoDeAdd('agenda', { fecha: OTRO, hora: '16:00', hoy: HOY });
eq(desdeAgenda.fecha, OTRO,
  '🚨 desde la Agenda la fecha es EL DÍA QUE SE ESTÁ VIENDO, no hoy (apartado 3)');
eq(desdeAgenda.hora, '16:00', '⚠️ y la hora seleccionada viene puesta (apartados 3 y 26)');

eq(horaParaTipo(desdeAgenda, 'tarea'), '16:00', 'la tarea la recibe');
eq(horaParaTipo(desdeAgenda, 'apunte'), '',
  '⚠️ pero el apunte NO: *"cuando corresponda"* — un apunte no tiene hora');

eq(contextoDeAdd('agenda', { fecha: OTRO, hora: '25:99', hoy: HOY }).hora, '',
  '🐛 y una hora imposible no se propaga: la forma no basta (tercera vez)');

// ⏸ El apunte solo donde el día es hoy.
eq(opcionesDeAdd('agenda', OTRO, HOY).map((t) => t.id), ['tarea', 'evento', 'recordatorio'],
  '⏸ en un día que no es hoy no se ofrece el apunte: un apunte es de HOY (E3 F6)');
ok(opcionesDeAdd('agenda', HOY, HOY).some((t) => t.id === 'apunte'),
  '⚠️ y en el día de hoy sí');
ok(!opcionesDeAdd('calendario', HOY, HOY).some((t) => t.id === 'apunte'),
  '⚠️ desde el Calendario tampoco: allí se está mirando un mes, no un día suelto');

console.log('\n═══ 3. LAS ACCIONES DE CADA ELEMENTO (apartado 8) ═══\n');

const deTarea = accionesDe({ tipo: 'tarea', titulo: 'X' }).map((a) => a.id);
eq(deTarea, ['completar', 'editar', 'fecha', 'hora', 'eliminar'],
  '⚠️ una tarea: las cinco del ejemplo del enunciado');
const deEvento = accionesDe({ tipo: 'evento', titulo: 'X' }).map((a) => a.id);
ok(!deEvento.includes('completar'),
  '🚨 un evento NO se completa: un evento ocurre (E3 F7, apartado 6) — *"no mostrar opciones inútiles"*');
eq(deEvento, ['editar', 'fecha', 'hora', 'eliminar'], 'y las suyas son cuatro');
eq(accionesDe({ tipo: 'apunte', titulo: 'X' }).map((a) => a.id), ['eliminar'],
  '⚠️ un apunte solo se elimina: no tiene hora y no se completa');
eq(accionesDe({ tipo: 'evento', soloLectura: true }), [],
  '🚨 y un elemento derivado de otro módulo no se toca desde aquí: se abre su módulo');
eq(accionesDe(null), [], 'sin elemento no revienta');

eq(ACCIONES_ELEMENTO.filter((a) => a.destructiva).map((a) => a.id), ['eliminar'],
  '⚠️ solo eliminar es destructiva: un aviso delante de cada toque enseña a no leerlos (EH F61)');

console.log('\n═══ 4. VALIDACIONES (apartado 32) ═══\n');

eq(validarTarea({ texto: 'Estudiar', fecha: HOY, hora: '16:00' }), null, 'una tarea correcta pasa');
ok(/título/i.test(validarTarea({ texto: '  ', fecha: HOY })),
  '🚨 título obligatorio, y el error dice QUÉ CORREGIR, nunca "Error" a secas (EH F62)');
ok(/fecha/i.test(validarTarea({ texto: 'X', fecha: '2026-13-45' })), 'una fecha imposible no pasa');
ok(/hora/i.test(validarTarea({ texto: 'X', fecha: HOY, hora: '25:99' })),
  '🐛 y una hora imposible tampoco: la forma no basta');

eq(validarEvento({ titulo: 'Entreno', fecha: HOY, horaInicio: '17:00', horaFin: '18:00' }), null,
  'un evento correcto pasa');
ok(/anterior a la de inicio/i.test(validarEvento({ titulo: 'X', fecha: HOY, horaInicio: '18:00', horaFin: '17:00' })),
  '🚨 el caso que nombra el enunciado: la hora de fin no puede ser anterior a la de inicio');
eq(validarEvento({ titulo: 'X', fecha: HOY, todoElDia: true }), null,
  '⚠️ un evento de todo el día no tiene horas que comparar');
eq(validarEvento({ titulo: 'X', fecha: HOY, horaInicio: '17:00', horaFin: '' }), null,
  '⚠️ y la hora de fin es opcional');
ok(/algo/i.test(validarApunte({ texto: '' })), 'un apunte vacío no se guarda');

console.log('\n═══ 5. CAMBIAR FECHA Y HORA (apartados 11 y 12) ═══\n');

const tarea = { id: 't1', texto: 'Estudiar', fecha: HOY, hora: '10:00', hecha: false };
eq(tareaEnFecha(tarea, OTRO).fecha, OTRO, 'cambiar la fecha devuelve la tarea con la nueva');
eq(tareaEnFecha(tarea, OTRO).id, 't1',
  '🚨 y es LA MISMA tarea (mismo id): por eso desaparece de Hoy sola, sin programarlo (apartado 11)');
eq(tareaEnFecha(tarea, '2026-13-45'), null,
  '⚠️ una fecha imposible devuelve `null`: no se escribe una mentira');
eq(tareaEnHora(tarea, '18:30').hora, '18:30', 'cambiar la hora, igual');
eq(tareaEnHora(tarea, '').hora, '',
  '⚠️ y QUITAR la hora es una operación válida: la tarea pasa a "Sin hora" (E3 F7)');
eq(tareaEnHora(tarea, '25:99'), null, 'pero una hora imposible, no');
ok(tareaEnFecha(tarea, OTRO) !== tarea && tarea.fecha === HOY,
  '⚠️ y no se muta la original: se devuelve una copia con el campo cambiado');

console.log('\n═══ 6. EL AVISO PEQUEÑO Y DESHACER (apartados 14 y 19) ═══\n');

eq(avisoDe('tarea_creada').texto, 'Tarea añadida', '⚠️ el texto del apartado 19');
eq(avisoDe('eliminado').deshacer, true,
  '🚨 un borrado ofrece Deshacer: *"elemento eliminado · Deshacer"* (apartado 14)');
eq(avisoDe('tarea_creada').deshacer, false,
  '⚠️ y una creación no lo necesita: el elemento se ve y se puede borrar');
ok(SEGUNDOS_AVISO >= 4 && SEGUNDOS_AVISO <= 10,
  '⚠️ *"mostrar brevemente"*, con tiempo de leerlo y pulsar con el pulgar');
ok(Object.values(AVISOS_ACCION).every((a) => a.texto && !/error/i.test(a.texto)),
  '⚠️ ningún aviso dice "Error" a secas');
eq(avisoDe('inventado'), null, 'un aviso que no existe no se inventa');

console.log('\n═══ 7. LA FÁBRICA DE UN EVENTO RÁPIDO (apartado 5) ═══\n');

const ev = eventoDesdeQuickAdd({ titulo: '  Entreno  ', fecha: HOY, horaInicio: '17:00', horaFin: '18:00' });
eq(ev.titulo, 'Entreno', 'el título se limpia');
eq(ev.origen, 'calendario',
  '🚨 y nace con `origen: calendario`: sin eso saldría como derivado y de solo lectura');
ok('recurrencia' in ev && 'ubicacion' in ev && 'notas' in ev && 'estado' in ev,
  '🚨 con TODOS sus campos: un evento a medias lo recorta el normalizador en el siguiente guardado (regla 5)');
eq(eventoDesdeQuickAdd({ titulo: '', fecha: HOY }), null, 'sin título no se crea');
eq(eventoDesdeQuickAdd({ titulo: 'X', fecha: HOY, horaInicio: '18:00', horaFin: '17:00' }), null,
  '⚠️ y con las horas al revés tampoco: la validación es la misma');
eq(eventoDesdeQuickAdd({ titulo: 'Pastilla', fecha: HOY, horaInicio: '08:00', tipo: 'recordatorio' }).tipo, 'recordatorio',
  '⚠️ un recordatorio es un evento con su tipo');

console.log('\n═══ 8. LO QUE YA ESTABA, Y NO SE REHACE ═══\n');

ok(YA_RESUELTO.length >= 6 && YA_RESUELTO.every((x) => x.apartado && x.con),
  '⚠️ los apartados que ya funcionaban se declaran CON la función real que los resuelve');
ok(YA_RESUELTO.some((x) => x.apartado === 10 && /toggleTarea/.test(x.con)),
  '🚨 completar ya se sincronizaba: es la misma tarea, no hay copia (apartados 10 y 18)');
ok(YA_RESUELTO.some((x) => x.apartado === 13 && /eliminarConPapelera/.test(x.con)),
  '🚨 y eliminar pasa por la única puerta de borrado (ME F3)');
ok(NO_EN_ESTA_FASE.length >= 5 && NO_EN_ESTA_FASE.every((x) => x.porque),
  '⚠️ y lo que el apartado 37 excluye está escrito con su motivo');
eq(CONFLICTO_ENTRE_DISPOSITIVOS.detectable, false,
  '🚨 el apartado 23 SIGUE sin poder cumplirse del todo, y se dice: el último en escribir gana');
ok(CONFLICTO_ENTRE_DISPOSITIVOS.loQueSeHace,
  '⚠️ con lo que sí se hace: cada acción toca un elemento, nunca reescribe el módulo entero');

console.log('\n═══ 9. NI UN FORMULARIO DUPLICADO (apartados 30 y 31) ═══\n');

const VISTA_CAL = sinComentarios(leer('src/views/CalendarView.jsx'));
const VISTA_HOY = sinComentarios(leer('src/views/DashboardView.jsx'));
const QUICK = leer('src/components/quickAdd.jsx');
/* 🐛 Para buscar USOS hay que quitar los comentarios: la cabecera de
   `quickAdd.jsx` explica el fallo de `onChange={setTexto}` **escribiéndolo**, y
   el barrido saltaba con la frase que lo previene. Duodécima vez. */
const QUICK_CODIGO = sinComentarios(QUICK);

ok(!/function QueCreamos|function TareaRapida/.test(VISTA_CAL),
  '🚨 el selector y la tarea rápida YA NO viven en `CalendarView`: se sacaron a `quickAdd.jsx` (apartado 30)');
for (const [nombre, texto] of [['el Calendario', VISTA_CAL], ['Hoy', VISTA_HOY]]) {
  ok(/<QuickAdd/.test(texto), `⚠️ ${nombre} usa el ＋ compartido`);
}
ok(/<FormularioTarea/.test(VISTA_CAL) && /<FormularioTarea/.test(VISTA_HOY),
  '⚠️ y los dos el mismo formulario de tarea');
ok(/<FormularioApunte/.test(VISTA_HOY) && !/<FormularioApunte/.test(VISTA_CAL),
  '⏸ el apunte solo en Hoy, que es donde tiene sentido');

// 🚨 Los overlays van por portal (regla 3) y `onChange` recibe el EVENTO.
ok((QUICK.match(/createPortal\(/g) || []).length >= 2,
  '🚨 los overlays de `quickAdd.jsx` van con `createPortal` (regla 3)');
ok(!/onChange=\{set[A-Z]\w*\}/.test(QUICK_CODIGO),
  '🚨 ningún `onChange={setX}`: `TextInput` pasa el EVENTO, no el valor (EH F36/F37)');
ok(/Escape/.test(QUICK), '⚠️ y Escape cierra la hoja (apartado 36)');
ok(/aria-modal/.test(QUICK) && /role="dialog"/.test(QUICK),
  '⚠️ con su papel de diálogo para el lector de pantalla (apartado 36)');
ok(/role="status"/.test(QUICK) && /aria-live/.test(QUICK),
  '⚠️ y el aviso se anuncia, no solo se ve');

console.log('\n═══ 10. UNA SOLA FUENTE DE VERDAD (apartados 10, 17, 18 y 29) ═══\n');

const APP = sinComentarios(leer('src/App.jsx'));
ok(/onAddTarea=\{\(t\) => addTarea\(nuevaTareaDeCalendario/.test(APP),
  '🚨 el ＋ de Hoy escribe una TAREA DE PRODUCTIVIDAD con `addTarea` (apartados 18 y 28)');
ok(/onAddEvento=\{\(ev\) => addEvento\(eventoDesdeQuickAdd/.test(APP),
  '🚨 y un evento con `addEvento`, el de siempre');
ok(/onDeleteTarea=\{deleteTarea\}/.test(APP),
  '🚨 eliminar desde el Calendario pasa por `deleteTarea` → `eliminarConPapelera` (apartado 13)');
ok(/onDeshacer=\{undo\}/.test(APP),
  '🚨 y Deshacer es el histórico de diez pasos que YA existía: ni una segunda pila (apartado 14)');

const LIB = sinComentarios(leer('src/lib/accionesHoyAgenda.js'));
/* ⚠️ Se busca la LLAMADA y el IMPORT, no la palabra: `YA_RESUELTO` NOMBRA
   `saveData` y Supabase para decir quién sincroniza, y eso es una declaración,
   no una escritura. Decimotercera vez de esta lección. */
ok(!/saveData\(|supabase\.|from '\.\/supabase/i.test(LIB),
  '🚨 esta capa decide y valida; quien escribe sigue siendo `App.jsx`');
for (const copia of ['quick_items', 'acciones_guardadas', 'DEFAULT_ACCIONES', 'normalizarAcciones']) {
  ok(!new RegExp(copia, 'i').test(LIB), `🚨 no existe \`${copia}\`: ni un almacén propio`);
}

// 🐛 El fichero de EH F61 sigue entero.
const EH61 = leer('src/lib/accionesRapidas.js');
ok(/EH · Fase 61\/65/.test(EH61) && /ACCIONES_POR_ELEMENTO/.test(EH61),
  '🐛 `accionesRapidas.js` SIGUE siendo el de EH F61: esta fase no le pisó el nombre (se llama `accionesHoyAgenda.js`)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
