// ============================================================================
// RA · Fase 2/4 — Pruebas de la capa persistente
//
// El apartado 27 pide diez casos por su nombre. Están todos, marcados
// «CASO N», y alrededor lo que sostiene cada uno: idempotencia, aislamiento,
// recálculo, cola offline e invalidación por origen.
// ============================================================================

import {
  ESTADO_INICIAL, normalizarEstado, validarNuevaRacha,
  crearRacha, eliminarRacha, completarDia, deshacerDia,
  invalidarPorOrigen, cumplimientosDeOrigen,
  recalcularRacha, recalcularTodo, revisarIntegridad, repararEstado,
  encolar, vaciarCola, hayPendientes,
  panelRachas, panelRacha, panelHabitos,
  HITOS, EVENTOS_RACHA, siguienteHito, eventosDeRacha, eventosDeHabitos,
} from '../src/lib/rachasServicio.js';
import { ESTADOS_RACHA, ESTADOS_DIA } from '../src/lib/rachas.js';
import { addDays } from '../src/lib/helpers.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-26';
const d = (n) => addDays(HOY, n);

/** Un estado con una racha diaria ya creada. */
function conRacha(datos = {}) {
  const { estado, racha } = crearRacha(ESTADO_INICIAL, { tipo: 'training', nombre: 'Entreno', ...datos }, HOY);
  return { estado, racha };
}
/** Completa una lista de días de golpe. */
function completarDias(estado, rachaId, fechas, extra = {}) {
  let acc = estado;
  for (const f of fechas) acc = completarDia(acc, { rachaId, fecha: f, ...extra }).estado;
  return acc;
}

/* ===========================================================================
   MODELO Y CREACIÓN (apartados 3 y 9)
   =========================================================================== */
console.log('\n═══ RA Fase 2 — modelo y creación ═══\n');
{
  comprobar('El estado inicial trae las tres listas',
    Array.isArray(ESTADO_INICIAL.definiciones) && Array.isArray(ESTADO_INICIAL.eventos) && Array.isArray(ESTADO_INICIAL.pendientes));
  comprobar('Un estado nulo se normaliza sin romperse', normalizarEstado(null).definiciones.length === 0);
  comprobar('Un estado con basura se sanea', normalizarEstado({ definiciones: 'no', eventos: 5 }).eventos.length === 0);
  comprobar('Un cumplimiento sin racha ni fecha se descarta',
    normalizarEstado({ eventos: [{ id: 'x' }, { rachaId: 'a', fecha: HOY }] }).eventos.length === 1);

  const { estado, racha } = conRacha();
  comprobar('Crear una racha la añade', estado.definiciones.length === 1);
  comprobar('...y la devuelve', racha && racha.nombre === 'Entreno');
  comprobar('...con su tipo y su regla', racha.tipo === 'training' && racha.regla.clase === 'diaria');

  // Apartado 9 — configuraciones inválidas.
  comprobar('Un tipo inventado se rechaza', crearRacha(ESTADO_INICIAL, { tipo: 'zzz' }, HOY).error !== null);
  comprobar('CLAVE · Una regla de mínimo SIN objetivo se rechaza',
    crearRacha(ESTADO_INICIAL, { tipo: 'study', regla: { clase: 'minimo' } }, HOY).error !== null);
  comprobar('...porque si no, ningún día podría cumplirse nunca',
    validarNuevaRacha(ESTADO_INICIAL, { tipo: 'study', regla: { clase: 'minimo', valor: 0 } }).ok === false);
  comprobar('Con objetivo sí se acepta',
    crearRacha(ESTADO_INICIAL, { tipo: 'study', regla: { clase: 'minimo', valor: 30 } }, HOY).error === null);
  comprobar('Dos rachas con el mismo nombre se rechazan', crearRacha(estado, { tipo: 'study', nombre: 'Entreno' }, HOY).error !== null);
  comprobar('...y el estado no se toca al rechazar', crearRacha(estado, { tipo: 'zzz' }, HOY).estado.definiciones.length === 1);

  // Apartado 9 — nada de cumplimientos huérfanos.
  comprobar('CLAVE · No se puede completar una racha que no existe',
    completarDia(estado, { rachaId: 'fantasma', fecha: HOY }).error !== null);
  comprobar('...y no se guarda nada', completarDia(estado, { rachaId: 'fantasma' }).estado.eventos.length === 0);

  const borrado = eliminarRacha(completarDias(estado, racha.id, [HOY]), racha.id);
  comprobar('Borrar una racha se lleva sus cumplimientos', borrado.eventos.length === 0 && borrado.definiciones.length === 0);
}

/* ===========================================================================
   LOS DIEZ CASOS DEL APARTADO 27
   =========================================================================== */
console.log('\n═══ Los diez casos del apartado 27 ═══\n');
{
  const { estado, racha } = conRacha();
  const r = (e) => recalcularRacha(e, racha.id, HOY);

  // CASO 1 — un día completado → current 1, longest 1.
  const c1 = r(completarDias(estado, racha.id, [HOY]));
  comprobar('CASO 1 · Un día → current 1, longest 1', c1.currentStreak === 1 && c1.longestStreak === 1);

  // CASO 2 — tres consecutivos → 3 y 3.
  const c2 = r(completarDias(estado, racha.id, [d(-2), d(-1), HOY]));
  comprobar('CASO 2 · Tres seguidos → current 3, longest 3', c2.currentStreak === 3 && c2.longestStreak === 3);
  comprobar('...con su fecha de inicio', c2.currentStartDate === d(-2));
  comprobar('...y su último día cumplido', c2.lastCompletedDate === HOY);

  // CASO 3 — tres + día perdido → current 0, longest 3.
  const c3 = r(completarDias(estado, racha.id, [d(-4), d(-3), d(-2)]));
  comprobar('CASO 3 · Tres y un día perdido → current 0, longest 3', c3.currentStreak === 0 && c3.longestStreak === 3);
  comprobar('...y el estado es ROTA', c3.estado === ESTADOS_RACHA.ROTA);

  // CASO 4 — tres + perdido + dos → current 2, longest 3.
  const c4 = r(completarDias(estado, racha.id, [d(-6), d(-5), d(-4), d(-1), HOY]));
  comprobar('CASO 4 · Tres, perdido y dos → current 2, longest 3', c4.currentStreak === 2 && c4.longestStreak === 3);

  // CASO 5 — duplicar cumplimiento → un solo día.
  let dup = estado;
  for (let i = 0; i < 7; i++) dup = completarDia(dup, { rachaId: racha.id, fecha: HOY }).estado;
  comprobar('CASO 5 · Duplicar siete veces → un único día', dup.eventos.length === 1);
  comprobar('...y la racha vale 1, no 7', r(dup).currentStreak === 1);

  // CASO 6 — dos dispositivos completando el mismo día → un solo día.
  const iphone = completarDia(estado, { rachaId: racha.id, fecha: HOY, origen: 'manual', origenId: 'iphone' }).estado;
  const ordenador = completarDia(iphone, { rachaId: racha.id, fecha: HOY, origen: 'manual', origenId: 'ordenador' }).estado;
  comprobar('CASO 6 · Dos dispositivos, el mismo día → un único día', ordenador.eventos.length === 1);
  comprobar('...y gana el último que escribió', ordenador.eventos[0].origenId === 'ordenador');

  // CASO 7 — el día actual pendiente → pending, sin romper la racha.
  const c7e = completarDias(estado, racha.id, [d(-2), d(-1)]);
  const c7 = r(c7e);
  comprobar('CASO 7 · Hoy pendiente → la racha NO se rompe', c7.currentStreak === 2);
  comprobar('...y el estado lo dice: pendiente', c7.estado === ESTADOS_RACHA.PENDIENTE);
  comprobar('...y hoy figura como PENDIENTE, no perdido',
    panelRacha(c7e, racha.id, HOY).estadoHoy === ESTADOS_DIA.PENDIENTE);

  // CASO 8 — cambio de zona horaria: la fecha lógica manda sobre el timestamp.
  // El mismo instante UTC puede ser dos días locales distintos. Lo que decide es
  // la `fecha` que se guardó, no `registradoEn`.
  const nocturno = completarDia(estado, { rachaId: racha.id, fecha: HOY }).estado;
  const movido = { ...nocturno, eventos: nocturno.eventos.map((e) => ({ ...e, registradoEn: `${d(1)}T04:00:00.000Z` })) };
  comprobar('CASO 8 · Cambiar el timestamp NO cambia el día de la racha', r(movido).currentStreak === 1);
  comprobar('...porque el día lógico sigue siendo el guardado', movido.eventos[0].fecha === HOY);
  const c8 = completarDias(estado, racha.id, ['2025-12-31', '2026-01-01']);
  comprobar('...y la racha cruza el fin de año', recalcularRacha(c8, racha.id, '2026-01-01').currentStreak === 2);

  // CASO 9 — usuario sin historial → 0 y 0.
  const c9 = r(estado);
  comprobar('CASO 9 · Sin historial → current 0, longest 0', c9.currentStreak === 0 && c9.longestStreak === 0);
  comprobar('...y no dice "rota", dice "sin datos"', c9.estado === ESTADOS_RACHA.SIN_DATOS);

  // CASO 10 — contadores corruptos → recalculate() reconstruye.
  const corrupto = {
    ...completarDias(estado, racha.id, [d(-1), HOY]),
    definiciones: [{ ...racha, currentStreak: 9999, longestStreak: 9999 }],
  };
  const revision = revisarIntegridad(corrupto, HOY);
  comprobar('CASO 10 · Un contador guardado se DETECTA', !revision.ok && revision.problemas.some((p) => p.tipo === 'contador_guardado'));
  comprobar('...y recalcular da el valor real, no el 9999', r(corrupto).currentStreak === 2);
  const reparado = repararEstado(corrupto, HOY);
  comprobar('...y reparar lo quita del objeto', reparado.definiciones[0].currentStreak === undefined);
  comprobar('...sin tocar el historial', reparado.eventos.length === 2);
  comprobar('Un estado sano pasa la revisión', revisarIntegridad(completarDias(estado, racha.id, [HOY]), HOY).ok === true);
}

/* ===========================================================================
   NO CONFIAR EN EL CLIENTE (apartados 4 y 11)
   =========================================================================== */
console.log('\n═══ Aislamiento y contadores no manipulables ═══\n');
{
  const { estado, racha } = conRacha();

  // Apartado 11 — mandar `{currentStreak: 9999}` no tiene dónde aterrizar.
  const intento = completarDia({ ...estado, definiciones: [{ ...racha, currentStreak: 9999 }] }, { rachaId: racha.id, fecha: HOY }).estado;
  comprobar('CLAVE · Un currentStreak inyectado NO cambia la racha real',
    recalcularRacha(intento, racha.id, HOY).currentStreak === 1);
  comprobar('...y el panel tampoco lo lee', panelRacha(intento, racha.id, HOY).actual === 1);

  // Apartado 4 — el modelo no tiene user_id, así que no hay ninguno que falsear.
  const conDatos = completarDias(estado, racha.id, [HOY]);
  comprobar('CLAVE · Ninguna racha guarda un user_id',
    conDatos.definiciones.every((x) => x.user_id === undefined && x.userId === undefined));
  comprobar('CLAVE · Ningún cumplimiento guarda un user_id',
    conDatos.eventos.every((x) => x.user_id === undefined && x.userId === undefined));
  comprobar('...así que el cliente no puede pedir la racha de otro',
    !JSON.stringify(conDatos).includes('user_id'));

  // Apartado 20 — auditoría mínima, sin guardar de más.
  const evento = conDatos.eventos[0];
  comprobar('Un cumplimiento guarda cuándo se registró', typeof evento.registradoEn === 'string');
  comprobar('...y de dónde vino', evento.origen === 'manual');
  comprobar('...y nada innecesario', Object.keys(evento).sort().join(',') === 'fecha,id,origen,origenId,rachaId,registradoEn,valor');
}

/* ===========================================================================
   ORIGEN E INVALIDACIÓN (apartados 18 y 19)
   =========================================================================== */
console.log('\n═══ Origen del cumplimiento e invalidación ═══\n');
{
  const { estado, racha } = conRacha();
  let e = completarDias(estado, racha.id, [d(-2), d(-1)]);
  e = completarDia(e, { rachaId: racha.id, fecha: HOY, origen: 'training', origenId: 'sesion-77' }).estado;

  comprobar('Un cumplimiento sabe de qué actividad vino',
    e.eventos.find((x) => x.fecha === HOY).origenId === 'sesion-77');
  comprobar('...y se puede buscar por origen', cumplimientosDeOrigen(e, 'training', 'sesion-77').length === 1);
  comprobar('La racha vale 3', recalcularRacha(e, racha.id, HOY).currentStreak === 3);

  // El caso literal del apartado 18: se borra el entrenamiento que la sostenía.
  const sinSesion = invalidarPorOrigen(e, 'training', 'sesion-77');
  comprobar('CLAVE · Al borrar la actividad, su día desaparece', sinSesion.eventos.length === 2);
  comprobar('CLAVE · ...y la racha se corrige SOLA, sin recalcular a mano',
    recalcularRacha(sinSesion, racha.id, HOY).currentStreak === 2);
  comprobar('Invalidar un origen que no existe no toca nada',
    invalidarPorOrigen(e, 'training', 'otra').eventos.length === 3);
  comprobar('Invalidar sin id no borra media base de datos', invalidarPorOrigen(e, 'training', null).eventos.length === 3);

  comprobar('Deshacer un día lo quita', deshacerDia(e, racha.id, HOY).eventos.length === 2);
}

/* ===========================================================================
   COLA OFFLINE (apartados 15, 16 y 17)
   =========================================================================== */
console.log('\n═══ Cola offline y sincronización ═══\n');
{
  const { estado, racha } = conRacha();
  comprobar('Sin cola no hay nada pendiente', hayPendientes(estado) === false);

  // Sin conexión: el cumplimiento se apunta.
  let e = encolar(estado, { rachaId: racha.id, fecha: HOY, valor: 1, origen: 'manual' });
  comprobar('Un cumplimiento sin conexión se encola', e.pendientes.length === 1 && hayPendientes(e));
  comprobar('...y todavía no cuenta como cumplido', recalcularRacha(e, racha.id, HOY).currentStreak === 0);

  // Encolar lo mismo dos veces no lo duplica.
  e = encolar(e, { rachaId: racha.id, fecha: HOY, valor: 1, origen: 'manual' });
  comprobar('Encolar el mismo día dos veces no lo duplica', e.pendientes.length === 1);

  // Vuelve la conexión.
  const sincronizado = vaciarCola(e);
  comprobar('Al sincronizar, el día cuenta', recalcularRacha(sincronizado, racha.id, HOY).currentStreak === 1);
  comprobar('...y la cola queda vacía', sincronizado.pendientes.length === 0);

  // CLAVE — reintentar es idempotente. Sin esto, una mala conexión inflaría rachas.
  comprobar('CLAVE · Vaciar la cola dos veces da el mismo resultado',
    vaciarCola(sincronizado).eventos.length === 1);
  let repetido = e;
  for (let i = 0; i < 5; i++) repetido = vaciarCola(encolar(repetido, { rachaId: racha.id, fecha: HOY, valor: 1 }));
  comprobar('CLAVE · Cinco reintentos siguen siendo UN día', repetido.eventos.length === 1,
    String(repetido.eventos.length));
  comprobar('...y la racha sigue valiendo 1', recalcularRacha(repetido, racha.id, HOY).currentStreak === 1);

  // Borrar la racha limpia también su cola.
  comprobar('Borrar una racha vacía su cola', eliminarRacha(e, racha.id).pendientes.length === 0);
}

/* ===========================================================================
   INTEGRIDAD Y REPARACIÓN
   =========================================================================== */
console.log('\n═══ Integridad del estado ═══\n');
{
  const { estado, racha } = conRacha();
  const base = completarDias(estado, racha.id, [d(-1), HOY]);

  const huerfano = { ...base, eventos: [...base.eventos, { id: 'z', rachaId: 'fantasma', fecha: HOY, valor: 1, registradoEn: `${HOY}T10:00:00Z` }] };
  comprobar('Un cumplimiento huérfano se detecta', revisarIntegridad(huerfano, HOY).problemas.some((p) => p.tipo === 'huerfanos'));
  comprobar('...y reparar lo quita', repararEstado(huerfano, HOY).eventos.length === 2);

  const duplicado = { ...base, eventos: [...base.eventos, { ...base.eventos[0], id: 'otro' }] };
  comprobar('Un día duplicado se detecta', revisarIntegridad(duplicado, HOY).problemas.some((p) => p.tipo === 'duplicados'));
  comprobar('...y reparar deja uno solo', repararEstado(duplicado, HOY).eventos.length === 2);

  const futuro = { ...base, eventos: [...base.eventos, { id: 'f', rachaId: racha.id, fecha: d(5), valor: 1, registradoEn: `${HOY}T10:00:00Z` }] };
  comprobar('Un cumplimiento con fecha futura se detecta', revisarIntegridad(futuro, HOY).problemas.some((p) => p.tipo === 'futuros'));
  comprobar('...y reparar lo quita', repararEstado(futuro, HOY).eventos.length === 2);
  comprobar('Reparar un estado sano no cambia nada', repararEstado(base, HOY).eventos.length === 2);

  comprobar('Recalcular todo devuelve una entrada por racha', recalcularTodo(base, HOY).length === 1);
  comprobar('Recalcular una racha que no existe devuelve null', recalcularRacha(base, 'zzz', HOY) === null);
}

/* ===========================================================================
   PANEL Y RENDIMIENTO (apartados 14 y 24)
   =========================================================================== */
console.log('\n═══ El panel, fuente única para las pantallas ═══\n');
{
  let e = ESTADO_INICIAL;
  const a = crearRacha(e, { tipo: 'training', nombre: 'Entreno' }, HOY); e = a.estado;
  const b = crearRacha(e, { tipo: 'study', nombre: 'Estudio' }, HOY); e = b.estado;
  e = completarDias(e, a.racha.id, [d(-3), d(-2), d(-1), HOY]);
  e = completarDias(e, b.racha.id, [d(-1), HOY]);

  const panel = panelRachas(e, HOY);
  comprobar('El panel trae las dos rachas', panel.rachas.length === 2);
  comprobar('...y la principal es la más larga', panel.principal.nombre === 'Entreno' && panel.principal.actual === 4);
  comprobar('...con la global por encima', panel.global.actual === 4);
  comprobar('CLAVE · El panel y el recálculo nunca discrepan',
    panel.rachas.find((x) => x.id === a.racha.id).actual === recalcularRacha(e, a.racha.id, HOY).currentStreak);
  comprobar('Una racha desactivada no sale en el panel',
    panelRachas({ ...e, definiciones: e.definiciones.map((x) => ({ ...x, activa: false })) }, HOY).rachas.length === 0);
  comprobar('Sin rachas, el panel no inventa una principal', panelRachas(ESTADO_INICIAL, HOY).principal === null);
  comprobar('El detalle de una racha que no existe es null', panelRacha(e, 'zzz', HOY) === null);
  comprobar('El panel cuenta lo que falta por sincronizar', panelRachas(encolar(e, { rachaId: a.racha.id, fecha: d(1) }), HOY).pendientesDeSincronizar === 1);
}

/* ===========================================================================
   EVENTOS PARA NOTIFICACIONES Y HITOS (apartados 25 y 26)
   =========================================================================== */
console.log('\n═══ Eventos, hitos y ausencia de gamificación ═══\n');
{
  const { estado, racha } = conRacha();

  const completadaHoy = completarDias(estado, racha.id, [d(-1), HOY]);
  const ev1 = eventosDeRacha(completadaHoy, HOY);
  comprobar('Cumplir hoy emite "completada"', ev1.some((x) => x.tipo === EVENTOS_RACHA.COMPLETADA));

  const pendiente = completarDias(estado, racha.id, [d(-2), d(-1)]);
  const ev2 = eventosDeRacha(pendiente, HOY);
  comprobar('CLAVE · Con hoy pendiente emite "en riesgo", NO "rota"',
    ev2.some((x) => x.tipo === EVENTOS_RACHA.EN_RIESGO) && !ev2.some((x) => x.tipo === EVENTOS_RACHA.ROTA));

  const rota = completarDias(estado, racha.id, [d(-6), d(-5)]);
  const ev3 = eventosDeRacha(rota, HOY);
  comprobar('Una racha cortada emite "rota"', ev3.some((x) => x.tipo === EVENTOS_RACHA.ROTA));
  comprobar('...diciendo cuál fue el último día', ev3.find((x) => x.tipo === EVENTOS_RACHA.ROTA).ultimo === d(-5));

  // Hito: se anuncia el día que se alcanza, no todos los días después.
  const siete = completarDias(estado, racha.id, [d(-6), d(-5), d(-4), d(-3), d(-2), d(-1), HOY]);
  comprobar('Al llegar a 7 días se emite el hito', eventosDeRacha(siete, HOY).some((x) => x.tipo === EVENTOS_RACHA.HITO && x.hito === 7));
  const ocho = completarDias(estado, racha.id, [d(-7), d(-6), d(-5), d(-4), d(-3), d(-2), d(-1), HOY]);
  comprobar('CLAVE · A los 8 días NO se repite el hito de 7',
    !eventosDeRacha(ocho, HOY).some((x) => x.tipo === EVENTOS_RACHA.HITO));

  comprobar('El siguiente hito de 3 días es 7', siguienteHito(3).objetivo === 7 && siguienteHito(3).faltan === 4);
  comprobar('...con su porcentaje', siguienteHito(3).progreso === 43);
  comprobar('CLAVE · Pasado el último hito NO se inventa uno nuevo', siguienteHito(500) === null);
  comprobar('Los hitos son números de referencia, no logros', HITOS.every((h) => typeof h === 'number'));

  // Apartado 26 y D2-02: ni XP, ni niveles, ni medallas.
  const texto = JSON.stringify(eventosDeRacha(siete, HOY)) + JSON.stringify(panelRachas(siete, HOY));
  const prohibidas = ['xp', 'nivel', 'medalla', 'moneda', 'puntos', 'ranking'];
  comprobar('CLAVE · Ni el panel ni los eventos traen XP, niveles ni medallas',
    prohibidas.every((p) => !texto.toLowerCase().includes(p)));

  // Sin rachas no se emite nada. No hay avisos fantasma.
  comprobar('Sin rachas no se emite ningún evento', eventosDeRacha(ESTADO_INICIAL, HOY).length === 0);
}

/* ===========================================================================
   LOS HÁBITOS, POR EL MISMO SERVICIO (apartado 14)
   =========================================================================== */
console.log('\n═══ Los hábitos pasan por el servicio central ═══\n');
{
  const habitos = [
    { id: 'h1', nombre: 'Leer', historial: { [d(-2)]: true, [d(-1)]: true, [HOY]: true } },
    { id: 'h2', nombre: 'Estirar', historial: { [d(-8)]: true } },
    { id: 'h3', nombre: 'Nuevo', historial: {} },
  ];
  const panel = panelHabitos(habitos, HOY);
  comprobar('Los hábitos se consultan por el servicio', panel.rachas.length === 3);
  comprobar('...con su racha derivada', panel.rachas[0].actual === 3);
  comprobar('...y la principal es la más larga', panel.principal.nombre === 'Leer');
  comprobar('Un hábito sin historial no revienta', panel.rachas[2].actual === 0);

  const ev = eventosDeHabitos(habitos, HOY);
  comprobar('Un hábito cumplido hoy emite "completada"',
    ev.some((x) => x.tipo === EVENTOS_RACHA.COMPLETADA && x.nombre === 'Leer'));
  comprobar('Uno abandonado emite "rota"', ev.some((x) => x.tipo === EVENTOS_RACHA.ROTA && x.nombre === 'Estirar'));
  comprobar('Uno recién creado no emite nada', !ev.some((x) => x.nombre === 'Nuevo'));
  comprobar('Sin hábitos no se emite nada', eventosDeHabitos([], HOY).length === 0);
  comprobar('Sin hábitos tampoco hay principal', panelHabitos([], HOY).principal === null);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
