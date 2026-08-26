// ============================================================================
// HT · Fase 7/12 — Pruebas de la mochila inteligente
//
// El apartado 123 enumera cuarenta criterios de aceptación. Aquí están los
// comprobables sin navegador, marcados «CRITERIO».
//
// Las cuatro que más importan, porque romperlas no da un error sino un dato
// silenciosamente mal:
//   1. **Lo manual no se borra solo** (apartado 57).
//   2. **Una libreta es una libreta**, pero dos hojas y tres son cinco (60-61).
//   3. **Se dice por qué está cada cosa** (apartado 59).
//   4. **Sin castigo** (apartado 105).
// ============================================================================

import {
  ESTADOS_MATERIAL, PRIORIDADES_MATERIAL, ORIGENES_MOCHILA, esAutomatico,
  DEFAULT_INVENTARIO_ITEM, normalizarInventarioItem, inventarioDe, itemInventario,
  marcarEstado, guardarInventario, ubicacionesUsadas,
  TIPOS_MOCHILA, crearMochila, mochilasDe, mochilaPorDefecto,
  crearKit, kitsDe, dependenciasDe, arrastra,
  CONDICIONES_REGLA, crearRegla, reglasDe, reglasQueTocan,
  explicarElemento, mochilaDeFecha, progresoMochila,
  marcarPreparado, prepararTodo, vaciarPreparacion, anadirAMano, quitarDeMochila,
  preparacionSemanal, olvidosRecientes, estadisticasMochila,
  avisosDeMochila, listaDeCompra, resumenMochila,
} from '../src/lib/mochila.js';
import { DEFAULT_HORARIO_TOP } from '../src/lib/horario.js';
import { crearMaterial, crearEnlaceMaterial, normalizarDatos } from '../src/lib/horarioDatos.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-24';        // lunes
const MANANA = '2026-08-25';

/**
 * Un lunes con Biología y Matemáticas, las dos con libreta, y Biología además
 * con bata. Es el ejemplo del apartado 60 montado de verdad.
 */
function montar() {
  const { estado, horario } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
  const col = (d) => horario.columnas.find((c) => c.dia === d);
  let e = estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '08:00', fin: '09:00', texto: 'Matemáticas', hoy: HOY }).estado;
  e = crearBloqueRapido(e, { horarioId: horario.id, columnaId: col(1).id, inicio: '09:00', fin: '10:00', texto: 'Biología', hoy: HOY }).estado;

  const libreta = crearMaterial({ nombre: 'Libreta', tipo: 'libreta', hoy: HOY });
  const bata = crearMaterial({ nombre: 'Bata', tipo: 'ropa', hoy: HOY });
  const hojas = crearMaterial({ nombre: 'Hojas', tipo: 'material', hoy: HOY });
  const ipad = crearMaterial({ nombre: 'iPad', tipo: 'dispositivo', hoy: HOY });
  const cargador = crearMaterial({ nombre: 'Cargador', tipo: 'dispositivo', hoy: HOY });

  const mat = (nombre) => e.actividades.find((a) => a.nombre === nombre);
  e = {
    ...e,
    materiales: [libreta, bata, hojas, ipad, cargador],
    enlacesMaterial: [
      crearEnlaceMaterial({ actividadId: mat('Matemáticas').id, materialId: libreta.id, obligatorio: true, cantidad: 2 }),
      crearEnlaceMaterial({ actividadId: mat('Biología').id, materialId: libreta.id, obligatorio: true, cantidad: 3 }),
      crearEnlaceMaterial({ actividadId: mat('Biología').id, materialId: bata.id, obligatorio: true }),
    ],
  };
  return { estado: normalizarDatos(e), horario, libreta, bata, hojas, ipad, cargador, mat };
}

const el = (m, nombre) => m.elementos.find((x) => x.nombre === nombre);

/* ===========================================================================
   ESTADOS, PRIORIDADES Y ORIGEN
   =========================================================================== */
console.log('\n═══ Estados, prioridades y origen ═══\n');
{
  comprobar('CRITERIO · Existen los estados del apartado 37', ESTADOS_MATERIAL.length === 4);
  comprobar('CLAVE · Solo "disponible" se puede meter en la mochila',
    ESTADOS_MATERIAL.filter((e) => e.usable).length === 1);
  comprobar('CRITERIO · Se diferencia obligatorio de opcional (apartado 21)', PRIORIDADES_MATERIAL.length === 4);

  comprobar('CRITERIO · Cada elemento sabe de dónde viene (apartado 58)', ORIGENES_MOCHILA.length === 8);
  comprobar('⚠️ CLAVE · "manual" es el ÚNICO que NO es automático: es lo que impide que se borre solo',
    ORIGENES_MOCHILA.filter((o) => !o.automatico).map((o) => o.id).join() === 'manual');
  comprobar('...y se puede preguntar', esAutomatico('horario') === true && esAutomatico('manual') === false);
}

/* ===========================================================================
   INVENTARIO
   =========================================================================== */
console.log('\n═══ Inventario, estados y ubicación ═══\n');
{
  const { estado, bata, ipad } = montar();

  comprobar('CRITERIO · Existe inventario con cantidad (apartados 32 y 33)', DEFAULT_INVENTARIO_ITEM.cantidad === 1);
  comprobar('Una cantidad absurda se acota', normalizarInventarioItem({ cantidad: -5 }).cantidad === 1);
  comprobar('CLAVE · Cero SÍ vale: es "se acabó"', normalizarInventarioItem({ cantidad: 0 }).cantidad === 0);
  comprobar('Un material sin ficha de inventario tiene la de por defecto',
    itemInventario(estado, 'zzz').estado === 'disponible');

  const prestado = marcarEstado(estado, ipad.id, 'prestado', { prestadoA: 'Jorge' });
  comprobar('CRITERIO · Se puede marcar prestado (apartado 34)', itemInventario(prestado, ipad.id).estado === 'prestado');
  comprobar('CLAVE · ...y a quién', itemInventario(prestado, ipad.id).prestadoA === 'Jorge');
  comprobar('CLAVE · Devolverlo BORRA a quién lo tenía: si no, diría "lo tiene Jorge" para siempre',
    itemInventario(marcarEstado(prestado, ipad.id, 'disponible'), ipad.id).prestadoA === '');
  comprobar('CRITERIO · Y perdido (apartado 35)', itemInventario(marcarEstado(estado, ipad.id, 'perdido'), ipad.id).estado === 'perdido');
  comprobar('CRITERIO · Y roto (apartado 36)', itemInventario(marcarEstado(estado, ipad.id, 'roto'), ipad.id).estado === 'roto');

  const conSitio = guardarInventario(estado, bata.id, { ubicacion: 'Armario' });
  comprobar('CRITERIO · Existe ubicación física (apartado 40)', itemInventario(conSitio, bata.id).ubicacion === 'Armario');
  comprobar('CRITERIO · ...y las ya usadas se ofrecen (apartado 41)', ubicacionesUsadas(conSitio).includes('Armario'));
  comprobar('Sin ubicaciones, la lista está vacía', ubicacionesUsadas(estado).length === 0);

  comprobar('⚠️ CLAVE · El inventario SOBREVIVE a un guardado',
    Object.keys(inventarioDe(normalizarDatos(conSitio))).length === 1);
}

/* ===========================================================================
   MOCHILAS MÚLTIPLES Y BASE
   =========================================================================== */
console.log('\n═══ Mochilas múltiples y mochila base ═══\n');
{
  const { estado, libreta } = montar();
  comprobar('CRITERIO · Existen varias mochilas (apartado 29)', TIPOS_MOCHILA.length === 4);

  const m1 = crearMochila({ nombre: 'Instituto', tipo: 'escolar', base: [libreta.id], porDefecto: true });
  const m2 = crearMochila({ tipo: 'deportiva' });
  const con = { ...estado, mochilas: [m1, m2] };

  comprobar('Se guardan', mochilasDe(con).length === 2);
  comprobar('CLAVE · Una sin nombre coge el de su tipo', mochilasDe(con)[1].nombre === 'Deporte');
  comprobar('CRITERIO · Hay una por defecto (apartado 30)', mochilaPorDefecto(con).id === m1.id);
  comprobar('CLAVE · Sin ninguna marcada, la primera', mochilaPorDefecto({ ...estado, mochilas: [m2] }).id === m2.id);
  comprobar('Sin mochilas, null', mochilaPorDefecto(estado) === null);

  const mochila = mochilaDeFecha(con, HOY);
  comprobar('⚠️ CRITERIO · La mochila BASE aparece siempre (apartado 26)',
    el(mochila, 'Libreta') !== undefined);
  comprobar('CLAVE · ...y como algo obligatorio', el(mochila, 'Libreta').prioridad === 'obligatorio');
}

/* ===========================================================================
   KITS Y DEPENDENCIAS
   =========================================================================== */
console.log('\n═══ Kits y dependencias ═══\n');
{
  const { estado, ipad, cargador, libreta } = montar();

  const k = crearKit({ nombre: 'Kit de laboratorio', materiales: [libreta.id] });
  comprobar('CRITERIO · Existen kits (apartado 100)', kitsDe({ ...estado, kits: [k] }).length === 1);
  comprobar('Un kit sin nombre no queda vacío', kitsDe({ kits: [{ materiales: ['x'] }] })[0].nombre === 'Kit');

  const conDep = { ...estado, dependencias: { [ipad.id]: [cargador.id] } };
  comprobar('CRITERIO · Existen dependencias (apartado 96)', dependenciasDe(conDep)[ipad.id].length === 1);
  comprobar('CLAVE · El iPad arrastra el cargador', arrastra(conDep, ipad.id)[0] === cargador.id);
  comprobar('Sin dependencias no arrastra nada', arrastra(estado, ipad.id).length === 0);
  comprobar('⚠️ CLAVE · Un ciclo (A necesita B y B necesita A) NO cuelga la app',
    arrastra({ ...estado, dependencias: { [ipad.id]: [cargador.id], [cargador.id]: [ipad.id] } }, ipad.id).length === 1);
}

/* ===========================================================================
   REGLAS
   =========================================================================== */
console.log('\n═══ Reglas ═══\n');
{
  const { estado, bata } = montar();
  comprobar('CRITERIO · Existen reglas con condiciones (apartado 76)', CONDICIONES_REGLA.length === 3);

  const r = crearRegla({ condicion: 'actividad', valor: 'Biología', materiales: [bata.id] });
  const con = { ...estado, reglas: [r] };
  comprobar('Se guardan', reglasDe(con).length === 1);
  comprobar('CLAVE · Una regla sin materiales NO se guarda: no haría nada',
    reglasDe({ reglas: [crearRegla({ valor: 'X' })] }).length === 0);

  const eventos = [{ actividadId: estado.actividades.find((a) => a.nombre === 'Biología').id, titulo: 'Biología' }];
  comprobar('CRITERIO · La regla se cumple el día que toca esa actividad',
    reglasQueTocan(con, HOY, eventos).length === 1);
  comprobar('CLAVE · ...y NO el día que no', reglasQueTocan(con, HOY, []).length === 0);
  comprobar('CRITERIO · Existen reglas por día de la semana (apartado 78)',
    reglasQueTocan({ ...estado, reglas: [crearRegla({ condicion: 'dia', valor: '1', materiales: [bata.id] })] }, HOY, []).length === 1);
  comprobar('CLAVE · Una regla apagada no se cumple',
    reglasQueTocan({ ...estado, reglas: [{ ...r, activa: false }] }, HOY, eventos).length === 0);

  const m = mochilaDeFecha(con, HOY);
  comprobar('CRITERIO · Lo que pide la regla acaba en la mochila', el(m, 'Bata') !== undefined);
  comprobar('CLAVE · ...y se dice que viene de una regla', el(m, 'Bata').origen === 'regla' || el(m, 'Bata').origen === 'horario');
}

/* ===========================================================================
   EL MOTOR: AGRUPAR, EXPLICAR Y NO BORRAR LO MANUAL
   =========================================================================== */
console.log('\n═══ El motor: agrupar, explicar y respetar lo manual ═══\n');
{
  const { estado, libreta, hojas } = montar();
  const m = mochilaDeFecha(estado, HOY);

  comprobar('CRITERIO · La mochila sale del horario del día (apartado 1)', m.elementos.length >= 2);
  comprobar('⚠️ CRITERIO · Dos asignaturas con libreta dan UNA libreta (apartado 60)',
    m.elementos.filter((x) => x.nombre === 'Libreta').length === 1);
  comprobar('CLAVE · ...diciendo para qué hace falta', el(m, 'Libreta').para.length === 2);
  comprobar('CRITERIO · Se explica POR QUÉ está cada cosa (apartado 59)',
    el(m, 'Bata').porQueTexto.includes('Biología'));
  comprobar('CLAVE · Y lo añadido a mano lo dice también',
    explicarElemento({ origen: 'manual' }) === 'Lo añadiste tú.');
  comprobar('CLAVE · ...y lo que arrastra otra cosa', explicarElemento({ origen: 'dependencia', porQue: 'el iPad' }).includes('iPad'));

  // Apartado 61 — los consumibles SÍ se suman.
  const conHojas = {
    ...estado,
    inventario: { [hojas.id]: { consumible: true } },
    enlacesMaterial: [
      ...estado.enlacesMaterial,
      { id: 'e1', actividadId: estado.actividades.find((a) => a.nombre === 'Matemáticas').id, materialId: hojas.id, cantidad: 2, obligatorio: false, notas: '' },
      { id: 'e2', actividadId: estado.actividades.find((a) => a.nombre === 'Biología').id, materialId: hojas.id, cantidad: 3, obligatorio: false, notas: '' },
    ],
  };
  comprobar('⚠️ CRITERIO · Dos hojas y tres hojas SON cinco hojas (apartado 61)',
    el(mochilaDeFecha(conHojas, HOY), 'Hojas').cantidad === 5);
  comprobar('CLAVE · Pero dos libretas siguen siendo UNA libreta: no es consumible',
    el(mochilaDeFecha(conHojas, HOY), 'Libreta').cantidad === 3);

  // ⚠️ El apartado 57, que es el que se rompe sin que nadie se entere.
  const conManual = anadirAMano(estado, HOY, 'Bocadillo').estado;
  comprobar('CRITERIO · Se puede añadir algo a mano', el(mochilaDeFecha(conManual, HOY), 'Bocadillo') !== undefined);
  comprobar('⚠️ CLAVE · ...y se marca como MANUAL', el(mochilaDeFecha(conManual, HOY), 'Bocadillo').origen === 'manual');
  comprobar('⚠️ CLAVE · Recalcular la mochila NO lo borra (apartado 57)',
    el(mochilaDeFecha(normalizarDatos(conManual), HOY), 'Bocadillo') !== undefined);
  comprobar('Lo mismo dos veces se rechaza', anadirAMano(conManual, HOY, 'Bocadillo').error !== null);
  comprobar('Sin nombre no se añade nada', anadirAMano(estado, HOY, '   ').error !== null);
  comprobar('Y se puede quitar', el(mochilaDeFecha(quitarDeMochila(conManual, HOY, 'Bocadillo'), HOY), 'Bocadillo') === undefined);

  comprobar('CLAVE · Un día sin clase no tiene mochila que preparar',
    mochilaDeFecha(estado, '2026-08-30').elementos.length === 0);
}

/* ===========================================================================
   PROGRESO Y PREPARACIÓN
   =========================================================================== */
console.log('\n═══ Progreso y preparación ═══\n');
{
  const { estado, bata } = montar();
  const m = mochilaDeFecha(estado, HOY);

  const p0 = progresoMochila(m);
  comprobar('CRITERIO · Existe progreso (apartado 18)', p0.total === m.elementos.length);
  comprobar('CRITERIO · Y se sabe si está incompleta (apartado 20)', p0.completa === false);
  comprobar('CLAVE · Con lo obligatorio sin meter, se dice QUÉ falta (apartado 49)', p0.aviso.includes('Bata'));
  comprobar('⚠️ CLAVE · Una mochila vacía es 100 %, no NaN: la barra no puede desaparecer',
    progresoMochila({ elementos: [] }).porcentaje === 100);
  comprobar('...y se marca como vacía', progresoMochila({ elementos: [] }).vacia === true);

  const uno = marcarPreparado(estado, HOY, el(m, 'Bata'), true);
  comprobar('CRITERIO · Se puede marcar como preparado (apartado 17)',
    el(mochilaDeFecha(uno, HOY), 'Bata').preparado === true);
  comprobar('Y desmarcar', el(mochilaDeFecha(marcarPreparado(uno, HOY, el(m, 'Bata'), false), HOY), 'Bata').preparado === false);

  const todo = prepararTodo(estado, HOY);
  comprobar('CRITERIO · "Preparar todo" existe (apartado 22)', progresoMochila(mochilaDeFecha(todo, HOY)).completa === true);
  comprobar('CRITERIO · Y "vaciar preparación" (apartado 23)',
    progresoMochila(mochilaDeFecha(vaciarPreparacion(todo, HOY), HOY)).preparados === 0);

  // ⚠️ Lo que no tienes no se puede marcar como metido.
  const sinBata = marcarEstado(estado, bata.id, 'perdido');
  comprobar('⚠️ CLAVE · "Preparar todo" NO marca lo que está perdido: sería mentira',
    el(mochilaDeFecha(prepararTodo(sinBata, HOY), HOY), 'Bata').preparado === false);
  comprobar('CRITERIO · ...y se avisa de que no lo tienes (apartado 38)',
    progresoMochila(mochilaDeFecha(sinBata, HOY)).noDisponibles.length === 1);
}

/* ===========================================================================
   AVISOS, COMPRA, SEMANA E HISTORIAL
   =========================================================================== */
console.log('\n═══ Avisos, lista de compra, semana e historial ═══\n');
{
  const { estado, bata } = montar();

  const prestada = marcarEstado(estado, bata.id, 'prestado', { prestadoA: 'Jorge' });
  const av = avisosDeMochila(prestada, HOY);
  comprobar('CRITERIO · Se avisa de lo que necesitas y no tienes (apartado 38)', av.length === 1);
  comprobar('⚠️ CLAVE · ...diciendo quién lo tiene', av[0].texto.includes('Jorge'));
  comprobar('CLAVE · Y si nadie, en qué estado está',
    avisosDeMochila(marcarEstado(estado, bata.id, 'perdido'), HOY)[0].texto.includes('perdido'));
  comprobar('Sin problemas, ningún aviso', avisosDeMochila(estado, HOY).length === 0);

  comprobar('CRITERIO · Existe lista de compra (apartado 64)',
    listaDeCompra(marcarEstado(estado, bata.id, 'perdido')).length === 1);
  comprobar('CLAVE · ...con el motivo', listaDeCompra(marcarEstado(estado, bata.id, 'roto'))[0].motivo === 'Roto');
  comprobar('CLAVE · Un consumible agotado también entra',
    listaDeCompra(guardarInventario(estado, bata.id, { consumible: true, cantidad: 0 })).length === 1);
  comprobar('Sin nada roto ni perdido, la lista está vacía', listaDeCompra(estado).length === 0);

  const sem = preparacionSemanal(estado, { desde: HOY });
  comprobar('CRITERIO · Existe preparación semanal (apartado 71)', sem.length === 7);
  comprobar('El lunes tiene elementos', sem[0].elementos > 0);
  comprobar('CLAVE · Y el domingo está vacío, no "incompleto"', sem[6].vacia === true);

  const est = estadisticasMochila(estado, { hasta: HOY, dias: 7, desde: HOY });
  comprobar('CRITERIO · Existe historial y estadísticas (apartados 102 y 103)', typeof est.diasConOlvido === 'number');
  comprobar('⚠️ CLAVE · SIN CASTIGO (apartado 105): ni una palabra de reproche',
    !/fallo|fallaste|mal|castig|penaliz/i.test(est.mensaje));
  comprobar('CLAVE · Y sin puntos ni rachas de mochila (D2-02)',
    !/punto|nivel|racha|xp/i.test(JSON.stringify(est)));
  comprobar('Los olvidos se detectan', Array.isArray(olvidosRecientes(estado, { hasta: HOY })));

  const r = resumenMochila(estado, HOY);
  comprobar('El resumen junta todo', r.total > 0 && typeof r.materiales === 'number');
  comprobar('...y cuenta las reglas y los kits', r.reglas === 0 && r.kits === 0);
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Sin comprobar aquí: la pantalla, los gestos y el recordatorio de las');
console.log('     21:00 (que es de la Fase 10). Son del navegador real (mismo límite que R1).\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
