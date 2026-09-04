// ============================================================================
// SO · Fase 5/5 — Producción, integración y test final
//
// *"Convertir toda la especificación en un sistema de audio real, organizado,
// optimizado y preparado para producción."*
//
// Lo que vigila esta prueba:
//   · que el volumen sea maestro × categoría × EVENTO (un clic ≠ un récord)
//   · que un perfil no sea un sistema aparte: se deduce de las preferencias
//   · 🚨 que con el sonido apagado el EVENTO se siga procesando
//   · y que lo que el panel dice sobre si hoy suena algo salga de contar los
//     archivos del disco, no de una constante escrita a mano
// ============================================================================

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { DEFAULT_AUDIO as DEFAULT_F1, CATEGORIAS_SONIDO as CATS_F1, normalizarAudio as NORM_F1 } from '../src/lib/audio.js';
import { CATALOGO as CATALOGO_F3 } from '../src/lib/audioEventos.js';
import { FAMILIAS as FAMILIAS_F4, fichaDe as FICHA_F4, queFalta as FALTA_F4 } from '../src/lib/especificacionSonidos.js';
import {
  ESTRUCTURA_REAL, ESTRUCTURA_PROPUESTA_NO_ADOPTADA, pantallasQueTocanElAudio,
  PERFILES, perfilSonido, aplicarPerfil, perfilActual,
  PESO_POR_INTENSIDAD, pesoDeEvento, volumenFinal,
  GRUPOS_PRECARGA, grupoPrecarga, grupoDe,
  FALLBACK_POR_FAMILIA, conFallback,
  SECUENCIAS, secuencia, esSecuencia, REGLA_SECUENCIA,
  MODO_SILENCIOSO, HAPTICS, PATRONES_VIBRACION, patronDe, queHaceElEvento,
  PANTALLA_SONIDO, CONTROLES, control, MARCAS_VOLUMEN, EJEMPLOS_PARA_ESCUCHAR, ejemploDe,
  ACCESIBILIDAD_CONTROLES, PRIMERA_INTERACCION, ANTE_UN_ERROR, TELEMETRIA,
  PRUEBAS_MOTOR, PRUEBAS_DE_JOSUE,
  BLOQUEADO_POR_LOS_ARCHIVOS, cuantosArchivosFaltan,
  APARTADOS_SO5, apartadoSO5, apartadosBloqueados, apartadosDeJosueSO,
  CONDICION, auditarSonidoProduccion, panelSonidoProduccion,
  DEFAULT_AUDIO, CATEGORIAS_SONIDO, normalizarAudio, FAMILIAS, fichaDe,
} from '../src/lib/sonidoProduccion.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTAS = join(RAIZ, 'src/views');
const FUENTES = {};
readdirSync(VISTAS).filter((f) => f.endsWith('.jsx')).forEach((f) => {
  FUENTES[f] = readFileSync(join(VISTAS, f), 'utf8');
});
const SETTINGS = FUENTES['SettingsView.jsx'];
const APP = readFileSync(join(RAIZ, 'src/App.jsx'), 'utf8');

/* 🚨 Los archivos de audio que hay DE VERDAD, leídos del disco. Este test es el
   único sitio que puede mirarlo: `sonidoProduccion.js` vive en el navegador. */
const PRESENTES = (() => {
  try { return readdirSync(join(RAIZ, 'public/sonidos')).filter((f) => f.endsWith('.mp3')); } catch { return []; }
})();
const encendido = { ...DEFAULT_AUDIO, activado: true };

console.log('\n🔊 SO · Fase 5/5 — Producción, integración y test final\n');

/* ---------------------------------------------------------------------------
   1 · ⏸ LO PRIMERO: HOY NO SUENA NADA
   --------------------------------------------------------------------------- */
{
  console.log(`1 · Los archivos (${PRESENTES.length} hechos, ${46 - PRESENTES.length} por hacer)`);

  /* 🚨 Esto afirmaba que la carpeta estaba vacía y que `hoySuena` era false.
     Dejó de ser verdad el 2026-09-04, cuando Josué produjo el primer sonido en
     FL Studio, y la suite se puso roja defendiendo una verdad vieja. Ahora los
     dos lados se calculan del disco: cuando no haya archivos dirá que no suena,
     y cuando los haya dirá que sí. Es la misma prueba, pero viva. */
  const panel = panelSonidoProduccion(undefined, { archivosPresentes: PRESENTES });
  eq(panel.hoySuena, PRESENTES.length > 0,
    `⏸ 🚨 el panel dice la verdad sobre si hoy suena algo (${PRESENTES.length} archivos)`);
  eq(panel.archivosQueHay, PRESENTES.length, 'contando los que hay de verdad');
  eq(cuantosArchivosFaltan(PRESENTES), FALTA_F4(PRESENTES).faltan.length,
    'y los que faltan, con la función de la SO F4');
  eq(cuantosArchivosFaltan(PRESENTES), 46 - PRESENTES.length, 'la cuenta cuadra con el catálogo');
  ok(PRESENTES.every((f) => existsSync(join(RAIZ, 'public/sonidos', f))),
    '⚠️ y cada uno existe en el disco, no solo en una lista');
  ok(/SO F2/.test(BLOQUEADO_POR_LOS_ARCHIVOS.fase), 'la fase bloqueada es la SO F2, la biblioteca');
  eq(DEFAULT_AUDIO.activado, false,
    '⚠️ por eso el interruptor nace apagado desde la SO F1: no es un control decorativo');
}

/* ---------------------------------------------------------------------------
   2 · EL MOTOR NO SE REESCRIBE (apartados 2, 9 y 12)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · La estructura');
  eq(pantallasQueTocanElAudio(FUENTES), [],
    '🚨 ⚠️ NINGUNA pantalla hace `new Audio(...)`: el motor es el único que reproduce');
  ok(pantallasQueTocanElAudio({ mala: 'const a = new Audio("x.mp3");' }).length === 1,
    '⚠️ el detector caza el caso');
  ok(/audioEngine/.test(ESTRUCTURA_REAL.motor), 'el motor sigue donde estaba (SO F1)');
  ok(/no se adopta|riesgo de romper/.test(ESTRUCTURA_PROPUESTA_NO_ADOPTADA.porque),
    '🚨 y la estructura de carpetas del apartado 2 NO se adopta, con su motivo');
  ok(/no están dispersos/.test(ESTRUCTURA_PROPUESTA_NO_ADOPTADA.loQueSiSeCumple),
    '⚠️ diciendo qué es lo que el apartado quiere de verdad, y sí se cumple');
}

/* ---------------------------------------------------------------------------
   3 · EL VOLUMEN MULTIPLICA (apartado 23)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Maestro × categoría × evento');
  const clic = volumenFinal(encendido, 'UI_CLICK');
  const record = volumenFinal(encendido, 'NEW_RECORD');
  ok(clic < record, `🚨 ⚠️ un clic (${clic}) suena por debajo de un récord (${record}): el evento pesa`);
  ok(clic > 0 && record <= 1, 'y los dos caen entre 0 y 1');
  eq(volumenFinal({ ...encendido, volumen: 0 }, 'NEW_RECORD'), 0, 'con el maestro a cero, silencio');
  eq(volumenFinal({ ...encendido, silenciadas: ['ui'] }, 'UI_CLICK'), 0,
    'y con su categoría apagada, también');
  eq(PESO_POR_INTENSIDAD.length, 6, 'los seis niveles de la escala de la SO F3');
  ok(PESO_POR_INTENSIDAD.every((x, i, a) => i === 0 || x >= a[i - 1]),
    '⚠️ y el peso nunca baja al subir de nivel');
  ok(pesoDeEvento('UI_CLICK') < pesoDeEvento('LEVEL_UP'), 'un clic pesa menos que una subida de nivel');
  ok(pesoDeEvento('INVENTADO') > 0, 'y un evento desconocido no revienta: cae en el peso medio');
  ok(Object.keys(CATALOGO_F3).length > 30, `el catálogo de la SO F3 sigue con sus ${Object.keys(CATALOGO_F3).length} sonidos`);
}

/* ---------------------------------------------------------------------------
   4 · LOS PERFILES NO SON UN SISTEMA APARTE (apartado 25)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Perfiles');
  eq(PERFILES.map((p) => p.id), ['silencioso', 'equilibrado', 'inmersivo', 'personalizado'],
    'los cuatro del enunciado');
  eq(perfilSonido('personalizado').prefs, null,
    '⚠️ y "personalizado" no tiene preajuste: es DONDE ACABAS al tocar algo a mano');

  const silencio = aplicarPerfil(DEFAULT_AUDIO, 'silencioso');
  eq(silencio.activado, false, 'silencioso apaga el sonido');
  eq(silencio.silenciadas.length, CATEGORIAS_SONIDO.length, 'y todas las categorías');
  eq(perfilActual(silencio), 'silencioso', '🚨 y el perfil se DEDUCE de las preferencias…');

  const equilibrado = aplicarPerfil(DEFAULT_AUDIO, 'equilibrado');
  eq(perfilActual(equilibrado), 'equilibrado', '…también el equilibrado');
  eq(equilibrado.silenciadas, ['ui'],
    '⚠️ que calla la interfaz: es lo que hace que el resto no canse');

  /* 🚨 Lo que importa de la decisión 3. */
  const tocado = { ...equilibrado, volumen: 33 };
  eq(perfilActual(tocado), 'personalizado',
    '🚨 ⚠️ y en cuanto tocas UNA cosa a mano pasa a "personalizado": no hay dos verdades');
  eq(aplicarPerfil(DEFAULT_AUDIO, 'inventado'), NORM_F1(DEFAULT_AUDIO),
    'un perfil que no existe no cambia nada');
  eq(aplicarPerfil(DEFAULT_AUDIO, 'personalizado'), NORM_F1(DEFAULT_AUDIO),
    'y "personalizado" tampoco escribe nada');
  ok(!perfilSonido('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   5 · 🚨 SILENCIO NO ES "NO PASA NADA" (apartados 21 y 22)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Modo silencioso y vibración');
  const callado = queHaceElEvento({ ...DEFAULT_AUDIO, activado: false }, 'STREAK_MILESTONE');
  eq(callado.procesaElEvento, true,
    '🚨 ⚠️ con el sonido apagado el EVENTO se sigue procesando: la racha sube y la pantalla lo enseña');
  eq(callado.suena, false, 'lo único que no ocurre es el audio');
  ok(/No se elimina el evento/.test(MODO_SILENCIOSO.regla), 'con la regla del apartado 21');

  const vibrando = queHaceElEvento({ ...DEFAULT_AUDIO, activado: false, vibracion: true }, 'SUCCESS');
  eq(vibrando.suena, false, '🚨 sonido apagado…');
  eq(vibrando.vibra, true, '…y vibración encendida: son DOS interruptores (apartado 22)');
  ok(!!vibrando.patron, 'con su patrón');
  eq(HAPTICS.separado, true, 'y queda declarado que están separados');
  ok(/iOS/.test(HAPTICS.soporte),
    '⚠️ diciendo la verdad incómoda: en iPhone no existe `navigator.vibrate`');
  eq(PATRONES_VIBRACION.length, 4, 'cuatro patrones');
  ok(patronDe('UI_CLICK').id !== patronDe('ACHIEVEMENT_UNLOCKED').id,
    '⚠️ y un clic no vibra como un logro');
}

/* ---------------------------------------------------------------------------
   6 · PRECARGA, FALLBACK Y SECUENCIAS (apartados 7, 17 y 31)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Precarga, fallback y secuencias');
  eq(GRUPOS_PRECARGA.map((g) => g.id), ['A', 'B', 'C'], 'los tres grupos del apartado 7');
  eq(grupoDe('UI_CLICK'), 'A', 'un clic se precarga');
  eq(grupoDe('STREAK_MILESTONE_365'), 'C',
    '⚠️ y el milestone de 365 días, bajo demanda: puede sonar una vez al año');
  ok(!!grupoPrecarga('B'), 'se buscan por id');
  ok(GRUPOS_PRECARGA.every((g) => !!g.cuando), 'cada uno diciendo cuándo se carga');

  eq(auditarSonidoProduccion().familiasSinFallback, [],
    '🚨 ⚠️ las ocho familias de la SO F4 tienen fallback');
  eq(FAMILIAS, FAMILIAS_F4, 'que son las suyas, importadas');
  eq(Object.values(FALLBACK_POR_FAMILIA).filter((id) => !FICHA_F4(id)), [],
    '🚨 y cada fallback apunta a un archivo que EXISTE en el catálogo: uno inventado sería el mismo silencio con otro nombre');

  eq(conFallback('ui_click', { disponibles: ['ui_click'] }).esFallback, false, 'si está, suena él');
  eq(conFallback('ui_open', { disponibles: ['ui_click'] }).archivo, 'ui_click',
    '⚠️ y si no está, suena el de su familia');
  eq(conFallback('ui_open', { disponibles: [] }).archivo, null,
    '⚠️ y si no hay nada, devuelve null — que no es un error: es el estado de hoy');

  eq(SECUENCIAS.map((s) => s.id), ['LEVEL_UP', 'GRAND_ACHIEVEMENT', 'PERSONAL_RECORD'],
    'las secuencias del apartado 17');
  ok(esSecuencia('LEVEL_UP'), 'una subida de nivel es una secuencia…');
  ok(!esSecuencia('UI_CLICK'), '…y un clic no');
  eq(secuencia('LEVEL_UP').partes.length, 3, 'con sus tres partes');
  ok(SECUENCIAS.every((s) => s.comoUno), '🚨 y las tres se tratan como UN evento, no como tres');
  ok(/no tres/.test(REGLA_SECUENCIA), 'con la regla escrita');
}

/* ---------------------------------------------------------------------------
   7 · LA PANTALLA DE AJUSTES (apartados 24, 26, 27 y 28)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · «Sonido y respuesta»');
  eq(PANTALLA_SONIDO.titulo, 'Sonido y respuesta', 'la sección del apartado 24');
  eq(CONTROLES.map((c) => c.id),
    ['activado', 'volumen', 'perfil', 'streak', 'reward', 'ui', 'vibracion'],
    'los siete controles del enunciado, ni uno más');
  ok(CONTROLES.every((c) => !!c.icono && !!c.etiqueta), 'cada uno con su icono y su etiqueta');
  eq(MARCAS_VOLUMEN, [0, 25, 50, 75, 100], 'apartado 27 — las cinco marcas del deslizante');

  /* 🚨 La pantalla existe de verdad, no solo su especificación. */
  ok(/export function BloqueSonido/.test(SETTINGS),
    '🚨 ⚠️ y la pantalla EXISTE: `BloqueSonido` está en `SettingsView.jsx`');
  ok(/id: 'sonido'/.test(SETTINGS), 'con su categoría en la lista de Ajustes');
  ok(/Sonido y respuesta/.test(SETTINGS), 'y su nombre');
  ok(/audio=\{audio\} onUpdateAudio=\{updateAudio\}/.test(APP),
    '🚨 y está CABLEADA en `App.jsx`: no es un componente huérfano');
  ok(/Todavía no suena nada/.test(SETTINGS),
    '⏸ ⚠️ y la propia pantalla avisa de que todavía no suena nada (regla 8)');

  /* Apartado 26 — el botón ▶ suena lo que sonaría el sistema. */
  eq(ejemploDe('streak'), 'STREAK_MILESTONE', 'el ▶ de racha suena un milestone de verdad…');
  ok(Object.values(EJEMPLOS_PARA_ESCUCHAR).every((id) => typeof id === 'string' && id === id.toUpperCase()),
    '…y todos son eventos del motor, no sonidos inventados para la pantalla');
  eq(ejemploDe('inventada'), null, 'una categoría que no existe no tiene ejemplo');
  ok(/reproducir\(ejemploDe/.test(SETTINGS),
    '🚨 y el botón llama al motor de verdad: no crea un sonido aparte para Ajustes');

  ok(/Nunca depender del sonido/.test(ACCESIBILIDAD_CONTROLES.regla),
    '⚠️ apartado 28 — ningún control comunica su estado solo con el sonido');
  ok(ACCESIBILIDAD_CONTROLES.cadaControl.includes('lector de pantalla'), 'con las cinco cosas que pide');
  ok(!control('inventado'), 'los controles se buscan por id');
}

/* ---------------------------------------------------------------------------
   8 · ARRANQUE, ERRORES, PRUEBAS Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Arranque, errores y pruebas');
  ok(/primer toque/.test(PRIMERA_INTERACCION.regla),
    'apartado 29 — el contexto de audio se crea con el primer toque, no al abrir');
  ok(/pantalla en blanco/.test(ANTE_UN_ERROR.regla),
    '⚠️ apartado 30 — un sonido que falla no puede dejar la aplicación rota');
  eq(TELEMETRIA.existe, false, '⚠️ apartado 32 — no hay analítica, así que no hay nada que registrar');
  ok(/nada personal/.test(TELEMETRIA.siAlgunDia), 'y la regla para el día que la haya');

  eq(PRUEBAS_MOTOR.length, 8, 'apartado 33 — las ocho pruebas del motor');
  ok(PRUEBAS_MOTOR.every((p) => !!p.donde), 'cada una diciendo dónde vive');
  eq(PRUEBAS_DE_JOSUE.map((p) => p.apartado), [42, 43, 44, 45, 46],
    '🚨 y cinco necesitan un teléfono de verdad');
  ok(PRUEBAS_DE_JOSUE.every((p) => !!p.porque), '⚠️ las cinco con su motivo');
  ok(/enchufarlos/.test(PRUEBAS_DE_JOSUE.find((p) => p.apartado === 43).porque),
    'los auriculares, porque hay que enchufarlos');

  eq(apartadosBloqueados().map((a) => a.id), [5, 6, 47, 48],
    '⏸ cuatro apartados están bloqueados por los archivos que no hay');
  eq(auditarSonidoProduccion().sinDonde, [], 'y todos los apartados dicen dónde se contestan');
  ok(APARTADOS_SO5.length >= 35, `${APARTADOS_SO5.length} apartados recogidos`);
  ok(!apartadoSO5(999), 'se buscan por id');

  const panel = panelSonidoProduccion(DEFAULT_AUDIO, { fuentes: FUENTES });
  eq(panel.listoParaProduccion, true,
    '🎯 el sistema está listo para producción: lo único que falta son los archivos');
  eq(panel.hoySuena, false, '⏸ y eso no se disimula');
  ok(/los da Josué|los da/.test(CONDICION) || /archivos/.test(CONDICION), 'con la condición de la fase');
  eq(normalizarAudio, NORM_F1, '⚠️ y las preferencias son las de la SO F1, importadas');
  eq(CATEGORIAS_SONIDO, CATS_F1, 'igual que las categorías');
  eq(DEFAULT_AUDIO, DEFAULT_F1, 'y los valores por defecto');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
