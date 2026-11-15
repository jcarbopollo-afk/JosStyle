// ---------------------------------------------------------------------------
// HORARIOS · FASE 4, ENTREGA A (corrección) — LO QUE SE VE EN SOLO LECTURA,
// pintado de verdad con react-dom/server.
//
// Para cada panel con acciones de escritura (la mochila, las automatizaciones,
// el tablón del día con «Marcar como hecha», la ficha de una actividad y la
// pantalla entera del horario), se pinta DOS veces: con las funciones que
// escriben —el control: los botones existen— y como las deja HorarioView en
// solo lectura —los botones no existen, y lo que se consulta sigue ahí—.
//
// Lo que no se puede comprobar aquí (renderToString no ejecuta manejadores ni
// abre plegables): los avisos, que se abren con «Ver», y el panel de una clase,
// que se abre al tocarla. Los dos se comprueban en el recorrido de Chromium.
//
// Todos los datos de esta prueba son DE PRUEBA, construidos aquí.
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import HorarioView, { HoyView, FichaActividad } from '../src/views/HorarioView.jsx';
import { ACCENTS } from '../src/tokens.js';
import { DEFAULT_HORARIO_TOP } from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido } from '../src/lib/horarioEditor.js';
import { contextoTemporal } from '../src/lib/hoy.js';
import { fichaActividad, impactoEliminarActividad } from '../src/lib/actividades.js';
import { DiagnosticoHorarios } from '../src/components/diagnosticoHorarioPanel.jsx';
import { diagnosticoHorarios } from '../src/lib/diagnosticoHorario.js';

const accent = ACCENTS[0].value;
const noop = () => {};
let pasa = 0;
let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) { pasa++; console.log(`  ✓ ${nombre}`); } else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};
const html = (el) => renderToString(el);
const texto = (h) => h.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** Los botones pintados, por su texto o su aria-label. */
const botones = (h) => [...h.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => {
  const etiqueta = (m[1].match(/aria-label="([^"]*)"/) || [])[1];
  return (etiqueta || texto(m[2])).trim();
});
const tiene = (h, re) => botones(h).some((b) => re.test(b));

const HOY = new Date().toLocaleDateString('sv-SE');

// ── Un horario DE PRUEBA con dos clases hoy ───────────────────────────────
const base = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Prueba', plantillaId: 'semana', hoy: HOY });
const diaHoy = ((new Date().getDay() + 6) % 7) + 1;
const columna = base.horario.columnas.find((c) => c.dia === diaHoy);
let estado = crearBloqueRapido(base.estado, { horarioId: base.horario.id, columnaId: columna.id, inicio: '00:00', fin: '00:01', texto: 'Clase de prueba', hoy: HOY }).estado;
estado = crearBloqueRapido(estado, { horarioId: base.horario.id, columnaId: columna.id, inicio: '23:58', fin: '23:59', texto: 'Otra de prueba', hoy: HOY }).estado;
const contexto = contextoTemporal(estado, { fecha: HOY, hoy: HOY });

// El tablón con una clase pasada (la que lleva «Marcar como hecha»).
const ev = { clave: 'p1', inicio: '00:00', titulo: 'Clase de prueba', estadoTemporal: 'pasada' };
const tablon = { activos: [ev], todos: [ev], pasados: [], terminadas: 1, completadas: 0 };
const mochila = {
  mochila: { elementos: [{ clave: 'm1', nombre: 'Libreta de prueba', prioridad: 'obligatorio', disponible: true, preparado: false, origen: 'manual', cantidad: 1, porQueTexto: 'Prueba.' }] },
  progreso: { vacia: false, total: 1, preparados: 0, porcentaje: 0, completa: false, aviso: '' },
};
const automatizaciones = (conFunciones) => ({
  propuestas: [
    { automatizacionId: 'a1', valor: 'Meter la bata', porQue: 'Biología', confirmar: false },
    { automatizacionId: 'a2', valor: 'Avisar al salir', porQue: 'Educación física', confirmar: true },
  ],
  historial: [],
  ejecutar: conFunciones ? noop : null,
  ejecutarTodo: conFunciones ? noop : null,
  deshacer: conFunciones ? noop : null,
});
const accionesMochila = { marcar: noop, prepararTodo: noop, vaciar: noop, anadir: noop, quitar: noop, marcarManana: noop, prepararTodoManana: noop, vaciarManana: noop, anadirManana: noop, quitarManana: noop };

const hoyView = (conFunciones) => html(
  <HoyView
    contexto={contexto} accent={accent} modo="completo" onModo={noop}
    onCompletarTarea={noop} onReprogramar={noop} onAbrirBloque={noop} onIrAFecha={noop}
    mochilaHoy={mochila} mochilaManana={null} accionesMochila={conFunciones ? accionesMochila : null}
    tablon={tablon} automatizaciones={automatizaciones(conFunciones)} planificador={null}
    centroAvisos={null} accionesAvisos={null} analitica={null}
    onCompletar={conFunciones ? noop : null}
  />,
);

console.log('\n── HoyView: con funciones (control) y en solo lectura ──');
{
  const con = hoyView(true);
  const sin = hoyView(false);
  comprobar('Control: «Marcar como hecha» existe con la función', tiene(con, /^Marcar como hecha Clase de prueba$/));
  comprobar('Solo lectura: «Marcar como hecha» no existe', !tiene(sin, /Marcar como hecha/));
  comprobar('Solo lectura: la clase sigue a la vista', texto(sin).includes('Clase de prueba'));
  comprobar('Control: la mochila tiene su casilla, «Meter todo» y «Añadir»', tiene(con, /^Meter Libreta de prueba$/) && tiene(con, /^Meter todo$/) && tiene(con, /^Añadir$/));
  comprobar('Solo lectura: la mochila no tiene casilla pulsable, ni «Meter todo», ni «Añadir», ni «Quitar»',
    !tiene(sin, /^Meter Libreta|^Sacar Libreta|^Meter todo$|^Añadir$|^Quitar /), botones(sin).join(' | '));
  comprobar('Solo lectura: lo que hay en la mochila sigue a la vista, con su estado', texto(sin).includes('Libreta de prueba') && /Libreta de prueba: sin meter/.test(sin));
  comprobar('Control: automatizaciones con «Hacerlo» y «Sí»', tiene(con, /^Hacerlo$/) && tiene(con, /^Sí$/));
  comprobar('Solo lectura: automatizaciones sin «Hacerlo», «Sí» ni «Ahora no»', !tiene(sin, /^Hacerlo$|^Sí$|^Ahora no$/));
  comprobar('Solo lectura: se sigue viendo qué haría', texto(sin).includes('Meter la bata') && texto(sin).includes('Avisar al salir'));
}

console.log('\n── FichaActividad: con funciones (control) y en solo lectura ──');
{
  const actividadId = estado.actividades[0]?.id;
  const ficha = fichaActividad(estado, actividadId, { acento: accent, hoy: HOY });
  const impacto = impactoEliminarActividad(estado, actividadId, {});
  const props = { ficha, impacto, accent, onEditar: noop, onFavorita: noop, onArchivar: noop, onDuplicar: noop, onEliminar: noop, onCerrar: noop };
  const con = html(<FichaActividad {...props} />);
  const sin = html(<FichaActividad {...props} soloLectura />);
  comprobar('Control: la ficha tiene Editar, Duplicar, Archivar, Eliminar y favorita',
    ['Editar', 'Duplicar', 'Archivar', 'Eliminar'].every((b) => tiene(con, new RegExp(`^${b}$`))) && tiene(con, /favorita/));
  comprobar('Solo lectura: ni Editar, ni Duplicar, ni Archivar, ni Eliminar, ni favorita',
    !tiene(sin, /^Editar$|^Duplicar$|^Archivar$|^Recuperar$|^Eliminar$|favorita/), botones(sin).join(' | '));
  comprobar('Solo lectura: se puede cerrar, y la ficha se sigue leyendo', tiene(sin, /^Cerrar$/) && texto(sin).includes(ficha.titulo));
}

console.log('\n── HorarioView entero ──');
{
  const props = { horarioTop: estado, asignaturas: [], accent, hoy: HOY, onCambiar: noop, onCrearHorario: noop, horarioCrudo: estado };
  const editable = html(<HorarioView {...props} />);
  const lectura = html(<HorarioView {...props} soloLectura="version_futura" />);
  const rota = html(<HorarioView {...props} horarioTop={DEFAULT_HORARIO_TOP} horarioCrudo={{ horarios: { roto: true } }} soloLectura="datos_malformados" />);
  const vaciaEditable = html(<HorarioView {...props} horarioTop={DEFAULT_HORARIO_TOP} horarioCrudo={DEFAULT_HORARIO_TOP} />);
  comprobar('Versión 1 válida: sigue siendo editable («Editar horario» existe) y sin aviso', tiene(editable, /^Editar horario$/) && !texto(editable).includes('versión más nueva'));
  comprobar('Solo lectura: no hay «Editar horario»', !tiene(lectura, /Editar horario/));
  comprobar('Solo lectura: el aviso con Recargar', texto(lectura).includes('Tu horario se guardó con una versión más nueva de JosStyle') && tiene(lectura, /^Recargar$/));
  comprobar('Solo lectura: el diagnóstico sigue accesible', tiene(lectura, /^Diagnóstico de tus horarios$/));
  comprobar('Datos malformados: aviso propio, sin «Crear» y con el diagnóstico',
    texto(rota).includes('no tiene la forma que esta versión sabe leer') && !tiene(rota, /Crear/) && tiene(rota, /^Diagnóstico de tus horarios$/), botones(rota).join(' | '));
  comprobar('Control: sin solo lectura, la pantalla vacía sí ofrece crear un horario', tiene(vaciaEditable, /Crear/));
  comprobar('Solo lectura: el selector de vistas (consultar) sigue', tiene(lectura, /^Semana$/) && tiene(lectura, /^Día$/));
}

console.log('\n── El panel de diagnóstico: columnas vacías, ilegibles y sin contenido ──');
{
  const pinta = (columnas) => texto(html(<DiagnosticoHorarios diagnostico={diagnosticoHorarios({ horarios: [{ id: 'h1', columnas, filas: [] }] }, { hoy: HOY })} />));
  comprobar('columnas: [] → «Columnas 0»', /Columnas 0\b/.test(pinta([])));
  const ilegible = pinta('texto');
  comprobar('columnas: «texto» → «Columnas No se puede leer», nunca «Columnas 0»', /Columnas No se puede leer/.test(ilegible) && !/Columnas 0\b/.test(ilegible), ilegible.slice(0, 300));
  comprobar('Y enseña la ruta del problema', ilegible.includes('horarios[0].columnas'));
  comprobar('columnas: null → «Columnas 0» y el aviso de algo guardado sin contenido', /Columnas 0\b/.test(pinta(null)) && pinta(null).includes('sin contenido'));
  // Y con la colección PRINCIPAL ilegible: tampoco un cero engañoso.
  const principal = texto(html(<DiagnosticoHorarios diagnostico={diagnosticoHorarios({ horarios: 'texto' }, { hoy: HOY })} />));
  comprobar('horarios: «texto» → «Horarios No se puede leer» y «Columnas No se puede leer», nunca «Columnas 0»',
    /Horarios No se puede leer/.test(principal) && /Columnas No se puede leer/.test(principal) && !/Columnas 0\b/.test(principal), principal.slice(0, 300));
  comprobar('horarios: «texto» → y enseña la ruta: horarios (se esperaba lista, hay texto)', principal.includes('horarios (se esperaba lista, hay texto)'));
  const conActividades = texto(html(<DiagnosticoHorarios diagnostico={diagnosticoHorarios({ actividades: 'texto' }, { hoy: HOY })} />));
  comprobar('actividades: «texto» → «Actividades No se puede leer»', /Actividades No se puede leer/.test(conActividades));
  const conBloques = texto(html(<DiagnosticoHorarios diagnostico={diagnosticoHorarios({ bloques: 'texto' }, { hoy: HOY })} />));
  comprobar('bloques: «texto» → «Clases No se puede leer»', /Clases No se puede leer/.test(conBloques));
  // 🔎 A4 — un elemento malformado dentro de horarios: la fila de columnas no puede ser el parcial.
  for (const [donde, horarios] of [
    ['delante', ['texto', { id: 'h', columnas: [{ id: 'c', dia: 1 }], filas: [] }]],
    ['al final', [{ id: 'h', columnas: [{ id: 'c', dia: 1 }], filas: [] }, 'texto']],
  ]) {
    const conMalo = texto(html(<DiagnosticoHorarios diagnostico={diagnosticoHorarios({ horarios }, { hoy: HOY })} />));
    comprobar(`horarios con «texto» ${donde} → «Columnas No se puede leer», nunca el parcial «Columnas 1»`,
      /Columnas No se puede leer/.test(conMalo) && !/Columnas 1\b/.test(conMalo), conMalo.slice(0, 300));
    comprobar(`horarios con «texto» ${donde} → y enseña la ruta del elemento`, /horarios\[[01]\] \(se esperaba objeto, hay texto\)/.test(conMalo));
  }
  const conHueco = texto(html(<DiagnosticoHorarios diagnostico={diagnosticoHorarios({ horarios: [null, { id: 'h', columnas: [{ id: 'c', dia: 1 }], filas: [] }] }, { hoy: HOY })} />));
  comprobar('horarios con un hueco null → «Columnas 1», como antes', /Columnas 1\b/.test(conHueco));
}

console.log(`\n${fallos ? '✗' : '✓'} ${pasa}/${pasa + fallos} comprobaciones (solo lectura de Horarios, renderizado)\n`);
if (fallos) process.exit(1);
