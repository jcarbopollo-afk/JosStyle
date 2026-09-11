// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 45 (ES F5) — APPS DE APRENDIZAJE INDEPENDIENTES
// ══════════════════════════════════════════════════════════════════════════
//
// Lo que más se comprueba: **que no se haya creado un segundo sistema de
// objetivos**. El apartado 8 pide que una app pueda tener objetivos y JosStyle ya
// tiene los suyos desde la Fase 9; la condición de finalización lo dice con esas
// palabras — *"no se hayan creado sistemas duplicados"*.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  esAcademica, PLANTILLAS_APP, IDS_PLANTILLA, plantillaApp, DESDE_CERO,
  ramasDePlantilla, plantillaParaTipo,
  objetivosDeApp, planObjetivoDeApp, vincularObjetivo, desvincularObjetivo,
  SIN_DATOS, progresoDeApp,
  MAX_TITULO_ACTIVIDAD, MAX_MINUTOS, normalizarActividadEstudio, crearActividadEstudio,
  actividadesDeApp, editarActividadEstudio, resumenActividades,
  NO_EN_ES5, condicionES5,
} from '../src/lib/appsAprendizaje.js';

import {
  TIPOS_ESTUDIO, IDS_TIPO, TIPO_PERSONALIZADA, SISTEMAS_DE_RAMA,
  crearApp, normalizarAppsDe, RAMAS_POR_DEFECTO,
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
const LIB = leer('src/lib/appsAprendizaje.js');
const CODIGO_LIB = soloCodigo(LIB);
const APP = leer('src/App.jsx');

const OBJETIVOS = {
  lista: [
    { id: 'o1', texto: 'Llegar a 1200 Elo', plazo: 'largo', cumplido: false },
    { id: 'o2', texto: 'Estudiar 10 aperturas', plazo: 'medio', cumplido: true },
  ],
  ultimaRevision: null,
};

const ESCENARIO = normalizarAppsDe({
  programas: [
    { id: 'bach', nombre: 'Bachillerato', tipo: 'formal' },
    { id: 'ajedrez', nombre: 'Ajedrez', tipo: 'mental', plantilla: 'ajedrez', objetivoIds: ['o1', 'o2', 'borrado'] },
  ],
  asignaturas: [], examenes: [], horas: [], temas: [], entregas: [], eventos: [],
  actividades: [
    { id: 'ac1', appId: 'ajedrez', titulo: '3 partidas', fecha: HOY, minutos: 45 },
    { id: 'ac2', appId: 'ajedrez', titulo: 'Aperturas', fecha: '2026-09-05', minutos: null, notas: 'Siciliana' },
  ],
});

console.log('\n── 1. 🚨 NI UN SEGUNDO SISTEMA DE OBJETIVOS (apartado 8 + criterio final) ──');

const ajedrez = ESCENARIO.programas.find((p) => p.id === 'ajedrez');
eq(ajedrez.objetivoIds, ['o1', 'o2', 'borrado'], 'Una app guarda SOLO ids de objetivo');
const suyos = objetivosDeApp(ajedrez, OBJETIVOS);
eq(suyos.map((o) => o.id), ['o1', 'o2'], '🚨 que se resuelven contra la lista GLOBAL de Objetivos');
ok(!suyos.some((o) => o.id === 'borrado'), '⚠️ y el que apunta a uno borrado no se cuenta: un id colgado es una mentira guardada');
eq(suyos[0].texto, 'Llegar a 1200 Elo', 'El texto vive en Objetivos, no aquí');
ok(!/texto:|plazo:|cumplido:/.test(CODIGO_LIB.split('planObjetivoDeApp')[0]), '🚨 y la librería no declara una entidad objetivo propia');
ok(!CATALOGO_PAPELERA['estudios.objetivos'], '🚨 ni hay una colección `estudios.objetivos` en la papelera');
eq(objetivosDeApp(null, OBJETIVOS), [], 'Sin app no hay objetivos');
eq(objetivosDeApp(ajedrez, null), [], 'Sin lista global tampoco');

// 🚨 Vigesimosegundo `aplicarPlan`: sin `confirmado` no escribe.
const plan = planObjetivoDeApp({ app: ajedrez, texto: 'Mejorar', plazo: 'corto' });
eq(plan.confirmado, false, '🚨 `planObjetivoDeApp` SIN confirmar devuelve un plan y no escribe');
ok(plan.objetivo.id && plan.appActualizada.objetivoIds.includes(plan.objetivo.id), 'con el objetivo que se crearía y la app con su id');
eq(planObjetivoDeApp({ app: ajedrez, texto: 'Mejorar', plazo: 'corto' }, true).confirmado, true, 'y confirmado dice que sí');
eq(planObjetivoDeApp({ app: ajedrez, texto: 'X' }).falta, 'plazo',
  '🚨 SIN PLAZO NO HAY PLAN: elegirlo por él metería su objetivo en «30 días» sin decírselo (EH F28)');
eq(planObjetivoDeApp({ app: ajedrez, texto: '  ', plazo: 'corto' }), null, 'Sin texto no hay plan');
eq(planObjetivoDeApp({ texto: 'X', plazo: 'corto' }), null, 'Y sin app tampoco');

// 🚨 Y quien escribe los dos almacenes es App.jsx, en UNA llamada (E3 F26).
ok(/crearObjetivoDeApp/.test(APP), 'App.jsx tiene la puerta que escribe los dos almacenes');
ok(/objetivos: \{ \.\.\.objetivos, lista: \[\.\.\.objetivos\.lista, objetivo\] \}[\s\S]{0,120}estudios:/.test(APP),
  '🚨 y lo hace en UNA sola llamada: dos escrituras seguidas se pisan (E3 F26)');
ok(!/saveData|localStorage|supabase/.test(CODIGO_LIB), '🚨 La librería no guarda nada por su cuenta');

eq(vincularObjetivo(ajedrez, 'o9').objetivoIds.at(-1), 'o9', 'Se puede enlazar uno que ya existe');
eq(vincularObjetivo(ajedrez, 'o1').objetivoIds.length, 3, '⚠️ y enlazar el mismo dos veces no lo duplica');
eq(desvincularObjetivo(ajedrez, 'o1').objetivoIds, ['o2', 'borrado'], 'Desvincular lo quita de la app…');
eq(OBJETIVOS.lista.length, 2, '…🚨 y NO borra el objetivo: sigue en Objetivos, donde vive');

console.log('\n── 2. El progreso, sin métricas falsas (apartado 9) ──');

const prog = progresoDeApp(ajedrez, OBJETIVOS);
eq(prog.texto, '1 / 2 objetivos', 'El progreso es «N / M objetivos»');
eq(prog.hechos, 1, 'con los cumplidos…');
eq(prog.total, 2, '…y el total, sin contar el id colgado');
eq(progresoDeApp({ objetivoIds: [] }, OBJETIVOS), null,
  '🚨 SIN OBJETIVOS NO HAY PORCENTAJE: `null`, nunca un 0 % que diría que va mal (apartado 9)');
eq(progresoDeApp(null, OBJETIVOS), null, 'Sin app tampoco');
ok(/Sin datos/i.test(SIN_DATOS), 'y la frase que se enseña es la del apartado 9');
ok(VISTA.includes('SIN_DATOS'), 'que la pantalla usa de verdad');

console.log('\n── 3. Tipos de app (apartado 2) ──');

eq(IDS_TIPO, ['formal', 'habilidad', 'deporte', 'idioma', 'mental'], 'Los cinco tipos guardados');
ok(TIPOS_ESTUDIO.every((t) => t.nombre && t.icono && t.ejemplos), 'cada uno con nombre, icono y ejemplos');
eq(TIPOS_ESTUDIO.find((t) => t.id === 'formal').nombre, 'Académica', 'El académico se llama como en el apartado 2');
eq(TIPOS_ESTUDIO.find((t) => t.id === 'mental').nombre, 'Hobby', 'y el de pasatiempos, Hobby');
eq(TIPO_PERSONALIZADA.id, null,
  '🚨 «Personalizada» NO es un valor guardado: es `null`, que es lo que ya significaba no elegir tipo');
ok(TIPO_PERSONALIZADA.nombre === 'Personalizada', 'pero tiene su rótulo para la pantalla');
// ⚠️ El id no se toca al renombrar (E3 F30).
eq(normalizarAppsDe({ programas: [{ id: 'x', nombre: 'X', tipo: 'mental' }] }).programas[0].tipo, 'mental',
  '⚠️ Renombrar un tipo NO cambia su id: lo guardado sigue valiendo');
eq(esAcademica({ tipo: 'formal' }), true, 'Un área académica se distingue por su tipo (apartado 1)');
eq(esAcademica({ tipo: 'deporte' }), false, 'y una app de aprendizaje no lo es');
eq(esAcademica(null), false, 'Sin app, no');
ok(!/esAcademica.*guardad|campo.*academica/i.test(CODIGO_LIB), '⚠️ y la distinción SE DERIVA, no se guarda en un campo nuevo');

console.log('\n── 4. Plantillas (apartados 3 y 4) ──');

ok(PLANTILLAS_APP.length >= 5, `Hay ${PLANTILLAS_APP.length} plantillas`);
ok(PLANTILLAS_APP.every((p) => p.nombre && p.icono && p.tipo && p.descripcion && p.ramas.length >= 3),
  'cada una con su nombre, icono, tipo, descripción y sus ramas');
ok(IDS_PLANTILLA.includes('futbol') && IDS_PLANTILLA.includes('ajedrez') && IDS_PLANTILLA.includes('musica') && IDS_PLANTILLA.includes('idiomas'),
  'con las cuatro del apartado 3');
const futbol = plantillaApp('futbol');
eq(futbol.ramas.map((r) => r.nombre), ['Entrenamiento', 'Partidos', 'Objetivos', 'Progreso'], 'Fútbol sugiere las suyas');
eq(plantillaApp('ajedrez').ramas.map((r) => r.nombre), ['Entrenamiento', 'Partidas', 'Aperturas', 'Progreso'], 'y Ajedrez las suyas');
eq(plantillaApp('inventada'), null, 'Una plantilla que no existe no se inventa');

const r1 = ramasDePlantilla('futbol');
const r2 = ramasDePlantilla('futbol');
eq(r1.map((r) => r.nombre), r2.map((r) => r.nombre), 'Dos apps de la misma plantilla reciben las mismas secciones…');
ok(r1[0].id !== r2[0].id, '🚨 …pero con IDS PROPIOS: compartirlos haría que quitar una en un área la quitara en la otra');
eq(ramasDePlantilla(null), [], '🚨 «Empezar desde cero» devuelve una lista vacía, que es una elección suya');
eq(DESDE_CERO.id, null, 'y su id es `null`, no un valor inventado para decir «ninguno»');
eq(plantillaParaTipo('deporte').id, 'futbol', 'Al elegir un tipo se PROPONE su plantilla…');
eq(plantillaParaTipo('inventado'), null, '…y un tipo que no existe no propone nada');
ok(ramasDePlantilla('futbol').every((r) => r.sistema === null || Object.keys(SISTEMAS_DE_RAMA).includes(r.sistema)),
  '⚠️ Y las ramas que declara un sistema usan uno que EXISTE: las demás son sitios suyos');

// Crear con plantilla, y desde cero.
const conPlantilla = crearApp({ nombre: 'Fútbol', tipo: 'deporte', plantilla: 'futbol', ramas: ramasDePlantilla('futbol') }, []);
eq(conPlantilla.plantilla, 'futbol', 'La plantilla usada se guarda (apartado 15)');
eq(conPlantilla.ramas.length, 4, 'y el área nace con sus secciones');
eq(conPlantilla.objetivoIds, [], 'sin objetivos, que son opcionales');
const desdeCero = crearApp({ nombre: 'Lo mío', ramas: [] }, []);
eq(desdeCero.ramas, [], '🚨 Desde cero nace SIN secciones: `[]` es una elección, no un hueco');
eq(desdeCero.plantilla, null, 'y sin plantilla');
eq(crearApp({ nombre: 'Normal' }, []).ramas.length, RAMAS_POR_DEFECTO.length, '⚠️ y sin decir nada, las de siempre');
// 🚨 Y una plantilla NO bloquea la personalización (apartado 5).
eq(normalizarAppsDe({ programas: [{ ...conPlantilla, ramas: [] }] }).programas[0].ramas, [],
  '🚨 Una plantilla no bloquea nada: después puede quitarlas todas (apartado 5)');

console.log('\n── 5. Actividades (apartados 10 y 11) ──');

ok(Array.isArray(DEFAULT_ESTUDIOS.actividades), 'DEFAULT_ESTUDIOS.actividades existe');
ok(CATALOGO_PAPELERA['estudios.actividades'], '🚨 y está en el catálogo de la papelera (EH F45)');
const a = crearActividadEstudio({ appId: 'ajedrez', titulo: '3 partidas', fecha: HOY, minutos: 45 });
ok(a && a.id, 'crearActividadEstudio devuelve una actividad con id');
eq(a.minutos, 45, 'con sus minutos');
eq(crearActividadEstudio({ appId: 'x', titulo: 'Y' }).minutos, null,
  '🚨 LOS MINUTOS SON OPCIONALES: `null`, nunca 0 — un cero diría que no practicó nada');
eq(crearActividadEstudio({ appId: 'x', titulo: 'Y', minutos: 0 }).minutos, null, 'y un 0 tecleado tampoco se guarda como duración');
eq(crearActividadEstudio({ appId: 'x', titulo: 'Y', minutos: 99999 }).minutos, null, 'ni una duración imposible');
eq(crearActividadEstudio({ titulo: 'Sin app' }), null, '🚨 Una actividad sin app se descarta: sería un huérfano invisible');
eq(crearActividadEstudio({ appId: 'x' }), null, 'y sin título también');
eq(crearActividadEstudio({ appId: 'x', titulo: 'Y', fecha: '2026-13-45' }).fecha.length, 10,
  '⚠️ Una fecha imposible cae a hoy: una actividad es algo que YA hiciste, así que ocurrió un día');
eq(normalizarActividadEstudio(null), null, 'Lo que no es un objeto se descarta');
ok(crearActividadEstudio({ appId: 'x', titulo: 'y'.repeat(200) }).titulo.length === MAX_TITULO_ACTIVIDAD, 'El título se acota');
ok(MAX_MINUTOS === 1440, 'El tope de minutos es un día');

eq(actividadesDeApp(ESCENARIO, 'ajedrez').map((x) => x.id), ['ac1', 'ac2'], 'Las actividades salen de la más reciente a la más vieja');
eq(actividadesDeApp(ESCENARIO, 'bach'), [], 'Un área sin actividades devuelve una lista vacía');
eq(actividadesDeApp(null, 'x'), [], 'Sin datos no revienta');
eq(editarActividadEstudio(ESCENARIO.actividades, 'ac1', { titulo: 'Otro' }).find((x) => x.id === 'ac1').titulo, 'Otro', 'Se puede editar');
eq(editarActividadEstudio(ESCENARIO.actividades, 'ac1', { appId: 'otra' }).find((x) => x.id === 'ac1').appId, 'ajedrez',
  '⚠️ pero no cambiarla de app por la puerta de atrás');

const res = resumenActividades(ESCENARIO, 'ajedrez');
eq(res.cuantas, 2, 'El resumen cuenta las actividades');
eq(res.minutos, 45, '🚨 y suma SOLO los minutos de las que los tienen: sumar las otras como ceros no cambiaría el total, pero contarlas como practicadas sí');
eq(res.sinDuracion, 1, 'diciendo cuántas no tienen duración');
eq(resumenActividades(ESCENARIO, 'bach'), null, 'Sin actividades no hay resumen: `null`, no un cero');

console.log('\n── 6. Las dos ramas nuevas y el árbol ──');

ok(SISTEMAS_DE_RAMA.objetivos && SISTEMAS_DE_RAMA.progreso, 'Existen las ramas de objetivos y progreso');
eq(SISTEMAS_DE_RAMA.objetivos.cuenta(), null,
  '⚠️ La de objetivos NO cuenta aquí: sus datos son los globales, y este módulo no los recibe');
eq(SISTEMAS_DE_RAMA.progreso.cuenta(ESCENARIO, 'ajedrez'), 2, 'y la de progreso cuenta las actividades');
ok(PLANTILLAS_APP.some((p) => p.ramas.some((r) => r.sistema === 'objetivos')), 'Alguna plantilla trae la de objetivos');
ok(PLANTILLAS_APP.some((p) => p.ramas.some((r) => r.sistema === 'progreso')), 'y la de progreso');

console.log('\n── 7. La cascada y la persistencia (apartado 15) ──');

// 🚨 Un fallo real que encontró esta fase: al borrar un ÁREA se sacaban del módulo los temas, las
// entregas y los eventos y NO se metían en la entrada de papelera — restaurarla la habría devuelto
// sin ellos.
ok(/coleccion: 'temas', elementos: temasDelArea/.test(APP), '🚨 Borrar un área se lleva sus temas a la papelera');
ok(/coleccion: 'entregas', elementos: entregasDelArea/.test(APP), 'sus entregas');
ok(/coleccion: 'eventos', elementos: eventosDelArea/.test(APP), 'sus eventos');
ok(/coleccion: 'actividades', elementos: actividadesDelArea/.test(APP), 'y sus actividades');
ok(/actividades: \(estudios\.actividades \|\| \[\]\)\.filter\(\(a\) => a\.appId !== id\)/.test(APP),
  '⚠️ y las saca del módulo, que es lo que hace falta para que no queden huérfanas');

const rehecho = normalizarAppsDe(ESCENARIO);
eq(rehecho.programas.find((p) => p.id === 'ajedrez').plantilla, 'ajedrez', 'La plantilla persiste');
eq(rehecho.programas.find((p) => p.id === 'ajedrez').objetivoIds.length, 3, 'y los ids de objetivo también');
eq(rehecho.actividades ?? null, ESCENARIO.actividades, '⚠️ y las actividades no las toca este normalizador');

console.log('\n── 8. La pantalla ──');

ok(/PLANTILLAS_APP/.test(CODIGO_VISTA), 'El formulario ofrece las plantillas (apartado 4)');
ok(/DESDE_CERO/.test(CODIGO_VISTA), 'y la salida de empezar desde cero');
ok(/planObjetivoDeApp/.test(CODIGO_VISTA), 'Los objetivos se crean por el plan, no a pelo');
ok(/PLAZOS_OBJETIVO/.test(CODIGO_VISTA), 'con su plazo, que hay que elegir');
ok(/desvincularObjetivo/.test(CODIGO_VISTA), 'y se pueden quitar del área sin borrarlos');
ok(/crearActividadEstudio/.test(CODIGO_VISTA), 'Las actividades se registran');
ok(/progresoDeApp/.test(CODIGO_VISTA), 'y el progreso se lee');
ok(/Se gestiona en Objetivos|tus Objetivos de siempre/.test(VISTA),
  '⚠️ y la pantalla DICE dónde viven de verdad los objetivos: no finge que son suyos');
ok(/aria-label/.test(VISTA), 'con nombres accesibles');

console.log('\n── 9. La condición de finalización (apartado 18) ──');

const cond = condicionES5(ESCENARIO, OBJETIVOS);
ok(cond.length >= 11, `La condición tiene ${cond.length} casillas`);
ok(cond.every((c) => c.id && c.texto && typeof c.ok === 'boolean'), 'Cada casilla dice qué comprueba');
ok(cond.every((c) => c.ok), `Todas en verde: ${cond.filter((c) => !c.ok).map((c) => c.texto).join(', ') || 'ninguna roja'}`);
// 🚨 Y puede ponerse roja.
const rota = condicionES5({ programas: [], actividades: 'esto no es una lista' }, OBJETIVOS);
eq(rota.find((c) => c.id === 'persisten').ok, false, '🚨 con las actividades rotas, su casilla SE PONE ROJA');
eq(condicionES5(ESCENARIO, OBJETIVOS).find((c) => c.id === 'persisten').ok, true, '…y con el escenario bueno, verde');
ok(NO_EN_ES5.length >= 7 && NO_EN_ES5.every((x) => x.que && x.porque), 'Lo que no se implementa está declarado con su motivo');
ok(NO_EN_ES5.some((x) => /gamificaci/i.test(x.que)), 'La gamificación avanzada está entre lo que no se hace (D2-02)');

console.log(`\n  ${fallos.length ? '✗' : '✓'} ES F5 — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
