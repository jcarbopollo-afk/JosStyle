/* ===========================================================================
   FIT F22/45 — HISTORIAL Y EVOLUCIÓN DE RANGOS

   Las veinte pruebas del apartado 34, más lo que esta fase tiene que demostrar
   que NO hace: inventarse un punto, interpolar el gráfico, reescribir el pasado
   o dejar un evento falso cuando se borra la sesión que lo sostenía.
   =========================================================================== */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { clasificarEjercicio } from '../src/lib/clasificacion.js';
import { addDays } from '../src/lib/helpers.js';
import { rangoEfectivoDeEjercicio } from '../src/lib/motorRangos.js';
import {
  TIPOS_ENTIDAD, tipoEntidad, DISPARADORES, disparador, NO_OBSERVABLE,
  PERIODOS_HISTORIAL, periodoHistorial, PERIODO_POR_DEFECTO, SIN_CAMBIOS_EN_PERIODO,
  SENTIDOS, marcaDeCambio, cambiosDe, momentosDe, momentoDeClasificacion, idsDeSesion,
  historialDeRango, rangoDeDestino, enPeriodo, resumenDeHistorial, timelineDeHistorial,
  graficaDeHistorial, PUNTOS_MINIMOS_GRAFICA, vacioDeHistorial, VACIOS_HISTORIAL,
  detalleDeCambio, ejerciciosResponsables, CAMBIO_SIN_DETALLE, pantallaDeHistorial,
  nombreDeDestino, HISTORIAL_INSUFICIENTE, auditarHistorialRangos, casillasDeHistorial,
  NO_EN_FIT22, DECISIONES_FIT22,
} from '../src/lib/historialRangos.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* ⚠️ Un barrido que comprueba que el código NO hace algo tiene que quitar los
   comentarios Y las cadenas: este archivo explica lo que no hace, y la propia
   explicación haría saltar la regla (la lección de siempre, por enésima vez). */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-18';
const EJ = 'dominada-prona';
const OTRO = 'press-banca-barra';
const TERCERO = 'sentadilla-barra';

let contador = 0;
/** Una sesión completada de un ejercicio, con sus series marcadas. */
function sesion(exerciseId, valores, cuando) {
  contador += 1;
  const fecha = cuando || addDays(HOY, -120 + contador);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  /* 🚨 Si el id no está en el catálogo, `anadirEjercicio` no añade nada y la
     línea siguiente reventaba con un `Cannot read properties of undefined`
     doce llamadas más abajo. Un escenario mal construido tiene que decir QUÉ
     está mal: ya ha costado dos veces en esta fase. */
  if (!r.lineas.length) throw new Error(`El ejercicio «${exerciseId}» no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (base, ...ss) => ss.reduce((f, s) => guardarSesion(f, s), base);
const reps = (n) => [{ reps: n }, { reps: Math.max(1, n - 2) }];
const dest = (tipo, id = '') => ({ tipo, id });

/* Los escenarios que no varían se construyen UNA vez: una fábrica que llama a
   `uid()` devuelve ids distintos cada vez, y pasar el id de un escenario a otro
   recién creado no encuentra nada (la lección de GE F2, que ya ha costado
   cinco rojos falsos en esta entrega). */
const VACIO = { ...DEFAULT_FITNESS, sesiones: [], clasificaciones: [] };
const UNA = con(VACIO, sesion(EJ, reps(8), addDays(HOY, -60)));
const DOS = con(VACIO, sesion(EJ, reps(4), addDays(HOY, -60)), sesion(EJ, reps(16), addDays(HOY, -30)));
const SUBIDA = con(VACIO,
  sesion(EJ, reps(3), addDays(HOY, -100)),
  sesion(EJ, reps(9), addDays(HOY, -70)),
  sesion(EJ, reps(15), addDays(HOY, -40)),
  sesion(EJ, reps(21), addDays(HOY, -10)));
/* Mismo rango en los dos puntos, score distinto (apartado 5 de las pruebas). */
const SOLO_SCORE = con(VACIO,
  sesion(EJ, reps(15), addDays(HOY, -40)),
  sesion(EJ, reps(16), addDays(HOY, -20)));

console.log('\n\x1b[1m1 · LAS ENTIDADES Y LOS DISPARADORES (apartado 3)\x1b[0m');

ok(TIPOS_ENTIDAD.map((t) => t.id).join() === 'exercise,subgroup,muscleGroup,overall',
  'Los cuatro `entityType` del apartado 3, con sus nombres');
ok(TIPOS_ENTIDAD.every((t) => t.nombre && t.nombre !== t.id) && tipoEntidad('overall').nombre === 'Rango global',
  'Cada uno tiene un nombre en español para la pantalla (apartado 11)');
ok(tipoEntidad('inventado') === null, 'Y un tipo que no existe devuelve null, no un objeto a medias');
ok(DISPARADORES.map((d) => d.id).sort().join() === 'manualReclassification,questionnaire,workout',
  'Los tres `trigger` que SÍ se pueden observar');
ok(DISPARADORES.every((d) => !/^[a-z]+[A-Z]/.test(d.nombre)) && disparador('workout').nombre === 'Entrenamiento',
  '🚨 En pantalla se lee «Entrenamiento», no `workout` (apartado 11: nada de lenguaje técnico)');
ok(NO_OBSERVABLE.map((n) => n.id).sort().join() === 'sessionDeleted,sessionEdited',
  '🚨 Y los dos que NO se pueden observar están declarados, no fingidos');
ok(NO_OBSERVABLE.every((n) => n.porque.length > 60 && n.haria_falta),
  'Cada uno con su motivo y qué haría falta para tenerlo (regla 8)');
ok(!DISPARADORES.some((d) => NO_OBSERVABLE.some((n) => n.id === d.id)),
  'Ninguno de los dos se cuela en la lista de los que se emiten');

console.log('\n\x1b[1m2 · SIN HISTORIAL Y CON DATOS INSUFICIENTES (pruebas 1 y 18)\x1b[0m');

const hVacio = historialDeRango(VACIO, dest('exercise', EJ));
ok(hVacio.puntos.length === 0 && hVacio.cambios.length === 0 && hVacio.suficiente === false,
  'Prueba 1 — sin un solo dato no hay ni puntos ni cambios');
ok(hVacio.actual === null && hVacio.anterior === null,
  'Ni rango actual ni anterior: `null`, que no es un cero (la lección de `Number(null)`)');
ok(hVacio.motivo === 'sin_historial', 'Y se dice por qué está vacío');
ok(vacioDeHistorial(hVacio).titulo === VACIOS_HISTORIAL.ejercicio.titulo
  && vacioDeHistorial(hVacio).cta === 'Ver progreso',
  'Prueba 18 — el vacío de un ejercicio es el del apartado 26, con su salida «Ver progreso»');
ok(vacioDeHistorial(historialDeRango(VACIO, dest('overall'))).titulo === HISTORIAL_INSUFICIENTE,
  'Y el del rango global es «Historial insuficiente», literal del apartado 2');
ok(vacioDeHistorial(historialDeRango(SUBIDA, dest('exercise', EJ))) === null,
  'Con historial no se enseña ningún vacío');
ok(historialDeRango(VACIO, dest('loQueSea', 'x')).motivo === 'destino_desconocido',
  'Un destino que no existe no revienta: devuelve su motivo');
ok(resumenDeHistorial(hVacio).hay === false && resumenDeHistorial(null).hay === false,
  'El resumen de algo sin historial no inventa nada, ni con `null` delante');

console.log('\n\x1b[1m3 · UN PUNTO, DOS PUNTOS (pruebas 2 y 3)\x1b[0m');

const hUna = historialDeRango(UNA, dest('exercise', EJ));
ok(hUna.puntos.length === 1, 'Prueba 2 — una sesión es UN punto');
ok(hUna.cambios.length === 0, 'Con un solo punto no puede haber ningún cambio: no hay desde dónde');
ok(hUna.anterior === null && resumenDeHistorial(hUna).sigueEn !== null,
  'Y entonces no hay «rango anterior»: se dice «Sigues en…» (apartado 27)');
ok(timelineDeHistorial(hUna)[0].detalle === 'Primer dato registrado',
  '🚨 La primera línea NO puede decir «↑ desde…»: no había desde');
const hDos = historialDeRango(DOS, dest('exercise', EJ));
ok(hDos.puntos.length === 2, 'Prueba 3 — dos sesiones con rangos distintos son dos puntos');
ok(hDos.cambios.length === 1 && hDos.anterior !== null,
  'Y con dos puntos distintos ya hay un cambio y un rango anterior');

console.log('\n\x1b[1m4 · SOLO CUENTA UN CAMBIO SI CAMBIA EL RANGO (pruebas 4, 5, 6 y 7 · apartados 7 y 8)\x1b[0m');

const hScore = historialDeRango(SOLO_SCORE, dest('exercise', EJ));
ok(hScore.puntos.length === 2 && hScore.puntos[0].rango === hScore.puntos[1].rango,
  'Prueba 5 — dos puntos del MISMO rango con score distinto');
ok(hScore.puntos[1].score > hScore.puntos[0].score, 'El score sí ha subido');
ok(hScore.cambios.length === 0,
  '🚨 …y NO se crea un evento de subida: *"480 → 520, si ambos siguen siendo Intermedio"* (apartado 7, literal)');
const rScore = resumenDeHistorial(hScore);
ok(rScore.sigueEn === `Sigues en ${rScore.actual.nombre}` && rScore.progresoDentro === true,
  'Se enseña «Sigues en X» + «Has progresado dentro de este rango» (apartados 8 y 27)');
ok(rScore.textoDentro === 'Has progresado dentro de este rango.' && rScore.subida === null,
  '🚨 Y «progreso dentro» y «has subido de rango» son DOS campos, no un texto ambiguo');
const hSub = historialDeRango(SUBIDA, dest('exercise', EJ));
ok(hSub.cambios.length >= 2 && hSub.cambios.every((c) => c.sentido === 'subida'),
  'Prueba 6 — entrenando cada vez más, los cambios son subidas');
ok(hSub.cambios.every((c) => c.hasta > c.desde), 'Y en una subida el rango nuevo es mayor');
ok(cambiosDe([{ fecha: 'a', rango: 5, nombre: 'X', score: 500 }, { fecha: 'b', rango: 3, nombre: 'Y', score: 300 }])[0].sentido === 'bajada',
  'Prueba 7 — un punto con rango menor que el anterior es una bajada');
ok(cambiosDe([{ fecha: 'a', rango: 5 }, { fecha: 'b', rango: 5 }]).length === 0,
  'Y dos puntos del mismo rango no generan cambio, sea cual sea su score');
ok(cambiosDe([]).length === 0 && cambiosDe().length === 0, 'Sin puntos, sin cambios (y sin reventar)');

/* 🚨 Una bajada de VERDAD, con el motor: la puntuación es la mejor de las
   últimas cinco, así que hacen falta cinco sesiones peores seguidas (F19). */
const BAJADA = con(VACIO,
  sesion(EJ, reps(20), addDays(HOY, -90)),
  sesion(EJ, reps(3), addDays(HOY, -70)),
  sesion(EJ, reps(3), addDays(HOY, -60)),
  sesion(EJ, reps(3), addDays(HOY, -50)),
  sesion(EJ, reps(3), addDays(HOY, -40)),
  sesion(EJ, reps(3), addDays(HOY, -30)));
const hBaja = historialDeRango(BAJADA, dest('exercise', EJ));
ok(hBaja.cambios.some((c) => c.sentido === 'bajada'),
  '🚨 Prueba 7 con el motor de verdad: cinco sesiones peores seguidas SÍ bajan el rango');
ok(marcaDeCambio('bajada').marca === '↓' && marcaDeCambio('subida').marca === '↑' && marcaDeCambio('igual').marca === '→',
  'Apartado 31 — cada sentido tiene su flecha');
ok(SENTIDOS.every((s) => s.nombre && s.marca) && marcaDeCambio('subida').texto === '↑ Subida de rango',
  '🚨 …y su PALABRA: el cambio se entiende sin depender del color (apartado 31)');
ok(marcaDeCambio('loQueSea') === null, 'Un sentido inventado devuelve null');

console.log('\n\x1b[1m5 · EL CUESTIONARIO Y LOS DATOS REALES DE DESPUÉS (pruebas 8 y 9 · apartado 12)\x1b[0m');

const T0 = new Date(`${addDays(HOY, -120)}T10:00:00`).getTime();
/* ⚠️ El id de la opción sale de la PREGUNTA, no escrito a ojo: unas dominadas
   se clasifican por repeticiones y sus opciones son `reps-*`. */
const clasificado = clasificarEjercicio(VACIO, EJ, 'reps-9', { ahora: T0 });
ok(clasificado.ok === true, 'El escenario del cuestionario se construye de verdad (si esto falla, lo de abajo no mide nada)');
const soloCuestionario = clasificado.fitness;
const hCuest = historialDeRango(soloCuestionario, dest('exercise', EJ));
ok(hCuest.puntos.length === 1 && hCuest.puntos[0].fuente === 'cuestionario',
  'Prueba 8 — con solo el cuestionario hay un punto, y su fuente es la clasificación');
ok(hCuest.puntos[0].fecha === addDays(HOY, -120),
  'Y cae el día que lo contestó, no hoy');
ok(timelineDeHistorial(hCuest)[0].detalle === 'Clasificación inicial',
  'El timeline lo rotula «Clasificación inicial» (apartado 10)');
ok(hCuest.puntos[0].provisional === true,
  '🚨 Un rango que sale de un cuestionario es PROVISIONAL (apartado 12)');

/* Prueba 9 — las sesiones reales llegan DESPUÉS del cuestionario. */
const cuestYSesiones = con(soloCuestionario,
  sesion(EJ, reps(15), addDays(HOY, -40)),
  sesion(EJ, reps(16), addDays(HOY, -30)),
  sesion(EJ, reps(17), addDays(HOY, -20)),
  sesion(EJ, reps(18), addDays(HOY, -10)));
const hMixto = historialDeRango(cuestYSesiones, dest('exercise', EJ));
ok(hMixto.puntos[0].fuente === 'cuestionario',
  'Prueba 9 — el primer punto sigue siendo el del cuestionario');
ok(hMixto.puntos[hMixto.puntos.length - 1].fuente === 'entrenamiento',
  'Y el último ya sale solo de los entrenamientos (apartado 12)');
ok(hMixto.puntos[0].provisional === true && hMixto.puntos[hMixto.puntos.length - 1].provisional === false,
  '🚨 EL PASADO NO SE REESCRIBE: el punto del cuestionario sigue provisional aunque hoy haya cuatro sesiones (apartado 12, literal)');
ok(hMixto.puntos[0].dataPoints === 0 && hMixto.puntos[hMixto.puntos.length - 1].dataPoints === 4,
  'Y cada punto lleva los datos que había ESE día, no los de hoy');
ok(hMixto.puntos.some((p) => p.fuente === 'combinado'),
  'Por el medio, la fuente combinada de la F19: la estimación apagándose poco a poco');

/* Apartado 9 — reclasificar borra la respuesta anterior, y se declara. */
const reclas = clasificarEjercicio(soloCuestionario, EJ, 'reps-14', { ahora: T0 + 86400000 * 30 });
ok(reclas.ok === true && reclas.clasificacion.respuesta === 'reps-14',
  'Y el de la reclasificación también: se recontesta con otra opción');
const reclasificado = reclas.fitness;
const mReclas = momentoDeClasificacion(reclasificado.clasificaciones[0]);
ok(mReclas.trigger === 'manualReclassification' && mReclas.estimacionAnteriorPerdida === true,
  '🚨 Reclasificar es otro disparador, y marca que la estimación anterior se ha perdido');
ok(mReclas.fecha === addDays(HOY, -90),
  'Y el punto cae el día de la RECLASIFICACIÓN, no el del cuestionario original');
ok(historialDeRango(reclasificado, dest('exercise', EJ)).estimacionAnteriorPerdida === true,
  '🚨 El historial lo declara, en vez de dibujar ese tramo con la puntuación de hoy (apartado 9)');
ok(momentoDeClasificacion(null) === null && momentoDeClasificacion({ puntuacion: null }) === null,
  'Una clasificación sin puntuación no es un punto');

console.log('\n\x1b[1m6 · EDITAR, ELIMINAR Y AÑADIR UNA SESIÓN (pruebas 10, 11 y 12 · apartados 17, 18 y 19)\x1b[0m');

/* 🚨 Estas tres pruebas son las que demuestran que derivarlo era lo correcto:
   NO hay una línea de código de invalidación, y aun así el historial queda
   coherente. Si alguien guardase el historial, aquí empezarían los problemas. */
const sinUltima = { ...SUBIDA, sesiones: SUBIDA.sesiones.filter((s) => s.fecha !== addDays(HOY, -10)) };
const hSinUltima = historialDeRango(sinUltima, dest('exercise', EJ));
ok(hSinUltima.cambios.length === hSub.cambios.length - 1,
  '🚨 Prueba 11 — al borrar la sesión que causó el último cambio, ese cambio DESAPARECE (apartado 18)');
ok(hSinUltima.actual.rango < hSub.actual.rango,
  'Y el rango actual se corrige solo: no queda un estado que ya no sostiene nada');
ok(!hSinUltima.cambios.some((c) => c.fecha === addDays(HOY, -10)),
  'No queda ningún evento histórico falso (apartado 18, literal)');

const editada = {
  ...SUBIDA,
  sesiones: SUBIDA.sesiones.map((s) => (s.fecha !== addDays(HOY, -10) ? s : {
    ...s,
    origen: {
      ...s.origen,
      ejercicios: s.origen.ejercicios.map((e) => ({
        ...e, series: e.series.map((x) => ({ ...x, hecho: { ...x.hecho, reps: 3 } })),
      })),
    },
  })),
};
const hEditada = historialDeRango(editada, dest('exercise', EJ));
ok(hEditada.actual.score < hSub.actual.score,
  '🚨 Prueba 10 — al editar una sesión a la baja, el rango se recalcula sin invalidar nada (apartado 17)');
ok(hEditada.puntos.length > 0 && hEditada.puntos.every((p) => p.triggers.length > 0),
  'Y el historial sigue siendo coherente: todos sus puntos caen en días con datos');

const conNueva = con(SUBIDA, sesion(EJ, reps(26), addDays(HOY, -1)));
const hNueva = historialDeRango(conNueva, dest('exercise', EJ));
ok(hNueva.puntos.length > hSub.puntos.length,
  'Prueba 12 — una sesión nueva añade un punto al final (apartado 19)');
ok(hNueva.puntos.slice(0, hSub.puntos.length).every((p, i) => p.fecha === hSub.puntos[i].fecha && p.rango === hSub.puntos[i].rango),
  '…y NO toca los puntos anteriores');

/* 🚨 La comprobación que demuestra que no hay caché guardada en `fitness`. */
ok(!Object.keys(hSub).includes('guardado') && JSON.stringify(SUBIDA).indexOf('rankHistory') === -1
  && !Object.prototype.hasOwnProperty.call(SUBIDA, 'historialRangos'),
  '🚨 Y NADA de esto se guarda en `fitness`: el historial es una lectura (apartado 3)');

console.log('\n\x1b[1m7 · EJERCICIO, SUBGRUPO, GRUPO Y GLOBAL (pruebas 13, 14, 15, 16 y 17)\x1b[0m');

ok(historialDeRango(SUBIDA, dest('exercise', EJ)).puntos.length > 1, 'Prueba 13 — el historial de un ejercicio');
ok(historialDeRango(SUBIDA, dest('subgroup', 'dorsales')).puntos.length > 0,
  'Prueba 14 — el de un subgrupo que las dominadas trabajan');
ok(historialDeRango(SUBIDA, dest('subgroup', 'cuadriceps')).puntos.length === 0,
  'Y un subgrupo que no tocan, ninguno');
const hEsp = historialDeRango(SUBIDA, dest('muscleGroup', 'espalda'));
ok(hEsp.puntos.length > 1 && hEsp.cambios.length > 0, 'Prueba 15 — el de un grupo muscular (apartado 5)');
ok(historialDeRango(SUBIDA, dest('muscleGroup', 'piernas')).puntos.length === 0,
  '🚨 Y un grupo que NO ha entrenado no tiene historial: ni un punto inventado');

/* Prueba 16 — el global necesita cobertura: tres grupos y tres ejercicios. */
const GLOBAL = con(VACIO,
  sesion(EJ, reps(6), addDays(HOY, -80)), sesion(OTRO, [{ peso: 40, reps: 8 }], addDays(HOY, -78)),
  sesion(TERCERO, [{ peso: 60, reps: 8 }], addDays(HOY, -76)),
  sesion(EJ, reps(14), addDays(HOY, -30)), sesion(OTRO, [{ peso: 70, reps: 8 }], addDays(HOY, -28)),
  sesion(TERCERO, [{ peso: 110, reps: 8 }], addDays(HOY, -26)));
const hGlobal = historialDeRango(GLOBAL, dest('overall'));
ok(hGlobal.puntos.length > 0, 'Prueba 16 — con cobertura suficiente, el rango global tiene historial');
ok(hGlobal.puntos.every((p) => p.cobertura && p.cobertura.texto),
  'Y cada punto lleva la cobertura que había ese día (apartado 1)');
ok(hGlobal.cambios.length > 0 && hGlobal.anterior !== null,
  'Apartado 6 — el global puede enseñar «Intermedio ↑ Anterior: Básico»');
ok(historialDeRango({ ...VACIO, sesiones: GLOBAL.sesiones.slice(0, 1) }, dest('overall')).puntos.length === 0,
  '🚨 Con un solo ejercicio NO hay rango global, así que tampoco historial (F15, apartado 20)');

/* Prueba 17 — variantes: dos dominadas distintas son dos ejercicios. */
const VARIANTES = con(VACIO,
  sesion('dominada-prona', reps(15), addDays(HOY, -40)),
  sesion('dominada-supina', reps(4), addDays(HOY, -35)));
const hProna = historialDeRango(VARIANTES, dest('exercise', 'dominada-prona'));
const hSupina = historialDeRango(VARIANTES, dest('exercise', 'dominada-supina'));
ok(hProna.puntos.length === 1 && hSupina.puntos.length === 1,
  'Prueba 17 — cada variante tiene su propio historial');
ok(hProna.actual.rango !== hSupina.actual.rango,
  'Y con marcas distintas, rangos distintos: no se mezclan');
ok(momentosDe(VARIANTES, dest('exercise', 'dominada-prona')).length === 1,
  '🚨 La sesión de dominada supina NO es un punto del historial de la prona (apartado 33)');

console.log('\n\x1b[1m8 · SOLO SE CONSULTAN LOS DÍAS EN QUE PUDO PASAR ALGO (apartado 33)\x1b[0m');

const MEZCLA = con(VACIO,
  sesion(EJ, reps(10), addDays(HOY, -50)),
  sesion(TERCERO, [{ peso: 80, reps: 8 }], addDays(HOY, -45)),
  sesion(TERCERO, [{ peso: 90, reps: 8 }], addDays(HOY, -40)));
ok(momentosDe(MEZCLA, dest('exercise', EJ)).length === 1,
  '🚨 Dos sesiones de sentadilla no son puntos del historial de las dominadas');
ok(momentosDe(MEZCLA, dest('muscleGroup', 'piernas')).length === 2,
  'Pero sí lo son del historial de piernas');
ok(momentosDe(MEZCLA, dest('overall')).length === 3,
  'Y el global mira todos los días con datos');
ok(momentosDe(MEZCLA, dest('overall')).every((m, i, l) => i === 0 || l[i - 1].fecha < m.fecha),
  'Los días salen ordenados de más antiguo a más nuevo');
const dosMismoDia = con(VACIO, sesion(EJ, reps(8), addDays(HOY, -20)), sesion(EJ, reps(12), addDays(HOY, -20)));
ok(momentosDe(dosMismoDia, dest('exercise', EJ)).length === 1,
  '🚨 Dos sesiones del MISMO día son UN punto: el timeline se lee por fechas (apartado 10)');
ok(momentosDe(dosMismoDia, dest('exercise', EJ))[0].sesiones.length === 2,
  '…y ese punto sabe de qué dos sesiones salió');
ok(idsDeSesion(SUBIDA.sesiones[0]).includes(EJ) && idsDeSesion(null).length === 0,
  '`idsDeSesion` lee el snapshot de la F7, y con `null` no revienta');
ok(momentosDe(VACIO, dest('overall')).length === 0, 'Sin datos, ningún día');

console.log('\n\x1b[1m9 · LOS PERIODOS (prueba 19 · apartado 23)\x1b[0m');

ok(PERIODOS_HISTORIAL.map((p) => p.nombre).join() === 'Todo,3 meses,6 meses,1 año',
  'Los cuatro periodos del apartado 23, literales');
ok(PERIODOS_HISTORIAL[0].dias === null && PERIODOS_HISTORIAL.slice(1).every((p) => p.dias > 0),
  '«Todo» no tiene límite; los otros tres sí');
ok(periodoHistorial('inventado').id === PERIODO_POR_DEFECTO, 'Un periodo desconocido cae en «Todo»');
const vistoTodo = enPeriodo(hSub, 'todo', HOY);
const visto3m = enPeriodo(hSub, '3m', HOY);
ok(vistoTodo.puntos.length === hSub.puntos.length, 'Con «Todo» se ven todos los puntos');
ok(visto3m.puntos.length < vistoTodo.puntos.length && visto3m.puntos.every((p) => p.fecha >= addDays(HOY, -90)),
  'Prueba 19 — con «3 meses» solo salen los de los últimos 90 días');
ok(visto3m.actual !== null && visto3m.actual.rango === hSub.actual.rango,
  '🚨 …pero el rango ACTUAL no se recorta: un periodo no puede quitarle el rango que tiene');
ok(enPeriodo(hScore, '3m', HOY).aviso === SIN_CAMBIOS_EN_PERIODO,
  'Sin cambios en el periodo se dice «No hay cambios en este periodo.» (apartado 23, literal)');
ok(enPeriodo(hSub, '1a', HOY).aviso === null, 'Y con cambios, no se avisa de nada');
ok(enPeriodo(null, 'todo', HOY).puntos.length === 0, 'Con `null` delante tampoco revienta');

/* 🚨 La diferencia con `fitnessEnPeriodo` de la F13, y es la decisión de la
   fase. La puntuación es **la mejor de las últimas cinco sesiones** (F15), así
   que si la mejor cae FUERA del periodo, recortar las sesiones antes de medir
   devuelve un rango que Josué no tiene.
   ⚠️ El escenario está hecho a propósito para que se note: la sesión buena es
   la más VIEJA. Con una lista donde la primera fuera la peor, recortarla no
   cambiaría nada y esta comprobación pasaría sin medir nada — que es lo que le
   pasó a la primera versión de esta prueba. */
const BUENA_VIEJA = con(VACIO,
  sesion(EJ, reps(22), addDays(HOY, -100)),
  sesion(EJ, reps(5), addDays(HOY, -70)),
  sesion(EJ, reps(6), addDays(HOY, -40)),
  sesion(EJ, reps(7), addDays(HOY, -10)));
const hBuena = historialDeRango(BUENA_VIEJA, dest('exercise', EJ));
const recortadoMal = historialDeRango(
  { ...BUENA_VIEJA, sesiones: BUENA_VIEJA.sesiones.filter((s) => s.fecha >= addDays(HOY, -90)) },
  dest('exercise', EJ));
ok(recortadoMal.actual.rango < hBuena.actual.rango,
  '🚨 Recortando las SESIONES a 3 meses saldría un rango MENOR: el de septiembre depende de julio');
ok(enPeriodo(hBuena, '3m', HOY).actual.rango === hBuena.actual.rango,
  '🚨 …y por eso el periodo NO toca el cálculo: filtrando la vista, el rango de hoy sigue siendo el suyo');
ok(enPeriodo(hBuena, '3m', HOY).aviso === SIN_CAMBIOS_EN_PERIODO,
  'Lo que sí dice es la verdad: en estos tres meses no ha cambiado de rango');

console.log('\n\x1b[1m10 · EL TIMELINE (apartado 10)\x1b[0m');

const tl = timelineDeHistorial(hSub);
ok(tl.length === hSub.puntos.length, 'Una línea por punto');
ok(tl[0].fecha > tl[tl.length - 1].fecha, 'Lo más reciente arriba, como el ejemplo del apartado 10');
ok(tl.every((x) => x.fecha && x.nombre && x.marca && x.marca.nombre),
  'Cada línea lleva fecha, rango y el sentido con su palabra');
ok(tl.filter((x) => x.cambio).every((x) => /^[↑↓] desde /.test(x.detalle)),
  'Las líneas con cambio dicen «↑ desde Intermedio» (apartado 10)');
ok(tl[tl.length - 1].detalle === 'Primer dato registrado' || /Clasificación/.test(tl[tl.length - 1].detalle),
  'Y la primera de todas dice de dónde salió, sin un «desde» inventado');
ok(timelineDeHistorial(hScore).some((x) => x.detalle === 'Progreso dentro del rango'),
  'Un punto sin cambio de rango se rotula «Progreso dentro del rango», no como una subida');
ok(new Set(tl.map((x) => x.id)).size === tl.length, 'Cada línea tiene un id distinto (React)');
ok(timelineDeHistorial(null).length === 0, 'Con `null`, ninguna línea');

console.log('\n\x1b[1m11 · EL GRÁFICO, SIN INTERPOLAR (prueba 20 · apartados 24 y 25)\x1b[0m');

ok(graficaDeHistorial(hUna).hay === false && graficaDeHistorial(hUna).motivo === 'pocos_puntos',
  'Apartado 25 — con 0-1 puntos NO se enseña gráfico');
ok(graficaDeHistorial(hDos).hay === false && graficaDeHistorial(hDos).motivo === 'timeline_basta',
  'Con pocos puntos basta el timeline, y se dice por qué');
const gr = graficaDeHistorial(hSub);
ok(gr.hay === true && gr.puntos.length >= PUNTOS_MINIMOS_GRAFICA,
  `Con ${PUNTOS_MINIMOS_GRAFICA} puntos o más, gráfico`);
ok(gr.interpolado === false, 'Prueba 20 — el gráfico declara que no interpola');
ok(gr.puntos.every((p) => hSub.puntos.some((q) => q.fecha === p.fecha && q.score === p.score)),
  '🚨 …y lo demuestra: TODOS sus puntos existen en el historial, ni uno fabricado');
ok(gr.puntos.length === hSub.puntos.filter((p) => Number.isFinite(p.score)).length,
  'No hay ni un punto de más entre dos fechas (apartado 24, literal)');

/* 🚨 La X sale de la FECHA, no del índice: dos puntos separados por dos meses
   no pueden dibujarse a la misma distancia que dos de días seguidos. */
const IRREGULAR = con(VACIO,
  sesion(EJ, reps(4), '2026-07-12'), sesion(EJ, reps(8), '2026-07-13'),
  sesion(EJ, reps(14), '2026-07-14'), sesion(EJ, reps(22), '2026-08-30'));
const grIrr = graficaDeHistorial(historialDeRango(IRREGULAR, dest('exercise', EJ)));
ok(grIrr.hay === true && grIrr.puntos[1].x < 0.1 && grIrr.puntos[3].x === 1,
  '🚨 La X se calcula con la FECHA: tres días seguidos quedan juntos y el salto de siete semanas se ve');
ok(grIrr.puntos.every((p, i, l) => i === 0 || p.x >= l[i - 1].x), 'Y las X van en orden');
ok(gr.puntos.every((p) => p.y >= 0 && p.y <= 1 && p.x >= 0 && p.x <= 1),
  'Las coordenadas quedan entre 0 y 1');
ok(graficaDeHistorial(hVacio).hay === false && graficaDeHistorial(null).hay === false,
  'Sin historial no hay gráfico, ni con `null`');

console.log('\n\x1b[1m12 · EL DETALLE DE UN CAMBIO (apartados 14, 15 y 16)\x1b[0m');

const cambioGrupo = hEsp.cambios[hEsp.cambios.length - 1];
const det = detalleDeCambio(SUBIDA, dest('muscleGroup', 'espalda'), cambioGrupo);
ok(det.fecha && det.desde.nombre && det.hasta.nombre && det.confianza !== undefined && det.fuenteNombre,
  'Apartado 14 — fecha, rango anterior y nuevo, scores, confianza y fuente');
ok(det.titulo === `Subiste de ${cambioGrupo.desdeNombre} a ${cambioGrupo.hastaNombre}.`,
  'Apartado 15, literal: «Subiste de Intermedio a Avanzado.»');
ok(det.marca.marca === '↑' && det.marca.nombre === 'Subida de rango',
  'Con su flecha y su palabra (apartado 31)');
const resp = ejerciciosResponsables(SUBIDA, dest('muscleGroup', 'espalda'), cambioGrupo);
ok(Array.isArray(resp) && resp.some((r) => r.exerciseId === EJ),
  'Apartado 16 — cuando se puede medir, se dicen los ejercicios responsables');
ok(resp.every((r) => r.sentido === 'subida' && r.nombre), 'Con su nombre y su sentido');
ok(det.porque === 'Basado principalmente en tus ejercicios con datos recientes.',
  'Y entonces se enseña la frase del apartado 15');
ok(ejerciciosResponsables(SUBIDA, dest('exercise', EJ), hSub.cambios[0]) === null,
  '🚨 Para un EJERCICIO no hay responsables que repartir: devuelve null, no una lista con él mismo');
ok(ejerciciosResponsables(SUBIDA, dest('muscleGroup', 'espalda'), null) === null,
  'Sin cambio, sin responsables');
ok(detalleDeCambio(SUBIDA, dest('muscleGroup', 'espalda'), { ...cambioGrupo, sesiones: [] }).porque === CAMBIO_SIN_DETALLE,
  '🚨 Y si NO se puede determinar, se dice la frase del apartado 16 en vez de inventarlo');
ok(CAMBIO_SIN_DETALLE === 'El cambio se basa en la evolución de tus ejercicios registrados.',
  'Esa frase es la del apartado 16, literal');
ok(detalleDeCambio(SUBIDA, dest('exercise', EJ), null) === null, 'Sin cambio no hay detalle');

console.log('\n\x1b[1m13 · LA PANTALLA (apartados 29 y 30)\x1b[0m');

const pant = pantallaDeHistorial(SUBIDA, dest('exercise', EJ), { hoy: HOY });
ok(pant.destino.nombre && pant.resumen && pant.timeline && pant.grafica && pant.periodos,
  'Una sola llamada da resumen, timeline, gráfico y periodos');
ok(pant.destino.nombre !== EJ, 'El destino se rotula con su nombre, no con su id');
ok(nombreDeDestino({ tipo: 'overall' }) === 'Rango global'
  && nombreDeDestino({ tipo: 'muscleGroup', id: 'espalda' }) === 'Espalda',
  'Y el nombre sale del catálogo de cada tipo');
ok(nombreDeDestino({ tipo: 'exercise', id: 'no-existe' }) === 'Ejercicio',
  'Un id que no está en el catálogo no deja el rótulo vacío');
ok(pantallaDeHistorial(VACIO, dest('exercise', EJ), { hoy: HOY }).vacio !== null,
  'Sin datos, la pantalla trae su estado vacío');
ok(pantallaDeHistorial(SUBIDA, dest('exercise', EJ), { periodo: '3m', hoy: HOY }).periodo === '3m',
  'El periodo elegido llega a la pantalla');

console.log('\n\x1b[1m14 · NO SE SUSTITUYE AL MOTOR (apartados 20 y 22)\x1b[0m');

const directo = rangoEfectivoDeEjercicio(SUBIDA, EJ, {});
ok(directo.rango === hSub.actual.rango && directo.score === hSub.actual.score,
  '🚨 Apartado 22 — el rango actual lo sigue dando el motor: el historial NO lo sustituye');
ok(rangoDeDestino(SUBIDA, dest('exercise', EJ)).rango === directo.rango,
  '`rangoDeDestino` es un reparto, no un segundo cálculo');
ok(rangoDeDestino(SUBIDA, dest('loQueSea')) === null, 'Un tipo desconocido devuelve null');

const fuente = leer('src/lib/historialRangos.js');
const codigo = soloCodigo(fuente);
ok(/from '\.\/motorRangos\.js'/.test(fuente) && !/RANK_THRESHOLDS\s*=/.test(codigo),
  '🚨 Apartado 20 — usa el RankEngine existente; no hay un segundo sistema de rangos aquí');
ok(!/function\s+(puntuacionDeEjercicio|rangoDePuntuacion|rangoDeGrupo)\b/.test(codigo),
  'Ni una fórmula de rango reescrita: todas se importan');
ok(!/saveData|supabase|localStorage/.test(codigo),
  '🚨 Y no guarda nada en ninguna parte: el historial es una lectura (apartado 3)');
ok(!/\bconfeti|confetti|vibrate|new Audio\(/.test(codigo),
  'Apartados 13 y 36 — ni confeti, ni vibración, ni sonido');
ok(!/\bXP\b|leaderboard|ranking global|recompensa/i.test(codigo),
  'Apartado 36 — ni XP, ni leaderboard, ni recompensas (D2-02)');

console.log('\n\x1b[1m15 · LO QUE NO ENTRA, Y LA AUDITORÍA (apartados 3 y 37)\x1b[0m');

ok(NO_EN_FIT22.length >= 5 && NO_EN_FIT22.every((x) => x.que && x.porque.length > 40),
  'Lo que no se construye está declarado con su motivo');
ok(DECISIONES_FIT22.length >= 6 && DECISIONES_FIT22.every((x) => x.que && x.porque.length > 60),
  'Y las decisiones de la fase, con el apartado que las manda');
ok(NO_EN_FIT22.some((x) => /app_data|rank_history/i.test(x.que + x.porque)),
  '🚨 Entre ellas, por qué el historial NO se guarda');

const aud = auditarHistorialRangos(GLOBAL);
ok(aud.casillas.length === 8 && aud.ok === true,
  'Las ocho casillas del criterio de finalización, en verde sobre datos de verdad');
ok(aud.casillas.every((c) => typeof c.ok === 'boolean' && c.texto),
  'Cada una con su texto y su resultado calculado');
ok(aud.puntos > 0 && aud.cambios > 0, 'Y sobre un escenario que sí tiene historial');

/* 🚨 Una auditoría que no puede ponerse roja no sirve, y una que lo PARECE es
   peor (EH F42). Estas condiciones son propiedades del propio código, así que
   con datos buenos son siempre ciertas: la única forma de demostrar que la
   auditoría funciona es darle un historial inventado que las incumpla. */
const inventado = {
  tipo: 'overall', id: '', suficiente: true, estimacionAnteriorPerdida: false,
  actual: { rango: 5, nombre: 'Intermedio', score: 480, provisional: false },
  anterior: { rango: 5, nombre: 'Intermedio' },
  puntos: [{ fecha: '2026-8-9', rango: 5, nombre: 'Intermedio', score: 480, fuente: null, triggers: [] }],
  cambios: [{ fecha: '2026-8-9', desde: 5, hasta: 5, fuente: 'inventada', desdeNombre: 'X', hastaNombre: 'X' }],
  ultimoCambio: { fecha: '2026-8-9', desde: 5, hasta: 5 },
};
const rota = casillasDeHistorial(inventado);
ok(rota.ok === false, '🚨 Y se pone ROJA con un historial que incumple sus propias reglas (EH F42)');
ok(rota.casillas.find((c) => c.id === 1).ok === false, '…la 1, porque un punto se quedó sin fuente');
ok(rota.casillas.find((c) => c.id === 3).ok === false, '…la 3, porque `2026-8-9` no es una fecha completa');
ok(rota.casillas.find((c) => c.id === 4).ok === false, '…la 4, porque «inventada» no es una fuente del catálogo');
ok(rota.casillas.find((c) => c.id === 6).ok === false, '…la 6, porque ese punto no cae en ningún día con datos');
ok(rota.casillas.find((c) => c.id === 7).ok === false, '…y la 7, porque ese «cambio» va de Intermedio a Intermedio');

console.log('\n\x1b[1m16 · LAS REGLAS DEL PROYECTO\x1b[0m');

ok(!/#[0-9a-fA-F]{6}/.test(soloCodigo(fuente)),
  'Regla 2 — ni un hex suelto: los colores son tokens');
ok(!/new Date\(\)\.toISOString\(\)\.slice/.test(codigo),
  'Ni el fallo del UTC: las fechas locales van con `fechaLocalISO` (sexta vez de esa lección)');
ok(/fechaLocalISO/.test(fuente), 'Que es justo lo que se usa para el día de una clasificación');
ok(historialDeRango(SUBIDA, dest('exercise', EJ)) === historialDeRango(SUBIDA, dest('exercise', EJ)),
  'El resultado se cachea por lista de sesiones: la pantalla lo pide varias veces por render');
ok(historialDeRango(conNueva, dest('exercise', EJ)) !== hSub,
  '🚨 …y guardar una sesión crea una lista nueva, así que el caché se cae solo (apartado 33)');

/* Una librería nueva de Fitness tiene que estar registrada donde se la mire. */
const libs = readdirSync(join(RAIZ, 'src/lib')).filter((f) => f.endsWith('.js'));
ok(libs.includes('historialRangos.js'), 'La librería existe en `src/lib/`');
ok(leer('scripts/verificar.sh').includes('test-historial-rangos.mjs'),
  '🚨 Y su suite está registrada en `verificar.sh`: una prueba que no se ejecuta no es una prueba');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones\x1b[0m`);
if (fallos) { console.log(`\x1b[31m${fallos} FALLO(S)\x1b[0m\n`); process.exit(1); }
console.log('\x1b[32m═══ FIT F22 CORRECTA ═══\x1b[0m\n');
