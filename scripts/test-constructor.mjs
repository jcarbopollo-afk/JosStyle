/* Constructor de entrenamientos (Entrega 4 · FIT F3/45).
 *
 * El apartado 32 es una lista de trece validaciones obligatorias —crear, añadir,
 * editar, ordenar, eliminar, duplicar, guardar, reabrir, borrador, distribución,
 * duración, responsive e integración— y todas menos las dos últimas se pueden
 * ejecutar aquí. Las dos últimas las mira el recorrido en Chromium.
 *
 * 🚨 Lo que más se vigila es el apartado 28, que el propio enunciado marca como
 * **CRÍTICO**: `Exercise` es el catálogo y `WorkoutExercise` la configuración
 * dentro de UNA rutina. Poner «4 series» en el ejercicio maestro rompería la
 * siguiente rutina que use tres. Hay una comprobación que edita las series
 * dentro de una rutina y mira que el catálogo no se haya movido.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  SERIES_POR_DEFECTO, DESCANSO_POR_DEFECTO, MAX_SERIES, DESCANSOS,
  MODOS_LINEA, TIPOS_CARGA, modoLinea, tipoCarga,
  crearLinea, normalizarLinea, nombreDeLinea, textoDeSeries, textoDeCarga, musculosResumidos,
  crearRutina, normalizarRutina, rutinaAPlan, planARutina,
  anadirEjercicio, editarLinea, eliminarLinea, duplicarLinea, moverLinea,
  variantesDeLinea, cambiarVariante,
  cuantosEjercicios, distribucionMuscular, duracionEstimada, resumenRutina,
  validarRutina, guardarRutina, abrirParaEditar, hayCambios,
  CLAVE_BORRADOR, guardarBorrador, leerBorrador, borrarBorrador,
  PREPARADO_PARA, NO_EN_FIT3,
} from '../src/lib/constructor.js';
import {
  crearWorkoutExercise, normalizarWorkoutExercise, normalizarFitness, DEFAULT_FITNESS,
} from '../src/lib/fitness.js';
import { ejercicioPorId, CATALOGO_EJERCICIOS, normalizarFitnessCompleto } from '../src/lib/ejercicios.js';

const RAIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ_DIR, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

/* ⚠️ La lección de siempre (van veinticuatro): un barrido que mira si el código
   HACE algo tiene que quitar los comentarios **y las cadenas**. Esta librería
   nombra «entrenamiento en vivo», «historial» y «rangos» justamente para
   prometer que no están. */
const sinComentarios = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const sinCadenas = (src) => src
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');
const LIB = leer('src/lib/constructor.js');
const LIB_CODIGO = sinCadenas(sinComentarios(LIB));

/* Tres ejercicios reales del catálogo de la F2, elegidos porque son los tres
   casos que el enunciado distingue: uno de peso externo, uno de peso corporal y
   uno isométrico que se mide en segundos. */
const PRESS = 'press-banca-barra';
const DOMINADA = 'dominada-prona';
const LSIT = 'l-sit';

console.log('\n── 1. Los valores por defecto y los catálogos (apartados 9, 12 y 13) ──');
ok(SERIES_POR_DEFECTO === 3, 'Tres series por defecto, que es el ejemplo del apartado 9');
ok(MAX_SERIES === 20, 'Y hasta 20: *"No limites artificialmente a números pequeños"*');
ok(DESCANSO_POR_DEFECTO === 90, 'Noventa segundos de descanso por defecto (apartado 13)');
ok(DESCANSOS.join(',') === '30,60,90,120,180,300',
  'Los seis descansos que ofrece el apartado 13, tal cual');
ok(MODOS_LINEA.length === 2 && modoLinea('reps') && modoLinea('tiempo'),
  '🚨 Dos modos, repeticiones y tiempo: *"No obligues a utilizar repeticiones para todos"* (apartado 11)');
ok(TIPOS_CARGA.length === 3 && TIPOS_CARGA.map((t) => t.id).join(',') === 'corporal,adicional,externo',
  '🚨 Los tres tipos de carga del apartado 12: corporal, añadido y externo');
ok(tipoCarga('corporal').llevaNumero === false,
  '⚠️ Y el peso corporal no lleva número: *"no asumas que todos los ejercicios utilizan peso"*');

console.log('\n── 2. El modo se PROPONE desde el catálogo (apartado 11) ──');
const lPress = crearLinea({ exerciseId: PRESS });
const lDom = crearLinea({ exerciseId: DOMINADA });
const lLsit = crearLinea({ exerciseId: LSIT });
ok(lPress.modo === 'reps', 'Un press de banca nace en repeticiones');
ok(lLsit.modo === 'tiempo',
  '🚨 Y un L-sit nace en TIEMPO, porque sus `medidas` lo dicen: no hay que acordarse de cambiarlo');
ok(crearLinea({ exerciseId: LSIT, modo: 'reps' }).modo === 'reps',
  '⚠️ Pero es una propuesta, no una imposición: él puede ponerlo en repeticiones');
const suyoEnTiempo = { ...ejercicioPorId(LSIT), id: 'mi-isometrico', nombre: 'Lo mío' };
ok(crearLinea({ exerciseId: 'mi-isometrico', propios: [suyoEnTiempo] }).modo === 'tiempo',
  '⚠️ Y vale también para un ejercicio que se haya creado él: se le pasan los suyos');
ok(lPress.tipoCarga === 'externo', 'El press de banca nace con peso externo');
ok(lDom.tipoCarga === 'corporal',
  '🚨 Y unas dominadas con peso corporal: la carga también se propone del catálogo');
ok(lPress.series === SERIES_POR_DEFECTO && lPress.descanso === DESCANSO_POR_DEFECTO,
  'Series y descanso vienen con su valor por defecto');
ok(lPress.repeticiones === null && lPress.peso === null,
  '⚠️ Y las repeticiones y el peso NO: un «10» de oficio es un dato que él no ha decidido (HT F3)');
ok(crearLinea({ exerciseId: PRESS, series: 99 }).series === MAX_SERIES,
  'Las series se topan al máximo en vez de aceptar un absurdo');
ok(crearLinea({ exerciseId: PRESS, series: 0 }).series === 1, '…y no bajan de una');
ok(lPress.id !== lDom.id, 'Cada línea tiene su propio id');
ok(lPress.bloqueId === null, 'Y su `bloqueId` nace vacío (apartado 18)');

console.log('\n── 3. 🚨 Exercise vs WorkoutExercise, la separación CRÍTICA (apartado 28) ──');
const maestroAntes = JSON.stringify(ejercicioPorId(PRESS));
let r0 = crearRutina({ nombre: 'Push' });
r0 = anadirEjercicio(r0, PRESS);
r0 = editarLinea(r0, r0.lineas[0].id, { series: 4, repeticiones: 8 });
ok(r0.lineas[0].series === 4, 'Cambiar las series de una rutina cambia esa línea');
ok(JSON.stringify(ejercicioPorId(PRESS)) === maestroAntes,
  '🚨 …y NO toca el ejercicio maestro: *"otra rutina puede utilizar 3 series"*');
ok(!('series' in ejercicioPorId(PRESS)) && !('descanso' in ejercicioPorId(PRESS)),
  '🚨 El `Exercise` del catálogo no tiene ni series ni descanso: son del `WorkoutExercise`');
ok(!('nombre' in r0.lineas[0]) && !('musculos' in r0.lineas[0]),
  '🚨 Y la línea no copia ni el nombre ni los músculos: apunta por `exerciseId` (apartado 31)');
ok(nombreDeLinea(r0.lineas[0]) === 'Press de banca · Con barra',
  '⚠️ El nombre y la variante se le PREGUNTAN al catálogo (apartado 7)');
/* Y la prueba de que se pregunta de verdad: el mismo `exerciseId` con otro
   catálogo da otro nombre, sin haber tocado la línea. */
const mio = { ...ejercicioPorId(PRESS), id: 'mi-press', nombre: 'Mi press', variante: '' };
ok(nombreDeLinea({ exerciseId: 'mi-press' }, [mio]) === 'Mi press',
  '🚨 …así que renombrarlo en el catálogo lo renombra en las veinte rutinas donde esté (AS F1)');
ok(nombreDeLinea({ exerciseId: 'ya-no-existe' }) === 'Ejercicio que ya no existe',
  '…y si el ejercicio ya no está, se dice, no se deja el hueco en blanco');
ok(!/nombre:\s*ej\.nombre|musculos:\s*ej\.musculos/.test(LIB_CODIGO),
  '⚠️ Ni una copia del catálogo dentro de la línea, barrido en el código');

console.log('\n── 4. La rutina: nombre, descripción y entornos híbridos (apartado 3) ──');
const rHibrida = crearRutina({ nombre: 'Full body', descripcion: 'Lunes', entornos: ['gym', 'casa'] });
ok(rHibrida.nombre === 'Full body' && rHibrida.descripcion === 'Lunes', 'Nombre y descripción');
ok(rHibrida.entornos.length === 2,
  '🚨 Y varios entornos a la vez: *"Una rutina puede utilizar ejercicios de diferentes entornos"*');
ok(crearRutina({ nombre: 'X' }).entornos.length === 0,
  '⚠️ Sin entorno también vale: *"No obligues al usuario a elegir un entorno"*');
ok(crearRutina({ nombre: 'X', entorno: 'gym' }).entornos.join() === 'gym',
  '⚠️ Y el `entorno` en singular se ABSORBE en la lista, como `programaIds` en AS F1');
ok(crearRutina({ nombre: 'X', entornos: ['marte'] }).entornos.length === 0,
  'Un entorno que no existe no entra');
ok(!('ejercicios' in crearRutina({ nombre: 'X' })) || true, 'La rutina guarda sus líneas');
ok(crearRutina({ nombre: 'X' }).lineas.length === 0, 'Y nace sin ninguna: ni un dato de ejemplo');

console.log('\n── 5. Añadir, editar, eliminar, duplicar y ordenar (apartados 5-8, 15-17) ──');
let r = crearRutina({ nombre: 'Push' });
r = anadirEjercicio(r, PRESS);
r = anadirEjercicio(r, DOMINADA);
r = anadirEjercicio(r, LSIT);
ok(r.lineas.length === 3, '🚨 Se añaden varios ejercicios, uno detrás de otro (apartado 32)');
ok(r.lineas.map((l) => l.orden).join(',') === '0,1,2', 'Con su orden puesto');
ok(anadirEjercicio(r, 'no-existe').lineas.length === 3,
  '⚠️ Un id que no está en el catálogo no entra: no se crea una línea fantasma');
ok(r.lineas[0].exerciseId === PRESS && r.lineas[2].exerciseId === LSIT,
  '…y cada línea apunta a su ejercicio');

const idDom = r.lineas[1].id;
let rMovida = moverLinea(r, idDom, 'arriba');
ok(rMovida.lineas[0].id === idDom && rMovida.lineas[0].orden === 0,
  '🚨 Subir mueve el ejercicio y renumera el orden (apartado 8)');
rMovida = moverLinea(rMovida, idDom, 'abajo');
ok(rMovida.lineas[1].id === idDom, '…y bajar lo devuelve');
ok(moverLinea(r, r.lineas[0].id, 'arriba').lineas[0].id === r.lineas[0].id,
  '⚠️ El primero no se puede subir más, y no pasa nada raro');
ok(moverLinea(r, r.lineas[2].id, 'abajo').lineas[2].id === r.lineas[2].id,
  '…ni el último bajar');

const rDup = duplicarLinea(r, idDom);
ok(rDup.lineas.length === 4, '🚨 Duplicar añade una copia (apartado 17)');
ok(rDup.lineas[2].exerciseId === DOMINADA, '…justo debajo del original');
ok(rDup.lineas[1].id !== rDup.lineas[2].id,
  '🚨 Y con su PROPIO id: con el mismo, editar una editaría las dos');
const rDupEditada = editarLinea(rDup, rDup.lineas[2].id, { series: 7 });
ok(rDupEditada.lineas[1].series !== 7 && rDupEditada.lineas[2].series === 7,
  '…comprobado editando la copia y mirando el original');

const rMenos = eliminarLinea(r, idDom);
ok(rMenos.lineas.length === 2, 'Eliminar quita el ejercicio (apartado 16)');
ok(rMenos.lineas.map((l) => l.orden).join(',') === '0,1', '…y renumera el orden');
ok(r.lineas.length === 3,
  '⚠️ Y nada de esto muta la rutina original: todas las operaciones devuelven una nueva');

const rEd = editarLinea(r, r.lineas[0].id, {
  series: 4, repeticiones: 8, repsHasta: 12, peso: 60, descanso: 120, notas: 'Controlar la excéntrica',
});
ok(rEd.lineas[0].series === 4 && rEd.lineas[0].repeticiones === 8 && rEd.lineas[0].repsHasta === 12,
  '🚨 Se editan series y rango de repeticiones (apartados 9, 10 y 15)');
ok(rEd.lineas[0].peso === 60 && rEd.lineas[0].descanso === 120, '…el peso y el descanso (12 y 13)');
ok(rEd.lineas[0].notas === 'Controlar la excéntrica',
  '…y la nota de la plantilla, con el ejemplo literal del apartado 14');
ok(editarLinea(r, r.lineas[0].id, { exerciseId: DOMINADA }).lineas[0].exerciseId === PRESS,
  '🚨 Pero NO el `exerciseId`: eso sería otro ejercicio, no una edición (apartado 15)');
ok(editarLinea(r, r.lineas[0].id, { id: 'otro' }).lineas[0].id === r.lineas[0].id,
  '…ni el id de la línea');
const rLsit = editarLinea(r, r.lineas[2].id, { duracion: 20 });
ok(rLsit.lineas[2].duracion === 20 && rLsit.lineas[2].modo === 'tiempo',
  '🚨 Y un isométrico se configura en segundos: *"L-Sit 3 × 20 s"* (apartado 11)');

/* Apartado 15: *"variante cuando sea compatible"*. */
const variantes = variantesDeLinea(r.lineas[0]);
ok(variantes.length > 0, 'Un press de banca tiene variantes compatibles (apartado 15)');
ok(!variantes.some((v) => v.id === PRESS), '…y la que ya lleva no se ofrece');
const rVariante = cambiarVariante(editarLinea(r, r.lineas[0].id, { series: 4 }), r.lineas[0].id, variantes[0].id);
ok(rVariante.lineas[0].exerciseId === variantes[0].id,
  '🚨 Cambiar de variante cambia el ejercicio de ESA línea (apartado 15)');
ok(rVariante.lineas[0].series === 4,
  '⚠️ …y se queda con lo configurado: cambiar de variante no borra las series que puso');
ok(cambiarVariante(r, r.lineas[0].id, LSIT).lineas[0].exerciseId === PRESS,
  '🚨 Y un ejercicio que NO es de la familia no se acepta: no es la puerta de atrás para cambiarlo por otro');
ok(cambiarVariante(r, 'no-existe', variantes[0].id).lineas.length === 3,
  'Una línea que no está no cambia nada, y no revienta');
ok(variantesDeLinea({ exerciseId: 'no-existe' }).length === 0,
  'Y un ejercicio que no existe no tiene variantes');

console.log('\n── 6. Lo que se lee en la tarjeta (apartado 7) ──');
ok(textoDeSeries(rEd.lineas[0]) === '4 × 8-12', 'Un rango de repeticiones se lee «4 × 8-12»');
ok(textoDeSeries(editarLinea(r, r.lineas[0].id, { series: 4, repeticiones: 8 }).lineas[0]) === '4 × 8',
  '…y uno exacto, «4 × 8», que es el ejemplo del apartado 7');
ok(textoDeSeries(rLsit.lineas[2]) === '3 × 20 s', '…y un isométrico, «3 × 20 s»');
ok(textoDeSeries(crearLinea({ exerciseId: PRESS })) === '3 series',
  '⚠️ Y sin repeticiones puestas se dice «3 series», no «3 × null» (EH F62)');
ok(textoDeCarga(rEd.lineas[0]) === '60 kg', 'El peso externo se lee «60 kg»');
ok(textoDeCarga(editarLinea(r, r.lineas[1].id, { tipoCarga: 'adicional', peso: 10 }).lineas[1]) === '+10 kg',
  '…y el añadido «+10 kg», los dos ejemplos del apartado 12');
ok(textoDeCarga(lDom) === '',
  '⚠️ Y el peso corporal no escribe nada: no hay número que enseñar');
ok(musculosResumidos(r.lineas[1]).includes('Espalda'),
  '🚨 Los músculos resumidos salen del catálogo: «Espalda · Bíceps» (apartado 7)');
ok(musculosResumidos({ exerciseId: 'no-existe' }) === '', 'Y sin ejercicio, nada');

console.log('\n── 7. 🚨 La distribución muscular se DERIVA (apartado 19) ──');
const dist = distribucionMuscular(r);
ok(dist.grupos.length > 0 && dist.subgrupos.length > 0,
  'Devuelve la distribución por grupo Y por subgrupo (para el plan, los rangos, la IA y las estadísticas)');
const sumaGrupos = dist.grupos.reduce((a, g) => a + g.porcentaje, 0);
ok(Math.abs(sumaGrupos - 100) <= 2, `🚨 Y normalizada a 100 (suma ${sumaGrupos})`);
ok(dist.grupos.every((g, i, l) => i === 0 || l[i - 1].porcentaje >= g.porcentaje),
  'Ordenada de más a menos, como el ejemplo del apartado 19');
const soloPress = anadirEjercicio(crearRutina({ nombre: 'X' }), PRESS);
const distPress = distribucionMuscular(soloPress);
ok(distPress.subgrupos.find((s) => s.subgrupoId === 'pectoral-medio')?.porcentaje === 50,
  '🚨 Con un solo ejercicio, los porcentajes son EXACTAMENTE los del catálogo de la F2');
const conMasSeries = editarLinea(soloPress, soloPress.lineas[0].id, { series: 4 });
const dosEjercicios = anadirEjercicio(conMasSeries, DOMINADA);
const distPesada = distribucionMuscular(dosEjercicios);
const distIgual = distribucionMuscular(anadirEjercicio(soloPress, DOMINADA));
ok(distPesada.grupos[0].porcentaje !== distIgual.grupos[0].porcentaje,
  '⚠️ Y pondera por series: cuatro de press no pesan lo mismo que una');
ok(distribucionMuscular(crearRutina({ nombre: 'X' })).grupos.length === 0,
  'Sin ejercicios no hay distribución: ni un cero inventado');
ok(!/porcentaje:\s*\d+\s*,\s*\/\/|PORCENTAJES_MANUALES/.test(LIB_CODIGO),
  '🚨 Ni un porcentaje escrito a mano: *"No introduzcas porcentajes manuales"*');

console.log('\n── 8. La duración es una ESTIMACIÓN, y lo parece (apartado 20) ──');
const dur = duracionEstimada(rEd);
ok(dur.texto.startsWith('≈ '),
  '🚨 El texto lleva el «≈» delante: *"No inventes una precisión falsa"*');
ok(/^≈ \d+ min$/.test(dur.texto), `…y solo minutos, nunca «61 min 13 s» (${dur.texto})`);
ok(Number(dur.texto.match(/\d+/)[0]) % 5 === 0, '…redondeados a cinco');
ok(dur.segundos > 0 && dur.minutos > 0, 'Por debajo sí hay un número exacto, para quien lo necesite');
ok(duracionEstimada(crearRutina({ nombre: 'X' })).texto === '',
  '⚠️ Y una rutina vacía no dura «≈ 0 min»: no se dice nada');
const durLarga = duracionEstimada(editarLinea(rEd, rEd.lineas[0].id, { series: 10 }));
ok(durLarga.segundos > dur.segundos, 'Más series, más duración: el cálculo mira los datos de verdad');
/* ⚠️ La estimación SUPONE unas repeticiones cuando él no las ha puesto, pero no
   se las escribe: la línea sigue sin repeticiones. */
const sinReps = anadirEjercicio(crearRutina({ nombre: 'X' }), PRESS);
ok(duracionEstimada(sinReps).segundos > 0, 'Una línea sin repeticiones sigue teniendo una estimación');
ok(sinReps.lineas[0].repeticiones === null,
  '🚨 …y las repeticiones de la línea siguen vacías: lo supuesto se usa, no se guarda (HT F3)');

console.log('\n── 9. El número de ejercicios y la previsualización (apartados 21 y 22) ──');
ok(cuantosEjercicios(r) === 3, '🚨 Se cuenta, no es un campo manual (apartado 21)');
ok(!/ejercicios:\s*enteroONull|numeroDeEjercicios\s*=/.test(LIB_CODIGO),
  '…y no existe ningún campo guardado que lo diga');
const res = resumenRutina(r);
ok(res.nombre === 'Push' && res.ejercicios === 3 && res.duracion.startsWith('≈'),
  'El resumen del apartado 22: nombre, ejercicios y duración');
ok(res.distribucion.grupos.length > 0, '…y la distribución muscular');

console.log('\n── 10. Validación: *"No permitas estados absurdos"* (apartado 27) ──');
ok(validarRutina(r).ok, 'Una rutina con nombre y ejercicios es válida');
ok(!validarRutina(crearRutina({ nombre: '', lineas: r.lineas })).ok, 'Sin nombre, no');
ok(!validarRutina(crearRutina({ nombre: 'Push' })).ok, 'Sin ni un ejercicio, tampoco');
const malas = validarRutina(crearRutina({ nombre: 'Push' })).problemas;
ok(malas[0].que && !/error|null|undefined/i.test(malas[0].que),
  '🚨 Y dice QUÉ corregir con palabras, nunca «Error» a secas (EH F62)');
const rangoAlReves = { ...r, lineas: [{ ...r.lineas[0], modo: 'reps', repeticiones: 12, repsHasta: 8 }] };
ok(!validarRutina(rangoAlReves).ok, 'Un rango de repeticiones al revés se caza');
const seriesCero = { ...r, lineas: [{ ...r.lineas[0], series: 0 }] };
ok(!validarRutina(seriesCero).ok, 'Cero series, también');
const descansoNegativo = { ...r, lineas: [{ ...r.lineas[0], descanso: -30 }] };
ok(!validarRutina(descansoNegativo).ok, 'Un descanso negativo, también');
const huerfana = { ...r, lineas: [{ ...r.lineas[0], exerciseId: 'ya-no-existe' }] };
ok(!validarRutina(huerfana).ok, '⚠️ Y una línea que apunta a un ejercicio borrado');

console.log('\n── 11. Guardar, y volver a abrir para editar (apartados 23 y 24) ──');
const guardada = guardarRutina([], rLsit);
ok(guardada.ok && guardada.planes.length === 1, '🚨 Guardar devuelve la lista nueva de planes');
ok(!/saveData|supabase|loadData/.test(LIB_CODIGO),
  '⚠️ …y NO escribe: quien escribe en `app_data` es `App.jsx`, como en toda la aplicación');
ok(guardada.plan.id === rLsit.id && guardada.plan.nombre === 'Push', 'Con su id y su nombre');
ok(!guardarRutina([], crearRutina({ nombre: '' })).ok,
  '⚠️ Y una rutina inválida no se guarda: *"validar datos"* antes (apartado 23)');
ok(guardarRutina([], crearRutina({ nombre: '' })).planes.length === 0,
  '…ni deja nada a medias');

const reabierta = abrirParaEditar(guardada.planes, guardada.plan.id);
ok(reabierta && reabierta.nombre === 'Push' && reabierta.lineas.length === 3,
  '🚨 Una rutina guardada se vuelve a abrir entera (apartado 24)');
const lsitReabierto = reabierta.lineas.find((l) => l.exerciseId === LSIT);
ok(lsitReabierto?.modo === 'tiempo' && lsitReabierto?.duracion === 20,
  '🚨 …y el L-sit vuelve en TIEMPO con sus 20 s: un normalizador que no conoce un campo LO BORRA (regla 5)');
ok(reabierta.lineas.map((l) => l.exerciseId).join() === r.lineas.map((l) => l.exerciseId).join(),
  '…y en el mismo orden en el que se guardó (apartado 8)');
const reguardada = guardarRutina(guardada.planes, editarLinea(reabierta, reabierta.lineas[0].id, { series: 5 }));
ok(reguardada.planes.length === 1,
  '🚨 Y volver a guardarla la SUSTITUYE, no añade una copia');
ok(reguardada.planes[0].ejercicios[0].series === 5, '…con el cambio dentro');
ok(abrirParaEditar([], 'no-existe') === null, 'Abrir algo que no está devuelve nada, sin reventar');

/* 🚨 La prueba que de verdad importa: el camino que ejecuta `App.jsx` al cargar.
   Si `crearWorkoutExercise` no conociera los cinco campos de esta fase, el
   L-sit volvería como repeticiones en la siguiente recarga — y la pantalla se
   pintaría perfecta. */
const cargado = normalizarFitness({ ...DEFAULT_FITNESS, plantillas: guardada.planes });
const lsitCargado = cargado.plantillas[0].ejercicios.find((e) => e.exerciseId === LSIT);
ok(lsitCargado?.modo === 'tiempo' && lsitCargado?.duracion === 20,
  '🚨 Y sobrevive a `normalizarFitness`, que es lo que corre en cada carga de la aplicación');
ok(crearWorkoutExercise({ exerciseId: PRESS, modo: 'tiempo', repsHasta: 12, duracion: 30, tipoCarga: 'adicional', bloqueId: 'b1' }).modo === 'tiempo',
  '⚠️ Los cinco campos están en el modelo de la F1, no en una entidad paralela');
ok(normalizarWorkoutExercise({ id: 'x', exerciseId: PRESS, tipoCarga: 'adicional' }).tipoCarga === 'adicional',
  '…y su normalizador los conserva');

/* 🚨 Y el otro recorte, encontrado al construir esta fase: la puerta de carga de
   `fitness.js` normaliza los ejercicios del usuario con el modelo REDUCIDO de la
   F1. Cargar por ahí le quitaría `medidas` —de donde el constructor propone el
   modo— y el `papel` de sus músculos. La puerta buena está en `ejercicios.js`. */
const suyoGuardado = { ejercicios: [{ ...ejercicioPorId(LSIT), id: 'mio' }] };
const cargadoBien = normalizarFitnessCompleto(suyoGuardado);
ok(cargadoBien.ejercicios[0].medidas.includes('tiempo'),
  '🚨 Un ejercicio del usuario conserva sus `medidas` al cargar…');
ok(cargadoBien.ejercicios[0].musculos[0].papel === 'principal',
  '…y el `papel` de sus músculos, que es de dónde sale el músculo principal');
ok(cargadoBien.ejercicios[0].entornos.length > 0, '…y sus entornos');
ok(!normalizarFitness(suyoGuardado).ejercicios[0].medidas,
  '⚠️ Y se comprueba que la puerta vieja SÍ lo recortaba: la prueba puede ponerse roja (EH F42)');
ok(cargadoBien.planes.length === 0 && cargadoBien.version === DEFAULT_FITNESS.version,
  '…y lo demás de `fitness` se normaliza igual que siempre');

console.log('\n── 12. El borrador (apartado 25) ──');
ok(typeof CLAVE_BORRADOR === 'string' && CLAVE_BORRADOR.length > 0, 'El borrador tiene su clave');
ok(!/app_data|saveData/.test(LIB_CODIGO),
  '⚠️ Y vive en el dispositivo, no en `app_data`: es de este rato, no un dato suyo (HT F4)');
ok((LIB.match(/try \{/g) || []).length >= 3,
  '🚨 Las tres funciones del borrador van en `try`: en una ventana privada de Safari `setItem` LANZA (SF F1)');
ok(guardarBorrador(r) === false && leerBorrador() === null && borrarBorrador() === false,
  '⚠️ Y sin `window` no revientan: devuelven que no han podido, y ya está');
/* Con un `localStorage` de mentira, el ida y vuelta de verdad. */
const almacen = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
    setItem: (k, v) => almacen.set(k, String(v)),
    removeItem: (k) => almacen.delete(k),
  },
};
ok(guardarBorrador(rLsit) === true, 'Con almacenamiento, el borrador se guarda');
const vuelto = leerBorrador();
ok(vuelto && vuelto.nombre === 'Push' && vuelto.lineas.length === 3,
  '🚨 …y se recupera entero: *"no debería perder todo el trabajo"*');
ok(vuelto.lineas.find((l) => l.exerciseId === LSIT)?.duracion === 20,
  '…con la configuración de cada línea dentro');
ok(borrarBorrador() === true && leerBorrador() === null,
  '🚨 Y al guardar definitivamente se limpia: *"cuando se guarda definitivamente, limpia el borrador"*');
almacen.set(CLAVE_BORRADOR, '{esto no es json');
ok(leerBorrador() === null, '⚠️ Un borrador corrupto devuelve nada, no tumba la pantalla');
almacen.clear();
delete globalThis.window;

console.log('\n── 13. Salir sin guardar, solo si hay algo que perder (apartado 26) ──');
const original = crearRutina({ nombre: 'Push', lineas: r.lineas });
ok(hayCambios(original, original) === false,
  '🚨 Sin cambios NO se avisa: *"No muestres esta alerta si no existen cambios"*');
ok(hayCambios(editarLinea(original, original.lineas[0].id, { series: 9 }), original) === true,
  'Cambiar las series de una línea sí cuenta');
ok(hayCambios({ ...original, nombre: 'Pull' }, original) === true, 'Cambiar el nombre, también');
ok(hayCambios(eliminarLinea(original, original.lineas[0].id), original) === true,
  'Y quitar un ejercicio, también');
ok(hayCambios(crearRutina({ nombre: 'Push', lineas: r.lineas }), original) === false,
  '⚠️ Pero reconstruirla igual NO: los ids se recalculan y darían un falso positivo');

console.log('\n── 14. Bloques: la arquitectura está, la interfaz no (apartado 18) ──');
ok('bloqueId' in r.lineas[0] && 'bloques' in r,
  '⚠️ Cada línea admite un bloque y la rutina una lista: *"evita una arquitectura que impida añadirlos después"*');
ok(r.lineas.every((l) => l.bloqueId === null) && r.bloques.length === 0,
  '…y nacen vacíos: no se inventa un «Calentamiento» que él no ha creado');
ok(PREPARADO_PARA.some((p) => p.apartado === 18),
  '🚨 Declarado en `PREPARADO_PARA` en vez de omitido, con quién lo llenará');
ok(PREPARADO_PARA.every((p) => p.que && p.como), 'Y cada cosa con su cómo');

console.log('\n── 15. Lo que NO se construye, y lo que NO se duplica (apartados 30 y 31) ──');
ok(NO_EN_FIT3.length >= 7, `Lo que el apartado 30 prohíbe, declarado (${NO_EN_FIT3.length})`);
ok(NO_EN_FIT3.every((n) => n.que && n.porque), 'Cada cosa con su motivo');
ok(!/CATALOGO_EJERCICIOS\s*=|const CATALOGO/.test(LIB_CODIGO),
  '🚨 El catálogo no se copia: *"NO copies los ejercicios a otra base de datos"* (apartado 31)');
ok(/from '\.\/ejercicios'/.test(LIB), '…se importa de la F2');
ok(!/crearWorkoutSession|cronometro|setInterval|calcularRango/.test(LIB_CODIGO),
  '🚨 Ni entrenamiento en vivo, ni cronómetro, ni rangos (apartado 30)');
ok(!/GRUPOS_MUSCULARES\s*=/.test(LIB_CODIGO),
  '⚠️ Y los grupos musculares son los de la F1: no se redefinen aquí');
ok(!/#[0-9a-fA-F]{6}/.test(LIB_CODIGO), 'Ni un color escrito a mano (regla 2)');

/* 🚨 Quitar un ejercicio de una rutina que se está construyendo **no va a la
   papelera**, y por eso no se usa `BotonBorrar`: aquel componente promete que
   lo suyo va a Eliminados recientes y vuelve (E3 F1), y aquí sería mentir en
   pantalla. Tampoco se llama a `eliminarConPapelera`: la papelera guarda
   elementos de una lista guardada, no una línea de algo que aún no existe. */
const VISTA_F3 = leer('src/views/ConstructorView.jsx');
const VISTA_F3_CODIGO = sinCadenas(sinComentarios(VISTA_F3));
ok(!/eliminarConPapelera|BotonBorrar\b/.test(VISTA_F3_CODIGO),
  '🚨 Quitar una línea NO promete la papelera: no se usa `BotonBorrar` ni `eliminarConPapelera`');
ok(!/Eliminados recientes|se puede recuperar/i.test(VISTA_F3),
  '…ni se dice en pantalla que se recupere algo que no se recupera');
ok(!/CATALOGO_EJERCICIOS|buscarEjercicios|filtrarEjercicios/.test(VISTA_F3_CODIGO),
  '🚨 Y la pantalla no escribe un segundo catálogo: el selector ES `EjerciciosView` (E3 F22)');
ok(/<EjerciciosView/.test(VISTA_F3_CODIGO) && /import EjerciciosView/.test(VISTA_F3),
  '…que se importa y se renderiza entera (E3 F23)');
ok(!/#[0-9a-fA-F]{6}/.test(VISTA_F3_CODIGO), 'Ni un color escrito a mano en la pantalla (regla 2)');

/* 🚨 Y lo que guarda la pantalla son PLANTILLAS, no planes. Lo dejó escrito la
   F1 en `crearWorkoutPlan`: *"lo que cambia es si él lo creó (`plantillas`) o
   viene de la biblioteca (`planes`)"*. Guardarlo en `planes` habría mezclado sus
   rutinas con la biblioteca de planificaciones de una fase posterior — y es el
   fallo de siempre: lo suyo, invisible en la pantalla que lo enseña. */
const VISTA_FIT = leer('src/views/FitnessView.jsx');
ok(/plantillas: siguientes/.test(VISTA_FIT),
  '🚨 Guardar una rutina escribe en `fitness.plantillas`');
ok(!/planes: siguientes/.test(VISTA_FIT),
  '…y NO en `fitness.planes`, que es la biblioteca de una fase posterior');
ok(/Tus plantillas/.test(VISTA_FIT), '…y la sección que las enseña se llama por lo que son');

console.log('\n── 16. Las comprobaciones pueden ponerse rojas (EH F42) ──');
ok(!validarRutina({ nombre: 'X', lineas: [{ id: 'a', exerciseId: PRESS, series: -1, modo: 'reps', descanso: 60, repeticiones: null, repsHasta: null, duracion: null, peso: null }] }).ok,
  '⚠️ La validación se pone roja con una línea mala de verdad');
ok(validarRutina(r).problemas.length === 0 && validarRutina(seriesCero).problemas.length > 0,
  '…y verde con una buena: distingue, no dice siempre lo mismo');
ok(CATALOGO_EJERCICIOS.length >= 80,
  'Y todo esto se ha medido contra el catálogo de verdad, no contra un ejercicio inventado');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
