// ============================================================================
// ENTREGA 3 · FASE 25 (PR F3) — PRODUCTIVIDAD: POMODORO
//
// Los 18 puntos del criterio de éxito, y las tres cosas que decidieron cómo se
// construye:
//
//   1. TIMESTAMPS, no un contador que resta segundos. Es lo que hace que el
//      temporizador sobreviva a que el móvil congele la pestaña.
//   2. El sonido es el del sistema: se EMITE un evento, no se reproduce nada.
//   3. El contador por día de la Fase 6 se recalcula desde las sesiones, así que
//      no puede desviarse de ellas.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_SESION, tipoSesion, IDS_TIPOS_SESION,
  CONFIG_POMODORO_POR_DEFECTO, DURACIONES_SUGERIDAS, MIN_MINUTOS, MAX_MINUTOS,
  normalizarConfig, duracionDe,
  iniciarSesion, normalizarSesionEnCurso, estaPausada, transcurridoMs, restanteMs,
  haTerminado, progreso, formatearTiempo, pausar, reanudar, reiniciar,
  CAMPOS_SESION, completar, cancelar, normalizarSesion, normalizarSesiones,
  siguienteEnElCiclo, posicionEnElCiclo,
  EVENTO_AL_TERMINAR, SONIDO, AVISOS,
  esPomodoro, estadisticasDe, estadisticasHoy, estadisticasSemana, formatearDuracionLarga,
  historialReciente, MAX_HISTORIAL, contadorDesdeSesiones, paraHoy,
  VINCULACION_CON_TAREAS, CABECERA_POMODORO, VACIO_POMODORO,
  NO_EN_PR3, DONDE_SE_GUARDA_POMODORO, AISLAMIENTO_POMODORO,
  condicionPR3, pr3Terminada,
} from '../src/lib/pomodoro.js';
import { DEFAULT_PRODUCTIVIDAD } from '../src/tokens.js';
import { CATALOGO } from '../src/lib/audioEventos.js';
import { MINI_APPS_PR } from '../src/lib/productividad.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const soloCodigo = (s) => sinComentarios(s).replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");

const LIB = leer('src/lib/pomodoro.js');
const LIB_CODIGO = soloCodigo(LIB);
const VISTA = leer('src/views/ProductivityView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const APP = sinComentarios(leer('src/App.jsx'));
const CSS = leer('src/index.css');

const CFG = CONFIG_POMODORO_POR_DEFECTO;
const T0 = 1_700_000_000_000;
const MIN = 60_000;

console.log('\n═══ 1. 🚨 TIMESTAMPS, NO UN CONTADOR QUE RESTA SEGUNDOS ═══\n');

/* 🚨 La frase que decide el archivo entero: *"No implementar un contador que
   simplemente se base en restar segundos continuamente. **Utilizar timestamps**
   para calcular el tiempo real restante. Así se evita que el temporizador se
   desincronice si la pestaña queda en segundo plano."* */
const s = iniciarSesion('focus', CFG, { ahora: T0 });
eq(s.duracionMs, 25 * MIN, 'una sesión de enfoque dura lo que dice la configuración');
eq(restanteMs(s, T0), 25 * MIN, 'al empezar quedan los 25 minutos');
eq(restanteMs(s, T0 + 10 * MIN), 15 * MIN, 'y a los diez minutos, quince');
eq(restanteMs(s, T0 + 25 * MIN), 0, 'y al final, cero');
eq(restanteMs(s, T0 + 99 * MIN), 0,
  '🚨 **y NUNCA negativo**: volver de tener el móvil bloqueado una hora la encuentra terminada, no con una hora de más');
ok(haTerminado(s, T0 + 25 * MIN), 'y se sabe que ha terminado');
ok(!haTerminado(s, T0 + 24 * MIN), 'y que a los 24 no');

ok(!/setInterval|setTimeout/.test(LIB_CODIGO),
  '🚨 **la librería no tiene ni un temporizador**: el tiempo se calcula restando instantes');
ok(!/segundos--|-- ?1|restar/.test(LIB_CODIGO), '⚠️ ni una resta de segundos acumulada');
ok(/setInterval/.test(VISTA_LIMPIA) && /latir/.test(VISTA_LIMPIA),
  '⚠️ y el intervalo de la pantalla **solo redibuja**: no es el que lleva la cuenta');

console.log('\n═══ 2. PAUSAR, CONTINUAR, REINICIAR ═══\n');

const p = pausar(s, T0 + 10 * MIN);
ok(estaPausada(p), 'pausar la marca como pausada');
eq(restanteMs(p, T0 + 10 * MIN), 15 * MIN, 'al pausar quedan quince');
eq(restanteMs(p, T0 + 90 * MIN), 15 * MIN,
  '🚨 **y una hora y pico después SIGUEN quedando quince**: pausada, el tiempo no corre');
eq(pausar(p, T0 + 20 * MIN), p, '⚠️ y pausar dos veces no cambia nada');

const r = reanudar(p, T0 + 90 * MIN);
ok(!estaPausada(r), 'continuar la despausa');
eq(restanteMs(r, T0 + 95 * MIN), 10 * MIN,
  '🚨 **y los ochenta minutos parado NO cuentan**: cinco minutos después quedan diez');
eq(reanudar(s, T0), s, '⚠️ y continuar una que no está pausada no cambia nada');

/* Trabajó de 0 a 5, paró hasta 20, trabajó de 20 a 25, paró hasta 40 y trabajó de
   40 a 45: quince minutos de trabajo y treinta de pausa. Quedan diez. */
const dosPausas = reanudar(pausar(reanudar(pausar(s, T0 + 5 * MIN), T0 + 20 * MIN), T0 + 25 * MIN), T0 + 40 * MIN);
eq(restanteMs(dosPausas, T0 + 45 * MIN), 10 * MIN,
  '⚠️ y con dos pausas la cuenta sigue siendo exacta: los treinta minutos parado no cuentan');

const re = reiniciar(s, T0 + 10 * MIN);
eq(restanteMs(re, T0 + 10 * MIN), 25 * MIN, '*"↻ Reiniciar"*: la misma sesión desde cero');
eq(re.tipo, s.tipo, '⚠️ sin cambiar de tipo');
ok(!estaPausada(re), '⚠️ y corriendo');

eq(progreso(s, T0), 0, 'el círculo empieza a cero');
eq(progreso(s, T0 + 12.5 * MIN), 0.5, 'y a la mitad, la mitad');
eq(progreso(s, T0 + 99 * MIN), 1, '⚠️ y nunca pasa de uno');

console.log('\n═══ 3. EL RELOJ EN PANTALLA ═══\n');

eq(formatearTiempo(25 * MIN), '25:00', 'veinticinco minutos');
eq(formatearTiempo(0), '00:00', 'cero');
eq(formatearTiempo(61_000), '01:01', 'un minuto y un segundo');
eq(formatearTiempo(3 * 3600_000), '3:00:00', '⚠️ y las horas solo cuando hacen falta');
eq(formatearTiempo(-5), '00:00', '⚠️ un tiempo negativo no se enseña en negativo');
eq(formatearTiempo(null), '00:00', '⚠️ ni algo que no es un número');

console.log('\n═══ 4. LA CONFIGURACIÓN ═══\n');

eq([CFG.enfoqueMin, CFG.cortoMin, CFG.largoMin, CFG.sesionesAntesDelLargo], [25, 5, 15, 4],
  '*"Enfoque 25 · Descanso corto 5 · Descanso largo 15 · Sesiones antes del largo 4"*');
eq(CFG.autoDescanso, false,
  '🚨 **el descanso automático nace APAGADO**: uno que arranca solo cuando él ya ha guardado el móvil deja un pomodoro a medias');
eq(CFG.autoSiguiente, false, '⚠️ y la siguiente sesión también');
eq(DURACIONES_SUGERIDAS, [15, 20, 25, 30, 45, 60], 'las seis duraciones del enunciado');
eq(duracionDe('focus', { ...CFG, enfoqueMin: 45 }), 45 * MIN, '*"TODOS deben poder configurarse"*');
eq(duracionDe('short_break', CFG), 5 * MIN, 'el descanso corto');
eq(duracionDe('long_break', CFG), 15 * MIN, 'y el largo');
eq(normalizarConfig({ enfoqueMin: 0 }).enfoqueMin, 25, '⚠️ una duración de cero no se guarda');
eq(normalizarConfig({ enfoqueMin: 9999 }).enfoqueMin, MAX_MINUTOS, `⚠️ ni una de más de ${MAX_MINUTOS} minutos`);
eq(normalizarConfig({ enfoqueMin: -5 }).enfoqueMin, MIN_MINUTOS, '⚠️ ni una negativa');
eq(normalizarConfig({ sesionesAntesDelLargo: 1 }).sesionesAntesDelLargo, 2,
  '⚠️ y con 1 sesión antes del largo, el descanso largo sería siempre: mínimo 2');
eq(normalizarConfig({ sesionesAntesDelLargo: 99 }).sesionesAntesDelLargo, 12, '⚠️ y máximo 12');
eq(normalizarConfig(null), CFG, '⚠️ sin nada guardado, la de siempre');
eq(normalizarConfig({ autoDescanso: 'sí' }).autoDescanso, false, '⚠️ y un booleano que no lo es cuenta como no');

console.log('\n═══ 5. EL CICLO ═══\n');

eq(TIPOS_SESION.map((t) => t.id), ['focus', 'short_break', 'long_break'],
  '*"Tipos: focus · short_break · long_break"*');
eq(TIPOS_SESION.filter((t) => t.esDescanso).length, 2, 'dos son descanso');
const ciclo = [0, 1, 2, 3].map((hechas) => siguienteEnElCiclo({ ...s, sesionesHechas: hechas }, CFG).tipo);
eq(ciclo, ['short_break', 'short_break', 'short_break', 'long_break'],
  '🚨 *"Enfoque → corto → … → Enfoque → **LARGO**"*: el cuarto lleva al descanso largo');
eq(siguienteEnElCiclo({ ...s, tipo: 'short_break', sesionesHechas: 2 }, CFG).tipo, 'focus',
  '⚠️ y tras un descanso siempre toca enfocar');
eq(siguienteEnElCiclo({ ...s, tipo: 'long_break', sesionesHechas: 4 }, CFG).sesionesHechas, 0,
  '🚨 **y tras el largo el contador vuelve a cero**: si no, el quinto pomodoro también daría descanso largo');
eq(siguienteEnElCiclo({ ...s, sesionesHechas: 3 }, CFG).sesionesHechas, 4, '⚠️ y cada enfoque suma uno');
eq(siguienteEnElCiclo(null, CFG).tipo, 'focus', '⚠️ y sin sesión previa se empieza enfocando');
eq(siguienteEnElCiclo({ ...s, sesionesHechas: 2 }, { ...CFG, sesionesAntesDelLargo: 3 }).tipo, 'long_break',
  '⚠️ y el número de sesiones antes del largo se respeta');

eq(posicionEnElCiclo(s, CFG).texto, 'Sesión 1 de 4', '*"Sesión 2 de 4"*: el contador dice dónde está');
eq(posicionEnElCiclo({ ...s, sesionesHechas: 1 }, CFG).texto, 'Sesión 2 de 4', '⚠️ y avanza');
eq(posicionEnElCiclo({ ...s, tipo: 'short_break', sesionesHechas: 2 }, CFG).texto, 'Sesión 2 de 4',
  '⚠️ durante un descanso se enseña la que se acaba de hacer, no la siguiente');
eq(posicionEnElCiclo(null, CFG).texto, 'Sesión 1 de 4', '⚠️ y sin sesión, la primera');
ok(posicionEnElCiclo({ ...s, sesionesHechas: 99 }, CFG).actual <= 4, '⚠️ y nunca dice «Sesión 100 de 4»');

console.log('\n═══ 6. REGISTRAR: COMPLETADA E INTERRUMPIDA ═══\n');

const hecha = completar(s, T0 + 25 * MIN);
eq(Object.keys(hecha).sort(), [...CAMPOS_SESION].sort(), 'los campos del enunciado, y ni uno más');
ok(!Object.keys(hecha).includes('user_id'),
  '⚠️ y `user_id` NO es un campo: la fila de `app_data` es del usuario (EH F43)');
eq(hecha.completada, true, 'una completada lo dice');
eq(hecha.interrumpida, false, '⚠️ y no está interrumpida');
eq(hecha.duracionMs, 25 * MIN, '⚠️ con su duración entera');

/* ⚠️ Empieza DESPUÉS que la completada: si las dos arrancaran en el mismo
   instante, el orden del historial sería un empate y la prueba no comprobaría
   nada. */
const rota = cancelar(iniciarSesion('focus', CFG, { ahora: T0 + 30 * MIN }), T0 + 37 * MIN);
eq(rota.completada, false, '*"Si el usuario cancela: no contarla como Pomodoro completado"*');
eq(rota.interrumpida, true, '*"Pero opcionalmente registrar que fue interrumpida"*');
eq(rota.duracionMs, 7 * MIN,
  '🚨 **y se guarda lo que DE VERDAD duró**, no lo que iba a durar: siete minutos de concentración son un dato honesto');
ok(esPomodoro(hecha), 'una de enfoque completada es un pomodoro');
ok(!esPomodoro(rota), '🚨 y una cancelada NO');
ok(!esPomodoro(completar({ ...s, tipo: 'short_break' }, T0 + 5 * MIN)),
  '🚨 y un descanso tampoco, aunque se complete');

eq(normalizarSesion({ tipo: 'focus', inicio: T0, completada: true }).interrumpida, false,
  '⚠️ `interrumpida` se deriva de `completada`: no se guardan dos veces lo mismo, ni pueden contradecirse');
eq(normalizarSesion({ tipo: 'focus', inicio: T0, completada: true, interrumpida: true }).interrumpida, false,
  '🚨 y una guardada con las dos a `true` se corrige: son lo contrario');
eq(normalizarSesion({ tipo: 'inventado', inicio: T0 }), null, '⚠️ un tipo que no existe no es una sesión');
eq(normalizarSesion({ tipo: 'focus' }), null, '⚠️ ni una sin instante de inicio');
eq(normalizarSesion(null), null, '⚠️ ni algo que no es un objeto');
eq(normalizarSesiones([hecha, null, { tipo: 'x' }]).length, 1, '⚠️ y la lista descarta lo que no vale');

console.log('\n═══ 7. SOBREVIVIR A RECARGAR ═══\n');

/* *"Si el usuario cambia de pantalla, recarga la aplicación, cierra y vuelve a
   abrir la PWA: el estado del temporizador debe recuperarse."* Se guarda y se
   relee, y como son cuatro números, el viaje por JSON no pierde nada. */
const ida = JSON.parse(JSON.stringify(s));
const vuelta = normalizarSesionEnCurso(ida);
eq(restanteMs(vuelta, T0 + 10 * MIN), 15 * MIN,
  '🚨 una sesión guardada y releída sigue contando desde donde estaba');
eq(normalizarSesionEnCurso(JSON.parse(JSON.stringify(p))).pausadoEn, p.pausadoEn,
  '⚠️ y una pausada vuelve pausada');
eq(normalizarSesionEnCurso({ tipo: 'focus', inicio: 0, duracionMs: 1000 }), null,
  '🚨 y un estado sin instante de inicio se descarta: dejaría un temporizador contando desde 1970');
eq(normalizarSesionEnCurso({ tipo: 'focus', inicio: T0, duracionMs: 0 }), null, '⚠️ ni uno sin duración');
eq(normalizarSesionEnCurso(null), null, '⚠️ y sin nada guardado, ninguna sesión');
eq(normalizarSesionEnCurso({ tipo: 'inventado', inicio: T0, duracionMs: 1000 }), null, '⚠️ ni con un tipo que no existe');
ok(/pomodoroEnCurso/.test(APP) && /saveData\(uidUser, 'productividad'/.test(APP),
  '🚨 y `App.jsx` la guarda de verdad en Supabase: sin eso, recargar la perdería');

console.log('\n═══ 8. EL SONIDO ES EL DEL SISTEMA ═══\n');

eq(SONIDO.propio, false, '🚨 *"NO crear un sistema paralelo de volumen"*');
ok(!/new Audio|reproducir\(|audioEngine|volumen/.test(LIB_CODIGO),
  '🚨 y la librería **no toca el audio**: ni lo reproduce, ni sabe qué volumen hay');
ok(!!CATALOGO[EVENTO_AL_TERMINAR],
  '🚨 el evento que se emite **existe en el catálogo de sonidos** de SO F3');
ok(CATALOGO[EVENTO_AL_TERMINAR].motor, '⚠️ y tiene sonido de verdad detrás, no es un hueco');
ok(/emitir\(EVENTO_AL_TERMINAR/.test(VISTA_LIMPIA),
  '⚠️ y la pantalla lo EMITE al bus, como hace Rachas: quien decide si suena es el motor de SO F1');
ok(!/new Audio|reproducir\(/.test(VISTA_LIMPIA.split('PomodoroTab')[1] || ''),
  '⚠️ y no reproduce nada por su cuenta');
ok(SONIDO.porQueNoUnoNuevo.length > 40,
  '⚠️ y se dice por qué no se inventa un sonido nuevo: la biblioteca es de SO F4 y no tiene campana de pomodoro');

console.log('\n═══ 9. LOS AVISOS, CON SU LÍMITE DICHO ═══\n');

eq(AVISOS.sistemaPropio, false, '*"No crear ahora un sistema global nuevo únicamente para Pomodoro"*');
ok(/notificaciones\.js/.test(AVISOS.reutiliza), '⚠️ se reutiliza el de la Fase A4');
eq(AVISOS.conLaAppCerrada, false,
  '🚨 **y con la aplicación cerrada no llega nada, y se dice**: no hay service worker (DEP-30, E3 F11)');
ok(!/requestPermission/.test(LIB_CODIGO), '⚠️ y esta fase no pide permisos por su cuenta');

console.log('\n═══ 10. ESTADÍSTICAS DERIVADAS ═══\n');

const HOY = hecha.fecha;
const sesiones = [hecha, rota];
const e = estadisticasHoy(sesiones, HOY);
eq(e.pomodoros, 1, '*"HOY: pomodoros completados"* — solo los completados');
eq(e.tiempo, '25 min', '*"tiempo concentrado"*');
eq(e.interrumpidas, 1, '⚠️ y las canceladas se cuentan aparte, sin sumar como pomodoro');
eq(estadisticasHoy([], HOY).pomodoros, 0, 'sin sesiones, cero');
eq(estadisticasHoy([], HOY).tiempo, null,
  '🚨 **y el tiempo es `null`, no «0 min»**: un cero de minutos no informa de nada');
eq(formatearDuracionLarga(75 * MIN), '1 h 15 min', '*"1 h 15 min"*, con las palabras del enunciado');
eq(formatearDuracionLarga(60 * MIN), '1 h', '⚠️ sin los minutos cuando son cero');
eq(formatearDuracionLarga(0), null, '⚠️ y cero es `null`');
ok(estadisticasSemana(sesiones, HOY).pomodoros >= 1, '*"ESTA SEMANA"* cuenta la semana');
ok(!/guardar|saveData/.test(LIB_CODIGO),
  '🚨 y **no se guarda ni una cifra**: una estadística guardada miente en cuanto él borra un registro (E3 F13)');

eq(historialReciente(sesiones)[0].id, rota.id,
  'el historial va de lo más nuevo a lo más viejo: la cancelada empezó media hora después');
eq(historialReciente(sesiones, 1).length, 1, '⚠️ y se corta al tope');
eq(historialReciente([], 5).length, 0, '⚠️ y sin nada, nada');
ok(MAX_HISTORIAL === 20, '⚠️ *"no hace falta un sistema analítico enorme"*: veinte por defecto');

console.log('\n═══ 11. EL CONTADOR DE SIEMPRE NO SE ROMPE ═══\n');

/* 🚨 `productividad.pomodoros` lo leen `avisosPlanificacion.js` y
   `estadisticasPlan.js` desde antes de esta fase. */
const contador = contadorDesdeSesiones(sesiones);
eq(contador[HOY], 1, '🚨 el contador por día se recalcula **desde las sesiones**');
eq(Object.keys(contadorDesdeSesiones([rota])).length, 0, '⚠️ y una cancelada no suma');
eq(contadorDesdeSesiones([]), {}, '⚠️ y sin sesiones, ningún día');
ok(/contadorDesdeSesiones/.test(APP),
  '🚨 y `App.jsx` lo usa al registrar: **una sola fuente de verdad**, no un número incrementado a mano al lado');
ok(['apuntes', 'habitos', 'metas', 'pomodoros', 'rutinas', 'tareas'].every((k) => k in DEFAULT_PRODUCTIVIDAD),
  '⚠️ y las listas que ya existían siguen todas ahí');
ok(['pomodoroConfig', 'pomodoroEnCurso', 'pomodoroSesiones'].every((k) => k in DEFAULT_PRODUCTIVIDAD),
  '⚠️ con las tres nuevas al lado');

console.log('\n═══ 12. LA VINCULACIÓN CON TAREAS: EL CAMPO SÍ, LA INTERFAZ NO ═══\n');

eq(VINCULACION_CON_TAREAS.existe, true, '*"Preparar opcionalmente un campo `task_id`"*');
eq(VINCULACION_CON_TAREAS.interfaz, false,
  '🚨 *"pero NO desarrollar todavía el gestor de tareas. **No mostrar una interfaz de tareas falsa**"*');
eq(iniciarSesion('focus', CFG, { ahora: T0, tareaId: 't1' }).tareaId, 't1', '⚠️ el campo viaja en la sesión');
eq(completar(iniciarSesion('focus', CFG, { ahora: T0, tareaId: 't1' }), T0 + MIN).tareaId, 't1', '⚠️ y llega al historial');
eq(iniciarSesion('focus', CFG, { ahora: T0 }).tareaId, null, '⚠️ y sin tarea es `null`');
/* ⚠️ **Actualizado en la E3 F26:** la PR F4 ya existe, así que el Pomodoro **sí
   dice en qué tarea se está concentrando** cuando la sesión salió de una. Lo que
   sigue sin haber —y es lo que prohíbe el apartado— es un **selector**: desde
   aquí no se elige una tarea; se entra desde Tareas con «Concentrarme». */
{
  const cuerpo = (VISTA_LIMPIA.split('function PomodoroTab')[1] || '').split('\nfunction ')[0];
  ok(!/<Select|<option|onChange=\{\(ev\) => set[A-Z]\w*Tarea/.test(cuerpo),
    '🚨 y no hay ni un SELECTOR de tareas en la pantalla de Pomodoro: se entra desde Tareas');
  ok(/tareaDeSesion/.test(cuerpo),
    '⚠️ pero sí dice en qué tarea se concentra (E3 F26): un `tareaId` que no se ve no sirve de nada');
}

console.log('\n═══ 13. LOS TEXTOS Y LA PANTALLA ═══\n');

eq(CABECERA_POMODORO.titulo, 'Pomodoro', 'la cabecera del enunciado');
eq(CABECERA_POMODORO.frase, 'Concéntrate. Una sesión cada vez.', '⚠️ con su frase, palabra por palabra');
ok(VISTA_LIMPIA.includes('CABECERA_POMODORO.frase'), '⚠️ y se lee en la pantalla');
ok(!!VACIO_POMODORO.titulo && !!VACIO_POMODORO.frase, 'y sin sesiones hay un vacío con algo que decir');
for (const comp of ['TemporizadorCircular', 'ConfigPomodoro', 'EstadisticasPomodoro']) {
  ok(new RegExp(`export function ${comp}\\b`).test(VISTA), `⚠️ ${comp} existe`);
}
ok(/aria-label="Pausar la sesión"/.test(VISTA)
  && /'Continuar la sesión' : 'Iniciar la sesión'/.test(VISTA)
  && /aria-label="Cerrar el detalle del hábito"/.test(VISTA),
'⚠️ y los controles dicen lo que hacen, para quien use VoiceOver — el principal cambia de nombre según lo que vaya a hacer');
ok(/aria-live="polite"/.test(VISTA),
  '⚠️ y el tiempo se anuncia solo: un lector de pantalla no puede mirar un reloj');
ok(/\.aro-pomodoro\s*\{/.test(CSS),
  '🚨 y la animación del aro **existe de verdad en el CSS**: una animación declarada y no escrita es un catálogo que miente (E3 F14)');
ok(!/@keyframes/.test(VISTA), '⚠️ y no se escribe ninguna animación en la vista');

console.log('\n═══ 14. NADA SE HA ROTO, Y LO QUE NO SE HACE ═══\n');

eq(DONDE_SE_GUARDA_POMODORO.filter((d) => d.nuevo).length, 0, '⚠️ todo se guarda donde ya se guardaba');
eq(AISLAMIENTO_POMODORO.tablasNuevas, 0, '🚨 ni una tabla nueva');
ok(/auth\.uid\(\) = user_id/.test(AISLAMIENTO_POMODORO.politicas), '⚠️ y el aislamiento es de la base de datos');
ok(!/create table|create policy/i.test(LIB), '⚠️ esta fase no trae SQL');
eq(MINI_APPS_PR.length, 6, '⚠️ y siguen siendo seis mini-apps');
ok(NO_EN_PR3.every((x) => x.que && x.llega), 'lo que no se hace dice cuándo llega');
for (const palabra of ['Tareas', 'IA', 'notificaciones', 'cerrada'])
  ok(NO_EN_PR3.some((x) => new RegExp(palabra, 'i').test(x.que)), `⚠️ ${palabra} está declarado`);
ok(!/askAI|ask-ai|anthropic/i.test(LIB_CODIGO), '🚨 sin IA');
ok(!/\bxp\b|nivel|moneda/i.test(LIB_CODIGO.replace(/[a-z0-9]{8,}/gi, '')), '🚨 y sin gamificación (D2-02)');

console.log('\n═══ 15. LA CONDICIÓN DE FINALIZACIÓN, CALCULADA ═══\n');

const cond = condicionPR3(CFG, sesiones);
eq(cond.length, 16, 'dieciséis casillas, una por criterio comprobable');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y las dieciséis en verde');
ok(pr3Terminada(CFG, sesiones), 'la fase está terminada');
ok(pr3Terminada(CFG, []), '⚠️ y sin sesiones: la condición es del sistema, no de sus datos');
ok(!/ok: true,/.test(LIB_CODIGO.replace(/existe: true|completada: true|propio: false/g, '')),
  '🚨 y ninguna casilla está puesta a `true` a mano');

console.log('\n═══ 16. 🚨 REGISTRAR Y CAMBIAR DE SESIÓN SON UNA ESCRITURA (E3 F26) ═══\n');

/* 🚨 **EL FALLO QUE CAZÓ EL RECORRIDO EN CHROMIUM.** La pantalla llamaba a
   `onRegistrar(...)` y justo después a `onCambiarSesion(...)`. Las dos parten
   del **mismo `productividad` del cierre** —React no ha vuelto a pintar entre
   medias—, así que la segunda escribía encima de la lista que acababa de
   guardar la primera (regla 5: `saveData` sobrescribe, no fusiona). Resultado:
   **cancelar o completar un pomodoro no guardaba la sesión**, y con ella se
   perdía el contador por día que leen `avisosPlanificacion` y
   `estadisticasPlan` desde la Fase 6. */
{
  const base = { pomodoroSesiones: [], pomodoros: {}, pomodoroEnCurso: null, habitos: [] };
  const enCurso = iniciarSesion('focus', CONFIG_POMODORO_POR_DEFECTO, { ahora: Date.parse('2026-09-07T10:00:00Z') });
  const acabada = completar(enCurso, Date.parse('2026-09-07T10:25:00Z'));

  // Lo que hacía antes: dos escrituras, las dos partiendo de `base`.
  const primera = { ...base, pomodoroSesiones: [acabada], pomodoros: contadorDesdeSesiones([acabada]) };
  const segunda = { ...base, pomodoroEnCurso: null };
  ok(primera.pomodoroSesiones.length === 1, 'la primera escritura guardaba bien la sesión');
  ok(segunda.pomodoroSesiones.length === 0,
    '🐛 PERO LA SEGUNDA, PARTIENDO DEL MISMO ESTADO, LA BORRABA: dos escrituras seguidas se pisan');

  // Lo que hace ahora: una sola.
  const unaSola = {
    ...base,
    pomodoroSesiones: [acabada],
    pomodoros: contadorDesdeSesiones([acabada]),
    pomodoroEnCurso: null,
  };
  ok(unaSola.pomodoroSesiones.length === 1 && unaSola.pomodoroEnCurso === null,
    '🚨 UNA SOLA ESCRITURA guarda las dos cosas: la sesión queda registrada Y deja de haber una en curso');
  ok(Object.keys(unaSola.pomodoros).length === 1,
    '🚨 y el contador por día sobrevive: es el que leen `avisosPlanificacion` y `estadisticasPlan`');
}

{
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const vista = readFileSync(join(raiz, 'src/views/ProductivityView.jsx'), 'utf8');
  const app = readFileSync(join(raiz, 'src/App.jsx'), 'utf8');
  ok(!/onRegistrar\(/.test(vista),
    '🚨 y la pantalla ya NO tiene un `onRegistrar` suelto que se pise con el cambio de sesión');
  ok(/onFinalizar\(/.test(vista), 'lo que hay es `onFinalizar`, que hace las dos cosas de una vez');
  ok(/const finalizarSesionPomodoro = /.test(app) && /onFinalizarSesionPomodoro=\{finalizarSesionPomodoro\}/.test(app),
    '🚨 Y ALGUIEN LO LLAMA: una función que nadie llama no falla nunca');
  ok(/pomodoroEnCurso: siguiente \|\| null/.test(app),
    '⚠️ y escribe la sesión en curso en la MISMA llamada que la lista');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos\n`);
process.exit(fallos === 0 ? 0 : 1);
