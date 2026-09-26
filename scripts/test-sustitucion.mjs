/* Entrega 4 · FIT F33/45 — Sistema avanzado de sustitución de ejercicios.
   ═══════════════════════════════════════════════════════════════════════════
   Los veintiún casos del apartado 39, los cuatro niveles del 2, los criterios
   del 3, la configuración de los 11-13 y, por encima de todo, el criterio de
   finalización: *"EL CAMBIO NO DEBE ROMPER PLANES, PLANTILLAS, HISTORIAL,
   PROGRESO, OBJETIVOS, RANGOS. Cada sistema debe conservar su propia fuente de
   verdad."* — medido sistema por sistema. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NIVELES_COMPATIBILIDAD, NIVELES_VISIBLES, nivelCompatibilidad, CRITERIOS_COMPATIBILIDAD, PESOS_COMPATIBILIDAD,
  MODALIDADES, modalidadesDe, claseDeMedida, patronDe, solapeMuscular, relacionDeVariante,
  contextoDeSustitucion, faltaMaterial, disponibilidad, rasgosEnComun, nivelDeCompatibilidad, nivelEnContexto,
  motivosDe, EXPRESIONES_PROHIBIDAS, configuracionRecomendada, configuracionDeSesion, tipoDeCargaPropuesto,
  indiceDeSustitucion, getExerciseReplacements, sustitucionesDe, sustitucionElegida, necesitaConfirmar,
  filtrarSustituciones, opcionesDeFiltro, materialDeLasPropuestas, pantallaDeSustitucion, TEXTOS_SUSTITUCION,
  AVISO_OBJETIVO, OPCIONES_OBJETIVO, LO_QUE_NO_SE_TRANSFIERE, NO_EN_FIT33, DECISIONES_FIT33,
  auditarSustitucion, claveDeDuplicado, UMBRAL_SOLAPE_GRUPO,
} from '../src/lib/sustitucion.js';
import {
  CATALOGO_EJERCICIOS, PATRONES_MOVIMIENTO, FAMILIAS_PATRON, EQUIPAMIENTO, ejercicioPorId, crearEjercicioCompleto,
} from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion, sustituirEjercicio,
  notaDeEjercicio,
} from '../src/lib/entrenamiento.js';
import { sustitutosCompatibles } from '../src/lib/entrenamientoUx.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS, crearObjetivo, crearClasificacion } from '../src/lib/fitness.js';
import {
  crearRutina, anadirEjercicio, editarLinea, sustituirEnRutina, cambiarVariante, planARutina, guardarRutina,
  rutinaAPlan,
} from '../src/lib/constructor.js';
import { CATALOGO_PLANES, planPorId, personalizarPreset } from '../src/lib/planes.js';
import { historialPorReciente } from '../src/lib/historial.js';
import { aparicionesDeEjercicio, progresoDeEjercicio } from '../src/lib/progresion.js';
import { rangoDeEjercicio } from '../src/lib/rangos.js';
import { colaDeClasificacion } from '../src/lib/colaClasificacion.js';
import { cancelarObjetivo } from '../src/lib/objetivosProgreso.js';
import { objetivoEnVivo } from '../src/lib/objetivosFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* Lo que el código HACE, sin comentarios ni cadenas (la lección de siempre). */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
  .replace(/"(?:\\.|[^"\\\n])*"/g, '""');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const lista = (v) => (Array.isArray(v) ? v : []);
const nivel = (items, id) => (items.find((x) => x.id === id) || {}).compatibilityLevel || null;
const ids = (items) => items.map((x) => x.id);

/* ── Sesiones de verdad: constructor (F3) → en vivo (F7) → guardado (F8) ── */
function lineasDe(exerciseId, cambios = {}) {
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  return editarLinea(r, r.lineas[0].id, { series: 3, ...cambios }).lineas;
}
function empezar(exerciseId, fecha, cambios = {}) {
  return empezarSesion({
    nombre: exerciseId, lineas: lineasDe(exerciseId, cambios), hoy: fecha,
    ahora: new Date(`${fecha}T18:00:00`).getTime(), entorno: cambios.entorno || '',
  });
}
function completar(s, valores, fecha) {
  const e = ejerciciosDeSesion(s)[0];
  let x = s;
  valores.forEach((v, i) => {
    x = editarSerie(x, e.id, e.series[i].id, v);
    x = marcarSerie(x, e.id, e.series[i].id, true);
  });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  return guardarEntrenamiento(pasarAFinalizacion(x, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}

console.log('\n═══ FIT F33/45 · Sistema avanzado de sustitución de ejercicios ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Los niveles y los criterios (apartados 2 y 3) ──');

ok(JSON.stringify(NIVELES_COMPATIBILIDAD.map((n) => n.nombre)) === JSON.stringify(['Muy similar', 'Similar', 'Alternativa', 'Poco recomendable']),
  'Los cuatro niveles del apartado 2, en su orden');
ok(JSON.stringify(NIVELES_VISIBLES) === JSON.stringify(['muy_similar', 'similar', 'alternativa']),
  '🚨 …y solo se enseñan normalmente los tres primeros (apartado 2, literal)');
ok(nivelCompatibilidad('similar').frase === 'Alternativa similar.',
  '…con la frase del apartado 10: «Alternativa similar.»');
ok(CRITERIOS_COMPATIBILIDAD.length === 11 && CRITERIOS_COMPATIBILIDAD.every((c) => c.lee),
  `Los once criterios del apartado 3, cada uno con de dónde se lee (${CRITERIOS_COMPATIBILIDAD.length})`);
ok(CRITERIOS_COMPATIBILIDAD.find((c) => c.id === 'recorrido').limite,
  '⚠️ …y el del recorrido DICE su límite: el catálogo no sabe si es completo o parcial (regla 8)');
ok(Object.values(PESOS_COMPATIBILIDAD).every((v) => typeof v === 'number' && v > 0),
  'La puntuación interna sale de constantes declaradas (como `PESOS` de la F24)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Los patrones (apartado 4) ──');

const sinPatron = CATALOGO_EJERCICIOS.filter((e) => !patronDe(e)).map((e) => e.id);
ok(sinPatron.length === 0, `🚨 Los ${CATALOGO_EJERCICIOS.length} ejercicios del catálogo tienen su patrón (${sinPatron.join(', ') || 'ninguno sin'})`);
const PATRONES_DEL_ENUNCIADO = ['empuje-horizontal', 'empuje-vertical', 'tiron-horizontal', 'tiron-vertical', 'sentadilla',
  'bisagra-cadera', 'unilateral-pierna', 'flexion-rodilla', 'extension-cadera', 'core-antiextension', 'core-antirrotacion', 'flexion-cadera'];
ok(PATRONES_DEL_ENUNCIADO.every((id) => PATRONES_MOVIMIENTO.some((p) => p.id === id)),
  'Los doce patrones de movimiento del apartado 4 existen, por su id');
ok(PATRONES_MOVIMIENTO.every((p) => FAMILIAS_PATRON.some((f) => f.id === p.familia)),
  '…y cada uno declara su familia (empuje, tirón, pierna, core…)');
ok(PATRONES_MOVIMIENTO.every((p) => CATALOGO_EJERCICIOS.some((e) => e.patron === p.id)),
  '…y ninguno está vacío: cada patrón tiene al menos un ejercicio del catálogo');
ok(!PATRONES_MOVIMIENTO.some((p) => ['isometrico', 'explosivo', 'skill', 'habilidad'].includes(p.id)),
  '🚨 Isométrico, explosivo y skill NO son patrones: ya existían (apartado 4: «REUTILIZARLO»)');
ok(MODALIDADES.map((m) => m.id).join() === 'isometrico,explosivo,habilidad', '…son modalidades, leídas de `tipos` y `explosivo`');
ok(JSON.stringify(modalidadesDe(ejercicioPorId('full-planche'))) === JSON.stringify(['isometrico', 'habilidad']),
  '…así una planche es un empuje horizontal ISOMÉTRICO y de HABILIDAD');
ok(modalidadesDe(ejercicioPorId('muscle-up')).includes('explosivo'), '…y un muscle-up, explosivo');
const catalogoSrc = leer('src/lib/catalogoEjercicios.js');
ok((catalogoSrc.match(/^ {4}patron: '/gm) || []).length === CATALOGO_EJERCICIOS.length,
  '⚠️ El patrón va EN LA LÍNEA de cada ejercicio, no en un mapa aparte (EH F30)');
ok(crearEjercicioCompleto({ id: 'mio', nombre: 'Mío', patron: 'no-existe' }).patron === null,
  '⚠️ Un patrón que no está en el catálogo se queda en null, nunca en uno parecido');
ok(crearEjercicioCompleto({ id: 'mio', nombre: 'Mío', patron: 'sentadilla', unilateral: true }).unilateral === true
  && crearEjercicioCompleto({ id: 'mio', nombre: 'Mío', patron: 'sentadilla' }).patron === 'sentadilla',
'🚨 …y los dos campos nuevos están en la fábrica, o el siguiente guardado se los llevaría (regla 5)');
ok(ejercicioPorId('zancada-bulgara').unilateral === true && ejercicioPorId('sentadilla-barra').unilateral === false,
  'La lateralidad: la búlgara es unilateral, la sentadilla no');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. El ejemplo del apartado 5, y los casos 1-4 del apartado 39 ──');

const BANCA_GYM = getExerciseReplacements('press-banca-barra', { entorno: 'gym' });
ok(nivel(BANCA_GYM, 'press-banca-mancuernas') === 'muy_similar', '🚨 Press banca → Press mancuernas: MUY SIMILAR (apartado 5)');
ok(nivel(BANCA_GYM, 'press-maquina-pecho') === 'similar', '🚨 …Press máquina: SIMILAR');
ok(nivel(BANCA_GYM, 'flexion') === 'alternativa', '🚨 …Flexiones: ALTERNATIVA');
ok(!BANCA_GYM.some((x) => x.id === 'press-banca-barra'), '…y nunca se propone a sí mismo');

/* Caso 1 · mismo patrón. */
const muyYSimilar = BANCA_GYM.filter((x) => ['muy_similar', 'similar'].includes(x.compatibilityLevel));
ok(muyYSimilar.length > 0 && muyYSimilar.every((x) => x.mismoPatron),
  'Caso 1 · Mismo patrón: todo lo muy similar y similar comparte el empuje horizontal');
ok(BANCA_GYM[0].reasons.some((r) => /mismo patrón: empuje horizontal/.test(r)),
  `…y lo dice: «${BANCA_GYM[0].reasons.find((r) => /patrón/.test(r))}» (apartado 9)`);
/* Caso 2 · mismo músculo. */
const fondos = BANCA_GYM.find((x) => x.id === 'fondos-paralelas-pecho');
ok(fondos && fondos.compatibilityLevel === 'alternativa' && fondos.rasgos.mismoMusculoPrincipal && !fondos.mismoPatron,
  'Caso 2 · Mismo músculo, otro patrón (fondos): ALTERNATIVA, no similar');
ok(fondos.reasons.some((r) => /Los dos son de empuje, pero el movimiento no es el mismo/.test(r)),
  '…y se dice que los dos son de empuje pero no el mismo movimiento (apartado 13)');
/* Caso 3 · mismo equipamiento. */
const DOMINADA = getExerciseReplacements('dominada-prona', {});
const supina = DOMINADA.find((x) => x.id === 'dominada-supina');
ok(supina && supina.compatibilityLevel === 'muy_similar' && supina.rasgos.mismoMaterial,
  'Caso 3 · Mismo equipamiento: dominada prona → supina, muy similar y con el mismo material');
/* Caso 4 · equipamiento diferente. */
const maquina = BANCA_GYM.find((x) => x.id === 'press-maquina-pecho');
ok(maquina && !maquina.rasgos.mismoMaterial && maquina.compatibilityLevel !== 'muy_similar',
  '🚨 Caso 4 · Equipamiento diferente (máquina): nunca muy similar, aunque trabaje lo mismo');
ok(!maquina.reasons.includes('Alternativa con menor demanda de equipamiento.'),
  '🐛 …y una máquina NO es «menor demanda de equipamiento» por ser una sola palabra en la lista');
ok(BANCA_GYM.find((x) => x.id === 'flexion').reasons.includes('Alternativa con menor demanda de equipamiento.'),
  '…las flexiones sí lo son (apartado 9, su frase)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El entorno y el material (apartados 5, 6, 7 y el caso 5) ──');

const BANCA_CASA = getExerciseReplacements('press-banca-barra', { entorno: 'casa' });
ok(nivel(BANCA_CASA, 'press-maquina-pecho') === 'poco_recomendable',
  '🚨 Caso 5 · En casa, la máquina baja a POCO RECOMENDABLE (apartado 6, literal)');
ok(nivel(BANCA_CASA, 'press-banca-mancuernas') === 'muy_similar', '…las mancuernas siguen muy similares: se pueden hacer en casa');
ok(BANCA_CASA.find((x) => x.id === 'press-maquina-pecho').reasons[0] === 'En casa no se puede hacer.',
  '…y lo primero que dice la máquina es por qué: «En casa no se puede hacer.»');
const pantallaCasa = pantallaDeSustitucion('press-banca-barra', { entorno: 'casa' });
ok(!pantallaCasa.grupos.flatMap((g) => g.items).some((x) => x.id === 'press-maquina-pecho') && pantallaCasa.ocultas > 0,
  '…y no sale normalmente: queda entre las ocultas, a un toque');
const conPoco = pantallaDeSustitucion('press-banca-barra', { entorno: 'casa' }, { verPocoRecomendables: true });
ok(conPoco.grupos.some((g) => g.nivel.id === 'poco_recomendable' && g.items.some((x) => x.id === 'press-maquina-pecho')),
  '…pero si él lo pide, está (apartado 2: «normalmente»)');
const nivelSinCtx = nivelDeCompatibilidad(rasgosEnComun(ejercicioPorId('press-banca-barra'), ejercicioPorId('press-maquina-pecho')));
ok(nivelSinCtx === 'similar' && BANCA_CASA.find((x) => x.id === 'press-maquina-pecho').nivelSinContexto === 'similar',
  '⚠️ El nivel de los dos ejercicios no cambia: lo que baja es el nivel EN CONTEXTO (apartado 34)');
const CALI = getExerciseReplacements('remo-barra', { entorno: 'calistenia' });
const primeroVisibleCali = CALI.find((x) => NIVELES_VISIBLES.includes(x.compatibilityLevel));
ok(primeroVisibleCali && primeroVisibleCali.disponible === true,
  `En calistenia, lo primero que sale se puede hacer allí (${primeroVisibleCali && primeroVisibleCali.id})`);
ok(CALI.filter((x) => x.disponible === false).every((x) => x.compatibilityLevel === 'poco_recomendable'),
  '…y nada de gimnasio sube de «poco recomendable» (apartado 6)');

/* «No tengo» (apartado 7). */
const BULGARA = ejercicioPorId('zancada-bulgara');
ok(faltaMaterial(BULGARA, ['banco']).length === 0, '«No tengo banco»: la búlgara se queda — en su lista está la silla, del mismo grupo');
ok(JSON.stringify(faltaMaterial(BULGARA, ['banco', 'silla'])) === JSON.stringify(['banco', 'silla']),
  '…sin banco NI silla, sí le falta');
ok(faltaMaterial(ejercicioPorId('elevacion-talones'), ['maquina']).length === 0,
  '…y lo que se puede hacer sin material nunca «necesita» nada');
ok(JSON.stringify(faltaMaterial(ejercicioPorId('press-banca-barra'), ['barra'])) === JSON.stringify(['barra']),
  '🚨 «No tengo barra» → el press de banca con barra la necesita (apartado 7, su ejemplo)');
const SIN_BARRA = getExerciseReplacements('sentadilla-barra', { noTengo: ['barra'] });
ok(SIN_BARRA.filter((x) => x.exercise.equipamiento.includes('barra') && faltaMaterial(x.exercise, ['barra']).length)
  .every((x) => x.disponible === false),
'…y todo lo que la necesita sale como no disponible');
const soloDisp = filtrarSustituciones(SIN_BARRA, { soloDisponibles: true });
ok(soloDisp.length > 0 && soloDisp.every((x) => x.disponible !== false),
  `🚨 «Solo disponible» quita lo que no se puede hacer (${SIN_BARRA.length} → ${soloDisp.length})`);
ok(SIN_BARRA.find((x) => x.disponible === false).reasons.some((r) => /^Necesita barra/.test(r)),
  '…y lo que se queda fuera dice qué le falta: «Necesita barra.»');
const EXPL = getExerciseReplacements('press-banca-barra', { equipment: ['mancuernas', 'banco'] });
ok(nivel(EXPL, 'press-banca-mancuernas') === 'muy_similar' && EXPL.find((x) => x.id === 'press-inclinado-barra').disponible === false,
  'Con el material dicho (`equipment`), lo que pide barra no está disponible y las mancuernas sí');
const ctxDet = contextoDeSustitucion({ plantilla: { ejercicios: [{ exerciseId: 'press-banca-barra' }, { exerciseId: 'curl-mancuernas' }] } });
ok(ctxDet.detectado.has('barra') && ctxDet.detectado.has('mancuernas') && !ctxDet.detectado.has('suelo'),
  '🚨 Apartado 7 — el material del entrenamiento se DETECTA de sus otros ejercicios');
const sinElPropio = contextoDeSustitucion({ plantilla: { ejercicios: [{ exerciseId: 'press-banca-barra' }, { exerciseId: 'curl-mancuernas' }] } }, { original: 'press-banca-barra' });
ok(!sinElPropio.detectado.has('barra') && sinElPropio.detectado.has('mancuernas'),
  '⚠️ …pero el material del ejercicio que se SUSTITUYE no cuenta: si lo cambia por no tener barra, la barra no está');
ok(disponibilidad(ejercicioPorId('press-banca-barra'), {}).disponible === null,
  '⚠️ Sin contexto, la disponibilidad es null —no se sabe—, nunca «sí»');
ok(opcionesDeFiltro([]).entorno === undefined && materialDeLasPropuestas([]).length === 0,
  'Sin propuestas no hay filtros que ofrecer (regla 8)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Skill, isométrico, explosivo y variantes (casos 6-9) ──');

const TUCK = getExerciseReplacements('tuck-planche', {});
ok(nivel(TUCK, 'advanced-tuck-planche') === 'muy_similar', 'Caso 6 · Skill: tuck planche → advanced tuck, muy similar (su progresión)');
ok(nivel(BANCA_GYM, 'full-planche') === null || nivel(BANCA_GYM, 'full-planche') === 'poco_recomendable',
  '🚨 …y una planche NUNCA sale como sustituto de un press de banca');
ok(!TUCK.some((x) => x.compatibilityLevel === 'muy_similar' && !x.exercise.tipos.includes('habilidad')),
  '…ni un ejercicio de fuerza como «muy similar» a una skill');
const human = TUCK.find((x) => x.id === 'human-flag');
ok(!human || !human.rasgos.mismaProgresion,
  '🐛 …y pedir los dos un L-sit antes no pone la human flag «en la misma progresión» que la planche');

const PLANCHA = getExerciseReplacements('plancha-frontal', {});
ok(nivel(PLANCHA, 'hollow-body') === 'muy_similar', 'Caso 7 · Isométrico: plancha → hollow body, muy similar');
ok(!['muy_similar', 'similar'].includes(nivel(PLANCHA, 'crunch')), '…y un encogimiento (con recorrido) no lo es');
ok(claseDeMedida(ejercicioPorId('l-sit')) === 'tiempo' && claseDeMedida(ejercicioPorId('flexion')) === 'corporal'
  && claseDeMedida(ejercicioPorId('press-banca-barra')) === 'carga' && claseDeMedida(ejercicioPorId('dominada-lastrada')) === 'corporal',
'La forma de medirse: tiempo, carga externa o tu peso (con lastre también es tu peso)');

ok(nivel(DOMINADA, 'dominada-explosiva') === 'similar', 'Caso 8 · Explosivo: la dominada explosiva es similar, NO muy similar, a la normal');
ok(modalidadesDe(ejercicioPorId('sentadilla-salto')).includes('explosivo')
  && nivel(getExerciseReplacements('sentadilla-aire', {}), 'sentadilla-salto') !== 'muy_similar',
'…y la sentadilla con salto tampoco es «muy similar» a la de sin peso');

const CERRADO = BANCA_GYM.find((x) => x.id === 'press-cerrado');
ok(CERRADO && CERRADO.relacion === 'variante' && CERRADO.compatibilityLevel === 'alternativa',
  '🚨 Caso 9 · Variante: Press banca → Press banca cerrado es una variante y NO muy similar (apartado 31, su ejemplo)');
ok(relacionDeVariante(ejercicioPorId('press-cerrado'), ejercicioPorId('press-banca-barra')) === 'base',
  '…desde el cerrado, el de siempre es su BASE (la relación se recorre en los dos sentidos, F29)');
ok(relacionDeVariante(ejercicioPorId('press-banca-mancuernas'), ejercicioPorId('press-inclinado-barra')) === 'hermana',
  '…y dos variantes del mismo son hermanas');
ok(CERRADO.variant === 'Agarre estrecho', `…y la variante se devuelve aparte («${CERRADO.variant}», apartado 33)`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Sin alternativa, búsqueda manual y duplicados (casos 10, 11 y 21) ──');

const vacia = pantallaDeSustitucion('press-banca-barra', {}, { filtros: { dificultad: 'experto', grupo: 'cuello' } });
ok(vacia.estado === 'vacio' && vacia.texto === 'No encontramos una alternativa clara.',
  '🚨 Caso 10 · Sin alternativa: «No encontramos una alternativa clara.» (apartado 28, literal)');
ok(TEXTOS_SUSTITUCION.buscarTodos === 'Buscar en todos los ejercicios', '…con su CTA literal: «Buscar en todos los ejercicios»');
const PROPIO_RARO = crearEjercicioCompleto({ id: 'mi-raro', nombre: 'Algo mío', musculos: [{ subgrupoId: 'cervical', porcentaje: 100, papel: 'estabilizador' }] });
ok(getExerciseReplacements('mi-raro', { propios: [PROPIO_RARO] }).length === 0,
  '…y un ejercicio que no se parece a nada no se inventa sustitutos');

const aMano = sustitucionElegida('press-banca-barra', 'curl-barra', {});
ok(aMano && aMano.compatibilityLevel === null && aMano.reasons[0] === 'Elegido a mano.',
  '🚨 Caso 11 · Búsqueda manual: se puede elegir CUALQUIER ejercicio, y no se le inventa un nivel');
ok(sustitucionElegida('press-banca-barra', 'press-banca-mancuernas', {}).compatibilityLevel === 'muy_similar',
  '…y si lo que elige estaba en la lista, trae su nivel y sus motivos');
ok(sustitucionElegida('press-banca-barra', 'press-banca-barra', {}) === null, '…elegir el mismo no es sustituir');
ok(TEXTOS_SUSTITUCION.buscarOtro === 'Buscar otro ejercicio', 'El botón del apartado 25: «Buscar otro ejercicio»');

const PROPIO_DUP = crearEjercicioCompleto({
  id: 'mi-press', nombre: 'Press de banca', variante: 'Con mancuernas', patron: 'empuje-horizontal',
  equipamiento: ['mancuernas', 'banco'], entornos: ['gym'], medidas: ['reps', 'peso'], tipos: ['compuesto'],
  musculos: [{ subgrupoId: 'pectoral-medio', porcentaje: 60, papel: 'principal' }, { subgrupoId: 'triceps', porcentaje: 40 }],
});
const CON_DUP = getExerciseReplacements('press-banca-barra', { propios: [PROPIO_DUP] });
ok(CON_DUP.filter((x) => claveDeDuplicado(x.exercise) === claveDeDuplicado(PROPIO_DUP)).length === 1,
  '🚨 Caso 21 · Duplicados: el mismo ejercicio con la misma variante sale UNA vez (apartado 30)');
ok(new Set(ids(CON_DUP)).size === CON_DUP.length, '…y ningún id se repite');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. La configuración (apartados 11, 12 y 13) ──');

const ORIG = ejercicioPorId('press-banca-barra');
const c1 = configuracionRecomendada({ series: 4, modo: 'reps', repeticiones: 8, repsHasta: 12, descanso: 120, notas: 'Codos cerrados', peso: 60 }, ORIG, ejercicioPorId('press-banca-mancuernas'));
ok(c1.series === 4 && c1.descanso === 120 && c1.notas === 'Codos cerrados',
  '🚨 Se conservan series, descanso y notas (apartado 11)');
ok(c1.repeticiones === 8 && c1.repsHasta === 12 && c1.modo === 'reps', '…y con la misma medida, las repeticiones que puso (8–12)');
ok(c1.peso === null && c1.avisoPeso === 'El peso no se copia: era de otro ejercicio.',
  '…pero el peso NO viaja, y se dice (60 kg de barra no son 60 de mancuernas)');
const c2 = configuracionRecomendada({ series: 3, modo: 'reps', repeticiones: 10, descanso: 90 }, ORIG, ejercicioPorId('l-sit'));
ok(c2.modo === 'tiempo' && c2.duracion === null && c2.repeticiones === null,
  '🚨 Repeticiones → isométrico: NO se copia «3 × 10» como «3 × 10 s» (apartado 12, literal)');
ok(c2.cambiaMedida && c2.predeterminada && /se mide en segundos: las repeticiones no se han copiado/.test(c2.aviso),
  `…se usa la configuración predeterminada y SE AVISA (apartado 13): «${c2.aviso}»`);
ok(c2.series === 3 && c2.descanso === 90, '…manteniendo las series (apartado 13: «Mantener: series»)');
const c3 = configuracionRecomendada({ series: 3, modo: 'tiempo', duracion: 30 }, ejercicioPorId('plancha-frontal'), ejercicioPorId('crunch'));
ok(c3.modo === 'reps' && c3.repeticiones === null && c3.duracion === null && /se mide en repeticiones/.test(c3.aviso),
  '…y al revés, de segundos a repeticiones, lo mismo');
const c4 = configuracionRecomendada({ series: 3, modo: 'tiempo', duracion: 30 }, ejercicioPorId('plancha-frontal'), ejercicioPorId('hollow-body'));
ok(c4.duracion === 30 && !c4.cambiaMedida && c4.aviso === null, 'Isométrico → isométrico: los 30 s se quedan, sin aviso');
const c5 = configuracionRecomendada({ series: 4, modo: 'reps', repeticiones: 8 }, ejercicioPorId('dominada-prona'), ejercicioPorId('remo-barra'));
ok(c5.repeticiones === 8 && c5.tipoCarga === 'externo',
  'Dominadas → Remo (apartado 13): se quedan las series y las repeticiones, y la carga se recalcula del remo');
ok(tipoDeCargaPropuesto(ejercicioPorId('dominada-lastrada')) === 'adicional' && tipoDeCargaPropuesto(ejercicioPorId('flexion')) === 'corporal',
  '…el tipo de carga sale del nuevo: lastre para las lastradas, peso corporal para las flexiones');
ok(!necesitaConfirmar({ recommendedConfiguration: c4 }), '⚠️ Sin nada que decir, no se pregunta (EH F61)');
ok(necesitaConfirmar({ recommendedConfiguration: c2 }) && necesitaConfirmar({ recommendedConfiguration: c4 }, { conDatos: true })
  && necesitaConfirmar({ recommendedConfiguration: c4 }, { objetivo: { id: 'o' } }),
'…y sí cuando cambia la medida, hay datos o hay un objetivo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. En el entrenamiento en vivo (caso 12, apartado 14) ──');

const PLAN_ANTES = JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES));
const CAT_ANTES = JSON.stringify(ejercicioPorId('press-banca-barra'));
let VIVO = empezar('press-banca-barra', '2026-09-15', { peso: 60, repeticiones: 8, entorno: 'gym' });
const EJ0 = ejerciciosDeSesion(VIVO)[0];
VIVO = notaDeEjercicio(VIVO, EJ0.id, 'Hombro bien');
const VIVO2 = sustituirEjercicio(VIVO, EJ0.id, 'press-banca-mancuernas');
const EJ1 = ejerciciosDeSesion(VIVO2)[0];
ok(EJ1.exerciseId === 'press-banca-mancuernas' && EJ1.sustituyeA === 'press-banca-barra',
  '🚨 Caso 12 · En vivo: cambia el ejercicio de la sesión y apunta de cuál venía');
ok(EJ1.series.length === EJ0.series.length && EJ1.descanso === EJ0.descanso && EJ1.notas === 'Hombro bien',
  '…conservando series, descanso y nota (apartado 11)');
ok(EJ1.series.every((s) => s.plan.peso === null) && EJ0.series.every((s) => s.plan.peso === 60),
  '🐛 …y SIN el peso planificado: el «+» de las mancuernas ya no empieza en los 60 kg de la barra');
ok(EJ1.linea && EJ1.linea.peso === 60, '…lo que decía la plantilla sigue entero en `linea`');
ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PLAN_ANTES && JSON.stringify(ejercicioPorId('press-banca-barra')) === CAT_ANTES,
  '🚨 …y NO modifica ni el plan, ni la plantilla, ni el catálogo (apartado 14)');
let PL = empezar('plancha-frontal', '2026-09-15');
const PL_E = ejerciciosDeSesion(PL)[0];
const PL2 = sustituirEjercicio(PL, PL_E.id, 'crunch');
ok(PL_E.modo === 'tiempo' && ejerciciosDeSesion(PL2)[0].modo === 'reps',
  '🐛 Plancha → encogimiento: la tabla vuelve a repeticiones (antes seguía en segundos)');
ok(sustituirEjercicio(VIVO, EJ0.id, 'press-banca-barra') === VIVO || ejerciciosDeSesion(sustituirEjercicio(VIVO, EJ0.id, 'press-banca-barra'))[0].sustituyeA === null,
  '…y «sustituir» por el mismo no cambia nada');
const conf = configuracionDeSesion(EJ0);
ok(conf.series === 3 && conf.repeticiones === 8 && conf.peso === 60 && conf.modo === 'reps',
  'La configuración de un ejercicio de la sesión se lee de su snapshot (F7)');
const COMPAT = sustitutosCompatibles(EJ0, []);
ok(COMPAT.length > 0 && COMPAT.every((x) => x.ejercicio && x.motivo && NIVELES_VISIBLES.includes(x.compatibilityLevel)),
  '🔓 Los sustitutos de la F9 salen AHORA de este motor, con su forma de siempre');
ok(JSON.stringify(COMPAT.map((x) => x.id)) === JSON.stringify(getExerciseReplacements('press-banca-barra', {})
  .filter((x) => NIVELES_VISIBLES.includes(x.compatibilityLevel)).slice(0, 12).map((x) => x.id)),
'…y dicen lo mismo que él: no hay dos motores');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. En el constructor, la plantilla y el plan (casos 13-15) ──');

let RUT = crearRutina({ nombre: 'Pecho' });
RUT = anadirEjercicio(RUT, 'press-banca-barra');
RUT = anadirEjercicio(RUT, 'aperturas-mancuernas');
RUT = editarLinea(RUT, RUT.lineas[0].id, { series: 5, repeticiones: 6, peso: 80, descanso: 180, notas: 'Pausa abajo' });
const RUT2 = sustituirEnRutina(RUT, RUT.lineas[0].id, 'l-sit');
const L0 = RUT2.lineas[0];
ok(L0.exerciseId === 'l-sit' && L0.series === 5 && L0.descanso === 180 && L0.notas === 'Pausa abajo',
  '🚨 Caso 13 · Constructor: cambia el WorkoutExercise del borrador, con sus series, descanso y nota');
ok(L0.modo === 'tiempo' && L0.duracion === null && L0.repeticiones === null && L0.peso === null,
  '…y la medida se adapta: ni «6 s», ni los 80 kg');
ok(JSON.stringify(RUT2.lineas[1]) === JSON.stringify(RUT.lineas[1]), '…la otra línea, intacta');
ok(JSON.stringify(ejercicioPorId('press-banca-barra')) === CAT_ANTES && JSON.stringify(ejercicioPorId('l-sit')) === JSON.stringify(ejercicioPorId('l-sit')),
  '🚨 …y el Exercise maestro permanece intacto (apartado 15)');
ok(JSON.stringify(sustituirEnRutina(RUT, 'no-existe', 'l-sit')) === JSON.stringify(RUT) && sustituirEnRutina(RUT, RUT.lineas[0].id, 'no-existe').lineas[0].exerciseId === 'press-banca-barra',
  '…una línea o un ejercicio que no existen no cambian nada');
const RUT3 = cambiarVariante(RUT, RUT.lineas[0].id, 'press-banca-mancuernas');
ok(RUT3.lineas[0].exerciseId === 'press-banca-mancuernas' && RUT3.lineas[0].series === 5 && RUT3.lineas[0].repeticiones === 6 && RUT3.lineas[0].peso === null,
  '🔓 Cambiar de variante (F3) va por la misma puerta: se queda lo configurado y el peso no viaja');

const PLA = { ...rutinaAPlan(RUT), creadoEn: '2026-09-01', editadoEn: '2026-09-01' };
const OTRA = { ...rutinaAPlan(crearRutina({ nombre: 'Otra', lineas: [] })), creadoEn: '2026-09-01', editadoEn: '2026-09-01' };
const OTRA_B = { ...rutinaAPlan(anadirEjercicio(crearRutina({ nombre: 'Espalda' }), 'remo-barra')), creadoEn: '2026-09-01', editadoEn: '2026-09-01' };
const PLANTILLAS = [PLA, OTRA_B];
const editada = sustituirEnRutina(planARutina(PLA), planARutina(PLA).lineas[0].id, 'press-banca-mancuernas');
const guard = guardarRutina(PLANTILLAS, editada, [], '2026-09-20');
ok(guard.ok && guard.planes.find((p) => p.id === PLA.id).ejercicios[0].exerciseId === 'press-banca-mancuernas',
  '🚨 Caso 14 · Plantilla: se modifica ESA plantilla');
ok(JSON.stringify(guard.planes.find((p) => p.id === OTRA_B.id)) === JSON.stringify(OTRA_B) && guard.planes.length === 2,
  '…y las otras plantillas no se tocan (apartado 16)');
ok(OTRA.ejercicios.length === 0, '(una plantilla vacía de control, que no entra en la lista)');

const PPL_ANTES = JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES));
const pers = personalizarPreset({ ...DEFAULT_FITNESS }, 'ppl-estetico', { hoy: '2026-09-20' });
const copia = pers.creadas[0];
const copiaEditada = sustituirEnRutina(planARutina(copia), planARutina(copia).lineas[0].id, 'flexion');
const trasGuardar = guardarRutina(pers.fitness.plantillas, copiaEditada, [], '2026-09-20');
ok(pers.ok && trasGuardar.ok && trasGuardar.planes.find((p) => p.id === copia.id).ejercicios[0].exerciseId === 'flexion',
  '🚨 Caso 15 · Plan oficial: se personaliza (F5) y se sustituye en la COPIA');
ok(JSON.stringify(planPorId('ppl-estetico', CATALOGO_PLANES)) === PPL_ANTES,
  '🚨 …y el PresetPlan original no se modifica (apartado 17)');
ok(NO_EN_FIT33.some((x) => /plan oficial/.test(x.que)), '…lo que no se construye (un «Reemplazar» dentro del plan oficial) está declarado');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Historial, progreso, músculos, objetivos, rangos, clasificación (casos 16-20) ──');

const S12 = completar(empezar('press-banca-barra', '2026-09-12'), [{ peso: 60, reps: 8 }, { peso: 60, reps: 8 }, { peso: 60, reps: 7 }], '2026-09-12');
let S15 = empezar('press-banca-barra', '2026-09-15');
S15 = sustituirEjercicio(S15, ejerciciosDeSesion(S15)[0].id, 'press-banca-mancuernas');
S15 = completar(S15, [{ peso: 24, reps: 10 }, { peso: 24, reps: 10 }, { peso: 24, reps: 9 }], '2026-09-15');
const OBJ = crearObjetivo({ id: 'obj-banca', exerciseId: 'press-banca-barra', tipo: 'peso', valor: 80, creadoEn: 1 });
const CLAS = crearClasificacion({ id: 'cl-banca', exerciseId: 'press-banca-barra', respuesta: 'x', puntuacion: 300, creadoEn: 1 });
const F0 = { ...DEFAULT_FITNESS, objetivos: [OBJ], clasificaciones: [CLAS] };
const F12 = guardarSesion(F0, S12);
const S12_ANTES = JSON.stringify(F12.sesiones[0]);
const FT = guardarSesion(F12, S15);

const HIST = historialPorReciente(FT);
ok(HIST.length === 2 && JSON.stringify(FT.sesiones.find((s) => s.id === S12.id)) === S12_ANTES,
  '🚨 Caso 16 · Historial intacto: la sesión del 12 no se reescribe al sustituir el 15 (apartado 18)');
const idsDeSesion = (s) => ejerciciosDeSesion(s).map((e) => e.exerciseId).join();
ok(idsDeSesion(HIST.find((s) => s.fecha === '2026-09-12')) === 'press-banca-barra'
  && idsDeSesion(HIST.find((s) => s.fecha === '2026-09-15')) === 'press-banca-mancuernas',
'…12 SEP Press banca y 15 SEP Press mancuernas: el historial conserva los dos (su ejemplo)');

ok(aparicionesDeEjercicio(FT, 'press-banca-barra').length === 1 && aparicionesDeEjercicio(FT, 'press-banca-mancuernas').length === 1,
  '🚨 Caso 17 · Progreso separado: cada ejercicio tiene SU historial (apartado 19)');
const pBarra = progresoDeEjercicio(FT, 'press-banca-barra');
ok(JSON.stringify(pBarra) === JSON.stringify(progresoDeEjercicio(F12, 'press-banca-barra')),
  '…el progreso del de barra es el mismo con o sin la sesión de mancuernas: no se mezclan en un gráfico');

ok(FT.objetivos[0].exerciseId === 'press-banca-barra' && FT.objetivos[0].estado === 'activo',
  '🚨 Caso 18 · Objetivo asociado: por defecto SIGUE en el ejercicio original (apartado 21)');
ok(AVISO_OBJETIVO.titulo === 'Este objetivo pertenece al ejercicio original.' && AVISO_OBJETIVO.porDefecto === 'mantener'
  && [AVISO_OBJETIVO.mantener, AVISO_OBJETIVO.cancelar, AVISO_OBJETIVO.crear].join('|') === 'Mantener objetivo|Cancelar objetivo|Crear uno nuevo',
'…con el aviso y las tres opciones del enunciado, literales');
ok(JSON.stringify(OPCIONES_OBJETIVO) === JSON.stringify(['mantener', 'cancelar', 'crear']), '…en ese orden');
const enVivo = objetivoEnVivo(F12, 'press-banca-barra');
ok(enVivo && enVivo.id === 'obj-banca', '…y el entrenamiento en vivo lo encuentra para avisar (F30)');
let SV = empezar('press-banca-barra', '2026-09-20');
SV = sustituirEjercicio(SV, ejerciciosDeSesion(SV)[0].id, 'press-banca-mancuernas');
const unaEscritura = cancelarObjetivo(guardarSesion(F12, SV), 'obj-banca');
ok(unaEscritura.objetivos[0].estado === 'cancelado' && unaEscritura.sesiones.some((s) => s.id === SV.id),
  '🚨 «Cancelar objetivo» va en la MISMA escritura que la sesión: los dos cambios sobreviven (E3 F26)');
ok(leer('src/views/FitnessView.jsx').includes('cancelarObjetivo(guardarSesion(fitness || {}, sesionNueva), objetivoId)'),
  '…y es lo que hace la pantalla, no dos guardados seguidos');

const rMan = rangoDeEjercicio(FT, 'press-banca-mancuernas');
const rManSolo = rangoDeEjercicio(guardarSesion(F0, S15), 'press-banca-mancuernas');
ok(JSON.stringify(rMan) === JSON.stringify(rManSolo),
  '🚨 Caso 19 · Rango separado: el de mancuernas sale SOLO de sus sesiones (apartado 22)');
ok(JSON.stringify(rangoDeEjercicio(FT, 'press-banca-barra')) === JSON.stringify(rangoDeEjercicio(F12, 'press-banca-barra')),
  '…y el de barra no se entera de la sesión de mancuernas');
ok(!FT.clasificaciones.some((c) => c.exerciseId === 'press-banca-mancuernas') && FT.clasificaciones.length === 1,
  '🚨 La clasificación del sustituido NO se copia al nuevo (apartado 23)');
const cola = colaDeClasificacion(FT, { limite: 500 });
const enCola = (id) => cola.todos.find((x) => x.exerciseId === id) || null;
ok(enCola('press-banca-mancuernas') && enCola('press-banca-mancuernas').currentClassification === null,
  '…y el nuevo, sin clasificar, puede aparecer en la cola de la F24 con la suya vacía');
ok(enCola('press-banca-barra') && enCola('press-banca-barra').currentClassification?.id === 'cl-banca',
  '…mientras el original conserva la suya');

/* Caso 20 · ejercicio archivado. */
const archivado = pantallaDeSustitucion('ejercicio-que-ya-no-esta', {});
ok(archivado.estado === 'sin_ficha' && archivado.texto === TEXTOS_SUSTITUCION.sinFicha,
  '🚨 Caso 20 · Ejercicio archivado: sin ficha no se inventan alternativas, y se dice');
ok(sustitucionElegida('ejercicio-que-ya-no-esta', 'press-banca-barra', {}).id === 'press-banca-barra',
  '…pero se puede elegir otro a mano');
ok(CATALOGO_EJERCICIOS.every((e) => !getExerciseReplacements(e.id, {}).some((x) => !ejercicioPorId(x.id))),
  '…y como candidato no puede salir nunca: solo se proponen ejercicios que existen');
ok(LO_QUE_NO_SE_TRANSFIERE.map((x) => x.apartado).join() === '18,19,20,21,22,23,24',
  'Lo que no se transfiere, declarado sistema por sistema (apartados 18-24)');
ok(LO_QUE_NO_SE_TRANSFIERE.find((x) => x.id === 'favoritos').porque.includes('no tienen favoritos'),
  '⚠️ Favoritos de ejercicios no existen: se dice, no se inventan (apartado 24)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Orden, explicación y contexto (apartados 9, 10, 27 y 34) ──');

const orden = BANCA_GYM.map((x) => nivelCompatibilidad(x.compatibilityLevel).orden);
ok(orden.every((o, i) => i === 0 || orden[i - 1] <= o), 'Apartado 27 · primero los muy similares, después similares, alternativas');
const alts = BANCA_GYM.filter((x) => x.compatibilityLevel === 'alternativa');
const primerOtroPatron = alts.findIndex((x) => !x.mismoPatron);
ok(primerOtroPatron === -1 || alts.slice(primerOtroPatron).every((x) => !x.mismoPatron),
  '…y dentro de las alternativas, el mismo patrón va antes que el mismo grupo');
const textos = CATALOGO_EJERCICIOS.flatMap((e) => getExerciseReplacements(e.id, { entorno: 'casa', noTengo: ['barra'] }).flatMap((x) => x.reasons));
const malos = textos.filter((t) => EXPRESIONES_PROHIBIDAS.some((re) => re.test(t)));
ok(textos.length > 500 && malos.length === 0,
  `🚨 Apartado 10 · Ninguno de los ${textos.length} motivos dice «exactamente igual», «idéntico» ni «equivalente»`);
ok(EXPRESIONES_PROHIBIDAS.some((re) => re.test('Es exactamente igual.')) && EXPRESIONES_PROHIBIDAS.some((re) => re.test('87 % compatible')),
  '…y el barrido SÍ caza la frase prohibida y el «87 % compatible» (apartado 33)');
ok(textos.every((t) => t.length <= 70), '⚠️ Apartado 9 · explicaciones breves: ninguna pasa de 70 caracteres');
ok(BANCA_GYM.every((x) => typeof x.compatibilityScore === 'number' && x.reasons.length > 0 && x.recommendedConfiguration && Array.isArray(x.availableEquipment)),
  'Apartado 33 · cada resultado trae exercise, variant, nivel, score, reasons, availableEquipment y recommendedConfiguration');
const ALIAS = getExerciseReplacements('press-banca-barra', { environment: 'casa', workoutType: 'hipertrofia', currentConfiguration: { series: 4, modo: 'reps', repeticiones: 10 } });
ok(nivel(ALIAS, 'press-maquina-pecho') === 'poco_recomendable' && ALIAS[0].recommendedConfiguration.series === 4,
  'Apartado 34 · el contexto acepta los nombres del enunciado (environment, workoutType, currentConfiguration)');
const conSesion = contextoDeSustitucion({ liveSession: { entorno: 'calistenia', origen: { ejercicios: [{ exerciseId: 'dominada-prona' }] } } });
ok(conSesion.entornos.join() === 'calistenia' && conSesion.detectado.has('barra-dominadas'),
  '…y de una sesión en vivo saca su entorno (F10) y su material');
ok(sustitucionesDe === getExerciseReplacements, 'El nombre de la casa es la misma función');
ok(solapeMuscular(ejercicioPorId('curl-barra'), ejercicioPorId('sentadilla-barra')) === 0 && solapeMuscular(ORIG, ORIG) === 1,
  'El solape muscular: 0 entre un curl y una sentadilla, 1 consigo mismo');
ok(UMBRAL_SOLAPE_GRUPO > 0 && UMBRAL_SOLAPE_GRUPO < 1, 'El umbral de «mismo grupo de verdad» es una constante declarada');
ok(nivelEnContexto('muy_similar', { disponible: false }) === 'poco_recomendable' && nivelEnContexto('similar', { disponible: null }) === 'similar',
  'Lo que no se puede hacer baja a poco recomendable; lo que no se sabe, no');
ok(motivosDe(null) .length === 0, 'Sin rasgos no hay motivos');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Sin IA, rápido y un solo motor (apartados 33, 35 y 36) ──');

const LIB = soloCodigo(leer('src/lib/sustitucion.js'));
ok(!/askAI|anthropic|fetch\(|ask-ai/i.test(LIB), '🚨 Apartado 35 · ni una llamada a la IA: determinista');
ok(!/Math\.random|Date\.now/.test(LIB), '…ni azar ni reloj: la misma entrada da la misma salida');
ok(JSON.stringify(ids(getExerciseReplacements('remo-barra', { entorno: 'gym' }))) === JSON.stringify(ids(getExerciseReplacements('remo-barra', { entorno: 'gym' }))),
  '…y lo comprueba: dos llamadas, la misma lista');
ok(indiceDeSustitucion([]).catalogo === indiceDeSustitucion([]).catalogo, 'Apartado 36 · el índice del catálogo se construye UNA vez');
const MUCHOS = Array.from({ length: 500 }, (_, i) => crearEjercicioCompleto({
  id: `mio-${i}`, nombre: `Ejercicio mío ${i}`, patron: PATRONES_MOVIMIENTO[i % PATRONES_MOVIMIENTO.length].id,
  equipamiento: [EQUIPAMIENTO[i % EQUIPAMIENTO.length].id], entornos: ['gym'], medidas: ['reps'],
  musculos: [{ subgrupoId: CATALOGO_EJERCICIOS[i % 100].musculos[0].subgrupoId, porcentaje: 100, papel: 'principal' }],
}));
const t0 = Date.now();
for (let i = 0; i < 20; i += 1) getExerciseReplacements('press-banca-barra', { propios: MUCHOS, entorno: 'gym' });
const ms = (Date.now() - t0) / 20;
ok(ms < 60, `…y con 600 ejercicios sigue siendo rápido (${ms.toFixed(1)} ms por consulta)`);
ok(indiceDeSustitucion(MUCHOS).propios === indiceDeSustitucion(MUCHOS).propios, '…con el índice de los suyos guardado por lista');
const UX = soloCodigo(leer('src/lib/entrenamientoUx.js'));
ok(!/todosLosEjercicios\(/.test(UX) && /getExerciseReplacements\(/.test(UX),
  '🚨 La F9 ya no recorre el catálogo por su cuenta: le pide la lista a este motor');
ok(/configuracionRecomendada\(/.test(soloCodigo(leer('src/lib/entrenamiento.js'))) && /configuracionRecomendada\(/.test(soloCodigo(leer('src/lib/constructor.js'))),
  '…y la sesión (F7) y el constructor (F3) le piden la configuración al mismo sitio');
const COMP = leer('src/components/sustitucion.jsx');
ok(/createPortal/.test(COMP) && /fixed inset-0/.test(COMP), 'La hoja del constructor va con portal (regla 3)');
ok(!/compatibilityScore/.test(soloCodigo(COMP)), '🚨 …y la puntuación NO se pinta: es interna (apartado 33)');
ok(['ExerciseReplacement', 'ExerciseReplacementModal', 'ReplacementCard', 'ReplacementCompatibility', 'ReplacementReason',
  'ReplacementFilters', 'ReplacementSearch', 'ReplacementEmpty', 'ReplacementConfirm'].every((n) => new RegExp(`export function ${n}\\b`).test(COMP)),
'Apartado 32 · los nueve componentes existen, uno a uno');
ok(/aria-label=\{`Cambiar por \$\{nombre\}\. \$\{n \? n\.nombre/.test(COMP),
  'Apartado 37 · cada tarjeta dice acción, nombre, compatibilidad y motivo en su aria-label');
ok(/<EjerciciosView/.test(leer('src/views/EntrenamientoVivoView.jsx')) && /ExerciseReplacement\b/.test(leer('src/views/EntrenamientoVivoView.jsx')),
  'En vivo: la pantalla de sustitución, con la búsqueda a mano del catálogo de la F2');
ok(/ExerciseReplacementModal/.test(leer('src/views/ConstructorView.jsx')) && /sustituirEnRutina\(/.test(leer('src/views/ConstructorView.jsx')),
  'En el constructor: la hoja, y aplicarla es `sustituirEnRutina`');
ok(DECISIONES_FIT33.length >= 6 && NO_EN_FIT33.length >= 4, 'Las decisiones y lo que no se construye, declarados');

const aud = auditarSustitucion();
ok(aud.ok, `La auditoría de la fase: ${aud.casillas.map((c) => `${c.id} ${c.ok ? '✓' : '✗'}`).join(' · ')}`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log(fallos === 0
  ? `\n\x1b[32m✓ ${total}/${total} comprobaciones\x1b[0m`
  : `\n\x1b[31m✗ ${fallos} fallo(s) de ${total}\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
