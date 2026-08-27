// ============================================================================
// EH · Fase 13/65 — Skincare: perfil de piel y configuración inicial
//
// Los trece tests del apartado 18 (menos el 13, "probar móvil", que es de R1),
// más las cuatro cosas que el enunciado prohíbe:
// sin IA, sin diagnósticos, sin preguntar dos veces, y sin construir todavía
// las rutinas / recomendaciones / productos que anuncia el cierre.
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { NO_LO_SE, destinoDe, normalizarPregunta, preguntasVisibles, progresoVisible } from '../src/lib/cuestionarios.js';
import { leerDato, guardarDato, REGISTRO_DATOS } from '../src/lib/datosEstiloHombre.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { PREGUNTAS_PELO } from '../src/lib/perfilCapilar.js';
import {
  MODULO_PIEL, TEXTOS_PIEL, TIPOS_PIEL, NECESIDADES_PIEL, ZONAS_PIEL,
  PRIORIDADES_PIEL, TIEMPOS_PIEL, COMPLEJIDADES_PIEL, complejidadPiel,
  USO_PRODUCTOS, PREFERENCIAS_PRODUCTO_PIEL, PRESUPUESTOS_PIEL, USO_SOLAR,
  SECCIONES_PIEL, PREGUNTAS_PIEL, preguntaPiel, respuestaPiel, contestarPiel,
  borrarPiel, perfilPiel, preguntasDePiel, progresoPiel,
  seccionesDePiel, loQueYaSabemosDeTuPiel, DEFAULT_PIEL, normalizarPiel,
  datosPiel, anadirProductoPiel, quitarProductoPiel, decirAhoraNo,
  volverAConfigurar, ESTADOS_PIEL, estadoDeEntrada, PALABRAS_CLINICAS,
  sinDiagnostico, textosDePiel, contextoDePiel, resumenPiel, auditarPiel,
  panelPiel,
} from '../src/lib/perfilPiel.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']);
const responder = (e, pares) => pares.reduce((acc, [q, v]) => contestarPiel(acc, q, v, { hoy: HOY }).estado, e);

/* ── 1 · LA ENTRADA (apartado 1) ────────────────────────────────────────── */
console.log('\n1 · La entrada, con sus dos botones');

eq(TEXTOS_PIEL.titulo, 'Tu cuidado de la piel', 'El título del enunciado');
eq(TEXTOS_PIEL.sub, 'Personaliza este apartado según tus necesidades.', 'Y su frase');
eq([TEXTOS_PIEL.configurar, TEXTOS_PIEL.ahoraNo], ['Configurar', 'Ahora no'], 'Los dos botones');
eq(ESTADOS_PIEL, ['sin_configurar', 'ahora_no', 'a_medias', 'configurado'], 'Cuatro estados');
eq(estadoDeEntrada(base()), 'sin_configurar', 'Sin nada, sin configurar');

// Test 4 — el usuario que salta el formulario.
const saltado = decirAhoraNo(base()).estado;
eq(estadoDeEntrada(saltado), 'ahora_no', 'Test 4: "Ahora no" se guarda, y no se le vuelve a plantar');
ok(TEXTOS_PIEL.omitido.length > 0, 'Con una frase que dice que puede volver');
eq(estadoDeEntrada(volverAConfigurar(saltado, { hoy: HOY }).estado), 'sin_configurar', 'Y vuelve cuando quiere');
// ⚠️ "Ahora no" no puede tapar respuestas de verdad.
eq(estadoDeEntrada(responder(saltado, [['tipoPiel', 'mixta']])), 'a_medias',
  '⚠️ Si luego contesta algo, manda lo que ha contestado, no el "ahora no" de antes');

/* ── 2 · LAS LISTAS DEL ENUNCIADO ───────────────────────────────────────── */
console.log('\n2 · Las listas, literales');

eq(TIPOS_PIEL.map((x) => x.nombre), ['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible'], 'Los cinco tipos (apartado 3)');
eq(NECESIDADES_PIEL.length, 13, 'Las trece necesidades (apartado 4)');
eq(ZONAS_PIEL.map((z) => z.nombre),
  ['Cara', 'Frente', 'Nariz', 'Mejillas', 'Contorno de ojos', 'Labios', 'Cuello', 'Cuerpo'],
  'Las ocho zonas (apartado 6)');
eq(PRIORIDADES_PIEL.length, 4, 'Las cuatro prioridades (apartado 7)');
eq(TIEMPOS_PIEL.length, 5, 'Los cinco tiempos (apartado 8)');
eq(USO_PRODUCTOS.map((x) => x.nombre), ['Sí', 'No', 'Algunos'], 'Sí / No / Algunos (apartado 10)');
eq(PRESUPUESTOS_PIEL.map((x) => x.nombre), ['Bajo', 'Medio', 'Alto', 'Sin preferencia'], 'Los cuatro presupuestos (apartado 12)');
eq(USO_SOLAR.map((x) => x.nombre), ['Sí', 'No', 'A veces'], 'Protección solar (apartado 13)');
eq(PREFERENCIAS_PRODUCTO_PIEL.length, 7, 'Siete preferencias de producto: "sin perfume" va aparte, es compartida');

/* ⚠️ El tiempo de la piel NO es el tiempo del pelo. */
const tiempoPelo = PREGUNTAS_PELO.find((p) => p.id === 'tiempoPelo');
ok(JSON.stringify(TIEMPOS_PIEL.map((t) => t.id)) !== JSON.stringify(tiempoPelo.opciones.map((o) => o.id)),
  '⚠️ El tiempo de la piel tiene OTRAS opciones que el del pelo: es otra pregunta, no una duplicación');
eq(TIEMPOS_PIEL.map((t) => t.id), ['menos_2', '2_5', '5_10', 'mas_10', 'igual'], 'Las del apartado 8');
eq(TIEMPOS_PIEL.find((t) => t.id === 'igual').minutos, null,
  '⚠️ "Me da igual" no son muchos minutos: es no aplicar la restricción');

/* ── 3 · LOS NIVELES SE IMPORTAN (apartado 9) ───────────────────────────── */
console.log('\n3 · ⚠️ "Esto conecta directamente con el sistema de niveles"');

eq(COMPLEJIDADES_PIEL.map((x) => x.id), NIVELES_ESTILO.map((x) => x.id),
  '⚠️ Mismos ids que `NIVELES_ESTILO` (F6): el enunciado dice que conecta con ese sistema');
eq(COMPLEJIDADES_PIEL.map((x) => x.icono), ['🟢', '🟡', '🔴'], 'Con sus tres iconos');
eq(COMPLEJIDADES_PIEL.map((x) => x.nombre), ['Básica', 'Intermedia', 'Completa'], 'Y los nombres del enunciado');
eq(complejidadPiel('basico').frase, 'Pocos pasos.', 'Con su frase, literal');
eq(complejidadPiel('nada'), null, 'Un nivel que no existe es null');

const fuente = readFileSync(new URL('../src/lib/perfilPiel.js', import.meta.url), 'utf8');
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/const\s+NIVELES_ESTILO\s*=/.test(codigo), 'Y no se redefine la escala aquí');

/* ── 4 · ⚠️ APARTADO 15 — NO PREGUNTAR DOS VECES ────────────────────────── */
console.log('\n4 · ⚠️ Apartado 15 — la información que ya existe');

// El registro de la Fase 4 YA las declaraba, con `desde: 13`.
['tipoPiel', 'sensibilidadPiel'].forEach((id) => {
  const reg = REGISTRO_DATOS.find((d) => d.id === id);
  ok(reg && reg.desde === 13, `⚠️ La Fase 4 ya declaraba "${id}" como dato de esta fase`);
  ok(reg.usan.length > 1, `Y compartido con otros módulos, así que no puede vivir solo en Skincare`);
  eq(destinoDe(id), 'compartido', `Por eso "${id}" va a la capa común, y lo decide \`destinoDe()\``);
});
eq(destinoDe('sinPerfume'), 'compartido', '⚠️ Y "sin perfume", que Cuerpo y Productos también usan');
eq(destinoDe('necesidadesPiel'), 'del_modulo', 'Lo que solo es de Skincare, a su `config`');

// Test 5 — usuario con información existente.
const yaSabia = guardarDato(base(), 'tipoPiel', 'grasa', { modulo: 'productos', hoy: HOY }).estado;
eq(respuestaPiel(yaSabia, 'tipoPiel').valores, ['grasa'],
  '⚠️ Test 5: un dato que ya existía se REUTILIZA, no se vuelve a preguntar');
eq(progresoPiel(yaSabia).contestadas, 1, 'Y cuenta como contestado desde el primer momento');
ok(loQueYaSabemosDeTuPiel(yaSabia).find((x) => x.id === 'tipoPiel').conQuien.length > 0,
  'Y se puede decir con quién se comparte, en vez de que parezca que se ha ido a otro sitio');

// Y al revés: contestarlo aquí lo deja disponible fuera.
const contestadoAqui = responder(base(), [['tipoPiel', 'seca']]);
eq(leerDato(contestadoAqui, 'tipoPiel').valor, 'seca',
  '⚠️ Y contestarlo aquí lo deja donde los demás módulos lo encuentran');

/* ── 5 · ⚠️ APARTADO 14 — EL FORMULARIO ADAPTATIVO ──────────────────────── */
console.log('\n5 · ⚠️ Apartado 14 — el formulario se adapta');

eq(PREGUNTAS_PIEL.length, 13, 'Trece preguntas en total');
eq(PREGUNTAS_PIEL.filter((p) => typeof p.cuando === 'function').length, 4, 'Cuatro de ellas condicionadas');
eq(normalizarPregunta({}).cuando, null, '⚠️ Y por defecto una pregunta SIEMPRE se enseña');

// El ejemplo literal del enunciado.
const sinProductos = responder(base(), [['usaProductos', 'no']]);
const visiblesSin = preguntasDePiel(sinProductos).map((q) => q.id);
ok(!visiblesSin.includes('preferenciasProducto'),
  '⚠️ El ejemplo del enunciado: quien dice "no utilizo productos" no ve 15 preguntas de productos');
ok(!visiblesSin.includes('presupuestoPiel'), 'Ni la del presupuesto');
ok(!visiblesSin.includes('sinPerfume'), 'Ni la del perfume');
ok(visiblesSin.includes('tipoPiel'), 'Pero las de la piel siguen ahí');

const conProductos = responder(base(), [['usaProductos', 'si']]);
ok(preguntasDePiel(conProductos).map((q) => q.id).includes('preferenciasProducto'),
  'Test 7: y quien dice que sí, las ve');
ok(preguntasDePiel(responder(base(), [['usaProductos', 'algunos']])).map((q) => q.id).includes('preferenciasProducto'),
  '"Algunos" también');

// Apartado 5 — la de qué le molesta solo si ha dicho que sí.
ok(!preguntasDePiel(base()).map((q) => q.id).includes('queMolesta'),
  'Sin contestar la sensibilidad, no se pregunta qué le molesta');
ok(preguntasDePiel(responder(base(), [['sensibilidadPiel', 'si']])).map((q) => q.id).includes('queMolesta'),
  'Si dice que su piel reacciona, sí');
ok(!preguntasDePiel(responder(base(), [['sensibilidadPiel', 'no']])).map((q) => q.id).includes('queMolesta'),
  '⚠️ Y a quien dice que no le molesta nada, no se le pregunta qué le molesta');

/* ⚠️ ESCONDER NO ES BORRAR. */
let ida = responder(base(), [['usaProductos', 'si'], ['preferenciasProducto', 'farmacia']]);
ida = responder(ida, [['usaProductos', 'no']]);
eq(respuestaPiel(ida, 'preferenciasProducto').valores, ['farmacia'],
  '⚠️ Esconder una pregunta NO borra su respuesta: sigue guardada');
const vuelta = responder(ida, [['usaProductos', 'si']]);
ok(preguntasDePiel(vuelta).map((q) => q.id).includes('preferenciasProducto'), 'Y al volver, reaparece');
eq(respuestaPiel(vuelta, 'preferenciasProducto').valores, ['farmacia'], 'Con lo que ya había contestado');

// El progreso cuenta lo visible, no lo escondido.
eq(progresoPiel(sinProductos).total, preguntasDePiel(sinProductos).length,
  '⚠️ El progreso cuenta lo VISIBLE: decir "4 de 13" de preguntas que no le aplican sería inventarse una nota');
ok(progresoPiel(sinProductos).escondidas > 0, 'Y se sabe cuántas se están escondiendo');
eq(progresoVisible(base(), 'skincare', []).total, 0, 'Sin preguntas, cero — y no revienta');
eq(preguntasVisibles(base(), 'skincare', null).length, 0, 'Y con `null`, tampoco');

/* ── 6 · TESTS 1, 2 Y 3 — COMPLETO, PARCIAL Y "NO LO SÉ" ────────────────── */
console.log('\n6 · Tests 1, 2 y 3 — completo, parcial y "no lo sé"');

// Test 2 — parcial.
const parcial = responder(base(), [['tipoPiel', 'mixta'], ['necesidadesPiel', 'hidratacion']]);
eq(progresoPiel(parcial).contestadas, 2, 'Test 2: contestar dos está bien');
eq(estadoDeEntrada(parcial), 'a_medias', 'Y el estado lo dice sin regañar');
ok(!progresoPiel(parcial).todasContestadas, 'Sin "completo"');

// Test 3 — "No lo sé".
const noSabe = responder(base(), [['tipoPiel', NO_LO_SE]]);
ok(respuestaPiel(noSabe, 'tipoPiel').noSabe, '⚠️ Test 3: "No lo sé" es una respuesta');
eq(progresoPiel(noSabe).contestadas, 1, 'Y cuenta como contestada');
ok(respuestaPiel(noSabe, 'tipoPiel').puedeAprender, 'Y abre la puerta al contenido educativo');
// ⚠️ Y no bloquea nada.
ok(preguntasDePiel(noSabe).length > 1, '⚠️ Apartado 3: y NO bloquea ninguna función');
eq(respuestaPiel(responder(noSabe, [['tipoPiel', 'seca']]), 'tipoPiel').valores, ['seca'],
  'Contestar de verdad quita el "no lo sé": son excluyentes');

// Test 1 — completo.
let completo = responder(base(), [
  ['tipoPiel', 'mixta'], ['sensibilidadPiel', 'si'], ['queMolesta', 'perfume'],
  ['necesidadesPiel', 'hidratacion'], ['necesidadesPiel', 'brillos'],
  ['zonasPiel', 'cara'], ['prioridadPiel', 'hidratacion'],
  ['tiempoPiel', '2_5'], ['complejidadPiel', 'basico'], ['solarPiel', 'a_veces'],
  ['usaProductos', 'si'], ['sinPerfume', 'si'],
  ['preferenciasProducto', 'farmacia'], ['presupuestoPiel', 'bajo'],
]);
eq(estadoDeEntrada(completo), 'configurado', 'Test 1: contestándolo todo, configurado');
eq(progresoPiel(completo).escondidas, 0, 'Y con todo visible, nada escondido');

/* ── 7 · SECCIONES (apartado 2) ─────────────────────────────────────────── */
console.log('\n7 · Apartado 2 — dividido en secciones, no un formulario gigante');

eq(SECCIONES_PIEL.length, 4, 'Cuatro secciones');
eq(seccionesDePiel(completo).length, 4, 'Las cuatro, con todas las preguntas visibles');
ok(seccionesDePiel(completo).every((s) => s.total > 0), 'Ninguna vacía');
eq(seccionesDePiel(completo).reduce((s, x) => s + x.total, 0), PREGUNTAS_PIEL.length,
  'Y entre todas cubren las trece: ninguna pregunta se queda fuera de su sección');
ok(seccionesDePiel(sinProductos).every((s) => s.total > 0),
  '⚠️ Y una sección que se queda sin preguntas visibles no se enseña vacía');
eq(seccionesDePiel(completo)[0].contestadas > 0, true, 'Cada sección lleva su propio recuento');

/* ── 8 · TESTS 6 Y 7 — PRODUCTOS (apartado 10) ──────────────────────────── */
console.log('\n8 · Tests 6 y 7 — sin productos y con productos');

eq(datosPiel(base()).productos, [], 'Test 6: sin productos, ninguno — y no revienta');
eq(panelPiel(sinProductos).pideProductos, false, 'Y a quien dice que no, no se le piden');
const conUno = anadirProductoPiel(conProductos, 'Crema hidratante').estado;
eq(datosPiel(conUno).productos.length, 1, 'Test 7: se puede añadir uno');
ok(anadirProductoPiel(conUno, 'crema hidratante').sinEfecto, 'Y no se repite, aunque cambien las mayúsculas');
ok(anadirProductoPiel(base(), '  ').error !== null, 'Uno sin nombre, no');
eq(datosPiel(quitarProductoPiel(conUno, datosPiel(conUno).productos[0].id).estado).productos, [], 'Y se quita');
// ⚠️ "No obligar a introducirlos todos": uno basta.
eq(estadoDeEntrada(conUno), estadoDeEntrada(conProductos),
  '⚠️ Apartado 10: añadir productos no cambia si el perfil está configurado — no se obliga a meterlos todos');
// ⚠️ Y aquí NO hay catálogo: es una lista de nombres.
eq(Object.keys(datosPiel(conUno).productos[0]).sort(), ['id', 'nombre'],
  '⚠️ Un producto aquí es un nombre: ni marca, ni precio, ni tienda. Eso es de una fase posterior');

/* ── 9 · TESTS 8 Y 9 — CAMBIAR PREFERENCIAS Y NIVEL (apartado 16) ───────── */
console.log('\n9 · Tests 8 y 9 — cambiar respuestas');

const otroNivel = responder(completo, [['complejidadPiel', 'basico'], ['complejidadPiel', 'avanzado']]);
eq(respuestaPiel(otroNivel, 'complejidadPiel').valores, ['avanzado'], 'Test 9: el nivel se cambia');
eq(contextoDePiel(otroNivel).nivel, 'avanzado', '⚠️ Y el contexto lo refleja: los cambios llegan a lo que viene después');
const otraPref = responder(completo, [['preferenciasProducto', 'premium']]);
eq(respuestaPiel(otraPref, 'preferenciasProducto').valores.sort(), ['farmacia', 'premium'],
  'Test 8: las preferencias se añaden');
eq(respuestaPiel(borrarPiel(completo, 'prioridadPiel'), 'prioridadPiel').valores, [],
  'Y cualquier respuesta se puede borrar (apartado 16)');
ok(volverAConfigurar(completo, { hoy: HOY }).estado, 'Con su marca de cuándo se editó');
eq(datosPiel(volverAConfigurar(completo, { hoy: HOY }).estado).editado, HOY, 'Que se guarda');

/* ── 10 · TESTS 10, 11 Y 12 — DESACTIVAR, REACTIVAR Y NO PERDER NADA ────── */
console.log('\n10 · Tests 10, 11 y 12 — desactivar, reactivar y no perder nada');

const apagado = alternarModulo(conUno, MODULO_PIEL);
ok(!normalizarEstiloHombre(apagado).modulos.find((m) => m.id === MODULO_PIEL).activo,
  'Test 10: Skincare se desactiva');
eq(respuestaPiel(apagado, 'tipoPiel').valores, respuestaPiel(conUno, 'tipoPiel').valores,
  '⚠️ Test 12: y sus respuestas siguen ahí — apagar no borra (F1, apartado 7)');
eq(datosPiel(apagado).productos.length, 1, 'Sus productos también');
const reactivado = alternarModulo(apagado, MODULO_PIEL);
eq(JSON.stringify(perfilPiel(reactivado).map((q) => q.valores)),
  JSON.stringify(perfilPiel(conUno).map((q) => q.valores)),
  'Test 11: y al reactivarlo está todo igual');
eq(datosPiel(reactivado).productos.length, 1, 'Con sus productos');

/* ── 11 · EL NORMALIZADOR ───────────────────────────────────────────────── */
console.log('\n11 · El normalizador');

eq(normalizarPiel(undefined), DEFAULT_PIEL, 'Sin nada, el valor por defecto');
eq(normalizarPiel('roto'), DEFAULT_PIEL, 'Con basura, también');
eq(normalizarPiel({ productos: 'roto' }).productos, [], 'Unos productos que no son una lista se caen');
eq(normalizarPiel({ productos: [{ nombre: '' }, { nombre: 'X' }] }).productos.length, 1, 'Y uno sin nombre');
eq(normalizarPiel({ ahoraNo: 'sí' }).ahoraNo, false, '"Ahora no" es un booleano de verdad');
eq(normalizarPiel({ editado: 5 }).editado, null, 'Y la fecha, un texto');
// ⚠️ Y sobrevive a un guardado.
eq(datosPiel(normalizarEstiloHombre(conUno)).productos.length, 1,
  '⚠️ Y los datos siguen ahí después de normalizar otra vez (regla 5)');

/* ── 12 · ⚠️ SIN DIAGNÓSTICOS (objetivo + apartado 4) ───────────────────── */
console.log('\n12 · ⚠️ Objetivos de cuidado, nunca un diagnóstico');

ok(PALABRAS_CLINICAS.length > 10, 'La lista de vocabulario clínico existe y se puede comprobar');
ok(!sinDiagnostico('Parece que tienes dermatitis'), 'Una frase clínica se detecta');
ok(sinDiagnostico('¿Qué te gustaría mejorar o cuidar?'), 'Y la del enunciado, no');
textosDePiel().forEach((t) => {
  ok(sinDiagnostico(t), `Sin vocabulario clínico: "${t.slice(0, 40)}…"`);
});
// ⚠️ La pregunta es qué quiere cuidar, no qué le pasa.
eq(preguntaPiel('necesidadesPiel').titulo, '¿Qué te gustaría mejorar o cuidar?',
  '⚠️ Apartado 4: se pregunta qué quiere cuidar, NO qué problema tiene');
ok(!/problema|te pasa|padeces|sufres/i.test(textosDePiel().join(' ')),
  'Y en ningún texto se le pregunta qué le pasa');

/* ── 13 · ⚠️ APARTADO 17 — PRIVACIDAD ───────────────────────────────────── */
console.log('\n13 · ⚠️ Apartado 17 — esto no sale de aquí');

['askAI', 'AI_SYSTEM', 'anthropic', 'fetch(', 'XMLHttpRequest', 'openai', 'supabase'].forEach((x) => {
  ok(!codigo.includes(x), `⚠️ "No enviar estos datos a una IA": ni "${x}"`);
});
eq(contextoDePiel(completo).paraIA, false, '⚠️ Y el contexto lleva escrito que no viaja');
eq(contextoDePiel(completo).privado, true, 'Y que es privado');
eq(auditarPiel().perfilesExternos, 0, '⚠️ "No crear perfiles externos": cero');
eq(auditarPiel().almacenesNuevos, 0, 'Y cero almacenes nuevos: la capa de F4 y la `config` de F1');

/* ── 14 · ⚠️ LO QUE ESTA FASE NO CONSTRUYE ──────────────────────────────── */
console.log('\n14 · ⚠️ "Todavía no implementar esas funciones dentro de esta fase"');

const aud = auditarPiel();
eq([aud.rutinas, aud.seguimiento, aud.recomendaciones, aud.catalogo, aud.packs], [0, 0, 0, 0, 0],
  '⚠️ Ni rutinas, ni seguimiento, ni recomendaciones, ni catálogo, ni packs');
ok(aud.nota.includes('fases 14 a 17'), 'Y se dice en qué fases llegan, no "próximamente" (regla 8)');
// Comprobado sobre el código, no sobre la buena voluntad.
['crearRutina', 'recomendar', 'CATALOGO', 'crearPack', 'aplicarA'].forEach((x) => {
  ok(!codigo.includes(x), `⚠️ Y no hay ni un "${x}" en el archivo`);
});
eq(aud.adaptativas, 4, 'Cuatro preguntas adaptativas');
eq(aud.compartidas.map((c) => c.id).sort(), ['sensibilidadPiel', 'sinPerfume', 'tipoPiel'],
  '⚠️ Y las tres compartidas, declaradas y comprobables');

/* ── 15 · RESUMEN Y PANEL ───────────────────────────────────────────────── */
console.log('\n15 · Resumen y panel');

const res = resumenPiel(completo);
eq(res.estado, 'configurado', 'El resumen dice el estado');
eq(res.nivel, 'Básica', 'Y el nivel elegido');
eq(res.compartidas, 3, 'Y cuántas respuestas se comparten');
eq(resumenPiel(base()).contestadas, 0, 'Sin nada, cero — y no revienta');

const panel = panelPiel(completo);
eq(panel.secciones.length, 4, 'El panel trae las secciones');
ok(panel.yaSabemos.length > 0, 'Y lo que ya sabemos de él');
eq(panelPiel(base()).yaSabemos, [], 'Sin nada, nada — y sigue funcionando');
eq(panelPiel(base()).estado, 'sin_configurar', 'Con su estado');
eq(MODULO_PIEL, 'skincare', 'El módulo es el que ya existía en el catálogo de F1');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
