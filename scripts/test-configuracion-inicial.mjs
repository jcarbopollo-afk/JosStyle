// ============================================================================
// EH · Fase 3/65 — PRUEBAS
//
// El apartado 18 pide diez tests. Están los diez; el 10 ("probar todo el flujo
// en móvil") no se puede ejecutar sin un iPhone y lo dice, en vez de darse por
// bueno. Es R1, igual que el Test J de la Fase 2.
//
// Los dos que más importan son el 6 (no volver a preguntar lo que ya sabemos) y
// el 8 (quitar un módulo conserva sus datos), porque los dos fallan EN SILENCIO:
// nada se rompe, simplemente se pierde información o se le pregunta dos veces.
// ============================================================================

import {
  DEFAULT_ESTILO_HOMBRE, MODULOS_EH, IDS_EH, normalizarEstiloHombre,
  modulosActivos, guardarConfig, alternarModulo, configurarPrimeraVez,
} from '../src/lib/estiloDeHombre.js';
import {
  PASOS_ASISTENTE, IDS_PASOS, pasoAsistente, puedeOmitir, TEXTO_OMITIR,
  DEFAULT_ASISTENTE, ESTADOS_ASISTENTE, normalizarAsistente, estadoAsistente, puedeContinuar,
  iniciarAsistente, irAPaso, avanzar, retroceder,
  marcarEnSeleccion, seleccionarTodos, limpiarSeleccion, contadorSeleccion,
  terminarAsistente, omitirAsistente, reiniciarAsistente, modificarConfiguracion,
  CLASES_DATO, DESCRIPCION_CLASE, DATOS_GLOBALES_EH, datoGlobalEH,
  loQueYaSabemos, seDebePreguntar, NECESIDADES_MODULO, configuracionPendiente,
  misDatos, resumenAsistente,
} from '../src/lib/configuracionInicial.js';

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

// El JosStyle de Josué, tal y como está de verdad.
const GLOBAL = {
  perfil: { nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72, sexo: 'Masculino' },
  salud: { medidas: [{ fecha: '2026-08-01', peso: 71 }, { fecha: '2026-08-20', peso: 73 }], historial: [] },
  objetivos: { lista: [{ id: 'o1', titulo: 'Front lever' }] },
  calistenia: { Dominadas: { sesiones: [{ fecha: HOY }] } },
  sueno: [{ fecha: HOY, horas: 8 }],
};
// Y una cuenta recién creada, donde no sabemos nada.
const VACIO = { perfil: {}, salud: { medidas: [] }, objetivos: { lista: [] }, calistenia: {}, sueno: [] };

/* ── 1 · LOS PASOS (apartados 1, 2, 3 y 14) ──────────────────────────────── */

eq(IDS_PASOS, ['bienvenida', 'explicacion', 'seleccion', 'final'], 'Los cuatro pasos del enunciado');
ok(PASOS_ASISTENTE.every((p) => p.titulo && p.texto && p.boton && p.icono), 'Cada paso con su texto y su botón');

// Los textos son los del enunciado, literales.
ok(pasoAsistente('bienvenida').texto.includes('Puedes cambiarlo todo más adelante'), 'Bienvenida literal');
ok(pasoAsistente('explicacion').titulo === 'Tú decides qué aparece', 'Explicación literal');
ok(pasoAsistente('final').titulo === 'Tu espacio está listo', 'Final literal');
ok(pasoAsistente('final').boton.includes('Entrar en Estilo de hombre'), 'Y su botón');
eq(pasoAsistente('inventado'), null, 'Un paso que no existe devuelve null');

// Apartado 6 — omitir está en todos menos en el último.
ok(IDS_PASOS.filter(puedeOmitir).length === 3, '⚠️ Se puede omitir en los tres primeros pasos');
ok(!puedeOmitir('final'), 'En el final ya no queda nada que omitir');
eq(TEXTO_OMITIR, 'Omitir por ahora', 'Con el texto del enunciado');

/* ── 2 · EL ESTADO DEL ASISTENTE (apartado 15) ───────────────────────────── */

eq(ESTADOS_ASISTENTE, ['nunca', 'en_curso', 'terminado', 'omitido'], 'Los cuatro estados');
eq(estadoAsistente(DEFAULT_ESTILO_HOMBRE), 'nunca', 'Test 1: un usuario nuevo no ha empezado');
ok(!puedeContinuar(DEFAULT_ESTILO_HOMBRE), 'Y no hay nada que continuar');

// ⚠️ Alguien que ya configuró en las Fases 1 y 2 NO vuelve a ver la bienvenida.
const antiguo = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);
eq(estadoAsistente(antiguo), 'terminado',
  '⚠️ Quien configuró antes de que existiera el asistente no lo repite');

// Un guardado a medias (en_curso sin paso) no deja el asistente en un limbo.
eq(normalizarAsistente({ estado: 'en_curso', paso: null }).estado, 'nunca',
  '⚠️ "en_curso" sin paso es un guardado a medias: se trata como nunca empezado');
eq(normalizarAsistente({ paso: 'inventado' }).paso, null, 'Un paso que no existe se descarta');
eq(normalizarAsistente({ seleccion: ['pelo', 'no_existe'] }).seleccion, ['pelo'],
  'Un módulo que ya no está en el catálogo sale de la selección');
[null, undefined, 'roto', 42, { seleccion: 'roto' }].forEach((malo, i) => {
  const a = normalizarAsistente(malo);
  ok(Array.isArray(a.seleccion) && ESTADOS_ASISTENTE.includes(a.estado), `Entrada corrupta ${i} no revienta`);
});

/* ── 3 · ⚠️ EL CAMPO NUEVO Y EL NORMALIZADOR ─────────────────────────────── */

// Quinta vez que se añade un campo a una entidad de este proyecto. Las cuatro
// anteriores se perdió en el siguiente guardado (regla 5: saveData sobrescribe).
const enCurso = irAPaso(iniciarAsistente(DEFAULT_ESTILO_HOMBRE, { hoy: HOY }), 'seleccion');
const conSeleccion = marcarEnSeleccion(enCurso, 'skincare');
const traGuardar = normalizarEstiloHombre(JSON.parse(JSON.stringify(conSeleccion)));
eq(normalizarAsistente(traGuardar.asistente).paso, 'seleccion',
  '⚠️ Test 4: el paso sobrevive al guardado — donde se perdía las cuatro veces anteriores');
eq(normalizarAsistente(traGuardar.asistente).seleccion, ['skincare'], '⚠️ Test 4: y la selección');
eq(estadoAsistente(traGuardar), 'en_curso', 'Test 4: y al volver puede continuar');
ok(puedeContinuar(traGuardar), 'Test 4: "Continuar configuración" tiene sentido');
ok('asistente' in normalizarEstiloHombre({}), 'El normalizador conoce el campo');

/* ── 4 · MOVERSE (apartados 1-3) ─────────────────────────────────────────── */

const nuevo = iniciarAsistente(DEFAULT_ESTILO_HOMBRE, { hoy: HOY });
eq(normalizarAsistente(nuevo.asistente).paso, 'bienvenida', 'Test 1: empieza por la bienvenida');
eq(normalizarAsistente(nuevo.asistente).empezadoEn, HOY, 'Con la fecha');

let p = nuevo;
eq(normalizarAsistente((p = avanzar(p)).asistente).paso, 'explicacion', 'Avanza a la explicación');
eq(normalizarAsistente((p = avanzar(p)).asistente).paso, 'seleccion', 'Y a la selección');
eq(normalizarAsistente((p = avanzar(p)).asistente).paso, 'final', 'Y al final');
eq(normalizarAsistente(avanzar(p).asistente).paso, 'final', '⚠️ Del final no se avanza más');
eq(normalizarAsistente(retroceder(p).asistente).paso, 'seleccion', 'Se puede retroceder');
eq(normalizarAsistente(retroceder(nuevo).asistente).paso, 'bienvenida', '⚠️ De la bienvenida no se retrocede');
eq(normalizarAsistente(irAPaso(nuevo, 'inventado').asistente).paso, 'bienvenida', 'Un paso inventado no mueve nada');
// Avanzar sin haber empezado arranca el asistente en vez de romperse.
eq(normalizarAsistente(avanzar(DEFAULT_ESTILO_HOMBRE).asistente).paso, 'bienvenida', 'Avanzar sin empezar lo arranca');

// ⚠️ Moverse por el asistente NO enciende ni apaga nada.
eq(modulosActivos(p).length, 0, '⚠️ Llegar al final sin confirmar no ha encendido nada');
ok(!normalizarEstiloHombre(p).configurado, 'Ni ha marcado configurado');

/* ── 5 · LA SELECCIÓN (apartados 3, 4 y 5) ───────────────────────────────── */

let s = irAPaso(nuevo, 'seleccion');
s = marcarEnSeleccion(s, 'skincare');
s = marcarEnSeleccion(s, 'pelo');
eq(contadorSeleccion(s).n, 2, 'Test 2: dos marcados');
eq(contadorSeleccion(s).texto, '2 apartados seleccionados', 'Con el texto del apartado 5');
eq(contadorSeleccion(marcarEnSeleccion(s, 'pelo')).n, 1, 'Volver a tocar lo desmarca');
eq(contadorSeleccion(marcarEnSeleccion(s, 'pelo')).texto, '1 apartado seleccionado', 'En singular');
eq(contadorSeleccion(nuevo).texto, 'Ningún apartado seleccionado', 'Y en vacío');
eq(contadorSeleccion(marcarEnSeleccion(s, 'inventado')).n, 2, 'Un id que no existe no se marca');

// Apartado 4 — "pero no debe ser la opción predeterminada".
eq(contadorSeleccion(DEFAULT_ESTILO_HOMBRE).n, 0, '⚠️ De partida NO hay nada seleccionado');
eq(contadorSeleccion(seleccionarTodos(s)).n, MODULOS_EH.length, 'Seleccionar todos');
ok(contadorSeleccion(seleccionarTodos(s)).todos, 'Y lo sabe');
eq(contadorSeleccion(limpiarSeleccion(s)).n, 0, 'Limpiar selección');
ok(contadorSeleccion(limpiarSeleccion(s)).ninguno, 'Y lo sabe');

// ⚠️ Ni "seleccionar todos" ni "limpiar" tocan los módulos: solo la selección.
eq(modulosActivos(seleccionarTodos(s)).length, 0, '⚠️ Seleccionar todos no enciende nada todavía');

/* ── 6 · TERMINAR (apartado 14) ──────────────────────────────────────────── */

const terminado = terminarAsistente(s, { hoy: HOY });
eq(modulosActivos(terminado).map((m) => m.id), ['skincare', 'pelo'], 'Test 2: al confirmar se aplica la selección');
ok(normalizarEstiloHombre(terminado).configurado, 'Y queda configurado');
eq(estadoAsistente(terminado), 'terminado', 'Y el asistente, terminado');
eq(normalizarAsistente(terminado.asistente).terminadoEn, HOY, 'Con la fecha');
eq(normalizarEstiloHombre(terminado).creadoEn, HOY, 'Y la de creación');

// El orden es el que eligió, no el del catálogo.
eq(modulosActivos(terminarAsistente(marcarEnSeleccion(limpiarSeleccion(s), 'productos'))).map((m) => m.id),
  ['productos'], 'El orden sale de la selección');

/* ── 7 · OMITIR (apartado 6) ─────────────────────────────────────────────── */

const omitido = omitirAsistente(nuevo, { hoy: HOY });
eq(estadoAsistente(omitido), 'omitido', 'Test 3: se puede omitir');
eq(modulosActivos(omitido).length, 0, 'Test 3: y no enciende nada');
ok(normalizarEstiloHombre(omitido).configurado,
  '⚠️ Test 3: pero marca configurado — si no, la bienvenida volvería a salir, que es lo contrario de saltárselo');
eq(normalizarEstiloHombre(omitido).modulos.length, MODULOS_EH.length,
  'Test 3: los trece apartados siguen disponibles en Gestionar apartados');

// ⚠️ Omitir a media selección tampoco pierde lo marcado.
eq(normalizarAsistente(omitirAsistente(s).asistente).seleccion, ['skincare', 'pelo'],
  '⚠️ Omitir conserva lo que llevaba marcado, por si vuelve');

/* ── 8 · EMPEZAR DE NUEVO Y MODIFICAR (apartados 15 y 16) ────────────────── */

// Test 7 — modificar configuración conserva los datos anteriores.
const conDatos = guardarConfig(terminado, 'skincare', { tipoPiel: 'mixta' });
const modificando = modificarConfiguracion(conDatos, { hoy: HOY });
eq(normalizarAsistente(modificando.asistente).paso, 'seleccion',
  'Apartado 16: "Modificar mi configuración" entra directo en la selección');
eq(normalizarAsistente(modificando.asistente).seleccion, ['skincare', 'pelo'],
  'Con lo que hoy está encendido ya marcado');
// ⚠️ Y EN SU ORDEN, no en el del catálogo (donde Pelo va antes que Skincare):
// `terminarAsistente` reescribe el orden a partir de la selección, así que entrar
// y confirmar sin cambiar nada le reordenaría las plaquitas en silencio. Era un
// fallo real, y esta prueba es la que lo encontró.
eq(modulosActivos(terminarAsistente(modificando)).map((m) => m.id), ['skincare', 'pelo'],
  '⚠️ Modificar y confirmar sin tocar nada NO reordena las plaquitas');
eq(modulosActivos(terminarAsistente(iniciarAsistente(conDatos))).map((m) => m.id), ['skincare', 'pelo'],
  '⚠️ Y retomar el asistente tampoco');
eq(normalizarEstiloHombre(modificando).modulos.find((m) => m.id === 'skincare').config, { tipoPiel: 'mixta' },
  '⚠️ Test 7: y NO borra datos — el apartado 16 lo dice con esas palabras');

// Test 8 — quitar un módulo desde el asistente conserva sus datos.
const sinSkincare = terminarAsistente(marcarEnSeleccion(modificando, 'skincare'));
ok(!modulosActivos(sinSkincare).some((m) => m.id === 'skincare'), 'Test 8: se ha quitado');
eq(normalizarEstiloHombre(sinSkincare).modulos.find((m) => m.id === 'skincare').config, { tipoPiel: 'mixta' },
  '⚠️ Test 8: y sus datos siguen ahí');

// Test 9 — reactivar recupera la configuración.
const otraVez = terminarAsistente(marcarEnSeleccion(modificarConfiguracion(sinSkincare), 'skincare'));
ok(modulosActivos(otraVez).some((m) => m.id === 'skincare'), 'Test 9: reactivado');
eq(normalizarEstiloHombre(otraVez).modulos.find((m) => m.id === 'skincare').config, { tipoPiel: 'mixta' },
  '⚠️ Test 9: con su configuración recuperada');

// "Empezar de nuevo" reinicia EL ASISTENTE, no los módulos.
const dezero = reiniciarAsistente(conDatos, { hoy: HOY });
eq(normalizarAsistente(dezero.asistente).paso, 'bienvenida', 'Apartado 15: "Empezar de nuevo"');
eq(normalizarAsistente(dezero.asistente).seleccion, [], 'Con la selección en blanco');
eq(normalizarEstiloHombre(dezero).modulos.find((m) => m.id === 'skincare').config, { tipoPiel: 'mixta' },
  '⚠️ Pero los datos de cada apartado NO se tocan: "volver a elegir" no es "perderlo todo"');
ok(modulosActivos(dezero).some((m) => m.id === 'skincare'), 'Y lo encendido sigue encendido hasta que confirme');

// Retomar tras abandonar recupera la selección, no la pisa.
const retomado = iniciarAsistente(conSeleccion, { hoy: '2026-09-01' });
eq(normalizarAsistente(retomado.asistente).seleccion, ['skincare'], 'Retomar conserva lo marcado');
eq(normalizarAsistente(retomado.asistente).paso, 'seleccion', 'Y el paso');
eq(normalizarAsistente(retomado.asistente).empezadoEn, HOY, 'Y la fecha de cuando empezó de verdad');

/* ── 9 · ⚠️ NO PREGUNTAR LO QUE YA SABEMOS (apartados 7 y 12) ────────────── */

eq(DATOS_GLOBALES_EH.length, 8, 'Los datos que JosStyle ya conoce');
ok(DATOS_GLOBALES_EH.every((d) => d.campo && d.que && d.donde && typeof d.leer === 'function'),
  'Cada uno con su nombre, su sitio y cómo se lee');
ok(datoGlobalEH('peso') !== null, 'Se puede buscar uno');
eq(datoGlobalEH('inventado'), null, 'Y uno que no existe devuelve null');

const sabemos = loQueYaSabemos(GLOBAL);
eq(sabemos.sabidos.length, 8, '⚠️ Test 6: con el JosStyle de Josué lo sabemos todo');
eq(sabemos.faltan.length, 0, 'Y no falta nada');
ok(sabemos.sabidos.every((d) => d.donde), 'Cada dato dice de dónde sale');

// ⚠️ El peso: la última medida de Salud gana al del perfil, porque es posterior.
eq(sabemos.sabidos.find((d) => d.campo === 'peso').valor, 73,
  '⚠️ El peso sale de la última medida de Salud (73), no del perfil (72)');
eq(loQueYaSabemos({ perfil: { peso: 72 }, salud: { medidas: [] } }).sabidos.find((d) => d.campo === 'peso').valor, 72,
  'Sin medidas, vale el del perfil');

const enBlanco = loQueYaSabemos(VACIO);
eq(enBlanco.sabidos.length, 0, 'Una cuenta en blanco: no sabemos nada');
eq(enBlanco.faltan.length, 8, 'Y hay que preguntarlo todo');
ok(enBlanco.faltan.every((d) => d.donde), '⚠️ …pero se dice DÓNDE se rellena, no aquí');

// Entradas rotas: si el módulo global está corrupto no se cae el asistente.
[null, undefined, {}, { perfil: null }, { salud: 'roto' }, { calistenia: 5 }].forEach((malo, i) => {
  const r = loQueYaSabemos(malo);
  ok(r.sabidos.length + r.faltan.length === 8, `Global corrupto ${i} no revienta`);
});

// La comprobación que impide preguntar dos veces.
ok(!seDebePreguntar('peso', GLOBAL).preguntar, '⚠️ Test 6: el peso NO se pregunta, ya lo sabemos');
ok(seDebePreguntar('peso', GLOBAL).motivo.includes('Salud'), 'Y se dice dónde está');
ok(seDebePreguntar('peso', VACIO).preguntar, 'Si está vacío, sí se pregunta');
ok(seDebePreguntar('peso', VACIO).motivo.includes('vacío'), 'Con el motivo escrito');
ok(seDebePreguntar('tipoPiel', GLOBAL).preguntar, 'El tipo de piel no lo sabemos: se pregunta en su fase');
ok(!seDebePreguntar('armario', GLOBAL).preguntar, '⚠️ Lo que está en FUENTES_GLOBALES tampoco se pregunta');
ok(seDebePreguntar('armario', GLOBAL).motivo.includes('Ya existe'), 'Y se dice por qué');

/* ── 10 · LAS TRES CLASES DE DATO (apartado 11) ──────────────────────────── */

eq(CLASES_DATO, ['necesario', 'preferencia', 'opcional'], 'Las tres clases del enunciado');
ok(CLASES_DATO.every((c) => DESCRIPCION_CLASE[c] && DESCRIPCION_CLASE[c].length > 10),
  'Cada una con su descripción, para que la fase 13 no invente la suya');

/* ── 11 · QUÉ NECESITA CADA MÓDULO (apartados 8, 9 y 17) ─────────────────── */

ok(Object.keys(NECESIDADES_MODULO).length === MODULOS_EH.length, 'Los trece módulos declarados');
ok(Object.values(NECESIDADES_MODULO).every((x) => Array.isArray(x.usa) && Number.isFinite(x.pregunta)),
  'Cada uno dice qué reutiliza y en qué fase pregunta lo suyo');
ok(Object.values(NECESIDADES_MODULO).every((x) => x.usa.every((c) => datoGlobalEH(c) !== null)),
  '⚠️ Todo lo que un módulo dice reutilizar existe de verdad como dato global');

// ⚠️ Apartado 17 — aquí NO hay ni una pregunta escrita.
ok(!JSON.stringify(NECESIDADES_MODULO).includes('?'),
  '⚠️ Apartado 17: ni una pregunta construida en esta fase');

const pendiente = configuracionPendiente(terminado, GLOBAL);
eq(pendiente.length, 2, 'Los dos módulos elegidos tienen configuración pendiente');
ok(pendiente.every((x) => x.listo === false), '⚠️ Y ninguno está listo hoy: se dice, no se finge');
ok(pendiente.every((x) => x.texto.includes('fase')), '⚠️ Con la fase en la que llega, en vez de "próximamente"');
eq(configuracionPendiente(omitido, GLOBAL).length, 0, 'Sin módulos activos no hay nada pendiente');

// Apartado 12 — un módulo que reutiliza datos lo dice.
const conFitness = terminarAsistente(marcarEnSeleccion(limpiarSeleccion(s), 'fitness'));
eq(configuracionPendiente(conFitness, GLOBAL)[0].reutiliza, 4,
  '⚠️ Fitness reutiliza cuatro datos que ya sabemos: peso, altura, entrenamiento y objetivos');
eq(configuracionPendiente(conFitness, VACIO)[0].reutiliza, 0,
  'Con la cuenta en blanco no reutiliza nada, porque no hay nada');

/* ── 12 · MIS DATOS (apartado 13) ────────────────────────────────────────── */

const mios = misDatos(conDatos, GLOBAL);
eq(mios.globales.length, 8, 'Enseña los ocho datos globales');
ok(mios.globales.every((d) => d.editableAqui === false),
  '⚠️ Ninguno se edita aquí: dos sitios para el mismo dato y uno acaba mintiendo');
ok(mios.globales.every((d) => d.donde), 'Cada uno dice dónde se cambia');
eq(mios.sabidos, 8, 'Cuenta los que sabemos');
eq(mios.porSaber, 0, 'Y los que no');
eq(misDatos(conDatos, VACIO).sabidos, 0, 'Con la cuenta en blanco, ninguno');
eq(mios.porModulo.length, 1, 'Y lo que ha guardado cada módulo: hoy solo skincare');
eq(mios.porModulo[0].campos, 1, 'Con cuántos campos');
eq(misDatos(terminado, GLOBAL).porModulo, [], 'Un módulo sin datos no sale en la lista');

/* ── 13 · RESUMEN ────────────────────────────────────────────────────────── */

const r = resumenAsistente(enCurso, GLOBAL);
eq(r.estado, 'en_curso', 'El resumen sabe por dónde va');
eq(r.numero, 3, 'Paso 3');
eq(r.de, 4, 'de 4');
ok(r.puedeContinuar, 'Y que puede continuar');
eq(r.yaSabemos, 8, 'Cuántos datos ya sabemos');
eq(resumenAsistente(DEFAULT_ESTILO_HOMBRE, GLOBAL).numero, 0, 'Sin empezar, paso 0');
eq(resumenAsistente(terminado, GLOBAL).pendientes, 2, 'Al terminar dice qué queda por configurar');
eq(resumenAsistente(omitido, GLOBAL).estado, 'omitido', 'Y distingue omitido de terminado');

/* ── 14 · TEST 5 — SELECCIONAR UN MÓDULO, CONFIGURARLO DESPUÉS ───────────── */

const conPelo = terminarAsistente(marcarEnSeleccion(limpiarSeleccion(s), 'pelo'));
ok(modulosActivos(conPelo).some((m) => m.id === 'pelo'), 'Test 5: seleccionado');
const conPeloConfigurado = guardarConfig(conPelo, 'pelo', { tipo: 'ondulado' });
eq(normalizarEstiloHombre(conPeloConfigurado).modulos.find((m) => m.id === 'pelo').config, { tipo: 'ondulado' },
  'Test 5: y su fase podrá guardarle su configuración sin cambiar nada de aquí');

/* ── 15 · TEST 10 — MÓVIL ────────────────────────────────────────────────── */

console.log('  ⚠️  Test 10 (flujo completo en móvil) necesita un iPhone: es R1, como el Test J de la Fase 2.');

/* ── 16 · APARTADO 7 — NADA DE ESTO SE GUARDA ───────────────────────────── */

// La comprobación de verdad: el asistente NUNCA guarda un dato global.
const guardadoFinal = JSON.stringify(normalizarEstiloHombre(terminarAsistente(seleccionarTodos(s))));
['Josué', '2010-07-29', '187', 'Masculino'].forEach((dato) => {
  ok(!guardadoFinal.includes(dato),
    `⚠️ Apartado 7: "${dato}" NO se copia dentro de Estilo de hombre`);
});
eq(Object.keys(DEFAULT_ASISTENTE).sort(), ['empezadoEn', 'estado', 'paso', 'seleccion', 'terminadoEn'],
  '⚠️ El asistente guarda cinco cosas, y ninguna es un dato de Josué');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
