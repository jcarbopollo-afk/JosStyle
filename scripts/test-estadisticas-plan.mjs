// ============================================================================
// ENTREGA 3 · FASE 13 (HC F8) — ESTADÍSTICAS DE PLANIFICACIÓN
//
// 🚨 **El enunciado lo enmarca en su primera línea:** *"Esto NO es un sistema de
// productividad independiente. Las estadísticas deben utilizar los datos que ya
// existen."*
//
// 🚨 **Y prohíbe tres cosas, que son las que más se pueden romper:**
//   · *"si no hay suficientes datos, mostrar «Sin datos suficientes». **No
//     inventar un porcentaje**"* (apartado 6);
//   · *"**no estimar duración cuando no exista**"* (apartados 11 y 12);
//   · *"si actualmente NO existe historial, **NO inventarlo retroactivamente**"*
//     (apartado 17).
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PERIODOS, PERIODO_POR_DEFECTO, periodo, rangoDelPeriodo,
  FUENTES_ESTADISTICA, fuenteEstadistica, elementosDelPeriodo,
  MINIMO_PARA_CUMPLIMIENTO, TEXTO_SIN_DATOS, resumenPlanificacion,
  BARRAS, MAX_BARRAS, grafico, cumplimientoPorDia,
  cargaPorDiaSemana, diasMasCargados, distribucionPorTipo,
  FRANJAS, franjaDe, distribucionHoraria,
  horasPlanificadas, formatoHoras, tareasAtrasadas, resumenRecurrentes,
  comparar, tendencia, NO_MEDIBLE_TODAVIA, noMedible, LO_MIDE_SU_MODULO,
  PALABRAS_DE_JUICIO, sinJuicio,
} from '../src/lib/estadisticasPlan.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Bloques primero, llaves vacías después (la lección de la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

// Jueves 3 de septiembre de 2026.
const HOY = '2026-09-03';
const d = (n) => {
  const f = new Date(2026, 8, 3);
  f.setDate(f.getDate() + n);
  return f.toLocaleDateString('sv-SE');
};

const estado = {
  calendario: {
    eventos: [
      { id: 'e1', titulo: 'Entrenamiento', fecha: HOY, tipo: 'entrenamiento', horaInicio: '17:00', horaFin: '18:30' },
      { id: 'e2', titulo: 'Clase', fecha: d(-1), tipo: 'estudio', horaInicio: '08:00', horaFin: '09:00' },
      { id: 'e3', titulo: 'Sin fin', fecha: d(-2), tipo: 'personal', horaInicio: '10:00' },
      { id: 'e4', titulo: 'Viejo', fecha: d(-200), tipo: 'personal', horaInicio: '10:00' },
    ],
  },
  productividad: {
    tareas: [
      { id: 't1', texto: 'Estudiar', fecha: HOY, hora: '09:00', hecha: true },
      { id: 't2', texto: 'Comprar', fecha: d(-1), hecha: true },
      { id: 't3', texto: 'Pendiente', fecha: d(-2), hecha: false },
      { id: 't4', texto: 'Atrasada', fecha: d(-5), hecha: false },
      { id: 't5', texto: 'Leer', fecha: d(-6), recurrencia: { frecuencia: 'diaria', hechas: [d(-6), d(-5)] } },
    ],
  },
};

console.log('\n═══ 1. EL PERIODO (apartado 2) ═══\n');

eq(PERIODOS.map((p) => p.id), ['7d', '30d', '3m', '1a'], '⚠️ los cuatro del enunciado');
eq(PERIODO_POR_DEFECTO, '30d', '⚠️ y por defecto 30 días, como pide el apartado 2');
eq(periodo('inventado').id, '30d', 'lo desconocido cae en el defecto');
const r7 = rangoDelPeriodo('7d', HOY);
eq([r7.desde, r7.hasta, r7.dias], [d(-6), HOY, 7],
  '🚨 siete días CONTANDO hoy: si no, el rango tendría ocho o dejaría fuera el primero');

console.log('\n═══ 2. QUÉ CUENTA PARA EL CUMPLIMIENTO (apartados 4 y 6) ═══\n');

eq(FUENTES_ESTADISTICA.filter((f) => f.seCompleta).map((f) => f.id), ['tarea'],
  '🚨 SOLO una tarea se completa: *"no contar entidades que no tengan un concepto real de finalización"*');
eq(fuenteEstadistica('evento').seCompleta, false,
  '🚨 un evento OCURRE: meterlo en el denominador bajaría el porcentaje por cosas que simplemente pasaron');
ok(FUENTES_ESTADISTICA.every((f) => f.porque && f.de),
  '⚠️ y cada fuente dice por qué y de dónde sale');

console.log('\n═══ 3. EL RESUMEN, Y EL PORCENTAJE QUE NO SE INVENTA (apartados 3, 5 y 6) ═══\n');

const res = resumenPlanificacion(estado, '30d', { hoy: HOY });
ok(res.planificados > 0, 'se cuentan los elementos planificados del periodo');
/* ⚠️ Cuatro, no dos: las dos sueltas **más** las dos apariciones marcadas de la
   serie diaria. Una aparición completada ES una tarea completada del periodo. */
eq(res.tareas.completadas, 4, 'las tareas completadas, contando las apariciones de una serie');
eq(res.tareas.pendientes + res.tareas.completadas, res.tareas.creadas, 'y las cuentas cuadran');
ok(res.eventos >= 3, 'y los eventos del periodo');
ok(!estado.calendario.eventos.some((e) => e.fecha === d(-200) && res.planificados === 0),
  'lo de hace 200 días no entra en 30');
ok(typeof res.cumplimiento === 'number' && res.cumplimiento >= 0 && res.cumplimiento <= 100,
  'con datos suficientes hay un porcentaje de verdad');

// 🚨 Apartado 6 — el caso que el enunciado nombra.
const pocos = { calendario: { eventos: [] }, productividad: { tareas: [{ id: 'x', texto: 'Una', fecha: HOY, hecha: true }] } };
eq(resumenPlanificacion(pocos, '30d', { hoy: HOY }).cumplimiento, null,
  '🚨 CON UNA SOLA TAREA NO HAY PORCENTAJE: *"si no hay suficientes datos, mostrar «Sin datos suficientes». No inventar un porcentaje"*');
eq(TEXTO_SIN_DATOS, 'Sin datos suficientes', '⚠️ y el texto es el del enunciado, literal');
ok(MINIMO_PARA_CUMPLIMIENTO >= 2, 'el mínimo es un número declarado, no un `if` suelto');

const vacio = { calendario: { eventos: [] }, productividad: { tareas: [] } };
eq(resumenPlanificacion(vacio, '30d', { hoy: HOY }).cumplimiento, null,
  '🚨 y sin nada tampoco se enseña un 0 %: sería un reproche por no tener datos (EH F35)');
eq(resumenPlanificacion(vacio, '30d', { hoy: HOY }).planificados, 0, 'aunque el recuento sí sea cero');

console.log('\n═══ 4. EL GRÁFICO SON OCHO CARACTERES (apartados 7 y 23) ═══\n');

eq(BARRAS, ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
  '⚠️ los ocho del enunciado: *"Actividad ▁▃▅▂▆▇▃…"* — ni una librería, ni un `<canvas>`');
eq(grafico([0, 1, 2, 3]).length, 4, 'una barra por valor');
eq(grafico([]), '', 'sin valores, nada');
eq(grafico([0, 0, 0]), '▁▁▁', '🐛 y todo ceros da la barra más baja, sin dividir por cero');
ok(grafico(Array.from({ length: 60 }, (_, i) => i)).length <= MAX_BARRAS,
  '⚠️ y sesenta días se agrupan: una tira de sesenta barras no cabe en un móvil');
eq(grafico([1, 8])[1], '█', 'el más alto llena la barra');

const porDia = cumplimientoPorDia(estado, '7d', { hoy: HOY });
eq(porDia.length, 7, 'siete días');
ok(porDia.every((x) => x.porcentaje !== null),
  '⚠️ con una tarea DIARIA, todos los días tienen algo que completar — y eso está bien');
/* 🚨 El caso que importa se prueba con un escenario que tiene huecos: sin una
   serie diaria, hay días sin nada. */
const conHuecos = { calendario: { eventos: [] }, productividad: { tareas: [{ id: 'u', texto: 'Una', fecha: HOY, hecha: true }] } };
const porDiaHuecos = cumplimientoPorDia(conHuecos, '7d', { hoy: HOY });
ok(porDiaHuecos.some((x) => x.porcentaje === null),
  '🚨 un día SIN nada que completar no tiene porcentaje (`null`), y no se dibuja como un cero: sería inventarse un mal día');
eq(porDiaHuecos.find((x) => x.fecha === HOY).porcentaje, 100, 'y el que sí tiene, lo tiene');

console.log('\n═══ 5. LA CARGA Y LOS RANKINGS (apartados 8, 14 y 15) ═══\n');

const carga = cargaPorDiaSemana(estado, '30d', { hoy: HOY });
eq(carga.length, 7, 'los siete días de la semana');
eq(carga.map((c) => c.letra), ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  '⚠️ empezando por el lunes, como el resto del proyecto');
ok(carga.every((c) => c.nombre), 'y cada uno con su nombre entero');
ok(carga.reduce((a, c) => a + c.elementos, 0) > 0, 'con elementos de verdad');

const top = diasMasCargados(estado, '30d', { hoy: HOY });
ok(top.length > 0 && top.length <= 3, 'el ranking son tres como mucho');
ok(top[0].elementos >= (top[1]?.elementos ?? 0), 'ordenado de más a menos');
eq(diasMasCargados(vacio, '30d', { hoy: HOY }), [],
  '⚠️ y sin nada NO hay ranking: *"no llenar la interfaz de rankings innecesarios"* (apartado 15)');

console.log('\n═══ 6. QUÉ Y CUÁNDO PLANIFICAS (apartados 9 y 10) ═══\n');

const dist = distribucionPorTipo(estado, '30d', { hoy: HOY });
ok(dist.length > 0 && dist.every((x) => typeof x.porcentaje === 'number'),
  '⚠️ los porcentajes se calculan de verdad (apartado 9)');
ok(dist.reduce((a, x) => a + x.elementos, 0) === resumenPlanificacion(estado, '30d', { hoy: HOY }).planificados,
  '🚨 y suman EXACTAMENTE lo planificado: si no, faltaría algo sin que nadie lo dijera');
ok(dist.some((x) => x.id === 'tarea'), 'las tareas son un tipo más');
eq(distribucionPorTipo(vacio, '30d', { hoy: HOY }), [], 'sin nada, ninguna distribución');

eq(FRANJAS.map((f) => f.id), ['manana', 'tarde', 'noche'],
  '⚠️ las tres franjas del apartado 10, definidas *"de forma consistente"*');
eq(franjaDe('09:00'), 'manana', 'las nueve son la mañana');
eq(franjaDe('17:00'), 'tarde', 'las cinco, la tarde');
eq(franjaDe('23:00'), 'noche', 'las once, la noche');
eq(franjaDe('02:00'), 'noche', '🐛 y las dos de la madrugada también: la franja cruza la medianoche');
eq(franjaDe(''), null, 'sin hora no hay franja');
eq(franjaDe('25:99'), null, '🐛 y una hora imposible tampoco (sexta vez de que la forma no basta)');

const horaria = distribucionHoraria(estado, '30d', { hoy: HOY });
ok(horaria.hayDatos && horaria.franjas.length === 3, 'con elementos con hora hay distribución');
ok(horaria.franjas.reduce((a, f) => a + f.porcentaje, 0) >= 99, 'y los porcentajes suman el total');
ok(typeof horaria.sinHora === 'number', '⚠️ y se dice cuántos no tienen hora, en vez de repartirlos');
eq(distribucionHoraria(vacio, '30d', { hoy: HOY }).hayDatos, false,
  '🚨 sin nada con hora NO hay distribución: repartir el 100 % entre franjas vacías sería inventarlo');

console.log('\n═══ 7. LAS HORAS QUE NO SE ESTIMAN (apartados 11, 12 y 13) ═══\n');

const horas = horasPlanificadas(estado, '30d', { hoy: HOY });
eq(horas.minutos, 150, '🚨 solo cuentan los que tienen hora de INICIO y de FIN: 90 + 60 minutos');
ok(horas.sinDuracion > 0, 'y los que no la tienen se cuentan aparte');
ok(/no tienen hora de fin|no tiene hora de fin/.test(horas.aviso),
  '🚨 *"NO ESTIMAR DURACIÓN CUANDO NO EXISTA"* (apartado 11): un evento sin hora de fin no dura una hora por defecto, y se DICE cuántos quedan fuera');
eq(horasPlanificadas(vacio, '30d', { hoy: HOY }).minutos, null,
  '🚨 y sin ni un elemento con duración se devuelve `null`, no un 0 h');
eq(formatoHoras(150), '2 h 30 min', 'el formato del apartado 11');
eq(formatoHoras(45), '45 min', 'menos de una hora, en minutos');
eq(formatoHoras(120), '2 h', 'y en punto, sin los minutos');

console.log('\n═══ 8. ATRASADAS Y RECURRENTES (apartados 16 y 18) ═══\n');

const atrasadas = tareasAtrasadas(estado, { hoy: HOY });
ok(atrasadas.some((t) => t.id === 't4'), 'una tarea pendiente de hace días está atrasada');
ok(!atrasadas.some((t) => t.hecha), 'y lo hecho no lo está');
ok(!atrasadas.some((t) => t.id === 't1'), 'ni lo de hoy');
ok(!atrasadas.some((t) => t.id === 't5'),
  '⚠️ una serie no se cuenta como atrasada: su regla sigue viva, no es una tarea que se quedó sin hacer');
ok(atrasadas.every((t) => t.texto && t.id),
  '🚨 y lo que se devuelve son LAS TAREAS de siempre: *"no crear otra base de datos"* (apartado 16)');

const rec = resumenRecurrentes(estado, '30d', { hoy: HOY });
eq(rec.series, 1, 'una serie');
ok(rec.apariciones > rec.hechas, 'con más apariciones que hechas');
eq(rec.hechas, 2, 'y las dos marcadas se cuentan');
ok(rec.porcentaje === null || (rec.porcentaje >= 0 && rec.porcentaje <= 100), 'con su porcentaje, o `null`');
eq(resumenRecurrentes(vacio, '30d', { hoy: HOY }).porcentaje, null, 'sin series, sin porcentaje');

console.log('\n═══ 9. COMPARAR SIN INTERPRETAR (apartados 25, 26 y 27) ═══\n');

const comp = comparar(estado, '7d', { hoy: HOY });
ok(typeof comp.planificados.diferencia === 'number', 'la diferencia de elementos se calcula');
ok('antes' in comp.completados && 'ahora' in comp.completados, 'con los dos periodos a la vista');
ok(comp.cumplimiento.diferencia === null || typeof comp.cumplimiento.diferencia === 'number',
  '🚨 y si en cualquiera de los dos no había datos suficientes, la diferencia es `null`: comparar contra un `null` daría un salto inventado');

eq(tendencia(8).icono, '↑', 'más es una flecha arriba');
eq(tendencia(-3).icono, '↓', 'menos, abajo');
eq(tendencia(0).icono, '→', 'e igual, de lado');
eq(tendencia(null), null, 'y sin diferencia no hay flecha');
ok(tendencia(8).texto === '+8' && !/mejor|bien/.test(tendencia(8).texto),
  '🚨 SIN ADJETIVOS: *"no generar interpretaciones"* (apartado 25). El número y su signo, nada más');

console.log('\n═══ 10. LO QUE NO SE INVENTA (apartados 4, 12 y 17) ═══\n');

eq(NO_MEDIBLE_TODAVIA.map((x) => x.id), ['reprogramaciones', 'horas_reales', 'eventos_finalizados'],
  '⏸ las tres cosas que el enunciado nombra y que HOY no se pueden medir');
ok(NO_MEDIBLE_TODAVIA.every((x) => x.existe === false && x.porque && x.apartado),
  '🚨 declaradas con su motivo y su apartado: *"si NO existe historial, NO inventarlo retroactivamente"* (17)');
ok(/no las que tuvo antes/.test(noMedible('reprogramaciones').porque),
  '⚠️ y el motivo es el de verdad: una tarea guarda la fecha que tiene ahora');
eq(noMedible('inventada'), null, 'y algo que no está declarado no se inventa');

ok(LO_MIDE_SU_MODULO.length >= 4 && LO_MIDE_SU_MODULO.every((x) => x.modulo && x.con),
  '⚠️ y lo que ya mide otro módulo se declara con su función real');
ok(LO_MIDE_SU_MODULO.some((x) => x.apartado === 19 && /rachasServicio|panelHabitos/.test(x.con)),
  '🚨 las rachas y el cumplimiento de hábitos son de Hábitos: *"NO duplicar estadísticas de hábitos"* (19)');
ok(LO_MIDE_SU_MODULO.some((x) => x.apartado === 20 && /no se mezcla/.test(x.con)),
  '⚠️ y el tiempo de Pomodoro no se mezcla con las horas planificadas: son métricas distintas (20)');

console.log('\n═══ 11. NI UNA INTERPRETACIÓN, NI UN ALMACÉN (apartados 14 y 25) ═══\n');

ok(PALABRAS_DE_JUICIO.length >= 8, 'hay una lista de palabras que no pueden salir');
ok(!sinJuicio('Deberías planificar más') && sinJuicio('12 elementos'),
  '⚠️ y distingue una cifra de un juicio');

// 🚨 Todos los textos que genera este archivo, barridos.
const textos = [
  TEXTO_SIN_DATOS,
  horas.aviso,
  ...NO_MEDIBLE_TODAVIA.map((x) => x.porque),
  ...FUENTES_ESTADISTICA.map((f) => f.porque),
  ...cargaPorDiaSemana(estado, '30d', { hoy: HOY }).map((c) => c.nombre),
  tendencia(8).texto, tendencia(-3).texto, tendencia(0).texto,
].filter(Boolean);
const conJuicio = textos.filter((t) => !sinJuicio(t));
eq(conJuicio, [],
  '🚨 NINGÚN texto generado lleva un juicio: *"no convertirlo en una recomendación. Es simplemente información"* (apartado 14)');

const LIB = sinComentarios(leer('src/lib/estadisticasPlan.js'));
ok(!/saveData\(|supabase\./i.test(LIB),
  '🚨 esta capa NO guarda ni una cifra: cuenta en el momento (EH F35)');
for (const copia of ['DEFAULT_ESTADISTICAS', 'normalizarEstadisticas', 'stats_cache', 'guardarTotal']) {
  ok(!new RegExp(copia, 'i').test(LIB),
    `🚨 ni un almacén: \`${copia}\` no existe — una estadística guardada miente en cuanto él borra un registro`);
}
ok(!/askAI|ask-ai|contextoParaIA/i.test(LIB),
  '🚨 y sin IA: *"no hacer recomendaciones mediante IA"* (el objetivo del enunciado)');
ok(/expandirRecurrentes/.test(LIB) && /instanciaHecha/.test(LIB),
  '⚠️ y reutiliza el motor de recurrencias y el marcado de la E3 F10: ni un segundo cálculo');

console.log('\n═══ 12. EN LA PANTALLA (apartado 1) ═══\n');

const VISTA = sinComentarios(leer('src/views/CalendarView.jsx'));
ok(/<EstadisticasPlan/.test(VISTA),
  '🚨 y ALGUIEN LA PINTA: una función que nadie llama no falla nunca');
ok(/vista === 'stats'/.test(VISTA),
  '⚠️ vive dentro del Calendario, donde están los datos que mide: *"no crear duplicados"* (apartado 1)');
ok(/PERIODOS\.map/.test(VISTA), '⚠️ con su selector de periodo (apartado 2)');
ok(/TEXTO_SIN_DATOS/.test(VISTA),
  '🚨 y cuando no hay bastante, lo dice en vez de enseñar un porcentaje inventado (apartado 6)');
ok(/grafico\(/.test(VISTA), '⚠️ el gráfico de ocho caracteres (apartado 23)');
ok(/horas\.aviso/.test(VISTA),
  '🚨 y el aviso de lo que no tiene duración: *"no estimar duración cuando no exista"* (apartado 11)');
ok(/onVerAtrasadas/.test(VISTA),
  '⚠️ las atrasadas llevan a la lista de verdad, no a otra base de datos (apartado 16)');
ok(!/deberías|mejor que|vas bien/i.test(VISTA),
  '🚨 y ni una interpretación en la pantalla: *"no convertirlo en una recomendación"* (apartado 14)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
