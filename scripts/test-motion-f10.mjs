/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 10 — layout motion, scroll, listas y contenido dinámico

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f10.mjs

   Lo que se comprueba aquí es la DECISIÓN —qué entra, qué sale y qué se
   recoloca cuando una lista cambia, con su presupuesto; qué es otro diseño;
   qué fuentes se esperan—, que las pantallas la cableen y que la auditoría
   cace lo que no puede volver. Lo que necesita un navegador —que al borrar una
   tarea la copia se vaya inerte y las de debajo suban, que una fila viaje al
   reordenarla, que un desplegable crezca y se encoja antes de desmontarse y
   que cambiar el tamaño de la ventana no anime nada— está en la sección
   «MS F10» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PRESUPUESTO_LAYOUT, TIEMPOS_F10, seVe, planDeLista, cambioDeDiseno, escalaDe, FUENTES_DE_LA_APP, TOPE_FUENTES_MS,
  fuentesDelImport, INVENTARIO_F10, CONEXIONES_F10, PATRONES_F10, IMAGENES_CON_TAMANO_DE_FUERA, imagenesSinHueco,
  auditarLayout, AUDITORIA_F10, NO_EN_F10, CUANDO_F10,
} from '../src/lib/layoutMotion.js';
import { DURACIONES_MOTION, CURVAS_MOTION } from '../src/lib/motion.js';
import { MOTION_MAP, HALLAZGOS_F0, auditarMotion } from '../src/lib/motionMapa.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const CSS = leer('src/index.css');
const CSS_LIMPIO = sinComentarios(CSS);
const COMP = leer('src/components/layoutMotion.jsx');
const COMP_L = sinComentarios(COMP);
const VISTAS = {};
['src/views', 'src/components'].forEach((dir) => {
  readdirSync(join(RAIZ, dir)).filter((f) => /\.jsx?$/.test(f)).forEach((f) => { VISTAS[`${dir}/${f}`] = leer(`${dir}/${f}`); });
});
VISTAS['src/App.jsx'] = leer('src/App.jsx');

/* Una fila: `y` en la lista, alto 40, todas en la misma columna. */
const fila = (y, padre = null, h = 40) => ({ x: 0, y, w: 300, h, padre, xr: 0, yr: y });
const lista = (...ids) => Object.fromEntries(ids.map((id, i) => [id, fila(i * 50)]));

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. El presupuesto y los tiempos (apartados 38 y 39) ──');

ok(PRESUPUESTO_LAYOUT.maxAnimados > 0 && PRESUPUESTO_LAYOUT.maxAnimados <= 30, `🚨 como mucho ${PRESUPUESTO_LAYOUT.maxAnimados} filas se animan a la vez: *"evitar animar simultáneamente cientos de nodos"*`);
ok(PRESUPUESTO_LAYOUT.maxMedidos >= 100 && PRESUPUESTO_LAYOUT.maxSalidas >= 1 && PRESUPUESTO_LAYOUT.maxSalidas < PRESUPUESTO_LAYOUT.maxAnimados, '…con un tope de lo que se mide y de las copias que salen a la vez');
ok(Object.isFrozen(PRESUPUESTO_LAYOUT) && Object.isFrozen(TIEMPOS_F10), 'el presupuesto y los tiempos no se tocan desde fuera');
ok(['sale', 'entra', 'recoloca', 'plegar', 'cambioEntero'].every((k) => DURACIONES_MOTION[TIEMPOS_F10[k].duracion] && CURVAS_MOTION[TIEMPOS_F10[k].curva]), 'cada tiempo es un token de la F1 y cada curva una de las suyas: ni una cifra nueva');
ok(DURACIONES_MOTION[TIEMPOS_F10.sale.duracion] < DURACIONES_MOTION[TIEMPOS_F10.entra.duracion], 'salir es más corto que entrar (apartado 11 de la F1)');
ok(TIEMPOS_F10.esperaTrasSalida === Math.round(DURACIONES_MOTION.fast / 2), '…y lo que se recoloca espera media salida: *"item → exit → remaining items move"*');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El plan de una lista (apartados 2, 3 y 10-13) ──');

ok(planDeLista(null, lista('a')).motivo === 'sin_medidas' && planDeLista(lista('a'), undefined).motivo === 'sin_medidas', 'sin medidas no hay plan (la primera vez no se anima: la pantalla ya está entrando)');
{
  const p = planDeLista(lista('a', 'b'), lista('a', 'b'));
  ok(p.motivo === 'quieta' && !p.movidos.length && !p.entradas.length && !p.salidas.length, 'una lista que no cambia se queda quieta');
}
{
  /* Borrar B de A B C: B sale, C sube 50 px y A no se mueve. */
  const p = planDeLista(lista('a', 'b', 'c'), lista('a', 'c'));
  ok(p.salidas.join() === 'b' && p.entradas.length === 0, '🚨 borrar: lo que se borra SALE (apartado 11)…');
  ok(p.movidos.length === 1 && p.movidos[0].id === 'c' && p.movidos[0].dy === 50 && p.movidos[0].dx === 0, '…lo de debajo se RECOLOCA desde donde estaba (+50 px), y lo de arriba no se mueve');
}
{
  const p = planDeLista(lista('a', 'b'), lista('a', 'n', 'b'));
  ok(p.entradas.join() === 'n' && p.movidos.map((m) => m.id).join() === 'b' && p.movidos[0].dy === -50, '🚨 añadir: lo nuevo ENTRA en su sitio y lo de debajo baja (apartado 10)');
}
{
  /* El ejemplo del apartado 12: A B C D → A C D B. */
  const p = planDeLista(lista('a', 'b', 'c', 'd'), lista('a', 'c', 'd', 'b'));
  const dy = Object.fromEntries(p.movidos.map((m) => [m.id, m.dy]));
  ok(!('a' in dy) && dy.b === -100 && dy.c === 50 && dy.d === 50 && !p.entradas.length && !p.salidas.length, '🚨 reordenar A B C D → A C D B: B viaja 100 px hacia abajo y C y D suben uno; nada entra ni sale (apartado 12)');
}
{
  /* Una tarea que pasa de «Hoy» a «Hecho»: cambia de bloque. */
  const antes = { s1: fila(0), s2: fila(200), t: fila(40, 's1') };
  const ahora = { s1: fila(0), s2: fila(150), t: fila(40, 's2') };
  const p = planDeLista(antes, ahora);
  ok(p.salidas.includes('t') && p.entradas.includes('t') && !p.movidos.some((m) => m.id === 't'), '🚨 lo que cambia de bloque no viaja entre dos cajas: sale de una y entra en la otra');
  ok(p.movidos.some((m) => m.id === 's2' && m.dy === 50), '…y el bloque de debajo se recoloca');
}
{
  /* Un bloque y su fila: la fila se mide DENTRO de su bloque, así que si solo se mueve el bloque, la fila no se mueve dos veces. */
  const antes = { s: fila(100), t: fila(10, 's') };
  const ahora = { s: fila(60), t: fila(10, 's') };
  const p = planDeLista(antes, ahora);
  ok(p.movidos.map((m) => m.id).join() === 's', 'una fila dentro de un bloque que se mueve no se mueve dos veces: viaja con su bloque');
}
{
  const p = planDeLista({ a: fila(0) }, { a: { ...fila(0), y: 0.3, yr: 0.3 } });
  ok(p.motivo === 'quieta' && !p.movidos.length, `por debajo de ${PRESUPUESTO_LAYOUT.umbralPx} px no es un movimiento: es redondeo`);
}
{
  /* Lo que no se ve ni antes ni después cambia de sitio sin animarse. */
  const antes = { a: fila(0), b: fila(2000), c: fila(2050) };
  const ahora = { b: fila(1950), c: fila(2000) };
  const p = planDeLista(antes, ahora, { arriba: 0, alto: 800 });
  ok(p.salidas.join() === 'a' && p.movidos.length === 0, 'lo que está fuera de la pantalla antes y después se coloca sin animarse: nadie lo vería');
  const q = planDeLista({ z: fila(3000) }, {}, { arriba: 0, alto: 800 });
  ok(q.salidas.length === 0, '…y lo que se va fuera de la pantalla no deja copia');
}
ok(seVe(fila(100), { arriba: 0, alto: 800 }) && !seVe(fila(900), { arriba: 0, alto: 800 }) && !seVe(fila(-100), { arriba: 0, alto: 800 }) && seVe(fila(-20), { arriba: 0, alto: 800 }), '`seVe`: dentro, debajo, encima y a medias');
ok(seVe(fila(100), { arriba: 750, alto: 800 }) === false && !seVe(null), '…cuenta dónde empieza la lista, y sin medida no se ve');
{
  /* Por encima del presupuesto: la lista cambia con un fundido, sin que cada fila viaje (apartado 39). */
  const ids = Array.from({ length: 40 }, (_, i) => `f${i}`);
  const p = planDeLista(lista(...ids), lista(...ids.slice().reverse()));
  ok(p.saltar && p.motivo === 'presupuesto' && !p.movidos.length, `🚨 cuarenta filas que se mueven a la vez superan el presupuesto: un fundido de la lista entera, no cuarenta viajes (${PRESUPUESTO_LAYOUT.maxAnimados})`);
}
{
  /* Un filtro que vacía media lista: lo que se va, se va sin copia; lo que queda, se recoloca. */
  const ids = Array.from({ length: 16 }, (_, i) => `f${i}`);
  const quedan = ids.filter((_, i) => i % 2 === 0);
  const p = planDeLista(lista(...ids), lista(...quedan));
  ok(!p.saltar && p.salidas.length === 0 && p.movidos.length > 0, `un filtro que quita más de ${PRESUPUESTO_LAYOUT.maxSalidas} de golpe: sin copias, y lo que queda se recoloca (apartado 13)`);
}
{
  const conNaN = planDeLista({ a: { x: NaN, y: 0, w: 1, h: 1, padre: null, xr: 0, yr: 0 } }, { a: fila(0) });
  ok(conNaN.movidos.every((m) => Number.isFinite(m.dx) && Number.isFinite(m.dy)), 'una medida rota no da un movimiento `NaN`');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Otro diseño no se anima (apartados 16 y 35) ──');

ok(cambioDeDiseno(390, 844) && cambioDeDiseno(390, 375) && !cambioDeDiseno(390, 390) && !cambioDeDiseno(390, 390.5), '🚨 una lista que cambia de ancho (girar el iPhone, cambiar el tamaño) es otro diseño: no se anima');
ok(!cambioDeDiseno(undefined, 390) && !cambioDeDiseno(390, NaN), '…y sin las dos medidas no se decide nada');
ok(escalaDe(361, 380) === 0.95 && escalaDe(0, 380) === 1 && escalaDe(380, 0) === 1, 'una lista dentro de una hoja que entra desde 0,95 se mide dividiendo por su escala');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Las fuentes (apartado 6) ──');

const imp = fuentesDelImport(CSS);
ok(imp && imp.display === 'swap', 'las fuentes llegan de Google Fonts con `display=swap`: si llegan tarde, el texto cambia de ancho');
ok(imp && imp.fuentes.slice().sort().join() === FUENTES_DE_LA_APP.slice().sort().join(), `🚨 se esperan EXACTAMENTE los pesos que pide el \`@import\` (${FUENTES_DE_LA_APP.length}): ni uno que no se pide ni uno que se quede sin esperar`);
ok(fuentesDelImport('body {}') === null, '…y sin `@import` no se inventa una lista');
ok(TOPE_FUENTES_MS > 0 && TOPE_FUENTES_MS <= 1000, `con un tope (${TOPE_FUENTES_MS} ms): una red lenta no retiene la aplicación`);
ok(/const fuentesListas = useFuentesListas\(\);/.test(VISTAS['src/App.jsx']) && /if \(!loaded \|\| !fuentesListas\) return <LoadingScreen \/>;/.test(VISTAS['src/App.jsx']), '`App.jsx` no enseña la aplicación hasta que estén (o hasta el tope), mientras se ve la pantalla de carga');
{
  const app = sinComentarios(VISTAS['src/App.jsx']);
  const iHook = app.indexOf('useFuentesListas()');
  const iReturn = app.indexOf('if (!loaded || !fuentesListas)');
  ok(iHook > 0 && iHook < iReturn, '🚨 …y el hook va ANTES del `return` condicional (regla 4)');
}
ok(/document\.fonts\.load\(f\)\.catch\(\(\) => null\)/.test(COMP_L) && /setTimeout\(hecho, tope\)/.test(COMP_L), 'una fuente que falla no bloquea, y el tope llega siempre');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. El motor: `ListaAnimada` y `Plegable` ──');

ok(/getSnapshotBeforeUpdate\(\)\s*\{\s*return \{ medidas: medirLista\(this\.raiz\.current\), foco: focoEnLista\(this\.raiz\.current\) \};/.test(COMP_L) && /componentDidUpdate\(_props, _estado, antes\)\s*\{\s*animarLista\(this\.raiz\.current, antes && antes\.medidas\);/.test(COMP_L), '🚨 `ListaAnimada` mide JUSTO ANTES de cada cambio y justo después: nunca compara con una medida vieja (y desde la F12 apunta también dónde está el foco)');
ok(/cancelarDe\(el, 'layout'\)/.test(COMP_L) && COMP_L.indexOf("cancelarDe(el, 'layout')") < COMP_L.indexOf('const ahora = medirLista(raiz)'), '…y un cambio a mitad de otro cancela lo que estaba en marcha —solo lo de la lista (MS F11)— DESPUÉS de haber medido dónde se veía, y ANTES de medir dónde queda (apartado 44)');
ok(/if \(!raiz \|\| !antes \|\| ctx\.apagado\) return null;/.test(COMP_L), 'con «Sin movimiento» no se anima nada');
ok(/cambioDeDiseno\(antes\.ancho, ahora\.ancho\)/.test(COMP_L), 'con otro ancho, tampoco');
ok(/if \(ctx\.espacial\) \{\s*plan\.movidos\.forEach/.test(COMP_L), '🚨 en Reducido lo que se recoloca NO viaja: se coloca (apartado 40)');
ok(/ctx\.espacial\s*\?\s*\[\{ opacity: 0, transform: `translateY\(\$\{distancia\('small', ctx\)\}px\)` \}/.test(COMP_L) && /:\s*\[\{ opacity: 0 \}, \{ opacity: 1 \}\]/.test(COMP_L), '…y lo que entra se funde en su sitio, sin subir');
ok(/copia\.setAttribute\('aria-hidden', 'true'\)/.test(COMP_L) && /copia\.setAttribute\('inert', ''\)/.test(COMP_L) && /n\.removeAttribute\('id'\)/.test(COMP_L), '🚨 la copia que sale es `inert` y `aria-hidden`, y sin `id`: ni el lector de pantalla ni el foco la encuentran (apartado 41)');
ok(/data-lista-saliendo/.test(COMP_L) && /setTimeout\(quitar, ms \+ 250\)/.test(COMP_L) && /a\.oncancel = quitar/.test(COMP_L), '…y nunca se queda: se quita al acabar, al cancelarse o, si la pestaña se esconde, por reloj');
ok(/el\.closest\('\[data-lista-animada\]'\) === raiz/.test(COMP_L), 'una lista dentro de otra mide solo las suyas');
ok(/translate\(\$\{dx\}px, \$\{dy\}px\)/.test(COMP_L) && !/\b(top|left|height|width)\s*:\s*`\$\{/.test(COMP_L.replace(/Object\.assign\(copia\.style[\s\S]*?\}\);/, '')), 'se anima con `transform` y `opacity`: el orden del documento no cambia (apartado 41) y no se anima ni un `top` ni un `height`');
ok(/useState\(abierto \? 'abierto' : 'cerrado'\)/.test(COMP_L) && /if \(estado === 'cerrado'\) return null;/.test(COMP_L), '🚨 `Plegable`: abierto al nacer no se anima, y cerrado no está en la página');
ok(/\(ctx\.apagado \|\| !ctx\.espacial\) \? 'cerrado' : 'cerrando'/.test(COMP_L), '…en Reducido (o sin movimiento) se cierra de una vez: no hay nada que esperar');
ok(/dentro\.setAttribute\('inert', ''\)/.test(COMP_L) && !/\sinert=\{/.test(COMP_L), '…mientras se cierra, lo de dentro es `inert`, puesto por el DOM (React 18 no conoce la prop: avisaría en la consola)');
ok(/setTimeout\(terminar, duracionMs\('normal', ctx\) \+ 80\)/.test(COMP_L) && /propertyName === 'grid-template-rows'/.test(COMP_L), '…y termina con su transición o, si no llega (pestaña oculta), por reloj');
ok(/typeof children === 'function' \? children\(\) : children/.test(COMP_L), '…y lo de dentro puede ir como función: cerrado no se calcula, como hacía `{x && …}`');
ok(/className=\{`despliegue-entra \$\{className\}`\.trim\(\)\}/.test(COMP_L), '…y lo de dentro sigue entrando con `despliegue-entra` (F3)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. El CSS ──');

ok(/\.plegable\s*\{\s*display:\s*grid;\s*transition:\s*grid-template-rows var\(--motion-dur-normal\) var\(--ease-premium\);/.test(CSS_LIMPIO), '`.plegable` cambia de altura con `grid-template-rows`, en `normal` y con la curva de siempre (ni una altura escrita a mano)');
ok(/\.plegable > \.plegable-dentro\s*\{\s*min-height:\s*0;\s*overflow:\s*hidden;/.test(CSS_LIMPIO), '🚨 …con `min-height: 0`: sin él, Safari no encoge la fila (SC F1)');
ok(/\.plegable\[data-plegable='abierto'\] > \.plegable-dentro\s*\{\s*overflow:\s*visible;/.test(CSS_LIMPIO), '…y quieto no recorta: un halo de foco no se corta');
ok(/html\[data-motion='reducido'\] \.plegable\s*\{\s*transition-property:\s*none;/.test(CSS_LIMPIO) && /@media \(prefers-reduced-motion: reduce\)\s*\{\s*html:not\(\[data-motion='off'\]\) \.plegable\s*\{\s*transition-property:\s*none;/.test(CSS_LIMPIO), '🚨 en Reducido —el de Ajustes y el del iPhone— la altura cambia sin animarse');
ok(/\.lista-animada\s*\{\s*position:\s*relative;/.test(CSS_LIMPIO), '`.lista-animada` es la caja de referencia de las copias que salen');
{
  const audM = auditarMotion({ css: CSS, vistas: {} });
  ok(audM.sinMapa.length === 0 && audM.keyframesHuerfanos.length === 0 && audM.mapaSinCss.length === 0 && audM.curvasAjenas.length === 0, 'la auditoría de la F0 sigue limpia: `.plegable` está en el mapa, con la curva y los tokens de siempre');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Dónde está cableado ──');

CONEXIONES_F10.forEach((c) => {
  const src = (VISTAS[c.archivo] || leer(c.archivo));
  const limpio = sinComentarios(src);
  ok(limpio.includes(c.trozo) && (!c.fila || src.includes(c.fila)), `${c.donde}: ${c.trozo}${c.fila ? ` y ${c.fila}` : ''}`);
  if (c.trozo === '<ListaAnimada') ok(/import \{[^}]*\bListaAnimada\b[^}]*\} from '\.\.\/components\/layoutMotion'|import \{[^}]*\bListaAnimada\b[^}]*\} from '\.\/layoutMotion'/.test(src), `…y la importa (${c.archivo})`);
});
{
  /* Un id es una ranura estable; el índice cambia al borrar la de arriba y haría viajar a la que no es. */
  const conIndice = Object.entries(VISTAS).flatMap(([archivo, src]) => [...sinComentarios(src).matchAll(/data-flip-id=\{[^}]*(?:\|\|\s*i\b|\$\{i\}|\$\{idx\}|\$\{index\})/g)].map(() => archivo));
  ok(conIndice.length === 0, `🚨 ninguna fila lleva el ÍNDICE como \`data-flip-id\`: con él, borrar la de arriba haría viajar a la que no es${conIndice.length ? ` — ${conIndice.join(', ')}` : ''}`);
  ok(/data-flip-id=\{e\.id \? `a-\$\{e\.id\}` : undefined\}/.test(VISTAS['src/views/CalendarView.jsx']), '…y en la agenda, un elemento sin id no se anima en vez de llevar su posición');
}
{
  const usos = Object.values(VISTAS).reduce((n, src) => n + (src.match(/<Plegable abierto=/g) || []).length, 0);
  ok(usos >= 20, `🚨 los desplegables usan \`Plegable\` (${usos}): al cerrar, lo de debajo sube con la altura en vez de saltar (C-54)`);
  const imp2 = Object.entries(VISTAS).filter(([, s]) => /<Plegable abierto=/.test(s) && !/\/layoutMotion\.jsx$/.test('x')).filter(([a, s]) => a !== 'src/components/layoutMotion.jsx' && !/import \{[^}]*\bPlegable\b[^}]*\} from '(?:\.\.\/components|\.)\/layoutMotion'/.test(s)).map(([a]) => a);
  ok(imp2.length === 0, `…y cada archivo que lo usa lo importa${imp2.length ? ` — falta en ${imp2.join(', ')}` : ''}`);
}
ok(/\{ modulo: 'layoutMotion', solo: \['ListaAnimada', 'Plegable'\]/.test(leer('src/lib/arquitecturaFitness.js')), 'Fitness solo toma de aquí `ListaAnimada` y `Plegable` (FIT F44), y ningún motor lo importa');
ok(!/from '\.\/layoutMotion'|from '\.\.\/components\/layoutMotion'/.test(sinComentarios(leer('src/lib/motion.js'))) && !/from ['"]react['"]/.test(leer('src/lib/layoutMotion.js')) && !/document\./.test(sinComentarios(leer('src/lib/layoutMotion.js')).replace(/`[^`]*`/g, '')), 'la librería no toca el DOM ni React: recibe medidas y devuelve un plan (se prueba en Node)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Lo que no puede volver (apartado 45) ──');

const aud = auditarLayout({ vistas: VISTAS });
ok(aud.cuentas.desplegable_que_salta === 0, `🚨 ningún desplegable se monta y se desmonta de golpe (\`{x && <div className="despliegue-entra…">}\`)${aud.cuentas.desplegable_que_salta ? ` — ${aud.hallazgos.filter((h) => h.tipo === 'desplegable_que_salta').map((h) => `${h.archivo}:${h.linea}`).join(', ')}` : ''}`);
ok(aud.cuentas.imagen_sin_hueco === 0, `🚨 ninguna imagen sin su hueco reservado: al cargar no empuja nada (apartado 5)${aud.cuentas.imagen_sin_hueco ? ` — ${aud.hallazgos.filter((h) => h.tipo === 'imagen_sin_hueco').map((h) => `${h.archivo}:${h.linea}`).join(', ')}` : ''}`);
{
  const malo = auditarLayout({ vistas: { 'm.jsx': 'const a = 1;\n{abierto && <div className="despliegue-entra mt-2">x</div>}\n<img src={u} alt="" />' } });
  ok(malo.cuentas.desplegable_que_salta === 1 && malo.cuentas.imagen_sin_hueco === 1 && malo.hallazgos.find((h) => h.tipo === 'desplegable_que_salta').linea === 2 && malo.hallazgos.find((h) => h.tipo === 'imagen_sin_hueco').linea === 3, 'la auditoría CAZA los dos con su línea (una auditoría que no puede fallar no sirve, EH F42)');
  const bueno = auditarLayout({ vistas: {
    'b.jsx': '/* nunca {x && <div className="despliegue-entra">} */\n<img src={u} className="w-10 h-10" alt="" />\n<img src={u} className="w-full aspect-video" alt="" />\n<img src={u} width={40} height={40} alt="" onError={() => { if (a > b) c(); }} />\n<img src={u} style={{ width: 40, height: 40 }} alt="" />',
    'c.css': '<img src={u} />',
  } });
  ok(bueno.hallazgos.length === 0, '…y no confunde el comentario que lo prohíbe, ni una imagen con alto, proporción, `width`/`height` o alto en su estilo (también con un `>` dentro de un manejador), ni un archivo que no es una vista');
}
ok(imagenesSinHueco('x.jsx', "const lado = grande ? 'w-16 h-16' : 'w-10 h-10';\n<img src={u} className={`${lado} rounded-xl`} />").length === 0 && imagenesSinHueco('x.jsx', "const borde = 'rounded-xl';\n<img src={u} className={`${borde} w-full`} />").length === 1, 'un tamaño que llega en una constante del mismo archivo cuenta; una constante sin tamaño, no');
ok(imagenesSinHueco('src/components/estadosFitness.jsx', '<img src={u} className={className} />').length === 0 && IMAGENES_CON_TAMANO_DE_FUERA.every((x) => x.archivo && x.porque), 'las imágenes que reciben su tamaño de quien las llama se declaran, con su motivo');
ok(/<img src=\{tutorial\.src\}[^>]*aspect-video/.test(leer('src/components/bibliotecaEjercicios.jsx')), '🐛 el tutorial de un ejercicio reserva su 16:9: medía 0 hasta cargar');
ok(PATRONES_F10.every((p) => p.id && p.que), 'cada patrón dice qué usar en su lugar');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. El inventario, la auditoría y lo que no se hace ──');

ok(INVENTARIO_F10.length >= 10 && INVENTARIO_F10.every((i) => i.que && i.antes && i.queda), `el inventario del apartado 1: ${INVENTARIO_F10.length} cosas que cambian de tamaño o de sitio, qué hacían y qué hacen`);
ok(AUDITORIA_F10.length >= 10 && AUDITORIA_F10.every((a) => a.apartados.length && a.que && a.queda), 'la auditoría de lo que pide el enunciado');
ok(NO_EN_F10.length >= 5 && NO_EN_F10.every((n) => n.que && n.porque), 'lo que no se construye, con su motivo');
ok(NO_EN_F10.some((n) => /C-61/.test(n.porque) && /ToggleTab/.test(n.porque)) && NO_EN_F10.some((n) => /F16/.test(n.porque)), '…el indicador de las pestañas de dentro (C-61) y los estados del sistema (F16)');
ok(CUANDO_F10.length >= 3 && CUANDO_F10.every((c) => c.patron && c.cuando), 'cuándo usar cada pieza');

const mapa = (id) => MOTION_MAP.find((e) => e.id === id);
ok(mapa('plegable')?.clase === 'plegable' && mapa('plegable')?.fase === 10, 'el MOTION_MAP tiene `Plegable`');
ok(mapa('borrar_elemento')?.componente === 'ListaAnimada' && mapa('reordenar')?.componente === 'ListaAnimada', '…y borrar y reordenar ya no están «sin movimiento»');
ok(HALLAZGOS_F0.find((h) => h.id === 'listas_que_saltan')?.resuelto === 10, '🔓 el hallazgo `listas_que_saltan` de la F0 queda resuelto por la F10');
ok(leer('docs/MOTION_MAP.md').includes('Lo que se abre y se cierra en su sitio (Plegable)'), '`docs/MOTION_MAP.md` está regenerado con lo de la F10');

console.log('\n── 10. La documentación ──');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/ListaAnimada/.test(SIS) && /Plegable/.test(SIS) && /data-flip-id/.test(SIS), 'MOTION_SYSTEM.md tiene las reglas de la F10');
ok(/\*\*F10\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F10');
ok(/C-61/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-61 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
