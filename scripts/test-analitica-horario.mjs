// ============================================================================
// HT · Fase 11/12 — Pruebas de la analítica personal
//
// La especificación de esta fase son veintitrés puntos, y uno de ellos dice
// cómo hay que construir el resto: *"un sistema de aprendizaje que mejore las
// sugerencias **sin convertirlo en una caja negra**"*.
//
// Así que lo que más se comprueba es:
//   1. **Ningún número sin su origen.**
//   2. **Sin datos no se inventa una tendencia** — ni un 0 % que parezca un
//      suspenso.
//   3. **Describe, no juzga**: se recorre TODO lo que genera el archivo
//      buscando reproches.
// ============================================================================

import {
  MINIMO_DIAS, MINIMO_OCURRENCIAS, cumplimiento, analisisDeSemana,
  estadisticasTareas, estadisticasDeMochila, TIPOS_PATRON, patrones,
  tendencia, informe, recomendaciones, PALABRAS_PROHIBIDAS, contieneReproche,
} from '../src/lib/analiticaHorario.js';
import { DEFAULT_HORARIO_TOP } from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';
import { marcarCompletada, claveEvento } from '../src/lib/automatizaciones.js';
import { crearMaterial, crearEnlaceMaterial } from '../src/lib/horarioDatos.js';
import { addDays } from '../src/lib/helpers.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-24';        // lunes

/** Cuatro semanas de instituto con clase todos los días. */
function montar() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (d) => horario.columnas.find((c) => c.dia === d);
  let e = estado;
  for (const dia of [1, 2, 3, 4, 5]) {
    e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(dia).id, inicio: '08:00', fin: '09:00', texto: 'Matemáticas', hoy: HOY }).estado;
    e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(dia).id, inicio: '16:00', fin: '17:00', texto: 'Estudio', hoy: HOY }).estado;
  }
  return { estado: e, horario, col };
}

/** Confirma todas las clases de la mañana de los últimos `n` días. */
function confirmarMananas(estado, desde, n) {
  let e = estado;
  for (let i = 0; i < n; i++) {
    const f = addDays(desde, i);
    const bloqueManana = e.bloques.find((b) => b.inicio === '08:00');
    if (bloqueManana) e = marcarCompletada(e, { bloqueId: bloqueManana.id }, f);
  }
  return e;
}

/* ===========================================================================
   NINGÚN NÚMERO SIN SU ORIGEN
   =========================================================================== */
console.log('\n═══ Ningún número sin su origen ═══\n');
{
  const { estado } = montar();
  const desde = addDays(HOY, -13);

  const c = cumplimiento(estado, { desde, dias: 14, hasta: HOY });
  comprobar('Se cuenta lo planificado', c.planificadas > 0);
  comprobar('⚠️ CLAVE · Cada cifra dice DE DÓNDE SALE (no es una caja negra)', c.origen.length > 10);
  // El origen siempre lleva un número: cuántos días la sostienen, o cuántas
  // actividades hay sin confirmar todavía. Nunca una frase sin cifras.
  comprobar('CLAVE · ...diciendo cuántos datos la sostienen', /\d+/.test(c.origen), c.origen);

  comprobar('⚠️ CLAVE · Solo cuentan los días YA PASADOS, no el futuro',
    cumplimiento(estado, { desde: HOY, dias: 14, hasta: HOY }).porDia.length === 1);

  const conConfirmadas = confirmarMananas(estado, desde, 10);
  const c2 = cumplimiento(conConfirmadas, { desde, dias: 14, hasta: HOY });
  comprobar('Se cuenta lo confirmado', c2.hechas > 0);
  comprobar('Y los minutos de cada cosa', c2.minutosPlan > 0 && c2.minutosHechos > 0);
  comprobar('El porcentaje sale de los dos', c2.porcentaje === Math.round((c2.hechas / c2.planificadas) * 100));
}

/* ===========================================================================
   SIN DATOS NO SE INVENTA NADA
   =========================================================================== */
console.log('\n═══ Sin datos no se inventa nada ═══\n');
{
  const { estado } = montar();
  comprobar('Hay un mínimo declarado', MINIMO_DIAS === 7 && MINIMO_OCURRENCIAS === 3);

  const vacio = cumplimiento(DEFAULT_HORARIO_TOP, { desde: addDays(HOY, -13), dias: 14, hasta: HOY });
  comprobar('⚠️ CLAVE · Sin nada planificado NO se da un porcentaje', vacio.porcentaje === null);
  comprobar('CLAVE · ...y se dice que no hay datos, en vez de un 0 % que parece un suspenso',
    vacio.suficientesDatos === false);

  const unDia = cumplimiento(estado, { desde: HOY, dias: 1, hasta: HOY });
  comprobar('⚠️ CLAVE · Con UN día tampoco hay bastante', unDia.suficientesDatos === false);

  comprobar('⚠️ CLAVE · Las tareas también: sin ninguna, no hay porcentaje',
    estadisticasTareas({ hoy: HOY }).porcentaje === null);
  comprobar('CLAVE · Y la mochila igual',
    estadisticasDeMochila(DEFAULT_HORARIO_TOP, { hasta: HOY }).suficientesDatos === false);

  const t = tendencia(estado, { hasta: HOY, dias: 7 });
  comprobar('⚠️ CRITERIO · Sin dos periodos con datos NO hay tendencia', t.suficientesDatos === false);
  comprobar('CLAVE · ...y se dice con esas palabras', /todavía no/i.test(t.texto));
  comprobar('CLAVE · La dirección es "sin_datos", no "baja"', t.direccion === 'sin_datos');
}

/* ===========================================================================
   PATRONES: LO QUE EL SISTEMA APRENDE
   =========================================================================== */
console.log('\n═══ Patrones, que se pueden leer en una frase ═══\n');
{
  const { estado } = montar();
  const desde = addDays(HOY, -27);
  // Cuatro semanas confirmando solo las mañanas: el patrón de la tarde debería
  // salir, y el de la mañana también pero al revés.
  let e = estado;
  for (let i = 0; i < 28; i++) {
    const f = addDays(desde, i);
    const manana = e.bloques.find((b) => b.inicio === '08:00');
    if (manana) e = marcarCompletada(e, { bloqueId: manana.id }, f);
  }

  const p = patrones(e, { desde, dias: 28, hasta: HOY });
  comprobar('Se detectan patrones', p.length > 0);
  comprobar('⚠️ CLAVE · Cada patrón es UNA FRASE que se puede leer', p.every((x) => x.texto.length > 10));
  comprobar('⚠️ CLAVE · ...con los NÚMEROS que la sostienen dentro', p.every((x) => /\d+ de \d+/.test(x.texto)));
  comprobar('CLAVE · Y nunca por debajo del mínimo de ocurrencias',
    p.every((x) => x.total >= MINIMO_OCURRENCIAS));
  comprobar('CRITERIO · Se detecta una franja floja', p.some((x) => x.tipo === 'hora_floja'));

  comprobar('⚠️ CLAVE · Con pocos días NO se afirma ningún patrón',
    patrones(estado, { desde: addDays(HOY, -2), dias: 3, hasta: HOY }).length === 0);
  comprobar('Un estado vacío no da patrones', patrones(DEFAULT_HORARIO_TOP, { desde, dias: 28, hasta: HOY }).length === 0);
  comprobar('Hay cuatro tipos declarados', TIPOS_PATRON.length === 4);
}

/* ===========================================================================
   SEMANA, TAREAS Y MOCHILA
   =========================================================================== */
console.log('\n═══ Semana, tareas y mochila ═══\n');
{
  const { estado } = montar();

  const sem = analisisDeSemana(estado, { desde: HOY, dias: 7, hoy: HOY });
  comprobar('Se analiza la semana', sem.dias.length === 7);
  comprobar('...con el total de actividades', sem.actividades === 10);
  comprobar('CRITERIO · Se sabe el día más cargado y el más libre', !!sem.masCargado && !!sem.masLibre);
  comprobar('⚠️ CLAVE · La media es de los días OCUPADOS: incluir los domingos vacíos la hunde',
    sem.mediaPorDiaOcupado > 0 && sem.diasLibres === 2);

  const tar = estadisticasTareas({
    productividad: { tareas: [
      { id: '1', texto: 'A', fecha: addDays(HOY, -2), hecha: true },
      { id: '2', texto: 'B', fecha: addDays(HOY, -1), hecha: true },
      { id: '3', texto: 'C', fecha: addDays(HOY, -3), hecha: false },
      { id: '4', texto: 'Sin fecha', hecha: false },
    ] },
    hoy: HOY,
  });
  comprobar('Se cuentan las tareas hechas', tar.hechas === 2);
  comprobar('...y las vencidas', tar.vencidas === 1);
  comprobar('CLAVE · Las que no tienen fecha se cuentan aparte, no como vencidas', tar.sinFecha === 1);
  comprobar('El porcentaje sale de las que tienen fecha', tar.porcentaje === 67);

  // Mochila: una asignatura con material obligatorio, nunca preparado.
  const bata = crearMaterial({ nombre: 'Bata', tipo: 'ropa', hoy: HOY });
  const act = estado.actividades[0];
  const conMochila = {
    ...estado,
    materiales: [bata],
    enlacesMaterial: [crearEnlaceMaterial({ actividadId: act.id, materialId: bata.id, obligatorio: true })],
  };
  const moc = estadisticasDeMochila(conMochila, { hasta: HOY, dias: 14 });
  comprobar('Se cuentan los días con mochila', moc.dias > 0);
  comprobar('CLAVE · ...y los que salieron incompletos, con la fecha', moc.flojos.length > 0 && !!moc.flojos[0].fecha);
  comprobar('CLAVE · Los días sin mochila no cuentan: un domingo no es un olvido', moc.dias < 14);
}

/* ===========================================================================
   EL INFORME Y LAS RECOMENDACIONES
   =========================================================================== */
console.log('\n═══ El informe y las recomendaciones ═══\n');
{
  const { estado } = montar();
  const inf = informe(estado, { hoy: HOY, dias: 14 });

  comprobar('Existe el informe', !!inf.cumplimiento && !!inf.semana && !!inf.tareas);
  comprobar('CLAVE · Con el periodo que cubre', inf.hasta === HOY && inf.desde < HOY);
  comprobar('⚠️ CLAVE · Sin datos, el resumen LO DICE en vez de rellenar con ceros',
    /no hay bastantes datos/i.test(informe(DEFAULT_HORARIO_TOP, { hoy: HOY }).resumen));
  comprobar('CLAVE · Con datos, el resumen trae los números', /actividades/.test(inf.resumen));

  const recs = recomendaciones(inf);
  comprobar('Las recomendaciones existen', Array.isArray(recs));
  comprobar('⚠️ CLAVE · Cada una trae SU MOTIVO medido, no una corazonada',
    recs.every((r) => r.motivo.length > 10 && r.sugerencia.length > 10));
  comprobar('Sin informe no hay recomendaciones', recomendaciones(null).length === 0);
}

/* ===========================================================================
   ⚠️ DESCRIBE, NO JUZGA — la prueba que recorre TODO
   =========================================================================== */
console.log('\n═══ Describe, no juzga ═══\n');
{
  const { estado } = montar();
  const desde = addDays(HOY, -27);
  // El peor escenario posible: cuatro semanas de clases y NADA confirmado.
  // Es justo donde una app mal hecha diría "has fallado 40 veces".
  const inf = informe(estado, { hoy: HOY, dias: 14 });
  const pats = patrones(estado, { desde, dias: 28, hasta: HOY });
  const recs = recomendaciones(inf);

  const textos = [
    inf.resumen,
    inf.cumplimiento.origen,
    inf.tareas.origen,
    inf.mochila.origen,
    inf.tendencia.texto,
    ...pats.map((p) => p.texto),
    ...recs.map((r) => `${r.motivo} ${r.sugerencia}`),
  ];

  comprobar('Hay una lista declarada de palabras prohibidas', PALABRAS_PROHIBIDAS.length >= 10);
  comprobar('El detector funciona', contieneReproche('has fallado') === true && contieneReproche('todo normal') === false);
  comprobar('CLAVE · "normal" y "material" no cuentan como reproche',
    contieneReproche('carga normal con material') === false);

  const malos = textos.filter(contieneReproche);
  comprobar('⚠️ CLAVE · NINGÚN texto del informe riñe, ni con cero cumplimiento',
    malos.length === 0, malos.join(' | '));
  comprobar('⚠️ CLAVE · Ni los patrones', pats.filter((p) => contieneReproche(p.texto)).length === 0);
  comprobar('⚠️ CLAVE · Ni las recomendaciones', recs.filter((r) => contieneReproche(r.sugerencia)).length === 0);
  comprobar('⚠️ CLAVE · Y sin puntos, niveles ni rachas (D2-02)',
    !/\bpunto|nivel|racha|xp\b/i.test(JSON.stringify(inf)));
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí: la pantalla del informe y las gráficas. Son del');
console.log('     navegador real (mismo límite que R1).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
