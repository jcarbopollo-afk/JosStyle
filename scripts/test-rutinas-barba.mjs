// ============================================================================
// EH · Fase 21/65 — Barba y afeitado: rutinas y seguimiento
//
// Las diecisiete pruebas del apartado 20, y lo que gobierna la fase:
//   · TODO esto ya existía: motorRutinas (F14), la papelera, el calendario
//   · omitir es una TERCERA cosa, y sale de la cuenta (apartado 7)
//   · nunca un segundo calendario (apartado 14) ni una papelera propia (19)
//   · las sugerencias no diagnostican (apartado 15)
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { CATALOGO_PAPELERA, prepararEliminacion, prepararRestauracion, DEFAULT_PAPELERA } from '../src/lib/papelera.js';
import { reglaAplicable as reglaMotor } from '../src/lib/motorRecomendaciones.js';
import {
  normalizarRutinaGenerica, checklistGenerico, estadoDelDia,
} from '../src/lib/motorRutinas.js';
import { PALABRAS_CLINICAS as CLINICAS_F13 } from '../src/lib/perfilPiel.js';
import { crearProductoPiel, productosPiel } from '../src/lib/productosPiel.js';
import { elegirPartesBarba, alternarParteBarba, marcarProductoBarba, parteActivaBarba } from '../src/lib/perfilBarba.js';
import {
  PARTE_RUTINAS_BARBA, PARTE_SEGUIMIENTO_BARBA, PASOS_BARBA, pasoBarba,
  FRECUENCIAS_BARBA, frecuenciaBarba, MOMENTOS_BARBA, momentoBarba,
  PLANTILLAS_BARBA, plantillaBarba, plantillasSugeridasBarba, usarPlantillaBarba,
  normalizarRutinaBarba, ESCALA_BARBA, valorBarba, ASPECTOS_BARBA, aspectoBarba,
  MAX_NOTA_BARBA, DEFAULT_RUTINAS_BARBA, normalizarRegistroBarba,
  normalizarRutinasBarba, datosRutinasBarba, rutinasBarba, rutinaBarba,
  crearRutinaBarba, editarRutinaBarba, ordenarPasosBarba, asignarProductoBarba,
  alternarFavoritaBarba, alternarRecordatorioBarba, impactoEliminarRutinaBarba,
  eliminarRutinaBarba, eliminarRutinaConPapelera, restaurarRutinaBarba, tocaEnFechaBarba, rutinasDeHoyBarba, checklistBarba,
  marcarPasoBarba, omitirPasoBarba, marcarRutinaBarbaEntera, registrarBarba,
  editarRegistroBarba, eliminarRegistroBarba, restaurarRegistroBarba,
  historialBarba, cumplimientoBarba, eventosDeBarba, SUGERENCIAS_BARBA,
  contextoSugerenciasBarba, sugerenciasBarba, resumenRutinasBarba,
  auditarRutinasBarba, textosDeRutinasBarba, panelRutinasBarba, sinDiagnostico,
  PALABRAS_CLINICAS,
} from '../src/lib/rutinasBarba.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';        // viernes
const base = () => elegirPartesBarba(
  configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['barba', 'skincare']),
  ['barba', 'afeitado', 'perfilado', 'productos', 'seguimiento'], { hoy: HOY },
).estado;
const conRutina = (e = base(), datos = {}) => {
  const r = crearRutinaBarba(e, { nombre: 'Mi afeitado', pasos: [{ accion: 'preparar' }, { accion: 'afeitar' }, { accion: 'limpiar' }], frecuencia: 'diaria', ...datos }, { hoy: HOY });
  return { estado: r.estado, rutina: r.rutina };
};

/* ⚠️ Comentarios, textos y auditoría fuera antes de leer el código. Novena vez. */
const fuente = readFileSync(new URL('../src/lib/rutinasBarba.js', import.meta.url), 'utf8');
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarRutinasBarba[\s\S]*?\n}/, '')
  .replace(/'[^'\n]*'/g, "''")
  .replace(/`[^`]*`/g, '``');

/* ── 1 · ⚠️ TODO ESTO YA EXISTÍA ───────────────────────────────────────── */
console.log('\n1 · ⚠️ El motor de rutinas es el de la Fase 14, no una copia');

{
  const a = auditarRutinasBarba(base());
  eq([a.calendariosNuevos, a.papelerasNuevas, a.catalogosNuevos, a.motoresNuevos], [0, 0, 0, 0],
    'Cero calendarios, papeleras, catálogos y motores nuevos');
  eq(a.motorRutinas, 'motorRutinas.js', 'Con el motor de rutinas declarado');
  eq(a.motorReglas, 'motorRecomendaciones.js', 'Y el de reglas');
  eq([a.rachas, a.puntos, a.niveles], [0, 0, 0], '⚠️ Y cero rachas, puntos y niveles (D2-02)');
}
ok(!/function\s+tocaEnFecha\s*\(|function\s+checklistGenerico/.test(codigo),
  '⚠️ Aquí no se reescribe ni `tocaEnFecha` ni el checklist');
/* ⚠️ La misma máquina que Skincare: dos módulos, un normalizador genérico. */
eq(Object.keys(normalizarRutinaBarba({ nombre: 'X' }, 0)).filter((k) => k in normalizarRutinaGenerica({ nombre: 'X' }, 0, { tipoDe: () => false })).length,
  Object.keys(normalizarRutinaGenerica({ nombre: 'X' }, 0, { tipoDe: () => false })).length,
  '⚠️ La rutina de barba tiene TODOS los campos del motor: no es una forma nueva');
ok(normalizarRutinaGenerica({ nombre: 'X' }, 0, { tipoDe: () => false }).recordatorio === false,
  '⚠️ Y el recordatorio nace APAGADO en el motor (apartado 8: "opcional")');

/* ── 2 · PLANTILLAS (apartados 1, 2 y 3) ───────────────────────────────── */
console.log('\n2 · Las plantillas — que se ofrecen, no se imponen');

eq(PLANTILLAS_BARBA.map((p) => p.id), ['afeitado', 'barba', 'perfilado'], 'Las tres del enunciado');
eq(plantillaBarba('afeitado').pasos, ['preparar', 'afeitar', 'limpiar', 'cuidar'],
  'Prueba 2: la de afeitado trae los cuatro pasos del apartado 2');
eq(plantillaBarba('barba').pasos.length, 5, 'Y la de barba, los cinco del apartado 3');

{
  const e = base();
  eq(plantillasSugeridasBarba(e).map((p) => p.id), ['afeitado', 'barba', 'perfilado'],
    'Se ofrecen las tres a quien gestiona las tres cosas');

  /* ⚠️ Y SOLO las de lo que él gestiona (apartado 2 de la F20). */
  const soloBarba = elegirPartesBarba(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['barba']), ['barba'], { hoy: HOY }).estado;
  eq(plantillasSugeridasBarba(soloBarba).map((p) => p.id), ['barba'],
    '⚠️ A quien no se afeita no se le propone una rutina de afeitado');

  /* ⚠️ Ver la plantilla NO la crea: séptimo `aplicarPlan` del proyecto. */
  const antes = JSON.stringify(normalizarEstiloHombre(e));
  plantillasSugeridasBarba(e);
  const sinConfirmar = usarPlantillaBarba(e, 'afeitado', { hoy: HOY });
  eq(sinConfirmar.sinConfirmar, true, '⚠️ Sin `confirmado` NO escribe (séptimo `aplicarPlan`)');
  eq(JSON.stringify(normalizarEstiloHombre(sinConfirmar.estado)), antes, 'Y el estado no cambia ni un byte');
  ok(plantillasSugeridasBarba(e).every((p) => p.guardada === false),
    'Y va escrito en el propio dato: no está guardada');

  const usada = usarPlantillaBarba(e, 'afeitado', { hoy: HOY, confirmado: true });
  eq(usada.rutina.nombre, 'Afeitado', 'Prueba 2: con `confirmado` sí la crea');
  eq(usada.rutina.pasos.length, 4, 'Con sus cuatro pasos');
  eq(usada.rutina.cada, 3, 'Y su frecuencia de la plantilla');
  eq(plantillasSugeridasBarba(usada.estado).map((p) => p.id), ['barba', 'perfilado'],
    '⚠️ Y ya no se vuelve a ofrecer la que ya usó');
  eq(usarPlantillaBarba(e, 'inventada', { confirmado: true }).error, 'Esa plantilla no existe.', 'Una que no existe avisa');
}

/* ── 3 · CREAR, EDITAR Y REORDENAR (apartados 5 y 20) ──────────────────── */
console.log('\n3 · Rutinas personalizadas');

{
  const { estado, rutina } = conRutina();
  eq(rutinasBarba(estado).length, 1, 'Prueba 1: se crea una rutina');
  eq(rutina.nombre, 'Mi afeitado', 'Con su nombre');
  eq(crearRutinaBarba(base(), {}).error, 'La rutina necesita un nombre.', 'Sin nombre no se crea');

  // Prueba 3: editar pasos.
  const ed = editarRutinaBarba(estado, rutina.id, { nombre: 'Otro nombre', pasos: [{ accion: 'afeitar' }] });
  eq(rutinaBarba(ed.estado, rutina.id).nombre, 'Otro nombre', 'Prueba 3: se edita');
  eq(rutinaBarba(ed.estado, rutina.id).pasos.length, 1, 'Y sus pasos');
  eq(editarRutinaBarba(estado, 'x', {}).error, 'Esa rutina no existe.', 'Editar lo que no hay avisa');
  eq(editarRutinaBarba(estado, rutina.id, { nombre: '  ' }).error, 'La rutina necesita un nombre.', 'Ni dejarla sin nombre');

  // Prueba 4: reordenarlos.
  const ids = rutina.pasos.map((p) => p.id);
  const ord = ordenarPasosBarba(estado, rutina.id, [ids[2], ids[0], ids[1]]);
  eq(rutinaBarba(ord.estado, rutina.id).pasos.map((p) => p.accion), ['limpiar', 'preparar', 'afeitar'],
    'Prueba 4: se reordenan los pasos');
  const parcial = ordenarPasosBarba(estado, rutina.id, [ids[2]]);
  eq(rutinaBarba(parcial.estado, rutina.id).pasos.length, 3,
    '⚠️ Y reordenar a medias no pierde ninguno: los que faltan se quedan detrás');
  eq(ordenarPasosBarba(estado, 'x', []).error, 'Esa rutina no existe.', 'Sobre lo que no hay, avisa');
}

/* ── 4 · PRODUCTOS DEL CATÁLOGO GLOBAL (apartado 13) ───────────────────── */
console.log('\n4 · ⚠️ Los productos son los del catálogo global');

{
  let e = crearProductoPiel(base(), { nombre: 'Espuma', categoria: 'barba' }, { hoy: HOY }).estado;
  const pid = productosPiel(e)[0].id;
  e = marcarProductoBarba(e, pid).estado;
  const { estado, rutina } = conRutina(e);

  const asig = asignarProductoBarba(estado, rutina.id, rutina.pasos[0].id, pid);
  eq(rutinaBarba(asig.estado, rutina.id).pasos[0].productoId, pid, 'Prueba 5: se asocia un producto a un paso');
  eq(checklistBarba(asig.estado, rutina.id, { hoy: HOY }).pasos[0].producto, 'Espuma',
    'Y el checklist lo enseña por su nombre');
  eq(productosPiel(asig.estado).length, 1, '⚠️ Prueba 13: sin duplicar el producto en ningún sitio');
  eq(asignarProductoBarba(estado, rutina.id, rutina.pasos[0].id, 'no-existe').error, 'Ese producto no existe.',
    '⚠️ Y no se puede asociar uno que no está en el catálogo: aquí no se crean productos');
  eq(asignarProductoBarba(estado, 'x', 'y', null).error, 'Esa rutina no existe.', 'Sobre lo que no hay, avisa');
  eq(rutinaBarba(asignarProductoBarba(asig.estado, rutina.id, rutina.pasos[0].id, null).estado, rutina.id).pasos[0].productoId,
    null, 'Y se puede desasociar');
  ok(!/crearProducto|nuevoProducto/.test(codigo), '⚠️ Y en el código no hay ninguna función que cree un producto');
}

/* ── 5 · FRECUENCIA Y CHECKLIST (apartados 4, 6 y 7) ───────────────────── */
console.log('\n5 · Frecuencias, checklist y omitir');

eq(FRECUENCIAS_BARBA.filter((f) => f.tipo === 'cada_x').map((f) => f.cada), [3, 7, 14],
  '⚠️ Las cuatro del apartado 4 son las que ya sabe hacer el motor: cada 3, 7 y 14 días');
eq(frecuenciaBarba('personalizado').tipo, 'ninguna', 'Y "Personalizado" no toca sola');
ok(!/function\s+cadaCuantos|diasEntre\s*=/.test(codigo),
  '⚠️ Y no hay un tercer mecanismo de "cada cuánto" en el proyecto');

{
  const { estado, rutina } = conRutina();
  eq(tocaEnFechaBarba(rutina, HOY), true, 'Una rutina diaria toca hoy');
  eq(rutinasDeHoyBarba(estado, { hoy: HOY }).length, 1, 'Y sale en las de hoy');

  const lista = checklistBarba(estado, rutina.id, { hoy: HOY });
  eq(lista.pasos.map((p) => p.etiqueta), ['Preparar', 'Afeitar', 'Limpiar'], 'Prueba 8: el checklist, con sus pasos');
  eq(lista.estado, 'pendiente', '⚠️ Y sin tocar nada está "Pendiente", nunca "has fallado"');

  const uno = marcarPasoBarba(estado, rutina.id, rutina.pasos[0].id, { hoy: HOY });
  eq(checklistBarba(uno, rutina.id, { hoy: HOY }).estado, 'a_medias', 'Con uno marcado, a medias');
  const dos = marcarPasoBarba(uno, rutina.id, rutina.pasos[1].id, { hoy: HOY });

  /* ⚠️ Prueba 9 — OMITIR ES UNA TERCERA COSA, y sale de la cuenta. */
  const omitido = omitirPasoBarba(dos, rutina.id, rutina.pasos[2].id, { hoy: HOY });
  const conOmit = checklistBarba(omitido, rutina.id, { hoy: HOY });
  eq(conOmit.estado, 'hecha',
    '⚠️ Prueba 9: dos hechos y uno OMITIDO es una rutina HECHA — "sin penalización"');
  eq(conOmit.omitidos, 1, 'Y consta que uno se omitió');
  eq(conOmit.pasos[2].hecho, false, 'Sin marcarlo como hecho: omitir no es hacer');
  eq(checklistBarba(omitirPasoBarba(omitido, rutina.id, rutina.pasos[2].id, { hoy: HOY }), rutina.id, { hoy: HOY }).omitidos, 0,
    'Y se puede deshacer');

  const todo = marcarRutinaBarbaEntera(estado, rutina.id, { hoy: HOY });
  eq(checklistBarba(todo, rutina.id, { hoy: HOY }).estado, 'hecha', 'Y se puede marcar entera de una vez');
  eq(checklistBarba(estado, 'no-existe', { hoy: HOY }), null, 'El checklist de lo que no hay es `null`, no una pantalla rota');
}

/* ⚠️ Apagar las rutinas las esconde, pero no las borra. */
{
  const { estado, rutina } = conRutina();
  const apagado = alternarParteBarba(estado, PARTE_RUTINAS_BARBA);
  eq(rutinasDeHoyBarba(apagado, { hoy: HOY }), [], 'Con el afeitado apagado no salen las de hoy');
  eq(rutinasBarba(apagado).length, 1, '⚠️ Prueba 15: pero la rutina sigue guardada');
  eq(panelRutinasBarba(apagado, { hoy: HOY }).activo, false, 'Y el panel lo dice');
  eq(rutinasBarba(alternarParteBarba(apagado, PARTE_RUTINAS_BARBA))[0].nombre, rutina.nombre,
    'Prueba 16: y al reactivar sigue estando');
}

/* ── 6 · RECORDATORIOS (apartado 8) ────────────────────────────────────── */
console.log('\n6 · Recordatorios — nunca automáticos');

{
  const { estado, rutina } = conRutina();
  eq(rutina.recordatorio, false, '⚠️ Prueba 7: nace APAGADO, siempre');
  const con = alternarRecordatorioBarba(estado, rutina.id);
  eq(rutinaBarba(con.estado, rutina.id).recordatorio, true, 'Y lo enciende él');
  eq(rutinaBarba(alternarRecordatorioBarba(con.estado, rutina.id).estado, rutina.id).recordatorio, false, 'Y lo apaga');
  eq(alternarRecordatorioBarba(estado, 'x').error, 'Esa rutina no existe.', 'Sobre lo que no hay, avisa');
  ok(!/recordatorio:\s*true/.test(codigo), '⚠️ Y en ninguna parte se enciende solo');
}

/* ── 7 · ⚠️ EL CALENDARIO GENERAL (apartado 14) ────────────────────────── */
console.log('\n7 · ⚠️ Nunca un calendario de barba');

{
  const { estado, rutina } = conRutina();
  eq(eventosDeBarba(estado, HOY, '2026-08-30'), [],
    '⚠️ Sin recordatorio NO se pone nada en el calendario: es él quien decide');

  const con = alternarRecordatorioBarba(estado, rutina.id).estado;
  const eventos = eventosDeBarba(con, HOY, '2026-08-30');
  eq(eventos.length, 3, 'Prueba 12: con recordatorio, sale en los tres días');
  eq(eventos[0].origen, 'barba', 'Con su origen, en la convención de `pelo` y `piel`');
  eq(eventos[0].soloLectura, true, '⚠️ Y de SOLO LECTURA: el calendario no es su dueño (regla 11)');
  ok(eventos[0].titulo.includes(rutina.nombre), 'Y con el nombre de la rutina');
  /* ⚠️ Y NO se materializa: es una función de lectura. */
  const antes = JSON.stringify(normalizarEstiloHombre(con));
  eventosDeBarba(con, HOY, '2026-12-31');
  eq(JSON.stringify(normalizarEstiloHombre(con)), antes,
    '⚠️ Y pedir los eventos NO guarda ni una ocurrencia (regla 11)');
  eq(eventosDeBarba(con, null, null), [], 'Sin rango, ninguno');
}

/* ── 8 · SEGUIMIENTO (apartados 9, 10 y 11) ────────────────────────────── */
console.log('\n8 · Seguimiento — y todo dentro es opcional');

eq(ESCALA_BARBA.map((x) => x.nombre), ['Muy bien', 'Bien', 'Normal', 'Mal'], 'Las cuatro caritas del apartado 9');
eq(ASPECTOS_BARBA.map((a) => a.id), ['comodidad', 'resultado', 'irritacion', 'facilidad'],
  'Y los cuatro aspectos del apartado 10');
ok(ASPECTOS_BARBA.find((a) => a.id === 'irritacion').nombre.includes('percibida'),
  '⚠️ "Irritación PERCIBIDA": es lo que él dice, no lo que la app decide');

{
  const { estado, rutina } = conRutina();
  const r = registrarBarba(estado, { rutinaId: rutina.id, como: 'muy_bien', aspectos: { comodidad: 5, resultado: 4 } }, { hoy: HOY });
  eq(r.error, null, 'Prueba 10: se registra cómo ha ido');
  eq(datosRutinasBarba(r.estado).registros.length, 1, 'Y se guarda');
  eq(r.registro.fecha, HOY, 'Con la fecha de hoy');

  // ⚠️ Todo es opcional: solo una nota basta.
  eq(registrarBarba(estado, { nota: 'Prefiero por la noche' }, { hoy: HOY }).error, null,
    'Prueba 11: solo una nota también vale');
  // Pero un registro vacío no.
  ok(registrarBarba(estado, {}, { hoy: HOY }).error, '⚠️ Y uno vacío no se guarda: sería una fila en blanco');

  eq(normalizarRegistroBarba({ fecha: HOY, aspectos: { comodidad: 9 } }).aspectos, {}, 'Un 9 no es de 1 a 5');
  eq(normalizarRegistroBarba({ fecha: HOY, aspectos: { comodidad: 0 } }).aspectos, {},
    '⚠️ Ni un 0: `Number(null)` es 0 y `Number.isInteger(0)` es `true`');
  eq(normalizarRegistroBarba({}), null, 'Sin fecha no hay registro');
  eq(normalizarRegistroBarba({ fecha: HOY, nota: 'x'.repeat(400) }).nota.length, MAX_NOTA_BARBA, 'Y la nota tiene tope');

  const ed = editarRegistroBarba(r.estado, r.registro.id, { como: 'bien' });
  eq(datosRutinasBarba(ed.estado).registros[0].como, 'bien', 'Se puede editar');
  eq(editarRegistroBarba(r.estado, 'x', {}).error, 'Ese registro no existe.', 'Sobre lo que no hay, avisa');
}

/* ⚠️ Prueba 14 — desactivar SOLO el seguimiento, sin perder la rutina. */
{
  const { estado, rutina } = conRutina();
  const sinSeg = alternarParteBarba(estado, PARTE_SEGUIMIENTO_BARBA);
  ok(registrarBarba(sinSeg, { como: 'bien' }, { hoy: HOY }).error,
    'Prueba 14: con el seguimiento apagado no se registra');
  eq(rutinasBarba(sinSeg).length, 1, '⚠️ Pero la RUTINA sigue ahí (apartado 17)');
  eq(parteActivaBarba(sinSeg, PARTE_RUTINAS_BARBA), true, 'Y el afeitado sigue encendido: son independientes');
  eq(checklistBarba(sinSeg, rutina.id, { hoy: HOY }).pasos.length, 3, 'Y su checklist funciona igual');
}

/* ── 9 · HISTORIAL (apartado 12) ───────────────────────────────────────── */
console.log('\n9 · El historial — sencillo, sin medias ni rachas');

{
  let { estado, rutina } = conRutina();
  estado = registrarBarba(estado, { rutinaId: rutina.id, fecha: '2026-08-23', aspectos: { comodidad: 5, resultado: 5 } }, { hoy: HOY }).estado;
  estado = registrarBarba(estado, { rutinaId: rutina.id, fecha: '2026-08-18', aspectos: { comodidad: 4 } }, { hoy: HOY }).estado;
  estado = registrarBarba(estado, { fecha: '2026-08-10', nota: 'Sin valorar' }, { hoy: HOY }).estado;

  const h = historialBarba(estado);
  eq(h.map((x) => x.fecha), ['2026-08-23', '2026-08-18', '2026-08-10'], 'Prueba 11: lo más reciente primero');
  eq(h[0].estrella, 5, 'Con su estrella, que es la media de lo que ÉL puntuó');
  eq(h[1].estrella, 4, 'Y con una sola valoración, esa');
  eq(h[2].estrella, null, '⚠️ Y sin valorar NO hay estrella: `null`, nunca un 0');
  eq(h[0].que, 'Mi afeitado', 'Y qué fue');
  ok(!/racha|promedio|porcentaje/i.test(codigo), '⚠️ Ni rachas, ni promedios, ni porcentajes en el historial');

  /* ⚠️ Sin días en los que tocara NO hay cumplimiento, ni 0 ni 100. */
  const c = cumplimientoBarba(estado, { hoy: HOY });
  ok(c[0].cumplimiento === null || Number.isInteger(c[0].cumplimiento), 'El cumplimiento es un número o `null`');
  const nunca = crearRutinaBarba(base(), { nombre: 'Nunca', frecuencia: 'personalizado' }, { hoy: HOY }).estado;
  eq(cumplimientoBarba(nunca, { hoy: HOY })[0].cumplimiento, null,
    '⚠️ Una rutina que no toca nunca NO tiene 0 %: tiene `null`');
}

/* ── 10 · ⚠️ ELIMINAR: LA PAPELERA GLOBAL (apartado 19) ────────────────── */
console.log('\n10 · ⚠️ Ni una papelera propia');

ok(CATALOGO_PAPELERA['barba.rutinas'], '⚠️ Las rutinas de barba entran en la papelera GLOBAL');
ok(CATALOGO_PAPELERA['barba.registros'], 'Y sus registros');
/* ⚠️ Y lo que se comprueba es que USA la global, no que no la nombre: importar
   `prepararEliminacion` es exactamente lo correcto. Décima vez que una
   comprobación de este proyecto iba a saltar con la evidencia honesta. */
ok(/from '\.\/papelera'/.test(fuente), '⚠️ Y usa el motor de la papelera global, el de ME F3');
ok(!/DEFAULT_PAPELERA\s*=|function\s+prepararEliminacion/.test(codigo),
  'Sin construir ninguna propia: son dos líneas de catálogo y ya');

{
  let { estado, rutina } = conRutina();
  estado = registrarBarba(estado, { rutinaId: rutina.id, como: 'bien' }, { hoy: HOY }).estado;
  estado = marcarPasoBarba(estado, rutina.id, rutina.pasos[0].id, { hoy: HOY });

  // ⚠️ Antes de borrar, se dice qué se lleva.
  const imp = impactoEliminarRutinaBarba(estado, rutina.id);
  ok(imp && imp.registros === 1 && /1 día registrado/.test(imp.texto),
    '⚠️ Antes de borrar se dice qué se lleva por delante, con la cuenta exacta');

  const del = eliminarRutinaBarba(estado, rutina.id);
  eq(rutinasBarba(del.estado).length, 0, 'Prueba 17: se elimina la rutina');
  eq(datosRutinasBarba(del.estado).hechos.length, 0, 'Y sus marcas se van con ella');
  eq(datosRutinasBarba(del.estado).registros.length, 1,
    '⚠️ PERO EL REGISTRO NO: "23/08 — Afeitado ⭐ 5/5" pasó, y borrar la rutina no reescribe la historia');
  eq(datosRutinasBarba(del.estado).registros[0].rutinaId, null, 'Solo se queda sin su rutina');
  eq(eliminarRutinaBarba(base(), 'x').error, 'Esa rutina no existe.', 'Borrar lo que no hay avisa');

  // El registro sí pasa por la papelera, y vuelve.
  const reg = datosRutinasBarba(del.estado).registros[0];
  const quitado = eliminarRegistroBarba(del.estado, reg.id);
  eq(datosRutinasBarba(quitado.estado).registros.length, 0, 'Un registro se elimina');
  ok(quitado.entrada && quitado.entrada.modulo === 'barba' && quitado.entrada.coleccion === 'registros',
    '⚠️ Y sale como ENTRADA DE LA PAPELERA GLOBAL, con la forma que usa ME F3');
  const vuelto = restaurarRegistroBarba(quitado.estado, quitado.entrada);
  eq(datosRutinasBarba(vuelto.estado).registros.length, 1, 'Prueba 17: y se puede recuperar');
  eq(restaurarRegistroBarba(vuelto.estado, quitado.entrada).yaExistia, true, 'Restaurarlo dos veces no lo duplica');
  eq(eliminarRegistroBarba(del.estado, 'x').error, 'Ese registro no existe.', 'Sobre lo que no hay, avisa');
}

/* ⚠️ Y una RUTINA eliminada también vuelve de la papelera global. */
{
  let { estado, rutina } = conRutina();
  estado = registrarBarba(estado, { rutinaId: rutina.id, como: 'bien' }, { hoy: HOY }).estado;
  const quitada = eliminarRutinaConPapelera(estado, rutina.id);
  eq(rutinasBarba(quitada.estado).length, 0, 'Una rutina se elimina a la papelera');
  ok(quitada.entrada && quitada.entrada.coleccion === 'rutinas', 'Con la forma de la papelera global');
  eq(datosRutinasBarba(quitada.estado).registros[0].rutinaId, null,
    '⚠️ Y sus registros se quedan, huérfanos: la historia no se reescribe');
  const devuelta = restaurarRutinaBarba(quitada.estado, quitada.entrada);
  eq(rutinasBarba(devuelta.estado).length, 1, 'Prueba 17: y vuelve entera');
  eq(rutinasBarba(devuelta.estado)[0].nombre, rutina.nombre, 'Con su nombre');
  eq(eliminarRutinaConPapelera(base(), 'x').error, 'Esa rutina no existe.', 'Sobre lo que no hay, avisa');
}

/* ── 11 · FAVORITAS (apartado 16) ──────────────────────────────────────── */
console.log('\n11 · Guardar como favorita');

{
  const { estado, rutina } = conRutina();
  eq(rutina.favorita, false, 'Nace sin serlo');
  const fav = alternarFavoritaBarba(estado, rutina.id);
  eq(rutinaBarba(fav.estado, rutina.id).favorita, true, 'Prueba 6: se guarda como favorita');
  eq(resumenRutinasBarba(fav.estado, { hoy: HOY }).favoritas, 1, 'Y consta en el resumen');
  eq(alternarFavoritaBarba(estado, 'x').error, 'Esa rutina no existe.', 'Sobre lo que no hay, avisa');
}

/* ── 12 · SUGERENCIAS (apartado 15) ────────────────────────────────────── */
console.log('\n12 · Sugerencias — con el motor de la Fase 16, y sin diagnosticar');

SUGERENCIAS_BARBA.forEach((s) => {
  ok(Array.isArray(s.requiere) && s.requiere.length > 0,
    `⚠️ La regla "${s.id}" declara sus requisitos: sin ellos NO se aplicaría nunca`);
});
ok(!reglaMotor({ requiere: [], cuando: () => true }, {}), 'Y el motor lo comprueba de verdad');
ok(!/function\s+reglaAplicable/.test(codigo), 'Aquí no se reescribe el motor de reglas');

{
  let { estado, rutina } = conRutina();
  // Sin nada, la sugerencia de registrar.
  eq(sugerenciasBarba(estado, { hoy: HOY }).map((s) => s.id), ['sin_registros'],
    'Con rutinas y sin registros, se sugiere registrar');

  for (let i = 0; i < 3; i += 1) {
    estado = registrarBarba(estado, { rutinaId: rutina.id, fecha: `2026-08-2${i}`, como: 'bien' }, { hoy: HOY }).estado;
  }
  const s = sugerenciasBarba(estado, { hoy: HOY });
  ok(s.some((x) => x.id === 'guardar_habitual'),
    'Prueba 12: con tres registros de la misma, se sugiere guardarla como habitual');
  ok(s.find((x) => x.id === 'guardar_habitual').rutina?.id === rutina.id, 'Diciendo cuál');
  ok(s.every((x) => x.aplicada === false), '⚠️ Y ninguna hace nada sola: va escrito en el dato');

  // ⚠️ Y una vez favorita, ya no se sugiere.
  const fav = alternarFavoritaBarba(estado, rutina.id).estado;
  ok(!sugerenciasBarba(fav, { hoy: HOY }).some((x) => x.id === 'guardar_habitual'),
    'Y una vez guardada, deja de sugerirse');

  // ⚠️ Calcular sugerencias no escribe nada.
  const antes = JSON.stringify(normalizarEstiloHombre(estado));
  sugerenciasBarba(estado, { hoy: HOY });
  eq(JSON.stringify(normalizarEstiloHombre(estado)), antes, '⚠️ Y calcularlas no escribe ni un byte');
  eq(sugerenciasBarba(alternarParteBarba(estado, PARTE_RUTINAS_BARBA), { hoy: HOY }), [],
    'Con las rutinas apagadas, ninguna');
}

/* ⚠️ *"No recomendar tratamientos médicos."* */
eq(PALABRAS_CLINICAS, CLINICAS_F13, 'La lista de palabras clínicas es la de la Fase 13');
textosDeRutinasBarba().forEach((t) => {
  if (!sinDiagnostico(t)) ok(false, `⚠️ Texto con palabra clínica: "${t}"`);
});
ok(textosDeRutinasBarba().includes('Pendiente'),
  '⚠️ Y el barrido incluye de verdad las etiquetas del día: son textos, no objetos');
ok(textosDeRutinasBarba().every(sinDiagnostico),
  `⚠️ Los ${textosDeRutinasBarba().length} textos de esta fase, sin una sola palabra clínica`);
eq(auditarRutinasBarba(base()).listasClinicasNuevas, 0, 'Y cero listas nuevas');

/* ── 13 · EL NORMALIZADOR Y EL PANEL ───────────────────────────────────── */
console.log('\n13 · ⚠️ El normalizador conoce sus tres campos');

['rutinas', 'hechos', 'registros'].forEach((c) => ok(c in DEFAULT_RUTINAS_BARBA, `\`${c}\` está en el DEFAULT`));

{
  let { estado, rutina } = conRutina();
  estado = registrarBarba(estado, { rutinaId: rutina.id, como: 'bien', nota: 'Una nota' }, { hoy: HOY }).estado;
  estado = alternarFavoritaBarba(estado, rutina.id).estado;
  estado = marcarPasoBarba(estado, rutina.id, rutina.pasos[0].id, { hoy: HOY });

  const ida = normalizarRutinasBarba(datosRutinasBarba(estado));
  const vuelta = normalizarRutinasBarba(JSON.parse(JSON.stringify(ida)));
  eq(vuelta.registros.length, 1, '⚠️ Los REGISTROS sobreviven a dos normalizaciones seguidas');
  eq(vuelta.registros[0].nota, 'Una nota', 'Con su nota');
  eq(vuelta.rutinas[0].favorita, true, 'Y "favorita" también');
  eq(vuelta.rutinas[0].momento, 'cualquiera', 'Y el momento');
  eq(vuelta.hechos.length, 1, 'Y lo hecho');
  eq(normalizarRutinasBarba(null).rutinas, [], 'Sin nada guardado, vacío');
  eq(normalizarRutinaBarba({ nombre: 'X', hora: '25:99' }, 0).hora, null,
    '⚠️ Y `25:99` no es una hora: la forma no basta (el fallo de F11)');
  eq(normalizarRutinaBarba({ nombre: 'X', momento: 'inventado' }, 0).momento, 'cualquiera', 'Ni un momento inventado');
}

{
  const { estado } = conRutina();
  const p = panelRutinasBarba(estado, { hoy: HOY });
  eq(p.activo, true, 'El panel sabe si está activo');
  eq(p.hoy.length, 1, 'Trae lo de hoy');
  eq(p.rutinas.length, 1, 'Y las rutinas');
  ok(Array.isArray(p.plantillas) && Array.isArray(p.sugerencias), 'Y las plantillas y sugerencias');
  const r = resumenRutinasBarba(estado, { hoy: HOY });
  eq(r.ultimo, null, '⚠️ Sin registros no hay "último": `null`, nunca una fecha inventada');
  eq([r.rutinas, r.hoy, r.registros], [1, 1, 0], 'Y el resumen cuadra');
}

/* ── 14 · REGLA 8 ──────────────────────────────────────────────────────── */
console.log('\n14 · Regla 8: nada simulado');

ok(!/proximamente|próximamente|en construcción|TODO:/i.test(fuente), 'Ni un "próximamente" ni un TODO');
ok(!/Math\.random/.test(codigo), 'Ni una cifra inventada');
ok(!/askAI|anthropic|claude|fetch\(/i.test(codigo), '⚠️ Sin IA: ni una llamada');
eq(auditarRutinasBarba(base()).usaIA, 0, 'Declarado');

if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
console.log(`\n  ${n} comprobaciones correctas.`);
