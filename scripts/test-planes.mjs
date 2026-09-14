/* Biblioteca de planificaciones (Entrega 4 · FIT F5/45).
 *
 * El apartado 24 es una lista de validaciones obligatorias agrupadas en
 * Biblioteca, Detalle, Selección, Personalización, UX y Técnica. Las de datos se
 * ejecutan aquí; las de pantalla, en el recorrido de Chromium.
 *
 * 🚨 Lo que más se vigila son dos cosas que el enunciado subraya:
 *   · Apartado 2: *"Cada plan debe tener una estructura real y estar compuesto
 *     por ejercicios existentes en el catálogo creado en la Fase 2."* Se
 *     comprueban las 297 líneas de los diecisiete planes, una a una.
 *   · Apartado 15: *"la copia no modifica el original"*, que él llama *"MUY
 *     IMPORTANTE"*. Y no basta con un id nuevo: si las LÍNEAS comparten id,
 *     editar una serie en su plantilla tocaría la del plan.
 *
 * Y el apartado 10: *"No quiero porcentajes escritos manualmente si pueden
 * calcularse"*. Hay un barrido que lee el catálogo y falla si aparece una
 * distribución o una duración escrita a mano.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  OBJETIVOS_PLAN, objetivoDe, FILTRO_TODOS, DIFICULTADES_PLAN,
  crearDiaDePlan, crearPresetPlan, normalizarPresetPlan, CATALOGO_PLANES, planPorId,
  diaARutina, rutinaDelPlan, diasDeEntreno, ejerciciosDelPlan, duracionPorSesion,
  grupoDominanteDePlan, fichaDePlan, fichaDeDia, lineasDeDia,
  buscarPlanes, filtrarPlanes, planesVisibles, frecuenciasDisponibles,
  recuentosDeFiltro, pastillasDeFiltro,
  crearPlanActivo, normalizarPlanActivo, planActivoDe, planActivoResuelto,
  avisoDeCambioDePlan, usarPlan, quitarPlanActivo,
  nombreDePlantillaDePlan, personalizarPreset, resumenDePersonalizar,
  favoritosDe, esFavorito, alternarFavoritoPlan, planesFavoritos,
  normalizarFitnessConPlanes,
  ESTADO_SIN_RESULTADOS, ESTADO_SIN_FAVORITOS, ESTADO_ERROR_PLANES,
  NO_EN_FIT5, SIN_ESCRITOR, auditarPlanes, recuentoPorEntorno, GRUPOS_PARA_DISTRIBUCION,
} from '../src/lib/planes.js';
import { CATALOGO_PLANES_BRUTO } from '../src/lib/catalogoPlanes.js';
import { CATALOGO_EJERCICIOS, ejercicioPorId, normalizarFitnessCompleto } from '../src/lib/ejercicios.js';
import { DEFAULT_FITNESS, normalizarFitness, GRUPOS_MUSCULARES } from '../src/lib/fitness.js';
import { planARutina, editarLinea, rutinaAPlan } from '../src/lib/constructor.js';

const RAIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ_DIR, p), 'utf8');
/* La lección de siempre, ya por la vigesimoquinta vez: una prueba que comprueba
   que el código **no hace** algo tiene que quitar los comentarios y las cadenas,
   o salta con la frase que promete justamente eso. */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

console.log('\n═══ FIT F5/45 · Biblioteca de planificaciones ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Contenido real: los planes existen y son de verdad (apartados 2 y 8) ──');

ok(CATALOGO_PLANES.length >= 15 && CATALOGO_PLANES.length <= 22,
  `🚨 Hay entre 15 y 22 planes, como pide el apartado 8 (${CATALOGO_PLANES.length})`);

const porEntorno = recuentoPorEntorno();
ok(porEntorno.gym >= 5 && porEntorno.gym <= 8, `Gym: entre 5 y 8 (${porEntorno.gym})`);
ok(porEntorno.calistenia >= 5 && porEntorno.calistenia <= 8, `Calistenia: entre 5 y 8 (${porEntorno.calistenia})`);
ok(porEntorno.casa >= 4 && porEntorno.casa <= 6, `Casa: entre 4 y 6 (${porEntorno.casa})`);

const ids = CATALOGO_PLANES.map((p) => p.id);
ok(new Set(ids).size === ids.length, '⚠️ Ni un id de plan repetido (apartado 24)');

let lineasTotales = 0;
const inexistentes = [];
for (const p of CATALOGO_PLANES) {
  for (const d of p.dias) {
    for (const l of d.lineas) {
      lineasTotales += 1;
      if (!ejercicioPorId(l.exerciseId)) inexistentes.push(`${p.id}/${l.exerciseId}`);
    }
  }
}
ok(inexistentes.length === 0,
  `🚨 FIT F5 — las ${lineasTotales} líneas apuntan a ejercicios que EXISTEN en el catálogo de la F2 (apartado 2)${inexistentes.length ? `: faltan ${inexistentes.slice(0, 5).join(', ')}` : ''}`);
ok(lineasTotales > 200, `…y no son cuatro: hay ${lineasTotales} líneas repartidas`);

/* *"No quiero 20 planes prácticamente idénticos. Deben existir diferencias
   reales en: frecuencia, ejercicios, objetivo, dificultad, distribución
   muscular, estructura semanal."* */
ok(new Set(CATALOGO_PLANES.map((p) => p.frecuencia)).size >= 3,
  '🚨 Diferencias reales de frecuencia (apartado 8)');
ok(new Set(CATALOGO_PLANES.map((p) => p.objetivo)).size >= 4, '…de objetivo');
ok(new Set(CATALOGO_PLANES.map((p) => p.dificultad)).size >= 3, '…y de dificultad');
const firmas = CATALOGO_PLANES.map((p) => p.dias.map((d) => d.lineas.map((l) => l.exerciseId).join('+')).join('|'));
ok(new Set(firmas).size === firmas.length,
  '🚨 …y ni DOS PLANES con exactamente los mismos ejercicios: no son nombres vacíos');

const sinTags = CATALOGO_PLANES.filter((p) => !p.tags.length);
ok(sinTags.length === 0, `Todos llevan tags para el buscador (apartado 6)${sinTags.length ? `: ${sinTags[0].id}` : ''}`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El modelo, sin mezclar los cinco conceptos (apartado 1) ──');

const PLAN = planPorId('ppl-estetico');
ok(!!PLAN, 'El PPL Estético existe y se encuentra por su id');
ok(PLAN.dias.length === 7, `Un plan es una SEMANA: tiene sus siete días (${PLAN.dias.length})`);
ok(PLAN.dias.some((d) => d.descanso),
  '🚨 …y los días de descanso EXISTEN, no son un hueco (apartado 9)');
ok(diasDeEntreno(PLAN).length === 5, `…de los que cinco son de entreno (${diasDeEntreno(PLAN).length})`);

ok(!('ejercicios' in PLAN),
  '🚨 FIT F5 — un PresetPlan NO es un WorkoutPlan: no tiene una lista plana de ejercicios, tiene días');
ok(PLAN.dias[0].lineas[0].exerciseId && PLAN.dias[0].lineas[0].id,
  '…y cada línea es un WorkoutExercise con su id y su ejercicio');
ok(!PLAN.dias[0].lineas[0].nombre,
  '🚨 …y NO copia el nombre del ejercicio: se resuelve contra el catálogo (apartado 9)');

const dia = crearDiaDePlan({ nombre: 'Descanso', descanso: true, lineas: [{ exerciseId: 'press-banca-barra', series: 3 }] });
ok(dia.descanso && dia.lineas.length === 0, '⚠️ Un día de descanso no puede tener ejercicios aunque se los pasen');
ok(crearDiaDePlan({}).nombre === 'Día' && crearDiaDePlan({ descanso: true }).nombre === 'Descanso',
  '…y sin nombre se le pone el que le toca');

const raro = crearPresetPlan({ nombre: 'X', entorno: 'marte', objetivo: 'volar', dificultad: 'dios' });
ok(raro.entorno === '' && raro.objetivo === '' && raro.dificultad === '',
  '⚠️ Un valor que no está en su catálogo se descarta, no se guarda tal cual');
ok(normalizarPresetPlan({ nombre: 'Sin id' }) === null, '…y sin id no hay plan');
ok(normalizarPresetPlan(PLAN).id === PLAN.id, '…y el normalizador conserva el id');

/* Apartado 3 de la cabecera: los tres campos del apartado 1 que NO se escriben. */
const src = leer('src/lib/planes.js');
const bruto = leer('src/lib/catalogoPlanes.js');
ok(!('categoria' in PLAN),
  '🚨 FIT F5 — ni un campo `categoria`: la categoría del apartado 3 ES el entorno, y dos campos para lo mismo acaban diciendo cosas distintas');
ok(!('ordenDias' in PLAN),
  '⚠️ …ni una lista `ordenDias`: el orden es la posición en `dias` (una sola fuente de verdad)');
ok(!('distribucion' in PLAN) && !('duracion' in PLAN),
  '🚨 …ni la distribución ni la duración escritas: se derivan (apartado 10)');
ok(!/distribucion\s*:/.test(soloCodigo(bruto)) && !/porcentaje\s*:/.test(soloCodigo(bruto)),
  '🚨 FIT F5 — y el CATÁLOGO tampoco trae un porcentaje escrito a mano (apartado 10, literal)');
ok(!/duracion\s*:\s*\d/.test(soloCodigo(bruto)),
  '…ni una duración de plan escrita a mano');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Todo lo derivado sale de las funciones de la F3 (apartados 10 y 11) ──');

const ficha = fichaDePlan(PLAN);
ok(ficha.distribucion.grupos.length > 0, '🚨 La distribución muscular se calcula de los ejercicios (apartado 10)');
const suma = ficha.distribucion.grupos.reduce((a, g) => a + g.porcentaje, 0);
ok(suma >= 97 && suma <= 103, `…y los porcentajes de grupo suman ~100 (${suma})`);
ok(ficha.distribucion.grupos.every((g) => GRUPOS_MUSCULARES.some((x) => x.id === g.grupoId)),
  '…sobre los grupos de la F1, no una lista nueva');
ok(GRUPOS_PARA_DISTRIBUCION.length === GRUPOS_MUSCULARES.length,
  `⚠️ …y los siete del apartado 10 salen del catálogo de la F1 (${GRUPOS_PARA_DISTRIBUCION.length})`);

ok(/≈ \d+ min/.test(ficha.duracion), `🚨 La duración lleva su «≈»: es una estimación (${ficha.duracion})`);
ok(ficha.ejercicios === lineasDeDia(PLAN, 0).length + lineasDeDia(PLAN, 1).length + lineasDeDia(PLAN, 2).length
  + lineasDeDia(PLAN, 4).length + lineasDeDia(PLAN, 5).length,
  `…y el total de ejercicios es la suma de sus días (${ficha.ejercicios})`);
ok(ficha.textoFrecuencia === '5 días/semana', `La tarjeta dice la frecuencia entera («${ficha.textoFrecuencia}»)`);
ok(fichaDePlan({ nombre: 'Vacío' }).textoFrecuencia === '',
  '🚨 …y sin frecuencia NO dice «0 días/semana»: se calla (regla 8)');
ok(fichaDePlan({ nombre: 'Vacío' }).duracion === '', '…ni inventa una duración');

ok(!!ficha.grupoDominante && !!ficha.grupoDominante.nombre,
  `El grupo que más pesa se deriva, para dibujar la tarjeta sin imagen (${ficha.grupoDominante?.nombre})`);
ok(CATALOGO_PLANES.every((p) => p.thumbnail === null),
  '🚨 FIT F5 — ni UNA imagen inventada: los diecisiete valen `null` (apartado 5)');
ok(!/https?:\/\//i.test(bruto),
  '🚨 …y el catálogo entero no tiene ni una URL (apartado 5 y regla 8)');

/* Un día vale como rutina de la F3 tal cual: eso es lo que hace que no haya
   una segunda fórmula de minutos ni una segunda de porcentajes. */
const rut = diaARutina(PLAN, 0);
ok(rut && rut.lineas.length === PLAN.dias[0].lineas.length,
  '🚨 Un día se convierte en una rutina del constructor (apartado 13)');
ok(diaARutina(PLAN, 99) === null, '…y un día que no existe devuelve `null`, no revienta');
ok(rutinaDelPlan(PLAN).lineas.length === ejerciciosDelPlan(PLAN),
  '…y la semana entera cabe en una rutina para la distribución del plan');
const idsLineasSemana = rutinaDelPlan(PLAN).lineas.map((l) => l.id);
ok(new Set(idsLineasSemana).size === idsLineasSemana.length,
  '🚨 …con un id por línea: sin él `normalizarLinea` las descartaría y la distribución saldría VACÍA');

const f2 = fichaDeDia(PLAN, 0);
ok(f2.nombre === 'Push' && f2.ejercicios === 6 && /≈/.test(f2.duracion),
  `🚨 La semana dice «${f2.nombre} · ${f2.ejercicios} ejercicios · ${f2.duracion}» (apartado 12)`);
const descansoF = fichaDeDia(PLAN, 3);
ok(descansoF.descanso && descansoF.ejercicios === 0 && descansoF.duracion === '',
  '⚠️ …y un día de descanso no dice «0 ejercicios ≈ 0 min»: dice que es descanso');
ok(fichaDeDia(PLAN, 99) === null, '…y un día que no existe devuelve `null`');

const linea = lineasDeDia(PLAN, 0)[0];
ok(linea.nombre && linea.nombre !== linea.exerciseId,
  `🚨 El nombre del ejercicio sale del catálogo, no del plan («${linea.nombre}»)`);
ok(/×/.test(linea.series), `…con sus series (${linea.series})`);
ok(linea.musculos.length > 0, '…y su músculo principal (apartado 13)');
ok(linea.existe === true, '…y se sabe si el ejercicio existe');
ok(lineasDeDia({ dias: [{ lineas: [{ id: 'x', exerciseId: 'no-existe', series: 3 }] }] }, 0)[0].existe === false,
  '🚨 …y un id que no existiera se DICE, no se pinta como un hueco');

/* ⚠️ Un isométrico se mide en segundos, no en repeticiones (la lección de la F2). */
const conTiempo = CATALOGO_PLANES.flatMap((p) => p.dias.flatMap((d, i) => lineasDeDia(p, p.dias.indexOf(d))))
  .filter((l) => /\d+ s/.test(l.series));
ok(conTiempo.length > 0, `🚨 Hay ejercicios medidos en SEGUNDOS, no todo son series × reps (${conTiempo.length})`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Buscar (apartado 6) ──');

ok(buscarPlanes(CATALOGO_PLANES, 'calistenia').length >= 6, 'Se busca por entorno: «calistenia»');
ok(buscarPlanes(CATALOGO_PLANES, 'fuerza').length >= 3, '…por objetivo: «fuerza»');
ok(buscarPlanes(CATALOGO_PLANES, 'ppl').length >= 1, '…por nombre: «PPL»');
ok(buscarPlanes(CATALOGO_PLANES, 'casa').length >= 4, '…y «casa»');
ok(buscarPlanes(CATALOGO_PLANES, 'PPL').length === buscarPlanes(CATALOGO_PLANES, 'ppl').length,
  '⚠️ Da igual mayúsculas o minúsculas (apartado 6)');
ok(buscarPlanes(CATALOGO_PLANES, 'estetica').length === buscarPlanes(CATALOGO_PLANES, 'estética').length,
  '🚨 …y da igual el acento: nadie escribe «estética» con tilde en un iPhone');
ok(buscarPlanes(CATALOGO_PLANES, '').length === CATALOGO_PLANES.length, 'Sin escribir nada están todos');
ok(buscarPlanes(CATALOGO_PLANES, 'zzzz').length === 0, '…y una búsqueda sin resultados devuelve cero, no todos');
ok(buscarPlanes(CATALOGO_PLANES, 'volumen').length >= 1, '…y los tags también encuentran (apartado 6)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Filtrar (apartados 3 y 7) ──');

ok(filtrarPlanes(CATALOGO_PLANES, { entorno: 'gym' }).every((p) => p.entorno === 'gym'),
  'El filtro de entorno filtra de verdad');
ok(filtrarPlanes(CATALOGO_PLANES, { entorno: FILTRO_TODOS }).length === CATALOGO_PLANES.length,
  '…y «Todos» es todos (apartado 3)');
ok(filtrarPlanes(CATALOGO_PLANES, { objetivo: 'hipertrofia' }).every((p) => p.objetivo === 'hipertrofia'),
  '…el de objetivo también');
ok(filtrarPlanes(CATALOGO_PLANES, { dificultad: 'principiante' }).every((p) => p.dificultad === 'principiante'),
  '…el de nivel también');
ok(filtrarPlanes(CATALOGO_PLANES, { frecuencia: 3 }).every((p) => p.frecuencia === 3),
  '…y el de frecuencia también');
ok(filtrarPlanes(CATALOGO_PLANES, { frecuencia: '3' }).length === filtrarPlanes(CATALOGO_PLANES, { frecuencia: 3 }).length,
  '⚠️ …con el número llegando como texto desde la pastilla');
const cruzado = planesVisibles(CATALOGO_PLANES, { consulta: 'fuerza', entorno: 'casa' });
ok(cruzado.every((p) => p.entorno === 'casa'), 'Búsqueda y filtro se combinan');

ok(OBJETIVOS_PLAN.length === 6 && objetivoDe('skills')?.nombre === 'Skills',
  'Los seis objetivos del apartado 7 están, con su nombre');
ok(DIFICULTADES_PLAN.some((d) => d.id === 'intermedio'),
  '⚠️ …y las dificultades son LAS DE LA F2, no una escala nueva');

const pastillas = pastillasDeFiltro(CATALOGO_PLANES, {}, 'entorno');
ok(pastillas[0].id === FILTRO_TODOS && pastillas[0].cuenta === CATALOGO_PLANES.length,
  '🚨 Cada pastilla dice cuántos planes quedarían (la lección del apartado 23 de la F2)');
ok(pastillas.every((p) => p.cuenta > 0),
  '🚨 …y la que dejaría CERO no se pinta: un filtro que vacía la pantalla sin avisar no es un filtro');
const frecuencias = frecuenciasDisponibles();
ok(frecuencias.length > 0 && !frecuencias.includes(2),
  `🚨 FIT F5 — las pastillas de frecuencia se DERIVAN de los planes que hay (${frecuencias.join(', ')}): hoy ninguno es de dos días, así que no se pinta una pastilla «2 días» que deje la pantalla vacía siempre (regla 8)`);
const conGym = pastillasDeFiltro(CATALOGO_PLANES, { entorno: 'gym' }, 'objetivo');
ok(conGym.every((p) => p.cuenta > 0) && conGym[0].cuenta === porEntorno.gym,
  '🚨 …y el recuento se calcula CON LOS OTROS FILTROS PUESTOS: si no, diría «6» y al pulsar saldrían dos');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Elegir un plan (apartados 14 y 20) ──');

const VACIO = { ...DEFAULT_FITNESS };
ok(VACIO.planActivo === null && VACIO.favoritosPlanes.length === 0,
  '🚨 El estado inicial está limpio: sin plan puesto de oficio (F1, apartado 15)');

const primero = usarPlan(VACIO, 'ppl-estetico');
ok(primero.ok && primero.fitness.planActivo.planId === 'ppl-estetico',
  '🚨 Elegir el PRIMER plan no pregunta nada: confirmar lo inofensivo enseña a no leer (EH F61)');
ok(primero.fitness.planActivo.origen === 'preset' && primero.fitness.planActivo.desde,
  '…y se guarda de dónde viene y desde cuándo');
ok(!('dias' in primero.fitness.planActivo) && !('nombre' in primero.fitness.planActivo),
  '🚨 …y se guarda EL ID, no una copia del plan: con una copia, corregir un ejercicio no le llegaría');

const segundo = usarPlan(primero.fitness, 'upper-lower');
ok(!segundo.ok && segundo.motivo === 'confirmacion' && segundo.aviso,
  '🚨 FIT F5 — con otro plan activo, SIN confirmar no escribe nada (apartado 14)');
ok(segundo.fitness.planActivo.planId === 'ppl-estetico', '…y el activo sigue siendo el de antes');
ok(/¿Cambiar tu plan actual\?/.test(segundo.aviso.titulo), `…y pregunta con sus palabras («${segundo.aviso.titulo}»)`);
ok(/PPL Est/.test(segundo.aviso.que),
  '⚠️ …diciendo CUÁL se va: «tu plan actual» a secas no deja decidir (EH F62)');
ok(/Upper/.test(segundo.aviso.nuevo), '…y cuál entra');
ok(/sigue en la biblioteca/i.test(segundo.aviso.vuelve),
  '⚠️ …y que no se pierde nada: un plan prediseñado no se borra');
ok(!/no se puede deshacer|para siempre/i.test(JSON.stringify(segundo.aviso)),
  '…sin prometer que es irreversible, porque no lo es');

const cambiado = usarPlan(primero.fitness, 'upper-lower', { confirmado: true });
ok(cambiado.ok && cambiado.fitness.planActivo.planId === 'upper-lower', 'Confirmando sí se cambia');
ok(!usarPlan(primero.fitness, 'ppl-estetico').ok,
  '⚠️ Volver a elegir el que ya tienes no hace nada y lo dice');
ok(!usarPlan(VACIO, 'no-existe').ok, '…y un plan que no está se dice, no revienta');
ok(quitarPlanActivo(cambiado.fitness).planActivo === null, 'Se puede quitar el plan activo');
ok(quitarPlanActivo(cambiado.fitness).plantillas === cambiado.fitness.plantillas,
  '⚠️ …y quitarlo no toca nada más');

ok(planActivoResuelto(primero.fitness)?.nombre === 'PPL Estético',
  '🚨 «Tu Plan» resuelve el id contra la biblioteca (apartado 20)');
ok(planActivoResuelto({ planActivo: { planId: 'fantasma', origen: 'preset' } }) === null,
  '⚠️ …y un id que ya no existe devuelve `null`, no deja un hueco');
ok(planActivoResuelto({ planActivo: { planId: 'x', origen: 'plantilla' } }) === null,
  '⚠️ …y un plan activo de otro origen no se busca en la biblioteca');
ok(normalizarPlanActivo({ origen: 'preset' }) === null, 'Sin `planId` no hay plan activo');
ok(crearPlanActivo({ planId: 'x' }).origen === 'preset', '…y el origen por defecto es la biblioteca');
ok(planActivoDe(undefined) === null, '…y sin fitness tampoco revienta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Personalizar: la copia no toca el original (apartado 15) ──');

const per = personalizarPreset(VACIO, 'ppl-estetico');
ok(per.ok && per.creadas.length === 5,
  `🚨 FIT F5 — un plan de cinco días de entreno crea CINCO plantillas, una por día (${per.creadas.length})`);
ok(per.creadas.every((p) => !/Descanso/i.test(p.nombre)),
  '⚠️ …y los días de descanso NO generan plantilla: sería una tarjeta que no se puede abrir para nada');
ok(per.creadas[0].nombre === 'PPL Estético · Push',
  `…con el nombre del plan delante para reconocerlas («${per.creadas[0].nombre}»)`);
ok(per.fitness.plantillas.length === 5, '…y aparecen en `fitness.plantillas`, la lista de la F4');
ok(per.creadas.every((p) => p.creadoEn && p.editadoEn), '…con su fecha, como cualquier plantilla suya');
ok(per.creadas.every((p) => p.meta?.origenPlan === 'ppl-estetico'),
  '⚠️ …y con una REFERENCIA a de dónde salieron, no una copia del plan');

/* 🚨 La comprobación que el enunciado llama *"MUY IMPORTANTE"*. */
const idsOriginal = PLAN.dias[0].lineas.map((l) => l.id);
const idsCopia = planARutina(per.creadas[0]).lineas.map((l) => l.id);
ok(idsCopia.every((id) => !idsOriginal.includes(id)),
  '🚨 FIT F5 — CADA LÍNEA de la copia estrena id: con el mismo, editar una serie en su plantilla tocaría la del plan (apartado 15)');
const serieOriginal = PLAN.dias[0].lineas[0].series;
/* ⚠️ 7 y no 99: `crearLinea` topa en `MAX_SERIES` (20), que es correcto — pedir
   99 devolvía 20 y la comprobación saltaba con el código bien. */
const editada = editarLinea(planARutina(per.creadas[0]), idsCopia[0], { series: 7 });
ok(editada.lineas[0].series === 7 && serieOriginal !== 7, '…la copia se puede editar');
ok(planPorId('ppl-estetico').dias[0].lineas[0].series === serieOriginal,
  '🚨 …y el PLAN ORIGINAL no se ha enterado (apartado 15, literal)');
ok(planPorId('ppl-estetico').dias[0].lineas[0].series === CATALOGO_PLANES_BRUTO.find((p) => p.id === 'ppl-estetico').dias[0].lineas[0].series,
  '…ni el catálogo de donde sale');

const dosVeces = personalizarPreset(per.fitness, 'ppl-estetico');
ok(dosVeces.fitness.plantillas.length === 10,
  '⚠️ Personalizar dos veces crea dos juegos: no se pisa lo que ya tenía');
ok(!personalizarPreset(VACIO, 'no-existe').ok, 'Un plan que no está se dice, no revienta');

const resumen = resumenDePersonalizar(PLAN);
ok(/5 plantillas/.test(resumen.que), `Se dice cuántas van a aparecer («${resumen.que}»)`);
ok(/original se queda/i.test(resumen.original), '…y que el original no se toca');
ok(/Tus plantillas/.test(resumen.donde), '…y dónde encontrarlas');
ok(/1 plantilla\b/.test(resumenDePersonalizar(planPorId('core-abs')).que)
  || /\d+ plantillas/.test(resumenDePersonalizar(planPorId('core-abs')).que),
  '…con el singular y el plural bien');

/* 🚨 Y no hay forma de escribir en el catálogo: no es una fila de `app_data`. */
ok(!/CATALOGO_PLANES\s*[.[]\s*\w*\s*=[^=]/.test(soloCodigo(src)),
  '🚨 FIT F5 — la librería no escribe NUNCA en el catálogo: es código, no datos del usuario (apartado 15)');
ok(!/saveData|supabase/i.test(soloCodigo(src)),
  '⚠️ …y no guarda nada por su cuenta: quien escribe es `App.jsx` (la puerta de siempre)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Favoritos (apartado 16) ──');

const favUno = alternarFavoritoPlan(VACIO, 'body-control');
ok(esFavorito(favUno, 'body-control'), 'Se marca un favorito');
ok(favoritosDe(favUno).every((x) => typeof x === 'string'),
  '🚨 …y se guarda el ID, nunca una copia del plan (E3 F37 con los alimentos)');
ok(!esFavorito(alternarFavoritoPlan(favUno, 'body-control'), 'body-control'), '…y se desmarca');
ok(favoritosDe(alternarFavoritoPlan(VACIO, 'no-existe')).length === 0,
  '⚠️ …y no se puede marcar un plan que no existe');
ok(planesFavoritos(favUno)[0]?.nombre === 'Body Control', 'La lista se resuelve contra la biblioteca');
ok(planesFavoritos({ favoritosPlanes: ['fantasma'] }).length === 0,
  '…y un favorito colgado no deja un hueco en la lista');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. La puerta de carga y la regla 5 ──');

ok('planActivo' in DEFAULT_FITNESS && 'favoritosPlanes' in DEFAULT_FITNESS,
  '🚨 Los dos campos nuevos están en `DEFAULT_FITNESS`: si no, el siguiente guardado se los lleva (regla 5)');
const idaYVuelta = normalizarFitness({ planActivo: { planId: 'ppl-estetico', desde: '2026-09-13' }, favoritosPlanes: ['a', 'a', '', 'b'] });
ok(idaYVuelta.planActivo?.planId === 'ppl-estetico',
  '🚨 …y el normalizador de la F1 los conserva al cargar');
ok(idaYVuelta.favoritosPlanes.join(',') === 'a,b', '…sin repetidos ni vacíos');
ok(normalizarFitness({ planActivo: 'texto suelto' }).planActivo === null, '…y una forma rara se descarta');

const conColgados = { favoritosPlanes: ['ppl-estetico', 'fantasma'], planActivo: { planId: 'fantasma', origen: 'preset' } };
ok(normalizarFitnessCompleto(conColgados).favoritosPlanes.includes('fantasma'),
  '⚠️ La puerta de la F2 NO limpia un favorito colgado: no conoce la biblioteca (y por eso esta comprobación puede ponerse roja)');
const limpio = normalizarFitnessConPlanes(conColgados);
ok(!limpio.favoritosPlanes.includes('fantasma') && limpio.favoritosPlanes.includes('ppl-estetico'),
  '🚨 FIT F5 — y la de la F5 SÍ: un favorito que apunta a un plan que ya no existe es guardar una mentira (EH F24)');
ok(limpio.planActivo === null, '…y un plan activo que ya no existe también se limpia');
ok(normalizarFitnessConPlanes({ planActivo: { planId: 'x', origen: 'plantilla' } }).planActivo?.planId === 'x',
  '⚠️ …pero uno de otro origen NO se tira: no se puede comprobar desde aquí');
ok(normalizarFitnessConPlanes(undefined).plantillas.length === 0, '…y sin nada guardado tampoco revienta');
ok(normalizarFitnessConPlanes({ ejercicios: [{ id: 'x', nombre: 'Mío', musculos: [] }] }).ejercicios.length === 1,
  '🚨 …y sigue haciendo lo de la F2: los ejercicios suyos pasan por el modelo completo');

const appSrc = leer('src/App.jsx');
/* 🔓 Hasta la FIT F7, la última puerta era ésta y `App.jsx` la llamaba
   directamente. La F7 añadió la cuarta capa —la del snapshot de una sesión—, así
   que lo que se vigila sigue siendo lo mismo: **que se llame a la ÚLTIMA**, que
   ahora es `normalizarFitnessConSesiones`, y que ésa siga llamando a ésta. */
ok(/normalizarFitnessConSesiones\s*\(/.test(appSrc),
  '🚨 FIT F5 → F7 — `App.jsx` llama a la ÚLTIMA puerta: la de en medio dejaría favoritos colgados');
ok(/normalizarFitnessConPlanes\s*\(/.test(leer('src/lib/entrenamiento.js')),
  '🚨 …y esa última llama a ésta, así que la cadena de cuatro capas sigue entera');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Los estados vacíos, con salida (apartado 17) ──');

for (const [nombre, e] of [['Sin resultados', ESTADO_SIN_RESULTADOS], ['Sin favoritos', ESTADO_SIN_FAVORITOS], ['Error', ESTADO_ERROR_PLANES]]) {
  ok(!!e.titulo && !!e.texto && !!e.accion, `${nombre}: tiene título, explicación y SALIDA (un vacío sin botón es una pantalla rota, EH F41)`);
}
ok(/No encontramos planes/.test(ESTADO_SIN_RESULTADOS.titulo), '…con las palabras del enunciado');
ok(!/conexi[oó]n/i.test(ESTADO_ERROR_PLANES.texto),
  '🚨 …y el de error NO manda a mirar la conexión: la biblioteca vive en el código (EH F62)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Lo que no se construye, declarado (apartado 23) ──');

ok(NO_EN_FIT5.length >= 6, `Lo excluido está escrito con su motivo (${NO_EN_FIT5.length})`);
ok(NO_EN_FIT5.every((x) => x.que && x.porque), '…cada línea con los dos');
ok(NO_EN_FIT5.some((x) => /Empezar el entrenamiento/i.test(x.que)),
  '🚨 …y el primero es el motor en vivo: el apartado 14 lo prohíbe expresamente');
const vistaSrc = leer('src/views/BibliotecaPlanesView.jsx');
ok(!/Empezar entrenamiento/i.test(soloCodigo(vistaSrc)),
  '🚨 FIT F5 — y la pantalla NO pinta «Empezar entrenamiento»: sin motor sería una acción muerta (regla 8)');
ok(SIN_ESCRITOR.some((x) => x.clave === 'fitness.planes' && x.porque && x.quienDecide),
  '⚠️ …y `fitness.planes` se queda sin escritor, y se DICE en vez de dejarla ahí sin saber para qué es');
ok('planes' in DEFAULT_FITNESS,
  '…pero no se quita del modelo: quitarla se llevaría lo que alguien tuviera guardado (regla 5)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. La auditoría del apartado 24, EJECUTADA ──');

const audit = auditarPlanes();
ok(audit.ok, `🚨 Los ${audit.planes} planes pasan la auditoría entera${audit.ok ? '' : `: ${audit.problemas.slice(0, 4).map((p) => `${p.plan} — ${p.que}`).join(' · ')}`}`);
ok(audit.planes === CATALOGO_PLANES.length, '…y los cuenta de verdad');

/* Y puede ponerse roja: una auditoría que no falla nunca no sirve (EH F42). */
const malo = crearPresetPlan({
  id: 'malo', nombre: 'Malo', entorno: 'gym', objetivo: 'fuerza', dificultad: 'intermedio',
  frecuencia: 4, paraQuien: 'Nadie',
  dias: [{ nombre: 'Día', lineas: [{ exerciseId: 'no-existe-esto', series: 3, repeticiones: 10 }] }],
});
const auditMalo = auditarPlanes([malo]);
ok(!auditMalo.ok, '⚠️ …y con un plan mal puesto se pone ROJA (EH F42)');
ok(auditMalo.problemas.some((p) => /no está en el catálogo/.test(p.que)), '…diciendo que el ejercicio no existe');
ok(auditMalo.problemas.some((p) => /Dice 4 días y tiene 1/.test(p.que)),
  '🚨 …y que la frecuencia que anuncia no cuadra con su semana: eso sería mentir en la tarjeta');
ok(auditarPlanes([crearPresetPlan({ id: 'a', nombre: 'A' }), crearPresetPlan({ id: 'a', nombre: 'B' })])
  .problemas.some((p) => /Id repetido/.test(p.que)), '…y caza un id repetido');
ok(auditarPlanes([{ ...malo, thumbnail: 'https://algo.com/x.jpg' }]).problemas.some((p) => /imagen de fuera/.test(p.que)),
  '…y una imagen inventada (apartado 5)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. Nada se guarda al mirar, y nada revienta sin datos ──');

ok(!/localStorage/.test(soloCodigo(src)),
  '⚠️ Ni el filtro ni la búsqueda se guardan: son estado de la pantalla (EH F40)');
ok(buscarPlanes(undefined, 'x').length === 0 && filtrarPlanes(undefined, {}).length === 0,
  'Sin lista tampoco revienta');
ok(planesVisibles(CATALOGO_PLANES).length === CATALOGO_PLANES.length, '…y sin filtros salen todos');
ok(fichaDePlan(undefined).ejercicios === 0 && fichaDePlan(null).nombre === '', '…ni la ficha de un plan que no llega');
ok(lineasDeDia(undefined, 0).length === 0 && diasDeEntreno(undefined).length === 0, '…ni los días');
ok(usarPlan(undefined, 'ppl-estetico').ok, '…ni elegir con el fitness sin llegar');
ok(personalizarPreset(undefined, 'core-abs').ok, '…ni personalizar');
ok(recuentosDeFiltro(CATALOGO_PLANES, {}, 'noexiste')[FILTRO_TODOS] === CATALOGO_PLANES.length,
  '…ni un campo de filtro que no existe');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
