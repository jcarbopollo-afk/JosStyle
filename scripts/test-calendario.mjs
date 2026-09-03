// ============================================================================
// Calendario Universal · el motor de recurrencias
//
// 🚨 Este archivo nace de **tres fallos encontrados ejecutando el expansor**, no
// de una fase nueva. Los tres llevaban en el código desde la Fase 3 y ninguna
// prueba los miraba, porque **no había ninguna prueba del calendario**:
//
//   1. Un evento **DIARIO no avanzaba nunca**: 500 copias del mismo día.
//   2. Uno **SEMANAL avanzaba 6 días**, no 7.
//   3. Uno **MENSUAL del 31** saltaba de enero al 2 de marzo y se quedaba
//      atascado en el día 3.
//
// Los dos primeros eran el UTC de siempre (`toISOString` sobre medianoche
// local). El tercero era encadenar `setMonth(+1)` en vez de contar desde el
// ancla. Aquí quedan los tres clavados para que no vuelvan.
//
// ⚠️ Y una nota sobre el huso: estas comprobaciones **solo fallan fuera de UTC**.
// En una máquina en UTC el fallo original no se veía — por eso sobrevivió tantas
// versiones. La de Josué está en España.
// ============================================================================

import {
  diasDelMes, primerDiaSemanaMes, isoDeFecha, celdasMes,
  intervaloDe, saltarOcurrencia, deshacerSalto, retocarOcurrencia, deshacerRetoque, describirRecurrencia,
  eventosDelDia, tiposDelDia, resumenDelDia, eventosFuturos, expandirRecurrentes,
} from '../src/lib/calendario.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const ev = (id, fecha, recurrencia = null, extra = {}) => ({ id, fecha, titulo: id, tipo: 'evento', ...extra, ...(recurrencia ? { recurrencia } : {}) });
const fechas = (lista, desde, hasta) => expandirRecurrentes(lista, desde, hasta).map((x) => x.fecha);

console.log('\n📅 Calendario Universal — el motor de recurrencias\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 LOS TRES FALLOS QUE ENCONTRÓ ESTA PRUEBA
   --------------------------------------------------------------------------- */
{
  console.log('1 · Los tres fallos, clavados');
  eq(fechas([ev('a', '2026-06-01', { frecuencia: 'diaria' })], '2026-06-01', '2026-06-05'),
    ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'],
    '🚨 🐛 un evento DIARIO avanza un día cada vez (antes: 500 copias del mismo día)');

  eq(fechas([ev('b', '2026-06-01', { frecuencia: 'semanal' })], '2026-06-01', '2026-06-30'),
    ['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29'],
    '🚨 🐛 uno SEMANAL avanza SIETE días (antes: seis, y se iba andando hacia atrás por la semana)');

  eq(fechas([ev('c', '2026-01-31', { frecuencia: 'mensual' })], '2026-01-01', '2026-05-31'),
    ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31'],
    '🚨 🐛 uno MENSUAL del 31 cae el último día de los meses cortos y VUELVE al 31 (antes: se atascaba en el día 3)');

  /* ⚠️ El mismo día de la semana, que es lo que la gente espera de "semanal". */
  const dias = fechas([ev('d', '2026-06-01', { frecuencia: 'semanal' })], '2026-06-01', '2026-08-31')
    .map((f) => new Date(`${f}T12:00:00`).getDay());
  eq([...new Set(dias)], [dias[0]],
    '⚠️ y todas las ocurrencias semanales caen en el MISMO día de la semana, tres meses seguidos');
}

/* ---------------------------------------------------------------------------
   2 · MENSUAL Y ANUAL, CONTADOS DESDE EL ANCLA
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Contar desde el ancla');
  eq(fechas([ev('e', '2026-01-15', { frecuencia: 'mensual' })], '2026-01-01', '2026-05-31'),
    ['2026-01-15', '2026-02-15', '2026-03-15', '2026-04-15', '2026-05-15'],
    'un mensual normal mantiene su día');
  eq(fechas([ev('f', '2026-11-30', { frecuencia: 'mensual' })], '2026-11-01', '2027-02-28'),
    ['2026-11-30', '2026-12-30', '2027-01-30', '2027-02-28'],
    '⚠️ y cruza el cambio de año sin perderse');

  eq(fechas([ev('g', '2024-02-29', { frecuencia: 'anual' })], '2024-01-01', '2028-12-31'),
    ['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29'],
    '🚨 ⚠️ un anual del 29 de febrero cae el 28 los años normales y VUELVE al 29 en el bisiesto');
  eq(fechas([ev('h', '2026-03-10', { frecuencia: 'anual' })], '2026-01-01', '2029-12-31'),
    ['2026-03-10', '2027-03-10', '2028-03-10', '2029-03-10'],
    'y uno normal repite su fecha exacta');
}

/* ---------------------------------------------------------------------------
   3 · LOS LÍMITES DE LA SERIE
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Ventanas y límites');
  eq(fechas([ev('i', '2026-06-01', { frecuencia: 'diaria', hasta: '2026-06-03' })], '2026-06-01', '2026-06-30'),
    ['2026-06-01', '2026-06-02', '2026-06-03'],
    'la recurrencia respeta su fecha de fin');
  eq(fechas([ev('j', '2026-06-10', { frecuencia: 'diaria' })], '2026-06-12', '2026-06-14'),
    ['2026-06-12', '2026-06-13', '2026-06-14'],
    '⚠️ y solo devuelve lo de la ventana pedida, aunque el ancla sea anterior');

  /* El atajo para anclas viejas — donde estaba el segundo `toISOString`. */
  eq(fechas([ev('k', '2025-01-01', { frecuencia: 'diaria' })], '2026-06-01', '2026-06-04'),
    ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04'],
    '🐛 un ancla de hace año y medio aterriza en el día correcto (el atajo tenía el mismo UTC)');
  const semanales = fechas([ev('l', '2025-01-06', { frecuencia: 'semanal' })], '2026-06-01', '2026-06-30');
  /* ⚠️ Cuántas caben en un mes depende de en qué día empiece: cuatro o cinco.
     Lo que NO puede fallar es el HUECO entre ellas, que es lo que rompía el UTC. */
  ok(semanales.length >= 4, `y el atajo semanal deja ${semanales.length} ocurrencias en el mes`);
  const huecos = semanales.slice(1).map((f, i) => Math.round(
    (new Date(`${f}T12:00:00`) - new Date(`${semanales[i]}T12:00:00`)) / 86400000,
  ));
  eq([...new Set(huecos)], [7], '🐛 y entre una y la siguiente hay SIETE días exactos, todas las veces');

  eq(fechas([ev('m', '2026-06-01')], '2026-06-01', '2026-06-30'), ['2026-06-01'],
    'un evento sin recurrencia es una sola ocurrencia: él mismo');
  eq(fechas([ev('n', '2026-05-01')], '2026-06-01', '2026-06-30'), [],
    'y fuera de la ventana no sale');
  eq(fechas([ev('o', '2026-06-01', { frecuencia: 'inventada' })], '2026-06-01', '2026-06-30'),
    ['2026-06-01'],
    '⚠️ una frecuencia desconocida corta la serie en seco en vez de hacer cualquier cosa');
  eq(expandirRecurrentes([], '2026-06-01', '2026-06-30'), [], 'sin eventos, nada');
}

/* ---------------------------------------------------------------------------
   4 · LAS OCURRENCIAS NO SE MATERIALIZAN (regla 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Ocurrencias virtuales');
  const original = ev('p', '2026-06-01', { frecuencia: 'diaria' });
  const copia = JSON.parse(JSON.stringify(original));
  const salida = expandirRecurrentes([original], '2026-06-01', '2026-06-05');
  eq(original, copia, '🚨 ⚠️ expandir NO toca el evento guardado: las ocurrencias son virtuales (regla 11)');
  eq(salida.length, 5, 'y salen cinco');
  eq(salida[0].id, 'p:2026-06-01', '⚠️ cada una con un id derivado, nunca el del original repetido');
  ok(salida.every((x) => x.eventoOrigenId === 'p'),
    'y todas apuntan al evento real, para poder editar la serie desde cualquiera');
  eq(salida[0].esOcurrencia, false, 'la primera es el evento en sí…');
  eq(salida[1].esOcurrencia, true, '…y las demás están marcadas como ocurrencias');
}

/* ---------------------------------------------------------------------------
   5 · LO QUE YA HABÍA, QUE SIGUE BIEN
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · La cuadrícula y los resúmenes');
  eq(diasDelMes(2026, 1), 28, 'febrero de 2026 tiene 28 días');
  eq(diasDelMes(2024, 1), 29, 'y el de 2024, veintinueve');
  eq(diasDelMes(2026, 0), 31, 'enero, treinta y uno');
  eq(isoDeFecha(2026, 0, 5), '2026-01-05', 'la fecha ISO se compone sin pasar por Date');
  ok(primerDiaSemanaMes(2026, 5) >= 0 && primerDiaSemanaMes(2026, 5) <= 6, 'la semana empieza en lunes (0-6)');

  const celdas = celdasMes(2026, 5);
  eq(celdas.filter((c) => c).length, 30, 'junio pinta sus treinta días');
  ok(celdas.filter((c) => !c).length === primerDiaSemanaMes(2026, 5),
    '⚠️ y los huecos del principio son exactamente los que hacen falta');

  const lista = [ev('q', '2026-06-10', null, { todoElDia: true }), ev('r', '2026-06-10', null, { horaInicio: '09:00' })];
  eq(eventosDelDia(lista, '2026-06-10').map((x) => x.id), ['q', 'r'],
    'los de día completo van primero');
  eq(eventosDelDia(lista, '2026-06-11'), [], 'y un día sin nada devuelve una lista vacía');
  eq(tiposDelDia(lista, '2026-06-10'), ['evento'], 'los indicadores compactos, sin repetir tipo');
  ok(tiposDelDia(lista, '2026-06-10').length <= 3, 'y como mucho tres');
  ok(/2 eventos/.test(resumenDelDia(lista, '2026-06-10')), 'el resumen cuenta lo que hay');
  eq(resumenDelDia(lista, '2026-06-11'), null, '⚠️ y un día vacío devuelve null, no "0 eventos"');
  eq(eventosFuturos(lista, '2026-06-01', 30).length, 2, 'los próximos treinta días');
  eq(eventosFuturos(lista, '2026-07-01', 30).length, 0, 'y ninguno si ya pasaron');
}


/* ---------------------------------------------------------------------------
   6 · R2.3 — "CADA 2 SEMANAS"
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Intervalo personalizado');
  eq(fechas([ev('s', '2026-06-01', { frecuencia: 'semanal', cada: 2 })], '2026-06-01', '2026-07-31'),
    ['2026-06-01', '2026-06-15', '2026-06-29', '2026-07-13', '2026-07-27'],
    'cada 2 semanas salta una');
  eq(fechas([ev('t', '2026-06-01', { frecuencia: 'diaria', cada: 3 })], '2026-06-01', '2026-06-15'),
    ['2026-06-01', '2026-06-04', '2026-06-07', '2026-06-10', '2026-06-13'],
    'cada 3 días');
  eq(fechas([ev('u', '2026-06-01', { frecuencia: 'mensual', cada: 2 })], '2026-01-01', '2026-12-31'),
    ['2026-06-01', '2026-08-01', '2026-10-01', '2026-12-01'],
    'y cada 2 meses');

  /* ⚠️ Lo que pasa con un dato malo, que es donde esto se rompería feo. */
  eq(intervaloDe({ cada: 0 }), 1, '🚨 un intervalo de 0 vale 1: si no, la serie se para o entra en bucle');
  eq(intervaloDe({ cada: -5 }), 1, 'un negativo, también');
  eq(intervaloDe({ cada: 'dos' }), 1, 'y un texto');
  eq(intervaloDe({ cada: 2.7 }), 2, 'un decimal se trunca');
  eq(intervaloDe({}), 1, 'y sin nada, uno: el comportamiento de siempre');
  eq(fechas([ev('v', '2026-06-01', { frecuencia: 'diaria', cada: 0 })], '2026-06-01', '2026-06-04'),
    ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04'],
    '⚠️ así que un 0 guardado se comporta como antes, no revienta la serie');

  eq(fechas([ev('w', '2025-01-01', { frecuencia: 'semanal', cada: 2 })], '2026-06-01', '2026-06-30'),
    ['2026-06-03', '2026-06-17'],
    '⚠️ y el atajo de anclas viejas también multiplica: aterriza en una fecha DE LA SERIE');
}

/* ---------------------------------------------------------------------------
   7 · R2.4 — SALTAR UN DÍA Y CAMBIAR SOLO UN DÍA
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Saltar y retocar un día');
  const serie = ev('x', '2026-06-01', { frecuencia: 'diaria' });

  const conSalto = saltarOcurrencia(serie, '2026-06-03');
  eq(fechas([conSalto], '2026-06-01', '2026-06-05'),
    ['2026-06-01', '2026-06-02', '2026-06-04', '2026-06-05'],
    '🚨 saltar un día lo quita…');
  eq(fechas([conSalto], '2026-06-01', '2026-06-10').length, 9,
    '🚨 ⚠️ …y la serie SIGUE después: saltar no es terminar');
  eq(fechas([deshacerSalto(conSalto, '2026-06-03')], '2026-06-01', '2026-06-05').length, 5,
    'y se puede deshacer');
  eq(saltarOcurrencia(conSalto, '2026-06-03'), conSalto, 'saltar dos veces el mismo día no lo duplica');
  eq(saltarOcurrencia(ev('y', '2026-06-01'), '2026-06-03').recurrencia, undefined,
    '⚠️ y un evento sin recurrencia no se toca');

  const retocado = retocarOcurrencia(serie, '2026-06-03', { titulo: 'Ese día distinto' });
  const oc = expandirRecurrentes([retocado], '2026-06-01', '2026-06-04');
  eq(oc.map((o) => o.titulo), ['x', 'x', 'Ese día distinto', 'x'],
    '🚨 cambiar un día cambia SOLO ese día');
  eq(oc.map((o) => !!o.retocada), [false, false, true, false],
    '⚠️ y queda marcado, para que la pantalla pueda ofrecer deshacerlo');
  eq(expandirRecurrentes([deshacerRetoque(retocado, '2026-06-03')], '2026-06-01', '2026-06-04')
    .map((o) => o.titulo), ['x', 'x', 'x', 'x'], 'y se deshace');

  /* 🚨 Lo que hace que esto no sea una copia: hereda lo que no se tocó. */
  const conNuevoTipo = { ...retocado, tipo: 'objetivo' };
  eq(expandirRecurrentes([conNuevoTipo], '2026-06-03', '2026-06-03')[0].tipo, 'objetivo',
    '🚨 ⚠️ el día retocado HEREDA los cambios de la serie en lo que no se tocó');
  eq(expandirRecurrentes([conNuevoTipo], '2026-06-03', '2026-06-03')[0].titulo, 'Ese día distinto',
    '…y conserva lo suyo en lo que sí');

  /* Y las dos cosas a la vez. */
  const ambas = retocarOcurrencia(saltarOcurrencia(serie, '2026-06-02'), '2026-06-04', { titulo: 'Otro' });
  eq(fechas([ambas], '2026-06-01', '2026-06-05'),
    ['2026-06-01', '2026-06-03', '2026-06-04', '2026-06-05'], 'saltar y retocar conviven');
  ok(/1 día saltado/.test(describirRecurrencia(ambas.recurrencia)), 'y la frase lo cuenta');
  ok(/1 día cambiado/.test(describirRecurrencia(ambas.recurrencia)), 'las dos cosas');
  eq(describirRecurrencia({ frecuencia: 'diaria' }), 'Cada día', 'una serie simple se lee en una frase');
  eq(describirRecurrencia({ frecuencia: 'semanal', cada: 2 }), 'Cada 2 semanas', 'y una con intervalo');
  eq(describirRecurrencia(null), null, 'y sin recurrencia no hay frase');
  eq(describirRecurrencia({ frecuencia: 'inventada' }), null, 'ni con una frecuencia que no existe');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
