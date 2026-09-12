/* ===========================================================================
   NAV F1 — la nueva arquitectura de navegación y el apartado Números.

   ⚠️ **Esta suite comprueba MECANISMOS, no palabras.** La lección que este
   proyecto ha pagado seis veces: una prueba que busca un rótulo salta cuando
   alguien lo reescribe con todo el derecho, y no encuentra nada cuando el
   mecanismo se rompe pero el texto sigue igual.

   ⚠️ Y lee `App.jsx` **en bruto** para las listas de navegación, porque son
   constantes de un archivo que no se puede importar desde Node (arrastra todo
   React). Eso obliga a barrer con expresiones, así que cada una trae su caso
   que la pone roja.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APPS_NUMEROS, IDS_APPS_NUMEROS, appNumeros, hayDatosPara, panelNumeros,
  resumenNumeros, condicionNumeros, NO_EN_NUMEROS, NO_SE_GUARDA,
} from '../src/lib/numeros.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(a === b, `${m}${a === b ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const APP = leer('src/App.jsx');

/* Saca la lista de ids de un área de `AREAS_NAV`, leyendo el archivo de verdad. */
function modulosDelArea(id) {
  const linea = APP.split('\n').find((l) => l.includes(`id: '${id}'`) && l.includes('modulos:'));
  if (!linea) return null;
  const m = linea.match(/modulos:\s*\[([^\]]*)\]/);
  if (!m) return null;
  return m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
}

/* Los ids de `MORE_NAV`: el bloque va desde su declaración hasta el `];`. */
function idsDeMoreNav() {
  const desde = APP.indexOf('const MORE_NAV = [');
  const hasta = APP.indexOf('];', desde);
  const bloque = APP.slice(desde, hasta);
  return [...bloque.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
}

console.log('\n── 1. Las cuatro áreas, con la lógica que pidió Josué ──');

const salud = modulosDelArea('area-salud');
const vida = modulosDelArea('area-vida');
const gestion = modulosDelArea('area-gestion');
const mas = modulosDelArea('area-mas');

ok(Array.isArray(salud) && Array.isArray(vida) && Array.isArray(gestion) && Array.isArray(mas),
  'Se leen las cuatro áreas de `AREAS_NAV`');

// 🚨 Lo que pidió literalmente: Calendario y Horario son herramientas de
// organización temporal, así que van a Gestión.
ok(gestion.includes('calendario'), '🚨 Calendario está en GESTIÓN (era de Vida)');
ok(gestion.includes('horario'), '🚨 Horario está en GESTIÓN (era de Vida)');
ok(!vida.includes('calendario') && !vida.includes('horario'),
  '⚠️ …y NO se han quedado también en Vida: un módulo vive en UN área, o el hub lo enseña dos veces');

// Lo que ya estaba bien y no se toca.
ok(gestion.includes('economia'), 'Economía sigue en Gestión');
ok(vida.includes('diario') && vida.includes('biblioteca') && vida.includes('rachas'),
  'Diario, Biblioteca y Rachas siguen en Vida');

console.log('\n── 2. Además: las áreas complementarias, sin ser un cajón ──');

ok(mas.includes('ajustes'), '🚨 Ajustes está dentro de Además');
ok(mas.includes('relacion') && mas.includes('fe') && mas.includes('bienestar'),
  'Relación, Fe y Bienestar digital siguen en Además');
ok(mas.includes('numeros'), '🚨 Números está en Además');
eq(mas.length, 5, '⚠️ Además tiene CINCO cosas, no un cajón de sastre');
ok(!mas.includes('estilo-hombre'), '🚨 El apartado de estilo YA NO está en Además');

console.log('\n── 3. El apartado de estilo se muda a Bienestar ──');

ok(salud.includes('estilo-hombre'),
  '🚨 El apartado de estilo vive ahora en el área BIENESTAR (`area-salud`)');
// ⚠️ El id NO se toca: es la clave de `app_data` y lo que guarda la
// personalización de la Fase 19 (E3 F30).
ok(APP.includes("id: 'estilo-hombre'"),
  '⚠️ …y su id sigue siendo `estilo-hombre`: renombrar lo que se ve y renombrar lo que se guarda son dos cosas distintas');
ok(salud.includes('salud') && salud.includes('sueno') && salud.includes('nutricion') && salud.includes('entreno'),
  '⚠️ …sin sacar de Bienestar nada de lo que ya había');

console.log('\n── 4. Números agrupa, no reescribe ──');

const ids = idsDeMoreNav();
ok(ids.includes('numeros'), 'Números es un módulo de `MORE_NAV`');
ok(IDS_APPS_NUMEROS.every((id) => !ids.includes(id)),
  '🚨 Estadísticas, Predicciones y Logros YA NO son módulos sueltos del menú');
eq(APPS_NUMEROS.length, 3, 'Números tiene exactamente tres sub-apps');
ok(IDS_APPS_NUMEROS.join(',') === 'estadisticas,predicciones,logros',
  '⚠️ …y conservan sus ids de siempre: los leen `tokens.js`, `experienciaReal` y `auditoriaFinal`');

// 🚨 La comprobación que de verdad importa: la pantalla RENDERIZA las tres
// vistas originales. Si una fase futura copiara su contenido aquí, habría dos
// versiones de la misma pantalla diciendo cosas distintas.
const VISTA = leer('src/views/NumbersView.jsx');
for (const v of ['StatsView', 'PredictionsView', 'AchievementsView']) {
  ok(VISTA.includes(`import ${v} from`) && VISTA.includes(`<${v}`),
    `🚨 \`${v}\` se importa y se renderiza TAL CUAL — no se ha copiado su contenido`);
}

// Y `App.jsx` ya no las importa: serían tres imports muertos.
ok(!APP.includes("from './views/StatsView'"),
  '⚠️ `App.jsx` ya no importa las tres: un import que nadie usa es código muerto (van cuatro casos en el proyecto)');

console.log('\n── 5. Cada sub-app tiene su icono, que es de otro catálogo ──');

/* ⚠️ El catálogo de iconos es un `.jsx` y Node no lo puede importar, así que se
   lee como texto — igual que hacen las otras suites con `iconosPrenda.jsx`. */
const ICONOS = leer('src/components/iconosNumeros.jsx');
for (const a of APPS_NUMEROS) {
  ok(new RegExp(`${a.id}:\\s*\\w+`).test(ICONOS),
    `⚠️ «${a.nombre}» tiene su icono en \`ICONOS_NUMEROS\` (uno falta y sale un hueco, sin fallar)`);
}
// Y la regla se prueba a sí misma: una sub-app inventada NO está.
ok(!/inventada:\s*\w+/.test(ICONOS), '⚠️ …y la comprobación puede fallar: un id que no existe no tiene icono');
ok(!leer('src/lib/numeros.js').includes('lucide-react'),
  '⚠️ `numeros.js` es datos y NO importa componentes: mismo reparto que MINI_APPS / ICONOS_MINI_APP');

console.log('\n── 6. Números no guarda ni una cifra ──');

eq(NO_SE_GUARDA.clave, null, '🚨 No hay clave nueva en `app_data`');
const LIB = leer('src/lib/numeros.js');
ok(!/saveData|loadData/.test(LIB), '🚨 …y la librería no escribe ni lee del almacén');
ok(!/normalizar/i.test(LIB.replace(/\/\*[\s\S]*?\*\//g, '')),
  '⚠️ …ni tiene normalizador, porque no tiene nada que normalizar');

console.log('\n── 7. Sin datos se dice qué falta, nunca un cero ──');

const vacio = {};
const panelVacio = panelNumeros(vacio);
eq(panelVacio.length, 3, 'El panel devuelve las tres');
ok(panelVacio.every((p) => typeof p.linea === 'string' && p.linea.length > 0),
  'Todas traen su línea');
const resVacio = resumenNumeros(vacio);
ok(!/\b0\b/.test(resVacio.linea2),
  '🚨 Sin datos el resumen NO dice «0 de 3»: un cero sería inventarse un mal resultado donde no ha registrado nada');
eq(resVacio.estado, 'vacio', '…y se marca como vacío');

const conDatos = { sueno: [{ id: '1' }], objetivos: [{ id: 'o' }] };
const resLleno = resumenNumeros(conDatos);
ok(/3 de 3|2 de 3|1 de 3/.test(resLleno.linea2), 'Con datos sí se cuenta cuántas tienen algo que enseñar');
/* 🐛 Esto devolvía `true` a secas y decía «1 de 3 con datos» con la aplicación
   vacía. Una insignia bloqueada no es un dato de Josué. */
ok(hayDatosPara('logros', vacio) === false,
  '🐛 Logros SIN registros no cuenta como «con datos»: una insignia bloqueada no es un dato suyo');
ok(hayDatosPara('logros', { diario: { entradas: [{ id: 'd' }] } }) === true,
  '…y con una entrada de diario sí');
ok(hayDatosPara('estadisticas', vacio) === false, '⚠️ Las correlaciones necesitan registros');
ok(hayDatosPara('inventada', vacio) === null,
  '🚨 Una sub-app que no existe devuelve `null`, no `false`: «no lo sé» y «sé que no» son dos cosas (EH F32)');

console.log('\n── 8. El hub sabe resumir el módulo nuevo ──');

const rHub = calcularResumenModulo('numeros', vacio);
ok(rHub && rHub.linea1 && rHub.linea2, '🚨 `numeros` tiene su línea en el hub, no cae al `default` en blanco');
// ⚠️ Y las tres viejas SIGUEN teniendo la suya: sus ids siguen vivos en los
// presets de `tokens.js` y en dos auditorías.
for (const id of IDS_APPS_NUMEROS) {
  const r = calcularResumenModulo(id, vacio);
  ok(!!(r && r.linea1), `⚠️ «${id}» conserva su resumen: su id sigue vivo aunque ya no sea un módulo del menú`);
}

console.log('\n── 9. Las palabras se mudan al buscador, no se borran ──');

const IDX = leer('src/lib/indiceBusqueda.js');
// 🚨 La lección de la E3 F23 con Objetivos: buscar «logros» tiene que seguir
// encontrando algo.
for (const palabra of ['graficas', 'insignias', 'futuro', 'estadisticas', 'logros', 'predicciones']) {
  const bloque = IDX.slice(IDX.indexOf('numeros: ['), IDX.indexOf(']', IDX.indexOf('numeros: [')));
  ok(bloque.includes(`'${palabra}'`),
    `🚨 Buscar «${palabra}» sigue llevando a algún sitio — ahora a Números`);
}

console.log('\n── 10. Lo que NO entra, declarado con su motivo ──');

ok(NO_EN_NUMEROS.length >= 3, 'Se declara lo que se ha dejado fuera');
ok(NO_EN_NUMEROS.every((n) => n.que && n.porque && n.donde),
  '⚠️ …cada uno con su motivo y dónde vive de verdad, no solo omitido');
ok(NO_EN_NUMEROS.some((n) => /Rachas/i.test(n.que)),
  '⚠️ Rachas se queda en Vida: tiene pantalla propia y se REGISTRA desde ella');

console.log('\n── 11. La condición de la fase se calcula ──');

const moreNav = idsDeMoreNav().map((id) => ({ id }));
const areasNav = [
  { id: 'area-salud', modulos: salud }, { id: 'area-vida', modulos: vida },
  { id: 'area-gestion', modulos: gestion }, { id: 'area-mas', modulos: mas },
];
const cond = condicionNumeros({ moreNav, areasNav });
ok(cond.ok, `🚨 La condición de finalización sale VERDE (${cond.casillas.filter((c) => c.ok).length}/${cond.casillas.length})`);

// ⚠️ Y una auditoría que no puede fallar no sirve (EH F42): con las tres sueltas
// otra vez, tiene que ponerse roja.
const condMala = condicionNumeros({
  moreNav: [...moreNav, { id: 'estadisticas' }],
  areasNav,
});
ok(!condMala.ok, '⚠️ …y se pone ROJA si alguien vuelve a sacar una sub-app al menú (la auditoría puede fallar)');

console.log('\n── 12. Ni un dato se ha movido ──');

// 🚨 Reorganizar áreas es navegación. Si esta fase hubiera tocado una clave de
// `app_data`, lo guardado por Josué se habría quedado huérfano.
const DIFF_CLAVES = ['calendario', 'horario', 'estiloHombre', 'estudios', 'productividad'];
for (const clave of DIFF_CLAVES) {
  ok(APP.includes(`'${clave}'`) || APP.includes(`${clave},`),
    `⚠️ La clave \`${clave}\` sigue existiendo en App.jsx: se ha movido el acceso, no el dato`);
}

console.log(`\n  ${fallos.length ? '✗' : '✓'} Navegación y Números — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
