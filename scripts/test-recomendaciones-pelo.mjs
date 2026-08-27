// ============================================================================
// EH · Fase 9/65 — PRUEBAS
//
// Los diez tests del apartado 17. Los tres que más importan:
//
//   - **Test 9 (no utilizar IA)** y el apartado 16: se comprueba sobre el
//     código, no sobre la buena voluntad.
//   - **Apartado 2 (si un dato no existe, no asumirlo)**: con el perfil vacío
//     NO puede salir ni una recomendación. Es el fallo silencioso de este
//     motor: recomendar cosas a alguien de quien no sabemos nada.
//   - **Apartado 10 (no modificar automáticamente)**: `aplicarARutina` sin
//     confirmar no escribe. Se comprueba comparando el estado antes y después.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { MODULO_PELO, contestarPelo, PREGUNTAS_PELO } from '../src/lib/perfilCapilar.js';
import { NO_LO_SE } from '../src/lib/cuestionarios.js';
import { datosPelo, crearRutina, alternarParte, anadirProducto } from '../src/lib/rutinasPelo.js';
import {
  CATEGORIAS_RECOMENDACION, categoriaRecomendacion, REGLAS_PELO, reglaPelo, IDS_REGLAS,
  contextoParaRecomendar, reglaAplicable,
  MOTIVOS_DESCARTE, DIAS_SILENCIO, normalizarRecs, recsDe, silenciada,
  RECOMENDACIONES_INICIALES, recomendarPelo, loQueFaltaParaAfinar,
  marcarVistas, descartar, deshacerDescarte, guardarRecomendacion, guardadasDePelo,
  aplicarARutina, PUENTE_PRODUCTOS_PELO,
  PALABRAS_PROHIBIDAS_PELO, tonoCorrecto,
  resumenRecomendacionesPelo, auditarRecomendacionesPelo,
} from '../src/lib/recomendacionesPelo.js';

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
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);
const di = (e, id, v) => contestarPelo(e, id, v, { hoy: HOY }).estado;

// Un perfil de verdad: rizado, busca definición e hidratación, cuero graso,
// diez-veinte minutos.
const conPerfil = () => {
  let e = base();
  e = di(e, 'tipoPelo', 'rizado');
  e = di(e, 'necesidadesPelo', 'definicion');
  e = di(e, 'necesidadesPelo', 'hidratacion');
  e = di(e, 'cueroCabelludo', 'graso');
  e = di(e, 'tiempoPelo', '10_20');
  return e;
};

/* ── 1 · ⚠️ TEST 9 Y APARTADO 16 — NO IA, COMPROBADO SOBRE EL CÓDIGO ─────── */

const fuente = readFileSync(new URL('../src/lib/recomendacionesPelo.js', import.meta.url), 'utf8');
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
['askAI', 'AI_SYSTEM', 'anthropic', 'fetch(', 'XMLHttpRequest', 'openai'].forEach((x) => {
  ok(!new RegExp(x.replace('(', '\\('), 'i').test(codigo),
    `⚠️ Test 9 y apartado 16: ni "${x}" — las recomendaciones no salen del dispositivo`);
});
ok(recomendarPelo(conPerfil(), {}, { hoy: HOY }).sinIA, 'Y se declara');
ok(!recomendarPelo(conPerfil(), {}, { hoy: HOY }).externo, 'Y que no sale fuera');
eq(auditarRecomendacionesPelo().llamadasExternas, 0, 'Cero llamadas externas');

/* ── 2 · ⚠️ APARTADO 2 — SI UN DATO NO EXISTE, NO SE ASUME ───────────────── */

// Test 2 — perfil incompleto. Con NADA contestado no puede salir ni una.
const vacio = recomendarPelo(base(), {}, { hoy: HOY });
eq(vacio.recomendaciones, [], '⚠️ Apartado 2: sin saber NADA de él, CERO recomendaciones');
eq(vacio.total, 0, 'Ni una candidata');
ok(!vacio.hayMas, 'Ni "ver más"');

// ⚠️ Y toda regla declara qué necesita: sin eso se dispararían en vacío.
const aud = auditarRecomendacionesPelo();
eq(aud.conRequisitos, aud.reglas, '⚠️ TODAS las reglas declaran qué datos necesitan');
eq(aud.conMotivo, aud.reglas, '⚠️ Y todas explican por qué aparecen (apartado 5)');
ok(REGLAS_PELO.every((r) => r.requiere.length > 0 && typeof r.cuando === 'function'),
  'Con su condición y sus requisitos');
ok(!reglaAplicable({ id: 'x', cuando: () => true, requiere: [] }, {}),
  '⚠️ Una regla SIN requisitos no se aplica nunca: se dispararía con el contexto vacío');
ok(!reglaAplicable(null, {}), 'Y una regla que no existe, tampoco');
ok(!reglaAplicable({ requiere: ['tipoPelo'], cuando: () => { throw new Error('x'); } }, { tipoPelo: 'liso' }),
  'Una regla que revienta no tumba el motor: simplemente no se aplica');

// ⚠️ "No lo sé" NO es un valor: no dispara nada.
const noSabe = di(di(base(), 'tipoPelo', NO_LO_SE), 'necesidadesPelo', 'definicion');
eq(contextoParaRecomendar(noSabe).tipoPelo, null,
  '⚠️ "No lo sé" es la ausencia declarada de un dato, no un dato');
ok(!recomendarPelo(noSabe, {}, { hoy: HOY }).recomendaciones.some((r) => r.reglaId === 'definicion_rizado'),
  'Y por tanto no dispara la regla que necesita el tipo de pelo');

/* ── 3 · TEST 1 — PERFIL COMPLETO, RECOMENDACIONES PERSONALIZADAS ────────── */

const rec = recomendarPelo(conPerfil(), {}, { hoy: HOY });
ok(rec.total > 0, 'Test 1: con perfil sí salen recomendaciones');
ok(rec.recomendaciones.some((r) => r.reglaId === 'definicion_rizado'),
  '⚠️ Test 1: el ejemplo LITERAL del enunciado — rizado + definición');
ok(rec.recomendaciones.some((r) => r.reglaId === 'cuero_graso') || rec.hayMas,
  'Y la del cuero graso, el otro ejemplo del enunciado');

// Apartado 7 — tres, y "ver más".
eq(rec.recomendaciones.length, RECOMENDACIONES_INICIALES, '⚠️ Apartado 7: tres, para no saturar');
eq(RECOMENDACIONES_INICIALES, 3, 'Las tres del enunciado');
ok(rec.hayMas, 'Y "Ver más" cuando hay más');
ok(recomendarPelo(conPerfil(), {}, { limite: 99, hoy: HOY }).recomendaciones.length > 3, 'Que trae el resto');
ok(!recomendarPelo(conPerfil(), {}, { limite: 99, hoy: HOY }).hayMas, 'Y entonces ya no hay más');
eq(recomendarPelo(conPerfil(), {}, { limite: 0, hoy: HOY }).recomendaciones, [], 'Límite 0 no revienta');

/* ── 4 · APARTADO 5 — CADA UNA DICE POR QUÉ ─────────────────────────────── */

const todas = recomendarPelo(conPerfil(), {}, { limite: 99, hoy: HOY }).recomendaciones;
ok(todas.every((r) => r.porque && r.porque.length > 15), '⚠️ Apartado 5: todas explican por qué aparecen');
ok(todas.every((r) => r.porque.length < 180),
  '⚠️ Y en una frase: "no hacer explicaciones excesivamente largas"');
ok(todas.every((r) => r.porque.toLowerCase().includes('porque')), 'Con la palabra que lo dice');
ok(todas.every((r) => r.titulo && r.texto && r.icono), 'Cada una con su plaquita completa');

/* ── 5 · ⚠️ APARTADO 4 — NUNCA "DEBES" ──────────────────────────────────── */

// Todos los textos que este motor puede generar, con TODO contestado.
let completo = base();
PREGUNTAS_PELO.forEach((p) => { completo = di(completo, p.id, p.opciones[0].id); });
completo = di(completo, 'cueroCabelludo', 'graso');
completo = di(completo, 'necesidadesPelo', 'hidratacion');
completo = di(completo, 'necesidadesPelo', 'encrespamiento');
const textosTodos = [
  ...recomendarPelo(completo, {}, { limite: 99, hoy: HOY }).recomendaciones.flatMap((r) => [r.titulo, r.texto, r.porque]),
  ...recomendarPelo(conPerfil(), {}, { limite: 99, hoy: HOY }).recomendaciones.flatMap((r) => [r.titulo, r.texto, r.porque]),
  loQueFaltaParaAfinar(contextoParaRecomendar(base())).texto,
  loQueFaltaParaAfinar(contextoParaRecomendar(base())).titulo,
  ...REGLAS_PELO.map((r) => `${r.titulo} ${r.texto}`),
].join(' ').toLowerCase();
PALABRAS_PROHIBIDAS_PELO.forEach((p) => {
  ok(!textosTodos.includes(p), `⚠️ Apartado 4: ni una vez "${p}" en ningún texto del motor`);
});
ok(/podría|podrías|opción compatible/.test(textosTodos),
  '⚠️ Y sí las fórmulas que pide el enunciado: "podría venirte bien", "podrías probar"');
ok(tonoCorrecto('Podría venirte bien'), 'El comprobador de tono acepta lo bueno');
ok(!tonoCorrecto('Debes hacer esto'), 'Y rechaza lo malo');
ok(tonoCorrecto(''), 'Un texto vacío no tiene mal tono, y no revienta');

// Y nada de diagnóstico, como en la Fase 7.
['caspa', 'alopecia', 'calvicie', 'enfermedad', 'sintoma', 'diagnos'].forEach((x) => {
  ok(!new RegExp(x, 'i').test(textosTodos), `⚠️ Aquí tampoco se diagnostica nada ("${x}")`);
});

/* ── 6 · APARTADO 6 — NIVELES, LOS QUE YA EXISTÍAN ──────────────────────── */

ok(!/const\s+NIVELES/.test(codigo), '⚠️ Apartado 6: NO redefine los niveles — los importa de la Fase 6');
eq(Object.keys(auditarRecomendacionesPelo().porNivel), NIVELES_ESTILO.map((x) => x.id), 'Los tres niveles');
ok(NIVELES_ESTILO.every((niv) => auditarRecomendacionesPelo().porNivel[niv.id] > 0),
  '⚠️ Y hay reglas en los tres: un nivel vacío sería un control decorativo');
const soloBasicas = recomendarPelo(conPerfil(), {}, { nivel: 'basico', limite: 99, hoy: HOY });
ok(soloBasicas.recomendaciones.every((r) => r.nivel === 'basico'), 'Apartado 6: se puede elegir el nivel');
ok(soloBasicas.recomendaciones.length < todas.length, 'Y filtra de verdad');
eq(recomendarPelo(conPerfil(), {}, { nivel: 'inventado', limite: 99, hoy: HOY }).nivel, null,
  'Un nivel que no existe se ignora en vez de dejar la pantalla vacía');
ok(todas.every((r) => r.nivelNombre && r.nivelIcono), 'Cada recomendación trae su nivel legible');

/* ── 7 · TEST 3 — CAMBIAR UN DATO ACTUALIZA LAS RECOMENDACIONES ─────────── */

const liso = di(di(base(), 'tipoPelo', 'liso'), 'necesidadesPelo', 'definicion');
ok(!recomendarPelo(liso, {}, { limite: 99, hoy: HOY }).recomendaciones.some((r) => r.reglaId === 'definicion_rizado'),
  'Con el pelo liso, la regla del rizado no se dispara');
const cambiado = di(liso, 'tipoPelo', 'rizado');
ok(recomendarPelo(cambiado, {}, { limite: 99, hoy: HOY }).recomendaciones.some((r) => r.reglaId === 'definicion_rizado'),
  '⚠️ Test 3: al cambiarlo a rizado, aparece — sin nada que sincronizar, porque no hay copia');

/* ── 8 · TEST 4 Y APARTADO 8 — DESCARTAR ────────────────────────────────── */

eq(MOTIVOS_DESCARTE.map((m) => m.nombre),
  ['No me interesa', 'Ya lo hago', 'No quiero verlo', 'Ver menos recomendaciones similares'],
  'Los cuatro motivos literales del apartado 8');

const descartada = descartar(conPerfil(), 'definicion_rizado', 'no_interesa', { hoy: HOY }).estado;
ok(!recomendarPelo(descartada, {}, { limite: 99, hoy: HOY }).recomendaciones.some((r) => r.reglaId === 'definicion_rizado'),
  '⚠️ Test 4: descartada, no insiste');
ok(silenciada(descartada, 'definicion_rizado', { hoy: HOY }).silenciada, 'Y se sabe que está callada');
ok(!silenciada(descartada, 'definicion_rizado', { hoy: '2026-12-01' }).silenciada,
  '⚠️ Pero solo un tiempo: a los 30 días vuelve, porque "no me interesa" no es "nunca más"');

const nunca = descartar(conPerfil(), 'definicion_rizado', 'no_verlo', { hoy: HOY }).estado;
ok(silenciada(nunca, 'definicion_rizado', { hoy: '2030-01-01' }).paraSiempre,
  '⚠️ "No quiero verlo" SÍ es para siempre — y "para siempre" no es un número de días');
ok(!('no_verlo' in DIAS_SILENCIO), 'Por eso no tiene plazo asignado');
eq(DIAS_SILENCIO.ya_lo_hago, 90, '"Ya lo hago" se calla más tiempo que "no me interesa"');

ok(descartar(base(), 'inventada', 'no_interesa').error !== null, 'Una regla que no existe se rechaza');
ok(descartar(base(), 'definicion_rizado', 'inventado').error !== null, 'Y un motivo que no existe también');

// Y se puede deshacer: nada queda bloqueado para siempre por un toque.
ok(!silenciada(deshacerDescarte(nunca, 'definicion_rizado'), 'definicion_rizado', { hoy: HOY }).silenciada,
  '⚠️ Se puede deshacer: un toque no condena una recomendación para siempre');

/* ── 9 · TEST 5 Y APARTADO 9 — GUARDAR ──────────────────────────────────── */

const guardada = guardarRecomendacion(conPerfil(), 'definicion_rizado', { hoy: HOY }).estado;
eq(guardadasDePelo(guardada).length, 1, 'Test 5: se guarda');
eq(guardadasDePelo(guardada)[0].titulo, reglaPelo('definicion_rizado').titulo, 'Y aparece en guardados con su título');
ok(recomendarPelo(guardada, {}, { limite: 99, hoy: HOY }).recomendaciones.find((r) => r.reglaId === 'definicion_rizado')?.guardada,
  'Y la propia recomendación sabe que está guardada');
eq(guardadasDePelo(guardarRecomendacion(guardada, 'definicion_rizado', { hoy: HOY }).estado).length, 0,
  'Volver a tocarla la quita: es un interruptor, no una lista que solo crece');
ok(guardarRecomendacion(base(), 'inventada').error !== null, 'Guardar una que no existe se rechaza');
eq(guardadasDePelo(base()), [], 'Sin nada guardado, lista vacía');

/* ── 10 · ⚠️ TEST 6 Y APARTADO 10 — NO MODIFICAR AUTOMÁTICAMENTE ────────── */

const conRutina = crearRutina(conPerfil(), {
  nombre: 'Mi rutina', frecuencia: 'diaria', pasos: [{ accion: 'lavado' }],
}, { hoy: HOY }).estado;

const antes = JSON.stringify(normalizarEstiloHombre(conRutina));
const sinConfirmar = aplicarARutina(conRutina, 'hidratacion_sin_paso', { hoy: HOY });
ok(sinConfirmar.error !== null, '⚠️ Test 6: SIN confirmar no se aplica');
ok(!sinConfirmar.aplicada, 'Y lo dice');
eq(JSON.stringify(normalizarEstiloHombre(sinConfirmar.estado)), antes,
  '⚠️ Apartado 10: y el estado NO ha cambiado ni un byte');

const aplicada = aplicarARutina(conRutina, 'hidratacion_sin_paso', { confirmado: true, hoy: HOY });
ok(aplicada.aplicada, 'Test 6: confirmando, sí');
ok(datosPelo(aplicada.estado).rutinas[0].pasos.some((p) => p.accion === 'hidratacion'),
  'Y el paso entra en la rutina');
eq(datosPelo(aplicada.estado).rutinas[0].pasos.length, 2, 'Sin tocar el que ya había');
ok(!recomendarPelo(aplicada.estado, {}, { limite: 99, hoy: HOY }).recomendaciones.some((r) => r.reglaId === 'hidratacion_sin_paso'),
  '⚠️ Apartado 14: y ya no vuelve a proponerla, porque queda registrada como "ya lo hago"');

// Sin ninguna rutina, se crea una — pero solo confirmando.
const desdeCero = aplicarARutina(conPerfil(), 'cuero_graso', { confirmado: true, hoy: HOY });
eq(datosPelo(desdeCero.estado).rutinas.length, 1, 'Sin rutinas, se crea una con ese paso');
ok(aplicarARutina(conPerfil(), 'cuero_graso', { hoy: HOY }).error !== null, 'Pero tampoco sin confirmar');

// Una recomendación que no propone paso no puede aplicarse.
ok(aplicarARutina(conRutina, 'volumen_fino', { confirmado: true }).error !== null,
  'Una recomendación sin paso propuesto no se puede aplicar');
ok(aplicarARutina(conRutina, 'inventada', { confirmado: true }).error !== null, 'Ni una que no existe');
ok(aplicarARutina(aplicada.estado, 'hidratacion_sin_paso', { confirmado: true }).sinEfecto,
  'Y aplicarla dos veces no duplica el paso');

// ⚠️ Nada más de este archivo escribe sin que él lo pida.
eq(auditarRecomendacionesPelo().escribenSinConfirmar, 0, '⚠️ Cero funciones que escriban sin confirmar');
const antesDeRecomendar = JSON.stringify(normalizarEstiloHombre(conRutina));
recomendarPelo(conRutina, {}, { hoy: HOY });
eq(JSON.stringify(normalizarEstiloHombre(conRutina)), antesDeRecomendar,
  '⚠️ Y calcular recomendaciones NO escribe nada: mostrar y registrar son dos llamadas');

/* ── 11 · APARTADO 14 — EVITAR REPETICIONES ─────────────────────────────── */

const vista = marcarVistas(conPerfil(), ['definicion_rizado'], { hoy: HOY });
eq(recsDe(vista).vistas.length, 1, 'Se registra que se ha enseñado');
eq(recsDe(marcarVistas(vista, ['definicion_rizado'], { hoy: HOY })).vistas[0].veces, 2, 'Y cuántas veces');
eq(recsDe(marcarVistas(base(), ['inventada'], { hoy: HOY })).vistas.length, 0, 'Una regla que no existe no se registra');
eq(recsDe(marcarVistas(base(), [], { hoy: HOY })).vistas.length, 0, 'Y una lista vacía no hace nada');

// ⚠️ Lo menos visto sale primero.
let muyVista = conPerfil();
for (let i = 0; i < 5; i += 1) muyVista = marcarVistas(muyVista, ['definicion_rizado'], { hoy: HOY });
const orden = recomendarPelo(muyVista, {}, { limite: 99, hoy: HOY }).recomendaciones.map((r) => r.reglaId);
ok(orden.indexOf('definicion_rizado') > 0,
  '⚠️ Apartado 14: la que ya ha visto cinco veces deja de salir la primera');

/* ── 12 · APARTADO 12 — INFORMACIÓN INSUFICIENTE, SIN BLOQUEAR ──────────── */

const falta = loQueFaltaParaAfinar(contextoParaRecomendar(base()));
ok(falta.hayQueAfinar, 'Con el perfil vacío, hay que afinar');
eq(falta.titulo, 'Podemos personalizar más tus recomendaciones', 'Con la frase literal del enunciado');
ok(falta.texto.includes('tu tipo de pelo'), 'Y qué falta');
eq(falta.acciones, ['Completar perfil', 'Ahora no'], '⚠️ Con LAS DOS salidas: nunca bloquear');
ok(!loQueFaltaParaAfinar(contextoParaRecomendar(completo)).hayQueAfinar, 'Con todo contestado, no hace falta');
eq(loQueFaltaParaAfinar(contextoParaRecomendar(completo)).texto, '', 'Y sin frase que enseñar');
ok(recomendarPelo(base(), {}, { hoy: HOY }).falta.hayQueAfinar, 'El aviso viaja con las recomendaciones');

/* ── 13 · TESTS 7 Y 8 — DESACTIVAR Y REACTIVAR ─────────────────────────── */

const apagadas = alternarParte(guardada, 'recomendaciones');
ok(!resumenRecomendacionesPelo(apagadas, {}, { hoy: HOY }).activo, 'Test 7: se pueden desactivar');
eq(resumenRecomendacionesPelo(apagadas, {}, { hoy: HOY }).disponibles, 0, 'Test 7: y desaparecen');
eq(guardadasDePelo(apagadas).length, 1, '⚠️ Test 8: pero lo guardado NO se borra');
const reactivadas = alternarParte(apagadas, 'recomendaciones');
ok(resumenRecomendacionesPelo(reactivadas, {}, { hoy: HOY }).activo, 'Test 8: se reactivan');
eq(guardadasDePelo(reactivadas).length, 1, 'Test 8: con la configuración conservada');

// Y apagar el módulo entero tampoco borra nada (F1, apartado 7).
const moduloOff = alternarModulo(guardada, MODULO_PELO, false);
eq(guardadasDePelo(moduloOff).length, 1, 'Apagar Pelo entero tampoco borra lo guardado');

/* ── 14 · TEST 10 — SIN DATOS DUPLICADOS (apartado 15) ──────────────────── */

eq(auditarRecomendacionesPelo().copiasDeDatos, 0, '⚠️ Test 10: cero copias de datos');
// El contexto se construye leyendo, no copiando: cambiar el origen lo cambia.
const ctxAntes = contextoParaRecomendar(conPerfil()).tipoPelo;
const ctxDespues = contextoParaRecomendar(di(conPerfil(), 'tipoPelo', 'liso')).tipoPelo;
eq([ctxAntes, ctxDespues], ['rizado', 'liso'], '⚠️ El contexto se LEE en cada llamada, no se guarda');
ok(!/DEFAULT_PERFIL_PELO|copiaDe|snapshot/i.test(codigo), 'Y no hay ninguna copia en el código');
// Lo único que se guarda es lo que él decide: feedback, guardadas y vistas.
eq(Object.keys(normalizarRecs({})).sort(), ['feedback', 'guardadas', 'vistas'],
  '⚠️ Solo se guardan sus decisiones, no sus datos');

/* ── 15 · PRODUCTOS (apartado 11 · D2-03) ──────────────────────────────── */

eq(PUENTE_PRODUCTOS_PELO.etiqueta, 'Ver productos', 'Con la etiqueta del enunciado');
ok(!PUENTE_PRODUCTOS_PELO.disponible, '⚠️ Y declarado como todavía no disponible');
eq(PUENTE_PRODUCTOS_PELO.fase, 10, 'Con la fase en la que llega');
ok(todas.filter((r) => r.categoria === 'cuidado').every((r) => r.verProductos),
  'Las de cuidado ofrecen el enlace a productos');
['amazon', 'afiliad', 'precio', 'comprar', 'http'].forEach((x) => {
  ok(!new RegExp(x, 'i').test(codigo), `⚠️ D2-03: ni "${x}" en el código`);
});

/* ── 16 · PERSISTENCIA Y ENTRADAS ROTAS ────────────────────────────────── */

const traGuardar = normalizarEstiloHombre(JSON.parse(JSON.stringify(descartar(guardada, 'cuero_graso', 'ya_lo_hago', { hoy: HOY }).estado)));
eq(guardadasDePelo(traGuardar).length, 1, 'Lo guardado sobrevive al guardado');
eq(recsDe(traGuardar).feedback.length, 1, 'Y el descarte también');
eq(datosPelo(traGuardar).rutinas.length, 0, 'Sin tocar las rutinas de la Fase 8');

[null, undefined, 'roto', 42, { feedback: 'x' }, { guardadas: [null] }, { vistas: [{ reglaId: 'no' }] }]
  .forEach((malo, i) => {
    const r = normalizarRecs(malo);
    ok(Array.isArray(r.feedback) && Array.isArray(r.guardadas) && Array.isArray(r.vistas),
      `Recomendaciones corruptas ${i} no revientan`);
  });
eq(normalizarRecs({ feedback: [{ reglaId: 'inventada', motivo: 'no_interesa' }] }).feedback.length, 0,
  'Un descarte de una regla que ya no existe se descarta al cargar');

/* ── 17 · CATÁLOGOS Y RESUMEN ──────────────────────────────────────────── */

eq(CATEGORIAS_RECOMENDACION.map((c) => c.nombre), ['Cuidado', 'Estilo', 'Rutina'], 'Las tres categorías');
eq(categoriaRecomendacion('inventada'), null, 'Una que no existe devuelve null');
ok(REGLAS_PELO.every((r) => categoriaRecomendacion(r.categoria) !== null), 'Toda regla cae en una que existe');
eq(new Set(IDS_REGLAS).size, IDS_REGLAS.length, 'Sin ids repetidos');
ok(REGLAS_PELO.every((r) => NIVELES_ESTILO.some((niv) => niv.id === r.nivel)), 'Y con un nivel que existe');

const res = resumenRecomendacionesPelo(guardada, {}, { hoy: HOY });
ok(res.activo, 'El resumen sabe que están activas');
ok(res.disponibles > 0, 'Cuántas hay');
eq(res.guardadas, 1, 'Cuántas guardadas');
eq(res.descartadas, 0, 'Y cuántas descartadas');
eq(res.niveles, 3, 'Los tres niveles');
eq(resumenRecomendacionesPelo(base(), {}, { hoy: HOY }).disponibles, 0, 'Sin perfil, ninguna — y no revienta');
ok(resumenRecomendacionesPelo(base(), {}, { hoy: HOY }).hayQueAfinar, 'Pero sí dice que se puede afinar');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
