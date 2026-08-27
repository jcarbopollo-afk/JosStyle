// ============================================================================
// EH · Fase 5/65 — PRUEBAS
//
// Los diez tests del apartado 15 son, casi todos, de la forma "no se ha
// duplicado nada". Eso se comprueba de verdad, y la prueba más importante no es
// ninguna de las diez: es la que **lee el código fuente** y falla si este
// archivo puede escribir en el armario. El apartado 7 lo prohíbe, y acordarse no
// es una garantía.
//
// El Test 10 (navegación en móvil) necesita un iPhone: R1, y se dice.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { leerDato, guardarDato, REGISTRO_DATOS } from '../src/lib/datosEstiloHombre.js';
import {
  DEFAULT_ARMARIO, crearPrenda, crearOutfit, crearUso, actualizarPrenda,
  CATEGORIAS_ARMARIO, OCASIONES_OUTFIT,
} from '../src/lib/armario.js';
import {
  MODULO_EH_ESTILO, DESTINO_ARMARIO, accesoAlArmario, inventarioDeEstilo,
  TALLAS_ESTILO, tallaEstilo, ORIGENES_TALLA, tallaDe, perfilDeTallas, guardarTalla,
  DATOS_FISICOS_ESTILO, perfilFisicoParaEstilo,
  PREFERENCIAS_PROPIAS, preferenciasDeEstilo, preferenciasParaOtrosModulos,
  MOTIVOS_SIN_RECOMENDACION, recomendacionesDeEstilo, loQueFaltaParaRecomendar,
  PUENTE_PRODUCTOS, auditarIntegracionArmario, resumenEstiloArmario,
} from '../src/lib/armarioEnEstiloHombre.js';

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
  perfil: { nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72 },
  salud: { medidas: [{ fecha: '2026-08-20', peso: 73 }] },
  objetivos: { lista: [] }, calistenia: {}, sueno: [],
};

const conEstilo = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo', 'productos']);

// Un armario de verdad: cuatro camisetas M, una L, dos pantalones 42, cero calzado.
const p = (d) => crearPrenda(d);
const prendas = [
  p({ nombre: 'Camiseta negra', categoria: 'camisetas', color: 'negro', talla: 'M', marca: 'Zara' }),
  p({ nombre: 'Camiseta blanca', categoria: 'camisetas', color: 'blanco', talla: 'M', marca: 'Zara' }),
  p({ nombre: 'Polo azul', categoria: 'polos', color: 'azul', talla: 'M', marca: 'Nike' }),
  p({ nombre: 'Sudadera', categoria: 'sudaderas', color: 'gris', talla: 'L', marca: 'Nike' }),
  p({ nombre: 'Vaqueros', categoria: 'pantalones', color: 'azul', talla: '42', marca: 'Levis' }),
  p({ nombre: 'Chinos', categoria: 'pantalones', color: 'beige', talla: '42', marca: 'Zara' }),
];
// ⚠️ `ocasion`, en singular: un outfit guarda UNA. Suponer `ocasiones: []` daba
// cero ocasiones siempre y en silencio — lo encontró esta prueba.
const outfit = crearOutfit({ nombre: 'Clase', prendaIds: [prendas[0].id, prendas[4].id], ocasion: 'estudios' });
const ARMARIO = { ...DEFAULT_ARMARIO, prendas, outfits: [outfit], usos: [] };
const conUsos = {
  ...ARMARIO,
  usos: ['2026-08-01', '2026-08-05', '2026-08-10', '2026-08-15', '2026-08-20', '2026-08-25']
    .map((f) => crearUso({ outfitId: outfit.id, fecha: f })),
};

/* ── 1 · ⚠️ LA PRUEBA QUE MÁS IMPORTA (apartados 7 y 11) ─────────────────── */

// *"Una recomendación nunca debe convertirse automáticamente en una modificación
//  del armario."* La forma de garantizarlo no es acordarse: es que la capacidad
//  no exista. Esto lee el código fuente.
const fuente = readFileSync(new URL('../src/lib/armarioEnEstiloHombre.js', import.meta.url), 'utf8');
['crearPrenda', 'actualizarPrenda', 'crearOutfit', 'actualizarOutfit', 'crearUso', 'eliminarPrenda']
  .forEach((f) => {
    ok(!new RegExp(`\\b${f}\\s*\\(`).test(fuente),
      `⚠️ Apartado 7: este archivo NO puede llamar a ${f}() — no escribe en el armario`);
  });
ok(!/prendas:\s*\[/.test(fuente), '⚠️ Ni construye una lista de prendas propia');
ok(!/const\s+CATEGORIAS_ARMARIO\s*=/.test(fuente), '⚠️ Test 9: no redefine las categorías del armario');
ok(!/const\s+OCASIONES_OUTFIT\s*=/.test(fuente), '⚠️ Apartado 13: ni las ocasiones');
ok(!/askAI|AI_SYSTEM|anthropic/i.test(fuente), '⚠️ Apartado 11: ni una llamada a la IA');

/* ── 2 · LA PLAQUITA LLEVA AL ARMARIO QUE YA EXISTE (apartado 1) ─────────── */

eq(DESTINO_ARMARIO, 'armario', 'Lleva al módulo de armario de JosStyle, no a una pantalla nueva');
const acc = accesoAlArmario(conEstilo());
ok(acc.visible, 'Con el apartado encendido, la plaquita se ve');
eq(acc.destino, 'armario', 'Y va al armario de siempre');
ok(!acc.fuera, 'Y no está fuera');
eq(acc.nota, '', 'Sin nota que explicar');

/* ── 3 · TESTS 5 Y 6 — DESACTIVAR NO BORRA (apartado 10) ─────────────────── */

const apagado = alternarModulo(conEstilo(), MODULO_EH_ESTILO, false);
const accOff = accesoAlArmario(apagado);
ok(!accOff.visible, 'Test 5: apagado, la plaquita no aparece');
ok(accOff.fuera, '⚠️ Pero el armario NO desaparece: sigue fuera');
ok(accOff.nota.includes('sigue en su sitio'),
  '⚠️ Y se dice, en vez de dejar un hueco: "el sistema global de armario sigue intacto"');
eq(inventarioDeEstilo(ARMARIO).total, 6, 'Test 5: las prendas siguen ahí');
const reencendido = alternarModulo(apagado, MODULO_EH_ESTILO, true);
ok(accesoAlArmario(reencendido).visible, 'Test 6: reactivado');
eq(inventarioDeEstilo(ARMARIO).total, 6, 'Test 6: con todo intacto');

/* ── 4 · TEST 1 — TODO SIGUE APARECIENDO (apartado 2) ────────────────────── */

const inv = inventarioDeEstilo(ARMARIO);
eq(inv.total, 6, 'Test 1: las seis prendas');
eq(inv.outfits, 1, 'Test 1: el outfit');
eq(inv.marcas, 3, 'Test 1: las tres marcas (Zara, Nike, Levis)');
eq(inv.colores, 5, 'Test 1: los colores');
eq(inv.tallas, 3, 'Test 1: las tallas (M, L, 42)');
eq(inv.ocasiones, 1, 'Test 1: las ocasiones del outfit');
eq(inv.categoriasConPrendas, 4, 'Test 1: las categorías con prendas');
ok(!inv.vacio, 'Y no está vacío');

// ⚠️ Es DERIVADO: no copia nada. Cambiar el armario cambia el recuento solo.
const conUnaMas = { ...ARMARIO, prendas: [...prendas, p({ nombre: 'Botas', categoria: 'zapatos', talla: '43' })] };
eq(inventarioDeEstilo(conUnaMas).total, 7, '⚠️ Test 2: añadir una prenda se ve al momento — es derivado');
const renombrada = { ...ARMARIO, prendas: prendas.map((x, i) => (i === 0 ? actualizarPrenda(x, { nombre: 'Otra' }) : x)) };
eq(inventarioDeEstilo(renombrada).total, 6, 'Test 2: modificar una prenda no cambia el recuento');

// Armario vacío o roto.
[null, undefined, {}, { prendas: null }, { prendas: 'roto' }].forEach((malo, i) => {
  const r = inventarioDeEstilo(malo);
  ok(r.total === 0 && r.vacio === true, `Armario corrupto ${i} no revienta`);
});

/* ── 5 · ⚠️ TEST 8 — UN SOLO PERFIL DE TALLAS (apartado 3) ───────────────── */

eq(TALLAS_ESTILO.length, 3, 'Las tres tallas del ejemplo del enunciado');
eq(TALLAS_ESTILO.map((t) => t.nombre), ['Camiseta', 'Pantalón', 'Calzado'], 'Camiseta, Pantalón, Zapatillas');
ok(TALLAS_ESTILO.every((t) => t.categorias.every((c) => CATEGORIAS_ARMARIO.some((x) => x.id === c))),
  '⚠️ Y sus categorías son las del armario, no una segunda clasificación');
ok(TALLAS_ESTILO.every((t) => REGISTRO_DATOS.some((d) => d.id === t.id)),
  'Cada una está declarada en la capa de datos de la Fase 4');
eq(tallaEstilo('inventada'), null, 'Una talla que no existe devuelve null');
eq(ORIGENES_TALLA, ['armario', 'propia', 'ninguno'], 'Tres orígenes posibles');

// ⚠️ Apartado 3 — se REUTILIZA lo que el armario ya sabe.
const camiseta = tallaDe(conEstilo(), 'tallaCamiseta', ARMARIO, GLOBAL);
eq(camiseta.valor, 'M', '⚠️ Test 8: la talla de camiseta sale del armario (3 de 4 son M)');
eq(camiseta.origen, 'armario', 'Y se dice de dónde');
ok(camiseta.de.includes('de'), 'Con cuántas prendas lo respaldan');
eq(camiseta.conflicto, null, 'Sin choque');

eq(tallaDe(conEstilo(), 'tallaPantalon', ARMARIO, GLOBAL).valor, '42', 'Y el pantalón, 42');

// Sin calzado en el armario: no se inventa nada.
const calzado = tallaDe(conEstilo(), 'tallaCalzado', ARMARIO, GLOBAL);
eq(calzado.valor, null, 'No hay calzado: no se inventa una talla');
eq(calzado.origen, 'ninguno', 'Y se dice');
ok(calzado.texto.includes('No tenemos registrada'), '⚠️ Apartado 8: la frase del enunciado');
eq(calzado.accion, 'Añadir talla', 'Con la salida que pide el enunciado');

// "Pero si el usuario necesita registrar una talla que todavía no existe."
const conCalzado = guardarTalla(conEstilo(), 'tallaCalzado', '43', { hoy: HOY }).estado;
eq(tallaDe(conCalzado, 'tallaCalzado', ARMARIO, GLOBAL).valor, '43', 'Test 3: la talla añadida queda guardada');
eq(tallaDe(conCalzado, 'tallaCalzado', ARMARIO, GLOBAL).origen, 'propia', 'Y se sabe que la puso él');
ok(guardarTalla(conEstilo(), 'inventada', 'X').error !== null, 'Una talla que no existe se rechaza');

// ⚠️ El choque se ENSEÑA, no se resuelve en silencio.
const conflictiva = guardarTalla(conEstilo(), 'tallaCamiseta', 'L', { hoy: HOY }).estado;
const conConflicto = tallaDe(conflictiva, 'tallaCamiseta', ARMARIO, GLOBAL);
eq(conConflicto.valor, 'M', 'El armario manda cuando puede responder');
ok(conConflicto.conflicto !== null, '⚠️ Pero el choque NO se traga: se enseña');
eq(conConflicto.conflicto, { guardada: 'L', armario: 'M' }, 'Con los dos valores, para que él decida');

// Un empate en el armario no es una respuesta.
const empatado = { ...ARMARIO, prendas: [
  p({ categoria: 'zapatillas', talla: '43' }), p({ categoria: 'zapatos', talla: '44' }),
] };
eq(tallaDe(conEstilo(), 'tallaCalzado', empatado, GLOBAL).origen, 'ninguno',
  '⚠️ Un empate en el armario NO es una respuesta: dos tallas iguales de frecuentes');
// …y entonces gana la que él puso.
eq(tallaDe(guardarTalla(conEstilo(), 'tallaCalzado', '43').estado, 'tallaCalzado', empatado, GLOBAL).origen, 'propia',
  'Con empate, manda la que él indicó');

const perfil = perfilDeTallas(conEstilo(), ARMARIO, GLOBAL);
eq(perfil.length, 3, 'El perfil entero: tres tallas');
eq(perfil.filter((t) => t.valor).length, 2, 'Dos conocidas, una no');
ok(perfil.every((t) => t.texto), '⚠️ Ninguna sin texto: nunca un "undefined" en pantalla');

/* ── 6 · PERFIL FÍSICO (apartados 4 y 14) ────────────────────────────────── */

const fisico = perfilFisicoParaEstilo(conEstilo(), GLOBAL);
eq(fisico.length, DATOS_FISICOS_ESTILO.length, 'Los datos físicos que usa el estilo');
ok(fisico.every((d) => d.origen === 'global'), '⚠️ Apartado 14: TODOS globales — no hay un segundo perfil físico');
ok(fisico.every((d) => !d.editableAqui), 'Y ninguno se edita desde aquí');
eq(fisico.find((d) => d.id === 'altura').valor, 187, 'La altura sale del Perfil');
eq(fisico.find((d) => d.id === 'peso').valor, 73, 'Y el peso, de la última medida de Salud');
ok(perfilFisicoParaEstilo(conEstilo(), {}).every((d) => !d.tiene), 'Con la cuenta en blanco, ninguno');

/* ── 7 · PREFERENCIAS (apartados 5, 9 y 13) ──────────────────────────────── */

const prefs = preferenciasDeEstilo(conEstilo(), ARMARIO, GLOBAL);
eq(prefs.marcas.length, 3, 'Apartado 5: las marcas salen del armario');
eq(prefs.coloresUsados.length, 5, 'Y los colores');
eq(prefs.ocasiones.length, 1, 'Y las ocasiones, de los outfits');
ok(prefs.ocasiones.every((o) => OCASIONES_OUTFIT.some((x) => x.id === o.id)),
  '⚠️ Apartado 13: son las ocasiones del armario, no unas nuevas');
eq(prefs.propias.length, PREFERENCIAS_PROPIAS.length, 'Y las propias, de la capa de la Fase 4');
ok(prefs.propias.every((d) => REGISTRO_DATOS.some((r) => r.id === d.id)),
  'Todas declaradas en el registro, ninguna suelta');

/* ⚠️ Apartado 5 — lo que el armario YA tiene no se declara como dato propio.
   La primera versión de esta prueba buscaba la PALABRA "marca" u "ocasion" en
   cualquier id del registro, y la Fase 6 la hizo saltar con `marcasFavoritas` y
   `ocasionesInteres`. Eso no era una duplicación: el armario sabe qué marcas
   TIENE, no cuáles le GUSTAN. Lo que hay que prohibir es el CATÁLOGO, no la
   preferencia — así que la comprobación mira los ids exactos. */
['marcas', 'ocasiones', 'colores', 'paletas', 'prendas', 'outfits', 'categorias'].forEach((x) => {
  ok(!REGISTRO_DATOS.some((d) => d.id.toLowerCase() === x),
    `⚠️ No hay un catálogo "${x}" guardado como dato propio: ya lo tiene el armario`);
});
// Y la lista de valores posibles sigue saliendo del armario, no del registro.
ok(REGISTRO_DATOS.filter((d) => /marca/i.test(d.id)).every((d) => d.clase === 'opcional'),
  '⚠️ Lo que hay sobre marcas son PREFERENCIAS opcionales, no el catálogo');

// Test 4 — cambiar una preferencia y que se use.
const conColores = guardarDato(conEstilo(), 'coloresFavoritos', 'negro, azul', { hoy: HOY }).estado;
eq(leerDato(conColores, 'coloresFavoritos', GLOBAL).valor, 'negro, azul', 'Test 4: la preferencia se guarda');
ok(preferenciasDeEstilo(conColores, ARMARIO, GLOBAL).propias.find((d) => d.id === 'coloresFavoritos').tiene,
  'Test 4: y las preferencias la recogen');

// Apartado 9 — la puerta para otros módulos: solo lectura.
const paraOtros = preferenciasParaOtrosModulos(conColores, ARMARIO, GLOBAL);
ok(paraOtros.derivado, '⚠️ Apartado 9: se dice que es derivado, para que nadie lo guarde');
eq(paraOtros.marcas.length, 3, 'Con las marcas');
eq(paraOtros.preferencias.length, 1, 'Y lo que él ha indicado');
ok(preferenciasParaOtrosModulos(conEstilo(), ARMARIO, GLOBAL).preferencias.length === 0,
  'Sin preferencias indicadas, lista vacía — no huecos');

/* ── 8 · RECOMENDACIONES (apartados 6, 7, 8 y 11) ────────────────────────── */

// Con el módulo apagado: no se recomienda, y se dice por qué.
const recOff = recomendacionesDeEstilo(apagado, conUsos, { hoy: HOY });
ok(!recOff.suficiente, 'Apagado no se recomienda');
eq(recOff.motivo, 'modulo_apagado', 'Con su motivo');
eq(recOff.texto, MOTIVOS_SIN_RECOMENDACION.modulo_apagado, 'Y su frase');

// Sin outfits ni usos: se dice qué falta, no se inventa.
const recVacio = recomendacionesDeEstilo(conEstilo(), DEFAULT_ARMARIO, { hoy: HOY });
ok(!recVacio.suficiente, '⚠️ Sin outfits NO se inventa una recomendación');
eq(recVacio.motivo, 'sin_outfits', 'Con el motivo del motor de AR F4');
ok(recVacio.texto.length > 10, 'Y una frase, no un código de error');
eq(recVacio.acciones, ['Añadir', 'Ignorar'], '⚠️ Apartado 7: siempre las dos salidas');

const recPocos = recomendacionesDeEstilo(conEstilo(), ARMARIO, { hoy: HOY });
eq(recPocos.motivo, 'pocos_usos', 'Con outfits pero sin usos, tampoco');

// Con datos suficientes sí.
const rec = recomendacionesDeEstilo(conEstilo(), conUsos, { hoy: HOY });
ok(rec.suficiente, 'Con seis usos sí se recomienda');
ok(rec.recomendaciones.length > 0, 'Y sale algo');
ok(rec.recomendaciones.every((r) => 'encajaConTusColores' in r), 'Con la capa de preferencias que añade esta fase');
ok(rec.recomendaciones.every((r) => r.encajaConTusColores === false),
  '⚠️ Sin colores favoritos indicados NO se afirma que encaje: no se inventa');
eq(rec.acciones, ['Añadir', 'Ignorar'], 'Apartado 7: el usuario decide');

// Apartado 8 — falta información, pero la recomendación sale igual.
eq(rec.falta.length, 1, 'Falta la talla de calzado');
ok(rec.falta[0].texto.includes('No tenemos registrada'), 'Con la frase del enunciado');
ok(rec.suficiente, '⚠️ …pero NO se le obliga a completar el perfil: la recomendación sale igual');
eq(loQueFaltaParaRecomendar(conCalzado, ARMARIO, GLOBAL).length, 0, 'Con la talla puesta, no falta nada');
eq(loQueFaltaParaRecomendar(conEstilo(), DEFAULT_ARMARIO, GLOBAL).length, 3, 'Con el armario vacío, faltan las tres');

/* ── 9 · PRODUCTOS (apartado 12 · D2-03) ─────────────────────────────────── */

eq(PUENTE_PRODUCTOS.hacia, 'productos', 'El puente apunta a Productos');
ok(!PUENTE_PRODUCTOS.disponible, '⚠️ Y dice que todavía no existe');
eq(PUENTE_PRODUCTOS.fase, 55, 'Con la fase en la que llega');
ok(PUENTE_PRODUCTOS.contexto.length > 0, 'Declara qué le pasará');
// D2-03 de Josué: arquitectura sí, afiliación no.
['amazon', 'afiliad', 'precio', 'comprar', 'http'].forEach((x) => {
  ok(!JSON.stringify(PUENTE_PRODUCTOS).toLowerCase().includes(x),
    `⚠️ D2-03: ni "${x}" — arquitectura sí, afiliación no`);
});

/* ── 10 · AUDITORÍA (apartado 15) ────────────────────────────────────────── */

const aud = auditarIntegracionArmario(conEstilo(), ARMARIO, GLOBAL);
eq(aud.prendasEnEstiloHombre, 0, '⚠️ Test 9: CERO prendas guardadas en Estilo de hombre');
eq(aud.outfitsEnEstiloHombre, 0, '⚠️ Test 9: y cero outfits');
eq(aud.prendasDuplicadas, 0, 'Test 7: sin prendas duplicadas');
eq(aud.perfilesDeTalla, 1, '⚠️ Test 8: UN perfil de tallas');
eq(aud.tallasDerivadas, 2, 'Dos derivadas del armario');
eq(aud.tallasSinSaber, 1, 'Y una que no sabemos');
eq(aud.conflictosDeTalla, [], 'Sin choques');
eq(auditarIntegracionArmario(conflictiva, ARMARIO, GLOBAL).conflictosDeTalla.length, 1,
  '⚠️ Y cuando los hay, se cuentan y se enseñan');
ok(aud.noComprobableAqui.length > 0, '⚠️ Y lo que no se puede comprobar aquí, se dice');
ok(aud.noComprobableAqui[0].includes('iPhone'), 'Test 10: la navegación real es R1');

// Que el estado de Estilo de Hombre no guarde nada del armario, de verdad.
const guardado = JSON.stringify(normalizarEstiloHombre(conCalzado));
prendas.forEach((pr) => {
  ok(!guardado.includes(pr.id), `⚠️ Test 9: el id de "${pr.nombre || 'una prenda'}" no está en estiloHombre`);
});
ok(!guardado.includes(outfit.id), '⚠️ Ni el del outfit');
ok(!guardado.includes('Zara'), '⚠️ Ni una marca');

/* ── 11 · RESUMEN ────────────────────────────────────────────────────────── */

const res = resumenEstiloArmario(conEstilo(), ARMARIO, GLOBAL);
eq(res.total, 6, 'Las prendas');
eq(res.tallasConocidas, 2, 'Las tallas que sabemos');
eq(res.tallasTotal, 3, 'De las tres');
eq(res.falta, 1, 'Y lo que falta');
eq(res.conflictos, 0, 'Sin choques');
ok(res.acceso.visible, 'Con el acceso');
eq(resumenEstiloArmario(apagado, ARMARIO, GLOBAL).acceso.visible, false, 'Apagado, sin acceso');
eq(resumenEstiloArmario(conEstilo(), DEFAULT_ARMARIO, GLOBAL).vacio, true, 'Y con el armario vacío lo dice');

console.log('  ⚠️  Test 10 (navegación en móvil) necesita un iPhone: es R1.');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
