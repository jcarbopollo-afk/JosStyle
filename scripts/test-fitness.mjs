/* Fundación arquitectónica del módulo Fitness (Entrega 4 · FIT F1/45).
 *
 * El apartado 26 del enunciado es la lista de validación —compila, se entra, se
 * cambia de área, responsive, persistencia, integración, estados vacíos—, y el
 * criterio de éxito pide *"una base arquitectónica suficientemente sólida"*.
 * Esto comprueba la parte que se puede comprobar sin navegador; el recorrido de
 * Chromium hace la otra mitad.
 *
 * 🚨 Lo que más se vigila aquí es que **no se haya duplicado nada**: las fotos
 * de progreso ya son `saludFotos` y las habilidades ya son `calistenia`. Una
 * segunda lista de cualquiera de las dos dejaría lo que Josué ya tiene
 * registrado invisible en su propia pantalla, que es el fallo que este proyecto
 * ha cometido cuatro veces (E3 F16, E3 F36, E3 F41 y AS F1).
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  INVENTARIO, MAPEO_EXISTENTE, AREAS_FITNESS, AREA_INICIAL, areaFitness, NO_SE_GUARDA,
  GRUPOS_MUSCULARES, grupoMuscular, subgrupoMuscular, TODOS_LOS_SUBGRUPOS,
  NIVELES_RANGO, SIN_RANGO, nivelRango, nombreDeRango, estadoDeNivel,
  crearEjercicio, normalizarEjercicio, normalizarImplicacion, grupoConEjercicios,
  crearWorkoutExercise, normalizarWorkoutExercise,
  crearWorkoutPlan, normalizarWorkoutPlan,
  crearWorkoutSession, normalizarWorkoutSession, duracionDeSesion, minutosDeHora, ESTADOS_SESION,
  crearMuscleRank, normalizarMuscleRank, MODELOS,
  CLAVE_FITNESS, DEFAULT_FITNESS, normalizarFitness,
  rachaDeFitness, ESTADOS_VACIOS, CTA_CLASIFICAR, ACCESOS_ENTRENAMIENTO,
  resumenProgreso, resumenEntrenamiento,
  NO_EN_FIT1, condicionFIT1, PALABRAS_DE_JUEGO, textosDeFitness,
} from '../src/lib/fitness.js';

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

const APP = leer('src/App.jsx');
const VISTA = leer('src/views/FitnessView.jsx');
const LIB = leer('src/lib/fitness.js');
const TOKENS = leer('src/tokens.js');

/* ⚠️ La lección de siempre, van veintidós: una prueba que mira si el código
   HACE algo tiene que quitar los comentarios **y las cadenas**. Este archivo y
   `fitness.js` nombran XP, monedas y recompensas justamente para prometer que
   no están, y `NO_EN_FIT1` nombra el catálogo de ejercicios para declarar que
   no se construye. */
const sinComentarios = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const sinCadenas = (src) => src
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');
const LIB_CODIGO = sinCadenas(sinComentarios(LIB));
const APP_CODIGO = sinComentarios(APP);

console.log('\n── 1. El inventario del apartado 1 nombra archivos que existen ──');
ok(INVENTARIO.length >= 13, `Las trece preguntas del apartado 1, contestadas (${INVENTARIO.length})`);
ok(INVENTARIO.every((i) => i.pregunta && i.respuesta && i.donde), 'Cada línea dice qué se preguntó, qué se encontró y dónde');
const inventarioReal = INVENTARIO.filter((i) => i.donde.includes('/') || i.donde.endsWith('.md') || i.donde.endsWith('.json'));
ok(inventarioReal.length === INVENTARIO.length, 'Todas apuntan a una ruta, no a una descripción');
ok(INVENTARIO.every((i) => existsSync(join(RAIZ_DIR, i.donde))),
  'Y cada archivo del inventario existe de verdad — una lista que solo se cuenta a sí misma no demuestra nada');

console.log('\n── 2. Lo que ya existía NO se ha duplicado ──');
ok(MAPEO_EXISTENTE.length >= 4, `Cuatro mapeos declarados (${MAPEO_EXISTENTE.length})`);
const fotos = MAPEO_EXISTENTE.find((m) => m.modelo === 'ProgressPhoto');
ok(fotos && fotos.yaEs === 'saludFotos', 'ProgressPhoto ya es `saludFotos`, no una lista nueva');
ok(fotos && fotos.gestionaEn === 'salud', 'y se gestiona en Salud física, donde vive su archivo y su PIN');
const hab = MAPEO_EXISTENTE.find((m) => m.yaEs === 'calistenia');
ok(!!hab, 'Las habilidades ya son `calistenia`');
ok(MAPEO_EXISTENTE.every((m) => m.porque && m.porque.length > 40), 'Cada mapeo dice por qué no se copia');
ok(!Object.keys(DEFAULT_FITNESS).includes('fotos') && !Object.keys(DEFAULT_FITNESS).includes('progreso'),
  '🚨 El almacén de Fitness NO tiene una lista de fotos: sería la quinta vez del mismo fallo');
ok(!Object.keys(DEFAULT_FITNESS).includes('habilidades') && !Object.keys(DEFAULT_FITNESS).includes('calistenia'),
  '🚨 Ni una segunda lista de habilidades');
ok(!/uploadProgressPhoto|getSignedPhotoUrl/.test(LIB_CODIGO),
  'Esta librería no sube ni firma fotos: eso lo hace Salud física');

console.log('\n── 3. Las tres áreas (apartados 5 y 22) ──');
ok(AREAS_FITNESS.length === 3, 'Son exactamente tres');
ok(AREAS_FITNESS.map((a) => a.id).join(',') === 'rangos,progreso,entrenamiento',
  'Rangos · Progreso · Entrenamiento, en ese orden');
ok(AREAS_FITNESS.every((a) => a.label && a.que && a.icono), 'Cada una con nombre, descripción e icono');
ok(areaFitness('rangos')?.label === 'Rangos' && areaFitness('inventada') === null,
  'areaFitness() encuentra las que hay y devuelve null con las que no');
ok(AREAS_FITNESS.some((a) => a.id === AREA_INICIAL), 'El área inicial es una de las tres');
ok(!Object.keys(DEFAULT_FITNESS).includes('area') && !Object.keys(DEFAULT_FITNESS).includes('tab'),
  '⚠️ Cuál está abierta NO se guarda: es de la pantalla (EH F40)');
ok(NO_SE_GUARDA.length >= 4 && NO_SE_GUARDA.every((n) => n.que && n.porque),
  'Y lo que no se guarda está declarado con su motivo');

console.log('\n── 4. Grupos y subgrupos musculares (apartados 9 y 10) ──');
ok(GRUPOS_MUSCULARES.length === 7, 'Siete grupos');
ok(GRUPOS_MUSCULARES.map((g) => g.nombre).join(', ')
  === 'Brazos, Piernas, Espalda, Pecho, Hombros, Abdominales, Cuello',
  'En el orden del apartado 9');
ok(GRUPOS_MUSCULARES.every((g) => (g.subgrupos || []).length > 0), 'Todos tienen al menos un subgrupo');
ok(grupoMuscular('piernas').subgrupos.map((s) => s.nombre).join(', ')
  === 'Cuádriceps, Isquios, Glúteos, Gemelos', 'Piernas trae los cuatro del apartado 10');
ok(grupoMuscular('pecho').subgrupos.length === 2, 'Pecho trae los dos');
ok(subgrupoMuscular('triceps')?.grupoId === 'brazos', 'Un subgrupo sabe de qué grupo es');
ok(subgrupoMuscular('inventado') === null, 'Y uno que no existe devuelve null');
const idsSub = TODOS_LOS_SUBGRUPOS.map((s) => s.id);
ok(new Set(idsSub).size === idsSub.length, 'Ni un id de subgrupo repetido entre grupos');
ok(TODOS_LOS_SUBGRUPOS.length === GRUPOS_MUSCULARES.reduce((n, g) => n + g.subgrupos.length, 0),
  'La lista plana tiene todos los subgrupos');
const idsGrupo = GRUPOS_MUSCULARES.map((g) => g.id);
ok(new Set(idsGrupo).size === idsGrupo.length, 'Ni un id de grupo repetido');

console.log('\n── 5. Los diez niveles de rango (apartados 9 y 22) ──');
ok(NIVELES_RANGO.length === 10, 'Diez niveles, como fija el apartado 22');
ok(NIVELES_RANGO.every((n, i) => n.orden === i + 1), 'Numerados del 1 al 10, sin huecos');
ok(NIVELES_RANGO.every((n) => n.id && n.nombre && n.que), 'Cada uno con id, nombre y qué significa');
ok(new Set(NIVELES_RANGO.map((n) => n.id)).size === 10, 'Sin ids repetidos');
ok(SIN_RANGO.nombre === 'Sin Rango', 'El estado sin datos se llama «Sin Rango», con las palabras del apartado 9');
ok(SIN_RANGO.que === 'Completa ejercicios para comenzar a establecer tu nivel.',
  'Y su texto es el literal del enunciado');
ok(nivelRango(1)?.nombre === 'Iniciación' && nivelRango(10)?.nombre === 'Élite', 'Los extremos de la escala');
ok(nivelRango(0) === null && nivelRango(11) === null, 'Fuera de la escala, null');
ok(nombreDeRango(null) === 'Sin Rango', '🚨 Sin nivel se dice «Sin Rango», no «nivel 0» — `Number(null)` es 0');
ok(nombreDeRango(5) === 'Intermedio', 'Con nivel se dice el nombre');
ok(NIVELES_RANGO.every((n) => estadoDeNivel(n, null) === 'bloqueado'),
  '⚠️ Sin rango, los diez salen bloqueados: nada de progreso ficticio (apartado 9)');
ok(estadoDeNivel(nivelRango(3), 5) === 'completado'
  && estadoDeNivel(nivelRango(5), 5) === 'actual'
  && estadoDeNivel(nivelRango(7), 5) === 'bloqueado',
  'Con rango 5: los tres estados');

console.log('\n── 6. Los modelos del apartado 13 ──');
ok(MODELOS.length === 7, 'Los siete modelos que enumera el apartado 13');
ok(MODELOS.map((m) => m.nombre).join(',')
  === 'Exercise,MuscleGroup,WorkoutExercise,WorkoutPlan,WorkoutSession,ProgressPhoto,MuscleRank',
  'Con los nombres del enunciado');
ok(MODELOS.every((m) => m.llena && m.llena.length > 10), 'Cada uno declara qué fase lo llena');
ok(MODELOS.filter((m) => m.normalizador).every((m) => typeof m.normalizador === 'function'),
  '⚠️ El normalizador es la FUNCIÓN importada, no su nombre: renombrarla rompe la compilación');
ok(MODELOS.find((m) => m.nombre === 'ProgressPhoto').fabrica === null,
  'ProgressPhoto no tiene fábrica aquí: ya la tiene Salud física');
ok(MODELOS.find((m) => m.nombre === 'MuscleGroup').fabrica === null,
  'MuscleGroup tampoco: los grupos no los crea el usuario');

console.log('\n── 7. Exercise ──');
const ej = crearEjercicio({
  nombre: '  Press banca  ', variante: 'Con barra', entorno: 'gimnasio',
  equipamiento: ['barra', '  ', 'banco'],
  musculos: [{ subgrupoId: 'pectoral-medio', porcentaje: 60 }, { subgrupoId: 'inventado', porcentaje: 40 }],
});
ok(ej.nombre === 'Press banca', 'El nombre se guarda sin espacios de sobra');
ok(ej.equipamiento.length === 2, 'El equipamiento vacío se descarta');
ok(ej.musculos.length === 1 && ej.musculos[0].subgrupoId === 'pectoral-medio',
  '🚨 Un subgrupo que no existe se descarta en el normalizador: un id colgado no lo puede dibujar nadie');
ok(ej.id && ej.id.length > 3, 'Y nace con su id');
ok(normalizarEjercicio({ id: 'x', nombre: 'Dominadas' }).id === 'x', 'El normalizador conserva el id guardado');
ok(normalizarEjercicio({ nombre: 'Sin id' }) === null, 'Y descarta lo que no tiene id — sería un duplicado esperando a pasar');
ok(normalizarImplicacion(null).length === 0, 'Una implicación que no es lista no revienta');
ok(normalizarImplicacion([{ subgrupoId: 'biceps', porcentaje: null }])[0].porcentaje === null,
  'Un porcentaje en blanco se queda en null, no en 0');

console.log('\n── 8. MuscleGroup: la relación se deriva ──');
const catalogo = [
  crearEjercicio({ nombre: 'Press banca', musculos: [{ subgrupoId: 'pectoral-medio', porcentaje: 70 }] }),
  crearEjercicio({ nombre: 'Curl', musculos: [{ subgrupoId: 'biceps', porcentaje: 90 }] }),
];
ok(grupoConEjercicios('pecho', catalogo).ejercicios.length === 1, 'Pecho encuentra su ejercicio');
ok(grupoConEjercicios('brazos', catalogo).ejercicios.length === 1, 'Brazos el suyo');
ok(grupoConEjercicios('cuello', catalogo).ejercicios.length === 0, 'Y el que no tiene ninguno, ninguno');
ok(grupoConEjercicios('inventado', catalogo) === null, 'Un grupo que no existe devuelve null');
ok(!/ejerciciosDe\s*:/.test(LIB_CODIGO) && !Object.keys(DEFAULT_FITNESS).includes('relaciones'),
  '⚠️ La relación grupo → ejercicios NO se guarda: se queda vieja en cuanto edite uno');

console.log('\n── 9. WorkoutExercise ──');
const we = crearWorkoutExercise({ exerciseId: 'e1', orden: 2 });
ok(we.exerciseId === 'e1', 'Apunta al catálogo por id');
ok(!Object.keys(we).includes('nombre'),
  '🚨 NO copia el nombre del ejercicio: renombrarlo tiene que renombrarlo en todas partes (AS F1)');
ok(we.series === null && we.repeticiones === null && we.peso === null && we.descanso === null,
  '⚠️ Series, repeticiones, peso y descanso nacen en null: un cero diría que levantó cero kilos');
ok(crearWorkoutExercise({ peso: '82.5' }).peso === 82.5, 'Un peso escrito como texto se convierte');
ok(crearWorkoutExercise({ peso: 'ochenta' }).peso === null, 'Y uno que no es un número se queda en null');
ok(crearWorkoutExercise({ series: 4.7 }).series === 4, 'Las series son enteras');
ok(normalizarWorkoutExercise({ id: 'w1', exerciseId: 'e9' }).id === 'w1', 'El normalizador conserva el id');
ok(normalizarWorkoutExercise({}) === null, 'Y descarta lo que no tiene');

console.log('\n── 10. WorkoutPlan ──');
const plan = crearWorkoutPlan({
  nombre: 'Torso', frecuencia: '3', duracion: 45,
  ejercicios: [{ id: 'w1', exerciseId: 'e1' }, { sinId: true }],
});
ok(plan.nombre === 'Torso' && plan.frecuencia === 3 && plan.duracion === 45, 'Guarda lo suyo');
ok(plan.ejercicios.length === 1, 'Y descarta el ejercicio sin id al normalizar');
ok(normalizarWorkoutPlan({ id: 'p1', nombre: 'A' }).id === 'p1', 'El normalizador conserva el id');
ok(typeof crearWorkoutPlan().meta === 'object', 'La metadata es siempre un objeto');
ok(crearWorkoutPlan({ meta: 'texto' }).meta && typeof crearWorkoutPlan({ meta: 'texto' }).meta === 'object',
  'Incluso si lo guardado era otra cosa');

console.log('\n── 11. WorkoutSession ──');
const ses = crearWorkoutSession({ nombre: 'Lunes', fecha: '2026-09-13', inicio: '18:00', fin: '19:30' });
ok(ses.estado === 'planificada', 'Nace planificada');
ok(crearWorkoutSession({ estado: 'inventado' }).estado === 'planificada', 'Un estado que no existe cae en el de partida');
ok(ESTADOS_SESION.length === 4, 'Cuatro estados de sesión');
ok(ses.planId === null, 'Una sesión suelta, sin plan, puede existir');
ok(!Object.keys(ses).includes('duracion'),
  '🚨 La duración NO se guarda: se deriva de las horas, como la del sueño (E3 F31)');
ok(duracionDeSesion(ses) === 90, 'Y se calcula: de 18:00 a 19:30 son 90 minutos');
ok(duracionDeSesion({ inicio: '23:30', fin: '00:15' }) === 45, 'Cruzando la medianoche también');
ok(duracionDeSesion({ inicio: '18:00', fin: null }) === null,
  '⚠️ Sin hora de fin, null: una sesión sin fin NO dura una hora por defecto (E3 F13)');
ok(minutosDeHora('25:99') === null,
  '🐛 «25:99» encaja con el patrón y no es una hora: la forma no basta (E3 F8)');
ok(minutosDeHora('7:05') === 425, 'Una hora de un dígito sí vale');
ok(normalizarWorkoutSession({ id: 's1' }).id === 's1', 'El normalizador conserva el id');

console.log('\n── 12. MuscleRank ──');
const r = crearMuscleRank({ grupoId: 'espalda' });
ok(r.nivel === null, '🚨 Un rango sin datos es null, no el nivel 1');
ok(r.clasificados.length === 0, 'Y sin ejercicios clasificados');
ok(normalizarMuscleRank({ grupoId: 'inventado' }) === null, 'Un rango de un grupo que no existe se descarta');
ok(normalizarMuscleRank({ grupoId: 'pecho', nivel: 47 }).nivel === null,
  'Un nivel fuera de la escala se deja sin rango en vez de pintar una insignia que no existe');
ok(normalizarMuscleRank({ grupoId: 'pecho', nivel: 6 }).nivel === 6, 'Uno válido se conserva');
ok(!Object.keys(r).includes('id'), 'Un rango se identifica por su grupo: no hace falta un id propio');

console.log('\n── 13. La persistencia es la que ya existe (apartado 14) ──');
ok(CLAVE_FITNESS === 'fitness', 'Una clave propia dentro de `app_data`');
ok(!/localStorage/.test(LIB_CODIGO), '🚨 Esta librería no toca localStorage: la interfaz no depende del mecanismo');
ok(!/supabase|createClient/.test(LIB_CODIGO), 'Ni habla con Supabase: eso es de App.jsx');
ok(Object.values(DEFAULT_FITNESS).every((v) => !Array.isArray(v) || v.length === 0),
  '⚠️ El estado inicial está limpio: ni un plan de ejemplo (apartado 15)');
const sucio = normalizarFitness({
  ejercicios: [{ id: 'e1', nombre: 'A' }, { nombre: 'sin id' }],
  planes: 'no es una lista',
  sesiones: [{ id: 's1', estado: 'completada' }],
  rangos: [{ grupoId: 'brazos', nivel: 3 }, { grupoId: 'inventado' }],
  loSuyo: 'un campo que no conozco',
});
ok(sucio.ejercicios.length === 1, 'El normalizador descarta lo que no tiene id');
ok(Array.isArray(sucio.planes) && sucio.planes.length === 0, 'Y lo que no es una lista pasa a serlo');
ok(sucio.rangos.length === 1, 'Y el rango de un grupo inventado');
ok(sucio.loSuyo === 'un campo que no conozco',
  '⚠️ Un campo que no conoce NO se lo lleva: `saveData` sobrescribe (regla 5)');
ok(Object.keys(DEFAULT_FITNESS).every((k) => k in sucio),
  'Y devuelve el objeto entero, con todas las claves del default');
ok(normalizarFitness(null).ejercicios.length === 0, 'Sin nada guardado, el default limpio');
ok(normalizarFitness({ version: '2' }).version === 2, 'La versión guardada se conserva');

console.log('\n── 14. Lo que se enseña se deriva (apartados 6, 9, 11, 12 y 17) ──');
ok(rachaDeFitness({ definiciones: [], eventos: [] }) === null,
  '🚨 Sin racha de entrenamiento definida NO se pinta nada: un «0 días» propio sería un número falso (EH F23)');
const HOY = '2026-09-13';
const defTraining = { id: 'r1', tipo: 'training', regla: { clase: 'diaria' }, desde: '2026-09-01' };
const eventos = ['2026-09-13', '2026-09-12', '2026-09-11'].map((f) => ({ rachaId: 'r1', fecha: f, valor: 1 }));
const racha = rachaDeFitness({ definiciones: [defTraining], eventos }, HOY);
ok(racha && racha.dias === 3, 'Con la racha definida se lee la de verdad, del historial');
ok(racha && racha.texto === '3 días', 'Y se escribe en plural cuando toca');
ok(rachaDeFitness({ definiciones: [defTraining], eventos: eventos.slice(0, 1) }, HOY).texto === '1 día',
  'Y en singular cuando toca');
ok(rachaDeFitness({ definiciones: [{ ...defTraining, activa: false }], eventos }, HOY) === null,
  '⚠️ Una racha archivada no cuenta: se pregunta con el mismo criterio que la pantalla de Rachas');
ok(rachaDeFitness({ definiciones: [{ ...defTraining, tipo: 'study' }], eventos }, HOY) === null,
  'Y la racha de otro tipo tampoco: la cabecera de Fitness enseña la de entrenamiento');
ok(!/definiciones:\s*\[\s*\{/.test(LIB_CODIGO), 'Esta librería no crea rachas: solo las lee');

console.log('\n── 15. Estados vacíos: ninguno es una pantalla en blanco (apartado 17) ──');
ok(AREAS_FITNESS.every((a) => ESTADOS_VACIOS[a.id]), 'Las tres áreas tienen el suyo');
ok(Object.values(ESTADOS_VACIOS).every((v) => v.titulo && v.texto && v.porque),
  'Cada uno con título, explicación y por qué es así');
ok(ESTADOS_VACIOS.progreso.accion?.lleva === 'salud',
  '⚠️ «Añadir foto» lleva a Salud física, donde de verdad se suben — no finge una subida');
ok(ESTADOS_VACIOS.rangos.accion === null && ESTADOS_VACIOS.entrenamiento.accion === null,
  'Y donde no hay nada que pulsar todavía, no hay botón (regla 8)');
ok(CTA_CLASIFICAR.texto === 'Clasificar ejercicios', 'El CTA del apartado 9 existe con su nombre');
ok(CTA_CLASIFICAR.existe === false && CTA_CLASIFICAR.porque,
  'Declarado con su motivo en vez de ofrecido como un botón que no clasifica nada');
ok(!/0 restantes/.test(JSON.stringify(CTA_CLASIFICAR)),
  '⚠️ Y sin el «· 0 restantes»: sería el contador de una lista que aún no existe');
/* 🐛 Aquí decía `ACCESOS_ENTRENAMIENTO.length === 3`, y la FIT F2 añadió el
   cuarto —el catálogo— con todo el derecho: saltó con el código bien. Es la
   bomba de relojería de `MODULOS_EH.length === 13` por enésima vez. Se
   comprueba **que estén los que tienen que estar**, no cuántos hay. */
ok(['planificaciones', 'plantillas', 'habilidades']
  .every((id) => ACCESOS_ENTRENAMIENTO.some((a) => a.id === id)),
  'Los accesos del área de Entrenamiento están, y se comprueban por su id, no por su número');
ok(ACCESOS_ENTRENAMIENTO.filter((a) => !a.existe).every((a) => a.enFase),
  'Los que no existen dicen cuándo llegan');
ok(ACCESOS_ENTRENAMIENTO.find((a) => a.id === 'habilidades')?.existe === true,
  'Y Habilidades SÍ existe: es la calistenia que ya lleva registrada');

console.log('\n── 16. Los resúmenes cuentan lo que hay, de las dos listas ──');
ok(resumenProgreso([]).vacio === true, 'Sin fotos, el estado vacío');
ok(resumenProgreso([{ id: 1 }, { id: 2 }]).cuantas === 2,
  '🚨 Con dos fotos dice dos: la pantalla NO puede decirle que no tiene ninguna teniendo dos');
ok(resumenProgreso([{ id: 1 }]).texto.includes('1 foto'), 'Y en singular con una');
const cal = { Handstand: { sesiones: [{ id: 'a' }, { id: 'b' }], progresion: [] }, Planche: { sesiones: [], progresion: [{ id: 'p' }] } };
const re = resumenEntrenamiento(DEFAULT_FITNESS, cal);
ok(re.sesiones === 2, '🚨 Las sesiones de calistenia cuentan: si contara solo las suyas diría «sin entrenamientos» con siete habilidades en marcha (E3 F22)');
ok(re.habilidadesActivas === 2, 'Y cuenta las habilidades con algo registrado');
ok(resumenEntrenamiento(DEFAULT_FITNESS, {}).sesiones === 0, 'Sin nada, cero');
ok(!/linea1/.test(LIB_CODIGO),
  '🚨 Y aquí NO hay una segunda línea de hub: la escribe calcularResumenModulo desde la Fase 19 (D2-07)');
ok(MAPEO_EXISTENTE.some((m) => m.yaEs === 'resumenesHub'),
  '…y está declarado, con el motivo, en vez de simplemente ausente');

console.log('\n── 17. Ni XP, ni monedas, ni recompensas (D2-02 · C-33) ──');
const textos = textosDeFitness();
ok(textos.length > 30, `Se barren todos los textos que ve Josué (${textos.length})`);
for (const p of PALABRAS_DE_JUEGO) {
  ok(!textos.some((t) => p.re.test(String(t))), `Ni una vez «${p.palabra}» en lo que se pinta`);
}
/* 🐛 **Y van con límite de palabra porque «Experto» contiene «xp»**: la primera
   versión buscaba subcadenas y ponía roja la escala entera con el código bien.
   Es la lección de la EH F40 —un `uid()` con «xp» dentro tumbaba `verificar.sh`
   dos veces de cada cien— ahora en un nombre de verdad. Aquí está la prueba de
   que el arreglo hace falta y de que no tapa nada: «Experto» pasa, «100 XP» no. */
ok(!PALABRAS_DE_JUEGO.some((p) => p.re.test('Experto')),
  '🐛 «Experto» NO cuenta como «xp»: la regla mira palabras, no trozos de palabra');
ok(PALABRAS_DE_JUEGO.some((p) => p.re.test('Has ganado 100 XP')),
  '…y sigue cazando lo que tiene que cazar');
ok(PALABRAS_DE_JUEGO.some((p) => p.re.test('Desbloquea el siguiente')), 'y lo de desbloquear también');
ok(!/gananci/i.test(textos.join(' ')), 'Ni lenguaje de premio');
ok(NIVELES_RANGO.every((n) => !/nivel \d/i.test(n.nombre)),
  'Un rango se llama por lo que mide —Intermedio, Avanzado—, no «Nivel 4»');

console.log('\n── 18. Lo que NO se construye está declarado (apartados 23 y 27) ──');
ok(NO_EN_FIT1.length >= 12, `Las doce cosas que el apartado 23 prohíbe (${NO_EN_FIT1.length})`);
ok(NO_EN_FIT1.every((n) => n.que && n.porque), 'Cada una con su motivo');
ok(NO_EN_FIT1.some((n) => /atálogo de ejercicios/.test(n.que)),
  'El catálogo de ejercicios, que es lo que el apartado 27 prohíbe adelantar');
ok(!/EJERCICIOS_BASE|CATALOGO_EJERCICIOS/.test(LIB_CODIGO),
  '🚨 Y no hay ni un ejercicio escrito: la FIT F2 es la que trae el catálogo');
ok(DEFAULT_FITNESS.ejercicios.length === 0, 'La lista de ejercicios nace vacía');

console.log('\n── 19. La integración con la aplicación que ya existe ──');
ok(/label: 'Fitness'/.test(APP_CODIGO), 'La entrada se llama «Fitness» (apartado 4)');
ok(/id: 'entreno'/.test(APP_CODIGO),
  '🚨 Y su id sigue siendo `entreno`: es la clave de la personalización y de la navegación (NAV F2)');
ok(/loadData\(uidUser, 'fitness'/.test(APP), 'App.jsx carga la clave `fitness` de app_data');
ok(/normalizarFitness/.test(APP_CODIGO), 'Y la pasa por su normalizador al cargar (regla 5)');
ok(!/'calistenia'\s*:/.test(LIB_CODIGO), 'Fitness no redefine la clave de calistenia');
ok(/from '\.\.\/lib\/fitness'/.test(VISTA), 'La vista importa esta librería en vez de calcular por su cuenta');
ok(!/#[0-9a-fA-F]{6}/.test(VISTA), 'Ni un hex suelto en la vista (regla 2)');
ok(!/#[0-9a-fA-F]{6}/.test(LIB_CODIGO), 'Ni en la librería');
ok(/TrainingView/.test(VISTA),
  '🚨 El área de Entrenamiento RENDERIZA la pantalla de calistenia, no copia su contenido (E3 F23)');

console.log('\n── 20. La condición de finalización se calcula, no se afirma ──');
const cond = condicionFIT1({ app: APP, vista: VISTA, tokens: TOKENS });
ok(cond.casillas.length === 12, `Doce casillas (${cond.casillas.length})`);
ok(cond.casillas.every((c) => c.id && c.que), 'Cada una con su id y qué comprueba');
for (const c of cond.casillas) ok(c.ok, `Condición: ${c.que}`);
ok(cond.completo, '🏁 FIT F1 cumple su criterio de éxito');
const falsa = condicionFIT1({ app: '', vista: '', tokens: '' });
ok(!falsa.completo,
  '⚠️ Y con los archivos vacíos se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
