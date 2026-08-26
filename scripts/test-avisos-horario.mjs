// ============================================================================
// HT · Fase 10/12 — Pruebas del motor de decisión de avisos
//
// Lo que más se comprueba son las cuatro reglas de la fase:
//   1. **Que exista un evento NO significa que haya que avisar** (apartado 4).
//   2. **No se crean cientos de recordatorios** (apartado 34).
//   3. **Un aviso caduca** (apartado 52).
//   4. **No molestar se respeta siempre**, también con lo crítico (apartado 39).
//
// Y una más, de arquitectura: **este archivo no manda nada.** Quien manda es
// `notificaciones.js`, que ya existía desde la Fase A4.
// ============================================================================

import {
  TIPOS_AVISO, tipoAviso, PRIORIDADES_AVISO, prioridadAviso,
  DEFAULT_AVISOS_HORARIO, normalizarAvisosHorario,
  claveAviso, avisosCandidatos, MOTIVOS_RECHAZO, decidirAviso,
  MAXIMO_SUELTOS, agrupar,
  MAX_AVISOS_GUARDADOS, MINUTOS_SNOOZE, avisosDe, registrarEnviado, clavesEnviadas,
  marcarLeido, archivarAviso, marcarTodosLeidos, posponer, centroDeAvisos,
  resumenNocturno, resumenMatutino, avisosAMandar, resumenAvisos,
} from '../src/lib/avisosHorario.js';
import { DEFAULT_HORARIO_TOP, normalizarHorarioTop } from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';
import { crearMaterial, crearEnlaceMaterial } from '../src/lib/horarioDatos.js';

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
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '08:00', fin: '09:00', texto: 'Matemáticas', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '10:00', fin: '11:00', texto: 'Biología', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(2).id, inicio: '08:00', fin: '09:00', texto: 'Inglés', hoy: HOY }).estado;

  // Biología con bata: es lo que hace que la mochila de mañana esté incompleta.
  const bata = crearMaterial({ nombre: 'Bata', tipo: 'ropa', hoy: HOY });
  const ing = e.actividades.find((a) => a.nombre === 'Inglés');
  e = {
    ...e,
    materiales: [bata],
    enlacesMaterial: [crearEnlaceMaterial({ actividadId: ing.id, materialId: bata.id, obligatorio: true })],
  };
  return { estado: e, horario, col };
}

const EST = { asignaturas: [{ id: 'a1', nombre: 'Biología' }], examenes: [{ id: 'x1', asignaturaId: 'a1', fecha: MANANA, tema: 'Tema 3' }] };
const PROD = { tareas: [{ id: 't1', texto: 'Ejercicios atrasados', fecha: AYER, hecha: false }] };

/* ===========================================================================
   TIPOS, PRIORIDADES Y AJUSTES
   =========================================================================== */
console.log('\n═══ Tipos, prioridades y ajustes ═══\n');
{
  comprobar('CRITERIO · Existen los tipos del apartado 2', TIPOS_AVISO.length >= 7);
  comprobar('CLAVE · Cada tipo apunta a una categoría de las que YA existen (Fase A4)',
    TIPOS_AVISO.every((t) => !!t.categoria));
  comprobar('CRITERIO · Existen las cuatro prioridades (apartado 3)', PRIORIDADES_AVISO.length === 4);
  comprobar('Un tipo inventado no revienta', tipoAviso('zzz').id === 'recordatorio');

  comprobar('Los ajustes tienen valores razonables', DEFAULT_AVISOS_HORARIO.minutosAntesClase === 10);
  comprobar('⚠️ CLAVE · Un "avísame 500 minutos antes" se acota',
    normalizarAvisosHorario({ minutosAntesClase: 5000 }).minutosAntesClase === 120);
  comprobar('CLAVE · Y "0 minutos antes" SÍ vale: es "cuando empiece"',
    normalizarAvisosHorario({ minutosAntesClase: 0 }).minutosAntesClase === 0);
  comprobar('Una hora mal escrita cae en la de por defecto',
    normalizarAvisosHorario({ horaResumenNocturno: 'zzz' }).horaResumenNocturno === '21:00');
  comprobar('CRITERIO · Se puede apagar un tipo (apartado 77)',
    normalizarAvisosHorario({ tipos: { mochila: false } }).tipos.mochila === false);
  comprobar('CLAVE · ...sin apagar los demás', normalizarAvisosHorario({ tipos: { mochila: false } }).tipos.tarea === true);
}

/* ===========================================================================
   QUÉ HAY QUE AVISAR
   =========================================================================== */
console.log('\n═══ Qué hay que avisar ═══\n');
{
  const { estado } = montar();
  const c = avisosCandidatos(estado, HOY, { estudios: EST, productividad: PROD, hoy: HOY });

  comprobar('CRITERIO · Se avisa del inicio de una clase (apartado 11)', c.some((x) => x.tipo === 'recordatorio'));
  comprobar('CLAVE · ...con la hora dentro', c.find((x) => x.tipo === 'recordatorio').cuerpo.includes(':'));
  comprobar('CLAVE · Y se programa ANTES de que empiece, no cuando empieza',
    c.find((x) => x.tipo === 'recordatorio').cuando < 480);

  comprobar('CRITERIO · Se avisa de un examen (apartado 17)', c.some((x) => x.tipo === 'estudio'));
  comprobar('⚠️ CLAVE · Un examen MAÑANA es lo único que sube a CRÍTICA solo',
    c.find((x) => x.tipo === 'estudio').prioridad === 'critica');
  comprobar('CLAVE · Un examen de dentro de tres días es alta, no crítica',
    avisosCandidatos(estado, HOY, { estudios: { ...EST, examenes: [{ id: 'x', asignaturaId: 'a1', fecha: '2026-08-27' }] }, hoy: HOY })
      .find((x) => x.tipo === 'estudio').prioridad === 'alta');
  comprobar('CLAVE · Uno de dentro de un mes NO avisa todavía',
    !avisosCandidatos(estado, HOY, { estudios: { ...EST, examenes: [{ id: 'x', asignaturaId: 'a1', fecha: '2026-09-30' }] }, hoy: HOY })
      .some((x) => x.tipo === 'estudio'));

  comprobar('CRITERIO · Se avisa de la mochila incompleta (apartado 21)', c.some((x) => x.tipo === 'mochila'));
  comprobar('⚠️ CLAVE · Que falte material NO es crítico: crítico es un examen mañana',
    c.find((x) => x.tipo === 'mochila').prioridad === 'alta');
  comprobar('⚠️ CRITERIO · Si la mochila está completa NO se avisa (apartado 4)',
    !avisosCandidatos(montar().estado, '2026-08-29', { hoy: HOY }).some((x) => x.tipo === 'mochila'));

  comprobar('CRITERIO · Se avisa de las tareas vencidas (apartado 15)', c.some((x) => x.tipo === 'tarea'));
  comprobar('CLAVE · ...diciendo CUÁL, no solo cuántas', c.find((x) => x.tipo === 'tarea').cuerpo.includes('atrasados'));
  comprobar('CLAVE · Sin tareas vencidas no se avisa de tareas',
    !avisosCandidatos(estado, HOY, { hoy: HOY }).some((x) => x.tipo === 'tarea'));

  comprobar('CRITERIO · Un tipo apagado no genera candidatos (apartado 77)',
    !avisosCandidatos(estado, HOY, { estudios: EST, hoy: HOY, ajustes: { tipos: { mochila: false } } }).some((x) => x.tipo === 'mochila'));
  comprobar('⚠️ CLAVE · Un día sin nada no genera ningún aviso',
    avisosCandidatos(DEFAULT_HORARIO_TOP, HOY, { hoy: HOY }).length === 0);
}

/* ===========================================================================
   EL MOTOR DE DECISIÓN
   =========================================================================== */
console.log('\n═══ El motor de decisión (apartado 5) ═══\n');
{
  const aviso = { clave: 'k1', tipo: 'recordatorio', prioridad: 'normal', fecha: HOY, cuando: 480, titulo: 'Clase', cuerpo: '' };

  comprobar('CRITERIO · A su hora, se manda', decidirAviso(aviso, { ahora: '08:00' }).enviar === true);
  comprobar('CRITERIO · Antes de tiempo, no', decidirAviso(aviso, { ahora: '06:00' }).motivo === 'aun_no');
  comprobar('⚠️ CLAVE · Con dos horas de retraso YA NO se manda: solo haría ruido',
    decidirAviso(aviso, { ahora: '12:00' }).motivo === 'ya_paso');
  comprobar('CRITERIO · Lo ya avisado no se repite (apartado 5)',
    decidirAviso(aviso, { ahora: '08:00', enviados: ['k1'] }).motivo === 'repetido');
  comprobar('⚠️ CRITERIO · Si la situación cambió, se cancela (apartado 52)',
    decidirAviso(aviso, { ahora: '08:00', sigueValido: false }).motivo === 'caducado');
  comprobar('CRITERIO · Un tipo apagado no se manda',
    decidirAviso(aviso, { ahora: '08:00', ajustes: { tipos: { recordatorio: false } } }).motivo === 'tipo_apagado');
  comprobar('CRITERIO · Y por debajo de la importancia mínima, tampoco (apartado 78)',
    decidirAviso({ ...aviso, prioridad: 'baja' }, { ahora: '08:00' }).motivo === 'poca_prioridad');

  // ⚠️ El apartado 39, que es el que se rompe "por ser importante".
  comprobar('⚠️ CRITERIO · NO MOLESTAR se respeta siempre (apartado 39)',
    decidirAviso(aviso, { ahora: '08:00', descanso: true }).motivo === 'descanso');
  comprobar('⚠️ CLAVE · ...también con lo CRÍTICO: a las 3 de la mañana no es más útil por ser urgente',
    decidirAviso({ ...aviso, prioridad: 'critica' }, { ahora: '08:00', descanso: true }).enviar === false);

  comprobar('CRITERIO · Se puede posponer (apartados 54 y 55)',
    decidirAviso(aviso, { ahora: '08:00', pospuestos: posponer({}, 'k1', 30, { ahora: '08:00' }) }).motivo === 'pospuesto');
  comprobar('CLAVE · ...y pasado ese rato, vuelve',
    decidirAviso(aviso, { ahora: '08:45', pospuestos: posponer({}, 'k1', 30, { ahora: '08:00' }) }).enviar === true);
  comprobar('Hay tres tiempos de posponer', MINUTOS_SNOOZE.length === 3);

  comprobar('⚠️ CLAVE · Cuando dice que NO, dice POR QUÉ, y en castellano',
    Object.keys(MOTIVOS_RECHAZO).every((k) => MOTIVOS_RECHAZO[k].length > 5));
}

/* ===========================================================================
   AGRUPAR
   =========================================================================== */
console.log('\n═══ No crear cientos de recordatorios (apartado 34) ═══\n');
{
  const uno = { clave: 'a', tipo: 'recordatorio', prioridad: 'normal', fecha: HOY, cuando: 480, titulo: 'Mates', cuerpo: '' };
  const dos = { ...uno, clave: 'b', titulo: 'Biología' };
  const tres = { ...uno, clave: 'c', prioridad: 'critica', titulo: 'Examen' };

  comprobar('Uno solo se manda tal cual', agrupar([uno]).length === 1 && !agrupar([uno])[0].agrupado);
  comprobar('⚠️ CRITERIO · Tres avisos se convierten en UNO (apartado 34)', agrupar([uno, dos, tres]).length === 1);
  comprobar('CLAVE · ...que dice cuántos son', agrupar([uno, dos, tres])[0].titulo.includes('3'));
  comprobar('⚠️ CLAVE · Y lo MÁS IMPORTANTE va primero en el cuerpo',
    agrupar([uno, dos, tres])[0].cuerpo.startsWith('Examen'));
  comprobar('CLAVE · El agrupado sabe qué incluye, para no repetirlos después',
    agrupar([uno, dos, tres])[0].incluye.length === 3);
  comprobar('Sin nada no se agrupa nada', agrupar([]).length === 0);
}

/* ===========================================================================
   EL CENTRO DE AVISOS
   =========================================================================== */
console.log('\n═══ El centro de avisos ═══\n');
{
  const { estado } = montar();
  const aviso = { clave: 'k1', tipo: 'mochila', prioridad: 'alta', titulo: 'Prepara la mochila', cuerpo: 'Falta la bata' };

  const con = registrarEnviado(estado, aviso, { ahora: '21:00', fecha: HOY });
  comprobar('CRITERIO · Existe historial de avisos (apartado 51)', avisosDe(con).length === 1);
  comprobar('CLAVE · ...con su hora', avisosDe(con)[0].hora === '21:00');
  comprobar('⚠️ CLAVE · Registrar dos veces el mismo NO lo duplica',
    avisosDe(registrarEnviado(con, aviso, { fecha: HOY })).length === 1);
  comprobar('⚠️ CLAVE · Y sobrevive a un guardado', avisosDe(normalizarHorarioTop(con)).length === 1);
  comprobar('Las claves enviadas se pueden consultar', clavesEnviadas(con, HOY).includes('k1'));

  comprobar('CRITERIO · Nace sin leer (apartado 73)', centroDeAvisos(con).sinLeer === 1);
  const leido = marcarLeido(con, avisosDe(con)[0].id);
  comprobar('CRITERIO · Se puede marcar leído', centroDeAvisos(leido).sinLeer === 0);
  comprobar('CRITERIO · Y archivar (apartado 74)', centroDeAvisos(archivarAviso(con, avisosDe(con)[0].id)).total === 0);
  comprobar('CLAVE · ...pero sigue guardado, se puede pedir',
    centroDeAvisos(archivarAviso(con, avisosDe(con)[0].id), { incluirArchivados: true }).total === 1);
  comprobar('CLAVE · Archivar da por leído: nadie archiva algo sin mirarlo',
    avisosDe(archivarAviso(con, avisosDe(con)[0].id))[0].leido === true);
  comprobar('Se pueden marcar todos', centroDeAvisos(marcarTodosLeidos(con)).sinLeer === 0);
  comprobar('CRITERIO · Se puede filtrar por tipo (apartado 75)', centroDeAvisos(con, { tipo: 'tarea' }).total === 0);
  comprobar('⚠️ CLAVE · Los NO leídos salen primero', centroDeAvisos(con).avisos[0].leido === false);
  comprobar(`El historial se corta en ${MAX_AVISOS_GUARDADOS}`, MAX_AVISOS_GUARDADOS === 80);
}

/* ===========================================================================
   RESÚMENES Y LO QUE HAY QUE MANDAR
   =========================================================================== */
console.log('\n═══ Resúmenes y lo que hay que mandar ═══\n');
{
  const { estado } = montar();

  const noche = resumenNocturno(estado, { fecha: HOY });
  comprobar('CRITERIO · Existe el resumen nocturno (apartado 37)', noche !== null);
  comprobar('CLAVE · ...con lo primero de mañana', noche.primera.includes('08:00'));
  comprobar('CLAVE · ...y con qué falta en la mochila', noche.faltan > 0);
  comprobar('⚠️ CRITERIO · Si mañana no hay NADA, no hay resumen (apartado 34)',
    resumenNocturno(DEFAULT_HORARIO_TOP, { fecha: HOY }) === null);

  comprobar('CRITERIO · Existe el resumen matutino (apartado 38)', resumenMatutino(estado, { fecha: HOY }) !== null);
  comprobar('CLAVE · Y también calla si no hay nada', resumenMatutino(DEFAULT_HORARIO_TOP, { fecha: HOY }) === null);

  const r = avisosAMandar(estado, { fecha: HOY, ahora: '21:00', estudios: EST, productividad: PROD, hoy: HOY });
  comprobar('CRITERIO · Se sabe qué mandar ahora mismo', r.mandar.length >= 1);
  comprobar('⚠️ CLAVE · Y se agrupa: nunca son cuatro notificaciones a la vez', r.mandar.length === 1);
  comprobar('⚠️ CLAVE · Los descartados vienen CON SU MOTIVO, para poder contestar "¿por qué no me avisó?"',
    r.descartados.every((d) => !!d.texto));
  comprobar('CLAVE · En horas de descanso no se manda nada',
    avisosAMandar(estado, { fecha: HOY, ahora: '03:00', estudios: EST, hoy: HOY, descanso: true }).mandar.length === 0);

  comprobar('⚠️ CLAVE · Este archivo NO manda nada: solo dice qué mandar',
    typeof r.mandar === 'object' && !('enviar' in r));

  const res = resumenAvisos(estado, { fecha: HOY, ahora: '21:00', estudios: EST, hoy: HOY });
  comprobar('El resumen cuenta lo pendiente de mandar', typeof res.porMandar === 'number');
  comprobar('...y los sin leer', res.sinLeer === 0);
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí: que la notificación llegue de verdad al iPhone, el');
console.log('     permiso del navegador y Web Push con la app cerrada. Son del navegador');
console.log('     real y de infraestructura que no existe (mismo límite que R1 y la Fase A4).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
