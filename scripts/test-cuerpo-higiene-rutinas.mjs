// ============================================================================
// EH · Fase 19/65 — Cuerpo e higiene: rutinas y recomendaciones
//
// Las dieciocho pruebas del apartado 19, y lo que gobierna la fase:
//   · UN solo almacén para los dos módulos (la plantilla mezcla sus pasos)
//   · ni un motor nuevo: rutinas, reglas y productos son los que ya existen
//   · omitir es una TERCERA cosa y sale de la cuenta del día
//   · antes de recomendar comprar, lo que YA TIENE
//   · la plantilla y el pack SE OFRECEN: sin `confirmado` no escriben
//   · toda regla declara `requiere`
//   · y los favoritos globales no existen: se dice
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { PARTES_POR_MODULO, DONDE_VIVEN, planEliminarDatos } from '../src/lib/gestionEstilo.js';
import { METRICAS_PROGRESO } from '../src/lib/progresoEstilo.js';
import { COLECCIONES_EH } from '../src/lib/estadosEstilo.js';
import { FUENTES_BUSQUEDA, buscarEnEstilo } from '../src/lib/buscadorEstilo.js';
import { LINEAS_DE_PLAQUITA } from '../src/lib/pantallaEH.js';
import { TIPOS_AVISO_EH } from '../src/lib/avisosEstilo.js';
import { PALABRAS_CLINICAS, sinDiagnostico } from '../src/lib/perfilPiel.js';
import { reglaAplicable, tonoCorrecto } from '../src/lib/motorRecomendaciones.js';
import {
  MODULO_HIGIENE, MODULO_CUERPO, PARTES_CUERPO, contestarCH, alternarParteCH,
  datosCH, plaquitasDe, FASES_CONSTRUIDAS_CH, panelCH,
} from '../src/lib/cuerpoHigiene.js';
import {
  ALMACEN_CH, PARTES_DEL_APARTADO_17, parteCH19,
  PASOS_CUERPO, pasoCuerpo, PASOS_QUE_LLEGAN_EN_F22,
  FRECUENCIAS_CUERPO, frecuenciaCuerpo, MOMENTOS_CUERPO,
  PLANTILLAS_CUERPO, plantillaCuerpo, BOTONES_PLANTILLA,
  plantillasSugeridasCuerpo, usarPlantillaCuerpo,
  DEFAULT_RUTINAS_CUERPO, normalizarRutinasCuerpo, normalizarRutinaCuerpo,
  normalizarProductoCuerpo, normalizarRegistroCuerpo, datosRutinasCuerpo,
  rutinasCuerpo, rutinaCuerpo, crearRutinaCuerpo, editarRutinaCuerpo,
  ordenarPasosCuerpo, asignarProductoCuerpo, alternarFavoritaCuerpo,
  alternarRecordatorioCuerpo, impactoEliminarRutinaCuerpo,
  eliminarRutinaConPapeleraCuerpo, restaurarRutinaCuerpo,
  tocaEnFechaCuerpo, rutinasDeHoyCuerpo, checklistCuerpo, marcarPasoCuerpo,
  omitirPasoCuerpo, marcarRutinaCuerpoEntera, plaquitasDeRutinas,
  registrarCuerpo, editarRegistroCuerpo, eliminarRegistroCuerpo,
  restaurarRegistroCuerpo, historialCuerpo, cumplimientoCuerpo, ESCALA_CUERPO,
  eventosDeCuerpo, CATALOGO_CUERPO, productosCuerpo, productoCuerpo,
  crearProductoCuerpo, editarProductoCuerpo, eliminarProductoCuerpo,
  restaurarProductoCuerpo, alternarFavoritoCuerpo, alternarMioCuerpo,
  valorarProductoCuerpo, anadirTiendaCuerpo, enlacesDeCuerpo, alternativasDeCuerpo,
  compararProductosCuerpo, buscarEnCuerpo, yaTienesAlgoPara, TEXTO_YA_TIENES,
  packsCuerpo, crearPackCuerpo, eliminarPackCuerpo, verPackCuerpo,
  packSugeridoCuerpo, CATEGORIAS_PACK_BASICO,
  REGLAS_CUERPO, reglaCuerpo, MOTIVOS_CUERPO, contextoRecomendacionesCuerpo,
  recomendacionesCuerpo, marcarVistasCuerpo, descartarRecomendacionCuerpo,
  deshacerDescarteCuerpo, guardarRecomendacionCuerpo, quitarGuardadaCuerpo,
  aplicarRecomendacionCuerpo, CONEXIONES_CUERPO, TEXTOS_CUERPO19,
  textosDeRutinasCuerpo, resumenRutinasCuerpo, lineaRutinasCuerpo,
  auditarRutinasCuerpo, panelRutinasCuerpo,
} from '../src/lib/rutinasCuerpo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const FUENTE = readFileSync(new URL('../src/lib/rutinasCuerpo.js', import.meta.url), 'utf8');
/* ⚠️ Una prueba que lee el código quita los comentarios antes de barrer: la
   cabecera de este archivo NOMBRA los motores que promete no duplicar. */
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const HOY = '2026-08-30';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['higiene', 'cuerpo']);
const conPlantilla = () => usarPlantillaCuerpo(base(), 'diaria_basica', { hoy: HOY, confirmado: true });

/* ===========================================================================
   Test 1 — DECISIÓN 1: un almacén, no dos
   =========================================================================== */
console.log('\nTest 1 — 🚨 un solo almacén para los dos módulos');
{
  eq(ALMACEN_CH, MODULO_CUERPO, 'el almacén vive en `cuerpo`');
  const a = auditarRutinasCuerpo(base());
  eq(a.almacenes, 1, '⚠️ y es UNO: dos listas no podrían guardar la plantilla del apartado 2');

  /* La razón, comprobada: la "Rutina diaria básica" mezcla pasos de los dos
     módulos, así que ninguna lista por módulo la aceptaría entera. */
  const pl = plantillaCuerpo('diaria_basica');
  const modulos = [...new Set(pl.pasos.map((id) => pasoCuerpo(id)?.de))];
  ok(modulos.includes(MODULO_HIGIENE) && modulos.includes(MODULO_CUERPO),
    '⚠️ y la plantilla del enunciado cruza Higiene y Cuidado corporal: por eso es una');

  // Y se guarda de verdad en la config de `cuerpo`.
  const e = conPlantilla().estado;
  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_CUERPO).config;
  ok(!!cfg.rutinasCuerpo, 'lo guardado cuelga de `cuerpo.config.rutinasCuerpo`');
  eq(rutinasCuerpo(e).length, 1, 'y la rutina está');
}

/* ===========================================================================
   Test 2 — DECISIÓN 2: ni un motor nuevo
   =========================================================================== */
console.log('\nTest 2 — ⚠️ los motores son los que ya existen');
{
  const a = auditarRutinasCuerpo(base());
  eq(a.motoresNuevos, 0, 'ni un motor nuevo');
  eq(a.motorRutinas, 'motorRutinas.js', 'las rutinas, el de la F14');
  eq(a.motorReglas, 'motorRecomendaciones.js', 'las reglas, el de la F16');
  eq(a.motorProductos, 'motorProductos.js', 'los productos, el de la F17');
  eq(a.calendariosNuevos, 0, 'ni un calendario nuevo (apartado 18)');
  eq(a.papelerasNuevas, 0, 'ni una papelera propia');
  eq(a.catalogosNuevos, 0, 'ni un catálogo nuevo');

  // Y se comprueba sobre el CÓDIGO, no sobre una promesa.
  ok(/from '\.\/motorRutinas'/.test(SIN_COMENTARIOS), 'el archivo importa el motor de rutinas');
  ok(/from '\.\/motorRecomendaciones'/.test(SIN_COMENTARIOS), 'y el de reglas');
  ok(/from '\.\/motorProductos'/.test(SIN_COMENTARIOS), 'y el de productos');
  ok(!/function\s+tocaEnFecha\b/.test(SIN_COMENTARIOS), '⚠️ y NO reescribe `tocaEnFecha`');
  ok(!/function\s+reglaAplicable\b/.test(SIN_COMENTARIOS), 'ni `reglaAplicable`');
  ok(!/PALABRAS_PROHIBIDAS\s*=/.test(SIN_COMENTARIOS), 'ni una segunda lista de palabras prohibidas');
}

/* ===========================================================================
   Test 3 — LOS PASOS Y LAS FRECUENCIAS (apartados 3 y 6)
   =========================================================================== */
console.log('\nTest 3 — 🚿 los pasos son un catálogo, no una obligación');
{
  ok(PASOS_CUERPO.length >= 8, 'hay pasos de sobra');
  ok(PASOS_CUERPO.some((p) => p.id === 'otros'), 'y "Otro", para lo que no quepa');
  ok(PASOS_CUERPO.every((p) => p.nombre && p.icono), 'todos con nombre e icono');
  ok(PASOS_CUERPO.some((p) => p.de === MODULO_HIGIENE) && PASOS_CUERPO.some((p) => p.de === MODULO_CUERPO),
    '⚠️ y cada uno dice de qué módulo es');
  eq(pasoCuerpo('inventado'), null, 'uno que no existe da null');

  /* ⚠️ Los tres primeros son las COSAS_DE_HIGIENE_DIARIA de la F18, no una
     copia: si alguien las renombra allí, cambian aquí. */
  ['ducha', 'corporal', 'intima'].forEach((id) => {
    ok(!!pasoCuerpo(id), `el paso "${id}" sale de la F18, no de una lista nueva`);
  });

  // Manos y pies NO están aquí: son la F22.
  PASOS_QUE_LLEGAN_EN_F22.forEach((id) => {
    eq(pasoCuerpo(id), null, `⚠️ "${id}" no está: es la Fase 22`);
  });

  // Apartado 6 — las seis etiquetas, sobre las cuatro reglas del motor.
  eq(FRECUENCIAS_CUERPO.length, 6, 'las seis frecuencias del apartado 6');
  const tipos = [...new Set(FRECUENCIAS_CUERPO.map((f) => f.tipo))];
  ok(tipos.every((t) => ['diaria', 'dias', 'cada_x', 'ninguna'].includes(t)),
    '⚠️ y todas declaran un tipo que el motor ya sabe hacer');
  ok(tipos.length <= 4, 'seis etiquetas sobre cuatro comportamientos');
  ok(FRECUENCIAS_CUERPO.some((f) => f.nombre === 'Varias veces por semana'),
    'con las palabras del enunciado');
  eq(frecuenciaCuerpo('nope'), null, 'una que no existe da null');
  eq(MOMENTOS_CUERPO.length, 3, 'y los tres momentos de siempre');
}

/* ===========================================================================
   Test 4 — LA PLANTILLA SE OFRECE (apartado 2) · pruebas 2 y 3
   =========================================================================== */
console.log('\nTest 4 — 📋 *"ofrecer OPCIONALMENTE una plantilla"*');
{
  const e = base();
  const sug = plantillasSugeridasCuerpo(e);
  eq(sug.length, 1, 'se ofrece la rutina diaria básica');
  eq(sug[0].pasosVisibles.map((p) => p.nombre),
    ['Ducha', 'Higiene corporal', 'Desodorante', 'Hidratación corporal'],
    '⚠️ con los CUATRO pasos del enunciado, en su orden');
  eq(sug[0].guardada, false, '⚠️ y escrito en el propio dato: verla no la crea');
  eq(BOTONES_PLANTILLA.map((b) => b.nombre),
    ['Usar esta rutina', 'Personalizar', 'Crear desde cero'],
    'con sus tres botones, tal cual');

  /* ⚠️ **Vigésimo `aplicarPlan`**: sin `confirmado` no escribe. */
  const sin = usarPlantillaCuerpo(e, 'diaria_basica', { hoy: HOY });
  eq(sin.sinConfirmar, true, '⚠️ sin `confirmado` no escribe');
  eq(rutinasCuerpo(sin.estado).length, 0, 'y no hay ni una rutina');
  eq(sin.estado, normalizarEstiloHombre(e), 'el estado sale igual');

  const hecho = usarPlantillaCuerpo(e, 'diaria_basica', { hoy: HOY, confirmado: true });
  eq(rutinasCuerpo(hecho.estado).length, 1, 'confirmando, sí (prueba 2)');
  eq(hecho.rutina.pasos.length, 4, 'con sus cuatro pasos');

  // Prueba 3 — personalizarla: se le quitan pasos y se le cambia el nombre.
  const r = editarRutinaCuerpo(hecho.estado, hecho.rutina.id, {
    nombre: 'Mi ducha', pasos: hecho.rutina.pasos.slice(0, 2),
  });
  eq(rutinaCuerpo(r.estado, hecho.rutina.id).nombre, 'Mi ducha', 'se puede personalizar (prueba 3)');
  eq(rutinaCuerpo(r.estado, hecho.rutina.id).pasos.length, 2, 'y quitarle pasos');

  // Y no se vuelve a ofrecer la que ya usó.
  eq(plantillasSugeridasCuerpo(hecho.estado).length, 0,
    '⚠️ y no se ofrece dos veces: sería la lista interminable que el objetivo prohíbe');
  eq(usarPlantillaCuerpo(e, 'no_existe', { confirmado: true }).rutina, null, 'una plantilla inventada no crea nada');
}

/* ===========================================================================
   Test 5 — CREAR, EDITAR Y REORDENAR · pruebas 1, 4, 5 y 6
   =========================================================================== */
console.log('\nTest 5 — ✏️ crear desde cero, añadir pasos y reordenarlos');
{
  let e = base();
  const sinNombre = crearRutinaCuerpo(e, { nombre: '  ' });
  ok(!!sinNombre.error, 'una rutina sin nombre no se crea');
  eq(rutinasCuerpo(sinNombre.estado).length, 0, 'y no se guarda nada');

  const c = crearRutinaCuerpo(e, { nombre: 'Ducha', pasos: [{ accion: 'ducha' }] }, { hoy: HOY });
  e = c.estado;
  eq(rutinasCuerpo(e).length, 1, 'crear desde cero (pruebas 1 y 4)');
  const id = c.rutina.id;

  // Prueba 5 — añadir pasos.
  const mas = editarRutinaCuerpo(e, id, {
    pasos: [...c.rutina.pasos, { accion: 'desodorante' }, { accion: 'hidratacion' }],
  });
  e = mas.estado;
  eq(rutinaCuerpo(e, id).pasos.length, 3, 'añadir pasos (prueba 5)');

  // Prueba 6 — reordenarlos.
  const pasos = rutinaCuerpo(e, id).pasos;
  const orden = ordenarPasosCuerpo(e, id, [pasos[2].id, pasos[0].id]);
  eq(rutinaCuerpo(orden.estado, id).pasos.map((p) => p.accion),
    ['hidratacion', 'ducha', 'desodorante'],
    '⚠️ reordenarlos, y el que no venga en la lista se queda detrás (prueba 6)');

  // Borrar el nombre a mano avisa igual que al crearla.
  ok(!!editarRutinaCuerpo(e, id, { nombre: '' }).error, '⚠️ y quitarle el nombre avisa');
  ok(!!editarRutinaCuerpo(e, 'nope', { nombre: 'X' }).error, 'una rutina que no existe da error');
  ok(!!ordenarPasosCuerpo(e, 'nope', []).error, 'reordenar una que no existe, también');
}

/* ===========================================================================
   Test 6 — EL CHECKLIST Y OMITIR (apartados 5 y 16) · pruebas 10 y 11
   =========================================================================== */
console.log('\nTest 6 — ⚠️ omitir es una TERCERA cosa, y sale de la cuenta');
{
  let e = conPlantilla().estado;
  const id = rutinasCuerpo(e)[0].id;
  const cl = checklistCuerpo(e, id, { hoy: HOY });
  eq(cl.estado, 'pendiente', 'de partida, pendiente');
  eq(cl.pasos.length, 4, 'con sus cuatro pasos');
  ok(cl.pasos.every((p) => p.etiqueta && p.icono),
    '⚠️ cada uno con su etiqueta y su icono — el motor lo llama `etiqueta`, no `nombre`');

  e = marcarPasoCuerpo(e, id, cl.pasos[0].id, { hoy: HOY });
  eq(checklistCuerpo(e, id, { hoy: HOY }).estado, 'a_medias', 'con uno marcado, a medias (prueba 10)');

  // ⚠️ Los otros tres omitidos → la rutina está HECHA, no fallada.
  e = omitirPasoCuerpo(e, id, cl.pasos[1].id, { hoy: HOY });
  e = omitirPasoCuerpo(e, id, cl.pasos[2].id, { hoy: HOY });
  e = omitirPasoCuerpo(e, id, cl.pasos[3].id, { hoy: HOY });
  eq(checklistCuerpo(e, id, { hoy: HOY }).estado, 'hecha',
    '🚨 uno hecho y tres OMITIDOS es una rutina HECHA: omitir no es fallar (prueba 11)');

  // Y volver a pulsar deshace.
  const vuelta = omitirPasoCuerpo(e, id, cl.pasos[1].id, { hoy: HOY });
  eq(checklistCuerpo(vuelta, id, { hoy: HOY }).estado, 'a_medias', 'y se puede deshacer');

  // Marcar la rutina entera. ⚠️ Sobre ESTE estado: `conPlantilla()` crea otro id.
  const limpio = conPlantilla().estado;
  const idLimpio = rutinasCuerpo(limpio)[0].id;
  const todo = marcarRutinaCuerpoEntera(limpio, idLimpio, { hoy: HOY });
  eq(checklistCuerpo(todo, idLimpio, { hoy: HOY }).estado, 'hecha', 'o marcarla entera');
  eq(marcarRutinaCuerpoEntera(todo, 'nope', { hoy: HOY }), normalizarEstiloHombre(todo),
    'y una que no existe no rompe');

  // ⚠️ Ni rachas, ni puntos, ni niveles (D2-02 y apartado 16).
  const a = auditarRutinasCuerpo(e);
  eq([a.rachas, a.puntos, a.niveles], [0, 0, 0], '⚠️ ni rachas, ni puntos, ni niveles');
  ok(/[Ss]in penalizaci|no cuenta como fallo/.test(TEXTOS_CUERPO19.omitirSuave),
    'y la pantalla lo dice con sus palabras');
}

/* ===========================================================================
   Test 7 — LAS PLAQUITAS (apartado 4)
   =========================================================================== */
console.log('\nTest 7 — 🚿 *"no mostrar todos los pasos en la pantalla principal"*');
{
  const e = conPlantilla().estado;
  const pl = plaquitasDeRutinas(e);
  eq(pl.length, 1, 'una plaquita por rutina');
  eq(pl[0].linea, '4 pasos', '⚠️ y una línea, con el texto del enunciado');
  ok(!('pasos' in pl[0]), '⚠️ y NO trae los pasos dentro');

  const una = crearRutinaCuerpo(base(), { nombre: 'Corta', pasos: [{ accion: 'ducha' }] });
  eq(plaquitasDeRutinas(una.estado)[0].linea, '1 paso', 'y el singular está bien');

  // ⚠️ Apagado devuelve `null`, no `[]`.
  const off = alternarParteCH(e, MODULO_CUERPO, 'rutinas');
  eq(plaquitasDeRutinas(off), null, '⚠️ con las rutinas apagadas devuelve null, no una lista vacía');
}

/* ===========================================================================
   Test 8 — FRECUENCIA Y RECORDATORIO (apartados 6 y 7) · pruebas 8 y 9
   =========================================================================== */
console.log('\nTest 8 — 🔔 *"nunca activarlos automáticamente"*');
{
  let e = conPlantilla().estado;
  const id = rutinasCuerpo(e)[0].id;

  eq(rutinaCuerpo(e, id).recordatorio, false, '⚠️ toda rutina nace SIN recordatorio');
  e = alternarRecordatorioCuerpo(e, id).estado;
  eq(rutinaCuerpo(e, id).recordatorio, true, 'y se enciende a mano (prueba 9)');
  e = alternarRecordatorioCuerpo(e, id).estado;
  eq(rutinaCuerpo(e, id).recordatorio, false, 'y se apaga igual');
  ok(!!alternarRecordatorioCuerpo(e, 'nope').error, 'una que no existe da error');

  // Prueba 8 — cambiar la frecuencia.
  const sem = editarRutinaCuerpo(e, id, { frecuencia: 'semanal' });
  eq(rutinaCuerpo(sem.estado, id).frecuencia, 'semanal', 'se cambia la frecuencia (prueba 8)');
  ok(tocaEnFechaCuerpo(rutinaCuerpo(sem.estado, id), HOY), 'y el día que empieza toca');
  ok(!tocaEnFechaCuerpo(rutinaCuerpo(sem.estado, id), '2026-09-02'), 'pero tres días después no');

  // Y el aviso vive en el catálogo global, apagado.
  const tipo = TIPOS_AVISO_EH.find((t) => t.modulo === 'cuerpo');
  ok(!!tipo, '⚠️ su aviso está en el catálogo de la F38, no en un emisor nuevo');
  eq(tipo.porDefecto, false, '⚠️ y nace apagado, como todos');
}

/* ===========================================================================
   Test 9 — EL CALENDARIO (apartado 18)
   =========================================================================== */
console.log('\nTest 9 — 📅 *"calendario global"*, derivado y de solo lectura');
{
  let e = conPlantilla().estado;
  const id = rutinasCuerpo(e)[0].id;
  eq(eventosDeCuerpo(e, HOY, '2026-09-01').length, 0,
    'sin recordatorio no hay evento: el calendario no se llena solo');

  e = alternarRecordatorioCuerpo(e, id).estado;
  const ev = eventosDeCuerpo(e, HOY, '2026-09-01');
  eq(ev.length, 3, 'con recordatorio, un evento por día que toca');
  ok(ev.every((x) => x.soloLectura === true), '⚠️ y todos de SOLO LECTURA (regla 11)');
  ok(ev.every((x) => x.origen === 'cuerpo'), 'con su origen, para el botón "Abrir en…"');
  ok(ev.every((x) => x.fecha >= HOY && x.fecha <= '2026-09-01'),
    '⚠️ y FILTRADOS por el rango que se pide (la lección de la F23)');

  // ⚠️ No se guarda ni un evento.
  eq(datosRutinasCuerpo(e).rutinas[0].pasos.length, 4, 'y no se materializa ninguna ocurrencia');
  const off = alternarParteCH(e, MODULO_CUERPO, 'rutinas');
  eq(eventosDeCuerpo(off, HOY, '2026-09-01'), [], 'con las rutinas apagadas, ni un evento');
}

/* ===========================================================================
   Test 10 — LOS PRODUCTOS (apartados 10, 11 y 12) · pruebas 7 y 14
   =========================================================================== */
console.log('\nTest 10 — 🧴 *"productos globales. Nada duplicado"*');
{
  let e = base();
  eq(CATALOGO_CUERPO.length, 0, '⚠️ el catálogo está VACÍO a propósito (D2-03)');
  eq(productosCuerpo(e), [], 'y de partida no tiene ninguno');

  const sinNombre = crearProductoCuerpo(e, { categoria: 'gel' });
  ok(!!sinNombre.error, 'un producto sin nombre no se crea');

  const p1 = crearProductoCuerpo(e, { nombre: 'Gel suave', marca: 'X', categoria: 'gel', objetivos: ['hidratacion'], precio: 4 }, { hoy: HOY });
  e = p1.estado;
  eq(productosCuerpo(e).length, 1, 'se añade un producto nuevo');
  eq(productoCuerpo(e, p1.producto.id).precioAnotado, HOY, 'con la fecha del precio sellada');

  // Mismo nombre y marca es el mismo producto.
  const dup = crearProductoCuerpo(e, { nombre: 'gel suave', marca: 'x', categoria: 'gel' });
  eq(dup.sinEfecto, true, '⚠️ y el mismo dos veces no se duplica');
  eq(productosCuerpo(dup.estado).length, 1, 'sigue habiendo uno');

  // Prueba 7 — asociarlo a un paso.
  const conRutina = usarPlantillaCuerpo(e, 'diaria_basica', { hoy: HOY, confirmado: true });
  const rid = conRutina.rutina.id;
  const pasoId = rutinaCuerpo(conRutina.estado, rid).pasos[0].id;
  const asig = asignarProductoCuerpo(conRutina.estado, rid, pasoId, p1.producto.id);
  eq(rutinaCuerpo(asig.estado, rid).pasos[0].productoId, p1.producto.id, 'asociar productos (prueba 7)');
  ok(!!asignarProductoCuerpo(asig.estado, rid, pasoId, 'fantasma').error,
    '⚠️ y NUNCA uno que no existe');
  ok(checklistCuerpo(asig.estado, rid, { hoy: HOY }).pasos[0].producto.includes('Gel suave'),
    'y el checklist lo enseña');

  // Borrar el producto DESENGANCHA el paso; no lo borra.
  const borrado = eliminarProductoCuerpo(asig.estado, p1.producto.id);
  eq(productosCuerpo(borrado.estado).length, 0, 'borrar el producto lo quita');
  eq(rutinaCuerpo(borrado.estado, rid).pasos.length, 4, '⚠️ pero el paso se queda');
  eq(rutinaCuerpo(borrado.estado, rid).pasos[0].productoId, null, 'solo se desengancha');
  ok(!!borrado.entrada, '⚠️ y va a la papelera global, con su entrada');
  eq(productosCuerpo(restaurarProductoCuerpo(borrado.estado, borrado.entrada).estado).length, 1,
    'y vuelve (prueba 12 del apartado 17 de la F22, y la 18 de aquí)');

  // Valoración, favorito y "ya lo tengo".
  ok(!!valorarProductoCuerpo(e, p1.producto.id, 9).error, 'la valoración va de 1 a 5');
  eq(productoCuerpo(valorarProductoCuerpo(e, p1.producto.id, 4).estado, p1.producto.id).valoracion, 4, 'y se guarda');
  eq(productoCuerpo(alternarFavoritoCuerpo(e, p1.producto.id).estado, p1.producto.id).favorito, true, 'el favorito es del producto');
  eq(productoCuerpo(alternarMioCuerpo(e, p1.producto.id).estado, p1.producto.id).mio, true, '"ya lo tengo", también');

  // Apartado 12 — alternativas, y comparar.
  const p2 = crearProductoCuerpo(e, { nombre: 'Gel fuerte', categoria: 'gel' });
  eq(alternativasDeCuerpo(p2.estado, p1.producto.id).length, 1, 'las alternativas son de su categoría');
  eq(compararProductosCuerpo(p2.estado, [p1.producto.id, p2.producto.id]).filas.length,
    5, 'y comparar trae sus cinco filas');
  eq(buscarEnCuerpo(p2.estado, { texto: 'fuerte' }).length, 1, 'el buscador de productos funciona');

  // Nunca un enlace inventado.
  const conTienda = anadirTiendaCuerpo(e, p1.producto.id, { nombre: 'Farmacia', url: 'no-es-una-url' });
  /* ⚠️ `enlacesDeProducto` devuelve un OBJETO con `enlaces`, `donde` y sus
     textos, no una lista: es la misma lección de la FORMA otra vez. */
  const enl = enlacesDeCuerpo(conTienda.estado, p1.producto.id);
  eq(enl.enlaces.length, 0, '⚠️ una "url" que no lo es NO se convierte en enlace');
  eq(enl.donde, ['Farmacia'], '⚠️ pero dónde conseguirlo sigue existiendo (apartado 12)');
  ok(enl.sinEnlacesTexto.length > 0, 'y se dice que no hay enlace, en vez de fabricar uno');
}

/* ===========================================================================
   Test 11 — 🚨 APARTADO 11: LO QUE YA TIENE, ANTES DE COMPRAR
   =========================================================================== */
console.log('\nTest 11 — 🚨 *"esto evita gastar dinero sin motivo"*');
{
  const e = base();
  eq(yaTienesAlgoPara(e, 'hidratacion'), null, 'sin productos suyos, no hay nada que decir');

  const noSuyo = crearProductoCuerpo(e, { nombre: 'Crema', categoria: 'crema', objetivos: ['hidratacion'] });
  eq(yaTienesAlgoPara(noSuyo.estado, 'hidratacion'), null,
    '⚠️ un producto apuntado pero no marcado como suyo no cuenta');

  const suyo = crearProductoCuerpo(e, { nombre: 'Crema', categoria: 'crema', objetivos: ['hidratacion'], mio: true });
  const r = yaTienesAlgoPara(suyo.estado, 'hidratacion');
  eq(r.texto, TEXTO_YA_TIENES, '⚠️ y con uno suyo se dice, con las palabras del enunciado');
  eq(r.productos.length, 1, 'y se enseña cuál');
  eq(yaTienesAlgoPara(suyo.estado, 'olor'), null, 'para otra cosa, no');
  ok(/[Yy]a tienes/.test(TEXTO_YA_TIENES), 'el texto es el del apartado 11');
}

/* ===========================================================================
   Test 12 — LOS PACKS (apartado 13) · prueba 15
   =========================================================================== */
console.log('\nTest 12 — 📦 *"el usuario selecciona qué quiere. No comprar automáticamente"*');
{
  let e = base();
  eq(packSugeridoCuerpo(e).hay, false, 'sin productos no se inventa un pack');
  ok(packSugeridoCuerpo(e).texto.length > 0, 'y se dice por qué');

  CATEGORIAS_PACK_BASICO.forEach((cat, i) => {
    e = crearProductoCuerpo(e, { nombre: `P${i}`, categoria: cat }).estado;
  });
  const sug = packSugeridoCuerpo(e);
  eq(sug.hay, true, 'con los tres básicos, se propone un pack');
  eq(sug.productos.length, 3, 'con Gel, Desodorante e Hidratante, que son sus ejemplos');
  eq(sug.guardado, false, '⚠️ y escrito en el propio dato: NO está guardado');
  eq(packsCuerpo(e).length, 0, 'y proponerlo no crea nada');

  const creado = crearPackCuerpo(e, sug.nombre, sug.productoIds, { hoy: HOY });
  eq(packsCuerpo(creado.estado).length, 1, 'crearlo es otra pulsación (prueba 15)');
  // ⚠️ El motor los llama `items`, no `productos`. La forma otra vez.
  eq(verPackCuerpo(creado.estado, creado.pack.id).items.length, 3, 'y se puede abrir');
  eq(verPackCuerpo(creado.estado, 'nope'), null, 'uno que no existe da null');
  ok(!!crearPackCuerpo(e, '   ', []).error, 'un pack sin nombre no se crea');
  eq(crearPackCuerpo(e, 'X', [], { confirmado: false }).sinConfirmar, true, '⚠️ y sin confirmar tampoco');
  eq(packsCuerpo(eliminarPackCuerpo(creado.estado, creado.pack.id).estado).length, 0, 'y se puede borrar');
  ok(!!eliminarPackCuerpo(e, 'nope').error, 'uno que no existe da error');

  // Apagar los productos apaga el pack, sin borrarlo.
  const off = alternarParteCH(creado.estado, MODULO_CUERPO, 'productos');
  eq(packSugeridoCuerpo(off).hay, false, 'con los productos apagados no se propone');
  eq(packsCuerpo(off).length, 1, '⚠️ pero lo guardado se queda (apartado 17)');
}

/* ===========================================================================
   Test 13 — LAS RECOMENDACIONES (apartados 8, 9 y 14) · pruebas 12, 13 y 14
   =========================================================================== */
console.log('\nTest 13 — 💡 *"mostrar pocas opciones"*, y sin IA');
{
  const e = base();
  // ⚠️ Ni una regla sin `requiere`: se dispararía con el contexto vacío.
  eq(auditarRutinasCuerpo(e).reglasSinRequisitos, [], '⚠️ ni una regla sin `requiere`');
  const vacio = {};
  eq(REGLAS_CUERPO.filter((r) => reglaAplicable(r, vacio)).map((r) => r.id), [],
    '🚨 y con el contexto VACÍO no se aplica ninguna');
  eq(auditarRutinasCuerpo(e).reglasConMalTono, [], '⚠️ y ninguna manda ni reprocha');
  eq(auditarRutinasCuerpo(e).usaIA, 0, 'sin IA, como pide el objetivo');

  const r0 = recomendacionesCuerpo(e, {}, { hoy: HOY });
  ok(r0.recomendaciones.length > 0 && r0.recomendaciones.length <= 3,
    'sin rutinas se propone empezar, y como mucho tres (prueba 12)');
  ok(r0.recomendaciones.every((x) => x.aplicada === false),
    '⚠️ escrito en el propio dato: una recomendación no hace nada sola');

  // Apartado 9 — el perfil de la F18 alimenta las reglas.
  let conRutina = crearRutinaCuerpo(e, { nombre: 'Ducha', pasos: [{ accion: 'ducha' }] }, { hoy: HOY }).estado;
  conRutina = contestarCH(conRutina, MODULO_CUERPO, 'necesidadesCuerpo', 'sequedad').estado;
  const ids = recomendacionesCuerpo(conRutina, {}, { hoy: HOY }).recomendaciones.map((x) => x.id);
  ok(ids.includes('anadir_hidratacion'),
    '⚠️ con "sequedad" contestada sale la del enunciado: *"podrías añadir hidratación corporal"*');

  const ctx = contextoRecomendacionesCuerpo(conRutina, {}, { hoy: HOY });
  ok(ctx.necesidades.includes('sequedad'), 'el contexto lee lo contestado en la F18');
  ok(Array.isArray(ctx.pasosPuestos), 'y qué pasos tiene ya puestos');
  ok(!('peso' in ctx), 'y no copia ni un dato de Josué que viva en otro módulo');

  // Prueba 13 — ignorarla. Y ningún descarte es para siempre.
  const desc = descartarRecomendacionCuerpo(conRutina, 'anadir_hidratacion', 'no_interesa', { hoy: HOY });
  ok(!recomendacionesCuerpo(desc.estado, {}, { hoy: HOY }).recomendaciones.some((x) => x.id === 'anadir_hidratacion'),
    'descartarla la calla (prueba 13)');
  ok(recomendacionesCuerpo(desc.estado, {}, { hoy: HOY }).recomendaciones.length > 0,
    '🐛 ⚠️ pero las OTRAS siguen: `silenciadaEn` devuelve un objeto, no un booleano');
  const vuelve = recomendacionesCuerpo(desc.estado, {}, { hoy: '2027-01-01' }).recomendaciones.map((x) => x.id);
  ok(vuelve.includes('anadir_hidratacion'), '⚠️ y meses después vuelve: ningún descarte es para siempre');
  eq(recomendacionesCuerpo(deshacerDescarteCuerpo(desc.estado, 'anadir_hidratacion'), {}, { hoy: HOY })
    .recomendaciones.some((x) => x.id === 'anadir_hidratacion'), true, 'y se puede deshacer');
  ok(!!descartarRecomendacionCuerpo(conRutina, 'nope').error, 'una regla que no existe da error');
  ok(!!descartarRecomendacionCuerpo(conRutina, 'anadir_hidratacion', 'inventado').error, 'y un motivo inventado, también');

  // Prueba 14 — guardarla.
  const g = guardarRecomendacionCuerpo(conRutina, 'anadir_hidratacion', { hoy: HOY });
  ok(recomendacionesCuerpo(g.estado, {}, { hoy: HOY }).recomendaciones.find((x) => x.id === 'anadir_hidratacion').guardada,
    '🐛 guardarla se ve (prueba 14): `guardadas` son objetos, no ids');
  ok(!recomendacionesCuerpo(quitarGuardadaCuerpo(g.estado, 'anadir_hidratacion'), {}, { hoy: HOY })
    .recomendaciones.find((x) => x.id === 'anadir_hidratacion').guardada, 'y se puede quitar');

  // Mostrar no es registrar.
  eq(datosRutinasCuerpo(conRutina).recomendaciones.vistas, [], '⚠️ verlas no marca nada');
  eq(datosRutinasCuerpo(marcarVistasCuerpo(conRutina, ['anadir_hidratacion'], HOY)).recomendaciones.vistas.length,
    1, 'registrarlas es otra llamada');

  // ⚠️ "Añadir" escribe, y por eso se confirma.
  const rid = rutinasCuerpo(conRutina)[0].id;
  const sin = aplicarRecomendacionCuerpo(conRutina, 'anadir_hidratacion', rid);
  eq(sin.aplicado, false, '⚠️ vigesimoprimer `aplicarPlan`: sin `confirmado` no escribe');
  eq(sin.estado, normalizarEstiloHombre(conRutina), 'y el estado sale igual');
  eq(sin.propuesta.paso.nombre, 'Hidratación corporal', 'pero enseña lo que haría');
  const con = aplicarRecomendacionCuerpo(conRutina, 'anadir_hidratacion', rid, { confirmado: true });
  eq(con.aplicado, true, 'confirmando, sí');
  eq(rutinaCuerpo(con.estado, rid).pasos.length, 2, 'y el paso entra en la rutina');
  ok(!!aplicarRecomendacionCuerpo(conRutina, 'anadir_hidratacion', 'nope', { confirmado: true }).error,
    'sobre una rutina que no existe, error');
  ok(!aplicarRecomendacionCuerpo(conRutina, 'sin_rutina', rid, { confirmado: true }).aplicado,
    'y una regla que no añade nada, no añade nada');

  // Apartado 17 — apagadas devuelve `null`, no una lista vacía.
  const off = alternarParteCH(conRutina, MODULO_CUERPO, 'recomendaciones');
  eq(recomendacionesCuerpo(off, {}, { hoy: HOY }), null,
    '⚠️ apagadas devuelve null: apagado y vacío son DOS cosas');
}

/* ===========================================================================
   Test 14 — EL SEGUIMIENTO (la casilla ☐ de la F18)
   =========================================================================== */
console.log('\nTest 14 — 📈 opt-in de verdad');
{
  const e = base();
  eq(datosCH(e, MODULO_CUERPO).partes.seguimiento, false, '⚠️ nace apagado, con ☐');
  eq(historialCuerpo(e), null, '⚠️ y apagado devuelve null, no []');
  ok(!!registrarCuerpo(e, { como: 'bien' }).error, 'y no deja registrar');

  const on = alternarParteCH(e, MODULO_CUERPO, 'seguimiento');
  eq(historialCuerpo(on), [], 'encendido y sin nada, una lista vacía de verdad');
  ok(!!registrarCuerpo(on, {}, { hoy: HOY }).error, 'un registro vacío no se guarda');

  const r = registrarCuerpo(on, { como: 'bien', nota: 'Bien' }, { hoy: HOY });
  eq(historialCuerpo(r.estado).length, 1, 'y uno con algo dentro, sí');
  eq(historialCuerpo(r.estado)[0].como.nombre, 'Bien', 'con su carita');
  eq(ESCALA_CUERPO.length, 4, 'la escala son cuatro');

  const ed = editarRegistroCuerpo(r.estado, r.registro.id, { nota: 'Mejor' });
  eq(historialCuerpo(ed.estado)[0].nota, 'Mejor', 'se puede editar');
  ok(!!editarRegistroCuerpo(r.estado, 'nope', {}).error, 'uno que no existe da error');

  const del = eliminarRegistroCuerpo(r.estado, r.registro.id);
  eq(historialCuerpo(del.estado).length, 0, 'y borrarlo lo quita');
  ok(!!del.entrada, '⚠️ por la papelera GLOBAL');
  eq(historialCuerpo(restaurarRegistroCuerpo(del.estado, del.entrada).estado).length, 1, 'y vuelve');
  ok(!!eliminarRegistroCuerpo(r.estado, 'nope').error, 'uno que no existe da error');

  /* El cumplimiento: es una lista, UNA POR RUTINA, y sin días en los que
     tocara el cumplimiento es `null`, no un 0 % (lección de la F14). */
  eq(cumplimientoCuerpo(base(), { hoy: HOY }), [], 'sin rutinas, nada que contar');
  const nunca = crearRutinaCuerpo(base(), { nombre: 'X', frecuencia: 'personalizada' }, { hoy: HOY }).estado;
  eq(cumplimientoCuerpo(nunca, { hoy: HOY })[0].cumplimiento, null,
    '⚠️ sin días en los que tocara NO se inventa un 0 %');
  const diaria = usarPlantillaCuerpo(base(), 'diaria_basica', { hoy: HOY, confirmado: true }).estado;
  ok(cumplimientoCuerpo(diaria, { hoy: HOY })[0].tocaba > 0, 'y una diaria sí tiene días');
}

/* ===========================================================================
   Test 15 — ELIMINAR UNA RUTINA (apartado 18) · pruebas 16, 17 y 18
   =========================================================================== */
console.log('\nTest 15 — 🗑️ la papelera es LA de siempre');
{
  let e = alternarParteCH(conPlantilla().estado, MODULO_CUERPO, 'seguimiento');
  const id = rutinasCuerpo(e)[0].id;
  e = marcarPasoCuerpo(e, id, checklistCuerpo(e, id, { hoy: HOY }).pasos[0].id, { hoy: HOY });
  e = registrarCuerpo(e, { rutinaId: id, como: 'bien' }, { hoy: HOY }).estado;

  const imp = impactoEliminarRutinaCuerpo(e, id);
  ok(!!imp, '⚠️ antes de borrar se dice qué se lleva');
  eq(impactoEliminarRutinaCuerpo(e, 'nope'), null, 'de una que no existe, nada');

  const del = eliminarRutinaConPapeleraCuerpo(e, id);
  eq(rutinasCuerpo(del.estado).length, 0, 'la rutina se va');
  eq(datosRutinasCuerpo(del.estado).hechos.length, 0, 'sus marcas también');
  eq(datosRutinasCuerpo(del.estado).registros.length, 1,
    '⚠️ pero el REGISTRO se queda: borrar la rutina no reescribe la historia');
  eq(datosRutinasCuerpo(del.estado).registros[0].rutinaId, null, 'huérfano, como los cortes de la F11');
  ok(!!del.entrada, 'y hay entrada de papelera');
  eq(rutinasCuerpo(restaurarRutinaCuerpo(del.estado, del.entrada).estado).length, 1,
    'y vuelve (pruebas 16, 17 y 18)');
  ok(!!eliminarRutinaConPapeleraCuerpo(e, 'nope').error, 'una que no existe da error');

  // Las tres colecciones están en el catálogo global.
  ['cuerpo.rutinas', 'cuerpo.registros', 'cuerpo.productos'].forEach((k) => {
    ok(!!CATALOGO_PAPELERA[k], `⚠️ ${k} está en el catálogo de la papelera`);
    ok(typeof DONDE_VIVEN[k] === 'function', `y ${k} sabe dónde vive`);
  });
  ok(planEliminarDatos(e, MODULO_CUERPO).length >= 2,
    '⚠️ y "eliminar los datos del módulo" las alcanza (F36)');
}

/* ===========================================================================
   Test 16 — APARTADO 17: LOS CUATRO INTERRUPTORES · pruebas 16 y 17
   =========================================================================== */
console.log('\nTest 16 — ⚙️ *"se pueden desactivar independientemente"*');
{
  eq(PARTES_DEL_APARTADO_17, ['rutinas', 'recomendaciones', 'productos', 'seguimiento'],
    'las cuatro del enunciado');
  PARTES_DEL_APARTADO_17.forEach((id) => {
    ok(PARTES_CUERPO.some((p) => p.id === id), `⚠️ "${id}" es una parte del catálogo, no un interruptor nuevo`);
    ok(!!PARTES_POR_MODULO.cuerpo.partes.find((p) => p.id === id),
      `y ⚙️ Gestionar apartados la ve: ${id}`);
  });

  // Apagar una NO toca las otras, y los datos se conservan.
  let e = conPlantilla().estado;
  e = crearProductoCuerpo(e, { nombre: 'Gel', categoria: 'gel' }).estado;
  const off = alternarParteCH(e, MODULO_CUERPO, 'productos');
  eq(parteCH19(off, 'rutinas'), true, 'apagar productos no toca las rutinas');
  eq(panelRutinasCuerpo(off).productos, null, 'y la pantalla no los pinta');
  eq(datosRutinasCuerpo(off).productos.length, 1, '⚠️ pero el producto SIGUE guardado (prueba 16)');
  const on = alternarParteCH(off, MODULO_CUERPO, 'productos');
  eq(panelRutinasCuerpo(on).productos.length, 1, 'y al reactivarla vuelve tal cual (prueba 17)');

  // Y apagar Higiene no toca nada de esto: son dos módulos (C-25).
  const sinHigiene = alternarParteCH(e, MODULO_HIGIENE, 'higieneDiaria');
  eq(rutinasCuerpo(sinHigiene).length, 1, '⚠️ y quitar una parte de Higiene no toca las rutinas');
}

/* ===========================================================================
   Test 17 — APARTADO 18: LO QUE NO EXISTE, DICHO
   =========================================================================== */
console.log('\nTest 17 — ⚠️ los favoritos globales NO existen, y se dice');
{
  eq(CONEXIONES_CUERPO.length, 6, 'los seis sistemas del apartado 18');
  eq(auditarRutinasCuerpo(base()).conexionesQueNoExisten, ['favoritos'],
    '🚨 y uno de los seis NO existe: no se finge (regla 8)');
  const f = CONEXIONES_CUERPO.find((c) => c.id === 'favoritos');
  ok(f.porque && f.porque.length > 20, '⚠️ con la frase que se lee en pantalla, no una excusa interna');
  ok(CONEXIONES_CUERPO.filter((c) => c.existe).every((c) => !!c.entra),
    'y los otros cinco dicen por dónde entran');
  ok(TEXTOS_CUERPO19.sinFavoritosGlobales === f.porque, 'la pantalla usa esa misma frase');
}

/* ===========================================================================
   Test 18 — EL NORMALIZADOR (regla 5)
   =========================================================================== */
console.log('\nTest 18 — ⚠️ cada campo nuevo, en su normalizador');
{
  eq(Object.keys(DEFAULT_RUTINAS_CUERPO).sort(),
    ['hechos', 'packs', 'productos', 'recomendaciones', 'registros', 'rutinas'],
    'las seis listas de esta fase');
  Object.keys(DEFAULT_RUTINAS_CUERPO).forEach((k) => {
    ok(k in normalizarRutinasCuerpo({}), `⚠️ y el normalizador conoce "${k}"`);
  });

  /* 🚨 La lección cara de la F17: el producto guarda su ficha ENTERA. */
  const guardado = {
    productos: [{ id: 'p1', nombre: 'Gel', marca: 'M', categoria: 'gel', precio: 5, valoracion: 4, objetivos: ['hidratacion'] }],
    rutinas: [{ id: 'r1', nombre: 'R', pasos: [{ id: 's1', accion: 'ducha' }], frecuencia: 'diaria', momento: 'noche', hora: '08:30', favorita: true }],
    registros: [{ id: 'g1', fecha: HOY, como: 'bien', nota: 'x' }],
  };
  const norm = normalizarRutinasCuerpo(guardado);
  eq(norm.productos[0].marca, 'M', '⚠️ y NO recorta el producto a {id, nombre}');
  eq(norm.productos[0].valoracion, 4, 'ni se lleva la valoración');
  eq(norm.productos[0].objetivos, ['hidratacion'], 'ni sus objetivos');
  eq(norm.rutinas[0].momento, 'noche', 'la rutina conserva su momento');
  eq(norm.rutinas[0].hora, '08:30', 'y su hora');
  eq(norm.rutinas[0].favorita, true, 'y si era favorita');
  eq(norm.registros[0].nota, 'x', 'y el registro su nota');

  // Y lo que no vale, no revive.
  eq(normalizarRutinaCuerpo({ momento: 'inventado' }, 0).momento, 'cualquiera', 'un momento inventado no revive');
  eq(normalizarRutinaCuerpo({ hora: '25:99' }, 0).hora, null, '⚠️ y "25:99" encaja con la FORMA pero no es una hora');
  eq(normalizarRutinaCuerpo({ plantilla: 'fantasma' }, 0).plantilla, null, 'ni una plantilla que no existe');
  eq(normalizarProductoCuerpo({ nombre: 'X', categoria: 'fantasma' }).categoria, null, 'ni una categoría inventada');
  eq(normalizarProductoCuerpo({ nombre: 'X', objetivos: ['fantasma'] }).objetivos, [], 'ni un objetivo inventado');
  eq(normalizarRegistroCuerpo({}), null, 'un registro sin fecha no es un registro');
  eq(normalizarRegistroCuerpo({ fecha: HOY, como: 'fantasma' }).como, null, 'ni una valoración inventada');
  eq(normalizarRutinasCuerpo(null), normalizarRutinasCuerpo({}), 'y null no rompe');
  eq(normalizarRutinasCuerpo({ rutinas: 'no' }).rutinas, [], 'ni una lista que no lo es');
}

/* ===========================================================================
   Test 19 — LOS CATÁLOGOS GLOBALES QUE LA F18 DEJÓ ANUNCIADOS
   =========================================================================== */
console.log('\nTest 19 — 📚 una línea en cada catálogo, como manda cada fase');
{
  // METRICAS_PROGRESO (F35).
  const met = METRICAS_PROGRESO.filter((m) => m.modulo === 'cuerpo');
  ok(met.length >= 2, '⚠️ sus métricas están en `METRICAS_PROGRESO`');
  ok(met.every((m) => typeof m.fuente === 'function' && typeof m.fecha === 'function'),
    'cada una con su fuente y su fecha');
  ok(met.every((m) => Array.isArray(m.fuente(base()))), 'y la fuente devuelve una lista');

  // COLECCIONES_EH (F41).
  const col = COLECCIONES_EH.filter((c) => c.modulo === 'cuerpo');
  eq(col.length, 3, '⚠️ sus tres colecciones están en `COLECCIONES_EH`');
  ok(col.every((c) => c.titulo && c.texto && c.boton), 'cada una con su vacío y su botón');
  ok(col.every((c) => Array.isArray(c.leer(base()))), 'y todas se pueden leer');

  // FUENTES_BUSQUEDA (F37).
  const fu = FUENTES_BUSQUEDA.filter((f) => f.id === 'rutinasCuerpo' || f.id === 'productosCuerpo');
  eq(fu.length, 2, '⚠️ y sus dos fuentes en el buscador');
  ok(fu.every((f) => typeof f.lista === 'function' && !!f.grupo),
    '⚠️ con el campo `lista`, que es el que lee `buscarEnEstilo`');
  const e = crearProductoCuerpo(conPlantilla().estado, { nombre: 'Gel de avena', categoria: 'gel' }).estado;
  /* ⚠️ `buscarEnEstilo` devuelve `{ grupos, total, … }`, no una lista. Y lo que
     importa es que ENCUENTRE algo de verdad: los nombres de campo mal puestos
     pasan cualquier prueba de forma (la lección de la F18). */
  const enc = (texto) => buscarEnEstilo(e, texto).grupos.flatMap((g) => g.resultados || g.items || []);
  ok(enc('avena').some((x) => /avena/i.test(x.nombre)),
    '🐛 buscar "avena" encuentra el producto de verdad');
  ok(enc('diaria').some((x) => /diaria/i.test(x.nombre)), 'y "diaria" encuentra la rutina');

  // LINEAS_DE_PLAQUITA (F31) — en los DOS módulos, porque la lista es una.
  [MODULO_HIGIENE, MODULO_CUERPO].forEach((m) => {
    ok(LINEAS_DE_PLAQUITA[m].some((l) => l.id === 'rutina'),
      `⚠️ ${m} tiene su línea "Mi rutina" en la portada`);
  });
  eq(lineaRutinasCuerpo(base()), null, '⚠️ sin rutinas no se pinta línea');
  eq(lineaRutinasCuerpo(conPlantilla().estado, { hoy: HOY }), '1 rutina · 0 de 1 hoy',
    'y con una, dice cuántas y cómo va hoy');
  eq(lineaRutinasCuerpo(alternarParteCH(conPlantilla().estado, MODULO_CUERPO, 'rutinas')), null,
    'y apagadas, tampoco');

  // Y la plaquita de la F19 ya no dice "más adelante".
  ok(FASES_CONSTRUIDAS_CH.includes(19), '⚠️ la F19 está construida, y el catálogo lo sabe');
  const pl = panelCH(conPlantilla().estado, MODULO_CUERPO).plaquitas.find((p) => p.id === 'rutina');
  eq(pl.lista, true, 'así que "Mi rutina" ya lleva a alguna parte');
  eq(pl.texto, null, 'y no dice que llegue más adelante');
  const f22 = panelCH(conPlantilla().estado, MODULO_HIGIENE).plaquitas.find((p) => p.id === 'manosPies');
  eq(f22.lista, false, '⚠️ pero la de la F22 sigue diciendo que llega más adelante (regla 8)');
}

/* ===========================================================================
   Test 20 — LOS TEXTOS: ni un diagnóstico, ni una compra
   =========================================================================== */
console.log('\nTest 20 — 🩺 nunca un diagnóstico, nunca una compra');
{
  const textos = textosDeRutinasCuerpo();
  ok(textos.length > 30, 'se barren todos los textos de la fase');
  eq(auditarRutinasCuerpo(base()).textosClinicos, [], '⚠️ y ninguno diagnostica');
  ok(PALABRAS_CLINICAS.length > 0 && textos.every((t) => sinDiagnostico(t)),
    '⚠️ con la lista de la F13, no una segunda');
  ok(textos.every((t) => tonoCorrecto(t) || !/\bdebes\b|\btienes que\b/i.test(t)),
    'y ninguno le manda');

  const a = auditarRutinasCuerpo(base());
  eq([a.compra, a.carrito, a.enlacesInventados], [0, 0, 0], '⚠️ ni una compra, ni un carrito, ni un enlace inventado');
  /* 🐛 ⚠️ **Decimocuarta vez de la lección**: buscar la palabra "carrito" en el
     archivo salta con `carrito: 0` de la propia auditoría, que es la línea que
     PROMETE que no hay ninguno. Se busca el MECANISMO —una función que compre—,
     no la palabra. */
  ok(!/function\s+\w*[Cc]omprar|function\s+\w*[Cc]arrito|añadirAlCarrito/.test(SIN_COMENTARIOS),
    '⚠️ y el código no tiene ni una función que compre');
  eq(a.catalogo, 0, 'el catálogo sigue vacío (D2-03)');
  ok(TEXTOS_CUERPO19.catalogo.length > 0, 'y se dice por qué');
}

/* ===========================================================================
   Test 21 — EL PANEL Y EL RESUMEN
   =========================================================================== */
console.log('\nTest 21 — 🖼️ lo que ve la pantalla');
{
  const vacio = panelRutinasCuerpo(base(), {}, { hoy: HOY });
  eq(vacio.activo, true, 'las rutinas vienen puestas');
  ok(!!vacio.vacio, '⚠️ y el vacío trae su título, su explicación y su botón');
  eq(vacio.vacio.titulo, 'Crea tu primera rutina', 'con las palabras del enunciado');
  ok(Array.isArray(vacio.plantillas) && vacio.plantillas.length === 1, 'y la plantilla que se ofrece');

  const e = conPlantilla().estado;
  const p = panelRutinasCuerpo(e, {}, { hoy: HOY });
  eq(p.vacio, null, 'con una rutina ya no hay vacío');
  eq(p.plaquitas.length, 1, 'y su plaquita');
  eq(p.hoy.length, 1, 'y lo que toca hoy');
  ok(!!p.textos && !!p.conexiones && !!p.resumen, 'con sus textos, sus conexiones y su resumen');

  const r = resumenRutinasCuerpo(e, { hoy: HOY });
  eq(r.rutinas, 1, 'una rutina');
  eq(r.hoy, 1, 'que toca hoy');
  eq(r.hechasHoy, 0, 'y todavía sin hacer');
  eq(r.registros, null, '⚠️ y el seguimiento apagado da null, no 0');
  eq(r.ultimo, null, 'sin nada registrado, no hay última fecha');
  eq(resumenRutinasCuerpo(alternarParteCH(e, MODULO_CUERPO, 'seguimiento'), { hoy: HOY }).registros, 0,
    'encendido y sin registros, un 0 de verdad');

  // Apagado, la pantalla lo dice en vez de quedarse en blanco.
  const off = panelRutinasCuerpo(alternarParteCH(e, MODULO_CUERPO, 'rutinas'), {}, { hoy: HOY });
  eq(off.activo, false, 'apagadas, se sabe');
  eq(off.plantillas, [], 'y no se ofrece la plantilla');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones`);
process.exit(fallos === 0 ? 0 : 1);
