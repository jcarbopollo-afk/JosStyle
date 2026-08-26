// ============================================================================
// HT · Fase 3/12 — Pruebas del editor visual
//
// El apartado 76 enumera veinticuatro criterios de aceptación. Aquí están todos
// los que se pueden comprobar sin navegador; los cuatro que no —móvil, dark
// mode, rapidez percibida— se dicen al final en vez de darse por buenos.
//
// Lo que más se comprueba es el apartado 52: **cambiar una clase "solo este
// lunes" no puede cambiar todos los lunes del curso.** Es el error más fácil de
// cometer y el más caro.
// ============================================================================

import {
  PLANTILLAS_HORARIO, plantilla, crearDesdePlantilla,
  contarEnColumna, anadirColumna, editarColumna, alternarColumna, moverColumna, columnasDe,
  contarEnFila, anadirFila, sumarMinutos, editarFila, eliminarFila, filasDe,
  conflictosCon, describirConflicto,
  crearBloqueRapido, buscarActividad, sugerencias, colorAutomatico, PALETA_ACTIVIDADES,
  ALCANCES, editarBloque, moverBloque, duplicarBloque, eliminarBloque,
  duplicarDia, vaciarDia,
  VISTAS_HORARIO, rejillaSemana, vistaDia, vistaAgenda,
  previsualizarImportacion, aplicarImportacion, resumenEditor,
} from '../src/lib/horarioEditor.js';
import { DEFAULT_HORARIO_TOP, resolverDia, normalizarHorarioTop } from '../src/lib/horario.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const LUNES = '2026-08-24';
const MARTES = '2026-08-25';
const LUNES_SIG = '2026-08-31';
const HOY = LUNES;

/** Un horario de colegio recién creado, con la cuadrícula de la plantilla. */
function nuevo() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (dia) => horario.columnas.find((c) => c.dia === dia);
  const fila = (i) => horario.filas[i];
  return { estado, horario, col, fila };
}

/** Y uno ya con Matemáticas el lunes a primera hora. */
function conMates() {
  const { estado, horario, col, fila } = nuevo();
  const r = crearBloqueRapido(estado, {
    horarioId: horario.id, columnaId: col(1).id, filaId: fila(0).id, texto: 'Matemáticas', hoy: HOY,
  });
  return { estado: r.estado, horario, col, fila, bloque: r.bloque, actividad: r.actividad };
}

/* ===========================================================================
   PLANTILLAS Y CREACIÓN (apartados 2, 3 y 4)
   =========================================================================== */
console.log('\n═══ HT Fase 3 — plantillas y creación ═══\n');
{
  comprobar('Las cuatro plantillas del apartado 3', PLANTILLAS_HORARIO.length === 4);
  comprobar('Una plantilla inventada cae en la de colegio', plantilla('zzz').id === 'colegio');

  const { horario } = nuevo();
  comprobar('CRITERIO · Se puede crear un horario', !!horario.id);
  comprobar('...con sus cinco días', horario.columnas.length === 5);
  comprobar('...de lunes a viernes', columnasDe(horario).map((c) => c.dia).join(',') === '1,2,3,4,5');
  comprobar('...y sus seis franjas', horario.filas.length === 6);
  comprobar('...de 08:00 a 14:00', filasDe(horario)[0].inicio === '08:00' && filasDe(horario)[5].fin === '14:00');

  const { horario: completa } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { plantillaId: 'semana' });
  comprobar('La semana completa trae los siete días', completa.columnas.length === 7);
  const { horario: vacio } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { plantillaId: 'vacio' });
  comprobar('CLAVE · "Desde cero" no trae NADA, ni columnas ni filas',
    vacio.columnas.length === 0 && vacio.filas.length === 0);
  const { horario: tarde } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { plantillaId: 'tarde' });
  comprobar('La de tardes empieza a las 16:00', filasDe(tarde)[0].inicio === '16:00');
}

/* ===========================================================================
   COLUMNAS (apartados 8, 9, 10 y 40)
   =========================================================================== */
console.log('\n═══ Columnas ═══\n');
{
  const { estado, horario, col } = conMates();

  const conSabado = anadirColumna(estado, horario.id, { dia: 6 });
  comprobar('CRITERIO · Se puede añadir una columna', conSabado.horarios[0].columnas.length === 6);
  comprobar('...con su nombre y su abreviatura',
    columnasDe(conSabado.horarios[0])[5].nombre === 'Sábado' && columnasDe(conSabado.horarios[0])[5].corto === 'S');
  comprobar('...y al final', columnasDe(conSabado.horarios[0])[5].dia === 6);
  comprobar('Una columna que no es un día también vale',
    anadirColumna(estado, horario.id, { nombre: 'Semana A' }).horarios[0].columnas[5].dia === null);

  // Apartado 40 — confirmación solo si hay algo que perder.
  comprobar('CLAVE · Se sabe cuánto se pierde ANTES de borrar', contarEnColumna(estado, col(1).id) === 1);
  comprobar('...y una columna vacía se puede borrar sin preguntar', contarEnColumna(estado, col(3).id) === 0);

  const renombrada = editarColumna(estado, horario.id, col(1).id, { nombre: 'Lunes A', color: '#5C7E9A' });
  comprobar('CRITERIO · Se puede editar una columna', columnasDe(renombrada.horarios[0])[0].nombre === 'Lunes A');
  comprobar('...sin cambiarle el id', columnasDe(renombrada.horarios[0])[0].id === col(1).id);

  const oculta = alternarColumna(estado, horario.id, col(1).id);
  comprobar('Ocultar una columna la quita de la cuadrícula', columnasDe(oculta.horarios[0], { soloVisibles: true }).length === 4);
  comprobar('CLAVE · ...pero NO borra sus bloques', oculta.bloques.length === 1);
  comprobar('...y se puede volver a mostrar',
    columnasDe(alternarColumna(oculta, horario.id, col(1).id).horarios[0], { soloVisibles: true }).length === 5);

  const movida = moverColumna(estado, horario.id, col(1).id, 'derecha');
  comprobar('CRITERIO · Se puede reordenar una columna',
    columnasDe(movida.horarios[0]).map((c) => c.dia).join(',') === '2,1,3,4,5');
  comprobar('CLAVE · Mover la primera a la izquierda no la saca de la lista',
    columnasDe(moverColumna(estado, horario.id, col(1).id, 'izquierda').horarios[0]).length === 5);
  comprobar('...ni la última a la derecha',
    columnasDe(moverColumna(estado, horario.id, col(5).id, 'derecha').horarios[0]).map((c) => c.dia).join(',') === '1,2,3,4,5');
}

/* ===========================================================================
   FILAS (apartados 11, 12, 13 y 14)
   =========================================================================== */
console.log('\n═══ Franjas horarias ═══\n');
{
  const { estado, horario, fila } = conMates();

  const conMas = anadirFila(estado, horario.id);
  comprobar('CRITERIO · Se puede añadir una franja', filasDe(conMas.horarios[0]).length === 7);
  comprobar('CLAVE · ...y continúa a la última sola', filasDe(conMas.horarios[0])[6].inicio === '14:00');
  comprobar('...con la misma duración', filasDe(conMas.horarios[0])[6].fin === '15:00');
  comprobar('Se puede dar una hora concreta',
    filasDe(anadirFila(estado, horario.id, { inicio: '16:00', fin: '17:30' }).horarios[0])[6].fin === '17:30');

  // Apartado 14 — franjas irregulares.
  const irregular = editarFila(estado, horario.id, fila(0).id, { inicio: '08:00', fin: '08:50' });
  comprobar('CRITERIO · Se puede cambiar la hora de una franja', filasDe(irregular.horarios[0])[0].fin === '08:50');
  comprobar('CLAVE · ...y pueden durar cosas distintas',
    filasDe(irregular.horarios[0])[0].fin !== filasDe(irregular.horarios[0])[1].fin);
  comprobar('CLAVE · Una franja que acaba antes de empezar NO se guarda',
    filasDe(editarFila(estado, horario.id, fila(0).id, { inicio: '10:00', fin: '09:00' }).horarios[0])[0].inicio === '08:00');
  comprobar('Una hora ilegible tampoco',
    filasDe(editarFila(estado, horario.id, fila(0).id, { inicio: '99:99' }).horarios[0])[0].inicio === '08:00');

  comprobar('CLAVE · Se sabe cuántos bloques toca una franja antes de borrarla',
    contarEnFila(estado, horario.id, fila(0)) === 1);
  const sinFila = eliminarFila(estado, horario.id, fila(0).id);
  comprobar('CRITERIO · Se puede eliminar una franja', filasDe(sinFila.horarios[0]).length === 5);
  comprobar('CLAVE · ...y NO se lleva por delante el bloque que había', sinFila.bloques.length === 1);
  comprobar('...que sigue teniendo su hora', sinFila.bloques[0].inicio === '08:00');
  comprobar('Las posiciones se recolocan', filasDe(sinFila.horarios[0]).map((f) => f.posicion).join(',') === '0,1,2,3,4');

  comprobar('Sumar minutos funciona', sumarMinutos('08:30', 90) === '10:00');
  comprobar('...y no se pasa de medianoche', sumarMinutos('23:30', 120) === '23:59');
}

/* ===========================================================================
   CREACIÓN RÁPIDA Y AUTOCOMPLETADO (apartados 15, 16, 17 y 18)
   =========================================================================== */
console.log('\n═══ Crear escribiendo, y reutilizar ═══\n');
{
  const { estado, horario, col, fila } = nuevo();

  const r1 = crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(1).id, filaId: fila(0).id, texto: 'Matemáticas', hoy: HOY });
  comprobar('CRITERIO · Tocar celda + escribir crea el bloque', !r1.error && !!r1.bloque);
  comprobar('...y la actividad, si no existía', r1.actividad.nombre === 'Matemáticas');
  comprobar('...con la hora de la franja', r1.bloque.inicio === '08:00' && r1.bloque.fin === '09:00');
  comprobar('CLAVE · ...y un color automático, sin preguntar nada',
    PALETA_ACTIVIDADES.includes(r1.actividad.color));

  // CLAVE — la misma asignatura otro día REUTILIZA, no duplica.
  const r2 = crearBloqueRapido(r1.estado, { horarioId: horario.id, columnaId: col(4).id, filaId: fila(0).id, texto: 'Matemáticas', hoy: HOY });
  comprobar('CLAVE · Escribir "Matemáticas" otro día REUTILIZA la actividad',
    r2.actividad.id === r1.actividad.id);
  comprobar('CLAVE · ...así que solo hay UNA Matemáticas', r2.estado.actividades.length === 1);
  comprobar('...y el color es el mismo', r2.actividad.color === r1.actividad.color);
  comprobar('...pero son dos bloques', r2.estado.bloques.length === 2);

  // Colores distintos para asignaturas distintas.
  const r3 = crearBloqueRapido(r2.estado, { horarioId: horario.id, columnaId: col(2).id, filaId: fila(0).id, texto: 'Biología', hoy: HOY });
  comprobar('Una asignatura nueva coge otro color', r3.actividad.color !== r1.actividad.color);

  comprobar('Sin texto no se crea nada', crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(1).id, filaId: fila(0).id, texto: '  ' }).error !== null);
  comprobar('Sin franja ni horas tampoco',
    crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(1).id, texto: 'X' }).error !== null);

  // Autocompletado, incluidas las asignaturas de Estudios.
  const asignaturas = [{ id: 'a1', nombre: 'Física' }];
  const sug = sugerencias(r3.estado, 'Ma', { asignaturas });
  comprobar('CRITERIO · Escribir "Ma" sugiere Matemáticas', sug.some((s) => s.nombre === 'Matemáticas'));
  comprobar('CLAVE · ...y "Fí" sugiere la Física de ESTUDIOS, que no está en el horario',
    sugerencias(r3.estado, 'Fí', { asignaturas }).some((s) => s.nombre === 'Física' && s.origen === 'estudios'));
  comprobar('Sin texto no se sugiere nada', sugerencias(r3.estado, '', { asignaturas }).length === 0);
  comprobar('Una actividad se encuentra por su nombre exacto', buscarActividad(r3.estado, 'biología')?.id === r3.actividad.id);
  comprobar('El color automático no revienta sin actividades', PALETA_ACTIVIDADES.includes(colorAutomatico(DEFAULT_HORARIO_TOP)));
}

/* ===========================================================================
   CONFLICTOS (apartados 28 y 29)
   =========================================================================== */
console.log('\n═══ Conflictos ═══\n');
{
  const { estado, horario, col, fila } = conMates();

  const choque = crearBloqueRapido(estado, {
    horarioId: horario.id, columnaId: col(1).id, inicio: '08:30', fin: '09:30', texto: 'Física', hoy: HOY,
  });
  comprobar('CRITERIO · Un solapamiento se detecta y NO se guarda', choque.error !== null && choque.estado.bloques.length === 1);
  comprobar('...diciendo con qué choca', choque.conflictos.length === 1);
  comprobar('...y con su nombre para poder avisar',
    describirConflicto(estado, choque.conflictos)[0].titulo === 'Matemáticas');

  const forzado = crearBloqueRapido(estado, {
    horarioId: horario.id, columnaId: col(1).id, inicio: '08:30', fin: '09:30', texto: 'Física', forzar: true, hoy: HOY,
  });
  comprobar('CLAVE · Se puede forzar, pero hay que PEDIRLO', forzado.error === null && forzado.estado.bloques.length === 2);

  comprobar('Dos bloques que se tocan no chocan',
    crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(1).id, inicio: '09:00', fin: '10:00', texto: 'Física', hoy: HOY }).error === null);
  comprobar('Otro día tampoco',
    crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(2).id, filaId: fila(0).id, texto: 'Física', hoy: HOY }).error === null);

  const rej = rejillaSemana(forzado.estado, horario.id);
  comprobar('CLAVE · La cuadrícula marca la celda en conflicto', rej.celdas[0].celdas[0].conflicto === true);
  comprobar('...y las demás no', rej.celdas[0].celdas[1].conflicto === false);
  comprobar('El resumen los cuenta', resumenEditor(forzado.estado, horario.id).conflictos === 2);
}

/* ===========================================================================
   EL APARTADO 52 — SOLO ESTE DÍA vs TODOS LOS DÍAS
   =========================================================================== */
console.log('\n═══ "Solo este lunes" no puede cambiar todos los lunes ═══\n');
{
  const { estado, bloque } = conMates();
  comprobar('De partida, Matemáticas es a las 08:00', resolverDia(estado, LUNES)[0].inicio === '08:00');

  // CLAVE — solo este día.
  const soloHoy = editarBloque(estado, bloque.id, { inicio: '09:00', fin: '10:00' }, {
    alcance: ALCANCES.SOLO_ESTE_DIA, fecha: LUNES, motivo: 'Cambio de aula',
  });
  comprobar('CLAVE · "Solo este día" cambia ESE lunes', resolverDia(soloHoy.estado, LUNES)[0].inicio === '09:00');
  comprobar('CLAVE · ...y NO toca el lunes siguiente', resolverDia(soloHoy.estado, LUNES_SIG)[0].inicio === '08:00');
  comprobar('CLAVE · ...porque no ha tocado el bloque, ha creado una excepción',
    soloHoy.estado.bloques[0].inicio === '08:00' && soloHoy.estado.excepciones.length === 1);
  comprobar('...con su motivo', soloHoy.estado.excepciones[0].motivo === 'Cambio de aula');
  comprobar('Cambiar dos veces el mismo día no crea dos excepciones',
    editarBloque(soloHoy.estado, bloque.id, { inicio: '10:00', fin: '11:00' }, { alcance: ALCANCES.SOLO_ESTE_DIA, fecha: LUNES })
      .estado.excepciones.length === 1);

  // Todos los días.
  const todos = editarBloque(estado, bloque.id, { inicio: '09:00', fin: '10:00' }, { alcance: ALCANCES.TODOS });
  comprobar('"Todos" sí cambia el bloque', todos.estado.bloques[0].inicio === '09:00');
  comprobar('...y por tanto todos los lunes', resolverDia(todos.estado, LUNES_SIG)[0].inicio === '09:00');
  comprobar('...sin crear ninguna excepción', todos.estado.excepciones.length === 0);

  // CLAVE — sin alcance no se escribe. Un defecto silencioso sería el error caro.
  const sinDecir = editarBloque(estado, bloque.id, { inicio: '09:00' }, {});
  comprobar('CLAVE · Sin decir el alcance NO se escribe nada', sinDecir.error !== null);
  comprobar('...y el estado no se toca', sinDecir.estado.bloques[0].inicio === '08:00');
  comprobar('"Solo este día" sin fecha tampoco',
    editarBloque(estado, bloque.id, { inicio: '09:00' }, { alcance: ALCANCES.SOLO_ESTE_DIA }).error !== null);
  comprobar('Un bloque que no existe no revienta', editarBloque(estado, 'zzz', {}, { alcance: ALCANCES.TODOS }).error !== null);
  comprobar('Unas horas imposibles se rechazan',
    editarBloque(estado, bloque.id, { inicio: '10:00', fin: '09:00' }, { alcance: ALCANCES.TODOS }).error !== null);
}

/* ===========================================================================
   MOVER, DUPLICAR Y BORRAR (apartados 20, 21, 22, 25 y 26)
   =========================================================================== */
console.log('\n═══ Mover, duplicar y borrar ═══\n');
{
  const { estado, horario, col, bloque } = conMates();

  const movido = moverBloque(estado, bloque.id, { columnaId: col(2).id });
  comprobar('CRITERIO · Se puede mover un bloque de día', movido.estado.bloques[0].columnaId === col(2).id);
  comprobar('...y ya no está el lunes', resolverDia(movido.estado, LUNES).length === 0);
  comprobar('...sino el martes', resolverDia(movido.estado, MARTES).length === 1);

  const movidoHora = moverBloque(estado, bloque.id, { inicio: '11:00' });
  comprobar('CLAVE · Mover a otra hora CONSERVA la duración',
    movidoHora.estado.bloques[0].inicio === '11:00' && movidoHora.estado.bloques[0].fin === '12:00');

  const conFisica = crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(2).id, inicio: '08:00', fin: '09:00', texto: 'Física', hoy: HOY }).estado;
  comprobar('Mover encima de otro se rechaza', moverBloque(conFisica, bloque.id, { columnaId: col(2).id }).error !== null);
  comprobar('...pero se puede forzar', moverBloque(conFisica, bloque.id, { columnaId: col(2).id, forzar: true }).error === null);

  const dup = duplicarBloque(estado, bloque.id, { columnaId: col(4).id });
  comprobar('CRITERIO · Se puede duplicar un bloque en otro día', dup.estado.bloques.length === 2);
  comprobar('CLAVE · ...reutilizando la MISMA actividad, no una copia',
    dup.bloque.actividadId === estado.bloques[0].actividadId);
  comprobar('...y sigue habiendo una sola actividad', dup.estado.actividades.length === 1);
  comprobar('Duplicar encima de otro se rechaza', duplicarBloque(conFisica, bloque.id, { columnaId: col(2).id }).error !== null);
  comprobar('Duplicar a otra hora conserva la duración',
    duplicarBloque(estado, bloque.id, { inicio: '12:00' }).bloque.fin === '13:00');

  const borrado = eliminarBloque(estado, bloque.id);
  comprobar('CRITERIO · Se puede eliminar un bloque', borrado.bloques.length === 0);
  comprobar('CLAVE · ...y se lleva sus excepciones, que sin él no significan nada',
    eliminarBloque(
      editarBloque(estado, bloque.id, { inicio: '09:00' }, { alcance: ALCANCES.SOLO_ESTE_DIA, fecha: LUNES }).estado,
      bloque.id,
    ).excepciones.length === 0);
  comprobar('...pero NO la actividad', borrado.actividades.length === 1);
}

/* ===========================================================================
   DUPLICAR Y VACIAR DÍA (apartados 23 y 24)
   =========================================================================== */
console.log('\n═══ Duplicar y vaciar un día entero ═══\n');
{
  let { estado, horario, col, fila } = conMates();
  estado = crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(1).id, filaId: fila(1).id, texto: 'Biología', hoy: HOY }).estado;
  estado = crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(1).id, filaId: fila(2).id, texto: 'Inglés', hoy: HOY }).estado;

  const dup = duplicarDia(estado, horario.id, col(1).id, col(2).id, { hoy: HOY });
  comprobar('CLAVE · Duplicar el lunes en el martes copia los tres bloques', dup.copiados === 3);
  comprobar('...y el martes queda igual que el lunes', resolverDia(dup.estado, MARTES).length === 3);
  comprobar('CLAVE · ...reutilizando las mismas actividades', dup.estado.actividades.length === 3);
  comprobar('...y el lunes sigue intacto', resolverDia(dup.estado, LUNES).length === 3);

  comprobar('CLAVE · Duplicar sobre un día que YA tiene cosas se rechaza',
    duplicarDia(dup.estado, horario.id, col(1).id, col(2).id).error !== null);
  comprobar('...diciendo cuántas hay', duplicarDia(dup.estado, horario.id, col(1).id, col(2).id).existentes === 3);
  comprobar('CLAVE · Forzar SUSTITUYE, no acumula',
    duplicarDia(dup.estado, horario.id, col(1).id, col(2).id, { forzar: true }).estado.bloques.length === 6);
  comprobar('Duplicar un día vacío no hace nada', duplicarDia(estado, horario.id, col(3).id, col(4).id).copiados === 0);

  const vaciado = vaciarDia(dup.estado, horario.id, col(1).id);
  comprobar('CRITERIO · Se puede vaciar un día', vaciado.borrados === 3);
  comprobar('...diciendo cuántos se van, para poder avisar antes', vaciado.borrados === 3);
  comprobar('...y el martes no se toca', resolverDia(vaciado.estado, MARTES).length === 3);
  comprobar('Vaciar un día vacío no borra nada', vaciarDia(estado, horario.id, col(5).id).borrados === 0);
}

/* ===========================================================================
   LAS TRES VISTAS (apartados 46, 47, 48 y 49)
   =========================================================================== */
console.log('\n═══ Semana, día y agenda: una sola fuente ═══\n');
{
  let { estado, horario, col, fila } = conMates();
  estado = crearBloqueRapido(estado, { horarioId: horario.id, columnaId: col(2).id, filaId: fila(1).id, texto: 'Biología', hoy: HOY }).estado;

  comprobar('Las tres vistas del apartado 49', VISTAS_HORARIO.length === 3);

  const rej = rejillaSemana(estado, horario.id);
  comprobar('CRITERIO · Existe el modo semana', rej.columnas.length === 5 && rej.filas.length === 6);
  comprobar('...con Matemáticas en el lunes a primera hora', rej.celdas[0].celdas[0].bloques[0].titulo === 'Matemáticas');
  comprobar('...con su color ya resuelto', !!rej.celdas[0].celdas[0].bloques[0].color);
  comprobar('...y las celdas vacías, vacías', rej.celdas[0].celdas[2].bloques.length === 0);
  comprobar('Un horario que no existe no revienta', rejillaSemana(estado, 'zzz').columnas.length === 0);

  // Apartado 14 — con franjas irregulares el bloque no desaparece.
  const irregular = editarFila(estado, horario.id, fila(0).id, { inicio: '08:00', fin: '08:50' });
  const rejIrr = rejillaSemana(irregular, horario.id);
  comprobar('CLAVE · Con franjas irregulares el bloque sigue apareciendo',
    rejIrr.celdas[0].celdas[0].bloques.length === 1);

  const dia = vistaDia(estado, LUNES);
  comprobar('CRITERIO · Existe el modo día', dia.eventos.length === 1 && dia.nombreDia === 'Lunes');
  const agenda = vistaAgenda(estado, { desde: LUNES, dias: 7 });
  comprobar('CRITERIO · Existe la vista agenda', agenda.length === 7);
  comprobar('...con el lunes y el martes con clase', agenda[0].eventos.length === 1 && agenda[1].eventos.length === 1);
  comprobar('CLAVE · ...y los días vacíos incluidos: un hueco es información', agenda[5].eventos.length === 0);
  comprobar('CLAVE · Las tres vistas salen de la MISMA fuente',
    rej.celdas[0].celdas[0].bloques[0].id === dia.eventos[0].bloqueId
    && dia.eventos[0].bloqueId === agenda[0].eventos[0].bloqueId);
}

/* ===========================================================================
   IMPORTACIÓN: PREVISUALIZAR SIEMPRE (apartados 68, 69 y 70)
   =========================================================================== */
console.log('\n═══ Importar exige revisar antes ═══\n');
{
  const { estado, horario } = nuevo();
  const filas = [
    { dia: 1, inicio: '08:00', fin: '09:00', nombre: 'Matemáticas' },
    { dia: 2, inicio: '09:00', fin: '10:00', nombre: 'Inglés' },
    { dia: 9, inicio: '08:00', fin: '09:00', nombre: 'Fantasma' },   // día imposible
    { dia: 3, inicio: '10:00', fin: '09:00', nombre: 'Al revés' },   // horas al revés
    { dia: 4, inicio: '11:00', fin: '12:00', nombre: '' },           // sin nombre
  ];

  const prev = previsualizarImportacion(estado, horario.id, filas);
  comprobar('CLAVE · Previsualizar NO escribe nada', estado.bloques.length === 0);
  comprobar('Se ven las cinco propuestas', prev.propuestas.length === 5);
  comprobar('...y solo dos son válidas', prev.validas === 2);
  comprobar('Un día que no existe se marca', prev.propuestas[2].problemas.length > 0);
  comprobar('Unas horas al revés también', prev.propuestas[3].problemas.length > 0);
  comprobar('Y un nombre vacío', prev.propuestas[4].problemas.length > 0);

  const aplicada = aplicarImportacion(estado, horario.id, prev);
  comprobar('CLAVE · Aplicar solo mete lo válido', aplicada.creados === 2);
  comprobar('...y crea sus actividades', aplicada.estado.actividades.length === 2);
  comprobar('CLAVE · Aplicar sin previsualización no mete nada',
    aplicarImportacion(estado, horario.id, null).creados === 0);

  // Importar no puede crear una segunda "Matemáticas".
  const conMates2 = crearBloqueRapido(estado, { horarioId: horario.id, columnaId: horario.columnas[4].id, inicio: '08:00', fin: '09:00', texto: 'Matemáticas', hoy: HOY }).estado;
  const prev2 = previsualizarImportacion(conMates2, horario.id, [filas[0]]);
  comprobar('CLAVE · La previsualización avisa de que la actividad ya existe', prev2.propuestas[0].actividadExistente !== null);
  comprobar('...y al aplicar NO se duplica', aplicarImportacion(conMates2, horario.id, prev2).estado.actividades.length === 1);
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n═══ Resumen del editor ═══\n');
{
  const { estado, horario } = conMates();
  const r = resumenEditor(estado, horario.id);
  comprobar('El resumen cuenta columnas, filas y bloques', r.columnas === 5 && r.filas === 6 && r.bloques === 1);
  comprobar('...y las actividades usadas', r.actividades === 1);
  comprobar('...sin conflictos', r.conflictos === 0);
  comprobar('Un horario que no existe devuelve null', resumenEditor(estado, 'zzz') === null);
  comprobar('Un estado vacío no revienta', normalizarHorarioTop(null).bloques.length === 0);
}

console.log('\n  ⚠️ Sin comprobar aquí, y hay que decirlo: el aspecto en un iPhone, los gestos,');
console.log('     el arrastre real y el modo oscuro. Son del navegador (mismo límite que R1).\n');

console.log(fallos === 0 ? '  Todo correcto.\n' : `  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
