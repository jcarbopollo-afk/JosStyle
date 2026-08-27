// ============================================================================
// EH · Fase 4/65 — PRUEBAS
//
// Los diez tests del apartado 18. El 10 ("sincronización → no aparecen
// duplicados") se comprueba hasta donde llega Node: que el estado sobreviva al
// viaje por JSON sin duplicar entradas. Que dos iPhones acaben con lo mismo es
// R1, y se dice.
//
// El que más importa es el Test 4 (modificar un dato → todos los módulos
// compatibles reciben el cambio), porque es el que falla en silencio: si
// hubiera dos copias, cada módulo enseñaría un número distinto y nada
// reventaría.
// ============================================================================

import {
  DEFAULT_ESTILO_HOMBRE, normalizarEstiloHombre, configurarPrimeraVez,
  alternarModulo, MODULOS_EH,
} from '../src/lib/estiloDeHombre.js';
import { DATOS_GLOBALES_EH, CLASES_DATO } from '../src/lib/configuracionInicial.js';
import {
  CATEGORIAS_DATO, categoriaDato, REGISTRO_DATOS, datoDelRegistro, IDS_DATOS,
  modulosQueUsan, datosDe, ORIGENES_DATO, origenDe,
  DEFAULT_DATOS_EH, normalizarDatosEH,
  TEXTO_SIN_DATO, ACCION_ANADIR, ACCION_MAS_TARDE, leerDato, solicitarDato,
  MOTIVOS_RECHAZO_DATO, guardarDato, eliminarDato, historialDe,
  DIAS_POSIBLEMENTE_ANTIGUO, antiguedadDato,
  dependenciasDe, estadoDependencia, loQueLeFalta,
  datosCompartibles, datosPrivados, todosLosDatos, resumenDatos, hayQuePreguntar,
} from '../src/lib/datosEstiloHombre.js';

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
const GLOBAL = {
  perfil: { nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72, sexo: 'Masculino' },
  salud: { medidas: [{ fecha: '2026-08-20', peso: 73 }] },
  objetivos: { lista: [{ id: 'o1' }] },
  calistenia: { Dominadas: { sesiones: [{ fecha: HOY }] } },
  sueno: [{ fecha: HOY, horas: 8 }],
};
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'productos', 'pelo']);
const guardar = (e, id, v, opts) => guardarDato(e, id, v, { hoy: HOY, ...opts }).estado;

/* ── 1 · LA ARQUITECTURA (apartados 1, 4 y 17) ───────────────────────────── */

eq(CATEGORIAS_DATO.length, 9, 'Las nueve categorías que enumera el apartado 1');
ok(CATEGORIAS_DATO.every((c) => c.nombre && c.icono), 'Cada una con nombre e icono');
ok(categoriaDato('tallas') !== null, 'Se puede buscar una');
eq(categoriaDato('inventada'), null, 'Y una que no existe devuelve null');

ok(REGISTRO_DATOS.length > 0, 'Hay datos propios declarados');
ok(REGISTRO_DATOS.every((d) => categoriaDato(d.categoria) !== null),
  '⚠️ Todo dato del registro cae en una categoría que existe');
ok(REGISTRO_DATOS.every((d) => CLASES_DATO.includes(d.clase)),
  '⚠️ Y usa las tres clases de la Fase 3, sin inventar una cuarta');
ok(REGISTRO_DATOS.every((d) => d.usan.length > 0 && d.usan.every((m) => MODULOS_EH.some((x) => x.id === m))),
  '⚠️ Cada dato dice qué módulos lo usan, y todos existen');
ok(REGISTRO_DATOS.every((d) => Number.isFinite(d.desde)), 'Y en qué fase empieza a usarse');
eq(new Set(IDS_DATOS).size, IDS_DATOS.length, 'Sin ids repetidos');

// ⚠️ Apartado 2 — ningún dato propio pisa uno global.
ok(REGISTRO_DATOS.every((d) => !DATOS_GLOBALES_EH.some((g) => g.campo === d.id)),
  '⚠️ Ningún dato propio duplica uno de JosStyle: eso es el apartado 2 entero');

/* ── 2 · DÓNDE VIVE CADA COSA (apartados 2 y 3) ──────────────────────────── */

eq(ORIGENES_DATO, ['global', 'propio', 'desconocido'], 'Tres orígenes posibles');
eq(origenDe('peso'), 'global', 'El peso es de JosStyle');
eq(origenDe('altura'), 'global', 'La altura también');
eq(origenDe('tipoPiel'), 'propio', 'El tipo de piel es de Estilo de hombre');
eq(origenDe('loQueSea'), 'desconocido', 'Y lo que no está en ningún sitio se dice');

/* ── 3 · LEER: LA MISMA FUNCIÓN PARA TODO (apartados 2, 3 y 15) ──────────── */

// Test 1 — dato existente en JosStyle → Estilo de hombre lo utiliza.
const peso = leerDato(base(), 'peso', GLOBAL);
eq(peso.valor, 73, 'Test 1: lee el peso de Salud');
eq(peso.origen, 'global', 'Y sabe que es global');
ok(peso.tiene, 'Y que lo tiene');
ok(!peso.editableAqui, '⚠️ Test 1: NO se edita aquí — es el apartado 3');
eq(peso.donde, 'Perfil y Salud', 'Y dice dónde se cambia');

// La MISMA función, un dato propio.
const piel = leerDato(base(), 'tipoPiel', GLOBAL);
eq(piel.origen, 'propio', 'El tipo de piel es propio');
ok(!piel.tiene, 'Y todavía no lo tenemos');
ok(piel.editableAqui, 'Este sí se edita aquí (apartado 8)');
eq(piel.texto, TEXTO_SIN_DATO, '⚠️ Apartado 15: nunca "undefined", siempre una frase');

// ⚠️ Las dos respuestas tienen la MISMA forma: por eso un módulo futuro no
// tiene que saber cuál es cuál.
eq(Object.keys(peso).sort(), Object.keys(piel).sort(),
  '⚠️ Global y propio devuelven exactamente la misma forma');

// Apartado 15 — nunca un error técnico.
['undefined', 'null', 'Error', 'NaN'].forEach((feo) => {
  ok(!leerDato(base(), 'tipoPiel', GLOBAL).texto.includes(feo), `Nunca aparece "${feo}" en el texto`);
  ok(!leerDato(base(), 'inventado', {}).texto.includes(feo), `Ni con un dato que no existe ("${feo}")`);
});
eq(leerDato(base(), 'inventado', {}).origen, 'desconocido', 'Un dato que no existe no revienta');
eq(leerDato(base(), 'peso', {}).texto, TEXTO_SIN_DATO, 'Un global vacío tampoco');
eq(leerDato(base(), 'peso', null).valor, null, 'Ni sin datos globales');

/* ── 4 · ESCRIBIR (apartados 3, 5 y 10) ──────────────────────────────────── */

// Test 2 — dato nuevo → se puede registrar.
const r1 = guardarDato(base(), 'tipoPiel', 'mixta', { modulo: 'skincare', hoy: HOY });
eq(r1.error, null, 'Test 2: se registra sin error');
eq(leerDato(r1.estado, 'tipoPiel', GLOBAL).valor, 'mixta', 'Test 2: y se lee');
eq(normalizarDatosEH(r1.estado.datos).tipoPiel.actualizadoEn, HOY, 'Apartado 10: con su fecha');
eq(normalizarDatosEH(r1.estado.datos).tipoPiel.porModulo, 'skincare', 'Y quién lo introdujo');

// ⚠️ Apartado 3 — escribir un dato global se RECHAZA, y no en silencio.
const r2 = guardarDato(base(), 'peso', 70, { hoy: HOY });
ok(r2.error !== null, '⚠️ Apartado 3: NO se puede escribir el peso desde aquí');
ok(r2.error.includes('fuera de Estilo de hombre'), 'Con el motivo escrito');
eq(r2.donde, 'Perfil y Salud', '⚠️ Y con el sitio donde SÍ se edita');
eq(leerDato(r2.estado, 'peso', GLOBAL).valor, 73, '⚠️ Y el peso sigue siendo el de Salud: 73, no 70');
eq(normalizarDatosEH(r2.estado.datos).peso, undefined, '⚠️ No se ha creado ninguna copia');

const r3 = guardarDato(base(), 'inventado', 'x');
ok(r3.error !== null, 'Un dato que no está en el registro también se rechaza');
eq(r3.error, MOTIVOS_RECHAZO_DATO.desconocido, 'Con su motivo');

/* ── 5 · ⚠️ TEST 4 — UNA SOLA COPIA ──────────────────────────────────────── */

// Modificar un dato → todos los módulos compatibles reciben el cambio. Es
// automático PORQUE NO HAY COPIAS: los dos leen del mismo sitio.
let e = guardar(base(), 'tipoPiel', 'seca', { modulo: 'skincare' });
eq(modulosQueUsan('tipoPiel'), ['skincare', 'productos'], 'Skincare y Productos comparten el tipo de piel');
eq(leerDato(e, 'tipoPiel', GLOBAL).valor, 'seca', 'Test 4: Skincare lo ve');
e = guardar(e, 'tipoPiel', 'mixta', { modulo: 'productos', hoy: '2026-09-01' });
eq(leerDato(e, 'tipoPiel', GLOBAL).valor, 'mixta',
  '⚠️ Test 4: lo cambia Productos y Skincare recibe el cambio — porque es EL MISMO dato');
eq(Object.keys(normalizarDatosEH(e.datos)).filter((k) => k === 'tipoPiel').length, 1,
  '⚠️ Test 4: y sigue habiendo UNA sola entrada, no una por módulo');

// Test 3 — otro módulo necesita el mismo dato → lo reutiliza.
const preguntaProductos = hayQuePreguntar(e, 'tipoPiel', GLOBAL);
ok(!preguntaProductos.preguntar, '⚠️ Test 3: Productos NO vuelve a preguntar el tipo de piel');
ok(preguntaProductos.motivo.includes('comparten'), 'Y dice con quién lo comparte');
eq(preguntaProductos.valor, 'mixta', 'Y con qué valor');
ok(hayQuePreguntar(base(), 'tipoPiel', GLOBAL).preguntar, 'Si no lo tenemos, sí se pregunta');
ok(!hayQuePreguntar(base(), 'peso', GLOBAL).preguntar, 'Y un global que ya sabemos, tampoco');
ok(hayQuePreguntar(base(), 'peso', {}).preguntar, 'Un global vacío sí');

// Un dato que solo usa un módulo no dice "lo comparten".
const soloUno = guardar(base(), 'ropaOversize', true);
ok(!hayQuePreguntar(soloUno, 'ropaOversize', GLOBAL).motivo.includes('comparten'),
  'Un dato de un solo módulo no habla de compartir');

/* ── 6 · SOLICITAR UN DATO QUE NO EXISTE (apartados 6 y 15) ──────────────── */

// Test 8 — dato inexistente → la interfaz solicita introducirlo.
const pedir = solicitarDato(base(), 'tipoPiel', GLOBAL);
ok(pedir !== null, 'Test 8: se pide');
eq(pedir.texto, TEXTO_SIN_DATO, 'Con la frase del apartado 15');
ok(pedir.aqui, 'Y se puede añadir aquí');
eq(pedir.acciones, [ACCION_ANADIR, ACCION_MAS_TARDE], '⚠️ Con las dos salidas: nunca se le bloquea');
eq(solicitarDato(guardar(base(), 'tipoPiel', 'seca'), 'tipoPiel', GLOBAL), null,
  'Si ya lo tenemos, no se pide nada');

// ⚠️ Un global que falta NO se pide aquí: se dice dónde se rellena.
const pedirGlobal = solicitarDato(base(), 'peso', {});
ok(!pedirGlobal.aqui, '⚠️ Un dato de JosStyle no se pide desde aquí: crearía la copia del apartado 3');
eq(pedirGlobal.donde, 'Perfil y Salud', 'Se dice dónde');
eq(pedirGlobal.acciones, [ACCION_MAS_TARDE], 'Y no se ofrece "añadir" donde no se puede');

/* ── 7 · MODIFICAR Y ELIMINAR (apartados 8 y 12) ─────────────────────────── */

// Apartado 8 — nunca bloquear la información introducida.
const cambiado = guardar(guardar(base(), 'tipoPiel', 'seca'), 'tipoPiel', 'grasa', { hoy: '2026-09-01' });
eq(leerDato(cambiado, 'tipoPiel', GLOBAL).valor, 'grasa', 'Apartado 8: se puede cambiar');
eq(normalizarDatosEH(cambiado.datos).tipoPiel.actualizadoEn, '2026-09-01', 'Con la fecha nueva');

// Test 5 — eliminar un dato propio.
const borrado = eliminarDato(cambiado, 'tipoPiel');
eq(borrado.error, null, 'Test 5: se elimina');
ok(!leerDato(borrado.estado, 'tipoPiel', GLOBAL).tiene, 'Test 5: y deja de estar');
eq(normalizarDatosEH(borrado.estado.datos).tipoPiel, undefined, '⚠️ Sin rastro: borrar y dejar historial no es borrar');
ok(eliminarDato(base(), 'tipoPiel').sinEfecto, 'Borrar algo que no existe no es un error');

// ⚠️ Apartado 12 — pero NO se borran datos globales desde aquí.
const noBorra = eliminarDato(cambiado, 'peso');
ok(noBorra.error !== null, '⚠️ Apartado 12: el peso NO se borra desde Estilo de hombre');
eq(leerDato(noBorra.estado, 'peso', GLOBAL).valor, 73, 'Y sigue ahí');

/* ── 8 · HISTORIAL (apartado 9) ──────────────────────────────────────────── */

ok(REGISTRO_DATOS.some((d) => d.historial), 'Algunos datos llevan historial');
ok(REGISTRO_DATOS.some((d) => !d.historial),
  '⚠️ …y otros NO: ponérselo a todos llenaría el guardado de ruido');

let conHist = guardar(base(), 'tallaCamiseta', 'M');
conHist = guardar(conHist, 'tallaCamiseta', 'L', { hoy: '2026-10-01' });
conHist = guardar(conHist, 'tallaCamiseta', 'XL', { hoy: '2026-11-01' });
eq(historialDe(conHist, 'tallaCamiseta').map((h) => h.valor), ['M', 'L', 'XL'], 'Apartado 9: la evolución entera');
eq(leerDato(conHist, 'tallaCamiseta', GLOBAL).valor, 'XL', 'Y el valor de hoy es el último');
eq(historialDe(guardar(base(), 'tipoPiel', 'seca'), 'tipoPiel'), [],
  '⚠️ Un dato sin historial declarado no lo acumula');
eq(historialDe(base(), 'tallaCamiseta'), [], 'Sin datos, historial vacío');
eq(historialDe(base(), 'inventado'), [], 'Y con un dato que no existe tampoco revienta');

// Guardar el mismo valor dos veces no infla el historial.
const mismo = guardar(guardar(base(), 'tallaCamiseta', 'M'), 'tallaCamiseta', 'M', { hoy: '2026-10-01' });
eq(historialDe(mismo, 'tallaCamiseta').length, 1, '⚠️ Guardar lo mismo dos veces no crea dos entradas');

/* ── 9 · ANTIGÜEDAD (apartado 10) ────────────────────────────────────────── */

const viejo = guardar(base(), 'tipoPiel', 'seca', { hoy: '2026-05-01' });
eq(antiguedadDato(viejo, 'tipoPiel', { hoy: HOY }).texto, 'Actualizado hace 3 meses',
  '⚠️ El ejemplo LITERAL del enunciado: "Actualizado hace 3 meses"');
eq(antiguedadDato(guardar(base(), 'tipoPiel', 'x', { hoy: HOY }), 'tipoPiel', { hoy: HOY }).texto,
  'Actualizado hoy', 'Hoy');
eq(antiguedadDato(guardar(base(), 'tipoPiel', 'x', { hoy: '2026-08-26' }), 'tipoPiel', { hoy: HOY }).texto,
  'Actualizado ayer', 'Ayer');
eq(antiguedadDato(guardar(base(), 'tipoPiel', 'x', { hoy: '2026-08-17' }), 'tipoPiel', { hoy: HOY }).texto,
  'Actualizado hace 10 días', 'Días');
eq(antiguedadDato(guardar(base(), 'tipoPiel', 'x', { hoy: '2026-07-25' }), 'tipoPiel', { hoy: HOY }).texto,
  'Actualizado hace 1 mes', 'Un mes, en singular');
ok(antiguedadDato(guardar(base(), 'tipoPiel', 'x', { hoy: '2024-01-01' }), 'tipoPiel', { hoy: HOY }).texto.includes('años'),
  'Y más de un año');
ok(antiguedadDato(viejo, 'tipoPiel', { hoy: '2027-06-01' }).antiguo, 'Marca lo posiblemente antiguo');
ok(!antiguedadDato(viejo, 'tipoPiel', { hoy: HOY }).antiguo, `Y por debajo de ${DIAS_POSIBLEMENTE_ANTIGUO} días, no`);
eq(antiguedadDato(base(), 'tipoPiel', { hoy: HOY }), { dias: null, texto: '', antiguo: false },
  '⚠️ Un dato que no existe no tiene antigüedad ni la inventa');

// ⚠️ Describe, no juzga: la misma línea que la analítica del Horario (HT F11).
['deberías', 'llevas', 'olvidado', 'demasiado', 'mal'].forEach((reproche) => {
  ok(!antiguedadDato(viejo, 'tipoPiel', { hoy: '2028-01-01' }).texto.toLowerCase().includes(reproche),
    `Nunca reprocha: "${reproche}"`);
});

/* ── 10 · DEPENDENCIAS (apartado 14) ─────────────────────────────────────── */

// *"Productos → necesita preferencias de Skincare. Si Skincare está
//  desactivado: NO debe romper Productos."*
ok(dependenciasDe('productos').includes('skincare'), 'Productos depende de Skincare, como dice el enunciado');
ok(dependenciasDe('skincare').includes('productos'), 'Y al revés');
eq(dependenciasDe('inventado'), [], 'Un módulo que no existe no tiene dependencias');

const sinSkincare = alternarModulo(base(), 'skincare', false);
const dep = estadoDependencia(sinSkincare, 'productos', 'tipoPiel', GLOBAL);
ok(!dep.listo, 'Falta el tipo de piel');
ok(dep.texto.includes('personalizar'), '⚠️ Apartado 14: la frase del enunciado, no un error');
eq(dep.accion, ACCION_ANADIR, 'Con la salida');
['error', 'undefined', 'null', 'falta', 'no se puede'].forEach((feo) => {
  ok(!dep.texto.toLowerCase().includes(feo), `⚠️ Nunca "${feo}": no romper es no asustar`);
});

// ⚠️ Y con el dato puesto, apagar Skincare NO rompe Productos.
const conPielSinSkincare = alternarModulo(guardar(base(), 'tipoPiel', 'seca'), 'skincare', false);
ok(estadoDependencia(conPielSinSkincare, 'productos', 'tipoPiel', GLOBAL).listo,
  '⚠️ Test 6: el dato sigue disponible con su módulo apagado');

const falta = loQueLeFalta(base(), 'skincare', GLOBAL);
ok(falta.length > 0, 'Skincare tiene datos por rellenar');
ok(falta.every((d) => d.texto && d.nombre), 'Cada uno con su frase');
eq(loQueLeFalta(base(), 'inventado', GLOBAL), [], 'Un módulo que no existe no falta nada');

/* ── 11 · DESACTIVAR NO ES ELIMINAR (apartado 13) ────────────────────────── */

// Tests 6 y 7 — el enunciado lo repite entero porque "será fundamental".
const conPiel = guardar(base(), 'tipoPiel', 'seca', { modulo: 'skincare' });
const apagado = alternarModulo(conPiel, 'skincare', false);
eq(leerDato(apagado, 'tipoPiel', GLOBAL).valor, 'seca', '⚠️ Test 6: Skincare apagado, tipo de piel sigue guardado');
const reencendido = alternarModulo(apagado, 'skincare', true);
eq(leerDato(reencendido, 'tipoPiel', GLOBAL).valor, 'seca', '⚠️ Test 7: y al reactivarlo, todo sigue disponible');

/* ── 12 · TESTS 9 Y 10 — PERSISTENCIA Y SINCRONIZACIÓN ───────────────────── */

const antes = guardar(guardar(base(), 'tipoPiel', 'seca'), 'tallaCamiseta', 'M');
const despues = normalizarEstiloHombre(JSON.parse(JSON.stringify(antes)));
eq(leerDato(despues, 'tipoPiel', GLOBAL).valor, 'seca', 'Test 9: los datos sobreviven al guardado');
eq(leerDato(despues, 'tallaCamiseta', GLOBAL).valor, 'M', 'Test 9: los dos');
eq(Object.keys(normalizarDatosEH(despues.datos)).length, 2, '⚠️ Test 10: y sin duplicarse');
ok('datos' in normalizarEstiloHombre({}), '⚠️ Sexto campo, y el normalizador lo conoce');
console.log('  ⚠️  Test 10 completo (dos dispositivos de verdad) es R1: aquí solo se comprueba que el guardado no duplica.');

// Un dato guardado que ya no está en el registro NO se borra (apartados 12 y 17).
const conViejo = normalizarEstiloHombre({
  configurado: true, modulos: [], datos: { deOtraVersion: { valor: 'algo', actualizadoEn: HOY } },
});
eq(normalizarDatosEH(conViejo.datos).deOtraVersion.valor, 'algo',
  '⚠️ Apartado 17: un dato de otra versión NO se borra solo');

// Entradas corruptas.
[null, undefined, 'roto', 42, [], { x: null }, { x: 'roto' }, { x: { historial: 'roto' } }].forEach((malo, i) => {
  const d = normalizarDatosEH(malo);
  ok(d && typeof d === 'object' && !Array.isArray(d), `Datos corruptos ${i} no revientan`);
});
eq(normalizarDatosEH({ x: { historial: [null, { fecha: 5 }, { valor: 1, fecha: HOY }] } }).x.historial.length, 1,
  'Una entrada de historial rota se descarta, las buenas se quedan');

/* ── 13 · PRIVACIDAD (apartado 11) ───────────────────────────────────────── */

eq(datosPrivados(), [],
  '⚠️ Hoy ningún dato está marcado como privado, y decirlo es más honesto que fingir una protección');
const compartibles = datosCompartibles(guardar(base(), 'tipoPiel', 'seca'), GLOBAL);
eq(compartibles.length, 1, 'Solo se comparte lo que hay');
ok(compartibles.every((d) => !d.privado), '⚠️ Y el filtro existe, para que la fase que marque uno no lo construya');

/* ── 14 · VISTA DE CONJUNTO ──────────────────────────────────────────────── */

const grupos = todosLosDatos(guardar(base(), 'tipoPiel', 'seca'), GLOBAL);
ok(grupos.every((g) => g.datos.length > 0), '⚠️ Ninguna categoría vacía se pinta');
eq(grupos.reduce((s, g) => s + g.datos.length, 0), REGISTRO_DATOS.length + DATOS_GLOBALES_EH.length,
  'Salen todos los datos: propios y globales');
ok(grupos.some((g) => g.datos.some((d) => d.origen === 'global')), 'Con los globales');
ok(grupos.some((g) => g.datos.some((d) => d.origen === 'propio')), 'Y los propios');

const res = resumenDatos(guardar(base(), 'tipoPiel', 'seca'), GLOBAL);
eq(res.propios, 1, 'Un dato propio guardado');
eq(res.propiosTotal, REGISTRO_DATOS.length, 'De los que hay');
eq(res.globales, 8, 'Y los ocho globales que ya sabemos');
ok(res.compartidos > 0, '⚠️ Cuántos se reutilizan entre módulos: el apartado 7 en una cifra');
eq(res.privados, 0, 'Ninguno privado hoy');
eq(resumenDatos(base(), {}).globales, 0, 'Con la cuenta en blanco, ninguno');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
