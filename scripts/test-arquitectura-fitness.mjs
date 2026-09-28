/* Entrega 4 · FIT F44/45 — Limpieza arquitectónica y deuda técnica de Fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"Primero INSPECCIONAR."* Lo que se comprueba aquí es que lo limpiado siga
   limpio: el mapa de capas cubre todo lo que la aplicación importa de Fitness;
   ninguna capa de abajo importa una de arriba; las auditorías de la fase dan
   cero sobre el código de verdad —ciclos, almacenamiento en pantallas, errores
   tragados, logs, claves por posición, dependencias, nombres repetidos, comas
   escritas a mano y exportaciones que no usa nadie—, y cada una se pone roja
   con su ejemplo malo (EH F42). Y lo retirado, retirado: si vuelve un segundo
   motor de sustitución o una séptima copia de un formato, la suite lo dice. */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CAPAS_FITNESS, capaDe, ARCHIVOS_DEL_MAPA, MOTORES_FITNESS, FLUJO_DE_DATOS, INVALIDACION,
  ciclosDeImports, almacenamientoDirecto, catchSinExplicar, logsSueltos, CLAVES_POR_POSICION, clavesPorPosicion,
  DEPENDENCIAS_PERMITIDAS, dependenciasNoDeclaradas, COMAS_PERMITIDAS, comasADesmano,
  NOMBRES_DE_DECLARACION, nombresRepetidos, exportacionesSinUso,
  PRUEBAS_CRITICAS, CATALOGO_HOOKS, COMPONENTES_SIN_PANTALLA, componentesSinPantalla, importsSinUso, CICLO_DE_SESION, ELIMINADO_F44, RENOMBRADO_F44, CENTRALIZADO_F44, REVISADO_Y_BIEN_F44, PENDIENTES_F44, NO_EN_FIT44, DECISIONES_FIT44,
  auditarArquitectura,
} from '../src/lib/arquitecturaFitness.js';
import { decimal, DECIMALES_FITNESS } from '../src/lib/numerosFitness.js';
import { ARCHIVOS_FITNESS } from '../src/lib/feedbackFitness.js';
import * as fitness from '../src/lib/fitness.js';
import * as detalleMuscular from '../src/lib/detalleMuscular.js';
import * as planes from '../src/lib/planes.js';
import * as plantillas from '../src/lib/plantillas.js';
import * as entrenamiento from '../src/lib/entrenamiento.js';
import * as sustitucion from '../src/lib/sustitucion.js';
import * as finalizacion from '../src/lib/finalizacion.js';
import * as siguienteRango from '../src/lib/siguienteRango.js';
import * as resumenRangos from '../src/lib/resumenRangos.js';
import * as resumenProgreso from '../src/lib/resumenProgreso.js';
import * as comparadorFotos from '../src/lib/comparadorFotos.js';
import * as colaClasificacion from '../src/lib/colaClasificacion.js';
import * as acabadoFitness from '../src/lib/acabadoFitness.js';
import * as contribucionMuscular from '../src/lib/contribucionMuscular.js';
import * as fotosProgreso from '../src/lib/fotosProgreso.js';
import * as historialRangos from '../src/lib/historialRangos.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const lista = (xs) => (xs.length ? ` — ${xs.slice(0, 4).map((x) => JSON.stringify(x)).join(' · ')}` : '');

/* El código de verdad, de disco. */
const todosSrc = {};
const recorrer = (d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?|mjs)$/.test(f)) todosSrc[p] = leer(p);
});
recorrer('src');
const todos = { ...todosSrc };
readdirSync(join(RAIZ, 'scripts')).filter((f) => /\.(mjs|jsx?)$/.test(f)).forEach((f) => { todos[`scripts/${f}`] = leer(`scripts/${f}`); });
const deFitness = Object.fromEntries(ARCHIVOS_DEL_MAPA.map((r) => [r, leer(r)]));
const pantallas = Object.fromEntries(ARCHIVOS_DEL_MAPA.filter((r) => /src\/(views|components)\//.test(r)).map((r) => [r, deFitness[r]]));
const librerias = Object.fromEntries(ARCHIVOS_DEL_MAPA.filter((r) => /src\/lib\//.test(r)).map((r) => [r, deFitness[r]]));
const baseDe = (spec) => spec.split('/').pop().replace(/\.(jsx?|mjs)$/, '');
const importsDe = (ruta) => [...String(todos[ruta] || '').matchAll(/from\s+'(\.\.?\/[^']+)'/g)].map((m) => m[1]);
const resolver = (desde, spec) => {
  const base = desde.split('/').slice(0, -1);
  spec.split('/').forEach((t) => { if (t === '..') base.pop(); else if (t !== '.') base.push(t); });
  const r = base.join('/');
  return [r, `${r}.js`, `${r}.jsx`].find((x) => todos[x] !== undefined) || null;
};

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. El mapa: cada archivo de Fitness, en su capa (apartados 2, 33, 34 y 49) ──');
ok(ARCHIVOS_DEL_MAPA.every((r) => existsSync(join(RAIZ, r))), 'Cada archivo del mapa existe');
ok(new Set(ARCHIVOS_DEL_MAPA).size === ARCHIVOS_DEL_MAPA.length, 'Ninguno está en dos capas');
ok(CAPAS_FITNESS.every((c) => c.id && c.nombre && c.que && c.archivos.length > 0), 'Cada capa dice qué es y qué contiene');
ok(capaDe('src/lib/motorRangos.js')?.id === 'motores' && capaDe('src/views/FitnessView.jsx')?.id === 'pantallas' && capaDe('src/lib/nada.js') === null,
  '`capaDe` dice la capa de un archivo, y `null` si no es de Fitness');
/* 🚨 Lo que de verdad importa la aplicación desde Fitness: el cierre de imports
   desde sus dos puertas, parando en las dependencias declaradas. Un archivo
   nuevo que la aplicación use y no esté en el mapa lo pone rojo — la lección
   de `ARCHIVOS_FITNESS` (F39), que se quedó corta sin que nadie lo notara. */
const alcanzados = new Set();
const pendientes = ['src/views/TrainingView.jsx', 'src/views/FitnessView.jsx'];
const externas = new Set(DEPENDENCIAS_PERMITIDAS.map((d) => d.modulo));
while (pendientes.length) {
  const f = pendientes.pop();
  if (alcanzados.has(f)) continue;
  alcanzados.add(f);
  importsDe(f).forEach((spec) => { if (!externas.has(baseDe(spec))) { const r = resolver(f, spec); if (r) pendientes.push(r); } });
}
const fuera = [...alcanzados].filter((r) => !ARCHIVOS_DEL_MAPA.includes(r));
ok(fuera.length === 0, `🚨 Todo lo que la aplicación importa de Fitness está en el mapa${lista(fuera)}`);
const sinAlcanzar = ARCHIVOS_DEL_MAPA.filter((r) => !alcanzados.has(r));
ok(sinAlcanzar.every((r) => capaDe(r).id === 'auditorias'),
  `…y lo que está en el mapa sin que la aplicación lo importe son solo auditorías${lista(sinAlcanzar.filter((r) => capaDe(r).id !== 'auditorias'))}`);
ok(ARCHIVOS_FITNESS.every((r) => ARCHIVOS_DEL_MAPA.includes(r)), 'Los archivos que recorren las auditorías de la F37 a la F43 están en el mapa');

console.log('\n── 2. Las capas no se saltan (apartados 3, 4, 21 y 46) ──');
const capaDeImport = (desde, spec) => { const r = resolver(desde, spec); return r ? capaDe(r) : null; };
const saltos = (capas, prohibidas) => ARCHIVOS_DEL_MAPA.filter((r) => capas.includes(capaDe(r).id))
  .flatMap((r) => importsDe(r).map((s) => ({ r, s, c: capaDeImport(r, s) })).filter((x) => x.c && prohibidas.includes(x.c.id)))
  .map((x) => `${x.r} → ${x.s}`);
const motoresAPantalla = saltos(['datos', 'modelo', 'motores', 'lecturas', 'utilidades'], ['pantallas', 'componentes']);
ok(motoresAPantalla.length === 0, `🚨 Ni un motor, un modelo ni una lectura importa una pantalla o un componente${lista(motoresAPantalla)}`);
const aAuditoria = saltos(['datos', 'modelo', 'motores', 'lecturas', 'utilidades', 'pantallas', 'componentes'], ['auditorias']);
const aAuditoriaReal = aAuditoria.filter((x) => !/acabadoFitness|feedbackFitness|movilFitness|rendimientoFitness|validacionCatalogo/.test(x));
ok(aAuditoriaReal.length === 0,
  `Ninguna capa importa las auditorías de la F43 y la F44 ni la integración o la robustez${lista(aAuditoriaReal)}`);
/* ⚠️ Cinco «auditorías» también dan una pieza a las pantallas —`acentoLegible`
   (F42), `ARCHIVOS_FITNESS` y los avisos (F37), las props de campo (F38), la
   validación del catálogo al arrancar (F35)—; lo que no puede pasar es que un
   MOTOR las importe: la capa visual no toca un número (F42). */
const motorAVisual = saltos(['datos', 'modelo', 'motores', 'lecturas', 'utilidades'], ['auditorias'])
  .filter((x) => !/validacionCatalogo|fechasFitness/.test(x));
ok(motorAVisual.length === 0, `🚨 …y ningún motor ni lectura importa la capa visual ni las auditorías${lista(motorAVisual)}`);
const hojas = ['src/lib/fechasFitness.js', 'src/lib/numerosFitness.js']
  .filter((r) => importsDe(r).some((spec) => { const d = resolver(r, spec); return d && capaDe(d); }));
ok(hojas.length === 0, 'Las utilidades de fechas y números no importan nada de Fitness: se pueden usar desde cualquier sitio sin ciclo (apartado 38)');
ok(Object.entries(todosSrc).every(([r, s]) => r === 'src/lib/arquitecturaFitness.js' || !/from\s+'[^']*arquitecturaFitness'/.test(s)),
  'Nadie en `src/` importa esta auditoría');

console.log('\n── 3. Los motores: una fuente por pregunta (apartados 8-13) ──');
ok(MOTORES_FITNESS.every((m) => m.funciones.length > 0 && m.funciones.every((f) => typeof f === 'function' && f.name)),
  'Cada motor guarda sus funciones de verdad, importadas (renombrar una rompe la compilación)');
ok(MOTORES_FITNESS.every((m) => existsSync(join(RAIZ, m.archivo)) && capaDe(m.archivo)),
  'Cada motor dice su archivo, y está en el mapa');
ok(['rangos', 'progreso', 'objetivos', 'planificacion', 'sustitucion', 'clasificacion'].every((id) => MOTORES_FITNESS.some((m) => m.id === id)),
  'Los seis motores del enunciado: rangos, progreso, objetivos, planificación, sustitución y clasificación');
ok(FLUJO_DE_DATOS.length >= 5 && FLUJO_DE_DATOS.every((p) => p.paso && p.archivos && p.guarda), 'El flujo principal, paso a paso, con lo que guarda cada uno (apartado 49)');
ok(/Nada derivado se guarda/.test(INVALIDACION.estrategia) && /WeakMap/.test(INVALIDACION.cachés) && /bus de eventos/.test(INVALIDACION.sinEventos),
  'La invalidación dicha: nada derivado se guarda, las cachés cuelgan de un WeakMap y no hay bus de eventos (apartados 50 y 51)');
/* Un segundo buscador de sustitutos es lo que se retiró: que no vuelva. */
/* ⚠️ Solo motores y lecturas: `sustitutosDe` (ejercicios.js, F2) es el lector
   del dato del catálogo —la lista `sustitutos`—, que es justo lo que lee el
   motor; no decide nada (está en `REVISADO_Y_BIEN_F44`). */
const buscadores = Object.entries(librerias).filter(([r, s]) => r !== 'src/lib/sustitucion.js'
  && ['motores', 'lecturas'].includes(capaDe(r).id) && /export function \w*[Ss]ustitut\w*\s*\(/.test(s)
  && !/getExerciseReplacements/.test(s)).map(([r]) => r);
ok(buscadores.length === 0, `🚨 Sustituir es UN motor: ninguna otra librería exporta un buscador de sustitutos que no le pregunte a él (apartado 12)${lista(buscadores)}`);

ok(CICLO_DE_SESION.map((c) => c.estado).join() === fitness.ESTADOS_SESION.join(),
  'El ciclo de vida de una sesión recorre los seis estados del modelo, en su orden (apartado 61)');
ok(CICLO_DE_SESION.every((c) => (c.entra === null || typeof c.entra === 'function') && c.que && c.fase)
  && typeof entrenamiento.guardarSesion === 'function', '…cada paso con LA función que lo hace, importada');
ok(!/pausarSesion\(/.test(leer('src/views/EntrenamientoVivoView.jsx')) && /pausarDescansoSesion\(/.test(leer('src/views/EntrenamientoVivoView.jsx')),
  '…y lo que dice de la pausa es verdad: la pantalla pausa el descanso, no la sesión');

console.log('\n── 4. Las auditorías, sobre el código de verdad ──');
const auditoria = auditarArquitectura({ todos, fitness: deFitness, pantallas, librerias, produccion: todosSrc });
auditoria.casillas.forEach((c) => ok(c.hallado.length === 0, `${c.que}${lista(c.hallado)}`));
ok(auditoria.ok && auditoria.casillas.length === 11, 'La auditoría de la fase entera, en verde (once casillas)');

console.log('\n── 5. Y cada una se pone roja con su ejemplo malo (EH F42) ──');
ok(ciclosDeImports({ 'src/a.js': "import { b } from './b';", 'src/b.js': "import { a } from './a';", 'src/c.js': "import { a } from './a';" }).length === 1,
  'Un ciclo a → b → a se caza, y c, que solo importa, no está en él');
ok(ciclosDeImports({ 'src/a.js': "/* import { b } from './b'; */", 'src/b.js': "import { a } from './a';" }).length === 0,
  '…y un import dentro de un comentario no es un ciclo');
ok(almacenamientoDirecto({ 'src/views/X.jsx': "localStorage.setItem('a', 'b');" }).length === 1, '`localStorage` en una pantalla, cazado');
ok(almacenamientoDirecto({ 'src/views/X.jsx': '/* nunca localStorage aquí */' }).length === 0, '…y no si solo lo nombra un comentario');
ok(catchSinExplicar({ 'src/lib/x.js': 'try { f(); } catch (e) {}' }).length === 1, 'Un `catch (e) {}` vacío, cazado');
ok(catchSinExplicar({ 'src/lib/x.js': 'try { f(); } catch {\n}' }).length === 1, '…también sin variable y con un salto de línea');
ok(catchSinExplicar({ 'src/lib/x.js': 'p.then(g).catch(() => {});' }).length === 1, '…y un `.catch(() => {})`');
ok(catchSinExplicar({ 'src/lib/x.js': 'try { f(); } catch { /* Safari privado: seguir sin guardar */ }' }).length === 0,
  '…pero con su motivo dentro, no');
ok(catchSinExplicar({ 'src/lib/x.js': '/** Nunca un `.catch(() => {})`. */\nconst a = 1;' }).length === 0,
  '…ni cuando solo lo nombra un comentario (el fallo de esta misma auditoría al estrenarse)');
ok(logsSueltos({ 'src/lib/x.js': 'console.log("hola");' }).length === 1 && logsSueltos({ 'src/lib/x.js': 'console.error("fallo");' }).length === 0,
  '`console.log` cazado; `console.error` no (es el que cuenta el recorrido)');
ok(clavesPorPosicion({ 'src/views/X.jsx': 'lista.map((x, i) => <li key={i} />)' }).length === 1, '`key={i}` en una lista cazado');
ok(clavesPorPosicion({ [CLAVES_POR_POSICION[0].ruta]: 'puntos.map((x, i) => <span key={i} />)' }).length === 0,
  '…salvo en las listas decorativas declaradas, con su motivo');
ok(dependenciasNoDeclaradas({ 'src/lib/progresion.js': "import { saldo } from './economia';" }).length === 1,
  '🚨 Importar Economía desde Fitness, cazado (apartado 60)');
ok(dependenciasNoDeclaradas({ 'src/lib/progresion.js': "import { todayISO } from './helpers';\nimport { x } from './fitness';" }).length === 0,
  '…y lo declarado y lo de Fitness, no');
ok(dependenciasNoDeclaradas({ 'src/lib/tuPlan.js': "import { DIAS_SEMANA, resolverDia } from './horario';" }).map((h) => h.que).join().includes('resolverDia'),
  '🚨 …y del horario, solo la semana: traerse sus clases (`resolverDia`) es depender del Horario (apartado 60)');
ok(dependenciasNoDeclaradas({ 'src/lib/x.js': "import { celdasMes } from './calendario';\nimport { diasEntre as d } from './hoy';" }).length === 0,
  '…mientras que la cuadrícula del mes y la cuenta de días, sí (y un `as` no lo confunde)');
ok(['economia', 'estudios', 'armario', 'habitos'].every((m) => !DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === m))
  && ['calendario', 'horario', 'rachas'].every((m) => DEPENDENCIAS_PERMITIDAS.find((d) => d.modulo === m)?.solo?.length > 0),
  'Ni Economía, ni Estudios, ni Armario, ni Hábitos; y del Calendario, el Horario y las Rachas, una interfaz con nombre (apartado 60)');
ok(nombresRepetidos({ 'src/lib/a.js': 'export const BLOQUES = [];', 'src/lib/b.js': 'export const BLOQUES = {};' }).length === 1,
  'Dos librerías con el mismo nombre exportado, cazado');
ok(nombresRepetidos({ 'src/lib/a.js': 'export const X = 1;', 'src/lib/b.js': "import { X } from './a';\nexport { X };" }).length === 0,
  '…pero reexportar el MISMO con `export { }` no es repetirlo');
ok(nombresRepetidos({ 'src/lib/a.js': 'export const YA_LO_RESUELVE = [];', 'src/lib/b.js': 'export const YA_LO_RESUELVE = [];' }).length === 0
  && NOMBRES_DE_DECLARACION.test('NO_EN_FIT44') && !NOMBRES_DE_DECLARACION.test('BLOQUES'),
  '…ni las tablas de declaración, que se llaman igual en cada fase a propósito');
ok(comasADesmano({ 'src/lib/x.js': "String(n).replace('.', ',')" }).length === 1, 'Una coma decimal escrita a mano, cazada (apartado 39)');
ok(comasADesmano({ [COMAS_PERMITIDAS[1].ruta]: "e.toFixed(1).replace('.', ',')" }).length === 0, '…salvo las declaradas, con su motivo');
ok(exportacionesSinUso({ 'src/lib/a.js': 'export const NADIE = 1;\nexport const ALGUIEN = 2;' }, { 'src/lib/b.js': "import { ALGUIEN } from './a';" })
  .map((x) => x.nombre).join() === 'NADIE', 'Una exportación que no usa nadie, cazada; la que sí se usa, no');

console.log('\n── 6. Lo retirado, retirado (apartados 12, 45 y 57) ──');
const exportaciones = (mod) => new Set(Object.keys(mod));
ok(!exportaciones(entrenamiento).has('sustitutosSugeridos'), '🚨 El segundo buscador de sustitutos de la F7 ya no existe: lo decide `getExerciseReplacements`');
ok(!exportaciones(entrenamiento).has('reiniciarDescanso') && !exportaciones(entrenamiento).has('descansoTerminado'),
  'Los descansos de la F7 superados por la F9, retirados');
ok(typeof entrenamiento.finDelDescanso === 'function' && !/\.desde\s*\+/.test(leer('src/views/EntrenamientoVivoView.jsx')),
  '…y el fin del descanso lo calcula la librería (`finDelDescanso`), no la pantalla');
ok(!exportaciones(sustitucion).has('sustitucionesDe'), 'El alias `sustitucionesDe`, retirado: un nombre por función');
ok(!exportaciones(finalizacion).has('aplicarGuardado'), '`aplicarGuardado`, que decía ser lo que llamaba la pantalla y no lo llamaba nadie, retirado');
ok(!exportaciones(plantillas).has('planEliminarPlantilla'), 'La segunda definición de «borrar una plantilla», retirada');
ok(!['TOPE_ESCALA', 'GRUPOS_TOTALES'].some((n) => exportaciones(siguienteRango).has(n)) && !exportaciones(resumenRangos).has('DESTACADOS_MIN')
  && !exportaciones(comparadorFotos).has('NO_HAY_EDICION') && !['familiaDePatronDe', 'nombreDePatron', 'nombreDeSubgrupo'].some((n) => exportaciones(sustitucion).has(n)),
  'Las siete exportaciones que no usaba nadie, retiradas');
ok(detalleMuscular.grupoMuscular === fitness.grupoMuscular, '`grupoMuscular` es UNA función: detalleMuscular.js reexporta la de fitness.js');
ok(planes.FILTRO_TODOS === plantillas.FILTRO_TODOS && !/export const FILTRO_TODOS/.test(librerias['src/lib/planes.js']),
  'La pastilla «Todos» de los planes es la de las plantillas, escrita una vez');
ok(ELIMINADO_F44.every((e) => e.que && e.porque) && ELIMINADO_F44.length >= 9, 'Cada cosa retirada, con su motivo');

ok(!/export function VacioFitness/.test(leer('src/views/FitnessView.jsx')), '`VacioFitness`, el vacío de las áreas de la F1 que ya no pintaba nadie, retirado');
const componentes = Object.fromEntries(ARCHIVOS_DEL_MAPA.filter((r) => /src\/(views|components)\//.test(r)).map((r) => [r, deFitness[r]]));
const sinPantalla = componentesSinPantalla(componentes, todosSrc);
const declarados = new Set(COMPONENTES_SIN_PANTALLA.map((c) => `${c.archivo}#${c.componente}`));
const nuevos = sinPantalla.filter((c) => !declarados.has(`${c.ruta}#${c.componente}`));
ok(nuevos.length === 0, `🚨 Ni un componente de Fitness que solo pinte el banco de renderizado sin estar declarado (apartado 57)${lista(nuevos)}`);
const yaPintados = COMPONENTES_SIN_PANTALLA.filter((c) => !sinPantalla.some((x) => x.ruta === c.archivo && x.componente === c.componente));
ok(yaPintados.length === 0, `…y ninguno de los declarados se pinta ya: si una pantalla lo usa, se quita de la lista${lista(yaPintados.map((c) => c.componente))}`);
ok(COMPONENTES_SIN_PANTALLA.every((c) => c.fase && c.enSuLugar && c.enSuLugar.length > 20), '…cada uno con lo que pinta la pantalla en su lugar');
ok(componentesSinPantalla({ 'src/components/x.jsx': 'export function Nadie() { return null; }\nexport function Alguien() { return null; }' },
  { 'src/views/y.jsx': "import { Alguien } from '../components/x';\nconst a = <Alguien />;\nconst t = 'Nadie';" }).map((c) => c.componente).join() === 'Nadie',
  '…y la auditoría caza uno que solo se nombra en un texto');
ok(importsSinUso({ 'src/lib/x.js': "import { a, b as c } from './y';\nimport D from './d';\nexport const z = a + D;" }).map((h) => h.que).join() === 'importa c y no lo usa',
  'Un import sin usar, cazado (y un `as` se mira por su nombre nuevo)');
ok(importsSinUso({ 'src/lib/x.js': "import { a, b } from './y';\nconst z = [...a];\nconst w = { ...b };" }).length === 0
  && importsSinUso({ 'src/lib/x.js': "import { a } from './y';\nconst z = obj.a;" }).length === 1,
  '…una expansión sí es un uso; una propiedad que se llama igual, no');

console.log('\n── 7. Un nombre, un significado (apartado 45) ──');
ok(RENOMBRADO_F44.every((r) => r.antes && r.despues && r.porque), 'Cada renombrado dice el antes, el después y por qué');
ok(resumenRangos.ESTADOS_PANTALLA_RANGOS && !('ESTADOS_PANTALLA' in resumenRangos), '`ESTADOS_PANTALLA_RANGOS`');
ok(resumenRangos.BLOQUES_RANGOS && resumenProgreso.BLOQUES_PROGRESO && !('BLOQUES' in resumenRangos) && !('BLOQUES' in resumenProgreso),
  '`BLOQUES_RANGOS` y `BLOQUES_PROGRESO`');
ok(colaClasificacion.PESOS_PRIORIDAD && acabadoFitness.PESOS_LETRA && !('PESOS' in colaClasificacion) && !('PESOS' in acabadoFitness),
  '`PESOS_PRIORIDAD` y `PESOS_LETRA`');
ok(contribucionMuscular.NOMBRE_DE_PAPEL && !('PAPELES' in contribucionMuscular), '`NOMBRE_DE_PAPEL` (la lista `PAPELES` sigue siendo la de la F2)');
ok(fotosProgreso.VISIBILIDADES_FOTO && !('VISIBILIDADES' in fotosProgreso), '`VISIBILIDADES_FOTO`');
ok(historialRangos.PUNTOS_PARA_GRAFICA_RANGO === 4 && !('PUNTOS_MINIMOS_GRAFICA' in historialRangos), '`PUNTOS_PARA_GRAFICA_RANGO`, que vale 4 (el de la F12 vale 3)');
ok(resumenProgreso.PERIODO_RESUMEN_POR_DEFECTO === 'todo' && !('PERIODO_POR_DEFECTO' in resumenProgreso) && historialRangos.PERIODO_POR_DEFECTO === 'todo',
  '`PERIODO_RESUMEN_POR_DEFECTO`: dos pantallas, dos valores por defecto que hoy coinciden y pueden no hacerlo');
ok(CENTRALIZADO_F44.every((c) => c.que && c.porque), 'Lo centralizado, con su motivo');
const puerta = ['src/views/RangosView.jsx', 'src/views/DetalleMuscularView.jsx'].filter((r) => !/explicacionDeRango\(/.test(deFitness[r]));
ok(puerta.length === 0, `La explicación de un rango se pide por \`explicacionDeRango\`, la puerta de la F20${lista(puerta)}`);

console.log('\n── 8. Los números, de una manera (apartado 39) ──');
ok(decimal(62.5) === '62,5' && decimal(60) === '60' && decimal(1.25) === '1,25', '«62,5», «60» y «1,25»: sin ceros de relleno y con la coma del español');
ok(decimal(100 / 3) === '33,33', '🐛 «33,33», nunca «33,333333333333336» (tres de las siete copias no redondeaban)');
ok(decimal(-2.5) === '-2,5' && decimal('20.5') === '20,5', 'Un negativo y una cadena numérica');
ok([null, undefined, '', NaN, Infinity, 'abc', {}].every((x) => decimal(x) === ''), '🚨 Lo que no es un número no se escribe: ni «NaN» ni «null» (F39)');
ok(decimal(1234.5) === '1234,5', '…y sin separador de miles: el volumen lleva el suyo (`toLocaleString`, F8), que es otro papel');
ok(decimal(2.25, { max: 1 }) === '2,3' && DECIMALES_FITNESS === 2, 'El máximo de decimales se puede pedir; por defecto, dos');
ok(COMAS_PERMITIDAS.every((c) => c.porque && existsSync(join(RAIZ, c.ruta))), 'Las comas que se quedan dicen por qué');

console.log('\n── 9. Las pruebas críticas (apartados 43 y 44) ──');
const VERIFICAR = leer('scripts/verificar.sh');
PRUEBAS_CRITICAS.forEach((p) => ok(existsSync(join(RAIZ, p.suite)) && VERIFICAR.includes(p.suite.replace('scripts/', '')),
  `${p.que}: ${p.suite.replace('scripts/', '')}, y \`verificar.sh\` la ejecuta`));
ok(/cinco veces/.test(leer('scripts/test-finalizacion.mjs')), '…el guardado duplicado se prueba pulsando cinco veces (F8, apartado 17)');

console.log('\n── 10. Hooks y flags (apartados 5 y 58) ──');
const conCodigo = (r) => leer(r).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
CATALOGO_HOOKS.forEach((h) => ok(new RegExp(`function ${h.hook}\\s*\\(`).test(leer(h.archivo)), `\`${h.hook}\` vive en ${h.archivo.split('/').pop()}: ${h.hace}`));
const hooksQueGuardan = [...new Set(CATALOGO_HOOKS.map((h) => h.archivo))].filter((r) => /\b(saveData|loadData|guardarFitness|localStorage)\b/.test(conCodigo(r)));
ok(hooksQueGuardan.length === 0, `🚨 Ninguno toca lo guardado: ni \`saveData\` ni \`localStorage\` en sus archivos${lista(hooksQueGuardan)}`);
const hooksNuevos = ARCHIVOS_DEL_MAPA.flatMap((r) => [...conCodigo(r).matchAll(/function (use[A-Z]\w*)\s*\(/g)].map((m) => m[1]))
  .filter((n) => !CATALOGO_HOOKS.some((h) => h.hook === n));
ok(hooksNuevos.length === 0, `Un hook nuevo de Fitness entra en \`CATALOGO_HOOKS\` con lo que hace${lista(hooksNuevos)}`);
const flags = ARCHIVOS_DEL_MAPA.filter((r) => /import\.meta\.env/.test(conCodigo(r)));
ok(flags.join() === 'src/components/diagnosticoCatalogo.jsx', `Un solo flag, el de desarrollo del diagnóstico del catálogo (F35)${lista(flags)}`);

console.log('\n── 11. Lo que se miró, lo que queda y lo que no se hace ──');
ok(REVISADO_Y_BIEN_F44.every((r) => r.que && r.porque), 'Lo que se inspeccionó y ya estaba bien, dicho (sin esto, la siguiente sesión lo vuelve a barrer)');
ok(PENDIENTES_F44.every((p) => p.que && p.porque) && PENDIENTES_F44.some((p) => /navegación/.test(p.que)), 'Lo que queda, con su motivo (la pila de navegación de la F43, entre ello)');
ok(NO_EN_FIT44.every((n) => n.que && n.porque) && DECISIONES_FIT44.every((d) => d.que && d.porque), 'Lo que no se hace y las decisiones, con su porqué');
ok(DEPENDENCIAS_PERMITIDAS.every((d) => ARCHIVOS_DEL_MAPA.some((r) => importsDe(r).some((s) => baseDe(s) === d.modulo))),
  'Cada dependencia declarada la usa algún archivo de Fitness: una declaración que ya no hace falta se quita');
ok(DEPENDENCIAS_PERMITIDAS.every((d) => d.porque && d.porque.length > 20), '…y cada una dice por qué');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F44: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
