// ============================================================================
// EH · Fase 19/65 — Cuerpo e higiene: rutinas y recomendaciones
//
// Lo que gobierna la fase, y lo que estas pruebas vigilan:
//   · ni un motor nuevo: rutinas (F14), reglas (F16) y productos (F17)
//   · el ejemplo del apartado 2 se REPARTE entre los dos módulos (C-25)
//   · el seguimiento es DERIVADO: ni un registro nuevo
//   · "ya tienes un producto que podría servir" manda sobre recomendar otro
//   · ni inventario, ni papelera, ni calendario propios
//   · nada se enciende solo, y omitir no penaliza
//
// Y las dieciocho pruebas que pide el apartado 19, una a una.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import {
  MODULO_HIGIENE, MODULO_CUERPO, MODULOS_CH, PARTES_HIGIENE, PARTES_CUERPO,
  alternarParteCH, parteActivaCH, contestarCH, elegirPartesCH, panelCH,
  plaquitasDe, FASES_CH_LISTAS,
} from '../src/lib/cuerpoHigiene.js';
import { crearProductoPiel, alternarMioPiel } from '../src/lib/productosPiel.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { COLECCIONES_EH } from '../src/lib/estadosEstilo.js';
import { METRICAS_PROGRESO } from '../src/lib/progresoEstilo.js';
import { TIPOS_AVISO_EH } from '../src/lib/avisosEstilo.js';
import { NOMBRES_ORIGEN } from '../src/lib/calendarioIntegracion.js';
import { FUENTES_BUSQUEDA } from '../src/lib/buscadorEstilo.js';
import { LINEAS_DE_PLAQUITA } from '../src/lib/pantallaEH.js';
import { LIBRERIAS_EH } from '../src/lib/privacidadEstilo.js';
import {
  PASOS_CUERPO, pasoCuerpo, pasosDeModulo, pasosParaNivelCuerpo,
  FRECUENCIAS_CUERPO, frecuenciaCuerpo, MOMENTOS_CUERPO, PLANTILLAS_CUERPO,
  plantillaCuerpo, BOTONES_PLANTILLA, plantillasSugeridasCuerpo, usarPlantillaCuerpo,
  DEFAULT_RUTINAS_CUERPO, normalizarRutinasCuerpo, datosRutinasCuerpo, rutinasCuerpo,
  rutinaCuerpo, crearRutinaCuerpo, editarRutinaCuerpo, anadirPasoCuerpo, quitarPasoCuerpo,
  ordenarPasosCuerpo, asignarProductoCuerpo, alternarRecordatorioCuerpo,
  impactoEliminarRutinaCuerpo, eliminarRutinaCuerpo, restaurarRutinaCuerpo,
  tocaEnFechaCuerpo, rutinasDeHoyCuerpo, checklistCuerpo, marcarPasoCuerpo,
  omitirPasoCuerpo, marcarRutinaCuerpoEntera, seguimientoCuerpo, ultimosDiasCuerpo,
  eventosDeCuerpo, catalogoParaCuerpo, productosDeCuerpo, marcarProductoCuerpo,
  quitarProductoCuerpo, alternativasDeCuerpo, REGLAS_CUERPO, reglaCuerpo,
  IDS_REGLAS_CUERPO, MOTIVOS_DESCARTE_CUERPO, contextoParaCuerpo, recomendarCuerpo,
  descartarCuerpo, deshacerDescarteCuerpo, marcarVistasCuerpo, guardarRecomendacionCuerpo,
  anadirARutinaCuerpo, categoriasQueEncajan, productosRecomendadosCuerpo,
  packSugeridoCuerpo, crearPackCuerpo, verPackCuerpo, packsCuerpo, eliminarPackCuerpo,
  EQUIVALENCIAS_CATEGORIA, SIN_EQUIVALENTE, categoriaCHDe,
  CONEXIONES_CUERPO, resumenRutinasCuerpo, lineaRutinasCuerpo, panelRutinasCuerpo,
  textosDeRutinasCuerpo, auditarRutinasCuerpo, TEXTOS_PRODUCTOS_CUERPO,
  PARTE_RUTINAS, PARTE_RECOMENDACIONES, PARTE_PRODUCTOS, PARTE_SEGUIMIENTO,
  sinDiagnostico, tonoCorrecto,
} from '../src/lib/rutinasCuerpo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const FUENTE = readFileSync(new URL('../src/lib/rutinasCuerpo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const VISTA = readFileSync(new URL('../src/views/EstiloHombreView.jsx', import.meta.url), 'utf8');
const APP = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const LOS_DOS = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['higiene', 'cuerpo', 'skincare']);
const HOY = '2026-03-02'; // un lunes
const crear = (e, mod, datos) => crearRutinaCuerpo(e, mod, datos, { hoy: HOY });

console.log('\n🚿 EH · Fase 19/65 — Cuerpo e higiene: rutinas y recomendaciones\n');

/* ---------------------------------------------------------------------------
   1 · NI UN MOTOR NUEVO (decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Ni un motor nuevo: se llama a los que ya existen');
  const a = auditarRutinasCuerpo(LOS_DOS);
  eq(a.motoresNuevos, 0, '⚠️ ni un motor nuevo');
  eq(a.motorRutinas, 'motorRutinas.js', 'las rutinas son las de la F14');
  eq(a.motorReglas, 'motorRecomendaciones.js', 'las reglas son las de la F16');
  eq(a.motorProductos, 'motorProductos.js', 'y los productos los de la F17');
  eq([a.catalogosNuevos, a.papelerasNuevas, a.calendariosNuevos], [0, 0, 0],
    '⚠️ ni inventario, ni papelera, ni calendario propios (apartado 18)');
  eq(a.almacenesDeSeguimiento, 0, '⚠️ y ni un almacén de seguimiento (decisión 3)');
  eq(a.usaIA, 0, '⚠️ sin IA, como dice el objetivo de la fase');
  eq([a.rachas, a.puntos, a.niveles], [0, 0, 0],
    '⚠️ ni rachas, ni puntos, ni niveles (apartado 16 + D2-02)');

  ok(/from '\.\/motorRutinas'/.test(FUENTE), 'importa el motor de rutinas de verdad');
  ok(/from '\.\/motorRecomendaciones'/.test(FUENTE), 'y el de recomendaciones');
  ok(/from '\.\/motorProductos'/.test(FUENTE), 'y el de productos');
  ok(!/function tocaEnFecha\w*\s*\(rutina, fechaISO, tipoDe\)/.test(SIN_COMENTARIOS),
    '⚠️ y no reescribe el cálculo de qué toca hoy');
  ok(!/localStorage|saveData\s*\(/.test(SIN_COMENTARIOS),
    'no guarda por su cuenta: escribe en la config de su módulo');
}

/* ---------------------------------------------------------------------------
   2 · EL EJEMPLO DEL APARTADO 2, REPARTIDO (decisión 2 · C-25)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · El ejemplo del apartado 2 se reparte entre los dos apartados');
  eq(PLANTILLAS_CUERPO.length, 2, 'dos plantillas, una por módulo');
  eq(plantillaCuerpo('basica').modulo, MODULO_HIGIENE, 'la básica es de Higiene');
  eq(plantillaCuerpo('basica').pasos, ['ducha', 'higiene', 'desodorante'],
    '⚠️ con los TRES pasos del ejemplo que son de Higiene');
  eq(plantillaCuerpo('hidratacion').modulo, MODULO_CUERPO, 'y la de hidratación, de Cuidado corporal');
  eq(plantillaCuerpo('hidratacion').pasos, ['hidratacion'],
    '⚠️ con el cuarto del ejemplo, que es el suyo');

  const a = auditarRutinasCuerpo(LOS_DOS);
  eq(a.pasosSinModulo, [], 'ningún paso se queda sin módulo válido');
  eq(a.plantillasSinModulo, [], 'ni ninguna plantilla');
  ok(pasosDeModulo(MODULO_HIGIENE).every((p) => p.de === MODULO_HIGIENE || p.de === null),
    'Higiene solo ofrece los suyos');
  ok(pasosDeModulo(MODULO_CUERPO).every((p) => p.de === MODULO_CUERPO || p.de === null),
    'y Cuidado corporal los suyos');
  ok(pasosDeModulo(MODULO_HIGIENE).some((p) => p.id === 'otros')
    && pasosDeModulo(MODULO_CUERPO).some((p) => p.id === 'otros'),
    '⚠️ y "Otro" está en los dos, que es para lo que existe');
  ok(!pasosDeModulo(MODULO_HIGIENE).some((p) => p.id === 'hidratacion'),
    '⚠️ un paso de Cuerpo NO se ofrece dentro de Higiene');

  const conRutina = crear(LOS_DOS, MODULO_HIGIENE, { nombre: 'X' });
  const r = anadirPasoCuerpo(conRutina.estado, MODULO_HIGIENE, conRutina.rutina.id, 'hidratacion');
  eq(r.error, 'Ese paso no es de este apartado.',
    '⚠️ y si se intenta, se dice — no se cuela');
}

/* ---------------------------------------------------------------------------
   3 · LAS SEIS FRECUENCIAS, SOBRE CUATRO COMPORTAMIENTOS (apartado 6)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Las seis frecuencias del apartado 6');
  eq(FRECUENCIAS_CUERPO.map((f) => f.nombre), [
    'Diario', 'Determinados días', 'Varias veces por semana', 'Semanal',
    'Cada X días', 'Personalizada',
  ], 'las seis, con las palabras de Josué');
  eq([...new Set(FRECUENCIAS_CUERPO.map((f) => f.tipo))].sort(),
    ['cada_x', 'diaria', 'dias', 'ninguna'],
    '⚠️ y por debajo solo hay cuatro comportamientos, los del motor');

  const diaria = { activa: true, frecuencia: 'diario', desde: HOY, dias: [], cada: 2 };
  ok(tocaEnFechaCuerpo(diaria, HOY) && tocaEnFechaCuerpo(diaria, '2026-03-03'), 'diario toca todos los días');
  const lunes = { activa: true, frecuencia: 'dias', dias: [1], desde: HOY, cada: 2 };
  ok(tocaEnFechaCuerpo(lunes, HOY) && !tocaEnFechaCuerpo(lunes, '2026-03-03'), 'los días concretos, solo esos');
  const cada3 = { activa: true, frecuencia: 'cada_x', cada: 3, desde: HOY, dias: [] };
  ok(tocaEnFechaCuerpo(cada3, '2026-03-05') && !tocaEnFechaCuerpo(cada3, '2026-03-04'), 'cada X días cuenta desde su inicio');
  const libre = { activa: true, frecuencia: 'personalizada', desde: HOY, dias: [], cada: 2 };
  ok(!tocaEnFechaCuerpo(libre, HOY),
    '⚠️ personalizada no toca ningún día por su cuenta: se hace cuando quiere');
  ok(!tocaEnFechaCuerpo({ ...diaria, activa: false }, HOY), 'y una rutina apagada no toca nunca');
  eq(MOMENTOS_CUERPO.length, 3, 'y los tres momentos del apartado 3');
}

/* ---------------------------------------------------------------------------
   4 · LAS PLANTILLAS SUGIEREN, NO CREAN (apartado 2)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Las plantillas sugieren; crear es otra llamada');
  const sugeridas = plantillasSugeridasCuerpo(LOS_DOS, MODULO_HIGIENE);
  eq(sugeridas.length, 1, 'a Higiene se le ofrece la suya');
  eq(sugeridas[0].guardada, false, '⚠️ escrito en el propio dato: verla no la crea');
  eq(sugeridas[0].botones, BOTONES_PLANTILLA, 'con los tres botones del enunciado');
  eq(Object.values(BOTONES_PLANTILLA), ['Usar esta rutina', 'Personalizar', 'Crear desde cero'],
    'y son los tres literales');

  const sin = usarPlantillaCuerpo(LOS_DOS, MODULO_HIGIENE, 'basica');
  eq(sin.sinConfirmar, true, '⚠️ sin confirmar NO escribe (regla 7)');
  eq(rutinasCuerpo(sin.estado, MODULO_HIGIENE).length, 0, 'y no ha aparecido ninguna rutina');

  const con = usarPlantillaCuerpo(LOS_DOS, MODULO_HIGIENE, 'basica', { confirmado: true, hoy: HOY });
  eq(rutinasCuerpo(con.estado, MODULO_HIGIENE).length, 1, 'confirmando, sí');
  eq(rutinasCuerpo(con.estado, MODULO_HIGIENE)[0].pasos.length, 3, 'con sus tres pasos');
  eq(plantillasSugeridasCuerpo(con.estado, MODULO_HIGIENE).length, 0,
    'y ya no se vuelve a ofrecer la misma');
  eq(usarPlantillaCuerpo(LOS_DOS, MODULO_HIGIENE, 'hidratacion', { confirmado: true }).error,
    'Esa plantilla no existe.',
    '⚠️ y la plantilla del otro apartado no se puede usar aquí');
}

/* ---------------------------------------------------------------------------
   5 · CREAR, EDITAR Y REORDENAR (apartados 3 y 15 · pruebas 1, 3, 4, 5, 6, 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Crear, editar, reordenar');
  eq(crear(LOS_DOS, MODULO_HIGIENE, { nombre: '  ' }).error, 'La rutina necesita un nombre.',
    'una rutina sin nombre no se crea');
  const c = crear(LOS_DOS, MODULO_HIGIENE, { nombre: 'Mañana', pasos: [{ accion: 'ducha' }], frecuencia: 'diario' });
  eq(c.error, null, 'prueba 1 — crear rutina');
  const id = c.rutina.id;
  eq(rutinaCuerpo(c.estado, MODULO_HIGIENE, id).nombre, 'Mañana', 'y se guarda con su nombre');
  eq(rutinaCuerpo(c.estado, MODULO_HIGIENE, id).recordatorio, false,
    '⚠️ apartado 7 — el recordatorio nace APAGADO');

  const conPaso = anadirPasoCuerpo(c.estado, MODULO_HIGIENE, id, 'desodorante');
  eq(rutinaCuerpo(conPaso.estado, MODULO_HIGIENE, id).pasos.length, 2, 'prueba 5 — añadir pasos');
  const pasos = rutinaCuerpo(conPaso.estado, MODULO_HIGIENE, id).pasos;
  const reordenada = ordenarPasosCuerpo(conPaso.estado, MODULO_HIGIENE, id, [pasos[1].id, pasos[0].id]);
  eq(rutinaCuerpo(reordenada.estado, MODULO_HIGIENE, id).pasos.map((p) => p.accion),
    ['desodorante', 'ducha'], 'prueba 6 — reordenarlos');
  const parcial = ordenarPasosCuerpo(conPaso.estado, MODULO_HIGIENE, id, [pasos[1].id]);
  eq(rutinaCuerpo(parcial.estado, MODULO_HIGIENE, id).pasos.length, 2,
    '⚠️ y lo que no venga en la lista se queda detrás, no se pierde');
  const quitado = quitarPasoCuerpo(conPaso.estado, MODULO_HIGIENE, id, pasos[0].id);
  eq(rutinaCuerpo(quitado.estado, MODULO_HIGIENE, id).pasos.length, 1, 'se puede quitar un paso');

  const otra = editarRutinaCuerpo(c.estado, MODULO_HIGIENE, id, { frecuencia: 'semanal', dias: [1] });
  eq(rutinaCuerpo(otra.estado, MODULO_HIGIENE, id).frecuencia, 'semanal', 'prueba 8 — cambiar frecuencia');
  eq(editarRutinaCuerpo(c.estado, MODULO_HIGIENE, id, { nombre: '   ' }).error,
    'La rutina necesita un nombre.',
    '⚠️ y borrarle el nombre a mano avisa igual que al crearla');
  eq(editarRutinaCuerpo(c.estado, MODULO_HIGIENE, 'no-existe', {}).error, 'Esa rutina no existe.',
    'una rutina que no existe se dice');

  const rec = alternarRecordatorioCuerpo(c.estado, MODULO_HIGIENE, id);
  eq(rutinaCuerpo(rec.estado, MODULO_HIGIENE, id).recordatorio, true, 'prueba 9 — activar recordatorio');
  eq(rutinaCuerpo(alternarRecordatorioCuerpo(rec.estado, MODULO_HIGIENE, id).estado, MODULO_HIGIENE, id).recordatorio,
    false, 'y desactivarlo');
}

/* ---------------------------------------------------------------------------
   6 · EL DÍA: MARCAR Y OMITIR (apartados 5 y 16 · pruebas 10 y 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · El checklist, y omitir sin penalización');
  let e = usarPlantillaCuerpo(LOS_DOS, MODULO_HIGIENE, 'basica', { confirmado: true, hoy: HOY }).estado;
  const id = rutinasCuerpo(e, MODULO_HIGIENE)[0].id;
  eq(rutinasDeHoyCuerpo(e, MODULO_HIGIENE, { hoy: HOY }).length, 1, 'la rutina diaria sale hoy');
  eq(checklistCuerpo(e, MODULO_HIGIENE, id, { hoy: HOY }).estado, 'pendiente',
    '⚠️ "Pendiente", nunca "has fallado"');

  const pasos = checklistCuerpo(e, MODULO_HIGIENE, id, { hoy: HOY }).pasos;
  e = marcarPasoCuerpo(e, MODULO_HIGIENE, id, pasos[0].id, { hoy: HOY });
  eq(checklistCuerpo(e, MODULO_HIGIENE, id, { hoy: HOY }).estado, 'a_medias', 'prueba 10 — marcar rutina');
  e = omitirPasoCuerpo(e, MODULO_HIGIENE, id, pasos[1].id, { hoy: HOY });
  e = marcarPasoCuerpo(e, MODULO_HIGIENE, id, pasos[2].id, { hoy: HOY });
  eq(checklistCuerpo(e, MODULO_HIGIENE, id, { hoy: HOY }).estado, 'hecha',
    '⚠️ prueba 11 — dos hechos y uno omitido es una rutina HECHA (sin penalización)');
  eq(checklistCuerpo(e, MODULO_HIGIENE, id, { hoy: HOY }).omitidos, 1, 'y el omitido se cuenta aparte');

  const entera = marcarRutinaCuerpoEntera(LOS_DOS, MODULO_HIGIENE, id, { hoy: HOY });
  eq(datosRutinasCuerpo(entera, MODULO_HIGIENE).hechos.length, 0,
    'marcar una rutina que no existe no rompe nada');
  const todo = marcarRutinaCuerpoEntera(e, MODULO_HIGIENE, id, { hoy: HOY });
  ok(checklistCuerpo(todo, MODULO_HIGIENE, id, { hoy: HOY }).hechos === 3, 'y "marcarlo todo" marca los tres');

  // ⚠️ El día siguiente empieza limpio: lo hecho vive en un registro con fecha.
  eq(checklistCuerpo(e, MODULO_HIGIENE, id, { hoy: '2026-03-03' }).hechos, 0,
    '⚠️ y mañana la lista vuelve a estar pendiente');
}

/* ---------------------------------------------------------------------------
   7 · EL SEGUIMIENTO ES DERIVADO (decisión 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · El seguimiento no guarda nada nuevo');
  eq(Object.keys(DEFAULT_RUTINAS_CUERPO).sort(), ['hechos', 'packs', 'productos', 'rutinas'],
    '⚠️ el almacén tiene cuatro llaves, y ninguna es un registro de seguimiento');
  ok(!/registros\s*:/.test(SIN_COMENTARIOS), '⚠️ y no aparece ningún `registros:` en el código');

  let e = usarPlantillaCuerpo(LOS_DOS, MODULO_CUERPO, 'hidratacion', { confirmado: true, hoy: HOY }).estado;
  const id = rutinasCuerpo(e, MODULO_CUERPO)[0].id;
  const sin = seguimientoCuerpo(e, MODULO_CUERPO, { hoy: HOY });
  eq(sin[0].hechas, 0, 'recién creada no hay nada hecho');
  const pasos = checklistCuerpo(e, MODULO_CUERPO, id, { hoy: HOY }).pasos;
  e = marcarPasoCuerpo(e, MODULO_CUERPO, id, pasos[0].id, { hoy: HOY });
  ok(seguimientoCuerpo(e, MODULO_CUERPO, { hoy: HOY })[0].hechas === 1, 'y con algo hecho, se cuenta');
  eq(ultimosDiasCuerpo(e, MODULO_CUERPO)[0].fecha, HOY, 'los últimos días salen de lo marcado');
  eq(ultimosDiasCuerpo(e, MODULO_CUERPO)[0].rutina, 'Hidratación corporal', 'con el nombre de su rutina');

  // Una rutina que nunca tocó no tiene porcentaje, ni 0 ni 100.
  const libre = crear(LOS_DOS, MODULO_CUERPO, { nombre: 'Cuando me apetezca', frecuencia: 'personalizada' });
  eq(seguimientoCuerpo(libre.estado, MODULO_CUERPO, { hoy: HOY })[0].cumplimiento, null,
    '⚠️ y sin días en los que tocara, el cumplimiento es null');
}

/* ---------------------------------------------------------------------------
   8 · LAS RECOMENDACIONES (apartados 8, 9 y 14 · pruebas 12 y 13)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Las recomendaciones: pocas, sin IA y explicadas');
  const a = auditarRutinasCuerpo(LOS_DOS);
  eq(a.conRequisitos, REGLAS_CUERPO.length, '⚠️ TODAS declaran qué datos necesitan');
  eq(a.conPorque, REGLAS_CUERPO.length, 'y todas dicen por qué aparecen');
  eq(a.textosClinicos, [], '⚠️ y ni un texto clínico: aquí no se diagnostica');
  eq(a.textosConTonoMalo, [], '⚠️ ni un "debes": el tono de la F16');
  ok(textosDeRutinasCuerpo().every((t) => sinDiagnostico(t) && tonoCorrecto(t)),
    'el barrido pasa por todos los textos de la fase');

  // Sin datos no se recomienda nada: la regla de oro del motor.
  eq(recomendarCuerpo(LOS_DOS, MODULO_CUERPO, {}, { hoy: HOY }).recomendaciones
    .filter((r) => r.id === 'anadir_hidratacion').length, 0,
    '⚠️ sin necesidades contestadas, la regla de hidratación NO se dispara');

  let e = contestarCH(LOS_DOS, MODULO_CUERPO, 'necesidadesCuerpo', 'hidratacion').estado;
  const rec = recomendarCuerpo(e, MODULO_CUERPO, {}, { hoy: HOY });
  ok(rec.recomendaciones.some((r) => r.id === 'anadir_hidratacion'),
    'contestada, sí — con el texto literal del apartado 8');
  eq(rec.recomendaciones.find((r) => r.id === 'anadir_hidratacion').texto,
    'Podrías añadir hidratación corporal a tu rutina.',
    '⚠️ y es exactamente el ejemplo del enunciado');
  ok(rec.recomendaciones.every((r) => !!r.porque), 'cada una trae su "por qué"');
  ok(rec.recomendaciones.length <= 3, '⚠️ "mostrar pocas opciones": tres como mucho');
  eq(rec.guardado, false, '⚠️ recomendar no escribe nada');

  // ⚠️ Una regla de Cuerpo no se ofrece dentro de Higiene.
  const enHigiene = recomendarCuerpo(contestarCH(LOS_DOS, MODULO_HIGIENE, 'necesidadesCuerpo', 'hidratacion').estado,
    MODULO_HIGIENE, {}, { hoy: HOY });
  ok(!enHigiene.recomendaciones.some((r) => r.id === 'anadir_hidratacion'),
    '⚠️ y una idea de Cuidado corporal no aparece en Higiene');

  // Apartado 8 — "Añadir" y "No me interesa".
  const anadida = anadirARutinaCuerpo(e, MODULO_CUERPO, 'anadir_hidratacion', null, { confirmado: true, hoy: HOY });
  eq(anadida.anadido, true, 'prueba 12 — recibir recomendación y añadirla');
  eq(rutinasCuerpo(anadida.estado, MODULO_CUERPO).length, 1, 'sin rutina previa, se crea una');
  eq(anadirARutinaCuerpo(e, MODULO_CUERPO, 'anadir_hidratacion', null).error, 'Hace falta confirmarlo.',
    '⚠️ y sin confirmar no toca la rutina (regla 7)');

  const desc = descartarCuerpo(e, MODULO_CUERPO, 'anadir_hidratacion', 'no_interesa', { hoy: HOY });
  ok(!recomendarCuerpo(desc.estado, MODULO_CUERPO, {}, { hoy: HOY }).recomendaciones
    .some((r) => r.id === 'anadir_hidratacion'), 'prueba 13 — ignorar recomendación, y se calla');
  ok(recomendarCuerpo(deshacerDescarteCuerpo(desc.estado, MODULO_CUERPO, 'anadir_hidratacion').estado,
    MODULO_CUERPO, {}, { hoy: HOY }).recomendaciones.some((r) => r.id === 'anadir_hidratacion'),
    '⚠️ y todo descarte se puede deshacer');
  eq(descartarCuerpo(e, MODULO_CUERPO, 'inventada', 'no_interesa').error, 'Esa recomendación no existe.',
    'una recomendación que no existe se dice');
  eq(descartarCuerpo(e, MODULO_CUERPO, 'anadir_hidratacion', 'porque_si').error, 'Ese motivo no existe.',
    'y un motivo que no existe, también');

  const vistas = marcarVistasCuerpo(e, MODULO_CUERPO, ['anadir_hidratacion'], { hoy: HOY });
  ok(recomendarCuerpo(vistas, MODULO_CUERPO, {}, { hoy: HOY }).recomendaciones
    .find((r) => r.id === 'anadir_hidratacion').vista, 'lo ya visto se marca aparte');
  eq(guardarRecomendacionCuerpo(e, MODULO_CUERPO, 'anadir_hidratacion').error, null, 'y se puede guardar');

  // Los seis criterios del apartado 9, y ni uno más de los que él ha dado.
  const ctx = contextoParaCuerpo(e, MODULO_CUERPO, {}, { hoy: HOY });
  ok(['necesidades', 'busca', 'sensible', 'minutos', 'nivel', 'productos'].every((k) => k in ctx),
    '⚠️ el contexto trae los SEIS criterios del apartado 9');
  eq(ctx.paraIA, false, '⚠️ y dice en el propio dato que esto no viaja a ninguna IA');
}

/* ---------------------------------------------------------------------------
   9 · PRODUCTOS: LO QUE YA TIENE MANDA (apartados 10, 11 y 12 · prueba 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Productos: primero lo que ya tiene');
  let e = contestarCH(LOS_DOS, MODULO_CUERPO, 'necesidadesCuerpo', 'hidratacion').estado;
  eq(catalogoParaCuerpo(e).length, 0, '⚠️ el catálogo empieza vacío, y es una decisión (D2-03)');
  eq(TEXTOS_PRODUCTOS_CUERPO.catalogo.length > 0, true, 'y se dice por qué, con la frase que ya existe');

  const p = crearProductoPiel(e, { nombre: 'Crema X', categoria: 'hidratante' }, { hoy: HOY });
  e = p.estado;
  eq(catalogoParaCuerpo(e).length, 1, '⚠️ y lo que hay son los productos de los inventarios que YA existen');
  eq(catalogoParaCuerpo(e)[0].moduloNombre, 'Skincare', 'con su origen a la vista');

  const marcado = marcarProductoCuerpo(e, MODULO_CUERPO, p.producto.id);
  eq(marcado.error, null, 'prueba 14 — guardar producto');
  eq(productosDeCuerpo(marcado.estado, MODULO_CUERPO).length, 1, 'y se ve desde aquí');
  eq(datosRutinasCuerpo(marcado.estado, MODULO_CUERPO).productos, [p.producto.id],
    '⚠️ guardado como ID, no como ficha: ni medio inventario nuevo');
  eq(marcarProductoCuerpo(marcado.estado, MODULO_CUERPO, p.producto.id).sinEfecto, true,
    'marcarlo dos veces no lo duplica');
  eq(marcarProductoCuerpo(e, MODULO_CUERPO, 'no-existe').error, 'Ese producto no existe.',
    'y un producto inventado no entra');
  eq(productosDeCuerpo(quitarProductoCuerpo(marcado.estado, MODULO_CUERPO, p.producto.id).estado, MODULO_CUERPO).length,
    0, 'quitarlo de aquí no lo borra de su módulo: solo deja de estar apuntado');

  /* ⚠️ 🐛 Las categorías del catálogo son las de Skincare, no las de aquí: por
     eso hay una tabla de equivalencias, y por eso esto usa `hidratante`. Sin
     ella, el apartado 11 no habría saltado nunca. */
  eq(EQUIVALENCIAS_CATEGORIA.hidratante, 'crema', 'un hidratante de Skincare cuenta como crema corporal');
  eq(SIN_EQUIVALENTE, ['gel', 'desodorante'],
    '⚠️ y las dos que hoy no tienen equivalente en ningún inventario, dichas');
  eq(categoriaCHDe({ categoria: 'champu' }), null, 'lo que no equivale a nada se queda en null');
  eq(categoriaCHDe({ categoria: 'gel' }), 'gel', 'y una categoría de aquí pasa tal cual');

  // Apartado 11 — con un producto suyo de esa categoría, no se recomienda otro.
  let conCrema = crearProductoPiel(e, { nombre: 'Crema mía', categoria: 'hidratante', mio: true }, { hoy: HOY });
  let e2 = marcarProductoCuerpo(conCrema.estado, MODULO_CUERPO, conCrema.producto.id).estado;
  e2 = anadirARutinaCuerpo(e2, MODULO_CUERPO, 'anadir_hidratacion', null, { confirmado: true, hoy: HOY }).estado;
  const pr = productosRecomendadosCuerpo(e2, MODULO_CUERPO, {});
  ok(pr.yaTienes.some((x) => x.categoria === 'crema'),
    '⚠️ apartado 11 — "ya tienes un producto que podría servir para esto"');
  eq(pr.yaTienes[0].texto, 'Ya tienes un producto que podría servir para esto.', 'con su texto literal');
  ok(!pr.sugeridos.some((s) => s.categoria === 'crema'),
    '⚠️ y de esa categoría NO se recomienda otro: "esto evita gastar dinero sin motivo"');
  ok(pr.sugeridos.every((s) => s.vacio || s.opciones.length > 0),
    '⚠️ y donde no hay nada, se dice — no se inventa un producto');

  // Apartado 12 — alternativas, del motor.
  const dos = crearProductoPiel(e2, { nombre: 'Crema Y', categoria: 'hidratante' }, { hoy: HOY });
  ok(alternativasDeCuerpo(dos.estado, conCrema.producto.id).some((x) => x.nombre === 'Crema Y'),
    'las alternativas son las de la misma categoría, disponibles');
}

/* ---------------------------------------------------------------------------
   10 · PACKS (apartado 13 · prueba 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · El pack se sugiere, no se compra');
  const pack = packSugeridoCuerpo(LOS_DOS, MODULO_CUERPO, {});
  eq(pack.items.map((i) => i.categoria), ['gel', 'desodorante', 'crema'],
    'las tres cosas del ejemplo del enunciado');
  eq(pack.creado, false, '⚠️ escrito en el propio dato: verlo no lo crea');
  ok(/no compra nada/.test(pack.aviso), '⚠️ y se dice que esto no compra nada');

  const p = crearProductoPiel(LOS_DOS, { nombre: 'Gel', categoria: 'gel' }, { hoy: HOY });
  const creado = crearPackCuerpo(p.estado, MODULO_CUERPO, 'Mi pack', [p.producto.id], { hoy: HOY });
  eq(creado.error, null, 'prueba 15 — crear pack');
  eq(packsCuerpo(creado.estado, MODULO_CUERPO).length, 1, 'y queda guardado');
  eq(verPackCuerpo(creado.estado, MODULO_CUERPO, creado.pack.id).total, 1, 'con lo que lleva dentro');
  eq(crearPackCuerpo(LOS_DOS, MODULO_CUERPO, '  ').error, 'El pack necesita un nombre.',
    'un pack sin nombre no se crea');
  const fantasma = crearPackCuerpo(LOS_DOS, MODULO_CUERPO, 'Vacío', ['fantasma']);
  eq(verPackCuerpo(fantasma.estado, MODULO_CUERPO, fantasma.pack.id).total, 0,
    '⚠️ un id que no existe no entra en el pack');
  eq(packsCuerpo(eliminarPackCuerpo(creado.estado, MODULO_CUERPO, creado.pack.id).estado, MODULO_CUERPO).length, 0,
    'y se puede deshacer');
}

/* ---------------------------------------------------------------------------
   11 · EL NIVEL NO CONVIERTE ESTO EN ALGO EXCESIVO (apartado 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n11 · El nivel filtra lo que se ofrece, nunca lo guardado');
  eq(pasosParaNivelCuerpo(MODULO_CUERPO, 'basico').map((p) => p.id).sort(),
    ['hidratacion', 'otros'], 'en básico se ofrece lo imprescindible');
  ok(pasosParaNivelCuerpo(MODULO_CUERPO, 'intermedio').length > pasosParaNivelCuerpo(MODULO_CUERPO, 'basico').length,
    'el intermedio abre más opciones');
  eq(pasosParaNivelCuerpo(MODULO_CUERPO, null).length, pasosDeModulo(MODULO_CUERPO).length,
    '⚠️ y sin nivel elegido se ofrece todo: esconder opciones sería decidir por él');

  // ⚠️ Cambiar de nivel no borra ninguna rutina.
  let e = usarPlantillaCuerpo(LOS_DOS, MODULO_CUERPO, 'hidratacion', { confirmado: true, hoy: HOY }).estado;
  const antes = rutinasCuerpo(e, MODULO_CUERPO).length;
  e = contestarCH(e, MODULO_CUERPO, 'nivelCuerpo', 'basico').estado;
  eq(rutinasCuerpo(e, MODULO_CUERPO).length, antes,
    '⚠️ cambiar de nivel NO borra la rutina que ya tenía');
}

/* ---------------------------------------------------------------------------
   12 · APAGAR NO BORRA (apartado 17 · pruebas 16, 17 y 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n12 · Los cuatro interruptores, y apagar no borra');
  [PARTE_RUTINAS, PARTE_RECOMENDACIONES, PARTE_PRODUCTOS].forEach((id) => {
    ok(PARTES_HIGIENE.some((p) => p.id === id) && PARTES_CUERPO.some((p) => p.id === id),
      `"${id}" tiene interruptor en los dos apartados`);
  });
  ok(PARTES_CUERPO.some((p) => p.id === PARTE_SEGUIMIENTO),
    'y el seguimiento, donde lo puso la F18: en Cuidado corporal');
  ok(!/PARTES_RUTINAS_CUERPO\s*=/.test(SIN_COMENTARIOS),
    '⚠️ y esta fase NO crea un segundo catálogo de interruptores: usa el de la F18');

  let e = usarPlantillaCuerpo(LOS_DOS, MODULO_CUERPO, 'hidratacion', { confirmado: true, hoy: HOY }).estado;
  const id = rutinasCuerpo(e, MODULO_CUERPO)[0].id;
  e = marcarProductoCuerpo(crearProductoPiel(e, { nombre: 'Gel', categoria: 'gel' }, { hoy: HOY }).estado,
    MODULO_CUERPO, productosDeCuerpo(e, MODULO_CUERPO).length === 0
      ? catalogoParaCuerpo(crearProductoPiel(e, { nombre: 'Gel', categoria: 'gel' }, { hoy: HOY }).estado)[0].id
      : 'x').estado;

  const apagado = alternarParteCH(e, MODULO_CUERPO, PARTE_RUTINAS);
  eq(parteActivaCH(apagado, MODULO_CUERPO, PARTE_RUTINAS), false, 'prueba 16 — desactivar rutinas');
  eq(rutinasCuerpo(apagado, MODULO_CUERPO).length, 1, '⚠️ y la rutina SIGUE guardada: apagar no borra');
  eq(rutinasDeHoyCuerpo(apagado, MODULO_CUERPO, { hoy: HOY }).length, 0, 'solo deja de salir hoy');
  eq(eventosDeCuerpo(apagado, HOY, HOY).length, 0, 'ni en el calendario');
  eq(recomendarCuerpo(alternarParteCH(e, MODULO_CUERPO, PARTE_RECOMENDACIONES), MODULO_CUERPO, {}).activo, false,
    'las recomendaciones se apagan por su cuenta');
  eq(productosRecomendadosCuerpo(alternarParteCH(e, MODULO_CUERPO, PARTE_PRODUCTOS), MODULO_CUERPO, {}).activo, false,
    'y los productos por la suya');
  /* ⚠️ El seguimiento nace APAGADO: su casilla va ☐ en el enunciado de la F18,
     y la F19 no la enciende por su cuenta. */
  eq(panelRutinasCuerpo(e, MODULO_CUERPO, {}).seguimiento, null,
    '⚠️ y el seguimiento empieza apagado, como su casilla ☐');
  ok(!!panelRutinasCuerpo(alternarParteCH(e, MODULO_CUERPO, PARTE_SEGUIMIENTO), MODULO_CUERPO, {}).seguimiento,
    'encendiéndolo, aparece — y sale de lo que ya estaba guardado');

  const encendido = alternarParteCH(apagado, MODULO_CUERPO, PARTE_RUTINAS);
  eq(rutinasDeHoyCuerpo(encendido, MODULO_CUERPO, { hoy: HOY }).length, 1,
    'prueba 17 — reactivarlo, y vuelve entero');
  eq(rutinaCuerpo(encendido, MODULO_CUERPO, id).nombre, 'Hidratación corporal',
    'prueba 18 — comprobar persistencia');

  // ⚠️ Y apagar Higiene no toca Cuidado corporal (apartado 17 de la F18).
  const soloHigiene = alternarParteCH(e, MODULO_HIGIENE, PARTE_RUTINAS);
  eq(parteActivaCH(soloHigiene, MODULO_CUERPO, PARTE_RUTINAS), true,
    '⚠️ y apagar las rutinas de Higiene no toca las de Cuidado corporal (C-25)');
}

/* ---------------------------------------------------------------------------
   13 · GUARDAR Y VOLVER A LEER (regla 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n13 · Lo guardado sobrevive al siguiente guardado');
  let e = crear(LOS_DOS, MODULO_HIGIENE, {
    nombre: 'Mañana', pasos: [{ accion: 'ducha' }], frecuencia: 'dias', dias: [1, 3],
    momento: 'manana', hora: '08:00',
  }).estado;
  const guardado = datosRutinasCuerpo(e, MODULO_HIGIENE);
  const releido = normalizarRutinasCuerpo(JSON.parse(JSON.stringify(guardado)));
  eq(releido, guardado, '⚠️ guardar y volver a leer devuelve exactamente lo mismo');
  eq(guardado.rutinas[0].momento, 'manana', 'el momento se conserva');
  eq(guardado.rutinas[0].hora, '08:00', 'y la hora');
  eq(normalizarRutinasCuerpo({ rutinas: [{ nombre: 'X', hora: '99:99' }] }).rutinas[0].hora, null,
    'una hora imposible se descarta, no se guarda');
  eq(normalizarRutinasCuerpo({ productos: ['a', 'a', 3] }).productos, ['a'],
    'los ids repetidos y los que no son texto se caen');
  eq(normalizarRutinasCuerpo(null), DEFAULT_RUTINAS_CUERPO, 'y sin nada guardado, el almacén vacío');
  // ⚠️ Y lo de la F18 sigue ahí después de escribir lo de la F19 (regla 5).
  const conLasDos = elegirPartesCH(e, MODULO_HIGIENE, ['higieneDiaria']);
  const cfg = normalizarEstiloHombre(conLasDos).modulos.find((m) => m.id === MODULO_HIGIENE).config;
  ok('rutinas' in cfg && 'cuerpoHigiene' in cfg,
    '⚠️ y convive con lo que guardó la F18 en el mismo módulo (regla 5)');
  eq(rutinasCuerpo(conLasDos, MODULO_HIGIENE).length, 1,
    'guardar el perfil de la F18 no se lleva las rutinas de la F19');
}

/* ---------------------------------------------------------------------------
   14 · LAS CONEXIONES GLOBALES (apartado 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n14 · Todo conectado con lo que ya existe');
  eq(CONEXIONES_CUERPO.length, 6, 'los seis sistemas que enumera el apartado 18');
  eq(auditarRutinasCuerpo(LOS_DOS).conexionesQueNoExisten, ['favoritos'],
    '⚠️ y el que NO existe se declara, en vez de fingirlo (como hizo la F39)');
  ok(CONEXIONES_CUERPO.filter((c) => c.existe).every((c) => !!c.entra),
    'cada uno de los otros dice por dónde entra');

  // Calendario.
  let e = usarPlantillaCuerpo(LOS_DOS, MODULO_HIGIENE, 'basica', { confirmado: true, hoy: HOY }).estado;
  const id = rutinasCuerpo(e, MODULO_HIGIENE)[0].id;
  eq(eventosDeCuerpo(e, HOY, HOY).length, 0,
    '⚠️ sin recordatorio no hay evento: nada se enciende solo');
  e = alternarRecordatorioCuerpo(e, MODULO_HIGIENE, id).estado;
  const ev = eventosDeCuerpo(e, HOY, '2026-03-03');
  eq(ev.length, 2, 'con recordatorio, un evento por día que toca');
  ok(ev.every((x) => x.soloLectura && x.origen === 'higiene'), 'derivados y de solo lectura');
  ok(ev[0].id.startsWith('higiene:'), 'y con su prefijo, para que el calendario sepa volver');
  ok(!!NOMBRES_ORIGEN.higiene && !!NOMBRES_ORIGEN.cuerpo, 'los dos orígenes tienen nombre en el calendario');

  // Papelera global.
  ok(!!CATALOGO_PAPELERA['higiene.rutinas'] && !!CATALOGO_PAPELERA['cuerpo.rutinas'],
    '⚠️ las dos colecciones están en la papelera GLOBAL (ME F3)');
  const impacto = impactoEliminarRutinaCuerpo(e, MODULO_HIGIENE, id);
  ok(/Se borrará/.test(impacto.texto), '⚠️ y antes de borrar se dice qué se lleva');
  const borrada = eliminarRutinaCuerpo(e, MODULO_HIGIENE, id, { ahora: `${HOY}T10:00:00.000Z` });
  eq(rutinasCuerpo(borrada.estado, MODULO_HIGIENE).length, 0, 'se va de la lista');
  ok(!!borrada.entrada, 'y devuelve su entrada de papelera, que guarda App.jsx');
  eq(datosRutinasCuerpo(borrada.estado, MODULO_HIGIENE).hechos.length, 0,
    'sus marcas se van con ella: sin la rutina no significan nada');
  const vuelta = restaurarRutinaCuerpo(borrada.estado, MODULO_HIGIENE, borrada.entrada);
  eq(rutinasCuerpo(vuelta.estado, MODULO_HIGIENE).length, 1, 'y vuelve entera desde la papelera');
  eq(eliminarRutinaCuerpo(LOS_DOS, MODULO_HIGIENE, 'no-existe').error, 'Esa rutina no existe.',
    'borrar algo que no existe se dice');

  // Los catálogos que la F18 dejó anunciados.
  ok(COLECCIONES_EH.some((c) => c.id === 'higiene.rutinas') && COLECCIONES_EH.some((c) => c.id === 'cuerpo.rutinas'),
    '⚠️ `COLECCIONES_EH` (F41) — las dos listas, con su vacío y su botón');
  ok(METRICAS_PROGRESO.some((m) => m.id === 'higiene_hechas') && METRICAS_PROGRESO.some((m) => m.id === 'cuerpo_hechas'),
    '⚠️ `METRICAS_PROGRESO` (F35) — las dos métricas que la F18 anunció');
  ok(METRICAS_PROGRESO.filter((m) => ['higiene_hechas', 'cuerpo_hechas'].includes(m.id)).every((m) => !m.porDefecto),
    'y apagadas por defecto: aquí no se cuenta nada sin pedirlo');
  ok(TIPOS_AVISO_EH.some((t) => t.id === 'rutina_higiene') && TIPOS_AVISO_EH.some((t) => t.id === 'rutina_cuerpo'),
    'los dos avisos están en el catálogo de la F38');
  ok(TIPOS_AVISO_EH.filter((t) => ['rutina_higiene', 'rutina_cuerpo'].includes(t.id)).every((t) => !t.porDefecto),
    '⚠️ y los dos nacen apagados (apartado 7)');
  ok(FUENTES_BUSQUEDA.some((f) => f.id === 'rutinasHigiene') && FUENTES_BUSQUEDA.some((f) => f.id === 'rutinasCuerpo'),
    'y las rutinas se pueden buscar (F37)');
  eq(FUENTES_BUSQUEDA.find((f) => f.id === 'rutinasHigiene').lista(vuelta.estado).length, 1,
    '⚠️ y la fuente devuelve la lista de verdad, con el campo que lee el buscador');
  ok(LIBRERIAS_EH.includes('rutinasCuerpo') && LIBRERIAS_EH.includes('cuerpoHigiene'),
    'y las dos librerías entran en la auditoría de privacidad (F43)');
}

/* ---------------------------------------------------------------------------
   15 · LA PANTALLA (regla 8 y el reparto de siempre)
   --------------------------------------------------------------------------- */
{
  console.log('\n15 · La pantalla');
  eq(FASES_CH_LISTAS, [18, 19], 'las fases construidas se declaran en un sitio, no en un `===`');
  const panel = panelCH(LOS_DOS, MODULO_CUERPO);
  ok(panel.plaquitas.find((p) => p.id === 'rutina').lista,
    '⚠️ la plaquita "Mi rutina" ya está lista, y deja de anunciar otra fase');
  ok(panel.plaquitas.find((p) => p.id === 'recomendaciones').lista, 'y la de recomendaciones');
  ok(plaquitasDe(MODULO_HIGIENE).some((p) => p.id === 'manosPies' && p.fase === 22),
    '⚠️ y la de manos y pies sigue diciendo que llega en la F22 (regla 8)');
  eq(panelCH(LOS_DOS, MODULO_HIGIENE).plaquitas.find((p) => p.id === 'manosPies').lista, false,
    'sin abrir una pantalla vacía');

  const p = panelRutinasCuerpo(LOS_DOS, MODULO_CUERPO, {});
  eq(p.vacio, 'Crea tu primera rutina', '⚠️ apartado 1 — el vacío, con las palabras del enunciado');
  ok(p.tarjetas.length === 0 && p.plantillas.length === 1, 'y la plantilla que se ofrece');
  const conUna = usarPlantillaCuerpo(LOS_DOS, MODULO_CUERPO, 'hidratacion', { confirmado: true, hoy: HOY }).estado;
  eq(panelRutinasCuerpo(conUna, MODULO_CUERPO, {}).tarjetas[0].linea, '1 paso',
    '⚠️ apartado 4 — la tarjeta dice cuántos pasos, no cuáles');
  eq(lineaRutinasCuerpo(LOS_DOS, MODULO_CUERPO), null, 'sin rutinas, la portada no dice nada');
  eq(lineaRutinasCuerpo(conUna, MODULO_CUERPO), '1 rutina', 'y con una, lo dice en una línea');
  ok(LINEAS_DE_PLAQUITA.higiene.some((l) => l.id === 'rutinas')
    && LINEAS_DE_PLAQUITA.cuerpo.some((l) => l.id === 'rutinas'),
    'la portada tiene su línea en los dos apartados (F30)');
  eq(resumenRutinasCuerpo(conUna, MODULO_CUERPO, { hoy: HOY }).ultimo, null,
    '⚠️ sin nada marcado no hay última fecha: null, no una inventada');

  ok(/export function RutinaCuerpoEH/.test(VISTA), 'la pantalla de la rutina existe');
  ok(/export function RecomendacionesCuerpoEH/.test(VISTA), 'y la de las recomendaciones');
  ok(/import \{[\s\S]*?panelRutinasCuerpo[\s\S]*?\} from '\.\.\/lib\/rutinasCuerpo'/.test(VISTA),
    '⚠️ y la vista IMPORTA la librería: no recalcula nada por su cuenta');
  ok(/onEliminarRutina\(modulo, t\.id\)/.test(VISTA),
    '⚠️ la pantalla no borra: avisa a App.jsx, que es el dueño de la papelera');
  /* ⚠️ Con el módulo ESCRITO, no como variable: la auditoría de ME F4 lee
     App.jsx buscando el par módulo/colección, y con una variable no habría visto
     ninguna de las dos. Lo cazó ella misma. */
  ok(/eliminarConPapelera\('higiene', 'rutinas', id\)/.test(APP)
    && /eliminarConPapelera\('cuerpo', 'rutinas', id\)/.test(APP),
    'y App.jsx las manda por la ÚNICA puerta de borrado de la app (ME F3)');
  ok(/restaurarRutinaCuerpo\(estiloHombre, entrada\.modulo, entrada\)/.test(APP),
    'y la devuelve por la misma');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
