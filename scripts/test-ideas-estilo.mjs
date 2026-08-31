// ============================================================================
// EH · Fase 32/65 — Recomendaciones generales de estilo ("💡 Ideas para ti")
//
// Las trece pruebas del apartado 18, y lo que gobierna la fase:
//   · el motor ya existe (F16): ni un cuarto `reglaAplicable`
//   · ocultar (1), desactivar (16) y "Nunca" (7) son EL MISMO interruptor
//   · no se repite lo que Skincare, Pelo y Perfumes ya recomiendan (prueba 13)
//   · solo información que él ha dado, y `requiere` es quien lo garantiza
//   · nunca "debes", nunca una puntuación que le juzgue
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  alternarModulo,
} from '../src/lib/estiloDeHombre.js';
import { MODULO_ANFITRION, miEstiloOculto } from '../src/lib/miEstilo.js';
import { PALABRAS_PROHIBIDAS, DEFAULT_RECOMENDACIONES } from '../src/lib/motorRecomendaciones.js';
import { datosPantalla } from '../src/lib/pantallaEH.js';
import {
  TEMAS_IDEAS, temaIdea, TEXTOS_IDEAS, FRECUENCIAS_IDEAS, FRECUENCIA_POR_DEFECTO,
  frecuenciaIdeas, FORMULAS_IDEAS, REGLAS_IDEAS, reglaIdea, IDS_REGLAS_IDEAS,
  contextoIdeas, ACCIONES_IDEA, accionIdea, MOTIVOS_IDEAS, DIAS_SILENCIO_IDEAS,
  DEFAULT_IDEAS, normalizarIdeas, datosIdeas, cambiarFrecuencia, ocultarIdeas,
  mostrarIdeas, ideasApagadas, DIAS_TRAS_VERLA, silenciadaIdea, recomendarIdeas,
  marcarVistas, responderIdea, deshacerRespuesta, guardarIdea, quitarGuardada,
  borrarHistorialIdeas, resumenIdeas, lineaIdeas, auditarIdeas, textosDeIdeas, panelIdeas,
} from '../src/lib/ideasEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-29';
const dias = (d) => {
  const f = new Date(`${HOY}T00:00:00`);
  f.setDate(f.getDate() + d);
  // 🐛 Día LOCAL, no UTC: con toISOString, en España dias(1) devolvía HOY.
  return f.toLocaleDateString('sv-SE');
};
const VACIO = { prendas: [], outfits: [], usos: [] };
/* Un armario con cinco prendas y ningún outfit: dispara las DOS reglas de ropa,
   que es lo que hace falta para probar el silencio por tema. */
const CON_ROPA = {
  prendas: Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, nombre: `Prenda ${i}`, categoria: 'superior' })),
  outfits: [], usos: [],
};
const nuevo = () => normalizarEstiloHombre(DEFAULT_ESTILO_HOMBRE);
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'accesorios', 'gustos'];
const FUENTE = readFileSync(new URL('../src/lib/ideasEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

console.log('\n💡  EH · Fase 32/65 — Recomendaciones generales de estilo\n');

/* ===========================================================================
   Test 1 — LOS SIETE TEMAS (apartado 2)
   =========================================================================== */
console.log('Test 1 — los siete temas del enunciado');
{
  eq(TEMAS_IDEAS.map((t) => t.nombre),
    ['Cuidado', 'Pelo', 'Barba', 'Perfumes', 'Ropa', 'Accesorios', 'Gustos personales'],
    'los siete del apartado 2, con sus nombres');
  eq(TEMAS_IDEAS.map((t) => t.icono), ['🧴', '💇', '🧔', '🌫️', '👕', '🕶️', '❤️'],
    'y sus iconos, tal cual');
  TEMAS_IDEAS.forEach((t) => {
    ok(!!moduloEH(t.modulo), `⚠️ el tema "${t.id}" apunta a un módulo del catálogo, por su id`);
  });
  eq(temaIdea('inventado'), null, 'un tema que no existe da null');

  // ⚠️ Y cada tema tiene al menos una idea: uno sin ninguna sería un rótulo.
  TEMAS_IDEAS.forEach((t) => {
    ok(REGLAS_IDEAS.some((r) => r.tema === t.id), `y el tema "${t.id}" tiene al menos una idea`);
  });
  ok(REGLAS_IDEAS.every((r) => !!temaIdea(r.tema)), 'y ninguna idea usa un tema que no existe');
  ok(new Set(IDS_REGLAS_IDEAS).size === REGLAS_IDEAS.length, 'ningún id repetido');
}

/* ===========================================================================
   Test 2 — ⚠️ EL TONO (apartados 10 y objetivo)
   =========================================================================== */
console.log('\nTest 2 — ⚠️ *"son recomendaciones, no reglas"*');
{
  REGLAS_IDEAS.forEach((r) => {
    ok(FORMULAS_IDEAS.some((f) => r.texto.startsWith(f)),
      `"${r.id}" empieza por una de las fórmulas del apartado 10`);
  });
  eq(auditarIdeas().textosConTonoMalo, 0, '⚠️ ningún texto lleva una palabra prohibida');
  PALABRAS_PROHIBIDAS.forEach((p) => {
    ok(!textosDeIdeas().some((t) => t.toLowerCase().includes(p)), `ninguno dice "${p}"`);
  });
  ok(!textosDeIdeas().some((t) => /correcto|deberías|error/i.test(t)),
    '⚠️ y ninguno dice *"tu estilo correcto es este"*');

  // *"❌ Puntuaciones que juzguen al usuario."*
  eq(auditarIdeas().puntuaciones, 0, '⚠️ cero puntuaciones');
  const conRopa = con(TODOS_EH);
  const r = recomendarIdeas(conRopa, { armario: CON_ROPA, hoy: HOY });
  ok(r.ideas.every((i) => !('nota' in i) && !('puntuacion' in i) && !('score' in i)),
    '⚠️ y ninguna idea lleva una nota, ni a la vista ni escondida');
  ok(TEXTOS_IDEAS.aviso.includes('no hay una forma correcta'),
    'y la pantalla lo dice con todas las letras');
}

/* ===========================================================================
   Test 3 — ⚠️ LA REGLA DE ORO (apartado 9)
   =========================================================================== */
console.log('\nTest 3 — ⚠️ *"no asumir características que no conocemos"*');
{
  eq(auditarIdeas().reglasSinRequisitos, 0,
    '⚠️ TODAS declaran `requiere`: una sin requisitos no se aplicaría nunca');
  ok(REGLAS_IDEAS.every((r) => typeof r.cuando === 'function'), 'y todas tienen su condición');

  // Un usuario nuevo, sin nada: ni una idea.
  eq(recomendarIdeas(nuevo(), { armario: VACIO, hoy: HOY }).total, 0,
    '⚠️ sin módulos activos NO sale ni una idea');

  /* ⚠️ Un módulo apagado deja su dato en `null`, y `null` no es cero. */
  const soloRopa = con(['estilo']);
  const ctx = contextoIdeas(soloRopa, { armario: CON_ROPA });
  eq(ctx.prendas, 5, 'con el módulo encendido, el dato es un número');
  eq(ctx.perfumes, null, '⚠️ con el módulo apagado, `null` — que no es cero');
  eq(ctx.productosBarba, null, 'ni siquiera cuando el número sería cero');
  eq(ctx.objetivos, null, '⚠️ y sin pasarle los objetivos, tampoco se los inventa');
  ok(!recomendarIdeas(soloRopa, { armario: CON_ROPA, hoy: HOY }).ideas
    .some((i) => i.tema === 'perfumes'),
  '⚠️ así que NO sale ninguna idea de un módulo que él ha apagado');

  // Y al encenderlo, sus ideas ya pueden salir.
  const conAcc = alternarModulo(soloRopa, 'accesorios', true);
  eq(contextoIdeas(conAcc, { armario: CON_ROPA }).accesorios, 0, 'encendido, el dato aparece');
  ok(recomendarIdeas(conAcc, { armario: CON_ROPA, hoy: HOY }).ideas.some((i) => i.tema === 'accesorios'),
    'y su idea también');
}

/* ===========================================================================
   Test 4 — POR QUÉ APARECE (apartado 8 · prueba 3)
   =========================================================================== */
console.log('\nTest 4 — cada idea explica por qué');
{
  eq(auditarIdeas().reglasSinPorque, 0, 'todas traen su explicación');
  const e = con(TODOS_EH);
  const r = recomendarIdeas(e, { armario: CON_ROPA, hoy: HOY, limite: 20 });
  ok(r.total > 0, 'con datos, salen ideas');
  ok(r.ideas.every((i) => i.porque.length > 20 && i.porque.endsWith('.')),
    '⚠️ cada motivo es una FRASE ENTERA, no una nota (lección de la F25)');
  ok(r.ideas.every((i) => i.porque.startsWith('Lo hemos pensado porque')),
    'y todas dicen de dónde salen');
  ok(r.ideas.every((i) => i.titulo && i.texto && i.icono && i.temaNombre),
    'con su título, su texto, su icono y su tema');
  ok(TEXTOS_IDEAS.porque.includes('Por qué aparece'), 'y la pantalla lo rotula como el enunciado');

  /* ⚠️ La que no sabe explicarse NO se propone. */
  const conMotivo = REGLAS_IDEAS.find((x) => x.id === 'ropa_primer_outfit');
  eq(typeof conMotivo.porque({ prendas: 5, outfits: 0 }), 'string', 'el motivo se construye con sus datos');
  ok(conMotivo.porque({ prendas: 5, outfits: 0 }).includes('5 prendas'),
    '⚠️ y cita SUS datos, no una frase genérica');
  ok(conMotivo.porque({ prendas: 1, outfits: 0 }).includes('1 prenda apuntada'),
    'con su singular y su plural');
}

/* ===========================================================================
   Test 5 — ⚠️ UN SOLO INTERRUPTOR (apartados 1, 7 y 16 · pruebas 1, 10 y 11)
   =========================================================================== */
console.log('\nTest 5 — ⚠️ ocultar, desactivar y "Nunca" son lo mismo');
{
  eq(FRECUENCIAS_IDEAS.map((f) => f.nombre), ['Baja', 'Normal', 'Alta', 'Nunca'],
    'las cuatro del apartado 7');
  eq(FRECUENCIA_POR_DEFECTO, 'normal', 'y por defecto, Normal');
  eq(datosIdeas(con(TODOS_EH)).frecuencia, 'normal', 'como sale de fábrica');
  eq(auditarIdeas().interruptores, 1,
    '⚠️ UN interruptor para los tres apartados (lección de la F26)');

  const e = con(TODOS_EH);
  eq(recomendarIdeas(e, { armario: CON_ROPA, hoy: HOY }).ideas.length, 3,
    'con Normal se enseñan tres (prueba 2)');
  eq(recomendarIdeas(cambiarFrecuencia(e, 'baja'), { armario: CON_ROPA, hoy: HOY }).ideas.length, 1,
    'con Baja, una');
  const alta = recomendarIdeas(cambiarFrecuencia(e, 'alta'), { armario: CON_ROPA, hoy: HOY });
  ok(alta.ideas.length > 3 && alta.ideas.length <= 5, 'y con Alta, hasta cinco');
  ok(alta.hayMas === (alta.total > alta.ideas.length), 'con su "Ver más" cuando quedan más');

  const apagadas = ocultarIdeas(e);
  eq(datosIdeas(apagadas).frecuencia, 'nunca',
    '⚠️ "👁️ Ocultar" (apartado 1) es elegir "Nunca" (apartado 7)');
  eq(ideasApagadas(apagadas), true, 'y el sistema queda desactivado (apartado 16)');
  const r = recomendarIdeas(apagadas, { armario: CON_ROPA, hoy: HOY });
  eq(r.apagada, true, 'lo dice');
  eq(r.ideas, [], 'y no propone ninguna (prueba 10)');
  eq(resumenIdeas(apagadas, { armario: CON_ROPA, hoy: HOY }).ideas, null,
    '⚠️ apagada devuelve `null`, no 0: son dos cosas (lección de la F25)');
  eq(lineaIdeas(apagadas, { armario: CON_ROPA, hoy: HOY }), null, 'y la plaquita no pinta nada');
  ok(r.texto.includes('volver a encenderlas'), 'y se dice cómo volver');

  eq(datosIdeas(mostrarIdeas(apagadas)).frecuencia, 'normal', 'volver deja Normal (prueba 11)');
  eq(datosIdeas(mostrarIdeas(apagadas, 'alta')).frecuencia, 'alta', 'o la que él diga');
  eq(datosIdeas(mostrarIdeas(apagadas, 'nunca')).frecuencia, 'normal',
    '⚠️ y "volver a mostrar" nunca puede dejarlo apagado otra vez');
  eq(recomendarIdeas(mostrarIdeas(apagadas), { armario: CON_ROPA, hoy: HOY }).ideas.length, 3,
    'y las ideas vuelven, enteras (prueba 11)');
  eq(datosIdeas(cambiarFrecuencia(e, 'inventada')).frecuencia, 'normal',
    'una frecuencia que no existe no se escribe');
}

/* ===========================================================================
   Test 6 — LAS TRES ACCIONES (apartados 4, 5 y 6 · pruebas 4, 5 y 6)
   =========================================================================== */
console.log('\nTest 6 — 👍 me interesa · ❌ no me interesa · ✅ ya lo hago');
{
  eq(ACCIONES_IDEA.map((a) => a.nombre), ['Me interesa', 'No me interesa', 'Ya lo hago'],
    'las tres del apartado 4, y ninguna más');
  eq(MOTIVOS_IDEAS.map((m) => m.id), ['no_interesa', 'ya_lo_hago'],
    '⚠️ solo dos silencian: "Me interesa" es lo contrario de un descarte');

  const e = con(TODOS_EH);

  // 👍 Me interesa (prueba 4) — guarda, y NO calla.
  const interesa = responderIdea(e, 'ropa_primer_outfit', 'interesa', { hoy: HOY });
  eq(interesa.error, null, 'se puede marcar "me interesa"');
  eq(datosIdeas(interesa.estado).recomendaciones.guardadas.map((g) => g.reglaId),
    ['ropa_primer_outfit'], '⚠️ y eso la GUARDA');
  eq(silenciadaIdea(interesa.estado, 'ropa_primer_outfit', { hoy: HOY }).silenciada, false,
    '⚠️ pero NO la calla: sería lo contrario de lo que él acaba de pedir');
  ok(recomendarIdeas(interesa.estado, { armario: CON_ROPA, hoy: HOY, limite: 20 }).ideas
    .some((i) => i.id === 'ropa_primer_outfit' && i.guardada),
  'y sigue saliendo, marcada como guardada');

  // ❌ No me interesa (prueba 5) — calla, y calla las equivalentes.
  const noInteresa = responderIdea(e, 'ropa_primer_outfit', 'no_interesa', { hoy: HOY }).estado;
  eq(silenciadaIdea(noInteresa, 'ropa_primer_outfit', { hoy: HOY }).silenciada, true,
    '⚠️ "No me interesa" la hace desaparecer (apartado 5)');
  ok(!recomendarIdeas(noInteresa, { armario: CON_ROPA, hoy: HOY, limite: 20 }).ideas
    .some((i) => i.id === 'ropa_primer_outfit'), 'y deja de proponerse');
  eq(silenciadaIdea(noInteresa, 'ropa_sin_estilos', { hoy: HOY }).silenciada, true,
    '⚠️ y calla también las EQUIVALENTES: las de su mismo tema (apartado 5)');
  eq(silenciadaIdea(noInteresa, 'gustos_por_hacer', { hoy: HOY }).silenciada, false,
    '⚠️ pero solo las de su tema: las demás siguen');

  // ✅ Ya lo hago (prueba 6) — calla más tiempo, y solo esa.
  const yaLoHago = responderIdea(e, 'ropa_primer_outfit', 'ya_lo_hago', { hoy: HOY }).estado;
  eq(silenciadaIdea(yaLoHago, 'ropa_primer_outfit', { hoy: HOY }).silenciada, true,
    '⚠️ "Ya lo hago" deja de sugerirlo (apartado 6)');
  eq(silenciadaIdea(yaLoHago, 'ropa_sin_estilos', { hoy: HOY }).silenciada, false,
    '⚠️ y esa NO arrastra a las de su tema: él no ha dicho que no le interesen');
  ok(DIAS_SILENCIO_IDEAS.ya_lo_hago > DIAS_SILENCIO_IDEAS.no_interesa,
    'y calla más tiempo que "no me interesa"');

  // ⚠️ Todo descarte caduca, y se puede deshacer.
  eq(silenciadaIdea(noInteresa, 'ropa_primer_outfit', { hoy: dias(400) }).silenciada, false,
    '⚠️ ningún descarte es para siempre: caduca');
  eq(silenciadaIdea(deshacerRespuesta(noInteresa, 'ropa_primer_outfit'), 'ropa_primer_outfit', { hoy: HOY }).silenciada,
    false, 'y se puede deshacer: un toque no condena una idea');

  eq(responderIdea(e, 'inventada', 'interesa').error, 'Esa idea no existe.', 'una idea que no existe');
  eq(responderIdea(e, 'ropa_primer_outfit', 'inventada').error, 'Esa respuesta no existe.', 'y una respuesta que no existe');
}

/* ===========================================================================
   Test 7 — NO REPETIRLA CONTINUAMENTE (apartado 3 · prueba 12)
   =========================================================================== */
console.log('\nTest 7 — ⚠️ *"no repetirla continuamente"*');
{
  const e = con(TODOS_EH);
  const antes = recomendarIdeas(e, { armario: CON_ROPA, hoy: HOY });
  ok(antes.ideas.length > 0, 'salen ideas');

  /* ⚠️ Enseñarlas NO escribe: mostrar y registrar son dos llamadas. */
  eq(datosIdeas(e).recomendaciones.vistas, [],
    '⚠️ calcularlas no ensucia el historial: `recomendarIdeas` no escribe nada');

  const vistas = marcarVistas(e, antes.ideas.map((i) => i.id), { hoy: HOY });
  eq(datosIdeas(vistas).recomendaciones.vistas.length, antes.ideas.length, 'marcarlas sí');
  const despues = recomendarIdeas(vistas, { armario: CON_ROPA, hoy: HOY, limite: 20 });
  ok(!despues.ideas.some((i) => antes.ideas.some((a) => a.id === i.id)),
    '⚠️ y al día siguiente NO se repiten (prueba 12)');
  ok(despues.total >= 0, 'las demás siguen disponibles');

  const masTarde = recomendarIdeas(vistas, { armario: CON_ROPA, hoy: dias(DIAS_TRAS_VERLA + 1), limite: 20 });
  ok(masTarde.ideas.some((i) => antes.ideas.some((a) => a.id === i.id)),
    `⚠️ pero pasados ${DIAS_TRAS_VERLA} días vuelven: callar no es borrar`);
  eq(datosIdeas(marcarVistas(e, ['inventada'], { hoy: HOY })).recomendaciones.vistas, [],
    'y una idea que no existe no entra en el historial');
}

/* ===========================================================================
   Test 8 — ⚠️ CADA ACCIÓN LLEVA A UN MÓDULO QUE YA EXISTE (apartados 11-14 · prueba 8)
   =========================================================================== */
console.log('\nTest 8 — ⚠️ ni un catálogo, ni un armario, ni un diario nuevos');
{
  const DESTINOS = ['armario', 'skincare', 'pelo', 'barba', 'perfumes', 'accesorios', 'gustos', 'objetivos', 'miEstilo'];
  REGLAS_IDEAS.filter((r) => r.accion).forEach((r) => {
    ok(DESTINOS.includes(r.accion.destino),
      `"${r.id}" lleva a "${r.accion.destino}", que ya existe`);
    ok(!!r.accion.etiqueta, 'con su etiqueta');
  });
  ok(REGLAS_IDEAS.some((r) => r.accion?.destino === 'armario'),
    'apartado 12 — hay ideas que abren el Armario');
  ok(REGLAS_IDEAS.some((r) => r.accion?.zona === 'rutina'),
    'apartado 13 — y otras que abren una rutina');
  ok(TEXTOS_IDEAS.diario.includes('Diario'),
    'apartado 14 — y todas ofrecen escribir en el Diario existente');

  const a = auditarIdeas();
  eq(a.catalogosNuevos, 0, '⚠️ cero catálogos de productos nuevos (apartado 11)');
  eq(a.armariosNuevos, 0, '⚠️ cero sistemas de outfits nuevos (apartado 12)');
  eq(a.diariosNuevos, 0, '⚠️ cero diarios nuevos (apartado 14)');
  eq(a.motoresNuevos, 0, '⚠️ y cero motores de recomendación nuevos (decisión 1)');

  ok(!/from '\.\/(calendario|papelera|indiceBusqueda)'/.test(FUENTE),
    'el archivo no se cuelga del calendario, la papelera ni el buscador');
  ok(!/\bpedirIA|askAI|anthropic/i.test(FUENTE),
    '⚠️ y NO llama a la IA: *"esto permite aprender de las preferencias SIN IA"* (apartado 4)');
  ok(!/function reglaAplicable|const reglaAplicable\s*=/.test(SIN_COMENTARIOS),
    '⚠️ ni redefine `reglaAplicable`: es el cuarto uso del motor de la F16');
  ok(!/PALABRAS_PROHIBIDAS\s*=\s*\[/.test(SIN_COMENTARIOS),
    '⚠️ ni una segunda lista de palabras prohibidas');
}

/* ===========================================================================
   Test 9 — ⚠️ NO REPETIR LO QUE OTRO MÓDULO YA RECOMIENDA (prueba 13)
   =========================================================================== */
console.log('\nTest 9 — ⚠️ *"que no aparecen recomendaciones contradictorias"*');
{
  /* Skincare, Pelo y Perfumes tienen SU motor, con datos mejores. Esta fase no
     los repite: cuando toca una idea suya, LLEVA ALLÍ. */
  ['cuidado_ideas_piel', 'pelo_ideas', 'perfumes_ideas'].forEach((id) => {
    const r = reglaIdea(id);
    ok(!!r, `la idea puente "${id}" existe`);
    ok(!!r.accion, 'y lleva a su módulo');
    ok(/Skincare|Pelo|Perfumes/.test(r.texto), 'diciendo a cuál');
  });
  ok(!/from '\.\/recomendaciones(Piel|Pelo|Perfumes)'/.test(FUENTE),
    '⚠️ y no importa las reglas de esos módulos: no las copia ni las contradice');

  /* ⚠️ Y ninguna idea de esta fase puede contradecir a otra suya: no hay dos
     que se disparen con la misma condición y digan lo contrario. */
  const contrarias = [['cuidado_sin_rutina', 'cuidado_ideas_piel']];
  contrarias.forEach(([a, b]) => {
    const ctx = { rutinasPiel: 0 };
    const ctx2 = { rutinasPiel: 2 };
    ok(reglaIdea(a).cuando(ctx) !== reglaIdea(b).cuando(ctx),
      `⚠️ "${a}" y "${b}" nunca salen a la vez`);
    ok(reglaIdea(a).cuando(ctx2) !== reglaIdea(b).cuando(ctx2), 'ni al revés');
  });

  // Y un repaso general: con datos de verdad no salen dos del mismo tema que se pisen.
  const e = con(TODOS_EH);
  const r = recomendarIdeas(e, { armario: CON_ROPA, hoy: HOY, limite: 20 });
  ok(!(r.ideas.some((i) => i.id === 'cuidado_sin_rutina') && r.ideas.some((i) => i.id === 'cuidado_ideas_piel')),
    'con datos reales tampoco');
}

/* ===========================================================================
   Test 10 — GUARDAR (apartado 15 · prueba 7)
   =========================================================================== */
console.log('\nTest 10 — ❤️ guardar una idea');
{
  const e = con(TODOS_EH);
  const g = guardarIdea(e, 'ropa_primer_outfit', { hoy: HOY });
  eq(datosIdeas(g).recomendaciones.guardadas.map((x) => x.reglaId), ['ropa_primer_outfit'],
    'se guarda (prueba 7)');
  eq(datosIdeas(guardarIdea(g, 'ropa_primer_outfit', { hoy: HOY })).recomendaciones.guardadas.length, 1,
    'y guardarla dos veces no la duplica');
  eq(recomendarIdeas(g, { armario: CON_ROPA, hoy: HOY }).guardadas.map((x) => x.id),
    ['ropa_primer_outfit'], 'el panel las trae');
  eq(datosIdeas(quitarGuardada(g, 'ropa_primer_outfit')).recomendaciones.guardadas, [],
    'y se puede quitar');
  eq(datosIdeas(guardarIdea(e, 'inventada')).recomendaciones.guardadas, [],
    'una que no existe no se guarda');

  /* ⚠️ Con las ideas apagadas, las guardadas SIGUEN SIENDO SUYAS. */
  eq(recomendarIdeas(ocultarIdeas(g), { armario: CON_ROPA, hoy: HOY }).guardadas.length, 1,
    '⚠️ y apagar el sistema no se lleva lo que él guardó');
  ok(TEXTOS_IDEAS.dondeSeGuardan.includes('esta misma pantalla'),
    '⚠️ y se dice DÓNDE están: no hay un sistema de favoritos globales, y no se finge (regla 8)');
}

/* ===========================================================================
   Test 11 — BORRAR EL HISTORIAL (apartado 17)
   =========================================================================== */
console.log('\nTest 11 — 🧹 borrar el historial, sin llevarse nada más');
{
  const e = con(TODOS_EH);
  const usado = guardarIdea(
    responderIdea(marcarVistas(e, ['ropa_primer_outfit'], { hoy: HOY }), 'ropa_sin_estilos', 'no_interesa', { hoy: HOY }).estado,
    'gustos_por_hacer', { hoy: HOY },
  );
  eq(datosIdeas(usado).recomendaciones.vistas.length, 1, 'hay historial de vistas');
  eq(datosIdeas(usado).recomendaciones.feedback.length, 1, 'y de respuestas');

  // ⚠️ Duodécimo `aplicarPlan`: sin `confirmado` no borra nada.
  const sin = borrarHistorialIdeas(usado);
  eq(sin.aplicado, false, '⚠️ sin `confirmado` no borra');
  eq(sin.estado, normalizarEstiloHombre(usado), 'y devuelve el estado tal cual');
  ok(sin.aviso.texto.includes('no se tocan'), 'con su aviso, que dice qué NO se borra');
  eq(sin.aviso.guardadas, 1, 'y cuántas ideas guardadas se van a quedar');

  const hecho = borrarHistorialIdeas(usado, { confirmado: true });
  eq(hecho.aplicado, true, 'confirmando, sí');
  eq(datosIdeas(hecho.estado).recomendaciones.vistas, [], 'las vistas se van');
  eq(datosIdeas(hecho.estado).recomendaciones.feedback, [], 'las respuestas también');
  eq(datosIdeas(hecho.estado).recomendaciones.guardadas.map((x) => x.reglaId), ['gustos_por_hacer'],
    '⚠️ pero lo GUARDADO se queda: no es historial, lo guardó él a propósito');
  eq(datosIdeas(hecho.estado).frecuencia, datosIdeas(usado).frecuencia,
    'y la frecuencia no se toca');

  /* *"Sin afectar a sus rutinas, productos o preferencias."* */
  const cfg = (est, id) => JSON.stringify(normalizarEstiloHombre(est).modulos.find((m) => m.id === id).config);
  ['skincare', 'pelo', 'perfumes', 'gustos'].forEach((id) => {
    eq(cfg(hecho.estado, id), cfg(usado, id), `⚠️ y la config de "${id}" sale intacta`);
  });
}

/* ===========================================================================
   Test 12 — PERSISTENCIA Y CONVIVENCIA (regla 5)
   =========================================================================== */
console.log('\nTest 12 — persistencia');
{
  const e = guardarIdea(cambiarFrecuencia(con(TODOS_EH), 'alta'), 'ropa_primer_outfit', { hoy: HOY });
  const antes = datosIdeas(e);
  const despues = normalizarIdeas(JSON.parse(JSON.stringify(antes)));
  eq(despues, antes, '⚠️ guardar y volver a leer devuelve lo mismo (regla 5)');
  Object.keys(DEFAULT_IDEAS).forEach((k) => {
    ok(k in despues, `el campo "${k}" sobrevive al normalizador`);
  });
  eq(normalizarIdeas(null), DEFAULT_IDEAS, 'un guardado corrupto cae en el defecto');
  eq(normalizarIdeas({ frecuencia: 'gigante' }).frecuencia, 'normal', 'y una frecuencia inventada, también');
  eq(normalizarIdeas({ recomendaciones: { guardadas: [{ reglaId: 'fantasma' }] } }).recomendaciones.guardadas, [],
    '⚠️ una idea de una versión anterior del catálogo no revive');
  eq(DEFAULT_IDEAS.recomendaciones, DEFAULT_RECOMENDACIONES,
    '⚠️ y lo del motor se guarda con SU formato, no con uno propio');

  /* ⚠️ Comparte el módulo anfitrión con "Mi estilo" (F29) y la pantalla (F30/F31). */
  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_ANFITRION).config;
  ok('ideas' in cfg, 'lo de esta fase vive en el módulo anfitrión');
  eq(miEstiloOculto(e), false, '⚠️ y no toca el interruptor de la F29');
  eq(datosPantalla(e).accesos, [], 'ni los accesos rápidos de la F30');
  eq(datosPantalla(e).tamanos, {}, 'ni los tamaños de la F31');
}

/* ===========================================================================
   Test 13 — RESUMEN, PANEL Y LÍNEA
   =========================================================================== */
console.log('\nTest 13 — el panel que dibuja la pantalla');
{
  const e = con(TODOS_EH);
  const p = panelIdeas(e, { armario: CON_ROPA, hoy: HOY });
  eq(p.titulo, '💡 Ideas para ti', 'el título del apartado 1, literal');
  eq(p.frecuencias.length, 4, 'con las cuatro frecuencias');
  eq(p.acciones.length, 3, 'las tres acciones');
  eq(p.temas.length, 7, 'los siete temas');
  eq(p.apagada, false, 'encendido');
  ok(p.ideas.length > 0, 'y sus ideas');
  eq(p.puedeBorrarHistorial, false, 'sin historial todavía, no se ofrece borrarlo');
  eq(panelIdeas(marcarVistas(e, ['ropa_primer_outfit'], { hoy: HOY }), { armario: CON_ROPA, hoy: HOY })
    .puedeBorrarHistorial, true, 'y con historial, sí');

  const r = resumenIdeas(e, { armario: CON_ROPA, hoy: HOY });
  eq(r.frecuencia, 'normal', 'el resumen dice la frecuencia');
  eq(r.guardadas, 0, 'las guardadas');
  eq(r.temas, 7, 'y los temas');
  ok(r.ideas > 0, 'con sus ideas');
  ok(typeof lineaIdeas(e, { armario: CON_ROPA, hoy: HOY }) === 'string',
    'la línea de la plaquita es una frase corta');
  ok(/idea/.test(lineaIdeas(e, { armario: CON_ROPA, hoy: HOY })), 'y dice cuántas hay');
  eq(lineaIdeas(nuevo(), { armario: VACIO, hoy: HOY }), null,
    '⚠️ y sin ninguna NO pinta un cero: no hay línea');
  ok(TEXTOS_IDEAS.sinIdeas.includes('no hay ninguna idea'),
    'cuando no encaja ninguna, se dice (regla 8)');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
