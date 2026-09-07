// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 26 (PR F4) — PRODUCTIVIDAD: TAREAS
// ══════════════════════════════════════════════════════════════════════════
//
// Los veinte puntos del «CRITERIO DE ÉXITO», y sobre todo el fallo que esta fase
// arregla: **una tarea tenía dos fechas** y por eso no salía en Hoy, ni en la
// Agenda, ni en el Calendario, ni en la vista semanal.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  PRIORIDADES, PRIORIDAD_POR_DEFECTO, prioridad, etiquetaDePrioridad,
  CATEGORIAS_TAREA, categoriaTarea, RELACIONES_FUTURAS, relacionFutura,
  crearTarea, normalizarTarea, normalizarTareas, normalizarTareasDe,
  ESTADOS_FECHA, estadoDeFecha, diasVencida, textoDeFecha,
  SECCIONES_TAREAS, seccionDeTarea, porSecciones,
  ORDENES_TAREA, ORDEN_POR_DEFECTO, ordenarTareas,
  FILTROS_TAREA, filtrarTareas, buscarTareas,
  completarTarea, tareaHecha, editarTarea, reprogramar, DESTINOS_REPROGRAMAR,
  resumenTareas, estadisticasDeTareas, vacioDeTareas,
  paraHoy, POMODORO_DESDE_TAREA, planConcentrarse, tareaDeSesion, aperturaInicial,
  condicionPR4,
} from '../src/lib/tareas.js';
import { tareasDeHoy } from '../src/lib/centroDelDia.js';
import { tareasDelDia } from '../src/lib/calendarioMes.js';
import { tareasConRepeticion } from '../src/lib/semana.js';
import { iniciarSesion, CONFIG_POMODORO_POR_DEFECTO } from '../src/lib/pomodoro.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

/* 🐛 **UNA PRUEBA QUE BUSCA SI EL CÓDIGO HACE ALGO QUITA LOS COMENTARIOS Y LAS
   CADENAS.** Es la lección más repetida de este proyecto en las pruebas, y aquí
   volvió a pasar dos veces en el mismo turno: mi cabecera dice *"si aparece un
   `setInterval`"* para prometer que no lo hay, y `RELACIONES_FUTURAS` NOMBRA a
   Metas y a Objetivos para declarar que NO se construyen. Las dos frases hacían
   saltar el barrido con código que estaba bien. */
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
const AYER = '2026-09-06';
const MANANA = '2026-09-08';
const LEJOS = '2026-09-20';
const HACE3 = '2026-09-04';

console.log('\n── 1. Prioridades (apartado «PRIORIDADES») ──────────────────────');
eq(PRIORIDADES.map((p) => p.id), ['alta', 'media', 'baja'], 'las tres del enunciado');
eq(PRIORIDAD_POR_DEFECTO, 'media', 'y la de por defecto es la intermedia');
ok(PRIORIDADES.every((p) => p.icono && p.nombre),
  '🚨 CADA UNA TRAE ICONO **Y** PALABRA: *"NO depender exclusivamente del color"*');
ok(PRIORIDADES.every((p) => typeof p.token === 'string' && !/^#/.test(p.token)),
  '🚨 y el color es un TOKEN, nunca un hex suelto (regla 2)');
ok(PRIORIDADES.every((p) => !/^#/.test(JSON.stringify(p))), 'ni escondido en otro campo');
const eAlta = etiquetaDePrioridad('alta');
ok(eAlta.icono && eAlta.nombre === 'Alta' && eAlta.destacada,
  'la alta se destaca, y su etiqueta se puede leer sin ver el color');
eq(etiquetaDePrioridad('inventada').nombre, 'Media', 'una prioridad que no existe cae en la de por defecto');
eq(prioridad('no_existe'), null, 'y preguntar por ella devuelve null, no un objeto a medias');
ok(PRIORIDADES.find((p) => p.id === 'alta').peso > PRIORIDADES.find((p) => p.id === 'baja').peso,
  'el peso ordena de alta a baja');

console.log('\n── 2. Categorías compatibles con el sistema general ─────────────');
eq(CATEGORIAS_TAREA.map((c) => c.id), ['estudios', 'fitness', 'personal', 'trabajo', 'casa', 'otros'],
  'las seis que nombra el enunciado');
ok(CATEGORIAS_TAREA.every((c) => 'modulo' in c),
  '⚠️ y CADA UNA DECLARA SU MÓDULO: *"utilizar categorías compatibles con el sistema general"*');
eq(categoriaTarea('estudios').modulo, 'estudios', 'Estudios ES el módulo Estudios, no una etiqueta que se llama igual');
ok(CATEGORIAS_TAREA.filter((c) => c.modulo === null).length === 3,
  '⚠️ y las que NO tienen módulo lo dicen con null, en vez de inventarse uno');
eq(categoriaTarea('inventada'), null, 'una categoría que no existe no se acepta');

console.log('\n── 3. 🚨 LA FECHA: el fallo que arregla esta fase ───────────────');
const vieja = normalizarTarea({ id: 'v', texto: 'Guardada antes', fechaLimite: HOY, hecha: false });
eq(vieja.fecha, HOY, '🚨 una tarea guardada con `fechaLimite` se lee con `fecha`');
ok(!('fechaLimite' in vieja),
  '🚨 y el campo viejo NO se vuelve a escribir: mantener los dos era el duplicado por la puerta de atrás');
const t1 = crearTarea({ texto: 'Estudiar biología', fecha: HOY, hora: '18:00', prioridadId: 'alta', categoria: 'estudios' });
ok(!('fechaLimite' in t1), 'y una tarea nueva no lo lleva nunca');

/* 🚨 LA COMPROBACIÓN QUE FALTABA: las cuatro pantallas que enseñan una tarea con
   fecha leen `t.fecha`. Con `fechaLimite`, una tarea creada en Productividad no
   salía en NINGUNA de las cuatro, y las cuatro se pintaban perfectas. */
const prod = { tareas: [vieja, t1], habitos: [], rutinas: [], metas: [], apuntes: [] };
ok(tareasDeHoy(prod, HOY).length === 2, '🚨 SALE EN HOY (centroDelDia.tareasDeHoy)');
ok(tareasDelDia(prod, HOY).length === 2, '🚨 SALE EN EL CALENDARIO (calendarioMes.tareasDelDia)');
ok(tareasConRepeticion(prod, HOY).length === 2, '🚨 SALE EN LA VISTA SEMANAL (semana.tareasConRepeticion)');
const soloVieja = { tareas: [{ id: 'v', texto: 'Sin migrar', fechaLimite: HOY, hecha: false }] };
ok(tareasDeHoy(soloVieja, HOY).length === 0,
  '🐛 Y SIN MIGRAR NO SALÍA: es exactamente el fallo — la prueba se pone roja si alguien quita la migración');
ok(tareasDeHoy(normalizarTareasDe(soloVieja), HOY).length === 1, 'y con la migración, sí');
eq(normalizarTareasDe(null), null, 'y `normalizarTareasDe` aguanta que no le den nada');
ok(normalizarTareasDe({ tareas: null }).tareas.length === 0, 'y que `tareas` no sea un array');

console.log('\n── 4. Crear y normalizar ───────────────────────────────────────');
eq(crearTarea({ texto: '   ' }), null, 'sin título no hay tarea: el título es obligatorio');
eq(crearTarea({}), null, 'ni sin nada');
eq(t1.prioridad, 'alta', 'la prioridad se guarda');
eq(t1.categoria, 'estudios', 'y la categoría');
eq(crearTarea({ texto: 'x', categoria: 'inventada' }).categoria, null, 'una categoría que no existe se descarta');
eq(crearTarea({ texto: 'x', fecha: '2026-13-45' }).fecha, null,
  "🐛 `'2026-13-45'` encaja con la FORMA de una fecha y no es un día: `fechaValida`, no una expresión");
eq(crearTarea({ texto: 'x', hora: '25:99' }).hora, '',
  "🐛 y `'25:99'` encaja con `\\d{2}:\\d{2}`: la forma no basta (E3 F8)");
eq(crearTarea({ texto: 'x' }).prioridad, 'media', 'sin decir prioridad, la de por defecto');
ok(crearTarea({ texto: 'x' }).creadaEn, 'y se apunta cuándo nació');
eq(normalizarTarea({ texto: '' }), null, 'lo guardado sin título se descarta');
eq(normalizarTarea(null), null, 'y lo que no es una tarea, también');
ok(normalizarTarea({ id: 'x', texto: 'T' }).id === 'x', 'el id se conserva');
ok(normalizarTarea({ texto: 'T' }).id, 'y a lo que no lo tiene se le pone uno: un elemento sin id es un duplicado esperando');
eq(normalizarTarea({ texto: 'T', hecha: false, completadaEn: '2026-01-01' }).completadaEn, null,
  '⚠️ una tarea SIN HACER no puede llevar fecha de completada: sería una mentira guardada');
eq(normalizarTarea({ texto: 'T', prioridad: 'urgentísima' }).prioridad, 'media', 'una prioridad inventada cae en la de por defecto');
eq(normalizarTareas([null, { texto: '' }, { texto: 'Vale' }]).length, 1, 'y la lista se limpia');
const conEnlaces = normalizarTarea({ texto: 'T', metaId: 'm1', objetivoId: 'o1' });
eq([conEnlaces.metaId, conEnlaces.objetivoId], ['m1', 'o1'], 'los dos enlaces futuros se conservan si alguien los pone');
eq(normalizarTarea({ texto: 'T' }).metaId, null, 'y no se inventan si no');

console.log('\n── 5. Estados de fecha (apartado «FECHAS») ──────────────────────');
eq(ESTADOS_FECHA.map((e) => e.id), ['vencida', 'hoy', 'manana', 'proximamente', 'sin_fecha'],
  'los cinco que el enunciado pide reconocer');
eq(estadoDeFecha({ fecha: HOY }, HOY), 'hoy', 'hoy');
eq(estadoDeFecha({ fecha: MANANA }, HOY), 'manana', 'mañana');
eq(estadoDeFecha({ fecha: LEJOS }, HOY), 'proximamente', 'próximamente');
eq(estadoDeFecha({ fecha: AYER }, HOY), 'vencida', 'vencida');
eq(estadoDeFecha({ fecha: null }, HOY), 'sin_fecha', 'sin fecha');
eq(estadoDeFecha({ fecha: '2026-13-45' }, HOY), 'sin_fecha', 'y una fecha imposible cuenta como sin fecha, no como vencida');
eq(diasVencida({ fecha: AYER }, HOY), 1, 'un día vencida');
eq(diasVencida({ fecha: HACE3 }, HOY), 3, 'tres días');
eq(diasVencida({ fecha: MANANA }, HOY), 0, 'y lo que no está vencido no tiene días de retraso');
eq(textoDeFecha({ fecha: AYER }, HOY), 'Vencida · ayer',
  '⚠️ *"Vencida · ayer"* es el ejemplo literal del enunciado');
eq(textoDeFecha({ fecha: HACE3 }, HOY), 'Vencida · hace 3 días', 'y con más días, se dicen');
eq(textoDeFecha({ fecha: HOY, hora: '18:00' }, HOY), 'Hoy · 18:00', 'la hora se pinta si la hay');
eq(textoDeFecha({ fecha: HOY }, HOY), 'Hoy', 'y si no la hay, no se inventa');
eq(textoDeFecha({ fecha: LEJOS }, HOY), '20/9', 'lo lejano lleva su día');
eq(textoDeFecha({}, HOY), 'Sin fecha', 'y lo que no tiene fecha lo dice');
ok(ESTADOS_FECHA.every((e) => e.alarmista === false),
  '⚠️ *"sin generar una interfaz alarmista"*: ni un estado lo es, y está declarado');
ok(!/[!¡]/.test(ESTADOS_FECHA.map((e) => e.nombre).join(' ') + textoDeFecha({ fecha: HACE3 }, HOY)),
  'y ni un signo de exclamación en los textos de fecha');

console.log('\n── 6. Secciones (apartado «SECCIONES PRINCIPALES») ──────────────');
eq(SECCIONES_TAREAS.map((s) => s.id), ['vencidas', 'hoy', 'proximas', 'sin_fecha', 'completadas'],
  'las cuatro del enunciado más Vencidas, que él pide aparte');
eq(seccionDeTarea({ fecha: AYER, hecha: false }, HOY), 'vencidas', 'lo vencido, a Vencidas');
eq(seccionDeTarea({ fecha: MANANA, hecha: false }, HOY), 'proximas', 'mañana es «Próximas»');
eq(seccionDeTarea({ fecha: AYER, hecha: true }, HOY), 'completadas',
  '⚠️ y lo hecho va a Completadas aunque estuviera vencido: ya no es un pendiente');
const muchas = [
  crearTarea({ texto: 'Vencida', fecha: AYER }),
  crearTarea({ texto: 'De hoy', fecha: HOY }),
  crearTarea({ texto: 'De mañana', fecha: MANANA }),
  crearTarea({ texto: 'Suelta' }),
  { ...crearTarea({ texto: 'Hecha' }), hecha: true },
];
const sec = porSecciones(muchas, { hoy: HOY });
eq(Object.keys(sec).sort(), ['completadas', 'hoy', 'proximas', 'sin_fecha', 'vencidas'],
  'devuelve TODAS las secciones, también las vacías: quien pinta decide si las esconde');
eq([sec.vencidas.length, sec.hoy.length, sec.proximas.length, sec.sin_fecha.length, sec.completadas.length],
  [1, 1, 1, 1, 1], 'y cada tarea cae en la suya');
ok(SECCIONES_TAREAS.filter((s2) => s2.abiertaPorDefecto).length === 3,
  '⚠️ *"no mostrar todas las secciones simultáneamente"*: Sin fecha y Completadas nacen plegadas');

/* 🚨 **PERO UNA PANTALLA CON TAREAS NO PUEDE VERSE VACÍA.** Lo cazó el recorrido
   en Chromium con el caso más normal del mundo: una tarea sin fecha y ninguna
   más. La lista salía en blanco, el estado vacío no se disparaba —sí había una
   tarea— y lo único visible era un rótulo plegado. Es el hábito que desaparecía
   de la E3 F24 otra vez. */
eq(aperturaInicial(sec).sort(), ['hoy', 'proximas', 'vencidas'],
  'con tareas en las secciones de arriba, se abren las de siempre');
const soloSinFecha = porSecciones([crearTarea({ texto: 'Suelta' })], { hoy: HOY });
eq(aperturaInicial(soloSinFecha), ['sin_fecha'],
  '🚨 PERO SI TODO ESTÁ EN UNA SECCIÓN QUE NACE PLEGADA, ESA SECCIÓN SE ABRE: si no, la pantalla se ve vacía');
const soloHechas = porSecciones([{ ...crearTarea({ texto: 'Hecha' }), hecha: true }], { hoy: HOY });
eq(aperturaInicial(soloHechas), ['completadas'], 'y lo mismo con Completadas');
eq(aperturaInicial(porSecciones([], { hoy: HOY })), [], 'y sin nada, no se abre nada: para eso está el estado vacío');
ok(!aperturaInicial(sec).includes('sin_fecha'),
  '⚠️ y con algo arriba, Sin fecha sigue plegada: la preferencia del catálogo manda mientras se vea algo');

console.log('\n── 7. Ordenación (apartado «ORDENACIÓN») ────────────────────────');
eq(ORDENES_TAREA.map((o) => o.id), ['inteligente', 'fecha', 'prioridad', 'alfabetico'],
  'cuatro criterios: *"no crear un sistema excesivamente complejo"*');
eq(ORDEN_POR_DEFECTO, 'inteligente', 'y el recomendado es el de por defecto');
ok(ORDENES_TAREA.every((o) => o.explica), 'cada uno explica qué hace, con una frase');
const paraOrdenar = [
  crearTarea({ texto: 'Baja de hoy', fecha: HOY, prioridadId: 'baja' }),
  crearTarea({ texto: 'Alta de mañana', fecha: MANANA, prioridadId: 'alta' }),
  crearTarea({ texto: 'Vencida baja', fecha: AYER, prioridadId: 'baja' }),
  crearTarea({ texto: 'Alta sin fecha', prioridadId: 'alta' }),
];
eq(ordenarTareas(paraOrdenar, 'inteligente', HOY).map((t) => t.texto),
  ['Vencida baja', 'Alta de mañana', 'Alta sin fecha', 'Baja de hoy'],
  '🚨 el orden LITERAL del enunciado: vencidas, alta prioridad, y luego lo más próximo');
eq(ordenarTareas(paraOrdenar, 'fecha', HOY).map((t) => t.texto),
  ['Vencida baja', 'Baja de hoy', 'Alta de mañana', 'Alta sin fecha'],
  '⚠️ por fecha, y lo que no la tiene se va al final');
eq(ordenarTareas(paraOrdenar, 'prioridad', HOY).map((t) => t.prioridad),
  ['alta', 'alta', 'baja', 'baja'], 'por prioridad');
eq(ordenarTareas(paraOrdenar, 'alfabetico', HOY)[0].texto, 'Alta de mañana', 'y alfabético');
ok(ordenarTareas(paraOrdenar, 'inteligente', HOY) !== paraOrdenar,
  '⚠️ y ordenar NO muta la lista que le dan: `sort` en su sitio habría reordenado los datos');
eq(ordenarTareas(null, 'inteligente', HOY), [], 'sin lista, lista vacía');
const conHora = [crearTarea({ texto: 'Tarde', fecha: HOY, hora: '20:00' }), crearTarea({ texto: 'Pronto', fecha: HOY, hora: '08:00' })];
eq(ordenarTareas(conHora, 'fecha', HOY).map((t) => t.texto), ['Pronto', 'Tarde'],
  '⚠️ y a igual fecha manda la HORA: *"fecha/hora más próxima"*');

console.log('\n── 8. Filtros y búsqueda ────────────────────────────────────────');
eq(FILTROS_TAREA.map((f) => f.id), ['todas', 'hoy', 'pendientes', 'completadas', 'alta'],
  'los cinco del enunciado');
eq(filtrarTareas(muchas, { filtro: 'todas', hoy: HOY }).length, 5, 'todas');
eq(filtrarTareas(muchas, { filtro: 'hoy', hoy: HOY }).map((t) => t.texto).sort(), ['De hoy', 'Vencida'],
  '⚠️ «Hoy» incluye LO VENCIDO: si no, lo atrasado desaparecería justo del sitio donde hace falta');
eq(filtrarTareas(muchas, { filtro: 'pendientes', hoy: HOY }).length, 4, 'pendientes');
eq(filtrarTareas(muchas, { filtro: 'completadas', hoy: HOY }).length, 1, 'completadas');
eq(filtrarTareas([...muchas, crearTarea({ texto: 'Urgente', prioridadId: 'alta' })], { filtro: 'alta', hoy: HOY }).length, 1,
  'alta prioridad');
eq(filtrarTareas(muchas, { filtro: 'todas', categoria: 'estudios', hoy: HOY }).length, 0, 'y se puede filtrar por categoría');
eq(buscarTareas(muchas, 'hoy').map((t) => t.texto), ['De hoy'], 'la búsqueda encuentra por el título');
eq(buscarTareas(muchas, '').length, 5, 'y sin consulta no filtra nada');
eq(buscarTareas([crearTarea({ texto: 'T', descripcion: 'comprar leche' })], 'leche').length, 1,
  '⚠️ busca también en la descripción: media frase que está dentro y no salga sería peor que no buscar');
eq(buscarTareas([crearTarea({ texto: 'Biología' })], 'BIOLOGÍA').length, 1, 'sin distinguir mayúsculas');
eq(buscarTareas(null, 'x'), [], 'y aguanta que no le den lista');

console.log('\n── 9. Completar (apartado «COMPLETAR TAREA») ────────────────────');
const hecha = completarTarea(t1, { ahora: '2026-09-07T10:00:00.000Z' });
eq(hecha.hecha, true, 'completar marca la tarea');
eq(hecha.completadaEn, '2026-09-07T10:00:00.000Z',
  '🚨 y APUNTA CUÁNDO: sin la marca de tiempo, *"2 completadas hoy"* diría siempre cero');
eq(completarTarea(hecha).hecha, false, 'y se puede deshacer');
eq(completarTarea(hecha).completadaEn, null, 'lo que borra su fecha de completada');
eq(completarTarea(null), null, 'y aguanta que no le den tarea');
/* 🚨 Una tarea que se repite marca SU DÍA, no la serie (E3 F10, apartado 24). */
const recurrente = crearTarea({ texto: 'Repasar', fecha: HOY, recurrencia: { frecuencia: 'diaria', hechas: [] } });
const marcada = completarTarea(recurrente, { fechaISO: HOY });
eq(marcada.recurrencia.hechas, [HOY], '🚨 UNA TAREA QUE SE REPITE MARCA SU DÍA: la regla permanece');
eq(marcada.hecha, false, 'y la serie NO queda hecha: no son tres tareas, es una regla');
eq(tareaHecha(marcada, HOY), true, 'ese día está hecho');
eq(tareaHecha(marcada, MANANA), false, 'y el siguiente no');
eq(completarTarea(marcada, { fechaISO: HOY }).recurrencia.hechas, [], 'y se puede desmarcar ese día');
ok(!leer('src/lib/tareas.js').includes('function expandirRecurrentes'),
  '🚨 NI UN SEGUNDO MOTOR DE RECURRENCIA: el de `semana.js` / `expandirRecurrentes` es el único');

console.log('\n── 10. Editar y reprogramar ─────────────────────────────────────');
eq(editarTarea(t1, { texto: 'Otro título' }).texto, 'Otro título', 'se puede cambiar el título');
eq(editarTarea(t1, { prioridad: 'baja' }).prioridad, 'baja', 'la prioridad');
eq(editarTarea(t1, { categoria: 'casa' }).categoria, 'casa', 'la categoría');
eq(editarTarea(t1, { fecha: null }).fecha, null, '⚠️ y vaciar la fecha ES válido: la tarea pasa a Sin fecha');
eq(editarTarea(t1, { texto: '   ' }), null, 'pero dejarla sin título, no');
eq(editarTarea(t1, { texto: 'x' }).id, t1.id, 'editar conserva el id');
ok(editarTarea(t1, { texto: 'x' }).actualizadaEn, 'y apunta cuándo se tocó');
eq(DESTINOS_REPROGRAMAR.map((d) => d.id), ['hoy', 'manana', 'elegir'], 'los tres destinos del enunciado');
const atrasada = crearTarea({ texto: 'Atrasada', fecha: AYER });
eq(reprogramar(atrasada, 'hoy', { hoy: HOY }).fecha, HOY, 'reprogramar a hoy');
eq(reprogramar(atrasada, 'manana', { hoy: HOY }).fecha, MANANA, 'a mañana');
eq(reprogramar(atrasada, 'elegir', { hoy: HOY, fecha: LEJOS }).fecha, LEJOS, 'o a la que elija');
eq(reprogramar(atrasada, 'elegir', { hoy: HOY, fecha: '2026-13-45' }), null,
  '⚠️ y una fecha imposible no se guarda: dejaría la tarea invisible en las cuatro pantallas');
eq(reprogramar(atrasada, 'elegir', { hoy: HOY }), null, 'ni «elegir» sin elegir nada');
eq(reprogramar(null, 'hoy', { hoy: HOY }), null, 'y aguanta que no le den tarea');

console.log('\n── 11. Resumen y estadísticas ───────────────────────────────────');
const conCompletadas = [
  crearTarea({ texto: 'A', fecha: HOY }),
  crearTarea({ texto: 'B', fecha: HOY }),
  crearTarea({ texto: 'C', fecha: AYER }),
  { ...crearTarea({ texto: 'D', fecha: HOY }), hecha: true, completadaEn: `${HOY}T09:00:00.000Z` },
  { ...crearTarea({ texto: 'E' }), hecha: true, completadaEn: `${AYER}T09:00:00.000Z` },
];
const r = resumenTareas(conCompletadas, HOY);
eq([r.pendientesHoy, r.vencidas, r.completadasHoy], [2, 1, 1], '*"Hoy · 4 pendientes"* sale de contar, no de un contador');
const st = estadisticasDeTareas(conCompletadas, HOY);
eq([st.hoy.completadas, st.hoy.total], [1, 3], '*"Hoy · completadas 1 / 3"*');
eq(st.semana.completadas, 2, 'y la semana cuenta los últimos siete días');
eq(estadisticasDeTareas([crearTarea({ texto: 'x' })], HOY).hoy, null,
  '🚨 SIN NADA QUE COMPLETAR HOY NO HAY PORCENTAJE: un 0 % sería inventarse un mal día donde no tocaba nada');
ok(!leer('src/lib/tareas.js').match(/\b(guardarEstadistica|totalGuardado|contadorTareas)\b/),
  '🚨 UNA ESTADÍSTICA ES UNA VISTA, NO UN DATO: no se guarda ni una cifra (E3 F13, EH F35)');

console.log('\n── 12. Estado vacío (apartado «ESTADO VACÍO») ───────────────────');
const v0 = vacioDeTareas([], HOY);
eq([v0.id, v0.titulo], ['sin_tareas', 'Todo despejado'], '*"Todo despejado"* con la lista vacía');
ok(v0.texto.includes('Disfruta del momento'), 'y la frase literal del enunciado');
ok(v0.accion === 'nueva', 'con salida: *"+ Nueva tarea"*');
const v1 = vacioDeTareas([crearTarea({ texto: 'Futura', fecha: LEJOS })], HOY);
eq([v1.id, v1.titulo], ['nada_hoy', 'No tienes nada pendiente hoy'],
  '⚠️ y con futuras pero nada hoy, el OTRO vacío: son dos cosas distintas');
eq(v1.accion, 'proximas', 'que lleva a las próximas');
eq(vacioDeTareas([crearTarea({ texto: 'De hoy', fecha: HOY })], HOY), null,
  '🚨 NUNCA «TODO HECHO» CON PENDIENTES (E3 F14, apartado 29)');
eq(vacioDeTareas([{ ...crearTarea({ texto: 'x' }), hecha: true }], HOY).id, 'todo_hecho',
  'y con todo completado, se puede decir');
ok(vacioDeTareas([crearTarea({ texto: 'Vencida', fecha: AYER })], HOY) === null,
  '⚠️ y una vencida es un pendiente: no hay vacío que valga');

console.log('\n── 13. Lo que Hoy puede pedir (apartado «HOY») ──────────────────');
const ph = paraHoy(conCompletadas, HOY);
eq(ph.pendientes, 3, '*"Tareas · 3 pendientes"*, con lo vencido dentro');
eq(ph.linea, '3 pendientes', 'y la línea que Hoy puede pintar');
eq(paraHoy([], HOY).linea, 'Sin pendientes', 'y sin nada, se dice');
eq(paraHoy([crearTarea({ texto: 'Una', fecha: HOY })], HOY).linea, '1 pendiente', 'el singular está bien escrito');
ok(ph.prioritarias.length <= 3, '*"y las tareas prioritarias del día"*, sin llenar la pantalla');
ok(ph.prioritarias[0].texto === 'C', 'y la primera es la vencida, que es la que más urge');
ok(!leer('src/lib/tareas.js').includes('today_tasks'),
  '🚨 y Hoy no necesita una copia: lee las tareas de verdad (E3 F6, apartados 24 y 25)');

console.log('\n── 14. Pomodoro desde una tarea (integración) ───────────────────');
eq(POMODORO_DESDE_TAREA.campo, 'tareaId', 'el id de la tarea llega a Pomodoro por `tareaId`');
eq(POMODORO_DESDE_TAREA.miniApp, 'pomodoro', 'y lo que se abre es la mini-app que ya existe');
const plan = planConcentrarse(t1);
eq([plan.miniApp, plan.tareaId], ['pomodoro', t1.id], '«Concentrarme» devuelve a dónde ir y con qué id');
eq(planConcentrarse({ ...t1, hecha: true }), null,
  '⚠️ y una tarea HECHA no lo ofrece: *"una ficha solo ofrece las acciones que le sirven"* (EH F61)');
eq(planConcentrarse(null), null, 'ni una tarea que no existe');
/* 🚨 Y el id llega de verdad: se comprueba contra el motor, no contra una promesa. */
const sesion = iniciarSesion('focus', CONFIG_POMODORO_POR_DEFECTO, { tareaId: t1.id });
eq(sesion.tareaId, t1.id, '🚨 EL id LLEGA A LA SESIÓN DE VERDAD (criterio 13)');
eq(tareaDeSesion(sesion, [t1]).texto, 'Estudiar biología', 'y desde la sesión se puede decir en qué se concentra');
eq(tareaDeSesion({ tareaId: null }, [t1]), null, 'una sesión sin tarea no inventa una');
eq(tareaDeSesion(sesion, []), null, 'y si la tarea ya no está, tampoco');
const codigo = leer('src/lib/tareas.js');
const codigoLimpio = soloCodigo(codigo);
ok(!/setInterval|setTimeout|requestAnimationFrame/.test(codigoLimpio),
  '🚨 NI UN TEMPORIZADOR AQUÍ DENTRO: *"NO duplicar el temporizador dentro de Tareas"*');
ok(/setInterval/.test(soloCodigo('const x = 1; setInterval(f, 10);')),
  '🐛 y la regla PUEDE ponerse roja: caza su propio ejemplo malo (la lección de EH F42)');
ok(!/setInterval/.test(soloCodigo('// aqui no hay setInterval')) && !/setInterval/.test(soloCodigo("const t = 'setInterval';")),
  '🐛 y no salta con un comentario ni con una cadena que solo lo NOMBRA');
ok(!/duracionMs\s*[:=]/.test(codigo), 'ni una duración propia: el motor es `pomodoro.js`');

console.log('\n── 15. Metas y Objetivos: se declaran, no se fingen ─────────────');
eq(RELACIONES_FUTURAS.map((r2) => r2.campo), ['metaId', 'objetivoId'], 'los dos campos que pide el enunciado');
/* ⚠️ **Actualizado en la E3 F27**: los dos campos ya son enlazables, porque la
   PR F5 construyó Metas y Objetivos — que es exactamente lo que decía su
   `llega`. Lo que se sigue comprobando es lo de siempre: que estén DECLARADOS,
   con adónde apuntan y por qué (regla 8). */
ok(RELACIONES_FUTURAS.every((r2) => r2.campo && r2.hacia && r2.porque && r2.llega),
  '⚠️ DECLARADOS, con adónde apuntan y por qué: un campo que nadie puede rellenar es media función (regla 8)');
ok(RELACIONES_FUTURAS.every((r2) => r2.enlazable === true),
  '✅ y desde la PR F5 son enlazables de verdad: la promesa de la fase anterior se cumplió');
eq(relacionFutura('metaId').hacia, 'productividad.metas', 'y adónde apuntará');
eq(relacionFutura('inventado'), null, 'preguntar por uno que no existe devuelve null');
ok(!/crearMeta|crearObjetivo|normalizarMeta|normalizarObjetivo/.test(codigoLimpio),
  '⚠️ y esta fase NO construye Metas ni Objetivos: *"no desarrolles todavía Metas, Objetivos ni Rutinas"*');
ok(/crearMeta/.test(soloCodigo('export function crearMeta() {}')),
  '🐛 y esa regla también caza su ejemplo malo');

console.log('\n── 16. La vista y el manejador que la deja en blanco ────────────');
const vista = leer('src/views/ProductivityView.jsx');
const usados = [...vista.matchAll(/\bon[A-Z]\w*/g)].map((m) => m[0]);
ok(usados.includes('onConcentrarse'), '«Concentrarme» está cableado en la pantalla');
ok(vista.includes('onUpdateTarea'),
  '🚨 Y `onUpdateTarea` está DECLARADO: un manejador usado y no declarado deja la pantalla en blanco (E3 F17)');
ok(/onUpdateTarea,/.test(vista.slice(vista.indexOf('export default function ProductivityView'), vista.indexOf('export default function ProductivityView') + 900)),
  'y declarado en el sitio: en las props del componente');
const app = leer('src/App.jsx');
ok(/onUpdateTarea=\{updateTarea\}/.test(app),
  '🚨 Y ALGUIEN LO LLAMA: una función que nadie llama no falla nunca (E3 F1 y F5)');
ok(/const updateTarea = /.test(app), 'y existe en App.jsx, que es el dueño del almacén');
ok(app.includes('normalizarTareasDe(prod)'),
  '🚨 Y LA MIGRACIÓN SE EJECUTA AL CARGAR: si no, las tareas de Josué siguen sin salir en Hoy');
ok(/completarTarea\(x\)/.test(app),
  '🚨 y completar pasa por `completarTarea`, no por un `!x.hecha` a pelo que no apunta la fecha');
ok(!/dangerouslySetInnerHTML/.test(vista), 'y nada se pinta con HTML crudo');

console.log('\n── 17. Accesibilidad y toque ────────────────────────────────────');
const tareasVista = vista.slice(vista.indexOf('/* ---------- Tareas (E3 F26'), vista.indexOf('/* ---------- Metas a corto plazo'));
const botonesSinTexto = [...tareasVista.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*\{?\s*<(Circle|CheckCircle2|Timer|Trash2|Plus|Pencil)\b/g)];
eq(botonesSinTexto.length, 0, '🚨 ni un botón de solo icono sin `aria-label` (EH F42)');
ok(tareasVista.includes('toque-44'), 'y las zonas de toque usan la clase de 44 px, nunca un número a ojo');
ok(!/#[0-9a-fA-F]{6}/.test(tareasVista), '🚨 ni un hex suelto en la vista: los colores son de `COLORS` (regla 2)');
ok(!/style=\{\{[^}]*top:/.test(tareasVista), '⚠️ ni un `top` en un `style`, que gana a la Safe Area');
ok(tareasVista.includes('aria-pressed'), 'y el selector de prioridad dice cuál está elegida');
ok(tareasVista.includes('aria-expanded'), 'y las secciones plegables dicen si están abiertas');
ok(!/Fase \d|apartado \d|pendiente de|próximamente/i.test(
  [...tareasVista.matchAll(/>([^<>{}]{6,})</g)].map((m) => m[1]).join(' ')),
  '⚠️ regla 9: ni una nota interna de desarrollo en lo que ve Josué');

console.log('\n── 18. La papelera y el aviso honesto ───────────────────────────');
const papelera = leer('src/lib/papelera.js');
ok(papelera.includes("'productividad.tareas'"), 'las tareas están en el catálogo de la papelera');
ok(tareasVista.includes('BotonBorrarDefinitivo'),
  '⚠️ eliminar PREGUNTA, porque el enunciado lo pide expresamente');
ok(/Eliminados recientemente/.test(tareasVista) && !/no se puede deshacer/i.test(tareasVista),
  '🚨 Y EL AVISO DICE LA VERDAD: una tarea SÍ se recupera, así que no se promete lo contrario');
ok(app.includes("eliminarConPapelera('productividad', 'tareas', id)"),
  '⚠️ y borra `eliminarConPapelera`, la única puerta (ME F3)');

console.log('\n── 19. Nada de lo de antes se rompe ─────────────────────────────');
ok(!/normalizarTareasDe[\s\S]{0,200}habitos\s*:/.test(leer('src/lib/tareas.js')),
  'la migración no toca los hábitos');
const prodEntera = normalizarTareasDe({ tareas: [vieja], habitos: [{ id: 'h' }], pomodoroSesiones: [{ id: 's' }], metas: [{ id: 'm' }] });
eq([prodEntera.habitos.length, prodEntera.pomodoroSesiones.length, prodEntera.metas.length], [1, 1, 1],
  '🚨 y DEVUELVE LO DEMÁS INTACTO: `saveData` sobrescribe, así que perder una clave aquí las borraría (regla 5)');
ok(!leer('src/lib/tareas.js').includes("from './rachas"),
  '⚠️ y Tareas no toca las rachas: son de Hábitos (E3 F10, apartado 25)');
ok(!leer('src/lib/tareas.js').match(/\bXP\b|\bnivel\b|\bmoneda/i),
  '⚠️ D2-02: ni puntos, ni niveles, ni monedas');

console.log('\n── 20. Condición de finalización (calculada) ────────────────────');
const cond = condicionPR4({ tareas: [t1, vieja], hoy: HOY });
eq(cond.length, 16, 'las dieciséis casillas que se pueden comprobar en código');
const rojas = cond.filter((c) => !c.ok);
eq(rojas.map((c) => c.texto), [], '🚨 y NINGUNA está roja — y si lo estuviera, se vería: se calculan, no se ponen a mano');
ok(cond.find((c) => c.id === 16).texto.includes('Hoy'),
  'la decimosexta es la de esta fase: la tarea sale también en Hoy, la Agenda y el Calendario');
const conViejaSinMigrar = condicionPR4({ tareas: [{ id: 'z', texto: 'Vieja', fechaLimite: HOY }], hoy: HOY });
ok(conViejaSinMigrar.find((c) => c.id === 16).ok,
  'y con una tarea vieja pasa, porque `condicionPR4` normaliza antes: comprueba el resultado, no la entrada');

console.log(`\n${'═'.repeat(70)}`);
if (fallos.length) {
  console.log(`✗ ${fallos.length} FALLOS de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F26 (PR F4) · Tareas`);
