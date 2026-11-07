// scripts/test-rutinas-ciclicas.mjs — Fitness 3/8: la biblioteca de rutinas y de plantillas.
//
// Las pruebas obligatorias del prompt 3 §14 (docs/15_FITNESS/PLAN_DESARROLLO/PLAN_MAESTRO_FITNESS.md)
// que se pueden comprobar sin pantalla: rutinas de 1, 7 y 30 días, fuera de rango, incompletas,
// plantillas repetidas, descansos, duplicar, editar, activar, cambiar, el ciclo, en uso, eliminar
// una plantilla de la rutina activa (días a descanso), conservar el historial, la papelera
// (eliminar y recuperar sin pisar asignaciones), integridad (sesiones, ids, predeterminadas) y la
// guardia de versión. Lo de pantalla está en `smoke-vistas.jsx` y en la sección «FIT 3/8» del
// recorrido de Chromium.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  rutinasPredeterminadas, plantillasPredeterminadas, rutinasDisponibles, plantillasDisponibles,
  rutinaDisponible, plantillaDisponible, usoDePlantilla, marcaDeUso, crearRutinaCiclica,
  cambiarDuracion, configurarDia, validarRutinaCiclica, puedeActivarse, posicionEnCiclo, inicioDelCiclo,
  rutinaComoPlan, activarRutina, quitarRutinaActiva, guardarRutinaCiclica, duplicarRutinaCiclica,
  rutinaParaEditar, prepararEliminarRutina, prepararEliminarPlantilla, avisoDeEliminarPlantillaEnUso,
  avisoDeEliminarRutina, huecosRecuperables, devolverAHuecos, olvidarHuecos, duplicarPlantillaDisponible,
  fichaDeRutina, rutinasPropias, planesPredeterminadosVisibles, rutinaActiva, DURACION_RUTINA,
  EXPLICACIONES_RUTINA, origenDePlantilla, textoDeDia,
} from '../src/lib/rutinasCiclicas.js';
import { CATALOGO_PLANES, planPorId, idPlantillaDeDia } from '../src/lib/planes.js';
import { planActivoCompleto, planificadoEnFecha, posicionDelDia, tuPlan } from '../src/lib/tuPlan.js';
import { normalizarFitnessConSesiones, empezarSesion, guardarSesion } from '../src/lib/entrenamiento.js';
import { prepararEliminacion, prepararRestauracion, CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { migrarFitness, apartarLoQueNoCarga } from '../src/lib/persistenciaFitness.js';
import { LISTAS_EN_CUARENTENA, DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { CAPAS_FITNESS } from '../src/lib/arquitecturaFitness.js';
import { ARCHIVOS_FITNESS } from '../src/lib/feedbackFitness.js';
import { terminosQueChocan } from '../src/lib/acabadoFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const cargar = (f) => normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f)));

/* Un martes y su semana. ⚠️ Las fechas se escriben, no se toman del reloj: estas
   pruebas pasan igual cualquier día (la lección de H-25). */
const HOY = '2026-11-03';
const sumar = (fecha, n) => { const d = new Date(`${fecha}T12:00:00`); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE'); };
const PUSH = idPlantillaDeDia('ppl-estetico-dia-1');
const PULL = idPlantillaDeDia('ppl-estetico-dia-2');
const vacio = () => cargar({});

/** Una rutina con los días dados: 'P' = Push, 'L' = Pull, 'D' = descanso. */
function rutina(nombre, patron) {
  let r = crearRutinaCiclica({ nombre, duracion: patron.length });
  patron.split('').forEach((c, i) => {
    r = configurarDia(r, r.dias[i].id, c === 'D' ? { tipo: 'descanso' } : { tipo: 'entreno', plantillaId: c === 'P' ? PUSH : PULL });
  });
  return r;
}
function guardada(f, r) {
  const g = guardarRutinaCiclica(f, r, { hoy: HOY });
  if (!g.ok) throw new Error(`No se guardó «${r.nombre}»: ${JSON.stringify(g.problemas)}`);
  return cargar(g.fitness);
}
function activada(f, id, hoy = HOY) {
  const a = activarRutina(f, id, { hoy, confirmado: true });
  if (!a.ok) throw new Error(`No se activó ${id}: ${a.motivo}`);
  return cargar(a.fitness);
}
/** Lo que toca una fecha, como lo lee Tu Plan. */
function toca(f, fecha, hoy = HOY) {
  const r = planActivoCompleto(f);
  const p = planificadoEnFecha(fecha, {
    plan: r && r.plan, desde: r && r.activo.desde, planId: r && r.activo.planId, origen: r && r.origen,
    anteriores: f.planesAnteriores, hoy,
  });
  if (!p) return null;
  return p.descanso ? 'D' : p.nombre;
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Lo predeterminado se conserva (D-05) ──');
ok(rutinasPredeterminadas().length === 17 && plantillasPredeterminadas().length === 63,
  'Las 17 rutinas predeterminadas (los planes) y sus 63 plantillas predeterminadas (sus días de entreno)');
ok(rutinasPredeterminadas().every((r) => planPorId(r.id)), '…cada rutina con el MISMO id que su plan');
ok(rutinasPredeterminadas().every((r) => igual(r.dias.map((d) => d.id), planPorId(r.id).dias.map((d) => d.id))),
  '…y con los mismos ids de día (`ppl-estetico-dia-1`…)');
ok(plantillasPredeterminadas().every((p) => p.id.endsWith('-plantilla') && !rutinasPredeterminadas().some((r) => r.dias.some((d) => d.id === p.id))),
  'Una plantilla predeterminada tiene su propio id, nunca el de su día (prompt 2 §4)');
{
  const p = CATALOGO_PLANES[0];
  const d = p.dias.find((x) => !x.descanso);
  const pl = plantillaDisponible(vacio(), idPlantillaDeDia(d.id));
  ok(pl && pl.nombre === d.nombre && igual(pl.ejercicios.map((l) => l.exerciseId), d.lineas.map((l) => l.exerciseId)),
    '…y son exactamente los ejercicios de su día, con su nombre («Push»)');
}
{
  const instantanea = JSON.parse(leer('scripts/instantanea-lineas-predeterminadas.json'));
  const ahora = CATALOGO_PLANES.flatMap((p) => p.dias.flatMap((d) => d.lineas.map((l) => `${l.id}|${l.exerciseId}`)));
  const desaparecidas = instantanea.filter((x) => !ahora.includes(x));
  ok(instantanea.length === 297 && desaparecidas.length === 0,
    `🚨 Los 297 ids de línea predeterminados no cambian ni se renumeran (instantánea)${desaparecidas.length ? ` — ${desaparecidas.slice(0, 3).join(', ')}` : ''}`);
  ok(new Set(ahora.map((x) => x.split('|')[0])).size === ahora.length, '…y no se repite ninguno');
  const recargado = (await import(`../src/lib/planes.js?otra=${Date.now()}`)).CATALOGO_PLANES;
  ok(igual(recargado.flatMap((p) => p.dias.flatMap((d) => d.lineas.map((l) => l.id))), ahora.map((x) => x.split('|')[0])),
    '🐛 …y son los mismos en cada carga (antes `crearLinea` les ponía un id aleatorio, H-01)');
}
ok(planesPredeterminadosVisibles(vacio()).every((p, i) => p === CATALOGO_PLANES[i]),
  '⚠️ Una predeterminada sin tocar es EL MISMO objeto del catálogo de siempre');
ok(planActivoCompleto(cargar({ planActivo: { planId: 'ppl-estetico', origen: 'preset', desde: '2026-10-01' } })).plan === planPorId('ppl-estetico'),
  '⚠️ …y activa, Tu Plan la lee igual que antes (nada de lo que funcionaba cambia)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Crear una rutina: 1 a 30 días, todos decididos ──');
{
  const r1 = crearRutinaCiclica({ nombre: 'Uno', duracion: 1 });
  const r7 = crearRutinaCiclica({ nombre: 'Siete', duracion: 7 });
  const r30 = crearRutinaCiclica({ nombre: 'Treinta', duracion: 30 });
  ok(r1.dias.length === 1 && r7.dias.length === 7 && r30.dias.length === 30, 'Se crean rutinas de 1, 7 y 30 días');
  ok(r7.dias.every((d) => d.tipo === null && d.plantillaId === null),
    '🚨 Todos sus días nacen SIN decidir (prompt 3 §4): ni entreno ni descanso de oficio');
  ok(!cambiarDuracion(r7, 0).ok && !cambiarDuracion(r7, 31).ok && !cambiarDuracion(r7, 2.5).ok,
    'Se rechazan las duraciones de 0, de 31 y las que no son un número entero de días');
  ok(cambiarDuracion(r7, 31).motivo === `Una rutina tiene entre ${DURACION_RUTINA.min} y ${DURACION_RUTINA.max} días.`, '…y se dice por qué');
  ok(cambiarDuracion(r7, 30).rutina.dias.length === 30 && cambiarDuracion(r7, 1).rutina.dias.length === 1, '…y se aceptan 1 y 30');
  const v = validarRutinaCiclica(r7, vacio());
  ok(!v.ok && v.problemas.some((p) => p.id === 'sin_configurar' && p.dias.length === 7),
    '🚨 No se guarda con días sin decidir, y dice cuáles');
  ok(!guardarRutinaCiclica(vacio(), r7, { hoy: HOY }).ok, '…`guardarRutinaCiclica` tampoco escribe nada');
  const casi = configurarDia(configurarDia(rutina('X', 'PD'), 'no-existe', { tipo: 'descanso' }), 'otro', { tipo: 'entreno' });
  ok(validarRutinaCiclica(casi, vacio()).ok, '…y con todos decididos, sí (configurar un día que no existe no cambia nada)');
  ok(!validarRutinaCiclica({ ...rutina('', 'PD') }, vacio()).ok, 'Sin nombre no se guarda');
  const conQuitados = cambiarDuracion(rutina('Q', 'PLD'), 1);
  ok(conQuitados.ok && conQuitados.quitados.map((d) => d.numero).join(',') === '2,3',
    'Encoger dice qué días ya decididos se quitarían, para preguntarlo antes');
  ok(cambiarDuracion(conQuitados.rutina, 3).rutina.dias.slice(1).every((d) => d.tipo === null),
    'Crecer añade días SIN decidir, nunca descansos automáticos');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Plantillas repetidas, descansos y una plantilla por día ──');
{
  const r = rutina('PPL', 'PLDPLDD');
  ok(r.dias.filter((d) => d.plantillaId === PUSH).length === 2, 'Una plantilla se repite en varios días (Push el 1 y el 4)');
  ok(r.dias.filter((d) => d.tipo === 'descanso').length === 3, 'Los días de descanso se marcan');
  const otra = configurarDia(r, r.dias[0].id, { tipo: 'entreno', plantillaId: PULL });
  ok(otra.dias[0].plantillaId === PULL && otra.dias.length === 7, 'Un día tiene UNA plantilla: asignar otra la sustituye');
  ok(configurarDia(r, r.dias[0].id, { tipo: 'entreno' }) === r, 'Un entrenamiento sin plantilla no se asigna');
  let f = guardada(vacio(), r);
  ok(f.rutinas.length === 1 && f.rutinas[0].dias.length === 7, 'Se guarda en `fitness.rutinas` con sus siete días');
  ok(textoDeDia(f, f.rutinas[0].dias[0]) === 'Push' && textoDeDia(f, f.rutinas[0].dias[2]) === 'Descanso'
    && textoDeDia(f, { tipo: null }) === 'Sin decidir', 'Cada día dice lo que es');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El ciclo se repite (ARQUITECTURA §7) ──');
{
  let f = guardada(vacio(), rutina('Tres', 'PDL'));
  const id = f.rutinas[0].id;
  f = activada(f, id);
  ok(f.planActivo.origen === 'rutina' && f.planActivo.desde === HOY && f.planActivo.inicioCiclo === HOY,
    'Una rutina suya se activa con origen `rutina` y empieza hoy por el día 1');
  const seq = Array.from({ length: 9 }, (_, i) => toca(f, sumar(HOY, i)));
  ok(igual(seq, ['Push', 'D', 'Pull', 'Push', 'D', 'Pull', 'Push', 'D', 'Pull']),
    `🚨 Al acabar el último día vuelve al primero: ${seq.join(' · ')}`);
  ok(toca(f, sumar(HOY, -1)) === null, '…y el ciclo no se proyecta hacia atrás (antes de activarla no toca nada)');
  ok(posicionEnCiclo(3, HOY, sumar(HOY, 300)) === 300 % 3 && posicionEnCiclo(30, HOY, sumar(HOY, 59)) === 29,
    'La posición es la cuenta de días desde el día 1, módulo la duración (también con 30)');
  ok(posicionEnCiclo(3, HOY, sumar(HOY, -2)) === null, '…y nada antes del inicio');
  const r1 = guardada(vacio(), rutina('Uno', 'P'));
  const f1 = activada(r1, r1.rutinas[0].id);
  ok([0, 1, 2, 5].every((n) => toca(f1, sumar(HOY, n)) === 'Push'), 'Una rutina de 1 día toca todos los días');
  /* Las predeterminadas siguen la semana de lunes a domingo, como siempre. */
  const fp = activada(vacio(), 'ppl-estetico');
  ok(!fp.planActivo.inicioCiclo && inicioDelCiclo(fp.planActivo, 7, HOY) === '2026-11-02',
    'Una predeterminada se activa sin `inicioCiclo`: sigue siendo la semana de lunes a domingo');
  ok(toca(fp, '2026-11-09') === planPorId('ppl-estetico').dias[0].nombre, '…y el lunes es su día 1');
  ok(posicionDelDia(planPorId('ppl-estetico'), '2026-11-05') === 3, '…con la misma regla de siempre (jueves = día 4)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Activar y cambiar de rutina sin perder nada ──');
{
  let f = guardada(vacio(), rutina('Mía', 'PD'));
  const mia = f.rutinas[0].id;
  f = activada(f, 'ppl-estetico', '2026-10-01');
  const sinConfirmar = activarRutina(f, mia, { hoy: HOY });
  ok(!sinConfirmar.ok && sinConfirmar.motivo === 'confirmacion' && /PPL Estético/.test(sinConfirmar.aviso.que),
    'Con otra activa, SIN confirmar no escribe nada y pregunta diciendo cuál se va');
  /* Una sesión hecha con la anterior. */
  const s = { ...empezarSesion({ nombre: 'Push', lineas: [], planId: 'ppl-estetico', origenTipo: 'preset', origenId: 'ppl-estetico-dia-1', hoy: '2026-10-05' }), estado: 'completada' };
  f = cargar(guardarSesion(f, s));
  f = activada(f, mia);
  ok(f.planActivo.planId === mia && f.sesiones.length === 1 && f.sesiones[0].id === s.id,
    '🚨 Cambiar de rutina no borra ni toca las sesiones (el progreso se queda)');
  const tramo = f.planesAnteriores.find((a) => a.planId === 'ppl-estetico');
  ok(tramo && tramo.desde === '2026-10-01' && tramo.hasta === HOY && tramo.dias.length === 7,
    '…la anterior queda apuntada como tramo, con su estructura');
  ok(tramo.dias.filter((d) => !d.descanso).every((d) => d.plantillaId === idPlantillaDeDia(d.id)),
    '…y con la plantilla de cada día');
  ok(toca(f, '2026-10-05') === 'Push', '…así el pasado se sigue leyendo con la rutina de entonces');
  ok(rutinaDisponible(f, 'ppl-estetico'), '…y la anterior sigue en la biblioteca');
  /* Volver a cambiar: el tramo de una rutina suya se cierra con SU estructura. */
  const f2 = activada(f, 'ppl-estetico', sumar(HOY, 3));
  const tramoMia = f2.planesAnteriores.find((a) => a.planId === mia);
  ok(tramoMia && tramoMia.origen === 'rutina' && tramoMia.inicioCiclo === HOY && tramoMia.dias[0].plantillaId === PUSH,
    '🐛 Una rutina suya también deja su tramo al cambiar (con `planes.js` solo se habría perdido)');
  ok(toca(f2, sumar(HOY, 2)) === 'Push', '…y sus días pasados se leen con su ciclo (día 3 = día 1 otra vez)');
  const q = cargar(quitarRutinaActiva(f2, { hoy: sumar(HOY, 10) }));
  ok(q.planActivo === null && q.planesAnteriores.length === f2.planesAnteriores.length + 1,
    'Quitar la rutina activa también deja su tramo');
  const soloDescanso = guardada(vacio(), rutina('Sofá', 'DD'));
  ok(!puedeActivarse(soloDescanso.rutinas[0], soloDescanso).ok && !activarRutina(soloDescanso, soloDescanso.rutinas[0].id, { hoy: HOY }).ok,
    'Una rutina solo de descanso no se activa, y se dice por qué');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Editar y duplicar ──');
{
  let f = guardada(vacio(), rutina('Base', 'PLD'));
  const id = f.rutinas[0].id;
  const dup = duplicarRutinaCiclica(f, id, { hoy: HOY });
  ok(dup.ok && dup.copia.id !== id && dup.copia.nombre !== 'Base' && dup.copia.dias.every((d, i) => d.id !== f.rutinas[0].dias[i].id),
    'Duplicar da ids nuevos a la rutina y a cada día, y otro nombre');
  ok(igual(dup.copia.dias.map((d) => d.plantillaId), f.rutinas[0].dias.map((d) => d.plantillaId)),
    '…con las mismas plantillas (la rutina las referencia, no las contiene)');
  f = cargar(dup.fitness);
  const editada = { ...rutinaParaEditar(f, id), nombre: 'Base renombrada' };
  f = guardada(f, editada);
  ok(rutinaDisponible(f, id).nombre === 'Base renombrada' && f.rutinas.length === 2, 'Editar (renombrar) conserva el id y no duplica');
  ok(rutinaDisponible(f, dup.copia.id).nombre === dup.copia.nombre, '…y la copia no cambia');
  /* Duplicar una predeterminada: suya, apuntando de dónde viene. */
  const dp = duplicarRutinaCiclica(vacio(), 'ppl-estetico', { hoy: HOY });
  ok(dp.ok && dp.copia.origen === 'propia' && dp.copia.basePredeterminada === 'ppl-estetico' && rutinasPropias(cargar(dp.fitness)).length === 1,
    'Duplicar una predeterminada da una rutina SUYA, que dice de cuál viene');
  /* Editar una predeterminada: copia con el mismo id. */
  const p = rutinaParaEditar(vacio(), 'ppl-estetico');
  const pe = guardada(vacio(), { ...p, nombre: 'Mi PPL', dias: [...p.dias.slice(0, 6), { ...p.dias[6] }] });
  ok(pe.rutinas.length === 1 && pe.rutinas[0].id === 'ppl-estetico' && pe.rutinas[0].origen === 'predeterminada',
    'Editar una predeterminada guarda su COPIA con el mismo id (AT-03)');
  ok(rutinasDisponibles(pe).filter((r) => r.id === 'ppl-estetico').length === 1 && rutinaDisponible(pe, 'ppl-estetico').nombre === 'Mi PPL',
    '…y la copia gana a la del código, sin salir dos veces');
  ok(planesPredeterminadosVisibles(pe)[0].nombre === 'Mi PPL' && planesPredeterminadosVisibles(pe).length === 17,
    '…también en la biblioteca, que sigue teniendo 17');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Editar la rutina activa no reescribe el pasado (§7.5) ──');
{
  let f = guardada(vacio(), rutina('Activa', 'PLD'));
  const id = f.rutinas[0].id;
  f = activada(f, id, '2026-10-01');
  ok(toca(f, '2026-10-01') === 'Push' && toca(f, '2026-10-02') === 'Pull', 'Antes de editar: día 1 Push, día 2 Pull');
  /* Hoy (2026-11-03) es el día 34 desde el 1 de octubre: posición 33 % 3 = 0, Push. */
  const antes = rutinaDisponible(f, id);
  const nueva = { ...antes, dias: [antes.dias[2], antes.dias[0], antes.dias[1], { id: 'extra', tipo: 'descanso', plantillaId: null }] };
  f = guardada(f, nueva);
  ok(f.planActivo.desde === HOY && f.planesAnteriores.some((a) => a.planId === id && a.hasta === HOY),
    'Cambiar su estructura cierra un tramo con la de antes');
  ok(toca(f, '2026-10-02') === 'Pull' && toca(f, '2026-10-03') === 'D',
    '🚨 …y los días pasados siguen diciendo lo que tocaba entonces');
  ok(toca(f, HOY) === 'Push', '…y hoy sigue tocando el mismo día (se conserva por su id: Push)');
  ok(toca(f, sumar(HOY, 1)) === 'Pull' && toca(f, sumar(HOY, 2)) === 'D' && toca(f, sumar(HOY, 3)) === 'D' && toca(f, sumar(HOY, 4)) === 'Push',
    '…y a partir de hoy, el ciclo nuevo de 4 días');
  const soloNombre = guardada(f, { ...rutinaDisponible(f, id), nombre: 'Otro nombre' });
  ok(soloNombre.planesAnteriores.length === f.planesAnteriores.length, 'Cambiar solo el nombre no crea un tramo');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. En uso: identificar las plantillas asignadas ──');
{
  let f = guardada(vacio(), rutina('Activa', 'PDP'));
  const id = f.rutinas[0].id;
  const mia = { ...plantillaDisponible(vacio(), PUSH), id: 'mi-plantilla', nombre: 'Mía', meta: {} };
  f = cargar({ ...f, plantillas: [mia] });
  f = activada(f, id);
  const u = usoDePlantilla(f, PUSH);
  ok(u.enActiva && u.usos.find((x) => x.activa).dias.join(',') === '1,3', 'Push está en la rutina activa, días 1 y 3');
  ok(u.enOtras && u.usos.some((x) => x.rutinaId === 'ppl-estetico'), '…y también en otras rutinas (la predeterminada)');
  ok(marcaDeUso(u).id === 'activa' && marcaDeUso(u).texto === 'En tu rutina activa', '…y la marca dice «En tu rutina activa»');
  ok(marcaDeUso(usoDePlantilla(f, PULL)).id === 'otras', 'Una que solo está en otras rutinas lo dice distinto');
  ok(usoDePlantilla(f, 'mi-plantilla').libre && marcaDeUso(usoDePlantilla(f, 'mi-plantilla')) === null,
    '…y una sin asignar no lleva marca (nada de llenar la biblioteca de etiquetas)');
  ok(plantillasDisponibles(f).length === 64 && plantillasDisponibles(f)[0].id === 'mi-plantilla',
    'La biblioteca tiene las suyas primero y las 63 predeterminadas');
  ok(origenDePlantilla(plantillaDisponible(f, PUSH)) === 'de PPL Estético' && origenDePlantilla(mia) === '',
    'Una predeterminada dice de qué rutina viene; una suya, no');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Eliminar una plantilla de la rutina activa: sus días pasan a descanso ──');
{
  const mia = { ...plantillaDisponible(vacio(), PUSH), id: 'mi-push', nombre: 'Mi Push', meta: {} };
  let f = cargar({ plantillas: [mia] });
  let r = crearRutinaCiclica({ nombre: 'Activa', duracion: 3 });
  r = configurarDia(configurarDia(configurarDia(r, r.dias[0].id, { tipo: 'entreno', plantillaId: 'mi-push' }), r.dias[1].id, { tipo: 'descanso' }), r.dias[2].id, { tipo: 'entreno', plantillaId: 'mi-push' });
  f = guardada(f, r);
  let r2 = crearRutinaCiclica({ nombre: 'Guardada', duracion: 1 });
  r2 = configurarDia(r2, r2.dias[0].id, { tipo: 'entreno', plantillaId: 'mi-push' });
  f = guardada(f, r2);
  f = activada(f, r.id, '2026-10-30');
  /* Una sesión hecha con ella, antes. */
  const s = { ...empezarSesion({ nombre: 'Mi Push', lineas: mia.ejercicios, planId: r.id, origenTipo: 'rutina', origenId: r.dias[0].id, hoy: '2026-10-30' }), estado: 'completada' };
  f = cargar(guardarSesion(f, s));
  const aviso = avisoDeEliminarPlantillaEnUso(f, 'mi-push');
  ok(aviso.enActiva && /rutina activa/.test(aviso.que) && /días 1, 3 pasarán a ser de descanso/.test(aviso.que) && /Guardada/.test(aviso.otras),
    'La confirmación dice que está en la rutina activa, qué días pasan a descanso y que la otra rutina no se toca');
  const prep = prepararEliminarPlantilla(f, 'mi-push', { hoy: HOY });
  const papel = prepararEliminacion(prep.fitness, 'fitness', 'plantillas', 'mi-push', `${HOY}T10:00:00Z`);
  const fd = cargar(papel.moduloActualizado);
  const activa = rutinaDisponible(fd, r.id);
  ok(activa.dias[0].tipo === 'descanso' && activa.dias[2].tipo === 'descanso' && activa.dias[1].tipo === 'descanso',
    '🚨 Los días de la rutina activa que la usaban pasan a ser de descanso');
  ok(puedeActivarse(activa, fd).ok === false && validarRutinaCiclica(activa, fd).ok,
    '…la rutina sigue siendo válida (todos sus días decididos)');
  ok(rutinaDisponible(fd, r2.id).dias[0].plantillaId === 'mi-push' && !puedeActivarse(rutinaDisponible(fd, r2.id), fd).ok,
    '…la rutina NO activa no se toca en silencio, y no se puede activar hasta reasignarla');
  ok(fichaDeRutina(fd, rutinaDisponible(fd, r2.id)).motivo.includes('ya no está'), '…y lo dice');
  ok(toca(fd, '2026-10-30') === 'Mi Push' || toca(fd, '2026-10-30') === 'Plantilla eliminada',
    '…el pasado sigue sabiendo que el 30 de octubre era un día de entreno');
  ok(fd.sesiones.length === 1 && fd.sesiones[0].id === s.id && fd.sesiones[0].origen.ejercicios.length === mia.ejercicios.length,
    '🚨 El historial de esa plantilla no se toca: la sesión sigue con su fotografía');
  ok(papel.entrada.datos.meta.huecos.length === 2 && papel.entrada.tipo === CATALOGO_PAPELERA['fitness.plantillas'].tipo,
    'Va a Eliminados recientemente entera, y se lleva dónde estaba');

  /* ── Recuperar: los huecos libres se ofrecen; los ocupados no se pisan. ── */
  const ocupado = guardada(fd, configurarDia(rutinaDisponible(fd, r.id), r.dias[2].id, { tipo: 'entreno', plantillaId: PULL }));
  const rest = prepararRestauracion(ocupado, papel.entrada);
  const fr = cargar(rest.moduloActualizado);
  const pl = plantillaDisponible(fr, 'mi-push');
  ok(pl && pl.nombre === 'Mi Push' && pl.ejercicios.length === mia.ejercicios.length, 'Se recupera entera desde la papelera');
  const h = huecosRecuperables(fr, pl);
  ok(h.length === 1 && h[0].numero === 1, '🚨 Se ofrece volver SOLO al día que sigue de descanso (el 3 ya tiene otra)');
  const dv = cargar(devolverAHuecos(fr, 'mi-push', { hoy: HOY }).fitness);
  const activa2 = rutinaDisponible(dv, r.id);
  ok(activa2.dias[0].plantillaId === 'mi-push' && activa2.dias[2].plantillaId === PULL,
    '…y al aceptar vuelve a su día sin sobrescribir la asignación posterior');
  ok(!plantillaDisponible(dv, 'mi-push').meta.huecos, '…y deja de ofrecerse');
  ok(!plantillaDisponible(cargar(olvidarHuecos(fr, 'mi-push')), 'mi-push').meta.huecos, '«Dejarlo como está» también la olvida, sin tocar la rutina');
  ok(rutinaDisponible(fr, r2.id) && puedeActivarse(rutinaDisponible(fr, r2.id), fr).ok,
    '…y la rutina no activa vuelve a estar completa sola (su id nunca se tocó)');
  /* La rutina original también eliminada: la plantilla vuelve sin relaciones incorrectas. */
  const sinRutina = cargar({ ...fd, rutinas: fd.rutinas.filter((x) => x.id !== r.id), planActivo: null });
  const r3 = cargar(prepararRestauracion(sinRutina, papel.entrada).moduloActualizado);
  ok(plantillaDisponible(r3, 'mi-push') && huecosRecuperables(r3, plantillaDisponible(r3, 'mi-push')).length === 0,
    'Con la rutina original también eliminada, la plantilla vuelve a la biblioteca sin crear relaciones');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Eliminar y recuperar rutinas (también las predeterminadas) ──');
{
  let f = guardada(vacio(), rutina('Borrable', 'PD'));
  const id = f.rutinas[0].id;
  f = activada(f, id);
  const aviso = avisoDeEliminarRutina(f, id);
  ok(aviso.activa && /rutina activa/.test(aviso.titulo) && /Eliminados recientemente/.test(aviso.vuelve),
    'Eliminar la activa avisa de que lo es y de dónde se recupera');
  const prep = prepararEliminarRutina(f, id, { hoy: sumar(HOY, 2) });
  const papel = prepararEliminacion(prep.fitness, 'fitness', 'rutinas', id, `${HOY}T10:00:00Z`);
  const fd = cargar(papel.moduloActualizado);
  ok(fd.planActivo === null && !rutinaDisponible(fd, id) && fd.planesAnteriores.some((a) => a.planId === id),
    'Eliminar la activa la desactiva (con su tramo) y la quita de la biblioteca');
  ok(papel.entrada.tipo === 'Rutina de entrenamiento' && CATALOGO_PAPELERA['fitness.rutinas'], '…y va a la papelera general como «Rutina de entrenamiento»');
  const fr = cargar(prepararRestauracion(fd, papel.entrada).moduloActualizado);
  ok(rutinaDisponible(fr, id) && igual(rutinaDisponible(fr, id).dias, rutinaDisponible(f, id).dias),
    'Se recupera entera, con sus días y sus plantillas');
  /* Una predeterminada. ⚠️ El id sale del catálogo, no de la memoria (FIT F22). */
  const OTRA = (CATALOGO_PLANES.find((x) => x.id === 'full-body-casa') || {}).id;
  if (!OTRA) throw new Error('El catálogo ya no tiene «full-body-casa»: cambia la rutina de esta prueba.');
  const p0 = vacio();
  const pp = prepararEliminarRutina(p0, OTRA, { hoy: HOY });
  const pPapel = prepararEliminacion(pp.fitness, 'fitness', 'rutinas', OTRA, `${HOY}T10:00:00Z`);
  const borrada = cargar(pPapel.moduloActualizado);
  ok(!rutinaDisponible(borrada, OTRA) && planesPredeterminadosVisibles(borrada).length === 16
    && borrada.predeterminadasRetiradas.rutinas.includes(OTRA),
    'Una predeterminada también se elimina: deja de verse (17 → 16) y queda retirada');
  ok(rutinaDisponible(cargar(prepararRestauracion(borrada, pEntrada(pPapel)).moduloActualizado), OTRA),
    '…y se recupera desde la papelera (la copia gana a la retirada)');
  ok(!rutinaDisponible(cargar(JSON.parse(JSON.stringify(borrada))), OTRA),
    '…y si la papelera la purga (no se restaura nunca), tampoco vuelve del código al recargar');
  function pEntrada(x) { return x.entrada; }
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Plantillas: crear, editar, duplicar (también predeterminadas) ──');
{
  const d = duplicarPlantillaDisponible(vacio(), PUSH, { hoy: HOY });
  ok(d.ok && d.fitness.plantillas.length === 1 && d.copia.id !== PUSH && d.copia.meta.origen === 'propia',
    'Duplicar una predeterminada guarda SOLO la copia (no las 63) y es suya');
  ok(d.copia.ejercicios.every((l, i) => l.id !== plantillaDisponible(vacio(), PUSH).ejercicios[i].id),
    '…con ids nuevos en cada línea (editar la copia no toca la original)');
  const conConfig = cargar({ plantillas: [{ ...plantillaDisponible(vacio(), PUSH), id: 'p1', meta: {}, ejercicios: plantillaDisponible(vacio(), PUSH).ejercicios.map((l) => ({ ...l, config: { progresion: true } })) }] });
  const d2 = duplicarPlantillaDisponible(conConfig, 'p1', { hoy: HOY });
  ok(d2.copia.ejercicios.every((l) => l.config && l.config.progresion === true), '…y conserva la configuración de cada línea');
  /* Editar una predeterminada = guardar su copia con el mismo id (el constructor lo hace con `guardarRutina`). */
  const editada = cargar({ plantillas: [{ ...plantillaDisponible(vacio(), PUSH), nombre: 'Push editado' }] });
  ok(plantillasDisponibles(editada).filter((p) => p.id === PUSH).length === 1 && plantillaDisponible(editada, PUSH).nombre === 'Push editado',
    'Editar una predeterminada: su copia gana, sin salir dos veces');
  ok(rutinaComoPlan(editada, rutinaDisponible(editada, 'ppl-estetico')).dias[0].nombre === 'Push editado',
    '…y la rutina que la usa lo ve al momento (se guarda el id, no una copia)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Integridad ──');
{
  /* Editar una plantilla no altera las sesiones anteriores. */
  const mia = { ...plantillaDisponible(vacio(), PUSH), id: 'p-int', nombre: 'Integridad', meta: {} };
  let f = cargar({ plantillas: [mia] });
  const s = { ...empezarSesion({ nombre: 'Integridad', lineas: mia.ejercicios, planId: 'p-int', origenTipo: 'plantilla', origenId: 'p-int', hoy: '2026-10-20' }), estado: 'completada' };
  f = cargar(guardarSesion(f, s));
  const antes = JSON.stringify(f.sesiones);
  f = cargar({ ...f, plantillas: [{ ...mia, ejercicios: mia.ejercicios.slice(0, 1), nombre: 'Cambiada' }] });
  ok(JSON.stringify(f.sesiones) === antes, 'Editar una plantilla no altera las sesiones anteriores');
  /* No duplicar sesiones: activar, editar, borrar y restaurar rutinas no crea ni quita ninguna. */
  let g = guardada(f, rutina('R', 'PD'));
  g = activada(g, g.rutinas[0].id);
  g = cargar(prepararEliminarRutina(g, g.rutinas[0].id, { hoy: HOY }).fitness);
  ok(g.sesiones.length === 1 && g.sesiones[0].id === s.id, 'Ninguna operación de rutinas crea, duplica ni quita sesiones');
  /* La carga conserva lo nuevo (regla 5) y aparta lo que no entiende. */
  const crudo = { rutinas: [rutina('Buena', 'PD'), { id: 'mala', nombre: 'Mala', dias: [{ id: 'd', tipo: 'raro' }] }], predeterminadasRetiradas: { rutinas: ['ppl-estetico', 'ppl-estetico'] }, planActivo: { planId: 'x', origen: 'rutina', desde: HOY, inicioCiclo: '2026-11-01' } };
  const n = normalizarFitnessConSesiones(crudo);
  ok(n.rutinas.length === 1 && n.rutinas[0].nombre === 'Buena', 'La puerta de carga deja pasar las rutinas válidas…');
  const ap = apartarLoQueNoCarga(crudo, n);
  ok(ap.nuevos.some((x) => x.de === 'rutinas' && x.original.id === 'mala'), '…y aparta en la cuarentena la que no entiende, con su original');
  ok(LISTAS_EN_CUARENTENA.includes('rutinas'), '…porque `rutinas` es una de las listas con id');
  ok(igual(n.predeterminadasRetiradas.rutinas, ['ppl-estetico']) && n.planActivo.inicioCiclo === '2026-11-01',
    'Se conservan las retiradas (sin repetir) y el `inicioCiclo` de la activa (regla 5)');
  const tramo = normalizarFitnessConSesiones({ planesAnteriores: [{ planId: 'a', desde: '2026-10-01', hasta: '2026-10-10', inicioCiclo: '2026-10-01', dias: [{ id: 'd1', plantillaId: 'p' }, { id: 'd2', descanso: true }] }] }).planesAnteriores[0];
  ok(tramo.inicioCiclo === '2026-10-01' && tramo.dias[0].plantillaId === 'p' && tramo.dias[1].plantillaId === null,
    '…y el `inicioCiclo` y la plantilla de cada día de un tramo');
  ok(igual(DEFAULT_FITNESS.rutinas, []) && igual(DEFAULT_FITNESS.predeterminadasRetiradas, { rutinas: [], plantillas: [] }),
    'Las dos claves nuevas nacen vacías');
  /* Lo que había antes de esta fase se carga igual. */
  const viejo = { version: 1, planActivo: { planId: 'ppl-estetico', origen: 'preset', desde: '2026-09-01' }, planesAnteriores: [{ planId: 'upper-lower', origen: 'preset', desde: '2026-08-01', hasta: '2026-09-01', nombre: 'Upper / Lower', dias: [{ id: 'upper-lower-dia-1', nombre: 'Upper', descanso: false }] }] };
  const cv = normalizarFitnessConSesiones(viejo);
  ok(cv.planActivo.planId === 'ppl-estetico' && !cv.planActivo.inicioCiclo && cv.planesAnteriores[0].dias[0].plantillaId === null,
    'Lo guardado antes de la Fase 3 se carga igual, sin inventarle campos');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. La guardia de versión (AT-08, G0) ──');
{
  const futura = migrarFitness({ version: 99, sesiones: [] });
  ok(futura.futura === true && futura.fitness.version === 99, '`migrarFitness` reconoce datos de una versión más nueva');
  const app = leer('src/App.jsx');
  ok(/fitnessSoloLecturaRef\.current = !!migracionFit\.futura/.test(app), 'App.jsx lo apunta al cargar');
  ok(/if \(fitnessSoloLecturaRef\.current\) return NO_GUARDA_FITNESS;/.test(app), '…y entonces `guardarFitness` no guarda');
  ok(/if \(patch\.fitness && !fitnessSoloLecturaRef\.current\)/.test(app), '…ni `snapshotAndSave`');
  ok(/if \(modulo === 'fitness' && fitnessSoloLecturaRef\.current\) return;/.test(app)
    && /if \(entrada\.modulo === 'fitness' && fitnessSoloLecturaRef\.current\) return;/.test(app),
    '…ni la papelera borra ni restaura nada de Fitness');
  ok(/soloLectura=\{fitnessSoloLectura\}/.test(app) && /props\.soloLectura && <AvisoSoloLectura \/>/.test(leer('src/views/FitnessView.jsx')),
    '…y la pantalla lo dice');
  ok(/if \(modulo === 'fitness' && \(coleccion === 'rutinas' \|\| coleccion === 'plantillas'\)\)/.test(app),
    'Las rutinas y las plantillas entran a la papelera por su puerta (copia y retirada, días a descanso)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 14. Mapa, vocabulario y explicaciones ──');
ok(CAPAS_FITNESS.find((c) => c.id === 'motores').archivos.includes('src/lib/rutinasCiclicas.js')
  && CAPAS_FITNESS.find((c) => c.id === 'pantallas').archivos.includes('src/views/EditorRutinaView.jsx'),
  'Los dos archivos nuevos están en su capa de `CAPAS_FITNESS`');
ok(ARCHIVOS_FITNESS.includes('src/views/EditorRutinaView.jsx'), '…y el editor, en la lista que recorren las auditorías');
ok(terminosQueChocan('Tus rutinas · Crear rutina').length === 0, '«Rutina» es el término oficial del ciclo (prompt 1 §4)');
{
  /* Lo que él construye sigue siendo una «plantilla»: las pantallas de plantillas no la llaman «rutina». */
  const sinComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const textos = (src) => [...sinComentarios(src).matchAll(/>([^<>{}\n]*[a-záéíóú][^<>{}\n]*)</g)].map((m) => m[1]);
  /* Las dos frases de «Dónde se usa» hablan de la RUTINA (el ciclo) en la que está la
     plantilla, que es justo su significado: se admiten por su texto exacto, y nada más. */
  const PERMITIDAS = ['No está asignada a ninguna rutina.', ' · tu rutina activa'];
  const enPlantillas = ['src/views/PlantillasView.jsx', 'src/views/ConstructorView.jsx']
    .flatMap((p) => textos(leer(p)).filter((t) => /\brutinas?\b/i.test(t) && !/=>|[();=]/.test(t) && !PERMITIDAS.includes(t)).map((t) => `${p}: ${t}`));
  ok(enPlantillas.length === 0, `…y las pantallas de plantillas no llaman «rutina» a una plantilla${enPlantillas.length ? ` — ${enPlantillas.join('; ')}` : ''}`);
}
ok(Object.values(EXPLICACIONES_RUTINA).length === 5 && Object.keys(EXPLICACIONES_RUTINA).join(',') === 'rutina,dia,plantilla,descanso,enUso',
  'La pantalla explica qué es una rutina, un día, una plantilla, el descanso y «en uso» (prompt 3 §12)');
ok(rutinaActiva(vacio()) === null && tuPlan(vacio()).estado === 'sin_plan', 'Sin rutina activa, Tu Plan lo dice como siempre');

console.log('\n── 15. Las comprobaciones pueden ponerse rojas (EH F42) ──');
ok(!igual(['Push', 'D', 'Pull', 'Push'], ['Push', 'D', 'Pull', 'Pull']), 'Un ciclo que no volviera al día 1 se vería');
ok(!rutinaDisponible(vacio(), 'no-existe') && !plantillaDisponible(vacio(), 'no-existe'), 'Lo que no existe no se inventa');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
