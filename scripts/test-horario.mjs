// ============================================================================
// HT · Fase 1/12 — Pruebas de la arquitectura de Horario Top
//
// Lo que más se comprueba es la distinción de los apartados 2 y 5, que es de
// donde cuelga todo lo demás: **el horario es una regla, no una lista de
// eventos**. Si eso se materializara, cambiar la hora de una clase obligaría a
// editar cuarenta filas y un festivo a borrar seis.
// ============================================================================

import {
  DEFAULT_HORARIO_TOP, TIPOS_HORARIO, tipoHorario, PRIORIDADES, prioridad, pesoPrioridad,
  DIAS_SEMANA, diaDeFecha, crearColumna, crearFila, normalizarHora, minutosDe, duracionMinutos,
  cuadriculaInicial, crearHorario, normalizarHorarioObj,
  TIPOS_ACTIVIDAD, crearActividad, normalizarActividad, nombreDeActividad,
  crearBloque, normalizarBloque, TIPOS_EXCEPCION, crearExcepcion, normalizarExcepcion,
  normalizarHorarioTop, resolverDia, esDiaLibre, lineaDelDia, proximoEvento,
  materialDelDia, avisosDelDia, contextoIA,
  seSolapan, conflictosDelDia, huecosDelDia,
  eliminarHorario, eliminarActividad, eliminarColumna, revisarHorario, resumenHorario,
} from '../src/lib/horario.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

// 2026-08-24 es LUNES. Todas las fechas de aquí abajo salen de esa semana.
const LUNES = '2026-08-24';
const MARTES = '2026-08-25';
const MIERCOLES = '2026-08-26';
const SABADO = '2026-08-29';
const MARTES_SIG = '2026-09-01';

/** Un horario escolar de verdad, con tres asignaturas y seis bloques. */
function montarInstituto() {
  const horario = crearHorario({ nombre: 'Instituto', tipo: 'escolar', periodo: '2026-2027', hoy: LUNES });
  const col = (dia) => horario.columnas.find((c) => c.dia === dia);

  const mates = crearActividad({ nombre: 'Matemáticas', tipo: 'asignatura', color: '#3B82F6', material: ['Libro', 'Calculadora', 'Libreta'], ubicacion: 'Aula 12' });
  const bio = crearActividad({ nombre: 'Biología', tipo: 'asignatura', color: '#22C55E', material: ['Libro', 'Libreta'], ubicacion: 'Laboratorio' });
  const ingles = crearActividad({ nombre: 'Inglés', tipo: 'asignatura', color: '#A855F7', material: ['Libreta'] });

  const b = (dia, actividadId, inicio, fin) =>
    crearBloque({ horarioId: horario.id, columnaId: col(dia).id, actividadId, inicio, fin });

  const bloques = [
    b(1, mates.id, '08:00', '09:00'),
    b(1, bio.id, '09:00', '10:00'),
    b(2, bio.id, '10:00', '11:00'),
    b(2, ingles.id, '11:00', '12:00'),
    b(3, mates.id, '08:00', '09:00'),
    // Un bloque SIN actividad: "Recreo". Obligar a crear una entidad para eso
    // sería fricción sin motivo (apartado 26).
    crearBloque({ horarioId: horario.id, columnaId: col(3).id, titulo: 'Recreo', inicio: '11:00', fin: '11:30' }),
  ];

  return {
    estado: { horarios: [horario], actividades: [mates, bio, ingles], bloques, excepciones: [] },
    horario, col, mates, bio, ingles, bloques,
  };
}

/* ===========================================================================
   MODELO BÁSICO (apartados 4, 6, 7, 8 y 12)
   =========================================================================== */
console.log('\n═══ HT Fase 1 — modelo, columnas y filas ═══\n');
{
  comprobar('El estado por defecto trae las cuatro listas',
    ['horarios', 'actividades', 'bloques', 'excepciones'].every((k) => Array.isArray(DEFAULT_HORARIO_TOP[k])));
  comprobar('Los seis tipos de horario del apartado 4', TIPOS_HORARIO.length === 6);
  comprobar('Un tipo inventado cae en "personalizado"', tipoHorario('zzz').id === 'personalizado');
  comprobar('Las cuatro prioridades del apartado 15', PRIORIDADES.length === 4);
  comprobar('...y se ordenan por peso', pesoPrioridad('urgente') > pesoPrioridad('alta') && pesoPrioridad('alta') > pesoPrioridad('normal'));
  comprobar('Una prioridad inventada cae en "normal"', prioridad('zzz').id === 'normal');

  // El día local: lunes es 1, domingo 7.
  comprobar('CLAVE · El lunes es el día 1, no el 0', diaDeFecha(LUNES) === 1);
  comprobar('...el sábado es 6', diaDeFecha(SABADO) === 6);
  comprobar('...y el domingo es 7, no 0', diaDeFecha('2026-08-30') === 7);
  comprobar('Una fecha ilegible no revienta', diaDeFecha('mañana') === null);
  comprobar('Los siete días están', DIAS_SEMANA.length === 7);

  // Horas.
  comprobar('Una hora se normaliza a HH:MM', normalizarHora('8:5') === '' && normalizarHora('8:05') === '08:05');
  comprobar('Una hora imposible se rechaza', normalizarHora('25:00') === '' && normalizarHora('10:70') === '');
  comprobar('Los minutos se calculan bien', minutosDe('08:30') === 510);
  comprobar('La duración también', duracionMinutos('08:00', '09:30') === 90);
  comprobar('CLAVE · Una duración al revés es cero, no negativa', duracionMinutos('10:00', '09:00') === 0);
  comprobar('...y sin horas también', duracionMinutos('', '') === 0);

  // Apartado 7 — las columnas no dependen de llamarse "Lunes".
  const propia = crearColumna({ nombre: 'Semana A' });
  comprobar('CLAVE · Una columna puede NO ser un día', propia.dia === null && propia.nombre === 'Semana A');
  comprobar('Una columna de día toma su nombre solo', crearColumna({ dia: 3 }).nombre === 'Miércoles');
  comprobar('Un día imposible se descarta', crearColumna({ dia: 9 }).dia === null);

  // Apartado 8 — franjas de cualquier duración.
  comprobar('CLAVE · Una fila guarda inicio Y fin, no una duración implícita',
    crearFila({ inicio: '11:00', fin: '11:20' }).fin === '11:20');
  comprobar('...así cabe un recreo de 20 minutos entre clases de 50',
    duracionMinutos(crearFila({ inicio: '11:00', fin: '11:20' }).inicio, crearFila({ inicio: '11:00', fin: '11:20' }).fin) === 20);

  const { columnas, filas } = cuadriculaInicial();
  comprobar('La cuadrícula inicial trae 5 columnas y 6 filas', columnas.length === 5 && filas.length === 6);
  comprobar('...de lunes a viernes', columnas.map((c) => c.dia).join(',') === '1,2,3,4,5');
  comprobar('...de 08:00 a 14:00', filas[0].inicio === '08:00' && filas[5].fin === '14:00');

  const h = crearHorario({ nombre: '  ', tipo: 'entrenamiento' });
  comprobar('Un horario sin nombre toma el de su tipo', h.nombre === 'Entrenamiento');
  comprobar('...y nace activo', h.activo === true);
  comprobar('Un horario guardado a medias se normaliza', normalizarHorarioObj({}).columnas.length === 0);
  comprobar('Un estado nulo tampoco revienta', normalizarHorarioTop(null).bloques.length === 0);
  comprobar('Un bloque sin horario ni columna se descarta',
    normalizarHorarioTop({ bloques: [{ id: 'x' }] }).bloques.length === 0);
}

/* ===========================================================================
   EL APARTADO 25 — NO DUPLICAR EL DATO DE ESTUDIOS
   =========================================================================== */
console.log('\n═══ Las asignaturas no se duplican ═══\n');
{
  const asignaturas = [{ id: 'a1', programaId: 'p', nombre: 'Biología' }];
  const act = crearActividad({ tipo: 'asignatura', asignaturaId: 'a1', color: '#22C55E' });

  comprobar('CLAVE · Una actividad escolar NO guarda el nombre: apunta a Estudios',
    act.nombre === '' && act.asignaturaId === 'a1');
  comprobar('CLAVE · ...y el nombre se resuelve desde allí', nombreDeActividad(act, asignaturas) === 'Biología');
  comprobar('CLAVE · Renombrarla en Estudios la renombra en el horario',
    nombreDeActividad(act, [{ id: 'a1', nombre: 'Biología y Geología' }]) === 'Biología y Geología');
  comprobar('Si la asignatura desapareció, cae a su nombre propio',
    nombreDeActividad({ ...act, nombre: 'Bio' }, []) === 'Bio');
  comprobar('...y sin ninguno, a "Sin nombre" — nunca a un id',
    nombreDeActividad(act, []) === 'Sin nombre');

  const propia = crearActividad({ nombre: 'Entrenamiento', tipo: 'entrenamiento' });
  comprobar('Una actividad que NO es asignatura sí guarda su nombre', nombreDeActividad(propia, []) === 'Entrenamiento');
  comprobar('...porque no existe en ningún otro módulo', propia.asignaturaId === null);

  comprobar('Los seis tipos de actividad', TIPOS_ACTIVIDAD.length === 6);
  comprobar('Un tipo inventado cae en "otro"', normalizarActividad({ tipo: 'zzz' }).tipo === 'otro');
  comprobar('El material se limpia de basura', normalizarActividad({ material: ['Libro', '', '  ', 5] }).material.length === 1);
  comprobar('Un material que no es lista no revienta', normalizarActividad({ material: 'Libro' }).material.length === 0);
}

/* ===========================================================================
   EL HORARIO ES UNA REGLA, NO UNA LISTA (apartados 2 y 5)
   =========================================================================== */
console.log('\n═══ Regla base, excepción y evento real ═══\n');
{
  const { estado, bloques, bio } = montarInstituto();
  const asignaturas = [];

  const lunes = resolverDia(estado, LUNES, { asignaturas });
  comprobar('El lunes salen sus dos bloques', lunes.length === 2, String(lunes.length));
  comprobar('...ordenados por hora', lunes[0].inicio === '08:00' && lunes[1].inicio === '09:00');
  comprobar('...con su nombre resuelto', lunes[0].titulo === 'Matemáticas');
  comprobar('...su color y su material', lunes[0].color === '#3B82F6' && lunes[0].material.length === 3);
  comprobar('El martes salen los suyos', resolverDia(estado, MARTES).length === 2);
  comprobar('CLAVE · El sábado no sale nada: no hay columna de sábado', resolverDia(estado, SABADO).length === 0);

  // CLAVE — el mismo bloque vale para todos los martes del curso, sin
  // materializar ni uno.
  comprobar('CLAVE · El MISMO bloque resuelve en dos martes distintos',
    resolverDia(estado, MARTES)[0].bloqueId === resolverDia(estado, MARTES_SIG)[0].bloqueId);
  comprobar('CLAVE · ...y no hay eventos guardados: solo 6 bloques', estado.bloques.length === 6);

  // Un bloque sin actividad conserva su título.
  const miercoles = resolverDia(estado, MIERCOLES);
  comprobar('Un bloque sin actividad usa su propio título', miercoles.some((e) => e.titulo === 'Recreo'));
  comprobar('...y no inventa material', miercoles.find((e) => e.titulo === 'Recreo').material.length === 0);

  // --- EXCEPCIONES ---
  const bloqueBioMartes = bloques[2];

  // Cancelada.
  const conCancelada = { ...estado, excepciones: [crearExcepcion({ fecha: MARTES, tipo: 'cancelado', bloqueId: bloqueBioMartes.id, motivo: 'Profesor enfermo' })] };
  comprobar('CLAVE · Cancelar un día quita SOLO ese día', resolverDia(conCancelada, MARTES).length === 1);
  comprobar('CLAVE · ...y el martes siguiente sigue intacto', resolverDia(conCancelada, MARTES_SIG).length === 2);

  // Modificada: cambia la hora.
  const conCambio = { ...estado, excepciones: [crearExcepcion({ fecha: MARTES, tipo: 'modificado', bloqueId: bloqueBioMartes.id, cambios: { inicio: '12:00', fin: '13:00' }, motivo: 'Cambio de aula' })] };
  const cambiado = resolverDia(conCambio, MARTES).find((e) => e.bloqueId === bloqueBioMartes.id);
  comprobar('Modificar cambia la hora ese día', cambiado.inicio === '12:00');
  comprobar('...y lo dice', cambiado.origen === 'modificado' && cambiado.motivo === 'Cambio de aula');
  comprobar('...pero el martes siguiente sigue a las 10:00',
    resolverDia(conCambio, MARTES_SIG).find((e) => e.bloqueId === bloqueBioMartes.id).inicio === '10:00');
  comprobar('...y se reordena por la hora nueva', resolverDia(conCambio, MARTES)[1].inicio === '12:00');

  // Añadida: algo que no está en el horario.
  const conExtra = { ...estado, excepciones: [crearExcepcion({ fecha: SABADO, tipo: 'anadido', horarioId: estado.horarios[0].id, cambios: { titulo: 'Excursión', inicio: '09:00', fin: '18:00' } })] };
  comprobar('Añadir mete algo un sábado sin columna', resolverDia(conExtra, SABADO).length === 1);
  comprobar('...con su título', resolverDia(conExtra, SABADO)[0].titulo === 'Excursión');
  comprobar('...marcado como añadido', resolverDia(conExtra, SABADO)[0].origen === 'anadido');
  comprobar('...y sin bloque detrás', resolverDia(conExtra, SABADO)[0].bloqueId === null);

  // Día libre: UNA excepción vacía el día entero.
  const festivo = { ...estado, excepciones: [crearExcepcion({ fecha: LUNES, tipo: 'dia_libre', motivo: 'Festivo' })] };
  comprobar('CLAVE · Un festivo se declara UNA vez y vacía el día entero', resolverDia(festivo, LUNES).length === 0);
  comprobar('...sin tocar el resto de la semana', resolverDia(festivo, MARTES).length === 2);
  comprobar('...y se puede saber que es festivo, no un día vacío', esDiaLibre(festivo, LUNES) === true);
  comprobar('Un sábado vacío NO es "día libre"', esDiaLibre(estado, SABADO) === false);

  // Un festivo de un horario no afecta al otro.
  const otro = crearHorario({ nombre: 'Gimnasio', tipo: 'entrenamiento' });
  const dos = {
    ...estado,
    horarios: [...estado.horarios, otro],
    bloques: [...estado.bloques, crearBloque({ horarioId: otro.id, columnaId: otro.columnas.find((c) => c.dia === 1).id, titulo: 'Pesas', inicio: '18:00', fin: '19:30' })],
    excepciones: [crearExcepcion({ fecha: LUNES, tipo: 'dia_libre', horarioId: estado.horarios[0].id })],
  };
  comprobar('CLAVE · Un festivo de instituto NO cancela el entrenamiento',
    resolverDia(dos, LUNES).length === 1 && resolverDia(dos, LUNES)[0].titulo === 'Pesas');

  // Un horario desactivado (curso anterior) no aparece.
  const viejo = { ...estado, horarios: [{ ...estado.horarios[0], activo: false }] };
  comprobar('Un horario desactivado no resuelve nada', resolverDia(viejo, LUNES).length === 0);
  comprobar('...pero sus bloques siguen guardados', viejo.bloques.length === 6);

  // Una columna que no es un día no cae en ninguna fecha.
  const conSemanaA = {
    ...estado,
    horarios: [{ ...estado.horarios[0], columnas: [...estado.horarios[0].columnas, { id: 'semA', nombre: 'Semana A', dia: null }] }],
    bloques: [...estado.bloques, crearBloque({ horarioId: estado.horarios[0].id, columnaId: 'semA', titulo: 'Refuerzo', inicio: '16:00', fin: '17:00' })],
  };
  comprobar('CLAVE · Una columna sin día no cae en ninguna fecha',
    !resolverDia(conSemanaA, LUNES).some((e) => e.titulo === 'Refuerzo'));
  comprobar('...ni en ninguna otra', ['2026-08-25', '2026-08-26', '2026-08-27'].every((f) => !resolverDia(conSemanaA, f).some((e) => e.titulo === 'Refuerzo')));

  comprobar('Los cuatro tipos de excepción', TIPOS_EXCEPCION.length === 4);
  comprobar('Una excepción con tipo inventado cae en "cancelado"', normalizarExcepcion({ tipo: 'zzz' }).tipo === 'cancelado');
  comprobar('Una fecha ilegible se sustituye por hoy', /^\d{4}-\d{2}-\d{2}$/.test(normalizarExcepcion({ fecha: 'ayer' }).fecha));
}

/* ===========================================================================
   LA CAPA «HOY» (apartado 14)
   =========================================================================== */
console.log('\n═══ HOY: qué tengo y qué viene después ═══\n');
{
  const { estado } = montarInstituto();

  const linea = lineaDelDia(estado, LUNES, { ahora: '08:30' });
  comprobar('La línea del día trae sus eventos', linea.total === 2);
  comprobar('CLAVE · ...sabe qué está en curso a las 08:30', linea.enCurso.titulo === 'Matemáticas');
  comprobar('CLAVE · ...y qué viene después', linea.siguiente.titulo === 'Biología');
  comprobar('...y cuántos minutos suman', linea.minutos === 120);

  const antes = lineaDelDia(estado, LUNES, { ahora: '07:00' });
  comprobar('Antes de empezar no hay nada en curso', antes.enCurso === null);
  comprobar('...pero sí un siguiente', antes.siguiente.titulo === 'Matemáticas');

  const despues = lineaDelDia(estado, LUNES, { ahora: '20:00' });
  comprobar('Acabado el día no hay ni en curso ni siguiente', despues.enCurso === null && despues.siguiente === null);
  comprobar('...pero los eventos siguen ahí', despues.total === 2);

  // Justo en el minuto de cambio: el que empieza gana, el que acaba no.
  const cambio = lineaDelDia(estado, LUNES, { ahora: '09:00' });
  comprobar('CLAVE · A las 09:00 en punto, en curso es el que EMPIEZA', cambio.enCurso.titulo === 'Biología');

  const vacio = lineaDelDia(estado, SABADO, { ahora: '10:00' });
  comprobar('Un sábado sin nada se marca como vacío', vacio.vacio === true && vacio.libre === false);

  // El próximo evento, aunque sea de otro día.
  const prox = proximoEvento(estado, { desdeFecha: SABADO, ahora: '10:00' });
  comprobar('CLAVE · El próximo evento salta al día que haga falta', prox && prox.fecha === '2026-08-31');
  comprobar('...y dice cuál es', prox.titulo === 'Matemáticas');
  comprobar('Sin nada en toda la ventana devuelve null',
    proximoEvento({ ...estado, bloques: [] }, { desdeFecha: LUNES }) === null);
}

/* ===========================================================================
   LOS ENGANCHES: MOCHILA, AVISOS E IA (apartados 16, 17 y 18)
   =========================================================================== */
console.log('\n═══ Mochila, avisos e IA: solo el enganche ═══\n');
{
  const { estado } = montarInstituto();

  const material = materialDelDia(estado, LUNES);
  comprobar('El material del día se agrupa', material.length === 3, String(material.length));
  comprobar('CLAVE · La libreta sale UNA vez, no dos', material.filter((m) => m.material === 'Libreta').length === 1);
  comprobar('CLAVE · ...diciendo para qué hace falta',
    material.find((m) => m.material === 'Libreta').para.join(',') === 'Biología,Matemáticas');
  comprobar('La calculadora solo para Matemáticas',
    material.find((m) => m.material === 'Calculadora').para.join(',') === 'Matemáticas');
  comprobar('Un día sin clases no necesita nada', materialDelDia(estado, SABADO).length === 0);

  const avisos = avisosDelDia(estado, LUNES);
  comprobar('Se puede saber qué avisar y cuándo', avisos.length === 2);
  comprobar('CLAVE · El aviso va 15 minutos antes', avisos[0].a === '07:45');
  comprobar('...con su frase', avisos[0].texto.includes('En 15 minutos tienes Matemáticas'));
  comprobar('...y el aula si la hay', avisos[0].texto.includes('Aula 12'));
  comprobar('El adelanto se puede cambiar', avisosDelDia(estado, LUNES, { minutosAntes: 30 })[0].a === '07:30');
  comprobar('CLAVE · Describe, no notifica: no hay nada que "enviar"',
    avisos.every((a) => a.tipo === 'bloque_proximo' && !('enviado' in a)));

  const ctx = contextoIA(estado, { fecha: LUNES, dias: 3 });
  comprobar('El contexto de IA trae tres días', ctx.length === 3);
  comprobar('...estructurado, no una lista de textos', Array.isArray(ctx[0].bloques) && typeof ctx[0].bloques[0] === 'object');
  comprobar('...con horas y material', ctx[0].bloques[0].inicio === '08:00' && ctx[0].material.includes('Calculadora'));
  comprobar('...y sin campos vacíos que ensucien el contexto', ctx[0].bloques[0].prioridad === undefined);
  comprobar('Un cambio se marca para la IA',
    contextoIA({ ...estado, excepciones: [crearExcepcion({ fecha: LUNES, tipo: 'modificado', bloqueId: estado.bloques[0].id, cambios: { inicio: '10:00', fin: '11:00' } })] }, { fecha: LUNES, dias: 1 })[0].bloques.some((b) => b.cambiado === 'modificado'));
}

/* ===========================================================================
   CONFLICTOS Y HUECOS (capa 5)
   =========================================================================== */
console.log('\n═══ Conflictos y huecos ═══\n');
{
  const { estado, horario, col } = montarInstituto();

  comprobar('Dos bloques que se tocan NO se solapan',
    seSolapan({ inicio: '08:00', fin: '09:00' }, { inicio: '09:00', fin: '10:00' }) === false);
  comprobar('Dos que comparten un minuto sí',
    seSolapan({ inicio: '08:00', fin: '09:30' }, { inicio: '09:00', fin: '10:00' }) === true);
  comprobar('Sin horas no se puede decidir, y no se inventa',
    seSolapan({ inicio: '', fin: '' }, { inicio: '09:00', fin: '10:00' }) === false);

  comprobar('Un lunes normal no tiene conflictos', conflictosDelDia(estado, LUNES).length === 0);

  const choque = {
    ...estado,
    bloques: [...estado.bloques, crearBloque({ horarioId: horario.id, columnaId: col(1).id, titulo: 'Tutoría', inicio: '08:30', fin: '09:30' })],
  };
  comprobar('CLAVE · Un choque se detecta', conflictosDelDia(choque, LUNES).length === 2, String(conflictosDelDia(choque, LUNES).length));
  comprobar('...y cada par sale UNA vez, no dos',
    conflictosDelDia({ ...estado, bloques: [estado.bloques[0], crearBloque({ horarioId: horario.id, columnaId: col(1).id, titulo: 'X', inicio: '08:30', fin: '09:30' })] }, LUNES).length === 1);

  const huecos = huecosDelDia(estado, LUNES);
  comprobar('El hueco de después de clase se ve', huecos.some((h) => h.inicio === '10:00' && h.fin === '22:00'));
  comprobar('...y el de antes de empezar no existe', !huecos.some((h) => h.inicio === '08:00' && h.fin === '08:00'));
  comprobar('Un hueco menor que el mínimo no se ofrece',
    huecosDelDia(estado, MIERCOLES, { minimo: 300 }).every((h) => h.minutos >= 300));
  comprobar('Un día entero libre es un solo hueco',
    huecosDelDia(estado, SABADO).length === 1 && huecosDelDia(estado, SABADO)[0].minutos === 840);
}

/* ===========================================================================
   INTEGRIDAD Y BORRADO (apartados 25 y 29)
   =========================================================================== */
console.log('\n═══ Nada queda huérfano ═══\n');
{
  const { estado, horario, mates, col } = montarInstituto();
  const conExc = { ...estado, excepciones: [crearExcepcion({ fecha: LUNES, tipo: 'cancelado', bloqueId: estado.bloques[0].id })] };

  const sinHorario = eliminarHorario(conExc, horario.id);
  comprobar('Borrar un horario se lleva sus bloques', sinHorario.bloques.length === 0);
  comprobar('...y sus excepciones', sinHorario.excepciones.length === 0);
  comprobar('...pero NO sus actividades', sinHorario.actividades.length === 3);

  // Borrar una actividad NO borra sus bloques: los deja sin actividad.
  const sinMates = eliminarActividad(estado, mates.id);
  comprobar('CLAVE · Borrar una actividad NO borra sus bloques', sinMates.bloques.length === 6);
  comprobar('CLAVE · ...los deja sin actividad, para no perder la hora',
    sinMates.bloques.filter((b) => b.actividadId === null).length === 3);
  comprobar('...y la actividad sí se va', sinMates.actividades.length === 2);
  comprobar('...y el día sigue resolviendo, con "Sin nombre"',
    resolverDia(sinMates, LUNES).length === 2 && resolverDia(sinMates, LUNES)[0].titulo === 'Sin nombre');

  const sinLunes = eliminarColumna(estado, horario.id, col(1).id);
  comprobar('Borrar una columna se lleva sus bloques', sinLunes.bloques.length === 4);
  comprobar('...y el lunes deja de resolver', resolverDia(sinLunes, LUNES).length === 0);

  // La revisión informa, no toca.
  comprobar('Un estado sano pasa la revisión', revisarHorario(estado).ok === true);
  comprobar('Un bloque sin horario se detecta',
    revisarHorario({ ...estado, bloques: [...estado.bloques, { ...estado.bloques[0], id: 'z', horarioId: 'fantasma' }] })
      .problemas.some((p) => p.tipo === 'bloque_sin_horario'));
  comprobar('Un bloque sin actividad válida se detecta',
    revisarHorario({ ...estado, bloques: [{ ...estado.bloques[0], actividadId: 'fantasma' }] })
      .problemas.some((p) => p.tipo === 'bloque_sin_actividad'));
  comprobar('Un bloque sin horas se detecta',
    revisarHorario({ ...estado, bloques: [{ ...estado.bloques[0], inicio: '', fin: '' }] })
      .problemas.some((p) => p.tipo === 'bloque_sin_horas'));
  comprobar('Una excepción sin su bloque se detecta',
    revisarHorario({ ...estado, excepciones: [crearExcepcion({ tipo: 'cancelado', bloqueId: 'fantasma' })] })
      .problemas.some((p) => p.tipo === 'excepcion_sin_bloque'));
  comprobar('CLAVE · Una asignatura borrada de Estudios se detecta',
    revisarHorario({ ...estado, actividades: [{ ...estado.actividades[0], asignaturaId: 'a9' }] }, { asignaturas: [] })
      .problemas.some((p) => p.tipo === 'actividad_sin_asignatura'));
  comprobar('...pero NO rompe el horario', resolverDia({ ...estado, actividades: [{ ...estado.actividades[0], asignaturaId: 'a9' }] }, LUNES).length === 2);
}

/* ===========================================================================
   RESUMEN, PARA EL HUB
   =========================================================================== */
console.log('\n═══ Resumen ═══\n');
{
  const { estado } = montarInstituto();
  const r = resumenHorario(estado, { fecha: LUNES });
  comprobar('El resumen cuenta horarios, actividades y bloques', r.horarios === 1 && r.actividades === 3 && r.bloques === 6);
  comprobar('...y lo de hoy', r.hoy === 2 && r.minutosHoy === 120);
  comprobar('Sin nada, el resumen son ceros y no NaN',
    Object.values(resumenHorario(DEFAULT_HORARIO_TOP, { fecha: LUNES })).every((v) => typeof v === 'boolean' || Number.isFinite(v)));
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
