// ============================================================================
// EH · Fase 60/65 — Recomendaciones contextuales
//
// *"Momento adecuado + contexto adecuado + usuario adecuado. Si falta alguno:
// no recomendar. La aplicación debe aprender a decir: no tengo nada útil que
// decir ahora."*
//
// Lo que vigila esta prueba:
//   · 🚨 que sin fuentes autorizadas NO se recomiende nada
//   · que sin saber la ocasión no se invente una
//   · que se enseñe UNA, la más relevante, y con descanso
//   · y que el clima y la ubicación se declaren como lo que son: inexistentes
// ============================================================================

import { normalizarEstiloHombre, IDS_EH } from '../src/lib/estiloDeHombre.js';
import { alternarPermisoIA } from '../src/lib/iaEstilo.js';
import { suenaAReproche as REPROCHE_F58 } from '../src/lib/insights.js';
import {
  FUENTES, fuente, fuentesQueExisten, fuentesQueNoExisten,
  DEFAULT_CONTEXTUAL, DESCANSO_DIAS, normalizarContextual, datosContextual,
  alternarFuente, fuenteAutorizada,
  TEXTO_SILENCIO, alternarSilencio, enSilencio,
  MOMENTOS, momentoDe, esFinDeSemana, TEMPORADAS, temporadaDe,
  OCASIONES, ocasion,
  REGLAS_CONTEXTUALES, reglaContextual,
  MOTIVOS_DE_SILENCIO, motivoSilencio, TEXTO_NADA, recomendarAhora, marcarVista,
  ACCIONES_POSIBLES, accion, rechazarTipo, CREA_COPIA,
  IA_CONTEXTO, iaPuedeAyudar,
  SITUACIONES_PRUEBA, situacionPrueba,
  APARTADOS_CONTEXTUAL, apartadoContextual, CONDICION,
  auditarContextual, panelContextual, suenaAReproche,
} from '../src/lib/contextual.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-06-01';
const todoEncendido = () => {
  let e = normalizarEstiloHombre({
    configurado: true,
    modulos: IDS_EH.map((id, i) => ({ id, activo: true, oculto: false, orden: i, config: {} })),
  });
  fuentesQueExisten().forEach((f) => { e = alternarFuente(e, f.id); });
  return e;
};

console.log('\n🧭 EH · Fase 60/65 — Recomendaciones contextuales\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 LO NORMAL ES NO RECOMENDAR NADA
   --------------------------------------------------------------------------- */
{
  console.log('1 · Sabe callarse');
  const a = auditarContextual({ hoy: HOY });
  eq(a.fuentesPorDefecto, 0,
    '🚨 ⚠️ ninguna fuente autorizada por defecto: que el calendario EXISTA no es permiso para mirarlo');
  eq(a.sinFuentesNoRecomienda, true,
    '🚨 sin autorizar nada, no se recomienda — ni con un evento y a las ocho de la tarde');
  eq(recomendarAhora(normalizarEstiloHombre({}), { ocasion: 'evento', hora: 20, hoy: HOY }).porque,
    'sin_fuentes', 'y se dice el motivo exacto');
  eq(recomendarAhora(normalizarEstiloHombre({}), { hoy: HOY }).texto, TEXTO_NADA,
    '⚠️ con la frase de la condición: "no tengo nada útil que decir ahora"');
  eq(MOTIVOS_DE_SILENCIO.length, 7, 'los siete motivos por los que puede callarse');
  ok(MOTIVOS_DE_SILENCIO.every((m) => !!m.que), 'cada uno explicado');
  ok(!motivoSilencio('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   2 · 🚨 NO SE ASUME NADA (apartado 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · No inventar');
  const e = todoEncendido();
  eq(auditarContextual({ hoy: HOY }).sinOcasionNoRecomienda, true,
    '🚨 ⚠️ sin saber qué hace hoy, NO se recomienda: la condición pide las tres cosas');
  eq(recomendarAhora(e, { hora: 10, hoy: HOY }).porque, 'sin_ocasion', 'con su motivo');
  eq(recomendarAhora(e, { ocasion: 'dia_normal', hora: 15, hoy: HOY }).hay, false,
    '⚠️ y un día normal por la tarde tampoco necesita una sugerencia');
  eq(recomendarAhora(e, { ocasion: 'dia_normal', hora: 15, hoy: HOY }).porque, 'nada_relevante',
    'diciendo que simplemente no hay nada relevante');

  eq(auditarContextual({ hoy: HOY }).sinFuentesDeclaradas, [],
    '⚠️ cada regla declara qué fuentes necesita');
  eq(auditarContextual({ hoy: HOY }).fuentesInventadas, [],
    '🚨 y ninguna necesita una fuente que no existe: nada de reglas sobre el clima');
}

/* ---------------------------------------------------------------------------
   3 · 🚨 EL CLIMA Y LA UBICACIÓN NO EXISTEN (apartados 4 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Las fuentes que no hay');
  eq(fuentesQueNoExisten().map((f) => f.id), ['clima', 'ubicacion'],
    '🚨 dos fuentes del enunciado NO existen, y están en la lista igualmente');
  eq(auditarContextual({ hoy: HOY }).sinMotivo, [], '⚠️ y las dos con su motivo');
  ok(/no tiene información meteorológica/.test(fuente('clima').porque),
    'el clima, porque JosStyle no la tiene: el apartado 4 empieza con "si dispone"');
  ok(/por si acaso/.test(fuente('ubicacion').porque),
    '⚠️ y la ubicación, porque pedirla "por si acaso" es lo que el apartado 15 prohíbe');
  eq(alternarFuente(normalizarEstiloHombre({}), 'clima').modulos.length > 0, true,
    'intentar autorizar el clima no revienta…');
  eq(datosContextual(alternarFuente(normalizarEstiloHombre({}), 'clima')).fuentes, [],
    '🚨 …pero no lo autoriza: no se puede encender una fuente que no existe');
  eq(normalizarContextual({ fuentes: ['clima', 'calendario'] }).fuentes, ['calendario'],
    '⚠️ ni guardándolo a mano');
  eq(fuentesQueExisten().length, 3, 'las tres que sí hay: calendario, historial y preferencias');
  ok(fuentesQueExisten().every((f) => !!f.que), 'cada una diciendo para qué se usaría');
  ok(!fuente('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   4 · CON CONTEXTO SÍ, Y UNA SOLA (apartados 2, 5, 8 y 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Cuando sí tiene algo que decir');
  const e = todoEncendido();
  const evento = recomendarAhora(e, { ocasion: 'evento', hora: 20, hoy: HOY });
  eq(evento.hay, true, 'con un evento, sí hay recomendación');
  ok(/evento esta noche/.test(evento.texto), 'con el texto del apartado 2');
  eq(evento.recomendacion.cambiaAlgo, false,
    '🚨 ⚠️ y NO cambia nada automáticamente: el apartado 2 lo dice con todas las letras');
  eq(auditarContextual({ hoy: HOY }).cambianAlgo, [], 'ninguna de las cuatro reglas cambia nada sola');

  ok(!Array.isArray(evento.recomendacion), '⚠️ se devuelve UNA, no una lista');
  eq(auditarContextual({ hoy: HOY }).masDeUna, 0, 'nunca un escaparate');
  ok(evento.candidatas >= 1, `de ${evento.candidatas} candidata(s), la de mayor prioridad`);

  const viaje = recomendarAhora(e, { ocasion: 'viaje', hora: 10, hoy: HOY });
  ok(/viaje mañana/.test(viaje.texto), 'apartado 5 — la del viaje, con su texto');

  /* Apartado 8 — descanso. */
  const vista = marcarVista(e, 'evento_hoy', { hoy: HOY });
  eq(recomendarAhora(vista, { ocasion: 'evento', hora: 20, hoy: HOY }).porque, 'descanso',
    '🚨 ⚠️ y no sale otra al momento: "no una recomendación cada vez que abre la app"');
  eq(recomendarAhora(vista, { ocasion: 'evento', hora: 20, hoy: '2026-06-10' }).hay, true,
    `pasados ${DESCANSO_DIAS} días, otra vez`);
}

/* ---------------------------------------------------------------------------
   5 · EL MODO SILENCIOSO (apartado 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Modo silencioso');
  const e = todoEncendido();
  eq(enSilencio(e), false, 'por defecto no está en silencio');
  const callado = alternarSilencio(e);
  eq(enSilencio(callado), true, 'se puede encender');
  eq(recomendarAhora(callado, { ocasion: 'evento', hora: 20, hoy: HOY }).hay, false,
    '🚨 y en silencio NO se recomienda nada, ni con un evento');
  eq(recomendarAhora(callado, { ocasion: 'evento', hora: 20, hoy: HOY }).porque, 'silencio',
    'con su motivo');
  ok(/funciona igual/.test(TEXTO_SILENCIO.que),
    '⚠️ y se dice que Estilo de hombre sigue funcionando: solo deja de proponer');
  eq(enSilencio(alternarSilencio(callado)), false, 'y se vuelve a apagar');
}

/* ---------------------------------------------------------------------------
   6 · MOMENTOS, TEMPORADAS Y OCASIONES (apartados 1 y 6)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · El momento y la ocasión');
  eq(MOMENTOS.map((m) => m.id), ['manana', 'tarde', 'noche'], 'los tres momentos del día');
  eq(momentoDe(9).id, 'manana', 'las nueve son la mañana');
  eq(momentoDe(15).id, 'tarde', 'las tres, la tarde');
  eq(momentoDe(22).id, 'noche', 'las diez, la noche');
  eq(momentoDe(2).id, 'noche', '⚠️ y las dos de la madrugada también: la noche cruza la medianoche');
  eq(momentoDe('nada'), null, 'sin hora, ningún momento');
  eq(momentoDe(null), null, 'ni con nada');

  eq(esFinDeSemana('2026-05-30'), true, 'un sábado es fin de semana');
  eq(esFinDeSemana('2026-06-01'), false, 'un lunes no');
  eq(esFinDeSemana('no-es-fecha'), null, 'y algo que no es fecha no se inventa');
  eq(TEMPORADAS.length, 4, 'las cuatro temporadas');
  eq(temporadaDe('2026-07-15').id, 'verano', 'julio es verano');
  eq(temporadaDe('2026-01-15').id, 'invierno', 'enero, invierno');
  eq(temporadaDe(null), null, 'y sin fecha, ninguna');

  eq(OCASIONES.length, 6, 'las seis ocasiones del apartado 6');
  eq(ocasion('dia_normal').necesita, null,
    '⚠️ y la sexta —día normal— no necesita ninguna fuente: es la de casi todos los días');
  ok(OCASIONES.filter((o) => o.id !== 'dia_normal').every((o) => !!o.necesita),
    'las otras cinco dicen de dónde saldrían');
  ok(!ocasion('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   7 · QUÉ HACER CON ELLA (apartados 10 a 13)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Rechazar, guardar, convertir');
  eq(ACCIONES_POSIBLES.map((a) => a.id),
    ['no_interesa', 'no_este_tipo', 'guardar', 'objetivo', 'tarea'], 'las cinco acciones');
  ok(ACCIONES_POSIBLES.filter((a) => a.crea).every((a) => a.copia === false),
    '🚨 ⚠️ apartado 11 — ninguna crea una copia dentro de Estilo de hombre');
  eq(CREA_COPIA, false, 'y queda escrito');
  ok(accion('objetivo').explicita, '⚠️ apartado 12 — convertir en objetivo requiere acción suya');
  ok(accion('tarea').explicita, 'y en tarea, también');
  eq(accion('tarea').crea, 'Productividad', '⚠️ apartado 13 — usando el sistema global de tareas');
  ok(!accion('inventada'), 'se buscan por id');

  const e = todoEncendido();
  const rechazado = rechazarTipo(e, 'evento_hoy');
  eq(recomendarAhora(rechazado, { ocasion: 'evento', hora: 20, hoy: HOY }).hay, false,
    '🚨 apartado 10 — "no quiero recomendaciones de este tipo" se respeta');
  eq(rechazarTipo(e, 'inventada'), normalizarEstiloHombre(e), 'y un tipo que no existe no se rechaza');

  /* La lección de la F58 también aquí. */
  ok(suenaAReproche === REPROCHE_F58, '⚠️ el detector de reproches es el de la F58, importado');
  eq(auditarContextual({ hoy: HOY }).conReproche, [],
    '🚨 y ni un texto de las cuatro reglas suena a reproche');
}

/* ---------------------------------------------------------------------------
   8 · IA, SITUACIONES Y VEREDICTO (14 y 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · IA, situaciones y veredicto');
  eq(iaPuedeAyudar(normalizarEstiloHombre({})), false, 'sin permiso ni fuentes, la IA no ayuda');
  eq(iaPuedeAyudar(todoEncendido()), false, '⚠️ con fuentes pero sin el permiso de la F56, tampoco');
  eq(iaPuedeAyudar(alternarPermisoIA(todoEncendido())), true, '🚨 hacen falta LAS DOS cosas');
  ok(/las dos cosas/i.test(IA_CONTEXTO.necesita), 'y se dice');
  ok(/no se sabe/.test(IA_CONTEXTO.noPuede), '⚠️ y que la IA tampoco rellena lo que no se sabe');

  const sit = auditarContextual({ hoy: HOY }).situaciones;
  eq(SITUACIONES_PRUEBA.length, 5, 'las cinco situaciones del apartado 17');
  eq(sit.find((s) => s.id === 'evento').hay, true, 'con evento: sugerencia');
  eq(sit.find((s) => s.id === 'viaje').hay, true, 'con viaje: sugerencia');
  eq(sit.find((s) => s.id === 'estacion').hay, true, 'al cambiar la estación: sugerencia');
  eq(sit.find((s) => s.id === 'dia_normal').hay, false, '⚠️ un día normal: nada');
  eq(sit.find((s) => s.id === 'sin_historial').hay, false,
    '🚨 y un usuario del que no se sabe nada: nada, con `sin_ocasion`');
  eq(sit.find((s) => s.id === 'sin_historial').porque, 'sin_ocasion', 'diciéndolo');
  ok(!situacionPrueba('inventada'), 'se buscan por id');

  eq(APARTADOS_CONTEXTUAL.length, 17, 'los diecisiete apartados');
  eq(auditarContextual({ hoy: HOY }).sinCumplir, [4],
    '⚠️ uno sin cumplir: el clima, que no existe');
  eq(auditarContextual({ hoy: HOY }).sinDonde, [], 'y todos dicen dónde');
  ok(!apartadoContextual(99), 'se buscan por id');

  const panel = panelContextual(todoEncendido(), { hoy: HOY });
  eq(panel.sabeCallarse, true, '🎯 sabe callarse, que es de lo que iba esta fase');
  ok(/Si falta alguno/.test(panel.condicion), 'con la condición de finalización');
  eq(panel.autorizadas.length, 3, 'y el panel enseña qué fuentes ha autorizado');
  eq(DEFAULT_CONTEXTUAL.fuentes, [], 'que por defecto no es ninguna');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
