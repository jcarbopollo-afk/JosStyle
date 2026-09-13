/* ===========================================================================
   DIST F2 — la auditoría de la reorganización.

   ⚠️ **Cada casilla se prueba DOS veces: verde con la aplicación de verdad, y
   roja con un caso construido para romperla.** Una auditoría que no puede
   fallar no sirve (EH F42), y una que *parece* vigilar algo es peor, porque
   nadie vuelve a mirarla.

   ⚠️ Y lee `App.jsx` **en bruto** para las listas de navegación, porque son
   constantes de un archivo que no se puede importar desde Node (arrastra todo
   React).
   =========================================================================== */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ARBOL_DIST, auditarArbol, auditarReubicados, auditarVueltaAtras,
  auditarClaves, auditarNombresViejos, auditarIconos, informeDIST,
  CLAVES_QUE_NO_SE_TOCAN, NOMBRES_VIEJOS, FUERA_DEL_ALCANCE,
} from '../src/lib/auditoriaDist.js';
import { AGRUPADORES, APPS_DE_AGRUPADORES, agrupadorDeApp, appProtegida } from '../src/lib/agrupadores.js';
import { MINI_APPS_PR, IDS_MINI_APPS_PR } from '../src/lib/productividad.js';
import { IDS_APPS_NUMEROS } from '../src/lib/numeros.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };

const APP = leer('src/App.jsx');

/* Las listas reales de `App.jsx`. */
const bloque = (nombre) => {
  const desde = APP.indexOf(`const ${nombre} = [`);
  return APP.slice(desde, APP.indexOf('\n];', desde));
};
const moreNav = [...bloque('MORE_NAV').matchAll(/\{\s*id: '([^']+)'/g)].map((m) => ({ id: m[1] }));
const areasNav = [...bloque('AREAS_NAV').matchAll(/id: '(area-[^']+)'[^\n]*modulos: \[([^\]]*)\]/g)]
  .map((m) => ({ id: m[1], modulos: [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) }));

console.log('\n═══ DIST F2 — AUDITORÍA DE LA REORGANIZACIÓN ═══\n');

console.log('── 0. Se leen las listas de verdad ──');
ok(moreNav.length > 10, `se leen los módulos de MORE_NAV (${moreNav.length})`);
ok(areasNav.length === 3, `y las tres áreas de AREAS_NAV (${areasNav.length})`);
ok(areasNav.every((a) => a.modulos.length === 5),
  '🚨 cada área tiene CINCO módulos, como pidió Josué');

console.log('\n── 1. El árbol es el que él escribió ──');
const arbol = auditarArbol({ moreNav, areasNav });
ok(arbol.ok, `🚨 la navegación es exactamente la del encargo${arbol.ok ? '' : ` — ${JSON.stringify(arbol.problemas)}`}`);
// 🚨 Y se pone roja: un módulo en el área equivocada.
ok(!auditarArbol({
  moreNav,
  areasNav: areasNav.map((a) => (a.id === 'area-vida' ? { ...a, modulos: [...a.modulos, 'armario'] } : a)),
}).ok, '⚠️ …y se pone ROJA si alguien mete un módulo donde no toca');
// 🚨 Y si vuelve «Además».
ok(!auditarArbol({ moreNav, areasNav: [...areasNav, { id: 'area-mas', modulos: [] }] }).ok,
  '⚠️ …y si vuelve el área «Además», que él eliminó');
// 🚨 Y si Ajustes se mete además dentro de un área.
ok(!auditarArbol({
  moreNav,
  areasNav: areasNav.map((a) => (a.id === 'area-gestion' ? { ...a, modulos: [...a.modulos, 'ajustes'] } : a)),
}).ok, '⚠️ …y si Ajustes acaba además dentro de un área: se vería dos veces');

console.log('\n── 2. Lo reubicado, en un solo sitio ──');
const reub = auditarReubicados({ moreNav, areasNav });
ok(reub.ok, `🚨 Rachas, Mente, Organización y Progreso tienen dentro lo que deben${reub.ok ? '' : ` — ${JSON.stringify(reub.problemas)}`}`);
ok(!auditarReubicados({ moreNav: [...moreNav, { id: 'fe' }], areasNav }).ok,
  '⚠️ …y se pone ROJA si algo queda dentro de su agrupador Y suelto en el menú');

/* Las cuatro reubicaciones, una a una y con sus palabras. */
ok(agrupadorDeApp('fe') === 'mente' && agrupadorDeApp('relacion') === 'mente' && agrupadorDeApp('bienestar') === 'mente',
  '🚨 Fe, Relación y Bienestar digital están en Vida → Mente');
ok(agrupadorDeApp('tareas') === 'organizacion' && agrupadorDeApp('calendario') === 'organizacion'
  && agrupadorDeApp('horario') === 'organizacion',
  '🚨 Tareas, Calendario y Horario están en Gestión → Organización');
ok(IDS_APPS_NUMEROS.join(',') === 'estadisticas,predicciones,logros',
  '🚨 Estadísticas, Predicciones y Logros están en Gestión → Progreso');
ok(IDS_MINI_APPS_PR.includes('rachas') && !IDS_MINI_APPS_PR.includes('tareas'),
  '🚨 Rachas está dentro de Productividad, y Tareas ya no');

console.log('\n── 3. Ninguna ruta anidada es un callejón sin salida ──');
const vuelta = auditarVueltaAtras({ areasNav });
ok(vuelta.ok, `🚨 cada submódulo sabe a quién volver${vuelta.ok ? '' : ` — ${JSON.stringify(vuelta.problemas)}`}`);
ok(!auditarVueltaAtras({ areasNav: areasNav.map((a) => ({ ...a, modulos: a.modulos.filter((m) => m !== 'organizacion') })) }).ok,
  '⚠️ …y se pone ROJA si un agrupador se queda sin área');

/* 🚨 Y la vuelta de verdad: `AgrupadorView` tiene su botón, y `App.jsx` sabe
   resolver el área de un módulo agrupado por su padre. */
const VISTA_AGR = leer('src/views/AgrupadorView.jsx');
ok(/aria-label=\{`Volver a \$\{grupo\.nombre\}`\}/.test(VISTA_AGR),
  '🚨 el botón de volver de una agrupadora lleva SU nombre, no uno escrito a mano');
ok(/const padreDeModulo = /.test(APP) && /agrupadorDeApp\(id\) \|\| PADRE_DE_MODULO\[id\]/.test(APP),
  '🚨 y `App.jsx` resuelve el área de un módulo agrupado por su padre: sin eso, un enlace directo abre sin salida');

console.log('\n── 4. Ni una clave de `app_data` ha cambiado ──');
const claves = auditarClaves(APP);
ok(claves.ok, `🚨 las ${CLAVES_QUE_NO_SE_TOCAN.length} claves siguen en App.jsx${claves.ok ? '' : ` — ${JSON.stringify(claves.problemas)}`}`);
ok(!auditarClaves('const nada = 1;').ok, '⚠️ …y se pone ROJA si una desaparece');

console.log('\n── 5. Los renombrados, hechos del todo ──');
for (const r of ARBOL_DIST.renombrados) {
  ok(new RegExp(`id: '${r.id}', label: '${r.ahora}'`).test(APP),
    `🏷️ «${r.antes}» → «${r.ahora}», con el id \`${r.id}\` sin tocar`);
}
/* 🚨 El nombre de un módulo renombrado no puede estar escrito a mano en una
   vista: es el fallo que la E3 F30 pagó caro y que DIST F1 volvió a encontrar
   en el Dashboard (`titulo="Mi salud"`). */
/* 🐛 **Y esta comprobación saltó con el código bien, por decimoséptima vez en
   este proyecto.** El comentario que explica que el literal se quitó **contiene
   el literal**, así que barrer el archivo entero lo encuentra. Una prueba que
   busca si el código HACE algo tiene que quitar los comentarios antes. */
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
ok(!/titulo="Mi salud"/.test(sinComentarios(leer('src/views/DashboardView.jsx'))),
  '🚨 y el Dashboard ya NO lleva el nombre escrito a mano: lo importa de `salud.js`');
ok(/titulo=\{NOMBRE_SALUD\}/.test(leer('src/views/DashboardView.jsx')),
  '⚠️ …sino que lo lee de la constante, así que el próximo renombrado llega solo');
ok(/NOMBRE_PROGRESO/.test(leer('src/views/NumbersView.jsx')),
  '🚨 y la pantalla de Progreso tampoco: lo lee de `numeros.js`');
const nombres = auditarNombresViejos('Bienestar · Salud física · Imagen personal · Progreso');
ok(nombres.ok, '⚠️ con los nombres nuevos no salta nada');
ok(!auditarNombresViejos('Bienestar · Mi salud').ok, '⚠️ …y se pone ROJA con uno retirado');
ok(NOMBRES_VIEJOS.includes('Estilo de hombre'),
  '⚠️ «Estilo de hombre» está en la lista de nombres retirados (apartado 2 del encargo)');

console.log('\n── 6. Los iconos, sin repetirse entre conceptos ──');
/* Los de la navegación se leen de `MORE_NAV`; los de las mini-apps y las
   sub-apps, de sus catálogos. Repetir uno es lo que hacía que Hábitos y Rachas
   parecieran el mismo apartado (NAV F4). */
const iconosNav = [...bloque('MORE_NAV').matchAll(/\{\s*id: '([^']+)', label: '[^']*', icon: (\w+)/g)]
  .map((m) => ({ id: m[1], icono: m[2] }));
ok(iconosNav.length >= 14, `se leen los iconos de la navegación (${iconosNav.length})`);
const iconos = auditarIconos(iconosNav);
ok(iconos.ok, `🚨 ningún módulo de la navegación repite icono${iconos.ok ? '' : ` — ${JSON.stringify(iconos.problemas)}`}`);
ok(!auditarIconos([{ id: 'a', icono: 'Flame' }, { id: 'b', icono: 'Flame' }]).ok,
  '⚠️ …y se pone ROJA con dos que compartan dibujo');

/* ⚠️ Y las sub-apps de las agrupadoras tienen el suyo, o saldrían con un hueco
   sin fallar en ninguna parte (E3 F16). */
const ICONOS_AGR = leer('src/components/iconosAgrupadores.jsx');
for (const app of APPS_DE_AGRUPADORES) {
  ok(new RegExp(`\\b${app.id}:`).test(ICONOS_AGR), `⚠️ «${app.id}» tiene su icono en \`ICONOS_AGRUPADORES\``);
}
ok(MINI_APPS_PR.every((m) => !!m.icono), '⚠️ y las seis mini-apps de Productividad también');

console.log('\n── 7. El PIN de Relación, que es lo que más cuesta ver ──');
/* 🚨 La comprobación que de verdad importa de toda la fase: Relación perdió su
   pestaña, así que el PIN dejó de dispararse por `tab === 'relacion'`. */
ok(appProtegida('relacion'), '🚨 Relación está declarada como protegida en el catálogo');
ok(!appProtegida('fe') && !appProtegida('bienestar'),
  '⚠️ …y es la única: el PIN no se pide para entrar en Fe ni en Bienestar digital');
ok(/const protegerPanel = /.test(APP) && /appProtegida\(appId\)/.test(APP),
  '🚨 `App.jsx` protege el PANEL, no la pestaña: es lo que salva la regla 6 al meterla dentro de Mente');
ok(/area:\$\{appId\}/.test(APP),
  '⚠️ …con la MISMA clave de sesión de siempre: ni un segundo sistema de PIN');
ok(/faltaProteccion/.test(VISTA_AGR) && /protegerPanel\(app\.id, crudo\)/.test(VISTA_AGR),
  '🚨 y si alguien olvidara el protector, la pantalla se NIEGA a pintar el panel en vez de abrirlo');

console.log('\n── 8. Las agrupadoras no reescriben nada ──');
ok(/panelDe=\{renderModulo\}/.test(APP),
  '🚨 los paneles salen de `renderModulo`, la MISMA definición que usa la pestaña: no hay una segunda copia de sus props');
ok(/import ProductivityView, \{ TareasTab \}/.test(APP),
  '🚨 y `TareasTab` se importa de su archivo de siempre: no se ha reescrito');
ok(/renderRachas\?\.\(\)/.test(leer('src/views/ProductivityView.jsx')),
  '🚨 y Rachas llega pintada desde `App.jsx`, por lo mismo');
ok(!/function TareasTab2|function ListaDeTareas|function PanelRachas/.test(VISTA_AGR + leer('src/views/ProductivityView.jsx')),
  '⚠️ y no hay ni una versión nueva de las que ya existían');

console.log('\n── 9. El informe entero ──');
const informe = informeDIST({
  moreNav, areasNav, codigoApp: APP,
  textoEnPantalla: 'Bienestar · Salud física · Imagen personal · Progreso · Mente · Organización',
  iconos: iconosNav,
});
ok(informe.ok, `🚨 LAS SEIS CASILLAS SALEN VERDES${informe.ok ? '' : ` — ${JSON.stringify(informe.problemas)}`}`);
ok(informe.casillas.length === 6, 'y son seis, calculadas una a una');
ok(!informeDIST({ moreNav, areasNav, codigoApp: '', textoEnPantalla: 'Mi salud', iconos: iconosNav }).ok,
  '⚠️ …y el informe entero se pone ROJO si algo se rompe');

console.log('\n── 10. Lo que esta auditoría NO puede comprobar, dicho ──');
ok(FUERA_DEL_ALCANCE.length >= 3, 'se declara lo que queda fuera de alcance');
ok(FUERA_DEL_ALCANCE.every((x) => x.que && x.porque && x.decide),
  '⚠️ cada cosa con su motivo y quién decide: un informe que solo enumera lo verde miente por omisión');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Auditoría de la reorganización (DIST F2) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
