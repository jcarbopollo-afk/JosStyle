/* Tu Plan (Entrega 4 · FIT F6/45).
 *
 * El apartado 29 es una lista de validaciones obligatorias agrupadas en Plan
 * activo, Próximo entrenamiento, Semana, Cambio de plan, Plantillas, Técnica y
 * Responsive. Las de datos se ejecutan aquí; las de pantalla, en el recorrido.
 *
 * 🚨 Lo que más se vigila son tres cosas que el enunciado subraya:
 *   · Apartado 8: *"no inventes entrenamientos completados"*. El estado
 *     `completado` existe declarado y APAGADO, y `semanaDelPlan` no lo devuelve.
 *   · Apartado 14: tiene que funcionar con 2, 3, 4, 5, 6 y 7 días — y con una
 *     rutina de UNA sesión, que es el apartado 18 (una plantilla suya de plan).
 *   · Apartado 16: *"No inventar una semana si todavía no existe una fecha de
 *     inicio."*
 *
 * Y el apartado 9: *"No crear un tercer sistema diferente para representar
 * ejercicios."* Hay un barrido que comprueba que la sesión del día sale de
 * `lineasDeDia` (F5), no de una función nueva.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ESTADOS_DIA, estadoDia, ESTADOS_DISPONIBLES, planDePlantilla, planActivoCompleto,
  posicionDelDia, semanaDelPlan, DESCANSO_HOY, proximoEntrenamiento,
  cabeceraDelPlan, distribucionSemanal, resumenDistribucion, GRUPOS_EN_RESUMEN,
  PLANTILLAS_EN_TU_PLAN, plantillasParaTuPlan, SIN_PLAN, PLAN_PERDIDO,
  tuPlan, sesionDelDia, NO_EN_FIT6, PREPARADO_PARA, auditarTuPlan,
} from '../src/lib/tuPlan.js';
import {
  usarPlan, personalizarPreset, planPorId, CATALOGO_PLANES, planActivoDe, crearPresetPlan,
} from '../src/lib/planes.js';
import { DEFAULT_FITNESS, normalizarFitness } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, rutinaAPlan } from '../src/lib/constructor.js';
import { DIAS_SEMANA } from '../src/lib/horario.js';

const RAIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ_DIR, p), 'utf8');
/* La lección de siempre, ya por la vigesimoséptima vez: un barrido que comprueba
   que el código NO hace algo tiene que quitar comentarios y cadenas. */
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

/* Un miércoles, para que la semana tenga pasado, hoy y futuro. */
const MIER = '2026-09-16';
const LUNES = '2026-09-14';
const VACIO = { ...DEFAULT_FITNESS };
const conPlan = (id = 'ppl-estetico', desde = LUNES) => usarPlan(VACIO, id, { hoy: desde }).fitness;

console.log('\n═══ FIT F6/45 · Tu Plan ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. El plan activo (apartados 3, 17 y 24) ──');

const F = conPlan();
const v = tuPlan(F, { hoy: MIER });
ok(v.estado === 'activo', '🚨 Con un plan elegido, Tu Plan lo enseña (apartado 29)');
ok(v.cabecera.nombre === 'PPL Estético', `…con su nombre (${v.cabecera.nombre})`);
ok(v.cabecera.entorno && v.cabecera.dificultad && v.cabecera.objetivo,
  '…su entorno, su dificultad y su objetivo (apartado 3)');
ok(/≈ \d+ min/.test(v.cabecera.duracion), `…su duración aproximada (${v.cabecera.duracion})`);
ok(v.cabecera.diasEntreno === 5, `…y su número de días (${v.cabecera.diasEntreno})`);
ok(/Activo desde el/.test(v.cabecera.textoDesde),
  `🚨 FIT F6 — y la fecha de activación, que es lo que pide el apartado 17 («${v.cabecera.textoDesde}»)`);
ok(cabeceraDelPlan(planPorId('ppl-estetico'), { desde: '' }).textoDesde === '',
  '⚠️ …y sin fecha guardada NO se dice nada: a lo de antes de la F5 no se le inventa una');

/* Apartado 24: todo lo importante persiste, y lo guardado es lo de la F5. */
const guardado = normalizarFitness(F);
ok(guardado.planActivo?.planId === 'ppl-estetico' && guardado.planActivo?.desde === LUNES,
  '🚨 El plan activo y su fecha SOBREVIVEN al normalizador (apartado 24)');
ok(!guardado.planActivo?.dias,
  '🚨 …y no se guarda una copia del plan: solo el id, el origen y la fecha');
const src = leer('src/lib/tuPlan.js');
ok(!/saveData|localStorage|supabase/i.test(soloCodigo(src)),
  '⚠️ …y esta librería no guarda nada por su cuenta (apartado 24: no otra solución paralela)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. La semana, y sus DOS reglas (apartados 7, 14 y 16) ──');

const semana = v.semana;
ok(semana.length === 7, `La semana tiene siete casillas (${semana.length})`);
ok(semana.map((d) => d.corto).join('') === 'LMXJVSD',
  '🚨 …de lunes a domingo, con los días de `horario.js` — no una segunda lista');
ok(semana.filter((d) => d.esHoy).length === 1, '🚨 …y UNA sola marcada como hoy (apartado 29)');
ok(semana.find((d) => d.esHoy).corto === 'X', '…la que de verdad es hoy');
ok(semana[0].nombre === 'Push' && semana[1].nombre === 'Pull' && semana[2].nombre === 'Legs',
  '🚨 FIT F6 — un plan de SIETE días ES la semana: su día 1 es el lunes (apartado 7)');
ok(semana[3].descanso && semana[6].descanso,
  '🚨 …y los días de descanso se identifican (apartado 29)');
ok(semana.every((d) => ESTADOS_DISPONIBLES.includes(d.estado)),
  '🚨 …y todos los estados son de los que se pueden afirmar');
ok(semana.filter((d) => d.estado === 'proximo').length === 1,
  '⚠️ …y solo UNO es el próximo: los demás son «más adelante»');
ok(/≈ \d+ min/.test(semana[0].duracion), `…cada día de entreno dice cuánto dura (${semana[0].duracion})`);

/* 🚨 La otra regla: lo que no tiene siete días CICLA desde la activación. */
const PLAN3 = crearPresetPlan({
  id: 'tres', nombre: 'Tres', entorno: 'casa', objetivo: 'fuerza', dificultad: 'principiante',
  frecuencia: 3, paraQuien: 'Prueba',
  dias: [
    { nombre: 'A', lineas: [{ exerciseId: 'sentadilla-barra', series: 3, repeticiones: 8 }] },
    { nombre: 'B', lineas: [{ exerciseId: 'press-banca-barra', series: 3, repeticiones: 8 }] },
    { nombre: 'Descanso', descanso: true, lineas: [] },
  ],
});
ok(posicionDelDia(PLAN3, LUNES, LUNES) === 0 && posicionDelDia(PLAN3, MIER, LUNES) === 2,
  '🚨 FIT F6 — un plan que NO es de siete días cicla desde la fecha de activación (apartado 14)');
ok(posicionDelDia(PLAN3, '2026-09-17', LUNES) === 0, '…y vuelve a empezar al acabar el ciclo');
ok(posicionDelDia(PLAN3, MIER, '') === null,
  '🚨 FIT F6 — y SIN fecha de activación no hay ciclo: `null` (apartado 16, literal)');
ok(semanaDelPlan(PLAN3, { hoy: MIER, desde: '' }).length === 0,
  '🚨 …así que la semana no se dibuja, en vez de pintar siete huecos inventados');
ok(posicionDelDia(planPorId('ppl-estetico'), MIER, '') === 2,
  '⚠️ …pero uno de siete días SÍ se puede repartir sin fecha: su día es el de la semana');

/* Apartado 14: de dos a siete días. */
for (const n of [2, 3, 4, 5, 6, 7]) {
  const p = crearPresetPlan({
    id: `p${n}`, nombre: `Plan ${n}`, entorno: 'casa', objetivo: 'fuerza', dificultad: 'principiante',
    frecuencia: n, paraQuien: 'Prueba',
    dias: Array.from({ length: n }, (_, i) => ({
      nombre: `D${i + 1}`, lineas: [{ exerciseId: 'sentadilla-barra', series: 3, repeticiones: 8 }],
    })),
  });
  const s = semanaDelPlan(p, { hoy: MIER, desde: LUNES });
  ok(s.length === 7 && s.some((d) => d.esHoy),
    `Un plan de ${n} ${n === 1 ? 'día' : 'días'} dibuja su semana (apartado 14)`);
}

/* 🐛 El fallo de esta fase: un día ANTERIOR a la activación no es un descanso. */
const desdeMartes = semanaDelPlan(PLAN3, { hoy: MIER, desde: '2026-09-15' });
ok(desdeMartes[0].fueraDelPlan === true,
  '🚨 FIT F6 — un día ANTERIOR a la activación no es descanso: ese día el plan no existía');
ok(desdeMartes[0].descanso === false && desdeMartes[0].nombre === '',
  '⚠️ …así que no se afirma nada de él (y era un fallo real de esta misma fase)');
ok(desdeMartes[0].estado === 'pasado', '…se queda como un día de la semana que ya pasó');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Los estados, y el que NO se puede afirmar (apartado 8) ──');

ok(ESTADOS_DIA.length >= 5, `Los estados están declarados (${ESTADOS_DIA.length})`);
ok(estadoDia('completado')?.disponible === false,
  '🚨 FIT F6 — «Completado» existe DECLARADO Y APAGADO: sin historial no se puede afirmar (apartado 8)');
ok(!!estadoDia('completado')?.enFase,
  '⚠️ …y dice en qué fase llega, para que la siguiente no escriba un sexto estado sin verlo');
ok(!ESTADOS_DISPONIBLES.includes('completado'), '…y no está entre los que se usan');
const todosLosEstados = new Set();
for (const id of CATALOGO_PLANES.map((p) => p.id)) {
  for (const d of semanaDelPlan(planPorId(id), { hoy: MIER, desde: LUNES })) todosLosEstados.add(d.estado);
}
ok(!todosLosEstados.has('completado'),
  '🚨 …y NINGUNO de los diecisiete planes devuelve «completado» en ningún día');
ok([...todosLosEstados].every((e) => ESTADOS_DISPONIBLES.includes(e)),
  `…todos los que salen se pueden afirmar (${[...todosLosEstados].sort().join(', ')})`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El próximo entrenamiento (apartados 5 y 6) ──');

const px = v.proximo;
ok(px && px.cuando === 'Hoy', `🚨 Hoy toca Legs, así que dice «Hoy» (${px?.cuando})`);
ok(px.sesion.nombre === 'Legs', `…con su nombre (${px.sesion.nombre})`);
ok(px.sesion.ejercicios === 6, `…su número de ejercicios (${px.sesion.ejercicios})`);
ok(/≈ \d+ min/.test(px.sesion.duracion), `…su duración (${px.sesion.duracion})`);
ok(px.musculos.length > 0, `🚨 …sus músculos principales, DERIVADOS (${px.musculos.join(', ')})`);
ok(/Día \d+ de \d+/.test(px.posicion), `…y su posición en la semana (${px.posicion})`);

/* El día siguiente a hoy se llama «Mañana», no «Jueves». */
const jueves = tuPlan(conPlan('ppl-estetico', LUNES), { hoy: '2026-09-17' });
ok(jueves.descansoHoy === true, '🚨 El jueves toca descanso, y se dice (apartado 15)');
ok(/Recupera/.test(DESCANSO_HOY.texto), '…con las palabras del apartado 15');
ok(jueves.proximo?.cuando === 'Mañana',
  `⚠️ …y el siguiente entrenamiento es «Mañana», no «Viernes» (${jueves.proximo?.cuando})`);
ok(jueves.proximo?.sesion?.nombre === 'Upper', '…y dice cuál es, en vez de esconderlo');

/* Sin ningún entrenamiento por delante esta semana, `null` — no se inventa el
   de la semana que viene. */
const domingo = tuPlan(conPlan('ppl-estetico', LUNES), { hoy: '2026-09-20' });
ok(domingo.proximo === null,
  '⚠️ El domingo ya no queda entrenamiento esta semana: `null`, no uno inventado de la que viene');
ok(domingo.descansoHoy === true, '…y se dice que hoy toca descansar');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. La sesión de un día, que es la de la F5 (apartado 9) ──');

const ses = sesionDelDia(v.plan, 0, []);
ok(ses.nombre === 'Push' && ses.lineas.length === 6, `La sesión trae sus ejercicios (${ses.lineas.length})`);
ok(ses.lineas[0].nombre && ses.lineas[0].nombre !== ses.lineas[0].exerciseId,
  `🚨 …resueltos contra el catálogo de la F2 (${ses.lineas[0].nombre})`);
ok(/×/.test(ses.lineas[0].series), `…con sus series y repeticiones (${ses.lineas[0].series})`);
ok(typeof ses.lineas[0].descanso === 'number', '…y su descanso');
ok(ses.distribucion.grupos.length > 0, '…y su distribución muscular');
ok(/lineasDeDia/.test(soloCodigo(src)),
  '🚨 FIT F6 — y sale de `lineasDeDia` (F5): *"No crear un tercer sistema para representar ejercicios"*');
ok(sesionDelDia(v.plan, null) === null && sesionDelDia(null, 0) === null,
  '…y sin día no revienta');

/* Apartado 25: un ejercicio que ya no está se dice, y el resto se sigue viendo. */
const conFantasma = crearPresetPlan({
  id: 'roto', nombre: 'Roto', entorno: 'casa', objetivo: 'fuerza', dificultad: 'principiante',
  frecuencia: 1, paraQuien: 'Prueba',
  dias: [{ nombre: 'A', lineas: [
    { exerciseId: 'no-existe-esto', series: 3, repeticiones: 8 },
    { exerciseId: 'sentadilla-barra', series: 3, repeticiones: 8 },
  ] }],
});
const sesRota = sesionDelDia(conFantasma, 0, []);
ok(sesRota.lineas.length === 2 && sesRota.lineas[0].existe === false && sesRota.lineas[1].existe === true,
  '🚨 FIT F6 — un ejercicio que ya no está se DICE y el resto se sigue viendo (apartado 25)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Una plantilla suya como plan activo (apartado 18) ──');

const conPl = personalizarPreset(VACIO, 'core-abs').fitness;
const idPl = conPl.plantillas[0].id;
const rPl = usarPlan(conPl, idPl, { origen: 'plantilla', hoy: LUNES });
ok(rPl.ok && rPl.fitness.planActivo.origen === 'plantilla',
  '🚨 FIT F6 — una plantilla PROPIA puede ser el plan activo (apartado 18)');
ok(rPl.fitness.planActivo.planId === idPl, '…guardada por su id, con su origen');
const vPl = tuPlan(rPl.fitness, { hoy: MIER });
ok(vPl.estado === 'activo' && vPl.cabecera.propia === true,
  '…y Tu Plan la enseña, sabiendo que es suya');
ok(vPl.cabecera.nombre === conPl.plantillas[0].nombre, `…con su nombre (${vPl.cabecera.nombre})`);
ok(vPl.cabecera.textoFrecuencia === '',
  '🚨 …y NO le inventa una frecuencia: cuántos días la hace lo decide él (regla 8)');
ok(vPl.semana.length === 7 && vPl.semana.some((d) => d.esHoy),
  '…su semana se dibuja ciclando desde la activación');
ok(vPl.proximo?.sesion?.ejercicios > 0, '…y su próximo entrenamiento tiene ejercicios de verdad');
ok(planDePlantilla(null) === null && planDePlantilla({}) === null,
  '⚠️ …y una plantilla que no llega no revienta');
const envuelto = planDePlantilla(conPl.plantillas[0]);
ok(envuelto.dias.length === 1,
  '🚨 …una plantilla se ENVUELVE como plan de UN día, no se le inventan seis de descanso');
ok(!usarPlan(VACIO, 'no-existe', { origen: 'plantilla' }).ok,
  '…y una plantilla que ya no está se dice, no revienta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Cambiar de plan (apartados 4, 19 y 20) ──');

const cambio = usarPlan(F, 'upper-lower', { hoy: MIER });
ok(!cambio.ok && cambio.motivo === 'confirmacion',
  '🚨 Con un plan activo, cambiar PREGUNTA antes (apartado 20)');
ok(cambio.fitness.planActivo.planId === 'ppl-estetico', '…y cancelar no cambia nada (apartado 29)');
const cambiado = usarPlan(F, 'upper-lower', { hoy: MIER, confirmado: true });
ok(cambiado.ok && cambiado.fitness.planActivo.planId === 'upper-lower',
  '…y confirmando sí cambia (apartado 29)');
ok(planPorId('ppl-estetico') !== null,
  '🚨 FIT F6 — y el plan anterior NO se elimina: sigue en la biblioteca (apartado 19)');
const conPlantillasYPlan = usarPlan(conPl, 'ppl-estetico', { hoy: MIER }).fitness;
ok(conPlantillasYPlan.plantillas.length === conPl.plantillas.length,
  '🚨 …ni se eliminan las plantillas al cambiar de plan (apartado 19)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. La distribución semanal (apartado 10) ──');

const d = distribucionSemanal(v.plan);
ok(d.grupos.length > 0, 'La distribución del plan se calcula');
const suma = d.grupos.reduce((a, g) => a + g.porcentaje, 0);
ok(suma >= 97 && suma <= 103, `…y suma ~100 (${suma})`);
const res = resumenDistribucion(v.plan);
ok(res.grupos.length <= GRUPOS_EN_RESUMEN,
  `🚨 …y se resume para no saturar la pantalla (${res.grupos.length} de ${res.total}, apartado 10)`);
ok(res.resto >= 0, '…diciendo cuánto queda repartido en el resto, en vez de esconderlo');
ok(/distribucionMuscular/.test(soloCodigo(src)),
  '🚨 …y usa el cálculo que ya existe (apartado 10: *"Utilizar los cálculos existentes"*)');
ok(distribucionSemanal(null).grupos.length === 0, '…y sin plan no revienta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Tus plantillas, sin duplicar la gestión (apartados 11 y 13) ──');

const pl = plantillasParaTuPlan(conPl);
ok(pl.total === conPl.plantillas.length, `Se cuentan todas (${pl.total})`);
ok(pl.plantillas.length <= PLANTILLAS_EN_TU_PLAN,
  `🚨 …y solo se enseñan ${PLANTILLAS_EN_TU_PLAN} (apartado 11: *"No duplicar toda la gestión aquí"*)`);
ok(pl.hayMas === (pl.total > PLANTILLAS_EN_TU_PLAN),
  '⚠️ …y «Ver todas» solo si queda alguna fuera (E3 F46, regla 8)');
ok(pl.plantillas.every((x) => x.nombre && typeof x.ejercicios === 'number'),
  '…cada una con su nombre y sus ejercicios (apartado 11)');
ok(plantillasParaTuPlan(rPl.fitness).plantillas.some((x) => x.esActiva),
  '⚠️ …y se sabe cuál es la que está activa, para no ofrecerle ponerla otra vez');
ok(plantillasParaTuPlan(VACIO).total === 0, '…y sin ninguna tampoco revienta');
ok(!/usarPlan|planActivo\s*:/.test(soloCodigo(leer('src/views/TuPlanView.jsx'))),
  '🚨 FIT F6 — y desde aquí una plantilla NO se convierte en plan activo (apartado 13)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Los estados de la pantalla (apartados 2, 25 y 26) ──');

const sinPlan = tuPlan(VACIO, { hoy: MIER });
ok(sinPlan.estado === 'sin_plan', 'Sin plan elegido se dice');
ok(/Aún no tienes un plan/.test(SIN_PLAN.titulo), '…con las palabras del apartado 2');
ok(!!SIN_PLAN.explorar && !!SIN_PLAN.crear,
  '🚨 …y con SUS DOS SALIDAS: la biblioteca y el constructor (apartado 2)');
ok(sinPlan.plantillas.total === 0, '…y sus plantillas siguen leyéndose');

const perdido = tuPlan({ planActivo: { planId: 'fantasma', origen: 'preset', desde: LUNES } }, { hoy: MIER });
ok(perdido.estado === 'perdido',
  '🚨 FIT F6 — un plan que ya no existe NO es «sin plan»: es recuperación (apartado 25)');
ok(!!PLAN_PERDIDO.accion && /no existe/i.test(PLAN_PERDIDO.texto),
  '…y se dice qué ha pasado, con una salida (EH F62)');
ok(!/error|conexi[oó]n/i.test(PLAN_PERDIDO.titulo),
  '⚠️ …sin decir «Error» a secas ni mandarle a mirar la conexión');
const perdidaPl = tuPlan({ planActivo: { planId: 'x', origen: 'plantilla', desde: LUNES }, plantillas: [] }, { hoy: MIER });
ok(perdidaPl.estado === 'perdido', '…y lo mismo con una plantilla que ya no está');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Lo que no se construye, declarado (apartados 16 y 28) ──');

ok(NO_EN_FIT6.length >= 5, `Lo excluido está escrito con su motivo (${NO_EN_FIT6.length})`);
ok(NO_EN_FIT6.every((x) => x.que && x.porque), '…cada línea con los dos');
ok(NO_EN_FIT6.some((x) => /entrenamiento en vivo/i.test(x.que)),
  '🚨 …y el primero es el motor en vivo (apartado 28)');
const vistaSrc = leer('src/views/TuPlanView.jsx');
/* 🔓 Esta comprobación decía lo contrario hasta la FIT F7, y estaba escrita a
   propósito para este momento (E3 F44): el apartado 6 prohibía el botón *"si
   todavía no puede existir una acción funcional completa"*, no para siempre.
   Con el motor construido, guardaba una promesa y pasa a vigilar que se cumpla.
   ⚠️ Y solo se ofrece cuando hay quien lo atienda: sin `onEmpezar` no se pinta,
   que es lo que impide que vuelva a ser un botón muerto (regla 8). */
ok(/Empezar entrenamiento/.test(vistaSrc),
  '🔓 FIT F6 → F7 — la pantalla YA pinta «Empezar entrenamiento»: el motor llegó');
ok(/onEmpezar &&|onEmpezar \?|\{onEmpezar/.test(vistaSrc),
  '…y solo si le dan con qué empezar: sin acción, no hay botón (regla 8)');
ok(/Ver entrenamiento/.test(vistaSrc),
  '…y «Ver entrenamiento» sigue estando: abrir el detalle no se ha perdido');
ok(!/cron[oó]metro|timer|setInterval/i.test(soloCodigo(vistaSrc)),
  '⚠️ …ni un cronómetro (apartado 28)');
ok(PREPARADO_PARA.length >= 4 && PREPARADO_PARA.every((x) => x.que && x.donde),
  '⚠️ Y lo que el apartado 16 pide dejar preparado está escrito con dónde está');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. La auditoría del apartado 29, EJECUTADA ──');

ok(auditarTuPlan(F, { hoy: MIER }).ok, '🚨 El plan activo pasa la auditoría entera');
ok(auditarTuPlan(rPl.fitness, { hoy: MIER }).ok, '…y una plantilla como plan activo también');
ok(auditarTuPlan(VACIO, { hoy: MIER }).ok, '…y sin plan no hay nada que auditar');
let rojos = 0;
for (const p of CATALOGO_PLANES) {
  const f = usarPlan(VACIO, p.id, { hoy: LUNES }).fitness;
  for (const dia of ['2026-09-14', '2026-09-16', '2026-09-20']) {
    if (!auditarTuPlan(f, { hoy: dia }).ok) rojos += 1;
  }
}
ok(rojos === 0, `🚨 FIT F6 — los diecisiete planes pasan la auditoría en tres días distintos (${rojos} rojos)`);

/* Y puede ponerse roja (EH F42). */
const planVacio = crearPresetPlan({
  id: 'vacio', nombre: 'Vacío', entorno: 'casa', objetivo: 'fuerza', dificultad: 'principiante',
  frecuencia: 1, paraQuien: 'Prueba', dias: [{ nombre: 'A', lineas: [] }],
});
const auditMalo = auditarTuPlan(
  { planActivo: { planId: 'vacio', origen: 'preset', desde: LUNES } },
  { hoy: MIER, planes: [planVacio] },
);
ok(!auditMalo.ok, '⚠️ …y con un plan sin ejercicios se pone ROJA (EH F42)');
ok(auditMalo.problemas.some((x) => /distribuci[oó]n/i.test(x.que)), '…diciendo qué falla');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. Nada se guarda al mirar, y nada revienta sin datos ──');

ok(tuPlan(undefined).estado === 'sin_plan', 'Sin fitness no revienta');
ok(tuPlan(null).estado === 'sin_plan', '…ni con `null`');
ok(semanaDelPlan(null).length === 0 && semanaDelPlan({ dias: [] }).length === 0, '…ni la semana sin plan');
ok(proximoEntrenamiento(null) === null, '…ni el próximo entrenamiento');
ok(cabeceraDelPlan(null) === null, '…ni la cabecera');
ok(planActivoCompleto(undefined) === null, '…ni el plan activo');
ok(posicionDelDia(null, MIER) === null && posicionDelDia({ dias: [] }, MIER) === null,
  '…ni la posición del día');
ok(DIAS_SEMANA.length === 7, '⚠️ Y los días son los de `horario.js`, no una lista nueva');
const rutinaSuelta = rutinaAPlan(anadirEjercicio(crearRutina({ nombre: 'Mía' }), 'dominada-prona'));
ok(planDePlantilla(rutinaSuelta).dias[0].lineas.length === 1,
  '…y una rutina recién construida se envuelve sin perder su ejercicio');
ok(planActivoDe(F)?.desde === LUNES, '…y la fecha de activación sigue donde la dejó la F5');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
