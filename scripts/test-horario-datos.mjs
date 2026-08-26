// ============================================================================
// HT · Fase 2/12 — Pruebas del modelo de datos
//
// Lo que más se comprueba: que la mochila y el calendario **se derivan** en vez
// de guardarse (apartados 22, 27 y 31), y que los materiales repetidos son UNA
// entidad y no cuatro textos iguales (apartado 2).
// ============================================================================

import {
  TIPOS_MATERIAL, crearMaterial, normalizarMaterial, crearEnlaceMaterial, normalizarEnlaceMaterial,
  DEFAULT_CONFIG_HORARIO, normalizarConfigHorario, DEFAULT_HORARIO_DATOS, normalizarDatos,
  migrarMaterialesF1, materialDeActividad,
  normalizarItemMochila, mochilaDelDia, marcarEnMochila, podarMochila,
  eventosDeHorario, agendaDelDia, construirIndices,
  validarBloque, validarExcepcion, validarHorario,
  detectarConflicto, conflictosEntre, COLECCIONES_PAPELERA_HORARIO, describirModelo,
} from '../src/lib/horarioDatos.js';
import {
  crearHorario, crearActividad, crearBloque, crearExcepcion, crearColumna,
  horarioVigente, resolverDia, normalizarRecurrencia, tocaEsaSemana, lunesDe,
  CLASES_RECURRENCIA,
} from '../src/lib/horario.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const LUNES = '2026-08-24';
const MARTES = '2026-08-25';
const LUNES_SIG = '2026-08-31';
const LUNES_2SIG = '2026-09-07';
const SABADO = '2026-08-29';

/** El mismo instituto de HT F1, ahora con material como texto (formato de F1). */
function montar() {
  const horario = crearHorario({ nombre: 'Instituto', tipo: 'escolar', hoy: LUNES });
  const col = (dia) => horario.columnas.find((c) => c.dia === dia);
  const mates = crearActividad({ nombre: 'Matemáticas', tipo: 'asignatura', color: '#3B82F6', material: ['Libro', 'Calculadora', 'Libreta'], hoy: LUNES });
  const bio = crearActividad({ nombre: 'Biología', tipo: 'asignatura', color: '#22C55E', material: ['Libro', 'Libreta'], hoy: LUNES });
  const bloques = [
    crearBloque({ horarioId: horario.id, columnaId: col(1).id, actividadId: mates.id, inicio: '08:00', fin: '09:00', hoy: LUNES }),
    crearBloque({ horarioId: horario.id, columnaId: col(1).id, actividadId: bio.id, inicio: '09:00', fin: '10:00', hoy: LUNES }),
    crearBloque({ horarioId: horario.id, columnaId: col(2).id, actividadId: bio.id, inicio: '10:00', fin: '11:00', hoy: LUNES }),
  ];
  return {
    datos: { ...DEFAULT_HORARIO_DATOS, horarios: [horario], actividades: [mates, bio], bloques },
    horario, col, mates, bio, bloques,
  };
}

/* ===========================================================================
   TIMESTAMPS, PERIODOS Y VIGENCIA (apartados 5, 7 y 37)
   =========================================================================== */
console.log('\n═══ HT Fase 2 — periodos, vigencia y timestamps ═══\n');
{
  const h = crearHorario({ nombre: 'Curso 26/27', desde: '2026-09-01', hasta: '2027-06-30', hoy: LUNES });
  comprobar('Un horario guarda cuándo se creó y se actualizó', h.creadoEn === LUNES && h.actualizadoEn === LUNES);
  comprobar('...y su periodo de validez', h.desde === '2026-09-01' && h.hasta === '2027-06-30');
  comprobar('Una fecha ilegible se descarta, no se guarda a medias', crearHorario({ desde: 'septiembre' }).desde === '');

  comprobar('CLAVE · Antes de empezar el curso no está vigente', horarioVigente(h, '2026-08-15') === false);
  comprobar('CLAVE · Durante el curso sí', horarioVigente(h, '2026-11-20') === true);
  comprobar('CLAVE · Acabado el curso deja de resolver SOLO', horarioVigente(h, '2027-09-01') === false);
  comprobar('El primer y el último día cuentan', horarioVigente(h, '2026-09-01') && horarioVigente(h, '2027-06-30'));
  comprobar('Sin fechas está vigente siempre', horarioVigente(crearHorario({}), '2030-01-01') === true);
  comprobar('Un horario desactivado no está vigente nunca', horarioVigente({ ...h, activo: false }, '2026-11-20') === false);

  // Y eso se nota en `resolverDia`: el curso pasado no aparece.
  const { datos, horario } = montar();
  const caducado = { ...datos, horarios: [{ ...horario, hasta: '2026-06-30' }] };
  comprobar('CLAVE · Un horario caducado no resuelve, sin desactivarlo a mano', resolverDia(caducado, LUNES).length === 0);
  comprobar('...pero sus bloques siguen guardados', caducado.bloques.length === 3);

  // Columnas: corto, posición, visibilidad (apartado 8).
  comprobar('Una columna de día trae su abreviatura correcta', crearColumna({ dia: 3 }).corto === 'X');
  comprobar('...que NO son las tres primeras letras', crearColumna({ dia: 3 }).corto !== 'Mié');
  comprobar('Y guarda su posición', crearColumna({ dia: 1, posicion: 4 }).posicion === 4);
  const oculta = { ...datos, horarios: [{ ...horario, columnas: horario.columnas.map((c) => (c.dia === 1 ? { ...c, visible: false } : c)) }] };
  comprobar('CLAVE · Una columna oculta no resuelve...', resolverDia(oculta, LUNES).length === 0);
  comprobar('...pero no borra sus bloques', oculta.bloques.length === 3);
}

/* ===========================================================================
   RECURRENCIA: SEMANAS ALTERNAS (apartado 23)
   =========================================================================== */
console.log('\n═══ Semanas alternas ═══\n');
{
  const { datos, horario, col, mates } = montar();
  const alterno = crearBloque({
    horarioId: horario.id, columnaId: col(1).id, actividadId: mates.id,
    inicio: '12:00', fin: '13:00', recurrencia: { clase: 'alternas', ancla: LUNES }, hoy: LUNES,
  });
  const conAlterno = { ...datos, bloques: [...datos.bloques, alterno] };

  comprobar('Las dos clases de recurrencia', CLASES_RECURRENCIA.length === 2);
  comprobar('Una recurrencia inventada cae en "siempre"', normalizarRecurrencia({ clase: 'zzz' }).clase === 'siempre');
  comprobar('El lunes de una fecha se calcula bien', lunesDe(SABADO) === LUNES);
  comprobar('...y el de un lunes es él mismo', lunesDe(LUNES) === LUNES);

  comprobar('CLAVE · La semana del ancla SÍ toca', resolverDia(conAlterno, LUNES).length === 3);
  comprobar('CLAVE · La siguiente NO', resolverDia(conAlterno, LUNES_SIG).length === 2);
  comprobar('CLAVE · Y la de después otra vez sí', resolverDia(conAlterno, LUNES_2SIG).length === 3);
  comprobar('El resto de bloques no se ven afectados',
    resolverDia(conAlterno, LUNES_SIG).every((e) => e.inicio !== '12:00'));
  comprobar('CLAVE · Sin ancla no se hace desaparecer nada en silencio', tocaEsaSemana({ clase: 'alternas' }, LUNES) === true);
  comprobar('Un bloque normal toca todas las semanas',
    tocaEsaSemana({ clase: 'siempre' }, LUNES) && tocaEsaSemana(null, LUNES_SIG));
}

/* ===========================================================================
   COLOR E ICONO PROPIOS DEL BLOQUE (apartados 15 y 16)
   =========================================================================== */
console.log('\n═══ El color del bloque gana al de la asignatura ═══\n');
{
  const { datos, bloques } = montar();
  comprobar('Sin override manda el color de la asignatura', resolverDia(datos, LUNES)[0].color === '#3B82F6');

  const especial = { ...datos, bloques: datos.bloques.map((b) => (b.id === bloques[0].id ? { ...b, colorPropio: '#F59E0B', iconoPropio: 'estrella' } : b)) };
  comprobar('CLAVE · Con override manda el del bloque', resolverDia(especial, LUNES)[0].color === '#F59E0B');
  comprobar('...también el icono', resolverDia(especial, LUNES)[0].icono === 'estrella');
  comprobar('CLAVE · Y los DEMÁS bloques de esa asignatura NO cambian',
    resolverDia(especial, LUNES)[1].color === '#22C55E');
}

/* ===========================================================================
   MATERIALES COMO ENTIDADES (apartados 2, 25 y 26)
   =========================================================================== */
console.log('\n═══ Materiales: una entidad, no cuatro textos ═══\n');
{
  const { datos, mates, bio } = montar();

  comprobar('Los seis tipos de material', TIPOS_MATERIAL.length === 6);
  comprobar('Un tipo inventado cae en "otro"', normalizarMaterial({ tipo: 'zzz' }).tipo === 'otro');
  comprobar('Una cantidad de cero se acota a 1', crearEnlaceMaterial({ cantidad: 0 }).cantidad === 1);
  comprobar('...y una negativa también', normalizarEnlaceMaterial({ cantidad: -3 }).cantidad === 1);
  comprobar('El material es obligatorio por defecto', crearEnlaceMaterial({}).obligatorio === true);

  const migrado = migrarMaterialesF1(datos);
  // "Libro" y "Libreta" están en las dos asignaturas; "Calculadora" solo en una.
  comprobar('CLAVE · Los materiales repetidos se unen en UNA entidad', migrado.materiales.length === 3, String(migrado.materiales.length));
  comprobar('CLAVE · ...con un enlace por asignatura', migrado.enlacesMaterial.length === 5, String(migrado.enlacesMaterial.length));
  comprobar('Matemáticas conserva sus tres', materialDeActividad(migrado, mates.id).length === 3);
  comprobar('Biología los suyos', materialDeActividad(migrado, bio.id).length === 2);
  comprobar('CLAVE · Migrar dos veces no duplica nada',
    migrarMaterialesF1(migrado).materiales.length === 3 && migrarMaterialesF1(migrado).enlacesMaterial.length === 5);
  comprobar('El texto original se conserva: la migración es reversible',
    migrado.actividades.find((a) => a.id === mates.id).material.length === 3);
  comprobar('Sin migrar, el material sigue leyéndose de los textos', materialDeActividad(datos, mates.id).length === 3);
  comprobar('Una actividad sin material no revienta', materialDeActividad(datos, 'fantasma').length === 0);
}

/* ===========================================================================
   LA MOCHILA SE DERIVA (apartados 27 y 28)
   =========================================================================== */
console.log('\n═══ La mochila es una consecuencia, no una lista ═══\n');
{
  const { datos } = montar();
  const d = migrarMaterialesF1(datos);

  const lunes = mochilaDelDia(d, LUNES);
  comprobar('CLAVE · El lunes salen tres cosas, no cinco', lunes.length === 3, String(lunes.length));
  comprobar('CLAVE · ...porque el libro y la libreta valen para las dos clases',
    lunes.find((m) => m.nombre === 'Libreta').para.join(',') === 'Biología,Matemáticas');
  comprobar('La calculadora solo para Matemáticas',
    lunes.find((m) => m.nombre === 'Calculadora').para.join(',') === 'Matemáticas');
  comprobar('CLAVE · No hay NADA guardado en la mochila todavía', d.mochila.length === 0);
  comprobar('El martes sale lo de Biología', mochilaDelDia(d, MARTES).length === 2);
  comprobar('Un sábado sin clases no necesita nada', mochilaDelDia(d, SABADO).length === 0);
  comprobar('Todo empieza sin marcar', lunes.every((m) => m.metido === false));

  // Marcar es lo ÚNICO que se guarda.
  const conMarca = marcarEnMochila(d, LUNES, { materialId: lunes[0].materialId, nombre: lunes[0].nombre, metido: true });
  comprobar('CLAVE · Marcar guarda un solo item', conMarca.mochila.length === 1);
  comprobar('...y se ve al derivar', mochilaDelDia(conMarca, LUNES).find((m) => m.nombre === lunes[0].nombre).metido === true);
  comprobar('Marcar dos veces no duplica',
    marcarEnMochila(conMarca, LUNES, { materialId: lunes[0].materialId, nombre: lunes[0].nombre, metido: false }).mochila.length === 1);
  comprobar('...y desmarca de verdad',
    mochilaDelDia(marcarEnMochila(conMarca, LUNES, { materialId: lunes[0].materialId, nombre: lunes[0].nombre, metido: false }), LUNES)[0].metido === false);

  // Algo a mano.
  const conManual = marcarEnMochila(d, LUNES, { nombre: 'Bocadillo', metido: false, manual: true });
  comprobar('Se puede añadir algo a mano', mochilaDelDia(conManual, LUNES).some((m) => m.nombre === 'Bocadillo' && m.manual));
  comprobar('...y no ensucia los derivados', mochilaDelDia(conManual, LUNES).length === 4);

  // Solo lo obligatorio.
  const conOpcional = {
    ...d,
    enlacesMaterial: d.enlacesMaterial.map((x, i) => (i === 0 ? { ...x, obligatorio: false } : x)),
  };
  comprobar('Se puede pedir solo lo obligatorio', mochilaDelDia(conOpcional, LUNES, { soloObligatorio: true }).length <= 3);
  comprobar('Lo obligatorio va primero', mochilaDelDia(conOpcional, LUNES)[0].obligatorio === true);

  // Podar no pierde nada derivable.
  const vieja = marcarEnMochila(d, '2026-01-01', { nombre: 'X', metido: true, manual: true });
  comprobar('Podar quita lo viejo', podarMochila(vieja, { hoy: LUNES, diasAtras: 30 }).mochila.length === 0);
  comprobar('...y conserva lo reciente', podarMochila(conMarca, { hoy: LUNES, diasAtras: 30 }).mochila.length === 1);
  comprobar('CLAVE · Podar no pierde la mochila: se vuelve a derivar',
    mochilaDelDia(podarMochila(vieja, { hoy: LUNES }), LUNES).length === 3);

  const item = normalizarItemMochila({ fecha: 'ayer' });
  comprobar('Un item con fecha ilegible se descarta al normalizar', item.fecha === '');
}

/* ===========================================================================
   EL CALENDARIO NO SE DUPLICA (apartados 20, 21 y 22)
   =========================================================================== */
console.log('\n═══ El calendario recibe eventos derivados ═══\n');
{
  const { datos } = montar();

  const eventos = eventosDeHorario(datos, { desde: LUNES, dias: 7 });
  comprobar('El horario aporta sus eventos al calendario', eventos.length === 3, String(eventos.length));
  comprobar('CLAVE · ...con `origen` y `origenId`, como el resto de módulos',
    eventos.every((e) => e.origen === 'horario' && 'origenId' in e));
  comprobar('CLAVE · ...y NO se guarda ninguno', datos.bloques.length === 3);
  comprobar('El id es estable entre llamadas',
    eventosDeHorario(datos, { desde: LUNES, dias: 7 })[0].id === eventos[0].id);
  comprobar('...y distinto por fecha', new Set(eventos.map((e) => e.id)).size === eventos.length);
  comprobar('Dos semanas dan el doble', eventosDeHorario(datos, { desde: LUNES, dias: 14 }).length === 6);
  comprobar('CLAVE · Catorce días no crean catorce registros: se calculan', datos.bloques.length === 3);

  const conCambio = { ...datos, excepciones: [crearExcepcion({ fecha: MARTES, tipo: 'modificado', bloqueId: datos.bloques[2].id, cambios: { inicio: '12:00', fin: '13:00' } })] };
  comprobar('Un cambio puntual se marca para el calendario',
    eventosDeHorario(conCambio, { desde: LUNES, dias: 7 }).some((e) => e.cambiado === true));
}

/* ===========================================================================
   HOY, CON TODAS LAS FUENTES (apartados 31 y 32)
   =========================================================================== */
console.log('\n═══ HOY agrega, no copia ═══\n');
{
  const { datos } = montar();
  const d = migrarMaterialesF1(datos);

  const agenda = agendaDelDia(d, LUNES, {
    ahora: '08:30',
    tareas: [{ titulo: 'Entregar trabajo de Biología', prioridad: 'alta' }],
    eventos: [{ titulo: 'Entrenamiento', hora: '17:00', horaFin: '18:30' }],
    recordatorios: [{ titulo: 'Llevar calculadora' }],
  });

  comprobar('La agenda junta clases y eventos con hora', agenda.conHora.length === 3);
  comprobar('CLAVE · ...ordenados por hora', agenda.conHora.map((x) => x.hora).join(',') === '08:00,09:00,17:00');
  comprobar('Lo que no tiene hora va aparte', agenda.sinHora.length === 2);
  comprobar('CLAVE · ...ordenado por importancia, no a las 00:00',
    agenda.sinHora[0].titulo === 'Entregar trabajo de Biología');
  comprobar('Sabe qué hay en curso', agenda.enCurso.titulo === 'Matemáticas');
  comprobar('...y qué viene después', agenda.siguiente.titulo === 'Biología');
  comprobar('Y trae el material del día', agenda.material.length === 3);
  comprobar('El total suma las dos listas', agenda.total === 5);
  comprobar('Un día sin nada no revienta', agendaDelDia(d, SABADO).total === 0);
  comprobar('CLAVE · Las fuentes de fuera son parámetros: HOY no importa otros módulos',
    agendaDelDia(d, LUNES).sinHora.length === 0);
}

/* ===========================================================================
   ÍNDICES, VALIDACIONES Y CONFLICTOS (apartados 36, 39, 40 y 49)
   =========================================================================== */
console.log('\n═══ Índices, validaciones y conflictos ═══\n');
{
  const { datos, horario, col, mates, bloques } = montar();

  const idx = construirIndices(datos);
  comprobar('El índice por horario agrupa sus bloques', idx.bloquesPorHorario.get(horario.id).length === 3);
  comprobar('El índice por columna también', idx.bloquesPorColumna.get(col(1).id).length === 2);
  comprobar('Y el de actividad', idx.bloquesPorActividad.get(mates.id).length === 1);
  comprobar('Los horarios activos están precalculados', idx.horariosActivos.length === 1);
  comprobar('Un índice vacío no revienta', construirIndices(DEFAULT_HORARIO_DATOS).bloquesPorHorario.size === 0);

  // Validaciones.
  comprobar('Un bloque correcto pasa', validarBloque(datos, bloques[0]).ok === true);
  comprobar('Un bloque de un horario inexistente se rechaza',
    validarBloque(datos, { ...bloques[0], horarioId: 'fantasma' }).ok === false);
  comprobar('...con su motivo', validarBloque(datos, { ...bloques[0], horarioId: 'fantasma' }).motivo.includes('horario'));
  comprobar('Una columna de otro horario se rechaza', validarBloque(datos, { ...bloques[0], columnaId: 'fantasma' }).ok === false);
  comprobar('CLAVE · Una hora de fin anterior a la de inicio se rechaza',
    validarBloque(datos, { ...bloques[0], inicio: '10:00', fin: '09:00' }).ok === false);
  comprobar('Sin horas también', validarBloque(datos, { ...bloques[0], inicio: '', fin: '' }).ok === false);
  comprobar('Una actividad que ya no existe se rechaza', validarBloque(datos, { ...bloques[0], actividadId: 'fantasma' }).ok === false);

  comprobar('Una excepción correcta pasa', validarExcepcion(datos, crearExcepcion({ fecha: LUNES, tipo: 'cancelado', bloqueId: bloques[0].id })).ok === true);
  comprobar('Una que apunta a un bloque inexistente se rechaza',
    validarExcepcion(datos, { fecha: LUNES, tipo: 'cancelado', bloqueId: 'fantasma' }).ok === false);
  comprobar('Un día libre NO necesita bloque', validarExcepcion(datos, { fecha: LUNES, tipo: 'dia_libre' }).ok === true);
  comprobar('CLAVE · Un "añadido" sin decir qué se añade se rechaza',
    validarExcepcion(datos, { fecha: LUNES, tipo: 'anadido', cambios: {} }).ok === false);
  comprobar('...y con título pasa', validarExcepcion(datos, { fecha: LUNES, tipo: 'anadido', cambios: { titulo: 'Excursión' } }).ok === true);
  comprobar('Una fecha ilegible se rechaza', validarExcepcion(datos, { fecha: 'ayer', tipo: 'dia_libre' }).ok === false);

  comprobar('Un horario sin nombre se rechaza', validarHorario(datos, { ...horario, nombre: '   ', id: 'nuevo' }).ok === false);
  comprobar('CLAVE · Un fin anterior al inicio se rechaza',
    validarHorario(datos, { id: 'n', nombre: 'X', desde: '2027-01-01', hasta: '2026-01-01' }).ok === false);
  comprobar('Un nombre repetido se rechaza', validarHorario(datos, { id: 'nuevo', nombre: 'Instituto' }).ok === false);
  comprobar('...pero renombrarse a sí mismo no', validarHorario(datos, horario).ok === true);

  // Conflictos entre dispositivos.
  const local = { id: 'b1', inicio: '09:00', titulo: 'Mates', actualizadoEn: '2026-08-24T10:00:00Z' };
  const remoto = { id: 'b1', inicio: '10:00', titulo: 'Mates', actualizadoEn: '2026-08-24T11:00:00Z' };
  const c = detectarConflicto(local, remoto);
  comprobar('CLAVE · Dos dispositivos cambiando la hora dan CONFLICTO', c !== null);
  comprobar('...diciendo qué campo', c.campos.join(',') === 'inicio');
  comprobar('...y cuál es más reciente', c.masReciente === 'remoto');
  comprobar('CLAVE · Detecta, pero NO resuelve ni sobrescribe',
    !('resuelto' in c) && !('ganador' in c));
  comprobar('Sin diferencias reales no hay conflicto',
    detectarConflicto(local, { ...local, actualizadoEn: '2026-08-24T12:00:00Z' }) === null);
  comprobar('CLAVE · Un `actualizadoEn` distinto por sí solo NO es conflicto',
    detectarConflicto({ id: 'x', titulo: 'A', actualizadoEn: '1' }, { id: 'x', titulo: 'A', actualizadoEn: '2' }) === null);
  comprobar('Entidades distintas no se comparan', detectarConflicto(local, { ...remoto, id: 'otro' }) === null);
  comprobar('Una lista de conflictos se puede pedir de golpe', conflictosEntre([local], [remoto]).length === 1);
  comprobar('...y sin nada remoto no hay ninguno', conflictosEntre([local], []).length === 0);
}

/* ===========================================================================
   CONFIG, PAPELERA Y MODELO
   =========================================================================== */
console.log('\n═══ Configuración, papelera y modelo ═══\n');
{
  comprobar('La config trae sus valores por defecto', DEFAULT_CONFIG_HORARIO.inicioSemana === 1);
  comprobar('Una vista inventada cae en "semana"', normalizarConfigHorario({ vista: 'zzz' }).vista === 'semana');
  comprobar('Un inicio de semana imposible cae en lunes', normalizarConfigHorario({ inicioSemana: 12 }).inicioSemana === 1);
  comprobar('Los interruptores respetan el false explícito', normalizarConfigHorario({ mostrarAulas: false }).mostrarAulas === false);
  comprobar('CLAVE · La densidad y el tamaño de texto NO están aquí: son de la app entera',
    !('densidad' in DEFAULT_CONFIG_HORARIO) && !('tamanoTexto' in DEFAULT_CONFIG_HORARIO));

  comprobar('Las cuatro colecciones borrables están declaradas', COLECCIONES_PAPELERA_HORARIO.length === 4);
  comprobar('...todas del módulo horarioTop', COLECCIONES_PAPELERA_HORARIO.every((c) => c.modulo === 'horarioTop'));
  comprobar('...y cada una con el campo que la identifica', COLECCIONES_PAPELERA_HORARIO.every((c) => c.campos.length > 0));

  const { datos } = montar();
  const modelo = describirModelo(migrarMaterialesF1(datos));
  comprobar('El modelo se describe leyendo el estado real', modelo.length === 9);
  comprobar('...y cuenta lo que hay de verdad', modelo.find((m) => m.entidad === 'bloques').n === 3);
  comprobar('CLAVE · Y dice que las actividades se relacionan con Estudios',
    modelo.find((m) => m.entidad === 'actividades').relacion === 'estudios.asignaturas');
  comprobar('Un estado vacío se normaliza entero',
    Object.keys(normalizarDatos(null)).length === Object.keys(DEFAULT_HORARIO_DATOS).length);
  comprobar('Los enlaces rotos se descartan al cargar',
    normalizarDatos({ enlacesMaterial: [{ actividadId: 'a' }] }).enlacesMaterial.length === 0);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
