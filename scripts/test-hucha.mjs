// ============================================================================
// ENTREGA 3 · FASE 4 — LA HUCHA DE ECONOMÍA
//
// Las trece condiciones del criterio final de aceptación, y sobre todo las dos
// que esta fase podía romper sin darse cuenta:
//
// 🚨 **QUE NO SALGA DE ECONOMÍA** (apartado 8): *"este objetivo de ahorro NO
// debe aparecer en el apartado global de Objetivos. No crear una relación
// innecesaria con objetivos personales, rachas, productividad, dashboard u
// otros módulos."* Se comprueba leyendo el código, no confiando en que nadie
// lo haya hecho.
//
// ⚠️ **Y QUE EL NORMALIZADOR CONOZCA LOS CAMPOS NUEVOS.** `objetivoHucha` y
// `aportaciones` son dos campos nuevos de `economia`: sin su línea en el
// normalizador, el siguiente guardado se los lleva (regla 5). Es el fallo que
// este proyecto ha cazado dieciocho veces.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FRECUENCIAS_HUCHA, frecuenciaHucha, DEFAULT_OBJETIVO_HUCHA,
  normalizarObjetivoHucha, normalizarAportaciones, normalizarEconomiaHucha,
  tieneObjetivo, anadirAhorro, eliminarAportacion,
  guardarObjetivoHucha, quitarObjetivoHucha,
  periodoActual, ahorradoEnPeriodo, barraDeProgreso, LARGO_BARRA,
  ESTADOS_HUCHA, panelHucha,
} from '../src/lib/hucha.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
/* 🐛 El comentario JSX se reconoce por `{/*` **pegados**, sin espacios en medio.
   Con `\{\s*\/\*` bastaba una función que abriera llave y llevara un comentario
   de bloque en la línea siguiente —algo tan normal como esto:

       const updateObjetivo = (o) => {
         /* lo que hace *\/
         ...

   para que la expresión buscara el cierre `*\/}` mucho más abajo y se tragara
   cientos de líneas de código real. Lo destapó el 2026-09-04 un comentario nuevo
   en `App.jsx`: la comprobación de `onUpdateEconomia` falló con la línea ahí
   escrita, porque el limpiador se la había comido antes de mirarla.

   En este proyecto los comentarios JSX se escriben siempre `{/* … *\/}`, así que
   exigirlos pegados no pierde ninguno y quita la ambigüedad. */
const sinComentarios = (t) => t
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// Jueves 3 de septiembre de 2026. La semana empieza el lunes 31 de agosto.
const HOY = '2026-09-03';
const LUNES = '2026-08-31';
const DOMINGO_ANTERIOR = '2026-08-30';

const base = (extra = {}) => ({ saldoInicial: 0, hucha: 0, movimientos: [], ...extra });

console.log('\n═══ 1. LOS CAMPOS NUEVOS Y SU NORMALIZADOR (regla 5) ═══\n');

const vacia = normalizarEconomiaHucha(base());
eq(vacia.objetivoHucha, DEFAULT_OBJETIVO_HUCHA, 'una economía sin objetivo se normaliza al objetivo vacío');
eq(vacia.aportaciones, [], 'y sin aportaciones, a una lista vacía');
ok(normalizarEconomiaHucha(undefined).hucha === 0, '⚠️ y sin nada guardado no revienta');

// 🚨 Lo guardado ANTES de esta fase no tiene los campos: tiene que sobrevivir.
const antigua = normalizarEconomiaHucha({ saldoInicial: 10, hucha: 125, movimientos: [{ id: 'm1' }] });
eq([antigua.hucha, antigua.saldoInicial, antigua.movimientos.length], [125, 10, 1],
  '🚨 lo guardado antes de esta fase conserva su saldo, su hucha y sus movimientos');
eq(antigua.aportaciones, [], 'y estrena las aportaciones vacías, sin inventarse un historial');

// Un objetivo con basura dentro no puede quedarse guardado.
eq(normalizarObjetivoHucha({ cantidad: 'quinientos', porPeriodo: -5, frecuencia: 'trimestre' }),
  { cantidad: null, porPeriodo: null, frecuencia: 'semana' },
  '⚠️ una cantidad que no es un número, una negativa y una frecuencia inventada se limpian');
eq(normalizarAportaciones([{ id: 'a', fecha: '2026-09-01', cantidad: 10 }, { cantidad: 5 }, null]).length, 1,
  '⚠️ una aportación sin id o sin fecha no se guarda: sería un duplicado esperando a pasar (EH F45)');

console.log('\n═══ 2. AÑADIR AHORRO (apartado 4) ═══\n');

const conAhorro = anadirAhorro(base({ hucha: 100 }), 25, HOY);
eq(conAhorro.hucha, 125, 'añadir 25 sube el total a 125');
eq(conAhorro.aportaciones.length, 1, 'y deja su apunte en el historial');
eq(conAhorro.aportaciones[0].fecha, HOY, 'con la fecha del día');
eq(anadirAhorro(base({ hucha: 100 }), 0, HOY).hucha, 100, '⚠️ añadir cero no hace nada');
eq(anadirAhorro(base({ hucha: 100 }), 'mucho', HOY).hucha, 100, 'y añadir algo que no es un número, tampoco');
eq(anadirAhorro(base({ hucha: 100 }), 10.555, HOY).hucha, 110.56, '⚠️ y se redondea a céntimos: nada de 110.55499999');

const menos = eliminarAportacion(conAhorro, conAhorro.aportaciones[0].id);
eq([menos.hucha, menos.aportaciones.length], [100, 0], 'quitar una aportación devuelve el total a donde estaba');
eq(eliminarAportacion(conAhorro, 'no_existe').hucha, 125, 'y quitar una que no existe no toca nada');

console.log('\n═══ 3. LOS TRES ESTADOS (apartados 6 y 10) ═══\n');

// Sin objetivo — apartado 10: *"la hucha debe funcionar aunque no exista objetivo"*.
const sin = panelHucha(base({ hucha: 125 }), HOY);
eq(sin.estado, ESTADOS_HUCHA.SIN_OBJETIVO, '🚨 sin objetivo, la hucha sigue funcionando');
eq(sin.titulo, '125.00 € ahorrados', 'y enseña lo que hay');
eq([sin.barra, sin.porcentaje], [null, null],
  '⚠️ sin objetivo NO hay barra ni porcentaje: un 0 % de nada sería una cifra inventada');

// Con objetivo.
let e = guardarObjetivoHucha(base({ hucha: 125 }), { cantidad: 500, porPeriodo: 50, frecuencia: 'semana' });
const enCurso = panelHucha(e, HOY);
eq(enCurso.estado, ESTADOS_HUCHA.EN_CURSO, 'con objetivo a medias, en curso');
eq(enCurso.titulo, '125.00 € / 500.00 €', 'y el título es el del apartado 10');
eq(enCurso.porcentaje, 25, '25 %');
eq(enCurso.barra, '███░░░░░░░░░', 'con su barra de doce bloques');
eq(enCurso.periodo.linea, 'Ahorrar 50.00 € cada semana', 'y la línea del objetivo por periodo');

// Objetivo alcanzado.
const hecho = panelHucha(guardarObjetivoHucha(base({ hucha: 500 }), { cantidad: 500 }), HOY);
eq(hecho.estado, ESTADOS_HUCHA.ALCANZADO, '🎉 con el total alcanzado, alcanzado');
eq([hecho.porcentaje, hecho.barra], [100, '████████████'], 'al 100 % y la barra llena');
eq(hecho.detalle, 'Objetivo alcanzado', 'con su frase');
eq(panelHucha(guardarObjetivoHucha(base({ hucha: 700 }), { cantidad: 500 }), HOY).porcentaje, 100,
  '⚠️ y pasarse no da 140 %: se queda en 100');

console.log('\n═══ 4. EL SEGUIMIENTO DEL PERIODO (apartados 5, 6 y 7) ═══\n');

eq(FRECUENCIAS_HUCHA.map((f) => f.id), ['dia', 'semana', 'mes'],
  'las tres frecuencias del apartado 5, ni una más');
eq(frecuenciaHucha('inventada').id, 'semana', 'y una que no existe cae en la semana');

// 🐛 El periodo se calcula en LOCAL. Ésta es la trampa que ha roto el proyecto seis veces.
eq(periodoActual(guardarObjetivoHucha(base(), { cantidad: 100, frecuencia: 'semana' }), HOY).desde, LUNES,
  '🚨 la semana empieza el LUNES, y se calcula en local (nunca `toISOString`)');
eq(periodoActual(guardarObjetivoHucha(base(), { cantidad: 100, frecuencia: 'mes' }), HOY).desde, '2026-09-01',
  'el mes, el día 1');
eq(periodoActual(guardarObjetivoHucha(base(), { cantidad: 100, frecuencia: 'dia' }), HOY).desde, HOY,
  'y el día, hoy');

// Lo de la semana pasada no cuenta para ésta.
e = guardarObjetivoHucha(base(), { cantidad: 500, porPeriodo: 50, frecuencia: 'semana' });
e = anadirAhorro(e, 40, DOMINGO_ANTERIOR);
e = anadirAhorro(e, 35, HOY);
eq(ahorradoEnPeriodo(e, HOY), 35, '🚨 lo ahorrado el domingo anterior NO cuenta para esta semana');

const p = panelHucha(e, HOY).periodo;
eq([p.ahorrado, p.faltan, p.cumplido], [35, 15, false], 'con 35 de 50, faltan 15');
eq(p.estado, 'Esta semana: faltan 15.00 €', '⚠️ y lo dice con las palabras del apartado 6');

const cumpliendo = panelHucha(anadirAhorro(e, 20, HOY), HOY).periodo;
eq([cumpliendo.cumplido, cumpliendo.faltan], [true, 0], 'con 55 de 50, cumplido');
eq(cumpliendo.estado, 'Esta semana: cumplido', 'y también con sus palabras');

// ⚠️ Sin "cuánto por periodo" no se inventa uno a partir del total.
eq(panelHucha(guardarObjetivoHucha(base({ hucha: 100 }), { cantidad: 500 }), HOY).periodo, null,
  '🚨 sin decir cuánto quiere ahorrar por periodo NO se inventa un objetivo semanal (regla 8)');

eq(quitarObjetivoHucha(e).objetivoHucha.cantidad, null, 'quitar el objetivo lo deja sin objetivo');
eq(quitarObjetivoHucha(e).aportaciones.length, 2,
  '⚠️ pero NO borra el historial de ahorro: eso lo guardó él, no es del objetivo');
ok(!tieneObjetivo(base()) && tieneObjetivo(e), '`tieneObjetivo` distingue las dos cosas');

console.log('\n═══ 5. LA BARRA ES DE CARACTERES (apartados 6 y 9) ═══\n');

eq(barraDeProgreso(0).length, LARGO_BARRA, 'la barra mide siempre lo mismo');
eq(barraDeProgreso(50), '██████░░░░░░', 'al 50 % va por la mitad');
eq(barraDeProgreso(-20), '░░░░░░░░░░░░', '⚠️ y un porcentaje absurdo no la desborda');
eq(barraDeProgreso(300), '████████████', 'por ninguno de los dos lados');

const LIB = leer('src/lib/hucha.js');
const codigo = sinComentarios(LIB);
ok(!/canvas|<svg|recharts|LineChart/i.test(codigo),
  '🚨 ni un gráfico: el apartado 6 dice "no crear gráficos grandes ni estadísticas complejas"');

console.log('\n═══ 6. NO SALE DE ECONOMÍA (apartado 8) ═══\n');

for (const modulo of ['objetivos', 'rachas', 'productividad', 'dashboard', 'gamificacion']) {
  ok(!new RegExp(`\\b${modulo}\\b`, 'i').test(codigo),
    `🚨 la hucha no toca \`${modulo}\`: el objetivo de ahorro NO sale de Economía (apartado 8)`);
}
ok(!/saveData|supabase/i.test(codigo),
  '⚠️ y no guarda por su cuenta: devuelve la economía y escribe App.jsx, como todo lo demás');

const APP = sinComentarios(leer('src/App.jsx'));
ok(/normalizarEconomiaHucha\(e\)/.test(APP),
  '🚨 App.jsx normaliza la economía al cargarla (si no, el siguiente guardado se lleva los campos nuevos)');
ok(/onUpdateEconomia=\{updateEconomia\}/.test(APP), 'y le pasa a Economía la puerta para guardar');
ok(!/objetivoHucha/.test(sinComentarios(leer('src/views/ObjectivesView.jsx'))),
  '🚨 el objetivo de ahorro NO aparece en el apartado global de Objetivos');
ok(!/objetivoHucha|panelHucha/.test(sinComentarios(leer('src/views/DashboardView.jsx'))),
  '🚨 ni en el Dashboard: es una función específica de Economía → Hucha');

console.log('\n═══ 7. NI UNA PANTALLA NUEVA (apartados 2, 9 y 11) ═══\n');

const VISTA = sinComentarios(leer('src/views/FinanceView.jsx'));
ok(/function BloqueHucha/.test(VISTA), 'la hucha es un bloque dentro de Economía');
ok(/<BloqueHucha/.test(VISTA) && VISTA.indexOf('<BloqueHucha') > VISTA.indexOf('Cuenta principal'),
  '⚠️ y va DENTRO de la tarjeta de Cuenta principal, no en una Card propia (apartado 9)');
ok(/PiggyBank/.test(VISTA), 'con su icono pequeño (apartado 3)');
/* ⚠️ El patrón tiene que buscar el MECANISMO, no la palabra: el primero era
   `/\/hucha/` y saltaba con el `import … from './lib/hucha'` de este mismo
   arreglo. Enésima vez de la lección; lo que hay que buscar es una pestaña o un
   `case` de navegación, que es lo que sería un apartado nuevo. */
ok(!/case 'hucha'/.test(APP) && !/id: 'hucha'/.test(APP),
  '🚨 no hay una pantalla ni una entrada de navegación de hucha: no se crea ningún apartado nuevo');
ok(/panelHucha\(economia\)/.test(VISTA),
  '⚠️ los números salen de la librería, no se calculan en la pantalla');
ok(!/toFixed\(\d\) \/ |porcentaje = /.test(VISTA),
  'y la vista no hace su propia cuenta del porcentaje');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
