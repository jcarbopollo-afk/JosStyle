// ============================================================================
// EH · Fase 14/65 — Skincare: rutinas y cuidado diario
//
// Los diecisiete tests del apartado 20, más lo que gobierna la fase:
//   · el apartado 19 ("NO DUPLICAR"), que es por lo que existe `motorRutinas.js`
//   · omitir un paso SIN penalización (apartado 10)
//   · las plantillas SUGIEREN, no crean (apartados 12 y 13)
//   · cambiar de nivel NO borra la rutina anterior (apartado 14)
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { contestarPiel, datosPiel, anadirProductoPiel, MODULO_PIEL } from '../src/lib/perfilPiel.js';
import {
  TIPOS_FRECUENCIA, tocaEnFechaGenerico, estadoDelDia, normalizarHechos,
  alternarPaso, alternarOmitido, checklistGenerico, impactoEliminarRutina,
} from '../src/lib/motorRutinas.js';
import { tocaEnFecha as tocaPelo, FRECUENCIAS_PELO } from '../src/lib/rutinasPelo.js';
import {
  PLAQUITAS_PIEL, PARTES_PIEL, parteActivaPiel, alternarPartePiel,
  PASOS_PIEL, pasoPiel, pasosParaNivel, MOMENTOS_PIEL, momentoPiel,
  FRECUENCIAS_PIEL, frecuenciaPiel, DEFAULT_RUTINAS_PIEL, normalizarRutinasPiel,
  datosRutinasPiel, crearRutinaPiel, editarRutinaPiel, impactoEliminarRutinaPiel,
  eliminarRutinaPiel, ordenarPasosPiel, productosDePiel, asignarProductoAPaso,
  crearProductoParaPaso, tocaHoyPiel, rutinasDeHoyPiel, checklistPiel,
  marcarPasoPiel, omitirPasoPiel, marcarRutinaPielEntera, PLANTILLAS_PIEL,
  plantillaPiel, plantillaSugerida, usarPlantilla, historialPiel, estaSemanaPiel,
  eventosDePiel, resumenRutinasPiel, auditarRutinasPiel,
} from '../src/lib/rutinasPiel.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-27';       // jueves
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']);

/* ── 1 · ⚠️ EL APARTADO 19 — POR QUÉ EXISTE EL MOTOR ────────────────────── */
console.log('\n1 · ⚠️ Apartado 19, "NO DUPLICAR": un solo motor de rutinas');

eq(TIPOS_FRECUENCIA, ['diaria', 'dias', 'cada_x', 'ninguna'],
  '⚠️ Cuatro comportamientos, no una lista por módulo');
eq(FRECUENCIAS_PIEL.length, 6, 'Las SEIS etiquetas del apartado 7');
eq(FRECUENCIAS_PELO.length, 5, 'Y las CINCO de la Fase 8, sin tocarlas');
ok(FRECUENCIAS_PIEL.every((f) => TIPOS_FRECUENCIA.includes(f.tipo)),
  '⚠️ Cada etiqueta declara de qué tipo es: la palabra es del módulo, el cálculo del motor');
ok(FRECUENCIAS_PELO.every((f) => TIPOS_FRECUENCIA.includes(f.tipo)), 'Las de Pelo también');
// ⚠️ Tres etiquetas, un solo comportamiento.
eq(['dias', 'veces_semana', 'semanal'].map((id) => frecuenciaPiel(id).tipo), ['dias', 'dias', 'dias'],
  '⚠️ "Días concretos", "varias veces por semana" y "semanal" son tres formas de decir lo mismo');

// ⚠️ Y los dos módulos dan la MISMA respuesta al mismo caso.
const lunes = '2026-08-31';
const rPelo = { frecuencia: 'semanal', dias: [1], activa: true, desde: '2026-08-01' };
const rPiel = { frecuencia: 'semanal', dias: [1], activa: true, desde: '2026-08-01' };
eq(tocaPelo(rPelo, lunes), tocaHoyPiel(rPiel, lunes),
  '⚠️ Pelo y Skincare dan la misma respuesta al mismo caso: es el mismo cálculo');
eq(tocaHoyPiel(rPiel, HOY), false, 'Un jueves no toca una rutina de lunes');

// ⚠️ El archivo de Skincare NO tiene su propio inventario de productos.
const fuente = readFileSync(new URL('../src/lib/rutinasPiel.js', import.meta.url), 'utf8');
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/productos:\s*\[/.test(codigo),
  '⚠️ Apartado 19: aquí NO hay un inventario de productos — son los de la Fase 13');
ok(!/DEFAULT_CALENDARIO|crearEvento|expandirRecurrentes/.test(codigo),
  '⚠️ Ni un calendario propio (apartado 17)');
['askAI', 'anthropic', 'fetch(', 'openai'].forEach((x) => {
  ok(!codigo.includes(x), `⚠️ "Nada de IA": ni "${x}"`);
});

/* ── 2 · EL PANEL (apartado 1) ──────────────────────────────────────────── */
console.log('\n2 · El panel, con sus cinco plaquitas');

eq(PLAQUITAS_PIEL.map((p) => p.nombre),
  ['Mi piel', 'Mi rutina', 'Seguimiento', 'Recomendaciones', 'Productos'],
  'Las cinco del enunciado');
ok(PLAQUITAS_PIEL.filter((p) => !p.listo).every((p) => p.fase > 14),
  '⚠️ Regla 8: las que no funcionan dicen en qué fase llegan');
eq(PARTES_PIEL.find((p) => p.id === 'recordatorios').porDefecto, false,
  '⚠️ Apartado 8: los recordatorios nacen APAGADOS — *"no insistir"*');
ok(parteActivaPiel(base(), 'rutinas'), 'Las rutinas, encendidas');
ok(!parteActivaPiel(base(), 'recordatorios'), 'Los recordatorios, no');

/* ── 3 · TESTS 1, 2, 3 Y 4 — CREAR RUTINAS Y PASOS ──────────────────────── */
console.log('\n3 · Tests 1-4 — crear rutinas y añadir pasos');

const c1 = crearRutinaPiel(base(), {
  nombre: 'Rutina de mañana', momento: 'manana', frecuencia: 'diario',
  pasos: [{ accion: 'limpieza' }, { accion: 'hidratacion' }, { accion: 'solar' }],
}, { hoy: HOY });
eq(c1.error, null, 'Test 1: se crea una rutina');
eq(datosRutinasPiel(c1.estado).rutinas.length, 1, 'Y queda guardada');
eq(c1.rutina.momento, 'manana', 'Test 2: con su momento del día');
eq(c1.rutina.pasos.length, 3, 'Test 4: y sus tres pasos');

const c2 = crearRutinaPiel(c1.estado, {
  nombre: 'Rutina de noche', momento: 'noche', frecuencia: 'diario',
  pasos: [{ accion: 'limpieza' }, { accion: 'hidratacion' }],
}, { hoy: HOY });
eq(datosRutinasPiel(c2.estado).rutinas.length, 2, 'Test 3: y otra de noche, independiente');
eq(MOMENTOS_PIEL.map((m) => m.nombre), ['Mañana', 'Noche', 'Otra rutina'], 'Los tres momentos del apartado 3');
eq(momentoPiel('inventado'), null, 'Un momento que no existe es null');
eq(crearRutinaPiel(base(), { momento: 'inventado' }, { hoy: HOY }).rutina.momento, 'otra',
  'Y uno inválido cae en "otra"');

// Apartado 4 — *"no imponer una lista cerrada"*.
eq(PASOS_PIEL.at(-1).id, 'otros', 'El paso "Otro" cierra el catálogo: la lista no es cerrada');
const libre = crearRutinaPiel(base(), { pasos: [{ accion: 'otros', nombre: 'Mi mejunje' }] }, { hoy: HOY });
eq(libre.rutina.pasos[0].nombre, 'Mi mejunje', 'Y un paso puede llevar el nombre que él quiera');

/* ── 4 · TEST 5 — CAMBIAR EL ORDEN (apartado 5) ─────────────────────────── */
console.log('\n4 · Test 5 — cambiar el orden de los pasos');

const ids = c1.rutina.pasos.map((p) => p.id);
const reordenado = ordenarPasosPiel(c1.estado, c1.rutina.id, [ids[2], ids[0], ids[1]]).estado;
eq(datosRutinasPiel(reordenado).rutinas[0].pasos.map((p) => p.accion), ['solar', 'limpieza', 'hidratacion'],
  'Test 5: el orden se cambia');
// ⚠️ Un paso que no venga en la lista NO se pierde.
const parcial = ordenarPasosPiel(c1.estado, c1.rutina.id, [ids[2]]).estado;
eq(datosRutinasPiel(parcial).rutinas[0].pasos.length, 3,
  '⚠️ Un reordenado incompleto NO borra pasos: los que faltan se quedan al final');
ok(ordenarPasosPiel(base(), 'noExiste', []).error !== null, 'Una rutina que no existe da error');

/* ── 5 · TEST 6 — PRODUCTOS, SIN SEGUNDO INVENTARIO (apartados 6 y 19) ──── */
console.log('\n5 · Test 6 — asociar productos, sin crear un segundo inventario');

const conProd = anadirProductoPiel(c1.estado, 'Crema hidratante').estado;
const idProd = datosPiel(conProd).productos[0].id;
eq(productosDePiel(conProd).length, 1, '⚠️ Los productos son los del perfil de piel (Fase 13)');
const asignado = asignarProductoAPaso(conProd, c1.rutina.id, ids[1], idProd);
eq(asignado.error, null, 'Test 6: se asocia un producto a un paso');
eq(checklistPiel(asignado.estado, c1.rutina.id, { hoy: HOY }).pasos[1].producto, 'Crema hidratante',
  'Y sale en la lista del día');
ok(asignarProductoAPaso(conProd, c1.rutina.id, ids[0], 'noExiste').error !== null,
  'Un producto que no existe, no');
eq(asignarProductoAPaso(asignado.estado, c1.rutina.id, ids[1], null).error, null, 'Y se puede desenganchar');

// *"+ Añadir producto"* desde el paso: crea EN EL PERFIL, no aquí.
const creadoDesdePaso = crearProductoParaPaso(c1.estado, c1.rutina.id, ids[0], 'Gel limpiador');
eq(datosPiel(creadoDesdePaso.estado).productos.length, 1,
  '⚠️ "+ Añadir producto" escribe en el inventario de la Fase 13…');
eq(datosRutinasPiel(creadoDesdePaso.estado).rutinas[0].pasos[0].productoId,
  datosPiel(creadoDesdePaso.estado).productos[0].id, '…y aquí solo se guarda su id');
ok(crearProductoParaPaso(c1.estado, c1.rutina.id, ids[0], '  ').error !== null, 'Uno sin nombre, no');

/* ── 6 · TEST 7 — FRECUENCIA (apartado 7) ───────────────────────────────── */
console.log('\n6 · Test 7 — cambiar la frecuencia');

const semanal = editarRutinaPiel(c1.estado, c1.rutina.id, { frecuencia: 'semanal', dias: [4] }).estado;
eq(rutinasDeHoyPiel(semanal, { hoy: HOY }).length, 1, 'Test 7: un jueves toca una rutina de jueves');
eq(rutinasDeHoyPiel(semanal, { hoy: '2026-08-28' }).length, 0, 'Y un viernes, no');

const cadaX = editarRutinaPiel(c1.estado, c1.rutina.id, { frecuencia: 'cada_x', cada: 3, desde: HOY }).estado;
eq(rutinasDeHoyPiel(cadaX, { hoy: HOY }).length, 1, 'Cada 3 días toca hoy…');
eq(rutinasDeHoyPiel(cadaX, { hoy: '2026-08-28' }).length, 0, '…no mañana…');
eq(rutinasDeHoyPiel(cadaX, { hoy: '2026-08-30' }).length, 1, '…y sí en tres días');

// ⚠️ "Personalizado" no toca ningún día por su cuenta.
const libre2 = editarRutinaPiel(c1.estado, c1.rutina.id, { frecuencia: 'personalizado' }).estado;
eq(rutinasDeHoyPiel(libre2, { hoy: HOY }).length, 0,
  '⚠️ "Personalizado" no toca ningún día solo: es una rutina que hace cuando quiere');
// ⚠️ Y "cada X" sin fecha de inicio tampoco inventa una.
eq(tocaHoyPiel({ frecuencia: 'cada_x', cada: 3, activa: true, desde: null }, HOY), false,
  '⚠️ "Cada X días" sin fecha de inicio no toca: no se inventa un punto de partida');

/* ── 7 · TEST 8 — RECORDATORIOS (apartado 8) ────────────────────────────── */
console.log('\n7 · Test 8 — recordatorios, opcionales y con su hora');

eq(c1.rutina.recordatorio, false, '⚠️ Nace apagado');
const conAviso = editarRutinaPiel(c1.estado, c1.rutina.id, { recordatorio: true, hora: '08:30', diasAviso: [1, 3] }).estado;
eq(datosRutinasPiel(conAviso).rutinas[0].hora, '08:30', 'Test 8: con su hora');
eq(datosRutinasPiel(conAviso).rutinas[0].diasAviso, [1, 3], 'Y sus días');
eq(datosRutinasPiel(editarRutinaPiel(c1.estado, c1.rutina.id, { hora: '99:99' }).estado).rutinas[0].hora, null,
  'Una hora que no lo es se cae');
// ⚠️ Y sobrevive a un guardado: los tres campos son de este módulo.
eq(datosRutinasPiel(normalizarEstiloHombre(conAviso)).rutinas[0].hora, '08:30',
  '⚠️ `hora`, `diasAviso` y `momento` sobreviven al normalizador (regla 5)');
eq(datosRutinasPiel(normalizarEstiloHombre(conAviso)).rutinas[0].momento, 'manana', 'Los tres');

/* ── 8 · TESTS 9 Y 10 — MARCAR Y OMITIR (apartados 9 y 10) ──────────────── */
console.log('\n8 · Tests 9 y 10 — marcar pasos y omitir SIN penalización');

const m1 = marcarPasoPiel(c1.estado, c1.rutina.id, ids[0], { hoy: HOY }).estado;
eq(checklistPiel(m1, c1.rutina.id, { hoy: HOY }).estado, 'a_medias', 'Test 9: un paso marcado deja la rutina empezada');
eq(checklistPiel(m1, c1.rutina.id, { hoy: HOY }).pasos[0].hecho, true, 'Y el paso, hecho');
const desmarcado = marcarPasoPiel(m1, c1.rutina.id, ids[0], { hoy: HOY }).estado;
eq(checklistPiel(desmarcado, c1.rutina.id, { hoy: HOY }).estado, 'pendiente', 'Y se desmarca con otro toque');
ok(marcarPasoPiel(c1.estado, c1.rutina.id, 'noExiste', { hoy: HOY }).error !== null, 'Un paso que no existe da error');

/* ⚠️ APARTADO 10 — omitir es una TERCERA cosa. */
const omitido = omitirPasoPiel(c1.estado, c1.rutina.id, ids[2], { hoy: HOY }).estado;
const lista = checklistPiel(omitido, c1.rutina.id, { hoy: HOY });
eq(lista.pasos[2].omitido, true, 'Test 10: un paso se puede omitir hoy');
eq(lista.pasos[2].hecho, false, 'Omitido no es hecho');
eq(lista.estado, 'pendiente', 'Y con el resto sin hacer, la rutina sigue pendiente — no fallada');

// ⚠️ Y sale de la cuenta: dos hechos + uno omitido = HECHA.
let dosYOmitido = omitido;
[ids[0], ids[1]].forEach((p) => { dosYOmitido = marcarPasoPiel(dosYOmitido, c1.rutina.id, p, { hoy: HOY }).estado; });
eq(checklistPiel(dosYOmitido, c1.rutina.id, { hoy: HOY }).estado, 'hecha',
  '⚠️ Apartado 10, "sin penalización": dos hechos y uno omitido es una rutina HECHA, no una a medias');

// Marcar un paso omitido lo deja de estar, y al revés.
const omitidoYMarcado = marcarPasoPiel(omitido, c1.rutina.id, ids[2], { hoy: HOY }).estado;
eq(checklistPiel(omitidoYMarcado, c1.rutina.id, { hoy: HOY }).pasos[2].omitido, false,
  '⚠️ Un paso no puede estar hecho Y omitido: marcar quita el omitido');

// ⚠️ Y marcado ayer NO es marcado hoy.
eq(checklistPiel(m1, c1.rutina.id, { hoy: '2026-08-28' }).estado, 'pendiente',
  '⚠️ El estado es DERIVADO del día: marcado ayer no significa marcado hoy');

const entera = marcarRutinaPielEntera(c1.estado, c1.rutina.id, { hoy: HOY }).estado;
eq(checklistPiel(entera, c1.rutina.id, { hoy: HOY }).estado, 'hecha', 'Y se puede marcar entera');
eq(checklistPiel(marcarRutinaPielEntera(entera, c1.rutina.id, { hoy: HOY }).estado, c1.rutina.id, { hoy: HOY }).estado,
  'pendiente', 'Y desmarcar entera');

/* ── 9 · TESTS 11 Y 12 — EDITAR Y ELIMINAR (apartado 11) ────────────────── */
console.log('\n9 · Tests 11 y 12 — editar y eliminar');

eq(datosRutinasPiel(editarRutinaPiel(c1.estado, c1.rutina.id, { nombre: 'Otra cosa' }).estado).rutinas[0].nombre,
  'Otra cosa', 'Test 11: se edita el nombre');
ok(editarRutinaPiel(base(), 'noExiste', {}).error !== null, 'Una que no existe da error');

// ⚠️ Se dice ANTES qué se lleva por delante.
const imp = impactoEliminarRutinaPiel(m1, c1.rutina.id);
ok(imp.texto.includes('1 día registrado'), 'Test 12: borrar dice antes qué se lleva');
eq(impactoEliminarRutinaPiel(c1.estado, c1.rutina.id).registros, 0, 'Y sin registros lo dice también');
eq(impactoEliminarRutinaPiel(base(), 'noExiste'), null, 'De una que no existe, nada');
const borrado = eliminarRutinaPiel(m1, c1.rutina.id).estado;
eq(datosRutinasPiel(borrado).rutinas.length, 0, 'Se borra');
eq(datosRutinasPiel(borrado).hechos.length, 0, 'Y sus registros con ella');
ok(eliminarRutinaPiel(base(), 'noExiste').error !== null, 'Una que no existe, no');

/* ── 10 · PLANTILLAS (apartados 12 y 13) ────────────────────────────────── */
console.log('\n10 · Las plantillas SUGIEREN, no crean');

eq(PLANTILLAS_PIEL.filter((p) => p.momento === 'manana').map((p) => p.nombre),
  ['Rutina básica', 'Rutina intermedia', 'Rutina completa'], 'Las tres del apartado 12');
eq(plantillaPiel('inventada'), null, 'Una que no existe es null');

// ⚠️ Sin nivel elegido NO se propone una: no se elige por él.
eq(plantillaSugerida(base()).hay, false, '⚠️ Sin saber qué prefiere, no se propone nada');
ok(plantillaSugerida(base()).texto.length > 0, 'Y se dice qué falta');

const conNivel = contestarPiel(base(), 'complejidadPiel', 'basico', { hoy: HOY }).estado;
const sug = plantillaSugerida(conNivel);
eq(sug.hay, true, 'Apartado 13: con su nivel, sí');
eq(sug.plantilla, 'basica', 'Y es la que encaja');
eq(sug.guardado, false, '⚠️ Escrito en el propio dato: esto NO está guardado');
eq(sug.accion, 'Usar esta rutina', 'Con el botón del enunciado');

// ⚠️ Y sugerir no escribe NADA.
const antes = JSON.stringify(normalizarEstiloHombre(conNivel));
plantillaSugerida(conNivel);
eq(JSON.stringify(normalizarEstiloHombre(conNivel)), antes,
  '⚠️ Apartado 13: proponer una plantilla no cambia ni un byte del estado');

// El perfil adapta la plantilla.
const sinSolar = contestarPiel(conNivel, 'solarPiel', 'no', { hoy: HOY }).estado;
ok(!plantillaSugerida(sinSolar).pasos.some((p) => p.id === 'solar'),
  '⚠️ Apartado 13: si ha dicho que no usa protección solar, no se le mete en la propuesta');
ok(plantillaSugerida(conNivel).pasos.some((p) => p.id === 'solar'), 'Y si no lo ha dicho, sí');

// ⚠️ Sin confirmar no escribe.
eq(usarPlantilla(conNivel, 'basica').rutina, null, '⚠️ `usarPlantilla` sin confirmar NO crea nada');
ok(usarPlantilla(conNivel, 'basica').error !== null, 'Y lo dice');
const usada = usarPlantilla(conNivel, 'basica', { confirmado: true, hoy: HOY });
eq(datosRutinasPiel(usada.estado).rutinas.length, 1, 'Confirmando, sí');
eq(usada.rutina.pasos.length, 3, 'Con sus tres pasos');
ok(usarPlantilla(conNivel, 'inventada', { confirmado: true }).error !== null, 'Una plantilla que no existe, no');

/* ── 11 · NIVELES (apartado 14) ─────────────────────────────────────────── */
console.log('\n11 · ⚠️ Apartado 14 — cambiar de nivel no borra la rutina anterior');

eq(pasosParaNivel('basico').length < PASOS_PIEL.length, true, 'El nivel básico ofrece menos pasos');
eq(pasosParaNivel('avanzado').length, PASOS_PIEL.length, 'Y el avanzado, todos');
eq(pasosParaNivel(null).length, PASOS_PIEL.length,
  '⚠️ Sin nivel elegido se ofrece todo: esconder opciones a quien no ha dicho nada es decidir por él');
ok(pasosParaNivel('basico').every((p) => p.nivel === 'basico'), 'Y el básico solo trae los suyos');

// ⚠️ La prueba que importa: cambiar de nivel no toca lo guardado.
const conRutinaAvanzada = crearRutinaPiel(
  contestarPiel(base(), 'complejidadPiel', 'avanzado', { hoy: HOY }).estado,
  { nombre: 'La mía', pasos: [{ accion: 'mascarilla' }, { accion: 'serum' }] }, { hoy: HOY },
).estado;
const bajado = contestarPiel(
  contestarPiel(conRutinaAvanzada, 'complejidadPiel', 'avanzado', { hoy: HOY }).estado,
  'complejidadPiel', 'basico', { hoy: HOY },
).estado;
eq(datosRutinasPiel(bajado).rutinas.length, 1,
  '⚠️ Apartado 14: bajar de nivel NO borra la rutina anterior');
eq(datosRutinasPiel(bajado).rutinas[0].pasos.length, 2, 'Ni sus pasos, aunque ya no se ofrezcan');
eq(NIVELES_ESTILO.length, 3, 'Y los niveles siguen siendo los de la Fase 6');

/* ── 12 · TEST 13 — HISTORIAL (apartados 15 y 16) ───────────────────────── */
console.log('\n12 · Test 13 — el historial, sin competición ni castigo');

eq(estaSemanaPiel(base()).hechas, 0, 'Sin nada, cero — y no revienta');
ok(estaSemanaPiel(base()).texto.length > 0, 'Con una frase que no reprocha');
let sem = c1.estado;
['2026-08-25', '2026-08-26', HOY].forEach((f) => {
  sem = marcarPasoPiel(sem, c1.rutina.id, ids[0], { hoy: f }).estado;
});
eq(estaSemanaPiel(sem, { hoy: HOY }).hechas, 3, 'Test 13: tres esta semana');
ok(estaSemanaPiel(sem, { hoy: HOY }).texto.includes('3 rutinas realizadas'),
  '⚠️ Apartado 16: "Esta semana: 3 rutinas realizadas." Y nada más');
// ⚠️ Ni porcentajes, ni rachas, ni comparaciones.
ok(!/%|racha|mejor que|peor|has fallado|perdid/i.test(estaSemanaPiel(sem, { hoy: HOY }).texto),
  '⚠️ Sin porcentajes, sin rachas y sin reproches (apartados 15 y 16)');

const hist = historialPiel(sem, { hoy: HOY });
eq(hist.length, 1, 'El historial trae la rutina');
ok(hist[0].cumplimiento !== null, 'Con su cumplimiento, porque le tocaba');
// ⚠️ Sin días en los que tocara NO hay cumplimiento.
const nunca = crearRutinaPiel(base(), { nombre: 'Cuando quiera', frecuencia: 'personalizado' }, { hoy: HOY }).estado;
eq(historialPiel(nunca, { hoy: HOY })[0].cumplimiento, null,
  '⚠️ Sin días en los que tocara NO hay cumplimiento: decir "0 %" de algo que nunca tocó es un reproche');
eq(historialPiel(nunca, { hoy: HOY })[0].tocaba, 0, 'Y se ve por qué');

/* ── 13 · TEST 14 — CALENDARIO (apartado 17) ────────────────────────────── */
console.log('\n13 · Test 14 — el calendario que ya existe');

eq(eventosDePiel(conAviso, { desde: HOY, hasta: '2026-08-29' }).length, 0,
  '⚠️ Con los recordatorios apagados, ningún evento — nacen apagados');
const conParte = alternarPartePiel(conAviso, 'recordatorios');
const evs = eventosDePiel(conParte, { desde: HOY, hasta: '2026-08-29' });
eq(evs.length, 3, 'Test 14: encendidos, una ocurrencia por día');
eq(evs[0].origen, 'piel', 'Con su origen');
ok(evs[0].soloLectura, '⚠️ De solo lectura (regla 11)');
eq(Object.keys(evs[0]).sort(),
  ['fecha', 'horaFin', 'horaInicio', 'id', 'notas', 'origen', 'origenId', 'soloLectura', 'tipo', 'titulo', 'todoElDia', 'ubicacion'].sort(),
  '⚠️ Con la MISMA forma que los del Armario y los del pelo: encaja sin adaptadores');
eq(eventosDePiel(conParte, {}).length, 0, 'Sin rango, ninguno — y no revienta');

// ⚠️ Nada materializado: un año de eventos no engorda lo guardado.
const guardadoAntes = JSON.stringify(datosRutinasPiel(conParte));
eventosDePiel(conParte, { desde: '2026-01-01', hasta: '2026-12-31' });
eq(JSON.stringify(datosRutinasPiel(conParte)), guardadoAntes,
  '⚠️ Regla 11: pedir un año de eventos no guarda ni una fecha');
ok(eventosDePiel(conParte, { desde: '2026-01-01', hasta: '2026-12-31' }).length > 100, 'Aunque salgan más de cien');
/* ⚠️ Y ni uno ANTES de que la rutina existiera: pedir el año entero no la
   retrocede al 1 de enero. La rutina se creó el 27 de agosto y `desde` lo
   guarda, así que empieza ahí. */
ok(eventosDePiel(conParte, { desde: '2026-01-01', hasta: '2026-12-31' }).every((e) => e.fecha >= HOY),
  '⚠️ Y ninguno anterior al día en que la creó: una rutina no existe antes de existir');

/* ── 14 · TESTS 15, 16 Y 17 — DESACTIVAR, REACTIVAR Y NO DUPLICAR ───────── */
console.log('\n14 · Tests 15-17 — desactivar, reactivar y no duplicar');

const sinRutinas = alternarPartePiel(m1, 'rutinas');
eq(rutinasDeHoyPiel(sinRutinas, { hoy: HOY }).length, 0, 'Test 15: apagadas, no salen');
eq(datosRutinasPiel(sinRutinas).rutinas.length, 1, '⚠️ Test 16: pero los datos se conservan');
const otraVez = alternarPartePiel(sinRutinas, 'rutinas');
eq(rutinasDeHoyPiel(otraVez, { hoy: HOY }).length, 1, 'Y al reactivarlo, todo vuelve');
eq(checklistPiel(otraVez, c1.rutina.id, { hoy: HOY }).estado, 'a_medias', 'Con lo que había marcado');
eq(alternarPartePiel(base(), 'inventada'), normalizarEstiloHombre(base()), 'Una parte que no existe no hace nada');

// Y desactivar el módulo entero.
const moduloOff = alternarModulo(m1, MODULO_PIEL);
eq(datosRutinasPiel(moduloOff).rutinas.length, 1, '⚠️ Apagar el módulo tampoco borra (F1, apartado 7)');
eq(datosRutinasPiel(alternarModulo(moduloOff, MODULO_PIEL)).rutinas.length, 1, 'Y al reactivarlo sigue ahí');

const aud = auditarRutinasPiel(conProd);
eq(aud.inventariosPropios, 0, '⚠️ Test 17: cero inventarios propios');
eq(aud.calendariosNuevos, 0, 'Cero calendarios nuevos');
eq(aud.copiasDelPerfil, 0, 'Cero copias del perfil');
eq([aud.usaIA, aud.xp, aud.rachas], [0, 0, 0], 'Sin IA y sin gamificación (D2-02)');
eq(aud.motorCompartido, 'motorRutinas.js', '⚠️ Y el motor es uno solo, compartido con Pelo');
eq(aud.productosDelPerfil, 1, 'Los productos que hay son los del perfil');

/* ── 15 · EL NORMALIZADOR Y LO ROTO ─────────────────────────────────────── */
console.log('\n15 · El normalizador');

eq(normalizarRutinasPiel(undefined).rutinas, [], 'Sin nada, vacío');
eq(normalizarRutinasPiel('roto').rutinas, [], 'Con basura, también');
eq(normalizarRutinasPiel({ rutinas: 'roto' }).rutinas, [], 'Unas rutinas que no son lista, tampoco');
eq(normalizarRutinasPiel({}).partes.rutinas, true, 'Las partes caen en su valor por defecto');
eq(normalizarRutinasPiel({ hechos: [{ fecha: 5 }] }).hechos, [], 'Un registro sin fecha se cae');
eq(normalizarRutinasPiel({ hechos: [{ rutinaId: 'a', fecha: HOY, pasos: ['x', 'x'] }] }).hechos[0].pasos, ['x'],
  'Y los pasos no se repiten');
eq(normalizarHechos('roto'), [], 'El motor aguanta basura');
eq(estadoDelDia(0, 0), 'pendiente', 'Sin pasos, pendiente — y no revienta');
eq(estadoDelDia(2, 2), 'hecha', 'Todos hechos, hecha');
eq(checklistGenerico(null, [], HOY, {}), null, 'Sin rutina, null');
eq(impactoEliminarRutina([], [], 'x'), null, 'Y sin rutina, ningún impacto');
eq(tocaEnFechaGenerico({ activa: false, frecuencia: 'diario' }, HOY, () => 'diaria'), false,
  'Una rutina desactivada no toca ningún día');
eq(alternarPaso([], 'r', 'p', HOY).length, 1, 'Marcar sobre vacío crea el registro');
eq(alternarPaso(alternarPaso([], 'r', 'p', HOY), 'r', 'p', HOY).length, 0,
  '⚠️ Y desmarcar el último quita el registro entero: sin nada marcado no hay registro');
eq(alternarOmitido([], 'r', 'p', HOY)[0].omitidos, ['p'], 'Omitir sobre vacío también');

/* ── 16 · RESUMEN ───────────────────────────────────────────────────────── */
console.log('\n16 · Resumen');

const res = resumenRutinasPiel(c2.estado, { hoy: HOY });
eq(res.rutinas, 2, 'Dos rutinas');
eq(res.manana, 1, 'Una de mañana');
eq(res.noche, 1, 'Y una de noche');
eq(res.hoy, 2, 'Las dos tocan hoy');
eq(resumenRutinasPiel(base(), { hoy: HOY }).rutinas, 0, 'Sin nada, cero — y no revienta');
eq(pasoPiel('inventado'), null, 'Un paso que no existe es null');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
