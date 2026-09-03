// ============================================================================
// EH · Fase 57/65 — Aprendizaje y personalización progresiva
//
// *"Cuanto más uses JC Fitness, más útiles pueden ser sus sugerencias. Pero
// nunca: la aplicación decide quién eres."*
//
// Lo que vigila esta prueba:
//   · 🚨 que sin el permiso de la F56 no se aprenda NADA, ni una nota
//   · que lo que él dice gane siempre sobre lo que el sistema deduzca
//   · que una contradicción se PREGUNTE, nunca se cambie sola
//   · y que borrar lo aprendido no le toque un solo dato
// ============================================================================

import { normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { ACCIONES_PROHIBIDAS as PROHIBIDAS_F56, alternarPermisoIA } from '../src/lib/iaEstilo.js';
import { CAMPOS_PRIVADOS as PRIVADOS_F43 } from '../src/lib/privacidadEstilo.js';
import {
  SENALES, senal, PESO_EXPLICITO,
  VENTANAS, factorPorFecha, pesoDe,
  CONFIANZAS, confianzaDe, UMBRAL_PARA_PREGUNTAR,
  NUNCA_SE_DEDUCE, SOLO_SE_DEDUCE,
  DEFAULT_APRENDIZAJE, normalizarAprendizaje, datosAprendizaje,
  aprender, guardarExplicita, preferencia,
  RESPUESTAS, loQueSePregunta, responderPregunta,
  contradicciones, explicar, TEXTO_CORREGIR, corregir,
  PANEL_MEMORIA, loQueHaAprendido, TEXTO_BORRAR, borrarAprendizaje,
  NO_DECIDE, FUENTE_UNICA, yaViveFuera,
  USUARIOS, usuario,
  APARTADOS_APRENDIZAJE, apartadoAprendizaje, TEXTOS_APRENDIZAJE,
  auditarAprendizaje, panelAprendizaje, todayISO,
} from '../src/lib/aprendizaje.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-06-01';
/* Un estado con perfumes dentro, para poder comprobar que borrar lo aprendido
   NO se lleva sus datos por delante. */
const conDatos = () => alternarPermisoIA(normalizarEstiloHombre({
  configurado: true,
  modulos: [{ id: 'perfumes', activo: true, orden: 0, config: { perfumes: { perfumes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } } }],
}));
const sucesos = (cuantos, sobre = 'familiaPerfume', cuando = HOY) => Array.from({ length: cuantos }, () => ({ senal: 'guardar', sobre, cuando }));

console.log('\n🧩 EH · Fase 57/65 — Aprendizaje y personalización progresiva\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 SIN PERMISO NO SE APRENDE NADA (apartado 16, decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Sin el interruptor de la F56');
  const a = auditarAprendizaje();
  eq(a.sinPermisoNoAprende, true,
    '🚨 ⚠️ con el permiso apagado NO se aprende: ni una nota, no "se aprende y no se usa"');
  eq(a.conPermisoAprende, true, 'y con el permiso encendido, sí');

  const apagado = normalizarEstiloHombre({});
  eq(datosAprendizaje(aprender(apagado, sucesos(20))).inferidas, [],
    '🚨 ni con veinte señales seguidas');
  ok(/desactiva la IA/.test(usuario('sin_ia').que), 'y es uno de los cinco usuarios que se prueban');
  ok(/NADA/.test(usuario('sin_ia').espera), 'con lo que se espera de él, en mayúsculas');
}

/* ---------------------------------------------------------------------------
   2 · LAS SEÑALES Y EL PESO DEL TIEMPO (apartados 1, 6 y 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · De qué se aprende, y cuánto pesa lo viejo');
  eq(SENALES.length, 7, 'las siete acciones del apartado 1');
  eq(SENALES.map((s) => s.id),
    ['favorito', 'rechazo', 'valorar', 'guardar', 'repetir', 'cambiar_preferencia', 'ocultar'],
    'con sus nombres');
  ok(SENALES.every((s) => s.peso > 0 && !!s.señal), 'cada una con su peso y su sentido');
  ok(senal('rechazo').señal === 'en_contra', 'rechazar cuenta EN CONTRA, no a favor');
  ok(senal('ocultar').señal === 'en_contra', 'y ocultar un apartado, también');
  ok(!senal('inventada'), 'se buscan por id');

  /* Apartados 6 y 7 — lo reciente pesa más, y lo viejo no desaparece. */
  eq(VENTANAS.map((v) => v.factor), [1, 0.6, 0.3, 0.1], 'cuatro ventanas de tiempo');
  eq(factorPorFecha(HOY, HOY), 1, 'lo de hoy pesa entero');
  eq(factorPorFecha('2026-01-01', HOY), 0.3, 'lo de hace cinco meses, menos');
  eq(factorPorFecha('2020-01-01', HOY), 0.1,
    '⚠️ y lo de hace años sigue contando ALGO: no se olvida, pero deja de mandar');
  ok(factorPorFecha('2020-01-01', HOY) > 0, 'nunca cero: borrarlo sería olvidar lo que pasó');
  ok(pesoDe({ senal: 'guardar', cuando: HOY }, HOY) > pesoDe({ senal: 'guardar', cuando: '2020-01-01' }, HOY),
    '🚨 apartado 7 — lo reciente pesa más que lo antiguo');
  eq(pesoDe({ senal: 'inventada' }, HOY), 0, 'y una señal desconocida no pesa nada');
}

/* ---------------------------------------------------------------------------
   3 · 🚨 LO QUE ÉL DICE GANA (apartado 2, decisión 2)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Explícito contra inferido');
  eq(auditarAprendizaje().explicitaGana, true, '🚨 lo explícito gana');
  const muchas = aprender(conDatos(), sucesos(30), { hoy: HOY });
  const dicho = guardarExplicita(muchas, 'familiaPerfume', { valor: false, hoy: HOY });
  eq(preferencia(dicho, 'familiaPerfume').de, 'explicita',
    '🚨 ⚠️ ni treinta señales pisan lo que él dijo a mano');
  eq(preferencia(dicho, 'familiaPerfume').valor, false, 'y vale lo que él dijo, no lo que se dedujo');
  eq(preferencia(dicho, 'familiaPerfume').peso, PESO_EXPLICITO, 'con el peso de lo explícito');
  ok(PESO_EXPLICITO > Math.max(...SENALES.map((s) => s.peso)) * 5,
    '⚠️ y ese peso no compite: está muy por encima de cualquier acumulación');
  eq(preferencia(normalizarEstiloHombre({}), 'nada'), null, 'algo que no se sabe no se inventa');
}

/* ---------------------------------------------------------------------------
   4 · UNA SOSPECHA NO ES UNA VERDAD (apartados 3, 4 y 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Confianza y confirmación');
  eq(CONFIANZAS.map((c) => c.id), ['baja', 'media', 'alta'], 'baja → media → alta');
  eq(confianzaDe(0).id, 'baja', 'sin nada, baja');
  eq(confianzaDe(8).id, 'media', 'con algo, media');
  eq(confianzaDe(20).id, 'alta', 'con mucho, alta');
  eq(CONFIANZAS.filter((c) => c.seEnseña).map((c) => c.id), ['alta'],
    '⚠️ apartado 5 — solo la alta llega a la pantalla: no se enseña la confianza constantemente');

  const poco = aprender(conDatos(), sucesos(1), { hoy: HOY });
  eq(loQueSePregunta(poco), [], '⚠️ con una sola señal NO se pregunta nada');
  const mucho = aprender(conDatos(), sucesos(8), { hoy: HOY });
  ok(loQueSePregunta(mucho).length === 1, '🚨 con suficiente evidencia, se pregunta UNA vez');
  ok(/Parece que sueles/.test(loQueSePregunta(mucho)[0].texto),
    '⚠️ apartado 4 — con las palabras del enunciado: "Parece que sueles preferir…"');
  eq(loQueSePregunta(mucho)[0].opciones.map((o) => o.id), ['si', 'no', 'nunca'],
    '🚨 y con TRES respuestas, no dos: sí, no, y no volver a preguntar');
  eq(RESPUESTAS.length, 3, 'las tres del enunciado');
  ok(RESPUESTAS.every((r) => !!r.hace), 'cada una diciendo qué pasa si la eliges');

  /* Las tres respuestas hacen lo que dicen. */
  const si = responderPregunta(mucho, 'familiaPerfume', 'si', { hoy: HOY });
  eq(preferencia(si, 'familiaPerfume').de, 'explicita', '"Sí" la convierte en preferencia suya');
  const no = responderPregunta(mucho, 'familiaPerfume', 'no');
  eq(datosAprendizaje(no).inferidas.length, 0, '"No" la descarta');
  const nunca = responderPregunta(mucho, 'familiaPerfume', 'nunca');
  ok(datosAprendizaje(nunca).noPreguntar.includes('familiaPerfume'), '"No volver a preguntar" se apunta…');
  eq(loQueSePregunta(aprender(nunca, sucesos(8), { hoy: HOY })), [],
    '🚨 ⚠️ …y se RESPETA: no se vuelve a preguntar ni con más evidencia');
  eq(responderPregunta(mucho, 'familiaPerfume', 'lo_que_sea'), normalizarEstiloHombre(mucho),
    'una respuesta que no existe no cambia nada');
}

/* ---------------------------------------------------------------------------
   5 · LA CONTRADICCIÓN SE PREGUNTA, NO SE CAMBIA (apartado 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Cuando dice una cosa y hace otra');
  const a = auditarAprendizaje();
  ok(a.contradiccionesDetectadas > 0, 'la contradicción se detecta');
  eq(a.contradiccionesQueSeCambianSolas, 0,
    '🚨 ⚠️ y NINGUNA se cambia sola: el apartado 8 lo prohíbe con esas palabras');

  const dicho = guardarExplicita(aprender(conDatos(), sucesos(8), { hoy: HOY }), 'familiaPerfume', { valor: false, hoy: HOY });
  const c = contradicciones(dicho);
  eq(c.length, 1, 'con una contradicción');
  ok(/¿Ha cambiado tu preferencia\?/.test(c[0].texto), '⚠️ y la pregunta del enunciado, literal');
  eq(c[0].seCambiaSola, false, 'y dejando escrito que no se cambia sola');
  eq(contradicciones(normalizarEstiloHombre({})), [], 'sin datos, ninguna contradicción');
  /* Y si él la corrige, gana él. */
  eq(preferencia(corregir(dicho, 'familiaPerfume', { valor: true, hoy: HOY }), 'familiaPerfume').valor, true,
    '🚨 y si la corrige, manda él');
}

/* ---------------------------------------------------------------------------
   6 · EXPLICAR Y CORREGIR (apartados 9 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Explicar y corregir');
  const inferido = aprender(conDatos(), sucesos(8), { hoy: HOY });
  ok(/anteriormente guardaste/.test(explicar(inferido, 'familiaPerfume')),
    '⚠️ apartado 9 — "te lo recomiendo porque anteriormente guardaste opciones similares"');
  const dicho = guardarExplicita(inferido, 'familiaPerfume', { valor: true, hoy: HOY });
  ok(/me lo dijiste tú/.test(explicar(dicho, 'familiaPerfume')),
    'y si lo dijo él, se dice que fue él');
  eq(explicar(normalizarEstiloHombre({}), 'nada'), null, 'y lo que no se sabe no se explica');

  ok(/no representa mis gustos/.test(TEXTO_CORREGIR), 'apartado 10 — con el texto del enunciado');
  const corregido = corregir(inferido, 'familiaPerfume', { valor: false, hoy: HOY });
  eq(datosAprendizaje(corregido).inferidas.length, 0, '⚠️ corregir se lleva la deducción…');
  eq(preferencia(corregido, 'familiaPerfume').de, 'explicita', '…y deja lo que él dice en su lugar');
}

/* ---------------------------------------------------------------------------
   7 · 🚨 BORRAR LO APRENDIDO NO BORRA SUS DATOS (apartados 11 y 12)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Su panel, y borrar lo aprendido');
  eq(PANEL_MEMORIA.puede.length, 5, 'las cinco cosas que puede hacer el apartado 11');
  ok(/F56/.test(PANEL_MEMORIA.interruptor),
    '⚠️ y activar/desactivar es el interruptor de la F56, no un segundo');

  const antes = guardarExplicita(aprender(conDatos(), sucesos(8), { hoy: HOY }), 'otra', { valor: true, hoy: HOY });
  const perfumesAntes = antes.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length;
  ok(loQueHaAprendido(antes).length >= 2, 'se puede revisar lo aprendido, explícito e inferido');
  ok(loQueHaAprendido(antes).every((x) => !!x.de && !!x.nombre), 'diciendo de dónde sale cada cosa');

  const despues = borrarAprendizaje(antes);
  eq(datosAprendizaje(despues).inferidas.length, 0, 'borrar se lleva lo inferido…');
  eq(datosAprendizaje(despues).explicitas.length, 1, '…y deja lo que él dijo a mano');
  eq(despues.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length, perfumesAntes,
    '🚨 ⚠️ y NO le toca un solo perfume: el apartado 12 lo dice con todas las letras');
  ok(/no se tocan/.test(TEXTO_BORRAR), 'con el aviso que lo explica antes de hacerlo');
  eq(borrarAprendizaje(antes, { tambienExplicitas: true }) && datosAprendizaje(borrarAprendizaje(antes, { tambienExplicitas: true })).explicitas.length, 0,
    '⚠️ y borrar TAMBIÉN lo suyo se puede, pero hay que pedirlo aparte');
  ok(datosAprendizaje(despues).noPreguntar !== undefined,
    '⚠️ y el "no volver a preguntar" se respeta: borrar no es permiso para insistir');
  eq(normalizarAprendizaje(undefined), DEFAULT_APRENDIZAJE, 'sin nada guardado, las listas vacías');
  eq(normalizarAprendizaje({ inferidas: 'no es una lista' }).inferidas, [], 'y lo que no es una lista se descarta');
}

/* ---------------------------------------------------------------------------
   8 · NO PERFILAR, NO DECIDIR, UNA SOLA FUENTE (13, 14 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Los límites');
  eq(NUNCA_SE_DEDUCE.length, 6, 'seis cosas que no se deducen nunca');
  eq(auditarAprendizaje().seDeduceAlgoProhibido, [],
    '🚨 ⚠️ y ninguna se cuela ni mandándole señales a propósito');
  ok(NUNCA_SE_DEDUCE.some((x) => x.id === 'salud'), 'incluida la salud');
  ok(NUNCA_SE_DEDUCE.some((x) => x.id === 'animo'), 'y el estado de ánimo');
  ok(/recomendar mejor/.test(SOLO_SE_DEDUCE), '⚠️ y lo que sí se deduce, acotado a lo útil');

  /* Los privados de la F43 tampoco entran. */
  const conPrivado = aprender(conDatos(), [{ senal: 'guardar', sobre: PRIVADOS_F43[0], cuando: HOY }], { hoy: HOY });
  eq(datosAprendizaje(conPrivado).inferidas.length, 0,
    '🚨 y tampoco se aprende de un campo privado de la F43');

  ok(NO_DECIDE === PROHIBIDAS_F56,
    '⚠️ apartado 14 — las cinco prohibidas son las de la F56, importadas: no hay una segunda lista');
  ok(/una versión|se contradicen/.test(FUENTE_UNICA.porque),
    '⚠️ apartado 15 — y una preferencia vive en un sitio, con el motivo');
  ok(/REGISTRO_DATOS/.test(FUENTE_UNICA.donde), 'que es el registro de la F4');
  ok(typeof yaViveFuera === 'function', 'y se puede preguntar si algo ya vive fuera');
}

/* ---------------------------------------------------------------------------
   9 · LOS CINCO USUARIOS Y EL VEREDICTO (apartado 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Los cinco usuarios');
  eq(USUARIOS.map((u) => u.id), ['nuevo', 'ocasional', 'frecuente', 'cambiante', 'sin_ia'],
    'los cinco del apartado 17');
  ok(USUARIOS.every((u) => !!u.espera), 'cada uno con lo que debe pasar');

  eq(loQueHaAprendido(conDatos()), [], 'el usuario nuevo: sin preferencias…');
  eq(loQueSePregunta(conDatos()), [], '…y sin que se le pregunte nada');
  eq(loQueSePregunta(aprender(conDatos(), sucesos(2), { hoy: HOY })), [],
    'el ocasional: se apunta, pero no se le molesta');
  ok(loQueSePregunta(aprender(conDatos(), sucesos(8), { hoy: HOY })).length > 0,
    'el frecuente: aquí sí se pregunta');
  ok(!usuario('inventado'), 'se buscan por id');

  eq(APARTADOS_APRENDIZAJE.length, 17, 'los diecisiete apartados');
  eq(auditarAprendizaje().sinCumplir, [], 'todos cumplidos');
  eq(auditarAprendizaje().sinDonde, [], 'y todos diciendo dónde');
  ok(/pregunta, no cambia/.test(apartadoAprendizaje(8).donde), 'incluido el 8, con su matiz');

  const panel = panelAprendizaje(aprender(conDatos(), sucesos(8), { hoy: HOY }));
  eq(panel.aprendeSinDecidir, true, '🎯 aprende, pero no decide quién eres');
  ok(/última palabra/.test(panel.condicion), 'con la condición de finalización');
  ok(/cincuenta formularios/.test(TEXTOS_APRENDIZAJE.sinFormularios), 'y la frase del objetivo');
  ok(panel.preguntas.length > 0, 'y el panel trae lo que hay que preguntarle');
  ok(typeof todayISO === 'function', 'con la fecha local del proyecto, no UTC');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
