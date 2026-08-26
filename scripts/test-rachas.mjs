// ============================================================================
// RA · Fase 1/4 — Pruebas del motor de rachas
//
// Lo que más se comprueba aquí es lo que el apartado 8 repite dos veces: que un
// día en curso NO se considere fallido. Es el fallo que haría que a las 10:00 de
// la mañana la app le dijera a Josué que ha perdido una racha de 20 días.
// ============================================================================

import {
  DEFAULT_RACHAS, TIPOS_RACHA, tipoRacha, CLASES_REGLA, DEFAULT_REGLA,
  claseDeRegla, toleranciaDe, describirRegla,
  crearRacha, normalizarRacha, crearEvento, claveEvento,
  registrarCumplimiento, anularCumplimiento, indicePorFecha,
  ESTADOS_DIA, estadoDeDia, ESTADOS_RACHA, estadoRacha,
  rachaActual, mejorRacha, historialDeRachas, estadisticasRacha, diasEntre,
  resumenRacha, rachaGlobal,
  REGLA_HABITO, rachaDeHabito, eventosDeHistorial, resumenHabito, alternarHabito,
} from '../src/lib/rachas.js';
import { addDays } from '../src/lib/helpers.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-26';
const d = (n) => addDays(HOY, n);

// Una racha diaria estricta, para casi todo.
const R = normalizarRacha({ id: 'r1', tipo: 'training', nombre: 'Entrenamiento', regla: { clase: 'diaria' } });
const ev = (fechas, rachaId = 'r1', valor = 1) =>
  fechas.map((f) => ({ id: `${rachaId}:${f}`, rachaId, fecha: f, valor, registradoEn: `${f}T12:00:00.000Z` }));

/* ===========================================================================
   MODELO Y REGLAS (apartados 3, 5, 12)
   =========================================================================== */
console.log('\n═══ RA Fase 1 — modelo y reglas ═══\n');
{
  comprobar('El estado por defecto está vacío', DEFAULT_RACHAS.definiciones.length === 0 && DEFAULT_RACHAS.eventos.length === 0);
  comprobar('Los nueve tipos del apartado 3 existen', TIPOS_RACHA.length === 9);
  comprobar('...con identificadores estables', TIPOS_RACHA.every((t) => typeof t.id === 'string' && t.id.length > 0));
  comprobar('Un tipo desconocido cae en "personalizada"', tipoRacha('inventado').id === 'custom');

  comprobar('Una regla desconocida cae en la diaria', claseDeRegla({ clase: 'zzz' }).id === 'diaria');
  comprobar('La regla diaria no perdona nada', toleranciaDe({ clase: 'diaria' }) === 0);
  comprobar('La de gracia perdona un día', toleranciaDe({ clase: 'diaria_con_gracia' }) === 1);
  comprobar('Una tolerancia negativa no se acepta', toleranciaDe({ clase: 'diaria_con_gracia', tolerancia: -5 }) === 1);
  comprobar('Una tolerancia absurda se acota', toleranciaDe({ clase: 'diaria', tolerancia: 9999 }) === 30);

  comprobar('La regla de mínimo se describe con su valor', describirRegla({ clase: 'minimo', valor: 30, unidad: 'min' }).includes('30 min'));
  comprobar('Cada clase sabe describirse', Object.values(CLASES_REGLA).every((c) => typeof c.describir({}) === 'string'));

  const nueva = crearRacha({ tipo: 'study', nombre: '  ', hoy: HOY });
  comprobar('Una racha sin nombre toma el de su tipo', nueva.nombre === 'Estudio');
  comprobar('...y su icono', nueva.icono === 'estudios');
  comprobar('...y nace activa', nueva.activa === true);
  comprobar('Una definición rota no revienta', normalizarRacha(null).tipo === 'custom');
  comprobar('Una definición sin regla toma la diaria', normalizarRacha({}).regla.clase === 'diaria');
}

/* ===========================================================================
   IDEMPOTENCIA (apartado 18) — el requisito con nombre propio
   =========================================================================== */
console.log('\n═══ Idempotencia y eventos ═══\n');
{
  let eventos = [];
  for (let i = 0; i < 5; i++) eventos = registrarCumplimiento(eventos, { rachaId: 'r1', fecha: HOY });
  comprobar('CLAVE · Pulsar cinco veces "completado" deja UN solo día', eventos.length === 1, String(eventos.length));
  comprobar('...y la racha vale 1, no 5', rachaActual(eventos, R, HOY) === 1);

  // Corregir el valor de un día es volver a registrarlo, no crear otro.
  const corregido = registrarCumplimiento(eventos, { rachaId: 'r1', fecha: HOY, valor: 45 });
  comprobar('Corregir un día no crea un segundo', corregido.length === 1);
  comprobar('...y se queda el valor nuevo', corregido[0].valor === 45);
  comprobar('...conservando el id, para no desmontar la fila', corregido[0].id === eventos[0].id);

  comprobar('Dos rachas distintas no se pisan el mismo día',
    registrarCumplimiento(eventos, { rachaId: 'r2', fecha: HOY }).length === 2);
  comprobar('La clave lógica es racha + día', claveEvento('r1', HOY) !== claveEvento('r2', HOY));

  comprobar('Anular quita el día', anularCumplimiento(eventos, 'r1', HOY).length === 0);
  comprobar('Anular un día que no está no rompe nada', anularCumplimiento(eventos, 'r1', d(-9)).length === 1);
  comprobar('Sin racha no se registra nada', registrarCumplimiento([], { fecha: HOY }).length === 0);

  // Apartado 21: datos duplicados y fuera de orden.
  const desordenados = [
    { id: 'a', rachaId: 'r1', fecha: HOY, valor: 1, registradoEn: `${HOY}T08:00:00.000Z` },
    { id: 'b', rachaId: 'r1', fecha: HOY, valor: 99, registradoEn: `${HOY}T20:00:00.000Z` },
  ];
  comprobar('Ante dos eventos del mismo día gana el más reciente', indicePorFecha(desordenados, 'r1')[HOY].valor === 99);
  comprobar('...aunque vengan al revés', indicePorFecha([desordenados[1], desordenados[0]], 'r1')[HOY].valor === 99);
  comprobar('El índice filtra por racha', Object.keys(indicePorFecha(ev([HOY], 'r2'), 'r1')).length === 0);

  const suelto = crearEvento({ rachaId: 'r1', fecha: HOY });
  comprobar('Un evento guarda su día local', suelto.fecha === HOY);
  comprobar('...y el instante en UTC, que no decide nada', typeof suelto.registradoEn === 'string' && suelto.registradoEn.endsWith('Z'));
  comprobar('Un valor no numérico no ensucia el evento', crearEvento({ rachaId: 'r1', valor: 'mucho' }).valor === 1);
}

/* ===========================================================================
   EL DÍA EN CURSO (apartados 7, 8 y 11) — lo más importante de la fase
   =========================================================================== */
console.log('\n═══ Día pendiente, perdido y racha rota ═══\n');
{
  // Lunes ✅ Martes ✅ Miércoles (hoy) todavía sin hacer.
  const eventos = ev([d(-2), d(-1)]);
  const indice = indicePorFecha(eventos, 'r1');

  comprobar('CLAVE · Hoy sin cumplir es PENDIENTE, no perdido',
    estadoDeDia(HOY, { indice, regla: R.regla, hoy: HOY }) === ESTADOS_DIA.PENDIENTE);
  comprobar('CLAVE · ...y la racha NO se ha roto: sigue viva con 2 días',
    rachaActual(eventos, R, HOY) === 2, String(rachaActual(eventos, R, HOY)));
  comprobar('CLAVE · ...y su estado lo dice: pendiente', estadoRacha(eventos, R, HOY) === ESTADOS_RACHA.PENDIENTE);

  // Al cumplirlo, pasa a activa y suma.
  const cumplido = registrarCumplimiento(eventos, { rachaId: 'r1', fecha: HOY });
  comprobar('Al cumplir hoy la racha sube a 3', rachaActual(cumplido, R, HOY) === 3);
  comprobar('...y pasa a activa', estadoRacha(cumplido, R, HOY) === ESTADOS_RACHA.ACTIVA);

  // Un día que ya terminó sin cumplir sí es perdido, y sí rompe.
  const conHueco = ev([d(-4), d(-3), d(-1)]);   // falta d(-2), que ya pasó
  comprobar('Un día pasado sin cumplir es PERDIDO',
    estadoDeDia(d(-2), { indice: indicePorFecha(conHueco, 'r1'), regla: R.regla, hoy: HOY }) === ESTADOS_DIA.PERDIDO);
  comprobar('...y corta la racha ahí', rachaActual(conHueco, R, HOY) === 1, String(rachaActual(conHueco, R, HOY)));

  // Ayer perdido y hoy pendiente: la racha sí está rota.
  const rota = ev([d(-5), d(-4), d(-3)]);
  comprobar('Con ayer perdido y hoy pendiente, la racha está rota', rachaActual(rota, R, HOY) === 0);
  comprobar('...y el estado es ROTA, no "sin datos"', estadoRacha(rota, R, HOY) === ESTADOS_RACHA.ROTA);
  comprobar('Sin ningún evento, el estado es "sin datos"', estadoRacha([], R, HOY) === ESTADOS_RACHA.SIN_DATOS);
  comprobar('Una racha de un solo día es NUEVA', estadoRacha(ev([HOY]), R, HOY) === ESTADOS_RACHA.NUEVA);

  comprobar('Un día futuro es FUTURO, no perdido',
    estadoDeDia(d(3), { indice, regla: R.regla, hoy: HOY }) === ESTADOS_DIA.FUTURO);
  comprobar('...y un evento adelantado no infla la racha de hoy',
    rachaActual(ev([d(1), d(2)]), R, HOY) === 0);
}

/* ===========================================================================
   MEDIANOCHE Y ZONA HORARIA (apartados 4 y 21)
   =========================================================================== */
console.log('\n═══ El día local, no el UTC ═══\n');
{
  // Este es el caso literal del apartado 4: 23:59 cuenta para hoy, 00:01 para
  // mañana. El motor recibe el día ya resuelto, así que lo que se comprueba es
  // que ese día local sea el que manda y no el instante UTC.
  const tarde = { id: 'x', rachaId: 'r1', fecha: HOY, valor: 1, registradoEn: `${HOY}T21:59:00.000Z` };      // 23:59 en España
  const pronto = { id: 'y', rachaId: 'r1', fecha: d(1), valor: 1, registradoEn: `${HOY}T22:01:00.000Z` };    // 00:01 del día siguiente
  comprobar('CLAVE · Dos instantes UTC del mismo día caen en días LOCALES distintos',
    indicePorFecha([tarde, pronto], 'r1')[HOY] && indicePorFecha([tarde, pronto], 'r1')[d(1)]);
  comprobar('...y el de las 23:59 cuenta para hoy', rachaActual([tarde], R, HOY) === 1);
  comprobar('...y el de las 00:01 no cuenta todavía', rachaActual([pronto], R, HOY) === 0);

  // `addDays` es local desde la corrección de AR F3; si volviera a irse a UTC,
  // el recorrido saltaría días y esto lo cazaría.
  comprobar('El recorrido usa días locales consecutivos',
    rachaActual(ev([d(-2), d(-1), HOY]), R, HOY) === 3);

  // Cambio de mes y de año, que es donde una resta de días mal hecha falla.
  const finDeAnio = ['2025-12-30', '2025-12-31', '2026-01-01'];
  comprobar('La racha cruza el fin de año', rachaActual(ev(finDeAnio), R, '2026-01-01') === 3);
  comprobar('...y el cambio de mes', rachaActual(ev(['2026-02-27', '2026-02-28', '2026-03-01']), R, '2026-03-01') === 3);
  // 2028 es bisiesto: el 29 de febrero existe y no puede saltarse.
  comprobar('...y el 29 de febrero de un bisiesto', rachaActual(ev(['2028-02-28', '2028-02-29', '2028-03-01']), R, '2028-03-01') === 3);

  comprobar('Días entre dos fechas, ambas incluidas', diasEntre(d(-2), HOY) === 3);
  comprobar('...y cero si están al revés', diasEntre(HOY, d(-2)) === 0);
}

/* ===========================================================================
   RÉCORD E HISTORIAL (apartados 9 y 10) — derivados, nunca guardados
   =========================================================================== */
console.log('\n═══ Récord e historial ═══\n');
{
  // Tramos de 5, 8, 12 y 3 días, separados por huecos — el ejemplo del apartado 9.
  const fechas = [];
  const tramo = (inicio, largo) => { for (let i = 0; i < largo; i++) fechas.push(addDays(inicio, i)); };
  tramo(d(-40), 5);
  tramo(d(-30), 8);
  tramo(d(-18), 12);
  tramo(d(-2), 3);        // llega hasta hoy
  const eventos = ev(fechas);

  comprobar('CLAVE · El récord se calcula del historial: 12', mejorRacha(eventos, R, HOY) === 12, String(mejorRacha(eventos, R, HOY)));
  comprobar('...y la actual es 3', rachaActual(eventos, R, HOY) === 3);

  const historial = historialDeRachas(eventos, R, HOY);
  comprobar('El historial devuelve los cuatro tramos', historial.length === 4, String(historial.length));
  comprobar('...del más reciente al más antiguo', historial[0].dias === 3 && historial[3].dias === 5);
  comprobar('...con sus duraciones', historial.map((t) => t.dias).join(',') === '3,12,8,5');
  comprobar('...cada uno con inicio y fin', historial.every((t) => t.inicio && t.fin && t.inicio <= t.fin));
  comprobar('...y solo el que llega a hoy está vivo', historial.filter((t) => t.activo).length === 1 && historial[0].activo);

  // El récord no se puede inflar desde la interfaz: no hay nada que escribir.
  comprobar('CLAVE · Con el historial corregido, el récord baja solo',
    mejorRacha(eventos.filter((e) => e.fecha !== d(-12)), R, HOY) < 12);

  // Al superar el récord, se actualiza sin que nadie lo guarde.
  const largo = [];
  for (let i = 19; i >= 0; i--) largo.push(d(-i));
  comprobar('Al llegar a 20 días el récord es 20', mejorRacha(ev(largo), R, HOY) === 20);

  comprobar('Sin eventos no hay historial', historialDeRachas([], R, HOY).length === 0);
  comprobar('...ni récord', mejorRacha([], R, HOY) === 0);
  comprobar('Una cuenta nueva no revienta', rachaActual([], R, HOY) === 0 && estadoRacha([], R, HOY) === ESTADOS_RACHA.SIN_DATOS);
}

/* ===========================================================================
   REGLAS CON CONDICIÓN (apartados 5 y 12)
   =========================================================================== */
console.log('\n═══ Reglas de mínimo, cantidad y margen ═══\n');
{
  const estudio = normalizarRacha({ id: 's1', tipo: 'study', regla: { clase: 'minimo', valor: 30, unidad: 'min' } });
  const eventos = [
    { id: '1', rachaId: 's1', fecha: d(-2), valor: 45, registradoEn: `${d(-2)}T12:00:00Z` },
    { id: '2', rachaId: 's1', fecha: d(-1), valor: 10, registradoEn: `${d(-1)}T12:00:00Z` },   // no llega
    { id: '3', rachaId: 's1', fecha: HOY, valor: 60, registradoEn: `${HOY}T12:00:00Z` },
  ];
  comprobar('CLAVE · Un día por debajo del mínimo NO cuenta como cumplido',
    estadoDeDia(d(-1), { indice: indicePorFecha(eventos, 's1'), regla: estudio.regla, hoy: HOY }) === ESTADOS_DIA.PERDIDO);
  comprobar('...así que la racha es 1, no 3', rachaActual(eventos, estudio, HOY) === 1);
  comprobar('Justo en el mínimo sí cuenta',
    rachaActual([{ id: '4', rachaId: 's1', fecha: HOY, valor: 30, registradoEn: `${HOY}T12:00:00Z` }], estudio, HOY) === 1);

  // La regla con margen: la que ya usaban los hábitos.
  const conGracia = normalizarRacha({ id: 'h1', regla: REGLA_HABITO });
  const salteado = ev([d(-4), d(-3), d(-1), HOY], 'h1');   // falta d(-2)
  comprobar('CLAVE · Con margen, un fallo suelto NO rompe la racha', rachaActual(salteado, conGracia, HOY) === 4,
    String(rachaActual(salteado, conGracia, HOY)));
  comprobar('...y el día perdonado no suma (son 4 cumplidos, no 5)', rachaActual(salteado, conGracia, HOY) === 4);
  comprobar('...pero dos fallos seguidos sí rompen',
    rachaActual(ev([d(-5), d(-4), d(-1), HOY], 'h1'), conGracia, HOY) === 2);
  comprobar('La regla estricta, en cambio, sí se rompe con uno', rachaActual(ev([d(-4), d(-3), d(-1), HOY]), R, HOY) === 2);
}

/* ===========================================================================
   RESUMEN ÚNICO (apartado 17) Y ESTADÍSTICAS (apartado 10)
   =========================================================================== */
console.log('\n═══ Resumen, estadísticas y récord batido ═══\n');
{
  const eventos = ev([d(-6), d(-5), d(-4), d(-2), d(-1), HOY]);
  const r = resumenRacha(eventos, R, HOY);

  comprobar('El resumen trae la racha actual', r.actual === 3);
  comprobar('...el récord', r.record === 3);
  comprobar('...el estado', r.estado === ESTADOS_RACHA.ACTIVA);
  comprobar('...el estado de hoy', r.estadoHoy === ESTADOS_DIA.COMPLETADO);
  comprobar('...el inicio del tramo vivo', r.inicio === d(-2));
  comprobar('...la regla en texto', r.regla === 'Todos los días');
  comprobar('...y los días cumplidos', r.diasCumplidos === 6);
  comprobar('CLAVE · El resumen y las funciones sueltas nunca discrepan',
    r.actual === rachaActual(eventos, R, HOY) && r.record === mejorRacha(eventos, R, HOY));

  const stats = estadisticasRacha(eventos, R, HOY);
  comprobar('Los días perdidos son el hueco real', stats.diasPerdidos === 1, String(stats.diasPerdidos));
  comprobar('El porcentaje se calcula sobre los días con historial', stats.porcentaje === 86, String(stats.porcentaje));
  comprobar('...y arranca en el primer día con actividad', stats.primerDia === d(-6));
  comprobar('Sin historial el porcentaje es 0, no NaN', estadisticasRacha([], R, HOY).porcentaje === 0);

  // Batir el récord es superar a los tramos ANTERIORES, no igualarse a uno mismo.
  comprobar('CLAVE · La primera racha de todas no "bate" ningún récord',
    resumenRacha(ev([d(-1), HOY]), R, HOY).batiendoRecord === false);
  const superando = ev([d(-9), d(-8), d(-3), d(-2), d(-1), HOY]);   // antes 2, ahora 4
  comprobar('Superar el tramo anterior sí es batir el récord', resumenRacha(superando, R, HOY).batiendoRecord === true);
}

/* ===========================================================================
   RACHA GLOBAL (apartado 13)
   =========================================================================== */
console.log('\n═══ Racha global ═══\n');
{
  const entreno = normalizarRacha({ id: 'g1', tipo: 'training', nombre: 'Entrenamiento' });
  const estudio = normalizarRacha({ id: 'g2', tipo: 'study', nombre: 'Estudio' });
  const eventos = [
    ...ev([d(-3), d(-2), HOY], 'g1'),        // le falta d(-1)
    ...ev([d(-1)], 'g2'),                     // justo el día que le falta a la otra
  ];
  const global = rachaGlobal(eventos, [entreno, estudio], HOY);

  comprobar('CLAVE · La global cuenta días con al menos una racha cumplida', global.actual === 4, String(global.actual));
  comprobar('...y no sustituye a las individuales', rachaActual(eventos, entreno, HOY) === 1);
  // Las dos están vivas: la de entreno porque hoy está cumplido, y la de estudio
  // porque ayer lo estuvo y hoy solo está PENDIENTE, que no la rompe (apartado 8).
  comprobar('...sino que señala cuáles están vivas',
    global.contribuyen.length === 2 && global.contribuyen.every((c) => c.dias === 1),
    JSON.stringify(global.contribuyen));
  comprobar('...y una racha muerta no aparece entre ellas',
    rachaGlobal(ev([d(-9), d(-8)], 'g1'), [entreno, estudio], HOY).contribuyen.length === 0);
  comprobar('Su récord también se deriva', global.record === 4);
  comprobar('Sin rachas definidas, la global no inventa nada', rachaGlobal([], [], HOY).actual === 0);
  comprobar('Una racha desactivada no cuenta para la global',
    rachaGlobal(eventos, [{ ...entreno, activa: false }, estudio], HOY).actual === 1);
}

/* ===========================================================================
   MIGRACIÓN DE LOS HÁBITOS (apartados 17, 24 y 25)
   =========================================================================== */
console.log('\n═══ Hábitos: los contadores guardados desaparecen ═══\n');
{
  const habito = { id: 'h9', nombre: 'Leer', historial: { [d(-3)]: true, [d(-2)]: true, [d(-1)]: true }, rachaActual: 99, mejorRacha: 99 };

  comprobar('Un hábito se ve como una racha', rachaDeHabito(habito).tipo === 'habits');
  comprobar('...con la regla de siempre, con margen', rachaDeHabito(habito).regla.clase === 'diaria_con_gracia');
  comprobar('Su historial se lee como eventos', eventosDeHistorial('h9', habito.historial).length === 3);
  comprobar('...ignorando los días marcados como falsos', eventosDeHistorial('h9', { [HOY]: false }).length === 0);
  comprobar('...y sin romperse si no hay historial', eventosDeHistorial('h9', undefined).length === 0);

  const r = resumenHabito(habito, HOY);
  comprobar('CLAVE · La racha del hábito se DERIVA: 3, no el 99 guardado', r.actual === 3, String(r.actual));
  comprobar('CLAVE · ...y el récord también: 3, no 99', r.record === 3, String(r.record));
  comprobar('...y hoy está pendiente, no perdido', r.estado === ESTADOS_RACHA.PENDIENTE);

  const marcado = alternarHabito(habito, HOY);
  comprobar('Marcar hoy lo añade al historial', marcado.historial[HOY] === true);
  comprobar('CLAVE · ...y BORRA los contadores guardados',
    marcado.rachaActual === undefined && marcado.mejorRacha === undefined);
  comprobar('...la racha derivada sube a 4', resumenHabito(marcado, HOY).actual === 4);

  const desmarcado = alternarHabito(marcado, HOY);
  comprobar('Desmarcar lo quita del historial', desmarcado.historial[HOY] === undefined);
  comprobar('...y la racha vuelve a 3', resumenHabito(desmarcado, HOY).actual === 3);

  // El fallo real del código anterior: desmarcar restaba uno al contador a mano,
  // así que desmarcar y volver a marcar SUBÍA el récord sin cumplir nada.
  let ciclo = habito;
  const recordAntes = resumenHabito(ciclo, HOY).record;
  for (let i = 0; i < 10; i++) ciclo = alternarHabito(alternarHabito(ciclo, HOY), HOY);
  comprobar('CLAVE · Marcar y desmarcar diez veces NO infla el récord',
    resumenHabito(ciclo, HOY).record === recordAntes, `${resumenHabito(ciclo, HOY).record} vs ${recordAntes}`);
  comprobar('...ni el historial', Object.keys(ciclo.historial).length === 3);

  comprobar('Un hábito sin historial no revienta', resumenHabito({ id: 'z', nombre: 'x' }, HOY).actual === 0);
  comprobar('Alternar un hábito vacío tampoco', alternarHabito(undefined, HOY).historial[HOY] === true);
  comprobar('Un hábito con margen sobrevive a un día suelto',
    resumenHabito({ id: 'h', historial: { [d(-3)]: true, [d(-1)]: true, [HOY]: true } }, HOY).actual === 3);
}

/* ===========================================================================
   CASOS EXTREMOS (apartado 21)
   =========================================================================== */
console.log('\n═══ Casos extremos ═══\n');
{
  // Abrir la app después de varios días fuera.
  const vieja = ev([d(-20), d(-19), d(-18)]);
  comprobar('Volver tras semanas: la racha está rota, no viva', rachaActual(vieja, R, HOY) === 0);
  comprobar('...pero el récord se conserva', mejorRacha(vieja, R, HOY) === 3);
  comprobar('...y el historial también', historialDeRachas(vieja, R, HOY)[0].dias === 3);

  // Borrar la actividad que sostenía una racha (apartado 21).
  const conHoy = ev([d(-2), d(-1), HOY]);
  comprobar('Borrar el día de en medio parte la racha',
    rachaActual(conHoy.filter((e) => e.fecha !== d(-1)), R, HOY) === 1);

  // Restaurar datos: volver a meter el evento devuelve la racha entera.
  comprobar('Restaurarlo la devuelve entera',
    rachaActual(registrarCumplimiento(conHoy.filter((e) => e.fecha !== d(-1)), { rachaId: 'r1', fecha: d(-1) }), R, HOY) === 3);

  // Eventos de otra racha no contaminan.
  comprobar('Los eventos de otra racha no cuentan', rachaActual(ev([d(-1), HOY], 'otra'), R, HOY) === 0);

  // Entradas basura.
  comprobar('Un evento sin fecha se ignora', Object.keys(indicePorFecha([{ rachaId: 'r1' }], 'r1')).length === 0);
  comprobar('Una lista nula no rompe', rachaActual(null, R, HOY) === 0);
  comprobar('Una racha nula tampoco', typeof rachaActual([], null, HOY) === 'number');

  // Una racha muy larga se recorre entera sin colgarse.
  const larga = [];
  for (let i = 400; i >= 0; i--) larga.push(d(-i));
  comprobar('Una racha de 401 días se calcula entera', rachaActual(ev(larga), R, HOY) === 401);
  comprobar('...y su porcentaje es 100', estadisticasRacha(ev(larga), R, HOY).porcentaje === 100);
}

/* ===========================================================================
   LO QUE ESTA FASE NO HACE (apartado 22)
   =========================================================================== */
console.log('\n═══ Sin gamificación (apartado 22) ═══\n');
{
  const r = resumenRacha(ev([d(-1), HOY]), R, HOY);
  const claves = Object.keys(r);
  const prohibidas = ['xp', 'nivel', 'puntos', 'medallas', 'logros', 'monedas', 'ranking', 'confeti', 'sonido'];
  comprobar('CLAVE · El resumen no trae XP, niveles, puntos ni medallas',
    prohibidas.every((p) => !claves.some((k) => k.toLowerCase().includes(p))), claves.join(','));
  comprobar('El motor no guarda ningún contador: todo sale del historial',
    !claves.includes('rachaGuardada') && !claves.includes('contador'));
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
