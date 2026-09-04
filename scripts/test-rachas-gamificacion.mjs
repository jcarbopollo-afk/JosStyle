// ============================================================================
// RA · Fase 3/4 — Pruebas de la capa de gamificación
//
// El apartado 34 pide diez pruebas por su nombre. Están todas, marcadas
// «PRUEBA», y alrededor lo que las sostiene: hitos irrepetibles, logros que no
// se desbloquean con un número inventado, y celebraciones que se reservan.
// ============================================================================

import {
  STREAK_MILESTONES, NIVELES_CELEBRACION, celebracionDeHito, progresoHaciaHito,
  DEFINICIONES_LOGRO, definicionLogro, ESTADOS_LOGRO, claveLogro,
  GAMIFICACION_INICIAL, normalizarGamificacion, EVENTOS_GAMIFICACION, evaluar,
  listaLogros, estadisticasGamificacion, diasDelMes, panelGamificacion,
  revisarLogros, revocarLogro, olvidarRacha,
} from '../src/lib/rachasGamificacion.js';
import { ESTADO_INICIAL, crearRacha, completarDia, eliminarRacha } from '../src/lib/rachasServicio.js';
import { ESTADOS_DIA } from '../src/lib/rachas.js';
import { addDays } from '../src/lib/helpers.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-26';
const d = (n) => addDays(HOY, n);

function conRacha(nombre = 'Entreno', tipo = 'training') {
  const { estado, racha } = crearRacha(ESTADO_INICIAL, { tipo, nombre }, HOY);
  return { estado, racha };
}
/** N días seguidos que terminan HOY. */
function seguidos(estado, rachaId, n, hasta = HOY) {
  let acc = estado;
  for (let i = n - 1; i >= 0; i--) acc = completarDia(acc, { rachaId, fecha: addDays(hasta, -i) }).estado;
  return acc;
}
const tipos = (eventos) => eventos.map((x) => x.tipo);

/* ===========================================================================
   HITOS Y PROGRESIÓN (apartados 2, 7 y 8)
   =========================================================================== */
console.log('\n═══ RA Fase 3 — hitos y progresión ═══\n');
{
  comprobar('Los doce hitos del apartado 2 están', STREAK_MILESTONES.length === 12, String(STREAK_MILESTONES.length));
  comprobar('...con los números exactos que pide',
    STREAK_MILESTONES.join(',') === '1,3,7,14,21,30,50,75,100,150,200,365', STREAK_MILESTONES.join(','));
  comprobar('CLAVE · Son UNA sola lista, no dos que puedan desincronizarse',
    STREAK_MILESTONES === (await import('../src/lib/rachasServicio.js')).HITOS);

  // Apartado 8 — el progreso se deriva, y se mide desde el hito anterior.
  const p = progresoHaciaHito(17);
  comprobar('Con 17 días el siguiente hito es 21', p.objetivo === 21 && p.faltan === 4);
  // Con 25 días: el hito anterior es 21 y el siguiente 30, así que va por el 44 %.
  // Medido desde cero saldría un 83 %, una barra casi llena que no se movería en
  // nueve días. Por eso se mide desde el hito anterior.
  const p25 = progresoHaciaHito(25);
  comprobar('CLAVE · El progreso se mide DESDE el hito anterior, no desde cero',
    p25.desde === 21 && p25.objetivo === 30 && p25.progreso === 44, JSON.stringify(p25));
  comprobar('...si no, la barra apenas se movería entre 200 y 365',
    progresoHaciaHito(210).progreso === 6, String(progresoHaciaHito(210).progreso));
  comprobar('Justo en un hito, el siguiente es el de después', progresoHaciaHito(30).objetivo === 50);
  comprobar('CLAVE · Pasado el último hito NO se inventa uno nuevo', progresoHaciaHito(400) === null);
  comprobar('Con cero días el primer hito es 1', progresoHaciaHito(0).objetivo === 1);

  // Apartado 24 — las celebraciones se reservan.
  comprobar('30, 100 y 365 son celebración GRANDE',
    [30, 100, 365].every((n) => celebracionDeHito(n) === NIVELES_CELEBRACION.GRANDE));
  comprobar('7 y 21 son celebración media',
    celebracionDeHito(7) === NIVELES_CELEBRACION.MEDIA && celebracionDeHito(21) === NIVELES_CELEBRACION.MEDIA);
  comprobar('CLAVE · Un día normal NO celebra nada grande', celebracionDeHito(17) === NIVELES_CELEBRACION.MICRO);
}

/* ===========================================================================
   LAS DIEZ PRUEBAS DEL APARTADO 34
   =========================================================================== */
console.log('\n═══ Las diez pruebas del apartado 34 ═══\n');
{
  const { estado, racha } = conRacha();

  // PRUEBA 1 — un día: detecta el primer hito.
  const p1 = evaluar(seguidos(estado, racha.id, 1), GAMIFICACION_INICIAL, HOY);
  comprobar('PRUEBA 1 · Un día detecta el primer hito',
    p1.eventos.some((x) => x.tipo === EVENTOS_GAMIFICACION.STREAK_MILESTONE_REACHED && x.hito === 1));
  comprobar('...y emite STREAK_STARTED, no CONTINUED', tipos(p1.eventos).includes(EVENTOS_GAMIFICACION.STREAK_STARTED));

  /* 🚨 **Volver no es empezar.** Retomar una racha rota cuesta más que
     estrenarla, y la biblioteca de sonido lo declara aparte desde la SO F4 —
     pero hasta el 2026-09-04 no lo emitía nadie y `streak_recovered.mp3` era un
     archivo que nada podía disparar.

     ⚠️ Se distingue por el historial y no por el récord: el récord incluye el
     día de hoy, así que una racha estrenada tendría récord 1 y se anunciaría
     como recuperada sin haber estado rota nunca. */
  const rota = ['2026-08-01', '2026-08-02', HOY].reduce((acc, f) => completarDia(acc, { rachaId: racha.id, fecha: f }).estado, estado);
  const pR = evaluar(rota, GAMIFICACION_INICIAL, HOY);
  comprobar('🚨 CLAVE · Retomar una racha rota emite STREAK_RECOVERED',
    tipos(pR.eventos).includes(EVENTOS_GAMIFICACION.STREAK_RECOVERED));
  comprobar('...y NO STREAK_STARTED, que es estrenarla',
    !tipos(pR.eventos).includes(EVENTOS_GAMIFICACION.STREAK_STARTED));
  comprobar('⚠️ Y una estrenada hoy sigue siendo STARTED, no recuperada',
    !tipos(p1.eventos).includes(EVENTOS_GAMIFICACION.STREAK_RECOVERED));

  // PRUEBA 2 — siete días: desbloquea su logro.
  const p2 = evaluar(seguidos(estado, racha.id, 7), GAMIFICACION_INICIAL, HOY);
  comprobar('PRUEBA 2 · Siete días desbloquean "Primera llama"',
    p2.eventos.some((x) => x.tipo === EVENTOS_GAMIFICACION.ACHIEVEMENT_UNLOCKED && x.logroId === 'primera_llama'));
  comprobar('...y el hito de 7', p2.eventos.some((x) => x.hito === 7));
  comprobar('...y se queda guardado', p2.gamificacion.desbloqueados.some((l) => l.definicionId === 'primera_llama'));

  // PRUEBA 3 — treinta días: hito y logro.
  const p3 = evaluar(seguidos(estado, racha.id, 30), GAMIFICACION_INICIAL, HOY);
  comprobar('PRUEBA 3 · Treinta días dan el hito de 30', p3.eventos.some((x) => x.hito === 30));
  comprobar('...y el logro "Imparable"', p3.eventos.some((x) => x.logroId === 'imparable'));
  comprobar('...con celebración GRANDE',
    p3.eventos.find((x) => x.hito === 30).celebracion === NIVELES_CELEBRACION.GRANDE);
  comprobar('CLAVE · ...y también los hitos intermedios que nunca se anunciaron',
    [1, 3, 7, 14, 21].every((h) => p3.eventos.some((x) => x.hito === h)));

  // PRUEBA 4 — cien días.
  const p4 = evaluar(seguidos(estado, racha.id, 100), GAMIFICACION_INICIAL, HOY);
  comprobar('PRUEBA 4 · Cien días dan el hito de 100', p4.eventos.some((x) => x.hito === 100));
  comprobar('...y el logro "Leyenda"', p4.eventos.some((x) => x.logroId === 'leyenda'));
  comprobar('...pero NO el de 150', !p4.eventos.some((x) => x.hito === 150));

  // PRUEBA 5 — récord superado.
  let conRecordViejo = seguidos(estado, racha.id, 3, d(-10));   // un tramo de 3 hace 10 días
  conRecordViejo = seguidos(conRecordViejo, racha.id, 5);        // y ahora uno de 5
  const p5 = evaluar(conRecordViejo, GAMIFICACION_INICIAL, HOY);
  comprobar('PRUEBA 5 · Superar el récord emite STREAK_PERSONAL_RECORD',
    tipos(p5.eventos).includes(EVENTOS_GAMIFICACION.STREAK_PERSONAL_RECORD));
  comprobar('...y desbloquea "Mejor que nunca"', p5.eventos.some((x) => x.logroId === 'nuevo_record'));
  comprobar('CLAVE · La PRIMERA racha de la vida NO cuenta como récord superado',
    !tipos(evaluar(seguidos(estado, racha.id, 5), GAMIFICACION_INICIAL, HOY).eventos)
      .includes(EVENTOS_GAMIFICACION.STREAK_PERSONAL_RECORD));

  // PRUEBA 6 — duplicación: no se desbloquea dos veces.
  const base = seguidos(estado, racha.id, 7);
  const primera = evaluar(base, GAMIFICACION_INICIAL, HOY);
  const segunda = evaluar(base, primera.gamificacion, HOY);
  comprobar('PRUEBA 6 · Evaluar dos veces NO desbloquea el logro otra vez',
    !segunda.eventos.some((x) => x.tipo === EVENTOS_GAMIFICACION.ACHIEVEMENT_UNLOCKED));
  comprobar('...ni repite el hito', !segunda.eventos.some((x) => x.hito));
  comprobar('...y solo hay un registro de cada', primera.gamificacion.desbloqueados.length === segunda.gamificacion.desbloqueados.length);
  // Apartado 12 — 9 → 10 no puede emitir el hito tres veces.
  let repetido = primera.gamificacion;
  for (let i = 0; i < 5; i++) repetido = evaluar(base, repetido, HOY).gamificacion;
  comprobar('CLAVE · Cinco evaluaciones seguidas dejan UN hito de 7', repetido.hitos[racha.id].filter((h) => h === 7).length === 1);

  // PRUEBA 7 — recarga: sigue desbloqueado.
  const recargado = normalizarGamificacion(JSON.parse(JSON.stringify(primera.gamificacion)));
  comprobar('PRUEBA 7 · Tras guardar y recargar, el logro sigue desbloqueado',
    recargado.desbloqueados.some((l) => l.definicionId === 'primera_llama'));
  comprobar('...con su fecha', recargado.desbloqueados[0].desbloqueadoEn === HOY);
  comprobar('...y no se vuelve a emitir', !evaluar(base, recargado, HOY).eventos.some((x) => x.tipo === EVENTOS_GAMIFICACION.ACHIEVEMENT_UNLOCKED));

  // PRUEBA 8 — otro dispositivo: se recupera igual.
  comprobar('PRUEBA 8 · Otro dispositivo lee los mismos logros',
    listaLogros(base, recargado, HOY).find((l) => l.id === 'primera_llama').estado === ESTADOS_LOGRO.DESBLOQUEADO);
  comprobar('...y los mismos hitos', recargado.hitos[racha.id].includes(7));

  // PRUEBA 9 — varias rachas, cada una con sus hitos.
  const { estado: e1, racha: r1 } = conRacha('Entreno', 'training');
  const dos = crearRacha(e1, { tipo: 'study', nombre: 'Estudio' }, HOY);
  let e2 = dos.estado;
  e2 = seguidos(e2, r1.id, 7);
  e2 = seguidos(e2, dos.racha.id, 3);
  const p9 = evaluar(e2, GAMIFICACION_INICIAL, HOY);
  comprobar('PRUEBA 9 · Cada racha lleva sus propios hitos',
    p9.gamificacion.hitos[r1.id].includes(7) && !p9.gamificacion.hitos[dos.racha.id].includes(7));
  comprobar('CLAVE · ...y el mismo logro se consigue por CADA racha',
    p9.gamificacion.desbloqueados.filter((l) => l.definicionId === 'primer_dia').length === 2);
  comprobar('...distinguidos por su clave', claveLogro('primer_dia', r1.id) !== claveLogro('primer_dia', dos.racha.id));

  // PRUEBA 10 — otro usuario no accede a logros ajenos.
  // No hay `user_id` en ninguna parte del modelo (decisión de RA F2): el estado
  // ES del usuario autenticado y viaja en su fila de `app_data`, protegida por
  // RLS. Así que no existe camino por el que pedir los de otro.
  comprobar('PRUEBA 10 · Ningún logro guarda un user_id',
    !JSON.stringify(primera.gamificacion).includes('user_id'));
  comprobar('...ni la lista que ve la interfaz', !JSON.stringify(listaLogros(base, primera.gamificacion, HOY)).includes('user_id'));
  comprobar('...y un estado vacío no hereda nada', normalizarGamificacion(null).desbloqueados.length === 0);
}

/* ===========================================================================
   ANTI-EXPLOIT (apartado 27) — el requisito con más filo
   =========================================================================== */
console.log('\n═══ Anti-exploit ═══\n');
{
  const { estado, racha } = conRacha();

  // El caso literal del apartado: currentStreak = 1000 sin días detrás.
  const inventado = { ...estado, definiciones: [{ ...racha, currentStreak: 1000, longestStreak: 1000 }] };
  const r = evaluar(inventado, GAMIFICACION_INICIAL, HOY);
  comprobar('CLAVE · Un currentStreak de 1000 inventado NO desbloquea nada',
    r.gamificacion.desbloqueados.length === 0, JSON.stringify(r.gamificacion.desbloqueados));
  comprobar('...ni emite ningún hito', !r.eventos.some((x) => x.hito));
  comprobar('...porque los logros se derivan del historial, y no hay ninguno',
    !r.eventos.some((x) => x.tipo === EVENTOS_GAMIFICACION.ACHIEVEMENT_UNLOCKED));

  // Con días reales sí, obviamente.
  comprobar('Con siete días de verdad sí se desbloquea',
    evaluar(seguidos(estado, racha.id, 7), GAMIFICACION_INICIAL, HOY).gamificacion.desbloqueados.length > 0);

  // Y un logro inyectado a mano en el estado guardado se descarta si no existe.
  const falso = normalizarGamificacion({ desbloqueados: [{ definicionId: 'logro_inventado', rachaId: null }] });
  comprobar('CLAVE · Un logro que no existe en el catálogo se descarta al cargar', falso.desbloqueados.length === 0);
  comprobar('Un hito inyectado con basura se limpia',
    normalizarGamificacion({ hitos: { x: ['siete', 7, 7] } }).hitos.x.join(',') === '7');
}

/* ===========================================================================
   LOGROS: ESTADOS, OCULTOS Y PROGRESO (apartados 17, 18 y 19)
   =========================================================================== */
console.log('\n═══ Logros: estados, ocultos y progreso ═══\n');
{
  const { estado, racha } = conRacha();
  const con10 = seguidos(estado, racha.id, 10);
  const { gamificacion } = evaluar(con10, GAMIFICACION_INICIAL, HOY);
  const lista = listaLogros(con10, gamificacion, HOY);

  comprobar('Cada logro trae su estado', lista.every((l) => [ESTADOS_LOGRO.BLOQUEADO, ESTADOS_LOGRO.DESBLOQUEADO].includes(l.estado)));
  comprobar('El de 7 está desbloqueado', lista.find((l) => l.id === 'primera_llama').estado === ESTADOS_LOGRO.DESBLOQUEADO);
  comprobar('El de 30 sigue bloqueado', lista.find((l) => l.id === 'imparable').estado === ESTADOS_LOGRO.BLOQUEADO);
  comprobar('...y enseña cuánto lleva', JSON.stringify(lista.find((l) => l.id === 'imparable').progreso) === '{"actual":10,"meta":30}');
  comprobar('CLAVE · Un logro ya desbloqueado NO enseña barra de progreso',
    lista.find((l) => l.id === 'primera_llama').progreso === null);

  // Apartado 17 — el oculto.
  const oculto = lista.find((l) => l.id === 'sin_fallar_un_mes');
  comprobar('CLAVE · Un logro oculto sin desbloquear se enseña como "???"', oculto.titulo === '???');
  comprobar('...y no cuenta de qué va', !oculto.desc.includes('mes entero'));
  comprobar('...pero se sabe que es oculto', oculto.oculto === true);

  // El de récord no ofrece progreso: nadie sabe cuánto le falta para batirse.
  comprobar('El logro de récord no inventa una barra', lista.find((l) => l.id === 'nuevo_record').progreso === null);

  comprobar('Un logro por racha se lista por cada racha', lista.filter((l) => l.id === 'primer_dia').length === 1);
  comprobar('Los logros de conjunto se listan una sola vez', lista.filter((l) => l.id === 'varias_frentes').length === 1);
  comprobar('Sin rachas, los logros por racha no se listan',
    listaLogros(ESTADO_INICIAL, GAMIFICACION_INICIAL, HOY).filter((l) => l.id === 'primera_llama').length === 0);
  comprobar('Una definición inventada no existe', definicionLogro('zzz') === null);
  comprobar('Las doce definiciones tienen id, título y condición',
    DEFINICIONES_LOGRO.every((x) => x.id && x.titulo && typeof x.condicion === 'function'));
  comprobar('...y ninguna repite id', new Set(DEFINICIONES_LOGRO.map((x) => x.id)).size === DEFINICIONES_LOGRO.length);
}

/* ===========================================================================
   LOGROS DE CONJUNTO Y RACHA GLOBAL (apartados 16 y 22)
   =========================================================================== */
console.log('\n═══ Logros de conjunto y racha global ═══\n');
{
  let e = ESTADO_INICIAL;
  const ids = [];
  for (const [tipo, nombre] of [['training', 'Entreno'], ['study', 'Estudio'], ['sleep', 'Sueño']]) {
    const c = crearRacha(e, { tipo, nombre }, HOY); e = c.estado; ids.push(c.racha.id);
  }
  for (const id of ids) e = seguidos(e, id, 3);
  const { gamificacion } = evaluar(e, GAMIFICACION_INICIAL, HOY);
  comprobar('Tres rachas vivas desbloquean "En varios frentes"',
    gamificacion.desbloqueados.some((l) => l.definicionId === 'varias_frentes'));
  comprobar('...con rachaId nulo, porque no es de ninguna en concreto',
    gamificacion.desbloqueados.find((l) => l.definicionId === 'varias_frentes').rachaId === null);

  // Apartado 22 — la global tiene una condición real, no es max(streaks).
  const panel = panelGamificacion(e, gamificacion, HOY);
  comprobar('CLAVE · La racha global NO sustituye a las individuales', panel.rachas.length === 3);
  comprobar('...y tiene su propia condición, no es max()', panel.global.actual === 3);
  comprobar('...señalando cuáles contribuyen', panel.global.contribuyen.length === 3);

  // Con dos rachas que se turnan, la global es mayor que cualquiera de ellas:
  // eso demuestra que NO es max(streaks).
  let turnos = ESTADO_INICIAL;
  const a = crearRacha(turnos, { tipo: 'training', nombre: 'A' }, HOY); turnos = a.estado;
  const b = crearRacha(turnos, { tipo: 'study', nombre: 'B' }, HOY); turnos = b.estado;
  for (const dia of [d(-3), d(-1)]) turnos = completarDia(turnos, { rachaId: a.racha.id, fecha: dia }).estado;
  for (const dia of [d(-2), HOY]) turnos = completarDia(turnos, { rachaId: b.racha.id, fecha: dia }).estado;
  const pg = panelGamificacion(turnos, GAMIFICACION_INICIAL, HOY);
  comprobar('CLAVE · Dos rachas que se turnan dan una global MAYOR que cualquiera',
    pg.global.actual === 4 && pg.rachas.every((r) => r.actual < 4), `global ${pg.global.actual}`);
}

/* ===========================================================================
   ESTADO DE LA RACHA Y EVENTOS (apartados 11 y 23)
   =========================================================================== */
console.log('\n═══ Eventos de gamificación ═══\n');
{
  const { estado, racha } = conRacha();

  comprobar('Empezar emite STREAK_STARTED',
    tipos(evaluar(seguidos(estado, racha.id, 1), GAMIFICACION_INICIAL, HOY).eventos).includes(EVENTOS_GAMIFICACION.STREAK_STARTED));
  comprobar('Continuar emite STREAK_CONTINUED',
    tipos(evaluar(seguidos(estado, racha.id, 4), GAMIFICACION_INICIAL, HOY).eventos).includes(EVENTOS_GAMIFICACION.STREAK_CONTINUED));

  const rota = seguidos(estado, racha.id, 3, d(-6));
  comprobar('Una racha cortada emite STREAK_BROKEN',
    tipos(evaluar(rota, GAMIFICACION_INICIAL, HOY).eventos).includes(EVENTOS_GAMIFICACION.STREAK_BROKEN));
  comprobar('...diciendo cuál era el récord',
    evaluar(rota, GAMIFICACION_INICIAL, HOY).eventos.find((x) => x.tipo === EVENTOS_GAMIFICACION.STREAK_BROKEN).record === 3);

  // Con hoy pendiente no se emite ni "rota" ni "continuada": no ha pasado nada
  // todavía. Es la política del apartado 8 de RA F1, respetada aquí.
  const pendiente = seguidos(estado, racha.id, 2, d(-1));
  const ev = tipos(evaluar(pendiente, GAMIFICACION_INICIAL, HOY).eventos);
  comprobar('CLAVE · Con hoy pendiente NO se emite "rota"', !ev.includes(EVENTOS_GAMIFICACION.STREAK_BROKEN));
  comprobar('...ni "continuada"', !ev.includes(EVENTOS_GAMIFICACION.STREAK_CONTINUED));

  // Apartado 23 — nada de recompensas constantes.
  const normal = evaluar(seguidos(estado, racha.id, 17), GAMIFICACION_INICIAL, HOY);
  const segundoDia = evaluar(seguidos(estado, racha.id, 18), normal.gamificacion, HOY);
  comprobar('CLAVE · Un día normal después de otro NO genera celebración',
    !segundoDia.eventos.some((x) => x.celebracion === NIVELES_CELEBRACION.GRANDE || x.celebracion === NIVELES_CELEBRACION.MEDIA));

  // Sin rachas no hay eventos fantasma.
  comprobar('Sin rachas no se emite nada', evaluar(ESTADO_INICIAL, GAMIFICACION_INICIAL, HOY).eventos.length === 0);
  comprobar('Una racha desactivada no emite nada',
    evaluar({ ...seguidos(estado, racha.id, 7), definiciones: [{ ...racha, activa: false }] }, GAMIFICACION_INICIAL, HOY).eventos.length === 0);
}

/* ===========================================================================
   SIN XP NI NIVELES (apartados 14, 15 y D2-02)
   =========================================================================== */
console.log('\n═══ Sin XP, niveles ni monedas ═══\n');
{
  const { estado, racha } = conRacha();
  const con30 = seguidos(estado, racha.id, 30);
  const { gamificacion, eventos } = evaluar(con30, GAMIFICACION_INICIAL, HOY);
  const texto = JSON.stringify({ gamificacion, eventos, panel: panelGamificacion(con30, gamificacion, HOY) }).toLowerCase();

  for (const palabra of ['"xp"', 'nivel', 'moneda', 'puntos', 'ranking', 'leaderboard']) {
    comprobar(`CLAVE · Nada de la gamificación contiene "${palabra}"`, !texto.includes(palabra));
  }
  comprobar('Las estadísticas cuentan logros, no puntos',
    Object.keys(estadisticasGamificacion(con30, gamificacion, HOY)).every((k) => !k.toLowerCase().includes('punto')));
}

/* ===========================================================================
   ESTADÍSTICAS, CALENDARIO Y PANEL (apartados 20, 21 y 36)
   =========================================================================== */
console.log('\n═══ Estadísticas, calendario y panel ═══\n');
{
  const { estado, racha } = conRacha();
  let e = seguidos(estado, racha.id, 3, d(-10));
  e = seguidos(e, racha.id, 5);
  const { gamificacion } = evaluar(e, GAMIFICACION_INICIAL, HOY);
  const stats = estadisticasGamificacion(e, gamificacion, HOY);

  comprobar('Los días totales cumplidos son 8', stats.diasTotalesCumplidos === 8, String(stats.diasTotalesCumplidos));
  comprobar('La mejor racha es 5', stats.mejorRacha === 5);
  comprobar('La actual es 5', stats.rachaActual === 5);
  comprobar('Las rachas completadas (tramos cerrados) son 1', stats.rachasCompletadas === 1);
  // Con 5 días, los hitos por debajo son el 1 y el 3. El 5 no es hito.
  comprobar('Los hitos alcanzados se cuentan', stats.hitosAlcanzados === 2, String(stats.hitosAlcanzados));
  comprobar('Los logros desbloqueados se cuentan', stats.logrosDesbloqueados > 0);
  comprobar('El porcentaje no es NaN', Number.isFinite(stats.porcentajeCumplimiento));
  comprobar('Sin rachas, las estadísticas son ceros y no NaN',
    Object.values(estadisticasGamificacion(ESTADO_INICIAL, GAMIFICACION_INICIAL, HOY)).every((v) => Number.isFinite(v)));

  // Apartado 21 — el estado de cada día, para el calendario de RA F4.
  const mes = diasDelMes(e, racha.id, 2026, 8, HOY);
  comprobar('El mes trae sus 31 días', mes.length === 31);
  comprobar('...cada uno con su estado', mes.every((x) => Object.values(ESTADOS_DIA).includes(x.estado)));
  comprobar('...hoy está completado', mes.find((x) => x.fecha === HOY).estado === ESTADOS_DIA.COMPLETADO);
  comprobar('...y los días de después son FUTURO', mes.find((x) => x.dia === 31).estado === ESTADOS_DIA.FUTURO);
  comprobar('Febrero de un bisiesto trae 29 días', diasDelMes(e, racha.id, 2028, 2, HOY).length === 29);
  comprobar('Una racha que no existe no da calendario', diasDelMes(e, 'zzz', 2026, 8, HOY).length === 0);

  // Apartado 36 — el panel trae todo lo que necesitará RA F4.
  const panel = panelGamificacion(e, gamificacion, HOY);
  for (const clave of ['rachas', 'principal', 'global', 'logros', 'desbloqueados', 'estadisticas']) {
    comprobar(`El panel trae "${clave}"`, panel[clave] !== undefined);
  }
  comprobar('...y cada racha con su progreso hacia el siguiente hito', panel.principal.hito.objetivo === 7);
  comprobar('Sin rachas, el panel no inventa una principal', panelGamificacion(ESTADO_INICIAL, GAMIFICACION_INICIAL, HOY).principal === null);
}

/* ===========================================================================
   REVOCACIÓN (apartado 28) — la decisión que había que tomar
   =========================================================================== */
console.log('\n═══ Un logro conseguido no se pierde solo ═══\n');
{
  const { estado, racha } = conRacha();
  const con7 = seguidos(estado, racha.id, 7);
  const { gamificacion } = evaluar(con7, GAMIFICACION_INICIAL, HOY);

  // Se corrige el historial y la racha baja. El logro NO se toca.
  const corregido = { ...con7, eventos: con7.eventos.filter((x) => x.fecha !== d(-3)) };
  const despues = evaluar(corregido, gamificacion, HOY);
  comprobar('CLAVE · Corregir el historial NO quita un logro ya conseguido',
    despues.gamificacion.desbloqueados.some((l) => l.definicionId === 'primera_llama'));
  comprobar('...pero los NÚMEROS sí se corrigen solos',
    panelGamificacion(corregido, despues.gamificacion, HOY).principal.actual === 3);

  // La revisión informa, no toca nada.
  const revision = revisarLogros(corregido, gamificacion, HOY);
  comprobar('La revisión avisa de que ya no cumpliría la condición', revision.sinRespaldo.some((l) => l.definicionId === 'primera_llama'));
  comprobar('...pero no lo borra', gamificacion.desbloqueados.some((l) => l.definicionId === 'primera_llama'));
  comprobar('...y dice cuántos siguen respaldados', Number.isFinite(revision.conservados));
  comprobar('Con el historial intacto no avisa de nada', revisarLogros(con7, gamificacion, HOY).sinRespaldo.length === 0);

  // Revocar es explícito.
  comprobar('Revocar a mano sí lo quita',
    !revocarLogro(gamificacion, 'primera_llama', racha.id).desbloqueados.some((l) => l.definicionId === 'primera_llama'));

  // Borrar la racha se lleva sus logros y sus hitos.
  const olvidada = olvidarRacha(gamificacion, racha.id);
  comprobar('Borrar una racha se lleva sus logros', !olvidada.desbloqueados.some((l) => l.rachaId === racha.id));
  comprobar('...y sus hitos', olvidada.hitos[racha.id] === undefined);
  comprobar('...sin tocar los de conjunto',
    olvidarRacha({ desbloqueados: [{ id: 'x', definicionId: 'varias_frentes', rachaId: null }], hitos: {} }, racha.id).desbloqueados.length === 1);
  comprobar('Y la racha se puede borrar del estado igualmente', eliminarRacha(con7, racha.id).definiciones.length === 0);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
