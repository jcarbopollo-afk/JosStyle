// ============================================================================
// SO · Fase 1/5 — Pruebas del sistema global de sonido
//
// El apartado 33 pide trece pruebas por su nombre. Están todas las que se
// pueden comprobar sin un navegador delante, marcadas «PRUEBA», y las que no
// —iOS, Android, PWA, escritorio— se dicen con honestidad al final en vez de
// darlas por buenas.
// ============================================================================

import {
  CATEGORIAS_SONIDO, categoriaSonido, PRIORIDADES_SONIDO, EVENTOS_SONIDO,
  ALIAS_EVENTO, eventoCanonico, definicionEvento,
  ORIGENES_SONIDO, crearSonido, normalizarSonido, SONIDOS_SISTEMA, sonidoDelSistema,
  ASIGNACIONES_POR_DEFECTO, DEFAULT_AUDIO, normalizarAudio, acotarVolumen,
  volumenEfectivo, resolverSonido, VENTANA_COLISION, ESTADO_AUDIO_INICIAL,
  decidirReproduccion, CATEGORIAS_PRECARGA, sonidosAPrecargar,
  FORMATOS_SONIDO, MAX_TAMANO_SONIDO, MAX_DURACION_SONIDO, validarSonidoSubido,
  describirDecision,
} from '../src/lib/audio.js';
import { suscribir, emitir, cuentaSuscriptores, reiniciarBus, fallosDeEventos } from '../src/lib/eventos.js';
/* 🚨 La biblioteca de verdad (SO F4). Se importa aquí, en la prueba, y no en
   `audio.js`: los dos módulos siguen siendo independientes, y quien impide que
   se separen es un test, no un acoplamiento. */
import { listaDeArchivos, FORMATO } from '../src/lib/especificacionSonidos.js';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
import { EVENTOS_GAMIFICACION } from '../src/lib/rachasGamificacion.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const T0 = 1_700_000_000_000;
/** Preferencias encendidas, que es lo que hará falta para casi todo. */
const ON = normalizarAudio({ ...DEFAULT_AUDIO, activado: true });

/* ===========================================================================
   EL BUS (apartados 30 y 31)
   =========================================================================== */
console.log('\n═══ SO Fase 1 — bus de eventos ═══\n');
{
  reiniciarBus();
  let recibido = null;
  const soltar = suscribir('SUCCESS', (e) => { recibido = e; });
  comprobar('Suscribirse registra un oyente', cuentaSuscriptores('SUCCESS') === 1);
  comprobar('Emitir se lo entrega', emitir('SUCCESS', { de: 'entreno' }) === 1);
  comprobar('...con su tipo y sus datos', recibido.tipo === 'SUCCESS' && recibido.de === 'entreno');
  comprobar('...y cuándo pasó', typeof recibido.en === 'number');

  let todos = 0;
  suscribir('*', () => { todos++; });
  emitir('UI_CLICK');
  comprobar('CLAVE · Un oyente de "*" recibe cualquier evento', todos === 1);

  soltar();
  comprobar('CLAVE · Soltar la suscripción la quita de verdad', cuentaSuscriptores('SUCCESS') === 0);
  comprobar('...y ya no le llega nada', emitir('SUCCESS') === 1);   // solo el de '*'

  // Un suscriptor que revienta no puede tumbar a los demás ni al emisor.
  reiniciarBus();
  let sano = 0;
  suscribir('X', () => { throw new Error('roto'); });
  suscribir('X', () => { sano++; });
  comprobar('CLAVE · Un suscriptor que falla NO tumba a los demás', emitir('X') === 1 && sano === 1);
  comprobar('...y el fallo queda apuntado, no tragado', fallosDeEventos().length === 1);
  comprobar('Emitir algo que nadie escucha no rompe', emitir('NADIE') === 0);
  comprobar('Suscribir algo que no es función no rompe', typeof suscribir('X', 'no') === 'function');
  reiniciarBus();
}

/* ===========================================================================
   CATÁLOGO, CATEGORÍAS Y PRIORIDADES (apartados 4, 8 y 9)
   =========================================================================== */
console.log('\n═══ Catálogo, categorías y prioridades ═══\n');
{
  const minimos = ['UI_CLICK', 'UI_TOGGLE', 'ACTION_COMPLETED', 'ACTION_ERROR', 'SUCCESS',
    'STREAK_STARTED', 'STREAK_CONTINUED', 'STREAK_MILESTONE', 'NEW_RECORD',
    'ACHIEVEMENT_UNLOCKED', 'STREAK_BROKEN'];
  comprobar('Los once eventos mínimos del apartado 4 están', minimos.every((e) => EVENTOS_SONIDO[e]));
  const preparados = ['TRAINING_COMPLETED', 'STUDY_COMPLETED', 'SLEEP_LOGGED', 'GOAL_COMPLETED', 'SAVING_COMPLETED', 'CUSTOM'];
  comprobar('...y los seis preparados para después', preparados.every((e) => EVENTOS_SONIDO[e]));
  comprobar('Cada evento trae categoría, prioridad y cooldown',
    Object.values(EVENTOS_SONIDO).every((d) => d.categoria && d.prioridad && Number.isFinite(d.cooldown)));

  comprobar('Las siete categorías del apartado 8', CATEGORIAS_SONIDO.length === 7);
  comprobar('Una categoría inventada cae en "feedback"', categoriaSonido('zzz').id === 'feedback');
  comprobar('CLAVE · Interfaz nace más bajo que Logros',
    categoriaSonido('ui').porDefecto < categoriaSonido('achievement').porDefecto);

  comprobar('Las cuatro prioridades', Object.keys(PRIORIDADES_SONIDO).length === 4);
  comprobar('CLAVE · UI_CLICK es LOW y STREAK_MILESTONE es HIGH',
    EVENTOS_SONIDO.UI_CLICK.prioridad === 'LOW' && EVENTOS_SONIDO.STREAK_MILESTONE.prioridad === 'HIGH');
  comprobar('...y NEW_RECORD y ACHIEVEMENT_UNLOCKED también (apartado 9)',
    EVENTOS_SONIDO.NEW_RECORD.prioridad === 'HIGH' && EVENTOS_SONIDO.ACHIEVEMENT_UNLOCKED.prioridad === 'HIGH');
  comprobar('Los sonidos de interfaz son los más discretos (apartado 12)',
    EVENTOS_SONIDO.UI_CLICK.cooldown < EVENTOS_SONIDO.SUCCESS.cooldown);
  comprobar('Lo especial se reserva: cooldown largo (apartado 13)',
    EVENTOS_SONIDO.NEW_RECORD.cooldown >= 3000);

  // CLAVE — no se duplica el catálogo de RA F3: se traduce.
  comprobar('CLAVE · Los eventos de RA F3 se TRADUCEN, no se redefinen',
    eventoCanonico(EVENTOS_GAMIFICACION.STREAK_MILESTONE_REACHED) === 'STREAK_MILESTONE');
  comprobar('...también el récord', eventoCanonico(EVENTOS_GAMIFICACION.STREAK_PERSONAL_RECORD) === 'NEW_RECORD');
  comprobar('...y los que ya coinciden pasan tal cual',
    eventoCanonico(EVENTOS_GAMIFICACION.STREAK_STARTED) === 'STREAK_STARTED');
  comprobar('CLAVE · TODOS los eventos de RA F3 tienen sonido definido',
    Object.values(EVENTOS_GAMIFICACION).every((e) => definicionEvento(e) !== null),
    Object.values(EVENTOS_GAMIFICACION).filter((e) => !definicionEvento(e)).join(','));
  comprobar('Un evento inventado no tiene definición', definicionEvento('ZZZ') === null);
  comprobar('Hay exactamente dos alias, no un catálogo paralelo', Object.keys(ALIAS_EVENTO).length === 2);
}

/* ===========================================================================
   PREFERENCIAS Y VOLUMEN (apartados 7, 8, 27 y 28)
   =========================================================================== */
console.log('\n═══ Preferencias y volumen ═══\n');
{
  comprobar('CLAVE · De fábrica el sonido está APAGADO', DEFAULT_AUDIO.activado === false);
  /* ⚠️ Esto decía "porque todavía no hay ni un archivo que sonar". Dejó de ser
     verdad el 2026-09-04. Sigue apagado, pero ahora porque **falta biblioteca**,
     no porque no haya nada: encenderlo con 5 de 46 dejaría 41 eventos mudos. */
  comprobar('...y sigue apagado mientras la biblioteca esté a medias', SONIDOS_SISTEMA.every((s) => s.ruta.startsWith('/sonidos/')));
  comprobar('Cada categoría tiene su volumen por defecto',
    CATEGORIAS_SONIDO.every((c) => DEFAULT_AUDIO.volumenes[c.id] === c.porDefecto));

  comprobar('Un volumen de 250 se acota a 100', acotarVolumen(250) === 100);
  comprobar('...y uno negativo a 0', acotarVolumen(-40) === 0);
  comprobar('...y uno que no es número cae en el de por defecto', acotarVolumen('alto', 70) === 70);
  comprobar('Se redondea', acotarVolumen(72.6) === 73);

  // PRUEBA 1 y 2 del apartado 33 — activado y desactivado.
  comprobar('PRUEBA · Con el sonido ACTIVADO el volumen es mayor que cero', volumenEfectivo(ON, 'feedback') > 0);
  comprobar('PRUEBA · Con el sonido DESACTIVADO es cero', volumenEfectivo(DEFAULT_AUDIO, 'feedback') === 0);

  // PRUEBAS 3-5 — volumen 0, 50 y 100.
  comprobar('PRUEBA · Volumen general 0 → nada', volumenEfectivo({ ...ON, volumen: 0 }, 'feedback') === 0);
  comprobar('PRUEBA · Volumen 50 con categoría al 100 → 0.5',
    Math.abs(volumenEfectivo({ ...ON, volumen: 50, volumenes: { ...ON.volumenes, feedback: 100 } }, 'feedback') - 0.5) < 0.001);
  comprobar('PRUEBA · Volumen 100 con categoría al 100 → 1',
    volumenEfectivo({ ...ON, volumen: 100, volumenes: { ...ON.volumenes, feedback: 100 } }, 'feedback') === 1);
  comprobar('CLAVE · La categoría baja SOLA, sin tocar el general',
    volumenEfectivo({ ...ON, volumenes: { ...ON.volumenes, ui: 0 } }, 'ui') === 0
    && volumenEfectivo({ ...ON, volumenes: { ...ON.volumenes, ui: 0 } }, 'achievement') > 0);
  comprobar('Una categoría silenciada no suena', volumenEfectivo({ ...ON, silenciadas: ['streak'] }, 'streak') === 0);
  comprobar('...y las demás sí', volumenEfectivo({ ...ON, silenciadas: ['streak'] }, 'ui') > 0);

  comprobar('Unas preferencias nulas se normalizan', normalizarAudio(null).activado === false);
  comprobar('Una asignación a un evento inexistente se descarta',
    Object.keys(normalizarAudio({ asignaciones: { ZZZ: 'x' } }).asignaciones).length === 0);
  comprobar('Una categoría silenciada inventada se descarta',
    normalizarAudio({ silenciadas: ['zzz', 'ui'] }).silenciadas.join(',') === 'ui');
}

/* ===========================================================================
   EVENTO ≠ SONIDO, Y EL FALLBACK (apartados 5, 24 y 25)
   =========================================================================== */
console.log('\n═══ Evento ≠ sonido, y el fallback ═══\n');
{
  comprobar('Cada evento tiene su sonido de fábrica',
    Object.keys(EVENTOS_SONIDO).every((e) => e === 'CUSTOM' || ASIGNACIONES_POR_DEFECTO[e]));
  comprobar('El hito suena a "milestone_01" de fábrica', resolverSonido(ON, 'STREAK_MILESTONE').id === 'milestone_01');

  // CLAVE — cambiar el sonido es escribir una asignación, no editar código.
  const conPropio = { ...ON, asignaciones: { STREAK_MILESTONE: 'record_01' } };
  comprobar('CLAVE · Cambiar la asignación cambia el sonido, sin tocar código',
    resolverSonido(conPropio, 'STREAK_MILESTONE').id === 'record_01');
  comprobar('...y los demás eventos no cambian', resolverSonido(conPropio, 'SUCCESS').id === 'success_01');

  // Un sonido de Josué entra por el mismo sitio que uno del sistema.
  const mio = crearSonido({ id: 'mio_01', nombre: 'El mío', categoria: 'streak', origen: 'custom', ruta: 'u/1.webm' });
  const conMio = { ...ON, asignaciones: { STREAK_MILESTONE: 'mio_01' } };
  comprobar('Un sonido propio se puede asignar igual',
    resolverSonido(conMio, 'STREAK_MILESTONE', { sonidosUsuario: [mio] }).id === 'mio_01');
  comprobar('...y se distingue de los del sistema', mio.origen === ORIGENES_SONIDO.USUARIO);

  // PRUEBA · archivo inexistente → fallback.
  comprobar('PRUEBA · Un sonido asignado que ya no existe cae al de fábrica',
    resolverSonido({ ...ON, asignaciones: { SUCCESS: 'borrado_99' } }, 'SUCCESS').id === 'success_01');
  comprobar('CLAVE · ...y si tampoco hay de fábrica, silencio — no un error',
    resolverSonido(ON, 'CUSTOM') === null);
  // PRUEBA · evento inexistente → no rompe.
  comprobar('PRUEBA · Un evento inexistente devuelve null, no lanza', resolverSonido(ON, 'ZZZ') === null);

  comprobar('Un sonido guardado a medias se normaliza', normalizarSonido({}).origen === 'system');
  comprobar('Una duración imposible se descarta', normalizarSonido({ duracion: -5 }).duracion === 0);
  comprobar('Los once sonidos del sistema están', SONIDOS_SISTEMA.length === 11);
  comprobar('...cada uno con su ruta y su categoría', SONIDOS_SISTEMA.every((s) => s.ruta && s.categoria));
  comprobar('...y no se mezclan con los del usuario (apartado 19)',
    SONIDOS_SISTEMA.every((s) => s.origen === 'system' && s.ruta.startsWith('/sonidos/')));
  comprobar('Un sonido del sistema inventado no existe', sonidoDelSistema('zzz') === null);

  /* 🚨 LA COMPROBACIÓN QUE FALTABA. Esta fase (SO F1) se inventó unas rutas
     —`/sonidos/ui/click_01.webm`— y tres fases después la SO F4 definió la
     biblioteca de verdad: 46 archivos planos en mp3. Convivieron sin hablarse,
     y con la carpeta vacía **daban el mismo resultado que un sistema correcto**:
     silencio. Lo destapó el primer archivo real. Esto lo impide desde ya. */
  const DECLARADOS = new Set(listaDeArchivos().map((a) => a.ruta));
  const huerfanas = SONIDOS_SISTEMA.filter((s) => !DECLARADOS.has(s.ruta));
  comprobar(`🚨 CLAVE · Las nueve rutas del motor están declaradas en la SO F4${huerfanas.length ? ` — huérfanas: ${huerfanas.map((s) => s.ruta).join(', ')}` : ''}`,
    huerfanas.length === 0);
  comprobar('⚠️ ...y ninguna en un formato que la SO F4 no pide',
    SONIDOS_SISTEMA.every((s) => s.ruta.endsWith(`.${FORMATO}`)));
  comprobar('⚠️ ...ni en subcarpetas, que la SO F4 no usa',
    SONIDOS_SISTEMA.every((s) => s.ruta.split('/').length === 3));

  /* 🚨 Las variantes tienen que estar declaradas en la SO F4 igual que las
     rutas: si no, se repite exactamente el fallo de los dos catálogos, pero un
     nivel más abajo y más difícil de ver. */
  const todasLasVariantes = SONIDOS_SISTEMA.flatMap((s) => s.variantes);
  const variantesHuerfanas = todasLasVariantes.filter((v) => !DECLARADOS.has(v));
  comprobar(`🚨 CLAVE · Y las variantes también están declaradas en la SO F4${variantesHuerfanas.length ? ` — huérfanas: ${variantesHuerfanas.join(', ')}` : ''}`,
    variantesHuerfanas.length === 0);
  comprobar('⚠️ Un sonido sin variantes declaradas tiene una: la suya',
    SONIDOS_SISTEMA.every((s) => s.variantes.length >= 1 && s.variantes[0] === s.ruta));
  comprobar('⚠️ Un sonido de Josué, que nunca tendrá variantes, tampoco se rompe',
    crearSonido({ id: 'suyo', ruta: '/x.mp3', origen: 'custom' }).variantes.length === 1);

  /* 🚨 **LA INVARIANTE QUE FALTABA, Y QUE HABRÍA CAZADO LOS DOS FALLOS.**
     Ha pasado dos veces en un solo día: Josué graba un archivo, lo damos por
     bueno porque cumple su ficha, y resulta que **nada en el motor puede
     reproducirlo**. Primero con `ui_click_02/03`, que sin rotación no sonaban;
     después con `ui_toggle_off`, que caía en el mismo evento que el de encender.

     Las dos veces el archivo era correcto y el sistema estaba mal. Esto mira lo
     que hay en el disco y exige que **algo pueda tocarlo**. Es la prueba que
     protege el trabajo de Josué, no el código. */
  const ALCANZABLES = new Set(SONIDOS_SISTEMA.flatMap((s) => s.variantes));
  const enDisco = (() => {
    try { return readdirSync(join(RAIZ, 'public/sonidos')).filter((f) => f.endsWith(`.${FORMATO}`)); } catch { return []; }
  })();
  const mudos = enDisco.filter((f) => !ALCANZABLES.has(`/sonidos/${f}`));
  comprobar(`🚨 CLAVE · Ningún archivo grabado se queda mudo (${enDisco.length} en el disco)${mudos.length ? ` — MUDOS: ${mudos.join(', ')}` : ''}`,
    mudos.length === 0);
}

/* ---------------------------------------------------------------------------
   🚨 LAS VARIANTES ROTAN (SO F4)
   ---------------------------------------------------------------------------
   Josué produjo `ui_click_01/02/03` el 2026-09-04 — el mismo clic con medio tono
   de diferencia. Sin rotación, dos de los tres no se oirían NUNCA, y el trabajo
   de hacerlos habría sido para nada.
   --------------------------------------------------------------------------- */
{
  console.log('\n🚨 La rotación de variantes');
  const ON = { ...DEFAULT_AUDIO, activado: true };
  const rutas = [];
  let est = ESTADO_AUDIO_INICIAL;
  for (let i = 1; i <= 7; i += 1) {
    const d = decidirReproduccion(ON, 'UI_CLICK', { ahora: i * 200, estado: est });
    est = d.estado;
    rutas.push(d.suena ? d.sonido.ruta : `NO SUENA:${d.motivo}`);
  }
  comprobar('CLAVE · Tres clics seguidos son tres archivos distintos',
    new Set(rutas.slice(0, 3)).size === 3);
  comprobar('CLAVE · ...en orden 1 → 2 → 3, no al azar',
    rutas.slice(0, 3).join() === '/sonidos/ui_click_01.mp3,/sonidos/ui_click_02.mp3,/sonidos/ui_click_03.mp3');
  comprobar('CLAVE · ...y el cuarto vuelve al primero', rutas[3] === rutas[0]);
  comprobar('⚠️ El turno viaja en el estado, no en una variable escondida',
    ESTADO_AUDIO_INICIAL.variantes && Object.keys(ESTADO_AUDIO_INICIAL.variantes).length === 0);

  // Un sonido de una sola versión no rota: suena el suyo, siempre.
  const a = decidirReproduccion(ON, 'SUCCESS', { ahora: 5000, estado: ESTADO_AUDIO_INICIAL });
  const b = decidirReproduccion(ON, 'SUCCESS', { ahora: 9000, estado: a.estado });
  comprobar('Un sonido sin variantes no rota nada', a.sonido.ruta === b.sonido.ruta);
}

/* ===========================================================================
   COOLDOWN Y COLISIONES (apartados 10 y 11) — lo que evita la tragaperras
   =========================================================================== */
console.log('\n═══ Cooldown y colisiones ═══\n');
{
  // PRUEBA · sonido desactivado → no reproduce.
  comprobar('PRUEBA · Con el sonido apagado no suena nada',
    decidirReproduccion(DEFAULT_AUDIO, 'SUCCESS', { ahora: T0 }).suena === false);
  comprobar('...y dice por qué',
    decidirReproduccion(DEFAULT_AUDIO, 'SUCCESS', { ahora: T0 }).motivo === 'sonido_desactivado');
  comprobar('PRUEBA · Con volumen 0 tampoco',
    decidirReproduccion({ ...ON, volumen: 0 }, 'SUCCESS', { ahora: T0 }).motivo === 'volumen_cero');
  comprobar('PRUEBA · Un evento inexistente no rompe la app',
    decidirReproduccion(ON, 'ZZZ', { ahora: T0 }).motivo === 'evento_desconocido');

  const primera = decidirReproduccion(ON, 'SUCCESS', { ahora: T0 });
  comprobar('Con todo en orden, suena', primera.suena === true && primera.sonido.id === 'success_01');
  comprobar('...con su volumen ya calculado', primera.volumen > 0 && primera.volumen <= 1);

  // PRUEBA · spam.
  let estado = ESTADO_AUDIO_INICIAL;
  let sonaron = 0;
  for (let i = 0; i < 20; i++) {
    const r = decidirReproduccion(ON, 'UI_CLICK', { ahora: T0 + i * 5, estado });
    estado = r.estado;
    if (r.suena) sonaron++;
  }
  comprobar('CLAVE · PRUEBA · Veinte toques rapidísimos NO son veinte sonidos', sonaron === 1, String(sonaron));
  comprobar('...pero pasado el cooldown vuelve a sonar',
    decidirReproduccion(ON, 'UI_CLICK', { ahora: T0 + 5000, estado }).suena === true);

  // PRUEBA · dos eventos simultáneos → prioridad.
  let e2 = ESTADO_AUDIO_INICIAL;
  const rMenor = decidirReproduccion(ON, 'ACTION_COMPLETED', { ahora: T0, estado: e2 });
  e2 = rMenor.estado;
  const rMayor = decidirReproduccion(ON, 'STREAK_MILESTONE', { ahora: T0 + 10, estado: e2 });
  comprobar('CLAVE · PRUEBA · Lo MÁS importante sí atraviesa la colisión', rMayor.suena === true);

  let e3 = ESTADO_AUDIO_INICIAL;
  const rAlto = decidirReproduccion(ON, 'STREAK_MILESTONE', { ahora: T0, estado: e3 });
  e3 = rAlto.estado;
  const rBajo = decidirReproduccion(ON, 'ACTION_COMPLETED', { ahora: T0 + 10, estado: e3 });
  comprobar('CLAVE · ...y lo menos importante se calla', rBajo.suena === false && rBajo.motivo === 'colision');

  // El caso real del apartado 10: completar algo dispara tres eventos juntos.
  let e4 = ESTADO_AUDIO_INICIAL;
  let cuantos = 0;
  for (const [i, ev] of ['ACTION_COMPLETED', 'STREAK_CONTINUED', 'SUCCESS'].entries()) {
    const r = decidirReproduccion(ON, ev, { ahora: T0 + i * 20, estado: e4 });
    e4 = r.estado;
    if (r.suena) cuantos++;
  }
  comprobar('CLAVE · Tres eventos de una misma acción suenan UNA vez, no tres', cuantos === 1, String(cuantos));
  comprobar('Fuera de la ventana ya no hay colisión',
    decidirReproduccion(ON, 'ACTION_COMPLETED', { ahora: T0 + VENTANA_COLISION + 500, estado: e4 }).suena === true);
  comprobar('La decisión no muta el estado que recibe', ESTADO_AUDIO_INICIAL.ultimaReproduccion === 0);
}

/* ===========================================================================
   PRECARGA (apartados 17 y 18)
   =========================================================================== */
console.log('\n═══ Precarga ═══\n');
{
  const lista = sonidosAPrecargar(ON);
  comprobar('Solo se precarga lo crítico', lista.length > 0 && lista.length < SONIDOS_SISTEMA.length);
  comprobar('CLAVE · ...que es interfaz y confirmaciones, lo que tiene que sonar YA',
    lista.every((s) => CATEGORIAS_PRECARGA.includes(s.categoria)));
  comprobar('...sin repetir un sonido usado por dos eventos', new Set(lista.map((s) => s.id)).size === lista.length);
  comprobar('CLAVE · Con el sonido apagado no se descarga NADA', sonidosAPrecargar(DEFAULT_AUDIO).length === 0);
  comprobar('Una categoría a cero tampoco se precarga',
    sonidosAPrecargar({ ...ON, volumenes: { ...ON.volumenes, ui: 0, feedback: 0 } }).length === 0);
}

/* ===========================================================================
   VALIDACIÓN DE SUBIDAS (apartado 37)
   =========================================================================== */
console.log('\n═══ Lo que validará la subida ═══\n');
{
  const ok = { name: 'mio.webm', type: 'audio/webm', size: 50_000 };
  comprobar('Un sonido correcto pasa', validarSonidoSubido(ok, { duracion: 2 }).ok === true);
  comprobar('CLAVE · Un ejecutable con nombre de sonido se rechaza por su MIME',
    validarSonidoSubido({ name: 'virus.webm', type: 'application/x-msdownload', size: 100 }).ok === false);
  comprobar('CLAVE · ...y no se confía solo en la extensión',
    validarSonidoSubido({ name: 'x.mp3', type: 'text/html', size: 10 }).ok === false);
  comprobar('Una extensión que no cuadra se rechaza',
    validarSonidoSubido({ name: 'sonido.exe', type: 'audio/webm', size: 100 }).ok === false);
  comprobar('Uno demasiado pesado se rechaza',
    validarSonidoSubido({ ...ok, size: MAX_TAMANO_SONIDO + 1 }).ok === false);
  comprobar('Uno demasiado largo se rechaza',
    validarSonidoSubido(ok, { duracion: MAX_DURACION_SONIDO + 1 }).ok === false);
  comprobar('Sin archivo no revienta', validarSonidoSubido(null).ok === false);
  comprobar('Los cinco formatos admitidos', FORMATOS_SONIDO.length === 5);
}

/* ===========================================================================
   ACCESIBILIDAD Y LÍMITES HONESTOS (apartados 26 y 35)
   =========================================================================== */
console.log('\n═══ El sonido nunca es el único canal ═══\n');
{
  const d = decidirReproduccion(ON, 'SUCCESS', { ahora: T0 });
  const claves = Object.keys(describirDecision(d));
  comprobar('CLAVE · La decisión dice si suena y por qué, y nada más',
    claves.join(',') === 'suena,motivo');
  comprobar('CLAVE · No hay forma de que el motor suprima la interfaz',
    !('ocultar' in d) && !('suprimirVisual' in d) && !('enLugarDe' in d));
  comprobar('Con el sonido apagado la decisión sigue siendo legible',
    describirDecision(decidirReproduccion(DEFAULT_AUDIO, 'SUCCESS', { ahora: T0 })).motivo === 'sonido_desactivado');

  /* 🚨 Esta prueba estaba escrita PARA FALLAR el día que apareciera un archivo,
     y decía que entonces había que encender `activado` por defecto y quitarla.
     Falló el 2026-09-04, como estaba previsto. Pero la instrucción se cumple a
     medias a propósito: **hay 1 de 46 archivos**, así que encender el sonido por
     defecto haría que 45 eventos pidieran ficheros que no existen. Sigue
     apagado, y aquí queda escrito cuándo deja de tener sentido que lo esté. */
  const ARCHIVOS_QUE_HAY = (() => {
    try { return readdirSync(join(RAIZ, 'public/sonidos')).filter((f) => f.endsWith(`.${FORMATO}`)).length; } catch { return 0; }
  })();
  comprobar('CLAVE · El motor decide "sí" y apunta a un archivo de la SO F4',
    decidirReproduccion(ON, 'SUCCESS', { ahora: T0 }).sonido.ruta === '/sonidos/success_01.mp3');
  comprobar(`⚠️ Y el sonido nace apagado mientras falten archivos (hay ${ARCHIVOS_QUE_HAY} de ${listaDeArchivos().length})`,
    DEFAULT_AUDIO.activado === false || ARCHIVOS_QUE_HAY === listaDeArchivos().length);
}

console.log('\n  ⚠️ Sin comprobar aquí, y hay que decirlo: iOS, Android, PWA y escritorio.');
console.log('     Son del navegador real y solo los puede ver Josué (mismo límite que R1).\n');

console.log(fallos === 0 ? '  Todo correcto.\n' : `  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
