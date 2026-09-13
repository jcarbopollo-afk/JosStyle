/* Sistema y catálogo maestro de ejercicios (Entrega 4 · FIT F2/45).
 *
 * El apartado 29 es una lista de catorce validaciones obligatorias, y cuatro de
 * ellas no se pueden comprobar a ojo con cien ejercicios: **los ids son únicos,
 * los porcentajes suman 100, las referencias apuntan a algo que existe y no hay
 * ni un enlace inventado**. Eso lo ejecuta `auditarCatalogo()` y aquí se mira.
 *
 * 🚨 Lo que más se vigila, como en la F1, es que **no se haya duplicado nada**:
 * los grupos musculares son los de la F1, el `Exercise` es el de la F1 ampliado
 * —no uno nuevo al lado— y la relación grupo → ejercicios **se deriva**, no se
 * guarda.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ENTORNOS, EQUIPAMIENTO, DIFICULTADES, TIPOS_EJERCICIO, AGARRES, PAPELES, MEDIDAS,
  entorno, equipo, dificultad, tipoEjercicio, agarre, papel, medida,
  ranura, crearEjercicioCompleto, normalizarEjercicioCompleto, normalizarImplicacionCompleta,
  crearTutorial, crearInstrucciones, crearRecursos,
  CATALOGO_EJERCICIOS, ejercicioPorId, todosLosEjercicios, musculosDe, musculoPrincipal,
  ejerciciosDeGrupo, ejerciciosDeSubgrupo, sustitutosDe, variantesDe, baseDe, progresionesDe,
  nombreCompleto, buscarEjercicios, filtrarEjercicios, recuentos, auditarCatalogo, NO_EN_FIT2,
} from '../src/lib/ejercicios.js';
import { GRUPOS_MUSCULARES, TODOS_LOS_SUBGRUPOS } from '../src/lib/fitness.js';

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

const LIB = leer('src/lib/ejercicios.js');
const DATOS = leer('src/lib/catalogoEjercicios.js');

/* ⚠️ La lección de siempre (van veintitrés): un barrido que mira si el código
   HACE algo tiene que quitar los comentarios **y las cadenas**. Este archivo y
   `ejercicios.js` nombran `app_data`, `localStorage` y «ejerciciosDePecho»
   justamente para prometer que no están. */
const sinComentarios = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const sinCadenas = (src) => src
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');
const LIB_CODIGO = sinCadenas(sinComentarios(LIB));

console.log('\n── 1. Los catálogos de apoyo (apartados 2, 3, 4, 7 y 9) ──');
ok(ENTORNOS.length === 3 && ENTORNOS.map((e) => e.id).join(',') === 'gym,calistenia,casa',
  'Los tres entornos del apartado 2: gym, calistenia y casa');
ok(EQUIPAMIENTO.length >= 12, `El equipamiento estructurado del apartado 2 (${EQUIPAMIENTO.length})`);
ok(EQUIPAMIENTO.every((e) => typeof e.casero === 'boolean'),
  '…y cada uno dice si se puede tener en casa: eso es lo que hará posible adaptar rutinas');
ok(DIFICULTADES.length === 4 && DIFICULTADES.map((d) => d.id).join(',') === 'principiante,intermedio,avanzado,experto',
  'Las cuatro dificultades del apartado 3, en orden');
ok(DIFICULTADES.every((d, i) => d.orden === i + 1), '…y con su orden, para poder comparar dos ejercicios');
ok(TIPOS_EJERCICIO.length >= 8, `Los tipos funcionales del apartado 4 (${TIPOS_EJERCICIO.length})`);
ok(AGARRES.length === 8, 'Los ocho agarres del apartado 9');
ok(PAPELES.length === 3 && PAPELES.every((p) => typeof p.peso === 'number'),
  'Los tres papeles del apartado 5, con su peso para el cálculo de rangos');
ok(MEDIDAS.map((x) => x.id).sort().join(',') === 'distancia,peso,reps,tiempo',
  '🚨 Las cuatro medidas del apartado 14: NO todo es series por repeticiones');
ok(entorno('gym') && !entorno('inventado'), 'Los buscadores encuentran lo que hay y devuelven null con lo que no');
ok(equipo('anillas') && dificultad('experto') && tipoEjercicio('explosivo') && agarre('supino')
  && papel('principal') && medida('tiempo'), 'Y los siete funcionan');

console.log('\n── 2. Los ids son estables y no salen de un índice (apartado 21) ──');
ok(ranura('Press de banca') === 'press-de-banca', 'La ranura quita mayúsculas y espacios');
ok(ranura('Dominadas pronas · Agarre prono') === 'dominadas-pronas-agarre-prono', 'Y los símbolos');
ok(ranura('Flexión en pino') === 'flexion-en-pino', 'Y los acentos');
ok(ranura('  ') === '', 'Y con nada devuelve nada');
ok(CATALOGO_EJERCICIOS.every((e) => /^[a-z0-9-]+$/.test(e.id)),
  'Todos los ids del catálogo son ranuras, no números');
ok(CATALOGO_EJERCICIOS.every((e) => !/^\d+$/.test(e.id)),
  '🚨 Y ninguno es un índice de array, que es lo que el apartado 21 prohíbe');

console.log('\n── 3. El modelo se AMPLÍA, no se sustituye (apartado 1) ──');
const viejo = { id: 'x', nombre: 'Antiguo', variante: 'V', entorno: 'gym', equipamiento: ['barra'], musculos: [{ subgrupoId: 'biceps', porcentaje: 100 }] };
const migrado = normalizarEjercicioCompleto(viejo);
ok(migrado.nombre === 'Antiguo' && migrado.variante === 'V', 'Los campos de la F1 se conservan');
ok(migrado.entornos.join(',') === 'gym',
  '🚨 El `entorno` en singular de la F1 se ABSORBE en `entornos`, no queda una segunda fuente de verdad');
ok(!Object.keys(migrado).includes('entorno'), '…y el campo viejo desaparece del objeto normalizado');
ok(migrado.musculos[0].papel === 'secundario',
  'A una implicación sin papel se le pone el intermedio, no se descarta');
ok(migrado.medidas.join(',') === 'reps', 'Y sin medidas declaradas se asume repeticiones');
ok(normalizarEjercicioCompleto({ nombre: 'Sin id' }) === null, 'Lo que no tiene id se descarta');
ok(crearEjercicioCompleto({ nombre: 'Curl nuevo' }).id === 'curl-nuevo',
  'Un ejercicio creado sin id toma la ranura de su nombre');
ok(crearEjercicioCompleto({ dificultad: 'inventada' }).dificultad === 'principiante',
  'Una dificultad que no existe cae en la primera');
ok(crearEjercicioCompleto({ agarre: 'inventado' }).agarre === null,
  '⚠️ Y un agarre que no existe es null: "no todos los ejercicios necesitan agarre" (apartado 9)');
ok(crearEjercicioCompleto({ equipamiento: ['barra', 'inventado'] }).equipamiento.join(',') === 'barra',
  'El equipamiento que no está en el catálogo se descarta');
ok(normalizarImplicacionCompleta([{ subgrupoId: 'inventado', porcentaje: 50 }]).length === 0,
  'Y un subgrupo que no existe también: sería un huérfano que no puede dibujar nadie');
ok(crearEjercicioCompleto({ explosivo: 'si' }).explosivo === false,
  '`explosivo` solo es true si es true de verdad');

console.log('\n── 4. Tutorial, instrucciones y recursos (apartados 10, 11 y 12) ──');
const t = crearTutorial();
ok(t.video === null && t.animacion === null, '🚨 El tutorial nace vacío: no se inventan vídeos (apartado 22)');
const ins = crearInstrucciones({ errores: ['a', '', 'b'], consejos: [] });
ok(ins.errores.length === 2 && ins.consejos.length === 0, 'Las instrucciones limpian lo vacío');
ok(Object.keys(ins).join(',') === 'preparacion,ejecucion,respiracion,errores,consejos',
  'Y traen los cinco campos del apartado 12');
const rec = crearRecursos();
ok(rec.thumbnail === null && rec.ilustracion === null && rec.anatomia === null,
  'Los recursos visuales nacen a null, como pide el apartado 10');

console.log('\n── 5. El catálogo inicial (apartados 18 y 19) ──');
const aud = auditarCatalogo();
ok(aud.total >= 80, `🚨 Un catálogo de verdad, no diez de prueba: ${aud.total} ejercicios (el apartado 19 pide 80-120)`);
ok(aud.total <= 120, '…y sin pasarse: "calidad > cantidad"');
ok(aud.repetidos.length === 0, `🚨 Ni un id repetido (apartado 29) — ${aud.repetidos.join(', ') || 'ninguno'}`);
ok(aud.sumaMal.length === 0,
  `🚨 Los porcentajes de CADA ejercicio suman 100 (apartados 5 y 29) — ${JSON.stringify(aud.sumaMal)}`);
ok(aud.colgados.length === 0,
  `🚨 Ni una referencia colgada en sustitutos, progresiones, variantes o base — ${JSON.stringify(aud.colgados)}`);
ok(aud.sinEntorno.length === 0, `Todos declaran dónde se hacen — ${aud.sinEntorno.join(', ') || 'ninguno falta'}`);
ok(aud.sinMusculos.length === 0, 'Todos declaran qué trabajan');
ok(aud.sinPrincipal.length === 0,
  `Y todos tienen un músculo principal — ${aud.sinPrincipal.join(', ') || 'ninguno falta'}`);
ok(aud.conEnlace.length === 0,
  `🚨 Ni un enlace inventado en todo el catálogo (apartado 22) — ${aud.conEnlace.join(', ') || 'ninguno'}`);
ok(aud.subgruposHuerfanos.length === 0,
  `🚨 Los ${TODOS_LOS_SUBGRUPOS.length} subgrupos de la F1 tienen al menos un ejercicio — ${aud.subgruposHuerfanos.join(', ') || 'ninguno se queda fuera'}`);
ok(aud.ok, '🏁 La auditoría del catálogo entera, en verde');

console.log('\n── 6. La cobertura que pide el apartado 18 ──');
for (const g of GRUPOS_MUSCULARES) {
  ok(ejerciciosDeGrupo(g.id).length >= 3,
    `${g.nombre}: ${ejerciciosDeGrupo(g.id).length} ejercicios`);
}
for (const e of ENTORNOS) {
  const n = CATALOGO_EJERCICIOS.filter((x) => x.entornos.includes(e.id)).length;
  ok(n >= 15, `${e.nombre}: ${n} ejercicios`);
}
const conBarra = CATALOGO_EJERCICIOS.filter((e) => e.equipamiento.includes('barra')).length;
const conMancuernas = CATALOGO_EJERCICIOS.filter((e) => e.equipamiento.includes('mancuernas')).length;
const conMaquina = CATALOGO_EJERCICIOS.filter((e) => e.equipamiento.includes('maquina')).length;
const conPolea = CATALOGO_EJERCICIOS.filter((e) => e.equipamiento.includes('polea')).length;
const sinNada = CATALOGO_EJERCICIOS.filter((e) => e.equipamiento.includes('ninguno') || e.equipamiento.includes('suelo')).length;
ok(conBarra >= 5 && conMancuernas >= 5 && conMaquina >= 3 && conPolea >= 3 && sinNada >= 8,
  `Barra ${conBarra}, mancuernas ${conMancuernas}, máquina ${conMaquina}, polea ${conPolea}, sin material ${sinNada}`);
for (const habilidad of ['muscle-up', 'l-sit', 'full-planche', 'full-front-lever', 'human-flag', 'pino-libre', 'back-lever']) {
  ok(!!ejercicioPorId(habilidad), `La habilidad «${habilidad}» está en el catálogo (apartado 18)`);
}
ok(CATALOGO_EJERCICIOS.filter((e) => e.tipos.includes('isometrico')).length >= 6,
  '🚨 Hay isométricos de verdad: el apartado 14 exige que el modelo NO sea solo repeticiones');
ok(CATALOGO_EJERCICIOS.filter((e) => e.explosivo).length >= 4,
  'Y explosivos marcados como tales (apartado 15)');
ok(CATALOGO_EJERCICIOS.filter((e) => e.medidas.includes('tiempo')).length >= 8,
  'Y los que se miden en segundos lo declaran');

console.log('\n── 7. Las siete consultas del apartado 17 ──');
const banca = ejercicioPorId('press-banca-barra');
ok(!!banca, 'Por ejercicio: se encuentra por su id');
ok(musculoPrincipal(banca).subgrupoId === 'pectoral-medio', 'Qué músculos trabaja: el principal es el pecho');
ok(musculosDe(banca).every((x) => x.nombre && x.grupo), '…con su nombre y su grupo ya resueltos');
ok(ejerciciosDeSubgrupo('biceps').length >= 5, 'Por músculo: qué ejercicios trabajan el bíceps');
const casa = filtrarEjercicios(CATALOGO_EJERCICIOS, { entornos: ['casa'] });
ok(casa.length >= 15 && casa.every((e) => e.entornos.includes('casa')), 'Por entorno: qué puedo hacer en casa');
const anillas = filtrarEjercicios(CATALOGO_EJERCICIOS, { equipamiento: ['anillas'] });
ok(anillas.length >= 3 && anillas.every((e) => e.equipamiento.includes('anillas')), 'Por equipamiento: qué puedo hacer con anillas');
const avanzados = filtrarEjercicios(CATALOGO_EJERCICIOS, { dificultad: 'avanzado' });
ok(avanzados.length >= 5 && avanzados.every((e) => e.dificultad === 'avanzado'), 'Por dificultad');
const fuerza = filtrarEjercicios(CATALOGO_EJERCICIOS, { tipos: ['fuerza'] });
ok(fuerza.length >= 5 && fuerza.every((e) => e.tipos.includes('fuerza')), 'Por objetivo');
ok(sustitutosDe(banca).length >= 3, 'Por similitud: qué puede sustituir a esto');
ok(sustitutosDe(banca).every((e) => e.id !== banca.id), '…y nunca se propone a sí mismo');

console.log('\n── 8. Variantes, base y progresiones (apartados 8 y 13) ──');
const mancuernas = ejercicioPorId('press-banca-mancuernas');
ok(mancuernas.base === 'press-banca-barra',
  '🚨 Una variante apunta a su ejercicio BASE, no es un ejercicio suelto (apartado 8)');
ok(baseDe(mancuernas).id === 'press-banca-barra', 'Y se puede llegar de la variante al base');
ok(variantesDe(banca).some((e) => e.id === 'press-banca-mancuernas'), 'Y del base a sus variantes');
ok(variantesDe(banca).length === new Set(variantesDe(banca).map((e) => e.id)).size,
  '…sin repetir ninguna, aunque esté declarada y además apunte con `base`');
ok(nombreCompleto(mancuernas) === 'Press de banca · Con mancuernas',
  'El nombre completo del apartado 8: el base y la variante');
ok(nombreCompleto(ejercicioPorId('burpee')) === 'Burpee', 'Y sin variante es solo el nombre');
const mu = ejercicioPorId('muscle-up');
ok(progresionesDe(mu).length >= 3, 'El muscle-up trae sus progresiones (apartado 13)');
ok(progresionesDe(mu).map((e) => e.id).includes('dominada-explosiva'), '…y una de ellas es la dominada explosiva');
ok(progresionesDe(ejercicioPorId('full-planche')).length >= 3, 'La planche trae las suyas');
ok(progresionesDe(ejercicioPorId('full-front-lever')).length >= 4, 'Y el front lever las suyas');
ok(progresionesDe(banca).length === 0, '⚠️ Y un ejercicio sin progresiones devuelve una lista vacía, no falla');

console.log('\n── 9. El buscador y los filtros (apartado 23) ──');
ok(buscarEjercicios('dominadas').length >= 4, 'Buscar «dominadas» encuentra varias');
ok(buscarEjercicios('DOMINADAS').length === buscarEjercicios('dominadas').length, 'Sin distinguir mayúsculas');
ok(buscarEjercicios('flexion').length === buscarEjercicios('flexión').length, 'Ni acentos');
ok(buscarEjercicios('pull up').some((e) => e.id === 'dominada-prona'),
  '⚠️ «pull up» encuentra las dominadas: el nombre técnico también se busca (apartado 20)');
ok(buscarEjercicios('press banca').some((e) => e.id === 'press-banca-barra'), 'Dos palabras sueltas también');
ok(buscarEjercicios('').length === CATALOGO_EJERCICIOS.length,
  '⚠️ Con el buscador vacío salen TODOS, no ninguno');
ok(buscarEjercicios('xyzinexistente').length === 0, 'Y lo que no existe no devuelve nada');
ok(filtrarEjercicios(CATALOGO_EJERCICIOS, {}).length === CATALOGO_EJERCICIOS.length,
  '🚨 Sin filtros no se filtra nada: `null` es «no filtres», nunca «ninguno»');
const pechoCasa = filtrarEjercicios(CATALOGO_EJERCICIOS, { grupo: 'pecho', entornos: ['casa'] });
ok(pechoCasa.length >= 3, `Dos filtros a la vez: pecho en casa (${pechoCasa.length})`);
ok(filtrarEjercicios(CATALOGO_EJERCICIOS, { grupo: 'inventado' }).length === 0,
  'Un grupo que no existe no devuelve todo por error');
ok(filtrarEjercicios(CATALOGO_EJERCICIOS, { explosivo: true }).every((e) => e.explosivo),
  'Y se puede filtrar por explosivo');
const r = recuentos(CATALOGO_EJERCICIOS);
ok(r.entornos.casa > 0 && r.grupos.pecho > 0 && r.dificultades.principiante > 0,
  'Los recuentos dicen cuántos hay de cada cosa, para no ofrecer filtros vacíos');

console.log('\n── 10. Lo que NO se ha duplicado ──');
ok(!/GRUPOS_MUSCULARES\s*=/.test(LIB_CODIGO),
  '🚨 Los grupos musculares son los de la F1: no se redefinen aquí (apartado 6)');
ok(/from '\.\/fitness'/.test(LIB), '…se importan de `fitness.js`');
ok(!/ejerciciosDePecho|ejerciciosPorGrupo\s*=\s*\{/.test(LIB_CODIGO),
  '🚨 Ni una lista guardada de grupo → ejercicios: se deriva de las implicaciones');
ok(!/localStorage/.test(LIB_CODIGO), 'Esta librería no toca localStorage');
ok(!/supabase|loadData|saveData/.test(LIB_CODIGO),
  '🚨 Ni Supabase: el catálogo son datos de la aplicación, no del usuario');
ok(!/import .* from '\.\/ejercicios'/.test(DATOS),
  '⚠️ Y el archivo de datos no importa nada de la librería: sin ciclo entre los dos');
const propio = crearEjercicioCompleto({ id: 'mi-invento', nombre: 'Mi invento', musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }] });
ok(todosLosEjercicios([propio]).length === CATALOGO_EJERCICIOS.length + 1,
  'Lo que se cree Josué se suma al catálogo, no lo sustituye');
ok(ejercicioPorId('mi-invento', [propio])?.nombre === 'Mi invento',
  '…y se encuentra por id igual que uno del catálogo');
ok(ejercicioPorId('mi-invento') === null, 'Sin pasarle los suyos, solo se mira el catálogo');
ok(ejerciciosDeSubgrupo('biceps', [propio]).some((e) => e.id === 'mi-invento'),
  'Y entra en las consultas como uno más');

console.log('\n── 11. Lo que NO se construye (apartado 27) ──');
ok(NO_EN_FIT2.length >= 8, `Lo que el apartado 27 prohíbe, declarado (${NO_EN_FIT2.length})`);
ok(NO_EN_FIT2.every((n) => n.que && n.porque), 'Cada cosa con su motivo');
ok(!/entrenamientoEnVivo|calcularRango|crearRutina|crearPlan\b/.test(LIB_CODIGO),
  '🚨 Y no hay nada de rutinas, rangos ni entrenamiento en vivo en esta librería');

console.log('\n── 12. La auditoría puede fallar (EH F42) ──');
const roto = auditarCatalogo([
  { id: 'a', musculos: [{ subgrupoId: 'biceps', porcentaje: 50, papel: 'principal' }], entornos: ['casa'], sustitutos: ['no-existe'], progresiones: [], variantes: [] },
  { id: 'a', musculos: [], entornos: [], sustitutos: [], progresiones: [], variantes: [] },
]);
ok(!roto.ok, '⚠️ Con un catálogo malo se pone roja: una auditoría que no puede fallar no sirve');
ok(roto.repetidos.includes('a'), '…y dice cuál está repetido');
ok(roto.sumaMal.length === 2, '…cuáles no suman 100');
ok(roto.colgados.length === 1, '…y qué referencia apunta a la nada');
const conEnlace = auditarCatalogo([{ id: 'b', entornos: ['casa'], musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }], sustitutos: [], progresiones: [], variantes: [], tutorial: { notas: 'mira en https://ejemplo.test' } }]);
ok(conEnlace.conEnlace.includes('b'), '…y caza un enlace escondido dentro de una nota');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
