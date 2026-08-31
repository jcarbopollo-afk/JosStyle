// ============================================================================
// EH · Fase 22/65 — Manos, uñas y pies: configuración
//
// Lo que gobierna la fase, y lo que estas pruebas vigilan:
//   · vive DENTRO de `higiene` (C-25, respuesta 2): ni un módulo nuevo
//   · ni motor, ni catálogo, ni papelera, ni calendario propios
//   · el seguimiento SÍ se guarda aquí, porque su enunciado lo describe
//   · desactivar una sección no toca las otras ni borra nada
//   · dos listas dentro del mismo módulo, con nombres distintos
//   · y nunca un diagnóstico
//
// Y las quince pruebas que pide el apartado 17, una a una.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH, IDS_EH,
} from '../src/lib/estiloDeHombre.js';
import {
  MODULO_HIGIENE, PARTES_HIGIENE, alternarParteCH, parteActivaCH, panelCH,
  plaquitasDe, FASES_CH_LISTAS,
} from '../src/lib/cuerpoHigiene.js';
import { crearProductoPiel } from '../src/lib/productosPiel.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { COLECCIONES_EH } from '../src/lib/estadosEstilo.js';
import { METRICAS_PROGRESO } from '../src/lib/progresoEstilo.js';
import { TIPOS_AVISO_EH } from '../src/lib/avisosEstilo.js';
import { FUENTES_BUSQUEDA } from '../src/lib/buscadorEstilo.js';
import { LINEAS_DE_PLAQUITA } from '../src/lib/pantallaEH.js';
import { LIBRERIAS_EH } from '../src/lib/privacidadEstilo.js';
import {
  SECCION_UNAS, SECCION_MANOS, SECCION_PIES, SECCIONES_MP, IDS_SECCIONES_MP, seccionMP,
  seccionActiva, seccionesActivas, LONGITUDES_UNAS, COSAS_DE_SECCION, cosasDeSeccion,
  FRECUENCIAS_MP, frecuenciaMP, PASOS_MP, pasoMP, pasosDeSeccion, PLANTILLAS_MP,
  plantillaMP, plantillasSugeridasMP, usarPlantillaMP, DEFAULT_MANOS_PIES,
  normalizarManosPies, normalizarRegistroMP, datosManosPies, configDeSeccion,
  configurarSeccion, alternarRecordatorioSeccion, alternarCosaSeccion, alternarSeguimientoMP,
  rutinasMP, rutinaMP, crearRutinaMP, editarRutinaMP, anadirPasoMP, quitarPasoMP,
  alternarRecordatorioRutinaMP, tocaEnFechaMP, rutinasDeHoyMP, checklistMP, marcarPasoMP,
  marcarRutinaMPEntera, productosDeMP, anadirProductoMP, quitarProductoMP,
  registrarMP, editarRegistroMP, historialMP, impactoEliminarRutinaMP, eliminarRutinaMP,
  eliminarRegistroMP, restaurarEnMP, eventosDeManosPies, resumenMP, lineaMP,
  panelMP, textosDeMP, auditarMP, TEXTOS_MP, MAX_NOTA_MP, sinDiagnostico,
} from '../src/lib/manosPies.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const FUENTE = readFileSync(new URL('../src/lib/manosPies.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const VISTA = readFileSync(new URL('../src/views/EstiloHombreView.jsx', import.meta.url), 'utf8');
const APP = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const HOY = '2026-03-02'; // un lunes
const BASE = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['higiene', 'skincare']);
// Las tres secciones encendidas, que es como empieza casi todo aquí.
const CON_TODO = IDS_SECCIONES_MP.reduce(
  (e, id) => (parteActivaCH(e, MODULO_HIGIENE, id) ? e : alternarParteCH(e, MODULO_HIGIENE, id)),
  BASE,
);

console.log('\n💅 EH · Fase 22/65 — Manos, uñas y pies: configuración\n');

/* ---------------------------------------------------------------------------
   1 · DÓNDE VIVE: DENTRO DE HIGIENE (C-25, respuesta 2)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Vive dentro de Higiene, y no crea ningún módulo nuevo');
  ok(!IDS_EH.includes('manos') && !IDS_EH.includes('unas') && !IDS_EH.includes('pies'),
    '⚠️ ni un módulo nuevo en `MODULOS_EH`: esto es parte de Higiene (C-25)');
  ok(!!moduloEH(MODULO_HIGIENE), 'y Higiene sigue siendo el de siempre');
  eq(IDS_SECCIONES_MP, ['unas', 'manos', 'pies'], 'las tres secciones del apartado 1');
  eq(SECCIONES_MP.map((s) => s.icono), ['💅', '🤲', '🦶'], 'con sus tres iconos');

  const a = auditarMP(CON_TODO);
  eq(a.interruptores, 3, '⚠️ los tres interruptores son partes de `PARTES_HIGIENE` (F18)');
  eq(a.interruptoresPropios, 0, '⚠️ y esta fase NO crea ninguno suyo: no hay dos verdades');
  ok(PARTES_HIGIENE.some((p) => p.id === 'unas' && p.enFase === 22),
    '⚠️ `unas` la añade la F22, con su fase escrita');
  eq(PARTES_HIGIENE.find((p) => p.id === 'unas').porDefecto, false,
    '⚠️ y apagada: *"aparecerá únicamente si el usuario lo activa"*');
  eq(PARTES_HIGIENE.find((p) => p.id === 'unas').deApartado1, false,
    'y no es una casilla del apartado 1 de la F18, porque Josué no la puso ahí');
  ok(PARTES_HIGIENE.filter((p) => ['manos', 'pies'].includes(p.id)).every((p) => p.enFase === 22),
    'manos y pies ya llevaban su `enFase: 22` desde la F18');
}

/* ---------------------------------------------------------------------------
   2 · NI UN MOTOR NUEVO (decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Ni motor, ni catálogo, ni papelera, ni calendario propios');
  const a = auditarMP(CON_TODO);
  eq([a.motoresNuevos, a.catalogosNuevos, a.papelerasNuevas, a.calendariosNuevos], [0, 0, 0, 0],
    '⚠️ cuatro ceros en la auditoría');
  eq(a.motorRutinas, 'motorRutinas.js', 'las rutinas son las de la F14');
  eq(a.catalogoProductos, 'catalogoParaCuerpo (EH F19)',
    '⚠️ y los productos, el catálogo compartido que ya resolvió la F19');
  eq(a.usaIA, 0, 'sin IA');
  eq([a.rachas, a.puntos, a.niveles], [0, 0, 0],
    '⚠️ ni rachas ni penalizaciones (apartado 9 + D2-02)');
  ok(/from '\.\/motorRutinas'/.test(FUENTE) && /from '\.\/rutinasCuerpo'/.test(FUENTE),
    'y los importa de verdad');
  ok(!/productosPiel|productosPelo/.test(SIN_COMENTARIOS),
    '⚠️ y NO junta los inventarios por su cuenta: eso ya lo hace `catalogoParaCuerpo`');
  ok(!/localStorage|saveData\s*\(/.test(SIN_COMENTARIOS), 'no guarda por su cuenta');
}

/* ---------------------------------------------------------------------------
   3 · ACTIVAR Y DESACTIVAR (apartados 1, 14 y 15 · pruebas 1, 2, 3, 4, 13 y 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Activar cada una, y desactivarla sin tocar las otras');
  eq(seccionesActivas(BASE).map((s) => s.id), ['manos', 'pies'],
    'de fábrica vienen manos y pies (casillas de la F18) y las uñas no');

  const soloUnas = alternarParteCH(BASE, MODULO_HIGIENE, SECCION_UNAS);
  ok(seccionActiva(soloUnas, SECCION_UNAS), 'prueba 1 — activar uñas');
  ok(seccionActiva(CON_TODO, SECCION_MANOS), 'prueba 2 — activar manos');
  ok(seccionActiva(CON_TODO, SECCION_PIES), 'prueba 3 — activar pies');

  /* Prueba 4 — *"activar solo una"*. */
  let sola = alternarParteCH(soloUnas, MODULO_HIGIENE, SECCION_MANOS);
  sola = alternarParteCH(sola, MODULO_HIGIENE, SECCION_PIES);
  eq(seccionesActivas(sola).map((s) => s.id), ['unas'], 'prueba 4 — se queda solo con una');

  /* Prueba 13 — desactivar individualmente, con datos dentro. */
  let e = configurarSeccion(CON_TODO, SECCION_PIES, { frecuencia: 'semanal', notas: 'Los fines de semana' }, { hoy: HOY }).estado;
  e = crearRutinaMP(e, { nombre: 'Pies', seccion: SECCION_PIES, pasos: [{ accion: 'lavar' }] }, { hoy: HOY }).estado;
  const sinPies = alternarParteCH(e, MODULO_HIGIENE, SECCION_PIES);
  eq(seccionActiva(sinPies, SECCION_PIES), false, 'prueba 13 — se apagan solo los pies');
  ok(seccionActiva(sinPies, SECCION_UNAS) && seccionActiva(sinPies, SECCION_MANOS),
    '⚠️ y uñas y manos siguen encendidas: *"no se desactiva todo el bloque"*');
  /* Prueba 14 + apartado 15 — al volver, todo sigue donde estaba. */
  eq(configDeSeccion(sinPies, SECCION_PIES).notas, 'Los fines de semana',
    '⚠️ apartado 15 — apagarla NO borra su configuración');
  eq(rutinasMP(sinPies).length, 1, 'ni su rutina');
  eq(rutinasDeHoyMP(sinPies, { hoy: HOY }).length, 0, 'solo deja de salir hoy');
  const vuelta = alternarParteCH(sinPies, MODULO_HIGIENE, SECCION_PIES);
  eq(configDeSeccion(vuelta, SECCION_PIES).notas, 'Los fines de semana',
    'prueba 14 — y al reactivarla, todo sigue exactamente donde estaba');
}

/* ---------------------------------------------------------------------------
   4 · LO QUE SE CONFIGURA DENTRO (apartados 2, 3, 4, 5 y 6 · prueba 6)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Longitud, cosas y frecuencia');
  eq(LONGITUDES_UNAS.map((l) => l.nombre),
    ['Muy cortas', 'Cortas', 'Medias', 'Largas', 'Personalizado'],
    'las cinco longitudes del apartado 3, con sus palabras');
  eq(cosasDeSeccion(SECCION_MANOS).map((c) => c.nombre),
    ['Hidratación', 'Protección', 'Cuidado de uñas', 'Otros'], 'las cuatro del apartado 4');
  eq(cosasDeSeccion(SECCION_PIES).map((c) => c.nombre),
    ['Higiene', 'Hidratación', 'Uñas', 'Cuidado general'], 'y las cuatro del apartado 5');
  eq(cosasDeSeccion(SECCION_UNAS), [],
    '⚠️ uñas no tiene lista propia: lo suyo son sus frecuencias y su longitud');

  eq(FRECUENCIAS_MP.map((f) => f.nombre),
    ['Cada semana', 'Cada 2 semanas', 'Cada mes', 'Personalizado'], 'las cuatro del apartado 6');
  eq([...new Set(FRECUENCIAS_MP.map((f) => f.tipo))].sort(), ['cada_x', 'ninguna'],
    '⚠️ y por debajo solo hay DOS comportamientos, los del motor');

  const conLongitud = configurarSeccion(CON_TODO, SECCION_UNAS, { longitud: 'cortas' }, { hoy: HOY });
  eq(configDeSeccion(conLongitud.estado, SECCION_UNAS).longitud, 'cortas', 'la longitud se guarda');
  eq(configDeSeccion(configurarSeccion(CON_TODO, SECCION_MANOS, { longitud: 'cortas' }).estado, SECCION_MANOS).longitud,
    null, '⚠️ y en manos no existe: no se guarda un campo que no es suyo');

  const conFrec = configurarSeccion(CON_TODO, SECCION_UNAS, { frecuencia: 'quincenal' }, { hoy: HOY });
  eq(configDeSeccion(conFrec.estado, SECCION_UNAS).frecuencia, 'quincenal', 'prueba 6 — configurar frecuencia');
  eq(configDeSeccion(conFrec.estado, SECCION_UNAS).desde, HOY,
    '⚠️ y la fecha desde la que cuenta se pone sola: pedírsela sería una pregunta para nada');

  const conCosa = alternarCosaSeccion(CON_TODO, SECCION_PIES, 'hidratacion');
  eq(configDeSeccion(conCosa.estado, SECCION_PIES).cosas.hidratacion, true, 'las cosas de dentro se marcan');
  eq(alternarCosaSeccion(CON_TODO, SECCION_PIES, 'inventada').error, 'Eso no existe.',
    'y lo que no está en la lista se dice');
  eq(configurarSeccion(CON_TODO, 'ombligo', {}).error, 'Esa sección no existe.',
    'una sección que no existe, también');

  const notaLarga = configurarSeccion(CON_TODO, SECCION_UNAS, { notas: 'x'.repeat(400) });
  eq(configDeSeccion(notaLarga.estado, SECCION_UNAS).notas.length, MAX_NOTA_MP,
    'y una nota larguísima se recorta, no se guarda entera');
}

/* ---------------------------------------------------------------------------
   5 · RECORDATORIOS Y CALENDARIO (apartados 7 y 10 · prueba 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · El recordatorio lo enciende él, y sale al calendario global');
  eq(configDeSeccion(CON_TODO, SECCION_UNAS).recordatorio, false,
    '⚠️ apartado 7 — nace apagado: *"completamente opcional"*');
  let e = configurarSeccion(CON_TODO, SECCION_UNAS, { frecuencia: 'semanal' }, { hoy: HOY }).estado;
  eq(eventosDeManosPies(e, HOY, '2026-03-16').length, 0,
    '⚠️ con frecuencia pero SIN recordatorio no hay ni un evento');

  e = alternarRecordatorioSeccion(e, SECCION_UNAS, { hoy: HOY }).estado;
  eq(configDeSeccion(e, SECCION_UNAS).recordatorio, true, 'prueba 7 — crear recordatorio');
  const ev = eventosDeManosPies(e, HOY, '2026-03-16');
  ok(ev.length === 3, 'y entonces sí: uno cada semana (2, 9 y 16 de marzo)');
  ok(ev.every((x) => x.soloLectura && x.origen === MODULO_HIGIENE),
    '⚠️ derivados, de solo lectura y con el origen de Higiene');
  ok(ev[0].id.startsWith('manospies:'), 'con su prefijo, para que el calendario sepa volver');
  ok(/Cortar uñas/.test(ev[0].titulo),
    '⚠️ y con el nombre del ejemplo del apartado 10: *"💅 Cortar uñas — domingo"*');
  ok(!/materializar|guardarEvento/.test(SIN_COMENTARIOS),
    'y no se guarda ni una ocurrencia (regla 11)');

  // Apagar la sección se lleva sus eventos, pero no su configuración.
  const apagada = alternarParteCH(e, MODULO_HIGIENE, SECCION_UNAS);
  eq(eventosDeManosPies(apagada, HOY, '2026-03-16').length, 0,
    '⚠️ y apagando la sección desaparecen del calendario');
  eq(configDeSeccion(apagada, SECCION_UNAS).recordatorio, true, 'pero su recordatorio sigue guardado');
}

/* ---------------------------------------------------------------------------
   6 · LAS RUTINAS Y EL CHECKLIST (apartados 8 y 9 · pruebas 5 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Las rutinas, con sus pasos editables');
  eq(plantillaMP('unas').pasos, ['cortar', 'limar', 'hidratar'],
    '⚠️ los tres pasos del ejemplo del apartado 8, en su orden');
  const sug = plantillasSugeridasMP(CON_TODO);
  eq(sug.length, 3, 'se ofrece una por sección encendida');
  eq(sug[0].guardada, false, '⚠️ escrito en el propio dato: verla no la crea');
  eq(usarPlantillaMP(CON_TODO, 'unas').sinConfirmar, true,
    '⚠️ y sin confirmar NO escribe (regla 7)');
  eq(plantillasSugeridasMP(BASE).some((p) => p.id === 'unas'), false,
    '⚠️ a quien no ha encendido las uñas no se le propone su rutina');

  const conPlantilla = usarPlantillaMP(CON_TODO, 'unas', { confirmado: true, hoy: HOY });
  eq(rutinasMP(conPlantilla.estado).length, 1, 'prueba 5 — crear rutina, desde la plantilla');
  eq(plantillasSugeridasMP(conPlantilla.estado).length, 2, 'y ya no se vuelve a ofrecer la misma');
  const id = conPlantilla.rutina.id;

  eq(crearRutinaMP(CON_TODO, { nombre: ' ', seccion: SECCION_UNAS }).error,
    'La rutina necesita un nombre.', 'una rutina sin nombre no se crea');
  eq(crearRutinaMP(CON_TODO, { nombre: 'X', seccion: 'ombligo' }).error,
    'Esa sección no existe.', 'ni una de una sección inventada');
  eq(usarPlantillaMP(BASE, 'unas', { confirmado: true }).error, 'Esa sección está desactivada.',
    'ni se puede usar la plantilla de una sección apagada');

  // Apartado 8 — *"todos los pasos son editables"*.
  const conPaso = anadirPasoMP(conPlantilla.estado, id, 'otros');
  eq(rutinaMP(conPaso.estado, id).pasos.length, 4, 'se puede añadir un paso');
  eq(anadirPasoMP(conPlantilla.estado, id, 'lavar').error, 'Ese paso no es de esta sección.',
    '⚠️ y uno de otra sección no se cuela');
  const pasos = rutinaMP(conPlantilla.estado, id).pasos;
  eq(rutinaMP(quitarPasoMP(conPlantilla.estado, id, pasos[0].id).estado, id).pasos.length, 2,
    'y quitar uno también');
  eq(rutinaMP(editarRutinaMP(conPlantilla.estado, id, { nombre: 'Mis uñas' }).estado, id).nombre,
    'Mis uñas', 'prueba 10 — editar');
  eq(editarRutinaMP(conPlantilla.estado, id, { nombre: '  ' }).error, 'La rutina necesita un nombre.',
    'y dejarla sin nombre avisa');
  eq(rutinaMP(conPlantilla.estado, id).recordatorio, false, 'el recordatorio de la rutina nace apagado');
  eq(rutinaMP(alternarRecordatorioRutinaMP(conPlantilla.estado, id).estado, id).recordatorio, true,
    'y se enciende con un toque');

  // Apartado 9 — el checklist, sin penalizaciones.
  eq(rutinasDeHoyMP(conPlantilla.estado, { hoy: HOY }).length, 1, 'la rutina toca hoy');
  eq(checklistMP(conPlantilla.estado, id, { hoy: HOY }).estado, 'pendiente',
    '⚠️ "Pendiente", nunca "has fallado"');
  const marcada = marcarPasoMP(conPlantilla.estado, id, pasos[0].id, { hoy: HOY });
  eq(checklistMP(marcada, id, { hoy: HOY }).hechos, 1, 'se marca un paso');
  const todo = marcarRutinaMPEntera(conPlantilla.estado, id, { hoy: HOY });
  eq(checklistMP(todo, id, { hoy: HOY }).estado, 'hecha', 'y "marcarlo todo" la deja hecha');
  eq(checklistMP(marcada, id, { hoy: '2026-03-16' }).hechos, 0,
    '⚠️ y otro día vuelve a estar pendiente: lo hecho vive con su fecha');
  ok(/sin rachas|Sin rachas/i.test(TEXTOS_MP.sinRachas), 'y se dice que aquí no hay rachas');

  // Las cuatro frecuencias, sobre el motor.
  const quincenal = { activa: true, frecuencia: 'quincenal', cada: 14, desde: HOY, dias: [] };
  ok(tocaEnFechaMP(quincenal, '2026-03-16') && !tocaEnFechaMP(quincenal, '2026-03-09'),
    'cada 2 semanas cuenta desde su inicio');
  ok(!tocaEnFechaMP({ activa: true, frecuencia: 'personalizado', desde: HOY, dias: [], cada: 2 }, HOY),
    '⚠️ y "personalizado" no toca ningún día por su cuenta');
}

/* ---------------------------------------------------------------------------
   7 · PRODUCTOS (apartado 11 · prueba 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Los productos son los del catálogo global');
  const p = crearProductoPiel(CON_TODO, { nombre: 'Crema de manos', categoria: 'hidratante' }, { hoy: HOY });
  const conProducto = anadirProductoMP(p.estado, p.producto.id);
  eq(conProducto.error, null, 'prueba 8 — añadir producto');
  eq(productosDeMP(conProducto.estado).length, 1, 'y se ve desde aquí');
  eq(datosManosPies(conProducto.estado).productos, [p.producto.id],
    '⚠️ guardado como ID, no como ficha: ni medio inventario nuevo');
  eq(productosDeMP(conProducto.estado)[0].moduloNombre, 'Skincare', 'con su origen a la vista');
  eq(anadirProductoMP(conProducto.estado, p.producto.id).sinEfecto, true, 'añadirlo dos veces no lo duplica');
  eq(anadirProductoMP(CON_TODO, 'fantasma').error, 'Ese producto no existe.', 'y uno inventado no entra');
  eq(productosDeMP(quitarProductoMP(conProducto.estado, p.producto.id).estado).length, 0,
    'quitarlo de aquí no lo borra de su módulo');
}

/* ---------------------------------------------------------------------------
   8 · EL SEGUIMIENTO (apartados 12 y 13 · prueba 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · El seguimiento se pregunta, y se puede decir que no');
  eq(datosManosPies(CON_TODO).seguimiento, false,
    '⚠️ apartado 12 — nace apagado, y entonces no aparece');
  eq(TEXTOS_MP.preguntaSeguimiento, '¿Quieres registrar cuándo lo haces?',
    'con la pregunta del enunciado, literal');
  eq(TEXTOS_MP.sinSeguimiento, 'Perfecto, no aparece.', 'y la respuesta a que no, también');
  eq(registrarMP(CON_TODO, { seccion: SECCION_UNAS }).error, 'El seguimiento está desactivado.',
    'apagado, no se puede registrar');

  const conSeg = alternarSeguimientoMP(CON_TODO);
  const r = registrarMP(conSeg, { seccion: SECCION_UNAS, nota: 'Prefiero mantenerlas más cortas.' }, { hoy: HOY });
  eq(r.error, null, 'prueba 9 — registrar seguimiento');
  eq(r.registro.nota, 'Prefiero mantenerlas más cortas.',
    '⚠️ apartado 13 — con su nota, que es el ejemplo del enunciado');
  eq(Object.keys(r.registro).sort(), ['fecha', 'id', 'nota', 'seccion'],
    '⚠️ y NADA MÁS: ni una valoración que nadie ha pedido');
  eq(historialMP(r.estado)[0].seccionNombre, 'Uñas', 'el historial dice de qué sección era');
  eq(historialMP(r.estado, { seccion: SECCION_MANOS }).length, 0, 'y se puede filtrar por sección');
  eq(registrarMP(alternarSeguimientoMP(CON_TODO), { seccion: SECCION_UNAS, fecha: null }, { hoy: HOY }).error,
    null, 'sin fecha se usa la de hoy');

  const apagado = alternarSeguimientoMP(r.estado);
  eq(datosManosPies(apagado).registrosManosPies.length, 1,
    '⚠️ y apagarlo NO borra lo registrado (apartado 15)');
  eq(panelMP(apagado).historial, [], 'solo deja de enseñarse');
  eq(editarRegistroMP(r.estado, r.registro.id, { nota: 'Otra' }).error, null, 'un registro se puede editar');
  eq(editarRegistroMP(r.estado, 'fantasma', {}).error, 'Ese registro no existe.', 'y uno que no existe se dice');

  /* ⚠️ La diferencia con la F19, escrita: allí el seguimiento es DERIVADO porque
     su enunciado no describía ninguna pantalla; aquí se guarda porque el suyo la
     describe con su pregunta y su nota. */
  ok(/registrosManosPies/.test(SIN_COMENTARIOS),
    '⚠️ aquí SÍ hay una lista de registros, y es lo que pide el apartado 12');
}

/* ---------------------------------------------------------------------------
   9 · ELIMINAR Y RECUPERAR (apartado 16 · pruebas 11, 12 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Todo se borra por la papelera global, y vuelve');
  ok(!!CATALOGO_PAPELERA['higiene.rutinasManosPies'] && !!CATALOGO_PAPELERA['higiene.registrosManosPies'],
    '⚠️ las dos colecciones están en la papelera GLOBAL (ME F3)');
  ok(!!CATALOGO_PAPELERA['higiene.rutinas'],
    '⚠️ y CONVIVEN con las rutinas de la F19, que también viven en `higiene`');
  eq(auditarMP(CON_TODO).coleccionesPropias, ['rutinasManosPies', 'registrosManosPies'],
    '⚠️ por eso se llaman así: dos listas del mismo módulo no pueden llamarse igual');

  let e = usarPlantillaMP(CON_TODO, 'unas', { confirmado: true, hoy: HOY }).estado;
  const id = rutinasMP(e)[0].id;
  e = marcarRutinaMPEntera(e, id, { hoy: HOY });
  const impacto = impactoEliminarRutinaMP(e, id);
  ok(/Se borrará/.test(impacto.texto), '⚠️ antes de borrar se dice qué se lleva');
  const borrada = eliminarRutinaMP(e, id, { ahora: `${HOY}T10:00:00.000Z` });
  eq(rutinasMP(borrada.estado).length, 0, 'prueba 11 — eliminar');
  ok(!!borrada.entrada, 'y devuelve su entrada de papelera, que guarda App.jsx');
  eq(borrada.entrada.coleccion, 'rutinasManosPies', 'con el nombre de colección bueno');
  eq(datosManosPies(borrada.estado).hechos.length, 0, 'sus marcas se van con ella');
  eq(rutinasMP(restaurarEnMP(borrada.estado, borrada.entrada).estado).length, 1,
    'prueba 12 — recuperar');

  const conSeg = alternarSeguimientoMP(CON_TODO);
  const reg = registrarMP(conSeg, { seccion: SECCION_PIES, nota: 'Hoy' }, { hoy: HOY });
  const sinReg = eliminarRegistroMP(reg.estado, reg.registro.id, { ahora: `${HOY}T10:00:00.000Z` });
  eq(datosManosPies(sinReg.estado).registrosManosPies.length, 0, 'un registro también se borra');
  eq(datosManosPies(restaurarEnMP(sinReg.estado, sinReg.entrada).estado).registrosManosPies.length, 1,
    'y vuelve por la misma puerta');
  eq(eliminarRutinaMP(CON_TODO, 'fantasma').error, 'Esa rutina no existe.', 'borrar lo que no existe se dice');

  /* Prueba 15 — *"comprobar que no existen duplicados"*. */
  const claves = Object.keys(CATALOGO_PAPELERA);
  eq(claves.length, [...new Set(claves)].length, 'prueba 15 — ni una clave repetida en el catálogo');
  eq(COLECCIONES_EH.map((c) => c.id).length, [...new Set(COLECCIONES_EH.map((c) => c.id))].length,
    'ni en las colecciones de la F41');
}

/* ---------------------------------------------------------------------------
   10 · GUARDAR Y VOLVER A LEER (regla 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · Lo guardado sobrevive al siguiente guardado');
  eq(Object.keys(DEFAULT_MANOS_PIES).sort(),
    ['hechos', 'productos', 'registrosManosPies', 'rutinasManosPies', 'secciones', 'seguimiento'],
    'el almacén tiene seis llaves');
  let e = configurarSeccion(CON_TODO, SECCION_UNAS, { frecuencia: 'mensual', longitud: 'cortas', notas: 'Cortas' }, { hoy: HOY }).estado;
  e = usarPlantillaMP(e, 'unas', { confirmado: true, hoy: HOY }).estado;
  e = alternarSeguimientoMP(e);
  e = registrarMP(e, { seccion: SECCION_UNAS, nota: 'Hecho' }, { hoy: HOY }).estado;
  const guardado = datosManosPies(e);
  eq(normalizarManosPies(JSON.parse(JSON.stringify(guardado))), guardado,
    '⚠️ guardar y volver a leer devuelve exactamente lo mismo');
  eq(normalizarRegistroMP({ fecha: HOY, seccion: 'ombligo' }).seccion, 'unas',
    'una sección inventada en un registro no revive');
  eq(normalizarRegistroMP({ seccion: 'unas' }), null, 'y sin fecha no hay registro');
  eq(normalizarManosPies({ productos: ['a', 'a', 7] }).productos, ['a'],
    'los ids repetidos y los que no son texto se caen');
  eq(normalizarManosPies(null), normalizarManosPies({}),
    'y sin nada guardado sale lo mismo que con un objeto vacío');
  eq(Object.keys(normalizarManosPies(null)).sort(), Object.keys(DEFAULT_MANOS_PIES).sort(),
    'con las mismas seis llaves que declara el `DEFAULT`');
  ok(IDS_SECCIONES_MP.every((id) => !!normalizarManosPies(null).secciones[id]),
    '⚠️ y las tres secciones nacen con su configuración vacía, no sin existir');
  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_HIGIENE).config;
  ok('manosPies' in cfg && 'cuerpoHigiene' in cfg,
    '⚠️ y convive con lo que guardaron la F18 y la F19 en el mismo módulo (regla 5)');
}

/* ---------------------------------------------------------------------------
   11 · NUNCA UN DIAGNÓSTICO, Y LA PANTALLA (apartado 5 y regla 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n11 · Ni un diagnóstico, y la pantalla');
  eq(auditarMP(CON_TODO).textosClinicos, [],
    '⚠️ apartado 5 — ni un texto clínico: *"no convertirlo en un apartado médico"*');
  ok(textosDeMP().every((t) => sinDiagnostico(t)), 'el barrido pasa por todos los textos de la fase');
  ok(textosDeMP().length > 30, 'y hay textos de sobra que barrer');

  eq(FASES_CH_LISTAS.includes(22), true, 'la F22 ya está en las fases construidas');
  const panel = panelCH(CON_TODO, MODULO_HIGIENE);
  const plaquita = panel.plaquitas.find((p) => p.id === 'manosPies');
  eq(plaquita.lista, true, '⚠️ y su plaquita ABRE, en vez de anunciar otra fase');
  eq(plaquita.texto, null, 'sin el "esto llega más adelante" de antes');
  ok(plaquitasDe(MODULO_HIGIENE).some((p) => p.id === 'manosPies' && p.fase === 22),
    'y sigue declarando de qué fase es');

  const p = panelMP(BASE);
  eq(p.secciones.length, 3, 'el panel trae las tres secciones');
  eq(p.secciones.find((s) => s.id === 'unas').activa, false, 'con su interruptor');
  eq(panelMP(alternarParteCH(alternarParteCH(BASE, MODULO_HIGIENE, 'manos'), MODULO_HIGIENE, 'pies')).vacio,
    TEXTOS_MP.vacio, '⚠️ y sin ninguna encendida, lo dice');
  eq(lineaMP(BASE), '🤲 🦶', 'la portada enseña los iconos de lo que tiene');
  eq(resumenMP(CON_TODO).ultimo, null, '⚠️ sin nada registrado no hay última fecha: null');

  ok(LINEAS_DE_PLAQUITA.higiene.some((l) => l.id === 'manosPies'), 'tiene su línea en la portada (F30)');
  ok(FUENTES_BUSQUEDA.some((f) => f.id === 'manosPies'), 'y su fuente en el buscador (F37)');
  eq(FUENTES_BUSQUEDA.find((f) => f.id === 'manosPies').lista(CON_TODO).length, 3,
    '⚠️ que devuelve las secciones encendidas, con el campo que lee el buscador');
  ok(COLECCIONES_EH.some((c) => c.id === 'higiene.rutinasManosPies'), 'su vacío está en la F41');
  ok(METRICAS_PROGRESO.some((m) => m.id === 'manospies_registros' && !m.porDefecto),
    'su métrica en la F35, y apagada');
  ok(TIPOS_AVISO_EH.some((t) => t.id === 'cortar_unas' && !t.porDefecto),
    '⚠️ y su aviso en la F38, apagado y con el texto del apartado 7');
  ok(LIBRERIAS_EH.includes('manosPies'), 'y la librería entra en la auditoría de privacidad (F43)');

  ok(/export function ManosPiesEH/.test(VISTA), 'la pantalla existe');
  ok(/import \{[\s\S]*?panelMP[\s\S]*?\} from '\.\.\/lib\/manosPies'/.test(VISTA),
    '⚠️ y la vista IMPORTA la librería: no recalcula nada');
  ok(/eliminarConPapelera\('higiene', 'rutinasManosPies', id\)/.test(APP)
    && /eliminarConPapelera\('higiene', 'registrosManosPies', id\)/.test(APP),
    '⚠️ y App.jsx las manda por la ÚNICA puerta de borrado, con su nombre escrito');
  ok(/restaurarEnMP\(estiloHombre, entrada\)/.test(APP), 'y las devuelve por la misma');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
