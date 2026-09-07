// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 28 (PR F6) — PRODUCTIVIDAD: RUTINAS
// ══════════════════════════════════════════════════════════════════════════
//
// Los veinticinco puntos del «CRITERIO DE ÉXITO», y sobre todo el fallo que la
// fase arregla: **la plantilla guardaba si el paso estaba hecho**, así que hacer
// la rutina el martes borraba lo del lunes y no quedaba historial de nada.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ICONOS_RUTINA, ICONO_RUTINA_POR_DEFECTO, CATEGORIAS_RUTINA, categoriaRutina,
  TIPOS_PASO, TIPO_PASO_POR_DEFECTO, tipoPaso, VINCULOS_PASO, vinculoPaso,
  crearPaso, normalizarPaso, PROGRAMACIONES, PROGRAMACION_POR_DEFECTO, programacion, reglaDeRutina,
  crearRutina, normalizarRutina, normalizarRutinas, normalizarRutinasDe,
  editarRutina, archivarRutina, anadirPaso, editarPaso, quitarPaso, moverPaso,
  duracionEstimada, textoDuracion, tocaHoy, proximaEjecucion,
  ESTADOS_EJECUCION, iniciarEjecucion, normalizarEjecucion, normalizarEjecuciones,
  estaPausada, duracionMs, textoDuracionEjecucion, pasoActual, progresoEjecucion,
  completarPaso, saltarPaso, irAPaso, pasoAnterior, pasoSiguiente,
  pausarEjecucion, reanudarEjecucion, todosLosPasosHechos,
  finalizarEjecucion, abandonarEjecucion, SALIDAS_EJECUCION,
  fechaDeEjecucion, historialDeRutina, ultimaEjecucion, estadisticasRutinas, rachaDeRutina,
  FILTROS_RUTINA, filtrarRutinas, VACIO_RUTINAS, CABECERA_RUTINAS, paraHoy,
  AISLAMIENTO_RUTINAS, condicionPR6,
} from '../src/lib/rutinas.js';
import { DEFAULT_PRODUCTIVIDAD } from '../src/tokens.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

/* 🐛 Quitar comentarios Y cadenas antes de preguntarle al código si HACE algo
   (la lección que la E3 F26 volvió a aprender dos veces en un turno). */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-09-07';   // lunes — ⚠️ y `diaDeLaSemana` es 0 = LUNES
// (la semana empieza el lunes, E3 F10), no la convención de `getDay()`.
const T0 = Date.parse('2026-09-07T08:00:00Z');
const MIN = 60000;

const LIB = leer('src/lib/rutinas.js');
const CODIGO = soloCodigo(LIB);

const conTresPasos = () => {
  let r = crearRutina({ nombre: 'Rutina de mañana', icono: '☀️', categoria: 'manana', hoy: HOY });
  r = anadirPaso(r, crearPaso({ texto: 'Levantarse', minutos: 2 }));
  r = anadirPaso(r, crearPaso({ texto: 'Beber agua', minutos: 5 }));
  r = anadirPaso(r, crearPaso({ texto: 'Estudiar', tipo: 'pomodoro', minutos: 25 }));
  return r;
};

console.log('\n── 1. 🚨 LA PLANTILLA NO GUARDA SI EL PASO ESTÁ HECHO ──────────');
const paso = crearPaso({ texto: 'Beber agua', minutos: 5 });
ok(!('hecho' in paso) && !('completado' in paso),
  '🚨 UN PASO NO TIENE `hecho`: era lo que hacía que la rutina de ayer y la de hoy fueran la misma casilla');
const vieja = normalizarPaso({ id: 'v', texto: 'Paso viejo', hecho: true });
ok(!('hecho' in vieja),
  '🚨 y el `hecho` de lo guardado en la Fase 6 SE VA al normalizar: la plantilla queda limpia');
eq(vieja.texto, 'Paso viejo', '⚠️ pero el texto se conserva: ni un campo se renombra (E3 F27)');
const rut = conTresPasos();
const ej0 = iniciarEjecucion(rut, { ahora: T0 });
const trasCompletar = completarPaso(ej0, { ahora: T0 + MIN });
ok(rut.pasos[0].texto === 'Levantarse' && !('completado' in rut.pasos[0]),
  '🚨 EJECUTAR NO TOCA LA PLANTILLA: es el apartado «DUPLICACIÓN» en código');
ok(trasCompletar.pasos[0].completado === true, 'lo hecho vive en la ejecución');
ok(!/rutina\.pasos\s*=|pasos\[\w+\]\.completado\s*=/.test(CODIGO), 'y nada muta la plantilla');

console.log('\n── 2. 🚨 EL HISTORIAL NO SE ROMPE AL EDITAR LA PLANTILLA ───────');
const renombrada = editarPaso(rut, rut.pasos[0].id, { texto: 'Levantarme temprano' });
eq(renombrada.pasos[0].texto, 'Levantarme temprano', 'se puede renombrar un paso');
eq(ej0.pasos[0].texto, 'Levantarse',
  '🚨 Y LA EJECUCIÓN YA GUARDADA SIGUE DICIENDO LO QUE PASÓ: *"las modificaciones futuras no deben destruir el historial pasado"*');
const sinPaso = quitarPaso(rut, rut.pasos[0].id);
eq(sinPaso.pasos.length, 2, 'y se puede borrar un paso');
eq(ej0.pasos.length, 3, '🚨 sin dejar huecos en el historial: la ejecución conserva sus tres');
ok(ej0.pasos[0].pasoId === rut.pasos[0].id,
  '⚠️ y guarda TAMBIÉN el id, que es lo que permite volver al paso vivo cuando siga existiendo');

console.log('\n── 3. Crear rutinas, pasos y su orden ──────────────────────────');
eq(crearRutina({ nombre: '  ', hoy: HOY }), null, 'sin nombre no hay rutina');
eq(crearRutina({ nombre: 'x', icono: '🦄', hoy: HOY }).icono, ICONO_RUTINA_POR_DEFECTO, 'un icono que no está en la lista cae en el de siempre');
eq(crearRutina({ nombre: 'x', categoria: 'inventada', hoy: HOY }).categoria, null, 'una categoría que no existe se descarta');
ok(CATEGORIAS_RUTINA.every((c) => 'modulo' in c), '⚠️ y cada categoría declara su módulo, o `null` en vez de inventárselo');
eq(crearPaso({ texto: ' ' }), null, 'un paso sin nombre no se crea');
eq(crearPaso({ texto: 'x', minutos: 0 }).minutos, 1, 'un paso de cero minutos no existe: mínimo uno');
eq(crearPaso({ texto: 'x' }).minutos, null, '⚠️ y sin minutos es `null`: la duración es OPCIONAL, no cero');
eq(TIPOS_PASO.map((t) => t.id), ['accion', 'tarea', 'pomodoro', 'descanso'], 'los cuatro tipos del enunciado');
ok(TIPOS_PASO.every((t) => 'abre' in t && t.explica),
  '⚠️ y cada uno declara A QUÉ MINI-APP ABRE: *"no crear una lógica duplicada"*');
eq(tipoPaso('pomodoro').abre, 'pomodoro', 'un paso de Pomodoro abre el Pomodoro que ya existe');
eq(tipoPaso('inventado'), null, 'un tipo que no existe no se acepta');
/* Reordenar: flechas, no arrastre. */
const movida = moverPaso(rut, rut.pasos[2].id, 'arriba');
eq(movida.pasos.map((p) => p.texto), ['Levantarse', 'Estudiar', 'Beber agua'], 'subir un paso lo sube');
eq(moverPaso(rut, rut.pasos[0].id, 'arriba'), null,
  '⚠️ y en el extremo devuelve `null`, para que la flecha se pueda apagar en vez de no hacer nada (regla 8)');
eq(moverPaso(rut, 'no_existe', 'abajo'), null, 'y un paso que no existe no mueve nada');
ok(!/onDragStart|draggable|dragEnd/i.test(soloCodigo(leer('src/views/ProductivityView.jsx'))),
  '🚨 SE REORDENA CON FLECHAS, NO ARRASTRANDO: las flechas funcionan con el lector de pantalla (EH F50)');

console.log('\n── 4. La duración estimada ─────────────────────────────────────');
eq(duracionEstimada(rut).minutos, 32, 'se suman los minutos de los pasos');
eq(textoDuracion(rut), '3 pasos · ~32 min', '*"5 pasos · ~25 min"*, el formato del enunciado');
eq(duracionEstimada(crearRutina({ nombre: 'x', hoy: HOY })), null,
  '🚨 SIN NI UN PASO CON DURACIÓN, `null`: un cero diría que la rutina no lleva tiempo, y lo que pasa es que no se sabe');
eq(textoDuracion(crearRutina({ nombre: 'x', hoy: HOY })), '0 pasos', 'y se dice solo lo que se sabe');
eq(textoDuracion(anadirPaso(crearRutina({ nombre: 'x', hoy: HOY }), crearPaso({ texto: 'p' }))), '1 paso',
  'con el singular bien escrito');
eq(duracionEstimada(anadirPaso(rut, crearPaso({ texto: 'Sin tiempo' }))).pasosSinTiempo, 1,
  '⚠️ y se sabe cuántos quedan fuera de la cuenta');

console.log('\n── 5. 🚨 La programación es una regla de `rachas.js` ────────────');
/* 🐛 **UNA COMPROBACIÓN QUE SE COMPARA CONSIGO MISMA NO PUEDE FALLAR NUNCA.**
   La primera versión de esta línea era `PROGRAMACIONES.map(...)` contra
   `PROGRAMACIONES.map(...)`: verde siempre, mirara lo que mirara. Es la lección
   de EH F42 —*"un revisor que no puede fallar no sirve"*— en una sola línea. */
eq(PROGRAMACIONES.map((p) => p.id), ['manual', 'diaria', 'dias', 'semanal'],
  'las cuatro opciones del enunciado, en su orden');
eq(PROGRAMACION_POR_DEFECTO, 'manual', 'y una rutina nace SIN programación: se inicia a mano');
eq(reglaDeRutina(rut), null, 'sin programación no hay regla');
const diaria = editarRutina(rut, { programacion: { tipo: 'diaria' } });
eq(reglaDeRutina(diaria).clase, 'diaria', 'la diaria es la clase `diaria` del motor');
const lxv = editarRutina(rut, { programacion: { tipo: 'dias', dias: [0, 2, 4], hora: '08:00' } });
eq(reglaDeRutina(lxv), { clase: 'dias_concretos', dias: [0, 2, 4] },
  '🚨 Y LOS DÍAS CONCRETOS SON `dias_concretos`, la clase que añadió la E3 F24: ni un motor nuevo');
ok(!/function tocaEseDia|function diaDeLaSemana/.test(CODIGO),
  '🚨 no se reescribe ni `tocaEseDia` ni `diaDeLaSemana`: se importan');
eq(tocaHoy(lxv, HOY), true, 'el lunes toca una rutina de L-X-V');
eq(tocaHoy(lxv, '2026-09-08'), false, 'y el martes no');
eq(tocaHoy(rut, HOY), false, 'una rutina sin programación no «toca» nunca: la inicia él');
eq(proximaEjecucion(rut, HOY).texto, 'Manual', '*"Manual"* si no está programada');
eq(proximaEjecucion(lxv, HOY).texto, 'Hoy · 08:00', '*"Próxima: Hoy · 08:00"*, literal del enunciado');
eq(proximaEjecucion(editarRutina(rut, { programacion: { tipo: 'dias', dias: [1] } }), HOY).texto, 'Mañana',
  '*"Próxima: Mañana"*');
eq(proximaEjecucion(editarRutina(rut, { programacion: { tipo: 'dias', dias: [] } }), HOY).texto, 'Sin días elegidos',
  '⚠️ y programada sin elegir ningún día se DICE, en vez de callar');
eq(normalizarRutina({ nombre: 'x', programacion: { tipo: 'dias', hora: '25:99' } }).programacion.hora, '',
  "🐛 `'25:99'` encaja con `\\d{2}:\\d{2}` y no es una hora (E3 F8)");
eq(normalizarRutina({ nombre: 'x', programacion: { tipo: 'dias', dias: [9, 2, -1] } }).programacion.dias, [2],
  '⚠️ y un día que no existe no se guarda');

console.log('\n── 6. La ejecución: instantes, nunca una cuenta atrás ──────────');
eq(iniciarEjecucion(crearRutina({ nombre: 'Vacía', hoy: HOY })), null,
  '⚠️ UNA RUTINA SIN PASOS NO SE EJECUTA: un flujo vacío sería una pantalla sin nada que hacer (regla 8)');
eq(ej0.estado, 'en_curso', 'la ejecución nace en curso');
eq(ej0.indice, 0, 'en el primer paso');
eq(pasoActual(ej0).texto, 'Levantarse', 'y sabe cuál es');
eq(progresoEjecucion(ej0).texto, '1 / 3', '*"Paso 2 de 5"* — el contador del enunciado');
eq(duracionMs(ej0, T0 + 10 * MIN), 10 * MIN, '🚨 el tiempo se RESTA de los instantes (E3 F25)');
const pausada = pausarEjecucion(ej0, T0 + 5 * MIN);
eq(duracionMs(pausada, T0 + 20 * MIN), 5 * MIN, '🚨 y pausada el reloj NO se mueve');
eq(estaPausada(pausada), true, 'y se sabe que está pausada');
const seguida = reanudarEjecucion(pausada, T0 + 20 * MIN);
eq(duracionMs(seguida, T0 + 25 * MIN), 10 * MIN, '⚠️ y al continuar se suma el rato parado, no se pierde');
eq(pausarEjecucion(pausada, T0), null, 'no se pausa dos veces');
eq(reanudarEjecucion(ej0, T0), null, 'ni se continúa lo que no está pausado');
ok(!/setInterval|setTimeout/.test(CODIGO),
  '🚨 NI UN TEMPORIZADOR EN LA LIBRERÍA: el tiempo se calcula, no se cuenta');

console.log('\n── 7. Avanzar, saltar y volver ─────────────────────────────────');
eq(progresoEjecucion(trasCompletar).hechos, 1, 'completar un paso lo cuenta');
eq(trasCompletar.indice, 1, 'y pasa al siguiente');
eq(pasoActual(trasCompletar).texto, 'Beber agua', 'que es el que toca');
const saltado = saltarPaso(trasCompletar, { ahora: T0 + 2 * MIN });
eq([saltado.pasos[1].saltado, saltado.pasos[1].completado], [true, false],
  '⚠️ SALTAR ES UNA TERCERA COSA: ni hecho ni pendiente (EH F14)');
eq(progresoEjecucion(saltado).hechos, 1, 'y no cuenta como hecho');
eq(progresoEjecucion(saltado).saltados, 1, 'pero se sabe que se saltó');
eq(pasoAnterior(trasCompletar).indice, 0, 'se puede volver atrás');
eq(pasoAnterior(ej0), null, 'y en el primero no hay atrás');
eq(pasoSiguiente(ej0).indice, 1, 'y adelante');
eq(irAPaso(ej0, 2).indice, 2, 'o saltar a uno concreto');
eq(irAPaso(ej0, 9), null, 'pero no a uno que no existe');
const todo = completarPaso(completarPaso(completarPaso(ej0, { ahora: T0 }), { ahora: T0 }), { ahora: T0 });
eq(todosLosPasosHechos(todo), true, 'cuando están todos, se sabe');
eq(todo.indice, 2, '⚠️ y el índice NO se sale de la lista al completar el último');
eq(todosLosPasosHechos(ej0), false, 'y a medias, no');

console.log('\n── 8. Salir sin perder nada (apartado «ABANDONAR») ─────────────');
eq(SALIDAS_EJECUCION.map((s) => s.id), ['continuar', 'guardar', 'salir'], 'las tres opciones del enunciado');
ok(SALIDAS_EJECUCION.every((s) => s.explica), '⚠️ y cada una explica qué pasa: ninguna pierde datos por sorpresa');
const abandonada = abandonarEjecucion(trasCompletar, { ahora: T0 + 3 * MIN });
eq(abandonada.estado, 'abandonada', 'salir la cierra como abandonada');
eq(abandonada.pasos[0].completado, true, '🚨 Y LO QUE YA HABÍA HECHO SE QUEDA: *"no perder accidentalmente una ejecución en curso"*');
const completada = finalizarEjecucion(todo, { ahora: T0 + 23 * MIN });
eq(completada.estado, 'completada', 'terminarla la marca completada');
eq(textoDuracionEjecucion(completada), '23 min', '*"25 min"* — la duración real, restando instantes');
eq(textoDuracionEjecucion({ ...completada, fin: T0 + 95 * MIN }), '1 h 35 min', 'y en horas cuando toca');
eq(ESTADOS_EJECUCION.map((e) => e.id), ['en_curso', 'completada', 'abandonada'], 'los tres estados');

console.log('\n── 9. Historial y estadísticas ─────────────────────────────────');
const ejs = [completada, abandonada, { ...completada, id: 'otra', rutinaId: 'otra_rutina' }];
eq(historialDeRutina(rut.id, ejs).length, 2, 'el historial es el de SU rutina');
ok(historialDeRutina(rut.id, [...ejs, ej0]).every((e) => e.estado !== 'en_curso'),
  '⚠️ y la que está en curso todavía no es historial');
const st = estadisticasRutinas(ejs, { rutinaId: rut.id });
eq([st.completadas, st.abandonadas], [1, 1], '*"Rutinas completadas 18"*');
eq(st.cumplimiento, 50, '*"Cumplimiento 82 %"*');
eq(estadisticasRutinas([]).cumplimiento, null,
  '🚨 SIN NI UNA EJECUCIÓN NO HAY CUMPLIMIENTO: un 0 % diría que lo hace mal cuando aún no la ha hecho (E3 F13)');
ok(st.tiempoTotal.includes('min'), '*"Tiempo total 7 h 35 min"*');
ok(!/guardarEstadistica|totalGuardado/.test(CODIGO),
  '🚨 y no se guarda ni una cifra: se cuenta en el momento (EH F35)');
ok(ultimaEjecucion(rut.id, ejs, HOY) !== null, '*"Última vez: Hoy"* sale del historial');
eq(ultimaEjecucion('nadie', ejs, HOY), null, 'y sin ejecuciones, `null`');

console.log('\n── 10. 🚨 La racha: del motor, y solo si hay programación ───────');
eq(rachaDeRutina(rut, ejs, HOY), null,
  '🚨 SIN PROGRAMACIÓN NO HAY RACHA: *"si la rutina no estaba programada para un día concreto, no penalizar"*');
const hecha = (fecha) => ({ ...completada, id: `e_${fecha}`, rutinaId: lxv.id, inicio: Date.parse(`${fecha}T08:00:00`), fin: Date.parse(`${fecha}T08:20:00`) });
const conRacha = rachaDeRutina(lxv, [hecha('2026-09-07'), hecha('2026-09-04'), hecha('2026-09-02')], HOY);
ok(conRacha && conRacha.actual >= 1,
  '🚨 Y CON L-X-V CUMPLIDO NO SE ROMPE EL MARTES: es `NO_TOCA`, el quinto estado de día de la E3 F24');
ok(!/function rachaActual|function historialDeRachas/.test(CODIGO),
  '🚨 ni un cálculo de racha propio: se llama a `resumenRacha` de `rachas.js`');
ok(/tipo: 'productivity'/.test(LIB) || /tipo: .productivity./.test(LIB),
  "⚠️ y la racha de una rutina tiene SU tipo, distinto del 'habits' de un hábito: *«son sistemas independientes»*");
ok(!/rachaDeHabito|habito\.historial/.test(CODIGO),
  '⚠️ y no toca nada de los hábitos: *"no romper la lógica de rachas de Hábitos"*');

console.log('\n── 11. Vínculos con Tareas, Pomodoro y Hábitos ────────────────');
eq(VINCULOS_PASO.map((v) => v.campo), ['tareaId', 'habitId'], 'los dos que pide el enunciado');
eq(vinculoPaso('tareaId').enlazable, true, 'la tarea SÍ se puede enlazar');
eq(vinculoPaso('habitId').enlazable, false,
  '⚠️ y el hábito se DECLARA sin construirse: *"no es obligatorio implementar la vinculación visual completa"* (regla 8)');
ok(vinculoPaso('habitId').porque && vinculoPaso('habitId').llega, 'con por qué y cuándo llegará');
eq(crearPaso({ texto: 'Estudiar biología', tipo: 'tarea', tareaId: 't1' }).tareaId, 't1',
  '⚠️ un paso guarda el ID de la tarea: *"No duplicar la tarea"*');
ok(!/texto:\s*tarea\.texto|nombre:\s*tarea\./.test(CODIGO), 'y no copia ni su texto');
eq(normalizarPaso({ texto: 'x' }).habitId, null, 'y el campo del hábito existe, vacío');
ok(!/duracionMs:|iniciarSesion\(/.test(CODIGO),
  '🚨 NI UN SEGUNDO TEMPORIZADOR: un paso de Pomodoro dice a qué mini-app abre, no lo cronometra');

console.log('\n── 12. Archivar, filtros y vacío ───────────────────────────────');
eq(archivarRutina(rut).archivada, true, 'se puede archivar');
eq(archivarRutina(archivarRutina(rut)).archivada, false, 'y desarchivar');
eq(filtrarRutinas([rut, archivarRutina(rut)], 'activas').length, 1, '⚠️ lo archivado NO sale en activas (E3 F18)');
eq(filtrarRutinas([rut, archivarRutina(rut)], 'archivadas').length, 1, 'y sale entero en su filtro');
eq(filtrarRutinas([rut, lxv], 'programadas').length, 1, 'y las programadas se pueden ver aparte');
eq(FILTROS_RUTINA.map((f) => f.id), ['activas', 'programadas', 'archivadas', 'todas'], 'los cuatro filtros');
ok(VACIO_RUTINAS.titulo === 'Crea tu primera rutina' && VACIO_RUTINAS.accion,
  '*"Crea tu primera rutina"*, con su salida (EH F41)');
ok(VACIO_RUTINAS.texto.includes('flujo'), 'y la frase literal del enunciado');
eq(CABECERA_RUTINAS.frase, 'Convierte tus acciones en rutina.', 'y la cabecera');
ok(CABECERA_RUTINAS.frase !== 'Organiza lo que tienes que hacer.',
  '🚨 y NO dice lo mismo que Tareas: cada mini-app tiene su identidad');

console.log('\n── 13. Lo que Hoy podrá pedir ──────────────────────────────────');
const ph = paraHoy([lxv], [], HOY);
eq(ph.pendientes, 1, 'las rutinas que tocan hoy y no se han hecho');
eq(ph.linea, 'Rutina de mañana · 08:00', '*"Rutina de mañana · 08:00"*, literal del enunciado');
eq(paraHoy([lxv], [hecha(HOY)], HOY).pendientes, 0, '⚠️ y la que ya hizo hoy deja de estar pendiente');
eq(paraHoy([lxv], [hecha(HOY)], HOY).linea, null, 'sin inventar una frase');
eq(paraHoy([rut], [], HOY).pendientes, 0, 'una rutina sin programación no está «pendiente»: la inicia él');
eq(paraHoy([archivarRutina(lxv)], [], HOY).pendientes, 0, 'ni una archivada');
ok(!/today_|rehacerHoy/.test(CODIGO), '🚨 y NO se rehace Hoy: esto es la línea que Hoy podrá pintar');

console.log('\n── 14. Normalizadores y persistencia ───────────────────────────');
eq(normalizarRutina(null), null, 'lo que no es una rutina se descarta');
eq(normalizarRutina({ nombre: '' }), null, 'y lo que no tiene nombre');
ok(normalizarRutina({ nombre: 'x' }).id, 'a lo que no tiene id se le pone uno');
eq(normalizarRutinas([null, { nombre: '' }, { nombre: 'Vale' }]).length, 1, 'y la lista se limpia');
eq(normalizarEjecucion({ rutinaId: 'r', pasos: [] }), null, 'una ejecución sin pasos no existe');
eq(normalizarEjecucion({ pasos: [{ texto: 'x' }] }), null, 'ni una sin rutina');
eq(normalizarEjecucion({ rutinaId: 'r', indice: 99, pasos: [{ texto: 'x' }] }).indice, 0,
  '⚠️ y un índice fuera de la lista se recorta: si no, la pantalla pintaría un paso que no existe');
const prodEntera = normalizarRutinasDe({
  rutinas: [rut], habitos: [{ id: 'h' }], tareas: [{ id: 't', texto: 'T' }], metas: [{ id: 'm', nombre: 'M' }],
});
eq([prodEntera.habitos.length, prodEntera.tareas.length, prodEntera.metas.length], [1, 1, 1],
  '🚨 `normalizarRutinasDe` DEVUELVE EL OBJETO ENTERO: perder una clave aquí borraría los hábitos (regla 5)');
eq(prodEntera.rutinaEjecuciones, [], 'y crea las listas nuevas si no estaban');
eq(normalizarRutinasDe(null), null, 'y aguanta que no le den nada');
ok('rutinaEjecuciones' in DEFAULT_PRODUCTIVIDAD && 'rutinaEnCurso' in DEFAULT_PRODUCTIVIDAD,
  '⚠️ y los dos campos nuevos están en el default: `loadData` no fusiona (regla 5)');

console.log('\n── 15. La pantalla y sus manejadores ───────────────────────────');
const vista = leer('src/views/ProductivityView.jsx');
const app = leer('src/App.jsx');
ok(/onCambiarEjecucionRutina,/.test(vista) && /onRegistrarEjecucionRutina,/.test(vista),
  '🚨 los dos manejadores están DECLARADOS: uno usado y no declarado deja la pantalla en blanco (E3 F17)');
ok(/const cambiarEjecucionRutina = /.test(app) && /onCambiarEjecucionRutina=\{cambiarEjecucionRutina\}/.test(app),
  '🚨 Y ALGUIEN LOS LLAMA: una función que nadie llama no falla nunca (E3 F1 y F5)');
ok(/rutinaEjecuciones: \[\.\.\.\(productividad\.rutinaEjecuciones \|\| \[\]\), ejecucion\],[\s\S]{0,80}rutinaEnCurso: null/.test(app),
  '🚨 y registrar la ejecución y limpiar la en curso van en UNA SOLA escritura: dos seguidas se pisan (E3 F26)');
ok(/normalizarRutinasDe\(/.test(app), '🚨 y el normalizador corre AL CARGAR (regla 5)');
const bloque = vista.slice(vista.indexOf('/* ---------- Rutinas (E3 F28'), vista.indexOf('/* ---------- Pomodoro'));
eq([...bloque.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*\{?\s*<(Play|Pause|Trash2|ChevronUp|ChevronDown|Plus|Pencil|CheckCircle2|Archive)\b/g)].length, 0,
  '🚨 ni un botón de solo icono sin `aria-label` (EH F42)');
ok(/toque-44/.test(bloque), 'y las zonas de toque usan la clase de 44 px');
ok(!/#[0-9a-fA-F]{6}/.test(bloque), '🚨 ni un hex suelto: los colores son de `COLORS` (regla 2)');
ok(/aria-pressed/.test(bloque), 'y los selectores dicen cuál está elegido');
ok(!/Fase \d|apartado \d|próximamente/i.test([...bloque.matchAll(/>([^<>{}]{6,})</g)].map((m) => m[1]).join(' ')),
  '⚠️ regla 9: ni una nota interna de desarrollo en lo que ve Josué');
ok(/rutina-fin/.test(leer('src/index.css')) && /rutina-fin/.test(leer('src/lib/pulidoHC.js')),
  '⚠️ la animación de finalizar existe en el CSS Y está en el catálogo: uno declarado y no escrito es un catálogo que miente (E3 F14)');

console.log('\n── 16. Papelera, aislamiento y lo que no se hace ───────────────');
ok(/'productividad\.rutinas'/.test(leer('src/lib/papelera.js')), 'las rutinas están en el catálogo de la papelera');
ok(/eliminarConPapelera\('productividad', 'rutinas', id\)/.test(app), 'y borrar pasa por la única puerta (ME F3)');
eq(AISLAMIENTO_RUTINAS.politica, 'auth.uid() = user_id', '🚨 el aislamiento es de la base de datos (EH F43)');
eq(AISLAMIENTO_RUTINAS.listas.length, 3, 'y la plantilla, el historial y la que corre son tres listas');
ok(AISLAMIENTO_RUTINAS.porQueNoHayTablas.includes('app_data'),
  '⚠️ y está escrito por qué no hay cuatro tablas: no existe una base relacional donde ponerlas');
ok(!/askAI|anthropic/i.test(CODIGO), '⚠️ ni IA en esta fase');
ok(!/\bXP\b|recompensa|moneda/i.test(CODIGO), '⚠️ ni gamificación (D2-02)');
ok(!/new Notification|notificarSiCorresponde/.test(CODIGO),
  '⚠️ ni notificaciones: *"solo guardar correctamente la programación"*');
ok(!/crearHabito|crearMeta|crearObjetivo/.test(CODIGO), '⚠️ y no se toca ninguna otra mini-app');

console.log('\n── 17. Condición de finalización (calculada) ───────────────────');
const cond = condicionPR6({ rutinas: [rut], ejecuciones: ejs, hoy: HOY });
eq(cond.length, 25, 'los veinticinco puntos del criterio de éxito');
eq(cond.filter((c) => !c.ok).map((c) => c.texto), [], '🚨 y ninguno rojo — se calculan, no se ponen a mano');
ok(cond.find((c) => c.id === 20).texto.includes('NO se duplica'), 'el 20 es el del apartado «DUPLICACIÓN»');
ok(cond.find((c) => c.id === 21).texto.includes('independiente'), 'y el 21, el del historial');

console.log(`\n${'═'.repeat(70)}`);
if (fallos.length) {
  console.log(`✗ ${fallos.length} FALLOS de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F28 (PR F6) · Rutinas`);
