// ============================================================================
// HT · Fase 5/12 — Pruebas de la actividad como entidad
//
// El apartado 101 enumera treinta criterios de aceptación. Aquí están todos los
// comprobables sin navegador, marcados «CRITERIO».
//
// Lo que más se comprueba son las tres promesas que se pueden romper en
// silencio: que nada se guarda si se puede derivar, que NUNCA se fusionan dos
// actividades solas (apartado 57) y que **las notas privadas no viajan en el
// contexto de la IA** (apartados 52 y 73).
// ============================================================================

import {
  terminosDe, cortoDe, ICONOS_ACTIVIDAD, iconoDe,
  crearGrupo, normalizarGrupo, gruposDe, colorDeActividad, colorDeBloque, colorLibre,
  buscarActividades, duplicadosDe,
  crearActividadUnica, editarActividad, duplicarActividad, usosDeActividad,
  impactoEliminarActividad, tareasQueMencionan,
  archivarActividad, ocultarActividad, eliminarActividadDefinitiva,
  ORDENES_ACTIVIDAD, actividadesOrdenadas, alternarFavorita,
  visibleEn, filtrarPorVisibilidad,
  tiempoSemanal, horasYMinutos, repartoSemanal, cargaPorDia,
  fichaActividad, contextoActividadIA, sugerenciasParaCelda,
  hijasDe, puedeSerPadre, resumenActividades,
} from '../src/lib/actividades.js';
import {
  DEFAULT_HORARIO_TOP, TIPOS_ACTIVIDAD, ESTADOS_ACTIVIDAD, VISTAS_ACTIVIDAD,
  crearActividad, normalizarActividad, normalizarHorarioTop, normalizarVisibilidad,
} from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-24';   // lunes

/** Un horario montado con el editor real, no con datos escritos a mano. */
function montar() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (d) => horario.columnas.find((c) => c.dia === d);
  const fila = (i) => horario.filas[i];
  let e = estado;
  for (const [dia, f, nombre] of [[1, 0, 'Biología'], [3, 1, 'Biología'], [5, 0, 'Biología'], [2, 0, 'Matemáticas'], [4, 2, 'Inglés']]) {
    e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(dia).id, filaId: fila(f).id, texto: nombre, hoy: HOY }).estado;
  }
  return { estado: e, horario, col, fila };
}

const bio = (e) => e.actividades.find((a) => (a.nombre || '').toLowerCase() === 'biología');

/* ===========================================================================
   IDENTIDAD
   =========================================================================== */
console.log('\n═══ Identidad: nombre, corto, alias, icono ═══\n');
{
  comprobar('CRITERIO · Existen tipos de actividad', TIPOS_ACTIVIDAD.length >= 8 && TIPOS_ACTIVIDAD.some((t) => t.id === 'reunion'));
  comprobar('CLAVE · `descanso` no se ha borrado al ampliar la lista',
    TIPOS_ACTIVIDAD.some((t) => t.id === 'descanso'));

  const a = crearActividad({ nombre: 'Biología y Geología', corto: 'BIO', alias: ['Bio', 'Biolo'], etiquetas: ['Laboratorio'], hoy: HOY });
  comprobar('CRITERIO · Existe nombre corto', a.corto === 'BIO');
  comprobar('CRITERIO · Existen alias', a.alias.length === 2);
  comprobar('CRITERIO · Existen etiquetas', a.etiquetas[0] === 'laboratorio');
  comprobar('CLAVE · Las etiquetas se guardan en minúsculas, para poder compararlas',
    crearActividad({ nombre: 'X', etiquetas: ['IMPORTANTE', 'importante'] }).etiquetas.length === 2);

  // "Bio" y el alias "Bio" son el mismo término una vez en minúsculas: cuatro,
  // no cinco. Comparar términos repetidos daría resultados duplicados al buscar.
  comprobar('Los términos de búsqueda juntan nombre, corto, alias y etiquetas',
    terminosDe(a).length === 4, terminosDe(a).join(' · '));
  comprobar('...y no se repiten', terminosDe(crearActividad({ nombre: 'Bio', corto: 'Bio', alias: ['bio'] })).length === 1);

  comprobar('CRITERIO · Existe nombre corto derivado si no se pone',
    cortoDe(crearActividad({ nombre: 'Matemáticas' })) === 'MAT');
  comprobar('CLAVE · Nunca queda vacío: una celda sin texto no se distingue de una libre',
    cortoDe(crearActividad({ nombre: '' })).length >= 2);

  comprobar('CRITERIO · Existe icono', ICONOS_ACTIVIDAD.length >= 12);
  comprobar('CLAVE · Sin icono elegido, sale uno según el tipo',
    iconoDe(crearActividad({ nombre: 'Calistenia', tipo: 'entrenamiento' })) === '🏋️');
  comprobar('...y el elegido manda', iconoDe(crearActividad({ nombre: 'X', tipo: 'entrenamiento', icono: '🧬' })) === '🧬');
}

/* ===========================================================================
   ESTADOS Y VISIBILIDAD
   =========================================================================== */
console.log('\n═══ Estados, archivado y visibilidad ═══\n');
{
  comprobar('Hay tres estados', ESTADOS_ACTIVIDAD.length === 3);
  comprobar('CLAVE · Oculta NO es archivada: la especificación las distingue',
    ESTADOS_ACTIVIDAD.some((e) => e.id === 'oculta') && ESTADOS_ACTIVIDAD.some((e) => e.id === 'archivada'));

  comprobar('CLAVE · Un `activa: false` guardado en F1 se traduce a "archivada", no se pierde',
    normalizarActividad({ nombre: 'Vieja', activa: false }).estado === 'archivada');
  comprobar('...y un `activa: true` sigue siendo activa',
    normalizarActividad({ nombre: 'Nueva', activa: true }).estado === 'activa');

  comprobar('CRITERIO · Existe visibilidad por vista', VISTAS_ACTIVIDAD.length === 4);
  comprobar('CLAVE · Todo visible de fábrica: esconder es la excepción',
    VISTAS_ACTIVIDAD.every((v) => normalizarVisibilidad(null)[v] === true));

  const trabajo = crearActividad({ nombre: 'Trabajo personal', visibilidad: { horario: false } });
  comprobar('CRITERIO · Se puede apagar una vista sola (apartado 51)', visibleEn(trabajo, 'horario') === false);
  comprobar('CLAVE · ...sin apagar las demás', visibleEn(trabajo, 'hoy') === true);
  comprobar('CLAVE · Una archivada no se ve en ninguna',
    visibleEn(crearActividad({ nombre: 'X', estado: 'archivada' }), 'hoy') === false);
  comprobar('CLAVE · Una oculta tampoco', visibleEn(crearActividad({ nombre: 'X', estado: 'oculta' }), 'hoy') === false);

  const eventos = [{ actividadId: trabajo.id, titulo: 'Trabajo' }, { actividadId: 'otra', titulo: 'Clase' }, { titulo: 'Suelto' }];
  comprobar('Los eventos se filtran por visibilidad', filtrarPorVisibilidad(eventos, [trabajo], 'horario').length === 2);
  comprobar('CLAVE · Un evento sin actividad NO se esconde: no hay a quién preguntar',
    filtrarPorVisibilidad([{ titulo: 'Suelto' }], [], 'horario').length === 1);
}

/* ===========================================================================
   GRUPOS Y COLORES
   =========================================================================== */
console.log('\n═══ Grupos, colores y herencia ═══\n');
{
  const g = crearGrupo({ nombre: 'Colegio', color: '#5C7E9A' });
  comprobar('CRITERIO · Se pueden crear grupos', g.nombre === 'Colegio');
  comprobar('Un grupo sin nombre no queda vacío', normalizarGrupo({}).nombre === 'Grupo');

  const conColor = crearActividad({ nombre: 'Bio', color: '#2E7D32', grupoId: g.id });
  const sinColor = crearActividad({ nombre: 'Física', grupoId: g.id });
  const suelta = crearActividad({ nombre: 'Suelta' });

  comprobar('CRITERIO · Una actividad con color propio usa el suyo', colorDeActividad(conColor, [g]) === '#2E7D32');
  comprobar('CRITERIO · Una sin color HEREDA el del grupo (apartado 65)', colorDeActividad(sinColor, [g]) === '#5C7E9A');
  comprobar('CLAVE · Y sin grupo se cae al acento, nunca a vacío', colorDeActividad(suelta, [g], '#111111') === '#111111');

  comprobar('CRITERIO · El color del BLOQUE gana al de la actividad (apartado 15)',
    colorDeBloque({ actividadId: conColor.id, color: '#B71C1C' }, [conColor], [g]) === '#B71C1C');
  comprobar('CLAVE · ...y un bloque sin color usa el de su actividad',
    colorDeBloque({ actividadId: conColor.id }, [conColor], [g]) === '#2E7D32');
  comprobar('Un bloque sin actividad usa el acento',
    colorDeBloque({}, [], [], '#222222') === '#222222');

  comprobar('CRITERIO · El color automático evita los ya usados (apartado 13)',
    colorLibre([conColor], []) !== '#2E7D32');
  comprobar('CLAVE · Con la paleta llena sigue devolviendo uno: sin color es peor que repetido',
    typeof colorLibre(Array.from({ length: 40 }, (_, i) => crearActividad({ nombre: `A${i}`, color: colorLibre([]) })), []) === 'string');

  // Los grupos tienen que SOBREVIVIR al guardado.
  const conGrupos = normalizarHorarioTop({ ...DEFAULT_HORARIO_TOP, grupos: [g] });
  comprobar('CLAVE · Los grupos sobreviven a un guardado', gruposDe(conGrupos).length === 1);
  comprobar('...y a dos', gruposDe(normalizarHorarioTop(conGrupos)).length === 1);
}

/* ===========================================================================
   BUSCAR Y DUPLICADOS
   =========================================================================== */
console.log('\n═══ Buscar, duplicados y parecidas ═══\n');
{
  const { estado } = montar();
  comprobar('CRITERIO · Existe búsqueda: "bio" encuentra Biología',
    buscarActividades(estado, 'bio').length === 1);
  comprobar('CLAVE · Y por alias', buscarActividades(
    editarActividad(estado, bio(estado).id, { alias: ['mates raras'] }), 'mates raras').length === 1);
  comprobar('Sin texto no se busca nada', buscarActividades(estado, '  ').length === 0);
  comprobar('CLAVE · Una archivada no sale por defecto',
    buscarActividades(archivarActividad(estado, bio(estado).id), 'bio').length === 0);
  comprobar('...pero se puede pedir', buscarActividades(archivarActividad(estado, bio(estado).id), 'bio', { incluirArchivadas: true }).length === 1);

  comprobar('CRITERIO · Existe detección de duplicados (apartado 56)',
    duplicadosDe(estado, 'Biología').exacta !== null);
  comprobar('CLAVE · Sin importar tildes ni mayúsculas', duplicadosDe(estado, 'BIOLOGIA').exacta !== null);
  comprobar('CRITERIO · Y detección de parecidas (apartado 57)',
    duplicadosDe(estado, 'Biología y Geología').parecidas.length === 1);
  comprobar('CLAVE · Una parecida NO cuenta como exacta: fusionarlas no se deshace',
    duplicadosDe(estado, 'Biología y Geología').exacta === null);
  comprobar('Un nombre nuevo no encuentra nada', duplicadosDe(estado, 'Filosofía').exacta === null);
  comprobar('Se puede ignorar una actividad, para editarla sin chocar consigo misma',
    duplicadosDe(estado, 'Biología', { ignorarId: bio(estado).id }).exacta === null);
}

/* ===========================================================================
   CREAR, DUPLICAR, ARCHIVAR, BORRAR
   =========================================================================== */
console.log('\n═══ Crear, duplicar, archivar y borrar ═══\n');
{
  const { estado } = montar();

  const r = crearActividadUnica(estado, { nombre: 'Biología' });
  comprobar('CLAVE · Crear algo que ya existe DEVUELVE lo que había, no crea otra',
    r.yaExistia === true && r.estado.actividades.length === estado.actividades.length);
  comprobar('...y devuelve la que ya había', r.actividad.id === bio(estado).id);
  comprobar('Se puede forzar si de verdad son dos cosas distintas',
    crearActividadUnica(estado, { nombre: 'Biología' }, { forzar: true }).estado.actividades.length === estado.actividades.length + 1);
  comprobar('Sin nombre no se crea nada', crearActividadUnica(estado, {}).error !== null);
  comprobar('CLAVE · Una nueva sale con un color que no estaba usado',
    !estado.actividades.map((a) => a.color).includes(crearActividadUnica(estado, { nombre: 'Filosofía' }).actividad.color));

  comprobar('CRITERIO · Se pueden duplicar (apartado 61)',
    duplicarActividad(estado, bio(estado).id).estado.actividades.length === estado.actividades.length + 1);
  comprobar('CLAVE · La copia es una ENTIDAD NUEVA, no la misma',
    duplicarActividad(estado, bio(estado).id).actividad.id !== bio(estado).id);
  comprobar('CLAVE · Y NO se lleva los bloques del año pasado',
    duplicarActividad(estado, bio(estado).id).estado.bloques.length === estado.bloques.length);
  comprobar('CLAVE · Ni el enlace con Estudios: renombrar una cambiaría las dos',
    duplicarActividad(estado, bio(estado).id).actividad.asignaturaId === null);
  comprobar('Duplicar algo que no existe no revienta', duplicarActividad(estado, 'zzz').error !== null);

  comprobar('CLAVE · Los usos son DERIVADOS, no un contador', usosDeActividad(estado, bio(estado).id) === 3);

  const impacto = impactoEliminarActividad(estado, bio(estado).id, {
    estudios: { examenes: [] }, productividad: { tareas: [{ id: 't1', texto: 'Estudiar biología tema 3' }] },
  });
  comprobar('CRITERIO · Borrar enseña el impacto ANTES (apartado 58)', impacto.bloques === 3);
  comprobar('CLAVE · ...incluidas las tareas que la mencionan', impacto.tareas === 1);
  comprobar('CLAVE · Y la opción recomendada es ARCHIVAR', impacto.recomendado === 'archivar');
  const nueva = crearActividadUnica(estado, { nombre: 'Filosofía' });
  comprobar('CLAVE · Una actividad sin nada colgando sí se puede borrar sin más',
    impactoEliminarActividad(nueva.estado, nueva.actividad.id).recomendado === 'eliminar');
  comprobar('Una que no existe no da impacto', impactoEliminarActividad(estado, 'zzz') === null);

  comprobar('Las tareas se enlazan por mención, y solo con tres letras o más',
    tareasQueMencionan({ tareas: [{ id: 't', texto: 'repasar BIOLOGÍA' }] }, bio(estado)).length === 1);
  comprobar('CLAVE · Una tarea que no la menciona NO cuenta',
    tareasQueMencionan({ tareas: [{ id: 't', texto: 'comprar pan' }] }, bio(estado)).length === 0);

  const arch = archivarActividad(estado, bio(estado).id);
  comprobar('CRITERIO · Se pueden archivar', arch.actividades.find((a) => a.id === bio(estado).id).estado === 'archivada');
  comprobar('CLAVE · ...y sus bloques SIGUEN AHÍ', arch.bloques.length === estado.bloques.length);
  comprobar('CRITERIO · Y restaurarse', archivarActividad(arch, bio(estado).id, false).actividades.find((a) => a.id === bio(estado).id).estado === 'activa');
  comprobar('Se puede ocultar sin archivar', ocultarActividad(estado, bio(estado).id).actividades.find((a) => a.id === bio(estado).id).estado === 'oculta');

  const borrada = eliminarActividadDefinitiva(estado, bio(estado).id);
  comprobar('Borrar de verdad la quita', borrada.actividades.length === estado.actividades.length - 1);
  comprobar('CLAVE · ...pero los bloques NO se borran: se quedan sin actividad',
    borrada.bloques.length === estado.bloques.length
    && borrada.bloques.filter((b) => b.actividadId === null).length === 3);
}

/* ===========================================================================
   ORDEN, FAVORITOS Y RECIENTES
   =========================================================================== */
console.log('\n═══ Orden, favoritos y recientes ═══\n');
{
  const { estado } = montar();
  comprobar('Hay cuatro órdenes (apartado 83)', ORDENES_ACTIVIDAD.length === 4);

  comprobar('CRITERIO · Existen favoritos', alternarFavorita(estado, bio(estado).id).actividades.find((a) => a.id === bio(estado).id).favorita === true);
  const conFav = alternarFavorita(estado, bio(estado).id);
  comprobar('CLAVE · Una favorita sale la primera', actividadesOrdenadas(conFav)[0].id === bio(estado).id);
  comprobar('Se puede quitar', alternarFavorita(conFav, bio(estado).id).actividades.find((a) => a.id === bio(estado).id).favorita === false);

  comprobar('CRITERIO · Se ordenan por más usadas', actividadesOrdenadas(estado, { orden: 'usadas' })[0].usos === 3);
  comprobar('CRITERIO · Y alfabéticamente', actividadesOrdenadas(estado, { orden: 'alfabetico' })[0].titulo === 'Biología');
  comprobar('CRITERIO · Y existen las recientes', actividadesOrdenadas(estado, { orden: 'recientes' }).length === 3);
  comprobar('CLAVE · Los usos vienen contados de los bloques, no de un campo',
    actividadesOrdenadas(estado).every((a) => a.usos === estado.bloques.filter((b) => b.actividadId === a.id).length));
  comprobar('Se puede filtrar por tipo', actividadesOrdenadas(estado, { tipo: 'entrenamiento' }).length === 0);
  comprobar('Una archivada no sale', actividadesOrdenadas(archivarActividad(estado, bio(estado).id)).length === 2);
}

/* ===========================================================================
   ESTADÍSTICAS DERIVADAS
   =========================================================================== */
console.log('\n═══ Tiempo semanal y carga ═══\n');
{
  const { estado, horario } = montar();
  comprobar('CRITERIO · Se calcula el tiempo semanal (apartado 46)', tiempoSemanal(estado, bio(estado).id) === 180);
  comprobar('CLAVE · Sale de los bloques, no de un total guardado',
    tiempoSemanal(eliminarActividadDefinitiva(estado, bio(estado).id), bio(estado).id) === 0);
  comprobar('Las horas se dicen en castellano', horasYMinutos(180) === '3 h' && horasYMinutos(90) === '1 h 30 min');
  comprobar('...y cero también', horasYMinutos(0) === '0 min');

  const reparto = repartoSemanal(estado);
  comprobar('CRITERIO · Hay un reparto semanal, de más a menos', reparto[0].minutos >= reparto[1].minutos);
  comprobar('CLAVE · Una actividad sin bloques no sale en el reparto',
    repartoSemanal(crearActividadUnica(estado, { nombre: 'Filosofía' }).estado).length === reparto.length);

  const carga = cargaPorDia(estado, horario.id);
  comprobar('CRITERIO · Se calcula la carga por día (apartado 47)', carga.length === 7);
  comprobar('El lunes tiene una clase', carga[0].bloques === 1);
  comprobar('CLAVE · Y el domingo ninguna: no se inventa carga', carga[6].bloques === 0);
  comprobar('Un horario que no existe da la semana vacía', cargaPorDia(estado, 'zzz').every((d) => d.bloques === 0));
}

/* ===========================================================================
   LA FICHA Y EL CONTEXTO PARA LA IA
   =========================================================================== */
console.log('\n═══ La ficha y el contexto para la IA ═══\n');
{
  const { estado } = montar();
  const conDatos = editarActividad(estado, bio(estado).id, {
    persona: 'Ana Ruiz', ubicacion: 'Lab 2.14', material: ['Bata', 'Gafas'],
    notas: 'Preguntar por la recuperación', etiquetas: ['laboratorio'],
  });
  const f = fichaActividad(conDatos, bio(estado).id, {
    estudios: { examenes: [{ id: 'x1', asignaturaId: null, fecha: '2026-09-03', tema: 'Tema 3' }] },
    productividad: { tareas: [{ id: 't1', texto: 'Repasar biología', hecha: false }] },
  });

  comprobar('CRITERIO · La ficha existe y trae la identidad', f.titulo === 'Biología' && f.icono);
  comprobar('CRITERIO · Trae el profesor', f.profesor === 'Ana Ruiz');
  comprobar('CRITERIO · Trae el aula', f.aula === 'Lab 2.14');
  comprobar('CRITERIO · Trae el material', f.material.length === 2);
  comprobar('CRITERIO · Trae el horario, ordenado por día', f.horario.length === 3 && f.horario[0].dia === 1);
  comprobar('CRITERIO · Y el tiempo de la semana', f.minutosSemana === 180);
  comprobar('CRITERIO · Trae las tareas que la mencionan', f.tareasPendientes === 1);
  comprobar('CLAVE · ...y dice que el enlace es por mención, no un campo real', f.tareasPorMencion === true);
  comprobar('Una que no existe da null', fichaActividad(estado, 'zzz') === null);

  comprobar('CRITERIO · Existe contexto para la IA (apartado 53)', contextoActividadIA(conDatos, bio(estado).id).nombre === 'Biología');
  comprobar('CLAVE · Y devuelve ESTRUCTURA, no un texto', Array.isArray(contextoActividadIA(conDatos, bio(estado).id).horario));
  comprobar('⚠️ CLAVE · LAS NOTAS PRIVADAS NO VIAJAN EN EL CONTEXTO DE LA IA (apartados 52 y 73)',
    !JSON.stringify(contextoActividadIA(conDatos, bio(estado).id)).toLowerCase().includes('recuperación'));
  comprobar('CLAVE · ...pero SÍ están en la ficha, que es la pantalla privada de Josué',
    f.notas === 'Preguntar por la recuperación');
}

/* ===========================================================================
   SUGERENCIAS Y JERARQUÍA
   =========================================================================== */
console.log('\n═══ Sugerencias, jerarquía y resumen ═══\n');
{
  const { estado, horario, col, fila } = montar();

  // El apartado 86 es explícito: *"el usuario decide, no se deberá modificar el
  // horario automáticamente"*. Se fotografía el estado ANTES para poder
  // demostrar que sugerir no escribe.
  const antes = JSON.stringify(estado);
  const sug = sugerenciasParaCelda(estado, { horarioId: horario.id, columnaId: col(1).id, filaId: fila(0).id });
  comprobar('CRITERIO · Se sugiere lo que suele ir a esa hora (apartado 86)', sug.length > 0);
  comprobar('CLAVE · Biología, que va tres días, pesa más', sug[0].titulo === 'Biología');
  comprobar('⚠️ CLAVE · Sugerir NO ESCRIBE NADA: el estado es idéntico después',
    JSON.stringify(estado) === antes);
  comprobar('En un horario vacío no se sugiere nada raro',
    sugerenciasParaCelda(DEFAULT_HORARIO_TOP, { horarioId: 'zzz' }).length === 0);

  const madre = crearActividadUnica(estado, { nombre: 'Estudios' });
  const conHija = editarActividad(madre.estado, bio(estado).id, { padreId: madre.actividad.id });
  comprobar('CRITERIO · Existen actividades padre e hijas (apartado 63)', hijasDe(conHija, madre.actividad.id).length === 1);
  comprobar('⚠️ CLAVE · Una actividad NO puede ser su propia madre', puedeSerPadre(conHija, bio(estado).id, bio(estado).id) === false);
  comprobar('⚠️ CLAVE · Ni su propia abuela: sin esto, pintar el árbol se colgaría',
    puedeSerPadre(conHija, madre.actividad.id, bio(estado).id) === false);
  comprobar('Una jerarquía normal sí vale', puedeSerPadre(conHija, bio(estado).id, madre.actividad.id) === true);

  const r = resumenActividades(estado);
  comprobar('El resumen cuenta las actividades', r.total === 3 && r.activas === 3);
  comprobar('...y las que no se usan', resumenActividades(crearActividadUnica(estado, { nombre: 'Filosofía' }).estado).sinUsar === 1);
  comprobar('...y el tiempo total de la semana', r.minutosSemana === 300);
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí: la ficha en pantalla, el selector de iconos y el');
console.log('     recorrido tocando en un iPhone. Son del navegador real (mismo límite que R1).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
