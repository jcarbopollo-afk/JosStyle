// ============================================================================
// EH · Fase 15/65 — Skincare: seguimiento y evolución
//
// Los catorce tests del apartado 16 (menos el 14, "comprobar móvil", que es R1),
// y las cinco cosas que el enunciado prohíbe:
//   · otro diario (apartado 11)
//   · otra papelera (apartado 13)
//   · otra exportación (apartado 14)
//   · fotos obligatorias (apartado 10)
//   · rachas y obligación diaria (apartado 9, marcado como "esto es importante")
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { CATALOGO_PAPELERA, claveCatalogo } from '../src/lib/papelera.js';
import { anadirProductoPiel, datosPiel, MODULO_PIEL } from '../src/lib/perfilPiel.js';
import { alternarPartePiel, crearRutinaPiel } from '../src/lib/rutinasPiel.js';
import {
  PARTE_SEGUIMIENTO, ESCALA_PIEL, valorEscala, TEXTO_NO_REGISTRAR,
  ASPECTOS_PIEL, aspectoPiel, NIVELES_ASPECTO, DEFAULT_SEGUIMIENTO_PIEL,
  MAX_NOTA_PIEL, normalizarSeguimientoPiel, datosSeguimientoPiel,
  registrarPiel, editarRegistroPiel, eliminarRegistroPiel, restaurarRegistroPiel,
  PERIODOS_PIEL, periodoPiel, registrosPiel, verRegistroPiel,
  MINIMO_PARA_EVOLUCION, TEXTO_SIN_DATOS, TENDENCIAS, evolucionPiel,
  desdeQueUsas, cambiosDeRutina, datosParaExportar, resumenSeguimientoPiel,
  auditarSeguimientoPiel, panelSeguimientoPiel,
} from '../src/lib/seguimientoPiel.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']);

const fuente = readFileSync(new URL('../src/lib/seguimientoPiel.js', import.meta.url), 'utf8');
/* ⚠️ Sin comentarios **y sin la función de auditoría**. Los barridos de "esto no
   existe" cazaban su propia evidencia: `fotos: 0` y `diariosNuevos: 0` viven
   dentro de `auditarSeguimientoPiel()`, que es justo la función que DECLARA los
   ceros. Es la QUINTA vez que pasa en este bloque —F6, F7, F8, F12 y ahora—, y
   la lección es siempre la misma: mirar qué línea hace saltar la prueba antes de
   tocar el código, porque casi siempre el código está bien. */
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarSeguimientoPiel[\s\S]*?\n}/, '');

/* ── 1 · LA VALORACIÓN RÁPIDA (apartado 2) ──────────────────────────────── */
console.log('\n1 · La valoración rápida');

eq(ESCALA_PIEL.map((x) => x.icono), ['😄', '🙂', '😐', '🙁', '😣'], 'Las cinco caras del enunciado');
eq(ESCALA_PIEL.map((x) => x.nombre), ['Muy bien', 'Bien', 'Normal', 'Peor', 'Muy mal'], 'Con sus nombres');
eq(ESCALA_PIEL.length, 5, '⚠️ CINCO: "No quiero registrarlo" no es una sexta cara, es no registrar');
ok(!ESCALA_PIEL.some((x) => x.nombre === TEXTO_NO_REGISTRAR), 'Y no está en la escala');
ok(TEXTO_NO_REGISTRAR.length > 0, 'Pero existe como texto de la pantalla');
eq(valorEscala('inventada'), null, 'Una que no existe es null');

eq(ASPECTOS_PIEL.map((a) => a.nombre),
  ['Hidratación', 'Grasa/brillos', 'Textura', 'Sensación de comodidad', 'Aspecto general'],
  'Los cinco aspectos del apartado 3');
eq(NIVELES_ASPECTO.map((x) => x.nombre), ['Muy mal', 'Mal', 'Normal', 'Bien', 'Muy bien'],
  'Con la escala de 1 a 5 del enunciado');
eq(aspectoPiel('inventado'), null, 'Un aspecto que no existe es null');

/* ── 2 · TESTS 1, 4, 5 Y 6 — CREAR UNA VALORACIÓN ───────────────────────── */
console.log('\n2 · Tests 1, 4, 5 y 6 — crear una valoración');

const r1 = registrarPiel(base(), { como: 'bien' }, { hoy: HOY });
eq(r1.error, null, 'Test 1: se crea una valoración');
eq(datosSeguimientoPiel(r1.estado).registros.length, 1, 'Y queda guardada');
eq(r1.registro.fecha, HOY, 'Con la fecha de hoy');

// ⚠️ Un registro vacío no se guarda.
ok(registrarPiel(base(), {}, { hoy: HOY }).error !== null,
  '⚠️ Un registro sin nada NO se guarda: una fecha sola no es un dato');
eq(datosSeguimientoPiel(registrarPiel(base(), {}, { hoy: HOY }).estado).registros.length, 0, 'Y no queda nada');
ok(registrarPiel(base(), { como: 'bien', fecha: 'ayer' }).error !== null, 'Una fecha que no lo es, tampoco');

// Test 4 — la nota, opcional.
const conNota = registrarPiel(base(), { como: 'peor', nota: 'Hoy la noto más seca.' }, { hoy: HOY });
eq(conNota.registro.nota, 'Hoy la noto más seca.', 'Test 4: con su nota');
eq(registrarPiel(base(), { como: 'bien', nota: 'x'.repeat(500) }, { hoy: HOY }).registro.nota.length, MAX_NOTA_PIEL,
  '⚠️ La nota es corta a propósito: el sitio para escribir es el Diario (apartado 11)');

// Test 5 — un producto de los suyos.
const conProd = anadirProductoPiel(base(), 'Crema hidratante').estado;
const idProd = datosPiel(conProd).productos[0].id;
const r5 = registrarPiel(conProd, { como: 'bien', productoId: idProd }, { hoy: HOY });
eq(r5.error, null, 'Test 5: se asocia un producto');
eq(verRegistroPiel(r5.estado, r5.registro).producto, 'Crema hidratante', 'Y sale con su nombre');
ok(registrarPiel(conProd, { como: 'bien', productoId: 'noExiste' }, { hoy: HOY }).error !== null,
  '⚠️ Un producto que no existe, no: el inventario es el de la Fase 13');

// Test 6 — el cambio de rutina.
const r6 = registrarPiel(base(), { cambio: 'Añadí hidratante' }, { hoy: HOY });
eq(r6.error, null, 'Test 6: se registra un cambio de rutina');
eq(cambiosDeRutina(r6.estado)[0].cambio, 'Añadí hidratante', 'Y se puede consultar');
eq(cambiosDeRutina(base()), [], 'Sin ninguno, vacío — y no revienta');

// Los aspectos, todos opcionales.
const conAsp = registrarPiel(base(), { aspectos: { hidratacion: 4, textura: 2 } }, { hoy: HOY });
eq(Object.keys(conAsp.registro.aspectos), ['hidratacion', 'textura'], 'Se pueden valorar solo algunos');
eq(registrarPiel(base(), { aspectos: { hidratacion: 9 } }, { hoy: HOY }).error !== null, true,
  'Un valor fuera de 1-5 no cuenta, y sin nada más no hay registro');
eq(verRegistroPiel(conAsp.estado, conAsp.registro).aspectos[0].etiqueta, 'Bien', 'Con su etiqueta');

/* ── 3 · TESTS 2 Y 3 — EDITAR Y ELIMINAR (apartado 13) ──────────────────── */
console.log('\n3 · Tests 2, 3 y 13 — editar, eliminar y la papelera que ya existe');

const editado = editarRegistroPiel(r1.estado, r1.registro.id, { como: 'muy_bien' });
eq(editado.error, null, 'Test 2: se edita');
eq(datosSeguimientoPiel(editado.estado).registros[0].como, 'muy_bien', 'Y el cambio se guarda');
ok(editarRegistroPiel(base(), 'noExiste', {}).error !== null, 'Uno que no existe da error');

/* ⚠️ Apartado 13 — la papelera es la de ME F3, no una nueva. */
eq(CATALOGO_PAPELERA[claveCatalogo(MODULO_PIEL, 'registros')].tipo, 'Registro de piel',
  '⚠️ Apartado 13: los registros están en el CATÁLOGO de la papelera que ya existe');
const borrado = eliminarRegistroPiel(r1.estado, r1.registro.id, { ahora: '2026-08-27T10:00:00.000Z' });
eq(borrado.error, null, 'Test 3: se elimina');
eq(datosSeguimientoPiel(borrado.estado).registros.length, 0, 'Y desaparece');
ok(borrado.entrada, '⚠️ Devolviendo la entrada de papelera que App.jsx ya sabe guardar');
eq(borrado.entrada.modulo, MODULO_PIEL, 'Con su módulo');
eq(borrado.entrada.tipo, 'Registro de piel', 'Y su tipo, del catálogo');
eq(borrado.entrada.datos.id, r1.registro.id, '⚠️ Con el objeto ÍNTEGRO, no una etiqueta');
ok(eliminarRegistroPiel(base(), 'noExiste').error !== null, 'Uno que no existe da error');

// Y vuelve.
const restaurado = restaurarRegistroPiel(borrado.estado, borrado.entrada);
eq(datosSeguimientoPiel(restaurado.estado).registros.length, 1, 'Test 13: y se restaura desde la papelera');
eq(datosSeguimientoPiel(restaurado.estado).registros[0].id, r1.registro.id, 'El mismo registro');
eq(restaurarRegistroPiel(restaurado.estado, borrado.entrada).yaExistia, true, 'Restaurarlo dos veces no lo duplica');
ok(restaurarRegistroPiel(base(), null).error !== null, 'Y una entrada rota da error');

// ⚠️ Ni una papelera propia en el archivo.
ok(!/papelera:\s*\[|eliminados:\s*\[|DEFAULT_PAPELERA\s*=/.test(codigo),
  '⚠️ Apartado 13: aquí NO se crea otra papelera');

/* ── 4 · TESTS 7, 8 Y 9 — EVOLUCIÓN Y PERIODOS ─────────────────────────── */
console.log('\n4 · Tests 7, 8 y 9 — la evolución, y cuando no hay datos');

eq(PERIODOS_PIEL.map((p) => p.nombre),
  ['Últimos 7 días', 'Últimos 30 días', 'Últimos 3 meses', 'Todo'], 'Los cuatro periodos del apartado 8');
eq(periodoPiel('inventado').id, '30', 'Uno que no existe cae en el de treinta días');

// Test 9 — sin registros suficientes.
eq(evolucionPiel(base()).hay, false, 'Test 9: sin registros, no hay evolución');
eq(evolucionPiel(base()).texto, TEXTO_SIN_DATOS, '⚠️ Con la frase literal del apartado 8');
eq(MINIMO_PARA_EVOLUCION, 4, 'Hacen falta cuatro registros');
ok(!/has fallado|deberías|poco constante|te falta constancia/i.test(TEXTO_SIN_DATOS),
  '⚠️ Y la frase dice que faltan DATOS, no que él haya fallado');

// Test 7 — con datos, sí.
let evo = base();
[['2026-08-01', 2], ['2026-08-05', 2], ['2026-08-20', 4], ['2026-08-25', 5]].forEach(([f, v]) => {
  evo = registrarPiel(evo, { fecha: f, como: 'normal', aspectos: { hidratacion: v } }, { hoy: HOY }).estado;
});
const e = evolucionPiel(evo, { hoy: HOY });
eq(e.hay, true, 'Test 7: con cuatro registros ya hay evolución');
eq(e.aspectos.find((a) => a.id === 'hidratacion').nombre, 'Hidratación', 'Con su aspecto');
eq(e.aspectos.find((a) => a.id === 'hidratacion').tendencia, 'sube', 'Y su tendencia');
eq(e.aspectos.find((a) => a.id === 'hidratacion').icono, '↑', 'Con el icono del enunciado');
eq(TENDENCIAS.map((t) => t.icono), ['↑', '→', '↓'], 'Las tres flechas');
ok(e.de.length > 0, '⚠️ Y se dice de dónde sale: no hay caja negra');

// ⚠️ Medio punto de margen: una diferencia mínima es "estable", no "mejorando".
let plano = base();
[['2026-08-01', 3], ['2026-08-05', 3], ['2026-08-20', 3], ['2026-08-25', 3]].forEach(([f, v]) => {
  plano = registrarPiel(plano, { fecha: f, aspectos: { textura: v } }, { hoy: HOY }).estado;
});
eq(evolucionPiel(plano, { hoy: HOY }).aspectos.find((a) => a.id === 'textura').tendencia, 'estable',
  '⚠️ Sin cambio real, "Estable" — no se anuncia una mejora que no existe');

// Un aspecto que nunca valoró no aparece inventado.
ok(!evolucionPiel(plano, { hoy: HOY }).aspectos.some((a) => a.id === 'grasa'),
  '⚠️ Un aspecto que nunca ha valorado NO sale: no se inventa una tendencia');

// Test 8 — cambiar de periodo.
eq(registrosPiel(evo, { periodo: '7', hoy: HOY }).length, 1, 'Test 8: en 7 días, uno');
eq(registrosPiel(evo, { periodo: '30', hoy: HOY }).length, 4, 'En 30, los cuatro');
eq(registrosPiel(evo, { periodo: 'todo', hoy: HOY }).length, 4, 'Y en "todo", también');
eq(evolucionPiel(evo, { periodo: '7', hoy: HOY }).hay, false, 'Con un solo registro en el periodo, no hay evolución');

/* ── 5 · ⚠️ APARTADO 9 — NI RACHAS NI OBLIGACIÓN DIARIA ─────────────────── */
console.log('\n5 · ⚠️ Apartado 9 ("esto es importante"): ni rachas ni obligación');

const textos = [
  TEXTO_SIN_DATOS,
  resumenSeguimientoPiel(base()).texto,
  resumenSeguimientoPiel(evo, { hoy: HOY }).texto,
  evolucionPiel(evo, { hoy: HOY }).de,
  ...TENDENCIAS.map((t) => t.nombre),
  ...ESCALA_PIEL.map((x) => x.nombre),
  desdeQueUsas(r5.estado, idProd, { hoy: HOY }).texto,
  datosParaExportar(evo).nota,
  TEXTO_NO_REGISTRAR,
];
['racha', 'has perdido', 'has fallado', 'no has registrado', 'constancia', 'deberías', 'cada día'].forEach((mala) => {
  ok(textos.every((t) => !String(t).toLowerCase().includes(mala)),
    `⚠️ En ningún texto aparece "${mala}"`);
});
eq(resumenSeguimientoPiel(evo, { hoy: HOY }).racha, null,
  '⚠️ El resumen devuelve `racha: null` a propósito: aquí no se cuentan días seguidos');
ok(!/racha|diasSeguidos|streak/i.test(codigo.replace(/racha: null|rachas: 0/g, '')),
  '⚠️ Y no hay ningún cálculo de racha en el código');
eq(auditarSeguimientoPiel(base()).rachas, 0, 'Cero rachas');
eq(auditarSeguimientoPiel(base()).obligatorio, false, 'Y nada obligatorio');

// ⚠️ Un día sin registrar no existe: no es un cero.
eq(registrosPiel(evo, { periodo: '30', hoy: HOY }).length, 4,
  '⚠️ Cuatro registros en treinta días son CUATRO datos, no veintiséis ceros');

/* ── 6 · ⚠️ APARTADOS 10, 11, 12 Y 14 ───────────────────────────────────── */
console.log('\n6 · ⚠️ Sin fotos, sin otro diario, sin causalidad y sin otra exportación');

// Apartado 10 — sin fotos.
ok(!/foto|imagen|camara|cámara|upload|bucket/i.test(codigo), '⚠️ Apartado 10: ni una foto');
eq(auditarSeguimientoPiel(base()).fotos, 0, 'Cero, declarado');

// Apartado 11 — sin otro diario.
ok(!/diario/i.test(codigo), '⚠️ Apartado 11: aquí NO se crea otro diario');
eq(auditarSeguimientoPiel(base()).diariosNuevos, 0, 'Cero, declarado');

// Apartado 12 — sin causalidad.
const desde = desdeQueUsas(r5.estado, idProd, { hoy: HOY });
ok(desde.texto.includes('has registrado'), '⚠️ Apartado 12: se cuenta lo registrado…');
['gracias a', 'ha mejorado tu', 'funciona', 'ha causado', 'provoca', 'cura', 'por culpa'].forEach((mala) => {
  ok(!desde.texto.toLowerCase().includes(mala), `…y NUNCA se afirma una causa: ni "${mala}"`);
});
eq(desdeQueUsas(base(), 'noExiste'), null, 'De un producto que no existe, nada');
eq(desdeQueUsas(conProd, idProd, { hoy: HOY }).hay, false, 'Y sin anotarlo, se dice');

// Apartado 14 — sin exportación propia.
const exp = datosParaExportar(evo);
eq(exp.exporta, false, '⚠️ Apartado 14: esto PREPARA los datos, no los exporta');
eq(exp.modulo, MODULO_PIEL, 'Con su módulo');
eq(exp.registros.length, 4, 'Y sus registros, legibles');
eq(exp.registros[0].aspectos.Hidratación !== undefined, true, 'Con los nombres, no los ids');
ok(!/descargar|download|Blob|createObjectURL|toCSV/i.test(codigo), 'Y no hay nada que descargue');
eq(auditarSeguimientoPiel(base()).exportacionesNuevas, 0, 'Cero, declarado');

// Sin IA, como todo el bloque.
['askAI', 'anthropic', 'fetch(', 'openai'].forEach((x) => {
  ok(!codigo.includes(x), `⚠️ "Sin IA": ni "${x}"`);
});

/* ── 7 · TESTS 10 Y 11 — DESACTIVAR Y REACTIVAR (apartados 1 y 15) ──────── */
console.log('\n7 · Tests 10 y 11 — desactivar y reactivar');

const apagado = alternarPartePiel(evo, PARTE_SEGUIMIENTO);
eq(registrosPiel(apagado, { periodo: 'todo', hoy: HOY }), [], 'Test 10: apagado, no se muestran');
eq(evolucionPiel(apagado, { hoy: HOY }).hay, false, 'Ni hay evolución');
eq(datosSeguimientoPiel(apagado).registros.length, 4, '⚠️ Apartado 15: pero NO se borran');
eq(resumenSeguimientoPiel(apagado, { hoy: HOY }).guardados, 4, 'Y el resumen lo sabe');
eq(resumenSeguimientoPiel(apagado, { hoy: HOY }).visibles, 0, 'Aunque no se vean');
const reactivado = alternarPartePiel(apagado, PARTE_SEGUIMIENTO);
eq(registrosPiel(reactivado, { periodo: 'todo', hoy: HOY }).length, 4, 'Test 11: y al reactivarlo vuelven');
eq(evolucionPiel(reactivado, { hoy: HOY }).hay, true, 'Con su evolución intacta');

/* ── 8 · EL NORMALIZADOR ────────────────────────────────────────────────── */
console.log('\n8 · El normalizador');

eq(normalizarSeguimientoPiel(undefined), DEFAULT_SEGUIMIENTO_PIEL, 'Sin nada, el valor por defecto');
eq(normalizarSeguimientoPiel('roto'), DEFAULT_SEGUIMIENTO_PIEL, 'Con basura, también');
eq(normalizarSeguimientoPiel({ registros: 'roto' }).registros, [], 'Unos registros que no son lista se caen');
eq(normalizarSeguimientoPiel({ registros: [{ fecha: 5 }] }).registros, [], 'Uno sin fecha válida, también');
eq(normalizarSeguimientoPiel({ registros: [{ fecha: HOY, como: 'inventado' }] }).registros[0].como, null,
  'Una valoración que no existe se cae');
eq(normalizarSeguimientoPiel({ registros: [{ fecha: HOY, aspectos: { hidratacion: 0 } }] }).registros[0].aspectos, {},
  '⚠️ Un aspecto fuera de 1-5 se cae, y NO se convierte en un 3');
eq(normalizarSeguimientoPiel({ registros: [{ fecha: '2026-01-01' }, { fecha: '2026-06-01' }] })
  .registros.map((r) => r.fecha), ['2026-06-01', '2026-01-01'], 'Del más reciente al más antiguo');
// ⚠️ Y sobrevive a un guardado.
eq(datosSeguimientoPiel(normalizarEstiloHombre(evo)).registros.length, 4,
  '⚠️ Y siguen ahí después de normalizar otra vez (regla 5)');

/* ── 9 · RESUMEN, PANEL Y AUDITORÍA ─────────────────────────────────────── */
console.log('\n9 · Resumen, panel y auditoría');

const res = resumenSeguimientoPiel(evo, { hoy: HOY });
eq(res.guardados, 4, 'Cuatro registros');
eq(res.ultimo, '2026-08-25', 'Y el último');
eq(resumenSeguimientoPiel(base()).guardados, 0, 'Sin nada, cero — y no revienta');

const panel = panelSeguimientoPiel(evo, { hoy: HOY });
eq(panel.registros.length, 4, 'El panel trae los registros');
eq(panel.periodos.length, 4, 'Y los cuatro periodos');
ok(panel.evolucion.hay, 'Con su evolución');
eq(panelSeguimientoPiel(base()).registros, [], 'Sin nada, sigue funcionando');

const conRutina = crearRutinaPiel(evo, { nombre: 'R' }, { hoy: HOY }).estado;
const aud = auditarSeguimientoPiel(conRutina);
eq([aud.diariosNuevos, aud.papelerasNuevas, aud.exportacionesNuevas, aud.fotos, aud.rachas, aud.inventariosNuevos, aud.usaIA],
  [0, 0, 0, 0, 0, 0, 0], '⚠️ Las siete cosas que esta fase NO crea, declaradas y en cero');
eq(aud.registros, 4, 'Con sus registros');
eq(aud.rutinas, 1, 'Y las rutinas de la Fase 14, que no se tocan');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
