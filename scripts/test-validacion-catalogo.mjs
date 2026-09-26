/* Entrega 4 · FIT F35/45 — Calidad, validación y administración del catálogo.
   ═══════════════════════════════════════════════════════════════════════════
   Los veinte casos del apartado 39, la diferencia entre error y aviso del 27,
   el informe del 28, el build del 26, el diagnóstico de desarrollo del 29 y la
   condición del final: *"Un error de catálogo debe detectarse pronto y no
   meses después cuando rompa otra parte de la aplicación"*.

   🚨 Y la que más importa: **se valida el catálogo EN BRUTO**. Lo normalizado
   ya ha corregido en silencio lo que está mal, así que validarlo no vería nada
   —y esta suite lo demuestra con una dificultad «beginner»—. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GRAVEDADES, REGLAS_CATALOGO, regla, TOLERANCIA_PORCENTAJE, MIN_DESCRIPCION, UMBRAL_COBERTURA,
  CICLOS_PERMITIDOS, recursoBienFormado, recursosDe, ciclosDe, validateExerciseCatalog, coberturaPorGrupo,
  diagnosticoCatalogo, resumenDeValidacion, avisarEnDesarrollo, YA_LO_RESUELVE, NO_EN_FIT35, DECISIONES_FIT35,
} from '../src/lib/validacionCatalogo.js';
import {
  CATALOGO_EJERCICIOS, auditarCatalogo, crearEjercicioCompleto, ejercicioPorId, todosLosEjercicios,
  buscarEjercicios, EQUIPAMIENTO, ENTORNOS, DIFICULTADES, TIPOS_EJERCICIO, PAPELES, MEDIDAS, AGARRES,
  PATRONES_MOVIMIENTO, materialDe, sinMaterial, ejerciciosParaLeer,
} from '../src/lib/ejercicios.js';
import { CATALOGO_BRUTO } from '../src/lib/catalogoEjercicios.js';
import { getExerciseReplacements, TIPOS_FILTRO, materialDeLasPropuestas } from '../src/lib/sustitucion.js';
import { cabeceraDeEjercicio, EJERCICIO_ARCHIVADO } from '../src/lib/detalleEjercicio.js';
import { fichaDeBiblioteca, consultarBiblioteca, TIPOS_DEL_FILTRO, ETIQUETAS_RELEVANTES } from '../src/lib/bibliotecaEjercicios.js';
import { PAPELES as PAPELES_CONTRIBUCION, contribucionesDeMusculo } from '../src/lib/contribucionMuscular.js';
import { clasificacionDeEjercicios } from '../src/lib/pantallaRangos.js';
import { rangoGlobalEfectivo } from '../src/lib/motorRangos.js';
import { resumenDeSesion } from '../src/lib/finalizacion.js';
import { aparicionesDeEjercicio } from '../src/lib/progresion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
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

/* Un ejercicio en bruto que pasa todas las reglas de ERROR. Cada caso cambia
   una sola cosa, así que lo que salta es lo que se está probando. */
const bueno = (id = 'mi-curl', extra = {}) => ({
  id,
  nombre: 'Curl de prueba',
  descripcion: 'Un curl para las pruebas de la validación del catálogo.',
  patron: 'flexion-codo',
  entornos: ['gym'],
  equipamiento: ['mancuernas'],
  dificultad: 'principiante',
  tipos: ['aislamiento', 'hipertrofia'],
  medidas: ['reps', 'peso'],
  musculos: [{ subgrupoId: 'biceps', porcentaje: 80, papel: 'principal' }, { subgrupoId: 'antebrazo', porcentaje: 20, papel: 'secundario' }],
  ...extra,
});
const reglasDe = (v) => [...v.errors, ...v.warnings].map((p) => p.regla);
const errores = (v) => v.errors.map((p) => p.regla);
const soloErrores = (lista) => validateExerciseCatalog(lista).errors;
const tieneError = (lista, r) => soloErrores(lista).some((p) => p.regla === r);

console.log('\n═══ FIT F35/45 · Calidad, validación y administración del catálogo ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 0. El escenario de base es válido de verdad ──');
const base0 = validateExerciseCatalog([bueno()]);
ok(base0.valid && base0.errors.length === 0,
  `El ejercicio de prueba pasa todas las reglas de error (${base0.errors.map((e) => e.regla).join(', ') || 'ninguna'})`);
ok(PATRONES_MOVIMIENTO.some((p) => p.id === 'flexion-codo') && ejercicioPorId('curl-biceps-barra') !== undefined,
  '…con un patrón que existe (si no, los casos de abajo medirían otra cosa)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. El informe (apartados 27 y 28) ──');
ok(Array.isArray(base0.errors) && Array.isArray(base0.warnings) && typeof base0.valid === 'boolean',
  '🚨 Apartado 28 — devuelve { errors, warnings, valid }');
ok(GRAVEDADES.map((g) => g.id).join() === 'error,aviso', 'Dos gravedades: error y aviso');
ok(REGLAS_CATALOGO.every((r) => GRAVEDADES.some((g) => g.id === r.gravedad) && r.que && Number.isInteger(r.apartado)),
  'Cada regla declara su gravedad, qué mira y de qué apartado sale');
ok(new Set(REGLAS_CATALOGO.map((r) => r.id)).size === REGLAS_CATALOGO.length, '…sin ids repetidos');
const comoError = ['id_duplicado', 'referencia_inexistente', 'porcentaje_imposible', 'porcentajes_no_suman', 'subgrupo_inexistente', 'ciclo_progresion'];
const comoAviso = ['posible_duplicado', 'recurso_no_encontrado', 'descripcion_corta', 'sin_imagen', 'contenido_incompleto', 'cobertura_baja'];
ok(comoError.every((r) => regla(r)?.gravedad === 'error'),
  '🚨 Apartado 27 — ERROR: id duplicado, referencia inexistente, porcentaje imposible, grupo inexistente y ciclo de progresión');
ok(comoAviso.every((r) => regla(r)?.gravedad === 'aviso'),
  '🚨 …y AVISO: posible duplicado, recurso opcional ausente, descripción corta, falta de imagen, contenido y cobertura');
ok(base0.errors.every((p) => p.gravedad === 'error') && validateExerciseCatalog([bueno('x', { descripcion: '' })]).warnings.every((p) => p.gravedad === 'aviso'),
  '…y cada problema lleva la gravedad de su regla');
ok(validateExerciseCatalog([bueno()]).warnings.every((p) => typeof p.mensaje === 'string' && p.mensaje.length > 5),
  'Cada problema se explica con una frase, no con un código');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Los veinte casos del apartado 39 ──');
/* 1 y 2 */
ok(tieneError([bueno('dup'), bueno('dup')], 'id_duplicado'), 'Caso 1 · ID duplicado → error');
ok(!tieneError([bueno('a-uno'), bueno('a-dos')], 'id_duplicado'), 'Caso 2 · IDs únicos → sin error');
ok(tieneError([bueno('', { nombre: 'Sin id' })], 'id_invalido') && tieneError([bueno('Press Banca')], 'id_invalido'),
  '…y un id vacío o que no es una ranura estable, también (apartado 2)');
/* 3 */
ok(tieneError([bueno('sin-nombre', { nombre: '' })], 'nombre_vacio') && tieneError([bueno('raro', { nombre: '··' })], 'nombre_vacio'),
  'Caso 3 · Nombre vacío o ilegible → error');
/* 4 */
ok(tieneError([bueno('g', { musculos: [{ subgrupoId: 'aletas', porcentaje: 100, papel: 'principal' }] })], 'subgrupo_inexistente'),
  'Caso 4 · Grupo muscular inexistente → error');
ok(tieneError([bueno('sm', { musculos: [] })], 'sin_musculos'), '…y sin ningún músculo, también (apartado 4)');
/* 5 */
ok(tieneError([bueno('s', { musculos: [{ subgrupoId: 'biceps', grupoId: 'piernas', porcentaje: 100, papel: 'principal' }] })], 'subgrupo_de_otro_grupo'),
  'Caso 5 · Subgrupo incorrecto (bíceps → piernas) → error (apartado 6)');
ok(!tieneError([bueno('s2', { musculos: [{ subgrupoId: 'biceps', grupoId: 'brazos', porcentaje: 100, papel: 'principal' }] })], 'subgrupo_de_otro_grupo'),
  '…y bíceps → brazos, sin error');
/* 6 y 7 */
const p115 = [bueno('p', { musculos: [
  { subgrupoId: 'biceps', porcentaje: 60, papel: 'principal' }, { subgrupoId: 'antebrazo', porcentaje: 25, papel: 'secundario' },
  { subgrupoId: 'triceps', porcentaje: 30, papel: 'secundario' },
] })];
ok(tieneError(p115, 'porcentajes_no_suman'), 'Caso 6 · 60 + 25 + 30 = 115 → error (el ejemplo del apartado 5)');
const p100 = [bueno('q', { musculos: [
  { subgrupoId: 'biceps', porcentaje: 60, papel: 'principal' }, { subgrupoId: 'antebrazo', porcentaje: 25, papel: 'secundario' },
  { subgrupoId: 'triceps', porcentaje: 15, papel: 'secundario' },
] })];
ok(!tieneError(p100, 'porcentajes_no_suman'), 'Caso 7 · 60 + 25 + 15 = 100 → válido');
const pDec = [bueno('d', { musculos: [
  { subgrupoId: 'biceps', porcentaje: 33.3, papel: 'principal' }, { subgrupoId: 'antebrazo', porcentaje: 33.3, papel: 'secundario' },
  { subgrupoId: 'triceps', porcentaje: 33.4, papel: 'secundario' },
] })];
ok(!tieneError(pDec, 'porcentajes_no_suman') && TOLERANCIA_PORCENTAJE > 0, '…con la tolerancia pequeña de los decimales (33,3 + 33,3 + 33,4)');
ok(tieneError([bueno('neg', { musculos: [
  { subgrupoId: 'biceps', porcentaje: 110, papel: 'principal' }, { subgrupoId: 'antebrazo', porcentaje: -10, papel: 'secundario' },
] })], 'porcentaje_imposible'),
'🚨 …y 110 − 10 = 100 NO es válido: un porcentaje negativo es imposible aunque la suma cuadre');
ok(tieneError([bueno('txt', { musculos: [{ subgrupoId: 'biceps', porcentaje: '100', papel: 'principal' }] })], 'porcentaje_imposible'),
  '…ni uno escrito como texto');
/* 8 */
ok(tieneError([bueno('v', { variantes: ['no-existe'] })], 'referencia_inexistente') && tieneError([bueno('v2', { base: 'no-existe' })], 'referencia_inexistente'),
  'Caso 8 · Variante rota (a algo que no existe) → error');
ok(tieneError([bueno('fam-a'), bueno('fam-b'), bueno('fam-c', { variantes: ['fam-a'] })], 'variante_incoherente'),
  '…y una variante declarada que no es de la familia, también (apartado 12)');
ok(!tieneError([bueno('fam-a'), bueno('fam-b', { base: 'fam-a' }), bueno('fam-c', { base: 'fam-a', variantes: ['fam-b'] })], 'variante_incoherente'),
  '…pero una hermana (misma base) sí es de la familia');
ok(tieneError([bueno('c1', { base: 'c2' }), bueno('c2', { base: 'c1' })], 'ciclo_variantes'), '…y dos bases que se apuntan entre sí forman un ciclo');
/* 9 */
ok(tieneError([bueno('pr', { progresiones: ['no-existe'] })], 'referencia_inexistente'), 'Caso 9 · Progresión inexistente → error');
/* 10 */
const ciclo = [bueno('ca', { progresiones: ['cb'] }), bueno('cb', { progresiones: ['cc'] }), bueno('cc', { progresiones: ['ca'] })];
const vCiclo = validateExerciseCatalog(ciclo);
ok(vCiclo.errors.some((p) => p.regla === 'ciclo_progresion' && p.ciclo.length === 3),
  'Caso 10 · A → B → C → A → error, con el ciclo entero');
ok(vCiclo.errors.filter((p) => p.regla === 'ciclo_progresion').length === 1, '…contado una vez, no tres');
CICLOS_PERMITIDOS.push({ ids: ['ca', 'cb', 'cc'], porque: 'Prueba' });
ok(!tieneError(ciclo, 'ciclo_progresion'), '…y si está marcado como excepción intencionada, no (apartado 14)');
CICLOS_PERMITIDOS.pop();
ok(CICLOS_PERMITIDOS.length === 0, '…y hoy no hay ninguna marcada');
/* 11 y 12 */
ok(tieneError([bueno('su', { sustitutos: ['no-existe'] })], 'referencia_inexistente'), 'Caso 11 · Sustitución inexistente → error');
ok(tieneError([bueno('yo', { sustitutos: ['yo'] })], 'referencia_a_si_mismo'), 'Caso 12 · Sustitución hacia sí mismo → error');
ok(tieneError([bueno('yo2', { progresiones: ['yo2'] })], 'referencia_a_si_mismo') && tieneError([bueno('yo3', { base: 'yo3' })], 'referencia_a_si_mismo'),
  '…y progresión a sí mismo o base de sí mismo, también (apartado 13)');
/* 13 a 16 */
ok(tieneError([bueno('eq', { equipamiento: ['pull-up bar'] })], 'equipo_invalido'), 'Caso 13 · Equipamiento inválido («pull-up bar») → error');
ok(tieneError([bueno('en', { entornos: ['Casa'] })], 'entorno_invalido') && tieneError([bueno('en2', { entornos: ['home workout'] })], 'entorno_invalido'),
  'Caso 14 · Entorno inválido («Casa», «home workout») → error');
ok(tieneError([bueno('di', { dificultad: 'beginner' })], 'dificultad_invalida'), 'Caso 15 · Dificultad inválida («beginner») → error');
ok(tieneError([bueno('ti', { tipos: ['cardio'] })], 'tipo_invalido'), 'Caso 16 · Tipo inválido → error');
/* 17 */
const conRecurso = [bueno('rec', { recursos: { ilustracion: '/ejercicios/no-esta.webp' } })];
const vRec = validateExerciseCatalog(conRecurso, { existeRecurso: () => false });
ok(vRec.warnings.some((p) => p.regla === 'recurso_no_encontrado') && vRec.valid,
  'Caso 17 · Recurso inexistente → aviso, y el catálogo sigue siendo válido (la ficha usa su hueco)');
ok(validateExerciseCatalog(conRecurso, { existeRecurso: () => true }).warnings.every((p) => p.regla !== 'recurso_no_encontrado'),
  '…y si existe, nada');
ok(tieneError([bueno('mal', { recursos: { ilustracion: 'foto.png' } })], 'recurso_mal_formado')
  && tieneError([bueno('mal2', { tutorial: { video: '/video.txt' } })], 'recurso_mal_formado'),
'…una ruta que no es propia o sin extensión de imagen/vídeo → error (apartado 18: formato esperado)');
ok(tieneError([bueno('fuera', { tutorial: { video: 'https://youtube.test/v' } })], 'enlace_externo'),
  '…y un enlace de fuera → error: ni una URL inventada (F2, apartado 22)');
ok(recursoBienFormado('/ejercicios/press.webp', ['webp']) && !recursoBienFormado('//cdn.test/x.webp', ['webp']) && !recursoBienFormado(null, ['webp']),
  '…una ruta con dos barras es de otro sitio, no propia');
/* 18 */
const archivado = crearEjercicioCompleto({ id: 'mi-archivado', nombre: 'Curl viejo', archivado: true, musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }] });
const activo = crearEjercicioCompleto({ id: 'mi-activo', nombre: 'Curl nuevo', musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }] });
ok(archivado.archivado === true && activo.archivado === false && crearEjercicioCompleto({}).archivado === false,
  'Caso 18 · `archivado` existe en el modelo (apartado 37) y solo `true` lo archiva');
ok(!todosLosEjercicios([archivado, activo]).some((e) => e.id === 'mi-archivado') && todosLosEjercicios([archivado, activo]).some((e) => e.id === 'mi-activo'),
  '🚨 …no aparece en la lista de lo que se puede elegir');
ok(!buscarEjercicios('curl viejo', [archivado]).some((e) => e.id === 'mi-archivado'), '…ni en las búsquedas nuevas');
ok(ejercicioPorId('mi-archivado', [archivado])?.nombre === 'Curl viejo', '…pero se sigue encontrando por su id, que es lo que lee el histórico');
const cab = cabeceraDeEjercicio('mi-archivado', { propios: [archivado] });
ok(cab.archivado && cab.existe && cab.nombre === 'Curl viejo' && cab.aviso === EJERCICIO_ARCHIVADO,
  '🚨 …y su cabecera dice «Ejercicio archivado» CON SU NOMBRE, que es lo que la C-36 no podía dar');
const sesionArch = {
  id: 's-arch', nombre: 'Brazo', fecha: '2026-09-01', estado: 'completada', iniciadaEn: 1, terminadaEn: 2, guardadaEn: 3,
  origen: { tipo: 'plantilla', id: null, ejercicios: [{ id: 'e1', exerciseId: 'mi-archivado', orden: 0, modo: 'reps', notas: '', descanso: 90, sustituyeA: null, linea: { series: 1 }, series: [{ id: 's1', origen: 'planificada', estado: 'hecha', modo: 'reps', plan: { reps: 10 }, hecho: { reps: 10, peso: 12, duracion: null } }] }] },
};
const fArch = { sesiones: [sesionArch] };
ok(fichaDeBiblioteca(fArch, 'mi-archivado', { propios: [archivado] }).estado === 'archivado'
  && fichaDeBiblioteca(fArch, 'mi-archivado', { propios: [archivado] }).nombre === 'Curl viejo',
'…la ficha de la biblioteca lo enseña como archivado, con su nombre y sin «Añadir»');
ok(!fichaDeBiblioteca(fArch, 'mi-archivado', { propios: [archivado] }).acciones.includes('anadir'), '…sin la acción de añadirlo a un entrenamiento');
ok(!getExerciseReplacements('mi-activo', { propios: [archivado, activo] }).some((x) => x.id === 'mi-archivado'),
  '🚨 …y la sustitución (F33) no lo propone');
ok(validateExerciseCatalog([bueno('usa', { sustitutos: ['viejo'] }), bueno('viejo', { archivado: true })]).warnings.some((p) => p.regla === 'referencia_archivada'),
  '…y la validación avisa si uno activo lo sigue proponiendo');
/* 19 */
ok(aparicionesDeEjercicio(fArch, 'mi-archivado', [archivado]).length === 1 && aparicionesDeEjercicio(fArch, 'mi-archivado', []).length === 1,
  'Caso 19 · Snapshot histórico: la sesión sigue leyéndose, esté el ejercicio archivado o haya desaparecido');
/* 🐛 Lo destapó la F36 antes de subir esta fase: dos pantallas de LECTURA
   recorrían el catálogo con la lista de lo ELEGIBLE, así que un archivado con
   rango salía del reparto de su músculo mientras seguía en su rango. */
const repArch = contribucionesDeMusculo(fArch, { subgrupoId: 'biceps' }, { propios: [archivado] });
ok(repArch.conDatos.some((c) => c.exerciseId === 'mi-archivado'),
  '🐛 …y sigue en el reparto de su músculo (F21), porque sigue contando en el rango de bíceps');
ok(!repArch.sinDatos.some((c) => c.exerciseId === 'mi-archivado') && !contribucionesDeMusculo({ sesiones: [] }, { subgrupoId: 'biceps' }, { propios: [archivado] }).sinDatos.some((c) => c.exerciseId === 'mi-archivado'),
  '…pero sin historia no se ofrece como «todavía sin datos»: eso sería proponerlo');
const clArch = clasificacionDeEjercicios(rangoGlobalEfectivo(fArch, { propios: [archivado] }), [archivado], fArch);
ok(clArch.clasificados <= clArch.total, `🐛 …y el «X de Y» de Rangos no dice más clasificados que ejercicios (${clArch.clasificados} de ${clArch.total})`);
ok(ejerciciosParaLeer([archivado, activo], ['mi-archivado']).some((e) => e.id === 'mi-archivado')
  && ejerciciosParaLeer([archivado, activo], ['mi-archivado']).length === todosLosEjercicios([archivado, activo]).length + 1,
  '`ejerciciosParaLeer`: lo elegible MÁS el archivado que tiene historia');
ok(ejerciciosParaLeer([archivado, activo], []).length === todosLosEjercicios([archivado, activo]).length
  && ejerciciosParaLeer([archivado], ['mi-activo', 'no-existe', 'press-banca-barra', 'press-banca-barra']).length === todosLosEjercicios([archivado]).length,
  '…sin historia no entra, y ni duplica lo que ya estaba ni inventa lo que no existe');
['contribucionMuscular', 'pantallaRangos'].forEach((n) => {
  ok(!/todosLosEjercicios\(/.test(soloCodigo(leer(`src/lib/${n}.js`))), `…\`${n}.js\` ya no lee con la lista de lo elegible`);
});
ok(!/fitness/.test(leer('src/lib/validacionCatalogo.js').match(/export function validateExerciseCatalog\([^)]*\)/)[0]),
  '🚨 Apartado 36 — la validación del catálogo NO recibe los datos del usuario: no puede confundirlos');
/* 20 */
const real = validateExerciseCatalog();
ok(real.valid && real.errors.length === 0, `Caso 20 · El catálogo completo es válido (${real.total} ejercicios, ${real.errors.length} errores)${real.errors.length ? ` — ${real.errors[0].mensaje}` : ''}`);
ok(real.total === CATALOGO_BRUTO.length && real.total === CATALOGO_EJERCICIOS.length, '…y los cuenta todos');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Se valida en bruto, y no corrige nada (apartados 2, 5 y 16) ──');
const beginner = bueno('beg', { dificultad: 'beginner', entornos: ['Casa'], equipamiento: ['pull-up bar'] });
const norm = crearEjercicioCompleto(beginner);
ok(norm.dificultad === 'principiante' && norm.entornos.length === 0 && norm.equipamiento.length === 0,
  '🚨 El normalizador corrige en silencio: «beginner» pasa a principiante y «Casa» desaparece…');
ok(tieneError([beginner], 'dificultad_invalida') && tieneError([beginner], 'entorno_invalido') && tieneError([beginner], 'equipo_invalido'),
  '…y la validación EN BRUTO lo ve: por eso no se valida lo normalizado');
const antes = JSON.stringify([beginner, ...p115]);
validateExerciseCatalog([beginner, ...p115]);
ok(JSON.stringify([beginner, ...p115]) === antes, 'Validar no modifica ni un campo (apartados 2 y 5)');
ok(!/saveData|onGuardar|crearEjercicioCompleto\([^)]*\)\s*=|\.push\(/.test(soloCodigo(leer('src/lib/validacionCatalogo.js')).replace(/problemas\.push|ciclos\.push/g, '')),
  '…ni guarda nada: solo informa');

/* 🐛 El fallo que destapó: la esterilla. */
const conEsterilla = CATALOGO_BRUTO.filter((e) => (e.equipamiento || []).includes('esterilla')).map((e) => e.id);
ok(conEsterilla.length === 9, `🐛 Nueve ejercicios de la F2 declaran esterilla (${conEsterilla.join(', ')})`);
ok(conEsterilla.every((id) => ejercicioPorId(id).equipamiento.includes('esterilla')),
  '🐛 …y ya NO se pierde al normalizar: estaba fuera de EQUIPAMIENTO y se tiraba en silencio');
ok(conEsterilla.every((id) => sinMaterial(ejercicioPorId(id)) && !materialDe(ejercicioPorId(id)).includes('esterilla')),
  '…es una superficie, como el suelo: se hacen sin material');
ok(!materialDeLasPropuestas(getExerciseReplacements('crunch').concat(getExerciseReplacements('press-banca-barra'))).some((m) => m.id === 'esterilla'),
  '…así que no aparece un «No tengo esterilla» que no cambiaría nada (regla 8)');
ok(validateExerciseCatalog(CATALOGO_BRUTO.map((e) => ({ ...e, equipamiento: (e.equipamiento || []).map((x) => (x === 'esterilla' ? 'esterilla-vieja' : x)) }))).errors.filter((p) => p.regla === 'equipo_invalido').length === 9,
  '…y la validación lo habría cazado: con el material fuera de la lista, nueve errores');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Configuración, skills, isométricos, explosivos y peso corporal (19-23) ──');
ok(tieneError([bueno('iso', { tipos: ['isometrico'], medidas: ['reps'] })], 'configuracion_incompatible'),
  'Apartado 21 · Un isométrico que no se puede medir en segundos → error');
ok(!tieneError([bueno('iso2', { tipos: ['isometrico'], medidas: ['tiempo'] })], 'configuracion_incompatible'), '…y con tiempo, bien');
ok(tieneError([bueno('pes', { medidas: ['peso'] })], 'configuracion_incompatible'), 'Apartado 19 · Peso sin repeticiones → error');
ok(tieneError([bueno('med', { medidas: [] })], 'medida_invalida') && tieneError([bueno('med2', { medidas: ['vatios'] })], 'medida_invalida'),
  '…y sin medidas o con una que no existe, también');
ok(validateExerciseCatalog([bueno('exp', { explosivo: true })]).warnings.some((p) => p.regla === 'explosivo_incoherente'),
  'Apartado 22 · Explosivo sin el tipo (o al revés) → aviso: separados, pero coherentes');
ok(!tieneError([bueno('sk', { tipos: ['habilidad'], medidas: ['tiempo'] })], 'configuracion_incompatible'),
  'Apartado 20 · Una skill no está obligada a llevar peso ni repeticiones');
ok(validateExerciseCatalog([bueno('sk2', { tipos: ['habilidad'] })]).warnings.some((p) => p.regla === 'skill_sin_progresion'),
  'Apartado 29 · Una habilidad sin progresión ni nadie que lleve a ella → aviso');
ok(real.warnings.every((p) => p.regla !== 'skill_sin_progresion'), '…y las 21 del catálogo tienen la suya');
const sesCorporal = {
  id: 'sc', nombre: 'Flexiones', fecha: '2026-09-01', estado: 'completada', iniciadaEn: 1, terminadaEn: 3600001, guardadaEn: 3600002,
  origen: { tipo: 'plantilla', id: null, ejercicios: [{ id: 'e', exerciseId: 'flexion', orden: 0, modo: 'reps', notas: '', descanso: 90, sustituyeA: null, linea: { series: 2 }, series: [
    { id: 'a', origen: 'planificada', estado: 'hecha', modo: 'reps', plan: { reps: 15 }, hecho: { reps: 15, peso: null, duracion: null } },
    { id: 'b', origen: 'planificada', estado: 'hecha', modo: 'reps', plan: { reps: 15 }, hecho: { reps: 12, peso: null, duracion: null } },
  ] }] },
};
const resCorporal = resumenDeSesion(sesCorporal);
ok(!!resCorporal && resCorporal.seriesCompletadas === 2 && resCorporal.volumen === null,
  `🚨 Apartado 23 · Unas flexiones a peso corporal NO son peso corporal × repeticiones: sin volumen, no un número (${JSON.stringify(resCorporal?.volumen)})`);
const sesLastre = JSON.parse(JSON.stringify(sesCorporal));
sesLastre.origen.ejercicios[0].series[0].hecho.peso = 10;
ok(resumenDeSesion(sesLastre)?.volumen?.kg === 150, '…y con lastre, solo cuenta el lastre: 10 kg × 15 = 150 (F8)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Duplicados, cobertura y contenido (16, 31 y 32) ──');
const dups = validateExerciseCatalog([
  bueno('dominadas-x', { nombre: 'Dominadas', patron: 'tiron-vertical', musculos: [{ subgrupoId: 'dorsales', porcentaje: 100, papel: 'principal' }] }),
  bueno('dominadas-pronadas-x', { nombre: 'Dominadas pronadas', patron: 'tiron-vertical', musculos: [{ subgrupoId: 'dorsales', porcentaje: 100, papel: 'principal' }] }),
]);
ok(dups.warnings.some((p) => p.regla === 'posible_duplicado') && dups.valid,
  '🚨 Apartado 16 · «Dominadas» y «Dominadas pronadas» sin relación → aviso de posible duplicado, y el catálogo sigue válido');
const dupsRel = validateExerciseCatalog([
  bueno('dominadas-x', { nombre: 'Dominadas', patron: 'tiron-vertical', musculos: [{ subgrupoId: 'dorsales', porcentaje: 100, papel: 'principal' }] }),
  bueno('dominadas-pronadas-x', { nombre: 'Dominadas pronadas', base: 'dominadas-x', patron: 'tiron-vertical', musculos: [{ subgrupoId: 'dorsales', porcentaje: 100, papel: 'principal' }] }),
]);
ok(!dupsRel.warnings.some((p) => p.regla === 'posible_duplicado'), '…y si el catálogo dice que es su variante, la diferencia es intencionada: nada');
ok(real.warnings.filter((p) => p.regla === 'posible_duplicado').length === 0, '…y en el catálogo real no hay ninguno');
ok(!dups.errors.length && validateExerciseCatalog([bueno('a1'), bueno('a2')]).total === 2, 'Y NUNCA se elimina: los dos siguen contados');
const cob = coberturaPorGrupo();
ok(cob.find((c) => c.grupoId === 'cuello')?.ejercicios === 3 && real.warnings.some((p) => p.regla === 'cobertura_baja' && p.id === 'cuello'),
  '🚨 Apartado 31 · «Cuello: 3 ejercicios» → aviso informativo, el ejemplo del enunciado');
ok(cob.filter((c) => c.ejercicios < UMBRAL_COBERTURA).length === real.warnings.filter((p) => p.regla === 'cobertura_baja').length,
  `…uno por grupo por debajo de ${UMBRAL_COBERTURA}`);
const incompleto = validateExerciseCatalog([bueno('inc', { descripcion: '' })]).warnings.find((p) => p.regla === 'contenido_incompleto');
ok(!!incompleto && incompleto.falta.join() === 'descripción,instrucciones,errores frecuentes,consejos',
  'Apartado 32 · «Contenido incompleto», diciendo qué falta');
ok(validateExerciseCatalog([bueno('corta', { descripcion: 'Curl.' })]).warnings.some((p) => p.regla === 'descripcion_corta') && MIN_DESCRIPCION === 30,
  '…y una descripción corta, aviso');
ok(real.valid && real.warnings.some((p) => p.regla === 'contenido_incompleto'), '…sin bloquear el build (apartado 32)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. La F2 no se reescribe: se amplía ──');
ok(YA_LO_RESUELVE[0].es === auditarCatalogo, '🚨 `auditarCatalogo` (F2) está declarada con la función de verdad');
ok(/auditarCatalogo\(/.test(soloCodigo(leer('src/lib/validacionCatalogo.js'))), '…y la validación la LLAMA, no la copia');
const rotoF2 = [
  { id: 'a', musculos: [{ subgrupoId: 'biceps', porcentaje: 50, papel: 'principal' }], entornos: ['casa'], sustitutos: ['no-existe'], progresiones: [], variantes: [] },
  { id: 'a', musculos: [], entornos: [], sustitutos: [], progresiones: [], variantes: [] },
];
const aF2 = auditarCatalogo(rotoF2);
const vF2 = validateExerciseCatalog(rotoF2);
ok(aF2.repetidos.every((id) => vF2.errors.some((p) => p.regla === 'id_duplicado' && p.id === id))
  && aF2.colgados.every((c) => vF2.errors.some((p) => p.regla === 'referencia_inexistente' && p.ref === c.ref))
  && aF2.sinEntorno.every((id) => vF2.errors.some((p) => p.regla === 'entorno_invalido' && p.id === id))
  && aF2.sinMusculos.every((id) => vF2.errors.some((p) => p.regla === 'sin_musculos' && p.id === id)),
'🚨 Todo lo que caza la F2 lo caza la F35, con su gravedad');
ok(auditarCatalogo().ok, '…y la F2 sigue en verde con el catálogo real');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Robusto: un dato corrupto no tumba la validación (F34, 37) ──');
let lanza = null;
try { validateExerciseCatalog([null, 'x', 42, { id: 'r', musculos: 'no', entornos: 'gym', tipos: null, medidas: 'reps', instrucciones: 'x', recursos: 'x', tutorial: 7 }]); } catch (e) { lanza = e; }
ok(!lanza, `Nulos, textos, números y campos con la forma equivocada: no lanza${lanza ? ` — ${lanza.message}` : ''}`);
ok(!validateExerciseCatalog([null, 'x']).valid, '…y los cuenta como error, no los ignora');
ok(validateExerciseCatalog([]).valid && validateExerciseCatalog(undefined).total === CATALOGO_BRUTO.length,
  'Un catálogo vacío es válido y sin argumentos se mira el de verdad');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Cada regla puede saltar (EH F42) ──');
const todosLosCasos = [
  [bueno('dup'), bueno('dup')], [bueno('Press Banca')], [bueno('sn', { nombre: '' })], [bueno('sm', { musculos: [] })],
  [bueno('g', { musculos: [{ subgrupoId: 'aletas', porcentaje: 100, papel: 'principal' }] })],
  [bueno('s', { musculos: [{ subgrupoId: 'biceps', grupoId: 'piernas', porcentaje: 100, papel: 'principal' }] })],
  [bueno('neg', { musculos: [{ subgrupoId: 'biceps', porcentaje: -5, papel: 'principal' }] })], p115,
  [bueno('pa', { musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'primary' }] })],
  [bueno('np', { musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'secundario' }] })],
  [bueno('en', { entornos: ['Casa'] })], [bueno('eq', { equipamiento: ['pull-up bar'] })], [bueno('di', { dificultad: 'beginner' })],
  [bueno('ti', { tipos: ['cardio'] })], [bueno('ag', { agarre: 'raro' })], [bueno('pt', { patron: 'empujar' })],
  [bueno('me', { medidas: [] })], [bueno('iso', { tipos: ['isometrico'], medidas: ['reps'] })],
  [bueno('v', { variantes: ['no-existe'] })], [bueno('yo', { sustitutos: ['yo'] })],
  [bueno('fam-a'), bueno('fam-b'), bueno('fam-c', { variantes: ['fam-a'] })], [bueno('c1', { base: 'c2' }), bueno('c2', { base: 'c1' })],
  ciclo, [bueno('fuera', { tutorial: { video: 'https://youtube.test/v' } })], [bueno('mal', { recursos: { ilustracion: 'foto.png' } })],
  [bueno('inc', { descripcion: '' })], [bueno('corta', { descripcion: 'Curl.' })], [bueno('sk2', { tipos: ['habilidad'] })],
  [bueno('exp', { explosivo: true })], [bueno('usa', { sustitutos: ['viejo'] }), bueno('viejo', { archivado: true })],
];
const saltadas = new Set(todosLosCasos.flatMap((c) => reglasDe(validateExerciseCatalog(c))));
reglasDe(vRec).forEach((r) => saltadas.add(r));
reglasDe(dups).forEach((r) => saltadas.add(r));
reglasDe(real).forEach((r) => saltadas.add(r));
const nunca = REGLAS_CATALOGO.filter((r) => !saltadas.has(r.id)).map((r) => r.id);
ok(nunca.length === 0, `🚨 Las ${REGLAS_CATALOGO.length} reglas saltan con su caso — ${nunca.join(', ') || 'ninguna se queda muda'}`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Centralización y traducciones (apartados 33 y 34) ──');
const catalogos = { ENTORNOS, EQUIPAMIENTO, DIFICULTADES, TIPOS_EJERCICIO, PAPELES, MEDIDAS, AGARRES, PATRONES_MOVIMIENTO };
ok(Object.values(catalogos).every((c) => c.every((x) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(x.id) && x.nombre)),
  'Los ids internos son técnicos (sin acentos ni mayúsculas) y cada uno tiene su nombre en español');
ok(PAPELES_CONTRIBUCION.principal === 'Principal' && Object.keys(PAPELES_CONTRIBUCION).join() === PAPELES.map((p) => p.id).join(),
  '🐛 El mapa de papeles de la F21 ya no es una copia escrita a mano: se deriva de la lista central');
ok(/PAPELES_CATALOGO\.map/.test(leer('src/lib/contribucionMuscular.js')) && !/principal: 'Principal'/.test(leer('src/lib/contribucionMuscular.js')),
  '…y el orden de los papeles también');
ok([...TIPOS_FILTRO, ...TIPOS_DEL_FILTRO, ...ETIQUETAS_RELEVANTES].every((t) => TIPOS_EJERCICIO.some((x) => x.id === t)),
  'Las listas de tipos de la F33 y la F34 son subconjuntos por ids de TIPOS_EJERCICIO, no tipos nuevos');
const ARCHIVOS = ['sustitucion.js', 'bibliotecaEjercicios.js', 'detalleEjercicio.js', 'contribucionMuscular.js', 'progresoEjercicios.js', 'colaClasificacion.js', 'clasificacion.js', 'detalleMuscular.js', 'pantallaRangos.js', 'constructor.js', 'entrenamiento.js'];
const COPIAS = [/\[\s*'gym'\s*,\s*'calistenia'\s*,\s*'casa'\s*\]/, /'principiante'\s*,\s*'intermedio'\s*,\s*'avanzado'\s*,\s*'experto'/, /'principal'\s*,\s*'secundario'\s*,\s*'estabilizador'/, /'reps'\s*,\s*'peso'\s*,\s*'tiempo'\s*,\s*'distancia'/];
const copiadas = ARCHIVOS.filter((f) => COPIAS.some((re) => re.test(leer(`src/lib/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))));
ok(copiadas.length === 0, `🚨 Apartado 34 · Ni una copia de ENTORNOS, DIFICULTADES, PAPELES o MEDIDAS en los once archivos de Fitness — ${copiadas.join(', ') || 'ninguna'}`);
ok(COPIAS[2].test("const x = ['principal', 'secundario', 'estabilizador'];"), '…y el barrido sigue cazando una de verdad');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Desarrollo, build y diagnóstico (apartados 25, 26, 29, 30) ──');
const MAIN = leer('src/main.jsx');
ok(/if \(import\.meta\.env\.DEV\) avisarEnDesarrollo\(\)/.test(MAIN), 'Apartado 25 · Al arrancar en desarrollo se valida el catálogo (main.jsx)');
ok(!/import\.meta/.test(soloCodigo(leer('src/lib/validacionCatalogo.js'))), '…y la librería no lee `import.meta`: la importa también el build');
const llamadas = { error: [], warn: [] };
const consola = { error: (m) => llamadas.error.push(m), warn: (m) => llamadas.warn.push(m) };
avisarEnDesarrollo(consola);
ok(llamadas.error.length === 0 && llamadas.warn.length === 1, 'Con el catálogo real: ningún error en consola y los avisos en UNA línea');
ok(/0 errores · \d+ avisos/.test(llamadas.warn[0] || ''), `…que dice cuántos hay: «${(llamadas.warn[0] || '').split('\n')[0]}»`);
const VITE = leer('vite.config.js');
ok(/validarCatalogoAlCompilar\(\)/.test(VITE) && /apply: 'build'/.test(VITE) && /if \(!v\.valid\)/.test(VITE) && /this\.error\(/.test(VITE),
  '🚨 Apartado 26 · El build valida el catálogo y PARA solo con errores (vite.config.js)');
ok(/existsSync\(new URL\(`\.\$\{ruta\}`, publico\)\)/.test(VITE), '…y es el único sitio que comprueba que una ruta de public/ existe');
const vConfig = await import('../vite.config.js');
const plugin = (vConfig.default.plugins || []).flat().find((p) => p && p.name === 'josstyle-validar-catalogo');
let paro = null;
const logOriginal = console.log;
console.log = () => {};
try { plugin.buildStart.call({ error: (m) => { throw new Error(m); } }); } catch (e) { paro = e; }
console.log = logOriginal;
ok(!!plugin && !paro, '…y con el catálogo real el build sigue');
let paroRoto = null;
console.log = () => {};
try {
  vConfig.validarCatalogoAlCompilar({ bruto: [bueno('dup'), bueno('dup')] }).buildStart.call({ error: (m) => { throw new Error(m); } });
} catch (e) { paroRoto = e; }
let paroAviso = null;
try {
  vConfig.validarCatalogoAlCompilar({ bruto: [bueno('solo-avisos', { descripcion: '' })] }).buildStart.call({ error: (m) => { throw new Error(m); } });
} catch (e) { paroAviso = e; }
console.log = logOriginal;
ok(!!paroRoto && /tiene 1 error:/.test(paroRoto.message) && /repetido/.test(paroRoto.message),
  `🚨 …y con un id repetido el build PARA, diciendo cuál («${(paroRoto?.message || '').split('\n')[0]}»)`);
ok(!paroAviso, '🚨 …pero con avisos solamente, NO para (apartado 27)');
ok(resumenDeValidacion(validateExerciseCatalog([bueno('dup'), bueno('dup')])).includes('✗ Dos ejercicios con el mismo id: 1'),
  '…y su resumen dice qué regla falla y cuántas veces');
const d = diagnosticoCatalogo();
ok(d.total === 100 && d.valido && d.errores.length === 0, `Apartado 29 · El diagnóstico: ${d.total} ejercicios, ${d.errores.length} errores, ${d.avisos.length} avisos`);
ok(d.porEntorno.map((x) => x.id).join() === 'gym,calistenia,casa' && d.porEntorno.every((x) => x.ejercicios > 0),
  'Apartado 30 · Por entorno: Gym, Calistenia y Casa');
ok(d.porDificultad.length === 4 && d.porDificultad.reduce((n, x) => n + x.ejercicios, 0) === 100, '…por dificultad, que suman los cien');
ok(d.porTipo.length === TIPOS_EJERCICIO.length && d.porGrupo.length === 7, '…por tipo y por grupo muscular');
ok(d.sinImagen.length === 100 && d.sinTutorial.length === 100 && d.sinProgresion.length === 0 && d.categorias.length > 0,
  '…los que no tienen imagen ni tutorial (hoy todos, y es verdad) y las habilidades sin progresión');
const COMP = leer('src/components/diagnosticoCatalogo.jsx');
ok(/import\.meta\.env\?\.DEV === true/.test(COMP), '🚨 Solo en desarrollo: lo decide `import.meta.env.DEV` (apartado 29)');
ok(/diagnostico = false/.test(leer('src/views/EjerciciosView.jsx')) && /diagnostico=\{esDesarrollo\(\)\}/.test(leer('src/views/FitnessView.jsx')),
  '…la biblioteca no lo enseña si no se lo piden, y Fitness solo lo pide en desarrollo');
ok(!/onClick=\{[^}]*(guardar|corregir|arreglar|onGuardar)/i.test(COMP), '…y no hay un botón de «arreglar»: informa, no corrige');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Lo que no se construye y lo decidido (apartado 40) ──');
const LIB = soloCodigo(leer('src/lib/validacionCatalogo.js'));
ok(!/fetch\(|askAI|supabase|localStorage|indexedDB/i.test(LIB), 'Ni IA, ni backend, ni base de datos externa, ni almacenamiento');
ok(NO_EN_FIT35.length >= 4 && DECISIONES_FIT35.length >= 4 && NO_EN_FIT35.every((x) => x.que && x.porque) && DECISIONES_FIT35.every((x) => x.que && x.porque),
  'Lo que no se construye y lo decidido, declarados con su motivo');
ok(NO_EN_FIT35.some((x) => /TypeScript/.test(x.que)) && /@typedef/.test(leer('src/lib/ejercicios.js')),
  'Apartado 35 · Sin migrar a TypeScript: los tipos del Exercise van en JSDoc');
const t0 = Date.now();
for (let i = 0; i < 10; i += 1) validateExerciseCatalog();
const ms = (Date.now() - t0) / 10;
ok(ms < 200, `La validación entera tarda ${ms.toFixed(1)} ms: se puede ejecutar en cada arranque y en cada build`);

console.log(`\n${fallos ? '\x1b[31m' : '\x1b[32m'}${total - fallos}/${total} comprobaciones${fallos ? ` — ${fallos} fallan` : ''}\x1b[0m`);
process.exit(fallos ? 1 : 0);
