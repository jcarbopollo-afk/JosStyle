// ============================================================================
// EH · Fase 7/65 — PRUEBAS
//
// Los diez tests del apartado 18. El 10 (móvil) es R1 y se dice.
//
// Los que más importan son el **7 y el 8** (desactivar y reactivar Pelo sin
// perder nada) y el **9** (que otros módulos puedan acceder a los datos), porque
// los tres dependen de una sola decisión: **dónde se guarda cada respuesta**. Si
// esa decisión estuviera mal, nada reventaría — simplemente Productos preguntaría
// otra vez el tipo de pelo, o apagar el módulo se llevaría doce respuestas.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { leerDato, hayQuePreguntar, REGISTRO_DATOS, datoDelRegistro } from '../src/lib/datosEstiloHombre.js';
import {
  NO_LO_SE, OPCION_NO_LO_SE, normalizarPregunta, opcionesDe, destinoDe, DESTINOS_RESPUESTA,
  leerRespuesta, contestar, borrarRespuesta, leerCuestionario, progresoCuestionario,
  ESTADOS_CUESTIONARIO, estadoCuestionario, contextoDelCuestionario, auditarCuestionario,
} from '../src/lib/cuestionarios.js';
import {
  MODULO_PELO, PREGUNTAS_PELO, preguntaPelo, IDS_PELO, TEXTOS_PELO,
  perfilCapilar, respuestaPelo, contestarPelo, borrarPelo, progresoPelo,
  estadoPerfilCapilar, contextoCapilar, dudasDelPerfil, loQueCompartePelo,
  resumenPerfilCapilar,
} from '../src/lib/perfilCapilar.js';

let n = 0;
let fallos = 0;
function ok(cond, msg) {
  n += 1;
  if (cond) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg}`);
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function eq(a, b, msg) {
  n += 1;
  if (igual(a, b)) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
}

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo', 'productos']);
const di = (e, id, v) => contestarPelo(e, id, v, { hoy: HOY }).estado;

/* ── 1 · LAS DOCE PREGUNTAS (apartados 2-13) ─────────────────────────────── */

eq(PREGUNTAS_PELO.length, 12, 'Las doce preguntas de los apartados 2 a 13');
eq(PREGUNTAS_PELO.map((p) => p.apartado), [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  'Una por apartado, en orden y sin saltos');
ok(PREGUNTAS_PELO.every((p) => p.titulo && p.opciones.length > 0), 'Cada una con título y opciones');
eq(new Set(IDS_PELO).size, 12, 'Sin ids repetidos');
ok(PREGUNTAS_PELO.every((p) => p.opciones.every((o) => o.id && o.nombre)), 'Cada opción con id y nombre');
eq(preguntaPelo('inventada'), null, 'Una pregunta que no existe devuelve null');

// Las opciones son las literales del enunciado.
eq(preguntaPelo('tipoPelo').opciones.map((o) => o.nombre), ['Liso', 'Ondulado', 'Rizado', 'Muy rizado'],
  'El tipo de pelo, literal');
eq(preguntaPelo('tiempoPelo').opciones.map((o) => o.nombre),
  ['Menos de 5 min', '5–10 min', '10–20 min', 'Más de 20 min', 'Me da igual'], 'Los tiempos, literales');
ok(preguntaPelo('cueroCabelludo').multiple, '⚠️ El cuero cabelludo admite varias (apartado 6)');
ok(preguntaPelo('necesidadesPelo').multiple, 'Y las necesidades también');
ok(!preguntaPelo('tipoPelo').multiple, 'Pero el tipo de pelo es uno solo');

// ⚠️ Apartado 7 — "No diagnosticar problemas".
const fuente = readFileSync(new URL('../src/lib/perfilCapilar.js', import.meta.url), 'utf8');
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
['caspa', 'alopecia', 'calvicie', 'problema', 'diagnos', 'enfermedad', 'sintoma'].forEach((x) => {
  ok(!new RegExp(x, 'i').test(codigo),
    `⚠️ Apartado 7: ni una palabra de diagnóstico ("${x}") — se pregunta qué quiere cuidar, no qué le falla`);
});

/* ⚠️ Y lo que esta fase NO construye, tampoco está. La comprobación mira que no
   se DEFINA ninguna de esas cosas, no que no se nombren: la primera versión
   fallaba con la frase que le dice a Josué que el calendario llega en la fase
   11 — que es justamente lo que manda la regla 8, decir cuándo, no fingir que
   ya está. Una prueba que castiga la honestidad está mal escrita. */
ok(!/askAI|AI_SYSTEM|anthropic/i.test(codigo), '⚠️ Apartado 17: ni una llamada a la IA');
[['calendario', /(function|const)\s+\w*[Cc]alendario/], ['inventario', /(function|const)\s+\w*[Ii]nventario/],
  ['recomendaciones', /(function|const)\s+\w*[Rr]ecomend/]].forEach(([que, re2]) => {
  ok(!re2.test(codigo), `⚠️ No se construye ${que}: el enunciado lo prohíbe (apartados 11, 12 y 17)`);
});
ok(/fase 11/.test(fuente),
  '⚠️ …pero sí se DICE cuándo llega el calendario, en vez de callarlo (regla 8)');

/* ── 2 · ⚠️ DÓNDE SE GUARDA CADA RESPUESTA (apartado 16) ─────────────────── */

eq(DESTINOS_RESPUESTA, ['compartido', 'del_modulo'], 'Dos destinos, y no hay un tercero');
eq(destinoDe('tipoPelo'), 'compartido', '⚠️ `tipoPelo` va a la capa compartida: lo usa Productos');
eq(destinoDe('grosorPelo'), 'del_modulo', 'Y el grosor, a la `config` de Pelo: solo lo usa él');
eq(PREGUNTAS_PELO.filter((p) => destinoDe(p.id) === 'compartido').length, 1,
  'Hoy solo una de las doce es compartida');

const aud = auditarCuestionario(MODULO_PELO, PREGUNTAS_PELO);
eq(aud.almacenesNuevos, 0, '⚠️ Apartado 16: CERO almacenes nuevos');
eq(aud.compartidas.length, 1, 'Una compartida');
eq(aud.compartidas[0].conQuien, ['productos'], '⚠️ Y se dice con quién: Productos');
eq(aud.propias, 11, 'Y once propias');
ok(!/DEFAULT_PELO|perfilPelo:\s*\{|datosPelo/.test(codigo), '⚠️ Y no hay un almacén de pelo paralelo');

/* ── 3 · TEST 1 — PERFIL COMPLETO ────────────────────────────────────────── */

let e = base();
PREGUNTAS_PELO.forEach((p) => { e = di(e, p.id, p.opciones[0].id); });
eq(progresoPelo(e).contestadas, 12, 'Test 1: las doce contestadas');
eq(estadoPerfilCapilar(e), 'contestado', 'Test 1: y el estado lo dice');
eq(respuestaPelo(e, 'tipoPelo').valores, ['liso'], 'Test 1: con su valor');
eq(respuestaPelo(e, 'tipoPelo').etiquetas, ['Liso'], 'Y su nombre legible');

/* ── 4 · TEST 2 — PARCIAL, Y TEST 3 — SALTARLO ───────────────────────────── */

const parcial = di(di(base(), 'tipoPelo', 'ondulado'), 'tiempoPelo', 'menos_5');
eq(progresoPelo(parcial).contestadas, 2, 'Test 2: dos de doce');
eq(estadoPerfilCapilar(parcial), 'a_medias', 'Test 2: y se sabe');
ok(!progresoPelo(parcial).todasContestadas, 'Sin dar nada por completo');

eq(estadoPerfilCapilar(base()), 'sin_empezar', 'Test 3: sin empezar');
eq(perfilCapilar(base()).length, 12, '⚠️ Test 3: y aun así salen las doce preguntas, ninguna rota');
ok(perfilCapilar(base()).every((q) => q.valores.length === 0 && !q.contestada),
  'Test 3: todas vacías, ninguna con `null`');
eq(contextoCapilar(base()).respuestas, [], 'Test 3: contexto vacío, no un error');
ok(contextoCapilar(base()).vacio, 'Y quien lo use puede saberlo');
eq(TEXTOS_PELO.ahoraNo, 'Ahora no', 'Con la salida del apartado 1');
eq(TEXTOS_PELO.titulo, 'Tu perfil capilar', 'Y el título literal');

// ⚠️ Ni porcentaje ni "completo" que empuje.
ok(!/porcentaje|completo:|%/.test(JSON.stringify(progresoPelo(parcial))),
  '⚠️ Un recuento, no una nota: ni porcentaje ni "completado"');

/* ── 5 · TEST 4 — EDITAR (apartado 15) ───────────────────────────────────── */

const editado = di(parcial, 'tipoPelo', 'rizado');
eq(respuestaPelo(editado, 'tipoPelo').valores, ['rizado'], '⚠️ Test 4: elegir otro SUSTITUYE');
eq(respuestaPelo(di(editado, 'tipoPelo', 'rizado'), 'tipoPelo').valores, [],
  'Volver a tocar el mismo lo quita');
eq(respuestaPelo(borrarPelo(parcial, 'tipoPelo'), 'tipoPelo').valores, [], 'Y se puede borrar del todo');
eq(TEXTOS_PELO.editar, 'Mi perfil capilar', 'Con el nombre del apartado 15');

// Múltiples: se acumulan.
let cuero = di(di(base(), 'cueroCabelludo', 'graso'), 'cueroCabelludo', 'sensible');
eq(respuestaPelo(cuero, 'cueroCabelludo').valores, ['graso', 'sensible'],
  'Apartado 6: dos a la vez cuando tiene sentido');
eq(respuestaPelo(di(cuero, 'cueroCabelludo', 'graso'), 'cueroCabelludo').valores, ['sensible'],
  'Y se quitan de una en una');

// Valores inventados.
ok(contestarPelo(base(), 'tipoPelo', 'inventado').error !== null, 'Una opción que no existe se rechaza');
ok(contestar(base(), 'inventado', preguntaPelo('tipoPelo'), 'liso').error !== null, 'Y un módulo que no existe');

/* ── 6 · ⚠️ TEST 5 — "NO LO SÉ" ES UNA RESPUESTA (apartados 2 y 14) ──────── */

eq(OPCION_NO_LO_SE.nombre, 'No lo sé', 'La opción del enunciado');
ok(opcionesDe(preguntaPelo('tipoPelo')).some((o) => o.id === NO_LO_SE),
  '⚠️ "No lo sé" se ofrece de verdad en el tipo de pelo');
eq(opcionesDe(preguntaPelo('tipoPelo')).length, 5, 'Cuatro opciones más "No lo sé"');
ok(!opcionesDe(preguntaPelo('tiempoPelo')).some((o) => o.id === NO_LO_SE),
  '⚠️ Pero NO donde el enunciado no lo ofrece: "Me da igual" ya cubre eso');
ok(normalizarPregunta({}).noLoSe, '⚠️ Y por defecto SÍ se puede: el defecto es el que no obliga a inventar');

const noSabe = di(base(), 'tipoPelo', NO_LO_SE);
eq(respuestaPelo(noSabe, 'tipoPelo').valores, [NO_LO_SE], 'Test 5: se guarda');
ok(respuestaPelo(noSabe, 'tipoPelo').contestada, '⚠️ Test 5: CONTESTADA — no es lo mismo que no responder');
ok(respuestaPelo(noSabe, 'tipoPelo').noSabe, 'Y se sabe que no lo sabe');
ok(respuestaPelo(noSabe, 'tipoPelo').puedeAprender, '⚠️ Lo que abre la puerta al contenido educativo');
eq(dudasDelPerfil(noSabe).length, 1, 'Y se puede listar sobre qué');
eq(dudasDelPerfil(noSabe)[0].id, 'tipoPelo', 'Con la pregunta');
eq(dudasDelPerfil(base()), [], 'Sin dudas, lista vacía');
ok(TEXTOS_PELO.educativo.includes('educación'), '⚠️ Y se dice CUÁNDO llega, no "próximamente"');

// ⚠️ "No lo sé" es exclusivo: no convive con una respuesta de verdad.
const mezcla = di(di(base(), 'cueroCabelludo', 'graso'), 'cueroCabelludo', NO_LO_SE);
eq(respuestaPelo(mezcla, 'cueroCabelludo').valores, [NO_LO_SE],
  '⚠️ Marcar "no lo sé" borra lo demás: "graso y no lo sé" es un estado imposible');
eq(respuestaPelo(di(mezcla, 'cueroCabelludo', 'seco'), 'cueroCabelludo').valores, ['seco'],
  '⚠️ Y marcar algo de verdad quita el "no lo sé"');
eq(respuestaPelo(di(mezcla, 'cueroCabelludo', NO_LO_SE), 'cueroCabelludo').valores, [],
  'Volver a tocarlo lo quita');
ok(contestarPelo(base(), 'tiempoPelo', NO_LO_SE).error !== null,
  'Una pregunta sin "no lo sé" lo rechaza en vez de guardarlo a escondidas');

// Y "no lo sé" NO viaja como si fuera una característica.
ok(!JSON.stringify(contextoCapilar(noSabe).respuestas).includes(NO_LO_SE),
  '⚠️ "No lo sé" no sale como respuesta en el contexto: sale aparte');
eq(contextoCapilar(noSabe).noSabe, ['tipoPelo'], 'Sale en su propia lista');

/* ── 7 · TEST 6 — PERSISTENCIA ───────────────────────────────────────────── */

const guardado = normalizarEstiloHombre(JSON.parse(JSON.stringify(parcial)));
eq(respuestaPelo(guardado, 'tipoPelo').valores, ['ondulado'], 'Test 6: lo compartido sobrevive');
eq(respuestaPelo(guardado, 'tiempoPelo').valores, ['menos_5'], '⚠️ Test 6: y lo de la `config` también');
eq(progresoPelo(guardado).contestadas, 2, 'Las dos');

/* ── 8 · ⚠️ TESTS 7 Y 8 — DESACTIVAR Y REACTIVAR ─────────────────────────── */

const apagado = alternarModulo(parcial, MODULO_PELO, false);
eq(respuestaPelo(apagado, 'tipoPelo').valores, ['ondulado'], 'Test 7: apagado, lo compartido sigue');
eq(respuestaPelo(apagado, 'tiempoPelo').valores, ['menos_5'],
  '⚠️ Test 7: y lo de `config` también — `alternarModulo` no la toca (F1, apartado 7)');
eq(progresoPelo(apagado).contestadas, 2, 'Test 7: las dos respuestas siguen');
ok(!resumenPerfilCapilar(apagado).activo, 'Y se sabe que está apagado');

const reencendido = alternarModulo(apagado, MODULO_PELO, true);
eq(progresoPelo(reencendido).contestadas, 2, 'Test 8: reactivado, todo intacto');
eq(respuestaPelo(reencendido, 'tiempoPelo').valores, ['menos_5'], 'Test 8: con sus valores');

// Y sobrevive a apagar + guardar + encender, que es el caso real.
const ciclo = alternarModulo(normalizarEstiloHombre(JSON.parse(JSON.stringify(apagado))), MODULO_PELO, true);
eq(progresoPelo(ciclo).contestadas, 2, '⚠️ Test 8: incluso apagando, guardando y volviendo a encender');

/* ── 9 · ⚠️ TEST 9 — OTROS MÓDULOS PUEDEN ACCEDER ───────────────────────── */

const conTipo = di(base(), 'tipoPelo', 'ondulado');
eq(leerDato(conTipo, 'tipoPelo', {}).valor, 'ondulado',
  '⚠️ Test 9: Productos lee el tipo de pelo con `leerDato`, sin saber que lo puso Pelo');
const pregunta = hayQuePreguntar(conTipo, 'tipoPelo', {});
ok(!pregunta.preguntar, '⚠️ Test 9: y por tanto NO lo vuelve a preguntar');
ok(pregunta.motivo.includes('comparten'), 'Con el motivo: lo comparten');
eq(datoDelRegistro('tipoPelo').usan, ['pelo', 'productos'], 'Los dos módulos declarados');

const comparte = loQueCompartePelo(conTipo);
eq(comparte.length, 1, 'Solo se comparte lo declarado como compartido');
eq(comparte[0].valores, ['ondulado'], 'Con su valor');
// ⚠️ Y lo de `config` NO se comparte: es de Pelo.
const conTiempo = di(base(), 'tiempoPelo', 'menos_5');
eq(loQueCompartePelo(conTiempo).filter((x) => x.contestada).length, 0,
  '⚠️ El tiempo que quiere dedicarle NO sale: es de Pelo, no de todos');
eq(REGISTRO_DATOS.filter((d) => d.id === 'tipoPelo').length, 1, 'Y sigue habiendo UN solo `tipoPelo`');

/* ── 10 · APARTADO 17 — LA ESTRUCTURA, SIN LA LÓGICA ─────────────────────── */

const ctx = contextoCapilar(e);
eq(ctx.modulo, 'pelo', 'El contexto sabe de qué módulo es');
eq(ctx.nombre, 'Pelo', 'Con su nombre');
eq(ctx.respuestas.length, 12, 'Y las doce respuestas');
ok(ctx.respuestas.every((r) => r.titulo && r.etiquetas.length > 0),
  '⚠️ Con su nombre legible: quien recomiende no tiene que leer ids');
eq(ctx.sinContestar, [], 'Nada sin contestar');
eq(contextoCapilar(parcial).sinContestar.length, 10, 'Y con el perfil a medias, diez');
eq(resumenPerfilCapilar(e).recomendaciones, 0,
  '⚠️ Apartado 17: CERO recomendaciones — "no implementar todavía esa lógica"');

/* ── 11 · EL MOTOR SIRVE PARA MÁS DE UN MÓDULO ──────────────────────────── */

// La razón de que exista: Skincare (13), Barba (20) y Manos (22) traerán el suyo.
const inventadas = [
  { id: 'algoDePrueba', titulo: 'Una pregunta', opciones: [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }] },
];
const otroModulo = contestar(base(), 'skincare', inventadas[0], 'a', { hoy: HOY }).estado;
eq(leerRespuesta(otroModulo, 'skincare', inventadas[0]).valores, ['a'],
  '⚠️ El motor funciona con cualquier módulo y cualquier pregunta: por eso existe');
eq(leerRespuesta(otroModulo, 'pelo', inventadas[0]).valores, [],
  '⚠️ Y la respuesta de Skincare no aparece en Pelo: cada `config` es suya');
eq(progresoCuestionario(otroModulo, 'skincare', inventadas).contestadas, 1, 'Con su propio progreso');
eq(ESTADOS_CUESTIONARIO, ['sin_empezar', 'a_medias', 'contestado'], 'Tres estados, y ninguno es "completo"');
eq(estadoCuestionario(otroModulo, 'skincare', inventadas), 'contestado', 'Y se calculan bien');
eq(contextoDelCuestionario(base(), 'skincare', inventadas).respuestas, [], 'Vacío no es un error');

// Entradas rotas.
[null, undefined, {}, { opciones: 'roto' }].forEach((malo, i) => {
  const p = normalizarPregunta(malo);
  ok(Array.isArray(p.opciones) && typeof p.noLoSe === 'boolean', `Pregunta corrupta ${i} no revienta`);
});
eq(leerCuestionario(base(), 'pelo', null).length, 0, 'Sin preguntas, cuestionario vacío');
eq(borrarRespuesta(base(), 'pelo', { id: 'noExiste' }).error, null, 'Borrar lo que no hay no es un error');

/* ── 12 · RESUMEN ────────────────────────────────────────────────────────── */

const res = resumenPerfilCapilar(parcial);
eq(res.contestadas, 2, 'Dos contestadas');
eq(res.total, 12, 'De doce');
eq(res.estado, 'a_medias', 'A medias');
eq(res.compartidas, 1, 'Una compartida');
eq(res.dudas, 0, 'Sin dudas');
eq(resumenPerfilCapilar(noSabe).dudas, 1, 'Y con una, se cuenta');
ok(res.activo, 'Y el módulo está encendido');

console.log('  ⚠️  Test 10 (flujo completo en móvil) necesita un iPhone: es R1.');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
