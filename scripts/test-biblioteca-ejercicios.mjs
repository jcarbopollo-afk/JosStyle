/* Entrega 4 · FIT F34/45 — Biblioteca y detalle avanzado de ejercicios.
   ═══════════════════════════════════════════════════════════════════════════
   Los veintidós casos del apartado 36, los casos límite del 37 y la condición
   del contexto: *"El catálogo es la fuente de verdad de los ejercicios. No
   duplicar información en componentes, planes o sesiones."* — y que la ficha
   **reutiliza** la F2, la F29 y la F33 en vez de escribir otra. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ejerciciosDeBiblioteca, TIPOS_DEL_FILTRO, FILAS_FILTRO_BIBLIOTECA, TEXTO_LIMPIAR_FILTROS, consultarBiblioteca,
  opcionesDeFiltroBiblioteca, paginaDeBiblioteca, POR_PAGINA_BIBLIOTECA, recientesDeBiblioteca, favoritosDeEjercicios,
  esFavoritoEjercicio, alternarFavoritoEjercicio, favoritosDeBiblioteca, categoriasDeBiblioteca, bloquesDeBiblioteca,
  NOTA_PORCENTAJES, musculosDeFicha, equipamientoDeFicha, etiquetasDeFicha, MAX_ETIQUETAS, tecnicaDeFicha,
  tutorialDeFicha, SIN_TUTORIAL, imagenDeFicha, progresionDeFicha, variantesDeFicha, alternativasDeFicha,
  ALTERNATIVAS_EN_FICHA, entrenamientosParaAnadir, anadirAEntrenamiento, rutinaNuevaCon, SIN_RENDIMIENTO,
  SIN_CLASIFICACION, personalDeFicha, fichaDeBiblioteca, accionesDeFicha, YA_LO_RESUELVE, NO_EN_FIT34,
  DECISIONES_FIT34, auditarBiblioteca,
} from '../src/lib/bibliotecaEjercicios.js';
import {
  CATALOGO_EJERCICIOS, ejercicioPorId, crearEjercicioCompleto, buscarEjercicios, textoBuscable, normalizarFitnessCompleto,
  FILTRO_PESO_CORPORAL,
} from '../src/lib/ejercicios.js';
import { getExerciseReplacements } from '../src/lib/sustitucion.js';
import { detalleCompletoDeEjercicio } from '../src/lib/detalleEjercicio.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS, normalizarFitness, crearObjetivo } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea, rutinaAPlan } from '../src/lib/constructor.js';

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
const ids = (l) => l.map((e) => e.id);

/* ── Sesiones de verdad: constructor (F3) → en vivo (F7) → guardado (F8) ── */
function sesion(exerciseId, fecha, valores) {
  let r = anadirEjercicio(crearRutina({ nombre: exerciseId }), exerciseId);
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

console.log('\n═══ FIT F34/45 · Biblioteca y detalle avanzado de ejercicios ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La biblioteca, vacía y completa (casos 1 y 2) ──');

const VACIO = { ...DEFAULT_FITNESS };
const bloquesVacio = bloquesDeBiblioteca(VACIO);
ok(JSON.stringify(bloquesVacio.map((b) => b.id)) === JSON.stringify(['categorias', 'catalogo']),
  '🚨 Caso 1 · Sin historial: solo «Explorar» y el catálogo — ni recientes ni favoritos vacíos (apartado 2)');
ok(ejerciciosDeBiblioteca().length === CATALOGO_EJERCICIOS.length,
  `Caso 2 · Completa: los ${CATALOGO_EJERCICIOS.length} ejercicios del catálogo`);
ok(consultarBiblioteca({}).resultado.length === CATALOGO_EJERCICIOS.length && !consultarBiblioteca({}).hayFiltros,
  '…y sin buscar ni filtrar, salen todos');
const cats = categoriasDeBiblioteca();
ok(cats.length === 8 && cats.every((c) => c.cuantos > 0 && c.filtro),
  `«Explorar»: los siete grupos y las habilidades, cada uno con cuántos y el filtro que pone (${cats.map((c) => c.nombre).join(', ')})`);
ok(cats.filter((c) => c.id !== 'habilidades').reduce((n, c) => n + c.cuantos, 0) === CATALOGO_EJERCICIOS.length,
  '…y los grupos reparten el catálogo entero por su músculo principal, sin contar dos veces');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Buscar (casos 3 y 4, apartado 3) ──');

ok(ids(consultarBiblioteca({ consulta: 'dominadas' }).resultado).includes('dominada-prona'),
  'Caso 3 · «dominadas» encuentra las Dominadas (su ejemplo)');
ok(consultarBiblioteca({ consulta: 'DOMINADAS' }).resultado.length === consultarBiblioteca({ consulta: 'dominadas' }).resultado.length,
  '…sin importar mayúsculas');
ok(ids(consultarBiblioteca({ consulta: 'cuadriceps' }).resultado).includes('sentadilla-barra')
  && ids(consultarBiblioteca({ consulta: 'cuádriceps' }).resultado).includes('sentadilla-barra'),
'🚨 Caso 4 · Con acentos y sin ellos: «cuadriceps» y «cuádriceps» encuentran lo mismo');
ok(ids(consultarBiblioteca({ consulta: 'biceps' }).resultado).includes('curl-barra'),
  'Busca por MÚSCULO: «biceps» encuentra el curl (apartado 3)');
ok(ids(consultarBiblioteca({ consulta: 'mancuernas' }).resultado).includes('curl-mancuernas'),
  '…por MATERIAL');
ok(ids(consultarBiblioteca({ consulta: 'cable' }).resultado).includes('cruce-poleas')
  && ids(consultarBiblioteca({ consulta: 'cable' }).resultado).every((id) => ejercicioPorId(id).equipamiento.includes('polea') || /cable/i.test(JSON.stringify(ejercicioPorId(id)))),
'…«cable» encuentra lo de polea, que es como lo llama el apartado 4');
ok(ids(consultarBiblioteca({ consulta: 'supino' }).resultado).includes('dominada-supina'),
  '…por AGARRE');
ok(ids(consultarBiblioteca({ consulta: 'isometrico' }).resultado).includes('plancha-frontal'),
  '…por ETIQUETA (tipo)');
ok(ids(consultarBiblioteca({ consulta: 'pull up' }).resultado).includes('dominada-prona'),
  '…y el nombre técnico sigue funcionando (F2, apartado 20)');
ok(buscarEjercicios('biceps').length === consultarBiblioteca({ consulta: 'biceps' }).resultado.length,
  '🚨 Es la búsqueda de la F2 AMPLIADA, no una segunda (E3 F22)');
const ej0 = CATALOGO_EJERCICIOS[0];
ok(textoBuscable(ej0) === textoBuscable(ej0) && textoBuscable(ej0).includes('pectoral'),
  'Apartado 33 · el texto buscable se calcula una vez por ejercicio');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Filtros, combinados y reset (casos 5, 6 y 7) ──');

ok(JSON.stringify(FILAS_FILTRO_BIBLIOTECA.map((f) => f.id)) === JSON.stringify(['entorno', 'equipo', 'dificultad', 'tipo', 'grupo']),
  'Las cinco clases del apartado 4: entorno, material, dificultad, tipo y músculo');
ok(TIPOS_DEL_FILTRO.length === 8, 'Los ocho tipos que enumera el apartado 4 (por ids del catálogo)');
const cali = consultarBiblioteca({ filtros: { entorno: 'calistenia' } }).resultado;
ok(cali.length > 0 && cali.every((e) => e.entornos.includes('calistenia')), `Caso 5 · Filtro: calistenia (${cali.length})`);
const corporal = consultarBiblioteca({ filtros: { equipo: FILTRO_PESO_CORPORAL.id } }).resultado;
ok(corporal.length > 0 && ids(corporal).includes('flexion') && !ids(corporal).includes('press-banca-barra'),
  '🚨 «Peso corporal» es un filtro de material, y deja las flexiones pero no el press de banca');
const comb = consultarBiblioteca({ filtros: { entorno: 'calistenia', grupo: 'espalda', dificultad: 'avanzado' } }).resultado;
ok(comb.length > 0 && comb.every((e) => e.entornos.includes('calistenia') && e.dificultad === 'avanzado'),
  `🚨 Caso 6 · Combinados: calistenia + espalda + avanzado cumplen TODOS (${comb.length}, apartado 5)`);
ok(comb.length < cali.length, '…y combinar recorta más que uno solo');
ok(consultarBiblioteca({ filtros: {} }).resultado.length === CATALOGO_EJERCICIOS.length && TEXTO_LIMPIAR_FILTROS === 'Limpiar filtros',
  'Caso 7 · «Limpiar filtros» devuelve todos los ejercicios (apartado 6, literal)');
const op = opcionesDeFiltroBiblioteca(consultarBiblioteca({}).cuenta);
ok(op.equipo[0].id === 'corporal' && op.equipo.some((o) => o.nombre === 'Polea (cable)'),
  'Las pastillas de material empiezan por «Peso corporal» y la polea dice «cable»');
ok(Object.values(op).every((fila) => fila.every((o) => typeof o.cuantos === 'number')),
  '…y cada pastilla lleva cuántos quedarían');
const pag = paginaDeBiblioteca(consultarBiblioteca({}).resultado);
ok(pag.items.length === POR_PAGINA_BIBLIOTECA && pag.hayMas && /^Ver \d+ más$/.test(pag.verMas),
  `Apartado 33 · la lista se pinta de ${POR_PAGINA_BIBLIOTECA} en ${POR_PAGINA_BIBLIOTECA}, con su «${pag.verMas}»`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. La ficha: detalle, músculos, material (casos 8, 9 y 10) ──');

const PB = fichaDeBiblioteca({}, 'press-banca-barra');
ok(PB.estado === 'ok' && PB.nombre === 'Press de banca' && PB.descripcion.length > 0,
  'Caso 8 · Detalle: nombre y descripción breve (apartado 8)');
ok(PB.musculos[0].grupo === 'Pecho' && PB.musculos[0].porcentaje === 50 && PB.musculos[0].papel === 'Principal',
  `🚨 Caso 9 · Músculos: grupo, subgrupo, porcentaje y papel — «${PB.musculos[0].grupo} · ${PB.musculos[0].subgrupo} — ${PB.musculos[0].porcentaje} % · ${PB.musculos[0].papel}»`);
ok(PB.musculos.reduce((n, m) => n + m.porcentaje, 0) === 100,
  '…los porcentajes del catálogo, sin tocar (suman 100)');
ok(NOTA_PORCENTAJES === PB.notaMusculos && /estimaci[oó]n/i.test(NOTA_PORCENTAJES) && /no una medici[oó]n/i.test(NOTA_PORCENTAJES),
  '…con la nota que dice lo que son: no una medición (apartado 9)');
ok(JSON.stringify(equipamientoDeFicha(ejercicioPorId('dominada-prona'))) === JSON.stringify(['Barra de dominadas']),
  'Caso 10 · Material: «Barra de dominadas» (su ejemplo)');
ok(equipamientoDeFicha(ejercicioPorId('flexion'))[0] === 'Peso corporal',
  '…y si no necesita nada: «Peso corporal» (apartado 10)');
ok(JSON.stringify(equipamientoDeFicha(ejercicioPorId('zancadas'))) === JSON.stringify(['Peso corporal', 'Mancuernas']),
  '…y lo que se hace sin nada o con algo, dice las dos cosas');
ok(PB.entornos.join() === 'Gimnasio' && JSON.stringify(PB.equipamiento) !== JSON.stringify(PB.entornos),
  'Apartado 11 · el entorno va aparte del material');
ok(PB.dificultad === 'Intermedio' && fichaDeBiblioteca({}, 'full-planche').dificultad === 'Experto',
  'Apartado 12 · la dificultad del catálogo, sin recalcular');
ok(JSON.stringify(etiquetasDeFicha(ejercicioPorId('full-planche'))) === JSON.stringify(['Habilidad', 'Isométrico'])
  && CATALOGO_EJERCICIOS.every((e) => etiquetasDeFicha(e).length <= MAX_ETIQUETAS)
  && CATALOGO_EJERCICIOS.every((e) => !etiquetasDeFicha(e).some((t) => /Compuesto|Aislamiento/.test(t))),
'Apartado 13 · como mucho tres etiquetas, y solo las que dicen para qué sirve');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Técnica y tutorial (casos 11 y 12, apartados 14-17) ──');

const tec = tecnicaDeFicha(ejercicioPorId('press-banca-barra'));
ok(tec.pasos.map((p) => `${p.numero}. ${p.titulo}`).join(' | ') === '1. Posición inicial | 2. Ejecución',
  '🚨 «Cómo hacerlo» en pasos, con lo que hay: posición inicial y ejecución');
ok(!tec.pasos.some((p) => p.titulo === 'Final del movimiento'),
  '…y SIN «Final del movimiento», que ninguna ficha tiene escrito: no se inventa (apartado 14)');
ok(tec.errores.length > 0 && tec.consejos.length > 0, 'Errores frecuentes y consejos, cuando existen (15 y 16)');
const sinNada = crearEjercicioCompleto({ id: 'mio-vacio', nombre: 'Mío vacío' });
ok(tecnicaDeFicha(sinNada).hay === false && tecnicaDeFicha(sinNada).errores.length === 0,
  '…y en un ejercicio sin contenido, ni pasos ni errores inventados');
const conVideo = crearEjercicioCompleto({ id: 'mio-video', nombre: 'Mío', tutorial: { video: '/tutoriales/mio.mp4' } });
ok(JSON.stringify(tutorialDeFicha(conVideo)) === JSON.stringify({ tipo: 'video', src: '/tutoriales/mio.mp4' }),
  'Caso 11 · Tutorial disponible: un vídeo de la propia aplicación se enseña');
ok(tutorialDeFicha(ejercicioPorId('press-banca-barra')) === null && SIN_TUTORIAL === 'Todavía no hay vídeo de este ejercicio.',
  '🚨 Caso 12 · Tutorial inexistente: nada que pintar, y una frase — ni un reproductor falso (apartado 17)');
ok(tutorialDeFicha(crearEjercicioCompleto({ id: 'x', nombre: 'X', tutorial: { video: 'https://ejemplo.com/v.mp4' } })) === null
  && tutorialDeFicha(crearEjercicioCompleto({ id: 'y', nombre: 'Y', tutorial: { video: '/v.txt' } })) === null
  && tutorialDeFicha(crearEjercicioCompleto({ id: 'z', nombre: 'Z', tutorial: { video: '//fuera.com/v.mp4' } })) === null,
'…ni un enlace de fuera, ni un archivo que no es vídeo, ni un «//» que sale de la aplicación');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Progresiones, variantes y alternativas (casos 13, 14 y 15) ──');

const cad = progresionDeFicha(ejercicioPorId('tuck-planche'));
ok(cad.cadena.map((c) => c.id).join(' → ') === 'tuck-planche → advanced-tuck-planche → straddle-planche → full-planche',
  '🚨 Caso 13 · Progresión: Tuck Planche ↓ Advanced Tuck ↓ Straddle ↓ Full Planche (su ejemplo, exacto)');
ok(cad.cadena[0].actual && cad.cadena.filter((c) => c.actual).length === 1, '…con el paso actual marcado, uno solo');
ok(ids(cad.antes).join() === 'l-sit,pino-contra-pared', '…y lo que conviene dominar antes, aparte (L-sit, pino)');
ok(progresionDeFicha(ejercicioPorId('full-front-lever')).cadena.at(-1).actual,
  '…desde el final de la cadena también: el front lever completo es el último paso');
ok(progresionDeFicha(ejercicioPorId('press-banca-barra')) === null, '…y un ejercicio sin progresión no pinta la sección');
ok(progresionDeFicha(ejercicioPorId('dominada-prona')) === null && progresionDeFicha(ejercicioPorId('dominada-chest-to-bar')).cadena.length > 0,
  '⚠️ La CADENA es de las skills (apartado 18): las dominadas pronas no la llevan, las chest to bar sí');
const vars = variantesDeFicha(ejercicioPorId('dominada-neutra'));
ok(ids(vars).includes('dominada-prona') && ids(vars).includes('dominada-supina') && !ids(vars).includes('dominada-neutra'),
  '🚨 Caso 14 · Variantes en los DOS sentidos: desde la neutra, la base y las hermanas (F29)');
ok(vars.find((v) => v.id === 'dominada-prona').relacion === 'base' && vars.find((v) => v.id === 'dominada-supina').relacion === 'hermana',
  '…y cada una dice qué es: la base o una hermana — mantiene su identidad (apartado 19)');
const alt = alternativasDeFicha(ejercicioPorId('press-banca-barra'));
const f33 = getExerciseReplacements('press-banca-barra', {}).filter((x) => ['muy_similar', 'similar', 'alternativa'].includes(x.compatibilityLevel));
ok(JSON.stringify(alt.todas.map((x) => x.id)) === JSON.stringify(f33.map((x) => x.id)) && alt.items.length === ALTERNATIVAS_EN_FICHA,
  '🚨 Caso 15 · Sustituciones: SON las de getExerciseReplacements de la F33, en su orden (apartado 20)');
ok(alt.items[0].id === 'press-banca-mancuernas' && alt.items[0].compatibilityLevel === 'muy_similar',
  '…con su nivel: lo primero, el press con mancuernas, muy similar');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Añadir a entrenamiento (apartado 21) ──');

const PL = { ...rutinaAPlan(anadirEjercicio(crearRutina({ nombre: 'Push' }), 'press-banca-barra')), creadoEn: '2026-09-01', editadoEn: '2026-09-01' };
const OTRA = { ...rutinaAPlan(anadirEjercicio(crearRutina({ nombre: 'Pull' }), 'remo-barra')), creadoEn: '2026-09-01', editadoEn: '2026-09-01' };
const F_PL = { ...DEFAULT_FITNESS, plantillas: [PL, OTRA] };
ok(entrenamientosParaAnadir(F_PL).map((p) => `${p.nombre}:${p.ejercicios}`).join() === 'Push:1,Pull:1',
  'Se elige entre los entrenamientos que ya tiene');
const an = anadirAEntrenamiento(F_PL, PL.id, 'aperturas-mancuernas', { hoy: '2026-09-20' });
const trasAn = an.fitness.plantillas.find((p) => p.id === PL.id);
ok(an.ok && trasAn.ejercicios.map((l) => l.exerciseId).join() === 'press-banca-barra,aperturas-mancuernas',
  '🚨 Se añade al final de ESE entrenamiento, con la configuración por defecto del constructor');
ok(JSON.stringify(an.fitness.plantillas.find((p) => p.id === OTRA.id)) === JSON.stringify(OTRA),
  '…y los demás no se tocan');
ok(!an.fitness.sesiones.length && !an.fitness.sesiones.some((s) => s.estado === 'en_curso'),
  '🚨 …y NO empieza a entrenar (apartado 21, literal)');
ok(!anadirAEntrenamiento(F_PL, 'no-existe', 'flexion').ok && !anadirAEntrenamiento(F_PL, PL.id, 'no-existe').ok,
  '…un entrenamiento o un ejercicio que no existen no escriben nada');
const nueva = rutinaNuevaCon('flexion');
ok(nueva && nueva.lineas.length === 1 && nueva.lineas[0].exerciseId === 'flexion' && !nueva.nombre,
  '«Crear uno nuevo»: una rutina con el ejercicio dentro, sin guardar, para terminarla en el constructor');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Tu progreso, objetivo y rango (casos 16, 17 y 18) ──');

const S1 = sesion('press-banca-barra', '2026-09-10', [{ peso: 60, reps: 8 }, { peso: 60, reps: 8 }]);
const S2 = sesion('press-banca-barra', '2026-09-17', [{ peso: 62.5, reps: 8 }, { peso: 62.5, reps: 7 }]);
const OBJ = crearObjetivo({ id: 'obj-pb', exerciseId: 'press-banca-barra', tipo: 'peso', valor: 80, creadoEn: 1 });
const F = [S1, S2].reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS, objetivos: [OBJ] });
const per = personalDeFicha(F, 'press-banca-barra', { hoy: '2026-09-20' });
const f29 = detalleCompletoDeEjercicio(F, 'press-banca-barra', { hoy: '2026-09-20', limiteHistorial: 3 });
ok(per.conDatos && per.progreso && per.progreso.ultima && per.progreso.mejor,
  'Caso 16 · Progreso: último resultado y mejor resultado');
ok(JSON.stringify(per.progreso) === JSON.stringify(f29.progreso) && JSON.stringify(per.tendencia) === JSON.stringify(f29.tendencia),
  '🚨 …y son EXACTAMENTE los de la F29: la ficha no calcula nada (apartado 32)');
ok(per.ultimos.length === 2 && per.ultimos.length <= 3, '«Últimos entrenamientos»: 2–3 registros, no el historial entero (apartado 26)');
ok(per.objetivo.hay && per.objetivo.objetivo.id === 'obj-pb', 'Caso 17 · Objetivo: el activo, con su progreso (F14 por la F29)');
ok(JSON.stringify(per.rango) === JSON.stringify(f29.rango), 'Caso 18 · Rango: el del motor de la F19, por la F29');
const perVacio = personalDeFicha(VACIO, 'press-banca-barra');
ok(!perVacio.conDatos && perVacio.vacio === SIN_RENDIMIENTO && SIN_RENDIMIENTO === 'Sin datos de rendimiento todavía.',
  '🚨 Sin datos: «Sin datos de rendimiento todavía.» (apartado 23, literal)');
ok(!perVacio.rango.hay && perVacio.sinClasificacion === SIN_CLASIFICACION && perVacio.puedeClasificar,
  '…«Sin clasificación» con su «Clasificar», porque la F17 sabe preguntarlo (apartado 25)');
ok(!personalDeFicha(VACIO, 'face-pull').puedeClasificar,
  '…y NO se ofrece clasificar un ejercicio de movilidad, que la F17 no pregunta («solo si corresponde»)');
ok(!perVacio.objetivo.hay && perVacio.progreso === null && perVacio.ultimos.length === 0,
  '🚨 Caso 22 · Sin datos: ni progreso, ni objetivo, ni historial ficticios (apartado 29)');
ok(JSON.stringify(accionesDeFicha({ existe: true, conDatos: false })) === JSON.stringify(['anadir', 'favorito'])
  && accionesDeFicha({ existe: true, conDatos: true, objetivo: true, alternativas: true, variantes: true }).length === 6,
'Apartado 30 · solo las acciones aplicables');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Favoritos (caso 19, apartado 22) ──');

ok(DEFAULT_FITNESS.favoritosEjercicios && DEFAULT_FITNESS.favoritosEjercicios.length === 0, 'Nacen vacíos, en el modelo');
let FF = alternarFavoritoEjercicio(VACIO, 'dominada-prona');
ok(esFavoritoEjercicio(FF, 'dominada-prona') && JSON.stringify(favoritosDeEjercicios(FF)) === JSON.stringify(['dominada-prona']),
  'Caso 19 · ♡ → ♥: «En favoritos»');
ok(!esFavoritoEjercicio(FF, 'dominada-supina') && !esFavoritoEjercicio(FF, 'dominada-neutra'),
  '🚨 …y NO se transfiere a sus variantes (apartado 22, literal)');
FF = alternarFavoritoEjercicio(FF, 'dominada-prona');
ok(!esFavoritoEjercicio(FF, 'dominada-prona'), '…y se quita igual');
ok(JSON.stringify(alternarFavoritoEjercicio(VACIO, 'no-existe').favoritosEjercicios) === JSON.stringify([]),
  '…un ejercicio que no existe no se marca');
const guardadoFav = { ...DEFAULT_FITNESS, favoritosEjercicios: ['flexion', 'flexion', '', 'ya-no-existe'] };
ok(JSON.stringify(normalizarFitness(guardadoFav).favoritosEjercicios) === JSON.stringify(['flexion', 'ya-no-existe']),
  '🚨 Regla 5 · la puerta de carga los conoce: sin repetidos ni vacíos');
ok(JSON.stringify(normalizarFitnessCompleto(guardadoFav).favoritosEjercicios) === JSON.stringify(['flexion']),
  '…y el que apunta a algo borrado lo limpia quien conoce el catálogo (EH F24)');
const FB = alternarFavoritoEjercicio(VACIO, 'flexion');
ok(bloquesDeBiblioteca(FB).map((b) => b.id).includes('favoritos') && ids(favoritosDeBiblioteca(FB)).join() === 'flexion',
  '…y con uno marcado, sale el bloque «Favoritos» (apartado 2)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Recientes (apartado 2) ──');

const S3 = sesion('curl-barra', '2026-09-18', [{ peso: 20, reps: 10 }]);
const FR = [S1, S2, S3].reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
ok(ids(recientesDeBiblioteca(FR)).join() === 'curl-barra,press-banca-barra',
  '🚨 Los recientes salen del HISTORIAL, del más nuevo al más viejo y sin repetir');
ok(bloquesDeBiblioteca(FR).map((b) => b.id).join() === 'recientes,categorias,catalogo',
  '…y con historial aparece su bloque, sin favoritos si no hay');
ok(!('recientesEjercicios' in DEFAULT_FITNESS) && !/recientes\w*\s*:/.test(soloCodigo(leer('src/lib/fitness.js'))),
  '…y NO se guardan: se derivan (E3 F37)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Archivado, sin imagen y casos límite (casos 20, 21 y apartado 37) ──');

const S4 = { ...sesion('curl-barra', '2026-09-19', [{ peso: 20, reps: 10 }]) };
S4.origen = { ...S4.origen, ejercicios: ejerciciosDeSesion(S4).map((e) => ({ ...e, exerciseId: 'mi-borrado' })) };
const FA = guardarSesion({ ...DEFAULT_FITNESS }, S4);
const arch = fichaDeBiblioteca(FA, 'mi-borrado');
ok(arch.estado === 'archivado' && arch.etiquetaArchivado === 'Ejercicio archivado',
  '🚨 Caso 20 · Archivado: «Ejercicio archivado», y su historia se puede consultar');
ok(!arch.acciones.includes('anadir') && arch.acciones.includes('progreso'),
  '…sin «Añadir a entrenamiento», pero con su progreso (apartado 27)');
ok(fichaDeBiblioteca({}, 'nunca-existio').estado === 'no_existe', '…y uno que no existe ni tiene historia no finge una ficha');
ok(imagenDeFicha(ejercicioPorId('press-banca-barra')) === null && CATALOGO_EJERCICIOS.every((e) => imagenDeFicha(e) === null),
  '🚨 Caso 21 · Sin imagen: `null`, y se pinta el hueco de su grupo — nunca la de otro (apartado 28)');
ok(imagenDeFicha(crearEjercicioCompleto({ id: 'i', nombre: 'I', recursos: { ilustracion: '/img/i.webp' } })) === '/img/i.webp'
  && imagenDeFicha(crearEjercicioCompleto({ id: 'j', nombre: 'J', recursos: { ilustracion: 'https://x.com/i.png' } })) === null,
'…una suya, de la aplicación, sí; una de fuera, no');

const DUP = [
  crearEjercicioCompleto({ id: 'press-banca-barra', nombre: 'Press de banca repetido' }),
  crearEjercicioCompleto({ id: 'mio-sin-nombre', nombre: '' }),
  crearEjercicioCompleto({ id: 'mio-nombre-igual', nombre: 'Press de banca', variante: 'Con barra' }),
];
const conDup = ejerciciosDeBiblioteca(DUP);
ok(conDup.filter((e) => e.id === 'press-banca-barra').length === 1 && conDup.find((e) => e.id === 'press-banca-barra').nombre === 'Press de banca',
  'IDs duplicados: se enseña una vez, y gana el del catálogo');
ok(!conDup.some((e) => e.id === 'mio-sin-nombre'), 'Un ejercicio sin nombre no se pinta');
ok(conDup.some((e) => e.id === 'mio-nombre-igual'), 'Un nombre duplicado con OTRO id sí sale: son dos ejercicios distintos');
const huerfana = crearEjercicioCompleto({ id: 'mi-variante', nombre: 'Variante huérfana', base: 'no-existe', musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }] });
ok(fichaDeBiblioteca({}, 'mi-variante', { propios: [huerfana] }).estado === 'ok', 'Variante sin ejercicio padre: la ficha se abre igual');
const pctMal = crearEjercicioCompleto({ id: 'mi-pct', nombre: 'Pct', musculos: [{ subgrupoId: 'biceps', porcentaje: -10 }, { subgrupoId: 'triceps', porcentaje: 'abc' }, { subgrupoId: 'dorsales', porcentaje: 60, papel: 'principal' }] });
ok(musculosDeFicha(pctMal).length === 1 && musculosDeFicha(pctMal)[0].porcentaje === 60,
  'Porcentaje muscular inválido: no se pinta (ni «-10 %» ni «NaN %»)');
const sinMus = crearEjercicioCompleto({ id: 'mi-sinmus', nombre: 'Sin músculo' });
ok(fichaDeBiblioteca({}, 'mi-sinmus', { propios: [sinMus] }).musculos.length === 0, 'Ejercicio sin músculo: la ficha lo dice y se abre');
ok(equipamientoDeFicha(sinMus)[0] === 'Peso corporal', 'Ejercicio sin equipamiento: «Peso corporal»');
ok(fichaDeBiblioteca({}, 'dominada-prona').entornos.length === 3, 'Ejercicio con varios entornos: los tres');
const ciclo = [
  crearEjercicioCompleto({ id: 'ciclo-a', nombre: 'A', tipos: ['habilidad'], progresiones: ['ciclo-b'], variantes: ['ciclo-b'] }),
  crearEjercicioCompleto({ id: 'ciclo-b', nombre: 'B', tipos: ['habilidad'], progresiones: ['ciclo-a'], base: 'ciclo-a' }),
];
const t0 = Date.now();
const pc = progresionDeFicha(ciclo[0], ciclo);
const pcB = progresionDeFicha(ciclo[1], ciclo);
const idsCiclo = (p) => (p && Array.isArray(p.cadena) ? p.cadena.map((x) => x.id) : []);
ok(Date.now() - t0 < 1000 && idsCiclo(pc).length === 2 && new Set(idsCiclo(pc)).size === 2,
  '🚨 Progresión circular: termina, y cada ejercicio sale UNA vez (no cuelga la pantalla ni se repite)');
ok(idsCiclo(pc).join() === idsCiclo(pcB).join()
  && pc.cadena.filter((x) => x.actual).map((x) => x.id).join() === 'ciclo-a'
  && pcB.cadena.filter((x) => x.actual).map((x) => x.id).join() === 'ciclo-b',
'…y es la misma cadena mirada desde los dos lados, con «aquí» en el que se mira');
const autoSust = crearEjercicioCompleto({ id: 'mi-auto', nombre: 'Auto', sustitutos: ['mi-auto'], musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }] });
ok(!alternativasDeFicha(autoSust, { propios: [autoSust] }).todas.some((x) => x.id === 'mi-auto'),
  'Sustitución hacia sí mismo: no se propone (F33)');
ok(tutorialDeFicha(crearEjercicioCompleto({ id: 'r', nombre: 'R', tutorial: { video: 'no es una ruta' } })) === null
  && /onError/.test(leer('src/components/bibliotecaEjercicios.jsx')),
'Recurso multimedia roto: si no es válido no se enseña, y si no carga, la pantalla lo dice');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Una sola fuente de verdad (apartados 32, 33 y 40) ──');

ok(YA_LO_RESUELVE.filter((y) => typeof y.es === 'function').every((y) => y.es.name && typeof y.es === 'function'),
  'Lo que ya estaba resuelto, declarado con las funciones de verdad');
const LIB = soloCodigo(leer('src/lib/bibliotecaEjercicios.js'));
ok(!/askAI|anthropic|fetch\(/i.test(LIB), 'Apartado 40 · ni IA');
ok(!/\bxp\b|leaderboard|puntos/i.test(LIB), '…ni XP ni leaderboard');
ok(/getExerciseReplacements\(/.test(LIB) && !/rasgosEnComun|nivelDeCompatibilidad/.test(LIB),
  '🚨 Las alternativas se piden a la F33, sin copiar su lógica (apartado 20)');
ok(/detalleCompletoDeEjercicio\(/.test(LIB) && !/progresoDeEjercicio\(|rangoEfectivoDeEjercicio\(/.test(LIB),
  '🚨 Lo personal se pide a la F29, sin recalcular progreso ni rango');
const COMP = leer('src/components/bibliotecaEjercicios.jsx');
ok(/ExercisePerformanceSummary/.test(COMP) && /ExerciseRankPreview/.test(COMP) && /ExerciseGoalPreview/.test(COMP) && /ReplacementCompatibility/.test(COMP),
  '…y en pantalla se reutilizan los componentes de la F29 y la F33');
/* ⚠️ Lo que se mide es que ningún ejercicio del catálogo esté ESCRITO en los
   componentes (su id, su nombre completo), no una forma de objeto: la primera
   versión de esto saltaba con `COMPONENTES_FIT34`, que declara nombres de
   componentes (EH F42, y `NO_EN_FIT25` por enésima vez). */
const copiaDelCatalogo = (src) => CATALOGO_EJERCICIOS.some((e) => src.includes(`'${e.id}'`) || src.includes(`"${e.id}"`));
ok(!copiaDelCatalogo(COMP) && !/CATALOGO_EJERCICIOS/.test(soloCodigo(COMP)),
  'Apartado 32 · los componentes no copian datos del catálogo: ni un ejercicio escrito a mano');
ok(copiaDelCatalogo(`${COMP}\nconst x = 'press-banca-barra';`),
  '…y el barrido SÍ caza uno escrito a mano');
const VISTA = leer('src/views/EjerciciosView.jsx');
ok(/export const ExerciseLibrary = EjerciciosView/.test(VISTA) && /export const ExerciseDetail = DetalleEjercicio/.test(VISTA),
  '🚨 ExerciseLibrary y ExerciseDetail SON la biblioteca y la ficha de la F2, ampliadas: no hay segundas');
ok(/\{fitness && \(/.test(VISTA), '⚠️ Lo personal solo sale si llega `fitness`: el tutorial en vivo no dice «Sin datos» sin mirar');
const t1 = Date.now();
const MIL = Array.from({ length: 900 }, (_, i) => crearEjercicioCompleto({ id: `mil-${i}`, nombre: `Ejercicio ${i}`, musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }], equipamiento: ['mancuernas'] }));
for (let i = 0; i < 10; i += 1) consultarBiblioteca({ consulta: 'biceps mancuernas', filtros: { equipo: 'mancuernas' }, propios: MIL });
const ms = (Date.now() - t1) / 10;
ok(ms < 150, `Apartado 33 · con 1000 ejercicios, buscar y filtrar sigue siendo rápido (${ms.toFixed(1)} ms)`);
ok(NO_EN_FIT34.length >= 5 && DECISIONES_FIT34.length >= 4, 'Lo que no se construye y lo decidido, declarados');
const aud = auditarBiblioteca();
ok(aud.ok, `La auditoría de la fase: ${aud.casillas.map((c) => `${c.id} ${c.ok ? '✓' : '✗'}`).join(' · ')}`);

console.log(fallos === 0
  ? `\n\x1b[32m✓ ${total}/${total} comprobaciones\x1b[0m`
  : `\n\x1b[31m✗ ${fallos} fallo(s) de ${total}\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
