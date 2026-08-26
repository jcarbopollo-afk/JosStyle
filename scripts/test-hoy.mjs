// ============================================================================
// HT · Fase 6/12 — Pruebas del motor de contexto temporal
//
// El apartado 112 enumera treinta y dos criterios de aceptación. Aquí están los
// comprobables sin navegador, marcados «CRITERIO».
//
// Las tres cosas que más se comprueban:
//   1. Que **no se guarda una copia** de nada (apartado 102): completar una
//      tarea en Productividad cambia HOY sin tocar HOY.
//   2. Que **una tarea vencida no desaparece** (apartado 33).
//   3. Que **un día sin nada no parece una pantalla rota** (apartado 69).
// ============================================================================

import {
  minutosAhora, describirMinutos, ahoraMismo, siguiente,
  ESTADOS_PENDIENTE, pendientes, diasEntre, opcionesReprogramar,
  NIVELES_CARGA, cargaDelDia, estadoDelDia, tiempoLibre, lineaConAhora,
  eventosDeOtrosModulos, eventosDelCalendario, agendaCompleta,
  contextoTemporal, resumenSemana, MODOS_HOY, modoHoy,
  contextoHoyIA, PRIORIDADES_AVISO, avisosAgrupados,
} from '../src/lib/hoy.js';
import { DEFAULT_HORARIO_TOP, crearExcepcion } from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';
import { editarActividad } from '../src/lib/actividades.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-24';        // lunes
const MANANA = '2026-08-25';
const AYER = '2026-08-23';

function montar() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (d) => horario.columnas.find((c) => c.dia === d);
  let e = estado;
  // Lunes: 08:00 Matemáticas, 09:00 Biología. Martes: 08:00 Inglés.
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '08:00', fin: '09:00', texto: 'Matemáticas', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '09:00', fin: '10:00', texto: 'Biología', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '12:00', fin: '13:00', texto: 'Física', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(2).id, inicio: '08:00', fin: '09:00', texto: 'Inglés', hoy: HOY }).estado;
  return { estado: e, horario, col };
}

const PROD = {
  tareas: [
    { id: 't1', texto: 'Ejercicios de Biología', fecha: AYER, hecha: false },
    { id: 't2', texto: 'Leer tema 4', fecha: HOY, hecha: false },
    { id: 't3', texto: 'Comprar libreta', fecha: MANANA, hecha: false },
    { id: 't4', texto: 'Sin fecha', hecha: false },
    { id: 't5', texto: 'Ya hecha', fecha: HOY, hecha: true },
  ],
};
const EST = { asignaturas: [{ id: 'a1', nombre: 'Biología' }], examenes: [{ id: 'x1', asignaturaId: 'a1', fecha: MANANA, tema: 'Tema 3' }] };

/* ===========================================================================
   AHORA, SIGUIENTE Y CUÁNTO QUEDA
   =========================================================================== */
console.log('\n═══ Ahora, siguiente y cuánto queda ═══\n');
{
  const { estado } = montar();
  comprobar('Los minutos de una hora se leen bien', minutosAhora('09:30') === 570);

  comprobar('CRITERIO · Se detecta la actividad actual (apartado 3)',
    ahoraMismo(estado, { fecha: HOY, hoy: HOY, ahora: '09:30' })?.titulo === 'Biología');
  comprobar('CRITERIO · Y cuánto le queda (apartado 5)',
    ahoraMismo(estado, { fecha: HOY, hoy: HOY, ahora: '09:30' }).minutosRestantes === 30);
  comprobar('...dicho en castellano', describirMinutos(30) === '30 min' && describirMinutos(90) === '1 h 30 min');
  comprobar('Entre clases no hay nada en curso', ahoraMismo(estado, { fecha: HOY, hoy: HOY, ahora: '11:00' }) === null);
  comprobar('⚠️ CLAVE · Preguntar "qué hay AHORA" de otro día devuelve null, no algo inventado',
    ahoraMismo(estado, { fecha: MANANA, hoy: HOY, ahora: '09:30' }) === null);

  comprobar('CRITERIO · Se muestra la siguiente actividad (apartado 4)',
    siguiente(estado, { fecha: HOY, hoy: HOY, ahora: '09:30' })?.titulo === 'Física');
  comprobar('CRITERIO · Y en cuánto empieza',
    siguiente(estado, { fecha: HOY, hoy: HOY, ahora: '11:00' }).minutosPara === 60);
  comprobar('⚠️ CLAVE · Si hoy ya no queda nada, lo siguiente es el DÍA SIGUIENTE',
    siguiente(estado, { fecha: HOY, hoy: HOY, ahora: '20:00' })?.fecha === MANANA);
  comprobar('...y se dice que no es hoy', siguiente(estado, { fecha: HOY, hoy: HOY, ahora: '20:00' }).esHoy === false);
  comprobar('Sin nada en toda la semana, no se inventa nada',
    siguiente(DEFAULT_HORARIO_TOP, { fecha: HOY, hoy: HOY, ahora: '08:00' }) === null);
}

/* ===========================================================================
   LO PENDIENTE
   =========================================================================== */
console.log('\n═══ Lo pendiente, y lo vencido que no desaparece ═══\n');
{
  const p = pendientes({ productividad: PROD, estudios: EST, hoy: HOY });

  comprobar('CRITERIO · Existen tareas en HOY', p.some((x) => x.tipo === 'tarea'));
  comprobar('CRITERIO · Y exámenes', p.some((x) => x.tipo === 'examen'));
  comprobar('CLAVE · Una tarea HECHA no sale', !p.some((x) => x.refId === 't5'));
  comprobar('⚠️ CRITERIO · Una tarea vencida NO desaparece (apartado 33)', p.some((x) => x.refId === 't1'));
  comprobar('CLAVE · ...y sale la PRIMERA (apartado 32: vencidas, hoy, próximas)', p[0].refId === 't1');
  comprobar('CLAVE · ...diciendo cuántos días lleva', p[0].diasDeRetraso === 1);
  comprobar('El orden es el del apartado 32', ESTADOS_PENDIENTE.join() === 'vencida,hoy,proxima,sin_fecha');
  comprobar('Una sin fecha va la última', p[p.length - 1].refId === 't4');
  comprobar('CLAVE · Un examen pesa siempre: no es una fecha que se pueda mover',
    p.find((x) => x.tipo === 'examen').prioridad === 'alta');
  comprobar('Un examen pasado no sale', pendientes({ estudios: { ...EST, examenes: [{ id: 'x', asignaturaId: 'a1', fecha: AYER }] }, hoy: HOY }).length === 0);
  comprobar('Sin módulos, la lista está vacía y no revienta', pendientes({ hoy: HOY }).length === 0);

  comprobar('⚠️ CLAVE · NO hay copia: completar la tarea en Productividad la quita de HOY',
    pendientes({ productividad: { tareas: PROD.tareas.map((t) => ({ ...t, hecha: true })) }, hoy: HOY }).length === 0);

  comprobar('Los días entre dos fechas se cuentan bien', diasEntre(HOY, MANANA) === 1 && diasEntre(MANANA, HOY) === -1);
  comprobar('Sin fecha, cero', diasEntre('', HOY) === 0);

  const opc = opcionesReprogramar(HOY);
  comprobar('CRITERIO · Se puede reprogramar en pocos toques (apartado 34)', opc.length === 3);
  comprobar('"Mañana" es mañana', opc[0].fecha === MANANA);
  comprobar('CLAVE · "Este fin de semana" desde un lunes es el sábado', opc[1].fecha === '2026-08-29');
  comprobar('⚠️ CLAVE · ...y desde un domingo es el sábado que VIENE, no ayer',
    opcionesReprogramar('2026-08-30').find((o) => o.id === 'finde').fecha > '2026-08-30');
}

/* ===========================================================================
   CARGA Y ESTADO DEL DÍA
   =========================================================================== */
console.log('\n═══ Carga y estado del día ═══\n');
{
  const { estado, horario } = montar();
  comprobar('Hay cuatro niveles de carga', NIVELES_CARGA.length === 4);

  const carga = cargaDelDia(estado, HOY, { productividad: PROD, estudios: EST, hoy: HOY });
  comprobar('CRITERIO · Se calcula la carga del día (apartado 38)', carga.actividades === 3);
  comprobar('...y los minutos', carga.minutos === 180);
  comprobar('Un día sin nada es "día libre"', cargaDelDia(DEFAULT_HORARIO_TOP, HOY, { hoy: HOY }).nivel === 'libre');

  const dia = estadoDelDia(estado, HOY, { productividad: PROD, estudios: EST, hoy: HOY });
  comprobar('CRITERIO · Existe el resumen del día (apartado 6)', dia.actividades === 3);
  comprobar('...con el nombre del día', dia.nombreDia === 'Lunes');
  comprobar('...y sabiendo si es hoy', dia.esHoy === true);
  comprobar('⚠️ CLAVE · Un día sin NADA se marca como vacío, para no parecer roto (apartado 69)',
    estadoDelDia(DEFAULT_HORARIO_TOP, HOY, { hoy: HOY }).vacio === true);
  comprobar('CLAVE · ...y un día CON cosas, no', dia.vacio === false);

  // Apartado 72 — un festivo.
  const festivo = { ...estado, excepciones: [crearExcepcion({ fecha: HOY, tipo: 'dia_libre', horarioId: horario.id })] };
  comprobar('CRITERIO · Un festivo se reconoce', estadoDelDia(festivo, HOY, { hoy: HOY, horarioId: horario.id }).diaLibre === true);
  comprobar('CLAVE · ...y ese día no hay clase', estadoDelDia(festivo, HOY, { hoy: HOY }).actividades === 0);
  comprobar('⚠️ CRITERIO · El domingo NO dice "clase pendiente" (apartado 70)',
    estadoDelDia(estado, '2026-08-30', { hoy: HOY }).actividades === 0);
}

/* ===========================================================================
   TIEMPO LIBRE Y LÍNEA DEL DÍA
   =========================================================================== */
console.log('\n═══ Tiempo libre y línea del día ═══\n');
{
  const { estado } = montar();
  const libre = tiempoLibre(estado, HOY);
  comprobar('CRITERIO · Se identifican los huecos (apartado 65)', libre.huecos.length >= 1);
  comprobar('...y se dicen en horas y minutos', libre.texto.includes('libres'));
  // Un día sin nada es un día ENTERO libre, no un día sin huecos: decir
  // "0 min libres" un domingo sería justo al revés de la verdad.
  comprobar('CLAVE · Un día sin nada está libre entero, no vacío de huecos',
    tiempoLibre(DEFAULT_HORARIO_TOP, HOY).minutos === 840);
  comprobar('CLAVE · El descanso se cuenta APARTE: no es tiempo perdido (apartado 68)',
    typeof libre.minutosDescanso === 'number');

  const linea = lineaConAhora(estado, HOY, { hoy: HOY, ahora: '09:30' });
  comprobar('CRITERIO · Existe la línea temporal (apartado 2)', linea.eventos.length === 3);
  comprobar('CRITERIO · ...con un indicador de la hora actual', linea.ahora.hora === '09:30');
  comprobar('CLAVE · Lo ya pasado se marca como pasado', linea.eventos[0].pasado === true);
  comprobar('CLAVE · ...y lo de ahora, en curso', linea.eventos[1].enCurso === true);
  comprobar('⚠️ CLAVE · Otro día NO tiene "ahora": sería una hora inventada',
    lineaConAhora(estado, MANANA, { hoy: HOY, ahora: '09:30' }).ahora === null);
}

/* ===========================================================================
   LAS OTRAS CAPAS
   =========================================================================== */
console.log('\n═══ Eventos, exámenes y las otras capas ═══\n');
{
  const { estado } = montar();

  const otros = eventosDeOtrosModulos(MANANA, { estudios: EST });
  comprobar('CRITERIO · Los exámenes de Estudios llegan a HOY', otros.length === 1);
  comprobar('CLAVE · ...y son de SOLO LECTURA: el dato es de Estudios (apartado 102)', otros[0].soloLectura === true);
  comprobar('⚠️ CLAVE · No hay un segundo recolector: se usa `eventosDerivados` del Calendario',
    otros[0].origen === 'estudios');

  const cal = eventosDelCalendario({ eventos: [{ id: 'e1', titulo: 'Dentista', fecha: HOY, horaInicio: '17:00' }] }, HOY);
  comprobar('CRITERIO · Existen eventos propios', cal.length === 1);
  comprobar('CLAVE · ...y esos SÍ se pueden editar', cal[0].soloLectura === false);

  const agenda = agendaCompleta(estado, HOY, {
    calendario: { eventos: [{ id: 'e1', titulo: 'Dentista', fecha: HOY, horaInicio: '17:00' }] },
    estudios: EST, productividad: PROD,
  });
  comprobar('CRITERIO · La agenda junta horario y eventos, ordenados', agenda.eventos.length === 4);
  comprobar('CLAVE · ...por hora', agenda.eventos[0].inicio === '08:00' && agenda.eventos[3].inicio === '17:00');
  comprobar('CRITERIO · Lo de todo el día va aparte, arriba',
    agendaCompleta(estado, MANANA, { estudios: EST }).todoElDia.length === 1);

  // HT F5 · apartado 50 — una actividad apagada para HOY.
  const act = estado.actividades[0];
  const oculta = editarActividad(estado, act.id, { visibilidad: { hoy: false } });
  comprobar('⚠️ CLAVE · Una actividad apagada para HOY no sale en la agenda…',
    agendaCompleta(oculta, HOY, {}).eventos.length === 2);
  comprobar('CLAVE · …pero SIGUE en el horario: apagar no es borrar',
    oculta.bloques.length === estado.bloques.length);
}

/* ===========================================================================
   EL MOTOR ENTERO
   =========================================================================== */
console.log('\n═══ El motor de contexto temporal (apartado 101) ═══\n');
{
  const { estado } = montar();
  const c = contextoTemporal(estado, { fecha: HOY, hoy: HOY, ahora: '09:30', productividad: PROD, estudios: EST });

  comprobar('CRITERIO · Responde qué está ocurriendo ahora', c.ahora.titulo === 'Biología');
  comprobar('CRITERIO · Qué viene después', c.siguiente.titulo === 'Física');
  comprobar('CRITERIO · Qué hay hoy', c.dia.actividades === 3);
  comprobar('CRITERIO · Qué está pendiente', c.pendientes.length > 0);
  comprobar('CRITERIO · Y qué hay mañana (apartado 85)', c.manana.fecha === MANANA);
  comprobar('CLAVE · Con su material, que es lo que hace falta para la mochila de la noche',
    Array.isArray(c.manana.material));
  comprobar('CRITERIO · Se detectan conflictos', Array.isArray(c.conflictos));
  comprobar('Un estado vacío devuelve la forma entera, sin reventar',
    contextoTemporal(DEFAULT_HORARIO_TOP, { fecha: HOY, hoy: HOY }).dia.vacio === true);

  const sem = resumenSemana(estado, { desde: HOY, hoy: HOY, productividad: PROD, estudios: EST });
  comprobar('CRITERIO · Existe el resumen semanal', sem.dias.length === 7);
  comprobar('...con el total de actividades', sem.actividades === 4);
  comprobar('CLAVE · Dice cuál es el día más cargado, SIN llamarlo un problema', sem.masCargado.fecha === HOY);
  comprobar('...y cuántos días están libres', sem.libres === 5);

  comprobar('CRITERIO · Hay modo mínimo y modo completo', MODOS_HOY.length === 2);
  comprobar('Un modo inventado cae en el completo', modoHoy('zzz').id === 'completo');
}

/* ===========================================================================
   IA Y AVISOS
   =========================================================================== */
console.log('\n═══ Contexto para la IA y avisos agrupados ═══\n');
{
  const { estado } = montar();
  const ia = contextoHoyIA(estado, { fecha: HOY, hoy: HOY, ahora: '09:30', productividad: PROD, estudios: EST });

  comprobar('CRITERIO · Existe contexto para la IA (apartado 64)', ia.dia === 'Lunes');
  comprobar('CLAVE · Y es ESTRUCTURA, no un texto ya escrito', Array.isArray(ia.actividades));
  comprobar('Trae lo pendiente con su estado', ia.pendientes.some((p) => p.estado === 'vencida'));
  comprobar('⚠️ CLAVE · No trae ninguna nota privada de ninguna actividad (HT F5, apartado 73)',
    !JSON.stringify(ia).includes('notas'));

  const av = avisosAgrupados({ ...estado }, { hoy: HOY, productividad: PROD, estudios: EST });
  comprobar('Hay tres prioridades (apartado 82)', PRIORIDADES_AVISO.length === 3);
  comprobar('CLAVE · Una tarea vencida es de prioridad ALTA', av.alta.some((x) => x.refId === 't1'));
  comprobar('CLAVE · Un examen MAÑANA también', av.alta.some((x) => x.tipo === 'examen'));
  comprobar('⚠️ CRITERIO · Se agrupa en UN mensaje, no uno por cosa (apartado 81)',
    av.resumen.startsWith('Tienes') && av.resumen.endsWith('hoy.'));
  comprobar('CLAVE · Sin nada importante, no se dice nada: no se bombardea',
    avisosAgrupados({}, { hoy: HOY }).resumen === '');
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí: el contador que se actualiza solo en pantalla, el');
console.log('     aspecto en un iPhone y el recorrido tocando. Son del navegador real (R1).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
