// ---------------------------------------------------------------------------
// Entrega 2 · AR Fase 4 — pruebas del motor de inteligencia del armario.
//
// Aquí se comprueba lo que la interfaz NO puede demostrar: que los números son
// los correctos y que las recomendaciones se pueden explicar. Todo es puro, así
// que corre con Node sin montar React.
//
// La prueba que más importa es la del apartado 24, al final: es la que
// distingue "contar usos" de "contar bien". Un outfit usado tres veces son
// tres, no cinco; y una prenda que aparece en tres outfits acumula los usos de
// los tres, sin duplicarse ella.
// ---------------------------------------------------------------------------
import { crearPrenda, crearOutfit, crearUso } from '../src/lib/armario.js';
import {
  PERIODOS_ARMARIO, desdeDelPeriodo, usosDelPeriodo, USOS_MINIMOS_RECOMENDACION,
  hayDatosSuficientes, estadisticasOutfits, estadisticasPrendas, diversidadArmario,
  estadoRepeticion, repeticionDeOutfit, prendasMuyRepetidas, combinacionesRepetidas,
  outfitsOlvidados, prendasInfrautilizadas, recomendarOutfits, panelInteligente,
  resumenInteligencia, DIAS_USO_RECIENTE, DIAS_DESCANSADO,
} from '../src/lib/armarioInteligencia.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ AR Fase 4 — inteligencia del armario ═══\n');

const HOY = '2026-08-25';

/* ---------------------------------------------------------------------------
   Escenario base. Se construye una vez y lo usan casi todos los bloques.
   --------------------------------------------------------------------------- */
const vaquero = crearPrenda({ nombre: 'Vaquero gris', categoria: 'pantalones', color: 'gris' });
const camiseta = crearPrenda({ nombre: 'Camiseta blanca', categoria: 'camisetas', color: 'blanco' });
const jersey = crearPrenda({ nombre: 'Jersey azul', categoria: 'jerseis', color: 'azul' });
const nikes = crearPrenda({ nombre: 'Nike negras', categoria: 'calzado', color: 'negro' });
const bufanda = crearPrenda({ nombre: 'Bufanda', categoria: 'accesorios', color: 'rojo' });
const enLavadora = crearPrenda({ nombre: 'Sudadera gris', categoria: 'sudaderas', color: 'gris', estado: 'lavanderia' });

const casual = crearOutfit({ nombre: 'Casual Gris', prendaIds: [vaquero.id, camiseta.id, nikes.id], ocasion: 'casual', lugar: 'Instituto' });
const cena = crearOutfit({ nombre: 'Cena Negra', prendaIds: [vaquero.id, jersey.id], ocasion: 'cena', favorito: true });
const universidad = crearOutfit({ nombre: 'Universidad', prendaIds: [vaquero.id, camiseta.id], ocasion: 'casual', lugar: 'Universidad' });
const conLavadora = crearOutfit({ nombre: 'Con prenda sucia', prendaIds: [enLavadora.id, nikes.id] });

const PRENDAS = [vaquero, camiseta, jersey, nikes, bufanda, enLavadora];
const OUTFITS = [casual, cena, universidad, conLavadora];

// Exactamente los usos del apartado 24.
const USOS = [
  crearUso({ outfitId: casual.id, fecha: '2026-08-01', lugar: 'Instituto' }),
  crearUso({ outfitId: cena.id, fecha: '2026-08-05', lugar: 'Restaurante', personas: ['Jorge'] }),
  crearUso({ outfitId: casual.id, fecha: '2026-08-10', lugar: 'Instituto' }),
  crearUso({ outfitId: universidad.id, fecha: '2026-08-20', lugar: 'Universidad' }),
  crearUso({ outfitId: casual.id, fecha: '2026-08-22', lugar: 'Instituto' }),
];

/* --- Apartado 15: períodos ------------------------------------------------ */
{
  comprobar('Los 5 períodos del apartado 15', PERIODOS_ARMARIO.length === 5, String(PERIODOS_ARMARIO.length));
  comprobar('7 días cuenta hacia atrás desde hoy', desdeDelPeriodo('7', HOY) === '2026-08-18', desdeDelPeriodo('7', HOY));
  comprobar('30 días cruza el cambio de mes', desdeDelPeriodo('30', HOY) === '2026-07-26', desdeDelPeriodo('30', HOY));
  comprobar('90 días también', desdeDelPeriodo('90', HOY) === '2026-05-27', desdeDelPeriodo('90', HOY));
  // "Este año" NO es "hace 365 días": empieza el 1 de enero.
  comprobar('"Este año" empieza el 1 de enero', desdeDelPeriodo('ano', HOY) === '2026-01-01');
  comprobar('"Todo" no pone límite', desdeDelPeriodo('todo', HOY) === null);
  comprobar('Un período inventado no pone límite', desdeDelPeriodo('zzz', HOY) === null);
  comprobar('El personalizado usa la fecha que se le da', desdeDelPeriodo('personalizado', HOY, '2026-03-01') === '2026-03-01');
  comprobar('Recortar por período filtra de verdad', usosDelPeriodo(USOS, '2026-08-10').length === 3);
  comprobar('Sin desde ni hasta devuelve todo', usosDelPeriodo(USOS).length === 5);
  comprobar('Un rango cerrado funciona', usosDelPeriodo(USOS, '2026-08-05', '2026-08-20').length === 3);
}

/* --- Apartado 3: estadísticas de outfits ---------------------------------- */
{
  const e = estadisticasOutfits(USOS, OUTFITS, { hoyISO: HOY });
  comprobar('Cuenta los 4 outfits', e.total === 4);
  comprobar('3 de ellos se han usado', e.usados === 3, String(e.usados));
  comprobar('1 nunca se ha usado', e.nuncaUsados.length === 1 && e.nuncaUsados[0].nombre === 'Con prenda sucia');
  comprobar('El más usado es Casual Gris con 3', e.masUsado.outfit.nombre === 'Casual Gris' && e.masUsado.veces === 3);
  comprobar('El último usado es Casual Gris (22/08)', e.ultimoUsado.outfit.nombre === 'Casual Gris' && e.ultimoUsado.ultima === '2026-08-22');
  comprobar('...y lo dice en palabras', e.textoUltimo === 'Hace 3 días', String(e.textoUltimo));
  comprobar('El ranking va de más a menos', e.rankingMas[0].veces >= e.rankingMas[1].veces);
  // El "menos usado" NO puede ser uno sin estrenar: esos tienen su propia lista.
  comprobar('El menos usado se elige solo entre los usados', e.menosUsado.veces > 0);
  comprobar('...y nunca es uno de los que jamás se han usado',
    !e.nuncaUsados.some((o) => o.id === e.menosUsado.outfit.id));
  const vacio = estadisticasOutfits([], OUTFITS, { hoyISO: HOY });
  comprobar('Sin usos no inventa un "más usado"', vacio.masUsado === null && vacio.ultimoUsado === null);
  comprobar('...y los 4 outfits salen como nunca usados', vacio.nuncaUsados.length === 4);
  comprobar('Sin outfits tampoco revienta', estadisticasOutfits(USOS, [], { hoyISO: HOY }).total === 0);
}

/* --- Apartado 4: estadísticas de prendas ---------------------------------- */
{
  const e = estadisticasPrendas(USOS, OUTFITS, PRENDAS, { hoyISO: HOY });
  comprobar('Cuenta las 6 prendas', e.total === 6);
  // El ejemplo literal del apartado 4: el vaquero suma los usos de sus outfits.
  comprobar('El vaquero gris encabeza, con 5 usos', e.rankingMas[0].prenda.nombre === 'Vaquero gris' && e.rankingMas[0].veces === 5,
    `${e.rankingMas[0].prenda.nombre}/${e.rankingMas[0].veces}`);
  comprobar('La camiseta blanca acumula 4', e.rankingMas[1].veces === 4, String(e.rankingMas[1].veces));
  comprobar('La bufanda no está en ningún outfit: nunca usada',
    e.nuncaUsadas.some((p) => p.nombre === 'Bufanda'));
  comprobar('La prenda usada más recientemente es del 22/08', e.masReciente.ultima === '2026-08-22');
  comprobar('Las que llevan más tiempo sin usarse traen sus días', e.masTiempoSinUsar[0].dias >= 0);
  // Apartado 28 de la Fase 3, que sigue vigente: nunca "hace 0 días".
  comprobar('Las nunca usadas NO entran en "más tiempo sin usar"',
    !e.masTiempoSinUsar.some((x) => x.ultima === null));
  const vacio = estadisticasPrendas([], OUTFITS, PRENDAS, { hoyISO: HOY });
  comprobar('Sin usos, las 6 prendas salen como nunca usadas', vacio.nuncaUsadas.length === 6);
  comprobar('...y no hay "más reciente" inventada', vacio.masReciente === null);
}

/* --- Apartado 5: diversidad ----------------------------------------------- */
{
  // Disponibles: vaquero, camiseta, jersey, nikes, bufanda = 5 (la sudadera
  // está en la lavandería y no cuenta). Usadas: vaquero, camiseta, jersey,
  // nikes = 4. 4/5 = 80 %.
  const d = diversidadArmario(USOS, OUTFITS, PRENDAS);
  comprobar('La diversidad es 80 %', d.porcentaje === 80, String(d.porcentaje));
  comprobar('...con sus dos números crudos a la vista', d.usadas === 4 && d.base === 5);
  comprobar('La prenda en lavandería NO baja el porcentaje', d.base === 5);
  comprobar('Trae su explicación en texto', d.explicacion.includes('4 de tus 5'));
  comprobar('Sin usos, la diversidad es 0 %', diversidadArmario([], OUTFITS, PRENDAS).porcentaje === 0);
  // Sin prendas disponibles no hay fracción posible: null, no 0 ni 100.
  const sinNada = diversidadArmario(USOS, OUTFITS, [enLavadora]);
  comprobar('Sin prendas disponibles el porcentaje es null, no 0', sinNada.porcentaje === null);
  comprobar('...y lo explica', sinNada.explicacion.includes('Todavía no hay prendas'));
  // Desde el 21 solo queda el uso de Casual Gris del 22, que lleva 3 prendas.
  comprobar('El período recorta la diversidad',
    diversidadArmario(USOS, OUTFITS, PRENDAS, { desde: '2026-08-21' }).usadas === 3,
    String(diversidadArmario(USOS, OUTFITS, PRENDAS, { desde: '2026-08-21' }).usadas));
}

/* --- Apartado 6: anti-repetición ------------------------------------------ */
{
  comprobar('Sin usar nunca es un estado propio, no un cero', estadoRepeticion(null).id === 'nunca');
  comprobar('Hoy cuenta como usado hace poco', estadoRepeticion(0).id === 'reciente');
  comprobar(`${DIAS_USO_RECIENTE} días sigue siendo reciente`, estadoRepeticion(DIAS_USO_RECIENTE).id === 'reciente');
  comprobar('Al día siguiente ya no lo es', estadoRepeticion(DIAS_USO_RECIENTE + 1).id === 'medio');
  comprobar(`A los ${DIAS_DESCANSADO} días está descansado`, estadoRepeticion(DIAS_DESCANSADO).id === 'descansado');
  comprobar('14 días también', estadoRepeticion(14).id === 'descansado');

  const r = repeticionDeOutfit(USOS, casual, HOY);
  comprobar('Casual Gris tiene 3 usos y último el 22', r.veces === 3 && r.ultima === '2026-08-22');
  comprobar('...son 3 días, así que "usado hace poco"', r.dias === 3 && r.estado.id === 'reciente');
  const u = repeticionDeOutfit(USOS, universidad, HOY);
  comprobar('Universidad lleva 5 días: ni reciente ni descansado', u.dias === 5 && u.estado.id === 'medio');
  const sin = repeticionDeOutfit(USOS, conLavadora, HOY);
  comprobar('Un outfit sin estrenar lo dice, sin inventar días', sin.veces === 0 && sin.dias === null && sin.estado.id === 'nunca');
  comprobar('...y su texto es "Nunca utilizado"', sin.texto === 'Nunca utilizado');
}

/* --- Apartado 10: prendas muy repetidas ----------------------------------- */
{
  // En los últimos 14 días (desde el 11/08): universidad el 20 y casual el 22.
  // El vaquero está en los dos → 2 usos. Con minimo 2 debería salir.
  // El vaquero y la camiseta están los dos en Casual (22) y en Universidad (20),
  // así que empatan a 2 y el desempate es alfabético. Se comprueba el conjunto,
  // no cuál de los dos empatados sale primero.
  const r = prendasMuyRepetidas(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, minimo: 2 });
  const nombres = r.map((x) => x.prenda.nombre);
  comprobar('Detecta las prendas repetidas de la ventana',
    nombres.includes('Vaquero gris') && nombres.includes('Camiseta blanca'), nombres.join());
  comprobar('...con 2 usos cada una', r.every((x) => x.veces === 2));
  comprobar('...y lo dice como información, con su frase', r[0].texto.includes('2 veces en los últimos 14 días'));
  comprobar('Con el umbral por defecto (4) no salta por 2 usos',
    prendasMuyRepetidas(USOS, OUTFITS, PRENDAS, { hoyISO: HOY }).length === 0);
  comprobar('Una prenda usada hace 3 semanas no cuenta como repetida',
    !prendasMuyRepetidas(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, minimo: 1 }).some((x) => x.prenda.nombre === 'Jersey azul'));
}

/* --- Apartado 11: combinaciones repetidas --------------------------------- */
{
  const c = combinacionesRepetidas(USOS, OUTFITS, PRENDAS, { minimo: 3, hoyISO: HOY });
  comprobar('La combinación de Casual Gris sale con 3 usos', c.length === 1 && c[0].veces === 3, String(c.length));
  comprobar('...y trae sus prendas para poder pintarlas', c[0].prendas.length === 3);
  comprobar('Con umbral 5 no sale ninguna', combinacionesRepetidas(USOS, OUTFITS, PRENDAS, { minimo: 5 }).length === 0);

  // LO QUE HACE ÚTIL A ESTA FUNCIÓN: dos outfits distintos con la MISMA ropa
  // cuentan como una sola combinación. Es el caso de un outfit duplicado.
  const gemelo = crearOutfit({ nombre: 'Casual Gris (copia)', prendaIds: [nikes.id, camiseta.id, vaquero.id] });
  const conGemelo = [...USOS, crearUso({ outfitId: gemelo.id, fecha: '2026-08-23' }), crearUso({ outfitId: gemelo.id, fecha: '2026-08-24' })];
  const c2 = combinacionesRepetidas(conGemelo, [...OUTFITS, gemelo], PRENDAS, { minimo: 3 });
  comprobar('Dos outfits con la misma ropa son UNA combinación de 5 usos',
    c2.length === 1 && c2[0].veces === 5, `${c2.length} grupos / ${c2[0]?.veces} usos`);
  comprobar('...y la combinación sabe en qué dos outfits vive', c2[0].outfits.length === 2);
  // El orden en que se eligieron las prendas no puede crear grupos falsos.
  comprobar('El orden de las prendas no rompe la huella', c2[0].prendas.length === 3);
}

/* --- Apartados 12 y 13: olvidados e infrautilizadas ----------------------- */
{
  const o = outfitsOlvidados(USOS, OUTFITS, { hoyISO: HOY, dias: 15 });
  comprobar('Cena Negra lleva 20 días: está olvidado', o.length === 1 && o[0].outfit.nombre === 'Cena Negra', String(o.length));
  comprobar('...con sus días y su texto', o[0].dias === 20 && o[0].texto.length > 0);
  comprobar('Un outfit sin estrenar NO es "olvidado"',
    !o.some((x) => x.outfit.nombre === 'Con prenda sucia'));
  comprobar('Con el umbral por defecto (30 días) todavía no lo está',
    outfitsOlvidados(USOS, OUTFITS, { hoyISO: HOY }).length === 0);

  const p = prendasInfrautilizadas(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, dias: 15 });
  comprobar('La bufanda, nunca usada, va la primera', p[0].prenda.nombre === 'Bufanda' && p[0].veces === 0);
  comprobar('...y su motivo lo dice sin inventar fecha', p[0].motivo === 'Todavía no la has usado' && p[0].dias === null);
  comprobar('El jersey, usado hace 20 días, también aparece', p.some((x) => x.prenda.nombre === 'Jersey azul'));
  // Sugerir algo que está en la lavadora no es una sugerencia.
  comprobar('Una prenda en lavandería NUNCA se sugiere', !p.some((x) => x.prenda.nombre === 'Sudadera gris'));
}

/* --- Apartados 7, 8, 9 y 22: recomendación -------------------------------- */
{
  // Apartado 22: con pocos usos, no se finge inteligencia.
  const pocos = recomendarOutfits(USOS.slice(0, 2), OUTFITS, PRENDAS, { hoyISO: HOY });
  comprobar('Con 2 usos NO recomienda', pocos.suficiente === false && pocos.motivo === 'pocos_usos');
  comprobar('...y dice cuántos faltan', pocos.faltan === USOS_MINIMOS_RECOMENDACION - 2);
  comprobar('Sin outfits tampoco recomienda', recomendarOutfits(USOS, [], PRENDAS, { hoyISO: HOY }).motivo === 'sin_outfits');

  const r = recomendarOutfits(USOS, OUTFITS, PRENDAS, { hoyISO: HOY });
  comprobar('Con 5 usos ya recomienda', r.suficiente === true && r.recomendaciones.length === 3);
  // Cena Negra: 20 días sin usar, todo disponible. Casual Gris: usado hace 3.
  comprobar('Recomienda el que hace más tiempo que no usas', r.recomendaciones[0].outfit.nombre === 'Cena Negra',
    r.recomendaciones[0].outfit.nombre);
  comprobar('TODA recomendación viene con motivos en texto',
    r.recomendaciones.every((x) => Array.isArray(x.motivos) && x.motivos.length > 0));
  comprobar('...y el primero explica los días', r.recomendaciones[0].motivos.some((m) => m.includes('20 días')));
  comprobar('...y la disponibilidad', r.recomendaciones[0].motivos.some((m) => m.includes('disponibles')));
  // Apartado 9: el outfit con una prenda en la lavadora no puede ser el primero.
  comprobar('El outfit con una prenda no disponible NO es la primera opción',
    r.recomendaciones[0].outfit.nombre !== 'Con prenda sucia');
  const conSucia = recomendarOutfits(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, limite: 9 })
    .recomendaciones.find((x) => x.outfit.nombre === 'Con prenda sucia');
  comprobar('...pero sigue apareciendo, no se prohíbe', !!conSucia);
  comprobar('...y avisa de por qué está abajo', conSucia.motivos.some((m) => m.includes('no está disponible')));
  comprobar('...y trae la lista de prendas no disponibles', conSucia.noDisponibles.length === 1);

  // Apartado 8: el contexto es una señal, no un filtro.
  const conLugar = recomendarOutfits(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, contexto: { lugar: 'Universidad' }, limite: 9 });
  comprobar('El contexto de lugar sube el outfit de ese lugar',
    conLugar.recomendaciones[0].outfit.nombre === 'Universidad', conLugar.recomendaciones[0].outfit.nombre);
  comprobar('...explicando que ya lo has llevado ahí',
    conLugar.recomendaciones[0].motivos.some((m) => m.includes('Universidad')));
  comprobar('...pero NO excluye a los demás', conLugar.recomendaciones.length === 4);
  comprobar('Un lugar en el que nunca has estado no rompe nada',
    recomendarOutfits(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, contexto: { lugar: 'Playa' } }).recomendaciones.length === 3);
  const conOcasion = recomendarOutfits(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, contexto: { ocasion: 'cena' }, limite: 9 });
  comprobar('El contexto de ocasión también puntúa',
    conOcasion.recomendaciones[0].outfit.ocasion === 'cena');
  const conPersona = recomendarOutfits(USOS, OUTFITS, PRENDAS, { hoyISO: HOY, contexto: { persona: 'Jorge' }, limite: 9 });
  comprobar('El contexto de persona sale del historial real',
    conPersona.recomendaciones[0].motivos.some((m) => m.includes('Jorge')));
  // Las puntuaciones tienen que estar ordenadas de verdad.
  comprobar('La lista viene ordenada por puntos',
    r.recomendaciones.every((x, i, a) => i === 0 || a[i - 1].puntos >= x.puntos));
}

/* --- Apartado 14: panel inteligente --------------------------------------- */
{
  const frases = panelInteligente({ usos: USOS, outfits: OUTFITS, prendas: PRENDAS }, { hoyISO: HOY });
  comprobar('El panel genera frases', frases.length > 0);
  comprobar('Cada frase tiene id y texto', frases.every((f) => f.id && f.texto));
  comprobar('Menciona el outfit más usado', frases.some((f) => f.texto.includes('Casual Gris')));
  comprobar('Menciona las prendas sin estrenar', frases.some((f) => f.id === 'sin_estrenar'));
  // Apartado 21: sin datos, ninguna frase — no "0 outfits esta semana".
  const vacio = panelInteligente({ usos: [], outfits: [], prendas: [] }, { hoyISO: HOY });
  comprobar('Sin nada de nada, ninguna frase (estado vacío)', vacio.length === 0);
  comprobar('Sin usos no dice "0 usos esta semana"',
    !panelInteligente({ usos: [], outfits: OUTFITS, prendas: PRENDAS }, { hoyISO: HOY }).some((f) => f.id === 'semana'));
  comprobar('Un armario nulo no revienta', panelInteligente(null, { hoyISO: HOY }).length === 0);
}

/* --- Umbrales y resumen ---------------------------------------------------- */
{
  comprobar('Un solo uso ya da para estadísticas', hayDatosSuficientes([{}]));
  comprobar('Ninguno, no', !hayDatosSuficientes([]));
  const res = resumenInteligencia({ usos: USOS, outfits: OUTFITS, prendas: PRENDAS }, HOY);
  comprobar('El resumen sabe que hay datos', res.hayDatos === true && res.puedeRecomendar === true);
  const resVacio = resumenInteligencia({ usos: [], outfits: [], prendas: [] }, HOY);
  comprobar('...y sabe cuándo no', resVacio.hayDatos === false && resVacio.puedeRecomendar === false);
}

/* ---------------------------------------------------------------------------
   APARTADO 24 — PRUEBA CRÍTICA, literal de la especificación.

   PRENDA: Vaquero gris
   OUTFITS: Casual Gris, Cena Negra, Universidad
   USOS: Casual 01/08 · Cena 05/08 · Casual 10/08 · Universidad 20/08 · Casual 22/08

   El sistema debe determinar automáticamente:
     Casual Gris → 3 usos   (NO 5: cinco son los registros TOTALES)
     Cena Negra  → 1 uso
     Universidad → 1 uso
     Vaquero gris (está en los tres) → 5 usos, último 22/08
   --------------------------------------------------------------------------- */
{
  const eo = estadisticasOutfits(USOS, OUTFITS, { hoyISO: HOY });
  const ep = estadisticasPrendas(USOS, OUTFITS, PRENDAS, { hoyISO: HOY });
  const veces = (nombre) => eo.rankingMas.find((x) => x.outfit.nombre === nombre)?.veces;
  const vaq = ep.rankingMas.find((x) => x.prenda.nombre === 'Vaquero gris');

  comprobar('CRÍTICA · Casual Gris → 3 usos, NO 5', veces('Casual Gris') === 3, String(veces('Casual Gris')));
  comprobar('CRÍTICA · Cena Negra → 1 uso', veces('Cena Negra') === 1, String(veces('Cena Negra')));
  comprobar('CRÍTICA · Universidad → 1 uso', veces('Universidad') === 1, String(veces('Universidad')));
  comprobar('CRÍTICA · Los tres suman los 5 registros del historial',
    veces('Casual Gris') + veces('Cena Negra') + veces('Universidad') === 5);
  comprobar('CRÍTICA · Vaquero gris → 5 usos (está en los tres outfits)', vaq.veces === 5, String(vaq.veces));
  comprobar('CRÍTICA · Vaquero gris → último uso 22/08', vaq.ultima === '2026-08-22', String(vaq.ultima));
  // Y la prenda sigue siendo UNA: no se ha duplicado por estar en tres outfits.
  comprobar('CRÍTICA · La prenda no se duplica al aparecer en tres outfits',
    ep.rankingMas.filter((x) => x.prenda.nombre === 'Vaquero gris').length === 1);
  comprobar('CRÍTICA · Todo sale del historial: sin usos, todo vuelve a cero',
    estadisticasPrendas([], OUTFITS, PRENDAS, { hoyISO: HOY }).rankingMas.length === 0);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
