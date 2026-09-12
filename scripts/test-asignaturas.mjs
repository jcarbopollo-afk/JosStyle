// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 43 (ES F3) — ASIGNATURAS Y GESTIÓN ACADÉMICA
// ══════════════════════════════════════════════════════════════════════════
//
// El riesgo de esta fase es el de siempre en este bloque: **una asignatura ya
// existía** (`{ id, programaId, nombre }`, desde la Fase 6) y la leen el Horario,
// la papelera, el Calendario y la exportación. Ampliarla no puede romper a nadie.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  NO_EN_ES3, ICONOS_ASIGNATURA, ICONO_ASIGNATURA_POR_DEFECTO,
  SUGERENCIAS_ICONO_ASIGNATURA, sugerirIconoAsignatura, iconoDeAsignatura,
  ESTADOS_TEMA, IDS_ESTADO_TEMA, ESTADO_TEMA_POR_DEFECTO, estadoTema, siguienteEstadoTema,
  MAX_NOMBRE_ASIGNATURA, MAX_NOMBRE_TEMA, MAX_DESCRIPCION_TEMA,
  normalizarAsignatura, normalizarTema, normalizarAsignaturasDe,
  crearAsignatura, editarAsignatura, alternarOcultaAsignatura, AVISO_OCULTAR_ASIGNATURA,
  asignaturasOrdenadas, asignaturasVisibles, moverAsignatura,
  temasDe, crearTema, editarTema, cambiarEstadoTema, avanzarTema, moverTema,
  NO_HAY_ENTREGAS, resumenAsignatura, lineaDeAsignatura,
  SECCIONES_ASIGNATURA, SECCIONES_QUE_EXISTEN, seccionAsignatura, seccionesDeAsignatura,
  impactoDeEliminarAsignatura, RELACION_FECHAS, condicionES3,
  ACENTOS_COLECCION,
} from '../src/lib/asignaturas.js';

import {
  RUTA_RAIZ, abrirApp, abrirRama, abrirAsignatura, abrirSeccion, atras, migas,
  SECCIONES_DE_ASIGNATURA, normalizarAppsDe,
} from '../src/lib/estudiosApps.js';

import { DEFAULT_ESTUDIOS } from '../src/tokens.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-09-07';
const VISTA = leer('src/views/EstudiosView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const LIB = leer('src/lib/asignaturas.js');
const CODIGO_LIB = soloCodigo(LIB);
const APP = leer('src/App.jsx');

// ── Escenario: lo que Josué tendría guardado ─────────────────────────────────
const ESCENARIO = normalizarAppsDe({
  programas: [{ id: 'bach', nombre: 'Bachillerato' }],
  asignaturas: [
    { id: 'a1', programaId: 'bach', nombre: 'Biología' },
    { id: 'a2', programaId: 'bach', nombre: 'Matemáticas' },
  ],
  examenes: [
    { id: 'e1', asignaturaId: 'a1', fecha: '2026-09-20', tema: 'Genética' },
    { id: 'e2', asignaturaId: 'a1', fecha: '2026-06-01', tema: 'Viejo' },
  ],
  horas: [{ id: 'h1', asignaturaId: 'a1', fecha: '2026-09-05', horas: 2 }],
  temas: [
    { id: 't1', asignaturaId: 'a1', nombre: 'Tema 1 — La célula', estado: 'completado', orden: 0 },
    { id: 't2', asignaturaId: 'a1', nombre: 'Tema 2 — Genética', estado: 'progreso', orden: 1 },
    { id: 't3', asignaturaId: 'a1', nombre: 'Tema 3 — Metabolismo', estado: 'pendiente', orden: 2 },
  ],
});

console.log('\n── 1. Una asignatura YA EXISTÍA: se amplía, no se recrea ──');

ok(Array.isArray(DEFAULT_ESTUDIOS.asignaturas), 'DEFAULT_ESTUDIOS.asignaturas sigue existiendo');
ok(Array.isArray(DEFAULT_ESTUDIOS.temas), 'y DEFAULT_ESTUDIOS.temas es la lista nueva');
ok(!/export\s+(const|function)\s+(ASIGNATURAS_|DEFAULT_ASIGNATURAS)/.test(CODIGO_LIB), 'La librería no declara una segunda lista de asignaturas');
ok(CATALOGO_PAPELERA['estudios.asignaturas'], 'La papelera sigue conociendo estudios.asignaturas');
ok(CATALOGO_PAPELERA['estudios.temas'], '🚨 y conoce estudios.temas: una lista que se puede borrar va al catálogo (EH F45)');
ok(/asignaturas=\{estudios\.asignaturas/.test(APP), '🚨 El Horario sigue recibiendo las asignaturas de Estudios (HT F2, apartado 25)');

const norm = normalizarAsignaturasDe(ESCENARIO);
eq(norm.programas.length, 1, 'normalizarAsignaturasDe conserva los programas');
eq(norm.examenes.length, 2, 'conserva los exámenes');
eq(norm.horas.length, 1, 'conserva las horas');
eq(norm.asignaturas.length, 2, 'conserva las asignaturas');
eq(norm.asignaturas[0].id, 'a1', 'El id no se toca');
eq(norm.asignaturas[0].programaId, 'bach', 'Ni el programaId: es la relación con su área');
eq(norm.asignaturas[0].nombre, 'Biología', 'Ni el nombre');
ok(norm.asignaturas.every((a) => 'icono' in a && 'acento' in a && 'profesor' in a && 'aula' in a && 'orden' in a && 'oculto' in a),
  'Cada asignatura sale con los seis campos nuevos');
const extra = normalizarAsignaturasDe({ ...ESCENARIO, loQueVengaDespues: [1] });
eq(extra.loQueVengaDespues, [1], '🚨 Devuelve el módulo ENTERO: un campo que no conoce sobrevive (regla 5)');
eq(normalizarAsignaturasDe(null), null, 'Un módulo que no es un objeto se devuelve tal cual');

console.log('\n── 2. Normalizadores ──');

eq(normalizarAsignatura({ nombre: '  ' }), null, 'Una asignatura sin nombre se descarta');
eq(normalizarAsignatura(null), null, 'Y una que no es un objeto también');
ok(normalizarAsignatura({ nombre: 'X' }).id, 'Una asignatura sin id recibe uno (EH F45)');
eq(normalizarAsignatura({ nombre: 'X' }).icono, null, '🚨 No se le escribe un icono que él no eligió');
eq(iconoDeAsignatura({ nombre: 'X' }), ICONO_ASIGNATURA_POR_DEFECTO, '…pero se PINTA con el de por defecto');
eq(normalizarAsignatura({ nombre: 'X', acento: 'inventado' }).acento, null, 'Un acento que no existe se descarta');
eq(normalizarAsignatura({ nombre: 'X', acento: 'info' }).acento, 'info', 'Uno del catálogo se respeta');
eq(normalizarAsignatura({ nombre: 'X', profesor: '   ' }).profesor, null, 'Un profesor en blanco queda en null, no en cadena vacía');
eq(normalizarAsignatura({ nombre: 'X', oculto: 'sí' }).oculto, false, 'Solo `true` cuenta como oculto');

eq(normalizarTema({ nombre: 'T', asignaturaId: 'a1' }).estado, ESTADO_TEMA_POR_DEFECTO, 'Un tema nace Pendiente');
eq(normalizarTema({ nombre: 'T' }), null, '🚨 Un tema SIN asignatura se descarta: sería un huérfano invisible');
eq(normalizarTema({ nombre: '  ', asignaturaId: 'a1' }), null, 'Y uno sin nombre también');
eq(normalizarTema({ nombre: 'T', asignaturaId: 'a1', estado: 'inventado' }).estado, ESTADO_TEMA_POR_DEFECTO, 'Un estado que no existe cae al de por defecto');
ok(normalizarTema({ nombre: 'x'.repeat(200), asignaturaId: 'a1' }).nombre.length === MAX_NOMBRE_TEMA, 'El nombre de un tema se acota');
eq(normalizarTema({ nombre: 'T', asignaturaId: 'a1', descripcion: '  ' }).descripcion, null, 'Una descripción en blanco queda en null');
const conTemaRaro = normalizarAsignaturasDe({ ...ESCENARIO, temas: [...ESCENARIO.temas, null, { nombre: 'Sin asignatura' }] });
eq(conTemaRaro.temas.length, 3, 'Los temas rotos se descartan');

console.log('\n── 3. El acento es un TOKEN, nunca un hex (regla 2) ──');

ok(ACENTOS_COLECCION.length >= 5, 'Se reutiliza el catálogo de acentos que ya existía (BL F7)');
ok(!/#[0-9a-fA-F]{6}/.test(CODIGO_LIB), '🚨 Ni un hex suelto en la librería');
ok(!/export const (ACENTOS_ASIGNATURA|COLORES_ASIGNATURA)/.test(CODIGO_LIB), '🚨 y no se escribe un segundo catálogo de colores');
ok(norm.asignaturas.every((a) => a.acento === null || ACENTOS_COLECCION.some((x) => x.id === a.acento)), 'Lo guardado solo puede ser un id del catálogo');

console.log('\n── 4. Iconos: se proponen, no se adivinan ──');

ok(ICONOS_ASIGNATURA.length >= 20, `La paleta tiene ${ICONOS_ASIGNATURA.length} iconos`);
eq(new Set(ICONOS_ASIGNATURA).size, ICONOS_ASIGNATURA.length, 'Sin repetidos');
eq(sugerirIconoAsignatura('Biología'), '🧬', 'Biología propone 🧬');
eq(sugerirIconoAsignatura('Matemáticas'), '📐', 'Matemáticas propone 📐');
eq(sugerirIconoAsignatura('Física'), '⚛️', 'Física propone ⚛️');
eq(sugerirIconoAsignatura('Inglés'), '🇬🇧', 'Inglés propone 🇬🇧');
eq(sugerirIconoAsignatura('Macramé'), null, 'Lo que no reconoce no se inventa');
eq(sugerirIconoAsignatura(''), null, 'Sin nombre no hay sugerencia');
ok(SUGERENCIAS_ICONO_ASIGNATURA.every((s) => Array.isArray(s.busca) && s.busca.length && s.icono), 'Cada sugerencia declara qué busca y qué propone');

console.log('\n── 5. Crear, editar, ocultar y ordenar (apartados 2, 3 y 10) ──');

const nueva = crearAsignatura({ nombre: 'Física', programaId: 'bach' }, norm.asignaturas);
ok(nueva && nueva.id, 'crearAsignatura devuelve una asignatura con id');
eq(nueva.nombre, 'Física', 'con su nombre');
/* 🔓 AS F1 — la relación con el programa pasó a ser una LISTA. La asignatura es
   una identidad compartida y en qué programas se usa es otra cosa (apartado 4),
   así que `programaId` se absorbe en `programaIds` desde el normalizador — el
   mismo movimiento que `absorberColeccionId` en la BL F7. Esta comprobación
   guardaba el modelo viejo y pasa a guardar el nuevo. */
eq(nueva.programaIds[0], 'bach', 'y su área');
eq(nueva.icono, '⚛️', 'con el icono propuesto por el nombre');
eq(nueva.orden, 2, 'y la última del área');
eq(nueva.profesor, null, '⚠️ Los datos secundarios NO son obligatorios (apartado 2)');
/* 🔓 Y ésta decía lo contrario de lo que AS F1 construye. Una asignatura SIN
   programa es justo lo que hace falta para poder crearla desde Horario: está en
   el catálogo, disponible, y **dentro de ningún programa** hasta que él la meta
   en uno (apartado 4 y PRUEBA C). Lo que sigue sin poder crearse es una sin
   nombre, que es lo que de verdad no se puede pintar. */
ok(crearAsignatura({ nombre: 'X' })?.programaIds.length === 0,
  '🚨 AS F1 — sin área SÍ se crea: nace en el catálogo y dentro de ningún programa');
eq(crearAsignatura({ nombre: '  ' }), null, '🚨 Pero sin nombre no se crea: eso no se puede pintar');
eq(crearAsignatura({ programaId: 'bach' }), null, 'Y sin nombre tampoco');
ok(crearAsignatura({ nombre: 'x'.repeat(99), programaId: 'bach' }).nombre.length === MAX_NOMBRE_ASIGNATURA, 'El nombre se acota');

const editadas = editarAsignatura(norm.asignaturas, 'a1', { profesor: 'Marta', aula: '204' });
eq(editadas.find((a) => a.id === 'a1').profesor, 'Marta', 'Editar guarda el profesor');
eq(editadas.find((a) => a.id === 'a1').aula, '204', 'y el aula');
eq(editadas.find((a) => a.id === 'a1').nombre, 'Biología', 'sin tocar lo que no se edita');
eq(editarAsignatura(norm.asignaturas, 'a1', { id: 'otro' }).find((a) => a.nombre === 'Biología').id, 'a1',
  '🚨 El id NO se puede cambiar por la puerta de atrás');
eq(editarAsignatura(norm.asignaturas, 'a1', { programaId: 'otra' }).find((a) => a.id === 'a1').programaId, 'bach',
  '🚨 Ni el área: mover una asignatura de área dejaría sus exámenes en el sitio equivocado');

const ocultada = alternarOcultaAsignatura(norm.asignaturas, 'a1');
eq(ocultada.find((a) => a.id === 'a1').oculto, true, 'Ocultar pone oculto en true');
eq(asignaturasVisibles({ ...norm, asignaturas: ocultada }, 'bach').map((a) => a.id), ['a2'], 'La oculta no sale en la lista');
eq(asignaturasOrdenadas({ ...norm, asignaturas: ocultada }, 'bach').length, 2, 'Pero sigue existiendo: ocultar no es eliminar');
eq(temasDe({ ...norm, asignaturas: ocultada }, 'a1').length, 3, '🚨 y sus temas siguen enteros');
ok(/se quedan/i.test(AVISO_OCULTAR_ASIGNATURA) && !/no se puede deshacer/i.test(AVISO_OCULTAR_ASIGNATURA), 'El aviso dice qué se queda y no promete un borrado');

const movidas = moverAsignatura(norm.asignaturas, 'bach', 'a2', 'arriba');
eq(asignaturasOrdenadas({ ...norm, asignaturas: movidas }, 'bach').map((a) => a.id), ['a2', 'a1'], 'Subir una la pone antes');
eq(moverAsignatura(norm.asignaturas, 'bach', 'a1', 'arriba'), norm.asignaturas, 'Subir la primera no cambia nada');
eq(moverAsignatura(norm.asignaturas, 'bach', 'no-existe', 'arriba').length, 2, 'Mover algo que no está no rompe nada');

console.log('\n── 6. Temas: crear, editar, ordenar y su progreso (apartados 5, 6 y 7) ──');

eq(temasDe(norm, 'a1').map((t) => t.id), ['t1', 't2', 't3'], 'Los temas salen ordenados');
eq(temasDe(norm, 'a2'), [], 'Una asignatura sin temas devuelve una lista vacía');
eq(temasDe(null, 'a1'), [], 'Sin datos no revienta');

const t = crearTema({ nombre: 'Tema 4', asignaturaId: 'a1' }, norm.temas);
ok(t && t.id, 'crearTema devuelve un tema con id');
eq(t.estado, 'pendiente', 'que nace Pendiente');
eq(t.orden, 3, 'y el último');
eq(crearTema({ nombre: 'X' }), null, '🚨 Sin asignatura no se crea un tema');
eq(crearTema({ asignaturaId: 'a1' }), null, 'Y sin nombre tampoco');

eq(ESTADOS_TEMA.length, 3, 'Son tres estados (apartado 7)');
ok(ESTADOS_TEMA.every((e) => e.nombre && e.icono), '🚨 y cada uno con icono Y palabra: el color nunca va solo (EH F42)');
ok(!/porcentaje|%/.test(JSON.stringify(ESTADOS_TEMA)), '⚠️ sin porcentajes: *"no utilizar sistemas de porcentaje complicados"*');
eq(estadoTema('progreso').nombre, 'En progreso', 'estadoTema encuentra uno');
eq(estadoTema('inventado').id, 'pendiente', 'y uno que no existe cae al primero');
eq(siguienteEstadoTema('pendiente'), 'progreso', 'Pendiente → En progreso');
eq(siguienteEstadoTema('progreso'), 'completado', 'En progreso → Completado');
eq(siguienteEstadoTema('completado'), 'pendiente', 'Completado → Pendiente: el ciclo se cierra');

eq(avanzarTema(norm.temas, 't3').find((x) => x.id === 't3').estado, 'progreso', 'Avanzar un tema cambia su estado');
eq(avanzarTema(norm.temas, 't3').find((x) => x.id === 't1').estado, 'completado', 'y no toca los demás');
eq(cambiarEstadoTema(norm.temas, 't1', 'pendiente').find((x) => x.id === 't1').estado, 'pendiente', 'Se puede fijar un estado concreto');
eq(cambiarEstadoTema(norm.temas, 't1', 'inventado').find((x) => x.id === 't1').estado, 'completado', 'Un estado inventado no cambia nada');
eq(editarTema(norm.temas, 't1', { nombre: 'Otro' }).find((x) => x.id === 't1').nombre, 'Otro', 'Editar un tema guarda el nombre');
eq(editarTema(norm.temas, 't1', { asignaturaId: 'a2' }).find((x) => x.id === 't1').asignaturaId, 'a1', '🚨 pero no lo cambia de asignatura');
eq(moverTema(norm.temas, 'a1', 't3', 'arriba').filter((x) => x.asignaturaId === 'a1').sort((x, y) => x.orden - y.orden).map((x) => x.id), ['t1', 't3', 't2'], 'Subir un tema lo mueve');
eq(moverTema(norm.temas, 'a1', 't1', 'arriba'), norm.temas, 'Subir el primero no cambia nada');

console.log('\n── 7. El resumen compacto (apartado 8) ──');

const res = resumenAsignatura(norm, 'a1', HOY);
ok(res.some((l) => /1 tema pendiente/.test(l)), 'Dice los temas pendientes, en singular');
ok(res.some((l) => /1 en progreso/.test(l)), 'y los que están en progreso');
ok(res.some((l) => /1 examen próximo/.test(l)), 'y los exámenes próximos, sin contar el que ya pasó');
eq(resumenAsignatura(norm, 'a2', HOY), [], '🚨 Sin nada que decir devuelve `[]`: nunca una fila de ceros');
eq(lineaDeAsignatura(norm, 'a2', HOY), null, 'y la línea de la lista es `null`');
ok(res.length <= 3, 'El resumen es compacto: *"no convertirlo en un panel gigante"*');
// 🚨 Y NI UNA línea de entregas: la entidad no existe.
ok(!/entrega/i.test(JSON.stringify(res)), '🚨 NI UNA línea de entregas: no existe la entidad, y escribirla sería una cifra inventada');
ok(NO_HAY_ENTREGAS.porque, 'y está declarado con su motivo');

console.log('\n── 8. Las secciones de una asignatura (apartado 4) ──');

ok(SECCIONES_QUE_EXISTEN.length >= 2, `${SECCIONES_QUE_EXISTEN.length} secciones existen de verdad`);
// 🔓 La ES F3 declaró Entregas como imposible y la ES F4 la construyó: esta comprobación pasa a
// vigilar que exista de verdad, que es lo que la promesa prometía.
ok(SECCIONES_ASIGNATURA.some((s) => s.id === 'entregas' && s.existe), '🔓 Entregas ya existe: la construyó la ES F4');
ok(SECCIONES_ASIGNATURA.some((s) => s.id === 'eventos' && s.existe), '🔓 y Eventos también');
eq(seccionAsignatura('contenido').nombre, 'Contenido', 'seccionAsignatura encuentra una');
eq(seccionAsignatura('inventada'), null, 'y no se inventa ninguna');
const secs = seccionesDeAsignatura(norm, 'a1');
eq(secs.length, SECCIONES_QUE_EXISTEN.length, 'Se abren solo las que existen');
eq(secs.find((s) => s.id === 'contenido').cuantos, 3, 'Contenido cuenta sus temas');
eq(secs.find((s) => s.id === 'examenes').cuantos, 2, 'Exámenes cuenta los suyos');
eq(secs.find((s) => s.id === 'contenido').linea, '3 temas', 'con su línea en plural');
eq(seccionesDeAsignatura(norm, 'a2').find((s) => s.id === 'contenido').linea, null, 'Una sección vacía no dice "0 temas"');
// ⚠️ Los rótulos de las migas tienen que coincidir con el catálogo de verdad.
eq(SECCIONES_DE_ASIGNATURA.map((s) => s.id), SECCIONES_QUE_EXISTEN.map((s) => s.id),
  '⚠️ Los ids de las migas coinciden con las secciones que existen');
eq(SECCIONES_DE_ASIGNATURA.map((s) => s.nombre), SECCIONES_QUE_EXISTEN.map((s) => s.nombre), 'y sus nombres también');

console.log('\n── 9. Eliminar enseña el impacto ANTES (apartado 3) ──');

const imp = impactoDeEliminarAsignatura(norm, 'a1');
eq(imp.tieneDatos, true, 'Biología tiene datos asociados');
ok(/2 exámenes/.test(imp.aviso), 'El aviso dice cuántos exámenes se van');
ok(/3 temas/.test(imp.aviso), 'y cuántos temas');
ok(/1 sesión de estudio/.test(imp.aviso), 'y cuántas sesiones');
ok(/recuperar/i.test(imp.aviso), '⚠️ y dice que se recupera: va a la papelera, prometer lo contrario sería mentir');
ok(!/no se puede deshacer|permanente/i.test(imp.aviso), 'nunca promete un borrado definitivo');
eq(impactoDeEliminarAsignatura(norm, 'a2').tieneDatos, false, 'Una asignatura sin datos no arrastra nada');
ok(/recuperar/i.test(impactoDeEliminarAsignatura(norm, 'a2').aviso), 'y aun así dice que se recupera');
// 🚨 ENSEÑA, no borra.
ok(!/eliminarConPapelera|saveData/.test(CODIGO_LIB), '🚨 La librería no borra nada: quien borra es App.jsx (ME F3)');
ok(/temas: \(estudios\.temas \|\| \[\]\)\.filter/.test(APP), '🚨 Y App.jsx se lleva los temas en la cascada de la asignatura');
ok(/coleccion: 'temas'/.test(APP), '⚠️ en la MISMA entrada de papelera, para que restaurar la devuelva entera');

console.log('\n── 10. La relación con las fechas (apartado 12) ──');

ok(RELACION_FECHAS.length >= 3, 'Se declaran las tres relaciones');
ok(RELACION_FECHAS.every((r) => r.campo === 'asignaturaId'), '🚨 y las tres por `asignaturaId`: ni una relación nueva');
ok(RELACION_FECHAS.some((r) => /Examen/i.test(r.entidad) && /Fase 6/.test(r.desde)), 'El examen ya la tenía desde la Fase 6');
ok(norm.temas.every((t) => t.asignaturaId), 'Todos los temas apuntan a su asignatura');

console.log('\n── 11. La navegación de cinco niveles (apartado 4) ──');

eq(abrirAsignatura('p', 'r', 'a').vista, 'asignatura', 'Se puede abrir una asignatura');
eq(abrirSeccion('p', 'r', 'a', 'contenido').seccion, 'contenido', 'y una sección suya');
eq(atras(abrirSeccion('p', 'r', 'a', 'contenido')), abrirAsignatura('p', 'r', 'a'), 'De una sección se vuelve a su asignatura');
eq(atras(abrirAsignatura('p', 'r', 'a')), abrirRama('p', 'r'), 'De una asignatura, a su rama');
eq(atras(abrirRama('p', 'r')), abrirApp('p'), 'De una rama, a su app');
eq(atras(abrirApp('p')), RUTA_RAIZ, 'De una app, al Home');
eq(atras(RUTA_RAIZ), RUTA_RAIZ, '🚨 y de la raíz a la raíz: nunca se sale de Estudios sin querer');

const progs = norm.programas;
const ramaAsig = progs[0].ramas.find((r) => r.sistema === 'asignaturas');
eq(migas(abrirAsignatura('bach', ramaAsig.id, 'a1'), progs, norm.asignaturas).map((m) => m.texto),
  ['Estudios', 'Bachillerato', 'Asignaturas', 'Biología'], 'Las migas llegan hasta la asignatura');
eq(migas(abrirSeccion('bach', ramaAsig.id, 'a1', 'contenido'), progs, norm.asignaturas).map((m) => m.texto),
  ['Estudios', 'Bachillerato', 'Asignaturas', 'Biología', 'Contenido'], 'y hasta su sección');
eq(migas(abrirAsignatura('bach', ramaAsig.id, 'borrada'), progs, norm.asignaturas).map((m) => m.texto).length, 3,
  'Una asignatura que ya no existe no rompe las migas');

console.log('\n── 12. La pantalla (apartados 13 y 14) ──');

ok(!/function AsignaturaCard/.test(VISTA), '🚨 El acordeón de página larga ha desaparecido (apartado 14)');
ok(/FilaAsignatura/.test(CODIGO_VISTA), 'La lista es compacta y lleva a la asignatura');
ok(/FormAsignatura/.test(CODIGO_VISTA), 'Hay formulario de asignatura (apartado 2)');
ok(/FormTema/.test(CODIGO_VISTA) && /FilaTema/.test(CODIGO_VISTA), 'y de tema (apartados 5 y 6)');
ok(/FormExamen/.test(CODIGO_VISTA), '🚨 y el formulario de examen NO se ha perdido al retirar el acordeón');
ok(/onAddHoras/.test(CODIGO_VISTA), '🚨 ni el registro de horas: se mudan, no se pierden');
ok(/impactoDeEliminarAsignatura/.test(CODIGO_VISTA), 'La confirmación enseña el impacto (apartado 3)');
ok(/grid-cols-2/.test(VISTA), 'Las secciones se pintan en cuadrícula (apartado 4)');
ok(/aria-label/.test(VISTA), 'Los botones de solo icono llevan nombre accesible');
ok(!/overflow-x-(auto|scroll)/.test(VISTA), '⚠️ sin scroll horizontal (apartado 13)');
ok(!/<table/.test(VISTA), '⚠️ ni tablas grandes (apartado 13)');

console.log('\n── 13. La condición de finalización (apartado 16) ──');

const cond = condicionES3(ESCENARIO);
ok(cond.length >= 12, `La condición tiene ${cond.length} casillas`);
ok(cond.every((c) => c.id && c.texto && typeof c.ok === 'boolean'), 'Cada casilla dice qué comprueba');
ok(cond.every((c) => c.ok), `Todas en verde: ${cond.filter((c) => !c.ok).map((c) => c.texto).join(', ') || 'ninguna roja'}`);
// 🚨 Y PUEDE PONERSE ROJA: una auditoría que no puede fallar no sirve (EH F42). Estas dos
// comprobaciones son las que lo demuestran — sin ellas, las doce casillas de arriba no prueban nada.
const rota = condicionES3({
  programas: [], asignaturas: [{ id: 'z', nombre: 'Sin área', programaIds: [404] }], examenes: [], horas: [], temas: [],
});
eq(rota.find((c) => c.id === 'relacion').ok, false,
  '🚨 con una asignatura cuyo área no es un id, la casilla de la relación SE PONE ROJA');
eq(condicionES3(ESCENARIO).find((c) => c.id === 'relacion').ok, true, '…y con el escenario bueno, verde');
// Y la de "no se ha roto nada" mira que los exámenes vuelvan IDÉNTICOS, no solo que sean los mismos.
eq(condicionES3(ESCENARIO).find((c) => c.id === 'no_roto').ok, true, 'Los exámenes y las horas vuelven intactos');
ok(NO_EN_ES3.length >= 6 && NO_EN_ES3.every((x) => x.que && x.porque), 'Lo que no se implementa está declarado con su motivo');
ok(NO_EN_ES3.some((x) => /entregas/i.test(x.que)), 'Las entregas están entre lo que no se hace');

console.log(`\n  ${fallos.length ? '✗' : '✓'} ES F3 — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
