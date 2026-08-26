// ============================================================================
// HT · Fase 6/12 — EL MOTOR DE CONTEXTO TEMPORAL
//
// *"Se deberá crear un servicio central que pueda responder: ¿Qué está
// ocurriendo ahora? ¿Qué viene después? ¿Qué tengo hoy? ¿Qué tengo mañana?
// ¿Qué está pendiente? ¿Qué es importante?"* (apartado 101)
//
// Y el apartado 102, que es el que decide la forma del archivo:
//
//   *"HOY no almacenará una copia independiente de todo. Consultará las
//   entidades originales."*
//
// Por eso **este archivo no guarda nada**. Es una función de lectura sobre el
// estado que ya existe: horario, tareas, exámenes, hábitos, entrenamientos.
// Si guardara "las cosas de hoy", habría dos verdades — y la copia empieza a
// mentir en cuanto se completa una tarea desde Productividad.
//
// ── LO QUE NO SE HA VUELTO A CONSTRUIR, Y ES EL 90 % DEL TRABAJO ───────────
//
// La especificación describe HOY como si el proyecto empezara de cero. No
// empieza: JosStyle **ya tiene** casi todas las piezas, y duplicarlas habría
// sido el error del apartado 102 cometido a mano.
//
// · **Los eventos de otros módulos** ya los reúne `calendarioIntegracion.js`
//   (`eventosDerivados`), con exámenes, tareas, entrenamientos y objetivos.
//   Aquí se LEE de ahí; no hay un segundo recolector.
// · **La línea del día, los huecos, los conflictos y los avisos** ya están en
//   `horario.js` desde HT F1.
// · **La puntuación del día** (apartado 37) ya es `puntuacion.js`, del
//   Dashboard. Una segunda puntuación daría dos números distintos para el
//   mismo día, que es peor que no tener ninguno.
//
// Lo que sí faltaba —y es lo que hay aquí— es **la pregunta**: qué está
// pasando ahora mismo, cuánto queda, qué viene después, qué está pendiente y
// en qué orden, cuánta carga hay y cuánto tiempo libre.
//
// ── LA REGLA QUE MÁS SE NOTA ───────────────────────────────────────────────
//
// **Un día sin nada no es una pantalla rota** (apartado 69). Todas las
// funciones devuelven una forma completa aunque no haya ni un dato, y
// `estadoDelDia` distingue "no hay nada programado" de "no se ha cargado".
// ============================================================================

import { todayISO, addDays } from './helpers';
import {
  normalizarHorarioTop, resolverDia, lineaDelDia, huecosDelDia, conflictosDelDia,
  avisosDelDia, materialDelDia, esDiaLibre, diaDeFecha, DIAS_SEMANA,
  minutosDe, duracionMinutos, pesoPrioridad,
} from './horario';
import { eventosDerivados } from './calendarioIntegracion';
import { visibleEn } from './actividades';

/* ===========================================================================
   1 · AHORA, SIGUIENTE Y CUÁNTO QUEDA (apartados 3, 4 y 5)
   =========================================================================== */

/** Los minutos desde medianoche de una hora `HH:MM`, o de `Date` si no se da. */
export function minutosAhora(ahora = null) {
  if (typeof ahora === 'string') return minutosDe(ahora);
  const d = ahora instanceof Date ? ahora : new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * Apartado 3 — *"si en este momento existe una actividad, se destacará"*.
 *
 * Solo tiene sentido en el día de hoy: preguntar "qué hay ahora" mirando el
 * jueves que viene no significa nada, y devolver algo sería mentir.
 */
export function ahoraMismo(estado, { fecha = todayISO(), hoy = todayISO(), ahora = null, asignaturas = [] } = {}) {
  if (fecha !== hoy) return null;
  const m = minutosAhora(ahora);
  const eventos = resolverDia(estado, fecha, { asignaturas });
  const actual = eventos.find((ev) => {
    const i = minutosDe(ev.inicio);
    const f = minutosDe(ev.fin);
    return i !== null && f !== null && m >= i && m < f;
  });
  if (!actual) return null;
  const restan = minutosDe(actual.fin) - m;
  return { ...actual, minutosRestantes: restan, texto: `${actual.titulo} termina en ${describirMinutos(restan)}` };
}

/**
 * Apartado 4 — lo que viene después. Si hoy ya no queda nada, se mira mañana y
 * los días siguientes: *"para que el usuario sepa inmediatamente qué viene"*,
 * y un viernes por la tarde lo que viene es el lunes.
 */
export function siguiente(estado, { fecha = todayISO(), hoy = todayISO(), ahora = null, asignaturas = [], dias = 7 } = {}) {
  const m = fecha === hoy ? minutosAhora(ahora) : -1;
  for (let i = 0; i < Math.max(1, dias); i++) {
    const f = addDays(fecha, i);
    const eventos = resolverDia(estado, f, { asignaturas });
    const proximo = eventos.find((ev) => (i > 0 ? true : minutosDe(ev.inicio) > m));
    if (proximo) {
      const faltan = i === 0 ? minutosDe(proximo.inicio) - m : null;
      return {
        ...proximo,
        fecha: f,
        esHoy: i === 0,
        minutosPara: faltan,
        texto: faltan !== null
          ? `${proximo.titulo} empieza en ${describirMinutos(faltan)}`
          : `${proximo.titulo}, ${i === 1 ? 'mañana' : DIAS_SEMANA[(diaDeFecha(f) || 1) - 1].label.toLowerCase()} a las ${proximo.inicio}`,
      };
    }
  }
  return null;
}

/** "23 min", "1 h 30 min", "2 h". Nunca "0.5 h" ni "90 minutos". */
export function describirMinutos(min) {
  const n = Math.max(0, Math.round(min || 0));
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/* ===========================================================================
   2 · LO PENDIENTE (apartados 32, 33, 34 y 36)
   ===========================================================================
   *"Orden: vencidas, para hoy, próximas, baja prioridad."*

   ⚠️ Las tareas son de Productividad y los exámenes de Estudios. Aquí **se
   leen**, no se copian ni se escriben: el apartado 102 y el 92 de F5 dicen lo
   mismo desde dos sitios distintos. */

export const ESTADOS_PENDIENTE = ['vencida', 'hoy', 'proxima', 'sin_fecha'];

/**
 * Todo lo que está pendiente, ordenado como pide el apartado 32.
 *
 * Una tarea vencida **no desaparece** (apartado 33): sigue arriba del todo, con
 * cuántos días lleva. Desaparecer sería la forma más rápida de que se olvide.
 */
export function pendientes({ productividad = null, estudios = null, hoy = todayISO(), dias = 7 } = {}) {
  const limite = addDays(hoy, dias);
  const salida = [];

  for (const t of productividad?.tareas || []) {
    if (t?.hecha) continue;
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(t?.fecha || '') ? t.fecha : '';
    const estado = !fecha ? 'sin_fecha' : fecha < hoy ? 'vencida' : fecha === hoy ? 'hoy' : 'proxima';
    if (estado === 'proxima' && fecha > limite) continue;
    salida.push({
      id: `tarea:${t.id}`,
      refId: t.id,
      tipo: 'tarea',
      titulo: t.texto || t.titulo || 'Tarea',
      fecha,
      estado,
      diasDeRetraso: estado === 'vencida' ? diasEntre(fecha, hoy) : 0,
      prioridad: t.prioridad || 'normal',
      modulo: 'productividad',
    });
  }

  for (const x of estudios?.examenes || []) {
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(x?.fecha || '') ? x.fecha : '';
    if (!fecha || fecha < hoy || fecha > limite) continue;
    const asig = (estudios?.asignaturas || []).find((a) => a.id === x.asignaturaId);
    salida.push({
      id: `examen:${x.id}`,
      refId: x.id,
      tipo: 'examen',
      titulo: `Examen${asig?.nombre ? ` de ${asig.nombre}` : ''}${x.tema ? ` · ${x.tema}` : ''}`,
      fecha,
      estado: fecha === hoy ? 'hoy' : 'proxima',
      diasDeRetraso: 0,
      // Un examen pesa siempre: es la fecha que no se puede reprogramar.
      prioridad: 'alta',
      diasPara: diasEntre(hoy, fecha),
      modulo: 'estudios',
    });
  }

  const rango = (p) => ESTADOS_PENDIENTE.indexOf(p.estado);
  return salida.sort((a, b) =>
    rango(a) - rango(b)
    || pesoPrioridad(b.prioridad) - pesoPrioridad(a.prioridad)
    || (a.fecha || '9999').localeCompare(b.fecha || '9999')
    || a.titulo.localeCompare(b.titulo, 'es'));
}

/** Días enteros entre dos fechas ISO. Cero si alguna falta. */
export function diasEntre(desde, hasta) {
  if (!desde || !hasta) return 0;
  return Math.round((new Date(`${hasta}T00:00:00`) - new Date(`${desde}T00:00:00`)) / 86400000);
}

/**
 * Apartado 34 — *"reprogramar → mañana / este fin de semana / elegir fecha.
 * Esto deberá requerir pocos toques."*
 *
 * Devuelve las fechas, no escribe: quien reprograma es Productividad, que es
 * la dueña de la tarea.
 */
export function opcionesReprogramar(hoy = todayISO()) {
  const dia = diaDeFecha(hoy) || 1;
  // El sábado más próximo. Si hoy ES sábado o domingo, el de la semana que viene:
  // "este fin de semana" en domingo por la tarde no sirve de nada.
  const alSabado = dia >= 6 ? 13 - dia : 6 - dia;
  return [
    { id: 'manana', label: 'Mañana', fecha: addDays(hoy, 1) },
    { id: 'finde', label: 'Este fin de semana', fecha: addDays(hoy, alSabado) },
    { id: 'semana', label: 'La semana que viene', fecha: addDays(hoy, 8 - dia) },
  ];
}

/* ===========================================================================
   3 · LA CARGA DEL DÍA (apartados 6 y 38)
   ===========================================================================
   *"Carga baja · normal · alta."* Y el aviso del apartado 38: *"mañana tienes
   8 actividades y 4 tareas pendientes."*

   ⚠️ La carga **describe, no riñe**. Un día cargado no es un día malo, y esto
   no puede convertirse en un reproche (apartado 37: *"no deberá convertirse en
   una obligación ni penalizar al usuario injustamente"*). */

export const NIVELES_CARGA = [
  { id: 'libre', label: 'Día libre', desde: 0 },
  { id: 'baja', label: 'Carga baja', desde: 1 },
  { id: 'normal', label: 'Carga normal', desde: 4 },
  { id: 'alta', label: 'Carga alta', desde: 8 },
];

export function cargaDelDia(estado, fecha, { asignaturas = [], productividad = null, estudios = null, hoy = todayISO() } = {}) {
  const eventos = resolverDia(estado, fecha, { asignaturas });
  const delDia = pendientes({ productividad, estudios, hoy, dias: 0 })
    .filter((p) => p.fecha === fecha || (fecha === hoy && p.estado === 'vencida'));
  const total = eventos.length + delDia.length;
  const nivel = [...NIVELES_CARGA].reverse().find((n) => total >= n.desde) || NIVELES_CARGA[0];
  return {
    fecha,
    actividades: eventos.length,
    pendientes: delDia.length,
    minutos: eventos.reduce((t, ev) => t + (duracionMinutos(ev.inicio, ev.fin) || 0), 0),
    total,
    nivel: nivel.id,
    label: nivel.label,
  };
}

/**
 * Apartado 6 — el resumen de arriba. Cuenta lo que hay; **no puntúa**: la
 * puntuación del día ya existe (`puntuacion.js`, del Dashboard) y una segunda
 * daría dos números distintos para el mismo día.
 */
export function estadoDelDia(estado, fecha, opciones = {}) {
  const { asignaturas = [], productividad = null, estudios = null, hoy = todayISO(), horarioId = null } = opciones;
  const eventos = resolverDia(estado, fecha, { asignaturas });
  const carga = cargaDelDia(estado, fecha, opciones);
  const libre = esDiaLibre(estado, fecha, horarioId);
  return {
    fecha,
    nombreDia: DIAS_SEMANA[(diaDeFecha(fecha) || 1) - 1]?.label || '',
    esHoy: fecha === hoy,
    diaLibre: libre,
    actividades: eventos.length,
    entrenamientos: eventos.filter((ev) => ev.tipo === 'entrenamiento').length,
    pendientes: carga.pendientes,
    prioridades: eventos.filter((ev) => pesoPrioridad(ev.prioridad) >= 2).length,
    minutos: carga.minutos,
    carga: carga.nivel,
    // ⚠️ La diferencia entre "no hay nada" y "no se ha cargado": una pantalla
    // vacía por un fallo no puede parecer un domingo tranquilo (apartado 69).
    vacio: eventos.length === 0 && carga.pendientes === 0,
  };
}

/* ===========================================================================
   4 · TIEMPO LIBRE (apartados 65, 66 y 68)
   ===========================================================================
   *"1 h 30 min libres."* Y el 68: **el descanso es una actividad válida**, no
   tiempo perdido — así que un hueco entre dos clases y un bloque de descanso
   son cosas distintas y se cuentan aparte. */
export function tiempoLibre(estado, fecha, { asignaturas = [], minimo = 30, desde = '08:00', hasta = '22:00' } = {}) {
  const huecos = huecosDelDia(estado, fecha, { asignaturas, minimo, desde, hasta });
  const descansos = resolverDia(estado, fecha, { asignaturas }).filter((ev) => ev.tipo === 'descanso');
  const minutos = huecos.reduce((t, h) => t + (h.minutos || duracionMinutos(h.inicio, h.fin) || 0), 0);
  return {
    huecos,
    minutos,
    texto: minutos ? `${describirMinutos(minutos)} libres` : 'Sin huecos entre actividades',
    descansos: descansos.length,
    minutosDescanso: descansos.reduce((t, d) => t + (duracionMinutos(d.inicio, d.fin) || 0), 0),
  };
}

/* ===========================================================================
   5 · LA LÍNEA DEL DÍA, CON LA HORA ACTUAL (apartado 2)
   ===========================================================================
   *"La hora actual tendrá un indicador visual."* La línea ya la construye
   `lineaDelDia` desde HT F1; lo que falta es dónde cae el "ahora". */
export function lineaConAhora(estado, fecha, { asignaturas = [], hoy = todayISO(), ahora = null, horarioId = null } = {}) {
  // ⚠️ `lineaDelDia` devuelve el día ENTERO (eventos, enCurso, libre, total…),
  // no una lista. Tratarlo como un array deja la pantalla en blanco.
  const linea = lineaDelDia(estado, fecha, { asignaturas, horarioId });
  if (fecha !== hoy) return { ...linea, ahora: null };
  const m = minutosAhora(ahora);
  return {
    ...linea,
    eventos: linea.eventos.map((ev) => ({
      ...ev,
      pasado: minutosDe(ev.fin) <= m,
      enCurso: minutosDe(ev.inicio) <= m && minutosDe(ev.fin) > m,
    })),
    ahora: { minutos: m, hora: aHora(m) },
  };
}

/* ===========================================================================
   6 · LOS OTROS MÓDULOS (apartados 15, 16, 53, 54, 56 y 58)
   ===========================================================================
   *"HORARIO + EVENTOS + TAREAS + EXÁMENES + ENTRENAMIENTOS + HÁBITOS →
   CALENDARIO → HOY."*

   ⚠️ El recolector **ya existe**: `eventosDerivados` de `calendarioIntegracion.js`
   reúne exámenes, tareas, entrenamientos, objetivos, relación y armario. Un
   segundo recolector sería exactamente la copia que el apartado 102 prohíbe. */
export function eventosDeOtrosModulos(fecha, modulos = {}) {
  return eventosDerivados(modulos)
    .filter((ev) => ev.fecha === fecha)
    .map((ev) => ({
      id: ev.id,
      titulo: ev.titulo,
      inicio: ev.horaInicio || '',
      fin: ev.horaFin || '',
      todoElDia: !!ev.todoElDia,
      tipo: ev.tipo,
      origen: ev.origen,
      origenId: ev.origenId,
      soloLectura: true,
    }));
}

/** Los eventos propios del Calendario Universal que caen en una fecha. */
export function eventosDelCalendario(calendario, fecha) {
  return (calendario?.eventos || [])
    .filter((ev) => ev?.fecha === fecha)
    .map((ev) => ({
      id: `calendario:${ev.id}`,
      titulo: ev.titulo || 'Evento',
      inicio: ev.horaInicio || '',
      fin: ev.horaFin || '',
      todoElDia: !!ev.todoElDia,
      tipo: ev.tipo || 'evento',
      origen: 'calendario',
      origenId: ev.id,
      soloLectura: false,
    }));
}

/* ===========================================================================
   7 · LA AGENDA COMPLETA DE UN DÍA (apartados 7, 8 y 15)
   ===========================================================================
   Horario + eventos + lo que traen los otros módulos, en una sola lista
   ordenada por hora. Lo de todo el día va arriba, que es donde se mira. */
export function agendaCompleta(estado, fecha, opciones = {}) {
  const { asignaturas = [], calendario = null, actividades = null, ...modulos } = opciones;
  const delHorario = resolverDia(estado, fecha, { asignaturas })
    .map((ev) => ({ ...ev, origen: 'horario', soloLectura: false, todoElDia: false }));

  // HT F5 · apartado 50 — una actividad puede estar apagada para HOY sin
  // desaparecer del horario.
  const acts = actividades || normalizarHorarioTop(estado).actividades;
  const visibles = delHorario.filter((ev) => {
    if (!ev.actividadId) return true;
    const act = acts.find((a) => a.id === ev.actividadId);
    return act ? visibleEn(act, 'hoy') : true;
  });

  const otros = [...eventosDeOtrosModulos(fecha, modulos), ...eventosDelCalendario(calendario, fecha)];
  const todoElDia = otros.filter((ev) => ev.todoElDia || !ev.inicio);
  const conHora = [...visibles, ...otros.filter((ev) => !ev.todoElDia && ev.inicio)]
    .sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''));

  return { fecha, todoElDia, eventos: conHora, total: todoElDia.length + conHora.length };
}

/* ===========================================================================
   8 · EL MOTOR (apartado 101)
   ===========================================================================
   Una sola llamada que responde las ocho preguntas. Es lo que usarán HOY, la
   IA, las notificaciones, la mochila, el calendario y el dashboard: si cada
   uno preguntara por su cuenta, acabarían dando respuestas distintas. */
export function contextoTemporal(estado, opciones = {}) {
  const { fecha = todayISO(), hoy = todayISO(), ahora = null, asignaturas = [], horarioId = null } = opciones;
  const manana = addDays(fecha, 1);

  return {
    fecha,
    esHoy: fecha === hoy,
    dia: estadoDelDia(estado, fecha, opciones),
    ahora: ahoraMismo(estado, { ...opciones, fecha, hoy, ahora }),
    siguiente: siguiente(estado, { ...opciones, fecha, hoy, ahora }),
    linea: lineaConAhora(estado, fecha, { asignaturas, hoy, ahora, horarioId }),
    agenda: agendaCompleta(estado, fecha, opciones),
    pendientes: pendientes({ ...opciones, hoy }),
    libre: tiempoLibre(estado, fecha, { asignaturas }),
    conflictos: conflictosDelDia(estado, fecha, { asignaturas }),
    avisos: avisosDelDia(estado, fecha, { asignaturas }),
    material: materialDelDia(estado, fecha, { asignaturas }),
    // Apartado 85 — el acceso rápido a MAÑANA, que es lo que se necesita para
    // preparar la mochila por la noche.
    manana: {
      fecha: manana,
      dia: estadoDelDia(estado, manana, { ...opciones, fecha: manana }),
      material: materialDelDia(estado, manana, { asignaturas }),
      agenda: agendaCompleta(estado, manana, opciones),
    },
  };
}

/* ===========================================================================
   9 · LA SEMANA (apartados 9 y "resumen semanal")
   =========================================================================== */
export function resumenSemana(estado, { desde = todayISO(), dias = 7, ...opciones } = {}) {
  const dd = [];
  for (let i = 0; i < dias; i++) {
    const f = addDays(desde, i);
    dd.push(estadoDelDia(estado, f, { ...opciones, fecha: f }));
  }
  const masCargado = dd.reduce((peor, d) => (d.actividades + d.pendientes > peor.actividades + peor.pendientes ? d : peor), dd[0]);
  return {
    dias: dd,
    actividades: dd.reduce((t, d) => t + d.actividades, 0),
    minutos: dd.reduce((t, d) => t + d.minutos, 0),
    libres: dd.filter((d) => d.vacio || d.diaLibre).length,
    // ⚠️ Se dice cuál es el día más cargado, **no que sea un problema**: el
    // aviso es de la Fase 11, y aquí sería un juicio sin datos suficientes.
    masCargado: masCargado || null,
  };
}

/* ===========================================================================
   10 · MODOS (criterios: "modo mínimo" y "modo completo")
   =========================================================================== */
export const MODOS_HOY = [
  { id: 'minimo', label: 'Lo justo', sub: 'Ahora, lo siguiente y lo pendiente' },
  { id: 'completo', label: 'Todo', sub: 'Con línea del día, huecos y mañana' },
];

export const modoHoy = (id) => MODOS_HOY.find((m) => m.id === id) || MODOS_HOY[1];

/* ===========================================================================
   11 · CONTEXTO PARA LA IA (apartados 63, 64 y 110)
   ===========================================================================
   *"¿Qué necesito para Biología mañana?"* — la IA necesita el contexto, no una
   respuesta ya escrita.

   ⚠️ **No llama a nadie** (regla 7) y **no incluye notas privadas** (HT F5,
   apartados 52 y 73). Y el apartado 110 es explícito: *"inteligencia sin
   automatismos peligrosos"* — esto describe el día, no lo cambia. */
export function contextoHoyIA(estado, opciones = {}) {
  const c = contextoTemporal(estado, opciones);
  return {
    fecha: c.fecha,
    dia: c.dia.nombreDia,
    carga: c.dia.carga,
    ahora: c.ahora ? { titulo: c.ahora.titulo, inicio: c.ahora.inicio, fin: c.ahora.fin } : null,
    siguiente: c.siguiente ? { titulo: c.siguiente.titulo, inicio: c.siguiente.inicio, esHoy: c.siguiente.esHoy } : null,
    actividades: c.agenda.eventos.map((ev) => ({ titulo: ev.titulo, inicio: ev.inicio, fin: ev.fin })),
    pendientes: c.pendientes.map((p) => ({ titulo: p.titulo, estado: p.estado, fecha: p.fecha, tipo: p.tipo })),
    minutosLibres: c.libre.minutos,
    conflictos: c.conflictos.length,
    materialManana: c.manana.material.map((m) => m.nombre || m),
  };
}

/* ===========================================================================
   12 · AVISOS AGRUPADOS (apartados 80, 81 y 82)
   ===========================================================================
   *"No se debe bombardear al usuario. El sistema podrá agrupar: «tienes 3
   cosas importantes hoy» en lugar de enviar tres avisos innecesarios."*

   ⚠️ Esto **describe** los avisos; **no notifica**. Mandarlos es la Fase 10, y
   el proyecto ya tiene su propio sistema de notificaciones: dos emisores
   darían dos avisos por lo mismo (es la razón por la que `avisosDelDia` de HT
   F1 también describe y no manda). */
export const PRIORIDADES_AVISO = ['alta', 'media', 'baja'];

export function avisosAgrupados(estado, opciones = {}) {
  const { hoy = todayISO() } = opciones;
  const p = pendientes({ ...opciones, hoy });
  const grupos = { alta: [], media: [], baja: [] };

  for (const x of p) {
    // Un examen mañana es alta; una tarea pendiente, media; algo de dentro de
    // una semana, baja. Es el reparto literal del apartado 82.
    const dias = x.fecha ? diasEntre(hoy, x.fecha) : 99;
    const nivel = x.estado === 'vencida' || (x.tipo === 'examen' && dias <= 1) ? 'alta'
      : dias <= 2 ? 'media' : 'baja';
    grupos[nivel].push(x);
  }

  const importantes = grupos.alta.length + grupos.media.length;
  return {
    ...grupos,
    total: p.length,
    importantes,
    // Un solo mensaje, no uno por cosa.
    resumen: importantes === 0 ? '' : `Tienes ${importantes} ${importantes === 1 ? 'cosa importante' : 'cosas importantes'} hoy.`,
  };
}
