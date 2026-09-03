// ============================================================================
// EH · Fase 56/65 — Integración profunda con la IA
//
// *"La IA aconseja. El usuario decide."*
//
// Lo que vigila esta prueba:
//   · 🚨 que con el interruptor APAGADO no salga NADA (null, no "menos datos")
//   · que ni con él encendido salgan el tipo de piel ni la sensibilidad
//   · que no se mande todo cada vez: solo lo de la pregunta
//   · y que la IA no pueda comprar, borrar ni cambiar nada por su cuenta
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { normalizarEstiloHombre, configurarPrimeraVez, DEFAULT_ESTILO_HOMBRE } from '../src/lib/estiloDeHombre.js';
import { CAMPOS_PRIVADOS as PRIVADOS_F43 } from '../src/lib/privacidadEstilo.js';
import { descartarEn as DESCARTAR_F16, PALABRAS_PROHIBIDAS as PROHIBIDAS_F16 } from '../src/lib/motorRecomendaciones.js';
import {
  DEFAULT_IA, TEXTO_INTERRUPTOR, normalizarIA, datosIA, permisoIA, alternarPermisoIA, alternarMemoriaIA,
  INTENCIONES, intencion, contextoParaIA, llevaAlgoPrivado,
  COMO_APRENDE, QUIEN_MANDA, MEMORIA_DE_GUSTOS,
  SITUACIONES, situacion, situacionDeUnEvento,
  NIVELES_DE_CONFIANZA, nivelDeConfianza, recomendacionValida, TEXTOS_IA, PREGUNTAS_DE_EJEMPLO,
  ACCIONES_PROHIBIDAS, accionProhibida, puedeLaIA, proponer,
  MEMORIA_IA, CASOS_IA, casoIA,
  APARTADOS_IA, apartadoIA, TEXTOS_CONDICION,
  auditarIA, panelIA, CAMPOS_PRIVADOS, descartarEn, PALABRAS_PROHIBIDAS,
} from '../src/lib/iaEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const APP = readFileSync(join(RAIZ, 'src/App.jsx'), 'utf8');

const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'skincare', 'estilo']);
const encendido = () => alternarPermisoIA(base());

console.log('\n🧠 EH · Fase 56/65 — Integración profunda con la IA\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 EL INTERRUPTOR, Y QUE NACE APAGADO (apartado 12)
   --------------------------------------------------------------------------- */
{
  console.log('1 · El interruptor');
  eq(DEFAULT_IA.permitido, false, '🚨 nace APAGADO');
  eq(permisoIA(base()), false, 'y un estado nuevo también');
  eq(normalizarIA({ permitido: 'sí' }).permitido, false,
    '🚨 ⚠️ y cualquier cosa que no sea `true` cuenta como apagado: nada lo enciende por accidente');
  eq(normalizarIA(undefined), DEFAULT_IA, 'sin nada guardado, los valores por defecto');

  eq(permisoIA(encendido()), true, 'se enciende');
  eq(permisoIA(alternarPermisoIA(encendido())), false, 'y se apaga');
  ok(/Usar mis datos/.test(TEXTO_INTERRUPTOR.titulo), 'con el título del enunciado');
  ok(/nunca tu tipo de piel/.test(TEXTO_INTERRUPTOR.queSale),
    '⚠️ y diciendo qué sale y qué no, para que encenderlo sea una decisión informada');
  ok(/responde igual/.test(TEXTO_INTERRUPTOR.apagado),
    'y que apagado la IA sigue funcionando, solo que sin saber de su estilo');

  /* La memoria no se puede encender sin el permiso. */
  eq(datosIA(alternarMemoriaIA(base())).memoria, false,
    '⚠️ y la memoria NO se puede encender con el permiso apagado');
  eq(datosIA(alternarMemoriaIA(encendido())).memoria, true, 'con el permiso encendido, sí');

  /* ⚠️ Sigue viviendo donde vive lo demás: sin sistemas nuevos (F55). */
  ok(/estiloHombre/.test(APP), 'y todo sigue en la clave de siempre');
}

/* ---------------------------------------------------------------------------
   2 · 🚨 APAGADO NO SALE NADA (decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Con el interruptor apagado');
  const a = auditarIA();
  eq(a.porDefectoApagado, true, '🚨 por defecto, apagado');
  eq(a.apagadoDaNull, true,
    '🚨 ⚠️ y el contexto es NULL para las cinco intenciones: no "menos datos", ninguno');
  INTENCIONES.forEach((i) => {
    eq(contextoParaIA(base(), i.id), null, `nada para "${i.id}"`);
  });
  eq(contextoParaIA(encendido(), 'inventada'), null, 'y una intención que no existe tampoco devuelve nada');
  ok(/no sale nada/.test(TEXTOS_CONDICION.porDefecto), 'con la frase que lo deja escrito');
  /* La F43 dejó estiloHombre fuera de currentState, y sigue fuera. */
  ok(!/currentState = \{[^}]*estiloHombre/.test(APP),
    '🚨 ⚠️ y `estiloHombre` SIGUE fuera de `currentState`: la puerta de la F43 no se ha abierto sola');
}

/* ---------------------------------------------------------------------------
   3 · 🚨 NI CON EL INTERRUPTOR SALE LO PRIVADO (decisión 3, apartado 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Lo privado no sale ni encendiéndolo');
  eq(CAMPOS_PRIVADOS, PRIVADOS_F43, 'los campos privados son los de la F43, importados');
  eq(auditarIA().privadosQueSeEscapan, [],
    '🚨 ⚠️ ni uno se escapa en ninguna de las cinco intenciones');
  const rutina = contextoParaIA(encendido(), 'rutina');
  eq(llevaAlgoPrivado(rutina), [], 'el contexto de una rutina no lleva el tipo de piel');
  ok(rutina.privadosOmitidos.length > 0,
    '⚠️ y DICE cuántos ha dejado fuera: así se ve que la omisión es deliberada, no un dato que falta');
  ok(rutina.privadosOmitidos.every((id) => PRIVADOS_F43.includes(id)), 'y son exactamente los privados');

  /* La comprobación de la comprobación. */
  ok(llevaAlgoPrivado({ datos: [{ id: 'tipoPiel' }] }).length > 0,
    '⚠️ el detector caza el caso: si se colara, salta');
  eq(llevaAlgoPrivado(null), [], 'y con contexto nulo no hay nada que cazar');
}

/* ---------------------------------------------------------------------------
   4 · NO SE MANDA TODO CADA VEZ (decisión 2, apartados 1 y 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Solo lo de la pregunta');
  eq(INTENCIONES.length, 5, 'cinco intenciones');
  const perfume = contextoParaIA(encendido(), 'perfume');
  eq(perfume.intencion, 'perfume', 'el contexto dice para qué es');
  ok(!/piel|skincare/i.test(JSON.stringify(perfume.modulos || [])),
    '⚠️ preguntar por un perfume NO manda su seguimiento de la piel');
  ok(Array.isArray(perfume.resumen.apartadosActivos), 'con el resumen de qué usa, que es barato y útil');

  eq(auditarIA().generalSoloResumen, true,
    '🚨 ⚠️ y la pregunta abierta manda el RESUMEN, no el contenido de todo');
  eq(contextoParaIA(encendido(), 'general').datos.length, 0,
    '"¿Qué podría mejorar?" no necesita la lista entera de sus perfumes');
  ok(intencion('general').soloResumen, 'y está declarado así, no es casualidad');
  ok(!intencion('inventada'), 'las intenciones se buscan por id');
  ok(INTENCIONES.every((i) => !!i.que), 'cada una con qué es');
}

/* ---------------------------------------------------------------------------
   5 · APRENDER, SIN UNA SEGUNDA MEMORIA (decisión 4, apartados 3, 4 y 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Cómo aprende');
  eq(COMO_APRENDE.map((c) => c.apartado), [3, 3, 4, 14], 'los cuatro apartados del aprendizaje');
  eq(auditarIA().memoriaPropia, false,
    '🚨 ⚠️ y las cuatro usan el motor de la F16: NO hay una segunda memoria de gustos');
  ok(descartarEn === DESCARTAR_F16, 'literalmente la misma función');
  ok(/contradiciendo/.test(MEMORIA_DE_GUSTOS.porque),
    '⚠️ con el motivo: dos memorias acabarían dando dos opiniones distintas');
  eq(MEMORIA_DE_GUSTOS.deLaFase, 'F16', 'y de qué fase viene');
  ok(/MANDA/.test(COMO_APRENDE.find((c) => c.id === 'correccion').hace),
    '🚨 apartado 14 — lo que él corrige manda sobre lo que la IA dedujo');
  ok(/El usuario/.test(QUIEN_MANDA), 'y se dice quién gana: él');
  ok(/sin discutirlo/.test(QUIEN_MANDA), 'siempre, y sin discutirlo');
}

/* ---------------------------------------------------------------------------
   6 · CÓMO HABLA (apartados 2, 5, 6, 9 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Cómo habla, y la situación');
  eq(SITUACIONES.map((s) => s.icono), ['🌞', '🌙', '🎉', '🏫', '🏖️'], 'las cinco situaciones del enunciado');
  ok(!!situacion('verano') && !situacion('inventada'), 'se buscan por id');

  /* Apartado 6 — referencia, no copia. */
  const s = situacionDeUnEvento({ id: 'ev1', titulo: 'Boda de un primo', notas: 'privado' });
  eq(s.copia, false, '🚨 ⚠️ un evento del calendario se REFERENCIA, no se copia');
  eq(s.deEvento, 'ev1', 'con su id…');
  ok(!JSON.stringify(s).includes('Boda'), '…y sin su título: aquí no vive una copia del evento');
  eq(situacionDeUnEvento(null), null, 'y sin evento, nada');

  /* Apartados 9 y 10 — sin motivo no se enseña. */
  eq(recomendacionValida({ que: 'Podría encajarte este', porque: 'Sueles elegir frescos', confianza: 'sugerencia' }).vale,
    true, 'una recomendación con motivo y nivel de confianza vale');
  ok(recomendacionValida({ que: 'Haz esto', confianza: 'dato' }).problemas.includes('sin_motivo'),
    '🚨 ⚠️ apartado 9 — sin motivo NO se enseña: eso separa "te lo digo porque" de "haz esto"');
  ok(recomendacionValida({ que: 'Ponte éste', porque: 'x', confianza: 'sugerencia' }).problemas.includes('subjetiva_como_verdad'),
    '⚠️ apartado 10 — y una opinión no se presenta como una verdad universal');
  ok(recomendacionValida({ que: 'x', porque: 'y' }).problemas.includes('sin_confianza'),
    'y siempre dice de qué tipo es');
  ok(PALABRAS_PROHIBIDAS === PROHIBIDAS_F16, 'las palabras prohibidas son las de la F16');
  ok(recomendacionValida({ que: `Podría ${PALABRAS_PROHIBIDAS[0]}`, porque: 'x', confianza: 'sugerencia' })
    .problemas.includes('palabra_prohibida'),
    '⚠️ y ni una palabra de diagnóstico, tampoco viniendo de la IA');

  eq(NIVELES_DE_CONFIANZA.length, 2, 'dos niveles: lo que él apuntó y lo que es opinión');
  ok(nivelDeConfianza('sugerencia').esSubjetivo, 'y el segundo se declara subjetivo');
  ok(/20 perfumes/.test(TEXTOS_IA.malo) && /podrían encajarte/.test(TEXTOS_IA.bueno),
    'apartado 2 — con el ejemplo malo y el bueno del enunciado');
  eq(PREGUNTAS_DE_EJEMPLO.length, 4, 'apartado 8 — y las preguntas de ejemplo');
  ok(PREGUNTAS_DE_EJEMPLO.every((p) => !!intencion(p.intencion)),
    '⚠️ cada una con una intención que existe: preguntar lleva a un contexto, no a nada');
}

/* ---------------------------------------------------------------------------
   7 · 🚨 LA IA NO HACE NADA SOLA (apartados 7, 15 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Lo que la IA no puede hacer');
  eq(ACCIONES_PROHIBIDAS.map((a) => a.id),
    ['comprar', 'crear_objetivo', 'cambiar_preferencia', 'eliminar', 'cambiar_config'],
    'las cinco del apartado 15');
  eq(auditarIA().sinMotivo, [], '⚠️ y cada una con su motivo, no como una advertencia suelta');
  eq(puedeLaIA('comprar').puede, false, '🚨 no puede comprar');
  ok(/su dinero/.test(puedeLaIA('comprar').porque), 'y se dice por qué');
  eq(puedeLaIA('eliminar').puede, false, '🚨 ni borrar');
  ok(/Ni con papelera/.test(puedeLaIA('eliminar').porque), 'ni con papelera: borrar es suyo');
  eq(puedeLaIA('crear_objetivo').puede, false,
    '🚨 apartado 7 — ni crear un objetivo, ni marcarlo como completado');
  eq(puedeLaIA('sugerir').puede, true, 'lo que no está prohibido, sí');
  ok(!accionProhibida('inventada'), 'se buscan por id');

  /* Apartado 16 — proponer sí, aplicar solo si él aprieta. */
  const p = proponer('¿Quieres guardar esta preferencia?', { dato: 'familia_fresca' });
  eq(p.seAplicaSola, false, '🚨 ⚠️ una acción sugerida NO se aplica sola: eso sería una acción');
  eq(p.botones.map((b) => b.etiqueta), ['Guardar', 'No guardar'], 'con los dos botones del enunciado');
  ok(p.botones.find((b) => b.id === 'no').porDefecto,
    '⚠️ y el que está por defecto es "No guardar": lo que cambia sus datos se elige a propósito');
}

/* ---------------------------------------------------------------------------
   8 · LA MEMORIA, LOS CASOS Y EL VEREDICTO (13, 17 y 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Memoria, casos y veredicto');
  eq(MEMORIA_IA.existe, false, '⚠️ apartado 13 — JC Fitness no guarda las conversaciones');
  ok(/no queda nada/.test(MEMORIA_IA.porque), 'con el motivo: cada pregunta va y vuelve');
  ok(/prefiere perfumes frescos/i.test(MEMORIA_IA.siAlgunDia),
    '⚠️ y qué se guardaría si algún día la hubiera: la preferencia, no la conversación');

  eq(CASOS_IA.length, 7, 'los siete casos del apartado 18');
  ok(CASOS_IA.every((c) => !!c.espera), 'cada uno con lo que debe pasar');
  ok(/NULO/.test(casoIA('desactivada').espera),
    '🚨 el más importante: si desactiva la personalización, contexto NULO, no "menos datos"');
  ok(/Gana la última/.test(casoIA('contradictorias').espera),
    '⚠️ y con preferencias contradictorias gana la última que él dijo, sin promedios inventados');
  ok(!casoIA('inventado'), 'se buscan por id');

  eq(APARTADOS_IA.length, 18, 'los dieciocho apartados');
  eq(auditarIA().apartadosSinCumplir, [13], '⚠️ uno sin cumplir: la memoria, que no existe');
  eq(auditarIA().sinDonde, [], 'y todos dicen dónde se contestan');
  ok(/no existe/.test(apartadoIA(13).donde), 'incluido el que no se cumple');

  const panel = panelIA();
  eq(panel.esUnAsesor, true, '🎯 se comporta como un asesor opcional, no como un sistema que manda');
  ok(/asesor personal opcional/.test(panel.condicion), 'con la condición de finalización');
  ok(/usuario decide/.test(TEXTOS_CONDICION.ideal), 'y la experiencia ideal: sugiere, valora, decide');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
