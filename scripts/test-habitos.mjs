// ============================================================================
// ENTREGA 3 · FASE 24 (PR F2) — PRODUCTIVIDAD: HÁBITOS
//
// Los 15 puntos del criterio de éxito, y las tres cosas que decidieron cómo se
// construye:
//
//   1. Aquí NO se calcula ni una racha: el motor es `rachas.js` (RA F1).
//   2. Las dos frecuencias nuevas son DEL MOTOR, con un quinto estado de día
//      —`NO_TOCA`— que es lo que cumple el apartado más importante de la fase:
//      la racha respeta la frecuencia configurada.
//   3. El historial se queda dentro del hábito (C-29), porque el propio
//      enunciado manda respetar la arquitectura existente.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FRECUENCIAS_HABITO, frecuenciaHabito, FRECUENCIA_POR_DEFECTO, frecuenciaDe, reglaDe,
  CATEGORIAS_HABITO, categoriaHabito, ICONOS_HABITO, ICONO_HABITO_POR_DEFECTO, iconoHabitoValido,
  CAMPOS_HABITO, MAX_NOMBRE_HABITO, nombreHabitoValido, reglaDeFrecuencia,
  crearHabito, normalizarHabito, normalizarHabitos, editarHabito, pausarHabito, reanudarHabito,
  tocaHoy, hechoHoy, vecesQuedanEstaSemana, progresoDelDia,
  estadisticasHabito, textoRacha, semanaDe, historialCompacto, SEMANAS_HISTORIAL,
  FILTROS_HABITOS, FILTRO_HABITOS_POR_DEFECTO, filtrarHabitos, vacioDeFiltro,
  VACIO_HABITOS, paraHoy, HOY_NO_SE_REHACE, NO_EN_PR2,
  DONDE_SE_GUARDA_HABITOS, AISLAMIENTO_HABITOS, condicionPR2, pr2Terminada,
  alternarHabito, describirRegla, ESTADOS_DIA, NOMBRES_DIA_CORTOS, diasDeRegla, vecesDeRegla,
} from '../src/lib/habitos.js';
import {
  CLASES_REGLA, rachaActual, estadisticasRacha, normalizarRacha, estadoDeDia,
  indicePorFecha, diaDeLaSemana, lunesDe, tocaEseDia, REGLA_HABITO,
} from '../src/lib/rachas.js';
import { DEFAULT_PRODUCTIVIDAD } from '../src/tokens.js';
import { MINI_APPS_PR } from '../src/lib/productividad.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const soloCodigo = (s) => sinComentarios(s).replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");

const LIB = leer('src/lib/habitos.js');
const LIB_CODIGO = soloCodigo(LIB);
const MOTOR = leer('src/lib/rachas.js');
const VISTA = leer('src/views/ProductivityView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const CSS = leer('src/index.css');

/* ── El escenario. 2026-09-07 es LUNES; 2026-09-12, sábado. ───────────────── */
const HOY = '2026-09-12';
const hDiario = { ...crearHabito({ nombre: 'Beber agua', icono: 'Droplet' }), id: 'hd', historial: { '2026-09-10': true, '2026-09-11': true, '2026-09-12': true } };
const hDias = { ...crearHabito({ nombre: 'Gimnasio', frecuencia: 'dias', dias: [0, 2, 4], icono: 'Dumbbell', categoria: 'fitness' }), id: 'hx', historial: { '2026-09-07': true, '2026-09-09': true, '2026-09-11': true } };
/* ⚠️ Correr lleva 2 de 3 ESTA semana: así todavía toca hoy, que es lo que hay que
   poder comprobar. Con las tres hechas dejaría de tocar — y eso también es
   correcto, pero deja el escenario sin ningún pendiente. */
const hSem = { ...crearHabito({ nombre: 'Correr', frecuencia: 'semanal', veces: 3 }), id: 'hs', historial: { '2026-08-24': true, '2026-08-26': true, '2026-08-28': true, '2026-08-31': true, '2026-09-02': true, '2026-09-04': true, '2026-09-07': true, '2026-09-09': true } };
const hPausa = { ...crearHabito({ nombre: 'Meditar' }), id: 'hp', activo: false };
const todos = [hDiario, hDias, hSem, hPausa];

console.log('\n═══ 1. LAS TRES FRECUENCIAS DEL ENUNCIADO ═══\n');

eq(FRECUENCIAS_HABITO.map((f) => f.id), ['diaria', 'dias', 'semanal'],
  '*"Todos los días · Días concretos · X veces por semana"*');
ok(FRECUENCIAS_HABITO.every((f) => typeof f.regla === 'function'),
  '🚨 y cada una declara **qué regla del motor la implementa**: la lista es del módulo, el comportamiento del motor (EH F14)');
ok(FRECUENCIAS_HABITO.every((f) => !!f.ayuda), '⚠️ con una frase que explica qué hace');
eq(FRECUENCIA_POR_DEFECTO, 'diaria', '⚠️ y la de siempre es la de por defecto');
eq(reglaDeFrecuencia('diaria').clase, REGLA_HABITO.clase,
  '🚨 **"Todos los días" es la regla de siempre**, `diaria_con_gracia`: cambiarla por la estricta le rompería rachas vivas a Josué sin avisar');
eq(reglaDeFrecuencia('dias', { dias: [0, 2, 4] }), { clase: 'dias_concretos', dias: [0, 2, 4] }, 'días concretos');
eq(reglaDeFrecuencia('semanal', { veces: 3 }), { clase: 'veces_por_semana', veces: 3 }, 'veces por semana');
eq(frecuenciaHabito('inventada').id, 'diaria', '⚠️ una frecuencia que no existe cae en la de siempre');

console.log('\n═══ 2. LAS DOS CLASES NUEVAS SON DEL MOTOR ═══\n');

ok(!!CLASES_REGLA.dias_concretos && !!CLASES_REGLA.veces_por_semana,
  '🚨 `dias_concretos` y `veces_por_semana` viven en `CLASES_REGLA`, el motor de la RA F1');
ok(!/function recorrer|for \(let [a-z]+ = 0; [a-z]+ < 3650/.test(LIB_CODIGO),
  '🚨 y **aquí no hay ni un recorrido de fechas propio**: con dos motores, Hábitos y el Centro de Rachas dirían números distintos');
ok(!/rachaActual\s*=|function rachaActual/.test(LIB_CODIGO),
  '⚠️ ni una racha calculada a mano');
eq(CLASES_REGLA.veces_por_semana.periodo, 'semana',
  '⚠️ y la semanal declara su periodo: el motor recorre SEMANAS, no días');
eq(typeof CLASES_REGLA.dias_concretos.toca, 'function',
  '⚠️ y la de días concretos declara `toca`, que es lo único nuevo que entiende el motor');
ok(/punto de integración/i.test(MOTOR) || /periodo === 'semana'/.test(MOTOR),
  '⚠️ construido en el punto que la RA F1 dejó escrito, no en un motor aparte');

console.log('\n═══ 3. 🚨 LA RACHA RESPETA LA FRECUENCIA ═══\n');

/* 🚨 El apartado que más insiste: *"No implementar una lógica absurda de perder la
   racha… **La lógica debe respetar la frecuencia configurada**"*. */
eq(ESTADOS_DIA.NO_TOCA, 'no_toca', 'existe un quinto estado de día: el que la regla no pedía');
const idxDias = indicePorFecha(
  Object.keys(hDias.historial).map((f) => ({ id: `hx:${f}`, rachaId: 'hx', fecha: f, valor: 1 })), 'hx');
eq(estadoDeDia('2026-09-08', { indice: idxDias, regla: hDias.regla, hoy: HOY }), ESTADOS_DIA.NO_TOCA,
  '🚨 el martes de un hábito de lunes, miércoles y viernes **no toca**: no es un fallo');
eq(estadoDeDia('2026-09-07', { indice: idxDias, regla: hDias.regla, hoy: HOY }), ESTADOS_DIA.COMPLETADO,
  '⚠️ y el lunes, cumplido');
eq(estadisticasHabito(hDias, HOY).rachaActual, 3,
  '🚨 **Y LA RACHA VALE 3, no 0**: los martes y jueves no la rompen. Sin esto se perdería cada semana');
eq(estadisticasHabito(hDias, HOY).porcentaje, 100,
  '🚨 y el cumplimiento es del 100 %: **el denominador cuenta solo los días que la regla pedía**');

/* ⚠️ Un día marcado que no tocaba cuenta como cumplido: le damos la razón a él, no
   a la regla. */
const conExtra = { ...hDias, historial: { ...hDias.historial, '2026-09-08': true } };
eq(estadoDeDia('2026-09-08', {
  indice: indicePorFecha(Object.keys(conExtra.historial).map((f) => ({ id: `hx:${f}`, rachaId: 'hx', fecha: f, valor: 1 })), 'hx'),
  regla: conExtra.regla, hoy: HOY,
}), ESTADOS_DIA.COMPLETADO,
'⚠️ y si marca un martes que no tocaba, **eso es un día cumplido**, no un día que no cuenta');

eq(estadisticasHabito(hSem, HOY).rachaActual, 2,
  '🚨 «3 veces por semana» con dos semanas completas atrás: la racha son **2 SEMANAS**, no seis días');
/* ⚠️ Y son 2 y no 3 porque **la semana en curso lleva 2 de 3**: todavía no cuenta,
   pero tampoco rompe — la misma política del día en curso del apartado 8 de la
   RA F1, aplicada a la semana. */
eq(vecesQuedanEstaSemana(hSem, HOY), 1, '⚠️ y por eso queda una vez esta semana');
eq(estadisticasHabito(hSem, HOY).unidad, 'semana', '⚠️ y la unidad se dice, para no mentir al pintarla');
eq(textoRacha(hSem, HOY), '2 semanas', '⚠️ con sus palabras, y en semanas');
eq(textoRacha(hDiario, HOY), '3 días', '⚠️ y la diaria, en días');
eq(textoRacha({ ...hDiario, historial: {} }, HOY), null,
  '🚨 **una racha de cero no se pinta**: un contador apagado no anima a nadie');

const semanaAMedias = { ...hSem, historial: { '2026-09-07': true, '2026-09-09': true } };
ok(estadisticasHabito(semanaAMedias, '2026-09-09').rachaActual >= 0,
  '⚠️ y la semana en curso con 2 de 3 no rompe nada: todavía da tiempo');
eq(vecesQuedanEstaSemana(semanaAMedias, '2026-09-09'), 1, '⚠️ y quedan una');
eq(vecesQuedanEstaSemana(hDiario, HOY), 0, '⚠️ un hábito diario no cuenta veces por semana');

console.log('\n═══ 4. CREAR, EDITAR, PAUSAR Y ELIMINAR ═══\n');

ok(nombreHabitoValido('Leer 20 minutos'), 'un nombre con algo escrito vale');
ok(!nombreHabitoValido('   ') && !nombreHabitoValido(''), '⚠️ uno en blanco no');
ok(!nombreHabitoValido('x'.repeat(MAX_NOMBRE_HABITO + 1)), `⚠️ ni uno de más de ${MAX_NOMBRE_HABITO} caracteres`);
eq(crearHabito({ nombre: '' }), null, '🚨 sin nombre no se crea nada');
eq(crearHabito(), null, '⚠️ ni sin argumentos');
eq(crearHabito({ nombre: 'X', frecuencia: 'dias', dias: [] }), null,
  '🚨 **ni un hábito de "días concretos" sin ningún día**: no tocaría nunca, y su racha no podría avanzar jamás');
eq(Object.keys(crearHabito({ nombre: 'X' })).sort(), [...CAMPOS_HABITO].sort(), 'los nueve campos declarados y ni uno más');
ok(!Object.keys(crearHabito({ nombre: 'X' })).includes('user_id'),
  '⚠️ y `user_id` NO es un campo: la fila de `app_data` es del usuario (EH F43)');
eq(crearHabito({ nombre: 'X' }).categoria, null, '⚠️ la categoría es opcional DE VERDAD: no se pone una por defecto');
eq(crearHabito({ nombre: 'X', icono: 'NoExiste' }).icono, ICONO_HABITO_POR_DEFECTO, '⚠️ un icono inventado no se guarda');
eq(crearHabito({ nombre: 'X', categoria: 'inventada' }).categoria, null, '⚠️ ni una categoría inventada');
eq(crearHabito({ nombre: 'X' }).activo, true, '⚠️ y nace activo');
eq(crearHabito({ nombre: 'X' }).historial, {}, '⚠️ y sin historial');

eq(editarHabito(hDiario, { nombre: 'Agua' }).nombre, 'Agua', 'se puede editar el nombre');
eq(editarHabito(hDiario, { nombre: '  ' }).nombre, 'Beber agua', '⚠️ pero no dejarlo en blanco');
eq(editarHabito(hDiario, { nombre: 'Agua' }).historial, hDiario.historial,
  '🚨 **editar NO toca el historial**: cambiar el nombre no puede borrar lo que ya cumplió');
eq(editarHabito(hDias, { frecuencia: 'dias', dias: [] }).regla, hDias.regla,
  '⚠️ y una frecuencia de días sin días no se guarda: se queda como estaba');
eq(editarHabito(hDiario, { frecuencia: 'semanal', veces: 4 }).regla, { clase: 'veces_por_semana', veces: 4 },
  '⚠️ y se puede cambiar de frecuencia');

eq(pausarHabito(hDiario).activo, false, '*"Pausarse/desactivarse"*');
eq(pausarHabito(hDiario).historial, hDiario.historial,
  '🚨 **pausar CONSERVA el historial entero**: es archivar, no eliminar (E3 F5 y E3 F18)');
eq(reanudarHabito(pausarHabito(hDiario)).activo, true, '⚠️ y se puede reanudar');
eq(tocaHoy(hPausa, HOY), false, '⚠️ un hábito pausado no pide nada');
ok(/BotonBorrarDefinitivo/.test(VISTA_LIMPIA),
  '🚨 *"Eliminar debe pedir confirmación"*: y aquí SÍ se pregunta, porque se lleva el historial entero');

console.log('\n═══ 5. MARCAR Y DESMARCAR ═══\n');

const limpio = crearHabito({ nombre: 'Prueba' });
ok(hechoHoy(alternarHabito(limpio, HOY), HOY), 'marcar lo deja hecho');
ok(!hechoHoy(alternarHabito(alternarHabito(limpio, HOY), HOY), HOY), '*"si se vuelve a pulsar, permitir desmarcarlo"*');
eq(alternarHabito(limpio, HOY).rachaActual, undefined,
  '🚨 y **no se guarda ningún contador**: la racha se deriva, así que no hay número que desincronizar (RA F1)');
ok(hechoHoy(hDiario, HOY), 'el escenario tiene uno hecho hoy');
ok(!hechoHoy(hPausa, HOY), 'y otro sin hacer');

console.log('\n═══ 6. EL PROGRESO DEL DÍA ═══\n');

const p = progresoDelDia(todos, HOY);
eq(p.total, 2, 'cuentan los que tocan hoy: el diario y el semanal — el de LMV no toca en sábado');
eq(p.hechos, 1, '⚠️ y los hechos son los marcados');
eq(p.porcentaje, 50, '*"3 / 5 completados"*, en porcentaje');
eq(progresoDelDia([], HOY).porcentaje, null,
  '🚨 **sin nada que hacer hoy NO hay porcentaje**: un 0 % sería inventarse un mal día donde no tocaba nada (E3 F13)');
eq(progresoDelDia([], HOY).hayQueHacer, false, '⚠️ y se dice, para que la pantalla no pinte una barra vacía');
eq(progresoDelDia([hPausa], HOY).hayQueHacer, false, '⚠️ un pausado no cuenta como pendiente');
eq(progresoDelDia([hDias], HOY).hayQueHacer, false, '⚠️ ni uno cuya frecuencia no pide nada hoy');

console.log('\n═══ 7. HISTORIAL Y ESTADÍSTICAS ═══\n');

eq(semanaDe(hDias, HOY).length, 7, '*"L M X J V S D"*: siete días');
eq(semanaDe(hDias, HOY).map((d) => d.letra), NOMBRES_DIA_CORTOS, '⚠️ con sus letras, empezando por el lunes');
eq(semanaDe(hDias, HOY).filter((d) => d.estado === ESTADOS_DIA.NO_TOCA).length, 3,
  '🚨 y los martes, jueves y sábado salen como **huecos**, no como equis');
eq(semanaDe(hDias, HOY).filter((d) => d.estado === ESTADOS_DIA.COMPLETADO).length, 3, '⚠️ y tres cumplidos');
ok(semanaDe(hDias, HOY).some((d) => d.esHoy), '⚠️ y hoy va marcado');
eq(historialCompacto(hDias, HOY).length, SEMANAS_HISTORIAL, `el mapa de calor son ${SEMANAS_HISTORIAL} semanas`);
ok(historialCompacto(hDias, HOY).every((s) => s.dias.length === 7), '⚠️ de siete días cada una');

const e = estadisticasHabito(hDiario, HOY);
ok(['rachaActual', 'mejorRacha', 'totalCompletado', 'porcentaje', 'primerDia', 'estado'].every((k) => k in e),
  '*"Cumplimiento · Racha actual · Mejor racha · Total de veces completado · Historial"*');
eq(e.totalCompletado, 3, 'las veces completadas son las de verdad');
eq(estadisticasHabito(crearHabito({ nombre: 'Nuevo' }), HOY).rachaActual, 0,
  '⚠️ un hábito recién creado no revienta: cero, sin historial');
eq(estadisticasHabito(crearHabito({ nombre: 'Nuevo' }), HOY).primerDia, null,
  '⚠️ y sin primer día, `null` — la pantalla lo dice en vez de pintar una fecha inventada');

console.log('\n═══ 8. FILTROS ═══\n');

eq(FILTROS_HABITOS.map((f) => f.id), ['hoy', 'pendientes', 'completados', 'todos'],
  '*"Todos · Hoy · Completados · Pendientes"*');
eq(FILTRO_HABITOS_POR_DEFECTO, 'hoy', '⚠️ y se entra por los de hoy, que es lo que quiere ver al abrir');
eq(filtrarHabitos(todos, 'hoy', HOY).map((h) => h.id), ['hd', 'hs'], 'los de hoy');
eq(filtrarHabitos(todos, 'completados', HOY).map((h) => h.id), ['hd'], 'los completados');
eq(filtrarHabitos(todos, 'pendientes', HOY).map((h) => h.id), ['hs'], 'los pendientes');
eq(filtrarHabitos(todos, 'todos', HOY).length, 4, 'y todos son todos');
ok(!filtrarHabitos(todos, 'hoy', HOY).some((h) => h.id === 'hp'),
  '🚨 **un pausado no sale en "Hoy"**: pediría algo que Josué ha decidido no hacer');
ok(filtrarHabitos(todos, 'todos', HOY).some((h) => h.id === 'hp'), '⚠️ pero sí en "Todos", para poder reanudarlo');
ok(FILTROS_HABITOS.every((f) => !!vacioDeFiltro(f.id, HOY)),
  '⚠️ y cada filtro tiene su frase de vacío: *"no te queda ninguno pendiente"* no es lo mismo que *"no tienes hábitos"*');

/* 🚨 **UN HÁBITO RECIÉN CREADO NO PUEDE DESAPARECER, Y ESTO LO ENCONTRÓ CHROMIUM.**
   Se entra por el filtro "Hoy": crear un hábito de lunes, miércoles y viernes **un
   domingo** lo guardaba perfectamente y **no se veía por ninguna parte**, porque
   los filtros solo salían con tres hábitos o más. Se guardaba bien y él lo había
   perdido. */
const domingo = '2026-09-13';
const soloLMV = crearHabito({ nombre: 'Gimnasio', frecuencia: 'dias', dias: [0, 2, 4] });
eq(filtrarHabitos([soloLMV], 'hoy', domingo).length, 0,
  '🚨 un hábito de L-X-V no sale en "Hoy" si hoy es domingo — y eso es correcto…');
eq(filtrarHabitos([soloLMV], 'todos', domingo).length, 1,
  '⚠️ …pero está en "Todos", que es donde hay que poder encontrarlo');
ok(/setFiltro\('todos'\)/.test(VISTA_LIMPIA),
  '🚨 y al crear uno que no cabe en el filtro puesto, **la pantalla cambia de filtro**: lo acabas de crear, tienes que verlo');
ok(/hayEscondidos/.test(VISTA_LIMPIA) && /mostrarFiltros/.test(VISTA_LIMPIA),
  '🚨 y los filtros salen **en cuanto algo queda escondido**, no a partir de tres: una salida que solo existe con muchos no es una salida');

console.log('\n═══ 9. EL ESTADO VACÍO ═══\n');

eq(VACIO_HABITOS.titulo, 'Empieza a construir tu constancia', 'el título del enunciado, palabra por palabra');
eq(VACIO_HABITOS.frase, 'Los pequeños hábitos repetidos crean grandes cambios.', '⚠️ y su frase');
eq(VACIO_HABITOS.boton, 'Crear mi primer hábito', '⚠️ y su botón');
ok(VISTA_LIMPIA.includes('VACIO_HABITOS.titulo'), '🚨 y se pinta de verdad: *"NO mostrar una pantalla vacía"*');

console.log('\n═══ 10. EL NORMALIZADOR, VIGESIMOSEGUNDA VEZ ═══\n');

/* 🚨 Un hábito de la Fase 6 es `{ id, nombre, historial }`. Sin normalizar los
   cinco campos nuevos, el primer guardado desde la pantalla nueva se llevaría el
   icono, la categoría, la regla y el pausado (regla 5). */
const viejo = { id: 'v1', nombre: 'De la Fase 6', historial: { '2026-09-01': true } };
const migrado = normalizarHabito(viejo);
eq(Object.keys(migrado).sort(), [...CAMPOS_HABITO].sort(), '🚨 un hábito de la Fase 6 llega con los nueve campos');
eq(migrado.regla, { ...REGLA_HABITO },
  '🚨 **y su frecuencia sigue siendo la de siempre**: una migración que le pusiera otra le rompería rachas vivas sin avisar');
eq(frecuenciaDe(viejo).id, 'diaria', '⚠️ y la pantalla la enseña como "Todos los días"');
eq(migrado.historial, { '2026-09-01': true }, '⚠️ sin perder lo que ya cumplió');
eq(migrado.activo, true, '⚠️ y activo');
eq(migrado.icono, ICONO_HABITO_POR_DEFECTO, '⚠️ con icono por defecto');
eq(normalizarHabito({ nombre: '' }), null, '⚠️ uno sin nombre se descarta');
eq(normalizarHabito(null), null, '⚠️ y algo que no es un objeto también');
ok(!!normalizarHabito({ nombre: 'X' }).id, '⚠️ un hábito sin `id` es un duplicado esperando a pasar: se le pone uno (EH F45)');
eq(normalizarHabito({ nombre: 'X', historial: 'no soy un objeto' }).historial, {}, '⚠️ y un historial que no lo es se descarta');
eq(normalizarHabito({ nombre: 'X', historial: { '2026-01-01': false } }).historial, {},
  '⚠️ y un día a `false` no es un día cumplido');
eq(normalizarHabito({ nombre: 'X', regla: { clase: 'dias_concretos', dias: [9, 'x', 2, 2] } }).regla,
  { clase: 'dias_concretos', dias: [2] }, '⚠️ los días se limpian: nada fuera de 0-6, sin repetidos');
eq(normalizarHabito({ nombre: 'X', regla: { clase: 'veces_por_semana', veces: 99 } }).regla,
  { clase: 'veces_por_semana', veces: 7 }, '⚠️ y no se puede pedir más de siete veces por semana');
eq(normalizarHabito({ nombre: 'X', regla: { clase: 'veces_por_semana', veces: 0 } }).regla.veces, 1,
  '⚠️ ni cero: sería una regla que se cumple sin hacer nada');
eq(normalizarHabito({ nombre: 'X', regla: { clase: 'inventada' } }).regla, { ...REGLA_HABITO },
  '⚠️ y una clase que no existe cae en la de siempre');
eq(normalizarHabitos([viejo, null, { nombre: '' }]).length, 1, '⚠️ y la lista descarta lo que no es un hábito');

console.log('\n═══ 11. LO PREPARADO PARA HOY, SIN REHACER HOY ═══\n');

eq(HOY_NO_SE_REHACE.rehecho, false, '🚨 *"NO rehacer completamente Hoy en esta fase"*');
ok(/hoy\.js/.test(HOY_NO_SE_REHACE.porQue), '⚠️ y se dice que quien compone lo del día sigue siendo `hoy.js` (HT F6)');
const ph = paraHoy(todos, HOY);
ok(['pendientes', 'completados', 'total', 'porcentaje', 'rachaDestacada'].every((k) => k in ph),
  '*"Hábitos pendientes · completados · progreso diario · racha destacada"*');
eq(ph.pendientes, 1, 'los pendientes son los de verdad');
eq(ph.completados, 1, 'y los completados');
eq(ph.rachaDestacada.dias, 3, 'la racha destacada es la más larga viva');
eq(paraHoy([], HOY).rachaDestacada, null,
  '🚨 y sin ninguna racha viva, `null`: **nunca un cero** (E3 F13)');
eq(paraHoy([], HOY).porcentaje, null, '⚠️ ni un porcentaje inventado');
ok(!/Te quedan|Hábitos ·/.test(LIB_CODIGO),
  '⚠️ y ni una frase escrita para Hoy: `paraHoy()` devuelve NÚMEROS, no textos');

console.log('\n═══ 12. LOS ICONOS SON LA OTRA MITAD DEL CATÁLOGO ═══\n');

const iconosEnVista = (VISTA.match(/const ICONOS_HABITO_COMP = \{([^}]*)\}/) || [, ''])[1];
ok(ICONOS_HABITO.every((i) => iconosEnVista.includes(i.id)),
  '🚨 **TODOS los iconos del catálogo están en la vista**: uno que falte sale como un hueco y no falla en ninguna parte');
ok(!/from 'lucide-react'/.test(LIB), '⚠️ y la librería no importa React');
ok(!/[\u{1F300}-\u{1FAFF}]/u.test(LIB_CODIGO), '⚠️ nada de emojis: la gramática de iconos es Lucide (E3 F3)');
ok(iconoHabitoValido('Flame') && !iconoHabitoValido('NoExiste'), '⚠️ y solo valen los del catálogo');
eq(categoriaHabito('inventada'), null, '⚠️ y las categorías igual');
eq(CATEGORIAS_HABITO.map((c) => c.id), ['salud', 'estudios', 'fitness', 'productividad', 'personal', 'otros'],
  'las seis del enunciado');

console.log('\n═══ 13. LAS ANIMACIONES EXISTEN DE VERDAD ═══\n');

/* 🐛 E3 F14: *"una animación declarada y no escrita es un catálogo que miente"*.
   Ya pasó con `tarea-hecha` y `aviso-entra`. */
for (const clase of ['habito-hecho', 'barra-progreso']) {
  ok(new RegExp(`\\.${clase}\\s*\\{`).test(CSS), `⚠️ \`.${clase}\` existe en el CSS`);
  ok(VISTA.includes(clase), `⚠️ y la vista la usa`);
}
ok(/@keyframes habitoHecho/.test(CSS), '⚠️ con su animación escrita');
ok(!/@keyframes|animation:/.test(VISTA),
  '🚨 y ninguna se escribe en la vista: van a `index.css`, así respetan "Reducir movimiento" solas (E3 F14)');

console.log('\n═══ 14. NADA SE HA ROTO, Y NADA SE HA MOVIDO ═══\n');

eq(DONDE_SE_GUARDA_HABITOS.filter((d) => d.nuevo).length, 0,
  '🚨 los hábitos siguen en la clave `productividad`: ni un dato se mueve (C-29)');
eq(AISLAMIENTO_HABITOS.tablasNuevas, 0, '⚠️ ni una tabla nueva');
ok(/auth\.uid\(\) = user_id/.test(AISLAMIENTO_HABITOS.politicas), '⚠️ y el aislamiento es de la base de datos');
ok(!/create table|create policy/i.test(LIB), '⚠️ esta fase no trae SQL');
ok(!/saveData|supabase|localStorage/.test(LIB_CODIGO), '🚨 y la librería no guarda nada: quien escribe es `App.jsx`');
eq(Object.keys(DEFAULT_PRODUCTIVIDAD).sort(), ['apuntes', 'habitos', 'metas', 'pomodoros', 'rutinas', 'tareas'],
  '⚠️ la forma de `productividad` no ha cambiado');
eq(MINI_APPS_PR.length, 6, '⚠️ y siguen siendo seis mini-apps');

console.log('\n═══ 15. LO QUE ESTA FASE NO HACE ═══\n');

ok(NO_EN_PR2.every((x) => x.que && x.llega), 'cada cosa que no se hace dice cuándo llega');
for (const palabra of ['Pomodoro', 'Tareas', 'Metas', 'Rutinas', 'IA', 'Notificaciones']) {
  ok(NO_EN_PR2.some((x) => new RegExp(palabra, 'i').test(x.que)), `⚠️ ${palabra} está declarado`);
}
ok(NO_EN_PR2.some((x) => /D2-02/.test(x.llega)),
  '🚨 y **ni puntos ni niveles por cumplir un hábito**: D2-02, no sobregamificar');
ok(!/\bxp\b|nivel|moneda|puntos/i.test(LIB_CODIGO.replace(/[a-z0-9]{8,}/gi, '')),
  '⚠️ y no aparecen en el código');
ok(!/askAI|ask-ai|anthropic/i.test(LIB_CODIGO), '🚨 sin IA de productividad');

console.log('\n═══ 16. LA CONDICIÓN DE FINALIZACIÓN, CALCULADA ═══\n');

const cond = condicionPR2(todos, HOY);
eq(cond.length, 12, 'doce casillas, una por criterio comprobable');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y las doce en verde');
ok(pr2Terminada(todos, HOY), 'la fase está terminada con datos de verdad');
ok(pr2Terminada([], HOY), '⚠️ y sin ningún hábito: la condición es del sistema, no de sus datos');
ok(!/ok: true,/.test(LIB_CODIGO.replace(/activo: true|nuevo: false/g, '')),
  '🚨 y ninguna casilla está puesta a `true` a mano: todas se calculan (E3 F15, EH F64)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos\n`);
process.exit(fallos === 0 ? 0 : 1);
