// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 44 (ES F4) — EXÁMENES, ENTREGAS Y FECHAS
// ══════════════════════════════════════════════════════════════════════════
//
// El apartado 19 es el que manda: *"Un examen no debe existir como examen dentro
// de asignatura, evento diferente en Home y evento diferente en calendario.
// **Debe existir un único registro que pueda visualizarse desde diferentes
// lugares**."* Lo que más se comprueba aquí es justamente eso.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  TIPOS_FECHA, IDS_TIPO_FECHA, tipoDeFecha,
  ESTADOS_EXAMEN, ESTADOS_ENTREGA, IDS_ESTADO_EXAMEN, IDS_ESTADO_ENTREGA,
  estadoExamen, estadoEntrega, siguienteEstadoEntrega,
  TIPOS_EVENTO_ACADEMICO, IDS_TIPO_EVENTO, TIPO_EVENTO_POR_DEFECTO, tipoEventoAcademico,
  MAX_NOMBRE_FECHA, MAX_NOTAS_FECHA,
  normalizarExamen, normalizarEntrega, normalizarEventoAcademico, normalizarFechasDe,
  crearEntrega, crearEventoAcademico,
  editarExamenFecha, editarEntrega, editarEventoAcademico,
  cambiarEstadoExamen, cambiarEstadoEntrega, avanzarEntrega,
  fechasAcademicas, DIAS_CUENTA_ATRAS, diasHastaLocal, cuentaAtras,
  MAX_PROXIMAS, DIAS_PROXIMAS, proximasFechas, pasadas, cuentasDeAsignatura,
  impactoDeEliminarFecha, NO_EN_ES4, condicionES4,
} from '../src/lib/fechasAcademicas.js';

import { proximosEventos, LO_QUE_FALTA_EN_PROXIMO, SISTEMAS_DE_RAMA, RAMAS_POR_DEFECTO, normalizarAppsDe } from '../src/lib/estudiosApps.js';
import { SECCIONES_ASIGNATURA, resumenAsignatura, seccionesDeAsignatura, impactoDeEliminarAsignatura } from '../src/lib/asignaturas.js';
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
const LIB = leer('src/lib/fechasAcademicas.js');
const CODIGO_LIB = soloCodigo(LIB);
const APP = leer('src/App.jsx');
const CAL = leer('src/lib/calendarioIntegracion.js');

const ESCENARIO = normalizarAppsDe({
  programas: [{ id: 'bach', nombre: 'Bachillerato' }],
  asignaturas: [
    { id: 'a1', programaId: 'bach', nombre: 'Biología' },
    { id: 'a2', programaId: 'bach', nombre: 'Historia' },
  ],
  examenes: [
    { id: 'e1', asignaturaId: 'a1', fecha: '2026-09-10', tema: 'Genética', hora: '09:00', notaObjetivo: '9', planRepaso: [{ id: 'p1', texto: 'Repasar', hecho: false }] },
    { id: 'e2', asignaturaId: 'a1', fecha: '2026-06-01', tema: 'Viejo' },
  ],
  horas: [],
  temas: [],
  entregas: [
    { id: 't1', asignaturaId: 'a2', nombre: 'Trabajo de Historia', fecha: '2026-09-12', hora: '23:59', estado: 'pendiente' },
    { id: 't2', asignaturaId: 'a2', nombre: 'Ya entregado', fecha: '2026-09-30', estado: 'entregada' },
  ],
  eventos: [
    { id: 'v1', asignaturaId: 'a1', nombre: 'Exposición de clase', fecha: '2026-09-15', tipo: 'exposicion' },
  ],
});

console.log('\n── 1. 🚨 UN SOLO REGISTRO, VISTO DESDE MUCHOS SITIOS (apartado 19) ──');

const todas = fechasAcademicas(ESCENARIO);
eq(todas.length, 5, 'Las cinco fechas salen de una sola función');
const ids = todas.map((f) => `${f.tipo}:${f.id}`);
eq(new Set(ids).size, ids.length, '🚨 y NI UN registro duplicado');
ok(todas.every((f) => 'tipo' in f && 'id' in f && 'nombre' in f && 'fecha' in f && 'asignaturaId' in f),
  'Los tres tipos salen con la MISMA forma: quien las pinte no necesita saber de qué lista vienen');
ok(!/saveData|localStorage|supabase/.test(CODIGO_LIB), '🚨 La librería no guarda nada: es una lectura sobre lo que ya existe');

// 🚨 Y el Home, la asignatura y el Calendario LEEN de ahí, no de las listas por su cuenta.
ok(/fechasAcademicas|proximasFechas/.test(soloCodigo(leer('src/lib/estudiosApps.js'))), '🚨 El Home lee de `fechasAcademicas`');
ok(/fechasAcademicas/.test(soloCodigo(leer('src/lib/asignaturas.js'))), '🚨 La asignatura también');
ok(/fechasAcademicas/.test(soloCodigo(CAL)), '🚨 y el Calendario también (apartado 16)');
ok(/soloLectura: true/.test(CAL), '⚠️ y lo del Calendario es DERIVADO y de solo lectura (regla 11)');
ok(!/estudios\.entregas\.map|estudios\.eventos\.map/.test(soloCodigo(CAL)), 'El Calendario no recorre las listas por su cuenta');

console.log('\n── 2. Los exámenes ya existían: se amplían, no se recrean ──');

ok(Array.isArray(DEFAULT_ESTUDIOS.examenes), 'DEFAULT_ESTUDIOS.examenes sigue existiendo');
ok(Array.isArray(DEFAULT_ESTUDIOS.entregas) && Array.isArray(DEFAULT_ESTUDIOS.eventos), 'y entregas y eventos son las listas nuevas');
const norm = normalizarFechasDe(ESCENARIO);
const ex1 = norm.examenes.find((e) => e.id === 'e1');
eq(ex1.tema, 'Genética', '🚨 El título de un examen sigue siendo `tema`: no se le añade un `nombre` al lado (E3 F26)');
ok(!/nombre:/.test(CODIGO_LIB.split('normalizarExamen')[1].split('}')[0] || ''), 'y el normalizador del examen no escribe ningún `nombre`');
eq(ex1.notaObjetivo, '9', '⚠️ y conserva la nota objetivo…');
eq(ex1.planRepaso.length, 1, '…y su PLAN DE REPASO, que la IA le generó');
eq(ex1.hora, '09:00', 'Suma la hora');
eq(ex1.estado, 'proximo', 'y el estado, que nace Próximo');
eq(normalizarExamen({ asignaturaId: 'a1', hora: '25:99' }).hora, null, "🚨 `'25:99'` encaja con la FORMA de una hora y no es una hora (E3 F8)");
eq(normalizarExamen({ asignaturaId: 'a1', fecha: '2026-13-45' }).fecha, null, "🚨 y `'2026-13-45'` tampoco es una fecha (E3 F9)");
eq(normalizarExamen({ tema: 'X' }), null, '🚨 Un examen sin asignatura se descarta');
eq(normalizarFechasDe(null), null, 'Un módulo que no es un objeto se devuelve tal cual');
eq(normalizarFechasDe({ ...ESCENARIO, otro: 1 }).otro, 1, '🚨 Devuelve el módulo ENTERO (regla 5)');

console.log('\n── 3. Entregas y eventos (apartados 4, 5 y 6) ──');

const t = crearEntrega({ nombre: 'Trabajo', asignaturaId: 'a2', fecha: '2026-10-01' });
ok(t && t.id, 'crearEntrega devuelve una entrega con id');
eq(t.estado, 'pendiente', 'que nace Pendiente');
eq(crearEntrega({ nombre: 'X' }), null, '🚨 Sin asignatura no se crea: todo va vinculado (apartado 7)');
eq(crearEntrega({ asignaturaId: 'a2' }), null, 'Y sin nombre tampoco');
eq(ESTADOS_ENTREGA.length, 3, 'La entrega tiene tres estados (apartado 5)');
eq(IDS_ESTADO_ENTREGA, ['pendiente', 'progreso', 'entregada'], 'Pendiente, En progreso y Entregada');
eq(ESTADOS_EXAMEN.length, 2, 'y el examen dos (apartado 3)');
ok([...ESTADOS_ENTREGA, ...ESTADOS_EXAMEN].every((e) => e.nombre && e.icono),
  '🚨 cada estado con icono Y palabra: *"no depender únicamente del color"* (apartado 12)');
eq(siguienteEstadoEntrega('pendiente'), 'progreso', 'El ciclo avanza…');
eq(siguienteEstadoEntrega('entregada'), 'pendiente', '…y se cierra');
eq(avanzarEntrega(norm.entregas, 't1').find((x) => x.id === 't1').estado, 'progreso', 'Avanzar una entrega cambia su estado');
eq(cambiarEstadoEntrega(norm.entregas, 't1', 'inventado').find((x) => x.id === 't1').estado, 'pendiente', 'Un estado inventado no cambia nada');
eq(cambiarEstadoExamen(norm.examenes, 'e1', 'realizado').find((x) => x.id === 'e1').estado, 'realizado', 'Y el examen se marca como realizado');

// 🚨 Apartado 6 — UNA lista de eventos con tipo configurable, no una por caso.
ok(TIPOS_EVENTO_ACADEMICO.length >= 4, `Hay ${TIPOS_EVENTO_ACADEMICO.length} tipos de evento`);
ok(IDS_TIPO_EVENTO.includes('presentacion') && IDS_TIPO_EVENTO.includes('exposicion') && IDS_TIPO_EVENTO.includes('recuperacion'), 'con los del apartado 6');
ok(!CATALOGO_PAPELERA['estudios.presentaciones'] && !CATALOGO_PAPELERA['estudios.exposiciones'],
  '🚨 y NO hay una lista por cada caso: *"no crear una categoría para cada caso"*');
eq(crearEventoAcademico({ nombre: 'X', asignaturaId: 'a1' }).tipo, TIPO_EVENTO_POR_DEFECTO, 'Sin tipo cae al de por defecto');
eq(crearEventoAcademico({ nombre: 'X', asignaturaId: 'a1', tipo: 'inventado' }).tipo, TIPO_EVENTO_POR_DEFECTO, 'Y uno inventado también');
eq(tipoEventoAcademico('exposicion').nombre, 'Exposición', 'tipoEventoAcademico encuentra uno');

console.log('\n── 4. Editar, y lo que NO se puede editar (apartado 14) ──');

eq(editarEntrega(norm.entregas, 't1', { fecha: '2026-09-20' }).find((x) => x.id === 't1').fecha, '2026-09-20', 'Cambiar la fecha de una entrega');
eq(editarEntrega(norm.entregas, 't1', { asignaturaId: 'a1' }).find((x) => x.id === 't1').asignaturaId, 'a2',
  '🚨 pero NO su asignatura por la puerta de atrás');
eq(editarEntrega(norm.entregas, 't1', { id: 'otro' }).find((x) => x.nombre === 'Trabajo de Historia').id, 't1', 'ni su id');
eq(editarExamenFecha(norm.examenes, 'e1', { tema: 'Otro' }).find((x) => x.id === 'e1').planRepaso.length, 1,
  '🚨 Editar un examen NO se lleva su plan de repaso');
eq(editarEventoAcademico(norm.eventos, 'v1', { tipo: 'practica' }).find((x) => x.id === 'v1').tipo, 'practica', 'Se puede cambiar el tipo de un evento');

// 🚨 Apartado 14 — y el Home se reordena solo, porque no hay copias.
const movida = { ...norm, entregas: editarEntrega(norm.entregas, 't1', { fecha: '2026-09-08' }) };
eq(proximasFechas(movida, HOY)[0].nombre, 'Trabajo de Historia',
  '🚨 CAMBIAR LA FECHA REORDENA EL HOME SOLO: no hay copias que sincronizar (apartados 14 y 19)');

console.log('\n── 5. Orden, próximas y pasadas (apartados 8, 9 y 10) ──');

const prox = proximasFechas(norm, HOY);
eq(prox.map((f) => f.fecha), ['2026-09-10', '2026-09-12', '2026-09-15', '2026-09-30'], '🚨 Ordenadas por fecha, la más cercana primero (apartado 9)');
ok(!prox.some((f) => f.fecha === '2026-06-01'), '🚨 El examen que ya pasó NO sale como próximo (apartado 10)');
eq(norm.examenes.length, 2, '⚠️ pero SIGUE GUARDADO: el filtro es de lectura, no borra ni archiva');
eq(pasadas(norm, HOY).map((f) => f.id), ['e2'], 'y se puede consultar lo que pasó');
eq(proximasFechas(norm, HOY, { limite: 2 }).length, 2, 'El tope se respeta');
eq(proximasFechas(norm, '2099-01-01').length, 0, 'Sin nada próximo, la lista está vacía');
eq(proximasFechas({ examenes: [], entregas: [], eventos: [] }, HOY), [], 'Sin datos no revienta');
ok(MAX_PROXIMAS === 5 && Number.isFinite(DIAS_PROXIMAS), 'La ventana y el tope están declarados');

// Una fecha sin fecha va al final, no se le inventa una.
const sinFecha = { ...norm, entregas: [...norm.entregas, { id: 't9', asignaturaId: 'a2', nombre: 'Sin fecha', estado: 'pendiente', fecha: null }] };
eq(fechasAcademicas(sinFecha).at(-1).id, 't9', '⚠️ Lo que no tiene fecha va al final: no se le inventa una');
ok(!proximasFechas(sinFecha, HOY).some((f) => f.id === 't9'), 'y no sale como próximo');

// Dos el mismo día: manda la hora.
const mismoDia = { ...norm, eventos: [{ id: 'v9', asignaturaId: 'a1', nombre: 'Temprano', fecha: '2026-09-10', hora: '08:00', tipo: 'otro' }] };
eq(fechasAcademicas(mismoDia).filter((f) => f.fecha === '2026-09-10').map((f) => f.id), ['v9', 'e1'], '⚠️ El mismo día, ordena la hora');

console.log('\n── 6. La cuenta atrás (apartado 11) ──');

eq(cuentaAtras('2026-09-07', HOY), 'Hoy', 'Hoy');
eq(cuentaAtras('2026-09-08', HOY), 'Mañana', 'Mañana');
eq(cuentaAtras('2026-09-10', HOY), 'En 3 días', 'En 3 días');
eq(cuentaAtras('2026-09-06', HOY), 'Ayer', 'Ayer');
eq(cuentaAtras('2027-01-01', HOY), null, '⚠️ Más allá de dos semanas, `null`: *"solo cuando mejoren la comprensión"*');
eq(cuentaAtras(null, HOY), null, 'Sin fecha no hay cuenta atrás');
eq(diasHastaLocal(HOY, '2026-09-10'), 3, 'Los días se cuentan contra el `hoy` recibido…');
eq(diasHastaLocal('2026-12-31', '2027-01-01'), 1, '…y cruzando el año en LOCAL, no en UTC (la trampa de siempre)');
ok(DIAS_CUENTA_ATRAS === 14, 'La ventana está declarada');

console.log('\n── 7. La navegación del árbol (apartado 20) ──');

ok(SISTEMAS_DE_RAMA.entregas && SISTEMAS_DE_RAMA.eventos, '🚨 El área tiene ramas de entregas y eventos: se ven las de TODAS sus asignaturas');
ok(RAMAS_POR_DEFECTO.some((r) => r.sistema === 'entregas'), 'y un área nueva las trae');
ok(SECCIONES_ASIGNATURA.some((s) => s.id === 'entregas' && s.existe), '🔓 La asignatura tiene su sección de Entregas: la ES F3 la declaró imposible y ésta la construye');
ok(SECCIONES_ASIGNATURA.some((s) => s.id === 'eventos' && s.existe), 'y la de Eventos');
eq(LO_QUE_FALTA_EN_PROXIMO, [], '🔓 y ya no falta nada en la zona de PRÓXIMO del Home');

const deBio = fechasAcademicas(norm, { asignaturaId: 'a1' });
eq(deBio.length, 3, 'Desde una asignatura se ven solo las suyas');
ok(deBio.every((f) => f.asignaturaId === 'a1'), 'todas de Biología');
const delArea = fechasAcademicas(norm, { asignaturaIds: ['a1', 'a2'] });
eq(delArea.length, 5, 'y desde el área, las de todas sus asignaturas');

const desdeHome = proximosEventos(norm, HOY);
ok(desdeHome.length >= 3, `El Home enseña ${desdeHome.length} fechas próximas`);
ok(desdeHome.some((e) => e.tipo === 'entrega'), '🚨 incluidas las ENTREGAS, que antes no salían');
ok(desdeHome.some((e) => e.tipo === 'evento'), 'y los eventos');
ok(desdeHome.every((e) => e.icono && e.titulo), 'cada una con su icono y su título');
ok(desdeHome.every((e) => e.programaId && e.asignaturaId), 'y con los ids para poder navegar hasta ella');

console.log('\n── 8. El resumen de la asignatura y su borrado ──');

const res = resumenAsignatura(norm, 'a2', HOY);
ok(res.some((l) => /1 entrega pendiente/.test(l)), '🔓 El resumen YA cuenta las entregas pendientes (la ES F3 no podía)');
ok(!res.some((l) => /2 entregas/.test(l)), '⚠️ y no cuenta la que ya está entregada');
const secs = seccionesDeAsignatura(norm, 'a1');
eq(secs.find((s) => s.id === 'examenes').cuantos, 2, 'La sección de exámenes cuenta los suyos');
eq(secs.find((s) => s.id === 'eventos').cuantos, 1, 'la de eventos, los suyos');
eq(secs.find((s) => s.id === 'entregas').cuantos, 0, 'y la de entregas, cero en Biología');
eq(secs.find((s) => s.id === 'entregas').linea, null, 'que no se pinta como "0 entregas"');

const imp = impactoDeEliminarAsignatura(norm, 'a2');
ok(/2 entregas/.test(imp.aviso), '🚨 Borrar una asignatura avisa de las entregas que se lleva');
ok(/recuperar/i.test(imp.aviso), 'y de que se recuperan');
ok(/entregas: \(estudios\.entregas \|\| \[\]\)\.filter/.test(APP), '🚨 y App.jsx se las lleva de verdad en la cascada');
ok(/coleccion: 'entregas'/.test(APP) && /coleccion: 'eventos'/.test(APP), '⚠️ en la MISMA entrada de papelera');
ok(CATALOGO_PAPELERA['estudios.entregas'] && CATALOGO_PAPELERA['estudios.eventos'], '⚠️ y las dos listas están en el catálogo de la papelera (EH F45)');

const impFila = impactoDeEliminarFecha({ tipo: 'entrega', notas: 'Importante' });
eq(impFila.tieneDatos, true, 'Una fecha con notas avisa antes de borrarse (apartado 15)');
ok(/recuperar/i.test(impFila.aviso), 'y dice que se recupera: va a la papelera');
ok(!/no se puede deshacer/i.test(impFila.aviso), 'nunca promete un borrado definitivo');
ok(!/eliminarConPapelera|saveData/.test(CODIGO_LIB), '🚨 La librería no borra: quien borra es App.jsx (ME F3)');

console.log('\n── 9. Las cuentas por asignatura ──');

const c = cuentasDeAsignatura(norm, 'a2', HOY);
eq(c.entregasPendientes, 1, 'Cuenta las entregas sin entregar');
eq(cuentasDeAsignatura(norm, 'a1', HOY).examenesProximos, 1, 'y los exámenes que vienen');
eq(cuentasDeAsignatura(norm, 'a1', HOY).eventosProximos, 1, 'y los eventos');
eq(cuentasDeAsignatura(norm, 'nadie', HOY).entregasPendientes, 0, 'Una asignatura que no existe cuenta cero');

console.log('\n── 10. La pantalla ──');

ok(/PanelFechas/.test(CODIGO_VISTA), '🚨 Las seis pantallas de fechas usan UN solo panel: seis copias serían seis sitios donde equivocarse');
ok(/FormFecha/.test(CODIGO_VISTA), 'con un formulario corto (apartado 18)');
ok(/DetalleFecha/.test(CODIGO_VISTA), 'y su vista de detalle (apartado 13)');
ok(/ExamenItem/.test(CODIGO_VISTA), '🚨 y los exámenes conservan `ExamenItem` con su plan de repaso');
ok(!/function FormExamen/.test(VISTA), '⚠️ y el formulario viejo, que ya no llama nadie, se ha retirado');
ok(/aria-label/.test(VISTA) && /aria-pressed/.test(VISTA), 'Con nombres accesibles y estados anunciados');
ok(!/overflow-x-(auto|scroll)/.test(VISTA), 'Sin scroll horizontal');

console.log('\n── 11. La condición de finalización (apartado 22) ──');

const cond = condicionES4(ESCENARIO);
ok(cond.length >= 12, `La condición tiene ${cond.length} casillas`);
ok(cond.every((c2) => c2.id && c2.texto && typeof c2.ok === 'boolean'), 'Cada casilla dice qué comprueba');
ok(cond.every((c2) => c2.ok), `Todas en verde: ${cond.filter((c2) => !c2.ok).map((c2) => c2.texto).join(', ') || 'ninguna roja'}`);
// 🚨 Y puede ponerse roja: una auditoría que no puede fallar no sirve (EH F42).
const rota = condicionES4({ programas: [], asignaturas: [], examenes: [{ id: 'x', asignaturaId: 'a', fecha: '2099-01-01' }], entregas: [], eventos: [] });
eq(rota.find((c2) => c2.id === 'pasados').ok, false, '🚨 con un examen en el futuro lejano, la casilla de "lo pasado no sale" SE PONE ROJA');
eq(condicionES4(ESCENARIO).find((c2) => c2.id === 'pasados').ok, true, '…y con el escenario bueno, verde');
ok(NO_EN_ES4.length >= 5 && NO_EN_ES4.every((x) => x.que && x.porque), 'Lo que no se implementa está declarado con su motivo');
ok(NO_EN_ES4.some((x) => /recordatorio|notificac/i.test(x.que)), 'Los recordatorios están entre lo que no se hace');
ok(!/new Notification|notificaciones/.test(CODIGO_LIB), '🚨 y la librería no emite ni un aviso: el emisor es `notificaciones.js`');

console.log(`\n  ${fallos.length ? '✗' : '✓'} ES F4 — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
