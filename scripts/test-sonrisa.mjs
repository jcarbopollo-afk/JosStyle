// ============================================================================
// EH · Fase 23/65 — Higiene bucal y sonrisa
//
// Las quince pruebas del apartado 17, y lo que gobierna la fase:
//   · un módulo nuevo se añade con UNA LÍNEA en `MODULOS_EH` (F1)
//   · la racha es la GLOBAL, y si no la tiene NO se muestra (apartado 10)
//   · ni calendario dental, ni papelera propia, ni otro inventario
//   · el cambio de cepillo se SUGIERE, no se agenda (apartado 6)
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre,
  MODULOS_EH, moduloEH,
} from '../src/lib/estiloDeHombre.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { reglaAplicable as reglaMotor } from '../src/lib/motorRecomendaciones.js';
import { normalizarRutinaGenerica } from '../src/lib/motorRutinas.js';
import { eventosDerivados, NOMBRES_ORIGEN } from '../src/lib/calendarioIntegracion.js';
import { PALABRAS_CLINICAS as CLINICAS_F13 } from '../src/lib/perfilPiel.js';
import { crearProductoPiel, productosPiel, eliminarProductoPiel } from '../src/lib/productosPiel.js';
import {
  MODULO_SONRISA, TEXTOS_SONRISA, PARTES_SONRISA, parteSonrisa, PASOS_SONRISA,
  FRECUENCIAS_SONRISA, MOMENTOS_SONRISA, PLANTILLA_SONRISA, TIPOS_PRODUCTO_SONRISA,
  catalogoParaSonrisa, FRECUENCIAS_CEPILLO, AVISOS_REVISION, avisoRevision,
  DEFAULT_SONRISA, normalizarSonrisa, normalizarRevision, normalizarCepillo,
  datosSonrisa, decirAhoraNoSonrisa, configurarSonrisa, parteActivaSonrisa,
  alternarParteSonrisa, estadoDeEntradaSonrisa, rutinasSonrisa, rutinaSonrisa,
  crearRutinaSonrisa, editarRutinaSonrisa, plantillaSugeridaSonrisa,
  usarPlantillaSonrisa, rutinasDeHoySonrisa, checklistSonrisa, marcarPasoSonrisa,
  omitirPasoSonrisa, marcarRutinaSonrisaEntera, alternarRecordatorioSonrisa,
  impactoEliminarRutinaSonrisa, eliminarRutinaSonrisa, restaurarRutinaSonrisa,
  anadirProductoSonrisa, quitarProductoSonrisa, productosDeSonrisa,
  registrarCambioCepillo, ponerFrecuenciaCepillo, sugerirCambioCepillo,
  planificarCambioCepillo, quitarPlanCepillo, crearRevision, editarRevision,
  eliminarRevision, restaurarRevision, diasDeAviso, proximaRevision,
  eventosDeSonrisa, registrarSonrisa, eliminarRegistroSonrisa,
  restaurarRegistroSonrisa, estaSemanaSonrisa, historialSonrisa,
  ORIGEN_RACHA_SONRISA, rachaDeSonrisa, CONSEJOS_SONRISA, SUGERENCIAS_SONRISA,
  sugerenciasSonrisa, resumenSonrisa, auditarSonrisa, textosDeSonrisa,
  panelSonrisa, sinDiagnostico, PALABRAS_CLINICAS,
} from '../src/lib/sonrisa.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const base = () => configurarSonrisa(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['sonrisa', 'skincare']), { hoy: HOY }).estado;
const conRutina = (e = base()) => {
  const r = crearRutinaSonrisa(e, {
    nombre: 'Noche', momento: 'noche', frecuencia: 'diario',
    pasos: [{ accion: 'cepillado' }, { accion: 'hilo' }],
  }, { hoy: HOY });
  return { estado: r.estado, rutina: r.rutina };
};

const fuente = readFileSync(new URL('../src/lib/sonrisa.js', import.meta.url), 'utf8');
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarSonrisa[\s\S]*?\n}/, '')
  .replace(/'[^'\n]*'/g, "''")
  .replace(/`[^`]*`/g, '``');

/* ── 1 · ⚠️ UN MÓDULO NUEVO SE AÑADE CON UNA LÍNEA (F1) ─────────────────── */
console.log('\n1 · ⚠️ Una línea en `MODULOS_EH`, y nada más');

{
  const m = moduloEH(MODULO_SONRISA);
  ok(!!m, '⚠️ Sonrisa está en el catálogo de módulos');
  eq(m.categoria, 'cuidado', 'Con su categoría');
  ok(Array.isArray(m.terminos) && m.terminos.length >= 5,
    'Y sus sinónimos de búsqueda EN ESA MISMA LÍNEA (F1, apartado 9)');
  ok(m.terminos.includes('dientes') && m.terminos.includes('dentista'),
    'Con las palabras que él escribiría al buscarlo');
  eq(m.fase, 23, 'Y la fase en la que llega');
  /* ⚠️ Y no hace falta ni un `case` ni un registro aparte. */
  ok(!/case\s+'sonrisa'/.test(readFileSync(new URL('../src/lib/estiloDeHombre.js', import.meta.url), 'utf8')),
    '⚠️ Sin un `case` ni un `if` suyo en `estiloDeHombre.js`');
}

{
  const a = auditarSonrisa(base());
  eq([a.calendariosNuevos, a.papelerasNuevas, a.inventariosNuevos], [0, 0, 0],
    'Cero calendarios, papeleras e inventarios nuevos');
  eq([a.rachasNuevas, a.contadoresGuardados], [0, 0], '⚠️ Y cero rachas y cero contadores guardados');
  eq(a.motoresNuevos, 0, 'Y cero motores');
  eq(a.motorRutinas, 'motorRutinas.js', 'Con el motor de rutinas declarado');
}

/* ── 2 · ACTIVACIÓN Y PARTES (apartados 1 y 14) ─────────────────────────── */
console.log('\n2 · Las cuatro plaquitas, cada una con su interruptor');

eq(PARTES_SONRISA.map((p) => p.id), ['higiene', 'dental', 'revisiones', 'seguimiento'],
  'Las cuatro del apartado 1');
eq(PARTES_SONRISA.filter((p) => !p.porDefecto).map((p) => p.id), ['seguimiento'],
  '⚠️ Y el seguimiento no viene puesto: *"si quiere"* (apartado 9)');

eq(estadoDeEntradaSonrisa(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['sonrisa'])), 'sin_configurar',
  'Se entra sin configurar');
eq(estadoDeEntradaSonrisa(decirAhoraNoSonrisa(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['sonrisa'])).estado), 'ahora_no',
  '"Ahora no" se guarda');
eq(estadoDeEntradaSonrisa(base()), 'configurado', 'Y configurarlo también');

/* Pruebas 11 y 12: desactivar cada plaquita individualmente, y reactivar. */
{
  let { estado, rutina } = conRutina();
  estado = crearRevision(estado, { fecha: '2026-10-15', nota: 'Dentista' }).estado;

  const sinHigiene = alternarParteSonrisa(estado, 'higiene');
  eq(parteActivaSonrisa(sinHigiene, 'higiene'), false, 'Prueba 11: se quita 🪥 Higiene diaria');
  eq(parteActivaSonrisa(sinHigiene, 'revisiones'), true,
    '⚠️ Apartado 14: manteniendo 📅 Revisiones, "sin afectar a nada más"');
  eq(rutinasSonrisa(sinHigiene).length, 1, '⚠️ Y la rutina SIGUE GUARDADA (apartado 15 de la F22)');
  eq(rutinasDeHoySonrisa(sinHigiene, { hoy: HOY }), [], 'Solo deja de enseñarse');
  eq(datosSonrisa(sinHigiene).revisiones.length, 1, 'Y la revisión sigue');

  const vuelta = alternarParteSonrisa(sinHigiene, 'higiene');
  eq(rutinasDeHoySonrisa(vuelta, { hoy: HOY }).length, 1, 'Prueba 12: y al reactivarla vuelve todo');
  eq(rutinaSonrisa(vuelta, rutina.id).nombre, 'Noche', 'Exactamente donde estaba');
  eq(alternarParteSonrisa(estado, 'inventada'), normalizarEstiloHombre(estado), 'Alternar lo que no existe no hace nada');
  eq(parteSonrisa('inventada'), null, 'Y una parte que no existe es `null`');
}

/* ── 3 · RUTINAS Y CHECKLIST (apartados 2, 4 y pruebas 2, 3 y 9) ────────── */
console.log('\n3 · Rutinas, plantilla y checklist');

eq(PLANTILLA_SONRISA.rutinas.map((r) => r.nombre), ['Mañana', 'Noche'],
  'La plantilla del apartado 2: mañana y noche');
eq(PLANTILLA_SONRISA.rutinas[1].pasos, ['cepillado', 'hilo'],
  'Con cepillado e hilo por la noche, como la dibuja el enunciado');

{
  const e = base();
  const p = plantillaSugeridaSonrisa(e);
  eq(p.hay, true, 'Sin rutinas se ofrece la plantilla');
  eq(p.guardada, false, '⚠️ Y va escrito en el dato: NO está guardada');

  /* ⚠️ Verla no la crea, y sin `confirmado` no escribe. Octavo `aplicarPlan`. */
  const antes = JSON.stringify(normalizarEstiloHombre(e));
  plantillaSugeridaSonrisa(e);
  const sin = usarPlantillaSonrisa(e, { hoy: HOY });
  eq(sin.sinConfirmar, true, '⚠️ Sin `confirmado` NO escribe (octavo `aplicarPlan`)');
  eq(JSON.stringify(normalizarEstiloHombre(sin.estado)), antes, 'Y el estado no cambia ni un byte');

  const usada = usarPlantillaSonrisa(e, { hoy: HOY, confirmado: true });
  eq(rutinasSonrisa(usada.estado).map((r) => r.nombre), ['Mañana', 'Noche'], 'Prueba 2: con `confirmado` sí');
  eq(plantillaSugeridaSonrisa(usada.estado).hay, false, 'Y ya no se vuelve a ofrecer');
}

{
  const { estado, rutina } = conRutina();
  eq(rutinasSonrisa(estado).length, 1, 'Prueba 2: se crea una rutina');
  eq(crearRutinaSonrisa(base(), {}).error, 'La rutina necesita un nombre.', 'Sin nombre no se crea');

  // Prueba 3: editar pasos.
  const ed = editarRutinaSonrisa(estado, rutina.id, { pasos: [{ accion: 'cepillado' }, { accion: 'hilo' }, { accion: 'enjuague' }] });
  eq(rutinaSonrisa(ed.estado, rutina.id).pasos.length, 3, 'Prueba 3: se editan los pasos');
  eq(editarRutinaSonrisa(estado, rutina.id, { nombre: ' ' }).error, 'La rutina necesita un nombre.',
    'Y no se puede dejar sin nombre');
  eq(editarRutinaSonrisa(estado, 'x', {}).error, 'Esa rutina no existe.', 'Sobre lo que no hay, avisa');

  // Prueba 9 del enunciado de la F22 / apartado 9: el checklist, sin penalizaciones.
  const lista = checklistSonrisa(estado, rutina.id, { hoy: HOY });
  eq(lista.pasos.map((p) => p.etiqueta), ['Cepillado', 'Hilo dental'], 'El checklist trae sus pasos');
  eq(lista.estado, 'pendiente', '⚠️ Y sin tocar nada está "Pendiente", nunca "has fallado"');

  const uno = marcarPasoSonrisa(estado, rutina.id, rutina.pasos[0].id, { hoy: HOY });
  eq(checklistSonrisa(uno, rutina.id, { hoy: HOY }).estado, 'a_medias', 'Con uno marcado, a medias');
  const omit = omitirPasoSonrisa(uno, rutina.id, rutina.pasos[1].id, { hoy: HOY });
  eq(checklistSonrisa(omit, rutina.id, { hoy: HOY }).estado, 'hecha',
    '⚠️ Uno hecho y uno omitido es una rutina HECHA: omitir no penaliza');
  eq(checklistSonrisa(marcarRutinaSonrisaEntera(estado, rutina.id, { hoy: HOY }), rutina.id, { hoy: HOY }).estado, 'hecha',
    'Y se puede marcar entera');
  eq(checklistSonrisa(estado, 'no-existe', { hoy: HOY }), null, 'El de lo que no hay es `null`');
}

/* Prueba 7: recordatorios, siempre apagados de nacimiento. */
{
  const { estado, rutina } = conRutina();
  eq(rutina.recordatorio, false, '⚠️ Prueba 7: el recordatorio nace APAGADO (apartado 5)');
  const con = alternarRecordatorioSonrisa(estado, rutina.id);
  eq(rutinaSonrisa(con.estado, rutina.id).recordatorio, true, 'Y lo enciende él');
  eq(alternarRecordatorioSonrisa(estado, 'x').error, 'Esa rutina no existe.', 'Sobre lo que no hay, avisa');
  ok(!/recordatorio:\s*true/.test(codigo), '⚠️ Y en ninguna parte se enciende solo');
}

/* ── 4 · PRODUCTOS: EL CATÁLOGO GLOBAL (apartados 3, 12 y 13) ───────────── */
console.log('\n4 · ⚠️ El catálogo global, ni un inventario nuevo');

eq(TIPOS_PRODUCTO_SONRISA.map((t) => t.id), ['cepillo', 'electrico', 'pasta', 'hilo', 'enjuague', 'otros'],
  'Los seis tipos del apartado 3');

{
  let e = crearProductoPiel(base(), { nombre: 'Pasta de dientes', categoria: 'otros' }, { hoy: HOY }).estado;
  const pid = productosPiel(e)[0].id;
  eq(catalogoParaSonrisa(e).length, 1, '⚠️ El catálogo son los productos que YA existen');

  // Prueba 4: registrar productos, enlazados al catálogo global.
  const r = anadirProductoSonrisa(e, { tipo: 'pasta', nombre: 'Pasta de dientes', productoId: pid }, { hoy: HOY });
  e = r.estado;
  eq(productosDeSonrisa(e).length, 1, 'Prueba 4: se registra un producto');
  eq(productosDeSonrisa(e)[0].deCatalogo, true, 'Enlazado con el catálogo global');
  eq(datosSonrisa(e).productos[0].productoId, pid, '⚠️ Y se guarda su ID, no su ficha');
  eq(productosPiel(e).length, 1, '⚠️ Prueba 15: sin duplicarlo en ningún sitio');

  // ⚠️ Y si lo borra en su módulo, aquí queda su nombre y se DICE que se fue.
  const borrado = eliminarProductoPiel(e, pid).estado;
  eq(productosDeSonrisa(borrado)[0].seFue, true, '⚠️ Si lo borra en Skincare, aquí se dice que ya no está');
  eq(productosDeSonrisa(borrado)[0].nombreVisible, 'Pasta de dientes', 'Y se queda el nombre que él escribió');

  // Uno suyo, sin catálogo.
  const suyo = anadirProductoSonrisa(e, { tipo: 'cepillo', nombre: 'Mi cepillo' }, { hoy: HOY });
  eq(productosDeSonrisa(suyo.estado).length, 2, 'También vale uno solo con nombre');
  eq(anadirProductoSonrisa(e, {}).error, 'El producto necesita un nombre.', 'Pero algo hay que poner');
  eq(anadirProductoSonrisa(e, { nombre: 'X', productoId: 'no-existe' }).error, 'Ese producto no existe.',
    'Y no se enlaza con uno que no está');

  const quit = quitarProductoSonrisa(suyo.estado, productosDeSonrisa(suyo.estado)[0].id);
  eq(productosDeSonrisa(quit.estado).length, 1, 'Se puede quitar');
  eq(productosPiel(quit.estado).length, 1, '⚠️ Y quitarlo de aquí NO lo borra de Skincare');
  eq(quitarProductoSonrisa(e, 'x').error, 'Ese producto no existe.', 'Sobre lo que no hay, avisa');
  ok(!/CATALOGO_SONRISA|crearProductoSonrisa\s*\(/.test(codigo),
    '⚠️ Y aquí no hay ningún catálogo ni ninguna función que cree un producto');
}

/* ── 5 · EL CEPILLO: SE SUGIERE, NO SE AGENDA (apartado 6) ──────────────── */
console.log('\n5 · ⚠️ El cambio de cepillo se sugiere, no se agenda');

eq(FRECUENCIAS_CEPILLO.find((f) => f.id === 'trimestral').dias, 90, 'Cada 3 meses son 90 días');
eq(FRECUENCIAS_CEPILLO.find((f) => f.id === 'personalizado').dias, null, 'Y "Personalizado" no trae número');

{
  const e = base();
  eq(sugerirCambioCepillo(e, { hoy: HOY }).hay, false, 'Sin el último cambio no hay sugerencia');
  ok(!/\d{4}-\d{2}-\d{2}/.test(sugerirCambioCepillo(e, { hoy: HOY }).texto),
    '⚠️ Y NO se inventa una fecha: se pide el dato');

  const cam = registrarCambioCepillo(e, { fecha: '2026-06-01' }).estado;
  const s = sugerirCambioCepillo(cam, { hoy: HOY });
  eq(s.hay, true, 'Prueba 5: con el último cambio, sí');
  eq(s.fecha, '2026-08-30', 'Y sale 90 días después');
  eq(s.guardado, false, '⚠️ Escrito en el dato: esto NO está en el calendario');

  /* ⚠️ Sugerir NO escribe, y planificar sin `confirmado` tampoco. */
  const antes = JSON.stringify(normalizarEstiloHombre(cam));
  sugerirCambioCepillo(cam, { hoy: HOY });
  eq(JSON.stringify(normalizarEstiloHombre(cam)), antes, '⚠️ Sugerirlo no escribe ni un byte');
  eq(planificarCambioCepillo(cam, s.fecha).sinConfirmar, true, '⚠️ Y guardarla exige `confirmado`');
  eq(datosSonrisa(planificarCambioCepillo(cam, s.fecha).estado).cepillo.proximo, null, 'Sin guardar nada');

  const plan = planificarCambioCepillo(cam, s.fecha, { confirmado: true });
  eq(datosSonrisa(plan.estado).cepillo.proximo, '2026-08-30', 'Con `confirmado`, se guarda');
  eq(planificarCambioCepillo(cam, 'mañana', { confirmado: true }).error, 'Esa fecha no vale.', 'Una fecha que no lo es, no');
  eq(datosSonrisa(quitarPlanCepillo(plan.estado).estado).cepillo.proximo, null, 'Y se puede quitar');

  /* ⚠️ Cambiarlo borra el plan: avisar de algo que ya hizo sería mentir. */
  const otra = registrarCambioCepillo(plan.estado, { fecha: HOY }).estado;
  eq(datosSonrisa(otra).cepillo.proximo, null, '⚠️ Y cambiarlo de verdad borra el plan anterior');

  eq(ponerFrecuenciaCepillo(e, 'personalizado').error, 'Dime cada cuántos días, con un número.',
    '"Personalizado" sin cifra no cuela');
  eq(ponerFrecuenciaCepillo(e, 'personalizado', 0).error, 'Dime cada cuántos días, con un número.',
    '⚠️ Ni un 0: `Number(null)` es 0 y `Number.isInteger(0)` es `true`');
  eq(datosSonrisa(ponerFrecuenciaCepillo(cam, 'personalizado', 45).estado).cepillo.cadaCuantosDias, 45, 'Con cifra, sí');
  eq(sugerirCambioCepillo(ponerFrecuenciaCepillo(cam, 'personalizado', 45).estado, { hoy: HOY }).dias, 45,
    'Y la sugerencia la usa');
  eq(ponerFrecuenciaCepillo(e, 'inventada').error, 'Esa frecuencia no existe.', 'Una frecuencia que no existe, no');
}

/* ── 6 · REVISIONES (apartados 7 y 8) ───────────────────────────────────── */
console.log('\n6 · Revisiones — la fecha la pone él');

eq(AVISOS_REVISION.map((a) => a.id), ['un_dia', 'tres_dias', 'una_semana', 'personalizado'],
  'Las cuatro antelaciones del apartado 8');

{
  const e = base();
  const r = crearRevision(e, { fecha: '2026-10-15', nota: 'Dentista de siempre' });
  eq(r.error, null, 'Prueba 6: se crea una revisión');
  eq(r.revision.aviso, false, '⚠️ Y su aviso nace APAGADO: "opcional" (apartado 8)');
  eq(crearRevision(e, {}).error, 'La revisión necesita una fecha.', 'Sin fecha no hay revisión');
  eq(crearRevision(e, { fecha: '2026-10-15', aviso: true, avisoTipo: 'personalizado' }).error,
    'Dime cuántos días antes, con un número.', '⚠️ Y "Personalizado" sin cifra no cuela');

  const conAviso = crearRevision(e, { fecha: '2026-10-15', aviso: true, avisoTipo: 'una_semana' });
  eq(diasDeAviso(conAviso.revision), 7, 'Prueba 7: con su antelación');
  eq(diasDeAviso({ aviso: false }), null, 'Y sin aviso, `null`');

  eq(proximaRevision(r.estado, { hoy: HOY }).fecha, '2026-10-15', 'Sale como la próxima');
  eq(proximaRevision(e, { hoy: HOY }), null, 'Sin ninguna, `null`');
  eq(proximaRevision(r.estado, { hoy: '2026-12-01' }), null, '⚠️ Y una que ya pasó no es la próxima');

  const ed = editarRevision(r.estado, r.revision.id, { hecha: true });
  eq(proximaRevision(ed.estado, { hoy: HOY }), null, 'Prueba 10: marcada como hecha, deja de estar pendiente');
  eq(editarRevision(e, 'x', {}).error, 'Esa revisión no existe.', 'Sobre lo que no hay, avisa');
  ok(!/receta|tratamiento|historia clinica/i.test(codigo), '⚠️ Y no hay ningún sistema médico de citas');
}

/* ── 7 · ⚠️ EL CALENDARIO GLOBAL (apartados 7 y 15) ─────────────────────── */
console.log('\n7 · ⚠️ Nunca un calendario dental');

eq(NOMBRES_ORIGEN.sonrisa, 'Sonrisa', 'El calendario global sabe traducir su origen');

{
  let { estado, rutina } = conRutina();
  estado = crearRevision(estado, { fecha: '2026-10-15', nota: 'Dentista' }).estado;
  estado = registrarCambioCepillo(estado, { fecha: '2026-06-01' }).estado;

  const soloRevision = eventosDeSonrisa(estado, '2026-10-14', '2026-10-16');
  eq(soloRevision.map((x) => x.titulo), ['🦷 Dentista'], 'Prueba 8: la revisión entra en el calendario');
  eq(soloRevision[0].soloLectura, true, '⚠️ De SOLO LECTURA: el calendario no es su dueño (regla 11)');
  eq(soloRevision[0].origen, 'sonrisa', 'Con su origen');
  eq(soloRevision[0].notas, 'Dentista', 'Y su nota');

  // ⚠️ El cepillo, SOLO si él guardó la fecha.
  eq(eventosDeSonrisa(estado, '2026-08-29', '2026-08-31').length, 0,
    '⚠️ El cambio de cepillo NO sale hasta que él lo guarda');
  const plan = planificarCambioCepillo(estado, '2026-08-30', { confirmado: true }).estado;
  eq(eventosDeSonrisa(plan, '2026-08-29', '2026-08-31').map((x) => x.titulo), ['🪥 Cambiar el cepillo'],
    'Y una vez guardado, sí');

  // La rutina, solo con recordatorio.
  const conRec = alternarRecordatorioSonrisa(estado, rutina.id).estado;
  ok(eventosDeSonrisa(conRec, HOY, HOY).some((x) => x.titulo.includes('Noche')),
    'Y las rutinas con recordatorio también');

  /* ⚠️ Y todo entra por `eventosDerivados`, el calendario de siempre. */
  const derivados = eventosDerivados({ estiloHombre: estado, desde: '2026-10-14', hasta: '2026-10-16' });
  ok(derivados.some((x) => x.origen === 'sonrisa'), '⚠️ Y llega al CALENDARIO GENERAL, no a uno propio');

  // ⚠️ Y no se materializa ninguna ocurrencia.
  const antes = JSON.stringify(normalizarEstiloHombre(conRec));
  eventosDeSonrisa(conRec, '2026-01-01', '2026-12-31');
  eq(JSON.stringify(normalizarEstiloHombre(conRec)), antes, '⚠️ Pedir los eventos no guarda ni uno (regla 11)');

  // Apagar revisiones las saca del calendario, sin borrarlas.
  const sinRev = alternarParteSonrisa(estado, 'revisiones');
  eq(eventosDeSonrisa(sinRev, '2026-10-14', '2026-10-16'), [], 'Apagar revisiones las saca del calendario');
  eq(datosSonrisa(sinRev).revisiones.length, 1, 'Pero no las borra');
}

/* ── 8 · ⚠️ LA RACHA ES LA GLOBAL (apartado 10) ─────────────────────────── */
console.log('\n8 · ⚠️ La racha es la global, y si no la tiene NO se muestra');

eq(rachaDeSonrisa(null), null, '⚠️ Sin sistema de rachas, `null`: no se muestra');
eq(rachaDeSonrisa({ definiciones: [], eventos: [] }), null, '⚠️ Y sin una racha suya, tampoco');
{
  const rachas = {
    definiciones: [{ id: 'r1', nombre: 'Higiene bucal', origen: ORIGEN_RACHA_SONRISA }],
    eventos: [{ rachaId: 'r1', fecha: HOY }],
  };
  const r = rachaDeSonrisa(rachas);
  ok(r && r.racha.id === 'r1', 'Prueba 10: y si la tiene, se usa LA SUYA');
  eq(r.eventos.length, 1, 'Con sus eventos');
  eq(rachaDeSonrisa({ definiciones: [{ id: 'r2', origen: 'otro' }] }), null,
    'Una racha de otra cosa no cuenta');
  eq(panelSonrisa(base(), { hoy: HOY }).racha, null, 'Y el panel no la pinta si no la hay');
}
ok(!/crearRacha|registrarCumplimiento/.test(codigo), '⚠️ Y aquí no se crea ni se registra ninguna racha');
eq(auditarSonrisa(base()).contadoresGuardados, 0, 'Ni se guarda un contador');

/* ── 9 · SEGUIMIENTO (apartados 9 y 13) ─────────────────────────────────── */
console.log('\n9 · Seguimiento — derivado, y sin competición');

{
  let { estado, rutina } = conRutina();
  eq(estaSemanaSonrisa(estado, { hoy: HOY }), null, 'Con el seguimiento apagado, nada');
  ok(registrarSonrisa(estado, { nota: 'x' }, { hoy: HOY }).error, 'Y no se registra');

  estado = alternarParteSonrisa(estado, 'seguimiento');
  const vacia = estaSemanaSonrisa(estado, { hoy: HOY });
  eq(vacia.hechas, 0, 'Prueba 9: con el seguimiento, la cuenta de la semana');
  ok(/todavía no/.test(vacia.texto), '⚠️ Y con cero se dice "todavía no", no "0 rutinas"');
  ok(!/deberías|deber|fallado|mal/i.test(vacia.texto), '⚠️ Sin un solo reproche');

  estado = marcarPasoSonrisa(estado, rutina.id, rutina.pasos[0].id, { hoy: HOY });
  eq(estaSemanaSonrisa(estado, { hoy: HOY }).hechas, 1, '⚠️ Y la cifra se DERIVA de lo hecho');
  ok(/1 rutina realizada/.test(estaSemanaSonrisa(estado, { hoy: HOY }).texto), 'Con su frase, en singular');

  // Apartado 13 — la nota.
  const r = registrarSonrisa(estado, { nota: 'Prefiero por la noche' }, { hoy: HOY });
  eq(r.error, null, 'Prueba 9: se guarda una nota');
  eq(datosSonrisa(r.estado).registros[0].nota, 'Prefiero por la noche', 'Con su texto');
  ok(registrarSonrisa(estado, {}, { hoy: HOY }).error, '⚠️ Y un registro vacío no se guarda');
}

/* ── 10 · ⚠️ LA PAPELERA GLOBAL (apartado 16) ───────────────────────────── */
console.log('\n10 · ⚠️ Ni una papelera propia');

['sonrisa.rutinas', 'sonrisa.revisiones', 'sonrisa.registros']
  .forEach((k) => ok(!!CATALOGO_PAPELERA[k], `"${k}" está en la papelera GLOBAL`));
ok(!/DEFAULT_PAPELERA\s*=|function\s+prepararEliminacion/.test(codigo), 'Y aquí no se construye ninguna');

{
  let { estado, rutina } = conRutina();
  estado = alternarParteSonrisa(estado, 'seguimiento');
  estado = registrarSonrisa(estado, { rutinaId: rutina.id, nota: 'Una nota' }, { hoy: HOY }).estado;
  estado = marcarPasoSonrisa(estado, rutina.id, rutina.pasos[0].id, { hoy: HOY });
  estado = crearRevision(estado, { fecha: '2026-10-15' }).estado;

  const imp = impactoEliminarRutinaSonrisa(estado, rutina.id);
  ok(imp && imp.texto.includes('Noche'), '⚠️ Antes de borrar se dice qué se lleva');

  // Prueba 13: eliminar.
  const del = eliminarRutinaSonrisa(estado, rutina.id);
  eq(rutinasSonrisa(del.estado).length, 0, 'Prueba 13: se elimina la rutina');
  ok(del.entrada && del.entrada.coleccion === 'rutinas', 'Con la forma de la papelera global');
  eq(datosSonrisa(del.estado).registros.length, 1,
    '⚠️ Y su registro se queda: lo que pasó, pasó');
  eq(datosSonrisa(del.estado).registros[0].rutinaId, null, 'Huérfano, no borrado');

  // Prueba 14: recuperar.
  const vuelta = restaurarRutinaSonrisa(del.estado, del.entrada);
  eq(rutinasSonrisa(vuelta.estado).length, 1, 'Prueba 14: y vuelve entera');
  eq(restaurarRutinaSonrisa(vuelta.estado, del.entrada).yaExistia, true, 'Restaurarla dos veces no la duplica');

  const rev = datosSonrisa(estado).revisiones[0];
  const delRev = eliminarRevision(estado, rev.id);
  eq(datosSonrisa(delRev.estado).revisiones.length, 0, 'Una revisión se elimina');
  eq(datosSonrisa(restaurarRevision(delRev.estado, delRev.entrada).estado).revisiones.length, 1, 'Y vuelve');

  const reg = datosSonrisa(estado).registros[0];
  const delReg = eliminarRegistroSonrisa(estado, reg.id);
  eq(datosSonrisa(delReg.estado).registros.length, 0, 'Un registro se elimina');
  eq(datosSonrisa(restaurarRegistroSonrisa(delReg.estado, delReg.entrada).estado).registros.length, 1, 'Y vuelve');
  eq(eliminarRevision(base(), 'x').error, 'Esa revisión no existe.', 'Sobre lo que no hay, avisa');
  eq(eliminarRegistroSonrisa(base(), 'x').error, 'Ese registro no existe.', 'Y lo mismo con un registro');
}

/* ── 11 · CONSEJOS Y SUGERENCIAS (apartados 11 y 12) ────────────────────── */
console.log('\n11 · ⚠️ Consejos generales, nunca un diagnóstico');

ok(CONSEJOS_SONRISA.length >= 3, 'Hay consejos generales');
ok(CONSEJOS_SONRISA.every(sinDiagnostico), '⚠️ Y ninguno tiene una palabra clínica');
/* ⚠️ *"Consejos GENERALES"*: no miran sus datos, y eso es lo que los mantiene
   generales. Si dependieran de lo suyo serían instrucciones personalizadas. */
eq(panelSonrisa(base(), { hoy: HOY }).consejos, CONSEJOS_SONRISA,
  '⚠️ Y son los mismos para todo el mundo: no miran sus datos');

SUGERENCIAS_SONRISA.forEach((s) => {
  ok(Array.isArray(s.requiere) && s.requiere.length > 0,
    `⚠️ La regla "${s.id}" declara sus requisitos: sin ellos no se aplicaría nunca`);
});
ok(!reglaMotor({ requiere: [], cuando: () => true }, {}), 'Y el motor lo comprueba de verdad');

{
  let { estado } = conRutina();
  ok(sugerenciasSonrisa(estado).some((s) => s.id === 'sin_cepillo'),
    'Con rutinas y sin saber del cepillo, se sugiere apuntarlo');
  estado = anadirProductoSonrisa(estado, { tipo: 'cepillo', nombre: 'Cepillo' }, { hoy: HOY }).estado;
  ok(sugerenciasSonrisa(estado).some((s) => s.id === 'electrico'),
    'Prueba 12: con cepillo y sin eléctrico, se sugiere valorarlo');
  estado = anadirProductoSonrisa(estado, { tipo: 'electrico', nombre: 'Eléctrico' }, { hoy: HOY }).estado;
  ok(!sugerenciasSonrisa(estado).some((s) => s.id === 'electrico'), 'Y con eléctrico, ya no');
  ok(sugerenciasSonrisa(estado).every((s) => s.aplicada === false), '⚠️ Y ninguna hace nada sola');
  eq(sugerenciasSonrisa(alternarParteSonrisa(estado, 'dental')), [], 'Con el cuidado dental apagado, ninguna');
}

eq(PALABRAS_CLINICAS, CLINICAS_F13, 'La lista de palabras clínicas es la de la Fase 13');
textosDeSonrisa().forEach((t) => {
  if (!sinDiagnostico(t)) ok(false, `⚠️ Texto con palabra clínica: "${t}"`);
});
ok(textosDeSonrisa().every(sinDiagnostico),
  `⚠️ Los ${textosDeSonrisa().length} textos de esta fase, sin una sola palabra clínica`);

/* ── 12 · EL NORMALIZADOR (regla 5) ─────────────────────────────────────── */
console.log('\n12 · ⚠️ El normalizador conoce sus ocho campos');

['ahoraNo', 'configurado', 'partes', 'rutinas', 'hechos', 'productos', 'cepillo', 'revisiones', 'registros', 'editado']
  .forEach((c) => ok(c in DEFAULT_SONRISA, `\`${c}\` está declarado en el DEFAULT`));

{
  let { estado, rutina } = conRutina();
  estado = alternarParteSonrisa(estado, 'seguimiento');
  estado = anadirProductoSonrisa(estado, { tipo: 'pasta', nombre: 'Pasta' }, { hoy: HOY }).estado;
  estado = crearRevision(estado, { fecha: '2026-10-15', nota: 'Nota', aviso: true, avisoTipo: 'tres_dias' }).estado;
  estado = registrarCambioCepillo(estado, { fecha: '2026-06-01' }).estado;
  estado = planificarCambioCepillo(estado, '2026-08-30', { confirmado: true }).estado;
  estado = registrarSonrisa(estado, { nota: 'Una nota' }, { hoy: HOY }).estado;

  const ida = normalizarSonrisa(datosSonrisa(estado));
  const vuelta = normalizarSonrisa(JSON.parse(JSON.stringify(ida)));
  eq(vuelta.rutinas.length, 1, '⚠️ Las rutinas sobreviven a dos normalizaciones');
  eq(vuelta.productos.length, 1, 'Y los productos');
  eq(vuelta.revisiones[0].aviso, true, 'Y el aviso de la revisión');
  eq(vuelta.revisiones[0].avisoTipo, 'tres_dias', 'Con su antelación');
  eq(vuelta.cepillo.ultimoCambio, '2026-06-01', 'Y el último cambio de cepillo');
  eq(vuelta.cepillo.proximo, '2026-08-30', 'Y la fecha planificada');
  eq(vuelta.registros.length, 1, 'Y los registros');
  eq(vuelta.partes.seguimiento, true, 'Y las partes');

  eq(normalizarRevision({}), null, 'Una revisión sin fecha no existe');
  eq(normalizarRevision({ fecha: HOY, diasAviso: 0 }).diasAviso, null, '⚠️ Y un 0 no son días de aviso');
  eq(normalizarCepillo(null).frecuencia, 'trimestral', 'El cepillo tiene su defecto');
  eq(normalizarCepillo({ cadaCuantosDias: -3 }).cadaCuantosDias, null, 'Y no acepta un negativo');
  eq(normalizarSonrisa(null).rutinas, [], 'Sin nada guardado, vacío');
}

/* ── 13 · EL PANEL Y LA REGLA 8 ─────────────────────────────────────────── */
console.log('\n13 · El panel, y regla 8');

{
  let { estado } = conRutina();
  const p = panelSonrisa(estado, { hoy: HOY });
  eq(p.estado, 'configurado', 'El panel sabe en qué estado está');
  eq(p.hoy.length, 1, 'Trae lo de hoy');
  eq(p.partes.filter((x) => x.activa).length, 3, 'Y qué partes están encendidas');
  eq(p.semana, null, 'Sin seguimiento, no hay cuenta de la semana');
  ok(Array.isArray(p.consejos) && Array.isArray(p.sugerencias), 'Y sus consejos y sugerencias');

  const r = resumenSonrisa(estado, { hoy: HOY });
  eq([r.rutinas, r.hoy, r.revisiones], [1, 1, 0], 'Y el resumen cuadra');
  eq(r.proximaRevision, null, '⚠️ Sin revisión no hay próxima: `null`, no una fecha inventada');
  eq(r.ultimoCambio, null, 'Ni último cambio de cepillo');
}

/* ⚠️ `TODO:` sin distinguir mayúsculas encaja con "todo: quien…" en un
   comentario en castellano. Undécima vez que una comprobación de este proyecto
   salta con algo bien escrito: el `TODO` se busca en mayúsculas, que es como se
   escribe. */
ok(!/proximamente|próximamente|en construcción|TODO:/.test(fuente.replace(/próximamente/gi, 'próximamente')),
  'Ni un "próximamente" ni un TODO');
ok(!/proximamente|próximamente|en construcción/i.test(fuente), 'Ni un "en construcción"');
ok(!/Math\.random/.test(codigo), 'Ni una cifra inventada');
ok(!/askAI|anthropic|claude|fetch\(/i.test(codigo), '⚠️ Sin IA: ni una llamada');
eq(auditarSonrisa(base()).usaIA, 0, 'Declarado');

if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
console.log(`\n  ${n} comprobaciones correctas.`);
