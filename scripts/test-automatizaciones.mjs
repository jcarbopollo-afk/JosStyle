// ============================================================================
// HT · Fase 8/12 — Pruebas del motor temporal y las automatizaciones
//
// El apartado 59 enumera treinta y dos criterios. Aquí están los comprobables
// sin navegador, marcados «CRITERIO».
//
// Las cuatro que importan de verdad:
//   1. **PASADA no es COMPLETADA** (apartados 6, 7 y 8).
//   2. **El estado temporal se CALCULA**, no se guarda.
//   3. **La excepción gana a la regla** (apartado 45).
//   4. **Nada importante se ejecuta sin confirmar** (apartado 53).
// ============================================================================

import {
  ESTADOS_TEMPORALES, estadoTemporal, MINUTOS_PROXIMA, estadoDeEvento, claveEvento,
  completadasDe, marcarCompletada, tablonDelDia, hayCambioDeDia,
  TRIGGERS, CONDICIONES, ACCIONES, NIVELES_ACCION, accionDe, necesitaConfirmar,
  crearAutomatizacion, automatizacionesDe, cumpleCondiciones, automatizacionesQueTocan,
  historialDe, explicarAccion, previsualizar, ejecutar, deshacer, puedeDeshacerse,
  ejecutarTodo, resumenAutomatizaciones, MAX_HISTORIAL,
} from '../src/lib/automatizaciones.js';
import { DEFAULT_HORARIO_TOP, normalizarHorarioTop } from '../src/lib/horario.js';
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
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '08:00', fin: '09:00', texto: 'Matemáticas', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '10:00', fin: '11:00', texto: 'Biología', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '16:00', fin: '17:00', texto: 'Física', hoy: HOY }).estado;
  return { estado: e, horario, col };
}

const ev = (t, ini, fin) => ({ bloqueId: t, titulo: t, inicio: ini, fin });

/* ===========================================================================
   EL ESTADO TEMPORAL
   =========================================================================== */
console.log('\n═══ El estado temporal de una actividad ═══\n');
{
  comprobar('CRITERIO · Existen los cinco estados (apartado 2)', ESTADOS_TEMPORALES.length === 5);
  comprobar('⚠️ CRITERIO · PASADA y COMPLETADA son estados DISTINTOS (apartado 8)',
    ESTADOS_TEMPORALES.some((e) => e.id === 'pasada') && ESTADOS_TEMPORALES.some((e) => e.id === 'completada'));
  comprobar('CRITERIO · Lo terminado desaparece del tablón (apartado 6)',
    estadoTemporal('pasada').enTablon === false && estadoTemporal('completada').enTablon === false);
  comprobar('CLAVE · ...pero lo de ahora y lo que viene, no', estadoTemporal('en_curso').enTablon === true);

  const opc = { fecha: HOY, hoy: HOY };
  const bio = ev('Biología', '10:00', '11:00');
  comprobar('CRITERIO · Existe "programada" (apartado 3)', estadoDeEvento(bio, { ...opc, ahora: '08:00' }) === 'programada');
  comprobar('CRITERIO · Existe "próxima" (apartado 4)', estadoDeEvento(bio, { ...opc, ahora: '09:45' }) === 'proxima');
  comprobar(`CLAVE · ...y empieza ${MINUTOS_PROXIMA} minutos antes, no antes`,
    estadoDeEvento(bio, { ...opc, ahora: '09:29' }) === 'programada');
  comprobar('CRITERIO · Existe "en curso" (apartado 5)', estadoDeEvento(bio, { ...opc, ahora: '10:30' }) === 'en_curso');
  comprobar('CRITERIO · Y "pasada" (apartado 6)', estadoDeEvento(bio, { ...opc, ahora: '11:30' }) === 'pasada');
  comprobar('CLAVE · Justo al terminar YA es pasada', estadoDeEvento(bio, { ...opc, ahora: '11:00' }) === 'pasada');
  comprobar('CLAVE · Un día anterior siempre es pasada', estadoDeEvento(bio, { fecha: AYER, hoy: HOY, ahora: '08:00' }) === 'pasada');
  comprobar('CLAVE · Y uno futuro, programada', estadoDeEvento(bio, { fecha: MANANA, hoy: HOY, ahora: '23:00' }) === 'programada');
  comprobar('⚠️ CRITERIO · Una actividad SIN HORA no está ni en curso ni pasada (apartado 27)',
    estadoDeEvento({ titulo: 'Suelta', inicio: '', fin: '' }, { ...opc, ahora: '23:00' }) === 'programada');

  comprobar('⚠️ CRITERIO · "Completada" gana a todo: lo hiciste, y eso no lo cambia el reloj',
    estadoDeEvento(bio, { ...opc, ahora: '08:00', completadas: [claveEvento(bio, HOY)] }) === 'completada');
  comprobar('CLAVE · La clave lleva la fecha: el mismo bloque otro día es otra cosa',
    claveEvento(bio, HOY) !== claveEvento(bio, MANANA));
}

/* ===========================================================================
   COMPLETAR Y EL TABLÓN
   =========================================================================== */
console.log('\n═══ Completar y el tablón del día ═══\n');
{
  const { estado } = montar();
  const bio = ev('Biología', '10:00', '11:00');

  const hecha = marcarCompletada(estado, bio, HOY);
  comprobar('CRITERIO · Se puede confirmar que algo se hizo (apartado 9)', completadasDe(hecha).length === 1);
  comprobar('Y desmarcar', completadasDe(marcarCompletada(hecha, bio, HOY, false)).length === 0);
  comprobar('Marcarlo dos veces no lo duplica', completadasDe(marcarCompletada(hecha, bio, HOY)).length === 1);
  comprobar('⚠️ CLAVE · Sobrevive a un guardado', completadasDe(normalizarHorarioTop(hecha)).length === 1);

  const t = tablonDelDia(estado, HOY, { hoy: HOY, ahora: '10:30' });
  comprobar('CRITERIO · El tablón separa lo activo de lo pasado (apartado 15)', t.activos.length === 2 && t.pasados.length === 1);
  comprobar('CLAVE · Matemáticas, que terminó a las 9, ya no está en el tablón',
    !t.activos.some((x) => x.titulo === 'Matemáticas'));
  comprobar('CRITERIO · ...pero se puede consultar (apartado 16)', t.pasados.some((x) => x.titulo === 'Matemáticas'));
  comprobar('CRITERIO · Biología, en curso, sí está', t.activos.some((x) => x.estadoTemporal === 'en_curso'));
  comprobar('CRITERIO · Existe historial del día (apartado 17)', t.terminadas === 1 && t.total === 3);

  const t2 = tablonDelDia(marcarCompletada(estado, { bloqueId: estado.bloques[0].id }, HOY), HOY, { hoy: HOY, ahora: '10:30' });
  comprobar('⚠️ CLAVE · Las completadas CUENTAN como terminadas: si no, los totales no suman',
    t2.terminadas === 1 && t2.completadas === 1);

  comprobar('Un día vacío da un tablón vacío, no un error', tablonDelDia(DEFAULT_HORARIO_TOP, HOY, { hoy: HOY }).total === 0);

  comprobar('CRITERIO · Se detecta el cambio de día (apartado 22)', hayCambioDeDia(AYER, HOY) === true);
  comprobar('CLAVE · ...y el mismo día no lo es', hayCambioDeDia(HOY, HOY) === false);
  comprobar('Sin fecha previa no hay cambio que detectar', hayCambioDeDia(null, HOY) === false);
}

/* ===========================================================================
   EL MOTOR DE REGLAS
   =========================================================================== */
console.log('\n═══ El motor de reglas ═══\n');
{
  const { estado } = montar();

  comprobar('CRITERIO · Existen triggers (apartado 43)', TRIGGERS.length === 4);
  comprobar('CRITERIO · Existen condiciones (apartado 44)', CONDICIONES.length === 5);
  comprobar('CRITERIO · Existen acciones', ACCIONES.length === 4);
  comprobar('CRITERIO · Y niveles de seguridad (apartado 53)', NIVELES_ACCION.length === 3);
  comprobar('⚠️ CLAVE · NO hay acciones críticas: nada de lo que hace una regla borra datos',
    !ACCIONES.some((a) => a.nivel === 'critica'));
  comprobar('CLAVE · Lo importante pide confirmación', necesitaConfirmar('sugerir_tarea') === true);
  comprobar('CLAVE · ...y lo reversible no', necesitaConfirmar('anadir_material') === false);

  const bata = crearAutomatizacion({
    nombre: 'Bata de laboratorio', trigger: 'dia', accion: 'anadir_material', valor: 'Bata',
    condiciones: [{ tipo: 'actividad', valor: 'Biología' }],
  });
  const con = { ...estado, automatizaciones: [bata] };
  comprobar('Se guardan', automatizacionesDe(con).length === 1);
  comprobar('CLAVE · Un trigger inventado cae en "cada día"', crearAutomatizacion({ trigger: 'zzz' }).trigger === 'dia');
  comprobar('CLAVE · Una condición sin valor se descarta: no filtraría nada',
    crearAutomatizacion({ condiciones: [{ tipo: 'actividad', valor: '  ' }] }).condiciones.length === 0);

  comprobar('CRITERIO · La regla se dispara el día que toca Biología',
    automatizacionesQueTocan(con, HOY).length === 1);
  comprobar('CLAVE · ...y NO el domingo, que no hay clase',
    automatizacionesQueTocan(con, '2026-08-30').length === 0);
  comprobar('CLAVE · Una regla apagada no se dispara',
    automatizacionesQueTocan({ ...estado, automatizaciones: [{ ...bata, activa: false }] }, HOY).length === 0);
  comprobar('⚠️ CLAVE · Una regla SIN VALOR no se dispara: sería ruido con historial',
    automatizacionesQueTocan({ ...estado, automatizaciones: [{ ...bata, valor: '' }] }, HOY).length === 0);

  comprobar('CRITERIO · Se pueden pedir MÚLTIPLES condiciones, y se exigen TODAS (apartado 44)',
    automatizacionesQueTocan({
      ...estado,
      automatizaciones: [{ ...bata, condiciones: [{ tipo: 'actividad', valor: 'Biología' }, { tipo: 'dia_semana', valor: '3' }] }],
    }, HOY).length === 0);
  comprobar('CLAVE · Con las dos cumplidas, sí se dispara',
    automatizacionesQueTocan({
      ...estado,
      automatizaciones: [{ ...bata, condiciones: [{ tipo: 'actividad', valor: 'Biología' }, { tipo: 'dia_semana', valor: '1' }] }],
    }, HOY).length === 1);
  comprobar('CRITERIO · Hay condición por fecha concreta',
    automatizacionesQueTocan({ ...estado, automatizaciones: [{ ...bata, condiciones: [{ tipo: 'fecha', valor: HOY }] }] }, HOY).length === 1);
  comprobar('CLAVE · Una regla SIN condiciones se cumple siempre: "cada día, avísame"',
    cumpleCondiciones(crearAutomatizacion({ valor: 'X' }), { fecha: HOY }) === true);

  // Apartado 45 — la excepción gana. Es el caso que la especificación pone.
  const noBata = crearAutomatizacion({
    nombre: 'Sin bata el 15', accion: 'anadir_material', valor: 'Bata', excepcion: true,
    condiciones: [{ tipo: 'fecha', valor: HOY }],
  });
  comprobar('⚠️ CRITERIO · LA EXCEPCIÓN GANA A LA REGLA (apartado 45)',
    automatizacionesQueTocan({ ...estado, automatizaciones: [bata, noBata] }, HOY).length === 0);
  comprobar('CLAVE · ...pero SOLO el día de la excepción',
    automatizacionesQueTocan({ ...estado, automatizaciones: [bata, { ...noBata, condiciones: [{ tipo: 'fecha', valor: MANANA }] }] }, HOY).length === 1);

  comprobar('CRITERIO · Existen prioridades entre reglas (apartado 45)',
    automatizacionesQueTocan({
      ...estado,
      automatizaciones: [{ ...bata, prioridad: 1, valor: 'A' }, { ...bata, id: 'x', prioridad: 5, valor: 'B' }],
    }, HOY)[0].valor === 'B');
}

/* ===========================================================================
   EJECUTAR, EXPLICAR Y DESHACER
   =========================================================================== */
console.log('\n═══ Ejecutar, explicar y deshacer ═══\n');
{
  const { estado } = montar();
  const bata = crearAutomatizacion({
    nombre: 'Bata', accion: 'anadir_material', valor: 'Bata',
    condiciones: [{ tipo: 'actividad', valor: 'Biología' }],
  });
  const con = { ...estado, automatizaciones: [bata] };

  const prev = previsualizar(con, HOY);
  comprobar('CRITERIO · Se puede previsualizar antes de ejecutar (apartado 48)', prev.length === 1);
  comprobar('⚠️ CLAVE · Previsualizar NO ESCRIBE NADA', historialDe(con).length === 0);
  comprobar('CLAVE · ...y dice por qué se va a hacer', prev[0].porQue.includes('Biología'));

  const r = ejecutar(con, prev[0], { fecha: HOY, ahora: '21:00' });
  comprobar('CRITERIO · Se ejecuta y queda en el historial (apartado 50)', historialDe(r.estado).length === 1);
  comprobar('CLAVE · ...con su hora', historialDe(r.estado)[0].hora === '21:00');
  comprobar('CRITERIO · Y la acción tiene efecto real: la bata está en la mochila',
    r.estado.mochila.some((m) => m.nombre === 'Bata' && m.fecha === HOY));
  comprobar('⚠️ CLAVE · Lo que pone una regla NO se marca como manual, o sería eterno',
    r.estado.mochila.find((m) => m.nombre === 'Bata').manual === false);
  comprobar('CRITERIO · Se explica en castellano (apartado 52)',
    explicarAccion(historialDe(r.estado)[0]).includes('Añadida Bata automáticamente'));
  comprobar('Ejecutarlo dos veces no la duplica',
    ejecutar(r.estado, prev[0], { fecha: HOY }).estado.mochila.filter((m) => m.nombre === 'Bata').length === 1);

  // ⚠️ El apartado 53 aplicado, no comentado.
  const tarea = { accion: 'sugerir_tarea', valor: 'Repasar tema 3', confirmar: true, porQue: 'el examen' };
  comprobar('⚠️ CRITERIO · Lo IMPORTANTE no se ejecuta sin confirmar (apartado 53)',
    ejecutar(con, tarea, { fecha: HOY }).error !== null);
  comprobar('CLAVE · ...y se dice que hace falta confirmarlo', ejecutar(con, tarea, { fecha: HOY }).necesitaConfirmar === true);
  comprobar('CLAVE · Confirmado, sí se ejecuta', ejecutar(con, tarea, { fecha: HOY, confirmada: true }).error === null);

  // Apartado 51 — deshacer.
  const entradaId = historialDe(r.estado)[0].id;
  comprobar('CRITERIO · Se puede deshacer (apartado 51)', puedeDeshacerse(historialDe(r.estado)[0]) === true);
  const des = deshacer(r.estado, entradaId);
  comprobar('CLAVE · ...y la bata desaparece de la mochila', !des.estado.mochila.some((m) => m.nombre === 'Bata'));
  comprobar('CLAVE · ...pero la acción SIGUE en el historial, marcada', historialDe(des.estado)[0].deshecha === true);
  comprobar('Deshacer dos veces se rechaza', deshacer(des.estado, entradaId).error !== null);
  comprobar('Deshacer algo que no existe se rechaza', deshacer(r.estado, 'zzz').error !== null);
  // Un aviso ya dado no se puede "no dar". Deshacerlo se acepta —queda marcado
  // en el historial— pero no revierte nada, y eso se dice con `sinEfecto`.
  const conAviso = ejecutar(con, { accion: 'avisar', valor: 'Prepara la mochila' }, { fecha: HOY }).estado;
  const desAviso = deshacer(conAviso, historialDe(conAviso)[0].id);
  comprobar('⚠️ CLAVE · Un AVISO ya dado no se puede "no dar": se marca, pero sin efecto',
    desAviso.error === null && desAviso.sinEfecto === true);
  comprobar('CLAVE · ...y aun así queda marcado como deshecho', historialDe(desAviso.estado)[0].deshecha === true);

  const todo = ejecutarTodo({ ...con, automatizaciones: [bata, crearAutomatizacion({ accion: 'sugerir_tarea', valor: 'Estudiar', condiciones: [{ tipo: 'actividad', valor: 'Biología' }] })] }, HOY);
  comprobar('CRITERIO · Se puede ejecutar todo lo del día de una vez (apartado 48)', todo.hechas.length === 1);
  comprobar('⚠️ CLAVE · ...y lo que necesita confirmación se queda FUERA, no se cuela en el lote',
    todo.pendientesDeConfirmar.length === 1);

  comprobar(`El historial se corta en ${MAX_HISTORIAL}: no crece sin fin`, MAX_HISTORIAL === 60);

  const res = resumenAutomatizaciones(r.estado, HOY);
  comprobar('El resumen cuenta las reglas y lo ejecutado', res.total === 1 && res.ejecutadas === 1);
  comprobar('...y lo deshecho', resumenAutomatizaciones(des.estado, HOY).deshechas === 1);
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí: que la pantalla se refresque sola al pasar la hora');
console.log('     y el cambio de día con la app cerrada. Son del navegador real (R1).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
