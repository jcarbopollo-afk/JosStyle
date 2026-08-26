// ============================================================================
// HT · Fase 12/12 — Pruebas del cierre del módulo
//
// El apartado 103 enumera cincuenta y tres cosas que Horario Top tiene que
// saber hacer. Aquí se comprueban **contra el código**, no contra una lista
// escrita a mano: si alguien borra una función, esto falla solo.
//
// Y lo demás: la puerta única (90-91) y exportar/importar (82-83), con la
// idempotencia que impide que importar dos veces duplique el curso entero.
// ============================================================================

import {
  diaCompleto, resumenModulo, contextoCompletoIA,
  VERSION_EXPORTACION, COLECCIONES_EXPORTABLES, NO_SE_EXPORTA,
  exportarHorario, revisarImportacion, importarHorario,
  CAPACIDADES, NO_COMPROBABLE_AQUI, auditarHorarioTop, estadoDelModulo,
} from '../src/lib/horarioTop.js';
import { DEFAULT_HORARIO_TOP, normalizarHorarioTop } from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';
import { marcarCompletada } from '../src/lib/automatizaciones.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-24';

function montar() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (d) => horario.columnas.find((c) => c.dia === d);
  let e = estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '08:00', fin: '09:00', texto: 'Matemáticas', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(2).id, inicio: '10:00', fin: '11:00', texto: 'Biología', hoy: HOY }).estado;
  return { estado: e, horario, col };
}

/* ===========================================================================
   LA AUDITORÍA
   =========================================================================== */
console.log('\n═══ La auditoría del apartado 103 ═══\n');
{
  const a = auditarHorarioTop();

  comprobar('Hay una lista de capacidades atada al código', CAPACIDADES.length >= 35);
  comprobar('⚠️ CLAVE · Cada capacidad tiene una PRUEBA, no una casilla',
    CAPACIDADES.every((c) => typeof c.prueba === 'function'));
  comprobar('CLAVE · ...y dice de qué fase viene', CAPACIDADES.every((c) => c.fase >= 1 && c.fase <= 12));

  comprobar('⚠️ CRITERIO · EL MÓDULO ESTÁ COMPLETO', a.completo === true, a.faltan.map((f) => f.label).join(', '));
  comprobar('CLAVE · ...y se dice cuántas de cuántas', a.presentes === a.total);

  // Las cinco piezas que sostienen el módulo entero.
  const tiene = (id) => a.resultados.find((r) => r.id === id)?.ok;
  comprobar('Están las recurrencias (el horario es una regla, HT F1)', tiene('recurrencias'));
  comprobar('Está el estado temporal y la diferencia pasado/completado (HT F8)',
    tiene('estado_temporal') && tiene('pasado') && tiene('completado'));
  comprobar('Está la mochila derivada (HT F7)', tiene('mochila'));
  comprobar('Está el planificador y la IA (HT F9)', tiene('planificador') && tiene('ia'));
  comprobar('Y la analítica (HT F11)', tiene('analitica'));

  comprobar('⚠️ CLAVE · La seguridad se comprueba de verdad: NO hay `user_id` que falsear',
    tiene('seguridad'));

  comprobar('⚠️ CLAVE · Lo que NO se puede comprobar aquí se dice, no se da por bueno',
    NO_COMPROBABLE_AQUI.length >= 5 && a.noComprobable.length >= 5);
  comprobar('CLAVE · ...incluidos el responsive, el modo oscuro y la accesibilidad real',
    NO_COMPROBABLE_AQUI.join(' ').includes('Responsive')
    && NO_COMPROBABLE_AQUI.join(' ').includes('Accesibilidad'));
}

/* ===========================================================================
   LA PUERTA ÚNICA
   =========================================================================== */
console.log('\n═══ Una sola puerta (apartados 90 y 91) ═══\n');
{
  const { estado } = montar();

  const d = diaCompleto(estado, HOY, { hoy: HOY });
  comprobar('CRITERIO · Una llamada da el día entero', !!d.contexto && !!d.tablon && !!d.mochila);
  comprobar('CLAVE · ...con las automatizaciones y los avisos', Array.isArray(d.automatizaciones) && !!d.avisos);
  comprobar('Un estado vacío no revienta', diaCompleto(DEFAULT_HORARIO_TOP, HOY, { hoy: HOY }).tablon.total === 0);

  const r = resumenModulo(estado, { hoy: HOY });
  comprobar('CRITERIO · Hay un resumen del módulo entero', r.horarios === 1 && r.actividades.total === 2);
  comprobar('...con la semana, la mochila y los avisos', !!r.semana && !!r.mochila && !!r.avisos);

  const ia = contextoCompletoIA(estado, { fecha: HOY, hoy: HOY });
  comprobar('CRITERIO · Y el contexto para la IA, junto', !!ia.hoy && !!ia.planificacion);
  comprobar('⚠️ CLAVE · Sin notas privadas ni nada de Relación',
    !/notas|relacion|pareja/i.test(JSON.stringify(ia)));
}

/* ===========================================================================
   EXPORTAR E IMPORTAR
   =========================================================================== */
console.log('\n═══ Exportar e importar (apartados 82 y 83) ═══\n');
{
  const { estado } = montar();
  const conHistoria = marcarCompletada(estado, { bloqueId: estado.bloques[0].id }, HOY);

  const paquete = exportarHorario(conHistoria, { nombre: 'Curso 26/27' });
  comprobar('CRITERIO · Se exporta', paquete.modulo === 'horarioTop' && paquete.version === VERSION_EXPORTACION);
  comprobar('CLAVE · Con nombre y fecha', paquete.nombre === 'Curso 26/27' && !!paquete.exportadoEn);
  comprobar('Lleva los horarios, actividades y bloques', paquete.datos.horarios.length === 1 && paquete.datos.bloques.length === 2);

  comprobar('⚠️ CLAVE · NO se lleva lo que confirmaste que hiciste: es de este curso',
    !('completadas' in paquete.datos));
  comprobar('CLAVE · Ni los avisos ya dados, ni lo que metiste en la mochila cada día',
    !('avisos' in paquete.datos) && !('mochila' in paquete.datos));
  comprobar('CLAVE · Y está escrito POR QUÉ, para que nadie lo añada sin pensar',
    Object.keys(NO_SE_EXPORTA).length === 4);

  const rev = revisarImportacion(paquete);
  comprobar('CRITERIO · Se revisa ANTES de escribir', rev.valido === true);
  comprobar('CLAVE · ...diciendo cuánto traería', rev.total > 0 && rev.cuenta.bloques === 2);
  comprobar('⚠️ CLAVE · ...y qué NO va a traer, para que no falte por sorpresa', rev.noTrae.length === 4);

  comprobar('Un archivo de otro módulo se rechaza', revisarImportacion({ modulo: 'armario', datos: {} }).valido === false);
  comprobar('Basura se rechaza', revisarImportacion('hola').valido === false);
  comprobar('⚠️ CLAVE · Un archivo de una versión MÁS NUEVA se rechaza, no se intenta adivinar',
    revisarImportacion({ ...paquete, version: 99 }).valido === false);
  comprobar('Uno vacío se rechaza', revisarImportacion({ modulo: 'horarioTop', version: 1, datos: {} }).valido === false);

  const imp = importarHorario(DEFAULT_HORARIO_TOP, paquete);
  comprobar('CRITERIO · Se importa', imp.estado.bloques.length === 2 && imp.error === null);

  // ⚠️ La propiedad que evita el desastre.
  const dosVeces = importarHorario(imp.estado, paquete);
  comprobar('⚠️ CLAVE · Importar DOS VECES el mismo archivo NO duplica el curso',
    dosVeces.estado.bloques.length === 2);
  comprobar('CLAVE · ...ni las actividades', dosVeces.estado.actividades.length === imp.estado.actividades.length);

  const sustituido = importarHorario(conHistoria, paquete, { modo: 'sustituir' });
  comprobar('CRITERIO · Se puede sustituir el horario entero', sustituido.estado.horarios.length === 1);
  comprobar('⚠️ CLAVE · ...pero lo que confirmaste NO se borra: sigue siendo de este dispositivo',
    sustituido.estado.completadas.length === 1);

  comprobar('Importar basura no toca el estado', importarHorario(estado, null).estado.bloques.length === 2);
  comprobar('Las colecciones exportables están declaradas', COLECCIONES_EXPORTABLES.length >= 13);
}

/* ===========================================================================
   EL ESTADO DEL MÓDULO
   =========================================================================== */
console.log('\n═══ El estado del módulo ═══\n');
{
  const { estado } = montar();
  const e = estadoDelModulo(estado, { hoy: HOY });

  comprobar('Se sabe cuánto hay montado', e.horarios === 1 && e.bloques === 2);
  comprobar('⚠️ CLAVE · NI UNA TABLA PROPIA (la decisión de HT F2, al cerrar el módulo)',
    e.tablasPropias === 0);
  comprobar('⚠️ CLAVE · NI UN SQL PENDIENTE que Josué tenga que ejecutar', e.sqlPendiente === 0);
  comprobar('CLAVE · Y se dice dónde vive', e.donde.includes('app_data'));
  comprobar('El módulo se declara completo', e.completo === true);
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí, y se dice en la propia auditoría: el responsive, el');
console.log('     modo oscuro, la accesibilidad real, los backups de Supabase y las Edge');
console.log('     Functions. Son del navegador, de la consola o de infraestructura que el');
console.log('     proyecto no tiene (mismo límite que R1).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
