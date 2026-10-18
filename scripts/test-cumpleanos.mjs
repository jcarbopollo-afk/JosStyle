// ============================================================================
// 🎂 CUMPLEAÑOS — la cuarta sección de Mente (2026-10-18)
//
// Las once pruebas que pidió Josué, en Node (la parte de tocar con el dedo está
// en la sección «CUMPLEAÑOS» del recorrido de Chromium):
//    1 crear · 2 validar nombre y fecha · 3 persistir al recargar · 4 cada año
//    sin duplicados · 5 el próximo, antes y después de la fecha de este año ·
//    6 bisiestos y cambio de año · 7 editar y eliminar · 8 el Calendario ·
//    9 desactivar y reactivar sin perder nada · 10 movimiento y navegación ·
//   11 sin romper Mente ni lo demás.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_CUMPLEANOS, validarCumpleanos, crearCumpleanos, editarCumpleanos, formularioDeCumpleanos,
  proximoCumpleanos, ordenarPorProximo, textoDelProximo, textoDeLaFecha, fechaEnAnio, esBisiesto, diasDelMes,
  eventosDeCumpleanos, cumpleanosActivo, normalizarCumpleanos, filasDeCumpleanosParaExportar, ANIO_ANCLA_SIN_ANIO,
} from '../src/lib/cumpleanos.js';
import { expandirRecurrentes } from '../src/lib/calendario.js';
import { eventosDerivados, NOMBRES_ORIGEN } from '../src/lib/calendarioIntegracion.js';
import { CATALOGO_PAPELERA, prepararEliminacion, prepararRestauracion } from '../src/lib/papelera.js';
import { APPS_MENTE, agrupadorDeApp, appProtegida } from '../src/lib/agrupadores.js';
import { ARBOL_DIST, auditarReubicados } from '../src/lib/auditoriaDist.js';
import { NOMBRES_DE_CLAVE, auditarAsincronia } from '../src/lib/estadosAsincronos.js';
import { AVISOS_ACCION } from '../src/lib/accionesHoyAgenda.js';
import { auditarLayout } from '../src/lib/layoutMotion.js';
import { auditarComponentesMotion } from '../src/lib/microinteraccionesMotion.js';
import { auditarOrquestacion } from '../src/lib/orquestadorMotion.js';
import { auditarAccesibilidadMotion } from '../src/lib/accesibilidadMotion.js';
import { auditarPulido } from '../src/lib/pulidoMotion.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '{}');
const VISTA_BRUTA = leer('src/views/CumpleanosView.jsx');
const VISTA = sinComentarios(VISTA_BRUTA);
const APP = sinComentarios(leer('src/App.jsx'));
const AGRUP = sinComentarios(leer('src/views/AgrupadorView.jsx'));
const PERS = sinComentarios(leer('src/views/PersonalizationView.jsx'));
const CSS = leer('src/index.css');

const HOY = '2026-10-18';
const marta = crearCumpleanos({ nombre: '  Marta  ', dia: '12', mes: '5', anio: '2008', relacion: 'Amiga' }, { hoy: HOY });
const leo = crearCumpleanos({ nombre: 'Leo', dia: '29', mes: '2', anio: '', relacion: '' }, { hoy: HOY });

console.log('\n1 · Crear');
ok(marta && typeof marta.id === 'string' && marta.id, 'nace con su id');
eq([marta.nombre, marta.dia, marta.mes, marta.anio, marta.relacion], ['Marta', 12, 5, 2008, 'Amiga'], 'guarda la fecha ORIGINAL (día, mes, año) y la relación');
ok(!('proximo' in marta) && !('siguiente' in marta), '🚨 no guarda la próxima celebración: se calcula');
eq([leo.anio, leo.relacion], [null, null], 'sin año y sin relación: los dos opcionales, `null`');
ok(typeof marta.creado === 'string' && marta.creado === marta.actualizado, 'apunta cuándo se creó');

console.log('\n2 · Validar el nombre y la fecha');
const val = (f, o = {}) => validarCumpleanos(f, { hoy: HOY, ...o });
ok(val({ nombre: '', dia: '1', mes: '1' }).errores.nombre, 'sin nombre, no');
ok(val({ nombre: '   ', dia: '1', mes: '1' }).errores.nombre, 'un nombre de espacios no es un nombre');
ok(val({ nombre: 'x'.repeat(61), dia: '1', mes: '1' }).errores.nombre, 'nombre con tope');
ok(val({ nombre: 'A', dia: '', mes: '' }).errores.fecha, 'sin día ni mes, no');
ok(val({ nombre: 'A', dia: '31', mes: '4' }).errores.fecha, 'el 31 de abril no existe');
ok(/no fue bisiesto/.test(val({ nombre: 'A', dia: '29', mes: '2', anio: '2023' }).errores.fecha || ''), '29 de febrero de 2023: no existe, y lo dice');
ok(val({ nombre: 'A', dia: '29', mes: '2', anio: '2024' }).ok, '29 de febrero de 2024: sí');
ok(val({ nombre: 'A', dia: '29', mes: '2' }).ok, '29 de febrero sin año: sí');
ok(/todavía no ha llegado/.test(val({ nombre: 'A', dia: '19', mes: '10', anio: '2026' }).errores.fecha || ''), 'una fecha futura no es un nacimiento');
ok(val({ nombre: 'A', dia: '18', mes: '10', anio: '2026' }).ok, 'hoy sí (nació hoy)');
ok(val({ nombre: 'A', dia: '1', mes: '1', anio: '1899' }).errores.fecha, 'un año antes de 1900, no');
ok(val({ nombre: 'A', dia: '1', mes: '1', anio: 'abc' }).errores.fecha, 'un año que no es un número, no');
ok(val({ nombre: 'A', dia: '1', mes: '13' }).errores.fecha, 'el mes 13 no existe');
ok(/Ya tienes apuntado/.test(val({ nombre: 'marta', dia: '12', mes: '5' }, { lista: [marta] }).errores.nombre || ''), 'el mismo nombre el mismo día: duplicado (sin mayúsculas ni espacios)');
ok(val({ nombre: 'Marta', dia: '12', mes: '5' }, { lista: [marta], id: marta.id }).ok, 'editándose a sí mismo no choca');
ok(val({ nombre: 'Marta', dia: '13', mes: '5' }, { lista: [marta] }).ok, 'otra Marta, otro día: vale');
ok(crearCumpleanos({ nombre: '', dia: '1', mes: '1' }, { hoy: HOY }) === null, 'un formulario malo no crea nada');

console.log('\n3 · Persistir al recargar (regla 5)');
const guardado = { lista: [marta, leo] };
const recargado = normalizarCumpleanos(JSON.parse(JSON.stringify(guardado)));
eq(recargado.lista, guardado.lista, '🚨 lo guardado vuelve igual');
eq(normalizarCumpleanos(null), { lista: [], apartados: [] }, 'sin nada guardado, vacío');
eq(normalizarCumpleanos([]), { lista: [], apartados: [] }, 'algo que no es un objeto, vacío');
const roto = normalizarCumpleanos({ lista: [marta, { nombre: 'X', dia: 40, mes: 1 }, 'basura', null] });
eq(roto.lista.length, 1, 'lo que no se entiende no se pinta');
eq(roto.apartados.length, 2, '🚨 …pero se APARTA, no se pierde en el siguiente guardado');
const sinId = { nombre: 'Ana', dia: 3, mes: 7 };
eq(normalizarCumpleanos({ lista: [sinId] }).lista[0].id, normalizarCumpleanos({ lista: [sinId] }).lista[0].id, 'uno sin id recibe el MISMO id en cada carga');
eq(normalizarCumpleanos({ lista: [marta, { ...marta }] }).lista.length, 1, 'dos copias del mismo cuentan una');
ok(normalizarCumpleanos({ lista: [marta], otraCosa: 1 }).otraCosa === 1, 'lo que no conoce lo conserva');
ok(/cumpleanos: 'los cumpleaños'/.test(leer('src/lib/estadosAsincronos.js')) && NOMBRES_DE_CLAVE.cumpleanos, 'la clave tiene nombre para el indicador de sincronización');
ok(/loadData\(uidUser, 'cumpleanos', DEFAULT_CUMPLEANOS\)/.test(APP) && /setCumpleanos\(normalizarCumpleanos\(cumple\)\)/.test(APP), 'App.jsx la carga y la pasa por su puerta');
ok(/guardados\.push\(saveData\(uidUser, 'cumpleanos', patch\.cumpleanos\)\)/.test(APP), 'y la guarda por `snapshotAndSave` (con Deshacer y con su `{ ok }`)');
ok(/if \(last\.cumpleanos\) \{ setCumpleanos\(last\.cumpleanos\)/.test(APP), 'Deshacer la devuelve, y un paso viejo sin ella no la vacía');
ok(/snapshot = \{[^}]*cumpleanos \};/.test(APP), 'y entra en el paso de Deshacer');

console.log('\n4 · Cada año, sin duplicados');
const evs = eventosDeCumpleanos({ lista: [marta, leo] });
eq(evs.map((e) => e.recurrencia.frecuencia), ['anual', 'anual'], 'un evento por cumpleaños, con recurrencia anual');
eq(evs.map((e) => e.fecha), ['2008-05-12', `${ANIO_ANCLA_SIN_ANIO}-02-29`], 'anclado en la fecha original (sin año, en un bisiesto)');
const tres = expandirRecurrentes(evs.slice(0, 1), '2026-01-01', '2028-12-31');
eq(tres.map((e) => e.fecha), ['2026-05-12', '2027-05-12', '2028-05-12'], '🚨 tres años, tres celebraciones');
eq(new Set(tres.map((e) => e.id)).size, 3, 'con ids distintos');
eq(JSON.stringify(eventosDeCumpleanos({ lista: [marta, leo] })), JSON.stringify(evs), 'recalcular da lo mismo (no se materializa nada)');
eq(expandirRecurrentes([...evs, ...evs].slice(0, 2), '2026-05-01', '2026-05-31').length, 1, 'en mayo, Marta una sola vez');

console.log('\n5 · El próximo, antes y después de la fecha de este año');
eq(proximoCumpleanos(marta, '2026-03-01'), { fecha: '2026-05-12', dias: 72, esHoy: false, edad: 18 }, 'antes: este año, y cumple 18');
eq(proximoCumpleanos(marta, '2026-05-12'), { fecha: '2026-05-12', dias: 0, esHoy: true, edad: 18 }, 'el mismo día: hoy');
eq(proximoCumpleanos(marta, '2026-05-13'), { fecha: '2027-05-12', dias: 364, esHoy: false, edad: 19 }, 'después: el año que viene');
eq(proximoCumpleanos(leo, HOY).edad, null, 'sin año no se dice la edad');
ok(proximoCumpleanos(crearCumpleanos({ nombre: 'Bebé', dia: '18', mes: '10', anio: '2026' }, { hoy: HOY }), HOY).edad === null, 'nacido hoy: no «cumple 0»');
eq(textoDelProximo(proximoCumpleanos(marta, '2026-05-12')), 'Hoy · 12 de mayo · cumple 18', 'el texto de hoy');
eq(textoDelProximo(proximoCumpleanos(marta, '2026-05-11')), 'Mañana · 12 de mayo · cumple 18', 'el de mañana');
eq(textoDelProximo(proximoCumpleanos(marta, '2026-01-01')), '12 de mayo · cumple 18', 'lejos: la fecha');
eq(textoDeLaFecha(marta), '12 de mayo de 2008', 'la fecha original, con año');
eq(textoDeLaFecha(leo), '29 de febrero', 'y sin');
eq(ordenarPorProximo([marta, leo], '2026-03-01').map((c) => c.nombre), ['Marta', 'Leo'], 'la lista va por el que llega antes');
eq(ordenarPorProximo([marta, leo], '2026-06-01').map((c) => c.nombre), ['Leo', 'Marta'], '…y cambia sola con la fecha');

console.log('\n6 · Bisiestos y cambio de año');
ok(esBisiesto(2024) && !esBisiesto(2026) && esBisiesto(2000) && !esBisiesto(1900), 'la regla de los bisiestos (2000 sí, 1900 no)');
eq([diasDelMes(2, 2026), diasDelMes(2, 2028), diasDelMes(2, null)], [28, 29, 29], 'febrero, según el año');
eq(proximoCumpleanos(leo, '2026-10-18').fecha, '2027-02-28', '29 de febrero en un año que no es bisiesto: el 28');
eq(proximoCumpleanos(leo, '2027-10-18').fecha, '2028-02-29', 'y en bisiesto, el 29');
const leoEv = eventosDeCumpleanos({ lista: [leo] });
for (const a of [2025, 2026, 2027, 2028]) {
  const cal = expandirRecurrentes(leoEv, `${a}-01-01`, `${a}-12-31`).map((e) => e.fecha);
  eq(cal, [fechaEnAnio(leo, a)], `🚨 ${a}: la pantalla y el Calendario dicen el mismo día (${cal[0]})`);
}
const nochevieja = crearCumpleanos({ nombre: 'Año nuevo', dia: '1', mes: '1', anio: '2000' }, { hoy: HOY });
eq(proximoCumpleanos(nochevieja, '2026-12-31'), { fecha: '2027-01-01', dias: 1, esHoy: false, edad: 27 }, 'cambio de año: el 31 de diciembre, mañana es el del 1 de enero');

console.log('\n7 · Editar y eliminar');
const editada = editarCumpleanos(marta, { ...formularioDeCumpleanos(marta), nombre: 'Marta G.', dia: '13' }, { lista: [marta, leo], hoy: HOY });
eq([editada.id, editada.creado, editada.nombre, editada.dia, editada.mes, editada.anio], [marta.id, marta.creado, 'Marta G.', 13, 5, 2008], 'mismo id y mismo `creado`: cambia solo lo editado');
ok(editarCumpleanos(marta, formularioDeCumpleanos(marta), { lista: [marta], hoy: HOY }) === marta, 'sin cambios, el MISMO objeto (no escribe)');
ok(editarCumpleanos(marta, { ...formularioDeCumpleanos(marta), nombre: '' }, { hoy: HOY }) === null, 'vaciar el nombre no se guarda');
ok(editarCumpleanos(marta, { ...formularioDeCumpleanos(marta), nombre: 'Leo', dia: '29', mes: '2', anio: '' }, { lista: [marta, leo], hoy: HOY }) === null, 'convertirlo en otro que ya existe, no');
eq(formularioDeCumpleanos(leo), { nombre: 'Leo', dia: '29', mes: '2', anio: '', relacion: '' }, 'el formulario de editar viene con todo');
ok(CATALOGO_PAPELERA['cumpleanos.lista'] && CATALOGO_PAPELERA['cumpleanos.lista'].campos[0] === 'nombre', 'eliminar va a Eliminados recientemente');
const elim = prepararEliminacion({ lista: [marta, leo] }, 'cumpleanos', 'lista', marta.id, '2026-10-18T10:00:00Z');
eq(elim.moduloActualizado.lista.map((c) => c.id), [leo.id], 'se va el suyo y solo el suyo');
const vuelta = prepararRestauracion(elim.moduloActualizado, elim.entrada);
ok((vuelta.moduloActualizado || vuelta).lista.some((c) => c.id === marta.id), '…y vuelve entero al restaurarlo');
ok(/const deleteCumpleanos = \(id\) => eliminarConPapelera\('cumpleanos', 'lista', id\)/.test(APP) && /cumpleanos: \[cumpleanos, setCumpleanos\]/.test(APP), 'App.jsx borra por la papelera, la única puerta');
ok(/const updateCumpleanos = \(c\) => \(c \? snapshotAndSave\(/.test(APP) && /\.map\(\(x\) => \(x\.id === c\.id \? c : x\)\)/.test(APP), 'y edita sustituyendo por id (ni un duplicado)');
ok(/\.filter\(\(x\) => x\.id !== c\.id\), c\]/.test(APP), 'y crear dos veces el mismo no lo duplica');

console.log('\n8 · El Calendario');
const derivados = eventosDerivados({ cumpleanos: { lista: [marta] } });
ok(derivados.some((e) => e.id === `cumpleanos:${marta.id}` && e.soloLectura && e.origen === 'cumpleanos'), '🚨 sale entre los derivados del Calendario, de solo lectura');
eq(NOMBRES_ORIGEN.cumpleanos, 'Cumpleaños', '«Abrir en Cumpleaños» desde su detalle');
eq(eventosDerivados({}).filter((e) => e.origen === 'cumpleanos').length, 0, 'sin cumpleaños, ninguno');
eq(eventosDeCumpleanos({ lista: [marta] }, { activo: false }), [], 'desactivado, ninguno');
ok(/cumpleanos: cumpleanosActivo\(personalizacion\.ocultos\) \? cumpleanos : null/.test(APP), 'App.jsx no los pasa al Calendario si está desactivado');
ok(/case 'cumpleanos':/.test(APP), 'y «Abrir en Cumpleaños» tiene a dónde ir (su `case`)');

console.log('\n9 · Desactivar y reactivar sin perder nada');
ok(cumpleanosActivo([]) && !cumpleanosActivo(['cumpleanos']) && !cumpleanosActivo(['mente']), 'el mismo interruptor que un módulo (`ocultos`); y sin Mente, tampoco');
const antes = JSON.stringify(guardado);
cumpleanosActivo(['cumpleanos']); eventosDeCumpleanos(guardado, { activo: false });
eq(JSON.stringify(guardado), antes, '🚨 desactivar no toca los datos');
ok(APPS_MENTE.find((a) => a.id === 'cumpleanos')?.desactivable === true, 'Cumpleaños se declara desactivable en su catálogo');
ok(/a\.desactivable && \(ocultos \|\| \[\]\)\.includes\(a\.id\)/.test(AGRUP) && /ocultos=\{personalizacion\.ocultos\}/.test(APP), 'Mente no lo pinta mientras está apagado');
ok(/\.filter\(\(a\) => a\.agrupador === id && a\.desactivable\)/.test(PERS) && /<Fila modulo=\{sub\}/.test(PERS), 'Ajustes lo enciende con la MISMA fila e interruptor que un módulo (sin uno aparte)');
ok(/const deSecciones = personalizacion\.ocultos\.filter/.test(APP), 'un perfil rápido no lo reactiva por la espalda');
ok(/desactivado=\{!cumpleanosActivo\(personalizacion\.ocultos\)\}/.test(APP) && /if \(desactivado\)/.test(VISTA), 'llegar por un enlace con él apagado lo dice, sin pintar nada');

console.log('\n10 · Movimiento y navegación');
eq(APPS_MENTE.map((a) => a.id), ['fe', 'relacion', 'bienestar', 'cumpleanos'], '🚨 la cuarta sección de Mente, al mismo nivel que las otras tres');
eq(agrupadorDeApp('cumpleanos'), 'mente', 'vive en Vida → Mente');
ok(!appProtegida('cumpleanos'), 'sin PIN (no es Relación)');
ok(ARBOL_DIST.dentroDe.mente.includes('cumpleanos'), 'y el árbol del encargo lo dice');
const reub = auditarReubicados({ moreNav: [], areasNav: [] });
ok(!reub.problemas.some((p) => /cumpleanos/.test(p.que)), 'la auditoría de la navegación lo encuentra donde debe');
ok(/<ListaAnimada/.test(VISTA) && /data-flip-id=\{`cumple-\$\{c\.id\}`\}/.test(VISTA), 'la lista es `ListaAnimada`, con su id en cada fila');
ok(/<Plegable abierto=\{anadiendo\}>\{\(\) =>/.test(VISTA), 'añadir abre y cierra con `Plegable`');
ok(/<CambioDeContenido clave=\{editando === c\.id \? 'editar' : 'ver'\}>/.test(VISTA), 'de la tarjeta a editarla, `CambioDeContenido`');
ok(/<EmptyHint/.test(VISTA) && /<AvisoAccion/.test(VISTA), 'el vacío y los avisos, los de siempre');
ok(AVISOS_ACCION.cumpleanos_guardado && AVISOS_ACCION.cumpleanos_eliminado, 'sus avisos, en el catálogo de siempre');
ok(!/\.animate\(|keyframes|transition:|setTimeout|z-\d|zIndex/.test(VISTA), 'ni una animación, una espera ni un z-index escritos a mano');
const archivos = { 'src/views/CumpleanosView.jsx': VISTA_BRUTA };
eq(auditarLayout({ vistas: archivos }).hallazgos.length, 0, 'auditoría de layout (MS F10): limpia');
eq(auditarComponentesMotion({ vistas: archivos }).hallazgos.length, 0, 'de microinteracciones (MS F3): limpia');
eq(auditarOrquestacion({ archivos }).hallazgos.length, 0, 'de orquestación (MS F11): limpia');
eq(auditarAccesibilidadMotion({ archivos, css: CSS }).hallazgos.length, 0, 'de accesibilidad del movimiento (MS F12): limpia');
eq(auditarPulido({ archivos, css: CSS }).filter((p) => (p.archivo || '').includes('Cumpleanos')).length, 0, 'de pulido (MS F18): limpia');
eq(auditarAsincronia({ archivos }).length, 0, 'de asincronía (MS F16): limpia');
ok(/finally \{\s*if \(turno\.vigente\(\)\) setGuardando\(false\);/.test(VISTA) && /res && res\.ok === false\) setFallo/.test(VISTA), 'un guardado que no llega se dice, y la espera vuelve a reposo');
ok(/aria-label=\{`Editar el cumpleaños de/.test(VISTA) && /label=\{`Eliminar el cumpleaños de/.test(VISTA), 'editar y eliminar, con nombre para VoiceOver');
ok(/aria-invalid/.test(VISTA) && /<MensajeDeCampo/.test(VISTA), 'un campo con error, con `aria-invalid` y su mensaje');

console.log('\n11 · Sin romper Mente ni lo demás');
eq(APPS_MENTE.slice(0, 3).map((a) => a.nombre), ['Fe', 'Relación', 'Bienestar digital'], 'las tres de antes, igual');
ok(APPS_MENTE.find((a) => a.id === 'relacion').protegida, 'Relación sigue con su PIN');
const EXPORT = sinComentarios(leer('src/lib/exportData.js'));
ok(/if \(cumpleanos\) rows\.push\(\.\.\.filasDeCumpleanosParaExportar\(cumpleanos\)\)/.test(EXPORT) && /fotosFitness: fotosExportables, cumpleanos \}/.test(APP), 'entra en la exportación global');
eq(filasDeCumpleanosParaExportar({ lista: [marta] })[0], { modulo: 'Cumpleaños', fecha: '2008-05-12', detalle: 'Marta', valor: '12 de mayo de 2008', extra: 'Amiga' }, '…con la forma de fila de siempre');
eq(filasDeCumpleanosParaExportar({ lista: [leo] })[0].fecha, '--02-29', 'sin año, sin inventárselo');
ok(!/const currentState = \{[^}]*cumpleanos/.test(APP), '🚨 NO entra en `currentState`: no viaja a la IA (son datos de otras personas)');
eq(DEFAULT_CUMPLEANOS, { lista: [], apartados: [] }, 'el valor por defecto');

console.log(`\n${n - fallos}/${n} comprobaciones${fallos ? ` · ${fallos} FALLOS` : ''}`);
process.exit(fallos ? 1 : 0);
