// ============================================================================
// HT · Fase 9/12 — Pruebas del planificador
//
// Lo que más se comprueba son las cinco reglas que no se negocian:
//   1. **La IA nunca escribe**: sin confirmar, `aplicarPlan` no hace nada.
//   2. **Los números salen del motor**, no de una estimación.
//   3. **No se manda toda la base de datos**, y las notas privadas NUNCA salen.
//   4. **No decide por ti**: devuelve opciones.
//   5. **No castiga**: nada de "has fallado".
// ============================================================================

import {
  PESOS, puntuacionPrioridad, motivoDePrioridad, ordenarPorPrioridad,
  MARGEN_MINUTOS, TRANSICION_MINUTOS, DEFAULT_PREFERENCIAS, normalizarPreferencias,
  huecosAdecuados, planDeEstudio, replanificarEstudio, huecosParaMover,
  mapaDeCarga, detectarSobrecarga,
  ACCIONES_IA, accionIA, validarAccion, previsualizarPlan, describirAccion, aplicarPlan,
  contextoParaIA, NIVELES_AUTONOMIA, nivelAutonomia,
  explicarPlan, planAlternativo, compararPlanes, resumenPlanificador,
} from '../src/lib/planificador.js';
import { DEFAULT_HORARIO_TOP } from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';
import { editarActividad } from '../src/lib/actividades.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-24';        // lunes
const VIERNES = '2026-08-28';
const AYER = '2026-08-23';

function montar() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (d) => horario.columnas.find((c) => c.dia === d);
  let e = estado;
  // Clase de 8 a 9 y entrenamiento de 18 a 19: quedan huecos de sobra.
  for (const dia of [1, 2, 3, 4, 5]) {
    e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(dia).id, inicio: '08:00', fin: '09:00', texto: 'Clase', hoy: HOY }).estado;
  }
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '18:00', fin: '19:00', texto: 'Entrenamiento', hoy: HOY }).estado;
  return { estado: e, horario, col };
}

const PROD = { tareas: [{ id: 't1', texto: 'Vencida', fecha: AYER, hecha: false }, { id: 't2', texto: 'Para hoy', fecha: HOY, hecha: false }] };
const EST = { asignaturas: [{ id: 'a1', nombre: 'Biología' }], examenes: [{ id: 'x1', asignaturaId: 'a1', fecha: VIERNES, tema: 'Temas 1-3' }] };

/* ===========================================================================
   PRIORIDAD
   =========================================================================== */
console.log('\n═══ Prioridad y orden ═══\n');
{
  const vencida = { estado: 'vencida', tipo: 'tarea', fecha: AYER, diasDeRetraso: 1, prioridad: 'normal' };
  const dehoy = { estado: 'hoy', tipo: 'tarea', fecha: HOY, prioridad: 'normal' };
  const lejana = { estado: 'proxima', tipo: 'tarea', fecha: '2026-09-20', prioridad: 'normal' };
  const examen = { estado: 'proxima', tipo: 'examen', fecha: VIERNES, prioridad: 'alta' };

  comprobar('Lo vencido pesa más que lo de hoy', puntuacionPrioridad(vencida, { hoy: HOY }) > puntuacionPrioridad(dehoy, { hoy: HOY }));
  comprobar('Y lo de hoy más que algo de dentro de un mes',
    puntuacionPrioridad(dehoy, { hoy: HOY }) > puntuacionPrioridad(lejana, { hoy: HOY }));
  comprobar('CRITERIO · Un examen próximo sube (apartado 21)',
    puntuacionPrioridad(examen, { hoy: HOY }) > puntuacionPrioridad(lejana, { hoy: HOY }));
  comprobar('⚠️ CLAVE · Algo muy lejano no se hunde sin fondo: la resta está topada',
    puntuacionPrioridad({ ...lejana, fecha: '2030-01-01' }, { hoy: HOY }) >= -40);
  comprobar('Algo sin fecha no resta nada', puntuacionPrioridad({ estado: 'sin_fecha', tipo: 'tarea' }) >= 0);

  comprobar('CRITERIO · Se ordenan (apartado 20)', ordenarPorPrioridad([lejana, vencida, dehoy], { hoy: HOY })[0].estado === 'vencida');
  comprobar('⚠️ CLAVE · Y cada una dice POR QUÉ está ahí (apartado 67)',
    motivoDePrioridad(vencida, { hoy: HOY }).includes('1 día'));
  comprobar('CLAVE · Un examen mañana lo dice así', motivoDePrioridad({ tipo: 'examen', fecha: '2026-08-25' }, { hoy: HOY }) === 'Es mañana.');
  comprobar('CLAVE · El número NO se enseña: lo que sirve es el orden y el motivo',
    typeof ordenarPorPrioridad([vencida], { hoy: HOY })[0].motivo === 'string');
}

/* ===========================================================================
   HUECOS ADECUADOS
   =========================================================================== */
console.log('\n═══ Huecos donde de verdad cabe algo ═══\n');
{
  const { estado } = montar();
  comprobar('Hay margen y transición', MARGEN_MINUTOS > 0 && TRANSICION_MINUTOS > 0);
  comprobar('Las preferencias tienen valores razonables', DEFAULT_PREFERENCIAS.duracionSesion === 45);
  comprobar('⚠️ CLAVE · Una sesión de 5 minutos o de 6 horas se acota',
    normalizarPreferencias({ duracionSesion: 2 }).duracionSesion === 15
    && normalizarPreferencias({ duracionSesion: 999 }).duracionSesion === 180);
  comprobar('Una hora mal escrita cae en la de por defecto', normalizarPreferencias({ desde: 'zzz' }).desde === '09:00');

  const h = huecosAdecuados(estado, HOY, { duracion: 45 });
  comprobar('CRITERIO · Se encuentran huecos (apartado 13)', h.length > 0);
  comprobar('⚠️ CLAVE · El hueco empieza DESPUÉS de la transición, no pegado a la clase',
    h[0].inicio !== '09:00');
  comprobar('CLAVE · Y la sesión dura lo que se pidió', h[0].fin > h[0].inicio);
  comprobar('CRITERIO · Un hueco demasiado corto NO se ofrece (apartado 14)',
    huecosAdecuados(estado, HOY, { duracion: 700 }).length === 0);

  // Apartado 44 — "no estudiar después de entrenar".
  const sinDespues = huecosAdecuados(estado, HOY, { duracion: 45, preferencias: { evitarDespuesDe: ['entrenamiento'], hasta: '23:00' } });
  comprobar('⚠️ CRITERIO · Lo que se pidió evitar NO sale en la lista (apartado 44)',
    !sinDespues.some((x) => (x.despuesDe || '').toLowerCase() === 'entrenamiento'));
  comprobar('CLAVE · ...y sin la preferencia, sí saldría',
    huecosAdecuados(estado, HOY, { duracion: 45, preferencias: { hasta: '23:00' } }).length > sinDespues.length);
}

/* ===========================================================================
   EL PLAN DE ESTUDIO
   =========================================================================== */
console.log('\n═══ El plan de estudio ═══\n');
{
  const { estado } = montar();
  const plan = planDeEstudio(estado, { examenFecha: VIERNES, temas: ['Tema 1', 'Tema 2', 'Tema 3'], hoy: HOY, titulo: 'Biología' });

  comprobar('CRITERIO · Se genera un plan (apartado 17)', plan.sesiones.length > 0);
  comprobar('⚠️ CRITERIO · La VÍSPERA es repaso, no materia nueva',
    plan.sesiones[plan.sesiones.length - 1].tipo === 'repaso');
  comprobar('⚠️ CLAVE · El día del examen NO se estudia',
    !plan.sesiones.some((s) => s.fecha === VIERNES));
  comprobar('CLAVE · Cada sesión tiene día, hora y qué tocar', !!plan.sesiones[0].dia && !!plan.sesiones[0].inicio && plan.sesiones[0].temas.length > 0);
  comprobar('CLAVE · Ninguna sesión se queda sin tema: con más días que temas, se reparten',
    plan.sesiones.filter((s) => s.tipo === 'estudio').every((s) => s.temas.length > 0));

  comprobar('CRITERIO · Un examen ya pasado no da plan', planDeEstudio(estado, { examenFecha: AYER, hoy: HOY }).imposible === true);
  comprobar('⚠️ CLAVE · Y si el examen es HOY se dice, sin reñir',
    /suerte/i.test(planDeEstudio(estado, { examenFecha: HOY, hoy: HOY }).aviso));
  comprobar('CLAVE · Sin temas, la sesión sigue teniendo sentido',
    planDeEstudio(estado, { examenFecha: VIERNES, hoy: HOY }).sesiones.length > 0);

  comprobar('CRITERIO · Se puede replanificar (apartado 18)',
    replanificarEstudio(estado, { examenFecha: VIERNES, temasPendientes: ['Tema 2', 'Tema 3'], hoy: '2026-08-26' }).sesiones.length > 0);
  comprobar('⚠️ CRITERIO · NO CASTIGA (apartado 19): ni "has fallado" ni nada parecido',
    !/fallado|fallaste|mal|deberías|castig|penaliz/i.test(
      replanificarEstudio(estado, { examenFecha: VIERNES, temasPendientes: ['Tema 3'], hoy: '2026-08-27' }).mensaje));
  comprobar('CLAVE · Dice cuántas sesiones quedan, que es el dato útil',
    /quedan/i.test(replanificarEstudio(estado, { examenFecha: VIERNES, temasPendientes: ['x'], hoy: '2026-08-26' }).mensaje));

  comprobar('CRITERIO · Se explica el plan (apartado 67)', explicarPlan(plan).includes('sesiones'));
  comprobar('CRITERIO · Y hay un plan alternativo para comparar (apartados 68 y 69)',
    planAlternativo(estado, { examenFecha: VIERNES, temas: ['A', 'B'], hoy: HOY }).sesiones.length > 0);
  comprobar('CLAVE · La comparación da los minutos de cada uno',
    compararPlanes(plan, planAlternativo(estado, { examenFecha: VIERNES, temas: ['A'], hoy: HOY })).a.minutos > 0);
}

/* ===========================================================================
   REPLANIFICAR Y CARGA
   =========================================================================== */
console.log('\n═══ Mover algo, y la carga de la semana ═══\n');
{
  const { estado } = montar();
  const opciones = huecosParaMover(estado, { duracion: 60, desde: HOY, dias: 7 });
  comprobar('CRITERIO · "Hoy no puedo entrenar" da huecos posibles (apartado 9)', opciones.length > 0);
  comprobar('⚠️ CLAVE · Da OPCIONES, no una decisión (apartado 37)', opciones.length > 1);
  comprobar('CLAVE · ...dichas en castellano', opciones[0].texto.includes('de'));
  comprobar('Con una duración imposible no se inventa nada',
    huecosParaMover(estado, { duracion: 900, desde: HOY }).length === 0);

  const mapa = mapaDeCarga(estado, { desde: HOY, dias: 7, productividad: PROD, estudios: EST, hoy: HOY });
  comprobar('CRITERIO · Existe el mapa de carga semanal (apartado 35)', mapa.length === 7);
  comprobar('...con el día abreviado', mapa[0].dia === 'L');

  const sob = detectarSobrecarga(estado, { desde: HOY, dias: 7, hoy: HOY });
  comprobar('CRITERIO · Se detecta la sobrecarga (apartado 36)', typeof sob.hay === 'boolean');
  comprobar('⚠️ CLAVE · El mensaje INFORMA, no riñe', !/demasiado|mal|deberías|exceso/i.test(sob.mensaje));
  comprobar('CLAVE · Sin sobrecarga no se dice nada', detectarSobrecarga(DEFAULT_HORARIO_TOP, { hoy: HOY }).mensaje === '');
}

/* ===========================================================================
   LAS ACCIONES DE LA IA
   =========================================================================== */
console.log('\n═══ Las acciones de la IA ═══\n');
{
  const { estado, horario, col } = montar();

  comprobar('CRITERIO · Las acciones son ESTRUCTURADAS y cerradas (apartado 53)', ACCIONES_IA.length === 4);
  comprobar('⚠️ CLAVE · NINGUNA borra nada', !ACCIONES_IA.some((a) => /borrar|eliminar/i.test(a.id + a.label)));
  comprobar('Una acción inventada no existe', accionIA('BORRAR_TODO') === null);

  const buena = { tipo: 'CREAR_BLOQUE_ESTUDIO', fecha: HOY, inicio: '16:00', fin: '17:00', texto: 'Biología' };
  comprobar('CRITERIO · Se validan antes de nada (apartado 54)', validarAccion(buena, estado).ok === true);
  comprobar('⚠️ CLAVE · Sin fecha se rechaza', validarAccion({ ...buena, fecha: '' }, estado).ok === false);
  comprobar('CLAVE · Con las horas al revés, también', validarAccion({ ...buena, inicio: '17:00', fin: '16:00' }, estado).ok === false);
  comprobar('CLAVE · Mover un bloque que ya no existe se rechaza',
    validarAccion({ tipo: 'MOVER_BLOQUE', bloqueId: 'zzz', fecha: HOY, inicio: '10:00', fin: '11:00' }, estado).ok === false);
  comprobar('CLAVE · Una tarea sin texto, también', validarAccion({ tipo: 'CREAR_TAREA', texto: '  ' }, estado).ok === false);
  comprobar('Una acción que no existe se rechaza', validarAccion({ tipo: 'ZZZ' }, estado).ok === false);

  const prev = previsualizarPlan(estado, [buena, { tipo: 'CREAR_TAREA', texto: '' }]);
  comprobar('CRITERIO · Se previsualiza (apartado 56)', prev.length === 2);
  comprobar('CLAVE · ...marcando cuál no vale y por qué', prev[1].valida === false && !!prev[1].error);
  comprobar('CLAVE · Y se describe en castellano', describirAccion(buena).includes('Biología'));

  // ⚠️ LA REGLA 7 DEL PROYECTO, PUESTA EN CÓDIGO.
  const sinConfirmar = aplicarPlan(estado, [buena], { horarioId: horario.id, columnaId: col(1).id });
  comprobar('⚠️ CRITERIO · SIN CONFIRMAR NO SE ESCRIBE NADA (apartados 6 y 55)',
    sinConfirmar.error !== null && sinConfirmar.estado.bloques.length === estado.bloques.length);

  const aplicado = aplicarPlan(estado, [buena], { confirmado: true, horarioId: horario.id, columnaId: col(1).id, hoy: HOY });
  comprobar('CRITERIO · Confirmado, se convierte en un bloque real (apartado 7)',
    aplicado.estado.bloques.length === estado.bloques.length + 1);
  comprobar('CLAVE · ...y se devuelve qué se aplicó', aplicado.aplicadas.length === 1);
  comprobar('⚠️ CLAVE · Lo que no vale se RECHAZA, no se aplica a medias',
    aplicarPlan(estado, [{ tipo: 'CREAR_TAREA', texto: '' }], { confirmado: true }).rechazadas.length === 1);
  comprobar('⚠️ CLAVE · Una tarea NO se escribe aquí: el dato es de Productividad',
    aplicarPlan(estado, [{ tipo: 'CREAR_TAREA', texto: 'Repasar' }], { confirmado: true }).aplicadas[0].paraOtroModulo === 'productividad');
}

/* ===========================================================================
   EL CONTEXTO QUE SE MANDA
   =========================================================================== */
console.log('\n═══ Qué se le manda a la IA, y qué NO ═══\n');
{
  const { estado } = montar();
  const conNota = editarActividad(estado, estado.actividades[0].id, { notas: 'Preguntar por la recuperación' });
  const c = contextoParaIA(conNota, { fecha: HOY, hoy: HOY, productividad: PROD, estudios: EST });

  comprobar('CRITERIO · Lleva la agenda del día (apartado 2)', Array.isArray(c.agenda));
  comprobar('CRITERIO · Lo pendiente, ya ordenado y con su motivo', c.pendientes[0].motivo.length > 0);
  comprobar('⚠️ CRITERIO · Y los huecos YA CALCULADOS (apartado 51): la IA no estima, lee',
    typeof c.minutosLibresHoy === 'number');
  comprobar('CRITERIO · Y qué acciones puede proponer, para que no invente', c.accionesPosibles.length === 4);

  comprobar('⚠️ CRITERIO · NO se manda toda la base de datos (apartado 50)',
    !JSON.stringify(c).includes('bloques') && !JSON.stringify(c).includes('excepciones'));
  comprobar('⚠️ CLAVE · Y NUNCA las notas privadas (HT F5, apartados 52 y 73)',
    !JSON.stringify(c).toLowerCase().includes('recuperación'));
  comprobar('⚠️ CLAVE · Ni una palabra del módulo de Relación', !/relacion|pareja/i.test(JSON.stringify(c)));
  comprobar('CLAVE · Lo pendiente se corta en 10: no crece sin fin', c.pendientes.length <= 10);

  comprobar('CRITERIO · Hay niveles de autonomía (apartado 61)', NIVELES_AUTONOMIA.length === 2);
  comprobar('⚠️ CLAVE · Ninguno permite ejecutar sin confirmar: gana la regla 7 del proyecto',
    !NIVELES_AUTONOMIA.some((n) => n.ejecuta));
  comprobar('Un nivel inventado cae en el manual', nivelAutonomia('zzz').id === 'manual');

  const r = resumenPlanificador(estado, { fecha: HOY, hoy: HOY, productividad: PROD, estudios: EST });
  comprobar('El resumen dice qué va primero', r.loPrimero !== null && r.pendientes > 0);
  comprobar('...y cuántos huecos hay hoy', typeof r.huecosHoy === 'number');
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí: la respuesta REAL de la IA (que llega por');
console.log('     `api/ask-ai.js`) y la pantalla. Son de red y de navegador (R1).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
