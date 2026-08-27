// ============================================================================
// EH · Fase 8/65 — PRUEBAS
//
// El apartado 18 lista trece comprobaciones. Están las trece, y las tres que más
// importan no saltan solas:
//
//   - **No castigar** (apartado 7): hay una prueba que recorre TODOS los textos
//     generados en el peor escenario —un mes sin hacer nada— buscando reproches.
//   - **Nada materializado** (apartado 17 + regla 11): una rutina "cada 3 días"
//     no puede guardar cien fechas.
//   - **Ni un contador guardado**: todo se deriva del historial.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { MODULO_PELO, contestarPelo } from '../src/lib/perfilCapilar.js';
import {
  PLAQUITAS_PELO, PARTES_PELO, IDS_PARTES, DEFAULT_PELO, ACCIONES_PELO, accionPelo,
  FRECUENCIAS_PELO, frecuenciaPelo, COMO_LO_NOTAS, normalizarPelo, datosPelo,
  parteActiva, alternarParte,
  crearRutina, editarRutina, impactoEliminarRutina, eliminarRutina, ordenarPasos,
  tocaEnFecha, rutinasDeHoy, checklistDelDia, ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA,
  marcarPaso, marcarRutinaEntera,
  DIAS_HISTORIAL, historialPelo, registrarCambio, cambiosPelo,
  anadirProducto, editarProducto, eliminarProducto, asignarProducto,
  baseParaRecomendar, eventosDePelo, resumenPelo, auditarPelo,
} from '../src/lib/rutinasPelo.js';
import { addDays } from '../src/lib/helpers.js';

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

const HOY = '2026-08-27';               // jueves
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);

const conRutina = (opts = {}) => {
  const r = crearRutina(base(), {
    nombre: 'Rutina de lavado',
    pasos: [
      { accion: 'lavado', nombre: 'Champú' },
      { accion: 'acondicionador' },
      { accion: 'hidratacion' },
    ],
    frecuencia: 'cada_x',
    cada: 3,
    duracion: 10,
    ...opts,
  }, { hoy: HOY });
  return { estado: r.estado, id: r.rutina.id, pasos: r.rutina.pasos.map((p) => p.id) };
};

/* ── 1 · EL PANEL (apartado 1) ───────────────────────────────────────────── */

eq(PLAQUITAS_PELO.length, 5, 'Las cinco plaquitas del apartado 1');
eq(PLAQUITAS_PELO.map((p) => p.nombre),
  ['Mi pelo', 'Mi rutina', 'Seguimiento', 'Recomendaciones', 'Peluquería'], 'Con sus nombres literales');
eq(PLAQUITAS_PELO.filter((p) => p.listo).length, 3, 'Tres funcionan hoy');
ok(PLAQUITAS_PELO.filter((p) => !p.listo).every((p) => p.fase > 8),
  '⚠️ Y las dos que no, dicen en qué fase llegan — regla 8, no "próximamente"');
eq(PLAQUITAS_PELO.find((p) => p.id === 'peluqueria').fase, 11, 'Peluquería, en la fase 11');

/* ── 2 · LAS PARTES (apartados 15 y 16) ──────────────────────────────────── */

eq(IDS_PARTES, ['rutinas', 'seguimiento', 'recomendaciones', 'recordatorios'], 'Las cuatro del enunciado');
ok(parteActiva(base(), 'rutinas'), 'Rutinas viene encendida');
ok(!parteActiva(base(), 'recordatorios'),
  '⚠️ Apartado 5: recordatorios nace APAGADO — "nunca deben ser obligatorios"');
eq(PARTES_PELO.filter((p) => !p.porDefecto).map((p) => p.id), ['recordatorios'],
  'Y es la única que empieza apagada, como la dibuja el enunciado');

const sinSeguimiento = alternarParte(conRutina().estado, 'seguimiento');
ok(!parteActiva(sinSeguimiento, 'seguimiento'), 'Se puede apagar una parte');
eq(datosPelo(sinSeguimiento).rutinas.length, 1, '⚠️ Apartado 16: y sus datos NO se borran');
ok(parteActiva(alternarParte(sinSeguimiento, 'seguimiento'), 'seguimiento'), 'Y se vuelve a encender');
eq(datosPelo(alternarParte(sinSeguimiento, 'seguimiento')).rutinas.length, 1, 'Con todo dentro');
eq(datosPelo(alternarParte(base(), 'inventada')).rutinas.length, 0, 'Una parte que no existe no hace nada');

/* ── 3 · CREAR, EDITAR Y ELIMINAR (apartados 2, 3 y 14) ─────────────────── */

const { estado: e1, id, pasos } = conRutina();
eq(datosPelo(e1).rutinas.length, 1, 'Crear rutina');
eq(datosPelo(e1).rutinas[0].nombre, 'Rutina de lavado', 'Con su nombre');
eq(datosPelo(e1).rutinas[0].pasos.length, 3, 'Y sus tres pasos');
eq(datosPelo(e1).rutinas[0].duracion, 10, 'Y su duración');
eq(datosPelo(e1).rutinas[0].pasos[0].nombre, 'Champú', 'Un paso puede llevar su propio nombre');
ok(datosPelo(e1).rutinas[0].activa, 'Y nace activa');
ok(!datosPelo(e1).rutinas[0].recordatorio, '⚠️ Pero SIN recordatorio (apartado 5)');

// *"No imponer ninguna rutina predeterminada."*
eq(datosPelo(base()).rutinas, [], '⚠️ Apartado 2: de partida NO hay ninguna rutina impuesta');
const fuente = readFileSync(new URL('../src/lib/rutinasPelo.js', import.meta.url), 'utf8');
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/* ⚠️ Y para los barridos de "esto NO existe" hay que quitar también
   `auditarPelo`, que es justo la función que declara los ceros: `fotos: 0` y
   `xp: 0` son la PRUEBA de que no hay fotos ni gamificación, no una infracción.
   Una comprobación que caza su propia evidencia lleva a borrar la evidencia. */
const codigoSinAuditoria = codigo.replace(/export function auditarPelo[\s\S]*?\n}/, '');
ok(!/PLANTILLAS?_RUTINA|RUTINAS_POR_DEFECTO/.test(codigo), 'Y no hay plantillas escondidas');

const editada = editarRutina(e1, id, { nombre: 'Otra', frecuencia: 'diaria' }).estado;
eq(datosPelo(editada).rutinas[0].nombre, 'Otra', 'Apartado 14: editarla');
eq(datosPelo(editada).rutinas[0].frecuencia, 'diaria', 'Y cambiar la frecuencia');
eq(datosPelo(editada).rutinas[0].pasos.length, 3, '⚠️ Sin perder los pasos');
ok(editarRutina(e1, 'noexiste', {}).error !== null, 'Editar una que no existe se rechaza');

// ⚠️ Borrar se lleva el historial, y se dice ANTES.
const conHecho = marcarPaso(e1, id, pasos[0], { hoy: HOY }).estado;
const imp = impactoEliminarRutina(conHecho, id);
ok(imp.existe, 'El impacto se puede consultar');
eq(imp.registros, 1, 'Con cuántos registros se lleva');
ok(imp.texto.includes('1 día registrado'), '⚠️ Y se dice antes de borrar, no después');
ok(impactoEliminarRutina(e1, id).texto.includes('Se borrará'), 'Sin registros, la frase es más corta');
ok(!impactoEliminarRutina(base(), 'noexiste').existe, 'Y de una que no existe, nada');

const borrada = eliminarRutina(conHecho, id).estado;
eq(datosPelo(borrada).rutinas.length, 0, 'Eliminarla');
eq(datosPelo(borrada).hechos.length, 0, '⚠️ Y su historial se va con ella: no quedan registros huérfanos');
ok(eliminarRutina(base(), 'noexiste').error !== null, 'Borrar una que no existe se rechaza');

// El orden de los pasos.
const reordenada = ordenarPasos(e1, id, [pasos[2], pasos[0]]).estado;
eq(datosPelo(reordenada).rutinas[0].pasos.map((p) => p.id), [pasos[2], pasos[0], pasos[1]],
  '⚠️ Apartado 14: se reordena, y el que no viene en el orden se queda DETRÁS, no desaparece');
ok(ordenarPasos(e1, 'noexiste', []).error !== null, 'Reordenar una que no existe se rechaza');

/* ── 4 · ⚠️ FRECUENCIAS DERIVADAS, NADA MATERIALIZADO (apartados 4 y 17) ── */

eq(FRECUENCIAS_PELO.length, 5, 'Las cinco frecuencias del apartado 4');
eq(frecuenciaPelo('cada_x').nombre, 'Cada X días', 'Con sus nombres');
eq(frecuenciaPelo('inventada'), null, 'Una que no existe devuelve null');

const cada3 = datosPelo(e1).rutinas[0];
ok(tocaEnFecha(cada3, HOY), 'Cada 3 días: toca el día que empezó');
ok(!tocaEnFecha(cada3, '2026-08-28'), 'No al día siguiente');
ok(tocaEnFecha(cada3, '2026-08-30'), 'Sí tres días después');
ok(tocaEnFecha(cada3, '2026-09-02'), 'Y seis');
ok(!tocaEnFecha(cada3, '2026-08-20'), '⚠️ Y NUNCA antes de empezar');

const diaria = { ...cada3, frecuencia: 'diaria' };
ok(tocaEnFecha(diaria, '2026-09-15'), 'La diaria toca siempre');
const jueves = { ...cada3, frecuencia: 'semanal', dias: [4] };
ok(tocaEnFecha(jueves, HOY), 'La semanal toca su día (jueves)');
ok(!tocaEnFecha(jueves, '2026-08-28'), 'Y no el resto');
ok(!tocaEnFecha({ ...cada3, frecuencia: 'personalizada' }, HOY),
  '⚠️ La personalizada NO toca sola: es una rutina que él hace cuando quiere');
ok(!tocaEnFecha({ ...cada3, activa: false }, HOY), 'Una rutina apagada no toca nunca');

// ⚠️ La prueba que de verdad importa: nada materializado.
eq(datosPelo(e1).rutinas[0].cada, 3, 'La rutina guarda SU REGLA');
ok(!('fechas' in datosPelo(e1).rutinas[0]) && !('ocurrencias' in datosPelo(e1).rutinas[0]),
  '⚠️ Regla 11: y NO una lista de fechas');
eq(auditarPelo(e1).ocurrenciasGuardadas, 0, '⚠️ Cero ocurrencias guardadas');
const anio = eventosDePelo(e1, { desde: HOY, hasta: '2027-08-27' });
ok(anio.length > 100, 'Un año da más de cien eventos derivados…');
eq(JSON.stringify(normalizarEstiloHombre(e1)).length < 3000, true,
  '⚠️ …y el estado guardado sigue siendo diminuto, porque no se guarda ninguno');

/* ── 5 · CHECKLIST DEL DÍA (apartado 6) ──────────────────────────────────── */

eq(rutinasDeHoy(e1, { hoy: HOY }).length, 1, 'Hoy toca una');
eq(rutinasDeHoy(e1, { hoy: '2026-08-28' }).length, 0, 'Mañana ninguna');
eq(rutinasDeHoy(alternarParte(e1, 'rutinas'), { hoy: HOY }).length, 0,
  'Con las rutinas apagadas, ninguna');

const lista = checklistDelDia(e1, id, { hoy: HOY });
eq(lista.pasos.length, 3, 'La lista del día trae los tres pasos');
eq(lista.pasos[0].etiqueta, 'Champú', 'Con el nombre que él puso');
eq(lista.pasos[1].etiqueta, 'Acondicionador', 'O el del catálogo si no puso ninguno');
ok(lista.pasos.every((p) => p.icono), 'Cada uno con su icono');
ok(lista.pasos.every((p) => !p.hecho), 'Ninguno hecho todavía');
eq(lista.estado, 'pendiente', '⚠️ Y el estado es "pendiente", no "fallida"');
eq(checklistDelDia(e1, 'noexiste'), null, 'De una rutina que no existe, null');

const unPaso = marcarPaso(e1, id, pasos[0], { hoy: HOY }).estado;
eq(checklistDelDia(unPaso, id, { hoy: HOY }).hechos, 1, 'Marcar un paso');
eq(checklistDelDia(unPaso, id, { hoy: HOY }).estado, 'a_medias', 'Y el estado lo dice');
eq(checklistDelDia(marcarPaso(unPaso, id, pasos[0], { hoy: HOY }).estado, id, { hoy: HOY }).hechos, 0,
  'Volver a tocarlo lo desmarca');
eq(datosPelo(marcarPaso(unPaso, id, pasos[0], { hoy: HOY }).estado).hechos.length, 0,
  '⚠️ Y sin nada marcado no queda un registro vacío rondando');

const entera = marcarRutinaEntera(e1, id, { hoy: HOY }).estado;
eq(checklistDelDia(entera, id, { hoy: HOY }).estado, 'hecha', 'Marcarla entera');
eq(checklistDelDia(marcarRutinaEntera(entera, id, { hoy: HOY }).estado, id, { hoy: HOY }).estado, 'pendiente',
  'Y volver a tocarla la desmarca entera');
ok(marcarPaso(e1, id, 'noexiste').error !== null, 'Un paso que no existe se rechaza');
ok(marcarRutinaEntera(e1, 'noexiste').error !== null, 'Y una rutina que no existe también');

// ⚠️ El estado del día es DERIVADO: no se queda pegado de ayer.
eq(checklistDelDia(entera, id, { hoy: '2026-08-30' }).estado, 'pendiente',
  '⚠️ Marcada ayer NO significa marcada hoy: el estado se deriva del día');

/* ── 6 · ⚠️ APARTADO 7 — NO CASTIGAR ─────────────────────────────────────── */

// El peor escenario posible: un mes entero sin hacer nada.
const abandonada = crearRutina(base(), { nombre: 'Diaria', pasos: [{ accion: 'lavado' }], frecuencia: 'diaria' },
  { hoy: '2026-07-01' }).estado;
const textos = [
  JSON.stringify(historialPelo(abandonada, { hoy: HOY })),
  JSON.stringify(resumenPelo(abandonada, { hoy: HOY })),
  JSON.stringify(checklistDelDia(abandonada, datosPelo(abandonada).rutinas[0].id, { hoy: HOY })),
  JSON.stringify(Object.values(TEXTOS_ESTADO_DIA)),
].join(' ').toLowerCase();
['fallad', 'fallo', 'perdid', 'deberías', 'mal', 'incumpl', 'abandon', 'racha rota', 'castig']
  .forEach((x) => {
    ok(!textos.includes(x), `⚠️ Apartado 7: ni una palabra de reproche ("${x}") en el peor escenario`);
  });
eq(TEXTOS_ESTADO_DIA.pendiente, 'Pendiente', '⚠️ La palabra que pide el enunciado: "Pendiente"');
eq(ESTADOS_RUTINA_DIA, ['pendiente', 'a_medias', 'hecha'], 'Tres estados, y ninguno es "fallida"');

/* ── 7 · SEGUIMIENTO (apartado 8) ────────────────────────────────────────── */

let seguido = crearRutina(base(), { nombre: 'Diaria', pasos: [{ accion: 'lavado' }], frecuencia: 'diaria' },
  { hoy: addDays(HOY, -9) }).estado;
const idSeg = datosPelo(seguido).rutinas[0].id;
[0, 1, 2, 3, 4].forEach((i) => { seguido = marcarRutinaEntera(seguido, idSeg, { hoy: addDays(HOY, -i) }).estado; });

const hist = historialPelo(seguido, { hoy: HOY, dias: 10 });
eq(hist.length, 1, 'El historial trae la rutina');
eq(hist[0].hechas, 5, 'Cinco días hechos');
eq(hist[0].tocaba, 10, 'De diez que tocaban');
eq(hist[0].cumplimiento, 50, 'Y el cumplimiento, calculado');
eq(hist[0].ultima, HOY, 'Con la última vez');

// ⚠️ Sin días en los que tocara, NO hay cumplimiento.
const personalizada = crearRutina(base(), { nombre: 'Cuando quiera', frecuencia: 'personalizada' }, { hoy: HOY }).estado;
eq(historialPelo(personalizada, { hoy: HOY })[0].cumplimiento, null,
  '⚠️ Una rutina que no toca ningún día NO tiene 0 % de cumplimiento: no tiene ninguno');
eq(historialPelo(personalizada, { hoy: HOY })[0].tocaba, 0, 'Porque no le tocaba nunca');
eq(historialPelo(base(), { hoy: HOY }), [], 'Sin rutinas, historial vacío');

// ⚠️ Ni un contador guardado.
eq(auditarPelo(seguido).contadoresGuardados, 0, '⚠️ Cero contadores guardados: todo se deriva');
ok(!/veces:|total:|contador|streak/i.test(JSON.stringify(datosPelo(seguido).rutinas)),
  '⚠️ Y la rutina guardada no lleva ninguna cifra acumulada');

/* ── 8 · CAMBIOS (apartado 9) ────────────────────────────────────────────── */

eq(COMO_LO_NOTAS.map((c) => c.nombre), ['Mejor', 'Igual', 'Peor'], 'Las tres opciones del enunciado');
const conCambio = registrarCambio(e1, 'mejor', 'Lo noto menos seco esta semana.', { hoy: HOY }).estado;
eq(cambiosPelo(conCambio, { hoy: HOY }).length, 1, 'Se registra');
eq(cambiosPelo(conCambio, { hoy: HOY })[0].nota, 'Lo noto menos seco esta semana.', 'Con su nota');
eq(cambiosPelo(registrarCambio(conCambio, 'igual', '', { hoy: HOY }).estado, { hoy: HOY }).length, 1,
  '⚠️ Uno por día: volver a contestar hoy SUSTITUYE, no acumula');
eq(cambiosPelo(registrarCambio(conCambio, 'igual', '', { hoy: HOY }).estado, { hoy: HOY })[0].como, 'igual',
  'Con el valor nuevo');
ok(registrarCambio(e1, 'inventado').error !== null, 'Una opción que no existe se rechaza');
eq(cambiosPelo(e1, { hoy: HOY }), [], 'Sin cambios, lista vacía');
eq(registrarCambio(e1, 'peor', '', { hoy: HOY }).error, null, 'La nota es opcional');

/* ── 9 · PRODUCTOS (apartados 11 y 12 · D2-03) ──────────────────────────── */

const conProd = anadirProducto(e1, 'Champú de farmacia').estado;
eq(datosPelo(conProd).productos.length, 1, 'Apartado 12: se puede añadir un producto');
eq(datosPelo(conProd).productos[0].nombre, 'Champú de farmacia', 'Con el nombre que él escribe');
ok(anadirProducto(conProd, 'champú de farmacia').sinEfecto, 'No se duplica por mayúsculas');
ok(anadirProducto(conProd, '   ').sinEfecto, 'Ni con un espacio');

const prodId = datosPelo(conProd).productos[0].id;
eq(datosPelo(editarProducto(conProd, prodId, 'Otro champú').estado).productos[0].nombre, 'Otro champú', 'Se edita');
ok(editarProducto(conProd, prodId, '  ').error !== null, 'Pero no se deja vacío');
ok(editarProducto(conProd, 'noexiste', 'x').error !== null, 'Ni se edita uno que no existe');

const asignado = asignarProducto(conProd, id, pasos[0], prodId).estado;
eq(checklistDelDia(asignado, id, { hoy: HOY }).pasos[0].producto, 'Champú de farmacia',
  'Apartado 11: un producto se asocia a un paso');
// ⚠️ Borrarlo DESENGANCHA el paso, no lo borra.
const sinProd = eliminarProducto(asignado, prodId).estado;
eq(datosPelo(sinProd).productos.length, 0, 'Se borra el producto');
eq(datosPelo(sinProd).rutinas[0].pasos.length, 3, '⚠️ Y el paso sigue ahí: se desengancha, no se borra');
eq(checklistDelDia(sinProd, id, { hoy: HOY }).pasos[0].producto, '', 'Sin producto asociado');

// ⚠️ D2-03 + apartado 11: ni catálogo, ni marcas, ni precios, ni enlaces.
eq(auditarPelo(conProd).productosDelCatalogo, 0, '⚠️ CERO productos de catálogo');
['amazon', 'afiliad', 'precio', 'comprar', 'http', 'marca:'].forEach((x) => {
  ok(!new RegExp(x, 'i').test(codigo), `⚠️ D2-03: ni "${x}" en el código`);
});
ok(!/CATALOGO_PRODUCTOS|PRODUCTOS_RECOMENDADOS/.test(codigo), '⚠️ Ni una lista de productos sugeridos');

/* ── 10 · APARTADOS 10 Y 13 — LO QUE NO SE CONSTRUYE ────────────────────── */

eq(auditarPelo(e1).fotos, 0, '⚠️ Apartado 10: cero fotos — "no crear una galería fotográfica obligatoria"');
ok(!/foto|imagen|galeria/i.test(codigoSinAuditoria), 'Y ni una función de foto en el código');

const rec = baseParaRecomendar(e1);
ok(!rec.disponible, '⚠️ Apartado 13: las recomendaciones NO existen todavía, y se dice');
eq(rec.fase, 9, 'Con la fase en la que llegan');
eq(rec.fuentes.length, 6, 'Y las seis fuentes que enumera el enunciado');
ok(rec.sinIA, '⚠️ Sin IA, declarado');
ok(!/askAI|AI_SYSTEM|anthropic/i.test(codigo), 'Y ni una llamada en el código');
ok(rec.perfil, 'Se apoya en el perfil capilar de la Fase 7, no en uno nuevo');

// ⚠️ D2-02 — sin gamificación fuera de Sonido/Rachas.
const auditGam = auditarPelo(seguido);
eq([auditGam.xp, auditGam.niveles, auditGam.medallas], [0, 0, 0], '⚠️ D2-02: ni XP, ni niveles, ni medallas');
ok(!/\bxp\b|nivel:|medalla|insignia|puntos:/i.test(codigoSinAuditoria), 'Y nada de eso en el código');

/* ── 11 · CALENDARIO (apartado 17 · regla 11) ───────────────────────────── */

const eventos = eventosDePelo(e1, { desde: HOY, hasta: '2026-09-05' });
eq(eventos.length, 4, 'Cada 3 días en diez: cuatro ocurrencias');
ok(eventos.every((ev) => ev.soloLectura), '⚠️ Regla 11: todos de SOLO LECTURA');
ok(eventos.every((ev) => ev.origen === 'pelo'), 'Con su origen');
ok(eventos.every((ev) => ev.origenId === id), 'Y apuntando a la rutina, no a una copia');
eq(Object.keys(eventos[0]).sort(),
  ['fecha', 'horaFin', 'horaInicio', 'id', 'notas', 'origen', 'origenId', 'soloLectura', 'tipo', 'titulo', 'todoElDia', 'ubicacion'].sort(),
  '⚠️ Con la MISMA forma que los del Armario: encaja sin adaptadores');
eq(eventosDePelo(e1, {}), [], 'Sin rango, ningún evento');
eq(eventosDePelo(alternarParte(e1, 'rutinas'), { desde: HOY, hasta: '2026-09-05' }), [],
  'Con las rutinas apagadas, tampoco');
// ⚠️ Cambiar la frecuencia cambia los eventos SOLA, porque no hay copia.
eq(eventosDePelo(editarRutina(e1, id, { frecuencia: 'diaria' }).estado, { desde: HOY, hasta: '2026-09-05' }).length, 10,
  '⚠️ Cambiar la frecuencia cambia los eventos al momento: no hay nada que sincronizar');
ok(!/DEFAULT_CALENDARIO|crearEvento/.test(codigo), '⚠️ Apartado 17: no se crea un segundo calendario');

/* ── 12 · PERSISTENCIA Y MÓDULO APAGADO ─────────────────────────────────── */

const guardado = normalizarEstiloHombre(JSON.parse(JSON.stringify(marcarRutinaEntera(conProd, id, { hoy: HOY }).estado)));
eq(datosPelo(guardado).rutinas.length, 1, 'Todo sobrevive al guardado: la rutina');
eq(datosPelo(guardado).productos.length, 1, 'El producto');
eq(datosPelo(guardado).hechos.length, 1, 'Y el registro del día');
eq(checklistDelDia(guardado, id, { hoy: HOY }).estado, 'hecha', 'Con su estado');

const apagado = alternarModulo(guardado, MODULO_PELO, false);
eq(datosPelo(apagado).rutinas.length, 1, '⚠️ Apagar Pelo NO borra las rutinas (F1, apartado 7)');
eq(datosPelo(alternarModulo(apagado, MODULO_PELO, true)).hechos.length, 1, 'Y al reactivarlo, todo sigue');

// El perfil capilar de la Fase 7 y las rutinas conviven en la misma `config`.
const conAmbos = contestarPelo(conProd, 'tipoPelo', 'ondulado', { hoy: HOY }).estado;
eq(datosPelo(conAmbos).rutinas.length, 1, '⚠️ Contestar el perfil NO pisa las rutinas: `guardarConfig` fusiona');

// Entradas corruptas.
[null, undefined, 'roto', 42, { rutinas: 'roto' }, { hechos: [null] }, { productos: [{}] }, { partes: 'roto' }]
  .forEach((malo, i) => {
    const d = normalizarPelo(malo);
    ok(Array.isArray(d.rutinas) && Array.isArray(d.hechos) && typeof d.partes === 'object',
      `Datos corruptos ${i} no revientan`);
  });
eq(normalizarPelo({ rutinas: [{ frecuencia: 'inventada', cada: -5 }] }).rutinas[0].frecuencia, 'personalizada',
  'Una frecuencia que no existe cae en "personalizada", no revienta');
eq(normalizarPelo({ rutinas: [{ cada: -5 }] }).rutinas[0].cada, 2, 'Y un "cada X" imposible se acota');

/* ── 13 · RESUMEN ────────────────────────────────────────────────────────── */

const res = resumenPelo(entera, { hoy: HOY });
eq(res.rutinas, 1, 'Una rutina');
eq(res.hoy, 1, 'Hoy toca');
eq(res.hechasHoy, 1, 'Y está hecha');
eq(res.pendientesHoy, 0, 'Ninguna pendiente');
eq(resumenPelo(e1, { hoy: HOY }).pendientesHoy, 1, 'Y sin marcar, una pendiente');
eq(res.recomendaciones, 0, '⚠️ Cero recomendaciones: no es esta fase');
eq(res.peluqueria, 0, '⚠️ Y cero peluquería: tampoco');
eq(resumenPelo(base(), { hoy: HOY }).rutinas, 0, 'Sin nada, cero — y no revienta');

// Los catálogos son coherentes.
eq(ACCIONES_PELO.length, 7, 'Las siete acciones del apartado 2');
ok(ACCIONES_PELO.every((a) => a.nombre && a.icono), 'Con nombre e icono');
eq(accionPelo('inventada'), null, 'Una acción que no existe devuelve null');
eq(Object.keys(DEFAULT_PELO).sort(), ['cambios', 'hechos', 'partes', 'productos', 'rutinas'],
  'Cinco colecciones, y ninguna de fotos ni de catálogo');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
