// ============================================================================
// HT · Fase 4/12 — Pruebas de la configuración avanzada
//
// El apartado 64 enumera veintisiete criterios de aceptación. Aquí están los
// veinticinco comprobables sin navegador, marcados «CRITERIO»; los dos que no
// —zoom real y móvil— se dicen al final.
//
// Lo que más se comprueba es el apartado 30: **cambiar la estructura no puede
// mover datos en silencio.**
// ============================================================================

import {
  DEFAULT_CICLO, normalizarCiclo, hayCiclo, semanaDelCiclo, columnasDeLaFecha, gruposDe,
  cicloDe, guardarCiclo,
  impactoEliminarColumna, impactoCambiarFila, validarEstructura,
  INTERVALOS, generarFranjas, impactoRegenerarFranjas, regenerarFranjas,
  duplicarHorario, archivarHorario, horariosActivos, horariosArchivados,
  guardarComoPlantilla, crearDesdePlantillaPropia,
  DEFAULT_VISUAL, DENSIDADES, densidad, normalizarVisual, anchoAjustado,
  filtrarBloques, buscarEnHorario,
  seleccionDeColumna, seleccionDeFila, seleccionDeActividad,
  eliminarSeleccion, colorearSeleccion, moverSeleccion,
  reordenarColumnas, reordenarFilas,
  bloquearColumna, columnaBloqueada, actualizarMetadatos, zonaHorariaActual,
  resumenEstructura,
} from '../src/lib/horarioEstructura.js';
import {
  DEFAULT_HORARIO_TOP, TIPOS_COLUMNA, TIPOS_FILA, tipoColumna, tipoFila,
  crearColumna, crearFila, resolverDia, normalizarHorarioObj,
} from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido, columnasDe, filasDe } from '../src/lib/horarioEditor.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const LUNES = '2026-08-24';
const LUNES_SIG = '2026-08-31';
const LUNES_2SIG = '2026-09-07';
const HOY = LUNES;

function montar() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (d) => horario.columnas.find((c) => c.dia === d);
  const fila = (i) => horario.filas[i];
  let e = estado;
  for (const [dia, f, nombre] of [[1, 0, 'Matemáticas'], [1, 1, 'Biología'], [2, 0, 'Inglés']]) {
    e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(dia).id, filaId: fila(f).id, texto: nombre, hoy: HOY }).estado;
  }
  return { estado: e, horario, col, fila };
}

/* ===========================================================================
   TIPOS DE COLUMNA Y FILA (apartados 5, 6, 12, 13 y 14)
   =========================================================================== */
console.log('\n═══ HT Fase 4 — la cuadrícula deja de ser un calendario ═══\n');
{
  comprobar('Los ocho tipos de columna del apartado 5', TIPOS_COLUMNA.length === 8);
  comprobar('Un tipo inventado cae en "personalizado"', tipoColumna('zzz').id === 'personalizado');
  comprobar('CRITERIO · Una columna puede ser una persona, un turno o un proyecto',
    ['persona', 'turno', 'proyecto'].every((t) => TIPOS_COLUMNA.some((x) => x.id === t)));

  // CLAVE — el tipo NO decide si resuelve a una fecha; `dia` sí.
  const conDia = normalizarHorarioObj({ columnas: [{ nombre: 'L', dia: 1, tipo: 'proyecto' }] });
  comprobar('CLAVE · Una columna con día es de tipo "dia" aunque diga otra cosa',
    conDia.columnas[0].tipo === 'dia');
  comprobar('...porque dos verdades sobre lo mismo acabarían discrepando', conDia.columnas[0].dia === 1);
  const notas = normalizarHorarioObj({ columnas: [{ nombre: 'Notas', tipo: 'nota' }] });
  comprobar('CRITERIO · Una columna "Notas" existe y no es un día',
    notas.columnas[0].tipo === 'nota' && notas.columnas[0].dia === null);

  comprobar('Los tres tipos de fila', TIPOS_FILA.length === 3);
  comprobar('Un tipo de fila inventado cae en "hora"', tipoFila('zzz').id === 'hora');
  // CLAVE — una fila sin hora no se rellena con un 08:00 inventado.
  const manana = crearFila({ tipo: 'etiqueta', etiqueta: 'Mañana' });
  comprobar('CLAVE · CRITERIO · Una fila SIN HORA se queda sin hora',
    manana.inicio === '' && manana.fin === '' && manana.etiqueta === 'Mañana');
  comprobar('CRITERIO · Y existe el separador', crearFila({ tipo: 'separador', etiqueta: 'Descanso' }).tipo === 'separador');
  comprobar('Una fila normal sí trae sus horas', crearFila({}).inicio === '08:00');
  comprobar('Sobrevive a guardar y cargar',
    normalizarHorarioObj({ filas: [manana] }).filas[0].tipo === 'etiqueta');
  comprobar('...sin inventarse horas al normalizar',
    normalizarHorarioObj({ filas: [manana] }).filas[0].inicio === '');
}

/* ===========================================================================
   CICLOS Y SEMANAS A/B (apartados 9, 10 y 11)
   =========================================================================== */
console.log('\n═══ Semanas A/B y ciclos ═══\n');
{
  comprobar('Sin ciclo, una semana', DEFAULT_CICLO.semanas === 1 && hayCiclo(null) === false);
  comprobar('CRITERIO · Un ciclo de dos semanas es A/B',
    normalizarCiclo({ semanas: 2 }).nombres.join('') === 'AB');
  comprobar('CRITERIO · ...y uno de cuatro llega hasta la D',
    normalizarCiclo({ semanas: 4 }).nombres.join('') === 'ABCD');
  comprobar('Se pueden poner nombres propios',
    normalizarCiclo({ semanas: 2, nombres: ['Turno 1', 'Turno 2'] }).nombres[1] === 'Turno 2');
  comprobar('CLAVE · Un ciclo absurdo se acota', normalizarCiclo({ semanas: 99 }).semanas === 8);
  comprobar('...y uno de cero también', normalizarCiclo({ semanas: 0 }).semanas === 1);

  const ciclo = normalizarCiclo({ semanas: 2, ancla: LUNES });
  comprobar('CLAVE · La semana del ancla es la A', semanaDelCiclo(ciclo, LUNES).nombre === 'A');
  comprobar('CLAVE · La siguiente es la B', semanaDelCiclo(ciclo, LUNES_SIG).nombre === 'B');
  comprobar('CLAVE · Y la de después vuelve a la A', semanaDelCiclo(ciclo, LUNES_2SIG).nombre === 'A');
  comprobar('CLAVE · Una fecha ANTERIOR al ancla no da un índice imposible',
    semanaDelCiclo(ciclo, '2026-08-17').indice === 1);
  comprobar('...ni una muy anterior', semanaDelCiclo(ciclo, '2026-01-05').indice >= 0);
  comprobar('Sin ciclo no hay semana que calcular', semanaDelCiclo({ semanas: 1 }, LUNES) === null);

  // El ciclo tiene que SOBREVIVIR al guardado: si el normalizador de `horario.js`
  // no lo conociera, se perdería en el siguiente `saveData` y las semanas
  // alternas dejarían de alternar al recargar (le pasó a `visible` en HT F2).
  const { estado: e0, horario: h0 } = montar();
  const conCiclo = guardarCiclo(e0, h0.id, { semanas: 2, ancla: LUNES });
  comprobar('CLAVE · El ciclo se guarda en el horario', cicloDe(conCiclo.horarios[0]).semanas === 2);
  comprobar('CLAVE · ...y sobrevive a un guardado', cicloDe(normalizarHorarioObj(conCiclo.horarios[0])).ancla === LUNES);
  comprobar('CLAVE · Un ciclo de una semana se borra: es "no hay ciclo"',
    guardarCiclo(conCiclo, h0.id, { semanas: 1 }).horarios[0].ciclo === null);
  comprobar('CLAVE · Sin ciclo pasado se usa el del horario',
    columnasDeLaFecha(conCiclo.horarios[0], LUNES).length >= 1);
  comprobar('CLAVE · Sin ancla no se adivina: se devuelve la primera y se dice',
    semanaDelCiclo({ semanas: 2 }, LUNES).sinAncla === true);

  // Columnas por grupo.
  const { horario } = montar();
  const conGrupos = normalizarHorarioObj({
    ...horario,
    columnas: [
      { ...horario.columnas[0], grupo: 'A' },
      { ...horario.columnas[1], grupo: 'B', dia: 1 },
      { ...horario.columnas[2] },   // sin grupo: vale para las dos
    ],
  });
  comprobar('Los grupos se detectan', gruposDe(conGrupos).join(',') === 'A,B');
  const enA = columnasDeLaFecha(conGrupos, LUNES, ciclo);
  comprobar('CLAVE · En la semana A sale la columna de A', enA.some((c) => c.grupo === 'A'));
  comprobar('CLAVE · ...y NO la de B', !enA.some((c) => c.grupo === 'B'));
  comprobar('CLAVE · Una columna SIN grupo vale para todas las semanas',
    columnasDeLaFecha(conGrupos, LUNES_SIG, ciclo).length >= 1);
  comprobar('Sin ciclo salen todas las del día', columnasDeLaFecha(conGrupos, LUNES, null).length === 2);
}

/* ===========================================================================
   EL PUNTO CRÍTICO: CAMBIAR LA ESTRUCTURA CON DATOS DENTRO (apartados 30-32, 45)
   =========================================================================== */
console.log('\n═══ Cambiar la estructura no puede mover datos en silencio ═══\n');
{
  const { estado, horario, col, fila } = montar();

  const impCol = impactoEliminarColumna(estado, horario.id, col(1).id);
  comprobar('CLAVE · Antes de borrar una columna se sabe cuánto se pierde', impCol.bloques === 2);
  comprobar('...y que NO es seguro', impCol.seguro === false);
  comprobar('Una columna vacía sí lo es', impactoEliminarColumna(estado, horario.id, col(4).id).seguro === true);

  // Cambiar la hora de una franja.
  const imp = impactoCambiarFila(estado, horario.id, fila(0).id, { inicio: '08:30', fin: '09:30' });
  comprobar('CRITERIO · Se calcula el impacto de cambiar una franja', imp.ok === true);
  comprobar('...cuántos bloques había dentro', imp.afectados === 2);
  comprobar('CLAVE · ...y si alguno se queda sin ninguna franja debajo', Array.isArray(imp.huerfanos));
  comprobar('CLAVE · Nada de esto ESCRIBE: el estado no se toca', estado.bloques[0].inicio === '08:00');

  // El caso feo: mover la franja fuera de todo.
  const lejos = impactoCambiarFila(estado, horario.id, fila(0).id, { inicio: '20:00', fin: '21:00' });
  comprobar('CLAVE · Mover la franja lejos deja bloques huérfanos', lejos.huerfanos.length > 0);
  comprobar('...y se marca como NO seguro', lejos.seguro === false);
  comprobar('Unas horas imposibles se rechazan',
    impactoCambiarFila(estado, horario.id, fila(0).id, { inicio: '10:00', fin: '09:00' }).ok === false);

  // Apartado 34 — dos filas solapadas: se advierte.
  const solapada = impactoCambiarFila(estado, horario.id, fila(0).id, { inicio: '08:00', fin: '10:00' });
  comprobar('CRITERIO · Dos franjas solapadas se detectan', solapada.solapaCon.length === 1);

  // Validación estructural completa.
  const val = validarEstructura(estado, horario.id);
  comprobar('CRITERIO · Un horario sano pasa la validación', val.ok === true);
  const roto = { ...estado, bloques: [{ ...estado.bloques[0], columnaId: 'fantasma' }] };
  comprobar('Un bloque sin columna se detecta', validarEstructura(roto, horario.id).problemas.some((p) => p.tipo === 'bloque_sin_columna'));
  const sinDias = { ...estado, horarios: [{ ...horario, columnas: horario.columnas.map((c) => ({ ...c, dia: null })) }] };
  comprobar('CLAVE · Un horario sin días avisa, pero NO es un error',
    validarEstructura(sinDias, horario.id).problemas.some((p) => p.tipo === 'sin_columnas_de_dia' && p.aviso)
    && validarEstructura(sinDias, horario.id).ok === true);
}

/* ===========================================================================
   INTERVALOS (apartados 28 y 29)
   =========================================================================== */
console.log('\n═══ Generar franjas de golpe ═══\n');
{
  comprobar('Los seis intervalos ofrecidos', INTERVALOS.length === 6);
  const f60 = generarFranjas({ desde: '08:00', hasta: '14:00', intervalo: 60 });
  comprobar('CRITERIO · Seis franjas de una hora', f60.length === 6 && f60[0].fin === '09:00');
  const f50 = generarFranjas({ desde: '08:00', hasta: '14:00', intervalo: 50 });
  comprobar('CRITERIO · ...o de cincuenta minutos', f50[0].fin === '08:50');
  const conDescanso = generarFranjas({ desde: '08:00', hasta: '12:00', intervalo: 50, descanso: 10 });
  comprobar('CLAVE · Con descanso, la siguiente empieza más tarde', conDescanso[1].inicio === '09:00');
  comprobar('CLAVE · Un intervalo absurdo no genera 720 filas',
    generarFranjas({ desde: '00:00', hasta: '23:00', intervalo: 1 }).length <= 40);
  comprobar('Unas horas al revés no generan nada', generarFranjas({ desde: '14:00', hasta: '08:00' }).length === 0);

  const { estado, horario } = montar();
  const nuevas = generarFranjas({ desde: '09:00', hasta: '13:00', intervalo: 60 });
  const imp = impactoRegenerarFranjas(estado, horario.id, nuevas);
  comprobar('Se sabe cuántos bloques quedarían huérfanos antes de regenerar', imp.huerfanos >= 1);
  const regenerado = regenerarFranjas(estado, horario.id, nuevas);
  comprobar('CRITERIO · Regenerar cambia la rejilla', filasDe(regenerado.horarios[0]).length === 4);
  comprobar('CLAVE · ...y NO toca las horas de los bloques', regenerado.bloques[0].inicio === '08:00');
  comprobar('CLAVE · ...que es lo que impide mover datos en silencio', regenerado.bloques.length === 3);
}

/* ===========================================================================
   DUPLICAR, ARCHIVAR Y PLANTILLAS (apartados 25, 26, 55, 56 y 57)
   =========================================================================== */
console.log('\n═══ Cambio de curso ═══\n');
{
  const { estado, horario } = montar();

  const dup = duplicarHorario(estado, horario.id, { nombre: 'Instituto 27/28', desde: '2027-09-01', hasta: '2028-06-30', hoy: HOY });
  comprobar('CRITERIO · Se puede duplicar un horario entero', dup.estado.horarios.length === 2);
  comprobar('...con su estructura', dup.horario.columnas.length === 5 && dup.horario.filas.length === 6);
  comprobar('...y sus bloques', dup.copiados === 3);
  comprobar('...con su periodo nuevo', dup.horario.desde === '2027-09-01');
  comprobar('CLAVE · Las ACTIVIDADES no se copian: se comparten', dup.estado.actividades.length === 3);
  comprobar('CLAVE · Los bloques de la copia apuntan a SUS columnas, no a las del original',
    dup.estado.bloques.filter((b) => b.horarioId === dup.horario.id)
      .every((b) => dup.horario.columnas.some((c) => c.id === b.columnaId)));
  comprobar('CLAVE · Y el original queda intacto',
    dup.estado.bloques.filter((b) => b.horarioId === horario.id).length === 3);
  comprobar('La copia no es la de por defecto', dup.horario.porDefecto === false);
  comprobar('Duplicar algo que no existe no revienta', duplicarHorario(estado, 'zzz').error !== null);

  // Las excepciones NO se copian.
  const conExc = { ...estado, excepciones: [{ id: 'x', fecha: LUNES, tipo: 'cancelado', bloqueId: estado.bloques[0].id, horarioId: horario.id, cambios: {}, motivo: '' }] };
  comprobar('CLAVE · Las excepciones del curso pasado NO se arrastran al nuevo',
    duplicarHorario(conExc, horario.id, { hoy: HOY }).estado.excepciones.length === 1);

  // Archivar.
  const arch = archivarHorario(dup.estado, horario.id);
  comprobar('CRITERIO · Se puede archivar un horario', horariosArchivados(arch).length === 1);
  comprobar('...y deja de estar activo', horariosActivos(arch).length === 1);
  comprobar('CLAVE · ...pero sus bloques siguen ahí', arch.bloques.length === 6);
  comprobar('CLAVE · ...y ya no resuelve ninguna fecha', resolverDia(arch, LUNES).filter((ev) => ev.horarioId === horario.id).length === 0);
  comprobar('CRITERIO · Y se puede recuperar', horariosActivos(archivarHorario(arch, horario.id, false)).length === 2);

  // Plantillas propias.
  const plantilla = guardarComoPlantilla(horario, { nombre: 'Mi horario escolar' });
  comprobar('CRITERIO · Se puede guardar la estructura como plantilla', plantilla.columnas.length === 5);
  comprobar('CLAVE · ...sin bloques: para eso está duplicar', !('bloques' in plantilla));
  comprobar('CLAVE · ...y sin ids, o dos horarios compartirían columna',
    plantilla.columnas.every((c) => c.id === undefined));
  const desdeMia = crearDesdePlantillaPropia(DEFAULT_HORARIO_TOP, plantilla, { nombre: 'Nuevo', hoy: HOY });
  comprobar('CRITERIO · Y reutilizarla', desdeMia.horario.columnas.length === 5);
  comprobar('...con ids nuevos', desdeMia.horario.columnas.every((c) => !!c.id));
}

/* ===========================================================================
   PREFERENCIAS VISUALES: LOCALES (apartados 19-23 y 59)
   =========================================================================== */
console.log('\n═══ El zoom del móvil no cambia el del ordenador ═══\n');
{
  comprobar('CRITERIO · Las tres densidades', DENSIDADES.length === 3);
  comprobar('...con alturas distintas', densidad('compacto').alto < densidad('comodo').alto);
  comprobar('Una densidad inventada cae en normal', densidad('zzz').id === 'normal');

  comprobar('CRITERIO · El zoom por defecto es 100', DEFAULT_VISUAL.zoom === 100);
  comprobar('CLAVE · Un zoom del 10 % se acota: no se leería', normalizarVisual({ zoom: 10 }).zoom === 60);
  comprobar('CLAVE · ...y uno del 500 % también', normalizarVisual({ zoom: 500 }).zoom === 140);
  comprobar('Un zoom que no es número cae en 100', normalizarVisual({ zoom: 'grande' }).zoom === 100);

  comprobar('CLAVE · Las preferencias visuales NO llevan datos del horario',
    !('bloques' in DEFAULT_VISUAL) && !('actividades' in DEFAULT_VISUAL));
  comprobar('Los filtros se sanean', normalizarVisual({ filtroActividades: ['a', 5, null] }).filtroActividades.length === 1);

  comprobar('CRITERIO · Ajustar a pantalla reparte el ancho', anchoAjustado(5, 350) === 70);
  comprobar('CLAVE · ...pero nunca por debajo de lo legible', anchoAjustado(10, 350) === 64);
  comprobar('Sin datos no revienta', anchoAjustado(0, 0) === 0);
}

/* ===========================================================================
   FILTROS, BÚSQUEDA Y SELECCIÓN (apartados 39-44)
   =========================================================================== */
console.log('\n═══ Filtros, búsqueda y operaciones masivas ═══\n');
{
  const { estado, horario, col, fila } = montar();
  const mates = estado.actividades.find((a) => a.nombre === 'Matemáticas');

  comprobar('CRITERIO · Se puede filtrar por actividad',
    filtrarBloques(estado, estado.bloques, { actividades: [mates.id] }).length === 1);
  comprobar('CRITERIO · ...y por horario', filtrarBloques(estado, estado.bloques, { horarios: [horario.id] }).length === 3);
  comprobar('Sin filtro salen todos', filtrarBloques(estado, estado.bloques, {}).length === 3);

  comprobar('CRITERIO · Buscar "Bio" encuentra su bloque', buscarEnHorario(estado, 'Bio').length === 1);
  comprobar('...sin distinguir mayúsculas', buscarEnHorario(estado, 'biolog').length === 1);
  comprobar('Sin texto no se busca nada', buscarEnHorario(estado, '').length === 0);
  const conAula = { ...estado, bloques: estado.bloques.map((b, i) => (i === 0 ? { ...b, ubicacion: 'Laboratorio 3' } : b)) };
  comprobar('CLAVE · Y busca también por aula', buscarEnHorario(conAula, 'laboratorio').length === 1);

  // Selección.
  comprobar('CRITERIO · Se puede seleccionar un día entero', seleccionDeColumna(estado, horario.id, col(1).id).length === 2);
  comprobar('CRITERIO · ...una franja entera', seleccionDeFila(estado, horario.id, fila(0)).length === 2);
  comprobar('CRITERIO · ...o todos los bloques de una asignatura', seleccionDeActividad(estado, horario.id, mates.id).length === 1);

  const ids = seleccionDeColumna(estado, horario.id, col(1).id);
  comprobar('CRITERIO · Se pueden eliminar varios de golpe', eliminarSeleccion(estado, ids).bloques.length === 1);
  const coloreados = colorearSeleccion(estado, ids, '#B07156');
  comprobar('CRITERIO · ...y cambiarles el color', coloreados.bloques.filter((b) => b.colorPropio === '#B07156').length === 2);
  comprobar('CLAVE · ...que es el color de los BLOQUES, no el de la asignatura',
    coloreados.actividades.find((a) => a.id === mates.id).color !== '#B07156');

  const movidos = moverSeleccion(estado, ids, col(4).id);
  comprobar('CRITERIO · Se pueden mover varios', movidos.error === null && movidos.movidos === 2);
  const choque = moverSeleccion(estado, ids, col(2).id);
  comprobar('CLAVE · ...y si chocan, se dice antes de escribir', choque.error !== null);
  comprobar('...pero se puede forzar', moverSeleccion(estado, ids, col(2).id, { forzar: true }).error === null);
}

/* ===========================================================================
   REORDENAR, BLOQUEAR Y METADATOS (apartados 8, 24, 37 y 53)
   =========================================================================== */
console.log('\n═══ Reordenar, bloquear y metadatos ═══\n');
{
  const { estado, horario, col } = montar();

  const orden = [col(5).id, col(4).id, col(3).id, col(2).id, col(1).id];
  const reord = reordenarColumnas(estado, horario.id, orden);
  comprobar('CRITERIO · Se pueden reordenar varias columnas de golpe',
    columnasDe(reord.horarios[0]).map((c) => c.dia).join(',') === '5,4,3,2,1');
  comprobar('CLAVE · Una columna que no venga en el orden NO desaparece',
    columnasDe(reordenarColumnas(estado, horario.id, [col(3).id]).horarios[0]).length === 5);
  comprobar('CRITERIO · Y las filas también',
    filasDe(reordenarFilas(estado, horario.id, [horario.filas[3].id]).horarios[0])[0].id === horario.filas[3].id);

  const bloqueada = bloquearColumna(estado, horario.id, col(1).id);
  comprobar('CRITERIO · Se puede bloquear una columna', columnaBloqueada(bloqueada, col(1).id) === true);
  comprobar('CLAVE · ...y una columna bloqueada SIGUE resolviendo: bloquear no es ocultar',
    resolverDia(bloqueada, LUNES).length === 2);
  comprobar('Se puede desbloquear', columnaBloqueada(bloquearColumna(bloqueada, horario.id, col(1).id, false), col(1).id) === false);
  comprobar('Una columna que no existe no está bloqueada', columnaBloqueada(estado, 'zzz') === false);

  const meta = actualizarMetadatos(estado, horario.id, { color: '#5C7E9A', descripcion: 'Curso 26/27', zonaHoraria: 'Europe/Madrid' });
  comprobar('CRITERIO · Los metadatos se guardan', meta.horarios[0].descripcion === 'Curso 26/27');
  comprobar('CLAVE · Un campo que no está permitido se ignora',
    actualizarMetadatos(estado, horario.id, { bloques: [] }).bloques.length === 3);
  comprobar('La zona horaria del dispositivo se puede leer', typeof zonaHorariaActual() === 'string');
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n═══ Resumen de la estructura ═══\n');
{
  const { estado, horario } = montar();
  const r = resumenEstructura(estado, horario.id);
  comprobar('El resumen cuenta columnas y filas', r.columnas === 5 && r.filas === 6);
  comprobar('...cuántas con hora y cuántas sin ella', r.conHora === 6 && r.sinHora === 0);
  comprobar('...y trae la validación', r.validacion.ok === true);
  comprobar('Un horario que no existe devuelve null', resumenEstructura(estado, 'zzz') === null);
}

console.log('\n  ⚠️ Sin comprobar aquí: el zoom y la densidad en pantalla, y el uso en un iPhone.');
console.log('     Son del navegador real (mismo límite que R1).\n');

console.log(fallos === 0 ? '  Todo correcto.\n' : `  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
