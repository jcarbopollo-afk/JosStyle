// ============================================================================
// EH · Fase 61/65 — Acciones rápidas e inteligentes
//
// *"Si una acción habitual necesita cinco pantallas, está mal diseñada."*
//
// Lo que vigila esta prueba:
//   · que ninguna acción dependa de un gesto (y por qué eso es lo correcto)
//   · que solo confirme lo que no tiene vuelta atrás
//   · que las acciones frecuentes sigan en 1–3 toques, medidas con la F51
//   · y que lo que falta —deshacer rápido y lote— esté dicho con su motivo
// ============================================================================

import { RECORRIDOS as RECORRIDOS_F51 } from '../src/lib/experienciaReal.js';
import { noExisten as NO_EXISTEN_F50 } from '../src/lib/microinteracciones.js';
import { ACCESOS_DISPONIBLES as ACCESOS_F29 } from '../src/lib/pantallaEH.js';
import { ACCIONES_POSIBLES as ACCIONES_F60 } from '../src/lib/contextual.js';
import { DURACION_FEEDBACK_MS as FEEDBACK_F41 } from '../src/lib/estadosEstilo.js';
import {
  ACCIONES, accionRapida, accionesQueExisten, lasQueConfirman,
  EN_LA_PORTADA, BOTON_MAS, MAX_BOTON_MAS,
  ACCIONES_POR_ELEMENTO, NO_EN_UN_ELEMENTO, accionesDe, conRuido,
  GESTOS, gesto, REGLA_SIN_GESTOS, accionesQueDependenDeUnGesto,
  DESDE_RECOMENDACION, DESDE_INSIGHT, terminaEnVale,
  ACCIONES_GLOBALES, CREA_SISTEMA_PROPIO,
  TEXTOS_ACCIONES, PENDIENTES, pendiente,
  IA_ACCIONES, iaEjecutaAlgo, RESPUESTA_INMEDIATA,
  OBJETIVO_TOQUES, FRECUENTES, frecuentesQueSePasan,
  APARTADOS_ACCIONES, apartadoAccion, CONDICION,
  auditarAcciones, panelAcciones, RECORRIDOS, toquesDe, noExisten, ACCESOS_DISPONIBLES,
  RETENCION_PAPELERA_DIAS, puedeLaIA, DURACION_FEEDBACK_MS,
} from '../src/lib/accionesRapidas.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

console.log('\n⚡ EH · Fase 61/65 — Acciones rápidas e inteligentes\n');

/* ---------------------------------------------------------------------------
   1 · LAS ACCIONES, Y CUÁL CONFIRMA (apartados 1 y 11)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Las acciones y sus confirmaciones');
  eq(ACCIONES.length, 10, 'las nueve del apartado 1, más la irreversible');
  ok(ACCIONES.every((a) => !!a.icono && !!a.nombre), 'cada una con su icono y su nombre');
  eq(lasQueConfirman(), ['eliminar_definitivo'],
    '🚨 ⚠️ apartado 11 — SOLO confirma la que no tiene vuelta atrás');
  eq(auditarAcciones().confirmanReversibles, [],
    '🚨 y ninguna reversible pide confirmación: un aviso delante de cada toque enseña a no leerlos');
  eq(accionRapida('ocultar').confirma, false, 'ocultar no pregunta…');
  eq(accionRapida('ocultar').reversible, true, '…porque se deshace');
  ok(/mismo toque/.test(TEXTOS_ACCIONES.sinConfirmar), 'y se dice por qué');
  ok(/no tiene vuelta atrás/.test(TEXTOS_ACCIONES.confirmando), 'y por qué la otra sí');

  /* ⚠️ Compartir está en la lista del enunciado y NO existe. */
  eq(accionRapida('compartir').existe, false, '⚠️ compartir sigue en la lista, marcada como inexistente');
  ok(/no tiene sistema de compartición/.test(accionRapida('compartir').porque), 'con su motivo');
  eq(accionesQueExisten().length, 9, 'y las otras nueve sí existen');
  ok(!accionRapida('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   2 · 🚨 NINGUNA ACCIÓN DEPENDE DE UN GESTO (apartados 5, 6 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Sin gestos');
  eq(accionesQueDependenDeUnGesto(), [],
    '🚨 ⚠️ apartado 16 — NINGUNA acción depende de un gesto: todas están en un botón que se ve');
  eq(auditarAcciones().gestosQueNoExisten, ['deslizar', 'mantener'],
    'deslizar y mantener pulsado no existen, y están en la lista igualmente');
  eq(auditarAcciones().sinAlternativa, [], '⚠️ y los dos dicen cuál es la alternativa visible');
  ok(/lector de pantalla/.test(gesto('mantener').porque),
    '🚨 con el motivo de verdad: las flechas funcionan con el lector de pantalla');
  ok(/escondido/.test(gesto('deslizar').porque),
    '⚠️ y que un gesto oculto no es una acción rápida, es una acción escondida');
  ok(/se puede leer en voz alta/.test(REGLA_SIN_GESTOS), 'con la regla escrita');

  /* ⚠️ Y es la misma decisión de la F50, no una nueva. */
  ok(NO_EXISTEN_F50().some((m) => m.apartado === 3),
    'la F50 ya había decidido lo mismo sobre arrastrar');
  ok(noExisten === NO_EXISTEN_F50, 'y es la misma función, importada');
  ok(!gesto('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   3 · CADA COSA CON SUS ACCIONES (apartados 2, 3, 4 y 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Dónde aparece cada acción');
  eq(conRuido(), [],
    '🚨 ⚠️ apartado 4 — ninguna ficha ofrece "crear objetivo" ni "compartir" donde no aportan');
  eq(accionesDe('perfume'), ['favorito', 'editar', 'eliminar'],
    'un perfume: favorito, editar y eliminar — el ejemplo del enunciado');
  ok(!accionesDe('perfume').some((a) => NO_EN_UN_ELEMENTO.includes(a)),
    '⚠️ y ni una de las que el enunciado dice que NO se muestren');
  eq(accionesDe('eliminado'), ['recuperar', 'eliminar_definitivo'],
    'y lo que está en la papelera tiene las suyas');
  eq(accionesDe('inventado'), [], 'un tipo que no existe no tiene acciones');

  eq(auditarAcciones().botonMasSeVaDeMadre, false,
    `⚠️ apartado 3 — el botón + ofrece ${BOTON_MAS.length}, no veinte`);
  ok(BOTON_MAS.length <= MAX_BOTON_MAS, `con su tope de ${MAX_BOTON_MAS}`);
  ok(BOTON_MAS.every((b) => !!b.nombre && !!b.icono), 'cada opción con su nombre');

  eq(EN_LA_PORTADA.cuantos, ACCESOS_F29.length,
    '⚠️ apartados 2 y 7 — los accesos de la portada son los de la F29, no unos nuevos');
  ok(ACCESOS_DISPONIBLES === ACCESOS_F29, 'importados, no copiados');
  eq(EN_LA_PORTADA.eligeEl, true, 'y los elige él');
  ok(EN_LA_PORTADA.maxVisibles <= 4, 'con un tope de cuatro visibles');
}

/* ---------------------------------------------------------------------------
   4 · DESDE UNA RECOMENDACIÓN O UN INSIGHT (apartados 8 y 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Que no termine en "Vale"');
  eq(terminaEnVale(DESDE_RECOMENDACION), false,
    '🚨 apartado 8 — una recomendación ofrece qué hacer, no solo "Vale"');
  ok(DESDE_RECOMENDACION === ACCIONES_F60,
    '⚠️ y son las acciones de la F60, importadas: no una segunda lista');
  ok(DESDE_RECOMENDACION.some((a) => a.id === 'guardar'), 'con Guardar…');
  ok(DESDE_RECOMENDACION.some((a) => a.id === 'objetivo'), '…convertir en objetivo…');
  ok(DESDE_RECOMENDACION.some((a) => a.id === 'no_interesa'), '…y decir que no');
  eq(terminaEnVale([]), true, 'y el detector caza la lista vacía');
  eq(terminaEnVale(null), true, 'y lo que no es una lista');

  eq(DESDE_INSIGHT.map((a) => a.id), ['revisar', 'ocultar'], 'apartado 9 — un insight lleva al apartado');
  ok(/al apartado/.test(DESDE_INSIGHT[0].lleva), 'diciendo a dónde');
}

/* ---------------------------------------------------------------------------
   5 · LO GLOBAL ES GLOBAL (apartado 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Nada de "Tareas de Estilo"');
  eq(CREA_SISTEMA_PROPIO, false, '🚨 apartado 10 — no se crea ningún sistema propio');
  eq(auditarAcciones().creaSistemaPropio, false, 'el parte lo confirma');
  ok(ACCIONES_GLOBALES.every((a) => !!a.de && a.aqui !== undefined),
    'cada acción global dice de quién es y qué queda aquí');
  ok(/solo su id/.test(ACCIONES_GLOBALES.find((a) => a.id === 'tarea').aqui),
    '⚠️ de una tarea aquí queda SOLO su id: son las tareas de JC Fitness');
  ok(/ME F3/.test(ACCIONES_GLOBALES.find((a) => a.id === 'eliminar').aqui),
    'y la papelera es la global');
}

/* ---------------------------------------------------------------------------
   6 · 🚨 LO QUE FALTA, DICHO (apartados 12 y 13)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Deshacer rápido y acciones en lote');
  eq(PENDIENTES.map((p) => p.apartado), [12, 13], 'dos apartados sin cumplir');
  eq(auditarAcciones().pendientesSinMotivo, [],
    '🚨 ⚠️ y los dos dicen qué hay en su lugar Y por qué no basta');
  eq(pendiente('deshacer_rapido').existe, false, 'el "Deshacer" de unos segundos no existe');
  ok(new RegExp(`${RETENCION_PAPELERA_DIAS} días`).test(pendiente('deshacer_rapido').loQueHay),
    'lo que hay es la papelera de treinta días…');
  ok(/tres toques en vez de uno/.test(pendiente('deshacer_rapido').porque),
    '🚨 …y se dice que NO es lo mismo: tres toques en vez de uno. Tapar el hueco sería peor');
  ok(/todavía no aporta/.test(pendiente('lote').porque),
    '⚠️ y el lote, con las palabras del propio apartado: "solo donde realmente aporte valor"');
  ok(!pendiente('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   7 · LA IA PROPONE (apartado 14) Y SE NOTA (apartado 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · La IA y la respuesta inmediata');
  eq(iaEjecutaAlgo(), [],
    '🚨 apartado 14 — la IA no puede ejecutar ninguna de las cinco: solo proponer');
  ok(/Ejecutarla|se aplica sola/.test(IA_ACCIONES.noPuede), 'y queda escrito');
  ok(/No guardar" por defecto/.test(IA_ACCIONES.como), '⚠️ con "No guardar" por defecto (F56)');
  eq(puedeLaIA('eliminar').puede, false, 'comprobado contra la lista de la F56');

  eq(RESPUESTA_INMEDIATA.feedbackMs, FEEDBACK_F41,
    '⚠️ apartado 15 — el ✓ dura lo que dice la F41, no un número nuevo');
  eq(DURACION_FEEDBACK_MS, FEEDBACK_F41, 'importado de allí');
  eq(RESPUESTA_INMEDIATA.hay.length, 3, 'y hay tres formas de que se note que ha pasado algo');
  eq(RESPUESTA_INMEDIATA.deLasFases, ['F41', 'F50'], 'las tres, de fases anteriores');
}

/* ---------------------------------------------------------------------------
   8 · LA MEDIDA (apartado 17) Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Los toques');
  eq(OBJETIVO_TOQUES, 3, 'el objetivo del enunciado: 1–3 toques para las frecuentes');
  eq(frecuentesQueSePasan(), [],
    '🚨 ⚠️ y ninguna acción frecuente se pasa de tres toques');
  ok(FRECUENTES().length >= 3, `con ${FRECUENTES().length} acciones frecuentes medidas`);
  ok(RECORRIDOS === RECORRIDOS_F51,
    '⚠️ decisión 2 — los recorridos son los de la F51, importados: no hay dos tablas de toques');
  ok(FRECUENTES().every((r) => r.tipo === 'diaria'),
    'y "frecuente" quiere decir lo que la F51 llama "de todos los días"');
  eq(toquesDe('marcar_favorito'), 2, 'marcar favorito sigue costando dos');

  eq(APARTADOS_ACCIONES.length, 17, 'los diecisiete apartados');
  eq(auditarAcciones().sinCumplir, [5, 6, 12, 13],
    '⚠️ cuatro sin cumplir: los dos gestos (a propósito) y los dos que faltan');
  eq(auditarAcciones().sinDonde, [], 'y todos dicen dónde');
  ok(/apartado 16 explica/.test(apartadoAccion(5).donde),
    '🚨 y el 5 remite al 16: no cumplirlo ES cumplir el de accesibilidad');
  ok(!apartadoAccion(99), 'se buscan por id');

  const panel = panelAcciones();
  eq(panel.rapidaYClara, true, '🎯 ver, decidir y actuar sin dar vueltas');
  ok(/nunca confusa/.test(panel.condicion), 'con la condición de finalización');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
